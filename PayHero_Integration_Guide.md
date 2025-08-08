# PayHero Integration Guide

This guide will help you integrate your new PayHero wallet credentials for deposits and withdrawals.

## 🔧 Setup Steps

### 1. Environment Variables
Add these new environment variables to your `.env` file:

```bash
# NEW PayHero Wallet Credentials
PAYHERO_USERNAME=your_api_username
PAYHERO_PASSWORD=your_api_password
PAYHERO_BASIC_AUTH_TOKEN=your_basic_auth_token
PAYHERO_CHANNEL_ACCOUNT_ID=your_channel_account_id
```

### 2. Generate Basic Auth Token
The `PAYHERO_BASIC_AUTH_TOKEN` should be a base64-encoded string of `username:password`:

```bash
# In terminal (Linux/Mac):
echo -n "username:password" | base64

# In PowerShell (Windows):
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("username:password"))
```

### 3. Configure Webhooks in PayHero Dashboard
Set these webhook URLs in your PayHero account:

- **Deposits (STK Push)**: `https://yourdomain.com/api/webhooks/payhero`
- **Withdrawals (B2C)**: `https://yourdomain.com/api/webhooks/payhero/b2c`

## 🧪 Testing

### Test PayHero Connection
Visit: `https://yourdomain.com/api/admin/test-payhero`

This will check:
- ✅ Environment variables are set
- ✅ PayHero API connection
- ✅ Account balance

### Test Deposit
```bash
curl -X POST https://yourdomain.com/api/admin/test-payhero \
  -H "Content-Type: application/json" \
  -d '{
    "action": "test-deposit",
    "amount": 10,
    "phoneNumber": "254712345678"
  }'
```

### Test Withdrawal
```bash
curl -X POST https://yourdomain.com/api/admin/test-payhero \
  -H "Content-Type: application/json" \
  -d '{
    "action": "test-withdrawal",
    "amount": 10,
    "phoneNumber": "254712345678"
  }'
```

## 🔄 How It Works

### Deposits (STK Push)
1. User initiates deposit through UI
2. System calls PayHero STK Push API
3. User receives M-Pesa prompt on phone
4. User completes payment
5. PayHero sends webhook to `/api/webhooks/payhero`
6. System updates wallet balance

### Withdrawals (B2C)
1. User initiates withdrawal through UI
2. System validates PayHero account balance
3. System debits user wallet immediately
4. System calls PayHero B2C API
5. PayHero processes withdrawal
6. PayHero sends webhook to `/api/webhooks/payhero/b2c`
7. System marks transaction as completed

### Fallback for Manual Processing
If PayHero B2C API is not available:
1. System creates withdrawal request for manual processing
2. Admin can view pending withdrawals in admin panel
3. Admin processes withdrawals manually through PayHero dashboard
4. Admin marks withdrawals as completed in the system

## 🛠 Updated Components

### 1. PayHero Service (`lib/payhero.ts`)
- ✅ Added new authentication with username/password/basic auth token
- ✅ Added B2C withdrawal functionality
- ✅ Added account balance checking
- ✅ Added withdrawal validation
- ✅ Fallback to manual processing if B2C API unavailable

### 2. Withdrawal API (`app/api/wallet/withdraw/route.ts`)
- ✅ Integrated with PayHero B2C API
- ✅ Added balance validation before withdrawal
- ✅ Improved error handling
- ✅ Support for both automatic and manual processing

### 3. Webhooks
- ✅ Enhanced deposit webhook (`app/api/webhooks/payhero/route.ts`)
- ✅ New B2C withdrawal webhook (`app/api/webhooks/payhero/b2c/route.ts`)

### 4. Testing Endpoint
- ✅ Admin test endpoint (`app/api/admin/test-payhero/route.ts`)

## 🔍 Monitoring & Debugging

### Check Logs
Monitor the console output for:
```
PayHero service initialized:
- Username: your_username
- Basic Auth Token length: 44
- Channel Account ID: 12345
```

### Common Issues

**Authentication Errors**
- ❌ Check username/password are correct
- ❌ Verify basic auth token is properly base64 encoded
- ❌ Ensure channel account ID matches your PayHero wallet

**Webhook Issues**
- ❌ Verify webhook URLs are accessible from internet
- ❌ Check webhook signature validation (if enabled)
- ❌ Ensure HTTPS is used for webhook URLs

**Balance Issues**
- ❌ Verify PayHero account has sufficient balance for withdrawals
- ❌ Check account balance API endpoint is working

## 📊 Database Changes

The system now properly handles:
- Transaction statuses: `PENDING`, `COMPLETED`, `FAILED`
- Withdrawal statuses: `PENDING`, `APPROVED`, `REJECTED`, `PAID`
- Automatic wallet balance updates via webhooks
- Withdrawal refunds on failure

## 🚀 Next Steps

1. **Add your PayHero credentials** to environment variables
2. **Test the integration** using the test endpoints
3. **Configure webhooks** in PayHero dashboard
4. **Test with small amounts** to verify everything works
5. **Monitor logs** for any issues
6. **Update admin panel** to display withdrawal statuses

## 📞 Support

If you encounter issues:
1. Check the test endpoint first
2. Review console logs for errors
3. Verify all environment variables are set
4. Test with PayHero's sandbox environment first
5. Contact PayHero support for API-specific issues

---

**⚠️ Important Security Notes:**
- Keep your PayHero credentials secure
- Use HTTPS for all webhook URLs
- Monitor failed transactions for suspicious activity
- Implement rate limiting on payment endpoints
- Regular backup of transaction data
