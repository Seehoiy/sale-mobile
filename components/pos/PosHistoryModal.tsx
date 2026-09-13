"use client";

import { useEffect, useState } from "react";
import { formatKip } from "@/lib/utils";
import { ReceiptData } from "./PosReceiptPrint";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  onSelectPrint: (data: ReceiptData) => void;
};

export default function PosHistoryModal({ isOpen, onClose, branchId, onSelectPrint }: Props) {
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchHistory = async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ branchId });
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (searchQuery) params.set("query", searchQuery);

      const res = await fetch(`/api/sales?${params.toString()}`);
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

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split("T")[0];
      setStartDate(today);
      setEndDate(today);
      fetchHistory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-300 rounded-2xl p-5 w-[850px] max-w-full max-h-[90vh] flex flex-col shadow-2xl text-gray-900">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 pb-3">
          <div>
            <h3 className="text-lg font-bold text-blue-700">📜 ປະຫວັດການຂາຍ (Sales History)</h3>
            <p className="text-xs text-gray-500">
              ສະແດງຊື່/ລະຫັດຜູ້ຂາຍ ແລະ ສາມາດຄົ້ນຫາຕາມໄລຍະເວລາ ວັນ/ເດືອນ/ປີ ໄດ້
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 font-bold text-xl px-2">
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 my-3 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <label className="text-gray-600 block mb-1">ແຕ່ວັນທີ</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded p-1.5 text-gray-900"
            />
          </div>
          <div>
            <label className="text-gray-600 block mb-1">ຫາວັນທີ</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded p-1.5 text-gray-900"
            />
          </div>
          <div>
            <label className="text-gray-600 block mb-1">ຄົ້ນຫາ (ເລກບິນ / ຜູ້ຂາຍ / ລູກຄ້າ / IMEI)</label>
            <input
              type="text"
              placeholder="ພິມຊື່ຜູ້ຂາຍ, ລະຫັດ ຫຼື IMEI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded p-1.5 text-gray-900"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchHistory}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded text-xs transition-colors"
            >
              🔍 ຄົ້ນຫາ
            </button>
          </div>
        </div>

        {/* Data List */}
        <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-1">
          {loading && <div className="text-center py-8 text-gray-500">ກຳລັງໂຫລດປະຫວັດການຂາຍ...</div>}
          {!loading && historyList.length === 0 && (
            <div className="text-center py-8 text-gray-500">ບໍ່ພົບປະຫວັດການຂາຍໃນຊ່ວງເວລານີ້</div>
          )}

          {historyList.map((h) => (
            <div key={h.id} className="border border-gray-200 rounded-xl p-3 bg-white hover:bg-gray-50 transition-colors flex flex-col md:flex-row justify-between md:items-center gap-3 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-blue-700 text-sm">{h.invoiceNo}</span>
                  <span className="text-[10px] text-gray-500 font-mono">({new Date(h.createdAt).toLocaleString("lo-LA")})</span>
                </div>
                <div className="text-gray-800">
                  <span className="text-gray-500">ຜູ້ຂາຍ: </span>
                  <span className="font-bold text-gray-900">
                    {h.employee?.fullName || "N/A"}
                  </span>{" "}
                  <span className="font-mono text-blue-600 text-[11px] font-semibold">
                    [{h.employee?.empCode || "EMP-N/A"}]
                  </span>
                </div>
                <div className="text-gray-600 text-[11px]">
                  ລູກຄ້າ: {h.customer?.fullName || "ລູກຄ້າທົ່ວໄປ"} · {h.items.length} ລາຍການ
                </div>
                <div className="text-[10px] text-gray-500 flex flex-wrap gap-x-2">
                  {h.items.map((it: any, idx: number) => (
                    <span key={idx} className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                      {it.product?.name} {it.inventoryItem?.imei1 ? `(IMEI: ${it.inventoryItem.imei1})` : ""}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-right shrink-0 flex md:flex-col justify-between items-end gap-2">
                <div className="font-bold font-mono text-base text-red-600">
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
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
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
