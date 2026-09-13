"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";

type Branch = { id: string; name: string };
type Transfer = {
  id: string;
  transferNo: string;
  status: string;
  fromBranch: { name: string };
  toBranch: { name: string };
  items: { inventoryItem?: { imei1: string } | null; product?: { name: string } | null; quantity?: number | null }[];
};

export default function TransfersPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [fromBranchId, setFromBranchId] = useState("");
  const [toBranchId, setToBranchId] = useState("");
  const [imei, setImei] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function loadTransfers() {
    fetch("/api/transfers")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTransfers(data);
      });
  }

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBranches(data);
          if (data[0]) setFromBranchId(data[0].id);
          if (data[1]) setToBranchId(data[1].id);
        }
      });
    loadTransfers();
  }, []);

  async function createTransfer(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      const search = await fetch(`/api/inventory?branchId=${fromBranchId}&status=IN_STOCK&imei=${imei}`).then((r) =>
        r.json()
      );
      if (!search[0]) throw new Error("ບໍ່ພົບ IMEI ນີ້ໃນສາງຕົ້ນທາງ (ຫຼືບໍ່ພ້ອມໂອນ)");

      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromBranchId, toBranchId, items: [{ inventoryItemId: search[0].id }] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(`ສ້າງໃບໂອນ ${data.transferNo} ສຳເລັດ`);
      setImei("");
      loadTransfers();
    } catch (err: any) {
      setMessage(err.message);
    }
  }

  async function receive(id: string) {
    await fetch(`/api/transfers/${id}/receive`, { method: "POST" });
    loadTransfers();
  }

  return (
    <div className="min-h-screen bg-white text-gray-100 p-4 md:p-6 space-y-6">
      <div className="border-b border-neutral-800 pb-4">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-blue-500 tracking-wide">
          🔄 ໂອນຍ້າຍສິນຄ້າລະຫວ່າງສາຂາ (Stock Transfers)
        </h1>
        <p className="text-gray-600 text-xs md:text-sm mt-1">
          ໂອນ IMEI ຈາກສາງສາຂາໜຶ່ງໄປອີກສາຂາໜຶ່ງ ພ້ອມບັນທຶກປະຫວັດອັດໂນມັດ
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={createTransfer} className="bg-white border border-neutral-800 rounded-xl p-5 space-y-3 shadow-xl">
          <h3 className="font-display font-semibold text-lg text-gray-700 border-b border-neutral-800 pb-2">
            + ຂໍໂອນເຄື່ອງ / IMEI
          </h3>

          <div>
            <label className="text-xs text-gray-500 block mb-1">ຈາກສາຂາ (ຕົ້ນທາງ)</label>
            <select
              className="w-full bg-white border border-neutral-700 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none"
              value={fromBranchId}
              onChange={(e) => setFromBranchId(e.target.value)}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-center text-gray-700 font-bold text-sm">⬇ ໂອນໄປ ⬇</div>

          <div>
            <label className="text-xs text-gray-700 block mb-1">ໄປສາຂາ (ປາຍທາງ)</label>
            <select
              className="w-full bg-white border border-neutral-700 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none"
              value={toBranchId}
              onChange={(e) => setToBranchId(e.target.value)}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-700 block mb-1">IMEI ທີ່ຈະໂອນ *</label>
            <input
              className="w-full bg-white border border-neutral-700 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 focus:border-amber-400 focus:outline-none"
              placeholder="ສະແກນ ຫຼື ພິມ IMEI..."
              value={imei}
              onChange={(e) => setImei(e.target.value)}
            />
          </div>

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors text-xs">
            + ສ້າງໃບໂອນເຄື່ອງ
          </button>
          {message && <p className="text-xs text-emerald-400">{message}</p>}
        </form>

        <div className="lg:col-span-2 space-y-3">
          <h3 className="font-display font-semibold text-lg text-white">ໃບໂອນຍ້າຍທັງໝົດ ({transfers.length})</h3>
          {transfers.map((t) => (
            <div key={t.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex justify-between items-center hover:border-neutral-700 transition-colors">
              <div>
                <div className="text-sm font-bold font-mono text-amber-400">{t.transferNo}</div>
                <div className="text-xs text-gray-300 mt-0.5">
                  {t.fromBranch.name} ➔ <span className="text-emerald-400 font-semibold">{t.toBranch.name}</span>
                </div>
                <div className="text-[11px] text-cyan-400 font-mono mt-1">
                  {t.items.map((it) => it.inventoryItem?.imei1 ?? `${it.product?.name} x${it.quantity}`).join(", ")}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={t.status} />
                {t.status === "IN_TRANSIT" && (
                  <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold" onClick={() => receive(t.id)}>
                    ✓ ຢືນຢັນຮັບເຄື່ອງ
                  </button>
                )}
              </div>
            </div>
          ))}
          {transfers.length === 0 && <p className="text-gray-900 text-xs">ບໍ່ມີລາຍການໂອນຍ້າຍ</p>}
        </div>
      </div>
    </div>
  );
}
