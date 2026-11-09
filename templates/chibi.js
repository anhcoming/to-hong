// Mẫu "Chibi" — cô dâu chú rể chibi vẽ SVG, nền chấm bi pastel, chữ tròn vui tươi.
const { esc } = require('../lib/util');
const orn = require('./_orn');

const base = {
  '--font-title': "'Baloo 2',system-ui,sans-serif",
  '--font-script': "'Dancing Script',cursive",
  '--font-body': "'Hanken Grotesk',system-ui,sans-serif",
};
const pal = (id, name, accent, suit, bg, extra = {}) => ({
  id, name, swatch: [bg, accent],
  vars: { ...base, '--page': `color-mix(in srgb,${bg} 70%,${accent})`, '--bg': bg, '--paper': '#ffffff', '--ink': '#3c2f33', '--muted': '#8a7a7e', '--accent': accent, '--accent-ink': '#ffffff', '--gold': accent, '--suit': suit, '--dot': `color-mix(in srgb,${accent} 22%,${bg})`, '--line': `color-mix(in srgb,${accent} 25%,${bg})`, ...extra },
});

const SKIN = '#f8dcc8', HAIR = '#3b2a26', BLUSH = '#f4a3a8';
function couple(cls) {
  const face = (x) => `
<ellipse cx="${x - 11}" cy="86" rx="3.2" ry="4.4" fill="${HAIR}"/><ellipse cx="${x + 11}" cy="86" rx="3.2" ry="4.4" fill="${HAIR}"/>
<circle cx="${x - 10}" cy="84.5" r="1.2" fill="#fff"/><circle cx="${x + 12}" cy="84.5" r="1.2" fill="#fff"/>
<ellipse cx="${x - 18}" cy="96" rx="6" ry="3.2" fill="${BLUSH}" opacity=".75"/><ellipse cx="${x + 18}" cy="96" rx="6" ry="3.2" fill="${BLUSH}" opacity=".75"/>
<path d="M${x - 4} 99Q${x} 104 ${x + 4} 99" fill="none" stroke="${HAIR}" stroke-width="1.8" stroke-linecap="round"/>`;
  return orn.svg(cls, '0 0 220 200', `
<path d="M110 22C104 12 92 16 96 26C98 32 110 38 110 38C110 38 122 32 124 26C128 16 116 12 110 22Z" fill="var(--accent)"/>
<path d="M124 50C102 80 98 140 104 186H118C114 140 118 92 134 58Z" fill="#fff" opacity=".7"/>
<path d="M166 50C186 80 190 140 184 186H170C174 140 170 92 156 58Z" fill="#fff" opacity=".7"/>
<!-- chú rể -->
<rect x="62" y="160" width="10" height="24" rx="3" fill="#2d2a32"/><rect x="78" y="160" width="10" height="24" rx="3" fill="#2d2a32"/>
<ellipse cx="66" cy="186" rx="8" ry="4" fill="#1d1b20"/><ellipse cx="84" cy="186" rx="8" ry="4" fill="#1d1b20"/>
<path d="M52 166L58 118Q75 108 92 118L98 166Z" fill="var(--suit)"/>
<path d="M68 116L75 142L82 116Z" fill="#fff"/>
<path d="M75 120L67 115V125ZM75 120L83 115V125Z" fill="var(--accent)"/><circle cx="75" cy="120" r="2" fill="var(--accent)"/>
<path d="M92 124Q104 132 108 142" fill="none" stroke="var(--suit)" stroke-width="9" stroke-linecap="round"/>
<circle cx="75" cy="80" r="34" fill="${SKIN}"/>
<path d="M41 80C38 50 58 40 78 42C100 44 112 58 109 82C100 66 86 60 72 64C62 58 50 66 41 80Z" fill="${HAIR}"/>
${face(75)}
<!-- cô dâu -->
<path d="M108 84C104 50 124 40 145 40C168 40 186 52 182 88C186 110 178 124 172 128C170 110 170 96 166 86C150 74 136 70 124 84C120 96 120 110 118 128C110 120 106 100 108 84Z" fill="${HAIR}"/>
<path d="M110 188C118 150 128 130 132 116H158C162 130 172 150 180 188Z" fill="#fff" stroke="var(--line)" stroke-width="1.5"/>
<path d="M126 150Q145 158 164 150M120 168Q145 178 170 168" fill="none" stroke="var(--line)" stroke-width="1.2"/>
<rect x="132" y="116" width="26" height="6" rx="3" fill="var(--accent)" opacity=".7"/>
<path d="M132 124Q120 132 112 142" fill="none" stroke="${SKIN}" stroke-width="7" stroke-linecap="round"/>
<circle cx="110" cy="142" r="6" fill="${SKIN}"/>
<circle cx="145" cy="80" r="34" fill="${SKIN}"/>
<path d="M113 80C114 56 130 46 146 46C164 46 178 58 177 80C166 66 150 60 136 66C128 62 118 68 113 80Z" fill="${HAIR}"/>
${[118, 130, 145, 160, 172].map((x, i) => `<circle cx="${x}" cy="${i === 2 ? 44 : i % 4 ? 47 : 54}" r="4.5" fill="${i % 2 ? '#fff' : 'var(--accent)'}" stroke="var(--line)"/>`).join('')}
${face(145)}`);
}

