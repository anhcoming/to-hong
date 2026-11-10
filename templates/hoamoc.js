// Mẫu "Hoa Mộc" — boho xanh lá: nền kem, hoa mộc trắng màu nước rải khắp trang, hai khung ảnh chân dung xoay nghiêng.
// Kích thước lấy theo bản gốc (Tailwind): số đầu cho điện thoại, @media 768px / 1024px cho màn rộng.
const { esc } = require('../lib/util');

const A = (n) => `/demo/hoamoc-${n}.webp`; // ảnh trang trí của mẫu (thiếu file thì ẩn đi, không hiện biểu tượng ảnh hỏng)

const base = {
  '--font-title': "'Playfair Display','Baskerville',Georgia,serif",
  '--font-script': "'Ms Madi',cursive",
  '--font-body': "Baskerville,'Libre Baskerville','Times New Roman',serif", // Baskerville có sẵn trên máy Apple như bản gốc
};

const evList = (d) => d.events.filter((e) => e.name || e.place);
// sự kiện chính của tiệc (khung "Thông tin tiệc cưới", bản đồ)
function partyEvent(d) {
  const evs = evList(d);
  return evs.find((e) => /khai tiệc|tiệc cưới/i.test(e.name)) || evs.find((e) => /tiệc/i.test(e.name)) || evs[evs.length - 1] || null;
}
// lễ cưới buổi sáng (khung "Thông tin lễ cưới") = sự kiện đầu tiên có nơi tổ chức, khác tiệc
function ceremonyEvent(d, party) {
  const evs = evList(d);
  return evs.find((e) => e !== party && e.place) || null;
}

// thứ | ngày | tháng, rồi năm bên dưới (vạch ngăn: chữ "|" mờ ở lễ cưới, thanh 2px ở tiệc cưới)
function dateRow(ctx, bar) {
  const p = ctx.dparts;
  const sep = bar ? '<i class="bar"></i>' : '<i>|</i>';
  return `<div class="hm-date${bar ? ' strong' : ''}"><span>${esc(ctx.weekday)}</span>${sep}<b>${p.d}</b>${sep}<span>Tháng ${p.m}</span></div><p class="hm-year">${p.y}</p>`;
}

// "ngày 8 tháng 4 năm Bính Ngọ" như bản gốc (bỏ "Nhằm", bỏ số 0 đầu)
const lunar = (ctx) => ctx.lunar.replace(/^Nhằm /i, '').replace(/ngày 0(\d)/, 'ngày $1');

// hoa mộc nền: [vị trí, góc xoay, độ mờ, lật ngang] — toạ độ theo bản gốc ở 375 / 768 / 1024px (đặt trong CSS)
const FLOWERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

// 12 chiếc lá rơi trên màn mở thiệp (vị trí/nhịp cố định để trang dựng ra luôn giống nhau)
const LEAVES = [
  [43, 19.4, 18.8, 18.3, -16.1, '#c8dfa0'], [72, 18.7, -6.1, 19.7, -13.1, '#c8dfa0'], [80, 20.3, 16.8, 25.5, -6.1, '#a5c862'],
  [89, 18.7, -18.4, 23.4, -9.5, '#a5c862'], [8, 17.2, 12, 21, -3, '#c8dfa0'], [20, 21.5, -14, 24, -18, '#a5c862'],
  [31, 16.4, 9, 19, -8, '#c8dfa0'], [55, 20.8, -11, 22.5, -20, '#a5c862'], [63, 17.9, 15, 26, -2, '#c8dfa0'],
  [94, 19.1, -9, 20.5, -12, '#c8dfa0'], [3, 18.2, 7, 23, -15, '#a5c862'], [48, 21, -16, 25, -5, '#c8dfa0'],
];
const LEAF = '<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/></svg>';

