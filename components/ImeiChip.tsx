import StatusBadge from "./StatusBadge";

// ອົງປະກອບໂຕໜ້າ (signature element): ບັດ IMEI ໃນຮູບແບບ "ປີ້" (ticket stub)
// ເພາະ IMEI ແຕ່ລະໜ່ວຍແມ່ນ 1 object ທີ່ເດີນທາງຜ່ານຫຼາຍສະຖານະ ຄືກັນກັບປີ້ທີ່ຖືກ punch ຜ່ານແຕ່ລະຈຸດກວດ
export default function ImeiChip({
  imei1,
  imei2,
  productName,
  status,
  branchName,
}: {
  imei1: string;
  imei2?: string | null;
  productName: string;
  status: string;
  branchName?: string;
}) {
  return (
    <div className="relative flex items-stretch card overflow-hidden max-w-[280px] shadow-sm">
      <div className="flex-1 p-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{productName}</div>
        <div className="font-mono text-xs text-signal mt-1">IMEI1 {imei1}</div>
        {imei2 && <div className="font-mono text-xs text-muted">IMEI2 {imei2}</div>}
        {branchName && <div className="text-[11px] text-muted mt-1">📍 {branchName}</div>}
      </div>

      {/* 🔴 ປ້າຍສະຖານະດ້ານຂວາ: ປ່ຽນ w-24 ເປັນ min-w-[110px] px-3 ພ້ອມ whitespace-nowrap ເພື່ອໃຫ້ເຫັນຊື່ສະຖານະເຕັມ */}
      <div className="relative w-20 shrink-0 border-l border-dashed border-gray-300 flex items-center justify-center bg-gray-900 px-3 whitespace-nowrap">
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border border-gray-300" />
        <StatusBadge status={status} />
      </div>
    </div>
  );
}
