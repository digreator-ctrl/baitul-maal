import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { serializeBigInt } from "@/lib/utils";


export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { id } = await params;
    const body = await request.json();
    
    if (body.nominal !== undefined) body.nominal = BigInt(body.nominal);
    if (body.kategoriDonasiId) { body.kategoriId = body.kategoriDonasiId; delete body.kategoriDonasiId; }
    if (body.metodeDonasiId) { body.metodeId = body.metodeDonasiId; delete body.metodeDonasiId; }
    if (body.tanggal) body.tanggal = new Date(body.tanggal);
    if ('laporanTerkirim' in body) delete body.laporanTerkirim;
    
    const updateData = await prisma.donasi.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(serializeBigInt(updateData));
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { id } = await params;
    await prisma.donasi.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
