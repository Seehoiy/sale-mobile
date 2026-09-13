import { prisma } from "@/lib/prisma";
import { jsonError, genCode } from "@/lib/utils";
import { hashPassword } from "@/lib/hash";

// GET /api/employees?branchId=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId") ?? undefined;

  const employees = await prisma.employee.findMany({
    where: branchId ? { branchId } : undefined,
    select: {
      id: true,
      empCode: true,
      pinCode: true,
      username: true,
      fullName: true,
      role: true,
      branchId: true,
      isActive: true,
      createdAt: true,
      branch: { select: { name: true, code: true } },
    },
    orderBy: { fullName: "asc" },
  });
  return Response.json(employees);
}

// POST /api/employees — ໂດຍ Admin ເທົ່ານັ້ນ (ສ້າງບັນຊີ ແລະ ລະຫັດຜ່ານ)
export async function POST(req: Request) {
  const body = await req.json();
  const required = ["username", "password", "fullName", "role", "branchId"];
  for (const f of required) if (!body[f]) return jsonError(`${f} ຈຳເປັນ`);

  const existing = await prisma.employee.findUnique({ where: { username: body.username } });
  if (existing) return jsonError("Username ນີ້ຖືກໃຊ້ແລ້ວ");

  const count = await prisma.employee.count();
  const empCode = body.empCode || `EMP${String(count + 1).padStart(3, "0")}`;

  const hashedPassword = hashPassword(body.password);

  const employee = await prisma.employee.create({
    data: {
      empCode,
      pinCode: body.pinCode || "1234",
      username: body.username,
      passwordHash: hashedPassword,
      fullName: body.fullName,
      role: body.role,
      branchId: body.branchId,
    },
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

  return Response.json(employee, { status: 201 });
}
