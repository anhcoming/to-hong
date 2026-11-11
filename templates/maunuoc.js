// Mẫu "Màu Nước" — hoa màu nước hồng phấn tự vẽ bằng SVG (cánh hoa trong suốt chồng lớp, viền loang bằng
// feTurbulence + feDisplacementMap), "Save the date" chữ ký, ảnh khung giữa, thông tin chữ serif sáng sủa.
const { esc } = require('../lib/util');
const { solarToLunar, canChiYear } = require('../lib/lunar');

const f1 = (n) => +n.toFixed(1);
const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// ---------- hoạ cụ màu nước ----------
// bộ lọc + dải màu dùng chung cho mọi bức hoa trên trang (một lần ở đầu trang)
const DEFS = `<svg class="mn-defs" aria-hidden="true" focusable="false"><defs>
  <filter id="mnWc" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="4" result="t"/>
    <feDisplacementMap in="SourceGraphic" in2="t" scale="9" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="0.45" result="b"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="9" result="g"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.55 1.12" result="ga"/>
    <feComposite in="b" in2="ga" operator="in"/>
  </filter>
  <filter id="mnWash" x="-50%" y="-50%" width="200%" height="200%"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="2" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="40" result="d"/><feGaussianBlur in="d" stdDeviation="9"/></filter>
  <radialGradient id="mnPa" cx=".5" cy="1" r="1.05"><stop offset="0" style="stop-color:var(--mn-p2)" stop-opacity="1"/><stop offset=".5" style="stop-color:var(--mn-p1)" stop-opacity=".7"/><stop offset=".86" style="stop-color:var(--mn-p1)" stop-opacity=".8"/><stop offset="1" style="stop-color:var(--mn-p2)" stop-opacity=".9"/></radialGradient>
  <radialGradient id="mnPb" cx=".5" cy="1" r="1"><stop offset="0" style="stop-color:var(--mn-p2)" stop-opacity="1"/><stop offset=".7" style="stop-color:var(--mn-p2)" stop-opacity=".55"/><stop offset="1" style="stop-color:var(--mn-p1)" stop-opacity=".5"/></radialGradient>
  <radialGradient id="mnPc" cx=".5" cy="1" r="1"><stop offset="0" style="stop-color:var(--mn-p2)" stop-opacity=".75"/><stop offset=".6" style="stop-color:var(--mn-p1)" stop-opacity=".55"/><stop offset="1" style="stop-color:var(--mn-p1)" stop-opacity=".85"/></radialGradient>
  <linearGradient id="mnLf" x1="0" y1="1" x2="0" y2="0"><stop offset="0" style="stop-color:var(--mn-leaf2)" stop-opacity=".9"/><stop offset=".6" style="stop-color:var(--mn-leaf)" stop-opacity=".55"/><stop offset="1" style="stop-color:var(--mn-leaf)" stop-opacity=".75"/></linearGradient>
</defs></svg>`;

const petal = (L, W) => `M0 0C${f1(-W)} ${f1(-L * 0.3)} ${f1(-W * 0.85)} ${f1(-L * 0.92)} ${f1(-W * 0.25)} ${f1(-L)}Q0 ${f1(-L * 0.9)} ${f1(W * 0.25)} ${f1(-L)}C${f1(W * 0.85)} ${f1(-L * 0.92)} ${f1(W)} ${f1(-L * 0.3)} 0 0Z`;
const leafD = (L, W) => `M0 0C${f1(W)} ${f1(-L * 0.25)} ${f1(W * 0.7)} ${f1(-L * 0.75)} 0 ${f1(-L)}C${f1(-W * 0.7)} ${f1(-L * 0.75)} ${f1(-W)} ${f1(-L * 0.25)} 0 0Z`;

