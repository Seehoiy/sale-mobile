"use client";

import { useEffect, useState } from "react";
import { getSession, SessionUser, isAdmin, getAuthHeaders } from "@/lib/session";

type Branch = {
  id: string;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
};

type Employee = {
  id: string;
  empCode: string;
  pinCode: string;
  username: string;
  fullName: string;
  role: string;
  branchId: string;
  isActive: boolean;
  branch: { name: string };
};

const ROLES = ["ADMIN", "MANAGER", "CASHIER", "TECHNICIAN", "WAREHOUSE"];

export default function BranchesPage() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("");

  const [form, setForm] = useState({ code: "", name: "", address: "", phone: "" });
  const [empForm, setEmpForm] = useState({
    empCode: "",
    pinCode: "1234",
    username: "",
    password: "",
    fullName: "",
    role: "MANAGER",
    branchId: "",
  });
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [empMessage, setEmpMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [empSubmitting, setEmpSubmitting] = useState(false);

  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [branchEdit, setBranchEdit] = useState({ code: "", name: "", address: "", phone: "" });
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [empEdit, setEmpEdit] = useState({
    empCode: "",
    pinCode: "1234",
    fullName: "",
    role: "MANAGER",
    branchId: "",
    newPassword: "",
  });

  const adminRole = isAdmin(session);

  function loadBranches() {
    fetch("/api/branches?showAll=true", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data: Branch[]) => {
        if (Array.isArray(data)) {
          setBranches(data);
          const activeBranch = data.filter((b) => b.isActive !== false);
          setEmpForm((f) => (f.branchId ? f : { ...f, branchId: activeBranch[0]?.id ?? "" }));
        }
      });
  }

  function loadEmployees() {
    fetch("/api/employees", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEmployees(data);
      });
  }

  useEffect(() => {
    const s = getSession();
    setSession(s);
    loadBranches();
    loadEmployees();
  }, []);

  async function createBranch(e: React.FormEvent) {
    e.preventDefault();
    if (!adminRole) return;
    setMessage(null);
    if (!form.code || !form.name) {
      setMessage({ type: "err", text: "ກະລຸນາໃສ່ລະຫັດສາຂາ ແລະ ຊື່ສາຂາ" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: "ok", text: `ສ້າງສາຂາ "${data.name}" ສຳເລັດ` });
      setForm({ code: "", name: "", address: "", phone: "" });
      loadBranches();
    } catch (err: any) {
      setMessage({ type: "err", text: err.message ?? "ສ້າງສາຂາບໍ່ສຳເລັດ (ລະຫັດສາຂາອາດຊ້ຳ)" });
    } finally {
      setSubmitting(false);
    }
  }

  function startEditBranch(b: Branch) {
    if (!adminRole) return;
    setEditingBranchId(b.id);
    setBranchEdit({ code: b.code, name: b.name, address: b.address ?? "", phone: b.phone ?? "" });
  }

  async function saveEditBranch(id: string) {
    if (!adminRole) return;
    const res = await fetch(`/api/branches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(branchEdit),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      return;
    }
    setEditingBranchId(null);
    loadBranches();
  }

  async function toggleBranchActive(b: Branch) {
    if (!adminRole) return;
    await fetch(`/api/branches/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !b.isActive }),
    });
    loadBranches();
  }

  async function createEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (!adminRole) return;
    setEmpMessage(null);
    if (!empForm.username || !empForm.password || !empForm.fullName || !empForm.branchId) {
      setEmpMessage({ type: "err", text: "ກະລຸນາຕື່ມຂໍ້ມູນໃຫ້ຄົບ" });
      return;
    }
    setEmpSubmitting(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(empForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmpMessage({ type: "ok", text: `ສ້າງບັນຊີ "${data.username}" (${data.fullName}) ສຳເລັດ` });
      setEmpForm({
        ...empForm,
        empCode: "",
        username: "",
        password: "",
        fullName: "",
        pinCode: "1234",
      });
      loadEmployees();
    } catch (err: any) {
      setEmpMessage({ type: "err", text: err.message ?? "ສ້າງບັນຊີບໍ່ສຳເລັດ" });
    } finally {
      setEmpSubmitting(false);
    }
  }

  function startEditEmployee(emp: Employee) {
    if (!adminRole) return;
    setEditingEmpId(emp.id);
    setEmpEdit({
      empCode: emp.empCode || "",
      pinCode: emp.pinCode || "1234",
      fullName: emp.fullName,
      role: emp.role,
      branchId: emp.branchId,
      newPassword: "",
    });
  }

  async function saveEditEmployee(id: string) {
    if (!adminRole) return;
    const payload: any = {
      empCode: empEdit.empCode,
      pinCode: empEdit.pinCode,
      fullName: empEdit.fullName,
      role: empEdit.role,
      branchId: empEdit.branchId,
    };
    if (empEdit.newPassword) payload.newPassword = empEdit.newPassword;

    const res = await fetch(`/api/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      return;
    }
    setEditingEmpId(null);
    loadEmployees();
  }

  async function toggleEmployeeActive(emp: Employee) {
    if (!adminRole) return;
    await fetch(`/api/employees/${emp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !emp.isActive }),
    });
    loadEmployees();
  }

  const filteredEmployees = selectedBranchFilter
    ? employees.filter((e) => e.branchId === selectedBranchFilter)
    : employees;

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4 md:p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 tracking-wide">
          🏢 ຈັດການສາຂາ ແລະ ພະນັກງານ
        </h1>
        <p className="text-blue-700 font-semibold">
          ສາຂາ ແລະ ພະນັກງານສາມາດເພີ່ມ/ແກ້ໄຂໄດ້ສະເພາະ ແອັດມິນ (ADMIN) ເທົ່ານັ້ນ. ພະນັກງານແຕ່ລະສາຂາຖືກແຍກກັນຢ່າງຈະແຈ້ງ.
        </p>
      </div>

      {!adminRole && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-900 text-xs md:text-sm flex items-center gap-3">
          <span className="text-xl">🔒</span>
          <div>
            <strong>ແຈ້ງເຕືອນສິດການໃຊ້ງານ:</strong> ທ່ານເຂົ້າສູ່ລະບົບໃນບົດບາດ <span className="font-bold underline text-amber-900">{session?.role}</span> ({session?.branchName}). ສະເພາະ <span className="font-bold text-amber-900">Admin</span> ເທົ່ານັ້ນທີ່ມີສິດເພີ່ມ/ແກ້ໄຂສາຂາ ແລະ ພະນັກງານ.
          </div>
        </div>
      )}

      {/* ===== SECTION 1: BRANCHES MANAGEMENT ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Creation Form (Admin Only) */}
        {adminRole && (
          <form onSubmit={createBranch} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-sm">
            <h3 className="font-display font-semibold text-lg text-blue-700 border-b border-gray-200 pb-2">
              + ສ້າງສາຂາໃໝ່ (Admin Only)
            </h3>
            <div>
              <label className="text-xs text-gray-700 block mb-1 font-medium">ລະຫັດສາຂາ (ບໍ່ຊ້ຳ) *</label>
              <input
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 font-mono focus:border-blue-600 focus:outline-none"
                placeholder="ເຊັ່ນ VTE-01"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-700 block mb-1 font-medium">ຊື່ສາຂາ *</label>
              <input
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
                placeholder="ເຊັ່ນ ສາຂາ ນະຄອນຫຼວງວຽງຈັນ"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-700 block mb-1 font-medium">ທີ່ຢູ່</label>
              <input
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-700 block mb-1 font-medium">ເບີໂທ</label>
              <input
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <button
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm shadow-md"
            >
              {submitting ? "ກຳລັງສ້າງ..." : "+ ສ້າງສາຂາ"}
            </button>
            {message && (
              <div className={`text-xs p-2.5 rounded-lg border font-semibold ${message.type === "ok" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-red-50 text-red-800 border-red-300"}`}>
                {message.text}
              </div>
            )}
          </form>
        )}

        {/* Branch List */}
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-lg text-gray-900">
            ສາຂາທັງໝົດ ({branches.length})
          </h3>
          {branches.map((b) => (
            <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-gray-300 transition-colors">
              {editingBranchId === b.id && adminRole ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="bg-white border border-gray-300 rounded p-2 text-xs font-mono text-gray-900"
                      placeholder="ລະຫັດສາຂາ"
                      value={branchEdit.code}
                      onChange={(e) => setBranchEdit({ ...branchEdit, code: e.target.value })}
                    />
                    <input
                      className="bg-white border border-gray-300 rounded p-2 text-xs text-gray-900"
                      placeholder="ຊື່ສາຂາ"
                      value={branchEdit.name}
                      onChange={(e) => setBranchEdit({ ...branchEdit, name: e.target.value })}
                    />
                  </div>
                  <input
                    className="w-full bg-white border border-gray-300 rounded p-2 text-xs text-gray-900"
                    placeholder="ທີ່ຢູ່"
                    value={branchEdit.address}
                    onChange={(e) => setBranchEdit({ ...branchEdit, address: e.target.value })}
                  />
                  <input
                    className="w-full bg-white border border-gray-300 rounded p-2 text-xs text-gray-900"
                    placeholder="ເບີໂທ"
                    value={branchEdit.phone}
                    onChange={(e) => setBranchEdit({ ...branchEdit, phone: e.target.value })}
                  />
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => saveEditBranch(b.id)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded font-semibold flex-1">
                      ບັນທຶກ
                    </button>
                    <button onClick={() => setEditingBranchId(null)} className="bg-gray-100 border border-gray-300 text-gray-700 text-xs px-3 py-1.5 rounded font-semibold flex-1">
                      ຍົກເລີກ
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {b.name} <span className="text-blue-600 font-mono text-xs ml-1">({b.code})</span>
                    </div>
                    {b.address && <div className="text-xs text-gray-500 mt-1">{b.address}</div>}
                    {b.phone && <div className="text-xs text-gray-500 font-mono mt-0.5">📞 {b.phone}</div>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${b.isActive ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-gray-100 text-gray-500 border-gray-300"}`}>
                      {b.isActive ? "ເປີດໃຫ້ບໍລິການ" : "ປິດ"}
                    </span>
                    {adminRole && (
                      <div className="flex gap-3 pt-1">
                        <button onClick={() => startEditBranch(b)} className="text-xs text-blue-600 hover:underline font-medium">
                          ແກ້ໄຂ
                        </button>
                        <button onClick={() => toggleBranchActive(b)} className="text-xs text-red-600 hover:underline font-medium">
                          {b.isActive ? "ປິດການໃຊ້ງານ" : "ເປີດຄືນ"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {branches.length === 0 && <p className="text-gray-500 text-xs">ຍັງບໍ່ມີສາຂາ</p>}
        </div>
      </div>

      {/* ===== SECTION 2: EMPLOYEES MANAGEMENT ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
        {/* Create Employee Form (Admin Only) */}
        {adminRole && (
          <form onSubmit={createEmployee} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-sm">
            <h3 className="font-display font-semibold text-lg text-blue-700 border-b border-gray-200 pb-2">
              + ສ້າງບັນຊີ/ລະຫັດພະນັກງານ (Admin Only)
            </h3>
            <div>
              <label className="text-xs text-gray-700 block mb-1 font-medium">ເລືອກສາຂາທີ່ຈະປະຈຳການ *</label>
              <select
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
                value={empForm.branchId}
                onChange={(e) => setEmpForm({ ...empForm, branchId: e.target.value })}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-700 block mb-1 font-medium">ລະຫັດຜູ້ຂາຍ/ພະນັກງານ (EmpCode)</label>
                <input
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 font-mono focus:border-blue-600 focus:outline-none"
                  placeholder="ເຊັ່ນ EMP001"
                  value={empForm.empCode}
                  onChange={(e) => setEmpForm({ ...empForm, empCode: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-700 block mb-1 font-medium">PIN Code ຂາຍ (4 ຫຼັກ)</label>
                <input
                  maxLength={4}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 font-mono text-center tracking-widest focus:border-blue-600 focus:outline-none"
                  value={empForm.pinCode}
                  onChange={(e) => setEmpForm({ ...empForm, pinCode: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-700 block mb-1 font-medium">Username ເຂົ້າລະບົບ *</label>
                <input
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 font-mono focus:border-blue-600 focus:outline-none"
                  value={empForm.username}
                  onChange={(e) => setEmpForm({ ...empForm, username: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-700 block mb-1 font-medium">Password ເຂົ້າລະບົບ *</label>
                <input
                  type="password"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 font-mono focus:border-blue-600 focus:outline-none"
                  value={empForm.password}
                  onChange={(e) => setEmpForm({ ...empForm, password: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-700 block mb-1 font-medium">ຊື່ ແລະ ນາມສະກຸນ ພະນັກງານ *</label>
              <input
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
                value={empForm.fullName}
                onChange={(e) => setEmpForm({ ...empForm, fullName: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs text-gray-700 block mb-1 font-medium">ບົດບາດ (Role) *</label>
              <select
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
                value={empForm.role}
                onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r === "ADMIN" ? "ADMIN (ແອັດມິນ - ສິດທຸກສາຂາ)" : r === "MANAGER" ? "MANAGER (ຜູ້ຈັດການ - ສະເພາະສາຂາ)" : r}
                  </option>
                ))}
              </select>
            </div>

            <button
              disabled={empSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm shadow-md"
            >
              {empSubmitting ? "ກຳລັງສ້າງ..." : "+ ສ້າງບັນຊີ/ລະຫັດພະນັກງານ"}
            </button>
            {empMessage && (
              <div className={`text-xs p-2.5 rounded-lg border font-semibold ${empMessage.type === "ok" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-red-50 text-red-800 border-red-300"}`}>
                {empMessage.text}
              </div>
            )}
          </form>
        )}

        {/* Employee List with Branch Filter */}
        <div className="space-y-3">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h3 className="font-display font-semibold text-lg text-gray-900">
              ພະນັກງານທັງໝົດ ({filteredEmployees.length})
            </h3>
            <select
              className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs text-blue-700 font-bold focus:outline-none"
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
            >
              <option value="">-- ແຍກຕາມສາຂາ (ທຸກສາຂາ) --</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {filteredEmployees.map((emp) => (
            <div key={emp.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-gray-300 transition-colors">
              {editingEmpId === emp.id && adminRole ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="bg-white border border-gray-300 rounded p-2 text-xs font-mono text-gray-900"
                      placeholder="EmpCode (ລະຫັດຜູ້ຂາຍ)"
                      value={empEdit.empCode}
                      onChange={(e) => setEmpEdit({ ...empEdit, empCode: e.target.value })}
                    />
                    <input
                      className="bg-white border border-gray-300 rounded p-2 text-xs text-gray-900"
                      placeholder="ຊື່-ນາມສະກຸນ"
                      value={empEdit.fullName}
                      onChange={(e) => setEmpEdit({ ...empEdit, fullName: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="bg-white border border-gray-300 rounded p-2 text-xs text-gray-900"
                      value={empEdit.role}
                      onChange={(e) => setEmpEdit({ ...empEdit, role: e.target.value })}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <select
                      className="bg-white border border-gray-300 rounded p-2 text-xs text-gray-900"
                      value={empEdit.branchId}
                      onChange={(e) => setEmpEdit({ ...empEdit, branchId: e.target.value })}
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="password"
                      className="bg-white border border-gray-300 rounded p-2 text-xs font-mono text-gray-900"
                      placeholder="ຕັ້ງ Password ໃໝ່ (ປະໄວ້ຖ້າບໍ່ປ່ຽນ)"
                      value={empEdit.newPassword}
                      onChange={(e) => setEmpEdit({ ...empEdit, newPassword: e.target.value })}
                    />
                    <input
                      className="bg-white border border-gray-300 rounded p-2 text-xs font-mono text-center text-gray-900"
                      placeholder="PIN 4 ຫຼັກ"
                      value={empEdit.pinCode}
                      onChange={(e) => setEmpEdit({ ...empEdit, pinCode: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => saveEditEmployee(emp.id)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded font-semibold flex-1">
                      ບັນທຶກ
                    </button>
                    <button onClick={() => setEditingEmpId(null)} className="bg-gray-100 border border-gray-300 text-gray-700 text-xs px-3 py-1.5 rounded font-semibold flex-1">
                      ຍົກເລີກ
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {emp.fullName}
                      <span className="text-blue-700 font-mono text-xs ml-2">
                        [{emp.empCode || "EMP-N/A"}]
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">
                      @{emp.username} · ສາຂາ: <span className="text-gray-900 font-semibold">{emp.branch.name}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${emp.role === "ADMIN" ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-blue-100 text-blue-800 border-blue-300"}`}>
                      {emp.role} {!emp.isActive && "· ປິດ"}
                    </span>
                    {adminRole && (
                      <div className="flex gap-3 pt-1">
                        <button onClick={() => startEditEmployee(emp)} className="text-xs text-blue-600 hover:underline font-medium">
                          ແກ້ໄຂ
                        </button>
                        <button onClick={() => toggleEmployeeActive(emp)} className="text-xs text-red-600 hover:underline font-medium">
                          {emp.isActive ? "ປິດການໃຊ້ງານ" : "ເປີດຄືນ"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {filteredEmployees.length === 0 && <p className="text-gray-500 text-xs">ບໍ່ພົບພະນັກງານໃນສາຂານີ້</p>}
        </div>
      </div>
    </div>
  );
}
