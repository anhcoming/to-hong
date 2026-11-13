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
const maplink = require('./lib/maplink');
const adminLib = require('./lib/admin');
const adminAuth = require('./lib/adminauth');
adminLib.applySettings(); // giá, mã giảm giá… sửa trên trang quản trị đè lên config.json
const cd = require('./lib/carddata');
const { renderCard, renderNotice, templates, templateList, groups: templateGroups, DEFAULT_TEMPLATE } = require('./lib/render');
const banks = require('./lib/banks');
const ledLib = require('./lib/led');
const videoLib = require('./lib/video');
const { execFile } = require('child_process');
const Wd = require('./lib/wedding');
const Gs = require('./lib/guests');
const stats = require('./lib/stats');

store.onLoad(() => Wd.migrate()); // dữ liệu từ trước khi có sổ tay cưới → gắn vào đám cưới

// Sản phẩm bán: thiệp, màn LED, video dạm ngõ (đều gắn với một thiệp) và combo "Trọn bộ" = cả ba.
// Combo cho thiệp đã kích hoạt = nâng cấp, chỉ trả phần chênh (giá combo − giá thiệp).
const PRODUCTS = {
  card: { name: 'Thiệp cưới online', price: () => cardPrice(), coupons: true, prefix: 'TH', sub: (c) => c },
  led: { name: 'Màn hình LED tiệc cưới', price: () => config.ledPrice, coupons: false, prefix: 'LD', sub: (c) => c.led },
  video: { name: 'Video cưới', price: () => config.videoPrice, coupons: false, prefix: 'VD', sub: (c) => c.video },
  combo: {
    name: 'Trọn bộ ngày cưới', coupons: false, prefix: 'CB',
    price: (c) => (c && c.paid ? Math.max(0, comboPrice() - cardPrice()) : comboPrice()),
    sub: (c) => ({ paid: !!(c.paid && c.led && c.led.paid && c.video && c.video.paid) }),
  },
};
// Combo kích hoạt cả ba; màn LED / video chưa tạo thì tạo sẵn bản mặc định (đã trả tiền) để mở là dùng ngay
function activateCombo(card, at) {
  card.paid = true; card.paidAt = card.paidAt || at;
  if (!card.led) card.led = ledLib.normalize({}, {});
  if (!card.video) card.video = videoLib.normalize({}, {});
  for (const x of [card.led, card.video]) { x.paid = true; x.paidAt = x.paidAt || at; }
}

// Giá thiệp: `price` là giá mở bán đang thu, `listPrice` là giá gốc (hiện gạch ngang) tới hết ngày `promoEndsAt`
// (giờ Việt Nam). Qua ngày đó web tự thu theo giá gốc — không phải sửa gì.
const promoEnd = () => (/^\d{4}-\d{2}-\d{2}$/.test(config.promoEndsAt || '') ? Date.parse(`${config.promoEndsAt}T23:59:59.999+07:00`) : 0);
const promoActive = () => config.listPrice > config.price && Date.now() <= promoEnd();
// Combo theo cùng hạn: `comboPrice` giá mở bán, `comboListPrice` giá gốc.
const promoOver = () => !!promoEnd() && Date.now() > promoEnd();
const cardPrice = () => (config.listPrice > config.price && promoOver() ? config.listPrice : config.price);
const comboPrice = () => (config.comboListPrice > config.comboPrice && promoOver() ? config.comboListPrice : config.comboPrice);
const comboPromo = () => config.comboListPrice > config.comboPrice && !!promoEnd() && !promoOver();
const promoInfo = () => (promoActive() ? { listPrice: config.listPrice, promoEndsAt: promoEnd() } : { listPrice: null, promoEndsAt: null });

const PORT = +process.env.PORT || config.port;
const BASE_URL = (process.env.BASE_URL || config.baseUrl).replace(/\/$/, '');
const PUBLIC_DIR = path.join(__dirname, 'public');
const DAY = 864e5;

// ---------------- router tối giản ----------------
const routes = [];
// opts.noDb: route không đọc/ghi dữ liệu (vd. /api/meta) → không chờ kho, trang vẫn chạy khi kho trục trặc
function route(method, pattern, handler, opts = {}) {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
  routes.push({ method, re, keys, handler, noDb: !!opts.noDb });
}

