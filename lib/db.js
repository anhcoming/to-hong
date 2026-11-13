// Kho dữ liệu: toàn bộ dữ liệu là một đối tượng JSON `db` giữ trong bộ nhớ.
// - Chạy thường (máy chủ/VPS): lưu ra file data/db.json.
// - Chạy serverless (Vercel): lưu lên Postgres/Supabase (POSTGRES_URL hoặc DATABASE_URL) hoặc Upstash Redis
//   (KV_REST_API_URL/KV_REST_API_TOKEN hoặc UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN). Mỗi request nạp
//   bản mới nhất trước khi xử lý và ghi lại trước khi trả lời; request ghi dữ liệu giữ một khoá trong kho để
//   các bản chạy song song không ghi đè lên nhau.
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

const empty = () => ({ users: [], sessions: {}, cards: [], guests: [], rsvps: [], wishes: [], orders: [], bankTxns: [], weddings: [], tasks: [], budget: [] });

const REDIS_URL = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
// Postgres (Supabase gắn qua Vercel đặt sẵn POSTGRES_URL) được ưu tiên hơn Redis.
const PG_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL || '';
const remote = !!PG_URL || !!(REDIS_URL && REDIS_TOKEN);
if (process.env.VERCEL && !remote) {
  console.warn('CHƯA CÓ CƠ SỞ DỮ LIỆU: dữ liệu chỉ nằm trong /tmp và sẽ mất. Hãy gắn Supabase (hoặc Upstash Redis) cho dự án trên Vercel.');
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

// ---------------- chế độ kho từ xa (Postgres/Supabase hoặc Redis) ----------------
// Hai kho dùng chung một cách làm: một bản ghi chứa toàn bộ dữ liệu + mã phiên bản, một khoá có hạn
// để các request ghi chạy song song không đè nhau, và ghi kiểu "so-rồi-đổi" theo mã phiên bản.
const PREFIX = process.env.REDIS_PREFIX || process.env.DB_PREFIX || 'cuoinha';
const LOCK_TTL = 20000;
const HEX = /^[0-9a-f]+$/;

function redisBackend() {
  const K = { data: `${PREFIX}:db`, ver: `${PREFIX}:ver`, lock: `${PREFIX}:lock` };
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
  const RELEASE = "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0";
  const CAS = "local v = redis.call('GET', KEYS[1]) if (v == false and ARGV[1] == '') or v == ARGV[1] then "
    + "redis.call('SET', KEYS[2], ARGV[3]) redis.call('SET', KEYS[1], ARGV[2]) return 1 end return 0";
  return {
    name: 'Redis',
    async read(knownVer) {
      const ver = await redis(['GET', K.ver]);
      if (ver === null) return { ver: null, raw: null };
      if (ver === knownVer) return { ver, same: true };
      return { ver, raw: await redis(['GET', K.data]) };
    },
    lock: async (token) => (await redis(['SET', K.lock, token, 'NX', 'PX', String(LOCK_TTL)])) === 'OK',
    unlock: (token) => redis(['EVAL', RELEASE, '1', K.lock, token]),
    cas: async (oldVer, newVer, raw) => (await redis(['EVAL', CAS, '2', K.ver, K.data, oldVer || '', newVer, raw])) === 1,
  };
}

// Postgres (Supabase): bảng <prefix>_store giữ dữ liệu, bảng <prefix>_lock giữ khoá. Tự tạo bảng lần đầu.
// Bật RLS và không cấp quyền nào → API công khai của Supabase không đọc được (chỉ máy chủ này đọc).
function pgBackend() {
  const { Pool } = require('pg');
  const id = PREFIX.replace(/\W/g, '_');
  const T = { store: `${id}_store`, lock: `${id}_lock` };
  // bỏ sslmode trong chuỗi kết nối để tự đặt ssl (chứng chỉ của Supabase pooler không nằm trong kho gốc của Node)
  const url = PG_URL.replace(/([?&])sslmode=[^&]*&?/, '$1').replace(/[?&]$/, '');
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  const pool = new Pool({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false }, max: +process.env.PG_POOL_MAX || 3, idleTimeoutMillis: 10000, connectionTimeoutMillis: 8000 });
  pool.on('error', (e) => console.error('Postgres:', e.message));
  let ready = null;
  const q = async (sql, args) => {
    if (!ready) {
      ready = pool.query(`create table if not exists ${T.store} (id text primary key, ver text not null, data text not null);
        create table if not exists ${T.lock} (id text primary key, token text not null, exp timestamptz not null);
        alter table ${T.store} enable row level security;
        alter table ${T.lock} enable row level security;`).catch((e) => { ready = null; throw e; });
    }
    await ready;
    return pool.query(sql, args);
  };
  return {
    name: 'Postgres',
    async read(knownVer) {
      const r = await q(`select ver, case when ver = $1::text then null else data end as data from ${T.store} where id = 'main'`, [knownVer || '']);
      if (!r.rows.length) return { ver: null, raw: null };
      const { ver, data } = r.rows[0];
      return ver === knownVer ? { ver, same: true } : { ver, raw: data };
    },
    lock: async (token) => (await q(`insert into ${T.lock} (id, token, exp) values ('main', $1, now() + $2::int * interval '1 millisecond')
      on conflict (id) do update set token = excluded.token, exp = excluded.exp where ${T.lock}.exp < now()`, [token, LOCK_TTL])).rowCount === 1,
    unlock: (token) => q(`delete from ${T.lock} where id = 'main' and token = $1`, [token]),
    cas: async (oldVer, newVer, raw) => (oldVer
      ? await q(`update ${T.store} set ver = $2, data = $3 where id = 'main' and ver = $1`, [oldVer, newVer, raw])
      : await q(`insert into ${T.store} (id, ver, data) values ('main', $1, $2) on conflict (id) do nothing`, [newVer, raw])).rowCount === 1,
    // Hai thao tác gộp dưới đây giúp một request ghi chỉ tốn 2 lượt đi-về tới kho thay vì 4.
    // Lấy khoá + đọc dữ liệu trong một lượt (hai câu lệnh gửi cùng lúc; câu sau chỉ trả dữ liệu khi đã giữ khoá).
    // Trả null nếu chưa lấy được khoá. Gửi nhiều câu lệnh thì không dùng được tham số → chỉ nhận chuỗi hex.
    async lockRead(token, knownVer) {
      if (!HEX.test(token)) throw new Error('Mã khoá không hợp lệ');
      const known = knownVer && HEX.test(knownVer) ? knownVer : '';
      const r = await q(`insert into ${T.lock} (id, token, exp) values ('main', '${token}', now() + ${LOCK_TTL} * interval '1 millisecond')
          on conflict (id) do update set token = excluded.token, exp = excluded.exp where ${T.lock}.exp < now();
        select ver, case when ver = '${known}' then null else data end as data from ${T.store}
          where id = 'main' and exists (select 1 from ${T.lock} where id = 'main' and token = '${token}')`);
      if (r[0].rowCount !== 1) return null;
      if (!r[1].rows.length) return { ver: null, raw: null };
      const { ver, data } = r[1].rows[0];
      return known && ver === known ? { ver, same: true } : { ver, raw: data };
    },
    // Ghi dữ liệu + nhả khoá trong một lượt.
    casUnlock: async (oldVer, newVer, raw, token) => (oldVer
      ? await q(`with u as (update ${T.store} set ver = $2, data = $3 where id = 'main' and ver = $1 returning 1),
          d as (delete from ${T.lock} where id = 'main' and token = $4)
          select count(*)::int as ok from u`, [oldVer, newVer, raw, token])
      : await q(`with u as (insert into ${T.store} (id, ver, data) values ('main', $1, $2) on conflict (id) do nothing returning 1),
          d as (delete from ${T.lock} where id = 'main' and token = $3)
          select count(*)::int as ok from u`, [newVer, raw, token])).rows[0].ok === 1,
    query: q, prefix: id, // dùng chung kết nối cho bảng thống kê truy cập (lib/stats.js)
    end: () => pool.end(),
  };
}

