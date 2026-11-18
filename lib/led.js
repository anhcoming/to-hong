// Màn hình LED tiệc cưới: cấu hình + dựng trang trình chiếu toàn màn hình.
const { esc, str } = require('./util');
const { lunarText } = require('./lunar');
const config = require('../config.json');

const RATIOS = { '16:9': [1920, 1080], '4:3': [1440, 1080], '9:16': [1080, 1920], '3:4': [1080, 1440] };
const EFFECTS = { sao: 'Trời sao & sao băng', domdom: 'Đom đóm vàng', hoa: 'Cánh hoa rơi', lua: 'Dải lụa', bokeh: 'Ánh đèn bokeh', phaohoa: 'Pháo hoa', kimtuyen: 'Kim tuyến rơi', tim: 'Tim bay', hoadang: 'Hoa đăng', nganha: 'Ngân hà', remphale: 'Rèm pha lê' };
// Nền video quay sẵn (chất liệu thật: lụa, kim sa, ánh sáng) — tải từ Pexels (giấy phép Pexels: dùng thương mại miễn phí,
// không cần ghi nguồn; nguồn từng video trong public/led/bg/CREDITS.md). Video Full HD phát lặp có chuyển mờ ở chỗ nối.
// shade: lớp phủ cho chữ dễ đọc — 'dark' (chữ sáng trên nền tối dần ra mép) / 'light' (chữ tối trên nền sáng).
const VIDEOS = {
  luado: { name: 'Lụa đỏ', file: 'lua-do', shade: 'dark' },
  luanga: { name: 'Lụa trắng ngà', file: 'lua-nga', shade: 'light' },
  kimsa: { name: 'Kim sa vàng', file: 'kim-sa', shade: 'dark' },
  binhminh: { name: 'Bình minh ánh kim', file: 'binh-minh', shade: 'dark' },
  denvang: { name: 'Đèn vàng lung linh', file: 'den-vang', shade: 'dark' },
  haoquang: { name: 'Hào quang vàng', file: 'hao-quang', shade: 'dark' },
};
Object.entries(VIDEOS).forEach(([k, v]) => { EFFECTS[k] = v.name; });
const videoCfg = () => Object.fromEntries(Object.entries(VIDEOS).map(([k, v]) => [k, { src: `/led/bg/${v.file}.mp4`, poster: `/led/bg/${v.file}.jpg`, shade: v.shade }]));
const PALETTES = {
  do: { name: 'Đỏ son', bg: ['#3d050c', '#9e1b23'], text: '#fff1d6', accent: '#e8b65a', particle: '#ffd98a' },
  dem: { name: 'Đêm xanh', bg: ['#050817', '#1b2550'], text: '#ffffff', accent: '#e9d5a1', particle: '#ffffff' },
  hong: { name: 'Hồng đào', bg: ['#33091e', '#a8406a'], text: '#fff3f6', accent: '#ffd1dc', particle: '#ffc4d6' },
  ngoc: { name: 'Ngọc bích', bg: ['#04211e', '#13584f'], text: '#fbf3e1', accent: '#d6ad5a', particle: '#f5dfa6' },
  kem: { name: 'Kem sáng', bg: ['#e9dfcf', '#fbf7f0'], text: '#4a3a2c', accent: '#8b6b4e', particle: '#c9a96e' },
  den: { name: 'Đen ánh kim', bg: ['#050505', '#2b2214'], text: '#fff6e0', accent: '#d9b25f', particle: '#ffdf9c' },
  tim: { name: 'Tím oải hương', bg: ['#160a2e', '#5a3a8a'], text: '#fbf4ff', accent: '#e7c9ff', particle: '#ecd6ff' },
  xanh: { name: 'Xanh thiên thanh', bg: ['#08243f', '#2f6ea8'], text: '#ffffff', accent: '#ffe2a8', particle: '#ffffff' },
  sam: { name: 'Sâm panh', bg: ['#cfb48c', '#f7ecd9'], text: '#4a3520', accent: '#96702f', particle: '#b8892e' },
};
const SLIDES = ['names', 'date', 'countdown', 'parents', 'photo', 'message'];
const V = Date.now().toString(36); // đổi mỗi lần khởi động máy chủ để trình duyệt tải JS/CSS mới

function defaults() {
  return {
    ratio: '16:9', effect: 'sao', palette: 'do', density: 1, speed: 1, seconds: 8, hy: true,
    kicker: 'Lễ Thành Hôn',
    message: 'Trân trọng cảm ơn quý khách đã đến chung vui cùng gia đình chúng tôi',
    slides: { names: true, date: true, countdown: true, parents: true, photo: false, message: true },
  };
}

const num = (v, min, max, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d; };

function normalize(input = {}, prev = {}) {
  const d = defaults();
  const s = input.slides || {};
  return {
    ratio: RATIOS[input.ratio] ? input.ratio : d.ratio,
    effect: EFFECTS[input.effect] ? input.effect : d.effect,
    palette: PALETTES[input.palette] ? input.palette : d.palette,
    density: num(input.density, 0.2, 3, 1),
    speed: num(input.speed, 0.2, 3, 1),
    seconds: Math.round(num(input.seconds, 4, 30, 8)),
    hy: input.hy !== false,
    kicker: input.kicker === undefined ? d.kicker : str(input.kicker, 40),
    message: input.message === undefined ? d.message : str(input.message, 200),
    slides: Object.fromEntries(SLIDES.map((k) => [k, k === 'photo' ? false : s[k] !== false])), // màn LED chỉ mẫu có sẵn + chữ: không chiếu ảnh
    // trạng thái bán hàng do máy chủ quản lý, không nhận từ người dùng
    createdAt: prev.createdAt || Date.now(),
    paid: !!prev.paid,
    paidAt: prev.paidAt,
  };
}

