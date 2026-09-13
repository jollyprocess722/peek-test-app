/**
 * peek.dev wave-3a verification app (A31/A32/A33/A34/H45).
 * Zero-dependency node:http server. The fake `post()` registration exists so
 * the peek setup scanner can discover the webhook route candidate (A38).
 */
const http = require('node:http');
const { execFile } = require('node:child_process');

const PORT = Number(process.env.PORT || 3000);
const routes = {};
const deliveries = [];

/** Route-registration helper — scanned by peek's webhook discovery. */
function post(path, handler) {
  routes[path] = handler;
}

function send(res, status, body) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, { 'content-type': typeof body === 'string' ? 'text/html' : 'application/json' });
  res.end(payload);
}

/**
 * Inbound webhook endpoint (A38 proposal target / H45 delivery target).
 * Returns 500 when the payload asks for a failure, so failure highlighting
 * can be exercised honestly.
 */
post('/api/webhooks/test', function handleWebhook(req, res, body) {
  let parsed = {};
  try { parsed = JSON.parse(body || '{}'); } catch {}
  deliveries.push({ at: new Date().toISOString(), body: body || '' });
  if (parsed.fail === true) {
    send(res, 500, { error: 'synthetic webhook failure for wave-3a H45 verification' });
    return;
  }
  send(res, 200, { ok: true, received: body ? body.length : 0, signature: req.headers['x-webhook-signature'] ? 'present' : 'absent' });
});

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf8');

    if (req.method === 'POST' && routes[url.pathname]) {
      routes[url.pathname](req, res, body);
      return;
    }

    if (url.pathname === '/') {
      send(res, 200, '<h1>peek wave-3a verification app</h1><ul><li>POST /api/webhooks/test</li><li>GET /api/protected (Bearer peek-test)</li><li>GET /egress?url=...</li></ul>');
      return;
    }

    if (url.pathname === '/api/healthz') {
      send(res, 200, { ok: true, app: 'wave3a', secrets: { WAVE3A_TEST_SECRET: process.env.WAVE3A_TEST_SECRET ? 'injected' : 'absent' } });
      return;
    }

    if (url.pathname === '/api/protected') {
      const auth = req.headers.authorization || '';
      if (auth !== 'Bearer peek-test') {
        send(res, 401, { error: 'unauthorized: missing or wrong Authorization header' });
        return;
      }
      send(res, 200, { secret: 'authorized payload', payment_token: 'tok_live_9f8e7d6c5b4a' });
      return;
    }

    if (url.pathname === '/egress') {
      const target = url.searchParams.get('url');
      if (!target) { send(res, 400, { error: 'url query param required' }); return; }
      // curl honors HTTP(S)_PROXY env — the peek egress proxy (A34) is
      // enforced through exactly those env vars, so this call traverses it.
      execFile('curl', ['-sS', '--max-time', '15', '-o', '/dev/null', '-w', '%{http_code}', target], { env: process.env, timeout: 20000 }, (err, stdout, stderr) => {
        if (err && !stdout) {
          send(res, 200, { target, exitCode: err.code ?? null, httpStatus: null, stderr: String(stderr).slice(0, 300) });
          return;
        }
        send(res, 200, { target, exitCode: err ? err.code : 0, httpStatus: Number(stdout) || null, stderr: String(stderr).slice(0, 300) });
      });
      return;
    }

    send(res, 404, { error: 'not found', path: url.pathname });
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`wave3a test app listening on ${PORT}`);
});
