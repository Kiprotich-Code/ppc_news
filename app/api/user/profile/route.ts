import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

// Validation schema
const profileUpdateSchema = z.object({
  name: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  profileImage: z.string().optional(),
  address: z.string().optional(),
  withdrawalAccount: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
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
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);

    const {
      name,
      bio,
      location,
      tags,
      profileImage,
      address,
      withdrawalAccount,
    } = validatedData;

    // Update User model fields
    const userData: { name?: string; withdrawalAccount?: string } = {};
    if (name) userData.name = name;
    if (withdrawalAccount) userData.withdrawalAccount = withdrawalAccount;

    // Update Profile model fields
    const profileData: {
      bio?: string;
      location?: string;
      tags?: string;
      profileImage?: string;
      address?: string;
    } = {};

    if (bio) profileData.bio = bio;
    if (location) profileData.location = location;
    if (tags) {
      profileData.tags = Array.isArray(tags) ? tags.join(',') : tags;
    }
    if (profileImage) profileData.profileImage = profileImage;
    if (address) profileData.address = address;

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

      // Return full user data with profile
      return tx.user.findUnique({
        where: { id: updated.id },
        include: { profile: true },
      });
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 400 }
      );
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 }
      );
    }

    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}