require('./lib/env');
const http = require('http');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');
const store = require('./lib/db');
const { db, save, UPLOAD_DIR } = store;
const { rid, json, send, readJson, readBody, httpError, slugify, str, cookies } = require('./lib/util');
const auth = require('./lib/auth');
const google = require('./lib/google');
const adminLib = require('./lib/admin');
adminLib.applySettings(); // giá, mã giảm giá… sửa trên trang quản trị đè lên config.json
const cd = require('./lib/carddata');
const { renderCard, renderNotice, templates, templateList, groups: templateGroups, DEFAULT_TEMPLATE } = require('./lib/render');
const banks = require('./lib/banks');
const ledLib = require('./lib/led');
const videoLib = require('./lib/video');
const { execFile } = require('child_process');
const Wd = require('./lib/wedding');
const Gs = require('./lib/guests');

store.onLoad(() => Wd.migrate()); // dữ liệu từ trước khi có sổ tay cưới → gắn vào đám cưới

// Sản phẩm bán: thiệp, màn LED, video dạm ngõ (đều gắn với một thiệp)
const PRODUCTS = {
  card: { name: 'Thiệp cưới online', price: () => config.price, coupons: true, prefix: 'TH', sub: (c) => c },
  led: { name: 'Màn hình LED tiệc cưới', price: () => config.ledPrice, coupons: false, prefix: 'LD', sub: (c) => c.led },
  video: { name: 'Video dạm ngõ', price: () => config.videoPrice, coupons: false, prefix: 'VD', sub: (c) => c.video },
};

const PORT = +process.env.PORT || config.port;
const BASE_URL = (process.env.BASE_URL || config.baseUrl).replace(/\/$/, '');
const PUBLIC_DIR = path.join(__dirname, 'public');
const DAY = 864e5;

// ---------------- router tối giản ----------------
const routes = [];
function route(method, pattern, handler) {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
  routes.push({ method, re, keys, handler });
}

// ---------------- tiện ích nghiệp vụ ----------------
function needUser(ctx) {
  if (!ctx.user) throw httpError(401, 'Bạn cần đăng nhập');
  return ctx.user;
}
function needAdmin(ctx) {
  if (!needUser(ctx).isAdmin) throw httpError(403, 'Chỉ quản trị viên');
}
// Thiệp của mình, hoặc thiệp trong đám cưới mà mình là thành viên (người yêu, bố mẹ cùng sửa)
function ownedCard(ctx, id) {
  const user = needUser(ctx);
  const card = db.cards.find((c) => c.id === id && (c.userId === user.id || (c.weddingId && Wd.isMember(Wd.get(c.weddingId), user))));
  if (!card) throw httpError(404, 'Không tìm thấy thiệp');
  return card;
}
function canManage(user, card) {
  return !!(user && card && (card.userId === user.id || (card.weddingId && Wd.isMember(Wd.get(card.weddingId), user))));
}
function uniqueSlug(wanted, exceptId) {
  let s = slugify(wanted) || 'thiep';
  if (s.length < 3) s += '-' + rid(4);
  const taken = (x) => db.cards.some((c) => c.slug === x && c.id !== exceptId) || RESERVED.has(x);
  if (!taken(s)) return s;
  for (;;) { const t = `${s}-${rid(4)}`; if (!taken(t)) return t; }
}
const RESERVED = new Set(['api', 'admin', 'demo', 'uploads', 'card', 'css', 'js', 'led', 'video', 'so-tay', 'tham-gia']);

function cardState(card) {
  const trialEndsAt = card.paid ? null : (card.publishedAt || card.createdAt) + config.trialDays * DAY;
  return {
    paid: !!card.paid,
    trialEndsAt,
    expired: !card.paid && card.status === 'published' && Date.now() > trialEndsAt,
    guestLimit: card.paid ? null : config.trialGuestLimit,
  };
}

function cardSummary(card) {
  const rs = db.rsvps.filter((r) => r.cardId === card.id);
  return {
    id: card.id, slug: card.slug, title: card.title, template: card.template, palette: card.palette,
    status: card.status, createdAt: card.createdAt, updatedAt: card.updatedAt, publishedAt: card.publishedAt || null,
    views: card.views || 0,
    guests: card.weddingId ? db.guests.filter((g) => g.weddingId === card.weddingId).length : 0,
    ownerId: card.userId,
    rsvpYes: rs.filter((r) => r.attending === 'yes').reduce((n, r) => n + r.count, 0),
    rsvpCount: rs.length,
    wishes: db.wishes.filter((w) => w.cardId === card.id).length,
    url: `${BASE_URL}/t/${card.slug}`,
    names: [card.data.groom.name, card.data.bride.name].filter(Boolean).join(' & '),
    date: card.data.date,
    cover: card.data.cover || card.data.photos[0] || '',
    ...cardState(card),
    led: { ...ledLib.state(card.led), url: `${BASE_URL}/led/${card.slug}` },
    video: { ...videoLib.state(card.video), url: `${BASE_URL}/video/${card.slug}` },
  };
}
function cardFull(card) {
  return { ...cardSummary(card), data: card.data, ledConfig: card.led || null, videoConfig: card.video || null };
}

