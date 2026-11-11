// Mẫu "Phượng Hoàng" — hoàng gia Á Đông: nền giấy kem, hai phượng hoàng cắt giấy đỏ ôm trang bìa,
// dải lụa đỏ ngang có chữ Song Hỷ, album xếp kiểu tạp chí. Hoạ tiết vẽ bằng SVG ngay trong file.
const { esc } = require('../lib/util');

const evList = (d) => d.events.filter((e) => e.name || e.place);
// lễ chính ghi trong lời mời: lễ thành hôn → lễ đầu tiên
const mainEvent = (d) => { const evs = evList(d); return evs.find((e) => /thành hôn/i.test(e.name)) || evs[0] || null; };
const lunarOf = (s) => (s || '').replace(/^Nhằm /i, '');
const n2 = (v) => String(v).padStart(2, '0');

// ---------- phượng hoàng cắt giấy (quay sang phải; lật bằng CSS) ----------
// fill: màu thân chim; cut: màu đường cắt (trùng màu nền để trông như giấy cắt thủng)
const fx = (v) => +v.toFixed(1);
// lông cánh hình lưỡi kiếm cong, đầu mút hất lên
function feather(x, y, ang, len, w, fill, cut, sw = 1.4) {
  const d = `M0 0C${fx(len * 0.3)} ${fx(-w)} ${fx(len * 0.72)} ${fx(-w * 0.95)} ${len} ${fx(-w * 0.55)}C${fx(len * 0.78)} ${fx(-w * 0.1)} ${fx(len * 0.4)} ${fx(w * 0.55)} 0 0Z`;
  const mid = `M${fx(len * 0.12)} ${fx(-w * 0.1)}C${fx(len * 0.4)} ${fx(-w * 0.45)} ${fx(len * 0.7)} ${fx(-w * 0.55)} ${fx(len * 0.9)} ${fx(-w * 0.5)}`;
  return `<g transform="translate(${x} ${y}) rotate(${ang})"><path d="${d}" fill="${fill}" stroke="${cut}" stroke-width="${sw}" stroke-linejoin="round"/><path d="${mid}" fill="none" stroke="${cut}" stroke-width="1"/></g>`;
}
// dải lông đuôi thuôn nhọn chạy theo chuỗi đường cong bậc ba; gân giữa + vạch lông cắt thủng, có "mắt" lông
function plume(segs, w0, fill, cut, eyeAt = 0.62) {
  const pts = [];
  const N = 26;
  segs.forEach((s, si) => {
    for (let i = si ? 1 : 0; i <= N; i++) {
      const t = i / N, u = 1 - t;
      pts.push([u * u * u * s[0] + 3 * u * u * t * s[2] + 3 * u * t * t * s[4] + t * t * t * s[6], u * u * u * s[1] + 3 * u * u * t * s[3] + 3 * u * t * t * s[5] + t * t * t * s[7]]);
    }
  });
  const n = pts.length, L = [], R = [], nor = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
    const s = i / (n - 1), w = (w0 * Math.pow(1 - s, 0.8) + 1.6) / 2 * (s < 0.08 ? 0.6 + s * 5 : 1);
    nor.push([-dy, dx, w]);
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  const poly = 'M' + L.map((p) => `${fx(p[0])} ${fx(p[1])}`).join('L') + 'L' + R.reverse().map((p) => `${fx(p[0])} ${fx(p[1])}`).join('L') + 'Z';
  let barbs = '';
  for (let i = 3; i < n - 6; i += 2) {
    const [nx, ny, w] = nor[i], [x, y] = pts[i], [px, py] = pts[i - 2];
    const bx = (px - x) * 0.9, by = (py - y) * 0.9;
    barbs += `M${fx(x + nx * w * 0.78 + bx)} ${fx(y + ny * w * 0.78 + by)}L${fx(x + nx * 0.6)} ${fx(y + ny * 0.6)}M${fx(x - nx * w * 0.78 + bx)} ${fx(y - ny * w * 0.78 + by)}L${fx(x - nx * 0.6)} ${fx(y - ny * 0.6)}`;
  }
  const spine = 'M' + pts.slice(2, n - 2).map((p) => `${fx(p[0])} ${fx(p[1])}`).join('L');
  const e = pts[Math.round((n - 1) * eyeAt)], er = Math.max(4, nor[Math.round((n - 1) * eyeAt)][2] * 1.5);
  return `<path d="${poly}" fill="${fill}" stroke="${fill}" stroke-width=".6"/><path d="${barbs}" fill="none" stroke="${cut}" stroke-width="1" stroke-linecap="round"/><path d="${spine}" fill="none" stroke="${cut}" stroke-width=".9"/>`
    + `<ellipse cx="${fx(e[0])}" cy="${fx(e[1])}" rx="${fx(er + 2.5)}" ry="${fx(er + 4)}" fill="${fill}"/><ellipse cx="${fx(e[0])}" cy="${fx(e[1])}" rx="${fx(er)}" ry="${fx(er + 1.5)}" fill="none" stroke="${cut}" stroke-width="1.3"/><circle cx="${fx(e[0])}" cy="${fx(e[1])}" r="${fx(er * 0.4)}" fill="${cut}"/>`;
}
function phoenixArt(cls, id, { fill = 'var(--ph-bird)', cut = 'var(--ph-cut)' } = {}) {
  let g = '';
  // đuôi: các dải lông dài buông xuống, cuộn xoắn ở cuối
  const tails = [
    [[[134, 236, 96, 222, 52, 204, 26, 214], [26, 214, 4, 224, 8, 250, 26, 246], [26, 246, 36, 243, 32, 232, 24, 234]], 18, 0.42],
    [[[138, 244, 96, 262, 48, 254, 30, 290], [30, 290, 18, 316, 44, 330, 56, 316], [56, 316, 63, 307, 54, 298, 46, 304]], 20, 0.5],
    [[[144, 250, 116, 300, 68, 316, 56, 354], [56, 354, 48, 384, 80, 398, 92, 378], [92, 378, 99, 365, 84, 356, 77, 366]], 22, 0.52],
    [[[152, 254, 148, 312, 118, 352, 126, 390], [126, 390, 132, 412, 162, 410, 162, 392], [162, 392, 162, 380, 148, 378, 146, 388]], 20, 0.55],
    [[[160, 252, 182, 298, 182, 338, 204, 360], [204, 360, 222, 376, 246, 364, 238, 346], [238, 346, 232, 336, 218, 340, 220, 350]], 16, 0.6],
  ];
  for (const [segs, w, at] of tails) g += plume(segs, w, fill, cut, at);
  // cánh: lông cánh dài xoè ngược ra sau, lớp lông phủ, lớp vảy sát vai
  const sx = 170, sy = 166;
  for (let i = 0; i < 9; i++) { const a = -168 + i * 9; g += feather(sx, sy, a, 150 - Math.abs(i - 5) * 9, 22, fill, cut); }
  for (let i = 0; i < 8; i++) { const a = -160 + i * 10; g += feather(sx, sy, a, 92 - Math.abs(i - 4) * 4, 22, fill, cut, 1.6); }
  for (let i = 0; i < 7; i++) { const a = -150 + i * 11; g += feather(sx, sy, a, 50, 18, fill, cut, 1.6); }
  // thân + vảy
  const body = 'M200 126C222 168 216 224 170 252C146 266 120 258 126 238C150 218 158 186 170 146Z';
  g += `<clipPath id="${id}b"><path d="${body}"/></clipPath><path d="${body}" fill="${fill}"/>`;
  let sc = '';
  for (let r = 0; r < 10; r++) for (let c = 0; c < 7; c++) { const x = 134 + c * 12 + (r % 2) * 6, y = 146 + r * 11; sc += `M${x - 5} ${y}a5 5 0 0 0 10 0`; }
  g += `<path clip-path="url(#${id}b)" d="${sc}" fill="none" stroke="${cut}" stroke-width="1.2"/>`;
  // chân
  g += `<path d="M176 246l8 22M184 268l-10 6M184 268l2 10M184 268l10 4" stroke="${fill}" stroke-width="3" stroke-linecap="round" fill="none"/>`;
  // cổ + đầu
  g += `<path d="M180 158C170 120 198 104 206 84" fill="none" stroke="${fill}" stroke-width="24" stroke-linecap="round"/>`;
  let ns = '';
  for (let k = 0; k < 7; k++) { const y = 150 - k * 10, x = 178 - k * 0.2 + (k > 3 ? (k - 3) * 6 : 0); ns += `M${x - 6} ${y}q6 5 12 0`; }
  g += `<path d="${ns}" fill="none" stroke="${cut}" stroke-width="1.1"/>`;
  g += `<circle cx="208" cy="72" r="15" fill="${fill}"/>`;
  g += `<path d="M220 63Q240 64 248 76Q234 73 221 81Z" fill="${fill}"/><path d="M222 72H236" stroke="${cut}" stroke-width="1"/>`;
  g += `<circle cx="212" cy="68" r="3.6" fill="${cut}"/><circle cx="212.6" cy="68" r="1.5" fill="${fill}"/>`;
  g += `<path d="M196 72C204 78 214 78 220 74" fill="none" stroke="${cut}" stroke-width="1.2"/>`;
  // mào và râu
  for (const [d, x, y] of [['M203 58C192 40 192 24 206 20', 206, 20], ['M199 62C182 50 176 34 184 26', 184, 26], ['M207 57C205 38 214 28 227 30', 227, 30]]) {
    g += `<path d="${d}" fill="none" stroke="${fill}" stroke-width="3.2" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="4" fill="${fill}"/><circle cx="${x}" cy="${y}" r="1.4" fill="${cut}"/>`;
  }
  g += `<path d="M214 86C224 102 218 118 204 118M206 88C206 104 196 112 188 108" fill="none" stroke="${fill}" stroke-width="3.4" stroke-linecap="round"/><circle cx="203" cy="118" r="3.6" fill="${fill}"/>`;
  g += `<path d="M195 70C178 74 166 90 154 86M196 76C184 86 178 102 166 104" fill="none" stroke="${fill}" stroke-width="2.6" stroke-linecap="round"/>`;
  return `<svg class="${cls}" viewBox="0 0 260 420" aria-hidden="true">${g}</svg>`;
}

