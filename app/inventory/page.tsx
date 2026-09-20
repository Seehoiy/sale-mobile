"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ImeiChip from "@/components/ImeiChip";
import { getSession, SessionUser, isAdmin } from "@/lib/session";

type Branch = { id: string; name: string };
type InvItem = {
  id: string;
  imei1: string;
  imei2: string | null;
  status: string;
  product: { name: string };
  currentBranch: { name: string };
};

const STATUS_OPTIONS = [
  "",
  "IN_STOCK",
  "RESERVED",
  "TRANSFER_OUT",
  "IN_TRANSIT",
  "SOLD",
  "IN_REPAIR",
  "CLAIMED_OUT",
  "SECOND_HAND",
  "DAMAGED",
];

function InventoryContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "";

  const [session, setSession] = useState<SessionUser | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [imei, setImei] = useState("");
  const [items, setItems] = useState<InvItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = getSession();
    setSession(s);

    fetch("/api/branches")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBranches(data);
          if (s?.role === "ADMIN") {
            setBranchId("ALL");
          } else if (s?.branchId) {
            setBranchId(s.branchId);
          } else {
            setBranchId("ALL");
          }
        }
      });
  }, []);

  useEffect(() => {
    if (initialStatus) {
      setStatus(initialStatus);
    }
  }, [initialStatus]);

  useEffect(() => {
    if (!branchId) return;
    setLoading(true);
    const params = new URLSearchParams({ branchId });
    if (status) params.set("status", status);
    if (imei) params.set("imei", imei);

    fetch(`/api/inventory?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data);
      })
      .finally(() => setLoading(false));
  }, [branchId, status, imei]);

  const admin = isAdmin(session);

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 tracking-wide flex items-center gap-2">
            📦 ສາງສິນຄ້າ / IMEI (Stock Inspection)
          </h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1">
            {admin ? (
              <span className="text-blue-700 font-semibold">
                🛡️ ສິດ Admin: ສາມາດກວດເບິ່ງ ສະຕັອກລວມທຸກສາຂາ ຫຼື ແຍກຕາມສາຂາໄດ້
              </span>
            ) : (
              <span className="text-blue-600 font-semibold">
                🔒 ສິດ Store Manager: ຮັບສິດກວດເບິ່ງສະຕັອກສະເພາະສາຂາ {session?.branchName} ເທົ່ານັ້ນ
              </span>
            )}
          </p>
        </div>
        <a
          href="/receive"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm px-4 py-2.5 rounded-lg transition-colors shadow-md"
        >
          + ຮັບເຄື່ອງເຂົ້າສາງ (PO)
        </a>
      </div>

      {/* Filter toolbar */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        {/* Branch Filter */}
        <div className="w-64">
          <label className="text-gray-600 text-xs block mb-1 font-semibold">
            {admin ? "ເລືອກສາຂາ (Branch)" : "ສາຂາ (Locked)"}
          </label>
          <select
            disabled={!admin}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-blue-700 font-bold focus:outline-none disabled:opacity-80 cursor-pointer disabled:cursor-not-allowed"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            {admin && <option value="ALL">🌐 ທຸກສາຂາ (ສະຕັອກລວມ)</option>}
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                📍 {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-56">
          <label className="text-gray-600 text-xs block mb-1 font-semibold">ສະຖານະສິນຄ້າ</label>
          <select
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none cursor-pointer"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s || "ທຸກສະຖານະ"}
              </option>
            ))}
          </select>
        </div>

        {/* IMEI Search */}
        <div className="flex-1 min-w-[200px]">
          <label className="text-gray-600 text-xs block mb-1 font-semibold">ຄົ້ນຫາ IMEI</label>
          <input
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none"
            placeholder="ພິມ IMEI 1 ຫຼື IMEI 2..."
            value={imei}
            onChange={(e) => setImei(e.target.value)}
          />
        </div>
      </div>

      {loading && <div className="text-center text-gray-500 py-10">ກຳລັງໂຫຼດຂໍ້ມູນສະຕັອກ...</div>}
      {!loading && items.length === 0 && (
        <div className="text-center text-gray-900 py-10 bg-gray-50 border border-gray-200 rounded-xl font-medium">
          ບໍ່ພົບເຄື່ອງທີ່ກົງກັບເງື່ອນໄຂ
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => (
          <ImeiChip
            key={item.id}
            imei1={item.imei1}
            imei2={item.imei2}
            productName={item.product.name}
            status={item.status}
            branchName={item.currentBranch.name}
          />
        ))}
      </div>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-500">ກຳລັງໂຫຼດ...</div>}>
      <InventoryContent />
    </Suspense>
  );
}
