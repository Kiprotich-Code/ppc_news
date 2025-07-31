import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true, // Include profile to access bio, location, etc.
      },
      select: {
        username: true,
        email: true,
        name: true,
        role: true,
        withdrawalAccount: true,
        referralCode: true,
        profile: {
          select: {
            bio: true,
            location: true,
            tags: true,
            profileImage: true,
            idType: true,
            idNumber: true,
            kraPin: true,
            address: true,
            phone: true,
          },
        },
      },
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
      withdrawalAccount,
    } = body;

    // Update User model fields
    const userData = {};
    if (name) userData.name = name;
    if (withdrawalAccount) userData.withdrawalAccount = withdrawalAccount;

    // Update Profile model fields
    const profileData = {};
    if (bio) profileData.bio = bio;
    if (location) profileData.location = location;
    if (tags) profileData.tags = tags;
    if (profileImage) profileData.profileImage = profileImage;
    if (address) profileData.address = address;

    // Perform updates in a transaction to ensure consistency
    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { email: session.user.email },
        data: userData,
      });

      if (Object.keys(profileData).length > 0) {
        await tx.profile.upsert({
          where: { userId: updated.id },
          create: {
            userId: updated.id,
            ...profileData,
          },
          update: profileData,
        });
      }

      return updated;
    });

    // Fetch the updated user with profile to return
    const userWithProfile = await prisma.user.findUnique({
      where: { id: updatedUser.id },
      include: {
        profile: true,
      },
    });

    return NextResponse.json({ user: userWithProfile });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}