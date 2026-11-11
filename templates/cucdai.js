// Mẫu "Cúc Dại" — dịu dàng kiểu Hàn: xanh rêu + cúc dại trắng nhuỵ vàng (SVG tự vẽ), phong bì túi đựng ảnh,
// lịch tháng khoanh ngày cưới bằng một bông cúc. Màn mở: ảnh xoè ra khỏi túi, cúc bung bay.
const { esc } = require('../lib/util');

const P = (n) => `/demo/hoamoc-${n}.webp`;
const base = {
  '--font-title': "'Cormorant Garamond',Georgia,serif",
  '--font-script': "'Alex Brush',cursive",
  '--font-body': "'Be Vietnam Pro',system-ui,sans-serif",
};

const evList = (d) => d.events.filter((e) => e.name || e.place);
const lunarOf = (s) => s.replace(/^Nhằm /i, 'Tức ');

// một bông cúc: 16 cánh trắng + nhuỵ vàng
function daisy(cx, cy, r, rot = 0) {
  let p = '';
  for (let i = 0; i < 16; i++) p += `<ellipse cx="0" cy="${(-r * 0.56).toFixed(1)}" rx="${(r * 0.15).toFixed(1)}" ry="${(r * 0.44).toFixed(1)}" transform="rotate(${(i * 22.5).toFixed(1)})"/>`;
  return `<g transform="translate(${cx} ${cy}) rotate(${rot})"><g fill="var(--cd-petal)" stroke="var(--cd-petal-line)" stroke-width=".7">${p}</g><circle r="${(r * 0.26).toFixed(1)}" fill="var(--cd-core)" stroke="var(--cd-core-dk)" stroke-width="1"/><circle r="${(r * 0.12).toFixed(1)}" cx="${(-r * 0.06).toFixed(1)}" cy="${(-r * 0.06).toFixed(1)}" fill="rgba(255,255,255,.35)"/></g>`;
}
const leaf = (x, y, rot, s = 1) => `<path transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" d="M0 0C6-8 6-20 0-30C-6-20-6-8 0 0z" fill="var(--cd-leaf)"/>`;
// bó cúc nhỏ: cuống chụm về một điểm, có nơ
function bouquet(cls) {
  const heads = [[60, 34, 17, 10], [96, 24, 15, -14], [34, 64, 15, 20], [82, 58, 18, 4], [118, 52, 13, -8], [56, 92, 13, 30], [104, 88, 12, 0], [22, 30, 10, 0]];
  const stems = heads.map(([x, y]) => `<path d="M${x} ${y}Q${(x + 80) / 2} ${(y + 150) / 2 + 10} 80 168" />`).join('');
  return `<svg class="${cls}" viewBox="0 0 150 210" aria-hidden="true"><g fill="none" stroke="var(--cd-leaf)" stroke-width="1.6">${stems}<path d="M80 168l-2 38M80 168l6 36M80 168l-8 34"/></g>${leaf(40, 120, -40)}${leaf(118, 112, 38)}${leaf(70, 140, -12, .8)}${leaf(26, 92, -60, .7)}<circle cx="132" cy="30" r="3.4" fill="var(--cd-core)"/><circle cx="12" cy="56" r="3" fill="var(--cd-core)"/>${heads.map(([x, y, r, a]) => daisy(x, y, r, a)).join('')}<path d="M70 168q10-8 20 0q-4 8-10 3q-6 5-10-3zM80 170l-10 16M80 170l9 15" fill="var(--cd-ribbon)" stroke="var(--cd-ribbon)" stroke-width="2" stroke-linejoin="round"/></svg>`;
}
const daisyIcon = (cls, r = 20) => `<svg class="${cls}" viewBox="0 0 ${r * 2 + 4} ${r * 2 + 4}" aria-hidden="true">${daisy(r + 2, r + 2, r)}</svg>`;
const daisyBg = (petal, line, core) => {
  let p = '';
  for (let i = 0; i < 14; i++) p += `<ellipse cx='20' cy='9' rx='3' ry='8.4' transform='rotate(${(i * 360 / 14).toFixed(1)} 20 20)'/>`;
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><g fill='${petal}' stroke='${line}' stroke-width='.6'>${p}</g><circle cx='20' cy='20' r='8.6' fill='${core}'/></svg>`)}")`;
};

// dấu sáp chữ lồng
const SEAL_D = (() => {
  let d = '';
  for (let i = 0; i <= 72; i++) {
    const t = (i / 72) * 2 * Math.PI;
    const r = 46 + 2.4 * Math.sin(t * 8 + 0.3) + 1.5 * Math.sin(t * 15);
    d += (i ? 'L' : 'M') + (50 + r * Math.cos(t)).toFixed(1) + ' ' + (50 + r * Math.sin(t)).toFixed(1);
  }
  return d + 'Z';
})();
const seal = (cls, ini) => `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="cdSealG" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="var(--cd-seal-hi)"/><stop offset=".6" stop-color="var(--cd-seal)"/><stop offset="1" stop-color="var(--cd-seal-dk)"/></radialGradient></defs><path d="${SEAL_D}" fill="url(#cdSealG)"/><circle cx="50" cy="50" r="31" fill="none" stroke="var(--cd-seal-dk)" stroke-width="2.5" opacity=".5"/><text x="50" y="60" text-anchor="middle" font-family="'Alex Brush',cursive" font-size="30" fill="var(--cd-seal-dk)" opacity=".85">${esc(ini)}</text></svg>`;

