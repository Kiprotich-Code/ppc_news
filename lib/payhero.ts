import crypto from 'crypto';

export class PayHeroService {
  private baseUrl: string;
  private channelId: string;
  private tillNumber: string;
  private apiKey: string;
  private webhookSecret: string;

  constructor() {
    this.baseUrl = "https://backend.payhero.co.ke/api/v2"; // Updated to correct URL
    this.channelId = process.env.PAYHERO_CHANNEL_ID!;
    this.tillNumber = process.env.PAYHERO_TILL_NUMBER!;
    this.apiKey = process.env.PAYHERO_API_KEY!;
    this.webhookSecret = process.env.PAYHERO_WEBHOOK_SECRET || '';
    
    // Debug logging with environment variable check
    console.log('PayHero service initialized:');
    console.log('- Base URL:', this.baseUrl);
    console.log('- Raw PAYHERO_CHANNEL_ID:', process.env.PAYHERO_CHANNEL_ID);
    console.log('- Raw PAYHERO_TILL_NUMBER:', process.env.PAYHERO_TILL_NUMBER);
    console.log('- Raw PAYHERO_API_KEY length:', process.env.PAYHERO_API_KEY?.length);
    console.log('- Channel ID:', this.channelId);
    console.log('- Till Number:', this.tillNumber);
    console.log('- API Key length:', this.apiKey?.length || 0);
    console.log('- API Key starts with:', this.apiKey?.substring(0, 10) + '...');
  }

  // Initiate deposit to M-Pesa till
  async initiateDeposit({ amount, phoneNumber, reference, description }: {
    amount: number;
    phoneNumber: string;
    reference: string;
    description: string;
  }) {
    const payload = {
      amount,
      phone_number: phoneNumber,
      channel_id: parseInt(this.channelId),
      provider: "m-pesa",
      external_reference: reference,
      customer_name: "Customer",
      callback_url: `${process.env.NEXTAUTH_URL}/api/webhooks/payhero`
    };
    
    console.log('PayHero STK Push payload:', JSON.stringify(payload, null, 2));
    console.log('PayHero API URL:', `${this.baseUrl}/payments`);
    console.log('Channel ID:', this.channelId);
    console.log('API Key (first 10 chars):', this.apiKey.substring(0, 10) + '...');
    console.log('Full Authorization header:', `Basic ${this.apiKey}`);
    
    try {
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      console.log('PayHero API response status:', response.status);
      console.log('PayHero API response headers:', Object.fromEntries(response.headers.entries()));
      console.log('PayHero API response body:', JSON.stringify(result, null, 2));
      
      if (!response.ok) {
        console.error('PayHero API error details:', {
          status: response.status,
          statusText: response.statusText,
          result
        });
        return { error: result.message || result.error || `HTTP ${response.status}: ${response.statusText}` };
      }
      
      return result;
    } catch (error) {
      console.error('PayHero API network error:', error);
      return { error: 'Network error connecting to PayHero' };
    }
  }

  // Initiate withdrawal using B2C (Business to Customer)
  async initiateWithdrawal({ amount, phoneNumber, reference, description }: {
    amount: number;
    phoneNumber: string;
    reference: string;
    description: string;
  }) {
    // ⚠️ IMPORTANT: PayHero B2C API might be different from STK Push
    // This is a placeholder implementation. You should:
    // 1. Check PayHero documentation for B2C API endpoints
    // 2. Verify if your PayHero account supports B2C transactions
    // 3. Use appropriate B2C payload structure
    
    console.log('⚠️ PayHero B2C Withdrawal - Check documentation for proper implementation');
    console.log('Withdrawal request:', { amount, phoneNumber, reference });
    
    // For now, return a manual processing response
    // In production, you would either:
    // A) Use PayHero B2C API if available
    // B) Process manually through admin panel
    // C) Use alternative withdrawal methods
    
    return {
      success: true,
      status: 'MANUAL_PROCESSING',
      reference,
      message: 'Withdrawal request submitted for manual processing',
      requiresManualApproval: true
    };
    
    /* 
    // This would be the actual B2C implementation if PayHero supports it:
    const payload = {
      amount,
      phone_number: phoneNumber,
      transaction_type: "B2C", // Business to Customer
      reference: reference,
      callback_url: `${process.env.NEXTAUTH_URL}/api/webhooks/payhero/b2c`
    };
    
    try {
      const response = await fetch(`${this.baseUrl}/b2c/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      // Process B2C response...
      return result;
    } catch (error) {
      return { error: 'B2C withdrawal failed' };
    }
    */
  }

  // Verify webhook signature
  verifyWebhookSignature(body: string, signature: string, timestamp: string) {
    if (!this.webhookSecret) {
      // If no webhook secret is provided, skip verification
      return true;
    }
    const expected = crypto.createHmac('sha256', this.webhookSecret)
      .update(`${timestamp}.${body}`)
      .digest('hex');
    return expected === signature;
  }
}
