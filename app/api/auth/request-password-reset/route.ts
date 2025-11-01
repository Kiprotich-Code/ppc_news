import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";


export const dynamic = 'force-dynamic';

const EXPIRY_MINUTES = 30;

export async function POST(req: Request) {
  try {
    const { email, dev } = await req.json().catch(() => ({}));
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, used: false, expires: { gt: new Date() } }
      });

      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: { token, userId: user.id, expires }
      });

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const resetLink = `${baseUrl}/auth/reset-password?token=${token}`;

      if (dev) {
        return NextResponse.json({
          success: true,
          exists: true,
          resetLink,
          expires: expires.toISOString()
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
