// Simple proxy server to avoid CORS issues with Rayls RPC endpoints
// Run this with: node proxy-server.js

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 3002;

// Enable CORS
app.use(cors());
app.use(express.json());

// Proxy for public chain
app.use('/api/public', createProxyMiddleware({
  target: 'https://testnet-rpc.rayls.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/public': '', // Remove /api/public prefix
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('🔄 Proxying to public chain:', req.method, req.url);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('✅ Response from public chain:', proxyRes.statusCode);
  },
  onError: (err, req, res) => {
    console.error('❌ Public chain proxy error:', err.message);
    res.status(500).json({ error: 'Failed to connect to public chain' });
  }
}));

// Proxy for private chain
app.use('/api/private', createProxyMiddleware({
  target: 'https://privacy-node-5.rayls.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/private': '', // Remove /api/private prefix
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('🔄 Proxying to private chain:', req.method, req.url);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('✅ Response from private chain:', proxyRes.statusCode);
  },
  onError: (err, req, res) => {
    console.error('❌ Private chain proxy error:', err.message);
    res.status(500).json({ error: 'Failed to connect to private chain' });
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Public chain proxy: http://localhost:${PORT}/api/public`);
  console.log(`📡 Private chain proxy: http://localhost:${PORT}/api/private`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\\n🛑 Shutting down proxy server...');
  process.exit(0);
});
