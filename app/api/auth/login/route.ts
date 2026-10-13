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

function getFormattedTimeMessage(remainingSec: number): string {
  const hours = Math.floor(remainingSec / 3600);
  const minutes = Math.floor((remainingSec % 3600) / 60);
  const second = remainingSec % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours} ຊົ່ວໂມງ`);
  if (minutes > 0) parts.push(`${minutes} ນາທີ`);
  if (second > 0 || parts.length === 0) parts.push(`${second} ວິນາທີ`);

  return parts.join(" ");
}

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
    const timeText = getFormattedTimeMessage(remainingSec);
    return {
      isLocked: true,
      message: `🚫 ທ່ານລັອກອິນຜິດເກີນກຳນົດ! ລະບົບຖືກລັອກ. ກະລຸນາລອງໃໝ່ໃນ (${timeText})`,
    };
  }
  return { isLocked: false };
}

// 🟢 ແກ້ໄຂ: ໃຫ້ Return ເປັນ Object { message, lockedUntil }
function recordFailedLogin(username: string): { message: string; lockedUntil?: number } {
  const key = username.toLowerCase().trim();
  const now = Date.now();
  const record = loginAttempts.get(key) || { attempts: 0, lastAttempt: now };

  record.attempts += 1;
  record.lastAttempt = now;

  let message = "";

  if (record.attempts >= 12) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    record.lockedUntil = tomorrow.getTime();
    message = `🚫 ທ່ານລັອກອິນຜິດ 12 ຄັ້ງ! ລະບົບຖືກລັອກ. ກະລຸນາລອງໃໝ່ໃນມື້ອື່ນ`;
  } else if (record.attempts >= 9) {
    record.lockedUntil = now + 4 * 60 * 60 * 1000;
    message = `🚫 ທ່ານລັອກອິນຜິດ 9 ຄັ້ງ! ລະບົບຖືກລັອກ 4 ຊົ່ວໂມງ. ກະລຸນາລໍຖ້າ 4 ຊົ່ວໂມງ ແລ້ວລອງໃໝ່`;
  } else if (record.attempts >= 7) {
    record.lockedUntil = now + 60 * 60 * 1000;
    message = `🚫 ທ່ານລັອກອິນຜິດ 7 ຄັ້ງ! ລະບົບຖືກລັອກ 1 ຊົ່ວໂມງ. ກະລຸນາລໍຖ້າ 1 ຊົ່ວໂມງ ແລ້ວລອງໃໝ່`;
  } else if (record.attempts >= 5) {
    record.lockedUntil = now + 5 * 60 * 1000;
    message = `⚠️ ທ່ານລັອກອິນຜິດ 5 ຄັ້ງ! ລະບົບຖືກລັອກ 5 ນາທີ. ກະລຸນາລໍຖ້າ 5 ນາທີ ແລ້ວລອງໃໝ່`;
  } else if (record.attempts >= 3) {
    record.lockedUntil = now + 60 * 1000;
    message = `⚠️ ທ່ານລັອກອິນຜິດ 3 ຄັ້ງ! ລະບົບຖືກລັອກ 1 ນາທີ. ກະລຸນາລໍຖ້າ 1 ນາທີ ແລ້ວລອງໃໝ່`;
  } else {
    const remaining = 3 - record.attempts;
    message = `ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ (ຜິດໄປແລ້ວ ${record.attempts} ຄັ້ງ, ເຫຼືອໂອກາດອີກ ${remaining > 0 ? remaining : 0} ຄັ້ງ)`;
  }

  loginAttempts.set(key, record);
  return { message, lockedUntil: record.lockedUntil };
}

function clearFailedLogin(username: string) {
  loginAttempts.delete(username.toLowerCase().trim());
}

// POST /api/auth/login
export async function POST(req: Request) {
  const body = await req.json();
  const { username, password, branchId } = body;

  if (!username || !password) return jsonError("ກະລຸນາປ້ອນ User Name ແລະ Password");

  const key = username.toLowerCase().trim();
  const record = loginAttempts.get(key);
  const lockStatus = checkLockStatus(username);

  // 1) ກວດສອບ status ການລັອກ
  if (lockStatus.isLocked) {
    return Response.json(
      { 
        error: lockStatus.message,
        lockedUntil: record?.lockedUntil
      },
      { status: 429 }
    );
  }

  const employee = await prisma.employee.findUnique({
    where: { username },
    include: { branch: true },
  });

  if (!employee || !employee.isActive) {
    const { message, lockedUntil } = recordFailedLogin(username);
    return Response.json(
      { error: message, lockedUntil },
      { status: 401 }
    );
  }

  // 2) ຂໍ້ກຳນົດ Role
  if (employee.role !== "ADMIN" && employee.role !== "MANAGER") {
    return jsonError("ອະນຸຍາດໃຫ້ສະເພາະ ແອັດມິນ (ADMIN) ແລະ ຜູ້ຈັດການຮ້ານ (MANAGER) ເຂົ້າສູ່ລະບົບເທົ່ານັ້ນ", 403);
  }

  // 3) ກວດສອບລະຫັດຜ່ານ
  const isValid = verifyPassword(password, employee.passwordHash);

  if (!isValid) {
    const { message, lockedUntil } = recordFailedLogin(username);
    return Response.json(
      { error: message, lockedUntil },
      { status: 401 }
    );
  }

  // ລັອກອິນຖືກຕ້ອງ -> ລ້າງປະຫວັດ
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