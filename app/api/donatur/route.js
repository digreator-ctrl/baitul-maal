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
      linkGmaps: d.lat && d.lng ? `https://www.google.com/maps?q=${d.lat},${d.lng}` : '',
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
      rt, 
      rw, 
      lat, 
      lng, 
      linkGmaps,
      rutin, 
      status,
      kategori
    } = body;

    const finalAlamat = alamat || keterangan || '';
    const finalKabupaten = kabupaten || kota || '';
    const finalDesa = desa || kelurahan || '';

    let finalLat = lat !== undefined && lat !== null && lat !== '' ? parseFloat(lat) : null;
    let finalLng = lng !== undefined && lng !== null && lng !== '' ? parseFloat(lng) : null;
    if ((finalLat === null || finalLng === null) && linkGmaps) {
      const match = linkGmaps.match(/q=(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/);
      if (match) {
        finalLat = parseFloat(match[1]);
        finalLng = parseFloat(match[3]);
      }
    }

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
        rt: rt || null,
        rw: rw || null,
        lat: finalLat,
        lng: finalLng,
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
      linkGmaps: newDonatur.lat && newDonatur.lng ? `https://www.google.com/maps?q=${newDonatur.lat},${newDonatur.lng}` : (linkGmaps || ''),
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("POST DONATUR ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
