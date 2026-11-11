// Mẫu "Rêu Thư" — chất liệu giấy: nền giấy kem có thớ (SVG nhiễu), phong bì xanh rêu kiểu hai cánh cửa
// buộc dây gai + dấu sáp đồng, cành lan hồ điệp vẽ SVG. Màn mở: dây tuột, hai cánh mở sang hai bên.
const { esc } = require('../lib/util');

const P = (n) => `/demo/xanhla-${n}.jpg`;
const base = {
  '--font-title': "'Playfair Display',Georgia,serif",
  '--font-script': "'Pinyon Script',cursive",
  '--font-body': "'Quicksand',system-ui,sans-serif",
};

const evList = (d) => d.events.filter((e) => e.name || e.place);
function partyEvent(d) {
  const evs = evList(d);
  return evs.find((e) => /khai tiệc|tiệc cưới/i.test(e.name)) || evs.find((e) => /tiệc/i.test(e.name)) || evs[evs.length - 1] || null;
}
const lunarOf = (ctx) => ctx.lunar.replace(/^Nhằm /i, 'Tức ');

// thớ giấy: nhiễu mịn + vân loang lớn (SVG tự viết, nhúng thẳng vào CSS)
const svgUrl = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
const GRAIN = svgUrl("<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .3 0 0 0 0 .28 0 0 0 0 .2 0 0 0 .11 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>");
const MOTTLE = svgUrl("<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><filter id='m'><feTurbulence type='fractalNoise' baseFrequency='.012 .03' numOctaves='4' seed='7' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .45 0 0 0 0 .42 0 0 0 0 .32 0 0 0 .1 0'/></filter><rect width='100%' height='100%' filter='url(#m)'/></svg>");

// một bông lan hồ điệp (tâm ở 0,0, cỡ ~40)
const orchid = (x, y, s, r) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><g fill="#fffdf7" stroke="#b8c4a5" stroke-width=".9"><ellipse cx="0" cy="-15" rx="7" ry="14"/><ellipse cx="0" cy="-15" rx="7" ry="14" transform="rotate(128)"/><ellipse cx="0" cy="-15" rx="7" ry="14" transform="rotate(-128)"/><ellipse cx="13" cy="-3" rx="13" ry="10.5" transform="rotate(20 13 -3)"/><ellipse cx="-13" cy="-3" rx="13" ry="10.5" transform="rotate(-20 -13 -3)"/></g><path d="M-6 3q6 15 12 0q-6 5-12 0z" fill="#f0d27a" stroke="#c9a24e" stroke-width=".6"/><circle r="3.2" fill="#f7eab2"/><path d="M-2.5 5q2.5 6 5 0" fill="#c9788b"/></g>`;
const bud = (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="7.5" transform="rotate(${r} ${x} ${y})" fill="#9db47a" stroke="#6f8a4f" stroke-width=".8"/>`;
// cành lan cong: thân, nụ xanh, 3 bông
function sprig(cls) {
  return `<svg class="${cls}" viewBox="0 0 220 170" aria-hidden="true"><path d="M214 6C170 18 130 40 104 74S56 140 14 160" fill="none" stroke="#6f8a4f" stroke-width="2.2" stroke-linecap="round"/><path d="M60 128q-14-2-22 8M150 30q4-12 16-14" fill="none" stroke="#6f8a4f" stroke-width="1.5"/>${bud(36, 138, 60)}${bud(22, 154, 70)}${bud(168, 15, -30)}${orchid(150, 40, 1.05, -12)}${orchid(108, 78, 1.2, 8)}${orchid(64, 116, .95, 24)}</svg>`;
}

// dấu sáp đồng, giữa là nhành lá
const SEAL_D = (() => {
  let d = '';
  for (let i = 0; i <= 80; i++) {
    const t = (i / 80) * 2 * Math.PI;
    const r = 46 + 2.2 * Math.sin(t * 9 + 0.5) + 1.4 * Math.sin(t * 17);
    d += (i ? 'L' : 'M') + (50 + r * Math.cos(t)).toFixed(1) + ' ' + (50 + r * Math.sin(t)).toFixed(1);
  }
  return d + 'Z';
})();
const seal = (cls) => `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="rtSealG" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="var(--rt-seal-hi)"/><stop offset=".55" stop-color="var(--rt-seal)"/><stop offset="1" stop-color="var(--rt-seal-dk)"/></radialGradient></defs><path d="${SEAL_D}" fill="url(#rtSealG)"/><circle cx="50" cy="50" r="31" fill="none" stroke="var(--rt-seal-dk)" stroke-width="3" opacity=".45"/><g fill="none" stroke="var(--rt-seal-dk)" stroke-width="2.2" stroke-linecap="round" opacity=".8"><path d="M50 72V30"/><path d="M50 62q-12-2-15-12q11 0 15 8M50 62q12-2 15-12q-11 0-15 8M50 48q-10-2-12-11q9 0 12 7M50 48q10-2 12-11q-9 0-12 7M50 34q-5-4-4-9q5 3 4 9z"/></g></svg>`;

