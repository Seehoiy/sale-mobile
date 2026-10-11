import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/transfers/:id/receive — ສາຂາປາຍທາງຢືນຢັນຮັບເຄື່ອງ
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const transfer = await prisma.stockTransfer.findUnique({
    where: { id: params.id },
    include: { items: true },
  });
  if (!transfer) return jsonError("ບໍ່ພົບໃບໂອນນີ້", 404);
  if (transfer.status === "RECEIVED") return jsonError("ໃບໂອນນີ້ຮັບແລ້ວ");

  const result = await prisma.$transaction(async (tx: any) => {
    for (const line of transfer.items) {
      if (line.inventoryItemId) {
        await tx.inventoryItem.update({
          where: { id: line.inventoryItemId },
          data: { currentBranchId: transfer.toBranchId, status: "IN_STOCK" },
        });
        await tx.imeiHistory.create({
          data: {
            inventoryItemId: line.inventoryItemId,
            eventType: "TRANSFER_IN",
            fromBranchId: transfer.fromBranchId,
            toBranchId: transfer.toBranchId,
            refType: "StockTransfer",
            refId: transfer.id,
            note: `ຮັບເຂົ້າຕາມໃບໂອນ ${transfer.transferNo}`,
          },
        });
      } else if (line.productId && line.quantity) {
        await tx.branchStock.upsert({
          where: { branchId_productId: { branchId: transfer.toBranchId, productId: line.productId } },
          update: { quantity: { increment: line.quantity } },
          create: { branchId: transfer.toBranchId, productId: line.productId, quantity: line.quantity },
        });
      }
    }

    return tx.stockTransfer.update({
      where: { id: transfer.id },
      data: { status: "RECEIVED", receivedAt: new Date() },
    });
  });

  return Response.json(result);
}
