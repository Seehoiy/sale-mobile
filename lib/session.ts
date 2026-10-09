export type SessionUser = {
  employeeId: string;
  empCode: string;
  username: string;
  fullName: string;
  role: "ADMIN" | "MANAGER" | "CASHIER" | "TECHNICIAN" | "WAREHOUSE" | string;
  branchId: string;
  branchName: string;
  token?: string;
};

const KEY = "imei_desk_session";

// 💡 ໃຊ້ sessionStorage ເພື່ອໃຫ້ອອກຈາກລະບົບອັດຕະໂນມັດ ເມື່ອປິດ Browser / Tab
export function saveSession(user: SessionUser) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(user));
  // ລຶບ localStorage ເກົ່າອອກ (ຖ້າມີ)
  localStorage.removeItem(KEY);
}

export function getSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY) || localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
  localStorage.removeItem(KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const session = getSession();
  if (!session) return {};
  const headers: Record<string, string> = {};
  if (session.token && session.token !== "undefined" && session.token !== "null") {
    headers["Authorization"] = `Bearer ${session.token}`;
  }
  headers["x-session-user"] = encodeURIComponent(JSON.stringify(session));
  return headers;
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
