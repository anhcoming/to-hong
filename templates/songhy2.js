// Mẫu "Song Hỷ Đỏ" — truyền thống: nền đỏ son, khung giấy kem viền đào, chữ 囍, đường cong mây ôm ảnh.
// Kích thước lấy theo bản gốc (Tailwind): số đầu cho điện thoại, khối @media (min-width:768px) cho màn rộng.
// Ảnh trang trí của bản gốc (hoa, mây, nhẫn, ly, bánh, phong bao) đọc từ /demo/songhy2-*.webp nếu có;
// thiếu ảnh thì thẻ <img> tự gỡ (onerror) và phần dựng bằng CSS/chữ 囍 thay thế.
const { esc } = require('../lib/util');
const banks = require('../lib/banks');

const A = (n) => `/demo/songhy2-${n}`;
// ảnh trang trí có thể chưa có trong public/demo: lỗi tải thì gỡ hẳn
const deco = (n, cls, extra = '') => `<img class="${cls}" src="${A(n)}" alt="" aria-hidden="true" onerror="this.remove()"${extra}>`;

const base = {
  '--font-title': "'Times New Roman',Times,serif",
  '--font-script': "'Carattere',cursive",
  '--font-body': "Baskerville,'Libre Baskerville','Times New Roman',serif", // Baskerville có sẵn trên máy Apple như bản gốc
};

const evList = (d) => d.events.filter((e) => e.name || e.place);
// sự kiện chính của tiệc (khung tiệc cưới, bản đồ)
function partyEvent(d) {
  const evs = evList(d);
  return evs.find((e) => /khai tiệc|tiệc cưới/i.test(e.name)) || evs.find((e) => /tiệc/i.test(e.name)) || evs[evs.length - 1] || null;
}

// đường cong đỏ ôm đáy ảnh bìa / đáy khung (vẽ lại theo hình bản gốc), viền đào dọc mép cong
const CURVE = 'M0 50L25 60C32 78 42 105 65 125C80 136 105 145 130 155C160 166 200 190 212.5 227C225 190 265 166 295 155C320 145 345 136 360 125C383 105 393 78 400 60L425 50';
const hero = (cls) => `<svg class="sh-hero ${cls || ''}" viewBox="0 0 425 509" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d="${CURVE}V340H0Z" fill="var(--bg)"/><path d="${CURVE}" fill="none" stroke="var(--sh-peach)" stroke-width="2.5"/></svg>`;
const XI = (cls) => `<span class="sh-xi ${cls}" aria-hidden="true">囍</span>`;

// ngày | tháng-năm (giống nhau ở lời mời và tiệc cưới)
const dateRow = (p) => `<div class="sh-date"><b>${p.d}</b><i></i><span><em>Tháng ${p.m}</em><em>${p.y}</em></span></div>`;
const lunarOf = (ctx) => `(Tức ${esc(ctx.lunar.replace(/^Nhằm /i, ''))})`;

// khung giấy kem (ảnh viền tự vẽ songhy2-panel.svg, kéo giãn kiểu border-image như bản gốc)
function panel(cls, inner, over = '') {
  return `
  <section class="sh-sec sh-pan ${cls} reveal">
    <div class="sh-in"><div class="sh-rel">
      <div class="sh-frame" aria-hidden="true"></div>
      ${over ? `<div class="sh-ov" aria-hidden="true">${over}</div>` : ''}
      <div class="sh-body">${inner}</div>
    </div></div>
  </section>`;
}

const flowers = () => deco('flower1.webp', 'sh-fl r') + deco('flower1.webp', 'sh-fl l');

// 12 chữ 囍 bay lên trên màn mở thiệp (vị trí cố định thay cho số ngẫu nhiên của bản gốc)
const RISE = [[40, '#A50000', 13.6, -26, 19.9, -18.5], [79.7, '#fdcb9c', 12.8, -28, 24.4, -1.3], [28.4, '#fdcb9c', 22.9, -30, 24.8, -13.7], [10.3, '#fff9e6', 23.9, -16, 19.5, -11], [54.8, '#ffe8a4', 17.4, -22, 19.9, -17.1], [31, '#A50000', 19, -27, 18.4, -7.3], [78.1, '#fff9e6', 14.5, 24, 22.4, -13.2], [55.3, '#ffe8a4', 10.1, 14, 24.7, -14.5], [81.1, '#ffe8a4', 11.2, -26, 21.7, -15.8], [94.3, '#fff9e6', 17, -7, 19.2, -5.5], [34.2, '#A50000', 15.5, 6, 19.3, -11.7], [25.9, '#fff9e6', 17.4, -9, 18.8, -1.5]];

