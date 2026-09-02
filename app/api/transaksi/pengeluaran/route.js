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

    const data = await prisma.pengeluaran.findMany({
      include: { pos: true, sumberDana: true },
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

    const { tanggal, posPengeluaranId, nominal, penerima, keterangan, sumberDanaId } = await request.json();

    const newData = await prisma.pengeluaran.create({
      data: {
        tanggal: new Date(tanggal),
        posId: posPengeluaranId,
        nominal: BigInt(nominal),
        penerima: penerima || "-",
        keterangan,
        metodeId: sumberDanaId,
        dibuatOleh: session.user?.id
      },
    });
    return NextResponse.json(serializeBigInt(newData), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
