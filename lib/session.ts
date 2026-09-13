export type SessionUser = {
  employeeId: string;
  empCode: string;
  username: string;
  fullName: string;
  role: string;
  branchId: string;
  branchName: string;
};

const KEY = "imei_desk_session";

export function saveSession(user: SessionUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function getSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === "ADMIN";
}

export function isManager(user: SessionUser | null): boolean {
  return user?.role === "MANAGER";
}

export function canManageBranches(user: SessionUser | null): boolean {
  return isAdmin(user);
}

export function canManageEmployees(user: SessionUser | null): boolean {
  return isAdmin(user);
}
