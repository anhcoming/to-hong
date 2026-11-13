// Mẫu "Rồng Ngọc" — hoàng gia phương Đông: nền xanh ngọc rêu phủ gấm rồng phượng vàng, hai khung ảnh tròn
// cho chú rể / cô dâu kèm tên bố mẹ, album trượt có dải ảnh nhỏ. Hoạ tiết vẽ bằng SVG (templates/_orn.js + tự vẽ).
const { esc } = require('../lib/util');
const orn = require('./_orn');

const evList = (d) => d.events.filter((e) => e.name || e.place);
function partyEvent(d) {
  const evs = evList(d);
  return evs.find((e) => /tiệc cưới|khai tiệc/i.test(e.name)) || evs.find((e) => /tiệc/i.test(e.name)) || evs[evs.length - 1] || null;
}
const strip = (s) => (s || '').replace(/^(Ông|Bà)\s+/i, '');
const lunarOf = (s) => (s || '').replace(/^Nhằm /i, '');

// đặt một hình SVG của _orn vào ô gấm (svg lồng nhau)
const place = (svg, x, y, w, h, tf = '') => `<g transform="translate(${x} ${y})${tf}">${svg.replace('<svg ', `<svg x="0" y="0" width="${w}" height="${h}" `)}</g>`;

// nền gấm rồng phượng: một ô 220×220 lặp lại (rồng, phượng, mây, đồng tiền)
function brocade(id) {
  const gold = 'var(--rn-pat)', dark = 'rgba(0,0,0,.35)';
  const coin = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${gold}" stroke-width="1.4"/><rect x="${x - r * 0.35}" y="${y - r * 0.35}" width="${r * 0.7}" height="${r * 0.7}" fill="none" stroke="${gold}" stroke-width="1.2" transform="rotate(45 ${x} ${y})"/>`;
  const tile = place(orn.dragon('', { gold, dark }), 4, 8, 150, 101)
    + place(orn.phoenix('', { gold, dark }), 214, 112, 150, 101, ' scale(-1 1)')
    + place(orn.cloud('', { stroke: gold, w: 2.4 }), 150, 6, 64, 34)
    + place(orn.cloud('', { stroke: gold, w: 2.4 }), 6, 160, 60, 32)
    + coin(190, 70, 10) + coin(84, 196, 8) + coin(30, 120, 5);
  return `<svg class="rn-brocade" aria-hidden="true" width="100%" height="100%"><defs><pattern id="${id}" width="220" height="220" patternUnits="userSpaceOnUse" patternTransform="scale(.78) rotate(-4)">${tile}</pattern></defs><rect width="100%" height="100%" fill="url(#${id})"/></svg>`;
}

// huy hiệu rồng phượng tròn (dấu niêm phong, khung lời cảm ơn)
function medallion(cls) {
  let rays = '';
  for (let k = 0; k < 24; k++) { const a = (k * 15) * Math.PI / 180; rays += `M${(60 + Math.cos(a) * 44).toFixed(1)} ${(60 + Math.sin(a) * 44).toFixed(1)}L${(60 + Math.cos(a) * 50).toFixed(1)} ${(60 + Math.sin(a) * 50).toFixed(1)}`; }
  return `<svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true">
<circle cx="60" cy="60" r="57" fill="var(--rn-seal,var(--gold))"/><circle cx="60" cy="60" r="52" fill="none" stroke="var(--rn-seal-ink,var(--rn-deep))" stroke-width="1.6"/>
<path d="${rays}" stroke="var(--rn-seal-ink,var(--rn-deep))" stroke-width="1.6"/>
<circle cx="60" cy="60" r="40" fill="none" stroke="var(--rn-seal-ink,var(--rn-deep))" stroke-width="1"/>
<text x="60" y="76" text-anchor="middle" font-size="44" font-weight="700" fill="var(--rn-seal-ink,var(--rn-deep))" font-family="'Noto Serif SC','Songti SC',serif">囍</text></svg>`;
}

const base = {
  '--font-title': "'Playfair Display',Georgia,serif",
  '--font-script': "'Dancing Script',cursive",
  '--font-body': "'Be Vietnam Pro',system-ui,sans-serif",
};

