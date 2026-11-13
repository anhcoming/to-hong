// Mẫu "Song Hỷ" — thiệp truyền thống chữ Hỷ: vòm đỏ trên đầu trang, ảnh cưới khung cổng tròn, dải tiêu đề đỏ, album xoay 3D.
// Kích thước lấy theo bản gốc (Tailwind): số đầu cho điện thoại, khối @media (min-width:640/768/1024px) cho màn rộng.
// Bản xanh dùng cùng ảnh trang trí với bản đỏ, chỉ đổi màu bằng filter (hue-rotate) như bản gốc; hộp quà có ảnh riêng.
const { esc } = require('../lib/util');
const { inviteWord } = require('../lib/carddata');

const A = (n) => `/demo/songhy-${n}`; // ảnh trang trí của bản gốc
const hyMark = (cls) => `<img class="${cls}" src="${A('chu-hy.png')}" alt="">`;

const base = {
  '--font-title': "'Playfair Display',Baskerville,'Times New Roman',serif",
  '--font-script': "'EB Garamond',Garamond,serif",
  '--font-body': "Baskerville,'Libre Baskerville','Times New Roman',serif", // Baskerville có sẵn trên máy Apple như bản gốc
  '--page': '#fff7eb', '--bg': '#fff7eb', '--paper': '#fff7eb', '--muted': '#666666', '--sh-gray': '#464646',
};

// hộp quà mừng: hộp chính + 7 món nhỏ bay quanh (vị trí, cỡ, góc theo bản gốc)
const MINI = [[-20, 10, 34, -22, 1], [168, 2, 38, 20, 1], [-16, 120, 26, -18, 1], [182, 114, 24, 14, 1], [-8, 172, 44, 8, 3], [26, 182, 26, -10, 3], [118, 176, 40, -14, 3]];
// chữ 囍 bay lên trên màn mở thiệp: vị trí %, cỡ px, màu (1-4), thời gian, trễ, độ lắc
const RISE = [[93.4, 12.4, 1, 20.8, -18, -1], [44.3, 10.7, 1, 21.2, -21.1, 8], [35.9, 23.2, 2, 25.7, -9.1, 20], [54.3, 13.5, 3, 21.3, -18.5, 27], [55, 21.7, 3, 23.3, -12.7, 7], [58.3, 15.4, 1, 22.7, -5.2, -14], [16.3, 22.3, 3, 19, -9.4, 10], [55.8, 18.2, 1, 24.2, -7.4, -30], [89.2, 13, 4, 23.7, -0.4, -5], [24.5, 14.1, 3, 18.7, -7.5, 5], [10.5, 16.3, 4, 18.2, -2.2, 26], [55.1, 21.9, 3, 20.6, -19.7, -12]];

const evList = (d) => d.events.filter((e) => e.name || e.place);
// sự kiện chính của tiệc (khung "Thông tin tiệc cưới", bản đồ)
function partyEvent(d) {
  const evs = evList(d);
  return evs.find((e) => /khai tiệc|tiệc cưới/i.test(e.name)) || evs.find((e) => /tiệc/i.test(e.name)) || evs[evs.length - 1] || null;
}
// lễ cưới ở khung "Thông tin lễ cưới": sự kiện đầu tiên không phải tiệc
const ceremony = (d) => { const p = partyEvent(d); return evList(d).find((e) => e !== p) || p; };
const tuc = (s) => `(${s.replace(/^Nhằm /i, 'Tức ')})`;

// thứ | ngày | tháng, rồi năm bên dưới (giống nhau ở lễ cưới và tiệc cưới)
const dateRow = (wd, p) => `<div class="sh-date"><span class="w">${esc(wd)}</span><i></i><b>${p.d}</b><i></i><span class="m">Tháng ${p.m}</span></div><p class="sh-year">${p.y}</p>`;
const band = (text, tag = 'h2') => `<div class="sh-band"><${tag} class="sh-h">${esc(text)}</${tag}></div>`;

