// Mẫu "Đèn Lồng" — dễ thương, nhẹ nhàng: nền xanh bạc hà loang màu nước, đèn lồng treo đung đưa, lá rủ,
// khung vòm lớn chứa lời mời + khối ngày, minh hoạ cô dâu chú rể nhỏ, thẻ địa điểm "mái vòm", lịch tháng trên ảnh.
const { esc } = require('../lib/util');

const base = {
  '--font-title': "'Playfair Display',Georgia,serif",
  '--font-script': "'Great Vibes',cursive",
  '--font-body': "'Quicksand',system-ui,sans-serif",
};

const evList = (d) => d.events.filter((e) => e.name || e.place);
const hh = (t) => (t ? `${t.split(':')[0]}h${t.split(':')[1]}` : '');

// đèn lồng: dây treo dài `len`, thân bầu có nan, chóp & đáy vàng, tua rua
const LANTERN = (cls = '', len = 30) => `<svg class="dl-lan ${cls}" viewBox="0 0 40 ${len + 66}" aria-hidden="true">
  <line x1="20" y1="0" x2="20" y2="${len}" stroke="var(--dl-string)" stroke-width="1"/>
  <g transform="translate(0 ${len})">
    <ellipse cx="20" cy="26" rx="22" ry="24" fill="var(--dl-glow)"/>
    <rect x="13" y="0" width="14" height="5" rx="1.5" fill="var(--gold)"/>
    <path d="M14 5 Q-3 24 14 46 L26 46 Q43 24 26 5 Z" fill="var(--dl-lan)"/>
    <path d="M20 5 V46 M14 5 Q4 25 14 46 M26 5 Q36 25 26 46" fill="none" stroke="var(--dl-rib)" stroke-width="1"/>
    <path d="M6 18 Q20 22 34 18 M6 33 Q20 37 34 33" fill="none" stroke="var(--dl-rib)" stroke-width=".7" opacity=".7"/>
    <rect x="13" y="46" width="14" height="4" rx="1.5" fill="var(--gold)"/>
    <circle cx="20" cy="53" r="2" fill="var(--dl-tassel)"/>
    <path d="M20 54 V66 M17.5 55 V64 M22.5 55 V64" stroke="var(--dl-tassel)" stroke-width="1.3" stroke-linecap="round"/>
  </g>
</svg>`;

// cành lá dài thuôn (kiểu lá trúc / lá liễu màu nước)
const LEAF = 'M0 0 Q11 -38 0 -86 Q-11 -38 0 0Z';
const LEAVES = (cls) => `<svg class="${cls}" viewBox="0 0 200 220" aria-hidden="true">
  <defs><linearGradient id="dlLg${cls.replace(/\W/g, '')}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="var(--dl-leaf2)"/><stop offset="1" stop-color="var(--dl-leaf)"/></linearGradient></defs>
  <path d="M10 6 Q90 40 150 200" fill="none" stroke="var(--dl-leaf2)" stroke-width="1.6"/>
  <g fill="url(#dlLg${cls.replace(/\W/g, '')})" opacity=".85">
    ${[[40, 20, 130], [70, 42, 160], [98, 76, 120], [118, 112, 170], [134, 150, 140], [60, 34, 80], [112, 100, 70], [146, 184, 110]]
      .map(([x, y, r]) => `<path d="${LEAF}" transform="translate(${x} ${y}) rotate(${r})"/>`).join('')}
  </g>
</svg>`;

