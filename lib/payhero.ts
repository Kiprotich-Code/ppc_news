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

  // Initiate withdrawal to M-Pesa till
  async initiateWithdrawal({ amount, phoneNumber, reference, description }: {
    amount: number;
    phoneNumber: string;
    reference: string;
    description: string;
  }) {
    // For withdrawals, we typically use B2C which may require different implementation
    // For now, using similar structure but this may need adjustment based on PayHero's B2C API
    const payload = {
      amount,
      phone_number: phoneNumber,
      channel_id: parseInt(this.channelId),
      provider: "m-pesa",
      external_reference: reference,
      customer_name: "Customer",
      callback_url: `${process.env.NEXTAUTH_URL}/api/webhooks/payhero`
    };
    
    console.log('PayHero withdrawal payload:', payload);
    
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
      console.log('PayHero withdrawal response:', { status: response.status, result });
      
      if (!response.ok) {
        console.error('PayHero withdrawal error:', response.status, result);
        return { error: result.message || result.error || 'PayHero withdrawal failed' };
      }
      
      return result;
    } catch (error) {
      console.error('PayHero withdrawal network error:', error);
      return { error: 'Network error connecting to PayHero' };
    }
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
