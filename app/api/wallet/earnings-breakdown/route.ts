import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Get current wallet data
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    const totalWalletEarnings = wallet?.earnings || 0;

    // Available earnings breakdown
    const totalArticleEarnings = articleEarnings._sum.amount || 0;
    const alreadyTransferred = transferredEarnings._sum.amount || 0;
    const availableArticleEarnings = Math.max(0, totalArticleEarnings - alreadyTransferred);
    
    // Calculate referral earnings (wallet earnings that aren't from articles)
    const referralEarnings = Math.max(0, totalWalletEarnings - availableArticleEarnings);
    
    // Total available earnings
    const totalAvailableEarnings = availableArticleEarnings + referralEarnings;

    // Get referral count
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        referrals: {
          select: { id: true }
        }
      }
    });

    return NextResponse.json({
      articleEarnings: availableArticleEarnings,
      referralEarnings: referralEarnings,
      totalEarnings: totalAvailableEarnings,
      referralCount: user?.referrals?.length || 0,
      referralCode: user?.referralCode || ''
    });

  } catch (error) {
    console.error('Earnings breakdown error:', error);
    return NextResponse.json({
      error: 'Failed to get earnings breakdown'
    }, { status: 500 });
  }
}