// ---------------- tiện ích nghiệp vụ ----------------
function needUser(ctx) {
  if (!ctx.user) throw httpError(401, 'Bạn cần đăng nhập');
  return ctx.user;
}
// Quản trị không gắn với tài khoản người dùng: vào bằng mật khẩu riêng ở /admin (lib/adminauth.js)
function needAdmin(ctx) {
  if (!ctx.admin) throw httpError(403, 'Cần đăng nhập trang quản trị');
}
// ----- bản nháp của khách chưa đăng nhập -----
// Bấm "Dùng mẫu" khi chưa có tài khoản: thiệp nháp gắn với cookie ẩn danh `gid` (userId = null, guestId = gid).
// Khách sửa chữ, đổi mẫu, xem trước thoải mái; tải ảnh, khách mời, phát hành… vẫn cần đăng nhập (401).
// Đăng nhập xong thì thiệp nháp chuyển về tài khoản (claimGuestCards).
const GUEST_DAYS = 30;
const guestCookie = (v, maxAge) => `gid=${v}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}` + (BASE_URL.startsWith('https') ? '; Secure' : '');
const guestId = (req) => { const g = cookies(req).gid; return /^[a-f0-9]{32}$/.test(g || '') ? g : null; };
const guestOwns = (ctx, card) => !!(card && card.guestId && !card.userId && ctx.guest && card.guestId === ctx.guest);
function claimGuestCards(req, res, user) {
  const gid = guestId(req);
  if (!gid) return;
  const mine = db.cards.filter((c) => c.guestId === gid && !c.userId);
  if (mine.length) {
    const w = Wd.ensure(user);
    // sổ tay còn trống (tài khoản mới) → lấy tên đôi, ngày cưới từ thiệp nháp; đã có thông tin thì giữ nguyên sổ tay
    const fresh = !w.couple.groom.name && !w.couple.bride.name && !db.cards.some((c) => c.weddingId === w.id);
    mine.forEach((c) => { c.userId = user.id; c.weddingId = w.id; delete c.guestId; c.updatedAt = Date.now(); });
    if (fresh) Wd.syncFromCard(mine[0], true);
    save();
  }
  const prev = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', [].concat(prev || [], guestCookie('', 0)));
}
// Thiệp của mình, hoặc thiệp trong đám cưới mà mình là thành viên (người yêu, bố mẹ cùng sửa).
// opts.guest: cho phép cả khách chưa đăng nhập đang giữ thiệp nháp này.
function ownedCard(ctx, id, opts = {}) {
  if (!ctx.user && opts.guest) {
    const c = db.cards.find((x) => x.id === id);
    if (guestOwns(ctx, c)) return c;
  }
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
    ownerId: card.userId, guest: !card.userId, // guest: thiệp nháp của khách chưa đăng nhập
    rsvpYes: rs.filter((r) => r.attending === 'yes').reduce((n, r) => n + r.count, 0),
    rsvpCount: rs.length,
    wishes: db.wishes.filter((w) => w.cardId === card.id).length,
    url: `${BASE_URL}/t/${card.slug}`,
    names: [card.data.groom.name, card.data.bride.name].filter(Boolean).join(' & '),
    date: card.data.date,
    cover: card.data.cover || card.data.photos[0] || '',
    ...cardState(card),
    led: { ...ledLib.state(card.led), url: `${BASE_URL}/led/${card.slug}` },
    video: { ...videoLib.state(card.video), url: `${BASE_URL}/video/${card.slug}`, template: card.video ? card.video.template : null, kind: card.video ? card.video.event.kind : null },
  };
}
function cardFull(card) {
  return { ...cardSummary(card), data: card.data, ledConfig: card.led || null, videoConfig: card.video || null };
}

function qrPay(amount, code) {
  const p = config.payment;
  return `https://img.vietqr.io/image/${p.bankBin}-${p.accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(code)}&accountName=${encodeURIComponent(p.accountName)}`;
}
// Giá gạch ngang trong cửa sổ thanh toán: thiệp / combo đang theo giá mở bán; nâng cấp combo so với mua lẻ LED + video
function wasPrice(o, product) {
  if (o.status !== 'pending') return {};
  const end = promoEnd();
  if (product === 'card' && promoActive() && o.amount + (o.coupon ? config.coupons[o.coupon] || 0 : 0) === config.price) return { wasPrice: config.listPrice, promoEndsAt: end };
  if (product === 'combo' && o.upgrade) return { wasPrice: config.ledPrice + config.videoPrice, promoEndsAt: comboPromo() ? end : null };
  if (product === 'combo' && comboPromo() && o.amount === config.comboPrice) return { wasPrice: config.comboListPrice, promoEndsAt: end };
  return {};
}
function orderView(o) {
  const card = db.cards.find((c) => c.id === o.cardId);
  const product = o.product || 'card';
  return {
    product, productName: PRODUCTS[product].name,
    code: o.code, amount: o.amount, coupon: o.coupon || null, status: o.status, claimedAt: o.claimedAt || null,
    createdAt: o.createdAt, paidAt: o.paidAt || null, paidVia: o.paidVia || null, bankNote: o.bankNote || null,
    upgrade: !!o.upgrade, ...wasPrice(o, product),
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
  claimGuestCards(req, res, user);
  json(res, 200, { user: auth.publicUser(user) });
});
route('POST', '/api/auth/login', async (req, res, ctx) => {
  rateLimit('login:' + ctx.ip, 20, 9e5);
  const b = await readJson(req);
  const user = auth.verifyLogin(b.email, b.password);
  auth.startSession(res, user.id);
  claimGuestCards(req, res, user);
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
    auth.startSession(res, user.id, 'google');
    claimGuestCards(req, res, user);
    redirect(res, safeNext(next), [].concat(res.getHeader('Set-Cookie'), clear));
  } catch (e) {
    if (e.status === 500 || !e.status) console.error('Google login lỗi:', e);
    fail(e.status && e.status !== 500 ? e.message : 'Không đăng nhập được bằng Google, thử lại sau nhé');
  }
});

route('GET', '/api/meta', async (req, res) => {
  json(res, 200, {
    brand: config.brand, tagline: config.tagline, price: cardPrice(), ...promoInfo(), trialDays: config.trialDays,
    trialGuestLimit: config.trialGuestLimit, banks, templates: templateList(), templateGroups, baseUrl: BASE_URL, support: config.support,
    ledPrice: config.ledPrice, led: ledLib.options(),
    videoPrice: config.videoPrice, video: videoLib.options(),
    comboPrice: comboPrice(), comboListPrice: comboPromo() ? config.comboListPrice : null, promoEndsAt: promoActive() || comboPromo() ? promoEnd() : null, blobUpload: !!process.env.BLOB_READ_WRITE_TOKEN,
    googleLogin: google.enabled(),
  });
}, { noDb: true });

