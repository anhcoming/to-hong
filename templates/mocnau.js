// Mẫu "Mộc Nâu" — tối giản ấm, giấy be, ảnh polaroid có băng dính & dấu sáp, hoa khô.
// Mỗi phần nội dung đặt trong một "tấm giấy" riêng; có khối tiệc cưới kèm lịch tháng, album băng chuyền, hộp quà bấm để mở.
// Hình vẽ (hoa khô, dấu sáp, hộp quà, lá) đều là SVG tự vẽ, tô theo biến màu.
const { esc } = require('../lib/util');
const orn = require('./_orn');

const base = {
  '--font-title': "'EB Garamond',Georgia,serif",
  '--font-script': "'Great Vibes',cursive",
  '--font-body': "'EB Garamond',Georgia,serif",
};
const pal = (id, name, accent, paper, page, ink, extra = {}) => ({
  id, name, swatch: [paper, accent],
  vars: {
    ...base, '--page': page, '--bg': page, '--paper': paper, '--sheet': '#fbf8f4',
    '--ink': ink, '--muted': `color-mix(in srgb,${ink} 62%,${paper})`, '--accent': accent, '--accent-ink': '#ffffff',
    '--gold': '#c7a36a', '--seal': '#cfb27a', '--sage': '#b9b096', '--twig': '#9a7a55', '--bud': '#c9a36b',
    '--line': `color-mix(in srgb,${accent} 22%,${paper})`, ...extra,
  },
});

const sf = orn.f;

// hoa khô (baby's breath): nhánh mảnh toả từ gốc, chùm nụ tròn ở ngọn, vài lá nhỏ
function dried(cls, seed = 1) {
  let r = seed * 9301 + 49297;
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  let g = '', buds = '';
  const stems = [[-48, 110], [-32, 140], [-16, 165], [0, 178], [16, 158], [32, 128], [-24, 92], [24, 96]];
  for (const [ang, len] of stems) {
    const a = orn.rad(ang - 90);
    const x1 = 60 + len * Math.cos(a), y1 = 200 + len * Math.sin(a);
    const cx = 60 + len * 0.5 * Math.cos(a) + (rnd() - 0.5) * 16, cy = 200 + len * 0.5 * Math.sin(a);
    g += `<path d="M60 200Q${sf(cx)} ${sf(cy)} ${sf(x1)} ${sf(y1)}" fill="none" stroke="var(--twig)" stroke-width="1.3"/>`;
    // ngọn toả 5 nhánh con, mỗi nhánh một chùm nụ dày
    for (let k = 0; k < 5; k++) {
      const ba = a + (rnd() - 0.5) * 1.6, bl = 10 + rnd() * 16;
      const bx = x1 + bl * Math.cos(ba), by = y1 + bl * Math.sin(ba);
      g += `<path d="M${sf(x1)} ${sf(y1)}L${sf(bx)} ${sf(by)}" stroke="var(--twig)" stroke-width=".8"/>`;
      for (let j = 0; j < 9; j++) {
        const px = bx + (rnd() - 0.5) * 13, py = by + (rnd() - 0.5) * 11;
        const c = rnd();
        buds += `<circle cx="${sf(px)}" cy="${sf(py)}" r="${sf(1.6 + rnd() * 1.9)}" fill="${c > 0.55 ? 'var(--bud)' : c > 0.25 ? '#e9d9bd' : 'var(--twig)'}"/>`;
      }
    }
  }
  g += buds;
  g += `<ellipse cx="44" cy="150" rx="2.5" ry="8" transform="rotate(-35 44 150)" fill="var(--sage)"/><ellipse cx="74" cy="140" rx="2.5" ry="8" transform="rotate(30 74 140)" fill="var(--sage)"/>`;
  return orn.svg(cls, '0 0 120 204', g);
}

// cành lá thon (nền mờ & góc thẻ)
const leafy = (cls) => orn.branch(cls, { leaf: 'var(--sage)', stem: 'var(--sage)', n: 7, len: 220, bend: 30, leafW: 5, leafH: 15 });

// dấu sáp: mép gợn, vòng trong, trái tim nổi
function seal(cls) {
  let edge = '';
  for (let i = 0; i < 28; i++) {
    const a = orn.rad(i * (360 / 28)), rr = i % 2 ? 46 : 49;
    edge += `${i ? 'L' : 'M'}${sf(50 + rr * Math.cos(a))} ${sf(50 + rr * Math.sin(a))}`;
  }
  return orn.svg(cls, '0 0 100 100', `
<defs><radialGradient id="mnSealG" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#f3e3bf"/><stop offset=".55" stop-color="var(--seal)"/><stop offset="1" stop-color="#9c7d48"/></radialGradient></defs>
<path d="${edge}Z" fill="url(#mnSealG)"/>
<circle cx="50" cy="50" r="33" fill="none" stroke="#a5864f" stroke-width="2" opacity=".55"/>
<circle cx="50" cy="50" r="31" fill="none" stroke="#f5e8c8" stroke-width="1" opacity=".7"/>
<path d="M50 66C38 57 31 50 31 42 31 36 36 31 42 31c3.5 0 6.5 2 8 5 1.5-3 4.5-5 8-5 6 0 11 5 11 11 0 8-7 15-19 24z" fill="none" stroke="#9c7d48" stroke-width="3" stroke-linejoin="round"/>
<path d="M50 64C39 56 33 50 33 42.5 33 37.5 37 33 42 33c3.3 0 6.3 2 8 5 1.7-3 4.7-5 8-5 5 0 9 4.5 9 9.5 0 7.5-6 13.5-17 21.5z" fill="none" stroke="#f6e9c9" stroke-width="1" opacity=".8"/>`);
}

