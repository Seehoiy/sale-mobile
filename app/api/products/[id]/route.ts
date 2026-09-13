import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/utils";

// PATCH /api/products/:id
// body: { name?, brandId?, categoryId?, costPrice?, sellPrice?, isActive? }
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return jsonError("ບໍ່ພົບສິນຄ້ານີ້", 404);

  const updated = await prisma.product.update({
    where: { id: params.id },
    data: {
      name: body.name ?? undefined,
      brandId: body.brandId ?? undefined,
      categoryId: body.categoryId ?? undefined,
      costPrice: body.costPrice ?? undefined,
      sellPrice: body.sellPrice ?? undefined,
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
    },
  });

  return Response.json(updated);
}
