// Mẫu "Thanh Diệp" — xanh lá thanh lịch: nền trắng, khối xanh rừng, lá màu nước trôi theo cuộn trang, chữ song ngữ Việt / Anh.
// Kích thước lấy theo bản gốc (Tailwind): số đầu cho điện thoại, khối @media (min-width:768px / 1024px) cho màn rộng.
const { esc } = require('../lib/util');
const { inviteWord } = require('../lib/carddata');

const A = (n) => `/demo/thanhdiep-${n}.webp`; // ảnh trang trí của mẫu

const base = {
  '--font-title': "'EB Garamond',Georgia,serif",
  '--font-script': "'EB Garamond',Georgia,serif",
  '--font-body': "Baskerville,'Libre Baskerville','Times New Roman',serif", // Baskerville có sẵn trên máy Apple như bản gốc
};

const WD_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// dòng tiếng Anh dưới tên các mốc thường gặp (tên khác thì chỉ hiện tiếng Việt)
const EV_EN = [
  [/đón khách/i, 'Welcome'], [/khai tiệc/i, 'Reception'], [/cắt bánh|rót rượu|nâng ly/i, 'Toasts & Cake'],
  [/món chính|dùng bữa|nhập tiệc/i, 'Main Course'], [/kết thúc|tiễn khách/i, 'Farewell'], [/nghi thức/i, 'Ceremony'],
  [/thành hôn/i, 'Wedding Ceremony'], [/vu quy/i, 'Bride Farewell Ceremony'], [/tiệc cưới/i, 'Wedding Reception'],
];
const evEn = (name) => (EV_EN.find(([re]) => re.test(name || '')) || [])[1] || '';

// chữ song ngữ: dòng Việt + dòng Anh nhỏ hơn, mờ hơn (như bản gốc)
const bi = (vn, en, cls = '') => `<span class="td-bi${cls ? ' ' + cls : ''}"><span>${vn}</span>${en ? `<span class="en">${en}</span>` : ''}</span>`;

const evList = (d) => d.events.filter((e) => e.name || e.place);
// sự kiện chính của tiệc (khối "Thông tin tiệc cưới", bản đồ)
function partyEvent(d) {
  const evs = evList(d);
  return evs.find((e) => /khai tiệc|tiệc cưới/i.test(e.name)) || evs.find((e) => /tiệc/i.test(e.name)) || evs[evs.length - 1] || null;
}
// lễ cưới (khối "Thông tin lễ cưới"): mốc đầu tiên khác buổi tiệc mà có nơi tổ chức
function ceremonyEvent(d) {
  const party = partyEvent(d);
  const evs = evList(d);
  return evs.find((e) => e !== party && e.place) || evs.find((e) => e !== party && /lễ/i.test(e.name)) || null;
}

// thứ | ngày | tháng — dùng ở cả lễ cưới và tiệc cưới (tiệc cưới dùng vạch thay cho dấu "|")
function dateRow(ctx, bar) {
  const p = ctx.dparts;
  const wd = new Date(Date.UTC(+p.y, +p.m - 1, +p.d)).getUTCDay();
  const sep = bar ? '<i class="td-bar"></i>' : '<i class="td-pipe">|</i>';
  return `<div class="td-daterow">${bi(esc(ctx.weekday).toUpperCase(), WD_EN[wd].toUpperCase(), 'wd')}${sep}<b>${p.d}</b>${sep}${bi(`THÁNG ${p.m}`, MON_EN[+p.m - 1].toUpperCase(), 'mo')}</div>
      <div class="td-year">${p.y}</div>
      <div class="td-lunar">(${esc(ctx.lunar.replace(/^Nhằm /i, 'Tức '))})</div>`;
}

// lá rơi trên màn mở thiệp: vị trí, màu, cỡ, độ lắc, thời gian, độ trễ — chép từ bản gốc
const FALL = [
  [24.4, '#4E6439', 21.1, 17.4, 18.7, -7.9], [11.1, '#90EE90', 22.8, 19.7, 21.6, -19.7], [87.4, '#90EE90', 12.3, -17.6, 22.8, -8.1],
  [94.3, '#98FB98', 10.7, 20.8, 22.3, -11.0], [62.2, '#BDCDC1', 23.8, 7.7, 22.4, -6.2], [83.4, '#4E6439', 16.0, 2.0, 23.9, -13.6],
  [62.4, '#BDCDC1', 22.1, -11.8, 25.7, -11.6], [89.8, '#98FB98', 13.8, 18.6, 18.3, -13.0], [27.4, '#90EE90', 10.7, 7.7, 24.3, -1.8],
  [71.6, '#BDCDC1', 21.8, 10.2, 18.4, -13.8], [55.5, '#98FB98', 11.4, -8.3, 18.2, -10.6], [38.2, '#90EE90', 12.5, -8.3, 20.8, -16.7],
];
const LEAF = '<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/></svg>';

// lá ở góc màn mở thiệp: ba dải (gốc, giữa, ngọn) lồng nhau, mỗi dải lắc một biên độ riêng như bản gốc
const oleaf = (pos, img) => `<span class="td-oleaf ${pos}" aria-hidden="true"><img class="s1" src="${A(img)}" alt=""><span class="w2"><img class="s2" src="${A(img)}" alt=""><span class="w3"><img class="s3" src="${A(img)}" alt=""></span></span></span>`;

// lá màu nước, trôi theo cuộn trang bằng --td-sy (đặt ở trang bìa)
const leaf = (cls, img) => `<span class="td-leaf ${cls}" aria-hidden="true"><img src="${A(img)}" alt=""></span>`;

