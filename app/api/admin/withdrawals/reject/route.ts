import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { withdrawalId, adminNote } = await req.json();

    if (!withdrawalId || !adminNote) {
      return NextResponse.json({ 
        error: 'Withdrawal ID and admin note are required' 
      }, { status: 400 });
    }

    // Find the withdrawal
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { user: true }
    });

    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
    }

    if (withdrawal.status !== 'PENDING') {
      return NextResponse.json({ 
        error: 'Only pending withdrawals can be rejected' 
      }, { status: 400 });
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Update withdrawal status to REJECTED
      await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'REJECTED',
          processedAt: new Date(),
          note: adminNote
        }
      });

      // Update the original withdrawal transaction status to FAILED
      if (withdrawal.transactionId) {
        await tx.transaction.update({
          where: { id: withdrawal.transactionId },
          data: {
            status: 'FAILED',
            description: `Withdrawal rejected - ${adminNote}`
          }
        });
      }

      // Refund the amount back to user's wallet
      await tx.wallet.update({
        where: { userId: withdrawal.userId },
        data: {
          balance: { increment: withdrawal.amount }
        }
      });

      // Create a transaction record for the refund
      await tx.transaction.create({
        data: {
          userId: withdrawal.userId,
          type: 'DEPOSIT',
          amount: withdrawal.amount,
          status: 'COMPLETED',
          description: `Refund for rejected withdrawal - ${adminNote}`,
          paymentMethod: 'MPESA',
          reference: `REFUND_${Date.now()}_${withdrawal.userId}`
        }
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Withdrawal rejected and amount refunded to user wallet' 
    });

  } catch (error) {
    console.error('Error rejecting withdrawal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
