import { prisma } from "@/lib/prisma";
import { genCode, jsonError } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  const tradeIns = await prisma.tradeIn.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      ...(status ? { status: status as any } : {}),
    },
    include: { customer: true, employee: true, resultInventoryItem: true },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(tradeIns);
}

// POST /api/trade-in — ບັນທຶກການປະເມີນ + KYC
// body: { branchId, customerId, employeeId, deviceDescription, imeiInput?, batteryHealth?,
//         screenCondition?, bodyCondition?, accessoriesIncluded?, conditionImages?,
//         idCardImageFront, idCardImageBack?, customerPhoto, offeredPrice }
export async function POST(req: Request) {
  const body = await req.json();
  const required = [
    "branchId",
    "customerId",
    "employeeId",
    "deviceDescription",
    "idCardImageFront",
    "customerPhoto",
    "offeredPrice",
  ];
  for (const f of required) {
    if (!body[f]) return jsonError(`${f} ຈຳເປັນ (ຮວມທັງຮູບ KYC ເພື່ອປ້ອງກັນເຄື່ອງຫຼັກ)`);
  }

  const tradeIn = await prisma.tradeIn.create({
    data: {
      tradeInNo: genCode("TI"),
      branchId: body.branchId,
      customerId: body.customerId,
      employeeId: body.employeeId,
      deviceDescription: body.deviceDescription,
      imeiInput: body.imeiInput ?? null,
      batteryHealth: body.batteryHealth ?? null,
      screenCondition: body.screenCondition ?? null,
      bodyCondition: body.bodyCondition ?? null,
      accessoriesIncluded: body.accessoriesIncluded ?? [],
      conditionImages: body.conditionImages ?? [],
      idCardImageFront: body.idCardImageFront,
      idCardImageBack: body.idCardImageBack ?? null,
      customerPhoto: body.customerPhoto,
      offeredPrice: body.offeredPrice,
      status: "EVALUATED",
    },
  });

  return Response.json(tradeIn, { status: 201 });
}
