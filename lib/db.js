// Kho dữ liệu dạng file JSON — đủ cho giai đoạn đầu (vài nghìn thiệp).
// Khi lớn hơn, thay module này bằng Postgres/Supabase mà không phải sửa nơi khác nhiều.
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'db.json');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const empty = () => ({ users: [], sessions: {}, cards: [], guests: [], rsvps: [], wishes: [], orders: [], weddings: [], tasks: [], budget: [] });

let db;
try {
  db = Object.assign(empty(), JSON.parse(fs.readFileSync(FILE, 'utf8')));
} catch (e) {
  if (e.code !== 'ENOENT') throw e; // file hỏng thì dừng hẳn, không ghi đè mất dữ liệu
  db = empty();
}

let timer = null;
function flush() {
  if (timer) { clearTimeout(timer); timer = null; }
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, FILE);
}
function save() {
  if (!timer) timer = setTimeout(flush, 150);
}

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => { flush(); process.exit(0); });
}

module.exports = { db, save, flush, DATA_DIR, UPLOAD_DIR };