module.exports = {
  id: 'songhy2',
  name: 'Song Hỷ Đỏ',
  group: 'truyenthong',
  desc: 'Truyền thống đỏ son: chữ Song Hỷ, khung giấy kem viền đào, ảnh cưới trong khung cong',
  fonts: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400,0..100,0..1&family=Carattere&family=Ms+Madi&family=Uchen&family=Lora:wght@300;400;500;600&family=The+Nautigal:wght@400;700&family=Libre+Baskerville:wght@400;700&family=Montserrat:wght@400;500;600&display=swap',
  palettes: [
    { id: 'do-son', name: 'Đỏ son', swatch: ['#8c0000', '#ffe8a4'], vars: { ...base, '--page': '#ffffff', '--bg': '#8c0000', '--paper': '#fff9e6', '--ink': '#990000', '--muted': '#2f0000', '--accent': '#920002', '--accent-ink': '#fff9e6', '--gold': '#ffe8a4', '--line': '#fdcb9c', '--sh-peach': '#f6c89c', '--sh-deep': '#420000', '--sh-dlg': '#5a0000', '--sh-hi': '#A50000' } },
  ],
  // dữ liệu xem thử theo bản gốc: ảnh cưới của mẫu, ngày 04/01/2027, tiệc ở Sen Vang Palace (Phú Thọ);
  // bản gốc có 9 mốc lịch trình nhưng thiệp chỉ lưu tối đa 6 sự kiện nên bỏ Đón dâu, Gia tiên nhà trai, Chúc mừng từng bàn
  demo: {
    date: '2027-01-04',
    time: '19:00',
    cover: '/demo/songhy2-photo1.jpg',
    photos: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `/demo/songhy2-photo${n}.jpg`),
    story: '',
    message: 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!',
    events: [
      { name: 'Lễ gia tiên tại nhà gái', date: '2027-01-04', time: '13:30', place: '', address: '', mapUrl: '' },
      { name: 'Đón khách', date: '2027-01-04', time: '17:30', place: '', address: '', mapUrl: '' },
      { name: 'Nghi thức thành hôn', date: '2027-01-04', time: '18:00', place: 'Sen Vang Palace', address: '', mapUrl: '' },
      { name: 'Rót rượu giao bôi và cắt bánh', date: '2027-01-04', time: '18:30', place: '', address: '', mapUrl: '' },
      { name: 'Khai tiệc', date: '2027-01-04', time: '19:00', place: 'Sen Vang Palace', address: 'Phú Thọ', mapUrl: '' },
      { name: 'Kết thúc tiệc', date: '2027-01-04', time: '21:30', place: '', address: '', mapUrl: '' },
    ],
  },
  // xác nhận tham dự mở trong hộp thoại từ khung tiệc cưới (như bản gốc), nên không có trong luồng trang
  layout: ['invite', 'story', 'gallery', 'calendar', 'events', 'wishes', 'gift', 'thanks'],

  title(text, sub) {
    return `<h2 class="sh-h">${esc(text)}</h2>${sub ? `<p class="sec-sub">${esc(sub)}</p>` : ''}`;
  },

  opener(ctx) {
    const p = ctx.dparts;
    return `
<div class="opener sh-opener" id="opener" data-open-ms="900">
  <div class="sh-rise" aria-hidden="true">${RISE.map(([l, c, s, w, t, dl]) => `<i style="left:${l}%;color:${c};font-size:${s}px;--sway:${w}px;animation-duration:${t}s;animation-delay:${dl}s">囍</i>`).join('')}</div>
  <div class="sh-ocard">
    <span class="sh-seal" aria-hidden="true">囍</span>
    <div class="sh-oface">
      <div class="sh-obg" aria-hidden="true"><i class="a">囍</i><i class="b">囍</i></div>
      <div class="sh-obody">
        <h1 class="sh-onames"><span>${esc(ctx.g)}</span><i>&amp;</i><span>${esc(ctx.b)}</span></h1>
        <p class="sh-rule" aria-hidden="true"><span></span>❦<span></span></p>
        ${p ? `<p class="sh-odate">${+p.d} tháng ${+p.m}, ${p.y}</p>` : ''}
        <p class="sh-oto">${ctx.guest ? `Thân mời ${esc(ctx.guest.name)}` : 'Thân Mời'}</p>
        <button class="sh-obtn" id="openBtn">Mở thiệp<i aria-hidden="true"></i></button>
      </div>
    </div>
  </div>
</div>`;
  },

  // bìa: nền kem có chữ 囍 lớn chìm, tên hai bên chữ 囍, ảnh cưới trong khung chữ thập bo góc, đường cong đỏ ôm đáy
  cover(ctx) {
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    const side = (k, n) => `<div class="sh-cn"><p class="k">${k}</p><p class="n">${esc(n)}</p></div>`;
    return `
<header class="sh-cover">
  <div class="sh-in"><div class="sh-hbox">
    <div class="sh-cream" aria-hidden="true"></div>
    <span class="sh-bigxi" aria-hidden="true">囍</span>
    <div class="sh-cnames">${side('Chú Rể', ctx.g)}${XI('ico')}${side('Cô Dâu', ctx.b)}</div>
    <div class="sh-photo">
      <svg viewBox="0 0 321 527" aria-hidden="true"><defs>
        <clipPath id="shCo"><rect x="29.5" y="1" width="262" height="525" rx="23.5" ry="25"/><rect x="1" y="28" width="319" height="471" rx="26.5" ry="22"/></clipPath>
        <clipPath id="shCi"><rect x="31.5" y="3" width="258" height="521" rx="21.5" ry="23"/><rect x="3" y="30" width="315" height="467" rx="24.5" ry="20"/></clipPath>
      </defs><rect width="321" height="527" fill="var(--bg)" clip-path="url(#shCo)"/>${photo ? `<image href="${esc(photo)}" width="321" height="527" preserveAspectRatio="xMidYMid slice" clip-path="url(#shCi)"/>` : ''}</svg>
    </div>
    <div class="sh-cov-ov" aria-hidden="true">
      <div class="sh-photo">${hero()}</div>
      ${XI('lt r')}${XI('lt l')}
    </div>
  </div></div>
</header>`;
  },

  sections: {
    // khung "Thông tin lễ cưới": bố mẹ hai bên, tên đầy đủ, từng lễ có địa điểm (giờ, thứ, ngày, âm lịch)
    invite(ctx) {
      const { d, dparts: p } = ctx;
      const strip = (s) => esc(s.replace(/^(Ông|Bà)\s+/i, ''));
      const fam = (x) => `<div class="sh-fam"><span class="k">Ông Bà</span><span class="n">${x.father ? strip(x.father) : ''}</span><span class="n">${x.mother ? strip(x.mother) : ''}</span>${x.address ? `<span class="a">${esc(x.address)}</span>` : ''}</div>`;
      const hasFam = d.groom.father || d.groom.mother || d.bride.father || d.bride.mother;
      const party = partyEvent(d);
      // lễ có địa điểm (tối đa hai: lễ + tiệc), như hai khối "Lễ thành hôn" / "Tiệc cưới" của bản gốc
      let evs = evList(d).filter((e) => e.place);
      if (evs.length > 2) evs = [evs.find((e) => e !== party), party].filter(Boolean);
      if (!evs.length && party) evs = [party];
      const block = (e) => {
        const ep = (e.date && e.date !== ctx.date && ctx.dparts) ? null : p;
        const label = e === party && evs.length > 1 ? 'Tiệc cưới' : e.name;
        return `
        <div class="sh-evb">
          <p class="sh-evn">${esc(label)}${e.place ? `\n${esc(e.place)}` : ''}</p>
          ${p ? `<div class="sh-when"><span>${e.time ? `Vào lúc ${esc(e.time)}` : ''}</span><span>${esc(ctx.weekday)}</span></div>` : ''}
          ${ep ? `${dateRow(ep)}<p class="sh-lunar">${lunarOf(ctx)}</p>` : ''}
        </div>`;
      };
      return panel('sh-invite', `
      <h2 class="sh-h">Thông tin lễ cưới</h2>
      ${hasFam ? `<div class="sh-fams">${fam(d.groom)}<i></i>${fam(d.bride)}</div>` : ''}
      <p class="sh-lead">Hai gia đình trân trọng báo tin lễ thành hôn của hai con chúng tôi</p>
      <div class="sh-couple">
        <h3>${esc(d.groom.fullName || d.groom.name)}</h3>
        <p class="sh-amp">&amp;</p>
        <h3>${esc(d.bride.fullName || d.bride.name)}</h3>
      </div>
      ${evs.map(block).join('')}
      <script>(function(){var s=document.currentScript.parentNode;function fit(){s.querySelectorAll('.sh-couple h3').forEach(function(h){h.style.fontSize='';var w=h.clientWidth,f=parseFloat(getComputedStyle(h).fontSize);while(h.scrollWidth>w&&f>18){f-=1;h.style.fontSize=f+'px';}});}fit();addEventListener('resize',fit);document.fonts&&document.fonts.ready.then(fit);})()</script>`,
      `${hero()}${XI('mark')}`);
    },

    // album xoay 3D: ảnh giữa thẳng, hai bên nghiêng 45°/90°… lùi sâu dần; vuốt / mũi tên / chạm ảnh bên để chuyển
    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      return `
  <section class="sh-sec sh-album">
    <div class="sh-in">
      <div class="sh-decor" aria-hidden="true">${flowers()}</div>
      <div class="sh-albody">
        <h2 class="sh-h">Album Ảnh</h2>
        <div class="sh-cf">
          <div class="sh-cf-stage">
            <button class="sh-cf-nav prev" type="button" aria-label="Ảnh trước"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            <button class="sh-cf-nav next" type="button" aria-label="Ảnh sau"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            <div class="sh-cf-row">
              ${ph.map((u, i) => `<button class="ph" data-i="${i}" aria-label="Xem ảnh ${i + 1}"><img loading="lazy" src="${esc(u)}" alt=""></button>`).join('')}
            </div>
          </div>
          <p class="sh-cf-count"><span>1</span> / ${ph.length}</p>
        </div>
      </div>
    </div>
    <script>(function(){
      var s=document.currentScript.parentNode,st=s.querySelector('.sh-cf-stage'),cs=[].slice.call(st.querySelectorAll('.ph')),ct=s.querySelector('.sh-cf-count span'),k=0,n=cs.length;
      var SC=[1,.85,.7],OP=[1,.75,.5,.3];
      function go(i){k=(i+n)%n;cs.forEach(function(c,j){var o=j-k;if(o>n/2)o-=n;if(o<-n/2)o+=n;var a=Math.abs(o);
        c.style.transform='translateX('+(60*o)+'%) translateZ('+(-150*a)+'px) rotateY('+(45*o)+'deg) scale('+SC[Math.min(a,2)]+')';
        c.style.opacity=OP[Math.min(a,3)];c.style.zIndex=100-a;c.classList.toggle('on',a===0);});ct.textContent=k+1;}
      // chạm ảnh bên cạnh thì chuyển tới ảnh đó, chỉ ảnh giữa mới mở xem lớn
      st.addEventListener('click',function(e){var c=e.target.closest('.ph');if(c&&!c.classList.contains('on')){e.stopPropagation();go(cs.indexOf(c));}},true);
      s.querySelector('.prev').onclick=function(){go(k-1)};s.querySelector('.next').onclick=function(){go(k+1)};
      var x0=null;st.addEventListener('pointerdown',function(e){x0=e.clientX});
      st.addEventListener('pointerup',function(e){if(x0!==null&&Math.abs(e.clientX-x0)>40){go(k+(e.clientX<x0?1:-1));}x0=null});
      go(0);
      // tự chuyển ảnh mỗi ~1,4s khi album đang trên màn hình (như bản gốc); bấm/vuốt thì đếm lại từ đầu
      var on=false,t;function run(){clearInterval(t);t=setInterval(function(){if(on&&!document.hidden)go(k+1)},1400);}
      if('IntersectionObserver' in window)new IntersectionObserver(function(es){on=es[0].isIntersecting}).observe(st);
      st.addEventListener('pointerdown',run);s.querySelectorAll('.sh-cf-nav').forEach(function(b){b.addEventListener('click',run)});run();
    })()</script>
  </section>`;
    },

    // khung "Thông tin tiệc cưới": giờ, thứ, ngày, âm lịch, đón khách / khai tiệc, đếm ngược, lịch tháng; nút mở hộp thoại xác nhận
    calendar(ctx, opts, h) {
      const { d, dparts: p } = ctx;
      if (!p) return '';
      const evs = evList(d);
      const party = partyEvent(d) || {};
      const time = party.time || d.time;
      const guestIn = evs.find((e) => /đón khách/i.test(e.name) && e.time && (!e.date || e.date === ctx.date));
      const marks = [guestIn && ['Đón khách', guestIn.time], time && ['Khai tiệc', time]].filter(Boolean);
      const y = +p.y, m = +p.m, day = +p.d;
      const first = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // thứ Hai = 0
      const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
      let cells = '<i></i>'.repeat(first);
      for (let i = 1; i <= days; i++) cells += i === day ? `<i class="on" aria-label="Ngày cưới ${i}"><b>${i}</b></i>` : `<i>${i}</i>`;
      const cal = d.show.calendar ? `<div class="sh-calw"><div class="sh-cal"><p class="hd">Tháng ${m} / ${y}</p><p class="wk">${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((w) => `<i>${w}</i>`).join('')}</p><p class="gr">${cells}</p></div></div>` : '';
      const cd = d.show.countdown ? `<div class="sh-cd"><h2>Cùng đếm ngược</h2><p role="timer"><b data-cd="d">0</b> ngày <b data-cd="h">0</b> giờ <b data-cd="m">0</b> phút <b data-cd="s">0</b> giây</p></div>` : '';
      const link = h.calendarLink(`Đám cưới ${ctx.g} & ${ctx.b}`, ctx.date, time, party.address || party.place);
      const rsvp = d.show.rsvp ? h.rsvp(ctx)
        .replace('sec s-rsvp reveal', 's-rsvp')
        .replace('Giúp chúng mình chuẩn bị chu đáo hơn', 'Sự hiện diện của bạn là niềm vinh hạnh cho gia đình chúng tôi. Xin xác nhận để chúng tôi chuẩn bị chu đáo nhất.')
        .replace('placeholder="Nguyễn Văn A"', 'placeholder="Nhập tên của bạn"')
        .replace('<div class="choice">', '<p class="sh-q">Bạn sẽ đến chứ?</p><div class="choice">')
        .replace('Mình sẽ đến', 'Tôi sẽ đến')
        .replace('Tiếc quá, không đến được', 'Rất tiếc, tôi không thể đến') : '';
      return `${panel('sh-party', `
      <h2 class="sh-h">Thông tin tiệc cưới</h2>
      <div class="sh-pblock">
        <h3 class="sh-plead">Tiệc cưới sẽ diễn ra vào lúc:</h3>
        <div class="sh-ptime"><span>${esc(time || '')}</span><span>${esc(ctx.weekday)}</span></div>
        ${dateRow(p)}
        <p class="sh-lunar">${lunarOf(ctx)}</p>
        ${marks.length ? `<div class="sh-marks">${marks.map(([k, t]) => `<div><span class="k">${k}</span><span class="t">${esc(t)}</span></div>`).join('')}</div>` : ''}
        ${cd}
        ${cal}
        <a class="sh-link" target="_blank" rel="noopener" href="${esc(link)}">Thêm vào lịch</a>
      </div>
      ${rsvp ? `<div class="sh-rsvpbtn"><button type="button" onclick="document.getElementById('shRsvp').showModal()">Xác nhận tham dự</button></div>` : ''}`,
      `${hero()}${XI('mark')}`)}
  ${rsvp ? `<dialog class="sh-dlg sh-rsvp" id="shRsvp"><button class="sh-x" type="button" aria-label="Đóng" onclick="this.closest('dialog').close()"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>${rsvp}</dialog>` : ''}`;
    },

    // nơi tổ chức tiệc (bản đồ, chỉ đường) + lịch trình ngày cưới dạng dòng thời gian trong khung kem
    events(ctx, opts, h) {
      const evs = evList(ctx.d);
      if (!evs.length) return '';
      const party = partyEvent(ctx.d);
      const at = evs.indexOf(party);
      const icons = { [at - 3]: ['ring', '💍'], [at - 2]: ['toast', '🥂'], [at - 1]: ['cake', '🎂'] }; // ba mốc ngay trước khai tiệc
      const addr = party ? [party.place, party.address].filter(Boolean).join('\n') : '';
      const q = party ? [party.place, party.address].filter(Boolean).join(', ') : '';
      const dir = party && (party.mapUrl || (q ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}` : ''));
      return `
  ${party && q ? `
  <section class="sh-sec sh-venue reveal">
    <div class="sh-in">
      <div class="sh-decor" aria-hidden="true">${flowers()}</div>
      <div class="sh-vbody">
        <div class="sh-vhead"><h3 class="sh-h">Tiệc cưới sẽ tổ chức tại</h3><p class="sh-addr">${esc(addr)}</p></div>
        <div class="sh-vmap">
          <iframe loading="lazy" title="Bản đồ" referrerpolicy="no-referrer-when-downgrade" allowfullscreen src="https://www.google.com/maps?q=${encodeURIComponent(q)}&amp;output=embed"></iframe>
          <a class="sh-dir" target="_blank" rel="noopener" href="${esc(dir)}"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><polygon points="3 11 22 2 13 21 11 13 3 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Chỉ đường</a>
        </div>
      </div>
    </div>
  </section>` : ''}
  <section class="sh-sec sh-pan sh-sched reveal">
    <div class="sh-in"><div class="sh-rel">
      <div class="sh-frame" aria-hidden="true"></div>
      <div class="sh-body">
        <h2 class="sh-h">Lịch trình ngày cưới</h2>
        <ol class="sh-tl">
          ${evs.map((e, i) => {
            const p = h.parts(e.date);
            const other = p && e.date !== ctx.date;
            const ic = icons[i];
            return `<li><span class="t"><b>${ic ? `<span class="ic ${ic[0]}"><img src="${A(ic[0] + '.webp')}" alt="" onerror="this.remove()"><em>${ic[1]}</em></span>` : ''}${esc(e.time) || '—'}</b></span><span class="dot"></span><span class="l">${esc(e.name)}${other ? ` <small>${p.d}/${p.m}</small>` : ''}</span></li>`;
          }).join('')}
        </ol>
      </div>
    </div></div>
  </section>`;
    },

    // sổ lưu bút: ô viền vàng trên nền đỏ (giữ id/tên trường cho card.js)
    wishes(ctx, opts) {
      if (!ctx.d.show.wishes) return '';
      const list = opts.wishes || [];
      return `
  <section class="sh-sec sh-guest reveal">
    <div class="sh-in">
      <div class="sh-decor" aria-hidden="true">${flowers()}</div>
      <div class="s-wishes">
        <h2 class="sh-h">Sổ lưu bút</h2>
        <form class="sh-wform" id="wishForm">
          <div class="sh-wname"><input name="name" required maxlength="60" placeholder="Nhập tên*" value="${ctx.guest ? esc(ctx.guest.name) : ''}" aria-label="Tên"></div>
          <textarea name="message" required maxlength="500" rows="4" placeholder="Nhập lời chúc*" aria-label="Lời chúc"></textarea>
          <div class="sh-wrow"><p class="form-msg" role="status"></p><button type="submit">Gửi lời chúc</button></div>
        </form>
        <div class="wish-list" id="wishList">
          ${list.map((w) => `<div class="wish"><b>${esc(w.name)}</b><p>${esc(w.message)}</p></div>`).join('')}
        </div>
      </div>
    </div>
  </section>`;
    },

    // hộp quà mừng: phong bao đỏ nổi lên xuống, chạm để mở hộp thoại mã QR của hai bên
    gift(ctx) {
      if (!ctx.d.show.gift) return '';
      const card = (p, who) => {
        if (!p.bin || !p.acc) return '';
        const qr = `https://img.vietqr.io/image/${p.bin}-${encodeURIComponent(p.acc)}-qr_only.png?accountName=${encodeURIComponent(p.holder)}&addInfo=${encodeURIComponent('Mung cuoi ' + (who === 'groom' ? ctx.g : ctx.b))}`;
        const bank = (banks.find((b) => b.bin === p.bin) || {}).name || '';
        return `
        <div class="sh-gcard">
          <h3>${who === 'groom' ? 'Chú Rể' : 'Cô Dâu'}${p.holder ? ` - ${esc(p.holder)}` : ''}</h3>
          <div class="qr"><img loading="lazy" src="${esc(qr)}" alt="Mã QR chuyển khoản" width="176" height="176"></div>
          <div class="inf"><p>${esc(bank)}</p><p class="acc"><button type="button" class="copy" data-copy="${esc(p.acc)}" aria-label="Sao chép số tài khoản">${esc(p.acc)}</button></p><p class="hd">${esc(p.holder)}</p></div>
          <a class="save" href="${esc(qr)}" target="_blank" rel="noopener" download><svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M12 3v12m0 0l-5-5m5 5l5-5M5 21h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Lưu QR</a>
        </div>`;
      };
      const html = card(ctx.d.gifts.groom, 'groom') + card(ctx.d.gifts.bride, 'bride');
      if (!html) return '';
      const env = (cls) => `<span class="env ${cls}"><img src="${A('envelope.webp')}" alt="" onerror="this.remove()"><span class="fb"><i>囍</i></span></span>`;
      return `
  <section class="sh-sec sh-giftbox reveal">
    <div class="sh-in">
      <div class="sh-decor" aria-hidden="true">${deco('cloud-pattern.webp', 'sh-cloud')}</div>
      <div class="sh-gbody">
        <h2 class="sh-h">Hộp Quà Mừng</h2>
        <button class="sh-envbtn" type="button" aria-label="Mở hộp mừng cưới" onclick="document.getElementById('shGift').showModal()">
          <span class="sh-envs"><i>✦</i><i>✦</i><i>✦</i><i>✦</i><span class="sh"></span>${env('back')}${env('front')}</span>
          <span class="hint">Nhấn để mở</span>
        </button>
      </div>
    </div>
  </section>
  <dialog class="sh-dlg sh-giftdlg" id="shGift">
    <div class="sh-dlg-head"><h2>Hộp Quà Mừng</h2><button class="sh-x" type="button" aria-label="Đóng" onclick="this.closest('dialog').close()"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>
    <div class="sh-gifts">${html}</div>
  </dialog>`;
    },

    // dòng cuối trang = lời nhắn của cô dâu chú rể
    thanks(ctx) {
      return `
  <section class="sh-sec sh-thanks reveal">
    <p>${esc(ctx.d.message || 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!')}</p>
  </section>`;
    },
  },

  css: `
.tpl-songhy2 .card{max-width:480px;background:var(--bg);color:var(--gold);font-family:var(--font-body);line-height:1.5;box-shadow:none;isolation:isolate}
.tpl-songhy2 .sec{padding:0}
.tpl-songhy2 .sh-sec{position:relative;isolation:isolate;overflow-x:clip;text-align:center}
.tpl-songhy2 .sh-in{position:relative;width:100%;max-width:441px;margin:0 auto}
.tpl-songhy2 .sh-rel{position:relative}
.tpl-songhy2 .sh-h{margin:0;font-family:'Times New Roman',Times,serif;font-weight:700;font-size:20px;line-height:1.5;letter-spacing:.02em;text-transform:uppercase;color:var(--gold)}
.tpl-songhy2 .sec-sub{margin:4px 0 0;font-size:14px}
.tpl-songhy2 .sh-xi{display:block;font-family:'PingFang SC','Hiragino Sans GB','Noto Serif SC','Songti SC',serif;font-weight:900;font-style:normal;line-height:1;text-align:center;pointer-events:none}
.tpl-songhy2 .sh-decor{position:absolute;inset:0;z-index:-1;pointer-events:none}
.tpl-songhy2 .sh-fl{position:absolute;width:274px;height:311px;max-width:none;object-fit:contain;opacity:.2}
.tpl-songhy2 .sh-fl.r{right:-62px}
.tpl-songhy2 .sh-fl.l{left:-62px;transform:scaleX(-1)}

/* ---- màn mở thiệp: nền đỏ thẫm, chữ 囍 bay lên, thiệp đỏ có dấu 囍 ---- */
.tpl-songhy2 .sh-opener{background:var(--sh-deep);overflow:hidden}
.tpl-songhy2 .sh-rise{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.tpl-songhy2 .sh-rise i{position:absolute;bottom:-30px;font-style:normal;line-height:1;opacity:0;animation:shRise 20s ease-in-out infinite}
@keyframes shRise{0%{transform:translateY(6vh) translateX(0) rotate(0);opacity:0}12%{opacity:.45}55%{transform:translateY(-42vh) translateX(var(--sway,20px)) rotate(8deg);opacity:.55}92%{opacity:.35}100%{transform:translateY(-92vh) translateX(0) rotate(0);opacity:0}}
.tpl-songhy2 .sh-ocard{position:relative;z-index:10;width:310px;max-width:calc(100vw - 32px)}
.tpl-songhy2 .sh-seal{position:absolute;left:50%;top:50px;z-index:30;width:64px;height:64px;display:grid;place-items:center;border-radius:50%;font-family:'PingFang SC','Noto Serif SC',serif;font-weight:900;font-size:44px;line-height:1;color:var(--gold);--shadow-color:rgba(255,232,164,.5);animation:shSeal 2s ease-in-out infinite}
@keyframes shSeal{0%,100%{transform:translate(-50%,-50%) scale(1);box-shadow:0 4px 20px var(--shadow-color)}50%{transform:translate(-50%,-50%) scale(1.06);box-shadow:0 6px 35px var(--shadow-color)}}
.tpl-songhy2 .sh-oface{position:relative;border-radius:8px;box-shadow:0 25px 60px -12px rgba(0,0,0,.45),0 8px 24px rgba(0,0,0,.2),0 0 40px rgba(253,203,156,.15)}
.tpl-songhy2 .sh-obg{position:absolute;inset:0;overflow:hidden;border-radius:8px;background:var(--bg);border:1px solid rgba(253,203,156,.15)}
.tpl-songhy2 .sh-obg i{position:absolute;width:220px;font-family:'PingFang SC','Noto Serif SC',serif;font-weight:900;font-style:normal;font-size:210px;line-height:1;color:var(--line);opacity:.15;transform:rotate(30deg)}
.tpl-songhy2 .sh-obg .a{top:-60px;left:-156px}
.tpl-songhy2 .sh-obg .b{bottom:-60px;right:-156px}
.tpl-songhy2 .sh-obody{position:relative;z-index:10;padding:112px 24px 56px;text-align:center}
.tpl-songhy2 .sh-onames{display:flex;flex-direction:column;align-items:center;margin:0 0 8px;font-family:'Carattere','EB Garamond','Times New Roman',serif;font-weight:400;font-size:30px;line-height:1.25;color:var(--gold)}
.tpl-songhy2 .sh-onames span{display:block;width:100%}
.tpl-songhy2 .sh-onames i{display:block;font-family:'Ms Madi','Carattere',cursive;font-style:normal;font-size:18px;line-height:1}
.tpl-songhy2 .sh-rule{display:flex;align-items:center;justify-content:center;gap:12px;margin:0 0 8px;font-size:14px;color:var(--line)}
.tpl-songhy2 .sh-rule{color:color-mix(in srgb,var(--line) 70%,transparent)}
.tpl-songhy2 .sh-rule span{width:40px;height:1px;background:linear-gradient(to right,transparent,var(--line))}
.tpl-songhy2 .sh-rule span:last-child{background:linear-gradient(to left,transparent,var(--line))}
.tpl-songhy2 .sh-odate{margin:0 0 20px;font-family:'Lora','Times New Roman',serif;font-size:18px;line-height:28px;color:rgba(255,249,230,.85)}
.tpl-songhy2 .sh-oto{margin:0 0 32px;font-family:'Lora','Times New Roman',serif;font-weight:300;font-size:18px;line-height:28px;color:rgba(255,249,230,.85)}
.tpl-songhy2 .sh-obtn{position:relative;display:flex;margin:0 auto;padding:10px 32px;overflow:hidden;border:0;border-radius:999px;background:var(--gold);color:var(--bg);font-family:'Lora','Times New Roman',serif;font-size:18px;line-height:28px;font-weight:600;box-shadow:0 4px 14px rgba(255,232,164,.35)}
.tpl-songhy2 .sh-obtn i{position:absolute;top:0;left:-100%;width:32px;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);animation:shShine 3s ease-in-out infinite}
@keyframes shShine{0%{left:-100%}50%,100%{left:100%}}
.tpl-songhy2 .sh-opener.opening .sh-ocard{animation:shAway .9s ease-in forwards}
.tpl-songhy2 .sh-opener.opening .sh-seal{animation:shBreak .6s ease-out forwards}
@keyframes shAway{0%{transform:translateY(0) rotate(0);opacity:1}15%{transform:translateY(10px) rotate(.5deg);opacity:1}100%{transform:translateY(-120vh) rotate(-2deg);opacity:0}}
@keyframes shBreak{0%{transform:translate(-50%,-50%) scale(1) rotate(0);opacity:1}30%{transform:translate(-50%,-50%) scale(1.15) rotate(5deg);opacity:.9}100%{transform:translate(-50%,-50%) scale(0) rotate(15deg);opacity:0}}
@media (prefers-reduced-motion:reduce){.tpl-songhy2 .sh-rise,.tpl-songhy2 .sh-seal,.tpl-songhy2 .sh-obtn i{animation:none}}

/* ---- bìa ---- */
.tpl-songhy2 .sh-cover{position:relative;isolation:isolate;overflow-x:clip}
.tpl-songhy2 .sh-hbox{position:relative;height:736px}
.tpl-songhy2 .sh-cream{position:absolute;left:-9px;top:-11px;z-index:-10;width:459px;height:699px;background:var(--paper)}
.tpl-songhy2 .sh-bigxi{position:absolute;left:-49px;top:-30px;z-index:-10;width:541px;height:606px;display:grid;place-items:center;font-family:'PingFang SC','Noto Serif SC',serif;font-weight:900;font-size:560px;line-height:1;color:var(--ink);opacity:.04;pointer-events:none}
.tpl-songhy2 .sh-cnames{position:absolute;left:0;right:0;top:77px;z-index:20;display:flex;align-items:flex-end;justify-content:center;gap:3px;padding:0 10px}
.tpl-songhy2 .sh-cn{display:flex;flex:1;min-width:0;flex-direction:column;align-items:center;text-align:center}
.tpl-songhy2 .sh-cn p{margin:0;color:var(--ink)}
.tpl-songhy2 .sh-cn .k{margin-bottom:5px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;line-height:16px}
.tpl-songhy2 .sh-cn .n{width:100%;font-family:'Fraunces','Times New Roman',serif;font-size:18px;line-height:27px;text-transform:uppercase;font-variation-settings:"SOFT" 0,"WONK" 1}
.tpl-songhy2 .sh-xi.ico{width:32px;height:31px;flex-shrink:0;font-size:30px;line-height:31px;color:var(--ink)}
.tpl-songhy2 .sh-photo{position:absolute;left:13.61%;top:151px;width:72.79%;aspect-ratio:321/527}
.tpl-songhy2 .sh-photo svg{display:block;width:100%;height:100%}
.tpl-songhy2 .sh-cov-ov{position:absolute;inset:0;z-index:1;pointer-events:none}
.tpl-songhy2 .sh-hero{position:absolute;left:50%;transform:translateX(-50%);max-width:none;pointer-events:none}
.tpl-songhy2 .sh-cover .sh-hero{bottom:-281px;width:155.76%;height:509px}
.tpl-songhy2 .sh-xi.lt{position:absolute;top:581px;width:163px;height:155px;font-size:150px;line-height:155px;color:var(--line);opacity:.1}
.tpl-songhy2 .sh-xi.lt.r{right:-80px}
.tpl-songhy2 .sh-xi.lt.l{left:-80px}

/* ---- khung giấy kem (border-image như bản gốc: cắt 270/240, viền 90/80px) ---- */
.tpl-songhy2 .sh-frame{position:absolute;left:4.54%;right:4.54%;top:0;bottom:0;z-index:-10;pointer-events:none;border-style:solid;border-color:transparent;border-width:90px 80px;border-image:url('${A('panel.svg')}') 270 240 fill / 90px 80px stretch}
.tpl-songhy2 .sh-ov{position:absolute;inset:0;z-index:1;pointer-events:none}
.tpl-songhy2 .sh-ov .sh-hero{width:113.4%;height:509px}
.tpl-songhy2 .sh-xi.mark{position:absolute;left:50%;width:43px;height:40px;transform:translateX(-50%);font-size:38px;line-height:40px;color:var(--ink)}
.tpl-songhy2 .sh-body{position:relative;z-index:10;display:flex;flex-direction:column;align-items:center;padding:16px 37px 0}
.tpl-songhy2 .sh-pan .sh-h{color:var(--ink)}
.tpl-songhy2 .sh-pan p,.tpl-songhy2 .sh-pan h3{margin:0}
.tpl-songhy2 .sh-date{display:flex;align-items:center;justify-content:center;gap:9px;color:var(--ink)}
.tpl-songhy2 .sh-date b{font-family:Baskerville,'Libre Baskerville','Times New Roman',serif;font-weight:400;font-size:57px;line-height:1}
.tpl-songhy2 .sh-date i{flex-shrink:0;align-self:center;width:1px;height:46px;background:var(--accent)}
.tpl-songhy2 .sh-date span{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:4px;text-align:left}
.tpl-songhy2 .sh-date em{font-family:'Times New Roman',Times,serif;font-style:normal;font-size:17px;line-height:1;text-transform:uppercase}
.tpl-songhy2 .sh-lunar{font-family:'Times New Roman',Times,serif;font-size:12px;line-height:16px;text-transform:uppercase;color:var(--muted)}

/* lời mời */
.tpl-songhy2 .sh-invite{margin-top:-11px;padding-top:34px}
.tpl-songhy2 .sh-invite .sh-frame{top:-34px}
.tpl-songhy2 .sh-invite .sh-body{padding-bottom:122px}
.tpl-songhy2 .sh-invite .sh-hero{bottom:-284px}
.tpl-songhy2 .sh-invite .sh-xi.mark{bottom:54px}
.tpl-songhy2 .sh-fams{display:grid;grid-template-columns:1fr auto 1fr;column-gap:14px;width:100%;margin-top:10px;font-family:Baskerville,'Libre Baskerville','Times New Roman',serif;color:var(--ink)}
.tpl-songhy2 .sh-fams>i{align-self:center;width:1px;height:50px;background:var(--line)}
.tpl-songhy2 .sh-fam{display:grid;row-gap:3px;justify-items:center;align-content:center;min-width:0;text-align:center}
.tpl-songhy2 .sh-fam .k{font-size:12px;line-height:18px;color:var(--muted)}
.tpl-songhy2 .sh-fam .n{font-weight:600;font-size:14px;line-height:21px;overflow-wrap:anywhere}
.tpl-songhy2 .sh-fam .a{font-size:11px;line-height:1.3;color:var(--muted)}
.tpl-songhy2 .sh-lead{margin-top:14px!important;font-family:Baskerville,'Libre Baskerville','Times New Roman',serif;font-size:16px;line-height:24px;text-transform:uppercase;color:var(--ink)}
.tpl-songhy2 .sh-couple{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;min-width:0;margin-top:12px;color:var(--ink)}
.tpl-songhy2 .sh-couple h3{display:flex;align-items:center;justify-content:center;width:100%;font-family:'Carattere',cursive;font-weight:400;font-size:40px;line-height:50px;word-spacing:.14em;white-space:nowrap}
.tpl-songhy2 .sh-amp{font-family:'Ms Madi','Carattere',cursive;font-size:35px;line-height:1}
.tpl-songhy2 .sh-evb{display:flex;flex-direction:column;align-items:center;gap:6px;width:100%;margin-top:14px;color:var(--ink)}
.tpl-songhy2 .sh-evn{font-family:Baskerville,'Libre Baskerville','Times New Roman',serif;font-size:16px;line-height:26px;text-transform:uppercase;white-space:pre-line}
.tpl-songhy2 .sh-when{display:flex;justify-content:space-between;align-items:center;column-gap:12px;width:100%;max-width:161px;min-width:max-content;font-family:'Times New Roman',Times,serif;font-size:12px;line-height:18px;text-transform:uppercase;white-space:nowrap;color:var(--muted)}
.tpl-songhy2 .sh-couple h3{margin-bottom:10px}

/* album */
.tpl-songhy2 .sh-album{margin-top:23px}
.tpl-songhy2 .sh-album .sh-fl.r{top:-17px}
.tpl-songhy2 .sh-album .sh-fl.l{top:203px}
.tpl-songhy2 .sh-albody{position:relative;z-index:10;display:flex;flex-direction:column;align-items:center;padding:35px 0}
.tpl-songhy2 .sh-album .sh-h{margin-bottom:18px}
.tpl-songhy2 .sh-cf{width:100%;max-width:414px}
.tpl-songhy2 .sh-cf-stage{position:relative;height:340px;touch-action:pan-y}
.tpl-songhy2 .sh-cf-row{position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:100%;perspective:1000px}
.tpl-songhy2 .sh-cf .ph{position:absolute;height:92%;aspect-ratio:2/3;padding:0;border:0;border-radius:16px;overflow:hidden;background:var(--sh-deep);box-shadow:0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1);cursor:pointer;transition:all 1.1s ease-in-out}
.tpl-songhy2 .sh-cf .ph.on{box-shadow:0 0 0 2px rgba(255,255,255,.3),0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1)}
.tpl-songhy2 .sh-cf .ph img{width:100%;height:100%;object-fit:cover}
.tpl-songhy2 .sh-cf-nav{display:none}
.tpl-songhy2 .sh-cf-count{margin:12px 0 0;font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;line-height:20px;font-variant-numeric:tabular-nums;opacity:.6}

/* tiệc cưới + đếm ngược + lịch */
.tpl-songhy2 .sh-party{margin-top:-9px;padding-top:32px}
.tpl-songhy2 .sh-party .sh-frame{top:-32px}
.tpl-songhy2 .sh-party .sh-body{padding-bottom:181px}
.tpl-songhy2 .sh-party .sh-h{color:var(--accent)}
.tpl-songhy2 .sh-party .sh-hero{bottom:-247px}
.tpl-songhy2 .sh-party .sh-xi.mark{bottom:108px}
.tpl-songhy2 .sh-pblock{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;margin-top:28px;font-family:Baskerville,'Libre Baskerville','Times New Roman',serif;color:var(--muted)}
.tpl-songhy2 .sh-plead{align-self:stretch;margin:0 -14px!important;font-weight:600;font-size:16px;line-height:24px;text-transform:uppercase;text-wrap:balance}
.tpl-songhy2 .sh-ptime{display:flex;justify-content:space-between;align-items:center;column-gap:12px;width:100%;max-width:155px;min-width:max-content;font-weight:600;font-size:15px;line-height:22.5px;text-transform:uppercase;white-space:nowrap}
.tpl-songhy2 .sh-party .sh-date{color:var(--accent)}
.tpl-songhy2 .sh-party .sh-lunar{font-family:Baskerville,'Libre Baskerville','Times New Roman',serif}
.tpl-songhy2 .sh-marks{display:flex;justify-content:center;gap:32px;margin-top:16px}
.tpl-songhy2 .sh-marks div{display:flex;flex-direction:column;align-items:center}
.tpl-songhy2 .sh-marks .k{font-size:11px;line-height:16.5px;text-transform:uppercase}
.tpl-songhy2 .sh-marks .t{margin-top:4px;font-weight:600;font-size:20px;line-height:30px;color:var(--accent)}
.tpl-songhy2 .sh-cd{display:flex;flex-direction:column;align-items:center;margin-top:16px}
.tpl-songhy2 .sh-cd h2{margin:12px 0 0;font-family:Baskerville,'Libre Baskerville','Times New Roman',serif;font-weight:400;font-size:20px;line-height:30px;text-transform:uppercase;color:var(--muted)}
.tpl-songhy2 .sh-cd p{margin:8px 0 0!important;font-weight:600;font-size:20px;line-height:30px}
.tpl-songhy2 .sh-cd b{font-weight:inherit}
.tpl-songhy2 .sh-calw{display:flex;align-items:center;justify-content:center;width:321px;max-width:100%;margin:28px auto 0}
.tpl-songhy2 .sh-cal{width:100%;max-width:280px;margin:0 auto;overflow:hidden;border:1px solid color-mix(in srgb,var(--accent) 27%,transparent);border-radius:8px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:11px;color:var(--accent)}
.tpl-songhy2 .sh-cal .hd{padding:10px 0;border-bottom:1px solid color-mix(in srgb,var(--accent) 27%,transparent);font-family:'The Nautigal',cursive;font-weight:600;font-size:25px;line-height:1;letter-spacing:.025em;text-align:center}
.tpl-songhy2 .sh-cal .wk,.tpl-songhy2 .sh-cal .gr{display:grid;grid-template-columns:repeat(7,1fr)}
.tpl-songhy2 .sh-cal .wk{border-bottom:2px solid var(--accent)}
.tpl-songhy2 .sh-cal .wk i{padding:6px 0;font-style:normal;font-weight:500;font-size:10px;line-height:15px;text-align:center;opacity:.6}
.tpl-songhy2 .sh-cal .gr{row-gap:2px;padding:8px 4px}
.tpl-songhy2 .sh-cal .gr i{display:flex;align-items:center;justify-content:center;height:30px;font-style:normal;font-size:12px;line-height:16px}
.tpl-songhy2 .sh-cal .gr .on b{position:relative;display:flex;align-items:center;justify-content:center;width:26px;height:24px;font-size:11px;line-height:16px;font-weight:700;color:var(--paper)}
.tpl-songhy2 .sh-cal .gr .on b::before{content:"";position:absolute;inset:0;z-index:-1;background:var(--accent);-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 30'%3E%3Cpath d='M16 29C6 21 0 15 0 8.5 0 3.8 3.7 0 8.3 0c3 0 5.8 1.6 7.7 4.2C17.9 1.6 20.7 0 23.7 0 28.3 0 32 3.8 32 8.5 32 15 26 21 16 29z'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 30'%3E%3Cpath d='M16 29C6 21 0 15 0 8.5 0 3.8 3.7 0 8.3 0c3 0 5.8 1.6 7.7 4.2C17.9 1.6 20.7 0 23.7 0 28.3 0 32 3.8 32 8.5 32 15 26 21 16 29z'/%3E%3C/svg%3E") center/contain no-repeat}
.tpl-songhy2 .sh-cal .gr .on b{isolation:isolate}
.tpl-songhy2 .sh-link{margin-top:28px;font-family:'Times New Roman',Times,serif;font-size:14px;line-height:20px;color:var(--muted);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px}
.tpl-songhy2 .sh-rsvpbtn{position:relative;z-index:10;display:flex;justify-content:center;width:100%;margin-top:20px}
.tpl-songhy2 .sh-rsvpbtn button{padding:8px 20px;border:0;border-radius:7px;background:var(--accent);color:var(--paper);font-family:'Times New Roman',Times,serif;font-weight:600;font-size:14px;line-height:20px;letter-spacing:.05em;text-transform:uppercase;transition:transform .15s}
.tpl-songhy2 .sh-rsvpbtn button:hover{transform:scale(1.03)}

/* nơi tổ chức */
.tpl-songhy2 .sh-venue{margin-top:23px}
.tpl-songhy2 .sh-venue .sh-fl.r{top:-37px}
.tpl-songhy2 .sh-venue .sh-fl.l{top:233px}
.tpl-songhy2 .sh-vbody{position:relative;z-index:10;display:flex;flex-direction:column;align-items:center;gap:12px;padding:24px 51px}
.tpl-songhy2 .sh-vhead .sh-h{margin:0 -35px;font-size:18px;line-height:27px;text-wrap:balance}
.tpl-songhy2 .sh-addr{max-width:247px;margin:12px auto 0;padding-bottom:12px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;line-height:18px;white-space:pre-line;color:var(--gold)}
.tpl-songhy2 .sh-vmap{display:flex;flex-direction:column;align-items:center;gap:16px;width:100%}
.tpl-songhy2 .sh-vmap iframe{display:block;width:100%;max-width:338px;height:267px;border:0;border-radius:15px;background:var(--sh-deep)}
.tpl-songhy2 .sh-dir{display:inline-flex;align-items:center;gap:8px;padding:8px 20px;border-radius:999px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:600;font-size:14px;line-height:20px;color:var(--gold);text-decoration:none;transition:transform .15s}
.tpl-songhy2 .sh-dir:hover{transform:scale(1.03)}

/* lịch trình: lưới giờ | chấm | tên; vạch dọc nối từ chấm đầu tới chấm cuối */
.tpl-songhy2 .sh-sched{margin-top:18px;margin-bottom:-12px;padding:5px 0 12px}
.tpl-songhy2 .sh-sched .sh-frame{top:-5px;bottom:-12px}
.tpl-songhy2 .sh-sched .sh-body{max-width:414px;margin:0 auto;gap:13px;padding:53px 38px 37px}
.tpl-songhy2 .sh-sched .sh-h{color:var(--accent)}
.tpl-songhy2 .sh-tl{--gy:32px;display:grid;grid-template-columns:minmax(0,1fr) 16px minmax(0,1fr);align-items:center;column-gap:24px;row-gap:var(--gy);width:100%;max-width:460px;margin:0 auto;padding:0;list-style:none;font-family:'Times New Roman',Times,serif;font-size:13px;line-height:19.5px;color:var(--accent)}
.tpl-songhy2 .sh-tl li{display:contents}
.tpl-songhy2 .sh-tl .t{padding-top:2px;text-align:right;letter-spacing:.025em;line-height:1.375;font-variant-numeric:tabular-nums}
.tpl-songhy2 .sh-tl .t b{position:relative;display:inline-block;font-weight:400}
.tpl-songhy2 .sh-tl .ic{position:absolute;right:100%;top:50%;display:flex;align-items:center;justify-content:center;margin-right:36px;transform:translateY(-50%)}
.tpl-songhy2 .sh-tl .ic img{max-width:none;object-fit:contain}
.tpl-songhy2 .sh-tl .ic.ring img{width:32px;height:22px}
.tpl-songhy2 .sh-tl .ic.toast img,.tpl-songhy2 .sh-tl .ic.cake img{width:30px;height:32px}
.tpl-songhy2 .sh-tl .ic em{font-style:normal;font-size:22px;line-height:1}
.tpl-songhy2 .sh-tl .ic:has(img) em{display:none}
.tpl-songhy2 .sh-tl .dot{position:relative;align-self:stretch;display:flex;align-items:center;justify-content:center}
.tpl-songhy2 .sh-tl .dot::before{content:"";position:absolute;left:50%;width:1px;top:calc(-1 * var(--gy));bottom:calc(-1 * var(--gy));transform:translateX(-50%);background:color-mix(in srgb,var(--accent) 40%,transparent)}
.tpl-songhy2 .sh-tl li:first-child .dot::before{top:50%}
.tpl-songhy2 .sh-tl li:last-child .dot::before{bottom:50%}
.tpl-songhy2 .sh-tl li:only-child .dot::before{display:none}
.tpl-songhy2 .sh-tl .dot::after{content:"";position:relative;width:10px;height:10px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 13%,transparent)}
.tpl-songhy2 .sh-tl .l{text-align:left}
.tpl-songhy2 .sh-tl small{font-size:inherit;opacity:.8}

/* sổ lưu bút */
.tpl-songhy2 .sh-guest{margin-top:23px}
.tpl-songhy2 .sh-guest .sh-fl.r{top:-67px}
.tpl-songhy2 .sh-guest .sh-fl.l{top:203px}
.tpl-songhy2 .s-wishes{position:relative;z-index:10;padding:40px 37px 30px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:var(--gold);text-align:left}
.tpl-songhy2 .s-wishes .sh-h{margin-bottom:22px;text-align:center}
.tpl-songhy2 .sh-wform{display:flex;flex-direction:column;gap:22px;width:100%;margin:24px auto 0;padding-right:8px}
.tpl-songhy2 .sh-wname{margin-bottom:16px}
.tpl-songhy2 .sh-wform input,.tpl-songhy2 .sh-wform textarea{display:block;width:100%;padding:8px 10px;border:1px solid var(--gold);border-radius:6px;background:transparent;color:var(--gold);font:400 16px/24px 'Helvetica Neue',Helvetica,Arial,sans-serif;outline:none;resize:none}
.tpl-songhy2 .sh-wform ::placeholder{color:color-mix(in srgb,var(--gold) 65%,transparent)}
.tpl-songhy2 .sh-wrow{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:16px;font-size:12px}
.tpl-songhy2 .sh-wrow .form-msg{flex:1;margin:0;font-size:12px}
.tpl-songhy2 .sh-wrow button{padding:6px 16px;border:0;border-radius:7px;background:var(--gold);color:var(--accent);font:400 13px/1.3333 'Times New Roman',Times,serif;text-transform:uppercase;transition:transform .15s}
.tpl-songhy2 .sh-wrow button:hover{transform:scale(1.05)}
.tpl-songhy2 .wish-list{display:flex;flex-direction:column;gap:12px;width:100%;max-height:500px;margin:32px auto 0;padding-right:8px;overflow-y:auto}
.tpl-songhy2 .wish{margin:0;padding:16px;border:1px solid rgba(255,232,164,.4);border-radius:12px;background:rgba(255,255,255,.08);box-shadow:0 1px 3px rgba(0,0,0,.1),0 1px 2px -1px rgba(0,0,0,.1);font-size:14px;line-height:20px;color:var(--gold)}
.tpl-songhy2 .wish b{display:block;font-weight:600;color:var(--gold)}
.tpl-songhy2 .wish p{margin:8px 0 0;line-height:1.625;color:var(--gold)}

/* hộp quà mừng */
.tpl-songhy2 .sh-giftbox{margin-top:23px}
.tpl-songhy2 .sh-cloud{position:absolute;bottom:-38%;left:-191px;width:824px;height:239px;max-width:none;object-fit:contain;opacity:.4}
.tpl-songhy2 .sh-gbody{position:relative;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 37px 24px}
.tpl-songhy2 .sh-giftbox .sh-h{margin-bottom:16px}
.tpl-songhy2 .sh-envbtn{position:relative;display:flex;align-items:flex-end;justify-content:center;width:250px;height:357px;padding:0 0 48px;border:0;background:none;outline:none;cursor:pointer}
/* hai phong bao chồng nhau (theo bản gốc): bao trước xoay -10° nổi lên xuống, bao sau lật ngang thu 80% */
.tpl-songhy2 .sh-envs{position:relative;display:block;width:190px;height:275px}
.tpl-songhy2 .sh-envs .env{position:absolute;inset:0;display:block}
.tpl-songhy2 .sh-envs .env img{width:100%;height:100%;object-fit:contain;object-position:center bottom}
.tpl-songhy2 .sh-envs .fb{position:absolute;left:12%;right:12%;bottom:0;height:86%;display:grid;place-items:center;overflow:hidden;border:1px solid #e6d5bd;border-radius:10px;background:#fbf4e6}
/* phong bao kem có nắp tam giác và chữ 囍 đỏ (thay ảnh phong bao của bản gốc khi chưa có file) */
.tpl-songhy2 .sh-envs .fb::before{content:"";position:absolute;left:0;right:0;top:0;height:40%;background:#f3e7d2;clip-path:polygon(0 0,100% 0,50% 100%);filter:drop-shadow(0 2px 2px rgba(0,0,0,.15))}
.tpl-songhy2 .sh-envs .fb i{position:relative;font-family:'PingFang SC','Noto Serif SC',serif;font-weight:900;font-style:normal;font-size:46px;line-height:1;color:#b3141c}
.tpl-songhy2 .sh-envs .env:has(img) .fb{display:none}
.tpl-songhy2 .sh-envs .front{z-index:2;rotate:-10deg;transform-origin:50% 92%;filter:drop-shadow(0 10px 18px rgba(0,0,0,.22));animation:shFloatMain 3s ease-in-out infinite}
.tpl-songhy2 .sh-envs .back{z-index:1;transform-origin:50% 100%;transform:translateX(20%) translateY(-10%) scale(-.8,.8) rotate(-15deg);filter:drop-shadow(0 8px 14px rgba(0,0,0,.18));animation:shFloat 5.2s ease-in-out .5s infinite}
.tpl-songhy2 .sh-envbtn:hover .front,.tpl-songhy2 .sh-envbtn:focus-visible .front{animation:shFloatMain 3s ease-in-out infinite,shWave 1.1s ease-in-out infinite;scale:1.12}
.tpl-songhy2 .sh-envs .sh{position:absolute;left:50%;bottom:-6px;z-index:0;width:125.4px;height:11px;margin-left:-62.7px;border-radius:50%;background:rgba(0,0,0,.45);filter:blur(4px);animation:shShadow 3s ease-in-out infinite}
.tpl-songhy2 .sh-envs>i{position:absolute;z-index:3;font-style:normal;color:var(--paper);opacity:0;animation:shSpark 2s ease-in-out infinite}
.tpl-songhy2 .sh-envbtn .sh-envs>i:nth-child(1){top:6%;left:12%;font-size:20.9px}
.tpl-songhy2 .sh-envbtn .sh-envs>i:nth-child(2){top:14%;right:8%;font-size:15.2px;animation-delay:.6s}
.tpl-songhy2 .sh-envbtn .sh-envs>i:nth-child(3){top:34%;left:3%;font-size:13.3px;animation-delay:1.2s}
.tpl-songhy2 .sh-envbtn .sh-envs>i:nth-child(4){top:24%;right:3%;font-size:13.3px;animation-delay:1.7s}
.tpl-songhy2 .sh-envbtn .sh-envs>i{position:absolute}
@keyframes shFloat{0%,100%{translate:0 0}50%{translate:0 -7px}}
@keyframes shFloatMain{0%,100%{translate:-15% 0}50%{translate:-15% -7px}}
@keyframes shShadow{0%,100%{transform:scaleX(1);opacity:.28}50%{transform:scaleX(.9);opacity:.16}}
@keyframes shSpark{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1.15)}}
@keyframes shWave{0%,100%{rotate:-10deg}20%{rotate:-16deg}40%{rotate:-5.5deg}60%{rotate:-13deg}80%{rotate:-8.5deg}}
@keyframes shHint{0%,100%{opacity:.45}50%{opacity:1}}
.tpl-songhy2 .sh-envbtn .hint{position:absolute;left:50%;bottom:0;transform:translateX(-50%);white-space:nowrap;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;line-height:16px;font-weight:500;color:var(--gold);animation:shHint 2s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.tpl-songhy2 .sh-envs *{animation:none!important}}

/* hộp thoại (xác nhận tham dự, quà mừng) */
.tpl-songhy2 .sh-dlg{padding:0;border:0;overflow:auto}
.tpl-songhy2 .sh-x{position:absolute;top:16px;right:16px;z-index:1;display:flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border:0;border-radius:50%;background:#f3f4f6;color:#6b7280}
.tpl-songhy2 .sh-rsvp{width:min(448px,calc(100% - 32px));max-width:none;max-height:85vh;padding-top:40px;border-radius:16px;background:#fff;color:#111827;box-shadow:0 25px 50px -12px rgba(0,0,0,.25);font-family:Montserrat,ui-sans-serif,system-ui,sans-serif}
.tpl-songhy2 .sh-rsvp::backdrop{background:rgba(0,0,0,.6);backdrop-filter:blur(4px)}
.tpl-songhy2 .sh-rsvp .s-rsvp{padding:0 24px 24px;text-align:left}
.tpl-songhy2 .sh-rsvp .sh-h{margin:0 0 4px;font-family:inherit;font-size:20px;line-height:28px;font-weight:600;letter-spacing:0;text-transform:none;color:#111827}
.tpl-songhy2 .sh-rsvp .sec-sub{margin:0 0 24px;font-size:14px;line-height:20px;color:#6b7280}
.tpl-songhy2 .sh-rsvp .form{gap:16px;padding:0;border:0;border-radius:0;background:none;font-family:inherit}
.tpl-songhy2 .sh-rsvp .form label,.tpl-songhy2 .sh-rsvp .sh-q{display:block;margin:0;font-size:14px;line-height:20px;font-weight:500;color:#374151}
.tpl-songhy2 .sh-rsvp .sh-q{margin-bottom:-8px}
.tpl-songhy2 .sh-rsvp .form input:not([type=radio]),.tpl-songhy2 .sh-rsvp .form select{display:block;width:100%;margin-top:6px;padding:12px 16px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;font:400 16px/24px inherit;font-family:inherit;color:#111827}
.tpl-songhy2 .sh-rsvp .choice{gap:8px}
.tpl-songhy2 .sh-rsvp .choice label{display:flex;align-items:center;gap:12px;padding:10px 12px;border:2px solid #f3f4f6;border-radius:12px;background:rgba(249,250,251,.5);font-size:14px;font-weight:500;color:#374151}
.tpl-songhy2 .sh-rsvp .choice input{position:absolute;opacity:0;width:1px;height:1px}
.tpl-songhy2 .sh-rsvp .choice span::before{content:"✓";display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;margin-right:12px;vertical-align:middle;border-radius:50%;background:#e5e7eb;color:#6b7280;font-size:14px}
.tpl-songhy2 .sh-rsvp .choice label+label span::before{content:"✕"}
.tpl-songhy2 .sh-rsvp .choice label:has(input:checked){border-color:#10b981;background:rgba(236,253,245,.5);color:#047857}
.tpl-songhy2 .sh-rsvp .choice label:has(input:checked) span::before{background:#10b981;color:#fff}
.tpl-songhy2 .sh-rsvp .row2{gap:12px}
.tpl-songhy2 .sh-rsvp .form-msg{margin:0;font-size:13px}
.tpl-songhy2 .sh-rsvp .form-msg:empty{display:none}
.tpl-songhy2 .sh-rsvp .btn{width:100%;padding:14px;border:0;border-radius:12px;background:var(--accent);color:var(--paper);font-family:inherit;font-size:14px;line-height:20px;font-weight:600;box-shadow:0 4px 12px -2px rgba(0,0,0,.2)}
.tpl-songhy2 .sh-giftdlg{margin:auto auto 0;width:100%;max-width:none;max-height:90vh;border-radius:16px 16px 0 0;background:var(--sh-dlg);color:var(--gold);font-family:Montserrat,ui-sans-serif,system-ui,sans-serif}
.tpl-songhy2 .sh-giftdlg::backdrop{background:rgba(0,0,0,.4)}
.tpl-songhy2 .sh-dlg-head{position:relative;padding:24px 24px 16px;background:var(--gold);text-align:center}
.tpl-songhy2 .sh-dlg-head h2{margin:0;font:700 20px/30px 'Times New Roman',Times,serif;letter-spacing:.02em;text-transform:uppercase;color:#fff;text-shadow:1px 1px 2px rgba(0,0,0,.2)}
.tpl-songhy2 .sh-dlg-head .sh-x{top:12px;right:12px;background:none;color:rgba(255,255,255,.8)}
.tpl-songhy2 .sh-gifts{display:flex;flex-direction:column;align-items:center;gap:16px;padding:16px}
.tpl-songhy2 .sh-gcard{display:flex;flex:1;flex-direction:column;align-items:center;max-width:180px;text-align:center}
.tpl-songhy2 .sh-gcard h3{margin:0 0 12px;font-size:14px;line-height:20px;font-weight:500;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.tpl-songhy2 .sh-gcard .qr{display:flex;align-items:center;justify-content:center;width:176px;height:176px;padding:8px;border:2px solid rgba(255,232,164,.125);border-radius:12px;background:#fff;box-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1)}
.tpl-songhy2 .sh-gcard .qr img{width:100%;height:100%;object-fit:contain}
.tpl-songhy2 .sh-gcard .inf{margin-top:12px}
.tpl-songhy2 .sh-gcard .inf p{margin:2px 0 0;font-size:12px;line-height:16px}
.tpl-songhy2 .sh-gcard .acc button{padding:0;border:0;background:none;color:inherit;font:inherit;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;cursor:copy}
.tpl-songhy2 .sh-gcard .hd{font-weight:600}
.tpl-songhy2 .sh-gcard .save{display:inline-flex;align-items:center;gap:4px;margin-top:8px;padding:6px 12px;border-radius:999px;background:rgba(255,232,164,.082);font-size:12px;line-height:16px;font-weight:500;color:var(--gold);text-decoration:none}

.tpl-songhy2 .sh-thanks{margin-top:23px;display:flex;flex-direction:column;align-items:center;padding:23px 37px 0}
.tpl-songhy2 .sh-thanks p{margin:0 auto;padding:0 8px;white-space:pre-line;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;line-height:1.625;color:var(--gold)}
.tpl-songhy2 .s-story{position:relative;z-index:1;padding:32px 37px;font-family:'Times New Roman',serif;font-size:16px;color:var(--gold)}
.tpl-songhy2 .credit{padding:39px 0 24px;font-size:12px;line-height:16px;opacity:.5;color:var(--gold)}
.tpl-songhy2 .credit a{color:inherit}

@media (min-width:640px){
  .tpl-songhy2 .sh-ocard{width:340px}
  .tpl-songhy2 .sh-onames{font-size:36px;line-height:1.25}
  .tpl-songhy2 .sh-onames i{font-size:20px}
  .tpl-songhy2 .sh-obtn{font-weight:500}
  .tpl-songhy2 .sh-wform input,.tpl-songhy2 .sh-wform textarea{font-size:10px;line-height:15px}
  .tpl-songhy2 .sh-giftdlg{margin:auto;width:91.6667%;max-width:576px;border-radius:16px}
  .tpl-songhy2 .sh-gifts{flex-direction:row;flex-wrap:wrap;align-items:flex-start;justify-content:center;padding:24px}
  .tpl-songhy2 .sh-gcard{max-width:none}
  .tpl-songhy2 .sh-gcard .qr{width:192px;height:192px}
}
/* màn hình rộng: cột 900px có viền mảnh, khối nội dung rộng 600px, cỡ chữ & khoảng cách ×1.36 như bản gốc */
@media (min-width:768px){
  .tpl-songhy2 .card{max-width:900px;border:1px solid rgba(255,232,164,.2)}
  .tpl-songhy2 .sh-in{max-width:600px}
  .tpl-songhy2 .sh-h{font-size:27px;line-height:40.5px}
  .tpl-songhy2 .sh-fl{width:373px;height:423px}
  .tpl-songhy2 .sh-fl.r{right:-153px}
  .tpl-songhy2 .sh-fl.l{left:-153px}
  .tpl-songhy2 .sh-ocard{width:520px}
  .tpl-songhy2 .sh-obg i{width:300px;font-size:290px}
  .tpl-songhy2 .sh-obg .b{bottom:-104px;right:-143px}
  .tpl-songhy2 .sh-obody{padding:96px 24px 32px}
  .tpl-songhy2 .sh-hbox{height:1001px}
  .tpl-songhy2 .sh-cream{left:-12px;top:-15px;width:625px;height:951px}
  .tpl-songhy2 .sh-bigxi{left:-67px;top:-41px;width:736px;height:824px;font-size:760px}
  .tpl-songhy2 .sh-cnames{top:105px;gap:4px;padding:0 14px}
  .tpl-songhy2 .sh-cn .k{margin-bottom:7px;font-size:16px;line-height:22px}
  .tpl-songhy2 .sh-cn .n{font-size:24px;line-height:37px}
  .tpl-songhy2 .sh-xi.ico{width:44px;height:42px;font-size:41px;line-height:42px}
  .tpl-songhy2 .sh-photo{top:205px}
  .tpl-songhy2 .sh-cover .sh-hero{bottom:-550px;width:224.39%;height:992px}
  .tpl-songhy2 .sh-xi.lt{top:790px;width:222px;height:211px;font-size:205px;line-height:211px}
  .tpl-songhy2 .sh-xi.lt.r{right:-109px}
  .tpl-songhy2 .sh-xi.lt.l{left:-109px}
  .tpl-songhy2 .sh-frame{border-width:122px 109px;border-image-width:122px 109px}
  .tpl-songhy2 .sh-ov .sh-hero{width:163.33%;height:992px}
  .tpl-songhy2 .sh-xi.mark{width:59px;height:54px;font-size:52px;line-height:54px}
  .tpl-songhy2 .sh-body{padding:22px 50px 0}
  .tpl-songhy2 .sh-date{gap:12px}
  .tpl-songhy2 .sh-date b{font-size:78px}
  .tpl-songhy2 .sh-date i{height:63px}
  .tpl-songhy2 .sh-date em{font-size:23px}
  .tpl-songhy2 .sh-lunar{font-size:14px;line-height:20px}
  .tpl-songhy2 .sh-invite{margin-top:-15px;padding-top:46px}
  .tpl-songhy2 .sh-invite .sh-frame{top:-46px}
  .tpl-songhy2 .sh-invite .sh-body{padding-bottom:166px}
  .tpl-songhy2 .sh-invite .sh-hero{bottom:-550px}
  .tpl-songhy2 .sh-invite .sh-xi.mark{bottom:83px}
  .tpl-songhy2 .sh-fams{margin-top:14px;column-gap:19px}
  .tpl-songhy2 .sh-fams>i{height:68px}
  .tpl-songhy2 .sh-fam .k{font-size:16px;line-height:24px}
  .tpl-songhy2 .sh-fam .n{font-size:15px;line-height:22.5px}
  .tpl-songhy2 .sh-lead{max-width:560px;margin:19px auto 0!important;font-size:20px;line-height:30px}
  .tpl-songhy2 .sh-couple{margin-top:16px}
  .tpl-songhy2 .sh-couple h3{font-size:64px;line-height:100px}
  .tpl-songhy2 .sh-amp{font-size:48px}
  .tpl-songhy2 .sh-evb{margin-top:19px}
  .tpl-songhy2 .sh-evn{font-size:20px;line-height:32.5px}
  .tpl-songhy2 .sh-when{max-width:219px;font-size:16px;line-height:24px}
  .tpl-songhy2 .sh-album{margin-top:31px}
  .tpl-songhy2 .sh-album .sh-fl.r{top:-23px}
  .tpl-songhy2 .sh-album .sh-fl.l{top:276px}
  .tpl-songhy2 .sh-cf{max-width:563px}
  .tpl-songhy2 .sh-cf-stage{height:520px}
  .tpl-songhy2 .sh-cf-nav{position:absolute;top:50%;z-index:200;display:flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border:0;border-radius:50%;background:rgba(29,35,42,.6);color:#ecf9ff;transform:translateY(-50%);transition:background .15s}
  .tpl-songhy2 .sh-cf-nav:hover{background:rgb(29,35,42)}
  .tpl-songhy2 .sh-cf-nav.prev{left:0}
  .tpl-songhy2 .sh-cf-nav.next{right:0}
  .tpl-songhy2 .sh-party{margin-top:-13px;padding-top:44px}
  .tpl-songhy2 .sh-party .sh-frame{top:-44px}
  .tpl-songhy2 .sh-party .sh-body{padding-bottom:246px}
  .tpl-songhy2 .sh-party .sh-hero{bottom:-529px}
  .tpl-songhy2 .sh-party .sh-xi.mark{bottom:139px}
  .tpl-songhy2 .sh-pblock{margin-top:38px}
  .tpl-songhy2 .sh-plead{margin:0!important;font-size:20px;line-height:30px}
  .tpl-songhy2 .sh-ptime{max-width:211px;font-size:20px;line-height:30px}
  .tpl-songhy2 .sh-marks .t{font-size:27px;line-height:40.5px}
  .tpl-songhy2 .sh-cd h2,.tpl-songhy2 .sh-cd p{font-size:27px;line-height:40.5px}
  .tpl-songhy2 .sh-calw{width:437px}
  .tpl-songhy2 .sh-cal{max-width:310px;font-size:15px}
  .tpl-songhy2 .sh-cal .hd{font-size:34px}
  .tpl-songhy2 .sh-cal .wk i{font-size:11px;line-height:16.5px}
  .tpl-songhy2 .sh-cal .gr i{height:34px;font-size:13px;line-height:19.5px}
  .tpl-songhy2 .sh-cal .gr .on b{width:30px;height:28px;font-size:12px}
  .tpl-songhy2 .sh-link{font-size:19px;line-height:28.5px}
  .tpl-songhy2 .sh-rsvpbtn button{font-size:16px;line-height:24px}
  .tpl-songhy2 .sh-venue{margin-top:31px}
  .tpl-songhy2 .sh-venue .sh-fl.r{top:-50px}
  .tpl-songhy2 .sh-venue .sh-fl.l{top:317px}
  .tpl-songhy2 .sh-vbody{gap:16px;padding:33px 70px}
  .tpl-songhy2 .sh-vhead .sh-h{margin:0 auto;font-size:24px;line-height:36px}
  .tpl-songhy2 .sh-addr{max-width:336px;font-size:16px;line-height:24px}
  .tpl-songhy2 .sh-vmap{gap:20px}
  .tpl-songhy2 .sh-vmap iframe{max-width:460px;height:363px}
  .tpl-songhy2 .sh-dir{font-size:16px;line-height:24px}
  .tpl-songhy2 .sh-sched{margin-top:24px;margin-bottom:-16px;padding:7px 0 16px}
  .tpl-songhy2 .sh-sched .sh-frame{top:-7px;bottom:-16px}
  .tpl-songhy2 .sh-sched .sh-body{max-width:563px;padding:59px 52px 37px}
  .tpl-songhy2 .sh-tl{--gy:40px;column-gap:32px;font-size:18px;line-height:27px}
  .tpl-songhy2 .sh-tl .ic.ring img{width:44px;height:30px}
  .tpl-songhy2 .sh-tl .ic.toast img,.tpl-songhy2 .sh-tl .ic.cake img{width:41px;height:44px}
  .tpl-songhy2 .sh-tl .ic em{font-size:30px}
  .tpl-songhy2 .sh-guest{margin-top:31px}
  .tpl-songhy2 .sh-guest .sh-fl.r{top:-91px}
  .tpl-songhy2 .sh-guest .sh-fl.l{top:276px}
  .tpl-songhy2 .s-wishes{padding:40px 50px 30px}
  .tpl-songhy2 .sh-wform,.tpl-songhy2 .wish-list{max-width:600px}
  .tpl-songhy2 .sh-wform input,.tpl-songhy2 .sh-wform textarea{font-size:13px;line-height:19.5px}
  .tpl-songhy2 .sh-wrow button{font-size:18px}
  .tpl-songhy2 .sh-giftbox{margin-top:31px}
  .tpl-songhy2 .sh-cloud{left:-260px;width:1121px;height:325px}
  .tpl-songhy2 .sh-gbody{padding:32px 50px}
  .tpl-songhy2 .sh-thanks{margin-top:31px;padding:23px 50px 0}
  .tpl-songhy2 .sh-thanks p{max-width:560px;font-size:15px}
}
@media (min-width:1024px){
  .tpl-songhy2 .sh-ocard{width:600px}
}
`,
};
