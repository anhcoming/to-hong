// Đăng nhập trang quản trị (/admin) bằng một mật khẩu riêng, tách khỏi tài khoản người dùng.
// Mật khẩu đặt ở biến môi trường ADMIN_PASSWORD (file .env khi chạy máy, Environment Variables trên Vercel);
// chưa đặt thì không ai vào được trang quản trị.
// Phiên quản trị là cookie ký HMAC (hạn + chữ ký), không lưu gì phía máy chủ nên chạy được trên Vercel.
const crypto = require('crypto');
const config = require('../config.json');
const { cookies } = require('./util');

const NAME = 'cn_admin';
const HOURS = 12;
const secure = String(process.env.BASE_URL || config.baseUrl).startsWith('https');

const password = () => process.env.ADMIN_PASSWORD || '';
const enabled = () => !!password();
// khoá ký suy ra từ mật khẩu: đổi mật khẩu là mọi phiên cũ hết hiệu lực
const key = () => crypto.createHash('sha256').update('cuoi-nha-admin:' + password()).digest();
const sign = (exp) => crypto.createHmac('sha256', key()).update(String(exp)).digest('base64url');
const same = (a, b) => {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
};

function check(req) {
  if (!enabled()) return false;
  const v = cookies(req)[NAME] || '';
  const [exp, sig] = v.split('.');
  return !!sig && +exp > Date.now() && same(sig, sign(exp));
}
function verify(pw) {
  return enabled() && same(pw, password());
}
function cookie(value, maxAge) {
  return `${NAME}=${value}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${maxAge}` + (secure ? '; Secure' : '');
}
function login(res) {
  const exp = Date.now() + HOURS * 36e5;
  res.setHeader('Set-Cookie', cookie(`${exp}.${sign(exp)}`, HOURS * 3600));
}
function logout(res) {
  res.setHeader('Set-Cookie', cookie('', 0));
}

module.exports = { enabled, check, verify, login, logout };
