# PayHero Production Integration - Quick Setup

You now have a production-ready PayHero integration using only the basic credentials.

## 🚀 **Ready to Use Features**

### ✅ **Deposits (STK Push)**
- Automatic M-Pesa STK Push
- Real-time payment processing
- Automatic wallet balance updates
- Error handling for inactive accounts

### ✅ **Withdrawals (Manual Processing)**
- Secure manual approval process
- 24-hour processing guarantee
- Automatic wallet debit
- Admin notification system

## 📋 **Setup Your Environment Variables**

Replace the placeholder values in your `.env` file:

```bash
# PayHero Production Credentials
PAYHERO_CHANNEL_ID=your_actual_channel_id
PAYHERO_TILL_NUMBER=your_actual_till_number  
PAYHERO_API_KEY=your_actual_api_key
PAYHERO_WEBHOOK_SECRET=your_webhook_secret_optional
```

## 🔗 **Configure PayHero Webhook**

In your PayHero dashboard, set the callback URL to:
```
https://your-production-domain.com/api/webhooks/payhero
```

## 🧪 **Test Your Integration**

1. **Test Configuration**:
   Visit: `https://your-domain.com/api/admin/test-payhero`

2. **Test Deposit** (STK Push):
   ```bash
   curl -X POST https://your-domain.com/api/admin/test-payhero \
     -H "Content-Type: application/json" \
     -d '{
       "action": "test-deposit",
       "amount": 10,
       "phoneNumber": "254712345678"
     }'
   ```

3. **Test Withdrawal** (Manual Processing):
   ```bash
   curl -X POST https://your-domain.com/api/admin/test-payhero \
     -H "Content-Type: application/json" \
     -d '{
       "action": "test-withdrawal", 
       "amount": 10,
       "phoneNumber": "254712345678"
     }'
   ```

## ⚡ **How It Works**

### **Deposit Flow:**
1. User clicks deposit → STK Push sent to phone
2. User enters M-Pesa PIN → Payment completed
3. PayHero sends webhook → Wallet balance updated automatically

### **Withdrawal Flow:**
1. User requests withdrawal → Wallet debited immediately
2. Admin receives notification → Manual processing required
3. Admin processes via PayHero → Marks as completed in system

## 🛡️ **Error Handling**

The system handles common issues:
- ✅ **"Merchant Account Inactive"** → Clear user message
- ✅ **Network errors** → Retry mechanism
- ✅ **Invalid phone numbers** → Validation feedback
- ✅ **Missing credentials** → Startup error with details

## 🎯 **Production Checklist**

- [ ] Replace placeholder environment variables with actual PayHero credentials
- [ ] Set webhook URL in PayHero dashboard
- [ ] Test with small amounts (KES 10-50)
- [ ] Verify webhook delivery in PayHero dashboard
- [ ] Set up admin access for withdrawal processing
- [ ] Enable HTTPS for production domain

## 📞 **Support**

**PayHero Support:**
- Email: support@payhero.co.ke
- Dashboard: https://dashboard.payhero.co.ke

**Common Issues:**
- **Account Inactive**: Contact PayHero support for account activation
- **Webhook Not Working**: Check URL is publicly accessible via HTTPS
- **STK Push Failed**: Verify phone number format and PayHero account status

---

Your PayHero integration is now production-ready with secure manual withdrawal processing and automatic deposits! 🎉
