import { mpesa } from "@/lib/mpesa";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    logger.info('M-pesa callback received');
    
    const body = await req.json();
    logger.debug('Processing M-pesa callback');
    
    const { transactionId, resultCode, resultDesc, callbackMetadata } = body.Body.stkCallback;

    logger.payment('Processing M-pesa callback', transactionId);

    const transaction = await prisma.transaction.findFirst({
      where: { mpesaRequestId: transactionId }
    });

    if (!transaction) {
      logger.error('Transaction not found', { transactionId });
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    logger.debug('Found transaction for callback');

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
      
      logger.payment('Processing successful payment', transactionId);

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
        logger.info('Deposit completed successfully');
      } else if (transaction.type === 'WITHDRAWAL') {
        // For withdrawals, the amount was already deducted when transaction was created
        logger.info('Withdrawal completed successfully');
      }

      return NextResponse.json({ success: true });
    } else {
      // Payment failed
      logger.info('Payment failed', { resultDesc });
      
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
        logger.info('Refund processed for failed withdrawal');
      }

      return NextResponse.json({ success: false, error: resultDesc });
    }
  } catch (error) {
    logger.error('M-Pesa callback error', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
