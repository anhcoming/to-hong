// Mẫu "Hoa Khô" — boho: cầu vồng đất nung, bó cỏ lau pampas, ảnh khung vòm, chữ serif mảnh.
const { esc } = require('../lib/util');
const orn = require('./_orn');

const base = {
  '--font-title': "'Cormorant Garamond',Georgia,serif",
  '--font-script': "'Great Vibes',cursive",
  '--font-body': "'Hanken Grotesk',system-ui,sans-serif",
};
const pal = (id, name, c1, c2, c3, bg, extra = {}) => ({
  id, name, swatch: [c2, c1],
  vars: { ...base, '--page': `color-mix(in srgb,${bg} 70%,${c1})`, '--c1': c1, '--c2': c2, '--c3': c3, '--bg': bg, '--paper': `color-mix(in srgb,${bg} 50%,#fff)`, '--ink': '#3b2c24', '--muted': '#8a7566', '--accent': c1, '--accent-ink': '#fffaf3', '--gold': c2, '--plume': '#e8d6b8', '--line': `color-mix(in srgb,${c2} 35%,${bg})`, ...extra },
});

// bó cỏ lau: thân cong + bông lông vũ ở ngọn, thêm vài lá khô
function pampas(cls) {
  const stems = [[40, 200, 10, 30, 0], [60, 200, 70, 12, 1], [76, 200, 120, 40, 2]];
  let g = '';
  for (const [x0, y0, x1, y1, k] of stems) {
    const cx = (x0 + x1) / 2 + (k === 1 ? -14 : 10), cy = (y0 + y1) / 2;
    g += `<path d="M${x0} ${y0}Q${cx} ${cy} ${x1} ${y1}" fill="none" stroke="var(--c3)" stroke-width="1.6"/>`;
    // lông: các nét ngắn hai bên, dài dần rồi ngắn lại
    for (let i = 0; i <= 26; i++) {
      const t = 0.5 + (i / 26) * 0.5;
      const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
      const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
      const dx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx), dy = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy);
      const L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, ux = dx / L, uy = dy / L;
      const len = 12 * Math.sin(Math.PI * (i / 26)) + 3;
      for (const s of [1, -1]) g += `<path d="M${orn.f(x)} ${orn.f(y)}l${orn.f(s * nx * len + ux * len * 0.8)} ${orn.f(s * ny * len + uy * len * 0.8)}" stroke="var(--plume)" stroke-width="2.2" stroke-linecap="round" opacity=".9"/>`;
    }
  }
  g += `<path d="M58 200Q30 150 4 136Q30 136 50 160" fill="var(--c2)" opacity=".75"/><path d="M66 200Q104 150 132 150Q108 160 80 196" fill="var(--c1)" opacity=".55"/><path d="M62 200Q50 140 34 110" stroke="var(--c3)" stroke-width="1.2" fill="none"/>${[[34, 110], [40, 124], [44, 140], [48, 156]].map(([x, y], i) => `<ellipse cx="${x + (i % 2 ? 6 : -6)}" cy="${y}" rx="3" ry="7" transform="rotate(${i % 2 ? 40 : -40} ${x} ${y})" fill="var(--c3)" opacity=".8"/>`).join('')}`;
  return orn.svg(cls, '0 0 140 204', g);
}

// cầu vồng boho: 3 vòng bán nguyệt đồng tâm
const rainbow = (cls) => orn.svg(cls, '0 0 200 104', [['var(--c1)', 96], ['var(--c2)', 78], ['var(--c3)', 60]].map(([c, r]) => `<path d="M${100 - r} 100A${r} ${r} 0 0 1 ${100 + r} 100" fill="none" stroke="${c}" stroke-width="14"/>`).join(''));

