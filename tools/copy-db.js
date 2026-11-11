// Chép toàn bộ dữ liệu từ một Postgres/Supabase sang một cái khác (vd. chuyển Supabase về vùng Singapore).
//   Chép thẳng (cả hai kho đang chạy):
//     FROM_URL='postgres://…cũ…' TO_URL='postgres://…mới…' node tools/copy-db.js [--force]
//   Qua file (khi phải tắt kho cũ trước rồi mới tạo được kho mới):
//     FROM_URL='postgres://…cũ…' node tools/copy-db.js --dump data/backup.json
//     TO_URL='postgres://…mới…'  node tools/copy-db.js --load data/backup.json [--force]
// Kho đích đã có dữ liệu thì dừng, trừ khi thêm --force. Kho nguồn không bị thay đổi.
// Nên chạy lúc vắng khách: thay đổi ghi vào kho cũ sau khi chép sẽ không sang kho mới.
const fs = require('fs');
const { Pool } = require('pg');

const PREFIX = (process.env.REDIS_PREFIX || process.env.DB_PREFIX || 'cuoinha').replace(/\W/g, '_');
const STORE = `${PREFIX}_store`, LOCK = `${PREFIX}_lock`;
const argv = process.argv.slice(2);
const arg = (name) => { const i = argv.indexOf(name); return i < 0 ? null : argv[i + 1]; };

function pool(raw) {
  const url = raw.replace(/([?&])sslmode=[^&]*&?/, '$1').replace(/[?&]$/, '');
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  return new Pool({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false }, max: 1, connectionTimeoutMillis: 10000 });
}

const summary = (data) => {
  const d = JSON.parse(data); // hỏng thì dừng ở đây, không chép rác sang
  const count = (k) => (Array.isArray(d[k]) ? d[k].length : 0);
  return `${(data.length / 1024).toFixed(0)} KB: ${count('users')} tài khoản, ${count('cards')} thiệp, ${count('guests')} khách, ${count('orders')} đơn`;
};

async function read(url) {
  const from = pool(url);
  try {
    const src = await from.query(`select ver, data from ${STORE} where id = 'main'`);
    if (!src.rows.length) throw new Error(`Kho cũ không có dữ liệu trong bảng ${STORE}`);
    return src.rows[0];
  } finally { await from.end().catch(() => {}); }
}

async function write(url, { ver, data }) {
  const to = pool(url);
  try {
    await to.query(`create table if not exists ${STORE} (id text primary key, ver text not null, data text not null);
      create table if not exists ${LOCK} (id text primary key, token text not null, exp timestamptz not null);
      alter table ${STORE} enable row level security;
      alter table ${LOCK} enable row level security;`);
    const dst = await to.query(`select 1 from ${STORE} where id = 'main'`);
    if (dst.rows.length && !argv.includes('--force')) throw new Error('Kho mới đã có dữ liệu. Thêm --force nếu chắc chắn muốn ghi đè.');
    await to.query(`insert into ${STORE} (id, ver, data) values ('main', $1, $2)
      on conflict (id) do update set ver = excluded.ver, data = excluded.data`, [ver, data]);
    const back = await to.query(`select ver, data from ${STORE} where id = 'main'`);
    if (back.rows[0].ver !== ver || back.rows[0].data !== data) throw new Error('Dữ liệu ở kho mới không khớp bản gốc');
  } finally { await to.end().catch(() => {}); }
}

(async () => {
  const { FROM_URL, TO_URL } = process.env;
  const dump = arg('--dump'), load = arg('--load');
  if (dump) {
    if (!FROM_URL) throw new Error('Cần đặt FROM_URL (kho cũ)');
    if (fs.existsSync(dump)) throw new Error(`File ${dump} đã tồn tại — chọn tên khác để không đè bản sao lưu cũ`);
    const row = await read(FROM_URL);
    const info = summary(row.data);
    fs.writeFileSync(dump, JSON.stringify(row));
    if (JSON.parse(fs.readFileSync(dump, 'utf8')).data !== row.data) throw new Error('File vừa ghi không khớp dữ liệu gốc');
    console.log(`Đã xuất ra ${dump} (${info}).`);
  } else if (load) {
    if (!TO_URL) throw new Error('Cần đặt TO_URL (kho mới)');
    const row = JSON.parse(fs.readFileSync(load, 'utf8'));
    if (!row.ver || typeof row.data !== 'string') throw new Error(`File ${load} không phải bản xuất của công cụ này`);
    const info = summary(row.data);
    await write(TO_URL, row);
    console.log(`Đã nạp xong từ ${load} (${info}).`);
  } else {
    if (!FROM_URL || !TO_URL) throw new Error('Cần đặt FROM_URL (kho cũ) và TO_URL (kho mới)');
    if (FROM_URL === TO_URL) throw new Error('FROM_URL và TO_URL đang trùng nhau');
    const row = await read(FROM_URL);
    const info = summary(row.data);
    await write(TO_URL, row);
    console.log(`Đã chép xong (${info}).`);
  }
})().catch((e) => { console.error('Lỗi:', e.message); process.exit(1); });
