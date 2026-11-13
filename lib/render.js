// Dựng HTML trang thiệp công khai (render phía server để Zalo/Facebook đọc được ảnh xem trước).
const { esc } = require('./util');
const musicLib = require('./music');
const { lunarText, solarToLunar, canChiYear } = require('./lunar');
const banks = require('./banks');
const config = require('../config.json');
const { inviteWord } = require('./carddata');

const templates = {
  // thứ tự này là thứ tự hiện ở bộ sưu tập trang chủ và trình chỉnh sửa (xen kẽ phong cách)
  dodam: require('../templates/dodam'),
  songhy: require('../templates/songhy'),
  longphung: require('../templates/longphung'),
  toduyen: require('../templates/toduyen'),
  thanhdiep: require('../templates/thanhdiep'),
  nau: require('../templates/nau'),
  songhy2: require('../templates/songhy2'),
  hoamoc: require('../templates/hoamoc'),
  naudam: require('../templates/naudam'),
  xanhla: require('../templates/xanhla'),
  tim: require('../templates/tim'),
  // 18 mẫu mới (bố cục học từ các mẫu bán chạy trên thị trường, tài sản tự làm)
  hanthu: require('../templates/hanthu'),
  anhdo: require('../templates/anhdo'),
  bienxanh: require('../templates/bienxanh'),
  phongdo: require('../templates/phongdo'),
  reuthu: require('../templates/reuthu'),
  cucdai: require('../templates/cucdai'),
  phuonghoang: require('../templates/phuonghoang'),
  rongngoc: require('../templates/rongngoc'),
  ngoctrai: require('../templates/ngoctrai'),
  hyvui: require('../templates/hyvui'),
  denlong: require('../templates/denlong'),
  saovang: require('../templates/saovang'),
  tapchi: require('../templates/tapchi'),
  dentrang: require('../templates/dentrang'),
  tinhkhoi: require('../templates/tinhkhoi'),
  catdan: require('../templates/catdan'),
  maunuoc: require('../templates/maunuoc'),
  senhong: require('../templates/senhong'),
  mhhb04: require('../templates/mhhb04'),
  mhda05: require('../templates/mhda05'),
  mhhb02: require('../templates/mhhb02'),
  mhradiant: require('../templates/mhradiant'),
  mhna01: require('../templates/mhna01'),
  mh2m05: require('../templates/mh2m05'),
  mhat01: require('../templates/mhat01'),
  mhtd03: require('../templates/mhtd03'),
  mhbustle: require('../templates/mhbustle'),
  mhnc11: require('../templates/mhnc11'),
  mhda01: require('../templates/mhda01'),
  mhredflow: require('../templates/mhredflow'),
  mhpasiona: require('../templates/mhpasiona'),
  mhds03: require('../templates/mhds03'),
  mhda04: require('../templates/mhda04'),
  mhflowers: require('../templates/mhflowers'),
  mhsleazy: require('../templates/mhsleazy'),
  mhmn01: require('../templates/mhmn01'),
  mhds01: require('../templates/mhds01'),
  mhna02: require('../templates/mhna02'),
};
const DEFAULT_TEMPLATE = 'dodam';

const WD = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

function parts(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? { y: m[1], m: m[2], d: m[3] } : null;
}
function weekday(iso) {
  const p = parts(iso);
  return p ? WD[new Date(Date.UTC(+p.y, +p.m - 1, +p.d)).getUTCDay()] : '';
}
function dmy(iso, sep = '.') {
  const p = parts(iso);
  return p ? [p.d, p.m, p.y].join(sep) : '';
}
function timeText(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  return `${+h} giờ${m !== '00' ? ' ' + m : ''}`;
}
// "12/11 Bính Ngọ" — âm lịch dạng ngắn cho các chỗ chật
function lunarShort(iso) {
  const p = parts(iso);
  if (!p) return '';
  const l = solarToLunar(+p.d, +p.m, +p.y);
  return `${l.day}/${l.month}${l.leap ? ' nhuận' : ''} ${canChiYear(l.year)}`;
}
function clock(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  return `${+h}:${m}`;
}

/**
 * Khối ngày cưới trên trang bìa — dùng chung cho mọi mẫu, 4 kiểu:
 *  bloc  : tờ lịch bloc (dải màu có 2 lỗ ghim, số ngày lớn, thứ + âm lịch)
 *  stack : "Tháng 12 · 2026" / số ngày rất lớn / thứ · giờ
 *  line  : "20 · 12 · 2026" một dòng giữa hai gạch mảnh
 *  split : thứ | ngày | tháng-năm, ngăn bằng vạch đứng
 * Màu: chữ theo màu chữ nơi đặt (currentColor), điểm nhấn = --db-hi (mặc định --gold).
 */
