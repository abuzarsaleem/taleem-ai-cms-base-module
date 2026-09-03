/**
 * Minimal OAuth consent demo — mock LMS + consent UI on http://localhost:3001
 *
 * Prerequisites:
 *   1. Base API running (npm run start:dev)
 *   2. OAuth client seeded (npm run seed:oauth-client)
 *   3. Tenant entitled to ALUMNI app + Sara (or test user) is a member
 *
 * Usage: npm run demo:oauth
 */
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demoDir = path.join(__dirname, '..', 'demo', 'oauth-consent');

const PORT = Number(process.env.OAUTH_DEMO_PORT ?? 3001);
const API_BASE = (process.env.OAUTH_DEMO_API_BASE ?? 'http://localhost:3000/api/v1').replace(/\/$/, '');
const CLIENT_ID = process.env.OAUTH_SEED_CLIENT_ID ?? 'alumni-web';
const CLIENT_SECRET = process.env.OAUTH_SEED_CLIENT_SECRET ?? 'AlumniClientSecret2026!';
const REDIRECT_URI = process.env.OAUTH_SEED_REDIRECT_URI ?? `http://localhost:${PORT}/callback`;
const DEFAULT_SCOPE = process.env.OAUTH_DEMO_SCOPE ?? 'openid profile tenant.read';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function proxyToApi(method, apiPath, req, extraHeaders = {}) {
  const url = `${API_BASE}${apiPath.startsWith('/') ? apiPath : `/${apiPath}`}`;
  const headers = { ...extraHeaders };

  let body;
  if (method !== 'GET' && method !== 'HEAD') {
    body = await readBody(req);
    if (body) headers['content-type'] = req.headers['content-type'] ?? 'application/json';
  }

  const auth = req.headers.authorization;
  if (auth) headers.authorization = auth;

  const response = await fetch(url, { method, headers, body });
  const text = await response.text();
  return { status: response.status, text, contentType: response.headers.get('content-type') ?? 'application/json' };
}

function injectConfig(html) {
  const config = JSON.stringify({
    apiBase: '/demo-api',
    clientId: CLIENT_ID,
    redirectUri: REDIRECT_URI,
    defaultScope: DEFAULT_SCOPE,
  });
  return html.replace('<!--DEMO_CONFIG-->', `<script>window.DEMO_CONFIG=${config};</script>`);
}

async function serveStatic(filePath) {
  const ext = path.extname(filePath);
  const content = await fs.readFile(filePath, 'utf8');
  return {
    status: 200,
    contentType: MIME[ext] ?? 'text/plain',
    body: ext === '.html' ? injectConfig(content) : content,
  };
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
    const pathname = url.pathname;

    if (pathname.startsWith('/demo-api/')) {
      if (pathname === '/demo-api/oauth/token' && req.method === 'POST') {
        const raw = await readBody(req);
        const parsed = JSON.parse(raw || '{}');
        const body = JSON.stringify({
          grant_type: parsed.grant_type ?? 'authorization_code',
          code: parsed.code,
          redirect_uri: REDIRECT_URI,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code_verifier: parsed.code_verifier,
          refresh_token: parsed.refresh_token,
        });
        const tokenRes = await fetch(`${API_BASE}/oauth/token`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body,
        });
        const text = await tokenRes.text();
        res.writeHead(tokenRes.status, { 'Content-Type': 'application/json' });
        res.end(text);
        return;
      }

      const apiPath = pathname.slice('/demo-api'.length) + url.search;
      const result = await proxyToApi(req.method ?? 'GET', apiPath, req);
      res.writeHead(result.status, { 'Content-Type': result.contentType });
      res.end(result.text);
      return;
    }

    let file;
    if (pathname === '/' || pathname === '/index.html') file = 'index.html';
    else if (pathname === '/consent' || pathname === '/consent.html') file = 'consent.html';
    else if (pathname === '/callback' || pathname === '/callback.html') file = 'callback.html';
    else if (pathname === '/demo.js') file = 'demo.js';
    else if (pathname === '/demo.css') file = 'demo.css';

    if (file) {
      const served = await serveStatic(path.join(demoDir, file));
      res.writeHead(served.status, { 'Content-Type': served.contentType });
      res.end(served.body);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  } catch (error) {
    console.error(error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`Demo server error: ${error.message ?? error}`);
  }
});

server.listen(PORT, () => {
  console.log('');
  console.log('OAuth consent demo');
  console.log('==================');
  console.log(`Mock LMS:     http://localhost:${PORT}/`);
  console.log(`Consent UI:   http://localhost:${PORT}/consent`);
  console.log(`Callback:     ${REDIRECT_URI}`);
  console.log(`Proxied API:  ${API_BASE}`);
  console.log(`Client ID:    ${CLIENT_ID}`);
  console.log('');
  console.log('Open http://localhost:' + PORT + '/ and click "Sign in with Taleem"');
  console.log('');
});