module.exports = {
  id: 'hoakho',
  name: 'Hoa Khô',
  group: 'hoa',
  desc: 'Boho đất nung: cầu vồng bán nguyệt, bó cỏ lau và hoa khô — mộc mạc, ấm áp',
  fonts: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Great+Vibes&family=Hanken+Grotesk:wght@300..700&display=swap',
  palettes: [
    pal('cam-dat', 'Cam đất', '#b8613f', '#d9a27a', '#8a6a4f', '#f6ece0'),
    pal('o-liu', 'Ô liu khô', '#6b7448', '#c9ab7c', '#8b7458', '#f3efe4'),
    pal('lam', 'Lam bụi', '#4f6d8a', '#c8a98a', '#8d7a68', '#f1eee9'),
  ],

  title(text, sub) {
    return `<div class="hk-title">${rainbow('hk-trb')}<h2 class="sec-title">${esc(text)}</h2>${sub ? `<p class="hk-sub">${esc(sub)}</p>` : ''}</div>`;
  },

  opener(ctx) {
    return `
<div class="opener hk-opener" id="opener">
  <div class="hk-o">
    ${rainbow('hk-o-rb')}
    <p class="hk-o-k">You're invited</p>
    <p class="hk-o-names">${esc(ctx.g)}<em>&amp;</em>${esc(ctx.b)}</p>
    ${ctx.guest ? `<p class="hk-o-to">Thân mời<b>${esc(ctx.guest.name)}</b></p>` : ''}
    <button class="btn" id="openBtn">Mở thiệp</button>
    ${pampas('hk-o-pampas')}
  </div>
</div>`;
  },

  cover(ctx) {
    const p = ctx.dparts;
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="hk-cover">
  ${rainbow('hk-rb')}
  <p class="hk-k">Together with their families</p>
  <h1 class="hk-names"><span>${esc(ctx.g)}</span><em>&amp;</em><span>${esc(ctx.b)}</span></h1>
  <div class="hk-pic">
    <div class="hk-photo"${photo ? ` style="background-image:url('${esc(photo)}')"` : ''}></div>
    ${pampas('hk-pampas l')}${pampas('hk-pampas r')}
  </div>
  ${p ? `<div class="hk-date"><span>${esc(ctx.weekday)}</span><b>${p.d} · ${p.m} · ${p.y}</b><span>${esc(ctx.timeText) || '&nbsp;'}</span></div>
  <p class="hk-lunar">${esc(ctx.lunar)}</p>` : ''}
</header>`;
  },

  css: `
.tpl-hoakho .card{background:var(--bg)}
.tpl-hoakho .hk-cover{position:relative;min-height:100svh;padding:36px 20px 44px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;background:radial-gradient(circle at 50% 0,color-mix(in srgb,var(--c2) 22%,var(--bg)),var(--bg) 60%)}
.tpl-hoakho .hk-rb{width:150px;opacity:.9}
.tpl-hoakho .hk-k{margin:14px 0 6px;font-family:var(--font-title);font-size:12px;letter-spacing:.32em;text-transform:uppercase;color:var(--muted)}
.tpl-hoakho .hk-names{margin:0;font-family:var(--font-title);font-weight:300;font-size:46px;line-height:1.05;letter-spacing:.04em;text-transform:uppercase;color:var(--ink)}
.tpl-hoakho .hk-names span{display:block}
.tpl-hoakho .hk-names em{display:block;font-family:var(--font-script);font-style:normal;text-transform:none;font-size:40px;color:var(--c1);line-height:1;margin:2px 0}
.tpl-hoakho .hk-pic{position:relative;margin-top:22px}
.tpl-hoakho .hk-photo{width:min(240px,64vw);aspect-ratio:4/5;border-radius:999px 999px 6px 6px;background:var(--line) center/cover no-repeat;box-shadow:0 18px 36px rgba(80,50,30,.2)}
.hk-pampas{position:absolute;bottom:-14px;width:110px;pointer-events:none}
.hk-pampas.l{left:-62px;transform:rotate(-6deg)}
.hk-pampas.r{right:-62px;transform:scaleX(-1) rotate(-6deg)}
.tpl-hoakho .hk-date{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:26px;font-family:var(--font-title);color:var(--ink)}
.tpl-hoakho .hk-date span{min-width:76px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.tpl-hoakho .hk-date b{font-size:24px;font-weight:500;padding:4px 14px;border-left:1px solid var(--c2);border-right:1px solid var(--c2)}
.tpl-hoakho .hk-lunar{margin:6px 0 0;font-family:var(--font-title);font-style:italic;color:var(--muted)}
.tpl-hoakho .hk-title{margin-bottom:26px}
.tpl-hoakho .hk-trb{display:block;width:64px;margin:0 auto 8px}
.tpl-hoakho .hk-title .sec-title{margin:0;font-weight:400;font-size:30px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink)}
.tpl-hoakho .hk-sub{margin:2px 0 0;font-family:var(--font-script);font-size:24px;color:var(--c1)}
.tpl-hoakho .guest-name{font-family:var(--font-script);font-size:44px;color:var(--c1)}
.tpl-hoakho .event{background:var(--paper);border:0;border-radius:999px 999px 10px 10px;padding-top:44px;box-shadow:0 10px 26px rgba(80,50,30,.08)}
.tpl-hoakho .event h3{font-size:26px;color:var(--c1)}
.tpl-hoakho .btn{border-radius:999px;letter-spacing:.08em}
.tpl-hoakho .ph{border-radius:999px 999px 6px 6px}
.tpl-hoakho .cd-cell{border-radius:999px 999px 8px 8px;background:var(--paper);border-color:var(--line)}
.tpl-hoakho .s-countdown,.tpl-hoakho .s-thanks{background:var(--c1);color:var(--accent-ink)}
.tpl-hoakho .s-countdown .sec-title,.tpl-hoakho .s-thanks .thanks-big,.tpl-hoakho .s-countdown .hk-sub{color:var(--accent-ink)}
.tpl-hoakho .s-countdown .cd-cell{background:transparent;border-color:color-mix(in srgb,var(--accent-ink) 50%,transparent)}
.tpl-hoakho .s-countdown .cd-cell b,.tpl-hoakho .s-countdown .cd-cell span{color:var(--accent-ink)}
.tpl-hoakho .thanks-big{font-family:var(--font-script);font-size:56px}
.tpl-hoakho .s-thanks p,.tpl-hoakho .s-thanks .thanks-names{color:var(--accent-ink)!important}

.hk-opener{background:radial-gradient(circle at 50% 30%,var(--paper),var(--page))}
.hk-opener .hk-o{position:relative;width:min(300px,84vw);padding:40px 24px 70px;text-align:center;color:var(--ink);background:var(--bg);border-radius:999px 999px 14px 14px;box-shadow:0 26px 50px rgba(80,50,30,.22)}
.hk-opener .hk-o-rb{width:120px}
.hk-opener .hk-o-k{margin:10px 0 2px;font-family:var(--font-title);font-size:12px;letter-spacing:.32em;text-transform:uppercase;color:var(--muted)}
.hk-opener .hk-o-names{margin:0 0 12px;font-family:var(--font-title);font-weight:300;font-size:32px;line-height:1.1;letter-spacing:.04em;text-transform:uppercase}
.hk-opener .hk-o-names em{display:block;font-family:var(--font-script);font-style:normal;text-transform:none;font-size:30px;color:var(--c1)}
.hk-opener .hk-o-to{margin:0 0 18px;font-size:12px;color:var(--muted)}
.hk-opener .hk-o-to b{display:block;font-family:var(--font-title);font-size:21px;font-weight:500;color:var(--ink)}
.hk-opener .btn{border-radius:999px;letter-spacing:.08em}
.hk-opener .hk-o-pampas{position:absolute;right:-30px;bottom:-20px;width:100px;transform:rotate(8deg)}
`,
};
