import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PayHeroService } from '@/lib/payhero';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    console.log('PayHero webhook received:', body);
    
    // Verify webhook signature if secret is available
    const signature = req.headers.get('x-signature') || '';
    const timestamp = req.headers.get('x-timestamp') || '';
    const payHero = new PayHeroService();
    
    if (signature && timestamp && !payHero.verifyWebhookSignature(body, signature, timestamp)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (e) {
      console.error('Invalid JSON in webhook:', body);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log('PayHero webhook payload:', payload);

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
      console.error('No CheckoutRequestID in webhook payload');
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
      console.error('Transaction not found for CheckoutRequestID:', CheckoutRequestID);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    console.log('Processing webhook for transaction:', transaction.id, 'Type:', transaction.type);

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

        console.log(`Deposit successful: ${transaction.amount} credited to user ${transaction.userId}`);
      } else if (transaction.type === 'WITHDRAWAL') {
        // For withdrawals, just mark as completed (money already deducted)
        console.log(`Withdrawal successful: ${transaction.amount} withdrawn for user ${transaction.userId}`);
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
              console.log(`Course enrollment created: User ${transaction.userId} enrolled in course ${courseId}`);
            } else {
              console.log(`Course enrollment already exists: User ${transaction.userId} already enrolled in course ${courseId}`);
            }
          } else {
            console.error('Course payment successful but no courseId found in metadata:', transaction.metadata);
          }
        } catch (error) {
          console.error('Error processing course payment:', error);
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
        console.log(`Withdrawal failed: ${Math.abs(transaction.amount)} refunded to user ${transaction.userId}`);
      }

      console.log(`Payment failed for transaction ${transaction.id}, ResultDesc: ${ResultDesc}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
