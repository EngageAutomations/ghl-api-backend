/**
 * Railway Environment Variables Debug
 * Tests if environment variables are accessible in the current Railway deployment
 */

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Debug endpoint to check environment variables (without exposing secrets)
app.get('/debug/env', (req, res) => {
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV || 'undefined',
    PORT: process.env.PORT || 'undefined',
    GHL_CLIENT_ID: process.env.GHL_CLIENT_ID ? 'SET (' + process.env.GHL_CLIENT_ID.substring(0, 8) + '...)' : 'NOT SET',
    GHL_CLIENT_SECRET: process.env.GHL_CLIENT_SECRET ? 'SET (' + process.env.GHL_CLIENT_SECRET.substring(0, 8) + '...)' : 'NOT SET',
    GHL_REDIRECT_URI: process.env.GHL_REDIRECT_URI || 'NOT SET',
    timestamp: new Date().toISOString()
  };
  
  res.json({
    status: 'debug_info',
    environment_check: envCheck,
    all_env_keys: Object.keys(process.env).filter(key => key.startsWith('GHL_'))
  });
});

// Test OAuth token exchange with actual environment variables
app.get('/debug/token-test', async (req, res) => {
  const code = req.query.code || 'test_code';
  
  console.log('=== OAuth Debug Test ===');
  console.log('GHL_CLIENT_ID:', process.env.GHL_CLIENT_ID ? 'SET' : 'NOT SET');
  console.log('GHL_CLIENT_SECRET:', process.env.GHL_CLIENT_SECRET ? 'SET' : 'NOT SET');
  console.log('GHL_REDIRECT_URI:', process.env.GHL_REDIRECT_URI);
  
  if (!process.env.GHL_CLIENT_ID || !process.env.GHL_CLIENT_SECRET || !process.env.GHL_REDIRECT_URI) {
    return res.json({
      error: 'environment_variables_missing',
      missing: {
        GHL_CLIENT_ID: !process.env.GHL_CLIENT_ID,
        GHL_CLIENT_SECRET: !process.env.GHL_CLIENT_SECRET,
        GHL_REDIRECT_URI: !process.env.GHL_REDIRECT_URI
      }
    });
  }
  
  try {
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.GHL_REDIRECT_URI
      })
    });
    
    const responseText = await tokenResponse.text();
    
    res.json({
      status: 'token_exchange_test',
      request_sent: true,
      response_status: tokenResponse.status,
      response_ok: tokenResponse.ok,
      response_body: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''),
      env_vars_confirmed: {
        client_id_length: process.env.GHL_CLIENT_ID.length,
        secret_length: process.env.GHL_CLIENT_SECRET.length,
        redirect_uri: process.env.GHL_REDIRECT_URI
      }
    });
    
  } catch (error) {
    res.json({
      error: 'token_exchange_error',
      message: error.message,
      stack: error.stack
    });
  }
});

// Health check
app.get('/debug/health', (req, res) => {
  res.json({
    status: 'debug_healthy',
    version: '2.0.0-debug',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔍 Debug OAuth Backend running on port ${PORT}`);
  console.log('Environment Variables Check:');
  console.log('- GHL_CLIENT_ID:', process.env.GHL_CLIENT_ID ? 'SET' : 'NOT SET');
  console.log('- GHL_CLIENT_SECRET:', process.env.GHL_CLIENT_SECRET ? 'SET' : 'NOT SET');
  console.log('- GHL_REDIRECT_URI:', process.env.GHL_REDIRECT_URI || 'NOT SET');
});

module.exports = app;