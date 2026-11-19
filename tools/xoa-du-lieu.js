// Dọn dữ liệu người dùng trên kho Postgres/Supabase (vd. prod) để web về trạng thái "chưa ai vào".
//   Xem trước (KHÔNG xoá gì):  DB_URL='postgres://…' node tools/xoa-du-lieu.js [--tat-ca]
//   Xoá thật:                  DB_URL='postgres://…' node tools/xoa-du-lieu.js [--tat-ca] --xoa
// Mặc định xoá THIỆP và mọi thứ gắn với thiệp: thiệp (nháp + đã phát hành), khách mời, xác nhận tham dự, lời chúc,
// đơn hàng của thiệp, giao dịch ngân hàng. Thêm --tat-ca để xoá luôn tài khoản, phiên đăng nhập, sổ tay cưới (đám cưới,
// việc cần làm, ngân sách) và bộ đếm lượt truy cập.
// Luôn giữ: mã giảm giá, cài đặt trang quản trị (giá, khuyến mãi…), nhật ký quản trị.
// Trước khi xoá, toàn bộ dữ liệu được lưu vào data/sao-luu-<thời điểm>.json (thư mục data/ không lên git).
// Ghi theo đúng khoá + mã phiên bản như máy chủ → không đè lên thay đổi đang diễn ra; nên chạy lúc vắng khách.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { Pool } = require('pg');

const argv = process.argv.slice(2);
const XOA = argv.includes('--xoa'), TAT_CA = argv.includes('--tat-ca');
const PREFIX = (process.env.REDIS_PREFIX || process.env.DB_PREFIX || 'cuoinha').replace(/\W/g, '_');
const STORE = `${PREFIX}_store`, LOCK = `${PREFIX}_lock`, STATS = `${PREFIX}_stats`;
const THIEP = ['cards', 'guests', 'rsvps', 'wishes', 'orders', 'bankTxns'];
const NGUOI = ['users', 'sessions', 'weddings', 'tasks', 'budget', 'stats'];
const TEN = { cards: 'thiệp', guests: 'khách mời', rsvps: 'xác nhận tham dự', wishes: 'lời chúc', orders: 'đơn hàng', bankTxns: 'giao dịch ngân hàng',
  users: 'tài khoản', sessions: 'phiên đăng nhập', weddings: 'đám cưới (sổ tay)', tasks: 'việc cần làm', budget: 'ngân sách', stats: 'bộ đếm truy cập (trong kho chính)' };
const XOA_KEYS = TAT_CA ? THIEP.concat(NGUOI) : THIEP;

const raw = process.env.DB_URL || process.env.POSTGRES_URL || '';
if (!raw) { console.error('Cần đặt DB_URL (chuỗi kết nối Postgres của kho muốn dọn).'); process.exit(1); }
const url = raw.replace(/([?&])sslmode=[^&]*&?/, '$1').replace(/[?&]$/, '');
const pool = new Pool({ connectionString: url, ssl: /@(localhost|127\.0\.0\.1)[:/]/.test(url) ? false : { rejectUnauthorized: false }, max: 1, connectionTimeoutMillis: 10000 });
const dem = (v) => (Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.keys(v).length : 0);

(async () => {
  const host = url.replace(/^.*@/, '').replace(/[/?].*$/, '');
  console.log(`Kho: ${host} · bảng ${STORE}`);
  const { rows } = await pool.query(`select ver, data from ${STORE} where id = 'main'`);
  if (!rows.length) throw new Error('Kho chưa có dữ liệu');
  const d = JSON.parse(rows[0].data);
  const cards = d.cards || [];
  console.log(`\nThiệp: ${cards.length} (nháp ${cards.filter((c) => c.status !== 'published').length}, đã phát hành ${cards.filter((c) => c.status === 'published').length})`);
  const paid = (d.orders || []).filter((o) => o.status === 'paid');
  if (paid.length) console.log(`⚠ Có ${paid.length} đơn ĐÃ THANH TOÁN — xoá là mất dấu tiền khách đã trả (bản sao lưu vẫn giữ).`);
  console.log('\nSẽ XOÁ:');
  for (const k of XOA_KEYS) console.log(`  - ${TEN[k]} (${k}): ${dem(d[k])}`);
  console.log('Giữ nguyên:');
  for (const k of Object.keys(d).filter((k) => !XOA_KEYS.includes(k))) console.log(`  - ${k}: ${dem(d[k])}`);
  let soStats = 0;
  if (TAT_CA) { try { soStats = +(await pool.query(`select count(*) n from ${STATS}`)).rows[0].n; console.log(`Bảng ${STATS} (lượt truy cập): ${soStats} dòng → xoá`); } catch { /* chưa có bảng */ } }

  if (!XOA) { console.log('\n(Chỉ xem trước — chưa xoá gì. Thêm --xoa để xoá thật.)'); return; }

  // sao lưu trước
  const dir = path.join(__dirname, '..', 'data'); fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `sao-luu-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(file, JSON.stringify({ ver: rows[0].ver, data: d }));
  console.log(`\nĐã sao lưu: ${file}`);

  // khoá giống máy chủ, đọc lại bản mới nhất, xoá, ghi so-rồi-đổi theo mã phiên bản
  const token = crypto.randomBytes(8).toString('hex');
  for (let i = 0; ; i++) {
    const r = await pool.query(`insert into ${LOCK} (id, token, exp) values ('main', $1, now() + interval '20 seconds')
      on conflict (id) do update set token = excluded.token, exp = excluded.exp where ${LOCK}.exp < now()`, [token]);
    if (r.rowCount === 1) break;
    if (i > 50) throw new Error('Không lấy được khoá kho (máy chủ đang ghi liên tục) — thử lại sau');
    await new Promise((ok) => setTimeout(ok, 300));
  }
  try {
    const cur = (await pool.query(`select ver, data from ${STORE} where id = 'main'`)).rows[0];
    const nd = JSON.parse(cur.data);
    for (const k of XOA_KEYS) nd[k] = k === 'sessions' || k === 'stats' ? {} : [];
    const ver = crypto.randomBytes(8).toString('hex');
    const u = await pool.query(`update ${STORE} set ver = $2, data = $3 where id = 'main' and ver = $1`, [cur.ver, ver, JSON.stringify(nd)]);
    if (u.rowCount !== 1) throw new Error('Dữ liệu vừa đổi giữa chừng — chưa xoá gì, chạy lại');
    if (TAT_CA && soStats) await pool.query(`delete from ${STATS}`);
    console.log('Đã xoá xong. Máy chủ tự nạp bản mới ở request kế tiếp.');
  } finally { await pool.query(`delete from ${LOCK} where id = 'main' and token = $1`, [token]).catch(() => {}); }
})().catch((e) => { console.error('LỖI:', e.message); process.exitCode = 1; }).finally(() => pool.end().catch(() => {}));
