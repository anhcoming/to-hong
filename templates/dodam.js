// Mẫu "Đỏ Đậm" — tối giản sang trọng: nền giấy kem, khối đỏ rượu vang, phong bì sáp niêm & hoa mẫu đơn.
const { esc } = require('../lib/util');

const A = (n) => `/demo/dodam-${n}.webp`; // ảnh trang trí của mẫu

const base = {
  '--font-title': "'Viaoda Libre','Cormorant Garamond',Georgia,serif",
  '--font-script': "'The Nautigal',cursive",
  '--font-body': "'Libre Baskerville',Baskerville,'Times New Roman',serif",
};

function partyEvent(d) {
  const evs = d.events.filter((e) => e.name || e.place);
  return evs.find((e) => /tiệc/i.test(e.name)) || evs[evs.length - 1] || null;
}

module.exports = {
  id: 'dodam',
  name: 'Đỏ Đậm',
  group: 'toigian',
  desc: 'Tối giản sang trọng: giấy kem, khối đỏ rượu vang, phong bì sáp niêm và hoa mẫu đơn',
  fonts: 'https://fonts.googleapis.com/css2?family=Viaoda+Libre&family=The+Nautigal:wght@400;700&family=Cormorant+Garamond:wght@500;600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:wght@400;600&display=swap',
  palettes: [
    { id: 'do-ruou', name: 'Đỏ rượu vang', swatch: ['#ece4d8', '#511419'], vars: { ...base, '--page': '#f7f3ee', '--bg': '#fff7eb', '--paper': '#f7f2ec', '--ink': '#511419', '--muted': '#8a6a66', '--accent': '#511419', '--accent-ink': '#ece4d8', '--gold': '#c9a24e', '--line': '#d9cbbd', '--dd-hi': '#6e1a20', '--dd-lo': '#380a0e', '--dd-cream': '#ece4d8' } },
    { id: 'xanh-reu', name: 'Xanh rêu', swatch: ['#ebe8dc', '#2f3d2c'], vars: { ...base, '--page': '#f3f3ee', '--bg': '#f8f6ee', '--paper': '#f3f1e9', '--ink': '#2f3d2c', '--muted': '#6f7a68', '--accent': '#2f3d2c', '--accent-ink': '#ebe8dc', '--gold': '#b89b5e', '--line': '#d4d3c3', '--dd-hi': '#3f5139', '--dd-lo': '#1d281b', '--dd-cream': '#ebe8dc' } },
  ],
  demo: {
    cover: '/demo/dodam-2.jpg',
    photos: [1, 3, 4, 5, 6, 7, 8].map((n) => `/demo/dodam-${n}.jpg`),
  },
  layout: ['invite', 'story', 'gallery', 'calendar', 'events', 'rsvp', 'wishes', 'gift', 'thanks'],

  title(text, sub) {
    return `<h2 class="sec-title">${esc(text)}</h2>${sub ? `<p class="sec-sub">${esc(sub)}</p>` : ''}`;
  },

  opener(ctx) {
    const p = ctx.dparts;
    return `
<div class="opener dd-opener" id="opener">
  <div class="dd-ocard">
    <img class="dd-fl tl" src="${A('flower2-decoration')}" alt="">
    <img class="dd-fl br" src="${A('flower2-decoration')}" alt="">
    <span class="dd-heart" aria-hidden="true">♥</span>
    <h1 class="dd-onames"><span>${esc(ctx.g)}</span><i>&amp;</i><span>${esc(ctx.b)}</span></h1>
    <p class="dd-rule" aria-hidden="true"><span></span>❦<span></span></p>
    ${p ? `<p class="dd-odate">${+p.d} tháng ${+p.m}, ${p.y}</p>` : ''}
    <p class="dd-oto">${ctx.guest ? `Thân mời ${esc(ctx.guest.name)}` : 'Thân Mời'}</p>
    <button class="dd-obtn" id="openBtn">Mở thiệp</button>
  </div>
</div>`;
  },

  cover(ctx) {
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="dd-cover">
  <img class="dd-castle" src="${A('castle-background')}" alt="">
  <p class="dd-std">Save the date</p>
  <div class="dd-env">
    <img class="dd-env-back" src="${A('envelope-background')}" alt="">
    ${photo ? `<div class="dd-env-photo"><img src="${esc(photo)}" alt="Ảnh cưới"></div>` : ''}
    <img class="dd-env-fl" src="${A('flower2-decoration')}" alt="">
    <img class="dd-env-front" src="${A('envelope-cover')}" alt="">
  </div>
  <h1 class="dd-names"><span>${esc(ctx.g)}</span><i aria-hidden="true">&amp;</i><span>${esc(ctx.b)}</span></h1>
</header>`;
  },

  sections: {
    // khung đỏ "Thông tin lễ cưới": bố mẹ hai bên, tên đầy đủ, nơi & giờ làm lễ
    invite(ctx) {
      const { d, dparts: p } = ctx;
      const fam = (x) => (x.father || x.mother) ? `
        <div class="dd-fam"><p class="k">Ông Bà</p>${x.father ? `<p class="n">${esc(x.father.replace(/^(Ông|Bà)\s+/i, ''))}</p>` : ''}${x.mother ? `<p class="n">${esc(x.mother.replace(/^(Ông|Bà)\s+/i, ''))}</p>` : ''}${x.address ? `<p class="a">${esc(x.address)}</p>` : ''}</div>` : '';
      const fams = fam(d.groom) + fam(d.bride);
      const party = partyEvent(d);
      const cer = d.events.find((e) => e !== party && (e.name || e.place)) || party;
      const time = cer && cer.time ? cer.time : d.time;
      return `
  <section class="sec dd-box dd-invite reveal">
    <img class="dd-side r" src="${A('flower2-decoration')}" alt="">
    <h2 class="dd-h">Thông tin lễ cưới</h2>
    ${fams ? `<div class="dd-fams">${fams}</div>` : ''}
    <p class="dd-lead">Trân trọng báo tin<br>lễ thành hôn của con chúng tôi</p>
    <p class="dd-full">${esc(d.groom.fullName || d.groom.name)}</p>
    <p class="dd-role">Chú rể</p>
    <p class="dd-amp">&amp;</p>
    <p class="dd-full">${esc(d.bride.fullName || d.bride.name)}</p>
    <p class="dd-role">Cô dâu</p>
    ${cer && cer.place ? `<p class="dd-lead">${esc(cer.name || 'Lễ thành hôn')} được cử hành tại<br>${esc(cer.place)}</p>` : ''}
    ${p ? `<div class="dd-when"><span>${time ? `Vào lúc ${esc(time)}` : ''}</span><span>${esc(ctx.weekday)}</span></div>
    <div class="dd-date"><b>${p.d}</b><span>Tháng ${p.m}<br>${p.y}</span></div>
    <p class="dd-lunar">(${esc(ctx.lunar)})</p>` : ''}
    <div class="dd-guest">
      <p class="k">${esc(d.inviteText)}</p>
      <p class="g">${ctx.guest ? esc(ctx.guest.name) : 'Quý khách'}</p>
      <p class="k">tới dự buổi tiệc chung vui cùng gia đình chúng tôi</p>
    </div>
    ${d.message ? `<p class="dd-msg">${esc(d.message)}</p>` : ''}
  </section>`;
    },

    // album dạng băng chuyền: kéo ngang, ảnh giữa nổi lên, chấm chỉ vị trí
    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      return `
  <section class="sec dd-album">
    <img class="dd-castle" src="${A('castle-background')}" alt="">
    <h2 class="dd-h">Album ảnh</h2>
    <div class="dd-strip">
      ${ph.map((u, i) => `<button class="ph" data-i="${i}" aria-label="Xem ảnh ${i + 1}"><img loading="lazy" src="${esc(u)}" alt=""></button>`).join('')}
    </div>
    <div class="dd-dots" aria-hidden="true">${ph.map((_, i) => `<i${i ? '' : ' class="on"'}></i>`).join('')}</div>
    <script>(function(){var s=document.currentScript.parentNode,t=s.querySelector('.dd-strip'),d=s.querySelectorAll('.dd-dots i');t.addEventListener('scroll',function(){var w=t.firstElementChild.offsetWidth+12,k=Math.round(t.scrollLeft/w);d.forEach(function(x,i){x.className=i===k?'on':''})},{passive:true})})()</script>
  </section>`;
    },

    // khung đỏ "Thông tin tiệc cưới": giờ, ngày, âm lịch, mốc đón khách / khai tiệc, lịch tháng
    calendar(ctx, opts, h) {
      const { d, dparts: p } = ctx;
      if (!p) return '';
      const party = partyEvent(d) || {};
      const time = party.time || d.time;
      const marks = d.events.filter((e) => e.time && (!e.date || e.date === ctx.date)).slice(-2);
      const grid = d.show.calendar ? h.calGrid(ctx, `<p class="dd-calh">Tháng ${+p.m} / ${p.y}</p>`) : '';
      const cal = h.calendarLink(`Đám cưới ${ctx.g} & ${ctx.b}`, ctx.date, time, party.address || party.place);
      return `
  <section class="sec dd-box dd-party reveal">
    <img class="dd-side l" src="${A('flower2-decoration')}" alt="">
    <h2 class="dd-h">Thông tin tiệc cưới</h2>
    <p class="dd-lead">${esc(party.name || 'Tiệc cưới')} sẽ diễn ra vào lúc:</p>
    <div class="dd-when"><span>${esc(time || '')}</span><span>${esc(ctx.weekday)}</span></div>
    <div class="dd-date"><b>${p.d}</b><span>Tháng ${p.m}<br>${p.y}</span></div>
    <p class="dd-lunar">(${esc(ctx.lunar)})</p>
    ${marks.length > 1 ? `<div class="dd-marks">${marks.map((e) => `<div><p class="k">${esc(e.name)}</p><p class="t">${esc(h.clock(e.time))}</p></div>`).join('')}</div>` : ''}
    ${grid}
    <a class="dd-link" target="_blank" rel="noopener" href="${esc(cal)}">Thêm vào lịch</a>
    ${d.show.rsvp ? '<a class="dd-pill" href="#rsvp">Xác nhận tham dự</a>' : ''}
  </section>`;
    },

    // nơi tổ chức tiệc (bản đồ) + lịch trình ngày cưới dạng dòng thời gian trong khung đỏ
    events(ctx, opts, h) {
      const evs = ctx.d.events.filter((e) => e.name || e.place);
      if (!evs.length) return '';
      const party = partyEvent(ctx.d);
      const icons = ['camera', 'cake', 'cook'];
      const dir = party && (party.mapUrl || (party.address ? h.mapSearch(party.address) : ''));
      return `
  ${party && (party.place || party.address) ? `
  <section class="sec dd-venue reveal">
    <h2 class="dd-h">${esc(party.name || 'Tiệc cưới')} sẽ tổ chức tại</h2>
    <p class="dd-addr">${esc([party.place, party.address].filter(Boolean).join(', '))}</p>
    ${party.address ? `<div class="dd-map"><iframe loading="lazy" title="Bản đồ" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(party.address)}&amp;output=embed"></iframe></div>` : ''}
    ${dir ? `<a class="dd-dir" target="_blank" rel="noopener" href="${esc(dir)}">➤ Chỉ đường</a>` : ''}
  </section>` : ''}
  <section class="sec dd-box dd-sched reveal">
    <img class="dd-side r" src="${A('flower2-decoration')}" alt="">
    <h2 class="dd-h">Lịch trình ngày cưới</h2>
    <ol class="dd-tl">
      ${evs.map((e, i) => {
        const p = h.parts(e.date);
        const other = p && e.date !== ctx.date;
        const ic = icons[i - 1];
        return `<li>${ic ? `<img class="ic" src="${A(ic)}" alt="">` : '<span class="ic"></span>'}<b>${esc(h.clock(e.time)) || '—'}</b><span class="dot"></span><div><p>${esc(e.name)}</p>${other ? `<small>${p.d}/${p.m}</small>` : ''}${e.place && e !== party ? `<small>${esc(e.place)}</small>` : ''}</div></li>`;
      }).join('')}
    </ol>
  </section>`;
    },

    // hộp quà mừng: hai phong bao đỏ, chạm để mở mã QR
    gift(ctx, opts, h) {
      if (!ctx.d.show.gift) return '';
      const html = h.giftCard(ctx, ctx.d.gifts.groom, 'groom') + h.giftCard(ctx, ctx.d.gifts.bride, 'bride');
      if (!html) return '';
      return `
  <section class="sec dd-giftbox reveal">
    <img class="dd-castle" src="${A('castle-background')}" alt="">
    <h2 class="dd-h">Hộp quà mừng</h2>
    <details class="dd-gift">
      <summary><span class="dd-envs"><img src="${A('envelope-gift')}" alt=""><img src="${A('envelope-gift')}" alt=""></span><span class="hint">Nhấn để mở</span></summary>
      <div class="gifts">${html}</div>
    </details>
  </section>`;
    },

    thanks(ctx) {
      return `
  <section class="sec dd-thanks reveal">
    <p>Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!</p>
    <p class="dd-tn">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
  </section>`;
    },
  },

  css: `
.tpl-dodam .card{background:url('${A('paper')}') center top/100% auto repeat-y,var(--bg);background-blend-mode:multiply;color:var(--ink);font-family:var(--font-body)}
.tpl-dodam .sec{padding:44px 24px}
.tpl-dodam .dd-castle{position:absolute;left:50%;top:0;width:170%;max-width:none;transform:translateX(-50%);opacity:.22;mix-blend-mode:multiply;pointer-events:none;-webkit-mask-image:linear-gradient(#000 55%,transparent);mask-image:linear-gradient(#000 55%,transparent)}
.tpl-dodam .dd-h,.tpl-dodam .sec-title{position:relative;margin:0 0 18px;font-family:'Times New Roman',Times,serif;font-weight:700;font-size:20px;letter-spacing:.03em;text-transform:uppercase;color:var(--ink)}
.tpl-dodam .sec-sub{position:relative;margin:-10px 0 20px;color:var(--muted);font-size:13px}

/* màn mở thiệp */
.tpl-dodam .dd-opener{background:linear-gradient(to bottom right,var(--dd-hi),var(--accent),var(--dd-lo));padding:20px}
.tpl-dodam .dd-ocard{position:relative;width:310px;max-width:100%;padding:112px 24px 56px;text-align:center;background:var(--paper);border-radius:8px;box-shadow:0 30px 60px rgba(0,0,0,.35);overflow:hidden}
.tpl-dodam .dd-fl{position:absolute;width:68px;pointer-events:none}
.tpl-dodam .dd-fl.tl{left:-4px;top:-6px;transform:rotate(-8deg)}
.tpl-dodam .dd-fl.br{right:-4px;bottom:-6px;transform:rotate(172deg)}
.tpl-dodam .dd-heart{position:absolute;left:50%;top:40px;width:56px;height:56px;margin-left:-28px;display:grid;place-items:center;border-radius:50%;background:radial-gradient(circle at 40% 35%,var(--dd-hi),var(--dd-lo));color:var(--paper);font-size:26px;box-shadow:0 10px 24px rgba(0,0,0,.3)}
.tpl-dodam .dd-onames{margin:0 0 8px;font-family:var(--font-title);font-weight:400;font-size:30px;line-height:1.1;color:var(--accent)}
.tpl-dodam .dd-onames span{display:block}
.tpl-dodam .dd-onames i{display:block;font-style:normal;font-size:18px;margin:2px 0}
.tpl-dodam .dd-rule{display:flex;align-items:center;justify-content:center;gap:10px;margin:14px 0;color:var(--accent);font-size:14px}
.tpl-dodam .dd-rule span{width:56px;height:1px;background:color-mix(in srgb,var(--accent) 45%,transparent)}
.tpl-dodam .dd-odate,.tpl-dodam .dd-oto{margin:0 0 22px;font-family:'Lora',serif;font-size:18px;color:color-mix(in srgb,var(--accent) 75%,transparent)}
.tpl-dodam .dd-obtn{padding:12px 38px;border:0;border-radius:999px;background:var(--accent);color:var(--paper);font-family:'Lora',serif;font-size:17px;font-weight:600;box-shadow:0 10px 22px rgba(0,0,0,.25)}

/* trang bìa: phong bì + ảnh */
.tpl-dodam .dd-cover{position:relative;padding:28px 24px 30px;text-align:center;overflow:hidden}
.tpl-dodam .dd-cover .dd-castle{top:150px}
.tpl-dodam .dd-std{position:relative;margin:0 0 32px;font-family:'Cormorant Garamond',serif;font-weight:600;font-size:15px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink)}
.tpl-dodam .dd-env{position:relative;width:248px;height:286px;margin:0 auto}
.tpl-dodam .dd-env-back{position:absolute;left:0;bottom:0;width:100%}
.tpl-dodam .dd-env-photo{position:absolute;left:69px;top:-14px;width:170px;height:214px;padding:8px 8px 22px;background:#fff;transform:rotate(6deg);box-shadow:0 6px 18px rgba(0,0,0,.2)}
.tpl-dodam .dd-env-photo img{width:100%;height:100%;object-fit:cover}
.tpl-dodam .dd-env-fl{position:absolute;left:-40px;top:-36px;width:150px;transform:rotate(-14deg)}
.tpl-dodam .dd-env-front{position:absolute;left:0;bottom:0;width:100%}
.tpl-dodam .dd-names{position:relative;margin:36px 0 0;font-family:var(--font-title);font-weight:400;font-size:40px;line-height:1.3;color:var(--ink)}
.tpl-dodam .dd-names span{position:relative;display:block}
.tpl-dodam .dd-names i{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-family:var(--font-script);font-style:normal;font-size:92px;color:color-mix(in srgb,var(--ink) 15%,transparent)}

/* khung đỏ */
.tpl-dodam .dd-box{margin:16px 20px;padding:36px 22px;border-radius:12px;background:var(--accent);color:var(--dd-cream);box-shadow:0 14px 30px rgba(0,0,0,.18)}
.tpl-dodam .dd-box .dd-h{color:var(--dd-cream);font-size:21px}
.tpl-dodam .dd-side{position:absolute;width:80px;pointer-events:none;z-index:1}
.tpl-dodam .dd-side.r{right:-34px;top:38%}
.tpl-dodam .dd-side.l{left:-34px;top:30%;transform:scaleX(-1)}
.tpl-dodam .dd-box p{margin:0}
.tpl-dodam .dd-fams{display:grid;grid-template-columns:1fr 1fr;margin:0 0 24px}
.tpl-dodam .dd-fam{padding:0 6px;font-size:12px}
.tpl-dodam .dd-fam+.dd-fam{border-left:1px solid color-mix(in srgb,var(--dd-cream) 35%,transparent)}
.tpl-dodam .dd-fam .k,.tpl-dodam .dd-fam .a{color:color-mix(in srgb,var(--dd-cream) 70%,transparent)}
.tpl-dodam .dd-fam .k{margin-bottom:4px}
.tpl-dodam .dd-fam .n{font-weight:700;line-height:1.7}
.tpl-dodam .dd-fam .a{margin-top:4px;font-size:10px}
.tpl-dodam .dd-lead{font-family:'Times New Roman',Times,serif;font-size:17px;line-height:1.35;text-transform:uppercase}
.tpl-dodam .dd-full{margin-top:30px!important;font-family:var(--font-title);font-size:31px;line-height:1.2}
.tpl-dodam .dd-role{margin-top:14px!important;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:color-mix(in srgb,var(--dd-cream) 70%,transparent)}
.tpl-dodam .dd-amp{margin:14px 0 -16px!important;font-family:var(--font-title);font-style:italic;font-size:34px}
.tpl-dodam .dd-full+.dd-role+.dd-lead,.tpl-dodam .dd-role+.dd-lead{margin-top:34px}
.tpl-dodam .dd-when{display:flex;justify-content:center;gap:40px;margin:22px 0 6px;font-size:13px;text-transform:uppercase;color:color-mix(in srgb,var(--dd-cream) 75%,transparent)}
.tpl-dodam .dd-date{display:flex;align-items:center;justify-content:center;gap:16px}
.tpl-dodam .dd-date b{padding-right:16px;border-right:1px solid color-mix(in srgb,var(--dd-cream) 50%,transparent);font-family:'Times New Roman',Times,serif;font-weight:300;font-size:40px;line-height:1.3}
.tpl-dodam .dd-date span{text-align:left;font-family:'Times New Roman',Times,serif;font-size:14px;line-height:2;text-transform:uppercase}
.tpl-dodam .dd-lunar{margin-top:8px!important;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:color-mix(in srgb,var(--dd-cream) 75%,transparent)}
.tpl-dodam .dd-guest{margin:28px 0 0;padding-top:22px;border-top:1px solid color-mix(in srgb,var(--dd-cream) 25%,transparent)}
.tpl-dodam .dd-guest .k{font-size:12px;color:color-mix(in srgb,var(--dd-cream) 75%,transparent)}
.tpl-dodam .dd-guest .g{margin:6px 0!important;font-family:var(--font-title);font-size:26px}
.tpl-dodam .dd-msg{margin-top:18px!important;font-style:italic;font-size:14px;color:color-mix(in srgb,var(--dd-cream) 80%,transparent)}

/* album */
.tpl-dodam .dd-album{overflow:hidden;padding-left:0;padding-right:0}
.tpl-dodam .dd-strip{position:relative;display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding:10px calc(50% - 105px) 18px;scrollbar-width:none}
.tpl-dodam .dd-strip::-webkit-scrollbar{display:none}
.tpl-dodam .dd-strip .ph{flex:0 0 210px;aspect-ratio:2/3;padding:0;border:0;border-radius:14px;overflow:hidden;background:var(--line);scroll-snap-align:center;box-shadow:0 10px 24px rgba(0,0,0,.18)}
.tpl-dodam .dd-strip .ph img{width:100%;height:100%;object-fit:cover}
.tpl-dodam .dd-dots{position:relative;display:flex;justify-content:center;gap:6px}
.tpl-dodam .dd-dots i{width:7px;height:7px;border-radius:9px;background:color-mix(in srgb,var(--ink) 25%,transparent);transition:width .3s}
.tpl-dodam .dd-dots i.on{width:22px;background:var(--ink)}

/* tiệc cưới + lịch */
.tpl-dodam .dd-party .dd-lead{font-size:16px}
.tpl-dodam .dd-marks{display:flex;justify-content:center;gap:34px;margin:24px 0 4px}
.tpl-dodam .dd-marks .k{font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:color-mix(in srgb,var(--dd-cream) 70%,transparent)}
.tpl-dodam .dd-marks .t{font-size:17px}
.tpl-dodam .dd-party .cal{margin:22px -6px 0;padding:8px 14px 16px;border-radius:10px;background:var(--dd-cream);color:var(--accent)}
.tpl-dodam .dd-calh{margin:4px 0 6px!important;padding-bottom:8px;border-bottom:2px solid var(--accent);font-family:var(--font-script);font-size:27px;font-weight:700}
.tpl-dodam .dd-party .cal-grid{font-family:'Times New Roman',serif;font-size:13px;color:var(--accent)}
.tpl-dodam .dd-party .cal-w{font-size:10px;color:var(--accent);opacity:.8}
.tpl-dodam .dd-party{--cal-hi:var(--accent);--cal-on:var(--dd-cream)}
.tpl-dodam .dd-link{display:inline-block;margin:20px 0 18px;font-family:'Times New Roman',serif;font-size:15px;color:var(--dd-cream);text-underline-offset:4px}
.tpl-dodam .dd-pill{display:table;margin:0 auto;padding:9px 26px;border-radius:999px;background:var(--dd-cream);color:var(--accent);font-size:14px;letter-spacing:.03em;text-transform:uppercase;text-decoration:none}

/* nơi tổ chức */
.tpl-dodam .dd-venue{padding-top:36px}
.tpl-dodam .dd-venue .dd-h{font-size:18px}
.tpl-dodam .dd-addr{position:relative;margin:0 auto 18px;max-width:300px;font-family:'Times New Roman',serif;font-size:14px;color:var(--muted)}
.tpl-dodam .dd-map{position:relative;aspect-ratio:1.25;border-radius:4px;overflow:hidden;background:var(--line)}
.tpl-dodam .dd-map iframe{width:100%;height:100%;border:0}
.tpl-dodam .dd-dir{position:relative;display:inline-block;margin-top:16px;font-family:'Times New Roman',serif;font-weight:700;font-size:15px;color:var(--ink);text-decoration:none}

/* lịch trình */
.tpl-dodam .dd-tl{position:relative;list-style:none;margin:8px 0 0;padding:0}
.tpl-dodam .dd-tl::before{content:"";position:absolute;left:calc(50% + 4px);top:12px;bottom:12px;width:1px;background:color-mix(in srgb,var(--dd-cream) 45%,transparent)}
.tpl-dodam .dd-tl li{display:grid;grid-template-columns:44px 1fr 18px 1fr;align-items:center;gap:10px;min-height:52px;margin-bottom:10px;text-align:left}
.tpl-dodam .dd-tl .ic{width:40px;height:40px;object-fit:contain}
.tpl-dodam .dd-tl b{text-align:center;font-family:'Times New Roman',serif;font-weight:400;font-size:17px}
.tpl-dodam .dd-tl .dot{position:relative;width:11px;height:11px;margin:0 auto;border-radius:50%;background:var(--dd-cream)}
.tpl-dodam .dd-tl p{font-family:'Times New Roman',serif;font-size:14px;color:color-mix(in srgb,var(--dd-cream) 85%,transparent)}
.tpl-dodam .dd-tl small{display:block;font-size:11px;color:color-mix(in srgb,var(--dd-cream) 60%,transparent)}

/* RSVP + lưu bút: thẻ giấy */
.tpl-dodam .s-rsvp,.tpl-dodam .s-wishes .form{background:var(--paper)}
.tpl-dodam .s-rsvp{margin:24px 20px;padding:34px 24px;border-radius:8px;box-shadow:0 12px 30px rgba(0,0,0,.12)}
.tpl-dodam .s-rsvp .form{padding:0;border:0;background:none}
.tpl-dodam .s-wishes .form{position:relative;border:0;padding:30px 24px 26px;border-radius:8px;box-shadow:0 12px 30px rgba(0,0,0,.12);text-align:left}
.tpl-dodam .form label{font-size:13px;color:var(--muted)}
.tpl-dodam .form input,.tpl-dodam .form select,.tpl-dodam .form textarea{border:1px solid var(--ink);border-radius:12px;background:transparent;color:var(--ink);font-family:'Times New Roman',serif}
.tpl-dodam .btn{background:var(--accent);border-color:var(--accent);color:var(--paper);font-family:'Times New Roman',serif;text-transform:uppercase;letter-spacing:.03em}
.tpl-dodam .wish-list{max-height:500px;overflow-y:auto;margin-top:30px;padding-right:6px;text-align:left}
.tpl-dodam .wish{margin-bottom:12px;padding:14px 16px;border:1px solid var(--line);border-radius:8px;background:rgba(255,255,255,.55)}
.tpl-dodam .wish b{color:var(--ink);font-family:'Times New Roman',serif;font-size:14px}
.tpl-dodam .wish p{margin:6px 0 0;font-family:'Times New Roman',serif;font-size:15px;color:var(--ink)}

/* hộp quà */
.tpl-dodam .dd-giftbox{overflow:hidden}
.tpl-dodam .dd-giftbox .dd-castle{top:40px}
.tpl-dodam .dd-gift summary{position:relative;list-style:none;cursor:pointer}
.tpl-dodam .dd-gift summary::-webkit-details-marker{display:none}
.tpl-dodam .dd-envs{display:flex;justify-content:center;align-items:flex-end;height:270px}
.tpl-dodam .dd-envs img{width:150px;filter:drop-shadow(0 12px 18px rgba(0,0,0,.25));transition:transform .5s}
.tpl-dodam .dd-envs img:first-child{transform:rotate(-12deg) translateX(14px)}
.tpl-dodam .dd-envs img:last-child{width:118px;transform:rotate(14deg) translate(-10px,-8px)}
.tpl-dodam .dd-gift[open] .dd-envs img:first-child{transform:rotate(-20deg) translateX(-10px)}
.tpl-dodam .dd-gift[open] .dd-envs img:last-child{transform:rotate(22deg) translateX(10px)}
.tpl-dodam .dd-gift .hint{display:block;margin-top:14px;font-family:system-ui,sans-serif;font-size:12px;font-weight:500;color:var(--ink)}
.tpl-dodam .dd-gift[open] .hint{display:none}
.tpl-dodam .dd-gift .gifts{position:relative;margin-top:24px}
.tpl-dodam .gift{background:var(--paper);border-color:var(--line)}

.tpl-dodam .dd-thanks{padding:20px 28px 34px}
.tpl-dodam .dd-thanks p{margin:0;font-family:'Times New Roman',serif;font-size:15px;color:var(--ink)}
.tpl-dodam .dd-thanks .dd-tn{margin-top:14px;font-family:var(--font-title);font-size:24px}
.tpl-dodam .s-story{font-family:'Times New Roman',serif;font-size:16px}
.tpl-dodam .credit{color:var(--muted)}

/* màn hình rộng (máy tính bảng, máy tính): cột 900px, các khối lớn hơn như bản gốc */
.tpl-dodam .card{max-width:900px;box-shadow:none}
@media (min-width:768px){
  .tpl-dodam .dd-ocard{width:600px;padding:96px 48px 48px}
  .tpl-dodam .dd-fl{width:96px}
  .tpl-dodam .dd-fl.br{top:-6px;bottom:auto;transform:scaleX(-1) rotate(-8deg)}
  .tpl-dodam .dd-heart{top:28px}
  .tpl-dodam .dd-onames{font-size:36px}
  .tpl-dodam .dd-castle{width:150%}
  .tpl-dodam .dd-cover{padding:56px 24px 48px}
  .tpl-dodam .dd-cover .dd-castle{top:220px}
  .tpl-dodam .dd-std{margin-bottom:56px;font-size:18px}
  .tpl-dodam .dd-env{width:420px;height:484px}
  .tpl-dodam .dd-env-photo{left:111px;top:-27px;width:324px;height:407px;padding:12px 12px 32px}
  .tpl-dodam .dd-env-fl{left:-66px;top:-83px;width:292px}
  .tpl-dodam .dd-names{margin-top:56px;font-size:58px}
  .tpl-dodam .dd-names i{font-size:150px}
  .tpl-dodam .dd-box{max-width:560px;margin:32px auto;padding:48px 40px}
  .tpl-dodam .dd-box .dd-h{font-size:24px}
  .tpl-dodam .dd-fam{font-size:13px}
  .tpl-dodam .dd-lead{font-size:20px}
  .tpl-dodam .dd-full{font-size:46px}
  .tpl-dodam .dd-amp{font-size:44px}
  .tpl-dodam .dd-date b{font-size:52px}
  .tpl-dodam .dd-side{width:180px}
  .tpl-dodam .dd-side.r{right:-140px;top:20%}
  .tpl-dodam .dd-side.l{left:-140px;top:30%}
  .tpl-dodam .dd-h{font-size:24px}
  .tpl-dodam .dd-strip{padding-left:calc(50% - 160px);padding-right:calc(50% - 160px);gap:20px}
  .tpl-dodam .dd-strip .ph{flex-basis:320px}
  .tpl-dodam .dd-venue,.tpl-dodam .s-wishes,.tpl-dodam .dd-thanks,.tpl-dodam .s-story{max-width:608px;margin-left:auto;margin-right:auto}
  .tpl-dodam .s-rsvp{max-width:560px;margin:32px auto}
  .tpl-dodam .dd-addr{max-width:420px}
  .tpl-dodam .dd-envs{height:380px}
  .tpl-dodam .dd-envs img{width:210px}
  .tpl-dodam .dd-envs img:last-child{width:165px}
  .tpl-dodam .dd-gift .gifts{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:620px;margin:24px auto 0}
}
`,
};
