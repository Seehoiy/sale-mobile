import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/utils";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// PATCH /api/claims/:id
// body: { status: "SENT_TO_CENTER" | "REPAIRED_RETURNED" | "SWAPPED" | "RETURNED_TO_CUSTOMER" | "REJECTED",
//         swappedNewItemId? }  // ຈຳເປັນຖ້າ status = SWAPPED
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const claim = await prisma.claimRequest.findUnique({ where: { id: params.id } });
  if (!claim) return jsonError("ບໍ່ພົບລາຍການເຄລມນີ້", 404);

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      if (body.status === "SWAPPED") {
        if (!body.swappedNewItemId) throw new Error("swappedNewItemId ຈຳເປັນສຳລັບການ swap IMEI");

        const newItem = await tx.inventoryItem.findUnique({ where: { id: body.swappedNewItemId } });
        if (!newItem || newItem.status !== "IN_STOCK")
          throw new Error("ເຄື່ອງທົດແທນບໍ່ພ້ອມ (ຕ້ອງເປັນ IN_STOCK)");

        await tx.inventoryItem.update({
          where: { id: body.swappedNewItemId },
          data: { status: "SOLD" }, // ອອກໄປແທນເຄື່ອງເກົ່າຂອງລູກຄ້າ
        });
        await tx.inventoryItem.update({
          where: { id: claim.inventoryItemId },
          data: { status: "DAMAGED" }, // ເຄື່ອງເກົ່າຖືກສົ່ງຄືນສູນ/ຕັດອອກ
        });
        await tx.imeiHistory.create({
          data: {
            inventoryItemId: claim.inventoryItemId,
            eventType: "CLAIM_SWAPPED",
            refType: "ClaimRequest",
            refId: claim.id,
            note: `Swap ໄປຫາ IMEI ໃໝ່: ${body.swappedNewItemId}`,
          },
        });
      }

      if (body.status === "RETURNED_TO_CUSTOMER" || body.status === "REPAIRED_RETURNED") {
        await tx.imeiHistory.create({
          data: {
            inventoryItemId: claim.inventoryItemId,
            eventType: "CLAIM_RETURNED",
            refType: "ClaimRequest",
            refId: claim.id,
            note: "ສົ່ງເຄື່ອງຄືນໃຫ້ລູກຄ້າ",
          },
        });
      }

      return tx.claimRequest.update({
        where: { id: claim.id },
        data: {
          status: body.status,
          swappedNewItemId: body.status === "SWAPPED" ? body.swappedNewItemId : undefined,
          sentAt: body.status === "SENT_TO_CENTER" ? new Date() : undefined,
          resolvedAt: ["SWAPPED", "REPAIRED_RETURNED", "RETURNED_TO_CUSTOMER", "REJECTED"].includes(
            body.status
          )
            ? new Date()
            : undefined,
        },
      });
    });

    return Response.json(result);
  } catch (err: any) {
    return jsonError(err.message ?? "ອັບເດດການເຄລມບໍ່ສຳເລັດ", 400);
  }
}