// biểu tượng nét cho lịch trình
const ICONS = {
  camera: '<rect x="6" y="16" width="44" height="30" rx="5"/><circle cx="28" cy="31" r="9"/><circle cx="28" cy="31" r="4"/><path d="M18 16l4-6h12l4 6M42 22h3"/>',
  cheers: '<path d="M14 10h12l-1 13a5 5 0 01-10 0zM20 28v14M15 42h10M32 12h12l-2 13a5 5 0 01-10 0zM38 30v12M33 42h10M27 4l2-3M23 5l-2-3M33 4l3-2"/>',
  rings: '<circle cx="21" cy="32" r="12"/><circle cx="35" cy="32" r="12"/><path d="M15 12h12l-6 8zM15 12l3-4h6l3 4"/>',
};
const iconFor = (n, i) => (/tiệc|khai/i.test(n) ? 'cheers' : /thành hôn|lễ cưới|hôn lễ/i.test(n) ? 'rings' : /vu quy|đón|check|chụp/i.test(n) ? 'camera' : ['camera', 'cheers', 'rings'][i % 3]);
const PIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s-7-7.4-7-12.5A7 7 0 0119 9.5C19 14.6 12 22 12 22z" fill="currentColor"/><circle cx="12" cy="9.5" r="2.6" fill="var(--bg)"/></svg>';

