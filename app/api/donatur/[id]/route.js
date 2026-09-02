import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { nama, noWa, alamat, provinsi, kabupaten, kecamatan, desa, rt, rw, lat, lng, rutin, status } = body;

    const updateData = {
      nama,
      noWa,
      alamat,
      provinsi,
      kabupaten,
      kecamatan,
      desa,
      rt,
      rw,
      lat: lat !== undefined ? parseFloat(lat) : undefined,
      lng: lng !== undefined ? parseFloat(lng) : undefined,
      rutin: rutin !== undefined ? !!rutin : undefined,
      status,
    };

    const updatedDonatur = await prisma.donatur.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedDonatur);
  } catch (error) {
    console.error("PUT DONATUR ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.donatur.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE DONATUR ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