// ---------------- thống kê truy cập ----------------
// Trang giới thiệu gửi về (public/js/site.js): p = đường dẫn, v = lượt đầu trong ngày của trình duyệt này, n = lần đầu ghé,
// r = nguồn tới, m = điện thoại; hoặc u = bấm "Dùng mẫu" (thiep:<mẫu> | video:<mẫu> | led:<màu>-<hiệu ứng>).
const TRACK_PAGES = { '/': 'Trang chủ', '/mau-thiep': 'Mẫu thiệp', '/video-cuoi': 'Video cưới', '/so-tay-cuoi': 'Sổ tay cưới', '/dang-nhap': 'Đăng nhập' };
route('POST', '/api/t', async (req, res, ctx) => {
  try {
    if (stats.isBot(req)) throw 0;
    rateLimit('t:' + ctx.ip, 240, 6e5);
    const b = JSON.parse((await readBody(req, 2000)).toString('utf8') || '{}');
    const items = [];
    if (typeof b.u === 'string') { if (/^(thiep|video|led):[\w-]{1,40}$/.test(b.u)) items.push(['use', b.u]); }
    else if (typeof b.p === 'string') {
      items.push(['pv', TRACK_PAGES[b.p.replace(/(.)\/$/, '$1')] || 'Trang khác']);
      if (b.v) {
        items.push(['visitor', 'all'], ['device', b.m ? 'Điện thoại' : 'Máy tính'], ['ref', stats.source(b.r, req)]);
        if (b.n) items.push(['visitor', 'new']);
      }
    }
    await stats.hit(items); // ghi xong mới trả lời: hàm serverless bị đóng băng ngay sau khi trả lời
  } catch (e) { /* thống kê hỏng không được ảnh hưởng tới khách */ }
  res.writeHead(204); res.end();
}, { noDb: true });
// lượt mở trang xem thử một mẫu (không tính ảnh xem trước nhúng ở trang chủ, không tính bot)
const demoView = (req, ctx, key) => (ctx.query.get('preview') === '1' || stats.isBot(req) ? null : stats.hit([['view', key]]));

route('GET', '/api/admin/traffic', async (req, res, ctx) => {
  needAdmin(ctx);
  const days = Math.min(180, Math.max(7, parseInt(ctx.query.get('days'), 10) || 30));
  const rows = await stats.range(days);
  const t0 = Date.now() - (days - 1) * DAY;
  const series = Array.from({ length: days }, (_, i) => { const d = stats.today(t0 + i * DAY); return { date: d, day: d.slice(8) + '/' + d.slice(5, 7), visitors: 0, fresh: 0, pv: 0 }; });
  const byDay = Object.fromEntries(series.map((s) => [s.date, s]));
  const sums = { pv: {}, ref: {}, device: {}, view: {}, use: {} };
  rows.forEach((r) => {
    const s = byDay[r.day]; if (!s) return;
    if (r.kind === 'visitor') s[r.key === 'new' ? 'fresh' : 'visitors'] += r.n;
    else if (r.kind === 'pv') s.pv += r.n;
    if (sums[r.kind]) sums[r.kind][r.key] = (sums[r.kind][r.key] || 0) + r.n;
  });
  const top = (m) => Object.entries(m).map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n);
  const vt = videoLib.options().templates, L = ledLib.options();
  const nameOf = (key) => {
    const [kind, id] = [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)];
    if (kind === 'thiep') return templates[id] ? templates[id].name : id;
    if (kind === 'video') return (vt.find((t) => t.id === id) || {}).name || (id === 'chung' ? 'Chưa chọn mẫu' : id);
    const [p, e] = id.split('-');
    const pn = (L.palettes.find((x) => x.id === p) || {}).name, en = (L.effects.find((x) => x.id === e) || {}).name;
    return pn ? `${pn}${en ? ' · ' + en : ''}` : id === 'chung' ? 'Chưa chọn mẫu' : id;
  };
  const keys = new Set([...Object.keys(sums.view), ...Object.keys(sums.use)]);
  const tpls = [...keys].map((key) => ({ key, kind: key.split(':')[0], name: nameOf(key), views: sums.view[key] || 0, uses: sums.use[key] || 0 }))
    .sort((a, b) => b.views + b.uses * 3 - (a.views + a.uses * 3));
  const since = new Date(stats.today(t0) + 'T00:00:00+07:00').getTime();
  const sum = (k) => series.reduce((n, s) => n + s[k], 0);
  const paid = db.orders.filter((o) => o.status === 'paid' && o.paidAt >= since);
  json(res, 200, {
    days, series, today: series[series.length - 1], yesterday: series[series.length - 2],
    totals: { visitors: sum('visitors'), fresh: sum('fresh'), pv: sum('pv') },
    pages: top(sums.pv), refs: top(sums.ref), devices: top(sums.device), templates: tpls,
    funnel: {
      visitors: sum('visitors'), views: Object.values(sums.view).reduce((a, b) => a + b, 0), uses: Object.values(sums.use).reduce((a, b) => a + b, 0),
      cards: db.cards.filter((c) => c.createdAt >= since).length, drafts: db.cards.filter((c) => c.createdAt >= since && !c.userId).length,
      signups: db.users.filter((u) => u.createdAt >= since).length,
      published: db.cards.filter((c) => c.publishedAt && c.publishedAt >= since).length,
      paid: paid.length, revenue: paid.reduce((n, o) => n + o.amount, 0),
    },
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
  if (!ctx.user) return guestCard(req, res, ctx);
  const card = newCard(needUser(ctx), await readJson(req));
  json(res, 200, { card: cardFull(card) });
});
// Bấm "Tạo màn LED" / "Dùng mẫu" video: chuyển thẳng tới trình sửa (máy chủ chọn thiệp gần nhất, chưa có thì tạo),
// không ghé trang "Thiệp của tôi" rồi mới nhảy tiếp. Chưa đăng nhập thì đăng nhập xong quay lại đúng link này.
// /tao-led?palette=&effect=  → /sua-led/<thiệp>?palette=&effect=      /tao-video?mau=<mẫu> → /sua-video/<thiệp>?mau=<mẫu>
for (const [path, to, keep] of [['/tao-led', 'sua-led', ['palette', 'effect']], ['/tao-video', 'sua-video', ['mau']]]) {
  route('GET', path, async (req, res, ctx) => {
    const q = new URLSearchParams();
    keep.forEach((k) => { const v = String(ctx.query.get(k) || '').slice(0, 40); if (/^[\w-]+$/.test(v)) q.set(k, v); });
    const qs = q.toString() ? '?' + q : '';
    if (!ctx.user) return redirect(res, '/dang-nhap?next=' + encodeURIComponent(path + qs));
    const user = ctx.user, w = Wd.ensure(user);
    const card = db.cards.filter((c) => c.userId === user.id || c.weddingId === w.id).sort((a, b) => b.updatedAt - a.updatedAt)[0]
      || newCard(user, { template: 'dodam' });
    if (to === 'sua-led') q.set('tao', '1'); // trình sửa LED tự bật màn LED, khỏi bấm thêm nút "Tạo màn LED từ thiệp này"
    redirect(res, `/${to}/${card.id}?${q}`);
  });
}

