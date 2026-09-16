import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    if (id === "u-digreator") {
      return NextResponse.json({ error: "Akun Super Admin utama tidak dapat diubah." }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, roles, alamat, noWa, isActive } = body;

    const updateData = {
      name,
      email,
      alamat,
      noWa,
    };

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    if (roles && roles.length > 0) {
      await prisma.userRole.deleteMany({ where: { userId: id } });
      await prisma.userRole.createMany({
        data: roles.map(roleId => ({ userId: id, roleId })),
      });
    }

    const userWithRoles = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: { include: { role: true } },
      },
    });

    const formattedUser = {
      id: userWithRoles.id,
      name: userWithRoles.name,
      email: userWithRoles.email,
      avatar: userWithRoles.avatar,
      alamat: userWithRoles.alamat,
      noWa: userWithRoles.noWa,
      isActive: userWithRoles.isActive,
      roleId: userWithRoles.roles.length > 0 ? userWithRoles.roles[0].roleId : null,
      roleName: userWithRoles.roles.length > 0 ? userWithRoles.roles[0].role.name : "No Role",
      roles: userWithRoles.roles.map(ur => ur.roleId)
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error("PUT USER ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    if (id === "u-digreator") {
      return NextResponse.json({ error: "Akun Super Admin utama tidak dapat dihapus." }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
