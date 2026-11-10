// Mẫu "Nâu Đậm" (Minimalism Nâu đậm) — cổ điển ấm: nền giấy, khối nâu cà phê, phong bì có hoa khô, đường chỉ vàng.
// Kích thước lấy theo bản gốc (Tailwind): số đầu cho điện thoại, khối @media (min-width:768px) cho màn rộng.
const { esc } = require('../lib/util');

const A = (n) => `/demo/naudam-${n}.webp`; // ảnh trang trí của mẫu
const M = (n) => `/demo/toigian-mini-${n}.webp`; // phong bao nhỏ bay quanh hộp quà (dùng chung các mẫu Tối giản)

const base = {
  '--font-title': "'Viaoda Libre','EB Garamond',Georgia,serif",
  '--font-script': "'The Nautigal',cursive",
  '--font-body': "Baskerville,'Libre Baskerville','Times New Roman',serif", // Baskerville có sẵn trên máy Apple như bản gốc
};

const evList = (d) => d.events.filter((e) => e.name || e.place);
// sự kiện chính của tiệc (khung "Thông tin tiệc cưới", bản đồ) và mốc ngay trước nó (đón khách)
function partyEvent(d) {
  const evs = evList(d);
  return evs.find((e) => /khai tiệc|tiệc cưới/i.test(e.name)) || evs.find((e) => /tiệc/i.test(e.name)) || evs[evs.length - 1] || null;
}
// lễ chính trong lời mời: sự kiện có tên "thành hôn / vu quy / lễ cưới" và có địa điểm, nếu không thì sự kiện có địa điểm đầu tiên
function ceremonyEvent(d, party) {
  const evs = evList(d).filter((e) => e !== party && e.place);
  return evs.find((e) => /thành hôn|vu quy|lễ cưới/i.test(e.name)) || evs[0] || null;
}
const lunarOf = (ctx) => `( Tức ${ctx.lunar.replace(/^Nhằm /i, '')} )`;
// ngày | tháng / năm (khung lời mời và tiệc cưới cùng một kiểu, cỡ chữ khác nhau qua CSS)
const dateRow = (p) => `<div class="mn-date"><b>${p.d}</b><i></i><span><em>Tháng ${p.m}</em><em>${p.y}</em></span></div>`;
// hoa nhỏ rơi trên màn mở thiệp: vị trí / cỡ / nhịp cố định để trang dựng ra lần nào cũng giống nhau
const PETALS = [[18, 0, 20, 9, 24.3, -0.4], [45, 1, 13, 1, 18.7, -17.7], [63, 2, 15, -1, 22.2, -1.6], [41, 1, 20, -28, 25.4, -12.6], [59, 1, 21, -13, 25, -11.4], [27, 2, 20, 20, 21.6, -3.6], [26, 1, 16, 10, 18.5, -17.2], [67, 0, 17, -17, 25.1, -11.1], [92, 2, 21, 18, 18.3, -9.3], [80, 2, 12, 9, 24.8, -1.6], [8, 1, 12, 7, 18.7, -14.8], [34, 1, 22, 22, 23, -17.6]];
const PETAL = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><g>' + [0, 60, 120, 180, 240, 300].map((r) => `<ellipse cx="12" cy="5" rx="2.2" ry="4.5"${r ? ` transform="rotate(${r} 12 12)"` : ''}/>`).join('') + '</g><circle cx="12" cy="12" r="1.8" fill-opacity=".45"/></svg>';
const PETAL_COLORS = ['var(--ink)', 'var(--gold)', 'var(--mn-cream)'];
// cành hoa nổi lên xuống (nhịp, độ trễ âm, biên độ như bản gốc)
const orn = (cls, img, dur, delay, amp) => `<span class="mn-orn ${cls}"><span style="animation-duration:${dur}s;animation-delay:${delay}s;--fy:${amp}px"><img src="${A(img)}" alt=""></span></span>`;

