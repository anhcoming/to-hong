// Mẫu "Ngọc Trai" — sang trọng kiểu tạp chí: ảnh bìa tối tràn trang, chuỗi ngọc trai vắt ngang,
// chữ đồng ánh kim, "Save the date" với ảnh polaroid nghiêng, album lưới tạp chí. Ngọc trai vẽ bằng SVG.
const { esc } = require('../lib/util');

const evList = (d) => d.events.filter((e) => e.name || e.place);
const lunarOf = (s) => (s || '').replace(/^Nhằm /i, '');
const fx = (v) => +v.toFixed(1);
const MONTHS = ['Tháng Giêng', 'Tháng Hai', 'Tháng Ba', 'Tháng Tư', 'Tháng Năm', 'Tháng Sáu', 'Tháng Bảy', 'Tháng Tám', 'Tháng Chín', 'Tháng Mười', 'Tháng Mười Một', 'Tháng Chạp'];
const MONTHS_SOLAR = ['Tháng Một', 'Tháng Hai', 'Tháng Ba', 'Tháng Tư', 'Tháng Năm', 'Tháng Sáu', 'Tháng Bảy', 'Tháng Tám', 'Tháng Chín', 'Tháng Mười', 'Tháng Mười Một', 'Tháng Mười Hai'];

