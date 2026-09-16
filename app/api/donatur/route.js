import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const donatur = await prisma.donatur.findMany({
      orderBy: { createdAt: "desc" },
    });

    const mapped = donatur.map(d => ({
      ...d,
      kota: d.kabupaten || '',
      kelurahan: d.desa || '',
      keterangan: d.alamat || '',
      linkGmaps: d.linkGmaps || '',
    }));

    return NextResponse.json(mapped);
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
      linkGmaps,
      rutin, 
      status,
      kategori
    } = body;

    const finalAlamat = alamat || keterangan || '';
    const finalKabupaten = kabupaten || kota || '';
    const finalDesa = desa || kelurahan || '';

    if (!nama || !noWa) {
      return NextResponse.json({ error: "Nama dan No WA wajib diisi" }, { status: 400 });
    }

    const newDonatur = await prisma.donatur.create({
      data: {
        nama,
        noWa,
        alamat: finalAlamat,
        provinsi: provinsi || '',
        kabupaten: finalKabupaten,
        kecamatan: kecamatan || '',
        desa: finalDesa,
        linkGmaps: linkGmaps || null,
        rutin: !!rutin,
        status: status || 'aktif',
        kategori: kategori || 'Keluarga',
        petugasId: session.user?.id,
      },
    });

    const responseData = {
      ...newDonatur,
      kota: newDonatur.kabupaten || '',
      kelurahan: newDonatur.desa || '',
      keterangan: newDonatur.alamat || '',
      linkGmaps: newDonatur.linkGmaps || '',
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("POST DONATUR ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