module.exports = {
  id: 'naudam',
  name: 'Nâu Đậm',
  group: 'toigian',
  desc: 'Cổ điển ấm áp: giấy kem, khối nâu cà phê, phong bì hoa khô và đường chỉ vàng',
  fonts: 'https://fonts.googleapis.com/css2?family=Viaoda+Libre&family=EB+Garamond:wght@400;500&family=The+Nautigal:wght@400;700&family=Playfair+Display:wght@600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:wght@300;400;500;600&family=Uchen&family=Ms+Madi&display=swap',
  palettes: [
    { id: 'nau-dam', name: 'Nâu đậm', swatch: ['#f7f5ee', '#593d2c'], vars: { ...base, '--page': '#ffffff', '--bg': '#f7f5ee', '--paper': '#f7f5ee', '--ink': '#593d2c', '--muted': '#827771', '--accent': '#593d2c', '--accent-ink': '#ded9d7', '--gold': '#c9a24a', '--line': '#e2dccf', '--mn-cream': '#ece4d8', '--mn-spark': '#b58b2f', '--mn-hi': '#3b1f0e', '--mn-op1': '#7d553e', '--mn-op2': '#593d2c', '--mn-op3': '#37261b' } },
  ],
  // dữ liệu xem thử theo bản gốc: tên, ngày, ảnh như trang demo; lịch trình lấy 6 mốc từ đón khách (thiệp giữ tối đa 6 sự kiện)
  demo: {
    groom: { name: 'Xuân Trường', fullName: 'Bùi Xuân Trường', father: 'Bùi Bảo Lâm', mother: 'Bùi Bích Thảo', address: '' },
    bride: { name: 'Diệu Linh', fullName: 'Trịnh Diệu Linh', father: 'Trịnh Vân An', mother: 'Trịnh Mỹ Linh', address: '' },
    date: '2027-11-17',
    time: '18:30',
    cover: '/demo/naudam-1.jpg',
    photos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `/demo/naudam-${n}.jpg`),
    story: '',
    message: 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!',
    events: [
      { name: 'Đón khách', date: '2027-11-17', time: '18:30', place: '', address: '', mapUrl: '' },
      { name: 'Lễ thành hôn', date: '2027-11-17', time: '19:00', place: 'Uri Palace', address: '', mapUrl: '' },
      { name: 'Rót rượu giao bôi và cắt bánh', date: '2027-11-17', time: '19:30', place: '', address: '', mapUrl: '' },
      { name: 'Khai tiệc', date: '2027-11-17', time: '20:00', place: 'Uri Palace', address: 'Bắc Ninh', mapUrl: '' },
      { name: 'Cô dâu chú rể chúc mừng từng bàn', date: '2027-11-17', time: '21:00', place: '', address: '', mapUrl: '' },
      { name: 'Kết thúc tiệc', date: '2027-11-17', time: '22:30', place: '', address: '', mapUrl: '' },
    ],
  },
  // xác nhận tham dự mở trong hộp thoại dưới khung tiệc cưới (như bản gốc), nên không có trong luồng trang
  layout: ['invite', 'story', 'gallery', 'calendar', 'events', 'wishes', 'gift', 'thanks'],

  title(text, sub) {
    return `<h2 class="mn-h">${esc(text)}</h2>${sub ? `<p class="sec-sub">${esc(sub)}</p>` : ''}`;
  },

  opener(ctx) {
    const p = ctx.dparts;
    return `
<div class="opener mn-opener" id="opener">
  <div class="mn-leaves" aria-hidden="true">${PETALS.map(([l, c, s, w, t, dl]) => `<i style="left:${l}%;font-size:${s}px;--sway:${w}px;animation-duration:${t}s;animation-delay:${dl}s;color:${PETAL_COLORS[c]}">${PETAL}</i>`).join('')}</div>
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
  <img class="mn-castle" src="${A('castle-background')}" alt="">
  <p class="mn-std">Save The Date</p>
  <img class="mn-gl2" src="${A('goldenline2-decoration')}" alt="">
  <div class="mn-env"><div>
    <img class="mn-env-back" src="${A('envelope-background')}" alt="">
    ${photo ? `<div class="mn-env-photo"><div><img src="${esc(photo)}" alt="Ảnh cưới"></div></div>` : ''}
    <img class="mn-env-front" src="${A('envelope-cover')}" alt="">
    ${orn('f1', 'flower-decoration', 5.9, -0.4, -9)}
    ${orn('f2', 'flower8-decoration', 6.7, -3.1, -7)}
    ${orn('f3', 'string-decoration', 7.3, -1.9, -7)}
  </div></div>
  <div class="mn-names">
    <div class="mn-n1"><span class="gl"><img src="${A('goldenline-decoration')}" alt=""><img src="${A('goldenline-decoration')}" alt=""></span><p>${esc(ctx.g)}</p></div>
    <span class="amp">&amp;</span>
    <p>${esc(ctx.b)}</p>
  </div>
</header>`;
  },

  sections: {
    // khung nâu "Thông tin lễ cưới": bố mẹ hai bên, tên đầy đủ, nơi & giờ làm lễ và tiệc
    invite(ctx) {
      const { d, dparts: p } = ctx;
      const strip = (s) => esc(s.replace(/^(Ông|Bà)\s+/i, ''));
      const fam = (x) => `<div class="mn-fam"><span class="k">Ông Bà</span><span class="n">${x.father ? `<span>${strip(x.father)}</span>` : ''}${x.mother ? `<span>${strip(x.mother)}</span>` : ''}</span>${x.address ? `<span class="a">${esc(x.address)}</span>` : ''}</div>`;
      const hasFam = d.groom.father || d.groom.mother || d.bride.father || d.bride.mother;
      const party = partyEvent(d);
      const cer = ceremonyEvent(d, party);
      // mỗi mốc: tên + nơi, "vào lúc giờ | thứ", ngày | tháng / năm, âm lịch
      const when = (label, e) => `
      <div class="mn-when-block">
        <p class="mn-lead mn-place">${esc(label)}${e.place ? `<br>${esc(e.place)}` : ''}</p>
        <div class="mn-when"><span>${e.time ? `Vào lúc ${esc(e.time)}` : ''}</span><span>${esc(ctx.weekday)}</span></div>
        ${dateRow(p)}
        <p class="mn-lunar">${esc(lunarOf(ctx))}</p>
      </div>`;
      return `
  <section class="sec mn-panel-wrap mn-invite reveal">
    ${orn('o1', 'flower2-decoration', 6.3, -2.6, -10)}
    ${orn('o2', 'flower-decoration', 7.9, -4.4, -7)}
    <div class="mn-box">
      <h2 class="mn-h">Thông tin lễ cưới</h2>
      ${hasFam ? `<div class="mn-fams">${fam(d.groom)}<i></i>${fam(d.bride)}</div>` : ''}
      <p class="mn-lead mn-intro">Trân trọng kính mời quý vị đến chung vui<br>cùng gia đình chúng tôi</p>
      <div class="mn-couple">
        <h3>${esc(d.groom.fullName || d.groom.name)}</h3>
        <p class="mn-role">Chú rể</p>
        <p class="mn-amp">&amp;</p>
        <h3>${esc(d.bride.fullName || d.bride.name)}</h3>
        <p class="mn-role">Cô dâu</p>
      <script>(function(){
        // tên đầy đủ: cùng một cỡ chữ cho cả hai người, tối đa 43px, co lại cho vừa 97% bề ngang khung (như bản gốc)
        var hs=[].slice.call(document.currentScript.parentNode.querySelectorAll('h3'));
        function fit(){var k=1;hs.forEach(function(h){h.style.fontSize='43px';var r=document.createRange();r.selectNodeContents(h);var w=r.getBoundingClientRect().width;if(w)k=Math.min(k,h.clientWidth*.97/w);});hs.forEach(function(h){h.style.fontSize=Math.floor(43*k)+'px';});}
        fit();if(document.fonts)document.fonts.ready.then(fit);addEventListener('resize',fit);
      })()</script>
      </div>
      ${p && cer ? when(cer.name || 'Lễ thành hôn', cer) : ''}
      ${p && party ? when('Tiệc cưới', party) : ''}
    </div>
  </section>`;
    },

    // album dạng xếp chồng: ảnh giữa lớn, hai bên hẹp và thấp hơn; vuốt / mũi tên để chuyển, đếm "1 / 10" bên dưới
    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      return `
  <section class="sec mn-album">
    <img class="mn-gl3" src="${A('goldenline3-decoration')}" alt=""><img class="mn-gl3 r" src="${A('goldenline3-decoration')}" alt="">
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

    // khung nâu "Thông tin tiệc cưới": giờ | thứ, ngày, âm lịch, đón khách / khai tiệc, đếm ngược, lịch tháng; nút xác nhận dưới khung
    calendar(ctx, opts, h) {
      const { d, dparts: p } = ctx;
      if (!p) return '';
      const evs = evList(d);
      const party = partyEvent(d) || {};
      const time = party.time || d.time;
      const at = evs.indexOf(party);
      const marks = at > 0 && evs[at - 1].time && (!evs[at - 1].date || evs[at - 1].date === ctx.date) ? [evs[at - 1], party] : [];
      const grid = d.show.calendar ? h.calGrid(ctx, `<p class="mn-calh">Tháng ${+p.m} / ${p.y}</p>`) : '';
      const cal = h.calendarLink(`Đám cưới ${ctx.g} & ${ctx.b}`, ctx.date, time, party.address || party.place);
      const rsvp = d.show.rsvp ? h.rsvp(ctx).replace('sec s-rsvp reveal', 's-rsvp') : '';
      const cd = (k, l) => `<b data-cd="${k}">0</b> ${l}`;
      return `
  <section class="sec mn-panel-wrap mn-party reveal">
    ${orn('o1', 'flower2-decoration', 5.5, -1.2, -8)}
    ${orn('o2', 'flower3-decoration', 8.7, -6.1, -11)}
    <div class="mn-box">
      <h2 class="mn-h">Thông tin tiệc cưới</h2>
      <div class="mn-party-body">
        <h3 class="mn-lead">Tiệc cưới sẽ diễn ra vào lúc:</h3>
        <div class="mn-when"><span>${esc(time || '')}</span><span>${esc(ctx.weekday)}</span></div>
        ${dateRow(p)}
        <p class="mn-lunar">${esc(lunarOf(ctx))}</p>
        ${marks.length ? `<div class="mn-marks">${marks.map((e) => `<div><span class="k">${esc(e.name)}</span><span class="t">${esc(e.time)}</span></div>`).join('')}</div>` : ''}
        ${d.show.countdown ? `<div class="mn-cd" role="timer"><h4>Cùng đếm ngược</h4><p>${cd('d', 'ngày')} ${cd('h', 'giờ')} ${cd('m', 'phút')} ${cd('s', 'giây')}</p></div>` : ''}
        ${grid ? `<div class="mn-calwrap">${grid}</div>` : ''}
        <a class="mn-link" target="_blank" rel="noopener" href="${esc(cal)}">Thêm vào lịch</a>
      </div>
    </div>
    ${rsvp ? `<div class="mn-pillrow"><button class="mn-pill" type="button" onclick="document.getElementById('mnRsvp').showModal()">Xác nhận tham dự</button></div>` : ''}
  </section>
  ${rsvp ? `<dialog class="mn-dlg mn-rsvp" id="mnRsvp"><button class="mn-x" type="button" aria-label="Đóng" onclick="this.closest('dialog').close()">×</button>${rsvp}</dialog>` : ''}`;
    },

    // nơi tổ chức tiệc (bản đồ) + lịch trình ngày cưới dạng dòng thời gian trong khung nâu
    events(ctx, opts, h) {
      const evs = evList(ctx.d);
      if (!evs.length) return '';
      const party = partyEvent(ctx.d);
      // ba biểu tượng (ly rượu, bánh cưới, chim) gắn từ mốc đón khách trở đi như bản gốc
      const icons = ['alcohol', 'cake', 'bird'];
      const k = evs.findIndex((e) => /đón khách/i.test(e.name));
      const from = k >= 0 ? k : 1;
      const dir = party && (party.mapUrl || (party.address ? h.mapSearch(party.address) : ''));
      return `
  ${party && (party.place || party.address) ? `
  <section class="sec mn-venue reveal">
    <h2 class="mn-h">Tiệc cưới sẽ tổ chức tại</h2>
    <p class="mn-addr">${esc(party.place || '')}${party.place && party.address ? '<br>' : ''}${esc(party.address || '')}</p>
    ${party.address ? `<div class="mn-map"><iframe loading="lazy" title="Bản đồ" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent([party.place, party.address].filter(Boolean).join(', '))}&amp;output=embed"></iframe></div>` : ''}
    ${dir ? `<a class="mn-dir" target="_blank" rel="noopener" href="${esc(dir)}"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M3 11l18-8-8 18-2-8-8-2z"/></svg>Chỉ đường</a>` : ''}
  </section>` : ''}
  <section class="sec mn-panel-wrap mn-sched reveal">
    ${orn('o1', 'flower3-decoration', 6.9, -3.7, -9)}
    <div class="mn-box">
      <h2 class="mn-h">Lịch trình ngày cưới</h2>
      <ol class="mn-tl">
        ${evs.map((e, i) => {
          const p = h.parts(e.date);
          const other = p && e.date !== ctx.date;
          const ic = icons[i - from];
          return `<li><span class="t"><b>${ic ? `<img class="ic ic-${ic}" src="${A(ic)}" alt="">` : ''}${esc(e.time) || '—'}</b></span><span class="dot"></span><span class="l">${esc(e.name)}${other ? ` <small>${p.d}/${p.m}</small>` : ''}</span></li>`;
        }).join('')}
      </ol>
    </div>
  </section>`;
    },

    // sổ lưu bút trong khung trắng; ô nhập dùng chữ gợi ý như bản gốc (giữ id/tên trường cho card.js)
    wishes(ctx, opts) {
      if (!ctx.d.show.wishes) return '';
      const list = opts.wishes || [];
      return `
  <div class="mn-panel-wrap mn-guestbook reveal">
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
      const minis = ['porcelain_red', 'dragon_phoenix_v3', 'porcelain_v2_red', 'porcelain_v2_pink', 'glass_garden_light_green', 'marble_yellow', 'porcelain_v2_green'];
      return `
  <section class="sec mn-giftbox reveal">
    <img class="mn-castle2" src="${A('castle2-background')}" alt="">
    <h2 class="mn-h">Hộp Quà Mừng</h2>
    <button class="mn-gbtn" type="button" onclick="document.getElementById('mnGift').showModal()">
      <span class="mn-gwrap">
        <i class="sp">✦</i><i class="sp">✦</i><i class="sp">✦</i><i class="sp">✦</i>
        <span class="cf">${'<i></i>'.repeat(8)}</span>
        <span class="bob">
          <span class="sh"></span>
          ${minis.slice(0, 4).map((n, i) => `<img class="dc d${i + 1}" src="${M(n)}" alt="">`).join('')}
          <img class="box" src="${A('giftbox')}" alt="">
          ${minis.slice(4).map((n, i) => `<img class="dc d${i + 5}" src="${M(n)}" alt="">`).join('')}
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
/* cột thiệp: nền kem + lớp giấy (666×1000, lặp) nhân màu 50% */
.tpl-naudam .card{max-width:480px;background:var(--bg);color:var(--ink);font-family:var(--font-body);font-weight:300;line-height:1.5;box-shadow:none;isolation:isolate}
.tpl-naudam .card::before{content:"";position:absolute;inset:0;z-index:-1;background:url('${A('paper')}') left top/666px 1000px repeat;mix-blend-mode:multiply;opacity:.5;pointer-events:none}
.tpl-naudam .sec{padding:0}
.tpl-naudam .mn-h{position:relative;margin:0;font-family:'Times New Roman',Times,serif;font-weight:700;font-size:20px;line-height:1.5;letter-spacing:.03em;text-transform:uppercase;color:var(--ink)}
.tpl-naudam .sec-sub{margin:4px 0 0;color:var(--muted);font-size:14px}
.tpl-naudam .mn-orn{position:absolute;z-index:20;display:block;pointer-events:none}
.tpl-naudam .mn-orn>span{display:block;animation:mnFloat 6s ease-in-out infinite}
.tpl-naudam .mn-orn img{display:block;width:100%;max-width:none;filter:drop-shadow(4px 4px 2px rgba(0,0,0,.25))}
@keyframes mnFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(var(--fy,-8px))}}
@media (prefers-reduced-motion:reduce){.tpl-naudam .mn-orn>span,.tpl-naudam .mn-env-photo,.tpl-naudam .mn-leaves i{animation:none}}

