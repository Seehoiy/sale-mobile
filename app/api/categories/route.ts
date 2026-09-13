import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/utils";

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return Response.json(categories);
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.name) return jsonError("name ຈຳເປັນ");
  const category = await prisma.category.create({ data: { name: body.name } });
  return Response.json(category, { status: 201 });
}