module.exports = {
  id: 'hoamoc',
  name: 'Hoa Mộc',
  group: 'hoa',
  desc: 'Boho xanh lá: nền kem, hoa mộc trắng màu nước, hai khung ảnh chân dung xoay nghiêng',
  fonts: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=EB+Garamond:wght@400;500&family=Ms+Madi&family=Lora:wght@300;400;500;600&family=Libre+Baskerville:wght@400;700&family=Montserrat:wght@400&display=swap',
  palettes: [
    { id: 'xanh-la', name: 'Xanh lá', swatch: ['#fffaf7', '#30530f'], vars: { ...base, '--page': '#ffffff', '--bg': '#fffaf7', '--paper': '#fffaf7', '--ink': '#30530f', '--muted': '#6b8040', '--accent': '#30530f', '--accent-ink': '#fffaf7', '--gold': '#b28e72', '--line': '#d6dcc8', '--hm-frame': '#b28e72', '--hm-role': '#464646', '--hm-bar': '#3b5a2a', '--hm-o1': '#1a3005', '--hm-o2': '#0f2003', '--hm-o3': '#081500', '--hm-leaf': '#6b8040' } },
    { id: 'xanh-reu', name: 'Xanh rêu', swatch: ['#f8f6ee', '#4a5a3a'], vars: { ...base, '--page': '#ffffff', '--bg': '#f8f6ee', '--paper': '#f8f6ee', '--ink': '#4a5a3a', '--muted': '#7f8a68', '--accent': '#4a5a3a', '--accent-ink': '#f8f6ee', '--gold': '#a88f6a', '--line': '#d8d8c6', '--hm-frame': '#a88f6a', '--hm-role': '#4d4d47', '--hm-bar': '#55663f', '--hm-o1': '#2b3420', '--hm-o2': '#1d2416', '--hm-o3': '#11160c', '--hm-leaf': '#7f8a68' } },
  ],
  // dữ liệu xem thử theo bản gốc (tên & bố mẹ giữ của thiệp mẫu chung): lễ thành hôn 9 giờ tại tư gia, tiệc tối 24/5/2026
  demo: {
    date: '2026-05-24',
    time: '18:00',
    message: 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!',
    story: '',
    cover: '/demo/hoamoc-c1.webp',
    photos: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `/demo/hoamoc-${n}.webp`),
    events: [
      { name: 'Lễ Thành Hôn', date: '2026-05-24', time: '09:00', place: 'Tư gia', address: '', mapUrl: '' },
      { name: 'Đón khách', date: '2026-05-24', time: '17:30', place: '', address: '', mapUrl: '' },
      { name: 'Khai tiệc', date: '2026-05-24', time: '18:00', place: 'Tiệc Cưới Hoàng Gia', address: 'Ngõ 74 P. Nguyễn Thị Định, Nhân Chính, Thanh Xuân, Hà Nội', mapUrl: '' },
      { name: 'Rót rượu, cắt bánh', date: '2026-05-24', time: '18:45', place: '', address: '', mapUrl: '' },
      { name: 'Phục vụ món chính', date: '2026-05-24', time: '19:00', place: '', address: '', mapUrl: '' },
      { name: 'Kết thúc tiệc', date: '2026-05-24', time: '21:00', place: '', address: '', mapUrl: '' },
    ],
    gifts: {
      groom: { bin: '970436', acc: '0000000000', holder: 'THIEP CUOI DEMO' },
      bride: { bin: '970418', acc: '6665558888', holder: 'NGUYEN THU HA' },
    },
  },
  // xác nhận tham dự mở trong hộp thoại từ phần tiệc cưới (như bản gốc), nên không có trong luồng trang
  layout: ['invite', 'story', 'gallery', 'calendar', 'events', 'wishes', 'gift', 'thanks'],

  title(text, sub) {
    return `<h2 class="hm-h">${esc(text)}</h2>${sub ? `<p class="sec-sub">${esc(sub)}</p>` : ''}`;
  },

  opener(ctx) {
    const p = ctx.dparts;
    return `
<div class="opener hm-opener" id="opener">
  <div class="hm-leaves" aria-hidden="true">${LEAVES.map(([l, fs, sw, dur, dl, c]) => `<i style="left:${l}%;color:${c};font-size:${fs}px;--sway:${sw}px;animation-duration:${dur}s;animation-delay:${dl}s">${LEAF}</i>`).join('')}</div>
  <div class="hm-ocard">
    <span class="hm-heart" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M12 21s-7.5-4.6-10-9.3C.3 8.3 2.2 4 6.3 4c2.3 0 3.9 1.3 5.7 3.4C13.8 5.3 15.4 4 17.7 4 21.8 4 23.7 8.3 22 11.7 19.5 16.4 12 21 12 21z"/></svg></span>
    <div class="hm-osheet"><img class="f1" onerror="this.style.visibility='hidden'" src="${A('flower')}" alt=""><img class="f2" onerror="this.style.visibility='hidden'" src="${A('flower')}" alt=""></div>
    <div class="hm-obody">
      <h1 class="hm-onames"><span>${esc(ctx.g)}</span><i>&amp;</i><span>${esc(ctx.b)}</span></h1>
      <p class="hm-rule" aria-hidden="true"><span></span><em>❦</em><span></span></p>
      ${p ? `<p class="hm-odate">${+p.d} tháng ${+p.m}, ${p.y}</p>` : ''}
      <p class="hm-oto">${ctx.guest ? `Thân mời ${esc(ctx.guest.name)}` : 'Thân Mời'}</p>
      <button class="hm-obtn" id="openBtn">Mở thiệp<i></i></button>
    </div>
  </div>
</div>`;
  },

  // bìa: hai khung ảnh chân dung xoay nghiêng chéo nhau trên dải hoa lá, tên đặt cạnh mỗi ảnh
  cover(ctx) {
    const { d } = ctx;
    const p1 = d.cover || d.photos[0] || '';
    const p2 = d.photos.find((u) => u !== p1 && d.photos.indexOf(u) > 0) || d.photos[0] || p1;
    const frame = (src) => `<div class="hm-ph"><div>${src ? `<img src="${esc(src)}" alt="Ảnh cưới">` : ''}</div></div>`;
    return `
${FLOWERS.map((k) => `<span class="hm-fl hm-fl-${k}" aria-hidden="true"><img onerror="this.style.visibility='hidden'" src="${A('flower')}" alt=""></span>`).join('')}
<header class="hm-cover">
  <span class="hm-fl hm-fl-top" aria-hidden="true"><img onerror="this.style.visibility='hidden'" src="${A('flower')}" alt=""></span>
  <span class="hm-fl hm-fl-top2" aria-hidden="true"><img onerror="this.style.visibility='hidden'" src="${A('flower')}" alt=""></span>
  <div class="hm-pair">
    <div class="hm-bar" aria-hidden="true"><img onerror="this.style.visibility='hidden'" src="${A('bar')}" alt=""></div>
    <div class="hm-p hm-p1">${frame(p1)}<div class="hm-who"><span>Chú rể</span><p>${esc(ctx.g)}</p></div></div>
    <div class="hm-p hm-p2">${frame(p2)}<div class="hm-who"><span>Cô dâu</span><p>${esc(ctx.b)}</p></div></div>
  </div>
</header>`;
  },

  sections: {
    // "Thông tin lễ cưới": bố mẹ hai bên, tên đầy đủ, nơi & giờ làm lễ, ngày dương + âm
    invite(ctx) {
      const { d, dparts: p } = ctx;
      const strip = (s) => esc(s.replace(/^(Ông|Bà)\s+/i, ''));
      const fam = (x) => `<div class="hm-fam"><span class="k">Ông Bà</span><span class="n">${x.father ? `<span>${strip(x.father)}</span>` : ''}${x.mother ? `<span>${strip(x.mother)}</span>` : ''}</span>${x.address ? `<span class="a">${esc(x.address)}</span>` : ''}</div>`;
      const hasFam = d.groom.father || d.groom.mother || d.bride.father || d.bride.mother;
      const party = partyEvent(d);
      const cer = ceremonyEvent(d, party);
      const time = cer ? cer.time : d.time;
      return `
  <section class="sec hm-invite reveal">
    <h2 class="hm-h hm-h-first">Thông tin lễ cưới</h2>
    ${hasFam ? `<div class="hm-fams">${fam(d.groom)}${fam(d.bride)}</div>` : ''}
    <p class="hm-lead">Trân trọng báo tin<br>lễ thành hôn của con chúng tôi</p>
    <div class="hm-couple">
      <h3>${esc(d.groom.fullName || d.groom.name)}</h3>
      <p class="hm-role">Chú rể</p>
      <p class="hm-amp">&amp;</p>
      <h3>${esc(d.bride.fullName || d.bride.name)}</h3>
      <p class="hm-role">Cô dâu</p>
    </div>
    ${p ? `<div class="hm-when">
      <div class="hm-at">
        ${cer ? `<p class="hm-lead">${esc(cer.name || 'Lễ thành hôn')} được cử hành tại<br>${esc(cer.place)}</p>` : ''}
        ${time ? '<p class="hm-lead">Vào lúc</p>' : ''}
      </div>
      ${time ? `<p class="hm-time">${esc(time)}</p>` : ''}
      ${dateRow(ctx)}
      <p class="hm-lunar">(Tức ${esc(lunar(ctx))})</p>
    </div>` : ''}
  </section>`;
    },

    // album 3D: ảnh giữa thẳng, các ảnh bên lùi sâu và xoay theo trục dọc; vuốt / mũi tên để chuyển, đếm "1 / 8"
    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      return `
  <section class="sec hm-album">
    <h2 class="hm-h">Album ảnh</h2>
    <div class="hm-cf">
      <div class="hm-cf-stage">
        <button class="hm-cf-nav prev" type="button" aria-label="Ảnh trước"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="2" d="M15 18l-6-6 6-6"/></svg></button>
        <button class="hm-cf-nav next" type="button" aria-label="Ảnh sau"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="2" d="M9 18l6-6-6-6"/></svg></button>
        <div class="hm-cf-3d">${ph.map((u, i) => `<button class="ph" data-i="${i}" aria-label="Xem ảnh ${i + 1}"><img loading="lazy" src="${esc(u)}" alt=""></button>`).join('')}</div>
      </div>
      <p class="hm-count"><span>1</span> / ${ph.length}</p>
    </div>
    <script>(function(){
      var s=document.currentScript.parentNode,st=s.querySelector('.hm-cf-stage'),cs=[].slice.call(st.querySelectorAll('.ph')),ct=s.querySelector('.hm-count span'),k=0,n=cs.length;
      // giống bản gốc: mỗi bậc lệch 60% bề ngang, lùi 150px, xoay 45°; thu nhỏ .85 rồi .7; mờ dần .75 / .5 / .3
      function go(i){k=(i+n)%n;cs.forEach(function(c,j){var o=j-k;if(o>n/2)o-=n;if(o<-n/2)o+=n;var a=Math.abs(o);
        c.style.transform='translateX('+(o*60)+'%) translateZ('+(-150*a)+'px) rotateY('+(o*45)+'deg) scale('+(a===0?1:a===1?.85:.7)+')';
        c.style.zIndex=100-a;c.style.opacity=a===0?1:a===1?.75:a===2?.5:.3;c.dataset.o=o;});ct.textContent=k+1;}
      // chạm ảnh bên cạnh thì chuyển tới ảnh đó, chỉ ảnh giữa mới mở xem lớn
      st.addEventListener('click',function(e){var c=e.target.closest('.ph');if(c&&c.dataset.o!=='0'){e.stopPropagation();go(cs.indexOf(c));}},true);
      s.querySelector('.prev').onclick=function(){go(k-1)};s.querySelector('.next').onclick=function(){go(k+1)};
      var x0=null;st.addEventListener('pointerdown',function(e){x0=e.clientX});
      st.addEventListener('pointerup',function(e){if(x0!==null&&Math.abs(e.clientX-x0)>40){go(k+(e.clientX<x0?1:-1));}x0=null});
      go(0);
    })()</script>
  </section>`;
    },

    // "Thông tin tiệc cưới": giờ, ngày, âm lịch, đón khách / khai tiệc, lịch tháng; nút mở hộp thoại xác nhận
    calendar(ctx, opts, h) {
      const { d, dparts: p } = ctx;
      if (!p) return '';
      const evs = evList(d);
      const party = partyEvent(d) || {};
      const time = party.time || d.time;
      const at = evs.indexOf(party);
      const marks = at > 0 && evs[at - 1].time && evs[at - 1] !== ceremonyEvent(d, party) ? [evs[at - 1], party] : [];
      const grid = d.show.calendar ? h.calGrid(ctx, `<p class="hm-calh">Tháng ${+p.m} / ${p.y}</p>`) : '';
      const cal = h.calendarLink(`Đám cưới ${ctx.g} & ${ctx.b}`, ctx.date, time, party.address || party.place);
      const rsvp = d.show.rsvp ? h.rsvp(ctx).replace('sec s-rsvp reveal', 's-rsvp').replace('Giúp chúng mình chuẩn bị chu đáo hơn', 'Sự hiện diện của bạn là niềm vinh hạnh của chúng tôi') : '';
      return `
  <section class="sec hm-party reveal">
    <h2 class="hm-h">Thông tin tiệc cưới</h2>
    <div class="hm-when">
      <h3 class="hm-lead">Tiệc cưới sẽ diễn ra vào lúc:</h3>
      ${time ? `<p class="hm-time">${esc(time)}</p>` : ''}
      ${dateRow(ctx, true)}
      <p class="hm-lunar">(Tức ${esc(lunar(ctx))})</p>
      ${marks.length ? `<div class="hm-marks">${marks.map((e) => `<div><span class="k">${esc(e.name)}</span><span class="t">${esc(e.time)}</span></div>`).join('')}</div>` : ''}
      ${grid ? `<div class="hm-calwrap">${grid}</div>` : ''}
      <a class="hm-link" target="_blank" rel="noopener" href="${esc(cal)}">Thêm vào lịch</a>
    </div>
    ${rsvp ? `<div class="hm-rsvpbtn"><button type="button" onclick="document.getElementById('hmRsvp').showModal()">Xác nhận tham dự</button></div>` : ''}
  </section>
  ${rsvp ? `<dialog class="hm-dlg hm-rsvp" id="hmRsvp"><button class="hm-x" type="button" aria-label="Đóng" onclick="this.closest('dialog').close()">×</button>${rsvp}</dialog>` : ''}`;
    },

    // nơi tổ chức tiệc (bản đồ) + lịch trình ngày cưới (bỏ lễ buổi sáng đã nêu ở phần lễ cưới)
    events(ctx, opts, h) {
      const evs = evList(ctx.d);
      if (!evs.length) return '';
      const party = partyEvent(ctx.d);
      const cer = ceremonyEvent(ctx.d, party);
      const tl = evs.filter((e) => e !== cer);
      const dir = party && (party.mapUrl || (party.address ? h.mapSearch(party.address) : ''));
      return `
  ${party && (party.place || party.address) ? `
  <section class="sec hm-venue reveal">
    <div class="hm-venue-in">
      <div>
        <h3 class="hm-h hm-h-sm">Tiệc cưới sẽ tổ chức tại</h3>
        <p class="hm-addr">${esc([party.place, party.address].filter(Boolean).join(', '))}</p>
      </div>
      <div class="hm-mapcol">
        ${party.address ? `<div class="hm-map"><iframe loading="lazy" title="Bản đồ" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent([party.place, party.address].filter(Boolean).join(', '))}&amp;output=embed"></iframe></div>` : ''}
        ${dir ? `<a class="hm-dir" target="_blank" rel="noopener" href="${esc(dir)}"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M3 11l18-8-8 18-2-8-8-2z"/></svg>Chỉ đường</a>` : ''}
      </div>
    </div>
  </section>` : ''}
  ${tl.length ? `
  <section class="sec hm-sched reveal">
    <h2 class="hm-h">Lịch trình ngày cưới</h2>
    <ol class="hm-tl">
      ${tl.map((e) => {
        const p = h.parts(e.date);
        const other = p && e.date !== ctx.date;
        return `<li><span class="t">${esc(e.time) || '—'}</span><span class="dot"></span><span class="l">${esc(e.name)}${other ? ` <small>${p.d}/${p.m}</small>` : ''}</span></li>`;
      }).join('')}
    </ol>
  </section>` : ''}`;
    },

    // sổ lưu bút: khung viền mảnh, ô nhập dùng chữ gợi ý (giữ id/tên trường cho card.js)
    wishes(ctx, opts) {
      if (!ctx.d.show.wishes) return '';
      const list = opts.wishes || [];
      return `
  <section class="sec s-wishes hm-gb reveal">
    <h2 class="hm-h">Sổ lưu bút</h2>
    <form class="hm-wform" id="wishForm">
      <div class="hm-wbox">
        <input name="name" required maxlength="60" placeholder="Nhập tên*" value="${ctx.guest ? esc(ctx.guest.name) : ''}" aria-label="Tên">
        <textarea name="message" required maxlength="500" rows="4" placeholder="Nhập lời chúc*" aria-label="Lời chúc"></textarea>
        <div class="hm-wrow"><p class="form-msg" role="status"></p><button type="submit">Gửi lời chúc</button></div>
      </div>
    </form>
    <div class="wish-list" id="wishList">
      ${list.map((w) => `<div class="wish"><b>${esc(w.name)}</b><p>${esc(w.message)}</p></div>`).join('')}
    </div>
  </section>`;
    },

    // hộp quà mừng: hộp quà nổi, sao lấp lánh; chạm để mở hộp thoại có mã QR của hai bên
    gift(ctx, opts, h) {
      if (!ctx.d.show.gift) return '';
      const who = (p, label) => `${label}${p.holder ? ` - ${esc(p.holder)}` : ''}`;
      const html = h.giftCard(ctx, ctx.d.gifts.groom, 'groom').replace('Mừng cưới chú rể', who(ctx.d.gifts.groom, 'Chú Rể'))
        + h.giftCard(ctx, ctx.d.gifts.bride, 'bride').replace('Mừng cưới cô dâu', who(ctx.d.gifts.bride, 'Cô Dâu'));
      if (!html) return '';
      const mini = [
        ['boho-floral-pink', 'left:-20px;top:10px;width:34px;z-index:1;transform:rotate(-22deg)'],
        ['porcelain-brown', 'left:168px;top:2px;width:38px;z-index:1;transform:rotate(20deg)'],
        ['nhat-binh-red', 'left:-16px;top:120px;width:26px;z-index:1;transform:rotate(-18deg)'],
        ['florence-brown', 'left:182px;top:114px;width:24px;z-index:1;transform:rotate(14deg)'],
        ['double-phoenix-red', 'left:-8px;top:172px;width:44px;z-index:3;transform:rotate(8deg)'],
        ['san-miguel-yellow', 'left:26px;top:182px;width:26px;z-index:3;transform:rotate(-10deg)'],
        ['minimalism-darkred', 'left:118px;top:176px;width:40px;z-index:3;transform:rotate(-14deg)'],
      ];
      return `
  <section class="sec hm-giftbox reveal">
    <h2 class="hm-h">Hộp quà mừng</h2>
    <button class="hm-gbtn" type="button" onclick="document.getElementById('hmGift').showModal()">
      <span class="hm-gin">
        <i class="sp s1">✦</i><i class="sp s2">✦</i><i class="sp s3">✦</i><i class="sp s4">✦</i>
        <span class="hm-bob">
          <span class="sh"></span>
          ${mini.map(([n, st], i) => `<img class="mini m${i + 1}" onerror="this.style.visibility='hidden'" src="${A('mini-' + n)}" alt="" style="${st}">`).join('')}
          <span class="box"><img onerror="this.parentNode.classList.add('miss');this.remove()" src="${A('giftbox')}" alt=""></span>
        </span>
      </span>
      <span class="hint">Nhấn để mở</span>
    </button>
  </section>
  <dialog class="hm-dlg hm-giftdlg" id="hmGift">
    <div class="hm-dlg-head"><h2>Hộp quà mừng</h2><button class="hm-x" type="button" aria-label="Đóng" onclick="this.closest('dialog').close()">×</button></div>
    <div class="gifts">${html}</div>
  </dialog>`;
    },

    // lời kết = lời nhắn của cô dâu chú rể
    thanks(ctx) {
      return `
  <section class="sec hm-thanks reveal">
    <p>${esc(ctx.d.message || 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!')}</p>
  </section>`;
    },
  },

  css: `
.tpl-hoamoc{background:var(--page)}
.tpl-hoamoc .card{max-width:480px;background:var(--bg);color:var(--ink);font-family:var(--font-body);font-weight:300;box-shadow:none;isolation:isolate;overflow:clip} /* clip: hoa tràn mép không tạo vùng cuộn bên trong thẻ (đóng hộp thoại trả focus sẽ không cuộn lệch) */
.tpl-hoamoc .sec{padding:0;z-index:1}
.tpl-hoamoc .hm-h{position:relative;margin:0;font-family:'Times New Roman',Times,serif;font-weight:700;font-size:24px;line-height:1.5;letter-spacing:1px;text-transform:uppercase;text-align:center;color:var(--ink)}
.tpl-hoamoc .sec-sub{margin:4px 0 0;color:var(--muted);font-size:14px}
.tpl-hoamoc p,.tpl-hoamoc h3{margin:0}

/* ---- hoa mộc rải nền (ảnh flower.webp xoay/mờ theo bản gốc) ---- */
.tpl-hoamoc .hm-fl{position:absolute;z-index:-1;pointer-events:none}
.tpl-hoamoc .hm-fl img{width:100%;height:auto}
.tpl-hoamoc .hm-fl-a{top:503px;left:-181.5px;width:415.05px;rotate:-60.58deg}
.tpl-hoamoc .hm-fl-b{top:302px;right:-220px;width:610px;opacity:.15;rotate:152deg}
.tpl-hoamoc .hm-fl-c{top:1054px;left:-110px;width:750px;opacity:.15;rotate:132deg}
.tpl-hoamoc .hm-fl-d{top:2350px;left:-388.5px;width:558.77px}
.tpl-hoamoc .hm-fl-e{top:1848px;right:-340px;width:750px;opacity:.15;rotate:122deg}
.tpl-hoamoc .hm-fl-f{top:1180px;right:-142px;width:290px;scale:-1 1;rotate:-36deg}
.tpl-hoamoc .hm-fl-g{top:2545px;left:-290px;width:1062px;opacity:.15;rotate:128deg}
.tpl-hoamoc .hm-fl-h{top:4060px;left:-35%;width:297px;rotate:176deg}
.tpl-hoamoc .hm-fl-i{top:2960px;right:-142px;width:290px;scale:-1 1;rotate:-36deg}
.tpl-hoamoc .hm-fl-j{bottom:100px;right:-400px;width:600px;opacity:.2;rotate:139deg}

/* ---- màn mở thiệp: nền xanh đậm, lá rơi, thẻ kem có hoa mộc ---- */
.tpl-hoamoc .hm-opener{overflow:hidden;background:linear-gradient(to bottom right,var(--hm-o1),var(--hm-o2),var(--hm-o3))}
.tpl-hoamoc .hm-leaves{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none}
.tpl-hoamoc .hm-leaves i{position:absolute;top:-30px;line-height:1;animation:hmFall 20s ease-in-out infinite}
.tpl-hoamoc .hm-leaves svg{display:block}
@keyframes hmFall{0%{transform:translateY(-8vh) translateX(0) rotate(0);opacity:0}10%{opacity:.5}50%{transform:translateY(48vh) translateX(var(--sway,20px)) rotate(180deg);opacity:.6}92%{opacity:.45}100%{transform:translateY(105vh) translateX(0) rotate(360deg);opacity:0}}
.tpl-hoamoc .hm-ocard{position:relative;z-index:10;width:310px;max-width:calc(100vw - 32px);text-align:center;border-radius:8px;box-shadow:0 25px 60px -12px rgba(0,0,0,.45),0 8px 24px rgba(0,0,0,.2),0 0 40px rgba(107,128,64,.15)}
.tpl-hoamoc .hm-osheet{position:absolute;inset:0;overflow:hidden;border-radius:8px;background:color-mix(in srgb,var(--bg) 95%,transparent);border:1px solid rgba(107,128,64,.15);pointer-events:none}
.tpl-hoamoc .hm-osheet img{position:absolute;width:300px;max-width:none}
.tpl-hoamoc .hm-osheet .f1{top:-40px;left:-50%;opacity:.4}
.tpl-hoamoc .hm-osheet .f2{bottom:-10%;right:-50%;opacity:.3;rotate:160deg}
.tpl-hoamoc .hm-heart{position:absolute;left:50%;top:50px;z-index:2;width:56px;height:56px;display:grid;place-items:center;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle at 30% 30%,var(--accent),var(--hm-o1));color:#fff;box-shadow:0 4px 20px color-mix(in srgb,var(--accent) 50%,transparent)}
.tpl-hoamoc .hm-obody{position:relative;z-index:1;padding:112px 24px 56px}
.tpl-hoamoc .hm-onames{display:flex;flex-direction:column;align-items:center;margin:0 0 8px;font-family:var(--font-title);font-weight:400;font-size:30px;line-height:1.25;color:var(--accent)}
.tpl-hoamoc .hm-onames i{font-style:normal;font-family:var(--font-body);font-size:18px;line-height:1}
.tpl-hoamoc .hm-rule{display:flex;align-items:center;justify-content:center;gap:12px;margin:0 0 8px}
.tpl-hoamoc .hm-rule span{width:40px;height:1px;background:linear-gradient(to right,transparent,var(--hm-leaf))}
.tpl-hoamoc .hm-rule span:last-child{background:linear-gradient(to left,transparent,var(--hm-leaf))}
.tpl-hoamoc .hm-rule em{font-style:normal;font-size:14px;color:var(--hm-leaf);opacity:.7}
.tpl-hoamoc .hm-odate,.tpl-hoamoc .hm-oto{font-family:'Lora',serif;font-size:18px;font-weight:300;color:color-mix(in srgb,var(--accent) 70%,transparent)}
.tpl-hoamoc .hm-odate{margin:0 0 20px;font-weight:400}
.tpl-hoamoc .hm-oto{margin:0 0 32px}
.tpl-hoamoc .hm-obtn{position:relative;overflow:hidden;padding:10px 32px;border:0;border-radius:999px;background:var(--accent);color:var(--accent-ink);font-family:'Lora',serif;font-size:18px;line-height:28px;font-weight:600;box-shadow:0 4px 14px color-mix(in srgb,var(--accent) 35%,transparent)}
.tpl-hoamoc .hm-obtn i{position:absolute;top:0;left:-100%;width:32px;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);animation:hmShine 3s ease-in-out infinite;pointer-events:none}
@keyframes hmShine{0%{left:-100%}50%,100%{left:100%}}
@media (prefers-reduced-motion:reduce){.tpl-hoamoc .hm-leaves,.tpl-hoamoc .hm-obtn i{display:none}}

/* ---- bìa: hai khung ảnh chéo nhau trên dải hoa lá ---- */
.tpl-hoamoc .hm-cover{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;min-height:840px;padding:210px 24px 16px;text-align:center}
.tpl-hoamoc .hm-fl-top{top:-327px;left:111.5px;width:622.77px;rotate:-.76deg;z-index:-1}
.tpl-hoamoc .hm-fl-top2{top:5px;left:-83px;width:450px;opacity:.2;scale:-1 1;rotate:142deg;z-index:-1}
.tpl-hoamoc .hm-pair{position:relative;z-index:1;width:320px;height:440px;margin:0 auto}
.tpl-hoamoc .hm-bar{position:absolute;left:50%;top:170px;z-index:-1;width:100vw;max-width:900px;height:48px;transform:translate(-50%,-50%);background:var(--hm-bar)}
.tpl-hoamoc .hm-bar img{width:100%;height:100%;object-fit:cover}
.tpl-hoamoc .hm-p{position:absolute;display:flex;align-items:center;gap:12px}
.tpl-hoamoc .hm-p1{left:20px;top:-40px;z-index:2}
.tpl-hoamoc .hm-p2{left:55px;top:165px;z-index:3;flex-direction:row-reverse}
.tpl-hoamoc .hm-ph{width:155px;flex-shrink:0;rotate:-17deg}
.tpl-hoamoc .hm-p2 .hm-ph{rotate:13deg}
.tpl-hoamoc .hm-ph div{position:relative;aspect-ratio:2/3;overflow:hidden;border:5px solid var(--hm-frame);background:var(--line)}
.tpl-hoamoc .hm-ph img{width:100%;height:100%;object-fit:cover}
.tpl-hoamoc .hm-who{display:flex;flex-direction:column;align-items:flex-start}
.tpl-hoamoc .hm-p2 .hm-who{align-items:flex-end}
.tpl-hoamoc .hm-who span{font-family:var(--font-body);font-size:12px;line-height:1.5;letter-spacing:.1em;color:var(--hm-role)}
.tpl-hoamoc .hm-who p{font-family:var(--font-title);font-size:25px;line-height:1.5;white-space:nowrap;color:var(--ink)}

/* ---- thông tin lễ cưới ---- */
.tpl-hoamoc .hm-h-first{margin:40px 0 24px;padding:0 16px}
.tpl-hoamoc .hm-fams{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:24px;text-align:center}
.tpl-hoamoc .hm-fam{display:flex;flex-direction:column;gap:6px;min-width:0}
.tpl-hoamoc .hm-fam .k{font-size:16px;line-height:1.5}
.tpl-hoamoc .hm-fam .n{display:flex;flex-direction:column;gap:6px;font-weight:600;font-size:13px;line-height:1.5;overflow-wrap:anywhere}
.tpl-hoamoc .hm-fam .a{width:90%;margin:4px auto 0;font-size:10px;line-height:1.5;overflow-wrap:anywhere}
.tpl-hoamoc .hm-lead{font-family:var(--font-body);font-weight:400;font-size:16px;line-height:1.5;text-transform:uppercase;text-align:center}
.tpl-hoamoc .hm-invite>.hm-lead{margin:0 auto 24px;font-weight:300}
.tpl-hoamoc .hm-couple{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}
.tpl-hoamoc .hm-couple h3{width:100%;font-family:'EB Garamond',Georgia,serif;font-weight:400;font-size:40px;line-height:55px;white-space:nowrap}
.tpl-hoamoc .hm-role{font-size:10px;line-height:1.33;letter-spacing:1px;text-transform:uppercase}
.tpl-hoamoc .hm-amp{font-family:var(--font-script);font-size:35px;line-height:1.5}
.tpl-hoamoc .hm-when{display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center}
.tpl-hoamoc .hm-invite .hm-when{margin-top:24px}
.tpl-hoamoc .hm-at{display:flex;flex-direction:column;align-items:center;gap:8px}
.tpl-hoamoc .hm-at .hm-lead+.hm-lead{margin-bottom:8px}
.tpl-hoamoc .hm-time{font-size:20px;line-height:1.5}
.tpl-hoamoc .hm-date{display:flex;align-items:center;gap:24px;text-transform:uppercase}
.tpl-hoamoc .hm-date span{font-size:12px;line-height:1.5}
.tpl-hoamoc .hm-date span:first-child{text-align:right}
.tpl-hoamoc .hm-date b{font-weight:inherit;font-size:30px;line-height:1.5}
.tpl-hoamoc .hm-date i{display:flex;align-items:center;font-style:normal;font-size:20px;line-height:1;opacity:.5}
.tpl-hoamoc .hm-date i.bar{width:2px;height:24px;background:var(--ink);opacity:1}
.tpl-hoamoc .hm-date.strong{font-weight:600}
.tpl-hoamoc .hm-year{font-size:18px;line-height:1.5}
.tpl-hoamoc .hm-lunar{font-size:12px;line-height:16px;letter-spacing:.25em;text-transform:uppercase}

/* ---- album 3D ---- */
.tpl-hoamoc .hm-album{display:flex;flex-direction:column;align-items:center;padding:40px 24px}
.tpl-hoamoc .hm-cf{position:relative;z-index:10;width:100%;max-width:390px;margin-top:24px}
.tpl-hoamoc .hm-cf-stage{position:relative;height:340px;touch-action:pan-y}
.tpl-hoamoc .hm-cf-3d{position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:100%;perspective:1000px}
.tpl-hoamoc .hm-cf .ph{position:absolute;height:92%;aspect-ratio:2/3;padding:0;border:0;border-radius:16px;overflow:hidden;background:var(--line);box-shadow:0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1);transition:all 1.1s ease-in-out;cursor:pointer}
.tpl-hoamoc .hm-cf .ph[data-o="0"]{box-shadow:0 0 0 2px rgba(255,255,255,.3),0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1)}
.tpl-hoamoc .hm-cf .ph img{width:100%;height:100%;object-fit:cover}
.tpl-hoamoc .hm-cf-nav{display:none}
.tpl-hoamoc .hm-count{margin-top:12px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;line-height:20px;font-variant-numeric:tabular-nums;opacity:.6;text-align:center}

/* ---- tiệc cưới + lịch tháng ---- */
.tpl-hoamoc .hm-party>.hm-h{margin:40px 0 24px;padding:0 16px}
.tpl-hoamoc .hm-party .hm-date span:first-child{font-weight:600}
.tpl-hoamoc .hm-party h3.hm-lead{font-family:Gotham,'Montserrat',sans-serif} /* bản gốc khai Gotham (không tải) nên hiện chữ không chân */
.tpl-hoamoc .hm-marks{display:flex;justify-content:center;gap:32px;margin-top:16px}
.tpl-hoamoc .hm-marks div{display:flex;flex-direction:column;align-items:center}
.tpl-hoamoc .hm-marks .k{font-size:12px;line-height:16px;letter-spacing:.05em;text-transform:uppercase}
.tpl-hoamoc .hm-marks .t{margin-top:4px;font-size:18px;line-height:28px;font-weight:600}
.tpl-hoamoc .hm-calwrap{width:296px;max-width:100%;margin-top:8px}
.tpl-hoamoc .hm-calwrap .cal{width:100%;margin:0;border:1px solid color-mix(in srgb,var(--ink) 27%,transparent);border-radius:8px;overflow:hidden;color:var(--ink)}
.tpl-hoamoc .hm-calh{padding:10px 0;border-bottom:1px solid color-mix(in srgb,var(--ink) 27%,transparent);font-size:13px;line-height:19.5px;font-weight:600;letter-spacing:.025em;text-align:center}
.tpl-hoamoc .hm-party{--cal-hi:var(--ink);--cal-on:#fff}
.tpl-hoamoc .hm-calwrap .cal-grid{row-gap:2px;padding:0 4px 8px;font-size:12px;color:var(--ink)}
.tpl-hoamoc .hm-calwrap .cal-grid span{height:30px}
.tpl-hoamoc .hm-calwrap .cal-grid .cal-w{height:auto;margin:0 -4px 6px;padding:6px 0;border-bottom:2px solid var(--ink);font-size:10px;line-height:15px;font-weight:500;letter-spacing:0;opacity:1;color:color-mix(in srgb,var(--ink) 60%,transparent)}
.tpl-hoamoc .hm-calwrap .cal-on::before{width:26px;height:24px}
.tpl-hoamoc .hm-calwrap .cal-on b{font-size:11px}
.tpl-hoamoc .hm-link{margin-top:16px;font-size:14px;line-height:20px;letter-spacing:.05em;color:var(--ink);text-decoration:underline;text-underline-offset:4px;text-decoration-thickness:1px}
.tpl-hoamoc .hm-rsvpbtn{position:relative;z-index:10;display:flex;justify-content:center;margin:32px 0}
.tpl-hoamoc .hm-rsvpbtn button{padding:8px 24px;border:0;border-radius:10px;background:var(--accent);color:var(--accent-ink);font-family:var(--font-body);font-size:16px;line-height:24px;font-weight:600;text-transform:uppercase;transition:transform .2s}
.tpl-hoamoc .hm-rsvpbtn button:hover{transform:scale(1.03)}

/* ---- nơi tổ chức ---- */
.tpl-hoamoc .hm-venue{padding-top:40px}
.tpl-hoamoc .hm-venue-in{display:flex;flex-direction:column;gap:24px;padding:0 24px 48px}
.tpl-hoamoc .hm-h-sm{font-size:20px}
.tpl-hoamoc .hm-addr{max-width:384px;margin:12px auto 0;padding-bottom:12px;font-size:14px;line-height:20px;letter-spacing:.025em;text-align:center}
.tpl-hoamoc .hm-mapcol{display:flex;flex-direction:column;align-items:center;gap:16px;width:100%}
.tpl-hoamoc .hm-map{width:100%;max-width:338px;height:267px;border-radius:15px;overflow:hidden;background:var(--line)}
.tpl-hoamoc .hm-map iframe{display:block;width:100%;height:100%;border:0}
.tpl-hoamoc .hm-dir{display:inline-flex;align-items:center;gap:8px;padding:8px 20px;border-radius:999px;font-size:14px;line-height:20px;font-weight:600;color:var(--ink);text-decoration:none;transition:transform .2s}
.tpl-hoamoc .hm-dir:hover{transform:scale(1.03)}

/* ---- lịch trình: giờ | chấm | tên, vạch dọc qua tâm các chấm ---- */
.tpl-hoamoc .hm-sched{display:flex;flex-direction:column;gap:24px;margin:40px 0;padding:0 8px}
.tpl-hoamoc .hm-tl{--gy:32px;display:grid;grid-template-columns:minmax(0,1fr) 16px minmax(0,1fr);align-items:center;column-gap:24px;row-gap:var(--gy);width:100%;max-width:460px;margin:0 auto;padding:0;list-style:none}
.tpl-hoamoc .hm-tl li{display:contents}
.tpl-hoamoc .hm-tl .t{padding-top:2px;text-align:right;font-size:16px;line-height:1.375;letter-spacing:.025em;font-variant-numeric:tabular-nums}
.tpl-hoamoc .hm-tl .l{padding-top:2px;text-align:left;font-size:17px;line-height:1.375;font-weight:500}
.tpl-hoamoc .hm-tl .dot{position:relative;align-self:stretch;display:flex;align-items:center;justify-content:center}
.tpl-hoamoc .hm-tl .dot::before{content:"";position:absolute;left:50%;width:1px;top:calc(-1 * var(--gy));bottom:calc(-1 * var(--gy));transform:translateX(-50%);background:color-mix(in srgb,var(--ink) 40%,transparent)}
.tpl-hoamoc .hm-tl li:first-child .dot::before{top:50%}
.tpl-hoamoc .hm-tl li:last-child .dot::before{bottom:50%}
.tpl-hoamoc .hm-tl li:only-child .dot::before{display:none}
.tpl-hoamoc .hm-tl .dot::after{content:"";position:relative;width:10px;height:10px;border-radius:50%;background:var(--ink);box-shadow:0 0 0 2px color-mix(in srgb,var(--ink) 13%,transparent)}
.tpl-hoamoc .hm-tl small{font-size:inherit;opacity:.8}

/* ---- sổ lưu bút ---- */
.tpl-hoamoc .hm-gb{padding:40px 24px 32px}
.tpl-hoamoc .hm-wform{width:100%;margin:24px auto 0}
.tpl-hoamoc .hm-wbox{padding:24px;border:1px solid color-mix(in srgb,var(--ink) 25%,transparent);border-radius:8px;background:color-mix(in srgb,var(--ink) 3%,transparent);box-shadow:0 1px 2px rgba(0,0,0,.05)}
.tpl-hoamoc .hm-wbox input,.tpl-hoamoc .hm-wbox textarea{display:block;width:100%;padding:12px 16px;border:1px solid var(--ink);border-radius:8px;background:color-mix(in srgb,var(--ink) 4%,transparent);color:var(--ink);font:300 14px/20px var(--font-body);outline:none;resize:none}
.tpl-hoamoc .hm-wbox input{margin-bottom:16px}
.tpl-hoamoc .hm-wbox textarea{display:inline-block;vertical-align:baseline} /* ô chữ nằm trên dòng như bản gốc: chừa ~7px khoảng chân chữ bên dưới */
.tpl-hoamoc .hm-wbox ::placeholder{color:color-mix(in srgb,var(--ink) 55%,transparent)}
.tpl-hoamoc .hm-wrow{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:16px}
.tpl-hoamoc .hm-wrow .form-msg{flex:1;margin:0;font-size:12px;text-align:left}
.tpl-hoamoc .hm-wrow button{padding:8px 24px;border:0;border-radius:10px;background:var(--ink);color:#fff;font:600 14px/20px var(--font-body);text-transform:uppercase;transition:transform .2s}
.tpl-hoamoc .wish-list{width:100%;max-height:500px;margin:32px auto 0;padding-right:8px;overflow-y:auto;text-align:left}
.tpl-hoamoc .wish{margin:0 0 12px;padding:16px;border:1px solid color-mix(in srgb,var(--ink) 25%,transparent);border-radius:8px;background:color-mix(in srgb,var(--ink) 2%,transparent);box-shadow:0 1px 2px rgba(0,0,0,.05);font-size:14px;color:var(--ink)}
.tpl-hoamoc .wish b{font-weight:600;font-size:14px;line-height:20px;color:var(--ink)}
.tpl-hoamoc .wish p{margin:8px 0 0;line-height:1.625;color:var(--ink)}

/* ---- hộp quà mừng (hộp nổi, sao lấp lánh, hình nhỏ bay lên khi rê chuột — theo bản gốc) ---- */
.tpl-hoamoc .hm-giftbox{display:flex;flex-direction:column;align-items:center;padding:32px 0 40px}
.tpl-hoamoc .hm-giftbox .hm-h{margin-bottom:16px}
.tpl-hoamoc .hm-gbtn{position:relative;width:260px;height:280px;padding:0;border:0;background:none;outline:none;cursor:pointer}
.tpl-hoamoc .hm-gin{position:relative;display:flex;align-items:flex-end;justify-content:center;width:100%;height:100%;padding-bottom:26px}
.tpl-hoamoc .hm-bob{position:relative;display:block;width:200px;height:220px;animation:hmBob 3s ease-in-out infinite}
.tpl-hoamoc .hm-bob .sh{position:absolute;left:50%;bottom:-8px;width:144px;height:12px;margin-left:-72px;border-radius:50%;background:rgba(0,0,0,.3);filter:blur(4px);animation:hmShadow 3s ease-in-out infinite}
.tpl-hoamoc .hm-bob .mini{position:absolute;max-width:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.25));pointer-events:none}
/* hộp quà: khối xanh vẽ bằng CSS làm nền, ảnh hộp của mẫu phủ lên khi có */
.tpl-hoamoc .hm-bob .box{position:absolute;left:50%;bottom:0;z-index:2;width:170px;margin-left:-85px;transform-origin:50% 100%;filter:drop-shadow(0 10px 18px rgba(0,0,0,.22))}
.tpl-hoamoc .hm-bob .box img{width:100%;max-height:220px;object-fit:contain}
/* chưa có ảnh hộp quà của mẫu: vẽ tạm hộp xanh có dải ruy băng */
.tpl-hoamoc .hm-bob .box.miss{height:150px;border-radius:10px;background:linear-gradient(90deg,transparent 44%,var(--gold) 44% 56%,transparent 56%),linear-gradient(160deg,color-mix(in srgb,var(--accent) 75%,#fff),var(--accent))}
.tpl-hoamoc .hm-gbtn:hover .box,.tpl-hoamoc .hm-gbtn:focus-visible .box{animation:hmPop .7s cubic-bezier(.34,1.56,.64,1) forwards}
.tpl-hoamoc .hm-gbtn:hover .m1,.tpl-hoamoc .hm-gbtn:focus-visible .m1{animation:hmUp 1.6s ease-in-out infinite;--x:-14px;--y:-55px}
.tpl-hoamoc .hm-gbtn:hover .m2,.tpl-hoamoc .hm-gbtn:focus-visible .m2{animation:hmUp 1.8s ease-in-out .15s infinite;--x:14px;--y:-60px}
.tpl-hoamoc .hm-gbtn:hover .m3,.tpl-hoamoc .hm-gbtn:focus-visible .m3{animation:hmUp 1.4s ease-in-out .3s infinite;--x:-10px;--y:-65px}
.tpl-hoamoc .hm-gbtn:hover .m4,.tpl-hoamoc .hm-gbtn:focus-visible .m4{animation:hmUp 1.7s ease-in-out .45s infinite;--x:12px;--y:-70px}
.tpl-hoamoc .hm-gbtn:hover .m5,.tpl-hoamoc .hm-gbtn:focus-visible .m5{animation:hmUp 1.9s ease-in-out .1s infinite;--x:-8px;--y:-80px}
.tpl-hoamoc .hm-gbtn:hover .m6,.tpl-hoamoc .hm-gbtn:focus-visible .m6{animation:hmUp 1.3s ease-in-out .35s infinite;--x:10px;--y:-75px}
.tpl-hoamoc .hm-gbtn:hover .m7,.tpl-hoamoc .hm-gbtn:focus-visible .m7{animation:hmUp 1.7s ease-in-out .2s infinite;--x:14px;--y:-72px}
.tpl-hoamoc .hm-gin .sp{position:absolute;z-index:20;font-style:normal;line-height:1.5;color:var(--ink);opacity:0;pointer-events:none;animation:hmSpark 2s ease-in-out infinite}
.tpl-hoamoc .hm-gin .s1{top:8%;left:14%;font-size:22px}
.tpl-hoamoc .hm-gin .s2{top:18%;right:10%;font-size:16px;animation-delay:.6s}
.tpl-hoamoc .hm-gin .s3{top:32%;left:5%;font-size:14px;animation-delay:1.2s}
.tpl-hoamoc .hm-gin .s4{top:26%;right:5%;font-size:14px;animation-delay:1.7s}
.tpl-hoamoc .hm-gbtn .hint{position:absolute;left:50%;bottom:0;transform:translateX(-50%);white-space:nowrap;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;line-height:16px;font-weight:500;color:var(--ink);animation:hmHint 2s ease-in-out infinite}
@keyframes hmBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes hmShadow{0%,100%{transform:scaleX(1);opacity:.3}50%{transform:scaleX(.9);opacity:.18}}
@keyframes hmSpark{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1.15)}}
@keyframes hmHint{0%,100%{opacity:.45}50%{opacity:1}}
@keyframes hmPop{0%{transform:translateY(0) scale(1) rotate(0)}45%{transform:translateY(-14px) scale(1.08) rotate(-3deg)}100%{transform:translateY(-8px) scale(1.05) rotate(0)}}
@keyframes hmUp{0%{translate:0;opacity:1}55%{translate:calc(var(--x) * .45) calc(var(--y) * .5);opacity:1}80%{translate:var(--x) var(--y);opacity:0}81%{translate:0;opacity:0}100%{translate:0;opacity:1}}
@media (prefers-reduced-motion:reduce){.tpl-hoamoc .hm-gbtn *{animation:none!important}}

/* ---- hộp thoại (xác nhận tham dự, quà mừng) ---- */
.tpl-hoamoc .hm-dlg{width:min(448px,calc(100% - 32px));max-height:85vh;padding:0;border:0;border-radius:16px;background:#fff;color:#111827;box-shadow:0 25px 50px -12px rgba(0,0,0,.25);overflow:auto}
.tpl-hoamoc .hm-dlg::backdrop{background:rgba(0,0,0,.6);backdrop-filter:blur(4px)}
.tpl-hoamoc .hm-x{position:absolute;top:16px;right:16px;z-index:1;width:32px;height:32px;border:0;border-radius:50%;background:#f3f4f6;color:#6b7280;font-size:20px;line-height:1}
.tpl-hoamoc .hm-rsvp .s-rsvp{padding:24px;text-align:left}
.tpl-hoamoc .hm-rsvp .hm-h{margin:0 40px 4px 0;font-family:system-ui,sans-serif;font-size:20px;font-weight:600;letter-spacing:0;text-transform:none;text-align:left;color:#111827}
.tpl-hoamoc .hm-rsvp .sec-sub{margin:0 0 24px;font-family:system-ui,sans-serif;color:#6b7280}
.tpl-hoamoc .hm-rsvp .form{gap:16px;padding:0;border:0;background:none;font-family:system-ui,sans-serif}
.tpl-hoamoc .hm-rsvp .form label{font-size:14px;font-weight:500;color:#374151}
.tpl-hoamoc .hm-rsvp .form input:not([type=radio]),.tpl-hoamoc .hm-rsvp .form select{padding:12px 16px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;font-size:16px;color:#111827}
.tpl-hoamoc .hm-rsvp .choice label{padding:10px 12px;border:2px solid #f3f4f6;border-radius:12px;background:rgba(249,250,251,.5);font-size:14px;color:#374151}
.tpl-hoamoc .hm-rsvp .choice label:has(input:checked){border-color:var(--accent)}
.tpl-hoamoc .hm-rsvp .btn{padding:14px;border:0;border-radius:12px;background:var(--accent);color:var(--accent-ink);font-size:14px;font-weight:600;box-shadow:0 4px 12px -2px rgba(0,0,0,.2)}
.tpl-hoamoc .hm-giftdlg{width:min(512px,calc(100% - 32px));background:var(--bg)}
.tpl-hoamoc .hm-dlg-head{position:relative;padding:24px 24px 16px;background:var(--accent);text-align:center}
.tpl-hoamoc .hm-dlg-head h2{margin:0;font:700 24px/1.5 'Times New Roman',serif;letter-spacing:1px;text-transform:uppercase;color:#fff;text-shadow:1px 1px 2px rgba(0,0,0,.2)}
.tpl-hoamoc .hm-dlg-head .hm-x{top:12px;right:12px;background:none;color:rgba(255,255,255,.8)}
.tpl-hoamoc .hm-giftdlg .gifts{display:flex;flex-direction:column;align-items:center;gap:16px;padding:16px}
.tpl-hoamoc .hm-giftdlg .gift{flex:1;max-width:180px;padding:0;border:0;background:none;text-align:center;color:var(--accent);font-family:system-ui,sans-serif}
.tpl-hoamoc .hm-giftdlg .gift-who{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2rem;margin:0 0 8px;font:500 12px/16px system-ui,sans-serif;color:var(--accent)}
.tpl-hoamoc .hm-giftdlg .gift img{width:128px;height:128px;margin:0 auto 8px;padding:8px;border:2px solid color-mix(in srgb,var(--accent) 12.5%,transparent);border-radius:12px;background:#fff;box-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1)}
.tpl-hoamoc .hm-giftdlg .gift p{margin:2px 0;font-size:10px}
.tpl-hoamoc .hm-giftdlg .gift-acc{gap:6px;font-family:ui-monospace,monospace;letter-spacing:0}
.tpl-hoamoc .hm-giftdlg .gift-holder{font-weight:600;color:var(--accent)}
.tpl-hoamoc .hm-giftdlg .copy{padding:4px 8px;border:0;border-radius:999px;background:color-mix(in srgb,var(--accent) 8%,transparent);font-size:10px;font-weight:500;color:var(--accent)}
@media (max-width:639px){.tpl-hoamoc .hm-giftdlg{margin:auto auto 0;width:100%;max-width:none;border-radius:16px 16px 0 0}}

.tpl-hoamoc .hm-thanks{display:flex;flex-direction:column;align-items:center;padding:0 24px 48px}
.tpl-hoamoc .hm-thanks p{white-space:pre-line;font-size:16px;line-height:1.5;text-align:center;color:var(--ink)}
.tpl-hoamoc .s-story{padding:32px 24px;font-size:16px}
.tpl-hoamoc .credit{position:relative;z-index:1;padding:0 0 8px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;opacity:.5;color:var(--ink)}

@media (min-width:640px){
  .tpl-hoamoc .hm-ocard{width:340px}
  .tpl-hoamoc .hm-onames{font-size:36px}
  .tpl-hoamoc .hm-onames i{font-size:20px}
  .tpl-hoamoc .hm-obtn{font-weight:500}
  .tpl-hoamoc .hm-giftdlg .gifts{flex-direction:row;flex-wrap:wrap;align-items:flex-start;justify-content:center;padding:24px}
  .tpl-hoamoc .hm-giftdlg .gift img{width:160px;height:160px}
  .tpl-hoamoc .hm-giftdlg .gift{max-width:none}
}
/* màn hình rộng: cột 900px có viền mảnh, các khối lớn hơn như bản gốc */
@media (min-width:768px){
  .tpl-hoamoc .card{max-width:900px;border:1px solid color-mix(in srgb,var(--accent) 13%,transparent)}
  .tpl-hoamoc .hm-ocard{width:520px}
  .tpl-hoamoc .hm-osheet .f1{top:-50px;left:-20%}
  .tpl-hoamoc .hm-osheet .f2{bottom:-60px;right:-20%}
  .tpl-hoamoc .hm-obody{padding:96px 24px 32px}
  .tpl-hoamoc .hm-fl-a{top:608px;left:-228px;width:530px}
  .tpl-hoamoc .hm-fl-b{top:360px;right:-300px;width:800px}
  .tpl-hoamoc .hm-fl-c{top:1190px;left:-140px;width:990px}
  .tpl-hoamoc .hm-fl-d{top:2550px;left:-420px;width:720px}
  .tpl-hoamoc .hm-fl-e{top:2020px;right:-520px;width:1005px}
  .tpl-hoamoc .hm-fl-f{top:1320px;right:-190px;width:390px}
  .tpl-hoamoc .hm-fl-g{top:2720px;left:-390px;width:1425px}
  .tpl-hoamoc .hm-fl-h{top:3880px;width:400px}
  .tpl-hoamoc .hm-fl-i{top:3150px;right:-190px;width:390px}
  .tpl-hoamoc .hm-fl-j{width:780px}
  .tpl-hoamoc .hm-cover{min-height:900px;padding:330px 32px 32px}
  .tpl-hoamoc .hm-fl-top{top:-390px;left:130px;width:760px}
  .tpl-hoamoc .hm-fl-top2{top:18px;left:-66px;width:507px}
  .tpl-hoamoc .hm-pair{width:500px;height:640px}
  .tpl-hoamoc .hm-bar{top:280px;height:150px}
  .tpl-hoamoc .hm-p{gap:16px}
  .tpl-hoamoc .hm-p1{left:25px;top:-60px}
  .tpl-hoamoc .hm-p2{left:115px;top:260px}
  .tpl-hoamoc .hm-ph{width:235px}
  .tpl-hoamoc .hm-who span{font-size:14px}
  .tpl-hoamoc .hm-who p{font-size:32px}
  .tpl-hoamoc .hm-h-first{margin:148px 0 32px}
  .tpl-hoamoc .hm-fams{gap:12px;margin-bottom:32px}
  .tpl-hoamoc .hm-fam .n{font-size:23px}
  .tpl-hoamoc .hm-fam .a{width:80%}
  .tpl-hoamoc .hm-lead{font-size:20px}
  .tpl-hoamoc .hm-invite>.hm-lead{max-width:560px;margin-bottom:32px}
  .tpl-hoamoc .hm-couple{gap:16px}
  .tpl-hoamoc .hm-couple h3{font-size:64px;line-height:80px}
  .tpl-hoamoc .hm-amp{font-size:42px}
  .tpl-hoamoc .hm-when{gap:20px}
  .tpl-hoamoc .hm-invite .hm-when{margin-top:32px}
  .tpl-hoamoc .hm-at .hm-lead+.hm-lead{font-size:18px}
  .tpl-hoamoc .hm-time{font-size:30px}
  .tpl-hoamoc .hm-date span{font-size:16px}
  .tpl-hoamoc .hm-date b{font-size:40px}
  .tpl-hoamoc .hm-date i{font-size:28px}
  .tpl-hoamoc .hm-date i.bar{height:32px}
  .tpl-hoamoc .hm-year{font-size:24px}
  .tpl-hoamoc .hm-lunar{font-size:14px;line-height:20px}
  .tpl-hoamoc .hm-album{padding:56px 40px 48px}
  .tpl-hoamoc .hm-cf{max-width:560px}
  .tpl-hoamoc .hm-cf-stage{height:520px}
  .tpl-hoamoc .hm-cf-nav{position:absolute;top:50%;z-index:200;display:flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border:0;border-radius:50%;background:color-mix(in srgb,var(--line) 60%,transparent);color:var(--ink);transform:translateY(-50%)}
  .tpl-hoamoc .hm-cf-nav.prev{left:0}
  .tpl-hoamoc .hm-cf-nav.next{right:0}
  .tpl-hoamoc .hm-party>.hm-h{margin:48px 0 32px}
  .tpl-hoamoc .hm-marks .t{font-size:20px}
  .tpl-hoamoc .hm-calwrap{width:352px}
  .tpl-hoamoc .hm-calh{font-size:14px;line-height:21px}
  .tpl-hoamoc .hm-calwrap .cal-grid{font-size:13px}
  .tpl-hoamoc .hm-calwrap .cal-grid span{height:34px}
  .tpl-hoamoc .hm-calwrap .cal-grid .cal-w{font-size:11px;line-height:16.5px}
  .tpl-hoamoc .hm-calwrap .cal-on::before{width:30px;height:28px}
  .tpl-hoamoc .hm-calwrap .cal-on b{font-size:12px}
  .tpl-hoamoc .hm-rsvpbtn{margin:40px 0}
  .tpl-hoamoc .hm-venue{padding-top:48px}
  .tpl-hoamoc .hm-venue-in{gap:32px;padding:0 40px 64px}
  .tpl-hoamoc .hm-h-sm{font-size:26px}
  .tpl-hoamoc .hm-addr{max-width:500px;font-size:16px;line-height:24px}
  .tpl-hoamoc .hm-mapcol{gap:20px}
  .tpl-hoamoc .hm-map{max-width:560px;height:380px}
  .tpl-hoamoc .hm-dir{font-size:16px;line-height:24px}
  .tpl-hoamoc .hm-sched{gap:32px;margin:48px 0;padding:0 16px}
  .tpl-hoamoc .hm-tl{--gy:40px;column-gap:32px}
  .tpl-hoamoc .hm-tl .t{font-size:17px}
  .tpl-hoamoc .hm-tl .l{font-size:19px}
  .tpl-hoamoc .hm-gb{padding:48px 40px 40px}
  .tpl-hoamoc .hm-wform,.tpl-hoamoc .wish-list{max-width:600px}
  .tpl-hoamoc .hm-giftbox{padding:48px 0 56px}
  .tpl-hoamoc .hm-thanks{padding:0 40px 56px}
  .tpl-hoamoc .hm-thanks p{max-width:560px;font-size:18px;line-height:28px}
}
@media (min-width:1024px){
  .tpl-hoamoc .hm-ocard{width:600px}
  .tpl-hoamoc .hm-fl-a{top:700px;left:-278px;width:650px}
  .tpl-hoamoc .hm-fl-b{top:410px;right:-360px;width:960px}
  .tpl-hoamoc .hm-fl-c{top:1300px;left:-170px;width:1185px}
  .tpl-hoamoc .hm-fl-d{top:2750px;left:-500px;width:860px}
  .tpl-hoamoc .hm-fl-e{top:2180px;right:-550px;width:1215px}
  .tpl-hoamoc .hm-fl-f{top:1460px;right:-230px;width:460px}
  .tpl-hoamoc .hm-fl-g{top:2900px;left:-470px;width:1725px}
  .tpl-hoamoc .hm-fl-h{top:4080px;width:480px}
  .tpl-hoamoc .hm-fl-i{top:3340px;right:-230px;width:460px}
  .tpl-hoamoc .hm-fl-top{top:-470px;left:170px;width:900px}
  .tpl-hoamoc .hm-fl-top2{top:24px;left:-44px;width:608px}
}
`,
};
