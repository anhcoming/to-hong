// "Đám cưới" là không gian làm việc chung: thông tin đôi, ngày cưới, việc cần làm, ngân sách, khách mời.
// Thiệp / màn LED / video đều gắn vào một đám cưới và đọc thông tin từ đây.
const { db, save } = require('./db');
const { rid, str, httpError } = require('./util');

const REGIONS = { bac: 'Miền Bắc', trung: 'Miền Trung', nam: 'Miền Nam' };

// offset: số ngày so với ngày cưới (âm = trước cưới). r: miền áp dụng (bỏ trống = mọi miền). cta: nút mua gắn với bước.
const TASKS = [
  { t: 'Thống nhất ngân sách cưới với hai bên gia đình', c: 'Ngân sách', o: -330 },
  { t: 'Chọn ngày cưới (xem tuổi, xem ngày theo gia đình)', c: 'Lễ nghi', o: -320 },
  { t: 'Lập danh sách khách mời sơ bộ hai nhà', c: 'Khách mời', o: -300, cta: 'guests' },
  { t: 'Khảo sát và đặt cọc nhà hàng / địa điểm tiệc', c: 'Tiệc cưới', o: -270 },
  { t: 'Chọn studio chụp ảnh cưới', c: 'Ảnh & phim', o: -240 },
  { t: 'Lễ dạm ngõ (chạm ngõ): nhà trai sang thưa chuyện', c: 'Lễ nghi', o: -180, r: ['bac', 'trung'], cta: 'video' },
  { t: 'Hai gia đình gặp mặt, bàn chuyện cưới hỏi', c: 'Lễ nghi', o: -180, r: ['nam'], cta: 'video' },
  { t: 'Chọn váy cưới, áo dài, vest chú rể', c: 'Trang phục', o: -160 },
  { t: 'Chụp ảnh cưới', c: 'Ảnh & phim', o: -120 },
  { t: 'Đặt nhẫn cưới', c: 'Trang sức', o: -120 },
  { t: 'Đặt thợ trang điểm cô dâu', c: 'Làm đẹp', o: -100 },
  { t: 'Đặt quay phim, MC, ban nhạc', c: 'Ảnh & phim', o: -100 },
  { t: 'Chốt danh sách khách mời', c: 'Khách mời', o: -75, cta: 'guests' },
  { t: 'Chuẩn bị tráp ăn hỏi (số lẻ: 5, 7, 9 tráp) và đội bê tráp', c: 'Lễ nghi', o: -60, r: ['bac'] },
  { t: 'Chuẩn bị lễ vật ăn hỏi: trầu cau, rượu, chè, bánh', c: 'Lễ nghi', o: -60, r: ['trung'] },
  { t: 'Chuẩn bị mâm quả đám hỏi (số chẵn: 6, 8, 10 mâm)', c: 'Lễ nghi', o: -60, r: ['nam'] },
  { t: 'Lễ ăn hỏi', c: 'Lễ nghi', o: -45, r: ['bac', 'trung'], cta: 'video' },
  { t: 'Lễ đám hỏi', c: 'Lễ nghi', o: -45, r: ['nam'], cta: 'video' },
  { t: 'Làm thiệp mời online và gửi khách', c: 'Khách mời', o: -40, cta: 'card' },
  { t: 'In thiệp giấy mời người lớn tuổi, họ hàng xa', c: 'Khách mời', o: -40 },
  { t: 'Đăng ký kết hôn tại UBND xã/phường', c: 'Giấy tờ', o: -35 },
  { t: 'Thuê xe cưới, xe đưa đón họ hàng', c: 'Di chuyển', o: -30 },
  { t: 'Thử váy lần cuối, trang điểm thử', c: 'Làm đẹp', o: -14 },
  { t: 'Nhắc khách, chốt số mâm với nhà hàng', c: 'Khách mời', o: -10, cta: 'guests' },
  { t: 'Chuẩn bị màn hình LED trình chiếu ở sảnh tiệc', c: 'Tiệc cưới', o: -10, cta: 'led' },
  { t: 'Lên kịch bản buổi lễ với MC và nhà hàng', c: 'Tiệc cưới', o: -7 },
  { t: 'Chuẩn bị bàn ký tên, hộp/sổ ghi tiền mừng', c: 'Tiệc cưới', o: -7 },
  { t: 'Phân công người nhà: đón khách, nhận quà, đưa dâu', c: 'Lễ nghi', o: -5 },
  { t: 'Lễ xin dâu và rước dâu', c: 'Lễ nghi', o: 0, r: ['bac', 'trung'] },
  { t: 'Lễ rước dâu (đón dâu)', c: 'Lễ nghi', o: 0, r: ['nam'] },
  { t: 'Lễ gia tiên, lễ tơ hồng', c: 'Lễ nghi', o: 0 },
  { t: 'Tiệc cưới', c: 'Tiệc cưới', o: 0 },
  { t: 'Lễ lại mặt: vợ chồng về thăm nhà gái', c: 'Lễ nghi', o: 2 },
  { t: 'Tổng kết tiền mừng, nhắn lời cảm ơn khách', c: 'Khách mời', o: 7, cta: 'guests' },
  { t: 'Thanh toán nốt các khoản còn lại', c: 'Ngân sách', o: 7, cta: 'budget' },
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
    id: rid(12), weddingId: w.id, title: x.t, category: x.c, offset: x.o, cta: x.cta || null,
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
    id: rid(12), name: '', region: REGIONS[region] ? region : 'bac', date: '', time: '', budgetTotal: 0,
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
  if (b.date !== undefined) w.date = /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : '';
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

module.exports = {
  REGIONS, BUDGET_CATS, TASK_CATS, create, ensure, get, isMember, migrate, syncFromCard, syncToCards, prefill, update, reseed, money,
};