function newCard(user, b = {}) {
  if (db.cards.filter((c) => c.userId === user.id).length >= 30) throw httpError(400, 'Bạn đã có quá nhiều thiệp');
  const w = Wd.ensure(user);
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
  return card;
}

// Khách chưa đăng nhập bấm "Dùng mẫu": mỗi khách một thiệp nháp; chọn mẫu khác thì đổi mẫu trên chính thiệp đó (giữ chữ đã gõ)
async function guestCard(req, res, ctx) {
  const b = await readJson(req);
  const tpl = templates[b.template] ? b.template : DEFAULT_TEMPLATE;
  const palette = templates[tpl].palettes.find((p) => p.id === b.palette)?.id || templates[tpl].palettes[0].id;
  const now = Date.now();
  let gid = ctx.guest;
  let card = gid && db.cards.find((c) => c.guestId === gid && !c.userId);
  if (card) Object.assign(card, { template: tpl, palette, updatedAt: now });
  else {
    rateLimit('gcard:' + ctx.ip, 12, 36e5);
    // dọn thiệp nháp vô chủ đã quá hạn cookie
    const old = now - GUEST_DAYS * DAY;
    if (db.cards.some((c) => c.guestId && !c.userId && c.updatedAt < old)) db.cards = db.cards.filter((c) => !(c.guestId && !c.userId && c.updatedAt < old));
    gid = gid || require('crypto').randomBytes(16).toString('hex');
    const data = cd.defaults();
    data.events = [
      { name: 'Lễ Thành Hôn', date: '', time: '10:00', place: '', address: '', mapUrl: '' },
      { name: 'Tiệc Cưới', date: '', time: '18:00', place: '', address: '', mapUrl: '' },
    ];
    card = {
      id: rid(12), userId: null, guestId: gid, weddingId: null, slug: uniqueSlug('thiep-' + rid(6)), title: 'Thiệp 1',
      template: tpl, palette, status: 'draft', paid: false, views: 0, data, createdAt: now, updatedAt: now,
    };
    db.cards.push(card);
  }
  save();
  res.setHeader('Set-Cookie', guestCookie(gid, GUEST_DAYS * 86400));
  json(res, 200, { card: cardFull(card) });
}

route('GET', '/api/cards/:id', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id, { guest: true });
  json(res, 200, { card: cardFull(card) });
});

route('PUT', '/api/cards/:id', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id, { guest: true });
  const b = await readJson(req);
  if (!ctx.user) {
    if (b.slug !== undefined || b.led || b.video) needUser(ctx); // đường dẫn riêng, màn LED, video: cần tài khoản
    rateLimit('gsave:' + ctx.ip, 600, 36e5);
    if (b.data) { // khách chưa đăng nhập không tải tệp lên được → không nhận link ảnh / nhạc gửi kèm
      const cur = new Set([card.data.cover, card.data.music, ...card.data.photos].filter(Boolean).map((u) => String(u).split('#')[0]));
      const ok = (u) => !u || cur.has(String(u).split('#')[0]);
      if (!ok(b.data.cover) || !ok(b.data.music) || (Array.isArray(b.data.photos) && !b.data.photos.every(ok))) needUser(ctx);
    }
  }
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

