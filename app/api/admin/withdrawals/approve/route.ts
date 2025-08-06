import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
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
        error: 'Only pending withdrawals can be approved' 
      }, { status: 400 });
    }

    // Update withdrawal status to APPROVED
    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'APPROVED',
        processedAt: new Date(),
        note: adminNote
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Withdrawal approved successfully. You can now send the money manually and mark it as paid.' 
    });

  } catch (error) {
    console.error('Error approving withdrawal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
