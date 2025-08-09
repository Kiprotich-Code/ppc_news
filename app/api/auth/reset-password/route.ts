import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }
    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: { select: { email: true } } }
    });
    if (!record || record.used || record.expires < new Date()) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }
    const email = record.user.email;
    const [local, domain] = email.split("@");
    const masked =
      (local[0] || "") +
      (local.length > 1 ? "*".repeat(Math.max(local.length - 2, 1)) : "") +
      (local.length > 1 ? local.slice(-1) : "") +
      "@" +
      domain;
    return NextResponse.json({ valid: true, emailMasked: masked });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json().catch(() => ({}));
    if (!token || !password) {
      return NextResponse.json({ error: "token and password required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password too short" }, { status: 400 });
    }
    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.used || record.expires < new Date()) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: record.userId }, data: { password: hash } });
    await prisma.passwordResetToken.update({ where: { token }, data: { used: true } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
