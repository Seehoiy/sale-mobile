"use client";

import { useEffect, useState } from "react";
import { formatKip } from "@/lib/utils";
import { getSession, SessionUser, isAdmin } from "@/lib/session";

type Branch = { id: string; name: string };
type EmpReport = {
  employeeId: string;
  employeeName: string;
  empCode: string;
  billCount: number;
  totalSales: number;
};

export default function EmployeeSalesReportPage() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("ALL");
  const [reportData, setReportData] = useState<EmpReport[]>([]);
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const s = getSession();
    setSession(s);

    const initialBranchId = s?.role === "ADMIN" ? "ALL" : s?.branchId || "ALL";

    fetch("/api/branches")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBranches(data);
          if (s?.role === "ADMIN") {
            setSelectedBranchId("ALL");
          } else if (s?.branchId) {
            setSelectedBranchId(s.branchId);
          }
        }
      });

    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    setEndDate(today);
    fetchReport(today, today, initialBranchId);
  }, []);

  const fetchReport = async (
    sDate = startDate,
    eDate = endDate,
    bId = selectedBranchId
  ) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (bId && bId !== "ALL") query.append("branchId", bId);
      if (sDate) query.append("startDate", sDate);
      if (eDate) query.append("endDate", eDate);

      const res = await fetch(`/api/reports/employee-sales?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const shiftDays = (days: number) => {
    const current = startDate ? new Date(startDate) : new Date();
    current.setDate(current.getDate() + days);

    const newDateStr = current.toISOString().split("T")[0];
    setStartDate(newDateStr);
    setEndDate(newDateStr);
    fetchReport(newDateStr, newDateStr);
  };

  const setQuickFilter = (type: "today" | "thisWeek" | "thisMonth" | "thisYear" | "all") => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    if (type === "today") {
      const now = formatDate(today);
      setStartDate(now);
      setEndDate(now);
      fetchReport(now, now);
    } else if (type === "thisWeek") {
      const dayOfWeek = today.getDay();
      const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(today);
      monday.setDate(today.getDate() - distanceToMonday);

      const sStr = formatDate(monday);
      const eStr = formatDate(today);
      setStartDate(sStr);
      setEndDate(eStr);
      fetchReport(sStr, eStr);
    } else if (type === "thisMonth") {
      const firstDay = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
      const now = formatDate(today);
      setStartDate(firstDay);
      setEndDate(now);
      fetchReport(firstDay, now);
    } else if (type === "thisYear") {
      const firstDay = formatDate(new Date(today.getFullYear(), 0, 1));
      const now = formatDate(today);
      setStartDate(firstDay);
      setEndDate(now);
      fetchReport(firstDay, now);
    } else if (type === "all") {
      setStartDate("");
      setEndDate("");
      fetchReport("", "");
    }
  };

  const admin = isAdmin(session);

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen text-gray-900 space-y-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 text-blue-700 tracking-wide font-display">
            📊 ລາຍງານຍອດຂາຍປະຈຳພະນັກງານ (Employee Sales Report)
          </h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1">
            {admin ? (
              <span className="text-blue-700 font-semibold">
                🛡️ ສິດ Admin: ສາມາດກວດເບິ່ງ ຍອດຂາຍພະນັກງານລວມທຸກສາຂາ ຫຼື ແຍກຕາມສາຂາໄດ້
              </span>
            ) : (
              <span className="text-blue-600 font-semibold">
                🔒 ສິດ Store Manager: ຮັບສິດເບິ່ງຍອດຂາຍພະນັກງານສະເພາະສາຂາ {session?.branchName} ເທົ່ານັ້ນ
              </span>
            )}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Branch Filter */}
            <div className="w-64">
              <label className="text-gray-600 text-[10px] block mb-1 font-semibold">
                {admin ? "ສາຂາ (Branch Filter)" : "ສາຂາ (Locked)"}
              </label>
              <select
                disabled={!admin}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-blue-700 font-bold focus:outline-none disabled:opacity-80 cursor-pointer disabled:cursor-not-allowed"
                value={selectedBranchId}
                onChange={(e) => {
                  setSelectedBranchId(e.target.value);
                  fetchReport(startDate, endDate, e.target.value);
                }}
              >
                {admin && <option value="ALL">🌐 ທຸກສາຂາ (ລວມທຸກສາຂາ)</option>}
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    📍 {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Pickers */}
            <div className="flex items-center gap-2 text-xs">
              <div>
                <span className="text-gray-600 text-[10px] block mb-0.5 font-semibold">ແຕ່ວັນທີ</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-900"
                />
              </div>
              <span className="text-gray-400 self-end mb-1">-</span>
              <div>
                <span className="text-gray-600 text-[10px] block mb-0.5 font-semibold">ຫາວັນທີ</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-900"
                />
              </div>
              <button
                onClick={() => fetchReport()}
                className="self-end mb-0.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-bold text-xs transition-colors shadow-sm cursor-pointer"
              >
                ຄົ້ນຫາ
              </button>
            </div>

            {/* Quick Period Buttons */}
            <div className="flex items-center gap-1.5 text-xs">
              <div className="inline-flex items-center border border-gray-300 rounded-lg bg-white p-0.5">
                <button onClick={() => shiftDays(-1)} className="px-2 py-1 hover:bg-gray-100 rounded text-gray-700 font-bold" title="ມື້ຜ່ານມາ">
                  ◀
                </button>
                <button onClick={() => setQuickFilter("today")} className="px-2.5 py-1 hover:bg-gray-100 rounded text-gray-800 border-x border-gray-200 font-semibold">
                  ມື້ນີ້
                </button>
                <button onClick={() => shiftDays(1)} className="px-2 py-1 hover:bg-gray-100 rounded text-gray-700 font-bold" title="ມື້ຕໍ່ໄປ">
                  ▶
                </button>
              </div>

              <div className="inline-flex items-center border border-gray-300 rounded-lg bg-white p-0.5">
                <button onClick={() => setQuickFilter("thisWeek")} className="px-2.5 py-1 hover:bg-gray-100 rounded text-gray-800 font-medium">
                  ອາທິດນີ້
                </button>
                <button onClick={() => setQuickFilter("thisMonth")} className="px-2.5 py-1 hover:bg-gray-100 rounded text-gray-800 font-medium">
                  ເດືອນນີ້
                </button>
                <button onClick={() => setQuickFilter("thisYear")} className="px-2.5 py-1 hover:bg-gray-100 rounded text-gray-800 font-medium">
                  ປີນີ້
                </button>
                <button onClick={() => setQuickFilter("all")} className="px-2.5 py-1 hover:bg-gray-100 rounded text-gray-600">
                  ທັງໝົດ
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-500 text-xs">ກຳລັງດຶງຂໍ້ມູນ...</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 border-b border-gray-200 text-gray-700 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">ລະຫັດ / ຊື່ພະນັກງານ</th>
                  <th className="p-3 text-center">ຈຳນວນໃບບິນທີ່ຂາຍໄດ້</th>
                  <th className="p-3 text-right">ຍອດຂາຍລວມ (ກີບ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.map((item, index) => (
                  <tr key={item.employeeId || index} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-center text-gray-500 font-mono">{index + 1}</td>
                    <td className="p-3 font-bold text-gray-900">
                      {item.employeeName} <span className="text-blue-600 font-mono font-semibold">[{item.empCode}]</span>
                    </td>
                    <td className="p-3 text-center font-mono font-semibold text-blue-700">{item.billCount} ໃບ</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600">
                      {formatKip(item.totalSales)}
                    </td>
                  </tr>
                ))}
                {reportData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-gray-500">
                      ບໍ່ມີຂໍ້ມູນການຂາຍໃນຊ່ວງເວລານີ້
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}