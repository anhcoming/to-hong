// Đăng nhập bằng Google (OAuth 2.0, luồng authorization code) — không cần thư viện ngoài.
// Cấu hình: config.google.clientId / clientSecret, hoặc biến môi trường GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.
// Trong Google Cloud Console, thêm "Authorized redirect URI" = <baseUrl>/auth/google/callback
const https = require('https');
const crypto = require('crypto');
const config = require('../config.json');
const { httpError } = require('./util');

function creds() {
  const g = config.google || {};
  return {
    id: process.env.GOOGLE_CLIENT_ID || g.clientId || '',
    secret: process.env.GOOGLE_CLIENT_SECRET || g.clientSecret || '',
  };
}
const enabled = () => !!(creds().id && creds().secret);

function authUrl(state, redirectUri) {
  const q = new URLSearchParams({
    client_id: creds().id, redirect_uri: redirectUri, response_type: 'code',
    scope: 'openid email profile', state, prompt: 'select_account',
  });
  return 'https://accounts.google.com/o/oauth2/v2/auth?' + q.toString();
}

function postForm(url, form) {
  const body = new URLSearchParams(form).toString();
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST', timeout: 15000,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        let j; try { j = JSON.parse(data); } catch { return reject(httpError(502, 'Google trả về dữ liệu lỗi')); }
        if (res.statusCode !== 200) return reject(httpError(502, 'Google từ chối đăng nhập: ' + (j.error_description || j.error || res.statusCode)));
        resolve(j);
      });
    });
    req.on('timeout', () => req.destroy(httpError(504, 'Không kết nối được tới Google')));
    req.on('error', (e) => reject(e.status ? e : httpError(502, 'Không kết nối được tới Google')));
    req.end(body);
  });
}

// Đổi mã lấy thông tin người dùng. id_token nhận trực tiếp từ Google qua HTTPS nên chỉ cần kiểm tra các trường.
async function exchange(code, redirectUri) {
  const c = creds();
  const tok = await postForm('https://oauth2.googleapis.com/token', {
    code, client_id: c.id, client_secret: c.secret, redirect_uri: redirectUri, grant_type: 'authorization_code',
  });
  const part = String(tok.id_token || '').split('.')[1];
  if (!part) throw httpError(502, 'Google không trả về thông tin tài khoản');
  const p = JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
  if (p.aud !== c.id) throw httpError(401, 'Mã đăng nhập không dành cho ứng dụng này');
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(p.iss)) throw httpError(401, 'Nguồn đăng nhập không hợp lệ');
  if (p.exp * 1000 < Date.now()) throw httpError(401, 'Phiên đăng nhập Google đã hết hạn, thử lại nhé');
  if (!p.email || p.email_verified === false || p.email_verified === 'false') throw httpError(401, 'Email Google chưa được xác minh');
  return { sub: p.sub, email: String(p.email).toLowerCase(), name: p.name || '', picture: p.picture || '' };
}

const newState = () => crypto.randomBytes(16).toString('hex');

module.exports = { enabled, authUrl, exchange, newState };
