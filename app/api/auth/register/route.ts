import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // User fields
    const {
      email,
      password,
      username,
      name,
      withdrawalAccount,
      ref // referral code from query param
    } = body;

    // Profile fields
    const {
      bio,
      location,
      tags,
      profileImage,
      idType,
      idNumber,
      kraPin,
      address,
      phone
    } = body;

    if (!email || !password || !name || !username) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user/email/username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or username already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate unique referral code
    let referralCode;
    let isUnique = false;
    while (!isUnique) {
      referralCode = uuidv4().slice(0, 8);
      const codeExists = await prisma.user.findUnique({ where: { referralCode } });
      if (!codeExists) isUnique = true;
    }

    // Find referrer if ref param is present
    let referredById = null;
    if (ref) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: ref } });
      if (referrer) referredById = referrer.id;
    }

    // Create user

    // Create user (basic fields only)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        name,
        withdrawalAccount,
        referralCode: referralCode || "",
        referredById,
        role: "WRITER"
      }
    });

    // Create profile (if any profile fields provided)
    // await prisma.profile.create({
    //   data: {
    //     userId: user.id,
    //     bio,
    //     location,
    //     tags,
    //     profileImage,
    //     idType,
    //     idNumber,
    //     kraPin,
    //     address,
    //     phone
    //   }
    // });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        referralCode: user.referralCode,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}