// ---------------- API: đọc link Google Maps (link rút gọn → toạ độ + tên địa điểm) ----------------
// GET (không giữ khoá dữ liệu trong lúc chờ Google trả lời)
route('GET', '/api/maplink', async (req, res, ctx) => {
  if (!ctx.user && !(ctx.guest && db.cards.some((c) => c.guestId === ctx.guest && !c.userId))) needUser(ctx);
  rateLimit('map:' + (ctx.user ? ctx.user.id : ctx.ip), ctx.user ? 60 : 20, 36e5);
  const url = String(ctx.query.get('url') || '').trim().slice(0, 500);
  if (!maplink.isMaps(url)) throw httpError(400, 'Đây không phải link Google Maps');
  const r = await maplink.resolve(url) || {};
  const pin = r.lat != null ? `${r.lat},${r.lng}` : r.query ? 'q:' + r.query : '';
  console.log('maplink', JSON.stringify({ pin, name: r.name, chain: r.chain }));
  // chain: các bước chuyển hướng (để xem link được đọc ra sao khi bản đồ chưa đúng chỗ)
  json(res, 200, { pin, exact: r.lat != null, name: r.name || '', chain: r.chain || [] });
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
  if (product === 'combo' && ((card.led && card.led.paid) || (card.video && card.video.paid))) throw httpError(400, 'Màn LED hoặc video đã kích hoạt riêng — kích hoạt lẻ phần còn lại nhé');
  const isThis = (o) => o.cardId === card.id && (o.product || 'card') === product && o.status === 'pending';
  let order = db.orders.find(isThis);
  if (!order) {
    order = { id: rid(12), code: P.prefix + rid(6).toUpperCase(), product, cardId: card.id, userId: card.userId, amount: P.price(card), status: 'pending', createdAt: Date.now() };
    db.orders.push(order);
  }
  // combo: giá tuỳ thiệp đã kích hoạt chưa (nâng cấp) → tính lại mỗi lần mở
  if (product === 'combo') { order.amount = P.price(card); order.upgrade = !!card.paid; }
  if (b.coupon !== undefined) {
    const code = str(b.coupon, 30).toUpperCase();
    if (code) {
      const off = config.coupons[code];
      if (!off) throw httpError(400, 'Mã giảm giá không đúng hoặc đã hết hạn');
      if (!P.coupons) throw httpError(400, 'Mã giảm giá chỉ áp dụng cho thiệp cưới');
      order.coupon = code;
      order.amount = Math.max(0, P.price(card) - off);
    } else {
      delete order.coupon;
      order.amount = P.price(card);
    }
  }
  save();
  json(res, 200, { order: orderView(order) });
});

// Chủ thiệp xem trạng thái đơn (cửa sổ thanh toán hỏi lại vài giây một lần để biết tiền đã về)
route('GET', '/api/orders/:code', async (req, res, ctx) => {
  const o = db.orders.find((x) => x.code === ctx.params.code);
  if (!o) throw httpError(404, 'Không tìm thấy đơn');
  ownedCard(ctx, o.cardId, { guest: true });
  json(res, 200, { order: orderView(o) });
});

// Chủ thiệp báo "Tôi đã chuyển khoản"
route('POST', '/api/orders/:code/claim', async (req, res, ctx) => {
  rateLimit('claim:' + ctx.ip, 10, 36e5);
  const o = db.orders.find((x) => x.code === ctx.params.code);
  if (!o) throw httpError(404, 'Không tìm thấy đơn');
  ownedCard(ctx, o.cardId, { guest: true });
  if (o.status === 'pending') { o.claimedAt = Date.now(); save(); }
  json(res, 200, { order: orderView(o) });
});

// Kích hoạt sản phẩm của đơn — dùng chung cho quản trị viên bấm tay và SePay báo tiền về
function markPaid(o, via) {
  o.status = 'paid';
  o.paidAt = Date.now();
  o.paidVia = via;
  const card = db.cards.find((c) => c.id === o.cardId);
  if (card && o.product === 'combo') return activateCombo(card, o.paidAt);
  const target = card && PRODUCTS[o.product || 'card'].sub(card);
  if (target) { target.paid = true; target.paidAt = o.paidAt; }
}

function productPaid(o) {
  const card = db.cards.find((c) => c.id === o.cardId);
  const target = card && PRODUCTS[o.product || 'card'].sub(card);
  return !!(target && target.paid);
}

// SePay báo có giao dịch vào tài khoản ngân hàng (https://docs.sepay.vn — webhook, xác thực "API Key").
// Tìm mã đơn (TH/LD/VD + 6 ký tự) trong nội dung chuyển khoản; đủ tiền thì kích hoạt ngay.
// Thiếu tiền / đơn đã trả rồi / không thấy mã → ghi chú để quản trị viên xử lý tay. Luôn trả success
// cho SePay (trừ sai khoá) để SePay không gửi lại mãi.
const money = (n) => n.toLocaleString('vi-VN') + 'đ';
route('POST', '/api/pay/sepay', async (req, res, ctx) => {
  const key = process.env.SEPAY_API_KEY || '';
  if (!key) throw httpError(503, 'Chưa cấu hình SEPAY_API_KEY');
  const got = Buffer.from(String(req.headers.authorization || '').replace(/^apikey\s+/i, '').trim());
  const want = Buffer.from(key);
  if (got.length !== want.length || !require('crypto').timingSafeEqual(got, want)) throw httpError(401, 'Sai khoá API');
  const t = await readJson(req, 64 * 1024);
  const txnId = String(t.id || t.referenceCode || '');
  const amount = Math.round(+t.transferAmount || 0);
  if (t.transferType !== 'in' || !txnId || amount <= 0) return json(res, 200, { success: true, skipped: true });
  if (db.bankTxns.some((x) => x.id === txnId)) return json(res, 200, { success: true, duplicate: true });

  const text = `${t.code || ''} ${t.content || ''} ${t.description || ''}`.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const prefixes = Object.values(PRODUCTS).map((p) => p.prefix).join('|');
  let o = null;
  // dò mọi vị trí (kể cả chồng lấn): mã ngân hàng kiểu "MBVCB.123…" có thể nuốt mất đầu mã đơn nếu dò kiểu thường
  for (const m of text.matchAll(new RegExp(`(?=((?:${prefixes})[A-Z0-9]{6}))`, 'g'))) {
    o = db.orders.find((x) => x.code === m[1]);
    if (o) break;
  }
  let result;
  if (!o) result = 'unmatched';
  else if (o.status === 'paid' || productPaid(o)) {
    result = 'already-paid';
    o.bankNote = `Nhận thêm ${money(amount)} khi đơn đã thanh toán — cần hoàn tiền`;
  } else if (amount < o.amount) {
    result = 'underpaid';
    o.claimedAt = o.claimedAt || Date.now();
    o.bankNote = `Nhận ${money(amount)}, thiếu ${money(o.amount - amount)}`;
  } else {
    result = 'paid';
    if (amount > o.amount) o.bankNote = `Nhận ${money(amount)}, thừa ${money(amount - o.amount)}`;
    markPaid(o, 'sepay');
  }
  db.bankTxns.push({ id: txnId, amount, content: str(t.content || '', 300), at: Date.now(), order: o ? o.code : null, result });
  if (db.bankTxns.length > 2000) db.bankTxns.splice(0, db.bankTxns.length - 2000);
  save();
  json(res, 200, { success: true, result });
});

