#!/bin/bash

# OAuth Critical Test - Verify Current Railway State
echo "🔍 Testing Current Railway OAuth Configuration"
echo "============================================="

echo "1. Testing Railway Backend Health..."
HEALTH_RESPONSE=$(curl -s "https://dir.engageautomations.com/health")
echo "Health Check: $HEALTH_RESPONSE"

echo ""
echo "2. Testing OAuth Callback with Your Authorization Code..."
CALLBACK_RESPONSE=$(curl -s -w "%{http_code}" "https://dir.engageautomations.com/oauth/callback?code=1731fbd15b08681b9cc1b7a5fd321539d9b2c392")
echo "OAuth Callback Response: $CALLBACK_RESPONSE"

echo ""
echo "3. Testing OAuth Auth Endpoint..."
AUTH_RESPONSE=$(curl -s "https://dir.engageautomations.com/api/oauth/auth?installation_id=test")
echo "OAuth Auth Response: $AUTH_RESPONSE"

echo ""
echo "🎯 Analysis:"
echo "============"

if [[ $CALLBACK_RESPONSE == *"token_exchange_failed"* ]]; then
    echo "❌ OAuth callback is failing at token exchange step"
    echo "   This indicates environment variables are missing or incorrect"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Deploy the updated Railway package (railway-oauth-fix.tar.gz)"
    echo "2. Check Railway logs for environment variable validation output"
    echo "3. If variables show 'NOT SET', add them in Railway Variables section"
elif [[ $CALLBACK_RESPONSE == *"user_info_failed"* ]]; then
    echo "✅ Token exchange working, but user info retrieval failing"
    echo "   Environment variables are present but API endpoint may need adjustment"
else
    echo "✅ OAuth callback appears to be working correctly"
fi

echo ""
echo "🚀 Ready to Deploy Updated Backend"
echo "=================================="
echo "File ready: railway-oauth-fix.tar.gz"
echo "This package includes environment variable validation and debugging"