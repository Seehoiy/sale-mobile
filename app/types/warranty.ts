// types/warranty.ts

export type WarrantyType = 'SHOP' | 'CENTER' | 'NONE';

export interface ItemWarranty {
  warrantyMonths: number;     // ຈຳນວນເດືອນປະກັນ (0 = ບໍ່ມີປະກັນ, 1, 3, 6, 12, 24)
  warrantyType: WarrantyType; // ປະກັນຮ້ານ (SHOP), ປະກັນສູນ (CENTER), ບໍ່ປະກັນ (NONE)
  startDate?: string;         // ວັນທີເລີ່ມປະກັນ (YYYY-MM-DD)
  endDate?: string;           // ວັນທີໝົດປະກັນ (YYYY-MM-DD)
  note?: string;              // ເງື່ອນໄຂເພີ່ມເຕີມ ຫຼື ໝາຍເຫດ
}

// ຕົວເລືອກໄລຍະເວລາປະກັນສຳລັບໃຫ້ເລືອກຢູ່ໜ້າ POS
export const WARRANTY_OPTIONS = [
  { label: 'ບໍ່ມີປະກັນ', months: 0, type: 'NONE' },
  { label: '7 ວັນ', months: 0.25, type: 'SHOP' },
  { label: '1 ເດືອນ (ຮ້ານ)', months: 1, type: 'SHOP' },
  { label: '3 ເດືອນ (ຮ້ານ)', months: 3, type: 'SHOP' },
  { label: '6 ເດືອນ (ຮ້ານ)', months: 6, type: 'SHOP' },
  { label: '12 ເດືອນ (ຮ້ານ)', months: 12, type: 'SHOP' },
  { label: '12 ເດືອນ (ສູນ)', months: 12, type: 'CENTER' },
] as const;