/* ---- màn mở thiệp ---- */
.tpl-naudam .mn-opener{background:linear-gradient(to bottom right,var(--mn-op1),var(--mn-op2),var(--mn-op3));padding:20px;overflow:hidden}
.tpl-naudam .mn-leaves{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none}
.tpl-naudam .mn-leaves i{position:absolute;top:-30px;display:block;line-height:1;animation:mnFall 24s ease-in-out infinite}
@keyframes mnFall{0%{transform:translateY(-8vh) translateX(0) rotate(0);opacity:0}10%{opacity:.5}50%{transform:translateY(48vh) translateX(var(--sway,20px)) rotate(180deg);opacity:.6}92%{opacity:.45}100%{transform:translateY(105vh) translateX(0) rotate(360deg);opacity:0}}
.tpl-naudam .mn-ocard{position:relative;z-index:10;width:310px;max-width:100%;text-align:center;border-radius:8px;box-shadow:0 25px 60px -12px rgba(0,0,0,.45),0 8px 24px rgba(0,0,0,.2),0 0 40px color-mix(in srgb,var(--ink) 15%,transparent)}
.tpl-naudam .mn-ofl{position:absolute;inset:0;border-radius:8px;overflow:hidden;background:color-mix(in srgb,var(--bg) 96%,transparent);border:1px solid color-mix(in srgb,var(--ink) 15%,transparent);pointer-events:none}
.tpl-naudam .mn-ofl img{position:absolute;height:144px;width:auto;max-width:none;opacity:.8}
.tpl-naudam .mn-ofl .tl{top:-10%;left:-35px;transform:translateX(-6%) rotate(25deg)}
.tpl-naudam .mn-ofl .br{bottom:-10%;right:-35px;transform:translateX(6%) rotate(-25deg) scaleX(-1)}
.tpl-naudam .mn-heart{position:absolute;left:50%;top:50px;z-index:2;width:56px;height:56px;display:grid;place-items:center;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle at 30% 30%,var(--ink),var(--mn-hi));color:var(--mn-cream);box-shadow:0 4px 20px color-mix(in srgb,var(--ink) 50%,transparent)}
.tpl-naudam .mn-obody{position:relative;z-index:1;padding:112px 24px 56px}
.tpl-naudam .mn-onames{display:flex;flex-direction:column;align-items:center;margin:0 0 8px;font-family:var(--font-title);font-weight:400;font-size:30px;line-height:1.25;color:var(--ink)}
.tpl-naudam .mn-onames span{display:block}
.tpl-naudam .mn-onames i{display:block;font-family:var(--font-body);font-style:normal;font-size:18px;line-height:1}
.tpl-naudam .mn-rule{display:flex;align-items:center;justify-content:center;gap:12px;margin:0 0 8px;font-size:14px;line-height:20px}
.tpl-naudam .mn-rule b{font-weight:400;color:var(--ink);opacity:.7}
.tpl-naudam .mn-rule span{width:40px;height:1px;background:linear-gradient(to right,transparent,var(--ink))}
.tpl-naudam .mn-rule span:last-child{background:linear-gradient(to left,transparent,var(--ink))}
.tpl-naudam .mn-odate{margin:0 0 20px;font-family:'Lora',serif;font-size:18px;line-height:28px;color:color-mix(in srgb,var(--ink) 72%,transparent)}
.tpl-naudam .mn-oto{margin:0 auto 24px;max-width:300px;padding-bottom:8px;font-family:'Lora',serif;font-weight:300;font-size:18px;line-height:28px;color:color-mix(in srgb,var(--ink) 72%,transparent)}
.tpl-naudam .mn-obtn{position:relative;overflow:hidden;padding:10px 32px;border:0;border-radius:999px;background:var(--ink);color:var(--mn-cream);font-family:'Lora',serif;font-size:18px;line-height:28px;font-weight:600;box-shadow:0 4px 14px color-mix(in srgb,var(--ink) 35%,transparent)}
.tpl-naudam .mn-obtn i{position:absolute;top:0;left:-100%;width:32px;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);animation:mnShine 3s ease-in-out infinite}
@keyframes mnShine{0%{left:-100%}50%,100%{left:100%}}

