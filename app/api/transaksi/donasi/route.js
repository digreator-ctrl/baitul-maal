import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { serializeBigInt } from "@/lib/utils";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await prisma.donasi.findMany({
      include: {
        donatur: true,
        kategori: true,
        metode: true,
      },
      orderBy: { tanggal: "desc" },
    });
    return NextResponse.json(serializeBigInt(data));
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { donaturId, tanggal, nominal, kategoriDonasiId, metodeDonasiId, keterangan } = body;

    const newData = await prisma.donasi.create({
      data: {
        donaturId,
        tanggal: new Date(tanggal),
        nominal: BigInt(nominal),
        kategoriId: kategoriDonasiId,
        metodeId: metodeDonasiId,
        keterangan,
        petugasId: session.user?.id,
        status: 'belum_disetor'
      },
    });
    return NextResponse.json(serializeBigInt(newData), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
