import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

// GET: List withdrawal requests
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, allowing access - you should implement proper admin role checking
    // Check if user is admin (implement your admin logic here)
    // const user = await prisma.user.findUnique({
    //   where: { id: session.user.id }
    // });
    // if (user?.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    // }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const allowedStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'PAID'];
    
    const where = status && allowedStatuses.includes(status)
      ? { status: status as any }
      : {};
      
    const withdrawals = await prisma.withdrawal.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ withdrawals });

  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