function qrPay(amount, code) {
  const p = config.payment;
  return `https://img.vietqr.io/image/${p.bankBin}-${p.accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(code)}&accountName=${encodeURIComponent(p.accountName)}`;
}
function orderView(o) {
  const card = db.cards.find((c) => c.id === o.cardId);
  const product = o.product || 'card';
  return {
    product, productName: PRODUCTS[product].name,
    code: o.code, amount: o.amount, coupon: o.coupon || null, status: o.status, claimedAt: o.claimedAt || null,
    createdAt: o.createdAt, paidAt: o.paidAt || null,
    qr: qrPay(o.amount, o.code),
    bank: { name: config.payment.bankName, accountNo: config.payment.accountNo, accountName: config.payment.accountName },
    card: card ? { id: card.id, title: card.title, names: [card.data.groom.name, card.data.bride.name].filter(Boolean).join(' & ') } : null,
  };
}

// Giới hạn tần suất đơn giản theo IP (chống spam lời chúc/RSVP)
const hits = new Map();
function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) throw httpError(429, 'Bạn thao tác nhanh quá, thử lại sau ít phút nhé');
  arr.push(now);
  hits.set(key, arr);
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some((t) => now - t < 36e5)) hits.delete(k); }, 6e5).unref();

// ---------------- API: sổ tay cưới ----------------
require('./lib/planner-routes')({ route, needUser, rateLimit, cardSummary, BASE_URL });

// ---------------- API: tài khoản ----------------
route('POST', '/api/auth/register', async (req, res, ctx) => {
  rateLimit('reg:' + ctx.ip, 10, 36e5);
  const b = await readJson(req);
  const user = auth.createUser(b);
  auth.startSession(res, user.id);
  json(res, 200, { user: auth.publicUser(user) });
});
route('POST', '/api/auth/login', async (req, res, ctx) => {
  rateLimit('login:' + ctx.ip, 20, 9e5);
  const b = await readJson(req);
  const user = auth.verifyLogin(b.email, b.password);
  auth.startSession(res, user.id);
  json(res, 200, { user: auth.publicUser(user) });
});
route('POST', '/api/auth/logout', async (req, res) => {
  auth.endSession(req, res);
  json(res, 200, { ok: true });
});
route('GET', '/api/me', async (req, res, ctx) => {
  json(res, 200, { user: auth.publicUser(ctx.user) });
});

// ---------------- đăng nhập Google ----------------
const GOOGLE_CB = BASE_URL + '/auth/google/callback';
const safeNext = (n) => (typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') ? n : '/so-tay');
function redirect(res, to, cookiesToSet = []) {
  res.writeHead(302, { Location: to, 'Set-Cookie': cookiesToSet, 'Cache-Control': 'no-store' });
  res.end();
}
route('GET', '/auth/google', async (req, res, ctx) => {
  if (!google.enabled()) return redirect(res, '/dang-nhap?loi=' + encodeURIComponent('Chưa bật đăng nhập Google'));
  const state = google.newState();
  const val = encodeURIComponent(state + '|' + safeNext(ctx.query.get('next')));
  redirect(res, google.authUrl(state, GOOGLE_CB), [`gst=${val}; HttpOnly; Path=/auth; SameSite=Lax; Max-Age=600` + (BASE_URL.startsWith('https') ? '; Secure' : '')]);
});
route('GET', '/auth/google/callback', async (req, res, ctx) => {
  const clear = 'gst=; HttpOnly; Path=/auth; SameSite=Lax; Max-Age=0';
  const fail = (msg) => redirect(res, '/dang-nhap?loi=' + encodeURIComponent(msg), [clear]);
  const [state, next] = decodeURIComponent(cookies(req).gst || '').split('|');
  if (ctx.query.get('error')) return fail('Bạn đã huỷ đăng nhập Google');
  if (!state || state !== ctx.query.get('state')) return fail('Phiên đăng nhập Google không hợp lệ, thử lại nhé');
  try {
    rateLimit('google:' + ctx.ip, 30, 9e5);
    const g = await google.exchange(String(ctx.query.get('code') || ''), GOOGLE_CB);
    const user = auth.googleUser(g);
    auth.startSession(res, user.id);
    redirect(res, safeNext(next), [res.getHeader('Set-Cookie'), clear]);
  } catch (e) {
    if (e.status === 500 || !e.status) console.error('Google login lỗi:', e);
    fail(e.status && e.status !== 500 ? e.message : 'Không đăng nhập được bằng Google, thử lại sau nhé');
  }
});

route('GET', '/api/meta', async (req, res) => {
  json(res, 200, {
    brand: config.brand, tagline: config.tagline, price: config.price, trialDays: config.trialDays,
    trialGuestLimit: config.trialGuestLimit, banks, templates: templateList(), templateGroups, baseUrl: BASE_URL, support: config.support,
    ledPrice: config.ledPrice, led: ledLib.options(),
    videoPrice: config.videoPrice, video: videoLib.options(),
    googleLogin: google.enabled(),
  });
});

// ---------------- API: thiệp ----------------
route('GET', '/api/cards', async (req, res, ctx) => {
  const user = needUser(ctx);
  const w = Wd.ensure(user);
  // thiệp của mình + thiệp của các thành viên khác trong cùng đám cưới
  const list = db.cards.filter((c) => c.userId === user.id || c.weddingId === w.id).sort((a, b) => b.updatedAt - a.updatedAt).map(cardSummary);
  json(res, 200, { cards: list });
});

route('POST', '/api/cards', async (req, res, ctx) => {
  const user = needUser(ctx);
  if (db.cards.filter((c) => c.userId === user.id).length >= 30) throw httpError(400, 'Bạn đã có quá nhiều thiệp');
  const w = Wd.ensure(user);
  const b = await readJson(req);
  const tpl = templates[b.template] ? b.template : DEFAULT_TEMPLATE;
  const now = Date.now();
  const data = cd.defaults();
  Wd.prefill(data, w); // tên đôi, bố mẹ, ngày cưới đã nhập trong sổ tay
  data.events = [
    { name: 'Lễ Thành Hôn', date: w.date, time: '10:00', place: '', address: '', mapUrl: '' },
    { name: 'Tiệc Cưới', date: w.date, time: '18:00', place: '', address: '', mapUrl: '' },
  ];
  const card = {
    id: rid(12), userId: user.id, weddingId: w.id, slug: uniqueSlug('thiep-' + rid(6)),
    title: str(b.title, 60) || `Thiệp ${db.cards.filter((c) => c.userId === user.id).length + 1}`,
    template: tpl, palette: templates[tpl].palettes.find((p) => p.id === b.palette)?.id || templates[tpl].palettes[0].id,
    status: 'draft', paid: false, views: 0, data, createdAt: now, updatedAt: now,
  };
  db.cards.push(card);
  save();
  json(res, 200, { card: cardFull(card) });
});

route('GET', '/api/cards/:id', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id);
  json(res, 200, { card: cardFull(card) });
});

