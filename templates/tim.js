// Mẫu "Tím" (Minimalism Tím) — lãng mạn: nền giấy trắng, khối tím oải hương, phong bì hoa, nhà thờ mờ phía sau.
// Kích thước lấy theo bản gốc (Tailwind): số đầu cho điện thoại, khối @media (min-width:768px) cho màn rộng.
const { esc } = require('../lib/util');

const A = (n) => `/demo/tim-${n}.webp`; // ảnh trang trí của mẫu

const base = {
  '--font-title': "'Viaoda Libre','EB Garamond',Georgia,serif",
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
// ngày | tháng / năm (khung lời mời và tiệc cưới cùng một kiểu, cỡ chữ khác nhau qua CSS)
const dateRow = (p) => `<div class="mn-date"><b>${p.d}</b><i></i><span><em>Tháng ${p.m}</em><em>${p.y}</em></span></div>`;
// hoa nhỏ rơi trên màn mở thiệp: vị trí / cỡ / nhịp / màu cố định để trang dựng ra lần nào cũng giống nhau
const PETALS = [[18, 0, 20, 9, 24.3, -0.4], [45, 1, 13, 1, 18.7, -17.7], [63, 2, 15, -1, 22.2, -1.6], [41, 3, 20, -28, 25.4, -12.6], [59, 1, 21, -13, 25, -11.4], [27, 2, 20, 20, 21.6, -3.6], [26, 3, 16, 10, 18.5, -17.2], [67, 0, 17, -17, 25.1, -11.1], [92, 2, 21, 18, 18.3, -9.3], [80, 3, 12, 9, 24.8, -1.6], [8, 1, 12, 7, 18.7, -14.8], [34, 0, 22, 22, 23, -17.6]];
const PETAL = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><g>' + [0, 60, 120, 180, 240, 300].map((r) => `<ellipse cx="12" cy="5" rx="2.2" ry="4.5"${r ? ` transform="rotate(${r} 12 12)"` : ''}/>`).join('') + '</g><circle cx="12" cy="12" r="1.8" fill-opacity=".45"/></svg>';
const PETAL_COLORS = ['#efeaf6', 'var(--gold)', '#9a8cc0', '#b7a8d6'];
// cành hoa nổi lên xuống (nhịp, độ trễ như bản gốc)
const orn = (cls, img, dur, delay) => `<span class="mn-orn ${cls}"><span style="animation-duration:${dur}s;animation-delay:${delay}s"><img src="${A(img)}" alt=""></span></span>`;

module.exports = {
  id: 'tim',
  name: 'Oải Hương',
  group: 'toigian',
  desc: 'Lãng mạn: giấy trắng, khối tím oải hương, phong bì hoa và nhà thờ mờ phía sau',
  fonts: 'https://fonts.googleapis.com/css2?family=Viaoda+Libre&family=EB+Garamond:wght@400;500&family=The+Nautigal:wght@400;700&family=Playfair+Display:wght@600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:wght@300;400;500;600&family=Uchen&family=Ms+Madi&display=swap',
  palettes: [
    { id: 'tim', name: 'Tím', swatch: ['#efeaf6', '#7869a0'], vars: { ...base, '--page': '#ffffff', '--bg': '#ffffff', '--paper': '#fffdff', '--ink': '#7869a0', '--muted': '#787a6c', '--accent': '#7869a0', '--accent-ink': '#ffffff', '--gold': '#c9a24a', '--line': '#e7e2f0', '--mn-soft': '#9e9d8c', '--mn-spark': '#b58b2f', '--mn-hi': '#5a4b82', '--mn-op1': '#9a8cc0', '--mn-op2': '#7869a0', '--mn-op3': '#574a78' } },
  ],
  // dữ liệu xem thử theo bản gốc: tên, bố mẹ, ngày, lễ buổi sáng, tiệc tối, ảnh như trang demo
  demo: {
    groom: { name: 'Quốc Bảo', fullName: 'Lý Quốc Bảo', father: 'Lý Văn Hoà', mother: 'Trịnh Thị Bích Vân', address: 'Phường Tân Định, Quận 1, TP. Hồ Chí Minh' },
    bride: { name: 'Diệu Linh', fullName: 'Đinh Diệu Linh', father: 'Đinh Hữu Nam', mother: 'Phan Thị Kim Yến', address: 'Phường Thảo Điền, TP. Thủ Đức, TP. Hồ Chí Minh' },
    date: '2026-12-19',
    time: '18:30',
    cover: '/demo/tim-6.jpg',
    photos: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `/demo/tim-${n}.jpg`),
    story: '',
    message: 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!',
    events: [
      { name: 'Lễ Thành Hôn', date: '2026-12-19', time: '10:00', place: 'Tư gia', address: '', mapUrl: '' },
      { name: 'Đón khách', date: '2026-12-19', time: '17:30', place: '', address: '', mapUrl: '' },
      { name: 'Khai tiệc', date: '2026-12-19', time: '18:30', place: 'Nhà Hàng Tiệc Cưới Riverside Palace', address: '360D Bến Vân Đồn, Phường 1, Quận 4, TP. Hồ Chí Minh', mapUrl: '' },
      { name: 'Rót rượu, cắt bánh', date: '2026-12-19', time: '18:45', place: '', address: '', mapUrl: '' },
      { name: 'Phục vụ món chính', date: '2026-12-19', time: '19:00', place: '', address: '', mapUrl: '' },
      { name: 'Kết thúc tiệc', date: '2026-12-19', time: '21:00', place: '', address: '', mapUrl: '' },
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
    <div class="mn-ofl"><img class="tl" src="${A('flower4-decoration')}" alt=""><img class="br" src="${A('flower4-decoration')}" alt=""></div>
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
  <img class="mn-cbg1" src="${A('flower-decoration')}" alt="">
  <img class="mn-cbg2" src="${A('house-background')}" alt="">
  <p class="mn-std">Save The Date</p>
  <div class="mn-env"><div>
    <img class="mn-env-back" src="${A('envelope-background')}" alt="">
    ${photo ? `<div class="mn-env-photo"><div><img src="${esc(photo)}" alt="Ảnh cưới"></div></div>` : ''}
    <span class="mn-env-fl"><img src="${A('flower3-decoration')}" alt=""></span>
    <img class="mn-env-front" src="${A('envelope-cover')}" alt="">
  </div></div>
  <div class="mn-names"><p>${esc(ctx.g)}</p><span aria-hidden="true">&amp;</span><p>${esc(ctx.b)}</p></div>
  <span class="mn-cfl f1"><img src="${A('flower1-decoration')}" alt=""></span>
  <span class="mn-cfl f2"><img src="${A('flower-decoration')}" alt=""></span>
</header>`;
  },

  sections: {
    // khung tím "Thông tin lễ cưới": bố mẹ hai bên, tên đầy đủ, nơi & giờ làm lễ
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
    ${orn('o1', 'flower4-decoration', 5.8, 0.6)}
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
          // tên đầy đủ: cùng một cỡ chữ cho cả hai người, tối đa 40px, co lại cho vừa 97% bề ngang khung (như bản gốc)
          var hs=[].slice.call(document.currentScript.parentNode.querySelectorAll('h3'));
          function fit(){var k=1;hs.forEach(function(h){h.style.fontSize='40px';var r=document.createRange();r.selectNodeContents(h);var w=r.getBoundingClientRect().width;if(w)k=Math.min(k,h.getBoundingClientRect().width*.97/w);});hs.forEach(function(h){h.style.fontSize=Math.floor(40*k)+'px';});}
          fit();if(document.fonts)document.fonts.ready.then(fit);addEventListener('resize',fit);
        })()</script>
      </div>
      ${p ? `<div class="mn-when-block">
        ${cer && cer.place ? `<p class="mn-lead mn-place">${esc(cer.name || 'Lễ thành hôn')} được cử hành tại<br>${esc(cer.place)}</p>` : ''}
        <div class="mn-when"><span>${time ? `Vào lúc ${esc(time)}` : ''}</span><span>${esc(ctx.weekday)}</span></div>
        ${dateRow(p)}
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
    <img class="mn-abg" src="${A('flower3-decoration')}" alt="">
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

    // khung tím "Thông tin tiệc cưới": giờ | thứ, ngày, âm lịch, đếm ngược, đón khách / khai tiệc, lịch tháng; nút xác nhận dưới khung
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
      const cd = (k, l) => `<b data-cd="${k}">0</b> ${l}`;
      return `
  <section class="sec mn-panel-wrap mn-party reveal">
    ${orn('o1', 'flower3-decoration', 6, 0.3)}
    <div class="mn-box">
      <h2 class="mn-h">Thông tin tiệc cưới</h2>
      <div class="mn-party-body">
        <h3 class="mn-lead">Tiệc cưới sẽ diễn ra vào lúc:</h3>
        <div class="mn-when"><span>${esc(time || '')}</span><span>${esc(ctx.weekday)}</span></div>
        ${dateRow(p)}
        <p class="mn-lunar">${esc(lunarOf(ctx))}</p>
        ${d.show.countdown ? `<div class="mn-cd" role="timer"><h4>Cùng đếm ngược</h4><p>${cd('d', 'ngày')} ${cd('h', 'giờ')} ${cd('m', 'phút')} ${cd('s', 'giây')}</p></div>` : ''}
        ${marks.length ? `<div class="mn-marks">${marks.map((e) => `<div><span class="k">${esc(e.name)}</span><span class="t">${esc(e.time)}</span></div>`).join('')}</div>` : ''}
        ${grid ? `<div class="mn-calwrap">${grid}</div>` : ''}
        <a class="mn-link" target="_blank" rel="noopener" href="${esc(cal)}">Thêm vào lịch</a>
      </div>
    </div>
  </section>
  ${rsvp ? `<div class="mn-pillrow reveal"><button class="mn-pill" type="button" onclick="document.getElementById('mnRsvp').showModal()">Xác nhận tham dự</button></div>
  <dialog class="mn-dlg mn-rsvp" id="mnRsvp"><button class="mn-x" type="button" aria-label="Đóng" onclick="this.closest('dialog').close()">×</button>${rsvp}</dialog>` : ''}`;
    },

    // nơi tổ chức tiệc (bản đồ) + lịch trình ngày cưới dạng dòng thời gian trong khung tím
    events(ctx, opts, h) {
      const evs = evList(ctx.d);
      if (!evs.length) return '';
      const party = partyEvent(ctx.d);
      const icons = ['cake', 'music', 'church'];
      const dir = party && (party.mapUrl || (party.address ? h.mapSearch(party.address) : ''));
      return `
  ${party && (party.place || party.address) ? `
  <section class="sec mn-venue reveal">
    <img class="mn-vbg" src="${A('house-background')}" alt="">
    <h2 class="mn-h">Tiệc cưới sẽ tổ chức tại</h2>
    <p class="mn-addr">${esc([party.place, party.address].filter(Boolean).join(', '))}</p>
    ${party.address ? `<div class="mn-map"><iframe loading="lazy" title="Bản đồ" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(party.address)}&amp;output=embed"></iframe></div>` : ''}
    ${dir ? `<a class="mn-dir" target="_blank" rel="noopener" href="${esc(dir)}"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M3 11l18-8-8 18-2-8-8-2z"/></svg>Chỉ đường</a>` : ''}
  </section>` : ''}
  <section class="sec mn-panel-wrap mn-sched reveal">
    ${orn('o1', 'flower4b-decoration', 5.2, 0.9)}
    <div class="mn-box">
      <h2 class="mn-h">Lịch trình ngày cưới</h2>
      <ol class="mn-tl">
        ${evs.map((e, i) => {
          const p = h.parts(e.date);
          const other = p && e.date !== ctx.date;
          const ic = icons[i - 1];
          return `<li><span class="t"><b>${ic ? `<img class="ic ic-${ic}" src="${A(ic)}" alt="">` : ''}${esc(e.time) || '—'}</b></span><span class="dot"></span><span class="l">${esc(e.name)}${other ? ` <small>${p.d}/${p.m}</small>` : ''}</span></li>`;
        }).join('')}
      </ol>
    </div>
  </section>`;
    },

    // sổ lưu bút trong khung trắng viền trắng; ô nhập dùng chữ gợi ý như bản gốc (giữ id/tên trường cho card.js)
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

    // hộp quà mừng: hai phong bao tím chồng nhau, chạm để mở hộp thoại có mã QR của hai bên
    gift(ctx, opts, h) {
      if (!ctx.d.show.gift) return '';
      const html = h.giftCard(ctx, ctx.d.gifts.groom, 'groom') + h.giftCard(ctx, ctx.d.gifts.bride, 'bride');
      if (!html) return '';
      return `
  <section class="sec mn-giftbox reveal">
    <h2 class="mn-h">Hộp Quà Mừng</h2>
    <button class="mn-envbtn" type="button" onclick="document.getElementById('mnGift').showModal()">
      <span class="mn-envs"><i>✦</i><i>✦</i><i>✦</i><i>✦</i><span class="sh"></span><img class="back" src="${A('envelope-gift')}" alt=""><img class="front" src="${A('envelope-gift')}" alt=""></span>
      <span class="hint">Nhấn để mở</span>
    </button>
  </section>
  <dialog class="mn-dlg mn-giftdlg" id="mnGift">
    <div class="mn-dlg-head"><h2>Hộp Quà Mừng</h2><button class="mn-x" type="button" aria-label="Đóng" onclick="this.closest('dialog').close()">×</button></div>
    <div class="gifts">${html}</div>
  </dialog>`;
    },

    // dòng cuối trang = lời nhắn của cô dâu chú rể; cành hoa lớn ở đáy thiệp
    thanks(ctx) {
      return `
  <section class="sec mn-thanks reveal">
    <p>${esc(ctx.d.message || 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!')}</p>
  </section>
  <img class="mn-bottomfl" src="${A('flowerbottom-decoration')}" alt="">`;
    },
  },

  css: `
/* cột thiệp: nền trắng + lớp giấy nhân màu 50% */
.tpl-tim .card{max-width:480px;background:var(--bg);color:var(--ink);font-family:var(--font-body);font-weight:300;line-height:1.5;box-shadow:none;isolation:isolate}
.tpl-tim .card::before{content:"";position:absolute;inset:0;z-index:-1;background:url('${A('paper')}') center top/100% auto;mix-blend-mode:multiply;opacity:.5;pointer-events:none}
.tpl-tim .sec{padding:0}
.tpl-tim .mn-h{position:relative;margin:0;font-family:'Times New Roman',Times,serif;font-weight:700;font-size:20px;line-height:1.5;letter-spacing:.03em;text-transform:uppercase;color:var(--ink)}
.tpl-tim .sec-sub{margin:4px 0 0;color:var(--muted);font-size:14px}
.tpl-tim .mn-orn{position:absolute;z-index:5;display:block;pointer-events:none}
.tpl-tim .mn-orn>span{display:block;animation:mnFloat 6s ease-in-out infinite}
.tpl-tim .mn-orn img{display:block;width:100%;max-width:none}
@keyframes mnFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@media (prefers-reduced-motion:reduce){.tpl-tim .mn-orn>span,.tpl-tim .mn-env-photo,.tpl-tim .mn-env-fl,.tpl-tim .mn-leaves i{animation:none}}

/* ---- màn mở thiệp ---- */
.tpl-tim .mn-opener{background:linear-gradient(to bottom right,var(--mn-op1),var(--mn-op2),var(--mn-op3));padding:20px;overflow:hidden}
.tpl-tim .mn-leaves{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none}
.tpl-tim .mn-leaves i{position:absolute;top:-30px;display:block;line-height:1;animation:mnFall 24s ease-in-out infinite}
@keyframes mnFall{0%{transform:translateY(-8vh) translateX(0) rotate(0);opacity:0}10%{opacity:.5}50%{transform:translateY(48vh) translateX(var(--sway,20px)) rotate(180deg);opacity:.6}92%{opacity:.45}100%{transform:translateY(105vh) translateX(0) rotate(360deg);opacity:0}}
.tpl-tim .mn-ocard{position:relative;z-index:10;width:310px;max-width:100%;text-align:center;border-radius:8px;box-shadow:0 25px 60px -12px rgba(0,0,0,.45),0 8px 24px rgba(0,0,0,.2),0 0 40px color-mix(in srgb,var(--ink) 15%,transparent)}
.tpl-tim .mn-ofl{position:absolute;inset:0;border-radius:8px;overflow:hidden;background:color-mix(in srgb,var(--paper) 96%,transparent);border:1px solid color-mix(in srgb,var(--ink) 15%,transparent);pointer-events:none}
.tpl-tim .mn-ofl img{position:absolute;width:35%;max-width:none;opacity:.85}
.tpl-tim .mn-ofl .tl{top:-5%;left:-15%;transform:translateX(-6%) scaleX(-1) rotate(30deg)}
.tpl-tim .mn-ofl .br{bottom:4%;right:-15%;transform:translateX(6%) rotate(-30deg)}
.tpl-tim .mn-heart{position:absolute;left:50%;top:50px;z-index:2;width:56px;height:56px;display:grid;place-items:center;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle at 30% 30%,var(--ink),var(--mn-hi));color:#fff;box-shadow:0 4px 20px color-mix(in srgb,var(--ink) 50%,transparent)}
.tpl-tim .mn-obody{position:relative;z-index:1;padding:112px 24px 56px}
.tpl-tim .mn-onames{display:flex;flex-direction:column;align-items:center;margin:0 0 8px;font-family:var(--font-title);font-weight:400;font-size:30px;line-height:1.25;color:var(--ink)}
.tpl-tim .mn-onames span{display:block}
.tpl-tim .mn-onames i{display:block;font-family:var(--font-body);font-style:normal;font-size:18px;line-height:1}
.tpl-tim .mn-rule{display:flex;align-items:center;justify-content:center;gap:12px;margin:0 0 8px;font-size:14px;line-height:20px}
.tpl-tim .mn-rule b{font-weight:400;color:var(--ink);opacity:.7}
.tpl-tim .mn-rule span{width:40px;height:1px;background:linear-gradient(to right,transparent,var(--ink))}
.tpl-tim .mn-rule span:last-child{background:linear-gradient(to left,transparent,var(--ink))}
.tpl-tim .mn-odate{margin:0 0 20px;font-family:'Lora',serif;font-size:18px;line-height:28px;color:color-mix(in srgb,var(--ink) 75%,transparent)}
.tpl-tim .mn-oto{margin:0 auto 24px;max-width:300px;padding-bottom:8px;font-family:'Lora',serif;font-weight:300;font-size:18px;line-height:28px;color:color-mix(in srgb,var(--ink) 75%,transparent)}
.tpl-tim .mn-obtn{position:relative;overflow:hidden;padding:10px 32px;border:0;border-radius:999px;background:var(--ink);color:#fff;font-family:'Lora',serif;font-size:18px;line-height:28px;font-weight:600;box-shadow:0 4px 14px color-mix(in srgb,var(--ink) 35%,transparent)}
.tpl-tim .mn-obtn i{position:absolute;top:0;left:-100%;width:32px;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);animation:mnShine 3s ease-in-out infinite}
@keyframes mnShine{0%{left:-100%}50%,100%{left:100%}}

/* ---- trang bìa: phong bì + ảnh + cành hoa, hoa và nhà thờ mờ phía sau ---- */
.tpl-tim .mn-cover{position:relative;z-index:1;isolation:isolate;display:flex;flex-direction:column;align-items:center;padding:63px 32px 75px;text-align:center;overflow-x:clip}
.tpl-tim .mn-cbg1{position:absolute;left:3.9%;top:1.6%;z-index:-1;width:86.6%;max-width:none;opacity:.05;pointer-events:none}
.tpl-tim .mn-cbg2{position:absolute;left:-6.6%;top:56.9%;z-index:-1;width:128.1%;max-width:none;opacity:.2;pointer-events:none}
.tpl-tim .mn-std{position:relative;z-index:2;width:100%;margin:0;padding-left:36%;font-family:'Playfair Display',serif;font-weight:600;font-size:15px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.tpl-tim .mn-env{position:relative;z-index:1;width:75%;max-width:283px;margin-top:138px}
.tpl-tim .mn-env>div{position:relative;aspect-ratio:283/327}
.tpl-tim .mn-env-back{position:absolute;inset:0;z-index:1;width:100%;max-width:none}
.tpl-tim .mn-env-photo{position:absolute;left:39.1%;top:33.9%;z-index:2;width:69.3%;translate:-50% -50%;animation:mnFloat 6.5s ease-in-out .4s infinite}
.tpl-tim .mn-env-photo div{aspect-ratio:196/253;border:5px solid #fff;background:#fff;transform:rotate(-12.31deg);box-shadow:4px 4px 4px rgba(0,0,0,.25)}
.tpl-tim .mn-env-photo img{width:100%;height:100%;object-fit:cover}
.tpl-tim .mn-env-fl{position:absolute;left:68%;top:43.3%;z-index:3;display:block;width:79.7%;translate:-50% -50%;pointer-events:none;animation:mnFloat 5s ease-in-out .9s infinite}
.tpl-tim .mn-env-fl img{display:block;width:100%;max-width:none;transform:rotate(-80deg)}
.tpl-tim .mn-env-front{position:absolute;left:0;bottom:0;z-index:4;width:100%;max-width:none}
.tpl-tim .mn-names{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:19px;width:100%;margin-top:85px}
.tpl-tim .mn-names p{margin:0;font-family:var(--font-title);font-size:clamp(34px,10.2vw,45px);line-height:1;text-transform:uppercase;color:var(--ink)}
.tpl-tim .mn-names span{position:absolute;left:50%;top:-4px;transform:translateX(-50%);font-family:var(--font-script);font-size:100px;line-height:1;color:color-mix(in srgb,var(--ink) 15%,transparent);pointer-events:none}
.tpl-tim .mn-cfl{position:absolute;z-index:1;display:block;pointer-events:none}
.tpl-tim .mn-cfl img{display:block;width:100%;max-width:none}
.tpl-tim .mn-cfl.f1{left:-10%;top:-3%;width:65%}
.tpl-tim .mn-cfl.f2{left:62%;top:49.5%;width:55%}
.tpl-tim .mn-cfl.f2 img{transform:rotate(30deg) scale(1,-1)}

/* ---- khung tím: nền tím viền tím + lớp giấy nhân màu 50%, cành hoa thò ra mép ---- */
.tpl-tim .mn-panel-wrap{position:relative;z-index:1;isolation:isolate;width:83%;max-width:367px;margin:0 auto}
.tpl-tim .mn-box{position:relative;display:flex;flex-direction:column;align-items:center;gap:24px;padding:32px 20px;border:1px solid var(--ink);border-radius:10px;background:var(--ink);color:#fff;text-align:center;box-shadow:4px 4px 2px rgba(0,0,0,.25)}
.tpl-tim .mn-box::before{content:"";position:absolute;inset:0;border-radius:inherit;background:url('${A('paper')}') center/cover;mix-blend-mode:multiply;opacity:.5;pointer-events:none}
.tpl-tim .mn-box>*{position:relative}
.tpl-tim .mn-box p,.tpl-tim .mn-box h3{margin:0}
.tpl-tim .mn-box .mn-h{color:#fff}
.tpl-tim .mn-lead{font-family:var(--font-body);font-size:16px;line-height:1.5;text-transform:uppercase}
.tpl-tim .mn-when{display:flex;justify-content:space-between;gap:12px;width:100%;max-width:200px;min-width:max-content;font-family:var(--font-body);font-size:12px;line-height:16px;text-transform:uppercase;white-space:nowrap;color:rgba(255,255,255,.7)}
.tpl-tim .mn-date{display:flex;align-items:center;justify-content:center;gap:16px;font-family:'Times New Roman',Times,serif}
.tpl-tim .mn-date b{font-family:var(--font-body);font-weight:300;font-size:52px;line-height:1}
.tpl-tim .mn-date i{width:1px;height:46px;background:rgba(255,255,255,.45)}
.tpl-tim .mn-date span{display:flex;flex-direction:column;align-items:flex-start;gap:4px;text-align:left}
.tpl-tim .mn-date em{font-style:normal;font-size:14px;line-height:1.5;text-transform:uppercase}
.tpl-tim .mn-lunar{font-family:var(--font-body);font-size:12px;line-height:16px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.7)}

/* lời mời */
.tpl-tim .mn-invite .mn-box{padding:32px 20px 36px;border-radius:13px}
.tpl-tim .mn-invite .o1{left:85%;top:30%;width:95%}
.tpl-tim .mn-fams{display:grid;grid-template-columns:1fr auto 1fr;column-gap:14px;align-items:center;width:100%}
.tpl-tim .mn-fams>i{width:1px;height:50px;background:rgba(255,255,255,.45)}
.tpl-tim .mn-fam{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0;font-family:var(--font-body);font-size:12px;line-height:1.5}
.tpl-tim .mn-fam .k{font-family:var(--font-title);color:rgba(255,255,255,.7)}
.tpl-tim .mn-fam .a{color:rgba(255,255,255,.7)}
.tpl-tim .mn-fam .n{display:flex;flex-direction:column;align-items:center;gap:3px;font-weight:600;overflow-wrap:anywhere}
/* lưới bố mẹ của bản gốc luôn có 4 hàng cách 3px, kể cả khi không có địa chỉ */
.tpl-tim .mn-fam:not(:has(.a))::after{content:""}
.tpl-tim .mn-fam .a{margin-top:4px;font-size:10px;line-height:1.25;overflow-wrap:anywhere}
.tpl-tim .mn-couple{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}
.tpl-tim .mn-couple h3{display:flex;align-items:center;justify-content:center;width:80%;min-height:80px;font-family:var(--font-title);font-weight:400;font-size:40px;line-height:52px;white-space:nowrap}
.tpl-tim .mn-role{font-family:'Uchen',serif;font-size:10px;line-height:1.5;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.7)}
.tpl-tim .mn-amp{font-family:'Ms Madi',cursive;font-size:35px;line-height:1.5}
.tpl-tim .mn-when-block{display:flex;flex-direction:column;align-items:center;gap:16px;width:100%}
.tpl-tim .mn-place{color:rgba(255,255,255,.7)}

/* album: hoa mờ lật ngang phía sau */
.tpl-tim .mn-album{position:relative;z-index:1;isolation:isolate;display:flex;flex-direction:column;align-items:center;padding:24px;overflow-x:clip}
.tpl-tim .mn-abg{position:absolute;left:-13%;top:7%;z-index:-1;width:126%;max-width:none;transform:scaleX(-1);opacity:.1;pointer-events:none}
.tpl-tim .mn-cf{position:relative;width:100%;max-width:334px;margin-top:16px}
.tpl-tim .mn-cf-stage{--h:340px;--w:calc(var(--h) * .6133);position:relative;height:var(--h);touch-action:pan-y}
.tpl-tim .mn-cf .ph{position:absolute;top:50%;left:calc(50% - var(--w) / 2);width:var(--w);height:92%;padding:0;border:0;border-radius:16px;overflow:hidden;background:var(--line);box-shadow:0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1);aspect-ratio:auto;transform:translateY(-50%);transition:all 1.1s ease-in-out;cursor:pointer}
.tpl-tim .mn-cf .ph img{width:100%;height:100%;object-fit:cover}
.tpl-tim .mn-cf .ph[data-o="0"]{z-index:3;box-shadow:0 0 0 2px rgba(255,255,255,.3),0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1)}
.tpl-tim .mn-cf .ph[data-o="1"],.tpl-tim .mn-cf .ph[data-o="-1"]{z-index:2;width:calc(var(--w) * .46);height:72%}
.tpl-tim .mn-cf .ph[data-o="1"]{left:calc(50% + var(--w) * .28)}
.tpl-tim .mn-cf .ph[data-o="-1"]{left:calc(50% - var(--w) * .74)}
.tpl-tim .mn-cf .ph[data-o="far"]{z-index:1;width:calc(var(--w) * .3);height:52%;opacity:0;pointer-events:none}
.tpl-tim .mn-cf-nav{display:none}
.tpl-tim .mn-count{margin:12px 0 0;text-align:center;font-family:var(--font-body);font-size:14px;line-height:20px;font-variant-numeric:tabular-nums;opacity:.6}
.tpl-tim .mn-count b{font-weight:300}

/* tiệc cưới + đếm ngược + lịch */
.tpl-tim .mn-party .o1{left:-85%;top:15%;width:110.7%}
.tpl-tim .mn-party .o1 img{transform:rotate(-80deg)}
.tpl-tim .mn-party .mn-box{gap:28px}
.tpl-tim .mn-party-body{display:flex;flex-direction:column;align-items:center;gap:16px}
.tpl-tim .mn-party h3.mn-lead{font-weight:600;font-size:17px}
.tpl-tim .mn-party .mn-when{max-width:165px;font-size:14px;line-height:20px}
.tpl-tim .mn-party .mn-date{gap:9px}
.tpl-tim .mn-party .mn-date em{font-size:12px}
.tpl-tim .mn-party .mn-date em+em{font-size:18px}
.tpl-tim .mn-cd{display:flex;flex-direction:column;align-items:center;margin-top:16px}
.tpl-tim .mn-cd h4{margin:0;font-family:var(--font-body);font-weight:400;font-size:20px;line-height:30px;text-transform:uppercase;color:rgba(255,255,255,.7)}
.tpl-tim .mn-cd p{margin-top:8px!important;font-family:var(--font-body);font-size:20px;line-height:28px;font-variant-numeric:tabular-nums}
.tpl-tim .mn-cd b{font-weight:300}
.tpl-tim .mn-marks{display:flex;justify-content:center;gap:32px;margin-top:16px}
.tpl-tim .mn-marks div{display:flex;flex-direction:column;align-items:center}
.tpl-tim .mn-marks .k{font-family:var(--font-body);font-size:12px;line-height:16px;letter-spacing:.05em;text-transform:uppercase;color:rgba(255,255,255,.7)}
.tpl-tim .mn-marks .t{margin-top:4px;font-family:var(--font-body);font-size:18px;line-height:28px;font-weight:500}
.tpl-tim .mn-calwrap{margin-top:12px;padding:8px 20px 20px;border-radius:10px;background:#fff;color:var(--ink);overflow:hidden}
.tpl-tim .mn-calwrap .cal{width:255px;max-width:none;margin:0}
.tpl-tim .mn-calh{margin:0!important;padding:10px 0;border-bottom:1px solid color-mix(in srgb,var(--ink) 27%,transparent);font-family:var(--font-script);font-weight:400;font-size:25px;line-height:1.5;letter-spacing:.025em}
.tpl-tim .mn-party{--cal-hi:var(--ink);--cal-on:#fff}
.tpl-tim .mn-calwrap .cal-grid{row-gap:2px;padding:0 4px 8px;font-family:'Times New Roman',serif;font-size:12px;color:var(--ink)}
.tpl-tim .mn-calwrap .cal-grid span{height:30px}
.tpl-tim .mn-calwrap .cal-grid .cal-w{height:auto;margin:0 -4px 8px;padding:6px 0;border-bottom:2px solid var(--ink);font-size:10px;font-weight:500;opacity:.6;color:var(--ink)}
.tpl-tim .mn-calwrap .cal-on::before{width:26px;height:24px}
.tpl-tim .mn-calwrap .cal-on b{font-size:11px}
.tpl-tim .mn-link{margin-top:12px;font-family:'Times New Roman',serif;font-size:14px;line-height:20px;color:#fff;text-decoration:underline;text-underline-offset:4px}
.tpl-tim .mn-pillrow{position:relative;z-index:10;display:flex;justify-content:center;margin-top:20px}
.tpl-tim .mn-pill{padding:6px 24px;border:0;border-radius:999px;background:var(--ink);color:#fff;font-family:Roboto,'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;letter-spacing:.025em;text-transform:uppercase}

/* nơi tổ chức: nhà thờ mờ phía sau */
.tpl-tim .mn-venue{position:relative;z-index:1;isolation:isolate;display:flex;flex-direction:column;align-items:center;padding:32px 24px 24px;overflow-x:clip}
.tpl-tim .mn-vbg{position:absolute;left:3%;top:36%;z-index:-1;width:128%;max-width:none;opacity:.2;pointer-events:none}
.tpl-tim .mn-venue .mn-h{font-size:16px}
.tpl-tim .mn-addr{margin:8px auto 0;max-width:247px;font-family:var(--font-body);font-size:12px;line-height:1.625;color:var(--mn-soft)}
.tpl-tim .mn-map{width:100%;max-width:338px;height:268px;margin-top:12px;border-radius:15px;overflow:hidden;background:var(--line)}
.tpl-tim .mn-map iframe{width:100%;height:100%;border:0}
.tpl-tim .mn-dir{margin-top:16px;display:inline-flex;align-items:center;gap:8px;padding:8px 20px;border-radius:999px;font-family:var(--font-body);font-weight:600;font-size:14px;line-height:20px;color:var(--mn-soft);text-decoration:none}

/* lịch trình: lưới giờ | chấm | tên; vạch dọc nối từ chấm đầu tới chấm cuối, đi qua tâm từng chấm */
.tpl-tim .mn-sched{max-width:365px;margin-top:16px}
.tpl-tim .mn-sched .mn-box{gap:12px;padding:36px 32px;border:0}
.tpl-tim .mn-sched .o1{left:74%;top:-7%;width:75%}
.tpl-tim .mn-sched .o1 img{transform:rotate(-50deg)}
.tpl-tim .mn-tl{--gy:32px;display:grid;grid-template-columns:minmax(0,1fr) 16px minmax(0,1fr);align-items:center;column-gap:24px;row-gap:var(--gy);width:100%;max-width:460px;margin:0 auto;padding:0 8px;list-style:none;font-family:'Times New Roman',Times,serif}
.tpl-tim .mn-tl li{display:contents}
.tpl-tim .mn-tl .t{text-align:right;font-size:16px;letter-spacing:.025em;font-variant-numeric:tabular-nums;line-height:1.375}
.tpl-tim .mn-tl .t b{position:relative;display:inline-block;font-weight:300}
.tpl-tim .mn-tl .ic{position:absolute;right:100%;top:50%;max-width:none;width:44px;height:44px;margin-right:30px;transform:translateY(-50%);object-fit:contain}
.tpl-tim .mn-tl .ic-music{width:40px;height:40px}
.tpl-tim .mn-tl .dot{position:relative;align-self:stretch;display:flex;align-items:center;justify-content:center}
.tpl-tim .mn-tl .dot::before{content:"";position:absolute;left:50%;width:1px;top:calc(-1 * var(--gy));bottom:calc(-1 * var(--gy));transform:translateX(-50%);background:rgba(255,255,255,.4)}
.tpl-tim .mn-tl li:first-child .dot::before{top:50%}
.tpl-tim .mn-tl li:last-child .dot::before{bottom:50%}
.tpl-tim .mn-tl li:only-child .dot::before{display:none}
.tpl-tim .mn-tl .dot::after{content:"";position:relative;width:10px;height:10px;border-radius:50%;background:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.13)}
.tpl-tim .mn-tl .l{text-align:left;font-size:13px;line-height:1.5;color:#fff}
.tpl-tim .mn-tl small{font-size:inherit;opacity:.8}

/* sổ lưu bút trong khung trắng */
.tpl-tim .mn-guestbook{max-width:365px;margin-top:67px}
.tpl-tim .s-wishes{position:relative;overflow:hidden;padding:32px 24px;border:1.2px solid #fff;border-radius:10px;background:#fff;box-shadow:4px 4px 2px rgba(0,0,0,.25);font-family:'Times New Roman',serif;color:var(--ink);text-align:center}
.tpl-tim .mn-wform{display:flex;flex-direction:column;gap:16px;width:100%;max-width:248px;margin:24px auto 0}
.tpl-tim .mn-wform input,.tpl-tim .mn-wform textarea{width:100%;padding:12px 16px;border:1px solid var(--ink);border-radius:8px;background:transparent;color:var(--ink);font:400 14px/20px 'Times New Roman',serif;outline:none;resize:none}
.tpl-tim .mn-wform textarea{height:92px}
.tpl-tim .mn-wform ::placeholder{color:color-mix(in srgb,var(--ink) 55%,transparent)}
.tpl-tim .mn-wrow{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:-12px}
.tpl-tim .mn-wrow .form-msg{flex:1;margin:0;font-size:12px;text-align:left}
.tpl-tim .mn-wrow button{padding:8px 24px;border:0;border-radius:7px;background:var(--ink);color:#fff;font:600 14px/20px 'Times New Roman',serif;text-transform:uppercase}
.tpl-tim .wish-list{width:100%;max-width:600px;max-height:500px;margin:32px auto 0;padding-right:8px;overflow-y:auto;text-align:left}
.tpl-tim .wish{margin:0 0 12px;padding:16px;border:1px solid color-mix(in srgb,var(--ink) 33.3%,transparent);border-radius:8px;background:rgba(255,255,255,.6);font-family:'Times New Roman',serif;font-size:14px;line-height:20px;color:var(--ink)}
.tpl-tim .wish b{font-weight:600;color:var(--ink)}
.tpl-tim .wish p{margin:8px 0 0;line-height:1.625}

/* hộp quà mừng: hai phong bao chồng nhau (bao trước xoay -10° nổi lên xuống, bao sau lật ngang thu 80%) */
.tpl-tim .mn-giftbox{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;padding:32px 24px 24px}
.tpl-tim .mn-giftbox .mn-h{margin-bottom:16px}
.tpl-tim .mn-envbtn{position:relative;display:flex;align-items:flex-end;justify-content:center;width:250px;height:357px;padding:0 0 48px;border:0;background:none;cursor:pointer}
.tpl-tim .mn-envs{position:relative;display:block;width:190px;height:275px}
.tpl-tim .mn-envs img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center bottom}
.tpl-tim .mn-envs .front{z-index:2;rotate:-10deg;transform-origin:50% 92%;filter:drop-shadow(0 10px 18px rgba(0,0,0,.22));animation:mnFloatMain 3s ease-in-out infinite}
.tpl-tim .mn-envs .back{z-index:1;transform-origin:50% 100%;transform:translateX(20%) translateY(-10%) scale(-.8,.8) rotate(-15deg);filter:drop-shadow(0 8px 14px rgba(0,0,0,.18));animation:mnFloatE 5.2s ease-in-out .5s infinite}
.tpl-tim .mn-envbtn:hover .front,.tpl-tim .mn-envbtn:focus-visible .front{animation:mnFloatMain 3s ease-in-out infinite,mnWave 1.1s ease-in-out infinite;scale:1.12}
.tpl-tim .mn-envs .sh{position:absolute;left:50%;bottom:-6px;z-index:0;width:125px;height:11px;margin-left:-62px;border-radius:50%;background:rgba(0,0,0,.45);filter:blur(4px);animation:mnShadow 3s ease-in-out infinite}
.tpl-tim .mn-envs i{position:absolute;z-index:3;font-style:normal;color:var(--mn-spark);opacity:0;animation:mnSpark 2s ease-in-out infinite}
.tpl-tim .mn-envs i:nth-child(1){top:6%;left:12%;font-size:21px}
.tpl-tim .mn-envs i:nth-child(2){top:14%;right:8%;font-size:15px;animation-delay:.6s}
.tpl-tim .mn-envs i:nth-child(3){top:34%;left:3%;font-size:13px;animation-delay:1.2s}
.tpl-tim .mn-envs i:nth-child(4){top:24%;right:3%;font-size:13px;animation-delay:1.7s}
@keyframes mnFloatE{0%,100%{translate:0 0}50%{translate:0 -7px}}
@keyframes mnFloatMain{0%,100%{translate:-15% 0}50%{translate:-15% -7px}}
@keyframes mnShadow{0%,100%{transform:scaleX(1);opacity:.28}50%{transform:scaleX(.9);opacity:.16}}
@keyframes mnSpark{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1.15)}}
@keyframes mnWave{0%,100%{rotate:-10deg}20%{rotate:-16deg}40%{rotate:-5.5deg}60%{rotate:-13deg}80%{rotate:-8.5deg}}
@keyframes mnHint{0%,100%{opacity:.45}50%{opacity:1}}
.tpl-tim .mn-envbtn .hint{position:absolute;left:50%;bottom:0;transform:translateX(-50%);white-space:nowrap;font-family:system-ui,sans-serif;font-size:12px;line-height:16px;font-weight:500;color:var(--ink);animation:mnHint 2s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.tpl-tim .mn-envs *,.tpl-tim .mn-envbtn .hint{animation:none!important}}

/* hộp thoại (xác nhận tham dự, quà mừng) */
.tpl-tim .mn-dlg{width:min(448px,calc(100% - 32px));max-height:85vh;padding:0;border:0;border-radius:16px;background:#fff;color:#111827;box-shadow:0 25px 50px -12px rgba(0,0,0,.25);overflow:auto}
.tpl-tim .mn-dlg::backdrop{background:rgba(0,0,0,.5)}
.tpl-tim .mn-x{position:absolute;top:16px;right:16px;z-index:1;width:32px;height:32px;border:0;border-radius:50%;background:#f3f4f6;color:#6b7280;font-size:20px;line-height:1}
.tpl-tim .mn-rsvp .s-rsvp{padding:24px;text-align:left}
.tpl-tim .mn-rsvp .mn-h{margin:0 40px 4px 0;font-family:system-ui,sans-serif;font-size:20px;font-weight:600;letter-spacing:0;text-transform:none;color:#111827}
.tpl-tim .mn-rsvp .sec-sub{margin:0 0 24px;font-family:system-ui,sans-serif;color:#6b7280}
.tpl-tim .mn-rsvp .form{gap:16px;padding:0;border:0;background:none;font-family:system-ui,sans-serif}
.tpl-tim .mn-rsvp .form label{font-size:14px;font-weight:500;color:#374151}
.tpl-tim .mn-rsvp .form input:not([type=radio]),.tpl-tim .mn-rsvp .form select{padding:12px 16px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;font-size:16px;color:#111827}
.tpl-tim .mn-rsvp .choice label{padding:10px 12px;border:2px solid #e5e7eb;border-radius:12px;background:rgba(249,250,251,.5);font-size:14px;color:#374151}
.tpl-tim .mn-rsvp .choice label:has(input:checked){border-color:var(--ink)}
.tpl-tim .mn-rsvp .btn{padding:14px;border:0;border-radius:12px;background:var(--ink);color:#fff;font-size:14px;font-weight:600;box-shadow:0 4px 12px -2px rgba(0,0,0,.2)}
.tpl-tim .mn-giftdlg{width:min(512px,calc(100% - 32px))}
.tpl-tim .mn-dlg-head{position:relative;padding:24px 24px 16px;background:var(--ink);text-align:center}
.tpl-tim .mn-dlg-head h2{margin:0;font:700 20px/1.5 'Times New Roman',serif;letter-spacing:.03em;text-transform:uppercase;color:#fff;text-shadow:1px 1px 2px rgba(0,0,0,.2)}
.tpl-tim .mn-dlg-head .mn-x{top:12px;right:12px;background:none;color:rgba(255,255,255,.8)}
.tpl-tim .mn-giftdlg .gifts{display:flex;flex-direction:column;align-items:center;gap:16px;padding:16px}
.tpl-tim .mn-giftdlg .gift{flex:1;max-width:180px;padding:0;border:0;background:none;text-align:center;color:var(--ink);font-family:system-ui,sans-serif}
.tpl-tim .mn-giftdlg .gift-who{margin:0 0 12px;font:500 14px/20px system-ui,sans-serif;color:var(--ink)}
.tpl-tim .mn-giftdlg .gift img{width:176px;height:176px;margin:0 auto 12px;padding:8px;border:2px solid color-mix(in srgb,var(--ink) 12.5%,transparent);border-radius:12px;background:#fff;box-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1)}
.tpl-tim .mn-giftdlg .gift p{margin:2px 0;font-size:12px}
.tpl-tim .mn-giftdlg .gift-acc{gap:6px;font-family:ui-monospace,monospace;letter-spacing:0}
.tpl-tim .mn-giftdlg .gift-holder{font-weight:600;color:var(--ink)}
.tpl-tim .mn-giftdlg .copy{padding:6px 12px;border:0;border-radius:999px;background:color-mix(in srgb,var(--ink) 8.2%,transparent);color:var(--ink);font-size:12px;font-weight:500}
@media (max-width:639px){.tpl-tim .mn-giftdlg{margin:auto auto 0;width:100%;max-width:none;border-radius:16px 16px 0 0}}

/* cuối thiệp: lời nhắn, chữ ký trang và cành hoa lớn sát đáy cột */
.tpl-tim .mn-thanks{position:relative;z-index:20;display:flex;flex-direction:column;align-items:center;padding:0 24px}
.tpl-tim .mn-thanks p{margin:0;white-space:pre-line;font-family:'Times New Roman',serif;font-size:11px;line-height:1.5;color:var(--ink)}
.tpl-tim .mn-bottomfl{position:absolute;left:56.2%;bottom:0;z-index:10;width:135%;max-width:none;transform:translate(-50%,33.5%) rotate(180deg);pointer-events:none}
.tpl-tim .s-story{position:relative;z-index:1;padding:32px 24px;font-family:'Times New Roman',serif;font-size:16px}
.tpl-tim .credit{position:relative;z-index:20;margin-top:12px;padding:0 0 132px;font-size:12px;opacity:.5;color:var(--ink)}

@media (min-width:640px){
  .tpl-tim .mn-ocard{width:340px}
  .tpl-tim .mn-onames{font-size:36px;line-height:1.1}
  .tpl-tim .mn-onames i{font-size:20px}
  .tpl-tim .mn-obtn{font-weight:500}
  .tpl-tim .mn-giftdlg{width:min(576px,calc(100% - 32px))}
  .tpl-tim .mn-giftdlg .gifts{flex-direction:row;flex-wrap:wrap;align-items:flex-start;justify-content:center;padding:24px}
  .tpl-tim .mn-giftdlg .gift img{width:192px;height:192px}
  .tpl-tim .mn-giftdlg .gift{max-width:none}
}
/* màn hình rộng: cột 900px có viền mảnh, các khối lớn hơn như bản gốc */
@media (min-width:768px){
  .tpl-tim .card{max-width:900px;border:1px solid color-mix(in srgb,var(--ink) 13%,transparent)}
  .tpl-tim .mn-ocard{width:520px}
  .tpl-tim .mn-ofl img{width:50%}
  .tpl-tim .mn-ofl .tl{top:-16%;left:-20%;transform:translateX(-10%) scaleX(-1) rotate(30deg)}
  .tpl-tim .mn-ofl .br{bottom:67%;right:-20%;transform:translateX(10%) rotate(-30deg)}
  .tpl-tim .mn-obody{padding:96px 24px 32px}
  .tpl-tim .mn-oto{max-width:380px}
  .tpl-tim .mn-std{font-size:17px}
  .tpl-tim .mn-env{max-width:360px;margin-top:150px}
  .tpl-tim .mn-names{margin-top:95px}
  .tpl-tim .mn-names p{font-size:56px}
  .tpl-tim .mn-names span{font-size:124px}
  .tpl-tim .mn-cfl.f1{top:-10%}
  .tpl-tim .mn-cfl.f2{top:18%}
  .tpl-tim .mn-panel-wrap{max-width:520px}
  .tpl-tim .mn-lead{font-size:20px}
  .tpl-tim .mn-couple{gap:16px}
  .tpl-tim .mn-couple h3{line-height:58px}
  .tpl-tim .mn-when-block{gap:20px}
  .tpl-tim .mn-when{max-width:230px;font-size:14px;line-height:20px}
  .tpl-tim .mn-date b{font-size:57px}
  .tpl-tim .mn-date em{font-size:18px}
  .tpl-tim .mn-lunar{font-size:14px;line-height:20px}
  .tpl-tim .mn-cf{max-width:560px}
  .tpl-tim .mn-cf-stage{--h:520px}
  .tpl-tim .mn-cf .ph[data-o="1"],.tpl-tim .mn-cf .ph[data-o="-1"]{width:calc(var(--w) * .44);height:74%}
  .tpl-tim .mn-cf .ph[data-o="-1"]{left:calc(50% - var(--w) * .72)}
  .tpl-tim .mn-cf-nav{position:absolute;top:50%;z-index:5;display:flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.6);color:var(--ink);font-size:22px;line-height:1;transform:translateY(-50%)}
  .tpl-tim .mn-cf-nav.prev{left:0}
  .tpl-tim .mn-cf-nav.next{right:0}
  .tpl-tim .mn-party-body{gap:20px}
  .tpl-tim .mn-party h3.mn-lead{font-size:18px}
  .tpl-tim .mn-party .mn-when{max-width:165px;font-size:15px;line-height:22.5px}
  .tpl-tim .mn-party .mn-date em{font-size:16px}
  .tpl-tim .mn-party .mn-date em+em{font-size:24px}
  .tpl-tim .mn-marks .t{font-size:20px}
  .tpl-tim .mn-calwrap .cal{width:310px}
  .tpl-tim .mn-calwrap .cal-grid{font-size:13px}
  .tpl-tim .mn-calwrap .cal-grid span{height:34px}
  .tpl-tim .mn-calwrap .cal-grid .cal-w{font-size:11px}
  .tpl-tim .mn-calwrap .cal-on::before{width:30px;height:28px}
  .tpl-tim .mn-calwrap .cal-on b{font-size:12px}
  .tpl-tim .mn-map{max-width:560px;height:380px}
  .tpl-tim .mn-addr{max-width:440px;font-size:14px}
  .tpl-tim .mn-dir{margin-top:20px;font-size:16px;line-height:24px}
  .tpl-tim .mn-sched,.tpl-tim .mn-guestbook{max-width:520px}
  .tpl-tim .mn-tl{--gy:40px;column-gap:32px}
  .tpl-tim .mn-tl .t{font-size:17px}
  .tpl-tim .mn-tl .l{font-size:15px}
  .tpl-tim .mn-wform{max-width:360px}
  .tpl-tim .mn-thanks p{font-size:13px;max-width:560px}
  .tpl-tim .credit{padding-bottom:165px}
}
@media (min-width:1024px){
  .tpl-tim .mn-ocard{width:600px}
  .tpl-tim .mn-oto{max-width:440px}
}
`,
};
