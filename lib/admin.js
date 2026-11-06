// Trang quản trị: người dùng, thiệp & sản phẩm, đơn hàng, cài đặt (giá, mã giảm giá…), thống kê, nhật ký.
const crypto = require('crypto');
const { db, save } = require('./db');
const { json, readJson, httpError, str, rid } = require('./util');
const config = require('../config.json');
const auth = require('./auth');

const DAY = 864e5;

// ---------- cài đặt sửa được trên web (lưu trong db.settings, đè lên config.json) ----------
const SETTING_KEYS = ['brand', 'tagline', 'price', 'ledPrice', 'videoPrice', 'trialDays', 'trialGuestLimit', 'coupons', 'payment', 'support'];
function applySettings() {
  const s = db.settings || {};
  for (const k of SETTING_KEYS) {
    if (s[k] === undefined) continue;
    config[k] = (k === 'payment' || k === 'support') ? { ...config[k], ...s[k] } : s[k];
  }
}
const vnd = (v, min = 0, max = 1e8) => Math.max(min, Math.min(max, Math.round(Number(String(v ?? '').replace(/[^\d]/g, '')) || 0)));
function cleanSettings(b) {
  const o = {};
  if (b.brand !== undefined) { o.brand = str(b.brand, 40); if (!o.brand) throw httpError(400, 'Tên thương hiệu không được trống'); }
  if (b.tagline !== undefined) o.tagline = str(b.tagline, 120);
  for (const k of ['price', 'ledPrice', 'videoPrice']) if (b[k] !== undefined) o[k] = vnd(b[k], 0, 1e7);
  if (b.trialDays !== undefined) o.trialDays = vnd(b.trialDays, 1, 90);
  if (b.trialGuestLimit !== undefined) o.trialGuestLimit = vnd(b.trialGuestLimit, 1, 1000);
  if (b.coupons !== undefined) {
    o.coupons = {};
    for (const [code, off] of Object.entries(b.coupons || {})) {
      const c = str(code, 30).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      if (c) o.coupons[c] = vnd(off, 0, 1e7);
    }
  }
  if (b.payment) {
    o.payment = {
      bankBin: /^\d{6}$/.test(b.payment.bankBin || '') ? b.payment.bankBin : config.payment.bankBin,
      bankName: str(b.payment.bankName, 60), accountNo: str(b.payment.accountNo, 30).replace(/[^\w]/g, ''),
      accountName: str(b.payment.accountName, 60).toUpperCase(),
    };
  }
  if (b.support) o.support = { zalo: str(b.support.zalo, 30), email: str(b.support.email, 80) };
  return o;
}
function currentSettings() {
  const o = {};
  for (const k of SETTING_KEYS) o[k] = config[k];
  return o;
}

// ---------- nhật ký thao tác ----------
function audit(ctx, action, target, detail) {
  if (!Array.isArray(db.audit)) db.audit = [];
  db.audit.push({ id: rid(10), at: Date.now(), by: ctx.user.id, byEmail: ctx.user.email, action, target: target || '', detail: detail || '' });
  if (db.audit.length > 5000) db.audit.splice(0, db.audit.length - 5000);
  save();
}

module.exports = { applySettings, audit };

