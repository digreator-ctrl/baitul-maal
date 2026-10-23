import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userRoles = session.user.roles || (session.user.roleId ? [session.user.roleId] : []);
    const isPrivileged = userRoles.some(r => ['superadmin', 'admin'].includes(r));

    if (!isPrivileged) {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya Admin dan Super Admin yang dapat mengatur pembagian donatur." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { donaturIds, petugasId } = body;

    if (!donaturIds || !Array.isArray(donaturIds) || donaturIds.length === 0) {
      return NextResponse.json(
        { error: "Pilih setidaknya satu donatur untuk ditugaskan." },
        { status: 400 }
      );
    }

    let targetPetugasName = "Tanpa Petugas (Dilepas)";
    if (petugasId) {
      const petugasUser = await prisma.user.findUnique({
        where: { id: petugasId },
        select: { id: true, name: true },
      });
      if (!petugasUser) {
        return NextResponse.json({ error: "Petugas yang dipilih tidak ditemukan." }, { status: 404 });
      }
      targetPetugasName = petugasUser.name;
    }

    const result = await prisma.donatur.updateMany({
      where: {
        id: { in: donaturIds },
      },
      data: {
        petugasId: petugasId || null,
      },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      targetPetugasName,
      message: petugasId
        ? `Berhasil membagikan ${result.count} donatur kepada ${targetPetugasName}.`
        : `Berhasil melepas penugasan ${result.count} donatur.`,
    });
  } catch (error) {
    console.error("BATCH ASSIGN DONATUR ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
