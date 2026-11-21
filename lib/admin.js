// Trang quản trị: người dùng, thiệp & sản phẩm, đơn hàng, cài đặt (giá, mã giảm giá…), thống kê, nhật ký.
const crypto = require('crypto');
const { db, save } = require('./db');
const { json, send, readJson, httpError, str, rid } = require('./util');
const stats = require('./stats');
const config = require('../config.json');
const auth = require('./auth');
const discounts = require('./discounts');

const DAY = 864e5;

// ---------- cài đặt sửa được trên web (lưu trong db.settings, đè lên config.json) ----------
// Tài khoản nhận tiền KHÔNG sửa trên web: nó phải trùng tài khoản đã liên kết SePay → chỉ đặt trong config.json
// (giá trị payment cũ còn sót trong db.settings bị bỏ qua).
// Giá bán cũng KHÔNG sửa trên web nữa: chỉ đặt trong config.json (giá cũ còn sót trong db.settings bị bỏ qua) — trang quản trị chỉ hiện để xem.
const SETTING_KEYS = ['brand', 'tagline', 'trialDays', 'trialGuestLimit', 'coupons', 'support'];
const PRICE_KEYS = ['price', 'listPrice', 'promoEndsAt', 'ledPrice', 'videoPrice', 'comboPrice', 'comboListPrice'];
// Giá trị gốc trong config.json: mỗi lần áp cài đặt thì quay về gốc trước, để mục đã xoá trên web không còn sót lại
const DEFAULTS = JSON.parse(JSON.stringify(Object.fromEntries(SETTING_KEYS.map((k) => [k, config[k]]))));
function applySettings() {
  const s = db.settings || {};
  for (const k of SETTING_KEYS) {
    config[k] = DEFAULTS[k] && typeof DEFAULTS[k] === 'object' ? JSON.parse(JSON.stringify(DEFAULTS[k])) : DEFAULTS[k];
    if (s[k] === undefined) continue;
    config[k] = k === 'support' ? { ...config[k], ...s[k] } : s[k];
  }
}
const vnd = (v, min = 0, max = 1e8) => Math.max(min, Math.min(max, Math.round(Number(String(v ?? '').replace(/[^\d]/g, '')) || 0)));
function cleanSettings(b) {
  const o = {};
  if (b.brand !== undefined) { o.brand = str(b.brand, 40); if (!o.brand) throw httpError(400, 'Tên thương hiệu không được trống'); }
  if (b.tagline !== undefined) o.tagline = str(b.tagline, 120);
  if (b.trialDays !== undefined) o.trialDays = vnd(b.trialDays, 1, 90);
  if (b.trialGuestLimit !== undefined) o.trialGuestLimit = vnd(b.trialGuestLimit, 1, 1000);
  if (b.coupons !== undefined) {
    o.coupons = {};
    for (const [code, off] of Object.entries(b.coupons || {})) {
      const c = str(code, 30).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      if (c) o.coupons[c] = vnd(off, 0, 1e7);
    }
  }
  if (b.support) o.support = { zalo: str(b.support.zalo, 30), email: str(b.support.email, 80) };
  return o;
}
function currentSettings() {
  const o = {};
  for (const k of SETTING_KEYS) o[k] = config[k];
  for (const k of PRICE_KEYS) o[k] = config[k]; // chỉ để xem
  return o;
}

// ---------- nhật ký thao tác ----------
function audit(ctx, action, target, detail) {
  if (!Array.isArray(db.audit)) db.audit = [];
  db.audit.push({ id: rid(10), at: Date.now(), by: 'admin', byEmail: 'Quản trị', action, target: target || '', detail: detail || '' });
  if (db.audit.length > 5000) db.audit.splice(0, db.audit.length - 5000);
  save();
}

// Đơn cần chủ web xem: đang chờ mà khách báo đã chuyển hoặc SePay thấy tiền lệch; hoặc đã trả nhưng nhận thừa / thiếu cần xử lý
function needsReview(o) {
  if (o.status === 'pending') return !!(o.claimedAt || o.bankNote);
  return o.status === 'paid' && /hoàn tiền|thiếu/.test(o.bankNote || '');
}

