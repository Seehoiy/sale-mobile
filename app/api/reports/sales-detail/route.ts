import { prisma } from "@/lib/prisma";

// GET /api/reports/sales-detail?branchId=...&startDate=...&endDate=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const whereClause: any = {};

  if (branchId && branchId !== "ALL") {
    whereClause.branchId = branchId;
  }

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) {
      const dStart = new Date(startDate);
      dStart.setHours(0, 0, 0, 0);
      whereClause.createdAt.gte = dStart;
    }
    if (endDate) {
      const dEnd = new Date(endDate);
      dEnd.setHours(23, 59, 59, 999);
      whereClause.createdAt.lte = dEnd;
    }
  }

  const sales = await prisma.sale.findMany({
    where: whereClause,
    include: {
      items: {
        include: {
          product: {
            include: { category: true, brand: true },
          },
          inventoryItem: {
            include: { warranty: true },
          },
        },
      },
      employee: {
        select: {
          id: true,
          empCode: true,
          fullName: true,
          role: true,
        },
      },
      branch: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      customer: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  // Flatten into itemized sale breakdown lines
  const itemizedList: any[] = [];
  let grandTotalAmount = 0;
  let totalItemsCount = 0;

  for (const s of sales) {
    for (const item of s.items) {
      const lineTotal = Number(item.unitPrice) * (item.quantity || 1) - Number(item.discount || 0);
      grandTotalAmount += lineTotal;
      totalItemsCount += item.quantity || 1;

      itemizedList.push({
        saleId: s.id,
        invoiceNo: s.invoiceNo,
        billNo: s.billNo,
        createdAt: s.createdAt,
        branchId: s.branchId,
        branchName: s.branch.name,
        sellerId: s.employee.id,
        sellerName: s.employee.fullName,
        sellerCode: s.employee.empCode,
        customerName: s.customer?.fullName || "ລູກຄ້າທົ່ວໄປ",
        productId: item.productId,
        productName: item.product.name,
        sku: item.product.sku,
        categoryName: item.product.category.name,
        imei: item.inventoryItem?.imei1 || null,
        unitPrice: Number(item.unitPrice),
        quantity: item.quantity,
        discount: Number(item.discount),
        lineTotal,
        warrantyMonths: item.inventoryItem?.warranty?.durationMonths ?? 0,
      });
    }
  }

  return Response.json({
    summary: {
      totalBillCount: sales.length,
      totalItemsCount,
      grandTotalAmount,
    },
    items: itemizedList,
  });
}