function dateBlock(ctx, variant = 'split') {
  const p = ctx.dparts;
  if (!p) return '';
  const wd = esc(ctx.weekday), time = esc(ctx.timeText), lunar = esc(ctx.lunar);
  const sub = (txt) => txt ? `<p class="db-sub">${txt}</p>` : '';
  switch (variant) {
    case 'bloc':
      return `<div class="db db-bloc"><div class="db-page"><div class="db-band"><i></i><i></i><span>Tháng ${+p.m} · ${p.y}</span></div><b class="db-d">${p.d}</b><p class="db-wd">${wd}</p><p class="db-al">${esc(lunarShort(ctx.date))}</p></div>${sub(time ? `Vào lúc ${time}` : '')}</div>`;
    case 'stack':
      return `<div class="db db-stack"><span class="db-my">Tháng ${+p.m} · ${p.y}</span><b class="db-d">${p.d}</b><span class="db-wd">${wd}${time ? ` · ${time}` : ''}</span>${sub(lunar)}</div>`;
    case 'line':
      return `<div class="db db-line"><b class="db-d">${p.d}<i>·</i>${p.m}<i>·</i>${p.y}</b><span class="db-wd">${wd}${time ? ` — ${time}` : ''}</span>${sub(lunar)}</div>`;
    default:
      return `<div class="db db-split"><div class="db-row"><span class="db-wd">${wd}</span><b class="db-d">${p.d}</b><span class="db-my">Tháng ${+p.m}<br>${p.y}</span></div>${sub([time, lunar].filter(Boolean).join(' · '))}</div>`;
  }
}