// ---------- ngọc trai ----------
// một lần trong trang: gradient cho hạt ngọc (dùng chung qua url(#ntPearl))
const PEARL_DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<radialGradient id="ntPearl" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="#fff"/><stop offset=".22" stop-color="#fbf7f0"/><stop offset=".6" stop-color="#e2d8c8"/><stop offset=".86" stop-color="#b8aa94"/><stop offset="1" stop-color="#8f826f"/></radialGradient>
<linearGradient id="ntIris" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6d9e4" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#cfe2f0" stop-opacity=".45"/></linearGradient>
</defs></svg>`;
const pearl = (x, y, r, cls = '') => `<g class="${cls}"><circle cx="${fx(x)}" cy="${fx(y + r * 0.18)}" r="${fx(r)}" fill="rgba(0,0,0,.28)"/><circle cx="${fx(x)}" cy="${fx(y)}" r="${fx(r)}" fill="url(#ntPearl)"/><circle cx="${fx(x)}" cy="${fx(y)}" r="${fx(r)}" fill="url(#ntIris)"/><ellipse class="nt-glint" cx="${fx(x - r * 0.32)}" cy="${fx(y - r * 0.36)}" rx="${fx(r * 0.26)}" ry="${fx(r * 0.17)}" fill="#fff" opacity=".9" transform="rotate(-30 ${fx(x - r * 0.32)} ${fx(y - r * 0.36)})"/></g>`;
// chuỗi ngọc chạy theo đường cong bậc hai; hạt lớn dần về giữa chuỗi
function strand(segs, rMin, rMax) {
  let out = '';
  for (const [x0, y0, cx, cy, x1, y1] of segs) {
    const pts = [];
    let len = 0, prev = [x0, y0];
    for (let i = 0; i <= 400; i++) {
      const t = i / 400, u = 1 - t, p = [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1];
      len += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p; pts.push([p[0], p[1], len]);
    }
    const rAt = (s) => rMin + (rMax - rMin) * (1 - Math.pow(Math.abs(2 * s / len - 1), 1.6));
    let s = rMin, k = 0;
    while (s < len - rMin * 0.5) {
      while (k < pts.length - 1 && pts[k][2] < s) k++;
      const r = rAt(s);
      out += pearl(pts[k][0], pts[k][1], r);
      s += r + rAt(s + r) + 0.6;
    }
  }
  return out;
}
const svgBox = (cls, vb, inner, extra = '') => `<svg class="${cls}" viewBox="${vb}" aria-hidden="true"${extra}>${inner}</svg>`;
// vòng ngọc vắt hai võng (ngăn giữa các khối)
const swag = (cls) => svgBox(cls, '0 0 390 96', strand([[-6, 14, 92, 118, 195, 30], [195, 30, 298, 118, 396, 14]], 3.4, 7.6) + pearl(195, 32, 11) + pearl(195, 58, 8, 'nt-drop'), ' preserveAspectRatio="xMidYMid meet"');
// một hàng ngọc thẳng, hạt lớn ở giữa
const rowLine = (cls) => svgBox(cls, '0 0 390 40', strand([[-4, 20, 195, 20, 394, 20]], 4, 8) + pearl(195, 20, 14), '');

const base = {
  '--font-title': "'Cormorant Garamond',Georgia,serif",
  '--font-script': "'Pinyon Script',cursive",
  '--font-body': "'Lora',Georgia,serif",
};

module.exports = {
  id: 'ngoctrai',
  name: 'Ngọc Trai',
  group: 'hoanggia',
  badge: 'Mới',
  desc: 'Ảnh bìa tối kiểu tạp chí, chuỗi ngọc trai vắt ngang và chữ đồng ánh kim',
  fonts: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Pinyon+Script&family=Lora:ital,wght@0,400;0,500;1,400&display=swap',
  palettes: [
    { id: 'den-vang', name: 'Đen đồng', swatch: ['#12100e', '#c4a26a'], vars: { ...base, '--page': '#050404', '--bg': '#12100e', '--paper': '#1c1916', '--ink': '#eee5d6', '--muted': '#a99c88', '--accent': '#c9a76e', '--accent-ink': '#16120d', '--gold': '#c9a76e', '--line': 'rgba(201,167,110,.28)', '--nt-band': '#2a2119', '--nt-band-ink': '#e9d3a6', '--nt-polar': '#f4efe6', '--nt-shade': 'rgba(0,0,0,.55)' } },
    { id: 'trang-ngoc', name: 'Trắng ngọc', swatch: ['#f2efe9', '#8a6a3a'], vars: { ...base, '--page': '#e4dfd6', '--bg': '#f2efe9', '--paper': '#fbf9f5', '--ink': '#3d3226', '--muted': '#857862', '--accent': '#8a6a3a', '--accent-ink': '#fbf6ec', '--gold': '#a8854f', '--line': '#ddd3c4', '--nt-band': '#85683b', '--nt-band-ink': '#fbf3e3', '--nt-polar': '#ffffff', '--nt-shade': 'rgba(70,50,20,.18)' } },
  ],
  demo: {
    cover: '/demo/naudam-7.jpg',
    photos: [6, 5, 9, 4, 10, 3, 8].map((n) => `/demo/naudam-${n}.jpg`),
    story: 'Tình yêu của chúng mình là một hành trình dịu dàng: đi qua những tháng ngày thương nhớ, sẻ chia và vượt qua thử thách để nắm tay nhau tới hôm nay.\nĐám cưới không chỉ là dấu mốc hạnh phúc, mà là khởi đầu cho một chặng đường mới — nơi hai đứa cùng vun đắp tổ ấm và viết tiếp câu chuyện mang tên gia đình.',
    events: [
      { name: 'Lễ Thành Hôn', date: '2026-12-20', time: '09:30', place: 'Tư gia nhà trai', address: 'Phố Láng Hạ, Đống Đa, Hà Nội', mapUrl: '' },
      { name: 'Tiệc Cưới', date: '2026-12-20', time: '18:00', place: 'Khách sạn Ngọc Trai — Sảnh Ballroom', address: 'Hồ Tây, Tây Hồ, Hà Nội', mapUrl: '' },
    ],
  },
  layout: ['savedate', 'calendar', 'invite', 'events', 'story', 'gallery', 'rsvp', 'gift', 'wishes', 'countdown', 'thanks'],

  title(text, sub) {
    return `<h2 class="nt-h">${esc(text)}</h2>${sub ? `<p class="sec-sub nt-sub">${esc(sub)}</p>` : ''}`;
  },

  // hộp nhung đựng trang sức: chạm → nắp hộp bật lên, lộ chuỗi ngọc
  opener(ctx) {
    return `
<div class="opener nt-opener" id="opener" data-open-ms="1500">
  <p class="nt-okick">The wedding of</p>
  <p class="nt-onames">${esc(ctx.g)} <i>&amp;</i> ${esc(ctx.b)}</p>
  <div class="nt-box">
    <div class="nt-box-in">${svgBox('nt-box-pearls', '0 0 390 120', strand([[20, 30, 195, 150, 370, 30]], 5, 11))}</div>
    <div class="nt-lid"><span class="nt-lid-clasp">${svgBox('', '0 0 40 40', pearl(20, 20, 13))}</span></div>
  </div>
  <p class="nt-oto">${ctx.guest ? `Dành riêng cho<br><b>${esc(ctx.guest.name)}</b>` : 'Trân trọng kính mời'}</p>
  <button type="button" class="nt-otap" id="openBtn">Chạm để mở hộp</button>
</div>`;
  },

  cover(ctx) {
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    const p = ctx.dparts;
    return `
