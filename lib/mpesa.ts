import axios from 'axios';
import { logger } from './logger';

interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  passKey: string;
  shortCode: string;
  callbackUrl: string;
}

export class MpesaAPI {
  private config: MpesaConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: MpesaConfig) {
    this.config = config;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      logger.info('Getting M-pesa access token');
      
      const auth = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64');
      const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
        headers: { Authorization: `Basic ${auth}` }
      });

      logger.debug('Access token response received');

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Expire 1 minute early
      
      if (!this.accessToken) {
        throw new Error('Failed to obtain access token');
      }
      
      return this.accessToken;
    } catch (error: any) {
      logger.error('Access token error', error);
      throw new Error(`Failed to get M-pesa access token: ${error.response?.data?.errorMessage || error.message}`);
    }
  }

  async initiateSTKPush(phoneNumber: string, amount: number, reference: string): Promise<any> {
    try {
      logger.payment('Initiating STK push', reference);

      const token = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = Buffer.from(
        `${this.config.shortCode}${this.config.passKey}${timestamp}`
      ).toString('base64');

      const requestBody = {
        BusinessShortCode: this.config.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: this.config.shortCode,
        PhoneNumber: phoneNumber,
        CallBackURL: `${this.config.callbackUrl}/api/wallet/mpesa/callback`,
        AccountReference: reference,
        TransactionDesc: `Payment for ${reference}`
      };

      logger.debug('STK push request prepared');

      const response = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.apiCall('/mpesa/stkpush', 'POST', response.status);
      return response.data;
    } catch (error: any) {
      logger.error('STK push error', error);
      throw new Error(`M-pesa STK push failed: ${error.response?.data?.errorMessage || error.message}`);
    }
  }
}

// Log M-pesa configuration for debugging
const mpesaConfig: MpesaConfig = {
  consumerKey: process.env.MPESA_CONSUMER_KEY || '',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
  passKey: process.env.MPESA_PASS_KEY || '',
  shortCode: process.env.MPESA_SHORT_CODE || '',
  callbackUrl: process.env.NEXT_PUBLIC_APP_URL || ''
};

logger.debug('M-pesa configuration loaded', {
  consumerKey: mpesaConfig.consumerKey ? '***SET***' : '***MISSING***',
  consumerSecret: mpesaConfig.consumerSecret ? '***SET***' : '***MISSING***',
  passKey: mpesaConfig.passKey ? '***SET***' : '***MISSING***',
  shortCode: mpesaConfig.shortCode ? '***SET***' : '***MISSING***',
  callbackUrl: mpesaConfig.callbackUrl ? '***SET***' : '***MISSING***'
});

export const mpesa = new MpesaAPI(mpesaConfig);
