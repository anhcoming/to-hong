// Mẫu "Tơ Duyên" — tối giản trên nền trắng: chữ xanh lá, hoa rum trắng và dải lụa xanh vắt ngang giữa các phần.
// Kích thước lấy theo bản gốc (Tailwind): số đầu cho điện thoại, khối @media (min-width:768px) cho màn rộng.
const { esc } = require('../lib/util');

const A = (n) => `/demo/toduyen-${n}.webp`; // ảnh trang trí của mẫu

const base = {
  '--font-title': "'Carattere',cursive",
  '--font-script': "'Whisper',cursive",
  '--font-body': "Baskerville,'Libre Baskerville','Times New Roman',serif", // Baskerville có sẵn trên máy Apple như bản gốc
};

const evList = (d) => d.events.filter((e) => e.name || e.place);
// sự kiện chính của tiệc (khung "Thông tin tiệc cưới", bản đồ) — giống mẫu Đỏ Đậm
function partyEvent(d) {
  const evs = evList(d);
  return evs.find((e) => /khai tiệc|tiệc cưới/i.test(e.name)) || evs.find((e) => /tiệc/i.test(e.name)) || evs[evs.length - 1] || null;
}
// lễ cưới ở khung lời mời = sự kiện đầu tiên không phải tiệc
const ceremony = (d) => { const p = partyEvent(d); return evList(d).find((e) => e !== p) || p; };

// trang trí: ảnh nằm tuyệt đối, data-px = biên độ trôi khi cuộn (px)
const deco = (cls, name, px) => `<img class="td-d ${cls}" src="${A(name)}" alt=""${px ? ` data-px="${px}"` : ''}>`;
const decos = (...imgs) => `<div class="td-decos" aria-hidden="true">${imgs.join('')}</div>`;

// ngày | tháng-năm (cùng một kiểu ở lời mời và tiệc cưới)
const dateRow = (p) => `<div class="td-date"><b>${+p.d}</b><i></i><span><em>Tháng ${+p.m}</em><em>${p.y}</em></span></div>`;
const lunar = (ctx) => `<p class="td-lunar">(Tức ${esc(ctx.lunar.replace(/^Nhằm /i, ''))})</p>`;

// giờ gửi lời chúc như bản gốc: 10:12:58 17/9/2026
function wishTime(ts) {
  if (!ts) return '';
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false, year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    .formatToParts(new Date(ts)).map((x) => [x.type, x.value]));
  return `${p.hour}:${p.minute}:${p.second} ${p.day}/${p.month}/${p.year}`;
}

const SUGGEST = [
  'Chúc hai bạn trăm năm hạnh phúc, mãi mãi bên nhau!',
  'Chúc hai bạn một hành trình thật dài và thật nhiều tiếng cười.',
  'Chúc cô dâu chú rể luôn khoẻ mạnh, sớm có tin vui nha!',
  'Chúc hai bạn luôn nắm tay nhau đi qua mọi mùa trong đời.',
  'Chúc hai bạn mãi ngọt ngào như ngày đầu gặp nhau.',
];

// cánh hoa rơi trên màn mở thiệp (vị trí / cỡ / nhịp cố định để trang không đổi mỗi lần tải)
const PETALS = [[84, 20, -26, 18.5, -15.5, 0], [77, 15, -30, 18.3, -7.4, 1], [91, 11, 17, 23.4, -16, 0], [6, 13, -11, 20.6, -17.9, 1], [63, 13, -26, 24.1, -9.7, 1], [18, 17, 22, 19.2, -3.1, 0], [35, 12, -14, 21.7, -12.2, 1], [50, 18, 25, 17.6, -5.8, 0], [70, 10, 12, 22.9, -1.4, 1], [26, 14, -21, 25.3, -19.6, 0], [44, 16, 9, 20.1, -14.1, 1], [96, 12, -18, 18.9, -10.5, 0]];
const PETAL = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><g>' + [0, 60, 120, 180, 240, 300].map((r) => `<ellipse cx="12" cy="5" rx="2.2" ry="4.5" transform="rotate(${r} 12 12)"/>`).join('') + '<circle cx="12" cy="12" r="2"/></g></svg>';

