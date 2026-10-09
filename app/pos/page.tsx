"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatKip } from "@/lib/utils";
import { getSession, SessionUser, getAuthHeaders } from "@/lib/session";
import PosReceiptPrint, { ReceiptData } from "@/components/pos/PosReceiptPrint";
import PosSellerAuthModal, { EmployeeOption } from "@/components/pos/PosSellerAuthModal";
import PosHistoryModal from "@/components/pos/PosHistoryModal";
import PosEditModal from "@/components/pos/PosEditModal";

type InvItem = {
  id: string;
  imei1: string;
  imei2: string | null;
  status: string;
  product: { id: string; name: string; sellPrice: string };
};

type CartLine = {
  key: string;
  productId?: string;
  productName: string;
  inventoryItemId?: string;
  imei1?: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  warrantyMonths: number;
};

export default function PosPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);

  const [barcode, setBarcode] = useState("");
  const [results, setResults] = useState<InvItem[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const [discountPct, setDiscountPct] = useState(0);
  const [vatPct, setVatPct] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [refNo, setRefNo] = useState("");
  const [invoiceNo] = useState(() => "AUTO");
  const [now, setNow] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editPrice, setEditPrice] = useState(0);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editWarrantyMonths, setEditWarrantyMonths] = useState(12);

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pinError, setPinError] = useState("");

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    setSession(s);
    setNow(new Date().toLocaleString("lo-LA"));

    fetch(`/api/employees?branchId=${s.branchId}`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEmployees(data);
          if (s.employeeId) setSelectedEmpId(s.employeeId);
        }
      })
      .catch(console.error);
  }, [router]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "F4") {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === "F8") {
        e.preventDefault();
        discountInputRef.current?.focus();
      } else if (e.key === "F9") {
        e.preventDefault();
        handleOpenCheckout();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart]);

  useEffect(() => {
    if (!session || barcode.trim().length < 3) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/inventory?branchId=${session.branchId}&status=IN_STOCK&imei=${encodeURIComponent(barcode)}`, {
        headers: getAuthHeaders(),
      })
        .then((r) => r.json())
        .then(setResults);
    }, 250);
    return () => clearTimeout(t);
  }, [barcode, session]);

  const subtotal = cart.reduce((s, l) => s + l.unitPrice * l.quantity - l.discount, 0);
  const afterDiscount = subtotal - (subtotal * discountPct) / 100;
  const vatAmount = (afterDiscount * vatPct) / 100;
  const total = Math.max(0, afterDiscount + vatAmount);

  function addImeiToCart(item: InvItem) {
    if (cart.some((l) => l.inventoryItemId === item.id)) return;
    setCart((c) => [
      ...c,
      {
        key: item.id,
        productId: item.product.id,
        productName: item.product.name,
        inventoryItemId: item.id,
        imei1: item.imei1,
        unitPrice: Number(item.product.sellPrice),
        quantity: 1,
        discount: 0,
        warrantyMonths: 12,
      },
    ]);
    setBarcode("");
    setResults([]);
  }

  function handleAddService() {
    const name = prompt("ໃສ່ຊື່ບໍລິການ ຫຼື ສິນຄ້າ:");
    if (!name) return;
    const priceStr = prompt("ໃສ່ລາຄາ (ກີບ):", "0");
    const price = Number(priceStr) || 0;

    const newKey = `svc-${Date.now()}`;
    setCart((c) => [
      ...c,
      {
        key: newKey,
        productName: name,
        unitPrice: price,
        quantity: 1,
        discount: 0,
        warrantyMonths: 0,
      },
    ]);
  }

  function openEditModal() {
    if (!selectedKey) {
      alert("ກະລຸນາກົດເລືອກລາຍການສິນຄ້າໃນຕາຕະລາງກ່ອນ!");
      return;
    }
    const item = cart.find((l) => l.key === selectedKey);
    if (!item) return;
    setEditPrice(item.unitPrice);
    setEditDiscount(item.discount);
    setEditWarrantyMonths(item.warrantyMonths);
    setIsEditOpen(true);
  }

  function saveEditItem() {
    if (!selectedKey) return;
    setCart((c) =>
      c.map((item) =>
        item.key === selectedKey
          ? {
              ...item,
              unitPrice: editPrice,
              discount: editDiscount,
              warrantyMonths: editWarrantyMonths,
            }
          : item
      )
    );
    setIsEditOpen(false);
  }

  function deleteSelected() {
    if (!selectedKey) {
      alert("ກະລຸນາກົດເລືອກລາຍການໃນຕາຕະລາງກ່ອນ!");
      return;
    }
    setCart((c) => c.filter((l) => l.key !== selectedKey));
    setSelectedKey(null);
  }

  const [checkoutStartTime, setCheckoutStartTime] = useState<number | null>(null);

  function handleOpenCheckout() {
    setMessage(null);
    if (cart.length === 0) {
      setMessage({ type: "err", text: "ຍັງບໍ່ມີສິນຄ້າໃນລາຍການຂາຍ" });
      return;
    }
    setCheckoutStartTime(Date.now());
    setPinCode("");
    setPinError("");
    setIsAuthModalOpen(true);
  }

  async function confirmAndSaveSale() {
    if (!session) return;
    if (!selectedEmpId) {
      setPinError("ກະລຸນາເລືອກຊື່ຜູ້ຂາຍ (Seller Name)");
      return;
    }

    const currentEmp = employees.find((e) => e.id === selectedEmpId);
    if (!currentEmp) {
      setPinError("ບໍ່ພົບຂໍ້ມູນຜູ້ຂາຍ");
      return;
    }

    if (currentEmp?.pinCode && currentEmp.pinCode !== pinCode) {
      setPinError("PIN Code ບໍ່ຖືກຕ້ອງ!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          branchId: session.branchId,
          employeeId: selectedEmpId,
          clientTimestamp: checkoutStartTime,
          items: cart.map((l) => ({
            productId: l.productId,
            inventoryItemId: l.inventoryItemId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            discount: l.discount,
            warrantyMonths: l.warrantyMonths,
          })),
          discount: subtotal - afterDiscount,
          vatPercent: vatPct,
          payments: [{ method: paymentMethod, amount: Math.round(total), refNo: refNo || undefined }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? data.message);

      const receipt: ReceiptData = {
        invoiceNo: data.invoiceNo || "INV-" + Date.now(),
        billNo: data.billNo,
        createdAt: new Date().toLocaleString("lo-LA"),
        customerName: customerName || "ລູກຄ້າທົ່ວໄປ",
        employeeName: currentEmp.fullName,
        employeeCode: currentEmp.empCode || "EMP-000",
        branchName: session.branchName,
        items: cart.map((l) => ({
          productName: l.productName,
          imei1: l.imei1,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discount: l.discount,
          warrantyMonths: l.warrantyMonths,
        })),
        subtotal,
        discount: subtotal - afterDiscount,
        vatAmount,
        total,
      };

      setLastReceipt(receipt);
      setMessage({ type: "ok", text: `[F9] ບັນທຶກໃບບິນ ${data.invoiceNo} (ຜູ້ຂາຍ: ${currentEmp.fullName}) ສຳເລັດ` });
      setCart([]);
      setDiscountPct(0);
      setVatPct(0);
      setRefNo("");
      setIsAuthModalOpen(false);

      setTimeout(() => {
        window.print();
      }, 500);
    } catch (e: any) {
      setPinError(e.message ?? "ບັນທຶກບໍ່ສຳເລັດ");
    } finally {
      setSubmitting(false);
    }
  }

  if (!session) return null;

  return (
    <div className="-m-6 md:-m-8 min-h-screen bg-gray-100 text-gray-900 relative print:p-0 print:m-0 print:bg-white font-sans">
      <div className="print:hidden">
        {/* ===== Top data bar ===== */}
        <div className="bg-[#e85a7a] px-4 py-2.5 grid grid-cols-1 md:grid-cols-4 gap-4 text-white text-xs shadow-sm">
          <div>
            <span className="opacity-90 text-[10px] block mb-0.5">ລູກຄ້າ (Customer)</span>
            <input
              className="w-full bg-white text-gray-900 border border-gray-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="ຂາຍປະຈຳ / ລູກຄ້າທົ່ວໄປ"
            />
          </div>
          <div>
            <span className="opacity-90 text-[10px] block mb-0.5">Invoice No.</span>
            <input className="w-full bg-white/90 text-gray-900 border border-gray-300 rounded px-2.5 py-1 font-mono text-xs" value={invoiceNo} disabled />
          </div>
          <div>
            <span className="opacity-90 text-[10px] block mb-0.5">DateTime (ວັນທີ)</span>
            <input className="w-full bg-white/90 text-gray-900 border border-gray-300 rounded px-2.5 py-1 font-mono text-[11px]" value={now} disabled />
          </div>
          <div>
            <span className="opacity-90 text-[10px] block mb-0.5">ສາຂາ / ຜູ້ Login ເຂົ້າລະບົບ</span>
            <input className="w-full bg-white/90 text-gray-900 border border-gray-300 rounded px-2.5 py-1 font-semibold text-xs" value={`${session.branchName} · ${session.fullName} (${session.role})`} disabled />
          </div>
        </div>

        {/* ===== Barcode / product search row ===== */}
        <div className="bg-[#f6d94a] border-b border-[#c9ac2c] px-4 py-2.5 flex flex-wrap items-center gap-3 relative shadow-sm">
          <span className="text-xs font-bold text-[#5a4400]">[F4] Barcode / IMEI</span>
          <input
            ref={barcodeInputRef}
            autoFocus
            className="flex-1 min-w-[220px] bg-white border border-[#c9ac2c] rounded-lg px-3 py-2 text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600 shadow-inner"
            placeholder="ສະແກນ ຫຼື ພິມ IMEI ແລ້ວກົດ Enter..."
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
          />

          <span className="text-xs text-[#5a4400] font-bold">[F8] ສ່ວນຫຼຸດ %</span>
          <input
            ref={discountInputRef}
            type="number"
            className="w-20 bg-white border border-[#c9ac2c] rounded-lg px-2.5 py-2 text-sm text-gray-900 font-mono text-center focus:outline-none focus:border-blue-600"
            value={discountPct}
            onChange={(e) => setDiscountPct(Number(e.target.value))}
          />

          {results.length > 0 && (
            <div className="absolute top-full left-4 right-4 z-20 bg-white border border-[#c9ac2c] rounded-xl shadow-2xl mt-1 max-h-72 overflow-y-auto">
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => addImeiToCart(r)}
                  className="w-full text-left px-4 py-2.5 hover:bg-amber-50 flex justify-between items-center border-b border-gray-200 last:border-0 transition-colors"
                >
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{r.product.name}</div>
                    <div className="font-mono text-xs text-red-600">IMEI: {r.imei1}</div>
                  </div>
                  <div className="font-mono text-sm font-bold text-blue-700">{formatKip(r.product.sellPrice)}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ===== Main grid ===== */}
        <div className="flex flex-col lg:flex-row border-b border-gray-300">
          <div className="flex-1 bg-white">
            <table className="w-full text-xs">
              <thead className="bg-gray-100 text-gray-700 border-b border-gray-300 font-semibold">
                <tr>
                  <th className="text-left px-3 py-2.5 w-8">#</th>
                  <th className="text-left px-3 py-2.5">ຊື່ສິນຄ້າ</th>
                  <th className="text-left px-3 py-2.5 font-mono">IMEI / Serial</th>
                  <th className="text-center px-3 py-2.5 w-24">ປະກັນ (ເດືອນ)</th>
                  <th className="text-right px-3 py-2.5 w-28">ລາຄາຂາຍ</th>
                  <th className="text-right px-3 py-2.5 w-24">ສ່ວນຫຼຸດ</th>
                  <th className="text-right px-3 py-2.5 w-28">ລວມຍ່ອຍ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cart.map((l, i) => (
                  <tr
                    key={l.key}
                    onClick={() => setSelectedKey(l.key)}
                    className={`cursor-pointer border-b border-gray-200 transition-colors ${
                      selectedKey === l.key ? "bg-amber-100 text-gray-900 font-semibold border-l-4 border-amber-500" : "hover:bg-gray-50 text-gray-800"
                    }`}
                  >
                    <td className="px-3 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-900">{l.productName}</td>
                    <td className="px-3 py-2.5 font-mono text-red-600">{l.imei1 ?? "-"}</td>
                    <td className="px-3 py-2.5 text-center font-mono text-emerald-700 font-bold">
                      {l.warrantyMonths > 0 ? `${l.warrantyMonths} ເດືອນ` : "ບໍ່ມີ"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">{formatKip(l.unitPrice)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-red-600">{formatKip(l.discount)}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-gray-900">
                      {formatKip(l.unitPrice * l.quantity - l.discount)}
                    </td>
                  </tr>
                ))}
                {cart.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-400 py-16">
                      🛒 ຍັງບໍ່ມີລາຍການສິນຄ້າ — ສະແກນ IMEI ຫຼື ພິມດ້ານເທິງ [F4] ເພື່ອເພີ່ມ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="bg-[#f6c9d8] text-center py-6 border-t border-gray-300">
              <span className="font-display text-4xl md:text-5xl font-black text-gray-800 tracking-wider uppercase italic">
                SALE (ຂາຍສິນຄ້າ)
              </span>
            </div>

            <div className="flex flex-wrap gap-2 p-3 bg-gray-100 border-t border-gray-300">
              <button className="bg-[#3f8fd6] hover:bg-[#2b6cb0] text-white font-bold text-xs px-4 py-2 rounded transition-colors shadow-sm" onClick={() => barcodeInputRef.current?.focus()}>
                + Add (ເພີ່ມສິນຄ້າ)
              </button>
              <button className="bg-[#3f8fd6] hover:bg-[#2b6cb0] text-white font-bold text-xs px-4 py-2 rounded transition-colors shadow-sm" onClick={handleAddService}>
                + Service
              </button>
              <button className="bg-[#f0ad4e] hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded transition-colors shadow-sm" onClick={openEditModal}>
                ✏️ Edit & Warranty
              </button>
              <button className="bg-[#e0605a] hover:bg-red-600 text-white font-bold text-xs px-4 py-2 rounded transition-colors shadow-sm" onClick={deleteSelected}>
                🗑️ Delete
              </button>
              <button className="bg-[#8a94a0] hover:bg-gray-600 text-white font-bold text-xs px-4 py-2 rounded transition-colors ml-auto shadow-sm" onClick={() => setIsHistoryOpen(true)}>
                📜 History (ປະຫວັດຂາຍ)
              </button>
            </div>
          </div>

          {/* ===== Right summary panel ===== */}
          <div className="w-full lg:w-80 bg-[#e9f5ee] border-l border-gray-300 p-4 space-y-3 text-xs">
            <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-sm">
              <div className="font-semibold text-gray-800 mb-1">IMEI ໃນລາຍການ:</div>
              <div className="max-h-28 overflow-y-auto space-y-1">
                {cart.filter((l) => l.imei1).map((l) => (
                  <div key={l.key} className="font-mono text-[11px] text-red-600 border-b border-gray-100 pb-1 flex justify-between">
                    <span>{l.imei1}</span>
                    <span className="text-emerald-700 font-bold text-[10px]">{l.warrantyMonths}m</span>
                  </div>
                ))}
                {cart.every((l) => !l.imei1) && <div className="text-gray-400 text-[11px]">-</div>}
              </div>
            </div>

            <div className="flex justify-between text-gray-700">
              <span>ຍອດຍ່ອຍ:</span>
              <span className="font-mono text-gray-900 font-semibold">{formatKip(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center text-gray-700">
              <span>ສ່ວນຫຼຸດ %:</span>
              <input
                type="number"
                className="w-16 bg-white text-gray-900 border border-gray-300 rounded px-2 py-1 text-right font-mono text-xs focus:outline-none"
                value={discountPct}
                onChange={(e) => setDiscountPct(Number(e.target.value))}
              />
            </div>

            <div className="flex justify-between items-center text-gray-700">
              <span>VAT %:</span>
              <input
                type="number"
                className="w-16 bg-white text-gray-900 border border-gray-300 rounded px-2 py-1 text-right font-mono text-xs focus:outline-none"
                value={vatPct}
                onChange={(e) => setVatPct(Number(e.target.value))}
              />
            </div>

            <div className="flex justify-between text-gray-700">
              <span>ຍອດ VAT:</span>
              <span className="font-mono text-gray-900 font-semibold">{formatKip(vatAmount)}</span>
            </div>

            <div className="border-t border-gray-300 pt-2 space-y-1.5">
              <span className="text-gray-700 block font-semibold">ຊ່ອງທາງຊຳລະ:</span>
              <select
                className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="CASH">ເງິນສົດ (Cash)</option>
                <option value="BCEL_ONE_QR">BCEL One QR</option>
                <option value="BANK_TRANSFER">ໂອນທະນາຄານ</option>
                <option value="CARD">ບັດ (Credit/Debit Card)</option>
              </select>
              {paymentMethod !== "CASH" && (
                <input
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-2.5 py-1.5 mt-1 text-xs"
                  placeholder="ເລກອ້າງອີງ / Ref No."
                  value={refNo}
                  onChange={(e) => setRefNo(e.target.value)}
                />
              )}
            </div>

            <div className="bg-white border-2 border-gray-800 rounded-xl p-3 flex justify-between items-center mt-2 shadow-md">
              <span className="font-display font-bold text-sm text-gray-900">ລວມທັງໝົດ</span>
              <span className="font-display font-black text-xl text-red-600 font-mono">{formatKip(total)}</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleOpenCheckout} className="flex-1 bg-[#f6d94a] hover:bg-yellow-400 text-[#3a2f1a] font-bold py-3 rounded-xl transition-colors text-sm shadow-md">
                [F9] OK (Save & Print)
              </button>
              <button onClick={() => setCart([])} className="bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-3 rounded-xl text-xs shadow-md">
                Clear
              </button>
            </div>

            {message && (
              <div className={`text-xs p-2.5 rounded-lg border font-semibold ${message.type === "ok" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-red-50 text-red-800 border-red-300"}`}>
                {message.text}
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <PosSellerAuthModal
          isOpen={isAuthModalOpen}
          employees={employees}
          selectedEmpId={selectedEmpId}
          setSelectedEmpId={setSelectedEmpId}
          pinCode={pinCode}
          setPinCode={setPinCode}
          submitting={submitting}
          pinError={pinError}
          onConfirm={confirmAndSaveSale}
          onClose={() => setIsAuthModalOpen(false)}
        />

        <PosEditModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          editPrice={editPrice}
          setEditPrice={setEditPrice}
          editDiscount={editDiscount}
          setEditDiscount={setEditDiscount}
          editWarrantyMonths={editWarrantyMonths}
          setEditWarrantyMonths={setEditWarrantyMonths}
          onSave={saveEditItem}
        />

        <PosHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          session={session}
          onSelectPrint={(receipt) => {
            setLastReceipt(receipt);
            setIsHistoryOpen(false);
            setTimeout(() => window.print(), 300);
          }}
        />
      </div>

      {/* Printable Receipt Template */}
      <PosReceiptPrint data={lastReceipt} />
    </div>
  );
}