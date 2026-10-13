"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { formatKip } from "@/lib/utils";
import { getSession, SessionUser } from "@/lib/session";

type Branch = { id: string; name: string };
type Product = { id: string; name: string };
type Customer = {id: string; fullName: string; phone?: string};
type TradeIn = {
  id: string;
  tradeInNo: string;
  deviceDescription: string;
  offeredPrice: string;
  status: string;
  customer: { fullName: string };
};

export default function TradeInPage() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tradeIns, setTradeIns] = useState<TradeIn[]>([]);
  const [form, setForm] = useState({
    branchId: "",
    customerId: "",
    employeeId: "",
    deviceDescription: "",
    batteryHealth: "",
    screenCondition: "ດີ",
    offeredPrice: "",
    idCardImageFront: "https://placehold.co/400x250?text=ID+Card",
    customerPhoto: "https://placehold.co/300x300?text=Customer+Photo",
  });
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertForm, setConvertForm] = useState({ productId: "", imei1: "" });

  function loadTradeIns(branchId: string) {
    fetch(`/api/trade-in${branchId ? `?branchId=${branchId}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTradeIns(data);
      });
  }

  useEffect(() => {
    const s = getSession();
    setSession(s);

    fetch("/api/branches")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBranches(data);
          const initialBranch = s?.branchId || data[0]?.id || "";
          setForm((f) => ({ ...f, branchId: initialBranch, employeeId: s?.employeeId || "" }));
          loadTradeIns(initialBranch);
        }
      });

    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      });
      
      fetch("/api/customers")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCustomers(data);
      })
 }, []);

  async function submitTradeIn(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await fetch("/api/trade-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          offeredPrice: Number(form.offeredPrice),
          batteryHealth: form.batteryHealth ? Number(form.batteryHealth) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: "ok", text: `ບັນທຶກການປະເມີນ ${data.tradeInNo} ສຳເລັດ` });
      loadTradeIns(form.branchId);
    } catch (err: any) {
      setMessage({ type: "err", text: err.message ?? "ບໍ່ສຳເລັດ" });
    }
  }

  async function convert(tradeInId: string) {
    try {
      const res = await fetch(`/api/trade-in/${tradeInId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...convertForm, employeeId: form.employeeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setConvertingId(null);
      setConvertForm({ productId: "", imei1: "" });
      loadTradeIns(form.branchId);
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-100 p-4 md:p-6 space-y-6">
      <div className="border-b border-neutral-800 pb-4">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-white tracking-wide">
          📱 ຮັບເທິນ / ຮັບຊື້ເຄື່ອງເກົ່າ (Trade-In)
        </h1>
        <p className="text-gray-700 text-xs md:text-sm mt-1">
          ບັນທຶກການປະເມີນພ້ອມ KYC ➔ ແປງເປັນສະຕັອກ Second-Hand ອັດໂນມັດ
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={submitTradeIn} className="bg-white border border-neutral-800 rounded-xl p-5 space-y-3 shadow-xl">
          <h3 className="font-display font-semibold text-lg text-blue-700 border-b border-neutral-800 pb-2">
            + ປະເມີນເຄື່ອງໃໝ່
          </h3>

          <div>
            <label className="text-xs text-gray-700 block mb-1">ສາຂາ</label>
            <select
              className="w-full bg-white border border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none"
              value={form.branchId}
              onChange={(e) => {
                setForm({ ...form, branchId: e.target.value });
                loadTradeIns(e.target.value);
              }}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-700 block mb-1">ເລືອກລູກຄ້າ (KYC) *</label>
            <select
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none"
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              required
            >
              <option value="">-- ເລືອກລູກຄ້າ --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} {c.phone ? `(${c.phone})` : ""}
                </option>
              ))}
            </select>
          </div>

          <input
            className="w-full bg-white border border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none"
            placeholder="ລາຍລະອຽດເຄື່ອງ ເຊັ່ນ iPhone 12 128GB"
            value={form.deviceDescription}
            onChange={(e) => setForm({ ...form, deviceDescription: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              className="bg-white border border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none"
              placeholder="ແບັດເຕີຣີ %"
              value={form.batteryHealth}
              onChange={(e) => setForm({ ...form, batteryHealth: e.target.value })}
            />
            <input
              className="bg-white border border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none"
              placeholder="ສະພາບໜ້າຈໍ"
              value={form.screenCondition}
              onChange={(e) => setForm({ ...form, screenCondition: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs text-gray-700 block mb-1">ລາຄາທີ່ຈະໃຫ້ລູກຄ້າ (₭) *</label>
            <input
              type="number"
              className="w-full bg-white border border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-700 font-mono font-bold focus:outline-none"
              placeholder="0 ₭"
              value={form.offeredPrice}
              onChange={(e) => setForm({ ...form, offeredPrice: e.target.value })}
            />
          </div>

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors text-sm">
            + ບັນທຶກການປະເມີນ
          </button>

          {message && (
            <div className={`text-xs p-2.5 rounded-lg ${message.type === "ok" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-red-950 text-red-400 border border-red-800"}`}>
              {message.text}
            </div>
          )}
        </form>

        <div className="space-y-3">
          <h3 className="font-display font-semibold text-lg text-white">ລາຍການປະເມີນ ({tradeIns.length})</h3>
          {tradeIns.map((t) => (
            <div key={t.id} className="bg-white border border-neutral-800 rounded-xl p-4 hover:border-neutral-700 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-semibold text-white">{t.deviceDescription}</div>
                  <div className="text-xs text-gray-400 font-mono mt-0.5">
                    {t.tradeInNo} · {t.customer?.fullName || "ລູກຄ້າທົ່ວໄປ"}
                  </div>
                  <div className="font-mono text-amber-400 font-bold text-sm mt-1">{formatKip(t.offeredPrice)}</div>
                </div>
                <StatusBadge status={t.status} />
              </div>

              {t.status === "EVALUATED" &&
                (convertingId === t.id ? (
                  <div className="mt-3 space-y-2 border-t border-neutral-800 pt-3">
                    <select
                      className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-xs text-white"
                      value={convertForm.productId}
                      onChange={(e) => setConvertForm({ ...convertForm, productId: e.target.value })}
                    >
                      <option value="">-- ເລືອກລຸ້ນສິນຄ້າໃນລະບົບ --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-xs font-mono text-white"
                      placeholder="IMEI ໃໝ່ສຳລັບເຄື່ອງມືສອງນີ້"
                      value={convertForm.imei1}
                      onChange={(e) => setConvertForm({ ...convertForm, imei1: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded font-semibold flex-1" onClick={() => convert(t.id)}>
                        ຢືນຢັນເຂົ້າສະຕັອກ
                      </button>
                      <button className="bg-neutral-800 text-gray-300 text-xs px-3 py-1.5 rounded font-semibold" onClick={() => setConvertingId(null)}>
                        ຍົກເລີກ
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="mt-3 bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-xs px-3 py-1.5 rounded-lg font-semibold w-full text-left" onClick={() => setConvertingId(t.id)}>
                    ➔ ແປງເປັນສະຕັອກ Second-Hand
                  </button>
                ))}
            </div>
          ))}
          {tradeIns.length === 0 && <p className="text-gray-800 text-xs">ບໍ່ມີລາຍການປະເມີນ</p>}
        </div>
      </div>
    </div>
  );
}
