import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { withdrawalId, adminNote } = await req.json();

    if (!withdrawalId || !adminNote) {
      return NextResponse.json({ 
        error: 'Withdrawal ID and confirmation details are required' 
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

    if (withdrawal.status !== 'APPROVED') {
      return NextResponse.json({ 
        error: 'Only approved withdrawals can be marked as paid' 
      }, { status: 400 });
    }

    // Mark withdrawal as PAID
    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        note: `${withdrawal.note || ''} | Payment confirmed: ${adminNote}`
      }
    });

    // Update related transaction if it exists
    if (withdrawal.transactionId) {
      await prisma.transaction.update({
        where: { id: withdrawal.transactionId },
        data: {
          status: 'COMPLETED'
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Withdrawal marked as paid successfully' 
    });

  } catch (error) {
    console.error('Error marking withdrawal as paid:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