route('PUT', '/api/cards/:id', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id);
  const b = await readJson(req);
  if (b.title !== undefined) card.title = str(b.title, 60) || card.title;
  if (b.template && templates[b.template]) {
    if (b.template !== card.template) card.palette = templates[b.template].palettes[0].id;
    card.template = b.template;
  }
  if (!templates[card.template]) card.template = DEFAULT_TEMPLATE;
  if (b.palette && templates[card.template].palettes.some((p) => p.id === b.palette)) card.palette = b.palette;
  if (b.slug !== undefined && slugify(b.slug) !== card.slug) {
    const s = slugify(b.slug);
    if (s.length < 3) throw httpError(400, 'Đường dẫn cần ít nhất 3 ký tự (a-z, 0-9)');
    if (RESERVED.has(s) || db.cards.some((c) => c.slug === s && c.id !== card.id)) throw httpError(409, 'Đường dẫn này đã có người dùng');
    card.slug = s;
  }
  if (b.data) { card.data = cd.normalize(b.data); Wd.syncFromCard(card); }
  if (b.led) card.led = ledLib.normalize(b.led, card.led); // lần lưu đầu tiên bắt đầu dùng thử màn LED
  if (b.video) card.video = videoLib.normalize(b.video, card.video);
  card.updatedAt = Date.now();
  save();
  json(res, 200, { card: cardFull(card) });
});

route('POST', '/api/cards/:id/publish', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id);
  const b = await readJson(req);
  if (b.publish === false) card.status = 'draft';
  else {
    if (!card.data.groom.name || !card.data.bride.name || !card.data.date) throw httpError(400, 'Cần điền tên cô dâu, chú rể và ngày cưới trước khi phát hành');
    card.status = 'published';
    if (!card.publishedAt) card.publishedAt = Date.now();
  }
  card.updatedAt = Date.now();
  save();
  json(res, 200, { card: cardSummary(card) });
});

route('POST', '/api/cards/:id/duplicate', async (req, res, ctx) => {
  const src = ownedCard(ctx, ctx.params.id);
  const now = Date.now();
  const card = {
    ...JSON.parse(JSON.stringify(src)), id: rid(12), slug: uniqueSlug(src.slug + '-ban-sao'), title: (src.title + ' (bản sao)').slice(0, 60),
    status: 'draft', paid: false, paidAt: undefined, publishedAt: undefined, views: 0, createdAt: now, updatedAt: now,
  };
  if (card.led) card.led = { ...card.led, paid: false, paidAt: undefined, createdAt: now };
  if (card.video) card.video = { ...card.video, paid: false, paidAt: undefined, mp4: null, createdAt: now };
  db.cards.push(card);
  save();
  json(res, 200, { card: cardSummary(card) });
});

route('DELETE', '/api/cards/:id', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id);
  const keep = (x) => x.cardId !== card.id;
  db.cards = db.cards.filter((c) => c.id !== card.id);
  // khách mời thuộc đám cưới (sổ tay) nên giữ lại; chỉ xoá phản hồi gắn riêng với thiệp này
  db.rsvps = db.rsvps.filter(keep);
  db.wishes = db.wishes.filter(keep);
  save();
  json(res, 200, { ok: true });
});

// ---------------- API: khách mời ----------------
// Khách mời thuộc đám cưới; mỗi thiệp tạo link riêng cho từng khách trong danh sách chung.
// Thiệp chưa kích hoạt: chỉ N khách đầu có link mang tên riêng.
route('GET', '/api/cards/:id/guests', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id);
  const guests = Gs.list(card.weddingId).map((g) => ({
    ...g, url: `${BASE_URL}/t/${card.slug}/${g.code}`, locked: !Gs.personalAllowed(card, g),
  }));
  json(res, 200, { guests, limit: cardState(card).guestLimit });
});

