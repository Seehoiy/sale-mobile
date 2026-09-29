"use client";

import { useEffect, useState } from "react";
import { formatKip } from "@/lib/utils";
import { ReceiptData } from "./PosReceiptPrint";
import { SessionUser, isAdmin, getAuthHeaders } from "@/lib/session";

type Branch = { id: string; name: string; code: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  session: SessionUser | null;
  onSelectPrint: (data: ReceiptData) => void;
};

export default function PosHistoryModal({ isOpen, onClose, session, onSelectPrint }: Props) {
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const adminRole = isAdmin(session);

  useEffect(() => {
    if (isOpen && session) {
      const today = new Date().toISOString().split("T")[0];
      setStartDate(today);
      setEndDate(today);

      const initialBranch = adminRole ? "ALL" : session.branchId;
      setSelectedBranchId(initialBranch);

      if (adminRole) {
        fetch("/api/branches", { headers: getAuthHeaders() })
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data)) setBranches(data);
          })
          .catch(console.error);
      }

      fetchHistory(today, today, initialBranch);
    }
  }, [isOpen, session]);

  const fetchHistory = async (
    sDate = startDate,
    eDate = endDate,
    bId = selectedBranchId
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (bId && bId !== "ALL") params.set("branchId", bId);
      if (sDate) params.set("startDate", sDate);
      if (eDate) params.set("endDate", eDate);
      if (searchQuery) params.set("query", searchQuery);

      const res = await fetch(`/api/sales?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalSum = historyList.reduce((acc, h) => acc + Number(h.total || 0), 0);

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 w-[950px] max-w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-900 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-display">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">📜</span>
              ປະຫວັດການຂາຍ (Sales History)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {adminRole ? (
                <span className="text-blue-700 font-semibold">
                  🛡️ ສິດ Admin: ສາມາດເລືອກເບິ່ງປະຫວັດການຂາຍ ຂອງທຸກສາຂາ ຫຼື ແຍກຕາມສາຂາໄດ້
                </span>
              ) : (
                <span className="text-[#059669] font-semibold">
                  🔒 ສິດ Store Manager: ຮັບສິດເບິ່ງປະຫວັດການຂາຍ ສະເພາະສາຂາ {session?.branchName} ເທົ່ານັ້ນ
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 my-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            {/* Branch Selection */}
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">
                {adminRole ? "ສາຂາ (Branch)" : "ສາຂາ (Locked)"}
              </label>
              <select
                disabled={!adminRole}
                className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-blue-700 focus:outline-none disabled:opacity-80 disabled:cursor-not-allowed"
                value={selectedBranchId}
                onChange={(e) => {
                  setSelectedBranchId(e.target.value);
                  fetchHistory(startDate, endDate, e.target.value);
                }}
              >
                {adminRole && <option value="ALL">🌐 ທຸກສາຂາ (All Branches)</option>}
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    📍 {b.name} ({b.code})
                  </option>
                ))}
                {!adminRole && session && (
                  <option value={session.branchId}>📍 {session.branchName}</option>
                )}
              </select>
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-semibold">ແຕ່ວັນທີ</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-900"
              />
            </div>
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">ຫາວັນທີ</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-900"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => fetchHistory()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
              >
                🔍 ຄົ້ນຫາປະຫວັດ
              </button>
            </div>
          </div>

          <div>
            <input
              type="text"
              placeholder="🔍 ຄົ້ນຫາຕາມ (ເລກບິນ / ຊື່ຜູ້ຂາຍ / ລະຫັດຜູ້ຂາຍ / ຊື່ລູກຄ້າ / IMEI)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Summary Mini Bar */}
        <div className="flex justify-between items-center px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl mb-3 text-xs">
          <span className="text-slate-600 font-medium">
            ຈຳນວນໃບບິນທີ່ພົບ: <strong className="text-blue-700">{historyList.length} ໃບ</strong>
          </span>
          <span className="text-slate-600 font-medium">
            ຍອດຂາຍລວມ: <strong className="text-emerald-700 font-mono text-sm">{formatKip(totalSum)}</strong>
          </span>
        </div>

        {/* Data List */}
        <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
          {loading && <div className="text-center py-12 text-slate-400 font-medium">ກຳລັງໂຫລດປະຫວັດການຂາຍ...</div>}
          {!loading && historyList.length === 0 && (
            <div className="text-center py-12 text-slate-400 font-medium">ບໍ່ພົບປະຫວັດການຂາຍໃນຊ່ວງເວລານີ້</div>
          )}

          {historyList.map((h) => (
            <div
              key={h.id}
              className="border border-slate-200 rounded-2xl p-4 bg-white hover:border-blue-400 transition-all flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-sm"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold font-mono text-blue-600 text-sm px-2.5 py-0.5 bg-blue-50 rounded-lg border border-blue-100">
                    {h.invoiceNo}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    📅 {new Date(h.createdAt).toLocaleString("lo-LA")}
                  </span>
                  {adminRole && (
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200">
                      📍 {h.branch?.name || "ສາຂາ"}
                    </span>
                  )}
                </div>

                <div className="text-slate-800 text-xs">
                  <span className="text-slate-500">ຜູ້ຂາຍ: </span>
                  <span className="font-bold text-slate-900">{h.employee?.fullName || "N/A"}</span>{" "}
                  <span className="font-mono text-blue-600 text-[11px] font-bold">
                    [{h.employee?.empCode || "EMP-N/A"}]
                  </span>
                  <span className="mx-2 text-slate-300">•</span>
                  <span className="text-slate-500">ລູກຄ້າ: </span>
                  <span className="font-semibold text-slate-800">{h.customer?.fullName || "ລູກຄ້າທົ່ວໄປ"}</span>
                </div>

                <div className="text-[11px] text-slate-600 flex flex-wrap gap-1.5 pt-1">
                  {h.items.map((it: any, idx: number) => (
                    <span
                      key={idx}
                      className="bg-slate-50 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-medium"
                    >
                      {it.product?.name} {it.inventoryItem?.imei1 ? `(IMEI: ${it.inventoryItem.imei1})` : ""}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-right shrink-0 flex md:flex-col justify-between items-end gap-2 border-t md:border-t-0 border-slate-100 pt-2 md:pt-0">
                <div className="font-bold font-mono text-lg text-emerald-600">
                  {formatKip(h.total)}
                </div>
                <button
                  onClick={() => {
                    onSelectPrint({
                      invoiceNo: h.invoiceNo,
                      billNo: h.billNo,
                      createdAt: new Date(h.createdAt).toLocaleString("lo-LA"),
                      customerName: h.customer?.fullName || "ລູກຄ້າທົ່ວໄປ",
                      employeeName: h.employee?.fullName || "N/A",
                      employeeCode: h.employee?.empCode || "N/A",
                      branchName: h.branch?.name || "ສາຂາ",
                      items: h.items.map((i: any) => ({
                        productName: i.product?.name || "ສິນຄ້າ",
                        imei1: i.inventoryItem?.imei1,
                        quantity: i.quantity || 1,
                        unitPrice: Number(i.unitPrice),
                        discount: Number(i.discount || 0),
                        warrantyMonths: i.inventoryItem?.warranty?.durationMonths ?? 12,
                      })),
                      subtotal: Number(h.subtotal),
                      discount: Number(h.discount),
                      vatAmount: Number(h.total) - Number(h.subtotal) + Number(h.discount),
                      total: Number(h.total),
                    });
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  🖨️ ພິມໃບບິນ
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
