import { NextResponse } from "next/server";
import { PayHeroService } from "@/lib/payhero";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const service = new PayHeroService();
    
    // Test PayHero connection and get account balance
    const balance = await service.checkAccountBalance();
    
    const testResults = {
      timestamp: new Date().toISOString(),
      connection: balance.error ? 'FAILED' : 'SUCCESS',
      balance: balance.error ? null : balance,
      error: balance.error || null,
      environment: {
        hasChannelId: !!process.env.PAYHERO_CHANNEL_ID,
        hasTillNumber: !!process.env.PAYHERO_TILL_NUMBER,
        hasApiKey: !!process.env.PAYHERO_API_KEY,
        hasWebhookSecret: !!process.env.PAYHERO_WEBHOOK_SECRET,
        channelId: process.env.PAYHERO_CHANNEL_ID,
        tillNumber: process.env.PAYHERO_TILL_NUMBER,
        apiKeyLength: process.env.PAYHERO_API_KEY?.length || 0,
        baseUrl: 'https://backend.payhero.co.ke/api/v2'
      },
      ready: !!(process.env.PAYHERO_CHANNEL_ID && process.env.PAYHERO_TILL_NUMBER && process.env.PAYHERO_API_KEY)
    };
    
    return NextResponse.json(testResults);
  } catch (error: any) {
    console.error('PayHero test error:', error);
    return NextResponse.json({ 
      error: error.message || 'Test failed',
      timestamp: new Date().toISOString(),
      ready: false
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action, amount, phoneNumber } = await req.json();
    const service = new PayHeroService();
    
    if (action === 'test-deposit') {
      // Test deposit with small amount
      const reference = `TEST_DEPOSIT_${Date.now()}`;
      const result = await service.initiateDeposit({
        amount: amount || 10,
        phoneNumber,
        reference,
        description: 'Test deposit'
      });
      
      return NextResponse.json({
        action: 'test-deposit',
        result,
        timestamp: new Date().toISOString()
      });
    }
    
    if (action === 'test-withdrawal') {
      // Test withdrawal validation
      const validation = await service.validateWithdrawal(amount || 10);
      
      // For basic PayHero accounts, validation always succeeds with manual processing
      const reference = `TEST_WITHDRAWAL_${Date.now()}`;
      const result = await service.initiateWithdrawal({
        amount: amount || 10,
        phoneNumber,
        reference,
        description: 'Test withdrawal'
      });
      
      return NextResponse.json({
        action: 'test-withdrawal',
        result,
        validation,
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({ 
      error: 'Invalid action. Use test-deposit or test-withdrawal' 
    }, { status: 400 });
    
  } catch (error: any) {
    console.error('PayHero test action error:', error);
    return NextResponse.json({ 
      error: error.message || 'Test action failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
