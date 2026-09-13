"use client";

import { useState, useRef, useEffect } from "react";

type Employee = {
  id: string;
  fullName: string;
  empCode: string;
};

type Props = {
  isOpen: boolean;
  onSuccess: (employee: Employee) => void;
  onClose: () => void;
};

export default function EmployeeQuickAuthModal({ isOpen, onSuccess, onClose }: Props) {
  const [code, setCode] = useState("");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus ຊ່ອງພິມລະຫັດທັນທີເມື່ອ Modal ເປີດ
  useEffect(() => {
    if (isOpen) {
      setCode("");
      setEmployee(null);
      setError("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ຟັງຊັນກວດສອບລະຫັດພະນັກງານ
  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/employees/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setEmployee(data.employee);
        // ຖ້າຖືກຕ້ອງ ໃຫ້ສົ່ງຂໍ້ມູນພະນັກງານກັບໄປປິດໃບບິນ
        setTimeout(() => {
          onSuccess(data.employee);
        }, 400); // ໜ່ວງເວລາ 0.4s ໃຫ້ເຫັນຊື່ກ່ອນອອກໃບບິນ
      } else {
        setError(data.message || "ບໍ່ພົບລະຫັດພະນັກງານນີ້!");
        setCode("");
        inputRef.current?.focus();
      }
    } catch (err) {
      setError("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white text-black w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            👤
          </div>
          <h3 className="font-bold text-base text-gray-800">ຢືນຢັນຜູ້ເຮັດທຸລະກຳ</h3>
          <p className="text-xs text-gray-500">
            ສະແກນບັດ ຫຼື ພິມລະຫັດ/PIN ພະນັກງານ ແລ້ວກົດ Enter
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-3">
          <input
            ref={inputRef}
            type="password"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError("");
            }}
            placeholder="ພິມລະຫັດ / PIN..."
            disabled={loading}
            className="w-full text-center text-xl font-mono border-2 border-gray-300 focus:border-blue-600 rounded-xl py-3 outline-none transition-all"
          />

          {/* ສະແດງຂໍ້ຄວາມ Error ຖ້າລະຫັດຜິດ */}
          {error && <p className="text-xs text-red-500 font-medium text-center">{error}</p>}

          {/* ສະແດງຊື່ພະນັກງານເມື່ອລະຫັດຖືກຕ້ອງ */}
          {employee && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-2.5 rounded-xl text-center animate-in fade-in">
              <p className="text-[10px] text-green-600 uppercase font-bold">ພົບຂໍ້ມູນພະນັກງານ</p>
              <p className="text-sm font-bold">{employee.fullName} ({employee.empCode})</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              disabled={loading || !code}
              className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-xl transition-colors"
            >
              {loading ? "ກຳລັງກວດສອບ..." : "ຢືນຢັນ [Enter]"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}