module.exports = {
  id: 'reuthu',
  name: 'Rêu Thư',
  group: 'chatlieu',
  badge: 'Mới',
  desc: 'Giấy kem có thớ, phong bì xanh rêu buộc dây gai mở hai cánh, lan hồ điệp',
  fonts: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Pinyon+Script&family=Allura&family=Quicksand:wght@300;400;500;600&display=swap',
  palettes: [
    { id: 'xanh-reu', name: 'Xanh rêu', swatch: ['#f1ede2', '#4b7340'], vars: { ...base, '--page': '#e7e4d8', '--bg': '#f2efe5', '--paper': '#fbf9f2', '--ink': '#2f3a28', '--muted': '#6e7364', '--accent': '#3d5a31', '--accent-ink': '#f4f1e7', '--gold': '#a8784e', '--line': '#dcd7c6', '--rt-env': '#4f7a44', '--rt-env-dk': '#3a5d31', '--rt-env-lt': '#689360', '--rt-olive': '#5a6a3c', '--rt-red': '#a8282a', '--rt-twine': '#cdb88f', '--rt-seal': '#9a6542', '--rt-seal-hi': '#d09a6c', '--rt-seal-dk': '#5e3a22' } },
    { id: 'nau-kraft', name: 'Nâu giấy kraft', swatch: ['#f3ece0', '#a77d52'], vars: { ...base, '--page': '#e9e1d3', '--bg': '#f4eee3', '--paper': '#fcf8f0', '--ink': '#45331f', '--muted': '#7c6b58', '--accent': '#6f4c2c', '--accent-ink': '#f7f1e6', '--gold': '#8e3b2e', '--line': '#e0d4c1', '--rt-env': '#b08659', '--rt-env-dk': '#94704a', '--rt-env-lt': '#c49c70', '--rt-olive': '#7a5a3a', '--rt-red': '#a8352a', '--rt-twine': '#efe3c8', '--rt-seal': '#8e2f27', '--rt-seal-hi': '#c4584a', '--rt-seal-dk': '#561a15' } },
  ],
  demo: {
    cover: P(9),
    photos: [6, 3, 2, 8, 4, 7, 1, 5].map(P),
    story: 'Mọi thứ bắt đầu từ một lời chào rất khẽ trong tiệm sách nhỏ cuối phố. Rồi những buổi chiều cà phê, những chuyến đi xa, những lần cùng nhau lớn lên.\nHôm nay, chúng mình muốn được chia sẻ hành trình ấy với những người thân yêu nhất.',
  },
  layout: ['invite', 'banner', 'couple', 'story', 'calendar', 'events', 'gallery', 'rsvp', 'gift', 'wishes', 'thanks'],

  title(text, sub) {
    return `<h2 class="rt-h">${esc(text)}</h2>${sub ? `<p class="sec-sub">${esc(sub)}</p>` : ''}`;
  },

  opener(ctx) {
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<div class="opener rt-op" id="opener" data-open-ms="1900">
  ${sprig('rt-sp tl')}${sprig('rt-sp br')}
  <div class="rt-op-in">
    <p class="rt-save">Save our date</p>
    <div class="rt-gate">
      <div class="rt-in"${photo ? ` style="background-image:url('${esc(photo)}')"` : ''}><p>${esc(ctx.g)} &amp; ${esc(ctx.b)}</p></div>
      <div class="rt-door r"></div>
      <div class="rt-door l"></div>
      <span class="rt-band" aria-hidden="true"></span>
      ${seal('rt-seal')}
    </div>
    ${ctx.guest ? `<p class="rt-to">Thân gửi <b>${esc(ctx.guest.name)}</b></p>` : ''}
    <button class="rt-hint" id="openBtn" type="button">Chạm để mở thiệp</button>
  </div>
</div>`;
  },

  cover(ctx) {
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    const p = ctx.dparts;
    return `
<header class="rt-cover">
  ${sprig('rt-sp ctl')}${sprig('rt-sp cbr')}
  <p class="rt-save">Save our date</p>
  <div class="rt-cgate">
    <div class="rt-in"${photo ? ` style="background-image:url('${esc(photo)}')"` : ''}></div>
    <div class="rt-door l"></div>
    <div class="rt-door r"></div>
    ${seal('rt-cseal')}
  </div>
  <h1 class="rt-cnames"><span>${esc(ctx.g)}</span><i>&amp;</i><span>${esc(ctx.b)}</span></h1>
  ${p ? `<p class="rt-cdate"><span>${esc(ctx.weekday)}</span><b>${p.d} · ${p.m} · ${p.y}</b></p>` : ''}
</header>`;
  },

  sections: {
    // hai nhà hai bên dải xanh dọc, tên lớn so le, lời mời có tên khách, giờ/ngày/nơi làm lễ
    invite(ctx, opts, h) {
      const { d, dparts: p } = ctx;
      const fam = (x, label, cls) => `<div class="rt-fam ${cls}"><h3>${label}</h3>${x.father ? `<p>${esc(x.father)}</p>` : ''}${x.mother ? `<p>${esc(x.mother)}</p>` : ''}${x.address ? `<p class="a">${esc(x.address)}</p>` : ''}</div>`;
      const hasFam = d.groom.father || d.groom.mother || d.bride.father || d.bride.mother;
      const ev = partyEvent(d) || {};
      const time = ev.time || d.time;
      const dir = ev.mapUrl || (ev.address ? h.mapSearch(ev.address) : '');
      return `
  <section class="sec rt-inv">
    ${hasFam ? `<div class="rt-fams reveal">${fam(d.groom, 'Nhà Trai', 'l')}<div class="rt-strip"><svg viewBox="0 0 56 48" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS.cheers}</g></svg><i></i>${seal('rt-mini')}</div>${fam(d.bride, 'Nhà Gái', 'r')}</div>` : ''}
    <div class="rt-bign reveal">
      ${sprig('rt-sp inv')}
      <p class="g">${esc(ctx.g)}</p><p class="amp">&amp;</p><p class="b">${esc(ctx.b)}</p>
    </div>
    <div class="reveal">
      <p class="rt-k">${esc(d.inviteText)}</p>
      <p class="rt-guest">${ctx.guest ? esc(ctx.guest.name) : 'Quý khách'}</p>
      <p class="rt-tham">Tham dự tiệc chung vui<br>cùng gia đình chúng tôi</p>
      ${p ? `<p class="rt-time">${esc(h.clock(time).replace(':', ' : '))}, ${esc(ctx.weekday)}</p>
      <div class="rt-date"><span>Tháng ${+p.m}</span><b>${p.d}</b><span>Năm ${p.y}</span></div>
      <p class="rt-lunar">(${esc(lunarOf(ctx))})</p>` : ''}
      ${ev.place ? `<p class="rt-at">${esc(ev.name || 'Tiệc cưới')} được tổ chức tại</p><p class="rt-venue">${esc(ev.place)}</p>` : ''}
      ${ev.address ? `<p class="rt-addr">${esc(ev.address)}</p>` : ''}
      ${dir ? `<a class="rt-dir" target="_blank" rel="noopener" href="${esc(dir)}">${PIN}Chỉ đường</a>` : ''}
      ${d.message ? `<p class="rt-msg">${esc(d.message)}</p>` : ''}
    </div>
  </section>`;
    },

    // ảnh tràn viền với dòng chữ viết tay
    banner(ctx) {
      const ph = ctx.d.photos;
      if (!ph.length) return '';
      return `
  <section class="rt-ban">
    ${sprig('rt-sp ban')}
    <button class="ph" data-i="${1 % ph.length}" style="background-image:url('${esc(ph[1 % ph.length])}')" aria-label="Xem ảnh"></button>
    <p class="rt-ban-t" aria-hidden="true"><span>Bên nhau</span><span>trọn đời</span></p>
  </section>`;
    },

    // hai tấm ảnh lồng khung trắng nghiêng, tên chú rể / cô dâu viết tay
    couple(ctx) {
      const { d } = ctx;
      const ph = d.photos;
      if (!ph.length) return '';
      const pol = (i, cls) => `<div class="rt-pol ${cls}"><button class="ph" data-i="${i % ph.length}" style="background-image:url('${esc(ph[i % ph.length])}')" aria-label="Xem ảnh"></button></div>`;
      return `
  <section class="sec rt-cpl">
    ${sprig('rt-sp cpl')}
    <div class="rt-cpl-row reveal">${pol(2, 'a')}<p class="rt-who"><span>Chú rể</span><b>${esc(d.groom.fullName || d.groom.name)}</b></p></div>
    <div class="rt-cpl-row b reveal"><p class="rt-who"><span>Cô dâu</span><b>${esc(d.bride.fullName || d.bride.name)}</b></p>${pol(3, 'b')}</div>
  </section>`;
    },

    story(ctx) {
      if (!ctx.d.story) return '';
      return `
  <section class="sec rt-story reveal">
    <h2 class="rt-sh">Our story</h2>
    ${ctx.d.story.split(/\n+/).map((t) => `<p>${esc(t)}</p>`).join('')}
  </section>`;
    },

    // lịch tháng chữ trắng trên ảnh, ngày cưới khoanh tim đỏ; đếm ngược ô xanh
    calendar(ctx, opts, h) {
      const { d, dparts: p } = ctx;
      if (!p || (!d.show.calendar && !d.show.countdown)) return '';
      const photo = d.photos[4 % (d.photos.length || 1)] || d.cover || '';
      const u = (k, l) => `<span><b data-cd="${k}">0</b><small>${l}</small></span>`;
      return `
  ${d.show.calendar ? `<section class="rt-calp"${photo ? ` style="background-image:url('${esc(photo)}')"` : ''}>
    <div class="rt-calbox reveal">${h.calGrid(ctx, `<p class="rt-calh">Tháng ${+p.m}<small>${p.y}</small></p>`)}<p class="rt-cals">${esc(ctx.weekday)} · âm lịch ${esc(ctx.lunarShort)}</p></div>
  </section>` : ''}
  ${d.show.countdown ? `<section class="sec rt-cd reveal"><h2 class="rt-sh">Countdown</h2><div class="rt-cdu" role="timer">${u('d', 'Ngày')}${u('h', 'Giờ')}${u('m', 'Phút')}${u('s', 'Giây')}</div></section>` : ''}`;
    },

    // Timeline: biểu tượng nét, giờ, tên, nơi + chỉ đường
    events(ctx, opts, h) {
      const evs = evList(ctx.d);
      if (!evs.length) return '';
      return `
  <section class="sec rt-ev">
    <h2 class="rt-sh">Timeline</h2>
    <ol class="rt-tl">
      ${evs.map((e, i) => {
        const dir = e.mapUrl || (e.address ? h.mapSearch(e.address) : '');
        const other = e.date && e.date !== ctx.date;
        return `<li class="reveal">
        <svg viewBox="0 0 56 50" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[iconFor(e.name, i)]}</g><g fill="var(--rt-red)"><circle cx="6" cy="8" r="1.6"/><circle cx="50" cy="10" r="1.6"/><circle cx="48" cy="3" r="1.1"/></g></svg>
        <b>${esc(h.clock(e.time)) || '—'}</b>
        <h3>${esc(e.name)}</h3>
        ${other ? `<p>${esc(h.dmy(e.date))}</p>` : ''}
        ${e.place ? `<p>${esc(e.place)}</p>` : ''}
        ${dir ? `<a target="_blank" rel="noopener" href="${esc(dir)}">Chỉ đường</a>` : ''}
      </li>`;
      }).join('')}
    </ol>
  </section>`;
    },

    // khối olive có ảnh + câu trích, "ALBUM of LOVE", ảnh xếp hai cột so le
    gallery(ctx) {
      const list = ctx.d.photos;
      if (!ctx.d.show.gallery || !list.length) return '';
      return `
  <section class="rt-gal">
    <div class="rt-quote reveal"><button class="ph" data-i="0" style="background-image:url('${esc(list[0])}')" aria-label="Xem ảnh 1"></button><p>Ở bên nhau, những ngày bình thường cũng hoá thành kỷ niệm.</p>${sprig('rt-sp q')}</div>
    <h2 class="rt-alb reveal"><span>Album</span><i>of</i><span>Love</span></h2>
    <div class="rt-grid">
      ${list.map((u, i) => `<button class="ph reveal" data-i="${i}" style="background-image:url('${esc(u)}')" aria-label="Xem ảnh ${i + 1}"></button>`).join('')}
    </div>
  </section>`;
    },

    rsvp(ctx, opts, h) {
      if (!ctx.d.show.rsvp) return '';
      return h.rsvp(ctx).replace('<form', '<p class="rt-note">Hãy cho chúng mình biết bạn có đến được không để việc đón tiếp thật chu đáo nhé.</p><form');
    },

    gift(ctx, opts, h) {
      const html = h.gift(ctx);
      if (!html) return '';
      const box = '<svg class="rt-box" viewBox="0 0 80 72" aria-hidden="true"><rect x="10" y="30" width="60" height="38" rx="3" fill="var(--paper)" stroke="var(--accent)" stroke-width="2"/><rect x="6" y="20" width="68" height="12" rx="3" fill="var(--rt-env-lt)" stroke="var(--accent)" stroke-width="2"/><path d="M40 20v48" stroke="var(--rt-red)" stroke-width="5"/><path d="M40 20c-6-14-24-14-18-2 3 5 18 2 18 2zM40 20c6-14 24-14 18-2-3 5-18 2-18 2z" fill="none" stroke="var(--rt-red)" stroke-width="2.5"/></svg>';
      return html.replace(/<h2 class="rt-h">[^<]*<\/h2>/, `<h2 class="rt-sh">Gửi mừng cưới</h2>${box}`);
    },

    thanks(ctx) {
      const ph = ctx.d.photos;
      const photo = ph[ph.length - 1] || ctx.d.cover || '';
      return `
  <section class="rt-thx">
    <div class="rt-thx-in reveal">
      ${sprig('rt-sp thx')}
      <p class="rt-thx-t">Cảm ơn bạn đã dành tình cảm cho chúng mình. Sự hiện diện của bạn là món quà ý nghĩa nhất trong ngày trọng đại này.</p>
      <p class="rt-thx-b">Thank you!</p>
      <p class="rt-thx-n">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
    </div>
    ${photo ? `<div class="rt-thx-ph" style="background-image:url('${esc(photo)}')"></div>` : ''}
  </section>`;
    },
  },

  css: `
.tpl-reuthu{background:var(--page)}
.tpl-reuthu .card,.tpl-reuthu .rt-op{background-color:var(--bg);background-image:${GRAIN},${MOTTLE};color:var(--ink)}
.tpl-reuthu .card{box-shadow:0 0 40px rgba(40,50,30,.14)}
.tpl-reuthu .sec{padding:52px 24px}
.tpl-reuthu .rt-h{margin:0 0 22px;font-family:var(--font-script);font-weight:400;font-size:46px;line-height:1.2;color:var(--accent)}
.tpl-reuthu .rt-h + .sec-sub{margin:-16px 0 24px}
.tpl-reuthu .rt-sh{margin:0 0 20px;font-family:var(--font-script);font-weight:400;font-size:54px;line-height:1.2;color:var(--rt-olive)}
.tpl-reuthu .rt-sp{position:absolute;pointer-events:none;filter:drop-shadow(0 3px 3px rgba(40,50,30,.18));animation:rtSway 7s ease-in-out infinite;transform-origin:100% 0}
@keyframes rtSway{50%{rotate:-3deg}}
.tpl-reuthu .rt-save{position:relative;margin:0;font-family:var(--font-script);font-size:50px;line-height:1.2;color:var(--accent)}

/* ---- màn mở thiệp: phong bì hai cánh ---- */
.tpl-reuthu .rt-op{padding:20px;overflow:hidden}
.tpl-reuthu .rt-op-in{position:relative;display:flex;flex-direction:column;align-items:center;width:100%;max-width:420px;text-align:center}
.tpl-reuthu .rt-op .rt-sp.tl{left:-30px;top:-10px;width:200px;transform:scaleX(-1) rotate(10deg)}
.tpl-reuthu .rt-op .rt-sp.br{right:-30px;bottom:-6px;width:220px;transform:rotate(180deg) scaleX(-1)}
.tpl-reuthu .rt-op .rt-sp.tl,.tpl-reuthu .rt-op .rt-sp.br{animation:none}
.tpl-reuthu .rt-gate{position:relative;width:min(340px,86vw);aspect-ratio:3/2;margin-top:26px;perspective:1100px;filter:drop-shadow(0 18px 20px rgba(30,40,20,.3))}
.tpl-reuthu .rt-in{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;border-radius:4px;background:var(--rt-env-dk) center/cover no-repeat}
.tpl-reuthu .rt-in p{margin:0 0 10px;padding:2px 14px;font-family:var(--font-script);font-size:26px;color:#fff;text-shadow:0 1px 8px rgba(0,0,0,.5)}
.tpl-reuthu .rt-door{position:absolute;top:0;bottom:0;background-color:var(--rt-env);background-image:linear-gradient(135deg,rgba(255,255,255,.1),transparent 45%,rgba(0,0,0,.08)),${GRAIN};box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.tpl-reuthu .rt-door.r{right:0;width:50%;border-radius:0 4px 4px 0;transform-origin:100% 50%;background-color:var(--rt-env-dk)}
.tpl-reuthu .rt-door.l{left:0;width:58%;border-radius:4px 50% 50% 4px/4px 50% 50% 4px;transform-origin:0 50%;box-shadow:6px 0 10px rgba(0,0,0,.18)}
.tpl-reuthu .rt-door.l::after{content:"";position:absolute;inset:8px 14px 8px 8px;border:1px solid rgba(255,255,255,.22);border-radius:inherit}
.tpl-reuthu .rt-band{position:absolute;left:-2%;right:-2%;top:50%;height:7px;margin-top:-3px;border-top:2px solid var(--rt-twine);border-bottom:2px solid var(--rt-twine);opacity:.95}
.tpl-reuthu .rt-seal{position:absolute;left:58%;top:50%;width:21%;transform:translate(-50%,-50%);filter:drop-shadow(0 3px 3px rgba(0,0,0,.35))}
.tpl-reuthu .rt-to{margin:30px 0 0;font-size:15px;color:var(--muted)}
.tpl-reuthu .rt-to b{display:block;font-family:'Allura',cursive;font-weight:400;font-size:38px;line-height:1.3;color:var(--rt-red)}
.tpl-reuthu .rt-hint{position:relative;margin:26px 0 0;border:0;background:none;padding:8px 40px;font-family:'Playfair Display',serif;font-size:19px;color:var(--rt-olive);animation:rtPulse 2.2s ease-in-out infinite}
.tpl-reuthu .rt-hint::before{content:"";position:absolute;left:50%;top:50%;z-index:-1;width:290px;height:40px;transform:translate(-50%,-40%);border-radius:50%;background:radial-gradient(closest-side,rgba(40,45,30,.26),transparent)}
@keyframes rtPulse{50%{opacity:.6}}
.tpl-reuthu .rt-op.opening .rt-band{transition:opacity .3s;opacity:0}
.tpl-reuthu .rt-op.opening .rt-seal{animation:rtDrop .5s ease-in forwards}
.tpl-reuthu .rt-op.opening .rt-door.l{animation:rtOpenL 1s .35s cubic-bezier(.45,.05,.3,1) forwards}
.tpl-reuthu .rt-op.opening .rt-door.r{animation:rtOpenR 1s .5s cubic-bezier(.45,.05,.3,1) forwards}
.tpl-reuthu .rt-op.opening .rt-in{animation:rtZoom 1.2s .7s ease forwards}
.tpl-reuthu .rt-op.opening .rt-hint,.tpl-reuthu .rt-op.opening .rt-to{transition:opacity .4s;opacity:0}
@keyframes rtDrop{to{opacity:0;transform:translate(-50%,10%) rotate(25deg) scale(.7)}}
@keyframes rtOpenL{to{transform:rotateY(-165deg)}}
@keyframes rtOpenR{to{transform:rotateY(165deg)}}
@keyframes rtZoom{to{transform:scale(1.08)}}

/* ---- bìa: phong bì đã mở hai cánh, ảnh ở giữa ---- */
.tpl-reuthu .rt-cover{position:relative;display:flex;flex-direction:column;align-items:center;padding:38px 20px 44px;text-align:center;overflow:hidden}
.tpl-reuthu .rt-sp.ctl{left:-34px;top:-14px;width:170px;transform:scaleX(-1) rotate(8deg);transform-origin:50% 0}
.tpl-reuthu .rt-sp.cbr{right:-46px;bottom:40px;width:170px;transform:rotate(180deg) scaleX(-1);animation:none;z-index:2}
.tpl-reuthu .rt-cgate{position:relative;width:min(240px,61vw);aspect-ratio:3/4;margin:22px 0 0;perspective:900px;filter:drop-shadow(0 16px 18px rgba(30,40,20,.25))}
.tpl-reuthu .rt-cgate .rt-in{border:6px solid var(--paper);border-radius:2px;animation:rtBreath 8s ease-in-out infinite}
@keyframes rtBreath{50%{background-size:108%}}
.tpl-reuthu .rt-cgate .rt-door{width:40%;border-radius:2px}
.tpl-reuthu .rt-cgate .rt-door.l{left:auto;right:100%;transform-origin:100% 50%;transform:rotateY(-40deg);border-radius:4px 50% 50% 4px/4px 50% 50% 4px;box-shadow:none;width:40%}
.tpl-reuthu .rt-cgate .rt-door.r{right:auto;left:100%;transform-origin:0 50%;transform:rotateY(40deg)}
.tpl-reuthu .rt-cseal{position:absolute;right:-24%;top:30%;z-index:3;width:26%;transform:rotate(-12deg);filter:drop-shadow(0 3px 3px rgba(0,0,0,.35))}
.tpl-reuthu .rt-cnames{position:relative;z-index:3;display:flex;flex-wrap:wrap;align-items:baseline;justify-content:center;gap:0 12px;margin:34px 0 0;font-family:var(--font-body);font-weight:300;font-size:clamp(28px,8.6vw,38px);line-height:1.2;color:var(--ink)}
.tpl-reuthu .rt-cnames span{white-space:nowrap}
.tpl-reuthu .rt-cnames i{font-family:var(--font-title);font-size:.8em;color:var(--gold)}
.tpl-reuthu .rt-cdate{position:relative;z-index:3;display:flex;flex-direction:column;gap:2px;margin:12px 0 0;font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
.tpl-reuthu .rt-cdate b{font-family:var(--font-title);font-weight:400;font-size:22px;letter-spacing:.12em;color:var(--accent)}

/* ---- lời mời ---- */
.tpl-reuthu .rt-inv{padding-top:44px}
.tpl-reuthu .rt-fams{display:grid;grid-template-columns:1fr 34px 1fr;gap:12px;align-items:start;font-size:14px}
.tpl-reuthu .rt-fam h3{margin:0 0 8px;font-family:var(--font-body);font-weight:600;font-size:21px;color:var(--ink)}
.tpl-reuthu .rt-fam p{margin:0 0 2px}
.tpl-reuthu .rt-fam .a{color:var(--muted);font-size:13px;margin-top:6px}
.tpl-reuthu .rt-fam.l{text-align:right}
.tpl-reuthu .rt-fam.r{text-align:left}
.tpl-reuthu .rt-strip{display:flex;flex-direction:column;align-items:center;color:var(--rt-red)}
.tpl-reuthu .rt-strip svg:first-child{width:30px}
.tpl-reuthu .rt-strip i{display:block;width:22px;height:70px;margin:4px 0;background:var(--accent);border-radius:2px;position:relative}
.tpl-reuthu .rt-strip i::before{content:"";position:absolute;left:50%;top:10px;width:9px;height:9px;margin-left:-4.5px;border-radius:50%;background:var(--paper)}
.tpl-reuthu .rt-mini{width:28px;margin-top:-28px;position:relative}
.tpl-reuthu .rt-bign{position:relative;margin:36px 0 26px;text-align:left}
.tpl-reuthu .rt-bign p{margin:0;font-family:var(--font-body);font-weight:300;font-size:clamp(40px,12vw,52px);line-height:1.1;color:var(--ink)}
.tpl-reuthu .rt-bign .amp{margin:4px 0 4px 34%;font-family:var(--font-title);font-style:italic;font-size:34px;color:var(--gold)}
.tpl-reuthu .rt-bign .b{text-align:right}
.tpl-reuthu .rt-sp.inv{right:-40px;top:-30px;width:170px;opacity:.95}
.tpl-reuthu .rt-k{margin:0;font-size:15px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--ink)}
.tpl-reuthu .rt-guest{margin:6px 0 10px;font-family:'Allura',cursive;font-size:44px;line-height:1.3;color:var(--rt-red)}
.tpl-reuthu .rt-tham{margin:0;font-family:var(--font-title);font-weight:600;font-size:19px;line-height:1.45;text-transform:uppercase;color:var(--rt-olive)}
.tpl-reuthu .rt-time{margin:22px 0 4px;font-size:21px;font-weight:400;letter-spacing:.04em;text-transform:uppercase}
.tpl-reuthu .rt-date{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;margin:0 -8px}
.tpl-reuthu .rt-date span{padding:6px 0;border-top:1.5px solid var(--ink);border-bottom:1.5px solid var(--ink);font-size:20px;text-transform:uppercase;white-space:nowrap}
.tpl-reuthu .rt-date b{font-weight:300;font-size:64px;line-height:1;color:var(--accent)}
.tpl-reuthu .rt-lunar{margin:8px 0 18px;font-size:14px;color:var(--muted)}
.tpl-reuthu .rt-at{margin:0;font-size:15px;font-weight:500}
.tpl-reuthu .rt-venue{margin:6px 0 4px;font-family:var(--font-title);font-weight:600;font-size:26px;line-height:1.3;text-transform:uppercase;color:var(--ink)}
.tpl-reuthu .rt-addr{margin:0;font-size:14px;color:var(--muted)}
.tpl-reuthu .rt-dir{display:inline-flex;align-items:center;gap:8px;margin-top:16px;font-family:var(--font-title);font-weight:600;font-size:20px;text-transform:uppercase;color:var(--ink);text-decoration:none}
.tpl-reuthu .rt-dir svg{width:28px;color:var(--accent)}
.tpl-reuthu .rt-msg{margin:20px auto 0;max-width:330px;font-size:14px;font-style:italic;color:var(--muted)}

/* ---- ảnh tràn viền ---- */
.tpl-reuthu .rt-ban{position:relative}
.tpl-reuthu .rt-ban .ph{display:block;width:100%;aspect-ratio:4/5;border-radius:0}
.tpl-reuthu .rt-ban-t{position:absolute;left:0;right:0;top:9%;margin:0;display:flex;flex-direction:column;padding:0 26px;font-family:var(--font-script);font-size:44px;line-height:1.1;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.35);pointer-events:none}
.tpl-reuthu .rt-ban-t span:last-child{align-self:flex-end}
.tpl-reuthu .rt-sp.ban{left:-26px;top:-40px;width:150px;z-index:2;transform:scaleX(-1) rotate(14deg)}

/* ---- polaroid cô dâu chú rể ---- */
.tpl-reuthu .rt-cpl{padding:48px 18px 36px}
.tpl-reuthu .rt-cpl-row{display:grid;grid-template-columns:58% 1fr;align-items:center;gap:8px}
.tpl-reuthu .rt-cpl-row.b{grid-template-columns:1fr 58%;margin-top:-26px}
.tpl-reuthu .rt-pol{padding:10px 10px 12px;background:var(--paper);box-shadow:0 8px 20px rgba(30,40,20,.18);transform:rotate(-6deg)}
.tpl-reuthu .rt-pol.b{transform:rotate(7deg)}
.tpl-reuthu .rt-pol .ph{display:block;width:100%;aspect-ratio:4/5;border-radius:0}
.tpl-reuthu .rt-who{margin:0;display:flex;flex-direction:column;font-family:var(--font-script);color:var(--rt-olive)}
.tpl-reuthu .rt-who span{font-size:30px;line-height:1.2}
.tpl-reuthu .rt-who b{font-weight:400;font-size:32px;line-height:1.2;color:var(--accent)}
.tpl-reuthu .rt-sp.cpl{right:-20px;top:46%;width:130px;z-index:2}
.tpl-reuthu .rt-story p{margin:0 auto 10px;max-width:380px;font-size:15px;line-height:1.85}

/* ---- lịch trên ảnh + đếm ngược ---- */
.tpl-reuthu .rt-calp{position:relative;padding:330px 20px 34px;background:var(--rt-env-dk) center top/100% auto no-repeat}
.tpl-reuthu .rt-calp::before{content:"";position:absolute;inset:0;background:linear-gradient(transparent 30%,color-mix(in srgb,var(--rt-env-dk) 85%,transparent) 62%,var(--rt-env-dk) 88%)}
.tpl-reuthu .rt-calbox{position:relative;width:100%;color:#fff}
.tpl-reuthu .rt-calh{display:flex;align-items:baseline;justify-content:flex-end;gap:10px;margin:0 6px 6px 0;font-family:var(--font-script);font-size:50px;line-height:1.1}
.tpl-reuthu .rt-calh small{font-family:var(--font-body);font-size:14px;letter-spacing:.2em}
.tpl-reuthu .rt-calbox .cal{width:100%}
.tpl-reuthu .rt-calbox .cal-grid{font-size:17px}
.tpl-reuthu .rt-calbox .cal-w{color:#fff!important;opacity:.7!important}
.tpl-reuthu .s-cal,.tpl-reuthu .rt-calbox{--cal-hi:var(--rt-red)}
.tpl-reuthu .cal-on{color:#fff}
.tpl-reuthu .rt-cals{margin:8px 0 0;text-align:center;font-size:13px;opacity:.85}
.tpl-reuthu .rt-cd{padding-top:40px;padding-bottom:30px}
.tpl-reuthu .rt-cdu{display:flex;justify-content:center;gap:10px;font-variant-numeric:tabular-nums}
.tpl-reuthu .rt-cdu span{display:flex;flex-direction:column;align-items:center;justify-content:center;width:62px;height:66px;border-radius:6px;background:var(--rt-olive);color:var(--accent-ink);box-shadow:0 4px 10px rgba(0,0,0,.12)}
.tpl-reuthu .rt-cdu b{font-weight:500;font-size:24px;line-height:1.1}
.tpl-reuthu .rt-cdu small{font-size:12px;opacity:.85}

/* ---- timeline ---- */
.tpl-reuthu .rt-tl{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);gap:26px 10px}
.tpl-reuthu .rt-tl li{display:flex;flex-direction:column;align-items:center}
.tpl-reuthu .rt-tl svg{width:70px;color:var(--ink);margin-bottom:6px}
.tpl-reuthu .rt-tl b{font-weight:500;font-size:19px;color:var(--rt-olive)}
.tpl-reuthu .rt-tl h3{margin:2px 0 4px;font-family:var(--font-body);font-weight:600;font-size:15px;line-height:1.3}
.tpl-reuthu .rt-tl p{margin:0;font-size:12.5px;line-height:1.45;color:var(--muted)}
.tpl-reuthu .rt-tl a{margin-top:6px;padding:3px 10px;border:1px solid var(--accent);border-radius:999px;font-size:12px;font-weight:600;color:var(--accent);text-decoration:none}

/* ---- album ---- */
.tpl-reuthu .rt-gal{position:relative;padding:20px 0 40px}
.tpl-reuthu .rt-quote{position:relative;display:grid;grid-template-columns:52% 1fr;align-items:center;gap:16px;padding:12px;background:var(--rt-olive);color:var(--accent-ink)}
.tpl-reuthu .rt-quote .ph{grid-column:auto;width:100%;aspect-ratio:1;border-radius:0}
.tpl-reuthu .rt-quote p{margin:0;font-family:var(--font-title);font-size:18px;line-height:1.5;text-align:center}
.tpl-reuthu .rt-sp.q{left:30%;bottom:-50px;width:120px;transform:rotate(-30deg);z-index:2}
.tpl-reuthu .rt-alb{display:flex;flex-direction:column;margin:56px 24px 22px;font-family:var(--font-title);font-weight:600;font-size:clamp(46px,14vw,62px);line-height:1;letter-spacing:.02em;text-transform:uppercase;color:var(--ink)}
.tpl-reuthu .rt-alb i{margin:6px 0 -14px 18%;font-family:var(--font-script);font-weight:400;font-size:48px;text-transform:none;color:var(--rt-olive)}
.tpl-reuthu .rt-alb span:last-child{align-self:flex-end;margin-right:12%}
.tpl-reuthu .rt-grid{columns:2;column-gap:10px;padding:0 12px}
.tpl-reuthu .rt-grid .ph{display:block;width:100%;margin:0 0 10px;break-inside:avoid;aspect-ratio:3/4;border-radius:0}
.tpl-reuthu .rt-grid .ph:nth-child(3n+1){aspect-ratio:3/4.6}
.tpl-reuthu .rt-grid .ph:nth-child(4n+2){aspect-ratio:4/3.4}

/* ---- biểu mẫu, mừng cưới, lưu bút ---- */
.tpl-reuthu .rt-note{margin:-6px auto 22px;max-width:340px;font-size:15px;color:var(--rt-olive)}
.tpl-reuthu .form{border-radius:4px;background:var(--paper);box-shadow:0 10px 26px rgba(30,40,20,.12)}
.tpl-reuthu .form input:not([type=radio]),.tpl-reuthu .form select,.tpl-reuthu .form textarea,.tpl-reuthu .choice label{border-radius:6px;background:#fff}
.tpl-reuthu .btn{border-radius:6px}
.tpl-reuthu .rt-box{display:block;width:90px;margin:-6px auto 18px;animation:rtSway 4s ease-in-out infinite;transform-origin:50% 100%}
.tpl-reuthu .gift{border-radius:6px;background:var(--paper);box-shadow:0 6px 18px rgba(30,40,20,.1)}
.tpl-reuthu .gift-who{font-family:var(--font-script);font-size:30px}
.tpl-reuthu .wish{border-radius:4px;background:var(--paper)}

/* ---- cảm ơn ---- */
.tpl-reuthu .rt-thx{position:relative;text-align:center}
.tpl-reuthu .rt-thx-in{position:relative;z-index:1;padding:40px 26px 0}
.tpl-reuthu .rt-sp.thx{left:-36px;top:-20px;width:140px;transform:scaleX(-1) rotate(10deg)}
.tpl-reuthu .rt-thx-t{margin:0 auto;max-width:340px;font-size:15px;line-height:1.8;color:var(--ink)}
.tpl-reuthu .rt-thx-b{margin:14px 0 0;font-family:var(--font-script);font-size:60px;line-height:1.1;color:var(--accent)}
.tpl-reuthu .rt-thx-n{margin:4px 0 0;font-family:var(--font-title);font-size:20px;color:var(--ink)}
.tpl-reuthu .rt-thx-ph{margin-top:-30px;aspect-ratio:4/5;background:center 30%/cover no-repeat;-webkit-mask:linear-gradient(transparent,#000 30%);mask:linear-gradient(transparent,#000 30%)}
.tpl-reuthu .credit{background:var(--bg)}

@media (prefers-reduced-motion:reduce){.tpl-reuthu *{animation:none!important}}
`,
};
