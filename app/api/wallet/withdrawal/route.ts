import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PayHeroService } from "@/lib/payhero";
import { authOptions } from "@/lib/auth";
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
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

    // Check minimum withdrawal amount (e.g., KES 100)
    if (amount < 100) {
      return NextResponse.json({ 
        error: "Minimum withdrawal amount is KES 100" 
      }, { status: 400 });
    }

    logger.payment('Processing withdrawal request');

    const wallet = await prisma.wallet.findUnique({ 
      where: { userId } 
    });
    
    if (!wallet || wallet.balance < amount) {
      return NextResponse.json({ 
        error: "Insufficient balance" 
      }, { status: 400 });
    }

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

    const reference = `WITHDRAWAL_${Date.now()}_${userId}`;

    console.log('Processing withdrawal request with manual approval...');

    const service = new PayHeroService();
    
    const withdrawalResponse = await service.initiateWithdrawal({
      amount,
      phoneNumber,
      reference,
      description: 'Wallet withdrawal'
    });

    console.log('PayHero withdrawal response:', withdrawalResponse);

    await prisma.wallet.update({
      where: { userId },
      data: { balance: { decrement: amount } }
    });

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount: -amount,
        type: 'WITHDRAWAL',
        status: 'PENDING',
        description: 'Withdrawal to M-Pesa (Manual Processing)',
        paymentMethod: 'MPESA',
        reference,
        mpesaRequestId: phoneNumber,
      }
    });

    await prisma.withdrawal.create({
      data: {
        userId,
        amount,
        phoneNumber,
        status: 'PENDING', 
        method: 'MPESA',
        reference,
        transactionId: transaction.id,
        note: 'Manual processing required for PayHero basic account'
      }
    });

    logger.info('Manual withdrawal request created');

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully. Our team will process your withdrawal within 24 hours during business hours.',
      transactionId: transaction.id,
      reference,
      status: 'PENDING',
      requiresManualApproval: true,
      instructions: withdrawalResponse.instructions || 'Your withdrawal will be processed manually by our team within 24 hours.'
    });

  } catch (error: any) {
    console.error('Withdrawal endpoint error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
