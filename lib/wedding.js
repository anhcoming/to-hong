// "Đám cưới" là không gian làm việc chung: thông tin đôi, ngày cưới, việc cần làm, ngân sách, khách mời.
// Thiệp / màn LED / video đều gắn vào một đám cưới và đọc thông tin từ đây.
const { db, save } = require('./db');
const { rid, str, httpError } = require('./util');

const REGIONS = { bac: 'Miền Bắc', trung: 'Miền Trung', nam: 'Miền Nam' };

// Các buổi lễ — mỗi việc gắn vào một lễ, hạn chót tính theo ngày của lễ đó.
const EVENTS = {
  damngo: { name: 'Lễ dạm ngõ', nam: 'Gặp mặt hai gia đình' },
  anhoi: { name: 'Lễ ăn hỏi', nam: 'Lễ đám hỏi' },
  cuoi: { name: 'Ngày cưới' },
  sau: { name: 'Sau ngày cưới' }, // tính theo ngày cưới
};
const EVENT_ORDER = ['damngo', 'anhoi', 'cuoi', 'sau'];

// e: thuộc lễ nào. o: số ngày so với ngày của lễ đó (âm = trước lễ). r: miền áp dụng (bỏ trống = mọi miền).
// cta: nút gắn với bước (làm thiệp, video, màn LED, mở danh sách khách / ngân sách).
const TASKS = [
  // — Dạm ngõ —
  { e: 'damngo', t: 'Hai bên gia đình thống nhất ngày dạm ngõ', c: 'Lễ nghi', o: -14 },
  { e: 'damngo', t: 'Chọn người đại diện nhà trai thưa chuyện', c: 'Lễ nghi', o: -5 },
  { e: 'damngo', t: 'Chuẩn bị lễ vật dạm ngõ: trầu cau, chè, rượu, bánh', c: 'Lễ vật', o: -3, r: ['bac', 'trung'] },
  { e: 'damngo', t: 'Chuẩn bị quà ra mắt bố mẹ hai bên', c: 'Lễ vật', o: -3 },
  // — Ăn hỏi / đám hỏi —
  { e: 'anhoi', t: 'Chốt ngày giờ lễ ăn hỏi với nhà gái', c: 'Lễ nghi', o: -45, r: ['bac', 'trung'] },
  { e: 'anhoi', t: 'Chốt ngày giờ lễ đám hỏi với nhà gái', c: 'Lễ nghi', o: -45, r: ['nam'] },
  { e: 'anhoi', t: 'Đặt tráp ăn hỏi (số lẻ: 5, 7, 9 tráp)', c: 'Lễ vật', o: -30, r: ['bac'] },
  { e: 'anhoi', t: 'Chuẩn bị lễ vật ăn hỏi: trầu cau, rượu, chè, bánh', c: 'Lễ vật', o: -30, r: ['trung'] },
  { e: 'anhoi', t: 'Đặt mâm quả đám hỏi (số chẵn: 6, 8, 10 mâm)', c: 'Lễ vật', o: -30, r: ['nam'] },
  { e: 'anhoi', t: 'Chọn đội bê tráp, đỡ tráp và đặt áo dài đồng phục', c: 'Trang phục', o: -21 },
  { e: 'anhoi', t: 'Thuê áo dài cho cô dâu, chú rể', c: 'Trang phục', o: -21 },
  { e: 'anhoi', t: 'Đặt thợ chụp ảnh, quay phim lễ ăn hỏi', c: 'Ảnh & phim', o: -14 },
  { e: 'anhoi', t: 'Đặt trang điểm cô dâu ngày ăn hỏi', c: 'Làm đẹp', o: -14 },
  { e: 'anhoi', t: 'Trang trí phông, cổng hoa ở nhà gái', c: 'Trang trí', o: -10 },
  { e: 'anhoi', t: 'Đặt cỗ mời họ hàng hai bên', c: 'Tiệc', o: -10 },
  { e: 'anhoi', t: 'Làm video ăn hỏi chiếu TV', c: 'Trang trí', o: -7, cta: 'video' },
  { e: 'anhoi', t: 'Chuẩn bị phong bì lại quả, lì xì đội bê tráp', c: 'Lễ vật', o: -2 },
  // — Ngày cưới —
  { e: 'cuoi', t: 'Thống nhất ngân sách cưới với hai bên gia đình', c: 'Ngân sách', o: -240, cta: 'budget' },
  { e: 'cuoi', t: 'Đặt nhà hàng / địa điểm tiệc cưới', c: 'Tiệc', o: -180 },
  { e: 'cuoi', t: 'Chọn studio chụp ảnh cưới', c: 'Ảnh & phim', o: -150 },
  { e: 'cuoi', t: 'Chụp ảnh cưới', c: 'Ảnh & phim', o: -100 },
  { e: 'cuoi', t: 'Chọn và thử váy cưới, vest chú rể', c: 'Trang phục', o: -90 },
  { e: 'cuoi', t: 'Lên danh sách khách mời hai nhà', c: 'Khách mời', o: -75, cta: 'guests' },
  { e: 'cuoi', t: 'Đặt nhẫn cưới', c: 'Trang sức', o: -60 },
  { e: 'cuoi', t: 'Đặt trang điểm, làm tóc cô dâu ngày cưới', c: 'Làm đẹp', o: -45 },
  { e: 'cuoi', t: 'Đặt MC, ban nhạc, quay phim ngày cưới', c: 'Ảnh & phim', o: -45 },
  { e: 'cuoi', t: 'Nhận ảnh cưới, in ảnh cổng và ảnh phóng to', c: 'Ảnh & phim', o: -30 },
  { e: 'cuoi', t: 'Đặt xe cưới (xe hoa) và xe đưa đón họ hàng', c: 'Xe cưới', o: -30 },
  { e: 'cuoi', t: 'Đăng ký kết hôn tại UBND xã/phường', c: 'Giấy tờ', o: -30 },
  { e: 'cuoi', t: 'Làm thiệp mời online và gửi khách', c: 'Khách mời', o: -30, cta: 'card' },
  { e: 'cuoi', t: 'In thiệp giấy mời ông bà, người lớn tuổi', c: 'Khách mời', o: -30 },
  { e: 'cuoi', t: 'Đặt hoa cưới: hoa cầm tay, hoa cài áo, hoa xe', c: 'Hoa & trang trí', o: -21 },
  { e: 'cuoi', t: 'Đặt rạp, cổng hoa, phông cưới tại nhà', c: 'Hoa & trang trí', o: -14 },
  { e: 'cuoi', t: 'Thử váy lần cuối, trang điểm thử', c: 'Làm đẹp', o: -10 },
  { e: 'cuoi', t: 'Chuẩn bị màn hình LED ở sảnh tiệc', c: 'Hoa & trang trí', o: -7, cta: 'led' },
  { e: 'cuoi', t: 'Nhắc khách, chốt số mâm với nhà hàng', c: 'Tiệc', o: -7, cta: 'guests' },
  { e: 'cuoi', t: 'Mua phong bì, sổ ghi tiền mừng, hộp đựng', c: 'Tiệc', o: -7 },
  { e: 'cuoi', t: 'Chuẩn bị quà cảm ơn khách và đội bê tráp', c: 'Tiệc', o: -5 },
  { e: 'cuoi', t: 'Phân công người nhà: đón khách, nhận quà, đưa dâu', c: 'Lễ nghi', o: -3 },
  { e: 'cuoi', t: 'Chuẩn bị đồ dùng cá nhân, giấy tờ cho ngày cưới', c: 'Lễ nghi', o: -1 },
  { e: 'cuoi', t: 'Lễ xin dâu và rước dâu', c: 'Lễ nghi', o: 0, r: ['bac', 'trung'] },
  { e: 'cuoi', t: 'Lễ rước dâu (đón dâu)', c: 'Lễ nghi', o: 0, r: ['nam'] },
  { e: 'cuoi', t: 'Lễ gia tiên, lễ tơ hồng', c: 'Lễ nghi', o: 0 },
  { e: 'cuoi', t: 'Tiệc cưới', c: 'Tiệc', o: 0 },
  // — Sau cưới —
  { e: 'sau', t: 'Lễ lại mặt: vợ chồng về thăm nhà gái', c: 'Lễ nghi', o: 2 },
  { e: 'sau', t: 'Tổng kết tiền mừng, nhắn lời cảm ơn khách', c: 'Khách mời', o: 7, cta: 'guests' },
  { e: 'sau', t: 'Thanh toán nốt các khoản còn lại', c: 'Ngân sách', o: 7, cta: 'budget' },
  { e: 'sau', t: 'Nhận album và video cưới', c: 'Ảnh & phim', o: 30 },
];