route('POST', '/api/cards/:id/guests', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id);
  const b = await readJson(req, 1e6);
  const added = Gs.addNames(card.weddingId, b.names, { side: ['trai', 'gai'].includes(b.side) ? b.side : '', invited: true });
  json(res, 200, { added: added.length });
});

route('DELETE', '/api/guests/:gid', async (req, res, ctx) => {
  const g = db.guests.find((x) => x.id === ctx.params.gid);
  if (!g) throw httpError(404, 'Không tìm thấy khách');
  if (!Wd.isMember(Wd.get(g.weddingId), needUser(ctx))) throw httpError(404, 'Không tìm thấy khách');
  db.guests.splice(db.guests.indexOf(g), 1);
  save();
  json(res, 200, { ok: true });
});

// ---------------- API: phản hồi ----------------
route('GET', '/api/cards/:id/responses', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id);
  const rsvps = db.rsvps.filter((r) => r.cardId === card.id).sort((a, b) => b.createdAt - a.createdAt);
  const wishes = db.wishes.filter((w) => w.cardId === card.id).sort((a, b) => b.createdAt - a.createdAt);
  json(res, 200, { rsvps, wishes });
});

route('GET', '/api/cards/:id/rsvps.csv', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id);
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [['Thời gian', 'Tên', 'Tham dự', 'Số người', 'Khách nhà', 'Nhắn gửi'].map(q).join(',')];
  db.rsvps.filter((r) => r.cardId === card.id).forEach((r) => {
    rows.push([new Date(r.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }), r.name, r.attending === 'yes' ? 'Có' : 'Không', r.count, r.side === 'gai' ? 'Gái' : 'Trai', r.note].map(q).join(','));
  });
  send(res, 200, '﻿' + rows.join('\r\n'), {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="xac-nhan-${card.slug}.csv"`,
  });
});

route('POST', '/api/wishes/:wid/toggle', async (req, res, ctx) => {
  const w = db.wishes.find((x) => x.id === ctx.params.wid);
  if (!w) throw httpError(404, 'Không tìm thấy');
  ownedCard(ctx, w.cardId);
  w.hidden = !w.hidden;
  save();
  json(res, 200, { hidden: w.hidden });
});

// ---------------- API: tải ảnh / nhạc ----------------
const UPLOAD_TYPES = { 'image/jpeg': ['.jpg', 6e6], 'image/png': ['.png', 6e6], 'image/webp': ['.webp', 6e6], 'audio/mpeg': ['.mp3', 12e6] };
route('POST', '/api/upload', async (req, res, ctx) => {
  const user = needUser(ctx);
  rateLimit('up:' + user.id, 200, 36e5);
  const type = String(req.headers['content-type'] || '').split(';')[0].trim();
  const t = UPLOAD_TYPES[type];
  if (!t) throw httpError(415, 'Chỉ nhận ảnh JPG/PNG/WEBP hoặc nhạc MP3');
  const buf = await readBody(req, t[1]);
  if (!buf.length) throw httpError(400, 'Tệp rỗng');
  const name = `${user.id}-${rid(10)}${t[0]}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    // Vercel Blob: ổ đĩa serverless không giữ được tệp, nên lưu lên kho Blob (trả về link https)
    const { put } = require('@vercel/blob');
    const blob = await put(`uploads/${name}`, buf, { access: 'public', contentType: type, addRandomSuffix: false });
    return json(res, 200, { url: blob.url });
  }
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  json(res, 200, { url: `/uploads/${name}` });
});

// ---------------- API: thanh toán ----------------
route('POST', '/api/cards/:id/order', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id);
  const b = await readJson(req);
  const product = PRODUCTS[b.product] ? b.product : 'card';
  const P = PRODUCTS[product];
  const target = P.sub(card);
  if (!target) throw httpError(400, `Hãy tạo ${P.name.toLowerCase()} trước`);
  if (target.paid) throw httpError(400, `${P.name} này đã được kích hoạt`);
  const isThis = (o) => o.cardId === card.id && (o.product || 'card') === product && o.status === 'pending';
  let order = db.orders.find(isThis);
  if (!order) {
    order = { id: rid(12), code: P.prefix + rid(6).toUpperCase(), product, cardId: card.id, userId: card.userId, amount: P.price(), status: 'pending', createdAt: Date.now() };
    db.orders.push(order);
  }
  if (b.coupon !== undefined) {
    const code = str(b.coupon, 30).toUpperCase();
    if (code) {
      const off = config.coupons[code];
      if (!off) throw httpError(400, 'Mã giảm giá không đúng hoặc đã hết hạn');
      if (!P.coupons) throw httpError(400, 'Mã giảm giá chỉ áp dụng cho thiệp cưới');
      order.coupon = code;
      order.amount = Math.max(0, P.price() - off);
    } else {
      delete order.coupon;
      order.amount = P.price();
    }
  }
  save();
  json(res, 200, { order: orderView(order), payUrl: `${BASE_URL}/thanh-toan/${order.code}` });
});

