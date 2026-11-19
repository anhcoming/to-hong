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
EFFECTS.dembac = 'Đêm kim tuyến bạc';
EFFECTS.saoroi = 'Sao rơi';
EFFECTS.saobang = 'Đêm sao băng';
EFFECTS.thienha = 'Dải ngân hà';
EFFECTS.satindo = 'Lụa satin đỏ';
EFFECTS.satinnga = 'Lụa satin ngà';
EFFECTS.tuyet = 'Tuyết rơi';
// Kiểu chữ riêng theo hiệu ứng: 'thanh' = chữ viết tay nét mảnh + chữ lồng tên + tiêu đề serif có vạch ngang (không khung viền, không chữ 囍)
const STYLES = { dembac: 'thanh', saoroi: 'thanh', saobang: 'thanh', thienha: 'thanh', satindo: 'thanh', satinnga: 'thanh', tuyet: 'thanh' };
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
  bac: { name: 'Đen ánh bạc', bg: ['#010208', '#0a1024'], text: '#ffffff', accent: '#e6e9f5', particle: '#e9edff' },
  lam: { name: 'Đêm ánh lam', bg: ['#010208', '#080d22'], text: '#ffffff', accent: '#e6e9f5', particle: '#c4d0ff' },
  tham: { name: 'Xanh thẳm', bg: ['#02030c', '#0b1130'], text: '#ffffff', accent: '#e6e9f5', particle: '#dfe6ff' },
  sondo: { name: 'Đỏ satin', bg: ['#1a0204', '#5c0a0f'], text: '#ffffff', accent: '#f3dcc0', particle: '#ffd9c0' },
  ngabac: { name: 'Ngà bạc', bg: ['#c9c9cf', '#f4f4f6'], text: '#7a1f2e', accent: '#7a1f2e', particle: '#ffffff' },
  dong: { name: 'Đêm đông', bg: ['#070b17', '#1d2b46'], text: '#ffffff', accent: '#e6ecfa', particle: '#eef3ff' },
  sam: { name: 'Sâm panh', bg: ['#cfb48c', '#f7ecd9'], text: '#4a3520', accent: '#96702f', particle: '#b8892e' },
};
const SLIDES = ['names', 'date', 'countdown', 'parents', 'photo', 'message'];
// các dòng chữ chỉnh được cỡ (trùng tên lớp trong public/led/led.js)
const SZ_KEYS = ['kicker', 'names', 'wd', 'bigdate', 'time', 'lunar', 'cd', 'cd-sub', 'title', 'lb', 'pp', 'ad', 'msg', 'sign'];
const V = Date.now().toString(36); // đổi mỗi lần khởi động máy chủ để trình duyệt tải JS/CSS mới

function defaults() {
  return {
    ratio: '16:9', effect: 'dembac', palette: 'bac', density: 1, speed: 1, seconds: 8, hy: true,
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
    // đã kích hoạt: mẫu (hiệu ứng + bảng màu) chốt, không đổi sang mẫu khác
    effect: prev.paid && prev.effect ? prev.effect : EFFECTS[input.effect] ? input.effect : d.effect,
    palette: prev.paid && prev.palette ? prev.palette : PALETTES[input.palette] ? input.palette : d.palette,
    density: num(input.density, 0.2, 3, 1),
    speed: num(input.speed, 0.2, 3, 1),
    seconds: Math.round(num(input.seconds, 4, 30, 8)),
    hy: input.hy !== false,
    kicker: input.kicker === undefined ? d.kicker : str(input.kicker, 40),
    message: input.message === undefined ? d.message : str(input.message, 200),
    slides: Object.fromEntries(SLIDES.map((k) => [k, k === 'photo' ? false : s[k] !== false])), // màn LED chỉ mẫu có sẵn + chữ: không chiếu ảnh
    // cỡ chữ từng dòng (nút A− / A+ khi bấm chữ trên màn xem trước): { lớp chữ: hệ số 0,6–1,8 }, 1 = cỡ gốc của mẫu
    sz: Object.fromEntries(Object.entries(input.sz || {}).filter(([k]) => SZ_KEYS.includes(k))
      .map(([k, v]) => [k, Math.round(num(v, 0.6, 1.8, 1) * 10) / 10]).filter(([, v]) => v !== 1)),
    // trạng thái bán hàng do máy chủ quản lý, không nhận từ người dùng
    createdAt: prev.createdAt || Date.now(),
    paid: !!prev.paid,
    paidAt: prev.paidAt,
    names: prev.names, // tên đôi cố định lúc kích hoạt (lib/fixnames.js)
    snap: prev.snap, // dữ liệu đám cưới lúc chốt (lib/fixnames.js)
  };
}
// Màn LED không có hạn dùng thử (dùng thử 7 ngày chỉ dành cho thiệp): chưa kích hoạt thì chỉ xem trước trong khung của
// trình sửa (có dòng "Bản dùng thử"); link trình chiếu khoá với mọi người, kể cả chủ thiệp, cho tới khi kích hoạt.
function state(led) {
  if (!led) return { created: false };
  return { created: true, paid: !!led.paid, locked: !led.paid, names: led.paid && led.names ? led.names : null, final: !!(led.paid && led.snap) }; // final: đã chốt, không sửa được nữa
}

const WD = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

