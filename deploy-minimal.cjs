// Minimal deployment script - creates production-ready build
const fs = require('fs');
const path = require('path');

console.log('Creating minimal production deployment...');

// Create dist directory
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true });
}
fs.mkdirSync(distPath, { recursive: true });

// Copy the working OAuth server
fs.copyFileSync(
  path.join(__dirname, 'server/minimal-oauth.cjs'),
  path.join(distPath, 'index.js')
);

// Create production package.json
const prodPackage = {
  "name": "oauth-directory-app",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "cookie-parser": "^1.4.6"
  }
};

fs.writeFileSync(
  path.join(distPath, 'package.json'),
  JSON.stringify(prodPackage, null, 2)
);

// Create simple index.html for the frontend
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Directory App</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .container { max-width: 600px; margin: 0 auto; text-align: center; }
    .btn { background: #0079F2; color: white; padding: 12px 24px; border: none; border-radius: 6px; text-decoration: none; display: inline-block; margin: 10px; }
    .btn:hover { background: #0066D9; }
  </style>
</head>
<body>
  <div class="container">
    <h1>GoHighLevel Directory App</h1>
    <p>Connect your GoHighLevel account to get started.</p>
    <a href="/oauth/start" class="btn">Connect with GoHighLevel</a>
    <div id="status"></div>
  </div>
  <script>
    // Check for OAuth callback result
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const status = document.getElementById('status');
    
    if (error) {
      status.innerHTML = '<p style="color: red;">OAuth Error: ' + error + '</p>';
    } else if (window.location.pathname === '/dashboard') {
      status.innerHTML = '<p style="color: green;">Successfully connected!</p>';
    }
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(distPath, 'index.html'), indexHtml);

console.log('Minimal production build completed successfully!');
console.log('Files created:');
console.log('- dist/index.js (OAuth server)');
console.log('- dist/package.json');
console.log('- dist/index.html');