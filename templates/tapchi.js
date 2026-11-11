// Mẫu "Tạp Chí" — bố cục tạp chí trên nền ảnh cưới ngoài trời: chữ "WE GET MARRIED" xếp tầng thật lớn trên ảnh bìa,
// chú thích kiểu biên tập, ảnh vòm có chữ cong, lịch tháng nổi trên ảnh, album xếp so le như trang báo.
const { esc } = require('../lib/util');

const base = {
  '--font-title': "'Playfair Display',Georgia,serif",
  '--font-script': "'Cormorant Garamond',Georgia,serif",
  '--font-body': "'Cormorant Garamond',Georgia,serif",
};

// ảnh thứ i trong album (vòng lại nếu ít ảnh, rỗng thì lấy ảnh bìa)
const pick = (d, i) => (d.photos.length ? d.photos[i % d.photos.length] : d.cover) || '';
const HEART = '<svg class="tc-heart" viewBox="0 0 32 29" aria-hidden="true"><path fill="currentColor" d="M16 28.5C6.4 21 0 15.2 0 8.6 0 3.8 3.7 0 8.4 0c3 0 5.7 1.6 7.6 4.1C17.9 1.6 20.6 0 23.6 0 28.3 0 32 3.8 32 8.6c0 6.6-6.4 12.4-16 19.9z"/></svg>';
const no = (i) => String(i + 1).padStart(2, '0');

