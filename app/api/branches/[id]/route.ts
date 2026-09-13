import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/utils";

// GET /api/branches/:id
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const branch = await prisma.branch.findUnique({ where: { id: params.id } });
  if (!branch) return jsonError("ບໍ່ພົບສາຂານີ້", 404);
  return Response.json(branch);
}

// PATCH /api/branches/:id
// body: { code?, name?, address?, phone?, isActive? }
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const branch = await prisma.branch.findUnique({ where: { id: params.id } });
  if (!branch) return jsonError("ບໍ່ພົບສາຂານີ້", 404);

  try {
    const updated = await prisma.branch.update({
      where: { id: params.id },
      data: {
        code: body.code ?? undefined,
        name: body.name ?? undefined,
        address: body.address ?? undefined,
        phone: body.phone ?? undefined,
        isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
      },
    });
    return Response.json(updated);
  } catch (err: any) {
    if (err.code === "P2002") return jsonError("ລະຫັດສາຂານີ້ຖືກໃຊ້ແລ້ວ");
    return jsonError(err.message ?? "ແກ້ໄຂບໍ່ສຳເລັດ", 400);
  }
}
