// Temporary port bridge to resolve workflow port mismatch
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

// Proxy all requests to the actual server on port 3000
app.use('/', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  ws: true,
  logLevel: 'silent'
}));

app.listen(5000, () => {
  console.log('Port bridge running: 5000 -> 3000');
});