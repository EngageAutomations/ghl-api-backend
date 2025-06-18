#!/bin/bash

# GoHighLevel Marketplace Startup Script for Replit
echo "Starting GoHighLevel Marketplace..."

# Set environment variables
export PORT=${PORT:-5000}
export NODE_ENV=${NODE_ENV:-development}

# Kill any existing processes on port 5000
echo "Cleaning up existing processes..."
pkill -f "port.*5000" 2>/dev/null || true
sleep 2

# Start the server
echo "Starting server on port $PORT..."
node dev.cjs &

# Wait for server to start
sleep 3

# Check if server is running
if curl -s http://localhost:$PORT/health > /dev/null; then
    echo "✅ GoHighLevel Marketplace is running on port $PORT"
    echo "🌐 Preview URL: http://localhost:$PORT"
else
    echo "❌ Server failed to start"
    exit 1
fi

# Keep script running
wait