// ---------------- API: quản trị ----------------
route('GET', '/api/admin/session', async (req, res, ctx) => {
  // byEmail: quản trị theo tài khoản Google được chỉ định (ADMIN_EMAILS) thay cho mật khẩu
  json(res, 200, { admin: ctx.admin, enabled: adminAuth.byEmail() || adminAuth.enabled(), byEmail: adminAuth.byEmail(), email: ctx.user ? ctx.user.email : '' });
});
route('POST', '/api/admin/login', async (req, res, ctx) => {
  if (adminAuth.byEmail()) throw httpError(403, 'Trang quản trị chỉ mở cho tài khoản Google của chủ web');
  rateLimit('admin-login:' + ctx.ip, 8, 15 * 60e3);
  if (!adminAuth.enabled()) throw httpError(503, 'Chưa đặt mật khẩu quản trị (biến môi trường ADMIN_PASSWORD)');
  const b = await readJson(req);
  if (!adminAuth.verify(String(b.password || ''))) throw httpError(401, 'Sai mật khẩu');
  adminAuth.login(res);
  json(res, 200, { ok: true });
});
route('POST', '/api/admin/logout', async (req, res) => {
  adminAuth.logout(res);
  json(res, 200, { ok: true });
});
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
  markPaid(o, 'admin');
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
  const isOwner = canManage(ctx.user, card) || guestOwns(ctx, card) || ctx.admin; // quản trị viên xem trước được để kiểm tra
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
  const edit = preview && ctx.query.get('edit') === '1'; // khung sửa trực tiếp trong trang sửa thiệp (chỉ chủ thiệp)
  html(res, 200, renderCard(card, { guest, wishes, preview, edit, trial: !st.paid, baseUrl: BASE_URL }));
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
  // ?lite=1: bản nhẹ cho thẻ rê chuột — ảnh nạp lười, khối ngoài màn hình chưa vẽ, bản đồ Google thay bằng ô giữ chỗ
  const preview = ctx.query.get('preview') === '1', lite = ctx.query.get('lite') === '1';
  await demoView(req, ctx, 'thiep:' + tpl.id);
  html(res, 200, renderCard(card, { guest, wishes, demo: true, preview, lite, trial: false, baseUrl: BASE_URL }));
});

