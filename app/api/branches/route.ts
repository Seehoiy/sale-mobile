import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/utils";

export async function GET(req: Request) {
   const apiStart = Date.now();
   try {
  const { searchParams } = new URL(req.url);
  const showAll = searchParams.get("showAll") === "true";

  const dbStart = Date.now();

  const branches = await prisma.branch.findMany({
    where: showAll ? {} :  
    { 
      isActive: true
     },

     select: {
      id: true,
      code: true,
      name: true,
      address: true,
      phone: true,
      isActive: true,
     },

     orderBy: {
      name: "asc",
     },
  });

   const dbTime = Date.now() - dbStart;
   const totalTime = Date.now() - dbStart;

   console.log(
    `[Branches] DB query: ${dbTime}ms | branches=${branches.length} | total=${totalTime}ms`
   );

  return Response.json(branches);
 } catch (error: any) {
  console.error("Branches GET error:", error);

  return jsonError(error.message);
 } 
}



export async function POST(req: Request) {
  try {
  const body = await req.json();

  if (!body.code || !body.name)  {
    return jsonError("code ແລະ name ຈຳເປັນ");
}

  const branch = await prisma.branch.create({
    data: {
      code: body.code,
      name: body.name,
      address: body.address ?? null,
      phone: body.phone ?? null,
    },
  });
  return Response.json(branch,
     {
       status: 201,
    });
 } catch (error: any) {
  console.error("Branches POS Error:", error);

  return jsonError(error.message);
 }
}