// Đăng ký các API — gọi từ server.js sau khi đã có các hàm dùng chung
module.exports.routes = function adminRoutes({ route, needAdmin, PRODUCTS, orderView, cardSummary, BASE_URL }) {
  const userEmail = (id) => (db.users.find((u) => u.id === id) || {}).email || '';
  const findCard = (id) => { const c = db.cards.find((x) => x.id === id); if (!c) throw httpError(404, 'Không tìm thấy thiệp'); return c; };

  // ---- thống kê + biểu đồ 30 ngày ----
  route('GET', '/api/admin/stats', async (req, res, ctx) => {
    needAdmin(ctx);
    const days = Math.min(180, Math.max(7, parseInt(ctx.query.get('days'), 10) || 30));
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const t0 = start.getTime() - (days - 1) * DAY;
    const series = Array.from({ length: days }, (_, i) => {
      const d = new Date(t0 + i * DAY);
      return { day: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`, signups: 0, cards: 0, revenue: 0, orders: 0 };
    });
    const slot = (t) => { const i = Math.floor((t - t0) / DAY); return i >= 0 && i < days ? series[i] : null; };
    db.users.forEach((u) => { const s = slot(u.createdAt); if (s) s.signups++; });
    db.cards.forEach((c) => { const s = slot(c.createdAt); if (s) s.cards++; });
    const paid = db.orders.filter((o) => o.status === 'paid');
    paid.forEach((o) => { const s = slot(o.paidAt); if (s) { s.revenue += o.amount; s.orders++; } });
    const byProduct = {};
    for (const k of Object.keys(PRODUCTS)) {
      const list = paid.filter((o) => (o.product || 'card') === k);
      byProduct[k] = { name: PRODUCTS[k].name, count: list.length, revenue: list.reduce((n, o) => n + o.amount, 0) };
    }
    const week = Date.now() - 7 * DAY;
    json(res, 200, {
      totals: {
        users: db.users.length, usersWeek: db.users.filter((u) => u.createdAt > week).length,
        activeWeek: db.users.filter((u) => (u.lastSeenAt || 0) > week).length,
        weddings: (db.weddings || []).length, cards: db.cards.length, published: db.cards.filter((c) => c.status === 'published').length,
        paidOrders: paid.length, revenue: paid.reduce((n, o) => n + o.amount, 0),
        revenueWeek: paid.filter((o) => o.paidAt > week).reduce((n, o) => n + o.amount, 0),
        pending: db.orders.filter((o) => o.status === 'pending').length,
        claimed: db.orders.filter((o) => o.status === 'pending' && o.claimedAt).length,
        rsvps: db.rsvps.length, guests: db.guests.length,
        conversion: db.cards.length ? Math.round((db.cards.filter((c) => c.paid).length / db.cards.length) * 1000) / 10 : 0,
      },
      byProduct, series,
    });
  });

  // ---- đơn hàng ----
  route('GET', '/api/admin/orders', async (req, res, ctx) => {
    needAdmin(ctx);
    const st = ctx.query.get('status') || '';
    const pr = ctx.query.get('product') || '';
    const q = (ctx.query.get('q') || '').trim().toLowerCase();
    let list = db.orders.filter((o) => (!st || o.status === st) && (!pr || (o.product || 'card') === pr));
    list = list.map((o) => ({ ...orderView(o), id: o.id, note: o.note || '', email: userEmail(o.userId), cancelledAt: o.cancelledAt || null }));
    if (q) list = list.filter((o) => [o.code, o.email, o.card && o.card.names, o.card && o.card.title].join(' ').toLowerCase().includes(q));
    list.sort((a, b) => (b.status === 'pending') - (a.status === 'pending') || (b.claimedAt || b.createdAt) - (a.claimedAt || a.createdAt));
    json(res, 200, { orders: list.slice(0, 500), total: list.length });
  });
  route('POST', '/api/admin/orders/:id/cancel', async (req, res, ctx) => {
    needAdmin(ctx);
    const o = db.orders.find((x) => x.id === ctx.params.id);
    if (!o) throw httpError(404, 'Không tìm thấy đơn');
    if (o.status !== 'pending') throw httpError(400, 'Chỉ huỷ được đơn đang chờ thanh toán');
    o.status = 'cancelled';
    o.cancelledAt = Date.now();
    audit(ctx, 'Huỷ đơn', o.code);
    json(res, 200, { ok: true });
  });
  route('PUT', '/api/admin/orders/:id', async (req, res, ctx) => {
    needAdmin(ctx);
    const o = db.orders.find((x) => x.id === ctx.params.id);
    if (!o) throw httpError(404, 'Không tìm thấy đơn');
    const b = await readJson(req);
    o.note = str(b.note, 300);
    audit(ctx, 'Ghi chú đơn', o.code, o.note);
    json(res, 200, { ok: true });
  });

  // ---- người dùng ----
  route('GET', '/api/admin/users', async (req, res, ctx) => {
    needAdmin(ctx);
    const q = (ctx.query.get('q') || '').trim().toLowerCase();
    const f = ctx.query.get('filter') || '';
    let list = db.users.filter((u) => !q || (u.email + ' ' + (u.name || '')).toLowerCase().includes(q));
    if (f === 'admin') list = list.filter((u) => u.isAdmin);
    if (f === 'disabled') list = list.filter((u) => u.disabled);
    if (f === 'paying') list = list.filter((u) => db.orders.some((o) => o.userId === u.id && o.status === 'paid'));
    list = list.sort((a, b) => b.createdAt - a.createdAt).slice(0, 500).map((u) => {
      const paid = db.orders.filter((o) => o.userId === u.id && o.status === 'paid');
      return {
        id: u.id, email: u.email, name: u.name, isAdmin: !!u.isAdmin, disabled: !!u.disabled,
        google: !!u.googleId, hasPassword: !!u.passHash, createdAt: u.createdAt, lastSeenAt: u.lastSeenAt || null,
        cards: db.cards.filter((c) => c.userId === u.id).length, spent: paid.reduce((n, o) => n + o.amount, 0), orders: paid.length,
      };
    });
    json(res, 200, { users: list, total: db.users.length });
  });
  route('PUT', '/api/admin/users/:id', async (req, res, ctx) => {
    needAdmin(ctx);
    const u = db.users.find((x) => x.id === ctx.params.id);
    if (!u) throw httpError(404, 'Không tìm thấy người dùng');
    const b = await readJson(req);
    const self = u.id === ctx.user.id;
    if (b.disabled !== undefined) {
      if (self) throw httpError(400, 'Không thể tự khoá tài khoản của mình');
      u.disabled = !!b.disabled;
      if (u.disabled) auth.killSessions(u.id);
      audit(ctx, u.disabled ? 'Khoá tài khoản' : 'Mở khoá tài khoản', u.email);
    }
    if (b.isAdmin !== undefined) {
      if (self && !b.isAdmin) throw httpError(400, 'Không thể tự bỏ quyền quản trị của mình');
      if (!b.isAdmin && db.users.filter((x) => x.isAdmin && !x.disabled).length <= 1) throw httpError(400, 'Phải còn ít nhất một quản trị viên');
      u.isAdmin = !!b.isAdmin;
      audit(ctx, u.isAdmin ? 'Cấp quyền quản trị' : 'Bỏ quyền quản trị', u.email);
    }
    if (b.name !== undefined) { u.name = str(b.name, 80) || u.name; audit(ctx, 'Đổi tên người dùng', u.email, u.name); }
    save();
    json(res, 200, { ok: true });
  });
  // Đặt lại mật khẩu: tạo mật khẩu tạm, chỉ hiện một lần cho quản trị viên để gửi người dùng
  route('POST', '/api/admin/users/:id/password', async (req, res, ctx) => {
    needAdmin(ctx);
    const u = db.users.find((x) => x.id === ctx.params.id);
    if (!u) throw httpError(404, 'Không tìm thấy người dùng');
    const ALPH = 'abcdefghjkmnpqrstuvwxyz23456789';
    const pw = Array.from(crypto.randomBytes(10), (b) => ALPH[b % ALPH.length]).join('');
    auth.setPassword(u, pw);
    auth.killSessions(u.id);
    audit(ctx, 'Đặt lại mật khẩu', u.email);
    json(res, 200, { password: pw });
  });

  // ---- thiệp & sản phẩm ----
  route('GET', '/api/admin/cards', async (req, res, ctx) => {
    needAdmin(ctx);
    const q = (ctx.query.get('q') || '').trim().toLowerCase();
    const f = ctx.query.get('filter') || '';
    let list = db.cards.map((c) => ({ ...cardSummary(c), ownerEmail: userEmail(c.userId), blocked: !!c.blocked, blockReason: c.blockReason || '' }));
    if (q) list = list.filter((c) => [c.names, c.title, c.slug, c.ownerEmail].join(' ').toLowerCase().includes(q));
    if (f === 'published') list = list.filter((c) => c.status === 'published');
    if (f === 'paid') list = list.filter((c) => c.paid || c.led.paid || c.video.paid);
    if (f === 'trial') list = list.filter((c) => !c.paid && c.status === 'published');
    if (f === 'blocked') list = list.filter((c) => c.blocked);
    list.sort((a, b) => b.updatedAt - a.updatedAt);
    json(res, 200, { cards: list.slice(0, 500), total: list.length, baseUrl: BASE_URL });
  });
  // Kích hoạt / huỷ kích hoạt tay (tặng khách, sửa sai, hoàn tiền)
  route('POST', '/api/admin/cards/:id/product', async (req, res, ctx) => {
    needAdmin(ctx);
    const card = findCard(ctx.params.id);
    const b = await readJson(req);
    const P = PRODUCTS[b.product];
    if (!P) throw httpError(400, 'Sản phẩm không hợp lệ');
    const target = P.sub(card);
    if (!target) throw httpError(400, `Thiệp này chưa tạo ${P.name.toLowerCase()}`);
    target.paid = !!b.paid;
    target.paidAt = target.paid ? Date.now() : undefined;
    audit(ctx, (target.paid ? 'Kích hoạt tay: ' : 'Huỷ kích hoạt: ') + P.name, card.slug, str(b.reason, 200));
    json(res, 200, { ok: true });
  });
  // Gỡ thiệp vi phạm: khách mở link sẽ thấy thông báo, chủ thiệp vẫn sửa được
  route('POST', '/api/admin/cards/:id/block', async (req, res, ctx) => {
    needAdmin(ctx);
    const card = findCard(ctx.params.id);
    const b = await readJson(req);
    card.blocked = !!b.blocked;
    card.blockReason = card.blocked ? str(b.reason, 200) : '';
    audit(ctx, card.blocked ? 'Gỡ thiệp' : 'Khôi phục thiệp', card.slug, card.blockReason);
    json(res, 200, { ok: true });
  });

  // ---- cài đặt ----
  route('GET', '/api/admin/settings', async (req, res, ctx) => {
    needAdmin(ctx);
    json(res, 200, { settings: currentSettings() });
  });
  route('PUT', '/api/admin/settings', async (req, res, ctx) => {
    needAdmin(ctx);
    const clean = cleanSettings(await readJson(req));
    const before = currentSettings();
    db.settings = { ...(db.settings || {}), ...clean };
    applySettings();
    const changed = Object.keys(clean).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(config[k]));
    audit(ctx, 'Sửa cài đặt', changed.join(', ') || '(không đổi)');
    json(res, 200, { settings: currentSettings() });
  });

  // ---- nhật ký ----
  route('GET', '/api/admin/audit', async (req, res, ctx) => {
    needAdmin(ctx);
    json(res, 200, { entries: (db.audit || []).slice(-300).reverse() });
  });
};
