import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "pos_secure_jwt_secret_key_2026_change_in_production";

export type AuthUser = {
  employeeId: string;
  empCode: string;
  username: string;
  fullName: string;
  role: "ADMIN" | "MANAGER" | "CASHIER" | "TECHNICIAN" | "WAREHOUSE";
  branchId: string;
  branchName: string;
};

export function signToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies auth user from Request headers or fallback session header.
 */
export async function getAuthUser(req: Request): Promise<AuthUser | null> {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  let token: string | null = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  }

  if (!token) {
    token = req.headers.get("x-auth-token") || req.headers.get("x-session-user");
  }

  if (!token) return null;

  const verified = verifyToken(token);
  if (verified) return verified;

  // Fallback parsing for legacy header if raw JSON passed during migration, but verify user exists in DB
  try {
    const raw = JSON.parse(token);
    if (raw && raw.employeeId && raw.branchId) {
      const emp = await prisma.employee.findUnique({
        where: { id: raw.employeeId },
        include: { branch: true },
      });
      if (emp && emp.isActive) {
        return {
          employeeId: emp.id,
          empCode: emp.empCode,
          username: emp.username,
          fullName: emp.fullName,
          role: emp.role as any,
          branchId: raw.branchId || emp.branchId,
          branchName: emp.branch?.name || "",
        };
      }
    }
  } catch {}

  return null;
}
