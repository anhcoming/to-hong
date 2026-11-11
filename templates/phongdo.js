// Mẫu "Phong Đỏ" — Á Đông hiện đại: nền kem hồng, phong bì đỏ nằm ngang có dấu sáp chữ 囍 (vẽ bằng SVG).
// Màn mở: nắp phong bì lật lên, lá thư trượt ra. Bìa: phong bì đã mở, ảnh cưới nhô lên như lá thư.
const { esc } = require('../lib/util');

const P = (n) => `/demo/songhy-${n}.jpg`;
const base = {
  '--font-title': "'Prata',Georgia,serif",
  '--font-script': "'Great Vibes',cursive",
  '--font-body': "'Quicksand',system-ui,sans-serif",
};

const evList = (d) => d.events.filter((e) => e.name || e.place);
function partyEvent(d) {
  const evs = evList(d);
  return evs.find((e) => /khai tiệc|tiệc cưới/i.test(e.name)) || evs.find((e) => /tiệc/i.test(e.name)) || evs[evs.length - 1] || null;
}
const lunarOf = (ctx) => ctx.lunar.replace(/^Nhằm /i, 'Tức ');

// chữ 囍 dựng bằng nét (hai chữ 喜 đứng cạnh nhau, nét ngang trên & giữa nối liền)
const HY = '<path d="M6 8H94M25 2V20M12 20H38M12 26h26v13H12zM17 44l3 5M35 44l-3 5M4 53H96M12 59h26v18H12zM75 2V20M62 20H88M62 26h26v13H62zM67 44l3 5M85 44l-3 5M62 59h26v18H62z" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="square"/>';
const hy = (cls) => `<svg class="${cls}" viewBox="0 0 100 80" aria-hidden="true">${HY}</svg>`;

// huy hiệu tròn viền hạt, giữa là chữ 囍
function medal(cls) {
  let dots = '';
  for (let i = 0; i < 20; i++) {
    const a = (i * Math.PI) / 10;
    dots += `<circle cx="${(60 + 52 * Math.cos(a)).toFixed(1)}" cy="${(60 + 52 * Math.sin(a)).toFixed(1)}" r="7"/>`;
  }
  return `<svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true"><g fill="var(--pd-blush)">${dots}</g><circle cx="60" cy="60" r="51" fill="var(--paper)" stroke="var(--accent)" stroke-width="2.5"/><circle cx="60" cy="60" r="43" fill="none" stroke="var(--accent)" stroke-width="1.2" stroke-dasharray="2 3"/><g transform="translate(29 36) scale(.62)" style="color:var(--accent)">${HY}</g></svg>`;
}

// dấu sáp: mép gợn sóng, đổ bóng tròn, chữ 囍 dập nổi
const SEAL_D = (() => {
  let d = '';
  for (let i = 0; i <= 72; i++) {
    const t = (i / 72) * 2 * Math.PI;
    const r = 46 + 2.6 * Math.sin(t * 7) + 1.6 * Math.sin(t * 13 + 1);
    d += (i ? 'L' : 'M') + (50 + r * Math.cos(t)).toFixed(1) + ' ' + (50 + r * Math.sin(t)).toFixed(1);
  }
  return d + 'Z';
})();
const seal = (cls) => `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="pdSealG" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="var(--pd-seal-hi)"/><stop offset=".55" stop-color="var(--pd-seal)"/><stop offset="1" stop-color="var(--pd-seal-dk)"/></radialGradient></defs><path d="${SEAL_D}" fill="url(#pdSealG)"/><circle cx="50" cy="50" r="32" fill="none" stroke="var(--pd-seal-dk)" stroke-width="3" opacity=".5"/><circle cx="50" cy="51" r="31" fill="none" stroke="var(--pd-seal-hi)" stroke-width="1" opacity=".7"/><g transform="translate(30 38) scale(.4)" style="color:var(--pd-seal-dk)" opacity=".85">${HY}</g></svg>`;

// mặt trước phong bì (hai cánh bên + cánh dưới) và nắp tam giác chấm bi
const ENV_FRONT = '<svg class="pd-ef" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0L150 106 0 200Z" fill="var(--pd-env)"/><path d="M300 0L150 106 300 200Z" fill="var(--pd-env)"/><path d="M300 0L150 106 300 200Z" fill="rgba(0,0,0,.05)"/><path d="M0 200L150 98 300 200Z" fill="var(--pd-env-lt)"/><path d="M0 200L150 98 300 200" fill="none" stroke="rgba(0,0,0,.1)"/></svg>';
const dots = '<defs><pattern id="pdDots" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r=".9" fill="rgba(0,0,0,.2)"/></pattern></defs>';
const ENV_FLAP = `<svg class="pd-ff" viewBox="0 0 300 124" preserveAspectRatio="none" aria-hidden="true">${dots}<path d="M0 0H300L150 120Z" fill="var(--pd-env-dk)"/><path d="M0 0H300L150 120Z" fill="url(#pdDots)"/></svg>`;
const ENV_FLAP_UP = `<svg class="pd-ff" viewBox="0 0 300 124" preserveAspectRatio="none" aria-hidden="true">${dots}<path d="M0 124H300L150 4Z" fill="var(--pd-env-in)"/><path d="M0 124H300L150 4Z" fill="url(#pdDots)" opacity=".6"/></svg>`;

// ảnh album (nút mở lightbox); dùng vòng lại nếu ít ảnh
function ph(ctx, i, cls = '') {
  const list = ctx.d.photos;
  if (!list.length) return '';
  const k = i % list.length;
  return `<button class="ph ${cls}" data-i="${k}" style="background-image:url('${esc(list[k])}')" aria-label="Xem ảnh ${k + 1}"></button>`;
}

