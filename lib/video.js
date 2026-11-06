// Video dạm ngõ / ăn hỏi chiếu TV: 16:9, lặp lại, dựng bằng canvas ở trình duyệt.
// Máy chủ chỉ lưu cấu hình, phục vụ trang trình chiếu và chuyển bản quay sang MP4.
const { esc, str } = require('./util');
const config = require('../config.json');

const TEMPLATES = {
  sen: { name: 'Sen vàng', desc: 'Nền đỏ son, hoa sen vàng kim — trang trọng' },
  dao: { name: 'Hoa đào', desc: 'Nền kem hồng, cành đào nở — ấm áp, nhẹ nhàng' },
  may: { name: 'Mây cung đình', desc: 'Khung hoạ tiết mây, chữ Hỷ chìm — cổ điển' },
};
const FONTS = { script: 'Chữ bay bướm', serif: 'Chữ có chân', italic: 'Chữ nghiêng', sans: 'Chữ hiện đại', caps: 'CHỮ IN HOA' };
const TONES = ['main', 'accent', 'soft'];
const KINDS = ['Lễ Dạm Ngõ', 'Lễ Ăn Hỏi', 'Lễ Vu Quy', 'Lễ Thành Hôn', 'Lễ Báo Hỷ'];
const V = Date.now().toString(36);

const L = (text, font, size, tone = 'main') => ({ text, font, size, tone, color: '' });

// Nội dung mặc định. Chữ có thể chứa biến {…}, trình chiếu tự thay bằng thông tin mới nhất;
// dòng nào có biến rỗng (vd chưa nhập giờ) thì tự ẩn.
const TOKENS = {
  chu_re: 'Tên chú rể', co_dau: 'Tên cô dâu', le: 'Tên buổi lễ', ngay: 'Thứ, ngày tháng năm',
  am_lich: 'Ngày âm lịch', gio: 'Giờ', dia_diem: 'Địa điểm', bo_me_trai: 'Bố mẹ nhà trai', bo_me_gai: 'Bố mẹ nhà gái',
};
function defaultScenes() {
  return [
    { lines: [L('{le}', 'caps', 46, 'accent'), L('{chu_re}', 'script', 150), L('&', 'script', 90, 'accent'), L('{co_dau}', 'script', 150)] },
    {
      lines: [
        L('Lời cảm ơn', 'script', 110, 'accent'),
        L('Gia đình hai họ xin chân thành cảm ơn', 'serif', 58),
        L('quý vị đã dành thời gian đến chung vui', 'serif', 58),
        L('Nhà trai: {bo_me_trai}', 'sans', 36, 'soft'),
        L('Nhà gái: {bo_me_gai}', 'sans', 36, 'soft'),
      ],
    },
    {
      lines: [
        L('{chu_re} & {co_dau}', 'script', 100),
        L('{le}', 'caps', 44, 'accent'),
        L('{ngay}', 'serif', 62),
        L('{am_lich}', 'italic', 44, 'soft'),
        L('Vào lúc {gio}', 'sans', 42),
        L('Tại: {dia_diem}', 'sans', 42),
      ],
    },
  ];
}

function defaults() {
  return { template: 'sen', photoBg: false, seconds: 7, event: { kind: 'Lễ Dạm Ngõ', date: '', time: '09:00', place: 'Tư gia nhà gái' }, scenes: defaultScenes() };
}

const num = (v, min, max, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d; };

function normLine(l = {}) {
  return {
    text: str(l.text, 120),
    font: FONTS[l.font] ? l.font : 'serif',
    size: Math.round(num(l.size, 20, 220, 56)),
    tone: TONES.includes(l.tone) ? l.tone : 'main',
    color: /^#[0-9a-f]{6}$/i.test(l.color || '') ? l.color.toLowerCase() : '',
  };
}

function normalize(input = {}, prev = {}) {
  const base = prev.scenes ? prev : defaults();
  const e = input.event || base.event || {};
  const scenes = Array.isArray(input.scenes) ? input.scenes : base.scenes;
  return {
    template: TEMPLATES[input.template] ? input.template : base.template || 'sen',
    photoBg: input.photoBg !== undefined ? !!input.photoBg : !!base.photoBg,
    seconds: Math.round(num(input.seconds ?? base.seconds, 4, 15, 7)),
    event: {
      kind: str(e.kind, 40) || 'Lễ Dạm Ngõ',
      date: /^\d{4}-\d{2}-\d{2}$/.test(e.date || '') ? e.date : '',
      time: /^\d{2}:\d{2}$/.test(e.time || '') ? e.time : '',
      place: str(e.place, 100),
    },
    scenes: scenes.slice(0, 5).map((s = {}) => ({ lines: (Array.isArray(s.lines) ? s.lines : []).slice(0, 8).map(normLine) })),
    // trạng thái bán hàng do máy chủ quản lý
    createdAt: prev.createdAt || Date.now(),
    paid: !!prev.paid,
    paidAt: prev.paidAt,
    mp4: prev.mp4 || null,
  };
}

