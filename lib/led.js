// Màn hình LED tiệc cưới: cấu hình + dựng trang trình chiếu toàn màn hình.
const { esc, str } = require('./util');
const { lunarText } = require('./lunar');
const config = require('../config.json');

const RATIOS = { '16:9': [1920, 1080], '4:3': [1440, 1080], '9:16': [1080, 1920], '3:4': [1080, 1440] };
const EFFECTS = { sao: 'Trời sao & sao băng', domdom: 'Đom đóm vàng', hoa: 'Cánh hoa rơi', lua: 'Dải lụa' };
const PALETTES = {
  do: { name: 'Đỏ son', bg: ['#3d050c', '#9e1b23'], text: '#fff1d6', accent: '#e8b65a', particle: '#ffd98a' },
  dem: { name: 'Đêm xanh', bg: ['#050817', '#1b2550'], text: '#ffffff', accent: '#e9d5a1', particle: '#ffffff' },
  hong: { name: 'Hồng đào', bg: ['#33091e', '#a8406a'], text: '#fff3f6', accent: '#ffd1dc', particle: '#ffc4d6' },
  ngoc: { name: 'Ngọc bích', bg: ['#04211e', '#13584f'], text: '#fbf3e1', accent: '#d6ad5a', particle: '#f5dfa6' },
  kem: { name: 'Kem sáng', bg: ['#e9dfcf', '#fbf7f0'], text: '#4a3a2c', accent: '#8b6b4e', particle: '#c9a96e' },
};
const SLIDES = ['names', 'date', 'parents', 'photo', 'message'];
const V = Date.now().toString(36); // đổi mỗi lần khởi động máy chủ để trình duyệt tải JS/CSS mới

function defaults() {
  return {
    ratio: '16:9', effect: 'sao', palette: 'do', density: 1, speed: 1, seconds: 8, hy: true,
    kicker: 'Lễ Thành Hôn',
    message: 'Trân trọng cảm ơn quý khách đã đến chung vui cùng gia đình chúng tôi',
    slides: { names: true, date: true, parents: true, photo: true, message: true },
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
    slides: Object.fromEntries(SLIDES.map((k) => [k, s[k] !== false])),
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
    photo: d.cover || d.photos[0] || '',
  };
}

function renderLed(card, led, opts = {}) {
  const p = payload(card, led);
  const names = [card.data.groom.name, card.data.bride.name].filter(Boolean).join(' & ') || 'Màn hình LED';
  const cfg = {
    ...p, ratios: RATIOS, palettes: PALETTES,
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
<div id="stage"><canvas id="fx"></canvas><div id="frame"></div><div id="slides"></div>${opts.trial ? `<div class="wm">Bản dùng thử · ${esc(config.brand)}</div>` : ''}</div>
<div id="ctl" class="ctl">
  <button data-c="prev" title="Cảnh trước (←)">◀</button>
  <button data-c="pause" title="Tạm dừng (Space)">❚❚</button>
  <button data-c="next" title="Cảnh sau (→)">▶</button>
  <button data-c="full" class="wide" title="Toàn màn hình (F)">⛶ Toàn màn hình</button>
</div>
<script>window.__LED=${JSON.stringify(cfg).replace(/</g, '\\u003c')}</script>
<script src="/led/led.js?v=${V}"></script>
</body></html>`;
}

function options() {
  return {
    ratios: Object.keys(RATIOS),
    effects: Object.entries(EFFECTS).map(([id, name]) => ({ id, name })),
    palettes: Object.entries(PALETTES).map(([id, p]) => ({ id, name: p.name, bg: p.bg, accent: p.accent })),
  };
}

module.exports = { defaults, normalize, state, renderLed, options, RATIOS };
