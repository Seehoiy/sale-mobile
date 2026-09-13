export type WarrantyType = 'NONE' | 'SHOP' | 'CENTER';

export interface ItemWarranty {
  warrantyType: WarrantyType;
  warrantyMonths: number;
  startDate?: string;
  endDate?: string;
  note?: string;
}