/* ---- trang bìa: phong bì + ảnh + hoa khô, tên giữa hai đường chỉ vàng ---- */
.tpl-naudam .mn-cover{position:relative;z-index:1;isolation:isolate;display:flex;flex-direction:column;align-items:center;padding:40px 24px 48px;text-align:center;overflow-x:clip}
.tpl-naudam .mn-castle{position:absolute;left:-59%;top:3%;width:208%;max-width:none;opacity:.15;pointer-events:none}
.tpl-naudam .mn-std{position:relative;margin:0;font-family:'Playfair Display',serif;font-weight:600;font-size:15px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink)}
.tpl-naudam .mn-gl2{position:relative;display:block;width:68px;max-width:none;margin-top:28px}
.tpl-naudam .mn-env{position:relative;width:66%;max-width:300px;margin-top:32px}
.tpl-naudam .mn-env>div{position:relative;aspect-ratio:292/341}
.tpl-naudam .mn-env-back{position:absolute;inset:0;z-index:1;width:100%;max-width:none}
.tpl-naudam .mn-env-photo{position:absolute;left:12%;top:18%;z-index:2;width:79.5%;--fy:-7px;animation:mnFloat 7.3s ease-in-out -1.9s infinite}
.tpl-naudam .mn-env-photo div{aspect-ratio:232/206;border:5px solid #fff;background:#fff;transform:rotate(3.92deg);box-shadow:2px 2px 4px rgba(0,0,0,.25)}
.tpl-naudam .mn-env-photo img{width:100%;height:100%;object-fit:cover}
.tpl-naudam .mn-env-front{position:absolute;left:0;top:43.1%;z-index:3;width:100%;max-width:none}
.tpl-naudam .mn-env .f1{left:65.8%;top:69.5%;z-index:4;width:54.5%}
.tpl-naudam .mn-env .f2{left:-12%;top:33.1%;z-index:5;width:39.4%}
.tpl-naudam .mn-env .f3{left:14.4%;top:12.3%;z-index:6;width:22.3%}
.tpl-naudam .mn-names{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;max-width:330px;margin-top:26%}
.tpl-naudam .mn-names p{width:100%;margin:0;font-family:var(--font-title);font-size:clamp(30px,10.2vw,45px);line-height:1;color:var(--ink)}
.tpl-naudam .mn-n1{position:relative;width:100%}
.tpl-naudam .mn-n1 .gl{position:absolute;inset:8px 0 auto;display:flex;align-items:flex-start;justify-content:center;gap:11%;pointer-events:none}
.tpl-naudam .mn-n1 .gl img{display:block;width:9%;max-width:40px}
.tpl-naudam .mn-n1 .gl img+img{transform:scaleX(-1)}
.tpl-naudam .mn-names .amp{display:block;font-family:'Ms Madi',cursive;font-size:clamp(38px,11.3vw,50px);line-height:1;color:var(--muted)}

/* ---- khung nâu: nền nâu + lớp giấy nhân màu 50%, hoa khô thò ra mép ---- */
.tpl-naudam .mn-panel-wrap{position:relative;z-index:1;isolation:isolate;width:88%;max-width:420px;margin:0 auto}
.tpl-naudam .mn-box{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;gap:24px;padding:36px 20px;border-radius:10px;background:var(--ink);color:var(--mn-cream);text-align:center;box-shadow:4px 4px 2px rgba(0,0,0,.25)}
.tpl-naudam .mn-box::before{content:"";position:absolute;inset:0;border-radius:inherit;background:url('${A('paper')}') center/cover;mix-blend-mode:multiply;opacity:.5;pointer-events:none}
.tpl-naudam .mn-box>*{position:relative}
.tpl-naudam .mn-box p,.tpl-naudam .mn-box h3{margin:0}
.tpl-naudam .mn-box .mn-h{color:var(--mn-cream)}
.tpl-naudam .mn-lead{font-family:var(--font-body);font-size:16px;line-height:1.5;text-transform:uppercase}
.tpl-naudam h3.mn-lead{font-weight:400}
.tpl-naudam .mn-intro{text-transform:none}
.tpl-naudam .mn-when{display:flex;justify-content:space-between;gap:12px;width:100%;max-width:190px;min-width:max-content;font-family:var(--font-body);font-size:12px;line-height:16px;text-transform:uppercase;white-space:nowrap;color:color-mix(in srgb,var(--mn-cream) 70%,transparent)}
.tpl-naudam .mn-date{display:flex;align-items:center;justify-content:center;gap:16px;font-family:'Times New Roman',Times,serif}
.tpl-naudam .mn-date b{font-family:var(--font-body);font-weight:300;font-size:50px;line-height:1}
.tpl-naudam .mn-date i{width:1px;height:46px;background:color-mix(in srgb,var(--mn-cream) 45%,transparent)}
.tpl-naudam .mn-date span{display:flex;flex-direction:column;align-items:flex-start;gap:4px;text-align:left}
.tpl-naudam .mn-date em{font-style:normal;font-size:14px;line-height:1.5;text-transform:uppercase}
.tpl-naudam .mn-lunar{font-family:var(--font-body);font-size:12px;line-height:16px;text-transform:uppercase;color:color-mix(in srgb,var(--mn-cream) 70%,transparent)}

/* lời mời */
.tpl-naudam .mn-invite .mn-box{padding:36px 20px 40px;border-radius:13px}
.tpl-naudam .mn-invite .o1{left:-35%;top:53.3%;width:50.2%}
.tpl-naudam .mn-invite .o1 img{transform:rotate(-8.27deg)}
.tpl-naudam .mn-invite .o2{left:85%;top:25.4%;width:52.2%;rotate:10deg}
.tpl-naudam .mn-fams{display:grid;grid-template-columns:1fr auto 1fr;column-gap:16px;align-items:center;max-width:100%}
.tpl-naudam .mn-fams>i{width:1px;height:50px;background:color-mix(in srgb,var(--mn-cream) 40%,transparent)}
.tpl-naudam .mn-fam{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0;font-family:var(--font-body);font-size:12px;line-height:1.5}
.tpl-naudam .mn-fam .k,.tpl-naudam .mn-fam .a{color:color-mix(in srgb,var(--mn-cream) 70%,transparent)}
.tpl-naudam .mn-fam .n{display:flex;flex-direction:column;align-items:center;gap:3px;font-weight:600;overflow-wrap:anywhere}
/* lưới bố mẹ của bản gốc luôn có 4 hàng cách 3px, kể cả khi không có địa chỉ */
.tpl-naudam .mn-fam:not(:has(.a))::after{content:""}
.tpl-naudam .mn-fam .a{margin-top:4px;font-size:10px;line-height:1.25}
.tpl-naudam .mn-couple{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}
.tpl-naudam .mn-couple h3{display:flex;align-items:center;justify-content:center;width:80%;min-height:80px;font-family:var(--font-title);font-weight:400;font-size:43px;line-height:52px;white-space:nowrap}
.tpl-naudam .mn-role{font-family:'Uchen',serif;font-size:10px;line-height:1.5;letter-spacing:.14em;text-transform:uppercase;color:color-mix(in srgb,var(--mn-cream) 70%,transparent)}
.tpl-naudam .mn-amp{font-family:'Ms Madi',cursive;font-size:35px;line-height:1.5}
.tpl-naudam .mn-when-block{display:flex;flex-direction:column;align-items:center;gap:16px;width:100%}
.tpl-naudam .mn-place{color:color-mix(in srgb,var(--mn-cream) 70%,transparent)}

/* album: hai nét chỉ vàng hai bên tiêu đề */
.tpl-naudam .mn-album{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;padding:40px 24px;overflow-x:clip}
.tpl-naudam .mn-gl3{position:absolute;left:13.9%;top:42px;z-index:2;display:block;width:11.8%;max-width:49px}
.tpl-naudam .mn-gl3.r{left:auto;right:13.9%;transform:scaleX(-1)}
.tpl-naudam .mn-cf{position:relative;width:100%;max-width:380px;margin-top:20px}
.tpl-naudam .mn-cf-stage{--h:340px;--w:calc(var(--h) * .6133);position:relative;height:var(--h);touch-action:pan-y}
.tpl-naudam .mn-cf .ph{position:absolute;top:50%;left:calc(50% - var(--w) / 2);width:var(--w);height:92%;padding:0;border:0;border-radius:16px;overflow:hidden;background:var(--line);box-shadow:0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1);aspect-ratio:auto;transform:translateY(-50%);transition:all 1.1s ease-in-out;cursor:pointer}
.tpl-naudam .mn-cf .ph img{width:100%;height:100%;object-fit:cover}
.tpl-naudam .mn-cf .ph[data-o="0"]{z-index:3;box-shadow:0 0 0 2px rgba(255,255,255,.3),0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1)}
.tpl-naudam .mn-cf .ph[data-o="1"],.tpl-naudam .mn-cf .ph[data-o="-1"]{z-index:2;width:calc(var(--w) * .46);height:72%}
.tpl-naudam .mn-cf .ph[data-o="1"]{left:calc(50% + var(--w) * .28)}
.tpl-naudam .mn-cf .ph[data-o="-1"]{left:calc(50% - var(--w) * .74)}
.tpl-naudam .mn-cf .ph[data-o="far"]{z-index:1;width:calc(var(--w) * .3);height:52%;opacity:0;pointer-events:none}
.tpl-naudam .mn-cf-nav{display:none}
.tpl-naudam .mn-count{margin:12px 0 0;text-align:center;font-family:var(--font-body);font-size:14px;line-height:20px;font-variant-numeric:tabular-nums;opacity:.6}
.tpl-naudam .mn-count b{font-weight:300}