function bankName(bin) {
  return (banks.find((b) => b.bin === bin) || {}).name || '';
}
function calendarLink(title, iso, time, place) {
  const p = parts(iso);
  if (!p) return '';
  const [h, mi] = (time || '09:00').split(':');
  const start = `${p.y}${p.m}${p.d}T${h}${mi}00`;
  const endH = String(Math.min(23, +h + 3)).padStart(2, '0');
  const end = `${p.y}${p.m}${p.d}T${endH}${mi}00`;
  const q = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${start}/${end}`, ctz: 'Asia/Ho_Chi_Minh', location: place || '' });
  return 'https://calendar.google.com/calendar/render?' + q.toString();
}
function mapSearch(addr) {
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(addr);
}
function absUrl(base, u) {
  if (!u) return '';
  return /^https?:\/\//.test(u) ? u : base.replace(/\/$/, '') + u;
}

function makeCtx(card, opts) {
  const d = card.data;
  const tpl = templates[card.template] || templates[DEFAULT_TEMPLATE];
  const pal = tpl.palettes.find((p) => p.id === card.palette) || tpl.palettes[0];
  const g = d.groom.name || 'Chú rể';
  const b = d.bride.name || 'Cô dâu';
  const ctx = {
    card, d, tpl, pal, esc, g, b,
    guest: opts.guest || null,
    date: d.date, time: d.time,
    weekday: weekday(d.date), dmy: dmy(d.date), dparts: parts(d.date),
    lunar: lunarText(d.date), lunarShort: lunarShort(d.date), timeText: timeText(d.time),
    initials: `${g.trim().split(/\s+/).pop()[0] || ''}&${b.trim().split(/\s+/).pop()[0] || ''}`,
  };
  ctx.dateBlock = (variant) => dateBlock(ctx, variant);
  return ctx;
}

// ---------- các khối nội dung dùng chung cho mọi mẫu ----------

function secTitle(ctx, text, sub) {
  return ctx.tpl.title ? ctx.tpl.title(text, sub) : `<h2 class="sec-title">${esc(text)}</h2>${sub ? `<p class="sec-sub">${esc(sub)}</p>` : ''}`;
}

function sInvite(ctx) {
  const { d, guest } = ctx;
  const fam = (p, label) => `
    <div class="fam">
      <p class="fam-label">${label}</p>
      ${p.father ? `<p>${esc(p.father)}</p>` : ''}
      ${p.mother ? `<p>${esc(p.mother)}</p>` : ''}
      ${p.address ? `<p class="fam-addr">${esc(p.address)}</p>` : ''}
    </div>`;
  const hasFam = d.groom.father || d.groom.mother || d.bride.father || d.bride.mother;
  return `
  <section class="sec s-invite reveal">
    ${hasFam ? `<div class="fams">${fam(d.groom, 'Nhà trai')}${fam(d.bride, 'Nhà gái')}</div>` : ''}
    <p class="invite-lead">${esc(d.inviteText)}</p>
    <p class="guest-name">${guest ? esc(guest.name) : 'Quý khách'}</p>
    <p class="invite-to">tới dự buổi tiệc chung vui cùng gia đình chúng tôi</p>
    <div class="couple-full">
      <div><p class="role">Chú rể</p><p class="full">${esc(d.groom.fullName || d.groom.name)}</p></div>
      <div class="amp">&amp;</div>
      <div><p class="role">Cô dâu</p><p class="full">${esc(d.bride.fullName || d.bride.name)}</p></div>
    </div>
    ${d.message ? `<p class="invite-msg">${esc(d.message)}</p>` : ''}
  </section>`;
}

// Lịch trình dạng dòng thời gian: giờ bên trái, chấm + vạch dọc, nội dung bên phải.
// Bản đồ thu gọn trong <details> — chỉ tải khi khách bấm "Xem bản đồ".
function sEvents(ctx) {
  const evs = ctx.d.events.filter((e) => e.name || e.place);
  if (!evs.length) return '';
  const title = `Đám cưới ${ctx.g} & ${ctx.b}`;
  const sameDay = evs.every((e) => !e.date || e.date === ctx.date);
  return `
  <section class="sec s-events">
    ${secTitle(ctx, 'Lịch trình', sameDay && ctx.date ? `${ctx.weekday}, ${ctx.dmy}` : 'Ngày vui của chúng mình')}
    <ol class="tl">
    ${evs.map((e) => {
      const p = parts(e.date);
      const dir = e.mapUrl || (e.address ? mapSearch(e.address) : '');
      return `
      <li class="tl-item reveal">
        <div class="tl-when"><b>${esc(clock(e.time)) || '—'}</b>${p && !sameDay ? `<span>${p.d}.${p.m}</span>` : ''}</div>
        <div class="tl-body">
          <h3>${esc(e.name)}</h3>
          ${p && !sameDay ? `<p class="tl-date">${esc(weekday(e.date))}, ${esc(dmy(e.date))} · ${esc(lunarShort(e.date))}</p>` : ''}
          ${e.place ? `<p class="tl-place">${esc(e.place)}</p>` : ''}
          ${e.address ? `<p class="tl-addr">${esc(e.address)}</p>` : ''}
          <p class="tl-act">
            ${dir ? `<a target="_blank" rel="noopener" href="${esc(dir)}">Chỉ đường</a>` : ''}
            ${e.date ? `<a target="_blank" rel="noopener" href="${esc(calendarLink(`${e.name} — ${title}`, e.date, e.time, e.address || e.place))}">Lưu vào lịch</a>` : ''}
          </p>
          ${e.address ? `<details class="tl-map"><summary>Xem bản đồ</summary><div class="map"><iframe loading="lazy" title="Bản đồ ${esc(e.name)}" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(e.address)}&amp;output=embed"></iframe></div></details>` : ''}
        </div>
      </li>`;
    }).join('')}
    </ol>
  </section>`;
}

// Lịch tháng (ngày cưới khoanh tim) + đếm ngược gọn một dòng, gộp trong một khối.
// Lưới lịch tháng của ngày cưới (thứ Hai đứng đầu), ngày cưới khoanh tim. `head` thay dòng tiêu đề tháng.
function calGrid(ctx, head) {
  const p = ctx.dparts;
  if (!p) return '';
  const y = +p.y, m = +p.m, day = +p.d;
  const first = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // thứ Hai = 0
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  let cells = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((w) => `<span class="cal-w">${w}</span>`).join('');
  cells += '<span></span>'.repeat(first);
  for (let i = 1; i <= days; i++) cells += i === day ? `<span class="cal-on" aria-label="Ngày cưới ${i}"><b>${i}</b></span>` : `<span>${i}</span>`;
  return `<div class="cal">${head ?? `<p class="cal-head">Tháng ${m} <i></i> ${y}</p>`}<div class="cal-grid">${cells}</div></div>`;
}

function sCalendar(ctx) {
  const p = ctx.dparts;
  const showCal = ctx.d.show.calendar, showCd = ctx.d.show.countdown;
  if (!p || (!showCal && !showCd)) return '';
  const grid = showCal ? calGrid(ctx) : '';
  const u = (k, l) => `<span class="cd-u"><b data-cd="${k}">0</b><small>${l}</small></span>`;
  return `
  <section class="sec s-cal reveal">
    ${secTitle(ctx, showCal ? 'Ngày chung đôi' : 'Đếm ngược')}
    <p class="cal-sub">${esc(ctx.weekday)} · âm lịch ${esc(ctx.lunarShort)}</p>
    ${grid}
    ${showCd ? `<div class="cd" role="timer"><span class="cd-k">Còn</span>${u('d', 'ngày')}${u('h', 'giờ')}${u('m', 'phút')}${u('s', 'giây')}</div>` : ''}
  </section>`;
}

function sStory(ctx) {
  if (!ctx.d.story) return '';
  return `
  <section class="sec s-story reveal">
    ${secTitle(ctx, 'Chuyện của chúng mình')}
    ${ctx.d.story.split(/\n+/).map((p) => `<p>${esc(p)}</p>`).join('')}
  </section>`;
}

function sGallery(ctx) {
  const ph = ctx.d.photos;
  if (!ctx.d.show.gallery || !ph.length) return '';
  return `
  <section class="sec s-gallery">
    ${secTitle(ctx, 'Album ảnh cưới')}
    <div class="gallery">
      ${ph.map((u, i) => `<button class="ph reveal" data-i="${i}" style="background-image:url('${esc(u)}')" aria-label="Xem ảnh ${i + 1}"></button>`).join('')}
    </div>
  </section>`;
}

function sRsvp(ctx) {
  if (!ctx.d.show.rsvp) return '';
  const gname = ctx.guest ? esc(ctx.guest.name) : '';
  return `
  <section class="sec s-rsvp reveal" id="rsvp">
    ${secTitle(ctx, 'Xác nhận tham dự', 'Giúp chúng mình chuẩn bị chu đáo hơn')}
    <form class="form" id="rsvpForm">
      <label>Tên của bạn<input name="name" required maxlength="80" value="${gname}" placeholder="Nguyễn Văn A"></label>
      <div class="choice">
        <label><input type="radio" name="attending" value="yes" checked><span>Mình sẽ đến</span></label>
        <label><input type="radio" name="attending" value="no"><span>Tiếc quá, không đến được</span></label>
      </div>
      <div class="row2">
        <label>Số người<select name="count">${[1, 2, 3, 4, 5].map((n) => `<option>${n}</option>`).join('')}</select></label>
        <label>Bạn là khách<select name="side"><option value="trai">Nhà trai</option><option value="gai">Nhà gái</option></select></label>
      </div>
      <label>Nhắn gửi (không bắt buộc)<input name="note" maxlength="200" placeholder="Ví dụ: mình ăn chay"></label>
      <button class="btn block" type="submit">Gửi xác nhận</button>
      <p class="form-msg" role="status"></p>
    </form>
  </section>`;
}

function giftCard(ctx, p, who) {
  if (!p.bin || !p.acc) return '';
  const qr = `https://img.vietqr.io/image/${p.bin}-${encodeURIComponent(p.acc)}-qr_only.png?accountName=${encodeURIComponent(p.holder)}&addInfo=${encodeURIComponent('Mung cuoi ' + (who === 'groom' ? ctx.g : ctx.b))}`;
  return `
    <div class="gift">
      <p class="gift-who">${who === 'groom' ? 'Mừng cưới chú rể' : 'Mừng cưới cô dâu'}</p>
      <img loading="lazy" src="${esc(qr)}" alt="Mã QR chuyển khoản" width="200" height="200">
      <p class="gift-bank">${esc(bankName(p.bin))}</p>
      <p class="gift-acc"><span>${esc(p.acc)}</span><button type="button" class="copy" data-copy="${esc(p.acc)}">Sao chép</button></p>
      <p class="gift-holder">${esc(p.holder)}</p>
    </div>`;
}

function sGift(ctx) {
  if (!ctx.d.show.gift) return '';
  const html = giftCard(ctx, ctx.d.gifts.groom, 'groom') + giftCard(ctx, ctx.d.gifts.bride, 'bride');
  if (!html) return '';
  return `
  <section class="sec s-gift reveal">
    ${secTitle(ctx, 'Hộp mừng cưới', 'Gửi lời chúc phúc tới cô dâu chú rể')}
    <div class="gifts">${html}</div>
  </section>`;
}

function sWishes(ctx, wishes) {
  if (!ctx.d.show.wishes) return '';
  return `
  <section class="sec s-wishes reveal">
    ${secTitle(ctx, 'Sổ lưu bút', 'Để lại lời chúc cho chúng mình nhé')}
    <form class="form" id="wishForm">
      <label>Tên<input name="name" required maxlength="60" value="${ctx.guest ? esc(ctx.guest.name) : ''}"></label>
      <label>Lời chúc<textarea name="message" required maxlength="500" rows="3" placeholder="Chúc hai bạn trăm năm hạnh phúc!"></textarea></label>
      <button class="btn block" type="submit">Gửi lời chúc</button>
      <p class="form-msg" role="status"></p>
    </form>
    <div class="wish-list" id="wishList">
      ${wishes.map((w) => `<div class="wish"><b>${esc(w.name)}</b><p>${esc(w.message)}</p></div>`).join('')}
    </div>
  </section>`;
}

function sThanks(ctx) {
  return `
  <section class="sec s-thanks reveal">
    <p class="thanks-big">Cảm ơn bạn</p>
    <p>vì đã là một phần trong ngày hạnh phúc của chúng mình</p>
    <p class="thanks-names">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
  </section>`;
}

// ---------- ghép khối ----------
// Mẫu có thể đổi thứ tự khối (`layout`) và thay riêng từng khối (`sections[tên](ctx, opts, helpers)`),
// kể cả thêm khối mới chỉ mẫu đó có. `helpers` cho mẫu dùng lại các khối & hàm định dạng chung.
const SECTIONS = {
  invite: sInvite,
  calendar: sCalendar,
  events: sEvents,
  story: sStory,
  gallery: sGallery,
  rsvp: sRsvp,
  gift: sGift,
  wishes: (ctx, opts) => sWishes(ctx, opts.wishes || []),
  thanks: sThanks,
};
const DEFAULT_LAYOUT = ['invite', 'calendar', 'events', 'story', 'gallery', 'rsvp', 'gift', 'wishes', 'thanks'];
const helpers = {
  ...SECTIONS, secTitle, calGrid, giftCard, esc,
  parts, weekday, dmy, timeText, clock, lunarText, lunarShort, mapSearch, calendarLink,
};

// ---------- trang ----------

function page({ title, desc, image, fonts, styleVars, css, bodyClass, body, cfg }) {
  const vars = Object.entries(styleVars || {}).map(([k, v]) => `${k}:${v}`).join(';');
  return `<!doctype html>
<html lang="vi"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex,nofollow">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fonts ? `<link rel="stylesheet" href="${esc(fonts)}">` : ''}
<link rel="stylesheet" href="/card/card.css">
<style>:root{${vars}}${css || ''}</style>
</head>
<body class="${bodyClass || ''}">
${body}
${cfg ? `<script>window.__CARD=${JSON.stringify(cfg).replace(/</g, '\\u003c')}</script><script src="/card/card.js" defer></script>` : ''}
${cfg && cfg.edit ? '<script src="/card/edit.js" defer></script>' : ''}
</body></html>`;
}

/**
 * card: { slug, template, palette, data, ... }
 * opts: { guest, wishes, preview, lite, trial, baseUrl }  (lite: bản nhẹ cho thẻ rê chuột, xem .is-lite)
 */
// ---------- chế độ sửa trực tiếp (khung xem trước trong trang sửa thiệp) ----------
// Ô ảnh trống hiện ảnh giữ chỗ "Bấm để tải ảnh"; mọi ảnh được gắn "#k=<vị trí>" (cover, photos.0…) ở cuối link
// để trang biết người dùng bấm vào ô nào. Không cần sửa từng mẫu: mẫu vẫn chỉ đọc card.data như bình thường.
const SLOT = '/card/slot.svg';
const tagPhoto = (u, k) => (u ? `${u}${u.includes('#') ? '&' : '#'}k=${k}` : `${SLOT}#k=${k}`);
// Chữ còn trống: mẫu thường ẩn cả dòng → ở chế độ sửa điền chữ giữ chỗ "+ Thêm …" để có chỗ bấm vào (khách không thấy)
const PLACEHOLDER = {
  'groom.father': '+ Thêm tên bố chú rể', 'groom.mother': '+ Thêm tên mẹ chú rể', 'groom.address': '+ Thêm địa chỉ nhà trai',
  'bride.father': '+ Thêm tên bố cô dâu', 'bride.mother': '+ Thêm tên mẹ cô dâu', 'bride.address': '+ Thêm địa chỉ nhà gái',
  message: '+ Thêm lời nhắn gửi khách mời', story: '+ Thêm đôi dòng về chuyện tình của hai bạn',
};
const EV_PH = { name: '+ Tên lễ', place: '+ Thêm nơi tổ chức', address: '+ Thêm địa chỉ' };
// các ô chữ bấm vào sửa được: [đường dẫn dữ liệu, chữ đang hiện, là chữ giữ chỗ?]
function editFields(d) {
  const out = [];
  const add = (k, v, ph) => out.push(v ? [k, v] : [k, ph, 1]);
  for (const side of ['groom', 'bride']) {
    out.push([`${side}.name`, d[side].name || (side === 'groom' ? 'Chú rể' : 'Cô dâu')]);
    if (d[side].fullName) out.push([`${side}.fullName`, d[side].fullName]);
    for (const f of ['father', 'mother', 'address']) add(`${side}.${f}`, d[side][f], PLACEHOLDER[`${side}.${f}`]);
  }
  if (d.inviteText) out.push(['inviteText', d.inviteText]);
  // mẫu có chữ mời viết sẵn ("Thân mời") hiện chữ đó khi lời mời còn mặc định → bấm vào chữ đó cũng sửa được lời mời
  if (inviteWord(d, '') === '') out.push(['inviteText', 'Thân mời']);
  add('message', d.message, PLACEHOLDER.message);
  add('story', d.story, PLACEHOLDER.story);
  // chữ giữ chỗ của từng lễ kèm tên lễ, để hai lễ cùng trống không trùng chữ (bấm đúng lễ)
  const names = d.events.map((e, i) => e.name || `lễ ${i + 1}`);
  d.events.forEach((e, i) => {
    const who = names.indexOf(names[i]) === i ? names[i] : `${names[i]} (${i + 1})`;
    add(`events.${i}.name`, e.name, `${EV_PH.name} ${i + 1}`);
    add(`events.${i}.place`, e.place, `${EV_PH.place} ${who}`);
    add(`events.${i}.address`, e.address, `${EV_PH.address} ${who}`);
    // giờ của lễ: mẫu in "10:00", "9:00" hoặc "10 giờ" → bấm vào giờ cũng mở đúng lễ
    if (e.time) [...new Set([e.time, clock(e.time), timeText(e.time)])].forEach((t) => out.push([`events.${i}.time`, t]));
  });
  // dòng "+ Thêm lễ" cuối lịch trình (chỉ ở chế độ sửa) — bấm vào để thêm lễ mới
  if (d.events.length < 6) out.push([`events.${d.events.length}.name`, ADD_EVENT, 1]);
  if (d.time) [...new Set([d.time, clock(d.time), timeText(d.time)])].forEach((t) => out.push(['time', t]));
  // tài khoản mừng cưới: bấm vào số tài khoản / tên chủ tài khoản → mở bảng Mừng cưới
  for (const side of ['groom', 'bride']) for (const f of ['acc', 'holder']) if (d.gifts[side][f]) out.push([`gifts.${side}.${f}`, d.gifts[side][f]]);
  return out;
}
const ADD_EVENT = '+ Thêm lễ';
function editableCard(card, fields) {
  const tpl = templates[card.template] || templates[DEFAULT_TEMPLATE];
  const d = JSON.parse(JSON.stringify(card.data));
  if (d.events.length < 6) d.events.push({ name: '', date: d.date, time: '', place: '', address: '', mapUrl: '' });
  for (const [k, v, ph] of fields) if (ph) { const ks = k.split('.'); let o = d; ks.slice(0, -1).forEach((x) => (o = o[x])); o[ks[ks.length - 1]] = v; }
  // luôn chừa ít nhất một ô trống cuối album để thêm ảnh
  const want = Math.min(24, Math.max(d.photos.length + 1, (tpl.demo && tpl.demo.photos && tpl.demo.photos.length) || 6));
  d.photos = Array.from({ length: want }, (_, i) => tagPhoto(d.photos[i], `photos.${i}`));
  d.cover = tagPhoto(d.cover, 'cover');
  return { ...card, data: d };
}

function renderCard(card, opts = {}) {
  const fields = opts.edit ? editFields(card.data) : null;
  const realEvents = card.data.events || []; // dữ liệu thật (bản sửa bên dưới có chữ giữ chỗ)
  if (opts.edit) card = editableCard(card, fields);
  // album có thể có ô trống ('') giữ vị trí khi sửa → khách xem chỉ thấy các ảnh đã có, mẫu không phải xử lý ô trống
  else if ((card.data.photos || []).some((u) => !u)) card = { ...card, data: { ...card.data, photos: card.data.photos.filter(Boolean) } };
  // dán link Google Maps tự điền tên địa điểm vào cả "nơi tổ chức" lẫn "địa chỉ" → không in lặp hai lần
  const same = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
  if ((card.data.events || []).some((e) => e.place && same(e.place, e.address))) {
    card = { ...card, data: { ...card.data, events: card.data.events.map((e) => (e.place && same(e.place, e.address) ? { ...e, place: '' } : e)) } };
  }
  // lễ có link Google Maps mà chưa ghi địa chỉ: mẫu chỉ vẽ bản đồ khi có địa chỉ → đặt tạm một mốc
  // (@@PINi@@) cho bản đồ hiện ra, rồi xoá mốc khỏi chữ hiển thị ở bước sau
  if (!opts.edit && (card.data.events || []).some((e) => e.mapPin && !e.address)) {
    card = { ...card, data: { ...card.data, events: card.data.events.map((e, i) => (e.mapPin && !e.address ? { ...e, address: `@@PIN${i}@@` } : e)) } };
  }
  const ctx = makeCtx(card, opts);
  const { d, tpl, pal } = ctx;
  const bgm = musicLib.effective(d, tpl.group || 'toigian'); // chưa chọn nhạc → nhạc mẫu hợp với nhóm mẫu thiệp
  const baseUrl = opts.baseUrl || config.baseUrl;
  const title = `Thiệp cưới ${ctx.g} & ${ctx.b}`;
  const desc = [ctx.date && `${ctx.weekday}, ${ctx.dmy}`, ctx.guest && `${inviteWord(d, 'Trân trọng kính mời')} ${ctx.guest.name}`].filter(Boolean).join(' — ') || 'Trân trọng kính mời bạn tới dự lễ cưới của chúng mình';
  const body = `
${tpl.opener(ctx)}
${opts.trial && !opts.edit ? `<a class="trial-tag" href="/" target="_blank" rel="noopener">Bản dùng thử</a>` : ''}
${bgm ? `<audio id="bgm" src="${esc(bgm)}" loop preload="none"></audio><button class="music-btn" id="musicBtn" aria-label="Bật/tắt nhạc"><span>♫</span><i class="mb-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></i></button>` : ''}
<main class="card">
  ${tpl.cover(ctx)}
  ${(tpl.layout || DEFAULT_LAYOUT).map((name) => {
    const fn = (tpl.sections && tpl.sections[name]) || SECTIONS[name];
    return fn ? fn(ctx, opts, helpers) : '';
  }).join('\n')}
  <footer class="credit">${opts.trial ? `<a href="/" target="_blank" class="wm">Bản dùng thử · Tạo thiệp miễn phí tại <b>${esc(config.brand)}</b></a>` : `<a href="/" target="_blank">Thiệp cưới online · ${esc(config.brand)}</a>`}</footer>
</main>
<div class="lightbox" id="lightbox" hidden><button class="lb-close" aria-label="Đóng">×</button><img alt=""></div>
<div class="toast" id="toast"></div>`;
  // bản đồ nhúng: tìm lễ của từng bản đồ (theo chữ địa chỉ trong link) →
  //  - lễ có link Google Maps (đã đọc ra toạ độ): ghim đúng toạ độ thay vì để Google đoán theo chữ
  //  - trình sửa: gắn data-ev để cả khu địa điểm thành một khối bấm-là-sửa; lễ chưa có địa chỉ (chữ giữ chỗ)
  //    → thay bản đồ "đoán bừa" bằng ô giữ chỗ
  const evs = d.events || [];
  const real = realEvents;
  const body2 = body.replace(/<iframe([^>]*?)\ssrc="https:\/\/www\.google\.com\/maps\?q=([^&"]*)&amp;output=embed"([^>]*)><\/iframe>/g, (all, pre, q, post) => {
    let t = ''; try { t = decodeURIComponent(q); } catch (e) { return all; }
    const i = evs.findIndex((x) => x.address && t.includes(x.address));
    if (i < 0) return all;
    const e = evs[i], hasAddr = !!(real[i] && (real[i].address || real[i].mapPin));
    if (opts.edit && !hasAddr) {
      const cls = (/class="([^"]*)"/.exec(pre + post) || [])[1] || '';
      return `<div class="${esc(cls)} ce-mapph" data-ev="${i}"><span>📍 Dán link Google Maps để hiện bản đồ</span></div>`;
    }
    const pin = e.mapPin || (real[i] && real[i].mapPin);
    const src = pin ? require('./maplink').embed(pin).replace(/&/g, '&amp;') : `https://www.google.com/maps?q=${q}&amp;output=embed`;
    return `<iframe${pre} src="${src}"${post}${opts.edit ? ` data-ev="${i}"` : ''}></iframe>`;
  }).replace(/(,\s*)?@@PIN\d+@@/g, '').replace(/(%2C(%20|\+)*)?%40%40PIN\d+%40%40/gi, ''); // xoá mốc tạm (cả trong link lịch)
  // bản nhẹ (thẻ rê chuột ở trang chủ / trang mẫu): trang thiệp nạp cùng luồng với trang chứa nên phải rẻ —
  // bản đồ Google (một trang web nguyên con) thay bằng ô giữ chỗ, mọi ảnh nạp lười + giải mã nền
  const body3 = !opts.lite ? body2 : body2
    .replace(/<iframe([^>]*?)\ssrc="https:\/\/www\.google\.com\/maps[^"]*"([^>]*)><\/iframe>/g, (all, pre, post) => {
      const cls = (/class="([^"]*)"/.exec(pre + post) || [])[1] || '';
      return `<div class="${esc(cls)}" style="width:100%;height:100%;display:grid;place-items:center;background:#eee8e4;color:#8a7f7b;font:600 13px system-ui">📍 Bản đồ</div>`;
    })
    .replace(/<img(?![^>]*\sloading=)/g, '<img loading="lazy" decoding="async"');
  return page({
    title, desc,
    image: absUrl(baseUrl, String(d.cover || d.photos[0] || '').split('#')[0]), // bỏ phần căn ảnh "#p=…" khỏi ảnh chia sẻ
    fonts: tpl.fonts,
    styleVars: pal.vars,
    css: tpl.css,
    bodyClass: `tpl-${tpl.id}${opts.preview ? ' is-preview' : ''}${opts.lite ? ' is-lite' : ''}${opts.edit ? ' is-edit' : ''}`,
    body: body3,
    cfg: {
      slug: card.slug,
      guest: ctx.guest ? ctx.guest.code : null,
      target: ctx.date ? `${ctx.date}T${ctx.time || '09:00'}:00+07:00` : null,
      photos: d.photos,
      preview: !!opts.preview,
      lite: !!opts.lite,
      demo: !!opts.demo,
      tpl: opts.demo ? tpl.id : undefined, pal: opts.demo ? pal.id : undefined,
      edit: fields ? { fields } : undefined,
    },
  });
}

