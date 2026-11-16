const crypto = require('crypto');
const { db, save } = require('./db');
const { rid, cookies, httpError, str } = require('./util');
const config = require('../config.json');

const SESSION_DAYS = 30;
const secure = String(process.env.BASE_URL || config.baseUrl).startsWith('https');

function hash(pw, salt) {
  return crypto.scryptSync(pw, salt, 64).toString('hex');
}

function createUser({ email, password, name }) {
  email = str(email, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw httpError(400, 'Email không hợp lệ');
  if (String(password || '').length < 6) throw httpError(400, 'Mật khẩu cần ít nhất 6 ký tự');
  if (db.users.some((u) => u.email === email)) throw httpError(409, 'Email này đã có tài khoản');
  const salt = crypto.randomBytes(16).toString('hex');
  const user = {
    id: rid(12),
    email,
    name: str(name, 80) || email.split('@')[0],
    salt,
    passHash: hash(String(password), salt),
    createdAt: Date.now(),
  };
  db.users.push(user);
  save();
  return user;
}

function verifyLogin(email, password) {
  const user = db.users.find((u) => u.email === str(email, 120).toLowerCase());
  if (!user) throw httpError(401, 'Sai email hoặc mật khẩu');
  if (user.disabled) throw httpError(403, 'Tài khoản này đã bị khoá. Liên hệ hỗ trợ nếu có nhầm lẫn.');
  if (!user.passHash) throw httpError(401, `Tài khoản này đăng nhập bằng ${user.googleId ? 'Google' : 'Facebook'} — bấm "Tiếp tục với ${user.googleId ? 'Google' : 'Facebook'}" nhé`);
  const a = Buffer.from(hash(String(password || ''), user.salt), 'hex');
  const b = Buffer.from(user.passHash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw httpError(401, 'Sai email hoặc mật khẩu');
  return user;
}

function cookie(value, maxAge) {
  return `sid=${value}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}` + (secure ? '; Secure' : '');
}

// via: 'google' khi phiên mở bằng đăng nhập Google (email đã được Google xác minh) — quyền quản trị chỉ cấp cho phiên loại này
function startSession(res, userId, via) {
  const token = crypto.randomBytes(32).toString('hex');
  // dọn phiên hết hạn (trước đây chỉ xoá khi chính cookie đó quay lại → phiên bỏ quên nằm mãi trong dữ liệu)
  const now = Date.now();
  for (const [t, x] of Object.entries(db.sessions)) if (x.exp < now) delete db.sessions[t];
  db.sessions[token] = { userId, exp: Date.now() + SESSION_DAYS * 864e5, ...(via ? { via } : {}) };
  save();
  res.setHeader('Set-Cookie', cookie(token, SESSION_DAYS * 86400));
}

function currentUser(req) {
  const token = cookies(req).sid;
  const s = token && db.sessions[token];
  if (!s) return null;
  if (s.exp < Date.now()) { delete db.sessions[token]; save(); return null; }
  const u = db.users.find((x) => x.id === s.userId);
  if (!u || u.disabled) return null;
  if (!u.lastSeenAt || Date.now() - u.lastSeenAt > 36e5) { u.lastSeenAt = Date.now(); save(); }
  return u;
}

// Phiên hiện tại có phải mở bằng Google không
function viaGoogle(req) {
  const s = db.sessions[cookies(req).sid];
  return !!(s && s.via === 'google' && s.exp > Date.now());
}

// Đăng nhập Google: khớp theo googleId → theo email (gộp với tài khoản email cũ) → tạo mới
function googleUser(g) {
  let user = db.users.find((u) => u.googleId === g.sub) || db.users.find((u) => u.email === g.email);
  if (user) {
    if (user.disabled) throw httpError(403, 'Tài khoản này đã bị khoá. Liên hệ hỗ trợ nếu có nhầm lẫn.');
    // Lần đầu gộp tài khoản email + mật khẩu vào Google: email lúc đăng ký chưa hề được xác minh, nên mật khẩu đó có thể
    // do người khác đặt trước (đăng ký hộ email của nạn nhân rồi chờ họ đăng nhập Google). Chủ thật của email là người
    // vừa qua Google → bỏ mật khẩu cũ và đăng xuất mọi phiên cũ; từ nay tài khoản đăng nhập bằng Google.
    if (!user.googleId && user.passHash) { user.passHash = null; user.salt = null; killSessions(user.id); }
    user.googleId = g.sub;
    if (g.picture) user.avatar = g.picture;
    if (!user.name && g.name) user.name = str(g.name, 80);
  } else {
    user = {
      id: rid(12), email: g.email, name: str(g.name, 80) || g.email.split('@')[0],
      salt: null, passHash: null, googleId: g.sub, avatar: g.picture || '',
      createdAt: Date.now(),
    };
    db.users.push(user);
  }
  save();
  return user;
}

// Đăng nhập Facebook: khớp theo facebookId → theo email Facebook trả về (đã được Facebook xác minh) → tạo mới.
// Tài khoản Facebook đăng ký bằng số điện thoại không có email → đặt email giả duy nhất (không đăng nhập bằng mật khẩu được)
// để các chỗ nhận diện người dùng theo email (trang quản trị) vẫn phân biệt được.
function facebookUser(f) {
  let user = db.users.find((u) => u.facebookId === f.id) || (f.email ? db.users.find((u) => u.email === f.email) : null);
  if (user) {
    if (user.disabled) throw httpError(403, 'Tài khoản này đã bị khoá. Liên hệ hỗ trợ nếu có nhầm lẫn.');
    // như Google: lần đầu gộp vào tài khoản email + mật khẩu chưa từng xác minh email → bỏ mật khẩu cũ, đăng xuất phiên cũ
    if (!user.facebookId && !user.googleId && user.passHash) { user.passHash = null; user.salt = null; killSessions(user.id); }
    user.facebookId = f.id;
    if (f.picture && !user.avatar) user.avatar = f.picture;
    if (!user.name && f.name) user.name = str(f.name, 80);
  } else {
    user = {
      id: rid(12), email: f.email || `fb.${f.id}@khong-co-email.facebook`, name: str(f.name, 80) || 'Bạn',
      salt: null, passHash: null, facebookId: f.id, avatar: f.picture || '',
      createdAt: Date.now(),
    };
    db.users.push(user);
  }
  save();
  return user;
}

function setPassword(user, password) {
  if (String(password || '').length < 6) throw httpError(400, 'Mật khẩu cần ít nhất 6 ký tự');
  user.salt = crypto.randomBytes(16).toString('hex');
  user.passHash = hash(String(password), user.salt);
  save();
}

function killSessions(userId) {
  for (const [t, s] of Object.entries(db.sessions)) if (s.userId === userId) delete db.sessions[t];
  save();
}

function endSession(req, res) {
  const token = cookies(req).sid;
  if (token && db.sessions[token]) { delete db.sessions[token]; save(); }
  res.setHeader('Set-Cookie', cookie('', 0));
}

function publicUser(u) {
  return u && { id: u.id, email: /@khong-co-email\.facebook$/.test(u.email) ? '' : u.email, name: u.name, avatar: u.avatar || '', google: !!u.googleId, facebook: !!u.facebookId };
}

module.exports = { viaGoogle, createUser, verifyLogin, startSession, currentUser, endSession, publicUser, googleUser, facebookUser, setPassword, killSessions, cookie };