module.exports = {
  id: 'songhy',
  name: 'Song Hỷ',
  group: 'truyenthong',
  badge: 'Hot', // nhãn trên thẻ ở bộ sưu tập trang chủ
  desc: 'Truyền thống chữ Hỷ: vòm đỏ, ảnh cưới khung cổng tròn, dải tiêu đề đỏ và album xoay 3D',
  fonts: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=Lora:wght@300;400;500;600&family=Cormorant+Garamond:wght@400;500&family=EB+Garamond:wght@400;500&family=Libre+Baskerville:wght@400;700&family=Roboto:wght@300;400;500&display=swap',
  palettes: [
    { id: 'do', name: 'Đỏ', swatch: ['#fff7eb', '#800000'], vars: { ...base, '--ink': '#800000', '--accent': '#800000', '--accent-ink': '#ffeed2', '--gold': '#fbbf24', '--line': '#e6d5c3',
      '--sh-op': 'linear-gradient(to bottom right,#5a0000,#400000,#2a0000)', '--sh-seal2': 'rgb(225,208,180)', '--sh-p1': '#FF6B6B', '--sh-p2': '#FFE066', '--sh-p3': '#FFC107', '--sh-p4': '#FFD700',
      '--sh-gift': 'rgb(236,223,214)', '--sh-c2': 'rgb(251,191,36)', '--sh-burst-f': 'none', '--sh-hy-f': 'none', '--sh-tshadow': 'none', '--sh-svg-f': 'none' } },
    { id: 'xanh', name: 'Xanh', swatch: ['#fff7eb', '#1f3a25'], vars: { ...base, '--ink': '#1f3a25', '--accent': '#1f3a25', '--accent-ink': '#e8f0e4', '--gold': '#fbbf24', '--line': '#d9dccb',
      '--sh-op': 'linear-gradient(to bottom right,#0a1f0e,#122418,#1F3A25)', '--sh-seal2': 'rgb(202,210,198)', '--sh-p1': '#a8e6a3', '--sh-p2': '#a8e6a3', '--sh-p3': '#a8e6a3', '--sh-p4': '#a8e6a3',
      '--sh-gift': 'rgb(220,235,222)', '--sh-c2': 'rgb(124,184,130)', '--sh-burst-f': 'hue-rotate(100deg) saturate(.6) brightness(.7)', '--sh-hy-f': 'hue-rotate(100deg) saturate(.7)',
      '--sh-tshadow': '0 1px 4px #1f3a25', '--sh-svg-f': 'drop-shadow(0 1px 2px rgba(0,0,0,.15))' } },
  ],
  // dữ liệu xem thử theo bản đỏ: lễ thành hôn tại tư gia 01/06, tiệc 14/06 ở Sun Palace, lịch trình 5 mốc
  // (tên cô dâu chú rể và bố mẹ giữ theo sample() vì test/smoke.js kiểm tra tên này ở mọi mẫu)
  demo: {
    date: '2026-06-14',
    time: '18:30',
    cover: '/demo/songhy-1.jpg',
    photos: [2, 3, 4, 5, 6, 7, 8].map((n) => `/demo/songhy-${n}.jpg`),
    story: '',
    message: 'Gia đình xin chân thành cảm ơn quý khách đã đến chung vui.',
    events: [
      { name: 'Lễ Thành Hôn', date: '2026-06-01', time: '09:00', place: 'Tư gia', address: '', mapUrl: '' },
      { name: 'Đón khách', date: '2026-06-14', time: '17:30', place: '', address: '', mapUrl: '' },
      { name: 'Khai tiệc', date: '2026-06-14', time: '18:30', place: 'Sun Palace', address: '170 Kinh Dương Vương, Phường 13, Quận 6, Hồ Chí Minh', mapUrl: '' },
      { name: 'Rót rượu, cắt bánh', date: '2026-06-14', time: '18:45', place: '', address: '', mapUrl: '' },
      { name: 'Phục vụ món chính', date: '2026-06-14', time: '19:00', place: '', address: '', mapUrl: '' },
      { name: 'Kết thúc tiệc', date: '2026-06-14', time: '21:00', place: '', address: '', mapUrl: '' },
    ],
    gifts: { groom: { bin: '970436', acc: '0000000000', holder: 'THIEP CUOI DEMO' }, bride: { bin: '970418', acc: '8084856145', holder: 'PHAM QUYNH ANH' } },
  },
  // xác nhận tham dự mở trong hộp thoại từ khung tiệc cưới (như bản gốc), nên không có trong luồng trang
  layout: ['invite', 'gallery', 'calendar', 'events', 'story', 'wishes', 'gift', 'thanks'],

  title(text, sub) {
    return `<h2 class="sh-h">${esc(text)}</h2>${sub ? `<p class="sec-sub">${esc(sub)}</p>` : ''}`;
  },

  opener(ctx) {
    const p = ctx.dparts;
    return `
<div class="opener sh-opener" id="opener">
  <div class="sh-rise" aria-hidden="true">${RISE.map(([l, s, c, t, dl, sw]) => `<i style="left:${l}%;font-size:${s}px;color:var(--sh-p${c});--sway:${sw}px;animation-duration:${t}s;animation-delay:${dl}s">囍</i>`).join('')}</div>
  <div class="sh-ocard">
    <span class="sh-seal" aria-hidden="true"><i></i></span>
    <div class="sh-obg">${hyMark('tl')}${hyMark('br')}</div>
    <div class="sh-obody">
      <h1 class="sh-onames"><span>${esc(ctx.g)}</span><i>&amp;</i><span>${esc(ctx.b)}</span></h1>
      <p class="sh-rule" aria-hidden="true"><span></span><b>❦</b><span></span></p>
      ${p ? `<p class="sh-odate">${+p.d} tháng ${+p.m}, ${p.y}</p>` : ''}
      <p class="sh-oto">${ctx.guest ? `${esc(inviteWord(ctx.d, 'Thân mời'))} ${esc(ctx.guest.name)}` : esc(inviteWord(ctx.d, 'Thân Mời'))}</p>
      <button class="sh-obtn" id="openBtn">Mở thiệp<i></i></button>
    </div>
  </div>
</div>`;
  },

  cover(ctx) {
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    const star = (x) => `<image href="${A('star.png')}" x="${x}" y="27" width="12" height="12" opacity=".9"/>`;
    return `
<header class="sh-cover">
  <div class="sh-burst" aria-hidden="true"><img src="${A('sunburst.svg')}" alt=""></div>
  <p class="sh-welcome">Welcome to our wedding</p>
  <div class="sh-hnames">
    <div><p class="k">Chú rể</p><p class="n">${esc(ctx.g)}</p></div>
    <div class="hy">${hyMark('sh-hy')}</div>
    <div><p class="k">Cô dâu</p><p class="n">${esc(ctx.b)}</p></div>
  </div>
  <div class="sh-arch">
    <div class="sh-arch-in">
      ${photo ? `<div class="sh-arch-photo"><img src="${esc(photo)}" alt="Ảnh cưới"></div>` : '<div class="sh-arch-photo"></div>'}
      <div class="sh-arch-text" aria-label="LOVE NEVER FAILS"><svg viewBox="0 0 286 143" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><defs><path id="shArc" d="M -5.32 143 A 148.32 148.32 0 0 1 291.32 143" fill="none"/></defs><text fill="var(--accent-ink)" font-size="14" font-family="'Cormorant Garamond','Times New Roman',serif" letter-spacing="0.22em" dominant-baseline="central"><textPath href="#shArc" startOffset="50%" text-anchor="middle">LOVE NEVER FAILS</textPath></text>${star(37.5)}${star(236.5)}</svg></div>
    </div>
  </div>
</header>`;
  },

  sections: {
    // dải "Thông tin lễ cưới": bố mẹ hai bên, tên đầy đủ, nơi & ngày giờ làm lễ (ngày của chính sự kiện lễ, có thể khác ngày tiệc)
    invite(ctx, opts, h) {
      const { d } = ctx;
      const strip = (s) => esc(s.replace(/^(Ông|Bà)\s+/i, ''));
      const fam = (x) => `<div class="sh-fam"><span class="k">Ông Bà</span><span class="n">${x.father ? strip(x.father) : ''}</span><span class="n">${x.mother ? strip(x.mother) : ''}</span><span class="a">${esc(x.address)}</span></div>`;
      const hasFam = d.groom.father || d.groom.mother || d.bride.father || d.bride.mother;
      const cer = ceremony(d);
      const date = (cer && cer.date) || ctx.date;
      const p = h.parts(date);
      const time = cer && cer.time ? cer.time : d.time;
      return `
  <section class="sec sh-invite">
    ${band('Thông tin lễ cưới')}
    ${hasFam ? `<div class="sh-fams">${fam(d.groom)}<i></i>${fam(d.bride)}</div>` : ''}
    <p class="sh-lead">Trân trọng báo tin<br>lễ thành hôn của con chúng tôi</p>
    <div class="sh-couple">
      <h3>${esc(d.groom.fullName || d.groom.name)}</h3>
      <p class="sh-role">Chú rể</p>
      <p class="sh-amp">&amp;</p>
      <h3>${esc(d.bride.fullName || d.bride.name)}</h3>
      <p class="sh-role">Cô dâu</p>
    </div>
    ${p ? `<div class="sh-when-block">
      ${cer && cer.place ? `<p class="sh-where">${esc(cer.name || 'Lễ thành hôn')} được cử hành tại<br>${esc(cer.place)}</p>` : ''}
      ${time ? `<p class="sh-at">Vào lúc ${esc(time)}</p>` : ''}
      ${dateRow(h.weekday(date), p)}
      <p class="sh-lunar up">${esc(tuc(h.lunarText(date)))}</p>
    </div>` : ''}
  </section>`;
    },

    // album xoay 3D: ảnh giữa thẳng, hai bên xoay dần ra sau; tự chuyển ảnh, vuốt / chấm / mũi tên để chuyển
    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      return `
  <section class="sec sh-album">
    ${band('Album ảnh')}
    <div class="sh-cf">
      <div class="sh-cf-stage">
        <button class="sh-cf-nav prev" type="button" aria-label="Ảnh trước"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg></button>
        <button class="sh-cf-nav next" type="button" aria-label="Ảnh sau"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg></button>
        <div class="sh-cf-3d">
          ${ph.map((u, i) => `<button class="ph" data-i="${i}" aria-label="Xem ảnh ${i + 1}"><img loading="lazy" src="${esc(u)}" alt=""></button>`).join('')}
        </div>
      </div>
      <div class="sh-dots">${ph.map((_, i) => `<button type="button" aria-label="Ảnh ${i + 1}"></button>`).join('')}</div>
    </div>
    <script>(function(){
      var s=document.currentScript.parentNode,st=s.querySelector('.sh-cf-stage'),cs=[].slice.call(st.querySelectorAll('.ph')),ds=[].slice.call(s.querySelectorAll('.sh-dots button')),k=0,n=cs.length,tm;
      // khung ảnh theo tỉ lệ ảnh thật như bản gốc
      cs.forEach(function(c){var im=c.querySelector('img');function r(){if(im.naturalWidth)c.style.aspectRatio=im.naturalWidth+'/'+im.naturalHeight}im.complete?r():im.addEventListener('load',r)});
      function go(i){k=(i+n)%n;cs.forEach(function(c,j){var o=j-k;if(o>n/2)o-=n;if(o<-n/2)o+=n;c.dataset.o=Math.abs(o)>3?'far':o;});ds.forEach(function(d,j){d.className=j===k?'on':'';});clearInterval(tm);tm=setInterval(function(){go(k+1)},3500);}
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

    // dải "Thông tin tiệc cưới": giờ, thứ | ngày | tháng, năm, âm lịch, giờ khai tiệc, lịch tháng; nút mở hộp thoại xác nhận
    calendar(ctx, opts, h) {
      const { d, dparts: p } = ctx;
      if (!p) return '';
      const party = partyEvent(d) || {};
      const time = party.time || d.time;
      const grid = d.show.calendar ? h.calGrid(ctx, `<p class="sh-calh">Tháng ${+p.m} / ${p.y}</p>`) : '';
      const cal = h.calendarLink(`Đám cưới ${ctx.g} & ${ctx.b}`, ctx.date, time, [party.place, party.address].filter(Boolean).join(', '));
      const rsvp = d.show.rsvp ? h.rsvp(ctx).replace('sec s-rsvp reveal', 's-rsvp') : '';
      return `
  <section class="sec sh-party">
    ${band('Thông tin tiệc cưới')}
    <div class="sh-party-in">
      <h3 class="sh-lead">Tiệc cưới sẽ diễn ra vào lúc:</h3>
      ${time ? `<p class="sh-time">${esc(time)}</p>` : ''}
      ${dateRow(ctx.weekday, p)}
      <p class="sh-lunar">${esc(tuc(ctx.lunar))}</p>
      ${party.name && party.time ? `<div class="sh-marks"><div><span class="k">${esc(party.name)}</span><span class="t">${esc(party.time)}</span></div></div>` : ''}
      ${grid ? `<div class="sh-calwrap">${grid}</div>` : ''}
      <a class="sh-link" target="_blank" rel="noopener" href="${esc(cal)}">Thêm vào lịch</a>
    </div>
    ${rsvp ? `<div class="sh-rsvp-btn"><button class="sh-pill" type="button" onclick="document.getElementById('shRsvp').showModal()">Xác nhận tham dự</button></div>` : ''}
  </section>
  ${rsvp ? `<dialog class="sh-dlg sh-rsvp" id="shRsvp"><button class="sh-x" type="button" aria-label="Đóng" onclick="this.closest('dialog').close()">×</button>${rsvp}</dialog>` : ''}`;
    },

    // nơi tổ chức tiệc (bản đồ) + lịch trình các mốc trong ngày tiệc
    events(ctx, opts, h) {
      const all = evList(ctx.d);
      if (!all.length) return '';
      const party = partyEvent(ctx.d);
      const cer = ceremony(ctx.d);
      // lễ cưới đã có khung riêng; nếu khác ngày tiệc thì không lặp lại trong lịch trình
      const evs = all.filter((e) => !(e === cer && e !== party && e.date && e.date !== ctx.date));
      const where = party ? [party.place, party.address].filter(Boolean).join(', ') : '';
      const dir = party && (party.mapUrl || (where ? 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(where) : ''));
      return `
  ${where ? `
  <section class="sec sh-venue">
    ${band('Tiệc cưới sẽ tổ chức tại', 'h3')}
    <p class="sh-addr">${esc(where)}</p>
    <div class="sh-venue-in">
      ${party.address ? `<div class="sh-map"><iframe loading="lazy" title="Bản đồ" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(where)}&amp;output=embed"></iframe></div>` : ''}
      ${dir ? `<a class="sh-dir" target="_blank" rel="noopener" href="${esc(dir)}"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><polygon fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="3 11 22 2 13 21 11 13 3 11"/></svg><span>Chỉ đường</span></a>` : ''}
    </div>
  </section>` : ''}
  ${evs.length ? `
  <section class="sec sh-sched">
    <h2 class="sh-h">Lịch trình ngày cưới</h2>
    <ol class="sh-tl">
      ${evs.map((e) => {
        const p = h.parts(e.date);
        const other = p && e.date !== ctx.date;
        return `<li><span class="t">${esc(e.time) || '—'}</span><span class="dot"></span><span class="l">${esc(e.name)}${other ? ` <small>${p.d}/${p.m}</small>` : ''}</span></li>`;
      }).join('')}
    </ol>
  </section>` : ''}`;
    },

    // sổ lưu bút: khung trắng có ô tên, lời chúc; danh sách lời chúc dạng thẻ trắng (giữ id/tên trường cho card.js)
    wishes(ctx, opts) {
      if (!ctx.d.show.wishes) return '';
      const list = opts.wishes || [];
      return `
  <div class="sh-guestbook">
    ${band('Sổ lưu bút')}
    <section class="sec s-wishes">
      <form class="sh-wform" id="wishForm">
        <div class="box">
          <input name="name" required maxlength="60" placeholder="Nhập tên của bạn*" value="${ctx.guest ? esc(ctx.guest.name) : ''}" aria-label="Tên">
          <textarea name="message" required maxlength="500" rows="4" placeholder="Nhập lời chúc của bạn*" aria-label="Lời chúc"></textarea>
          <div class="sh-wrow"><p class="form-msg" role="status"></p><button type="submit">Gửi lời chúc</button></div>
        </div>
      </form>
      <div class="wish-list" id="wishList">
        ${list.map((w) => `<div class="wish"><b>${esc(w.name)}</b><p>${esc(w.message)}</p></div>`).join('')}
      </div>
    </section>
  </div>`;
    },

    // hộp quà mừng nảy nhẹ, lấp lánh; di chuột / chạm vào thì bung pháo giấy; mở hộp thoại có mã QR hai bên
    gift(ctx, opts, h) {
      if (!ctx.d.show.gift) return '';
      const html = h.giftCard(ctx, ctx.d.gifts.groom, 'groom') + h.giftCard(ctx, ctx.d.gifts.bride, 'bride');
      if (!html) return '';
      const tone = ctx.pal.id === 'xanh' ? 'green' : 'red';
      const box = `<img class="box" src="${A(`giftbox-${tone}.webp`)}" alt="">`;
      const minis = MINI.map(([x, y, w, r, z], i) => `<img class="mini m${i + 1}" src="${A(`mini-${tone}-${i + 1}.webp`)}" alt="" style="left:${x}px;top:${y}px;width:${w}px;z-index:${z};transform:rotate(${r}deg)">`).join('');
      return `
  <section class="sec sh-giftbox">
    <h2 class="sh-h">Hộp quà mừng</h2>
    <button class="sh-gbtn" type="button" aria-label="Mở hộp mừng cưới" onclick="document.getElementById('shGift').showModal()">
      <span class="sh-gin">
        <i class="sp s1">✦</i><i class="sp s2">✦</i><i class="sp s3">✦</i><i class="sp s4">✦</i>
        <span class="cf">${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<i class="c${n}"></i>`).join('')}</span>
        <span class="bob"><span class="shadow"></span>${minis}${box}</span>
      </span>
      <span class="hint">Nhấn để mở</span>
    </button>
  </section>
  <dialog class="sh-dlg sh-giftdlg" id="shGift">
    <div class="sh-dlg-head"><h2>Hộp quà mừng</h2><button class="sh-x" type="button" aria-label="Đóng" onclick="this.closest('dialog').close()">×</button></div>
    <div class="gifts">${html}</div>
  </dialog>`;
    },

    // lời cảm ơn cuối trang = lời nhắn của cô dâu chú rể
    thanks(ctx) {
      return `
  <section class="sec sh-thanks">
    <p>${esc(ctx.d.message || 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!')}</p>
  </section>`;
    },
  },

  css: `
.tpl-songhy{background:#fff}
.tpl-songhy .card{max-width:480px;background:var(--page);color:var(--ink);font-family:var(--font-body);font-weight:300;line-height:1.5;box-shadow:none;isolation:isolate;overflow-x:clip}
.tpl-songhy .sec{padding:0}
.tpl-songhy .sh-h{margin:0;font-family:'Times New Roman',Times,serif;font-weight:700;font-size:20px;line-height:30px;letter-spacing:.025em;text-transform:uppercase;text-align:center;color:var(--accent)}
.tpl-songhy .sh-band{padding:12px 0;background:var(--accent)}
.tpl-songhy .sh-band .sh-h{padding:0 8px;color:var(--accent-ink)}
.tpl-songhy .sec-sub{margin:4px 0 0;color:var(--muted);font-size:14px}

/* ---- màn mở thiệp ---- */
.tpl-songhy .sh-opener{background:var(--sh-op);overflow:hidden}
.tpl-songhy .sh-rise{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none}
.tpl-songhy .sh-rise i{position:absolute;bottom:-30px;font-style:normal;animation:shRise 20s ease-in-out infinite}
@keyframes shRise{0%{transform:translateY(6vh) translateX(0) rotate(0);opacity:0}12%{opacity:.45}55%{transform:translateY(-42vh) translateX(var(--sway,20px)) rotate(8deg);opacity:.55}92%{opacity:.35}100%{transform:translateY(-92vh) translateX(0) rotate(0);opacity:0}}
.tpl-songhy .sh-ocard{position:relative;z-index:10;width:310px;max-width:calc(100vw - 32px);text-align:center;border-radius:8px;box-shadow:0 25px 60px -12px rgba(0,0,0,.45),0 8px 24px rgba(0,0,0,.2),0 0 40px color-mix(in srgb,var(--accent-ink) 15%,transparent)}
.tpl-songhy .sh-obg{position:absolute;inset:0;overflow:hidden;border-radius:8px;background:var(--accent);border:1px solid color-mix(in srgb,var(--accent-ink) 15%,transparent);clip-path:inset(0 round 8px)}
.tpl-songhy .sh-obg>*{position:absolute;width:220px;height:auto;opacity:.15;rotate:30deg;pointer-events:none}
.tpl-songhy .sh-obg .tl{top:-65px;left:-124px}
.tpl-songhy .sh-obg .br{bottom:-39px;right:-156px}
.tpl-songhy .sh-seal{position:absolute;left:50%;top:50px;z-index:30;display:flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle at 30% 30%,var(--accent-ink),var(--sh-seal2));box-shadow:0 4px 20px color-mix(in srgb,var(--accent-ink) 50%,transparent),inset 0 2px 4px rgba(255,255,255,.3);animation:shSeal 2s ease-in-out infinite}
.tpl-songhy .sh-seal i{width:32px;height:32px;background:var(--accent);opacity:.9;-webkit-mask:url('${A('happiness.webp')}') center/contain no-repeat;mask:url('${A('happiness.webp')}') center/contain no-repeat}
@keyframes shSeal{0%,100%{transform:translate(-50%,-50%) scale(1);box-shadow:0 4px 20px color-mix(in srgb,var(--accent-ink) 50%,transparent)}50%{transform:translate(-50%,-50%) scale(1.06);box-shadow:0 6px 35px color-mix(in srgb,var(--accent-ink) 50%,transparent)}}
.tpl-songhy .sh-obody{position:relative;z-index:10;padding:112px 24px 56px}
.tpl-songhy .sh-onames{display:flex;flex-direction:column;align-items:center;margin:0 0 8px;font-family:var(--font-title);font-weight:400;font-size:30px;line-height:1.25;color:var(--accent-ink)}
.tpl-songhy .sh-onames span{display:block;width:100%}
.tpl-songhy .sh-onames i{display:block;font-family:Baskerville,'Times New Roman',serif;font-style:normal;font-size:18px;line-height:1}
.tpl-songhy .sh-rule{display:flex;align-items:center;justify-content:center;gap:12px;margin:0 0 8px}
.tpl-songhy .sh-rule span{width:40px;height:1px;background:linear-gradient(to right,transparent,var(--accent-ink))}
.tpl-songhy .sh-rule span:last-child{background:linear-gradient(to left,transparent,var(--accent-ink))}
.tpl-songhy .sh-rule b{font-weight:400;font-size:14px;line-height:20px;color:var(--accent-ink);opacity:.7}
.tpl-songhy .sh-odate{margin:0 0 20px;font-family:'Lora','Times New Roman',serif;font-size:18px;line-height:27px;color:color-mix(in srgb,var(--accent-ink) 85%,transparent)}
.tpl-songhy .sh-oto{margin:0 0 24px;font-family:'Lora','Times New Roman',serif;font-weight:300;font-size:18px;line-height:27px;color:color-mix(in srgb,var(--accent-ink) 85%,transparent)}
.tpl-songhy .sh-obtn{position:relative;display:flex;align-items:center;justify-content:center;width:fit-content;margin:0 auto;padding:10px 32px;overflow:hidden;border:0;border-radius:999px;background:var(--accent-ink);color:var(--accent);font-family:'Lora','Times New Roman',serif;font-size:18px;line-height:28px;font-weight:600;box-shadow:0 4px 14px color-mix(in srgb,var(--accent-ink) 35%,transparent);cursor:pointer}
.tpl-songhy .sh-obtn i{position:absolute;top:0;left:-100%;width:32px;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);animation:shShine 3s ease-in-out infinite;pointer-events:none}
@keyframes shShine{0%{left:-100%}50%,100%{left:100%}}

/* ---- trang bìa: vòm đỏ, tên hai bên chữ Hỷ, ảnh khung cổng tròn ---- */
.tpl-songhy .sh-cover{position:relative;overflow:hidden;padding-bottom:100px;background:var(--page)}
.tpl-songhy .sh-burst{position:absolute;left:50%;top:0;width:min(671px,130vw);aspect-ratio:1;transform:translate(-50%,-50%);pointer-events:none}
.tpl-songhy .sh-burst>*{display:block;width:100%;height:100%;filter:var(--sh-burst-f)}
.tpl-songhy .sh-welcome{position:relative;z-index:10;margin:0;padding:40px 16px 0;text-align:center;font-family:'Cormorant Garamond','Times New Roman',serif;font-size:11px;line-height:16.5px;letter-spacing:.35em;text-transform:uppercase;color:var(--accent-ink);text-shadow:var(--sh-tshadow)}
.tpl-songhy .sh-hnames{position:relative;z-index:10;display:flex;align-items:center;justify-content:center;gap:16px;width:100%;max-width:872px;margin:12px auto 0;padding:0 16px}
.tpl-songhy .sh-hnames>div:not(.hy){flex:1;min-width:0;text-align:center}
.tpl-songhy .sh-hnames p{margin:0;color:var(--accent-ink);text-shadow:var(--sh-tshadow)}
.tpl-songhy .sh-hnames .k{margin-bottom:4px;font-family:'Avenir Next',system-ui,sans-serif;font-size:11px;line-height:16.5px;text-transform:uppercase}
.tpl-songhy .sh-hnames .n{font-family:'Big Caslon',Baskerville,'Times New Roman',serif;font-size:16px;line-height:24px;white-space:nowrap;text-transform:uppercase}
.tpl-songhy .sh-hnames .hy{display:flex;flex-shrink:0;align-items:center;justify-content:center;width:64px}
.tpl-songhy .sh-hy{width:64px;height:64px;object-fit:contain;filter:var(--sh-hy-f)}
.tpl-songhy .sh-arch{position:relative;z-index:10;display:flex;justify-content:center;margin-top:8px;padding:0 24px}
.tpl-songhy .sh-arch-in{position:relative;width:100%;max-width:286px;transform:translateY(50px)}
.tpl-songhy .sh-arch-photo{position:relative;aspect-ratio:286/481;overflow:hidden;border-radius:9999px 9999px 0 0;background:#d9d9d9}
.tpl-songhy .sh-arch-photo img{width:100%;height:100%;object-fit:cover}
.tpl-songhy .sh-arch-text{position:absolute;left:0;right:0;top:0;z-index:10;aspect-ratio:2/1;transform:translateY(-20px);pointer-events:none}
.tpl-songhy .sh-arch-text svg{display:block;width:100%;height:100%;overflow:visible;filter:var(--sh-svg-f)}

/* ---- thông tin lễ cưới ---- */
.tpl-songhy .sh-fams{display:grid;grid-template-columns:1fr auto 1fr;justify-content:center;column-gap:12px;margin-top:24px;padding:0 8px;font-family:var(--font-body);color:var(--accent)}
.tpl-songhy .sh-fams>i{align-self:center;width:1px;height:60px;background:var(--accent)}
.tpl-songhy .sh-fam{display:grid;grid-template-rows:repeat(4,auto);row-gap:4px;justify-items:center;justify-self:center;min-width:0;max-width:160px;text-align:center}
.tpl-songhy .sh-fam .k{font-size:14px;line-height:21px;color:var(--muted)}
.tpl-songhy .sh-fam .n{font-weight:600;font-size:14px;line-height:21px;overflow-wrap:anywhere;color:var(--accent)}
.tpl-songhy .sh-fam .a{margin-top:4px;font-size:12px;line-height:1.25;overflow-wrap:anywhere;color:var(--muted)}
.tpl-songhy .sh-lead{margin:32px auto 0;padding:0 16px;font-family:var(--font-body);font-size:16px;line-height:24px;letter-spacing:.05em;text-transform:uppercase;text-align:center;color:var(--accent)}
.tpl-songhy .sh-couple{display:flex;flex-direction:column;align-items:center;gap:12px;margin:16px 0 24px;text-align:center}
.tpl-songhy .sh-couple h3,.tpl-songhy .sh-couple p{margin:0}
.tpl-songhy .sh-couple h3{display:flex;align-items:center;justify-content:center;width:80%;font-family:'EB Garamond',Garamond,serif;font-weight:400;font-size:36px;line-height:50px;white-space:nowrap;color:var(--accent)}
.tpl-songhy .sh-role{font-family:var(--font-body);font-size:12px;line-height:16px;letter-spacing:.2em;line-height:18px;text-transform:uppercase;color:var(--muted)}
.tpl-songhy .sh-amp{font-family:'EB Garamond',Garamond,serif;font-size:30px;line-height:45px;color:var(--muted)}
.tpl-songhy .sh-when-block{display:flex;flex-direction:column;align-items:center;padding:32px 16px;font-family:var(--font-body);color:var(--muted)}
.tpl-songhy .sh-when-block p,.tpl-songhy .sh-party-in p{margin:0}
.tpl-songhy .sh-where{font-size:16px;line-height:26px;text-transform:uppercase;text-align:center;color:var(--accent)}
.tpl-songhy .sh-at{margin-top:8px!important;font-size:14px;line-height:21px;text-transform:uppercase}
.tpl-songhy .sh-date{display:flex;align-items:center;justify-content:center;margin-top:20px;color:var(--accent)}
.tpl-songhy .sh-date .w,.tpl-songhy .sh-date .m{width:70px;font-size:14px;line-height:21px;text-transform:uppercase;white-space:nowrap;color:var(--muted)}
.tpl-songhy .sh-date .w{text-align:right}
.tpl-songhy .sh-date i{align-self:center;width:1px;height:25px;margin:0 12px;background:var(--muted);opacity:.5}
.tpl-songhy .sh-date b{font-weight:300;font-size:32px;line-height:48px}
.tpl-songhy .sh-year{margin-top:8px!important;font-size:20px;line-height:30px;text-align:center;color:var(--muted)}
.tpl-songhy .sh-lunar{margin-top:8px!important;font-size:13px;line-height:19.5px;text-align:center;color:var(--muted)}
.tpl-songhy .sh-lunar.up{letter-spacing:.025em;text-transform:uppercase}

/* ---- album xoay 3D ---- */
.tpl-songhy .sh-album{position:relative}
.tpl-songhy .sh-cf{position:relative;z-index:10;width:100%;max-width:512px;margin:0 auto;padding:16px 8px}
.tpl-songhy .sh-cf-stage{position:relative;height:340px;touch-action:pan-y}
.tpl-songhy .sh-cf-3d{position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:100%;perspective:1000px}
.tpl-songhy .sh-cf .ph{position:absolute;height:92%;aspect-ratio:2/3;padding:0;border:0;border-radius:16px;overflow:hidden;background:var(--line);box-shadow:0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1);transition:all 1.1s ease-in-out;cursor:pointer;opacity:0;transform:scale(.7);z-index:96}
.tpl-songhy .sh-cf .ph img{width:100%;height:100%;object-fit:cover}
.tpl-songhy .sh-cf .ph[data-o="0"]{z-index:100;opacity:1;transform:none;box-shadow:0 0 0 2px rgba(255,255,255,.3),0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1)}
.tpl-songhy .sh-cf .ph[data-o="1"]{z-index:99;opacity:.75;transform:translateX(60%) translateZ(-150px) rotateY(45deg) scale(.85)}
.tpl-songhy .sh-cf .ph[data-o="-1"]{z-index:99;opacity:.75;transform:translateX(-60%) translateZ(-150px) rotateY(-45deg) scale(.85)}
.tpl-songhy .sh-cf .ph[data-o="2"]{z-index:98;opacity:.5;transform:translateX(120%) translateZ(-300px) rotateY(90deg) scale(.7)}
.tpl-songhy .sh-cf .ph[data-o="-2"]{z-index:98;opacity:.5;transform:translateX(-120%) translateZ(-300px) rotateY(-90deg) scale(.7)}
.tpl-songhy .sh-cf .ph[data-o="3"]{z-index:97;opacity:.3;transform:translateX(180%) translateZ(-450px) rotateY(135deg) scale(.7)}
.tpl-songhy .sh-cf .ph[data-o="-3"]{z-index:97;opacity:.3;transform:translateX(-180%) translateZ(-450px) rotateY(-135deg) scale(.7)}
.tpl-songhy .sh-cf .ph[data-o="far"]{pointer-events:none}
.tpl-songhy .sh-cf-nav{display:none}
.tpl-songhy .sh-dots{display:flex;justify-content:center;gap:6px;margin-top:12px;color:var(--ink)}
.tpl-songhy .sh-dots button{width:8px;height:8px;padding:0;border:0;border-radius:999px;background:currentColor;opacity:.25;transition:all .3s}
.tpl-songhy .sh-dots button.on{width:24px;opacity:.7}

