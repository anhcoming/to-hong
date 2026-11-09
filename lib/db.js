// Kho dữ liệu: toàn bộ dữ liệu là một đối tượng JSON `db` giữ trong bộ nhớ.
// - Chạy thường (máy chủ/VPS): lưu ra file data/db.json.
// - Chạy serverless (Vercel): lưu lên Upstash Redis (biến môi trường KV_REST_API_URL/KV_REST_API_TOKEN
//   hoặc UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN). Mỗi request nạp bản mới nhất trước khi xử lý
//   và ghi lại trước khi trả lời; request ghi dữ liệu giữ một khoá trên Redis để các bản chạy song song
//   không ghi đè lên nhau.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

require('./env');

let DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
try {
  fs.mkdirSync(path.join(DATA_DIR, 'uploads'), { recursive: true });
} catch (e) {
  // Ổ đĩa chỉ đọc (vd. serverless) → dùng thư mục tạm để app vẫn chạy được.
  if (!['EROFS', 'EACCES', 'EPERM'].includes(e.code)) throw e;
  DATA_DIR = path.join(require('os').tmpdir(), 'cuoi-nha-data');
  fs.mkdirSync(path.join(DATA_DIR, 'uploads'), { recursive: true });
}
const FILE = path.join(DATA_DIR, 'db.json');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

const empty = () => ({ users: [], sessions: {}, cards: [], guests: [], rsvps: [], wishes: [], orders: [], weddings: [], tasks: [], budget: [] });

const REDIS_URL = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const remote = !!(REDIS_URL && REDIS_TOKEN);
if (process.env.VERCEL && !remote) {
  console.warn('CHƯA CÓ REDIS: dữ liệu chỉ nằm trong /tmp và sẽ mất. Hãy gắn Upstash Redis cho dự án trên Vercel.');
}

const db = empty();
const afterLoad = [];

// Thay nội dung db tại chỗ (các module khác giữ tham chiếu tới chính đối tượng này).
function replace(data) {
  for (const k of Object.keys(db)) delete db[k];
  Object.assign(db, empty(), data || {});
}

// ---------------- chế độ file ----------------
let timer = null;
function flush() {
  if (remote) return;
  if (timer) { clearTimeout(timer); timer = null; }
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, FILE);
}

if (!remote) {
  try {
    replace(JSON.parse(fs.readFileSync(FILE, 'utf8')));
  } catch (e) {
    if (e.code !== 'ENOENT') throw e; // file hỏng thì dừng hẳn, không ghi đè mất dữ liệu
  }
  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => { flush(); process.exit(0); });
  }
}

// ---------------- chế độ Redis ----------------
const PREFIX = process.env.REDIS_PREFIX || 'cuoinha';
const K = { data: `${PREFIX}:db`, ver: `${PREFIX}:ver`, lock: `${PREFIX}:lock` };
const LOCK_TTL = 20000;
let localVer = null; // phiên bản dữ liệu đang có trong bộ nhớ
let loaded = false;
let dirty = false;

async function redis(cmd) {
  const r = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const out = await r.json().catch(() => ({}));
  if (!r.ok || out.error) throw new Error(`Redis ${cmd[0]}: ${out.error || r.status}`);
  return out.result;
}

const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
async function acquire() {
  const token = crypto.randomBytes(12).toString('hex');
  const until = Date.now() + 15000;
  for (let wait = 20; ; wait = Math.min(wait * 1.5, 200)) {
    if ((await redis(['SET', K.lock, token, 'NX', 'PX', String(LOCK_TTL)])) === 'OK') return token;
    if (Date.now() > until) throw new Error('Hết thời gian chờ khoá dữ liệu');
    await sleep(wait + Math.random() * 20);
  }
}
const RELEASE = "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0";
const release = (token) => redis(['EVAL', RELEASE, '1', K.lock, token]).catch((e) => console.error(e));

// Ghi khi phiên bản trên Redis vẫn là bản mình đã nạp (tránh đè dữ liệu mới hơn).
const CAS = "local v = redis.call('GET', KEYS[1]) if (v == false and ARGV[1] == '') or v == ARGV[1] then "
  + "redis.call('SET', KEYS[2], ARGV[3]) redis.call('SET', KEYS[1], ARGV[2]) return 1 end return 0";

async function sync() {
  const ver = await redis(['GET', K.ver]);
  if (loaded && ver === localVer) return;
  const raw = ver === null ? null : await redis(['GET', K.data]);
  replace(raw ? JSON.parse(raw) : null);
  localVer = ver;
  loaded = true;
  dirty = false;
  afterLoad.forEach((fn) => fn());
}

async function commit(lockToken) {
  if (!dirty) return;
  let token = lockToken;
  if (!token) token = await acquire();
  try {
    const nv = crypto.randomBytes(8).toString('hex');
    const ok = await redis(['EVAL', CAS, '2', K.ver, K.data, localVer || '', nv, JSON.stringify(db)]);
    if (ok === 1) { localVer = nv; dirty = false; } else {
      console.warn('Bỏ qua thay đổi vì dữ liệu đã được cập nhật ở nơi khác');
      loaded = false; // lần sau nạp lại
    }
  } finally {
    if (!lockToken) await release(token);
  }
}

// Gọi đầu mỗi request (chế độ Redis). Trả về hàm cần gọi trước khi trả lời.
async function begin(method) {
  if (!remote) return null;
  const writes = method !== 'GET' && method !== 'HEAD';
  const token = writes ? await acquire() : null;
  try {
    await sync();
  } catch (e) {
    if (token) await release(token);
    throw e;
  }
  let done = false;
  return async function finish() {
    if (done) return;
    done = true;
    try { await commit(token); } finally { if (token) await release(token); }
  };
}

function save() {
  if (remote) { dirty = true; return; }
  if (!timer) timer = setTimeout(flush, 150);
}

// Hàm chạy lại mỗi khi nạp dữ liệu mới (vd. chuyển đổi dữ liệu cũ). Chế độ file: chạy ngay.
function onLoad(fn) {
  afterLoad.push(fn);
  if (!remote) fn();
}

module.exports = { db, save, flush, begin, onLoad, remote, DATA_DIR, UPLOAD_DIR };