// ---------------- màn hình LED ----------------
route('GET', '/led/:slug', async (req, res, ctx) => {
  const slug = ctx.params.slug;
  if (slug.includes('.')) return serveStatic(req, res, '/led/' + slug); // led.js, led.css
  if (slug === 'demo') {
    const q = Object.fromEntries(ctx.query);
    const led = ledLib.normalize({ ...q, kicker: 'Lễ Thành Hôn', message: ledLib.defaults().message });
    await demoView(req, ctx, `led:${led.palette}-${led.effect}`);
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
    // mẫu album xem thử với một bộ ảnh cưới đầy đủ
    const P = (pool, ns, ext = 'jpg') => ns.map((n) => `/demo/${pool}-${n}.${ext}`);
    const SETS = { // bộ ảnh xem thử hợp từng mẫu
      album: P('longphung', [2, 5, 1, 3, 6, 4, 8, 7, 9, 10]).concat(P('dodam', [1, 2, 4, 3])),
      songhy: P('longphung', [3, 1, 6, 2, 8, 4, 9, 5, 10, 7]),
      dienanh: P('tim', [2, 6, 1, 5, 3, 8, 4, 7]),
      phimcu: P('nau', [2, 4, 6, 1, 5, 8, 3, 7]),
      polaroid: P('hoamoc', [2, 5, 3, 7, 4, 8, 6], 'webp'),
      tapchi: P('naudam', [7, 5, 6, 9, 3, 4, 10, 8]),
      traitim: P('toduyen', [3, 1, 4, 2, 5, 6, 7], 'webp'),
      hoadao: P('toduyen', [2, 5, 3, 6, 1, 4, 7], 'webp'),
      laxanh: P('hoamoc', [6, 2, 7, 3, 1, 4, 8, 5], 'webp'),
      toigian: P('xanhla', [1, 3, 2, 5, 4, 6, 8, 7, 9]),
      baocuoi: P('nau', [1, 3, 5, 2, 6, 4, 7, 8]),
      lichhen: P('toduyen', [1, 4, 2, 6, 3, 5, 7], 'webp'),
      saodem: P('tim', [1, 3, 5, 2, 7, 4, 6, 8]),
    };
    const photos = SETS[q.template] || [];
    await demoView(req, ctx, 'video:' + (videoLib.options().templates.some((t) => t.id === q.template) ? q.template : 'chung'));
    const v = videoLib.normalize({ template: q.template, photoBg: q.photo === '1', photos, event: { kind: 'Lễ Dạm Ngõ', date: '2026-11-22', time: '09:00', place: 'Tư gia nhà gái' } });
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
      // máy chủ không cài ffmpeg (ENOENT): báo rõ để khách dùng link chiếu TV thay vì "lỗi máy chủ" chung chung
      if (err && err.code === 'ENOENT') { console.error('ffmpeg chưa được cài trên máy chủ'); reject(httpError(503, 'Máy chủ tạm chưa xuất được MP4 — bạn vẫn chiếu được bằng link "Chép link chiếu TV". Vui lòng thử lại sau hoặc nhắn hỗ trợ.')); }
      else if (err) { console.error('ffmpeg lỗi:', String(stderr).slice(-1500)); reject(httpError(500, 'Chuyển video thất bại')); }
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

// ---- bản sao MP4 (video dựng & đóng gói ngay trong trình duyệt khách) ----
// Chạy thật trên Vercel: trình duyệt tải file thẳng lên Vercel Blob (không qua hàm, không vướng giới hạn 4,5MB);
// máy chủ chỉ cấp vé tải lên và ghi lại đường dẫn. Chạy máy riêng (không có Blob): nhận file và lưu vào uploads.
const BLOB_HOST = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/videos\/[\w-]+\.mp4$/i;
function paidVideoCard(ctx, id) {
  const card = ownedCard(ctx, id);
  if (!card.video) throw httpError(400, 'Hãy tạo video trước');
  if (!card.video.paid) throw httpError(402, 'Kích hoạt video để tải bản MP4 Full HD');
  return card;
}
// bỏ bản xuất cũ (chỉ giữ bản mới nhất của mỗi video)
async function dropOldMp4(old) {
  if (!old) return;
  if (/^\/uploads\/[\w.-]+\.mp4$/.test(old)) fs.rmSync(path.join(UPLOAD_DIR, path.basename(old)), { force: true });
  else if (BLOB_HOST.test(old) && process.env.BLOB_READ_WRITE_TOKEN) {
    try { await require('@vercel/blob').del(old); } catch (e) { console.warn('Không xoá được bản MP4 cũ:', e.message); }
  }
}
route('POST', '/api/cards/:id/video/blob', async (req, res, ctx) => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw httpError(501, 'Chưa cấu hình kho lưu trữ');
  const body = await readJson(req);
  if (!body || body.type !== 'blob.generate-client-token') throw httpError(400, 'Yêu cầu không hợp lệ');
  const card = paidVideoCard(ctx, ctx.params.id);
  rateLimit('mp4copy:' + card.userId, 20, 36e5);
  const { handleUpload } = require('@vercel/blob/client');
  const out = await handleUpload({
    body, request: req,
    onBeforeGenerateToken: async (pathname) => {
      if (pathname !== `videos/${card.id}.mp4`) throw httpError(400, 'Tên file không hợp lệ');
      return { allowedContentTypes: ['video/mp4'], maximumSizeInBytes: 400e6, addRandomSuffix: true, tokenPayload: card.id };
    },
  });
  json(res, 200, out);
});
route('POST', '/api/cards/:id/video/saved', async (req, res, ctx) => {
  const card = paidVideoCard(ctx, ctx.params.id);
  const { url } = await readJson(req);
  if (!BLOB_HOST.test(url || '') || !url.includes(`/videos/${card.id}`)) throw httpError(400, 'Đường dẫn video không hợp lệ');
  const old = card.video.mp4;
  card.video.mp4 = url;
  save();
  if (old !== url) await dropOldMp4(old);
  json(res, 200, { url });
});
route('POST', '/api/cards/:id/video/saved-file', async (req, res, ctx) => {
  const card = paidVideoCard(ctx, ctx.params.id);
  if (process.env.VERCEL) throw httpError(501, 'Hãy cấu hình Vercel Blob để lưu bản sao video');
  const type = String(req.headers['content-type'] || '').split(';')[0].trim();
  if (type !== 'video/mp4') throw httpError(415, 'Chỉ nhận file MP4');
  rateLimit('mp4copy:' + card.userId, 20, 36e5);
  const buf = await readBody(req, 400e6);
  // MP4 hợp lệ có hộp "ftyp" ngay đầu file
  if (buf.length < 1000 || buf.toString('latin1', 4, 8) !== 'ftyp') throw httpError(400, 'File MP4 không hợp lệ');
  const name = `${card.userId}-video-${rid(10)}.mp4`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  const old = card.video.mp4;
  card.video.mp4 = `/uploads/${name}`;
  save();
  await dropOldMp4(old);
  json(res, 200, { url: card.video.mp4 });
});

// ---------------- trang tĩnh ----------------
// Trên Vercel các trang này được CDN trả thẳng (rewrites trong vercel.json) — thêm/đổi trang thì sửa cả hai nơi.
const PAGES = {
  '/': 'index.html', '/dang-nhap': 'auth.html', '/thiep-cua-toi': 'dashboard.html', '/admin': 'admin.html', '/mau-thiep': 'templates.html',
  '/video-cuoi': 'video-landing.html',
  '/so-tay': 'planner.html',
  '/video-cua-toi': 'dashboard.html', // cùng trang với "Thiệp của tôi", hiện danh sách video
  '/so-tay-cuoi': 'planner-landing.html',
};
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
};

function serveFile(res, file, cache, req) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return html(res, 404, renderNotice('Không tìm thấy trang', 'Đường dẫn không tồn tại.'));
    // tải từng đoạn (Range): trình duyệt / TV tua được video MP4 lưu trên máy chủ
    const m = req && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (m && (m[1] || m[2])) {
      let start = m[1] ? +m[1] : Math.max(0, st.size - +m[2]);
      let end = m[1] && m[2] ? Math.min(+m[2], st.size - 1) : st.size - 1;
      if (start > end || start >= st.size) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
      res.writeHead(206, {
        'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes',
        'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff',
      });
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, {
      'Accept-Ranges': 'bytes',
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': cache,
      'X-Content-Type-Options': 'nosniff',
    });
    fs.createReadStream(file).pipe(res);
  });
}

