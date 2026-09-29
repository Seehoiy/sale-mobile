import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/utils";

export const dynamic = "force-dynamic";

// GET /api/sales/[id]
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: true,
            inventoryItem: {
              include: { warranty: true },
            },
          },
        },
        payments: true,
        customer: true,
        employee: {
          select: {
            id: true,
            empCode: true,
            fullName: true,
            role: true,
          },
        },
        branch: {
          select: { id: true, name: true, code: true, address: true, phone: true },
        },
      },
    });

    if (!sale) {
      return jsonError("ບໍ່ພົບຂໍ້ມູນໃບບິນນີ້", 404);
    }

    return Response.json(sale);
  } catch (error: any) {
    return jsonError(error.message ?? "ເກີດຂໍ້ຜິດພາດ", 500);
  }
}
