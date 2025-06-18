#!/bin/bash
# Replit startup script to ensure proper PORT injection
echo "Starting GoHighLevel Marketplace..."
echo "Environment: NODE_ENV=${NODE_ENV:-development}"
echo "Raw PORT: '$PORT'"
node server/index.js