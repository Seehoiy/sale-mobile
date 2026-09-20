"use client";

import { useEffect, useState } from "react";
import { formatKip } from "@/lib/utils";
import { getSession, SessionUser, isAdmin } from "@/lib/session";

type Branch = { id: string; name: string };

type SaleDetailItem = {
  saleId: string;
  invoiceNo: string;
  billNo?: string;
  createdAt: string;
  branchName: string;
  sellerName: string;
  sellerCode: string;
  customerName: string;
  productName: string;
  sku: string;
  categoryName: string;
  imei: string | null;
  unitPrice: number;
  quantity: number;
  discount: number;
  lineTotal: number;
  warrantyMonths: number;
};

export default function SalesReportPage() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<{
    summary: { totalBillCount: number; totalItemsCount: number; grandTotalAmount: number };
    items: SaleDetailItem[];
  }>({
    summary: { totalBillCount: 0, totalItemsCount: 0, grandTotalAmount: 0 },
    items: [],
  });

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
      const params = new URLSearchParams();
      if (bId && bId !== "ALL") params.append("branchId", bId);
      if (sDate) params.append("startDate", sDate);
      if (eDate) params.append("endDate", eDate);

      const res = await fetch(`/api/reports/sales-detail?${params.toString()}`);
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

  const filteredItems = searchQuery
    ? reportData.items.filter(
        (i) =>
          i.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.sellerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (i.imei && i.imei.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : reportData.items;

  const admin = isAdmin(session);

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 tracking-wide flex items-center gap-2">
            📊 ລາຍງານຍອດຂາຍສິນຄ້າ (Detailed Sales Report)
          </h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1">
            {admin ? (
              <span className="text-blue-700 font-semibold">
                🛡️ ສິດ Admin: ສາມາດກວດເບິ່ງ ຍອດຂາຍລວມທຸກສາຂາ ຫຼື ແຍກຕາມສາຂາໄດ້
              </span>
            ) : (
              <span className="text-blue-600 font-semibold">
                🔒 ສິດ Store Manager: ຮັບສິດເບິ່ງຍອດຂາຍສະເພາະສາຂາ {session?.branchName} ເທົ່ານັ້ນ
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-gray-500 font-semibold uppercase">ຈຳນວນໃບບິນທີ່ຂາຍ</div>
          <div className="font-display text-2xl font-bold text-blue-700 mt-1 font-mono">
            {reportData.summary.totalBillCount} ໃບ
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-gray-500 font-semibold uppercase">ຈຳນວນສິນຄ້າທີ່ຂາຍໄດ້</div>
          <div className="font-display text-2xl font-bold text-blue-600 mt-1 font-mono">
            {reportData.summary.totalItemsCount} ສິນຄ້າ
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-gray-500 font-semibold uppercase">ຍອດຂາຍລວມທັງໝົດ</div>
          <div className="font-display text-2xl font-bold text-emerald-600 mt-1 font-mono">
            {formatKip(reportData.summary.grandTotalAmount)}
          </div>
        </div>
      </div>

      {/* Toolbar Filter */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
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

          {/* Date Picker */}
          <div className="flex items-center gap-2 text-xs">
            <div>
              <span className="text-gray-600 text-[10px] block mb-0.5 font-semibold">ແຕ່ວັນທີ</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-900"
              />
            </div>
            <span className="text-gray-400 self-end mb-1">-</span>
            <div>
              <span className="text-gray-600 text-[10px] block mb-0.5 font-semibold">ຫາວັນທີ</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-900"
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
          <div className="flex items-center gap-1 text-xs">
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

        {/* Text Filter Bar */}
        <div>
          <input
            type="text"
            placeholder="🔍 ຄົ້ນຫາຕາມຊື່ສິນຄ້າ, ລະຫັດ SKU, IMEI, ຊື່ຜູ້ຂາຍ ຫຼື ລະຫັດຜູ້ຂາຍ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Detailed Items Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-gray-500 text-xs">ກຳລັງດຶງຂໍ້ມູນລາຍງານ...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 border-b border-gray-200 text-gray-700 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="p-3 w-10 text-center">#</th>
                  <th className="p-3">ເລກບິນ / ວັນທີ</th>
                  <th className="p-3">ຊື່ສິນຄ້າ (Product Name)</th>
                  <th className="p-3 font-mono">IMEI / Serial</th>
                  <th className="p-3">ຜູ້ຂາຍ (Seller Name & Code)</th>
                  <th className="p-3">ສາຂາ</th>
                  <th className="p-3 text-center">ປະກັນ</th>
                  <th className="p-3 text-right">ລາຄາ</th>
                  <th className="p-3 text-right">ສ່ວນຫຼຸດ</th>
                  <th className="p-3 text-right">ຍອດລວມ (ກີບ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-center text-gray-500 font-mono">{index + 1}</td>
                    <td className="p-3">
                      <div className="font-mono text-blue-700 font-bold">{item.invoiceNo}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{new Date(item.createdAt).toLocaleString("lo-LA")}</div>
                    </td>
                    <td className="p-3 font-bold text-gray-900">
                      {item.productName}
                      <div className="text-[10px] text-gray-500 font-mono font-normal">
                        SKU: {item.sku} · {item.categoryName}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-red-600 font-semibold">
                      {item.imei ?? "-"}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-gray-900">{item.sellerName}</div>
                      <div className="font-mono text-blue-600 text-[10px] font-semibold">[{item.sellerCode}]</div>
                    </td>
                    <td className="p-3 text-gray-700">{item.branchName}</td>
                    <td className="p-3 text-center font-mono text-emerald-700 font-bold">
                      {item.warrantyMonths > 0 ? `${item.warrantyMonths}m` : "-"}
                    </td>
                    <td className="p-3 text-right font-mono">{formatKip(item.unitPrice)}</td>
                    <td className="p-3 text-right font-mono text-red-600">{formatKip(item.discount)}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">
                      {formatKip(item.lineTotal)}
                    </td>
                  </tr>
                ))}

                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-10 text-center text-gray-500">
                      ບໍ່ມີຂໍ້ມູນການຂາຍສິນຄ້າໃນຊ່ວງເວລານີ້
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
