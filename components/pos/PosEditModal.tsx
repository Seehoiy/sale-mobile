"use client";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  editPrice: number;
  setEditPrice: (v: number) => void;
  editDiscount: number;
  setEditDiscount: (v: number) => void;
  editWarrantyMonths: number;
  setEditWarrantyMonths: (v: number) => void;
  onSave: () => void;
};

export default function PosEditModal({
  isOpen,
  onClose,
  editPrice,
  setEditPrice,
  editDiscount,
  setEditDiscount,
  editWarrantyMonths,
  setEditWarrantyMonths,
  onSave,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-300 rounded-2xl p-5 w-80 space-y-4 shadow-xl text-gray-900">
        <h3 className="font-bold text-sm text-blue-700 border-b border-gray-200 pb-2">
          ✏️ ແກ້ໄຂລາຍການສິນຄ້າ ແລະ ການຮັບປະກັນ
        </h3>
        <div>
          <label className="text-xs text-gray-700 block mb-1">ລາຄາຂາຍ (ກີບ)</label>
          <input
            type="number"
            className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-sm text-gray-900 font-mono focus:border-blue-600 focus:bg-white focus:outline-none"
            value={editPrice}
            onChange={(e) => setEditPrice(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-xs text-gray-700 block mb-1">ສ່ວນຫຼຸດ (ກີບ)</label>
          <input
            type="number"
            className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-sm text-gray-900 font-mono focus:border-blue-600 focus:bg-white focus:outline-none"
            value={editDiscount}
            onChange={(e) => setEditDiscount(Number(e.target.value))}
          />
        </div>

        <div>
          <label className="text-xs text-emerald-700 block mb-1 font-bold">
            🛡️ ເລືອກໄລຍະເວລາການຮັບປະກັນ
          </label>
          <select
            className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-sm text-gray-900 focus:border-blue-600 focus:bg-white focus:outline-none font-medium"
            value={editWarrantyMonths}
            onChange={(e) => setEditWarrantyMonths(Number(e.target.value))}
          >
            <option value={0}>ບໍ່ມີປະກັນ (0 ເດືອນ)</option>
            <option value={1}>1 ເດືອນ</option>
            <option value={3}>3 ເດືອນ</option>
            <option value={6}>6 ເດືອນ</option>
            <option value={12}>12 ເດືອນ (1 ປີ)</option>
            <option value={24}>24 ເດືອນ (2 ປີ)</option>
            <option value={36}>36 ເດືອນ (3 ປີ)</option>
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 rounded-lg font-bold transition-colors"
          >
            ບັນທຶກ
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 text-xs py-2 rounded-lg font-semibold border border-gray-300"
          >
            ຍົກເລີກ
          </button>
        </div>
      </div>
    </div>
  );
}