const BUDGET = [
  ['Tiệc cưới', ['Tiệc nhà hàng', 'Đồ uống']],
  ['Lễ ăn hỏi', ['Tráp / mâm quả', 'Đội bê tráp', 'Cỗ ăn hỏi']],
  ['Trang phục', ['Váy cưới', 'Áo dài', 'Vest chú rể']],
  ['Ảnh & phim', ['Chụp ảnh cưới', 'Quay phim ngày cưới']],
  ['Trang sức', ['Nhẫn cưới']],
  ['Làm đẹp', ['Trang điểm cô dâu']],
  ['Trang trí', ['Cổng hoa, phông rạp']],
  ['Thiệp & trình chiếu', ['Thiệp giấy', 'Thiệp online, màn LED, video']],
  ['Di chuyển', ['Xe cưới']],
  ['Khác', ['Phong bì, quà cảm ơn', 'Phát sinh']],
];
const BUDGET_CATS = BUDGET.map((b) => b[0]);
const TASK_CATS = [...new Set(TASKS.map((t) => t.c))];

function seedTasks(w) {
  const now = Date.now();
  return TASKS.filter((x) => !x.r || x.r.includes(w.region)).map((x, i) => ({
    id: rid(12), weddingId: w.id, event: x.e, title: x.t, category: x.c, offset: x.o, cta: x.cta || null,
    done: false, doneAt: null, assignee: null, note: '', custom: false, createdAt: now + i,
  }));
}
function seedBudget(w) {
  const now = Date.now();
  const out = [];
  BUDGET.forEach(([cat, items]) => items.forEach((name) => out.push({
    id: rid(12), weddingId: w.id, category: cat, name, estimate: 0, actual: 0, paid: 0, note: '', createdAt: now + out.length,
  })));
  return out;
}

