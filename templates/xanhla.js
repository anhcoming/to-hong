// Mẫu "Xanh Lá" (Minimalism Xanh) — thanh lịch: nền trắng, hoa cỏ xanh mờ, khung lời mời hình vòm, phong bì hai ảnh.
// Kích thước lấy theo bản gốc (Tailwind): số đầu cho điện thoại, khối @media (min-width:768px) cho màn rộng.
const { esc } = require('../lib/util');
const { inviteWord } = require('../lib/carddata');

const A = (n) => `/demo/xanhla-${n}.webp`; // ảnh trang trí của mẫu

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
// thứ | ngày | tháng, năm ở dòng dưới; vạch ngăn là chữ "|" (lời mời) hoặc gạch đứng (tiệc cưới)
const dateRow = (ctx, bar) => {
  const p = ctx.dparts;
  const sep = bar ? '<i class="bar"></i>' : '<i>|</i>';
  return `<div class="mn-date"><span>${esc(ctx.weekday)}</span>${sep}<b>${p.d}</b>${sep}<span>Tháng ${p.m}</span></div><p class="mn-year">${p.y}</p>`;
};
// lá rơi trên màn mở thiệp: vị trí / cỡ / nhịp / màu cố định để trang dựng ra lần nào cũng giống nhau
const LEAVES = [[83, 0, 19, 8, 24.6, -20], [41, 1, 22, 10, 24.5, -2.5], [62, 2, 14, 9, 23.1, -1.5], [12, 3, 17, 12, 26, -9], [28, 0, 21, 7, 22.4, -14], [72, 1, 15, 11, 25.3, -6], [5, 2, 13, 9, 27.2, -17], [52, 3, 18, 8, 23.8, -11], [93, 0, 16, 10, 24.9, -4], [35, 1, 20, 6, 26.6, -22], [66, 2, 12, 12, 21.9, -8], [20, 3, 15, 9, 25.7, -19]];
const LEAF_COLORS = ['var(--ink)', '#a7bd8f', '#cdd9bd', 'var(--mn-green)'];
const LEAF = '<svg viewBox="0 0 24 24" width="1em" height="1em"><path fill="currentColor" d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/></svg>';
// cụm hoa cỏ mờ xoay nghiêng phía sau khung tiệc, nơi tổ chức, hộp quà
const bloom = (cls) => `<span class="mn-bloom ${cls}" aria-hidden="true"><span><img src="${A('flower-background')}" alt=""></span></span>`;

