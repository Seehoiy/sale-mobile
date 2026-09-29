export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const apiStart = Date.now();

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const authUser = await getAuthUser(req);
    const whereClause: any = {};

    // 🛡️ Security & Role 
    if (authUser && authUser.role === "MANAGER") {
      whereClause.branchId = authUser.branchId;
    } else if (branchId && branchId !== "ALL") {
      whereClause.branchId = branchId;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};

      if (startDate) {
        whereClause.createdAt.gte = new Date(`${startDate}T00:00:00.000z`);
      }

      if (endDate) {
        whereClause.createdAt.lte = new Date(`${endDate}T23:59:59.999z`);
      }
    }

    const groupByStart = Date.now();

    const groupedSales = await prisma.sale.groupBy({
      by: ["employeeId"],
      where: whereClause,
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
    });
    const groupByTime = Date.now() - groupByStart;
    console.log(
      `[Employee Sales] DB groupBy: ${groupByTime}ms`
    );

    const employeeIds = groupedSales
      .map((row) => row.employeeId)
      .filter(Boolean);

    const employeeQueryStart = Date.now();
    const employee = await prisma.employee.findMany({
      where: {
        id: {
          in: employeeIds,
        },
      },
      select: {
        id: true,
        fullName: true,
        empCode: true,
      },
    });
    const employeeQueryTime = Date.now() - employeeQueryStart;
    console.log(
      `[Employee Sales] Employee query: ${employeeQueryTime}ms`
    );

    const employeeMap = new Map(
      employee.map((employee) => [
        employee.id,
        employee
      ])
    );

    const result = groupedSales.map((row) => {
      const employee = employeeMap.get(row.employeeId);

      return {
        employeeId: row.employeeId,

        employeeName:
          employee?.fullName ??
          "ບໍ່ລະບຸພະນັກງານ (ໃບບິນເກົ່າ)",

        empCode:
          employee?.empCode ??
          "-",

        billCount: row._count.id,
        totalSales: Number(
          row._sum.total ?? 0
        ),
      };
    });

    console.log(
      `[Employee Sales] employee=${result.length}, total=${Date.now() - apiStart}ms`
    );
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Employee Sales API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}