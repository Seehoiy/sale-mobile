import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// 1. API ແກ້ໄຂຊື່ໝວດໝູ່ (PATCH)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name } = await req.json();
    const updated = await prisma.category.update({
      where: { id: params.id },
      data: { name },
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json(
      { error: "ແກ້ໄຂໝວດໝູ່ບໍ່ສຳເລັດ" },
      { status: 400 }
    );
  }
}

// 2. API ລົບໝວດໝູ່ (DELETE)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.category.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "ລົບບໍ່ສຳເລັດ (ອາດມີສິນຄ້າທີ່ນຳໃຊ້ໝວດໝູ່ນີ້ຢູ່)" },
      { status: 400 }
    );
  }
}