// Dữ liệu gửi xuống trình chiếu: lấy từ nội dung thiệp
function payload(card, led) {
  const d = (led.paid && led.snap) || card.data; // đã chốt: theo dữ liệu lúc chốt (lib/fixnames.js)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d.date || '');
  let time = '';
  if (d.time) { const [h, mi] = d.time.split(':'); time = `${+h} giờ${mi !== '00' ? ' ' + mi : ''}`; }
  return {
    led,
    // đã kích hoạt: tên đôi cố định lúc kích hoạt
    groom: led.names ? { ...d.groom, name: led.names.groom } : d.groom, bride: led.names ? { ...d.bride, name: led.names.bride } : d.bride,
    date: m ? { d: m[3], m: m[2], y: m[1], weekday: WD[new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay()] } : null,
    time,
    lunar: lunarText(d.date),
    at: m ? `${d.date}T${/^\d{2}:\d{2}$/.test(d.time || '') ? d.time : '00:00'}:00+07:00` : '', // giờ lễ (giờ Việt Nam) cho cảnh đếm ngược
    photo: d.cover || d.photos.find(Boolean) || '',
  };
}

function renderLed(card, led, opts = {}) {
  const p = payload(card, led);
  const names = [p.groom.name, p.bride.name].filter(Boolean).join(' & ') || 'Màn hình LED';
  const cfg = {
    ...p, ratios: RATIOS, palettes: PALETTES, videos: videoCfg(), styles: STYLES,
    preview: !!opts.preview, trial: !!opts.trial, brand: config.brand, demo: !!opts.demo,
  };
  return `<!doctype html>
<html lang="vi"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${esc(names)} — Màn hình LED</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Charm:wght@400;700&amp;family=Ephesis&amp;family=Great+Vibes&amp;family=Cormorant+Garamond:wght@400;500&amp;family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&amp;family=Hanken+Grotesk:wght@300..700&amp;display=swap">
<link rel="stylesheet" href="/led/led.css?v=${V}">
</head><body${opts.preview ? ' class="preview"' : ''}>
<div id="stage"><canvas id="fx"></canvas><div id="frame"></div><div id="slides"></div>${opts.trial ? `<div class="wm" data-b="${esc(config.brand)}">Bản dùng thử</div>` : ''}</div>
<a id="back" class="back" href="${opts.demo ? '/man-hinh-led-dam-cuoi' : '/thiep-cua-toi'}" aria-label="Đóng" title="Đóng"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></a>
<div id="ctl" class="ctl"><button data-c="pause" aria-label="Tạm dừng" title="Tạm dừng (Space)">❚❚</button><input type="range" id="seek" min="0" max="1000" value="0" aria-label="Tua"><span id="tm">0:00</span><button data-c="fs" aria-label="Toàn màn hình" title="Toàn màn hình (F)"><svg class="i-on" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg><svg class="i-off" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg></button></div>
<script>window.__LED=${JSON.stringify(cfg).replace(/</g, '\\u003c')}</script>
<script src="/led/led.js?v=${V}"></script>${opts.trial && !opts.preview ? '<script src="/js/cn-guard.js" defer></script>' : ''}
</body></html>`;
}

// mẫu màn LED có sẵn (khách chỉ chọn mẫu + sửa chữ): mỗi mẫu = một bảng màu + một hiệu ứng, có ảnh xem trước /demo/lposter-<màu>-<hiệu ứng>.jpg
const TEMPLATES = [
  // chỉ các mẫu mới (từ 18/11/2026); hiệu ứng cũ vẫn giữ trong EFFECTS để màn LED khách đã làm vẫn chiếu được
  ['bac', 'dembac', 'Đêm kim tuyến bạc', 'Trần và sàn kim tuyến bạc, thác hạt rơi chạm sàn lan gợn sáng'],
  ['lam', 'saoroi', 'Sao rơi', 'Sao rơi xuống sàn đêm ánh lam, mỗi lần chạm toả một vòng sáng'],
  ['bac', 'saobang', 'Đêm sao băng', 'Dải kim tuyến mờ trên cao, sao băng rơi xuống sàn sáng'],
  ['dong', 'tuyet', 'Tuyết rơi đêm đông', 'Bông tuyết tinh thể rơi chậm, xoay nhẹ trong đêm xanh'],
  ['tham', 'thienha', 'Dải ngân hà', 'Dải ngân hà trôi chậm giữa muôn vì sao lấp lánh'],
  ['sondo', 'satindo', 'Lụa satin đỏ', 'Lụa đỏ gợn sóng mềm, sang trọng và ấm áp'],
  ['ngabac', 'satinnga', 'Lụa satin ngà', 'Lụa ngà trắng nhẹ nhàng, chữ đỏ rượu thanh lịch'],
].map(([palette, effect, name, desc]) => ({ id: palette + '-' + effect, palette, effect, name, desc }));

function options() {
  return {
    templates: TEMPLATES,
    ratios: Object.keys(RATIOS),
    effects: Object.entries(EFFECTS).map(([id, name]) => ({ id, name, video: !!VIDEOS[id] })),
    palettes: Object.entries(PALETTES).map(([id, p]) => ({ id, name: p.name, bg: p.bg, accent: p.accent })),
  };
}

module.exports = { defaults, normalize, state, renderLed, options, RATIOS };