function renderNotice(heading, text) {
  return page({
    title: heading,
    desc: text,
    css: 'body{display:grid;place-items:center;min-height:100vh;background:#faf6f1;font-family:system-ui,sans-serif;color:#3b2a2f;text-align:center;padding:24px}h1{font-size:22px;margin:0 0 8px}p{color:#7a6a6e;max-width:360px;margin:0 auto}a{color:#8a2c3d}',
    body: `<div><h1>${esc(heading)}</h1><p>${esc(text)}</p><p style="margin-top:20px"><a href="/">${esc(config.brand)} — Thiệp cưới online</a></p></div>`,
  });
}

// nhóm phong cách (thứ tự hiển thị ở trang chủ & trình chỉnh sửa)
const groups = [
  { id: 'truyenthong', name: 'Truyền thống' },
  { id: 'toigian', name: 'Tối giản' },
  { id: 'hoa', name: 'Hoa & thiên nhiên' },
  { id: 'hoanggia', name: 'Hoàng gia' },
  { id: 'chatlieu', name: 'Chất liệu' },
  { id: 'minhhoa', name: 'Dễ thương' },
];

function templateList() {
  return Object.values(templates).map((t) => ({
    id: t.id, name: t.name, desc: t.desc, group: t.group || 'toigian', badge: t.badge || '',
    palettes: t.palettes.map((p) => ({ id: p.id, name: p.name, swatch: p.swatch })),
  }));
}

module.exports = { renderCard, renderNotice, templates, templateList, groups, DEFAULT_TEMPLATE };
