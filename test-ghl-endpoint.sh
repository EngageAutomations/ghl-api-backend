#!/bin/bash
# GoHighLevel API Endpoint Validation
# Test script for verifying correct API endpoint and headers

echo "Testing GoHighLevel API Endpoint Configuration..."

# Test endpoint with sample request (will fail with 401 but should return JSON)
curl -v \
  -H "Authorization: Bearer test_token" \
  -H "Version: 2021-07-28" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  "https://services.leadconnectorhq.com/v1/users/me"

echo ""
echo "Expected behavior:"
echo "- Should return 401 Unauthorized (expected without valid token)"
echo "- Should return JSON response (not HTML)"
echo "- Content-Type should be application/json"
echo ""
echo "If you see HTML instead of JSON, the endpoint configuration is incorrect."