/* ---- thông tin tiệc cưới + lịch ---- */
.tpl-songhy .sh-party-in{display:flex;flex-direction:column;align-items:center;margin-top:-1px;padding:24px 8px 32px;font-family:var(--font-body);color:var(--muted)}
.tpl-songhy .sh-party-in .sh-lead{margin:0;padding:0;font-weight:400}
.tpl-songhy .sh-time{margin-top:8px!important;font-weight:600;font-size:20px;line-height:30px;color:var(--accent)}
.tpl-songhy .sh-marks{display:flex;justify-content:center;gap:32px;margin-top:16px}
.tpl-songhy .sh-marks div{display:flex;flex-direction:column;align-items:center}
.tpl-songhy .sh-marks .k{font-size:11px;line-height:16.5px;text-transform:uppercase;color:var(--muted)}
.tpl-songhy .sh-marks .t{margin-top:4px;font-weight:600;font-size:20px;line-height:30px;color:var(--accent)}
.tpl-songhy .sh-calwrap{width:296px;max-width:100%;margin:8px auto 0;font-family:system-ui,-apple-system,sans-serif;font-weight:300}
.tpl-songhy .sh-calwrap .cal{width:100%;margin:0;overflow:hidden;border:1px solid color-mix(in srgb,var(--accent) 27%,transparent);border-radius:8px;color:var(--accent)}
.tpl-songhy .sh-calh{margin:0!important;padding:10px 0;border-bottom:1px solid color-mix(in srgb,var(--accent) 27%,transparent);font-size:13px;line-height:19.5px;font-weight:600;letter-spacing:.025em;text-align:center}
.tpl-songhy .sh-party{--cal-hi:var(--accent);--cal-on:#fff}
.tpl-songhy .sh-calwrap .cal-grid{row-gap:2px;padding:0 4px 8px;font-size:12px;color:var(--accent)}
.tpl-songhy .sh-calwrap .cal-grid span{height:30px}
.tpl-songhy .sh-calwrap .cal-grid .cal-w{height:auto;margin:0 -4px 6px;padding:6px 0;border-bottom:2px solid var(--accent);font-size:10px;line-height:15px;font-weight:500;letter-spacing:0;opacity:1;color:color-mix(in srgb,var(--accent) 60%,transparent)}
.tpl-songhy .sh-calwrap .cal-on::before{width:26px;height:24px;animation:none;filter:drop-shadow(0 1px 1px rgba(0,0,0,.05))}
.tpl-songhy .sh-calwrap .cal-on b{margin-top:0;font-size:11px}
.tpl-songhy .sh-link{margin-top:24px;font-family:system-ui,-apple-system,sans-serif;font-weight:300;font-size:14px;line-height:20px;letter-spacing:.05em;color:var(--accent);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px}
.tpl-songhy .sh-rsvp-btn{display:flex;justify-content:center;padding:8px 0 32px}
.tpl-songhy .sh-pill{padding:8px 16px;border:0;border-radius:10px;background:var(--accent);color:var(--accent-ink);font-family:var(--font-body);font-weight:600;font-size:14px;line-height:20px;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;transition:transform .15s}
.tpl-songhy .sh-pill:hover{transform:scale(1.03)}

/* ---- nơi tổ chức ---- */
.tpl-songhy .sh-venue{display:flex;flex-direction:column;align-items:center;padding-bottom:32px}
.tpl-songhy .sh-venue .sh-band{width:100%}
.tpl-songhy .sh-addr{width:92%;max-width:768px;margin:24px 0 0;padding:16px;border-radius:8px;font-family:var(--font-body);font-weight:500;font-size:14px;line-height:20px;text-align:center;overflow-wrap:break-word;color:var(--muted)}
.tpl-songhy .sh-venue-in{display:flex;flex-direction:column;align-items:center;gap:16px;width:100%}
.tpl-songhy .sh-map{width:92%;max-width:768px;height:350px;margin-top:16px;overflow:hidden;border-radius:12px;background:var(--line)}
.tpl-songhy .sh-map iframe{width:100%;height:100%;border:0}
.tpl-songhy .sh-dir{display:inline-flex;align-items:center;gap:8px;padding:8px 20px;border-radius:999px;font-family:var(--font-body);font-weight:600;font-size:14px;line-height:20px;color:var(--muted);text-decoration:none}

/* ---- lịch trình: lưới giờ | chấm | tên; vạch dọc nối từ chấm đầu tới chấm cuối ---- */
.tpl-songhy .sh-sched{display:flex;flex-direction:column;gap:24px;margin:40px 0;padding:0 16px}
.tpl-songhy .sh-tl{--gy:32px;display:grid;grid-template-columns:minmax(0,1fr) 16px minmax(0,1fr);align-items:center;column-gap:24px;row-gap:var(--gy);width:100%;max-width:460px;margin:0 auto;padding:0;list-style:none;font-family:var(--font-body)}
.tpl-songhy .sh-tl li{display:contents}
.tpl-songhy .sh-tl .t{padding-top:2px;text-align:right;font-size:16px;line-height:22px;letter-spacing:.025em;font-variant-numeric:tabular-nums;color:var(--accent)}
.tpl-songhy .sh-tl .dot{position:relative;align-self:stretch;display:flex;align-items:center;justify-content:center}
.tpl-songhy .sh-tl .dot::before{content:"";position:absolute;left:50%;width:1px;top:calc(-1 * var(--gy));bottom:calc(-1 * var(--gy));transform:translateX(-50%);background:color-mix(in srgb,var(--accent) 40%,transparent)}
.tpl-songhy .sh-tl li:first-child .dot::before{top:50%}
.tpl-songhy .sh-tl li:last-child .dot::before{bottom:50%}
.tpl-songhy .sh-tl li:only-child .dot::before{display:none}
.tpl-songhy .sh-tl .dot::after{content:"";position:relative;width:10px;height:10px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 13%,transparent)}
.tpl-songhy .sh-tl .l{padding-top:2px;text-align:left;font-weight:500;font-size:17px;line-height:23.4px;color:var(--muted)}
.tpl-songhy .sh-tl small{font-size:inherit;opacity:.8}

