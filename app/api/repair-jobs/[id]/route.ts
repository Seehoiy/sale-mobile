import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/utils";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// PATCH /api/repair-jobs/:id
// body: { status?, technicianId?, finalCost?, addParts?: [{ productId, branchId, quantity, cost }] }
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const job = await prisma.repairJob.findUnique({ where: { id: params.id } });
  if (!job) return jsonError("ບໍ່ພົບໃບຊ່ອມນີ້", 404);

  try {
  const result = await prisma.$transaction(async (tx: any) => {
    // ເບີກອາໄຫຼ່ຈາກສະຕັອກ POS
    if (Array.isArray(body.addParts)) {
      for (const part of body.addParts) {
        const stock = await tx.branchStock.findUnique({
          where: { branchId_productId: { branchId: job.branchId, productId: part.productId } },
        });
        if (!stock || stock.quantity < part.quantity) {
          throw new Error(`ອາໄຫຼ່ບໍ່ພຽງພໍໃນສາງ (productId: ${part.productId})`);
        }
        await tx.branchStock.update({
          where: { branchId_productId: { branchId: job.branchId, productId: part.productId } },
          data: { quantity: { decrement: part.quantity } },
        });
        await tx.repairJobPart.create({
          data: {
            repairJobId: job.id,
            productId: part.productId,
            quantity: part.quantity,
            cost: part.cost,
          },
        });
      }
    }

    const updated = await tx.repairJob.update({
      where: { id: job.id },
      data: {
        status: body.status ?? undefined,
        technicianId: body.technicianId ?? undefined,
        finalCost: body.finalCost ?? undefined,
        deliveredAt: body.status === "DELIVERED" ? new Date() : undefined,
      },
    });

    if (job.inventoryItemId && body.status === "DONE") {
      await tx.imeiHistory.create({
        data: {
          inventoryItemId: job.inventoryItemId,
          eventType: "REPAIR_OUT",
          refType: "RepairJob",
          refId: job.id,
          note: "ສ້ອມແປງແລ້ວສະດວກ",
        },
      });
      // ຄືນສະຖານະເປັນ IN_STOCK ຖ້າເຄື່ອງນີ້ແມ່ນສະຕັອກຮ້ານ (ຍັງບໍ່ໄດ້ຂາຍ)
      const invItem = await tx.inventoryItem.findUnique({ where: { id: job.inventoryItemId } });
      if (invItem && invItem.status === "IN_REPAIR") {
        await tx.inventoryItem.update({
          where: { id: job.inventoryItemId },
          data: { status: "IN_STOCK" },
        });
      }
    }

    return updated;
  });

  return Response.json(result);
  } catch (err: any) {
    return jsonError(err.message ?? "ອັບເດດໃບຊ່ອມບໍ່ສຳເລັດ", 400);
  }
}