const ICONS = {
  car: '<path d="M4 30h40M8 30v-6l5-8h16l8 8h5v6M12 30a4 4 0 108 0M30 30a4 4 0 108 0M15 16v8h20"/>',
  rings: '<circle cx="19" cy="26" r="9"/><circle cx="30" cy="26" r="9"/><path d="M16 14l3-5 3 5"/>',
  cheers: '<path d="M12 8h10l-1 10a4 4 0 01-8 0zM17 22v12M13 34h8M28 8h10l-2 10a4 4 0 01-8 0zM33 22v12M29 34h8M21 4l4-3M25 6l4 0"/>',
  heart: '<path d="M24 36S10 27 10 18a7 7 0 0114-3 7 7 0 0114 3c0 9-14 18-14 18z"/>',
};
const iconFor = (name) => (/vu quy|rước|đón dâu/i.test(name) ? 'car' : /tiệc|khai/i.test(name) ? 'cheers' : /thành hôn|lễ|cưới/i.test(name) ? 'rings' : 'heart');
const HEART = '<svg viewBox="0 0 24 22" aria-hidden="true"><path d="M12 21S1 14 1 7a5.5 5.5 0 0111-2 5.5 5.5 0 0111 2c0 7-11 14-11 14z" fill="currentColor"/></svg>';
const SPARK = '<svg class="pd-spark" viewBox="0 0 30 30" aria-hidden="true"><path d="M10 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2zM23 14l1 4 4 1-4 1-1 4-1-4-4-1 4-1z" fill="var(--pd-blush)"/></svg>';
const dotH = (txt, cls = '') => `<h2 class="pd-dh ${cls}"><span class="pd-dot"></span>${SPARK}<em>${esc(txt)}</em></h2>`;

