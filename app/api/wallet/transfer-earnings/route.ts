import { getServerSession } from "next-auth";
import { TransactionStatus } from "@prisma/client";
import { mpesa } from "@/lib/mpesa";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount } = await req.json();
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const userId = session.user.id;
  
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
          balance: { increment: amount }
        }
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          amount,
          type: 'transfer',
          description: 'Earnings transfer to wallet',
          status: 'PENDING'
        }
      });

      return { updated, transaction };
    });

    const { updated, transaction } = result;

    // Call to Mpesa API for payment processing
    const mpesaResponse = await mpesa.paybill({
      amount,
      phoneNumber: userId, // Assuming userId is the phone number
      accountReference: transaction.id,
      transactionDesc: 'Earnings transfer to wallet'
    });

    const { resultCode, resultDesc, callbackMetadata } = mpesaResponse;

    if (resultCode === 0) {
      // Payment successful
      const amount = callbackMetadata.Item.find((item: any) => item.Name === 'Amount').Value;
      
      // Update transaction status
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.COMPLETED }
      });

      return NextResponse.json({
        success: true,
        balance: updated.balance,
        earnings: updated.earnings
      });
    } else {
      throw new Error(resultDesc);
    }
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || "Failed to transfer earnings" 
    }, { status: 400 });
  }
}