module.exports = {
  id: 'toduyen',
  name: 'Tơ Duyên',
  group: 'chatlieu',
  badge: 'Hot', // nhãn trên thẻ ở bộ sưu tập trang chủ
  desc: 'Tối giản trên nền trắng: chữ xanh lá, hoa rum trắng và dải lụa xanh vắt ngang các phần',
  fonts: 'https://fonts.googleapis.com/css2?family=Carattere&family=Whisper&family=Aguafina+Script&family=Uchen&family=The+Nautigal:wght@400;700&family=Lora:wght@300;400;500;600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Roboto:wght@300;400&display=swap',
  palettes: [
    { id: 'xanh-la', name: 'Xanh lá', swatch: ['#ffffff', '#5e813c'], vars: { ...base, '--page': '#ffffff', '--bg': '#ffffff', '--paper': '#ffffff', '--ink': '#5e813c', '--muted': '#1a3500', '--accent': '#5e813c', '--accent-ink': '#fefbf4', '--gold': '#d1db9c', '--line': '#e3ecd2', '--td-dark': '#1a3500', '--td-light': '#d1db9c', '--td-petal': '#a8bd7d', '--td-seal': '#40631e', '--td-o1': '#f2f6ea', '--td-o2': '#e3ecd2' } },
  ],
  // dữ liệu xem thử theo bản gốc (lễ thành hôn tại tư gia, tiệc tối ở Đà Lạt); tên cô dâu chú rể & bố mẹ giữ theo sample()
  demo: {
    date: '2026-12-19',
    time: '18:30',
    message: 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!',
    story: '',
    cover: '/demo/toduyen-cover1.jpg',
    photos: [1, 2, 3, 4, 5, 6, 7].map((n) => `/demo/toduyen-${n}.webp`),
    events: [
      { name: 'Lễ thành hôn', date: '2026-12-19', time: '09:30', place: 'Tư gia', address: '', mapUrl: '' },
      { name: 'Đón khách', date: '2026-12-19', time: '17:30', place: '', address: '', mapUrl: '' },
      { name: 'Khai tiệc', date: '2026-12-19', time: '18:30', place: 'Nhà hàng Tiệc cưới Thảo Nguyên Xanh', address: '27 Trần Phú, phường 3, TP. Đà Lạt, Lâm Đồng', mapUrl: '' },
      { name: 'Rót rượu, cắt bánh', date: '2026-12-19', time: '18:45', place: '', address: '', mapUrl: '' },
      { name: 'Phục vụ món chính', date: '2026-12-19', time: '19:00', place: '', address: '', mapUrl: '' },
      { name: 'Kết thúc tiệc', date: '2026-12-19', time: '21:00', place: '', address: '', mapUrl: '' },
    ],
    gifts: {
      groom: { bin: '970407', acc: '19036628471015', holder: 'DANG HOAI NAM' },
      bride: { bin: '970416', acc: '0947215803', holder: 'NGO THANH TRUC' },
    },
  },
  // xác nhận tham dự mở trong hộp thoại từ khung tiệc cưới (như bản gốc), nên không có trong luồng trang
  layout: ['invite', 'story', 'gallery', 'calendar', 'events', 'wishes', 'gift', 'thanks'],

  title(text, sub) {
    return `<h2 class="td-h">${esc(text)}</h2>${sub ? `<p class="sec-sub">${esc(sub)}</p>` : ''}`;
  },

  opener(ctx) {
    const p = ctx.dparts;
    return `
<div class="opener td-opener" id="opener">
  <div class="td-petals" aria-hidden="true">${PETALS.map(([l, s, sw, dur, del, c]) => `<i style="left:${l}%;font-size:${s}px;--sway:${sw}px;color:var(${c ? '--td-petal' : '--td-light'});animation-duration:${dur}s;animation-delay:${del}s">${PETAL}</i>`).join('')}</div>
  <div class="td-ocard">
    <span class="td-seal" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></span>
    <div class="td-obox">
      <div class="td-obg"><img class="tl" src="${A('flower-decoration')}" alt=""><img class="br" src="${A('flower-decoration')}" alt=""></div>
      <div class="td-obody">
        <h1 class="td-onames"><span>${esc(ctx.g)}</span><i>&amp;</i><span>${esc(ctx.b)}</span></h1>
        <p class="td-rule" aria-hidden="true"><span></span><b>❦</b><span></span></p>
        ${p ? `<p class="td-odate">${+p.d} tháng ${+p.m}, ${p.y}</p>` : ''}
        <div class="td-oto"><p>${ctx.guest ? `Thân mời ${esc(ctx.guest.name)}` : 'Thân Mời'}</p></div>
        <button class="td-obtn" id="openBtn"><span>Mở thiệp</span><i aria-hidden="true"></i></button>
      </div>
    </div>
  </div>
</div>`;
  },

  // hai ảnh polaroid xếp chéo, tên hai người in nghiêng chéo nhau trên chữ "&" mờ
  cover(ctx) {
    const { d } = ctx;
    const one = d.cover || d.photos[0] || '';
    const two = d.cover ? d.photos[0] || '' : d.photos[1] || '';
    const pol = (cls, u) => `<div class="${cls}"><div><div class="td-frame">${u ? `<img src="${esc(u)}" alt="Ảnh cưới">` : ''}</div></div></div>`;
    return `
<header class="td-cover">
  <div class="td-wrap">
    ${decos(deco('l1', 'line-decoration', 70), deco('f1', 'flower-decoration', 80), deco('l2', 'line-decoration', 70), deco('r1', 'ribbon-decoration'))}
    <div class="td-cv">
      <div class="td-photos">${pol('td-p1', one)}${two ? pol('td-p2', two) : ''}</div>
      <div class="td-names"><span aria-hidden="true">&amp;</span><p>${esc(ctx.g)}</p><p>${esc(ctx.b)}</p></div>
    </div>
  </div>
</header>`;
  },

  sections: {
    // "Thông tin lễ cưới": bố mẹ hai bên, tên đầy đủ, nơi & giờ làm lễ (căn trái, không khung)
    invite(ctx) {
      const { d, dparts: p } = ctx;
      const strip = (s) => esc(s.replace(/^(Ông|Bà)\s+/i, ''));
      const fam = (x) => `<div class="td-fam"><span class="k">Ông Bà</span>${x.father ? `<span class="n">${strip(x.father)}</span>` : ''}${x.mother ? `<span class="n">${strip(x.mother)}</span>` : ''}${x.address ? `<span class="a">${esc(x.address)}</span>` : ''}</div>`;
      const hasFam = d.groom.father || d.groom.mother || d.bride.father || d.bride.mother;
      const cer = ceremony(d);
      const time = cer && cer.time ? cer.time : d.time;
      return `
  <section class="td-sec td-invite">
    <div class="td-wrap">
      ${decos(deco('l', 'line-decoration', 70), deco('f', 'flower-decoration', 80), deco('r', 'ribbon-decoration'))}
      <div class="td-body reveal">
        <h2 class="td-h">Thông tin lễ cưới</h2>
        ${hasFam ? `<div class="td-fams">${fam(d.groom)}<i></i>${fam(d.bride)}</div>` : ''}
        <p class="td-lead">Trân trọng báo tin\nlễ thành hôn của con chúng tôi</p>
        <div class="td-couple">
          <h3>${esc(d.groom.fullName || d.groom.name)}</h3>
          <p class="td-role">Chú rể</p>
          <p class="td-amp">&amp;</p>
          <h3>${esc(d.bride.fullName || d.bride.name)}</h3>
          <p class="td-role">Cô dâu</p>
        </div>
        <div class="td-when-block">
          ${cer && cer.place ? `<p class="td-place">${esc(cer.name || 'Lễ thành hôn')} được cử hành tại\n${esc(cer.place)}</p>` : ''}
          ${p ? `<div class="td-when"><span>${time ? `Vào lúc ${esc(time)}` : ''}</span><span>${esc(ctx.weekday)}</span></div>
          ${dateRow(p)}
          ${lunar(ctx)}` : ''}
        </div>
      </div>
    </div>
  </section>`;
    },

    // album xoay 3D (quay vòng, bắt đầu từ ảnh đầu): ảnh giữa thẳng, các ảnh hai bên lùi sâu và xoay 45°/90°/135°; vuốt / chấm / mũi tên để chuyển
    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      return `
  <div class="td-album">
    <h2 class="td-h">Album ảnh</h2>
    <div class="td-cf">
      <div class="td-cf-stage">
        <button class="td-cf-nav prev" type="button" aria-label="Ảnh trước"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="none" stroke="currentColor" stroke-width="2" d="M15 18l-6-6 6-6"/></svg></button>
        <button class="td-cf-nav next" type="button" aria-label="Ảnh sau"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="none" stroke="currentColor" stroke-width="2" d="M9 6l6 6-6 6"/></svg></button>
        <div class="td-cf-3d">${ph.map((u, i) => `<button class="ph" data-i="${i}" aria-label="Xem ảnh ${i + 1}"><img loading="lazy" src="${esc(u)}" alt=""></button>`).join('')}</div>
      </div>
      <div class="td-dots">${ph.map((_, i) => `<button type="button" aria-label="Ảnh ${i + 1}"></button>`).join('')}</div>
    </div>
    <script>(function(){
      var s=document.currentScript.parentNode,st=s.querySelector('.td-cf-stage'),cs=[].slice.call(st.querySelectorAll('.ph')),ds=[].slice.call(s.querySelectorAll('.td-dots button')),n=cs.length,k=0;
      var SC=[1,.85,.7,.7],OP=[1,.75,.5,.3];
      function go(i){k=(i+n)%n;cs.forEach(function(c,j){var o=j-k;if(o>n/2)o-=n;if(o<-n/2)o+=n;var a=Math.abs(o);c.style.transform='translateX('+o*60+'%) translateZ('+(-150*a)+'px) rotateY('+o*45+'deg) scale('+(a>3?.7:SC[a])+')';c.style.opacity=a>3?0:OP[a];c.style.zIndex=100-a;c.classList.toggle('on',!o);});ds.forEach(function(d,j){d.className=j===k?'on':'';});}
      // chạm ảnh bên cạnh thì chuyển tới ảnh đó, chỉ ảnh giữa mới mở xem lớn
      st.addEventListener('click',function(e){var c=e.target.closest('.ph');if(c&&!c.classList.contains('on')){e.stopPropagation();go(cs.indexOf(c));}},true);
      s.querySelector('.prev').onclick=function(){go(k-1)};s.querySelector('.next').onclick=function(){go(k+1)};
      ds.forEach(function(d,j){d.onclick=function(){go(j)}});
      var x0=null;st.addEventListener('pointerdown',function(e){x0=e.clientX});
      st.addEventListener('pointerup',function(e){if(x0!==null&&Math.abs(e.clientX-x0)>40){go(k+(e.clientX<x0?1:-1));}x0=null});
      go(k);
    })()</script>
  </div>`;
    },

    // "Thông tin tiệc cưới" (căn phải): giờ, ngày, âm lịch, đếm ngược, đón khách / khai tiệc, lịch tháng; nút mở hộp thoại xác nhận
    calendar(ctx, opts, h) {
      const { d, dparts: p } = ctx;
      if (!p) return '';
      const evs = evList(d);
      const party = partyEvent(d) || {};
      const time = party.time || d.time;
      const at = evs.indexOf(party);
      const marks = at > 0 && evs[at - 1].time && (!evs[at - 1].date || evs[at - 1].date === ctx.date) && evs[at - 1] !== ceremony(d) ? [evs[at - 1], party] : [];
      const grid = d.show.calendar ? h.calGrid(ctx, `<p class="td-calh">Tháng ${+p.m} / ${p.y}</p>`) : '';
      const cal = h.calendarLink(`Đám cưới ${ctx.g} & ${ctx.b}`, ctx.date, time, party.address || party.place);
      const rsvp = d.show.rsvp ? h.rsvp(ctx).replace('sec s-rsvp reveal', 's-rsvp') : '';
      const u = (k, l) => `<b data-cd="${k}">0</b> ${l}`;
      return `
  <section class="td-sec td-party">
    <div class="td-wrap">
      ${decos(deco('l', 'line-decoration', 70), deco('f', 'flower-decoration', 80), deco('r', 'ribbon-decoration'))}
      <div class="td-body reveal">
        <h2 class="td-h">Thông tin tiệc cưới</h2>
        <div class="td-pgroup">
          <h3 class="td-plead">Tiệc cưới sẽ diễn ra vào lúc:</h3>
          <div class="td-when"><span>${esc(time || '')}</span><span>${esc(ctx.weekday)}</span></div>
          ${dateRow(p)}
          ${lunar(ctx)}
          ${d.show.countdown ? `<div class="td-cd"><h2>Cùng đếm ngược</h2><p role="timer">${u('d', 'ngày')} ${u('h', 'giờ')} ${u('m', 'phút')} ${u('s', 'giây')}</p></div>` : ''}
          ${marks.length ? `<div class="td-marks">${marks.map((e) => `<div><span class="k">${esc(e.name)}</span><span class="t">${esc(e.time)}</span></div>`).join('')}</div>` : ''}
          ${grid ? `<div class="td-calbox">${grid}</div>` : ''}
          <a class="td-link" target="_blank" rel="noopener" href="${esc(cal)}">Thêm vào lịch</a>
        </div>
        ${rsvp ? `<div class="td-pbtn"><button class="td-btn" type="button" onclick="document.getElementById('tdRsvp').showModal()">Xác nhận tham dự</button></div>` : ''}
      </div>
    </div>
  </section>
  ${rsvp ? `<dialog class="td-dlg td-rsvp" id="tdRsvp"><button class="td-x" type="button" aria-label="Đóng" onclick="this.closest('dialog').close()">×</button>${rsvp}</dialog>` : ''}`;
    },

    // nơi tổ chức tiệc (bản đồ) + lịch trình tiệc dạng dòng thời gian (bỏ lễ cưới đã ghi ở lời mời)
    events(ctx, opts, h) {
      const evs = evList(ctx.d);
      if (!evs.length) return '';
      const party = partyEvent(ctx.d);
      const cer = ceremony(ctx.d);
      const sched = evs.filter((e) => e !== cer || cer === party);
      const icons = ['icon-cake', 'icon-home', 'icon-music'];
      const where = party ? [party.place, party.address].filter(Boolean).join(', ') : '';
      const dir = party && (party.mapUrl || (where ? h.mapSearch(where) : ''));
      return `
  ${where ? `
  <section class="td-venue reveal">
    <div>
      <h3>Tiệc cưới sẽ tổ chức tại</h3>
      <p class="td-addr">${esc(where)}</p>
    </div>
    <div class="td-mapcol">
      ${party.address ? `<iframe class="td-map" loading="lazy" title="Bản đồ" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(where)}&amp;output=embed"></iframe>` : ''}
      ${dir ? `<a class="td-dir" target="_blank" rel="noopener" href="${esc(dir)}"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><polygon fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="3 11 22 2 13 21 11 13 3 11"/></svg><span>Chỉ đường</span></a>` : ''}
    </div>
  </section>` : ''}
  ${sched.length ? `
  <section class="td-sec td-sched">
    <div class="td-wrap">
      ${decos(deco('l', 'line-decoration', 70), deco('f', 'flower-decoration', 80), deco('r', 'ribbon-decoration'))}
      <div class="td-tlwrap reveal">
        <h2 class="td-h">Lịch trình ngày cưới</h2>
        <ol class="td-tl">
          ${sched.map((e, i) => {
            const p = h.parts(e.date);
            const other = p && e.date !== ctx.date;
            const ic = icons[i - 1];
            return `<li><span class="t"><b>${ic ? `<span class="ic"><img src="${A(ic)}" alt=""></span>` : ''}${esc(e.time) || '—'}</b></span><span class="dot"></span><span class="l">${esc(e.name)}${other ? ` <small>${p.d}/${p.m}</small>` : ''}</span></li>`;
          }).join('')}
        </ol>
      </div>
    </div>
  </section>` : ''}`;
    },

    // sổ lưu bút căn phải; ô nhập dùng chữ gợi ý như bản gốc (giữ id/tên trường cho card.js), nút 🪄 điền sẵn một lời chúc
    wishes(ctx, opts) {
      if (!ctx.d.show.wishes) return '';
      const list = opts.wishes || [];
      return `
  <section class="td-sec td-gb">
    <div class="td-wrap">
      ${decos(deco('l', 'line-decoration', 70))}
      <div class="s-wishes td-gbody reveal">
        <h2 class="td-h">Sổ lưu bút</h2>
        <form class="td-wform" id="wishForm">
          <input name="name" required maxlength="60" placeholder="Nhập tên*" value="${ctx.guest ? esc(ctx.guest.name) : ''}" aria-label="Tên">
          <textarea name="message" required maxlength="500" rows="4" placeholder="Nhập lời chúc*" aria-label="Lời chúc"></textarea>
          <div class="td-wrow">
            <button class="td-wand" type="button" aria-label="Gợi ý lời chúc" data-s="${esc(JSON.stringify(SUGGEST))}" onclick="var s=JSON.parse(this.dataset.s);this.form.message.value=s[Math.floor(Math.random()*s.length)]">🪄</button>
            <button class="td-btn" type="submit">Gửi lời chúc</button>
          </div>
          <p class="form-msg" role="status"></p>
        </form>
        <div class="wish-list" id="wishList">
          ${list.map((w) => `<div class="wish"><b>${esc(w.name)}</b>${w.createdAt ? `<span class="td-wt">${wishTime(w.createdAt)}</span>` : ''}<p>${esc(w.message)}</p></div>`).join('')}
        </div>
      </div>
    </div>
  </section>`;
    },

    // hộp quà mừng: hai phong bao lụa xanh, chạm để mở hộp thoại có mã QR của hai bên
    gift(ctx, opts, h) {
      if (!ctx.d.show.gift) return '';
      const { gifts } = ctx.d;
      const who = (k, label) => h.giftCard(ctx, gifts[k], k).replace(/<p class="gift-who">[^<]*<\/p>/, `<p class="gift-who">${label}${gifts[k].holder ? ` - ${esc(gifts[k].holder)}` : ''}</p>`);
      const html = who('groom', 'Chú Rể') + who('bride', 'Cô Dâu');
      if (!html) return '';
      return `
  <section class="td-sec td-giftbox">
    <div class="td-wrap">
      ${decos(deco('l', 'line-decoration', 70), deco('f', 'flower-decoration', 80))}
      <div class="td-gbx reveal">
        <h2 class="td-h">Hộp quà mừng</h2>
        <button class="td-envbtn" type="button" onclick="document.getElementById('tdGift').showModal()">
          <span class="td-envs">
            <i>✦</i><i>✦</i><i>✦</i><i>✦</i>
            <span class="td-env"><span class="sh"></span><img class="back" src="${A('envelope')}" alt=""><img class="front" src="${A('envelope')}" alt=""></span>
          </span>
          <span class="hint">Nhấn để mở</span>
        </button>
      </div>
    </div>
  </section>
  <dialog class="td-dlg td-giftdlg" id="tdGift">
    <div class="td-dlg-head"><button class="td-x" type="button" aria-label="Đóng" onclick="this.closest('dialog').close()">×</button><h2>Hộp quà mừng</h2></div>
    <div class="gifts">${html}</div>
  </dialog>`;
    },

    // lời nhắn cuối trang + dải lụa khép lại thiệp (dòng chữ thương hiệu nằm giữa hai phần như bản gốc)
    thanks(ctx) {
      return `
  <footer class="td-foot reveal"><p>${esc(ctx.d.message || 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!')}</p></footer>
  <div class="td-end" aria-hidden="true"><div class="td-wrap">${deco('l', 'line-decoration', 40)}${deco('r', 'ribbon-decoration')}</div></div>
  <script>(function(){
    // trang trí trôi nhẹ theo cuộn trang (giống bản gốc): lệch theo khoảng cách tới giữa màn hình, giới hạn ±data-px
    var ds=[].slice.call(document.querySelectorAll('.tpl-toduyen [data-px]'));
    if(!ds.length||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches))return;
    var on=false;function run(){on=false;var vh=innerHeight;ds.forEach(function(e){var r=e.parentNode.getBoundingClientRect(),m=+e.dataset.px,y=(vh/2-(r.top+r.height/2))*.15;e.style.setProperty('--py',Math.max(-m,Math.min(m,y)).toFixed(1)+'px');});}
    addEventListener('scroll',function(){if(!on){on=true;requestAnimationFrame(run);}},{passive:true});addEventListener('resize',run);run();
  })()</script>`;
    },
  },

  css: `
.tpl-toduyen{background:#fff}
.tpl-toduyen .card{display:flex;flex-direction:column;max-width:480px;background:#fff;color:var(--accent);font-family:var(--font-body);font-weight:300;line-height:1.5;box-shadow:none}
.tpl-toduyen .card>*{flex-shrink:0}
.tpl-toduyen .card>.credit{order:1}
.tpl-toduyen .card>.td-end{order:2}
.tpl-toduyen p,.tpl-toduyen h2,.tpl-toduyen h3{margin:0}
.tpl-toduyen .td-h{position:relative;z-index:10;margin:0;font:700 20px/1.5 'Times New Roman',Times,serif;letter-spacing:.02em;text-transform:uppercase;color:var(--accent)}
.tpl-toduyen .sec-sub{margin:4px 0 0;color:var(--td-dark);font-size:14px}

/* khung chung của mỗi phần: cột 441px (600px trên màn rộng), trang trí tràn ra ngoài theo chiều ngang */
.tpl-toduyen .td-cover,.tpl-toduyen .td-sec,.tpl-toduyen .td-end{position:relative;isolation:isolate;overflow-x:clip}
.tpl-toduyen .td-wrap{position:relative;width:100%;max-width:441px;margin:0 auto}
.tpl-toduyen .td-decos{position:absolute;inset:0;pointer-events:none}
.tpl-toduyen .td-d{position:absolute;max-width:none;object-fit:cover;pointer-events:none;--py:0px;transform:translateY(var(--py)) var(--tf,)}
.tpl-toduyen .td-body{position:relative;z-index:10;display:flex;flex-direction:column;width:100%;padding:0 10%}

/* ---- màn mở thiệp ---- */
.tpl-toduyen .td-opener{overflow:hidden;background:linear-gradient(to bottom right,#fff,var(--td-o1),var(--td-o2))}
.tpl-toduyen .td-petals{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none}
.tpl-toduyen .td-petals i{position:absolute;top:-30px;display:block;line-height:0;animation:tdFall 20s ease-in-out infinite}
@keyframes tdFall{0%{transform:translateY(-8vh) translateX(0) rotate(0);opacity:0}10%{opacity:.5}50%{transform:translateY(48vh) translateX(var(--sway,20px)) rotate(180deg);opacity:.6}92%{opacity:.45}100%{transform:translateY(105vh) translateX(0) rotate(360deg);opacity:0}}
.tpl-toduyen .td-ocard{position:relative;z-index:2;width:310px;max-width:calc(100vw - 32px);text-align:center}
.tpl-toduyen .td-seal{position:absolute;left:50%;top:50px;z-index:30;display:flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;background:radial-gradient(circle at 30% 30%,var(--accent),var(--td-seal));color:var(--accent-ink);box-shadow:0 4px 20px color-mix(in srgb,var(--accent) 50%,transparent),inset 0 2px 4px rgba(255,255,255,.3);transform:translate(-50%,-50%);animation:tdSeal 2s ease-in-out infinite}
@keyframes tdSeal{0%,100%{transform:translate(-50%,-50%) scale(1);box-shadow:0 4px 20px color-mix(in srgb,var(--accent) 50%,transparent)}50%{transform:translate(-50%,-50%) scale(1.06);box-shadow:0 6px 35px color-mix(in srgb,var(--accent) 50%,transparent)}}
.tpl-toduyen .td-obox{position:relative;border-radius:8px;box-shadow:0 25px 60px -12px rgba(0,0,0,.45),0 8px 24px rgba(0,0,0,.2),0 0 40px color-mix(in srgb,var(--accent) 15%,transparent)}
.tpl-toduyen .td-obg{position:absolute;inset:0;overflow:hidden;border:1px solid color-mix(in srgb,var(--accent) 15%,transparent);border-radius:8px;background:rgba(255,255,255,.97);clip-path:inset(0 round 8px)}
.tpl-toduyen .td-obg img{position:absolute;width:121px;max-width:none;pointer-events:none}
.tpl-toduyen .td-obg .tl{top:-5%;left:-70px;transform:translateX(-6%) rotate(45deg)}
.tpl-toduyen .td-obg .br{bottom:-5%;right:-70px;transform:translateX(6%) rotate(-45deg) scaleX(-1)}
.tpl-toduyen .td-obody{position:relative;z-index:10;padding:112px 24px 56px}
.tpl-toduyen .td-onames{display:flex;flex-direction:column;align-items:center;margin:0 0 8px;font-family:var(--font-title);font-weight:400;font-size:30px;line-height:1.25;color:var(--accent)}
.tpl-toduyen .td-onames span{display:block;width:100%}
.tpl-toduyen .td-onames i{display:block;width:100%;font-style:normal;font-family:Baskerville,'Libre Baskerville','Times New Roman',serif;font-size:18px;line-height:1}
.tpl-toduyen .td-rule{display:flex;align-items:center;justify-content:center;gap:12px;margin:0 0 8px}
.tpl-toduyen .td-rule span{width:40px;height:1px;background:linear-gradient(to right,transparent,var(--accent))}
.tpl-toduyen .td-rule span:last-child{background:linear-gradient(to left,transparent,var(--accent))}
.tpl-toduyen .td-rule b{font-weight:300;font-size:14px;line-height:20px;color:var(--accent);opacity:.7}
.tpl-toduyen .td-odate,.tpl-toduyen .td-oto p{font-family:'Lora','Times New Roman',serif;font-size:18px;line-height:27px;color:color-mix(in srgb,var(--td-dark) 70%,transparent)}
.tpl-toduyen .td-odate{margin:0 0 20px}
.tpl-toduyen .td-oto{max-width:300px;margin:0 auto 24px}
.tpl-toduyen .td-oto p{margin:0 0 8px;font-weight:300}
.tpl-toduyen .td-obtn{position:relative;display:flex;align-items:center;justify-content:center;width:fit-content;margin:0 auto;padding:10px 32px;overflow:hidden;border:0;border-radius:999px;background:var(--accent);color:var(--accent-ink);font:600 18px/28px 'Lora','Times New Roman',serif;box-shadow:0 4px 14px color-mix(in srgb,var(--accent) 35%,transparent)}
.tpl-toduyen .td-obtn i{position:absolute;top:0;left:-100%;width:32px;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);pointer-events:none;animation:tdShine 3s ease-in-out infinite}
@keyframes tdShine{0%{left:-100%}50%,100%{left:100%}}
@media (prefers-reduced-motion:reduce){.tpl-toduyen .td-petals,.tpl-toduyen .td-obtn i{display:none}.tpl-toduyen .td-seal{animation:none}}

/* ---- trang bìa: hai ảnh polaroid + tên ---- */
.tpl-toduyen .td-cover .l1{right:-48px;top:-60px;height:496px;width:198px}
.tpl-toduyen .td-cover .f1{right:-21px;top:15px;height:320px}
.tpl-toduyen .td-cover .l2{left:-30%;top:470px;height:595px;width:198px;--tf:scaleX(-1)}
.tpl-toduyen .td-cover .r1{bottom:60px;left:-263px;height:150px;width:700px}
.tpl-toduyen .td-cv{position:relative;z-index:10;padding:49.2% 0 59.4%}
.tpl-toduyen .td-photos{position:relative;width:75.4%;margin-left:12.3%;aspect-ratio:331.11/394.7}
.tpl-toduyen .td-p1,.tpl-toduyen .td-p2{position:absolute;display:flex;align-items:center;justify-content:center}
.tpl-toduyen .td-p1{left:0;top:0;width:62.6%;aspect-ratio:207.33/254.13}
.tpl-toduyen .td-p2{left:33.6%;top:33.2%;width:66.4%;aspect-ratio:219.82/263.56}
.tpl-toduyen .td-p1>div{width:86%;flex-shrink:0;transform:rotate(-8.25deg) skewX(-.57deg)}
.tpl-toduyen .td-p2>div{width:81.2%;flex-shrink:0;transform:rotate(12.17deg) skewX(.83deg)}
.tpl-toduyen .td-frame{width:100%;aspect-ratio:178.353/230.6;border:5px solid var(--td-light);background:#fff}
.tpl-toduyen .td-p2 .td-frame{aspect-ratio:178.503/230.42}
.tpl-toduyen .td-frame img{width:100%;height:100%;object-fit:cover}
.tpl-toduyen .td-names{position:relative;margin-top:6.3%;padding:0 15.9%}
.tpl-toduyen .td-names span{position:absolute;left:50%;top:65%;transform:translate(-50%,-50%);font-family:var(--font-script);font-size:170px;line-height:1;color:rgba(11,46,0,.1);pointer-events:none;user-select:none}
.tpl-toduyen .td-names p{position:relative;font-family:'Times New Roman',Times,serif;font-style:italic;font-size:clamp(20px,7.26vw,32px);line-height:1.25;text-transform:uppercase;text-align:start;color:var(--accent)}
.tpl-toduyen .td-names p+p{margin-top:4px;text-align:end}

/* ---- thông tin lễ cưới ---- */
.tpl-toduyen .td-invite .td-d.l{right:-113px;top:156px;height:596px;width:198px;--tf:rotate(4.96deg)}
.tpl-toduyen .td-invite .td-d.f{right:-120px;top:220px;height:270px;--tf:rotate(130deg) scaleY(-1)}
.tpl-toduyen .td-invite .td-d.r{bottom:-25px;left:-50%;height:140px}
.tpl-toduyen .td-invite .td-body{align-items:flex-start;gap:20px;padding-top:2.5%;padding-bottom:26%;text-align:start}
.tpl-toduyen .td-fams{display:grid;grid-template-columns:1fr auto 1fr;grid-template-rows:repeat(4,auto);column-gap:16px;row-gap:3px;width:100%;font-family:var(--font-body);text-align:start}
.tpl-toduyen .td-fams>i{grid-row:span 4;align-self:center;width:1px;height:50px;background:var(--accent)}
.tpl-toduyen .td-fam{grid-row:span 4;display:grid;grid-template-rows:subgrid;justify-items:start;min-width:0}
.tpl-toduyen .td-fam .k{font-size:12px;color:var(--td-dark)}
.tpl-toduyen .td-fam .n{font-size:12px;font-weight:600;overflow-wrap:anywhere;color:var(--accent)}
.tpl-toduyen .td-fam .a{margin-top:4px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:10px;line-height:1.25;white-space:pre-line;overflow-wrap:anywhere;color:var(--td-dark)}
.tpl-toduyen .td-lead{width:100%;margin:0 auto;font-size:16px;white-space:pre-line;text-transform:uppercase;color:var(--accent)}
.tpl-toduyen .td-couple{display:flex;flex-direction:column;align-items:flex-start;gap:10px;width:100%;min-width:0}
.tpl-toduyen .td-couple h3{display:flex;align-items:center;width:100%;font-family:var(--font-title);font-weight:400;font-size:37px;line-height:1;white-space:nowrap;color:var(--accent)}
.tpl-toduyen .td-role{font-family:'Uchen',serif;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--td-dark)}
.tpl-toduyen .td-amp{font-family:'Aguafina Script',cursive;font-size:35px;line-height:1;color:var(--accent)}
.tpl-toduyen .td-when-block{display:flex;flex-direction:column;align-items:flex-start;gap:6px;width:100%}
.tpl-toduyen .td-place{font-size:16px;line-height:1.4;white-space:pre-line;text-transform:uppercase}
.tpl-toduyen .td-when{display:flex;align-items:center;gap:16px;min-width:max-content;font-family:'Times New Roman',Times,serif;font-size:12px;text-transform:uppercase;white-space:nowrap;color:var(--td-dark)}
.tpl-toduyen .td-date{display:flex;align-items:center;gap:9px;color:var(--accent)}
.tpl-toduyen .td-date b{font-family:var(--font-body);font-weight:300;font-size:57px;line-height:1}
.tpl-toduyen .td-date i{width:1px;height:46px;background:var(--accent)}
.tpl-toduyen .td-date span{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:4px;text-align:left}
.tpl-toduyen .td-date em{font-family:'Times New Roman',Times,serif;font-style:normal;font-size:17px;line-height:1.5;text-transform:uppercase}
.tpl-toduyen .td-lunar{font-family:'Times New Roman',Times,serif;font-size:12px;text-transform:uppercase;color:var(--td-dark)}

/* ---- album xoay 3D ---- */
.tpl-toduyen .td-album{position:relative;z-index:10;display:flex;flex-direction:column;align-items:center;width:100%;max-width:441px;margin:0 auto;padding:35px 12.2%;overflow-x:clip}
.tpl-toduyen .td-album .td-h{width:100%;text-align:end}
.tpl-toduyen .td-cf{position:relative;z-index:10;width:100%;margin-top:16px}
.tpl-toduyen .td-cf-stage{position:relative;height:340px;touch-action:pan-y}
.tpl-toduyen .td-cf-3d{position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:100%;perspective:1000px}
.tpl-toduyen .td-cf .ph{position:absolute;height:92%;width:auto;aspect-ratio:.664375/1;padding:0;border:0;border-radius:16px;overflow:hidden;background:var(--line);box-shadow:0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1);transition:all 1.1s ease-in-out;cursor:pointer}
.tpl-toduyen .td-cf .ph.on{box-shadow:0 0 0 2px rgba(255,255,255,.3),0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1)}
.tpl-toduyen .td-cf .ph img{width:100%;height:100%;object-fit:cover}
.tpl-toduyen .td-cf-nav{display:none}
.tpl-toduyen .td-dots{display:flex;justify-content:center;gap:6px;margin-top:12px}
.tpl-toduyen .td-dots button{width:8px;height:8px;padding:0;border:0;border-radius:999px;background:var(--accent);opacity:.25;transition:all .3s}
.tpl-toduyen .td-dots button.on{width:24px;opacity:.7}

/* ---- thông tin tiệc cưới (căn phải) ---- */
.tpl-toduyen .td-party .td-d.l{left:-56px;top:134px;height:300px;--tf:rotate(-177.25deg)}
.tpl-toduyen .td-party .td-d.f{left:-71px;top:130px;height:150px;--tf:rotate(50deg)}
.tpl-toduyen .td-party .td-d.r{bottom:-5px;left:-365px;height:155px}
.tpl-toduyen .td-party .td-body{align-items:flex-end;gap:24px;padding-bottom:34%;text-align:end}
.tpl-toduyen .td-pgroup{display:flex;flex-direction:column;align-items:flex-end;gap:20px;width:100%;font-family:var(--font-body);color:var(--accent);text-align:end}
.tpl-toduyen .td-plead{width:100%;font-size:16px;font-weight:600;text-transform:uppercase;color:var(--td-dark)}
.tpl-toduyen .td-party .td-when{gap:25px;font-family:var(--font-body);font-size:15px;font-weight:600}
.tpl-toduyen .td-party .td-lunar{font-family:var(--font-body);font-weight:600}
.tpl-toduyen .td-cd{display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;margin-top:16px;color:var(--td-dark)}
.tpl-toduyen .td-cd h2{width:100%;font-family:var(--font-body);font-weight:400;font-size:20px;line-height:1.5;text-align:end;text-transform:uppercase}
.tpl-toduyen .td-cd p{width:100%;margin-top:8px;font-size:20px;font-weight:600;line-height:1.5;text-align:end}
.tpl-toduyen .td-cd b{font-weight:inherit}
.tpl-toduyen .td-marks{display:flex;align-items:center;justify-content:center;gap:32px;margin-top:16px}
.tpl-toduyen .td-marks div{display:flex;flex-direction:column;align-items:center}
.tpl-toduyen .td-marks .k{font-size:11px;letter-spacing:.02em;text-transform:uppercase;color:var(--td-dark)}
.tpl-toduyen .td-marks .t{margin-top:4px;font-size:20px;font-weight:600;line-height:1.5}
.tpl-toduyen .td-calbox{align-self:flex-end;width:100%;max-width:304px;margin-top:8px;padding:8px 12px 16px;overflow:hidden;border:1px solid var(--td-dark);border-radius:19px}
.tpl-toduyen .td-calbox .cal{width:100%;margin:0;color:var(--accent)}
.tpl-toduyen .td-calh{padding:10px 0;border-bottom:1px solid color-mix(in srgb,var(--accent) 27%,transparent);font-family:'The Nautigal',cursive;font-weight:400;font-size:clamp(25px,5.67vw,34px);line-height:1.5;letter-spacing:.025em;text-align:center}
.tpl-toduyen .td-party{--cal-hi:var(--accent);--cal-on:#fff}
.tpl-toduyen .td-calbox .cal-grid{row-gap:2px;padding:0 4px 8px;font-family:var(--font-body);font-size:12px;line-height:1.5;color:var(--accent)}
.tpl-toduyen .td-calbox .cal-grid span{height:30px}
.tpl-toduyen .td-calbox .cal-grid .cal-w{height:auto;margin:0 -4px 6px;padding:6px 0;border-bottom:2px solid var(--accent);font-size:10px;font-weight:500;letter-spacing:0;opacity:1;color:color-mix(in srgb,var(--accent) 60%,transparent)}
.tpl-toduyen .td-calbox .cal-on{font-weight:700}
.tpl-toduyen .td-calbox .cal-on::before{width:26px;height:24px;animation:none;filter:drop-shadow(0 1px 1px rgba(0,0,0,.05))}
.tpl-toduyen .td-calbox .cal-on b{margin-top:-2px;font-size:11px}
.tpl-toduyen .td-link{align-self:flex-end;margin-top:4px;font-family:'Times New Roman',Times,serif;font-size:14px;color:var(--td-dark);text-decoration:underline;text-underline-offset:4px}
.tpl-toduyen .td-pbtn{position:relative;z-index:10;display:flex;flex-direction:column;align-items:flex-end;width:100%}
.tpl-toduyen .td-btn{display:inline-flex;align-items:center;justify-content:center;padding:8px 24px;border:0;border-radius:7px;background:var(--accent);color:var(--accent-ink);font:300 14px/20px 'Times New Roman',Times,serif;letter-spacing:.025em;text-transform:uppercase;transition:transform .15s}
.tpl-toduyen .td-btn:hover{transform:scale(1.03)}

/* ---- nơi tổ chức ---- */
.tpl-toduyen .td-venue{position:relative;z-index:10;display:flex;flex-direction:column;align-items:flex-start;width:100%;max-width:441px;margin:0 auto;padding:23px 10% 0;overflow-x:clip;text-align:start}
.tpl-toduyen .td-venue>div{width:100%}
.tpl-toduyen .td-venue h3{font:700 18px/1.5 'Times New Roman',Times,serif;letter-spacing:.02em;text-transform:uppercase;color:var(--accent)}
.tpl-toduyen .td-addr{margin-top:12px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.625;white-space:pre-line;color:var(--td-dark)}
.tpl-toduyen .td-mapcol{display:flex;flex-direction:column;align-items:center;gap:16px}
.tpl-toduyen .td-map{display:block;width:100%;height:267px;margin-top:16px;border:0;border-radius:10px;overflow:hidden}
.tpl-toduyen .td-dir{display:inline-flex;align-items:center;gap:8px;padding:8px 20px;border-radius:999px;font:600 14px/20px 'Helvetica Neue',Helvetica,Arial,sans-serif;color:var(--td-dark);text-decoration:none;transition:transform .15s}
.tpl-toduyen .td-dir:hover{transform:scale(1.03)}

/* ---- lịch trình: lưới giờ | chấm | tên; vạch dọc nối từ chấm đầu tới chấm cuối ---- */
.tpl-toduyen .td-sched .td-d.l{right:-80px;top:5px;height:420px;--tf:rotate(10.25deg) scaleY(-1)}
.tpl-toduyen .td-sched .td-d.f{right:-100px;top:55px;height:200px;--tf:rotate(130deg) scaleY(-1)}
.tpl-toduyen .td-sched .td-d.r{bottom:5px;left:-100px;height:140px}
.tpl-toduyen .td-tlwrap{position:relative;z-index:10;display:flex;flex-direction:column;gap:24px;width:62%;margin-left:10%;padding:37px 0 36%;--tl-gut:clamp(0px,calc(31vw - 107px),30px)}
.tpl-toduyen .td-tlwrap .td-h{width:126%;text-align:start}
.tpl-toduyen .td-tl{--gy:41px;display:grid;grid-template-columns:minmax(0,1fr) 16px minmax(0,1fr);align-items:center;column-gap:24px;row-gap:var(--gy);width:100%;max-width:460px;margin:0 auto;padding:0;list-style:none;font-family:'Times New Roman',Times,serif;color:var(--accent)}
.tpl-toduyen .td-tl li{display:contents}
.tpl-toduyen .td-tl .t,.tpl-toduyen .td-tl .l{padding-top:2px;font-size:13px;line-height:1.375}
.tpl-toduyen .td-tl .t{text-align:right;letter-spacing:.025em;font-variant-numeric:tabular-nums}
.tpl-toduyen .td-tl .t b{position:relative;display:inline-block;font-weight:inherit}
.tpl-toduyen .td-tl .ic{position:absolute;right:100%;top:50%;display:flex;align-items:center;justify-content:center;width:max-content;margin-right:var(--tl-gut);transform:translateY(-50%)}
.tpl-toduyen .td-tl .ic img{width:44px;height:44px;object-fit:contain}
.tpl-toduyen .td-tl .l{text-align:start}
.tpl-toduyen .td-tl .dot{position:relative;align-self:stretch;display:flex;align-items:center;justify-content:center}
.tpl-toduyen .td-tl .dot::before{content:"";position:absolute;left:50%;width:1px;top:calc(-1 * var(--gy));bottom:calc(-1 * var(--gy));transform:translateX(-50%);background:color-mix(in srgb,var(--accent) 40%,transparent)}
.tpl-toduyen .td-tl li:first-child .dot::before{top:50%}
.tpl-toduyen .td-tl li:last-child .dot::before{bottom:50%}
.tpl-toduyen .td-tl li:only-child .dot::before{display:none}
.tpl-toduyen .td-tl .dot::after{content:"";position:relative;width:10px;height:10px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 13%,transparent)}
.tpl-toduyen .td-tl small{font-size:inherit;opacity:.8}

/* ---- sổ lưu bút (căn phải) ---- */
.tpl-toduyen .td-gb .td-d.l{left:-84px;top:80px;height:391px;width:130px;--tf:rotate(166.94deg)}
.tpl-toduyen .td-gbody{position:relative;z-index:10;display:flex;flex-direction:column;align-items:flex-end;width:100%;padding:16px 10% 16%;font-family:'Times New Roman',Times,serif;text-align:end;color:var(--accent)}
.tpl-toduyen .td-gbody .td-h{width:100%;text-align:end}
.tpl-toduyen .td-wform{width:100%;max-width:248px;margin:16px 0 0 auto;padding-top:12px}
.tpl-toduyen .td-wform input,.tpl-toduyen .td-wform textarea{display:block;width:100%;padding:10px 12px;border:1px solid var(--accent);border-radius:6px;background:transparent;color:var(--td-dark);font:300 16px/24px 'Roboto',sans-serif;outline:none;resize:vertical}
.tpl-toduyen .td-wform input{margin-bottom:16px}
/* lề dưới textarea gộp với margin-top 4px của hàng nút = khoảng hở dưới textarea nội dòng ở bản gốc */
.tpl-toduyen .td-wform textarea{margin-bottom:11px}
.tpl-toduyen .td-wform ::placeholder{color:#9ca3af}
.tpl-toduyen .td-wrow{display:flex;align-items:center;justify-content:space-between;margin-top:4px;font-size:12px}
.tpl-toduyen .td-wand{padding:8px;border:0;border-radius:8px;background:color-mix(in srgb,var(--accent) 10%,transparent);color:var(--accent);font-size:16px;line-height:1;transition:transform .2s}
.tpl-toduyen .td-wand:hover{transform:scale(1.1)}
.tpl-toduyen .td-wrow .td-btn{padding:6px 20px;font-size:13px;line-height:17.3px;letter-spacing:0}
.tpl-toduyen .td-wform .form-msg{margin-top:6px;font-size:12px;text-align:end;color:var(--td-dark)}
.tpl-toduyen .td-wform .form-msg:empty{display:none}
.tpl-toduyen .wish-list{width:100%;max-width:256px;max-height:500px;margin:32px -8px 0 auto;padding-right:8px;overflow-y:auto}
.tpl-toduyen .wish{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;column-gap:8px;margin:0 0 12px;padding:16px;border:1px solid color-mix(in srgb,var(--accent) 33.3%,transparent);border-radius:8px;background:rgba(255,255,255,.7);font-size:14px;line-height:20px;text-align:start;color:var(--accent)}
.tpl-toduyen .wish b{font-weight:600}
.tpl-toduyen .td-wt{font-size:12px;line-height:16px;opacity:.7}
.tpl-toduyen .wish p{grid-column:1/-1;margin-top:8px;font-size:14px;line-height:1.625}

/* ---- hộp quà mừng ---- */
.tpl-toduyen .td-giftbox .td-d.l{left:-83px;top:-42px;height:391px;width:130px;--tf:rotate(178.88deg)}
.tpl-toduyen .td-giftbox .td-d.f{left:-110px;top:-17px;height:200px;--tf:rotate(50deg)}
.tpl-toduyen .td-gbx{position:relative;z-index:10;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;width:100%;padding:16px 10% 24px;text-align:end}
.tpl-toduyen .td-gbx .td-h{width:100%;margin-bottom:16px;text-align:end}
.tpl-toduyen .td-envbtn{position:relative;width:198px;height:279px;padding:0;border:0;background:transparent;outline:none;cursor:pointer}
.tpl-toduyen .td-envs{position:relative;display:flex;align-items:flex-end;justify-content:center;width:100%;height:100%;padding-bottom:48px}
/* hai phong bao chồng nhau (theo bản gốc): bao trước xoay -10° nổi lên xuống, bao sau lật ngang thu 80% */
.tpl-toduyen .td-env{position:relative;display:block;width:138px;height:197px}
.tpl-toduyen .td-env img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center bottom;pointer-events:none}
.tpl-toduyen .td-env .back{z-index:1;transform-origin:50% 100%;transform:translateX(20%) translateY(-10%) scale(-.8,.8) rotate(-15deg);filter:drop-shadow(0 8px 14px rgba(0,0,0,.18));transition:rotate .3s ease;animation:tdFloat 5.2s ease-in-out .5s infinite}
.tpl-toduyen .td-env .front{z-index:2;rotate:-10deg;transform-origin:50% 92%;filter:drop-shadow(0 10px 18px rgba(0,0,0,.22));transition:transform .35s ease;animation:tdFloatMain 3s ease-in-out infinite}
.tpl-toduyen .td-envbtn:hover .front,.tpl-toduyen .td-envbtn:focus-visible .front{animation:tdFloatMain 3s ease-in-out infinite,tdGrow .35s ease forwards,tdWave 1.1s ease-in-out .35s infinite}
.tpl-toduyen .td-envbtn:hover .back,.tpl-toduyen .td-envbtn:focus-visible .back{animation:tdFloat 5.2s ease-in-out .5s infinite,tdBackWave 2.2s ease-in-out infinite}
.tpl-toduyen .td-env .sh{position:absolute;left:50%;bottom:-6px;z-index:0;width:91.08px;height:11px;margin-left:-45.54px;border-radius:50%;background:rgba(0,0,0,.45);filter:blur(4px);animation:tdShadow 3s ease-in-out infinite}
.tpl-toduyen .td-envs i{position:absolute;z-index:20;font-style:normal;line-height:1.5;color:var(--td-light);pointer-events:none;animation:tdSpark 2s ease-in-out infinite}
.tpl-toduyen .td-envs i:nth-child(1){top:6%;left:12%;font-size:15.18px}
.tpl-toduyen .td-envs i:nth-child(2){top:14%;right:8%;font-size:11.04px;animation-delay:.6s}
.tpl-toduyen .td-envs i:nth-child(3){top:34%;left:3%;font-size:9.66px;animation-delay:1.2s}
.tpl-toduyen .td-envs i:nth-child(4){top:24%;right:3%;font-size:9.66px;animation-delay:1.7s}
.tpl-toduyen .td-envbtn .hint{position:absolute;left:50%;bottom:0;transform:translateX(-50%);white-space:nowrap;font:500 12px/16px system-ui,sans-serif;color:var(--accent);animation:tdHint 2s ease-in-out infinite}
@keyframes tdFloat{0%,100%{translate:0 0}50%{translate:0 -7px}}
@keyframes tdFloatMain{0%,100%{translate:-15% 0}50%{translate:-15% -7px}}
@keyframes tdShadow{0%,100%{transform:scaleX(1);opacity:.28}50%{transform:scaleX(.9);opacity:.16}}
@keyframes tdSpark{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1.15)}}
@keyframes tdHint{0%,100%{opacity:.45}50%{opacity:1}}
@keyframes tdGrow{from{transform:scale(1)}to{transform:scale(1.12)}}
@keyframes tdWave{0%{transform:scale(1.12) rotate(0)}20%{transform:scale(1.12) rotate(-6deg)}40%{transform:scale(1.12) rotate(4.5deg)}60%{transform:scale(1.12) rotate(-3deg)}80%{transform:scale(1.12) rotate(1.5deg)}100%{transform:scale(1.12) rotate(0)}}
@keyframes tdBackWave{0%,100%{rotate:0deg}20%{rotate:-1deg}40%{rotate:2deg}60%{rotate:-2.5deg}80%{rotate:1.5deg}}
@media (prefers-reduced-motion:reduce){.tpl-toduyen .td-envbtn *{animation:none!important}}

/* ---- hộp thoại (xác nhận tham dự, quà mừng) ---- */
.tpl-toduyen .td-dlg{width:min(448px,calc(100% - 32px));max-height:85vh;padding:0;border:0;border-radius:16px;background:#fff;color:#111827;box-shadow:0 25px 50px -12px rgba(0,0,0,.25);overflow:auto}
.tpl-toduyen .td-dlg::backdrop{background:rgba(0,0,0,.6);backdrop-filter:blur(4px)}
.tpl-toduyen .td-x{position:absolute;top:16px;right:16px;z-index:1;width:32px;height:32px;border:0;border-radius:50%;background:#f3f4f6;color:#6b7280;font-size:20px;line-height:1}
.tpl-toduyen .td-rsvp .s-rsvp{padding:24px;text-align:left}
.tpl-toduyen .td-rsvp .td-h{margin:0 40px 4px 0;font-family:system-ui,sans-serif;font-size:20px;font-weight:600;letter-spacing:0;text-transform:none;color:#111827}
.tpl-toduyen .td-rsvp .sec-sub{margin:0 0 24px;font-family:system-ui,sans-serif;color:#6b7280}
.tpl-toduyen .td-rsvp .form{gap:16px;padding:0;border:0;background:none;font-family:system-ui,sans-serif}
.tpl-toduyen .td-rsvp .form label{font-size:14px;font-weight:500;color:#374151}
.tpl-toduyen .td-rsvp .form input:not([type=radio]),.tpl-toduyen .td-rsvp .form select{padding:12px 16px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;font-size:16px;color:#111827}
.tpl-toduyen .td-rsvp .choice label{padding:10px 12px;border:2px solid #e5e7eb;border-radius:12px;background:rgba(249,250,251,.5);font-size:14px;color:#374151}
.tpl-toduyen .td-rsvp .choice label:has(input:checked){border-color:var(--accent)}
.tpl-toduyen .td-rsvp .btn{padding:14px;border:0;border-radius:12px;background:var(--accent);color:var(--accent-ink);font-size:14px;font-weight:600;box-shadow:0 4px 12px -2px rgba(0,0,0,.2)}
.tpl-toduyen .td-giftdlg{width:min(512px,calc(100% - 32px));max-height:90vh}
.tpl-toduyen .td-dlg-head{position:relative;padding:24px 24px 16px;background:var(--accent)}
.tpl-toduyen .td-dlg-head h2{font:700 20px/1.5 'Times New Roman',Times,serif;letter-spacing:.02em;text-align:end;text-transform:uppercase;text-shadow:1px 1px 2px rgba(0,0,0,.2);color:#fff}
.tpl-toduyen .td-dlg-head .td-x{top:12px;right:12px;background:none;color:rgba(255,255,255,.8)}
.tpl-toduyen .td-giftdlg .gifts{display:flex;flex-direction:column;align-items:center;gap:16px;padding:16px;color:var(--accent)}
.tpl-toduyen .td-giftdlg .gift{display:flex;flex-direction:column;align-items:center;flex:1;max-width:180px;padding:0;border:0;background:none;text-align:center;color:var(--accent);font-family:system-ui,sans-serif}
.tpl-toduyen .td-giftdlg .gift-who{display:flex;align-items:flex-start;justify-content:center;min-height:2rem;margin:0 0 8px;font:500 12px/16px system-ui,sans-serif;color:var(--accent)}
.tpl-toduyen .td-giftdlg .gift img{width:128px;height:128px;margin:0;padding:8px;border:2px solid color-mix(in srgb,var(--accent) 12.5%,transparent);border-radius:12px;background:#fff;box-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1);object-fit:contain}
.tpl-toduyen .td-giftdlg .gift p{margin:2px 0 0;font-size:10px;line-height:15px}
.tpl-toduyen .td-giftdlg .gift-bank{margin-top:8px!important}
.tpl-toduyen .td-giftdlg .gift-acc{gap:6px;font-family:ui-monospace,monospace;letter-spacing:0}
.tpl-toduyen .td-giftdlg .gift-holder{font-weight:600;color:var(--accent)}
.tpl-toduyen .td-giftdlg .copy{padding:4px 8px;border:0;border-radius:999px;background:color-mix(in srgb,var(--accent) 8%,transparent);color:var(--accent);font-size:10px;font-weight:500}
@media (max-width:639px){.tpl-toduyen .td-giftdlg{margin:auto auto 0;width:100%;max-width:none;border-radius:16px 16px 0 0}}

/* ---- lời nhắn cuối + dải lụa khép thiệp ---- */
.tpl-toduyen .td-foot{position:relative;z-index:10;display:flex;flex-direction:column;align-items:center;padding:24px 24px 8px;text-align:center}
.tpl-toduyen .td-foot p{margin:0 auto;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;line-height:1.5;white-space:pre-line;color:var(--accent)}
.tpl-toduyen .credit{position:relative;z-index:20;padding:0 0 16px;font-family:system-ui,sans-serif;font-size:12px;line-height:16px;opacity:.5;color:var(--accent)}
.tpl-toduyen .credit a{text-decoration:none}
.tpl-toduyen .td-end .td-wrap{height:120px}
.tpl-toduyen .td-end .td-d.l{right:115px;top:-102px;height:431px;width:144px;--tf:rotate(77.08deg)}
.tpl-toduyen .td-end .td-d.r{left:-355px;top:-20px;height:181px;width:1031px;--tf:scaleX(-1)}
.tpl-toduyen .s-story{position:relative;z-index:10;max-width:441px;margin:0 auto;padding:32px 10%;font-family:'Times New Roman',serif;font-size:16px;color:var(--td-dark)}

@media (min-width:640px){
  .tpl-toduyen .td-ocard{width:340px}
  .tpl-toduyen .td-onames{font-size:36px}
  .tpl-toduyen .td-onames i{font-size:20px}
  .tpl-toduyen .td-obtn{font-weight:500}
  .tpl-toduyen .td-wform input{margin-bottom:15px;font-size:13px;line-height:20px}
  .tpl-toduyen .td-wform textarea{font-size:13px;line-height:19.5px;margin-bottom:11px}
  .tpl-toduyen .td-giftdlg{width:min(576px,calc(100% - 32px))}
  .tpl-toduyen .td-giftdlg .gifts{flex-direction:row;flex-wrap:wrap;align-items:flex-start;justify-content:center;padding:24px}
  .tpl-toduyen .td-giftdlg .gift{max-width:none}
  .tpl-toduyen .td-giftdlg .gift img{width:160px;height:160px}
}
/* màn rộng: cột 900px có viền mảnh, nội dung trong khung 600px, các khối lớn hơn như bản gốc */
@media (min-width:768px){
  .tpl-toduyen .card{max-width:900px;border:1px solid color-mix(in srgb,var(--accent) 13%,transparent)}
  .tpl-toduyen .td-wrap,.tpl-toduyen .td-album,.tpl-toduyen .td-venue,.tpl-toduyen .s-story{max-width:600px}
  .tpl-toduyen .td-body,.tpl-toduyen .td-gbody,.tpl-toduyen .td-gbx{padding-left:5px;padding-right:5px}
  .tpl-toduyen .td-venue{padding-left:5px;padding-right:5px}
  .tpl-toduyen .td-h{font-size:27px}
  .tpl-toduyen .td-ocard{width:520px}
  .tpl-toduyen .td-obg img{width:108px}
  .tpl-toduyen .td-obg .tl{transform:translateX(-11%) rotate(45deg)}
  .tpl-toduyen .td-obg .br{transform:translateX(11%) rotate(-45deg) scaleX(-1)}
  .tpl-toduyen .td-obody{padding:96px 24px 32px}
  .tpl-toduyen .td-oto{max-width:380px}
  .tpl-toduyen .td-cover .l1{right:-200px;top:-82px;height:811px;width:269px}
  .tpl-toduyen .td-cover .f1{right:-170px;top:30px;height:486px;width:408px}
  .tpl-toduyen .td-cover .l2{left:-180px;top:762px;height:810px;width:269px}
  .tpl-toduyen .td-cover .r1{bottom:54px;left:-358px;height:246px;width:1403px}
  .tpl-toduyen .td-frame{border-width:7px}
  .tpl-toduyen .td-names span{font-size:231px}
  .tpl-toduyen .td-names p+p{margin-top:6px}
  .tpl-toduyen .td-invite .td-d.l{right:-200px;top:212px;height:700px;width:269px}
  .tpl-toduyen .td-invite .td-d.f{right:-350px;top:200px;height:500px}
  .tpl-toduyen .td-invite .td-d.r{bottom:-47px;left:-341px;height:246px;width:1403px}
  .tpl-toduyen .td-invite .td-body{gap:28px}
  .tpl-toduyen .td-fams{column-gap:22px;row-gap:4px}
  .tpl-toduyen .td-fams>i{height:68px}
  .tpl-toduyen .td-fam .k{font-size:16px}
  .tpl-toduyen .td-fam .a{font-size:14px}
  .tpl-toduyen .td-lead{max-width:560px;font-size:20px}
  .tpl-toduyen .td-couple{gap:14px}
  .tpl-toduyen .td-role{font-size:14px}
  .tpl-toduyen .td-amp{font-size:48px}
  .tpl-toduyen .td-place{font-size:20px}
  .tpl-toduyen .td-when{font-size:16px}
  .tpl-toduyen .td-date{gap:12px}
  .tpl-toduyen .td-date b{font-size:78px}
  .tpl-toduyen .td-date i{height:63px}
  .tpl-toduyen .td-date em{font-size:23px}
  .tpl-toduyen .td-lunar{font-size:16px}
  .tpl-toduyen .td-cf-stage{height:520px}
  .tpl-toduyen .td-cf-nav{position:absolute;top:50%;z-index:200;display:flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border:0;border-radius:50%;background:color-mix(in srgb,#f2f2f2 60%,transparent);color:#1f2937;transform:translateY(-50%);transition:background .15s}
  .tpl-toduyen .td-cf-nav:hover{background:#f2f2f2}
  .tpl-toduyen .td-cf-nav.prev{left:0}
  .tpl-toduyen .td-cf-nav.next{right:0}
  .tpl-toduyen .td-party .td-d.l{left:-150px;top:182px;height:472px;width:158px}
  .tpl-toduyen .td-party .td-d.f{left:-285px;top:101px;height:412px}
  .tpl-toduyen .td-party .td-d.r{bottom:27px;left:-538px;height:246px;width:1403px}
  .tpl-toduyen .td-party .td-body{gap:32px}
  .tpl-toduyen .td-pgroup{gap:24px}
  .tpl-toduyen .td-plead{font-size:20px}
  .tpl-toduyen .td-party .td-when{gap:34px;font-size:20px}
  .tpl-toduyen .td-cd h2,.tpl-toduyen .td-cd p{font-size:27px}
  .tpl-toduyen .td-marks .k{font-size:15px}
  .tpl-toduyen .td-marks .t{font-size:27px}
  .tpl-toduyen .td-calbox{max-width:414px}
  .tpl-toduyen .td-calbox .cal-grid{font-size:13px}
  .tpl-toduyen .td-calbox .cal-grid span{height:34px}
  .tpl-toduyen .td-calbox .cal-grid .cal-w{font-size:11px}
  .tpl-toduyen .td-calbox .cal-on::before{width:30px;height:28px}
  .tpl-toduyen .td-calbox .cal-on b{font-size:12px}
  .tpl-toduyen .td-link{font-size:19px}
  .tpl-toduyen .td-venue h3{font-size:24px}
  .tpl-toduyen .td-addr{font-size:16px}
  .tpl-toduyen .td-mapcol{gap:20px}
  .tpl-toduyen .td-map{height:360px}
  .tpl-toduyen .td-dir{font-size:16px;line-height:24px}
  .tpl-toduyen .td-sched .td-d.l{right:-200px;top:-98px;height:572px;width:191px}
  .tpl-toduyen .td-sched .td-d.f{right:-301px;top:-192px;height:387px}
  .tpl-toduyen .td-sched .td-d.r{bottom:-28px;left:-303px;height:246px;width:1403px}
  .tpl-toduyen .td-tlwrap{margin-left:5px;--tl-gut:43px}
  .tpl-toduyen .td-tl{--gy:56px;column-gap:32px}
  .tpl-toduyen .td-tl .t,.tpl-toduyen .td-tl .l{font-size:18px}
  .tpl-toduyen .td-tl .ic img{width:60px;height:60px}
  .tpl-toduyen .td-gb .td-d.l{left:-234px;top:35px;height:532px;width:177px}
  .tpl-toduyen .td-wform{max-width:337px}
  .tpl-toduyen .td-wrow .td-btn{font-size:18px;line-height:24px}
  .tpl-toduyen .wish-list{max-width:345px}
  .tpl-toduyen .td-giftbox .td-d.l{left:-200px;top:-57px;height:532px;width:177px}
  .tpl-toduyen .td-giftbox .td-d.f{left:-297px;top:-69px;height:400px}
  .tpl-toduyen .td-foot p{max-width:560px;font-size:15px}
  .tpl-toduyen .td-end .td-wrap{height:163px}
  .tpl-toduyen .td-end .td-d.l{right:157px;top:-139px;height:587px;width:196px}
  .tpl-toduyen .td-end .td-d.r{left:-573px;top:-27px;height:246px;width:1403px}
}
@media (min-width:1024px){
  .tpl-toduyen .td-ocard{width:600px}
  .tpl-toduyen .td-obg img{width:200px}
  .tpl-toduyen .td-oto{max-width:440px}
}
`,
};
