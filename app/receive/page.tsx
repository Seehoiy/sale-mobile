"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, SessionUser } from "@/lib/session";
import { formatKip } from "@/lib/utils";

type Product = { id: string; name: string; sku: string; sellPrice: string; costPrice: string; trackingType: string };

export default function ReceivePage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [imeiText, setImeiText] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    setSession(s);
    fetch("/api/products")
      .then((r) => r.json())
      .then((data: Product[]) => {
        if (Array.isArray(data)) {
          setProducts(data);
          if (data[0]) {
            setProductId(data[0].id);
            setCostPrice(data[0].costPrice || "0");
          }
        }
      });
  }, [router]);

  const selectedProduct = products.find((p) => p.id === productId);

  const imeiLines = imeiText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  async function submitReceive(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!session) return;
    if (!productId) {
      setMessage({ type: "err", text: "ກະລຸນາເລືອກລຸ້ນສິນຄ້າ" });
      return;
    }

    const isSerialized = selectedProduct?.trackingType === "SERIALIZED";

    // 🟢 1. Check IMEI ສຳລັບສິນຄ້າປະເພດ SERIALIZED
    if (isSerialized && imeiLines.length === 0) {
      alert("⚠️ ກະລຸນາໃສ່ເລກ IMEI ສິນຄ້າຢ່າງໜ້ອຍ 1 ໜ່ວຍກ່ອນຮັບເຂົ້າສາງ!");
      setMessage({ type: "err", text: "ກະລຸນາໃສ່ IMEI ຢ່າງໜ້ອຍ 1 ໜ່ວຍ" });
      return;
    }

    // 🟢 2. Check ຈຳນວນ ສຳລັບສິນຄ້າປະເພດ QUANTITY (ແກ້ໄຂ Syntax & Logic)
    if (!isSerialized && (!quantity || Number(quantity) <= 0)) {
      setMessage({ type: "err", text: "ກະລຸນາໃສ່ຈຳນວນສິນຄ້າໃຫ້ຖືກຕ້ອງ" });
      return;
    }

    const imeis = isSerialized
      ? imeiLines.map((line) => {
          const [imei1, imei2] = line.split(",").map((s) => s.trim());
          return { imei1, imei2: imei2 || undefined };
        })
      : undefined;

    setSubmitting(true);

    // Prepare JSON payload ເພື່ອປ້ອງກັນ API 400 Error
    const payload = {
      branchId: session.branchId,
      productId,
      employeeId: session.employeeId,
      costPrice: costPrice ? Number(costPrice) : 0,
      quantity: !isSerialized ? Number(quantity) : imeiLines.length,
      imeis: isSerialized ? imeis : undefined,
    };

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ຮັບເຄື່ອງເຂົ້າສາງບໍ່ສຳເລັດ");

      const totalItemsCount = isSerialized ? (data.createdItems?.length || imeiLines.length) : quantity;
      const unitText = isSerialized ? "ໜ່ວຍ" : "ຊິ້ນ";
      const poText = data.po?.poNumber ? ` (PO: ${data.po.poNumber})` : "";

      setMessage({
        type: "ok",
        text: `ຮັບເຂົ້າສາງສຳເລັດ ${totalItemsCount} ${unitText}${poText} — ພ້ອມຂາຍໃນ POS ໄດ້ທັນທີ`,
      });
      setImeiText("");
      setQuantity("1");
    } catch (err: any) {
      setMessage({ type: "err", text: err.message ?? "ຮັບເຄື່ອງເຂົ້າສາງບໍ່ສຳເລັດ" });
    } finally {
      setSubmitting(false);
    }
  }

  if (!session) return null;

  const isSerialized = selectedProduct?.trackingType === "SERIALIZED";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-6 space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 tracking-wide">
          🛍️ ຮັບເຄື່ອງເຂົ້າສາງ (Buy / Purchase Orders)
        </h1>
        <p className="text-blue-600 text-xs md:text-sm mt-1">
          ຮັບເຄື່ອງເຂົ້າສາງສາຂາ: <span className="text-amber-600 font-semibold">{session.branchName}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={submitReceive} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div>
            <label className="text-xs text-gray-700 font-medium block mb-1">ເລືອກສິນຄ້າ *</label>
            <select
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                const p = products.find((x) => x.id === e.target.value);
                if (p) setCostPrice(p.costPrice || "0");
              }}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — [{p.trackingType === "SERIALIZED" ? "ມີ IMEI" : "ນັບຈຳນວນ"}]
                </option>
              ))}
            </select>
            {products.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                ຍັງບໍ່ມີສິນຄ້າໃນລະບົບ — ໄປສ້າງລຸ້ນສິນຄ້າກ່ອນທີ່ໜ້າ{" "}
                <a href="/products" className="underline text-blue-600">
                  ຈັດການສິນຄ້າ
                </a>
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-700 font-medium block mb-1">ລາຄາຕົ້ນທຶນ ຕໍ່ໜ່ວຍ (₭)</label>
            <input
              type="number"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 font-mono focus:border-blue-500 focus:outline-none"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
            />
          </div>

          {/* 🟢 ແຍກ Display ຕາມປະເພດສິນຄ້າ */}
          {selectedProduct?.trackingType === "QUANTITY" ? (
            <div>
              <label className="text-xs text-gray-700 font-medium block mb-1">ຈຳນວນຮັບເຂົ້າສາງ (ອັນ/ຊິ້ນ) *</label>
              <input
                type="number"
                min="1"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 font-mono focus:border-blue-500 focus:outline-none"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <label className="text-xs text-gray-700 font-medium block mb-1">
                ລາຍການ IMEI (1 ແຖວ = 1 ໜ່ວຍ — ຖ້າມີ IMEI2 ໃຫ້ຂຽນຄັ່ນດ້ວຍ comma ເຊັ່ນ <span className="font-mono text-amber-600">imei1,imei2</span>)
              </label>
              <textarea
                className={`w-full bg-white border rounded-lg p-3 text-xs font-mono text-gray-900 h-40 focus:border-blue-500 focus:outline-none ${
                  imeiLines.length === 0 && message?.type === "err"
                    ? "border-red-500 ring-2 ring-red-500/20"
                    : "border-gray-300"
                }`}
                placeholder={"356789101112131\n356789101112132,356789101112133"}
                value={imeiText}
                onChange={(e) => setImeiText(e.target.value)}
              />
              <div className="text-xs text-gray-500 mt-1 font-mono">ກວດພົບ: {imeiLines.length} ໜ່ວຍ</div>
            </div>
          )}

          <button
            disabled={submitting || products.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm shadow-md"
          >
            {submitting
              ? "ກຳລັງຮັບເຂົ້າສາງ..."
              : `+ ຮັບເຂົ້າສາງ ${isSerialized ? imeiLines.length : quantity} ${isSerialized ? "ໜ່ວຍ" : "ຊິ້ນ"}`}
          </button>

          {message && (
            <div
              className={`text-xs p-2.5 rounded-lg ${
                message.type === "ok"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}
        </form>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-sm">
          <h3 className="font-display font-semibold text-lg text-gray-900">📌 ລາຍລະອຽດສິນຄ້າທີ່ເລືອກ</h3>
          {selectedProduct ? (
            <div className="text-xs space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="text-gray-900 font-bold text-sm">{selectedProduct.name}</div>
              <div className="text-gray-600 font-mono">SKU: {selectedProduct.sku}</div>
              <div className="text-gray-600">
                ປະເພດ:{" "}
                <span className="font-semibold text-blue-600">
                  {selectedProduct.trackingType === "SERIALIZED" ? "ມີ IMEI" : "ນັບຈຳນວນ (QUANTITY)"}
                </span>
              </div>
              <div className="mt-2 text-xs">
                <span className="text-gray-600">ລາຄາຂາຍ: </span>
                <span className="font-mono text-amber-600 font-bold">{formatKip(selectedProduct.sellPrice)}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-xs">ຍັງບໍ່ໄດ້ເລືອກລຸ້ນສິນຄ້າ</p>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-600 space-y-2">
            <p className="text-gray-900 font-semibold">ຂັ້ນຕອນການນຳເຂົ້າສິນຄ້າ:</p>
            <p>1. ສ້າງລຸ້ນສິນຄ້າກ່ອນ (ໜ້າ ຈັດການສິນຄ້າ)</p>
            <p>2. <span className="text-blue-600 font-semibold">ຮັບເຄື່ອງເຂົ້າສາງທີ່ໜ້ານີ້</span></p>
            <p>3. ໄປໜ້າ <span className="text-blue-600 font-semibold">POS (ຂາຍໜ້າຮ້ານ)</span> ເພື່ອອອກໃບບິນ</p>
          </div>
        </div>
      </div>
    </div>
  );
}