// cành hoa đào nét mảnh (góc dưới bìa, nền khối)
function blossomLine(cls) {
  const fl = (cx, cy, r, rot) => {
    let p = '';
    for (let k = 0; k < 5; k++) { const a = (rot + k * 72) * Math.PI / 180, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; p += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(r * 0.62).toFixed(1)}" ry="${(r * 0.9).toFixed(1)}" transform="rotate(${rot + k * 72 + 90} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; }
    return p + `<circle cx="${cx}" cy="${cy}" r="${(r * 0.35).toFixed(1)}"/>`;
  };
  return `<svg class="${cls}" viewBox="0 0 200 200" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round">
<path d="M196 196C160 170 130 150 110 112C96 86 80 70 54 58M130 150C150 130 156 108 150 86M110 112C88 112 70 120 56 136M82 78C86 58 82 40 70 28"/>
${fl(54, 58, 14, 10)}${fl(150, 84, 12, 40)}${fl(56, 138, 11, 70)}${fl(70, 26, 9, 20)}
<path d="M120 128q10 -12 22 -8q-8 12 -22 8zM96 98q-2 -16 10 -22q4 14 -10 22zM160 170q14 -6 22 2q-12 8 -22 -2z"/>
<circle cx="102" cy="62" r="5"/><circle cx="170" cy="120" r="4.5"/><circle cx="32" cy="100" r="4"/></g></svg>`;
}

