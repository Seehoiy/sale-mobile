"use client";

import { useEffect, useRef, useState } from "react";
import { formatKip } from "@/lib/utils";

type Category = { id: string; name: string };
type Brand = { id: string; name: string };
type Product = {
  id: string;
  sku: string;
  name: string;
  costPrice: string;
  sellPrice: string;
  trackingType: string;
  isActive: boolean;
  brand: { name: string } | null;
  category: { name: string };
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [query, setQuery] = useState("");
  const firstQueryRender = useRef(true);

  const [form, setForm] = useState({
    sku: "",
    name: "",
    categoryId: "",
    brandId: "",
    trackingType: "SERIALIZED",
    costPrice: "",
    sellPrice: "",
  });

  const [newCategory, setNewCategory] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ name: "", categoryId: "", brandId: "", costPrice: "", sellPrice: "" });

  // State ສຳລັບ Brand Modal
  const [showBrandManager, setShowBrandManager] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [editingBrandName, setEditingBrandName] = useState("");

  // State ສຳລັບ Category Modal
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  function loadProducts(q?: string) {
    fetch(`/api/products${q ? `?query=${encodeURIComponent(q)}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      });
  }

  function loadCategories() {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: Category[]) => {
        if (Array.isArray(data)) {
          setCategories(data);
          setForm((f) => (f.categoryId ? f : { ...f, categoryId: data[0]?.id ?? "" }));
        }
      });
  }

  function loadBrands() {
    fetch("/api/brands")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBrands(data);
      });
  }

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadBrands();
  }, []);

  useEffect(() => {
    if (firstQueryRender.current) {
      firstQueryRender.current = false;
      return;
    }

    const timer = setTimeout(() => loadProducts(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  async function addCategory() {
    if (!newCategory.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory }),
    });
    if (res.ok) {
      setNewCategory("");
      loadCategories();
    }
  }

  async function addBrand() {
    if (!newBrand.trim()) return;
    const res = await fetch("/api/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newBrand }),
    });
    if (res.ok) {
      setNewBrand("");
      loadBrands();
    }
  }

  async function saveEditBrand(id: string) {
    if (!editingBrandName.trim()) return;
    try {
      const res = await fetch(`/api/brands/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingBrandName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ແກ້ໄຂບໍ່ສຳເລັດ");
      setEditingBrandId(null);
      setShowBrandManager(false);
      loadBrands();
      loadProducts(query);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function deleteBrand(id: string, name: string) {
    if (!confirm(`ທ່ານຕ້ອງການລົບຍີ່ຫໍ້ "${name}" ແທ້ ຫຼື ບໍ່?`)) return;
    try {
      const res = await fetch(`/api/brands/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ລົບບໍ່ສຳເລັດ");
      if (form.brandId === id) setForm({ ...form, brandId: "" });
      setShowBrandManager(false);
      loadBrands();
      loadProducts(query);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function saveEditCategory(id: string) {
    if (!editingCategoryName.trim()) return;
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingCategoryName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ແກ້ໄຂບໍ່ສຳເລັດ");
      setEditingCategoryId(null);
      setShowBrandManager(false);
      loadCategories();
      loadProducts(query);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function deleteCategory(id: string, name: string) {
    if (!confirm(`ທ່ານຕ້ອງການລົບໝວດໝູ່ "${name}" ແທ້ ຫຼື ບໍ່?`)) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ລົບບໍ່ສຳເລັດ");
      if (form.categoryId === id) setForm({ ...form, categoryId: "" });
      setShowBrandManager(false);
      loadCategories();
      loadProducts(query);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!form.sku || !form.name || !form.categoryId || !form.costPrice || !form.sellPrice) {
      setMessage({ type: "err", text: "ກະລຸນາຕື່ມຂໍ້ມູນທີ່ຈຳເປັນໃຫ້ຄົບ (SKU, ຊື່, ໝວດໝູ່, ລາຄາ)" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          brandId: form.brandId || undefined,
          costPrice: Number(form.costPrice),
          sellPrice: Number(form.sellPrice),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: "ok", text: `ເພີ່ມສິນຄ້າ "${data.name}" ສຳເລັດ` });
      setForm({ ...form, sku: "", name: "", costPrice: "", sellPrice: "" });
      loadProducts(query);
    } catch (err: any) {
      setMessage({ type: "err", text: err.message ?? "ເພີ່ມສິນຄ້າບໍ່ສຳເລັດ (SKU ອາດຊ້ຳ)" });
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setEdit({
      name: p.name,
      categoryId: categories.find((c) => c.name === p.category.name)?.id ?? "",
      brandId: brands.find((b) => b.name === p.brand?.name)?.id ?? "",
      costPrice: p.costPrice,
      sellPrice: p.sellPrice,
    });
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: edit.name,
        categoryId: edit.categoryId || undefined,
        brandId: edit.brandId || undefined,
        costPrice: Number(edit.costPrice),
        sellPrice: Number(edit.sellPrice),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      return;
    }
    setEditingId(null);
    loadProducts(query);
  }

  async function toggleActive(p: Product) {
    await fetch(`/api/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    loadProducts(query);
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4 md:p-6 space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 tracking-wide">
          📱 ຈັດການສິນຄ້າ / ລຸ້ນໂທລະສັບ
        </h1>
        <p className="text-blue-700 font-semibold">
          ເພີ່ມ, ແກ້ໄຂລາຄາ, ແລະ ເປີດ/ປິດການຂາຍ ຂອງແຕ່ລະລຸ້ນສິນຄ້າ (SKU)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={createProduct} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-sm">
          <h3 className="font-display font-semibold text-lg text-blue-700 border-b border-gray-200 pb-2">
            + ເພີ່ມສິນຄ້າ / ລຸ້ນໃໝ່
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-700 block mb-1 font-medium">SKU (ບໍ່ຊ້ຳ) *</label>
              <input
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 font-mono focus:border-blue-600 focus:outline-none"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-700 block mb-1 font-medium">ປະເພດການຕິດຕາມ</label>
              <select
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
                value={form.trackingType}
                onChange={(e) => setForm({ ...form, trackingType: e.target.value })}
              >
                <option value="SERIALIZED">ມີ IMEI (ໂທລະສັບ)</option>
                <option value="QUANTITY">ນັບຈຳນວນ (ອຸປະກອນເສີມ/ອາໄຫຼ່)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-700 block mb-1 font-medium">ຊື່ສິນຄ້າ *</label>
            <input
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
              placeholder="ເຊັ່ນ iPhone 15 Pro Max 256GB"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-gray-700 font-medium">ໝວດໝູ່ *</label>
                <button
                  type="button"
                  onClick={() => setShowCategoryManager(true)}
                  className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
                >
                  ⚙️ ຈັດການ
                </button>
              </div>
              <select
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-1 mt-1.5">
                <input
                  className="bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 flex-1"
                  placeholder="+ ໝວດໝູ່ໃໝ່"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <button type="button" onClick={addCategory} className="bg-gray-100 border border-gray-300 text-gray-800 px-2 py-1 rounded text-xs">
                  ເພີ່ມ
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-gray-700 font-medium">ຍີ່ຫໍ້</label>
                <button
                  type="button"
                  onClick={() => setShowBrandManager(true)}
                  className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
                >
                  ⚙️ ຈັດການ
                </button>
              </div>
              <select
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
                value={form.brandId}
                onChange={(e) => setForm({ ...form, brandId: e.target.value })}
              >
                <option value="">-- ບໍ່ລະບຸ --</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-1 mt-1.5">
                <input
                  className="bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 flex-1"
                  placeholder="+ ຍີ່ຫໍ້ໃໝ່"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                />
                <button type="button" onClick={addBrand} className="bg-gray-100 border border-gray-300 text-gray-800 px-2 py-1 rounded text-xs">
                  ເພີ່ມ
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-700 block mb-1 font-medium">ລາຄາຕົ້ນທຶນ (₭) *</label>
              <input
                type="number"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 font-mono focus:border-blue-600 focus:outline-none"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-700 block mb-1 font-medium">ລາຄາຂາຍ (₭) *</label>
              <input
                type="number"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-blue-700 font-mono font-bold focus:border-blue-600 focus:outline-none"
                value={form.sellPrice}
                onChange={(e) => setForm({ ...form, sellPrice: e.target.value })}
              />
            </div>
          </div>

          <button
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm shadow-md"
          >
            {submitting ? "ກຳລັງເພີ່ມ..." : "+ ເພີ່ມສິນຄ້າ"}
          </button>

          {message && (
            <div className={`text-xs p-2.5 rounded-lg border font-semibold ${message.type === "ok" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-red-50 text-red-800 border-red-300"}`}>
              {message.text}
            </div>
          )}
        </form>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-semibold text-lg text-gray-900">ສິນຄ້າທັງໝົດ ({products.length})</h3>
            <input
              className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-900 w-48 focus:outline-none focus:border-blue-600"
              placeholder="ຄົ້ນຫາ..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="max-h-[640px] overflow-y-auto space-y-2 pr-1">
            {products.map((p) => (
              <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-3 hover:border-blue-400 transition-colors shadow-sm">
                {editingId === p.id ? (
                  <div className="space-y-2">
                    <input className="w-full bg-white border border-gray-300 rounded p-2 text-xs text-gray-900" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                    <div className="grid grid-cols-2 gap-2">
                      <select className="bg-white border border-gray-300 rounded p-2 text-xs text-gray-900" value={edit.categoryId} onChange={(e) => setEdit({ ...edit, categoryId: e.target.value })}>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <select className="bg-white border border-gray-300 rounded p-2 text-xs text-gray-900" value={edit.brandId} onChange={(e) => setEdit({ ...edit, brandId: e.target.value })}>
                        <option value="">-- ບໍ່ລະບຸ --</option>
                        {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" className="bg-white border border-gray-300 rounded p-2 text-xs font-mono text-gray-900" placeholder="ຕົ້ນທຶນ" value={edit.costPrice} onChange={(e) => setEdit({ ...edit, costPrice: e.target.value })} />
                      <input type="number" className="bg-white border border-gray-300 rounded p-2 text-xs font-mono text-blue-700 font-bold" placeholder="ລາຄາຂາຍ" value={edit.sellPrice} onChange={(e) => setEdit({ ...edit, sellPrice: e.target.value })} />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => saveEdit(p.id)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded font-semibold flex-1">ບັນທຶກ</button>
                      <button onClick={() => setEditingId(null)} className="bg-gray-100 border border-gray-300 text-gray-700 text-xs px-3 py-1.5 rounded font-semibold flex-1">ຍົກເລີກ</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{p.name}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">
                        {p.sku} · {p.category.name}{p.brand ? ` · ${p.brand.name}` : ""}
                      </div>
                      <div className="text-xs mt-1">
                        <span className="text-gray-500">ຕົ້ນທຶນ: </span>
                        <span className="font-mono text-gray-700">{formatKip(p.costPrice)}</span>
                        <span className="text-gray-500"> → ຂາຍ: </span>
                        <span className="font-mono text-blue-700 font-bold">{formatKip(p.sellPrice)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${p.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-gray-100 text-gray-500 border-gray-300"}`}>
                        {p.isActive ? "ກຳລັງຂາຍ" : "ປິດ"}
                      </span>
                      <div className="flex gap-3 pt-1">
                        <button onClick={() => startEdit(p)} className="text-xs text-blue-600 hover:underline font-medium">ແກ້ໄຂ</button>
                        <button onClick={() => toggleActive(p)} className="text-xs text-red-600 hover:underline font-medium">
                          {p.isActive ? "ປິດການຂາຍ" : "ເປີດຄືນ"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {products.length === 0 && <p className="text-gray-500 text-xs">ບໍ່ພົບສິນຄ້າ</p>}
          </div>
        </div>
      </div>

      {/* --- Modal ຈັດການ/ແກ້ໄຂ/ລົບ ຍີ່ຫໍ້ --- */}
      {showBrandManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900">⚙️ ຈັດການຍີ່ຫໍ້ທັງໝົດ</h3>
              <button
                type="button"
                onClick={() => {
                  setShowBrandManager(false);
                  setEditingBrandId(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto mb-4 border border-gray-200 rounded-xl p-2">
              {brands.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg border border-gray-100">
                  {editingBrandId === b.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={editingBrandName}
                        onChange={(e) => setEditingBrandName(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-xs flex-1 text-gray-900 focus:outline-none focus:border-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => saveEditBrand(b.id)}
                        className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded font-semibold hover:bg-blue-700 cursor-pointer"
                      >
                        ບັນທຶກ
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingBrandId(null)}
                        className="bg-gray-100 border border-gray-300 text-xs px-2.5 py-1 rounded font-semibold text-gray-700 hover:bg-gray-200 cursor-pointer"
                      >
                        ຍົກເລີກ
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-gray-800">{b.name}</span>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBrandId(b.id);
                            setEditingBrandName(b.name);
                          }}
                          className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                        >
                          ແກ້ໄຂ
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBrand(b.id, b.name)}
                          className="text-xs text-red-600 hover:underline font-medium cursor-pointer"
                        >
                          ລົບ
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {brands.length === 0 && <p className="text-center text-xs text-gray-400 py-4">ຍັງບໍ່ມີຍີ່ຫໍ້</p>}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowBrandManager(false);
                  setEditingBrandId(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                ປິດໜ້າຕ່າງ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal ຈັດການ/ແກ້ໄຂ/ລົບ ໝວດໝູ່ --- */}
      {showCategoryManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900">⚙️ ຈັດການໝວດໝູ່ທັງໝົດ</h3>
              <button
                type="button"
                onClick={() => {
                  setShowCategoryManager(false);
                  setEditingCategoryId(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto mb-4 border border-gray-200 rounded-xl p-2">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg border border-gray-100">
                  {editingCategoryId === c.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-xs flex-1 text-gray-900 focus:outline-none focus:border-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => saveEditCategory(c.id)}
                        className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded font-semibold hover:bg-blue-700 cursor-pointer"
                      >
                        ບັນທຶກ
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCategoryId(null)}
                        className="bg-gray-100 border border-gray-300 text-xs px-2.5 py-1 rounded font-semibold text-gray-700 hover:bg-gray-200 cursor-pointer"
                      >
                        ຍົກເລີກ
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-gray-800">{c.name}</span>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategoryId(c.id);
                            setEditingCategoryName(c.name);
                          }}
                          className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                        >
                          ແກ້ໄຂ
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCategory(c.id, c.name)}
                          className="text-xs text-red-600 hover:underline font-medium cursor-pointer"
                        >
                          ລົບ
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {categories.length === 0 && <p className="text-center text-xs text-gray-400 py-4">ຍັງບໍ່ມີໝວດໝູ່</p>}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCategoryManager(false);
                  setEditingCategoryId(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                ປິດໜ້າຕ່າງ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}