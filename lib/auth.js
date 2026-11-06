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
    isAdmin: db.users.length === 0, // tài khoản đầu tiên là quản trị
    createdAt: Date.now(),
  };
  db.users.push(user);
  save();
  return user;
}

function verifyLogin(email, password) {
  const user = db.users.find((u) => u.email === str(email, 120).toLowerCase());
  if (!user) throw httpError(401, 'Sai email hoặc mật khẩu');
  const a = Buffer.from(hash(String(password || ''), user.salt), 'hex');
  const b = Buffer.from(user.passHash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw httpError(401, 'Sai email hoặc mật khẩu');
  return user;
}

function cookie(value, maxAge) {
  return `sid=${value}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}` + (secure ? '; Secure' : '');
}

function startSession(res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.sessions[token] = { userId, exp: Date.now() + SESSION_DAYS * 864e5 };
  save();
  res.setHeader('Set-Cookie', cookie(token, SESSION_DAYS * 86400));
}

function currentUser(req) {
  const token = cookies(req).sid;
  const s = token && db.sessions[token];
  if (!s) return null;
  if (s.exp < Date.now()) { delete db.sessions[token]; save(); return null; }
  return db.users.find((u) => u.id === s.userId) || null;
}

function endSession(req, res) {
  const token = cookies(req).sid;
  if (token && db.sessions[token]) { delete db.sessions[token]; save(); }
  res.setHeader('Set-Cookie', cookie('', 0));
}

function publicUser(u) {
  return u && { id: u.id, email: u.email, name: u.name, isAdmin: !!u.isAdmin };
}

module.exports = { createUser, verifyLogin, startSession, currentUser, endSession, publicUser };
