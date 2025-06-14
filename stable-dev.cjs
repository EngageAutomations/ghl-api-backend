const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting ultra-stable React development environment...');

let serverProcess = null;
let restartCount = 0;
const maxRestarts = 50;
const PORT = process.env.PORT || 3001; // Use different port

function startServer() {
  console.log(`📡 Starting server instance ${restartCount + 1} on port ${PORT}...`);
  
  serverProcess = spawn('npx', ['tsx', 'server/simple-index.ts'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: PORT,
      FORCE_COLOR: '1'
    }
  });

  serverProcess.stdout.on('data', (data) => {
    process.stdout.write(data);
  });

  serverProcess.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  serverProcess.on('error', (error) => {
    console.error('❌ Server startup error:', error.message);
    scheduleRestart();
  });

  serverProcess.on('exit', (code, signal) => {
    if (code !== 0 && restartCount < maxRestarts) {
      console.log(`⚠️  Server exited with code ${code}, signal ${signal}`);
      scheduleRestart();
    } else if (restartCount >= maxRestarts) {
      console.log('🛑 Max restarts reached. Please check for underlying issues.');
      process.exit(1);
    }
  });
}

function scheduleRestart() {
  if (restartCount < maxRestarts) {
    restartCount++;
    console.log(`🔄 Restarting server in 1 second... (attempt ${restartCount}/${maxRestarts})`);
    setTimeout(() => {
      startServer();
    }, 1000);
  }
}

function gracefulShutdown() {
  console.log('\n🛑 Shutting down development server...');
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
      process.exit(0);
    }, 2000);
  } else {
    process.exit(0);
  }
}

// Handle process termination gracefully
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Promise Rejection:', reason);
  // Don't exit on unhandled rejection, just log it
});

// Start the initial server
startServer();

// Health check every 30 seconds
setInterval(async () => {
  try {
    const response = await fetch(`http://localhost:${PORT}/health`);
    if (response.ok) {
      console.log('✅ Health check passed');
    } else {
      console.log('⚠️  Health check failed, server may need restart');
    }
  } catch (error) {
    console.log('🔍 Health check error:', error.message);
  }
}, 30000);