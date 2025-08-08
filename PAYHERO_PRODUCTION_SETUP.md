# PayHero Production Setup Guide

## Required Environment Variables

Add these to your production environment:

```bash
# PayHero Production Credentials
PAYHERO_CHANNEL_ID=your_production_channel_id
PAYHERO_TILL_NUMBER=your_production_till_number  
PAYHERO_API_KEY=your_production_api_key
PAYHERO_WEBHOOK_SECRET=your_webhook_secret_optional

# Production URLs
NEXTAUTH_URL=https://your-production-domain.com
```

## PayHero Configuration Steps

### 1. Get Your PayHero Credentials
- **Channel ID**: Your PayHero channel identifier
- **Till Number**: Your M-Pesa till number
- **API Key**: Your PayHero API authentication key
- **Webhook Secret**: (Optional) For webhook signature verification

### 2. Configure Webhooks in PayHero Dashboard
Set this webhook URL in your PayHero account:
- **Callback URL**: `https://your-domain.com/api/webhooks/payhero`

### 3. Production Features

#### ✅ **Deposits (STK Push)**
- Automatic STK Push to customer's phone
- Real-time webhook notifications
- Automatic wallet balance updates
- Transaction tracking and logging

#### ✅ **Withdrawals (Manual Processing)**
- Secure manual approval process
- Admin dashboard for withdrawal management
- 24-hour processing guarantee
- Audit trail and compliance

### 4. How It Works

#### Deposit Flow:
1. User initiates deposit through UI
2. PayHero STK Push sent to phone
3. User completes M-Pesa payment
4. PayHero sends webhook notification
5. System automatically updates wallet balance

#### Withdrawal Flow:
1. User initiates withdrawal request
2. System debits wallet immediately
3. Admin receives notification for manual processing
4. Admin processes payment through PayHero dashboard
5. Admin marks withdrawal as completed in system

### 5. Security Features

- ✅ Environment variable validation
- ✅ Request payload logging
- ✅ Error handling and fallbacks
- ✅ Transaction auditing
- ✅ Manual approval for withdrawals
- ✅ Webhook signature verification (optional)

### 6. Monitoring & Debugging

The system logs detailed information for troubleshooting:

```
PayHero service initialized for production:
- Base URL: https://backend.payhero.co.ke/api/v2
- Channel ID: 2900
- Till Number: 2900
- API Key length: 84
- Has Webhook Secret: true
```

### 7. Error Handling

Common error scenarios handled:
- PayHero account inactive → Clear error message to user
- Network connectivity issues → Retry mechanism
- Invalid phone numbers → Validation feedback
- Insufficient funds → Balance check before processing

### 8. Testing

Test the integration:
1. Visit: `https://your-domain.com/api/admin/test-payhero`
2. Check environment variables are loaded
3. Test small deposit amounts (KES 10-50)
4. Verify webhook reception
5. Test withdrawal request flow

### 9. Production Checklist

Before going live:
- [ ] PayHero account is active and verified
- [ ] All environment variables set correctly
- [ ] Webhook URL configured in PayHero dashboard
- [ ] HTTPS enabled for production domain
- [ ] Database backups configured
- [ ] Admin access for withdrawal processing
- [ ] Error monitoring and logging setup
- [ ] Customer support process for payment issues

### 10. Support Contacts

**PayHero Support:**
- Email: support@payhero.co.ke  
- Phone: Check PayHero website for current number
- Dashboard: https://dashboard.payhero.co.ke

**For Technical Issues:**
- Check server logs for detailed error messages
- Use the test endpoint to validate configuration
- Monitor webhook delivery in PayHero dashboard
