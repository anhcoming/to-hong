// Mẫu "Cắt Dán" — sổ tay cắt dán cổ điển: giấy kraft ngả màu, mép giấy xé, ảnh cắt viền trắng dán băng keo,
// chữ cắt rời kiểu báo cũ, ghi chú viết tay đỏ. Mọi hoạ tiết (giấy, băng keo, ghim, kẹp, phim) tự vẽ bằng CSS/SVG.
const { esc } = require('../lib/util');

// ---------- tiện ích dựng hình (chạy một lần khi nạp mẫu, kết quả cố định) ----------
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// mép giấy xé: clip-path răng cưa không đều ở cạnh trên / dưới
function torn(seed, { top = true, bottom = true, amp = 12, n = 46 } = {}) {
  const r = rng(seed);
  const pts = [];
  const y = () => (r() < 0.25 ? r() * amp : r() * amp * 0.55).toFixed(1);
  if (top) for (let i = 0; i <= n; i++) pts.push(`${((i * 100) / n).toFixed(2)}% ${y()}px`);
  else pts.push('0 0', '100% 0');
  if (bottom) for (let i = n; i >= 0; i--) pts.push(`${((i * 100) / n).toFixed(2)}% calc(100% - ${y()}px)`);
  else pts.push('100% 100%', '0 100%');
  return `clip-path:polygon(${pts.join(',')})`;
}
// chữ cắt rời từ báo: mỗi chữ một mẩu giấy khác màu, nghiêng khác nhau
const RANSOM = [['#fbf6ea', '#1f1a17'], ['var(--accent)', '#fff'], ['#1f1a17', '#f4ecdc'], ['#e8d9bd', 'var(--accent)'], ['#fff', 'var(--accent)'], ['var(--cd-kraft-d)', '#fff']];
function ransom(text, seed = 7) {
  const r = rng(seed);
  // mỗi từ một cụm không ngắt dòng giữa chừng
  return text.split(' ').map((w) => `<b class="w">${[...w].map((ch) => {
    const [bg, fg] = RANSOM[Math.floor(r() * RANSOM.length)];
    const rot = (r() * 12 - 6).toFixed(1);
    const fs = (0.85 + r() * 0.35).toFixed(2);
    return `<span style="--b:${bg};--f:${fg};--r:${rot}deg;--s:${fs}">${esc(ch)}</span>`;
  }).join('')}</b>`).join('');
}
const ransomH = (text, seed) => `<h2 class="cd-ransom" aria-label="${esc(text)}">${ransom(text.toUpperCase(), seed)}</h2>`;

// giấy: nhiễu sần (SVG feTurbulence) + vệt ố
const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .3 0 0 0 0 .2 0 0 0 0 .12 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const TEAR = { a: torn(11), b: torn(23), c: torn(37, { amp: 9 }), d: torn(41, { bottom: false, amp: 14 }), e: torn(53, { top: false, amp: 14 }), f: torn(67, { amp: 8, n: 30 }) };

// ---------- hoạ tiết SVG ----------
const lineFlower = (cls) => `<svg class="${cls}" viewBox="0 0 120 170" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
  <path d="M60 168C58 130 64 98 62 70"/><path d="M61 120c-14-6-26-20-28-36 14 4 25 16 28 36zM62 104c12-8 24-12 36-10-6 12-20 16-36 10z"/>
  <path d="M62 70c-10-8-26-6-34 4 10 10 26 8 34-4zM62 70c4-14 0-30-10-40-6 14-2 30 10 40zM62 70c10-12 26-14 36-6-8 12-24 14-36 6zM62 70c8-14 22-22 36-20-4 14-20 22-36 20z"/>
  <path d="M62 70c-14-4-28-16-30-30 14 0 26 12 30 30z"/><circle cx="62" cy="68" r="3"/><path d="M30 12c6 8 4 18-4 24M96 20c-4 10 0 18 8 22"/></svg>`;
