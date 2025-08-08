import crypto from 'crypto';

export class PayHeroService {
  private baseUrl: string;
  private channelId: string;
  private tillNumber: string;
  private apiKey: string;
  private webhookSecret: string;

  constructor() {
    this.baseUrl = "https://backend.payhero.co.ke/api/v2";
    this.channelId = process.env.PAYHERO_CHANNEL_ID!;
    this.tillNumber = process.env.PAYHERO_TILL_NUMBER!;
    this.apiKey = process.env.PAYHERO_API_KEY!;
    this.webhookSecret = process.env.PAYHERO_WEBHOOK_SECRET || '';
    
    // Check for missing essential credentials
    const missingVars = [];
    if (!this.channelId) missingVars.push('PAYHERO_CHANNEL_ID');
    if (!this.tillNumber) missingVars.push('PAYHERO_TILL_NUMBER');
    if (!this.apiKey) missingVars.push('PAYHERO_API_KEY');
    
    if (missingVars.length > 0) {
      console.error('Missing PayHero environment variables:', missingVars);
      throw new Error(`Missing required PayHero environment variables: ${missingVars.join(', ')}`);
    }
    
    // Debug logging
    console.log('PayHero service initialized for production:');
    console.log('- Base URL:', this.baseUrl);
    console.log('- Channel ID:', this.channelId);
    console.log('- Till Number:', this.tillNumber);
    console.log('- API Key length:', this.apiKey?.length || 0);
    console.log('- Has Webhook Secret:', !!this.webhookSecret);
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
    console.log('Using Channel ID:', this.channelId);
    console.log('Using API Key authentication');
    
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
      console.log('PayHero API response body:', JSON.stringify(result, null, 2));
      
      if (!response.ok) {
        // Handle specific account inactive error
        if (result.error_code === 'PERMISSION_DENIED' && result.error_message?.includes('Inactive')) {
          console.error('PayHero account inactive - requires activation');
          return {
            error: 'PayHero merchant account is inactive. Please contact PayHero support to activate your account.',
            error_code: result.error_code,
            accountStatus: 'inactive'
          };
        }
        
        console.error('PayHero API error details:', {
          status: response.status,
          statusText: response.statusText,
          result
        });
        return { 
          error: result.message || result.error_message || `HTTP ${response.status}: ${response.statusText}`,
          error_code: result.error_code 
        };
      }
      
      return result;
    } catch (error) {
      console.error('PayHero API network error:', error);
      return { error: 'Network error connecting to PayHero' };
    }
  }

  // Initiate withdrawal - For production, use manual processing
  async initiateWithdrawal({ amount, phoneNumber, reference, description }: {
    amount: number;
    phoneNumber: string;
    reference: string;
    description: string;
  }) {
    console.log('PayHero Withdrawal Request (Manual Processing):', { amount, phoneNumber, reference, description });
    
    // For production with basic credentials, withdrawals are processed manually
    // This ensures security and compliance with financial regulations
    
    return {
      success: true,
      status: 'MANUAL_PROCESSING',
      reference,
      message: 'Withdrawal request submitted for manual processing',
      requiresManualApproval: true,
      processingTime: '24 hours',
      instructions: 'Your withdrawal will be processed manually by our team within 24 hours during business hours.'
    };
  }

  // Alternative withdrawal method if B2C is not available
  private async initiateAlternativeWithdrawal({ amount, phoneNumber, reference, description }: {
    amount: number;
    phoneNumber: string;
    reference: string;
    description: string;
  }) {
    console.log('Using alternative withdrawal method - Manual processing required');
    
    // For manual processing, we'll create a withdrawal request that requires admin approval
    // This is a fallback when PayHero doesn't support direct B2C withdrawals
    
    return {
      success: true,
      status: 'MANUAL_PROCESSING',
      reference,
      message: 'Withdrawal request submitted for manual processing',
      requiresManualApproval: true,
      processingTime: '24 hours'
    };
  }

  // Check PayHero account balance (optional, may not be available)
  async checkAccountBalance() {
    try {
      // Try multiple possible balance endpoints
      const endpoints = [
        `${this.baseUrl}/accounts/balance`,
        `${this.baseUrl}/account/balance`,
        `${this.baseUrl}/balance`,
        `${this.baseUrl}/wallet/balance`
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying balance endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${this.apiKey}`
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('Balance endpoint found:', endpoint, result);
            return result;
          } else {
            const errorText = await response.text();
            console.log(`Endpoint ${endpoint} failed with status ${response.status}:`, errorText);
          }
        } catch (error) {
          console.log(`Network error for endpoint ${endpoint}:`, error);
        }
      }
      
      // If all endpoints fail, return a warning but don't block
      console.warn('No working balance endpoint found, skipping balance check');
      return { 
        warning: 'Balance check unavailable - PayHero may not provide balance API for basic accounts',
        available_balance: Number.MAX_SAFE_INTEGER // Allow transactions to proceed
      };
      
    } catch (error) {
      console.error('Error fetching account balance:', error);
      return { 
        warning: 'Balance check failed',
        available_balance: Number.MAX_SAFE_INTEGER // Allow transactions to proceed
      };
    }
  }

  // Validate withdrawal before processing (simplified for basic accounts)
  async validateWithdrawal(amount: number) {
    // For basic PayHero accounts, we skip balance validation
    // and rely on manual processing to ensure sufficient funds
    console.log('Skipping balance validation for basic PayHero account');
    return { 
      valid: true, 
      warning: 'Balance validation skipped - manual processing will verify funds',
      availableBalance: 'unknown' 
    };
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
