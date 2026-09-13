// components/WarrantyReceiptSection.tsx
import React from 'react';
import { ItemWarranty } from '@/types/warranty';
import { getWarrantyDisplayText } from '@/lib/warranty';

interface WarrantyReceiptProps {
  warranty?: ItemWarranty;
  imei?: string;
}

export const WarrantyReceiptSection: React.FC<WarrantyReceiptProps> = ({ warranty, imei }) => {
  if (!imei && (!warranty || warranty.warrantyType === 'NONE')) {
    return null;
  }

  return (
    <div className="text-[10px] text-gray-600 pl-2 mt-0.5 border-l-2 border-gray-300">
      {imei && (
        <p className="font-mono">
          IMEI/SN: <span className="font-bold text-black">{imei}</span>
        </p>
      )}
      {warranty && warranty.warrantyType !== 'NONE' && (
        <>
          <p>
            ການປະກັນ: <span className="font-semibold text-black">{getWarrantyDisplayText(warranty)}</span>
          </p>
          {warranty.endDate && (
            <p>
              ໝົດປະກັນ: <span className="font-semibold text-black">{warranty.endDate}</span>
            </p>
          )}
        </>
      )}
    </div>
  );
};