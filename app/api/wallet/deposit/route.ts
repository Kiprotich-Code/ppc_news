import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PayHeroService } from "@/lib/payhero";
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    logger.info('PayHero operation started');
    
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      logger.error('Unauthorized access attempt');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Expected body: { amount, phoneNumber }
    const body = await req.json();
    logger.debug('Request received');
    
    const { amount, phoneNumber } = body;
    if (!amount || amount <= 0 || !phoneNumber) {
      console.error('Invalid request parameters:', { userId, amount, phoneNumber });
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
    }
    
    logger.payment('Initiating PayHero operation');
    
    // Generate unique reference
    const reference = `DEPOSIT_${Date.now()}_${userId}`;
    console.log('Generated reference:', reference);
    
    // Initiate PayHero STK push
    console.log('Creating PayHero service...');
    let service;
    try {
      service = new PayHeroService();
      console.log('PayHero service created successfully');
    } catch (serviceError: any) {
      console.error('Failed to create PayHero service:', serviceError);
      return NextResponse.json({ 
        error: `PayHero configuration error: ${serviceError?.message || 'Unknown error'}` 
      }, { status: 500 });
    }
    
    console.log('Calling PayHero initiateDeposit...');
    const payResponse = await service.initiateDeposit({
      amount,
      phoneNumber,
      reference,
      description: 'Deposit to wallet'
    });
    
    logger.debug('PayHero response received');
    
    // Check if PayHero returned an error
    if (payResponse.error) {
      logger.error('PayHero operation failed');
      return NextResponse.json({ 
        error: payResponse.error 
      }, { status: 500 });
    }
    
    // PayHero success response should contain: success, status, reference, CheckoutRequestID
    if (!payResponse.success || !payResponse.CheckoutRequestID) {
      console.error('Invalid PayHero response:', payResponse);
      return NextResponse.json({ 
        error: 'Invalid PayHero response' 
      }, { status: 500 });
    }
    
    // Record pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        type: 'DEPOSIT',
        status: 'PENDING',
        description: 'Deposit via M-Pesa (PayHero)',
        paymentMethod: 'MPESA',
        reference: payResponse.CheckoutRequestID,
        mpesaRequestId: payResponse.CheckoutRequestID,
        mpesaMerchantRequestId: payResponse.reference || ''
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'M-Pesa STK push sent to your phone. Check your phone to complete payment.',
      transactionId: transaction.id,
      checkoutRequestId: payResponse.CheckoutRequestID,
      status: payResponse.status
    });
    
  } catch (error: any) {
    console.error('Deposit endpoint error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
