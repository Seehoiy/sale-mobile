import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/utils";
import { hashPassword } from "@/lib/hash";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/employees/:id
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const employee = await prisma.employee.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      empCode: true,
      pinCode: true,
      username: true,
      fullName: true,
      role: true,
      branchId: true,
      isActive: true,
      branch: { select: { name: true } },
    },
  });
  if (!employee) return jsonError("ບໍ່ພົບພະນັກງານນີ້", 404);
  return Response.json(employee);
}

// PATCH /api/employees/:id
// body: { fullName?, role?, branchId?, isActive?, newPassword?, empCode?, pinCode? }
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const employee = await prisma.employee.findUnique({ where: { id: params.id } });
  if (!employee) return jsonError("ບໍ່ພົບພະນັກງານນີ້", 404);

  const updatedData: any = {
    fullName: body.fullName ?? undefined,
    role: body.role ?? undefined,
    branchId: body.branchId ?? undefined,
    empCode: body.empCode ?? undefined,
    pinCode: body.pinCode ?? undefined,
    isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
  };

  if (body.newPassword && body.newPassword.trim() !== "") {
    updatedData.passwordHash = hashPassword(body.newPassword.trim());
  }

  const updated = await prisma.employee.update({
    where: { id: params.id },
    data: updatedData,
    select: {
      id: true,
      empCode: true,
      pinCode: true,
      username: true,
      fullName: true,
      role: true,
      branchId: true,
      isActive: true,
      branch: { select: { name: true } },
    },
  });

  return Response.json(updated);
}