// hộp quà: thân hộp kem vẽ lá, nắp, ruy băng vàng, nơ
const giftBox = (cls) => orn.svg(cls, '0 0 200 190', `
<rect x="38" y="78" width="124" height="102" rx="4" fill="#f4ebdc"/>
<rect x="38" y="78" width="124" height="102" rx="4" fill="none" stroke="#e2d4bd"/>
<g fill="none" stroke="#c8b48f" stroke-width="1">${[52, 132].map((x) => `<path d="M${x} 172C${x + 2} 150 ${x - 4} 120 ${x + 6} 96"/><path d="M${x + 1} 150c-6-4-8-10-6-14M${x + 2} 132c6-4 8-10 6-14M${x} 116c-6-3-7-8-5-12"/>`).join('')}</g>
<rect x="30" y="62" width="140" height="22" rx="3" fill="#f8f0e3" stroke="#e2d4bd"/>
<rect x="92" y="62" width="16" height="118" fill="var(--gold)" opacity=".9"/>
<rect x="30" y="68" width="140" height="10" fill="var(--gold)" opacity=".9"/>
<path d="M100 62C80 30 52 36 60 54C66 66 90 64 100 62ZM100 62C120 30 148 36 140 54C134 66 110 64 100 62Z" fill="#d9bf8e" stroke="#b8975e"/>
<path d="M100 62C92 74 86 92 80 104M100 62C108 74 114 92 120 104" stroke="#c9a96e" stroke-width="5" fill="none" stroke-linecap="round"/>
<circle cx="100" cy="62" r="7" fill="#c9a96e"/>`);

// hộp quà nhỏ bay quanh
const mini = (cls, body, ribbon) => orn.svg(cls, '0 0 40 40', `<rect x="6" y="14" width="28" height="22" rx="2" fill="${body}"/><rect x="4" y="10" width="32" height="7" rx="1.5" fill="${body}" stroke="rgba(0,0,0,.08)"/><rect x="18" y="10" width="4" height="26" fill="${ribbon}"/><path d="M20 10C14 2 8 6 12 9ZM20 10C26 2 32 6 28 9Z" fill="${ribbon}"/>`);

const heartIcon = '<svg viewBox="0 0 32 30" aria-hidden="true"><path d="M16 29C6 21 0 15 0 8.5 0 3.8 3.7 0 8.3 0c3 0 5.8 1.6 7.7 4.2C17.9 1.6 20.7 0 23.7 0 28.3 0 32 3.8 32 8.5 32 15 26 21 16 29z" fill="currentColor"/></svg>';
const leafFall = () => `<div class="mn-fall" aria-hidden="true">${'<i></i>'.repeat(12)}</div>`;

// 32 hạt bung ra từ trái tim khi mở thiệp: góc, quãng bay, cỡ, màu, độ trễ khác nhau
const BURST = (() => {
  let s = '';
  const colors = ['var(--accent)', 'var(--gold)', 'var(--bud)', '#fff', '#e9d9bd'];
  for (let i = 0; i < 32; i++) {
    const a = Math.round(i * (360 / 32) + ((i * 37) % 11) - 5);
    const r = 70 + ((i * 53) % 90);
    const z = 4 + ((i * 29) % 7);
    const heart = i % 4 === 0;
    s += `<i class="${heart ? 'h' : ''}" style="--a:${a}deg;--r:${r}px;--z:${z}px;--c:${colors[i % colors.length]};--dl:${(i % 5) * 18}ms"></i>`;
  }
  return `<span class="mn-burst" aria-hidden="true">${s}</span>`;
})();

// ngôi sao lấp lánh 4 cánh
const spark = (cls) => orn.svg(cls, '0 0 20 20', '<path d="M10 0C11 7 13 9 20 10C13 11 11 13 10 20C9 13 7 11 0 10C7 9 9 7 10 0Z" fill="var(--gold)"/>');

// ngày tách cột: THỨ BẢY | 03 | THÁNG 01, rồi năm và âm lịch
function dateSplit(h, iso) {
  const p = h.parts(iso);
  if (!p) return '';
  return `<div class="mn-ds"><span>${esc(h.weekday(iso))}</span><b>${p.d}</b><span>Tháng ${p.m}</span></div>
  <p class="mn-year">${p.y}</p>
  <p class="mn-lunar">(${esc(h.lunarText(iso).replace(/^Nhằm/, 'Tức'))})</p>`;
}
const hhmm = (t) => (t ? t.slice(0, 5) : '');
// chọn sự kiện theo thứ tự ưu tiên các mẫu tên
const pick = (evs, res, fallback) => {
  for (const re of [].concat(res)) { const e = evs.find((x) => re.test(x.name)); if (e) return e; }
  return fallback;
};

