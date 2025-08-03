import { getServerSession } from "next-auth";
import { TransactionStatus } from "@prisma/client";
import { mpesa } from "@/lib/mpesa";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount } = await req.json();
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const userId = session.user.id;

  // Validate phone number format (e.g., 2547XXXXXXXX or 07XXXXXXXX)
  const phoneRegex = /^(?:2547|07)\d{8}$/;
  if (!phoneRegex.test(userId)) {
    return NextResponse.json(
      { error: "Invalid phone number format. Use 2547XXXXXXXX or 07XXXXXXXX" },
      { status: 400 }
    );
  }

  try {
    // Start a transaction to ensure atomic operation
    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet || wallet.earnings < amount) {
        throw new Error("Insufficient earnings");
      }

      // Update wallet
      const updated = await tx.wallet.update({
        where: { userId },
        data: {
          earnings: { decrement: amount },
          balance: { increment: amount },
        },
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          amount,
          type: "TRANSFER",
          description: "Earnings transfer to wallet",
          status: TransactionStatus.PENDING,
        },
      });

      return { updated, transaction };
    });

    const { updated, transaction } = result;

    // Call to Mpesa API for payment processing
    const mpesaResponse = await mpesa.initiateSTKPush(
      userId, // Phone number
      amount,
      transaction.id // Reference
    );

    // Check if STK push was initiated successfully
    if (mpesaResponse.ResponseCode !== "0") {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.FAILED },
      });
      throw new Error(mpesaResponse.ResponseDescription || "Failed to initiate M-Pesa STK push");
    }

    // Store CheckoutRequestID for callback verification
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: TransactionStatus.PENDING,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Transfer initiated. Please confirm the STK push on your phone.",
      transactionId: transaction.id,
      balance: formatCurrency(updated.balance),
      earnings: formatCurrency(updated.earnings),
      amount: formatCurrency(amount),
    });
  } catch (error: any) {
    console.error("Transfer error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to transfer earnings" },
      { status: 400 }
    );
  }
}