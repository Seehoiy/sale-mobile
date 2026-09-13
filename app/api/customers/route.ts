import { prisma } from "@/lib/prisma";


// ======================================================
// GET /api/customers?search=xxx
// Search Customer
// ======================================================

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";

    const customers = await prisma.customer.findMany({
      where: search
        ? {
            OR: [
              {
                fullName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                id: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                phone: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {},

      select: {
        id: true,
        fullName: true,
        phone: true,
      },

      orderBy: {
        fullName: "asc",
      },

      take: 10,
    });

    return Response.json(customers);
  } catch (error: any) {
    console.error("GET /api/customers error:", error);

    return Response.json(
      {
        error:
          error.message || "ບໍ່ສາມາດຄົ້ນຫາລູກຄ້າ",
      },
      {
        status: 500,
      }
    );
  }
}


// ======================================================
// POST /api/customers
// Create New Customer
// ======================================================

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const fullName = String(body.fullName || "").trim();
    const phone = String(body.phone || "").trim();

    // ----------------------------------------------
    // Validate name
    // ----------------------------------------------

    if (!fullName) {
      return Response.json(
        {
          error: "ກະລຸນາປ້ອນຊື່ລູກຄ້າ",
        },
        {
          status: 400,
        }
      );
    }

    // ----------------------------------------------
    // Check duplicate phone
    // ----------------------------------------------

    if (phone) {
      const existingCustomer = await prisma.customer.findUnique({
        where: {
          phone,
        },
      });

      if (existingCustomer) {
        return Response.json(
          {
            error: "ເບີໂທນີ້ມີລູກຄ້າຢູ່ແລ້ວ",
            customer: existingCustomer,
          },
          {
            status: 409,
          }
        );
      }
    }

    // ----------------------------------------------
    // Create Customer
    // ----------------------------------------------

    const customer = await prisma.customer.create({
      data: {
        fullName,
        phone: phone || null,
      },

      select: {
        id: true,
        fullName: true,
        phone: true,
      },
    });

    return Response.json(customer, {
      status: 201,
    });
  } catch (error: any) {
    console.error("POST /api/customers error:", error);

    return Response.json(
      {
        error:
          error.message || "ບໍ່ສາມາດເພີ່ມລູກຄ້າ",
      },
      {
        status: 500,
      }
    );
  }
}