function state(led) {
  if (!led) return { created: false };
  const trialEndsAt = led.paid ? null : led.createdAt + config.trialDays * 864e5;
  return { created: true, paid: !!led.paid, trialEndsAt, expired: !led.paid && Date.now() > trialEndsAt };
}

const WD = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

// Dữ liệu gửi xuống trình chiếu: lấy từ nội dung thiệp
function payload(card, led) {
  const d = card.data;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d.date || '');
  let time = '';
  if (d.time) { const [h, mi] = d.time.split(':'); time = `${+h} giờ${mi !== '00' ? ' ' + mi : ''}`; }
  return {
    led,
    groom: d.groom, bride: d.bride,
    date: m ? { d: m[3], m: m[2], y: m[1], weekday: WD[new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay()] } : null,
    time,
    lunar: lunarText(d.date),
    at: m ? `${d.date}T${/^\d{2}:\d{2}$/.test(d.time || '') ? d.time : '00:00'}:00+07:00` : '', // giờ lễ (giờ Việt Nam) cho cảnh đếm ngược
    photo: d.cover || d.photos.find(Boolean) || '',
  };
}

function renderLed(card, led, opts = {}) {
  const p = payload(card, led);
  const names = [card.data.groom.name, card.data.bride.name].filter(Boolean).join(' & ') || 'Màn hình LED';
  const cfg = {
    ...p, ratios: RATIOS, palettes: PALETTES, videos: videoCfg(),
    preview: !!opts.preview, trial: !!opts.trial, brand: config.brand, demo: !!opts.demo,
  };
  return `<!doctype html>
<html lang="vi"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${esc(names)} — Màn hình LED</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Charm:wght@400;700&amp;family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&amp;family=Hanken+Grotesk:wght@300..700&amp;display=swap">
<link rel="stylesheet" href="/led/led.css?v=${V}">
</head><body${opts.preview ? ' class="preview"' : ''}>
<div id="stage"><canvas id="fx"></canvas><div id="frame"></div><div id="slides"></div>${opts.trial ? `<div class="wm" data-b="${esc(config.brand)}">Bản dùng thử</div>` : ''}</div>
<a id="back" class="back" href="${opts.demo ? '/man-hinh-led-dam-cuoi' : '/thiep-cua-toi'}" aria-label="Đóng" title="Đóng"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></a>
<div id="ctl" class="ctl"><button data-c="pause" aria-label="Tạm dừng" title="Tạm dừng (Space)">❚❚</button><input type="range" id="seek" min="0" max="1000" value="0" aria-label="Tua"><span id="tm">0:00</span><button data-c="fs" aria-label="Toàn màn hình" title="Toàn màn hình (F)"><svg class="i-on" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg><svg class="i-off" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg></button></div>
<script>window.__LED=${JSON.stringify(cfg).replace(/</g, '\\u003c')}</script>
<script src="/led/led.js?v=${V}"></script>
</body></html>`;
}

// mẫu màn LED có sẵn (khách chỉ chọn mẫu + sửa chữ): mỗi mẫu = một bảng màu + một hiệu ứng, có ảnh xem trước /demo/lposter-<màu>-<hiệu ứng>.jpg
const TEMPLATES = [
  ['do', 'sao', 'Đỏ son sao băng'], ['dem', 'sao', 'Trời sao đêm xanh'], ['dem', 'phaohoa', 'Pháo hoa đêm'],
  ['den', 'remphale', 'Rèm pha lê ánh kim'], ['tim', 'hoadang', 'Hoa đăng tím'], ['hong', 'tim', 'Tim bay hồng'],
  ['hong', 'hoa', 'Cánh hoa hồng đào'], ['ngoc', 'domdom', 'Đom đóm ngọc bích'], ['kem', 'lua', 'Dải lụa kem'],
  // nền video quay sẵn
  ['do', 'luado', 'Lụa đỏ son'], ['kem', 'luanga', 'Lụa trắng ngà'], ['den', 'kimsa', 'Kim sa vàng'],
  ['den', 'binhminh', 'Bình minh ánh kim'], ['den', 'denvang', 'Đèn vàng lung linh'], ['den', 'haoquang', 'Hào quang vàng'],
].map(([palette, effect, name]) => ({ id: palette + '-' + effect, palette, effect, name }));

function options() {
  return {
    templates: TEMPLATES,
    ratios: Object.keys(RATIOS),
    effects: Object.entries(EFFECTS).map(([id, name]) => ({ id, name, video: !!VIDEOS[id] })),
    palettes: Object.entries(PALETTES).map(([id, p]) => ({ id, name: p.name, bg: p.bg, accent: p.accent })),
  };
}

module.exports = { defaults, normalize, state, renderLed, options, RATIOS };