const clip = (cls) => `<svg class="${cls}" viewBox="0 0 30 90" aria-hidden="true"><path d="M10 80V18a7 7 0 0 1 14 0v58a10 10 0 0 1-20 0V12A11 11 0 0 1 26 12" fill="none" stroke="#8d9097" stroke-width="3" stroke-linecap="round"/></svg>`;
const pin = (cls) => `<svg class="${cls}" viewBox="0 0 40 52" aria-hidden="true"><path d="M20 30l-3 20h2z" fill="#777"/><ellipse cx="20" cy="30" rx="11" ry="4" fill="#7d1015"/><path d="M12 10h16l-3 18H15z" fill="#b0161e"/><ellipse cx="20" cy="10" rx="13" ry="7" fill="#d42a2f"/><ellipse cx="16" cy="8" rx="4" ry="2" fill="#ff8a8a" opacity=".7"/></svg>`;
const stamp = (cls, p) => `<svg class="${cls}" viewBox="0 0 90 90" aria-hidden="true"><g fill="none" stroke="currentColor"><circle cx="45" cy="45" r="40" stroke-width="2"/><circle cx="45" cy="45" r="31" stroke-width="1"/></g>
  <text x="45" y="41" text-anchor="middle" font-size="12" fill="currentColor" font-family="Anton,sans-serif" letter-spacing="1">${p ? `${p.d}.${p.m}` : 'LOVE'}</text><text x="45" y="58" text-anchor="middle" font-size="11" fill="currentColor" font-family="Anton,sans-serif" letter-spacing="2">${p ? p.y : ''}</text>
  <path d="M-4 30q12-8 24 0t24 0 24 0 24 0 24 0M-4 62q12-8 24 0t24 0 24 0 24 0 24 0" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;

const evList = (d) => d.events.filter((e) => e.name || e.place);
const pick = (ph, i) => (ph.length ? ph[i % ph.length] : '');

module.exports = {
  id: 'catdan',
  name: 'Cắt Dán',
  group: 'chatlieu',
  badge: 'Mới',
  desc: 'Sổ tay cắt dán cổ điển: giấy kraft xé mép, ảnh dán băng keo, ghi chú viết tay đỏ',
  fonts: 'https://fonts.googleapis.com/css2?family=Anton&family=Patrick+Hand&family=Dancing+Script:wght@500;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Lora:ital,wght@0,400;0,600;1,400&display=swap',
  palettes: [
    {
      id: 'do-vintage', name: 'Đỏ cổ điển', swatch: ['#e6d6bd', '#a4262c'],
      vars: { '--page': '#d9c8ad', '--bg': '#e6d6bd', '--paper': '#fbf6ea', '--ink': '#3f2a22', '--muted': '#7d6656', '--accent': '#a4262c', '--accent-ink': '#fff8ee', '--gold': '#b88a4a', '--line': '#d6c3a5', '--cd-kraft': '#e2cfb2', '--cd-kraft-d': '#b99a74', '--cd-tape': 'rgba(236,224,196,.82)', '--font-title': "'Playfair Display',Georgia,serif", '--font-script': "'Dancing Script',cursive", '--font-body': "'Lora',Georgia,serif" },
    },
    {
      id: 'nau-giay', name: 'Nâu giấy', swatch: ['#e9dcc6', '#5e3b24'],
      vars: { '--page': '#d6c6aa', '--bg': '#ebdfca', '--paper': '#fcf8ef', '--ink': '#3a2a1e', '--muted': '#7c6a58', '--accent': '#6b4127', '--accent-ink': '#fbf3e4', '--gold': '#c29a4e', '--line': '#d8c7a8', '--cd-kraft': '#dcc7a3', '--cd-kraft-d': '#a98559', '--cd-tape': 'rgba(240,226,190,.85)', '--font-title': "'Playfair Display',Georgia,serif", '--font-script': "'Dancing Script',cursive", '--font-body': "'Lora',Georgia,serif" },
    },
  ],
  demo: {
    cover: '/demo/dodam-2.jpg',
    photos: [6, 5, 8, 1, 3, 4, 7].map((n) => `/demo/dodam-${n}.jpg`),
  },
  layout: ['letter', 'couple', 'invite', 'story', 'calendar', 'events', 'gallery', 'rsvp', 'gift', 'wishes', 'thanks'],

  title(text, sub) {
    return `<h2 class="cd-h">${esc(text)}</h2>${sub ? `<p class="cd-hsub">${esc(sub)}</p>` : ''}`;
  },

  opener(ctx) {
    const p = ctx.dparts;
    return `
