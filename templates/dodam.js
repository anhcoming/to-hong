// Mẫu "Đỏ Đậm" — tối giản sang trọng: nền giấy kem, khối đỏ rượu vang, phong bì sáp niêm & hoa mẫu đơn.
// Kích thước lấy theo bản gốc (Tailwind): số đầu cho điện thoại, khối @media (min-width:768px) cho màn rộng.
const { esc } = require('../lib/util');

const A = (n) => `/demo/dodam-${n}.webp`; // ảnh trang trí của mẫu

const base = {
  '--font-title': "'Viaoda Libre','Cormorant Garamond',Georgia,serif",
  '--font-script': "'The Nautigal',cursive",
  '--font-body': "Baskerville,'Libre Baskerville','Times New Roman',serif", // Baskerville có sẵn trên máy Apple như bản gốc
};

const evList = (d) => d.events.filter((e) => e.name || e.place);
// sự kiện chính của tiệc (khung "Thông tin tiệc cưới", bản đồ) và mốc ngay trước nó (đón khách)
function partyEvent(d) {
  const evs = evList(d);
  return evs.find((e) => /khai tiệc|tiệc cưới/i.test(e.name)) || evs.find((e) => /tiệc/i.test(e.name)) || evs[evs.length - 1] || null;
}

// ngày | tháng-năm trong khung đỏ (giống nhau ở lời mời và tiệc cưới, cỡ chữ khác nhau qua CSS)
const dateRow = (p) => `<div class="dd-date"><b>${p.d}</b><i></i><span><em>Tháng ${p.m}</em><em>${p.y}</em></span></div>`;

