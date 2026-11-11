// Mẫu "Hàn Thư" — phong cách cưới Hàn Quốc: nền kem, ảnh cưới tràn khung làm bìa, dòng chữ viết tay
// vắt ngang ảnh, tên cô dâu chú rể chữ có chân, đếm ngược bốn ô ngay dưới bìa, nhiều ảnh bố cục thoáng.
const { esc } = require('../lib/util');

const base = {
  '--font-title': "'Playfair Display',Georgia,serif",
  '--font-script': "'Pinyon Script',cursive",
  '--font-body': "'Lora',Georgia,serif",
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
const heart = (cls = '') => `<svg class="${cls}" viewBox="0 0 24 22" aria-hidden="true"><path fill="currentColor" d="M12 21.5C5 16.3 0 12 0 6.6 0 3 2.8 0 6.4 0 8.8 0 10.8 1.3 12 3.3 13.2 1.3 15.2 0 17.6 0 21.2 0 24 3 24 6.6 24 12 19 16.3 12 21.5z"/></svg>`;
// cành hoa ép khô vẽ tay (trang trí màn mở thiệp và lời cảm ơn)
const pressed = (cls) => `<svg class="${cls}" viewBox="0 0 120 160" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
  <path d="M60 158C58 120 62 80 56 40"/><path d="M58 112c-14-6-22-18-24-30 12 4 22 14 24 30z" fill="currentColor" fill-opacity=".12"/>
  <path d="M59 92c14-6 24-18 26-32-14 6-24 16-26 32z" fill="currentColor" fill-opacity=".12"/>
  <path d="M57 68c-10-4-16-12-18-22 10 3 16 10 18 22z" fill="currentColor" fill-opacity=".12"/>
  <g transform="translate(56 30)"><circle r="5" fill="currentColor" fill-opacity=".35"/>${[0, 72, 144, 216, 288].map((a) => `<ellipse rx="6" ry="11" transform="rotate(${a}) translate(0 -13)" fill="currentColor" fill-opacity=".14"/>`).join('')}</g>
  <g transform="translate(86 58) scale(.55)"><circle r="5" fill="currentColor" fill-opacity=".35"/>${[0, 72, 144, 216, 288].map((a) => `<ellipse rx="6" ry="11" transform="rotate(${a}) translate(0 -13)" fill="currentColor" fill-opacity=".14"/>`).join('')}</g>
  <path d="M60 104c8-12 18-30 26-46"/></svg>`;

module.exports = {
  id: 'hanthu',
  name: 'Hàn Thư',
  group: 'toigian',
  badge: 'Mới',
  desc: 'Phong cách cưới Hàn Quốc: ảnh lớn tràn khung, nền kem, chữ viết tay nhẹ nhàng',
  fonts: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Pinyon+Script&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap',
  palettes: [
    { id: 'nau-kem', name: 'Nâu kem', swatch: ['#f6efe6', '#7a2e2e'], vars: { ...base, '--page': '#ece4da', '--bg': '#fbf7f1', '--paper': '#fffdf9', '--ink': '#3d2a24', '--muted': '#8a766c', '--accent': '#7a2e2e', '--accent-ink': '#fbf4ec', '--gold': '#b89a72', '--line': '#e8ddcf', '--ht-soft': '#f3ebe0', '--ht-shadow': 'rgba(80,50,30,.18)' } },
    { id: 'hong-kem', name: 'Hồng kem', swatch: ['#fbf1ef', '#b0566a'], vars: { ...base, '--page': '#f3e6e4', '--bg': '#fdf8f6', '--paper': '#fffdfc', '--ink': '#4a2e33', '--muted': '#94767b', '--accent': '#a84d61', '--accent-ink': '#fff8f7', '--gold': '#c99a8e', '--line': '#efdcd9', '--ht-soft': '#f8ebe8', '--ht-shadow': 'rgba(120,60,70,.16)' } },
  ],
  demo: {
    cover: '/demo/nau-2.jpg',
    photos: ['/demo/nau-6.jpg', '/demo/nau-5.jpg', '/demo/nau-4.jpg', '/demo/nau-8.jpg', '/demo/nau-1.jpg', '/demo/nau-7.jpg', '/demo/nau-3.jpg'],
  },
  layout: ['duo', 'invite', 'calendar', 'events', 'couple', 'gallery', 'rsvp', 'gift', 'wishes', 'thanks'],

  title(text, sub) {
    return `<h2 class="ht-h">${esc(text)}</h2>${sub ? `<p class="ht-sub">${esc(sub)}</p>` : ''}`;
  },

  // lá thư kem dán tim: chạm để nắp thư mở ra, thư trượt lên
  opener(ctx) {
    const p = ctx.dparts;
    return `
<div class="opener ht-opener" id="opener" data-open-ms="1100">
  ${pressed('ht-o-fl a')}${pressed('ht-o-fl b')}
  <div class="ht-env">
    <div class="ht-letter">
      <p class="ht-l-k">Wedding letter</p>
      <p class="ht-l-n">${esc(ctx.g)} <i>&amp;</i> ${esc(ctx.b)}</p>
      ${p ? `<p class="ht-l-d">${p.d} . ${p.m} . ${p.y}</p>` : ''}
    </div>
    <div class="ht-env-back"></div>
    <div class="ht-env-flap"></div>
    <span class="ht-seal">${heart()}</span>
  </div>
  <p class="ht-o-to">${ctx.guest ? `Gửi <b>${esc(ctx.guest.name)}</b>` : 'Gửi bạn thân mến'}</p>
  <button class="ht-o-btn" id="openBtn" type="button">Chạm để mở thư</button>
</div>`;
  },

  cover(ctx) {
    const { d, dparts: p } = ctx;
    const photo = d.cover || d.photos[0] || '';
    const u = (k, l) => `<span><b data-cd="${k}">0</b><small>${l}</small></span>`;
    return `
<header class="ht-cover">
  <div class="ht-hero">
    ${photo ? `<img class="ht-hero-img" src="${esc(photo)}" alt="Ảnh cưới">` : ''}
    <div class="ht-hero-veil"></div>
    <p class="ht-wgm">We got married!</p>
    <h1 class="ht-names"><span class="g">${esc(ctx.g)}</span><span class="amp">&amp;</span><span class="b">${esc(ctx.b)}</span></h1>
    ${p ? `<p class="ht-hdate">${p.d}.${p.m}.${p.y}</p>` : ''}
    <p class="ht-hline">and we will become husband &amp; wife</p>
  </div>
  ${p && d.show.countdown ? `<div class="ht-cd" role="timer">${u('d', 'Ngày')}${u('h', 'Giờ')}${u('m', 'Phút')}${u('s', 'Giây')}</div>` : ''}
</header>`;
  },

  sections: {
    // hai ảnh so le bo góc, bóng mềm
    duo(ctx) {
      const a = photoAt(ctx, 0), b = photoAt(ctx, 1);
      if (!a) return '';
      return `
  <section class="ht-duo">
    <button class="ph ht-ph a reveal" data-i="0" aria-label="Xem ảnh"><img loading="lazy" src="${esc(a)}" alt=""></button>
    ${ctx.d.photos.length > 1 ? `<button class="ph ht-ph b reveal" data-i="1" aria-label="Xem ảnh"><img loading="lazy" src="${esc(b)}" alt=""></button>` : ''}
  </section>`;
    },

    // SAVE the DATE + hai gia đình + lời mời có tên khách + tên viết tay
    invite(ctx) {
      const { d, guest } = ctx;
      const fam = (x, label) => `<div class="ht-fam"><h3>${label}</h3>${x.father ? `<p>${esc(x.father)}</p>` : ''}${x.mother ? `<p>${esc(x.mother)}</p>` : ''}${x.address ? `<p class="a">${esc(x.address)}</p>` : ''}</div>`;
      const hasFam = d.groom.father || d.groom.mother || d.bride.father || d.bride.mother;
      return `
  <section class="sec ht-invite">
    <p class="ht-std reveal"><span class="s">Save</span><span class="t">the</span><span class="d">Date</span></p>
    ${hasFam ? `<div class="ht-fams reveal">${fam(d.groom, 'Nhà trai')}<i></i>${fam(d.bride, 'Nhà gái')}</div>` : ''}
    <div class="reveal">
      <p class="ht-lead">${esc(d.inviteText)}</p>
      <p class="ht-guest">${guest ? esc(guest.name) : 'Quý khách'}</p>
      <p class="ht-lead">đến dự lễ thành hôn của chúng mình</p>
    </div>
    <div class="ht-sign reveal">
      <p>${esc(d.groom.fullName || d.groom.name || ctx.g)}</p>
      <span>&amp;</span>
      <p>${esc(d.bride.fullName || d.bride.name || ctx.b)}</p>
    </div>
    ${d.message ? `<p class="ht-msg reveal">${esc(d.message)}</p>` : ''}
  </section>`;
    },

    // giờ + ngày lớn, rồi tờ lịch giấy có lỗ gáy và kẹp giấy
    calendar(ctx, opts, h) {
      const { d, dparts: p } = ctx;
      if (!p) return '';
      const party = partyEvent(d) || {};
      const time = party.time || d.time;
      const grid = d.show.calendar ? h.calGrid(ctx, `<p class="ht-calh"><b>${p.m}</b><i>/</i><b>${p.y}</b></p>`) : '';
      return `
  <section class="sec ht-when reveal">
    <p class="ht-lead">Được tổ chức vào lúc</p>
    <p class="ht-big">${time ? `${esc(h.clock(time))} — ` : ''}${esc(ctx.weekday)}</p>
    <p class="ht-big2">${p.d}.${p.m}.${p.y}</p>
    <p class="ht-lunar">${esc(ctx.lunar)}</p>
    ${grid ? `<div class="ht-note">
      <svg class="ht-clip" viewBox="0 0 40 90" aria-hidden="true"><path d="M14 84V20a8 8 0 0 1 16 0v52a13 13 0 0 1-26 0V26" fill="none" stroke="#9a9a9a" stroke-width="3.2" stroke-linecap="round"/></svg>
      <div class="ht-holes" aria-hidden="true">${'<i></i>'.repeat(13)}</div>
      <span class="ht-wm" aria-hidden="true">${p.y}</span>
      ${grid}
      <a class="ht-addcal" target="_blank" rel="noopener" href="${esc(h.calendarLink(`Đám cưới ${ctx.g} & ${ctx.b}`, ctx.date, time, party.address || party.place))}">Thêm vào lịch</a>
    </div>` : ''}
  </section>`;
    },

    // địa điểm từng nghi lễ (bản đồ cho tiệc chính) + dải dòng thời gian trên nền ảnh mờ
    events(ctx, opts, h) {
      const evs = evList(ctx.d);
      if (!evs.length) return '';
      const party = partyEvent(ctx.d);
      const bg = photoAt(ctx, 4);
      return `
  <section class="sec ht-venues">
    ${evs.filter((e) => e.place || e.address).map((e) => {
      const dir = e.mapUrl || (e.address ? h.mapSearch(e.address) : '');
      const other = e.date && e.date !== ctx.date;
      return `
    <article class="ht-venue reveal">
      <p class="k">${esc(e.name)}${e.time ? ` · ${esc(h.clock(e.time))}` : ''}${other ? ` · ${esc(h.dmy(e.date))}` : ''}</p>
      ${e.place ? `<h3>${esc(e.place)}</h3>` : ''}
      ${e.address ? `<p class="a">${esc(e.address)}</p>` : ''}
      ${e === party && e.address ? `<div class="ht-map"><iframe loading="lazy" title="Bản đồ ${esc(e.name)}" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(e.address)}&amp;output=embed"></iframe></div>` : ''}
      ${dir ? `<a class="ht-btn" target="_blank" rel="noopener" href="${esc(dir)}">Chỉ đường</a>` : ''}
    </article>`;
    }).join('')}
  </section>
  <section class="ht-tl reveal"${bg ? ` style="--ht-tlbg:url('${esc(bg)}')"` : ''}>
    <h2 class="ht-tlh">Timeline</h2>
    <ol>
      ${evs.map((e) => `<li><span class="dot">${heart()}</span><b>${esc(h.clock(e.time)) || '—'}</b><span>${esc(e.name)}</span></li>`).join('')}
    </ol>
  </section>`;
    },

    // cô dâu — ảnh trái, chú rể — ảnh phải
    couple(ctx) {
      const { d } = ctx;
      const a = photoAt(ctx, 2), b = photoAt(ctx, 3);
      const row = (img, i, role, x, side) => `
    <div class="ht-pp ${side} reveal">
      ${img ? `<button class="ph ht-ph" data-i="${i % Math.max(1, d.photos.length)}" aria-label="Xem ảnh"><img loading="lazy" src="${esc(img)}" alt=""></button>` : ''}
      <div class="t"><p class="role">${role}</p><p class="n">${esc(x.fullName || x.name)}</p>${x.address ? `<p class="a">${esc(x.address)}</p>` : ''}</div>
    </div>`;
      return `
  <section class="sec ht-couple">
    ${row(a, 2, 'Cô dâu', d.bride, 'l')}
    ${row(b, 3, 'Chú rể', d.groom, 'r')}
  </section>`;
    },

    // album thoáng: ảnh lớn, rồi các cặp ảnh lệch tầng
    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      return `
  <section class="sec ht-album">
    <h2 class="ht-h">Our moments</h2>
    <p class="ht-sub">Những khoảnh khắc của chúng mình</p>
    <div class="ht-grid">
      ${ph.map((u, i) => `<button class="ph ht-ph g${i % 5} reveal" data-i="${i}" aria-label="Xem ảnh ${i + 1}"><img loading="lazy" src="${esc(u)}" alt=""></button>`).join('')}
    </div>
  </section>`;
    },

    rsvp(ctx, opts, h) {
      const html = h.rsvp(ctx);
      if (!html) return '';
      return html.replace('<form', '<p class="ht-rsvp-lead">Hãy cho chúng mình biết bạn sẽ đến nhé, để mọi thứ được chuẩn bị chu đáo nhất.</p><form');
    },

    // nút "Hộp quà mừng" mở ra mã QR hai bên
    gift(ctx, opts, h) {
      if (!ctx.d.show.gift) return '';
      const html = h.giftCard(ctx, ctx.d.gifts.groom, 'groom') + h.giftCard(ctx, ctx.d.gifts.bride, 'bride');
      if (!html) return '';
      return `
  <section class="sec ht-gift reveal">
    <details>
      <summary><span class="ht-box">Hộp quà mừng</span><span class="ht-hint">Chạm để xem mã QR</span></summary>
      <div class="gifts">${html}</div>
    </details>
  </section>`;
    },

    thanks(ctx) {
      const last = photoAt(ctx, 5);
      return `
  <section class="sec ht-thanks reveal">
    ${last ? `<div class="ht-tph"><img loading="lazy" src="${esc(last)}" alt=""></div>` : ''}
    ${pressed('ht-t-fl')}
    <p class="ht-ty">Thank you!</p>
    <p>Cảm ơn bạn đã là một phần trong ngày hạnh phúc của chúng mình</p>
    <p class="ht-tn">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
  </section>`;
    },
  },

  css: `
.tpl-hanthu{background:var(--page)}
.tpl-hanthu .card{background:var(--bg);color:var(--ink);box-shadow:0 0 50px var(--ht-shadow)}
.tpl-hanthu .sec{padding:56px 26px}
.tpl-hanthu .ht-h{margin:0;font-family:var(--font-title);font-weight:500;font-size:32px;line-height:1.2;color:var(--accent)}
.tpl-hanthu .ht-sub{margin:6px 0 26px;font-size:14px;font-style:italic;color:var(--muted)}
.tpl-hanthu .ht-lead{margin:0;font-family:var(--font-title);font-size:17px;line-height:1.5;color:var(--ink)}
.tpl-hanthu .ht-ph{grid-column:auto;aspect-ratio:auto;display:block;border:0;padding:0;background:var(--line);overflow:hidden;border-radius:14px;box-shadow:0 14px 30px -10px var(--ht-shadow)}
.tpl-hanthu .ht-ph img{width:100%;height:100%;object-fit:cover;transition:transform 1.2s ease}
.tpl-hanthu .ht-ph:hover img{transform:scale(1.04)}

/* ---- màn mở thiệp: phong bì kem ---- */
.tpl-hanthu .ht-opener{background:radial-gradient(120% 80% at 50% 30%,var(--paper),var(--ht-soft));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;padding:24px;cursor:pointer;overflow:hidden}
.tpl-hanthu .ht-o-fl{position:absolute;width:150px;color:var(--gold);opacity:.75}
.tpl-hanthu .ht-o-fl.a{left:-20px;top:4%;transform:rotate(-18deg)}
.tpl-hanthu .ht-o-fl.b{right:-24px;bottom:3%;transform:rotate(160deg)}
.tpl-hanthu .ht-env{position:relative;width:min(300px,80vw);aspect-ratio:3/2;margin-top:60px;animation:htFloat 4s ease-in-out infinite}
.tpl-hanthu .ht-env-back{position:absolute;inset:0;z-index:2;border-radius:6px;background:linear-gradient(160deg,#fffaf2,#efe3d2);box-shadow:0 18px 40px -12px var(--ht-shadow);clip-path:polygon(0 0,50% 52%,100% 0,100% 100%,0 100%)}
.tpl-hanthu .ht-env::after{content:"";position:absolute;inset:0;z-index:3;border-radius:6px;background:linear-gradient(to top right,transparent 49.6%,rgba(120,90,60,.12) 50%,transparent 50.4%),linear-gradient(to top left,transparent 49.6%,rgba(120,90,60,.12) 50%,transparent 50.4%);pointer-events:none}
.tpl-hanthu .ht-env-flap{position:absolute;left:0;right:0;top:0;height:58%;z-index:4;background:linear-gradient(#f7eee2,#ecdfcc);clip-path:polygon(0 0,100% 0,50% 100%);transform-origin:top;transition:transform .7s ease,z-index 0s .35s}
.tpl-hanthu .ht-seal{position:absolute;left:50%;top:58%;z-index:5;width:44px;height:44px;margin:-22px 0 0 -22px;display:grid;place-items:center;border-radius:50%;background:var(--accent);color:var(--accent-ink);box-shadow:0 4px 10px var(--ht-shadow);transition:opacity .3s}
.tpl-hanthu .ht-seal svg{width:18px}
.tpl-hanthu .ht-letter{position:absolute;left:6%;right:6%;top:6%;bottom:6%;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--paper);border-radius:4px;box-shadow:0 2px 8px var(--ht-shadow);text-align:center;transition:transform .8s cubic-bezier(.3,.7,.3,1) .35s}
.tpl-hanthu .ht-letter p{margin:0}
.tpl-hanthu .ht-l-k{font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:var(--muted)}
.tpl-hanthu .ht-l-n{font-family:var(--font-script);font-size:34px;line-height:1.3;color:var(--accent)}
.tpl-hanthu .ht-l-n i{font-style:normal;font-size:24px;color:var(--gold)}
.tpl-hanthu .ht-l-d{font-family:var(--font-title);font-size:14px;letter-spacing:.2em;color:var(--ink)}
.tpl-hanthu .ht-o-to{position:relative;margin:24px 0 0;font-family:var(--font-title);font-size:18px;color:var(--ink);text-align:center}
.tpl-hanthu .ht-o-to b{display:block;font-family:var(--font-script);font-weight:400;font-size:36px;line-height:1.3;color:var(--accent)}
.tpl-hanthu .ht-o-btn{position:relative;padding:10px 26px;border:1px solid var(--accent);border-radius:999px;background:transparent;color:var(--accent);font-family:var(--font-body);font-size:14px;letter-spacing:.08em;animation:htPulse 2.2s ease-in-out infinite}
.tpl-hanthu .ht-opener.opening .ht-env-flap{transform:rotateX(180deg);z-index:0}
.tpl-hanthu .ht-opener.opening .ht-seal{opacity:0}
.tpl-hanthu .ht-opener.opening .ht-letter{transform:translateY(-62%);z-index:3}
@keyframes htFloat{50%{transform:translateY(-6px)}}
@keyframes htPulse{50%{box-shadow:0 0 0 8px color-mix(in srgb,var(--accent) 12%,transparent)}}

/* ---- bìa: ảnh tràn khung ---- */
.tpl-hanthu .ht-cover{position:relative;background:var(--bg)}
.tpl-hanthu .ht-hero{position:relative;height:calc(100svh - 96px);min-height:540px;max-height:860px;overflow:hidden;color:var(--accent)}
.tpl-hanthu .ht-hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 20%;animation:htZoom 14s ease-out both}
.tpl-hanthu .ht-hero-veil{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 34%,color-mix(in srgb,var(--bg) 55%,transparent) 58%,color-mix(in srgb,var(--bg) 92%,transparent) 82%,var(--bg))}
.tpl-hanthu .ht-wgm{position:absolute;right:18px;top:40%;margin:0;font-family:var(--font-script);font-size:clamp(40px,12vw,54px);line-height:1;transform:rotate(-9deg);color:var(--accent);text-shadow:0 0 18px rgba(255,255,255,.75);animation:htIn 1.4s .3s ease both}
.tpl-hanthu .ht-names{position:absolute;left:0;right:0;top:55%;margin:0;padding:0 26px;font-family:var(--font-title);font-weight:500;font-size:clamp(26px,8vw,34px);line-height:1.15;text-transform:uppercase;letter-spacing:.02em}
.tpl-hanthu .ht-names span{display:block;animation:htIn 1.2s ease both}
.tpl-hanthu .ht-names .g{animation-delay:.5s}
.tpl-hanthu .ht-names .amp{padding-left:28%;font-size:.95em;text-transform:none;animation-delay:.7s}
.tpl-hanthu .ht-names .b{text-align:right;animation-delay:.9s}
.tpl-hanthu .ht-hdate{position:absolute;left:0;right:0;bottom:62px;margin:0;text-align:center;font-family:var(--font-title);font-size:19px;letter-spacing:.12em;color:var(--ink)}
.tpl-hanthu .ht-hline{position:absolute;left:0;right:0;bottom:16px;margin:0;text-align:center;font-family:var(--font-script);font-size:27px;color:var(--accent)}
.tpl-hanthu .ht-cd{display:flex;justify-content:center;gap:12px;padding:14px 16px 6px;font-variant-numeric:tabular-nums}
.tpl-hanthu .ht-cd span{display:flex;flex-direction:column;align-items:center;justify-content:center;width:58px;height:58px;border-radius:10px;background:var(--accent);color:var(--accent-ink);box-shadow:0 6px 14px -4px var(--ht-shadow)}
.tpl-hanthu .ht-cd b{font-family:var(--font-title);font-weight:500;font-size:22px;line-height:1.1}
.tpl-hanthu .ht-cd small{font-size:11px;opacity:.85}
@keyframes htZoom{from{transform:scale(1.08)}to{transform:scale(1)}}
@keyframes htIn{from{opacity:0;transform:translateY(14px)}}
.tpl-hanthu .ht-wgm{animation-name:htInR}
@keyframes htInR{from{opacity:0;transform:rotate(-9deg) translateY(14px)}to{opacity:1;transform:rotate(-9deg)}}

/* ---- hai ảnh so le ---- */
.tpl-hanthu .ht-duo{position:relative;height:380px;margin:40px 0 0}
.tpl-hanthu .ht-duo .ht-ph{position:absolute}
.tpl-hanthu .ht-duo .a{left:20px;top:0;width:48%;aspect-ratio:3/4}
.tpl-hanthu .ht-duo .b{right:20px;top:110px;width:44%;aspect-ratio:4/5}

/* ---- lời mời ---- */
.tpl-hanthu .ht-std{display:flex;flex-direction:column;width:250px;margin:0 auto 36px;font-family:var(--font-title);font-weight:400;line-height:.95;color:var(--accent)}
.tpl-hanthu .ht-std .s{align-self:flex-start;font-size:64px;letter-spacing:.02em}
.tpl-hanthu .ht-std .t{align-self:center;font-size:32px;font-style:italic}
.tpl-hanthu .ht-std .d{align-self:flex-end;font-size:64px}
.tpl-hanthu .ht-fams{display:grid;grid-template-columns:1fr 1px 1fr;gap:16px;margin:0 auto 40px;max-width:400px}
.tpl-hanthu .ht-fams>i{background:var(--accent)}
.tpl-hanthu .ht-fam h3{margin:0 0 8px;font-family:var(--font-title);font-weight:600;font-size:18px;color:var(--ink)}
.tpl-hanthu .ht-fam p{margin:0;font-size:15px;line-height:1.55}
.tpl-hanthu .ht-fam .a{margin-top:4px;color:var(--muted);font-size:13px}
.tpl-hanthu .ht-guest{margin:6px 0;font-family:var(--font-script);font-size:40px;line-height:1.3;color:var(--accent)}
.tpl-hanthu .ht-sign{margin-top:32px}
.tpl-hanthu .ht-sign p{margin:0;font-family:var(--font-script);font-size:44px;line-height:1.25;color:var(--ink)}
.tpl-hanthu .ht-sign span{display:block;font-family:var(--font-script);font-size:30px;color:var(--gold)}
.tpl-hanthu .ht-msg{max-width:340px;margin:28px auto 0;font-style:italic;color:var(--muted);font-size:15px}

/* ---- ngày giờ + tờ lịch ---- */
.tpl-hanthu .ht-big{margin:14px 0 0;font-family:var(--font-title);font-size:30px;line-height:1.2;text-transform:uppercase;color:var(--ink)}
.tpl-hanthu .ht-big2{margin:4px 0 6px;font-family:var(--font-title);font-size:40px;line-height:1.1;letter-spacing:.04em;color:var(--accent)}
.tpl-hanthu .ht-lunar{margin:0;font-size:14px;font-style:italic;color:var(--muted)}
.tpl-hanthu .ht-note{position:relative;max-width:350px;margin:44px auto 0;padding:46px 18px 22px;background:#f6f5f1;border-radius:4px;box-shadow:0 2px 0 #fff inset,0 16px 28px -12px var(--ht-shadow),0 2px 6px rgba(0,0,0,.08);transform:rotate(-1deg)}
.tpl-hanthu .ht-holes{position:absolute;left:44px;right:14px;top:14px;display:flex;justify-content:space-between}
.tpl-hanthu .ht-holes i{width:11px;height:11px;border-radius:50%;background:#ddd8cf;box-shadow:inset 0 2px 3px rgba(0,0,0,.25)}
.tpl-hanthu .ht-clip{position:absolute;left:4px;top:-30px;width:30px;transform:rotate(18deg)}
.tpl-hanthu .ht-wm{position:absolute;left:0;right:0;top:52%;font-family:var(--font-title);font-weight:600;font-size:76px;letter-spacing:.06em;color:rgba(0,0,0,.05);pointer-events:none}
.tpl-hanthu .ht-calh{display:flex;align-items:baseline;gap:6px;margin:0 0 12px 10px;font-family:var(--font-title);color:var(--accent)}
.tpl-hanthu .ht-calh b{font-weight:400;font-size:32px}
.tpl-hanthu .ht-calh b:last-child{font-size:20px}
.tpl-hanthu .ht-calh i{font-style:normal;color:var(--muted)}
.tpl-hanthu .ht-note .cal{width:100%}
.tpl-hanthu .ht-note .cal-grid{font-family:var(--font-title);font-size:14px;color:var(--ink)}
.tpl-hanthu .ht-note .cal-w{color:var(--accent);opacity:.9!important}
.tpl-hanthu .s-cal,.tpl-hanthu .ht-note{--cal-hi:var(--accent)}
.tpl-hanthu .ht-addcal{display:inline-block;margin-top:12px;font-size:13px;font-weight:600;color:var(--accent);text-decoration:none;border-bottom:1px solid currentColor}

/* ---- địa điểm ---- */
.tpl-hanthu .ht-venues{display:grid;gap:34px;padding-top:24px}
.tpl-hanthu .ht-venue .k{margin:0 0 4px;font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.tpl-hanthu .ht-venue h3{margin:0;font-family:var(--font-title);font-weight:500;font-size:23px;line-height:1.3;color:var(--ink)}
.tpl-hanthu .ht-venue .a{margin:4px 0 0;font-size:15px;color:var(--muted)}
.tpl-hanthu .ht-map{margin:16px 0 0;aspect-ratio:4/3;border-radius:10px;overflow:hidden;box-shadow:0 10px 24px -12px var(--ht-shadow);background:var(--line)}
.tpl-hanthu .ht-map iframe{width:100%;height:100%;border:0}
.tpl-hanthu .ht-btn{display:inline-block;margin-top:14px;padding:8px 22px;border-radius:999px;background:var(--accent);color:var(--accent-ink);font-size:14px;text-decoration:none}
.tpl-hanthu .ht-tl{position:relative;padding:44px 14px 40px;text-align:center;background:var(--ht-soft);overflow:hidden}
.tpl-hanthu .ht-tl::before{content:"";position:absolute;inset:0;background:var(--ht-tlbg,none) center 30%/cover;opacity:.2;filter:grayscale(.3)}
.tpl-hanthu .ht-tl>*{position:relative}
.tpl-hanthu .ht-tlh{margin:0 0 30px;font-family:var(--font-title);font-weight:500;font-size:48px;letter-spacing:.04em;text-transform:uppercase;color:var(--accent)}
.tpl-hanthu .ht-tl ol{display:flex;justify-content:space-around;gap:6px;margin:0;padding:0;list-style:none;position:relative}
.tpl-hanthu .ht-tl ol::before{content:"";position:absolute;left:4%;right:4%;top:9px;height:2px;background:var(--accent)}
.tpl-hanthu .ht-tl li{position:relative;flex:1;display:flex;flex-direction:column;align-items:center;min-width:0}
.tpl-hanthu .ht-tl .dot{width:20px;height:20px;color:var(--accent);animation:htBeat 1.8s ease-in-out infinite}
.tpl-hanthu .ht-tl li:nth-child(2) .dot{animation-delay:.3s}.tpl-hanthu .ht-tl li:nth-child(3) .dot{animation-delay:.6s}
.tpl-hanthu .ht-tl b{margin-top:10px;font-family:var(--font-title);font-weight:500;font-size:18px;color:var(--ink)}
.tpl-hanthu .ht-tl li>span:last-child{font-size:13px;line-height:1.35;color:var(--ink)}
@keyframes htBeat{50%{transform:scale(1.18)}}

/* ---- cô dâu / chú rể ---- */
.tpl-hanthu .ht-couple{display:grid;gap:40px}
.tpl-hanthu .ht-pp{display:grid;grid-template-columns:52% 1fr;align-items:center;gap:18px}
.tpl-hanthu .ht-pp .ht-ph{aspect-ratio:3/4}
.tpl-hanthu .ht-pp.r{grid-template-columns:1fr 52%}
.tpl-hanthu .ht-pp.r .ht-ph{order:2}
.tpl-hanthu .ht-pp .t p{margin:0}
.tpl-hanthu .ht-pp .role{font-family:var(--font-title);font-size:22px;color:var(--accent)}
.tpl-hanthu .ht-pp .n{margin-top:4px!important;font-family:var(--font-title);font-weight:600;font-size:20px;line-height:1.3}
.tpl-hanthu .ht-pp .a{margin-top:6px!important;font-size:13px;color:var(--muted)}

/* ---- album ---- */
.tpl-hanthu .ht-album{padding-left:18px;padding-right:18px}
.tpl-hanthu .ht-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start}
.tpl-hanthu .ht-grid .ht-ph{aspect-ratio:3/4}
.tpl-hanthu .ht-grid .g0{grid-column:span 2;aspect-ratio:4/5}
.tpl-hanthu .ht-grid .g2{margin-top:42px}
.tpl-hanthu .ht-grid .g3{grid-column:span 2;width:78%;justify-self:center;aspect-ratio:1}
.tpl-hanthu .ht-grid .g4{grid-column:span 2;width:70%;justify-self:end;aspect-ratio:4/5}
.tpl-hanthu .ht-grid .g1:last-child{grid-column:span 2;width:70%;justify-self:start;aspect-ratio:4/5}

/* ---- xác nhận tham dự ---- */
.tpl-hanthu .s-rsvp .ht-h{font-size:28px}
.tpl-hanthu .ht-rsvp-lead{max-width:340px;margin:0 auto 24px;font-size:15px;color:var(--accent)}
.tpl-hanthu .form{background:var(--paper);border:0;border-radius:12px;box-shadow:0 18px 40px -16px var(--ht-shadow),0 2px 8px rgba(0,0,0,.05)}
.tpl-hanthu .form label{color:var(--ink)}
.tpl-hanthu .btn{border-radius:10px;font-family:var(--font-body)}

/* ---- hộp quà ---- */
.tpl-hanthu .ht-gift summary{list-style:none;display:flex;flex-direction:column;align-items:center;gap:10px;cursor:pointer}
.tpl-hanthu .ht-gift summary::-webkit-details-marker{display:none}
.tpl-hanthu .ht-box{padding:14px 34px;background:var(--accent);color:var(--accent-ink);font-family:var(--font-title);font-size:20px;box-shadow:0 10px 22px -10px var(--ht-shadow)}
.tpl-hanthu .ht-hint{font-size:13px;font-style:italic;color:var(--muted)}
.tpl-hanthu .ht-gift details[open] .ht-hint{display:none}
.tpl-hanthu .ht-gift .gifts{margin-top:24px}
.tpl-hanthu .gift{border:0;border-radius:12px;box-shadow:0 12px 30px -16px var(--ht-shadow)}
.tpl-hanthu .gift-who{font-family:var(--font-title)}

/* ---- lưu bút ---- */
.tpl-hanthu .s-wishes{background:var(--ht-soft)}
.tpl-hanthu .wish{border:0;box-shadow:0 4px 14px -8px var(--ht-shadow)}

/* ---- cảm ơn ---- */
.tpl-hanthu .ht-thanks{padding-top:30px;padding-bottom:40px}
.tpl-hanthu .ht-tph{width:72%;margin:0 auto 6px;aspect-ratio:4/5;border-radius:200px 200px 14px 14px;overflow:hidden;box-shadow:0 18px 40px -16px var(--ht-shadow)}
.tpl-hanthu .ht-tph img{width:100%;height:100%;object-fit:cover}
.tpl-hanthu .ht-t-fl{width:70px;margin:-40px auto 0;color:var(--gold);display:block;position:relative;animation:htSway 5s ease-in-out infinite;transform-origin:bottom}
.tpl-hanthu .ht-ty{margin:6px 0 8px;font-family:var(--font-script);font-size:58px;line-height:1.2;color:var(--accent)}
.tpl-hanthu .ht-thanks p{margin:0;color:var(--muted)}
.tpl-hanthu .ht-tn{margin-top:14px!important;font-family:var(--font-title);font-size:22px;color:var(--ink)!important}
@keyframes htSway{50%{transform:rotate(5deg)}}

@media (prefers-reduced-motion:reduce){
  .tpl-hanthu .ht-hero-img,.tpl-hanthu .ht-wgm,.tpl-hanthu .ht-names span,.tpl-hanthu .ht-env,.tpl-hanthu .ht-o-btn,.tpl-hanthu .ht-tl .dot,.tpl-hanthu .ht-t-fl{animation:none}
}
`,
};
