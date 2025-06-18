const { spawn } = require('child_process');

console.log('Starting GoHighLevel Marketplace server...');

const serverProcess = spawn('node', ['index.cjs'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: process.env.PORT || '3000'
  }
});

serverProcess.on('error', (err) => {
  console.error('Server startup error:', err);
});

process.on('SIGTERM', () => {
  serverProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  serverProcess.kill('SIGINT');
});