module.exports = {
  id: 'phongdo',
  name: 'Phong Đỏ',
  group: 'truyenthong',
  badge: 'Mới',
  desc: 'Á Đông hiện đại: phong bì đỏ dấu sáp chữ Hỷ, nắp lật mở lá thư trên nền kem hồng',
  fonts: 'https://fonts.googleapis.com/css2?family=Prata&family=Great+Vibes&family=Quicksand:wght@400;500;600;700&display=swap',
  palettes: [
    { id: 'do-son', name: 'Đỏ son', swatch: ['#f7ecea', '#a8383a'], vars: { ...base, '--page': '#efe3e1', '--bg': '#f9f0ee', '--paper': '#fffaf8', '--ink': '#4a2626', '--muted': '#8a6a67', '--accent': '#9c3134', '--accent-ink': '#fff6f2', '--gold': '#c9a063', '--line': '#ead3cf', '--pd-env': '#b23e3c', '--pd-env-dk': '#8e2a2b', '--pd-env-lt': '#c04b47', '--pd-env-in': '#a33433', '--pd-blush': '#e8c4be', '--pd-pink': '#e3bdb8', '--pd-seal': '#93574a', '--pd-seal-hi': '#c58b79', '--pd-seal-dk': '#5d2f27' } },
    { id: 'xanh-ngoc', name: 'Xanh ngọc', swatch: ['#eef0ea', '#2f6a61'], vars: { ...base, '--page': '#e4e9e4', '--bg': '#f2f4ef', '--paper': '#fbfcf8', '--ink': '#233b37', '--muted': '#62736f', '--accent': '#2c645b', '--accent-ink': '#f4f6f0', '--gold': '#c4a15f', '--line': '#d3ddd6', '--pd-env': '#2f6b62', '--pd-env-dk': '#21524b', '--pd-env-lt': '#3a7a70', '--pd-env-in': '#275d55', '--pd-blush': '#bfd4cc', '--pd-pink': '#c3d6cf', '--pd-seal': '#a8844e', '--pd-seal-hi': '#dcbf85', '--pd-seal-dk': '#6a4f25' } },
  ],
  demo: {
    cover: P(5),
    photos: [1, 2, 3, 6, 7, 8, 5].map(P),
    story: 'Quen nhau từ một buổi chiều mưa nơi phố cổ, bảy năm đi qua bao mùa Tết, chúng mình quyết định cùng nhau về chung một nhà.',
  },
  layout: ['invite', 'couple', 'party', 'story', 'about', 'calendar', 'events', 'gallery', 'rsvp', 'gift', 'wishes', 'thanks'],

  title(text, sub) {
    return `<h2 class="pd-h2">${esc(text)}</h2>${sub ? `<p class="sec-sub">${esc(sub)}</p>` : ''}`;
  },

  opener(ctx) {
    const p = ctx.dparts;
    return `
<div class="opener pd-op" id="opener" data-open-ms="2000">
  <div class="pd-op-in">
    <p class="pd-wi">Wedding Invitation</p>
    <p class="pd-tm">Thiệp mời cưới</p>
    <p class="pd-onames"><span>${esc(ctx.g)}</span><i>&amp;</i><span>${esc(ctx.b)}</span></p>
    ${medal('pd-omedal')}
    <div class="pd-env">
      <div class="pd-env-back"></div>
      <div class="pd-letter"><div>${hy('pd-lhy')}<p>${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>${p ? `<span>${p.d} · ${p.m} · ${p.y}</span>` : ''}</div></div>
      ${ENV_FRONT}
      <div class="pd-flap">${ENV_FLAP}</div>
      ${seal('pd-seal')}
    </div>
    ${ctx.guest ? `<p class="pd-to">Thân mời <b>${esc(ctx.guest.name)}</b></p>` : ''}
    <button class="pd-hint" id="openBtn" type="button"><span>Chạm để mở thiệp</span></button>
  </div>
</div>`;
  },

  cover(ctx) {
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    const p = ctx.dparts;
    return `
<header class="pd-cover">
  <p class="pd-wi">Wedding Invitation</p>
  <h1 class="pd-names"><span>${esc(ctx.g)}</span><i>&amp;</i><span>${esc(ctx.b)}</span></h1>
  <div class="pd-cenv">
    <div class="pd-cbody">
      <div class="pd-cflap">${ENV_FLAP_UP}</div>
      <div class="pd-env-back"></div>
      ${photo ? `<div class="pd-cphoto"><img src="${esc(photo)}" alt="Ảnh cưới"></div>` : ''}
      ${ENV_FRONT}
      ${seal('pd-cseal')}
    </div>
  </div>
  ${p ? `<div class="pd-cdate"><span>${esc(ctx.weekday)}</span>${medal('pd-cmedal')}<span>${p.d}.${p.m}.${p.y}</span></div><p class="pd-clunar">${esc(lunarOf(ctx))}</p>` : ''}
</header>`;
  },

  sections: {
    // ảnh cưới làm nền, tấm voan mờ chứa đếm ngược + lời mời có tên khách
    invite(ctx) {
      const { d } = ctx;
      const photo = d.photos[1] || d.cover || d.photos[0] || '';
      const u = (k, l) => `<span><b data-cd="${k}">0</b><small>${l}</small></span>`;
      return `
  <section class="sec pd-inv">
    ${photo ? `<div class="pd-inv-bg" style="background-image:url('${esc(photo)}')"></div>` : ''}
    <div class="pd-veil reveal">
      ${d.show.countdown && ctx.dparts ? `<div class="pd-cd" role="timer">${u('d', 'Ngày')}${u('h', 'Giờ')}${u('m', 'Phút')}${u('s', 'Giây')}</div>` : ''}
      <h2 class="pd-spaced">Invitation</h2>
      <p class="pd-txt">Gửi tới gia đình và bạn bè thân yêu — cảm ơn vì đã luôn ở bên, cùng chúng mình đi qua những tháng ngày đẹp nhất.</p>
      <p class="pd-lead">${esc(d.inviteText)}</p>
      <p class="pd-guest">${ctx.guest ? esc(ctx.guest.name) : 'Quý khách'}</p>
      <p class="pd-txt">tới dự lễ cưới và chung vui cùng gia đình chúng tôi</p>
      ${d.message ? `<p class="pd-msg">${esc(d.message)}</p>` : ''}
    </div>
  </section>`;
    },

    // "Lễ Thành Hôn" dọc bên trái, tên hai bạn so le; thông tin hai nhà
    couple(ctx) {
      const { d } = ctx;
      const fam = (x, label) => `<div class="pd-fam"><h3>${label}</h3>${x.father ? `<p>${esc(x.father)}</p>` : ''}${x.mother ? `<p>${esc(x.mother)}</p>` : ''}${x.address ? `<p class="a">${esc(x.address)}</p>` : ''}</div>`;
      const hasFam = d.groom.father || d.groom.mother || d.bride.father || d.bride.mother;
      return `
  <section class="sec pd-couple reveal">
    <div class="pd-cpl">
      <p class="pd-vert" aria-hidden="true"><i></i><span>Lễ</span><span>Thành</span><span>Hôn</span><i></i></p>
      <div class="pd-cpl-n">
        <p class="g">${esc(d.groom.fullName || d.groom.name)}</p>
        <p class="amp">&amp;</p>
        <p class="b">${esc(d.bride.fullName || d.bride.name)}</p>
      </div>
    </div>
    ${hasFam ? `<div class="pd-fams">${fam(d.groom, 'Nhà Trai')}${fam(d.bride, 'Nhà Gái')}</div>` : ''}
  </section>`;
    },

    // tiệc chính: giờ, ngày lớn, âm lịch, nơi tổ chức + bản đồ
    party(ctx, opts, h) {
      const { d, dparts: p } = ctx;
      const ev = partyEvent(d) || {};
      if (!p && !ev.place) return '';
      const time = ev.time || d.time;
      const dir = ev.mapUrl || (ev.address ? h.mapSearch(ev.address) : '');
      return `
  <section class="sec pd-party reveal">
    <h2 class="pd-up">${esc(ev.name ? `Tiệc mừng ${/tiệc/i.test(ev.name) ? 'lễ thành hôn' : ev.name}` : 'Tiệc mừng lễ thành hôn')}</h2>
    ${p ? `<p class="pd-at">Vào lúc ${esc(h.clock(time))} · ${esc(ctx.weekday)}</p>
    <div class="pd-big"><span>Tháng ${+p.m}</span><b>${p.d}</b><span>Năm ${p.y}</span></div>
    <p class="pd-lunar">(${esc(lunarOf(ctx))})</p>` : ''}
    ${ev.place || ev.address ? `<p class="pd-k">Địa điểm tổ chức</p>
    ${ev.place ? `<p class="pd-venue">${esc(ev.place)}</p>` : ''}
    ${ev.address ? `<p class="pd-addr">${esc(ev.address)}</p>` : ''}` : ''}
    ${ev.address ? `<div class="pd-map"><iframe loading="lazy" title="Bản đồ" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(ev.address)}&amp;output=embed"></iframe></div>` : ''}
    <p class="pd-acts">
      ${dir ? `<a class="btn" target="_blank" rel="noopener" href="${esc(dir)}">Chỉ đường</a>` : ''}
      ${p ? `<a class="btn ghost" target="_blank" rel="noopener" href="${esc(h.calendarLink(`Đám cưới ${ctx.g} & ${ctx.b}`, ctx.date, time, ev.address || ev.place))}">Lưu vào lịch</a>` : ''}
    </p>
  </section>`;
    },

    // "Marry me? — Yes, I do!" trên khối hồng so le + câu chuyện
    story(ctx) {
      const { d } = ctx;
      const has = d.photos.length;
      if (!has && !d.story) return '';
      return `
  <section class="sec pd-yes">
    ${has ? `<span class="pd-blk" aria-hidden="true"></span>
    <p class="pd-sw reveal">Sweet wedding</p>
    <div class="pd-yes-a reveal"><h3>Marry<br>me?</h3><div class="pd-fr">${ph(ctx, 2)}</div></div>
    <div class="pd-yes-b reveal">${ph(ctx, 3)}<h3>Yes,<br>I do!</h3>${HEART.replace('<svg', '<svg class="pd-yh"')}</div>` : ''}
    ${d.story ? `<div class="pd-story reveal">${dotH('Our story')}${d.story.split(/\n+/).map((t) => `<p>${esc(t)}</p>`).join('')}</div>` : ''}
  </section>`;
    },

    // giới thiệu cô dâu / chú rể: ảnh + tên so le, chữ dọc Bride / Groom
    about(ctx) {
      const { d } = ctx;
      if (!d.photos.length) return '';
      const row = (x, role, en, i, flip) => `
      <div class="pd-ab${flip ? ' flip' : ''} reveal">
        <div class="pd-ab-t"><p class="r">${role}</p><p class="n">${esc(x.fullName || x.name)}</p>${x.address ? `<p class="a">${esc(x.address)}</p>` : ''}</div>
        <div class="pd-ab-p">${ph(ctx, i)}<span class="pd-en">${en}</span></div>
      </div>`;
      return `
  <section class="sec pd-about">
    ${dotH('About us')}
    ${row(d.bride, 'Cô dâu', 'Bride', 4, false)}
    ${row(d.groom, 'Chú rể', 'Groom', 5, true)}
  </section>`;
    },

    // Save the date: ảnh lớn, lịch tháng trên tấm kính mờ, nhãn dọc năm/tháng
    calendar(ctx, opts, h) {
      const { d, dparts: p } = ctx;
      if (!p || !d.show.calendar) return '';
      const photo = d.photos[0] || d.cover || '';
      return `
  <section class="sec pd-std reveal">
    <div class="pd-std-h">${dotH('Save the date')}<span class="pd-tab">${p.y} / Tháng ${+p.m}</span></div>
    <div class="pd-std-wrap">
      <span class="pd-std-line" aria-hidden="true"></span>
      <div class="pd-std-ph"${photo ? ` style="background-image:url('${esc(photo)}')"` : ''}>
        <div class="pd-glass">${h.calGrid(ctx, `<p class="pd-calh">${p.d} <i>/</i> ${p.m}</p>`)}<p class="pd-gl">${esc(ctx.weekday)} · âm lịch ${esc(ctx.lunarShort)}</p></div>
      </div>
    </div>
  </section>`;
    },

    // lịch trình: biểu tượng — tim trên vạch dọc — giờ & tên, chỉ đường từng nơi
    events(ctx, opts, h) {
      const evs = evList(ctx.d);
      if (!evs.length) return '';
      return `
  <section class="sec pd-ev">
    <h2 class="pd-h2">Lịch trình</h2>
    <p class="sec-sub">${esc(ctx.weekday)}${ctx.dmy ? `, ${esc(ctx.dmy)}` : ''}</p>
    <ol class="pd-tl">
      ${evs.map((e) => {
        const dir = e.mapUrl || (e.address ? h.mapSearch(e.address) : '');
        const other = e.date && e.date !== ctx.date;
        return `<li class="reveal">
        <span class="pd-ico"><svg viewBox="0 0 48 40" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[iconFor(e.name)]}</g></svg></span>
        <span class="pd-hrt">${HEART}</span>
        <div class="pd-tlb">
          <p class="t"><b>${esc(h.clock(e.time)) || '—'}</b>${e.name ? ` : ${esc(e.name)}` : ''}</p>
          ${other ? `<p class="s">${esc(h.weekday(e.date))}, ${esc(h.dmy(e.date))}</p>` : ''}
          ${e.place ? `<p class="s">${esc(e.place)}</p>` : ''}
          ${e.address ? `<p class="s m">${esc(e.address)}</p>` : ''}
          ${dir ? `<a target="_blank" rel="noopener" href="${esc(dir)}">Chỉ đường →</a>` : ''}
        </div>
      </li>`;
      }).join('')}
    </ol>
  </section>`;
    },

    // album: nền hồng, chữ dọc hai mép, ảnh viền trắng xếp so le
    gallery(ctx) {
      const list = ctx.d.photos;
      if (!ctx.d.show.gallery || !list.length) return '';
      return `
  <section class="sec pd-gal">
    <p class="pd-spaced pd-gal-h">Album</p>
    <span class="pd-vt l" aria-hidden="true">love you forever</span>
    <span class="pd-vt r" aria-hidden="true">happy ever after</span>
    <div class="pd-grid">
      ${list.map((u, i) => `<button class="ph reveal" data-i="${i}" style="background-image:url('${esc(u)}')" aria-label="Xem ảnh ${i + 1}"></button>`).join('')}
    </div>
  </section>`;
    },

    // mừng cưới: ảnh tròn viền nét đứt + thẻ QR
    gift(ctx, opts, h) {
      const { d } = ctx;
      if (!d.show.gift) return '';
      const row = (who, i) => {
        const card = h.giftCard(ctx, d.gifts[who], who);
        return card ? `<div class="pd-gr${i ? ' flip' : ''} reveal"><span class="pd-av">${d.photos.length ? `<i style="background-image:url('${esc(d.photos[(i ? 6 : 4) % d.photos.length])}')"></i>` : hy('pd-avhy')}</span>${card}</div>` : '';
      };
      const html = row('bride', 0) + row('groom', 1);
      if (!html) return '';
      return `
  <section class="sec pd-gift">
    <h2 class="pd-h2">Gửi quà mừng</h2>
    <p class="sec-sub">Chạm mã QR hoặc sao chép số tài khoản</p>
    ${html}
  </section>`;
    },

    thanks(ctx) {
      return `
  <section class="sec pd-thx reveal">
    ${medal('pd-tmedal')}
    <p class="pd-thx-b">Thank you</p>
    <p class="pd-txt">Cảm ơn bạn đã dành thời gian chung vui<br>cùng chúng mình trong ngày trọng đại.</p>
    <p class="pd-thx-n">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
  </section>`;
    },
  },

  css: `
.tpl-phongdo{background:var(--page)}
.tpl-phongdo .card{background:var(--bg);color:var(--ink);box-shadow:0 0 40px rgba(60,20,20,.12)}
.tpl-phongdo .sec{padding:56px 24px}
.tpl-phongdo .pd-h2{margin:0 0 22px;font-family:var(--font-body);font-weight:500;font-size:24px;letter-spacing:.06em;text-transform:uppercase;color:var(--accent)}
.tpl-phongdo .pd-h2 + .sec-sub{margin:-14px 0 26px}
.tpl-phongdo .pd-wi{margin:0;padding-left:.5em;font-family:var(--font-body);font-weight:500;font-size:12px;letter-spacing:.5em;text-transform:uppercase;color:var(--accent)}
.tpl-phongdo .pd-spaced{margin:0;padding-left:.45em;font-family:var(--font-body);font-weight:500;font-size:28px;letter-spacing:.45em;text-transform:uppercase;color:var(--accent)}
.tpl-phongdo .pd-txt{margin:0 auto;max-width:340px;font-size:15px;line-height:1.75;color:var(--muted)}

/* ---- màn mở thiệp ---- */
.tpl-phongdo .pd-op{background:radial-gradient(ellipse at 50% 30%,var(--paper),var(--bg) 55%,var(--page));padding:20px;overflow:hidden}
.tpl-phongdo .pd-op-in{display:flex;flex-direction:column;align-items:center;width:100%;max-width:420px;text-align:center}
.tpl-phongdo .pd-tm{margin:14px 0 4px;font-family:var(--font-title);font-size:21px;text-transform:uppercase;letter-spacing:.04em;color:var(--accent)}
.tpl-phongdo .pd-onames{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:center;gap:4px 14px;margin:0;font-family:var(--font-script);font-size:40px;line-height:1.3;color:var(--ink)}
.tpl-phongdo .pd-onames i{font-style:normal;font-family:var(--font-title);font-size:22px;color:var(--accent)}
.tpl-phongdo .pd-omedal{width:58px;height:58px;margin:6px 0 26px}
.tpl-phongdo .pd-env{position:relative;width:min(340px,86vw);aspect-ratio:3/2;perspective:1000px;filter:drop-shadow(0 16px 18px rgba(70,20,20,.28));animation:pdBob 3.8s ease-in-out infinite}
.tpl-phongdo .pd-env-back{position:absolute;inset:0;z-index:1;border-radius:6px;background:var(--pd-env-dk)}
.tpl-phongdo .pd-ef{position:absolute;inset:0;z-index:3;width:100%;height:100%;display:block}
.tpl-phongdo .pd-letter{position:absolute;left:6%;right:6%;top:5%;bottom:7%;z-index:2;display:grid;place-items:center;border-radius:4px;background:var(--paper);box-shadow:0 0 0 1px var(--line) inset}
.tpl-phongdo .pd-letter div{display:flex;flex-direction:column;align-items:center;gap:2px;padding-bottom:30%}
.tpl-phongdo .pd-lhy{width:44px;color:var(--accent)}
.tpl-phongdo .pd-letter p{margin:4px 0 0;font-family:var(--font-script);font-size:24px;color:var(--ink)}
.tpl-phongdo .pd-letter span{font-size:12px;letter-spacing:.2em;color:var(--muted)}
.tpl-phongdo .pd-flap{position:absolute;left:0;top:0;z-index:4;width:100%;height:62%;transform-origin:50% 0}
.tpl-phongdo .pd-ff{display:block;width:100%;height:100%;filter:drop-shadow(0 3px 2px rgba(0,0,0,.18))}
.tpl-phongdo .pd-seal{position:absolute;left:50%;top:60%;z-index:5;width:18%;transform:translate(-50%,-50%);filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}
.tpl-phongdo .pd-to{margin:30px 0 0;font-size:15px;color:var(--muted)}
.tpl-phongdo .pd-to b{display:block;margin-top:2px;font-family:var(--font-script);font-weight:400;font-size:32px;line-height:1.2;color:var(--accent)}
.tpl-phongdo .pd-hint{position:relative;margin:24px 0 0;border:0;background:none;padding:4px 40px 10px;font-family:var(--font-script);font-size:28px;color:var(--accent)}
.tpl-phongdo .pd-hint::before{content:"";position:absolute;left:50%;bottom:-6px;width:300px;height:30px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(closest-side,rgba(70,30,30,.3),transparent)}
.tpl-phongdo .pd-hint span{position:relative;display:inline-block;animation:pdPulse 2.2s ease-in-out infinite}
.tpl-phongdo .pd-op.opening .pd-env{animation:none}
.tpl-phongdo .pd-op.opening .pd-seal{animation:pdSealOff .45s ease forwards}
.tpl-phongdo .pd-op.opening .pd-flap{animation:pdFlap .75s .3s ease-in-out forwards}
.tpl-phongdo .pd-op.opening .pd-letter{animation:pdLetter .85s 1s cubic-bezier(.3,.7,.25,1) forwards}
.tpl-phongdo .pd-op.opening .pd-hint,.tpl-phongdo .pd-op.opening .pd-to,.tpl-phongdo .pd-op.opening .pd-omedal{transition:opacity .4s;opacity:0}
@keyframes pdBob{50%{transform:translateY(-6px)}}
@keyframes pdPulse{50%{transform:scale(1.06);opacity:.75}}
@keyframes pdSealOff{to{opacity:0;transform:translate(-50%,-20%) scale(.5)}}
@keyframes pdFlap{0%{transform:rotateX(0);z-index:4}49%{z-index:4}50%{z-index:1}100%{transform:rotateX(180deg);z-index:1}}
@keyframes pdLetter{to{transform:translateY(-44%)}}

/* ---- bìa: phong bì đã mở, ảnh nhô lên ---- */
.tpl-phongdo .pd-cover{position:relative;display:flex;flex-direction:column;align-items:center;padding:34px 20px 40px;text-align:center;background:radial-gradient(ellipse at 50% 0,var(--paper),transparent 70%);overflow:hidden}
.tpl-phongdo .pd-names{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:center;gap:0 12px;margin:14px 0 0;font-family:var(--font-script);font-weight:400;font-size:clamp(30px,9.4vw,46px);line-height:1.25;color:var(--ink)}
.tpl-phongdo .pd-names span{white-space:nowrap}
.tpl-phongdo .pd-names i{font-style:normal;font-family:var(--font-title);font-size:24px;color:var(--accent)}
.tpl-phongdo .pd-cenv{width:min(310px,82vw);padding-top:128px;margin-top:4px}
.tpl-phongdo .pd-cbody{position:relative;aspect-ratio:3/2;filter:drop-shadow(0 16px 16px rgba(70,20,20,.25))}
.tpl-phongdo .pd-cflap{position:absolute;left:0;bottom:100%;z-index:0;width:100%;height:62%}
.tpl-phongdo .pd-cflap .pd-ff{filter:none}
.tpl-phongdo .pd-cphoto{position:absolute;left:50%;bottom:20%;z-index:2;width:64%;margin-left:-32%;animation:pdRise 5s ease-in-out infinite}
.tpl-phongdo .pd-cphoto img{width:100%;aspect-ratio:3/4;object-fit:cover;border:6px solid var(--paper);border-bottom-width:6px;box-shadow:0 4px 12px rgba(0,0,0,.2)}
.tpl-phongdo .pd-cseal{position:absolute;left:50%;top:49%;z-index:4;width:17%;transform:translate(-50%,-50%);filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}
@keyframes pdRise{50%{transform:translateY(-10px)}}
.tpl-phongdo .pd-cdate{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:26px;font-family:var(--font-title);font-size:17px;color:var(--accent)}
.tpl-phongdo .pd-cdate span{min-width:96px}
.tpl-phongdo .pd-cdate span:first-child{text-align:right}
.tpl-phongdo .pd-cdate span:last-child{text-align:left;letter-spacing:.06em}
.tpl-phongdo .pd-cmedal{width:44px;height:44px;flex:none;animation:pdSway 6s ease-in-out infinite}
@keyframes pdSway{25%{transform:rotate(-6deg)}75%{transform:rotate(6deg)}}
.tpl-phongdo .pd-clunar{margin:8px 0 0;font-size:13px;font-style:italic;color:var(--muted)}

/* ---- lời mời trên nền ảnh ---- */
.tpl-phongdo .pd-inv{padding:0 0 40px;background:var(--pd-pink)}
.tpl-phongdo .pd-inv-bg{height:440px;background:center 20%/cover no-repeat;-webkit-mask:linear-gradient(#000 70%,transparent);mask:linear-gradient(#000 70%,transparent)}
.tpl-phongdo .pd-veil{position:relative;margin:-170px 22px 0;padding:30px 20px 34px;background:color-mix(in srgb,var(--paper) 78%,transparent);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.tpl-phongdo .pd-cd{display:flex;justify-content:center;gap:10px;margin:-62px 0 26px;font-variant-numeric:tabular-nums}
.tpl-phongdo .pd-cd span{display:flex;flex-direction:column;align-items:center;justify-content:center;width:62px;height:62px;background:var(--accent);color:var(--accent-ink);box-shadow:0 6px 14px rgba(0,0,0,.18)}
.tpl-phongdo .pd-cd b{font-weight:500;font-size:24px;line-height:1.1}
.tpl-phongdo .pd-cd small{font-size:12px;opacity:.9}
.tpl-phongdo .pd-veil .pd-spaced{margin-bottom:16px}
.tpl-phongdo .pd-lead{margin:22px 0 0;font-size:13px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--ink)}
.tpl-phongdo .pd-guest{margin:4px 0 6px;font-family:var(--font-script);font-size:40px;line-height:1.25;color:var(--accent)}
.tpl-phongdo .pd-msg{margin:18px auto 0;max-width:320px;font-size:14px;font-style:italic;color:var(--muted)}

/* ---- tên đôi uyên ương ---- */
.tpl-phongdo .pd-couple{padding-top:64px}
.tpl-phongdo .pd-cpl{display:grid;grid-template-columns:56px 1fr;align-items:center;gap:6px;text-align:left}
.tpl-phongdo .pd-vert{display:flex;flex-direction:column;align-items:center;gap:6px;margin:0;font-family:var(--font-script);font-size:26px;line-height:1.1;color:var(--ink)}
.tpl-phongdo .pd-vert i{width:1px;height:70px;background:var(--accent)}
.tpl-phongdo .pd-cpl-n p{margin:0;font-family:var(--font-script);font-size:40px;line-height:1.25;color:var(--accent)}
.tpl-phongdo .pd-cpl-n .amp{margin:4px 0 4px 40%;font-size:34px;color:var(--ink)}
.tpl-phongdo .pd-cpl-n .b{text-align:right}
.tpl-phongdo .pd-fams{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:40px}
.tpl-phongdo .pd-fam h3{margin:0 0 6px;font-family:var(--font-title);font-weight:400;font-size:21px;color:var(--ink)}
.tpl-phongdo .pd-fam p{margin:0 0 4px;font-size:14px;color:var(--ink)}
.tpl-phongdo .pd-fam .a{color:var(--muted);font-size:13px}

/* ---- tiệc chính ---- */
.tpl-phongdo .pd-party{padding-top:20px}
.tpl-phongdo .pd-up{margin:0;font-family:var(--font-title);font-weight:400;font-size:22px;line-height:1.35;text-transform:uppercase;color:var(--ink)}
.tpl-phongdo .pd-at{margin:6px 0 0;font-family:var(--font-title);font-size:15px;text-transform:uppercase;color:var(--ink)}
.tpl-phongdo .pd-big{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:14px;margin:18px 0 6px;font-family:var(--font-title)}
.tpl-phongdo .pd-big span{font-size:22px;color:var(--ink)}
.tpl-phongdo .pd-big span:first-child{text-align:right}
.tpl-phongdo .pd-big span:last-child{text-align:left}
.tpl-phongdo .pd-big b{font-weight:400;font-size:64px;line-height:1;color:var(--accent)}
.tpl-phongdo .pd-lunar{margin:0;font-family:var(--font-title);font-size:14px;color:var(--muted)}
.tpl-phongdo .pd-k{margin:26px 0 4px;font-family:var(--font-title);font-size:16px;text-transform:uppercase;color:var(--ink)}
.tpl-phongdo .pd-venue{margin:0;font-family:var(--font-title);font-size:22px;line-height:1.35;text-transform:uppercase;color:var(--accent)}
.tpl-phongdo .pd-addr{margin:4px 0 0;font-size:14px;color:var(--muted)}
.tpl-phongdo .pd-map{margin:20px 0 0;padding:8px;background:var(--paper);box-shadow:0 4px 16px rgba(0,0,0,.08);aspect-ratio:4/3}
.tpl-phongdo .pd-map iframe{width:100%;height:100%;border:0;display:block}
.tpl-phongdo .pd-acts{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin:18px 0 0}

/* ---- tiêu đề chấm tròn ---- */
.tpl-phongdo .pd-dh{position:relative;display:inline-flex;align-items:center;margin:0 0 24px;padding:6px 0 6px 34px;font-weight:400}
.tpl-phongdo .pd-dh em{position:relative;font-style:normal;font-family:var(--font-script);font-size:40px;line-height:1;color:var(--accent)}
.tpl-phongdo .pd-dot{position:absolute;left:0;top:50%;width:62px;height:62px;margin-top:-31px;border-radius:50%;background:linear-gradient(135deg,var(--pd-pink),var(--paper));opacity:.9}
.tpl-phongdo .pd-spark{position:absolute;left:44px;top:-10px;width:26px;animation:pdTw 2.6s ease-in-out infinite}
@keyframes pdTw{50%{opacity:.4;transform:scale(.8)}}

/* ---- Marry me / Yes I do ---- */
.tpl-phongdo .pd-yes{padding:48px 0 40px;overflow:hidden}
.tpl-phongdo .pd-blk{position:absolute;right:0;top:40px;width:50%;height:min(820px,calc(100% - 200px));background:var(--pd-pink)}
.tpl-phongdo .pd-sw{position:relative;margin:0 0 24px;padding-left:.4em;font-size:15px;font-weight:500;letter-spacing:.4em;text-transform:uppercase;color:var(--ink)}
.tpl-phongdo .pd-yes h3{margin:0;font-family:var(--font-body);font-weight:500;font-size:clamp(34px,10vw,44px);line-height:1.15;letter-spacing:.14em;text-transform:uppercase}
.tpl-phongdo .pd-yes-a{position:relative;display:grid;grid-template-columns:42% 1fr;align-items:center;padding:0 18px 0 20px}
.tpl-phongdo .pd-yes-a h3{position:relative;z-index:1;text-align:left;color:var(--accent);margin-right:-30px}
.tpl-phongdo .pd-fr{padding:8px;border:3px solid var(--accent)}
.tpl-phongdo .pd-fr .ph{display:block;width:100%;aspect-ratio:4/3;border-radius:0}
.tpl-phongdo .pd-yes-b{position:relative;display:grid;grid-template-columns:60% 1fr;align-items:center;gap:12px;padding:0 16px 0 20px;margin-top:24px}
.tpl-phongdo .pd-yes-b .ph{width:100%;aspect-ratio:3/4;border-radius:0;box-shadow:0 8px 20px rgba(0,0,0,.15)}
.tpl-phongdo .pd-yes-b h3{color:var(--paper);text-shadow:0 2px 10px color-mix(in srgb,var(--accent) 60%,transparent);font-size:clamp(28px,8vw,38px)}
.tpl-phongdo .pd-yes .ph{grid-column:auto}
.tpl-phongdo .pd-yh{position:absolute;right:22px;top:6%;width:56px;color:color-mix(in srgb,var(--accent) 45%,transparent);animation:pdBeat 1.8s ease-in-out infinite}
@keyframes pdBeat{50%{transform:scale(1.12)}}
.tpl-phongdo .pd-story{position:relative;margin-top:44px;padding:0 24px}
.tpl-phongdo .pd-story p{margin:0 auto 10px;max-width:360px;color:var(--ink);font-size:15px}

/* ---- About us ---- */
.tpl-phongdo .pd-about{padding-top:28px}
.tpl-phongdo .pd-ab{display:grid;grid-template-columns:1fr 54%;align-items:center;gap:16px;margin-bottom:30px}
.tpl-phongdo .pd-ab.flip{grid-template-columns:54% 1fr}
.tpl-phongdo .pd-ab.flip .pd-ab-t{order:2}
.tpl-phongdo .pd-ab-t p{margin:0}
.tpl-phongdo .pd-ab-t .r{font-size:12px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
.tpl-phongdo .pd-ab-t .n{margin:4px 0!important;font-family:var(--font-script);font-size:30px;line-height:1.2;color:var(--ink)}
.tpl-phongdo .pd-ab-t .a{font-size:13px;color:var(--muted)}
.tpl-phongdo .pd-ab-p{position:relative}
.tpl-phongdo .pd-ab-p .ph{display:block;width:100%;aspect-ratio:3/4;border-radius:0;box-shadow:10px 10px 0 var(--pd-pink)}
.tpl-phongdo .pd-en{position:absolute;top:8px;right:-22px;writing-mode:vertical-rl;font-family:var(--font-title);font-size:22px;letter-spacing:.2em;color:var(--pd-blush);pointer-events:none}
.tpl-phongdo .pd-ab.flip .pd-en{right:auto;left:-24px;transform:rotate(180deg)}

/* ---- Save the date ---- */
.tpl-phongdo .pd-std{padding:40px 0 48px}
.tpl-phongdo .pd-std-h{position:relative;display:flex;align-items:center;justify-content:space-between;padding:0 0 0 24px}
.tpl-phongdo .pd-std-h .pd-dh{margin:0}
.tpl-phongdo .pd-std-h .pd-dh em{font-family:var(--font-title);font-size:28px}
.tpl-phongdo .pd-tab{align-self:stretch;writing-mode:vertical-rl;padding:10px 8px;margin-right:16px;background:var(--pd-blush);color:var(--paper);font-size:13px;font-weight:600;letter-spacing:.14em}
.tpl-phongdo .pd-std-wrap{position:relative;margin-top:-30px;padding:30px 16px 0 40px}
.tpl-phongdo .pd-std-line{position:absolute;left:22px;top:0;right:56px;height:70%;border:1.5px solid var(--accent);border-bottom:0;border-right:0}
.tpl-phongdo .pd-std-ph{position:relative;aspect-ratio:3/4;background:var(--pd-pink) center/cover no-repeat;display:flex;align-items:flex-end;justify-content:center;padding:0 0 16px}
.tpl-phongdo .pd-glass{width:88%;padding:14px 10px 12px;background:color-mix(in srgb,var(--paper) 62%,transparent);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);color:var(--ink)}
.tpl-phongdo .pd-calh{margin:0 0 6px;font-family:var(--font-title);font-size:28px;color:var(--accent)}
.tpl-phongdo .pd-calh i{font-style:normal;font-size:18px}
.tpl-phongdo .pd-glass .cal-grid span{height:30px;font-size:14px}
.tpl-phongdo .pd-glass .cal-grid .cal-w{height:24px;color:var(--accent);opacity:.9}
.tpl-phongdo .cal-on::before{-webkit-mask:none;mask:none;width:30px;height:30px;border-radius:50%;background:var(--accent);animation:pdBeat 1.8s ease-in-out infinite}
.tpl-phongdo .cal-on b{margin-top:0}
.tpl-phongdo .pd-gl{margin:6px 0 0;font-size:12px;color:var(--muted)}

/* ---- lịch trình tim ---- */
.tpl-phongdo .pd-tl{list-style:none;margin:0 auto;padding:0;max-width:380px;text-align:left}
.tpl-phongdo .pd-tl li{position:relative;display:grid;grid-template-columns:64px 34px 1fr;gap:0 12px;align-items:start;padding-bottom:28px}
.tpl-phongdo .pd-tl li::before{content:"";position:absolute;left:92px;top:22px;bottom:-4px;width:1.5px;background:color-mix(in srgb,var(--accent) 45%,transparent)}
.tpl-phongdo .pd-tl li:last-child::before{display:none}
.tpl-phongdo .pd-ico{display:grid;place-items:center;height:42px;color:var(--accent)}
.tpl-phongdo .pd-ico svg{width:46px}
.tpl-phongdo .pd-hrt{position:relative;z-index:1;display:grid;place-items:center;height:42px;color:var(--pd-seal-hi)}
.tpl-phongdo .pd-hrt svg{width:28px}
.tpl-phongdo .pd-tlb{padding-top:8px}
.tpl-phongdo .pd-tlb p{margin:0}
.tpl-phongdo .pd-tlb .t{font-family:var(--font-title);font-size:17px;color:var(--ink)}
.tpl-phongdo .pd-tlb .t b{font-weight:400;color:var(--accent)}
.tpl-phongdo .pd-tlb .s{font-size:14px;color:var(--ink)}
.tpl-phongdo .pd-tlb .m{color:var(--muted);font-size:13px}
.tpl-phongdo .pd-tlb a{display:inline-block;margin-top:6px;font-size:13px;font-weight:600;color:var(--accent);text-decoration:none}

/* ---- album ---- */
.tpl-phongdo .pd-gal{padding:48px 46px 52px;background:linear-gradient(var(--pd-pink),color-mix(in srgb,var(--pd-pink) 55%,var(--bg)))}
.tpl-phongdo .pd-gal-h{margin-bottom:22px;color:var(--paper)}
.tpl-phongdo .pd-vt{position:absolute;top:110px;writing-mode:vertical-rl;font-family:var(--font-script);font-size:30px;color:var(--accent);opacity:.8;white-space:nowrap}
.tpl-phongdo .pd-vt.l{left:6px;transform:rotate(180deg)}
.tpl-phongdo .pd-vt.r{right:6px;top:auto;bottom:90px}
.tpl-phongdo .pd-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.tpl-phongdo .pd-grid .ph{border-radius:0;aspect-ratio:3/4;border:5px solid var(--paper);box-shadow:0 6px 14px rgba(0,0,0,.12)}
.tpl-phongdo .pd-grid .ph:nth-child(3n+1){grid-column:span 2;aspect-ratio:4/3}

/* ---- biểu mẫu ---- */
.tpl-phongdo .form{border-radius:6px;background:var(--paper);border-color:var(--line);box-shadow:0 10px 28px rgba(80,30,30,.1)}
.tpl-phongdo .form input:not([type=radio]),.tpl-phongdo .form select,.tpl-phongdo .form textarea,.tpl-phongdo .choice label{border-radius:6px}
.tpl-phongdo .btn{border-radius:4px;letter-spacing:.06em}
.tpl-phongdo .wish{border-radius:6px;border-left:3px solid var(--accent)}

/* ---- mừng cưới ---- */
.tpl-phongdo .pd-gr{display:grid;grid-template-columns:96px 1fr;align-items:center;gap:12px;margin:0 0 22px}
.tpl-phongdo .pd-gr.flip{grid-template-columns:1fr 96px}
.tpl-phongdo .pd-gr.flip .pd-av{order:2}
.tpl-phongdo .pd-av{display:grid;place-items:center;width:96px;height:96px;padding:6px;border-radius:50%;border:4px dashed var(--pd-blush);animation:pdSpin 30s linear infinite}
.tpl-phongdo .pd-av i{display:block;width:100%;height:100%;border-radius:50%;background:center 25%/cover;animation:pdSpin 30s linear infinite reverse}
.tpl-phongdo .pd-avhy{width:60%;color:var(--accent)}
@keyframes pdSpin{to{transform:rotate(360deg)}}
.tpl-phongdo .gift{padding:16px 12px;border-radius:22px;background:var(--paper);box-shadow:0 8px 20px rgba(0,0,0,.08)}
.tpl-phongdo .gift img{width:150px;height:150px}
.tpl-phongdo .gift-acc{font-size:16px;flex-wrap:wrap}

/* ---- cảm ơn ---- */
.tpl-phongdo .pd-thx{padding-bottom:30px}
.tpl-phongdo .pd-tmedal{width:72px;height:72px;margin:0 auto 6px;animation:pdSway 6s ease-in-out infinite}
.tpl-phongdo .pd-thx-b{margin:0;font-family:var(--font-script);font-size:58px;line-height:1.2;color:var(--accent)}
.tpl-phongdo .pd-thx-n{margin:18px 0 0;font-family:var(--font-title);font-size:22px;color:var(--ink)}

@media (prefers-reduced-motion:reduce){.tpl-phongdo *{animation:none!important}}
`,
};
