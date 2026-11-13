// Thống kê truy cập: bộ đếm theo ngày (giờ Việt Nam) cho lượt xem trang, khách ghé, nguồn tới, lượt xem / dùng từng mẫu.
// Không cookie, không lưu IP hay thông tin cá nhân — chỉ cộng dồn con số.
// - Postgres (bản chạy thật): bảng riêng <prefix>_stats, mỗi lượt là một câu upsert cộng 1 → không đụng khoá của kho dữ liệu chính.
// - Chạy bằng file / Redis: giữ trong db.stats = { 'YYYY-MM-DD': { 'loại|khoá': số } }.
const store = require('./db');
const { db, save } = store;

const pg = store.backend && store.backend.query ? store.backend : null;
const T = pg ? `${pg.prefix}_stats` : '';
let ready = null;
async function q(sql, args) {
  if (!ready) {
    ready = pg.query(`create table if not exists ${T} (day date not null, kind text not null, key text not null, n integer not null default 0, primary key (day, kind, key));
      alter table ${T} enable row level security;`).catch((e) => { ready = null; throw e; });
  }
  await ready;
  return pg.query(sql, args);
}

const today = (t = Date.now()) => new Date(t + 7 * 36e5).toISOString().slice(0, 10);

// items: [[loại, khoá], …] — mỗi cặp cộng 1 cho hôm nay. Không bao giờ ném lỗi, không chờ quá 0,5 giây.
async function hit(items) {
  const seen = new Set();
  items = items.filter(([k, key]) => k && key && !seen.has(k + '|' + key) && seen.add(k + '|' + key)).map(([k, key]) => [String(k).slice(0, 20), String(key).slice(0, 80)]);
  if (!items.length) return;
  try {
    if (pg) {
      const run = q(`insert into ${T} (day, kind, key, n) select $1::date, t.k, t.key, 1 from unnest($2::text[], $3::text[]) as t(k, key)
        on conflict (day, kind, key) do update set n = ${T}.n + 1`, [today(), items.map((x) => x[0]), items.map((x) => x[1])]);
      run.catch(() => {});
      await Promise.race([run, new Promise((ok) => setTimeout(ok, 500))]);
      return;
    }
    if (store.remote) return; // Redis: chưa hỗ trợ bộ đếm riêng
    const s = (db.stats = db.stats || {});
    const d = (s[today()] = s[today()] || {});
    items.forEach(([k, key]) => { d[k + '|' + key] = (d[k + '|' + key] || 0) + 1; });
    save();
  } catch (e) { console.error('Thống kê:', e.message); }
}

// Các dòng { day, kind, key, n } của `days` ngày gần nhất (kể cả hôm nay)
async function range(days) {
  const from = today(Date.now() - (days - 1) * 864e5);
  if (pg) {
    const r = await q(`select to_char(day, 'YYYY-MM-DD') as day, kind, key, n from ${T} where day >= $1::date`, [from]);
    return r.rows;
  }
  const out = [];
  Object.entries(db.stats || {}).forEach(([day, m]) => {
    if (day < from) return;
    Object.entries(m).forEach(([kk, n]) => { const i = kk.indexOf('|'); out.push({ day, kind: kk.slice(0, i), key: kk.slice(i + 1), n }); });
  });
  return out;
}

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|headless|lighthouse|curl|wget|python-requests|vercel-screenshot/i;
const isBot = (req) => { const ua = String(req.headers['user-agent'] || ''); return !ua || BOT.test(ua); };

// Nguồn tới: utm_source hoặc tên miền trang giới thiệu; không có thì đoán theo trình duyệt trong ứng dụng (Zalo, Facebook, TikTok)
function source(ref, req) {
  const r = String(ref || '').toLowerCase().replace(/[^a-z0-9.-]/g, '').slice(0, 40);
  const ua = String(req.headers['user-agent'] || '');
  const s = r || (/zalo/i.test(ua) ? 'zalo' : /FBAN|FBAV|FB_IAB/.test(ua) ? 'facebook' : /tiktok|musical_ly|BytedanceWebview/i.test(ua) ? 'tiktok' : /Instagram/.test(ua) ? 'instagram' : '');
  if (!s) return 'Trực tiếp';
  if (/google/.test(s)) return 'Google';
  if (/facebook|^fb\.|fb\.com|fb\.me|messenger/.test(s)) return 'Facebook';
  if (/zalo/.test(s)) return 'Zalo';
  if (/tiktok/.test(s)) return 'TikTok';
  if (/instagram/.test(s)) return 'Instagram';
  if (/youtube|youtu\.be/.test(s)) return 'YouTube';
  if (/bing|coccoc|yahoo|duckduckgo/.test(s)) return 'Tìm kiếm khác';
  return s;
}

module.exports = { hit, range, today, isBot, source };
