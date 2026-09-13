"use client";

import { useEffect, useState } from "react";
import { formatKip } from "@/lib/utils";

type EmpReport = {
  employeeId: string;
  employeeName: string;
  empCode: string;
  billCount: number;
  totalSales: number;
};

export default function EmployeeSalesReportPage() {
  const [reportData, setReportData] = useState<EmpReport[]>([]);
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchReport = async (sDate = startDate, eDate = endDate) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
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

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    setEndDate(today);
    fetchReport(today, today);
  }, []);

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

  return (
    <div className="p-6 bg-white min-h-screen text-gray-100 space-y-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-blue-500">
          📊 ລາຍງານຍອດຂາຍປະຈຳພະນັກງານ
        </h1>

        <div className="bg-white p-4 rounded-xl shadow-xl border border-neutral-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <div>
                <span className="text-gray-500 text-[10px] block mb-0.5">ແຕ່ວັນທີ</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-neutral-700 rounded px-2 py-1 text-xs bg-white text-gray-700"
                />
              </div>
              <span className="text-gray-500 self-end mb-1.5">-</span>
              <div>
                <span className="text-gray-500 text-[10px] block mb-0.5">ຫາວັນທີ</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-neutral-700 rounded px-2 py-1 text-xs bg-white text-gray-700"
                />
              </div>
              <button
                onClick={() => fetchReport()}
                className="self-end mb-0.5 bg-white-600 hover:bg-white-700 text-gray-700 px-3 py-1 rounded font-bold text-xs transition-colors border border-neutral-700"
              >
                ຄົ້ນຫາ
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <div className="inline-flex items-center border border-neutral-700 rounded-lg bg-white p-0.5">
                <button onClick={() => shiftDays(-1)} className="px-2 py-1 hover:bg-gray-200 rounded text-gray-400 font-bold" title="ມື້ຜ່ານມາ">
                  ◀
                </button>
                <button onClick={() => setQuickFilter("today")} className="px-2.5 py-1 hover:bg-gray-200 rounded text-gray-700 border-x border-neutral-800">
                  ມື້ນີ້
                </button>
                <button onClick={() => shiftDays(1)} className="px-2 py-1 hover:bg-gray-200 rounded text-gray-400 font-bold" title="ມື້ຕໍ່ໄປ">
                  ▶
                </button>
              </div>

              <div className="inline-flex items-center border border-neutral-700 rounded-lg bg-white p-0.5">
                <button onClick={() => setQuickFilter("thisWeek")} className="px-2.5 py-1 hover:bg-gray-200 rounded text-gray-700">
                  ອາທິດນີ້
                </button>
                <button onClick={() => setQuickFilter("thisMonth")} className="px-2.5 py-1 hover:bg-gray-200 rounded text-gray-900">
                  ເດືອນນີ້
                </button>
                <button onClick={() => setQuickFilter("thisYear")} className="px-2.5 py-1 hover:bg-gray-200 rounded text-gray-700">
                  ປີນີ້
                </button>
                <button onClick={() => setQuickFilter("all")} className="px-2.5 py-1 hover:bg-gray-200 rounded text-gray-700">
                  ທັງໝົດ
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl border border-neutral-800 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-xs">ກຳລັງດຶງຂໍ້ມູນ...</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-white border-b border-neutral-800 text-gray-700 font-semibold">
                <tr>
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">ລະຫັດ / ຊື່ພະນັກງານ</th>
                  <th className="p-3 text-center">ຈຳນວນໃບບິນທີ່ຂາຍໄດ້</th>
                  <th className="p-3 text-right">ຍອດຂາຍລວມ (ກີບ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {reportData.map((item, index) => (
                  <tr key={item.employeeId || index} className="hover:bg-neutral-950/60 transition-colors">
                    <td className="p-3 text-center text-gray-500">{index + 1}</td>
                    <td className="p-3 font-bold text-white">
                      {item.employeeName} <span className="text-cyan-400 font-mono font-normal">[{item.empCode}]</span>
                    </td>
                    <td className="p-3 text-center font-mono font-semibold text-amber-400">{item.billCount} ໃບ</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      {formatKip(item.totalSales)}
                    </td>
                  </tr>
                ))}
                {reportData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-700">
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