module.exports = {
  id: 'mocnau',
  name: 'Mộc Nâu',
  group: 'toigian',
  desc: 'Giấy be, ảnh polaroid dấu sáp, hoa khô — tối giản ấm áp; có lịch tháng trong khối tiệc, album băng chuyền, hộp quà bấm mở',
  fonts: 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Great+Vibes&display=swap',
  palettes: [
    pal('nau', 'Nâu khói', '#7a665c', '#ebe2d7', '#f6efeb', '#6a5850'),
    pal('do-ruou', 'Đỏ rượu', '#7c3a40', '#efe2dc', '#f8efec', '#6b4a4c', { '--bud': '#b9574f', '--twig': '#8a5a48' }),
    pal('reu', 'Xanh rêu', '#5f6a52', '#e6e5d8', '#f3f2ea', '#4f5646', { '--bud': '#c2a46b', '--sage': '#a9b08f' }),
  ],

  layout: ['invite', 'gallery', 'party', 'place', 'story', 'events', 'rsvp', 'wishes', 'gift', 'thanks'],

  title(text, sub) {
    return `<h2 class="sec-title mn-h">${esc(text)}</h2>${sub ? `<p class="mn-sub">${esc(sub)}</p>` : ''}`;
  },

  opener(ctx) {
    const p = ctx.dparts;
    return `
<div class="opener mn-opener" id="opener" data-open-ms="1350">
  ${leafFall()}
  <div class="mn-o">
    ${dried('mn-o-dry tl', 3)}${dried('mn-o-dry br', 7)}
    <div class="mn-o-heart"><span class="mn-ring" aria-hidden="true"></span>${heartIcon}${BURST}</div>
    <p class="mn-o-names">${esc(ctx.g)}<em>&amp;</em>${esc(ctx.b)}</p>
    <p class="mn-o-div" aria-hidden="true"><i></i>❦<i></i></p>
    ${p ? `<p class="mn-o-date">${+p.d} tháng ${+p.m}, ${p.y}</p>` : ''}
    <p class="mn-o-to">${ctx.guest ? `Thân mời <b>${esc(ctx.guest.name)}</b>` : 'Thân Mời'}</p>
    <button class="mn-o-btn" id="openBtn"><span>Mở thiệp</span></button>
  </div>
</div>`;
  },

  cover(ctx) {
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="mn-cover">
  ${leafy('mn-bgleaf')}
  <p class="mn-k">The wedding of</p>
  <h1 class="mn-names">${esc(ctx.g)} <em>&amp;</em> ${esc(ctx.b)}</h1>
  <div class="mn-pola">
    <i class="mn-tape"></i>
    <div class="mn-pola-ph"${photo ? ` style="background-image:url('${esc(photo)}')"` : ''}></div>
    ${seal('mn-seal')}
    ${dried('mn-pola-dry', 5)}
  </div>
</header>`;
  },

  sections: {
    // Thông tin lễ cưới: bố mẹ hai bên, tên đôi, lễ chính (giờ, ngày, âm lịch)
    invite(ctx, opts, h) {
      const d = ctx.d;
      const fam = (x, label) => `<div><p class="mn-ob">${label}</p>${x.father ? `<p class="mn-par">${esc(x.father)}</p>` : ''}${x.mother ? `<p class="mn-par">${esc(x.mother)}</p>` : ''}${x.address ? `<p class="mn-addr">${esc(x.address)}</p>` : ''}</div>`;
      const hasFam = d.groom.father || d.groom.mother || d.bride.father || d.bride.mother;
      const evs = d.events.filter((e) => e.name || e.place);
      const main = pick(evs, [/thành hôn|lễ cưới|hôn lễ/i, /vu quy/i], evs[0]);
      const when = main && main.date ? main : { date: ctx.date, time: ctx.time };
      return `
  <section class="sec mn-sec s-invite reveal">
    <div class="mn-card">
      ${leafy('mn-card-leaf')}
      <h2 class="mn-h">Thông tin lễ cưới</h2>
      ${hasFam ? `<div class="mn-fams">${fam(d.groom, 'Nhà trai')}<i></i>${fam(d.bride, 'Nhà gái')}</div>` : ''}
      <p class="mn-lead">${esc(d.inviteText || 'Trân trọng báo tin lễ thành hôn của con chúng tôi')}</p>
      <p class="mn-full">${esc(d.groom.fullName || d.groom.name)}</p>
      <p class="mn-role">Chú rể</p>
      <p class="mn-amp">&amp;</p>
      <p class="mn-full">${esc(d.bride.fullName || d.bride.name)}</p>
      <p class="mn-role">Cô dâu</p>
      ${ctx.guest ? `<p class="mn-guest">Trân trọng kính mời<b>${esc(ctx.guest.name)}</b></p>` : ''}
      ${when.date ? `
      <p class="mn-lead">${main ? `${esc(main.name)} được cử hành${main.place ? ` tại ${esc(main.place)}` : ''}` : 'Hôn lễ được cử hành'}</p>
      <p class="mn-lead sm">Vào lúc</p>
      ${when.time ? `<p class="mn-time">${hhmm(when.time)}</p>` : ''}
      ${dateSplit(h, when.date)}` : ''}
      ${d.message ? `<p class="mn-msg">${esc(d.message)}</p>` : ''}
    </div>
  </section>`;
    },

    // Album: băng chuyền ảnh xếp chồng, ảnh giữa to hơn, có số thứ tự
    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      return `
  <section class="sec mn-album s-gallery">
    <h2 class="mn-h">Album ảnh</h2>
    <div class="mn-flow" id="mnFlow">
      ${ph.map((u, i) => `<button class="ph${i ? '' : ' on'}" data-i="${i}" style="background-image:url('${esc(u)}')" aria-label="Xem ảnh ${i + 1}"></button>`).join('')}
    </div>
    <p class="mn-count"><span id="mnIdx">1</span> / ${ph.length}</p>
    <script>(function(){var f=document.getElementById('mnFlow'),n=document.getElementById('mnIdx'),t;if(!f)return;function u(){var c=f.scrollLeft+f.clientWidth/2,b=0,bd=1e9;[].forEach.call(f.children,function(e,i){var d=Math.abs(e.offsetLeft+e.offsetWidth/2-c);if(d<bd){bd=d;b=i}e.classList.remove('on')});f.children[b].classList.add('on');n.textContent=b+1}f.addEventListener('scroll',function(){cancelAnimationFrame(t);t=requestAnimationFrame(u)},{passive:true})})()</script>
  </section>`;
    },

    // Thông tin tiệc cưới: giờ, ngày, âm lịch, lịch tháng, thêm vào lịch, xác nhận tham dự
    party(ctx, opts, h) {
      const evs = ctx.d.events.filter((e) => e.name || e.place);
      const ev = pick(evs, /tiệc/i, evs[evs.length - 1]) || {};
      const date = ev.date || ctx.date;
      if (!date) return '';
      const p = h.parts(date);
      const title = `${ev.name || 'Tiệc cưới'} — Đám cưới ${ctx.g} & ${ctx.b}`;
      return `
  <section class="sec mn-sec s-cal reveal">
    <div class="mn-card">
      <h2 class="mn-h">Thông tin tiệc cưới</h2>
      <p class="mn-lead">${esc(ev.name || 'Tiệc cưới')} sẽ diễn ra vào lúc:</p>
      ${ev.time || ctx.time ? `<p class="mn-time">${hhmm(ev.time || ctx.time)}</p>` : ''}
      ${dateSplit(h, date)}
      ${ctx.d.show.calendar ? `<div class="mn-calbox">${h.calGrid(ctx, `<p class="mn-cal-h">Tháng ${+p.m} / ${p.y}</p>`)}</div>` : ''}
      <a class="mn-link" target="_blank" rel="noopener" href="${esc(h.calendarLink(title, date, ev.time || ctx.time, ev.address || ev.place))}">Thêm vào lịch</a>
      ${ctx.d.show.rsvp ? '<a class="mn-btn" href="#rsvp">Xác nhận tham dự</a>' : ''}
    </div>
  </section>`;
    },

    // Địa điểm tiệc: tên + địa chỉ + bản đồ + chỉ đường
    place(ctx, opts, h) {
      const evs = ctx.d.events.filter((e) => e.name || e.place);
      const ev = pick(evs, /tiệc/i, evs[evs.length - 1]);
      if (!ev || !(ev.address || ev.place)) return '';
      const q = ev.address || ev.place;
      return `
  <section class="sec mn-place reveal">
    <h2 class="mn-h">${esc(ev.name || 'Tiệc cưới')} sẽ tổ chức tại</h2>
    <p class="mn-addr-lg">${esc([ev.place, ev.address].filter(Boolean).join(', '))}</p>
    <div class="mn-map"><iframe loading="lazy" title="Bản đồ" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(q)}&amp;output=embed"></iframe></div>
    <a class="mn-dir" target="_blank" rel="noopener" href="${esc(ev.mapUrl || h.mapSearch(q))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l18-8-8 18-2-8-8-2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>Chỉ đường</a>
  </section>`;
    },

    // Hộp quà mừng: bấm hộp → tấm trượt từ dưới lên với mã QR hai bên
    gift(ctx, opts, h) {
      if (!ctx.d.show.gift) return '';
      const cards = h.giftCard(ctx, ctx.d.gifts.groom, 'groom') + h.giftCard(ctx, ctx.d.gifts.bride, 'bride');
      if (!cards) return '';
      return `
  <section class="sec mn-giftsec s-gift">
    <h2 class="mn-h">Hộp quà mừng</h2>
    <details class="mn-gift">
      <summary aria-label="Mở hộp quà mừng">
        ${mini('mn-mini a', '#f1ece2', '#2f4a3a')}${mini('mn-mini b', '#dfe8ef', '#a9bccc')}${mini('mn-mini c', '#24375a', '#1c2a44')}${mini('mn-mini d', '#f3d9d4', '#c98d84')}${mini('mn-mini e', '#e9e2d3', '#b44d3c')}${mini('mn-mini f', '#2f4a3a', '#c9a96e')}
        <i class="mn-shadow" aria-hidden="true"></i>
        ${giftBox('mn-box')}
        ${spark('mn-spark s1')}${spark('mn-spark s2')}${spark('mn-spark s3')}${spark('mn-spark s4')}
        <span class="mn-tap">Nhấn để mở</span>
      </summary>
      <div class="mn-dim" onclick="this.closest('details').open=false"></div>
      <div class="mn-sheet" role="dialog" aria-label="Hộp quà mừng">
        <div class="mn-sheet-h">Hộp quà mừng<button type="button" class="mn-x" aria-label="Đóng" onclick="this.closest('details').open=false">×</button></div>
        <div class="mn-sheet-b gifts">${cards}</div>
      </div>
    </details>
  </section>`;
    },

    thanks() {
      return '<section class="sec mn-thanks"><p>Sự hiện diện của quý khách là niềm vinh hạnh cho gia đình chúng tôi!</p></section>';
    },
  },

  css: `
.tpl-mocnau{--tex:repeating-radial-gradient(circle at 20% 30%,rgba(120,90,70,.025) 0 1px,transparent 1px 4px)}
.tpl-mocnau .card{background:var(--tex),var(--bg)}
.tpl-mocnau .sec{padding:28px 22px}
.tpl-mocnau .mn-h,.tpl-mocnau .sec-title{margin:0 0 18px;font-family:var(--font-title);font-weight:600;font-size:22px;letter-spacing:.04em;text-transform:uppercase;color:var(--ink)}
.tpl-mocnau .mn-sub{margin:-12px 0 18px;color:var(--muted);font-size:15px}

/* bìa */
.tpl-mocnau .mn-cover{position:relative;padding:44px 22px 28px;text-align:center;overflow:hidden;color:var(--ink)}
.tpl-mocnau .mn-bgleaf{position:absolute;left:-30px;top:30px;width:120px;opacity:.22;transform:rotate(-8deg);pointer-events:none}
.tpl-mocnau .mn-k{position:relative;margin:0;font-size:13px;font-weight:500;letter-spacing:.24em;text-transform:uppercase;color:var(--muted)}
.tpl-mocnau .mn-names{position:relative;margin:10px 0 0;font-weight:400;font-style:italic;font-size:33px;line-height:1.2;color:var(--ink)}
.tpl-mocnau .mn-names em{font-family:var(--font-script);font-style:normal;font-size:1.05em;padding:0 2px}
.tpl-mocnau .mn-pola{position:relative;width:76%;max-width:300px;margin:44px auto 40px;padding:12px 12px 52px;background:#fff;transform:rotate(-2deg);box-shadow:0 14px 30px rgba(90,60,40,.18)}
.tpl-mocnau .mn-pola-ph{aspect-ratio:4/5.1;background:var(--line) center/cover no-repeat}
.tpl-mocnau .mn-tape{position:absolute;top:-16px;left:50%;z-index:2;width:84px;height:30px;transform:translateX(-50%) rotate(-3deg);background:linear-gradient(90deg,rgba(214,196,160,.85),rgba(232,216,186,.92),rgba(214,196,160,.85));box-shadow:0 1px 2px rgba(0,0,0,.08)}
.tpl-mocnau .mn-seal{position:absolute;right:-20px;bottom:24px;width:66px;filter:drop-shadow(0 3px 4px rgba(70,50,20,.3));transform:rotate(8deg)}
.tpl-mocnau .mn-pola-dry{position:absolute;left:-40px;bottom:-46px;width:110px;transform:rotate(18deg)}

/* thẻ giấy */
.tpl-mocnau .mn-sec{padding:14px 22px}
.tpl-mocnau .mn-card{position:relative;padding:34px 18px 34px;border-radius:10px;color:var(--ink);background:var(--tex),linear-gradient(170deg,color-mix(in srgb,var(--paper) 80%,#fff),var(--paper));box-shadow:0 10px 26px rgba(90,60,40,.12)}
.tpl-mocnau .mn-card-leaf{position:absolute;left:-46px;top:40%;width:110px;opacity:.85;transform:rotate(-12deg);pointer-events:none}
.tpl-mocnau .mn-fams{display:grid;grid-template-columns:1fr 1px 1fr;gap:12px;margin:0 0 22px;font-size:14px}
.tpl-mocnau .mn-fams>i{background:color-mix(in srgb,var(--ink) 30%,transparent)}
.tpl-mocnau .mn-fams p{margin:0}
.tpl-mocnau .mn-ob{font-size:14px;color:var(--muted);margin-bottom:2px!important}
.tpl-mocnau .mn-par{font-weight:600;line-height:1.5}
.tpl-mocnau .mn-addr{margin-top:4px!important;font-size:12px;color:var(--muted)}
.tpl-mocnau .mn-lead{margin:0 auto 4px;max-width:300px;font-size:17px;line-height:1.45;text-transform:uppercase;color:var(--ink)}
.tpl-mocnau .mn-lead.sm{margin-top:10px}
.tpl-mocnau .mn-full{margin:26px 0 0;font-size:32px;line-height:1.15;color:var(--ink)}
.tpl-mocnau .mn-role{margin:10px 0 0;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
.tpl-mocnau .mn-amp{margin:18px 0 -8px;font-family:var(--font-script);font-size:40px;line-height:1;color:var(--muted)}
.tpl-mocnau .mn-guest{margin:26px 0 0;font-size:14px;color:var(--muted)}
.tpl-mocnau .mn-guest b{display:block;margin-top:4px;font-style:italic;font-weight:500;font-size:24px;line-height:1.3;color:var(--ink)}
.tpl-mocnau .mn-card .mn-lead:not(:first-of-type){margin-top:30px}
.tpl-mocnau .mn-time{margin:14px 0 0;font-size:20px;color:var(--ink)}
.tpl-mocnau .mn-ds{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:16px;margin:16px auto 0;max-width:290px}
.tpl-mocnau .mn-ds span{font-size:13px;text-transform:uppercase;color:var(--ink)}
.tpl-mocnau .mn-ds span:first-child{text-align:right}.tpl-mocnau .mn-ds span:last-child{text-align:left}
.tpl-mocnau .mn-ds b{padding:0 18px;font-size:30px;font-weight:400;border-left:1px solid color-mix(in srgb,var(--ink) 40%,transparent);border-right:1px solid color-mix(in srgb,var(--ink) 40%,transparent)}
.tpl-mocnau .mn-year{margin:12px 0 0;font-size:19px}
.tpl-mocnau .mn-lunar{margin:8px auto 0;max-width:260px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
.tpl-mocnau .mn-msg{margin:24px auto 0;max-width:300px;font-style:italic;color:var(--muted)}

/* album băng chuyền */
.tpl-mocnau .mn-album{padding:30px 0 18px}
.tpl-mocnau .mn-flow{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;padding:10px calc(50% - 84px);scrollbar-width:none}
.tpl-mocnau .mn-flow::-webkit-scrollbar{display:none}
.tpl-mocnau .mn-flow .ph{flex:0 0 220px;aspect-ratio:3/4.1;margin:0 -26px;border-radius:12px;scroll-snap-align:center;transform:scale(.8);opacity:.85;box-shadow:0 10px 24px rgba(60,40,30,.22);transition:transform .35s,opacity .35s}
.tpl-mocnau .mn-flow .ph.on{position:relative;z-index:2;transform:scale(1);opacity:1}
.tpl-mocnau .mn-count{margin:14px 0 0;font-family:'Hanken Grotesk',system-ui,sans-serif;font-size:13px;color:var(--muted)}

/* khối tiệc + lịch tháng */
.tpl-mocnau .mn-calbox{margin:26px 4px 0;padding:18px 14px 16px;border-radius:10px;background:var(--accent);color:#fff;--cal-hi:#f4ece4;--cal-on:var(--accent)}
.tpl-mocnau .mn-cal-h{margin:0 0 12px;padding-bottom:12px;font-family:var(--font-script);font-size:28px;line-height:1;border-bottom:1px solid rgba(255,255,255,.25)}
.tpl-mocnau .mn-calbox .cal-grid{font-size:14px}
.tpl-mocnau .mn-calbox .cal-w{opacity:.75;font-family:'Hanken Grotesk',system-ui,sans-serif;font-weight:500}
.tpl-mocnau .mn-calbox .cal-grid .cal-w:last-of-type{color:#fff}
.tpl-mocnau .mn-link{display:inline-block;margin-top:26px;font-size:16px;color:var(--ink);text-underline-offset:4px}
.tpl-mocnau .mn-btn,.tpl-mocnau .btn{display:flex;width:fit-content;margin:22px auto 0;padding:12px 26px;border:0;border-radius:999px;background:var(--accent);color:var(--accent-ink);font-family:var(--font-title);font-size:16px;font-weight:500;letter-spacing:.02em;text-transform:uppercase;text-decoration:none;box-shadow:0 4px 10px rgba(80,60,50,.18)}
.tpl-mocnau .btn.block{width:auto}

/* địa điểm */
.tpl-mocnau .mn-place{padding-top:34px}
.tpl-mocnau .mn-place .mn-h{margin-bottom:10px}
.tpl-mocnau .mn-addr-lg{margin:0 auto 18px;max-width:300px;font-size:14px;color:var(--muted)}
.tpl-mocnau .mn-map{border-radius:6px;overflow:hidden;aspect-ratio:16/12.5;background:var(--line);box-shadow:0 6px 16px rgba(60,40,30,.12)}
.tpl-mocnau .mn-map iframe{width:100%;height:100%;border:0}
.tpl-mocnau .mn-dir{display:inline-flex;align-items:center;gap:8px;margin-top:16px;font-weight:600;font-size:16px;color:var(--ink);text-decoration:none}
.tpl-mocnau .mn-dir svg{width:18px;height:18px}

/* lịch trình (khối chung) đặt trong thẻ */
.tpl-mocnau .s-events,.tpl-mocnau .s-rsvp,.tpl-mocnau .s-wishes .form,.tpl-mocnau .s-story{margin:14px 22px;padding:34px 18px;border-radius:10px;background:var(--tex),linear-gradient(170deg,color-mix(in srgb,var(--paper) 80%,#fff),var(--paper));box-shadow:0 10px 26px rgba(90,60,40,.12)}
.tpl-mocnau .tl-when b{color:var(--ink);font-weight:400}
.tpl-mocnau .tl-item::after{background:var(--accent);border-color:var(--accent)}
.tpl-mocnau .tl-body h3{font-size:18px}
.tpl-mocnau .tl-act a,.tpl-mocnau .tl-map summary{color:var(--accent)}

/* sổ lưu bút + xác nhận tham dự */
.tpl-mocnau .s-wishes{padding-top:20px}
.tpl-mocnau .s-wishes .form{margin:0 0 22px;background:var(--sheet)}
.tpl-mocnau .form input,.tpl-mocnau .form textarea,.tpl-mocnau .form select{border:1px solid color-mix(in srgb,var(--accent) 70%,transparent);border-radius:8px;background:transparent;font-family:var(--font-body);font-size:16px}
.tpl-mocnau .form label{font-family:var(--font-body)}
.tpl-mocnau .wish{background:#fffdfb;border:1px solid var(--line);border-radius:8px;text-align:left}
.tpl-mocnau .guest-name{font-family:var(--font-script);color:var(--ink)}

/* hộp quà */
.tpl-mocnau .mn-giftsec{padding:40px 22px 20px}
.tpl-mocnau .mn-gift summary{position:relative;display:block;width:260px;height:250px;margin:10px auto 0;cursor:pointer;list-style:none}
.tpl-mocnau .mn-gift summary::-webkit-details-marker{display:none}
.tpl-mocnau .mn-box{position:absolute;left:30px;top:40px;width:200px;animation:mnBob 3s ease-in-out infinite}
.tpl-mocnau .mn-tap{position:absolute;left:0;right:0;bottom:0;font-size:14px;color:var(--muted)}
.tpl-mocnau .mn-mini{position:absolute;width:34px;animation:mnBob 3.6s ease-in-out infinite}
.tpl-mocnau .mn-mini.a{left:4px;top:20px;transform:rotate(-12deg)}.tpl-mocnau .mn-mini.b{right:6px;top:6px;animation-delay:-1s}
.tpl-mocnau .mn-mini.c{left:-6px;top:120px;width:28px;animation-delay:-2s}.tpl-mocnau .mn-mini.d{left:10px;top:176px;width:40px;animation-delay:-.5s}
.tpl-mocnau .mn-mini.e{right:-4px;top:120px;width:26px;animation-delay:-1.5s}.tpl-mocnau .mn-mini.f{left:44px;top:186px;width:28px;animation-delay:-2.5s}
@keyframes mnBob{50%{translate:0 -6px}}
/* bóng dưới hộp: co lại & nhạt đi khi hộp nhún lên (cùng nhịp 3s) */
.tpl-mocnau .mn-shadow{position:absolute;left:60px;top:220px;width:140px;height:12px;border-radius:50%;background:radial-gradient(closest-side,rgba(60,40,25,.22),transparent);animation:mnShadow 3s ease-in-out infinite}
@keyframes mnShadow{50%{scale:.82 .8;opacity:.6}}
/* lấp lánh quanh hộp, lệch pha nhau */
.tpl-mocnau .mn-spark{position:absolute;width:14px;opacity:0;animation:mnTwinkle 2.4s ease-in-out infinite}
.tpl-mocnau .mn-spark.s1{left:38px;top:70px}
.tpl-mocnau .mn-spark.s2{right:44px;top:58px;width:11px;animation-delay:-.6s}
.tpl-mocnau .mn-spark.s3{right:30px;top:168px;width:16px;animation-delay:-1.2s}
.tpl-mocnau .mn-spark.s4{left:64px;top:190px;width:10px;animation-delay:-1.8s}
@keyframes mnTwinkle{0%,100%{opacity:0;scale:.4;rotate:0deg}50%{opacity:1;scale:1;rotate:45deg}}
.tpl-mocnau .mn-tap{animation:mnHint 2s ease-in-out infinite}
@keyframes mnHint{50%{opacity:.45}}
@media (prefers-reduced-motion:reduce){.tpl-mocnau .mn-box,.tpl-mocnau .mn-mini,.tpl-mocnau .mn-shadow,.tpl-mocnau .mn-tap{animation:none}.tpl-mocnau .mn-spark{animation:none;opacity:.8}}

/* nút nhạc: 4 cột sóng nhảy + viền đĩa xoay khi đang phát (chỉ có khi thiệp có nhạc) */
.tpl-mocnau .music-btn{display:grid;place-items:center;border:0;background:var(--accent);color:#fff;box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 35%,transparent),0 6px 16px rgba(60,40,30,.3)}
.tpl-mocnau .music-btn>span{display:none}
.tpl-mocnau .music-btn::before{content:"";position:absolute;inset:4px;border-radius:50%;border:1.5px dashed rgba(255,255,255,.45)}
.tpl-mocnau .music-btn.playing::before{animation:spin 6s linear infinite}
.tpl-mocnau .mb-bars{display:flex;align-items:flex-end;gap:3px;height:16px}
.tpl-mocnau .mb-bars i{width:3px;height:6px;border-radius:2px;background:#fff;transition:height .3s}
.tpl-mocnau .mb-bars i:nth-child(2){height:12px}.tpl-mocnau .mb-bars i:nth-child(3){height:9px}.tpl-mocnau .mb-bars i:nth-child(4){height:5px}
.tpl-mocnau .music-btn.playing .mb-bars i{animation:mnEq .9s ease-in-out infinite alternate}
.tpl-mocnau .music-btn.playing .mb-bars i:nth-child(2){animation-delay:-.3s}.tpl-mocnau .music-btn.playing .mb-bars i:nth-child(3){animation-delay:-.6s}.tpl-mocnau .music-btn.playing .mb-bars i:nth-child(4){animation-delay:-.15s}
@keyframes mnEq{from{height:4px}to{height:16px}}
@media (prefers-reduced-motion:reduce){.tpl-mocnau .music-btn.playing::before,.tpl-mocnau .music-btn.playing .mb-bars i{animation:none}}

/* mẫu này không làm mờ dần khi cuộn — các khối hiện sẵn */
.tpl-mocnau .reveal{opacity:1;transform:none;transition:none}
.tpl-mocnau .mn-gift[open] summary{opacity:.35}
.tpl-mocnau .mn-dim{position:fixed;inset:0;z-index:59;background:rgba(40,28,22,.35);animation:mnFade .3s}
@keyframes mnFade{from{opacity:0}}
.tpl-mocnau .mn-sheet{position:fixed;left:50%;bottom:0;z-index:60;width:min(480px,100%);max-height:86vh;overflow:auto;transform:translateX(-50%);border-radius:18px 18px 0 0;background:#fff9f6;box-shadow:0 -12px 40px rgba(0,0,0,.25);animation:mnUp .35s ease-out}
@keyframes mnUp{from{transform:translate(-50%,100%)}}
.tpl-mocnau .mn-sheet-h{position:sticky;top:0;padding:22px 50px 18px;background:var(--accent);color:#fff;font-weight:600;font-size:22px;letter-spacing:.04em;text-transform:uppercase}
.tpl-mocnau .mn-x{position:absolute;right:14px;top:14px;width:36px;height:36px;border:0;background:none;color:#fff;font-size:30px;line-height:1}
.tpl-mocnau .mn-sheet-b{display:grid;gap:10px;padding:18px 22px 30px}
.tpl-mocnau .gift{background:transparent;border:0;box-shadow:none}
.tpl-mocnau .gift img{border-radius:12px;background:#fff;padding:8px;box-shadow:0 4px 14px rgba(0,0,0,.1)}
.tpl-mocnau .gift-who{font-family:'Hanken Grotesk',system-ui,sans-serif;font-size:14px;letter-spacing:.04em;color:var(--muted)}

.tpl-mocnau .mn-thanks{padding:20px 26px 30px}
.tpl-mocnau .mn-thanks p{margin:0;font-size:15px;color:var(--ink)}
.tpl-mocnau .credit{background:transparent}

/* màn mở thiệp */
.mn-opener{overflow:hidden;background:linear-gradient(180deg,#f3e6dc,#e6d2c3 60%,#dcc3b2)}
.mn-fall i{position:absolute;top:-20px;width:14px;height:9px;border-radius:0 100% 0 100%;background:color-mix(in srgb,var(--twig) 55%,#d8c3ad);opacity:.7;animation:mnFall 12s linear infinite}
.mn-fall i:nth-child(1){left:12%}.mn-fall i:nth-child(2){left:30%;animation-delay:-4s;animation-duration:14s}.mn-fall i:nth-child(3){left:46%;animation-delay:-8s}
.mn-fall i:nth-child(4){left:64%;animation-delay:-2s;animation-duration:15s}.mn-fall i:nth-child(5){left:80%;animation-delay:-6s}.mn-fall i:nth-child(6){left:90%;animation-delay:-10s;animation-duration:13s}.mn-fall i:nth-child(7){left:22%;animation-delay:-11s}
.mn-fall i:nth-child(8){left:4%;animation-delay:-3s;animation-duration:16s;width:10px;height:7px}.mn-fall i:nth-child(9){left:38%;animation-delay:-9.5s;animation-duration:13s}.mn-fall i:nth-child(10){left:56%;animation-delay:-5s;width:11px;height:7px}
.mn-fall i:nth-child(11){left:72%;animation-delay:-12.5s;animation-duration:17s}.mn-fall i:nth-child(12){left:96%;animation-delay:-7s;width:10px;height:6px}
@keyframes mnFall{0%{transform:translate(0,0) rotate(0)}50%{transform:translate(24px,55vh) rotate(160deg)}100%{transform:translate(-8px,110vh) rotate(320deg)}}
@media (prefers-reduced-motion:reduce){.mn-fall{display:none}}
.mn-opener .mn-o{position:relative;width:min(310px,82vw);padding:22px 24px 54px;text-align:center;color:var(--ink);background:linear-gradient(170deg,#fffdfa,#fbf5ef);border-radius:8px;box-shadow:0 24px 50px rgba(90,60,40,.25);font-family:var(--font-title)}
.mn-opener .mn-o-dry{position:absolute;width:72px}
.mn-opener .mn-o-to b{display:block;font-size:20px}
.mn-opener .mn-o-dry.tl{left:-6px;top:-6px;transform:rotate(150deg) scaleX(-1)}
.mn-opener .mn-o-dry.br{right:-8px;bottom:-4px;transform:rotate(-14deg)}
.mn-opener .mn-o-heart{position:relative;display:grid;place-items:center;width:56px;height:56px;margin:0 auto;border-radius:50%;color:#fff;background:radial-gradient(circle at 35% 30%,color-mix(in srgb,var(--accent) 70%,#fff),var(--accent));box-shadow:0 6px 14px rgba(70,50,40,.35);animation:mnBeat 1.8s ease-in-out infinite}
.mn-opener .mn-o-heart svg{width:24px}
@keyframes mnBeat{0%,100%{scale:1}15%{scale:1.08}30%{scale:1}45%{scale:1.05}}
/* vòng sáng lan ra từ trái tim */
.mn-opener .mn-ring{position:absolute;inset:0;border-radius:50%;border:2px solid color-mix(in srgb,var(--accent) 55%,transparent);animation:mnRing 1.8s ease-out infinite;pointer-events:none}
@keyframes mnRing{0%{scale:1;opacity:.8}100%{scale:1.9;opacity:0}}
/* vệt sáng xiên chạy ngang nút */
.mn-opener .mn-o-btn{position:relative;overflow:hidden}
.mn-opener .mn-o-btn span{position:relative;z-index:1}
.mn-opener .mn-o-btn::after{content:"";position:absolute;top:0;bottom:0;left:-40%;width:28%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent);transform:skewX(-20deg);animation:mnShine 2.6s ease-in-out infinite}
@keyframes mnShine{0%,55%{left:-40%}100%{left:130%}}

/* ----- chuỗi hiệu ứng khi bấm "Mở thiệp" (card.js gắn .opening, đợi 1350ms) ----- */
.mn-burst{position:absolute;left:50%;top:50%;width:0;height:0;pointer-events:none}
.mn-burst i{position:absolute;left:calc(var(--z) / -2);top:calc(var(--z) / -2);width:var(--z);height:var(--z);border-radius:50%;background:var(--c);opacity:0}
.mn-burst i.h{width:calc(var(--z) * 1.6);height:calc(var(--z) * 1.5);border-radius:0;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 30'%3E%3Cpath d='M16 29C6 21 0 15 0 8.5 0 3.8 3.7 0 8.3 0c3 0 5.8 1.6 7.7 4.2C17.9 1.6 20.7 0 23.7 0 28.3 0 32 3.8 32 8.5 32 15 26 21 16 29z'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 30'%3E%3Cpath d='M16 29C6 21 0 15 0 8.5 0 3.8 3.7 0 8.3 0c3 0 5.8 1.6 7.7 4.2C17.9 1.6 20.7 0 23.7 0 28.3 0 32 3.8 32 8.5 32 15 26 21 16 29z'/%3E%3C/svg%3E") center/contain no-repeat}
.mn-opener.opening .mn-burst i{animation:mnBurst .9s cubic-bezier(.15,.7,.3,1) var(--dl) both}
@keyframes mnBurst{0%{opacity:1;transform:rotate(var(--a)) translateY(0) scale(.4)}60%{opacity:1}100%{opacity:0;transform:rotate(var(--a)) translateY(calc(var(--r) * -1)) scale(1)}}
/* trái tim "vỡ": phóng to rồi mờ; vòng sáng lan rộng gấp 4 */
.mn-opener.opening .mn-o-heart{animation:mnBreak .5s ease-out forwards}
.mn-opener.opening .mn-o-heart svg{animation:mnBreakIcon .45s ease-in forwards}
@keyframes mnBreak{0%{scale:1}35%{scale:1.25}100%{scale:1.1;background:transparent;box-shadow:none}}
@keyframes mnBreakIcon{40%{scale:1.4;opacity:1}100%{scale:2;opacity:0}}
.mn-opener.opening .mn-ring{animation:mnRingOut .8s ease-out forwards}
@keyframes mnRingOut{0%{scale:1;opacity:1;border-width:3px}100%{scale:4;opacity:0;border-width:1px}}
/* hai cành hoa khô bay chéo ra ngoài */
.mn-opener.opening .mn-o-dry.tl{animation:mnFlyTL .9s ease-in forwards}
.mn-opener.opening .mn-o-dry.br{animation:mnFlyBR .9s ease-in forwards}
@keyframes mnFlyTL{to{translate:-140px -260px;rotate:-40deg;opacity:0}}
@keyframes mnFlyBR{to{translate:150px -220px;rotate:50deg;opacity:0}}
/* cả tấm thiệp bay lên */
.mn-opener.opening .mn-o{animation:mnAway .75s cubic-bezier(.5,0,.75,0) .55s forwards}
@keyframes mnAway{to{translate:0 -110vh;rotate:-6deg;opacity:.6}}
@media (prefers-reduced-motion:reduce){.mn-opener .mn-o-heart,.mn-opener .mn-ring,.mn-opener .mn-o-btn::after{animation:none}.mn-opener .mn-ring{display:none}}
.mn-opener .mn-o-names{margin:28px 0 0;font-size:31px;line-height:1.05}
.mn-opener .mn-o-names em{display:block;font-style:normal;font-size:20px;line-height:1}
.mn-opener .mn-o-div{display:flex;align-items:center;justify-content:center;gap:10px;margin:12px 0 0;color:var(--muted);font-size:12px}
.mn-opener .mn-o-div i{width:46px;height:1px;background:color-mix(in srgb,var(--ink) 35%,transparent)}
.mn-opener .mn-o-date{margin:16px 0 0;font-size:19px;color:var(--muted)}
.mn-opener .mn-o-to{margin:22px 0 0;font-size:19px;color:var(--muted)}
.mn-opener .mn-o-to b{font-weight:500;color:var(--ink)}
.mn-opener .mn-o-btn{margin-top:22px;padding:12px 32px;border:0;border-radius:999px;color:#fff;font-family:var(--font-title);font-size:19px;font-weight:600;background:linear-gradient(100deg,var(--accent) 60%,color-mix(in srgb,var(--accent) 55%,#fff));box-shadow:0 8px 16px rgba(70,50,40,.25)}
`,
};
