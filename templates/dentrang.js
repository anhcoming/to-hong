// Mẫu "Đen Trắng" — tạp chí đen trắng: ngày xếp dọc 20/12/26, ảnh tròn có vòng lệch, chữ serif mảnh,
// nhiều khoảng trắng; ảnh chuyển đen trắng (hoặc nâu sepia) bằng CSS, lịch trình dọc có biểu tượng nét mảnh.
const { esc } = require('../lib/util');

const base = {
  '--font-title': "'Noto Serif Display','Cormorant Garamond',Georgia,serif",
  '--font-script': "'Great Vibes',cursive",
  '--font-body': "'Be Vietnam Pro',system-ui,sans-serif",
};

const pick = (d, i) => (d.photos.length ? d.photos[i % d.photos.length] : d.cover) || '';
const evList = (d) => d.events.filter((e) => e.name || e.place);
function partyEvent(d) {
  const evs = evList(d);
  return evs.find((e) => /tiệc/i.test(e.name)) || evs[evs.length - 1] || null;
}
const hm = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  return `${+h}h${m !== '00' ? m : ''}`;
};
const WD_SHORT = { 'Chủ Nhật': 'CN', 'Thứ Hai': 'T2', 'Thứ Ba': 'T3', 'Thứ Tư': 'T4', 'Thứ Năm': 'T5', 'Thứ Sáu': 'T6', 'Thứ Bảy': 'T7' };

// biểu tượng nét mảnh cho lịch trình (tự vẽ)
const ICONS = {
  glass: '<path d="M14 6h12l-1 12a5 5 0 0 1-10 0z M20 23v14 M14 37h12"/><path d="M34 10h12l-1 12a5 5 0 0 1-10 0z M40 27v14 M34 41h12"/><path d="M16 12h8M36 16h8" opacity=".5"/><path d="M28 3l2 3M30 2l-2 4" stroke-width="1.2"/>',
  rings: '<circle cx="21" cy="28" r="11"/><circle cx="35" cy="28" r="11"/><path d="M17 13l4-6 4 6z" /><path d="M14 4l2 2M28 4l-2 2" stroke-width="1.2"/>',
  dine: '<circle cx="30" cy="24" r="12"/><circle cx="30" cy="24" r="7" opacity=".6"/><path d="M10 10v8a3 3 0 0 0 6 0v-8M13 10v30M48 10c-4 2-5 8-5 14h5v16"/>',
  heart: '<path d="M28 38C17 30 10 24 10 17a8 8 0 0 1 18-4 8 8 0 0 1 18 4c0 7-7 13-18 21z"/>',
};
const icon = (name) => `<svg class="dt-ic" viewBox="0 0 56 44" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
const iconFor = (e, i) => (/đón|khách|chào/i.test(e.name) ? 'glass' : /tiệc|tiec|ăn/i.test(e.name) ? 'dine' : /lễ|cưới|hôn|vu quy/i.test(e.name) ? 'rings' : ['glass', 'rings', 'dine', 'heart'][i % 4]);
const FLOURISH = '<svg class="dt-flo" viewBox="0 0 300 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><path d="M10 12h112M178 12h112"/><circle cx="8" cy="12" r="2.4" fill="currentColor"/><circle cx="292" cy="12" r="2.4" fill="currentColor"/><path d="M122 12c8-10 20-10 22-2 2 6-6 8-8 3M178 12c-8-10-20-10-22-2-2 6 6 8 8 3M122 12c8 10 20 10 22 2M178 12c-8 10-20 10-22 2"/><circle cx="150" cy="12" r="3" fill="currentColor"/></svg>';

module.exports = {
  id: 'dentrang',
  name: 'Đen Trắng',
  group: 'toigian',
  badge: 'Mới',
  desc: 'Tạp chí đen trắng: ngày xếp dọc, ảnh tròn, chữ serif mảnh và nhiều khoảng trắng',
  fonts: 'https://fonts.googleapis.com/css2?family=Noto+Serif+Display:ital,wght@0,200;0,300;0,400;1,300&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;1,300&family=Great+Vibes&display=swap',
  palettes: [
    { id: 'den-trang', name: 'Đen trắng', swatch: ['#ffffff', '#111111'], vars: { ...base, '--page': '#e6e6e4', '--bg': '#ffffff', '--paper': '#ffffff', '--ink': '#141414', '--muted': '#6e6e6e', '--accent': '#141414', '--accent-ink': '#ffffff', '--gold': '#8a8a8a', '--line': '#dddddd', '--dt-filter': 'grayscale(1) contrast(1.06)', '--dt-box': '#5c5c5c' } },
    { id: 'nau-sepia', name: 'Nâu sepia', swatch: ['#f5efe4', '#4a3423'], vars: { ...base, '--page': '#e7ddcf', '--bg': '#f8f3ea', '--paper': '#fffcf6', '--ink': '#3a2a1e', '--muted': '#86735f', '--accent': '#4a3423', '--accent-ink': '#fff8ee', '--gold': '#a88b6a', '--line': '#e3d7c6', '--dt-filter': 'grayscale(1) sepia(.5) contrast(1.02) brightness(1.02)', '--dt-box': '#7a6048' } },
  ],
  demo: {
    cover: '/demo/nau-4.jpg',
    photos: [6, 2, 1, 8, 5, 7, 3].map((n) => `/demo/nau-${n}.jpg`),
  },
  layout: ['note', 'invite', 'details', 'calendar', 'events', 'gallery', 'rsvp', 'gift', 'wishes', 'thanks'],

  title(text, sub) {
    return `<h2 class="dt-h">${esc(text)}</h2>${sub ? `<p class="dt-hsub">${esc(sub)}</p>` : ''}`;
  },

  // màn mở: tờ thiệp trắng gấp đôi, ngày xếp dọc, chạm để mở hai cánh
  opener(ctx) {
    const p = ctx.dparts;
    return `
