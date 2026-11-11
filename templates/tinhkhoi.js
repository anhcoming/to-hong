// Mẫu "Tinh Khôi" — tối giản dựa vào chữ: nền trắng, tên cô dâu chú rể thật lớn bằng serif tương phản cao (Bodoni),
// "WEDDING INVITATION" nhỏ, dòng ngày | thứ | giờ, ảnh đen trắng, một điểm nhấn chữ Hỷ đỏ nhỏ.
const { esc } = require('../lib/util');

const base = {
  '--font-title': "'Bodoni Moda',Didot,Georgia,serif",
  '--font-script': "'Pinyon Script',cursive",
  '--font-body': "'Bodoni Moda',Didot,Georgia,serif",
};

const pick = (d, i) => (d.photos.length ? d.photos[i % d.photos.length] : d.cover) || '';
const evList = (d) => d.events.filter((e) => e.name || e.place);
const up = (s) => esc(String(s || '').toLocaleUpperCase('vi'));
const gio = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  return `${+h} giờ ${m}`;
};

// chữ Hỷ (囍) tự vẽ bằng các khối chữ nhật — nét ngang trên cùng và nét "nhất" nối liền hai chữ Hỷ
const HY = (() => {
  const half = [[20, 0, 6, 22], [9, 17, 28, 5], [8, 26, 30, 5], [8, 37, 30, 5], [8, 26, 5, 16], [33, 26, 5, 16], [12, 46, 6, 7], [28, 46, 6, 7], [8, 64, 30, 5], [8, 81, 30, 5], [8, 64, 5, 22], [33, 64, 5, 22]];
  const rects = [...half, ...half.map(([x, y, w, h]) => [x + 54, y, w, h]), [3, 4, 94, 6], [2, 54, 96, 6]];
  return rects.map(([x, y, w, h]) => `M${x} ${y}h${w}v${h}h-${w}z`).join('');
})();
const hy = (cls) => `<svg class="${cls}" viewBox="0 0 100 86" aria-hidden="true"><path fill="currentColor" d="${HY}"/></svg>`;

