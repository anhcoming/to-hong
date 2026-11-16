// Đăng nhập bằng Facebook (OAuth 2.0, luồng authorization code) — không cần thư viện ngoài.
// Cấu hình: biến môi trường FACEBOOK_APP_ID / FACEBOOK_APP_SECRET (hoặc config.facebook.appId / appSecret).
// Trong Meta for Developers → app → Facebook Login → Settings, thêm "Valid OAuth Redirect URI" = <baseUrl>/auth/facebook/callback
// Lưu ý: tài khoản Facebook đăng ký bằng số điện thoại không có email → người dùng được nhận diện bằng id Facebook.
const https = require('https');
const crypto = require('crypto');
const config = require('../config.json');
const { httpError } = require('./util');

const GRAPH = 'https://graph.facebook.com/v19.0';

function creds() {
  const f = config.facebook || {};
  return {
    id: process.env.FACEBOOK_APP_ID || f.appId || '',
    secret: process.env.FACEBOOK_APP_SECRET || f.appSecret || '',
  };
}
const enabled = () => !!(creds().id && creds().secret);

function authUrl(state, redirectUri) {
  const q = new URLSearchParams({ client_id: creds().id, redirect_uri: redirectUri, response_type: 'code', scope: 'email,public_profile', state });
  return 'https://www.facebook.com/v19.0/dialog/oauth?' + q.toString();
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        let j; try { j = JSON.parse(data); } catch { return reject(httpError(502, 'Facebook trả về dữ liệu lỗi')); }
        if (res.statusCode !== 200 || j.error) return reject(httpError(502, 'Facebook từ chối đăng nhập: ' + ((j.error && j.error.message) || res.statusCode)));
        resolve(j);
      });
    });
    req.on('timeout', () => req.destroy(httpError(504, 'Không kết nối được tới Facebook')));
    req.on('error', (e) => reject(e.status ? e : httpError(502, 'Không kết nối được tới Facebook')));
  });
}

// Đổi mã lấy thông tin người dùng. appsecret_proof chứng minh lời gọi đến từ máy chủ của ứng dụng này.
async function exchange(code, redirectUri) {
  const c = creds();
  const tok = await getJson(`${GRAPH}/oauth/access_token?` + new URLSearchParams({ client_id: c.id, client_secret: c.secret, redirect_uri: redirectUri, code }));
  if (!tok.access_token) throw httpError(502, 'Facebook không trả về thông tin tài khoản');
  const proof = crypto.createHmac('sha256', c.secret).update(tok.access_token).digest('hex');
  const me = await getJson(`${GRAPH}/me?` + new URLSearchParams({ fields: 'id,name,email,picture.type(large)', access_token: tok.access_token, appsecret_proof: proof }));
  if (!me.id) throw httpError(502, 'Facebook không trả về thông tin tài khoản');
  return {
    id: String(me.id), email: String(me.email || '').toLowerCase(), name: me.name || '',
    picture: (me.picture && me.picture.data && !me.picture.data.is_silhouette && me.picture.data.url) || '',
  };
}

const newState = () => crypto.randomBytes(16).toString('hex');

module.exports = { enabled, authUrl, exchange, newState };
