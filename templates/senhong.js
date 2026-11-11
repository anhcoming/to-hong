// Mẫu "Sen Hồng" — thiệp báo hỷ nền trắng kem thoáng: hoa sen hồng & lá sen vẽ bằng SVG (dải màu mềm, gân lá),
// sen nét vàng mảnh trong khung thông tin, cánh sen trôi nhẹ, chữ Hỷ đỏ, ao sen cuối thiệp.
const { esc } = require('../lib/util');

const f1 = (n) => +n.toFixed(1);
const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// ---------- hoạ tiết sen ----------
const DEFS = `<svg class="sh-defs" aria-hidden="true" focusable="false"><defs>
  <linearGradient id="shA" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fffaf7"/><stop offset=".5" style="stop-color:var(--sh-p1)"/><stop offset="1" style="stop-color:var(--sh-p2)"/></linearGradient>
  <linearGradient id="shB" x1="0" y1="1" x2="0" y2="0"><stop offset="0" style="stop-color:var(--sh-p1)"/><stop offset="1" style="stop-color:var(--sh-p2)"/></linearGradient>
  <linearGradient id="shF" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fffdfb"/><stop offset=".62" stop-color="#fff1f2"/><stop offset="1" style="stop-color:var(--sh-p1)"/></linearGradient>
  <radialGradient id="shL" cx=".5" cy=".5" r=".6"><stop offset="0" style="stop-color:var(--sh-l1)"/><stop offset=".7" style="stop-color:var(--sh-l2)" stop-opacity=".85"/><stop offset="1" style="stop-color:var(--sh-l2)"/></radialGradient>
  <linearGradient id="shPod" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3d77a"/><stop offset="1" stop-color="#d9a93e"/></linearGradient>
  <filter id="shSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>
</defs></svg>`;

