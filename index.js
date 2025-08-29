// index.js

const http = require('http');
const httpProxy = require('http-proxy');

// Create a proxy server that forwards WebSocket traffic to mc.asspixel.net
const proxy = httpProxy.createProxyServer({
  target: 'wss://mc.asspixel.net',
  ws: true,
  secure: true
});

// (Optional) Log proxy errors for easier debugging
proxy.on('error', (err, req, socket) => {
  console.error('Proxy error:', err);
  if (socket.writable) {
    socket.end();
  }
});

// Create an HTTP server just to hook the 'upgrade' event
const server = http.createServer((req, res) => {
  // You could respond to HTTP requests here if you like,
  // but for a pure WebSocket proxy you can just 404 or leave blank.
  res.writeHead(404);
  res.end();
});

// When a client sends a WebSocket Upgrade request, pipe it through the proxy
server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

// Listen on the Render-provided PORT (or 8080 locally)
const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`WebSocket proxy listening on port ${port}`);
});
