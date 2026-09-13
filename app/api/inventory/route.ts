import { prisma } from "@/lib/prisma";
import { genCode, jsonError } from "@/lib/utils";

// GET /api/inventory?branchId=...&status=IN_STOCK&imei=...&productId=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");
  const status = searchParams.get("status") ?? undefined;
  const imei = searchParams.get("imei") ?? undefined;
  const productId = searchParams.get("productId") ?? undefined;

  const whereClause: any = {};

  if (branchId && branchId !== "ALL") {
    whereClause.currentBranchId = branchId;
  }

  if (status) {
    whereClause.status = status as any;
  }

  if (productId) {
    whereClause.productId = productId;
  }

  if (imei) {
    whereClause.OR = [
      { imei1: { contains: imei, mode: "insensitive" } },
      { imei2: { contains: imei, mode: "insensitive" } },
    ];
  }

  const items = await prisma.inventoryItem.findMany({
    where: whereClause,
    include: {
      product: { include: { brand: true, category: true } },
      currentBranch: true,
      warranty: true,
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return Response.json(items);
}

// POST /api/inventory — ຮັບເຄື່ອງເຂົ້າສາງ (ຮອງຮັບທັງ IMEI ແລະ QUANTITY)
export async function POST(req: Request) {
  const body = await req.json();
  const { branchId, productId, employeeId, imeis, quantity } = body;

  if (!branchId || !productId || !employeeId) {
    return jsonError("branchId, productId, employeeId ຈຳເປັນຕ້ອງໃສ່");
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return jsonError("ບໍ່ພົບສິນຄ້ານີ້", 404);

  const isSerialized = product.trackingType === "SERIALIZED";

  // 🟢 Validation ແຍກຕາມປະເພດ trackingType
  if (isSerialized) {
    if (!Array.isArray(imeis) || imeis.length === 0) {
      return jsonError("ສິນຄ້າປະເພດ IMEI ຈຳເປັນຕ້ອງສົ່ງ imeis[] ຢ່າງໜ້ອຍ 1 ໂຕ");
    }
  } else {
    if (!quantity || Number(quantity) <= 0) {
      return jsonError("ກະລຸນາໃສ່ຈຳນວນ quantity ໃຫ້ຖືກຕ້ອງ");
    }
  }

  const costPrice = body.costPrice ?? product.costPrice;

  const result = await prisma.$transaction(async (tx: any) => {
    const po = await tx.purchaseOrder.create({
      data: {
        poNumber: genCode("PO"),
        branchId,
        employeeId,
        status: "RECEIVED",
        receivedAt: new Date(),
      },
    });

    const createdItems = [];

    // 🟢 1. ករណីເປັນສິນຄ້າ IMEI (SERIALIZED)
    if (isSerialized) {
      for (const imei of imeis) {
        const poItem = await tx.purchaseOrderItem.create({
          data: {
            purchaseOrderId: po.id,
            productId,
            quantity: 1,
            costPrice,
          },
        });

        const item = await tx.inventoryItem.create({
          data: {
            imei1: imei.imei1,
            imei2: imei.imei2 ?? null,
            productId,
            currentBranchId: branchId,
            status: "IN_STOCK",
            condition: "NEW",
            costPrice,
            sourceType: "PURCHASE",
            purchaseOrderItemId: poItem.id,
          },
        });

        await tx.imeiHistory.create({
          data: {
            inventoryItemId: item.id,
            eventType: "PURCHASE_IN",
            toBranchId: branchId,
            refType: "PurchaseOrder",
            refId: po.id,
            actorId: employeeId,
            note: `ຮັບເຂົ້າສາງຈາກ PO ${po.poNumber}`,
          },
        });

        createdItems.push(item);
      }
    } 
    // 🟢 2. ករណີເປັນສິນຄ້າ ນັບຈຳນວນ (QUANTITY) ເຊັ່ນ ສາຍສາກ / ເຄສ
    else {
      const qty = Number(quantity);

      for (let i = 0; i < qty; i++) {
        // ສ້າງ purchaseOrderItem 1 ອັນ ຕໍ່ 1 inventoryItem ເພື່ອບໍ່ໃຫ້ຊ້ຳ 1-to-1 unique constraint
        const poItem = await tx.purchaseOrderItem.create({
          data: {
            purchaseOrderId: po.id,
            productId,
            quantity: 1,
            costPrice,
          },
        });

        const item = await tx.inventoryItem.create({
          data: {
            imei1: `QTY-${genCode("ITEM")}`,
            productId,
            currentBranchId: branchId,
            status: "IN_STOCK",
            condition: "NEW",
            costPrice,
            sourceType: "PURCHASE",
            purchaseOrderItemId: poItem.id,
          },
        });
        createdItems.push(item);
      }
    }

    return { po, createdItems };
  });

  return Response.json(result, { status: 201 });
}