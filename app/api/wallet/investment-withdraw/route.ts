import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { withdrawInvestment } from "@/lib/wallet";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { amount } = await req.json();
    const userId = session.user.id;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    await withdrawInvestment(userId, amount);

    // Get updated wallet data
    const walletData = await prisma.$queryRaw<Array<{
      balance: number;
      earnings: number;
      investment: number;
    }>>`
      SELECT balance, earnings, investment 
      FROM "Wallet" 
      WHERE "userId" = ${userId}
    `;

    return NextResponse.json({
      success: true,
      message: "Investment withdrawal successful",
      wallet: walletData[0]
    });

  } catch (error: any) {
    console.error('Investment withdrawal error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to process investment withdrawal' 
    }, { status: 400 });
  }
}
