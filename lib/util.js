const crypto = require('crypto');

const ALPH = 'abcdefghijkmnpqrstuvwxyz23456789';

function rid(n = 10) {
  const b = crypto.randomBytes(n);
  let s = '';
  for (let i = 0; i < n; i++) s += ALPH[b[i] % ALPH.length];
  return s;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let failed = false;
    req.on('data', (c) => {
      if (failed) return;
      size += c.length;
      if (size > limit) {
        failed = true;
        reject(httpError(413, 'Dữ liệu gửi lên quá lớn'));
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => { if (!failed) resolve(Buffer.concat(chunks)); });
    req.on('error', reject);
  });
}

async function readJson(req, limit = 512 * 1024) {
  const b = await readBody(req, limit);
  if (!b.length) return {};
  try {
    return JSON.parse(b.toString('utf8'));
  } catch {
    throw httpError(400, 'Dữ liệu không hợp lệ');
  }
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'X-Content-Type-Options': 'nosniff', ...headers });
  res.end(body);
}

function json(res, status, obj) {
  send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
}

function cookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) {
      try { out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); } catch { /* bỏ qua cookie lỗi */ }
    }
  });
  return out;
}

function slugify(s) {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

function str(v, max = 200) {
  return String(v ?? '').trim().slice(0, max);
}

module.exports = { rid, esc, httpError, readBody, readJson, send, json, cookies, slugify, str };
