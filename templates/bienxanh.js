// Mẫu "Biển Xanh" — trời biển trong trẻo: ảnh bìa tràn màn hình phủ lớp xanh trời, chữ viết tay trắng
// "We got married", hai cột GROOM / BRIDE, sóng nước mềm (SVG) ngăn các phần, bưu thiếp có dấu bưu điện.
const { esc } = require('../lib/util');

const base = {
  '--font-title': "'Cormorant Garamond',Georgia,serif",
  '--font-script': "'Updock',cursive",
  '--font-body': "'Josefin Sans',system-ui,sans-serif",
};

const evList = (d) => d.events.filter((e) => e.name || e.place);
function partyEvent(d) {
  const evs = evList(d);
  return evs.find((e) => /khai tiệc|tiệc cưới/i.test(e.name)) || evs.find((e) => /tiệc/i.test(e.name)) || evs[evs.length - 1] || null;
}
const photoAt = (ctx, i) => {
  const ph = ctx.d.photos;
  return ph.length ? ph[i % ph.length] : (ctx.d.cover || '');
};
const phIdx = (ctx, i) => i % Math.max(1, ctx.d.photos.length);
// đường sóng: n con sóng trên bề rộng 1200, biên độ a; đóng kín xuống đáy để tô màu
function wavePath(n, a, y, phase = 0) {
  // vẽ rộng hơn khung (-100…1300) để sóng trôi ngang không lộ mép
  const w = 1400 / n;
  let d = `M-100 ${y}`;
  for (let i = 0; i < n; i++) {
    const x = i * w - 100;
    d += ` C${(x + w * 0.25 + phase).toFixed(0)} ${y - a} ${(x + w * 0.75 + phase).toFixed(0)} ${y + a} ${(x + w).toFixed(0)} ${y}`;
  }
  return `${d} L1300 121 L-100 121Z`;
}
// ba lớp sóng chồng lên nhau, lớp trên cùng mang màu của phần kế tiếp
const waves = (cls, top = 'var(--bg)') => `<svg class="bx-waves ${cls}" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
  <path class="w1" d="${wavePath(3, 18, 50)}" fill="var(--bx-sky)" opacity=".45"/>
  <path class="w2" d="${wavePath(4, 14, 66, 40)}" fill="var(--bx-sea)" opacity=".25"/>
  <path class="w3" d="${wavePath(3, 12, 84, 90)}" fill="${top}"/></svg>`;
const heart = `<svg class="bx-heart" viewBox="0 0 24 22" aria-hidden="true"><path fill="currentColor" d="M12 21.5C5 16.3 0 12 0 6.6 0 3 2.8 0 6.4 0 8.8 0 10.8 1.3 12 3.3 13.2 1.3 15.2 0 17.6 0 21.2 0 24 3 24 6.6 24 12 19 16.3 12 21.5z"/></svg>`;
const CAPTIONS = ['Gió biển thổi qua, và anh vẫn ở đây', 'Có em, ngày nào cũng là ngày nắng', 'Đi cùng nhau đến hết những con sóng', 'Bầu trời này, chỉ cần có hai ta', 'Mỗi ngày bên nhau là một ngày đẹp'];