const backend = PG_URL ? pgBackend() : remote ? redisBackend() : null;
let localVer = null; // phiên bản dữ liệu đang có trong bộ nhớ
let loaded = false;
let dirty = false;

const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
async function acquire() {
  const token = crypto.randomBytes(12).toString('hex');
  const until = Date.now() + 15000;
  for (let wait = 20; ; wait = Math.min(wait * 1.5, 200)) {
    if (await backend.lock(token)) return token;
    if (Date.now() > until) throw new Error('Hết thời gian chờ khoá dữ liệu');
    await sleep(wait + Math.random() * 20);
  }
}
const release = (token) => Promise.resolve(backend.unlock(token)).catch((e) => console.error(e));

function apply(r) {
  if (loaded && r.same) return;
  replace(r.raw ? JSON.parse(r.raw) : null);
  localVer = r.ver;
  loaded = true;
  dirty = false;
  afterLoad.forEach((fn) => fn());
}
const sync = async () => apply(await backend.read(loaded ? localVer : null));

// Lấy khoá rồi nạp dữ liệu mới nhất. Kho hỗ trợ thì làm cả hai trong một lượt đi-về.
async function acquireSync() {
  if (!backend.lockRead) {
    const token = await acquire();
    try { await sync(); } catch (e) { await release(token); throw e; }
    return token;
  }
  const token = crypto.randomBytes(12).toString('hex');
  const until = Date.now() + 15000;
  for (let wait = 20; ; wait = Math.min(wait * 1.5, 200)) {
    const r = await backend.lockRead(token, loaded ? localVer : null);
    if (r) {
      try { apply(r); } catch (e) { await release(token); throw e; }
      return token;
    }
    if (Date.now() > until) throw new Error('Hết thời gian chờ khoá dữ liệu');
    await sleep(wait + Math.random() * 20);
  }
}

