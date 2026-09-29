"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSession, SessionUser, isAdmin, getAuthHeaders } from "@/lib/session";
import { formatKip } from "@/lib/utils";

type Branch = { id: string; name: string; code: string };

type DashboardStats = {
  inStock: number;
  secondHand: number;
  inRepair: number;
  pendingClaims: number;
  pendingTransfers: number;
  todaySales: { count: number; total: number };
  branches: Branch[];
};

export default function DashboardPage() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    inStock: 0,
    secondHand: 0,
    inRepair: 0,
    pendingClaims: 0,
    pendingTransfers: 0,
    todaySales: { count: 0, total: 0 },
    branches: [],
  });

  useEffect(() => {
    const s = getSession();
    setSession(s);

    if (s?.role === "ADMIN") {
      setSelectedBranchId("ALL");
      fetchStats("ALL");
    } else if (s?.branchId) {
      setSelectedBranchId(s.branchId);
      fetchStats(s.branchId);
    } else {
      fetchStats("ALL");
    }
  }, []);

  const fetchStats = async (bId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/stats?branchId=${bId}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBranchChange = (newBranchId: string) => {
    setSelectedBranchId(newBranchId);
    fetchStats(newBranchId);
  };

  const admin = isAdmin(session);
  const selectedBranchObj = stats.branches.find((b) => b.id === selectedBranchId);

  const cards = [
    {
      label: "ໂທລະສັບ ພ້ອມຂາຍ",
      value: `${stats.inStock} ເຄື່ອງ`,
      href: "/inventory?status=IN_STOCK",
    },
    {
      label: "ຍອດຂາຍມື້ນີ້",
      value: `${stats.todaySales.count} ບິນ`,
      sub: formatKip(stats.todaySales.total),
      href: "/reports/sales",
    },
    { label: "ເຄື່ອງມືສອງ ລໍຖ້າຂາຍ", value: `${stats.secondHand} ເຄື່ອງ`, href: "/inventory?status=SECOND_HAND" },
    { label: "ຢູ່ໃນຂັ້ນຕອນຊ່ອມ", value: `${stats.inRepair} ເຄື່ອງ`, href: "/repair" },
    { label: "ເຄລມທີ່ຍັງບໍ່ແກ້ໄຂ", value: `${stats.pendingClaims} ງານ`, href: "/repair" },
    { label: "ໂອນຍ້າຍທີ່ຍັງບໍ່ຮັບ", value: `${stats.pendingTransfers} ລາຍການ`, href: "/transfers" },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4 md:p-6 space-y-6 font-sans">
      {/* Header section with Branch Selector on the Right */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 tracking-wide flex items-center gap-2">
            📊 ພາບລວມທຸລະກິດ (Dashboard Overview)
          </h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1">
            {admin ? (
              <span className="text-blue-700 font-semibold">
                🛡️ ສິດ Admin: ສາມາດກວດເບິ່ງ ພາບລວມທຸລະກິດ ແລະ ສະຕັອກລວມທຸກສາຂາ ຫຼື ແຍກຕາມສາຂາໄດ້
              </span>
            ) : (
              <span className="text-blue-600 font-semibold">
                🔒 ສິດ Store Manager: ຮັບສິດເບິ່ງ ພາບລວມທຸລະກິດ ສະເພາະສາຂາ {session?.branchName} ເທົ່ານັ້ນ
              </span>
            )}
          </p>
        </div>

        {/* Branch Filter Selector on the Right */}
        <div className="w-full sm:w-72 bg-gray-50 p-2.5 rounded-xl border border-gray-200 shadow-sm shrink-0">
          <label className="text-gray-600 text-[11px] block mb-1 font-semibold">
            {admin ? "ເລືອກສາຂາເພື່ອເບິ່ງຂໍ້ມູນ (Branch Filter)" : "ສາຂາທີ່ລັອກອິນ (Current Branch)"}
          </label>
          <select
            disabled={!admin}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-blue-700 focus:outline-none disabled:opacity-80 cursor-pointer disabled:cursor-not-allowed"
            value={selectedBranchId}
            onChange={(e) => handleBranchChange(e.target.value)}
          >
            {admin && <option value="ALL">🌐 ທຸກສາຂາ (ລວມທຸກສາຂາ)</option>}
            {stats.branches.map((b) => (
              <option key={b.id} value={b.id}>
                📍 {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active branch display notice */}
      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-xs text-blue-900 shadow-sm">
        <span className="font-semibold">
          📍 ກຳລັງສະແດງຂໍ້ມູນ:{" "}
          <span className="font-bold underline text-blue-700">
            {selectedBranchId === "ALL" ? "🌐 ລວມທຸກສາຂາ" : selectedBranchObj ? selectedBranchObj.name : session?.branchName}
          </span>
        </span>
        <span className="text-[11px] text-blue-600 font-mono">
          {stats.branches.length} ສາຂາເປີດໃຫ້ບໍລິການ
        </span>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="text-center text-gray-500 py-12">ກຳລັງໂຫຼດຂໍ້ມູນ ພາບລວມ...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-600 hover:shadow-md transition-all"
            >
              <div className="text-xs text-gray-500 font-semibold uppercase">{c.label}</div>
              <div className="font-display text-3xl font-bold text-gray-900 mt-2 font-mono">{c.value}</div>
              {c.sub && <div className="text-blue-600 font-bold text-base mt-1 font-mono">{c.sub}</div>}
            </Link>
          ))}
        </div>
      )}

      {/* Quick Actions Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-sm">
        <h2 className="font-display font-semibold text-lg text-gray-900">⚡ ເລີ່ມຕົ້ນໃຊ້ງານໄວ (Quick Actions)</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/pos" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm">
            + ອອກໃບບິນຂາຍ (POS)
          </Link>
          <Link href="/reports/sales" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm">
            📊 ລາຍງານຍອດຂາຍສິນຄ້າ
          </Link>
          <Link href="/inventory" className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-lg text-xs transition-colors border border-gray-300">
            📦 ສາງ / IMEI Stock
          </Link>
          <Link href="/trade-in" className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-lg text-xs transition-colors border border-gray-300">
            📱 ຮັບເທິນເຄື່ອງເກົ່າ
          </Link>
          <Link href="/repair" className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-lg text-xs transition-colors border border-gray-300">
            🛠️ ອອກໃບຮັບຊ່ອມ
          </Link>
        </div>
      </div>
    </div>
  );
}