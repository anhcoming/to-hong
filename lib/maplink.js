// Link Google Maps người dùng dán vào (link rút gọn maps.app.goo.gl, link chia sẻ, link trình duyệt)
// → toạ độ ghim + tên địa điểm, để bản đồ trên thiệp chỉ đúng chỗ thay vì đoán theo chữ địa chỉ.
const HOSTS = /^(maps\.app\.goo\.gl|goo\.gl|(www\.|maps\.)?google\.com(\.vn)?)$/i;
const isMaps = (u) => { try { const x = new URL(u); return x.protocol === 'https:' && HOSTS.test(x.hostname); } catch { return false; } };

const num = (s) => (s != null && /^-?\d{1,3}\.\d+$/.test(s) ? +(+s).toFixed(6) : null);
const ok = (lat, lng) => lat != null && lng != null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
const words = (s) => { try { return decodeURIComponent(String(s).replace(/\+/g, ' ')).trim(); } catch { return String(s || '').trim(); } };
const COORD_Q = /^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/;

// đọc toạ độ + tên từ một link Google Maps đầy đủ (không cần mạng)
function parse(u) {
  let x; try { x = new URL(u); } catch { return null; }
  let s = x.href; try { s = decodeURIComponent(s); } catch { /* giữ nguyên */ }
  let lat = null, lng = null, m;
  const set = (a, b) => { if (!ok(lat, lng)) { lat = num(a); lng = num(b); if (!ok(lat, lng)) lat = lng = null; } };
  if ((m = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/.exec(s))) set(m[1], m[2]); // đúng ghim của địa điểm
  const q = x.searchParams.get('q') || x.searchParams.get('query') || x.searchParams.get('daddr') || x.searchParams.get('destination') || '';
  if ((m = COORD_Q.exec(q))) set(m[1], m[2]);
  if ((m = /@(-?\d+\.\d+),(-?\d+\.\d+)/.exec(s))) set(m[1], m[2]); // tâm khung nhìn
  if ((m = /[?&](?:ll|center)=(-?\d+\.\d+),(-?\d+\.\d+)/.exec(s))) set(m[1], m[2]);
  let name = '';
  if ((m = /\/maps\/(?:place|search|dir\/[^/]*)\/([^/@?]+)/.exec(x.pathname))) name = words(m[1]);
  // q chữ (vd. "Nhà hàng X, 10 ngõ 138 …") — chính Google ghi khi chia sẻ → dùng làm truy vấn bản đồ
  const query = q && !COORD_Q.test(q) ? q.trim().slice(0, 300) : '';
  if (!name && query) name = query.split(',')[0].trim();
  return { lat: ok(lat, lng) ? lat : null, lng: ok(lat, lng) ? lng : null, name: name.slice(0, 200), query };
}

// trang Google Maps (khi link không mang toạ độ): toạ độ nằm trong ảnh xem trước / dữ liệu khởi tạo
function fromPage(html) {
  let m;
  if ((m = /center=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/.exec(html))) return [num(m[1]), num(m[2])];
  if ((m = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/.exec(html))) return [num(m[1]), num(m[2])];
  if ((m = /\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/.exec(html))) return [num(m[1]), num(m[2])];
  return null;
}
const ogTitle = (html) => { const m = /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/.exec(html) || /<meta[^>]+content="([^"]+)"[^>]+property="og:title"/.exec(html); return m ? m[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').split(' · ')[0].trim() : ''; };

const UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';
async function get(url) {
  return fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(6000), headers: { 'User-Agent': UA, 'Accept-Language': 'vi,en;q=0.8', Cookie: 'CONSENT=YES+cb' } });
}

// mở link rút gọn (theo chuyển hướng, chỉ trong các tên miền của Google) rồi đọc
async function resolve(u, hops = 6) {
  if (!isMaps(u)) return null;
  let cur = u, best = parse(u) || {}, page = null;
  const chain = [u];
  for (let i = 0; i < hops; i++) {
    const p = parse(cur) || {};
    best = { lat: p.lat ?? best.lat, lng: p.lng ?? best.lng, name: p.name || best.name, query: p.query || best.query };
    if (best.lat != null) break;
    let r;
    try { r = await get(cur); } catch { break; }
    const loc = r.status >= 300 && r.status < 400 && r.headers.get('location');
    if (!loc) { if (r.ok) page = await r.text().catch(() => null); break; }
    const next = new URL(loc, cur).href;
    chain.push(next);
    if (!isMaps(next)) break; // vd. trang đồng ý cookie → dừng, dùng những gì đã đọc được
    cur = next;
  }
  // link không mang toạ độ → đọc trong trang (đã tải ở trên, hoặc tải trang đích lần cuối)
  if (best.lat == null) {
    if (!page && /google\./.test(new URL(cur).hostname)) {
      try { const r = await get(cur); if (r.ok) page = await r.text(); } catch { /* bỏ qua */ }
    }
    if (page) {
      const c = fromPage(page.slice(0, 3e6));
      if (c && ok(c[0], c[1])) { best.lat = c[0]; best.lng = c[1]; }
      if (!best.name) best.name = ogTitle(page);
    }
  }
  if (best.lat == null && !best.name && !best.query) return { chain };
  return { lat: best.lat ?? null, lng: best.lng ?? null, name: best.name || '', query: best.query || '', url: cur, chain };
}

// URL khung bản đồ nhúng: ghim đúng toạ độ, hoặc truy vấn chính Google ghi trong link chia sẻ
const embed = (pin) => (/^q:/.test(pin) ? `https://www.google.com/maps?q=${encodeURIComponent(pin.slice(2))}&output=embed` : `https://www.google.com/maps?q=${pin}&z=16&output=embed`);

module.exports = { isMaps, parse, resolve, embed, fromPage };
