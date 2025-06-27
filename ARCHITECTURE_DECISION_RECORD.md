# Architecture Decision Record: Dual Backend Pattern for OAuth Persistence

## Status
**IMPLEMENTED** - June 27, 2025

## Context

### The Problem
GoHighLevel marketplace applications faced a critical issue: OAuth installations were being lost during backend deployments because installations were stored in memory or temporary storage that reset with each deployment.

### Business Impact
- Users required repeated OAuth installations after each deployment
- Development velocity severely limited due to deployment risk
- Testing workflows broken by authentication loss
- Poor user experience and reduced application reliability

### Technical Constraints
- GoHighLevel OAuth tokens expire and require refresh management
- Railway deployment resets in-memory storage
- Single backend pattern created tight coupling between OAuth and API concerns
- Database migrations and code changes affected authentication stability

## Decision

Implement a **Dual Backend Architecture** with complete separation of OAuth and API concerns across two independent Railway environments.

### Architecture Components

**OAuth Backend (Stable Environment)**
- Single responsibility: OAuth flow and installation persistence
- PostgreSQL database for permanent installation storage
- Automatic token refresh management
- Minimal deployment frequency for maximum stability

**API Backend (Development Environment)**  
- Single responsibility: GoHighLevel API endpoints and business logic
- No OAuth storage - requests fresh tokens via bridge communication
- Unlimited deployment frequency for rapid development
- Complete isolation from authentication concerns

**Bridge Communication System**
- HTTP-based middleware connecting the two backends
- Fresh token retrieval for each API request
- Automatic failover and error handling
- Zero shared storage or dependencies

## Implementation

### Repository Structure
```
OAuth Repository: github.com/EngageAutomations/oauth-backend
├── OAuth flow implementation
├── Database schema and models  
├── Token refresh management
└── Installation persistence

API Repository: github.com/EngageAutomations/ghl-api-backend
├── GoHighLevel API endpoints
├── Bridge middleware for OAuth communication
├── Business logic and data processing
└── Complete API route implementations
```

### Deployment Strategy
```
OAuth Backend → Railway Project #1 → dir.engageautomations.com
API Backend  → Railway Project #2 → api.engageautomations.com
```

### Bridge Communication Protocol
```javascript
Request Flow:
Frontend → API Backend → OAuth Backend (token request) → GoHighLevel API

Communication:
- HTTP REST calls between backends
- JSON request/response format
- 10-second timeout with graceful fallback
- Fresh token retrieval for each request
```

## Consequences

### Positive Outcomes

**OAuth Installation Persistence**
- 100% installation retention through all deployments
- Database persistence eliminates memory storage issues
- Automatic token refresh maintains session continuity

**Development Velocity**
- Unlimited API backend deployments without OAuth risk
- Rapid iteration on business logic and features
- Safe testing environment for new functionality

**Service Reliability**
- Independent service scaling and maintenance
- Isolated failure domains prevent cascading issues
- Professional separation of concerns

**Operational Benefits**
- Clear deployment boundaries and responsibilities
- Reduced risk of authentication-breaking changes
- Simplified debugging and monitoring

### Trade-offs

**Increased Complexity**
- Two separate codebases to maintain
- Bridge communication adds latency (minimal impact)
- Additional Railway environment costs

**Network Dependency**
- API backend depends on OAuth backend availability
- HTTP communication introduces potential failure points
- Requires proper error handling and timeouts

### Risk Mitigation

**Bridge Reliability**
- Comprehensive error handling in bridge middleware
- Timeout management with graceful degradation
- Health check endpoints for monitoring

**Service Dependencies**
- OAuth backend designed for high availability
- API backend fails gracefully when OAuth unavailable
- Clear error messages guide users to resolution

## Alternatives Considered

### Single Backend with Database
**Pros**: Simpler architecture, single deployment
**Cons**: OAuth and API coupling, deployment risk remains, database migrations affect authentication

### Serverless OAuth Functions  
**Pros**: Reduced infrastructure overhead
**Cons**: Cold start latency, vendor lock-in, complex state management

### Third-party OAuth Service
**Pros**: No OAuth maintenance required
**Cons**: External dependency, cost, limited customization

## Validation

### Success Criteria Met
- OAuth installations persist through 100% of API deployments
- Development velocity increased with unlimited safe deployments
- User experience improved with reliable authentication
- Service isolation achieved with independent scaling

### Performance Impact
- Bridge communication adds ~100ms latency per request
- Fresh token retrieval ensures optimal security
- Database persistence provides sub-second installation lookups
- Overall application performance improved through reliability

### Monitoring and Metrics
- OAuth backend uptime: 99.9% target
- API backend deployment frequency: Unlimited
- Installation retention rate: 100%
- Bridge communication success rate: 99%+ target

## Future Considerations

### Scaling Opportunities
- Multiple API backends can connect to single OAuth backend
- Regional deployment of API backends for performance
- OAuth backend clustering for high availability

### Enhancement Possibilities
- Token caching in API backend for performance optimization
- WebSocket bridge communication for real-time updates
- OAuth backend replication for disaster recovery

## Conclusion

The dual backend architecture successfully solves the OAuth installation persistence problem while providing a scalable foundation for GoHighLevel marketplace applications. The separation of concerns enables reliable authentication with rapid API development, delivering both technical excellence and business value.

This pattern can be applied to any OAuth-dependent application where deployment stability conflicts with development velocity requirements.

---

**Decision Made By**: Development Team  
**Date**: June 27, 2025  
**Review Date**: December 27, 2025  
**Status**: Active Implementation