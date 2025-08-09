import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

const INVESTMENT_RATES = {
  ONE_WEEK: { rate: 0.01, days: 7 },
  TWO_WEEKS: { rate: 0.03, days: 14 },
  ONE_MONTH: { rate: 0.07, days: 30 },
} as const;

type InvestmentPeriod = keyof typeof INVESTMENT_RATES;

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
    const config = INVESTMENT_RATES[period as InvestmentPeriod];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + config.days);

    if (isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid end date calculation" }, { status: 500 });
    }

    const totalReturn = amount * (1 + config.rate);

    // Perform transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update wallet balance
      await tx.wallet.update({
        where: { userId: session.user.id },
        data: { balance: { decrement: amount } },
      });

      // Create investment
      await tx.investment.create({
        data: {
          userId: session.user.id,
          amount,
          period,
          interestRate: config.rate,
          endDate,
          totalReturn,
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: "INVESTMENT",
          amount: -amount,
          description: `Investment: ${period.replace("_", " ").toLowerCase()} - ${config.rate * 100}%`,
          status: "COMPLETED",
          paymentMethod: "MPESA",
          reference: `INV_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`, // Add randomness to reduce collision risk
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Investment created successfully",
    });
  } catch (error) {
    // Log specific error details
    console.error("Investment creation error:", error);

    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors
      if (error instanceof Error && 'code' in error) {
        const prismaError = error as any;
        if (prismaError.code === "P2002") {
        return NextResponse.json(
          { error: "A unique constraint was violated. Please try again." },
          { status: 400 }
        );
        }
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}