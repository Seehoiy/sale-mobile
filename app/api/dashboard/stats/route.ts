import { prisma } from "@/lib/prisma";
import { startOfDay } from "date-fns";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/dashboard/stats?branchId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    const today = startOfDay(new Date());

    const isFiltered = branchId && branchId !== "ALL";

    const inventoryWhere = isFiltered ? { currentBranchId: branchId } : {};
    const claimWhere = isFiltered ? { branchId } : {};
    const transferWhere = isFiltered ? { toBranchId: branchId } : {};
    const saleWhere = isFiltered ? { branchId } : {};

    const repairWhere = isFiltered ? { branchId } : {};

    const [
      inStock,
      secondHand,
      inRepair,
      inventoryInrepair,
      pendingClaims,
      branches,
      pendingTransfers,
      todaySales,
    ] = await Promise.all([
      prisma.inventoryItem.count({
        where: {
          status: "IN_STOCK",
          ...inventoryWhere,
        },
      }),

      prisma.inventoryItem.count({
        where: {
          status: "SECOND_HAND",
          ...inventoryWhere,
        },
      }),

      prisma.repairJob.count({
        where: {
          status: "IN_PROGRESS",
          ...repairWhere,
        },
      }),

      prisma.inventoryItem.count({
        where: {
          status: "IN_REPAIR",
          ...inventoryWhere,
        },
      }),

      prisma.claimRequest.count({
        where: {
          status: {
            in: ["RECEIVED", "SENT_TO_CENTER"],
          },
          ...claimWhere,
        },
      }),

      prisma.branch.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          code: true,
        },
        orderBy: { name: "asc" },
      }),

      prisma.stockTransfer.count({
        where: {
          status: "IN_TRANSIT",
          ...transferWhere,
        },
      }),

      prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: today,
          },
          ...saleWhere,
        },
        _sum: {
          total: true,
        },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      inStock,
      secondHand,
      inRepair,
      pendingClaims,
      branches,
      pendingTransfers,
      todaySales: {
        count: todaySales._count ?? 0,
        total: Number(todaySales._sum.total ?? 0),
      },
    });
  } catch (error: any) {
    console.error("Dashboard Stats API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
