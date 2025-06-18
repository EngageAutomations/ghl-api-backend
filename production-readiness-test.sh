#!/bin/bash
# OAuth Production Readiness Test Script

echo "🧪 OAuth Production Readiness Testing"
echo "======================================"

# Test 1: OAuth Status Endpoint JSON Response
echo "1. Testing OAuth Status JSON Response..."
RESPONSE=$(curl -s -H "Accept: application/json" "http://localhost:5000/api/oauth/status?installation_id=test")
if echo "$RESPONSE" | grep -q '"error"'; then
  echo "✅ OAuth status returns JSON"
else
  echo "❌ OAuth status returns HTML"
fi

# Test 2: Health Check Endpoint
echo "2. Testing Health Check Endpoint..."
HEALTH=$(curl -s "http://localhost:5000/api/health")
if echo "$HEALTH" | grep -q '"status"'; then
  echo "✅ Health check working"
else
  echo "❌ Health check failed"
fi

# Test 3: API Route Protection
echo "3. Testing API Route Protection..."
API_404=$(curl -s "http://localhost:5000/api/nonexistent")
if echo "$API_404" | grep -q '"error"'; then
  echo "✅ API 404 handling working"
else
  echo "❌ API 404 handling broken"
fi

echo "======================================"
echo "Test Complete"
