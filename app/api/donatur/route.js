import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const donatur = await prisma.donatur.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(donatur);
  } catch (error) {
    console.error("GET DONATUR ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { nama, noWa, alamat, provinsi, kabupaten, kecamatan, desa, rt, rw, lat, lng, rutin, status } = body;

    if (!nama || !noWa || !alamat) {
      return NextResponse.json({ error: "Nama, No WA, dan Alamat wajib diisi" }, { status: 400 });
    }

    const newDonatur = await prisma.donatur.create({
      data: {
        nama,
        noWa,
        alamat,
        provinsi,
        kabupaten,
        kecamatan,
        desa,
        rt,
        rw,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        rutin: !!rutin,
        status: status || 'aktif',
        petugasId: session.user?.id,
      },
    });

    return NextResponse.json(newDonatur, { status: 201 });
  } catch (error) {
    console.error("POST DONATUR ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
