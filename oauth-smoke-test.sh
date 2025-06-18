#!/bin/bash
# Automated OAuth Smoke Test Script
# Run this after every deployment to verify OAuth functionality

echo "🧪 OAuth Production Smoke Test Suite"
echo "===================================="

BASE_URL="${1:-http://localhost:5000}"
echo "Testing against: $BASE_URL"

# Test 1: OAuth Status JSON Response
echo -e "\n1. Testing OAuth Status JSON Response..."
RESPONSE=$(curl -s -H "Accept: application/json" "$BASE_URL/api/oauth/status?installation_id=test")
if echo "$RESPONSE" | jq empty 2>/dev/null; then
  echo "✅ OAuth status returns valid JSON"
  echo "$RESPONSE" | jq .
else
  echo "❌ OAuth status returns invalid JSON or HTML"
  echo "Response: $RESPONSE"
  exit 1
fi

# Test 2: Health Check
echo -e "\n2. Testing Health Check..."
HEALTH=$(curl -s "$BASE_URL/api/health")
if echo "$HEALTH" | jq .status 2>/dev/null | grep -q "healthy"; then
  echo "✅ Health check working"
else
  echo "❌ Health check failed"
  exit 1
fi

# Test 3: Error Handling
echo -e "\n3. Testing Error Handling..."
ERROR_RESPONSE=$(curl -s "$BASE_URL/api/oauth/status?installation_id=999999")
if echo "$ERROR_RESPONSE" | jq .error 2>/dev/null | grep -q "installation_not_found"; then
  echo "✅ Error handling working"
else
  echo "❌ Error handling broken"
  exit 1
fi

# Test 4: API Route Protection
echo -e "\n4. Testing API Route Protection..."
API_404=$(curl -s "$BASE_URL/api/nonexistent")
if echo "$API_404" | jq .error 2>/dev/null; then
  echo "✅ API 404 handling working"
else
  echo "❌ API 404 handling returns HTML"
  exit 1
fi

echo -e "\n✅ All smoke tests passed!"
echo "OAuth system is production ready."
