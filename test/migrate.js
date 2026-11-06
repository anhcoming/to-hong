// Kiểm thử chuyển dữ liệu: bản cũ (khách gắn theo thiệp) → mô hình đám cưới.
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'thiep-mig-'));
fs.mkdirSync(path.join(dir, 'uploads'));
const card = {
  id: 'c1', userId: 'u1', slug: 'cu', title: 'Thiệp cũ', template: 'hy', palette: 'do-son', status: 'published', paid: false, views: 3,
  data: { groom: { name: 'An', fullName: '', father: 'Ông A', mother: '', address: '' }, bride: { name: 'Bình', fullName: '', father: '', mother: 'Bà B', address: '' }, date: '2027-03-01', time: '10:00', events: [], photos: [], gifts: {}, show: {} },
  createdAt: 1, updatedAt: 2, publishedAt: 1,
};
fs.writeFileSync(path.join(dir, 'db.json'), JSON.stringify({
  users: [{ id: 'u1', email: 'cu@test.vn', name: 'Cũ', salt: 'x', passHash: 'y', isAdmin: true, createdAt: 1 }],
  sessions: {}, cards: [card],
  guests: [{ id: 'g1', cardId: 'c1', code: 'abc123', name: 'Chú Ba', side: 'trai', createdAt: 1, openedAt: null, opens: 2 }],
  rsvps: [], wishes: [], orders: [],
}));
process.env.DATA_DIR = dir;
require('../server');
const { db } = require('../lib/db');

assert.equal(db.weddings.length, 1, 'tạo đám cưới cho người dùng cũ');
const w = db.weddings[0];
assert.equal(db.cards[0].weddingId, w.id);
assert.equal(w.couple.groom.name, 'An');
assert.equal(w.couple.bride.mother, 'Bà B');
assert.equal(w.date, '2027-03-01');
const g = db.guests[0];
assert.equal(g.weddingId, w.id, 'khách cũ chuyển sang đám cưới');
assert.equal(g.count, 1);
assert.equal(g.invited, true, 'khách đã mở thiệp coi như đã mời');
assert.ok(db.tasks.length > 20 && db.budget.length > 10, 'có sẵn việc & ngân sách mẫu');
console.log('✓ Chuyển dữ liệu cũ đúng');
process.exit(0);
