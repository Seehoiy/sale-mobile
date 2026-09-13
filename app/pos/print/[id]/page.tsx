"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatKip } from "@/lib/utils";

export default function PrintInvoicePage() {
  const params = useParams();
  const [sale, setSale] = useState<any>(null);

  useEffect(() => {
    // ດຶງຂໍ້ມູນໃບບິນຕາມ ID
    fetch(`/api/sales/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setSale(data);
        // ສັ່ງເປີດໜ້າພິມອັດໂນມັດ ເມື່ອໂຫລດຂໍ້ມູນແລ້ວ
        setTimeout(() => window.print(), 500);
      });
  }, [params.id]);

  if (!sale) return <div className="p-4 text-xs">ກຳລັງໂຫລດໃບບິນ...</div>;

  return (
    <div className="w-[80mm] p-2 text-[12px] font-mono leading-tight bg-white text-black">
      {/* Header ໃບບິນ */}
      <div className="text-center font-bold mb-2">
        <h2 className="text-sm font-bold">ໃບບິນຮັບເງິນ (RECEIPT)</h2>
        <p className="text-[10px]">ຮ້ານຄ້າ POS STORE</p>
        <p className="text-[10px]">ໂທ: 020 XXXXXXXX</p>
      </div>

      <div className="border-b border-dashed border-black my-1 py-1 text-[10px]">
        <div>ເລກທີ: {sale.invoiceNo}</div>
        <div>ວັນທີ: {new Date(sale.createdAt).toLocaleString("lo-LA")}</div>
        <div>ພະນັກງານ: {sale.employee?.fullName ?? "-"}</div>
      </div>

      {/* ລາຍການສິນຄ້າ */}
      <table className="w-full my-2 text-[11px]">
        <thead>
          <tr className="border-b border-black text-left">
            <th>ລາຍການ</th>
            <th className="text-right">ຈຳນວນ</th>
            <th className="text-right">ລວມ</th>
          </tr>
        </thead>
        <tbody>
          {sale.items?.map((item: any, i: number) => (
            <tr key={i}>
              <td>
                {item.productName}
                {item.imei && <div className="text-[9px]">{item.imei}</div>}
              </td>
              <td className="text-right align-top">{item.quantity}</td>
              <td className="text-right align-top">{formatKip(item.unitPrice * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ຍອດລວມ */}
      <div className="border-t border-dashed border-black pt-1 space-y-1 text-right text-[11px]">
        <div>ຍອດລວມ: {formatKip(sale.subtotal)}</div>
        {sale.discount > 0 && <div>ສ່ວນຫຼຸດ: -{formatKip(sale.discount)}</div>}
        <div className="font-bold text-xs pt-1 border-t border-black">
          ລວມຊຳລະ: {formatKip(sale.total)}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] mt-4 pt-2 border-t border-dashed border-black">
        <p>ຂໍຂອບໃຈທີ່ໃຊ້ອຸດໜູນ</p>
        <p>ກວດກາສິນຄ້າກ່ອນອອກຈາກຮ້ານ</p>
      </div>
    </div>
  );
}