${PEARL_DEFS}
<header class="nt-cover">
  <div class="nt-cphoto" style="background-image:url('${esc(photo)}')"></div>
  <div class="nt-cshade"></div>
  <p class="nt-ckick"><span>The wedding of</span></p>
  <h1 class="nt-cnames"><span>${esc(ctx.g)}</span><i>&amp;</i><span>${esc(ctx.b)}</span></h1>
  ${p ? `<p class="nt-cdate">${p.d}<i></i>${p.m}<i></i>${p.y}</p>` : ''}
  ${svgBox('nt-cstrand', '0 0 390 120', strand([[-8, 6, 170, 120, 400, 20]], 3.4, 9) + strand([[-8, 40, 210, 150, 400, 54]], 2.4, 5.4) + pearl(176, 84, 13, 'nt-drop'))}
</header>`;
  },

  sections: {
    // SAVE the DATE + hai ảnh polaroid nghiêng, ngọc trai rơi
    savedate(ctx) {
      const ph = ctx.d.photos;
      const a = ph[0] || ctx.d.cover, b = ph[1] || ph[0] || ctx.d.cover;
      return `
  <section class="sec nt-std">
    ${rowLine('nt-row')}
    <h2 class="nt-stdh reveal"><span>Save</span><i>the</i><span>Date</span></h2>
    <div class="nt-polars">
      ${a ? `<button class="ph nt-pol a reveal" data-i="0" aria-label="Xem ảnh"><span style="background-image:url('${esc(a)}')"></span></button>` : ''}
      ${b && ph.length > 1 ? `<button class="ph nt-pol b reveal" data-i="1" aria-label="Xem ảnh"><span style="background-image:url('${esc(b)}')"></span></button>` : ''}
      ${svgBox('nt-float f1', '0 0 40 40', pearl(20, 20, 14))}${svgBox('nt-float f2', '0 0 40 40', pearl(20, 20, 16))}${svgBox('nt-float f3', '0 0 40 40', pearl(20, 20, 10))}
    </div>
  </section>`;
    },

    // tên tháng viết tay, tờ lịch có dải đồng + năm chìm phía sau
    calendar(ctx, opts, h) {
      const p = ctx.dparts;
      if (!p || !ctx.d.show.calendar) return '';
      return `
  <section class="sec nt-cal reveal">
    <p class="nt-month">${MONTHS_SOLAR[+p.m - 1]}</p>
    <div class="nt-calcard">
      <p class="nt-calbar">${+p.m}.${p.y}</p>
      <span class="nt-calyear" aria-hidden="true">${p.y}</span>
      ${h.calGrid(ctx, '')}
    </div>
    <p class="nt-calsub">${esc(ctx.weekday)} · âm lịch ${esc(ctx.lunarShort)}</p>
    ${swag('nt-swag')}
  </section>`;
    },

    invite(ctx) {
      const { d, guest } = ctx;
      const fam = (x, label) => `<div class="nt-fam"><p class="k">${label}</p>${x.father ? `<p>${esc(x.father)}</p>` : ''}${x.mother ? `<p>${esc(x.mother)}</p>` : ''}${x.address ? `<p class="a">${esc(x.address)}</p>` : ''}</div>`;
      const hasFam = d.groom.father || d.groom.mother || d.bride.father || d.bride.mother;
      return `
  <section class="sec nt-invite reveal">
    ${hasFam ? `<div class="nt-fams">${fam(d.groom, 'Nhà Trai')}<i></i>${fam(d.bride, 'Nhà Gái')}</div>` : ''}
    <p class="nt-lead">${esc(d.inviteText)}</p>
    <p class="nt-guest">${guest ? esc(guest.name) : 'Quý khách'}</p>
    <p class="nt-to">tới dự lễ thành hôn của</p>
    <h2 class="nt-pair"><span>${esc(d.groom.fullName || d.groom.name)}</span><i>&amp;</i><span>${esc(d.bride.fullName || d.bride.name)}</span></h2>
    ${d.message ? `<p class="nt-msg">${esc(d.message)}</p>` : ''}
  </section>`;
    },

    // mỗi lễ một khối: tên lễ, giờ + thứ, "Tháng | ngày | Năm", âm lịch, nơi, nút chỉ đường
    events(ctx, opts, h) {
      const evs = evList(ctx.d);
      if (!evs.length) return '';
      const title = `Đám cưới ${ctx.g} & ${ctx.b}`;
      return evs.map((e, i) => {
        const ep = h.parts(e.date || ctx.date);
        const dir = e.mapUrl || (e.address ? h.mapSearch(e.address) : '');
        return `
  ${i ? rowLine('nt-row nt-row-mid') : ''}
  <section class="sec nt-ev reveal">
    <h3>${esc(e.name)}</h3>
    ${ep ? `<p class="nt-ev-when">Được tổ chức ${e.time ? `vào lúc ${esc(h.clock(e.time))}, ` : ''}${esc(h.weekday(e.date || ctx.date))}</p>
    <div class="nt-ev-date"><span>Tháng ${ep.m}</span><b>${ep.d}</b><span>Năm ${ep.y}</span></div>
    <p class="nt-ev-lunar">(Tức ${esc(lunarOf(h.lunarText(e.date || ctx.date)))})</p>` : ''}
    ${e.place ? `<p class="nt-ev-place">Tại ${esc(e.place)}</p>` : ''}
    ${e.address ? `<p class="nt-ev-addr">${esc(e.address)}</p>` : ''}
    <p class="nt-ev-act">${dir ? `<a class="nt-pill" target="_blank" rel="noopener" href="${esc(dir)}">Xem chỉ đường</a>` : ''}${e.date ? `<a class="nt-pill ghost" target="_blank" rel="noopener" href="${esc(h.calendarLink(`${e.name} — ${title}`, e.date, e.time, e.address || e.place))}">Lưu vào lịch</a>` : ''}</p>
  </section>`;
      }).join('');
    },

    // ảnh tràn khung, dải mờ có "Forever & Always" + câu chuyện
    story(ctx) {
      if (!ctx.d.story) return '';
      const ph = ctx.d.photos;
      const bg = ph[4] || ph[2] || ph[0] || ctx.d.cover;
      return `
  <section class="nt-story reveal">
    <div class="nt-sphoto" style="background-image:url('${esc(bg)}')"></div>
    <div class="nt-sband">
      <p class="nt-sh">Forever &amp; Always</p>
      ${ctx.d.story.split(/\n+/).map((t) => `<p>${esc(t)}</p>`).join('')}
    </div>
  </section>`;
    },

    // "THE DIARY of love" + lưới ảnh kiểu tạp chí
    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      return `
  <section class="nt-album">
    <div class="nt-diary reveal"><span>The Diary</span><i>of love</i>${svgBox('nt-dpearl', '0 0 40 40', pearl(20, 20, 15))}</div>
    <div class="nt-grid">
      ${ph.map((u, i) => `<button class="ph nt-g k${i % 7} reveal" data-i="${i}" style="background-image:url('${esc(u)}')" aria-label="Xem ảnh ${i + 1}"></button>`).join('')}
    </div>
  </section>`;
    },

    gift(ctx, opts, h) {
      if (!ctx.d.show.gift) return '';
      const html = h.giftCard(ctx, ctx.d.gifts.groom, 'groom') + h.giftCard(ctx, ctx.d.gifts.bride, 'bride');
      if (!html) return '';
      const box = `<svg class="nt-giftbox" viewBox="0 0 120 120" aria-hidden="true"><rect x="22" y="52" width="76" height="56" rx="3" fill="var(--paper)" stroke="var(--gold)" stroke-width="1.6"/><rect x="16" y="40" width="88" height="16" rx="3" fill="var(--paper)" stroke="var(--gold)" stroke-width="1.6"/><path d="M60 40V108" stroke="var(--gold)" stroke-width="5"/><path d="M60 40C46 20 28 26 36 36C40 40 52 40 60 40C68 40 80 40 84 36C92 26 74 20 60 40Z" fill="none" stroke="var(--gold)" stroke-width="2"/>${strand([[22, 72, 60, 96, 98, 72]], 2.4, 3.6)}${pearl(60, 40, 6)}</svg>`;
      return `
  <section class="sec nt-gift reveal">
    ${box}
    <h2 class="nt-h">Quà mừng cưới</h2>
    <p class="sec-sub nt-sub">Gửi lời chúc phúc tới cô dâu chú rể</p>
    <div class="gifts">${html}</div>
  </section>`;
    },

    countdown(ctx) {
      if (!ctx.dparts || !ctx.d.show.countdown) return '';
      const u = (k, l) => `<span class="nt-cd-u"><b data-cd="${k}">0</b><small>${l}</small></span>`;
      return `
  <section class="sec nt-count reveal">
    ${swag('nt-swag top')}
    <h2 class="nt-h">Countdown</h2>
    <div class="nt-cd" role="timer">${u('d', 'ngày')}${u('h', 'giờ')}${u('m', 'phút')}${u('s', 'giây')}</div>
  </section>`;
    },

    thanks(ctx) {
      const photo = ctx.d.cover || ctx.d.photos[0] || '';
      return `
  <section class="nt-thanks reveal">
    <div class="nt-tphoto" style="background-image:url('${esc(photo)}')"></div>
    <div class="nt-tin">
      <p class="nt-tbig">Thank you</p>
      <p>Cảm ơn quý khách đã dành tình cảm cho gia đình chúng tôi. Sự hiện diện của quý khách chính là món quà ý nghĩa nhất trong ngày trọng đại này.</p>
      <p class="nt-tnames">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
    </div>
  </section>`;
    },
  },

  css: `
