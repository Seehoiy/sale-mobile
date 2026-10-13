"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveSession } from "@/lib/session";

type Branch = { id: string; name: string; code: string };

export default function LoginPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

<<<<<<< HEAD
  const [lockedUntil, setLockedUntil] = useState<number | null> (null);
=======
  // 🔒 ປະກາດ State ສຳລັບລະບົບລັອກອິນ ແລະ ນັບຖອຍຫຼັງ
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
>>>>>>> dev
  const [countdownText, setCountdownText] = useState("");

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then((data: Branch[]) => {
        if (Array.isArray(data)) {
          setBranches(data);
          if (data[0]) setSelectedBranchId(data[0].id);
        }
      });
  }, []);

<<<<<<< HEAD
=======
  // 🔄 ຟັງຊັນນັບຖອຍຫຼັງ Real-time
>>>>>>> dev
  useEffect(() => {
    if (!lockedUntil) return;

    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((lockedUntil - now) / 1000));

      if (diff <= 0) {
        setLockedUntil(null);
        setError(null);
        return;
      }

      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;

      const parts = [];
      if (h > 0) parts.push(`${h} ຊົ່ວໂມງ`);
      if (m > 0) parts.push(`${m} ນາທີ`);
      if (s > 0 || parts.length === 0) parts.push(`${s} ວິນາທີ`);

      setCountdownText(parts.join(" "));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [lockedUntil]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
<<<<<<< HEAD

    if (lockedUntil && Date.now() < lockedUntil) 
      return;
=======
    
    // ຖ້າລະບົບຖືກລັອກຢູ່ ບໍ່ໃຫ້ກົດສົ່ງ Request
    if (lockedUntil && Date.now() < lockedUntil) return;
>>>>>>> dev

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, branchId: selectedBranchId }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.lockedUntil) {
<<<<<<< HEAD
          setLockedUntil(data.lockedUntil);
        }
        throw new Error(data.error || "Log In ບໍ່ສຳເລັດ");

=======
          const timestamp = typeof data.lockedUntil === "number" 
            ? data.lockedUntil 
            : new Date(data.lockedUntil).getTime();
          setLockedUntil(timestamp);
        }
        throw new Error(data.error || "Log In ບໍ່ສຳເລັດ");
>>>>>>> dev
      }

      if (data.role !== "ADMIN" && data.role !== "MANAGER") {
        throw new Error("ອະນຸຍາດໃຫ້ສະເພາະ ແອັດມິນ (ADMIN) ແລະ ຜູ້ຈັດການຮ້ານ (MANAGER) ເຂົ້າສູ່ລະບົບເທົ່ານັ້ນ");
      }

      saveSession(data);
      router.push("/menu");
    } catch (err: any) {
      setError(err.message ?? "Log In ບໍ່ສຳເລັດ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans text-gray-900">
      <div className="w-full max-w-2xl border border-gray-300 bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Title bar */}
        <div className="bg-gray-100 border-b border-gray-300 px-4 py-3 flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-red-500" />
          <div className="w-3.5 h-3.5 rounded-full bg-yellow-500" />
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
          <span className="font-display font-extrabold text-gray-900 text-base ml-2 tracking-wide">
            IMEI<span className="text-blue-600">•</span>DESK
          </span>
          <span className="text-xs text-gray-600 font-mono ml-2">
            — ລະບົບຄຸ້ມຄອງຮ້ານໂທລະສັບ (Admin & Manager Portal)
          </span>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div>
              <h2 className="text-xl font-bold text-blue-700">🔑 ເຂົ້າສູ່ລະບົບ (Log In)</h2>
              <p className="text-xs text-gray-600 mt-0.5">
                ອະນຸຍາດໃຫ້ສະເພາະ <strong className="text-gray-900">Admin</strong> ແລະ <strong className="text-gray-900">ຜູ້ຈັດການຮ້ານ</strong> ເທົ່ານັ້ນ
              </p>
            </div>
            <span className="text-xs font-mono bg-gray-100 text-gray-600 border border-gray-300 px-2.5 py-1 rounded-full font-semibold">
              v1.0.0 (Secure)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-700 block mb-1 font-semibold">User Name *</label>
              <input
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 font-mono focus:border-blue-600 focus:outline-none"
                autoFocus
                placeholder="ປ້ອນ username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-700 block mb-1 font-semibold">Password *</label>
              <input
                type="password"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 font-mono focus:border-blue-600 focus:outline-none"
                placeholder="ປ້ອນ password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

<<<<<<< HEAD
          {lockedUntil && Date.now() < lockedUntil ? (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2 font-semibold">
              <span>🚫</span>
              <span>
                ທ່ານລັອກອິນຜິດເກີນກຳນົດ! ລະບົບຖືກລັອກ. ກະລຸນາລໍຖ້າອີກ{" "}
                <strong className="font-mono text-sm text-red-700 underline">{countdownText}</strong> ແລ້ວລອງໃໝ່
              </span>
            </div>
          ) : (
            error && (
=======
          {/* 🔴 ສະແດງແຈ້ງເຕືອນລັອກອິນ ຫຼື Error ປົກກະຕິ */}
          {lockedUntil && Date.now() < lockedUntil ? (
>>>>>>> dev
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2 font-semibold">
              <span>🚫</span>
              <span>
                ລະບົບຖືກລັອກເນື່ອງຈາກລັອກອິນຜິດເກີນກຳນົດ! ກະລຸນາລໍຖ້າອີກ{" "}
                <strong className="font-mono text-sm underline">{countdownText}</strong> ແລ້ວລອງໃໝ່
              </span>
            </div>
<<<<<<< HEAD
=======
          ) : (
            error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2 font-semibold">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
>>>>>>> dev
            )
          )}

          <div>
            <label className="text-xs text-gray-700 block mb-1 font-semibold">
              Choose Connection (ເລືອກສາຂາທີ່ຈະ Login ເຂົ້າໃຊ້)
            </label>
            <div className="bg-white border border-gray-300 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 text-gray-700 sticky top-0 border-b border-gray-300">
                  <tr>
                    <th className="px-3 py-2 w-12 text-center">#</th>
                    <th className="px-3 py-2">ຊື່ສາຂາ (Branch Name & Code)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {branches.map((b, i) => (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedBranchId(b.id)}
                      className={`cursor-pointer transition-colors ${
                        selectedBranchId === b.id
                          ? "bg-blue-100 text-blue-900 font-bold border-l-4 border-blue-600"
                          : "hover:bg-gray-50 text-gray-800"
                      }`}
                    >
                      <td className="px-3 py-2 text-center font-mono text-gray-500">{i + 1}</td>
                      <td className="px-3 py-2">
                        📍 {b.name} <span className="font-mono text-xs text-blue-600">({b.code})</span>
                      </td>
                    </tr>
                  ))}
                  {branches.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-3 py-4 text-center text-gray-500">
                        ບໍ່ພົບສາຂາ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-[11px] text-gray-500">
              🛡️ System protected by Role-Based Access Control
            </span>
            <button
              type="submit"
              disabled={loading || !!(lockedUntil && Date.now() < lockedUntil)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md"
            >
              ✓ {loading ? "ກຳລັງເຂົ້າສູ່ລະບົບ..." : "Log In (ເຂົ້າສູ່ລະບົບ)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}