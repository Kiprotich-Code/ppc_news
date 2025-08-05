import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    // Calculate actual earnings from articles (from Earning table)
    const articleEarnings = await prisma.earning.aggregate({
      where: { userId },
      _sum: { amount: true }
    });

    // Calculate what's already been transferred to wallet from earnings
    const transferredEarnings = await prisma.transaction.aggregate({
      where: { 
        userId,
        type: 'transfer',
        status: 'COMPLETED',
        description: 'Transfer earnings to wallet'
      },
      _sum: { amount: true }
    });

    // Available earnings = total article earnings - already transferred earnings
    const totalArticleEarnings = articleEarnings._sum.amount || 0;
    const alreadyTransferred = transferredEarnings._sum.amount || 0;
    const availableEarnings = Math.max(0, totalArticleEarnings - alreadyTransferred);

    if (availableEarnings <= 0) {
      return NextResponse.json({ error: "No earnings to transfer" }, { status: 400 });
    }

    // Transfer all available earnings to wallet balance
    const wallet = await prisma.wallet.update({
      where: { userId },
      data: {
        balance: { increment: availableEarnings }
      }
    });

    // Record the transfer transaction
    await prisma.transaction.create({
      data: {
        userId,
        amount: availableEarnings,
        type: 'transfer',
        description: 'Transfer earnings to wallet',
        status: 'COMPLETED'
      },
    });

    // Get updated wallet data
    const updatedWalletData = await prisma.$queryRaw<Array<{
      balance: number;
      investment: number;
    }>>`
      SELECT balance, investment 
      FROM "Wallet" 
      WHERE "userId" = ${userId}
    `;

    return NextResponse.json({
      success: true,
      message: `Transferred ${availableEarnings.toFixed(2)} KES to wallet`,
      wallet: {
        balance: updatedWalletData[0].balance,
        earnings: 0, // Now zero since all transferred
        investment: updatedWalletData[0].investment
      }
    });
  } catch (error: any) {
    console.error('Transfer earnings error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to transfer earnings'
    }, { status: 400 });
  }
}
