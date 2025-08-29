const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({
  target: 'wss://mc.asspixel.net',
  ws: true,
  secure: true
});

const server = http.createServer();
server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

server.listen(8080, () => {
  console.log('WebSocket proxy listening on port 8080');
});
