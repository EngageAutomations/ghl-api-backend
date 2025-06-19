#!/bin/bash

# GoHighLevel Marketplace Application Startup Script

echo "Starting GoHighLevel Marketplace Application..."

# Kill any existing processes
pkill -f "production-server.js" 2>/dev/null || true
pkill -f "node.*express" 2>/dev/null || true

# Wait for processes to terminate
sleep 2

# Start the production server
exec node production-server.js