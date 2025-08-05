import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PayHeroService } from "@/lib/payhero";

export async function POST(req: Request) {
  try {
    // Expected body: { userId, amount, phoneNumber }
    const { userId, amount, phoneNumber } = await req.json();
    if (!userId || !amount || amount <= 0 || !phoneNumber) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    
    console.log('Initiating PayHero deposit:', { userId, amount, phoneNumber });
    
    // Generate unique reference
    const reference = `DEPOSIT_${Date.now()}_${userId}`;
    
    // Initiate PayHero STK push
    const service = new PayHeroService();
    const payResponse = await service.initiateDeposit({
      amount,
      phoneNumber,
      reference,
      description: 'Deposit to wallet'
    });
    
    console.log('PayHero response:', payResponse);
    
    // Check if PayHero returned an error
    if (payResponse.error) {
      console.error('PayHero error:', payResponse);
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
