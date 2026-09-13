import { prisma } from "@/lib/prisma";
import Link from "next/link";

async function getStats() {
  const [inStock, secondHand, inRepair, pendingClaims, branches, pendingTransfers] = await Promise.all([
    prisma.inventoryItem.count({ where: { status: "IN_STOCK" } }),
    prisma.inventoryItem.count({ where: { status: "SECOND_HAND" } }),
    prisma.inventoryItem.count({ where: { status: "IN_REPAIR" } }),
    prisma.claimRequest.count({ where: { status: { in: ["RECEIVED", "SENT_TO_CENTER"] } } }),
    prisma.branch.findMany({ where: { isActive: true } }),
    prisma.stockTransfer.count({ where: { status: "IN_TRANSIT" } }),
  ]);

  const todaySales = await prisma.sale.aggregate({
    where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    _sum: { total: true },
    _count: true,
  });

  return { inStock, secondHand, inRepair, pendingClaims, branches, pendingTransfers, todaySales };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "ໂທລະສັບ ພ້ອມຂາຍ", value: `${stats.inStock} ເຄື່ອງ`, href: "/inventory?status=IN_STOCK" },
    {
      label: "ຍອດຂາຍມື້ນີ້",
      value: `${stats.todaySales._count} ບິນ`,
      sub: stats.todaySales._sum.total ? `${Number(stats.todaySales._sum.total).toLocaleString()} ₭` : "0 ₭",
      href: "/pos",
    },
    { label: "ເຄື່ອງມືສອງ ລໍຖ້າຂາຍ", value: `${stats.secondHand} ເຄື່ອງ`, href: "/trade-in" },
    { label: "ຢູ່ໃນຂັ້ນຕອນຊ່ອມ", value: `${stats.inRepair} ເຄື່ອງ`, href: "/repair" },
    { label: "ເຄລມທີ່ຍັງບໍ່ແກ້ໄຂ", value: `${stats.pendingClaims} ງານ`, href: "/repair" },
    { label: "ໂອນຍ້າຍທີ່ຍັງບໍ່ຮັບ", value: `${stats.pendingTransfers} ລາຍການ`, href: "/transfers" },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4 md:p-6 space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 tracking-wide">
          📊 ພາບລວມທຸລະກິດ (Dashboard Overview)
        </h1>
        <p className="text-gray-500 text-xs md:text-sm mt-1">
          {stats.branches.length} ສາຂາທີ່ເປີດໃຫ້ບໍລິການ: {stats.branches.map((b: { name: string }) => b.name).join(", ")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-600 hover:shadow-md transition-all"
          >
            <div className="text-xs text-gray-500 font-semibold uppercase">{c.label}</div>
            <div className="font-display text-3xl font-bold text-gray-900 mt-2 font-mono">{c.value}</div>
            {c.sub && <div className="text-blue-600 font-bold text-base mt-1 font-mono">{c.sub}</div>}
          </Link>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-sm">
        <h2 className="font-display font-semibold text-lg text-gray-900">⚡ ເລີ່ມຕົ້ນໃຊ້ງານໄວ (Quick Actions)</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/pos" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors">
            + ອອກໃບບິນຂາຍ (POS)
          </Link>
          <Link href="/reports/sales" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors">
            📊 ລາຍງານຍອດຂາຍສິນຄ້າ
          </Link>
          <Link href="/inventory" className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-lg text-xs transition-colors border border-gray-300">
            📦 ສາງ / IMEI Stock
          </Link>
          <Link href="/trade-in" className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-lg text-xs transition-colors border border-gray-300">
            📱 ຮັບເທິນເຄື່ອງເກົ່າ
          </Link>
          <Link href="/repair" className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-lg text-xs transition-colors border border-gray-300">
            🛠️ ອອກໃບຮັບຊ່ອມ
          </Link>
        </div>
      </div>
    </div>
  );
}