module.exports = {
  id: 'chibi',
  name: 'Chibi',
  group: 'minhhoa',
  desc: 'Cô dâu chú rể chibi đáng yêu, nền chấm bi pastel — trẻ trung, vui nhộn',
  fonts: 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Dancing+Script:wght@600;700&family=Hanken+Grotesk:wght@300..700&display=swap',
  palettes: [
    pal('do', 'Đỏ dâu', '#e0525e', '#33384a', '#fff4f1'),
    pal('hong', 'Hồng kẹo', '#ef86a6', '#45405a', '#fff5f8'),
    pal('mint', 'Bạc hà', '#4fae99', '#3a4a5c', '#f1faf7'),
  ],

  title(text, sub) {
    return `<div class="cb-title"><span class="cb-heart" aria-hidden="true">♥</span><h2 class="sec-title">${esc(text)}</h2>${sub ? `<p class="cb-sub">${esc(sub)}</p>` : ''}</div>`;
  },

  opener(ctx) {
    return `
<div class="opener cb-opener" id="opener">
  <div class="cb-o">
    ${couple('cb-o-couple')}
    <p class="cb-o-k">Tụi mình cưới nè!</p>
    <p class="cb-o-names">${esc(ctx.g)} <span>♥</span> ${esc(ctx.b)}</p>
    ${ctx.guest ? `<p class="cb-o-to">Gửi <b>${esc(ctx.guest.name)}</b></p>` : ''}
    <button class="btn" id="openBtn">Mở thiệp nha ♥</button>
  </div>
</div>`;
  },

  cover(ctx) {
    const p = ctx.dparts;
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="cb-cover">
  <p class="cb-k">We're getting married!</p>
  ${couple('cb-couple')}
  <h1 class="cb-names"><span>${esc(ctx.g)}</span><em>♥</em><span>${esc(ctx.b)}</span></h1>
  ${p ? `<div class="cb-date"><span>${esc(ctx.weekday)}</span><b>${p.d}.${p.m}.${p.y}</b>${ctx.timeText ? `<span>${esc(ctx.timeText)}</span>` : ''}</div>
  <p class="cb-lunar">${esc(ctx.lunar)}</p>` : ''}
  ${photo ? `<div class="cb-polaroid"><i class="cb-tape"></i><div style="background-image:url('${esc(photo)}')"></div><p>Hai đứa mình ♥</p></div>` : ''}
</header>`;
  },

  css: `
.tpl-chibi{--dots:radial-gradient(circle,var(--dot) 3px,transparent 3.5px)}
.tpl-chibi .card{background:var(--dots),var(--bg);background-size:26px 26px,auto}
.tpl-chibi .cb-cover{min-height:100svh;padding:36px 20px 50px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--dots),var(--bg);background-size:26px 26px,auto;color:var(--ink)}
.tpl-chibi .cb-k{margin:0;display:inline-block;padding:6px 16px;border-radius:999px;background:var(--accent);color:#fff;font-family:var(--font-title);font-weight:700;font-size:14px;letter-spacing:.04em;transform:rotate(-3deg)}
.tpl-chibi .cb-couple{width:min(280px,76vw);margin:8px 0 0;animation:cbBob 3s ease-in-out infinite}
@keyframes cbBob{50%{transform:translateY(-6px)}}
@media (prefers-reduced-motion:reduce){.tpl-chibi .cb-couple{animation:none}}
.tpl-chibi .cb-names{margin:6px 0 0;font-family:var(--font-title);font-weight:800;font-size:38px;line-height:1.05;color:var(--ink)}
.tpl-chibi .cb-names span{display:block}
.tpl-chibi .cb-names em{display:block;font-style:normal;font-size:26px;color:var(--accent)}
.tpl-chibi .cb-date{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:16px;font-family:var(--font-title)}
.tpl-chibi .cb-date span,.tpl-chibi .cb-date b{padding:6px 14px;border-radius:999px;background:#fff;border:2px dashed var(--line);font-weight:600;font-size:15px}
.tpl-chibi .cb-date b{background:var(--accent);border-color:var(--accent);color:#fff;font-size:18px;font-weight:800}
.tpl-chibi .cb-lunar{margin:8px 0 0;font-size:13px;color:var(--muted)}
.tpl-chibi .cb-polaroid{position:relative;width:min(220px,60vw);margin:28px auto 0;padding:10px 10px 4px;background:#fff;box-shadow:0 12px 26px rgba(80,40,50,.18);transform:rotate(3deg)}
.tpl-chibi .cb-polaroid>div{aspect-ratio:1;background:var(--line) center/cover no-repeat}
.tpl-chibi .cb-polaroid p{margin:6px 0 2px;font-family:var(--font-script);font-weight:700;font-size:22px;color:var(--accent)}
.tpl-chibi .cb-tape{position:absolute;top:-12px;left:50%;width:80px;height:24px;transform:translateX(-50%) rotate(-4deg);background:color-mix(in srgb,var(--accent) 35%,transparent);opacity:.8}
.tpl-chibi .cb-title{margin-bottom:22px}
.tpl-chibi .cb-heart{display:inline-grid;place-items:center;width:34px;height:34px;border-radius:50%;background:var(--accent);color:#fff;font-size:16px;margin-bottom:8px}
.tpl-chibi .cb-title .sec-title{margin:0;font-weight:800;font-size:28px;color:var(--ink)}
.tpl-chibi .cb-sub{margin:0;font-family:var(--font-title);font-weight:500;color:var(--muted)}
.tpl-chibi .guest-name{font-family:var(--font-title);font-weight:800;font-size:32px;color:var(--accent)}
.tpl-chibi .event{background:#fff;border:2px dashed var(--line);border-radius:22px}
.tpl-chibi .event h3{font-family:var(--font-title);font-weight:800}
.tpl-chibi .btn{border-radius:999px;font-family:var(--font-title);font-weight:700;box-shadow:0 4px 0 color-mix(in srgb,var(--accent) 70%,#000)}
.tpl-chibi .ph{border-radius:18px;border:6px solid #fff;box-shadow:0 8px 18px rgba(80,40,50,.12)}
.tpl-chibi .ph:nth-child(odd){transform:rotate(-2deg)}.tpl-chibi .ph:nth-child(even){transform:rotate(2deg)}
.tpl-chibi .cd-cell{border-radius:18px;background:#fff;border:2px dashed var(--line)}
.tpl-chibi .cd-cell b{font-family:var(--font-title);font-weight:800}
.tpl-chibi .form,.tpl-chibi .gift,.tpl-chibi .wish{border-radius:22px}
.tpl-chibi .thanks-big{font-family:var(--font-title);font-weight:800;font-size:44px;color:var(--accent)}

.cb-opener{background:radial-gradient(circle,var(--dot) 3px,transparent 3.5px),var(--bg);background-size:26px 26px,auto}
.cb-opener .cb-o{text-align:center;color:var(--ink);width:min(320px,86vw)}
.cb-opener .cb-o-couple{width:220px;animation:cbBob 3s ease-in-out infinite}
.cb-opener .cb-o-k{margin:6px 0 0;font-family:var(--font-title);font-weight:700;font-size:16px;color:var(--accent)}
.cb-opener .cb-o-names{margin:2px 0 8px;font-family:var(--font-title);font-weight:800;font-size:28px;line-height:1.15}
.cb-opener .cb-o-names span{color:var(--accent)}
.cb-opener .cb-o-to{margin:0 0 16px;font-size:15px}
.cb-opener .cb-o-to b{color:var(--accent)}
.cb-opener .btn{font-family:var(--font-title);font-weight:700;font-size:16px;padding:12px 26px;box-shadow:0 5px 0 color-mix(in srgb,var(--accent) 70%,#000)}
`,
};
