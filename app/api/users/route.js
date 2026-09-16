import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: { role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      alamat: u.alamat,
      noWa: u.noWa,
      isActive: u.isActive,
      roleId: u.roles.length > 0 ? u.roles[0].roleId : null,
      roleName: u.roles.length > 0 ? u.roles[0].role.name : "No Role",
      roles: u.roles.map((ur) => ur.roleId),
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("GET USERS ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, email, password, roles, alamat, noWa } = body;

    if (!name || !email || !password || !roles || roles.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatar = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        avatar,
        alamat,
        noWa,
        roles: {
          create: roles.map(roleId => ({ roleId })),
        },
      },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    const formattedUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      avatar: newUser.avatar,
      alamat: newUser.alamat,
      noWa: newUser.noWa,
      isActive: newUser.isActive,
      roleId: newUser.roles.length > 0 ? newUser.roles[0].roleId : null,
      roleName: newUser.roles.length > 0 ? newUser.roles[0].role.name : "No Role",
      roles: newUser.roles.map(ur => ur.roleId)
    };

    return NextResponse.json(formattedUser, { status: 201 });
  } catch (error) {
    console.error("POST USER ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
