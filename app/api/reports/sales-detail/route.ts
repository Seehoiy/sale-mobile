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

  // ⚡ BACKEND COMPUTATION & SECURITY OPTIMIZATION:
  // 1) ໃຊ້ getAuthUser ເພື່ອກວດສອບສິດ (MANAGER ເບິ່ງໄດ້ສະເພາະສາຂາຕົນເອງ, ADMIN ເບິ່ງໄດ້ທັງໝົດ)
  // 2) ຄຳນວນ Aggregate ລວມຢູ່ DB (prisma.sale.aggregate) ເພື່ອຄວາມສະຖຽນ ແລະ ເລັ່ງຄວາມໄວ
  const authUser = await getAuthUser(req);
  const whereClause: any = {};

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

  // 🚀 ທຳການຄຳນວນຢູ່ Database (Parallel DB Queries) ໂດຍສົ່ງຄ່າ Aggregate ຄຳນວນແລ້ວຈາກ Backend ໄປ Frontend
  const [salesAggregate, sales] = await Promise.all([
    prisma.sale.aggregate({
      where: whereClause,
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    }),
    prisma.sale.findMany({
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
    }),
  ]);

  const dbTime = Date.now() - dbStart;
  console.log(
    `[Sale Detail] DB Query & Aggregate: ${dbTime}ms | Total Sales=${sales.length}`
  );

  const processingStart = Date.now();
  const itemizedList: any[] = [];
  let totalItemsCount = 0;

  for (const s of sales) {
    for (const item of s.items) {
      const lineTotal = Number(item.unitPrice) *
       (item.quantity || 1) - Number(item.discount || 0);

      totalItemsCount += item.quantity || 1;

      itemizedList.push({
        saleId: s.id,
        invoiceNo: s.invoiceNo,
        billNo: s.billNo,
        createdAt: s.createdAt,
        branchId: s.branchId,

        branchName: s.branch?.name || "-",
        sellerId: s.employee?.id || "-",
        sellerName: s.employee?.fullName || "-",
        sellerCode: s.employee?.empCode || "-",

        customerName: s.customer?.fullName || "ລູກຄ້າທົ່ວໄປ",

        productId: item.productId,
        productName: item.product?.name || "ສິນຄ້າອື່ນໆ",

        sku: item.product?.sku || "-",

        categoryName: item.product?.category?.name || "-",

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

  // 💡 ສົ່ງຂໍ້ມູນ summary ທີ່ຄຳນວນຈາກ Database ໂດຍກົງ ໄປຫາ Frontend
  return Response.json({
    summary: {
      totalBillCount: salesAggregate._count.id ?? 0,
      totalItemsCount,
      grandTotalAmount: Number(salesAggregate._sum.total ?? 0),
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
    },
    { status: 500 }
  );
}
}
