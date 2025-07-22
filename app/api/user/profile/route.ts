export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        username: true,
        email: true,
        name: true,
        bio: true,
        location: true,
        tags: true,
        profileImage: true,
        idType: true,
        idNumber: true,
        kraPin: true,
        address: true,
        phone: true,
        withdrawalAccount: true,
        referralCode: true,
        role: true
      }
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const {
      name,
      bio,
      location,
      tags,
      profileImage,
      address,
      withdrawalAccount
    } = body;
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        bio,
        location,
        tags,
        profileImage,
        address,
        withdrawalAccount
      }
    });
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