<div class="opener dt-opener" id="opener" data-open-ms="1200">
  <i class="dt-door l" aria-hidden="true"></i><i class="dt-door r" aria-hidden="true"></i>
  <div class="dt-oin">
    ${p ? `<p class="dt-odate"><span>${p.d}</span><span>${p.m}</span><span>${p.y.slice(2)}</span></p>` : ''}
    <p class="dt-olab">Thư mời cưới</p>
    <p class="dt-onames">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
    <p class="dt-oto">Kính gửi<b>${ctx.guest ? esc(ctx.guest.name) : 'Quý khách'}</b></p>
    <button class="dt-obtn" id="openBtn" type="button">Mở thiệp</button>
  </div>
</div>`;
  },

  // bìa: cột ngày xếp dọc + vạch đứng, ảnh tròn lệch có vòng tròn mảnh, tên lớn canh phải
  cover(ctx) {
    const p = ctx.dparts;
    const cover = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="dt-cover">
  <div class="dt-top">
    ${p ? `<p class="dt-stack" aria-label="${esc(ctx.dmy)}"><span>${p.d}</span><span>${p.m}</span><span>${p.y.slice(2)}</span></p>` : '<p class="dt-stack"></p>'}
    <div class="dt-round">
      <i class="dt-ring" aria-hidden="true"></i>
      <div class="dt-circle"><img src="${esc(cover)}" alt="Ảnh cưới"></div>
      <i class="dt-hl" aria-hidden="true"></i><i class="dt-vl" aria-hidden="true"></i>
    </div>
  </div>
  <h1 class="dt-names"><span>${esc(ctx.g)} &amp;</span><span>${esc(ctx.b)}</span></h1>
  <p class="dt-lab">Ngày Chung Đôi</p>
  ${p ? `<p class="dt-date">${p.d}<i>/</i>${p.m}<i>/</i>${p.y}</p>` : ''}
</header>`;
  },

  sections: {
    // lời ngỏ (câu chuyện) bên phải, hai ảnh nhỏ so le bên trái, rồi nét hoa văn mảnh
    note(ctx) {
      const { d } = ctx;
      const text = d.story || d.message;
      if (!text && !d.photos.length) return '';
      const n = d.photos.length;
      return `
  <section class="sec dt-note">
    <div class="dt-notegrid reveal">
      ${n ? `<div class="dt-duo"><button class="ph" data-i="${1 % n}" style="background-image:url('${esc(pick(d, 1))}')" aria-label="Xem ảnh"></button><button class="ph" data-i="${2 % n}" style="background-image:url('${esc(pick(d, 2))}')" aria-label="Xem ảnh"></button></div>` : ''}
      <div class="dt-notetxt">${(text || '').split(/\n+/).filter(Boolean).map((t) => `<p>${esc(t)}</p>`).join('')}</div>
    </div>
    <div class="reveal">${FLOURISH}</div>
  </section>`;
    },

    // "Thư mời cưới": vạch đứng bên trái, hai họ, ảnh dọc bên phải; rồi lời mời có tên khách
    invite(ctx) {
      const { d, guest } = ctx;
      const fam = (x, label) => `<div class="dt-fam"><p class="k">${label}</p>${x.father ? `<p>${esc(x.father)}</p>` : ''}${x.mother ? `<p>${esc(x.mother)}</p>` : ''}${x.address ? `<p class="a">${esc(x.address)}</p>` : ''}</div>`;
      const ph = pick(d, 0);
      return `
  <section class="sec dt-invite">
    <div class="dt-letter reveal">
      <div class="dt-lcol">
        <h2 class="dt-lh">Thư mời cưới</h2>
        ${fam(d.groom, 'Nhà Trai')}
        ${fam(d.bride, 'Nhà Gái')}
      </div>
      ${ph ? `<button class="ph dt-lph" data-i="0" style="background-image:url('${esc(ph)}')" aria-label="Xem ảnh 1"></button>` : ''}
    </div>
    <div class="dt-guest reveal">
      <p class="dt-small">${esc(d.inviteText)}</p>
      <p class="dt-gname">${guest ? esc(guest.name) : 'Quý khách'}</p>
      <p class="dt-small">tới dự buổi tiệc chung vui cùng gia đình chúng tôi</p>
      <div class="dt-pair">
        <div><p class="r">Chú rể</p><p class="n">${esc(d.groom.fullName || d.groom.name)}</p></div>
        <i aria-hidden="true"></i>
        <div><p class="r">Cô dâu</p><p class="n">${esc(d.bride.fullName || d.bride.name)}</p></div>
      </div>
    </div>
  </section>`;
    },

    // ảnh trái, tên + giờ + ngày + âm lịch + nơi tổ chức bên phải
    details(ctx) {
      const { d } = ctx;
      const p = ctx.dparts;
      const ev = partyEvent(d);
      const ph = pick(d, 3);
      if (!p) return '';
      return `
  <section class="sec dt-details reveal">
    ${ph ? `<button class="ph dt-dph" data-i="${3 % Math.max(1, d.photos.length)}" style="background-image:url('${esc(ph)}')" aria-label="Xem ảnh"></button>` : ''}
    <div class="dt-dtxt">
      <p class="dt-dnames">${esc(ctx.g)} &amp;<br>${esc(ctx.b)}</p>
      <p>${esc(WD_SHORT[ctx.weekday] || ctx.weekday)}${d.time ? ` – ${esc(hm(d.time))}` : ''}</p>
      <p>${p.d} / ${p.m} / ${p.y}</p>
      <p>${esc(ctx.lunar.replace(/^Nhằm /i, 'Nhằm '))}</p>
      ${ev && ev.place ? `<p>Tại ${esc(ev.place)}</p>` : ''}
    </div>
  </section>`;
    },

    // đếm ngược ô xám + lịch tháng khoanh tròn
    calendar(ctx, opts, h) {
      const p = ctx.dparts;
      const { show } = ctx.d;
      if (!p || (!show.calendar && !show.countdown)) return '';
      const u = (k, l) => `<span><b data-cd="${k}">0</b><small>${l}</small></span>`;
      return `
  <section class="sec dt-cal reveal">
    ${show.countdown ? `<div class="dt-cd" role="timer">${u('d', 'Ngày')}${u('h', 'Giờ')}${u('m', 'Phút')}${u('s', 'Giây')}</div>` : ''}
    ${show.calendar ? h.calGrid(ctx, `<p class="dt-calhead"><span>Tháng ${p.m}</span><i></i><span>${p.y}</span></p>`) : ''}
    <p class="dt-calsub">${esc(ctx.weekday)} · âm lịch ${esc(ctx.lunarShort)}</p>
  </section>`;
    },

    // lịch trình dọc: biểu tượng nét mảnh bên trái, chấm xám trên vạch giữa, giờ + tên bên phải
    events(ctx, opts, h) {
      const evs = evList(ctx.d);
      if (!evs.length) return '';
      const title = `Đám cưới ${ctx.g} & ${ctx.b}`;
      return `
  <section class="sec dt-events">
    <h2 class="dt-h">Lịch trình</h2>
    <p class="dt-hsub">${esc(ctx.weekday)}, ${esc(ctx.dmy)}</p>
    <ol class="dt-tl">
    ${evs.map((e, i) => {
      const dir = e.mapUrl || (e.address ? h.mapSearch(e.address) : '');
      const other = e.date && e.date !== ctx.date;
      return `
      <li class="reveal">
        <div class="dt-tli">${icon(iconFor(e, i))}</div>
        <i class="dt-dot" aria-hidden="true"></i>
        <div class="dt-tlb">
          <p class="t">${esc(hm(e.time)) || '—'}${other ? ` · ${esc(h.dmy(e.date))}` : ''} :</p>
          <h3>${esc(e.name)}</h3>
          ${e.place ? `<p class="pl">${esc(e.place)}</p>` : ''}
          ${e.address ? `<p class="ad">${esc(e.address)}</p>` : ''}
          <p class="act">${dir ? `<a target="_blank" rel="noopener" href="${esc(dir)}">Chỉ đường</a>` : ''}${e.date ? `<a target="_blank" rel="noopener" href="${esc(h.calendarLink(`${e.name} — ${title}`, e.date, e.time, e.address || e.place))}">Lưu vào lịch</a>` : ''}</p>
        </div>
      </li>`;
    }).join('')}
    </ol>
  </section>`;
    },

    // album đen trắng: ô cao bên trái, hai ô vuông bên phải, ảnh ngang tràn — lặp lại; số thứ tự N°
    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      return `
  <section class="sec dt-gal">
    <h2 class="dt-h">Album</h2>
    <p class="dt-hsub">Những khung hình đen trắng của chúng mình</p>
    <div class="dt-grid">
      ${ph.map((u, i) => `<button class="ph reveal" data-i="${i}" style="background-image:url('${esc(u)}')" aria-label="Xem ảnh ${i + 1}"><span>N°${String(i + 1).padStart(2, '0')}</span></button>`).join('')}
    </div>
  </section>`;
    },

    thanks(ctx) {
      const ph = ctx.d.cover || pick(ctx.d, 0);
      return `
  <section class="dt-thanks">
    <p class="dt-ty reveal">Cảm ơn bạn đã đến chung vui cùng chúng tôi</p>
    <div class="dt-tphoto reveal" style="background-image:url('${esc(ph)}')">
      <p><span>${esc(ctx.g)}</span><i>&amp;</i><span>${esc(ctx.b)}</span></p>
    </div>
  </section>`;
    },
  },

  css: `
.tpl-dentrang{font-weight:300}
.tpl-dentrang .card{background:var(--bg);color:var(--ink)}
.tpl-dentrang .sec{padding:56px 26px}
.tpl-dentrang .ph,.dt-circle img,.dt-tphoto{filter:var(--dt-filter)}
.tpl-dentrang .ph{border-radius:0;background-color:var(--line);display:block;width:100%;grid-column:auto;aspect-ratio:auto}

/* ---------- màn mở: hai cánh trắng ---------- */
.dt-opener{background:transparent}
.dt-door{position:absolute;top:0;bottom:0;width:50.5%;background:var(--bg);transition:transform 1s cubic-bezier(.7,0,.25,1) .2s}
.dt-door.l{left:0;border-right:1px solid var(--line)}
.dt-door.r{right:0}
.dt-opener.opening .dt-door.l{transform:translateX(-101%)}
.dt-opener.opening .dt-door.r{transform:translateX(101%)}
.dt-oin{position:relative;text-align:center;color:var(--ink);padding:24px;transition:opacity .35s}
.dt-opener.opening .dt-oin{opacity:0}
.dt-odate{display:inline-flex;flex-direction:column;margin:0 0 18px;padding:0 22px 14px 0;border-right:1px solid var(--ink);font-family:var(--font-title);font-weight:200;font-size:48px;line-height:1;text-align:left}
.dt-olab{margin:0;font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:var(--muted)}
.dt-onames{margin:8px 0 26px;font-family:var(--font-title);font-weight:300;font-size:30px}
.dt-oto{margin:0 0 26px;font-size:13px;color:var(--muted)}
.dt-oto b{display:block;margin-top:4px;font-family:var(--font-title);font-weight:400;font-style:italic;font-size:22px;color:var(--ink)}
.dt-obtn{border:1px solid var(--ink);background:transparent;color:var(--ink);padding:11px 30px;font-size:11px;letter-spacing:.3em;text-transform:uppercase;animation:dtPulse 2.6s ease-in-out infinite}
@keyframes dtPulse{50%{background:var(--ink);color:var(--bg)}}

/* ---------- bìa ---------- */
.dt-cover{position:relative;min-height:100vh;min-height:min(100svh,780px);padding:30px 26px 40px;display:flex;flex-direction:column}
.dt-top{display:grid;grid-template-columns:auto 1fr}
.dt-stack{display:flex;flex-direction:column;align-self:start;margin:0;padding:6px 24px 70px 4px;border-right:1px solid var(--ink);font-family:var(--font-title);font-weight:200;font-size:64px;line-height:.98;transform-origin:top;animation:dtDraw 1.4s ease both}
.dt-stack span{animation:dtFade 1s ease both}
.dt-stack span:nth-child(2){animation-delay:.2s}.dt-stack span:nth-child(3){animation-delay:.4s}
@keyframes dtFade{from{opacity:0;transform:translateY(12px)}}
@keyframes dtDraw{from{border-right-color:transparent}}
.dt-round{position:relative;margin:clamp(100px,17vh,190px) 0 0 auto;width:190px;height:190px}
.dt-ring{position:absolute;left:-36px;top:-14px;width:168px;height:168px;border:1px solid var(--ink);border-radius:50%;animation:dtDrift 9s ease-in-out infinite alternate}
@keyframes dtDrift{to{transform:translate(8px,6px)}}
.dt-circle{position:absolute;inset:0;border-radius:50%;overflow:hidden;background:var(--line)}
.dt-circle img{width:100%;height:100%;object-fit:cover;object-position:center 25%;animation:dtZoom 16s ease-in-out infinite alternate}
@keyframes dtZoom{to{transform:scale(1.1)}}
.dt-hl{position:absolute;left:-44px;top:168px;width:120px;height:1px;background:var(--ink)}
.dt-vl{position:absolute;left:104px;top:168px;width:1px;height:56px;background:var(--ink)}
.dt-names{margin:auto 0 0;padding-top:40px;text-align:right;font-family:var(--font-title);font-weight:300;font-size:50px;line-height:1.22;letter-spacing:-.005em}
.dt-names span{display:block;animation:dtFade 1.2s ease .5s both}
.dt-names span:nth-child(2){animation-delay:.7s}
.dt-lab{margin:18px 0 6px;text-align:right;font-size:15px;letter-spacing:.04em}
.dt-date{margin:0;text-align:right;font-family:var(--font-title);font-weight:400;font-size:18px;letter-spacing:.06em}
.dt-date i{font-style:normal;margin:0 8px;color:var(--muted)}

/* ---------- chữ chung ---------- */
.dt-h{margin:0 0 8px;font-family:var(--font-title);font-weight:300;font-size:30px;letter-spacing:.02em;text-transform:uppercase}
.dt-hsub{margin:0 0 30px;font-size:13px;color:var(--muted)}
.dt-small{margin:0;font-size:13px;letter-spacing:.06em;color:var(--muted)}

/* ---------- lời ngỏ ---------- */
.dt-notegrid{display:grid;grid-template-columns:44% 1fr;gap:18px;align-items:start;text-align:justify}
.dt-duo{position:relative;height:200px}
.dt-duo .ph{position:absolute;width:62%;aspect-ratio:1}
.dt-duo .ph:first-child{left:0;top:0}
.dt-duo .ph:last-child{right:0;bottom:0}
.dt-notetxt{font-size:13px;line-height:1.55;font-style:italic}
.dt-notetxt p{margin:0 0 10px}
.dt-flo{display:block;width:84%;margin:30px auto 0;color:var(--muted)}

/* ---------- thư mời ---------- */
.dt-letter{display:grid;grid-template-columns:1fr 46%;gap:16px;align-items:start;text-align:left}
.dt-lcol{border-left:1px solid var(--ink);padding:0 0 4px 12px}
.dt-lh{margin:0 0 24px;padding-top:30px;font-family:var(--font-title);font-weight:300;font-size:21px;letter-spacing:.04em;text-transform:uppercase}
.dt-fam{margin-bottom:20px;font-size:14px;line-height:1.45}
.dt-fam p{margin:0}
.dt-fam .k{font-family:var(--font-title);font-size:16px;font-weight:400;margin-bottom:2px}
.dt-fam .a{font-size:12px;color:var(--muted);margin-top:2px}
.dt-letter .dt-lph{aspect-ratio:3/4.4;margin-top:-10px}
.dt-guest{margin-top:46px}
.dt-gname{margin:6px 0;font-family:var(--font-title);font-weight:300;font-style:italic;font-size:30px;line-height:1.25}
.dt-pair{display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:center;margin-top:30px}
.dt-pair p{margin:0}
.dt-pair .r{font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:var(--muted)}
.dt-pair .n{font-family:var(--font-title);font-weight:400;font-size:17px;line-height:1.3}
.dt-pair i{width:1px;height:44px;background:var(--ink)}

/* ---------- chi tiết ---------- */
.dt-details{display:grid;grid-template-columns:44% 1fr;gap:18px;align-items:center;padding-top:20px!important}
.dt-details .dt-dph{aspect-ratio:3/4}
.dt-dtxt{text-align:right;font-size:13px;line-height:1.5}
.dt-dtxt p{margin:0}
.dt-dnames{margin-bottom:10px!important;font-family:var(--font-title);font-weight:300;font-size:30px;line-height:1.2}

/* ---------- đếm ngược + lịch ---------- */
.dt-cd{display:flex;justify-content:center;gap:10px;margin-bottom:40px}
.dt-cd span{display:grid;justify-items:center;width:58px;padding:9px 0 7px;background:var(--dt-box);color:#fff}
.dt-cd b{font-weight:400;font-size:20px;line-height:1.2;font-variant-numeric:tabular-nums}
.dt-cd small{font-size:10px;opacity:.85}
.dt-calhead{display:flex;align-items:center;justify-content:center;gap:14px;margin:0 0 14px;font-family:var(--font-title);font-weight:300;font-size:20px;letter-spacing:.1em;text-transform:uppercase}
.dt-calhead i{width:24px;height:1px;background:var(--ink)}
.tpl-dentrang .s-cal,.tpl-dentrang .dt-cal{--cal-hi:var(--ink);--cal-on:var(--bg)}
.tpl-dentrang .cal-grid{font-weight:300}
.tpl-dentrang .cal-grid .cal-w:last-of-type{color:var(--ink)}
.tpl-dentrang .cal-on::before{-webkit-mask:none;mask:none;width:34px;height:34px;border-radius:50%;animation:none}
.tpl-dentrang .cal-on::after{content:"";position:absolute;width:42px;height:42px;border:1px solid var(--ink);border-radius:50%;animation:dtRing 2.4s ease-in-out infinite}
@keyframes dtRing{50%{transform:scale(1.12);opacity:.4}}
.tpl-dentrang .cal-on b{margin:0;font-weight:400}
.dt-calsub{margin:18px 0 0;font-size:12px;color:var(--muted)}

/* ---------- lịch trình dọc ---------- */
.dt-tl{list-style:none;margin:10px auto 0;padding:0;max-width:340px;position:relative}
.dt-tl::before{content:"";position:absolute;left:96px;top:0;bottom:0;width:1.5px;background:color-mix(in srgb,var(--ink) 40%,transparent)}
.dt-tl li{display:grid;grid-template-columns:80px 32px 1fr;align-items:start;text-align:left;padding:20px 0 34px}
.dt-tli{color:var(--ink);text-align:right;padding-top:2px}
.dt-ic{width:64px;height:50px}
.dt-dot{width:22px;height:22px;margin:12px 0 0 5px;border-radius:50%;background:#a3a3a3;box-shadow:0 0 0 5px var(--bg)}
.dt-tlb{padding-left:12px}
.dt-tlb p{margin:0}
.dt-tlb .t{font-family:var(--font-title);font-size:20px;font-weight:400}
.dt-tlb h3{margin:2px 0 6px;font-family:var(--font-title);font-weight:300;font-size:21px;line-height:1.25}
.dt-tlb .pl{font-size:14px;font-weight:400}
.dt-tlb .ad{font-size:13px;color:var(--muted)}
.dt-tlb .act{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:8px}
.dt-tlb .act a{font-size:11px;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;border-bottom:1px solid currentColor;padding-bottom:1px}

/* ---------- album ---------- */
.dt-gal{padding-left:16px!important;padding-right:16px!important}
.dt-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;grid-auto-flow:dense}
.dt-grid .ph{position:relative;aspect-ratio:1}
.dt-grid .ph:nth-child(4n+1){grid-row:span 2;aspect-ratio:auto;height:100%;min-height:200px}
.dt-grid .ph:nth-child(4n){grid-column:1/-1;aspect-ratio:16/11}
.dt-grid .ph span{position:absolute;left:8px;bottom:6px;font-family:var(--font-title);font-size:12px;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.6)}
.dt-grid .ph:last-child:nth-child(4n+1){grid-column:1/-1;grid-row:auto;aspect-ratio:4/3;height:auto}
.dt-grid .ph:last-child:nth-child(4n+2){grid-row:span 2;aspect-ratio:auto;height:100%}

/* ---------- biểu mẫu, mừng cưới, lưu bút ---------- */
.tpl-dentrang .sec-title{font-family:var(--font-title);font-weight:300;font-size:26px;text-transform:uppercase;letter-spacing:.02em;color:var(--ink)}
.tpl-dentrang .form{border-radius:4px;border:0;box-shadow:0 4px 22px rgba(0,0,0,.14);padding:28px 20px}
.tpl-dentrang .form input:not([type=radio]),.tpl-dentrang .form select,.tpl-dentrang .form textarea,.tpl-dentrang .choice label{border-radius:4px}
.tpl-dentrang .btn{border-radius:2px;background:var(--dt-box);border-color:var(--dt-box);font-weight:400;letter-spacing:.08em}
.tpl-dentrang .form-msg{color:var(--ink)}
.tpl-dentrang .gift,.tpl-dentrang .wish{border-radius:0}
.tpl-dentrang .gift-who{font-weight:300;color:var(--ink);text-transform:uppercase;letter-spacing:.08em;font-size:16px}
.tpl-dentrang .gift img{filter:none}
.tpl-dentrang .wish b{color:var(--ink);font-weight:500}
.tpl-dentrang .copy{color:var(--ink)}

/* ---------- cảm ơn ---------- */
.dt-thanks{padding-top:40px;text-align:center}
.dt-ty{margin:0 18px 30px;font-family:var(--font-script);font-size:30px;line-height:1.3}
.dt-tphoto{position:relative;aspect-ratio:3/4;background:center 25%/cover no-repeat var(--line)}
.dt-tphoto p{position:absolute;left:0;right:0;bottom:22px;margin:0;color:#fff;font-family:var(--font-title);font-weight:300;font-size:26px;letter-spacing:.06em;text-transform:uppercase;text-shadow:0 1px 10px rgba(0,0,0,.4)}
.dt-tphoto p i{font-style:normal;margin:0 10px;font-size:20px}
.tpl-dentrang .credit{padding-top:22px}

@media (prefers-reduced-motion:reduce){.tpl-dentrang .dt-stack,.tpl-dentrang .dt-stack span,.tpl-dentrang .dt-names span,.tpl-dentrang .dt-ring,.tpl-dentrang .dt-circle img,.tpl-dentrang .cal-on::after,.tpl-dentrang .dt-obtn{animation:none}.dt-door,.dt-oin{transition:none}}
`,
};