// Trang "nhờ người thân thanh toán hộ" — ai có mã đơn cũng xem được
route('GET', '/api/orders/:code', async (req, res, ctx) => {
  const o = db.orders.find((x) => x.code === ctx.params.code);
  if (!o) throw httpError(404, 'Không tìm thấy đơn');
  json(res, 200, { order: orderView(o) });
});
route('POST', '/api/orders/:code/claim', async (req, res, ctx) => {
  rateLimit('claim:' + ctx.ip, 10, 36e5);
  const o = db.orders.find((x) => x.code === ctx.params.code);
  if (!o) throw httpError(404, 'Không tìm thấy đơn');
  if (o.status === 'pending') { o.claimedAt = Date.now(); save(); }
  json(res, 200, { order: orderView(o) });
});

// ---------------- API: quản trị ----------------
route('GET', '/api/admin/overview', async (req, res, ctx) => {
  needAdmin(ctx);
  const paid = db.orders.filter((o) => o.status === 'paid');
  // đơn chờ xác nhận lên đầu, rồi mới nhất trước
  const orders = db.orders.slice().sort((a, b) =>
    (b.status === 'pending') - (a.status === 'pending') || (b.claimedAt || b.createdAt) - (a.claimedAt || a.createdAt));
  json(res, 200, {
    stats: {
      users: db.users.length, cards: db.cards.length, published: db.cards.filter((c) => c.status === 'published').length,
      paid: paid.length, revenue: paid.reduce((n, o) => n + o.amount, 0), rsvps: db.rsvps.length,
    },
    orders: orders.slice(0, 300).map((o) => ({ ...orderView(o), id: o.id, email: (db.users.find((u) => u.id === o.userId) || {}).email })),
  });
});
route('POST', '/api/admin/orders/:id/confirm', async (req, res, ctx) => {
  needAdmin(ctx);
  const o = db.orders.find((x) => x.id === ctx.params.id);
  if (!o) throw httpError(404, 'Không tìm thấy đơn');
  o.status = 'paid';
  o.paidAt = Date.now();
  const card = db.cards.find((c) => c.id === o.cardId);
  const target = card && PRODUCTS[o.product || 'card'].sub(card);
  if (target) { target.paid = true; target.paidAt = o.paidAt; }
  adminLib.audit(ctx, 'Xác nhận đơn', o.code, `${o.amount}đ`);
  json(res, 200, { ok: true });
});
adminLib.routes({ route, needAdmin, PRODUCTS, orderView, cardSummary, BASE_URL });

// Thiệp bị quản trị viên gỡ: khách mở link thấy thông báo (chủ thiệp vẫn xem trước được)
const BLOCKED_HTML = () => renderNotice('Thiệp tạm thời không khả dụng', 'Thiệp này đang được đội ngũ hỗ trợ kiểm tra. Bạn vui lòng liên hệ cô dâu chú rể nhé.');

// ---------------- API công khai trên trang thiệp ----------------
function publicCard(slug) {
  const card = db.cards.find((c) => c.slug === slug);
  if (!card || card.blocked || card.status !== 'published' || cardState(card).expired) throw httpError(404, 'Thiệp không còn nhận phản hồi');
  return card;
}
route('POST', '/api/public/:slug/rsvp', async (req, res, ctx) => {
  const card = publicCard(ctx.params.slug);
  rateLimit(`rsvp:${ctx.ip}:${card.id}`, 8, 6e5);
  const b = await readJson(req, 4096);
  const name = str(b.name, 80);
  if (!name) throw httpError(400, 'Bạn nhập tên giúp mình nhé');
  const r = {
    name, attending: b.attending === 'no' ? 'no' : 'yes', count: Math.min(10, Math.max(1, parseInt(b.count, 10) || 1)),
    side: b.side === 'gai' ? 'gai' : 'trai', note: str(b.note, 200),
  };
  // ghi ngược vào danh sách khách của sổ tay: khớp link riêng → khớp tên → thêm khách mới
  const guest = Gs.recordRsvp(card.weddingId, typeof b.g === 'string' ? b.g : null, r);
  db.rsvps.push({ id: rid(12), cardId: card.id, guestId: guest ? guest.id : null, ...r, createdAt: Date.now() });
  save();
  json(res, 200, { ok: true });
});
route('POST', '/api/public/:slug/wish', async (req, res, ctx) => {
  const card = publicCard(ctx.params.slug);
  rateLimit(`wish:${ctx.ip}:${card.id}`, 6, 6e5);
  const b = await readJson(req, 4096);
  const name = str(b.name, 60);
  const message = str(b.message, 500);
  if (!name || !message) throw httpError(400, 'Bạn nhập tên và lời chúc nhé');
  db.wishes.push({ id: rid(12), cardId: card.id, name, message, hidden: false, createdAt: Date.now() });
  save();
  json(res, 200, { ok: true });
});

