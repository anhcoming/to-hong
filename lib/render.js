// Dựng HTML trang thiệp công khai (render phía server để Zalo/Facebook đọc được ảnh xem trước).
const { esc } = require('./util');
const { lunarText, solarToLunar, canChiYear } = require('./lunar');
const banks = require('./banks');
const config = require('../config.json');

const templates = {
  hy: require('../templates/hy'),
  toigian: require('../templates/toigian'),
  thutay: require('../templates/thutay'),
  vomcong: require('../templates/vomcong'),
  nguyetque: require('../templates/nguyetque'),
  longphung: require('../templates/longphung'),
  songhac: require('../templates/songhac'),
  cophuc: require('../templates/cophuc'),
  vuonkinh: require('../templates/vuonkinh'),
  hoakho: require('../templates/hoakho'),
  lienhoa: require('../templates/lienhoa'),
  baroque: require('../templates/baroque'),
  hoangkim: require('../templates/hoangkim'),
  laudai: require('../templates/laudai'),
  camthach: require('../templates/camthach'),
  rentheu: require('../templates/rentheu'),
  bachsu: require('../templates/bachsu'),
  chibi: require('../templates/chibi'),
  anhdao: require('../templates/anhdao'),
  mocnau: require('../templates/mocnau'),
};

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
  const tpl = templates[card.template] || templates.hy;
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
</body></html>`;
}

/**
 * card: { slug, template, palette, data, ... }
 * opts: { guest, wishes, preview, trial, baseUrl }
 */
function renderCard(card, opts = {}) {
  const ctx = makeCtx(card, opts);
  const { d, tpl, pal } = ctx;
  const baseUrl = opts.baseUrl || config.baseUrl;
  const title = `Thiệp cưới ${ctx.g} & ${ctx.b}`;
  const desc = [ctx.date && `${ctx.weekday}, ${ctx.dmy}`, ctx.guest && `Trân trọng kính mời ${ctx.guest.name}`].filter(Boolean).join(' — ') || 'Trân trọng kính mời bạn tới dự lễ cưới của chúng mình';
  const body = `
${tpl.opener(ctx)}
${d.music ? `<audio id="bgm" src="${esc(d.music)}" loop preload="none"></audio><button class="music-btn" id="musicBtn" aria-label="Bật/tắt nhạc"><span>♫</span><i class="mb-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></i></button>` : ''}
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
  return page({
    title, desc,
    image: absUrl(baseUrl, d.cover || d.photos[0] || ''),
    fonts: tpl.fonts,
    styleVars: pal.vars,
    css: tpl.css,
    bodyClass: `tpl-${tpl.id}${opts.preview ? ' is-preview' : ''}`,
    body,
    cfg: {
      slug: card.slug,
      guest: ctx.guest ? ctx.guest.code : null,
      target: ctx.date ? `${ctx.date}T${ctx.time || '09:00'}:00+07:00` : null,
      photos: d.photos,
      preview: !!opts.preview,
      demo: !!opts.demo,
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
    id: t.id, name: t.name, desc: t.desc, group: t.group || 'toigian',
    palettes: t.palettes.map((p) => ({ id: p.id, name: p.name, swatch: p.swatch })),
  }));
}

module.exports = { renderCard, renderNotice, templates, templateList, groups };