<div class="opener cd-opener" id="opener" data-open-ms="1100">
  <div class="cd-env">
    <div class="cd-env-flap"></div>
    ${stamp('cd-env-mark', p)}
    <div class="cd-env-stampbox"><span>${esc(ctx.initials)}</span></div>
    <p class="cd-env-k">Gửi tới</p>
    <p class="cd-env-to">${ctx.guest ? esc(ctx.guest.name) : 'Bạn thân mến'}</p>
    <p class="cd-env-from">Từ ${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
    <button class="cd-env-tape" id="openBtn" type="button">Xé băng keo · mở thiệp</button>
  </div>
  <p class="cd-env-hint">Chạm để mở</p>
</div>`;
  },

  cover(ctx) {
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    const p = ctx.dparts;
    return `
<header class="cd-cover">
  <div class="cd-top">
    ${lineFlower('cd-lf')}
    <p class="cd-wm">We're getting married</p>
    <h1 class="cd-names"><span>${esc(ctx.g)}</span><i>&amp;</i><span>${esc(ctx.b)}</span></h1>
  </div>
  <div class="cd-rip" style="${TEAR.a}"></div>
  <div class="cd-collage">
    <div class="cd-letter" aria-hidden="true"><b>my love,</b><span></span><span></span><span></span><span></span><span></span></div>
    <div class="cd-ruler" aria-hidden="true"></div>
    ${photo ? `<figure class="cd-cut"><img src="${esc(photo)}" alt="Ảnh cưới"><i class="cd-tape t1"></i><i class="cd-tape t2"></i></figure>` : ''}
    ${p ? `<p class="cd-note"><span>${p.d} · ${p.m} · ${p.y}</span><small>${esc(ctx.weekday)}${ctx.timeText ? ` · ${esc(ctx.timeText)}` : ''}</small></p>` : ''}
    ${stamp('cd-cstamp', p)}
  </div>
  <div class="cd-rip r2" style="${TEAR.b}"></div>
</header>`;
  },

  sections: {
    // nền đỏ: vài dòng viết tay gạch chân so le, như mảnh giấy nhắn
    letter(ctx) {
      const lines = ['Nếu tấm thiệp này đã đến tay bạn', 'nghĩa là ngày vui của tụi mình', 'đã gần lắm rồi đó!', 'và tụi mình rất muốn có bạn ở đó'];
      return `
  <section class="sec cd-red cd-letterbox">
    <div class="cd-hand">${lines.map((l, i) => `<p class="reveal" style="--i:${i}">${l}</p>`).join('')}</div>
    ${ctx.d.message ? `<p class="cd-msg reveal">${esc(ctx.d.message)}</p>` : ''}
    <p class="cd-sign reveal">— ${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
  </section>
  <div class="cd-rip r3" style="${TEAR.c}"></div>`;
    },

    // về chúng mình: chữ cắt báo + ảnh cắt viền đỏ, thông tin hai bên gia đình
    couple(ctx) {
      const { d } = ctx;
      const ph = d.photos;
      const person = (x, role, img, side) => `
      <div class="cd-pp ${side} reveal">
        ${img ? `<div class="cd-pp-ph"><img loading="lazy" src="${esc(img)}" alt="${role}"></div>` : ''}
        <div class="cd-pp-tx">
          <p class="cd-pp-role">${role}</p>
          <p class="cd-pp-name">${esc(x.fullName || x.name)}</p>
          ${x.father || x.mother ? `<p class="cd-pp-fam">Con ông bà<br>${[x.father, x.mother].filter(Boolean).map(esc).join('<br>')}</p>` : ''}
          ${x.address ? `<p class="cd-pp-addr">${esc(x.address)}</p>` : ''}
        </div>
      </div>`;
      return `
  <section class="sec cd-kraft cd-couple">
    ${ransomH('Về chúng mình', 5)}
    <svg class="cd-arrow" viewBox="0 0 60 40" aria-hidden="true"><path d="M4 8c16-6 34 2 40 22M36 24l8 8 6-12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    ${person(d.bride, 'Cô dâu', pick(ph, 1), 'l')}
    ${person(d.groom, 'Chú rể', pick(ph, 2), 'r')}
  </section>`;
    },

    // lời mời trên mảnh giấy trắng xé mép, kèm tên khách
    invite(ctx) {
      const { d } = ctx;
      return `
  <section class="sec cd-kraft cd-inv">
    <div class="cd-sheet reveal" style="${TEAR.f}">
      <p class="cd-inv-lead">${esc(d.inviteText)}</p>
      <p class="cd-inv-guest">${ctx.guest ? esc(ctx.guest.name) : 'Quý khách'}</p>
      <p class="cd-inv-to">tới dự buổi tiệc chung vui cùng gia đình chúng tôi<br>trong ngày thành hôn của</p>
      <p class="cd-inv-n">${esc(d.groom.fullName || d.groom.name)}</p>
      <p class="cd-inv-amp">&amp;</p>
      <p class="cd-inv-n">${esc(d.bride.fullName || d.bride.name)}</p>
    </div>
    <i class="cd-tape t3"></i>
  </section>`;
    },

    story(ctx) {
      const s = ctx.d.story;
      const img = pick(ctx.d.photos, 0);
      if (!s && !img) return '';
      return `
  <section class="sec cd-kraft cd-story">
    ${s ? `<div class="cd-poem reveal">${s.split(/\n+/).map((x) => `<p>${esc(x)}</p>`).join('')}</div>` : ''}
    ${img ? `<figure class="cd-frame reveal"><img loading="lazy" src="${esc(img)}" alt="Ảnh cưới">${clip('cd-clip')}<span class="cd-scrap" aria-hidden="true">${pin('cd-pin')}</span></figure>` : ''}
    <div class="cd-welcome" aria-hidden="true">${ransom('WELCOME', 3)}<em>to our</em>${ransom('WEDDING', 9)}</div>
  </section>`;
    },

    // lịch: xấp giấy sổ còng chồng lệch, ngày cưới khoanh tim; đếm ngược trong ô đỏ
    calendar(ctx, opts, h) {
      const { d, dparts: p } = ctx;
      if (!p || (!d.show.calendar && !d.show.countdown)) return '';
      const u = (k, l) => `<span><b data-cd="${k}">0</b><small>${l}</small></span>`;
      return `
  <section class="sec cd-kraft cd-cal">
    ${ransomH('Ngày chung đôi', 13)}
    <p class="cd-hsub">${esc(ctx.weekday)} · ${esc(ctx.lunar)}</p>
    ${d.show.calendar ? `<div class="cd-pad reveal"><div class="cd-pad-s">${h.calGrid(ctx, `<p class="cd-cal-h">Tháng ${+p.m} <em>${p.y}</em></p>`)}</div></div>
    <svg class="cd-swirl" viewBox="0 0 60 70" aria-hidden="true"><path d="M50 4C20 10 6 30 26 40s10 22-12 26M6 58l8 8 10-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>` : ''}
    ${d.show.countdown ? `<div class="cd-cd reveal" role="timer">${u('d', 'Ngày')}${u('h', 'Giờ')}${u('m', 'Phút')}${u('s', 'Giây')}</div>` : ''}
  </section>`;
    },

    // lịch trình: mỗi sự kiện một tấm vé dán băng keo
    events(ctx, opts, h) {
      const evs = evList(ctx.d);
      if (!evs.length) return '';
      const title = `Đám cưới ${ctx.g} & ${ctx.b}`;
      return `
  <div class="cd-rip r4" style="${TEAR.d}"></div>
  <section class="sec cd-paper cd-ev">
    <h2 class="cd-h">Thời gian tổ chức</h2>
    <p class="cd-hsub">${esc(ctx.weekday)}, ${esc(ctx.dmy)}</p>
    ${evs.map((e, i) => {
      const p = h.parts(e.date);
      const dir = e.mapUrl || (e.address ? h.mapSearch(e.address) : '');
      return `
    <article class="cd-tk reveal" style="--r:${i % 2 ? 1.2 : -1.2}deg">
      <div class="cd-tk-l"><b>${esc(h.clock(e.time)) || '—'}</b>${p ? `<span>${p.d}/${p.m}</span>` : ''}</div>
      <div class="cd-tk-r">
        <h3>${esc(e.name)}</h3>
        ${p && e.date !== ctx.date ? `<p class="cd-tk-d">${esc(h.weekday(e.date))}, ${esc(h.dmy(e.date))}</p>` : ''}
        ${e.place ? `<p class="cd-tk-p">${esc(e.place)}</p>` : ''}
        ${e.address ? `<p class="cd-tk-a">${esc(e.address)}</p>` : ''}
        <p class="cd-tk-act">
          ${dir ? `<a target="_blank" rel="noopener" href="${esc(dir)}">Chỉ đường</a>` : ''}
          ${e.date ? `<a target="_blank" rel="noopener" href="${esc(h.calendarLink(`${e.name} — ${title}`, e.date, e.time, e.address || e.place))}">Lưu vào lịch</a>` : ''}
        </p>
        ${e.address ? `<details class="cd-map"><summary>Xem bản đồ</summary><div class="map"><iframe loading="lazy" title="Bản đồ ${esc(e.name)}" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(e.address)}&amp;output=embed"></iframe></div></details>` : ''}
      </div>
    </article>`;
    }).join('')}
    <p class="cd-lunar">(Tức ${esc(ctx.lunar.replace(/^Nhằm /i, ''))})</p>
  </section>
  <div class="cd-rip r5" style="${TEAR.e}"></div>`;
    },

    // album: ảnh polaroid dán lệch, băng keo, ghim, dải phim
    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      const notes = ['ngày đẹp nhất', 'mãi bên nhau', 'yêu thương', 'cười thật tươi', 'chỉ hai đứa mình', 'happy day'];
      return `
  <section class="sec cd-kraft cd-gal">
    ${ransomH('Album ảnh', 21)}
    <div class="cd-film" aria-hidden="true"></div>
    <div class="cd-grid">
      ${ph.map((u, i) => `<button class="ph reveal" data-i="${i}" aria-label="Xem ảnh ${i + 1}"><i style="background-image:url('${esc(u)}')"></i>${i % 3 === 0 ? '<span class="cd-tape t5"></span>' : i % 3 === 1 ? pin('cd-pin s') : ''}<em>${notes[i % notes.length]}</em></button>`).join('')}
    </div>
  </section>`;
    },

    rsvp(ctx, opts, h) {
      const html = h.rsvp(ctx);
      if (!html) return '';
      return html.replace('<form class="form" id="rsvpForm">', `<form class="form" id="rsvpForm">${pin('cd-pin f')}`);
    },

    gift(ctx, opts, h) {
      const html = h.gift(ctx);
      return html;
    },

    wishes(ctx, opts, h) {
      const html = h.wishes(ctx, opts);
      return html;
    },

    thanks(ctx) {
      return `
  <div class="cd-rip r6" style="${TEAR.d}"></div>
  <section class="sec cd-red cd-thanks reveal">
    <div class="cd-thx-r" aria-label="Cảm ơn">${ransom('CẢM ƠN', 31)}</div>
    <p class="cd-thx-l">Rất hân hạnh được đón tiếp bạn!</p>
    <p class="cd-thx-n">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
    ${lineFlower('cd-lf b')}
  </section>`;
    },
  },

  css: `
.tpl-catdan{background:var(--page) ${NOISE}}
.tpl-catdan .card{background:radial-gradient(ellipse 60% 30% at 20% 30%,rgba(120,80,30,.1),transparent),radial-gradient(ellipse 50% 25% at 80% 70%,rgba(120,80,30,.09),transparent),${NOISE},var(--cd-kraft);box-shadow:0 0 50px rgba(60,30,10,.25)}
.tpl-catdan .sec{padding:48px 22px}
.cd-red{background:radial-gradient(circle at 85% 20%,rgba(0,0,0,.18) 1.1px,transparent 1.6px) 0 0/7px 7px,${NOISE},var(--accent);color:var(--accent-ink)}
.cd-kraft{background:none}
.cd-paper{background:${NOISE},var(--paper)}
.cd-rip{position:relative;z-index:3;height:34px;margin:-16px 0;background:var(--paper);filter:drop-shadow(0 2px 2px rgba(0,0,0,.25))}
.cd-rip.r2,.cd-rip.r3{height:30px}
.cd-rip.r4,.cd-rip.r6{margin-bottom:0;height:26px}
.cd-rip.r5{margin-top:0;height:26px}
.cd-rip.r6{background:var(--accent)}
.cd-tape{position:absolute;z-index:4;width:84px;height:24px;background:var(--cd-tape);box-shadow:0 1px 3px rgba(0,0,0,.12);clip-path:polygon(4% 0,96% 0,100% 18%,95% 36%,100% 56%,96% 76%,100% 100%,4% 100%,0 80%,5% 60%,0 40%,4% 20%,0 0);pointer-events:none}
.cd-h{margin:0 0 6px;font-family:var(--font-title);font-weight:600;font-size:28px;line-height:1.2;color:var(--accent)}
.cd-hsub{margin:0 0 26px;font-family:'Patrick Hand',cursive;font-size:18px;color:var(--muted)}

/* ---------- chữ cắt báo ---------- */
.cd-ransom{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:8px 12px;margin:0 0 10px;font-family:Anton,Impact,sans-serif;font-weight:400;line-height:1}
.cd-ransom span,.cd-welcome span,.cd-thx-r span{display:inline-block;padding:5px 6px 4px;font-size:calc(27px * var(--s));background:var(--b);color:var(--f);transform:rotate(var(--r));box-shadow:1px 2px 3px rgba(0,0,0,.2);clip-path:polygon(0 4%,8% 0,92% 3%,100% 0,98% 50%,100% 96%,90% 100%,6% 97%,0 100%,2% 50%)}
.cd-ransom .w,.cd-welcome .w,.cd-thx-r .w{display:inline-flex;gap:2px;white-space:nowrap;font-weight:400}
.cd-thx-r{gap:12px!important}

/* ---------- bìa ---------- */
.cd-cover{position:relative}
.cd-top{position:relative;padding:34px 24px 34px;min-height:200px;background:radial-gradient(circle,rgba(0,0,0,.2) 1.1px,transparent 1.7px) 0 0/7px 7px,${NOISE},var(--accent);color:var(--accent-ink);overflow:hidden}
.cd-top::before{content:"";position:absolute;inset:0;background:linear-gradient(115deg,var(--accent) 35%,transparent 80%)}
.cd-lf{position:absolute;right:-6px;top:6px;width:104px;color:rgba(255,248,238,.55);transform-origin:50% 100%;animation:cdSway 6s ease-in-out infinite}
.cd-lf.b{right:auto;left:10px;top:auto;bottom:10px;width:70px;transform:scaleX(-1)}
@keyframes cdSway{50%{transform:rotate(-4deg)}}
.cd-wm{position:relative;margin:0;font-family:var(--font-script);font-size:40px;line-height:1;transform:rotate(-6deg);transform-origin:left;opacity:.92;white-space:nowrap}
.cd-names{position:relative;margin:18px 0 0 56px;font-family:var(--font-title);font-weight:400;font-size:30px;line-height:1.15;display:grid;justify-items:start}
.cd-names i{font-family:var(--font-script);font-size:30px;margin:0 0 0 30px;font-style:normal;color:#f7d9a6}
.cd-names span:last-child{margin-left:54px}
.cd-collage{position:relative;height:420px;overflow:hidden}
.cd-letter{position:absolute;right:-18px;top:26px;width:58%;height:250px;padding:18px 22px 18px 102px;background:repeating-linear-gradient(transparent 0 25px,rgba(120,80,50,.25) 25px 26px),${NOISE},#efe2c8;transform:rotate(5deg);box-shadow:0 3px 8px rgba(0,0,0,.18);font-family:var(--font-script);color:rgba(80,50,30,.65)}
.cd-letter b{display:block;font-size:24px;font-weight:500;transform:rotate(-4deg)}
.cd-letter span{display:block;height:2px;margin:22px 0 0;background:linear-gradient(90deg,rgba(80,50,30,.35),rgba(80,50,30,.1));width:calc(70% + var(--w,0px));border-radius:2px}
.cd-letter span:nth-of-type(2n){width:88%}.cd-letter span:nth-of-type(3n){width:56%}
.cd-ruler{position:absolute;left:0;top:30px;width:22px;height:330px;background:repeating-linear-gradient(180deg,rgba(60,40,20,.55) 0 1px,transparent 1px 10px) right/9px 100% no-repeat,repeating-linear-gradient(180deg,rgba(60,40,20,.55) 0 1px,transparent 1px 50px) right/16px 100% no-repeat,#e9dcc4;box-shadow:1px 0 3px rgba(0,0,0,.15)}
.cd-cut{position:absolute;left:34px;top:22px;width:62%;margin:0;padding:9px;background:#fff;box-shadow:0 8px 18px rgba(40,20,10,.3);transform:rotate(-3deg);animation:cdFloat 7s ease-in-out infinite}
.cd-cut img{width:100%;aspect-ratio:3/4;object-fit:cover;object-position:50% 25%}
.cd-cut .t1{left:-24px;top:8px;transform:rotate(-38deg)}
.cd-cut .t2{right:-26px;bottom:20px;transform:rotate(-40deg)}
@keyframes cdFloat{50%{transform:rotate(-2deg) translateY(-4px)}}
.cd-note{position:absolute;z-index:5;right:14px;bottom:40px;margin:0;padding:8px 18px 6px;background:var(--accent);color:var(--accent-ink);transform:rotate(-6deg);box-shadow:0 4px 10px rgba(0,0,0,.25);font-family:'Patrick Hand',cursive;line-height:1.1;text-align:center;clip-path:polygon(0 6%,100% 0,98% 50%,100% 100%,2% 94%,0 50%)}
.cd-note span{display:block;font-size:26px;letter-spacing:.04em}
.cd-note small{font-size:15px;opacity:.9}
.cd-cstamp{position:absolute;right:24px;top:196px;width:70px;color:rgba(164,38,44,.55);color:color-mix(in srgb,var(--accent) 55%,transparent);transform:rotate(14deg)}

/* ---------- lời ngỏ viết tay ---------- */
.cd-letterbox{padding-top:52px!important;padding-bottom:52px!important;text-align:left}
.cd-hand p{margin:0 0 18px;font-family:'Patrick Hand',cursive;font-size:24px;line-height:1.25;display:table;padding:0 6px 2px;border-bottom:2px solid currentColor;transform:rotate(-2deg)}
.cd-hand p:nth-child(2){margin-left:36px}.cd-hand p:nth-child(3){margin-left:12px}.cd-hand p:nth-child(4){margin-left:auto;margin-right:0;font-size:22px}
.cd-hand p.reveal{transition-delay:calc(var(--i) * .15s)}
.cd-msg{margin:26px 0 0;font-style:italic;font-size:15px;opacity:.9;text-align:center}
.cd-sign{margin:14px 0 0;text-align:right;font-family:var(--font-script);font-size:24px}

/* ---------- về chúng mình ---------- */
.cd-couple{padding-top:56px!important}
.cd-arrow{width:54px;color:var(--accent);margin:-4px 0 0 60%}
.cd-pp{display:grid;grid-template-columns:44% 1fr;gap:16px;align-items:center;margin:14px 0 26px;text-align:left}
.cd-pp.r{grid-template-columns:1fr 44%}
.cd-pp.r .cd-pp-ph{order:2}
.cd-pp.r .cd-pp-tx{text-align:right}
.cd-pp-ph{position:relative;padding:6px;background:#fff;border-radius:46% 54% 40% 60%/52% 44% 56% 48%;box-shadow:0 0 0 4px var(--accent),0 10px 18px rgba(0,0,0,.2);transform:rotate(-3deg)}
.cd-pp.r .cd-pp-ph{transform:rotate(3deg);border-radius:56% 44% 58% 42%/46% 56% 44% 54%}
.cd-pp-ph img{width:100%;aspect-ratio:4/5;object-fit:cover;object-position:50% 20%;border-radius:inherit}
.cd-pp-tx p{margin:0}
.cd-pp-role{font-family:'Patrick Hand',cursive;font-size:18px;color:var(--accent)}
.cd-pp-name{font-family:var(--font-title);font-size:21px;line-height:1.25;margin:2px 0 8px!important}
.cd-pp-fam{font-size:13px;line-height:1.55;color:var(--ink)}
.cd-pp-addr{margin-top:6px!important;font-size:12px;font-style:italic;color:var(--muted)}

/* ---------- lời mời ---------- */
.cd-inv{padding-top:20px!important}
.cd-sheet{position:relative;padding:40px 22px 36px;background:repeating-linear-gradient(transparent 0 31px,rgba(164,38,44,.08) 31px 32px),${NOISE},var(--paper);filter:drop-shadow(0 4px 6px rgba(0,0,0,.15));transform:rotate(-1deg)}
.cd-inv .t3{top:6px;left:50%;margin-left:-42px;transform:rotate(-4deg)}
.cd-inv-lead{margin:0;font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
.cd-inv-guest{margin:8px 0;font-family:'Patrick Hand',cursive;font-size:32px;line-height:1.2;color:var(--accent);transform:rotate(-2deg)}
.cd-inv-to{margin:0 0 18px;font-size:14px;color:var(--muted)}
.cd-inv-n{margin:0;font-family:var(--font-title);font-size:24px;line-height:1.3}
.cd-inv-amp{margin:0;font-family:var(--font-script);font-size:30px;line-height:1.1;color:var(--accent)}

/* ---------- câu chuyện ---------- */
.cd-poem p{max-width:330px;margin:0 auto 6px;font-family:'Patrick Hand',cursive;font-size:20px;line-height:1.5;color:var(--accent)}
.cd-frame{position:relative;margin:34px 6px 10px;padding:12px;background:color-mix(in srgb,var(--accent) 88%,#000);box-shadow:0 10px 22px rgba(0,0,0,.25);transform:rotate(1.5deg)}
.cd-frame img{width:100%;aspect-ratio:4/3;object-fit:cover;object-position:50% 30%;outline:3px solid #f6e3c8;outline-offset:-10px}
.cd-clip{position:absolute;width:24px;top:-34px;left:40px;transform:rotate(-8deg)}
.cd-scrap{position:absolute;right:-8px;top:-30px;width:86px;height:66px;background:repeating-linear-gradient(transparent 0 9px,rgba(0,0,0,.12) 9px 10px),#f3ead9;transform:rotate(10deg);box-shadow:0 2px 6px rgba(0,0,0,.2)}
.cd-scrap .cd-pin{position:absolute;left:24px;top:-10px;width:34px}
.cd-welcome{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:2px;margin:36px 0 0;font-family:Anton,Impact,sans-serif;line-height:1}
.cd-welcome span{font-size:calc(26px * var(--s))}
.cd-welcome em{flex-basis:100%;margin:4px 0;font-family:var(--font-script);font-size:26px;color:var(--accent)}

/* ---------- lịch ---------- */
.cd-cal .cd-hsub{margin-top:6px;font-size:16px}
.cd-pad{position:relative;width:min(330px,94%);margin:10px auto 0}
.cd-pad::before,.cd-pad::after{content:"";position:absolute;inset:0;background:${NOISE},#efe5d2;box-shadow:0 3px 8px rgba(0,0,0,.15)}
.cd-pad::before{transform:rotate(-6deg) translate(-6px,8px)}
.cd-pad::after{transform:rotate(4deg) translate(10px,12px)}
.cd-pad-s{position:relative;z-index:1;padding:22px 14px 18px 30px;background:radial-gradient(circle at 12px 50%,var(--cd-kraft) 4px,rgba(0,0,0,.25) 4.5px,transparent 5px) 0 0/24px 26px repeat-y,${NOISE},#f7f0e2;box-shadow:0 4px 10px rgba(0,0,0,.18);transform:rotate(-1deg)}
.tpl-catdan .s-cal,.cd-cal{--cal-hi:var(--accent)}
.cd-cal .cal-grid{font-family:'Patrick Hand',cursive;font-size:18px}
.cd-cal-h{margin:0 0 8px;font-family:Anton,Impact,sans-serif;font-size:24px;letter-spacing:.06em;color:var(--accent);text-transform:uppercase}
.cd-cal-h em{font-family:'Patrick Hand',cursive;font-style:normal;font-size:20px;color:var(--ink);margin-left:6px}
.cd-cal .cal-on{--cal-on:#fff}
.cd-swirl{display:block;width:44px;margin:16px 30px 0 auto;color:var(--accent)}
.cd-cd{display:flex;justify-content:center;gap:10px;margin-top:16px}
.cd-cd span{display:grid;width:62px;padding:8px 0 6px;border-radius:8px;background:var(--accent);color:var(--accent-ink);box-shadow:0 4px 0 color-mix(in srgb,var(--accent) 65%,#000)}
.cd-cd b{font-family:Anton,Impact,sans-serif;font-weight:400;font-size:26px;line-height:1.1;font-variant-numeric:tabular-nums}
.cd-cd small{font-size:12px;opacity:.85}

/* ---------- vé sự kiện ---------- */
.cd-ev{padding-top:40px!important;padding-bottom:40px!important}
.cd-tk{position:relative;display:grid;grid-template-columns:86px 1fr;margin:0 0 22px;text-align:left;background:${NOISE},#fff9ee;border:1px solid var(--line);transform:rotate(var(--r));box-shadow:0 6px 14px rgba(60,30,10,.12);-webkit-mask:radial-gradient(circle at 86px 0,transparent 9px,#000 9.5px) top/100% 51% no-repeat,radial-gradient(circle at 86px 100%,transparent 9px,#000 9.5px) bottom/100% 51% no-repeat;mask:radial-gradient(circle at 86px 0,transparent 9px,#000 9.5px) top/100% 51% no-repeat,radial-gradient(circle at 86px 100%,transparent 9px,#000 9.5px) bottom/100% 51% no-repeat}
.cd-tk .t4{display:none}
.cd-tk-l{display:grid;align-content:center;justify-items:center;padding:14px 4px;background:var(--accent);color:var(--accent-ink);border-right:2px dashed var(--paper)}
.cd-tk-l b{font-family:Anton,Impact,sans-serif;font-weight:400;font-size:26px;line-height:1}
.cd-tk-l span{font-family:'Patrick Hand',cursive;font-size:16px;opacity:.85}
.cd-tk-r{padding:14px 16px 14px 18px;min-width:0}
.cd-tk-r h3{margin:0 0 4px;font-family:var(--font-title);font-weight:600;font-size:19px;line-height:1.25;color:var(--accent)}
.cd-tk-r p{margin:0}
.cd-tk-d{font-size:13px;color:var(--muted)}
.cd-tk-p{font-weight:600;font-size:15px}
.cd-tk-a{font-size:13px;color:var(--muted)}
.cd-tk-act{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:8px!important}
.cd-tk-act a,.cd-map summary{font-family:'Patrick Hand',cursive;font-size:17px;color:var(--accent);text-decoration:underline;text-underline-offset:3px;cursor:pointer;list-style:none}
.cd-map summary::-webkit-details-marker{display:none}
.cd-map .map{border-radius:4px}
.cd-lunar{margin:6px 0 0;font-style:italic;font-size:14px;color:var(--muted)}

/* ---------- album ---------- */
.cd-gal{padding-top:44px!important}
.cd-film{height:46px;margin:6px -40px 22px;transform:rotate(-4deg);background:linear-gradient(#1c1715 0 0) top/100% 9px no-repeat,linear-gradient(#1c1715 0 0) bottom/100% 9px no-repeat,repeating-linear-gradient(90deg,#1c1715 0 4px,transparent 4px 52px),repeating-linear-gradient(90deg,#1c1715 0 4px,#f3eadb 4px 9px,#1c1715 9px 13px) 0 2px/100% 5px no-repeat,repeating-linear-gradient(90deg,#1c1715 0 4px,#f3eadb 4px 9px,#1c1715 9px 13px) 0 calc(100% - 2px)/100% 5px no-repeat,linear-gradient(90deg,#8a3a34,#c79a6a,#5b3d2c,#b26c52,#7c5a44);box-shadow:0 3px 6px rgba(0,0,0,.3);opacity:.92}
.cd-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px 14px}
.cd-grid .ph{position:relative;display:block;width:100%;aspect-ratio:auto;padding:7px 7px 30px;border-radius:2px;background:#fffdf7;box-shadow:0 6px 14px rgba(40,20,10,.22);transform:rotate(var(--rr,-2deg));transition:transform .3s}
.cd-grid .ph:nth-child(even){--rr:2.5deg;margin-top:18px}
.cd-grid .ph:nth-child(3n+1){grid-column:auto;aspect-ratio:auto}
.cd-grid .ph:nth-child(5n+3){grid-column:span 2;margin:0 18px;--rr:-1deg}
.cd-grid .ph i{display:block;aspect-ratio:3/4;background:center 25%/cover no-repeat}
.cd-grid .ph:nth-child(5n+3) i{aspect-ratio:4/3}
.cd-grid .ph em{position:absolute;left:0;right:0;bottom:4px;font-family:'Patrick Hand',cursive;font-style:normal;font-size:16px;color:var(--accent)}
.cd-grid .ph .t5{top:-10px;left:50%;margin-left:-42px;transform:rotate(-3deg)}
.cd-pin{position:absolute;width:30px}
.cd-pin.s{top:-14px;left:50%;margin-left:-15px;z-index:4}
.cd-grid .ph:active{transform:rotate(0) scale(.98)}

/* ---------- biểu mẫu, quà, lưu bút ---------- */
.cd-formwrap{position:relative;padding:10px 0 0}
.tpl-catdan #rsvpForm{position:relative}
.cd-pin.f{top:-20px;right:18px;z-index:3;width:34px}
.tpl-catdan .s-rsvp,.tpl-catdan .s-gift,.tpl-catdan .s-wishes{padding-top:40px}
.tpl-catdan .s-rsvp .cd-h,.tpl-catdan .s-gift .cd-h,.tpl-catdan .s-wishes .cd-h{font-family:Anton,Impact,sans-serif;font-weight:400;letter-spacing:.04em;text-transform:uppercase;font-size:26px}
.tpl-catdan .form{border-radius:3px;border:0;background:repeating-linear-gradient(transparent 0 27px,rgba(80,50,30,.07) 27px 28px),${NOISE},var(--paper);box-shadow:0 8px 20px rgba(40,20,10,.18);transform:rotate(-.6deg)}
.tpl-catdan .form label{font-family:'Patrick Hand',cursive;font-size:17px;color:var(--ink)}
.tpl-catdan .form input:not([type=radio]),.tpl-catdan .form select,.tpl-catdan .form textarea,.tpl-catdan .choice label{border-radius:4px;background:#fffdf8}
.tpl-catdan .btn{border-radius:4px;font-family:'Patrick Hand',cursive;font-size:19px;font-weight:400;letter-spacing:.02em;box-shadow:0 3px 0 color-mix(in srgb,var(--accent) 60%,#000)}
.tpl-catdan .gift{position:relative;border-radius:3px;border:0;background:linear-gradient(160deg,transparent 0 50%,rgba(0,0,0,.04) 50%),${NOISE},#f3e6cd;box-shadow:0 6px 14px rgba(40,20,10,.18)}
.tpl-catdan .gift:nth-child(2){transform:rotate(1.2deg)}.tpl-catdan .gift:first-child{transform:rotate(-1.2deg)}
.tpl-catdan .gift-who{font-family:'Patrick Hand',cursive;font-size:22px}
.tpl-catdan .gift img{border-radius:2px;box-shadow:0 2px 6px rgba(0,0,0,.12)}
.tpl-catdan .wish{border-radius:2px;border:0;background:${NOISE},#fff6c9;box-shadow:0 3px 8px rgba(0,0,0,.12);font-family:'Patrick Hand',cursive}
.tpl-catdan .wish:nth-child(odd){transform:rotate(-.8deg)}.tpl-catdan .wish:nth-child(even){transform:rotate(.8deg);background:${NOISE},#fde3dc}
.tpl-catdan .wish p{font-size:17px}
.tpl-catdan .wish-list{padding:6px}

/* ---------- cảm ơn ---------- */
.cd-thanks{padding:46px 22px 70px!important;overflow:hidden}
.cd-thx-r{display:flex;justify-content:center;gap:2px;font-family:Anton,Impact,sans-serif;line-height:1}
.cd-thx-r span{font-size:calc(40px * var(--s))}
.cd-thx-l{margin:22px 0 4px;font-family:'Patrick Hand',cursive;font-size:24px}
.cd-thx-n{margin:0;font-family:var(--font-script);font-size:32px}
.tpl-catdan .credit{background:var(--accent);color:var(--accent-ink);opacity:1}

/* ---------- màn mở thiệp: phong bì kraft dán băng keo ---------- */
.cd-opener{background:radial-gradient(circle,rgba(0,0,0,.18) 1.1px,transparent 1.6px) 0 0/7px 7px,${NOISE},var(--accent);perspective:900px}
.cd-env{position:relative;width:min(340px,88vw);aspect-ratio:3/2.15;padding:118px 24px 16px;background:${NOISE},var(--cd-kraft);box-shadow:0 18px 40px rgba(0,0,0,.4);text-align:left;transition:transform 1s ease,opacity 1s}
.cd-env-flap{position:absolute;left:0;right:0;top:0;height:58%;background:${NOISE},color-mix(in srgb,var(--cd-kraft) 85%,#5a3a1a);clip-path:polygon(0 0,100% 0,50% 100%);transform-origin:top;transition:transform .8s ease .35s;z-index:2;filter:drop-shadow(0 2px 2px rgba(0,0,0,.2))}
.cd-env-mark{position:absolute;right:62px;top:18px;width:64px;color:rgba(80,40,20,.45);transform:rotate(-12deg);z-index:3}
.cd-env-stampbox{position:absolute;right:16px;top:14px;z-index:3;width:50px;height:60px;display:grid;place-items:center;background:var(--accent);color:var(--accent-ink);font-family:var(--font-script);font-size:20px;outline:3px dotted var(--cd-kraft);outline-offset:-3px;box-shadow:0 2px 4px rgba(0,0,0,.25)}
.cd-env-k{position:relative;z-index:3;margin:0;font-family:'Patrick Hand',cursive;font-size:16px;color:var(--muted)}
.cd-env-to{position:relative;z-index:3;margin:0 0 6px;padding-bottom:2px;border-bottom:1px solid rgba(80,50,30,.4);font-family:'Patrick Hand',cursive;font-size:26px;line-height:1.2;color:var(--accent)}
.cd-env-from{position:relative;z-index:3;margin:0;font-family:var(--font-script);font-size:20px;color:var(--ink)}
.cd-env-tape{position:absolute;z-index:4;left:50%;top:29%;width:120%;padding:10px 0;border:0;background:var(--cd-tape);color:var(--accent);font-family:'Patrick Hand',cursive;font-size:18px;letter-spacing:.04em;transform:translate(-50%,-50%) rotate(-8deg);box-shadow:0 2px 5px rgba(0,0,0,.2);clip-path:polygon(0 0,100% 6%,99% 30%,100% 55%,99% 80%,100% 100%,0 94%,1% 70%,0 45%,1% 20%);animation:cdPulse 2.4s ease-in-out infinite;transition:transform .5s ease,opacity .5s}
@keyframes cdPulse{50%{transform:translate(-50%,-50%) rotate(-8deg) scale(1.03)}}
.cd-env-hint{position:absolute;bottom:40px;left:0;right:0;text-align:center;margin:0;color:var(--accent-ink);font-family:'Patrick Hand',cursive;font-size:18px;opacity:.85}
.cd-opener.opening .cd-env-tape{animation:none;transform:translate(10%,-260%) rotate(-24deg);opacity:0}
.cd-opener.opening .cd-env-flap{transform:rotateX(180deg)}
.cd-opener.opening .cd-env{transform:translateY(40px) scale(.96);transition-delay:.6s}

@media (prefers-reduced-motion:reduce){.cd-lf,.cd-cut,.cd-env-tape{animation:none}}
@media (min-width:768px){.tpl-catdan .card{margin:24px auto;min-height:0}}
`,
};
