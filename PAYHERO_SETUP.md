# PayHero Integration Environment Variables

# Legacy PayHero credentials (keep these for now)
PAYHERO_CHANNEL_ID=your_existing_channel_id
PAYHERO_TILL_NUMBER=your_existing_till_number
PAYHERO_API_KEY=your_existing_api_key
PAYHERO_WEBHOOK_SECRET=your_webhook_secret

# NEW PayHero Wallet Credentials
# Add these new environment variables to your .env file:

# PayHero API Username
PAYHERO_USERNAME=your_api_username

# PayHero API Password
PAYHERO_PASSWORD=your_api_password

# PayHero Basic Auth Token (base64 encoded username:password)
PAYHERO_BASIC_AUTH_TOKEN=your_basic_auth_token

# PayHero Channel Account ID (for the new wallet)
PAYHERO_CHANNEL_ACCOUNT_ID=your_channel_account_id

# Example of how to generate the basic auth token:
# echo -n "username:password" | base64
# or use online base64 encoder with "username:password"

# Webhook URL for PayHero callbacks:
# Deposits: https://yourdomain.com/api/webhooks/payhero
# Withdrawals (B2C): https://yourdomain.com/api/webhooks/payhero/b2c

# Important Notes:
# 1. Replace all placeholder values with your actual PayHero credentials
# 2. Keep the PAYHERO_BASIC_AUTH_TOKEN secure - it contains your login credentials
# 3. Update your PayHero webhook URLs in the PayHero dashboard
# 4. Test with small amounts first to ensure everything works correctly
# 5. Monitor the logs for any authentication or API errors
