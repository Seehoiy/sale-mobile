"use client";

import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/session";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  function handleConfirmLogout() {
    clearSession();
    onClose();
    router.push("/login");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-sm w-full mx-4 p-6 flex flex-col items-center text-center animate-scale-up">
        
        {/* Icon Logout */}
        <div className="bg-red-50 text-red-600 rounded-full w-14 h-14 flex items-center justify-center mb-4 border border-red-100">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"></path>
          </svg>
        </div>

        {/* Title & Detail */}
        <h3 className="text-gray-900 text-lg font-bold mb-1">
          ຢືນຢັນການອອກຈາກລະບົບ
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          ທ່ານຕ້ອງການອອກຈາກລະບົບແທ້ ຫຼື ບໍ່?
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            ຍົກເລີກ
          </button>
          <button
            onClick={handleConfirmLogout}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            ອອກຈາກລະບົບ
          </button>
        </div>

      </div>
    </div>
  );
}