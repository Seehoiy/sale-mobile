"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { getSession, clearSession, SessionUser, isAdmin } from "@/lib/session";
import LogoutModal from "./LogoutModal";

const NAV = [
  { href: "/dashboard", label: "ພາບລວມ (Overview)", code: "OVW" },
  { href: "/pos", label: "ຂາຍໜ້າຮ້ານ (POS)", code: "POS" },
  { href: "/products", label: "ຈັດການສິນຄ້າ", code: "PRD" },
  { href: "/receive", label: "ຮັບເຄື່ອງເຂົ້າສາງ", code: "BUY" },
  { href: "/inventory", label: "ສາງສິນຄ້າ / IMEI", code: "INV" },
  { href: "/trade-in", label: "ຮັບເທິນເຄື່ອງເກົ່າ", code: "TDI" },
  { href: "/repair", label: "ຮັບຊ່ອມ", code: "RPR" },
  { href: "/claims", label: "ຮັບເຄື່ອງເຄລມ", code: "CLM" },
  { href: "/transfers", label: "ໂອນຍ້າຍສາຂາ", code: "TRF" },
  { href: "/branches", label: "ຈັດການສາຂາ / ພະນັກງານ", code: "BRC" },
  { href: "/reports/sales", label: "ລາຍງານຍອດຂາຍສິນຄ້າ", code: "RPT" },
  { href: "/reports/employees", label: "ລາຍງານຍອດຂາຍພະນັກງານ", code: "EMP" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [mounted, setMounted] = useState(false);
  

  useEffect(() => {
    setMounted(true);
    setSession(getSession());
  }, []);
  
  const adminRole = isAdmin ? isAdmin(session) : false;

  return (
    
    <aside className="w-64 shrink-0 border-r border-gray-300 bg-gray-100 min-h-screen flex flex-col font-sans">
      <Link href="/menu" className="px-5 py-5 border-b border-gray-200 block hover:bg-write-100 transition-colors">
        <div className="font-display text-xl font-extrabold tracking-tight text-blue-700 flex items-center gap-1.5">
          Buy-Sale<span className="text-blue-600">•</span>Products
        </div>
        <div className="text-[11px] text-yellow-600 font-mono mt-0.5">Seehoiy Dev</div>
      </Link>

      <nav className="flex-1 py-3 space-y-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-5 py-2.5 text-xs md:text-sm font-medium border-l-4 transition-all",
                active
                  ? "border-blue-600 bg-blue-50 text-blue-700 font-bold"
                  : "border-transparent text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              )}
            >
              <span className="font-mono text-[10px] text-blue-600 w-7 font-bold">{item.code}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-gray-200 text-[11px] text-gray-600 bg-gray-50">
        {session ? (
          <div className="flex items-center justify-between gap-2">
            <div className="truncate">
              <div className="text-gray-900 font-bold truncate flex items-center gap-1">
                <span>{session.fullName}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${adminRole ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-blue-100 text-blue-800 border-blue-300"}`}>
                  {session.role}
                </span>
              </div>
              <div className="font-mono text-gray-500 text-[10px] mt-0.5">📍 {session.branchName}</div>
            </div>
            <button onClick={() => setShowLogoutAlert(true)} 
            className="text-red-600 hover:underline font-semibold shrink-0 cursor-pointer">
              ອອກ
            </button>
            {mounted && showLogoutAlert && (
            <LogoutModal 
            isOpen={showLogoutAlert}
            onClose={() => setShowLogoutAlert(false)}
            />
            )}
          </div>
        ) : (
          <span className="font-mono text-gray-400">v1.0 · IMEI•DESK</span>
        )}
      </div>
    </aside>

  );
}
