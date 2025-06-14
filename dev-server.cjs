const { spawn } = require('child_process');
const path = require('path');

console.log('Starting stable React development server...');

// Start the TypeScript server with proper error handling
const server = spawn('npx', ['tsx', 'server/simple-index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

server.on('error', (error) => {
  console.error('Server startup error:', error);
  process.exit(1);
});

server.on('exit', (code, signal) => {
  if (code !== 0) {
    console.log(`Server exited with code ${code} and signal ${signal}`);
    console.log('Restarting server in 2 seconds...');
    setTimeout(() => {
      // Restart the server
      const newServer = spawn('npx', ['tsx', 'server/simple-index.ts'], {
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'development'
        }
      });
    }, 2000);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down development server...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down development server...');
  server.kill('SIGTERM');
  process.exit(0);
});