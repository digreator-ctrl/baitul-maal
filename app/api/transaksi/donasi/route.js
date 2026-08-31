import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await prisma.donasi.findMany({
      include: {
        donatur: true,
        kategori: true,
        metode: true,
      },
      orderBy: { tanggal: "desc" },
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { donaturId, tanggal, nominal, kategoriDonasiId, metodeDonasiId, keterangan } = body;

    const newData = await prisma.donasi.create({
      data: {
        donaturId,
        tanggal: new Date(tanggal),
        nominal: parseInt(nominal),
        kategoriDonasiId,
        metodeDonasiId,
        keterangan,
        petugasId: session.user?.id,
        status: 'belum_disetor'
      },
    });
    return NextResponse.json(newData, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
