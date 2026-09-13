import { prisma } from "@/lib/prisma";
import { genCode, jsonError } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId") ?? undefined;

  const claims = await prisma.claimRequest.findMany({
    where: branchId ? { branchId } : undefined,
    include: {
      customer: true,
      inventoryItem: true,
      warranty: true,
      swappedNewItem: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(claims);
}

// POST /api/claims — ຮັບເຄື່ອງເຄລມຈາກລູກຄ້າ
// body: { inventoryItemId, customerId, branchId, issueDescription, warrantyId? }
export async function POST(req: Request) {
  const body = await req.json();
  const required = ["inventoryItemId", "customerId", "branchId", "issueDescription"];
  for (const f of required) if (!body[f]) return jsonError(`${f} ຈຳເປັນ`);

  const result = await prisma.$transaction(async (tx: any) => {
    const claim = await tx.claimRequest.create({
      data: {
        claimNo: genCode("CLM"),
        warrantyId: body.warrantyId ?? null,
        inventoryItemId: body.inventoryItemId,
        customerId: body.customerId,
        branchId: body.branchId,
        issueDescription: body.issueDescription,
        status: "RECEIVED",
      },
    });

    await tx.inventoryItem.update({
      where: { id: body.inventoryItemId },
      data: { status: "CLAIMED_OUT" },
    });

    await tx.imeiHistory.create({
      data: {
        inventoryItemId: body.inventoryItemId,
        eventType: "CLAIM_SENT",
        refType: "ClaimRequest",
        refId: claim.id,
        note: `ຮັບເຄລມ: ${body.issueDescription}`,
      },
    });

    return claim;
  });

  return Response.json(result, { status: 201 });
}
