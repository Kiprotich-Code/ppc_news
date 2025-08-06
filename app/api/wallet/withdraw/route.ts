import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PayHeroService } from "@/lib/payhero";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { amount, phoneNumber } = await req.json();
    
    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    
    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Check minimum withdrawal amount (e.g., KES 50)
    if (amount < 50) {
      return NextResponse.json({ 
        error: "Minimum withdrawal amount is KES 50" 
      }, { status: 400 });
    }

    console.log('Processing withdrawal request:', { userId, amount, phoneNumber });

    // Check wallet balance
    const wallet = await prisma.wallet.findUnique({ 
      where: { userId } 
    });
    
    if (!wallet || wallet.balance < amount) {
      return NextResponse.json({ 
        error: "Insufficient balance" 
      }, { status: 400 });
    }

    // Check for any pending withdrawals
    const pendingWithdrawal = await prisma.transaction.findFirst({
      where: {
        userId,
        type: 'WITHDRAWAL',
        status: 'PENDING'
      }
    });

    if (pendingWithdrawal) {
      return NextResponse.json({ 
        error: "You have a pending withdrawal. Please wait for it to complete." 
      }, { status: 400 });
    }

    // Generate unique reference
    const reference = `WITHDRAWAL_${Date.now()}_${userId}`;

    // **IMPORTANT**: For withdrawals, we should use a manual approval process
    // OR integrate with PayHero's B2C API if available
    // For now, let's create a pending transaction that requires admin approval
    
    // Debit the wallet immediately but keep transaction as PENDING
    await prisma.wallet.update({
      where: { userId },
      data: { balance: { decrement: amount } }
    });

    // Create pending withdrawal transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount: -amount, // Negative for withdrawals
        type: 'WITHDRAWAL',
        status: 'PENDING',
        description: 'Withdrawal to M-Pesa',
        paymentMethod: 'MPESA',
        reference,
        mpesaRequestId: phoneNumber, // Store phone number for processing
      }
    });

    // Create withdrawal request for admin processing
    await prisma.withdrawal.create({
      data: {
        userId,
        amount,
        phoneNumber,
        status: 'PENDING',
        method: 'MPESA',
        reference,
        transactionId: transaction.id
      }
    });

    console.log(`Withdrawal request created: ${amount} for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully. It will be processed within 24 hours.',
      transactionId: transaction.id,
      reference,
      status: 'PENDING'
    });

  } catch (error: any) {
    console.error('Withdrawal endpoint error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
