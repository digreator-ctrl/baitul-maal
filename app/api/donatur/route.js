import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
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
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    // Map fields from frontend payload to backend schema
    const { 
      nama, 
      noWa, 
      alamat, keterangan, // frontend sends keterangan
      provinsi, 
      kabupaten, kota, // frontend sends kota
      kecamatan, 
      desa, kelurahan, // frontend sends kelurahan
      rt, 
      rw, 
      lat, 
      lng, 
      rutin, 
      status,
      kategori // currently not in DB schema, but frontend sends it
    } = body;

    const finalAlamat = alamat || keterangan;
    const finalKabupaten = kabupaten || kota;
    const finalDesa = desa || kelurahan;

    if (!nama || !noWa || !finalAlamat) {
      return NextResponse.json({ error: "Nama, No WA, dan Alamat wajib diisi" }, { status: 400 });
    }

    const newDonatur = await prisma.donatur.create({
      data: {
        nama,
        noWa,
        alamat: finalAlamat,
        provinsi,
        kabupaten: finalKabupaten,
        kecamatan,
        desa: finalDesa,
        rt,
        rw,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        rutin: !!rutin,
        status: status || 'aktif',
        kategori: kategori || 'Keluarga',
        petugasId: session.user?.id,
      },
    });

    // We can manually add kategori to the response so the frontend receives it
    return NextResponse.json({ ...newDonatur, kategori: kategori || 'Non Keluarga' }, { status: 201 });
  } catch (error) {
    console.error("POST DONATUR ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
