import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ message: "ກະລຸນາປ້ອນລະຫັດ" }, { status: 400 });
    }

    // ຄົ້ນຫາພະນັກງານຈາກ empCode ຫຼື pinCode
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { empCode: code },
          { pinCode: code },
        ],
      },
    });

    if (!employee) {
      return NextResponse.json({ message: "ລະຫັດບໍ່ຖືກຕ້ອງ ຫຼື ບໍ່ມີໃນລະບົບ!" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        fullName: employee.fullName,
        empCode: employee.empCode,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}