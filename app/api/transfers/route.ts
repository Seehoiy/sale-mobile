import { prisma } from "@/lib/prisma";
import { genCode, jsonError } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId") ?? undefined;

  const transfers = await prisma.stockTransfer.findMany({
    where: branchId
      ? { OR: [{ fromBranchId: branchId }, { toBranchId: branchId }] }
      : undefined,
    include: {
      fromBranch: true,
      toBranch: true,
      items: { include: { inventoryItem: true, product: true } },
    },
    orderBy: { requestedAt: "desc" },
  });
  return Response.json(transfers);
}

// POST /api/transfers — ຂໍໂອນຍ້າຍສາຂາ
// body: { fromBranchId, toBranchId, items: [{ inventoryItemId? , productId?, quantity? }] }
export async function POST(req: Request) {
  const body = await req.json();
  const { fromBranchId, toBranchId, items } = body;
  if (!fromBranchId || !toBranchId || !Array.isArray(items) || items.length === 0) {
    return jsonError("fromBranchId, toBranchId, items[] ຈຳເປັນ");
  }
  if (fromBranchId === toBranchId) return jsonError("ສາຂາຕົ້ນທາງ ແລະ ປາຍທາງຊ້ຳກັນ");

  const result = await prisma.$transaction(async (tx: any) => {
    const transfer = await tx.stockTransfer.create({
      data: {
        transferNo: genCode("TRF"),
        fromBranchId,
        toBranchId,
        status: "PENDING",
      },
    });

    for (const line of items) {
      if (line.inventoryItemId) {
        const invItem = await tx.inventoryItem.findUnique({ where: { id: line.inventoryItemId } });
        if (!invItem) throw new Error(`ບໍ່ພົບ IMEI: ${line.inventoryItemId}`);
        if (invItem.status !== "IN_STOCK") throw new Error(`IMEI ${invItem.imei1} ບໍ່ພ້ອມໂອນ`);
        if (invItem.currentBranchId !== fromBranchId)
          throw new Error(`IMEI ${invItem.imei1} ບໍ່ໄດ້ຢູ່ສາຂາຕົ້ນທາງ`);

        await tx.stockTransferItem.create({
          data: { transferId: transfer.id, inventoryItemId: line.inventoryItemId },
        });
        await tx.inventoryItem.update({
          where: { id: line.inventoryItemId },
          data: { status: "TRANSFER_OUT" },
        });
        await tx.imeiHistory.create({
          data: {
            inventoryItemId: line.inventoryItemId,
            eventType: "TRANSFER_OUT",
            fromBranchId,
            toBranchId,
            refType: "StockTransfer",
            refId: transfer.id,
            note: `ໂອນອອກຕາມໃບໂອນ ${transfer.transferNo}`,
          },
        });
      } else if (line.productId && line.quantity) {
        await tx.stockTransferItem.create({
          data: { transferId: transfer.id, productId: line.productId, quantity: line.quantity },
        });
        await tx.branchStock.updateMany({
          where: { branchId: fromBranchId, productId: line.productId },
          data: { quantity: { decrement: line.quantity } },
        });
      }
    }

    return tx.stockTransfer.update({
      where: { id: transfer.id },
      data: { status: "IN_TRANSIT" },
      include: { items: true },
    });
  });

  return Response.json(result, { status: 201 });
}