module.exports = {
  id: 'dodam',
  name: 'Đỏ Đậm',
  group: 'toigian',
  badge: 'Hot', // nhãn trên thẻ ở bộ sưu tập trang chủ
  desc: 'Tối giản sang trọng: giấy kem, khối đỏ rượu vang, phong bì sáp niêm và hoa mẫu đơn',
  fonts: 'https://fonts.googleapis.com/css2?family=Viaoda+Libre&family=The+Nautigal:wght@400;700&family=Cormorant+Garamond:wght@500;600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:wght@400;500;600&family=Uchen&family=Ms+Madi&display=swap',
  palettes: [
    { id: 'do-ruou', name: 'Đỏ rượu vang', swatch: ['#ece4d8', '#511419'], vars: { ...base, '--page': '#f7f3ee', '--bg': '#fff7eb', '--paper': '#fffaf3', '--ink': '#511419', '--muted': '#8a6a66', '--accent': '#511419', '--accent-ink': '#ece4d8', '--gold': '#c9a24e', '--line': '#d9cbbd', '--dd-hi': '#6e1a20', '--dd-lo': '#380a0e', '--dd-cream': '#ece4d8', '--dd-btn': '#f3e8de', '--dd-std': '#590310' } },
    { id: 'xanh-reu', name: 'Xanh rêu', swatch: ['#ebe8dc', '#2f3d2c'], vars: { ...base, '--page': '#f3f3ee', '--bg': '#f8f6ee', '--paper': '#fbfaf4', '--ink': '#2f3d2c', '--muted': '#6f7a68', '--accent': '#2f3d2c', '--accent-ink': '#ebe8dc', '--gold': '#b89b5e', '--line': '#d4d3c3', '--dd-hi': '#3f5139', '--dd-lo': '#1d281b', '--dd-cream': '#ebe8dc', '--dd-btn': '#eef0e6', '--dd-std': '#24311f' } },
  ],
  // dữ liệu xem thử theo bản gốc: ảnh của mẫu, lễ thành hôn buổi sáng, tiệc tối có đón khách / khai tiệc
  demo: {
    cover: '/demo/dodam-2.jpg',
    photos: [1, 3, 4, 5, 6, 7, 8].map((n) => `/demo/dodam-${n}.jpg`),
    story: '',
    events: [
      { name: 'Lễ Thành Hôn', date: '2026-12-20', time: '09:00', place: 'Tư gia', address: '', mapUrl: '' },
      { name: 'Đón khách', date: '2026-12-20', time: '17:30', place: '', address: '', mapUrl: '' },
      { name: 'Khai tiệc', date: '2026-12-20', time: '18:00', place: 'Trung Tâm Hội Nghị White Palace', address: '194 Hoàng Văn Thụ, Phường 9, Quận Phú Nhuận, TP. Hồ Chí Minh', mapUrl: '' },
      { name: 'Nghi thức cưới', date: '2026-12-20', time: '18:30', place: '', address: '', mapUrl: '' },
      { name: 'Cắt bánh & nâng ly', date: '2026-12-20', time: '19:00', place: '', address: '', mapUrl: '' },
      { name: 'Kết thúc tiệc', date: '2026-12-20', time: '20:30', place: '', address: '', mapUrl: '' },
    ],
  },
  // xác nhận tham dự mở trong hộp thoại từ khung tiệc cưới (như bản gốc), nên không có trong luồng trang
  layout: ['invite', 'story', 'gallery', 'calendar', 'events', 'wishes', 'gift', 'thanks'],

  title(text, sub) {
    return `<h2 class="dd-h">${esc(text)}</h2>${sub ? `<p class="sec-sub">${esc(sub)}</p>` : ''}`;
  },

  opener(ctx) {
    const p = ctx.dparts;
    return `
<div class="opener dd-opener" id="opener">
  <div class="dd-ocard">
    <div class="dd-ofl"><img class="tl" src="${A('flower2-decoration')}" alt=""><img class="br" src="${A('flower2-decoration')}" alt=""></div>
    <span class="dd-heart" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M12 21s-7.5-4.6-10-9.3C.3 8.3 2.2 4 6.3 4c2.3 0 3.9 1.3 5.7 3.4C13.8 5.3 15.4 4 17.7 4 21.8 4 23.7 8.3 22 11.7 19.5 16.4 12 21 12 21z"/></svg></span>
    <div class="dd-obody">
      <h1 class="dd-onames"><span>${esc(ctx.g)}</span><i>&amp;</i><span>${esc(ctx.b)}</span></h1>
      <p class="dd-rule" aria-hidden="true"><span></span>❦<span></span></p>
      ${p ? `<p class="dd-odate">${+p.d} tháng ${+p.m}, ${p.y}</p>` : ''}
      <p class="dd-oto">${ctx.guest ? `Thân mời ${esc(ctx.guest.name)}` : 'Thân Mời'}</p>
      <button class="dd-obtn" id="openBtn">Mở thiệp</button>
    </div>
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
    ${photo ? `<div class="dd-env-photo"><div><img src="${esc(photo)}" alt="Ảnh cưới"></div></div>` : ''}
    <span class="dd-env-fl"><img src="${A('flower2-decoration')}" alt=""></span>
    <img class="dd-env-front" src="${A('envelope-cover')}" alt="">
  </div>
  <div class="dd-names"><p>${esc(ctx.g)}</p><span aria-hidden="true">&amp;</span><p>${esc(ctx.b)}</p></div>
</header>`;
  },

  sections: {
    // khung đỏ "Thông tin lễ cưới": bố mẹ hai bên, tên đầy đủ, nơi & giờ làm lễ
    invite(ctx) {
      const { d, dparts: p } = ctx;
      const strip = (s) => esc(s.replace(/^(Ông|Bà)\s+/i, ''));
      const fam = (x) => `<div class="dd-fam"><span class="k">Ông Bà</span><span class="n">${x.father ? strip(x.father) : ''}${x.father && x.mother ? '<br>' : ''}${x.mother ? strip(x.mother) : ''}</span>${x.address ? `<span class="a">${esc(x.address)}</span>` : ''}</div>`;
      const hasFam = d.groom.father || d.groom.mother || d.bride.father || d.bride.mother;
      const party = partyEvent(d);
      const cer = evList(d).find((e) => e !== party) || party;
      const time = cer && cer.time ? cer.time : d.time;
      return `
  <section class="sec dd-panel-wrap dd-invite reveal">
    <span class="dd-side"><img src="${A('flower2-decoration')}" alt=""></span>
    <div class="dd-box">
      <h2 class="dd-h">Thông tin lễ cưới</h2>
      ${hasFam ? `<div class="dd-fams">${fam(d.groom)}<i></i>${fam(d.bride)}</div>` : ''}
      <p class="dd-lead">Trân trọng báo tin<br>lễ thành hôn của con chúng tôi</p>
      <div class="dd-couple">
        <h3>${esc(d.groom.fullName || d.groom.name)}</h3>
        <p class="dd-role">Chú rể</p>
        <p class="dd-amp">&amp;</p>
        <h3>${esc(d.bride.fullName || d.bride.name)}</h3>
        <p class="dd-role">Cô dâu</p>
      </div>
      <div class="dd-when-block">
        ${cer && cer.place ? `<p class="dd-lead">${esc(cer.name || 'Lễ thành hôn')} được cử hành tại<br>${esc(cer.place)}</p>` : ''}
        ${p ? `<div class="dd-when"><span>${time ? `Vào lúc ${esc(time)}` : ''}</span><span>${esc(ctx.weekday)}</span></div>
        ${dateRow(p)}
        <p class="dd-lunar">(Tức ${esc(ctx.lunar.replace(/^Nhằm /i, ''))})</p>` : ''}
      </div>
    </div>
  </section>`;
    },

    // album dạng xếp chồng: ảnh giữa lớn, hai bên hẹp và thấp hơn; vuốt / chấm / mũi tên để chuyển
    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      return `
  <section class="sec dd-album">
    <img class="dd-castle" src="${A('castle-background')}" alt="">
    <h2 class="dd-h">Album ảnh</h2>
    <div class="dd-cf">
      <div class="dd-cf-stage">
        <button class="dd-cf-nav prev" type="button" aria-label="Ảnh trước">‹</button>
        <button class="dd-cf-nav next" type="button" aria-label="Ảnh sau">›</button>
        ${ph.map((u, i) => `<button class="ph" data-i="${i}" aria-label="Xem ảnh ${i + 1}"><img loading="lazy" src="${esc(u)}" alt=""></button>`).join('')}
      </div>
      <div class="dd-dots">${ph.map((_, i) => `<button type="button" aria-label="Ảnh ${i + 1}"></button>`).join('')}</div>
    </div>
    <script>(function(){
      var s=document.currentScript.parentNode,st=s.querySelector('.dd-cf-stage'),cs=[].slice.call(st.querySelectorAll('.ph')),ds=[].slice.call(s.querySelectorAll('.dd-dots button')),k=0,n=cs.length;
      function go(i){k=(i+n)%n;cs.forEach(function(c,j){var o=j-k;if(o>n/2)o-=n;if(o<-n/2)o+=n;c.dataset.o=Math.abs(o)>1?'far':o;});ds.forEach(function(d,j){d.className=j===k?'on':'';});}
      // chạm ảnh bên cạnh thì chuyển tới ảnh đó, chỉ ảnh giữa mới mở xem lớn
      st.addEventListener('click',function(e){var c=e.target.closest('.ph');if(c&&c.dataset.o!=='0'){e.stopPropagation();go(cs.indexOf(c));}},true);
      s.querySelector('.prev').onclick=function(){go(k-1)};s.querySelector('.next').onclick=function(){go(k+1)};
      ds.forEach(function(d,j){d.onclick=function(){go(j)}});
      var x0=null;st.addEventListener('pointerdown',function(e){x0=e.clientX});
      st.addEventListener('pointerup',function(e){if(x0!==null&&Math.abs(e.clientX-x0)>40){go(k+(e.clientX<x0?1:-1));}x0=null});
      go(0);
    })()</script>
  </section>`;
    },

    // khung đỏ "Thông tin tiệc cưới": giờ, ngày, âm lịch, đón khách / khai tiệc, lịch tháng; nút mở hộp thoại xác nhận
    calendar(ctx, opts, h) {
      const { d, dparts: p } = ctx;
      if (!p) return '';
      const evs = evList(d);
      const party = partyEvent(d) || {};
      const time = party.time || d.time;
      const at = evs.indexOf(party);
      const marks = at > 0 && evs[at - 1].time && (!evs[at - 1].date || evs[at - 1].date === ctx.date) ? [evs[at - 1], party] : [];
      const grid = d.show.calendar ? h.calGrid(ctx, `<p class="dd-calh">Tháng ${+p.m} / ${p.y}</p>`) : '';
      const cal = h.calendarLink(`Đám cưới ${ctx.g} & ${ctx.b}`, ctx.date, time, party.address || party.place);
      const rsvp = d.show.rsvp ? h.rsvp(ctx).replace('sec s-rsvp reveal', 's-rsvp') : '';
      return `
  <section class="sec dd-panel-wrap dd-party reveal">
    <span class="dd-side"><img src="${A('flower2-decoration')}" alt=""></span>
    <div class="dd-box">
      <h2 class="dd-h">Thông tin tiệc cưới</h2>
      <h3 class="dd-lead">Tiệc cưới sẽ diễn ra vào lúc:</h3>
      <div class="dd-when"><span>${esc(time || '')}</span><span>${esc(ctx.weekday)}</span></div>
      ${dateRow(p)}
      <p class="dd-lunar">(Tức ${esc(ctx.lunar.replace(/^Nhằm /i, ''))})</p>
      ${marks.length ? `<div class="dd-marks">${marks.map((e) => `<div><span class="k">${esc(e.name)}</span><span class="t">${esc(e.time)}</span></div>`).join('')}</div>` : ''}
      ${grid ? `<div class="dd-calwrap">${grid}</div>` : ''}
      <a class="dd-link" target="_blank" rel="noopener" href="${esc(cal)}">Thêm vào lịch</a>
      ${rsvp ? `<button class="dd-pill" type="button" onclick="document.getElementById('ddRsvp').showModal()">Xác nhận tham dự</button>` : ''}
    </div>
  </section>
  ${rsvp ? `<dialog class="dd-dlg dd-rsvp" id="ddRsvp"><button class="dd-x" type="button" aria-label="Đóng" onclick="this.closest('dialog').close()">×</button>${rsvp}</dialog>` : ''}`;
    },

    // nơi tổ chức tiệc (bản đồ) + lịch trình ngày cưới dạng dòng thời gian trong khung đỏ
    events(ctx, opts, h) {
      const evs = evList(ctx.d);
      if (!evs.length) return '';
      const party = partyEvent(ctx.d);
      const icons = ['camera', 'cake', 'cook'];
      const dir = party && (party.mapUrl || (party.address ? h.mapSearch(party.address) : ''));
      return `
  ${party && (party.place || party.address) ? `
  <section class="sec dd-venue reveal">
    <img class="dd-castle" src="${A('castle-background')}" alt="">
    <h2 class="dd-h">Tiệc cưới sẽ tổ chức tại</h2>
    <p class="dd-addr">${esc([party.place, party.address].filter(Boolean).join(', '))}</p>
    ${party.address ? `<div class="dd-map"><iframe loading="lazy" title="Bản đồ" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(party.address)}&amp;output=embed"></iframe></div>` : ''}
    ${dir ? `<a class="dd-dir" target="_blank" rel="noopener" href="${esc(dir)}"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M3 11l18-8-8 18-2-8-8-2z"/></svg>Chỉ đường</a>` : ''}
  </section>` : ''}
  <section class="sec dd-panel-wrap dd-sched reveal">
    <span class="dd-side"><img src="${A('flower2-decoration')}" alt=""></span>
    <div class="dd-box">
      <h2 class="dd-h">Lịch trình ngày cưới</h2>
      <ol class="dd-tl">
        ${evs.map((e, i) => {
          const p = h.parts(e.date);
          const other = p && e.date !== ctx.date;
          const ic = icons[i - 1];
          return `<li><span class="t"><b>${ic ? `<img class="ic" src="${A(ic)}" alt="">` : ''}${esc(e.time) || '—'}</b></span><span class="dot"></span><span class="l">${esc(e.name)}${other ? ` <small>${p.d}/${p.m}</small>` : ''}</span></li>`;
        }).join('')}
      </ol>
    </div>
  </section>`;
    },

    // sổ lưu bút trên tờ giấy ghi chú; ô nhập dùng chữ gợi ý như bản gốc (giữ id/tên trường cho card.js)
    wishes(ctx, opts) {
      if (!ctx.d.show.wishes) return '';
      const list = opts.wishes || [];
      return `
  <div class="dd-guestbook reveal">
    <img class="dd-note" src="${A('papernote-background')}" alt="">
    <section class="sec s-wishes">
      <h2 class="dd-h">Sổ lưu bút</h2>
      <form class="dd-wform" id="wishForm">
        <input name="name" required maxlength="60" placeholder="Nhập tên*" value="${ctx.guest ? esc(ctx.guest.name) : ''}" aria-label="Tên">
        <textarea name="message" required maxlength="500" placeholder="Nhập lời chúc*" aria-label="Lời chúc"></textarea>
        <div class="dd-wrow"><p class="form-msg" role="status"></p><button type="submit">Gửi lời chúc</button></div>
      </form>
      <div class="wish-list" id="wishList">
        ${list.map((w) => `<div class="wish"><b>${esc(w.name)}</b><p>${esc(w.message)}</p></div>`).join('')}
      </div>
    </section>
  </div>`;
    },

    // hộp quà mừng: phong bao đỏ, chạm để mở hộp thoại có mã QR của hai bên
    gift(ctx, opts, h) {
      if (!ctx.d.show.gift) return '';
      const html = h.giftCard(ctx, ctx.d.gifts.groom, 'groom') + h.giftCard(ctx, ctx.d.gifts.bride, 'bride');
      if (!html) return '';
      return `
  <section class="sec dd-giftbox reveal">
    <img class="dd-castle" src="${A('castle-background')}" alt="">
    <h2 class="dd-h">Hộp quà mừng</h2>
    <button class="dd-envbtn" type="button" onclick="document.getElementById('ddGift').showModal()">
      <span class="dd-envs"><i>✦</i><i>✦</i><i>✦</i><i>✦</i><span class="sh"></span><img class="back" src="${A('envelope-gift')}" alt=""><img class="front" src="${A('envelope-gift')}" alt=""></span>
      <span class="hint">Nhấn để mở</span>
    </button>
  </section>
  <dialog class="dd-dlg dd-giftdlg" id="ddGift">
    <div class="dd-dlg-head"><h2>Hộp quà mừng</h2><button class="dd-x" type="button" aria-label="Đóng" onclick="this.closest('dialog').close()">×</button></div>
    <div class="gifts">${html}</div>
  </dialog>`;
    },

    // dòng cuối trang = lời nhắn của cô dâu chú rể (mặc định "Sự hiện diện của quý khách…")
    thanks(ctx) {
      return `
  <section class="sec dd-thanks reveal">
    <p>${esc(ctx.d.message || 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!')}</p>
  </section>`;
    },
  },

  css: `
.tpl-dodam .card{max-width:480px;background:url('${A('paper')}') center top/100% auto repeat-y,var(--bg);background-blend-mode:multiply;color:var(--ink);font-family:var(--font-body);box-shadow:none}
.tpl-dodam .sec{padding:0}
.tpl-dodam .dd-h{position:relative;margin:0;font-family:'Times New Roman',Times,serif;font-weight:700;font-size:20px;line-height:1.5;letter-spacing:.03em;text-transform:uppercase;color:var(--ink)}
.tpl-dodam .sec-sub{margin:4px 0 0;color:var(--muted);font-size:14px}
/* hình lâu đài mờ sau từng phần, tràn xuống phía sau phần kế tiếp (chỉ cắt theo chiều ngang) */
.tpl-dodam .dd-castle{position:absolute;left:50%;top:0;width:170%;max-width:none;transform:translateX(-50%);opacity:.1;pointer-events:none}

/* ---- màn mở thiệp ---- */
.tpl-dodam .dd-opener{background:linear-gradient(to bottom right,var(--dd-hi),var(--accent),var(--dd-lo));padding:20px}
.tpl-dodam .dd-ocard{position:relative;width:310px;max-width:100%;text-align:center;background:color-mix(in srgb,var(--paper) 96%,transparent);border-radius:8px;box-shadow:0 25px 60px -12px rgba(0,0,0,.45),0 8px 24px rgba(0,0,0,.2)}
.tpl-dodam .dd-ofl{position:absolute;inset:0;border-radius:8px;overflow:hidden;pointer-events:none}
.tpl-dodam .dd-ofl img{position:absolute;height:144px;width:auto;max-width:none;opacity:.8}
.tpl-dodam .dd-ofl .tl{top:-5%;left:-10px;transform:translateX(-6%) rotate(25deg)}
.tpl-dodam .dd-ofl .br{bottom:-5%;right:-10px;transform:translateX(6%) rotate(-25deg) scaleX(-1)}
.tpl-dodam .dd-heart{position:absolute;left:50%;top:22px;z-index:1;width:56px;height:56px;margin-left:-28px;display:grid;place-items:center;border-radius:50%;background:radial-gradient(circle at 30% 30%,var(--accent),var(--dd-lo));color:var(--dd-btn);box-shadow:0 4px 20px color-mix(in srgb,var(--accent) 50%,transparent)}
.tpl-dodam .dd-obody{position:relative;z-index:1;padding:112px 24px 56px}
.tpl-dodam .dd-onames{margin:0 0 8px;font-family:var(--font-title);font-weight:400;font-size:30px;line-height:1.25;color:var(--accent)}
.tpl-dodam .dd-onames span{display:block}
.tpl-dodam .dd-onames i{display:block;font-style:normal;font-size:18px;line-height:1}
.tpl-dodam .dd-rule{display:flex;align-items:center;justify-content:center;gap:12px;margin:0 0 8px;color:var(--accent);font-size:14px}
.tpl-dodam .dd-rule span{width:40px;height:1px;background:linear-gradient(to right,transparent,var(--accent))}
.tpl-dodam .dd-rule span:last-child{background:linear-gradient(to left,transparent,var(--accent))}
.tpl-dodam .dd-odate{margin:0 0 20px;font-family:'Lora',serif;font-weight:400;font-size:18px;color:color-mix(in srgb,var(--accent) 72%,transparent)}
.tpl-dodam .dd-oto{margin:0 auto 24px;max-width:300px;font-family:'Lora',serif;font-weight:400;font-size:18px;color:color-mix(in srgb,var(--accent) 72%,transparent)}
.tpl-dodam .dd-obtn{position:relative;padding:10px 32px;border:0;border-radius:999px;background:var(--accent);color:var(--dd-btn);font-family:'Lora',serif;font-size:18px;font-weight:600;box-shadow:0 4px 14px color-mix(in srgb,var(--accent) 35%,transparent)}

/* ---- trang bìa: phong bì + ảnh ---- */
.tpl-dodam .dd-cover{position:relative;display:flex;flex-direction:column;align-items:center;padding:60px 36px 56px;text-align:center;overflow-x:clip}
.tpl-dodam .dd-cover .dd-castle{top:26%}
.tpl-dodam .dd-std{position:relative;margin:0;font-family:'Cormorant Garamond',serif;font-weight:600;font-size:15px;letter-spacing:.16em;text-transform:uppercase;color:var(--dd-std)}
.tpl-dodam .dd-env{position:relative;width:82%;max-width:330px;margin-top:96px;aspect-ratio:333/384}
.tpl-dodam .dd-env-back{position:absolute;inset:0;z-index:1;width:100%;height:100%}
.tpl-dodam .dd-env-photo{position:absolute;left:33%;top:-2%;z-index:2;width:64%;animation:ddDrift 6.5s ease-in-out .4s infinite}
.tpl-dodam .dd-env-photo div{aspect-ratio:221/309;border:7px solid #fff;background:#fff;transform:rotate(12deg);box-shadow:2px 2px 4px rgba(0,0,0,.25)}
.tpl-dodam .dd-env-photo img{width:100%;height:100%;object-fit:cover}
.tpl-dodam .dd-env-fl{position:absolute;left:-2%;top:-12%;z-index:3;width:42%;animation:ddDrift 5s ease-in-out infinite}
/* ảnh và hoa nổi nhẹ lên xuống 8px như bản gốc (mỗi chỗ một nhịp) */
@keyframes ddDrift{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@media (prefers-reduced-motion:reduce){.tpl-dodam .dd-env-photo,.tpl-dodam .dd-env-fl,.tpl-dodam .dd-side img{animation:none}}
.tpl-dodam .dd-env-fl img{width:100%;transform:rotate(-17deg);filter:drop-shadow(3px 4px 3px rgba(0,0,0,.3))}
.tpl-dodam .dd-env-front{position:absolute;left:0;bottom:0;z-index:4;width:100%}
.tpl-dodam .dd-names{position:relative;display:flex;flex-direction:column;align-items:center;gap:22px;margin-top:64px}
.tpl-dodam .dd-names p{position:relative;margin:0;font-family:var(--font-title);font-size:clamp(38px,11vw,46px);line-height:1;color:var(--ink)}
.tpl-dodam .dd-names span{position:absolute;top:37%;transform:translateY(-50%);font-family:var(--font-script);font-weight:400;font-size:92px;line-height:1;color:color-mix(in srgb,var(--ink) 15%,transparent);pointer-events:none}

/* ---- khung đỏ: nền đỏ + lớp giấy nhân màu 40%, hoa thò ra mép ---- */
.tpl-dodam .dd-panel-wrap{position:relative;width:88%;max-width:420px;margin:0 auto 16px;z-index:1}
.tpl-dodam .dd-box{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;gap:24px;padding:36px 20px;border-radius:10px;background:var(--accent);color:var(--dd-cream);text-align:center;box-shadow:4px 4px 10px rgba(0,0,0,.25)}
.tpl-dodam .dd-box::before{content:"";position:absolute;inset:0;border-radius:inherit;background:url('${A('paper')}') center/cover;mix-blend-mode:multiply;opacity:.4;pointer-events:none}
.tpl-dodam .dd-box>*{position:relative}
.tpl-dodam .dd-box p,.tpl-dodam .dd-box h3{margin:0}
.tpl-dodam .dd-box .dd-h{color:var(--dd-cream)}
.tpl-dodam .dd-side{position:absolute;z-index:2;pointer-events:none}
.tpl-dodam .dd-side img{display:block;width:100%;filter:drop-shadow(3px 4px 3px rgba(0,0,0,.3))}
.tpl-dodam .dd-lead{font-family:var(--font-body);font-weight:400;font-size:16px;line-height:1.5;text-transform:uppercase}
.tpl-dodam .dd-when{display:flex;justify-content:space-between;gap:12px;width:100%;max-width:180px;min-width:max-content;font-family:var(--font-body);font-size:13px;text-transform:uppercase;white-space:nowrap;color:color-mix(in srgb,var(--dd-cream) 70%,transparent)}
.tpl-dodam .dd-date{display:flex;align-items:center;justify-content:center;gap:16px;font-family:'Times New Roman',Times,serif;font-weight:400}
.tpl-dodam .dd-date b{font-weight:400;font-size:40px;line-height:1}
.tpl-dodam .dd-date i{width:1px;height:46px;background:color-mix(in srgb,var(--dd-cream) 50%,transparent)}
.tpl-dodam .dd-date span{display:flex;flex-direction:column;align-items:flex-start;gap:4px}
.tpl-dodam .dd-date em{font-style:normal;font-size:14px;text-transform:uppercase}
.tpl-dodam .dd-lunar{font-family:var(--font-body);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:color-mix(in srgb,var(--dd-cream) 70%,transparent)}

/* lời mời */
.tpl-dodam .dd-invite .dd-box{padding:36px 20px 40px;border-radius:13px}
.tpl-dodam .dd-invite .dd-side{right:-22%;bottom:30%;width:40%}
.tpl-dodam .dd-invite .dd-side img{animation:ddDrift 5.5s ease-in-out .6s infinite}
.tpl-dodam .dd-fams{display:grid;grid-template-columns:1fr auto 1fr;column-gap:32px;align-items:center;width:100%}
.tpl-dodam .dd-fams>i{width:1px;height:50px;background:color-mix(in srgb,var(--dd-cream) 50%,transparent)}
.tpl-dodam .dd-fam{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0;font-family:var(--font-body);font-size:12px}
.tpl-dodam .dd-fam .k,.tpl-dodam .dd-fam .a{color:color-mix(in srgb,var(--dd-cream) 70%,transparent)}
.tpl-dodam .dd-fam .n{font-weight:700;line-height:1.2;overflow-wrap:anywhere}
.tpl-dodam .dd-fam .k{line-height:1.2}
.tpl-dodam .dd-fam .a{margin-top:4px;font-size:10px;line-height:1.25}
.tpl-dodam .dd-couple{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}
.tpl-dodam .dd-couple h3{display:flex;align-items:center;justify-content:center;width:80%;min-height:80px;font-family:var(--font-title);font-weight:400;font-size:31px;line-height:52px;white-space:nowrap}
.tpl-dodam .dd-role{font-family:'Uchen',serif;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:color-mix(in srgb,var(--dd-cream) 70%,transparent)}
.tpl-dodam .dd-amp{font-family:'Ms Madi',cursive;font-size:35px;line-height:1.5}
.tpl-dodam .dd-when-block{display:flex;flex-direction:column;align-items:center;gap:16px;width:100%}

/* album */
.tpl-dodam .dd-album{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;padding:40px 24px;overflow-x:clip}
.tpl-dodam .dd-album .dd-castle{width:150%;top:-6%}
.tpl-dodam .dd-cf{position:relative;width:100%;max-width:380px;margin-top:20px}
.tpl-dodam .dd-cf-stage{--h:340px;--w:calc(var(--h) * .6133);position:relative;height:var(--h);touch-action:pan-y}
.tpl-dodam .dd-cf .ph{position:absolute;top:50%;left:calc(50% - var(--w) / 2);width:var(--w);height:92%;padding:0;border:0;border-radius:16px;overflow:hidden;background:var(--line);box-shadow:0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1);aspect-ratio:auto;transform:translateY(-50%);transition:all .5s ease;cursor:pointer}
.tpl-dodam .dd-cf .ph img{width:100%;height:100%;object-fit:cover}
.tpl-dodam .dd-cf .ph[data-o="0"]{z-index:3;box-shadow:0 0 0 2px rgba(255,255,255,.3),0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1)}
.tpl-dodam .dd-cf .ph[data-o="1"],.tpl-dodam .dd-cf .ph[data-o="-1"]{z-index:2;width:calc(var(--w) * .46);height:72%}
.tpl-dodam .dd-cf .ph[data-o="1"]{left:calc(50% + var(--w) * .28)}
.tpl-dodam .dd-cf .ph[data-o="-1"]{left:calc(50% - var(--w) * .74)}
.tpl-dodam .dd-cf .ph[data-o="far"]{z-index:1;width:calc(var(--w) * .3);height:52%;opacity:0;pointer-events:none}
.tpl-dodam .dd-cf-nav{display:none}
.tpl-dodam .dd-dots{display:flex;justify-content:center;gap:6px;margin-top:12px}
.tpl-dodam .dd-dots button{width:8px;height:8px;padding:0;border:0;border-radius:999px;background:var(--ink);opacity:.25;transition:all .3s}
.tpl-dodam .dd-dots button.on{width:24px;opacity:.7}

/* tiệc cưới + lịch */
.tpl-dodam .dd-party .dd-box{gap:16px}
.tpl-dodam .dd-party .dd-side{left:-18%;top:10%;width:24%}
.tpl-dodam .dd-party .dd-side img{animation:ddDrift 6s ease-in-out .3s infinite}
.tpl-dodam .dd-party .dd-when{max-width:130px}
.tpl-dodam .dd-party .dd-date em{font-size:12px}
.tpl-dodam .dd-party .dd-date em+em{font-size:18px}
.tpl-dodam .dd-marks{display:flex;justify-content:center;gap:32px;margin-top:16px}
.tpl-dodam .dd-marks div{display:flex;flex-direction:column;align-items:center}
.tpl-dodam .dd-marks .k{font-family:'Times New Roman',serif;font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:color-mix(in srgb,var(--dd-cream) 70%,transparent)}
.tpl-dodam .dd-marks .t{margin-top:4px;font-family:'Times New Roman',serif;font-size:18px;font-weight:500}
.tpl-dodam .dd-calwrap{margin-top:12px;padding:8px 16px 16px;border-radius:10px;background:var(--dd-cream);color:var(--accent);overflow:hidden}
.tpl-dodam .dd-calwrap .cal{width:280px;max-width:100%;margin:0}
.tpl-dodam .dd-calh{margin:0!important;padding:10px 0;border-bottom:1px solid color-mix(in srgb,var(--accent) 27%,transparent);font-family:var(--font-script);font-size:25px;line-height:1.5;letter-spacing:.025em}
.tpl-dodam .dd-party{--cal-hi:var(--accent);--cal-on:var(--dd-cream)}
.tpl-dodam .dd-calwrap .cal-grid{row-gap:2px;padding:0 4px 8px;font-family:'Times New Roman',serif;font-size:12px;color:var(--accent)}
.tpl-dodam .dd-calwrap .cal-grid span{height:30px}
.tpl-dodam .dd-calwrap .cal-grid .cal-w{height:auto;margin:0 -4px 8px;padding:6px 0;border-bottom:2px solid var(--accent);font-size:10px;font-weight:500;opacity:.6;color:var(--accent)}
.tpl-dodam .dd-calwrap .cal-on::before{width:26px;height:24px}
.tpl-dodam .dd-calwrap .cal-on b{font-size:11px}
.tpl-dodam .dd-link{margin-top:12px;font-family:'Times New Roman',serif;font-size:14px;color:var(--dd-cream);text-decoration:underline;text-underline-offset:4px}
.tpl-dodam .dd-pill{margin-top:4px;padding:8px 24px;border:0;border-radius:999px;background:var(--dd-cream);color:var(--accent);font-family:var(--font-body);font-size:14px;letter-spacing:.025em;text-transform:uppercase}

/* nơi tổ chức */
.tpl-dodam .dd-venue{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:16px;padding:32px 24px;overflow-x:clip}
.tpl-dodam .dd-venue .dd-castle{width:158%;top:-1%}
.tpl-dodam .dd-venue .dd-h{font-size:16px}
.tpl-dodam .dd-addr{position:relative;margin:-8px auto 0;max-width:260px;font-family:var(--font-body);font-size:12px;line-height:1.625;color:var(--ink)}
.tpl-dodam .dd-map{position:relative;width:100%;max-width:560px;height:268px;background:var(--line)}
.tpl-dodam .dd-map iframe{width:100%;height:100%;border:0}
.tpl-dodam .dd-dir{position:relative;display:inline-flex;align-items:center;gap:8px;padding:8px 20px;border-radius:999px;font-family:var(--font-body);font-weight:700;font-size:14px;color:color-mix(in srgb,var(--ink) 80%,transparent);text-decoration:none}

/* lịch trình: lưới giờ | chấm | tên; vạch dọc nối từ chấm đầu tới chấm cuối, đi qua tâm từng chấm */
.tpl-dodam .dd-sched{margin:16px auto}
.tpl-dodam .dd-sched .dd-box{gap:16px;padding:36px 24px}
.tpl-dodam .dd-sched .dd-side{right:-16%;top:-12%;width:30%}
.tpl-dodam .dd-sched .dd-side img{animation:ddDrift 5.2s ease-in-out .9s infinite}
.tpl-dodam .dd-tl{--gy:32px;display:grid;grid-template-columns:minmax(0,1fr) 16px minmax(0,1fr);align-items:center;column-gap:24px;row-gap:var(--gy);width:100%;max-width:460px;margin:0 auto;padding:0 8px;list-style:none;font-family:'Times New Roman',Times,serif}
.tpl-dodam .dd-tl li{display:contents}
.tpl-dodam .dd-tl .t{text-align:right;font-size:16px;letter-spacing:.025em;font-variant-numeric:tabular-nums;line-height:1.4}
.tpl-dodam .dd-tl .t b{position:relative;display:inline-block;font-weight:400}
.tpl-dodam .dd-tl .ic{position:absolute;right:100%;top:50%;width:40px;height:40px;margin-right:30px;transform:translateY(-50%);object-fit:contain}
.tpl-dodam .dd-tl .dot{position:relative;align-self:stretch;display:flex;align-items:center;justify-content:center}
.tpl-dodam .dd-tl .dot::before{content:"";position:absolute;left:50%;width:1px;top:calc(-1 * var(--gy));bottom:calc(-1 * var(--gy));transform:translateX(-50%);background:color-mix(in srgb,var(--dd-cream) 40%,transparent)}
.tpl-dodam .dd-tl li:first-child .dot::before{top:50%}
.tpl-dodam .dd-tl li:last-child .dot::before{bottom:50%}
.tpl-dodam .dd-tl li:only-child .dot::before{display:none}
.tpl-dodam .dd-tl .dot::after{content:"";position:relative;width:10px;height:10px;border-radius:50%;background:var(--dd-cream);box-shadow:0 0 0 2px color-mix(in srgb,var(--dd-cream) 13%,transparent)}
.tpl-dodam .dd-tl .l{text-align:left;font-size:13px;color:color-mix(in srgb,var(--dd-cream) 70%,transparent)}
.tpl-dodam .dd-tl small{font-size:inherit;opacity:.8}

/* sổ lưu bút trên giấy ghi chú */
.tpl-dodam .dd-guestbook{position:relative;z-index:1;overflow-x:clip;container-type:inline-size}
.tpl-dodam .dd-note{position:absolute;left:50%;top:-15px;width:120%;max-width:650px;transform:translateX(-50%);opacity:.95;filter:drop-shadow(4px 4px 4px rgba(0,0,0,.25));pointer-events:none}
.tpl-dodam .s-wishes{position:relative;padding:74px 24px 32px;text-align:center}
.tpl-dodam .s-wishes .dd-h{transform:translateY(16px)}
.tpl-dodam .dd-wform{display:flex;flex-direction:column;gap:16px;width:100%;max-width:280px;margin:24px auto 0;padding:16px;border-radius:8px}
.tpl-dodam .dd-wform input,.tpl-dodam .dd-wform textarea{width:100%;padding:12px 16px;border:1px solid var(--ink);border-radius:8px;background:transparent;color:var(--ink);font:400 14px/20px 'Times New Roman',serif;outline:none;resize:none}
.tpl-dodam .dd-wform textarea{height:56px}
.tpl-dodam .dd-wform ::placeholder{color:color-mix(in srgb,var(--ink) 55%,transparent)}
.tpl-dodam .dd-wrow{display:flex;align-items:center;justify-content:space-between;gap:8px}
.tpl-dodam .dd-wrow .form-msg{flex:1;font-size:12px;text-align:left}
.tpl-dodam .dd-wrow button{padding:8px 24px;border:0;border-radius:999px;background:var(--ink);color:#ded9d7;font:700 14px/20px 'Times New Roman',serif;text-transform:uppercase}
.tpl-dodam .wish-list{width:100%;max-width:600px;max-height:500px;margin:max(60px,calc(109.3cqw - 333px)) auto 0;padding-right:8px;overflow-y:auto;text-align:left}
.tpl-dodam .wish{margin:0 0 12px;padding:16px;border:1px solid color-mix(in srgb,var(--ink) 33%,transparent);border-radius:8px;background:rgba(255,255,255,.55);font-family:'Times New Roman',serif;font-size:14px;color:var(--ink)}
.tpl-dodam .wish b{font-weight:700;font-size:14px;color:var(--ink)}
.tpl-dodam .wish p{margin:8px 0 0;line-height:1.625;color:var(--ink)}

/* hộp quà mừng */
.tpl-dodam .dd-giftbox{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;padding:32px 24px 40px;overflow-x:clip}
.tpl-dodam .dd-giftbox .dd-castle{width:155%;top:6%}
.tpl-dodam .dd-giftbox .dd-h{margin-bottom:16px}
.tpl-dodam .dd-envbtn{position:relative;display:flex;align-items:flex-end;justify-content:center;padding:33px 0 48px;border:0;background:none;cursor:pointer}
/* hai phong bao chồng nhau (theo bản gốc): bao trước xoay -10° nổi lên xuống, bao sau lật ngang thu 80% */
.tpl-dodam .dd-envs{position:relative;display:block;width:190px;height:275px}
.tpl-dodam .dd-envs img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center bottom}
.tpl-dodam .dd-envs .front{z-index:2;rotate:-10deg;transform-origin:50% 92%;filter:drop-shadow(0 10px 18px rgba(0,0,0,.22));animation:ddFloatMain 3s ease-in-out infinite}
.tpl-dodam .dd-envs .back{z-index:1;transform-origin:50% 100%;transform:translateX(20%) translateY(-10%) scale(-.8,.8) rotate(-15deg);filter:drop-shadow(0 8px 14px rgba(0,0,0,.18));animation:ddFloat 5.2s ease-in-out .5s infinite}
.tpl-dodam .dd-envbtn:hover .front,.tpl-dodam .dd-envbtn:focus-visible .front{animation:ddFloatMain 3s ease-in-out infinite,ddWave 1.1s ease-in-out infinite;scale:1.12}
.tpl-dodam .dd-envs .sh{position:absolute;left:50%;bottom:-6px;z-index:0;width:125px;height:11px;margin-left:-62px;border-radius:50%;background:rgba(0,0,0,.45);filter:blur(4px);animation:ddShadow 3s ease-in-out infinite}
.tpl-dodam .dd-envs i{position:absolute;z-index:3;font-style:normal;color:#b58b2f;opacity:0;animation:ddSpark 2s ease-in-out infinite}
.tpl-dodam .dd-envs i:nth-child(1){top:6%;left:12%;font-size:21px}
.tpl-dodam .dd-envs i:nth-child(2){top:14%;right:8%;font-size:15px;animation-delay:.6s}
.tpl-dodam .dd-envs i:nth-child(3){top:34%;left:3%;font-size:13px;animation-delay:1.2s}
.tpl-dodam .dd-envs i:nth-child(4){top:24%;right:3%;font-size:13px;animation-delay:1.7s}
@keyframes ddFloat{0%,100%{translate:0 0}50%{translate:0 -7px}}
@keyframes ddFloatMain{0%,100%{translate:-15% 0}50%{translate:-15% -7px}}
@keyframes ddShadow{0%,100%{transform:scaleX(1);opacity:.28}50%{transform:scaleX(.9);opacity:.16}}
@keyframes ddSpark{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1.15)}}
@keyframes ddWave{0%,100%{rotate:-10deg}20%{rotate:-16deg}40%{rotate:-5.5deg}60%{rotate:-13deg}80%{rotate:-8.5deg}}
@keyframes ddHint{0%,100%{opacity:.45}50%{opacity:1}}
.tpl-dodam .dd-envbtn .hint{position:absolute;left:50%;bottom:0;transform:translateX(-50%);white-space:nowrap;font-family:system-ui,sans-serif;font-size:12px;font-weight:500;color:var(--ink);animation:ddHint 2s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.tpl-dodam .dd-envs *{animation:none!important}}

/* hộp thoại (xác nhận tham dự, quà mừng) */
.tpl-dodam .dd-dlg{width:min(448px,calc(100% - 32px));max-height:85vh;padding:0;border:0;border-radius:16px;background:#fff;color:#111827;box-shadow:0 25px 50px -12px rgba(0,0,0,.25);overflow:auto}
.tpl-dodam .dd-dlg::backdrop{background:rgba(0,0,0,.5)}
.tpl-dodam .dd-x{position:absolute;top:16px;right:16px;z-index:1;width:32px;height:32px;border:0;border-radius:50%;background:#f3f4f6;color:#6b7280;font-size:20px;line-height:1}
.tpl-dodam .dd-rsvp .s-rsvp{padding:24px;text-align:left}
.tpl-dodam .dd-rsvp .dd-h{margin:0 40px 4px 0;font-family:system-ui,sans-serif;font-size:20px;font-weight:600;letter-spacing:0;text-transform:none;color:#111827}
.tpl-dodam .dd-rsvp .sec-sub{margin:0 0 24px;font-family:system-ui,sans-serif;color:#6b7280}
.tpl-dodam .dd-rsvp .form{gap:16px;padding:0;border:0;background:none;font-family:system-ui,sans-serif}
.tpl-dodam .dd-rsvp .form label{font-size:14px;font-weight:500;color:#374151}
.tpl-dodam .dd-rsvp .form input:not([type=radio]),.tpl-dodam .dd-rsvp .form select{padding:12px 16px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;font-size:16px;color:#111827}
.tpl-dodam .dd-rsvp .choice label{padding:10px 12px;border:2px solid #e5e7eb;border-radius:12px;background:rgba(249,250,251,.5);font-size:14px;color:#374151}
.tpl-dodam .dd-rsvp .choice label:has(input:checked){border-color:var(--accent)}
.tpl-dodam .dd-rsvp .btn{padding:14px;border:0;border-radius:12px;background:var(--dd-cream);color:var(--accent);font-size:14px;font-weight:600}
.tpl-dodam .dd-giftdlg{width:min(512px,calc(100% - 32px))}
.tpl-dodam .dd-dlg-head{position:relative;padding:24px 24px 16px;background:var(--accent);text-align:center}
.tpl-dodam .dd-dlg-head h2{margin:0;font:400 20px/1.5 'Times New Roman',serif;text-transform:uppercase;color:#fff}
.tpl-dodam .dd-dlg-head .dd-x{top:12px;right:12px;background:none;color:rgba(255,255,255,.8)}
.tpl-dodam .dd-giftdlg .gifts{display:flex;flex-direction:column;align-items:center;gap:16px;padding:16px}
.tpl-dodam .dd-giftdlg .gift{flex:1;max-width:180px;padding:0;border:0;background:none;text-align:center;color:var(--accent);font-family:system-ui,sans-serif}
.tpl-dodam .dd-giftdlg .gift-who{min-height:2rem;margin:0 0 8px;font:500 12px/1.4 system-ui,sans-serif;color:var(--accent)}
.tpl-dodam .dd-giftdlg .gift img{width:128px;height:128px;margin:0 auto 8px;padding:8px;border-radius:12px;background:#fff;box-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1)}
.tpl-dodam .dd-giftdlg .gift p{margin:2px 0;font-size:10px}
.tpl-dodam .dd-giftdlg .gift-acc{gap:6px;font-family:ui-monospace,monospace;letter-spacing:0}
.tpl-dodam .dd-giftdlg .gift-holder{font-weight:600;color:var(--accent)}
.tpl-dodam .dd-giftdlg .copy{padding:4px 8px;border:0;border-radius:999px;background:color-mix(in srgb,var(--accent) 8%,transparent);font-size:10px;font-weight:500}
@media (max-width:639px){.tpl-dodam .dd-giftdlg{margin:auto auto 0;width:100%;max-width:none;border-radius:16px 16px 0 0}}

.tpl-dodam .dd-thanks{display:flex;flex-direction:column;align-items:center;padding:0 24px 40px}
.tpl-dodam .dd-thanks p{margin:0;white-space:pre-line;font-family:'Times New Roman',serif;font-size:12px;line-height:1.5;color:var(--ink)}
.tpl-dodam .s-story{position:relative;z-index:1;padding:32px 24px;font-family:'Times New Roman',serif;font-size:16px}
.tpl-dodam .credit{padding:0 0 12px;font-size:12px;opacity:.5;color:var(--ink)}

@media (min-width:640px){
  .tpl-dodam .dd-ocard{width:340px}
  .tpl-dodam .dd-onames{font-size:36px}
  .tpl-dodam .dd-onames i{font-size:20px}
  .tpl-dodam .dd-obtn{font-weight:500}
  .tpl-dodam .dd-giftdlg .gifts{flex-direction:row;flex-wrap:wrap;align-items:flex-start;justify-content:center;padding:24px}
  .tpl-dodam .dd-giftdlg .gift img{width:160px;height:160px}
  .tpl-dodam .dd-giftdlg .gift{max-width:none}
}
/* màn hình rộng: cột 900px có viền mảnh, các khối lớn hơn như bản gốc */
@media (min-width:768px){
  .tpl-dodam .card{max-width:900px;border:1px solid color-mix(in srgb,var(--accent) 13%,transparent)}
  .tpl-dodam .dd-ocard{width:520px}
  .tpl-dodam .dd-ofl img{height:280px}
  .tpl-dodam .dd-ofl .tl{top:-2%;transform:translateX(-11%) rotate(25deg)}
  .tpl-dodam .dd-ofl .br{bottom:35%;transform:translateX(11%) rotate(-25deg) scaleX(-1)}
  .tpl-dodam .dd-obody{padding:96px 24px 32px}
  .tpl-dodam .dd-oto{max-width:380px}
  .tpl-dodam .dd-std{font-size:18px}
  .tpl-dodam .dd-env{max-width:420px;margin-top:112px}
  .tpl-dodam .dd-names{margin-top:80px}
  .tpl-dodam .dd-names p{font-size:58px}
  .tpl-dodam .dd-names span{font-size:120px}
  .tpl-dodam .dd-panel-wrap{max-width:560px}
  .tpl-dodam .dd-lead{font-size:20px}
  .tpl-dodam .dd-couple{gap:16px}
  .tpl-dodam .dd-couple h3{font-size:43px;line-height:60px}
  .tpl-dodam .dd-when-block{gap:20px}
  .tpl-dodam .dd-when{max-width:210px;font-size:15px}
  .tpl-dodam .dd-date b{font-size:46px}
  .tpl-dodam .dd-date em{font-size:18px}
  .tpl-dodam .dd-lunar{font-size:14px}
  .tpl-dodam .dd-cf{max-width:600px}
  .tpl-dodam .dd-cf-stage{--h:520px}
  .tpl-dodam .dd-cf .ph[data-o="1"],.tpl-dodam .dd-cf .ph[data-o="-1"]{width:calc(var(--w) * .44);height:74%}
  .tpl-dodam .dd-cf .ph[data-o="-1"]{left:calc(50% - var(--w) * .72)}
  .tpl-dodam .dd-cf-nav{position:absolute;top:50%;z-index:5;display:flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border:0;border-radius:50%;background:color-mix(in srgb,var(--paper) 60%,transparent);color:var(--ink);font-size:22px;line-height:1;transform:translateY(-50%)}
  .tpl-dodam .dd-cf-nav.prev{left:0}
  .tpl-dodam .dd-cf-nav.next{right:0}
  .tpl-dodam .dd-party .dd-box{gap:20px}
  .tpl-dodam .dd-party .dd-when{max-width:130px}
  .tpl-dodam .dd-party .dd-date em{font-size:16px}
  .tpl-dodam .dd-party .dd-date em+em{font-size:24px}
  .tpl-dodam .dd-marks .t{font-size:20px}
  .tpl-dodam .dd-calwrap .cal{width:330px}
  .tpl-dodam .dd-calwrap .cal-grid{font-size:13px}
  .tpl-dodam .dd-calwrap .cal-grid span{height:34px}
  .tpl-dodam .dd-calwrap .cal-grid .cal-w{font-size:11px}
  .tpl-dodam .dd-calwrap .cal-on::before{width:30px;height:28px}
  .tpl-dodam .dd-calwrap .cal-on b{font-size:12px}
  .tpl-dodam .dd-venue{gap:20px}
  .tpl-dodam .dd-map{height:380px}
  .tpl-dodam .dd-addr{max-width:440px;font-size:14px}
  .tpl-dodam .dd-dir{font-size:16px}
  .tpl-dodam .dd-tl{--gy:40px;column-gap:32px}
  .tpl-dodam .dd-tl .t{font-size:17px}
  .tpl-dodam .dd-tl .l{font-size:15px}
  .tpl-dodam .dd-note{top:-30px}
  .tpl-dodam .s-wishes{padding-top:120px}
  .tpl-dodam .s-wishes .dd-h{font-size:24px}
  .tpl-dodam .dd-wform{max-width:380px}
  .tpl-dodam .dd-wform textarea{height:110px}
  .tpl-dodam .wish-list{margin-top:110px}
  .tpl-dodam .dd-thanks p{font-size:13px;max-width:560px}
}
@media (min-width:1024px){
  .tpl-dodam .dd-ocard{width:600px}
  .tpl-dodam .dd-oto{max-width:440px}
}
`,
};
