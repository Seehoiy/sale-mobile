"use client";

import { useEffect, useState } from "react";
import { getSession, SessionUser } from "@/lib/session";

type Branch = { id: string; name: string };
type Customer = { id: string; fullName: string; phone?: string | null };
type InventoryItem = {
  id: string;
  imei1?: string | null;
  product?: { name: string };
};
type ClaimRequest = {
  id: string;
  claimNo: string;
  deviceDescription: string;
  issue: string;
  status: string;
  customer: { fullName: string };
  branch?: { name: string };
};

const CLAIM_COLUMNS = ["RECEIVED", "SENT_TO_CENTER", "REPAIRED", "COMPLETED"];

const CLAIM_COLUMN_LABEL: Record<string, string> = {
  RECEIVED: "ຮັບເລື່ອງເຄລມ (Received)",
  SENT_TO_CENTER: "ສົ່ງເຂົ້າສູນ (Sent to Center)",
  REPAIRED: "ສ້ອມແປງແລ້ວ/ຮອດຮ້ານ (Repaired)",
  COMPLETED: "ສົ່ງມອບໃຫ້ລູກຄ້າ (Completed)",
};

export default function ClaimsPage() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  // Customer Search States
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [customerLoading, setCustomerLoading] = useState(false);

  // Form State
  const [form, setForm] = useState({
    deviceDescription: "",
    issue: "",
    inventoryItemId: "",
  });

  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function loadClaims(bId: string) {
    const url = bId && bId !== "" ? `/api/claims?branchId=${bId}` : "/api/claims";
    console.log("Loading form URL:", url);

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
         console.log("Loaded claims:", data); 
        if (Array.isArray(data)) { 
            setClaims(data)
        } else {
            console.error("error API:", data);
        }
      })
      .catch((err) => console.error("Load claims error:", err));
  }

  useEffect(() => {
    const s = getSession();
    setSession(s);

    // ດຶງຂໍ້ມູນສິນຄ້າໃນສະຕັອກ
    fetch("/api/inventory")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setInventoryItems(data);
      })
      .catch((err) => console.error("Load inventory error:", err));

    fetch("/api/branches")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0){
          setBranches(data);
          const initialBranch = s?.branchId || data[0]?.id || "";
          setBranchId(initialBranch);
        }
      })
      .catch((err) => console.error("Load branches error:", err));
  }, []);

  // Load Claims
  useEffect(() => {
    loadClaims(branchId);
    }, [branchId]);

    //Search Customers
    useEffect(() => {
        if (!customerSearch.trim()) {
            setCustomers([]);
            return;
        }
    
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customers?search=${encodeURIComponent(customerSearch.trim())}`);
        const data = await res.json();
        if (Array.isArray(data)) setCustomers(data);
        else setCustomers([]);
      } catch (error) {
        console.error("Customer search error:", error);
        setCustomers([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customerSearch]);

  async function createClaim(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!selectedCustomer) {
      setMessage({ type: "err", text: "ກະລຸນາຄົ້ນຫາ ແລະ ເລືອກລູກຄ້າສຳລັບການເຄລມ" });
      return;
    }

    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          customerId: selectedCustomer.id,
          inventoryItemId: form.inventoryItemId,
          deviceDescription: form.deviceDescription,
          issueDescription: form.issue,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ບໍ່ສາມາດບັນທຶກການເຄລມໄດ້");

      setMessage({ type: "ok", text: `ບັນທຶກໃບເຄລມ ${data.claimNo || ""} ສຳເລັດ` });
      setSelectedCustomer(null);
      setCustomerSearch("");
      setCustomers([]);
      setForm({ deviceDescription: "", issue: "", inventoryItemId: "" });
      loadClaims(branchId);
    } catch (err: any) {
      setMessage({ type: "err", text: err.message ?? "ບໍ່ສຳເລັດ" });
    }
  }

  async function moveStatus(claimId: string, status: string) {
    try {
      const res = await fetch(`/api/claims/${claimId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "ປ່ຽນສະຖານະບໍ່ສຳເລັດ");
      }
      loadClaims(branchId);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function createCustomer() {
    if (!newCustomerName.trim()) {
      alert("ກະລຸນາປ້ອນຊື່ລູກຄ້າ");
      return;
    }

    setCustomerLoading(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newCustomerName.trim(),
          phone: newCustomerPhone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ບໍ່ສາມາດເພີ່ມລູກຄ້າ");

      setSelectedCustomer(data);
      setCustomerSearch("");
      setCustomers([]);
      setShowNewCustomer(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
    } catch (error: any) {
      alert(error.message || "ເກີດຂໍ້ຜິດພາດ");
    } finally {
      setCustomerLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4 md:p-6 space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-blue-700 tracking-wide">
          🛡️ ຈັດການການເຄລມປະກັນ (Warranty Claims)
        </h1>
        <p className="text-gray-600 text-xs md:text-sm mt-1">
          Received ➔ Sent to Center ➔ Repaired ➔ Completed
        </p>
      </div>

      <select
      className="w-full bg-white border border-gray-300 ounder-lg px-3 py-2 text-xs text-gray-800 focus:outline-none" 
      onChange={(e) => {
        setBranchId(e.target.value);
        loadClaims(e.target.value);
      }}
      >
        <option value="">🌐 ທຸກສາຂາ (All Branches)</option>
        {branches.map((b) => (
            <option key={b.id} value={b.id}>
                {b.name}
            </option>
        ))}
      </select>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Form ບັນທຶກເຄລມ */}
        <form onSubmit={createClaim} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 lg:col-span-1 shadow-xl">
          <h3 className="font-display font-semibold text-lg text-gray-800 border-b border-gray-200 pb-2">
            + ບັນທຶກເຄລມໃໝ່
          </h3>

          <div>
            <label className="text-xs text-gray-700 block mb-1">ສາຂາ</label>
            <select
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none"
              value={branchId}
              onChange={(e) => {
                setBranchId(e.target.value);
                loadClaims(e.target.value);
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
            <label className="text-xs text-gray-700 block mb-1">ເລືອກສິນຄ້າ / IMEI ໃນສະຕັອກ *</label>
            <select
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none"
              value={form.inventoryItemId}
              onChange={(e) => setForm({ ...form, inventoryItemId: e.target.value })}
              required
            >
              <option value="">-- ເລືອກສິນຄ້າ --</option>
              {inventoryItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.product?.name ?? "ສິນຄ້າ"} {item.imei1 ? `(IMEI: ${item.imei1})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Search Section */}
          <div className="relative">
            <label className="text-xs text-gray-700 block mb-1">ລູກຄ້າ *</label>
            {selectedCustomer ? (
              <div className="border border-blue-500 bg-blue-50 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-sm text-gray-800">{selectedCustomer.fullName}</div>
                    {selectedCustomer.phone && (
                      <div className="text-[11px] text-gray-600 mt-1">📞 {selectedCustomer.phone}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerSearch("");
                    }}
                    className="text-red-500 font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                  placeholder="ພິມຊື່ / ID / ເບີໂທ..."
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowNewCustomer(false);
                  }}
                />

                {customerSearch.trim() && (
                  <div className="absolute z-[100] left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl overflow-hidden">
                    {customers.length > 0 ? (
                      customers.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setCustomerSearch("");
                            setCustomers([]);
                            setShowNewCustomer(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100"
                        >
                          <div className="text-sm font-semibold text-gray-800">{customer.fullName}</div>
                          {customer.phone && <div className="text-[11px] text-gray-500">📞 {customer.phone}</div>}
                        </button>
                      ))
                    ) : (
                      <div className="p-3">
                        <div className="text-xs text-gray-500 mb-2">ບໍ່ພົບລູກຄ້າ</div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewCustomer(true);
                            setNewCustomerName(customerSearch);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg"
                        >
                          + ເພີ່ມລູກຄ້າໃໝ່
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {showNewCustomer && !selectedCustomer && (
              <div className="mt-2 border border-blue-300 bg-blue-50 rounded-lg p-3 space-y-2">
                <div className="text-xs font-bold text-blue-700">+ ເພີ່ມລູກຄ້າໃໝ່</div>
                <input
                  type="text"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800"
                  placeholder="ຊື່ລູກຄ້າ"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                />
                <input
                  type="text"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800"
                  placeholder="ເບີໂທ"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={customerLoading}
                    onClick={createCustomer}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg"
                  >
                    {customerLoading ? "ກຳລັງບັນທຶກ..." : "✓ ບັນທຶກ"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCustomer(false)}
                    className="px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-lg"
                  >
                    ຍົກເລີກ
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-700 block mb-1">ລຸ້ນເຄື່ອງ / ລາຍລະອຽດ *</label>
            <input
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none"
              placeholder="ເຊັ່ນ: iPhone 13 128GB"
              value={form.deviceDescription}
              onChange={(e) => setForm({ ...form, deviceDescription: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-700 block mb-1">ອາການ / ເຫດຜົນເຄລມ *</label>
            <textarea
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 h-24 focus:outline-none"
              placeholder="ລະບຸອາການເສຍ ຫຼື ບັນຫາ..."
              value={form.issue}
              onChange={(e) => setForm({ ...form, issue: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors text-xs"
          >
            + ບັນທຶກການເຄລມ
          </button>

          {message && (
            <div className={`text-xs p-2 rounded ${message.type === "ok" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
              {message.text}
            </div>
          )}
        </form>

        {/* Kanban Board ສໍາລັບ Claims */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {CLAIM_COLUMNS.map((col) => (
            <div key={col} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
              <div className="text-xs font-bold text-gray-800 border-b border-gray-200 pb-2 mb-3">
                {CLAIM_COLUMN_LABEL[col]}
              </div>

              <div className="space-y-2">
                {claims
                  .filter((c) => c.status === col)
                  .map((c) => (
                    <div key={c.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1 shadow-sm">
                      <div className="text-sm font-semibold text-gray-900">{c.deviceDescription}</div>
                      <div className="font-mono text-[11px] text-amber-600 font-bold">{c.claimNo}</div>
                      <div className="text-[11px] text-blue-600 font-medium">👤 {c.customer?.fullName || "ລູກຄ້າ"}</div>
                      <div className="text-xs text-gray-600 line-clamp-2">{c.issue}</div>

                      <div className="flex gap-1 mt-3 flex-wrap border-t border-gray-200 pt-2">
                        {CLAIM_COLUMNS.filter((next) => next !== col).map((next) => (
                          <button
                            key={next}
                            type="button"
                            onClick={() => moveStatus(c.id, next)}
                            className="text-[9px] bg-gray-200 hover:bg-blue-600 hover:text-white text-gray-700 px-1.5 py-1 rounded border border-gray-300 transition-colors"
                          >
                            ➔ {CLAIM_COLUMN_LABEL[next].split(" ")[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}