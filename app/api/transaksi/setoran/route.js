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

    const data = await prisma.setoran.findMany({
      where,
      include: {
        metodeDonasi: true,
        donasiList: true
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

    const { tanggal, metodeDonasiId, totalNominal, keterangan, donasiIds } = await request.json();

    const newData = await prisma.setoran.create({
      data: {
        tanggal: new Date(tanggal),
        metodeDonasiId,
        totalNominal: BigInt(totalNominal),
        keterangan,
        petugasId: session.user?.id,
        status: 'menunggu_verifikasi',
        donasiList: {
          connect: donasiIds.map(id => ({ id }))
        }
      },
    });

    // Update status donasi yang disetor
    if (donasiIds && donasiIds.length > 0) {
      await prisma.donasi.updateMany({
        where: { id: { in: donasiIds } },
        data: { status: 'menunggu_verifikasi' }
      });
    }

    return NextResponse.json(serializeBigInt(newData), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
