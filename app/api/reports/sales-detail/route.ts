import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/reports/sales-detail?branchId=...&startDate=...&endDate=...
export async function GET(req: Request) {

  const apiStart = Date.now();
  try {
  const { searchParams } = new URL(req.url);

  const branchId = searchParams.get("branchId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const authUser = await getAuthUser(req);
  const whereClause: any = {};

  // 🛡️ Security & Access Control:
  if (authUser && authUser.role === "MANAGER") {
    whereClause.branchId = authUser.branchId;
  } else if (branchId && branchId !== "ALL") {
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

  const dbStart = Date.now();

  const sales = await prisma.sale.findMany({
    where: whereClause,
    select: {
      id: true,
      invoiceNo: true,
      billNo: true,
      createdAt: true,
      branchId: true,

      employee: {
        select: {
          id: true,
          empCode: true,
          fullName: true,
        },
      },

      branch: {
        select: {
          name: true,
        },
      },

      customer: {
        select: {
          fullName: true,
        },
      },

      items: {
        select: {
          productId: true,
          quantity: true,
          unitPrice: true,
          discount: true,

          product: {
            select: {
              id: true,
              name: true,
              sku: true,

              category: {
                select: {
                  name: true,
                },
              },
            },
          },
          inventoryItem: {
            select: {
              imei1: true,

              warranty: {
                select: {
                  durationMonths: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { 
      createdAt: "desc" 
    },
    take: 500,
  });

  const dbTime = Date.now() - dbStart;
  console.log(
    `[Sale Detail] DB query: ${dbTime}ms | sales=${sales.length}`
  );

 const processingStart = Date.now();
  const itemizedList: any[] = [];
  let grandTotalAmount = 0;
  let totalItemsCount = 0;

  for (const s of sales) {
    for (const item of s.items) {
      const lineTotal = Number(item.unitPrice) *
       (item.quantity || 1) - Number(item.discount || 0);

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

        categoryName: item.product.category?.name || "-",

        imei: item.inventoryItem?.imei1 || null,

        unitPrice: Number(item.unitPrice),

        quantity: item.quantity,

        discount: Number(item.discount),

        lineTotal,

        warrantyMonths: item.inventoryItem?.warranty?.durationMonths ?? 0,
      });
    }
  }
  const processingTime = Date.now() - processingStart;

  const totalTime = Date.now() - apiStart;

  console.log(
    `[Sale Detail] Processing: ${processingTime}ms`
  );

  console.log(
    `[Sale Detail] items=${itemizedList.length} | total=${totalTime}ms`
  );

  return Response.json({
    summary: {
      totalBillCount: sales.length,
      totalItemsCount,
      grandTotalAmount,
    },
    items: itemizedList,
  });

} catch (error: any) {
  console.error(
    "Sales Detail API Error:",
    error
  );

  return Response.json(
    {
      error: error.message,
    }
  );
}
}
