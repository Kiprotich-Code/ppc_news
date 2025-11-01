import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // Get all pending withdrawals
    const withdrawals = await prisma.withdrawal.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      withdrawals
    });

  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const { withdrawalId, action, note } = await req.json();

    if (!withdrawalId || !action) {
      return NextResponse.json({ error: 'Withdrawal ID and action are required' }, { status: 400 });
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId }
    });

    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
    }

    if (withdrawal.status !== 'PENDING') {
      return NextResponse.json({ error: 'Withdrawal already processed' }, { status: 400 });
    }

    if (action === 'APPROVE') {
      // Mark withdrawal as approved and paid
      await prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'PAID',
          processedAt: new Date(),
          paidAt: new Date(),
          note: note || 'Approved and paid manually'
        }
      });

      // Update related transaction
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
        message: 'Withdrawal approved and marked as paid'
      });

    } else if (action === 'REJECT') {
      // Mark withdrawal as rejected and refund wallet
      await prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'REJECTED',
          processedAt: new Date(),
          note: note || 'Rejected by admin'
        }
      });

      // Refund the wallet balance
      await prisma.wallet.update({
        where: { userId: withdrawal.userId },
        data: {
          balance: { increment: withdrawal.amount }
        }
      });

      // Update related transaction
      if (withdrawal.transactionId) {
        await prisma.transaction.update({
          where: { id: withdrawal.transactionId },
          data: {
            status: 'FAILED'
          }
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Withdrawal rejected and amount refunded to wallet'
      });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to process withdrawal' },
      { status: 500 }
    );
  }
}
