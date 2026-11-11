// Mẫu "Sao Vàng" — dễ thương, ngọt ngào: nền kem trắng, ảnh cưới cài trong phong bì mềm, sao vàng phồng lấp lánh rải khắp,
// chữ tròn kiểu viết tay, dòng hashtag ở đầu trang, ảnh dán băng keo, khung ảnh hình ngôi sao.
const { esc } = require('../lib/util');

const base = {
  '--font-title': "'Mali',system-ui,sans-serif",
  '--font-script': "'Itim','Mali',cursive",
  '--font-body': "'Mali',system-ui,sans-serif",
};

const evList = (d) => d.events.filter((e) => e.name || e.place);
function partyEvent(d) {
  const evs = evList(d);
  return evs.find((e) => /khai tiệc|tiệc cưới/i.test(e.name)) || evs.find((e) => /tiệc/i.test(e.name)) || evs[evs.length - 1] || null;
}
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ord = (n) => (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');
const tag = (s) => '#' + String(s).replace(/\s+/g, '');
const clock = (t) => (t ? `${t.split(':')[0]}:${t.split(':')[1]}` : '');

// ngôi sao bo tròn (khung 100×100) — dùng cho sao phồng, sao viền và khung ảnh hình sao
const STAR_D = 'M50 5C54 5 56 9 58.5 15L65.5 32.5 84.5 34.5C92 35.5 95 41 89 46.5L74.5 60 79 79.5C80.5 87.5 75.5 91.5 68.5 87.5L50 77 31.5 87.5C24.5 91.5 19.5 87.5 21 79.5L25.5 60 11 46.5C5 41 8 35.5 15.5 34.5L34.5 32.5 41.5 15C44 9 46 5 50 5Z';
const STAR_CLIP = STAR_D.replace(/-?\d+(\.\d+)?/g, (n) => +(n / 100).toFixed(3));
const DEFS = `<svg class="sv-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>
  <radialGradient id="svGold" cx=".38" cy=".3" r=".75"><stop offset="0" stop-color="var(--sv-g1)"/><stop offset=".55" stop-color="var(--sv-g2)"/><stop offset="1" stop-color="var(--sv-g3)"/></radialGradient>
  <path id="svStarP" d="${STAR_D}"/>
  <clipPath id="svStarClip" clipPathUnits="objectBoundingBox"><path d="${STAR_CLIP}"/></clipPath>
</defs></svg>`;
const STAR = (cls) => `<svg class="sv-star ${cls}" viewBox="0 0 100 100" aria-hidden="true"><use href="#svStarP" fill="url(#svGold)" stroke="var(--sv-g3)" stroke-width="1.5"/><path d="M38 30 Q44 20 50 18" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/></svg>`;
const OSTAR = (cls) => `<svg class="sv-star o ${cls}" viewBox="0 0 100 100" aria-hidden="true"><use href="#svStarP" fill="none" stroke="var(--gold)" stroke-width="5"/></svg>`;
const MINI = (x, y, s, r = 0) => `<use href="#svStarP" transform="translate(${x} ${y}) rotate(${r}) scale(${s}) translate(-50 -50)"/>`;

// biểu tượng nét mảnh
const IC = {
  glasses: '<svg class="sv-ic big" viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><g transform="rotate(-14 24 34)"><path d="M18 8H30L28.5 26Q24 32 19.5 26Z"/><path d="M24 30V52M18 52H30"/><path d="M20 16H28" opacity=".6"/></g><g transform="rotate(14 40 34)"><path d="M34 8H46L44.5 26Q40 32 35.5 26Z"/><path d="M40 30V52M34 52H46"/><path d="M36 16H44" opacity=".6"/></g><path d="M32 5V1M27 6L24.5 3M37 6L39.5 3"/><path d="M26 41Q32 36 32 41Q32 46 38 41M32 41L28 50M32 41L36 50"/></g></svg>',
  chair: '<svg class="sv-ic" viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M14 44V24M34 44V24M11 24H37M14 24Q13 5 24 5Q35 5 34 24M19 23V11M24 23V7M29 23V11M14 35H34"/><path d="M20 5Q24 2 28 5" /></g></svg>',
  arch: '<svg class="sv-ic" viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 45V16Q24 2 40 16V45M8 16Q18 26 12 45M40 16Q30 26 36 45M5 45H43"/><circle cx="24" cy="8" r="2.4"/><circle cx="16" cy="10.5" r="2"/><circle cx="32" cy="10.5" r="2"/></g></svg>',
  cake: '<svg class="sv-ic" viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 44H40M11 44V33H37V44M15 33V25H33V33M19 25V18H29V25M24 18V13"/><path d="M24 12Q21 9 24 6Q27 9 24 12Z"/><path d="M11 38Q14.5 41 18 38Q21.5 41 25 38Q28.5 41 32 38Q35 41 37 38"/></g></svg>',
};
const ICONS = [IC.chair, IC.arch, IC.cake];

module.exports = {
  id: 'saovang',
  name: 'Sao Vàng',
  group: 'minhhoa',
  badge: 'Mới',
  desc: 'Nền kem ngọt ngào, ảnh cưới cài phong bì, sao vàng lấp lánh và chữ viết tay',
  fonts: 'https://fonts.googleapis.com/css2?family=Mali:wght@400;500;600;700&family=Itim&display=swap',
  palettes: [
    { id: 'trang-vang', name: 'Trắng vàng', swatch: ['#faf7f2', '#8b7a52'], vars: { ...base, '--page': '#efe9df', '--bg': '#faf7f2', '--paper': '#ffffff', '--ink': '#6a5c40', '--muted': '#9a8e76', '--accent': '#857550', '--accent-ink': '#fffdf6', '--gold': '#c9a74e', '--line': '#e9e1d2', '--sv-g1': '#fbedb8', '--sv-g2': '#d9b65a', '--sv-g3': '#9e7c2e', '--sv-env': '#f4f1ea', '--sv-env-in': '#5d5468', '--sv-print': '#7d7090', '--sv-tape': 'rgba(255,255,255,.62)' } },
    { id: 'hong-kem', name: 'Hồng kem', swatch: ['#fcf3f1', '#b0707a'], vars: { ...base, '--page': '#f3e2df', '--bg': '#fdf5f3', '--paper': '#ffffff', '--ink': '#7a4f57', '--muted': '#a5848a', '--accent': '#b0707a', '--accent-ink': '#fff', '--gold': '#d8ad5e', '--line': '#f1dfdc', '--sv-g1': '#fff0c4', '--sv-g2': '#e3bd68', '--sv-g3': '#a8823a', '--sv-env': '#fbf0ee', '--sv-env-in': '#b47b86', '--sv-print': '#c88b97', '--sv-tape': 'rgba(255,255,255,.65)' } },
  ],
  demo: {
    cover: '/demo/toduyen-2.webp',
    photos: [1, 3, 4, 5, 6, 7, 2].map((n) => `/demo/toduyen-${n}.webp`),
    story: 'Ta gặp nhau giữa muôn vì sao, nhịp tim lỡ một nhịp khi ánh mắt chạm nhau.\nTừ những buổi hẹn vụng về đến những chiều cùng nhau về nhà, mọi điều nhỏ bé đều trở thành kỷ niệm.\nVà hôm nay, chúng mình quyết định viết tiếp câu chuyện ấy — cùng nhau, mãi mãi.',
  },
  layout: ['story', 'invite', 'calendar', 'events', 'gallery', 'rsvp', 'gift', 'wishes', 'thanks'],

  title(text, sub) {
    return `<h2 class="sv-h">${OSTAR('l')}<span>${esc(text)}</span>${STAR('r')}</h2>${sub ? `<p class="sec-sub">${esc(sub)}</p>` : ''}`;
  },

  opener(ctx) {
    return `
<div class="opener sv-opener" id="opener" data-open-ms="1200">
  ${STAR('os1')}${OSTAR('os2')}${STAR('os3')}${OSTAR('os4')}
  <div class="sv-oenv">
    <div class="sv-oflap"></div>
    <div class="sv-obody">
      <p class="sv-oto">${ctx.guest ? 'Gửi' : 'Gửi tới'}</p>
      <p class="sv-oguest">${ctx.guest ? esc(ctx.guest.name) : 'bạn thân mến'}</p>
      <p class="sv-ofrom">from ${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
    </div>
    <button class="sv-oseal" id="openBtn" type="button" aria-label="Mở thiệp">${STAR('')}</button>
  </div>
  <p class="sv-ohint">Chạm để mở thư ✦</p>
</div>`;
  },

  cover(ctx) {
    const p = ctx.dparts;
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    const prints = [[40, 30, .09, 10], [86, 52, .07, -20], [130, 34, .08, 30], [190, 48, .09, 5], [240, 30, .07, -15], [262, 70, .08, 25], [60, 80, .07, 40], [110, 100, .08, -5], [170, 92, .07, 15], [220, 112, .09, -30], [36, 140, .08, 20], [96, 150, .07, 0], [150, 136, .09, -10], [200, 160, .07, 35], [258, 150, .08, -25], [130, 176, .07, 12]];
    return `
<header class="sv-cover">
  ${DEFS}
  <div class="sv-tags"><span>#WeddingForever</span><span>${esc(tag(ctx.g))} &amp; ${esc(tag(ctx.b))}</span></div>
  <div class="sv-env">
    <svg class="sv-env-back" viewBox="0 0 300 340" aria-hidden="true"><path d="M6 160 L150 66 L294 160Z" fill="var(--sv-env)" stroke="rgba(0,0,0,.06)"/><path d="M6 158H294V336H6Z" fill="var(--sv-env-in)"/></svg>
    ${photo ? `<div class="sv-env-photo"><img src="${esc(photo)}" alt="Ảnh cưới"></div>` : ''}
    <svg class="sv-env-front" viewBox="0 0 300 200" aria-hidden="true">
      <defs><pattern id="svLinen" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 2.5H5" stroke="rgba(0,0,0,.022)"/></pattern></defs>
      <path d="M6 14 Q14 10 22 16 L150 104 L278 16 Q286 10 294 14 V194 Q294 198 290 198 H10 Q6 198 6 194Z" fill="var(--sv-env)"/>
      <path d="M6 14 Q14 10 22 16 L150 104 L278 16 Q286 10 294 14 V194 Q294 198 290 198 H10 Q6 198 6 194Z" fill="url(#svLinen)" stroke="rgba(0,0,0,.08)"/>
      <path d="M8 196 L128 112 M292 196 L172 112" stroke="rgba(0,0,0,.05)" stroke-width="1.5"/>
      <g fill="var(--sv-print)" opacity=".75">${prints.map(([x, y, s, r]) => MINI(x, y, s, r)).join('')}</g>
    </svg>
    ${STAR('c1')}${STAR('c2')}${OSTAR('c3')}
  </div>
  ${STAR('c4')}${OSTAR('c5')}${STAR('c6')}
  <p class="sv-welcome">Welcome to our wedding</p>
  ${p ? `<p class="sv-date">${p.y}.${p.m}.${p.d}</p>` : ''}
  <h1 class="sv-names">${esc(ctx.g)} &amp; ${esc(ctx.b)}</h1>
  ${p ? `<p class="sv-wdc">${esc(ctx.weekday)}${ctx.timeText ? ` · ${esc(ctx.timeText)}` : ''}</p>` : ''}
</header>`;
  },

  sections: {
    // ảnh dán băng keo xen những dòng chữ ngọt ngào + câu chuyện
    story(ctx) {
      const { d } = ctx;
      const ph = d.photos;
      const paras = (d.story || '').split(/\n+/).filter(Boolean);
      const half = Math.ceil(paras.length / 2);
      const txt = (arr) => (arr.length ? `<div class="sv-poem reveal">${arr.map((x) => `<p>${esc(x)}</p>`).join('')}</div>` : '');
      return `
  <section class="sec sv-story">
    ${ph[0] ? `<figure class="sv-snap a reveal"><span class="sv-tape"></span><img src="${esc(ph[0])}" alt="">${STAR('f1')}${OSTAR('f2')}</figure>` : ''}
    <p class="sv-love reveal"><span>Love is love</span><span>Feeling love</span></p>
    ${txt(paras.slice(0, half))}
    ${ph[1] ? `<figure class="sv-snap b reveal"><span class="sv-tape"></span><img src="${esc(ph[1])}" alt="">${STAR('f3')}<span class="sv-forever">Forever</span></figure>` : ''}
    ${txt(paras.slice(half))}
  </section>`;
    },

    invite(ctx) {
      const { d, guest } = ctx;
      const fam = (x, label) => `<div class="sv-fam"><p class="k">${label}</p>${x.father ? `<p>${esc(x.father)}</p>` : ''}${x.mother ? `<p>${esc(x.mother)}</p>` : ''}${x.address ? `<p class="a">${esc(x.address)}</p>` : ''}</div>`;
      const hasFam = d.groom.father || d.groom.mother || d.bride.father || d.bride.mother;
      return `
  <section class="sec sv-invite reveal">
    <div class="sv-paper">
      ${STAR('p1')}${OSTAR('p2')}
      <p class="sv-lead">${esc(d.inviteText)}</p>
      <p class="sv-guest">${guest ? esc(guest.name) : 'Bạn thân mến'}</p>
      <p class="sv-to">tới dự lễ thành hôn của chúng mình</p>
      <div class="sv-couple">
        <div><p class="r">Chú rể</p><p class="n">${esc(d.groom.fullName || d.groom.name)}</p></div>
        <span class="sv-amp">&amp;</span>
        <div><p class="r">Cô dâu</p><p class="n">${esc(d.bride.fullName || d.bride.name)}</p></div>
      </div>
      ${hasFam ? `<div class="sv-fams">${fam(d.groom, 'Nhà trai')}${fam(d.bride, 'Nhà gái')}</div>` : ''}
      ${d.message ? `<p class="sv-msg">${esc(d.message)}</p>` : ''}
    </div>
  </section>`;
    },

    calendar(ctx, opts, h) {
      const { d, dparts: p } = ctx;
      if (!p) return '';
      const evs = evList(d).slice(0, 3);
      const ph = d.photos[2];
      const u = (k, l) => `<span><b data-cd="${k}">0</b><small>${l}</small></span>`;
      return `
  <section class="sec sv-date-sec reveal">
    ${h.secTitle(ctx, 'Wedding Date')}
    <p class="sv-mon">${MONTHS[+p.m - 1]}</p>
    <p class="sv-day"><b>${+p.d}</b><sup>${ord(+p.d)}</sup></p>
    <p class="sv-wd">${esc(ctx.weekday)}, ${esc(ctx.dmy)} · ${esc(ctx.lunarShort)} âm lịch</p>
    ${IC.glasses}
    ${evs.length ? `<div class="sv-sched n${evs.length}">${evs.map((e, i) => `<div>${ICONS[i % 3]}<p class="t">${esc(e.name)}</p><p class="c">${esc(clock(e.time))}</p></div>`).join('')}</div>` : ''}
    ${d.show.countdown ? `<div class="sv-cd" role="timer">${u('d', 'ngày')}${u('h', 'giờ')}${u('m', 'phút')}${u('s', 'giây')}</div>` : ''}
    ${d.show.calendar ? `<div class="sv-calwrap">${h.calGrid(ctx, `<p class="sv-calh">Tháng ${+p.m} · ${p.y}</p>`)}</div>` : ''}
    ${ph ? `<figure class="sv-snap c"><img src="${esc(ph)}" alt="">${STAR('f4')}${OSTAR('f5')}</figure>` : ''}
  </section>`;
    },

    events(ctx, opts, h) {
      const evs = evList(ctx.d);
      if (!evs.length) return '';
      const party = partyEvent(ctx.d);
      const ph = ctx.d.photos[3] || ctx.d.cover;
      const title = `Đám cưới ${ctx.g} & ${ctx.b}`;
      return `
  <section class="sec sv-addr">
    ${h.secTitle(ctx, 'Wedding Address')}
    ${ph ? `<div class="sv-starph reveal">${STAR('f6')}<div><img src="${esc(ph)}" alt=""></div>${STAR('f7')}</div>` : ''}
    ${party && party.address ? `<div class="sv-mapline reveal"><div class="sv-map"><iframe loading="lazy" title="Bản đồ ${esc(party.name)}" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(party.address)}&amp;output=embed"></iframe></div><p>${esc(party.place || '')}${party.place ? '<br>' : ''}<span>${esc(party.address)}</span></p></div>` : ''}
    <ol class="sv-evs">
      ${evs.map((e) => {
        const date = e.date || ctx.date;
        const dir = e.mapUrl || (e.address ? h.mapSearch(e.address) : '');
        return `<li class="reveal"><p class="tm">${esc(clock(e.time))}</p><div><h3>${esc(e.name)}</h3>${e.place ? `<p class="pl">${esc(e.place)}</p>` : ''}${e.address ? `<p class="ad">${esc(e.address)}</p>` : ''}${date && date !== ctx.date ? `<p class="ad">${esc(h.weekday(date))}, ${esc(h.dmy(date))}</p>` : ''}<p class="ac">${dir ? `<a target="_blank" rel="noopener" href="${esc(dir)}">Chỉ đường</a>` : ''}${date ? `<a target="_blank" rel="noopener" href="${esc(h.calendarLink(`${e.name} — ${title}`, date, e.time, e.address || e.place))}">Lưu vào lịch</a>` : ''}</p></div></li>`;
      }).join('')}
    </ol>
  </section>`;
    },

    gallery(ctx, opts, h) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      return `
  <section class="sec sv-album">
    ${h.secTitle(ctx, 'Our Album')}
    <div class="sv-grid">
      ${ph.map((u, i) => `<button class="ph reveal" data-i="${i}" aria-label="Xem ảnh ${i + 1}"><span class="sv-tape"></span><img decoding="async" src="${esc(u)}" alt=""></button>`).join('')}
    </div>
    ${STAR('g1')}${OSTAR('g2')}
  </section>`;
    },

    thanks(ctx) {
      return `
  <section class="sec sv-thanks reveal">
    ${STAR('t1')}${OSTAR('t2')}
    <p class="sv-ty">Thank you</p>
    <p class="sv-tyl">Rất mong được gặp bạn trong ngày vui của chúng mình</p>
    <p class="sv-tyn">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
  </section>`;
    },
  },

  css: `
.tpl-saovang{background:var(--page)}
.tpl-saovang .card{background:var(--bg);color:var(--ink)}
.tpl-saovang .sv-defs{position:absolute;width:0;height:0;overflow:hidden}
.tpl-saovang .sv-star{position:absolute;width:34px;height:34px;overflow:visible;filter:drop-shadow(0 3px 3px rgba(120,90,30,.25));animation:svTw 3.2s ease-in-out infinite;pointer-events:none;z-index:3}
.tpl-saovang .sv-star.o{filter:none;width:28px;height:28px}
@keyframes svTw{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(.82) rotate(14deg)}}
/* ---------- bìa ---------- */
.tpl-saovang .sv-cover{position:relative;min-height:693px;padding:18px 16px 30px;text-align:center;overflow:hidden}
.tpl-saovang .sv-tags{display:flex;justify-content:space-between;gap:10px;font-size:12px;font-weight:600;letter-spacing:.02em;color:var(--ink)}
.tpl-saovang .sv-env{position:relative;width:320px;height:362px;margin:30px auto 0}
.tpl-saovang .sv-env-back,.tpl-saovang .sv-env-front{position:absolute;left:0;width:100%;display:block}
.tpl-saovang .sv-env-back{top:0;height:100%}
.tpl-saovang .sv-env-front{bottom:0;height:auto;filter:drop-shadow(0 -2px 4px rgba(0,0,0,.08))}
.tpl-saovang .sv-cover>.sv-env{filter:drop-shadow(0 10px 18px rgba(80,60,30,.14))}
.tpl-saovang .sv-env-photo{position:absolute;left:30px;right:30px;top:4px;height:268px;padding:6px;background:#fff;box-shadow:0 4px 14px rgba(0,0,0,.15);transform:rotate(-1.5deg);animation:svOut 1.6s cubic-bezier(.3,.7,.3,1) .3s both}
.tpl-saovang .sv-env-photo img{width:100%;height:100%;object-fit:cover}
@keyframes svOut{from{transform:translateY(90px) rotate(0)}to{transform:translateY(0) rotate(-1.5deg)}}
.tpl-saovang .sv-star.c1{width:44px;height:44px;top:-8px;left:-26px;animation-delay:-.5s}
.tpl-saovang .sv-star.c2{width:66px;height:66px;bottom:-20px;right:-18px;animation-delay:-1.4s}
.tpl-saovang .sv-star.c3{top:30px;right:-28px;animation-delay:-2s}
.tpl-saovang .sv-star.c4{width:30px;height:30px;top:440px;left:14px;animation-delay:-.8s}
.tpl-saovang .sv-star.c5{top:600px;right:26px;animation-delay:-2.4s}
.tpl-saovang .sv-star.c6{width:22px;height:22px;top:520px;right:54px;animation-delay:-1.1s}
.tpl-saovang .sv-welcome{margin:44px 0 0;font-size:24px;font-weight:600;letter-spacing:.02em;color:var(--ink)}
.tpl-saovang .sv-date{margin:14px 0 0;font-size:19px;font-weight:600;letter-spacing:.14em;color:var(--accent)}
.tpl-saovang .sv-names{margin:12px 0 0;font-size:22px;font-weight:600;color:var(--ink)}
.tpl-saovang .sv-wdc{display:inline-block;margin:14px 0 0;padding:4px 16px;border:1.5px dashed color-mix(in srgb,var(--accent) 50%,transparent);border-radius:999px;font-size:13px;color:var(--muted)}
/* ---------- ảnh dán & thơ ---------- */
.tpl-saovang .sv-story{padding:20px 22px 40px}
.tpl-saovang .sv-snap{position:relative;margin:0;padding:0;background:#fff;box-shadow:0 8px 20px rgba(80,60,30,.14)}
.tpl-saovang .sv-snap img{width:100%;aspect-ratio:3/4;object-fit:cover}
.tpl-saovang .sv-snap.a{width:72%;margin-left:6%;transform:rotate(-2.5deg)}
.tpl-saovang .sv-snap.a.in{transform:rotate(-2.5deg)}
.tpl-saovang .sv-snap.b{width:84%;margin:30px auto 0;transform:rotate(1.5deg)}
.tpl-saovang .sv-snap.b.in{transform:rotate(1.5deg)}
.tpl-saovang .sv-snap.c{width:80%;margin:40px auto 10px;transform:rotate(-1.5deg)}
.tpl-saovang .sv-tape{position:absolute;z-index:2;top:-12px;left:50%;width:96px;height:26px;margin-left:-48px;background:var(--sv-tape);box-shadow:0 1px 3px rgba(0,0,0,.08);transform:rotate(-4deg);-webkit-backdrop-filter:blur(1px);backdrop-filter:blur(1px)}
.tpl-saovang .sv-snap.b .sv-tape{left:auto;right:6%;transform:rotate(5deg)}
.tpl-saovang .sv-star.f1{top:-20px;left:-22px}
.tpl-saovang .sv-star.f2{bottom:30px;right:-40px;animation-delay:-1s}
.tpl-saovang .sv-star.f3{width:42px;height:42px;bottom:-14px;left:-14px;animation-delay:-2s}
.tpl-saovang .sv-star.f4{width:46px;height:46px;top:40%;left:-24px}
.tpl-saovang .sv-star.f5{bottom:-14px;right:-18px;animation-delay:-1.6s}
.tpl-saovang .sv-love{display:flex;flex-direction:column;align-items:flex-end;margin:-150px 0 90px;position:relative;z-index:4;font-family:var(--font-script);font-size:27px;line-height:1.5;color:var(--ink);transform:rotate(-6deg)}
.tpl-saovang .sv-love span{padding:0 4px;background:color-mix(in srgb,var(--bg) 80%,transparent);border-radius:6px}
.tpl-saovang .sv-forever{position:absolute;right:-6px;bottom:-14px;font-family:var(--font-script);font-size:40px;line-height:1;color:var(--ink);text-shadow:0 0 8px var(--bg),0 0 2px var(--bg)}
.tpl-saovang .sv-poem{margin:30px auto 0;max-width:340px;font-size:14.5px;line-height:2;color:var(--ink)}
.tpl-saovang .sv-poem p{margin:0 0 6px}
/* ---------- lời mời ---------- */
.tpl-saovang .sv-invite{padding:30px 20px}
.tpl-saovang .sv-paper{position:relative;padding:34px 18px 28px;background:var(--paper);border-radius:6px;box-shadow:0 10px 26px rgba(80,60,30,.12);background-image:radial-gradient(circle at 1px 1px,color-mix(in srgb,var(--gold) 22%,transparent) 1px,transparent 1.5px);background-size:16px 16px}
.tpl-saovang .sv-star.p1{top:-16px;right:18px}
.tpl-saovang .sv-star.p2{bottom:-12px;left:14px;animation-delay:-1.5s}
.tpl-saovang .sv-lead{margin:0;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.tpl-saovang .sv-guest{margin:6px 0 2px;font-family:var(--font-script);font-size:30px;line-height:1.3;color:var(--accent)}
.tpl-saovang .sv-to{margin:0 0 22px;font-size:14px;color:var(--muted)}
.tpl-saovang .sv-couple{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px}
.tpl-saovang .sv-couple p{margin:0}
.tpl-saovang .sv-couple .r{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.tpl-saovang .sv-couple .n{font-size:18px;font-weight:600;line-height:1.35}
.tpl-saovang .sv-amp{font-family:var(--font-script);font-size:34px;color:var(--gold)}
.tpl-saovang .sv-fams{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:22px;padding-top:18px;border-top:1.5px dashed var(--line);font-size:13px;line-height:1.6}
.tpl-saovang .sv-fam p{margin:0}
.tpl-saovang .sv-fam .k{font-weight:700;color:var(--accent);margin-bottom:2px}
.tpl-saovang .sv-fam .a{color:var(--muted);font-size:12px}
.tpl-saovang .sv-msg{margin:20px 0 0;font-size:14px;color:var(--muted)}
/* ---------- tiêu đề có sao ---------- */
.tpl-saovang .sv-h{display:flex;align-items:center;justify-content:center;gap:14px;margin:0 0 22px;font-family:var(--font-title);font-weight:600;font-size:25px;line-height:1.3;color:var(--ink)}
.tpl-saovang .sv-h .sv-star{position:relative;width:20px;height:20px;flex:none;z-index:0}
.tpl-saovang .sv-h .sv-star.o{width:18px;height:18px}
.tpl-saovang .sec-sub{margin:-14px 0 24px;font-size:13px}
/* ---------- ngày cưới ---------- */
.tpl-saovang .sv-date-sec{padding:50px 20px 30px;overflow:hidden}
.tpl-saovang .sv-mon{margin:6px 0 0;font-size:26px;font-weight:600;color:var(--accent)}
.tpl-saovang .sv-day{margin:-6px 0 0;color:var(--accent);line-height:1}
.tpl-saovang .sv-day b{font-size:84px;font-weight:700}
.tpl-saovang .sv-day sup{font-size:26px;font-weight:600;vertical-align:42px;margin-left:2px}
.tpl-saovang .sv-wd{margin:8px 0 0;font-size:13px;color:var(--muted)}
.tpl-saovang .sv-ic{width:44px;height:44px;color:var(--ink)}
.tpl-saovang .sv-ic.big{width:62px;height:62px;margin:16px auto 6px;display:block;animation:svClink 2.6s ease-in-out infinite}
@keyframes svClink{0%,70%,100%{transform:rotate(0)}80%{transform:rotate(-6deg)}90%{transform:rotate(5deg)}}
.tpl-saovang .sv-sched{display:grid;grid-template-columns:repeat(3,1fr);margin:18px 0 0}
.tpl-saovang .sv-sched.n2{grid-template-columns:repeat(2,1fr)}
.tpl-saovang .sv-sched.n1{grid-template-columns:1fr}
.tpl-saovang .sv-sched>div{padding:4px 6px}
.tpl-saovang .sv-sched>div+div{border-left:1.5px solid color-mix(in srgb,var(--ink) 45%,transparent)}
.tpl-saovang .sv-sched .t{margin:6px 0 0;font-size:15px;font-weight:600;line-height:1.3}
.tpl-saovang .sv-sched .c{margin:4px 0 0;font-size:13px;font-weight:600;letter-spacing:.06em}
.tpl-saovang .sv-cd{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:32px auto 0;max-width:330px}
.tpl-saovang .sv-cd span{display:flex;flex-direction:column;align-items:center;justify-content:center;aspect-ratio:1;border-radius:14px;background:var(--accent);color:var(--accent-ink);font-family:var(--font-script)}
.tpl-saovang .sv-cd b{font-weight:400;font-size:22px;line-height:1.1;font-variant-numeric:tabular-nums}
.tpl-saovang .sv-cd small{font-size:13px;opacity:.85}
.tpl-saovang .sv-calwrap{margin:28px auto 0;max-width:330px;padding:16px 12px 8px;border:1.5px dashed var(--line);border-radius:18px}
.tpl-saovang .sv-calh{margin:0 0 8px;font-size:16px;font-weight:600;color:var(--accent)}
.tpl-saovang .cal{--cal-hi:var(--gold);width:100%}
.tpl-saovang .cal-grid{font-size:14px}
.tpl-saovang .cal-grid span{height:32px}
/* ---------- địa chỉ ---------- */
.tpl-saovang .sv-addr{padding:40px 20px}
.tpl-saovang .sv-starph{position:relative;width:min(300px,86%);margin:10px auto 0;filter:drop-shadow(0 8px 14px rgba(80,60,30,.18))}
.tpl-saovang .sv-starph>div{aspect-ratio:1;clip-path:url(#svStarClip);transform:rotate(-8deg);background:#fff;padding:0}
.tpl-saovang .sv-starph img{width:100%;height:100%;object-fit:cover}
.tpl-saovang .sv-star.f6{top:22%;left:-6px;width:30px;height:30px}
.tpl-saovang .sv-star.f7{bottom:6%;right:4px;width:40px;height:40px;animation-delay:-1.3s}
.tpl-saovang .sv-mapline{display:grid;grid-template-columns:1.1fr 1fr;gap:14px;align-items:center;margin:26px 0 8px;text-align:left}
.tpl-saovang .sv-map{aspect-ratio:4/3;border:3px solid var(--accent);border-radius:20px;overflow:hidden;background:var(--line);transform:rotate(-2deg)}
.tpl-saovang .sv-map iframe{width:100%;height:100%;border:0}
.tpl-saovang .sv-mapline p{margin:0;font-size:14px;line-height:1.7;font-weight:600}
.tpl-saovang .sv-mapline p span{font-weight:400;color:var(--muted)}
.tpl-saovang .sv-evs{list-style:none;margin:24px auto 0;padding:0;max-width:360px;text-align:left}
.tpl-saovang .sv-evs li{display:grid;grid-template-columns:64px 1fr;gap:12px;padding:16px 0;border-top:1.5px dashed var(--line)}
.tpl-saovang .sv-evs .tm{margin:0;font-size:19px;font-weight:700;color:var(--accent)}
.tpl-saovang .sv-evs h3{margin:0;font-size:17px;font-weight:600}
.tpl-saovang .sv-evs p{margin:2px 0 0}
.tpl-saovang .sv-evs .pl{font-size:14px;font-weight:500}
.tpl-saovang .sv-evs .ad{font-size:13px;color:var(--muted)}
.tpl-saovang .sv-evs .ac{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.tpl-saovang .sv-evs .ac a{padding:4px 12px;border-radius:999px;border:1.5px solid var(--accent);color:var(--accent);font-size:12.5px;font-weight:600;text-decoration:none}
.tpl-saovang .sv-evs .ac a:first-child{background:var(--accent);color:var(--accent-ink)}
/* ---------- album ---------- */
.tpl-saovang .sv-album{padding:40px 16px}
.tpl-saovang .sv-grid{display:grid;grid-template-columns:1fr 1fr;gap:26px 12px;padding-top:10px}
.tpl-saovang .sv-grid .ph{position:relative;aspect-ratio:3/4;padding:5px;background:#fff;border-radius:0;box-shadow:0 6px 16px rgba(80,60,30,.13);overflow:visible}
.tpl-saovang .sv-grid .ph img{width:100%;height:100%;object-fit:cover}
.tpl-saovang .sv-grid .ph:nth-child(n){grid-column:auto;aspect-ratio:3/4}
.tpl-saovang .sv-grid .ph:nth-child(3n+1){grid-column:span 2;aspect-ratio:4/3.6;width:92%;justify-self:center}
.tpl-saovang .sv-grid .ph:nth-child(3n+1).in{transform:rotate(-1.2deg)}
.tpl-saovang .sv-grid .ph:nth-child(3n+2).in{transform:rotate(1.5deg)}
.tpl-saovang .sv-grid .ph:nth-child(3n).in{transform:rotate(-1deg)}
.tpl-saovang .sv-grid .ph .sv-tape{width:70px;margin-left:-35px;height:22px;top:-11px}
.tpl-saovang .sv-grid .ph:nth-child(2n) .sv-tape{transform:rotate(5deg)}
.tpl-saovang .sv-star.g1{top:30px;right:16px}
.tpl-saovang .sv-star.g2{bottom:20px;left:12px;animation-delay:-1.4s}
/* ---------- biểu mẫu, quà, lưu bút ---------- */
.tpl-saovang .form{border:0;border-radius:6px;box-shadow:0 10px 26px rgba(80,60,30,.13)}
.tpl-saovang .form input:not([type=radio]),.tpl-saovang .form select,.tpl-saovang .form textarea,.tpl-saovang .choice label{background:#fff}
.tpl-saovang .btn{border-radius:8px}
.tpl-saovang .gift{border:0;border-radius:6px;box-shadow:0 8px 22px rgba(80,60,30,.1)}
.tpl-saovang .gift-who{font-family:var(--font-title);font-weight:600;font-size:17px}
.tpl-saovang .wish{border:0;border-radius:6px;box-shadow:0 3px 10px rgba(80,60,30,.08)}
.tpl-saovang .wish b{font-weight:600}
/* ---------- cảm ơn ---------- */
.tpl-saovang .sv-thanks{padding:50px 20px 40px}
.tpl-saovang .sv-ty{margin:0;font-size:48px;font-weight:700;line-height:1.2;color:var(--accent)}
.tpl-saovang .sv-tyl{margin:10px auto 0!important;max-width:300px;font-size:15px;color:var(--ink)!important}
.tpl-saovang .sv-tyn{margin:16px 0 0!important;font-family:var(--font-script);font-size:22px;color:var(--accent)!important}
.tpl-saovang .sv-star.t1{top:40px;left:42px}
.tpl-saovang .sv-star.t2{top:60px;right:48px;animation-delay:-1.8s}

/* ---------- màn mở thiệp: phong bì đóng, dấu sao ---------- */
.tpl-saovang .sv-opener{background:radial-gradient(ellipse at 50% 40%,var(--paper),var(--bg) 70%);cursor:pointer;perspective:900px}
.tpl-saovang .sv-opener>.sv-star{width:40px;height:40px}
.tpl-saovang .sv-opener .os1{top:14%;left:14%}
.tpl-saovang .sv-opener .os2{top:20%;right:16%;animation-delay:-1s}
.tpl-saovang .sv-opener .os3{bottom:18%;right:14%;width:54px;height:54px;animation-delay:-2s}
.tpl-saovang .sv-opener .os4{bottom:24%;left:16%;animation-delay:-.5s}
.tpl-saovang .sv-oenv{position:relative;width:min(320px,84vw);aspect-ratio:10/7;background:var(--sv-env);border-radius:6px;box-shadow:0 18px 40px rgba(80,60,30,.18);transform-style:preserve-3d;transition:transform .8s ease .45s,opacity .6s ease .6s}
.tpl-saovang .sv-oflap{position:absolute;inset:0 0 auto 0;height:50%;background:color-mix(in srgb,var(--sv-env) 88%,var(--ink));clip-path:polygon(0 0,100% 0,50% 100%);transform-origin:top;transition:transform .7s ease;z-index:2;filter:drop-shadow(0 2px 2px rgba(0,0,0,.1))}
.tpl-saovang .sv-obody{position:absolute;inset:auto 0 0 0;height:44%;padding:12px 18px;display:flex;flex-direction:column;justify-content:flex-end;text-align:left}
.tpl-saovang .sv-oto{margin:0;font-size:13px;color:var(--muted)}
.tpl-saovang .sv-oguest{margin:0;font-family:var(--font-script);font-size:21px;line-height:1.25;color:var(--ink)}
.tpl-saovang .sv-ofrom{margin:4px 0 0;font-size:12px;color:var(--muted);text-align:right}
.tpl-saovang .sv-oseal{padding:0;border:0;background:none;position:absolute;left:50%;top:50%;z-index:3;width:54px;height:54px;margin:-27px 0 0 -27px;transition:opacity .3s}
.tpl-saovang .sv-oseal .sv-star{position:static;width:54px;height:54px;animation:svPulse 1.8s ease-in-out infinite}
@keyframes svPulse{50%{transform:scale(1.12) rotate(10deg)}}
.tpl-saovang .sv-ohint{position:absolute;bottom:9%;left:0;right:0;margin:0;text-align:center;font-size:14px;color:var(--muted)}
.tpl-saovang .sv-opener.opening .sv-oseal{opacity:0}
.tpl-saovang .sv-opener.opening .sv-oflap{transform:rotateX(180deg)}
.tpl-saovang .sv-opener.opening .sv-oenv{transform:translateY(40px) scale(1.08);opacity:0}

@media (prefers-reduced-motion:reduce){.tpl-saovang .sv-star,.tpl-saovang .sv-env-photo,.tpl-saovang .sv-ic.big,.tpl-saovang .sv-oseal .sv-star{animation:none!important}}
`,
};
