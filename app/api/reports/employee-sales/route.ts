export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(`${startDate}T00:00:00.000z`);
    }
    if (endDate) {
      dateFilter.lte = new Date(`${endDate}T23:59:59.999z`);
    }

    const sales = await prisma.sale.findMany({
      where: {
        ...(branchId && branchId !== "ALL" ? { branchId } : {}),
        ...(startDate || endDate ? { createdAt: dateFilter } : {}),
      },
      include: {
        employee: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const summaryMap: Record<string, any> = {};

    sales.forEach((sale) => {
      const empId = sale.employeeId || "unassigned";
      const empName = sale.employee?.fullName || "ບໍ່ລະບຸພະນັກງານ (ໃບບິນເກົ່າ)";
      const empCode = sale.employee?.empCode || "-";

      if (!summaryMap[empId]) {
        summaryMap[empId] = {
          employeeId: empId,
          employeeName: empName,
          empCode,
          billCount: 0,
          totalSales: 0,
        };
      }

      summaryMap[empId].billCount += 1;
      summaryMap[empId].totalSales += Number(sale.total || 0);
    });

    return NextResponse.json(Object.values(summaryMap));
  } catch (error: any) {
    console.error("Employee Sales API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}