const ph = (ctx, i, cls = '') => {
  const l = ctx.d.photos;
  if (!l.length) return '';
  const k = i % l.length;
  return `<button class="ph ${cls}" data-i="${k}" style="background-image:url('${esc(l[k])}')" aria-label="Xem ảnh ${k + 1}"></button>`;
};

// lấy cụm hoa trang trí rải quanh màn mở (vị trí cố định)
const FLY = [[8, 12, 22, 0], [86, 8, 18, 1], [92, 38, 14, 2], [4, 46, 16, 3], [12, 80, 20, 1], [84, 76, 24, 0], [50, 4, 12, 2], [62, 92, 14, 3]];

module.exports = {
  id: 'cucdai',
  name: 'Cúc Dại',
  group: 'hoa',
  badge: 'Mới',
  desc: 'Dịu dàng kiểu Hàn: xanh rêu, cúc dại trắng, phong bì túi ảnh và lịch khoanh hoa',
  fonts: 'https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cormorant+Garamond:wght@400;500;600&family=Be+Vietnam+Pro:wght@300;400;500&display=swap',
  palettes: [
    { id: 'xanh-reu', name: 'Xanh rêu', swatch: ['#f4f4ef', '#3f5b37'], vars: { ...base, '--page': '#e6e9e1', '--bg': '#f4f4ef', '--paper': '#fbfbf7', '--ink': '#2f3a2b', '--muted': '#6b7465', '--accent': '#3f5b37', '--accent-ink': '#f3f3ea', '--gold': '#e3b52c', '--line': '#d6dbcf', '--cd-panel': '#425e3a', '--cd-panel-dk': '#30472b', '--cd-petal': '#ffffff', '--cd-petal-line': '#d5dacb', '--cd-core': '#f2c230', '--cd-core-dk': '#cf9a12', '--cd-leaf': '#6f8f58', '--cd-ribbon': '#e8e2cf', '--cd-seal': '#8a9b86', '--cd-seal-hi': '#c6d1c2', '--cd-seal-dk': '#4a5a48', '--cd-ring': '#b33a2e' } },
    { id: 'vang-cuc', name: 'Vàng cúc', swatch: ['#fbf6e6', '#a7842c'], vars: { ...base, '--page': '#efe8d3', '--bg': '#fbf7ea', '--paper': '#fffdf5', '--ink': '#4a3d1e', '--muted': '#7d7052', '--accent': '#8e6d1f', '--accent-ink': '#fffaf0', '--gold': '#e2a91a', '--line': '#ebdfbf', '--cd-panel': '#a8862f', '--cd-panel-dk': '#8a6b1f', '--cd-petal': '#ffffff', '--cd-petal-line': '#eadcb8', '--cd-core': '#f6c437', '--cd-core-dk': '#c98f0f', '--cd-leaf': '#8a9a55', '--cd-ribbon': '#f3e3b4', '--cd-seal': '#c49a52', '--cd-seal-hi': '#ecd29a', '--cd-seal-dk': '#7a5a1e', '--cd-ring': '#b5442c' } },
  ],
  demo: {
    cover: P(7),
    photos: [2, 3, 4, 6, 1, 5, 8, 7].map(P),
    story: 'Chúng mình gặp nhau vào một mùa cúc dại nở trắng ven đường. Từ những lần hẹn vội, những tin nhắn chúc ngủ ngon, đến hôm nay — chúng mình quyết định cùng nhau đi tiếp quãng đời còn lại.',
  },
  layout: ['calendar', 'invite', 'events', 'story', 'gallery', 'rsvp', 'gift', 'wishes', 'thanks'],

  title(text, sub) {
    return `<h2 class="cd-h">${esc(text)}</h2>${sub ? `<p class="sec-sub">${esc(sub)}</p>` : ''}`;
  },

  opener(ctx) {
    const l = ctx.d.photos.length ? ctx.d.photos : [ctx.d.cover].filter(Boolean);
    const pic = (i) => (l.length ? `<div class="cd-op-ph i${i}"><img src="${esc(l[i % l.length])}" alt=""></div>` : '');
    return `
<div class="opener cd-op" id="opener" data-open-ms="1800">
  ${FLY.map(([x, y, s, k]) => `<span class="cd-fly k${k}" style="left:${x}%;top:${y}%;width:${s}px">${daisyIcon('', 20)}</span>`).join('')}
  <div class="cd-op-in">
    <p class="cd-otop">Thiệp mời cưới</p>
    <p class="cd-onames">${esc(ctx.g)} <i>&amp;</i> ${esc(ctx.b)}</p>
    <div class="cd-oenv">
      <div class="cd-back"></div>
      ${pic(0)}${pic(1)}${pic(2)}
      <div class="cd-pocket"></div>
      ${seal('cd-seal', ctx.initials)}
      ${bouquet('cd-bq')}
    </div>
    ${ctx.guest ? `<p class="cd-oto">Gửi đến <b>${esc(ctx.guest.name)}</b></p>` : ''}
    <button class="cd-obtn" id="openBtn" type="button">${daisyIcon('', 20)}<span>Mở thiệp</span></button>
  </div>
</div>`;
  },

  cover(ctx) {
    const l = ctx.d.photos;
    const a = ctx.d.cover || l[0] || '';
    const b = l[1] || l[0] || '';
    return `
<header class="cd-cover">
  <p class="cd-wgm">We got married</p>
  <div class="cd-env">
    <div class="cd-flap"></div>
    <div class="cd-back"></div>
    ${b ? `<div class="cd-p p2"><img src="${esc(b)}" alt=""></div>` : ''}
    ${a ? `<div class="cd-p p1"><img src="${esc(a)}" alt="Ảnh cưới"></div>` : ''}
    <div class="cd-pocket"></div>
    ${seal('cd-seal', ctx.initials)}
    ${bouquet('cd-bq')}
    <svg class="cd-cl" viewBox="0 0 90 70" aria-hidden="true">${daisy(28, 36, 22, 10)}${daisy(64, 28, 18, -12)}${daisy(58, 58, 11, 0)}</svg>
  </div>
  <h1 class="cd-names">${esc(ctx.g)} <i>&amp;</i> ${esc(ctx.b)}</h1>
  ${ctx.dparts ? `<p class="cd-date">${ctx.dparts.d}.${ctx.dparts.m}.${ctx.dparts.y}</p>` : ''}
</header>`;
  },

  sections: {
    // khối xanh: ảnh polaroid + lịch tháng, ngày cưới nằm giữa một bông cúc; đếm ngược ở chân khối
    calendar(ctx, opts, h) {
      const { d, dparts: p } = ctx;
      if (!p || (!d.show.calendar && !d.show.countdown)) return '';
      const u = (k, l) => `<span><b data-cd="${k}">0</b>${l}</span>`;
      return `
  <section class="cd-calp reveal">
    <div class="cd-panel">
      ${d.show.calendar ? `<div class="cd-calrow">
        <div class="cd-pol">${ph(ctx, 0)}<span>${p.d}.${p.m}.${p.y}</span></div>
        ${h.calGrid(ctx, `<p class="cd-calh">Tháng ${+p.m}.${p.y}</p>`)}
      </div>` : ''}
      <p class="cd-al">${esc(ctx.weekday)} · âm lịch ${esc(ctx.lunarShort)}</p>
      ${d.show.countdown ? `<div class="cd-cd" role="timer"><em>Còn</em>${u('d', 'ngày')}${u('h', 'giờ')}${u('m', 'phút')}${u('s', 'giây')}</div>` : ''}
    </div>
  </section>`;
    },

    // lời mời + tên hai bạn + hai ảnh kẹp dải xanh chữ dọc + hai nhà
    invite(ctx) {
      const { d } = ctx;
      const fam = (x, label) => `<div class="cd-fam"><h3>${label}</h3>${x.father ? `<p>${esc(x.father)}</p>` : ''}${x.mother ? `<p>${esc(x.mother)}</p>` : ''}${x.address ? `<p class="a">${esc(x.address)}</p>` : ''}</div>`;
      const hasFam = d.groom.father || d.groom.mother || d.bride.father || d.bride.mother;
      return `
  <section class="sec cd-inv">
    <div class="reveal">
      <p class="cd-k">${esc(d.inviteText)}</p>
      <p class="cd-guest">${ctx.guest ? esc(ctx.guest.name) : 'Quý khách'}</p>
      <p class="cd-k">Tham dự tiệc mừng lễ cưới của</p>
    </div>
    <div class="cd-pair reveal">
      <p class="g">${esc(d.groom.fullName || d.groom.name)}</p>
      ${daisyIcon('cd-amp', 20)}
      <p class="b">${esc(d.bride.fullName || d.bride.name)}</p>
    </div>
    ${d.photos.length ? `<div class="cd-duo reveal">${ph(ctx, 1)}<div class="cd-strip"><span>Em là bình yên anh muốn giữ</span><svg viewBox="0 0 24 22" aria-hidden="true"><path d="M12 21S1 14 1 7a5.5 5.5 0 0111-2 5.5 5.5 0 0111 2c0 7-11 14-11 14z" fill="var(--cd-ring)"/></svg><span>Anh là hạnh phúc em muốn trao</span></div>${ph(ctx, 2)}</div>` : ''}
    ${hasFam ? `<div class="cd-fams reveal">${fam(d.groom, 'Nhà trai')}${fam(d.bride, 'Nhà gái')}</div>` : ''}
    ${d.message ? `<p class="cd-msg reveal">${esc(d.message)}</p>` : ''}
  </section>`;
    },

    // mỗi sự kiện một khối xanh: giờ · thứ, ngày, âm lịch, nơi, nút chỉ đường
    events(ctx, opts, h) {
      const evs = evList(ctx.d);
      if (!evs.length) return '';
      return `
  <section class="sec cd-evs">
    ${evs.map((e, i) => {
      const date = e.date || ctx.date;
      const p = h.parts(date);
      const dir = e.mapUrl || (e.address ? h.mapSearch(e.address) : '');
      return `<div class="cd-panel cd-ev reveal">
      <svg class="cd-evfl ${i % 2 ? 'r' : 'l'}" viewBox="0 0 90 70" aria-hidden="true">${daisy(28, 36, 20, 10)}${daisy(62, 26, 15, -12)}${daisy(58, 56, 10, 0)}</svg>
      <h3>Tham dự ${esc(e.name || 'tiệc cưới')}</h3>
      <p class="cd-vl">Vào lúc</p>
      <p class="cd-tw">${esc(h.clock(e.time).replace(':', ' : '))}${p ? ` · ${esc(h.weekday(date))}` : ''}</p>
      ${p ? `<p class="cd-dd">${p.d} . ${p.m} . ${p.y}</p><p class="cd-lu">${esc(lunarOf(h.lunarText(date)))}</p>` : ''}
      ${e.place ? `<p class="cd-pl">${esc(e.place)}</p>` : ''}
      ${e.address ? `<p class="cd-ad">${esc(e.address)}</p>` : ''}
      <p class="cd-acts">${dir ? `<a class="cd-pill" target="_blank" rel="noopener" href="${esc(dir)}">Xem chỉ đường</a>` : ''}${p ? `<a class="cd-lnk" target="_blank" rel="noopener" href="${esc(h.calendarLink(`${e.name} — Đám cưới ${ctx.g} & ${ctx.b}`, date, e.time, e.address || e.place))}">Lưu vào lịch</a>` : ''}</p>
    </div>`;
    }).join('')}
  </section>`;
    },

    story(ctx) {
      if (!ctx.d.story) return '';
      return `
  <section class="sec cd-story reveal">
    <h2 class="cd-h">Chuyện của chúng mình</h2>
    <p class="cd-div" aria-hidden="true"><i></i>${daisyIcon('', 20)}<i></i></p>
    ${ctx.d.story.split(/\n+/).map((t) => `<p>${esc(t)}</p>`).join('')}
  </section>`;
    },

    // album 3 cột: ba ảnh đứng, một ảnh ngang tràn hàng
    gallery(ctx) {
      const l = ctx.d.photos;
      if (!ctx.d.show.gallery || !l.length) return '';
      return `
  <section class="sec cd-gal">
    <h2 class="cd-h">Album cưới</h2>
    <div class="cd-grid">
      ${l.map((u, i) => `<button class="ph reveal" data-i="${i}" style="background-image:url('${esc(u)}')" aria-label="Xem ảnh ${i + 1}"></button>`).join('')}
    </div>
  </section>`;
    },

    // khối xanh có lời nhắn, thẻ xác nhận trắng đè lên
    rsvp(ctx, opts, h) {
      if (!ctx.d.show.rsvp) return '';
      const form = h.rsvp(ctx).replace(/<h2[\s\S]*?<\/p>/, '');
      return form.replace('<section class="sec s-rsvp reveal" id="rsvp">', `<section class="sec s-rsvp cd-rsvp reveal" id="rsvp"><div class="cd-panel cd-rhead"><h2>Xác nhận tham dự</h2><p>Bạn vui lòng xác nhận để chúng mình đón tiếp và chuẩn bị được chu đáo hơn. Trân trọng!</p></div>`);
    },

    gift(ctx, opts, h) {
      const html = h.gift(ctx);
      if (!html) return '';
      const box = '<svg viewBox="0 0 80 72" aria-hidden="true"><rect x="10" y="30" width="60" height="38" rx="4" fill="#f6e3cf" stroke="#c98a5a" stroke-width="2"/><rect x="6" y="20" width="68" height="12" rx="3" fill="#f3d2b6" stroke="#c98a5a" stroke-width="2"/><path d="M40 20v48" stroke="var(--cd-ring)" stroke-width="5"/><path d="M40 20c-6-14-24-14-18-2 3 5 18 2 18 2zM40 20c6-14 24-14 18-2-3 5-18 2-18 2z" fill="#fff" stroke="var(--cd-ring)" stroke-width="2.5"/></svg>';
      return html.replace(/<h2 class="cd-h">[^<]*<\/h2>/, `<div class="cd-panel cd-gbtn">${box}<h2>Gửi quà mừng</h2></div>`);
    },

    thanks(ctx) {
      const l = ctx.d.photos;
      const photo = l[l.length - 1] || ctx.d.cover || '';
      return `
  <section class="cd-thx"${photo ? ` style="background-image:url('${esc(photo)}')"` : ''}>
    <div class="cd-thx-in reveal">
      ${daisyIcon('cd-thx-fl', 20)}
      <h2>Lời cảm ơn</h2>
      <p>Trân trọng cảm ơn quý khách đã dành thời gian đến chung vui và chúc phúc cho chúng tôi. Sự hiện diện của quý vị là niềm hạnh phúc lớn của gia đình.</p>
      <p class="n">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
    </div>
  </section>`;
    },
  },

  css: `
.tpl-cucdai{background:var(--page)}
.tpl-cucdai .card,.tpl-cucdai .cd-op{font-variant-numeric:lining-nums}
.tpl-cucdai .card{background:var(--bg);color:var(--ink);font-weight:300;box-shadow:0 0 40px rgba(40,50,30,.12)}
.tpl-cucdai .sec{padding:50px 22px}
.tpl-cucdai .cd-h{margin:0 0 20px;font-family:var(--font-script);font-weight:400;font-size:46px;line-height:1.2;color:var(--accent)}
.tpl-cucdai .cd-h + .sec-sub{margin:-14px 0 24px}
.tpl-cucdai .cd-panel{position:relative;background:var(--cd-panel);color:var(--accent-ink);background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.025) 0 1px,transparent 1px 3px),repeating-linear-gradient(0deg,rgba(0,0,0,.035) 0 1px,transparent 1px 3px)}

/* ---- phong bì túi (dùng ở màn mở và bìa) ---- */
.tpl-cucdai .cd-back{position:absolute;left:0;right:0;bottom:0;background:var(--cd-panel-dk);border-radius:3px}
.tpl-cucdai .cd-pocket{position:absolute;left:0;right:0;bottom:0;z-index:3;background:var(--cd-panel);background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.04) 0 1px,transparent 1px 3px),repeating-linear-gradient(0deg,rgba(0,0,0,.05) 0 1px,transparent 1px 3px);clip-path:polygon(0 0,50% 32%,100% 0,100% 100%,0 100%);border-radius:0 0 3px 3px;filter:drop-shadow(0 -2px 3px rgba(0,0,0,.2))}
.tpl-cucdai .cd-pocket::after{content:"";position:absolute;inset:0;background:linear-gradient(160deg,rgba(255,255,255,.08),transparent 50%,rgba(0,0,0,.1))}
.tpl-cucdai .cd-seal{position:absolute;left:50%;z-index:4;width:22%;transform:translate(-50%,-50%);filter:drop-shadow(0 3px 3px rgba(0,0,0,.35))}
.tpl-cucdai .cd-bq{position:absolute;z-index:5;filter:drop-shadow(2px 4px 4px rgba(0,0,0,.2));transform-origin:50% 90%;animation:cdSway 6s ease-in-out infinite}
@keyframes cdSway{50%{rotate:4deg}}

/* ---- màn mở thiệp ---- */
.tpl-cucdai .cd-op{padding:20px;overflow:hidden;background:radial-gradient(ellipse at 50% 35%,var(--paper),var(--bg) 60%,var(--page))}
.tpl-cucdai .cd-fly{position:absolute;display:block;opacity:.85;animation:cdSpin 14s linear infinite}
.tpl-cucdai .cd-fly svg{display:block;width:100%}
.tpl-cucdai .cd-fly.k1{animation-duration:18s;animation-direction:reverse}
.tpl-cucdai .cd-fly.k2{animation-duration:11s}
.tpl-cucdai .cd-fly.k3{animation-duration:20s;animation-direction:reverse}
@keyframes cdSpin{to{rotate:360deg}}
.tpl-cucdai .cd-op-in{position:relative;display:flex;flex-direction:column;align-items:center;width:100%;max-width:400px;text-align:center}
.tpl-cucdai .cd-otop{margin:0;font-family:var(--font-title);font-weight:500;font-size:15px;letter-spacing:.3em;text-transform:uppercase;color:var(--muted)}
.tpl-cucdai .cd-onames{margin:4px 0 14px;font-family:var(--font-script);font-size:40px;line-height:1.25;color:var(--accent)}
.tpl-cucdai .cd-onames i{font-style:normal;font-size:.7em;color:var(--gold)}
.tpl-cucdai .cd-oenv{position:relative;width:min(250px,64vw);aspect-ratio:5/6;margin:6px 0 0}
.tpl-cucdai .cd-oenv .cd-back{top:22%}
.tpl-cucdai .cd-oenv .cd-pocket{top:46%}
.tpl-cucdai .cd-oenv .cd-seal{top:62%}
.tpl-cucdai .cd-op-ph{position:absolute;top:8%;z-index:2;width:46%;padding:5px 5px 16px;background:#fff;box-shadow:0 3px 8px rgba(0,0,0,.2);transition:transform 1s cubic-bezier(.3,1.3,.5,1),opacity .4s}
.tpl-cucdai .cd-op-ph img{width:100%;aspect-ratio:3/4;object-fit:cover}
.tpl-cucdai .cd-op-ph.i0{left:4%;transform:rotate(-8deg)}
.tpl-cucdai .cd-op-ph.i1{left:27%;top:3%;transform:rotate(1deg)}
.tpl-cucdai .cd-op-ph.i2{left:50%;transform:rotate(9deg)}
.tpl-cucdai .cd-oenv .cd-bq{left:-26%;top:20%;width:52%;rotate:-18deg}
.tpl-cucdai .cd-oto{margin:22px 0 0;font-size:14px;color:var(--muted)}
.tpl-cucdai .cd-oto b{display:block;font-family:var(--font-script);font-weight:400;font-size:34px;line-height:1.3;color:var(--accent)}
.tpl-cucdai .cd-obtn{display:inline-flex;align-items:center;gap:8px;margin-top:20px;padding:9px 24px 9px 12px;border:0;border-radius:999px;background:var(--cd-panel);color:var(--accent-ink);font-family:var(--font-title);font-size:19px;font-weight:600;letter-spacing:.06em;box-shadow:0 6px 16px rgba(0,0,0,.18);animation:cdPop 2.4s ease-in-out infinite}
.tpl-cucdai .cd-obtn svg{width:28px;animation:cdSpin 8s linear infinite}
@keyframes cdPop{50%{transform:scale(1.05)}}
.tpl-cucdai .cd-op.opening .cd-op-ph.i0{transform:translate(-62%,-62%) rotate(-20deg) scale(1.15)}
.tpl-cucdai .cd-op.opening .cd-op-ph.i1{transform:translate(0,-78%) rotate(0) scale(1.22);transition-delay:.08s}
.tpl-cucdai .cd-op.opening .cd-op-ph.i2{transform:translate(62%,-62%) rotate(20deg) scale(1.15);transition-delay:.16s}
.tpl-cucdai .cd-op.opening .cd-back,.tpl-cucdai .cd-op.opening .cd-pocket,.tpl-cucdai .cd-op.opening .cd-seal,.tpl-cucdai .cd-op.opening .cd-bq{transition:transform .8s .25s ease-in,opacity .8s .25s;transform:translateY(50%);opacity:0}
.tpl-cucdai .cd-op.opening .cd-seal{transform:translate(-50%,40%)}
.tpl-cucdai .cd-op.opening .cd-fly{transition:transform 1.4s ease-out,opacity 1.4s;transform:scale(2.4) translateY(-40px);opacity:0}
.tpl-cucdai .cd-op.opening .cd-obtn,.tpl-cucdai .cd-op.opening .cd-oto{transition:opacity .3s;opacity:0}

/* ---- bìa ---- */
.tpl-cucdai .cd-cover{position:relative;display:flex;flex-direction:column;align-items:center;padding:30px 20px 40px;text-align:center;overflow:hidden}
.tpl-cucdai .cd-wgm{align-self:flex-start;margin:0 0 0 6px;font-family:var(--font-script);font-size:40px;line-height:1.2;color:var(--accent)}
.tpl-cucdai .cd-env{position:relative;width:min(270px,70vw);aspect-ratio:4/5;margin:22px 0 0}
.tpl-cucdai .cd-env .cd-flap{position:absolute;left:0;right:0;top:4%;height:26%;background:var(--cd-panel-dk);clip-path:polygon(0 100%,50% 0,100% 100%);filter:brightness(1.12)}
.tpl-cucdai .cd-env .cd-back{top:30%}
.tpl-cucdai .cd-env .cd-pocket{top:54%}
.tpl-cucdai .cd-env .cd-seal{top:69%}
.tpl-cucdai .cd-p{position:absolute;z-index:2;width:56%;padding:6px 6px 20px;background:#fff;box-shadow:0 4px 12px rgba(0,0,0,.22)}
.tpl-cucdai .cd-p img{width:100%;aspect-ratio:3/4;object-fit:cover}
.tpl-cucdai .cd-p.p1{left:2%;top:4%;transform:rotate(-7deg);animation:cdBob 6s ease-in-out infinite}
.tpl-cucdai .cd-p.p2{right:0;top:0;transform:rotate(9deg);animation:cdBob 7s 1s ease-in-out infinite}
@keyframes cdBob{50%{translate:0 -8px}}
.tpl-cucdai .cd-env .cd-bq{left:-24%;top:24%;width:50%;rotate:-16deg}
.tpl-cucdai .cd-cl{position:absolute;right:-12%;bottom:-6%;z-index:5;width:34%;filter:drop-shadow(1px 3px 3px rgba(0,0,0,.2))}
.tpl-cucdai .cd-names{margin:30px 0 0;font-family:var(--font-script);font-weight:400;font-size:clamp(34px,10vw,44px);line-height:1.25;color:var(--accent)}
.tpl-cucdai .cd-names i{font-style:normal;font-size:.75em;color:var(--gold)}
.tpl-cucdai .cd-date{margin:6px 0 0;font-family:var(--font-title);font-weight:500;font-size:24px;letter-spacing:.18em;color:var(--ink)}

/* ---- lịch trong khối xanh ---- */
.tpl-cucdai .cd-calp{padding:4px 0 0}
.tpl-cucdai .cd-calp .cd-panel{padding:18px 14px 18px}
.tpl-cucdai .cd-calrow{display:grid;grid-template-columns:38% 1fr;gap:12px;align-items:center}
.tpl-cucdai .cd-pol{padding:6px 6px 4px;background:#fff;color:var(--ink);transform:rotate(-2deg);box-shadow:0 4px 12px rgba(0,0,0,.25)}
.tpl-cucdai .cd-pol .ph{display:block;width:100%;aspect-ratio:3/4.2;border-radius:0}
.tpl-cucdai .cd-pol span{display:block;padding-top:4px;font-family:var(--font-title);font-size:14px;letter-spacing:.14em;text-align:center}
.tpl-cucdai .cd-calh{margin:0 0 6px;font-family:var(--font-title);font-size:19px;text-align:right}
.tpl-cucdai .cd-calp .cal{width:100%}
.tpl-cucdai .cd-calp .cal-grid{row-gap:2px;font-size:12.5px}
.tpl-cucdai .cd-calp .cal-grid span{height:27px}
.tpl-cucdai .cd-calp .cal-grid .cal-w{height:20px;font-size:10px;opacity:.75}
.tpl-cucdai .cal-on{color:var(--ink)}
.tpl-cucdai .cal-on::before{-webkit-mask:none;mask:none;width:34px;height:34px;background:${daisyBg('#ffffff', '#d5dacb', '#f2c230')} center/contain no-repeat;animation:cdSpin 12s linear infinite}
.tpl-cucdai .cal-on b{margin-top:0;font-size:12px}
.tpl-cucdai .cd-al{margin:12px 0 0;text-align:center;font-size:12.5px;opacity:.8}
.tpl-cucdai .cd-cd{display:flex;justify-content:center;align-items:baseline;gap:12px;margin-top:10px;padding-top:12px;border-top:1px solid rgba(255,255,255,.2);font-size:12px;font-variant-numeric:tabular-nums}
.tpl-cucdai .cd-cd em{font-style:normal;letter-spacing:.14em;text-transform:uppercase;opacity:.7}
.tpl-cucdai .cd-cd b{margin-right:3px;font-family:var(--font-title);font-weight:500;font-size:24px}

/* ---- lời mời ---- */
.tpl-cucdai .cd-k{margin:0;font-family:var(--font-title);font-weight:500;font-size:18px;letter-spacing:.06em;text-transform:uppercase}
.tpl-cucdai .cd-guest{margin:4px 0 8px;font-family:var(--font-script);font-size:42px;line-height:1.25;color:var(--accent)}
.tpl-cucdai .cd-pair{position:relative;margin:22px 0 34px}
.tpl-cucdai .cd-pair p{margin:0;font-family:var(--font-script);font-size:clamp(34px,10vw,44px);line-height:1.2;color:var(--accent)}
.tpl-cucdai .cd-pair .g{text-align:left}
.tpl-cucdai .cd-pair .b{text-align:right}
.tpl-cucdai .cd-amp{display:block;width:40px;margin:4px auto;animation:cdSpin 16s linear infinite}
.tpl-cucdai .cd-duo{display:grid;grid-template-columns:1fr 46px 1fr;margin:0 -22px}
.tpl-cucdai .cd-duo .ph{grid-column:auto;display:block;width:100%;aspect-ratio:3/5;border-radius:0}
.tpl-cucdai .cd-strip{display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:16px 0;background:var(--cd-panel);color:var(--accent-ink)}
.tpl-cucdai .cd-strip span{writing-mode:vertical-rl;font-family:var(--font-title);font-size:13px;font-style:italic;letter-spacing:.04em}
.tpl-cucdai .cd-strip span:first-child{transform:rotate(180deg)}
.tpl-cucdai .cd-strip svg{width:20px;animation:cdPop 1.6s ease-in-out infinite}
.tpl-cucdai .cd-fams{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:34px}
.tpl-cucdai .cd-fam h3{margin:0 0 8px;font-family:var(--font-title);font-weight:500;font-size:22px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink)}
.tpl-cucdai .cd-fam p{margin:0;font-size:13px;letter-spacing:.03em;text-transform:uppercase;color:var(--muted)}
.tpl-cucdai .cd-fam .a{margin-top:6px;text-transform:none}
.tpl-cucdai .cd-msg{margin:26px auto 0;max-width:330px;font-family:var(--font-title);font-size:18px;font-style:italic;color:var(--muted)}

/* ---- khối sự kiện ---- */
.tpl-cucdai .cd-evs{display:grid;gap:18px;padding-top:10px}
.tpl-cucdai .cd-ev{padding:28px 20px 26px;text-align:center}
.tpl-cucdai .cd-ev p{margin:0}
.tpl-cucdai .cd-ev h3{margin:0;font-family:var(--font-title);font-weight:500;font-size:22px;letter-spacing:.04em;text-transform:uppercase}
.tpl-cucdai .cd-vl{margin:8px 0 6px!important;font-family:var(--font-title);font-size:13px;letter-spacing:.1em;text-transform:uppercase;text-decoration:underline;text-underline-offset:4px;opacity:.8}
.tpl-cucdai .cd-tw{font-family:var(--font-title);font-size:20px;text-transform:uppercase;letter-spacing:.04em}
.tpl-cucdai .cd-dd{margin:2px 0!important;font-family:var(--font-title);font-weight:500;font-size:40px;line-height:1.15;letter-spacing:.02em}
.tpl-cucdai .cd-lu{font-family:var(--font-title);font-size:15px;font-style:italic;opacity:.8}
.tpl-cucdai .cd-pl{margin-top:14px!important;font-family:var(--font-title);font-weight:500;font-size:26px;line-height:1.25;text-transform:uppercase}
.tpl-cucdai .cd-ad{margin-top:4px!important;font-size:13px;opacity:.85}
.tpl-cucdai .cd-acts{display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:8px 16px;margin-top:16px!important}
.tpl-cucdai .cd-pill{padding:8px 20px;border-radius:999px;background:var(--paper);color:var(--accent);font-family:var(--font-title);font-weight:600;font-size:15px;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;box-shadow:0 3px 8px rgba(0,0,0,.15)}
.tpl-cucdai .cd-lnk{font-size:13px;color:var(--accent-ink);opacity:.85}
.tpl-cucdai .cd-evfl{position:absolute;width:82px;filter:drop-shadow(1px 3px 3px rgba(0,0,0,.25))}
.tpl-cucdai .cd-evfl.l{left:-14px;bottom:-16px}
.tpl-cucdai .cd-evfl.r{right:-14px;top:-18px}

/* ---- câu chuyện ---- */
.tpl-cucdai .cd-div{display:flex;align-items:center;justify-content:center;gap:12px;margin:-8px 0 18px}
.tpl-cucdai .cd-div i{width:60px;height:1px;background:var(--line)}
.tpl-cucdai .cd-div svg{width:30px}
.tpl-cucdai .cd-story p:not(.cd-div){max-width:360px;margin:0 auto 10px;font-family:var(--font-title);font-size:19px;line-height:1.6;color:var(--ink)}

/* ---- album ---- */
.tpl-cucdai .cd-gal{padding-left:12px;padding-right:12px}
.tpl-cucdai .cd-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.tpl-cucdai .cd-grid .ph{grid-column:auto;aspect-ratio:2/3;border-radius:0;outline:1px solid var(--line);outline-offset:2px}
.tpl-cucdai .cd-grid .ph:nth-child(4n){grid-column:span 3;aspect-ratio:16/10}

/* ---- xác nhận, mừng cưới ---- */
.tpl-cucdai .cd-rsvp{padding-top:30px}
.tpl-cucdai .cd-rhead{margin:0 -22px;padding:30px 26px 110px}
.tpl-cucdai .cd-rhead h2{margin:0 0 8px;font-family:var(--font-script);font-weight:400;font-size:44px;line-height:1.2}
.tpl-cucdai .cd-rhead p{margin:0;font-family:var(--font-title);font-size:18px;line-height:1.5}
.tpl-cucdai .cd-rsvp .form{position:relative;margin-top:-90px;border-radius:4px;box-shadow:0 10px 26px rgba(0,0,0,.14)}
.tpl-cucdai .form{border-radius:4px}
.tpl-cucdai .form input:not([type=radio]),.tpl-cucdai .form select,.tpl-cucdai .form textarea,.tpl-cucdai .choice label{border-radius:4px;background:#fff}
.tpl-cucdai .btn{border-radius:4px;background:var(--cd-panel);border-color:var(--cd-panel);font-family:var(--font-body);font-weight:500}
.tpl-cucdai .cd-gbtn{display:inline-flex;flex-direction:column;align-items:center;margin:20px auto 26px;padding:0 34px 14px;border-radius:8px}
.tpl-cucdai .cd-gbtn svg{width:86px;margin-top:-40px;animation:cdPop 2.6s ease-in-out infinite}
.tpl-cucdai .cd-gbtn h2{margin:4px 0 0;font-family:var(--font-body);font-weight:400;font-size:21px}
.tpl-cucdai .gift{border-radius:6px}
.tpl-cucdai .gift-who{font-family:var(--font-script);font-size:30px}
.tpl-cucdai .wish{border-radius:4px;border-left:3px solid var(--gold)}

/* ---- cảm ơn ---- */
.tpl-cucdai .cd-thx{position:relative;display:flex;align-items:center;min-height:620px;padding:30px 18px;background:var(--cd-panel) center/cover no-repeat}
.tpl-cucdai .cd-thx-in{position:relative;width:100%;padding:26px 20px 24px;text-align:center;background:color-mix(in srgb,var(--paper) 72%,transparent);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}
.tpl-cucdai .cd-thx-fl{position:absolute;left:50%;top:-22px;width:44px;margin-left:-22px;animation:cdSpin 14s linear infinite}
.tpl-cucdai .cd-thx-in h2{margin:0 0 6px;font-family:var(--font-title);font-weight:500;font-size:30px;letter-spacing:.04em;color:var(--ink)}
.tpl-cucdai .cd-thx-in p{margin:0;font-family:var(--font-title);font-size:18px;line-height:1.5;color:var(--ink)}
.tpl-cucdai .cd-thx-in .n{margin-top:12px;font-family:var(--font-script);font-size:34px;color:var(--accent)}

@media (prefers-reduced-motion:reduce){.tpl-cucdai *{animation:none!important}}
`,
};
