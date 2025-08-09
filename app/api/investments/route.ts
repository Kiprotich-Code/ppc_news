import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const investments = await prisma.investment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    })

    // Calculate current earned interest for each investment
    type Investment = {
      id: string;
      userId: string;
      amount: number;
      interestRate: number;
      startDate: string | Date;
      endDate: string | Date;
      status: string;
      createdAt: Date;
      // add other fields if needed
    };

    const investmentsWithInterest = investments.map((investment: Investment) => {
      const now = new Date()
      const start = new Date(investment.startDate)
      const end = new Date(investment.endDate)
      
      const daysElapsed = Math.min(
        Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
        Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      )
      
      const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      const dailyInterestRate = investment.interestRate / totalDays
      const currentEarnedInterest = investment.amount * dailyInterestRate * daysElapsed
      
      const isMatured = now >= end
      const canWithdraw = isMatured && investment.status === 'ACTIVE'

      return {
        ...investment,
        currentEarnedInterest: Math.round(currentEarnedInterest * 100) / 100,
        isMatured,
        canWithdraw,
        daysRemaining: isMatured ? 0 : Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      }
    })

    return NextResponse.json({ investments: investmentsWithInterest })

  } catch (error) {
    console.error("Get investments error:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