// ---------------- trang thiệp ----------------
function html(res, status, body) {
  send(res, status, body, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
}

async function showCard(req, res, ctx) {
  const card = db.cards.find((c) => c.slug === ctx.params.slug);
  if (!card) return html(res, 404, renderNotice('Không tìm thấy thiệp', 'Đường dẫn có thể đã bị đổi hoặc thiệp đã bị xoá.'));
  const isOwner = canManage(ctx.user, card) || !!(ctx.user && ctx.user.isAdmin); // quản trị viên xem trước được để kiểm tra
  const preview = isOwner && ctx.query.get('preview') === '1';
  const st = cardState(card);
  if (!preview) {
    if (card.blocked) return html(res, 403, BLOCKED_HTML());
    if (card.status !== 'published') return html(res, 404, renderNotice('Thiệp chưa được phát hành', 'Cô dâu chú rể đang hoàn thiện thiệp, bạn quay lại sau nhé.'));
    if (st.expired) return html(res, 403, renderNotice('Thiệp đang tạm khoá', 'Thời gian dùng thử của thiệp đã hết. Chủ thiệp cần kích hoạt để tiếp tục chia sẻ.'));
  }
  const code = ctx.params.code || ctx.query.get('g');
  const found = code && card.weddingId ? db.guests.find((g) => g.weddingId === card.weddingId && g.code === code) : null;
  const guest = found && Gs.personalAllowed(card, found) ? found : null; // quá giới hạn dùng thử → lời mời chung
  if (!preview && !isOwner) {
    card.views = (card.views || 0) + 1;
    if (guest) { guest.opens = (guest.opens || 0) + 1; guest.openedAt = guest.openedAt || Date.now(); }
    save();
  }
  const wishes = db.wishes.filter((w) => w.cardId === card.id && !w.hidden).sort((a, b) => b.createdAt - a.createdAt).slice(0, 200);
  html(res, 200, renderCard(card, { guest, wishes, preview, trial: !st.paid, baseUrl: BASE_URL }));
}
route('GET', '/t/:slug', showCard);
route('GET', '/t/:slug/:code', showCard);

route('GET', '/demo/:tpl', async (req, res, ctx) => {
  const tpl = templates[ctx.params.tpl];
  if (!tpl) return serveStatic(req, res, '/demo/' + ctx.params.tpl); // ảnh mẫu trong public/demo
  // mẫu có thể kèm ảnh xem thử riêng: demo: { cover: '/demo/<id>-1.jpg', photos: [...] }
  const card = { slug: 'demo', template: tpl.id, palette: ctx.query.get('palette') || '', data: cd.normalize({ ...cd.sample(), ...tpl.demo }) };
  const guest = { name: 'Anh Hoàng & Người thương', code: 'demo' };
  const wishes = [
    { name: 'Lan Anh', message: 'Chúc hai bạn trăm năm hạnh phúc, sớm có tin vui nhé!' },
    { name: 'Team Marketing', message: 'Mãi yêu thương và luôn cười thật tươi như hôm nay ❤' },
  ];
  // ?preview=1: bỏ màn mở thiệp, hiện thẳng trang bìa (ảnh xem trước trong bộ sưu tập trang chủ)
  const preview = ctx.query.get('preview') === '1';
  html(res, 200, renderCard(card, { guest, wishes, demo: true, preview, trial: false, baseUrl: BASE_URL }));
});

// ---------------- màn hình LED ----------------
route('GET', '/led/:slug', async (req, res, ctx) => {
  const slug = ctx.params.slug;
  if (slug.includes('.')) return serveStatic(req, res, '/led/' + slug); // led.js, led.css
  if (slug === 'demo') {
    const q = Object.fromEntries(ctx.query);
    const led = ledLib.normalize({ ...q, kicker: 'Lễ Thành Hôn', message: ledLib.defaults().message });
    const card = { data: cd.normalize(cd.sample()) };
    return html(res, 200, ledLib.renderLed(card, led, { demo: true, preview: q.preview === '1' }));
  }
  const card = db.cards.find((c) => c.slug === slug);
  const isOwner = canManage(ctx.user, card);
  if (!card || !card.led) return html(res, 404, renderNotice('Không tìm thấy màn hình LED', 'Đường dẫn có thể đã bị đổi. Hãy hỏi lại cô dâu chú rể nhé.'));
  if (card.blocked && !isOwner) return html(res, 403, BLOCKED_HTML());
  const st = ledLib.state(card.led);
  if (st.expired && !isOwner) return html(res, 403, renderNotice('Màn hình LED đang tạm khoá', 'Thời gian dùng thử đã hết. Chủ thiệp cần kích hoạt để tiếp tục trình chiếu.'));
  html(res, 200, ledLib.renderLed(card, card.led, { preview: isOwner && ctx.query.get('preview') === '1', trial: !st.paid }));
});

// ---------------- video dạm ngõ ----------------
route('GET', '/video/:slug', async (req, res, ctx) => {
  const slug = ctx.params.slug;
  if (slug.includes('.')) return serveStatic(req, res, '/video/' + slug); // engine.js
  if (slug === 'demo') {
    const q = Object.fromEntries(ctx.query);
    const card = { data: cd.normalize(cd.sample()) };
    const v = videoLib.normalize({ template: q.template, photoBg: q.photo === '1', event: { kind: 'Lễ Dạm Ngõ', date: '2026-11-22', time: '09:00', place: 'Tư gia nhà gái' } });
    return html(res, 200, videoLib.renderVideo(card, v, { preview: q.preview === '1' }));
  }
  const card = db.cards.find((c) => c.slug === slug);
  const isOwner = canManage(ctx.user, card);
  if (!card || !card.video) return html(res, 404, renderNotice('Không tìm thấy video', 'Đường dẫn có thể đã bị đổi.'));
  if (card.blocked && !isOwner) return html(res, 403, BLOCKED_HTML());
  const st = videoLib.state(card.video);
  if (st.expired && !isOwner) return html(res, 403, renderNotice('Video đang tạm khoá', 'Thời gian dùng thử đã hết. Chủ thiệp cần kích hoạt để tiếp tục trình chiếu.'));
  html(res, 200, videoLib.renderVideo(card, card.video, { preview: isOwner && ctx.query.get('preview') === '1', trial: !st.paid }));
});

route('POST', '/api/cards/:id/video/reset', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id);
  if (!card.video) throw httpError(400, 'Hãy tạo video trước');
  card.video.scenes = videoLib.defaultScenes();
  card.updatedAt = Date.now();
  save();
  json(res, 200, { card: cardFull(card) });
});

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    execFile(config.ffmpegPath || 'ffmpeg', args, { timeout: 10 * 60e3, windowsHide: true, maxBuffer: 8e6 }, (err, _out, stderr) => {
      if (err) { console.error('ffmpeg lỗi:', String(stderr).slice(-1500)); reject(httpError(500, 'Chuyển video thất bại')); }
      else resolve();
    });
  });
}

