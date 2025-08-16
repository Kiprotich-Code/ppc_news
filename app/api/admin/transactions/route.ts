import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const typeFilter = searchParams.get("type") || "All"
    const statusFilter = searchParams.get("status") || "All"

    // Build where clause for transactions
    const whereClause: any = {}
    
    if (typeFilter !== "All") {
      whereClause.type = typeFilter.toLowerCase()
    }
    
    if (statusFilter !== "All") {
      whereClause.status = statusFilter.toUpperCase()
    }

    // Fetch all transactions with user information
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    })

    // Fetch all wallets with user information
    const wallets = await prisma.wallet.findMany({
      include: {
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: { balance: "desc" }
    })

    // Calculate transaction statistics
    const allTransactions = await prisma.transaction.findMany()
    
    const stats = {
      totalDeposits: allTransactions
        .filter(tx => tx.type === "deposit" && tx.status === "COMPLETED")
        .reduce((sum, tx) => sum + tx.amount, 0),
      totalWithdrawals: allTransactions
        .filter(tx => tx.type === "withdrawal" && tx.status === "COMPLETED")
        .reduce((sum, tx) => sum + tx.amount, 0),
      totalRevenue: allTransactions
        .filter(tx => tx.type === "earning" && tx.status === "COMPLETED")
        .reduce((sum, tx) => sum + tx.amount, 0),
      pendingAmount: allTransactions
        .filter(tx => tx.status === "PENDING")
        .reduce((sum, tx) => sum + tx.amount, 0)
    }

    // Format transactions for frontend
    const formattedTransactions = transactions.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      status: tx.status,
      date: tx.createdAt.toISOString(),
      userId: tx.userId,
      userName: tx.user.name,
      description: tx.description,
      paymentMethod: tx.paymentMethod
    }))

    // Format wallets for frontend
    const formattedWallets = wallets.map(wallet => ({
      userId: wallet.userId,
      userName: wallet.user.name,
      balance: wallet.balance,
      earnings: wallet.earnings
    }))

    return NextResponse.json({
      stats,
      transactions: formattedTransactions,
      wallets: formattedWallets
    })
  } catch (error) {
    console.error("Admin transactions API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 