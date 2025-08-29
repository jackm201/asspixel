// index.js
const http = require('http');
const httpProxy = require('http-proxy');

const TARGET = process.env.TARGET || 'wss://mc.asspixel.net';
const FORCED_ORIGIN = process.env.UPSTREAM_ORIGIN || 'https://g.eags.us'; // adjust if needed
const targetHost = new URL(TARGET).host;

const proxy = httpProxy.createProxyServer({
  target: TARGET,
  ws: true,
  secure: true,
  changeOrigin: true, // set Host to target by default
  xfwd: true,         // add X-Forwarded-* headers
  proxyTimeout: 0,    // don't kill long-lived sockets at the proxy layer
  timeout: 0
});

// Better error visibility
proxy.on('error', (err, req, socket) => {
  console.error('Proxy error:', err && err.code ? err.code : err);
  if (socket && socket.writable) socket.end();
});

// Force headers during WS handshake
proxy.on('proxyReqWs', (proxyReq) => {
  if (FORCED_ORIGIN) proxyReq.setHeader('Origin', FORCED_ORIGIN);
  // Some backends care about Host too; http-proxy sets it when changeOrigin: true,
  // but we make it explicit:
  proxyReq.setHeader('Host', targetHost);
});

// Minimal HTTP server (for health checks and sanity)
const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok\n');
  } else {
    res.writeHead(404);
    res.end();
  }
});

// Handle WS upgrades
server.on('upgrade', (req, socket, head) => {
  // If you prefer, you can also pass headers per-call here:
  proxy.ws(req, socket, head, {
    headers: { Origin: FORCED_ORIGIN }
  });
});

// Slightly bump timeouts to play nice with proxies
server.keepAliveTimeout = 65_000;
server.headersTimeout   = 70_000;
server.requestTimeout   = 0;

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`WebSocket proxy listening on :${port} -> ${TARGET}`);
  console.log(`Forcing Origin: ${FORCED_ORIGIN}  Host: ${targetHost}`);
});
