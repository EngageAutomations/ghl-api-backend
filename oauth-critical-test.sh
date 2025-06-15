#!/bin/bash
# OAuth Comprehensive Test Suite
# Tests all critical OAuth functionality

echo "🧪 OAuth Critical Routing Test Suite"
echo "===================================="

BASE_URL="https://dir.engageautomations.com"

# Test 1: Check missing /api/oauth/auth endpoint
echo "1. Testing /api/oauth/auth endpoint..."
AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/oauth/auth?installation_id=test")
if [ "$AUTH_RESPONSE" = "404" ]; then
  echo "❌ /api/oauth/auth endpoint missing (expected)"
  echo "   This is causing the frontend retry failures"
else
  echo "✅ /api/oauth/auth endpoint available: $AUTH_RESPONSE"
fi

# Test 2: Check /api/oauth/status endpoint
echo "2. Testing /api/oauth/status endpoint..."
STATUS_RESPONSE=$(curl -s "$BASE_URL/api/oauth/status?installation_id=test")
if echo "$STATUS_RESPONSE" | jq . >/dev/null 2>&1; then
  echo "✅ /api/oauth/status returns valid JSON"
else
  echo "❌ /api/oauth/status returns invalid JSON or HTML"
fi

# Test 3: Test OAuth callback endpoint
echo "3. Testing OAuth callback endpoint..."
CALLBACK_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/oauth/callback?code=test")
echo "   OAuth callback status: $CALLBACK_RESPONSE"

# Test 4: Health check
echo "4. Testing health endpoint..."
HEALTH=$(curl -s "$BASE_URL/api/health")
if echo "$HEALTH" | jq .status 2>/dev/null | grep -q "healthy"; then
  echo "✅ Health check working"
else
  echo "❌ Health check failed"
fi

echo ""
echo "🔍 DIAGNOSIS:"
echo "============"
if [ "$AUTH_RESPONSE" = "404" ]; then
  echo "PRIMARY ISSUE: Frontend retry calls /api/oauth/auth but Railway backend only has /api/oauth/status"
  echo "SOLUTION: Either add /api/oauth/auth endpoint or update frontend to use /api/oauth/status"
fi

echo ""
echo "📋 REQUIRED ACTIONS:"
echo "==================="
echo "1. Deploy updated Railway backend with /api/oauth/auth endpoint"
echo "2. Verify GoHighLevel app scopes include 'users.read'"
echo "3. Test complete OAuth flow with real GoHighLevel account"
echo "4. Update frontend error handling if needed"