const person = () => ({ name: '', fullName: '', father: '', mother: '', address: '' });

function create(user, region = 'bac') {
  const w = {
    id: rid(12), name: '', region: REGIONS[region] ? region : 'bac', date: '', time: '', damngo: '', anhoi: '', budgetTotal: 0,
    couple: { groom: person(), bride: person() },
    members: [{ userId: user.id, role: 'owner', joinedAt: Date.now() }],
    inviteCode: rid(16), createdAt: Date.now(),
  };
  db.weddings.push(w);
  db.tasks.push(...seedTasks(w));
  db.budget.push(...seedBudget(w));
  user.weddingId = w.id;
  save();
  return w;
}

function isMember(w, user) {
  return !!(w && user && w.members.some((m) => m.userId === user.id));
}

// Đám cưới hiện tại của người dùng; chưa có thì tạo (kéo theo các thiệp cũ chưa gắn)
function ensure(user) {
  let w = user.weddingId && db.weddings.find((x) => x.id === user.weddingId);
  if (w && !isMember(w, user)) w = null;
  if (!w) w = db.weddings.find((x) => isMember(x, user));
  if (!w) {
    w = create(user);
    adoptCards(user, w);
  }
  if (user.weddingId !== w.id) { user.weddingId = w.id; save(); }
  return w;
}

function get(id) {
  return db.weddings.find((w) => w.id === id) || null;
}

// Thiệp cũ (trước khi có sổ tay) → gắn vào đám cưới, chuyển khách mời theo
function adoptCards(user, w) {
  const mine = db.cards.filter((c) => c.userId === user.id && !c.weddingId).sort((a, b) => b.updatedAt - a.updatedAt);
  mine.forEach((c) => { c.weddingId = w.id; });
  db.guests.forEach((g) => {
    if (!g.weddingId && g.cardId && mine.some((c) => c.id === g.cardId)) g.weddingId = w.id;
  });
  if (mine[0]) syncFromCard(mine[0], true);
  save();
}

// Chạy một lần khi khởi động: dữ liệu cũ → mô hình mới
function migrate() {
  ['weddings', 'tasks', 'budget'].forEach((k) => { if (!Array.isArray(db[k])) db[k] = []; });
  let changed = false;
  db.users.forEach((u) => {
    if (db.cards.some((c) => c.userId === u.id && !c.weddingId)) { ensure(u); changed = true; }
  });
  db.guests.forEach((g) => {
    if (!g.weddingId && g.cardId) { const c = db.cards.find((x) => x.id === g.cardId); if (c && c.weddingId) { g.weddingId = c.weddingId; changed = true; } }
    if (g.count === undefined) { g.count = 1; g.group = g.group || ''; g.invited = !!g.opens; g.gift = 0; g.note = ''; changed = true; }
  });
  // việc tạo trước khi có "buổi lễ" → tính theo ngày cưới (sau cưới nếu offset dương)
  db.tasks.forEach((t) => { if (!t.event) { t.event = t.offset > 0 ? 'sau' : 'cuoi'; changed = true; } });
  db.weddings.forEach((w) => { if (w.anhoi === undefined) { w.anhoi = ''; w.damngo = ''; changed = true; } });
  if (changed) save();
}