// chữ Song Hỷ dạng tem tròn
const hy = (cls) => `<span class="${cls}" aria-hidden="true">囍</span>`;

// phong bao lì xì (hộp mừng cưới)
const envelope = (cls) => `<svg class="${cls}" viewBox="0 0 120 170" aria-hidden="true"><rect x="2" y="2" width="116" height="166" rx="8" fill="var(--ph-env)"/><rect x="9" y="9" width="102" height="152" rx="5" fill="none" stroke="var(--gold)" stroke-width="1.4"/><path d="M2 46Q60 84 118 46V10Q118 2 110 2H10Q2 2 2 10Z" fill="var(--ph-env-flap)"/><circle cx="60" cy="64" r="16" fill="var(--gold)"/><text x="60" y="71" text-anchor="middle" font-size="19" fill="var(--ph-env)" font-family="serif">囍</text><path d="M30 120h60M36 130h48M44 140h32" stroke="var(--gold)" stroke-width="1.4" stroke-linecap="round" opacity=".7"/></svg>`;

const base = {
  '--font-title': "'Prata','Playfair Display',Georgia,serif",
  '--font-script': "'Great Vibes',cursive",
  '--font-body': "'Lora',Georgia,serif",
};

module.exports = {
  id: 'phuonghoang',
  name: 'Phượng Hoàng',
  group: 'hoanggia',
  badge: 'Mới',
  desc: 'Hai phượng hoàng cắt giấy đỏ ôm trang bìa, dải lụa Song Hỷ trên nền giấy kem',
  fonts: 'https://fonts.googleapis.com/css2?family=Prata&family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Great+Vibes&family=Lora:ital,wght@0,400;0,600;1,400&display=swap',
  palettes: [
    { id: 'do-son', name: 'Đỏ son', swatch: ['#f6f0e6', '#8e1116'], vars: { ...base, '--page': '#ebe3d6', '--bg': '#f7f1e7', '--paper': '#fffaf2', '--ink': '#3a1514', '--muted': '#7d5c55', '--accent': '#8e1116', '--accent-ink': '#fff3e3', '--gold': '#c19a52', '--line': '#e4d4c2', '--ph-bird': '#8e1116', '--ph-cut': '#f7f1e7', '--ph-band': '#7a0d12', '--ph-band-ink': '#fff3e3', '--ph-wm': '#8e1116', '--ph-env': '#c8281e', '--ph-env-flap': '#a81c16' } },
    { id: 'vang-kim', name: 'Vàng kim', swatch: ['#6a0b11', '#e1b45e'], vars: { ...base, '--page': '#3d0508', '--bg': '#6a0b11', '--paper': '#7a1218', '--ink': '#f7e6c2', '--muted': '#e0bf8c', '--accent': '#e1b45e', '--accent-ink': '#4a0508', '--gold': '#e1b45e', '--line': 'rgba(225,180,94,.35)', '--ph-bird': '#dcae58', '--ph-cut': '#6a0b11', '--ph-band': '#e1b45e', '--ph-band-ink': '#6a0b11', '--ph-wm': '#e1b45e', '--ph-env': '#b81f18', '--ph-env-flap': '#961711' } },
  ],
  demo: {
    cover: '/demo/longphung-2.jpg',
    photos: [6, 3, 4, 8, 9, 2, 7, 10].map((n) => `/demo/longphung-${n}.jpg`),
    events: [
      { name: 'Lễ Vu Quy', date: '2026-12-20', time: '08:00', place: 'Tư gia nhà gái', address: 'Phố Hàng Bông, Hoàn Kiếm, Hà Nội', mapUrl: '' },
      { name: 'Lễ Thành Hôn', date: '2026-12-20', time: '10:00', place: 'Tư gia nhà trai', address: 'Phố Láng Hạ, Đống Đa, Hà Nội', mapUrl: '' },
      { name: 'Tiệc Cưới', date: '2026-12-20', time: '18:00', place: 'Sảnh Hoàng Cung — Nhà hàng tiệc cưới', address: 'Hồ Tây, Tây Hồ, Hà Nội', mapUrl: '' },
    ],
  },
  layout: ['invite', 'calendar', 'events', 'story', 'gallery', 'rsvp', 'gift', 'wishes', 'thanks'],

  title(text, sub) {
    return `<h2 class="ph-h">${esc(text)}</h2>${sub ? `<p class="sec-sub ph-sub">${esc(sub)}</p>` : ''}`;
  },

  // cửa son hai cánh, chạm để mở; giữa là tem Song Hỷ chẻ đôi
  opener(ctx) {
    const p = ctx.dparts;
    const leaf = (side) => `<div class="ph-door ${side}"><i class="ph-door-frame"></i><i class="ph-door-frame in"></i><span class="ph-ring"></span><span class="ph-seal">${hy('ph-seal-hy')}</span></div>`;
    return `
<div class="opener ph-opener" id="opener" data-open-ms="1500">
  ${leaf('l')}${leaf('r')}
  <div class="ph-onote">
    <p class="ph-okick">Thiệp hồng</p>
    <p class="ph-onames">${esc(ctx.g)} <i>&amp;</i> ${esc(ctx.b)}</p>
    ${p ? `<p class="ph-odate">${p.d} · ${p.m} · ${p.y}</p>` : ''}
    <p class="ph-oto">${ctx.guest ? `Kính gửi <b>${esc(ctx.guest.name)}</b>` : 'Trân trọng kính mời'}</p>
  </div>
  <button type="button" class="ph-otap" id="openBtn">Chạm để mở cửa</button>
</div>`;
  },

  cover(ctx) {
    const p = ctx.dparts;
    return `
<header class="ph-cover">
  <p class="ph-kick">The wedding of</p>
  <h1 class="ph-names"><span>${esc(ctx.g)}</span><i>&amp;</i><span>${esc(ctx.b)}</span></h1>
  <div class="ph-bird ph-bird-r">${phoenixArt('', 'phr')}</div>
  <div class="ph-band"><span class="ph-band-line"></span>${hy('ph-band-hy')}</div>
  <div class="ph-bird ph-bird-l">${phoenixArt('', 'phl')}</div>
  <p class="ph-quote">Hai cánh phượng chung một trời,<br>từ nay chung một mái nhà.</p>
  ${p ? `<div class="ph-cdate"><span>${esc(ctx.weekday)}</span><b>${p.d}<i></i>${p.m}<i></i>${p.y}</b><span>${esc(lunarOf(ctx.lunarShort ? `Âm lịch ${ctx.lunarShort}` : ''))}</span></div>` : ''}
  ${blossomLine('ph-blossom')}
</header>`;
  },

  sections: {
    invite(ctx) {
      const { d, guest } = ctx;
      const ev = mainEvent(d);
      const evDate = ev && ev.date ? ev.date : ctx.date;
      const ep = evDate ? { d: evDate.slice(8, 10), m: evDate.slice(5, 7), y: evDate.slice(0, 4) } : null;
      const time = (ev && ev.time) || d.time;
      const fam = (x, label) => `<div class="ph-fam"><p class="ph-fam-k">${label}</p>${x.father ? `<p>${esc(x.father)}</p>` : ''}${x.mother ? `<p>${esc(x.mother)}</p>` : ''}${x.address ? `<p class="ph-fam-a">${esc(x.address)}</p>` : ''}</div>`;
      const hasFam = d.groom.father || d.groom.mother || d.bride.father || d.bride.mother;
      return `
  <section class="sec ph-invite">
    <div class="ph-wm">${phoenixArt('', 'phw', { fill: 'none', cut: 'var(--ph-wm)' })}</div>
    <div class="reveal">
      <p class="ph-cap">${esc(d.inviteText)}</p>
      <p class="ph-guest">${guest ? esc(guest.name) : 'Quý khách'}</p>
      <p class="ph-to">tới dự lễ thành hôn của hai con chúng tôi</p>
    </div>
    <h2 class="ph-cap ph-cap-sm reveal">Thông tin lễ cưới</h2>
    ${hasFam ? `<div class="ph-fams reveal">${fam(d.groom, 'Nhà Trai')}<span class="ph-fams-mid">${hy('ph-mini-hy')}</span>${fam(d.bride, 'Nhà Gái')}</div>` : ''}
    <div class="ph-couple reveal">
      <p class="ph-full">${esc(d.groom.fullName || d.groom.name)}</p>
      <p class="ph-amp">&amp;</p>
      <p class="ph-full">${esc(d.bride.fullName || d.bride.name)}</p>
    </div>
    ${ep ? `<div class="ph-cer reveal">
      <h3>${esc((ev && ev.name) || 'Lễ Thành Hôn')}</h3>
      <p class="ph-cer-when">Vào ${esc(ctx.weekday)}${time ? ` · ${esc(time.replace(':', 'h'))}` : ''}</p>
      <div class="ph-cer-date"><span>Tháng ${ep.m}</span><b>${ep.d}</b><span>Năm ${ep.y}</span></div>
      <p class="ph-cer-lunar">Tức ${esc(lunarOf(ctx.lunar))}</p>
      ${ev && ev.place ? `<p class="ph-cer-at">Tại ${esc(ev.place)}</p>` : ''}
    </div>` : ''}
    ${d.message ? `<p class="ph-msg reveal">${esc(d.message)}</p>` : ''}
  </section>`;
    },

    // album kiểu tạp chí: ảnh lớn giữa, ảnh nhỏ chồng góc, hai ảnh ló hai bên, hai ảnh dưới
    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      const btn = (u, i, cls) => `<button class="ph ph-a${cls}" data-i="${i}" style="background-image:url('${esc(u)}')" aria-label="Xem ảnh ${i + 1}"></button>`;
      const head = `<h2 class="ph-alh"><span>Album</span><span>Ảnh cưới</span></h2>`;
      if (ph.length < 6) {
        return `<section class="sec ph-album">${head}<div class="ph-agrid">${ph.map((u, i) => btn(u, i, ' reveal')).join('')}</div></section>`;
      }
      const main = ph.slice(0, 6), rest = ph.slice(6);
      return `
  <section class="sec ph-album">
    <div class="ph-collage">
      ${head}
      ${main.map((u, i) => btn(u, i, ` k${i} reveal`)).join('')}
    </div>
    ${rest.length ? `<div class="ph-agrid">${rest.map((u, i) => btn(u, i + 6, ' reveal')).join('')}</div>` : ''}
  </section>`;
    },

    gift(ctx, opts, h) {
      if (!ctx.d.show.gift) return '';
      const html = h.giftCard(ctx, ctx.d.gifts.groom, 'groom') + h.giftCard(ctx, ctx.d.gifts.bride, 'bride');
      if (!html) return '';
      return `
  <section class="sec ph-gift reveal">
    <h2 class="ph-h">Gửi quà mừng</h2>
    <details class="ph-gbox">
      <summary><span class="ph-envs">${envelope('ph-env a')}${envelope('ph-env b')}</span><span class="ph-gtap">Chạm để mở phong bao</span></summary>
      <div class="gifts">${html}</div>
    </details>
  </section>`;
    },

    thanks(ctx) {
      return `
  <section class="ph-thanks reveal">
    <div class="ph-tbirds">${phoenixArt('l', 'pt1')}${hy('ph-thy')}${phoenixArt('r', 'pt2')}</div>
    <p class="ph-tbig">Cảm ơn quý khách</p>
    <p class="ph-ttxt">Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</p>
    <p class="ph-tnames">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
  </section>`;
    },
  },

  css: `
.tpl-phuonghoang{background:var(--page) radial-gradient(circle at 50% 0,rgba(255,255,255,.25),transparent 60%)}
.tpl-phuonghoang .card{background:var(--bg);color:var(--ink)}
.tpl-phuonghoang .card::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.5;background-image:radial-gradient(rgba(120,80,40,.07) 1px,transparent 1.2px);background-size:5px 5px;z-index:0}
.tpl-phuonghoang .card>*{position:relative;z-index:1}
.tpl-phuonghoang .ph-h{font-family:var(--font-script);font-weight:400;font-size:46px;line-height:1.1;color:var(--accent);margin:0 0 22px}
.tpl-phuonghoang .ph-sub{margin-top:-14px}
.tpl-phuonghoang .ph-bird svg{display:block;width:100%;height:auto;overflow:visible}

/* ---------- màn mở: cửa son ---------- */
.ph-opener{background:#2a0406;perspective:1400px;overflow:hidden}
.ph-door{position:absolute;top:0;bottom:0;width:50%;background:linear-gradient(90deg,#7a0b10,#9c141a 45%,#860f14);transition:transform 1.4s cubic-bezier(.6,.05,.3,1);box-shadow:inset 0 0 60px rgba(0,0,0,.35)}
.ph-door.l{left:0;transform-origin:left center}
.ph-door.r{right:0;transform-origin:right center;background:linear-gradient(270deg,#7a0b10,#9c141a 45%,#860f14)}
.ph-door-frame{position:absolute;inset:18px 16px;border:2px solid #d4a64e;border-radius:4px}
.ph-door-frame.in{inset:30px 28px;border-width:1px;opacity:.7}
.ph-door.l .ph-door-frame{right:10px}.ph-door.r .ph-door-frame{left:10px}
.ph-door.l .ph-door-frame.in{right:22px}.ph-door.r .ph-door-frame.in{left:22px}
.ph-ring{position:absolute;top:calc(64% + 74px);width:26px;height:26px;border-radius:50%;border:3px solid #e2b764;box-shadow:0 2px 4px rgba(0,0,0,.4)}
.ph-door.l .ph-ring{right:18px}.ph-door.r .ph-ring{left:18px}
.ph-seal{position:absolute;top:calc(64% - 60px);width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,#e7bf6d,#c08d3a);overflow:hidden;display:grid;place-items:center;box-shadow:0 4px 14px rgba(0,0,0,.35)}
.ph-door.l .ph-seal{right:-60px;clip-path:inset(0 50% 0 0)}
.ph-door.r .ph-seal{left:-60px;clip-path:inset(0 0 0 50%)}
.ph-seal-hy{font-family:'Noto Serif SC','Songti SC','SimSun',serif;font-size:72px;line-height:1;color:#8e1116;font-weight:700}
.ph-onote{position:absolute;left:50%;top:7%;transform:translateX(-50%);width:min(320px,84vw);z-index:2;background:rgba(60,4,8,.55);border:1px solid rgba(231,191,109,.5);border-radius:4px;padding:18px 16px 16px;text-align:center;color:#f7e6c2;font-family:'Lora',serif;transition:opacity .5s}
.ph-okick{margin:0;font-size:12px;letter-spacing:.32em;text-transform:uppercase;opacity:.85}
.ph-onames{margin:4px 0 2px;font-family:'Prata',serif;font-size:28px;line-height:1.25}
.ph-onames i{font-family:'Great Vibes',cursive;font-style:normal;color:#e7bf6d}
.ph-odate{margin:0;font-size:14px;letter-spacing:.2em;color:#e7bf6d}
.ph-oto{margin:10px 0 0;font-size:14px}
.ph-oto b{display:block;font-family:'Great Vibes',cursive;font-weight:400;font-size:27px;line-height:1.3;color:#fff}
.ph-otap{position:absolute;z-index:2;left:0;right:0;bottom:7%;margin:0;font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#f7e6c2;animation:phBlink 1.8s ease-in-out infinite}
@keyframes phBlink{50%{opacity:.35}}
.ph-opener.opening .ph-door.l{transform:rotateY(-105deg)}
.ph-opener.opening .ph-door.r{transform:rotateY(105deg)}
.ph-opener.opening .ph-onote,.ph-opener.opening .ph-otap{opacity:0}

/* ---------- trang bìa ---------- */
.ph-cover{position:relative;height:max(640px,min(100svh,900px));overflow:hidden;color:var(--accent)}
.ph-kick{position:absolute;left:7%;top:5.5%;margin:0;font-family:var(--font-title);font-size:12px;letter-spacing:.32em;text-transform:uppercase;color:var(--accent)}
.ph-names{position:absolute;left:7%;top:9%;margin:0;font-family:var(--font-title);font-weight:400;text-transform:uppercase;font-size:clamp(28px,8.6vw,38px);line-height:1.15;z-index:3;max-width:66%}
.ph-names span{display:block;animation:phRise 1.2s ease both}
.ph-names span+i+span{padding-left:16%;animation-delay:.25s}
.ph-names i{display:block;margin:-6px 0 -10px 12%;font-family:var(--font-script);font-style:normal;text-transform:none;font-size:.95em;line-height:1;color:var(--gold)}
.ph-bird{position:absolute;z-index:2}
.ph-bird-r{right:-6%;top:9%;width:52%;transform:scaleX(-1)}
.ph-bird-r svg{animation:phFloat 7s ease-in-out infinite}
.ph-bird-l{left:-13%;top:30%;width:66%;z-index:4}
.ph-bird-l svg{animation:phFloat 8s ease-in-out -2s infinite}
.ph-band{position:absolute;left:24%;right:0;top:44%;height:15%;background:var(--ph-band);z-index:3;display:grid;place-items:center;box-shadow:0 10px 24px rgba(80,0,0,.18);animation:phBand 1.4s cubic-bezier(.2,.7,.2,1) both}
.ph-band-line{position:absolute;left:0;right:0;top:9px;bottom:9px;border-top:1px solid color-mix(in srgb,var(--ph-band-ink) 50%,transparent);border-bottom:1px solid color-mix(in srgb,var(--ph-band-ink) 50%,transparent)}
.ph-band-hy{position:relative;margin-top:-26%;font-family:'Noto Serif SC','Songti SC','SimSun',serif;font-weight:700;font-size:clamp(70px,22vw,100px);line-height:1;color:var(--ph-band-ink);text-shadow:0 0 0 var(--ph-band);-webkit-text-stroke:6px var(--ph-band);paint-order:stroke fill;animation:phPulse 4s ease-in-out infinite}
.ph-quote{position:absolute;left:30%;right:6%;top:62.5%;margin:0;font-family:var(--font-body);font-style:italic;font-size:14px;line-height:1.65;text-align:right;color:var(--ink);z-index:3}
.ph-cdate{position:absolute;left:44%;right:6%;top:73%;z-index:5;display:flex;flex-direction:column;align-items:flex-end;gap:4px;color:var(--accent)}
.ph-cdate span{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
.ph-cdate b{display:flex;align-items:center;gap:8px;font-family:var(--font-title);font-weight:400;font-size:28px;letter-spacing:.04em;border-top:1px solid var(--gold);border-bottom:1px solid var(--gold);padding:4px 0 4px 10px;background:linear-gradient(90deg,transparent,var(--bg) 18px)}
.ph-cdate b i{width:4px;height:4px;background:var(--gold);transform:rotate(45deg)}
.ph-blossom{position:absolute;right:-8%;bottom:-6%;width:40%;color:var(--accent);opacity:.4;z-index:1;transform:rotate(-8deg)}
@keyframes phFloat{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-8px) rotate(-1.2deg)}}
@keyframes phRise{from{opacity:0;transform:translateY(16px)}}
@keyframes phBand{from{transform:translateX(100%)}}
@keyframes phPulse{50%{transform:scale(1.04)}}

/* ---------- lời mời ---------- */
.ph-invite{overflow:hidden;padding-top:40px}
.ph-wm{position:absolute;left:-30%;top:10%;width:110%;opacity:.09;pointer-events:none}
.ph-wm svg{width:100%;height:auto}
.ph-wm svg *{stroke-width:1px}
.ph-cap{margin:0;font-family:var(--font-title);font-size:21px;letter-spacing:.06em;text-transform:uppercase;color:var(--accent);font-weight:400}
.ph-cap-sm{font-size:19px;margin:40px 0 18px}
.ph-guest{margin:6px 0 2px;font-family:'Playfair Display',serif;font-style:italic;font-weight:500;font-size:24px;color:var(--accent)}
.ph-to{margin:0;color:var(--muted);font-size:14px}
.ph-fams{display:grid;grid-template-columns:1fr auto 1fr;align-items:start;gap:8px;font-size:14px}
.ph-fams-mid{display:flex;flex-direction:column;align-items:center;height:100%;min-height:90px}
.ph-fams-mid::after{content:"";flex:1;width:1px;background:var(--accent);opacity:.6;margin-top:6px}
.ph-mini-hy{font-family:'Noto Serif SC','Songti SC',serif;font-weight:700;font-size:20px;color:var(--accent)}
.ph-fam p{margin:0;line-height:1.5}
.ph-fam-k{font-family:'Playfair Display',serif;font-size:22px;color:var(--accent);margin-bottom:6px!important}
.ph-fam-a{font-size:12px;color:var(--muted);margin-top:4px!important}
.ph-couple{margin:38px 0 6px}
.ph-full{margin:0;font-family:'Playfair Display',serif;font-weight:500;font-size:clamp(28px,8vw,36px);line-height:1.25;color:var(--accent)}
.ph-amp{margin:8px 0;font-family:'Playfair Display',serif;font-size:30px;color:var(--accent)}
.ph-cer{margin-top:40px}
.ph-cer h3{margin:0;font-family:var(--font-title);font-weight:400;font-size:26px;text-transform:uppercase;color:var(--accent)}
.ph-cer-when{margin:4px 0 8px;font-size:14px;color:var(--muted)}
.ph-cer-date{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:0;max-width:330px;margin:0 auto;color:var(--accent);font-family:'Playfair Display',serif}
.ph-cer-date span{font-size:22px}
.ph-cer-date span:first-child{text-align:right;padding-right:14px}
.ph-cer-date span:last-child{text-align:left;padding-left:14px}
.ph-cer-date b{font-weight:500;font-size:56px;line-height:1;padding:0 14px;border-left:2px solid var(--accent);border-right:2px solid var(--accent)}
.ph-cer-lunar{margin:10px 0 0;font-size:13px;color:var(--muted)}
.ph-cer-at{margin:14px 0 0;font-family:var(--font-title);font-size:16px;text-transform:uppercase;letter-spacing:.06em;color:var(--accent)}
.ph-msg{margin:30px auto 0;max-width:330px;font-style:italic;color:var(--muted);font-size:15px}

/* ---------- lịch + đếm ngược ---------- */
.tpl-phuonghoang .s-cal{background:var(--paper);margin:0 18px;border:1px solid var(--line);border-radius:4px;outline:1px solid var(--line);outline-offset:-8px;padding:44px 20px}
.tpl-phuonghoang .cal-on::before{-webkit-mask:none;mask:none;width:36px;height:36px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px var(--paper),0 0 0 4px var(--gold);animation:none}
.tpl-phuonghoang .cal-on b{margin-top:0}
.tpl-phuonghoang .cd-u b{font-family:'Playfair Display',serif}

/* ---------- lịch trình ---------- */
.tpl-phuonghoang .tl-body h3{font-family:'Playfair Display',serif;color:var(--accent)}
.tpl-phuonghoang .tl-item::after{border-radius:0;transform:rotate(45deg);background:var(--accent)}
.tpl-phuonghoang .tl-act a,.tpl-phuonghoang .tl-map summary{display:inline-block;padding:5px 12px;border:1px solid var(--accent);border-radius:999px}
.tpl-phuonghoang .tl-act a::after{content:""}
.tpl-phuonghoang .s-story p{font-style:italic}

/* ---------- album tạp chí ---------- */
.ph-album{padding-left:0;padding-right:0}
.ph-alh{margin:0;font-family:var(--font-script);font-weight:400;color:var(--accent);line-height:.9;text-align:left}
.ph-alh span{display:block;font-size:54px}
.ph-alh span+span{font-size:38px;padding-left:28px}
.ph-collage{position:relative;height:640px}
.ph-collage .ph-alh{position:absolute;left:47%;top:8px;z-index:3}
.ph-a{position:absolute;border-radius:2px;box-shadow:0 8px 22px rgba(60,10,10,.18);background-size:cover;background-position:center 25%}
.ph-a.k0{left:23%;top:118px;width:54%;height:300px;z-index:2}
.ph-a.k1{left:8%;top:12px;width:28%;height:150px;border:4px solid var(--paper);z-index:3}
.ph-a.k2{left:-3%;top:300px;width:22%;height:142px;z-index:1}
.ph-a.k3{right:-3%;top:300px;width:22%;height:142px;z-index:1}
.ph-a.k4{left:14%;top:438px;width:34%;height:196px}
.ph-a.k5{right:14%;top:438px;width:34%;height:196px}
.ph-agrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px 24px 0}
.ph-agrid .ph{position:relative;aspect-ratio:3/4;border-radius:2px}
.ph-agrid .ph:nth-child(3n+1){grid-column:auto;aspect-ratio:3/4}
.ph-album>.ph-alh{padding:0 24px 18px;text-align:center}

/* ---------- biểu mẫu ---------- */
.tpl-phuonghoang .form{border-radius:6px;box-shadow:0 10px 30px rgba(80,10,10,.1)}
.tpl-phuonghoang .btn{border-radius:999px}

/* ---------- hộp mừng ---------- */
.ph-gbox summary{list-style:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:12px}
.ph-gbox summary::-webkit-details-marker{display:none}
.ph-envs{display:flex;justify-content:center;gap:0}
.ph-env{width:112px;height:auto;filter:drop-shadow(0 8px 12px rgba(80,0,0,.25));transition:transform .5s}
.ph-env.a{transform:rotate(-10deg) translateX(10px)}
.ph-env.b{transform:rotate(9deg) translate(-10px,8px)}
.ph-gbox summary:hover .ph-env.a{transform:rotate(-14deg) translate(4px,-6px)}
.ph-gbox summary:hover .ph-env.b{transform:rotate(13deg) translate(-4px,0)}
.ph-gtap{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);border-bottom:1px solid var(--gold)}
.ph-gbox[open] .ph-gtap{display:none}
.ph-gbox .gifts{margin-top:22px}
.tpl-phuonghoang .gift{border-radius:6px}

/* ---------- lời cảm ơn ---------- */
.ph-thanks{background:var(--ph-band);color:var(--ph-band-ink);text-align:center;padding:30px 24px 40px;margin-top:24px}
.ph-tbirds{display:flex;align-items:center;justify-content:center;gap:4px;margin-bottom:6px;--ph-bird:var(--ph-band-ink);--ph-cut:var(--ph-band)}
.ph-tbirds svg{width:86px;height:auto}
.ph-tbirds svg.r{transform:scaleX(-1)}
.ph-thy{font-family:'Noto Serif SC','Songti SC',serif;font-weight:700;font-size:40px}
.ph-tbig{margin:0;font-family:var(--font-script);font-size:44px;line-height:1.2}
.ph-ttxt{margin:6px auto 0;max-width:340px;font-family:'Playfair Display',serif;font-size:19px;line-height:1.5}
.ph-tnames{margin:16px 0 0;font-size:13px;letter-spacing:.24em;text-transform:uppercase;opacity:.85}
.tpl-phuonghoang .credit{position:relative;z-index:1}

.ph-otap{border:0;background:none;padding:10px;font-family:inherit}
@media (prefers-reduced-motion:reduce){.ph-bird svg,.ph-band,.ph-band-hy,.ph-names span,.ph-otap{animation:none!important}.ph-door{transition:none}}
`,
};
