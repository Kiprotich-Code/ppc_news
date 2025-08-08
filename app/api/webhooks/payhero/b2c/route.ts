import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PayHeroService } from '@/lib/payhero';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    console.log('PayHero B2C webhook received:', body);
    
    // Verify webhook signature if secret is available
    const signature = req.headers.get('x-signature') || '';
    const timestamp = req.headers.get('x-timestamp') || '';
    const payHero = new PayHeroService();
    
    if (signature && timestamp && !payHero.verifyWebhookSignature(body, signature, timestamp)) {
      console.error('Invalid B2C webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (e) {
      console.error('Invalid JSON in B2C webhook:', body);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log('PayHero B2C webhook payload:', payload);

    // PayHero B2C callback format (similar to STK but for withdrawals):
    // {
    //   "forward_url": "",
    //   "response": {
    //     "Amount": 100,
    //     "TransactionID": "B2C_12345",
    //     "ExternalReference": "WITHDRAWAL_123",
    //     "Phone": "+254709099876",
    //     "ResultCode": 0,
    //     "ResultDesc": "The service request is processed successfully.",
    //     "Status": "Success"
    //   },
    //   "status": true
    // }

    const response = payload.response || payload;
    const { 
      Amount, 
      TransactionID,
      ExternalReference, 
      Phone,
      ResultCode,
      ResultDesc,
      Status
    } = response;

    if (!ExternalReference && !TransactionID) {
      console.error('No reference ID in B2C webhook payload');
      return NextResponse.json({ error: 'Missing reference ID' }, { status: 400 });
    }

    // Find transaction by external reference
    const transaction = await prisma.transaction.findFirst({ 
      where: { 
        reference: ExternalReference,
        type: 'WITHDRAWAL'
      }
    });

    if (!transaction) {
      console.error('Withdrawal transaction not found for reference:', ExternalReference);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    console.log('Processing B2C webhook for withdrawal transaction:', transaction.id);

    // PayHero uses ResultCode 0 for success
    const isSuccess = ResultCode === 0 && Status === 'Success';

    if (isSuccess) {
      // Update transaction to completed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
          reference: TransactionID || ExternalReference,
        }
      });

      // Update withdrawal record if exists
      await prisma.withdrawal.updateMany({
        where: { 
          reference: ExternalReference,
          status: 'PENDING'
        },
        data: {
          status: 'PAID',
          processedAt: new Date()
        }
      });

      console.log(`B2C Withdrawal successful: ${Math.abs(transaction.amount)} sent to ${Phone}`);
    } else {
      // Withdrawal failed - refund the wallet
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED'
        }
      });

      // Refund the wallet (money was already deducted)
      await prisma.wallet.update({
        where: { userId: transaction.userId },
        data: { balance: { increment: Math.abs(transaction.amount) } }
      });

      // Update withdrawal record
      await prisma.withdrawal.updateMany({
        where: { 
          reference: ExternalReference,
          status: 'PENDING'
        },
        data: {
          status: 'REJECTED',
          processedAt: new Date(),
          note: ResultDesc || 'Withdrawal failed'
        }
      });

      console.log(`B2C Withdrawal failed: ${Math.abs(transaction.amount)} refunded to user ${transaction.userId}, ResultDesc: ${ResultDesc}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('B2C Webhook processing error:', error);
    return NextResponse.json({ error: 'B2C Webhook processing failed' }, { status: 500 });
  }
}
