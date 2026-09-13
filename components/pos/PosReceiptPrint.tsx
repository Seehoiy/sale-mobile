"use client";

import { formatKip } from "@/lib/utils";

export type ReceiptData = {
  invoiceNo: string;
  billNo?: string;
  createdAt: string;
  customerName: string;
  employeeName: string;
  employeeCode: string;
  branchName: string;
  items: {
    productName: string;
    imei1?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    warrantyMonths: number;
  }[];
  subtotal: number;
  discount: number;
  vatAmount: number;
  total: number;
};

export default function PosReceiptPrint({ data }: { data: ReceiptData | null }) {
  if (!data) return null;

  return (
    <div id="receipt-print" className="hidden print:block p-3 bg-white text-black font-sans text-xs w-[80mm] mx-auto leading-normal">
      {/* Header */}
      <div className="text-center pb-2 border-b-2 border-dashed border-black">
        <h2 className="text-base font-black tracking-wide uppercase">SILA TELECOM</h2>
        <p className="text-[10px] text-gray-700 font-semibold">{data.branchName}</p>
        <div className="mt-1 inline-block border border-black text-black text-[9px] px-2 py-0.5 font-bold uppercase rounded-sm">
          ໃບບິນຮັບເງິນ / RECEIPT
        </div>
      </div>

      {/* Bill & Seller Details */}
      <div className="py-2 border-b border-gray-400 text-[10px] space-y-0.5">
        <div className="flex justify-between">
          <span className="text-gray-600">ເລກທີ / No:</span>
          <span className="font-mono font-bold">{data.invoiceNo}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">ວັນທີ / Date:</span>
          <span>{data.createdAt}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">ລູກຄ້າ / Cust:</span>
          <span className="font-semibold">{data.customerName}</span>
        </div>
        {/* SELLER NAME AND SELLER CODE AS REQUIRED */}
        <div className="flex justify-between bg-gray-100 p-1 rounded my-0.5">
          <span className="text-gray-800 font-bold">ຜູ້ຂາຍ / Seller:</span>
          <span className="font-bold text-black">
            {data.employeeName} <span className="font-mono text-gray-700">[{data.employeeCode}]</span>
          </span>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-left my-2 text-[10px]">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="py-1">ລາຍການ</th>
            <th className="text-center py-1 w-8">ຈຳນວນ</th>
            <th className="text-right py-1 w-20">ລວມ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.items.map((item, i) => (
            <tr key={i}>
              <td className="py-1.5 leading-tight text-black">
                <div className="font-semibold text-black">{item.productName}</div>
                {item.imei1 && (
                  <div className="text-[8px] font-mono text-gray-700">
                    IMEI: {item.imei1}
                  </div>
                )}
                {/* WARRANTY SELECTION DISPLAY */}
                <div className="text-[8px] font-mono text-emerald-800 font-bold">
                  ປະກັນ (Warranty): {item.warrantyMonths > 0 ? `${item.warrantyMonths} ເດືອນ` : "ບໍ່ມີປະກັນ"}
                </div>
              </td>
              <td className="text-center py-1.5 align-top font-mono text-black">
                {item.quantity}
              </td>
              <td className="text-right py-1.5 align-top font-mono font-semibold text-black">
                {formatKip(item.unitPrice * item.quantity - item.discount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary Totals */}
      <div className="border-t-2 border-dashed border-black pt-2 space-y-1 text-[10px]">
        <div className="flex justify-between text-gray-700">
          <span>ຍອດລວມ (Subtotal):</span>
          <span className="font-mono">{formatKip(data.subtotal)}</span>
        </div>
        {data.discount > 0 && (
          <div className="flex justify-between text-gray-700">
            <span>ສ່ວນຫຼຸດ (Discount):</span>
            <span className="font-mono text-red-600">-{formatKip(data.discount)}</span>
          </div>
        )}
        {data.vatAmount > 0 && (
          <div className="flex justify-between text-gray-700">
            <span>VAT:</span>
            <span className="font-mono">+{formatKip(data.vatAmount)}</span>
          </div>
        )}

        <div className="border-2 border-black p-1.5 mt-2 flex justify-between items-center rounded-sm bg-gray-50">
          <span className="font-bold text-[11px] uppercase">ລວມຊຳລະ:</span>
          <span className="font-mono font-black text-xs">{formatKip(data.total)}</span>
        </div>
      </div>

      {/* Warranty Terms */}
      <div className="mt-3 pt-2 border-t border-dashed border-black text-[8px] leading-tight space-y-1">
        <p className="font-bold underline">ເງື່ອນໄຂການຮັບປະກັນ (Warranty Terms):</p>
        <p>1. ກະລຸນານຳໃບບິນ ຫຼື ສະແດງ IMEI ນີ້ມາທຸກຄັ້ງເມື່ອຕິດຕໍ່ເຄລມປະກັນ.</p>
        <p>2. ປະກັນສະເພາະຕົວເຄື່ອງທີ່ເກີດຈາກຂໍ້ຜິດພາດຂອງລະບົບ/ໂຮງງານຕາມໄລຍະທີ່ລະບຸ.</p>
        <p>3. ບໍ່ປະກັນ: ຕົກນ້ຳ, ຕົກແຕກ, ຈໍແຕກ/ເປັນເສັ້ນ, ເຄື່ອງງໍ, ຫຼື ຜ່ານການແກ້ໄຂຈາກຮ້ານອື່ນ.</p>
      </div>

      <div className="text-center text-[9px] mt-3 pt-2 border-t border-gray-300 space-y-0.5">
        <p className="font-semibold">ຂໍຂອບໃຈທີ່ໃຊ້ອຸດໜູນ / Thank You</p>
        <p className="text-[8px] text-gray-500">ກະລຸນາກວດເຊັກສິນຄ້າ ແລະ ເງິນທອນກ່ອນອອກຈາກຮ້ານ</p>
      </div>
    </div>
  );
}