// trang cũ gộp vào "Video cưới" (màn LED không còn bán riêng; khách cũ vẫn sửa & chiếu ở /sua-led, /led/…)
const MOVED = { '/video-dam-ngo': '/video-cuoi', '/man-hinh-led-dam-cuoi': '/video-cuoi' };

function serveStatic(req, res, pathname) {
  if (MOVED[pathname]) { res.writeHead(301, { Location: MOVED[pathname] }); return res.end(); }
  if (PAGES[pathname]) return serveFile(res, path.join(PUBLIC_DIR, PAGES[pathname]), 'no-cache');
  if (/^\/sua\/[\w-]+$/.test(pathname)) return serveFile(res, path.join(PUBLIC_DIR, 'editor.html'), 'no-cache');
  if (/^\/sua-led\/[\w-]+$/.test(pathname)) return serveFile(res, path.join(PUBLIC_DIR, 'led-editor.html'), 'no-cache');
  if (/^\/tham-gia\/[\w-]+$/.test(pathname)) return serveFile(res, path.join(PUBLIC_DIR, 'join.html'), 'no-cache');
  if (/^\/sua-video\/[\w-]+$/.test(pathname)) return serveFile(res, path.join(PUBLIC_DIR, 'video-editor.html'), 'no-cache');
  if (pathname === '/js/lunar.js') return serveFile(res, path.join(__dirname, 'lib', 'lunar.js'), 'no-cache');
  if (/^\/uploads\/[\w.-]+$/.test(pathname)) return serveFile(res, path.join(UPLOAD_DIR, path.basename(pathname)), 'public, max-age=31536000, immutable', req);
  const file = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return html(res, 404, renderNotice('Không tìm thấy trang', ''));
  // JS/CSS đổi theo phiên bản code: bắt trình duyệt kiểm tra lại, tránh khách chạy bản cũ
  serveFile(res, file, /\.(jpg|png|webp|svg)$/.test(file) ? 'public, max-age=86400' : 'no-cache');
}

// ---------------- máy chủ ----------------
const server = http.createServer(async (req, res) => {
  restoreUrl(req); // Vercel có thể gửi request thẳng vào server này, bỏ qua `handler` bên dưới
  let url, pathname;
  try { url = new URL(req.url, 'http://x'); pathname = decodeURIComponent(url.pathname); } catch { return json(res, 400, { error: 'URL lỗi' }); }
  let matched = null, params = null;
  for (const r of routes) {
    if (r.method !== req.method) continue;
    const m = r.re.exec(pathname);
    if (!m) continue;
    matched = r;
    params = Object.fromEntries(r.keys.map((k, i) => [k, m[i + 1]]));
    break;
  }
  // Kho từ xa: nạp dữ liệu mới nhất, và ghi lại trước khi trả lời (res.end chờ ghi xong).
  // Chỉ làm khi có route xử lý — file tĩnh và trang HTML không đụng tới dữ liệu nên không phải chờ kho.
  if (store.remote && matched && !matched.noDb) {
    let finish;
    try { finish = await store.begin(req.method, pathname); } catch (e) {
      console.error(e);
      // gợi ý nguyên nhân (không lộ chuỗi kết nối) để chủ web tự sửa cấu hình
      const m = String(e && e.message || '');
      const why = /password authentication/i.test(m) ? 'sai mật khẩu trong POSTGRES_URL'
        : /tenant|user .* not found/i.test(m) ? 'sai tên người dùng/mã dự án trong POSTGRES_URL (phải là postgres.<mã dự án mới>)'
        : /ENOTFOUND|EAI_AGAIN|ENETUNREACH|getaddrinfo/i.test(m) ? 'sai địa chỉ máy chủ trong POSTGRES_URL (dùng Transaction pooler)'
        : /timeout|ETIMEDOUT|ECONNREFUSED/i.test(m) ? 'máy chủ cơ sở dữ liệu không trả lời (sai cổng hoặc dự án đang tạm dừng)'
        : /invalid url|URI|URL/i.test(m) ? 'chuỗi POSTGRES_URL không hợp lệ (mật khẩu có ký tự đặc biệt?)'
        : 'lỗi khác, xem Logs trên Vercel';
      return json(res, 503, { error: 'Không kết nối được cơ sở dữ liệu, vui lòng thử lại', why });
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
  try {
    if (matched) {
      const user = matched.noDb ? null : auth.currentUser(req);
      const ctx = {
        query: url.searchParams,
        user,
        admin: adminAuth.byEmail() ? adminAuth.isAdminUser(user, user && auth.viaGoogle(req)) : adminAuth.check(req),
        guest: guestId(req),
        ip: (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress,
        params,
      };
      return await matched.handler(req, res, ctx);
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
