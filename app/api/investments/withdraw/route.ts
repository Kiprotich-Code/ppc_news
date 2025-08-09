import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { investmentId } = await req.json()

    const investment = await prisma.investment.findUnique({
      where: { 
        id: investmentId,
        userId: session.user.id 
      }
    })

    if (!investment) {
      return NextResponse.json({ 
        error: "Investment not found" 
      }, { status: 404 })
    }

    if (investment.status !== 'ACTIVE') {
      return NextResponse.json({ 
        error: "Investment already withdrawn" 
      }, { status: 400 })
    }

    const now = new Date()
    const maturityDate = new Date(investment.endDate)

    if (now < maturityDate) {
      return NextResponse.json({ 
        error: "Investment has not matured yet" 
      }, { status: 400 })
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update investment status
      await tx.investment.update({
        where: { id: investmentId },
        data: { status: 'WITHDRAWN' }
      })

      // Add total return to wallet
      await tx.wallet.update({
        where: { userId: session.user.id },
        data: { balance: { increment: investment.totalReturn } }
      })

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: "INVESTMENT_RETURN",
          amount: investment.totalReturn,
          status: "COMPLETED",
          description: `Investment matured: KES ${investment.amount} + KES ${investment.totalReturn - investment.amount} interest`,
          paymentMethod: "MPESA",
          reference: `INV_RETURN_${Date.now()}_${session.user.id}`
        }
      })
    })

    return NextResponse.json({ 
      success: true, 
      message: "Investment withdrawn successfully",
      amount: investment.totalReturn
    })

  } catch (error) {
    console.error("Investment withdrawal error:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
