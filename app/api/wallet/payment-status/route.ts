import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkoutRequestId = searchParams.get('checkoutRequestId');

    if (!checkoutRequestId) {
      return NextResponse.json(
        { error: 'Checkout request ID is required' },
        { status: 400 }
      );
    }

    // Find the transaction by checkout request ID
    const transaction = await prisma.transaction.findFirst({
      where: {
        reference: {
          contains: checkoutRequestId
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!transaction) {
      return NextResponse.json({
        status: 'PENDING',
        message: 'Transaction not found or still processing'
      });
    }

    // Return transaction status
    return NextResponse.json({
      status: transaction.status,
      amount: transaction.amount,
      type: transaction.type,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}
