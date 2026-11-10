// Mẫu "Long Phụng" — truyền thống: nền đỏ thẫm, chữ màu đào, rồng phượng chìm, chữ Hỷ và khung ảnh bo góc lõm.
// Kích thước lấy theo bản gốc (Tailwind): số đầu cho điện thoại, khối @media (min-width:768px) / (min-width:1024px) cho màn rộng.
// Ảnh trang trí (rồng, phượng, chữ Hỷ, chim én) nằm ở public/demo/longphung-*.webp; thiếu ảnh nào thì phần đó tự ẩn
// (chữ Hỷ thay bằng ký tự 囍). Khung tiêu đề, khung ảnh bìa và khung lịch vẽ lại bằng SVG ngay trong mẫu.
const { esc } = require('../lib/util');

const A = (n) => `/demo/longphung-${n}`; // ảnh của mẫu
const PEACH = '#FFBE89';
// ảnh trang trí: lỗi tải thì gỡ hẳn để không hiện biểu tượng ảnh hỏng
const deco = (n, cls, extra = '') => `<img class="${cls}" src="${A(n)}" alt="" aria-hidden="true" onerror="this.remove()"${extra}>`;
// chữ Hỷ: ảnh của mẫu, thiếu ảnh thì dùng ký tự 囍
const hy = (cls) => `<span class="lp-hy ${cls}"><img src="${A('chu-hy.webp')}" alt="囍" onerror="this.parentNode.classList.add('noimg');this.remove()"></span>`;

const base = {
  '--font-title': "'EB Garamond',Baskerville,'Times New Roman',serif",
  '--font-script': "'EB Garamond',Baskerville,serif",
  '--font-body': "Baskerville,'Libre Baskerville','Times New Roman',serif", // Baskerville có sẵn trên máy Apple như bản gốc
};

// khung ảnh bìa: đường viền bo góc lõm của bản gốc (viewBox -7.5 0 754 1099); ảnh nằm trong khung thu nhỏ ~2%
const HERO = 'M228.5,1055 C334.984,1055 441.468,1055.014 547.953,1054.954 C552.565,1054.951 557.299,1054.816 561.77,1053.818 C587.42,1048.092 605.609,1033.486 613.947,1008.096 C616.121,1001.475 616.769,994.353 618.145,987.324 C635.537,985.235 643.773,982.674 655.945,973.945 C673.843,961.11 683.913,943.592 683.924,921.395 C684.045,677.096 684.005,432.797 683.96,188.498 C683.959,184.385 683.56,180.244 683,176.163 C679.281,149.073 659.695,127.409 632.889,120.926 C627.506,119.624 621.924,119.145 616.263,118.259 C615.743,106.246 612.673,94.898 606.242,84.598 C593.381,63.998 574.69,52.259 550.521,52.178 C433.372,51.783 316.221,51.985 199.071,52.042 C192.958,52.045 186.798,52.289 180.739,53.048 C157.947,55.903 140.708,67.665 130.359,87.905 C125.447,97.514 123.518,108.648 120.074,119.613 C115.916,120.411 110.303,121.01 105.008,122.641 C99.7,124.276 94.421,126.447 89.63,129.241 C67.002,142.437 55.184,162.706 55.156,188.519 C54.894,431.151 54.993,673.784 55.05,916.416 C55.051,921.358 55.314,926.397 56.285,931.223 C59.49,947.166 66.483,961.038 79.179,971.747 C88.756,979.825 99.385,985.395 111.912,987.02 C115.34,987.465 119.765,986.747 121.912,988.635 C123.923,990.403 123.503,994.917 124.196,998.214 C124.365,999.018 124.792,999.769 124.943,1000.574 C130.73,1031.288 158.409,1054.584 190.006,1054.975 C202.502,1055.129 215.002,1055 228,1055 Z';

// khung tiêu đề (border-image, slice 31 trên ô 62×62): một nét màu đào, bốn góc lõm
const svgUri = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
const TITLE_FRAME = svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 62 62'><path d='M14 3H48A11 11 0 0 0 59 14V48A11 11 0 0 0 48 59H14A11 11 0 0 0 3 48V14A11 11 0 0 0 14 3Z' fill='none' stroke='${PEACH}' stroke-width='2.4'/></svg>`);
// khung lịch: nét mảnh, góc là hoa văn chữ hồi (border-image, slice 40 trên ô 120×120)
const fret = "M3 3h17v17h-12v-7h6v-3H8M14 40V14h26M14 40v3M40 14h3";
const CAL_FRAME = svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120' fill='none' stroke='${PEACH}' stroke-width='1.6'>${[0, 90, 180, 270].map((r) => `<path transform='rotate(${r} 60 60)' d='${fret}'/>`).join('')}<path d='M43 14H77M43 106H77M14 43V77M106 43V77'/></svg>`);

// chữ Hỷ bay lên trên màn mở thiệp (vị trí %, màu, cỡ chữ, độ lắc, thời gian, độ trễ — lấy nguyên từ bản gốc)
const RISE = [[80.5, '#FFD4A8', 19.5, 14.6, 20.4, -15.7], [45.3, '#FFD4A8', 14.1, -8.9, 22.7, -15.8], [64.7, '#710001', 11, -8.9, 18.8, -12.3], [41.6, '#FF9B4A', 11.6, 23.7, 18, -14], [34.1, '#FF9B4A', 10.5, -2.3, 25.5, -14], [43, '#FFD4A8', 15.5, -18.5, 22.3, -11.9], [11.7, '#FF9B4A', 11.3, -17.9, 25.4, -1.6], [59.5, '#FF9B4A', 21.8, 19.4, 24.6, -3.6], [35, PEACH, 22.8, -6.1, 18, -7.2], [73.6, '#710001', 18, 7.8, 25.9, -8.3], [21.1, PEACH, 23.7, 19.2, 23.4, -7.4], [77.5, '#FF9B4A', 14.6, -27.1, 25.8, -17.9]];

const evList = (d) => d.events.filter((e) => e.name || e.place);
// sự kiện chính của tiệc (khung "Thông tin tiệc cưới", bản đồ)
function partyEvent(d) {
  const evs = evList(d);
  return evs.find((e) => /khai tiệc|tiệc cưới/i.test(e.name) && e.place) || evs.find((e) => /tiệc/i.test(e.name)) || evs[evs.length - 1] || null;
}
// lễ cưới ở phần lời mời: sự kiện đầu tiên có nơi tổ chức khác tiệc
function ceremony(d, party) {
  return evList(d).find((e) => e !== party && e.place) || null;
}
const lunarOf = (ctx) => ctx.lunar.replace(/^Nhằm /i, '');
// thứ | ngày | tháng (dùng ở lời mời và tiệc cưới)
const dateRow = (ctx) => `<div class="lp-date"><span class="wd">${esc(ctx.weekday)}</span><i></i><b>${ctx.dparts.d}</b><i></i><span class="mo">Tháng ${ctx.dparts.m}</span></div>`;

