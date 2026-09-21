import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/utils";
import { verifyPassword } from "@/lib/hash";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/auth/login
// body: { username, password, branchId }
export async function POST(req: Request) {
  const body = await req.json();
  const { username, password, branchId } = body;

  if (!username || !password) return jsonError("ກະລຸນາປ້ອນ User Name ແລະ Password");

  const employee = await prisma.employee.findUnique({
    where: { username },
    include: { branch: true },
  });

  if (!employee || !employee.isActive) return jsonError("ບໍ່ພົບຜູ້ໃຊ້ນີ້ ຫຼື ຖືກປິດການໃຊ້ງານ", 401);

  // 1) ຂໍ້ກຳນົດ: ອະນຸຍາດໃຫ້ສະເພາະ ແອັດມິນ (ADMIN) ແລະ ຜູ້ຈັດການຮ້ານ (MANAGER) ເຂົ້າສູ່ລະບົບເທົ່ານັ້ນ
  if (employee.role !== "ADMIN" && employee.role !== "MANAGER") {
    return jsonError("ອະນຸຍາດໃຫ້ສະເພາະ ແອັດມິນ (ADMIN) ແລະ ຜູ້ຈັດການຮ້ານ (MANAGER) ເຂົ້າສູ່ລະບົບເທົ່ານັ້ນ", 403);
  }

  // 2) ກວດສອບລະຫັດຜ່ານດ້ວຍ Hash / Legacy comparison
  const isValid = verifyPassword(password, employee.passwordHash);
  if (!isValid) return jsonError("ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ", 401);

  // ຖ້າເລືອກ connection/ສາຂາອື່ນຈາກສາຂາຫຼັກຂອງພະນັກງານ
  const branch = branchId
    ? await prisma.branch.findUnique({ where: { id: branchId } })
    : employee.branch;

  if (!branch) return jsonError("ບໍ່ພົບສາຂາທີ່ເລືອກ", 404);

  return Response.json({
    employeeId: employee.id,
    empCode: employee.empCode,
    username: employee.username,
    fullName: employee.fullName,
    role: employee.role,
    branchId: branch.id,
    branchName: branch.name,
  });
}
