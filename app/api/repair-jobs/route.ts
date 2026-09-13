import { prisma } from "@/lib/prisma";
import { genCode, jsonError } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const rawBranchId = searchParams.get("branchId");
  const rawStatus = searchParams.get("status");

  const branchId =
    rawBranchId &&
    rawBranchId !== "undefined" &&
    rawBranchId !== "ALL"
      ? rawBranchId
      : undefined;

  const status =
    rawStatus &&
    rawStatus !== "undefined" &&
    rawStatus !== "ALL"
      ? rawStatus
      : undefined;

  try {
    const jobs = await prisma.repairJob.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        ...(status ? { status: status as any } : {}),
      },

      include: {
        customer: true,
        technician: true,
        inventoryItem: true,
        parts: {
          include: {
            product: true,
          },
        },
      },

      orderBy: {
        receivedAt: "desc",
      },
    });

    return Response.json(jobs);
  } catch (error: any) {
    console.error("GET /api/repair-jobs error:", error);

    return jsonError(
      error.message || "ເກີດຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນ",
      500
    );
  }
}


// ======================================================
// POST /api/repair-jobs
// ອອກໃບຮັບຊ່ອມ
// ======================================================

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ==================================================
    // 1. Validate required fields
    // ==================================================

    const required = [
      "branchId",
      "customerId",
      "deviceDescription",
      "issueDescription",
    ];

    for (const field of required) {
      if (
        body[field] === undefined ||
        body[field] === null ||
        String(body[field]).trim() === ""
      ) {
        return jsonError(`${field} ຈຳເປັນ`, 400);
      }
    }

    // ==================================================
    // 2. Check Branch
    // ==================================================

    const branch = await prisma.branch.findUnique({
      where: {
        id: String(body.branchId),
      },
    });

    if (!branch) {
      return jsonError("ບໍ່ພົບສາຂານີ້", 400);
    }

    // ==================================================
    // 3. Check Customer
    // ==================================================

    const customer = await prisma.customer.findUnique({
      where: {
        id: String(body.customerId),
      },
    });

    if (!customer) {
      return jsonError("ບໍ່ພົບລູກຄ້ານີ້", 400);
    }

    // ==================================================
    // 4. Check Inventory Item (optional)
    // ==================================================

    if (body.inventoryItemId) {
      const inventoryItem = await prisma.inventoryItem.findUnique({
        where: {
          id: String(body.inventoryItemId),
        },
      });

      if (!inventoryItem) {
        return jsonError("ບໍ່ພົບສິນຄ້າ Inventory ນີ້", 400);
      }
    }

    // ==================================================
    // 5. Create Repair Job
    // ==================================================

    const result = await prisma.$transaction(async (tx: any) => {
      const job = await tx.repairJob.create({
        data: {
          ticketNo: genCode("RPR"),

          branchId: String(body.branchId),

          customerId: String(body.customerId),

          inventoryItemId: body.inventoryItemId
            ? String(body.inventoryItemId)
            : null,

          imeiInput: body.imeiInput
            ? String(body.imeiInput)
            : null,

          deviceDescription: String(body.deviceDescription),

          passcode: body.passcode
            ? String(body.passcode)
            : null,

          issueDescription: String(body.issueDescription),

          conditionImages: Array.isArray(body.conditionImages)
            ? body.conditionImages
            : [],

          estimatedCost:
            body.estimatedCost !== undefined &&
            body.estimatedCost !== null &&
            body.estimatedCost !== ""
              ? Number(body.estimatedCost)
              : null,

          status: "PENDING",
        },
      });

      // ==================================================
      // 6. If Inventory Item exists
      //    change status -> IN_REPAIR
      // ==================================================

      if (body.inventoryItemId) {
        await tx.inventoryItem.update({
          where: {
            id: String(body.inventoryItemId),
          },

          data: {
            status: "IN_REPAIR",
          },
        });

        // ==================================================
        // 7. Save IMEI History
        // ==================================================

        await tx.imeiHistory.create({
          data: {
            inventoryItemId: String(body.inventoryItemId),

            eventType: "REPAIR_IN",

            refType: "RepairJob",

            refId: job.id,

            note: `ຮັບເຂົ້າຊ່ອມ: ${body.issueDescription}`,
          },
        });
      }

      return job;
    });

    // ==================================================
    // 8. Success
    // ==================================================

    return Response.json(result, {
      status: 201,
    });
  } catch (error: any) {
    console.error("POST /api/repair-jobs error:", error);

    return jsonError(
      error.message || "ບໍ່ສາມາດອອກໃບຮັບຊ່ອມໄດ້",
      500
    );
  }
}