module.exports = {
  id: 'tapchi',
  name: 'Tạp Chí',
  group: 'toigian',
  badge: 'Mới',
  desc: 'Bố cục tạp chí trên ảnh cưới ngoài trời, chữ lớn xếp tầng và album so le',
  fonts: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Be+Vietnam+Pro:wght@300;400;500&display=swap',
  palettes: [
    { id: 'xanh-la', name: 'Xanh lá', swatch: ['#2f4a2a', '#a31d24'], vars: { ...base, '--page': '#e7ebe2', '--bg': '#fbfbf7', '--paper': '#ffffff', '--ink': '#1f281c', '--muted': '#68725f', '--accent': '#2f4a2a', '--accent-ink': '#ffffff', '--gold': '#8c9a6e', '--line': '#dfe4d7', '--tc-red': '#a31d24', '--tc-band': 'rgba(196,208,184,.72)', '--tc-shade': '#1c2a17' } },
    { id: 'nau-be', name: 'Nâu be', swatch: ['#6b4a32', '#e9dccb'], vars: { ...base, '--page': '#eee6db', '--bg': '#fbf7f1', '--paper': '#ffffff', '--ink': '#2b211a', '--muted': '#7d6b5c', '--accent': '#6b4a32', '--accent-ink': '#ffffff', '--gold': '#b39373', '--line': '#e8ddcf', '--tc-red': '#9a2b22', '--tc-band': 'rgba(222,204,182,.74)', '--tc-shade': '#2a1d12' } },
  ],
  demo: {
    cover: '/demo/hoamoc-6.webp',
    photos: [2, 3, 7, 4, 8, 5, 1].map((n) => `/demo/hoamoc-${n}.webp`),
  },
  layout: ['intro', 'invite', 'story', 'calendar', 'when', 'events', 'gallery', 'wishes', 'rsvp', 'gift', 'thanks'],

  title(text, sub) {
    return `<h2 class="tc-h"><span>${esc(text)}</span></h2>${sub ? `<p class="tc-hsub">${esc(sub)}</p>` : ''}`;
  },

  // màn mở: bìa tạp chí gập lại, chạm để lật trang
  opener(ctx) {
    const p = ctx.dparts;
    const cover = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<div class="opener tc-opener" id="opener" data-open-ms="1150">
  <div class="tc-ocover" style="background-image:url('${esc(cover)}')">
    <div class="tc-omast"><span>Số đặc biệt</span><b>The Wedding Issue</b><span>${p ? `Tháng ${+p.m} · ${p.y}` : 'Ấn bản riêng'}</span></div>
    <div class="tc-obody">
      <p class="tc-oto">${ctx.guest ? `Ấn bản dành riêng cho<br><b>${esc(ctx.guest.name)}</b>` : 'Ấn bản dành riêng cho<br><b>Quý khách</b>'}</p>
      <h1 class="tc-onames">${esc(ctx.g)}<i>&amp;</i>${esc(ctx.b)}</h1>
      <button class="tc-obtn" id="openBtn" type="button">Lật trang <span aria-hidden="true">→</span></button>
    </div>
  </div>
</div>`;
  },

  // bìa: ảnh tràn khung, "WE / GET / MARRIED" xếp tầng thật lớn, dòng tít kiểu tạp chí, ngày và tên ở chân bìa
  cover(ctx) {
    const p = ctx.dparts;
    const cover = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="tc-cover">
  <div class="tc-cimg" style="background-image:url('${esc(cover)}')" role="img" aria-label="Ảnh cưới"></div>
  <div class="tc-cbar"><span>Vol. ${p ? p.y.slice(2) : '01'}</span><span>Số đặc biệt</span><span>${p ? `${p.d}.${p.m}` : ''}</span></div>
  <h1 class="tc-big" aria-label="We get married"><span>We</span><span>Get</span><span>Married</span></h1>
  <p class="tc-vert" aria-hidden="true">The wedding issue — ${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
  <ul class="tc-lines" aria-hidden="true"><li><b>02</b> Lời mời</li><li><b>04</b> Ngày chung đôi</li><li><b>06</b> Album</li></ul>
  <div class="tc-cfoot">
    ${p ? `<p class="tc-cdate">${p.d}<i>.</i>${p.m}<i>.</i>${p.y}</p>` : ''}
    <p class="tc-cnames">${esc(ctx.g)} <i>&amp;</i> ${esc(ctx.b)}</p>
  </div>
</header>`;
  },

  sections: {
    // mở đầu: tên, dòng chữ nghiêng, tim đỏ, ảnh ngang có chú thích, đoạn lời ngỏ
    intro(ctx) {
      const { d } = ctx;
      const ph = d.photos.length ? d.photos[0] : '';
      return `
  <section class="sec tc-intro">
    <p class="tc-kicker reveal">Thư mời · ${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
    <p class="tc-quote reveal">Lâu rồi không gặp — hẹn nhau ở lễ cưới nhé!</p>
    <div class="tc-beat reveal">${HEART}</div>
    ${ph ? `<figure class="tc-fig reveal"><button class="ph tc-land" data-i="0" style="background-image:url('${esc(ph)}')" aria-label="Xem ảnh 1"></button><figcaption>Ảnh 01 — một buổi chiều trong vườn, trước ngày về chung nhà.</figcaption></figure>` : ''}
    <div class="tc-prose reveal">
      <p>Có những ngày bình thường bỗng trở nên đặc biệt, vì được chờ đợi bằng cả trái tim.</p>
      <p>Chúng mình háo hức được gặp bạn — người đã cùng chúng mình đi qua bao mùa nắng mưa để đến hôm nay.</p>
    </div>
  </section>`;
    },

    // lời mời: ảnh vòm có chữ cong phía trên, dải chữ trong mờ ngang ảnh, rồi hai họ + tên khách + tên đầy đủ
    invite(ctx) {
      const { d, guest } = ctx;
      const ph = pick(d, 1);
      const fam = (x, label) => `<div class="tc-fam"><p class="k">${label}</p>${x.father ? `<p>${esc(x.father)}</p>` : ''}${x.mother ? `<p>${esc(x.mother)}</p>` : ''}${x.address ? `<p class="a">${esc(x.address)}</p>` : ''}</div>`;
      const hasFam = d.groom.father || d.groom.mother || d.bride.father || d.bride.mother;
      return `
  <section class="sec tc-invite">
    <div class="tc-arch reveal">
      <svg class="tc-curve" viewBox="0 0 400 140" aria-hidden="true"><defs><path id="tcArc" d="M30 136 A170 118 0 0 1 370 136"/></defs><text><textPath href="#tcArc" startOffset="50%" text-anchor="middle">Welcome to our wedding</textPath></text></svg>
      <div class="tc-archimg" style="background-image:url('${esc(ph)}')"></div>
      <p class="tc-band">${esc(d.inviteText)} bạn đến dự<br>hôn lễ của chúng tôi</p>
    </div>
    ${hasFam ? `<div class="tc-fams reveal">${fam(d.groom, 'Nhà trai')}<span class="tc-vr" aria-hidden="true"></span>${fam(d.bride, 'Nhà gái')}</div>` : ''}
    <div class="tc-guest reveal">
      <p class="tc-lab">${esc(d.inviteText)}</p>
      <p class="tc-gname">${guest ? esc(guest.name) : 'Quý khách'}</p>
      <p class="tc-lab">tới dự buổi tiệc chung vui cùng gia đình chúng tôi</p>
    </div>
    <div class="tc-full reveal">
      <div><p class="r">Chú rể</p><p class="n">${esc(d.groom.fullName || d.groom.name)}</p></div>
      <i aria-hidden="true">&amp;</i>
      <div><p class="r">Cô dâu</p><p class="n">${esc(d.bride.fullName || d.bride.name)}</p></div>
    </div>
    ${d.message ? `<p class="tc-msg reveal">${esc(d.message)}</p>` : ''}
  </section>`;
    },

    // chuyện tình: chữ cái đầu lớn kiểu tạp chí + hai ảnh so le
    story(ctx) {
      const { d } = ctx;
      const a = pick(d, 2), b = pick(d, 3);
      const paras = (d.story || '').split(/\n+/).filter(Boolean);
      if (!paras.length && !d.photos.length) return '';
      return `
  <section class="sec tc-story">
    ${paras.length ? `<p class="tc-kicker reveal">Chuyện của chúng mình</p><div class="tc-col reveal">${paras.map((t) => `<p>${esc(t)}</p>`).join('')}</div>` : ''}
    ${d.photos.length ? `<div class="tc-pair">
      <figure class="reveal"><button class="ph" data-i="${2 % Math.max(1, d.photos.length)}" style="background-image:url('${esc(a)}')" aria-label="Xem ảnh"></button><figcaption>— Nắng</figcaption></figure>
      <figure class="reveal"><button class="ph" data-i="${3 % Math.max(1, d.photos.length)}" style="background-image:url('${esc(b)}')" aria-label="Xem ảnh"></button><figcaption>— Gió</figcaption></figure>
    </div>` : ''}
  </section>`;
    },

    // lịch tháng nổi trên ảnh lớn + đếm ngược số đỏ
    calendar(ctx, opts, h) {
      const p = ctx.dparts;
      const { show } = ctx.d;
      if (!p || (!show.calendar && !show.countdown)) return '';
      const ph = pick(ctx.d, 4);
      const u = (k, l) => `<span><b data-cd="${k}">0</b><small>${l}</small></span>`;
      return `
  <section class="sec tc-cal">
    ${show.calendar ? `<div class="tc-calwrap reveal" style="background-image:url('${esc(ph)}')">
      <div class="tc-calcard">${h.calGrid(ctx, `<p class="tc-calhead"><span>${p.y}</span><b>Tháng ${+p.m}</b></p>`)}</div>
    </div>` : ''}
    <p class="tc-quote sm reveal">Gặp nhau như một bài hát — hiểu nhau như soi gương — cùng nhau đến cuối trời.</p>
    ${show.countdown ? `<div class="tc-cd reveal" role="timer">${u('d', 'Ngày')}${u('h', 'Giờ')}${u('m', 'Phút')}${u('s', 'Giây')}</div>` : ''}
  </section>`;
    },

    // "Hôn lễ được tổ chức vào": giờ, thứ, tháng | ngày | năm, âm lịch
    when(ctx) {
      const p = ctx.dparts;
      if (!p) return '';
      return `
  <section class="sec tc-when reveal">
    <svg class="tc-bow" viewBox="0 0 120 80" aria-hidden="true"><path d="M60 26c-10-14-34-26-40-16-6 10 22 18 40 16zm0 0c10-14 34-26 40-16 6 10-22 18-40 16zm0 0c-6 12-16 34-26 50m26-50c6 12 16 34 26 50" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    <p class="tc-quote">Hôn lễ được tổ chức vào</p>
    <p class="tc-wtime">${ctx.time ? esc(ctx.time.replace(/^0/, '')) + ', ' : ''}${esc(ctx.weekday)}</p>
    <div class="tc-wrow"><span>Tháng ${p.m}</span><b>${p.d}</b><span>Năm ${p.y}</span></div>
    <p class="tc-wlunar">(${esc(ctx.lunar.replace(/^Nhằm /i, 'Tức '))})</p>
  </section>`;
    },

    // album: lưới so le như trang tạp chí, số thứ tự ảnh
    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      return `
  <section class="sec tc-gal">
    <p class="tc-happy reveal">Happy Wedding</p>
    <p class="tc-hsub reveal">Album ảnh cưới · ${ph.length} khoảnh khắc</p>
    <div class="tc-grid">
      ${ph.map((u, i) => `<figure class="reveal"><button class="ph" data-i="${i}" style="background-image:url('${esc(u)}')" aria-label="Xem ảnh ${i + 1}"></button><figcaption>${no(i)}</figcaption></figure>`).join('')}
    </div>
  </section>`;
    },

    thanks(ctx) {
      const ph = ctx.d.cover || pick(ctx.d, 0);
      return `
  <section class="tc-thanks">
    <div class="tc-timg reveal" style="background-image:url('${esc(ph)}')"></div>
    <div class="tc-tbody reveal">
      <p class="tc-ty">Thank you</p>
      <p>vì đã là một phần trong ngày hạnh phúc của chúng mình</p>
      <p class="tc-tnames">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
    </div>
  </section>`;
    },
  },

  css: `
.tpl-tapchi{font-size:17px}
.tpl-tapchi .card{background:var(--bg);color:var(--ink)}
.tpl-tapchi .sec{padding:64px 24px}

/* ---------- màn mở: bìa tạp chí lật sang trái ---------- */
.tc-opener{background:var(--tc-shade);perspective:1600px}
.tc-ocover{position:absolute;inset:0;max-width:480px;margin:0 auto;background:#222 center/cover no-repeat;color:#fff;display:flex;flex-direction:column;justify-content:space-between;transform-origin:left center;transition:transform 1.1s cubic-bezier(.6,.05,.3,1),box-shadow 1.1s;box-shadow:0 0 0 rgba(0,0,0,0)}
.tc-ocover::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.55),rgba(0,0,0,.05) 40%,rgba(0,0,0,.6))}
.tc-ocover>*{position:relative}
.tc-opener.opening .tc-ocover{transform:rotateY(-100deg);box-shadow:30px 0 60px rgba(0,0,0,.5)}
.tc-omast{display:grid;grid-template-columns:1fr 1fr;gap:8px 0;padding:22px 20px 0;font-family:'Be Vietnam Pro',sans-serif;font-size:10px;letter-spacing:.2em;text-transform:uppercase}
.tc-omast b{grid-column:1/-1;order:-1;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.6);text-align:center;font-family:var(--font-title);font-style:italic;font-weight:400;font-size:36px;line-height:1.1;letter-spacing:.01em;text-transform:none}
.tc-omast span:last-child{text-align:right}
.tc-obody{padding:0 24px 56px;text-align:center}
.tc-oto{margin:0 0 14px;font-size:15px;font-style:italic;opacity:.9}
.tc-oto b{display:block;font-style:normal;font-family:var(--font-title);font-weight:500;font-size:22px;margin-top:2px}
.tc-onames{margin:0 0 26px;font-family:var(--font-title);font-weight:400;font-size:44px;line-height:1.1}
.tc-onames i{display:block;font-size:26px;margin:4px 0;opacity:.8}
.tc-obtn{border:1px solid rgba(255,255,255,.8);background:rgba(255,255,255,.1);color:#fff;padding:12px 28px;font-family:'Be Vietnam Pro',sans-serif;font-size:12px;letter-spacing:.24em;text-transform:uppercase;backdrop-filter:blur(4px);animation:tcNudge 2.4s ease-in-out infinite}
@keyframes tcNudge{50%{transform:translateX(6px)}}

/* ---------- bìa ---------- */
.tc-cover{position:relative;height:100vh;height:100svh;min-height:600px;max-height:940px;overflow:hidden;color:#fff;text-align:center}
.tc-cimg{position:absolute;inset:0;background:center 70%/cover no-repeat;animation:tcZoom 18s ease-in-out infinite alternate}
@keyframes tcZoom{from{transform:scale(1.02)}to{transform:scale(1.12)}}
.tc-cover::before{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,color-mix(in srgb,var(--tc-shade) 82%,transparent) 0%,color-mix(in srgb,var(--tc-shade) 30%,transparent) 36%,transparent 58%)}
.tc-cover::after{content:"";position:absolute;left:0;right:0;bottom:0;height:34%;z-index:1;background:linear-gradient(180deg,transparent,color-mix(in srgb,var(--bg) 70%,transparent) 55%,var(--bg))}
.tc-cover>*:not(.tc-cimg){position:relative;z-index:2}
.tc-cbar{display:flex;justify-content:space-between;margin:0 18px;padding:16px 0 8px;border-bottom:1px solid rgba(255,255,255,.55);font-family:'Be Vietnam Pro',sans-serif;font-size:10px;letter-spacing:.24em;text-transform:uppercase}
.tc-big{margin:18px 0 0;font-family:var(--font-title);font-weight:400;line-height:.98;letter-spacing:.06em;text-transform:uppercase;text-shadow:0 2px 24px rgba(0,0,0,.25)}
.tc-big span{display:block;font-size:76px;animation:tcRise 1.2s cubic-bezier(.2,.7,.2,1) both}
.tc-big span:nth-child(2){animation-delay:.15s}
.tc-big span:nth-child(3){font-size:58px;letter-spacing:.04em;animation-delay:.3s}
@keyframes tcRise{from{opacity:0;transform:translateY(30px)}}
.tc-vert{position:absolute!important;right:6px;top:50%;margin:0;writing-mode:vertical-rl;transform:translateY(-50%) rotate(180deg);font-family:'Be Vietnam Pro',sans-serif;font-size:9px;letter-spacing:.3em;text-transform:uppercase;opacity:.85}
.tc-lines{position:absolute!important;left:18px;top:52%;margin:0;padding:0;list-style:none;text-align:left;font-family:var(--font-body);font-style:italic;font-size:15px;line-height:1.5;text-shadow:0 1px 8px rgba(0,0,0,.45)}
.tc-lines b{font-family:'Be Vietnam Pro',sans-serif;font-style:normal;font-weight:500;font-size:10px;letter-spacing:.1em;margin-right:6px;padding:1px 4px;border:1px solid rgba(255,255,255,.7)}
.tc-cfoot{position:absolute!important;left:0;right:0;bottom:30px;color:var(--ink)}
.tc-cdate{margin:0;font-family:var(--font-title);font-size:28px;letter-spacing:.08em}
.tc-cdate i{font-style:normal;color:var(--tc-red);margin:0 8px}
.tc-cnames{margin:2px 0 0;font-family:var(--font-body);font-size:22px;font-weight:500}
.tc-cnames i{font-style:italic;color:var(--muted)}

/* ---------- chữ chung ---------- */
.tc-h{margin:0 0 6px;font-family:var(--font-title);font-weight:400;font-size:30px;line-height:1.2;color:var(--accent)}
.tc-hsub{margin:0 0 28px;font-style:italic;color:var(--muted);font-size:16px}
.tc-kicker{margin:0 0 10px;font-family:'Be Vietnam Pro',sans-serif;font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--muted)}
.tc-quote{margin:0;font-family:var(--font-script);font-style:italic;font-size:26px;line-height:1.35;color:var(--ink)}
.tc-quote.sm{font-size:19px;max-width:300px;margin:34px auto 0;color:var(--muted)}
.tc-beat{margin:22px 0 30px;color:var(--tc-red)}
.tc-heart{width:30px;height:28px;animation:tcBeat 1.6s ease-in-out infinite}
@keyframes tcBeat{20%{transform:scale(1.18)}40%{transform:scale(1)}}
.tc-fig{margin:0 -4px}
.tc-fig figcaption,.tc-pair figcaption{margin-top:10px;font-style:italic;font-size:14px;color:var(--muted)}
.tpl-tapchi .ph{border-radius:0;display:block;width:100%;background-color:var(--line)}
.tc-fig .tc-land{aspect-ratio:3/2}
.tc-prose{margin:36px auto 0;max-width:340px;font-size:18px;line-height:1.65}
.tc-prose p{margin:0 0 10px}

/* ---------- lời mời: ảnh vòm ---------- */
.tc-invite{padding-top:30px!important}
.tc-arch{position:relative;margin:0 -6px}
.tc-curve{display:block;width:100%;margin-bottom:-6px;overflow:visible}
.tc-curve text{font-family:var(--font-title);font-size:27px;letter-spacing:.12em;text-transform:uppercase;fill:var(--ink)}
.tc-archimg{aspect-ratio:3/4;border-radius:999px 999px 0 0;background:center/cover no-repeat var(--line)}
.tc-band{position:absolute;left:-18px;right:-18px;bottom:16%;margin:0;padding:16px 10px;background:var(--tc-band);backdrop-filter:blur(2px);color:#fff;font-family:var(--font-title);font-size:20px;line-height:1.45;text-shadow:0 1px 6px rgba(0,0,0,.25)}
.tc-fams{display:grid;grid-template-columns:1fr auto 1fr;gap:14px;margin:44px 0 36px;font-size:16px;line-height:1.5}
.tc-fam p{margin:0}
.tc-fam .k{font-family:'Be Vietnam Pro',sans-serif;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--accent);margin-bottom:6px}
.tc-fam .a{font-style:italic;color:var(--muted);font-size:14px;margin-top:4px}
.tc-vr{width:1px;background:var(--line)}
.tc-lab{margin:0;font-style:italic;color:var(--muted);font-size:16px}
.tc-gname{margin:4px 0;font-family:var(--font-title);font-style:italic;font-size:30px;line-height:1.25;color:var(--accent)}
.tc-full{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:30px;padding:18px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.tc-full p{margin:0}
.tc-full .r{font-family:'Be Vietnam Pro',sans-serif;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--muted)}
.tc-full .n{font-family:var(--font-title);font-size:19px;line-height:1.3}
.tc-full i{font-family:var(--font-title);font-style:italic;font-size:30px;color:var(--tc-red)}
.tc-msg{margin:26px auto 0;max-width:330px;font-style:italic;color:var(--muted)}

/* ---------- chuyện tình ---------- */
.tc-col{text-align:left;font-size:18px;line-height:1.7}
.tc-col p{margin:0 0 12px}
.tc-col p:first-child::first-letter{float:left;font-family:var(--font-title);font-size:62px;line-height:.9;padding:6px 10px 0 0;color:var(--accent)}
.tc-pair{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:26px -10px 0}
.tc-pair figure{margin:0;text-align:left}
.tc-pair figure:nth-child(2){margin-top:46px;text-align:right}
.tc-pair .ph{aspect-ratio:2/3}

/* ---------- lịch trên ảnh ---------- */
.tc-cal{padding-left:14px!important;padding-right:14px!important}
.tc-calwrap{position:relative;aspect-ratio:3/4.2;background:center/cover no-repeat var(--line);display:flex;align-items:flex-end;justify-content:center;padding:0 0 20px}
.tc-calcard{width:84%;padding:14px 10px 10px;background:rgba(255,255,255,.62);backdrop-filter:blur(6px);color:#222}
.tc-calhead{display:flex;justify-content:space-between;align-items:baseline;margin:0 6px 8px;font-family:var(--font-title);color:var(--tc-red)}
.tc-calhead span{font-size:20px}
.tc-calhead b{font-weight:400;font-size:22px}
.tpl-tapchi .tc-calcard .cal{width:100%}
.tpl-tapchi .tc-calcard .cal-grid{row-gap:2px;font-family:'Be Vietnam Pro',sans-serif;font-size:13px}
.tpl-tapchi .tc-calcard .cal-grid span{height:28px}
.tpl-tapchi .tc-calcard .cal-w{background:var(--tc-red);color:#fff;opacity:1!important;font-size:10px;height:24px!important;margin-bottom:6px}
.tpl-tapchi .tc-calcard .cal-w:first-child{border-radius:999px 0 0 999px}
.tpl-tapchi .tc-calcard .cal-w:nth-child(7){border-radius:0 999px 999px 0}
.tpl-tapchi .s-cal,.tpl-tapchi .tc-cal{--cal-hi:var(--tc-red)}
.tpl-tapchi .tc-cal .cal-on::before{width:30px;height:28px}
.tc-cd{display:flex;justify-content:center;gap:28px;margin-top:30px;font-family:'Be Vietnam Pro',sans-serif;color:var(--tc-red)}
.tc-cd span{display:grid;justify-items:center;min-width:44px}
.tc-cd b{font-weight:500;font-size:24px;line-height:1.1;font-variant-numeric:tabular-nums}
.tc-cd small{font-size:11px;letter-spacing:.06em}

/* ---------- ngày giờ hôn lễ ---------- */
.tc-when{padding-top:36px!important}
.tc-bow{width:90px;height:60px;color:var(--tc-red);margin-bottom:18px;animation:tcSway 4s ease-in-out infinite;transform-origin:50% 30%}
@keyframes tcSway{50%{transform:rotate(-4deg)}}
.tc-wtime{margin:16px 0 8px;font-family:'Be Vietnam Pro',sans-serif;font-size:19px;letter-spacing:.06em;text-transform:uppercase}
.tc-wrow{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:14px;font-family:'Be Vietnam Pro',sans-serif;font-size:16px;text-transform:uppercase}
.tc-wrow span{padding:7px 0;border-top:1.5px solid var(--ink);border-bottom:1.5px solid var(--ink)}
.tc-wrow b{font-weight:400;font-size:52px;line-height:1}
.tc-wlunar{margin:10px 0 0;font-family:'Be Vietnam Pro',sans-serif;font-size:13px;text-transform:uppercase;color:var(--muted)}

/* ---------- lịch trình ---------- */
.tpl-tapchi .s-events{padding-top:20px}
.tpl-tapchi .tl-when b{font-family:'Be Vietnam Pro',sans-serif;font-weight:400;font-size:19px}
.tpl-tapchi .tl-body h3{font-family:var(--font-title);font-size:21px}
.tpl-tapchi .tl-place{font-size:17px}
.tpl-tapchi .tl-addr{font-size:15px;font-style:italic}
.tpl-tapchi .tl-act a,.tpl-tapchi .tl-map summary{font-family:'Be Vietnam Pro',sans-serif;font-size:12px;letter-spacing:.06em;color:var(--tc-red)}
.tpl-tapchi .tl-item::after{border-color:var(--tc-red)}
.tpl-tapchi .map{border-radius:0}

/* ---------- album so le ---------- */
.tc-happy{margin:0;font-family:var(--font-title);font-weight:400;font-size:34px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent)}
.tc-gal{padding-left:12px!important;padding-right:12px!important}
.tc-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;align-items:start}
.tc-grid figure{margin:0;position:relative}
.tc-grid figcaption{position:absolute;left:8px;bottom:6px;font-family:'Be Vietnam Pro',sans-serif;font-size:10px;letter-spacing:.2em;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.5);pointer-events:none}
.tc-grid figure:nth-child(5n+1){grid-column:1/-1}
.tc-grid figure:nth-child(5n+1) .ph{aspect-ratio:4/5}
.tc-grid figure:nth-child(5n+2){grid-column:span 3}
.tc-grid figure:nth-child(5n+3){grid-column:span 3;margin-top:44px}
.tc-grid figure:nth-child(5n+2) .ph,.tc-grid figure:nth-child(5n+3) .ph{aspect-ratio:2/3}
.tc-grid figure:nth-child(5n+4){grid-column:1/span 4}
.tc-grid figure:nth-child(5n+4) .ph{aspect-ratio:3/4}
.tc-grid figure:nth-child(5n){grid-column:5/span 2;align-self:end}
.tc-grid figure:nth-child(5n) .ph{aspect-ratio:1/2}
.tc-grid figure:last-child:nth-child(5n+2){grid-column:2/span 4}
.tc-grid figure:last-child:nth-child(5n+4){grid-column:2/span 4;margin-top:0}

/* ---------- biểu mẫu, mừng cưới, lưu bút ---------- */
.tpl-tapchi .s-rsvp,.tpl-tapchi .s-wishes,.tpl-tapchi .s-gift{padding-top:40px}
.tpl-tapchi .form{border-radius:0;border-color:var(--line);box-shadow:0 10px 30px rgba(0,0,0,.06);font-family:'Be Vietnam Pro',sans-serif}
.tpl-tapchi .form input:not([type=radio]),.tpl-tapchi .form select,.tpl-tapchi .form textarea,.tpl-tapchi .choice label{border-radius:2px}
.tpl-tapchi .btn{border-radius:2px;background:var(--tc-red);border-color:var(--tc-red);letter-spacing:.14em;text-transform:uppercase;font-size:12px;font-family:'Be Vietnam Pro',sans-serif}
.tpl-tapchi .form-msg{color:var(--tc-red)}
.tpl-tapchi .gift,.tpl-tapchi .wish{border-radius:0}
.tpl-tapchi .gift-who{font-style:italic}
.tpl-tapchi .wish b{color:var(--tc-red);font-family:'Be Vietnam Pro',sans-serif;font-weight:500}
.tpl-tapchi .wish p{font-size:17px}
.tpl-tapchi .gift-acc,.tpl-tapchi .gift-bank{font-family:'Be Vietnam Pro',sans-serif;font-size:15px}

/* ---------- cảm ơn ---------- */
.tc-thanks{position:relative;text-align:center}
.tc-timg{aspect-ratio:4/5;background:center/cover no-repeat var(--line);-webkit-mask:linear-gradient(180deg,#000 62%,transparent);mask:linear-gradient(180deg,#000 55%,transparent 92%)}
.tc-tbody{margin-top:-64px;padding:0 24px 28px;position:relative}
.tc-ty{margin:0 0 6px;font-family:var(--font-title);font-style:italic;font-size:50px;line-height:1.1;color:var(--accent)}
.tc-tbody p{margin:0;color:var(--muted);font-style:italic}
.tc-tnames{margin-top:16px!important;font-family:var(--font-title);font-style:normal!important;font-size:22px;color:var(--ink)!important}
.tpl-tapchi .credit{font-family:'Be Vietnam Pro',sans-serif}

@media (prefers-reduced-motion:reduce){.tpl-tapchi .tc-cimg,.tpl-tapchi .tc-big span,.tpl-tapchi .tc-heart,.tpl-tapchi .tc-bow,.tpl-tapchi .tc-obtn{animation:none}.tc-ocover{transition:none}}
`,
};
