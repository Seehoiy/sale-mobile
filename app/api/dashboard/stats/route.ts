import { prisma } from "@/lib/prisma";
import { startOfDay } from "date-fns";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/dashboard/stats?branchId=...
export async function GET(req: Request) {

  const apiStart = Date.now();

  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const authUser = await getAuthUser(req);

    const today = startOfDay(new Date());

    let targetBranchId: string | null = null;
    if (authUser && authUser.role === "MANAGER") {
      targetBranchId = authUser.branchId;
    } else if (branchId && branchId !== "ALL") {
      targetBranchId = branchId;
    }

    const isFiltered = !!targetBranchId;

    const inventoryWhere = isFiltered ?
      { currentBranchId: targetBranchId! } : {};

    const claimWhere = isFiltered ?
      { branchId: targetBranchId! } : {};

    const transferWhere = isFiltered ?
      { toBranchId: targetBranchId! } : {};

    const saleWhere = isFiltered ?
      { branchId: targetBranchId! } : {};

    const [
      inventoryByStatus,
      pendingClaims,
      branches,
      pendingTransfers,
      todaySales,
    ] = await Promise.all([
      prisma.inventoryItem.groupBy({
        by: ["status"],
        where: inventoryWhere,
        _count: {
          _all: true,
        },
      }),

      //Pending Claims
      prisma.claimRequest.count({
        where: {
          status: {
            in: ["RECEIVED", "SENT_TO_CENTER"],
          },
          ...claimWhere,
        },
      }),

      //Active Branches
      prisma.branch.findMany({
        where: {
          isActive: true
        },
        select: {
          id: true,
          name: true,
          code: true,
        },
        orderBy: {
          name: "asc"
        },
      }),

      //Pending Transfers
      prisma.stockTransfer.count({
        where: {
          status: "IN_TRANSIT",
          ...transferWhere,
        },
      }),

      // Today's Sales
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

    //GroupBy ໃຫ້ເປັນ count
    let inStock = 0;
    let secondHand = 0;
    let inRepair = 0;

    for (const row of inventoryByStatus) {
      const count = row._count._all;

      if (row.status === "IN_STOCK") {
        inStock = count;
      }

      if (row.status === "SECOND_HAND") {
        secondHand = count;
      }

      if (row.status === "IN_REPAIR") {
        inRepair = count;
      }
    }

    //Log performance
    const totalTime = Date.now() - apiStart;

    console.log(
      `[Dashboard Status] inventory=${inventoryByStatus.length} status | total=${totalTime}ms`
    );

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
