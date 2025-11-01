import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { InvestmentPeriod } from "@prisma/client";

const INVESTMENT_RATES = {
  ONE_WEEK: { rate: 0.04, days: 7 },
  TWO_WEEKS: { rate: 0.08, days: 14 },
  ONE_MONTH: { rate: 0.16, days: 30 },
} as const;

export async function POST(req: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const { amount, period } = body;

    if (typeof amount !== "number" || amount < 100 || amount <= 0 || isNaN(amount)) {
      return NextResponse.json(
        { error: "Invalid amount. Must be a number greater than or equal to 100." },
        { status: 400 }
      );
    }

    if (typeof period !== "string" || !Object.keys(INVESTMENT_RATES).includes(period)) {
      return NextResponse.json(
        { error: "Invalid investment period. Must be one of: " + Object.keys(INVESTMENT_RATES).join(", ") },
        { status: 400 }
      );
    }

    // Cast period to InvestmentPeriod enum type
    const validPeriod = period as InvestmentPeriod;

    // Fetch wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    if (wallet.balance < amount) {
      return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
    }

    // Calculate investment details
    const config = INVESTMENT_RATES[validPeriod];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + config.days);

    if (isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid end date calculation" }, { status: 500 });
    }

    const totalReturn = amount * (1 + config.rate);

    try {
      // Update wallet balance first
      await prisma.wallet.update({
        where: { userId: session.user.id },
        data: { balance: { decrement: amount } },
      });

      // Create investment
      const investment = await prisma.investment.create({
        data: {
          userId: session.user.id,
          amount,
          period: validPeriod,
          interestRate: config.rate,
          endDate,
          totalReturn,
        },
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId: session.user.id,
          type: "INVESTMENT",
          amount: -amount,
          description: `Investment: ${validPeriod.replace("_", " ").toLowerCase()} - ${config.rate * 100}%`,
          status: "COMPLETED",
          paymentMethod: "MPESA",
          reference: `INV_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          investment,
          endDate,
          expectedReturn: totalReturn,
        },
      });

    } catch (error) {
      // If any operation fails, attempt to rollback the wallet update
      if (wallet) {
        try {
          await prisma.wallet.update({
            where: { userId: session.user.id },
            data: { balance: wallet.balance }, // Restore original balance
          });
        } catch (rollbackError) {
          console.error("Failed to rollback wallet balance:", rollbackError);
        }
      }
      console.error("Create investment error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  } catch (error) {
    console.error("Create investment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}