// lib/warranty.ts
import { ItemWarranty } from '@/types/warranty';

/**
 * ຄິດໄລ່ວັນທີເລີ່ມຕົ້ນ ແລະ ວັນທີໝົດອາຍຸປະກັນ
 */
export function calculateWarrantyDates(months: number, startDateInput?: Date) {
  const start = startDateInput ? new Date(startDateInput) : new Date();
  const end = new Date(start);

  if (months === 0.25) {
    // ກໍລະນີ 7 ວັນ
    end.setDate(end.getDate() + 7);
  } else {
    // ກໍລະນີຄິດເປັນເດືອນ
    end.setMonth(end.getMonth() + months);
  }

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

/**
 * ແປງຂໍ້ມູນປະກັນເປັນຂໍ້ຄວາມສະແດງເທິງໃບບິນ
 */
export function getWarrantyDisplayText(warranty?: ItemWarranty): string {
  if (!warranty || warranty.warrantyMonths === 0 || warranty.warrantyType === 'NONE') {
    return 'ບໍ່ມີການຮັບປະກັນ';
  }

  const typeName = warranty.warrantyType === 'SHOP' ? 'ປະກັນຮ້ານ' : 'ປະກັນສູນ';
  const duration = warranty.warrantyMonths === 0.25 ? '7 ວັນ' : `${warranty.warrantyMonths} ເດືອນ`;

  return `${typeName} ${duration}`;
}