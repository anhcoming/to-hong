// Đăng nhập trang quản trị (/admin) bằng một mật khẩu riêng, tách khỏi tài khoản người dùng.
// Mật khẩu đặt ở biến môi trường ADMIN_PASSWORD (file .env khi chạy máy, Environment Variables trên Vercel);
// chưa đặt thì không ai vào được trang quản trị.
// Phiên quản trị là cookie ký HMAC (hạn + chữ ký), không lưu gì phía máy chủ nên chạy được trên Vercel.
const crypto = require('crypto');
const config = require('../config.json');
const { cookies } = require('./util');

// Chỉ định người quản trị theo email (biến môi trường ADMIN_EMAILS, cách nhau bằng dấu phẩy): khi đã đặt thì CHỈ tài khoản
// có email đó, đăng nhập bằng Google, mới vào được /admin — mật khẩu quản trị bị tắt. Đăng ký bằng email + mật khẩu không
// xác minh chủ hộp thư nên không được tính; phải là phiên Google.
const emails = () => String(process.env.ADMIN_EMAILS || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean);
const byEmail = () => emails().length > 0;
const isAdminUser = (user, viaGoogle) => !!(user && viaGoogle && emails().includes(String(user.email || '').toLowerCase()));

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

module.exports = { byEmail, isAdminUser, enabled, check, verify, login, logout };
