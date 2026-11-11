// Mẫu "Ánh Đô" — ảnh cưới lớn trên nền trắng, các khối thông tin là dải màu đỏ đô chạy sát mép
// với chữ trắng, chữ dọc nhỏ dọc theo mép, thẻ treo đỏ có con dấu tên viết tắt.
const { esc } = require('../lib/util');

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
const photoAt = (ctx, i) => {
  const ph = ctx.d.photos;
  return ph.length ? ph[i % ph.length] : (ctx.d.cover || '');
};
const phIdx = (ctx, i) => i % Math.max(1, ctx.d.photos.length);
const tidy = (s) => (s || '').replace(/^Nhằm /i, 'Tức ');
// con dấu tròn hai vòng có chữ viết tắt hai người
const seal = (ctx, cls = '') => `<span class="ad-seal ${cls}"><svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="27" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="30" cy="30" r="22" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2 3"/></svg><b>${esc(ctx.initials)}</b></span>`;
const heart = `<svg viewBox="0 0 24 22" aria-hidden="true"><path fill="currentColor" d="M12 21.5C5 16.3 0 12 0 6.6 0 3 2.8 0 6.4 0 8.8 0 10.8 1.3 12 3.3 13.2 1.3 15.2 0 17.6 0 21.2 0 24 3 24 6.6 24 12 19 16.3 12 21.5z"/></svg>`;

