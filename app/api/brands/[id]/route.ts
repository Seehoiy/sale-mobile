import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 1. API ແກ້ໄຂຊື່ຍີ່ຫໍ້ (PATCH)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name } = await req.json();

    const updated = await prisma.brand.update({
      where: { id: params.id },
      data: { name },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json(
      { error: "ແກ້ໄຂຍີ່ຫໍ້ບໍ່ສຳເລັດ" },
      { status: 400 }
    );
  }
}

// 2. API ລົບຍີ່ຫໍ້ (DELETE)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.brand.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "ລົບບໍ່ສຳເລັດ (ອາດມີສິນຄ້າທີ່ນຳໃຊ້ຍີ່ຫໍ້ນີ້ຢູ່)" },
      { status: 400 }
    );
  }
}