// Ghi dữ liệu nếu có thay đổi, và luôn nhả khoá (nếu đang giữ) trước khi xong.
async function commit(lockToken) {
  let token = lockToken;
  let held = !!token;
  try {
    if (!dirty) return;
    if (!token) { token = await acquire(); held = true; }
    const nv = crypto.randomBytes(8).toString('hex');
    const raw = JSON.stringify(db);
    // Ghi khi phiên bản trong kho vẫn là bản mình đã nạp (tránh đè dữ liệu mới hơn).
    let ok;
    if (backend.casUnlock) {
      ok = await backend.casUnlock(localVer, nv, raw, token);
      held = false; // câu lệnh trên đã nhả khoá luôn
    } else ok = await backend.cas(localVer, nv, raw);
    if (ok) { localVer = nv; dirty = false; } else {
      console.warn('Bỏ qua thay đổi vì dữ liệu đã được cập nhật ở nơi khác');
      loaded = false; // lần sau nạp lại
    }
  } finally {
    if (held) await release(token);
  }
}

// Gọi đầu mỗi request (chế độ Redis). Trả về hàm cần gọi trước khi trả lời.
// Đăng nhập Google quay về bằng GET nhưng tạo phiên → cũng giữ khoá như request ghi.
async function begin(method, pathname = '') {
  if (!remote) return null;
  // Tải tệp lên không đổi dữ liệu (chỉ đẩy tệp sang kho Blob) → không giữ khoá, để nhiều ảnh tải song song
  // và không chặn các thao tác khác trong lúc chờ tệp đi qua mạng.
  const writes = ((method !== 'GET' && method !== 'HEAD') || pathname.startsWith('/auth/')) && pathname !== '/api/upload';
  let token = null;
  if (writes) token = await acquireSync(); else await sync();
  let done = false;
  return async function finish() {
    if (done) return;
    done = true;
    await commit(token);
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

module.exports = { db, save, flush, begin, onLoad, remote, backend, DATA_DIR, UPLOAD_DIR };