/* tiệc cưới + đếm ngược + lịch */
.tpl-naudam .mn-party{margin-bottom:16px}
.tpl-naudam .mn-party .o1{left:-28%;top:21.8%;width:45%}
.tpl-naudam .mn-party .o1 img{transform:rotate(-16.74deg)}
.tpl-naudam .mn-party .o2{left:75.6%;top:71.8%;width:53.1%;rotate:-16.74deg}
.tpl-naudam .mn-party-body{display:flex;flex-direction:column;align-items:center;gap:16px}
.tpl-naudam .mn-party .mn-when{max-width:170px;font-size:13px;line-height:19.5px}
.tpl-naudam .mn-party .mn-date em{font-size:12px}
.tpl-naudam .mn-party .mn-date em+em{font-size:18px}
.tpl-naudam .mn-marks{display:flex;justify-content:center;gap:32px;margin-top:16px}
.tpl-naudam .mn-marks div{display:flex;flex-direction:column;align-items:center}
.tpl-naudam .mn-marks .k{font-family:var(--font-body);font-size:12px;line-height:16px;letter-spacing:.05em;text-transform:uppercase;color:color-mix(in srgb,var(--mn-cream) 70%,transparent)}
.tpl-naudam .mn-marks .t{margin-top:4px;font-family:var(--font-body);font-size:18px;line-height:28px;font-weight:500}
.tpl-naudam .mn-cd{display:flex;flex-direction:column;align-items:center;margin-top:16px;color:color-mix(in srgb,var(--mn-cream) 70%,transparent)}
.tpl-naudam .mn-cd h4{margin:0;font-family:var(--font-body);font-weight:400;font-size:16px;line-height:24px;text-transform:uppercase}
.tpl-naudam .mn-cd p{margin-top:8px!important;font-family:var(--font-body);font-size:14px;line-height:20px;font-variant-numeric:tabular-nums}
.tpl-naudam .mn-cd b{font-weight:300}
.tpl-naudam .mn-calwrap{margin-top:12px;padding:8px 16px 16px;border-radius:10px;background:var(--mn-cream);color:var(--ink);overflow:hidden}
.tpl-naudam .mn-calwrap .cal{width:280px;max-width:none;margin:0}
.tpl-naudam .mn-calh{margin:0!important;padding:10px 0;border-bottom:1px solid color-mix(in srgb,var(--ink) 27%,transparent);font-family:var(--font-script);font-weight:400;font-size:25px;line-height:1.5;letter-spacing:.025em}
.tpl-naudam .mn-party{--cal-hi:var(--ink);--cal-on:#fff}
.tpl-naudam .mn-calwrap .cal-grid{row-gap:2px;padding:0 4px 8px;font-family:'Times New Roman',serif;font-size:12px;color:var(--ink)}
.tpl-naudam .mn-calwrap .cal-grid span{height:30px}
.tpl-naudam .mn-calwrap .cal-grid .cal-w{height:auto;margin:0 -4px 8px;padding:6px 0;border-bottom:2px solid var(--ink);font-size:10px;font-weight:500;opacity:.6;color:var(--ink)}
.tpl-naudam .mn-calwrap .cal-on::before{width:26px;height:24px}
.tpl-naudam .mn-calwrap .cal-on b{font-size:11px}
.tpl-naudam .mn-link{margin-top:12px;font-family:'Times New Roman',serif;font-size:14px;line-height:20px;color:var(--mn-cream);text-decoration:underline;text-underline-offset:4px}
.tpl-naudam .mn-pillrow{position:relative;z-index:10;display:flex;justify-content:center;margin-top:24px}
.tpl-naudam .mn-pill{padding:6px 28px;border:1px solid var(--ink);border-radius:999px;background:var(--ink);color:var(--accent-ink);font-family:'Times New Roman',serif;font-size:13px;line-height:19.5px;letter-spacing:.025em;text-transform:uppercase}

/* nơi tổ chức */
.tpl-naudam .mn-venue{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;padding:32px 24px}
.tpl-naudam .mn-venue .mn-h{font-size:16px}
.tpl-naudam .mn-addr{position:relative;margin:8px auto 0;max-width:250px;font-family:var(--font-body);font-size:12px;line-height:1.625;color:color-mix(in srgb,var(--ink) 72%,transparent)}
.tpl-naudam .mn-map{position:relative;width:100%;max-width:338px;height:268px;margin-top:12px;border-radius:15px;overflow:hidden;background:var(--line)}
.tpl-naudam .mn-map iframe{width:100%;height:100%;border:0}
.tpl-naudam .mn-dir{position:relative;margin-top:16px;display:inline-flex;align-items:center;gap:8px;padding:8px 20px;border-radius:999px;font-family:var(--font-body);font-weight:600;font-size:14px;line-height:20px;color:color-mix(in srgb,var(--ink) 72%,transparent);text-decoration:none}

/* lịch trình: lưới giờ | chấm | tên; vạch dọc nối từ chấm đầu tới chấm cuối, đi qua tâm từng chấm */
.tpl-naudam .mn-sched{margin:16px auto}
.tpl-naudam .mn-sched .mn-box{gap:16px;padding:36px 24px}
.tpl-naudam .mn-sched .o1{left:78.9%;bottom:5%;width:45%}
.tpl-naudam .mn-sched .o1 img{transform:rotate(-11.94deg)}
.tpl-naudam .mn-tl{--gy:32px;display:grid;grid-template-columns:minmax(0,1fr) 16px minmax(0,1fr);align-items:center;column-gap:24px;row-gap:var(--gy);width:100%;max-width:460px;margin:0 auto;padding:0 8px;list-style:none;font-family:'Times New Roman',Times,serif}
.tpl-naudam .mn-tl li{display:contents}
.tpl-naudam .mn-tl .t{text-align:right;font-size:16px;letter-spacing:.025em;font-variant-numeric:tabular-nums;line-height:1.375}
.tpl-naudam .mn-tl .t b{position:relative;display:inline-block;font-weight:300}
.tpl-naudam .mn-tl .ic{position:absolute;right:100%;top:50%;max-width:none;width:46px;height:46px;margin-right:30px;transform:translateY(-50%);object-fit:contain}
.tpl-naudam .mn-tl .ic-cake{width:48px;height:48px}
.tpl-naudam .mn-tl .ic-bird{width:40px;height:40px}
.tpl-naudam .mn-tl .dot{position:relative;align-self:stretch;display:flex;align-items:center;justify-content:center}
.tpl-naudam .mn-tl .dot::before{content:"";position:absolute;left:50%;width:1px;top:calc(-1 * var(--gy));bottom:calc(-1 * var(--gy));transform:translateX(-50%);background:color-mix(in srgb,var(--mn-cream) 40%,transparent)}
.tpl-naudam .mn-tl li:first-child .dot::before{top:50%}
.tpl-naudam .mn-tl li:last-child .dot::before{bottom:50%}
.tpl-naudam .mn-tl li:only-child .dot::before{display:none}
.tpl-naudam .mn-tl .dot::after{content:"";position:relative;width:10px;height:10px;border-radius:50%;background:var(--mn-cream);box-shadow:0 0 0 2px color-mix(in srgb,var(--mn-cream) 13%,transparent)}
.tpl-naudam .mn-tl .l{text-align:left;font-size:13px;line-height:1.5;color:color-mix(in srgb,var(--mn-cream) 70%,transparent)}
.tpl-naudam .mn-tl small{font-size:inherit;opacity:.8}

/* sổ lưu bút trong khung trắng */
.tpl-naudam .mn-guestbook{margin:16px auto}
.tpl-naudam .s-wishes{position:relative;overflow:hidden;padding:32px 16px;border-radius:10px;background:#fff;box-shadow:4px 4px 2px rgba(0,0,0,.25);font-family:'Times New Roman',serif;color:var(--ink);text-align:center}
.tpl-naudam .mn-wform{display:flex;flex-direction:column;gap:16px;width:100%;max-width:248px;margin:24px auto 0;padding-top:16px}
.tpl-naudam .mn-wform input,.tpl-naudam .mn-wform textarea{width:100%;padding:12px 16px;border:1px solid var(--ink);border-radius:8px;background:transparent;color:var(--ink);font:400 14px/20px 'Times New Roman',serif;outline:none;resize:none}
.tpl-naudam .mn-wform textarea{height:70px}
.tpl-naudam .mn-wform ::placeholder{color:color-mix(in srgb,var(--ink) 55%,transparent)}
.tpl-naudam .mn-wrow{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:-16px}
.tpl-naudam .mn-wrow .form-msg{flex:1;margin:0;font-size:12px;text-align:left}
.tpl-naudam .mn-wrow button{padding:8px 24px;border:0;border-radius:999px;background:var(--ink);color:var(--accent-ink);font:600 14px/20px 'Times New Roman',serif;text-transform:uppercase}
.tpl-naudam .wish-list{width:100%;max-width:600px;max-height:500px;margin:32px auto 0;padding-right:8px;overflow-y:auto;text-align:left}
.tpl-naudam .wish{margin:0 0 12px;padding:16px;border:1px solid color-mix(in srgb,var(--ink) 20%,transparent);border-radius:8px;background:color-mix(in srgb,var(--ink) 3%,transparent);font-family:'Times New Roman',serif;font-size:14px;line-height:20px;color:var(--ink)}
.tpl-naudam .wish b{font-weight:600;color:var(--ink)}
.tpl-naudam .wish p{margin:8px 0 0;line-height:1.625}

/* hộp quà mừng (theo bản gốc): hộp nhún 5px, phong bao nhỏ bay lên và hoa giấy bắn ra khi rê / chạm */
.tpl-naudam .mn-giftbox{position:relative;z-index:1;isolation:isolate;display:flex;flex-direction:column;align-items:center;padding:32px 24px 40px;overflow-x:clip}
.tpl-naudam .mn-castle2{position:absolute;left:-26%;top:64px;z-index:-1;width:152%;max-width:none;opacity:.15;pointer-events:none}
.tpl-naudam .mn-giftbox .mn-h{margin-bottom:16px}
.tpl-naudam .mn-gbtn{position:relative;width:260px;height:280px;padding:0;border:0;background:none;cursor:pointer;outline:none}
.tpl-naudam .mn-gwrap{position:relative;display:flex;align-items:flex-end;justify-content:center;width:100%;height:100%;padding-bottom:26px}
.tpl-naudam .mn-gwrap .sp{position:absolute;z-index:20;font-style:normal;color:var(--mn-spark);opacity:0;animation:mnSpark 2s ease-in-out infinite}
.tpl-naudam .mn-gwrap .sp:nth-child(1){top:8%;left:14%;font-size:22px}
.tpl-naudam .mn-gwrap .sp:nth-child(2){top:18%;right:10%;font-size:16px;animation-delay:.6s}
.tpl-naudam .mn-gwrap .sp:nth-child(3){top:32%;left:5%;font-size:14px;animation-delay:1.2s}
.tpl-naudam .mn-gwrap .sp:nth-child(4){top:26%;right:5%;font-size:14px;animation-delay:1.7s}
.tpl-naudam .mn-gwrap .cf{position:absolute;left:50%;bottom:187px;pointer-events:none}
.tpl-naudam .mn-gwrap .cf i{position:absolute;left:50%;top:0;opacity:0;width:10px;height:5px;margin:-2.5px 0 0 -5px;border-radius:2px}
.tpl-naudam .mn-gwrap .cf i:nth-child(1){width:11px;height:5.5px;margin:-2.75px 0 0 -5.5px;background:#ec4899}
.tpl-naudam .mn-gwrap .cf i:nth-child(2){width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:var(--mn-spark)}
.tpl-naudam .mn-gwrap .cf i:nth-child(3){width:11px;height:5.5px;margin:-2.75px 0 0 -5.5px;background:#22c55e}
.tpl-naudam .mn-gwrap .cf i:nth-child(4){width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:#3b82f6}
.tpl-naudam .mn-gwrap .cf i:nth-child(5){width:12px;height:6px;margin:-3px 0 0 -6px;background:#a855f7}
.tpl-naudam .mn-gwrap .cf i:nth-child(6){width:0;height:0;margin:-5px 0 0 -5px;border-radius:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:10px solid #facc15}
.tpl-naudam .mn-gwrap .cf i:nth-child(7){background:var(--ink)}
.tpl-naudam .mn-gwrap .cf i:nth-child(8){width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:#f97316}
.tpl-naudam .mn-gwrap .bob{position:relative;display:block;width:200px;height:220px;animation:mnBob 3s ease-in-out infinite}
.tpl-naudam .mn-gwrap .sh{position:absolute;left:50%;bottom:-8px;width:144px;height:12px;margin-left:-72px;border-radius:50%;background:rgba(0,0,0,.45);filter:blur(4px);animation:mnShadow 3s ease-in-out infinite}
.tpl-naudam .mn-gwrap .box{position:absolute;left:50%;bottom:0;z-index:2;width:170px;max-height:220px;margin-left:-85px;object-fit:contain;transform-origin:50% 100%;filter:drop-shadow(0 10px 18px rgba(0,0,0,.25));transition:transform .3s}
.tpl-naudam .mn-gwrap .dc{position:absolute;z-index:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.25))}
.tpl-naudam .mn-gwrap .d1{left:-20px;top:10px;width:34px;rotate:-22deg}
.tpl-naudam .mn-gwrap .d2{left:168px;top:2px;width:38px;rotate:20deg}
.tpl-naudam .mn-gwrap .d3{left:-16px;top:120px;width:26px;rotate:-18deg}
.tpl-naudam .mn-gwrap .d4{left:182px;top:114px;width:24px;rotate:14deg}
.tpl-naudam .mn-gwrap .d5{left:-8px;top:172px;z-index:3;width:44px;rotate:8deg}
.tpl-naudam .mn-gwrap .d6{left:26px;top:182px;z-index:3;width:26px;rotate:-10deg}
.tpl-naudam .mn-gwrap .d7{left:118px;top:176px;z-index:3;width:40px;rotate:-14deg}
.tpl-naudam .mn-gbtn:is(:hover,:focus-visible) .box{animation:mnPop .7s cubic-bezier(.34,1.56,.64,1) forwards}
.tpl-naudam .mn-gbtn:is(:hover,:focus-visible) .dc{animation:mnFly1 1.6s ease-in-out infinite}
.tpl-naudam .mn-gbtn:is(:hover,:focus-visible) .d2{animation-duration:1.8s;animation-delay:.15s;--fx:6px}
.tpl-naudam .mn-gbtn:is(:hover,:focus-visible) .d3{animation-duration:1.4s;animation-delay:.3s;--fx:-4px}
.tpl-naudam .mn-gbtn:is(:hover,:focus-visible) .d4{animation-duration:1.7s;animation-delay:.45s;--fx:5px}
.tpl-naudam .mn-gbtn:is(:hover,:focus-visible) .d5{animation-duration:1.9s;animation-delay:.1s;--fx:-3px}
.tpl-naudam .mn-gbtn:is(:hover,:focus-visible) .d6{animation-duration:1.3s;animation-delay:.35s;--fx:4px}
.tpl-naudam .mn-gbtn:is(:hover,:focus-visible) .d7{animation-duration:1.7s;animation-delay:.2s;--fx:6px}
.tpl-naudam .mn-gbtn:is(:hover,:focus-visible) .cf i{animation:mnConf 1s ease-out infinite}
.tpl-naudam .mn-gbtn .cf i:nth-child(1){--cx:-55px;--cy:-130px;--cr:540deg;animation-delay:.05s}
.tpl-naudam .mn-gbtn .cf i:nth-child(2){--cx:46px;--cy:-150px;--cr:-460deg;animation-delay:.12s}
.tpl-naudam .mn-gbtn .cf i:nth-child(3){--cx:-12px;--cy:-160px;--cr:620deg;animation-delay:.2s}
.tpl-naudam .mn-gbtn .cf i:nth-child(4){--cx:28px;--cy:-115px;--cr:-340deg;animation-delay:.3s}
.tpl-naudam .mn-gbtn .cf i:nth-child(5){--cx:-34px;--cy:-105px;--cr:320deg;animation-delay:.35s}
.tpl-naudam .mn-gbtn .cf i:nth-child(6){--cx:58px;--cy:-88px;--cr:-240deg;animation-delay:.4s}
.tpl-naudam .mn-gbtn .cf i:nth-child(7){--cx:8px;--cy:-170px;--cr:420deg;animation-delay:.5s}
.tpl-naudam .mn-gbtn .cf i:nth-child(8){--cx:-46px;--cy:-78px;--cr:-200deg;animation-delay:.55s}
@keyframes mnBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes mnShadow{0%,100%{transform:scaleX(1);opacity:.3}50%{transform:scaleX(.9);opacity:.18}}
@keyframes mnSpark{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1.15)}}
@keyframes mnHint{0%,100%{opacity:.45}50%{opacity:1}}
@keyframes mnPop{0%{transform:translateY(0) scale(1) rotate(0)}45%{transform:translateY(-14px) scale(1.08) rotate(-3deg)}100%{transform:translateY(-8px) scale(1.05) rotate(0)}}
@keyframes mnFly1{0%{translate:0;opacity:1}55%{translate:var(--fx,-6px) -30px;opacity:1}80%{translate:calc(var(--fx,-6px) * 2.3) -62px;opacity:0}81%{translate:0;opacity:0}100%{translate:0;opacity:1}}
@keyframes mnConf{0%{transform:translate(0,0) rotate(0);opacity:0}15%{opacity:1}100%{transform:translate(var(--cx),var(--cy)) rotate(var(--cr));opacity:0}}
.tpl-naudam .mn-gbtn .hint{position:absolute;left:50%;bottom:0;transform:translateX(-50%);white-space:nowrap;font-family:system-ui,sans-serif;font-size:12px;line-height:16px;font-weight:500;color:var(--ink);animation:mnHint 2s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.tpl-naudam .mn-gwrap *,.tpl-naudam .mn-gbtn .hint{animation:none!important}}

/* hộp thoại (xác nhận tham dự, quà mừng) */
.tpl-naudam .mn-dlg{width:min(448px,calc(100% - 32px));max-height:85vh;padding:0;border:0;border-radius:16px;background:#fff;color:#111827;box-shadow:0 25px 50px -12px rgba(0,0,0,.25);overflow:auto}
.tpl-naudam .mn-dlg::backdrop{background:rgba(0,0,0,.5)}
.tpl-naudam .mn-x{position:absolute;top:16px;right:16px;z-index:1;width:32px;height:32px;border:0;border-radius:50%;background:#f3f4f6;color:#6b7280;font-size:20px;line-height:1}
.tpl-naudam .mn-rsvp .s-rsvp{padding:24px;text-align:left}
.tpl-naudam .mn-rsvp .mn-h{margin:0 40px 4px 0;font-family:system-ui,sans-serif;font-size:20px;font-weight:600;letter-spacing:0;text-transform:none;color:#111827}
.tpl-naudam .mn-rsvp .sec-sub{margin:0 0 24px;font-family:system-ui,sans-serif;color:#6b7280}
.tpl-naudam .mn-rsvp .form{gap:16px;padding:0;border:0;background:none;font-family:system-ui,sans-serif}
.tpl-naudam .mn-rsvp .form label{font-size:14px;font-weight:500;color:#374151}
.tpl-naudam .mn-rsvp .form input:not([type=radio]),.tpl-naudam .mn-rsvp .form select{padding:12px 16px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;font-size:16px;color:#111827}
.tpl-naudam .mn-rsvp .choice label{padding:10px 12px;border:2px solid #e5e7eb;border-radius:12px;background:rgba(249,250,251,.5);font-size:14px;color:#374151}
.tpl-naudam .mn-rsvp .choice label:has(input:checked){border-color:var(--ink)}
.tpl-naudam .mn-rsvp .btn{padding:14px;border:0;border-radius:12px;background:var(--ink);color:var(--accent-ink);font-size:14px;font-weight:600;box-shadow:0 4px 12px -2px rgba(0,0,0,.2)}
.tpl-naudam .mn-giftdlg{width:min(512px,calc(100% - 32px));background:var(--bg)}
.tpl-naudam .mn-dlg-head{position:relative;padding:24px 24px 16px;background:var(--ink);text-align:center}
.tpl-naudam .mn-dlg-head h2{margin:0;font:700 20px/1.5 'Times New Roman',serif;letter-spacing:.03em;text-transform:uppercase;color:#fff;text-shadow:1px 1px 2px rgba(0,0,0,.2)}
.tpl-naudam .mn-dlg-head .mn-x{top:12px;right:12px;background:none;color:rgba(255,255,255,.8)}
.tpl-naudam .mn-giftdlg .gifts{display:flex;flex-direction:column;align-items:center;gap:16px;padding:16px}
.tpl-naudam .mn-giftdlg .gift{flex:1;max-width:180px;padding:0;border:0;background:none;text-align:center;color:var(--ink);font-family:system-ui,sans-serif}
.tpl-naudam .mn-giftdlg .gift-who{margin:0 0 12px;font:500 14px/20px system-ui,sans-serif;color:var(--ink)}
.tpl-naudam .mn-giftdlg .gift img{width:176px;height:176px;margin:0 auto 12px;padding:8px;border:2px solid color-mix(in srgb,var(--ink) 12.5%,transparent);border-radius:12px;background:#fff;box-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1)}
.tpl-naudam .mn-giftdlg .gift p{margin:2px 0;font-size:12px}
.tpl-naudam .mn-giftdlg .gift-acc{gap:6px;font-family:ui-monospace,monospace;letter-spacing:0}
.tpl-naudam .mn-giftdlg .gift-holder{font-weight:600;color:var(--ink)}
.tpl-naudam .mn-giftdlg .copy{padding:6px 12px;border:0;border-radius:999px;background:color-mix(in srgb,var(--ink) 8.2%,transparent);color:var(--ink);font-size:12px;font-weight:500}
@media (max-width:639px){.tpl-naudam .mn-giftdlg{margin:auto auto 0;width:100%;max-width:none;border-radius:16px 16px 0 0}}

.tpl-naudam .mn-thanks{display:flex;flex-direction:column;align-items:center;padding:0 24px 24px}
.tpl-naudam .mn-thanks p{margin:0;white-space:pre-line;font-family:'Times New Roman',serif;font-size:11px;line-height:1.5;color:var(--ink)}
.tpl-naudam .s-story{position:relative;z-index:1;padding:32px 24px;font-family:'Times New Roman',serif;font-size:16px}
.tpl-naudam .credit{position:relative;padding:0 0 12px;font-size:12px;opacity:.5;color:var(--ink)}

@media (min-width:640px){
  .tpl-naudam .mn-ocard{width:340px}
  .tpl-naudam .mn-onames{font-size:36px;line-height:1.1}
  .tpl-naudam .mn-onames i{font-size:20px}
  .tpl-naudam .mn-obtn{font-weight:500}
  .tpl-naudam .mn-giftdlg{width:min(576px,calc(100% - 32px))}
  .tpl-naudam .mn-giftdlg .gifts{flex-direction:row;flex-wrap:wrap;align-items:flex-start;justify-content:center;padding:24px}
  .tpl-naudam .mn-giftdlg .gift img{width:192px;height:192px}
  .tpl-naudam .mn-giftdlg .gift{max-width:none}
}
/* màn hình rộng: cột 900px có viền mảnh, các khối lớn hơn như bản gốc */
@media (min-width:768px){
  .tpl-naudam .card{max-width:900px;border:1px solid color-mix(in srgb,var(--ink) 13%,transparent)}
  .tpl-naudam .mn-ocard{width:520px}
  .tpl-naudam .mn-ofl img{height:280px}
  .tpl-naudam .mn-ofl .tl{top:-20%;transform:translateX(-11%) rotate(25deg)}
  .tpl-naudam .mn-ofl .br{bottom:53%;transform:translateX(11%) rotate(-25deg) scaleX(-1)}
  .tpl-naudam .mn-obody{padding:96px 24px 32px}
  .tpl-naudam .mn-oto{max-width:380px}
  .tpl-naudam .mn-std{font-size:18px}
  .tpl-naudam .mn-gl2{width:86px}
  .tpl-naudam .mn-env{max-width:390px}
  .tpl-naudam .mn-env-photo div{border-width:7px}
  .tpl-naudam .mn-names{max-width:420px}
  .tpl-naudam .mn-panel-wrap{max-width:560px}
  .tpl-naudam .mn-invite .o1{left:-25%;top:50%;width:45.2%}
  .tpl-naudam .mn-invite .o2{left:80%;top:15%;width:50.2%}
  .tpl-naudam .mn-lead{font-size:20px}
  .tpl-naudam .mn-couple{gap:16px}
  .tpl-naudam .mn-couple h3{line-height:60px}
  .tpl-naudam .mn-when-block{gap:20px}
  .tpl-naudam .mn-when{max-width:220px;font-size:14px;line-height:20px}
  .tpl-naudam .mn-date b{font-size:57px}
  .tpl-naudam .mn-date em{font-size:18px}
  .tpl-naudam .mn-lunar{font-size:14px;line-height:20px}
  .tpl-naudam .mn-cf{max-width:600px}
  .tpl-naudam .mn-cf-stage{--h:520px}
  .tpl-naudam .mn-cf .ph[data-o="1"],.tpl-naudam .mn-cf .ph[data-o="-1"]{width:calc(var(--w) * .44);height:74%}
  .tpl-naudam .mn-cf .ph[data-o="-1"]{left:calc(50% - var(--w) * .72)}
  .tpl-naudam .mn-cf-nav{position:absolute;top:50%;z-index:5;display:flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border:0;border-radius:50%;background:color-mix(in srgb,var(--paper) 60%,transparent);color:var(--ink);font-size:22px;line-height:1;transform:translateY(-50%)}
  .tpl-naudam .mn-cf-nav.prev{left:0}
  .tpl-naudam .mn-cf-nav.next{right:0}
  .tpl-naudam .mn-party .o1{left:-30.5%;top:25%}
  .tpl-naudam .mn-party .o2{width:45%}
  .tpl-naudam .mn-party-body{gap:20px}
  .tpl-naudam .mn-party .mn-when{max-width:170px;font-size:15px;line-height:22.5px}
  .tpl-naudam .mn-party .mn-date em{font-size:16px}
  .tpl-naudam .mn-party .mn-date em+em{font-size:24px}
  .tpl-naudam .mn-marks .t{font-size:20px}
  .tpl-naudam .mn-cd p{font-size:18px;line-height:28px}
  .tpl-naudam .mn-calwrap .cal{width:330px}
  .tpl-naudam .mn-calwrap .cal-grid{font-size:13px}
  .tpl-naudam .mn-calwrap .cal-grid span{height:34px}
  .tpl-naudam .mn-calwrap .cal-grid .cal-w{font-size:11px}
  .tpl-naudam .mn-calwrap .cal-on::before{width:30px;height:28px}
  .tpl-naudam .mn-calwrap .cal-on b{font-size:12px}
  .tpl-naudam .mn-map{max-width:560px;height:380px}
  .tpl-naudam .mn-addr{max-width:440px;font-size:14px}
  .tpl-naudam .mn-dir{margin-top:20px;font-size:16px;line-height:24px}
  .tpl-naudam .mn-sched .o1{width:30%}
  .tpl-naudam .mn-tl{--gy:40px;column-gap:32px}
  .tpl-naudam .mn-tl .t{font-size:17px}
  .tpl-naudam .mn-tl .l{font-size:15px}
  .tpl-naudam .mn-wform{max-width:380px}
  .tpl-naudam .mn-wform textarea{height:110px}
  .tpl-naudam .mn-thanks p{font-size:13px;max-width:560px}
}
@media (min-width:1024px){
  .tpl-naudam .mn-ocard{width:600px}
  .tpl-naudam .mn-oto{max-width:440px}
}
`,
};
