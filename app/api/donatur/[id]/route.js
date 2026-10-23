import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.donatur.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Donatur tidak ditemukan" }, { status: 404 });
    }

    const userRoles = session.user.roles || (session.user.roleId ? [session.user.roleId] : []);
    const isPrivileged = userRoles.some(r => ['superadmin', 'admin'].includes(r));
    const isPetugas = userRoles.includes('petugas') && !isPrivileged;

    if (isPetugas && existing.petugasId !== session.user.id) {
      return NextResponse.json({ error: "Akses ditolak: Anda tidak memiliki akses ke donatur ini" }, { status: 403 });
    }

    const body = await request.json();
    const { 
      nama, 
      noWa, 
      alamat, keterangan,
      provinsi, 
      kabupaten, kota,
      kecamatan, 
      desa, kelurahan,
      linkGmaps,
      rutin, 
      status,
      kategori,
      petugasId,
    } = body;

    const finalAlamat = alamat !== undefined ? alamat : (keterangan !== undefined ? keterangan : undefined);
    const finalKabupaten = kabupaten !== undefined ? kabupaten : (kota !== undefined ? kota : undefined);
    const finalDesa = desa !== undefined ? desa : (kelurahan !== undefined ? kelurahan : undefined);

    const updateData = {};
    if (nama !== undefined) updateData.nama = nama;
    if (noWa !== undefined) updateData.noWa = noWa;
    if (finalAlamat !== undefined) updateData.alamat = finalAlamat;
    if (provinsi !== undefined) updateData.provinsi = provinsi;
    if (finalKabupaten !== undefined) updateData.kabupaten = finalKabupaten;
    if (kecamatan !== undefined) updateData.kecamatan = kecamatan;
    if (finalDesa !== undefined) updateData.desa = finalDesa;
    if (linkGmaps !== undefined) updateData.linkGmaps = linkGmaps;
    if (rutin !== undefined) updateData.rutin = !!rutin;
    if (status !== undefined) updateData.status = status;
    if (kategori !== undefined) updateData.kategori = kategori;
    if (isPrivileged && petugasId !== undefined) {
      updateData.petugasId = petugasId || null;
    }

    const updatedDonatur = await prisma.donatur.update({
      where: { id },
      data: updateData,
      include: {
        petugas: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const responseData = {
      ...updatedDonatur,
      petugasNama: updatedDonatur.petugas?.name || null,
      kota: updatedDonatur.kabupaten || '',
      kelurahan: updatedDonatur.desa || '',
      keterangan: updatedDonatur.alamat || '',
      linkGmaps: updatedDonatur.linkGmaps || '',
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

    const existing = await prisma.donatur.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Donatur tidak ditemukan" }, { status: 404 });
    }

    const userRoles = session.user.roles || (session.user.roleId ? [session.user.roleId] : []);
    const isPrivileged = userRoles.some(r => ['superadmin', 'admin'].includes(r));
    const isPetugas = userRoles.includes('petugas') && !isPrivileged;

    if (isPetugas && existing.petugasId !== session.user.id) {
      return NextResponse.json({ error: "Akses ditolak: Anda tidak memiliki akses untuk menghapus donatur ini" }, { status: 403 });
    }
    
    // Periksa apakah donatur memiliki relasi donasi
    const donationCount = await prisma.donasi.count({ where: { donaturId: id } });
    if (donationCount > 0) {
      return NextResponse.json(
        { error: "Gagal menghapus: Donatur ini sudah memiliki riwayat donasi." }, 
        { status: 400 }
      );
    }

    await prisma.donatur.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE DONATUR ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
