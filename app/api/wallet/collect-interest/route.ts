import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { creditInvestmentInterest } from "@/lib/wallet";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    await creditInvestmentInterest(userId);

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
      message: "Interest collected successfully",
      wallet: walletData[0]
    });

  } catch (error: any) {
    console.error('Interest collection error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to collect interest' 
    }, { status: 400 });
  }
}
