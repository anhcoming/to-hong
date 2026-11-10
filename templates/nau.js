// Mẫu "Nâu" (Minimalism Nâu) — tối giản ấm áp: nền giấy kem, khung thông tin màu be, khung ảnh vintage, cành lá khô.
// Kích thước lấy theo bản gốc (Tailwind): số đầu cho điện thoại, khối @media (min-width:768px) cho màn rộng.
const { esc } = require('../lib/util');

const A = (n) => `/demo/nau-${n}.webp`; // ảnh trang trí của mẫu
const M = (n) => `/demo/toigian-mini-${n}.webp`; // phong bao nhỏ bay quanh hộp quà (dùng chung các mẫu Tối giản)

const base = {
  '--font-title': "'EB Garamond','Cormorant Garamond',Georgia,serif",
  '--font-script': "'The Nautigal',cursive",
  '--font-body': "Baskerville,'Libre Baskerville','Times New Roman',serif", // Baskerville có sẵn trên máy Apple như bản gốc
};

const evList = (d) => d.events.filter((e) => e.name || e.place);
// sự kiện chính của tiệc (khung "Thông tin tiệc cưới", bản đồ)
function partyEvent(d) {
  const evs = evList(d);
  return evs.find((e) => /khai tiệc|tiệc cưới/i.test(e.name)) || evs.find((e) => /tiệc/i.test(e.name)) || evs[evs.length - 1] || null;
}
const lunarOf = (ctx) => `( Tức ${ctx.lunar.replace(/^Nhằm /i, '')} )`;
// thứ | ngày | tháng, năm ở dòng dưới; vạch ngăn là chữ "|" (lời mời) hoặc gạch đứng (tiệc cưới)
const dateRow = (ctx, bar) => {
  const p = ctx.dparts;
  const sep = bar ? '<i class="bar"></i>' : '<i>|</i>';
  return `<div class="mn-date"><span>${esc(ctx.weekday)}</span>${sep}<b>${p.d}</b>${sep}<span>Tháng ${p.m}</span></div><p class="mn-year">${p.y}</p>`;
};
// lá rơi trên màn mở thiệp: vị trí / cỡ / nhịp cố định để trang dựng ra lần nào cũng giống nhau
const LEAVES = [[83, 0, 19, 8, 24.6, -20], [41, 1, 22, 10, 24.5, -2.5], [62, 0, 14, 9, 23.1, -1.5], [12, 1, 17, 12, 26, -9], [28, 0, 21, 7, 22.4, -14], [72, 1, 15, 11, 25.3, -6], [5, 0, 13, 9, 27.2, -17], [52, 1, 18, 8, 23.8, -11], [93, 0, 16, 10, 24.9, -4], [35, 1, 20, 6, 26.6, -22], [66, 0, 12, 12, 21.9, -8], [20, 1, 15, 9, 25.7, -19]];
const LEAF = '<svg viewBox="0 0 24 24" width="1em" height="1em"><path fill="currentColor" d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/></svg>';