// bông hoa mẫu đơn/hồng: 3 vòng cánh, lõi đậm, nhuỵ chấm
function bloom(cx, cy, r, rot, seed, pale) {
  const R = rng(seed);
  let s = `<g transform="translate(${cx} ${cy}) rotate(${rot})">`;
  const ring = (n, L, W, off, grad, op) => {
    for (let i = 0; i < n; i++) {
      const a = (i * 360) / n + off + (R() * 14 - 7);
      s += `<path d="${petal(L * (0.88 + R() * 0.2), W * (0.9 + R() * 0.2))}" transform="rotate(${f1(a)})" fill="url(#${grad})" stroke="var(--mn-p2)" stroke-opacity=".35" stroke-width="1.2" opacity="${op}"/>`;
    }
  };
  ring(7, r, r * 0.66, 0, pale ? 'mnPc' : 'mnPa', 0.85);
  ring(6, r * 0.72, r * 0.52, 26, pale ? 'mnPa' : 'mnPa', 0.8);
  ring(5, r * 0.45, r * 0.38, 12, 'mnPb', 0.8);
  s += `<circle r="${f1(r * 0.16)}" style="fill:var(--mn-p2)" opacity=".85"/>`;
  for (let i = 0; i < 9; i++) {
    const a = R() * Math.PI * 2, d = r * (0.12 + R() * 0.12);
    s += `<circle cx="${f1(Math.cos(a) * d)}" cy="${f1(Math.sin(a) * d)}" r="${f1(1.2 + R() * 1.6)}" style="fill:var(--mn-core)" opacity=".9"/>`;
  }
  return s + '</g>';
}
const bud = (x, y, s, rot) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0 40C-2 20 2 8 0 0" stroke="var(--mn-leaf2)" stroke-width="2" fill="none" opacity=".6"/><path d="${petal(30, 13)}" fill="url(#mnPb)" opacity=".85"/><path d="${petal(26, 10)}" transform="rotate(-18)" fill="url(#mnPa)" opacity=".8"/><path d="${leafD(16, 7)}" transform="translate(0 4) rotate(150)" fill="url(#mnLf)"/><path d="${leafD(16, 7)}" transform="translate(0 4) rotate(-150)" fill="url(#mnLf)"/></g>`;
const leaf = (x, y, L, W, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="${leafD(L, W)}" fill="url(#mnLf)"/><path d="M0 -2Q${f1(W * 0.15)} ${f1(-L / 2)} 0 ${f1(-L * 0.95)}" stroke="var(--mn-leaf2)" stroke-width="1" fill="none" opacity=".45"/></g>`;
const wash = (x, y, rx, ry, op = 0.5) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" style="fill:var(--mn-wash)" opacity="${op}" filter="url(#mnWash)"/>`;
const dots = (seed, n, w, h) => { const R = rng(seed); let s = ''; for (let i = 0; i < n; i++) s += `<circle cx="${f1(R() * w)}" cy="${f1(R() * h)}" r="${f1(0.8 + R() * 2.6)}" style="fill:var(--mn-p2)" opacity="${f1(0.15 + R() * 0.3)}"/>`; return s; };

// các bức hoa (khung 0 0 320 320), cành hướng vào góc trên-phải; CSS lật cho các góc khác
const CORNER = `<svg viewBox="0 0 320 320" aria-hidden="true">
  ${wash(250, 70, 120, 90, 0.7)}
  <g filter="url(#mnWc)">
    ${leaf(200, 120, 110, 30, -120)}${leaf(240, 140, 120, 28, -165)}${leaf(170, 80, 90, 24, -80)}${leaf(290, 150, 80, 22, 170)}${leaf(140, 50, 70, 20, -60)}
    ${bloom(250, 70, 74, 10, 3)}${bloom(150, 42, 46, 40, 7, true)}${bloom(300, 175, 40, -20, 11, true)}
    ${bud(110, 100, 1.1, -60)}${bud(220, 200, 0.9, 200)}
  </g>
  ${dots(5, 18, 320, 260)}
</svg>`;
const SPRAY = `<svg viewBox="0 0 320 200" aria-hidden="true">
  ${wash(160, 110, 140, 60, 0.6)}
  <g filter="url(#mnWc)">
    ${leaf(120, 120, 90, 24, -70)}${leaf(200, 120, 90, 24, 70)}${leaf(90, 135, 80, 20, -100)}${leaf(230, 135, 80, 20, 100)}${leaf(160, 130, 70, 20, 0)}
    ${bloom(160, 105, 56, 0, 21)}${bloom(95, 120, 34, 30, 13, true)}${bloom(228, 120, 36, -20, 17, true)}
    ${bud(50, 140, 0.8, -95)}${bud(272, 140, 0.8, 95)}
  </g>
  ${dots(8, 12, 320, 200)}
</svg>`;
const MINI = `<svg viewBox="0 0 120 70" aria-hidden="true"><g filter="url(#mnWc)">${leaf(42, 46, 40, 11, -80)}${leaf(78, 46, 40, 11, 80)}${bloom(60, 40, 24, 0, 31)}</g></svg>`;
const HEART = `<svg viewBox="0 0 40 38" aria-hidden="true"><g filter="url(#mnWc)"><path d="M20 35C8 26 2 19 2 11 2 5.5 6.5 2 11 2c3.6 0 6.6 2 9 5 2.4-3 5.4-5 9-5 4.5 0 9 3.5 9 9 0 8-6 15-18 24z" fill="url(#mnPb)" opacity=".9"/></g></svg>`;
// tulip nét mảnh (bút kim) làm nền
const TULIP = `<svg viewBox="0 0 80 240" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><path d="M40 238C38 180 44 120 40 64"/><path d="M40 64c-14-2-22-16-20-34 6 6 12 8 16 6 0-10 4-20 8-26 4 6 6 14 6 24 4-2 10-6 14-10 2 20-8 38-24 40z"/><path d="M40 160c-16-10-26-30-26-52 14 12 22 28 26 52zM41 196c12-14 26-22 36-24-6 16-18 24-36 24z"/></svg>`;

const evList = (d) => d.events.filter((e) => e.name || e.place);
function partyEvent(d) {
  const evs = evList(d);
  return evs.find((e) => /khai tiệc|tiệc cưới/i.test(e.name)) || evs.find((e) => /tiệc/i.test(e.name)) || evs[evs.length - 1] || null;
}
const pick = (ph, i) => (ph.length ? ph[i % ph.length] : '');
const lunarOf = (iso, ctxLunar) => `(Tức ${esc(ctxLunar.replace(/^Nhằm /i, ''))})`;
// giờ · thứ | ngày lớn | tháng · năm
function dateRow(h, iso, time) {
  const p = h.parts(iso);
  if (!p) return '';
  return `<div class="mn-dr"><div class="mn-dr-l"><b>${esc(h.clock(time) || '')}</b><span>${esc(h.weekday(iso))}</span></div><b class="mn-dr-d">${p.d}</b><div class="mn-dr-r"><span>Tháng ${p.m}</span><span>Năm ${p.y}</span></div></div>`;
}

const base = { '--font-title': "'Cormorant Garamond',Georgia,serif", '--font-script': "'Great Vibes',cursive", '--font-body': "'Quicksand',system-ui,sans-serif" };

module.exports = {
  id: 'maunuoc',
  name: 'Màu Nước',
  group: 'hoa',
  badge: 'Mới',
  desc: 'Hoa màu nước hồng phấn loang nhẹ, Save the date chữ ký và ảnh khung giữa',
  fonts: 'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Quicksand:wght@400;500;600&display=swap',
  palettes: [
    {
      id: 'hong-phan', name: 'Hồng phấn', swatch: ['#fbe3e8', '#8a2f3f'],
      vars: { ...base, '--page': '#f8eef0', '--bg': '#fffdfd', '--paper': '#ffffff', '--ink': '#3b3436', '--muted': '#857479', '--accent': '#7f2635', '--accent-ink': '#fff', '--gold': '#c99a86', '--line': '#efdde1', '--mn-p1': '#f7bccb', '--mn-p2': '#e2829b', '--mn-leaf': '#a9bfa4', '--mn-leaf2': '#6f8d72', '--mn-core': '#d9a441', '--mn-wash': '#fbd9e1', '--mn-pen': '#d8b4b4' },
    },
    {
      id: 'tim-oai', name: 'Tím oải hương', swatch: ['#ece4f6', '#55407e'],
      vars: { ...base, '--page': '#f1edf7', '--bg': '#fefdff', '--paper': '#ffffff', '--ink': '#37334a', '--muted': '#7a7390', '--accent': '#55407e', '--accent-ink': '#fff', '--gold': '#b7a0cf', '--line': '#e6def2', '--mn-p1': '#d4c4ee', '--mn-p2': '#9479c8', '--mn-leaf': '#a8bba8', '--mn-leaf2': '#6b8670', '--mn-core': '#e0b85a', '--mn-wash': '#e7dcf6', '--mn-pen': '#bfb0d8' },
    },
  ],
  demo: {
    cover: '/demo/toduyen-3.webp',
    photos: [1, 2, 4, 5, 6, 7, 3].map((n) => `/demo/toduyen-${n}.webp`),
  },
  layout: ['quote', 'couple', 'invite', 'events', 'calendar', 'gallery', 'story', 'gift', 'rsvp', 'wishes', 'thanks'],

  title(text, sub) {
    return `<h2 class="mn-h">${esc(text)}</h2>${sub ? `<p class="mn-hsub">${esc(sub)}</p>` : ''}`;
  },

  opener(ctx) {
    return `
<div class="opener mn-opener" id="opener" data-open-ms="1000">
  <div class="mn-o-fl tr">${CORNER}</div><div class="mn-o-fl bl">${CORNER}</div>
  <div class="mn-o-in">
    <p class="mn-o-s">Save the Date</p>
    <p class="mn-o-n">${esc(ctx.g)} <i>&amp;</i> ${esc(ctx.b)}</p>
    ${ctx.dparts ? `<p class="mn-o-d">${ctx.dparts.d} · ${ctx.dparts.m} · ${ctx.dparts.y}</p>` : ''}
    <p class="mn-o-k">Thân mời</p>
    <p class="mn-o-g">${ctx.guest ? esc(ctx.guest.name) : 'Quý khách'}</p>
    <button class="mn-o-btn" id="openBtn" type="button">Mở thiệp</button>
  </div>
</div>`;
  },

  cover(ctx) {
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    const p = ctx.dparts;
    return `
<header class="mn-cover">
  ${DEFS}
  <div class="mn-fl tr">${CORNER}</div>
  <div class="mn-fl bl">${CORNER}</div>
  <div class="mn-tulip a">${TULIP}</div><div class="mn-tulip b">${TULIP}</div>
  <p class="mn-std">Save the Date</p>
  <h1 class="mn-names">${esc(ctx.g)} <i>&amp;</i> ${esc(ctx.b)}</h1>
  ${photo ? `<div class="mn-photo"><img src="${esc(photo)}" alt="Ảnh cưới"></div>` : ''}
  ${p ? `<div class="mn-cdate"><div class="l"><b>${esc(ctx.d.time ? ctx.d.time.replace(/^0/, '') : '')}</b><span>${esc(ctx.weekday)}</span></div><b class="c">${p.d}.${p.m}</b><div class="r"><span>${p.y.slice(0, 2)}</span><span>${p.y.slice(2)}</span></div></div>
  <p class="mn-clunar">${lunarOf(ctx.date, ctx.lunar)}</p>` : ''}
</header>`;
  },

  sections: {
    quote(ctx) {
      return `
  <section class="sec mn-quote reveal">
    <div class="mn-mini">${MINI}</div>
    <p>Gặp nhau là duyên, ở lại là thương</p>
    <p>Từ nay chung một lối, chung một nhà</p>
  </section>`;
    },

    // hai bên gia đình: ảnh + thông tin so le trái phải
    couple(ctx) {
      const { d } = ctx;
      const ph = d.photos;
      const strip = (s) => esc(s);
      const side = (x, label, role, img, rev) => `
    <div class="mn-side ${rev ? 'rev' : ''} reveal">
      ${img ? `<div class="mn-side-ph"><img loading="lazy" src="${esc(img)}" alt="${role}"></div>` : ''}
      <div class="mn-side-tx">
        <p class="mn-side-k">${label}</p>
        ${x.father ? `<p class="mn-side-p">${strip(x.father)}</p>` : ''}
        ${x.mother ? `<p class="mn-side-p">${strip(x.mother)}</p>` : ''}
        ${x.address ? `<p class="mn-side-a">${esc(x.address)}</p>` : ''}
        <p class="mn-side-r">${role}</p>
        <p class="mn-side-n">${esc(x.name)}</p>
      </div>
    </div>`;
      return `
  <section class="sec mn-couple">
    ${side(d.groom, 'Nhà trai', 'Chú rể', pick(ph, 0), false)}
    ${side(d.bride, 'Nhà gái', 'Cô dâu', pick(ph, 5), true)}
  </section>`;
    },

    // thư mời: dải 3 ảnh nhỏ, tên khách chữ ký
    invite(ctx) {
      const { d } = ctx;
      const ph = d.photos;
      const three = ph.length >= 3 ? [1, 2, 3].map((i) => pick(ph, i)) : [];
      return `
  <section class="sec mn-inv reveal">
    <p class="mn-rule"></p>
    <h2 class="mn-h">Thư Mời</h2>
    <p class="mn-caps sm">Tham dự lễ cưới ${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
    ${three.length ? `<div class="mn-three">${three.map((u) => `<img loading="lazy" src="${esc(u)}" alt="">`).join('')}</div>` : ''}
    <p class="mn-caps">${esc(d.inviteText)}</p>
    <p class="mn-guest">${ctx.guest ? esc(ctx.guest.name) : 'Quý Khách'}</p>
    <p class="mn-caps">Tới dự bữa tiệc thân mật<br>chung vui cùng gia đình chúng tôi</p>
    ${d.message ? `<p class="mn-msg">${esc(d.message)}</p>` : ''}
  </section>`;
    },

    // mỗi sự kiện: tên, khối ngày lớn, âm lịch, địa chỉ; nơi tiệc có khung loang hồng + bản đồ
    events(ctx, opts, h) {
      const evs = evList(ctx.d);
      if (!evs.length) return '';
      const party = partyEvent(ctx.d);
      const title = `Đám cưới ${ctx.g} & ${ctx.b}`;
      const block = (e) => {
        const iso = e.date || ctx.date;
        const lun = iso ? `(Tức ${esc(h.lunarText(iso).replace(/^Nhằm /i, ''))})` : '';
        return `
    <div class="mn-ev reveal">
      <h3 class="mn-ev-n">${esc(e.name)}</h3>
      <p class="mn-caps sm">Được tổ chức vào lúc</p>
      ${dateRow(h, iso, e.time)}
      ${lun ? `<p class="mn-lunar">${lun}</p>` : ''}
      ${e !== party && (e.place || e.address) ? `<p class="mn-ev-k">Địa chỉ</p>${e.place ? `<p class="mn-ev-p">${esc(e.place)}</p>` : ''}${e.address ? `<p class="mn-ev-a">${esc(e.address)}</p>` : ''}` : ''}
      ${e.date ? `<a class="mn-link" target="_blank" rel="noopener" href="${esc(h.calendarLink(`${e.name} — ${title}`, e.date, e.time, e.address || e.place))}">Lưu vào lịch</a>` : ''}
    </div>`;
      };
      const dir = party && (party.mapUrl || (party.address ? h.mapSearch(party.address) : ''));
      return `
  <section class="sec mn-evs">
    ${evs.map((e, i) => block(e) + (i < evs.length - 1 ? `<div class="mn-mini sm">${MINI}</div>` : '')).join('')}
    ${party && (party.place || party.address) ? `
    <div class="mn-venue reveal">
      <svg class="mn-venue-bg" viewBox="0 0 340 420" preserveAspectRatio="none" aria-hidden="true">${wash(170, 210, 150, 190, 0.95)}</svg>
      <p class="mn-venue-k">Địa điểm tổ chức</p>
      ${party.place ? `<p class="mn-venue-p">${esc(party.place)}</p>` : ''}
      ${party.address ? `<p class="mn-venue-a">${esc(party.address)}</p>` : ''}
      ${dir ? `<a class="mn-pill" target="_blank" rel="noopener" href="${esc(dir)}">Xem chỉ đường</a>` : ''}
      ${party.address ? `<div class="mn-map"><iframe loading="lazy" title="Bản đồ" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(party.address)}&amp;output=embed"></iframe></div>` : ''}
    </div>` : ''}
  </section>`;
    },

    // lịch tháng có ngày âm nhỏ dưới mỗi ngày, ngày cưới là trái tim màu nước
    calendar(ctx) {
      const { d, dparts: p } = ctx;
      if (!p || (!d.show.calendar && !d.show.countdown)) return '';
      const y = +p.y, m = +p.m, day = +p.d;
      let grid = '';
      if (d.show.calendar) {
        const first = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
        const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
        let cells = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((w) => `<span class="w">${w}</span>`).join('') + '<span></span>'.repeat(first);
        for (let i = 1; i <= days; i++) {
          const l = solarToLunar(i, m, y);
          const sun = (first + i - 1) % 7 === 6;
          cells += `<span class="${i === day ? 'on' : ''}${sun ? ' sun' : ''}">${i === day ? HEART : ''}<b>${i}</b><small>${l.day === 1 ? `${l.day}/${l.month}` : l.day}</small></span>`;
        }
        grid = `<div class="mn-cal"><p class="mn-cal-h">Tháng ${m} · ${y}</p><p class="mn-cal-s">Năm ${esc(canChiYear(solarToLunar(day, m, y).year))}</p><div class="mn-cal-g">${cells}</div></div>`;
      }
      const u = (k, l) => `<span><b data-cd="${k}">0</b><small>${l}</small></span>`;
      return `
  <section class="sec mn-calsec reveal">
    <p class="mn-std sm">Save the Date</p>
    ${grid}
    ${d.show.countdown ? `<div class="mn-cd" role="timer">${u('d', 'Ngày')}${u('h', 'Giờ')}${u('m', 'Phút')}${u('s', 'Giây')}</div>` : ''}
  </section>`;
    },

    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      return `
  <section class="sec mn-gal">
    <h2 class="mn-h line">Album ảnh cưới</h2>
    <div class="mn-grid">
      ${ph.map((u, i) => `<button class="ph reveal" data-i="${i}" style="background-image:url('${esc(u)}')" aria-label="Xem ảnh ${i + 1}"></button>`).join('')}
    </div>
  </section>`;
    },

    // ảnh tràn viền, lời nhắn phủ chữ phía dưới
    story(ctx) {
      const text = ctx.d.story;
      const img = ctx.d.cover || pick(ctx.d.photos, 0);
      if (!text || !img) return '';
      return `
  <section class="mn-story reveal">
    <img loading="lazy" src="${esc(img)}" alt="">
    <div class="mn-story-tx"><p class="mn-std sm">Our story</p>${text.split(/\n+/).map((x) => `<p>${esc(x)}</p>`).join('')}</div>
  </section>`;
    },

    gift(ctx, opts, h) {
      const html = h.gift(ctx);
      return html ? html.replace('<h2 class="mn-h">', `<div class="mn-heart">${HEART}</div><h2 class="mn-h">`) : '';
    },

    thanks(ctx) {
      return `
  <section class="sec mn-thanks reveal">
    <div class="mn-spray">${SPRAY}</div>
    <p class="mn-thx">Thank you</p>
    <p class="mn-caps sm">Rất hân hạnh được đón tiếp</p>
    <p class="mn-thx-n">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
  </section>`;
    },
  },

  css: `
.mn-defs{position:absolute;width:0;height:0;overflow:hidden}
.tpl-maunuoc{background:var(--page);font-variant-numeric:lining-nums}
.tpl-maunuoc .card *{font-variant-numeric:lining-nums}
.tpl-maunuoc .card{background:var(--bg);box-shadow:0 0 40px rgba(120,60,80,.12)}
.tpl-maunuoc .sec{padding:48px 24px}
.mn-h{margin:0 0 6px;font-family:var(--font-script);font-weight:400;font-size:44px;line-height:1.15;color:var(--ink)}
.mn-h.line{display:flex;align-items:center;gap:14px;text-align:left;font-size:38px}
.mn-h.line::after{content:"";flex:1;height:1px;background:var(--accent);opacity:.55}
.mn-hsub{margin:0 0 26px;font-size:13px;letter-spacing:.08em;color:var(--muted)}
.mn-caps{margin:0 0 6px;font-size:14px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;line-height:1.7}
.mn-caps.sm{font-size:12px;font-weight:500;letter-spacing:.1em}
.mn-std{margin:0;font-family:var(--font-script);font-size:56px;line-height:1.05;color:var(--ink)}
.mn-std.sm{font-size:44px;margin-bottom:12px}
.mn-mini{width:110px;margin:0 auto 10px}
.mn-mini.sm{width:84px;margin:6px auto 22px;opacity:.9}
@keyframes mnSway{0%,100%{transform:rotate(0)}50%{transform:rotate(-2.5deg)}}
@keyframes mnBreath{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}

/* ---------- bìa ---------- */
.mn-cover{position:relative;min-height:693px;padding:30px 24px 26px;text-align:center;overflow:hidden;background:radial-gradient(ellipse 70% 40% at 0 60%,color-mix(in srgb,var(--mn-wash) 60%,transparent),transparent 70%),var(--bg)}
.mn-fl{position:absolute;width:236px;pointer-events:none}
.mn-fl svg,.mn-o-fl svg{display:block;width:100%;overflow:visible}
.mn-fl.tr{right:-16px;top:-26px;transform-origin:100% 0;animation:mnSway 9s ease-in-out infinite}
.mn-fl.bl{left:-22px;bottom:-24px;width:250px;transform:rotate(180deg);transform-origin:50% 50%}
.mn-tulip{position:absolute;width:62px;color:var(--mn-pen);opacity:.8}
.mn-tulip.a{left:4px;top:250px;transform:rotate(-8deg)}
.mn-tulip.b{right:2px;top:380px;width:52px;transform:scaleX(-1) rotate(-6deg)}
.mn-std,.mn-names,.mn-photo,.mn-cdate,.mn-clunar{position:relative}
.mn-names{margin:4px 0 16px;font-family:var(--font-title);font-weight:600;font-size:23px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink)}
.mn-names i{font-style:normal;font-weight:500;color:var(--accent)}
.mn-photo{width:min(262px,70%);margin:0 auto;padding:7px;background:#fff;box-shadow:0 10px 30px rgba(120,60,80,.16),0 0 0 1px var(--line)}
.mn-photo::after{content:"";position:absolute;inset:-9px;border:1px solid var(--gold);opacity:.55;pointer-events:none}
.mn-photo img{width:100%;aspect-ratio:3/4.1;object-fit:cover;object-position:50% 30%}
.mn-cdate{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:14px;width:min(320px,100%);margin:26px auto 0;font-family:var(--font-title)}
.mn-cdate .l{display:grid;text-align:right;font-size:17px;line-height:1.3}
.mn-cdate .l b{font-weight:600}
.mn-cdate .c{padding:0 14px;font-weight:500;font-size:46px;line-height:1;border-left:1.5px solid var(--ink);border-right:1.5px solid var(--ink)}
.mn-cdate .r{display:grid;justify-items:start;font-size:19px;line-height:1.05;letter-spacing:.1em}
.mn-clunar{margin:12px 0 0;font-size:13px;color:var(--muted)}

/* ---------- câu trích ---------- */
.mn-quote{padding-top:30px!important;padding-bottom:30px!important}
.mn-quote p{margin:0;font-family:var(--font-script);font-size:30px;line-height:1.5;color:var(--ink)}

/* ---------- hai bên gia đình ---------- */
.mn-couple{padding-top:20px!important}
.mn-side{display:grid;grid-template-columns:48% 1fr;gap:18px;align-items:center;margin-bottom:34px}
.mn-side.rev{grid-template-columns:1fr 48%}
.mn-side.rev .mn-side-ph{order:2}
.mn-side-ph{padding:6px;background:#fff;box-shadow:0 0 0 1px var(--line),8px 8px 0 color-mix(in srgb,var(--mn-wash) 80%,transparent)}
.mn-side.rev .mn-side-ph{box-shadow:0 0 0 1px var(--line),-8px 8px 0 color-mix(in srgb,var(--mn-wash) 80%,transparent)}
.mn-side-ph img{width:100%;aspect-ratio:3/4;object-fit:cover;object-position:50% 25%}
.mn-side-tx p{margin:0}
.mn-side-k{font-family:var(--font-title);font-weight:600;font-size:20px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px!important}
.mn-side-p{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.02em;line-height:1.5}
.mn-side-a{font-size:12px;color:var(--muted);margin-top:4px!important}
.mn-side-r{margin-top:16px!important;font-family:var(--font-script);font-size:24px;color:var(--muted)}
.mn-side-n{font-family:var(--font-script);word-spacing:.12em;font-size:34px;line-height:1.1;color:var(--ink)}

/* ---------- thư mời ---------- */
.mn-rule{width:150px;height:1px;margin:0 auto 6px;background:var(--ink);opacity:.5}
.mn-three{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:20px -8px 22px;align-items:center}
.mn-three img{width:100%;aspect-ratio:2/3;object-fit:cover;box-shadow:0 4px 12px rgba(0,0,0,.08)}
.mn-three img:nth-child(2){aspect-ratio:3/4;transform:translateY(0)}
.mn-guest{margin:10px 0 12px;word-spacing:.12em;font-family:var(--font-script);font-size:42px;line-height:1.2;color:var(--accent)}
.mn-msg{max-width:320px;margin:18px auto 0;font-size:14px;color:var(--muted);font-style:italic}

/* ---------- sự kiện ---------- */
.mn-evs{padding-top:16px!important}
.mn-ev{margin-bottom:8px}
.mn-ev-n{margin:0 0 6px;font-family:var(--font-title);font-weight:600;font-size:28px;letter-spacing:.04em;text-transform:uppercase;line-height:1.2}
.mn-dr{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:14px;width:min(330px,100%);margin:16px auto 10px}
.mn-dr-l,.mn-dr-r{display:grid;font-size:19px;line-height:1.45}
.mn-dr-l{text-align:right}
.mn-dr-l b{font-weight:500;letter-spacing:.06em}
.mn-dr-r{text-align:left}
.mn-dr-d{padding:2px 18px;font-family:var(--font-title);font-style:italic;font-weight:700;font-size:58px;line-height:1;color:var(--accent);border-left:1.5px solid var(--ink);border-right:1.5px solid var(--ink)}
.mn-lunar{margin:0 0 14px;font-size:13px;color:var(--muted)}
.mn-ev-k{display:table;margin:0 auto 6px;padding:0 10px 2px;border-bottom:1px solid var(--ink);font-size:14px;font-weight:600}
.mn-ev-p{margin:0;font-family:var(--font-title);font-weight:600;font-size:24px;text-transform:uppercase;line-height:1.25}
.mn-ev-a{margin:2px 0 0;font-size:14px;color:var(--muted)}
.mn-link{display:inline-block;margin-top:10px;font-size:13px;font-weight:600;color:var(--accent);text-decoration:none;border-bottom:1px solid currentColor}
.mn-venue{position:relative;margin:34px -6px 0;padding:44px 26px 34px}
.mn-venue-bg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.mn-venue>*:not(svg){position:relative}
.mn-venue-k{margin:0;font-family:var(--font-script);font-size:34px;color:var(--ink)}
.mn-venue-p{margin:4px 0 2px;font-family:var(--font-title);font-weight:700;font-size:26px;line-height:1.2;text-transform:uppercase;letter-spacing:.04em}
.mn-venue-a{margin:0 0 14px;font-size:14px;color:var(--ink)}
.mn-pill{display:inline-block;padding:7px 18px;border-radius:999px;background:#fff;color:var(--ink);font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.mn-map{margin:16px 0 0;aspect-ratio:16/11;border-radius:4px;overflow:hidden;border:4px solid #fff;box-shadow:0 4px 16px rgba(0,0,0,.08);background:var(--line)}
.mn-map iframe{width:100%;height:100%;border:0}

/* ---------- lịch ---------- */
.mn-cal{width:min(340px,100%);margin:0 auto}
.mn-cal-h{margin:0;font-family:var(--font-title);font-weight:600;font-size:24px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent)}
.mn-cal-s{margin:0 0 16px;font-family:var(--font-title);font-size:16px;color:var(--accent)}
.mn-cal-g{display:grid;grid-template-columns:repeat(7,1fr);row-gap:8px}
.mn-cal-g span{position:relative;display:grid;justify-items:center;align-content:center;height:46px;font-family:var(--font-title);line-height:1.1}
.mn-cal-g .w{height:30px;font-family:var(--font-body);font-size:12px;font-weight:600;color:var(--muted)}
.mn-cal-g .w:nth-child(7),.mn-cal-g .sun b,.mn-cal-g .sun small{color:var(--accent)}
.mn-cal-g b{position:relative;font-weight:500;font-size:19px}
.mn-cal-g small{position:relative;font-size:11px;color:var(--muted)}
.mn-cal-g .on svg{position:absolute;left:50%;top:50%;width:46px;height:44px;margin:-23px 0 0 -23px;animation:mnBreath 2.4s ease-in-out infinite}
.mn-cal-g .on b,.mn-cal-g .on small{color:var(--accent);font-weight:700}
.mn-cd{display:flex;justify-content:center;gap:22px;margin-top:26px;padding-top:20px;border-top:1px solid var(--line)}
.mn-cd span{display:grid}
.mn-cd b{font-family:var(--font-title);font-weight:600;font-size:34px;line-height:1;color:var(--accent);font-variant-numeric:tabular-nums}
.mn-cd small{font-size:12px;color:var(--muted);letter-spacing:.08em}

/* ---------- album ---------- */
.mn-gal{padding-left:14px!important;padding-right:14px!important}
.mn-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:18px}
.mn-grid .ph,.mn-grid .ph:nth-child(3n+1){grid-column:auto;aspect-ratio:2/3;border-radius:0;background-position:center 30%}
.mn-grid .ph:nth-child(5n){grid-column:span 2;aspect-ratio:4/5}

/* ---------- chuyện tình ---------- */
.mn-story{position:relative;color:#fff;text-align:center}
.mn-story img{width:100%;aspect-ratio:3/4;object-fit:cover}
.mn-story-tx{position:absolute;left:0;right:0;bottom:0;padding:90px 22px 26px;background:linear-gradient(transparent,rgba(30,20,22,.62) 45%)}
.mn-story-tx .mn-std{color:#fff}
.mn-story-tx p:not(.mn-std){margin:0 auto 6px;max-width:340px;font-size:14px;line-height:1.7}

/* ---------- quà, biểu mẫu, lưu bút ---------- */
.mn-heart{width:62px;margin:0 auto 4px}
.tpl-maunuoc .s-gift .mn-h,.tpl-maunuoc .s-rsvp .mn-h,.tpl-maunuoc .s-wishes .mn-h{font-family:var(--font-title);font-weight:600;font-size:28px}
.tpl-maunuoc .gift,.tpl-maunuoc .form{border-radius:4px;border:0;box-shadow:0 6px 26px rgba(80,40,50,.14)}
.tpl-maunuoc .gift-who{font-family:var(--font-script);font-size:30px;color:var(--accent)}
.tpl-maunuoc .form input:not([type=radio]),.tpl-maunuoc .form select,.tpl-maunuoc .form textarea,.tpl-maunuoc .choice label{border-radius:6px;background:#fff}
.tpl-maunuoc .btn{border-radius:4px;letter-spacing:.06em}
.tpl-maunuoc .wish{border-radius:4px;border-color:var(--line);background:linear-gradient(90deg,var(--mn-wash) 0 3px,#fff 3px)}
.tpl-maunuoc .s-rsvp{background:radial-gradient(ellipse 70% 50% at 50% 40%,color-mix(in srgb,var(--mn-wash) 50%,transparent),transparent)}

/* ---------- cảm ơn ---------- */
.mn-thanks{padding-top:30px!important;overflow:hidden}
.mn-spray{width:300px;margin:0 auto -24px;animation:mnSway 8s ease-in-out infinite}
.mn-spray svg{display:block;width:100%;overflow:visible}
.mn-thx{position:relative;margin:0;font-family:var(--font-script);font-size:58px;color:var(--accent)}
.mn-thx-n{margin:14px 0 0;font-family:var(--font-script);word-spacing:.15em;font-size:34px}

/* ---------- màn mở thiệp: vòng hoa màu nước nở ra ---------- */
.mn-opener{background:radial-gradient(circle at 50% 45%,#fff,var(--mn-wash) 140%);overflow:hidden}
.mn-o-fl{position:absolute;width:min(330px,80vw);transition:transform 1s ease,opacity 1s}
.mn-o-fl.tr{right:-90px;top:-80px}
.mn-o-fl.bl{left:-90px;bottom:-80px;transform:rotate(180deg)}
.mn-o-in{position:relative;text-align:center;padding:20px;transition:transform 1s ease,opacity .8s}
.mn-o-in p{margin:0}
.mn-o-s{font-family:var(--font-script);font-size:54px;color:var(--ink);line-height:1.1}
.mn-o-n{margin:8px 0 2px!important;font-family:var(--font-title);font-weight:600;font-size:22px;letter-spacing:.1em;text-transform:uppercase}
.mn-o-n i{font-style:normal;color:var(--accent)}
.mn-o-d{font-family:var(--font-title);font-size:18px;letter-spacing:.2em;color:var(--muted)}
.mn-o-k{margin-top:26px!important;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
.mn-o-g{word-spacing:.12em;font-family:var(--font-script);font-size:36px;color:var(--accent);line-height:1.3}
.mn-o-btn{margin-top:18px;padding:11px 30px;border:1px solid var(--accent);border-radius:999px;background:var(--accent);color:var(--accent-ink);font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;animation:mnBreath 2.2s ease-in-out infinite}
.mn-opener.opening .mn-o-fl.tr{transform:translate(40%,-40%) scale(1.3);opacity:0}
.mn-opener.opening .mn-o-fl.bl{transform:rotate(180deg) translate(40%,-40%) scale(1.3);opacity:0}
.mn-opener.opening .mn-o-in{transform:scale(1.12);opacity:0}

@media (prefers-reduced-motion:reduce){.mn-fl,.mn-spray,.mn-o-btn,.mn-cal-g .on svg{animation:none!important}}
@media (min-width:768px){.tpl-maunuoc .card{margin:24px auto;min-height:0}}
`,
};
