# OAuth Monitoring & Alerting Setup

## Key Metrics to Track

### Success Rates
- OAuth status endpoint success rate (should be >99%)
- Token refresh success rate (should be >95%)
- User info retrieval success rate from GoHighLevel

### Error Rates
- 4xx errors on /api/oauth/status (monitor for spikes)
- 5xx errors indicating system issues
- Token refresh failures

### Performance Metrics
- Response time for /api/oauth/status
- Database query performance for installation lookups
- GoHighLevel API response times

## Recommended Alerts

### Critical Alerts (Page immediately)
- OAuth status endpoint returning HTML instead of JSON
- Token refresh failure rate >10% over 5 minutes
- Database connection failures

### Warning Alerts (Notify during business hours)
- OAuth status endpoint response time >2 seconds
- Error rate >5% over 15 minutes
- Missing required environment variables

## Sample Monitoring Queries

### Railway Metrics (if using Railway analytics)
```
# OAuth endpoint success rate
sum(rate(http_requests_total{path="/api/oauth/status", status_code!~"5.."}[5m])) /
sum(rate(http_requests_total{path="/api/oauth/status"}[5m])) * 100

# Token refresh success tracking
count(log_entries{message="Token refreshed successfully"}) over time
```

### Log-based Monitoring
- Search for "GoHighLevel user info API error" to catch API failures
- Monitor "OAuth Status endpoint hit" for usage patterns
- Track "token_refresh_failed" for authentication issues

## APM Integration
Consider adding lightweight APM:
- Datadog: Track request traces through OAuth flow
- NewRelic: Monitor database query performance
- Railway built-in metrics: Basic performance monitoring