// cô dâu chú rể nhỏ, nét mảnh (chú rể cầm bóng bay trái tim)
const MINI = `<svg class="dl-mini" viewBox="0 0 120 120" role="img" aria-label="Minh hoạ cô dâu chú rể">
  <path d="M42 62 Q40 36 60 14" fill="none" stroke="var(--ink)" stroke-width=".8"/>
  <path class="dl-bal" d="M60 22s-9-5.5-11.6-10.9C46.5 7.2 48.7 2 53.6 2c2.7 0 4.6 1.6 6.4 4 1.8-2.4 3.7-4 6.4-4 4.9 0 7.1 5.2 5.2 9.1C69 16.5 60 22 60 22z" fill="var(--dl-heart)"/>
  <path d="M35 108 L36 84 L54 84 L55 108 Z" fill="var(--dl-suit)"/>
  <path d="M32 50 Q45 44 58 50 L58 86 L32 86 Z" fill="var(--dl-suit)"/>
  <path d="M41 48 L45 62 L49 48 Z" fill="#fff"/>
  <path d="M33 54 Q30 70 34 78" fill="none" stroke="var(--dl-suit)" stroke-width="6" stroke-linecap="round"/>
  <path d="M57 54 Q62 60 66 66" fill="none" stroke="var(--dl-suit)" stroke-width="6" stroke-linecap="round"/>
  <circle cx="42" cy="62" r="3" fill="#f6dccb"/>
  <circle cx="45" cy="34" r="12" fill="#f6dccb" stroke="var(--ink)" stroke-width=".6"/>
  <path d="M33 33 Q32 20 46 21 Q58 21 57 33 Q52 26 44 27 Q38 27 33 33Z" fill="#3a2b26"/>
  <path d="M40 36q2.5-2.5 5 0M47 36q2.5-2.5 5 0" fill="none" stroke="#3a2b26" stroke-width="1.2" stroke-linecap="round"/>
  <circle cx="39" cy="40" r="2" fill="#f4a8a8" opacity=".7"/><circle cx="53" cy="40" r="2" fill="#f4a8a8" opacity=".7"/>
  <path d="M86 26 Q104 40 102 104 Q94 88 88 60Z" fill="#fff" opacity=".7"/>
  <path d="M70 52 Q78 48 86 52 L98 108 L58 108 Z" fill="#fff" stroke="var(--ink)" stroke-width=".7"/>
  <path d="M70 52 Q66 60 66 66 M86 52 Q90 62 88 72" fill="none" stroke="#f6dccb" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="88" cy="74" r="5" fill="var(--dl-heart)"/><circle cx="84" cy="77" r="3.5" fill="#fff" stroke="var(--dl-leaf2)" stroke-width=".6"/>
  <circle cx="78" cy="36" r="11.5" fill="#f6dccb" stroke="var(--ink)" stroke-width=".6"/>
  <path d="M66 38 Q64 22 78 23 Q91 23 90 38 L90 50 Q86 50 85 44 Q84 30 76 29 Q70 31 70 46 Q66 46 66 38Z" fill="#3a2b26"/>
  <circle cx="86" cy="24" r="5.5" fill="#3a2b26"/>
  <path d="M73 38q2.5-2.5 5 0M80 38q2.5-2.5 5 0" fill="none" stroke="#3a2b26" stroke-width="1.2" stroke-linecap="round"/>
  <circle cx="72" cy="42" r="2" fill="#f4a8a8" opacity=".7"/><circle cx="86" cy="42" r="2" fill="#f4a8a8" opacity=".7"/>
</svg>`;

const RINGS = '<svg class="dl-rings" viewBox="0 0 40 26" aria-hidden="true"><circle cx="15" cy="15" r="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="25" cy="15" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 4l3-3 3 3-3 2z" fill="var(--gold)"/></svg>';

const pin = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>';