// ----- đồng bộ thông tin đôi giữa đám cưới và các thiệp -----
const PFIELDS = ['name', 'fullName', 'father', 'mother', 'address'];
function syncFromCard(card, force) {
  const w = get(card.weddingId);
  if (!w) return;
  ['groom', 'bride'].forEach((k) => PFIELDS.forEach((f) => {
    const v = card.data[k][f];
    if (v || force) w.couple[k][f] = v || w.couple[k][f];
  }));
  if (card.data.date) w.date = card.data.date;
  if (card.data.time && !w.time) w.time = card.data.time;
  syncToCards(w, card.id);
}
function syncToCards(w, exceptId) {
  db.cards.filter((c) => c.weddingId === w.id && c.id !== exceptId).forEach((c) => {
    ['groom', 'bride'].forEach((k) => PFIELDS.forEach((f) => { c.data[k][f] = w.couple[k][f]; }));
    if (w.date) c.data.date = w.date;
  });
}
function prefill(data, w) {
  ['groom', 'bride'].forEach((k) => PFIELDS.forEach((f) => { data[k][f] = w.couple[k][f]; }));
  data.date = w.date;
  data.time = w.time || data.time;
}

function normPerson(p = {}, prev) {
  const o = {};
  PFIELDS.forEach((f) => { o[f] = p[f] !== undefined ? str(p[f], f === 'address' ? 160 : 80) : prev[f]; });
  return o;
}

function update(w, b) {
  if (b.name !== undefined) w.name = str(b.name, 80);
  if (b.region !== undefined && REGIONS[b.region]) w.region = b.region;
  const isoDate = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : '');
  if (b.date !== undefined) w.date = isoDate(b.date);
  if (b.anhoi !== undefined) w.anhoi = isoDate(b.anhoi);
  if (b.damngo !== undefined) w.damngo = isoDate(b.damngo);
  if (b.time !== undefined) w.time = /^\d{2}:\d{2}$/.test(b.time) ? b.time : '';
  if (b.budgetTotal !== undefined) w.budgetTotal = money(b.budgetTotal);
  if (b.couple) {
    w.couple.groom = normPerson(b.couple.groom, w.couple.groom);
    w.couple.bride = normPerson(b.couple.bride, w.couple.bride);
  }
  syncToCards(w);
  save();
}

// Đổi miền: thay các việc mẫu chưa làm bằng bộ việc của miền mới, giữ việc tự thêm và việc đã xong
function reseed(w, region) {
  if (!REGIONS[region]) throw httpError(400, 'Miền không hợp lệ');
  w.region = region;
  const fresh = seedTasks(w);
  const keep = db.tasks.filter((t) => t.weddingId === w.id && (t.custom || t.done));
  const keepTitles = new Set(keep.map((t) => t.title));
  db.tasks = db.tasks.filter((t) => t.weddingId !== w.id).concat(keep, fresh.filter((t) => !keepTitles.has(t.title)));
  save();
}

function money(v) {
  const n = Math.round(Number(String(v ?? '').replace(/[^\d-]/g, '')) || 0);
  return Math.max(0, Math.min(1e11, n));
}

// Ngày của một buổi lễ (việc "sau cưới" tính theo ngày cưới)
function eventDate(w, e) {
  return e === 'damngo' ? w.damngo : e === 'anhoi' ? w.anhoi : w.date;
}
// Tên lễ theo miền (miền Nam gọi "đám hỏi")
function eventNames(w) {
  return Object.fromEntries(EVENT_ORDER.map((k) => [k, (w.region === 'nam' && EVENTS[k].nam) || EVENTS[k].name]));
}

module.exports = {
  REGIONS, BUDGET_CATS, TASK_CATS, EVENT_ORDER, create, ensure, get, isMember, migrate, syncFromCard, syncToCards, prefill, update, reseed, money,
  eventDate, eventNames,
};
