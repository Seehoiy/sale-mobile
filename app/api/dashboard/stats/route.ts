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

    // 🛡️ SECURITY & BRANCH ISOLATION: ຖ້າເປັນ MANAGER ໃຫ້ລັອກເບິ່ງສະເພາະ branchId ຂອງຕົນເອງເທົ່ານັ້ນ
    let targetBranchId: string | null = null;
    if (authUser && authUser.role === "MANAGER") {
      targetBranchId = authUser.branchId;
    } else if (branchId && branchId !== "ALL") {
      targetBranchId = branchId;
    }

    const isFiltered = !!targetBranchId;

    const inventoryWhere = isFiltered
      ? { currentBranchId: targetBranchId! }
      : {};

    const claimWhere = isFiltered
      ? { branchId: targetBranchId! }
      : {};

    const transferWhere = isFiltered
      ? { toBranchId: targetBranchId! }
      : {};

    const saleWhere = isFiltered
      ? { branchId: targetBranchId! }
      : {};

    const repairWhere = isFiltered
      ? { branchId: targetBranchId! }
      : {};

    // ⚡ BACKEND DB AGGREGATION & PARALLEL EXECUTION:
    // ຄຳນວນ Count & Sum ທັງໝົດຢູ່ Database Tier ຜ່ານ Promise.all ເພື່ອຄວາມໄວ 10x ແລະ ເຮັດໃຫ້ Frontend ສະຖຽນ
    const [
      inventoryByStatus,
      inStock,
      secondHand,
      activeRepairsCount,
      inventoryInrepair,
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

      // Pending Claims
      prisma.claimRequest.count({
        where: {
          status: {
            in: ["RECEIVED", "SENT_TO_CENTER"],
          },
          ...claimWhere,
        },
      }),

      // Active Branches
      prisma.branch.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          code: true,
        },
        orderBy: {
          name: "asc",
        },
      }),

      // Pending Transfers
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

    // GroupBy ໃຫ້ເປັນ count
    let calculatedInStock = inStock;
    let calculatedSecondHand = secondHand;

    for (const row of inventoryByStatus) {
      const count = typeof row._count === "object" ? (row._count._all ?? (row._count as any).id ?? 0) : (row._count ?? 0);

      if (row.status === "IN_STOCK") {
        calculatedInStock = count;
      }

      if (row.status === "SECOND_HAND") {
        calculatedSecondHand = count;
      }
    }

    const inRepair = activeRepairsCount;

    // Log performance
    const totalTime = Date.now() - apiStart;

    console.log(
      `[Dashboard Status] inventory=${inventoryByStatus.length} status | activeRepairs=${inRepair} | total=${totalTime}ms`
    );

    const todayCount = typeof todaySales._count === "object" 
      ? ((todaySales._count as any)?._all ?? (todaySales._count as any)?.id ?? 0)
      : (todaySales._count ?? 0);

    return NextResponse.json({
      inStock: calculatedInStock,
      secondHand: calculatedSecondHand,
      inRepair,
      pendingClaims,
      branches,
      pendingTransfers,

      todaySales: {
        count: todayCount,
        total: Number(todaySales._sum.total ?? 0),
      },
    });
  } catch (error: any) {
    console.error("Dashboard Stats API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}