function state(v) {
  if (!v) return { created: false };
  const trialEndsAt = v.paid ? null : v.createdAt + config.trialDays * 864e5;
  return { created: true, paid: !!v.paid, trialEndsAt, expired: !v.paid && Date.now() > trialEndsAt, mp4: v.mp4 || null };
}

// Giá trị thay cho các biến {…} — phía trình duyệt tính lại khi đang sửa (xem engine.js)
function info(data) {
  const fam = (p) => [p.father, p.mother].filter(Boolean).join(' – ');
  return { chu_re: data.groom.name, co_dau: data.bride.name, bo_me_trai: fam(data.groom), bo_me_gai: fam(data.bride) };
}

function renderVideo(card, video, opts = {}) {
  const names = [card.data.groom.name, card.data.bride.name].filter(Boolean).join(' & ') || 'Video';
  const cfg = {
    video, info: info(card.data), photo: card.data.cover || card.data.photos[0] || '',
    trial: !!opts.trial, preview: !!opts.preview, brand: config.brand,
  };
  return `<!doctype html>
<html lang="vi"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${esc(video.event.kind)} ${esc(names)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Charm:wght@400;700&amp;family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&amp;family=Hanken+Grotesk:wght@300..700&amp;display=swap">
<style>
html,body{margin:0;height:100%;background:#000;overflow:hidden;cursor:none}
body.active{cursor:default}
canvas{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(100vw,177.78vh);height:min(56.25vw,100vh)}
.ctl{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);display:flex;gap:8px;padding:8px;border-radius:999px;background:rgba(0,0,0,.55);opacity:0;transition:.3s}
body.active .ctl{opacity:1}
body.preview .ctl{display:none}
.ctl button{border:0;border-radius:999px;background:rgba(255,255,255,.15);color:#fff;font:500 15px system-ui,sans-serif;height:42px;padding:0 18px;cursor:pointer}
</style>
</head><body${opts.preview ? ' class="preview"' : ''}>
<canvas id="cv" width="1920" height="1080"></canvas>
<div class="ctl"><button id="fs">⛶ Toàn màn hình</button></div>
<script>window.__VIDEO=${JSON.stringify(cfg).replace(/</g, '\\u003c')}</script>
<script src="/js/lunar.js?v=${V}"></script>
<script src="/video/engine.js?v=${V}"></script>
<script>
(function(){
  var C=window.__VIDEO, cv=document.getElementById('cv');
  var eng=VideoEngine.create(cv,{photo:C.photo,trial:C.trial,brand:C.brand});
  eng.set(C.video, C.info); eng.play(); window.__engine=eng;
  function full(){var d=document.documentElement; if(document.fullscreenElement) document.exitFullscreen(); else if(d.requestFullscreen) d.requestFullscreen().catch(function(){});}
  document.getElementById('fs').onclick=full;
  document.addEventListener('dblclick',full);
  document.addEventListener('keydown',function(e){if(e.key==='f'||e.key==='F')full();});
  var idle; document.addEventListener('mousemove',function(){document.body.classList.add('active');clearTimeout(idle);idle=setTimeout(function(){document.body.classList.remove('active')},2500)});
  if(!C.preview&&navigator.wakeLock) navigator.wakeLock.request('screen').catch(function(){});
  window.addEventListener('message',function(e){ if(e.origin===location.origin&&e.data&&e.data.type==='video-config'){ eng.set(e.data.video, e.data.info); if(e.data.photo!==undefined) eng.setPhoto(e.data.photo);} });
})();
</script>
</body></html>`;
}

function options() {
  return {
    templates: Object.entries(TEMPLATES).map(([id, t]) => ({ id, ...t })),
    fonts: Object.entries(FONTS).map(([id, name]) => ({ id, name })),
    kinds: KINDS,
    tokens: TOKENS,
  };
}

module.exports = { defaults, defaultScenes, normalize, state, renderVideo, options, info, TEMPLATES };