module.exports = {
  id: 'xanhla',
  name: 'Vòm Lá',
  group: 'toigian',
  desc: 'Thanh lịch: nền trắng, hoa cỏ xanh mờ, khung lời mời hình vòm và phong bì hai ảnh',
  fonts: 'https://fonts.googleapis.com/css2?family=Viaoda+Libre&family=EB+Garamond:wght@400;500&family=The+Nautigal:wght@400;700&family=Cormorant+Garamond:wght@500;600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:wght@300;400;500;600&display=swap',
  palettes: [
    { id: 'xanh-la', name: 'Xanh lá', swatch: ['#87a172', '#6b7b4f'], vars: { ...base, '--page': '#ffffff', '--bg': '#ffffff', '--paper': '#ffffff', '--ink': '#6b7b4f', '--muted': '#87a172', '--accent': '#6b7b4f', '--accent-ink': '#ffffff', '--gold': '#a7bd8f', '--line': '#dfe6d6', '--mn-green': '#87a172', '--mn-dark': '#272e13', '--mn-hi': '#4d5d31', '--mn-op1': '#e9efe1', '--mn-op2': '#dbe6cf', '--mn-op3': '#cdd9bd' } },
  ],
  // dữ liệu xem thử theo bản gốc: tên, bố mẹ, ngày, lễ buổi trưa, tiệc tối, ảnh như trang demo
  demo: {
    groom: { name: 'Đăng Khoa', fullName: 'Trần Đăng Khoa', father: 'Trần Văn Hùng', mother: 'Lê Thị Hoa', address: 'Tổ dân phố 3A, thị trấn Eakar, huyện Eakar, tỉnh Đắk Lắk' },
    bride: { name: 'Mỹ Duyên', fullName: 'Nguyễn Mỹ Duyên', father: 'Nguyễn Văn Nam', mother: 'Phạm Thị Lan', address: 'Khối 2, thị xã Buôn Hồ, tỉnh Đắk Lắk' },
    date: '2026-12-19',
    time: '18:00',
    cover: '/demo/xanhla-1.jpg',
    photos: [2, 3, 4, 5, 6, 7, 8, 9].map((n) => `/demo/xanhla-${n}.jpg`),
    story: '',
    message: 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!',
    events: [
      { name: 'Lễ Thành Hôn', date: '2026-12-19', time: '11:00', place: 'Tư gia', address: '', mapUrl: '' },
      { name: 'Đón khách', date: '2026-12-19', time: '16:00', place: '', address: '', mapUrl: '' },
      { name: 'Nghi lễ thành hôn', date: '2026-12-19', time: '17:00', place: '', address: '', mapUrl: '' },
      { name: 'Khai tiệc', date: '2026-12-19', time: '18:00', place: 'Riverside Palace', address: '360 Bến Vân Đồn, Quận 4, TP. HCM', mapUrl: '' },
      { name: 'Cắt bánh & rót rượu', date: '2026-12-19', time: '19:30', place: '', address: '', mapUrl: '' },
      { name: 'Kết thúc tiệc', date: '2026-12-19', time: '21:00', place: '', address: '', mapUrl: '' },
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
  <div class="mn-leaves" aria-hidden="true">${LEAVES.map(([l, c, s, w, t, dl]) => `<i style="left:${l}%;font-size:${s}px;--sway:${w}px;animation-duration:${t}s;animation-delay:${dl}s;color:${LEAF_COLORS[c]}">${LEAF}</i>`).join('')}</div>
  <div class="mn-ocard">
    <span class="mn-heart" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M12 21s-7.5-4.6-10-9.3C.3 8.3 2.2 4 6.3 4c2.3 0 3.9 1.3 5.7 3.4C13.8 5.3 15.4 4 17.7 4 21.8 4 23.7 8.3 22 11.7 19.5 16.4 12 21 12 21z"/></svg></span>
    <div class="mn-ofl"><img class="tl" src="${A('flower-background')}" alt=""><img class="br" src="${A('flower-background')}" alt=""></div>
    <div class="mn-obody">
      <h1 class="mn-onames"><span>${esc(ctx.g)}</span><i>&amp;</i><span>${esc(ctx.b)}</span></h1>
      <p class="mn-rule" aria-hidden="true"><span></span><b>❦</b><span></span></p>
      ${p ? `<p class="mn-odate">${+p.d} tháng ${+p.m}, ${p.y}</p>` : ''}
      <p class="mn-oto">${ctx.guest ? `${esc(inviteWord(ctx.d, 'Thân mời'))} ${esc(ctx.guest.name)}` : esc(inviteWord(ctx.d, 'Thân Mời'))}</p>
      <button class="mn-obtn" id="openBtn"><span>Mở thiệp</span><i></i></button>
    </div>
  </div>
</div>`;
  },

  // bìa: phong bì xanh cắt nắp, hai ảnh nghiêng nổi lên xuống (ảnh bìa phía sau, ảnh album đầu tiên phía trước)
  cover(ctx) {
    const back = ctx.d.cover || ctx.d.photos[0] || '';
    const front = ctx.d.photos.find((u) => u !== back) || '';
    return `
<header class="mn-cover">
  <img class="mn-coverbg" src="${A('flower-background')}" alt="">
  <p class="mn-std">Save The Date</p>
  <img class="mn-line" src="${A('flower-line')}" alt="">
  <div class="mn-env">
    <img class="mn-env-back" src="${A('envelope')}" alt="">
    ${back ? `<div class="mn-env-photo b"><div><img src="${esc(back)}" alt="Ảnh cưới"></div></div>` : ''}
    ${front ? `<div class="mn-env-photo f"><div><img src="${esc(front)}" alt=""></div></div>` : ''}
    <img class="mn-env-front" src="${A('envelope-cut')}" alt="">
  </div>
  <div class="mn-names"><p>${esc(ctx.g)}</p><span aria-hidden="true">&amp;</span><p>${esc(ctx.b)}</p></div>
  <img class="mn-line l2" src="${A('flower-line')}" alt="">
</header>`;
  },

  sections: {
    // khung vòm xanh "Thông tin lễ cưới": bố mẹ hai bên, tên đầy đủ, nơi & giờ làm lễ
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
    <div class="mn-box">
      <div class="mn-inner">
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
    </div>
  </section>`;
    },

    // album dạng xếp chồng: ảnh giữa lớn, hai bên hẹp và thấp hơn; vuốt / chấm / mũi tên để chuyển
    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      return `
  <section class="sec mn-album">
    <h2 class="mn-h">Album Ảnh</h2>
    <div class="mn-cf">
      <div class="mn-cf-stage">
        <button class="mn-cf-nav prev" type="button" aria-label="Ảnh trước">‹</button>
        <button class="mn-cf-nav next" type="button" aria-label="Ảnh sau">›</button>
        ${ph.map((u, i) => `<button class="ph" data-i="${i}" aria-label="Xem ảnh ${i + 1}"><img loading="lazy" src="${esc(u)}" alt=""></button>`).join('')}
      </div>
      <div class="mn-dots">${ph.map((_, i) => `<button type="button" aria-label="Ảnh ${i + 1}"></button>`).join('')}</div>
    </div>
    <script>(function(){
      var s=document.currentScript.parentNode,st=s.querySelector('.mn-cf-stage'),cs=[].slice.call(st.querySelectorAll('.ph')),ds=[].slice.call(s.querySelectorAll('.mn-dots button')),k=0,n=cs.length;
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

    // khung trắng viền xanh "Thông tin tiệc cưới": giờ, thứ | ngày | tháng, âm lịch, đón khách / khai tiệc, đếm ngược, lịch tháng
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
    <div class="mn-box">
      ${bloom('b1')}
      <h2 class="mn-h">Thông tin tiệc cưới</h2>
      <div class="mn-party-body">
        <h3 class="mn-lead">Tiệc cưới sẽ diễn ra vào lúc:</h3>
        ${time ? `<p class="mn-time">${esc(time)}</p>` : ''}
        ${dateRow(ctx, true)}
        <p class="mn-lunar">${esc(lunarOf(ctx))}</p>
        ${marks.length ? `<div class="mn-marks">${marks.map((e) => `<div><span class="k">${esc(e.name)}</span><span class="t">${esc(e.time)}</span></div>`).join('')}</div>` : ''}
        ${d.show.countdown ? `<div class="mn-cd" role="timer"><h4>Cùng đếm ngược</h4><p>${cd('d', 'ngày')} ${cd('h', 'giờ')} ${cd('m', 'phút')} ${cd('s', 'giây')}</p></div>` : ''}
        ${grid ? `<div class="mn-calwrap">${grid}</div>` : ''}
        <a class="mn-link" target="_blank" rel="noopener" href="${esc(cal)}">Thêm vào lịch</a>
      </div>
      ${rsvp ? `<button class="mn-pill" type="button" onclick="document.getElementById('mnRsvp').showModal()">Xác nhận tham dự</button>` : ''}
    </div>
  </section>
  ${rsvp ? `<dialog class="mn-dlg mn-rsvp" id="mnRsvp"><button class="mn-x" type="button" aria-label="Đóng" onclick="this.closest('dialog').close()">×</button>${rsvp}</dialog>` : ''}`;
    },

    // nơi tổ chức tiệc (bản đồ) + lịch trình ngày cưới dạng dòng thời gian trong khung xanh bo lệch
    events(ctx, opts, h) {
      const evs = evList(ctx.d);
      if (!evs.length) return '';
      const party = partyEvent(ctx.d);
      const icons = ['cake', 'home', 'music'];
      const dir = party && (party.mapUrl || (party.address ? h.mapSearch(party.address) : ''));
      return `
  ${party && (party.place || party.address) ? `
  <section class="sec mn-venue reveal">
    ${bloom('b2')}
    <h2 class="mn-h">Tiệc cưới sẽ tổ chức tại</h2>
    <p class="mn-addr">${esc([party.place, party.address].filter(Boolean).join(', '))}</p>
    ${party.address ? `<div class="mn-map"><iframe loading="lazy" title="Bản đồ" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(party.address)}&amp;output=embed"></iframe></div>` : ''}
    ${dir ? `<a class="mn-dir" target="_blank" rel="noopener" href="${esc(dir)}"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M3 11l18-8-8 18-2-8-8-2z"/></svg>Chỉ đường</a>` : ''}
  </section>` : ''}
  <section class="sec mn-panel-wrap mn-sched reveal">
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

    // sổ lưu bút trên khung hoa; ô nhập dùng chữ gợi ý như bản gốc (giữ id/tên trường cho card.js)
    wishes(ctx, opts) {
      if (!ctx.d.show.wishes) return '';
      const list = opts.wishes || [];
      return `
  <div class="mn-guestbook reveal">
    <img class="mn-note" src="${A('guestbook-background')}" alt="">
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

    // hộp quà mừng: hai phong bao xanh chồng nhau, chạm để mở hộp thoại có mã QR của hai bên
    gift(ctx, opts, h) {
      if (!ctx.d.show.gift) return '';
      const html = h.giftCard(ctx, ctx.d.gifts.groom, 'groom') + h.giftCard(ctx, ctx.d.gifts.bride, 'bride');
      if (!html) return '';
      return `
  <section class="sec mn-giftbox reveal">
    ${bloom('b3')}
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

    // dòng cuối trang = lời nhắn của cô dâu chú rể (mặc định "Sự hiện diện của quý khách…")
    thanks(ctx) {
      return `
  <section class="sec mn-thanks reveal">
    <p>${esc(ctx.d.message || 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!')}</p>
  </section>`;
    },
  },

  css: `
/* cột thiệp: nền trắng + lớp giấy nhân màu 50% */
.tpl-xanhla .card{max-width:480px;background:var(--bg);color:var(--ink);font-family:var(--font-body);font-weight:300;line-height:1.5;box-shadow:none;isolation:isolate}
.tpl-xanhla .card::before{content:"";position:absolute;inset:0;z-index:-1;background:url('${A('paper')}') left top/100% auto;mix-blend-mode:multiply;opacity:.5;pointer-events:none}
.tpl-xanhla .sec{padding:0}
.tpl-xanhla .mn-h{position:relative;margin:0;font-family:'Times New Roman',Times,serif;font-weight:700;font-size:20px;line-height:1.5;letter-spacing:.04em;text-transform:uppercase;color:var(--ink)}
.tpl-xanhla .sec-sub{margin:4px 0 0;color:var(--muted);font-size:14px}
@media (prefers-reduced-motion:reduce){.tpl-xanhla .mn-env-photo,.tpl-xanhla .mn-leaves i{animation:none}}
/* cụm hoa cỏ mờ (784×845) xoay 24.65° trong khung 1065×1095, như bản gốc */
.tpl-xanhla .mn-bloom{position:absolute;z-index:0;display:flex;align-items:center;justify-content:center;width:1065px;height:1095px;pointer-events:none}
.tpl-xanhla .mn-bloom>span{display:block;transform:rotate(24.65deg)}
.tpl-xanhla .mn-bloom img{display:block;width:784px;height:845px;max-width:none;object-fit:cover;opacity:.1}

/* ---- màn mở thiệp ---- */
.tpl-xanhla .mn-opener{background:linear-gradient(to bottom right,var(--mn-op1),var(--mn-op2),var(--mn-op3));padding:20px;overflow:hidden}
.tpl-xanhla .mn-leaves{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none}
.tpl-xanhla .mn-leaves i{position:absolute;top:-30px;display:block;line-height:1;animation:mnFall 24s ease-in-out infinite}
@keyframes mnFall{0%{transform:translateY(-8vh) translateX(0) rotate(0);opacity:0}10%{opacity:.5}50%{transform:translateY(48vh) translateX(var(--sway,20px)) rotate(180deg);opacity:.6}92%{opacity:.45}100%{transform:translateY(105vh) translateX(0) rotate(360deg);opacity:0}}
.tpl-xanhla .mn-ocard{position:relative;z-index:10;width:310px;max-width:100%;text-align:center;border-radius:8px;box-shadow:0 25px 60px -12px rgba(0,0,0,.45),0 8px 24px rgba(0,0,0,.2),0 0 40px color-mix(in srgb,var(--ink) 15%,transparent)}
.tpl-xanhla .mn-ofl{position:absolute;inset:0;border-radius:8px;overflow:hidden;background:rgba(255,255,255,.96);border:1px solid color-mix(in srgb,var(--ink) 15%,transparent);pointer-events:none}
.tpl-xanhla .mn-ofl img{position:absolute;height:200px;width:auto;max-width:none;opacity:.2}
.tpl-xanhla .mn-ofl .tl{top:-5%;left:-10%;transform:translateX(-6%) rotate(125deg)}
.tpl-xanhla .mn-ofl .br{bottom:-5%;right:-10%;transform:translateX(6%) rotate(-25deg) scaleX(-1)}
.tpl-xanhla .mn-heart{position:absolute;left:50%;top:50px;z-index:2;width:56px;height:56px;display:grid;place-items:center;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle at 30% 30%,var(--ink),var(--mn-hi));color:#fff;box-shadow:0 4px 20px color-mix(in srgb,var(--ink) 50%,transparent)}
.tpl-xanhla .mn-obody{position:relative;z-index:1;padding:112px 24px 56px}
.tpl-xanhla .mn-onames{display:flex;flex-direction:column;align-items:center;margin:0 0 8px;font-family:'EB Garamond',serif;font-weight:400;font-size:30px;line-height:1.25;color:var(--ink)}
.tpl-xanhla .mn-onames span{display:block}
.tpl-xanhla .mn-onames i{display:block;font-family:var(--font-body);font-style:normal;font-size:18px;line-height:1}
.tpl-xanhla .mn-rule{display:flex;align-items:center;justify-content:center;gap:12px;margin:0 0 8px;font-size:14px;line-height:20px}
.tpl-xanhla .mn-rule b{font-weight:400;color:var(--ink);opacity:.7}
.tpl-xanhla .mn-rule span{width:40px;height:1px;background:linear-gradient(to right,transparent,var(--ink))}
.tpl-xanhla .mn-rule span:last-child{background:linear-gradient(to left,transparent,var(--ink))}
.tpl-xanhla .mn-odate{margin:0 0 20px;font-family:'Lora',serif;font-size:18px;line-height:28px;color:color-mix(in srgb,var(--ink) 70%,transparent)}
.tpl-xanhla .mn-oto{margin:0 auto 24px;max-width:300px;padding-bottom:8px;font-family:'Lora',serif;font-weight:300;font-size:18px;line-height:28px;color:color-mix(in srgb,var(--ink) 70%,transparent)}
.tpl-xanhla .mn-obtn{position:relative;overflow:hidden;padding:10px 32px;border:0;border-radius:999px;background:var(--ink);color:#fff;font-family:'Lora',serif;font-size:18px;line-height:28px;font-weight:600;box-shadow:0 4px 14px color-mix(in srgb,var(--ink) 35%,transparent)}
.tpl-xanhla .mn-obtn i{position:absolute;top:0;left:-100%;width:32px;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);animation:mnShine 3s ease-in-out infinite}
@keyframes mnShine{0%{left:-100%}50%,100%{left:100%}}

/* ---- trang bìa: phong bì cắt nắp + hai ảnh ---- */
.tpl-xanhla .mn-cover{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;padding:40px 24px 24px;text-align:center}
.tpl-xanhla .mn-coverbg{position:absolute;left:-335.5px;top:-52px;width:784px;height:845px;max-width:none;object-fit:cover;opacity:.2;pointer-events:none}
.tpl-xanhla .mn-std{position:relative;margin:0;font-family:'Cormorant Garamond',serif;font-weight:600;font-size:18px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink)}
.tpl-xanhla .mn-line{position:relative;display:block;width:124px;max-width:45%;height:auto;margin-top:12px}
.tpl-xanhla .mn-line.l2{margin-top:16px}
.tpl-xanhla .mn-env{position:relative;width:77%;max-width:326px;margin-top:16px;aspect-ratio:268/317}
.tpl-xanhla .mn-env-back{position:absolute;left:0;top:7.9%;z-index:1;width:100%;max-width:none}
.tpl-xanhla .mn-env-photo{position:absolute;z-index:2;width:56%}
.tpl-xanhla .mn-env-photo.b{left:72%;top:3%;--r:9.59deg;animation:mnFloatR 4s ease-in-out infinite}
.tpl-xanhla .mn-env-photo.f{left:31.7%;top:20%;--r:-12.55deg;animation:mnFloatR 4.6s ease-in-out infinite}
@keyframes mnFloatR{0%,100%{transform:translate(-50%,0) rotate(var(--r))}50%{transform:translate(-50%,-8px) rotate(var(--r))}}
.tpl-xanhla .mn-env-photo div{aspect-ratio:150/180;border:6px solid #fff;background:#fff;box-shadow:2px 2px 6px rgba(0,0,0,.25)}
.tpl-xanhla .mn-env-photo img{width:100%;height:100%;object-fit:cover}
.tpl-xanhla .mn-env-front{position:absolute;left:0;top:45.4%;z-index:3;width:100%;max-width:none}
.tpl-xanhla .mn-names{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;margin-top:24px}
.tpl-xanhla .mn-names p{position:relative;margin:0;font-family:'Times New Roman',Times,serif;font-style:italic;font-size:clamp(41px,12vw,54px);line-height:1.5;color:var(--ink)}
.tpl-xanhla .mn-names span{position:absolute;top:50%;transform:translateY(-50%);font-family:var(--font-script);font-size:120px;line-height:1;color:color-mix(in srgb,var(--ink) 15%,transparent);pointer-events:none}

/* ---- khung lời mời: nền xanh + giấy nhân màu, đỉnh vòm ---- */
.tpl-xanhla .mn-panel-wrap{position:relative;z-index:1;width:88%;max-width:420px;margin:0 auto}
.tpl-xanhla .mn-box{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;gap:24px;padding:32px 16px;border-radius:10px;text-align:center}
.tpl-xanhla .mn-box::before{content:"";position:absolute;inset:0;z-index:0;border-radius:inherit;background:url('${A('paper')}') left top/666.5px 1000px;mix-blend-mode:multiply;opacity:.5;pointer-events:none}
.tpl-xanhla .mn-box>*:not(.mn-bloom){position:relative;z-index:1}
.tpl-xanhla .mn-box p,.tpl-xanhla .mn-box h3{margin:0}
.tpl-xanhla .mn-invite .mn-box{padding:56px 16px 40px;border-radius:200px 200px 10px 10px;background:var(--mn-green);color:#fff}
.tpl-xanhla .mn-inner{display:flex;flex-direction:column;align-items:center;gap:24px;width:100%}
.tpl-xanhla .mn-invite .mn-h{max-width:240px;margin:0 auto;color:#fff}
.tpl-xanhla .mn-lead{font-family:var(--font-body);font-size:16px;line-height:1.5;text-transform:uppercase}
.tpl-xanhla h3.mn-lead{font-weight:400}
.tpl-xanhla .mn-time{font-family:var(--font-body);font-size:20px;line-height:1.5}
.tpl-xanhla .mn-date{display:flex;align-items:center;justify-content:center;gap:24px;font-family:var(--font-body)}
.tpl-xanhla .mn-date span{font-size:12px;line-height:1.5;text-transform:uppercase}
.tpl-xanhla .mn-date span:first-child{text-align:right}
.tpl-xanhla .mn-date b{font-weight:300;font-size:30px;line-height:1.5}
.tpl-xanhla .mn-date i{display:flex;align-items:center;justify-content:center;font-style:normal;font-size:24px;line-height:1;color:rgba(255,255,255,.5)}
.tpl-xanhla .mn-year{font-family:var(--font-body);font-size:18px;line-height:1.5}
.tpl-xanhla .mn-lunar{font-family:var(--font-body);font-size:12px;line-height:16px;letter-spacing:.25em;text-transform:uppercase;color:rgba(255,255,255,.7)}
.tpl-xanhla .mn-fams{display:grid;grid-template-columns:1fr auto 1fr;column-gap:14px;align-items:center;max-width:100%}
.tpl-xanhla .mn-fams>i{width:1px;height:50px;background:rgba(255,255,255,.4)}
.tpl-xanhla .mn-fam{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0;font-family:var(--font-body);font-size:12px;line-height:1.5}
.tpl-xanhla .mn-fam .k,.tpl-xanhla .mn-fam .a{color:rgba(255,255,255,.7)}
.tpl-xanhla .mn-fam .n{display:flex;flex-direction:column;align-items:center;gap:3px;font-weight:600;overflow-wrap:anywhere}
/* lưới bố mẹ của bản gốc luôn có 4 hàng cách 3px, kể cả khi không có địa chỉ */
.tpl-xanhla .mn-fam:not(:has(.a))::after{content:""}
.tpl-xanhla .mn-fam .a{margin-top:4px;font-size:10px;line-height:1.25;overflow-wrap:anywhere}
.tpl-xanhla .mn-couple{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}
.tpl-xanhla .mn-couple h3{display:flex;align-items:center;justify-content:center;width:80%;min-height:80px;font-family:var(--font-title);font-weight:400;font-size:43px;line-height:52px;white-space:nowrap}
.tpl-xanhla .mn-role{font-family:var(--font-body);font-size:10px;line-height:1.5;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.7)}
.tpl-xanhla .mn-amp{font-family:'Times New Roman',Times,serif;font-size:30px;line-height:1.5}
.tpl-xanhla .mn-when-block{display:flex;flex-direction:column;align-items:center;gap:16px;width:100%}
.tpl-xanhla .mn-place{display:flex;flex-direction:column;align-items:center;gap:8px;color:rgba(255,255,255,.7)}
.tpl-xanhla .mn-at{margin-bottom:8px!important;font-family:var(--font-body);font-size:16px;line-height:1.5;text-transform:uppercase}

/* album */
.tpl-xanhla .mn-album{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;padding:40px 24px}
.tpl-xanhla .mn-cf{position:relative;width:100%;max-width:380px;margin-top:20px}
.tpl-xanhla .mn-cf-stage{--h:340px;--w:calc(var(--h) * .6112);position:relative;height:var(--h);touch-action:pan-y}
.tpl-xanhla .mn-cf .ph{position:absolute;top:50%;left:calc(50% - var(--w) / 2);width:var(--w);height:92%;padding:0;border:0;border-radius:16px;overflow:hidden;background:var(--line);box-shadow:0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1);aspect-ratio:auto;transform:translateY(-50%);transition:all 1.1s ease-in-out;cursor:pointer}
.tpl-xanhla .mn-cf .ph img{width:100%;height:100%;object-fit:cover}
.tpl-xanhla .mn-cf .ph[data-o="0"]{z-index:3;box-shadow:0 0 0 2px rgba(255,255,255,.3),0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1)}
.tpl-xanhla .mn-cf .ph[data-o="1"],.tpl-xanhla .mn-cf .ph[data-o="-1"]{z-index:2;width:calc(var(--w) * .46);height:72%}
.tpl-xanhla .mn-cf .ph[data-o="1"]{left:calc(50% + var(--w) * .28)}
.tpl-xanhla .mn-cf .ph[data-o="-1"]{left:calc(50% - var(--w) * .74)}
.tpl-xanhla .mn-cf .ph[data-o="far"]{z-index:1;width:calc(var(--w) * .3);height:52%;opacity:0;pointer-events:none}
.tpl-xanhla .mn-cf-nav{display:none}
.tpl-xanhla .mn-dots{display:flex;justify-content:center;gap:6px;margin-top:12px}
.tpl-xanhla .mn-dots button{width:8px;height:8px;padding:0;border:0;border-radius:999px;background:var(--ink);opacity:.25;transition:all .3s}
.tpl-xanhla .mn-dots button.on{width:24px;opacity:.7}

/* tiệc cưới: khung trắng viền xanh 3px, hoa cỏ mờ phía sau */
.tpl-xanhla .mn-party{margin-bottom:8px}
.tpl-xanhla .mn-party .mn-box{border:3px solid var(--ink);background:#fff;color:var(--ink)}
.tpl-xanhla .mn-party .b1{left:-351.49px;top:-239.99px}
.tpl-xanhla .mn-party-body{display:flex;flex-direction:column;align-items:center;gap:16px}
.tpl-xanhla .mn-party .mn-time{color:var(--mn-green)}
.tpl-xanhla .mn-party .mn-date span{font-family:'Times New Roman',Times,serif}
.tpl-xanhla .mn-party .mn-date .bar{width:2px;height:24px;background:var(--ink)}
.tpl-xanhla .mn-party .mn-lunar{color:var(--mn-green)}
.tpl-xanhla .mn-marks{display:flex;justify-content:center;gap:32px;margin-top:16px}
.tpl-xanhla .mn-marks div{display:flex;flex-direction:column;align-items:center}
.tpl-xanhla .mn-marks .k{font-family:var(--font-body);font-size:12px;line-height:16px;letter-spacing:.05em;text-transform:uppercase;color:var(--mn-green)}
.tpl-xanhla .mn-marks .t{margin-top:4px;font-family:var(--font-body);font-size:18px;line-height:28px;font-weight:500}
.tpl-xanhla .mn-cd{display:flex;flex-direction:column;align-items:center;margin-top:16px;color:var(--mn-green)}
.tpl-xanhla .mn-cd h4{margin:0;font-family:var(--font-body);font-weight:400;font-size:16px;line-height:24px}
.tpl-xanhla .mn-cd p{margin-top:8px!important;font-family:var(--font-body);font-size:14px;line-height:20px;font-variant-numeric:tabular-nums}
.tpl-xanhla .mn-cd b{font-weight:300}
.tpl-xanhla .mn-calwrap{margin-top:12px;padding:4px 12px 12px;border-radius:10px;background:var(--mn-green);color:#fff;overflow:hidden}
.tpl-xanhla .mn-calwrap .cal{width:296px;max-width:none;margin:0}
.tpl-xanhla .mn-calh{margin:0!important;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.27);font-family:var(--font-script);font-weight:400;font-size:22px;line-height:1.5;letter-spacing:.025em}
.tpl-xanhla .mn-party{--cal-hi:#fff;--cal-on:#333}
.tpl-xanhla .mn-calwrap .cal-grid{row-gap:2px;padding:0 4px 8px;font-family:'Times New Roman',serif;font-size:12px;color:#fff}
.tpl-xanhla .mn-calwrap .cal-grid span{height:30px}
.tpl-xanhla .mn-calwrap .cal-grid .cal-w{height:auto;margin:0 -4px 8px;padding:6px 0;border-bottom:2px solid #fff;font-size:10px;font-weight:500;opacity:.6;color:#fff}
.tpl-xanhla .mn-calwrap .cal-on::before{width:26px;height:24px}
.tpl-xanhla .mn-calwrap .cal-on b{font-size:11px}
.tpl-xanhla .mn-link{margin-top:12px;font-family:'Times New Roman',serif;font-size:14px;line-height:20px;color:var(--ink);text-decoration:underline;text-underline-offset:4px}
.tpl-xanhla .mn-pill{margin-top:4px;padding:8px 24px;border:0;border-radius:999px;background:var(--ink);color:#fff;font-family:var(--font-body);font-size:14px;line-height:20px;letter-spacing:.05em;text-transform:uppercase}

/* nơi tổ chức */
.tpl-xanhla .mn-venue{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;padding:32px 24px;overflow-x:clip}
.tpl-xanhla .mn-venue .b2{left:50%;bottom:-463px;transform:translateX(-50%)}
.tpl-xanhla .mn-venue>*:not(.mn-bloom){position:relative;z-index:1}
.tpl-xanhla .mn-venue .mn-h{font-size:16px}
.tpl-xanhla .mn-addr{margin:8px auto 0;max-width:280px;font-family:var(--font-body);font-size:12px;line-height:1.625;color:var(--mn-dark)}
.tpl-xanhla .mn-map{width:100%;max-width:338px;height:268px;margin-top:12px;border-radius:15px;overflow:hidden;background:var(--line)}
.tpl-xanhla .mn-map iframe{width:100%;height:100%;border:0}
.tpl-xanhla .mn-dir{margin-top:16px;display:inline-flex;align-items:center;gap:8px;padding:8px 20px;border-radius:999px;font-family:var(--font-body);font-weight:600;font-size:14px;line-height:20px;color:var(--mn-dark);text-decoration:none}

/* lịch trình: khung xanh bo lệch (trên phải, dưới trái 100px); lưới giờ | chấm | tên */
.tpl-xanhla .mn-sched{margin:16px auto}
.tpl-xanhla .mn-sched .mn-box{gap:16px;padding:36px 24px;border-radius:10px 100px 10px 100px;background:var(--mn-green);color:#fff}
.tpl-xanhla .mn-sched .mn-h{color:#fff}
.tpl-xanhla .mn-tl{--gy:32px;display:grid;grid-template-columns:minmax(0,1fr) 16px minmax(0,1fr);align-items:center;column-gap:24px;row-gap:var(--gy);width:100%;max-width:460px;margin:0 auto;padding:0 8px;list-style:none;font-family:'Times New Roman',Times,serif}
.tpl-xanhla .mn-tl li{display:contents}
.tpl-xanhla .mn-tl .t{text-align:right;font-size:16px;letter-spacing:.025em;font-variant-numeric:tabular-nums;line-height:1.375}
.tpl-xanhla .mn-tl .t b{position:relative;display:inline-block;font-weight:300}
.tpl-xanhla .mn-tl .ic{position:absolute;right:100%;top:50%;max-width:none;width:36px;height:36px;margin-right:24px;transform:translateY(-50%);object-fit:contain}
.tpl-xanhla .mn-tl .dot{position:relative;align-self:stretch;display:flex;align-items:center;justify-content:center}
.tpl-xanhla .mn-tl .dot::before{content:"";position:absolute;left:50%;width:1px;top:calc(-1 * var(--gy));bottom:calc(-1 * var(--gy));transform:translateX(-50%);background:rgba(255,255,255,.4)}
.tpl-xanhla .mn-tl li:first-child .dot::before{top:50%}
.tpl-xanhla .mn-tl li:last-child .dot::before{bottom:50%}
.tpl-xanhla .mn-tl li:only-child .dot::before{display:none}
.tpl-xanhla .mn-tl .dot::after{content:"";position:relative;width:10px;height:10px;border-radius:50%;background:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.13)}
.tpl-xanhla .mn-tl .l{text-align:left;font-size:13px;line-height:1.5;color:#fff}
.tpl-xanhla .mn-tl small{font-size:inherit;opacity:.8}

/* sổ lưu bút trên khung hoa */
.tpl-xanhla .mn-guestbook{position:relative;z-index:1;container-type:inline-size}
.tpl-xanhla .mn-note{position:absolute;left:50%;top:6px;width:96%;max-width:530px;transform:translateX(-50%);opacity:.9;pointer-events:none}
.tpl-xanhla .s-wishes{position:relative;padding:68px 24px 32px;text-align:center;font-family:'Times New Roman',serif;color:var(--ink)}
.tpl-xanhla .s-wishes .mn-h{transform:translateY(25px)}
.tpl-xanhla .mn-wform{display:flex;flex-direction:column;gap:16px;width:100%;max-width:300px;margin:24px auto 0;padding:16px;border-radius:8px}
.tpl-xanhla .mn-wform input,.tpl-xanhla .mn-wform textarea{width:100%;padding:12px 16px;border:1px solid var(--ink);border-radius:8px;background:transparent;color:var(--ink);font:400 14px/20px 'Times New Roman',serif;outline:none;resize:none}
.tpl-xanhla .mn-wform textarea{height:50px}
.tpl-xanhla .mn-wform ::placeholder{color:color-mix(in srgb,var(--ink) 55%,transparent)}
.tpl-xanhla .mn-wrow{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:-11px}
.tpl-xanhla .mn-wrow .form-msg{flex:1;margin:0;font-size:12px;text-align:left}
.tpl-xanhla .mn-wrow button{padding:8px 24px;border:0;border-radius:999px;background:var(--ink);color:#fff;font:600 14px/20px 'Times New Roman',serif;text-transform:uppercase}
.tpl-xanhla .wish-list{width:100%;max-width:600px;max-height:500px;margin:max(55px,calc(87.1cqw - 300px)) auto 0;padding-right:8px;overflow-y:auto;text-align:left}
.tpl-xanhla .wish{margin:0 0 12px;padding:16px;border:1px solid color-mix(in srgb,var(--ink) 40%,transparent);border-radius:8px;background:rgba(255,255,255,.6);font-family:'Times New Roman',serif;font-size:14px;line-height:20px;color:var(--ink)}
.tpl-xanhla .wish b{font-weight:600;color:var(--ink)}
.tpl-xanhla .wish p{margin:8px 0 0;line-height:1.625}

/* hộp quà mừng: hai phong bao chồng nhau (bao trước xoay -10° nổi lên xuống, bao sau lật ngang thu 80%) */
.tpl-xanhla .mn-giftbox{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;padding:32px 24px 40px;overflow-x:clip}
.tpl-xanhla .mn-giftbox>*:not(.mn-bloom){position:relative;z-index:1}
.tpl-xanhla .mn-giftbox .b3{left:-205px;top:-190px;width:1017px;height:936px}
.tpl-xanhla .mn-giftbox .b3>span{transform:translateX(61px) scaleY(-1) rotate(165.75deg)}
.tpl-xanhla .mn-giftbox .b3 img{width:725px;height:781px}
.tpl-xanhla .mn-giftbox .mn-h{margin-bottom:16px}
.tpl-xanhla .mn-envbtn{position:relative;display:flex;align-items:flex-end;justify-content:center;width:250px;height:357px;padding:0 0 48px;border:0;background:none;cursor:pointer}
.tpl-xanhla .mn-envs{position:relative;display:block;width:190px;height:275px}
.tpl-xanhla .mn-envs img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center bottom}
.tpl-xanhla .mn-envs .front{z-index:2;rotate:-10deg;transform-origin:50% 92%;filter:drop-shadow(0 10px 18px rgba(0,0,0,.22));animation:mnFloatMain 3s ease-in-out infinite}
.tpl-xanhla .mn-envs .back{z-index:1;transform-origin:50% 100%;transform:translateX(20%) translateY(-10%) scale(-.8,.8) rotate(-15deg);filter:drop-shadow(0 8px 14px rgba(0,0,0,.18));animation:mnFloat 5.2s ease-in-out .5s infinite}
.tpl-xanhla .mn-envbtn:hover .front,.tpl-xanhla .mn-envbtn:focus-visible .front{animation:mnFloatMain 3s ease-in-out infinite,mnWave 1.1s ease-in-out infinite;scale:1.12}
.tpl-xanhla .mn-envs .sh{position:absolute;left:50%;bottom:-6px;z-index:0;width:125px;height:11px;margin-left:-62px;border-radius:50%;background:rgba(0,0,0,.45);filter:blur(4px);animation:mnShadow 3s ease-in-out infinite}
.tpl-xanhla .mn-envs i{position:absolute;z-index:3;font-style:normal;color:var(--mn-green);opacity:0;animation:mnSpark 2s ease-in-out infinite}
.tpl-xanhla .mn-envs i:nth-child(1){top:6%;left:12%;font-size:21px}
.tpl-xanhla .mn-envs i:nth-child(2){top:14%;right:8%;font-size:15px;animation-delay:.6s}
.tpl-xanhla .mn-envs i:nth-child(3){top:34%;left:3%;font-size:13px;animation-delay:1.2s}
.tpl-xanhla .mn-envs i:nth-child(4){top:24%;right:3%;font-size:13px;animation-delay:1.7s}
@keyframes mnFloat{0%,100%{translate:0 0}50%{translate:0 -7px}}
@keyframes mnFloatMain{0%,100%{translate:-15% 0}50%{translate:-15% -7px}}
@keyframes mnShadow{0%,100%{transform:scaleX(1);opacity:.28}50%{transform:scaleX(.9);opacity:.16}}
@keyframes mnSpark{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1.15)}}
@keyframes mnWave{0%,100%{rotate:-10deg}20%{rotate:-16deg}40%{rotate:-5.5deg}60%{rotate:-13deg}80%{rotate:-8.5deg}}
@keyframes mnHint{0%,100%{opacity:.45}50%{opacity:1}}
.tpl-xanhla .mn-envbtn .hint{position:absolute;left:50%;bottom:0;transform:translateX(-50%);white-space:nowrap;font-family:system-ui,sans-serif;font-size:12px;line-height:16px;font-weight:500;color:var(--ink);animation:mnHint 2s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.tpl-xanhla .mn-envs *,.tpl-xanhla .mn-envbtn .hint{animation:none!important}}

/* hộp thoại (xác nhận tham dự, quà mừng) */
.tpl-xanhla .mn-dlg{width:min(448px,calc(100% - 32px));max-height:85vh;padding:0;border:0;border-radius:16px;background:#fff;color:#111827;box-shadow:0 25px 50px -12px rgba(0,0,0,.25);overflow:auto}
.tpl-xanhla .mn-dlg::backdrop{background:rgba(0,0,0,.5)}
.tpl-xanhla .mn-x{position:absolute;top:16px;right:16px;z-index:1;width:32px;height:32px;border:0;border-radius:50%;background:#f3f4f6;color:#6b7280;font-size:20px;line-height:1}
.tpl-xanhla .mn-rsvp .s-rsvp{padding:24px;text-align:left}
.tpl-xanhla .mn-rsvp .mn-h{margin:0 40px 4px 0;font-family:system-ui,sans-serif;font-size:20px;font-weight:600;letter-spacing:0;text-transform:none;color:#111827}
.tpl-xanhla .mn-rsvp .sec-sub{margin:0 0 24px;font-family:system-ui,sans-serif;color:#6b7280}
.tpl-xanhla .mn-rsvp .form{gap:16px;padding:0;border:0;background:none;font-family:system-ui,sans-serif}
.tpl-xanhla .mn-rsvp .form label{font-size:14px;font-weight:500;color:#374151}
.tpl-xanhla .mn-rsvp .form input:not([type=radio]),.tpl-xanhla .mn-rsvp .form select{padding:12px 16px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;font-size:16px;color:#111827}
.tpl-xanhla .mn-rsvp .choice label{padding:10px 12px;border:2px solid #e5e7eb;border-radius:12px;background:rgba(249,250,251,.5);font-size:14px;color:#374151}
.tpl-xanhla .mn-rsvp .choice label:has(input:checked){border-color:var(--ink)}
.tpl-xanhla .mn-rsvp .btn{padding:14px;border:0;border-radius:12px;background:var(--ink);color:#fff;font-size:14px;font-weight:600;box-shadow:0 4px 12px -2px rgba(0,0,0,.2)}
.tpl-xanhla .mn-giftdlg{width:min(512px,calc(100% - 32px))}
.tpl-xanhla .mn-dlg-head{position:relative;padding:24px 24px 16px;background:var(--ink);text-align:center}
.tpl-xanhla .mn-dlg-head h2{margin:0;font:700 20px/1.5 'Times New Roman',serif;letter-spacing:.04em;text-transform:uppercase;color:#fff;text-shadow:1px 1px 2px rgba(0,0,0,.2)}
.tpl-xanhla .mn-dlg-head .mn-x{top:12px;right:12px;background:none;color:rgba(255,255,255,.8)}
.tpl-xanhla .mn-giftdlg .gifts{display:flex;flex-direction:column;align-items:center;gap:16px;padding:16px}
.tpl-xanhla .mn-giftdlg .gift{flex:1;max-width:180px;padding:0;border:0;background:none;text-align:center;color:var(--ink);font-family:system-ui,sans-serif}
.tpl-xanhla .mn-giftdlg .gift-who{margin:0 0 12px;font:500 14px/20px system-ui,sans-serif;color:var(--ink)}
.tpl-xanhla .mn-giftdlg .gift img{width:176px;height:176px;margin:0 auto 12px;padding:8px;border:2px solid color-mix(in srgb,var(--ink) 12.5%,transparent);border-radius:12px;background:#fff;box-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1)}
.tpl-xanhla .mn-giftdlg .gift p{margin:2px 0;font-size:12px}
.tpl-xanhla .mn-giftdlg .gift-acc{gap:6px;font-family:ui-monospace,monospace;letter-spacing:0}
.tpl-xanhla .mn-giftdlg .gift-holder{font-weight:600;color:var(--ink)}
.tpl-xanhla .mn-giftdlg .copy{padding:6px 12px;border:0;border-radius:999px;background:color-mix(in srgb,var(--ink) 8.2%,transparent);color:var(--ink);font-size:12px;font-weight:500}
@media (max-width:639px){.tpl-xanhla .mn-giftdlg{margin:auto auto 0;width:100%;max-width:none;border-radius:16px 16px 0 0}}

.tpl-xanhla .mn-thanks{display:flex;flex-direction:column;align-items:center;padding:0 24px 48px}
.tpl-xanhla .mn-thanks p{margin:0;white-space:pre-line;font-family:'Times New Roman',serif;font-size:12px;line-height:1.5;color:var(--ink)}
.tpl-xanhla .s-story{position:relative;z-index:1;padding:32px 24px;font-family:'Times New Roman',serif;font-size:16px}
.tpl-xanhla .credit{position:relative;padding:0 0 12px;font-size:12px;opacity:.5;color:var(--ink)}

@media (min-width:640px){
  .tpl-xanhla .mn-ocard{width:340px}
  .tpl-xanhla .mn-onames{font-size:36px;line-height:1.1}
  .tpl-xanhla .mn-onames i{font-size:20px}
  .tpl-xanhla .mn-obtn{font-weight:500}
  .tpl-xanhla .mn-giftdlg{width:min(576px,calc(100% - 32px))}
  .tpl-xanhla .mn-giftdlg .gifts{flex-direction:row;flex-wrap:wrap;align-items:flex-start;justify-content:center;padding:24px}
  .tpl-xanhla .mn-giftdlg .gift img{width:192px;height:192px}
  .tpl-xanhla .mn-giftdlg .gift{max-width:none}
}
/* màn hình rộng: cột 900px có viền mảnh, các khối lớn hơn như bản gốc */
@media (min-width:768px){
  .tpl-xanhla .card{max-width:900px;border:1px solid color-mix(in srgb,var(--ink) 13%,transparent)}
  .tpl-xanhla .mn-ocard{width:520px}
  .tpl-xanhla .mn-ofl img{height:400px}
  .tpl-xanhla .mn-ofl .tl{top:-10%;left:-26px;transform:translateX(-11%) rotate(125deg)}
  .tpl-xanhla .mn-ofl .br{bottom:-10%;right:-26px;transform:translateX(11%) rotate(-25deg) scaleX(-1)}
  .tpl-xanhla .mn-obody{padding:96px 24px 32px}
  .tpl-xanhla .mn-oto{max-width:380px}
  .tpl-xanhla .mn-std{font-size:24px}
  .tpl-xanhla .mn-line{width:161px;margin-top:16px}
  .tpl-xanhla .mn-line.l2{margin-top:20px}
  .tpl-xanhla .mn-env{max-width:425px;margin-top:24px}
  .tpl-xanhla .mn-names{gap:8px;margin-top:32px}
  .tpl-xanhla .mn-names p{font-size:70px}
  .tpl-xanhla .mn-names span{font-size:156px}
  .tpl-xanhla .mn-panel-wrap{max-width:560px}
  .tpl-xanhla .mn-invite .mn-box{border-radius:9999px 9999px 10px 10px}
  .tpl-xanhla .mn-inner{zoom:1.2}
  .tpl-xanhla .mn-lead{font-size:20px}
  .tpl-xanhla .mn-couple{gap:16px}
  .tpl-xanhla .mn-couple h3{line-height:60px}
  .tpl-xanhla .mn-when-block{gap:20px}
  .tpl-xanhla .mn-at{font-size:18px}
  .tpl-xanhla .mn-time{font-size:30px}
  .tpl-xanhla .mn-date span{font-size:16px}
  .tpl-xanhla .mn-date b{font-size:40px}
  .tpl-xanhla .mn-year{font-size:24px}
  .tpl-xanhla .mn-lunar{font-size:14px;line-height:20px}
  .tpl-xanhla .mn-cf{max-width:600px}
  .tpl-xanhla .mn-cf-stage{--h:520px}
  .tpl-xanhla .mn-cf .ph[data-o="1"],.tpl-xanhla .mn-cf .ph[data-o="-1"]{width:calc(var(--w) * .44);height:74%}
  .tpl-xanhla .mn-cf .ph[data-o="-1"]{left:calc(50% - var(--w) * .72)}
  .tpl-xanhla .mn-cf-nav{position:absolute;top:50%;z-index:5;display:flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.6);color:var(--ink);font-size:22px;line-height:1;transform:translateY(-50%)}
  .tpl-xanhla .mn-cf-nav.prev{left:0}
  .tpl-xanhla .mn-cf-nav.next{right:0}
  .tpl-xanhla .mn-party-body{gap:20px}
  .tpl-xanhla .mn-marks .t{font-size:20px}
  .tpl-xanhla .mn-cd p{font-size:18px;line-height:28px}
  .tpl-xanhla .mn-calwrap .cal{width:352px}
  .tpl-xanhla .mn-calwrap .cal-grid{font-size:13px}
  .tpl-xanhla .mn-calwrap .cal-grid span{height:34px}
  .tpl-xanhla .mn-calwrap .cal-grid .cal-w{font-size:11px}
  .tpl-xanhla .mn-calwrap .cal-on::before{width:30px;height:28px}
  .tpl-xanhla .mn-calwrap .cal-on b{font-size:12px}
  .tpl-xanhla .mn-map{max-width:560px;height:380px}
  .tpl-xanhla .mn-addr{max-width:440px;font-size:14px}
  .tpl-xanhla .mn-dir{margin-top:20px;font-size:16px;line-height:24px}
  .tpl-xanhla .mn-tl{--gy:40px;column-gap:32px}
  .tpl-xanhla .mn-tl .t{font-size:17px}
  .tpl-xanhla .mn-tl .l{font-size:15px}
  .tpl-xanhla .s-wishes{padding-top:130px}
  .tpl-xanhla .mn-wform{max-width:450px}
  .tpl-xanhla .mn-wform textarea{height:90px}
  .tpl-xanhla .wish-list{margin-top:100px}
  .tpl-xanhla .mn-giftbox .b3{left:160px;top:-120px}
  .tpl-xanhla .mn-thanks p{font-size:13px;max-width:560px}
}
@media (min-width:1024px){
  .tpl-xanhla .mn-ocard{width:600px}
  .tpl-xanhla .mn-oto{max-width:440px}
}
`,
};