.tpl-ngoctrai .card,.nt-opener{background:var(--bg);color:var(--ink);font-variant-numeric:lining-nums}
.tpl-ngoctrai .nt-h{font-family:var(--font-script);font-weight:400;font-size:46px;line-height:1.2;color:var(--accent);margin:0 0 18px}
.tpl-ngoctrai .nt-sub{margin-top:-12px}
.tpl-ngoctrai svg .nt-glint{animation:ntGlint 4s ease-in-out infinite}
@keyframes ntGlint{0%,100%{opacity:.9}50%{opacity:.35}}

/* ---------- màn mở: hộp nhung ---------- */
.nt-opener{background:radial-gradient(ellipse at 50% 40%,#2a231c,#0b0907 70%);color:#eee5d6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;text-align:center;font-family:'Lora',serif}
.nt-okick{margin:0;font-family:'Cormorant Garamond',serif;font-size:13px;letter-spacing:.4em;text-transform:uppercase;color:#c9a76e}
.nt-onames{margin:6px 0 30px;font-family:'Cormorant Garamond',serif;font-weight:300;font-size:30px;letter-spacing:.08em;text-transform:uppercase}
.nt-onames i{font-style:italic;text-transform:none;color:#c9a76e}
.nt-box{position:relative;width:min(280px,74vw);aspect-ratio:1.5;perspective:800px;cursor:pointer}
.nt-box-in{position:absolute;inset:0;border-radius:10px;background:radial-gradient(ellipse at 50% 40%,#3b302a,#1a1410);box-shadow:inset 0 6px 18px rgba(0,0,0,.7),0 20px 40px rgba(0,0,0,.6);border:2px solid #6c5432;display:grid;place-items:center;overflow:hidden}
.nt-box-pearls{width:92%;filter:drop-shadow(0 3px 4px rgba(0,0,0,.5))}
.nt-lid{position:absolute;inset:0;border-radius:10px;background:linear-gradient(160deg,#2d2620,#120e0b 70%);border:2px solid #8a6c3f;box-shadow:inset 0 0 0 6px #19130f,inset 0 0 0 7px rgba(201,167,110,.5),0 20px 40px rgba(0,0,0,.6);transform-origin:top;transition:transform 1.1s cubic-bezier(.5,.1,.2,1);display:grid;place-items:center}
.nt-lid-clasp{width:40px;height:40px;animation:ntBob 2.4s ease-in-out infinite}
.nt-lid-clasp svg{width:100%;height:100%}
.nt-oto{margin:30px 0 0;font-size:14px;color:#a99c88;line-height:1.5}
.nt-oto b{display:block;font-family:'Pinyon Script',cursive;font-weight:400;font-size:32px;color:#eee5d6}
.nt-otap{margin:22px 0 0;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#c9a76e;animation:ntBlink 1.8s ease-in-out infinite}
@keyframes ntBob{50%{transform:translateY(-3px)}}
@keyframes ntBlink{50%{opacity:.35}}
.nt-opener.opening .nt-lid{transform:rotateX(-110deg)}
.nt-opener.opening .nt-otap{opacity:0}

/* ---------- trang bìa ---------- */
.nt-cover{position:relative;height:max(620px,min(100svh,900px));overflow:hidden;color:#f3ebdd;background:#0b0907}
.nt-cphoto{position:absolute;inset:0;background:42% 18%/cover no-repeat;filter:grayscale(.25) contrast(1.05) brightness(.85);animation:ntZoom 18s ease-out both}
.nt-cshade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,6,5,.55) 0,rgba(8,6,5,0) 22%,rgba(8,6,5,0) 40%,rgba(8,6,5,.78) 66%,rgba(8,6,5,.94) 100%)}
.nt-ckick{position:absolute;left:0;right:0;top:5%;margin:0;text-align:center}
.nt-ckick span{font-family:var(--font-title);font-size:12px;letter-spacing:.5em;text-transform:uppercase;color:#e2c995;padding:0 0 6px;border-bottom:1px solid rgba(226,201,149,.6)}
.nt-cnames{position:absolute;left:0;right:0;top:52%;margin:0;padding:0 18px;text-align:center;font-family:var(--font-title);font-weight:300;text-transform:uppercase;font-size:clamp(34px,10vw,46px);line-height:1.05;letter-spacing:.06em}
.nt-cnames span{display:block;animation:ntRise 1.4s ease both}
.nt-cnames span:last-child{animation-delay:.3s}
.nt-cnames i{display:block;margin:2px 0 0;font-family:var(--font-title);font-style:italic;font-weight:300;text-transform:none;font-size:.9em;color:#d6b57b;letter-spacing:0}
.nt-cstrand{position:absolute;left:0;width:100%;bottom:-1%;height:auto;filter:drop-shadow(0 4px 6px rgba(0,0,0,.6));animation:ntSway 7s ease-in-out infinite;transform-origin:50% 0}
.nt-cdate{position:absolute;left:0;right:0;top:77%;margin:0;display:flex;justify-content:center;align-items:center;gap:14px;font-family:var(--font-title);font-size:19px;letter-spacing:.3em;color:#e2c995}
.nt-cdate i{width:4px;height:4px;border-radius:50%;background:#e2c995}
@keyframes ntZoom{from{transform:scale(1.12)}}
@keyframes ntRise{from{opacity:0;transform:translateY(18px);letter-spacing:.3em}}
@keyframes ntSway{50%{transform:rotate(.8deg) translateY(2px)}}

/* ---------- save the date ---------- */
.nt-row{display:block;width:100%;height:auto;filter:drop-shadow(0 3px 4px var(--nt-shade))}
.nt-std{padding-top:0;overflow:hidden}
.nt-std>.nt-row{margin:-20px -24px 0;width:calc(100% + 48px)}
.nt-stdh{margin:40px 0 0;font-family:var(--font-title);font-weight:400;color:var(--accent);text-transform:uppercase;line-height:.95;display:grid;grid-template-columns:auto auto;justify-content:center;column-gap:8px}
.nt-stdh span{font-size:clamp(60px,18vw,84px);letter-spacing:.02em}
.nt-stdh span:first-child{grid-column:1;justify-self:end}
.nt-stdh i{grid-column:2;align-self:end;font-family:var(--font-script);font-style:normal;text-transform:none;font-size:clamp(38px,11vw,52px);padding-bottom:10px;justify-self:start}
.nt-stdh span:last-child{grid-column:1/3;justify-self:end;padding-right:4%}
.nt-polars{position:relative;height:610px;margin-top:30px}
.nt-pol{position:absolute;width:66%;aspect-ratio:4/5;padding:12px 12px 14px;border:0;background:var(--nt-polar);box-shadow:0 18px 36px rgba(0,0,0,.45);border-radius:2px}
.nt-pol span{display:block;width:100%;height:100%;background:center 25%/cover no-repeat}
.nt-pol.a{left:6%;top:0;transform:rotate(-6deg)}
.nt-pol.b{right:4%;top:300px;transform:rotate(5deg)}
.nt-pol.reveal.in.a{transform:rotate(-6deg)}.nt-pol.reveal.in.b{transform:rotate(5deg)}
.nt-float{position:absolute;filter:drop-shadow(0 6px 8px var(--nt-shade));animation:ntBob 5s ease-in-out infinite}
.nt-float.f1{width:30px;right:8%;top:110px}
.nt-float.f2{width:52px;left:-10px;top:470px;animation-delay:-1.5s}
.nt-float.f3{width:22px;right:30%;top:280px;animation-delay:-3s}

/* ---------- lịch ---------- */
.nt-cal{padding-top:30px;padding-bottom:20px}
.nt-month{margin:0 0 14px;font-family:var(--font-script);font-size:46px;line-height:1.2;color:var(--accent)}
.nt-calcard{position:relative;background:var(--paper);border-radius:2px;padding:0 0 14px;box-shadow:0 14px 30px rgba(0,0,0,.25);overflow:hidden;--cal-hi:var(--accent)}
.nt-calbar{position:relative;z-index:1;margin:0 0 12px;padding:8px 26px;text-align:left;background:var(--accent);color:var(--accent-ink);font-family:var(--font-title);font-weight:500;font-size:28px}
.nt-calyear{position:absolute;left:0;right:0;top:46%;text-align:center;font-family:var(--font-title);font-weight:300;font-size:120px;line-height:1;color:var(--ink);opacity:.07;pointer-events:none}
.nt-calcard .cal{position:relative;width:100%;padding:0 12px}
.nt-calcard .cal-grid{font-family:var(--font-title);font-size:18px}
.tpl-ngoctrai .cal-on::before{-webkit-mask:none;mask:none;width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 36% 30%,#fff,#f3ece0 30%,#cbbda6 80%,#9d8f79);box-shadow:0 3px 6px rgba(0,0,0,.35);animation:none}
.tpl-ngoctrai .cal-on{color:#3d3226}
.tpl-ngoctrai .cal-on b{margin-top:0}
.nt-calsub{margin:14px 0 6px;font-size:13px;letter-spacing:.06em;color:var(--muted)}
.nt-swag{display:block;width:calc(100% + 48px);margin:10px -24px 0;height:auto;filter:drop-shadow(0 4px 5px var(--nt-shade))}
.nt-swag .nt-drop{animation:ntBob 3s ease-in-out infinite}

/* ---------- lời mời ---------- */
.nt-invite{padding-top:20px}
.nt-fams{display:grid;grid-template-columns:1fr 1px 1fr;gap:14px;margin-bottom:34px;font-size:14px}
.nt-fams>i{background:var(--line)}
.nt-fam p{margin:0;line-height:1.6}
.nt-fam .k{font-family:var(--font-title);font-weight:600;font-size:15px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin-bottom:4px}
.nt-fam .a{font-size:12px;color:var(--muted);margin-top:4px}
.nt-lead{margin:0;font-size:13px;letter-spacing:.24em;text-transform:uppercase;color:var(--muted)}
.nt-guest{margin:4px 0;font-family:var(--font-script);font-size:36px;line-height:1.35;color:var(--accent)}
.nt-to{margin:0 0 18px;font-size:14px;color:var(--muted)}
.nt-pair{margin:0;font-family:var(--font-title);font-weight:300;text-transform:uppercase;font-size:clamp(28px,8.4vw,40px);line-height:1.1;color:var(--accent);letter-spacing:.04em}
.nt-pair span{display:block}
.nt-pair i{display:block;font-family:var(--font-title);font-style:italic;font-size:.85em;margin:2px 0}
.nt-msg{margin:24px auto 0;max-width:330px;font-style:italic;font-size:14.5px;color:var(--muted)}

/* ---------- các lễ ---------- */
.nt-row-mid{width:calc(100% - 0px)}
.nt-ev{padding-top:40px;padding-bottom:40px}
.nt-ev h3{margin:0;font-family:var(--font-title);font-weight:600;font-size:26px;letter-spacing:.06em;text-transform:uppercase;color:var(--accent)}
.nt-ev-when{margin:4px 0 16px;font-family:var(--font-title);font-size:15.5px;letter-spacing:.03em;text-transform:uppercase;color:var(--ink)}
.nt-ev-date{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;color:var(--accent);font-family:var(--font-title)}
.nt-ev-date span{font-size:19px;text-transform:uppercase;letter-spacing:.06em;padding:4px 0;border-top:1px solid var(--accent);border-bottom:1px solid var(--accent)}
.nt-ev-date b{font-weight:300;font-size:76px;line-height:1}
.nt-ev-lunar{margin:12px 0 0;font-style:italic;font-size:14px;color:var(--muted)}
.nt-ev-place{margin:16px 0 2px;font-family:var(--font-title);font-weight:600;font-size:19px;letter-spacing:.06em;text-transform:uppercase;color:var(--accent)}
.nt-ev-addr{margin:0;font-size:14.5px;color:var(--ink)}
.nt-ev-act{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin:18px 0 0}
.nt-pill{display:inline-block;padding:8px 22px;border-radius:999px;background:var(--accent);color:var(--accent-ink);font-family:var(--font-title);font-weight:600;font-size:15px;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;border:1px solid var(--accent)}
.nt-pill.ghost{background:transparent;color:var(--accent)}

/* ---------- câu chuyện ---------- */
.nt-story{position:relative;min-height:640px;display:flex;align-items:flex-end;overflow:hidden;margin-top:30px}
.nt-sphoto{position:absolute;inset:0;background:center 20%/cover no-repeat;filter:grayscale(.2)}
.nt-sband{position:relative;width:100%;padding:28px 18px 32px;background:rgba(18,14,11,.62);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);color:#f3ebdd;text-align:center}
.nt-sband .nt-sh{margin:0 0 8px;font-family:var(--font-script);font-size:48px;line-height:1.2;color:#f3ebdd}
.nt-sband p{margin:0 0 8px;font-size:14.5px;line-height:1.65}

/* ---------- nhật ký ảnh ---------- */
.nt-diary{position:relative;background:var(--nt-band);color:var(--nt-band-ink);padding:34px 20px 26px;text-align:left;overflow:hidden}
.nt-diary span{display:block;font-family:var(--font-title);font-weight:300;font-size:clamp(46px,14vw,62px);line-height:1;text-transform:uppercase;letter-spacing:.02em}
.nt-diary i{display:block;font-family:var(--font-script);font-style:normal;font-size:clamp(50px,15vw,66px);line-height:1.1;text-align:right;padding-right:6%}
.nt-dpearl{position:absolute;width:44px;left:24px;bottom:16px;filter:drop-shadow(0 4px 6px rgba(0,0,0,.4))}
.nt-grid{display:grid;grid-template-columns:1.25fr 1fr;grid-auto-rows:150px;gap:6px;padding:6px 0 0}
.nt-g{border:0;padding:0;border-radius:0;background:var(--line) center 25%/cover no-repeat;aspect-ratio:auto!important;transition:filter .4s}
.nt-grid .ph{grid-column:auto;aspect-ratio:auto}
.nt-grid .nt-g.k0{grid-row:span 2}
.nt-grid .nt-g.k3,.nt-grid .nt-g.k6{grid-column:1/-1;grid-row:span 2}
.nt-grid .nt-g.k4,.nt-grid .nt-g.k5{grid-row:span 2}
.nt-grid .nt-g.k1,.nt-grid .nt-g.k2{grid-column:2}

/* ---------- biểu mẫu, quà ---------- */
.tpl-ngoctrai .s-rsvp{padding-top:64px}
.tpl-ngoctrai .form{border-radius:4px;box-shadow:0 14px 34px rgba(0,0,0,.25)}
.tpl-ngoctrai .btn{border-radius:4px;font-family:var(--font-title);font-size:16px;letter-spacing:.1em;text-transform:uppercase}
.tpl-ngoctrai .choice input{accent-color:var(--accent)}
.nt-giftbox{width:110px;margin:0 auto 4px;display:block;animation:ntBob 4s ease-in-out infinite}
.tpl-ngoctrai .gift{border-radius:4px}
.tpl-ngoctrai .gift-who{font-family:var(--font-title);font-weight:600;font-size:21px}

/* ---------- đếm ngược ---------- */
.nt-count{padding-top:10px}
.nt-swag.top{margin:0 -24px 10px}
.nt-cd{display:grid;grid-template-columns:repeat(4,1fr);max-width:340px;margin:0 auto}
.nt-cd-u{display:flex;flex-direction:column;align-items:center}
.nt-cd-u b{font-family:var(--font-title);font-weight:400;font-size:34px;line-height:1.1;color:var(--accent);font-variant-numeric:tabular-nums}
.nt-cd-u small{font-size:13px;color:var(--muted)}

/* ---------- lời cảm ơn ---------- */
.nt-thanks{position:relative;min-height:520px;display:flex;align-items:center;justify-content:center;overflow:hidden;color:#f3ebdd;text-align:center;margin-top:20px}
.nt-tphoto{position:absolute;inset:0;background:center 25%/cover no-repeat;filter:grayscale(.3) brightness(.55)}
.nt-tin{position:relative;padding:30px 22px;max-width:420px}
.nt-tin .nt-tbig{margin:0;font-family:var(--font-script);font-size:58px;line-height:1.2;color:#f3ebdd}
.nt-tin p{margin:6px 0 0;font-size:14.5px;line-height:1.65}
.nt-tnames{margin-top:18px!important;font-family:var(--font-title);font-size:15px!important;letter-spacing:.3em;text-transform:uppercase;color:#e2c995}

.nt-otap{border:0;background:none;padding:10px;font-family:inherit}
@media (prefers-reduced-motion:reduce){.nt-cphoto,.nt-cnames span,.nt-cstrand,.nt-float,.nt-lid-clasp,.nt-otap,.nt-giftbox,.nt-swag .nt-drop,.tpl-ngoctrai svg .nt-glint{animation:none!important}.nt-lid{transition:none}}
`,
};
