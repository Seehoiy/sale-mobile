import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/utils";
import { url } from "inspector/promises";

export async function GET(req: Request) {

  const { searchParams } = new URL(req.url);
  const showAll = searchParams.get("showAll") === "true";

  const branches = await prisma.branch.findMany({
    where: showAll ? {} :  { isActive: true },
    orderBy: { name: "asc" },
  });
  return Response.json(branches);
}


export async function POST(req: Request) {
  const body = await req.json();
  if (!body.code || !body.name) return jsonError("code ແລະ name ຈຳເປັນ");

  const branch = await prisma.branch.create({
    data: {
      code: body.code,
      name: body.name,
      address: body.address ?? null,
      phone: body.phone ?? null,
    },
  });
  return Response.json(branch, { status: 201 });
}
