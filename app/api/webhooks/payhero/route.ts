import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PayHeroService } from '@/lib/payhero';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    logger.info('PayHero webhook received');
    
    // Verify webhook signature if secret is available
    const signature = req.headers.get('x-signature') || '';
    const timestamp = req.headers.get('x-timestamp') || '';
    const payHero = new PayHeroService();
    
    if (signature && timestamp && !payHero.verifyWebhookSignature(body, signature, timestamp)) {
      logger.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (e) {
      logger.error('Invalid JSON in webhook');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    logger.debug('Processing PayHero webhook', { 
      CheckoutRequestID: payload.CheckoutRequestID,
      ResultCode: payload.ResultCode 
    });

    // PayHero callback format based on documentation:
    // {
    //   "forward_url": "",
    //   "response": {
    //     "Amount": 10,
    //     "CheckoutRequestID": "ws_CO_14012024103543427709099876",
    //     "ExternalReference": "INV-009",
    //     "MerchantRequestID": "3202-70921557-1",
    //     "MpesaReceiptNumber": "SAE3YULR0Y",
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
      CheckoutRequestID, 
      ExternalReference, 
      MerchantRequestID,
      MpesaReceiptNumber,
      Phone,
      ResultCode,
      ResultDesc,
      Status
    } = response;

    if (!CheckoutRequestID) {
      logger.error('No CheckoutRequestID in webhook payload');
      return NextResponse.json({ error: 'Missing CheckoutRequestID' }, { status: 400 });
    }

    // Find transaction by CheckoutRequestID
    const transaction = await prisma.transaction.findFirst({ 
      where: { 
        OR: [
          { reference: CheckoutRequestID },
          { mpesaRequestId: CheckoutRequestID }
        ]
      },
      select: {
        id: true,
        userId: true,
        amount: true,
        type: true,
        status: true,
        metadata: true
      }
    });

    if (!transaction) {
      logger.error('Transaction not found', { CheckoutRequestID });
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    logger.payment('Processing webhook', transaction.id);

    // PayHero uses ResultCode 0 for success
    const isSuccess = ResultCode === 0 && Status === 'Success';

    if (isSuccess) {
      // Update transaction to completed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
          reference: MpesaReceiptNumber || CheckoutRequestID,
          mpesaMerchantRequestId: MerchantRequestID
        }
      });

      // Handle successful deposit
      if (transaction.type === 'DEPOSIT') {
        await prisma.wallet.upsert({
          where: { userId: transaction.userId },
          create: {
            userId: transaction.userId,
            balance: transaction.amount,
            earnings: 0,
            currency: 'KES'
          },
          update: {
            balance: { increment: transaction.amount }
          }
        });

        logger.info('Deposit successful', { transactionId: transaction.id, amount: transaction.amount });
      } else if (transaction.type === 'WITHDRAWAL') {
        // For withdrawals, just mark as completed (money already deducted)
        logger.info('Withdrawal successful', { transactionId: transaction.id, amount: transaction.amount });
      } else if (transaction.type === 'course_payment') {
        // Handle course payment - grant course access
        try {
          const metadata = transaction.metadata ? JSON.parse(transaction.metadata) : null;
          const courseId = metadata?.courseId;
          
          if (courseId) {
            // Check if enrollment already exists
            const existingEnrollment = await prisma.courseEnrollment.findUnique({
              where: {
                userId_courseId: {
                  userId: transaction.userId,
                  courseId: courseId
                }
              }
            });

            if (!existingEnrollment) {
              // Create course enrollment
              await prisma.courseEnrollment.create({
                data: {
                  userId: transaction.userId,
                  courseId: courseId,
                  enrolledAt: new Date(),
                  progress: 0
                }
              });
              logger.info('Course enrollment created successfully');
            } else {
              logger.info('Course enrollment already exists');
            }
          } else {
            logger.error('Course payment successful but no courseId found in metadata');
          }
        } catch (error) {
          logger.error('Error processing course payment', error);
        }
      }
    } else {
      // Payment failed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED'
        }
      });

      // If withdrawal failed, refund the wallet (money was already deducted)
      if (transaction.type === 'WITHDRAWAL') {
        await prisma.wallet.update({
          where: { userId: transaction.userId },
          data: { balance: { increment: Math.abs(transaction.amount) } }
        });
        logger.info('Withdrawal failed - amount refunded', { transactionId: transaction.id });
      }

      logger.info('Payment failed', { transactionId: transaction.id, ResultDesc });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Webhook processing error', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
