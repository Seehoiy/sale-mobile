"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSession, clearSession, SessionUser, isAdmin } from "@/lib/session";
import LogoutModal from "@/components/LogoutModal";

const ROW1 = [
  { emoji: "📊", label: "ພາບລວມ (Overview)", href: "/dashboard" },
  { emoji: "🗄️", label: "ຈັດການສິນຄ້າ (Products)", href: "/products" },
  { emoji: "🛍️", label: "ຮັບເຄື່ອງເຂົ້າສາງ (Buy/PO)", href: "/receive" },
  { emoji: "🏠", label: "ສາງສິນຄ້າ (Stock/IMEI)", href: "/inventory" },
  { emoji: "🛒", label: "ຂາຍໜ້າຮ້ານ (POS Sell)", href: "/pos" },
  { emoji: "🛠️", label: "ສ້ອມແປງ (Repair)", href: "/repair" },
  { emoji: "🖥️", label: "ຮັບເທິນ (Trade-In)", href: "/trade-in" },
  { emoji: "📕", label: "ຈັດການສາຂາ/ພະນັກງານ", href: "/branches" },
];

const ROW2 = [
  { emoji: "📋", label: "ລາຍງານຍອດຂາຍສິນຄ້າລະອຽດ", href: "/reports/sales" },
  { emoji: "🪙", label: "ລາຍງານຍອດຂາຍພະນັກງານ", href: "/reports/employees" },
  { emoji: "📒", label: "ໂອນຍ້າຍສາຂາ", href: "/transfers" },
  { emoji: "📗", label: "ສາງ / IMEI Tracking", href: "/inventory" },
];

export default function MenuPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    setSession(s);
  }, [router]);

  if (!session) return null;

  function logout() {
    clearSession();
    router.push("/login");
  }

  const adminRole = isAdmin(session);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6 text-gray-900 font-sans">
      <div className="max-w-5xl mx-auto border border-gray-300 bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Title bar */}
        <div className="bg-gray-100 px-4 py-3 flex items-center justify-between border-b border-gray-300 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-red-500" />
            <div className="w-3.5 h-3.5 rounded-full bg-yellow-500" />
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
            <span className="font-display font-extrabold text-gray-900 text-base ml-2 tracking-wide">
              Seehoiy<span className="text-blue-600">•</span>Dev
            </span>
            <span className="text-gray-600 font-mono hidden sm:inline ml-2">
              — 📍 {session.branchName}
            </span>
          </div>

          <button
          type="button"
            onClick={() => setShowLogoutAlert(true)}
            className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            ອອກຈາກລະບົບ
          </button>
          <LogoutModal
          isOpen={showLogoutAlert}
          onClose={() => setShowLogoutAlert(false)}
          />
        </div>

        {/* User Info Header */}
        <div className="p-6 border-b border-gray-200 bg-blue-50/50">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div>
              <h1 className="font-display text-3xl font-black text-blue-700 italic tracking-wide">
                Buy-Sale Products 
              </h1>
              <p className="text-xs text-gray-600 mt-1">
                ສາຂາປະຈຳການ: <span className="text-gray-900 font-bold">{session.branchName}</span>
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span>{session.fullName}</span>
                <span
                  className={`text-xs font-mono px-2.5 py-0.5 rounded-full border ${
                    adminRole
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-blue-100 text-blue-800 border-blue-300"
                  }`}
                >
                  {session.role}
                </span>
              </div>
              <div className="text-xs font-mono text-gray-500 mt-0.5">
                Code: {session.empCode || "EMP-N/A"}
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              ⚡ ເມນູຫຼັກ (Main Operations)
            </h2>
            <MenuGrid items={ROW1} />
          </div>

          <div className="border-t border-gray-200 pt-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              📊 ລາຍງານ ແລະ ລະບົບໂອນຍ້າຍ (Reports & Transfers)
            </h2>
            <MenuGrid items={ROW2} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuGrid({ items }: { items: { emoji: string; label: string; href: string }[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-3">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="flex flex-col items-center justify-center text-center gap-2 p-4 rounded-xl bg-white border border-gray-200 hover:border-blue-600 hover:bg-blue-50/60 transition-all group shadow-sm"
        >
          <div className="text-3xl group-hover:scale-110 transition-transform">{item.emoji}</div>
          <div className="text-xs font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
            {item.label}
          </div>
        </Link>
      ))}
    </div>
  );
}