module.exports = {
  id: 'anhdo',
  name: 'Ánh Đô',
  group: 'toigian',
  badge: 'Mới',
  desc: 'Ảnh cưới lớn trên nền trắng, dải đỏ đô chữ trắng chạy dọc mép thiệp',
  fonts: 'https://fonts.googleapis.com/css2?family=Prata&family=Great+Vibes&family=Quicksand:wght@400;500;600;700&display=swap',
  palettes: [
    { id: 'do-do', name: 'Đỏ đô', swatch: ['#ffffff', '#6e1518'], vars: { ...base, '--page': '#e9e5e2', '--bg': '#ffffff', '--paper': '#ffffff', '--ink': '#2b2324', '--muted': '#7f7476', '--accent': '#6e1518', '--accent-ink': '#ffffff', '--gold': '#e3b03a', '--line': '#ebe3e1', '--ad-soft': '#f6f1f0', '--ad-deep': '#4f0c0f' } },
    { id: 'xanh-dam', name: 'Xanh đậm', swatch: ['#ffffff', '#1d2d4f'], vars: { ...base, '--page': '#e4e7ec', '--bg': '#ffffff', '--paper': '#ffffff', '--ink': '#1f2633', '--muted': '#6f7686', '--accent': '#1d2d4f', '--accent-ink': '#ffffff', '--gold': '#dcb862', '--line': '#e1e5ec', '--ad-soft': '#f1f3f7', '--ad-deep': '#111c35' } },
  ],
  demo: {
    cover: '/demo/dodam-4.jpg',
    photos: ['/demo/dodam-2.jpg', '/demo/dodam-1.jpg', '/demo/dodam-8.jpg', '/demo/dodam-6.jpg', '/demo/dodam-7.jpg', '/demo/dodam-3.jpg', '/demo/dodam-5.jpg'],
  },
  layout: ['family', 'invite', 'events', 'calendar', 'letter', 'love', 'gallery', 'rsvp', 'gift', 'wishes', 'thanks'],

  title(text, sub) {
    return `<h2 class="ad-h">${esc(text)}</h2>${sub ? `<p class="ad-sub">${esc(sub)}</p>` : ''}`;
  },

  // thẻ treo đỏ đung đưa trên sợi dây; chạm để thẻ kéo lên mở thiệp
  opener(ctx) {
    return `
<div class="opener ad-opener" id="opener" data-open-ms="900">
  <div class="ad-hang">
    <span class="ad-string"></span>
    <div class="ad-tag">
      <i class="ad-hole"></i>
      <p class="ad-tag-k">Thư mời cưới</p>
      <p class="ad-tag-n">${esc(ctx.g)}<span>&amp;</span>${esc(ctx.b)}</p>
      ${seal(ctx)}
    </div>
  </div>
  <p class="ad-o-to">${ctx.guest ? `Thân mời<b>${esc(ctx.guest.name)}</b>` : 'Thân mời<b>Quý khách</b>'}</p>
  <button class="ad-o-btn" id="openBtn" type="button">Mở thiệp</button>
</div>`;
  },

  cover(ctx) {
    const { d, dparts: p } = ctx;
    const photo = d.cover || d.photos[0] || '';
    const evs = evList(d);
    const party = partyEvent(d);
    const cer = evs.find((e) => e !== party && /thành hôn/i.test(e.name)) || null;
    const line = (e, title) => {
      const date = e && e.date ? e.date : ctx.date;
      const pp = date ? date.split('-') : null;
      const wd = e && e.date && e.date !== ctx.date ? '' : ctx.weekday;
      return `<div class="ad-ci"><h2>${esc(title)}</h2><p>${esc(wd)}${e && e.time ? ` - ${esc(e.time)}` : ''}</p>${pp ? `<p>${pp[2]}.${pp[1]}.${pp[0]}</p>` : ''}</div>`;
    };
    return `
<header class="ad-cover">
  ${photo ? `<img class="ad-cimg" src="${esc(photo)}" alt="Ảnh cưới">` : ''}
  <div class="ad-cfade"></div>
  <div class="ad-band-v" aria-hidden="true"><span>Save the date${p ? ` · ${p.d}.${p.m}.${p.y}` : ''}</span></div>
  <h1 class="ad-cnames"><span>${esc(ctx.g)}</span><i>${heart}</i><span>${esc(ctx.b)}</span></h1>
  ${p ? `<div class="ad-cinfo">${line(party || { time: d.time }, 'Thư mời tiệc cưới')}${cer ? line(cer, cer.name) : ''}</div>` : ''}
</header>`;
  },

  sections: {
    // "Nhà có hỷ" chữ dọc + hai gia đình + thẻ treo đỏ có con dấu
    family(ctx) {
      const { d } = ctx;
      const fam = (x, label) => `<div class="ad-fam"><h3>${label}</h3>${x.father ? `<p>${esc(x.father)}</p>` : ''}${x.mother ? `<p>${esc(x.mother)}</p>` : ''}${x.address ? `<p class="a">${esc(x.address)}</p>` : ''}</div>`;
      if (!(d.groom.father || d.groom.mother || d.bride.father || d.bride.mother)) return '';
      return `
  <section class="ad-family reveal">
    <p class="ad-hy"><span>Nhà</span><span>Có</span><span>Hỷ</span></p>
    <div class="ad-fams">${fam(d.groom, 'Nhà Trai')}${fam(d.bride, 'Nhà Gái')}</div>
    <div class="ad-mini-tag" aria-hidden="true"><i class="ad-hole"></i>${seal(ctx, 'sm')}</div>
  </section>`;
    },

    invite(ctx) {
      const { d, guest } = ctx;
      const a = photoAt(ctx, 0);
      return `
  <section class="sec ad-invite reveal">
    <p class="ad-lead">Trân trọng báo tin lễ thành hôn của</p>
    <p class="ad-full">${esc(d.groom.fullName || d.groom.name || ctx.g)}</p>
    <p class="ad-amp">&amp;</p>
    <p class="ad-full">${esc(d.bride.fullName || d.bride.name || ctx.b)}</p>
    ${a ? `<button class="ph ad-ph ad-inv-ph" data-i="${phIdx(ctx, 0)}" aria-label="Xem ảnh"><img loading="lazy" src="${esc(a)}" alt=""></button>` : ''}
    <p class="ad-cap">${esc(d.inviteText)}</p>
    <p class="ad-guest">${guest ? esc(guest.name) : 'Quý khách'}</p>
    <p class="ad-cap2">tới dự buổi tiệc chung vui cùng gia đình chúng tôi</p>
  </section>`;
    },

    // mỗi nghi lễ là một dải đỏ chạy sát mép (lần lượt trái / phải), có chữ dọc số thứ tự
    events(ctx, opts, h) {
      const evs = evList(ctx.d);
      if (!evs.length) return '';
      return `
  <section class="ad-events">
    ${evs.map((e, i) => {
      const date = e.date || ctx.date;
      const p = h.parts(date);
      const dir = e.mapUrl || (e.address ? h.mapSearch(e.address) : '');
      return `
    <article class="ad-ev ${i % 2 ? 'r' : 'l'} reveal">
      <span class="ad-ev-no" aria-hidden="true">No.0${i + 1} — ${esc(e.name)}</span>
      <h3>${esc(e.name)}</h3>
      ${p ? `<p class="wd">${esc(h.weekday(date))}${e.time ? ` - ${esc(e.time)}` : ''}</p>
      <p class="dt">${p.d} . ${p.m} . ${p.y}</p>
      <p class="lu">${esc(tidy(h.lunarText(date)))}</p>` : ''}
      ${e.place ? `<p class="pl">Tại ${esc(e.place)}</p>` : ''}
      ${e.address ? `<p class="ad">${esc(e.address)}</p>` : ''}
      <p class="ac">
        ${dir ? `<a target="_blank" rel="noopener" href="${esc(dir)}">Xem chỉ đường</a>` : ''}
        ${date ? `<a class="o" target="_blank" rel="noopener" href="${esc(h.calendarLink(`${e.name} — Đám cưới ${ctx.g} & ${ctx.b}`, date, e.time, e.address || e.place))}">Lưu vào lịch</a>` : ''}
      </p>
    </article>`;
    }).join('')}
  </section>`;
    },

    // ngày lớn chia cột + dải tháng đỏ + lịch tháng
    calendar(ctx, opts, h) {
      const { d, dparts: p } = ctx;
      if (!p) return '';
      const party = partyEvent(d) || {};
      const time = party.time || d.time;
      return `
  <section class="ad-cal reveal">
    <p class="ad-k">Ngày chung đôi</p>
    <div class="ad-split"><span>Tháng ${p.m}</span><b>${p.d}</b><span>${p.y}</span></div>
    <p class="ad-cal-sub">${esc(ctx.weekday)}${time ? ` · ${esc(h.clock(time))}` : ''}</p>
    <p class="ad-cal-lu">${esc(tidy(ctx.lunar))}</p>
    ${d.show.calendar ? `<div class="ad-mband"><span>Tháng ${+p.m}</span></div>${h.calGrid(ctx, '')}` : ''}
  </section>`;
    },

    // thư mời trên nền ảnh lớn: khung trắng mờ, lời nhắn, đếm ngược bốn ô đỏ
    letter(ctx) {
      const { d } = ctx;
      const bg = photoAt(ctx, 1);
      const u = (k, l) => `<span><b data-cd="${k}">0</b><small>${l}</small></span>`;
      const text = d.story || d.message;
      return `
  <section class="ad-letter"${bg ? ` style="--ad-lbg:url('${esc(bg)}')"` : ''}>
    <div class="ad-lbox reveal">
      <p class="ad-inv">Invitation</p>
      <p class="ad-lnames">${esc(ctx.g)} - ${esc(ctx.b)}</p>
      ${text ? text.split(/\n+/).map((t) => `<p class="ad-ltext">${esc(t)}</p>`).join('') : ''}
      ${ctx.dparts && d.show.countdown ? `<div class="ad-cd" role="timer">${u('d', 'Ngày')}${u('h', 'Giờ')}${u('m', 'Phút')}${u('s', 'Giây')}</div>` : ''}
    </div>
  </section>`;
    },

    // Love — ảnh — You
    love(ctx) {
      const a = photoAt(ctx, 2);
      if (!a) return '';
      return `
  <section class="ad-love reveal">
    <p class="ad-lw l">Love</p>
    <button class="ph ad-ph" data-i="${phIdx(ctx, 2)}" aria-label="Xem ảnh"><img loading="lazy" src="${esc(a)}" alt=""></button>
    <p class="ad-lw r">You</p>
    <p class="ad-poem">Không cần những lời thật hoa mỹ,<br>chỉ cần mỗi ngày đều có nhau.</p>
  </section>`;
    },

    // album trên dải đỏ: ảnh lớn trượt ngang + hàng ảnh nhỏ bên dưới
    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      return `
  <section class="ad-album">
    <h2 class="ad-h w">Album ảnh cưới</h2>
    <div class="ad-stage">
      <div class="ad-track">
        ${ph.map((u, i) => `<button class="ph ad-slide" data-i="${i}" aria-label="Xem ảnh ${i + 1}"><img loading="lazy" src="${esc(u)}" alt=""></button>`).join('')}
      </div>
      <button class="ad-nav prev" type="button" aria-label="Ảnh trước">‹</button>
      <button class="ad-nav next" type="button" aria-label="Ảnh sau">›</button>
    </div>
    <div class="ad-thumbs">
      ${ph.map((u, i) => `<button type="button" class="${i ? '' : 'on'}" aria-label="Ảnh ${i + 1}" style="background-image:url('${esc(u)}')"></button>`).join('')}
    </div>
    <script>(function(){
      var s=document.currentScript.parentNode,tr=s.querySelector('.ad-track'),th=[].slice.call(s.querySelectorAll('.ad-thumbs button')),n=th.length;
      function cur(){return Math.round(tr.scrollLeft/tr.clientWidth);}
      function go(i){i=(i+n)%n;tr.scrollTo({left:i*tr.clientWidth,behavior:'smooth'});}
      tr.addEventListener('scroll',function(){var k=cur();th.forEach(function(b,j){b.className=j===k?'on':'';});},{passive:true});
      th.forEach(function(b,j){b.onclick=function(){go(j)};});
      s.querySelector('.prev').onclick=function(){go(cur()-1)};s.querySelector('.next').onclick=function(){go(cur()+1)};
    })()</script>
  </section>`;
    },

    // ảnh lớn tràn mép, khung xác nhận đè lên phần dưới ảnh
    rsvp(ctx, opts, h) {
      const html = h.rsvp(ctx);
      if (!html) return '';
      const bg = photoAt(ctx, 3);
      return `
  <div class="ad-rsvp-wrap">
    ${bg ? `<div class="ad-rsvp-bg"><img loading="lazy" src="${esc(bg)}" alt=""></div>` : ''}
    ${html}
  </div>`;
    },

    gift(ctx, opts, h) {
      if (!ctx.d.show.gift) return '';
      const html = h.giftCard(ctx, ctx.d.gifts.groom, 'groom') + h.giftCard(ctx, ctx.d.gifts.bride, 'bride');
      if (!html) return '';
      return `
  <section class="sec ad-gift reveal">
    <h2 class="ad-gh">Gửi quà mừng tới Cô dâu – Chú rể</h2>
    <div class="gifts">${html}</div>
  </section>`;
    },

    thanks(ctx) {
      return `
  <section class="ad-thanks reveal">
    <span class="ad-tv" aria-hidden="true">With love · ${esc(ctx.initials)}</span>
    <p class="ad-ty">Thank you</p>
    <p>${esc(ctx.d.message || 'Cảm ơn bạn đã là một phần trong ngày hạnh phúc của chúng mình')}</p>
    <p class="ad-tn">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
    ${seal(ctx, 'w')}
  </section>`;
    },
  },

  css: `
.tpl-anhdo{background:var(--page)}
.tpl-anhdo .card{background:var(--bg);color:var(--ink);box-shadow:0 0 40px rgba(0,0,0,.12)}
.tpl-anhdo .sec{padding:56px 24px}
.tpl-anhdo .ad-h{margin:0 0 6px;font-family:var(--font-title);font-weight:400;font-size:26px;line-height:1.3;text-transform:uppercase;letter-spacing:.04em;color:var(--accent)}
.tpl-anhdo .ad-h.w{color:var(--accent-ink)}
.tpl-anhdo .ad-sub{margin:0 0 26px;font-size:14px;color:var(--muted)}
.tpl-anhdo .ad-ph{grid-column:auto;aspect-ratio:auto;display:block;width:100%;border:0;padding:0;border-radius:0;background:var(--line);overflow:hidden}
.tpl-anhdo .ad-ph img{width:100%;height:100%;object-fit:cover}

/* ---- con dấu ---- */
.tpl-anhdo .ad-seal{position:relative;display:grid;place-items:center;width:60px;height:60px;color:#fff}
.tpl-anhdo .ad-seal svg{position:absolute;inset:0}
.tpl-anhdo .ad-seal b{position:relative;font-family:var(--font-title);font-weight:400;font-size:15px;letter-spacing:.02em}
.tpl-anhdo .ad-seal.sm{width:44px;height:44px}.tpl-anhdo .ad-seal.sm b{font-size:11px}
.tpl-anhdo .ad-hole{display:block;width:14px;height:14px;border-radius:50%;background:var(--bg);box-shadow:inset 0 1px 3px rgba(0,0,0,.4)}

/* ---- màn mở thiệp: thẻ treo ---- */
.tpl-anhdo .ad-opener{background:linear-gradient(#fff,var(--ad-soft));display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:0 24px 40px;cursor:pointer;overflow:hidden}
.tpl-anhdo .ad-hang{display:flex;flex-direction:column;align-items:center;transform-origin:50% 0;animation:adSwing 3.6s ease-in-out infinite;transition:transform .9s cubic-bezier(.6,-.2,.7,1)}
.tpl-anhdo .ad-string{width:1px;height:5vh;background:var(--muted)}
.tpl-anhdo .ad-tag{display:flex;flex-direction:column;align-items:center;gap:12px;width:132px;padding:16px 0 22px;background:var(--accent);color:var(--accent-ink);box-shadow:0 18px 30px -12px rgba(0,0,0,.4)}
.tpl-anhdo .ad-tag .ad-hole{background:#fff}
.tpl-anhdo .ad-tag-k{margin:0;writing-mode:vertical-rl;font-family:var(--font-title);font-size:15px;letter-spacing:.32em;text-transform:uppercase}
.tpl-anhdo .ad-tag-n{margin:0;display:flex;flex-direction:column;align-items:center;font-family:var(--font-script);font-size:30px;line-height:1.1;text-align:center;padding:0 6px}
.tpl-anhdo .ad-tag-n span{font-size:22px;color:var(--gold)}
.tpl-anhdo .ad-o-to{margin:26px 0 14px;text-align:center;font-size:15px;letter-spacing:.06em;color:var(--muted)}
.tpl-anhdo .ad-o-to b{display:block;margin-top:4px;font-family:var(--font-title);font-weight:400;font-size:24px;letter-spacing:0;color:var(--accent)}
.tpl-anhdo .ad-o-btn{padding:10px 30px;border:0;background:var(--accent);color:var(--accent-ink);font-family:var(--font-body);font-weight:600;font-size:14px;letter-spacing:.14em;text-transform:uppercase}
.tpl-anhdo .ad-opener.opening .ad-hang{animation:none;transform:translateY(-110vh)}
@keyframes adSwing{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}

/* ---- bìa ---- */
.tpl-anhdo .ad-cover{position:relative;height:100svh;min-height:600px;max-height:900px;overflow:hidden;background:#f2f1ef}
.tpl-anhdo .ad-cimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 12%;animation:adZoom 12s ease-out both}
.tpl-anhdo .ad-cfade{position:absolute;left:0;right:0;bottom:0;height:46%;background:linear-gradient(to bottom,transparent,rgba(255,255,255,.55) 45%,rgba(255,255,255,.92))}
.tpl-anhdo .ad-band-v{position:absolute;left:0;top:0;bottom:0;width:34px;display:flex;align-items:center;justify-content:center;background:var(--accent);color:var(--accent-ink)}
.tpl-anhdo .ad-band-v span{writing-mode:vertical-rl;transform:rotate(180deg);font-size:11px;font-weight:600;letter-spacing:.42em;text-transform:uppercase;white-space:nowrap}
.tpl-anhdo .ad-cnames{position:absolute;right:20px;top:34px;margin:0;display:flex;flex-direction:column;align-items:center;font-family:var(--font-script);font-weight:400;font-size:38px;line-height:1.05;color:var(--accent);text-shadow:0 0 14px rgba(255,255,255,.9);animation:adIn 1.2s .3s ease both}
.tpl-anhdo .ad-cnames i{display:block;width:18px;margin:6px 0;color:var(--accent);animation:adBeat 1.6s ease-in-out infinite}
.tpl-anhdo .ad-cinfo{position:absolute;right:18px;bottom:28px;width:min(250px,64%);text-align:center;color:var(--accent);animation:adIn 1.2s .6s ease both}
.tpl-anhdo .ad-ci{padding:10px 0;border-top:2px solid color-mix(in srgb,var(--accent) 55%,transparent)}
.tpl-anhdo .ad-ci h2{margin:0 0 2px;font-family:var(--font-title);font-weight:400;font-size:18px;line-height:1.3;text-transform:uppercase;letter-spacing:.02em}
.tpl-anhdo .ad-ci p{margin:0;font-size:16px;font-weight:500;letter-spacing:.06em;color:var(--ink)}
.tpl-anhdo .ad-ci p:first-of-type{text-transform:uppercase;font-size:14px;color:var(--muted)}
@keyframes adZoom{from{transform:scale(1.07)}to{transform:scale(1)}}
@keyframes adIn{from{opacity:0;transform:translateY(12px)}}
@keyframes adBeat{50%{transform:scale(1.2)}}

/* ---- nhà có hỷ ---- */
.tpl-anhdo .ad-family{position:relative;display:grid;grid-template-columns:52px 1fr 64px;gap:12px;padding:40px 20px 40px 14px;align-items:start}
.tpl-anhdo .ad-hy{margin:0;display:flex;flex-direction:column;align-items:center;font-family:var(--font-script);font-size:34px;line-height:1.05;color:var(--accent)}
.tpl-anhdo .ad-fams{display:grid;gap:22px;margin-top:40px;padding-left:12px;border-left:3px solid #8f8a8b}
.tpl-anhdo .ad-fam h3{margin:0 0 6px;font-family:var(--font-body);font-weight:500;font-size:22px;color:var(--ink)}
.tpl-anhdo .ad-fam p{margin:0;font-size:15px;line-height:1.7}
.tpl-anhdo .ad-fam .a{font-size:12px;color:var(--muted)}
.tpl-anhdo .ad-mini-tag{display:flex;flex-direction:column;align-items:center;justify-content:space-between;height:280px;margin-top:56px;padding:14px 0;background:var(--accent);box-shadow:0 12px 22px -12px rgba(0,0,0,.45);transform-origin:50% 0;animation:adSwing 4.2s ease-in-out infinite}

/* ---- lời mời ---- */
.tpl-anhdo .ad-invite{padding-top:30px}
.tpl-anhdo .ad-lead{margin:0 0 12px;font-family:var(--font-title);font-size:16px;color:var(--ink)}
.tpl-anhdo .ad-full{margin:0;font-family:var(--font-title);font-size:27px;line-height:1.35;color:var(--accent)}
.tpl-anhdo .ad-amp{margin:0;font-family:var(--font-title);font-size:26px;line-height:1.3;color:var(--accent)}
.tpl-anhdo .ad-inv-ph{width:88%;margin:28px auto 12px;aspect-ratio:4/5}
.tpl-anhdo .ad-cap{margin:0;font-family:var(--font-title);font-size:15px;color:var(--ink)}
.tpl-anhdo .ad-guest{margin:4px 0;font-family:var(--font-script);font-size:40px;line-height:1.25;color:var(--accent)}
.tpl-anhdo .ad-cap2{margin:0;font-size:14px;color:var(--muted)}

/* ---- dải sự kiện ---- */
.tpl-anhdo .ad-events{display:grid;gap:20px;padding:8px 0 20px}
.tpl-anhdo .ad-ev{position:relative;padding:30px 44px 28px;background:var(--accent);color:var(--accent-ink);text-align:center;box-shadow:0 14px 24px -16px rgba(0,0,0,.5)}
.tpl-anhdo .ad-ev.l{margin-right:24px;padding-left:48px}
.tpl-anhdo .ad-ev.r{margin-left:24px;padding-right:48px}
.tpl-anhdo .ad-ev-no{position:absolute;top:0;bottom:0;display:flex;align-items:center;writing-mode:vertical-rl;font-size:10px;font-weight:600;letter-spacing:.3em;text-transform:uppercase;opacity:.6;white-space:nowrap;overflow:hidden}
.tpl-anhdo .ad-ev.l .ad-ev-no{left:14px;transform:rotate(180deg)}
.tpl-anhdo .ad-ev.r .ad-ev-no{right:14px}
.tpl-anhdo .ad-ev h3{margin:0;font-family:var(--font-title);font-weight:400;font-size:24px;line-height:1.3;text-transform:uppercase}
.tpl-anhdo .ad-ev p{margin:0}
.tpl-anhdo .ad-ev .wd{font-size:15px;letter-spacing:.08em;text-transform:uppercase;opacity:.9}
.tpl-anhdo .ad-ev .dt{margin:6px 0 2px;font-family:var(--font-title);font-size:34px;line-height:1.15;color:var(--gold)}
.tpl-anhdo .ad-ev .lu{font-size:13px;opacity:.85}
.tpl-anhdo .ad-ev .pl{margin-top:14px;font-family:var(--font-title);font-size:20px;line-height:1.35;text-transform:uppercase}
.tpl-anhdo .ad-ev .ad{margin-top:4px;font-size:14px;opacity:.85}
.tpl-anhdo .ad-ev .ac{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:18px}
.tpl-anhdo .ad-ev .ac a{padding:8px 18px;background:#fff;color:var(--accent);font-family:var(--font-title);font-size:14px;text-decoration:none}
.tpl-anhdo .ad-ev .ac a.o{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.6)}

/* ---- lịch ---- */
.tpl-anhdo .ad-cal{padding:40px 0 30px;text-align:center}
.tpl-anhdo .ad-k{margin:0 0 6px;font-family:var(--font-title);font-size:24px;text-transform:uppercase;color:var(--ink)}
.tpl-anhdo .ad-split{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:0;width:min(340px,90%);margin:0 auto}
.tpl-anhdo .ad-split span{white-space:nowrap;font-family:var(--font-title);font-size:22px;color:var(--ink)}
.tpl-anhdo .ad-split b{padding:0 18px;font-family:var(--font-title);font-weight:400;font-size:64px;line-height:1.1;color:var(--accent);border-left:2px solid var(--ink);border-right:2px solid var(--ink)}
.tpl-anhdo .ad-cal-sub{margin:10px 0 0;font-size:16px;font-weight:600;text-transform:uppercase;letter-spacing:.06em}
.tpl-anhdo .ad-cal-lu{margin:2px 0 28px;font-size:14px;color:var(--muted)}
.tpl-anhdo .ad-mband{display:flex;justify-content:flex-end;padding:6px 24px 4px;background:var(--accent);color:#fff;font-family:var(--font-script);font-size:38px;line-height:1.2}
.tpl-anhdo .ad-cal .cal{width:auto;margin:18px 22px 0;--cal-hi:var(--accent)}
.tpl-anhdo .ad-cal .cal-grid{row-gap:14px;font-size:17px}
.tpl-anhdo .ad-cal .cal-grid .cal-w{font-family:var(--font-title);color:var(--accent);opacity:1}

/* ---- thư mời trên ảnh ---- */
.tpl-anhdo .ad-letter{position:relative;min-height:760px;display:flex;align-items:flex-end;padding:380px 20px 26px;background:var(--ad-lbg,var(--ad-soft)) center 20%/cover}
.tpl-anhdo .ad-letter::before{content:"";position:absolute;inset:0;background:linear-gradient(var(--bg),transparent 22%,transparent 60%,rgba(0,0,0,.15))}
.tpl-anhdo .ad-lbox{position:relative;width:100%;padding:26px 18px 22px;text-align:center;background:rgba(255,255,255,.8);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}
.tpl-anhdo .ad-inv{margin:0;font-family:var(--font-title);font-size:26px;letter-spacing:.32em;text-transform:uppercase;color:var(--ink)}
.tpl-anhdo .ad-lnames{margin:0 0 12px;font-family:var(--font-script);font-size:32px;color:var(--accent)}
.tpl-anhdo .ad-ltext{margin:0 0 6px;font-size:15px;line-height:1.85;color:var(--ink)}
.tpl-anhdo .ad-cd{display:flex;justify-content:center;gap:10px;margin-top:18px;font-variant-numeric:tabular-nums}
.tpl-anhdo .ad-cd span{display:flex;flex-direction:column;align-items:center;width:62px;padding:8px 0;border-radius:8px;background:var(--accent);color:#fff}
.tpl-anhdo .ad-cd b{font-size:24px;font-weight:600;line-height:1.2}
.tpl-anhdo .ad-cd small{font-size:12px}

/* ---- Love / You ---- */
.tpl-anhdo .ad-love{padding:56px 18px 40px;text-align:center}
.tpl-anhdo .ad-lw{margin:0;font-family:var(--font-title);font-size:34px;line-height:1.2;color:var(--accent);text-align:left}
.tpl-anhdo .ad-lw.r{text-align:right}
.tpl-anhdo .ad-love .ad-ph{aspect-ratio:4/3;margin:6px 0}
.tpl-anhdo .ad-poem{margin:20px 0 0;font-size:17px;line-height:1.8}

/* ---- album ---- */
.tpl-anhdo .ad-album{padding:36px 18px 28px;background:var(--accent);text-align:center}
.tpl-anhdo .ad-stage{position:relative;margin-top:16px}
.tpl-anhdo .ad-track{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;border-radius:16px;background:#f3f1f1}
.tpl-anhdo .ad-track::-webkit-scrollbar{display:none}
.tpl-anhdo .ad-slide{grid-column:auto;flex:0 0 100%;aspect-ratio:4/5;scroll-snap-align:center;border:0;padding:0;border-radius:0;background:transparent}
.tpl-anhdo .ad-slide img{width:100%;height:100%;object-fit:contain}
.tpl-anhdo .ad-nav{position:absolute;top:50%;width:44px;height:44px;margin-top:-22px;border:0;border-radius:50%;background:#fff;color:var(--ink);font-size:28px;line-height:1;box-shadow:0 6px 14px rgba(0,0,0,.18)}
.tpl-anhdo .ad-nav.prev{left:10px}.tpl-anhdo .ad-nav.next{right:10px}
.tpl-anhdo .ad-thumbs{display:flex;gap:8px;margin-top:14px;overflow-x:auto;scrollbar-width:none}
.tpl-anhdo .ad-thumbs button{flex:0 0 22%;aspect-ratio:1;border:2px solid transparent;border-radius:8px;background:center/cover;opacity:.7;transition:opacity .3s,border-color .3s}
.tpl-anhdo .ad-thumbs button.on{opacity:1;border-color:#fff}

/* ---- xác nhận ---- */
.tpl-anhdo .ad-rsvp-wrap{position:relative}
.tpl-anhdo .ad-rsvp-bg{height:560px;overflow:hidden}
.tpl-anhdo .ad-rsvp-bg img{width:100%;height:100%;object-fit:cover;object-position:50% 15%}
.tpl-anhdo .ad-rsvp-wrap .s-rsvp{margin:-220px 20px 0;padding:28px 18px 24px;background:#fff;box-shadow:0 18px 40px -14px rgba(0,0,0,.35)}
.tpl-anhdo .s-rsvp .ad-h{font-size:22px}
.tpl-anhdo .form{border:0;padding:0;border-radius:0;background:transparent}
.tpl-anhdo .form input:not([type=radio]),.tpl-anhdo .form select,.tpl-anhdo .form textarea,.tpl-anhdo .choice label{border-radius:4px;background:#fff}
.tpl-anhdo .btn{border-radius:4px;font-family:var(--font-body);letter-spacing:.1em;text-transform:uppercase}

/* ---- quà mừng ---- */
.tpl-anhdo .ad-gh{margin:0 0 26px;font-family:var(--font-title);font-weight:400;font-size:24px;line-height:1.35;color:var(--ink)}
.tpl-anhdo .gift{border-radius:0;border:0;border-top:4px solid var(--accent);background:var(--ad-soft)}
.tpl-anhdo .gift-who{font-family:var(--font-title);text-transform:uppercase;font-size:16px;letter-spacing:.06em}
.tpl-anhdo .copy{border-radius:4px}

/* ---- lưu bút ---- */
.tpl-anhdo .s-wishes{background:var(--ad-soft)}
.tpl-anhdo .s-wishes .form{padding:0}
.tpl-anhdo .wish{border:0;border-left:3px solid var(--accent);border-radius:0;background:#fff}

/* ---- cảm ơn ---- */
.tpl-anhdo .ad-thanks{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;padding:52px 40px 44px;background:var(--accent);color:#fff;text-align:center}
.tpl-anhdo .ad-tv{position:absolute;left:12px;top:0;bottom:0;display:flex;align-items:center;writing-mode:vertical-rl;transform:rotate(180deg);font-size:10px;letter-spacing:.24em;text-transform:uppercase;opacity:.55;white-space:nowrap}
.tpl-anhdo .ad-thanks .ad-ty{margin:0 0 8px;opacity:1;font-family:var(--font-script);font-size:58px;line-height:1.1}
.tpl-anhdo .ad-thanks p{margin:0;font-size:15px;opacity:.92}
.tpl-anhdo .ad-tn{margin:16px 0 18px!important;font-family:var(--font-title);font-size:22px;opacity:1!important}
.tpl-anhdo .credit{background:var(--accent);color:rgba(255,255,255,.75)}

@media (prefers-reduced-motion:reduce){
  .tpl-anhdo .ad-hang,.tpl-anhdo .ad-mini-tag,.tpl-anhdo .ad-cimg,.tpl-anhdo .ad-cnames,.tpl-anhdo .ad-cnames i,.tpl-anhdo .ad-cinfo{animation:none}
}
`,
};
