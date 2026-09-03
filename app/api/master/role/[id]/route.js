import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    
    // Prevent editing superadmin role
    if (id === 'superadmin') {
      return NextResponse.json({ error: "Role superadmin tidak bisa diedit" }, { status: 403 });
    }

    const { name, permissions } = await request.json();
    const updateData = await prisma.role.update({
      where: { id },
      data: { name, permissions },
    });
    return NextResponse.json(updateData);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { id } = await params;
    // Prevent deleting superadmin role
    if (id === 'superadmin') {
      return NextResponse.json({ error: "Role superadmin tidak bisa dihapus" }, { status: 403 });
    }

    await prisma.role.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
