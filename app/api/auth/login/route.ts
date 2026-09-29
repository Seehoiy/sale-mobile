import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/utils";
import { verifyPassword } from "@/lib/hash";
import { signToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// 🔒 ລະບົບຈຳກັດການລັອກອິນຜິດ (In-Memory Attempt Lock Rate Limiter)
type LockRecord = {
  attempts: number;
  lastAttempt: number;
  lockedUntil?: number;
};

const loginAttempts = new Map<string, LockRecord>();

function checkLockStatus(username: string): { isLocked: boolean; message?: string } {
  const key = username.toLowerCase().trim();
  const record = loginAttempts.get(key);
  if (!record) return { isLocked: false };

  const now = Date.now();

  // ລ້າງຂໍ້ມູນຖ້າກາຍ 24 ຊົ່ວໂມງ
  if (now - record.lastAttempt > 24 * 60 * 60 * 1000) {
    loginAttempts.delete(key);
    return { isLocked: false };
  }

  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingSec = Math.ceil((record.lockedUntil - now) / 1000);
    if (remainingSec > 3600) {
      const hours = Math.ceil(remainingSec / 3600);
      return {
        isLocked: true,
        message: `🚫 ທ່ານລັອກອິນຜິດ 5 ຄັ້ງ! ລະບົບຖືກລັອກ. ກະລຸນາລອງໃໝ່ໃນມື້ອື່ນ (${hours} ຊົ່ວໂມງ)`,
      };
    } else {
      return {
        isLocked: true,
        message: `⚠️ ທ່ານລັອກອິນຜິດ 3 ຄັ້ງ! ລະບົບຖືກລັອກ 1 ນາທີ. ກະລຸນາລໍຖ້າ ${remainingSec} ວິນາທີ ແລ້ວລອງໃໝ່`,
      };
    }
  }

  return { isLocked: false };
}

function recordFailedLogin(username: string): string {
  const key = username.toLowerCase().trim();
  const now = Date.now();
  const record = loginAttempts.get(key) || { attempts: 0, lastAttempt: now };

  record.attempts += 1;
  record.lastAttempt = now;

  if (record.attempts >= 5) {
    // ລັອກຮອດ 24 ຊົ່ວໂມງ / ມື້ອື່ນ
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    record.lockedUntil = tomorrow.getTime();
    loginAttempts.set(key, record);
    return `🚫 ທ່ານລັອກອິນຜິດ 5 ຄັ້ງ! ລະບົບຖືກລັອກ. ກະລຸນາລອງໃໝ່ໃນມື້ອື່ນ`;
  } else if (record.attempts >= 3) {
    // ລັອກ 1 ນາທີ (60 ວິນາທີ)
    record.lockedUntil = now + 60 * 1000;
    loginAttempts.set(key, record);
    return `⚠️ ທ່ານລັອກອິນຜິດ 3 ຄັ້ງ! ລະບົບຖືກລັອກ 1 ນາທີ. ກະລຸນາລໍຖ້າ 1 ນາທີ ແລ້ວລອງໃໝ່`;
  }

  loginAttempts.set(key, record);
  const remaining = 3 - record.attempts;
  return `ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ (ຜິດໄປແລ້ວ ${record.attempts} ຄັ້ງ, ເຫຼືອໂອກາດອີກ ${remaining > 0 ? remaining : 0} ຄັ້ງ)`;
}

function clearFailedLogin(username: string) {
  loginAttempts.delete(username.toLowerCase().trim());
}

// POST /api/auth/login
export async function POST(req: Request) {
  const body = await req.json();
  const { username, password, branchId } = body;

  if (!username || !password) return jsonError("ກະລຸນາປ້ອນ User Name ແລະ Password");

  // 1) ກວດສອບວ່າຖືກລັອກຍ້ອນລັອກອິນຜິດ 3 ຫຼື 5 ຄັ້ງຫຼືບໍ່
  const lockStatus = checkLockStatus(username);
  if (lockStatus.isLocked) {
    return jsonError(lockStatus.message!, 429);
  }

  const employee = await prisma.employee.findUnique({
    where: { username },
    include: { branch: true },
  });

  if (!employee || !employee.isActive) {
    const errMessage = recordFailedLogin(username);
    return jsonError(errMessage, 401);
  }

  // 2) ຂໍ້ກຳນົດ: ອະນຸຍາດໃຫ້ສະເພາະ ແອັດມິນ (ADMIN) ແລະ ຜູ້ຈັດການຮ້ານ (MANAGER) ເຂົ້າສູ່ລະບົບເທົ່ານັ້ນ
  if (employee.role !== "ADMIN" && employee.role !== "MANAGER") {
    return jsonError("ອະນຸຍາດໃຫ້ສະເພາະ ແອັດມິນ (ADMIN) ແລະ ຜູ້ຈັດການຮ້ານ (MANAGER) ເຂົ້າສູ່ລະບົບເທົ່ານັ້ນ", 403);
  }

  // 3) ກວດສອບລະຫັດຜ່ານ
  const isValid = verifyPassword(password, employee.passwordHash);
  if (!isValid) {
    const errMessage = recordFailedLogin(username);
    return jsonError(errMessage, 401);
  }

  // ລັອກອິນຖືກຕ້ອງ -> ລ້າງປະຫວັດການລັອກອິນຜິດ
  clearFailedLogin(username);

  const branch = branchId
    ? await prisma.branch.findUnique({ where: { id: branchId } })
    : employee.branch;

  if (!branch) return jsonError("ບໍ່ພົບສາຂາທີ່ເລືອກ", 404);

  const payload = {
    employeeId: employee.id,
    empCode: employee.empCode,
    username: employee.username,
    fullName: employee.fullName,
    role: employee.role,
    branchId: branch.id,
    branchName: branch.name,
  };

  const token = signToken(payload);

  return Response.json({
    ...payload,
    token,
  });
}
