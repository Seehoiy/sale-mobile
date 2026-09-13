import { prisma } from "@/lib/prisma";
import { genCode, jsonError } from "@/lib/utils";

// GET /api/sales?branchId=...&startDate=...&endDate=...&query=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId") ?? undefined;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const query = searchParams.get("query")?.trim() ?? "";

  const whereClause: any = {};

  if (branchId) {
    whereClause.branchId = branchId;
  }

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) {
      const dStart = new Date(startDate);
      dStart.setHours(0, 0, 0, 0);
      whereClause.createdAt.gte = dStart;
    }
    if (endDate) {
      const dEnd = new Date(endDate);
      dEnd.setHours(23, 59, 59, 999);
      whereClause.createdAt.lte = dEnd;
    }
  }

  if (query) {
    whereClause.OR = [
      { invoiceNo: { contains: query, mode: "insensitive" } },
      { employee: { fullName: { contains: query, mode: "insensitive" } } },
      { employee: { empCode: { contains: query, mode: "insensitive" } } },
      { customer: { fullName: { contains: query, mode: "insensitive" } } },
      { items: { some: { product: { name: { contains: query, mode: "insensitive" } } } } },
      { items: { some: { inventoryItem: { imei1: { contains: query, mode: "insensitive" } } } } },
    ];
  }

  const sales = await prisma.sale.findMany({
    where: whereClause,
    include: {
      items: {
        include: {
          product: true,
          inventoryItem: {
            include: { warranty: true },
          },
        },
      },
      payments: true,
      customer: true,
      employee: {
        select: {
          id: true,
          empCode: true,
          fullName: true,
          role: true,
        },
      },
      branch: {
        select: { id: true, name: true, code: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return Response.json(sales);
}

// POST /api/sales — ອອກບິນ POS
// body: {
//   branchId, employeeId, sellerName?, sellerCode?, customerId?,
//   items: [{ productId, inventoryItemId?, quantity?, unitPrice, discount?, warrantyMonths? }],
//   discount?, tradeInId?, tradeInOffset?, vatPercent?,
//   payments: [{ method, amount, refNo? }],
//   warrantyMonths?
// }
export async function POST(req: Request) {
  const body = await req.json();
  const { branchId, employeeId, customerId, items, payments } = body;

  if (!branchId || !employeeId || !Array.isArray(items) || items.length === 0) {
    return jsonError("branchId, employeeId, items[] ຈຳເປັນ");
  }
  if (!Array.isArray(payments) || payments.length === 0) {
    return jsonError("payments[] ຈຳເປັນ ຢ່າງໜ້ອຍ 1 ລາຍການ");
  }

  const discount = Number(body.discount ?? 0);
  const tradeInOffset = Number(body.tradeInOffset ?? 0);
  const vatPercent = Number(body.vatPercent ?? 0);
  const globalWarrantyMonths = body.warrantyMonths ? Number(body.warrantyMonths) : 12;

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      // 1) ກວດສອບ IMEI ທຸກລາຍການ
      for (const line of items) {
        if (line.inventoryItemId) {
          const invItem = await tx.inventoryItem.findUnique({
            where: { id: line.inventoryItemId },
          });
          if (!invItem) throw new Error(`ບໍ່ພົບເຄື່ອງ IMEI: ${line.inventoryItemId}`);
          if (invItem.status !== "IN_STOCK")
            throw new Error(`ເຄື່ອງ IMEI ${invItem.imei1} ບໍ່ພ້ອມຂາຍ (ສະຖານະ: ${invItem.status})`);
          if (invItem.currentBranchId !== branchId)
            throw new Error(`ເຄື່ອງ IMEI ${invItem.imei1} ບໍ່ໄດ້ຢູ່ສາຂານີ້`);
        }
      }

      // 2) ຄິດໄລ່ຍອດ
      const subtotal = items.reduce(
        (sum: number, l: any) => sum + Number(l.unitPrice) * Number(l.quantity ?? 1) - Number(l.discount ?? 0),
        0
      );
      const beforeVat = subtotal - discount - tradeInOffset;
      if (beforeVat < 0) throw new Error("ຍອດລວມຫຼັງຫັກສ່ວນຫຼຸດ ຕິດລົບ — ກະລຸນາກວດສອບ");
      const vatAmount = (beforeVat * vatPercent) / 100;
      const total = beforeVat + vatAmount;

      const paidTotal = payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
      if (Math.round(paidTotal) !== Math.round(total))
        throw new Error(`ຍອດຊຳລະ (${paidTotal}) ບໍ່ຕົງກັບຍອດລວມ (${total})`);

      // 3) ສ້າງໃບບິນ (Bill No & Invoice No)
      const invCode = genCode("INV");
      const billCode = genCode("BILL");

      const sale = await tx.sale.create({
        data: {
          invoiceNo: invCode,
          billNo: billCode,
          totalAmout: total,
          branchId,
          customerId: customerId ?? null,
          employeeId,
          subtotal,
          discount,
          tradeInOffset,
          total,
          items: {
            create: items.map((l: any) => ({
              productId: l.productId,
              inventoryItemId: l.inventoryItemId ?? null,
              quantity: l.quantity ?? 1,
              unitPrice: l.unitPrice,
              discount: l.discount ?? 0,
            })),
          },
          payments: {
            create: payments.map((p: any) => ({
              method: p.method,
              amount: p.amount,
              refNo: p.refNo ?? null,
            })),
          },
        },
        include: {
          items: { include: { product: true, inventoryItem: true } },
          payments: true,
          employee: { select: { id: true, empCode: true, fullName: true } },
          branch: { select: { id: true, name: true, code: true } },
        },
      });

      // 4) ຕັດສະຕັອກ IMEI & ສ້າງ Warranty
      for (const line of items) {
        const itemWarranty = line.warrantyMonths !== undefined ? Number(line.warrantyMonths) : globalWarrantyMonths;

        if (line.inventoryItemId) {
          await tx.inventoryItem.update({
            where: { id: line.inventoryItemId },
            data: { status: "SOLD" },
          });

          await tx.imeiHistory.create({
            data: {
              inventoryItemId: line.inventoryItemId,
              eventType: "SALE",
              fromBranchId: branchId,
              refType: "Sale",
              refId: sale.id,
              actorId: employeeId,
              note: `ຂາຍອອກໃນໃບບິນ ${sale.invoiceNo} ໂດຍຜູ້ຂາຍ ${sale.employee?.fullName} (${sale.employee?.empCode})`,
            },
          });

          if (itemWarranty > 0) {
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + itemWarranty);
            await tx.warranty.create({
              data: {
                inventoryItemId: line.inventoryItemId,
                type: "STORE",
                startDate,
                endDate,
                durationMonths: itemWarranty,
              },
            });
          }
        } else if (line.productId) {
          // ຕັດ BranchStock
          await tx.branchStock.updateMany({
            where: { branchId, productId: line.productId },
            data: { quantity: { decrement: line.quantity ?? 1 } },
          });
        }
      }

      if (body.tradeInId) {
        await tx.tradeIn.update({
          where: { id: body.tradeInId },
          data: { appliedSaleId: sale.id },
        });
      }

      return sale;
    });

    return Response.json(result, { status: 201 });
  } catch (err: any) {
    return jsonError(err.message ?? "ບໍ່ສາມາດອອກໃບບິນໄດ້", 400);
  }
}
