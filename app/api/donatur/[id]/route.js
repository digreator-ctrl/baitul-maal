import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { 
      nama, 
      noWa, 
      alamat, keterangan,
      provinsi, 
      kabupaten, kota,
      kecamatan, 
      desa, kelurahan,
      rt, 
      rw, 
      lat, 
      lng, 
      linkGmaps,
      rutin, 
      status,
      kategori 
    } = body;

    const finalAlamat = alamat !== undefined ? alamat : (keterangan !== undefined ? keterangan : undefined);
    const finalKabupaten = kabupaten !== undefined ? kabupaten : (kota !== undefined ? kota : undefined);
    const finalDesa = desa !== undefined ? desa : (kelurahan !== undefined ? kelurahan : undefined);

    let finalLat = lat !== undefined && lat !== null && lat !== '' ? parseFloat(lat) : undefined;
    let finalLng = lng !== undefined && lng !== null && lng !== '' ? parseFloat(lng) : undefined;
    if ((finalLat === undefined || finalLng === undefined) && linkGmaps) {
      const match = linkGmaps.match(/q=(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/);
      if (match) {
        finalLat = parseFloat(match[1]);
        finalLng = parseFloat(match[3]);
      }
    }

    const updateData = {};
    if (nama !== undefined) updateData.nama = nama;
    if (noWa !== undefined) updateData.noWa = noWa;
    if (finalAlamat !== undefined) updateData.alamat = finalAlamat;
    if (provinsi !== undefined) updateData.provinsi = provinsi;
    if (finalKabupaten !== undefined) updateData.kabupaten = finalKabupaten;
    if (kecamatan !== undefined) updateData.kecamatan = kecamatan;
    if (finalDesa !== undefined) updateData.desa = finalDesa;
    if (rt !== undefined) updateData.rt = rt;
    if (rw !== undefined) updateData.rw = rw;
    if (finalLat !== undefined) updateData.lat = finalLat;
    if (finalLng !== undefined) updateData.lng = finalLng;
    if (rutin !== undefined) updateData.rutin = !!rutin;
    if (status !== undefined) updateData.status = status;
    if (kategori !== undefined) updateData.kategori = kategori;

    const updatedDonatur = await prisma.donatur.update({
      where: { id },
      data: updateData,
    });

    const responseData = {
      ...updatedDonatur,
      kota: updatedDonatur.kabupaten || '',
      kelurahan: updatedDonatur.desa || '',
      keterangan: updatedDonatur.alamat || '',
      linkGmaps: updatedDonatur.lat && updatedDonatur.lng ? `https://www.google.com/maps?q=${updatedDonatur.lat},${updatedDonatur.lng}` : (linkGmaps || ''),
    };

    return NextResponse.json(responseData);
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
