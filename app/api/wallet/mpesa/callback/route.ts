import { mpesa } from "@/lib/mpesa";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    console.log('M-pesa callback received:', JSON.stringify(req.body, null, 2));
    
    const body = await req.json();
    console.log('Callback body:', body);
    
    const { transactionId, resultCode, resultDesc, callbackMetadata } = body.Body.stkCallback;

    console.log('Processing callback for transaction:', transactionId);
    console.log('Result code:', resultCode);
    console.log('Result description:', resultDesc);

    const transaction = await prisma.transaction.findFirst({
      where: { mpesaRequestId: transactionId }
    });

    if (!transaction) {
      console.error('Transaction not found:', transactionId);
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    console.log('Found transaction:', transaction);

    if (resultCode === 0) {
      // Payment successful
      let amount = transaction.amount; // Use the original transaction amount
      
      // Try to get amount from callback metadata if available
      if (callbackMetadata && callbackMetadata.Item) {
        const amountItem = callbackMetadata.Item.find((item: any) => item.Name === 'Amount');
        if (amountItem && amountItem.Value) {
          amount = parseFloat(amountItem.Value);
        }
      }
      
      console.log('Processing successful payment, amount:', amount);

      // Update transaction status
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { 
          status: 'COMPLETED',
          description: `${transaction.description} - Completed`
        }
      });

      // Handle wallet update based on transaction type
      if (transaction.type === 'DEPOSIT') {
        // Credit wallet for deposits
        const wallet = await prisma.wallet.findUnique({ where: { userId: transaction.userId } });
        if (!wallet) {
          // Create wallet if it doesn't exist
          await prisma.wallet.create({
            data: {
              userId: transaction.userId,
              balance: amount,
              currency: 'KES'
            }
          });
        } else {
          // Update existing wallet
          await prisma.wallet.update({
            where: { userId: transaction.userId },
            data: { balance: { increment: amount } }
          });
        }
        console.log(`Deposit completed for user ${transaction.userId}, amount: ${amount}`);
      } else if (transaction.type === 'WITHDRAWAL') {
        // For withdrawals, the amount was already deducted when transaction was created
        console.log(`Withdrawal completed for user ${transaction.userId}, amount: ${amount}`);
      }

      return NextResponse.json({ success: true });
    } else {
      // Payment failed
      console.log('Payment failed:', resultDesc);
      
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { 
          status: 'FAILED',
          description: `${transaction.description} - Failed: ${resultDesc}`
        }
      });

      // For failed withdrawals, refund the amount back to wallet
      if (transaction.type === 'WITHDRAWAL') {
        await prisma.wallet.update({
          where: { userId: transaction.userId },
          data: { balance: { increment: transaction.amount } }
        });
        console.log(`Refunded ${transaction.amount} to user ${transaction.userId} for failed withdrawal`);
      }

      return NextResponse.json({ success: false, error: resultDesc });
    }
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
