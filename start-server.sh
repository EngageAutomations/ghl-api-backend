#!/bin/bash
echo "Starting Dynamic Workflow Server..."
cd /home/runner/workspace
NODE_ENV=development npx tsx server/index.ts