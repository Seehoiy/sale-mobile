"use client";

import { useEffect, useState } from "react";

export type EmployeeOption = {
  id: string;
  fullName: string;
  empCode: string;
  pinCode?: string;
};

type Props = {
  isOpen: boolean;
  employees: EmployeeOption[];
  selectedEmpId: string;
  setSelectedEmpId: (id: string) => void;
  pinCode: string;
  setPinCode: (pin: string) => void;
  submitting: boolean;
  pinError: string;
  onConfirm: () => void;
  onClose: () => void;
};

export default function PosSellerAuthModal({
  isOpen,
  employees,
  selectedEmpId,
  setSelectedEmpId,
  pinCode,
  setPinCode,
  submitting,
  pinError,
  onConfirm,
  onClose,
}: Props) {
  if (!isOpen) return null;

  const currentEmp = employees.find((e) => e.id === selectedEmpId);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-300 rounded-2xl p-6 w-96 space-y-4 shadow-2xl text-gray-900">
        <div className="text-center border-b border-gray-200 pb-3">
          <h3 className="font-bold text-lg text-blue-700">🔐 ໃສ່ຂໍ້ມູນຜູ້ຂາຍ ແລະ ລະຫັດຜູ້ຂາຍ</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            ກະລຸນາໃສ່ຊື່ຜູ້ຂາຍ ແລະ ລະຫັດຜູ້ຂາຍ ເພື່ອບັນທຶກຍອດຂາຍ ແລະ ອອກໃບບິນ
          </p>
        </div>

        <div>
          <label className="text-xs text-gray-700 block mb-1 font-semibold">
            1. ເລືອກຊື່ຜູ້ຂາຍ (Seller Name) *
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-gray-50 text-gray-900 focus:border-blue-600 focus:bg-white focus:outline-none"
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
          >
            <option value="">-- ເລືອກຊື່ຜູ້ຂາຍ --</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName} ({emp.empCode || "EMP-N/A"})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-700 block mb-1 font-semibold">
            2. ລະຫັດຜູ້ຂາຍ (Seller Code)
          </label>
          <input
            readOnly
            value={currentEmp ? currentEmp.empCode || "EMP-000" : "-"}
            className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-gray-100 text-blue-700 font-mono font-bold"
          />
        </div>

        <div>
          <label className="text-xs text-gray-700 block mb-1 font-semibold">
            3. PIN Code ຢືນຢັນ (4 ຫຼັກ) *
          </label>
          <input
            type="password"
            maxLength={4}
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value)}
            placeholder="****"
            className="w-full border border-gray-300 rounded-lg p-2.5 text-center text-2xl font-mono tracking-widest bg-gray-50 text-gray-900 focus:border-blue-600 focus:bg-white focus:outline-none"
          />
        </div>

        {pinError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded-lg text-center font-semibold">
            {pinError}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            disabled={submitting}
            onClick={onConfirm}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-3 rounded-lg font-bold transition-colors disabled:opacity-50 shadow-md"
          >
            {submitting ? "ກຳລັງບັນທຶກ..." : "✓ ຢືນຢັນ & ອອກໃບບິນ"}
          </button>
          <button
            onClick={onClose}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs px-4 py-3 rounded-lg font-semibold border border-gray-300"
          >
            ຍົກເລີກ
          </button>
        </div>
      </div>
    </div>
  );
}