// Nhận bản quay WebM từ trình duyệt → MP4 Full HD H.264 (TV, USB, Zalo đều mở được)
let exporting = 0;
route('POST', '/api/cards/:id/video/export', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id);
  if (!card.video) throw httpError(400, 'Hãy tạo video trước');
  if (!card.video.paid) throw httpError(402, 'Kích hoạt video để tải bản MP4 Full HD');
  rateLimit('export:' + card.userId, 10, 36e5);
  if (exporting >= 2) throw httpError(503, 'Máy chủ đang bận xuất video khác, thử lại sau 1 phút nhé');
  const type = String(req.headers['content-type'] || '').split(';')[0].trim();
  const EXT = { 'video/webm': '.webm', 'video/mp4': '.mp4', 'video/h264': '.h264' }; // h264 thô từ WebCodecs, 30 khung/giây
  if (!EXT[type]) throw httpError(415, 'Định dạng bản quay không hợp lệ');
  const loops = Math.min(30, Math.max(1, parseInt(ctx.query.get('loops'), 10) || 1));
  const buf = await readBody(req, 200e6);
  if (buf.length < 1000) throw httpError(400, 'Bản quay rỗng');
  exporting++;
  const tmp = path.join(UPLOAD_DIR, `tmp-${rid(10)}${EXT[type]}`);
  const name = `${card.userId}-video-${rid(10)}.mp4`;
  try {
    fs.writeFileSync(tmp, buf);
    const args = ['-y', '-hide_banner', '-loglevel', 'error'];
    if (loops > 1) args.push('-stream_loop', String(loops - 1));
    if (type === 'video/h264') args.push('-f', 'h264', '-framerate', '30');
    args.push('-i', tmp);
    const music = card.data.music && /^\/uploads\/[\w.-]+\.mp3$/.test(card.data.music) ? path.join(UPLOAD_DIR, path.basename(card.data.music)) : null;
    if (music && fs.existsSync(music)) args.push('-stream_loop', '-1', '-i', music);
    args.push('-map', '0:v:0', '-vf', 'scale=1920:1080:flags=lanczos,fps=30,format=yuv420p',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-profile:v', 'high', '-level', '4.1', '-movflags', '+faststart');
    if (music && fs.existsSync(music)) args.push('-map', '1:a:0', '-c:a', 'aac', '-b:a', '160k', '-shortest');
    else args.push('-an');
    // ghi ra file tạm rồi mới đổi tên: máy chủ tắt giữa chừng không để lại MP4 hỏng
    const part = path.join(UPLOAD_DIR, `tmp-${name}`);
    args.push('-f', 'mp4', part);
    try {
      await runFfmpeg(args);
      fs.renameSync(part, path.join(UPLOAD_DIR, name));
    } catch (e) {
      fs.rmSync(part, { force: true });
      throw e;
    }
  } finally {
    exporting--;
    fs.rm(tmp, { force: true }, () => {});
  }
  const old = card.video.mp4;
  if (old && /^\/uploads\/[\w.-]+\.mp4$/.test(old)) fs.rmSync(path.join(UPLOAD_DIR, path.basename(old)), { force: true });
  card.video.mp4 = `/uploads/${name}`;
  save();
  json(res, 200, { url: card.video.mp4 });
});

// ---------------- trang tĩnh ----------------
const PAGES = {
  '/': 'index.html', '/dang-nhap': 'auth.html', '/thiep-cua-toi': 'dashboard.html', '/quan-tri': 'admin.html',
  '/man-hinh-led-dam-cuoi': 'led-landing.html',
  '/video-dam-ngo': 'video-landing.html',
  '/so-tay': 'planner.html',
  '/so-tay-cuoi': 'planner-landing.html',
};
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
};