module.exports = {
  id: 'denlong',
  name: 'Đèn Lồng',
  group: 'minhhoa',
  badge: 'Mới',
  desc: 'Xanh bạc hà màu nước, đèn lồng đung đưa, khung vòm lời mời và minh hoạ đôi uyên ương',
  fonts: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=Great+Vibes&family=Quicksand:wght@400;500;600;700&family=Patrick+Hand&display=swap',
  palettes: [
    { id: 'xanh-mint', name: 'Xanh bạc hà', swatch: ['#b7d3c5', '#2a5a43'], vars: { ...base, '--page': '#9fbfb0', '--bg': '#b7d3c5', '--paper': '#fbfcf8', '--ink': '#21483a', '--muted': '#5f7d70', '--accent': '#2a5a43', '--accent-ink': '#fff', '--gold': '#cfa864', '--line': '#d8e5de', '--dl-lan': '#fff5e4', '--dl-rib': '#e2c99c', '--dl-glow': 'rgba(255,240,200,.35)', '--dl-string': '#5c7a6c', '--dl-tassel': '#c9606a', '--dl-leaf': '#9cc2ad', '--dl-leaf2': '#4f8a6d', '--dl-heart': '#e7737f', '--dl-suit': '#2d3b35', '--dl-wash': 'rgba(255,255,255,.4)', '--dl-script': '#b4485a' } },
    { id: 'hong-phan', name: 'Hồng phấn', swatch: ['#efd3d3', '#8a3d4c'], vars: { ...base, '--page': '#e2bcbf', '--bg': '#efd3d3', '--paper': '#fffaf8', '--ink': '#5a2c36', '--muted': '#94707a', '--accent': '#8a3d4c', '--accent-ink': '#fff', '--gold': '#d1a66a', '--line': '#f1dfdd', '--dl-lan': '#fff3ec', '--dl-rib': '#e6bfa8', '--dl-glow': 'rgba(255,230,220,.4)', '--dl-string': '#a07a80', '--dl-tassel': '#b44a5e', '--dl-leaf': '#c9d8c1', '--dl-leaf2': '#7fa287', '--dl-heart': '#d9586c', '--dl-suit': '#3a2f33', '--dl-wash': 'rgba(255,255,255,.45)', '--dl-script': '#a43a52' } },
  ],
  demo: {
    cover: '/demo/hoamoc-5.webp',
    photos: [2, 3, 4, 6, 7, 8].map((n) => `/demo/hoamoc-${n}.webp`),
    message: 'Gửi đến bạn tấm thiệp nhỏ đầy yêu thương. Mong bạn cùng gia đình đến chung vui, cùng chứng kiến khoảnh khắc hạnh phúc nhất của hai đứa. Sự có mặt của bạn là món quà quý giá nhất với chúng mình!',
  },
  layout: ['invite', 'events', 'calendar', 'rsvp', 'story', 'gallery', 'gift', 'wishes', 'thanks'],

  title(text, sub) {
    return `<h2 class="dl-h">${esc(text)}</h2>${sub ? `<p class="sec-sub">${esc(sub)}</p>` : ''}`;
  },

  opener(ctx) {
    return `
<div class="opener dl-opener" id="opener" data-open-ms="900">
  <div class="dl-olans">${LANTERN('a', 60)}${LANTERN('b', 110)}${LANTERN('c', 40)}${LANTERN('d', 90)}</div>
  <div class="dl-ocard">
    <p class="dl-oto">${ctx.guest ? 'Gửi tới' : 'Trân trọng kính mời'}</p>
    <p class="dl-oguest">${ctx.guest ? esc(ctx.guest.name) : 'Bạn và người thương'}</p>
    <p class="dl-onames">${esc(ctx.g)} ${RINGS} ${esc(ctx.b)}</p>
    <button class="dl-obtn" id="openBtn" type="button">Mở thiệp</button>
  </div>
</div>`;
  },

  cover(ctx) {
    const p = ctx.dparts;
    return `
<header class="dl-cover">
  <div class="dl-lans">${LANTERN('a', 8)}${LANTERN('b', 30)}${LANTERN('c', 16)}</div>
  ${LEAVES('dl-lv lv1')}${LEAVES('dl-lv lv2')}
  <div class="dl-arch">
    <p class="dl-kinh">Trân trọng kính mời</p>
    <p class="dl-guest">${ctx.guest ? esc(ctx.guest.name) : 'Bạn và người thương'}</p>
    <p class="dl-to">Tham dự lễ thành hôn</p>
    <h1 class="dl-names"><span>${esc(ctx.g)}</span>${RINGS}<span>${esc(ctx.b)}</span></h1>
    ${p ? `<div class="dl-date"><span>${esc(ctx.weekday)}</span><div><em>Tháng ${+p.m}</em><b>${p.d}</b><em>Năm ${p.y}</em></div><span>${esc(hh(ctx.time)) || '&nbsp;'}</span></div>` : ''}
    ${MINI}
    <p class="dl-quote">Một mái nhà, hai trái tim<br>cùng nhau đi hết đường dài</p>
  </div>
</header>`;
  },

  sections: {
    invite(ctx) {
      const { d } = ctx;
      const ph = d.photos.length ? d.photos : [d.cover].filter(Boolean);
      const pa = ph[0] || d.cover, pb = ph[1] || ph[0] || d.cover;
      const fam = (x, label, role, photo, side) => `
    <div class="dl-fam ${side} reveal">
      ${photo ? `<div class="dl-archph"><img src="${esc(photo)}" alt=""></div>` : ''}
      <div class="dl-ftxt">
        <h3>${label}</h3>
        ${x.father ? `<p>${esc(x.father)}</p>` : ''}${x.mother ? `<p>${esc(x.mother)}</p>` : ''}
        ${x.address ? `<p class="a">${pin}${esc(x.address)}</p>` : ''}
        <p class="dl-role">${role}</p>
        <p class="dl-fn">${esc(x.fullName || x.name)}</p>
      </div>
    </div>`;
      return `
  <section class="sec dl-invite">
    ${d.message ? `<p class="dl-msg reveal">${esc(d.message)}</p>` : ''}
    <div class="dl-band reveal">Wedding Invitation</div>
    <p class="dl-lead reveal">${esc(d.inviteText)} tới dự lễ thành hôn của con chúng tôi</p>
    ${fam(d.groom, 'Nhà Trai', 'Chú rể', pa, 'r')}
    ${fam(d.bride, 'Nhà Gái', 'Cô dâu', pb, 'l')}
  </section>`;
    },

    events(ctx, opts, h) {
      const evs = evList(ctx.d);
      if (!evs.length) return '';
      const title = `Đám cưới ${ctx.g} & ${ctx.b}`;
      return `
  <section class="sec dl-events">
    ${evs.map((e, i) => {
      const date = e.date || ctx.date;
      const p = h.parts(date);
      const dir = e.mapUrl || (e.address ? h.mapSearch(e.address) : '');
      return `
    <article class="dl-ev ${i % 2 ? 'alt' : ''} reveal">
      <div class="dl-evmain">
        <div class="dl-evtab"><p>${esc(e.name || 'Nhà có hỷ')}</p></div>
        <div class="dl-evcard">
          ${e.place ? `<h3>${esc(e.place)}</h3>` : ''}
          ${e.address ? `<p class="dl-addr">${esc(e.address)}</p>` : ''}
          ${dir ? `<a class="dl-btn" target="_blank" rel="noopener" href="${esc(dir)}">${pin}Chỉ đường</a>` : ''}
          ${p ? `<div class="dl-evwhen"><span>${esc(hh(e.time))}</span><b>${p.d}.${p.m}.${p.y}</b><span>${esc(h.weekday(date))}</span></div>
          <p class="dl-lunar">(${esc(h.lunarText(date))})</p>
          <a class="dl-cal" target="_blank" rel="noopener" href="${esc(h.calendarLink(`${e.name} — ${title}`, date, e.time, e.address || e.place))}">+ Lưu vào lịch</a>` : ''}
        </div>
      </div>
      <div class="dl-evside">${LANTERN('', 34 + (i % 2) * 26)}</div>
    </article>`;
    }).join('')}
  </section>`;
    },

    calendar(ctx, opts, h) {
      const { d, dparts: p } = ctx;
      if (!p || (!d.show.calendar && !d.show.countdown)) return '';
      const photo = d.cover || d.photos[0] || '';
      const u = (k, l) => `<span><b data-cd="${k}">0</b><small>${l}</small></span>`;
      return `
  <section class="sec dl-calsec reveal">
    <div class="dl-calph"${photo ? ` style="background-image:url('${esc(photo)}')"` : ''}>
      ${d.show.countdown ? `<div class="dl-cd" role="timer">${u('d', 'Ngày')}${u('h', 'Giờ')}${u('m', 'Phút')}${u('s', 'Giây')}</div>` : ''}
      ${d.show.calendar ? `<div class="dl-calcard">${h.calGrid(ctx, `<p class="dl-calh"><b>${p.m}</b><i>/</i>${p.y}</p>`)}<p class="dl-calsub">${esc(ctx.weekday)} · ${esc(ctx.lunarShort)} âm lịch</p></div>` : ''}
    </div>
  </section>`;
    },

    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      return `
  <section class="sec dl-album">
    <h2 class="dl-tagh reveal">Album ảnh cưới</h2>
    <div class="dl-mag">
      ${ph.map((u, i) => `<button class="ph reveal" data-i="${i}" aria-label="Xem ảnh ${i + 1}"><img decoding="async" src="${esc(u)}" alt=""></button>`).join('')}
    </div>
  </section>`;
    },

    thanks(ctx) {
      return `
  <section class="sec dl-thanks reveal">
    <div class="dl-notes">
      <div class="dl-note back2"></div><div class="dl-note back1"></div>
      <div class="dl-note front">
        <p>Cảm ơn bạn vì đã cùng chúng mình lưu giữ khoảnh khắc đẹp nhất trong hành trình yêu thương.</p>
        <p>Thật hạnh phúc khi được bắt đầu chặng đường mới, và càng hạnh phúc hơn khi có bạn ở bên chứng kiến.</p>
        <p class="dl-sign">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
      </div>
    </div>
  </section>`;
    },
  },

  css: `
.tpl-denlong{background:var(--page)}
.tpl-denlong .card{font-variant-numeric:lining-nums;color:var(--ink);background:
  radial-gradient(ellipse 70% 40% at 15% 8%,var(--dl-wash),transparent 70%),
  radial-gradient(ellipse 60% 30% at 90% 35%,var(--dl-wash),transparent 70%),
  radial-gradient(ellipse 80% 30% at 20% 65%,rgba(0,40,30,.07),transparent 70%),
  radial-gradient(ellipse 60% 25% at 85% 88%,var(--dl-wash),transparent 70%),
  url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .07 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"),
  var(--bg)}
.tpl-denlong .dl-lan{display:block;overflow:visible}
/* ---------- bìa: khung vòm ---------- */
.tpl-denlong .dl-cover{position:relative;min-height:693px;padding:26px 16px 22px;display:flex}
.tpl-denlong .dl-arch{position:relative;flex:1;display:flex;flex-direction:column;align-items:center;padding:78px 18px 18px;background:var(--paper);border-radius:180px 180px 6px 6px;box-shadow:0 10px 30px rgba(20,60,45,.12);text-align:center}
.tpl-denlong .dl-lans{position:absolute;z-index:3;top:0;left:10px;display:flex;align-items:flex-start;gap:4px}
.tpl-denlong .dl-lans .dl-lan{width:36px;transform-origin:50% 0;animation:dlSwing 3.6s ease-in-out infinite}
.tpl-denlong .dl-lans .b{width:46px;animation-duration:4.4s;animation-delay:-1.2s}
.tpl-denlong .dl-lans .c{width:32px;animation-duration:3.1s;animation-delay:-2s}
@keyframes dlSwing{0%,100%{transform:rotate(5deg)}50%{transform:rotate(-5deg)}}
.tpl-denlong .dl-lv{position:absolute;z-index:2;pointer-events:none}
.tpl-denlong .lv1{width:124px;top:-24px;right:-34px;transform:scaleX(-1) rotate(-8deg);transform-origin:top;animation:dlLeaf 6s ease-in-out infinite}
.tpl-denlong .lv2{width:120px;top:380px;left:-40px;transform:rotate(20deg);animation:dlLeaf2 7s ease-in-out infinite}
@keyframes dlLeaf{50%{transform:scaleX(-1) rotate(-3deg)}}
@keyframes dlLeaf2{50%{transform:rotate(14deg)}}
.tpl-denlong .dl-kinh{margin:0;font-size:14px;font-weight:600;letter-spacing:.06em;color:var(--ink)}
.tpl-denlong .dl-guest{margin:2px 0 0;font-family:var(--font-script);font-size:31px;line-height:1.25;color:var(--accent);font-weight:400}
.tpl-denlong .dl-to{margin:4px 0 0;font-size:14px;font-weight:600;letter-spacing:.06em}
.tpl-denlong .dl-names{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:4px 10px;margin:10px 0 0;font-family:var(--font-script);font-weight:400;font-size:33px;line-height:1.2;color:var(--accent)}
.tpl-denlong .dl-rings{width:34px;height:22px;color:var(--accent)}
.tpl-denlong .dl-date{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;width:100%;max-width:310px;margin:16px 0 0;font-family:var(--font-title);color:var(--accent)}
.tpl-denlong .dl-date>span{font-size:17px}
.tpl-denlong .dl-date>div{display:flex;flex-direction:column;padding:0 16px;border-left:3px solid var(--accent);border-right:3px solid var(--accent)}
.tpl-denlong .dl-date em{font-style:normal;font-size:17px;line-height:1.3}
.tpl-denlong .dl-date b{font-weight:400;font-size:58px;line-height:1.05}
.tpl-denlong .dl-mini{width:150px;height:150px;margin:auto 0 0;animation:dlBob 3.4s ease-in-out infinite}
.tpl-denlong .dl-bal{transform-box:fill-box;transform-origin:50% 100%;animation:dlBal 2.6s ease-in-out infinite}
@keyframes dlBob{50%{transform:translateY(-4px)}}
@keyframes dlBal{50%{transform:rotate(8deg) translateY(-2px)}}
.tpl-denlong .dl-quote{margin:auto 0 0;padding-top:8px;font-family:var(--font-script);font-size:24px;line-height:1.35;color:var(--dl-script)}
/* ---------- lời mời ---------- */
.tpl-denlong .dl-invite{padding:22px 0 30px}
.tpl-denlong .dl-msg{margin:0 22px 26px;font-size:14px;line-height:1.85;color:var(--ink)}
.tpl-denlong .dl-band{padding:10px 0;background:var(--accent);color:var(--accent-ink);font-family:var(--font-title);font-size:21px;letter-spacing:.14em}
.tpl-denlong .dl-lead{margin:18px 24px 6px;font-size:14px;color:var(--muted)}
.tpl-denlong .dl-fam{display:grid;grid-template-columns:46% 1fr;gap:14px;align-items:center;padding:22px 16px 0}
.tpl-denlong .dl-fam.l{grid-template-columns:1fr 46%}
.tpl-denlong .dl-fam.l .dl-archph{order:2}
.tpl-denlong .dl-archph{aspect-ratio:3/4;padding:7px;background:var(--paper);border-radius:999px 999px 10px 10px;box-shadow:0 8px 22px rgba(20,60,45,.15)}
.tpl-denlong .dl-archph img{width:100%;height:100%;object-fit:cover;border-radius:999px 999px 6px 6px}
.tpl-denlong .dl-ftxt{text-align:left;font-size:14px;line-height:1.6}
.tpl-denlong .dl-fam.l .dl-ftxt{text-align:right}
.tpl-denlong .dl-ftxt h3{margin:0 0 6px;font-family:var(--font-title);font-weight:400;font-size:24px;color:var(--accent-ink);text-shadow:0 1px 6px rgba(0,0,0,.18)}
.tpl-denlong .dl-ftxt p{margin:0}
.tpl-denlong .dl-ftxt .a{margin-top:4px;color:var(--muted);font-size:13px}
.tpl-denlong .dl-ftxt .a svg{vertical-align:-2px;margin-right:2px;color:var(--accent)}
.tpl-denlong .dl-role{margin-top:14px!important;font-family:var(--font-title);font-size:16px}
.tpl-denlong .dl-fn{font-family:var(--font-title);font-size:19px;line-height:1.3;color:var(--accent)}
/* ---------- địa điểm: thẻ mái vòm ---------- */
.tpl-denlong .dl-events{padding:36px 14px 20px}
.tpl-denlong .dl-ev{display:grid;grid-template-columns:1fr 64px;gap:10px;align-items:start;margin-bottom:34px}
.tpl-denlong .dl-ev.alt{grid-template-columns:64px 1fr}
.tpl-denlong .dl-ev.alt .dl-evmain{order:2}
.tpl-denlong .dl-evtab{width:78%;margin:0 auto -1px;padding:14px 10px 6px;background:var(--paper);border-radius:999px 999px 0 0}
.tpl-denlong .dl-evtab p{margin:0;font-family:var(--font-script);font-size:30px;line-height:1.2;color:var(--dl-script)}
.tpl-denlong .dl-evcard{padding:18px 14px 16px;background:var(--paper);border-radius:6px;box-shadow:0 10px 24px rgba(20,60,45,.12)}
.tpl-denlong .dl-evcard h3{margin:0;font-family:var(--font-title);font-weight:400;font-size:22px;line-height:1.3;color:var(--accent)}
.tpl-denlong .dl-addr{margin:6px 0 0;font-size:13px;color:var(--muted)}
.tpl-denlong .dl-btn{display:inline-flex;align-items:center;gap:6px;margin-top:12px;padding:9px 20px;border-radius:10px;background:var(--accent);color:var(--accent-ink);text-decoration:none;font-weight:600;font-size:14px;box-shadow:0 4px 10px rgba(20,60,45,.2)}
.tpl-denlong .dl-evwhen{display:flex;justify-content:space-between;align-items:baseline;gap:6px;margin-top:14px;font-family:var(--font-title);color:var(--accent)}
.tpl-denlong .dl-evwhen span{font-size:15px}
.tpl-denlong .dl-evwhen b{font-weight:400;font-size:21px}
.tpl-denlong .dl-lunar{margin:6px 0 0;font-size:12.5px;color:var(--muted)}
.tpl-denlong .dl-cal{display:inline-block;margin-top:8px;font-size:13px;font-weight:700;color:var(--accent);text-decoration:none}
.tpl-denlong .dl-evside{display:flex;justify-content:center}
.tpl-denlong .dl-evside .dl-lan{width:44px;transform-origin:50% 0;animation:dlSwing 4s ease-in-out infinite}
.tpl-denlong .dl-ev.alt .dl-evside .dl-lan{animation-delay:-1.5s}
/* ---------- lịch trên ảnh ---------- */
.tpl-denlong .dl-calsec{padding:10px 0 30px}
.tpl-denlong .dl-calph{position:relative;min-height:600px;background:var(--line) center/cover no-repeat;-webkit-mask:linear-gradient(transparent,#000 9%,#000 91%,transparent);mask:linear-gradient(transparent,#000 9%,#000 91%,transparent)}
.tpl-denlong .dl-cd{position:absolute;left:16px;top:60px;display:grid;gap:10px}
.tpl-denlong .dl-cd span{display:flex;flex-direction:column;align-items:center;justify-content:center;width:58px;height:58px;border-radius:10px;background:var(--accent);color:var(--accent-ink);box-shadow:0 6px 14px rgba(0,0,0,.18)}
.tpl-denlong .dl-cd b{font-size:20px;line-height:1.1;font-weight:600;font-variant-numeric:tabular-nums}
.tpl-denlong .dl-cd small{font-size:11px;opacity:.85}
.tpl-denlong .dl-calcard{position:absolute;right:12px;bottom:56px;width:min(282px,78%);padding:14px 10px 10px;border-radius:16px;background:color-mix(in srgb,var(--paper) 78%,transparent);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 10px 30px rgba(0,0,0,.15)}
.tpl-denlong .dl-calh{display:flex;align-items:baseline;justify-content:center;gap:8px;margin:0 0 6px;font-family:var(--font-title);font-size:20px;color:var(--accent)}
.tpl-denlong .dl-calh b{font-weight:400;font-size:34px}
.tpl-denlong .dl-calh i{font-style:normal;opacity:.5}
.tpl-denlong .cal{--cal-hi:var(--dl-heart);width:100%}
.tpl-denlong .cal-grid{font-size:13px;row-gap:2px}
.tpl-denlong .cal-grid span{height:30px}
.tpl-denlong .cal-on::before{width:32px;height:30px}
.tpl-denlong .dl-calsub{margin:4px 0 0;font-size:12px;color:var(--muted)}
/* ---------- xác nhận, câu chuyện, quà, lưu bút ---------- */
.tpl-denlong .dl-h{margin:0 0 18px;font-family:var(--font-title);font-weight:400;font-size:24px;color:var(--accent)}
.tpl-denlong .sec-sub{margin:-12px 0 22px}
.tpl-denlong .s-rsvp .form,.tpl-denlong .s-wishes .form{box-shadow:0 10px 26px rgba(20,60,45,.12);border:0}
.tpl-denlong .s-rsvp{padding-top:20px}
.tpl-denlong .s-rsvp .dl-h{margin-bottom:-2px;position:relative;z-index:1;display:inline-block;padding:14px 26px 8px;background:var(--paper);border-radius:999px 999px 0 0}
.tpl-denlong .s-rsvp .sec-sub{display:none}
.tpl-denlong .s-rsvp .form{border-radius:14px}
.tpl-denlong .btn{border-radius:10px}
.tpl-denlong .s-story{margin:0 18px;padding:34px 18px;background:color-mix(in srgb,var(--paper) 60%,transparent);border-radius:999px 999px 14px 14px}
.tpl-denlong .s-story .dl-h{padding-top:18px}
.tpl-denlong .s-story p{font-size:15px;line-height:1.8}
.tpl-denlong .gift{box-shadow:0 10px 24px rgba(20,60,45,.1);border:0}
.tpl-denlong .wish{border:0;box-shadow:0 4px 12px rgba(20,60,45,.08)}
.tpl-denlong .copy{background:var(--paper)}
.tpl-denlong .choice label,.tpl-denlong .form input:not([type=radio]),.tpl-denlong .form select,.tpl-denlong .form textarea{background:#fff}
/* ---------- album kiểu tạp chí ---------- */
.tpl-denlong .dl-album{padding:30px 8px}
.tpl-denlong .dl-tagh{display:inline-block;margin:0 0 18px;padding:8px 34px;background:color-mix(in srgb,var(--paper) 45%,transparent);border:1px solid color-mix(in srgb,var(--paper) 80%,transparent);box-shadow:0 6px 16px rgba(20,60,45,.12);font-family:var(--font-script);font-weight:400;font-size:34px;line-height:1.2;color:var(--ink)}
.tpl-denlong .dl-mag{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}
.tpl-denlong .dl-mag .ph{grid-column:span 2;aspect-ratio:3/4;border-radius:0;overflow:hidden;background:var(--line)}
.tpl-denlong .dl-mag .ph img{width:100%;height:100%;object-fit:cover;transition:transform .8s}
.tpl-denlong .dl-mag .ph:hover img{transform:scale(1.06)}
.tpl-denlong .dl-mag .ph:nth-child(6n+4){grid-column:span 6;aspect-ratio:4/3}
.tpl-denlong .dl-mag .ph:nth-child(6n+5),.tpl-denlong .dl-mag .ph:nth-child(6n){grid-column:span 3;aspect-ratio:4/5}
.tpl-denlong .dl-mag .ph:last-child:nth-child(6n+1){grid-column:span 6;aspect-ratio:4/3}
.tpl-denlong .dl-mag .ph:last-child:nth-child(6n+2),.tpl-denlong .dl-mag .ph:nth-last-child(2):nth-child(6n+1){grid-column:span 3;aspect-ratio:4/5}
.tpl-denlong .dl-mag .ph:last-child:nth-child(6n+5){grid-column:span 6;aspect-ratio:4/3}
/* ---------- lời cảm ơn: xấp giấy ghi chú ---------- */
.tpl-denlong .dl-thanks{padding:40px 22px 30px}
.tpl-denlong .dl-notes{position:relative;max-width:330px;margin:0 auto}
.tpl-denlong .dl-note{background:#f7f3ea;background-image:radial-gradient(rgba(0,0,0,.035) 1px,transparent 1.2px);background-size:5px 5px;box-shadow:0 6px 16px rgba(0,0,0,.12)}
.tpl-denlong .dl-note.back1,.tpl-denlong .dl-note.back2{position:absolute;inset:0}
.tpl-denlong .dl-note.back1{transform:rotate(-7deg) translate(-10px,22px)}
.tpl-denlong .dl-note.back2{transform:rotate(6deg) translate(14px,34px)}
.tpl-denlong .dl-note.front{position:relative;padding:22px 18px 18px 34px;transform:rotate(-1.5deg);text-align:left;font-family:'Patrick Hand',var(--font-body);font-size:18px;line-height:28px;color:#3d4a44;
  background-image:repeating-linear-gradient(transparent 0 27px,rgba(80,110,100,.18) 27px 28px),radial-gradient(rgba(0,0,0,.035) 1px,transparent 1.2px);background-size:auto,5px 5px;background-position:0 20px,0 0}
.tpl-denlong .dl-note.front::before{content:"";position:absolute;left:10px;top:16px;bottom:16px;width:8px;background:radial-gradient(circle,var(--bg) 3px,transparent 3.5px) 0 0/8px 22px repeat-y}
.tpl-denlong .dl-note p{margin:0}
.tpl-denlong .dl-note p+p{text-indent:1.2em}
.tpl-denlong .dl-sign{margin:6px 0 0!important;text-indent:0!important;line-height:1.3;text-align:right;font-family:var(--font-script);font-size:30px;color:var(--dl-script)}
.tpl-denlong .credit{color:var(--muted)}

/* ---------- màn mở thiệp ---------- */
.tpl-denlong .dl-opener{background:radial-gradient(ellipse at 50% 30%,var(--dl-wash),transparent 60%),var(--bg);overflow:hidden;cursor:pointer}
.tpl-denlong .dl-olans{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-around;padding:0 6%}
.tpl-denlong .dl-olans .dl-lan{width:46px;transform-origin:50% 0;animation:dlSwing 3.8s ease-in-out infinite;transition:transform 1s}
.tpl-denlong .dl-olans .b{width:58px;animation-delay:-1s}
.tpl-denlong .dl-olans .c{width:38px;animation-delay:-2s}
.tpl-denlong .dl-olans .d{width:50px;animation-delay:-3s}
.tpl-denlong .dl-ocard{position:relative;width:min(320px,84vw);padding:70px 22px 30px;background:var(--paper);border-radius:999px 999px 10px 10px;text-align:center;box-shadow:0 18px 40px rgba(20,60,45,.18);transition:transform .9s cubic-bezier(.6,0,.3,1),opacity .9s}
.tpl-denlong .dl-oto{margin:0;font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.tpl-denlong .dl-oguest{margin:6px 0 12px;font-family:var(--font-script);font-size:36px;line-height:1.25;color:var(--accent)}
.tpl-denlong .dl-onames{display:flex;align-items:center;justify-content:center;gap:8px;margin:0 0 22px;font-family:var(--font-title);font-size:18px;color:var(--ink)}
.tpl-denlong .dl-obtn{padding:11px 30px;border:0;border-radius:999px;background:var(--accent);color:var(--accent-ink);font-weight:700;letter-spacing:.06em;animation:dlPulse 2s ease-in-out infinite}
@keyframes dlPulse{50%{box-shadow:0 0 0 10px color-mix(in srgb,var(--accent) 15%,transparent)}}
.tpl-denlong .dl-opener.opening .dl-ocard{transform:translateY(110vh) rotate(6deg);opacity:0}
.tpl-denlong .dl-opener.opening .dl-olans{transform:translateY(-100%);transition:transform .9s ease-in}

@media (prefers-reduced-motion:reduce){.tpl-denlong .dl-lan,.tpl-denlong .dl-lv,.tpl-denlong .dl-mini,.tpl-denlong .dl-bal,.tpl-denlong .dl-obtn{animation:none!important}}
`,
};