module.exports = {
  id: 'thanhdiep',
  name: 'Thanh Diệp',
  group: 'hoa',
  badge: 'Mới', // nhãn trên thẻ ở bộ sưu tập trang chủ
  desc: 'Xanh lá thanh lịch: nền trắng, khối xanh rừng, lá màu nước và chữ song ngữ Việt – Anh',
  fonts: 'https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500&family=Lora:wght@300;400;500;600&family=Montserrat:wght@400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap',
  palettes: [
    { id: 'xanh-la', name: 'Xanh lá', swatch: ['#ffffff', '#4E6439'], vars: { ...base, '--page': '#ffffff', '--bg': '#ffffff', '--paper': '#ffffff', '--ink': '#4E6439', '--muted': '#7d8c70', '--accent': '#4E6439', '--accent-ink': '#ffffff', '--gold': '#4E6439', '--line': '#d8dfd2', '--td-dark': '#23381E', '--td-dark2': '#1f3219', '--td-dark3': '#1a2b15', '--td-seal': '#30461b' } },
    { id: 'nau-dat', name: 'Nâu đất', swatch: ['#ffffff', '#6b4f3a'], vars: { ...base, '--page': '#ffffff', '--bg': '#ffffff', '--paper': '#ffffff', '--ink': '#6b4f3a', '--muted': '#8f7a68', '--accent': '#6b4f3a', '--accent-ink': '#ffffff', '--gold': '#6b4f3a', '--line': '#e2d8cf', '--td-dark': '#3b2a1e', '--td-dark2': '#33241a', '--td-dark3': '#2a1d14', '--td-seal': '#4a3424' } },
  ],
  // dữ liệu xem thử theo bản gốc (tên & bố mẹ giữ của sample() theo quy ước chung): lễ thành hôn tại tư gia, tiệc tối ở Metropole
  demo: {
    date: '2026-05-11',
    time: '18:00',
    message: 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!',
    cover: '/demo/thanhdiep-p1.jpg',
    photos: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `/demo/thanhdiep-p${n}.jpg`),
    story: '',
    events: [
      { name: 'Lễ Thành Hôn', date: '2026-05-11', time: '09:00', place: 'Tư gia', address: '', mapUrl: '' },
      { name: 'Đón khách', date: '2026-05-11', time: '17:30', place: '', address: '', mapUrl: '' },
      { name: 'Khai tiệc', date: '2026-05-11', time: '18:30', place: 'Metropole Wedding Center', address: '216 Lý Chính Thắng, Phường 9, Quận 3, Thành phố Hồ Chí Minh', mapUrl: '' },
      { name: 'Rót rượu, cắt bánh', date: '2026-05-11', time: '18:45', place: '', address: '', mapUrl: '' },
      { name: 'Phục vụ món chính', date: '2026-05-11', time: '19:00', place: '', address: '', mapUrl: '' },
      { name: 'Kết thúc tiệc', date: '2026-05-11', time: '21:00', place: '', address: '', mapUrl: '' },
    ],
  },
  // lễ cưới + tiệc cưới + lịch nằm chung một khối xanh (invite); xác nhận tham dự mở trong hộp thoại
  layout: ['gallery', 'story', 'invite', 'events', 'wishes', 'gift', 'thanks'],

  title(text, sub) {
    return `<h2 class="td-h">${esc(text)}</h2>${sub ? `<p class="sec-sub">${esc(sub)}</p>` : ''}`;
  },

  opener(ctx) {
    const p = ctx.dparts;
    return `
<div class="opener td-opener" id="opener">
  <div class="td-fall" aria-hidden="true">${FALL.map(([l, c, f, s, dur, del]) => `<span style="left:${l}%;color:${c};font-size:${f}px;--sway:${s}px;animation-duration:${dur}s;animation-delay:${del}s">${LEAF}</span>`).join('')}</div>
  <div class="td-ocard">
    <span class="td-seal" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></span>
    <div class="td-opaper">
      ${oleaf('tr', 'la2')}
      ${oleaf('bl', 'la1')}
    </div>
    <div class="td-obody">
      <h1 class="td-onames"><span>${esc(ctx.g)}</span><i>&amp;</i><span>${esc(ctx.b)}</span></h1>
      <p class="td-rule" aria-hidden="true"><span></span><b>❦</b><span></span></p>
      ${p ? `<p class="td-odate">${bi(`${+p.d} tháng ${+p.m}, ${p.y}`, `${MON_EN[+p.m - 1]} ${+p.d}, ${p.y}`)}</p>` : ''}
      <p class="td-oto">${esc(inviteWord(ctx.d, 'Thân Mời / Cordially Invites'))}</p>
      ${ctx.guest ? `<div class="td-oguest"><h2>${esc(ctx.guest.name)}</h2></div>` : ''}
      <p class="td-ojoin">${bi('đến dự buổi tiệc chung vui cùng gia đình', 'to celebrate with our family')}</p>
      <button class="td-obtn" id="openBtn"><span>Mở thiệp / Open</span><i></i></button>
    </div>
  </div>
</div>`;
  },

  cover(ctx) {
    const { d } = ctx;
    const groomPh = d.cover || d.photos[0] || '';
    const bridePh = (d.cover ? d.photos[0] : d.photos[1]) || '';
    const pic = (u) => `<div class="td-pic"><div>${u ? `<img src="${esc(u)}" alt="">` : ''}</div></div>`;
    return `
<header class="td-cover">
  ${leaf('td-cv-la2', 'la2')}
  ${leaf('td-cv-la1', 'la1')}
  <div class="td-story"><h1>THE STORY of LOVE</h1></div>
  <div class="td-pair">
    <div class="td-person groom">${pic(groomPh)}<div class="td-pname"><span class="r">Chú Rể / Groom</span><span class="n">${esc(ctx.g)}</span></div></div>
    <div class="td-person bride">${pic(bridePh)}<div class="td-pname"><span class="r">Cô Dâu / Bride</span><span class="n">${esc(ctx.b)}</span></div></div>
  </div>
  ${leaf('td-cv-la3', 'la3')}
  <script>(function(){var r=document.documentElement,q=0;function f(){q=0;r.style.setProperty('--td-sy',scrollY)}addEventListener('scroll',function(){if(!q){q=1;requestAnimationFrame(f)}},{passive:true});f()})()</script>
</header>`;
  },

  sections: {
    // album 3D: ảnh giữa thẳng, các ảnh hai bên lùi sâu và xoay theo trục dọc; tự chạy, vuốt / mũi tên để chuyển
    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      return `
  <section class="sec td-album">
    <h2 class="td-h">${bi('Album Ảnh', 'Photo Gallery')}</h2>
    <div class="td-cf">
      <div class="td-cf-stage">
        <button class="td-cf-nav prev" type="button" aria-label="Ảnh trước"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="2" d="M15 18l-6-6 6-6"/></svg></button>
        <button class="td-cf-nav next" type="button" aria-label="Ảnh sau"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="2" d="M9 18l6-6-6-6"/></svg></button>
        <div class="td-cf-row">
          ${ph.map((u, i) => `<button class="ph" data-i="${i}" aria-label="Xem ảnh ${i + 1}"><img loading="lazy" src="${esc(u)}" alt=""></button>`).join('')}
        </div>
      </div>
      <p class="td-count"><span>1</span> / ${ph.length}</p>
    </div>
    <script>(function(){
      var s=document.currentScript.parentNode,st=s.querySelector('.td-cf-stage'),cs=[].slice.call(st.querySelectorAll('.ph')),ct=s.querySelector('.td-count span'),k=0,n=cs.length,t;
      var SC=[1,.85,.7],OP=[1,.75,.5,.3];
      function go(i){k=(i+n)%n;ct.textContent=k+1;cs.forEach(function(c,j){var o=j-k;if(o>n/2)o-=n;if(o<-n/2)o+=n;var a=Math.abs(o);
        c.style.transform='translateX('+o*60+'%) translateZ('+(-150*a)+'px) rotateY('+o*45+'deg) scale('+SC[Math.min(a,2)]+')';
        c.style.opacity=OP[Math.min(a,3)];c.style.zIndex=100-a;c.classList.toggle('on',!a);});}
      function auto(){clearInterval(t);if(!document.body.classList.contains('is-edit'))t=setInterval(function(){go(k+1)},4000);}
      // chạm ảnh bên cạnh thì chuyển tới ảnh đó, chỉ ảnh giữa mới mở xem lớn
      st.addEventListener('click',function(e){var c=e.target.closest('.ph');if(c&&!c.classList.contains('on')){e.stopPropagation();go(cs.indexOf(c));auto();}},true);
      s.querySelector('.prev').onclick=function(){go(k-1);auto()};s.querySelector('.next').onclick=function(){go(k+1);auto()};
      var x0=null;st.addEventListener('pointerdown',function(e){x0=e.clientX});
      st.addEventListener('pointerup',function(e){if(x0!==null&&Math.abs(e.clientX-x0)>40){go(k+(e.clientX<x0?1:-1));auto();}x0=null});
      go(0);auto();
    })()</script>
  </section>`;
    },

    // khối xanh: thông tin lễ cưới (bố mẹ, tên đầy đủ, nơi & giờ làm lễ) + thông tin tiệc cưới (giờ, ngày, đón khách / khai tiệc, lịch tháng)
    invite(ctx, opts, h) {
      const { d, dparts: p } = ctx;
      const strip = (s) => esc(s.replace(/^(Ông|Bà)\s+/i, ''));
      const fam = (x) => `<div class="td-fam"><span class="k">Ông Bà / Mr. &amp; Mrs.</span><span class="n">${x.father ? `<span>${strip(x.father)}</span>` : ''}${x.mother ? `<span>${strip(x.mother)}</span>` : ''}</span>${x.address ? `<span class="a">${esc(x.address)}</span>` : ''}</div>`;
      const hasFam = d.groom.father || d.groom.mother || d.bride.father || d.bride.mother;
      const party = partyEvent(d) || {};
      const cer = ceremonyEvent(d);
      const cerTime = (cer && cer.time) || d.time;
      const evs = evList(d);
      const at = evs.indexOf(party);
      const marks = at > 0 && evs[at - 1].time && (!evs[at - 1].date || evs[at - 1].date === ctx.date) ? [evs[at - 1], party] : [];
      const ptime = party.time || d.time;
      const grid = p && d.show.calendar ? h.calGrid(ctx, `<p class="td-calh">Tháng ${+p.m} / ${p.y}</p>`) : '';
      const cal = p ? h.calendarLink(`Đám cưới ${ctx.g} & ${ctx.b}`, ctx.date, ptime, [party.place, party.address].filter(Boolean).join(', ')) : '';
      const rsvp = d.show.rsvp ? h.rsvp(ctx).replace('sec s-rsvp reveal', 's-rsvp') : '';
      const home = cer && /tư gia/i.test(cer.place);
      return `
  <section class="sec td-dark td-info">
    ${leaf('td-dk-la3', 'la3')}
    ${leaf('td-dk-la4', 'la4')}
    <h2 class="td-h">THÔNG TIN LỄ CƯỚI / CEREMONY INFO</h2>
    ${hasFam ? `<div class="td-fams">${fam(d.groom)}${fam(d.bride)}</div>` : ''}
    <div class="td-lead">${bi('TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI', 'WE JOYFULLY ANNOUNCE\nTHE WEDDING OF OUR CHILDREN')}</div>
    <div class="td-couple">
      <h3>${esc(d.groom.fullName || d.groom.name)}</h3>
      <div class="td-role">Chú Rể / Groom</div>
      <div class="td-amp">&amp;</div>
      <h3>${esc(d.bride.fullName || d.bride.name)}</h3>
      <div class="td-role">Cô Dâu / Bride</div>
    </div>
    ${p ? `<div class="td-when">
      <div class="td-at">
        ${cer && cer.place ? `<p class="td-place">${bi(`${esc((cer.name || 'Lễ thành hôn').toUpperCase())} ĐƯỢC CỬ HÀNH TẠI\n${esc(cer.place.toUpperCase())}`, `WEDDING CEREMONY AT\n${home ? 'FAMILY HOME' : esc(cer.place.toUpperCase())}`)}</p>` : ''}
        ${cerTime ? '<p class="td-atk">VÀO LÚC / AT</p>' : ''}
      </div>
      ${cerTime ? `<div class="td-time">${esc(cerTime)}</div>` : ''}
      ${dateRow(ctx)}
    </div>
    <h2 class="td-h">THÔNG TIN TIỆC CƯỚI / RECEPTION INFO</h2>
    <div class="td-when td-party">
      <h3 class="td-lead2">${bi('Tiệc cưới sẽ diễn ra vào lúc:', 'The reception will take place at')}</h3>
      ${ptime ? `<div class="td-time">${esc(ptime)}</div>` : ''}
      ${dateRow(ctx, true)}
      ${marks.length ? `<div class="td-marks">${marks.map((e) => `<div><span class="k">${bi(esc(e.name), evEn(e.name) === 'Welcome' ? 'Guest Reception' : evEn(e.name))}</span><span class="t">${esc(e.time)}</span></div>`).join('')}</div>` : ''}
      ${grid ? `<div class="td-calwrap">${grid}</div>` : ''}
      <a class="td-link" target="_blank" rel="noopener" href="${esc(cal)}">Thêm vào lịch / Add to Calendar</a>
    </div>` : ''}
    ${rsvp ? `<div class="td-rsvpbtn"><button type="button" onclick="document.getElementById('tdRsvp').showModal()">XÁC NHẬN / CONFIRM</button></div>` : ''}
  </section>
  ${rsvp ? `<dialog class="td-dlg td-rsvp" id="tdRsvp"><button class="td-x" type="button" aria-label="Đóng" onclick="this.closest('dialog').close()">×</button>${rsvp}</dialog>` : ''}`;
    },

    // khối xanh thứ hai: nơi tổ chức tiệc (bản đồ + chỉ đường) và lịch trình ngày cưới dạng dòng thời gian
    events(ctx, opts, h) {
      const all = evList(ctx.d);
      if (!all.length) return '';
      const party = partyEvent(ctx.d);
      const cer = ceremonyEvent(ctx.d);
      // dòng thời gian chỉ gồm các mốc của buổi tiệc (lễ cưới đã có ở khối trên)
      const evs = all.length > 1 ? all.filter((e) => e !== cer) : all;
      const where = party ? [party.place, party.address].filter(Boolean).join(', ') : '';
      const dir = party && (party.mapUrl || (party.address ? h.mapSearch(where) : ''));
      return `
  <div class="td-dark td-dark2">
    ${where ? `
    <section class="sec td-venue reveal">
      <div class="td-vhead">
        <h3 class="td-h3">${bi('Tiệc cưới sẽ tổ chức tại', 'Wedding Reception Venue')}</h3>
        <p class="td-addr">${esc(where)}</p>
      </div>
      <div class="td-vmap">
        ${party.address ? `<iframe loading="lazy" title="Bản đồ" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(where)}&amp;output=embed"></iframe>` : ''}
        ${dir ? `<a class="td-dir" target="_blank" rel="noopener" href="${esc(dir)}"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M3 11l18-8-8 18-2-8-8-2z"/></svg><span>Chỉ đường</span></a>` : ''}
      </div>
    </section>` : ''}
    <section class="sec td-sched reveal">
      <h3 class="td-h3 td-h20">${bi('LỊCH TRÌNH NGÀY CƯỚI', 'WEDDING DAY SCHEDULE')}</h3>
      <ol class="td-tl">
        ${evs.map((e) => {
          const p = h.parts(e.date);
          const other = p && e.date !== ctx.date;
          return `<li><span class="t">${esc(e.time) || '—'}</span><span class="dot"></span><span class="l">${bi(`${esc(e.name)}${other ? ` <small>${p.d}/${p.m}</small>` : ''}`, evEn(e.name))}</span></li>`;
        }).join('')}
      </ol>
    </section>
  </div>`;
    },

    // sổ lưu bút: khung kính mờ viền xanh; ô nhập dùng chữ gợi ý song ngữ (giữ id/tên trường cho card.js)
    wishes(ctx, opts) {
      if (!ctx.d.show.wishes) return '';
      const list = opts.wishes || [];
      return `
  <div class="td-white">
    ${leaf('td-wh-la2', 'la2')}
    ${leaf('td-wh-la1', 'la1')}
    <section class="sec s-wishes reveal">
      <h2 class="td-h">Sổ lưu bút / Guestbook</h2>
      <form class="td-wform" id="wishForm">
        <div class="td-wbox">
          <input name="name" required maxlength="60" placeholder="Nhập tên của bạn* / Enter your name*" value="${ctx.guest ? esc(ctx.guest.name) : ''}" aria-label="Tên">
          <textarea name="message" required maxlength="500" rows="4" placeholder="Nhập lời chúc của bạn* / Enter your wishes*" aria-label="Lời chúc"></textarea>
          <div class="td-wrow"><p class="form-msg" role="status"></p><button type="submit">GỬI LỜI CHÚC / SEND WISH</button></div>
        </div>
      </form>
      <div class="wish-list" id="wishList">
        ${list.map((w) => `<div class="wish"><b>${esc(w.name)}</b><p>${esc(w.message)}</p></div>`).join('')}
      </div>
    </section>
  </div>`;
    },

    // hộp quà mừng: hộp quà lá xanh nhấp nhô, chạm để mở hộp thoại có mã QR của hai bên
    gift(ctx, opts, h) {
      if (!ctx.d.show.gift) return '';
      const html = h.giftCard(ctx, ctx.d.gifts.groom, 'groom') + h.giftCard(ctx, ctx.d.gifts.bride, 'bride');
      if (!html) return '';
      const deco = [
        ['dried_flower_v2_green', -20, 10, 34, -22, 1], ['hoa_dai_pink', 168, 2, 38, 20, 1], ['santorini_blue', -16, 120, 26, -18, 1], ['silk_ribbon_pink', 182, 114, 24, 14, 1],
        ['mandap_yellow', -8, 172, 44, 8, 3], ['dragon_phoenix_v2', 26, 182, 26, -10, 3], ['minimalism_green', 118, 176, 40, -14, 3],
      ];
      return `
  <section class="sec td-giftbox reveal">
    <h2 class="td-h td-h26">${bi('Hộp Quà Mừng', 'Gift Box')}</h2>
    <button class="td-gbtn" type="button" onclick="document.getElementById('tdGift').showModal()">
      <span class="td-gin">
        <i class="sp s1">✦</i><i class="sp s2">✦</i><i class="sp s3">✦</i><i class="sp s4">✦</i>
        <span class="td-bob">
          <span class="sh"></span>
          ${deco.map(([n, l, t, w, r, z], i) => `<img class="dc dc${i + 1}" src="${A('gb-' + n)}" alt="" style="left:${l}px;top:${t}px;width:${w}px;z-index:${z};transform:rotate(${r}deg)">`).join('')}
          <img class="box" src="${A('giftbox')}" alt="">
        </span>
      </span>
      <span class="hint">${bi('Nhấn để mở', 'Tap to open')}</span>
    </button>
  </section>
  <dialog class="td-dlg td-giftdlg" id="tdGift">
    <div class="td-dlg-head"><h2>Hộp Quà Mừng / Gift Box</h2><button class="td-x" type="button" aria-label="Đóng" onclick="this.closest('dialog').close()">×</button></div>
    <div class="gifts">${html}</div>
  </dialog>`;
    },

    // dòng cuối trang = lời nhắn của cô dâu chú rể; câu mặc định có thêm dòng tiếng Anh như bản gốc
    thanks(ctx) {
      const msg = ctx.d.message || 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!';
      const en = /^Sự hiện diện của quý khách/i.test(msg) ? 'Your presence would be the greatest gift we could receive!' : '';
      return `
  <section class="sec td-thanks reveal">
    ${bi(esc(msg), en)}
  </section>`;
    },
  },

  css: `
.tpl-thanhdiep .card{max-width:480px;background:var(--bg);color:var(--ink);font-family:var(--font-body);box-shadow:none}
.tpl-thanhdiep .sec{padding:0}
.tpl-thanhdiep .td-bi{display:flex;flex-direction:column;align-items:center}
.tpl-thanhdiep .td-bi .en{font-size:.85em;opacity:.7}
.tpl-thanhdiep .td-h{position:relative;z-index:10;margin:0;font-family:var(--font-body);font-weight:400;font-size:20px;line-height:1.5;letter-spacing:.05em;text-transform:uppercase;text-align:center;color:var(--ink)}
.tpl-thanhdiep .sec-sub{margin:4px 0 0;color:var(--muted);font-size:14px}

/* lá màu nước: ảnh 1748×2480, trôi theo cuộn trang (hệ số như bản gốc) */
.tpl-thanhdiep .td-leaf{position:absolute;z-index:0;display:block;pointer-events:none;will-change:transform}
.tpl-thanhdiep .td-leaf img{display:block;width:100%;height:auto}
:root{--td-sy:0}

/* ---- màn mở thiệp ---- */
.tpl-thanhdiep .td-opener{overflow:hidden;background:linear-gradient(to bottom right,var(--td-dark),var(--td-dark2),var(--td-dark3))}
.tpl-thanhdiep .td-fall{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none}
.tpl-thanhdiep .td-fall span{position:absolute;top:-30px;line-height:0;animation:tdFall 20s ease-in-out infinite}
@keyframes tdFall{0%{transform:translateY(-8vh) translateX(0) rotate(0);opacity:0}10%{opacity:.5}50%{transform:translateY(48vh) translateX(var(--sway,20px)) rotate(180deg);opacity:.6}92%{opacity:.45}100%{transform:translateY(105vh) translateX(0) rotate(360deg);opacity:0}}
.tpl-thanhdiep .td-ocard{position:relative;z-index:10;width:310px;max-width:calc(100vw - 32px);text-align:center;border-radius:8px;box-shadow:0 25px 60px -12px rgba(0,0,0,.45),0 8px 24px rgba(0,0,0,.2),0 0 40px color-mix(in srgb,var(--accent) 15%,transparent)}
.tpl-thanhdiep .td-opaper{position:absolute;inset:0;overflow:hidden;border-radius:8px;background:rgba(255,255,255,.95);border:1px solid color-mix(in srgb,var(--accent) 15%,transparent)}
.tpl-thanhdiep .td-oleaf{position:absolute;display:block;width:180px;pointer-events:none;--a:.45deg;animation:tdWhip 4s ease-in-out infinite}
.tpl-thanhdiep .td-oleaf img{display:block;width:100%;height:auto;opacity:.4}
.tpl-thanhdiep .td-oleaf .w2,.tpl-thanhdiep .td-oleaf .w3,.tpl-thanhdiep .td-oleaf .s2,.tpl-thanhdiep .td-oleaf .s3{position:absolute;inset:0}
.tpl-thanhdiep .td-oleaf .w2{--a:1.65deg;animation:tdWhip 4s ease-in-out .48s infinite}
.tpl-thanhdiep .td-oleaf .w3{--a:4.2deg;animation:tdWhip 4s ease-in-out 1.12s infinite}
.tpl-thanhdiep .td-oleaf .s1{-webkit-mask-image:linear-gradient(to bottom,#000 0%,#000 26%,transparent 42%);mask-image:linear-gradient(to bottom,#000 0%,#000 26%,transparent 42%)}
.tpl-thanhdiep .td-oleaf .s2{-webkit-mask-image:linear-gradient(to bottom,transparent 26%,#000 38%,#000 60%,transparent 74%);mask-image:linear-gradient(to bottom,transparent 26%,#000 38%,#000 60%,transparent 74%)}
.tpl-thanhdiep .td-oleaf .s3{-webkit-mask-image:linear-gradient(to bottom,transparent 58%,#000 74%,#000 100%);mask-image:linear-gradient(to bottom,transparent 58%,#000 74%,#000 100%)}
.tpl-thanhdiep .td-oleaf.tr{top:-30px;right:-40px;transform-origin:right top}
.tpl-thanhdiep .td-oleaf.tr .w2{transform-origin:50% 33%}
.tpl-thanhdiep .td-oleaf.tr .w3{transform-origin:50% 67%}
.tpl-thanhdiep .td-oleaf.tr img{rotate:30deg}
.tpl-thanhdiep .td-oleaf.bl{bottom:-30px;left:-40px;transform-origin:left bottom;animation-duration:5s;animation-delay:.7s}
.tpl-thanhdiep .td-oleaf.bl .w2{transform-origin:50% 67%;animation-duration:5s;animation-delay:1.3s}
.tpl-thanhdiep .td-oleaf.bl .w3{transform-origin:50% 33%;animation-duration:5s;animation-delay:2.1s}
.tpl-thanhdiep .td-oleaf.bl img{rotate:180deg}
@keyframes tdWhip{0%,100%{transform:rotate(calc(var(--a) * -1))}50%{transform:rotate(var(--a))}}
.tpl-thanhdiep .td-seal{position:absolute;left:50%;top:50px;z-index:30;display:flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;background:radial-gradient(circle at 30% 30%,var(--accent),var(--td-seal));--sh:color-mix(in srgb,var(--accent) 50%,transparent);box-shadow:0 4px 20px var(--sh),inset 0 2px 4px rgba(255,255,255,.3);transform:translate(-50%,-50%);animation:tdSeal 2s ease-in-out infinite}
.tpl-thanhdiep .td-seal svg{width:28px;height:28px;fill:#fff}
@keyframes tdSeal{0%,100%{transform:translate(-50%,-50%) scale(1);box-shadow:0 4px 20px var(--sh)}50%{transform:translate(-50%,-50%) scale(1.06);box-shadow:0 6px 35px var(--sh)}}
.tpl-thanhdiep .td-obody{position:relative;z-index:10;padding:112px 24px 56px}
.tpl-thanhdiep .td-onames{display:flex;flex-direction:column;align-items:center;margin:0 0 8px;font-family:var(--font-title);font-weight:400;font-size:30px;line-height:1.25;color:var(--accent)}
.tpl-thanhdiep .td-onames span{display:block;width:100%}
.tpl-thanhdiep .td-onames i{display:block;width:100%;font-family:var(--font-body);font-style:normal;font-size:18px;line-height:1}
.tpl-thanhdiep .td-rule{display:flex;align-items:center;justify-content:center;gap:12px;margin:0 0 8px}
.tpl-thanhdiep .td-rule span{width:40px;height:1px;background:linear-gradient(to right,transparent,var(--accent))}
.tpl-thanhdiep .td-rule span:last-child{background:linear-gradient(to left,transparent,var(--accent))}
.tpl-thanhdiep .td-rule b{font-weight:400;font-size:14px;line-height:20px;color:var(--accent);opacity:.7}
.tpl-thanhdiep .td-odate,.tpl-thanhdiep .td-oto,.tpl-thanhdiep .td-ojoin{font-family:'Lora','Times New Roman',serif;color:color-mix(in srgb,var(--accent) 70%,transparent)}
.tpl-thanhdiep .td-odate{margin:0 0 20px;font-size:18px;line-height:28px}
.tpl-thanhdiep .td-oto{margin:0 0 8px;font-size:18px;line-height:28px;font-weight:300}
.tpl-thanhdiep .td-oguest{display:inline-block;max-width:100%;margin:0 0 8px;padding:10px 20px;border-radius:12px;background:color-mix(in srgb,var(--accent) 10%,transparent);overflow-wrap:anywhere}
.tpl-thanhdiep .td-oguest h2{margin:0;font-family:'Lora','Times New Roman',serif;font-size:18px;line-height:28px;font-weight:600;color:var(--accent)}
.tpl-thanhdiep .td-ojoin{margin:0 0 24px;font-size:16px;line-height:24px;font-weight:300}
.tpl-thanhdiep .td-obtn{position:relative;display:flex;align-items:center;justify-content:center;width:fit-content;margin:0 auto;padding:10px 32px;border:0;border-radius:999px;overflow:hidden;background:var(--accent);color:#fff;font-family:'Lora','Times New Roman',serif;font-size:18px;line-height:28px;font-weight:600;box-shadow:0 4px 14px color-mix(in srgb,var(--accent) 35%,transparent);cursor:pointer}
.tpl-thanhdiep .td-obtn i{position:absolute;top:0;left:-100%;width:32px;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);animation:tdShine 3s ease-in-out infinite;pointer-events:none}
@keyframes tdShine{0%{left:-100%}50%,100%{left:100%}}
@media (prefers-reduced-motion:reduce){.tpl-thanhdiep .td-fall,.tpl-thanhdiep .td-obtn i{display:none}.tpl-thanhdiep .td-seal,.tpl-thanhdiep .td-oleaf,.tpl-thanhdiep .td-oleaf span{animation:none}}

/* ---- trang bìa: The story of love + hai ảnh vuông nghiêng ---- */
.tpl-thanhdiep .td-cover{position:relative;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:600px;padding:48px 24px 148px;text-align:center;background:var(--bg)}
.tpl-thanhdiep .td-cv-la2{top:0;left:-80px;width:390px;transform:rotate(-30deg) translateY(calc(var(--td-sy) * .15px))}
.tpl-thanhdiep .td-cv-la1{bottom:-50px;right:-160px;width:390px;transform:rotate(20deg) translateY(calc(var(--td-sy) * .15px))}
.tpl-thanhdiep .td-cv-la3{left:50%;bottom:-400px;z-index:1;width:500px;opacity:.5;transform:translateX(calc(-50% - 100px)) translateY(calc(var(--td-sy) * .25px))}
.tpl-thanhdiep .td-story{position:relative;z-index:10;margin:32px 0}
.tpl-thanhdiep .td-story h1{margin:0 0 4px;font-family:var(--font-body);font-weight:400;font-size:14px;line-height:1.5;letter-spacing:.3em;color:var(--ink)}
.tpl-thanhdiep .td-pair{position:relative;z-index:10;width:100%;max-width:540px;height:560px;margin-bottom:16px}
.tpl-thanhdiep .td-person{position:absolute;display:flex;align-items:center;gap:24px}
.tpl-thanhdiep .td-person.groom{left:-20px;top:0}
.tpl-thanhdiep .td-person.bride{right:-20px;bottom:80px;flex-direction:row-reverse}
.tpl-thanhdiep .td-pic{width:245px;transform:rotate(-8deg)}
.tpl-thanhdiep .bride .td-pic{transform:rotate(6deg)}
.tpl-thanhdiep .td-pic div{position:relative;aspect-ratio:1;overflow:hidden;border:8px solid #fff;background:#fff;box-shadow:0 25px 50px -12px rgba(0,0,0,.25)}
.tpl-thanhdiep .td-pic img{width:100%;height:100%;object-fit:cover}
.tpl-thanhdiep .td-pname{display:flex;flex-direction:column;align-items:flex-start;margin-right:16px;text-align:left}
.tpl-thanhdiep .bride .td-pname{align-items:flex-end;margin:0 0 0 16px;text-align:right}
.tpl-thanhdiep .td-pname .r{margin-bottom:8px;font-family:var(--font-body);font-style:italic;font-size:12px;line-height:16px;letter-spacing:.1em;color:var(--ink)}
.tpl-thanhdiep .td-pname .n{font-family:var(--font-title);font-size:24px;line-height:32px;color:var(--ink)}

/* ---- album 3D ---- */
.tpl-thanhdiep .td-album{position:relative;display:flex;flex-direction:column;align-items:center;padding:50px 24px 48px;background:var(--bg)}
.tpl-thanhdiep .td-cf{position:relative;z-index:10;width:100%;max-width:432px;margin-top:24px}
.tpl-thanhdiep .td-cf-stage{position:relative;height:340px;touch-action:pan-y}
.tpl-thanhdiep .td-cf-row{position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:100%;perspective:1000px}
.tpl-thanhdiep .td-cf .ph{position:absolute;height:92%;aspect-ratio:2/3;padding:0;border:0;border-radius:16px;overflow:hidden;background:var(--line);box-shadow:0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1);transition:all 1.1s ease-in-out;cursor:pointer}
.tpl-thanhdiep .td-cf .ph.on{box-shadow:0 0 0 2px rgba(255,255,255,.3),0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1)}
.tpl-thanhdiep .td-cf .ph img{width:100%;height:100%;object-fit:cover}
.tpl-thanhdiep .td-cf-nav{display:none}
.tpl-thanhdiep .td-count{display:flex;justify-content:center;margin:12px 0 0;font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;line-height:20px;font-variant-numeric:tabular-nums;opacity:.6}

/* ---- khối xanh: lễ cưới + tiệc cưới ---- */
.tpl-thanhdiep .td-dark{position:relative;background:var(--td-dark);color:#fff}
.tpl-thanhdiep .td-dark .td-h{color:#fff}
.tpl-thanhdiep .td-info{z-index:10;display:flex;flex-direction:column;gap:64px;padding:64px 12px 96px;font-family:var(--font-body)}
.tpl-thanhdiep .td-dk-la3{top:150px;left:-80px;width:350px;opacity:.3;transform:rotate(45deg) translateY(calc(var(--td-sy) * .08px))}
.tpl-thanhdiep .td-dk-la4{bottom:250px;left:187px;width:403px;opacity:.3;transform:rotate(-35deg) translateY(calc(var(--td-sy) * -.05px))}
.tpl-thanhdiep .td-info>*:not(.td-leaf){position:relative}
.tpl-thanhdiep .td-fams{display:grid;grid-template-columns:1fr 1fr;gap:8px;text-align:center}
.tpl-thanhdiep .td-fam{display:flex;flex-direction:column;gap:6px;min-width:0}
.tpl-thanhdiep .td-fam .k{font-size:16px;line-height:24px}
.tpl-thanhdiep .td-fam .n{display:flex;flex-direction:column;gap:6px;font-size:13px;line-height:1.5;overflow-wrap:anywhere}
.tpl-thanhdiep .td-fam .a{width:90%;margin:4px auto 0;font-size:11px;line-height:1.5;white-space:pre-line;overflow-wrap:anywhere}
.tpl-thanhdiep .td-lead{display:flex;flex-direction:column;margin:0 auto;font-size:16px;line-height:1.5;text-align:center;white-space:pre-line}
.tpl-thanhdiep .td-couple{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;min-width:0;text-align:center}
.tpl-thanhdiep .td-couple h3{display:flex;align-items:center;justify-content:center;width:80%;min-height:80px;margin:0;font-family:var(--font-title);font-weight:400;font-size:38px;line-height:65px;white-space:nowrap}
.tpl-thanhdiep .td-role{font-size:12px;line-height:16px;letter-spacing:.2em;text-transform:uppercase}
.tpl-thanhdiep .td-amp{font-size:45px;line-height:1.5}
.tpl-thanhdiep .td-when{display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center}
.tpl-thanhdiep .td-at{display:flex;flex-direction:column;align-items:center;gap:8px}
.tpl-thanhdiep .td-place{margin:0;font-size:16px;line-height:24px;white-space:pre-line}
.tpl-thanhdiep .td-place .en{font-size:1em}
.tpl-thanhdiep .td-atk{margin:0 0 8px;font-size:16px;line-height:24px;text-transform:uppercase}
.tpl-thanhdiep .td-time{font-size:20px;line-height:1.5}
.tpl-thanhdiep .td-daterow{display:flex;align-items:center;gap:24px}
.tpl-thanhdiep .td-daterow .td-bi{font-size:12px;line-height:1.5}
.tpl-thanhdiep .td-daterow .wd{text-align:right}
.tpl-thanhdiep .td-daterow b{font-weight:400;font-size:30px;line-height:1.5}
.tpl-thanhdiep .td-pipe{font-style:normal;font-size:20px;line-height:1;opacity:.5}
.tpl-thanhdiep .td-bar{width:2px;height:24px;background:#fff}
.tpl-thanhdiep .td-year{font-size:18px;line-height:1.5}
.tpl-thanhdiep .td-lunar{font-size:12px;line-height:16px;letter-spacing:.25em;text-transform:uppercase}
.tpl-thanhdiep .td-lead2{margin:0;font-family:Gotham,'Montserrat',system-ui,sans-serif;font-weight:400;font-size:16px;line-height:1.5;text-transform:uppercase}
.tpl-thanhdiep .td-marks{display:flex;align-items:center;justify-content:center;gap:32px;margin-top:16px}
.tpl-thanhdiep .td-marks>div{display:flex;flex-direction:column;align-items:center}
.tpl-thanhdiep .td-marks .k{font-size:12px;line-height:16px;letter-spacing:.05em;text-transform:uppercase}
.tpl-thanhdiep .td-marks .k .en{line-height:1.333}
.tpl-thanhdiep .td-marks .t{margin-top:4px;font-size:18px;line-height:28px;font-weight:500}
.tpl-thanhdiep .td-calwrap{width:296px;max-width:100%;margin:8px auto 0;border:1px solid color-mix(in srgb,#fff 27%,transparent);border-radius:8px;overflow:hidden}
.tpl-thanhdiep .td-calwrap .cal{width:100%;margin:0}
.tpl-thanhdiep .td-calh{margin:0!important;padding:10px 0;border-bottom:1px solid color-mix(in srgb,#fff 27%,transparent);font-size:13px;line-height:1.5;font-weight:600;letter-spacing:.025em}
.tpl-thanhdiep .td-info{--cal-hi:#fff;--cal-on:#333}
.tpl-thanhdiep .td-calwrap .cal-grid{row-gap:2px;padding:0 4px 8px;font-size:12px;line-height:16px}
.tpl-thanhdiep .td-calwrap .cal-grid span{height:30px}
.tpl-thanhdiep .td-calwrap .cal-grid .cal-w{height:auto;margin:0 -4px 8px;padding:6px 0 4px;border-bottom:2px solid #fff;font-size:10px;line-height:15px;font-weight:500;letter-spacing:0;opacity:.6;color:#fff}
.tpl-thanhdiep .td-calwrap .cal-on::before{width:26px;height:24px;animation:none;filter:drop-shadow(0 1px 1px rgba(0,0,0,.05))}
.tpl-thanhdiep .td-calwrap .cal-on b{margin-top:0;font-size:11px}
.tpl-thanhdiep .td-link{margin-top:16px;font-size:14px;line-height:20px;letter-spacing:.05em;color:#fff;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px}
.tpl-thanhdiep .td-rsvpbtn{z-index:10;display:flex;justify-content:center;margin:-16px 0 -24px}
.tpl-thanhdiep .td-rsvpbtn button{padding:8px 24px;border:0;border-radius:999px;background:#fff;color:var(--td-dark);font-family:var(--font-body);font-size:14px;line-height:20px;font-weight:600;letter-spacing:.05em;cursor:pointer;transition:transform .2s}
.tpl-thanhdiep .td-rsvpbtn button:hover{transform:scale(1.03)}

/* ---- khối xanh 2: nơi tổ chức + lịch trình ---- */
.tpl-thanhdiep .td-dark2{padding-top:40px}
.tpl-thanhdiep .td-h3{display:flex;flex-direction:column;align-items:center;margin:0;font-weight:400;font-size:20px;line-height:1.5;letter-spacing:.05em;text-transform:uppercase;color:#fff}
.tpl-thanhdiep .td-venue{display:flex;flex-direction:column;gap:24px;padding:0 24px 48px;text-align:center}
.tpl-thanhdiep .td-addr{max-width:384px;margin:12px auto 0;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.1);font-size:14px;line-height:20px;letter-spacing:.025em;white-space:pre-line}
.tpl-thanhdiep .td-vmap{display:flex;flex-direction:column;align-items:center;gap:16px;width:100%}
.tpl-thanhdiep .td-vmap iframe{width:100%;max-width:340px;height:280px;border:0;border-radius:16px;background:rgba(255,255,255,.1)}
.tpl-thanhdiep .td-dir{display:inline-flex;align-items:center;gap:8px;padding:8px 20px;border-radius:999px;font-size:14px;line-height:20px;font-weight:600;color:#fff;text-decoration:none;transition:transform .2s}
.tpl-thanhdiep .td-dir:hover{transform:scale(1.03)}
.tpl-thanhdiep .td-sched{display:flex;flex-direction:column;gap:24px;margin:40px 0 0;padding:0 16px 96px}
.tpl-thanhdiep .td-tl{--gy:32px;display:grid;grid-template-columns:minmax(0,1fr) 16px minmax(0,1fr);align-items:center;column-gap:24px;row-gap:var(--gy);width:100%;max-width:460px;margin:0 auto;padding:0;list-style:none}
.tpl-thanhdiep .td-tl li{display:contents}
.tpl-thanhdiep .td-tl .t{padding-top:2px;text-align:right;font-size:16px;line-height:1.375;letter-spacing:.025em;font-variant-numeric:tabular-nums}
.tpl-thanhdiep .td-tl .dot{position:relative;align-self:stretch;display:flex;align-items:center;justify-content:center}
.tpl-thanhdiep .td-tl .dot::before{content:"";position:absolute;left:50%;width:1px;top:calc(-1 * var(--gy));bottom:calc(-1 * var(--gy));transform:translateX(-50%);background:color-mix(in srgb,#fff 40%,transparent)}
.tpl-thanhdiep .td-tl li:first-child .dot::before{top:50%}
.tpl-thanhdiep .td-tl li:last-child .dot::before{bottom:50%}
.tpl-thanhdiep .td-tl li:only-child .dot::before{display:none}
.tpl-thanhdiep .td-tl .dot::after{content:"";position:relative;width:10px;height:10px;border-radius:50%;background:#fff;box-shadow:0 0 0 2px color-mix(in srgb,#fff 13%,transparent)}
.tpl-thanhdiep .td-tl .l{padding-top:2px;font-size:17px;line-height:1.375;font-weight:500}
.tpl-thanhdiep .td-tl .l .td-bi{align-items:flex-start;text-align:left}
.tpl-thanhdiep .td-tl small{font-size:inherit;opacity:.8}

/* ---- phần trắng cuối: lưu bút, quà, lời cảm ơn ---- */
.tpl-thanhdiep .td-white{position:relative}
.tpl-thanhdiep .td-wh-la2{top:-120px;left:-420px;width:390px;transform:rotate(-30deg) translateY(calc(var(--td-sy) * .1px))}
.tpl-thanhdiep .td-wh-la1{top:305px;right:-317px;width:390px;transform:rotate(20deg) translateY(calc(var(--td-sy) * .1px))}
.tpl-thanhdiep .s-wishes{position:relative;z-index:10;padding:40px 24px 32px;color:var(--ink)}
.tpl-thanhdiep .td-wform{width:100%;margin:24px auto 0}
.tpl-thanhdiep .td-wbox{padding:24px;border:1px solid color-mix(in srgb,var(--ink) 40%,transparent);border-radius:16px;background:color-mix(in srgb,var(--ink) 5%,transparent);box-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}
.tpl-thanhdiep .td-wbox input,.tpl-thanhdiep .td-wbox textarea{display:block;width:100%;padding:12px 16px;border:1px solid var(--ink);border-radius:8px;background:color-mix(in srgb,var(--ink) 10%,transparent);color:var(--ink);font:400 14px/20px var(--font-body);outline:none;resize:none}
.tpl-thanhdiep .td-wbox input{margin-bottom:16px}
.tpl-thanhdiep .td-wbox ::placeholder{color:color-mix(in srgb,var(--ink) 50%,transparent)}
.tpl-thanhdiep .td-wrow{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:16px}
.tpl-thanhdiep .td-wrow .form-msg{flex:1;margin:0;font-size:12px;text-align:left}
.tpl-thanhdiep .td-wrow button{padding:8px 24px;border:0;border-radius:999px;background:var(--ink);color:#fff;font:600 14px/20px var(--font-body);cursor:pointer;transition:transform .2s}
.tpl-thanhdiep .td-wrow button:hover{transform:scale(1.05)}
.tpl-thanhdiep .wish-list{width:100%;max-height:500px;margin:32px auto 0;padding-right:8px;overflow-y:auto}
.tpl-thanhdiep .wish{margin:0 0 12px;padding:16px;border:1px solid color-mix(in srgb,var(--ink) 40%,transparent);border-radius:12px;background:color-mix(in srgb,var(--ink) 5%,transparent);box-shadow:0 1px 3px rgba(0,0,0,.1),0 1px 2px -1px rgba(0,0,0,.1);font-size:14px;line-height:20px;color:var(--ink);text-align:left}
.tpl-thanhdiep .wish b{font-weight:600;color:var(--ink)}
.tpl-thanhdiep .wish p{margin:8px 0 0;line-height:1.625;color:var(--ink)}

.tpl-thanhdiep .td-giftbox{position:relative;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 0 40px}
.tpl-thanhdiep .td-giftbox .td-h{margin-bottom:16px}
.tpl-thanhdiep .td-gbtn{position:relative;width:260px;height:280px;padding:0;border:0;background:none;outline:none;cursor:pointer}
.tpl-thanhdiep .td-gin{position:relative;display:flex;align-items:flex-end;justify-content:center;width:100%;height:100%;padding-bottom:26px}
.tpl-thanhdiep .td-gin .sp{position:absolute;z-index:20;font-style:normal;color:var(--ink);pointer-events:none;animation:tdSpark 2s ease-in-out infinite}
.tpl-thanhdiep .td-gin .s1{top:8%;left:14%;font-size:22px}
.tpl-thanhdiep .td-gin .s2{top:18%;right:10%;font-size:16px;animation-delay:.6s}
.tpl-thanhdiep .td-gin .s3{top:32%;left:5%;font-size:14px;animation-delay:1.2s}
.tpl-thanhdiep .td-gin .s4{top:26%;right:5%;font-size:14px;animation-delay:1.7s}
.tpl-thanhdiep .td-bob{position:relative;display:block;width:200px;height:220px;animation:tdBob 3s ease-in-out infinite}
.tpl-thanhdiep .td-bob .sh{position:absolute;left:50%;bottom:-8px;width:144px;height:12px;margin-left:-72px;border-radius:50%;background:rgba(0,0,0,.45);filter:blur(4px);animation:tdShadow 3s ease-in-out infinite}
.tpl-thanhdiep .td-bob .dc{position:absolute;filter:drop-shadow(0 2px 3px rgba(0,0,0,.25));pointer-events:none}
.tpl-thanhdiep .td-bob .box{position:absolute;left:50%;bottom:0;z-index:2;width:170px;max-height:220px;margin-left:-85px;object-fit:contain;filter:drop-shadow(0 10px 18px rgba(0,0,0,.25));transform-origin:50% 100%;transition:transform .3s;pointer-events:none}
.tpl-thanhdiep .td-gbtn:hover .box,.tpl-thanhdiep .td-gbtn:focus-visible .box{animation:tdPop .7s cubic-bezier(.34,1.56,.64,1) forwards}
.tpl-thanhdiep .td-gbtn .hint{position:absolute;left:50%;bottom:0;transform:translateX(-50%);white-space:nowrap;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;line-height:16px;font-weight:500;color:var(--ink);animation:tdHint 2s ease-in-out infinite}
@keyframes tdBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes tdShadow{0%,100%{transform:scaleX(1);opacity:.3}50%{transform:scaleX(.9);opacity:.18}}
@keyframes tdSpark{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1.15)}}
@keyframes tdHint{0%,100%{opacity:.45}50%{opacity:1}}
@keyframes tdPop{0%{transform:translateY(0) scale(1) rotate(0)}45%{transform:translateY(-14px) scale(1.08) rotate(-3deg)}100%{transform:translateY(-8px) scale(1.05) rotate(0)}}
@media (prefers-reduced-motion:reduce){.tpl-thanhdiep .td-gbtn *{animation:none!important}}

/* hộp thoại (xác nhận tham dự, quà mừng) */
.tpl-thanhdiep .td-dlg{width:min(448px,calc(100% - 32px));max-height:90vh;padding:0;border:0;border-radius:16px;background:#fff;color:#111827;box-shadow:0 25px 50px -12px rgba(0,0,0,.25);overflow:auto}
.tpl-thanhdiep .td-dlg::backdrop{background:rgba(0,0,0,.5)}
.tpl-thanhdiep .td-x{position:absolute;top:16px;right:16px;z-index:1;width:32px;height:32px;border:0;border-radius:50%;background:#f3f4f6;color:#6b7280;font-size:20px;line-height:1;cursor:pointer}
.tpl-thanhdiep .td-rsvp .s-rsvp{padding:24px;text-align:left}
.tpl-thanhdiep .td-rsvp .td-h{margin:0 32px 4px;font-family:system-ui,sans-serif;font-size:22px;font-weight:700;letter-spacing:0;text-transform:none;color:#111827}
.tpl-thanhdiep .td-rsvp .sec-sub{margin:0 0 24px;font-family:system-ui,sans-serif;text-align:center;color:#6b7280}
.tpl-thanhdiep .td-rsvp .form{gap:16px;padding:0;border:0;background:none;font-family:system-ui,sans-serif}
.tpl-thanhdiep .td-rsvp .form label{font-size:14px;font-weight:500;color:#374151}
.tpl-thanhdiep .td-rsvp .form input:not([type=radio]),.tpl-thanhdiep .td-rsvp .form select{padding:12px 16px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;font-size:16px;color:#111827}
.tpl-thanhdiep .td-rsvp .choice label{padding:10px 12px;border:2px solid #e5e7eb;border-radius:12px;background:rgba(249,250,251,.5);font-size:14px;color:#374151}
.tpl-thanhdiep .td-rsvp .choice label:has(input:checked){border-color:var(--accent)}
.tpl-thanhdiep .td-rsvp .btn{padding:14px;border:0;border-radius:12px;background:var(--accent);color:#fff;font-size:14px;font-weight:600}
.tpl-thanhdiep .td-giftdlg{width:min(512px,calc(100% - 32px))}
.tpl-thanhdiep .td-dlg-head{position:relative;padding:24px 24px 16px;background:var(--accent);text-align:center}
.tpl-thanhdiep .td-dlg-head h2{margin:0;font:400 20px/1.5 var(--font-body);letter-spacing:.05em;text-transform:uppercase;color:#fff;text-shadow:1px 1px 2px rgba(0,0,0,.2)}
.tpl-thanhdiep .td-dlg-head .td-x{top:12px;right:12px;background:none;color:rgba(255,255,255,.8)}
.tpl-thanhdiep .td-giftdlg .gifts{display:flex;flex-direction:column;align-items:center;gap:16px;padding:16px;color:var(--accent)}
.tpl-thanhdiep .td-giftdlg .gift{flex:1;max-width:180px;padding:0;border:0;background:none;text-align:center;color:var(--accent);font-family:system-ui,sans-serif}
.tpl-thanhdiep .td-giftdlg .gift-who{min-height:2rem;margin:0 0 8px;font:500 12px/1.4 system-ui,sans-serif;color:var(--accent)}
.tpl-thanhdiep .td-giftdlg .gift img{width:128px;height:128px;margin:0 auto 8px;padding:8px;border:2px solid color-mix(in srgb,var(--accent) 12.5%,transparent);border-radius:12px;background:#fff;box-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1)}
.tpl-thanhdiep .td-giftdlg .gift p{margin:2px 0;font-size:10px}
.tpl-thanhdiep .td-giftdlg .gift-acc{gap:6px;font-family:ui-monospace,monospace;letter-spacing:0}
.tpl-thanhdiep .td-giftdlg .gift-holder{font-weight:600;color:var(--accent)}
.tpl-thanhdiep .td-giftdlg .copy{padding:4px 8px;border:0;border-radius:999px;background:color-mix(in srgb,var(--accent) 8%,transparent);color:var(--accent);font-size:10px;font-weight:500}
@media (max-width:639px){.tpl-thanhdiep .td-giftdlg{margin:auto auto 0;width:100%;max-width:none;border-radius:16px 16px 0 0}}

.tpl-thanhdiep .td-thanks{position:relative;z-index:10;display:flex;flex-direction:column;align-items:center;padding:0 24px 48px;text-align:center}
.tpl-thanhdiep .td-thanks .td-bi{gap:4px;max-width:560px;margin:0 auto;font-size:16px;line-height:24px;white-space:pre-line;color:var(--ink)}
.tpl-thanhdiep .s-story{position:relative;z-index:1;padding:32px 24px;font-size:16px;text-align:center}
.tpl-thanhdiep .credit{position:relative;z-index:10;padding:0 0 8px;font-size:12px;opacity:.5;color:var(--ink)}
.tpl-thanhdiep .credit a{color:inherit}

@media (min-width:640px){
  .tpl-thanhdiep .td-ocard{width:340px}
  .tpl-thanhdiep .td-onames{font-size:36px;line-height:1.25}
  .tpl-thanhdiep .td-onames i{font-size:20px}
  .tpl-thanhdiep .td-oguest h2{font-size:20px;font-weight:500}
  .tpl-thanhdiep .td-obtn{font-weight:500}
  .tpl-thanhdiep .td-giftdlg{width:min(576px,calc(100% - 32px))}
  .tpl-thanhdiep .td-giftdlg .gifts{flex-direction:row;flex-wrap:wrap;align-items:flex-start;justify-content:center;padding:24px}
  .tpl-thanhdiep .td-giftdlg .gift img{width:160px;height:160px}
  .tpl-thanhdiep .td-giftdlg .gift{max-width:none}
}
/* màn hình rộng: cột 900px có viền mảnh, các khối lớn hơn như bản gốc */
@media (min-width:768px){
  .tpl-thanhdiep .card{max-width:900px;border:1px solid color-mix(in srgb,var(--accent) 13%,transparent)}
  .tpl-thanhdiep .td-ocard{width:520px}
  .tpl-thanhdiep .td-oleaf{width:250px}
  .tpl-thanhdiep .td-oleaf.tr{top:-40px;right:-60px}
  .tpl-thanhdiep .td-oleaf.bl{bottom:-40px;left:-50px}
  .tpl-thanhdiep .td-obody{padding:96px 24px 32px}
  .tpl-thanhdiep .td-cover{min-height:780px;padding:62px 31px 192px}
  .tpl-thanhdiep .td-cv-la2,.tpl-thanhdiep .td-cv-la1{width:507px}
  .tpl-thanhdiep .td-cv-la3{bottom:-300px;width:650px;transform:translateX(calc(-50% - 130px)) translateY(calc(var(--td-sy) * .25px))}
  .tpl-thanhdiep .td-story{margin:42px 0}
  .tpl-thanhdiep .td-story h1{font-size:18px}
  .tpl-thanhdiep .td-pair{max-width:702px;height:728px;margin-bottom:21px}
  .tpl-thanhdiep .td-person{gap:31px}
  .tpl-thanhdiep .td-person.bride{bottom:104px}
  .tpl-thanhdiep .td-pic{width:318px}
  .tpl-thanhdiep .td-pic div{border-width:10px}
  .tpl-thanhdiep .td-pname{margin-right:21px}
  .tpl-thanhdiep .bride .td-pname{margin:0 0 0 21px}
  .tpl-thanhdiep .td-pname .r{font-size:16px;line-height:24px}
  .tpl-thanhdiep .td-pname .n{font-size:31px;line-height:40px}
  .tpl-thanhdiep .td-album{padding:50px 40px 64px}
  .tpl-thanhdiep .td-cf{max-width:600px}
  .tpl-thanhdiep .td-cf-stage{height:520px}
  .tpl-thanhdiep .td-cf-nav{position:absolute;top:50%;z-index:200;display:flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border:0;border-radius:50%;background:color-mix(in srgb,var(--line) 60%,transparent);color:var(--ink);transform:translateY(-50%);cursor:pointer}
  .tpl-thanhdiep .td-cf-nav.prev{left:0}
  .tpl-thanhdiep .td-cf-nav.next{right:0}
  .tpl-thanhdiep .td-info{gap:80px;padding:80px 24px 128px}
  .tpl-thanhdiep .td-dk-la3{width:455px}
  .tpl-thanhdiep .td-dk-la4{bottom:205px;left:655px;width:523px}
  .tpl-thanhdiep .td-fams{gap:12px}
  .tpl-thanhdiep .td-fam .n{font-size:23px}
  .tpl-thanhdiep .td-fam .a{width:80%;font-size:18px}
  .tpl-thanhdiep .td-lead{max-width:560px;font-size:20px}
  .tpl-thanhdiep .td-couple{gap:16px}
  .tpl-thanhdiep .td-couple h3{line-height:130px}
  .tpl-thanhdiep .td-amp{font-size:52px}
  .tpl-thanhdiep .td-when{gap:20px}
  .tpl-thanhdiep .td-place{font-size:20px;line-height:1.5}
  .tpl-thanhdiep .td-atk{font-size:18px;line-height:1.5}
  .tpl-thanhdiep .td-time{font-size:30px;line-height:1.5}
  .tpl-thanhdiep .td-daterow .td-bi{font-size:16px;line-height:1.5}
  .tpl-thanhdiep .td-daterow b{font-size:40px}
  .tpl-thanhdiep .td-pipe{font-size:28px}
  .tpl-thanhdiep .td-bar{height:32px}
  .tpl-thanhdiep .td-year{font-size:24px;line-height:1.5}
  .tpl-thanhdiep .td-lunar{font-size:14px;line-height:20px}
  .tpl-thanhdiep .td-lead2{font-size:20px}
  .tpl-thanhdiep .td-marks .t{font-size:20px}
  .tpl-thanhdiep .td-calwrap{width:352px}
  .tpl-thanhdiep .td-calh{font-size:14px}
  .tpl-thanhdiep .td-calwrap .cal-grid{font-size:13px}
  .tpl-thanhdiep .td-calwrap .cal-grid span{height:34px}
  .tpl-thanhdiep .td-calwrap .cal-grid .cal-w{font-size:11px}
  .tpl-thanhdiep .td-calwrap .cal-on::before{width:30px;height:28px}
  .tpl-thanhdiep .td-calwrap .cal-on b{font-size:12px}
  .tpl-thanhdiep .td-rsvpbtn button{font-size:16px;line-height:24px}
  .tpl-thanhdiep .td-dark2{padding-top:48px}
  .tpl-thanhdiep .td-h3,.tpl-thanhdiep .td-h26{font-size:26px;line-height:1.5}
  .tpl-thanhdiep .td-h3.td-h20{font-size:20px}
  .tpl-thanhdiep .td-venue{gap:32px;padding:0 40px 64px}
  .tpl-thanhdiep .td-addr{max-width:500px;font-size:16px;line-height:24px}
  .tpl-thanhdiep .td-vmap{gap:20px}
  .tpl-thanhdiep .td-vmap iframe{max-width:560px;height:380px}
  .tpl-thanhdiep .td-dir{font-size:16px;line-height:24px}
  .tpl-thanhdiep .td-sched{gap:32px;margin-top:48px;padding-bottom:128px}
  .tpl-thanhdiep .td-tl{--gy:40px;column-gap:32px}
  .tpl-thanhdiep .td-tl .t{font-size:17px}
  .tpl-thanhdiep .td-tl .l{font-size:19px}
  .tpl-thanhdiep .td-cv-la2,.tpl-thanhdiep .td-wh-la2,.tpl-thanhdiep .td-wh-la1{width:507px}
  .tpl-thanhdiep .td-wh-la2{left:-542px}
  .tpl-thanhdiep .td-wh-la1{top:414px;right:-352px}
  .tpl-thanhdiep .s-wishes{padding:48px 40px 40px}
  .tpl-thanhdiep .td-wform,.tpl-thanhdiep .wish-list{max-width:600px}
  .tpl-thanhdiep .td-giftbox{padding-bottom:56px}
  .tpl-thanhdiep .td-thanks{padding:0 40px 56px}
  .tpl-thanhdiep .td-thanks .td-bi{font-size:18px;line-height:28px}
}
@media (min-width:1024px){
  .tpl-thanhdiep .td-ocard{width:600px}
  .tpl-thanhdiep .td-cover{min-height:900px;padding:72px 36px 222px}
  .tpl-thanhdiep .td-cv-la2,.tpl-thanhdiep .td-cv-la1,.tpl-thanhdiep .td-wh-la2,.tpl-thanhdiep .td-wh-la1{width:585px}
  .tpl-thanhdiep .td-cv-la3{bottom:-700px;width:750px;transform:translateX(calc(-50% - 150px)) translateY(calc(var(--td-sy) * .25px))}
  .tpl-thanhdiep .td-story{margin:48px 0}
  .tpl-thanhdiep .td-story h1{font-size:21px}
  .tpl-thanhdiep .td-pair{max-width:810px;height:840px;margin-bottom:24px}
  .tpl-thanhdiep .td-person{gap:36px}
  .tpl-thanhdiep .td-person.bride{bottom:120px}
  .tpl-thanhdiep .td-pic{width:367px}
  .tpl-thanhdiep .td-pic div{border-width:12px}
  .tpl-thanhdiep .td-pname{margin-right:24px}
  .tpl-thanhdiep .bride .td-pname{margin:0 0 0 24px}
  .tpl-thanhdiep .td-pname .r{font-size:18px;line-height:28px}
  .tpl-thanhdiep .td-pname .n{font-size:36px;line-height:40px}
  .tpl-thanhdiep .td-dk-la3{left:-110px;width:525px}
  .tpl-thanhdiep .td-dk-la4{bottom:175px;width:604px}
  .tpl-thanhdiep .td-wh-la2{left:-581px}
  .tpl-thanhdiep .td-wh-la1{top:280px;right:-376px}
}
`,
};