module.exports = { applySettings, audit, needsReview };

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
        review: db.orders.filter(needsReview).length,
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
    // review = đơn bạn phải xem (khách báo đã chuyển / tiền về lệch / thừa tiền cần hoàn); waiting = khách tạo đơn nhưng chưa chuyển
    const byStatus = (o) => (!st ? true : st === 'review' ? needsReview(o) : st === 'waiting' ? o.status === 'pending' && !needsReview(o) : o.status === st);
    let list = db.orders.filter((o) => byStatus(o) && (!pr || (o.product || 'card') === pr));
    // trang thiệp web của đơn: đường dẫn công khai + đã phát hành chưa (quản trị xem trước được cả bản nháp)
    const cardSite = (id) => { const c = db.cards.find((x) => x.id === id); return c ? { slug: c.slug, url: `${BASE_URL}/t/${c.slug}`, published: c.status === 'published' } : null; };
    // giao dịch SePay đã khớp vào từng đơn (mới nhất trước)
    const txns = {};
    (db.bankTxns || []).forEach((t) => { if (t.order) (txns[t.order] = txns[t.order] || []).unshift({ amount: t.amount, at: t.at, result: t.result }); });
    list = list.map((o) => ({ ...orderView(o), id: o.id, note: o.note || '', email: userEmail(o.userId), cancelledAt: o.cancelledAt || null, sepay: txns[o.code] || [], site: cardSite(o.cardId) }));
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
    if (f === 'disabled') list = list.filter((u) => u.disabled);
    if (f === 'paying') list = list.filter((u) => db.orders.some((o) => o.userId === u.id && o.status === 'paid'));
    list = list.sort((a, b) => b.createdAt - a.createdAt).slice(0, 500).map((u) => {
      const paid = db.orders.filter((o) => o.userId === u.id && o.status === 'paid');
      return {
        id: u.id, email: u.email, name: u.name, disabled: !!u.disabled,
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
    if (b.disabled !== undefined) {
      u.disabled = !!b.disabled;
      if (u.disabled) auth.killSessions(u.id);
      audit(ctx, u.disabled ? 'Khoá tài khoản' : 'Mở khoá tài khoản', u.email);
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
    const P = b.product !== 'combo' && PRODUCTS[b.product];
    if (!P) throw httpError(400, 'Sản phẩm không hợp lệ');
    const target = P.sub(card);
    if (!target) throw httpError(400, `Thiệp này chưa tạo ${P.name.toLowerCase()}`);
    target.paid = !!b.paid;
    target.paidAt = target.paid ? Date.now() : undefined;
    require('./fixnames').fixNames(card);
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
  // Xoá thiệp vĩnh viễn: các thiệp đã chọn ({ ids }) hoặc tất cả ({ all: true, confirm: 'XOÁ' }).
  // Xoá kèm xác nhận tham dự, lời chúc và đơn CHƯA thanh toán của các thiệp đó. Giữ khách mời (thuộc sổ tay cưới,
  // giống khi chủ thiệp tự xoá) và đơn đã thanh toán (sổ sách tiền đã nhận).
  route('POST', '/api/admin/cards/delete', async (req, res, ctx) => {
    needAdmin(ctx);
    const b = await readJson(req, 1e6);
    let ids;
    if (b.all === true) {
      if (b.confirm !== 'XOÁ') throw httpError(400, 'Gõ đúng chữ XOÁ để xoá tất cả thiệp');
      ids = new Set(db.cards.map((c) => c.id));
    } else ids = new Set((Array.isArray(b.ids) ? b.ids : []).filter((x) => typeof x === 'string').slice(0, 5000));
    if (!ids.size) throw httpError(400, 'Chưa chọn thiệp nào');
    const n0 = db.cards.length, o0 = db.orders.length;
    const slugs = db.cards.filter((c) => ids.has(c.id)).map((c) => c.slug);
    db.cards = db.cards.filter((c) => !ids.has(c.id));
    db.rsvps = db.rsvps.filter((x) => !ids.has(x.cardId));
    db.wishes = db.wishes.filter((x) => !ids.has(x.cardId));
    db.orders = db.orders.filter((o) => !(ids.has(o.cardId) && o.status !== 'paid'));
    const deleted = n0 - db.cards.length, orders = o0 - db.orders.length;
    audit(ctx, b.all ? 'Xoá tất cả thiệp' : 'Xoá thiệp', `${deleted} thiệp`, [slugs.slice(0, 20).join(', ') + (slugs.length > 20 ? '…' : ''), orders ? `${orders} đơn chưa thanh toán` : ''].filter(Boolean).join(' · '));
    json(res, 200, { deleted, orders });
  });

  // ---- sao lưu & đặt lại toàn bộ dữ liệu ----
  // Đặt lại xoá mọi dữ liệu người dùng (web như mới, chưa ai vào); giữ cài đặt, mã giảm giá, nhật ký quản trị.
  const RESET = { cards: 'thiệp', orders: 'đơn hàng', bankTxns: 'giao dịch ngân hàng', users: 'tài khoản', weddings: 'sổ tay cưới', guests: 'khách mời', tasks: 'việc cần làm', budget: 'mục ngân sách', rsvps: 'xác nhận tham dự', wishes: 'lời chúc' };
  const count = (v) => (Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.keys(v).length : 0);
  route('GET', '/api/admin/reset', async (req, res, ctx) => {
    needAdmin(ctx);
    json(res, 200, { counts: Object.entries(RESET).map(([k, name]) => ({ key: k, name, n: count(db[k]) })), paid: (db.orders || []).filter((o) => o.status === 'paid').length });
  });
  // Bản sao lưu: toàn bộ dữ liệu (trừ phiên đăng nhập) + số liệu truy cập, tải về dạng .json
  route('GET', '/api/admin/export', async (req, res, ctx) => {
    needAdmin(ctx);
    const data = { ...db }; delete data.sessions;
    const out = { exportedAt: new Date().toISOString(), data, traffic: await stats.range(3650).catch(() => []) };
    const day = new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 16).replace(/[-:T]/g, '');
    send(res, 200, JSON.stringify(out), { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="cuoinha-sao-luu-${day}.json"`, 'Cache-Control': 'no-store' });
  });
  route('POST', '/api/admin/reset', async (req, res, ctx) => {
    needAdmin(ctx);
    const b = await readJson(req);
    if (b.confirm !== 'XOÁ') throw httpError(400, 'Gõ đúng chữ XOÁ để đặt lại toàn bộ dữ liệu');
    const done = Object.keys(RESET).map((k) => `${count(db[k])} ${RESET[k]}`);
    for (const k of Object.keys(RESET)) db[k] = [];
    db.sessions = {}; // mọi người (kể cả quản trị đăng nhập bằng Google) bị đăng xuất
    db.stats = {};
    const tc = await stats.clear().catch(() => 0);
    audit(ctx, 'Đặt lại toàn bộ dữ liệu', done.join(', '), `${tc} dòng số liệu truy cập`);
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

  // ---- mã giảm giá (lib/discounts.js) ----
  // bỏ mã cũ cùng tên trong Cài đặt (config.coupons) khi đã chuyển sang quản lý ở tab Mã giảm giá
  const dropLegacy = (code) => {
    if (!config.coupons || config.coupons[code] === undefined) return;
    const c = { ...config.coupons }; delete c[code];
    db.settings = { ...(db.settings || {}), coupons: c };
    applySettings();
  };
  route('GET', '/api/admin/discounts', async (req, res, ctx) => {
    needAdmin(ctx);
    json(res, 200, { discounts: discounts.report() });
  });
  route('POST', '/api/admin/discounts', async (req, res, ctx) => {
    needAdmin(ctx);
    const d = discounts.clean(await readJson(req));
    if (discounts.all().some((x) => x.code === d.code)) throw httpError(400, `Mã ${d.code} đã có`);
    discounts.all().push(d);
    dropLegacy(d.code);
    audit(ctx, 'Tạo mã giảm giá', d.code, d.type === 'percent' ? `${d.value}%` : `${d.value}đ`);
    json(res, 200, { ok: true });
  });
  route('PUT', '/api/admin/discounts/:code', async (req, res, ctx) => {
    needAdmin(ctx);
    const list = discounts.all();
    const i = list.findIndex((x) => x.code === ctx.params.code);
    const legacy = i < 0 && config.coupons && config.coupons[ctx.params.code] !== undefined;
    if (i < 0 && !legacy) throw httpError(404, 'Không tìm thấy mã');
    const b = await readJson(req);
    const d = discounts.clean({ ...(i >= 0 ? list[i] : {}), ...b, code: ctx.params.code }, i >= 0 ? list[i] : null);
    if (i >= 0) list[i] = d; else { list.push(d); dropLegacy(d.code); }
    audit(ctx, b.active === false ? 'Tắt mã giảm giá' : 'Sửa mã giảm giá', d.code, d.type === 'percent' ? `${d.value}%` : `${d.value}đ`);
    json(res, 200, { ok: true });
  });
  route('DELETE', '/api/admin/discounts/:code', async (req, res, ctx) => {
    needAdmin(ctx);
    const list = discounts.all();
    const i = list.findIndex((x) => x.code === ctx.params.code);
    if (i >= 0) list.splice(i, 1);
    else if (config.coupons && config.coupons[ctx.params.code] !== undefined) dropLegacy(ctx.params.code);
    else throw httpError(404, 'Không tìm thấy mã');
    audit(ctx, 'Xoá mã giảm giá', ctx.params.code);
    json(res, 200, { ok: true });
  });

  // ---- nhật ký ----
  route('GET', '/api/admin/audit', async (req, res, ctx) => {
    needAdmin(ctx);
    json(res, 200, { entries: (db.audit || []).slice(-300).reverse() });
  });
};