const lp = (L, W) => `M0 0C${f1(-W)} ${f1(-L * 0.35)} ${f1(-W * 0.55)} ${f1(-L * 0.8)} 0 ${f1(-L)}C${f1(W * 0.55)} ${f1(-L * 0.8)} ${f1(W)} ${f1(-L * 0.35)} 0 0Z`;
const petalG = (a, L, W, g, dy = 0) => `<g transform="translate(0 ${dy}) rotate(${a})"><path d="${lp(L, W)}" fill="url(#${g})"/><path d="M0 -4Q${f1(W * 0.14)} ${f1(-L * 0.5)} 0 ${f1(-L * 0.93)}M${f1(-W * 0.35)} -8Q${f1(-W * 0.3)} ${f1(-L * 0.5)} ${f1(-W * 0.08)} ${f1(-L * 0.86)}M${f1(W * 0.35)} -8Q${f1(W * 0.3)} ${f1(-L * 0.5)} ${f1(W * 0.08)} ${f1(-L * 0.86)}" stroke="var(--sh-p2)" stroke-width=".7" opacity=".3" fill="none"/></g>`;
// bông sen nở, gốc cánh ở (x,y)
function flower(x, y, s, rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    ${petalG(-74, 56, 20, 'shB')}${petalG(74, 56, 20, 'shB')}${petalG(-50, 68, 24, 'shB')}${petalG(50, 68, 24, 'shB')}
    ${petalG(-26, 78, 26, 'shA')}${petalG(26, 78, 26, 'shA')}
    <ellipse cx="0" cy="-12" rx="17" ry="7" fill="url(#shPod)"/>${[-10, -4, 2, 8].map((dx) => `<circle cx="${dx}" cy="-13" r="1.4" fill="#b98a2a"/>`).join('')}
    ${petalG(-10, 72, 24, 'shA')}${petalG(10, 72, 24, 'shA')}
    ${petalG(-40, 54, 22, 'shF', 5)}${petalG(40, 54, 22, 'shF', 5)}${petalG(0, 62, 25, 'shF', 7)}
  </g>`;
}
const bud = (x, y, s, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">${petalG(-14, 60, 20, 'shB')}${petalG(14, 60, 20, 'shB')}${petalG(0, 66, 22, 'shA')}</g>`;
// lá sen nhìn nghiêng: elip có khe, gân toả từ tâm
function pad(x, y, r, k, rot, seed = 1) {
  const R = rng(seed);
  const n = 30, gap = 18;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = ((gap / 2 + (i * (360 - gap)) / n - 90) * Math.PI) / 180;
    const rr = r * (0.95 + R() * 0.07);
    pts.push(`${f1(Math.cos(a) * rr)} ${f1(Math.sin(a) * rr * k)}`);
  }
  let veins = '';
  for (let i = 1; i < 12; i++) {
    const a = ((gap / 2 + (i * (360 - gap)) / 12 - 90) * Math.PI) / 180;
    veins += `M0 0L${f1(Math.cos(a) * r * 0.93)} ${f1(Math.sin(a) * r * k * 0.93)}`;
  }
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0L${pts.join('L')}Z" fill="url(#shL)" stroke="var(--sh-l2)" stroke-width="1.2" stroke-linejoin="round"/><path d="${veins}" stroke="var(--sh-l1)" stroke-width="1" opacity=".55" fill="none"/></g>`;
}
const stem = (d) => `<path d="${d}" fill="none" stroke="var(--sh-l2)" stroke-width="3" stroke-linecap="round" opacity=".85"/>`;

const COVER_LEAF = `<svg viewBox="0 0 220 200" aria-hidden="true">${pad(80, 70, 130, 0.72, 18, 3)}</svg>`;
const CLUSTER = `<svg viewBox="0 0 260 300" aria-hidden="true">
  <ellipse cx="150" cy="200" rx="120" ry="90" style="fill:var(--sh-wash)" filter="url(#shSoft)" opacity=".8"/>
  ${stem('M150 132C152 190 146 240 160 300')}${stem('M86 182C90 230 84 260 92 300')}${stem('M214 104C206 170 214 240 206 300')}
  ${pad(196, 222, 70, 0.42, -10, 5)}${pad(60, 262, 56, 0.4, 8, 7)}
  ${flower(150, 132, 1.05)}${flower(86, 184, 0.72, -12)}${bud(214, 106, 0.85, 12)}
  ${pad(236, 168, 30, 0.5, -30, 9)}
</svg>`;
// ao sen cuối thiệp: lá sen xanh đậm viền vàng, sen trắng kem nét vàng
const POND = `<svg viewBox="0 0 390 230" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  ${stem('M110 120C112 170 104 200 110 230')}${stem('M270 96C266 160 274 200 268 230')}${stem('M196 150C198 190 192 210 196 230')}${stem('M44 150C48 190 40 210 46 230')}${stem('M344 140C340 190 348 210 344 230')}
  ${pad(70, 170, 80, 0.45, 8, 11)}${pad(320, 160, 86, 0.45, -6, 13)}${pad(200, 205, 70, 0.36, 2, 17)}
  ${flower(110, 122, 0.82, -6)}${flower(270, 98, 0.95, 4)}${flower(196, 152, 0.6, 0)}${bud(44, 150, 0.6, -14)}${bud(344, 140, 0.62, 12)}
</svg>`;
// sen nét vàng mảnh (trang trí khung)
const LINE_LOTUS = `<svg viewBox="0 0 120 110" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round">
  <path d="M60 86C42 76 34 56 40 30c10 12 18 30 20 56zM60 86C78 76 86 56 80 30 70 42 62 60 60 86z"/><path d="M60 86C52 60 54 34 60 14c6 20 8 46 0 72z"/>
  <path d="M60 86C36 84 18 70 10 50c20 2 38 16 50 36zM60 86c24-2 42-16 50-36-20 2-38 16-50 36z"/><path d="M60 86c-6 8-6 16-2 24M30 104c20-8 40-8 60 0"/></svg>`;
// chữ Hỷ đôi dựng bằng khối
const HY = (() => {
  const one = (x) => {
    const r = (a, b, w, h) => `<rect x="${x + a}" y="${b}" width="${w}" height="${h}"/>`;
    return r(2, 3, 42, 5) + r(20, 0, 6, 19) + r(9, 13, 28, 5) + r(9, 22, 28, 4.5) + r(9, 32, 28, 4.5) + r(9, 22, 5, 14.5) + r(32, 22, 5, 14.5)
      + `<path transform="translate(${x} 0)" d="M12 40l5 0 3 6h-5zM34 40h-5l-3 6h5z"/>`
      + r(9, 58, 28, 4.5) + r(9, 69, 28, 4.5) + r(9, 58, 5, 15.5) + r(32, 58, 5, 15.5)
      + `<path transform="translate(${x} 0)" d="M13 77h5l2 7h-5zM33 77h-5l-2 7h5z"/>`;
  };
  return `<svg viewBox="0 0 100 94" aria-hidden="true"><g style="fill:var(--sh-red)">${one(0)}${one(54)}<rect x="0" y="48" width="100" height="5.5"/><rect x="0" y="86" width="100" height="5.5"/></g></svg>`;
})();
// cánh sen trôi (vị trí, cỡ, nhịp cố định)
const PETALS = [[12, 0, 14, 16], [78, 3, 11, 19], [34, 6, 9, 15], [90, 9, 13, 21], [55, 2, 10, 17], [22, 11, 12, 18], [66, 7, 8, 14]];
const petals = (cls = '') => `<div class="sh-petals ${cls}" aria-hidden="true">${PETALS.map(([x, d, s, t]) => `<i style="--x:${x}%;--d:-${d}s;--s:${s}px;--t:${t}s"></i>`).join('')}</div>`;

const evList = (d) => d.events.filter((e) => e.name || e.place);
function partyEvent(d) {
  const evs = evList(d);
  return evs.find((e) => /khai tiệc|tiệc cưới/i.test(e.name)) || evs.find((e) => /tiệc/i.test(e.name)) || evs[evs.length - 1] || null;
}
const pick = (ph, i) => (ph.length ? ph[i % ph.length] : '');

const base = { '--font-title': "'Oswald','Josefin Sans',sans-serif", '--font-script': "'Alex Brush',cursive", '--font-body': "'Lora',Georgia,serif" };

module.exports = {
  id: 'senhong',
  name: 'Sen Hồng',
  group: 'hoa',
  badge: 'Mới',
  desc: 'Thiệp báo hỷ nền kem thoáng, hoa sen hồng, lá sen xanh và cánh sen trôi nhẹ',
  fonts: 'https://fonts.googleapis.com/css2?family=Alex+Brush&family=Josefin+Sans:wght@300;400;600&family=Oswald:wght@400;500&family=Lora:ital,wght@0,400;0,600;1,400&display=swap',
  palettes: [
    {
      id: 'hong-sen', name: 'Hồng sen', swatch: ['#f7b9c6', '#4f6342'],
      vars: { ...base, '--page': '#eef0e3', '--bg': '#fbfcf3', '--paper': '#ffffff', '--ink': '#2f372b', '--muted': '#6e7566', '--accent': '#4f6342', '--accent-ink': '#fbfcf3', '--gold': '#c9a96a', '--line': '#dfe3cf', '--sh-p1': '#f8c3cd', '--sh-p2': '#e8798f', '--sh-l1': '#a8c9a8', '--sh-l2': '#3e6b55', '--sh-red': '#c8102e', '--sh-wash': '#fde0e6', '--sh-green': '#dcebd8' },
    },
    {
      id: 'xanh-ngoc', name: 'Xanh ngọc', swatch: ['#e3f1ee', '#2f6f6a'],
      vars: { ...base, '--page': '#e5efec', '--bg': '#f7fbf9', '--paper': '#ffffff', '--ink': '#253532', '--muted': '#62736f', '--accent': '#2f6f6a', '--accent-ink': '#f7fbf9', '--gold': '#b9a26a', '--line': '#d5e4df', '--sh-p1': '#fadbe1', '--sh-p2': '#e79aab', '--sh-l1': '#9fd0c4', '--sh-l2': '#2f6f6a', '--sh-red': '#b5122b', '--sh-wash': '#d9efe9', '--sh-green': '#d3ebe4' },
    },
  ],
  demo: {
    cover: '/demo/hoamoc-8.webp',
    photos: [2, 1, 3, 6, 4, 7, 5, 8].map((n) => `/demo/hoamoc-${n}.webp`),
  },
  layout: ['invite', 'guest', 'events', 'calendar', 'story', 'rsvp', 'gift', 'gallery', 'wishes', 'thanks'],

  title(text, sub) {
    return `<h2 class="sh-h">${esc(text)}</h2>${sub ? `<p class="sh-hsub">${esc(sub)}</p>` : ''}`;
  },

  opener(ctx) {
    // nụ sen khép: cánh xoè ra khi chạm
    const ps = [[-60, 'shB'], [60, 'shB'], [-38, 'shB'], [38, 'shB'], [-16, 'shA'], [16, 'shA'], [0, 'shF']];
    return `
<div class="opener sh-opener" id="opener" data-open-ms="1300">
  ${petals('o')}
  <div class="sh-o-in">
    <svg class="sh-o-bud" viewBox="-110 -120 220 140" aria-hidden="true">
      ${ps.map(([a, g], i) => `<path class="p" style="--a:${a}deg" d="${lp(i === 6 ? 70 : 92 - Math.abs(a) * 0.4, i === 6 ? 28 : 30)}" fill="url(#${g})" stroke="var(--sh-p2)" stroke-opacity=".25"/>`).join('')}
    </svg>
    <p class="sh-o-k">Thiệp báo hỷ</p>
    <p class="sh-o-n">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
    <p class="sh-o-to">Kính gửi</p>
    <p class="sh-o-g">${ctx.guest ? esc(ctx.guest.name) : 'Quý khách'}</p>
    <button class="sh-o-btn" id="openBtn" type="button">Mở thiệp</button>
  </div>
</div>`;
  },

  cover(ctx) {
    const p = ctx.dparts;
    return `
<header class="sh-cover">
  ${DEFS}
  <div class="sh-wash a"></div><div class="sh-wash b"></div>
  <div class="sh-leaf">${COVER_LEAF}</div>
  ${petals()}
  <div class="sh-cv-tx">
    <h1 class="sh-cv-k">Thiệp báo hỷ</h1>
    <p class="sh-cv-n">${esc(ctx.g)} <i>&amp;</i> ${esc(ctx.b)}</p>
    ${p ? `<p class="sh-cv-d">${p.d}.${p.m}.${p.y}</p><p class="sh-cv-l">${esc(ctx.weekday)} · Âm lịch ${esc(ctx.lunarShort)}</p>` : ''}
  </div>
  <div class="sh-cluster">${CLUSTER}</div>
</header>`;
  },

  sections: {
    // khung bo tròn: nhà trai | chữ Hỷ | nhà gái, báo tin lễ thành hôn
    invite(ctx) {
      const { d } = ctx;
      const fam = (x, label) => `<div class="sh-fam"><p class="k">${label}</p>${x.father ? `<p class="n">${esc(x.father)}</p>` : ''}${x.mother ? `<p class="n">${esc(x.mother)}</p>` : ''}${x.address ? `<p class="a">${esc(x.address)}</p>` : ''}</div>`;
      const hasFam = d.groom.father || d.groom.mother || d.bride.father || d.bride.mother;
      return `
  <section class="sec sh-inv">
    <div class="sh-box reveal">
      <span class="sh-ll l">${LINE_LOTUS}</span><span class="sh-ll r">${LINE_LOTUS}</span>
      <div class="sh-fams">${hasFam ? fam(d.groom, 'Nhà trai') : '<span></span>'}<span class="sh-hy">${HY}</span>${hasFam ? fam(d.bride, 'Nhà gái') : '<span></span>'}</div>
      <p class="sh-lead">Trân Trọng Báo Tin Lễ Thành Hôn Của</p>
      <p class="sh-full">${esc(d.groom.fullName || d.groom.name)}</p>
      <p class="sh-amp">&amp;</p>
      <p class="sh-full">${esc(d.bride.fullName || d.bride.name)}</p>
    </div>
  </section>`;
    },

    // ảnh tràn viền mờ dần vào nền, thư mời có tên khách
    guest(ctx) {
      const { d } = ctx;
      const img = d.cover || pick(d.photos, 0);
      return `
  <section class="sh-guest">
    ${img ? `<div class="sh-gph"><img loading="lazy" src="${esc(img)}" alt="Ảnh cưới"></div>` : ''}
    <div class="sh-gtx reveal">
      <h2 class="sh-cap">Thư mời tham dự tiệc cưới</h2>
      <p class="sh-lead">${esc(d.inviteText)}</p>
      <p class="sh-gname">${ctx.guest ? esc(ctx.guest.name) : 'Quý khách'}</p>
      <p class="sh-lead">tới dự bữa tiệc chung vui cùng gia đình chúng tôi</p>
      ${d.message ? `<p class="sh-msg">${esc(d.message)}</p>` : ''}
    </div>
  </section>`;
    },

    events(ctx, opts, h) {
      const evs = evList(ctx.d);
      if (!evs.length) return '';
      const party = partyEvent(ctx.d);
      const title = `Đám cưới ${ctx.g} & ${ctx.b}`;
      const div = `<div class="sh-div" aria-hidden="true"><i></i><span>${LINE_LOTUS}</span><i></i></div>`;
      const dir = party && (party.mapUrl || (party.address ? h.mapSearch(party.address) : ''));
      return `
  <section class="sec sh-evs">
    <span class="sh-side r">${LINE_LOTUS}</span>
    <svg class="sh-side l" viewBox="0 0 100 160" aria-hidden="true">${stem('M50 70C52 110 46 140 50 160')}${bud(50, 72, 0.9, -6)}</svg>
    ${evs.map((e, i) => {
      const iso = e.date || ctx.date;
      const p = h.parts(iso);
      return `${i ? div : ''}
    <div class="sh-ev reveal">
      <h3>${esc(e.name)}</h3>
      ${p ? `<p class="sh-ev-t">${esc(e.time || '')}${e.time ? ' - ' : ''}${esc(h.weekday(iso))}</p><p class="sh-ev-d">${p.d}.${p.m}.${p.y}</p><p class="sh-ev-l">(Tức ${esc(h.lunarText(iso).replace(/^Nhằm /i, ''))})</p>` : ''}
      ${e.place ? `<p class="sh-ev-p">Tại ${esc(e.place)}</p>` : ''}
      ${e.address && e !== party ? `<p class="sh-ev-a">${esc(e.address)}</p>` : ''}
      ${e.date ? `<a class="sh-ev-cal" target="_blank" rel="noopener" href="${esc(h.calendarLink(`${e.name} — ${title}`, e.date, e.time, e.address || e.place))}">Lưu vào lịch</a>` : ''}
    </div>`;
    }).join('')}
    ${party && party.address ? `<p class="sh-ev-a reveal">${esc(party.address)}</p><div class="sh-map reveal"><iframe loading="lazy" title="Bản đồ" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(party.address)}&amp;output=embed"></iframe></div>` : ''}
    ${dir ? `<a class="sh-pill reveal" target="_blank" rel="noopener" href="${esc(dir)}">Chỉ đường</a>` : ''}
  </section>`;
    },

    // lịch: năm bên trái, "Tháng" + số lớn bên phải, thanh thứ màu lá, ngày cưới tim hồng
    calendar(ctx) {
      const { d, dparts: p } = ctx;
      if (!p || (!d.show.calendar && !d.show.countdown)) return '';
      const y = +p.y, m = +p.m, day = +p.d;
      let grid = '';
      if (d.show.calendar) {
        const first = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
        const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
        let cells = '<span></span>'.repeat(first);
        for (let i = 1; i <= days; i++) cells += i === day ? `<span class="cal-on" aria-label="Ngày cưới ${i}"><b>${i}</b></span>` : `<span>${i}</span>`;
        grid = `<div class="sh-cal reveal"><div class="sh-cal-h"><span>${y}</span><span>Tháng <b>${m}</b></span></div><div class="sh-cal-w">${['Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'CN'].map((w) => `<span>${w}</span>`).join('')}</div><div class="sh-cal-g">${cells}</div></div>`;
      }
      const u = (k, l) => `<span><b data-cd="${k}">0</b><small>${l}</small></span>`;
      return `
  <section class="sec sh-calsec">
    <svg class="sh-side l2" viewBox="0 0 120 200" aria-hidden="true">${stem('M60 90C62 140 54 170 60 200')}${pad(40, 160, 40, 0.5, 20, 21)}${flower(60, 92, 0.62, 8)}</svg>
    ${grid}
    ${d.show.countdown ? `<div class="sh-cd reveal" role="timer">${u('d', 'Ngày')}${u('h', 'Giờ')}${u('m', 'Phút')}${u('s', 'Giây')}</div>` : ''}
  </section>`;
    },

    story(ctx) {
      if (!ctx.d.story) return '';
      return `
  <section class="sec sh-story reveal">
    <div class="sh-div" aria-hidden="true"><i></i><span>${LINE_LOTUS}</span><i></i></div>
    <p class="sh-story-k">Chuyện của chúng mình</p>
    ${ctx.d.story.split(/\n+/).map((x) => `<p>${esc(x)}</p>`).join('')}
  </section>`;
    },

    rsvp(ctx, opts, h) {
      const html = h.rsvp(ctx);
      return html ? html.replace('<form class="form" id="rsvpForm">', `<form class="form" id="rsvpForm"><span class="sh-ll f">${LINE_LOTUS}</span>`) : '';
    },

    // chữ Hỷ lớn, chạm để mở mã QR mừng cưới
    gift(ctx, opts, h) {
      if (!ctx.d.show.gift) return '';
      const html = h.giftCard(ctx, ctx.d.gifts.groom, 'groom') + h.giftCard(ctx, ctx.d.gifts.bride, 'bride');
      if (!html) return '';
      return `
  <section class="sec sh-gift reveal">
    <h2 class="sh-h">Gửi quà mừng</h2>
    <details class="sh-gd">
      <summary><span class="sh-hy big">${HY}</span><small>Chạm vào chữ Hỷ để xem mã QR</small></summary>
      <div class="gifts">${html}</div>
    </details>
  </section>`;
    },

    // album ghép: ảnh nhỏ + tiêu đề, ảnh lớn giữa kẹp hai ảnh hẹp, hai ảnh dưới; ảnh còn lại lưới 3 cột
    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      const btn = (u, i, cls = '') => `<button class="ph ${cls} reveal" data-i="${i}" style="background-image:url('${esc(u)}')" aria-label="Xem ảnh ${i + 1}"></button>`;
      const head = ph.slice(0, 6);
      const rest = ph.slice(6);
      return `
  <section class="sec sh-gal">
    <div class="sh-col${head.length < 6 ? ' few' : ''}">
      <div class="sh-col-t"><p class="s">Album</p><p class="k">Ảnh cưới</p></div>
      ${head.map((u, i) => btn(u, i, `g${i}`)).join('')}
    </div>
    ${rest.length ? `<div class="sh-more" style="grid-template-columns:repeat(${rest.length % 3 === 0 || rest.length > 4 ? 3 : Math.min(rest.length, 2)},1fr)">${rest.map((u, i) => btn(u, i + 6)).join('')}</div>` : ''}
  </section>`;
    },

    thanks(ctx) {
      return `
  <section class="sh-thanks reveal">
    ${petals('t')}
    <p class="sh-thx">Hân hạnh được đón tiếp!</p>
    <p class="sh-thx-n">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
    <div class="sh-pond">${POND}</div>
  </section>`;
    },
  },

  css: `
.sh-defs{position:absolute;width:0;height:0;overflow:hidden}
.tpl-senhong{background:var(--page)}
.tpl-senhong .card{background:var(--bg);box-shadow:0 0 40px rgba(60,80,50,.12)}
.tpl-senhong .sec{padding:48px 24px}
.sh-h{margin:0 0 8px;font-family:var(--font-title);font-weight:500;font-size:28px;letter-spacing:.06em;text-transform:uppercase;color:var(--accent)}
.sh-hsub{margin:0 0 24px;font-size:14px;font-style:italic;color:var(--muted)}
.sh-lead{margin:0 0 6px;font-size:16px;color:var(--ink)}
.sh-ll{position:absolute;width:90px;color:var(--gold);opacity:.55;pointer-events:none}
.sh-ll svg,.sh-side svg,.sh-hy svg{display:block;width:100%}

/* cánh sen trôi */
.sh-petals{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:2}
.sh-petals i{position:absolute;top:-30px;left:var(--x);width:var(--s);height:calc(var(--s) * 1.6);border-radius:0 100% 0 100%;background:linear-gradient(160deg,#fff 0%,var(--sh-p1) 55%,var(--sh-p2));opacity:.75;animation:shFall var(--t) linear var(--d) infinite}
@keyframes shFall{0%{transform:translate(0,0) rotate(0)}25%{transform:translate(18px,25vh) rotate(60deg)}50%{transform:translate(-10px,50vh) rotate(140deg)}75%{transform:translate(20px,75vh) rotate(220deg)}100%{transform:translate(0,105vh) rotate(300deg)}}
.sh-cover .sh-petals i,.sh-thanks .sh-petals i{animation-name:shFallB}
@keyframes shFallB{0%{transform:translate(0,0) rotate(0)}25%{transform:translate(18px,180px) rotate(60deg)}50%{transform:translate(-10px,360px) rotate(140deg)}75%{transform:translate(20px,540px) rotate(220deg)}100%{transform:translate(0,740px) rotate(300deg)}}
@keyframes shSway{50%{transform:rotate(-2deg)}}

/* ---------- bìa ---------- */
.sh-cover{position:relative;height:693px;max-height:100svh;min-height:600px;overflow:hidden;text-align:center;background:var(--bg)}
.sh-wash{position:absolute;border-radius:50%;filter:blur(30px)}
.sh-wash.a{right:-80px;top:-80px;width:260px;height:220px;background:var(--sh-wash);opacity:.9}
.sh-wash.b{left:-90px;bottom:60px;width:240px;height:300px;background:var(--sh-green);opacity:.9}
.sh-leaf{position:absolute;left:-70px;top:-50px;width:250px;transform-origin:20% 20%;animation:shSway 9s ease-in-out infinite}
.sh-cv-tx{position:relative;z-index:3;padding-top:180px}
.sh-cv-k{margin:0;font-family:'Josefin Sans',sans-serif;font-weight:300;font-size:32px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink)}
.sh-cv-n{margin:14px 0 10px;font-family:var(--font-script);font-size:42px;line-height:1.2;color:var(--ink);word-spacing:.08em}
.sh-cv-n i{font-style:normal;color:var(--sh-p2)}
.sh-cv-d{margin:0;font-family:'Josefin Sans',sans-serif;font-weight:400;font-size:28px;letter-spacing:.14em;color:var(--ink)}
.sh-cv-l{margin:6px 0 0;font-size:13px;font-style:italic;color:var(--muted)}
.sh-cluster{position:absolute;right:-36px;bottom:-24px;width:320px;z-index:1;transform-origin:70% 100%;animation:shSway 8s ease-in-out infinite}
.sh-cluster svg,.sh-leaf svg,.sh-pond svg{display:block;width:100%;overflow:visible}

/* ---------- khung báo tin ---------- */
.sh-inv{padding-top:30px!important}
.sh-box{position:relative;padding:30px 16px 34px;border:1.5px solid color-mix(in srgb,var(--accent) 55%,transparent);border-radius:30px;background:var(--paper);overflow:hidden}
.sh-ll.l{left:-6px;bottom:4px}.sh-ll.r{right:-6px;bottom:4px;transform:scaleX(-1)}
.sh-fams{display:grid;grid-template-columns:1fr 66px 1fr;gap:8px;align-items:center;margin-bottom:22px}
.sh-fam p{margin:0}
.sh-fam .k{font-family:var(--font-title);font-size:14px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px}
.sh-fam .n{font-family:var(--font-title);font-size:13px;line-height:1.5;text-transform:uppercase}
.sh-fam .a{margin-top:4px;font-size:12px;color:var(--muted)}
.sh-hy{display:block;width:62px;margin:0 auto}
.sh-full{position:relative;margin:0;font-family:var(--font-script);font-size:38px;line-height:1.25;word-spacing:.08em}
.sh-amp{position:relative;margin:2px 0;font-family:var(--font-script);font-size:30px;color:var(--sh-p2)}
.sh-box .sh-lead{position:relative;font-size:15px}

/* ---------- ảnh + thư mời ---------- */
.sh-guest{position:relative;text-align:center;padding-bottom:36px}
.sh-gph img{width:100%;aspect-ratio:4/3.4;object-fit:cover;object-position:50% 35%;-webkit-mask:linear-gradient(#000 70%,transparent);mask:linear-gradient(#000 70%,transparent)}
.sh-gtx{position:relative;margin-top:-34px;padding:0 24px}
.sh-cap{margin:0 0 14px;font-family:'Josefin Sans',sans-serif;font-weight:400;font-size:19px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}
.sh-gname{margin:4px 0 8px;font-family:var(--font-script);font-size:40px;line-height:1.25;color:var(--accent);word-spacing:.08em}
.sh-msg{max-width:330px;margin:14px auto 0;font-size:14px;font-style:italic;color:var(--muted)}

/* ---------- sự kiện ---------- */
.sh-evs{overflow:hidden}
.sh-side{position:absolute;pointer-events:none;z-index:0}
.sh-side.r{right:-34px;top:40px;width:110px;color:var(--gold);opacity:.45}
.sh-side.l{left:-30px;top:44%;width:80px;opacity:.85}
.sh-side.l2{right:-40px;top:-56px;width:110px;opacity:.9}
.sh-ev{position:relative;z-index:1}
.sh-ev h3{margin:0 0 4px;font-family:var(--font-title);font-weight:500;font-size:30px;line-height:1.2;letter-spacing:.04em;text-transform:uppercase;color:var(--ink)}
.sh-ev p{margin:0}
.sh-ev-t{font-family:'Josefin Sans',sans-serif;font-size:17px}
.sh-ev-d{margin:6px 0 2px!important;font-family:var(--font-title);font-weight:500;font-size:28px;letter-spacing:.14em}
.sh-ev-l{font-size:13px;font-style:italic;color:var(--muted)}
.sh-ev-p{margin-top:12px!important;font-size:17px}
.sh-ev-a{position:relative;z-index:1;margin:2px 0 0;font-size:14px;color:var(--muted)}
.sh-ev-cal{display:inline-block;margin-top:8px;font-family:'Josefin Sans',sans-serif;font-size:14px;font-weight:600;color:var(--accent);text-decoration:none;border-bottom:1px solid currentColor}
.sh-div{display:flex;align-items:center;gap:10px;width:min(240px,70%);margin:26px auto 22px;color:var(--gold)}
.sh-div i{flex:1;height:1px;background:linear-gradient(90deg,transparent,var(--gold))}
.sh-div i:last-child{background:linear-gradient(90deg,var(--gold),transparent)}
.sh-div span{width:34px}
.sh-div svg{display:block;width:100%}
.sh-map{position:relative;z-index:1;margin:16px 0 0;aspect-ratio:16/11;border-radius:22px;overflow:hidden;border:1px solid var(--line);background:var(--line)}
.sh-map iframe{width:100%;height:100%;border:0}
.sh-pill{position:relative;z-index:1;display:inline-block;margin-top:20px;padding:12px 40px;border-radius:999px;background:var(--accent);color:var(--accent-ink);font-family:var(--font-title);font-size:15px;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;box-shadow:0 6px 16px color-mix(in srgb,var(--accent) 30%,transparent)}

/* ---------- lịch ---------- */
.sh-calsec{overflow:hidden;--cal-hi:var(--sh-p2)}
.sh-cal{position:relative;width:min(340px,100%);margin:0 auto}
.sh-cal-h{display:flex;justify-content:space-between;align-items:baseline;padding:0 18px 8px;font-family:'Josefin Sans',sans-serif;font-size:22px;color:var(--ink)}
.sh-cal-h b{font-weight:400;font-size:44px;line-height:1}
.sh-cal-w{display:grid;grid-template-columns:repeat(7,1fr);padding:10px 4px;border-radius:12px;background:var(--accent);color:var(--accent-ink);font-family:var(--font-title);font-size:13px;letter-spacing:.06em;text-transform:uppercase}
.sh-cal-g{display:grid;grid-template-columns:repeat(7,1fr);row-gap:4px;padding:12px 4px 0;font-family:'Josefin Sans',sans-serif;font-size:16px}
.sh-cal-g span{display:grid;place-items:center;height:38px}
.sh-cal-g .cal-on{--cal-on:#fff}
.sh-cd{display:flex;justify-content:center;gap:12px;margin-top:26px}
.sh-cd span{display:grid;place-content:center;width:66px;height:66px;border-radius:50%;border:1px solid color-mix(in srgb,var(--accent) 45%,transparent);background:var(--paper)}
.sh-cd b{font-family:var(--font-title);font-weight:500;font-size:24px;line-height:1;color:var(--accent);font-variant-numeric:tabular-nums}
.sh-cd small{font-size:11px;color:var(--muted)}

/* ---------- câu chuyện ---------- */
.sh-story{padding-top:10px!important}
.sh-story .sh-story-k{margin:0 0 10px!important;font-family:var(--font-script);font-size:36px;color:var(--accent)}
.sh-story p{max-width:350px;margin:0 auto 10px;font-size:15px;line-height:1.75}

/* ---------- biểu mẫu, quà, lưu bút ---------- */
.tpl-senhong .form{position:relative;overflow:hidden;border-radius:28px;border:1.5px solid color-mix(in srgb,var(--accent) 50%,transparent);padding:26px 20px}
.sh-ll.f{right:-8px;top:-6px;width:100px;opacity:.4}
.tpl-senhong .form>*:not(.sh-ll){position:relative}
.tpl-senhong .form input:not([type=radio]),.tpl-senhong .form select,.tpl-senhong .form textarea,.tpl-senhong .choice label{border-radius:10px;background:#fff}
.tpl-senhong .choice input{accent-color:var(--sh-p2)}
.tpl-senhong .btn{border-radius:12px;font-weight:500;letter-spacing:.04em}
.sh-gd summary{list-style:none;cursor:pointer;display:grid;justify-items:center;gap:10px}
.sh-gd summary::-webkit-details-marker{display:none}
.sh-hy.big{width:150px;animation:shBeat 2.6s ease-in-out infinite}
@keyframes shBeat{50%{transform:scale(1.05)}}
.sh-gd small{font-size:13px;font-style:italic;color:var(--muted)}
.sh-gd[open] .sh-hy.big{animation:none;width:96px}
.sh-gd .gifts{margin-top:22px}
.tpl-senhong .gift{border-radius:24px;border-color:color-mix(in srgb,var(--accent) 30%,transparent)}
.tpl-senhong .gift-who{font-family:var(--font-title);font-weight:500;letter-spacing:.06em;text-transform:uppercase;font-size:16px}
.tpl-senhong .wish{border-radius:16px;background:var(--paper)}

/* ---------- album ---------- */
.sh-gal{padding-left:14px!important;padding-right:14px!important;overflow:hidden}
.sh-col{display:grid;grid-template-columns:repeat(6,1fr);grid-template-areas:"a a t t t t" "a a t t t t" "c b b b b d" "c b b b b d" "c b b b b d" "e e e f f f" "e e e f f f";grid-auto-rows:minmax(48px,auto);gap:10px}
.sh-col .ph{aspect-ratio:auto;border-radius:2px;background-position:center 30%;box-shadow:0 6px 14px rgba(40,60,40,.14);min-height:0}
.sh-col .ph:nth-child(n){aspect-ratio:auto}
.sh-col .ph.g0{grid-area:a;transform:rotate(-2deg)}
.sh-col .ph.g1{grid-area:b;min-height:260px;z-index:1;box-shadow:0 10px 26px rgba(40,60,40,.22)}
.sh-col .ph.g2{grid-area:c;margin:20px 0}
.sh-col .ph.g3{grid-area:d;margin:20px 0}
.sh-col .ph.g4{grid-area:e;min-height:180px;transform:rotate(-1.5deg)}
.sh-col .ph.g5{grid-area:f;min-height:180px;transform:rotate(1.5deg)}
.sh-col-t{grid-area:t;align-self:center;text-align:left;padding-left:10px}
.sh-col-t p{margin:0}
.sh-col-t .s{font-family:var(--font-script);font-size:52px;line-height:1;color:var(--ink)}
.sh-col-t .k{margin:-4px 0 0 40px!important;font-size:20px;font-style:italic}
.sh-col.few{grid-template-areas:none;grid-template-columns:1fr 1fr}
.sh-col.few .ph{grid-area:auto!important;aspect-ratio:3/4;transform:none;margin:0}
.sh-col.few .sh-col-t{grid-area:auto;grid-column:span 2;text-align:center}
.sh-more{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
.sh-more .ph,.sh-more .ph:nth-child(3n+1){grid-column:auto;aspect-ratio:3/4;border-radius:2px}

/* ---------- cảm ơn + ao sen ---------- */
.sh-thanks{position:relative;padding:40px 0 0;text-align:center;overflow:hidden}
.sh-thx{position:relative;z-index:3;margin:0;font-family:'Josefin Sans',sans-serif;font-weight:400;font-size:22px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}
.sh-thx-n{position:relative;z-index:3;margin:10px 0 0;font-family:var(--font-script);font-size:40px;word-spacing:.08em}
.sh-pond{margin-top:6px}
.tpl-senhong .credit{background:var(--bg)}

/* ---------- màn mở thiệp: nụ sen nở ---------- */
.sh-opener{background:radial-gradient(ellipse at 50% 30%,var(--sh-wash),transparent 60%),radial-gradient(ellipse at 50% 100%,var(--sh-green),transparent 55%),var(--bg);overflow:hidden}
.sh-o-in{position:relative;z-index:3;text-align:center;padding:20px;transition:opacity .6s ease .7s}
.sh-o-in p{margin:0}
.sh-o-bud{width:200px;overflow:visible}
.sh-o-bud .p{transform-box:view-box;transform-origin:0 0;transform:rotate(calc(var(--a) * .22));transition:transform 1.1s cubic-bezier(.3,.7,.3,1)}
.sh-o-k{margin-top:10px!important;font-family:'Josefin Sans',sans-serif;font-weight:300;font-size:26px;letter-spacing:.14em;text-transform:uppercase}
.sh-o-n{font-family:var(--font-script);font-size:36px;word-spacing:.08em}
.sh-o-to{margin-top:18px!important;font-size:13px;font-style:italic;color:var(--muted)}
.sh-o-g{font-family:var(--font-script);font-size:32px;color:var(--accent);word-spacing:.08em}
.sh-o-btn{margin-top:18px;padding:11px 32px;border:0;border-radius:999px;background:var(--accent);color:var(--accent-ink);font-family:var(--font-title);font-size:14px;letter-spacing:.14em;text-transform:uppercase;animation:shBeat 2.4s ease-in-out infinite}
.sh-opener.opening .sh-o-bud .p{transform:rotate(var(--a)) scale(1.08)}
.sh-opener.opening .sh-o-in>*:not(svg){opacity:0;transition:opacity .4s}

@media (prefers-reduced-motion:reduce){.sh-petals{display:none}.sh-leaf,.sh-cluster,.sh-hy.big,.sh-o-btn{animation:none!important}}
@media (min-width:768px){.tpl-senhong .card{margin:24px auto;min-height:0}.sh-cover{max-height:none}}
`,
};