module.exports = {
  id: 'nau',
  name: 'Nâu',
  group: 'toigian',
  desc: 'Tối giản ấm áp: giấy kem, khung thông tin màu be, khung ảnh vintage và cành lá khô',
  fonts: 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=The+Nautigal:wght@400;700&family=Cormorant+Garamond:wght@500;600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:wght@400;500;600&family=Ms+Madi&display=swap',
  palettes: [
    { id: 'nau', name: 'Nâu', swatch: ['#f6eadd', '#7c6a60'], vars: { ...base, '--page': '#ffffff', '--bg': '#fff7f3', '--paper': '#fffaf5', '--ink': '#7c6a60', '--muted': '#918077', '--accent': '#7c6a60', '--accent-ink': '#ded9d7', '--gold': '#c9a97e', '--line': '#e6d9cc', '--mn-name': '#827771', '--mn-panel': '#f6eadd', '--mn-hi': '#5e4c42', '--mn-op1': '#f3e6da', '--mn-op2': '#e8d5c4', '--mn-op3': '#dcc6b2' } },
  ],
  // dữ liệu xem thử theo bản gốc: ảnh của mẫu, tên & ngày như trang demo, lễ buổi sáng, tiệc tối có đón khách / khai tiệc
  demo: {
    groom: { name: 'Hoàng Nam', fullName: 'Nguyễn Hoàng Nam', father: 'Trần Quốc Hưng', mother: 'Nguyễn Thị Hồng', address: 'Quận 1, TP. Hồ Chí Minh' },
    bride: { name: 'Thảo Vy', fullName: 'Trần Thảo Vy', father: 'Lê Văn Thành', mother: 'Phạm Thị Lan', address: 'Quận 3, TP. Hồ Chí Minh' },
    date: '2026-01-03',
    time: '18:00',
    cover: '/demo/nau-1.jpg',
    photos: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `/demo/nau-${n}.jpg`),
    story: '',
    message: 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!',
    events: [
      { name: 'Lễ Thành Hôn', date: '2026-01-03', time: '09:00', place: 'Tư gia', address: '', mapUrl: '' },
      { name: 'Đón khách', date: '2026-01-03', time: '17:30', place: '', address: '', mapUrl: '' },
      { name: 'Khai tiệc', date: '2026-01-03', time: '18:00', place: 'Trung Tâm Hội Nghị White Palace', address: '194 Hoàng Văn Thụ, Phường 9, Quận Phú Nhuận, TP. Hồ Chí Minh', mapUrl: '' },
      { name: 'Nghi thức cưới', date: '2026-01-03', time: '18:30', place: '', address: '', mapUrl: '' },
      { name: 'Cắt bánh & nâng ly', date: '2026-01-03', time: '19:00', place: '', address: '', mapUrl: '' },
      { name: 'Kết thúc tiệc', date: '2026-01-03', time: '20:30', place: '', address: '', mapUrl: '' },
    ],
  },
  // xác nhận tham dự mở trong hộp thoại từ khung tiệc cưới (như bản gốc), nên không có trong luồng trang
  layout: ['invite', 'story', 'gallery', 'calendar', 'events', 'wishes', 'gift', 'thanks'],

  title(text, sub) {
    return `<h2 class="mn-h">${esc(text)}</h2>${sub ? `<p class="sec-sub">${esc(sub)}</p>` : ''}`;
  },

  opener(ctx) {
    const p = ctx.dparts;
    return `
<div class="opener mn-opener" id="opener">
  <div class="mn-leaves" aria-hidden="true">${LEAVES.map(([l, c, s, w, t, dl]) => `<i style="left:${l}%;font-size:${s}px;--sway:${w}px;animation-duration:${t}s;animation-delay:${dl}s${c ? ';color:var(--muted)' : ''}">${LEAF}</i>`).join('')}</div>
  <div class="mn-ocard">
    <span class="mn-heart" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M12 21s-7.5-4.6-10-9.3C.3 8.3 2.2 4 6.3 4c2.3 0 3.9 1.3 5.7 3.4C13.8 5.3 15.4 4 17.7 4 21.8 4 23.7 8.3 22 11.7 19.5 16.4 12 21 12 21z"/></svg></span>
    <div class="mn-ofl"><img class="tl" src="${A('flower2-decoration')}" alt=""><img class="br" src="${A('flower2-decoration')}" alt=""></div>
    <div class="mn-obody">
      <h1 class="mn-onames"><span>${esc(ctx.g)}</span><i>&amp;</i><span>${esc(ctx.b)}</span></h1>
      <p class="mn-rule" aria-hidden="true"><span></span><b>❦</b><span></span></p>
      ${p ? `<p class="mn-odate">${+p.d} tháng ${+p.m}, ${p.y}</p>` : ''}
      <p class="mn-oto">${ctx.guest ? `Thân mời ${esc(ctx.guest.name)}` : 'Thân Mời'}</p>
      <button class="mn-obtn" id="openBtn"><span>Mở thiệp</span><i></i></button>
    </div>
  </div>
</div>`;
  },

  cover(ctx) {
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="mn-cover">
  <img class="mn-leafbg" src="${A('leaf-background')}" alt="">
  <img class="mn-house" src="${A('house-background')}" alt="">
  <p class="mn-wed">The Wedding Of</p>
  <div class="mn-names"><span>${esc(ctx.g)}</span><i>&amp;</i><span>${esc(ctx.b)}</span></div>
  <div class="mn-frame">
    ${photo ? `<div class="mn-frame-photo"><img src="${esc(photo)}" alt="Ảnh cưới"></div>` : ''}
    <img class="mn-frame-img" src="${A('frame-avatar')}" alt="">
    <span class="mn-orn mn-frame-fl"><img src="${A('flower2-decoration')}" alt=""></span>
  </div>
</header>`;
  },

  sections: {
    // khung be "Thông tin lễ cưới": bố mẹ hai bên, tên đầy đủ, nơi & giờ làm lễ
    invite(ctx) {
      const { d, dparts: p } = ctx;
      const strip = (s) => esc(s.replace(/^(Ông|Bà)\s+/i, ''));
      const fam = (x) => `<div class="mn-fam"><span class="k">Ông Bà</span><span class="n">${x.father ? `<span>${strip(x.father)}</span>` : ''}${x.mother ? `<span>${strip(x.mother)}</span>` : ''}</span>${x.address ? `<span class="a">${esc(x.address)}</span>` : ''}</div>`;
      const hasFam = d.groom.father || d.groom.mother || d.bride.father || d.bride.mother;
      const party = partyEvent(d);
      const cer = evList(d).find((e) => e !== party) || party;
      const time = cer && cer.time ? cer.time : d.time;
      return `
  <section class="sec mn-panel-wrap mn-invite reveal">
    <span class="mn-orn o1"><img src="${A('flower2-decoration')}" alt=""></span>
    <span class="mn-orn o2"><img src="${A('leaf-background')}" alt=""></span>
    <div class="mn-box">
      <h2 class="mn-h">Thông tin lễ cưới</h2>
      ${hasFam ? `<div class="mn-fams">${fam(d.groom)}<i></i>${fam(d.bride)}</div>` : ''}
      <p class="mn-lead">Trân trọng báo tin<br>lễ thành hôn của con chúng tôi</p>
      <div class="mn-couple">
        <h3>${esc(d.groom.fullName || d.groom.name)}</h3>
        <p class="mn-role">Chú rể</p>
        <p class="mn-amp">&amp;</p>
        <h3>${esc(d.bride.fullName || d.bride.name)}</h3>
        <p class="mn-role">Cô dâu</p>
      <script>(function(){
        // tên đầy đủ: cùng một cỡ chữ cho cả hai người, tối đa 43px, co lại cho vừa 97% bề ngang khung (như bản gốc)
        var hs=[].slice.call(document.currentScript.parentNode.querySelectorAll('h3'));
        function fit(){var k=1;hs.forEach(function(h){h.style.fontSize='43px';var r=document.createRange();r.selectNodeContents(h);var w=r.getBoundingClientRect().width;if(w)k=Math.min(k,h.getBoundingClientRect().width*.97/w);});hs.forEach(function(h){h.style.fontSize=Math.floor(43*k)+'px';});}
        fit();if(document.fonts)document.fonts.ready.then(fit);addEventListener('resize',fit);
      })()</script>
      </div>
      ${p ? `<div class="mn-when-block">
        <div class="mn-place">
          ${cer && cer.place ? `<p class="mn-lead">${esc(cer.name || 'Lễ thành hôn')} được cử hành tại<br>${esc(cer.place)}</p>` : ''}
          ${time ? '<p class="mn-at">Vào lúc</p>' : ''}
        </div>
        ${time ? `<p class="mn-time">${esc(time)}</p>` : ''}
        ${dateRow(ctx)}
        <p class="mn-lunar">${esc(lunarOf(ctx))}</p>
      </div>` : ''}
    </div>
  </section>`;
    },

    // album dạng xếp chồng: ảnh giữa lớn, hai bên hẹp và thấp hơn; vuốt / mũi tên để chuyển, đếm "1 / 8" bên dưới
    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      return `
  <section class="sec mn-album">
    <img class="mn-bgleaf" src="${A('leaf-background')}" alt="">
    <h2 class="mn-h">Album Ảnh</h2>
    <div class="mn-cf">
      <div class="mn-cf-stage">
        <button class="mn-cf-nav prev" type="button" aria-label="Ảnh trước">‹</button>
        <button class="mn-cf-nav next" type="button" aria-label="Ảnh sau">›</button>
        ${ph.map((u, i) => `<button class="ph" data-i="${i}" aria-label="Xem ảnh ${i + 1}"><img loading="lazy" src="${esc(u)}" alt=""></button>`).join('')}
      </div>
      <p class="mn-count"><b>1</b> / ${ph.length}</p>
    </div>
    <script>(function(){
      var s=document.currentScript.parentNode,st=s.querySelector('.mn-cf-stage'),cs=[].slice.call(st.querySelectorAll('.ph')),out=s.querySelector('.mn-count b'),k=0,n=cs.length;
      function go(i){k=(i+n)%n;cs.forEach(function(c,j){var o=j-k;if(o>n/2)o-=n;if(o<-n/2)o+=n;c.dataset.o=Math.abs(o)>1?'far':o;});out.textContent=k+1;}
      // chạm ảnh bên cạnh thì chuyển tới ảnh đó, chỉ ảnh giữa mới mở xem lớn
      st.addEventListener('click',function(e){var c=e.target.closest('.ph');if(c&&c.dataset.o!=='0'){e.stopPropagation();go(cs.indexOf(c));}},true);
      s.querySelector('.prev').onclick=function(){go(k-1)};s.querySelector('.next').onclick=function(){go(k+1)};
      var x0=null;st.addEventListener('pointerdown',function(e){x0=e.clientX});
      st.addEventListener('pointerup',function(e){if(x0!==null&&Math.abs(e.clientX-x0)>40){go(k+(e.clientX<x0?1:-1));}x0=null});
      go(0);
    })()</script>
  </section>`;
    },

    // khung be "Thông tin tiệc cưới": giờ, thứ | ngày | tháng, âm lịch, đón khách / khai tiệc, lịch tháng; nút mở hộp thoại xác nhận
    calendar(ctx, opts, h) {
      const { d, dparts: p } = ctx;
      if (!p) return '';
      const evs = evList(d);
      const party = partyEvent(d) || {};
      const time = party.time || d.time;
      const guestIn = evs.find((e) => e !== party && /đón khách/i.test(e.name) && e.time && (!e.date || e.date === ctx.date));
      const marks = party.time ? [guestIn, party].filter(Boolean) : [];
      const grid = d.show.calendar ? h.calGrid(ctx, `<p class="mn-calh">Tháng ${+p.m} / ${p.y}</p>`) : '';
      const cal = h.calendarLink(`Đám cưới ${ctx.g} & ${ctx.b}`, ctx.date, time, party.address || party.place);
      const rsvp = d.show.rsvp ? h.rsvp(ctx).replace('sec s-rsvp reveal', 's-rsvp') : '';
      return `
  <section class="sec mn-panel-wrap mn-party reveal">
    <span class="mn-orn o1"><img src="${A('leaf-background')}" alt=""></span>
    <span class="mn-orn o2"><img src="${A('flower2-decoration')}" alt=""></span>
    <div class="mn-box">
      <h2 class="mn-h">Thông tin tiệc cưới</h2>
      <div class="mn-party-body">
        <h3 class="mn-lead">Tiệc cưới sẽ diễn ra vào lúc:</h3>
        ${time ? `<p class="mn-time">${esc(time)}</p>` : ''}
        ${dateRow(ctx, true)}
        <p class="mn-lunar">${esc(lunarOf(ctx))}</p>
        ${marks.length ? `<div class="mn-marks">${marks.map((e) => `<div><span class="k">${esc(e.name)}</span><span class="t">${esc(e.time)}</span></div>`).join('')}</div>` : ''}
        ${grid ? `<div class="mn-calwrap">${grid}</div>` : ''}
        <a class="mn-link" target="_blank" rel="noopener" href="${esc(cal)}">Thêm vào lịch</a>
      </div>
      ${rsvp ? `<button class="mn-pill" type="button" onclick="document.getElementById('mnRsvp').showModal()">Xác nhận tham dự</button>` : ''}
    </div>
  </section>
  ${rsvp ? `<dialog class="mn-dlg mn-rsvp" id="mnRsvp"><button class="mn-x" type="button" aria-label="Đóng" onclick="this.closest('dialog').close()">×</button>${rsvp}</dialog>` : ''}`;
    },

    // nơi tổ chức tiệc (bản đồ) + lịch trình ngày cưới dạng dòng thời gian trong khung be
    events(ctx, opts, h) {
      const evs = evList(ctx.d);
      if (!evs.length) return '';
      const party = partyEvent(ctx.d);
      const icons = ['gate', 'cake', 'water'];
      const dir = party && (party.mapUrl || (party.address ? h.mapSearch(party.address) : ''));
      return `
  ${party && (party.place || party.address) ? `
  <section class="sec mn-venue reveal">
    <img class="mn-bghouse" src="${A('house-background')}" alt="">
    <h2 class="mn-h">Tiệc cưới sẽ tổ chức tại</h2>
    <p class="mn-addr">${esc([party.place, party.address].filter(Boolean).join(', '))}</p>
    ${party.address ? `<div class="mn-map"><iframe loading="lazy" title="Bản đồ" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(party.address)}&amp;output=embed"></iframe></div>` : ''}
    ${dir ? `<a class="mn-dir" target="_blank" rel="noopener" href="${esc(dir)}"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M3 11l18-8-8 18-2-8-8-2z"/></svg>Chỉ đường</a>` : ''}
  </section>` : ''}
  <section class="sec mn-panel-wrap mn-sched reveal">
    <span class="mn-orn o1"><img src="${A('flower2-decoration')}" alt=""></span>
    <div class="mn-box">
      <h2 class="mn-h">Lịch trình ngày cưới</h2>
      <ol class="mn-tl">
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
  <div class="mn-guestbook reveal">
    <img class="mn-bgleaf" src="${A('leaf-background')}" alt="">
    <img class="mn-note" src="${A('paper-note')}" alt="">
    <section class="sec s-wishes">
      <h2 class="mn-h">Sổ lưu bút</h2>
      <form class="mn-wform" id="wishForm">
        <input name="name" required maxlength="60" placeholder="Nhập tên*" value="${ctx.guest ? esc(ctx.guest.name) : ''}" aria-label="Tên">
        <textarea name="message" required maxlength="500" placeholder="Nhập lời chúc*" aria-label="Lời chúc"></textarea>
        <div class="mn-wrow"><p class="form-msg" role="status"></p><button type="submit">Gửi lời chúc</button></div>
      </form>
      <div class="wish-list" id="wishList">
        ${list.map((w) => `<div class="wish"><b>${esc(w.name)}</b><p>${esc(w.message)}</p></div>`).join('')}
      </div>
    </section>
  </div>`;
    },

    // hộp quà mừng: hộp quà nhún nhảy, phong bao nhỏ bay lên và hoa giấy khi rê / chạm; mở hộp thoại có mã QR hai bên
    gift(ctx, opts, h) {
      if (!ctx.d.show.gift) return '';
      const html = h.giftCard(ctx, ctx.d.gifts.groom, 'groom') + h.giftCard(ctx, ctx.d.gifts.bride, 'bride');
      if (!html) return '';
      const minis = [['double_dragon_green', 1], ['spring_garden_blue', 1], ['minimalism_darkblue', 1], ['nhat_binh_red', 1], ['boho_floral_pink', 3], ['mahal_pink', 3], ['song_hy_green', 3]];
      return `
  <section class="sec mn-giftbox reveal">
    <img class="mn-bghouse" src="${A('house-background')}" alt="">
    <h2 class="mn-h">Hộp Quà Mừng</h2>
    <button class="mn-gbtn" type="button" onclick="document.getElementById('mnGift').showModal()">
      <span class="mn-gwrap">
        <i class="sp">✦</i><i class="sp">✦</i><i class="sp">✦</i><i class="sp">✦</i>
        <span class="cf">${'<i></i>'.repeat(8)}</span>
        <span class="bob">
          <span class="sh"></span>
          ${minis.slice(0, 4).map(([n], i) => `<img class="dc d${i + 1}" src="${M(n)}" alt="">`).join('')}
          <img class="box" src="${A('giftbox')}" alt="">
          ${minis.slice(4).map(([n], i) => `<img class="dc d${i + 5}" src="${M(n)}" alt="">`).join('')}
        </span>
      </span>
      <span class="hint">Nhấn để mở</span>
    </button>
  </section>
  <dialog class="mn-dlg mn-giftdlg" id="mnGift">
    <div class="mn-dlg-head"><h2>Hộp Quà Mừng</h2><button class="mn-x" type="button" aria-label="Đóng" onclick="this.closest('dialog').close()">×</button></div>
    <div class="gifts">${html}</div>
  </dialog>`;
    },

    // dòng cuối trang = lời nhắn của cô dâu chú rể (mặc định "Sự hiện diện của quý khách…")
    thanks(ctx) {
      return `
  <section class="sec mn-thanks reveal">
    <p>${esc(ctx.d.message || 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!')}</p>
  </section>`;
    },
  },

  css: `
/* cột thiệp: nền kem + lớp giấy nhân màu 40% phủ toàn cột */
.tpl-nau .card{max-width:480px;background:var(--bg);color:var(--ink);font-family:var(--font-body);font-weight:300;line-height:1.5;box-shadow:none;isolation:isolate}
.tpl-nau .card::before{content:"";position:absolute;inset:0;z-index:-1;background:url('${A('paper')}') center top/100% auto;mix-blend-mode:multiply;opacity:.4;pointer-events:none}
.tpl-nau .sec{padding:0}
.tpl-nau .mn-h{position:relative;margin:0;font-family:'Times New Roman',Times,serif;font-weight:700;font-size:20px;line-height:1.5;letter-spacing:.03em;text-transform:uppercase;color:var(--ink)}
.tpl-nau .sec-sub{margin:4px 0 0;color:var(--muted);font-size:14px}
.tpl-nau .mn-orn{position:absolute;z-index:2;display:block;pointer-events:none;animation:mnFloat 5s ease-in-out infinite}
.tpl-nau .mn-orn img{display:block;width:100%;max-width:none;filter:drop-shadow(4px 4px 2px rgba(0,0,0,.25))}
@keyframes mnFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@media (prefers-reduced-motion:reduce){.tpl-nau .mn-orn,.tpl-nau .mn-leaves i{animation:none}}

/* ---- màn mở thiệp ---- */
.tpl-nau .mn-opener{background:linear-gradient(to bottom right,var(--mn-op1),var(--mn-op2),var(--mn-op3));padding:20px;overflow:hidden}
.tpl-nau .mn-leaves{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none}
.tpl-nau .mn-leaves i{position:absolute;top:-30px;display:block;line-height:1;color:var(--gold);animation:mnFall 24s ease-in-out infinite}
@keyframes mnFall{0%{transform:translateY(-8vh) translateX(0) rotate(0);opacity:0}10%{opacity:.5}50%{transform:translateY(48vh) translateX(var(--sway,20px)) rotate(180deg);opacity:.6}92%{opacity:.45}100%{transform:translateY(105vh) translateX(0) rotate(360deg);opacity:0}}
.tpl-nau .mn-ocard{position:relative;z-index:10;width:310px;max-width:100%;text-align:center;border-radius:8px;box-shadow:0 25px 60px -12px rgba(0,0,0,.45),0 8px 24px rgba(0,0,0,.2),0 0 40px color-mix(in srgb,var(--ink) 15%,transparent)}
.tpl-nau .mn-ofl{position:absolute;inset:0;border-radius:8px;overflow:hidden;background:color-mix(in srgb,var(--paper) 96%,transparent);border:1px solid color-mix(in srgb,var(--ink) 15%,transparent);pointer-events:none}
.tpl-nau .mn-ofl img{position:absolute;height:144px;width:auto;max-width:none;opacity:.7}
.tpl-nau .mn-ofl .tl{top:-3%;left:-20px;transform:translateX(-6%) rotate(25deg)}
.tpl-nau .mn-ofl .br{bottom:-3%;right:-20px;transform:translateX(6%) rotate(-25deg) scaleX(-1)}
.tpl-nau .mn-heart{position:absolute;left:50%;top:50px;z-index:2;width:56px;height:56px;display:grid;place-items:center;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle at 30% 30%,var(--ink),var(--mn-hi));color:#fff;box-shadow:0 4px 20px color-mix(in srgb,var(--ink) 50%,transparent)}
.tpl-nau .mn-obody{position:relative;z-index:1;padding:112px 24px 56px}
.tpl-nau .mn-onames{display:flex;flex-direction:column;align-items:center;margin:0 0 8px;font-family:var(--font-title);font-weight:400;font-size:30px;line-height:1.25;color:var(--ink)}
.tpl-nau .mn-onames span{display:block}
.tpl-nau .mn-onames i{display:block;font-family:var(--font-body);font-style:normal;font-size:18px;line-height:1}
.tpl-nau .mn-rule{display:flex;align-items:center;justify-content:center;gap:12px;margin:0 0 8px;font-size:14px;line-height:20px}
.tpl-nau .mn-rule b{font-weight:400;color:var(--ink);opacity:.7}
.tpl-nau .mn-rule span{width:40px;height:1px;background:linear-gradient(to right,transparent,var(--ink))}
.tpl-nau .mn-rule span:last-child{background:linear-gradient(to left,transparent,var(--ink))}
.tpl-nau .mn-odate{margin:0 0 20px;font-family:'Lora',serif;font-size:18px;line-height:28px;color:color-mix(in srgb,var(--ink) 72%,transparent)}
.tpl-nau .mn-oto{margin:0 auto 24px;max-width:300px;padding-bottom:8px;font-family:'Lora',serif;font-weight:300;font-size:18px;line-height:28px;color:color-mix(in srgb,var(--ink) 72%,transparent)}
.tpl-nau .mn-obtn{position:relative;overflow:hidden;padding:10px 32px;border:0;border-radius:999px;background:var(--ink);color:#fff;font-family:'Lora',serif;font-size:18px;line-height:28px;font-weight:600;box-shadow:0 4px 14px color-mix(in srgb,var(--ink) 35%,transparent)}
.tpl-nau .mn-obtn i{position:absolute;top:0;left:-100%;width:32px;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);animation:mnShine 3s ease-in-out infinite}
@keyframes mnShine{0%{left:-100%}50%,100%{left:100%}}

/* ---- trang bìa: khung ảnh vintage ---- */
.tpl-nau .mn-cover{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;padding:48px 16px 80px;text-align:center}
.tpl-nau .mn-leafbg{position:absolute;left:-24%;top:2%;width:52%;max-width:none;opacity:.12;pointer-events:none}
.tpl-nau .mn-house{position:absolute;left:50%;top:30%;width:130%;max-width:none;transform:translateX(-50%);opacity:.08;mix-blend-mode:multiply;pointer-events:none}
.tpl-nau .mn-wed{position:relative;margin:0;font-family:'Cormorant Garamond',serif;font-weight:600;font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:var(--mn-name)}
.tpl-nau .mn-names{position:relative;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px}
.tpl-nau .mn-names span{font-family:'Times New Roman',Times,serif;font-style:italic;font-size:clamp(30px,8.4vw,37px);color:var(--mn-name)}
.tpl-nau .mn-names i{font-family:var(--font-script);font-style:normal;font-size:42px;line-height:1;color:var(--muted)}
.tpl-nau .mn-frame{position:relative;width:88%;max-width:400px;margin-top:24px;aspect-ratio:1094/1554}
.tpl-nau .mn-frame-photo{position:absolute;left:11.5%;top:8%;z-index:1;width:72%;height:77%;overflow:hidden;background:#fff;transform:rotate(-4.78deg)}
.tpl-nau .mn-frame-photo img{width:100%;height:100%;object-fit:cover}
.tpl-nau .mn-frame-img{position:absolute;inset:0;z-index:2;width:100%;height:100%;max-width:none;filter:drop-shadow(4px 4px 4px rgba(0,0,0,.2));pointer-events:none}
.tpl-nau .mn-frame-fl{left:-5%;bottom:-6%;z-index:3;width:34%}

/* ---- khung be: nền be + lớp giấy nhân màu 50%, cành lá thò ra mép ---- */
.tpl-nau .mn-panel-wrap{position:relative;z-index:1;width:88%;max-width:420px;margin:0 auto}
.tpl-nau .mn-box{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;gap:24px;padding:36px 20px;border-radius:10px;background:var(--mn-panel);color:var(--ink);text-align:center;box-shadow:4px 4px 8px rgba(0,0,0,.18)}
.tpl-nau .mn-box::before{content:"";position:absolute;inset:0;border-radius:inherit;background:url('${A('paper')}') center/cover;mix-blend-mode:multiply;opacity:.5;pointer-events:none}
.tpl-nau .mn-box>*{position:relative}
.tpl-nau .mn-box p,.tpl-nau .mn-box h3{margin:0}
.tpl-nau .mn-lead{font-family:var(--font-body);font-size:16px;line-height:1.5;text-transform:uppercase}
.tpl-nau h3.mn-lead{font-weight:400}
.tpl-nau .mn-time{font-family:var(--font-body);font-size:20px;line-height:1.5}
.tpl-nau .mn-date{display:flex;align-items:center;justify-content:center;gap:24px;font-family:var(--font-body);color:var(--ink)}
.tpl-nau .mn-date span{font-size:12px;line-height:1.5;text-transform:uppercase}
.tpl-nau .mn-date span:first-child{text-align:right}
.tpl-nau .mn-date b{font-weight:300;font-size:30px;line-height:1.5}
.tpl-nau .mn-date i{display:flex;align-items:center;justify-content:center;font-style:normal;font-size:24px;line-height:1;color:color-mix(in srgb,var(--ink) 40%,transparent)}
.tpl-nau .mn-year{font-family:var(--font-body);font-size:18px;line-height:1.5}
.tpl-nau .mn-lunar{font-family:var(--font-body);font-size:12px;line-height:16px;letter-spacing:.25em;text-transform:uppercase;color:var(--muted)}

/* lời mời */
.tpl-nau .mn-invite .mn-box{padding:36px 20px 40px;border-radius:13px}
.tpl-nau .mn-invite .o1{right:-17%;bottom:-6%;width:32%;animation-duration:5.5s;animation-delay:.6s}
.tpl-nau .mn-invite .o1 img{transform:scaleX(-1)}
.tpl-nau .mn-invite .o2{left:-16%;top:33%;width:28%;animation-duration:6s;animation-delay:.3s}
.tpl-nau .mn-invite .o2 img{transform:rotate(10.57deg)}
.tpl-nau .mn-fams{display:grid;grid-template-columns:1fr auto 1fr;column-gap:14px;align-items:center;max-width:100%}
.tpl-nau .mn-fams>i{width:1px;height:50px;background:color-mix(in srgb,var(--ink) 33.3%,transparent)}
.tpl-nau .mn-fam{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0;font-family:var(--font-body);font-size:12px;line-height:1.5}
.tpl-nau .mn-fam .k,.tpl-nau .mn-fam .a{color:var(--muted)}
.tpl-nau .mn-fam .n{display:flex;flex-direction:column;align-items:center;gap:3px;font-weight:600;overflow-wrap:anywhere}
/* lưới bố mẹ của bản gốc luôn có 4 hàng cách 3px, kể cả khi không có địa chỉ */
.tpl-nau .mn-fam:not(:has(.a))::after{content:""}
.tpl-nau .mn-fam .a{margin-top:4px;font-size:10px;line-height:1.25}
.tpl-nau .mn-couple{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}
.tpl-nau .mn-couple h3{display:flex;align-items:center;justify-content:center;width:80%;min-height:80px;font-family:var(--font-title);font-weight:400;font-size:43px;line-height:52px;white-space:nowrap}
.tpl-nau .mn-role{font-family:'Cormorant Garamond',serif;font-size:10px;line-height:1.5;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.tpl-nau .mn-amp{font-family:'Ms Madi',cursive;font-size:35px;line-height:1.5}
.tpl-nau .mn-when-block{display:flex;flex-direction:column;align-items:center;gap:16px;width:100%}
.tpl-nau .mn-place{display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--muted)}
.tpl-nau .mn-at{margin-bottom:8px!important;font-family:var(--font-body);font-size:16px;line-height:1.5;text-transform:uppercase}

/* album */
.tpl-nau .mn-album{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;padding:40px 24px;overflow-x:clip}
.tpl-nau .mn-bgleaf{position:absolute;right:-18%;top:-6%;z-index:-1;width:46%;max-width:none;transform:rotate(38deg);opacity:.1;pointer-events:none}
.tpl-nau .mn-cf{position:relative;width:100%;max-width:380px;margin-top:20px}
.tpl-nau .mn-cf-stage{--h:340px;--w:calc(var(--h) * .6505);position:relative;height:var(--h);touch-action:pan-y}
.tpl-nau .mn-cf .ph{position:absolute;top:50%;left:calc(50% - var(--w) / 2);width:var(--w);height:92%;padding:0;border:0;border-radius:16px;overflow:hidden;background:var(--line);box-shadow:0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1);aspect-ratio:auto;transform:translateY(-50%);transition:all 1.1s ease-in-out;cursor:pointer}
.tpl-nau .mn-cf .ph img{width:100%;height:100%;object-fit:cover}
.tpl-nau .mn-cf .ph[data-o="0"]{z-index:3;box-shadow:0 0 0 2px rgba(255,255,255,.3),0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1)}
.tpl-nau .mn-cf .ph[data-o="1"],.tpl-nau .mn-cf .ph[data-o="-1"]{z-index:2;width:calc(var(--w) * .46);height:72%}
.tpl-nau .mn-cf .ph[data-o="1"]{left:calc(50% + var(--w) * .28)}
.tpl-nau .mn-cf .ph[data-o="-1"]{left:calc(50% - var(--w) * .74)}
.tpl-nau .mn-cf .ph[data-o="far"]{z-index:1;width:calc(var(--w) * .3);height:52%;opacity:0;pointer-events:none}
.tpl-nau .mn-cf-nav{display:none}
.tpl-nau .mn-count{margin:12px 0 0;text-align:center;font-family:var(--font-body);font-size:14px;line-height:20px;font-variant-numeric:tabular-nums;opacity:.6}
.tpl-nau .mn-count b{font-weight:400}

/* tiệc cưới + lịch */
.tpl-nau .mn-party{margin-bottom:16px}
.tpl-nau .mn-party .o1{right:-16%;top:15%;width:28%;animation-duration:5.5s;animation-delay:.9s}
.tpl-nau .mn-party .o1 img{transform:scaleY(-1) rotate(169.43deg)}
.tpl-nau .mn-party .o2{left:-21%;bottom:-6%;width:32%;animation-duration:6s;animation-delay:.2s}
.tpl-nau .mn-party-body{display:flex;flex-direction:column;align-items:center;gap:16px}
.tpl-nau .mn-party .mn-time{color:var(--muted)}
.tpl-nau .mn-party .mn-date span{font-family:'Times New Roman',Times,serif}
.tpl-nau .mn-party .mn-date .bar{width:2px;height:24px;background:var(--ink)}
.tpl-nau .mn-marks{display:flex;justify-content:center;gap:32px;margin-top:16px}
.tpl-nau .mn-marks div{display:flex;flex-direction:column;align-items:center}
.tpl-nau .mn-marks .k{font-family:var(--font-body);font-size:12px;line-height:16px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}
.tpl-nau .mn-marks .t{margin-top:4px;font-family:var(--font-body);font-size:18px;line-height:28px;font-weight:500}
.tpl-nau .mn-calwrap{margin-top:12px;padding:8px 16px 16px;border-radius:10px;background:var(--ink);color:var(--accent-ink);overflow:hidden}
.tpl-nau .mn-calwrap .cal{width:280px;max-width:none;margin:0}
.tpl-nau .mn-calh{margin:0!important;padding:10px 0;border-bottom:1px solid color-mix(in srgb,var(--accent-ink) 27%,transparent);font-family:var(--font-script);font-weight:400;font-size:24px;line-height:1.5;letter-spacing:.025em}
.tpl-nau .mn-party{--cal-hi:var(--accent-ink);--cal-on:#333}
.tpl-nau .mn-calwrap .cal-grid{row-gap:2px;padding:0 4px 8px;font-family:'Times New Roman',serif;font-size:12px;color:var(--accent-ink)}
.tpl-nau .mn-calwrap .cal-grid span{height:30px}
.tpl-nau .mn-calwrap .cal-grid .cal-w{height:auto;margin:0 -4px 8px;padding:6px 0;border-bottom:2px solid var(--accent-ink);font-size:10px;font-weight:500;opacity:.6;color:var(--accent-ink)}
.tpl-nau .mn-calwrap .cal-on::before{width:26px;height:24px}
.tpl-nau .mn-calwrap .cal-on b{font-size:11px}
.tpl-nau .mn-link{margin-top:12px;font-family:'Times New Roman',serif;font-size:14px;line-height:20px;color:var(--ink);text-decoration:underline;text-underline-offset:4px}
.tpl-nau .mn-pill{margin-top:4px;padding:8px 24px;border:0;border-radius:999px;background:var(--ink);color:var(--accent-ink);font-family:var(--font-body);font-size:14px;line-height:20px;letter-spacing:.025em;text-transform:uppercase}

/* nơi tổ chức */
.tpl-nau .mn-venue{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;padding:32px 24px}
.tpl-nau .mn-bghouse{position:absolute;left:50%;top:-10%;z-index:-1;width:135%;max-width:none;transform:translateX(-50%);opacity:.08;mix-blend-mode:multiply;pointer-events:none}
.tpl-nau .mn-venue .mn-h{font-size:16px}
.tpl-nau .mn-addr{position:relative;margin:8px auto 0;max-width:280px;font-family:var(--font-body);font-size:12px;line-height:1.625;color:var(--muted)}
.tpl-nau .mn-map{position:relative;width:100%;max-width:338px;height:268px;margin-top:12px;border-radius:15px;overflow:hidden;background:var(--line)}
.tpl-nau .mn-map iframe{width:100%;height:100%;border:0}
.tpl-nau .mn-dir{position:relative;margin-top:16px;display:inline-flex;align-items:center;gap:8px;padding:8px 20px;border-radius:999px;font-family:var(--font-body);font-weight:600;font-size:14px;line-height:20px;color:var(--muted);text-decoration:none}

/* lịch trình: lưới giờ | chấm | tên; vạch dọc nối từ chấm đầu tới chấm cuối, đi qua tâm từng chấm */
.tpl-nau .mn-sched{margin:16px auto}
.tpl-nau .mn-sched .mn-box{gap:16px;padding:36px 24px}
.tpl-nau .mn-sched .o1{right:-17%;top:-13%;width:27%;animation-delay:.7s}
.tpl-nau .mn-sched .o1 img{transform:scaleX(-1) rotate(-6.94deg)}
.tpl-nau .mn-tl{--gy:32px;display:grid;grid-template-columns:minmax(0,1fr) 16px minmax(0,1fr);align-items:center;column-gap:24px;row-gap:var(--gy);width:100%;max-width:460px;margin:0 auto;padding:0 8px;list-style:none;font-family:'Times New Roman',Times,serif}
.tpl-nau .mn-tl li{display:contents}
.tpl-nau .mn-tl .t{text-align:right;font-size:16px;letter-spacing:.025em;font-variant-numeric:tabular-nums;line-height:1.375;color:var(--ink)}
.tpl-nau .mn-tl .t b{position:relative;display:inline-block;font-weight:400}
.tpl-nau .mn-tl .ic{position:absolute;right:100%;top:50%;max-width:none;width:36px;height:36px;margin-right:30px;transform:translateY(-50%);object-fit:contain}
.tpl-nau .mn-tl .dot{position:relative;align-self:stretch;display:flex;align-items:center;justify-content:center}
.tpl-nau .mn-tl .dot::before{content:"";position:absolute;left:50%;width:1px;top:calc(-1 * var(--gy));bottom:calc(-1 * var(--gy));transform:translateX(-50%);background:color-mix(in srgb,var(--ink) 40%,transparent)}
.tpl-nau .mn-tl li:first-child .dot::before{top:50%}
.tpl-nau .mn-tl li:last-child .dot::before{bottom:50%}
.tpl-nau .mn-tl li:only-child .dot::before{display:none}
.tpl-nau .mn-tl .dot::after{content:"";position:relative;width:10px;height:10px;border-radius:50%;background:var(--ink);box-shadow:0 0 0 2px color-mix(in srgb,var(--ink) 13%,transparent)}
.tpl-nau .mn-tl .l{text-align:left;font-size:13px;line-height:1.5;color:var(--muted)}
.tpl-nau .mn-tl small{font-size:inherit;opacity:.8}

/* sổ lưu bút trên giấy ghi chú */
.tpl-nau .mn-guestbook{position:relative;z-index:1;overflow-x:clip;container-type:inline-size}
.tpl-nau .mn-guestbook .mn-bgleaf{left:-14%;right:auto;top:-8%;width:44%}
.tpl-nau .mn-note{position:absolute;left:50%;top:70px;width:100%;max-width:650px;transform:translateX(-50%);opacity:.95;filter:drop-shadow(4px 4px 4px rgba(0,0,0,.25));pointer-events:none}
.tpl-nau .s-wishes{position:relative;padding:68px 24px 32px;text-align:center;font-family:'Times New Roman',serif}
.tpl-nau .s-wishes .mn-h{transform:translateY(18px)}
.tpl-nau .mn-wform{display:flex;flex-direction:column;gap:16px;width:100%;max-width:300px;margin:24px auto 0;padding:16px;border-radius:8px}
.tpl-nau .mn-wform input,.tpl-nau .mn-wform textarea{width:100%;padding:12px 16px;border:1px solid var(--ink);border-radius:8px;background:transparent;color:var(--ink);font:400 14px/20px 'Times New Roman',serif;outline:none;resize:none}
.tpl-nau .mn-wform textarea{height:60px}
.tpl-nau .mn-wform ::placeholder{color:color-mix(in srgb,var(--ink) 55%,transparent)}
.tpl-nau .mn-wrow{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:-11px}
.tpl-nau .mn-wrow .form-msg{flex:1;margin:0;font-size:12px;text-align:left}
.tpl-nau .mn-wrow button{padding:8px 24px;border:0;border-radius:999px;background:var(--ink);color:var(--accent-ink);font:600 14px/20px 'Times New Roman',serif;text-transform:uppercase}
.tpl-nau .wish-list{width:100%;max-width:600px;max-height:500px;margin:max(65px,calc(73.6cqw - 247px)) auto 0;padding-right:8px;overflow-y:auto;text-align:left}
.tpl-nau .wish{margin:0 0 12px;padding:16px;border:1px solid color-mix(in srgb,var(--ink) 33.3%,transparent);border-radius:8px;background:rgba(255,255,255,.55);font-family:'Times New Roman',serif;font-size:14px;line-height:20px;color:var(--ink)}
.tpl-nau .wish b{font-weight:600;color:var(--ink)}
.tpl-nau .wish p{margin:8px 0 0;line-height:1.625}

/* hộp quà mừng (theo bản gốc): hộp nhún 5px, phong bao nhỏ bay lên và hoa giấy bắn ra khi rê / chạm */
.tpl-nau .mn-giftbox{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;padding:32px 24px 40px;overflow-x:clip}
.tpl-nau .mn-giftbox .mn-bghouse{top:8%;width:140%}
.tpl-nau .mn-giftbox .mn-h{margin-bottom:16px}
.tpl-nau .mn-gbtn{position:relative;width:260px;height:280px;padding:0;border:0;background:none;cursor:pointer;outline:none}
.tpl-nau .mn-gwrap{position:relative;display:flex;align-items:flex-end;justify-content:center;width:100%;height:100%;padding-bottom:26px}
.tpl-nau .mn-gwrap .sp{position:absolute;z-index:20;font-style:normal;color:var(--muted);opacity:0;animation:mnSpark 2s ease-in-out infinite}
.tpl-nau .mn-gwrap .sp:nth-child(1){top:8%;left:14%;font-size:22px}
.tpl-nau .mn-gwrap .sp:nth-child(2){top:18%;right:10%;font-size:16px;animation-delay:.6s}
.tpl-nau .mn-gwrap .sp:nth-child(3){top:32%;left:5%;font-size:14px;animation-delay:1.2s}
.tpl-nau .mn-gwrap .sp:nth-child(4){top:26%;right:5%;font-size:14px;animation-delay:1.7s}
.tpl-nau .mn-gwrap .cf{position:absolute;left:50%;bottom:187px;pointer-events:none}
.tpl-nau .mn-gwrap .cf i{position:absolute;left:50%;top:0;opacity:0;width:10px;height:5px;margin:-2.5px 0 0 -5px;border-radius:2px}
.tpl-nau .mn-gwrap .cf i:nth-child(1){width:11px;height:5.5px;margin:-2.75px 0 0 -5.5px;background:#ec4899}
.tpl-nau .mn-gwrap .cf i:nth-child(2){width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:var(--muted)}
.tpl-nau .mn-gwrap .cf i:nth-child(3){width:11px;height:5.5px;margin:-2.75px 0 0 -5.5px;background:#22c55e}
.tpl-nau .mn-gwrap .cf i:nth-child(4){width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:#3b82f6}
.tpl-nau .mn-gwrap .cf i:nth-child(5){width:12px;height:6px;margin:-3px 0 0 -6px;background:#a855f7}
.tpl-nau .mn-gwrap .cf i:nth-child(6){width:0;height:0;margin:-5px 0 0 -5px;border-radius:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:10px solid #facc15}
.tpl-nau .mn-gwrap .cf i:nth-child(7){background:var(--ink)}
.tpl-nau .mn-gwrap .cf i:nth-child(8){width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:#f97316}
.tpl-nau .mn-gwrap .bob{position:relative;display:block;width:200px;height:220px;animation:mnBob 3s ease-in-out infinite}
.tpl-nau .mn-gwrap .sh{position:absolute;left:50%;bottom:-8px;width:144px;height:12px;margin-left:-72px;border-radius:50%;background:rgba(0,0,0,.45);filter:blur(4px);animation:mnShadow 3s ease-in-out infinite}
.tpl-nau .mn-gwrap .box{position:absolute;left:50%;bottom:0;z-index:2;width:170px;max-height:220px;margin-left:-85px;object-fit:contain;transform-origin:50% 100%;filter:drop-shadow(0 10px 18px rgba(0,0,0,.25));transition:transform .3s}
.tpl-nau .mn-gwrap .dc{position:absolute;z-index:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.25))}
.tpl-nau .mn-gwrap .d1{left:-20px;top:10px;width:34px;rotate:-22deg}
.tpl-nau .mn-gwrap .d2{left:168px;top:2px;width:38px;rotate:20deg}
.tpl-nau .mn-gwrap .d3{left:-16px;top:120px;width:26px;rotate:-18deg}
.tpl-nau .mn-gwrap .d4{left:182px;top:114px;width:24px;rotate:14deg}
.tpl-nau .mn-gwrap .d5{left:-8px;top:172px;z-index:3;width:44px;rotate:8deg}
.tpl-nau .mn-gwrap .d6{left:26px;top:182px;z-index:3;width:26px;rotate:-10deg}
.tpl-nau .mn-gwrap .d7{left:118px;top:176px;z-index:3;width:40px;rotate:-14deg}
.tpl-nau .mn-gbtn:is(:hover,:focus-visible) .box{animation:mnPop .7s cubic-bezier(.34,1.56,.64,1) forwards}
.tpl-nau .mn-gbtn:is(:hover,:focus-visible) .dc{animation:mnFly1 1.6s ease-in-out infinite}
.tpl-nau .mn-gbtn:is(:hover,:focus-visible) .d2{animation-duration:1.8s;animation-delay:.15s;--fx:6px}
.tpl-nau .mn-gbtn:is(:hover,:focus-visible) .d3{animation-duration:1.4s;animation-delay:.3s;--fx:-4px}
.tpl-nau .mn-gbtn:is(:hover,:focus-visible) .d4{animation-duration:1.7s;animation-delay:.45s;--fx:5px}
.tpl-nau .mn-gbtn:is(:hover,:focus-visible) .d5{animation-duration:1.9s;animation-delay:.1s;--fx:-3px}
.tpl-nau .mn-gbtn:is(:hover,:focus-visible) .d6{animation-duration:1.3s;animation-delay:.35s;--fx:4px}
.tpl-nau .mn-gbtn:is(:hover,:focus-visible) .d7{animation-duration:1.7s;animation-delay:.2s;--fx:6px}
.tpl-nau .mn-gbtn:is(:hover,:focus-visible) .cf i{animation:mnConf 1s ease-out infinite}
.tpl-nau .mn-gbtn .cf i:nth-child(1){--cx:-55px;--cy:-130px;--cr:540deg;animation-delay:.05s}
.tpl-nau .mn-gbtn .cf i:nth-child(2){--cx:46px;--cy:-150px;--cr:-460deg;animation-delay:.12s}
.tpl-nau .mn-gbtn .cf i:nth-child(3){--cx:-12px;--cy:-160px;--cr:620deg;animation-delay:.2s}
.tpl-nau .mn-gbtn .cf i:nth-child(4){--cx:28px;--cy:-115px;--cr:-340deg;animation-delay:.3s}
.tpl-nau .mn-gbtn .cf i:nth-child(5){--cx:-34px;--cy:-105px;--cr:320deg;animation-delay:.35s}
.tpl-nau .mn-gbtn .cf i:nth-child(6){--cx:58px;--cy:-88px;--cr:-240deg;animation-delay:.4s}
.tpl-nau .mn-gbtn .cf i:nth-child(7){--cx:8px;--cy:-170px;--cr:420deg;animation-delay:.5s}
.tpl-nau .mn-gbtn .cf i:nth-child(8){--cx:-46px;--cy:-78px;--cr:-200deg;animation-delay:.55s}
@keyframes mnBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes mnShadow{0%,100%{transform:scaleX(1);opacity:.3}50%{transform:scaleX(.9);opacity:.18}}
@keyframes mnSpark{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1.15)}}
@keyframes mnHint{0%,100%{opacity:.45}50%{opacity:1}}
@keyframes mnPop{0%{transform:translateY(0) scale(1) rotate(0)}45%{transform:translateY(-14px) scale(1.08) rotate(-3deg)}100%{transform:translateY(-8px) scale(1.05) rotate(0)}}
@keyframes mnFly1{0%{translate:0;opacity:1}55%{translate:var(--fx,-6px) -30px;opacity:1}80%{translate:calc(var(--fx,-6px) * 2.3) -62px;opacity:0}81%{translate:0;opacity:0}100%{translate:0;opacity:1}}
@keyframes mnConf{0%{transform:translate(0,0) rotate(0);opacity:0}15%{opacity:1}100%{transform:translate(var(--cx),var(--cy)) rotate(var(--cr));opacity:0}}
.tpl-nau .mn-gbtn .hint{position:absolute;left:50%;bottom:0;transform:translateX(-50%);white-space:nowrap;font-family:system-ui,sans-serif;font-size:12px;line-height:16px;font-weight:500;color:var(--ink);animation:mnHint 2s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.tpl-nau .mn-gwrap *,.tpl-nau .mn-gbtn .hint{animation:none!important}}

/* hộp thoại (xác nhận tham dự, quà mừng) */
.tpl-nau .mn-dlg{width:min(448px,calc(100% - 32px));max-height:85vh;padding:0;border:0;border-radius:16px;background:#fff;color:#111827;box-shadow:0 25px 50px -12px rgba(0,0,0,.25);overflow:auto}
.tpl-nau .mn-dlg::backdrop{background:rgba(0,0,0,.5)}
.tpl-nau .mn-x{position:absolute;top:16px;right:16px;z-index:1;width:32px;height:32px;border:0;border-radius:50%;background:#f3f4f6;color:#6b7280;font-size:20px;line-height:1}
.tpl-nau .mn-rsvp .s-rsvp{padding:24px;text-align:left}
.tpl-nau .mn-rsvp .mn-h{margin:0 40px 4px 0;font-family:system-ui,sans-serif;font-size:20px;font-weight:600;letter-spacing:0;text-transform:none;color:#111827}
.tpl-nau .mn-rsvp .sec-sub{margin:0 0 24px;font-family:system-ui,sans-serif;color:#6b7280}
.tpl-nau .mn-rsvp .form{gap:16px;padding:0;border:0;background:none;font-family:system-ui,sans-serif}
.tpl-nau .mn-rsvp .form label{font-size:14px;font-weight:500;color:#374151}
.tpl-nau .mn-rsvp .form input:not([type=radio]),.tpl-nau .mn-rsvp .form select{padding:12px 16px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;font-size:16px;color:#111827}
.tpl-nau .mn-rsvp .choice label{padding:10px 12px;border:2px solid #e5e7eb;border-radius:12px;background:rgba(249,250,251,.5);font-size:14px;color:#374151}
.tpl-nau .mn-rsvp .choice label:has(input:checked){border-color:var(--ink)}
.tpl-nau .mn-rsvp .btn{padding:14px;border:0;border-radius:12px;background:var(--ink);color:var(--accent-ink);font-size:14px;font-weight:600;box-shadow:0 4px 12px -2px rgba(0,0,0,.2)}
.tpl-nau .mn-giftdlg{width:min(512px,calc(100% - 32px));background:var(--bg)}
.tpl-nau .mn-dlg-head{position:relative;padding:24px 24px 16px;background:var(--ink);text-align:center}
.tpl-nau .mn-dlg-head h2{margin:0;font:700 20px/1.5 'Times New Roman',serif;letter-spacing:.03em;text-transform:uppercase;color:#fff;text-shadow:1px 1px 2px rgba(0,0,0,.2)}
.tpl-nau .mn-dlg-head .mn-x{top:12px;right:12px;background:none;color:rgba(255,255,255,.8)}
.tpl-nau .mn-giftdlg .gifts{display:flex;flex-direction:column;align-items:center;gap:16px;padding:16px}
.tpl-nau .mn-giftdlg .gift{flex:1;max-width:180px;padding:0;border:0;background:none;text-align:center;color:var(--ink);font-family:system-ui,sans-serif}
.tpl-nau .mn-giftdlg .gift-who{min-height:2rem;margin:0 0 8px;font:500 12px/1.4 system-ui,sans-serif;color:var(--ink)}
.tpl-nau .mn-giftdlg .gift img{width:128px;height:128px;margin:0 auto 8px;padding:8px;border:2px solid color-mix(in srgb,var(--ink) 12.5%,transparent);border-radius:12px;background:#fff;box-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1)}
.tpl-nau .mn-giftdlg .gift p{margin:2px 0;font-size:10px}
.tpl-nau .mn-giftdlg .gift-acc{gap:6px;font-family:ui-monospace,monospace;letter-spacing:0}
.tpl-nau .mn-giftdlg .gift-holder{font-weight:600;color:var(--ink)}
.tpl-nau .mn-giftdlg .copy{padding:4px 8px;border:0;border-radius:999px;background:color-mix(in srgb,var(--ink) 8.2%,transparent);color:var(--ink);font-size:10px;font-weight:500}
@media (max-width:639px){.tpl-nau .mn-giftdlg{margin:auto auto 0;width:100%;max-width:none;border-radius:16px 16px 0 0}}

.tpl-nau .mn-thanks{display:flex;flex-direction:column;align-items:center;padding:0 24px 40px}
.tpl-nau .mn-thanks p{margin:0;white-space:pre-line;font-family:'Times New Roman',serif;font-size:12px;line-height:1.5;color:var(--ink)}
.tpl-nau .s-story{position:relative;z-index:1;padding:32px 24px;font-family:'Times New Roman',serif;font-size:16px}
.tpl-nau .credit{position:relative;padding:0 0 12px;font-size:12px;opacity:.5;color:var(--ink)}

@media (min-width:640px){
  .tpl-nau .mn-ocard{width:340px}
  .tpl-nau .mn-onames{font-size:36px;line-height:1.1}
  .tpl-nau .mn-onames i{font-size:20px}
  .tpl-nau .mn-obtn{font-weight:500}
  .tpl-nau .mn-giftdlg{width:min(576px,calc(100% - 32px))}
  .tpl-nau .mn-giftdlg .gifts{flex-direction:row;flex-wrap:wrap;align-items:flex-start;justify-content:center;padding:24px}
  .tpl-nau .mn-giftdlg .gift img{width:160px;height:160px}
  .tpl-nau .mn-giftdlg .gift{max-width:none}
}
/* màn hình rộng: cột 900px có viền mảnh, các khối lớn hơn như bản gốc */
@media (min-width:768px){
  .tpl-nau .card{max-width:900px;border:1px solid color-mix(in srgb,var(--ink) 13%,transparent)}
  .tpl-nau .mn-ocard{width:520px}
  .tpl-nau .mn-ofl img{height:320px}
  .tpl-nau .mn-ofl .tl{top:-7%;left:-40px;transform:translateX(-11%) rotate(25deg)}
  .tpl-nau .mn-ofl .br{bottom:30%;right:-40px;transform:translateX(11%) rotate(-25deg) scaleX(-1)}
  .tpl-nau .mn-obody{padding:96px 24px 32px}
  .tpl-nau .mn-oto{max-width:380px}
  .tpl-nau .mn-cover{padding-bottom:128px}
  .tpl-nau .mn-wed{font-size:16px}
  .tpl-nau .mn-names{gap:12px;margin-top:16px}
  .tpl-nau .mn-names span{font-size:46px}
  .tpl-nau .mn-names i{font-size:54px}
  .tpl-nau .mn-frame{max-width:520px;margin-top:32px}
  .tpl-nau .mn-panel-wrap{max-width:560px}
  .tpl-nau .mn-lead{font-size:20px}
  .tpl-nau .mn-couple{gap:16px}
  .tpl-nau .mn-couple h3{line-height:60px}
  .tpl-nau .mn-when-block{gap:20px}
  .tpl-nau .mn-at{font-size:18px}
  .tpl-nau .mn-time{font-size:30px}
  .tpl-nau .mn-date span{font-size:16px}
  .tpl-nau .mn-date b{font-size:40px}
  .tpl-nau .mn-year{font-size:24px}
  .tpl-nau .mn-lunar{font-size:14px;line-height:20px}
  .tpl-nau .mn-cf{max-width:600px}
  .tpl-nau .mn-cf-stage{--h:520px}
  .tpl-nau .mn-cf .ph[data-o="1"],.tpl-nau .mn-cf .ph[data-o="-1"]{width:calc(var(--w) * .44);height:74%}
  .tpl-nau .mn-cf .ph[data-o="-1"]{left:calc(50% - var(--w) * .72)}
  .tpl-nau .mn-cf-nav{position:absolute;top:50%;z-index:5;display:flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border:0;border-radius:50%;background:color-mix(in srgb,var(--paper) 60%,transparent);color:var(--ink);font-size:22px;line-height:1;transform:translateY(-50%)}
  .tpl-nau .mn-cf-nav.prev{left:0}
  .tpl-nau .mn-cf-nav.next{right:0}
  .tpl-nau .mn-party-body{gap:20px}
  .tpl-nau .mn-marks .t{font-size:20px}
  .tpl-nau .mn-calwrap .cal{width:330px}
  .tpl-nau .mn-calwrap .cal-grid{font-size:13px}
  .tpl-nau .mn-calwrap .cal-grid span{height:34px}
  .tpl-nau .mn-calwrap .cal-grid .cal-w{font-size:11px}
  .tpl-nau .mn-calwrap .cal-on::before{width:30px;height:28px}
  .tpl-nau .mn-calwrap .cal-on b{font-size:12px}
  .tpl-nau .mn-map{max-width:560px;height:380px}
  .tpl-nau .mn-dir{margin-top:20px}
  .tpl-nau .mn-addr{max-width:440px;font-size:14px}
  .tpl-nau .mn-dir{font-size:16px;line-height:24px}
  .tpl-nau .mn-tl{--gy:40px;column-gap:32px}
  .tpl-nau .mn-tl .t{font-size:17px}
  .tpl-nau .mn-tl .l{font-size:15px}
  .tpl-nau .mn-note{top:85px}
  .tpl-nau .s-wishes{padding-top:130px}
  .tpl-nau .mn-wform{max-width:400px}
  .tpl-nau .mn-wform textarea{height:130px}
  .tpl-nau .wish-list{margin-top:130px}
  .tpl-nau .mn-thanks p{font-size:13px;max-width:560px}
}
@media (min-width:1024px){
  .tpl-nau .mn-ocard{width:600px}
  .tpl-nau .mn-oto{max-width:440px}
  .tpl-nau .mn-wform textarea{height:150px}
}
`,
};
