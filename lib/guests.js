// Danh sách khách mời thuộc về đám cưới (dùng chung cho sổ tay và mọi thiệp của đám cưới đó).
const { db, save } = require('./db');
const { rid, str, httpError } = require('./util');
const config = require('../config.json');
const { money } = require('./wedding');

const SIDES = ['trai', 'gai', ''];
const MAX = 3000;

function list(weddingId) {
  return db.guests.filter((g) => g.weddingId === weddingId).sort((a, b) => a.createdAt - b.createdAt);
}

function clean(b = {}, prev = {}) {
  const pick = (k, fn) => (b[k] !== undefined ? fn(b[k]) : prev[k]);
  return {
    name: pick('name', (v) => str(v, 80)),
    side: pick('side', (v) => (SIDES.includes(v) ? v : '')),
    group: pick('group', (v) => str(v, 40)),
    count: pick('count', (v) => Math.min(20, Math.max(1, parseInt(v, 10) || 1))),
    invited: pick('invited', (v) => !!v),
    gift: pick('gift', money),
    note: pick('note', (v) => str(v, 200)),
  };
}

function add(weddingId, items) {
  const cur = db.guests.filter((g) => g.weddingId === weddingId).length;
  if (cur + items.length > MAX) throw httpError(400, `Tối đa ${MAX} khách cho một đám cưới`);
  const now = Date.now();
  const added = items.map((it, i) => {
    const c = clean({ side: '', group: '', count: 1, invited: false, gift: 0, note: '', ...it });
    if (!c.name) throw httpError(400, 'Tên khách không được để trống');
    return { id: rid(12), weddingId, code: rid(6), ...c, rsvp: null, opens: 0, openedAt: null, createdAt: now + i };
  });
  db.guests.push(...added);
  save();
  return added;
}

// Tên nhiều dòng → nhiều khách
function addNames(weddingId, names, extra = {}) {
  const arr = (Array.isArray(names) ? names : String(names || '').split('\n')).map((n) => str(n, 80)).filter(Boolean);
  if (!arr.length) throw httpError(400, 'Nhập ít nhất một tên khách');
  return add(weddingId, arr.map((name) => ({ ...extra, name })));
}

// Thiệp chưa kích hoạt: chỉ N khách đầu danh sách được link có tên riêng
function personalAllowed(card, guest) {
  if (card.paid) return true;
  const idx = list(guest.weddingId).findIndex((g) => g.id === guest.id);
  return idx >= 0 && idx < config.trialGuestLimit;
}

// Khách xác nhận qua thiệp → ghi ngược vào danh sách khách (khớp link riêng, hoặc khớp tên, hoặc thêm mới)
function recordRsvp(weddingId, guestCode, r) {
  if (!weddingId) return null;
  let g = guestCode ? db.guests.find((x) => x.weddingId === weddingId && x.code === guestCode) : null;
  if (!g) {
    const key = r.name.trim().toLowerCase();
    g = db.guests.find((x) => x.weddingId === weddingId && x.name.trim().toLowerCase() === key);
  }
  if (!g) {
    if (db.guests.filter((x) => x.weddingId === weddingId).length >= MAX) return null;
    [g] = add(weddingId, [{ name: r.name, side: r.side, group: 'Tự xác nhận qua thiệp', count: r.count, invited: true }]);
  }
  g.rsvp = { attending: r.attending, count: r.count, note: r.note, at: Date.now() };
  if (r.attending === 'yes') g.count = r.count;
  g.invited = true;
  save();
  return g;
}

function stats(weddingId) {
  const gs = list(weddingId);
  const sum = (arr, f) => arr.reduce((n, g) => n + f(g), 0);
  const yes = gs.filter((g) => g.rsvp && g.rsvp.attending === 'yes');
  return {
    total: gs.length,
    people: sum(gs, (g) => g.count || 1),
    trai: sum(gs.filter((g) => g.side === 'trai'), (g) => g.count || 1),
    gai: sum(gs.filter((g) => g.side === 'gai'), (g) => g.count || 1),
    invited: gs.filter((g) => g.invited).length,
    yesPeople: sum(yes, (g) => g.rsvp.count),
    no: gs.filter((g) => g.rsvp && g.rsvp.attending === 'no').length,
    gifts: sum(gs, (g) => g.gift || 0),
  };
}

module.exports = { list, clean, add, addNames, personalAllowed, recordRsvp, stats };
