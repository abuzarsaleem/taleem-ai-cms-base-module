export function getConfig() {
  return window.DEMO_CONFIG ?? {
    apiBase: '/demo-api',
    clientId: 'alumni-web',
    redirectUri: 'http://localhost:3001/callback',
    defaultScope: 'openid profile tenant.read',
  };
}

export async function apiJson(path, options = {}) {
  const cfg = getConfig();
  const res = await fetch(`${cfg.apiBase}${path}`, {
    headers: { 'content-type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data.message ?? data.error ?? text ?? res.statusText;
    throw new Error(Array.isArray(msg) ? msg.join(', ') : String(msg));
  }
  return data;
}

export function randomBase64Url(bytes = 32) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  let binary = '';
  for (const b of arr) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sha256Base64Url(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  let binary = '';
  for (const b of new Uint8Array(digest)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export const PKCE_STORAGE_KEY = 'taleem_oauth_demo_pkce';

export function savePkceSession(payload) {
  sessionStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(payload));
}

export function loadPkceSession() {
  const raw = sessionStorage.getItem(PKCE_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function savePlatformToken(token) {
  sessionStorage.setItem('taleem_oauth_demo_platform_token', token);
}

export function loadPlatformToken() {
  return sessionStorage.getItem('taleem_oauth_demo_platform_token');
}

export function showError(el, message) {
  el.textContent = message;
  el.classList.remove('hidden');
}

export function hideError(el) {
  el.classList.add('hidden');
  el.textContent = '';
}