function serveFile(res, file, cache) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return html(res, 404, renderNotice('Không tìm thấy trang', 'Đường dẫn không tồn tại.'));
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': cache,
      'X-Content-Type-Options': 'nosniff',
    });
    fs.createReadStream(file).pipe(res);
  });
}

function serveStatic(req, res, pathname) {
  if (PAGES[pathname]) return serveFile(res, path.join(PUBLIC_DIR, PAGES[pathname]), 'no-cache');
  if (pathname === '/favicon.ico') return serveFile(res, path.join(PUBLIC_DIR, 'favicon.svg'), 'public, max-age=86400');
  if (/^\/sua\/[\w-]+$/.test(pathname)) return serveFile(res, path.join(PUBLIC_DIR, 'editor.html'), 'no-cache');
  if (/^\/sua-led\/[\w-]+$/.test(pathname)) return serveFile(res, path.join(PUBLIC_DIR, 'led-editor.html'), 'no-cache');
  if (/^\/tham-gia\/[\w-]+$/.test(pathname)) return serveFile(res, path.join(PUBLIC_DIR, 'join.html'), 'no-cache');
  if (/^\/sua-video\/[\w-]+$/.test(pathname)) return serveFile(res, path.join(PUBLIC_DIR, 'video-editor.html'), 'no-cache');
  if (pathname === '/js/lunar.js') return serveFile(res, path.join(__dirname, 'lib', 'lunar.js'), 'no-cache');
  if (/^\/thanh-toan\/[\w-]+$/.test(pathname)) return serveFile(res, path.join(PUBLIC_DIR, 'pay.html'), 'no-cache');
  if (/^\/uploads\/[\w.-]+$/.test(pathname)) return serveFile(res, path.join(UPLOAD_DIR, path.basename(pathname)), 'public, max-age=31536000, immutable');
  const file = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return html(res, 404, renderNotice('Không tìm thấy trang', ''));
  // JS/CSS đổi theo phiên bản code: bắt trình duyệt kiểm tra lại, tránh khách chạy bản cũ
  serveFile(res, file, /\.(jpg|png|webp|svg)$/.test(file) ? 'public, max-age=86400' : 'no-cache');
}

// ---------------- máy chủ ----------------
const server = http.createServer(async (req, res) => {
  restoreUrl(req); // Vercel có thể gửi request thẳng vào server này, bỏ qua `handler` bên dưới
  // Chế độ Redis: nạp dữ liệu mới nhất, và ghi lại trước khi trả lời (res.end chờ ghi xong).
  if (store.remote) {
    let finish;
    try { finish = await store.begin(req.method); } catch (e) {
      console.error(e);
      return json(res, 503, { error: 'Không kết nối được cơ sở dữ liệu, vui lòng thử lại' });
    }
    const end = res.end.bind(res);
    let ending = false;
    res.end = (...a) => {
      if (ending) return res;
      ending = true;
      finish().catch((e) => console.error('Lỗi ghi dữ liệu:', e)).finally(() => end(...a));
      return res;
    };
  }
  let url;
  try { url = new URL(req.url, 'http://x'); } catch { return json(res, 400, { error: 'URL lỗi' }); }
  const pathname = decodeURIComponent(url.pathname);
  const ctx = {
    query: url.searchParams,
    user: auth.currentUser(req),
    ip: (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress,
  };
  try {
    for (const r of routes) {
      if (r.method !== req.method) continue;
      const m = r.re.exec(pathname);
      if (!m) continue;
      ctx.params = Object.fromEntries(r.keys.map((k, i) => [k, m[i + 1]]));
      return await r.handler(req, res, ctx);
    }
    if (pathname.startsWith('/api/')) { console.warn('API 404:', req.method, req.url); throw httpError(404, 'Không có API này'); }
    if (req.method !== 'GET' && req.method !== 'HEAD') throw httpError(405, 'Không hỗ trợ');
    serveStatic(req, res, pathname);
  } catch (e) {
    const status = e.status || 500;
    if (status === 500) console.error(e);
    if (res.headersSent) return res.end();
    json(res, status, { error: status === 500 ? 'Lỗi máy chủ, vui lòng thử lại' : e.message });
  }
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`${config.brand} đang chạy tại ${BASE_URL} (cổng ${PORT})`));
}
// Xuất dạng hàm (req, res) để chạy được cả trên Vercel; vẫn có listen/close cho chạy thường và kiểm thử.
// Trên Vercel, mọi đường dẫn được rewrite vào một hàm; đường dẫn gốc được gửi kèm ở ?__p=
// (xem vercel.json), Vercel còn tự thêm ?path=. Khôi phục lại req.url để bộ định tuyến khớp đúng.
function restoreUrl(req) {
  if (!req.url || !req.url.includes('__p=')) return;
  const u = new URL(req.url, 'http://x');
  let p = u.searchParams.get('__p') || '/';
  if (!p.startsWith('/')) p = '/' + p;
  u.searchParams.delete('__p');
  u.searchParams.delete('path');
  const q = u.searchParams.toString();
  req.url = p + (q ? '?' + q : '');
}
const handler = (req, res) => server.emit('request', req, res);
handler.server = server;
handler.listen = (...a) => server.listen(...a);
handler.close = (...a) => server.close(...a);
handler.address = () => server.address();
module.exports = handler;
