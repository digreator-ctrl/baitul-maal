import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { serializeBigInt } from "@/lib/utils";

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { id } = await params;
    const { status, catatan } = await request.json();
    
    const updateData = await prisma.setoran.update({
      where: { id },
      data: { 
        status, 
        catatan,
        verifikasiOleh: session.user?.id,
        tanggalVerifikasi: new Date()
      },
      include: { donasiList: true }
    });

    // Sync donasi status
    if (updateData.donasiList && updateData.donasiList.length > 0) {
       const donasiStatus = status === 'terverifikasi' ? 'terverifikasi' : (status === 'ditolak' ? 'ditolak' : 'menunggu_verifikasi');
       await prisma.donasi.updateMany({
         where: { setoranId: id },
         data: { status: donasiStatus }
       });
    }

    return NextResponse.json(serializeBigInt(updateData));
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
