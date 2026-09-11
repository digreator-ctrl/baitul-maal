import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { serializeBigInt } from "@/lib/utils";


export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const where = {};
    if (session.user.roleId === 'petugas') {
      where.petugasId = session.user.id;
    }

    const data = await prisma.donasi.findMany({
      where,
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

    const reqDate = new Date(tanggal);
    const startOfMonth = new Date(reqDate.getFullYear(), reqDate.getMonth(), 1);
    const endOfMonth = new Date(reqDate.getFullYear(), reqDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const existingDonasiThisMonth = await prisma.donasi.findFirst({
      where: {
        donaturId,
        tanggal: {
          gte: startOfMonth,
          lte: endOfMonth
        },
        petugasId: {
          not: session.user.id
        }
      },
      include: {
        petugas: true,
        donatur: true
      }
    });

    if (existingDonasiThisMonth) {
      return NextResponse.json(
        { error: `Gagal! Donatur ${existingDonasiThisMonth.donatur.nama} sudah didata oleh petugas ${existingDonasiThisMonth.petugas.name} pada bulan ini.` }, 
        { status: 400 }
      );
    }

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