/* ---- sổ lưu bút ---- */
.tpl-songhy .sh-guestbook .s-wishes{display:flex;flex-direction:column;align-items:center;padding:32px 8px;color:var(--muted)}
.tpl-songhy .sh-wform{width:100%;margin:24px auto 0}
.tpl-songhy .sh-wform .box{padding:24px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;box-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1)}
.tpl-songhy .sh-wform input,.tpl-songhy .sh-wform textarea{display:block;width:100%;padding:12px 16px;border:1px solid #d1d5db;border-radius:8px;background:#fff;color:var(--muted);font:300 16px/24px Roboto,'Helvetica Neue',Arial,sans-serif;outline:none;resize:none}
.tpl-songhy .sh-wform input{margin-bottom:16px}
.tpl-songhy .sh-wform textarea{display:inline-block;vertical-align:baseline}
.tpl-songhy .sh-wform input:focus,.tpl-songhy .sh-wform textarea:focus{border-color:#f87171;box-shadow:0 0 0 2px #fecaca}
.tpl-songhy .sh-wform ::placeholder{color:color-mix(in srgb,var(--muted) 50%,transparent)}
.tpl-songhy .sh-wrow{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:16px}
.tpl-songhy .sh-wrow .form-msg{flex:1;font-size:12px;text-align:left}
.tpl-songhy .sh-wrow button{padding:8px 16px;border:0;border-radius:999px;background:var(--accent);color:#fff;font:500 14px/20px Roboto,'Helvetica Neue',Arial,sans-serif;text-transform:uppercase;transition:transform .2s;cursor:pointer}
.tpl-songhy .sh-wrow button:hover{transform:scale(1.05)}
.tpl-songhy .wish-list{width:100%;max-height:500px;margin:32px auto 0;padding-right:8px;overflow-y:auto;text-align:left}
.tpl-songhy .wish{margin:0 0 12px;padding:16px;border:1px solid #f3f4f6;border-radius:8px;background:#fff;box-shadow:0 4px 6px -1px rgba(0,0,0,.1),0 2px 4px -2px rgba(0,0,0,.1);font:300 16px/24px system-ui,-apple-system,sans-serif;color:var(--muted)}
.tpl-songhy .wish b{display:block;font:400 18px/28px 'Times New Roman',serif;color:var(--accent)}
.tpl-songhy .wish p{margin:8px 0 0;line-height:1.625}

/* ---- hộp quà mừng ---- */
.tpl-songhy .sh-giftbox{display:flex;flex-direction:column;align-items:center;padding:32px 0}
.tpl-songhy .sh-giftbox .sh-h{margin-bottom:16px;font-family:var(--font-body)}
.tpl-songhy .sh-gbtn{position:relative;width:260px;height:280px;padding:0;border:0;background:none;outline:none;cursor:pointer}
.tpl-songhy .sh-gin{position:relative;display:flex;align-items:flex-end;justify-content:center;width:100%;height:100%;padding-bottom:26px}
.tpl-songhy .sh-gin .sp{position:absolute;z-index:20;font-style:normal;color:rgb(251,191,36);pointer-events:none;animation:shSpark 2s ease-in-out infinite}
.tpl-songhy .sh-gin .s1{top:8%;left:14%;font-size:22px}
.tpl-songhy .sh-gin .s2{top:18%;right:10%;font-size:16px;animation-delay:.6s}
.tpl-songhy .sh-gin .s3{top:32%;left:5%;font-size:14px;animation-delay:1.2s}
.tpl-songhy .sh-gin .s4{top:26%;right:5%;font-size:14px;animation-delay:1.7s}
.tpl-songhy .sh-gin .bob{position:relative;display:block;width:200px;height:220px;animation:shBob 3s ease-in-out infinite}
.tpl-songhy .sh-gin .shadow{position:absolute;left:50%;bottom:-8px;z-index:0;width:144px;height:12px;margin-left:-72px;border-radius:50%;background:rgba(0,0,0,.45);filter:blur(4px);animation:shShadow 3s ease-in-out infinite}
.tpl-songhy .sh-gin .mini{position:absolute;filter:drop-shadow(0 2px 3px rgba(0,0,0,.25));pointer-events:none}
.tpl-songhy .sh-gin .box{position:absolute;left:50%;bottom:0;z-index:2;width:170px;max-height:220px;margin-left:-85px;object-fit:contain;filter:drop-shadow(0 10px 18px rgba(0,0,0,.25));transform-origin:50% 100%;transition:transform .3s ease}
.tpl-songhy .sh-gin .cf{position:absolute;left:50%;bottom:187px;z-index:0;pointer-events:none}
.tpl-songhy .sh-gin .cf i{position:absolute;left:50%;top:0;opacity:0;width:10px;height:5px;margin:-2.5px 0 0 -5px;border-radius:2px}
.tpl-songhy .sh-gin .c1{width:11px!important;height:5.5px!important;background:rgb(236,72,153)}
.tpl-songhy .sh-gin .c2{height:10px!important;margin-top:-5px!important;border-radius:50%!important;background:var(--sh-c2)}
.tpl-songhy .sh-gin .c3{width:11px!important;height:5.5px!important;background:rgb(34,197,94)}
.tpl-songhy .sh-gin .c4{width:9px!important;height:9px!important;border-radius:50%!important;background:rgb(59,130,246)}
.tpl-songhy .sh-gin .c5{width:12px!important;height:6px!important;background:rgb(168,85,247)}
.tpl-songhy .sh-gin .c6{width:0!important;height:0!important;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:10px solid rgb(250,204,21);border-radius:0!important}
.tpl-songhy .sh-gin .c7{background:var(--accent)}
.tpl-songhy .sh-gin .c8{width:9px!important;height:9px!important;border-radius:50%!important;background:rgb(249,115,22)}
/* di chuột / chạm vào hộp: hộp nảy lên, món nhỏ bay lên, pháo giấy bung (như bản gốc) */
.tpl-songhy .sh-gbtn:is(:hover,:focus-visible) .box{animation:shPop .7s cubic-bezier(.34,1.56,.64,1) forwards}
.tpl-songhy .sh-gbtn:is(:hover,:focus-visible) .m1{animation:shUp1 1.6s ease-in-out infinite}
.tpl-songhy .sh-gbtn:is(:hover,:focus-visible) .m2{animation:shUp2 1.8s ease-in-out .15s infinite}
.tpl-songhy .sh-gbtn:is(:hover,:focus-visible) .m3{animation:shUp3 1.4s ease-in-out .3s infinite}
.tpl-songhy .sh-gbtn:is(:hover,:focus-visible) .m4{animation:shUp4 1.7s ease-in-out .45s infinite}
.tpl-songhy .sh-gbtn:is(:hover,:focus-visible) .m5{animation:shUp5 1.9s ease-in-out .1s infinite}
.tpl-songhy .sh-gbtn:is(:hover,:focus-visible) .m6{animation:shUp6 1.3s ease-in-out .35s infinite}
.tpl-songhy .sh-gbtn:is(:hover,:focus-visible) .m7{animation:shUp7 1.7s ease-in-out .2s infinite}
.tpl-songhy .sh-gbtn:is(:hover,:focus-visible) .c1{animation:shC1 1s ease-out .05s infinite}
.tpl-songhy .sh-gbtn:is(:hover,:focus-visible) .c2{animation:shC2 1.1s ease-out .12s infinite}
.tpl-songhy .sh-gbtn:is(:hover,:focus-visible) .c3{animation:shC3 .95s ease-out .2s infinite}
.tpl-songhy .sh-gbtn:is(:hover,:focus-visible) .c4{animation:shC4 1.15s ease-out .3s infinite}
.tpl-songhy .sh-gbtn:is(:hover,:focus-visible) .c5{animation:shC5 1.05s ease-out .35s infinite}
.tpl-songhy .sh-gbtn:is(:hover,:focus-visible) .c6{animation:shC6 1.2s ease-out .4s infinite}
.tpl-songhy .sh-gbtn:is(:hover,:focus-visible) .c7{animation:shC7 .9s ease-out .5s infinite}
.tpl-songhy .sh-gbtn:is(:hover,:focus-visible) .c8{animation:shC8 1.1s ease-out .55s infinite}
@keyframes shBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes shShadow{0%,100%{transform:scaleX(1);opacity:.3}50%{transform:scaleX(.9);opacity:.18}}
@keyframes shSpark{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1.15)}}
@keyframes shHint{0%,100%{opacity:.45}50%{opacity:1}}
@keyframes shPop{0%{transform:translateY(0) scale(1) rotate(0)}45%{transform:translateY(-14px) scale(1.08) rotate(-3deg)}100%{transform:translateY(-8px) scale(1.05) rotate(0)}}
@keyframes shUp1{0%{translate:0;opacity:1}55%{translate:-6px -28px;opacity:1}80%{translate:-14px -55px;opacity:0}81%{translate:0;opacity:0}100%{translate:0;opacity:1}}
@keyframes shUp2{0%{translate:0;opacity:1}55%{translate:6px -30px;opacity:1}80%{translate:14px -60px;opacity:0}81%{translate:0;opacity:0}100%{translate:0;opacity:1}}
@keyframes shUp3{0%{translate:0;opacity:1}55%{translate:-4px -32px;opacity:1}80%{translate:-10px -65px;opacity:0}81%{translate:0;opacity:0}100%{translate:0;opacity:1}}
@keyframes shUp4{0%{translate:0;opacity:1}55%{translate:5px -35px;opacity:1}80%{translate:12px -70px;opacity:0}81%{translate:0;opacity:0}100%{translate:0;opacity:1}}
@keyframes shUp5{0%{translate:0;opacity:1}55%{translate:-3px -40px;opacity:1}80%{translate:-8px -80px;opacity:0}81%{translate:0;opacity:0}100%{translate:0;opacity:1}}
@keyframes shUp6{0%{translate:0;opacity:1}55%{translate:4px -38px;opacity:1}80%{translate:10px -75px;opacity:0}81%{translate:0;opacity:0}100%{translate:0;opacity:1}}
@keyframes shUp7{0%{translate:0;opacity:1}55%{translate:6px -36px;opacity:1}80%{translate:14px -72px;opacity:0}81%{translate:0;opacity:0}100%{translate:0;opacity:1}}
@keyframes shC1{0%{transform:translate(0,0) rotate(0);opacity:0}15%{opacity:1}100%{transform:translate(-55px,-130px) rotate(540deg);opacity:0}}
@keyframes shC2{0%{transform:translate(0,0) rotate(0);opacity:0}15%{opacity:1}100%{transform:translate(46px,-150px) rotate(-460deg);opacity:0}}
@keyframes shC3{0%{transform:translate(0,0) rotate(0);opacity:0}15%{opacity:1}100%{transform:translate(-12px,-160px) rotate(620deg);opacity:0}}
@keyframes shC4{0%{transform:translate(0,0) rotate(0);opacity:0}15%{opacity:1}100%{transform:translate(28px,-115px) rotate(-340deg);opacity:0}}
@keyframes shC5{0%{transform:translate(0,0) rotate(0);opacity:0}15%{opacity:1}100%{transform:translate(-34px,-105px) rotate(320deg);opacity:0}}
@keyframes shC6{0%{transform:translate(0,0) rotate(0);opacity:0}15%{opacity:1}100%{transform:translate(58px,-88px) rotate(-240deg);opacity:0}}
@keyframes shC7{0%{transform:translate(0,0) rotate(0);opacity:0}15%{opacity:1}100%{transform:translate(8px,-170px) rotate(420deg);opacity:0}}
@keyframes shC8{0%{transform:translate(0,0) rotate(0);opacity:0}15%{opacity:1}100%{transform:translate(-46px,-78px) rotate(-200deg);opacity:0}}
.tpl-songhy .sh-gbtn .hint{position:absolute;left:50%;bottom:0;transform:translateX(-50%);white-space:nowrap;font:500 12px/16px system-ui,-apple-system,sans-serif;color:#464646;animation:shHint 2s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.tpl-songhy .sh-gbtn *,.tpl-songhy .sh-rise i,.tpl-songhy .sh-seal,.tpl-songhy .sh-obtn i{animation:none!important}}

/* ---- hộp thoại (xác nhận tham dự, quà mừng) ---- */
.tpl-songhy .sh-dlg{width:min(448px,calc(100% - 32px));max-height:85vh;padding:0;border:0;border-radius:16px;background:#fff;color:#111827;box-shadow:0 25px 50px -12px rgba(0,0,0,.25);overflow:auto}
.tpl-songhy .sh-dlg::backdrop{background:rgba(0,0,0,.5)}
.tpl-songhy .sh-x{position:absolute;top:16px;right:16px;z-index:1;width:32px;height:32px;border:0;border-radius:50%;background:#f3f4f6;color:#6b7280;font-size:20px;line-height:1;cursor:pointer}
.tpl-songhy .sh-rsvp .s-rsvp{padding:24px;text-align:left}
.tpl-songhy .sh-rsvp .sh-h{margin:0 40px 4px 0;font-family:system-ui,sans-serif;font-size:20px;font-weight:600;letter-spacing:0;text-transform:none;text-align:left;color:#111827}
.tpl-songhy .sh-rsvp .sec-sub{margin:0 0 24px;font-family:system-ui,sans-serif;color:#6b7280}
.tpl-songhy .sh-rsvp .form{gap:16px;padding:0;border:0;background:none;font-family:system-ui,sans-serif}
.tpl-songhy .sh-rsvp .form label{font-size:14px;font-weight:500;color:#374151}
.tpl-songhy .sh-rsvp .form input:not([type=radio]),.tpl-songhy .sh-rsvp .form select{padding:12px 16px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;font-size:16px;color:#111827}
.tpl-songhy .sh-rsvp .choice label{padding:10px 12px;border:2px solid #e5e7eb;border-radius:12px;background:rgba(249,250,251,.5);font-size:14px;color:#374151}
.tpl-songhy .sh-rsvp .choice label:has(input:checked){border-color:var(--accent)}
.tpl-songhy .sh-rsvp .btn{padding:14px;border:0;border-radius:12px;background:var(--accent);color:var(--accent-ink);font-size:14px;font-weight:600}
.tpl-songhy .sh-giftdlg{width:min(512px,calc(100% - 32px));max-height:90vh;background:var(--sh-gift)}
.tpl-songhy .sh-dlg-head{position:relative;padding:24px 24px 16px;background:var(--accent);text-align:center}
.tpl-songhy .sh-dlg-head h2{margin:0;font:700 20px/28px var(--font-body);letter-spacing:.025em;text-transform:uppercase;color:#fff;text-shadow:1px 1px 2px rgba(0,0,0,.2)}
.tpl-songhy .sh-dlg-head .sh-x{top:12px;right:12px;background:none;color:rgba(255,255,255,.8)}
.tpl-songhy .sh-giftdlg .gifts{display:flex;flex-direction:column;align-items:center;gap:16px;padding:16px;color:var(--sh-gray)}
.tpl-songhy .sh-giftdlg .gift{flex:1;max-width:180px;padding:0;border:0;background:none;text-align:center;font-family:system-ui,sans-serif}
.tpl-songhy .sh-giftdlg .gift-who{min-height:2rem;margin:0 0 8px;font:500 12px/16px system-ui,sans-serif;color:var(--accent)}
.tpl-songhy .sh-giftdlg .gift img{width:128px;height:128px;margin:0 auto 8px;padding:8px;border:2px solid color-mix(in srgb,var(--accent) 12.5%,transparent);border-radius:12px;background:#fff;box-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1)}
.tpl-songhy .sh-giftdlg .gift p{margin:2px 0;font-size:10px;line-height:15px;color:var(--sh-gray)}
.tpl-songhy .sh-giftdlg .gift-acc{gap:6px;font-family:ui-monospace,monospace;letter-spacing:0}
.tpl-songhy .sh-giftdlg .gift-holder{font-weight:600}
.tpl-songhy .sh-giftdlg .copy{padding:4px 8px;border:0;border-radius:999px;background:color-mix(in srgb,var(--accent) 8.2%,transparent);color:var(--accent);font-size:10px;font-weight:500}
@media (max-width:639px){.tpl-songhy .sh-giftdlg{margin:auto auto 0;width:100%;max-width:none;border-radius:16px 16px 0 0}}

.tpl-songhy .sh-thanks{max-width:896px;margin:0 auto;padding:32px 8px;text-align:center}
.tpl-songhy .sh-thanks p{margin:0 auto;white-space:pre-line;font-family:var(--font-body);font-size:20px;line-height:28px;color:var(--muted)}
.tpl-songhy .s-story{padding:32px 24px;font-size:16px;text-align:center;color:var(--muted)}
.tpl-songhy .credit{padding:6px 0;font-size:12px;line-height:16px;opacity:.5;color:var(--muted)}

@media (min-width:640px){
  .tpl-songhy .sh-ocard{width:340px}
  .tpl-songhy .sh-onames{font-size:36px;line-height:1.25}
  .tpl-songhy .sh-onames i{font-size:20px}
  .tpl-songhy .sh-obtn{font-weight:500}
  .tpl-songhy .sh-fams{padding:0 16px}
  .tpl-songhy .sh-when-block{padding:32px 24px}
  .tpl-songhy .sh-cf{padding:16px}
  .tpl-songhy .sh-party-in{padding:24px 16px 32px}
  .tpl-songhy .sh-guestbook .s-wishes{padding:32px 16px}
  .tpl-songhy .sh-wrow button{padding:12px 32px;font-size:16px;line-height:24px}
  .tpl-songhy .sh-thanks{padding:32px 16px}
  .tpl-songhy .sh-giftdlg .gifts{flex-direction:row;flex-wrap:wrap;align-items:flex-start;justify-content:center;padding:24px}
  .tpl-songhy .sh-giftdlg .gift img{width:160px;height:160px}
  .tpl-songhy .sh-giftdlg .gift{max-width:none}
}
/* màn hình rộng: cột 900px có viền mảnh, các khối lớn hơn như bản gốc */
@media (min-width:768px){
  .tpl-songhy .card{max-width:900px;border:1px solid color-mix(in srgb,var(--accent) 13%,transparent)}
  .tpl-songhy .sh-ocard{width:520px}
  .tpl-songhy .sh-obg>*{width:300px}
  .tpl-songhy .sh-obg .tl{top:-104px;left:-130px}
  .tpl-songhy .sh-obg .br{bottom:-104px;right:-143px}
  .tpl-songhy .sh-obody{padding:96px 24px 32px}
  .tpl-songhy .sh-cover{padding-bottom:130px}
  .tpl-songhy .sh-burst{width:min(872px,100%)}
  .tpl-songhy .sh-welcome{padding-top:52px;font-size:14px;line-height:21px}
  .tpl-songhy .sh-hnames{gap:20px;margin-top:16px;padding:0 40px}
  .tpl-songhy .sh-hnames .k{font-size:14px;line-height:21px}
  .tpl-songhy .sh-hnames .hy{width:83px}
  .tpl-songhy .sh-hy{width:83px;height:83px}
  .tpl-songhy .sh-arch{margin-top:12px}
  .tpl-songhy .sh-arch-in{max-width:372px;transform:translateY(73px)}
  .tpl-songhy .sh-arch-text{transform:translateY(-15px)}
  .tpl-songhy .sh-band{padding:16px 0}
  .tpl-songhy .sh-h{font-size:24px;line-height:36px}
  .tpl-songhy .sh-fams{column-gap:32px}
  .tpl-songhy .sh-fam{max-width:280px}
  .tpl-songhy .sh-fam .k{font-size:15px;line-height:22.5px}
  .tpl-songhy .sh-fam .a{font-size:13px}
  .tpl-songhy .sh-lead{max-width:560px;font-size:20px;line-height:30px}
  .tpl-songhy .sh-couple{gap:16px}
  .tpl-songhy .sh-couple h3{line-height:100px}
  .tpl-songhy .sh-role{font-size:13px;line-height:19.5px}
  .tpl-songhy .sh-amp{font-size:35px;line-height:52.5px}
  .tpl-songhy .sh-where{font-size:20px;line-height:32.5px}
  .tpl-songhy .sh-at,.tpl-songhy .sh-date .w,.tpl-songhy .sh-date .m{font-size:15px;line-height:22.5px}
  .tpl-songhy .sh-date .w,.tpl-songhy .sh-date .m{width:85px}
  .tpl-songhy .sh-date i{margin:0 16px}
  .tpl-songhy .sh-date b{font-size:38px;line-height:57px}
  .tpl-songhy .sh-year{font-size:22px;line-height:33px}
  .tpl-songhy .sh-lunar{font-size:14px;line-height:21px}
  .tpl-songhy .sh-cf-stage{height:520px}
  .tpl-songhy .sh-cf-nav{position:absolute;top:50%;z-index:200;display:flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border:0;border-radius:50%;background:rgba(221,221,221,.6);color:#1f1f1f;transform:translateY(-50%);cursor:pointer}
  .tpl-songhy .sh-cf-nav:hover{background:#ddd}
  .tpl-songhy .sh-cf-nav.prev{left:0}
  .tpl-songhy .sh-cf-nav.next{right:0}
  .tpl-songhy .sh-time{font-size:24px;line-height:36px}
  .tpl-songhy .sh-calwrap{width:352px}
  .tpl-songhy .sh-calh{font-size:14px;line-height:21px}
  .tpl-songhy .sh-calwrap .cal-grid{font-size:13px}
  .tpl-songhy .sh-calwrap .cal-grid span{height:34px}
  .tpl-songhy .sh-calwrap .cal-grid .cal-w{font-size:11px;line-height:16.5px}
  .tpl-songhy .sh-calwrap .cal-on::before{width:30px;height:28px}
  .tpl-songhy .sh-calwrap .cal-on b{font-size:12px}
  .tpl-songhy .sh-rsvp-btn{padding:8px 0 40px}
  .tpl-songhy .sh-pill{font-size:16px;line-height:24px}
  .tpl-songhy .sh-addr{font-size:16px;line-height:24px}
  .tpl-songhy .sh-venue-in{gap:20px}
  .tpl-songhy .sh-map{height:450px}
  .tpl-songhy .sh-dir{font-size:16px;line-height:24px}
  .tpl-songhy .sh-sched{gap:32px;margin:48px 0}
  .tpl-songhy .sh-tl{--gy:40px;column-gap:32px}
  .tpl-songhy .sh-tl .t{font-size:17px;line-height:23.4px}
  .tpl-songhy .sh-tl .l{font-size:19px;line-height:26.1px}
  .tpl-songhy .sh-wform,.tpl-songhy .wish-list{max-width:600px}
  .tpl-songhy .sh-giftdlg .sh-dlg-head h2{font-size:24px;line-height:32px}
}
@media (min-width:1024px){
  .tpl-songhy .sh-ocard{width:600px}
  .tpl-songhy .sh-arch-text{transform:translateY(-20px)}
}
`,
};
