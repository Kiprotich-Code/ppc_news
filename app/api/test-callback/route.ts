import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { transactionId, resultCode = 0, resultDesc = "Success" } = await req.json();
    
    console.log('Test callback for transaction:', transactionId);
    
    const transaction = await prisma.transaction.findFirst({
      where: { mpesaRequestId: transactionId }
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (resultCode === 0) {
      // Simulate successful payment
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { 
          status: 'COMPLETED',
          description: `${transaction.description} - Completed (Test)`
        }
      });

      // Handle wallet update based on transaction type
      if (transaction.type === 'DEPOSIT') {
        const wallet = await prisma.wallet.findUnique({ where: { userId: transaction.userId } });
        if (!wallet) {
          await prisma.wallet.create({
            data: {
              userId: transaction.userId,
              balance: transaction.amount,
              currency: 'KES'
            }
          });
        } else {
          await prisma.wallet.update({
            where: { userId: transaction.userId },
            data: { balance: { increment: transaction.amount } }
          });
        }
        console.log(`Test deposit completed for user ${transaction.userId}, amount: ${transaction.amount}`);
      }

      return NextResponse.json({ success: true, message: 'Test callback processed successfully' });
    } else {
      // Simulate failed payment
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { 
          status: 'FAILED',
          description: `${transaction.description} - Failed: ${resultDesc} (Test)`
        }
      });

      return NextResponse.json({ success: false, error: resultDesc });
    }
  } catch (error) {
    console.error('Test callback error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 