import { build } from 'esbuild';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Building production application...');

// Step 1: Build frontend with Vite
console.log('1. Building frontend...');
try {
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('✅ Frontend build complete');
} catch (error) {
  console.error('❌ Frontend build failed:', error);
  process.exit(1);
}

// Step 2: Build backend with proper ES module configuration
console.log('2. Building backend...');
try {
  await build({
    entryPoints: ['server/production-index.ts'],
    bundle: true,
    platform: 'node',
    target: 'es2022',
    format: 'esm',
    outdir: 'dist',
    outExtension: { '.js': '.js' },
    external: [
      // Keep database drivers external
      'pg',
      '@neondatabase/serverless',
      // Keep native modules external
      'fsevents',
      'esbuild',
    ],
    banner: {
      js: `
// ES Module compatibility fixes
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Make global for compatibility
global.__dirname = __dirname;
global.__filename = __filename;
global.require = require;
`
    },
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    minify: false, // Keep readable for debugging
    sourcemap: false,
    logLevel: 'info'
  });
  
  console.log('✅ Backend build complete');
} catch (error) {
  console.error('❌ Backend build failed:', error);
  process.exit(1);
}

// Step 3: Create production package.json
console.log('3. Creating production package.json...');
const productionPackage = {
  "name": "ghl-marketplace-app",
  "version": "1.0.0",
  "type": "module",
  "main": "production-index.js",
  "scripts": {
    "start": "node production-index.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "express": "^4.21.2",
    "cookie-parser": "^1.4.7",
    "jsonwebtoken": "^9.0.2",
    "@neondatabase/serverless": "^0.10.4",
    "drizzle-orm": "^0.39.1"
  }
};

fs.writeFileSync('dist/package.json', JSON.stringify(productionPackage, null, 2));
console.log('✅ Production package.json created');

// Step 4: Create startup script with proper error handling
console.log('4. Creating startup script...');
const startupScript = `#!/usr/bin/env node

// Production startup with comprehensive error handling
import './production-index.js';
`;

fs.writeFileSync('dist/start.js', startupScript);
console.log('✅ Startup script created');

console.log('\n🎉 Production build complete!');
console.log('To start the production server:');
console.log('  cd dist && node production-index.mjs');