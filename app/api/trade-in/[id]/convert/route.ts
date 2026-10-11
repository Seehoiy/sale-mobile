import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/trade-in/:id/convert
// body: { productId, imei1, imei2?, condition, employeeId }
// ເຄື່ອງເກົ່າທີ່ຮັບເທິນມາ ຈະຖືກບັນທຶກເຂົ້າສະຕັອກ "second-hand" ຂອງສາຂານັ້ນອັດໂນມັດ
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { productId, imei1, employeeId } = body;
  if (!productId || !imei1 || !employeeId) {
    return jsonError("productId, imei1, employeeId ຈຳເປັນ");
  }

  const tradeIn = await prisma.tradeIn.findUnique({ where: { id: params.id } });
  if (!tradeIn) return jsonError("ບໍ່ພົບລາຍການຮັບເທິນນີ້", 404);
  if (tradeIn.status === "CONVERTED_TO_STOCK")
    return jsonError("ລາຍການນີ້ຖືກແປງເປັນສະຕັອກແລ້ວ");

  const result = await prisma.$transaction(async (tx: any) => {
    const item = await tx.inventoryItem.create({
      data: {
        imei1,
        imei2: body.imei2 ?? null,
        productId,
        currentBranchId: tradeIn.branchId,
        status: "SECOND_HAND",
        condition: body.condition ?? "USED_GOOD",
        costPrice: tradeIn.offeredPrice, // ຕົ້ນທຶນ = ລາຄາທີ່ຈ່າຍໃຫ້ລູກຄ້າ
        sourceType: "TRADE_IN",
        tradeInId: tradeIn.id,
      },
    });

    await tx.imeiHistory.create({
      data: {
        inventoryItemId: item.id,
        eventType: "TRADE_IN_RECEIVED",
        toBranchId: tradeIn.branchId,
        refType: "TradeIn",
        refId: tradeIn.id,
        actorId: employeeId,
        note: `ຮັບເຂົ້າສະຕັອກມືສອງຈາກ Trade-in ${tradeIn.tradeInNo}`,
      },
    });

    await tx.tradeIn.update({
      where: { id: tradeIn.id },
      data: { status: "CONVERTED_TO_STOCK" },
    });

    return item;
  });

  return Response.json(result, { status: 201 });
}
