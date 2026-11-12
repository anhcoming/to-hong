// Link Google Maps người dùng dán vào (link rút gọn maps.app.goo.gl, link chia sẻ, link trình duyệt)
// → toạ độ ghim + tên địa điểm, để bản đồ trên thiệp chỉ đúng chỗ thay vì đoán theo chữ địa chỉ.
const HOSTS = /^(maps\.app\.goo\.gl|goo\.gl|(www\.|maps\.)?google\.com(\.vn)?)$/i;
const isMaps = (u) => { try { const x = new URL(u); return x.protocol === 'https:' && HOSTS.test(x.hostname); } catch { return false; } };

const num = (s) => (s != null && /^-?\d{1,3}\.\d+$/.test(s) ? +(+s).toFixed(6) : null);
const ok = (lat, lng) => lat != null && lng != null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
const words = (s) => { try { return decodeURIComponent(String(s).replace(/\+/g, ' ')).trim(); } catch { return ''; } };

// đọc toạ độ + tên từ một link Google Maps đầy đủ (không cần mạng)
function parse(u) {
  let x; try { x = new URL(u); } catch { return null; }
  const s = decodeURIComponent(x.href);
  let lat = null, lng = null, m;
  if ((m = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/.exec(s))) { lat = num(m[1]); lng = num(m[2]); } // đúng ghim của địa điểm
  const q = x.searchParams.get('q') || x.searchParams.get('query') || x.searchParams.get('daddr') || x.searchParams.get('destination') || '';
  if (!ok(lat, lng) && (m = /^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/.exec(q))) { lat = num(m[1]); lng = num(m[2]); }
  if (!ok(lat, lng) && (m = /@(-?\d+\.\d+),(-?\d+\.\d+)/.exec(s))) { lat = num(m[1]); lng = num(m[2]); } // tâm khung nhìn
  if (!ok(lat, lng) && (m = /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/.exec(s))) { lat = num(m[1]); lng = num(m[2]); }
  let name = '';
  if ((m = /\/maps\/(?:place|search|dir\/[^/]*)\/([^/@?]+)/.exec(x.pathname))) name = words(m[1]);
  if (!name && q && !/^\s*-?\d+\.\d+\s*,/.test(q)) name = words(q);
  return { lat: ok(lat, lng) ? lat : null, lng: ok(lat, lng) ? lng : null, name: name.slice(0, 200) };
}

// mở link rút gọn (theo chuyển hướng, chỉ trong các tên miền của Google) rồi đọc
async function resolve(u, hops = 5) {
  if (!isMaps(u)) return null;
  let cur = u;
  for (let i = 0; i < hops; i++) {
    const p = parse(cur);
    if (p && p.lat != null) return { ...p, url: cur };
    let r;
    try {
      r = await fetch(cur, { redirect: 'manual', signal: AbortSignal.timeout(5000), headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36', 'Accept-Language': 'vi' } });
    } catch { break; }
    const loc = r.status >= 300 && r.status < 400 && r.headers.get('location');
    if (!loc) break;
    const next = new URL(loc, cur).href;
    if (!isMaps(next)) break; // vd. trang đồng ý cookie → dừng, dùng những gì đã đọc được
    cur = next;
  }
  const p = parse(cur);
  return p && (p.lat != null || p.name) ? { ...p, url: cur } : null;
}

// URL khung bản đồ nhúng ghim đúng toạ độ
const embed = (pin) => `https://www.google.com/maps?q=${pin}&z=16&output=embed`;

module.exports = { isMaps, parse, resolve, embed };