module.exports = {
  id: 'rongngoc',
  name: 'Rồng Ngọc',
  group: 'hoanggia',
  badge: 'Mới',
  desc: 'Gấm rồng phượng vàng trên nền xanh ngọc rêu, khung ảnh tròn đôi uy nghi',
  fonts: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600;1,700&family=Dancing+Script:wght@600;700&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap',
  palettes: [
    { id: 'xanh-reu', name: 'Xanh ngọc rêu', swatch: ['#1f3d2c', '#c9a75c'], vars: { ...base, '--page': '#d8cfc1', '--bg': '#ede4d9', '--paper': '#f7f1e8', '--ink': '#22332a', '--muted': '#6b6a5e', '--accent': '#23492f', '--accent-ink': '#f3e7c9', '--gold': '#c3a057', '--line': '#d8cab5', '--rn-deep': '#1b3626', '--rn-mid': '#284e37', '--rn-pat': '#b99a52', '--rn-seal': '#cfae63', '--rn-seal-ink': '#1b3626' } },
    { id: 'do-ruou', name: 'Đỏ rượu', swatch: ['#4e0f18', '#d2ab5f'], vars: { ...base, '--page': '#dccfc2', '--bg': '#f1e6dc', '--paper': '#faf3ea', '--ink': '#3a1d1f', '--muted': '#7a6260', '--accent': '#6b1623', '--accent-ink': '#f6e6c4', '--gold': '#c9a057', '--line': '#e0cdbd', '--rn-deep': '#470d15', '--rn-mid': '#621520', '--rn-pat': '#c49b52', '--rn-seal': '#d2ab5f', '--rn-seal-ink': '#470d15' } },
  ],
  demo: {
    cover: '/demo/tim-6.jpg',
    photos: [2, 1, 5, 3, 8, 4, 7].map((n) => `/demo/tim-${n}.jpg`),
    events: [
      { name: 'Lễ Vu Quy', date: '2026-12-20', time: '08:00', place: 'Tư gia nhà gái', address: 'Phố Hàng Bông, Hoàn Kiếm, Hà Nội', mapUrl: '' },
      { name: 'Lễ Thành Hôn', date: '2026-12-20', time: '10:00', place: 'Tư gia nhà trai', address: 'Phố Láng Hạ, Đống Đa, Hà Nội', mapUrl: '' },
      { name: 'Tiệc Cưới', date: '2026-12-20', time: '18:00', place: 'Sảnh Ngọc Bích — Nhà hàng tiệc cưới', address: 'Hồ Tây, Tây Hồ, Hà Nội', mapUrl: '' },
    ],
  },
  layout: ['invite', 'gallery', 'calendar', 'events', 'story', 'rsvp', 'gift', 'wishes', 'thanks'],

  title(text, sub) {
    return `<h2 class="rn-h">${esc(text)}</h2>${sub ? `<p class="sec-sub rn-sub">${esc(sub)}</p>` : ''}`;
  },

  // phong bì gấm xanh, dấu niêm rồng phượng; chạm → dấu bật, nắp mở, thiệp trượt lên
  opener(ctx) {
    const p = ctx.dparts;
    return `
<div class="opener rn-opener" id="opener" data-open-ms="1500">
  <div class="rn-obg">${brocade('rnPatO')}</div>
  <div class="rn-env">
    <div class="rn-env-card"><p class="rn-ec-k">Happy Wedding</p><p class="rn-ec-n">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>${p ? `<p class="rn-ec-d">${p.d}.${p.m}.${p.y}</p>` : ''}</div>
    <div class="rn-env-back"></div>
    <div class="rn-env-front">
      <p class="rn-ef-k">Kính gửi</p>
      <p class="rn-ef-g">${ctx.guest ? esc(ctx.guest.name) : 'Quý khách'}</p>
    </div>
    <div class="rn-env-flap"></div>
    <div class="rn-env-seal">${medallion('')}</div>
  </div>
  <button type="button" class="rn-otap" id="openBtn">Chạm vào dấu niêm để mở thiệp</button>
</div>`;
  },

  cover(ctx) {
    const { d } = ctx;
    const photo = d.cover || d.photos[0] || '';
    const side = (x, role, cls) => `
      <div class="rn-side ${cls}">
        <p class="rn-role">${role}</p>
        <p class="rn-name">${esc(x.name || role)}</p>
        ${x.father || x.mother ? `<p class="rn-ob">Ông Bà</p><p class="rn-par">${x.father ? esc(strip(x.father)) : ''}${x.father && x.mother ? '<br>' : ''}${x.mother ? esc(strip(x.mother)) : ''}</p>` : ''}
        ${x.address ? `<p class="rn-addr">${esc(x.address)}</p>` : ''}
      </div>`;
    const p = ctx.dparts;
    return `
<header class="rn-cover">
  <div class="rn-top">
    ${brocade('rnPat')}
    <div class="rn-banner"><span>Happy Wedding</span></div>
    <div class="rn-frames">
      <div class="rn-frame g"><i style="background-image:url('${esc(photo)}')"></i></div>
      <div class="rn-knot" aria-hidden="true">${medallion('')}</div>
      <div class="rn-frame b"><i style="background-image:url('${esc(photo)}')"></i></div>
    </div>
  </div>
  <div class="rn-sides">${side(d.groom, 'Chú Rể', 'g')}${side(d.bride, 'Cô Dâu', 'b')}</div>
  ${p ? `<p class="rn-cdate"><span>${esc(ctx.weekday)}</span><b>${p.d} · ${p.m} · ${p.y}</b><span>${esc(ctx.lunarShort)} âm lịch</span></p>` : ''}
</header>`;
  },

  sections: {
    invite(ctx) {
      const { d, guest } = ctx;
      return `
  <section class="sec rn-invite reveal">
    ${orn.corner('rn-cn tl')}${orn.corner('rn-cn tr')}${orn.corner('rn-cn bl')}${orn.corner('rn-cn br')}
    <p class="rn-lead">${esc(d.inviteText)}</p>
    <p class="rn-guest">${guest ? esc(guest.name) : 'Quý khách'}</p>
    <p class="rn-to">tới dự lễ thành hôn và bữa tiệc chung vui của</p>
    <div class="rn-pair"><p>${esc(d.groom.fullName || d.groom.name)}</p><i>&amp;</i><p>${esc(d.bride.fullName || d.bride.name)}</p></div>
    ${orn.divider('rn-div')}
    ${d.message ? `<p class="rn-msg">${esc(d.message)}</p>` : ''}
  </section>`;
    },

    // album trượt: ảnh lớn có mũi tên + nút xem toàn màn, dải ảnh nhỏ bên dưới
    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      return `
  <section class="sec rn-album reveal">
    <h2 class="rn-h">Album Ảnh Cưới</h2>
    <div class="rn-sl">
      <div class="rn-stage">
        ${ph.map((u, i) => `<img class="rn-slide${i ? '' : ' on'}" loading="lazy" src="${esc(u)}" alt="Ảnh cưới ${i + 1}">`).join('')}
        <button class="ph rn-full" data-i="0" type="button">⤢ Xem toàn màn</button>
        <button class="rn-nav prev" type="button" aria-label="Ảnh trước">‹</button>
        <button class="rn-nav next" type="button" aria-label="Ảnh sau">›</button>
        <span class="rn-count"><b>1</b> / ${ph.length}</span>
      </div>
      <div class="rn-thumbs">${ph.map((u, i) => `<button type="button" class="${i ? '' : 'on'}" style="background-image:url('${esc(u)}')" aria-label="Ảnh ${i + 1}"></button>`).join('')}</div>
    </div>
    <script>(function(){
      var s=document.currentScript.parentNode,sl=[].slice.call(s.querySelectorAll('.rn-slide')),th=[].slice.call(s.querySelectorAll('.rn-thumbs button')),full=s.querySelector('.rn-full'),cnt=s.querySelector('.rn-count b'),k=0,n=sl.length,t;
      function go(i){k=(i+n)%n;sl.forEach(function(e,j){e.classList.toggle('on',j===k)});th.forEach(function(e,j){e.classList.toggle('on',j===k)});full.setAttribute('data-i',k);cnt.textContent=k+1;var b=th[k];if(b&&b.parentNode.scrollTo)b.parentNode.scrollTo({left:b.offsetLeft-b.parentNode.clientWidth/2+b.clientWidth/2,behavior:'smooth'});auto();}
      function auto(){clearTimeout(t);if(!document.body.classList.contains('is-edit')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)t=setTimeout(function(){go(k+1)},4500);}
      s.querySelector('.prev').onclick=function(){go(k-1)};s.querySelector('.next').onclick=function(){go(k+1)};
      th.forEach(function(b,j){b.onclick=function(){go(j)}});
      var st=s.querySelector('.rn-stage'),x0=null;st.addEventListener('pointerdown',function(e){x0=e.clientX});
      st.addEventListener('pointerup',function(e){if(x0!==null&&Math.abs(e.clientX-x0)>40)go(k+(e.clientX<x0?1:-1));x0=null});
      auto();
    })()</script>
  </section>`;
    },

    // giờ tiệc + ngày lớn + âm lịch, lịch tháng trong thẻ xanh, đếm ngược
    calendar(ctx, opts, h) {
      const { d, dparts: p } = ctx;
      if (!p) return '';
      const party = partyEvent(d) || {};
      const time = party.time || d.time;
      const u = (k, l) => `<span class="rn-cd-u"><b data-cd="${k}">0</b><small>${l}</small></span>`;
      return `
  <section class="sec rn-when reveal">
    <h2 class="rn-h">Tiệc cưới sẽ diễn ra vào lúc:</h2>
    <p class="rn-time">${time ? `${esc(time.replace(':', 'h'))} ` : ''}${esc(ctx.weekday)}</p>
    <p class="rn-big">${p.d}/${p.m}/${p.y}</p>
    <p class="rn-lunar">(Tức ${esc(lunarOf(ctx.lunar))})</p>
    ${d.show.calendar || d.show.countdown ? `<div class="rn-calcard">
      ${brocade('rnPatC')}
      <div class="rn-calin">
        ${d.show.calendar ? h.calGrid(ctx, `<p class="rn-calh">Tháng ${+p.m} · ${p.y}</p>`) : ''}
        ${d.show.countdown ? `<div class="rn-cd" role="timer">${u('d', 'Ngày')}${u('h', 'Giờ')}${u('m', 'Phút')}${u('s', 'Giây')}</div>` : ''}
      </div>
    </div>` : ''}
  </section>`;
    },

    // nơi tổ chức tiệc + bản đồ, rồi các lễ khác dạng thẻ
    events(ctx, opts, h) {
      const evs = evList(ctx.d);
      if (!evs.length) return '';
      const party = partyEvent(ctx.d);
      const title = `Đám cưới ${ctx.g} & ${ctx.b}`;
      const card = (e) => {
        const dir = e.mapUrl || (e.address ? h.mapSearch(e.address) : '');
        const ep = h.parts(e.date);
        return `<li class="rn-ev reveal">
          <div class="rn-ev-t"><b>${esc(h.clock(e.time)) || '—'}</b>${ep ? `<span>${ep.d}.${ep.m}</span>` : ''}</div>
          <div class="rn-ev-b"><h3>${esc(e.name)}</h3>${e.place ? `<p class="pl">${esc(e.place)}</p>` : ''}${e.address ? `<p class="ad">${esc(e.address)}</p>` : ''}
          <p class="rn-ev-a">${dir ? `<a target="_blank" rel="noopener" href="${esc(dir)}">Chỉ đường</a>` : ''}${e.date ? `<a target="_blank" rel="noopener" href="${esc(h.calendarLink(`${e.name} — ${title}`, e.date, e.time, e.address || e.place))}">Lưu vào lịch</a>` : ''}</p></div>
        </li>`;
      };
      return `
  ${party && (party.place || party.address) ? `<section class="sec rn-venue reveal">
    <h2 class="rn-h">Tiệc cưới sẽ tổ chức tại:</h2>
    <p class="rn-vaddr">${esc([party.place, party.address].filter(Boolean).join(', '))}</p>
    ${party.address ? `<div class="rn-map"><iframe loading="lazy" title="Bản đồ" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(party.address)}&amp;output=embed"></iframe></div>` : ''}
  </section>` : ''}
  <section class="sec rn-events">
    <h2 class="rn-h">Lịch trình ngày vui</h2>
    <ol class="rn-evs">${evs.map(card).join('')}</ol>
  </section>`;
    },

    // hộp mừng cưới: khung kính mờ trên nền gấm
    gift(ctx, opts, h) {
      if (!ctx.d.show.gift) return '';
      const html = h.giftCard(ctx, ctx.d.gifts.groom, 'groom') + h.giftCard(ctx, ctx.d.gifts.bride, 'bride');
      if (!html) return '';
      return `
  <section class="rn-gift reveal">
    ${brocade('rnPatG')}
    <div class="rn-glass">
      <h2 class="rn-h">Hộp Mừng Cưới</h2>
      <p class="rn-gsub">Gửi lời chúc phúc tới cô dâu chú rể</p>
      <div class="gifts">${html}</div>
    </div>
  </section>`;
    },

    thanks(ctx) {
      return `
  <section class="sec rn-thanks reveal">
    ${medallion('rn-tmed')}
    <p class="rn-tbig">Cảm ơn tất cả tình cảm của cô dì chú bác, bạn bè và anh chị em đã dành cho ${esc(ctx.g)} &amp; ${esc(ctx.b)}!</p>
  </section>`;
    },
  },

  css: `
.tpl-rongngoc .card{background:var(--bg);color:var(--ink)}
.rn-brocade{position:absolute;inset:0;display:block;background:radial-gradient(ellipse at 50% 30%,var(--rn-mid),var(--rn-deep) 75%)}
.rn-brocade rect{opacity:.72}
.tpl-rongngoc .rn-h{font-family:var(--font-title);font-style:italic;font-weight:700;font-size:26px;line-height:1.25;color:var(--accent);margin:0 0 18px}
.tpl-rongngoc .rn-sub{margin-top:-10px}

/* ---------- màn mở: phong bì ---------- */
.rn-opener{background:var(--rn-deep);overflow:hidden}
.rn-obg{position:absolute;inset:0}
.rn-env{position:relative;width:min(330px,84vw);aspect-ratio:1.25;perspective:900px;margin-top:-6vh;cursor:pointer}
.rn-env-back{position:absolute;inset:0;background:#e9dcc6;border-radius:6px;box-shadow:0 20px 40px rgba(0,0,0,.45)}
.rn-env-card{position:absolute;left:6%;right:6%;top:6%;height:88%;background:#fbf6ec;border:1px solid var(--gold);border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;z-index:1;transition:transform 1s .5s cubic-bezier(.3,.7,.2,1)}
.rn-ec-k{margin:0;font-family:var(--font-script);font-size:22px;color:var(--accent)}
.rn-ec-n{margin:2px 0;font-family:var(--font-title);font-style:italic;font-weight:600;font-size:22px;color:var(--accent)}
.rn-ec-d{margin:0;font-size:12px;letter-spacing:.24em;color:var(--muted)}
.rn-env-front{position:absolute;inset:0;z-index:2;border-radius:6px;background:linear-gradient(160deg,var(--rn-mid),var(--rn-deep));clip-path:polygon(0 26%,50% 60%,100% 26%,100% 100%,0 100%);display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:5%;color:#f3e7c9;box-shadow:inset 0 0 0 1px rgba(207,174,99,.6)}
.rn-ef-k{margin:0;font-size:11px;letter-spacing:.3em;text-transform:uppercase;opacity:.8}
.rn-ef-g{margin:0;font-family:var(--font-title);font-style:italic;font-weight:600;font-size:21px;line-height:1.3;color:#e8cf8e;padding:0 12px;text-align:center}
.rn-env-flap{position:absolute;left:0;right:0;top:0;height:66%;z-index:3;background:linear-gradient(180deg,var(--rn-mid),var(--rn-deep));clip-path:polygon(0 0,100% 0,100% 39%,50% 91%,0 39%);transform-origin:top;transition:transform .8s ease;border-radius:6px 6px 0 0}
.rn-env-flap::after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 60%,rgba(207,174,99,.25))}
.rn-env-seal{position:absolute;left:50%;top:60%;width:70px;margin:-35px 0 0 -35px;z-index:4;filter:drop-shadow(0 4px 8px rgba(0,0,0,.4));transition:transform .5s ease,opacity .5s;animation:rnSeal 2.4s ease-in-out infinite}
.rn-env-seal svg{display:block;width:100%}
.rn-otap{position:absolute;bottom:9%;left:50%;transform:translateX(-50%);white-space:nowrap;margin:0;text-align:center;background:rgba(15,35,24,.82)!important;border-radius:999px!important;padding:10px 18px!important;color:#f3e7c9;font-size:13px;letter-spacing:.12em;animation:rnBlink 1.8s ease-in-out infinite}
@keyframes rnSeal{50%{transform:scale(1.06)}}
@keyframes rnBlink{50%{opacity:.4}}
.rn-opener.opening .rn-env-seal{transform:scale(1.6);opacity:0;animation:none}
.rn-opener.opening .rn-env-flap{transform:rotateX(180deg);z-index:0}
.rn-opener.opening .rn-env-card{transform:translateY(-62%)}
.rn-opener.opening .rn-otap{opacity:0}

/* ---------- trang bìa ---------- */
.rn-cover{position:relative;min-height:max(640px,min(100svh,860px));display:flex;flex-direction:column}
.rn-top{position:relative;height:clamp(300px,47svh,380px);flex:none;overflow:visible}
.rn-top .rn-brocade{border-bottom:3px double var(--gold)}
.rn-banner{position:absolute;left:0;right:0;top:9%;height:58px;display:grid;place-items:center;background:color-mix(in srgb,var(--bg) 78%,transparent);backdrop-filter:blur(2px)}
.rn-banner span{font-family:var(--font-script);font-weight:700;font-size:32px;color:var(--accent);animation:rnRise 1.2s ease both}
.rn-frames{position:absolute;left:0;right:0;bottom:-28px;display:flex;justify-content:space-between;align-items:flex-end;padding:0 4%}
.rn-frame{position:relative;width:44%;aspect-ratio:1;border-radius:50%;padding:5px;background:conic-gradient(from 30deg,#f1dc9c,#b48a3c,#f6e3a8,#a87e33,#f1dc9c);box-shadow:0 10px 24px rgba(0,0,0,.35);animation:rnFloat 6s ease-in-out infinite}
.rn-frame.b{animation-delay:-3s}
.rn-frame::after{content:"";position:absolute;inset:-7px;border-radius:50%;border:1px solid var(--gold);opacity:.8}
.rn-frame i{display:block;width:100%;height:100%;border-radius:50%;background-size:370% auto;background-repeat:no-repeat;border:2px solid var(--rn-deep)}
.rn-frame.g i{background-position:45% 21%}
.rn-frame.b i{background-position:69% 18%}
.rn-knot{width:13%;align-self:center;margin-bottom:10%;z-index:2;animation:rnSpin 26s linear infinite}
.rn-knot svg{display:block;width:100%;filter:drop-shadow(0 3px 6px rgba(0,0,0,.4))}
.rn-sides{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:44px 12px 0;text-align:center}
.rn-side p{margin:0}
.rn-role{font-size:15px;color:var(--ink)}
.rn-name{font-family:var(--font-title);font-style:italic;font-weight:700;font-size:clamp(22px,6.6vw,28px);line-height:1.25;color:var(--accent);margin:4px 0 10px!important}
.rn-ob{font-size:15px}
.rn-par{font-family:var(--font-title);font-style:italic;font-weight:600;font-size:15px;line-height:1.5;color:var(--accent);margin-top:2px!important}
.rn-addr{margin-top:10px!important;font-size:12.5px;line-height:1.45;color:var(--ink);opacity:.85}
.rn-cdate{margin:auto 0 0;padding:18px 0 22px;display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center}
.rn-cdate span{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--muted)}
.rn-cdate b{font-family:var(--font-title);font-weight:500;font-size:24px;letter-spacing:.06em;color:var(--accent);padding:2px 18px;border-top:1px solid var(--gold);border-bottom:1px solid var(--gold)}
@keyframes rnFloat{50%{transform:translateY(-6px)}}
@keyframes rnSpin{to{transform:rotate(360deg)}}
@keyframes rnRise{from{opacity:0;transform:translateY(10px)}}

/* ---------- lời mời ---------- */
.rn-invite{margin:34px 18px 0;padding:44px 22px;background:var(--paper);border:1px solid var(--line)}
.rn-cn{position:absolute;width:46px;height:46px}
.rn-cn.tl{left:6px;top:6px}.rn-cn.tr{right:6px;top:6px;transform:scaleX(-1)}
.rn-cn.bl{left:6px;bottom:6px;transform:scaleY(-1)}.rn-cn.br{right:6px;bottom:6px;transform:scale(-1)}
.rn-lead{margin:0;font-size:13px;letter-spacing:.24em;text-transform:uppercase;color:var(--muted)}
.rn-guest{margin:6px 0;font-family:var(--font-script);font-weight:700;font-size:32px;line-height:1.25;color:var(--accent)}
.rn-to{margin:0 0 16px;font-size:14px;color:var(--muted)}
.rn-pair p{margin:0;font-family:var(--font-title);font-style:italic;font-weight:600;font-size:23px;color:var(--accent)}
.rn-pair i{display:block;font-family:var(--font-script);font-style:normal;font-size:28px;color:var(--gold);line-height:1.2}
.rn-div{display:block;width:200px;margin:20px auto 0}
.rn-msg{margin:14px auto 0;max-width:320px;font-size:14px;font-style:italic;color:var(--muted)}

/* ---------- album trượt ---------- */
.rn-album{padding-left:16px;padding-right:16px}
.rn-sl{background:#f3f1ee;border-radius:16px;padding:0 0 12px;box-shadow:0 6px 20px rgba(0,0,0,.06)}
.rn-stage{position:relative;aspect-ratio:4/5;border-radius:16px 16px 0 0;overflow:hidden;background:var(--rn-deep);touch-action:pan-y}
.rn-slide{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transform:scale(1.06);transition:opacity .8s ease,transform 5s ease}
.rn-slide.on{opacity:1;transform:scale(1)}
.rn-full{position:absolute;top:12px;right:12px;padding:6px 12px;border:0;border-radius:999px;background:rgba(255,255,255,.88);color:var(--ink);font-size:13px;aspect-ratio:auto}
.rn-nav{position:absolute;top:50%;width:40px;height:40px;margin-top:-20px;border:0;border-radius:50%;background:rgba(255,255,255,.92);color:var(--ink);font-size:26px;line-height:1;box-shadow:0 2px 8px rgba(0,0,0,.2)}
.rn-nav.prev{left:12px}.rn-nav.next{right:12px}
.rn-count{position:absolute;left:12px;bottom:10px;padding:3px 10px;border-radius:999px;background:rgba(0,0,0,.45);color:#fff;font-size:12px}
.rn-thumbs{display:flex;gap:8px;overflow-x:auto;padding:12px 12px 2px;scrollbar-width:none}
.rn-thumbs::-webkit-scrollbar{display:none}
.rn-thumbs button{flex:none;width:58px;height:58px;border-radius:8px;border:2px solid transparent;background:center/cover no-repeat;opacity:.7;transition:.3s}
.rn-thumbs button.on{border-color:var(--accent);opacity:1}

/* ---------- giờ & lịch ---------- */
.rn-time{margin:0;font-size:19px;font-weight:500}
.rn-big{margin:18px 0 4px;font-family:var(--font-title);font-weight:500;font-size:40px;letter-spacing:.02em;color:var(--accent)}
.rn-lunar{margin:0;font-size:15px}
.rn-calcard{position:relative;margin:28px 0 0;border-radius:18px;overflow:hidden;padding:12px;box-shadow:0 14px 30px rgba(20,40,25,.25)}
.rn-calin{position:relative;background:color-mix(in srgb,var(--paper) 94%,transparent);border-radius:12px;padding:20px 14px;border:1px solid var(--gold)}
.tpl-rongngoc .s-cal,.tpl-rongngoc .rn-calin{--cal-hi:var(--accent)}
.rn-calh{margin:0 0 12px;font-family:var(--font-title);font-style:italic;font-weight:600;font-size:20px;color:var(--accent)}
.tpl-rongngoc .cal-on::before{background:var(--accent)}
.tpl-rongngoc .cal-on{color:#f3e7c9}
.rn-cd{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:16px;padding-top:16px;border-top:1px solid var(--line)}
.rn-cd-u{display:flex;flex-direction:column;align-items:center;padding:8px 0;border-radius:10px;background:var(--accent);color:var(--accent-ink)}
.rn-cd-u b{font-family:var(--font-title);font-weight:500;font-size:24px;line-height:1.1;font-variant-numeric:tabular-nums}
.rn-cd-u small{font-size:11px;letter-spacing:.08em;opacity:.85}

/* ---------- nơi tổ chức + lịch trình ---------- */
.rn-vaddr{margin:0 auto 18px;max-width:360px;font-size:16px;font-weight:500}
.rn-map{border-radius:14px;overflow:hidden;aspect-ratio:4/3;border:3px solid var(--paper);box-shadow:0 8px 22px rgba(0,0,0,.12);background:var(--line)}
.rn-map iframe{width:100%;height:100%;border:0}
.rn-evs{list-style:none;margin:0;padding:0;display:grid;gap:14px;text-align:left}
.rn-ev{display:grid;grid-template-columns:78px 1fr;background:var(--paper);border-radius:14px;overflow:hidden;border:1px solid var(--line)}
.rn-ev-t{display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--accent);color:var(--accent-ink);position:relative}
.rn-ev-t::after{content:"";position:absolute;inset:5px;border:1px solid color-mix(in srgb,var(--gold) 70%,transparent);border-radius:9px}
.rn-ev-t b{font-family:var(--font-title);font-weight:500;font-size:22px}
.rn-ev-t span{font-size:11px;opacity:.8}
.rn-ev-b{padding:14px 16px}
.rn-ev-b h3{margin:0;font-family:var(--font-title);font-style:italic;font-weight:700;font-size:19px;color:var(--accent)}
.rn-ev-b p{margin:2px 0 0}
.rn-ev-b .pl{font-weight:500;font-size:14.5px}
.rn-ev-b .ad{font-size:13px;color:var(--muted)}
.rn-ev-a{display:flex;gap:14px;margin-top:8px!important}
.rn-ev-a a{font-size:13px;font-weight:600;color:var(--accent);text-decoration:none;border-bottom:1px solid var(--gold)}

/* ---------- biểu mẫu ---------- */
.tpl-rongngoc .form{border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.06)}
.tpl-rongngoc .btn{border-radius:10px}

/* ---------- hộp mừng ---------- */
.rn-gift{position:relative;padding:70px 18px;margin-top:20px;overflow:hidden;text-align:center}
.rn-gift .rn-brocade{border-top:3px double var(--gold);border-bottom:3px double var(--gold)}
.rn-glass{position:relative;padding:30px 16px;background:color-mix(in srgb,var(--bg) 70%,transparent);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);border-radius:4px}
.rn-gsub{margin:-8px 0 18px;font-size:14px;color:var(--ink)}
.tpl-rongngoc .gift{border-radius:14px;background:var(--paper)}

/* ---------- lời cảm ơn ---------- */
.rn-thanks{padding:56px 28px 40px}
.rn-tmed{width:72px;margin:0 auto 16px;display:block}
.rn-tbig{margin:0;font-family:var(--font-title);font-style:italic;font-weight:700;font-size:21px;line-height:1.45;color:var(--accent)}

.rn-otap{border:0;background:none;padding:10px;font-family:inherit}
@media (prefers-reduced-motion:reduce){.rn-frame,.rn-knot,.rn-env-seal,.rn-otap,.rn-banner span{animation:none!important}.rn-slide{transition:opacity .3s}}
`,
};
