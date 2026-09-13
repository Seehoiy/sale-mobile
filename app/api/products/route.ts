import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/utils";

// GET /api/products?query=iphone&categoryId=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") ?? undefined;
  const categoryId = searchParams.get("categoryId") ?? undefined;

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { sku: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(categoryId ? { categoryId } : {}),
    },
    include: {
      brand: true,
      category: true,
      _count: {
        select: {
          inventoryItems: { where: { status: "IN_STOCK" } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return Response.json(products);
}

export async function POST(req: Request) {
  const body = await req.json();
  const required = ["sku", "name", "categoryId", "costPrice", "sellPrice"];
  for (const field of required) {
    if (body[field] === undefined || body[field] === null) {
      return jsonError(`${field} ຈຳເປັນ`);
    }
  }

  const product = await prisma.product.create({
    data: {
      sku: body.sku,
      name: body.name,
      brandId: body.brandId ?? null,
      categoryId: body.categoryId,
      trackingType: body.trackingType ?? "SERIALIZED",
      attributes: body.attributes ?? undefined,
      costPrice: body.costPrice,
      sellPrice: body.sellPrice,
      images: body.images ?? [],
    },
  });

  return Response.json(product, { status: 201 });
}