module.exports = {
  id: 'longphung',
  name: 'Long Phụng',
  group: 'truyenthong',
  desc: 'Truyền thống: nền đỏ thẫm, chữ màu đào, rồng phượng chìm, chữ Hỷ và khung ảnh bo góc',
  fonts: 'https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500&family=Lora:wght@300;400;500;600&family=Libre+Baskerville:wght@400;700&family=Libre+Caslon+Text&display=swap',
  palettes: [
    { id: 'do-tham', name: 'Đỏ thẫm', swatch: ['#7a0014', PEACH], vars: { ...base, '--page': '#ffffff', '--bg': '#7a0014', '--paper': '#5a000e', '--ink': PEACH, '--muted': 'rgba(255,190,137,.7)', '--accent': PEACH, '--accent-ink': '#7a0014', '--gold': '#d4af37', '--line': 'rgba(255,190,137,.4)', '--lp-o1': '#710001', '--lp-o2': '#5a0001', '--lp-o3': '#450001', '--lp-dlg': '#5a000e' } },
    { id: 'do-son', name: 'Đỏ son', swatch: ['#9e1b1b', PEACH], vars: { ...base, '--page': '#ffffff', '--bg': '#9e1b1b', '--paper': '#7d1010', '--ink': PEACH, '--muted': 'rgba(255,190,137,.7)', '--accent': PEACH, '--accent-ink': '#9e1b1b', '--gold': '#d4af37', '--line': 'rgba(255,190,137,.4)', '--lp-o1': '#951313', '--lp-o2': '#7d0d0d', '--lp-o3': '#5f0808', '--lp-dlg': '#7d1010' } },
  ],
  // dữ liệu xem thử theo bản gốc (tên và bố mẹ giữ của dữ liệu mẫu chung): 12/7/2026, lễ thành hôn tư gia 9h, tiệc VinPalace Cổ Loa
  demo: {
    date: '2026-07-12',
    time: '18:00',
    cover: A('cover.jpg'),
    photos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => A(`${n}.jpg`)),
    story: '',
    message: 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!',
    events: [
      { name: 'Lễ Thành Hôn', date: '2026-07-12', time: '09:00', place: 'Tư gia', address: '', mapUrl: '' },
      { name: 'Đón khách', date: '2026-07-12', time: '17:30', place: '', address: '', mapUrl: '' },
      { name: 'Khai tiệc', date: '2026-07-12', time: '18:30', place: 'VinPalace Cổ Loa', address: 'Đông Hội, Đông Anh, Hà Nội', mapUrl: '' },
      { name: 'Rót rượu, cắt bánh', date: '2026-07-12', time: '18:45', place: '', address: '', mapUrl: '' },
      { name: 'Phục vụ món chính', date: '2026-07-12', time: '19:00', place: '', address: '', mapUrl: '' },
      { name: 'Kết thúc tiệc', date: '2026-07-12', time: '21:00', place: '', address: '', mapUrl: '' },
    ],
    gifts: {
      groom: { bin: '970418', acc: '0399554682', holder: 'NGUYEN TUAN KIET' },
      bride: { bin: '970436', acc: '099996586', holder: 'TRAN THANH HA' },
    },
  },
  // xác nhận tham dự mở trong hộp thoại từ khung tiệc cưới (như bản gốc), nên không có trong luồng trang
  layout: ['invite', 'story', 'gallery', 'calendar', 'events', 'wishes', 'gift', 'thanks'],

  title(text, sub) {
    return `<h2 class="lp-h">${esc(text)}</h2>${sub ? `<p class="sec-sub">${esc(sub)}</p>` : ''}`;
  },

  opener(ctx) {
    const p = ctx.dparts;
    return `
<div class="opener lp-opener" id="opener" data-open-ms="1100">
  <div class="lp-rise" aria-hidden="true">${RISE.map(([x, c, s, sw, du, de]) => `<span style="left:${x}%;color:${c};font-size:${s}px;--sway:${sw}px;animation-duration:${du}s;animation-delay:${de}s">囍</span>`).join('')}</div>
  <div class="lp-ocard">
    ${hy('lp-seal')}
    <div class="lp-oinner">
      <div class="lp-obg">${deco('phung.webp', 'ph')}${deco('rong.webp', 'ro')}</div>
      <div class="lp-obody">
        <h1 class="lp-onames"><span>${esc(ctx.g)}</span><i>&amp;</i><span>${esc(ctx.b)}</span></h1>
        <p class="lp-rule" aria-hidden="true"><span></span>❦<span></span></p>
        ${p ? `<p class="lp-odate">${+p.d} tháng ${+p.m}, ${p.y}</p>` : ''}
        <div class="lp-oto"><p>Thân Mời</p>${ctx.guest ? `<div class="lp-guest">${esc(ctx.guest.name)}</div>` : ''}</div>
        <button class="lp-obtn" id="openBtn">Mở thiệp<i></i></button>
      </div>
    </div>
  </div>
</div>`;
  },

  cover(ctx) {
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    // rồng phượng chìm phía sau cả thiệp, trôi chậm theo cuộn trang (8% quãng cuộn như bản gốc)
    const bg = Array.from({ length: 12 }, (_, i) => deco(i % 2 ? 'rong.webp' : 'phung.webp', '', ' loading="lazy"')).join('');
    return `
<div class="lp-bg" aria-hidden="true"><div>${bg}</div></div>
<script>(function(){var c=document.currentScript.previousElementSibling.firstElementChild,t=0;
  addEventListener('scroll',function(){if(t)return;t=requestAnimationFrame(function(){t=0;c.style.transform='translateY('+(scrollY*.08)+'px)'})},{passive:true});})()</script>
<header class="lp-cover">
  <div class="lp-names"><p>${esc(ctx.g)}</p>${hy('lp-hy-top')}<p>${esc(ctx.b)}</p></div>
  <div class="lp-hero">
    ${deco('chim-en.webp', 'lp-bird l')}${deco('chim-en.webp', 'lp-bird r')}
    <svg viewBox="-7.5 0 754 1099" aria-hidden="true">
      <defs>
        <clipPath id="lpHeroIn"><path d="${HERO}" transform="translate(369.5 553.5) scale(0.98091 0.98804) translate(-369.5 -553.5)"/></clipPath>
        <linearGradient id="lpHeroG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd2a8"/><stop offset=".5" stop-color="${PEACH}"/><stop offset="1" stop-color="#e9a26c"/></linearGradient>
      </defs>
      <path d="${HERO}" fill="url(#lpHeroG)"/>
      ${photo ? `<image href="${esc(photo)}" x="0" y="0" width="754" height="1099" clip-path="url(#lpHeroIn)" preserveAspectRatio="xMidYMid slice"/>` : ''}
    </svg>
  </div>
</header>`;
  },

  sections: {
    // "Thông tin lễ cưới": bố mẹ hai bên, tên đầy đủ, nơi & giờ làm lễ, ngày dương + âm
    invite(ctx) {
      const { d, dparts: p } = ctx;
      const strip = (s) => esc(s.replace(/^(Ông|Bà)\s+/i, ''));
      const fam = (x) => `<div class="lp-fam"><span class="k">Ông Bà</span><span class="n">${x.father ? `<span>${strip(x.father)}</span>` : ''}${x.mother ? `<span>${strip(x.mother)}</span>` : ''}</span>${x.address ? `<span class="a">${esc(x.address)}</span>` : ''}</div>`;
      const hasFam = d.groom.father || d.groom.mother || d.bride.father || d.bride.mother;
      const cer = ceremony(d, partyEvent(d));
      return `
  <section class="sec lp-invite reveal">
    <h2 class="lp-h lp-fr">Thông tin lễ cưới</h2>
    ${hasFam ? `<div class="lp-fams">${fam(d.groom)}<i></i>${fam(d.bride)}</div>` : ''}
    <div class="lp-couple">
      <h3>${esc(d.groom.fullName || d.groom.name)}</h3>
      <p class="amp">&amp;</p>
      <h3>${esc(d.bride.fullName || d.bride.name)}</h3>
    </div>
    <div class="lp-when-block">
      ${cer ? `<p class="lp-lead">${esc(cer.name || 'Lễ thành hôn')} được cử hành tại<br>${esc(cer.place)}</p>` : ''}
      ${cer && cer.time ? `<p class="lp-at">Vào lúc ${esc(cer.time)}</p>` : ''}
      ${p ? `${dateRow(ctx)}<p class="lp-year">${p.y}</p><p class="lp-lunar">(Tức ${esc(lunarOf(ctx))})</p>` : ''}
    </div>
  </section>`;
    },

    // album vòng 3D: ảnh giữa lớn, hai bên xoay 45° lùi sâu; tự chuyển, vuốt / mũi tên / chạm ảnh bên để chuyển
    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      return `
  <section class="sec lp-album">
    <h2 class="lp-h lp-fr">Album ảnh</h2>
    <div class="lp-cf">
      <div class="lp-cf-stage">
        <button class="lp-cf-nav prev" type="button" aria-label="Ảnh trước"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" stroke-width="2"/></svg></button>
        <button class="lp-cf-nav next" type="button" aria-label="Ảnh sau"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" stroke-width="2"/></svg></button>
        <div class="lp-cf-row">${ph.map((u, i) => `<button class="ph" data-i="${i}" aria-label="Xem ảnh ${i + 1}"><img loading="lazy" src="${esc(u)}" alt=""></button>`).join('')}</div>
      </div>
      <p class="lp-count"><span>1</span> / ${ph.length}</p>
    </div>
    <script>(function(){
      var s=document.currentScript.parentNode,cs=[].slice.call(s.querySelectorAll('.ph')),out=s.querySelector('.lp-count span'),k=0,n=cs.length,tm;
      var SC=[1,.85,.7],OP=[1,.75,.5,.3];
      function go(i){k=(i+n)%n;cs.forEach(function(c,j){var o=j-k;if(o>n/2)o-=n;if(o<-n/2)o+=n;var a=Math.abs(o);
        c.style.transform='translateX('+(o*60)+'%) translateZ('+(-150*a)+'px) rotateY('+(45*o)+'deg) scale('+SC[Math.min(a,2)]+')';
        c.style.opacity=OP[Math.min(a,3)];c.style.zIndex=100-a;c.dataset.o=o;});out.textContent=k+1;}
      function auto(){clearInterval(tm);tm=setInterval(function(){go(k+1)},4000);}
      var st=s.querySelector('.lp-cf-stage');
      // chạm ảnh bên cạnh thì chuyển tới ảnh đó, chỉ ảnh giữa mới mở xem lớn
      st.addEventListener('click',function(e){var c=e.target.closest('.ph');if(c&&c.dataset.o!=='0'){e.stopPropagation();go(cs.indexOf(c));auto();}},true);
      s.querySelector('.prev').onclick=function(){go(k-1);auto()};s.querySelector('.next').onclick=function(){go(k+1);auto()};
      var x0=null;st.addEventListener('pointerdown',function(e){x0=e.clientX});
      st.addEventListener('pointerup',function(e){if(x0!==null&&Math.abs(e.clientX-x0)>40){go(k+(e.clientX<x0?1:-1));auto();}x0=null});
      go(0);auto();
    })()</script>
  </section>`;
    },

    // "Thông tin tiệc cưới": giờ, ngày, âm lịch, đón khách / khai tiệc, lịch tháng trong khung chữ hồi; nút mở hộp thoại xác nhận
    calendar(ctx, opts, h) {
      const { d, dparts: p } = ctx;
      if (!p) return '';
      const evs = evList(d);
      const party = partyEvent(d) || {};
      const time = d.time || party.time;
      const at = evs.indexOf(party);
      const marks = at > 0 && evs[at - 1].time && !evs[at - 1].place ? [evs[at - 1], party] : [];
      let grid = '';
      if (d.show.calendar) {
        const y = +p.y, m = +p.m, day = +p.d;
        const first = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
        const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
        let cells = '<span></span>'.repeat(first);
        for (let i = 1; i <= days; i++) cells += i === day ? `<span class="on" aria-label="Ngày cưới ${i}"><svg viewBox="0 0 24 22"><path d="M12 21C12 21 1.5 13.5 1.5 7.5C1.5 4.46 3.96 2 7 2C8.76 2 10.35 2.81 11.4 4.09L12 4.8L12.6 4.09C13.65 2.81 15.24 2 17 2C20.04 2 22.5 4.46 22.5 7.5C22.5 13.5 12 21 12 21Z"/></svg><b>${i}</b></span>` : `<span>${i}</span>`;
        grid = `<div class="lp-calfr"><div class="lp-cal"><p class="hd">Tháng ${m} / ${y}</p><div class="wk">${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((w) => `<span>${w}</span>`).join('')}</div><div class="days">${cells}</div></div></div>`;
      }
      const cal = h.calendarLink(`Đám cưới ${ctx.g} & ${ctx.b}`, ctx.date, time, party.address || party.place);
      const rsvp = d.show.rsvp ? h.rsvp(ctx).replace('sec s-rsvp reveal', 's-rsvp') : '';
      return `
  <section class="sec lp-party reveal">
    <h2 class="lp-h lp-fr">Thông tin tiệc cưới</h2>
    <div class="lp-party-in">
      <h3 class="lp-lead">Tiệc cưới sẽ diễn ra vào lúc:</h3>
      ${time ? `<p class="lp-ptime">${esc(time)}</p>` : ''}
      ${dateRow(ctx)}
      <p class="lp-lunar">(Tức ${esc(lunarOf(ctx))})</p>
      ${marks.length ? `<div class="lp-marks">${marks.map((e) => `<div><span class="k">${esc(e.name)}</span><span class="t">${esc(e.time)}</span></div>`).join('')}</div>` : ''}
      ${grid}
      <a class="lp-link" target="_blank" rel="noopener" href="${esc(cal)}">Thêm vào lịch</a>
    </div>
    ${rsvp ? `<button class="lp-pill" type="button" onclick="document.getElementById('lpRsvp').showModal()">Xác nhận tham dự</button>` : ''}
  </section>
  ${rsvp ? `<dialog class="lp-dlg lp-rsvp" id="lpRsvp"><button class="lp-x" type="button" aria-label="Đóng" onclick="this.closest('dialog').close()">×</button>${rsvp}</dialog>` : ''}`;
    },

    // nơi tổ chức tiệc (bản đồ) + lịch trình dạng dòng thời gian có chim én hai bên
    events(ctx, opts, h) {
      const d = ctx.d;
      const party = partyEvent(d);
      const cer = ceremony(d, party);
      const evs = evList(d);
      const tl = evs.length > 1 ? evs.filter((e) => e !== cer) : evs; // lễ cưới đã có ở phần lời mời
      if (!evs.length) return '';
      const dir = party && (party.mapUrl || (party.address ? h.mapSearch([party.place, party.address].filter(Boolean).join(', ')) : ''));
      const q = party ? [party.place, party.address].filter(Boolean).join(', ') : '';
      return `
  ${party && (party.place || party.address) ? `
  <section class="sec lp-venue reveal">
    <div class="lp-venue-h">
      <h2 class="lp-h lp-fr">Tiệc cưới sẽ tổ chức tại</h2>
      <p class="lp-addr">${esc(q)}</p>
    </div>
    <div class="lp-venue-b">
      ${party.address ? `<div class="lp-map"><iframe loading="lazy" title="Bản đồ" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(q)}&amp;output=embed"></iframe></div>` : ''}
      ${dir ? `<a class="lp-dir" target="_blank" rel="noopener" href="${esc(dir)}"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M3 11l18-8-8 18-2-8-8-2z"/></svg>Chỉ đường</a>` : ''}
    </div>
  </section>` : ''}
  ${tl.length ? `
  <div class="lp-sched reveal">
    ${deco('chim-en.webp', 'lp-swallow a')}${deco('chim-en.webp', 'lp-swallow b')}
    <section class="sec">
      <h2 class="lp-h">Lịch trình ngày cưới</h2>
      <ol class="lp-tl">
        ${tl.map((e) => {
          const p = h.parts(e.date);
          const other = p && e.date !== ctx.date;
          return `<li><span class="t">${esc(e.time) || '—'}</span><span class="dot"></span><span class="l">${esc(e.name)}${other ? ` <small>${p.d}/${p.m}</small>` : ''}</span></li>`;
        }).join('')}
      </ol>
    </section>
  </div>` : ''}`;
    },

    // sổ lưu bút: khung kính mờ viền đào; giữ id/tên trường cho card.js
    wishes(ctx, opts) {
      if (!ctx.d.show.wishes) return '';
      const list = opts.wishes || [];
      return `
  <section class="sec s-wishes lp-wishes reveal">
    <h2 class="lp-h">Sổ lưu bút</h2>
    <form class="lp-wform" id="wishForm">
      <div class="box">
        <input name="name" required maxlength="60" placeholder="Nhập tên của bạn*" value="${ctx.guest ? esc(ctx.guest.name) : ''}" aria-label="Tên">
        <textarea name="message" required maxlength="500" rows="4" placeholder="Nhập lời chúc của bạn*" aria-label="Lời chúc"></textarea>
        <div class="row"><p class="form-msg" role="status"></p><button type="submit">Gửi lời chúc</button></div>
      </div>
    </form>
    <div class="wish-list" id="wishList">
      ${list.map((w) => `<div class="wish"><b>${esc(w.name)}</b><p>${esc(w.message)}</p></div>`).join('')}
    </div>
  </section>`;
    },

    // hộp quà rồng phượng nhún nhảy, chạm để mở hộp thoại có mã QR của hai bên
    gift(ctx, opts, h) {
      if (!ctx.d.show.gift) return '';
      const html = h.giftCard(ctx, ctx.d.gifts.groom, 'groom') + h.giftCard(ctx, ctx.d.gifts.bride, 'bride');
      if (!html) return '';
      // [tên ảnh, trái, trên, rộng, xoay, lớp z] — vị trí như bản gốc
      const minis = [['hoa-kho-orange', -20, 10, 34, -22, 1], ['boho-floral-brown', 168, 2, 38, 20, 1], ['spring-garden-red', -16, 120, 26, -18, 1], ['qasr-green', 182, 114, 24, 14, 1], ['saraya-gold', -8, 172, 44, 8, 3], ['elegant-leaf-green', 26, 182, 26, -10, 3], ['minimalism-red', 118, 176, 40, -14, 3]];
      const confetti = ['#d4af37', '#e87070', '#7a4020', '#8a6fd6', '#f2c14e', '#4f8fd6', '#e89050', '#c94f7c'];
      return `
  <section class="sec lp-giftbox reveal">
    <h2 class="lp-h">Hộp quà mừng</h2>
    <button class="lp-gbtn" type="button" onclick="document.getElementById('lpGift').showModal()">
      <span class="in">
        <i class="sp">✦</i><i class="sp">✦</i><i class="sp">✦</i><i class="sp">✦</i>
        <span class="cf">${confetti.map((c) => `<i style="background:${c}"></i>`).join('')}</span>
        <span class="bob">
          <span class="sh"></span>
          ${minis.map(([n, l, t, w, r, z], i) => `<img class="mini m${i + 1}" src="${A(`mini-${n}.webp`)}" alt="" style="left:${l}px;top:${t}px;width:${w}px;z-index:${z};transform:rotate(${r}deg)">`).join('')}
          <img class="box" src="${A('giftbox.webp')}" alt="">
        </span>
      </span>
      <span class="hint">Nhấn để mở</span>
    </button>
  </section>
  <dialog class="lp-dlg lp-giftdlg" id="lpGift">
    <div class="lp-dlg-head"><h2>Hộp quà mừng</h2><button class="lp-x" type="button" aria-label="Đóng" onclick="this.closest('dialog').close()">×</button></div>
    <div class="gifts">${html}</div>
  </dialog>`;
    },

    // dòng cuối trang = lời nhắn của cô dâu chú rể
    thanks(ctx) {
      return `
  <section class="sec lp-thanks reveal">
    <p>${esc(ctx.d.message || 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!')}</p>
  </section>`;
    },
  },

  css: `
.tpl-longphung .card{position:relative;max-width:480px;background:var(--bg);color:var(--ink);font-family:var(--font-body);font-weight:300;line-height:1.5;box-shadow:none;overflow:hidden}
.tpl-longphung .card>*{position:relative;z-index:1}
.tpl-longphung .sec{padding:0}
.tpl-longphung p{margin:0}
/* tiêu đề: Times đậm hoa; có khung (lp-fr) với các phần chính như bản gốc */
.tpl-longphung .lp-h{margin:0 auto;max-width:100%;font-family:'Times New Roman',Times,serif;font-weight:700;font-size:16px;line-height:1.5;letter-spacing:.05em;text-transform:uppercase;color:var(--ink);text-align:center}
.tpl-longphung .lp-fr{width:fit-content;border:18px solid transparent;border-image:${TITLE_FRAME} 31 stretch}
@media (min-width:375px){.tpl-longphung .lp-h{font-size:18px}}
.tpl-longphung .sec-sub{margin:4px 0 0;color:var(--muted);font-size:14px}

/* rồng phượng chìm phía sau thiệp */
.tpl-longphung .lp-bg{position:absolute!important;inset:0;z-index:0!important;overflow:hidden;pointer-events:none}
.tpl-longphung .lp-bg>div{position:absolute;top:0;left:50%;width:130%;margin-left:-65%;display:flex;flex-direction:column;gap:30px;will-change:transform}
.tpl-longphung .lp-bg img{width:100%;opacity:.4}
.tpl-longphung .lp-bg img:first-child{margin-top:-50%}

/* chữ Hỷ: ảnh của mẫu, thiếu ảnh thì ký tự 囍 trong vòng tròn */
.tpl-longphung .lp-hy{display:flex;align-items:center;justify-content:center;aspect-ratio:1}
.tpl-longphung .lp-hy img{width:100%;height:auto;object-fit:contain}
.tpl-longphung .lp-hy.noimg{border-radius:50%;border:2px solid ${PEACH};box-shadow:inset 0 0 0 3px #7a0014,inset 0 0 0 4px ${PEACH};color:${PEACH};font-family:'Noto Serif SC','Songti SC',serif;line-height:1}
.tpl-longphung .lp-hy.noimg::before{content:"囍";font-size:52%}

/* ---- màn mở thiệp ---- */
.tpl-longphung .lp-opener{overflow:hidden;background:linear-gradient(to bottom right,var(--lp-o1),var(--lp-o2),var(--lp-o3))}
.tpl-longphung .lp-rise{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none}
.tpl-longphung .lp-rise span{position:absolute;bottom:-30px;animation:lpRise 20s ease-in-out infinite}
@keyframes lpRise{0%{transform:translateY(6vh) translateX(0) rotate(0);opacity:0}12%{opacity:.45}55%{transform:translateY(-42vh) translateX(var(--sway,20px)) rotate(8deg);opacity:.55}92%{opacity:.35}100%{transform:translateY(-92vh) translateX(0) rotate(0);opacity:0}}
.tpl-longphung .lp-ocard{position:relative;z-index:10;width:310px;max-width:calc(100vw - 32px)}
.tpl-longphung .lp-seal{position:absolute;left:50%;top:50px;z-index:30;width:64px;height:64px;transform:translate(-50%,-50%);animation:lpSeal 2s ease-in-out infinite}
.tpl-longphung .lp-seal img{width:52px;height:52px}
.tpl-longphung .lp-seal.noimg{width:56px;height:56px;font-size:58px}
@keyframes lpSeal{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.06)}}
.tpl-longphung .lp-oinner{position:relative;border-radius:8px;box-shadow:0 25px 60px -12px rgba(0,0,0,.45),0 8px 24px rgba(0,0,0,.2),0 0 40px rgba(255,190,137,.15)}
.tpl-longphung .lp-obg{position:absolute;inset:0;overflow:hidden;border-radius:8px;background:rgba(255,190,137,.1);border:1px solid rgba(255,190,137,.15);clip-path:inset(0 round 8px)}
.tpl-longphung .lp-obg img{position:absolute;width:230px;max-width:none;opacity:.55;pointer-events:none}
.tpl-longphung .lp-obg .ph{top:10px;left:-20px;transform:rotate(20deg)}
.tpl-longphung .lp-obg .ro{bottom:10px;right:-20px;transform:rotate(-20deg)}
.tpl-longphung .lp-obody{position:relative;z-index:10;padding:112px 24px 56px;text-align:center}
.tpl-longphung .lp-onames{display:flex;flex-direction:column;align-items:center;margin:0 0 8px;font-family:'EB Garamond',Baskerville,'Times New Roman',serif;font-weight:400;font-size:30px;line-height:1.25;color:${PEACH}}
.tpl-longphung .lp-onames span{display:block;width:100%}
.tpl-longphung .lp-onames i{display:block;font-style:normal;font-family:Baskerville,'Times New Roman',serif;font-size:18px;line-height:1}
.tpl-longphung .lp-rule{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:8px;color:${PEACH};font-size:14px}
.tpl-longphung .lp-rule span{width:40px;height:1px;background:linear-gradient(to right,transparent,${PEACH})}
.tpl-longphung .lp-rule span:last-child{background:linear-gradient(to left,transparent,${PEACH})}
.tpl-longphung .lp-odate,.tpl-longphung .lp-oto p{font-family:Lora,'Times New Roman',serif;font-size:18px;color:rgba(255,190,137,.8)}
.tpl-longphung .lp-odate{margin-bottom:20px}
.tpl-longphung .lp-oto{margin-bottom:24px}
.tpl-longphung .lp-oto p{font-weight:300;margin-bottom:8px}
.tpl-longphung .lp-guest{display:inline-block;max-width:100%;margin-bottom:8px;padding:10px 20px;border-radius:12px;background:rgba(255,190,137,.12);border:1px solid rgba(255,190,137,.25);font-family:Lora,serif;font-size:18px;font-weight:600;color:${PEACH};overflow-wrap:anywhere}
.tpl-longphung .lp-obtn{position:relative;display:flex;align-items:center;justify-content:center;width:fit-content;margin:0 auto;padding:10px 32px;border:0;border-radius:999px;overflow:hidden;background:${PEACH};color:#710001;font-family:Lora,'Times New Roman',serif;font-size:18px;line-height:28px;font-weight:600;box-shadow:0 4px 14px rgba(255,190,137,.35)}
.tpl-longphung .lp-obtn i{position:absolute;top:0;left:-100%;width:32px;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);animation:lpShine 3s ease-in-out infinite;pointer-events:none}
@keyframes lpShine{0%{left:-100%}50%,100%{left:100%}}
/* bấm mở: chữ Hỷ thu lại rồi thiệp bay lên như bản gốc */
.tpl-longphung .lp-opener.opening .lp-seal{animation:lpSealOut .5s cubic-bezier(.4,0,.2,1) forwards}
.tpl-longphung .lp-opener.opening .lp-ocard{animation:lpAway .8s ease-in .3s forwards}
@keyframes lpSealOut{to{transform:translate(-50%,-50%) scale(1.4);opacity:0}}
@keyframes lpAway{0%{transform:translateY(0) rotate(0);opacity:1}15%{transform:translateY(10px) rotate(.5deg);opacity:1}100%{transform:translateY(-120vh) rotate(-2deg);opacity:0}}
@media (prefers-reduced-motion:reduce){.tpl-longphung .lp-rise,.tpl-longphung .lp-obtn i{display:none}.tpl-longphung .lp-seal{animation:none}}

/* ---- trang bìa: tên – chữ Hỷ – tên, khung ảnh, chim én ---- */
.tpl-longphung .lp-cover{display:flex;flex-direction:column;align-items:center;width:100%;padding:32px 0 16px}
.tpl-longphung .lp-names{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;padding:0 24px}
.tpl-longphung .lp-names p{flex:1;min-width:0;text-align:center;white-space:nowrap;font-family:'Big Caslon','Libre Caslon Text',Baskerville,'Times New Roman',serif;font-size:17px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink)}
.tpl-longphung .lp-hy-top{flex-shrink:0;width:64px}
.tpl-longphung .lp-hy-top.noimg{font-size:44px}
.tpl-longphung .lp-hero{position:relative;width:min(360px,100%);aspect-ratio:360/525;margin-top:28px}
.tpl-longphung .lp-hero svg{display:block;width:100%;height:100%;overflow:visible}
.tpl-longphung .lp-bird{position:absolute;z-index:10;top:-28px;width:88px;pointer-events:none}
.tpl-longphung .lp-bird.l{left:-8px;transform:scaleX(-1)}
.tpl-longphung .lp-bird.r{right:-8px}

/* ---- lời mời ---- */
.tpl-longphung .lp-invite{display:flex;flex-direction:column;align-items:center;gap:24px;padding:40px 20px 16px;text-align:center}
.tpl-longphung .lp-fams{display:grid;grid-template-columns:1fr auto 1fr;column-gap:12px;align-items:center;width:100%}
.tpl-longphung .lp-fams>i{width:1px;height:50px;background:var(--ink);opacity:.3}
.tpl-longphung .lp-fam{display:flex;flex-direction:column;align-items:center;gap:4px;justify-self:center;max-width:160px;min-width:0;font-size:13px}
.tpl-longphung .lp-fam .k{opacity:.6}
.tpl-longphung .lp-fam .n{display:flex;flex-direction:column;gap:4px;font-size:14px;font-weight:600;overflow-wrap:anywhere}
.tpl-longphung .lp-fam .a{margin-top:4px;font-size:11px;line-height:1.25;opacity:.5;overflow-wrap:anywhere}
.tpl-longphung .lp-couple{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}
.tpl-longphung .lp-couple h3{display:flex;align-items:center;justify-content:center;width:100%;margin:0;font-family:'EB Garamond',serif;font-weight:400;font-size:clamp(28px,10.7vw,40px);line-height:50px;white-space:nowrap}
.tpl-longphung .lp-couple .amp{font-family:'EB Garamond',serif;font-size:32px;opacity:.6}
.tpl-longphung .lp-when-block{display:flex;flex-direction:column;align-items:center;gap:12px}
.tpl-longphung .lp-lead{margin:0;font-size:16px;font-weight:300;line-height:1.5;text-transform:uppercase;opacity:.8}
.tpl-longphung .lp-at{font-size:13px;text-transform:uppercase}
.tpl-longphung .lp-date{display:flex;align-items:center;justify-content:center}
.tpl-longphung .lp-date .wd{width:70px;font-size:13px;text-align:right;text-transform:uppercase;opacity:.75}
.tpl-longphung .lp-date i{width:1px;height:20px;margin:0 12px;background:var(--ink);opacity:.33}
.tpl-longphung .lp-date b{font-weight:300;font-size:30px;line-height:1.5}
.tpl-longphung .lp-date .mo{font-size:13px;text-transform:uppercase}
.tpl-longphung .lp-year{font-size:18px}
.tpl-longphung .lp-lunar{font-size:12px;opacity:.6}

/* ---- album vòng 3D ---- */
.tpl-longphung .lp-album{display:flex;flex-direction:column;align-items:center;padding:32px 20px 0}
.tpl-longphung .lp-album .lp-h{margin-bottom:24px}
.tpl-longphung .lp-cf{width:100%;max-width:320px}
.tpl-longphung .lp-cf-stage{position:relative;height:340px;touch-action:pan-y}
.tpl-longphung .lp-cf-row{position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:100%;perspective:1000px}
.tpl-longphung .lp-cf .ph{position:absolute;height:92%;aspect-ratio:2/3;padding:0;border:0;border-radius:16px;overflow:hidden;background:rgba(0,0,0,.2);box-shadow:0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1);transition:all 1.1s ease-in-out;cursor:pointer}
.tpl-longphung .lp-cf .ph[data-o="0"]{box-shadow:0 0 0 2px rgba(255,255,255,.3),0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1)}
.tpl-longphung .lp-cf .ph img{width:100%;height:100%;object-fit:cover}
.tpl-longphung .lp-cf-nav{display:none}
.tpl-longphung .lp-count{margin-top:12px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;line-height:20px;font-variant-numeric:tabular-nums;opacity:.6;text-align:center}

/* ---- tiệc cưới + lịch ---- */
.tpl-longphung .lp-party{display:flex;flex-direction:column;align-items:center;gap:20px;padding:16px 20px 32px;text-align:center}
.tpl-longphung .lp-party-in{display:flex;flex-direction:column;align-items:center;gap:16px;width:100%}
.tpl-longphung .lp-party .lp-lead{font-weight:400}
.tpl-longphung .lp-ptime{font-size:18px;font-weight:600}
.tpl-longphung .lp-party .lp-date .wd{width:auto;font-size:14px}
.tpl-longphung .lp-party .lp-date i{opacity:.4}
.tpl-longphung .lp-party .lp-lunar{font-family:ui-sans-serif,system-ui,sans-serif;opacity:.55}
.tpl-longphung .lp-marks{display:flex;justify-content:center;gap:32px;margin-top:16px}
.tpl-longphung .lp-marks div{display:flex;flex-direction:column;align-items:center}
.tpl-longphung .lp-marks .k{font-size:11px;letter-spacing:.05em;text-transform:uppercase;opacity:.6}
.tpl-longphung .lp-marks .t{margin-top:4px;font-size:18px;font-weight:600}
.tpl-longphung .lp-calfr{position:relative;display:flex;align-items:center;justify-content:center;width:360px;max-width:calc(100vw - 15px);flex-shrink:0;margin-top:8px;aspect-ratio:2100/1608} /* như bản gốc: rộng hơn lề, tràn đều hai bên */
.tpl-longphung .lp-calfr::before{content:"";position:absolute;inset:0;border:24px solid transparent;border-image:${CAL_FRAME} 40 stretch;pointer-events:none}
.tpl-longphung .lp-cal{width:100%;max-width:280px;font-family:ui-sans-serif,system-ui,sans-serif;color:var(--ink)}
.tpl-longphung .lp-cal .hd{padding:10px 0;border-bottom:1px solid color-mix(in srgb,var(--ink) 27%,transparent);font-size:13px;font-weight:600;letter-spacing:.025em}
.tpl-longphung .lp-cal .wk,.tpl-longphung .lp-cal .days{display:grid;grid-template-columns:repeat(7,1fr)}
.tpl-longphung .lp-cal .wk{border-bottom:2px solid var(--ink)}
.tpl-longphung .lp-cal .wk span{padding:6px 0;font-size:10px;font-weight:500;opacity:.6}
.tpl-longphung .lp-cal .days{row-gap:2px;padding:8px 4px}
.tpl-longphung .lp-cal .days span{display:flex;align-items:center;justify-content:center;height:30px;font-size:12px}
.tpl-longphung .lp-cal .on{position:relative;width:26px;height:24px!important;margin:3px auto}
.tpl-longphung .lp-cal .on svg{position:absolute;inset:0;width:100%;height:100%;fill:var(--ink);filter:drop-shadow(0 1px 1px rgba(0,0,0,.05))}
.tpl-longphung .lp-cal .on b{position:relative;font-size:11px;font-weight:700;color:#333}
.tpl-longphung .lp-link{margin-top:8px;font-size:14px;line-height:20px;letter-spacing:.05em;color:var(--ink);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px}
.tpl-longphung .lp-pill{margin-top:16px;padding:8px 20px;border:1.5px solid var(--ink);border-radius:10px;background:transparent;color:var(--ink);font-family:var(--font-body);font-size:14px;line-height:20px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;transition:transform .15s}
.tpl-longphung .lp-pill:hover{transform:scale(1.03)}

/* ---- nơi tổ chức ---- */
.tpl-longphung .lp-venue{display:flex;flex-direction:column;gap:24px;padding:16px 24px 48px;text-align:center}
.tpl-longphung .lp-addr{max-width:384px;margin:16px auto 0;padding-bottom:12px;font-size:14px;line-height:20px;opacity:.8}
.tpl-longphung .lp-venue-b{display:flex;flex-direction:column;align-items:center;gap:16px}
.tpl-longphung .lp-map{width:100%;max-width:600px;height:260px;border-radius:12px;overflow:hidden;background:rgba(0,0,0,.15)}
.tpl-longphung .lp-map iframe{display:block;width:100%;height:100%;border:0}
.tpl-longphung .lp-dir{display:inline-flex;align-items:center;gap:8px;padding:8px 20px;border-radius:999px;font-size:14px;line-height:20px;font-weight:600;color:var(--ink);text-decoration:none;transition:transform .15s}
.tpl-longphung .lp-dir:hover{transform:scale(1.03)}

/* ---- lịch trình: lưới giờ | chấm | tên; vạch dọc nối từ chấm đầu tới chấm cuối ---- */
.tpl-longphung .lp-sched{position:relative}
.tpl-longphung .lp-sched .sec{display:flex;flex-direction:column;gap:24px;margin:40px 0;padding:0 16px}
.tpl-longphung .lp-swallow{position:absolute;z-index:10;left:8%;width:72px;pointer-events:none}
.tpl-longphung .lp-swallow.a{top:32%}
.tpl-longphung .lp-swallow.b{top:62%;transform:scaleX(-1)}
.tpl-longphung .lp-tl{--gy:32px;display:grid;grid-template-columns:minmax(0,1fr) 16px minmax(0,1fr);align-items:center;column-gap:24px;row-gap:var(--gy);width:100%;max-width:460px;margin:0 auto;padding:0;list-style:none}
.tpl-longphung .lp-tl li{display:contents}
.tpl-longphung .lp-tl .t{padding-top:2px;text-align:right;font-size:16px;line-height:1.375;letter-spacing:.025em;font-variant-numeric:tabular-nums}
.tpl-longphung .lp-tl .dot{position:relative;align-self:stretch;display:flex;align-items:center;justify-content:center}
.tpl-longphung .lp-tl .dot::before{content:"";position:absolute;left:50%;width:1px;top:calc(-1 * var(--gy));bottom:calc(-1 * var(--gy));transform:translateX(-50%);background:color-mix(in srgb,var(--ink) 40%,transparent)}
.tpl-longphung .lp-tl li:first-child .dot::before{top:50%}
.tpl-longphung .lp-tl li:last-child .dot::before{bottom:50%}
.tpl-longphung .lp-tl li:only-child .dot::before{display:none}
.tpl-longphung .lp-tl .dot::after{content:"";position:relative;width:10px;height:10px;border-radius:50%;background:var(--ink);box-shadow:0 0 0 2px color-mix(in srgb,var(--ink) 13%,transparent)}
.tpl-longphung .lp-tl .l{padding-top:2px;text-align:start;font-size:17px;line-height:1.375;font-weight:500}
.tpl-longphung .lp-tl small{font-size:.8em;opacity:.8}

/* ---- sổ lưu bút ---- */
.tpl-longphung .lp-wishes{padding:40px 24px 32px}
.tpl-longphung .lp-wishes .lp-h{margin-bottom:24px}
.tpl-longphung .lp-wform{width:100%;margin:24px auto 0}
.tpl-longphung .lp-wform .box{padding:24px;border:1px solid rgba(255,190,137,.4);border-radius:16px;background:rgba(255,255,255,.08);box-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}
.tpl-longphung .lp-wform input,.tpl-longphung .lp-wform textarea{display:block;width:100%;padding:8px 16px;border:1px solid var(--ink);border-radius:6px;background:rgba(255,190,137,.1);color:var(--ink);font:300 16px/24px var(--font-body);outline:none;resize:none}
.tpl-longphung .lp-wform input{margin-bottom:16px}
.tpl-longphung .lp-wform ::placeholder{color:color-mix(in srgb,var(--ink) 55%,transparent)}
.tpl-longphung .lp-wform .row{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:40px;margin-top:16px}
.tpl-longphung .lp-wform .form-msg{flex:1;font-size:12px;text-align:left;color:var(--ink)}
.tpl-longphung .lp-wform button{padding:6px 16px;border:0;border-radius:999px;background:var(--ink);color:var(--accent-ink);font:600 14px/20px var(--font-body);text-transform:uppercase;transition:transform .15s}
.tpl-longphung .lp-wform button:hover{transform:scale(1.05)}
.tpl-longphung .wish-list{display:block;width:100%;max-height:500px;margin:32px auto 0;padding-right:8px;overflow-y:auto;text-align:left}
.tpl-longphung .wish{margin:0 0 12px;padding:16px;border:1px solid rgba(255,190,137,.4);border-radius:12px;background:rgba(255,255,255,.11);box-shadow:0 1px 3px rgba(0,0,0,.1),0 1px 2px -1px rgba(0,0,0,.1);font-size:14px;line-height:20px;color:var(--ink)}
.tpl-longphung .wish b{font-weight:600;font-size:14px;color:var(--ink)}
.tpl-longphung .wish p{margin:8px 0 0;font-size:14px;line-height:1.625}

/* ---- hộp quà ---- */
.tpl-longphung .lp-giftbox{display:flex;flex-direction:column;align-items:center;padding:32px 16px 40px}
.tpl-longphung .lp-giftbox .lp-h{margin-bottom:16px}
.tpl-longphung .lp-gbtn{position:relative;width:260px;height:280px;padding:0;border:0;background:none;outline:none;cursor:pointer}
.tpl-longphung .lp-gbtn .in{position:relative;display:flex;align-items:flex-end;justify-content:center;width:100%;height:100%;padding-bottom:26px}
.tpl-longphung .lp-gbtn .sp{position:absolute;z-index:20;font-style:normal;color:#d4af37;pointer-events:none;animation:lpSpark 2s ease-in-out infinite}
.tpl-longphung .lp-gbtn .sp:nth-child(1){top:8%;left:14%;font-size:22px}
.tpl-longphung .lp-gbtn .sp:nth-child(2){top:18%;right:10%;font-size:16px;animation-delay:.6s}
.tpl-longphung .lp-gbtn .sp:nth-child(3){top:32%;left:5%;font-size:14px;animation-delay:1.2s}
.tpl-longphung .lp-gbtn .sp:nth-child(4){top:26%;right:5%;font-size:14px;animation-delay:1.7s}
.tpl-longphung .lp-gbtn .cf{position:absolute;left:50%;bottom:187px;z-index:0;pointer-events:none}
.tpl-longphung .lp-gbtn .cf i{position:absolute;left:0;top:0;width:10px;height:5px;margin:-2.5px 0 0 -5px;border-radius:2px;opacity:0}
.tpl-longphung .lp-gbtn .bob{position:relative;display:block;width:200px;height:220px;animation:lpBob 3s ease-in-out infinite}
.tpl-longphung .lp-gbtn .sh{position:absolute;left:50%;bottom:-8px;z-index:0;width:144px;height:12px;margin-left:-72px;border-radius:50%;background:rgba(0,0,0,.45);filter:blur(4px);animation:lpShadow 3s ease-in-out infinite}
.tpl-longphung .lp-gbtn .mini{position:absolute;max-width:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.25))}
.tpl-longphung .lp-gbtn .box{position:absolute;left:50%;bottom:0;z-index:2;width:170px;max-height:220px;margin-left:-85px;object-fit:contain;filter:drop-shadow(0 10px 18px rgba(0,0,0,.25));transform-origin:50% 100%;transition:transform .3s}
.tpl-longphung .lp-gbtn:hover .box,.tpl-longphung .lp-gbtn:focus-visible .box{animation:lpPop .7s cubic-bezier(.34,1.56,.64,1) forwards}
.tpl-longphung .lp-gbtn:hover .mini,.tpl-longphung .lp-gbtn:focus-visible .mini{animation:lpFly 1.6s ease-in-out infinite}
.tpl-longphung .lp-gbtn:hover .m2,.tpl-longphung .lp-gbtn:hover .m4,.tpl-longphung .lp-gbtn:hover .m6{animation-duration:1.8s;animation-delay:.15s;--fx:8px}
.tpl-longphung .lp-gbtn:hover .cf i,.tpl-longphung .lp-gbtn:focus-visible .cf i{animation:lpConf 1s ease-out infinite}
${[[-55, -130, 540, 0.05, 1], [46, -150, -460, 0.12, 1.1], [-12, -160, 620, 0.2, 0.95], [28, -115, -340, 0.3, 1.15], [-34, -105, 320, 0.35, 1.05], [58, -88, -240, 0.4, 1.2], [8, -170, 420, 0.5, 0.9], [-46, -78, -200, 0.55, 1.1]].map(([x, y, r, de, du], i) => `.tpl-longphung .lp-gbtn .cf i:nth-child(${i + 1}){--x:${x}px;--y:${y}px;--r:${r}deg;animation-delay:${de}s!important;animation-duration:${du}s!important}`).join('\n')}
.tpl-longphung .lp-gbtn .hint{position:absolute;left:50%;bottom:0;transform:translateX(-50%);white-space:nowrap;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;line-height:16px;font-weight:500;color:var(--ink);animation:lpHint 2s ease-in-out infinite}
@keyframes lpBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes lpShadow{0%,100%{transform:scaleX(1);opacity:.3}50%{transform:scaleX(.9);opacity:.18}}
@keyframes lpSpark{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1.15)}}
@keyframes lpHint{0%,100%{opacity:.45}50%{opacity:1}}
@keyframes lpPop{0%{transform:translateY(0) scale(1) rotate(0)}45%{transform:translateY(-14px) scale(1.08) rotate(-3deg)}100%{transform:translateY(-8px) scale(1.05) rotate(0)}}
@keyframes lpConf{0%{transform:translate(0,0) rotate(0);opacity:0}15%{opacity:1}100%{transform:translate(var(--x),var(--y)) rotate(var(--r));opacity:0}}
@keyframes lpFly{0%{translate:0 0;opacity:1}55%{translate:var(--fx,-6px) -30px;opacity:1}80%{translate:calc(var(--fx,-6px) * 2.2) -60px;opacity:0}81%{translate:0 0;opacity:0}100%{translate:0 0;opacity:1}}
@media (prefers-reduced-motion:reduce){.tpl-longphung .lp-gbtn *{animation:none!important}}

/* ---- hộp thoại (xác nhận tham dự, quà mừng) ---- */
.tpl-longphung .lp-dlg{width:min(448px,calc(100% - 32px));max-height:85vh;padding:0;border:0;border-radius:16px;background:#fff;color:#111827;box-shadow:0 25px 50px -12px rgba(0,0,0,.25);overflow:auto}
.tpl-longphung .lp-dlg::backdrop{background:rgba(0,0,0,.5)}
.tpl-longphung .lp-x{position:absolute;top:16px;right:16px;z-index:1;width:32px;height:32px;border:0;border-radius:50%;background:#f3f4f6;color:#6b7280;font-size:20px;line-height:1}
.tpl-longphung .lp-rsvp .s-rsvp{padding:24px;text-align:left}
.tpl-longphung .lp-rsvp .lp-h{margin:0 40px 4px 0;font-family:system-ui,sans-serif;font-size:24px;font-weight:700;letter-spacing:0;text-transform:none;text-align:left;color:#111827}
.tpl-longphung .lp-rsvp .sec-sub{margin:0 0 24px;font-family:system-ui,sans-serif;color:#6b7280}
.tpl-longphung .lp-rsvp .form{gap:16px;padding:0;border:0;background:none;font-family:system-ui,sans-serif}
.tpl-longphung .lp-rsvp .form label{font-size:14px;font-weight:500;color:#374151}
.tpl-longphung .lp-rsvp .form input:not([type=radio]),.tpl-longphung .lp-rsvp .form select{padding:12px 16px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;font-size:16px;color:#111827}
.tpl-longphung .lp-rsvp .choice label{padding:10px 12px;border:2px solid #e5e7eb;border-radius:12px;background:rgba(249,250,251,.5);font-size:14px;color:#374151}
.tpl-longphung .lp-rsvp .choice label:has(input:checked){border-color:#7a0014}
.tpl-longphung .lp-rsvp .choice input{accent-color:#7a0014}
.tpl-longphung .lp-rsvp .btn{padding:14px;border:0;border-radius:12px;background:#7a0014;color:${PEACH};font-size:14px;font-weight:600;box-shadow:0 10px 15px -3px rgba(0,0,0,.1)}
.tpl-longphung .lp-rsvp .form-msg{color:#7a0014}
.tpl-longphung .lp-giftdlg{width:min(512px,calc(100% - 32px));background:var(--lp-dlg)}
.tpl-longphung .lp-dlg-head{position:relative;padding:24px 24px 16px;background:${PEACH};text-align:center}
.tpl-longphung .lp-dlg-head h2{margin:0;font:700 16px/1.5 'Times New Roman',serif;letter-spacing:.05em;text-transform:uppercase;color:#fff;text-shadow:1px 1px 2px rgba(0,0,0,.2)}
.tpl-longphung .lp-dlg-head .lp-x{top:12px;right:12px;background:rgba(0,0,0,.85);color:#fff}
.tpl-longphung .lp-giftdlg .gifts{display:flex;flex-direction:column;align-items:center;gap:16px;padding:16px}
.tpl-longphung .lp-giftdlg .gift{flex:1;max-width:180px;padding:0;border:0;background:none;text-align:center;color:${PEACH};font-family:system-ui,sans-serif}
.tpl-longphung .lp-giftdlg .gift-who{min-height:2rem;margin:0 0 8px;font:500 12px/1.4 system-ui,sans-serif;color:${PEACH}}
.tpl-longphung .lp-giftdlg .gift img{width:128px;height:128px;margin:0 auto 8px;padding:8px;border:2px solid rgba(255,190,137,.125);border-radius:12px;background:#fff;box-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1)}
.tpl-longphung .lp-giftdlg .gift p{margin:2px 0;font-size:10px}
.tpl-longphung .lp-giftdlg .gift-bank{font-weight:400}
.tpl-longphung .lp-giftdlg .gift-acc{gap:6px;font-family:ui-monospace,monospace;letter-spacing:0}
.tpl-longphung .lp-giftdlg .gift-holder{font-weight:600;color:${PEACH}}
.tpl-longphung .lp-giftdlg .copy{padding:4px 8px;border:0;border-radius:999px;background:rgba(255,190,137,.082);color:${PEACH};font-size:10px;font-weight:500}
@media (max-width:639px){.tpl-longphung .lp-giftdlg{margin:auto auto 0;width:100%;max-width:none;border-radius:16px 16px 0 0}}

.tpl-longphung .lp-thanks{display:flex;flex-direction:column;align-items:center;padding:32px 16px}
.tpl-longphung .lp-thanks p{white-space:pre-line;font-size:13px;line-height:1.5;text-align:center;color:var(--ink)}
.tpl-longphung .s-story{padding:32px 24px;font-size:16px}
.tpl-longphung .credit{padding:12px 0 16px;font-size:12px;opacity:.5;color:var(--ink)}
.tpl-longphung .music-btn{border-color:rgba(255,190,137,.4);background:#5a000e;color:${PEACH}}

@media (min-width:640px){
  .tpl-longphung .lp-ocard{width:340px}
  .tpl-longphung .lp-onames{font-size:36px}
  .tpl-longphung .lp-onames i{font-size:20px}
  .tpl-longphung .lp-obtn{font-weight:500}
  .tpl-longphung .lp-wform input,.tpl-longphung .lp-wform textarea{font-size:14px;line-height:20px}
  .tpl-longphung .lp-giftdlg{width:min(576px,calc(100% - 32px))}
  .tpl-longphung .lp-giftdlg .gifts{flex-direction:row;flex-wrap:wrap;align-items:flex-start;justify-content:center;padding:24px}
  .tpl-longphung .lp-giftdlg .gift img{width:160px;height:160px}
  .tpl-longphung .lp-giftdlg .gift{max-width:none}
}
/* màn hình rộng: cột 900px có viền mảnh, các khối lớn hơn như bản gốc */
@media (min-width:768px){
  .tpl-longphung .card{max-width:900px;border:1px solid rgba(255,190,137,.2)}
  .tpl-longphung .lp-h{font-size:24px}
  .tpl-longphung .lp-bg>div{gap:50px}
  .tpl-longphung .lp-ocard{width:520px}
  .tpl-longphung .lp-obg img{width:320px}
  .tpl-longphung .lp-obg .ph{top:0;left:-30px}
  .tpl-longphung .lp-obg .ro{bottom:0;right:-30px}
  .tpl-longphung .lp-obody{padding:96px 24px 32px}
  .tpl-longphung .lp-cover{padding-top:64px}
  .tpl-longphung .lp-names{max-width:480px;padding:0 40px}
  .tpl-longphung .lp-names p{font-size:22px}
  .tpl-longphung .lp-hy-top{width:82px}
  .tpl-longphung .lp-hy-top.noimg{font-size:56px}
  .tpl-longphung .lp-hero{width:450px;margin-top:36px}
  .tpl-longphung .lp-bird{width:110px}
  .tpl-longphung .lp-invite{gap:32px;padding:48px 32px 16px}
  .tpl-longphung .lp-fams{column-gap:32px}
  .tpl-longphung .lp-fam{max-width:280px;font-size:14px}
  .tpl-longphung .lp-fam .n{font-size:15px}
  .tpl-longphung .lp-fam .a{font-size:12px}
  .tpl-longphung .lp-couple h3{font-size:64px;line-height:100px}
  .tpl-longphung .lp-couple .amp{font-size:40px}
  .tpl-longphung .lp-lead{font-size:20px}
  .tpl-longphung .lp-at{font-size:14px}
  .tpl-longphung .lp-date .wd{width:85px;font-size:14px}
  .tpl-longphung .lp-date b{font-size:36px}
  .tpl-longphung .lp-date .mo{font-size:14px}
  .tpl-longphung .lp-year{font-size:20px}
  .tpl-longphung .lp-lunar{font-size:13px}
  .tpl-longphung .lp-album{padding:40px 32px 0}
  .tpl-longphung .lp-cf{max-width:550px}
  .tpl-longphung .lp-cf-stage{height:520px}
  .tpl-longphung .lp-cf-nav{position:absolute;top:50%;z-index:200;display:flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.6);color:#1f2937;transform:translateY(-50%)}
  .tpl-longphung .lp-cf-nav:hover{background:#fff}
  .tpl-longphung .lp-cf-nav.prev{left:0}
  .tpl-longphung .lp-cf-nav.next{right:0}
  .tpl-longphung .lp-party{gap:24px;padding:16px 32px 32px}
  .tpl-longphung .lp-party .lp-date .wd{font-size:15px}
  .tpl-longphung .lp-ptime,.tpl-longphung .lp-marks .t{font-size:20px}
  .tpl-longphung .lp-calfr{width:420px}
  .tpl-longphung .lp-cal{max-width:310px}
  .tpl-longphung .lp-cal .hd{font-size:14px}
  .tpl-longphung .lp-cal .wk span{font-size:11px}
  .tpl-longphung .lp-cal .days span{height:34px;font-size:13px}
  .tpl-longphung .lp-cal .on{width:30px;height:28px!important}
  .tpl-longphung .lp-cal .on b{font-size:12px}
  .tpl-longphung .lp-pill{font-size:16px;line-height:24px}
  .tpl-longphung .lp-venue{gap:32px;padding:16px 40px 64px}
  .tpl-longphung .lp-addr{max-width:600px;font-size:16px;line-height:24px}
  .tpl-longphung .lp-venue-b{gap:20px}
  .tpl-longphung .lp-map{height:360px}
  .tpl-longphung .lp-dir{font-size:16px;line-height:24px}
  .tpl-longphung .lp-sched .sec{gap:32px;margin:48px 0}
  .tpl-longphung .lp-swallow{left:25%;width:90px}
  .tpl-longphung .lp-tl{--gy:40px;column-gap:32px}
  .tpl-longphung .lp-tl .t{font-size:17px}
  .tpl-longphung .lp-tl .l{font-size:19px}
  .tpl-longphung .lp-wishes{padding:48px 40px 40px}
  .tpl-longphung .lp-wform,.tpl-longphung .wish-list{max-width:600px}
  .tpl-longphung .lp-giftbox{padding:32px 32px 56px}
  .tpl-longphung .lp-dlg-head h2{font-size:24px}
  .tpl-longphung .lp-thanks{padding:32px 32px 56px}
  .tpl-longphung .lp-thanks p{max-width:560px;font-size:15px}
}
@media (min-width:1024px){
  .tpl-longphung .lp-bg>div{gap:80px}
  .tpl-longphung .lp-ocard{width:600px}
  .tpl-longphung .lp-cover{padding-top:80px}
  .tpl-longphung .lp-names{max-width:540px}
  .tpl-longphung .lp-hero{width:500px}
  .tpl-longphung .lp-bird{top:-42px;width:128px}
}
`,
};
