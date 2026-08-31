import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await prisma.pengeluaran.findMany({
      include: { pos: true, sumberDana: true },
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

    const { tanggal, posPengeluaranId, nominal, keterangan, sumberDanaId } = await request.json();

    const newData = await prisma.pengeluaran.create({
      data: {
        tanggal: new Date(tanggal),
        posPengeluaranId,
        nominal: parseInt(nominal),
        keterangan,
        sumberDanaId,
        dicatatOleh: session.user?.id
      },
    });
    return NextResponse.json(newData, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
