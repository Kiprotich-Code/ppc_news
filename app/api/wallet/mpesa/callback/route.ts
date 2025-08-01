import { mpesa } from "@/lib/mpesa";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { transactionId, resultCode, resultDesc, callbackMetadata } = body.Body.stkCallback;

    const transaction = await prisma.transaction.findFirst({
      where: { mpesaReference: transactionId }
    });

    if (!transaction) {
      console.error('Transaction not found:', transactionId);
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (resultCode === 0) {
      // Payment successful
      const amount = callbackMetadata.Item.find((item: any) => item.Name === 'Amount').Value;
      
      // Update transaction status
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'COMPLETED' }
      });

      // Credit wallet
      await prisma.wallet.update({
        where: { userId: transaction.userId },
        data: { balance: { increment: amount } }
      });

      return NextResponse.json({ success: true });
    } else {
      // Payment failed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { 
          status: 'FAILED',
          description: resultDesc
        }
      });

      return NextResponse.json({ success: false, error: resultDesc });
    }
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
