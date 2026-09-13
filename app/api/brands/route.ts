import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/utils";

export async function GET() {
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
  return Response.json(brands);
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.name) return jsonError("name ຈຳເປັນ");
  const brand = await prisma.brand.create({ data: { name: body.name } });
  return Response.json(brand, { status: 201 });
}
