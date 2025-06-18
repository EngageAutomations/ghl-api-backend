// Wrapper to simulate npm run dev functionality
const { execSync } = require('child_process');

try {
  console.log('Starting GoHighLevel Marketplace via npm wrapper...');
  execSync('node main.cjs', { stdio: 'inherit' });
} catch (error) {
  console.error('Error starting server:', error.message);
  process.exit(1);
}