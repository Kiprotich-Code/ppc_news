import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    
    // Test raw SQL query to check if investment column exists
    const result = await prisma.$queryRaw`
      SELECT id, "userId", balance, earnings, investment, currency, "createdAt", "updatedAt"
      FROM "Wallet" 
      WHERE "userId" = ${userId}
      LIMIT 1
    `;

    if (!result || (result as any[]).length === 0) {
      // Create wallet using Prisma ORM
      const newWallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0,
          earnings: 0,
          currency: 'KES'
        }
      });
      
      return NextResponse.json({ 
        wallet: newWallet,
        message: "Wallet created successfully"
      });
    }

    return NextResponse.json({ 
      wallet: (result as any[])[0],
      message: "Wallet found"
    });

  } catch (error: any) {
    console.error('Wallet test error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to test wallet',
      details: error
    }, { status: 500 });
  }
}