module.exports = {
  id: 'bienxanh',
  name: 'Sóng Biển',
  group: 'toigian',
  badge: 'Mới',
  desc: 'Trời biển trong trẻo: ảnh tràn màn hình, chữ viết tay trắng, sóng nước mềm mại',
  fonts: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&family=Updock&family=Josefin+Sans:wght@300;400;600&display=swap',
  palettes: [
    { id: 'xanh-bien', name: 'Xanh biển', swatch: ['#dceaf5', '#3b6e98'], vars: { ...base, '--page': '#dfeaf3', '--bg': '#ffffff', '--paper': '#f5f9fc', '--ink': '#22374a', '--muted': '#6b8396', '--accent': '#3b6e98', '--accent-ink': '#ffffff', '--gold': '#b39a76', '--line': '#d8e5ef', '--bx-sky': '#a9c9e6', '--bx-sea': '#4f86b5', '--bx-deep': '#1f4466', '--bx-foam': '#eef5fb' } },
    { id: 'trang-cat', name: 'Trắng cát', swatch: ['#f6eee2', '#a07d55'], vars: { ...base, '--page': '#efe8dc', '--bg': '#fffdf9', '--paper': '#fbf6ee', '--ink': '#4a3d30', '--muted': '#8f7f6c', '--accent': '#a07d55', '--accent-ink': '#ffffff', '--gold': '#c3a57c', '--line': '#ebe0d0', '--bx-sky': '#e6d3b6', '--bx-sea': '#c29d70', '--bx-deep': '#6f5a43', '--bx-foam': '#f8f1e6' } },
  ],
  demo: {
    cover: '/demo/tim-2.jpg',
    photos: ['/demo/hoamoc-3.webp', '/demo/hoamoc-6.webp', '/demo/tim-8.jpg', '/demo/hoamoc-7.webp', '/demo/naudam-7.jpg', '/demo/hoamoc-2.webp', '/demo/tim-5.jpg', '/demo/hoamoc-4.webp'],
  },
  layout: ['intro', 'invite', 'lover', 'calendar', 'gallery', 'events', 'rsvp', 'gift', 'wishes', 'thanks'],

  title(text, sub) {
    return `<h2 class="bx-h">${esc(text)}</h2>${sub ? `<p class="bx-sub">${esc(sub)}</p>` : ''}`;
  },

  // bầu trời + sóng vỗ; chạm để sóng rút xuống, thiệp mở ra
  opener(ctx) {
    const p = ctx.dparts;
    return `
<div class="opener bx-opener" id="opener" data-open-ms="1000">
  <span class="bx-sun" aria-hidden="true"></span>
  <div class="bx-o-in">
    <p class="bx-o-k">The wedding of</p>
    <p class="bx-o-s">We got married</p>
    <p class="bx-o-n">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
    ${p ? `<p class="bx-o-d">${p.y} . ${p.m} . ${p.d}</p>` : ''}
    <p class="bx-o-to">${ctx.guest ? `Gửi <b>${esc(ctx.guest.name)}</b>` : 'Gửi bạn thân mến'}</p>
    <button class="bx-o-btn" id="openBtn" type="button">Chạm để mở thiệp</button>
  </div>
  <div class="bx-o-sea">${waves('o', '#fff')}</div>
</div>`;
  },

  cover(ctx) {
    const { d, dparts: p } = ctx;
    const photo = d.cover || d.photos[0] || '';
    return `
<header class="bx-cover">
  ${photo ? `<img class="bx-cimg" src="${esc(photo)}" alt="Ảnh cưới">` : ''}
  <div class="bx-tint"></div>
  <div class="bx-sky"></div>
  <p class="bx-top"><span>You are</span><span>the love of</span><span>my life</span></p>
  <h1 class="bx-wgm"><span>We got</span><span>married</span></h1>
  <p class="bx-tag">Hẹn gặp bạn trong ngày vui của chúng mình!</p>
  ${p ? `<p class="bx-cdate">${p.y}.${p.m}.${p.d}</p>` : ''}
  <div class="bx-cfoot">
    ${waves('c')}
    <div class="bx-gb">
      <div><p class="r">Groom</p><p class="n">${esc(ctx.g)}</p></div>
      <div><p class="r">Bride</p><p class="n">${esc(ctx.b)}</p></div>
    </div>
  </div>
</header>`;
  },

  sections: {
    // "Wedding" + ảnh rộng có dòng phụ đề kiểu phim
    intro(ctx) {
      const a = photoAt(ctx, 0);
      return `
  <section class="bx-intro reveal">
    ${heart}
    <h2 class="bx-wed">Wedding</h2>
    <p class="bx-intro-t">Thiệp mời cưới của chúng mình</p>
    <p class="bx-row"><span>Fall in</span><span>Love</span><span>Wedding</span></p>
    ${a ? `<button class="ph bx-ph bx-wide" data-i="${phIdx(ctx, 0)}" aria-label="Xem ảnh"><img loading="lazy" src="${esc(a)}" alt=""><span class="bx-subt">${esc(CAPTIONS[0])}</span></button>` : ''}
  </section>`;
    },

    invite(ctx) {
      const { d, guest } = ctx;
      const fam = (x, label) => `<div class="bx-fam"><p class="k">${label}</p>${x.father ? `<p>${esc(x.father)}</p>` : ''}${x.mother ? `<p>${esc(x.mother)}</p>` : ''}${x.address ? `<p class="a">${esc(x.address)}</p>` : ''}</div>`;
      const hasFam = d.groom.father || d.groom.mother || d.bride.father || d.bride.mother;
      return `
  <section class="sec bx-invite reveal">
    <p class="bx-lead">${esc(d.inviteText)}</p>
    <p class="bx-guest">${guest ? esc(guest.name) : 'Quý khách'}</p>
    <p class="bx-p">Gửi đến bạn tấm thiệp cưới đầy yêu thương. Mong bạn sẽ đến chung vui, cùng chứng kiến khoảnh khắc hạnh phúc nhất của hai đứa.</p>
    ${hasFam ? `<div class="bx-fams">${fam(d.groom, 'Nhà trai')}<span class="bx-amp">&amp;</span>${fam(d.bride, 'Nhà gái')}</div>` : ''}
    ${d.message ? `<p class="bx-msg">${esc(d.message)}</p>` : ''}
  </section>`;
    },

    // "My lover": hai ảnh chân dung + tên, đoạn thơ ngắn
    lover(ctx) {
      const { d } = ctx;
      const a = photoAt(ctx, 1), b = photoAt(ctx, 3);
      const one = (img, i, x, role, pos) => `<div class="bx-pp"><button class="ph bx-ph" data-i="${phIdx(ctx, i)}" aria-label="Xem ảnh"${img ? '' : ' hidden'}><img loading="lazy" src="${esc(img)}" alt="" style="object-position:${pos}"></button><i></i><p class="r">${role}</p><p class="n">${esc(x.fullName || x.name)}</p></div>`;
      return `
  <section class="sec bx-lover reveal">
    ${heart}
    <h2 class="bx-wed sm">My lover</h2>
    <div class="bx-pps">${one(a, 1, d.groom, 'Chú rể', '70% 30%')}${one(b, 3, d.bride, 'Cô dâu', '35% 30%')}</div>
    ${d.story ? `<div class="bx-poem">${d.story.split(/\n+/).map((t) => `<p>${esc(t)}</p>`).join('')}</div>` : ''}
  </section>`;
    },

    // bưu thiếp có răng cưa + dấu bưu điện ngày cưới; đếm ngược trên dải biển; lịch tháng
    calendar(ctx, opts, h) {
      const { d, dparts: p } = ctx;
      if (!p) return '';
      const party = partyEvent(d) || {};
      const time = party.time || d.time;
      const a = photoAt(ctx, 2);
      const u = (k, l) => `<span><b data-cd="${k}">0</b><small>${l}</small></span>`;
      return `
  <section class="sec bx-std reveal">
    ${heart}
    <h2 class="bx-wed sm">Save the date</h2>
    <p class="bx-p">Đi một vòng thật xa, cuối cùng vẫn là nhau.</p>
    <div class="bx-post">
      <div class="bx-stamp">${a ? `<img loading="lazy" src="${esc(a)}" alt="">` : ''}</div>
      <svg class="bx-mark" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="60" cy="60" r="40" fill="none" stroke="currentColor" stroke-width="1"/><path id="bxArc" d="M60 60m-47 0a47 47 0 1 1 94 0" fill="none"/><text font-size="11" letter-spacing="3" fill="currentColor"><textPath href="#bxArc" startOffset="50%" text-anchor="middle">SAVE THE DATE</textPath></text><text x="60" y="66" text-anchor="middle" font-size="18" fill="currentColor">${p.d}.${p.m}</text><text x="60" y="84" text-anchor="middle" font-size="11" letter-spacing="2" fill="currentColor">${p.y}</text><path d="M0 104q15-8 30 0t30 0 30 0 30 0" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>
      <p class="bx-pd">${esc(ctx.weekday)}, ${p.d}/${p.m}/${p.y}</p>
      <p class="bx-pl">Âm lịch ${esc(ctx.lunarShort)}${time ? ` | ${esc(h.clock(time))}` : ''}</p>
    </div>
  </section>
  ${d.show.countdown ? `<section class="bx-cdband reveal">
    ${waves('t', 'var(--bx-deep)')}
    <p class="bx-cdk">Đếm ngược tới ngày vui</p>
    <div class="bx-cd" role="timer">${u('d', 'Ngày')}${u('h', 'Giờ')}${u('m', 'Phút')}${u('s', 'Giây')}</div>
    ${waves('b')}
  </section>` : ''}
  ${d.show.calendar ? `<section class="sec bx-cal reveal">${h.calGrid(ctx, `<p class="bx-calh">Tháng ${+p.m} · ${p.y}</p>`)}<a class="bx-link" target="_blank" rel="noopener" href="${esc(h.calendarLink(`Đám cưới ${ctx.g} & ${ctx.b}`, ctx.date, time, party.address || party.place))}">Thêm vào lịch của bạn</a></section>` : ''}`;
    },

    // dải biển sâu: từng khung ảnh có lỗ phim hai bên và dòng phụ đề
    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      return `
  <section class="bx-film">
    <p class="bx-row w"><span>Welcome</span><span>to our</span><span>wedding</span></p>
    <div class="bx-reel">
      ${ph.map((u, i) => `<button class="ph bx-frame reveal" data-i="${i}" aria-label="Xem ảnh ${i + 1}"><img loading="lazy" src="${esc(u)}" alt=""><span class="bx-subt">${esc(CAPTIONS[(i + 1) % CAPTIONS.length])}</span><em>${String(i + 1).padStart(2, '0')}</em></button>`).join('')}
    </div>
  </section>`;
    },

    events(ctx, opts, h) {
      const evs = evList(ctx.d);
      if (!evs.length) return '';
      const party = partyEvent(ctx.d);
      return `
  <section class="sec bx-addr">
    ${heart}
    <h2 class="bx-wed sm">Address</h2>
    <div class="bx-evs">
      ${evs.map((e) => {
        const dir = e.mapUrl || (e.address ? h.mapSearch(e.address) : '');
        const other = e.date && e.date !== ctx.date;
        return `
      <article class="bx-ev reveal">
        <p class="t">${esc(h.clock(e.time)) || '—'}${other ? ` · ${esc(h.dmy(e.date, '/'))}` : ''}</p>
        <h3>${esc(e.name)}</h3>
        ${e.place ? `<p class="pl">${esc(e.place)}</p>` : ''}
        ${e.address ? `<p class="ad">${esc(e.address)}</p>` : ''}
        ${e === party && e.address ? `<div class="bx-map"><iframe loading="lazy" title="Bản đồ ${esc(e.name)}" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(e.address)}&amp;output=embed"></iframe></div>` : ''}
        ${dir ? `<a class="bx-btn" target="_blank" rel="noopener" href="${esc(dir)}">Chỉ đường</a>` : ''}
      </article>`;
      }).join('')}
    </div>
  </section>`;
    },

    thanks(ctx) {
      const a = photoAt(ctx, 4);
      return `
  <section class="bx-thanks reveal">
    ${a ? `<div class="bx-tph"><img loading="lazy" src="${esc(a)}" alt=""><p>“Mỗi lần nhìn em, anh lại thấy mình là người may mắn nhất.”</p></div>` : ''}
    <p class="bx-ty">Thank you</p>
    <p class="bx-tt">Cảm ơn bạn đã là một phần trong ngày hạnh phúc của chúng mình</p>
    <p class="bx-tn">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
    ${waves('f', 'var(--bx-foam)')}
  </section>`;
    },
  },

  css: `
.tpl-bienxanh{background:var(--page)}
.tpl-bienxanh .card{background:var(--bg);color:var(--ink);box-shadow:0 0 50px color-mix(in srgb,var(--bx-deep) 18%,transparent)}
.tpl-bienxanh .sec{padding:56px 26px}
.tpl-bienxanh .bx-h{margin:0;font-family:var(--font-title);font-weight:300;font-size:34px;line-height:1.2;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}
.tpl-bienxanh .bx-sub{margin:8px 0 26px;font-size:14px;color:var(--muted)}
.tpl-bienxanh .bx-heart{display:block;width:22px;margin:0 auto 18px;color:var(--gold);animation:bxBeat 1.8s ease-in-out infinite}
.tpl-bienxanh .bx-wed{margin:0;font-family:var(--font-title);font-weight:300;font-size:52px;line-height:1.1;letter-spacing:.16em;text-transform:uppercase;color:var(--gold)}
.tpl-bienxanh .bx-wed.sm{font-size:38px;margin-bottom:22px}
.tpl-bienxanh .bx-p{max-width:340px;margin:0 auto;font-family:var(--font-title);font-size:19px;line-height:1.55;color:var(--ink)}
.tpl-bienxanh .bx-row{display:flex;justify-content:space-between;margin:0;padding:0 22px;font-size:15px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink)}
.tpl-bienxanh .bx-row.w{color:#fff;opacity:.85}
.tpl-bienxanh .bx-ph{grid-column:auto;aspect-ratio:auto;position:relative;display:block;width:100%;border:0;padding:0;border-radius:0;background:var(--line);overflow:hidden}
.tpl-bienxanh .bx-ph img,.tpl-bienxanh .bx-frame img{width:100%;height:100%;object-fit:cover}
.tpl-bienxanh .bx-subt{position:absolute;left:0;right:0;bottom:0;padding:9px 10px;background:color-mix(in srgb,var(--bx-deep) 88%,transparent);color:#fff;font-size:13px;letter-spacing:.04em;text-align:center}
.tpl-bienxanh .bx-waves{display:block;width:100%;height:56px}
.tpl-bienxanh .bx-waves path{animation:bxDrift 9s ease-in-out infinite alternate}
.tpl-bienxanh .bx-waves .w2{animation-duration:7s;animation-delay:-2s}
.tpl-bienxanh .bx-waves .w3{animation-duration:11s}
@keyframes bxDrift{from{transform:translateX(-30px)}to{transform:translateX(30px)}}
@keyframes bxBeat{50%{transform:scale(1.15)}}

/* ---- màn mở thiệp ---- */
.tpl-bienxanh .bx-opener{flex-direction:column;background:linear-gradient(#8fb6da,#cfe2f1 55%,#eaf3fa);color:#fff;cursor:pointer;overflow:hidden;text-align:center}
.tpl-bienxanh .bx-sun{position:absolute;left:50%;top:18%;width:220px;height:220px;margin-left:-110px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.75),rgba(255,255,255,0) 70%);animation:bxGlow 5s ease-in-out infinite}
.tpl-bienxanh .bx-o-in{position:relative;z-index:1;padding:0 24px 120px;transition:opacity .6s,transform .8s}
.tpl-bienxanh .bx-o-in p{margin:0}
.tpl-bienxanh .bx-o-k{font-size:12px;letter-spacing:.34em;text-transform:uppercase}
.tpl-bienxanh .bx-o-s{font-family:var(--font-script);font-size:72px;line-height:1.1;text-shadow:0 2px 16px rgba(30,70,110,.25)}
.tpl-bienxanh .bx-o-n{font-family:var(--font-title);font-size:26px;letter-spacing:.06em}
.tpl-bienxanh .bx-o-d{margin-top:4px!important;font-size:14px;letter-spacing:.3em}
.tpl-bienxanh .bx-o-to{margin:28px 0 16px!important;font-size:15px;color:#2d5378}
.tpl-bienxanh .bx-o-to b{display:block;font-family:var(--font-title);font-weight:500;font-size:26px;color:#1f4466}
.tpl-bienxanh .bx-o-btn{padding:11px 26px;border:0;border-radius:999px;background:#fff;color:#2d5f8a;font-family:var(--font-body);font-size:14px;letter-spacing:.1em;box-shadow:0 8px 20px rgba(30,70,110,.2);animation:bxBob 2.4s ease-in-out infinite}
.tpl-bienxanh .bx-o-sea{position:absolute;left:0;right:0;bottom:0;transition:transform 1s ease}
.tpl-bienxanh .bx-o-sea .bx-waves{height:120px}
.tpl-bienxanh .bx-o-sea .w1{fill:#7fb0d9;opacity:.6}.tpl-bienxanh .bx-o-sea .w2{fill:#4f86b5;opacity:.45}
.tpl-bienxanh .bx-opener.opening .bx-o-in{opacity:0;transform:translateY(-40px)}
.tpl-bienxanh .bx-opener.opening .bx-o-sea{transform:translateY(-70vh) scaleY(3)}
@keyframes bxGlow{50%{transform:scale(1.12);opacity:.8}}
@keyframes bxBob{50%{transform:translateY(-4px)}}

/* ---- bìa ---- */
.tpl-bienxanh .bx-cover{position:relative;height:100svh;min-height:620px;max-height:900px;overflow:hidden;color:#fff;text-align:center;background:var(--bx-sky)}
.tpl-bienxanh .bx-cimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 40%;animation:bxZoom 16s ease-out both}
.tpl-bienxanh .bx-tint{position:absolute;inset:0;background:linear-gradient(var(--bx-sea),var(--bx-sky));mix-blend-mode:soft-light;opacity:.85}
.tpl-bienxanh .bx-sky{position:absolute;inset:0;background:linear-gradient(to bottom,color-mix(in srgb,var(--bx-sky) 92%,transparent) 0%,color-mix(in srgb,var(--bx-sky) 55%,transparent) 30%,transparent 52%)}
.tpl-bienxanh .bx-top{position:relative;display:flex;justify-content:space-between;margin:0;padding:18px 22px 0;font-size:12px;letter-spacing:.16em;text-transform:uppercase;opacity:.9}
.tpl-bienxanh .bx-wgm{position:relative;margin:16px 0 0;display:flex;flex-direction:column;font-family:var(--font-script);font-weight:400;font-size:clamp(76px,24vw,104px);line-height:.82;text-shadow:0 2px 18px rgba(20,60,100,.25)}
.tpl-bienxanh .bx-wgm span:first-child{padding-right:18%;animation:bxIn 1.4s .2s ease both}
.tpl-bienxanh .bx-wgm span:last-child{padding-left:22%;animation:bxIn 1.4s .6s ease both}
.tpl-bienxanh .bx-tag{position:relative;margin:22px 0 4px;font-family:var(--font-title);font-size:19px;font-style:italic;text-shadow:0 1px 8px rgba(20,60,100,.35);animation:bxIn 1.2s 1s ease both}
.tpl-bienxanh .bx-cdate{position:relative;margin:0;font-size:16px;letter-spacing:.24em;text-shadow:0 1px 8px rgba(20,60,100,.35);animation:bxIn 1.2s 1.1s ease both}
.tpl-bienxanh .bx-cfoot{position:absolute;left:0;right:0;bottom:0;color:var(--ink)}
.tpl-bienxanh .bx-cfoot .bx-waves{height:70px}
.tpl-bienxanh .bx-gb{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 20px 26px;background:var(--bg)}
.tpl-bienxanh .bx-gb p{margin:0}
.tpl-bienxanh .bx-gb .r{font-family:var(--font-title);font-size:22px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink)}
.tpl-bienxanh .bx-gb .n{font-family:var(--font-title);font-weight:300;font-size:28px;line-height:1.2;color:var(--accent)}
@keyframes bxZoom{from{transform:scale(1.1)}to{transform:scale(1)}}
@keyframes bxIn{from{opacity:0;transform:translateY(16px)}}

/* ---- giới thiệu ---- */
.tpl-bienxanh .bx-intro{padding:50px 0 0;text-align:center}
.tpl-bienxanh .bx-intro-t{margin:18px 0 44px;font-family:var(--font-title);font-size:19px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink)}
.tpl-bienxanh .bx-wide{margin-top:14px;aspect-ratio:4/3;border-top:12px solid var(--bx-deep)}
.tpl-bienxanh .bx-wide img{object-position:50% 30%}

/* ---- lời mời ---- */
.tpl-bienxanh .bx-invite{padding-top:48px}
.tpl-bienxanh .bx-lead{margin:0;font-size:13px;letter-spacing:.24em;text-transform:uppercase;color:var(--muted)}
.tpl-bienxanh .bx-guest{margin:4px 0 14px;font-family:var(--font-script);font-size:54px;line-height:1.15;color:var(--accent)}
.tpl-bienxanh .bx-fams{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;margin:34px 0 0;padding:22px 8px;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.tpl-bienxanh .bx-fam p{margin:0;font-family:var(--font-title);font-size:17px;line-height:1.45}
.tpl-bienxanh .bx-fam .k{margin-bottom:6px;font-family:var(--font-body);font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:var(--accent)}
.tpl-bienxanh .bx-fam .a{margin-top:4px;font-size:14px;color:var(--muted)}
.tpl-bienxanh .bx-amp{font-family:var(--font-script);font-size:40px;color:var(--gold)}
.tpl-bienxanh .bx-msg{margin:26px auto 0;max-width:330px;font-family:var(--font-title);font-style:italic;font-size:17px;color:var(--muted)}

/* ---- my lover ---- */
.tpl-bienxanh .bx-pps{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.tpl-bienxanh .bx-pp .bx-ph{aspect-ratio:7/10}
.tpl-bienxanh .bx-pp i{display:block;width:1px;height:26px;margin:14px auto 8px;background:var(--ink)}
.tpl-bienxanh .bx-pp p{margin:0}
.tpl-bienxanh .bx-pp .r{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--muted)}
.tpl-bienxanh .bx-pp .n{font-family:var(--font-title);font-size:22px;line-height:1.3;color:var(--ink)}
.tpl-bienxanh .bx-poem{max-width:330px;margin:36px auto 0;font-family:var(--font-title);font-size:19px;font-style:italic;line-height:1.55;color:var(--ink)}
.tpl-bienxanh .bx-poem p{margin:0 0 8px}

/* ---- save the date: bưu thiếp ---- */
.tpl-bienxanh .bx-std{padding-bottom:40px}
.tpl-bienxanh .bx-post{position:relative;margin:30px 6px 0;padding:16px 16px 22px;background:var(--bx-foam);box-shadow:0 18px 36px -18px color-mix(in srgb,var(--bx-deep) 45%,transparent);transform:rotate(-1.2deg)}
.tpl-bienxanh .bx-stamp{aspect-ratio:4/5;padding:10px;background:#fff;-webkit-mask:linear-gradient(#000 0 0) content-box,radial-gradient(circle 5px at 7px 7px,transparent 96%,#000) -7px -7px/14px 14px;mask:linear-gradient(#000 0 0) content-box,radial-gradient(circle 5px at 7px 7px,transparent 96%,#000) -7px -7px/14px 14px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.12))}
.tpl-bienxanh .bx-stamp img{width:100%;height:100%;object-fit:cover}
.tpl-bienxanh .bx-mark{position:absolute;right:-12px;bottom:104px;width:108px;color:var(--accent);opacity:.85;transform:rotate(-14deg);font-family:var(--font-body)}
.tpl-bienxanh .bx-pd{margin:16px 0 2px;font-family:var(--font-title);font-size:26px;color:var(--ink)}
.tpl-bienxanh .bx-pl{margin:0;font-size:14px;letter-spacing:.06em;color:var(--muted)}

/* ---- đếm ngược trên dải biển ---- */
.tpl-bienxanh .bx-cdband{position:relative;background:var(--bx-deep);color:#fff;text-align:center}
.tpl-bienxanh .bx-cdband .bx-waves.t{transform:scaleY(-1);margin-bottom:-1px;background:var(--bg)}
.tpl-bienxanh .bx-cdband .bx-waves.t .w3{fill:var(--bx-deep)}
.tpl-bienxanh .bx-cdband .bx-waves.b{margin-top:10px}
.tpl-bienxanh .bx-cdk{margin:6px 0 14px;font-size:12px;letter-spacing:.3em;text-transform:uppercase;opacity:.75}
.tpl-bienxanh .bx-cd{display:flex;justify-content:center;gap:30px;font-variant-numeric:tabular-nums}
.tpl-bienxanh .bx-cd span{display:flex;flex-direction:column;align-items:center}
.tpl-bienxanh .bx-cd b{font-family:var(--font-title);font-weight:400;font-size:38px;line-height:1.1}
.tpl-bienxanh .bx-cd small{font-size:12px;opacity:.75}

/* ---- lịch ---- */
.tpl-bienxanh .bx-cal{padding-top:20px;--cal-hi:var(--accent)}
.tpl-bienxanh .bx-calh{margin:0 0 14px;font-family:var(--font-title);font-size:24px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink)}
.tpl-bienxanh .bx-cal .cal-grid{font-family:var(--font-title);font-size:17px}
.tpl-bienxanh .bx-link{display:inline-block;margin-top:18px;font-size:13px;letter-spacing:.1em;color:var(--accent);text-decoration:none;border-bottom:1px solid currentColor}

/* ---- cuộn phim biển sâu ---- */
.tpl-bienxanh .bx-film{padding:30px 0 30px;background:var(--bx-deep)}
.tpl-bienxanh .bx-reel{display:grid;gap:14px;margin-top:22px;padding:0 34px;background:repeating-linear-gradient(to bottom,transparent 0 10px,rgba(255,255,255,.55) 10px 20px,transparent 20px 28px) 10px 0/12px 100% no-repeat,repeating-linear-gradient(to bottom,transparent 0 10px,rgba(255,255,255,.55) 10px 20px,transparent 20px 28px) calc(100% - 10px) 0/12px 100% no-repeat}
.tpl-bienxanh .bx-frame{grid-column:auto;position:relative;display:block;width:100%;aspect-ratio:4/3;border:0;padding:0;border-radius:2px;background:#0d2236;overflow:hidden}
.tpl-bienxanh .bx-frame:nth-child(3n+2){aspect-ratio:4/5}
.tpl-bienxanh .bx-frame .bx-subt{background:none;bottom:6px;text-shadow:0 1px 6px rgba(0,0,0,.7);font-size:14px}
.tpl-bienxanh .bx-frame em{position:absolute;top:8px;right:10px;font-style:normal;font-size:11px;letter-spacing:.2em;color:#fff;opacity:.8}

/* ---- địa chỉ ---- */
.tpl-bienxanh .bx-evs{display:grid;gap:18px}
.tpl-bienxanh .bx-ev{padding:22px 18px;border:1px solid var(--line);border-radius:22px;background:linear-gradient(var(--bg),var(--bx-foam))}
.tpl-bienxanh .bx-ev p{margin:0}
.tpl-bienxanh .bx-ev .t{font-family:var(--font-title);font-size:30px;line-height:1.1;color:var(--accent)}
.tpl-bienxanh .bx-ev h3{margin:2px 0 8px;font-weight:400;font-size:13px;letter-spacing:.26em;text-transform:uppercase;color:var(--muted)}
.tpl-bienxanh .bx-ev .pl{font-family:var(--font-title);font-size:21px;line-height:1.3}
.tpl-bienxanh .bx-ev .ad{margin-top:2px;font-size:14px;color:var(--muted)}
.tpl-bienxanh .bx-map{margin:14px 0 0;aspect-ratio:4/3;border-radius:14px;overflow:hidden;background:var(--line)}
.tpl-bienxanh .bx-map iframe{width:100%;height:100%;border:0}
.tpl-bienxanh .bx-btn{display:inline-block;margin-top:14px;padding:8px 22px;border-radius:999px;background:var(--accent);color:var(--accent-ink);font-size:13px;letter-spacing:.1em;text-decoration:none}

/* ---- biểu mẫu, quà, lưu bút ---- */
.tpl-bienxanh .s-rsvp,.tpl-bienxanh .s-wishes{background:var(--bx-foam)}
.tpl-bienxanh .form{border:0;border-radius:22px;background:var(--bg);box-shadow:0 14px 30px -18px color-mix(in srgb,var(--bx-deep) 40%,transparent)}
.tpl-bienxanh .form input:not([type=radio]),.tpl-bienxanh .form select,.tpl-bienxanh .form textarea,.tpl-bienxanh .choice label{border-radius:14px;background:var(--paper)}
.tpl-bienxanh .btn{letter-spacing:.12em;text-transform:uppercase;font-weight:400}
.tpl-bienxanh .gift{border-radius:22px;background:var(--bx-foam);border-color:var(--line)}
.tpl-bienxanh .gift-who{font-family:var(--font-title);font-size:22px}
.tpl-bienxanh .wish{border-radius:18px;border:0;background:var(--bg)}

/* ---- cảm ơn ---- */
.tpl-bienxanh .bx-thanks{position:relative;padding:0 0 0;text-align:center}
.tpl-bienxanh .bx-tph{position:relative;aspect-ratio:4/5;overflow:hidden}
.tpl-bienxanh .bx-tph img{width:100%;height:100%;object-fit:cover}
.tpl-bienxanh .bx-tph::after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 55%,var(--bg))}
.tpl-bienxanh .bx-tph p{position:absolute;left:20px;right:20px;bottom:10px;z-index:1;margin:0;font-family:var(--font-title);font-style:italic;font-size:17px;color:var(--ink)}
.tpl-bienxanh .bx-ty{margin:26px 0 6px;font-family:var(--font-script);font-size:76px;line-height:1;color:var(--gold)}
.tpl-bienxanh .bx-tt{max-width:320px;margin:0 auto;font-size:15px;color:var(--muted)}
.tpl-bienxanh .bx-tn{margin:14px 0 10px;font-family:var(--font-title);font-size:24px;letter-spacing:.06em;color:var(--ink)}
.tpl-bienxanh .credit{background:var(--bx-foam)}

@media (prefers-reduced-motion:reduce){
  .tpl-bienxanh .bx-waves path,.tpl-bienxanh .bx-heart,.tpl-bienxanh .bx-sun,.tpl-bienxanh .bx-o-btn,.tpl-bienxanh .bx-cimg,.tpl-bienxanh .bx-wgm span,.tpl-bienxanh .bx-tag,.tpl-bienxanh .bx-cdate{animation:none}
}
`,
};