module.exports = {
  id: 'tinhkhoi',
  name: 'Tinh Khôi',
  group: 'toigian',
  badge: 'Mới',
  desc: 'Tối giản trắng tinh: tên thật lớn bằng chữ serif, ảnh đen trắng và chữ Hỷ đỏ',
  fonts: 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Pinyon+Script&display=swap',
  palettes: [
    { id: 'trang-den', name: 'Trắng đen', swatch: ['#ffffff', '#0d0d0d'], vars: { ...base, '--page': '#ececea', '--bg': '#ffffff', '--paper': '#ffffff', '--ink': '#0d0d0d', '--muted': '#5e5e5e', '--accent': '#0d0d0d', '--accent-ink': '#ffffff', '--gold': '#0d0d0d', '--line': '#e2e2e2', '--tk-red': '#b3262c', '--tk-filter': 'grayscale(1) contrast(1.08)' } },
    { id: 'trang-do', name: 'Trắng đỏ', swatch: ['#fffdf9', '#8e1b20'], vars: { ...base, '--page': '#f1e9e4', '--bg': '#fffdf9', '--paper': '#ffffff', '--ink': '#2a1012', '--muted': '#7a5a5c', '--accent': '#8e1b20', '--accent-ink': '#ffffff', '--gold': '#8e1b20', '--line': '#efe1dc', '--tk-red': '#b3262c', '--tk-filter': 'grayscale(1) contrast(1.04) sepia(.08)' } },
  ],
  demo: {
    cover: '/demo/naudam-7.jpg',
    photos: [10, 5, 6, 9, 3, 4, 8].map((n) => `/demo/naudam-${n}.jpg`),
  },
  layout: ['photo', 'invite', 'families', 'party', 'calendar', 'events', 'gallery', 'wishes', 'rsvp', 'gift', 'thanks'],

  title(text, sub) {
    return `<h2 class="tk-h">${up(text)}</h2>${sub ? `<p class="tk-hsub">${esc(sub)}</p>` : ''}`;
  },

  // màn mở: tờ giấy trắng, dấu Hỷ đỏ; bấm thì khép lại như ống kính (thu tròn vào giữa)
  opener(ctx) {
    return `
<div class="opener tk-opener" id="opener" data-open-ms="1000">
  <div class="tk-oin">
    <span class="tk-seal">${hy('tk-hy')}</span>
    <p class="tk-ocap">Wedding Invitation</p>
    <p class="tk-onames">${up(ctx.g)} <i>&amp;</i> ${up(ctx.b)}</p>
    <p class="tk-oto">Kính gửi</p>
    <p class="tk-oguest">${ctx.guest ? esc(ctx.guest.name) : 'Quý Khách'}</p>
    <button class="tk-obtn" id="openBtn" type="button">Mở thiệp</button>
  </div>
</div>`;
  },

  // bìa: WEDDING INVITATION / vạch / TÊN & TÊN thật lớn / vạch / OUR WEDDING DAY / năm tháng ngày | thứ | giờ
  cover(ctx) {
    const p = ctx.dparts;
    const L = Math.max(ctx.g.length, ctx.b.length);
    const size = L <= 8 ? 50 : L <= 11 ? 42 : L <= 15 ? 34 : 28;
    return `
<header class="tk-cover">
  <p class="tk-cap">Wedding Invitation</p>
  <i class="tk-vline" aria-hidden="true"></i>
  <h1 class="tk-names" style="--tk-size:${size}px"><span>${up(ctx.g)}</span><i>&amp;</i><span>${up(ctx.b)}</span></h1>
  <i class="tk-vline b" aria-hidden="true"></i>
  <p class="tk-day">Our wedding day</p>
  ${p ? `<p class="tk-dline"><span>${p.y} ${p.m} ${p.d}</span><b>|</b><span>${up(ctx.weekday)}</span>${ctx.time ? `<b>|</b><span>${esc(ctx.time)}</span>` : ''}</p>` : ''}
  ${hy('tk-hy tk-chy')}
</header>`;
  },

  sections: {
    // ảnh đen trắng có khung mảnh, tên ngắn + ngày bên dưới
    photo(ctx) {
      const ph = ctx.d.photos.length ? ctx.d.photos[0] : '';
      if (!ph) return '';
      return `
  <section class="sec tk-photo reveal">
    <div class="tk-frame"><button class="ph" data-i="0" style="background-image:url('${esc(ph)}')" aria-label="Xem ảnh 1"></button></div>
    <p class="tk-pnames">${up(ctx.g)} &amp; ${up(ctx.b)}</p>
    ${ctx.dparts ? `<p class="tk-pdate">${esc(ctx.dmy)}</p>` : ''}
  </section>`;
    },

    // "Trân trọng kính mời" (chữ viết tay) + tên khách, chữ Hỷ đỏ, khung ngày | giờ
    invite(ctx) {
      const { d, guest } = ctx;
      const p = ctx.dparts;
      return `
  <section class="sec tk-invite">
    <div class="tk-to reveal">
      <p class="tk-script">${esc(d.inviteText)}</p>
      <p class="tk-guest">${guest ? esc(guest.name) : 'Quý Khách'}</p>
      ${hy('tk-hy tk-ihy')}
    </div>
    <p class="tk-caps reveal">Đến dự buổi tiệc chung vui cùng gia đình chúng tôi</p>
    ${p ? `<div class="tk-split reveal">
      <div><p class="a">${up(ctx.weekday)}</p><p class="k">Âm lịch</p><p class="b">${up(ctx.lunarShort)}</p></div>
      <div><p class="a">${p.d}.${p.m}.${p.y}</p><p class="k">Vào lúc</p><p class="b">${up(gio(d.time) || '—')}</p></div>
    </div>` : ''}
  </section>`;
    },

    // NHÀ TRAI / NHÀ GÁI chữ thật lớn canh phải, bố mẹ + địa chỉ nhỏ, tên đầy đủ hai bạn
    families(ctx) {
      const { d } = ctx;
      const fam = (x, label, role, full) => `
    <div class="tk-fam reveal">
      <h3>${label}</h3>
      ${x.father ? `<p>${up(x.father)}</p>` : ''}${x.mother ? `<p>${up(x.mother)}</p>` : ''}
      ${x.address ? `<p class="ad">${esc(x.address)}</p>` : ''}
      <p class="who"><span>${role}</span>${esc(full)}</p>
      <i></i>
    </div>`;
      return `
  <section class="sec tk-fams">
    ${fam(d.groom, 'Nhà Trai', 'Chú rể', d.groom.fullName || d.groom.name)}
    ${fam(d.bride, 'Nhà Gái', 'Cô dâu', d.bride.fullName || d.bride.name)}
  </section>`;
    },

    // lời mời dự tiệc, giờ + ngày, ảnh, đếm ngược ô đen, lời nhắn
    party(ctx) {
      const { d } = ctx;
      const p = ctx.dparts;
      const ph = pick(d, 1);
      const n = d.photos.length;
      const u = (k, l) => `<span><b data-cd="${k}">0</b><small>${l}</small></span>`;
      return `
  <section class="sec tk-party">
    <p class="tk-caps lg reveal">Kính mời quý khách<br>đến dự tiệc mừng lễ thành hôn của chúng tôi</p>
    ${p ? `<p class="tk-caps reveal">${d.time ? `Vào hồi ${up(d.time.replace(':', 'H'))}<br>` : ''}${up(ctx.weekday)} | ${p.d}. ${p.m}. ${p.y}</p>` : ''}
    ${n ? `<button class="ph tk-pph reveal" data-i="${1 % n}" style="background-image:url('${esc(ph)}')" aria-label="Xem ảnh"></button>` : ''}
    ${p && d.show.countdown ? `<div class="tk-cd reveal" role="timer">${u('d', 'Ngày')}${u('h', 'Giờ')}${u('m', 'Phút')}${u('s', 'Giây')}</div>` : ''}
    ${d.message ? `<p class="tk-caps reveal">${up(d.message)}</p>` : ''}
  </section>`;
    },

    // lịch tháng tối giản: ngày cưới khoanh tròn mảnh
    calendar(ctx, opts, h) {
      const p = ctx.dparts;
      if (!p || !ctx.d.show.calendar) return '';
      return `
  <section class="sec tk-cal reveal">
    ${h.calGrid(ctx, `<p class="tk-calhead"><span>Tháng</span><b>${String(+p.m).padStart(2, '0')}</b><span>${p.y}</span></p>`)}
  </section>`;
    },

    // lịch trình: giờ lớn bên trái, tên hoa có giãn chữ, nơi chốn, chỉ đường; ngăn bằng vạch mảnh
    events(ctx, opts, h) {
      const evs = evList(ctx.d);
      if (!evs.length) return '';
      const title = `Đám cưới ${ctx.g} & ${ctx.b}`;
      return `
  <section class="sec tk-events">
    <h2 class="tk-h">LỊCH TRÌNH</h2>
    <p class="tk-hsub">${esc(ctx.weekday)}, ${esc(ctx.dmy)}</p>
    <ol class="tk-tl">
    ${evs.map((e) => {
      const dir = e.mapUrl || (e.address ? h.mapSearch(e.address) : '');
      const other = e.date && e.date !== ctx.date;
      return `
      <li class="reveal">
        <p class="t">${esc(h.clock(e.time)) || '—'}</p>
        <div>
          <h3>${up(e.name)}</h3>
          ${other ? `<p class="dd">${esc(h.weekday(e.date))}, ${esc(h.dmy(e.date))}</p>` : ''}
          ${e.place ? `<p class="pl">${esc(e.place)}</p>` : ''}
          ${e.address ? `<p class="ad">${esc(e.address)}</p>` : ''}
          <p class="act">${dir ? `<a target="_blank" rel="noopener" href="${esc(dir)}">Chỉ đường</a>` : ''}${e.date ? `<a target="_blank" rel="noopener" href="${esc(h.calendarLink(`${e.name} — ${title}`, e.date, e.time, e.address || e.place))}">Lưu vào lịch</a>` : ''}</p>
        </div>
      </li>`;
    }).join('')}
    </ol>
  </section>`;
    },

    // album ba cột so le (cột giữa cao hơn, cột phải thấp xuống), ảnh đen trắng
    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      const RATIO = ['3/4.2', '4/5', '3/4', '1/1.3', '3/4.6', '4/5.4'];
      const cols = [[], [], []];
      ph.forEach((u, i) => cols[i % 3].push(`<button class="ph reveal" data-i="${i}" style="background-image:url('${esc(u)}');aspect-ratio:${RATIO[(i * 5 + Math.floor(i / 3)) % RATIO.length]}" aria-label="Xem ảnh ${i + 1}"></button>`));
      return `
  <section class="sec tk-gal">
    <h2 class="tk-h">ALBUM</h2>
    <div class="tk-cols">${cols.map((c) => `<div>${c.join('')}</div>`).join('')}</div>
  </section>`;
    },

    thanks(ctx) {
      const ph = ctx.d.cover || pick(ctx.d, 0);
      return `
  <section class="tk-thanks">
    <div class="tk-timg" style="background-image:url('${esc(ph)}')"></div>
    <div class="tk-tover reveal">
      <p class="tk-ty">Thank you,</p>
      <p class="tk-ty2">hẹn gặp bạn nhé!</p>
      <p class="tk-tnames">${up(ctx.g)} &amp; ${up(ctx.b)}</p>
    </div>
  </section>`;
    },
  },

  css: `
.tpl-tinhkhoi .card{background:var(--bg);color:var(--ink)}
.tpl-tinhkhoi .sec{padding:56px 26px}
.tpl-tinhkhoi .ph{border-radius:0;display:block;width:100%;grid-column:auto;aspect-ratio:auto;background-color:var(--line);filter:var(--tk-filter);transition:filter .6s}
.tk-hy{display:block;color:var(--tk-red)}

/* ---------- màn mở: thu tròn như ống kính ---------- */
.tk-opener{background:var(--bg);color:var(--ink);clip-path:circle(150% at 50% 50%);transition:clip-path 1s cubic-bezier(.7,0,.3,1),opacity .7s ease,visibility .7s}
.tk-opener.opening{clip-path:circle(0% at 50% 50%)}
.tk-oin{text-align:center;padding:24px}
.tk-seal{display:inline-grid;place-items:center;width:62px;height:62px;margin-bottom:26px;background:var(--tk-red);color:#fff;animation:tkSeal 3s ease-in-out infinite}
.tk-seal .tk-hy{width:40px;color:#fff}
@keyframes tkSeal{50%{transform:rotate(-4deg) scale(1.04)}}
.tk-ocap{margin:0;font-size:11px;font-weight:500;letter-spacing:.42em;text-transform:uppercase}
.tk-onames{margin:16px 0 30px;font-size:24px;letter-spacing:.06em}
.tk-onames i{font-style:normal;margin:0 6px}
.tk-oto{margin:0;font-family:var(--font-script);font-size:26px;color:var(--muted)}
.tk-oguest{margin:0 0 30px;font-size:22px;font-weight:600}
.tk-obtn{border:0;background:var(--accent);color:var(--accent-ink);padding:12px 32px;border-radius:999px;font-family:var(--font-body);font-size:12px;letter-spacing:.3em;text-transform:uppercase}

/* ---------- bìa ---------- */
.tk-cover{position:relative;min-height:100vh;min-height:min(100svh,820px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:34px 18px 40px;text-align:center}
.tk-cap{margin:0;font-size:14px;font-weight:500;letter-spacing:.34em;text-transform:uppercase;animation:tkIn 1.2s ease both}
.tk-vline{display:block;width:1px;height:96px;margin:30px 0;background:var(--ink);transform-origin:top;animation:tkDraw 1.4s cubic-bezier(.5,0,.2,1) .3s both}
.tk-vline.b{transform-origin:bottom;animation-delay:.9s}
@keyframes tkDraw{from{transform:scaleY(0)}}
@keyframes tkIn{from{opacity:0;letter-spacing:.6em}}
.tk-names{margin:0;font-weight:400;font-size:var(--tk-size,50px);line-height:1.12;letter-spacing:.04em;color:var(--accent)}
.tk-names span{display:block;animation:tkUp 1.2s cubic-bezier(.2,.7,.2,1) .5s both}
.tk-names span:last-child{animation-delay:.75s}
.tk-names i{display:block;font-style:normal;font-size:.62em;margin:6px 0 4px;animation:tkUp 1.2s ease .62s both}
@keyframes tkUp{from{opacity:0;transform:translateY(18px)}}
.tk-day{margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:.3em;text-transform:uppercase}
.tk-dline{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 12px;margin:0;font-size:17px;font-weight:500;letter-spacing:.14em}
.tk-dline b{font-weight:400}
.tk-chy{width:30px;margin-top:30px;animation:tkIn 1.4s ease 1.2s both}

/* ---------- chữ chung ---------- */
.tk-h{margin:0 0 8px;font-weight:600;font-size:26px;line-height:1.2;letter-spacing:.06em;color:var(--accent)}
.tk-hsub{margin:0 0 30px;font-size:13px;color:var(--muted);letter-spacing:.04em}
.tk-caps{margin:0 0 14px;font-size:13px;font-weight:500;letter-spacing:.12em;line-height:1.7;text-transform:uppercase}
.tk-caps.lg{font-size:15px;font-weight:600}

/* ---------- ảnh khung mảnh ---------- */
.tk-photo{padding-top:24px!important}
.tk-frame{padding:6px;border:1px solid var(--ink)}
.tk-frame .ph{aspect-ratio:3/4}
.tk-frame .ph:hover,.tk-gal .ph:hover{filter:none}
.tk-pnames{margin:22px 0 2px;font-size:24px;letter-spacing:.05em;color:var(--accent)}
.tk-pdate{margin:0;font-size:13px;font-weight:600;letter-spacing:.24em}

/* ---------- lời mời ---------- */
.tk-invite{padding-top:20px!important}
.tk-to{position:relative;text-align:left;padding:4px 70px 26px 0}
.tk-script{margin:0;font-family:var(--font-script);font-size:36px;line-height:1.2;color:var(--muted)}
.tk-guest{margin:2px 0 0 40px;font-size:24px;font-weight:700;line-height:1.3}
.tk-ihy{position:absolute;right:0;bottom:6px;width:62px;animation:tkSway 5s ease-in-out infinite}
@keyframes tkSway{50%{transform:rotate(-3deg)}}
.tk-invite .tk-caps{text-align:right;margin-top:12px}
.tk-split{display:grid;grid-template-columns:1fr 1fr;margin-left:auto;width:min(330px,100%)}
.tk-split>div{padding:2px 10px;text-align:center}
.tk-split>div:first-child{border-right:1px solid var(--ink)}
.tk-split p{margin:0}
.tk-split .a{font-size:16px;letter-spacing:.12em}
.tk-split .k{margin-top:6px!important;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
.tk-split .b{font-size:15px;white-space:nowrap;font-weight:700;letter-spacing:.04em}

/* ---------- hai họ ---------- */
.tk-fams{text-align:right;padding-top:30px!important}
.tk-fam{margin-bottom:36px}
.tk-fam h3{margin:0 0 6px;font-weight:400;font-size:48px;line-height:1.05;letter-spacing:.02em;text-transform:uppercase;color:var(--accent)}
.tk-fam p{margin:0;font-size:13px;letter-spacing:.06em;line-height:1.6}
.tk-fam .ad{color:var(--muted);font-size:13px;letter-spacing:.02em}
.tk-fam .who{margin-top:10px;font-size:17px;font-weight:600;letter-spacing:.02em}
.tk-fam .who span{display:block;font-size:10px;font-weight:500;letter-spacing:.28em;text-transform:uppercase;color:var(--muted)}
.tk-fam i{display:block;width:40px;height:1px;margin:16px 0 0 auto;background:var(--ink)}

/* ---------- tiệc ---------- */
.tk-party{padding-top:30px!important}
.tk-pph{width:76%!important;margin:18px auto 30px;aspect-ratio:2/3!important}
.tk-cd{display:flex;justify-content:center;gap:10px;margin-bottom:28px}
.tk-cd span{display:grid;justify-items:center;min-width:56px;padding:8px 6px 6px;border-radius:8px;background:var(--accent);color:var(--accent-ink)}
.tk-cd b{font-weight:500;font-size:19px;line-height:1.2;font-variant-numeric:tabular-nums}
.tk-cd small{font-size:10px;opacity:.85}

/* ---------- lịch tháng ---------- */
.tk-cal{padding-top:10px!important}
.tk-calhead{display:flex;align-items:baseline;justify-content:center;gap:12px;margin:0 0 16px}
.tk-calhead span{font-size:12px;letter-spacing:.3em;text-transform:uppercase}
.tk-calhead b{font-weight:400;font-size:44px;line-height:1}
.tpl-tinhkhoi .tk-cal{--cal-hi:var(--accent)}
.tpl-tinhkhoi .cal-grid .cal-w:last-of-type{color:var(--tk-red)}
.tpl-tinhkhoi .cal-on{color:var(--ink)}
.tpl-tinhkhoi .cal-on::before{-webkit-mask:none;mask:none;width:36px;height:36px;border:1px solid var(--accent);border-radius:50%;background:transparent;animation:none}
.tpl-tinhkhoi .cal-on::after{content:"";position:absolute;top:2px;right:6px;width:6px;height:6px;border-radius:50%;background:var(--tk-red)}
.tpl-tinhkhoi .cal-on b{margin:0}

/* ---------- lịch trình ---------- */
.tk-tl{list-style:none;margin:0 auto;padding:0;max-width:360px;text-align:left;border-top:1px solid var(--ink)}
.tk-tl li{display:grid;grid-template-columns:78px 1fr;gap:14px;padding:20px 0;border-bottom:1px solid var(--line)}
.tk-tl p{margin:0}
.tk-tl .t{font-size:26px;line-height:1.1}
.tk-tl h3{margin:4px 0 6px;font-weight:600;font-size:15px;letter-spacing:.14em}
.tk-tl .dd{font-size:12px;color:var(--muted)}
.tk-tl .pl{font-size:15px}
.tk-tl .ad{font-size:13px;color:var(--muted)}
.tk-tl .act{display:flex;flex-wrap:wrap;gap:4px 16px;margin-top:8px}
.tk-tl .act a{font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;text-decoration:none;border-bottom:1px solid currentColor}

/* ---------- album ba cột so le ---------- */
.tk-gal{padding-left:14px!important;padding-right:14px!important}
.tk-cols{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:22px}
.tk-cols>div{display:grid;gap:10px;align-content:start}
.tk-cols>div:nth-child(1){padding-top:22px}
.tk-cols>div:nth-child(3){padding-top:56px}

/* ---------- biểu mẫu, mừng cưới, lưu bút ---------- */
.tpl-tinhkhoi .sec-title{font-weight:600;font-size:24px;letter-spacing:.06em;text-transform:uppercase}
.tpl-tinhkhoi .form{border-radius:10px;border:1px dotted var(--ink)}
.tpl-tinhkhoi .form input:not([type=radio]),.tpl-tinhkhoi .form select,.tpl-tinhkhoi .form textarea,.tpl-tinhkhoi .choice label{border-radius:6px}
.tpl-tinhkhoi .btn{font-family:var(--font-body);font-weight:500;letter-spacing:.14em;text-transform:uppercase;font-size:12px}
.tpl-tinhkhoi .gift,.tpl-tinhkhoi .wish{border-radius:4px}
.tpl-tinhkhoi .gift-who{font-size:15px;font-weight:600;letter-spacing:.14em;text-transform:uppercase}
.tpl-tinhkhoi .wish b{letter-spacing:.04em}
.tpl-tinhkhoi .form-msg{color:var(--tk-red)}

/* ---------- cảm ơn ---------- */
.tk-thanks{position:relative;margin-top:40px}
.tk-timg{margin-top:-40px;aspect-ratio:3/4.2;background:center/cover no-repeat var(--line);filter:var(--tk-filter);-webkit-mask:linear-gradient(180deg,transparent 0,#000 30%);mask:linear-gradient(180deg,transparent 0,#000 30%)}
.tk-tover{position:relative;z-index:1;text-align:center}
.tk-ty{margin:0;font-family:var(--font-script);font-size:52px;line-height:1.1}
.tk-ty2{margin:0;font-family:var(--font-script);font-size:36px;color:var(--muted)}
.tk-tnames{margin:10px 0 0;font-size:13px;font-weight:600;letter-spacing:.24em}

@media (prefers-reduced-motion:reduce){.tpl-tinhkhoi .tk-cap,.tpl-tinhkhoi .tk-vline,.tpl-tinhkhoi .tk-names span,.tpl-tinhkhoi .tk-names i,.tpl-tinhkhoi .tk-chy,.tpl-tinhkhoi .tk-ihy,.tpl-tinhkhoi .tk-seal{animation:none}.tk-opener{transition:opacity .7s,visibility .7s}}
`,
};
