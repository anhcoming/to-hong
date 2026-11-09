// Mẫu "Bạch Sứ" — men sứ trắng, hoa văn vẽ tay kiểu gốm (lam/đỏ/nâu), ảnh tròn như lòng đĩa sứ.
const { esc } = require('../lib/util');
const orn = require('./_orn');

const base = {
  '--font-title': "'Noto Serif',Georgia,serif",
  '--font-script': "'Dancing Script',cursive",
  '--font-body': "'Hanken Grotesk',system-ui,sans-serif",
};
const pal = (id, name, glaze, bg, extra = {}) => ({
  id, name, swatch: [bg, glaze],
  vars: { ...base, '--page': `color-mix(in srgb,${bg} 75%,${glaze})`, '--glaze': glaze, '--bg': bg, '--paper': '#ffffff', '--ink': '#25282e', '--muted': '#737780', '--accent': glaze, '--accent-ink': '#ffffff', '--gold': glaze, '--line': `color-mix(in srgb,${glaze} 18%,${bg})`, ...extra },
});

// một ô hoa văn gốm: cành cuộn + hoa 5 cánh + lá, lặp ngang thành viền
function scrollBand(cls, n = 8) {
  let g = '';
  for (let i = 0; i < n; i++) {
    const x = i * 60;
    g += `<path d="M${x} 30C${x + 10} 10 ${x + 24} 10 ${x + 30} 30S${x + 50} 50 ${x + 60} 30" fill="none" stroke="var(--glaze)" stroke-width="1.6"/>`;
    g += orn.blossom(x + 15, 18, 8, { fill: 'var(--glaze)', core: 'var(--bg)', rot: i * 13 });
    g += `<ellipse cx="${x + 45}" cy="42" rx="3" ry="7" transform="rotate(-40 ${x + 45} 42)" fill="var(--glaze)" opacity=".8"/><ellipse cx="${x + 52}" cy="38" rx="2.4" ry="6" transform="rotate(40 ${x + 52} 38)" fill="var(--glaze)" opacity=".6"/><circle cx="${x + 32}" cy="44" r="1.8" fill="var(--glaze)"/>`;
  }
  return orn.svg(cls, `0 0 ${n * 60} 60`, `<path d="M0 2H${n * 60}M0 58H${n * 60}" stroke="var(--glaze)" stroke-width="2"/><path d="M0 6H${n * 60}M0 54H${n * 60}" stroke="var(--glaze)" stroke-width=".8"/>${g}`, ' preserveAspectRatio="xMidYMid slice"');
}

// vành đĩa: vòng tròn đôi + chuỗi hoa nhỏ quanh viền
function plateRim(cls) {
  let g = '<circle cx="100" cy="100" r="96" fill="none" stroke="var(--glaze)" stroke-width="3"/><circle cx="100" cy="100" r="90" fill="none" stroke="var(--glaze)" stroke-width="1"/><circle cx="100" cy="100" r="72" fill="none" stroke="var(--glaze)" stroke-width="1"/>';
  for (let i = 0; i < 12; i++) {
    const a = orn.rad(i * 30);
    g += orn.blossom(orn.f(100 + 81 * Math.cos(a)), orn.f(100 + 81 * Math.sin(a)), 6.5, { fill: 'var(--glaze)', core: 'var(--paper)', rot: i * 30 });
    const b = orn.rad(i * 30 + 15);
    g += `<circle cx="${orn.f(100 + 81 * Math.cos(b))}" cy="${orn.f(100 + 81 * Math.sin(b))}" r="1.8" fill="var(--glaze)"/>`;
  }
  return orn.svg(cls, '0 0 200 200', g);
}

module.exports = {
  id: 'bachsu',
  name: 'Bạch Sứ',
  group: 'chatlieu',
  desc: 'Men sứ trắng, hoa văn gốm vẽ tay, ảnh tròn như lòng đĩa — thanh nhã, hoài cổ',
  fonts: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;700&family=Noto+Serif:ital,wght@0,400..700;1,400..600&family=Hanken+Grotesk:wght@300..700&display=swap',
  palettes: [
    pal('lam', 'Lam sứ', '#1f4e9c', '#f6f8fb'),
    pal('do', 'Đỏ son sứ', '#b0242c', '#fbf7f4'),
    pal('nau-kem', 'Nâu men rạn', '#86643a', '#f6f0e4'),
  ],

  title(text, sub) {
    return `<div class="bs-title">${plateRim('bs-trim')}<h2 class="sec-title">${esc(text)}</h2>${sub ? `<p class="bs-sub">${esc(sub)}</p>` : ''}</div>`;
  },

  opener(ctx) {
    return `
<div class="opener bs-opener" id="opener">
  <div class="bs-o">
    <div class="bs-o-plate">${plateRim('')}<span>囍</span></div>
    <p class="bs-o-k">Thiệp mời cưới</p>
    <p class="bs-o-names">${esc(ctx.g)}<em>&amp;</em>${esc(ctx.b)}</p>
    ${ctx.guest ? `<p class="bs-o-to">Kính mời<b>${esc(ctx.guest.name)}</b></p>` : ''}
    <button class="btn" id="openBtn">Mở thiệp</button>
  </div>
</div>`;
  },

  cover(ctx) {
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="bs-cover">
  ${scrollBand('bs-band top')}
  <div class="bs-inner">
    <p class="bs-k">Lễ Thành Hôn</p>
    <div class="bs-plate">
      ${plateRim('bs-rim')}
      <div class="bs-photo"${photo ? ` style="background-image:url('${esc(photo)}')"` : ''}>${photo ? '' : '<span>囍</span>'}</div>
    </div>
    <h1 class="bs-names"><span>${esc(ctx.g)}</span><em>&amp;</em><span>${esc(ctx.b)}</span></h1>
    ${ctx.dateBlock('bloc')}
  </div>
  ${scrollBand('bs-band bot')}
</header>`;
  },

  css: `
.tpl-bachsu .bs-cover{position:relative;min-height:100svh;display:flex;flex-direction:column;background:radial-gradient(ellipse at 40% 25%,#fff,var(--bg) 60%)}
.tpl-bachsu .bs-band{display:block;width:100%;height:56px;flex:none}
.tpl-bachsu .bs-band.top{margin-top:12px}.tpl-bachsu .bs-band.bot{margin-bottom:12px;transform:scaleY(-1)}
.tpl-bachsu .bs-inner{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;color:var(--ink)}
.tpl-bachsu .bs-k{margin:0 0 16px;font-family:var(--font-title);font-size:12px;letter-spacing:.4em;text-transform:uppercase;color:var(--glaze)}
.tpl-bachsu .bs-plate{position:relative;width:min(280px,74vw);aspect-ratio:1;border-radius:50%;background:var(--paper);box-shadow:0 18px 40px color-mix(in srgb,var(--glaze) 20%,transparent),inset 0 -6px 16px rgba(0,0,0,.05)}
.tpl-bachsu .bs-rim{position:absolute;inset:0;width:100%;height:100%}
.tpl-bachsu .bs-photo{position:absolute;inset:15%;border-radius:50%;background:var(--line) center/cover no-repeat;display:grid;place-items:center}
.tpl-bachsu .bs-photo span{font-family:"Noto Serif SC","SimSun",serif;font-size:64px;color:var(--glaze)}
.tpl-bachsu .bs-names{margin:24px 0 0;font-family:var(--font-script);font-weight:700;font-size:44px;line-height:1.05;color:var(--glaze)}
.tpl-bachsu .bs-names span{display:block}
.tpl-bachsu .bs-names em{display:block;font-style:normal;font-weight:500;font-size:26px;color:var(--muted)}
.tpl-bachsu .bs-title{margin-bottom:24px}
.tpl-bachsu .bs-trim{display:block;width:44px;margin:0 auto 8px}
.tpl-bachsu .bs-title .sec-title{margin:0;font-weight:500;font-size:26px;color:var(--glaze)}
.tpl-bachsu .bs-sub{margin:4px 0 0;font-family:var(--font-script);font-size:20px;color:var(--muted)}
.tpl-bachsu .guest-name{font-family:var(--font-script);font-weight:700;font-size:40px;color:var(--glaze)}
.tpl-bachsu .btn{border-radius:999px}
.tpl-bachsu .ph{border-radius:50%;aspect-ratio:1;border:3px solid var(--paper);box-shadow:0 0 0 2px var(--glaze)}
.tpl-bachsu .s-cal,.tpl-bachsu .s-thanks,.tpl-bachsu .credit{background:var(--glaze);color:#fff;opacity:1;--cal-hi:var(--gold)}
.tpl-bachsu .s-cal .sec-title,.tpl-bachsu .s-thanks .thanks-big,.tpl-bachsu .s-cal .bs-sub{color:#fff}
.tpl-bachsu .s-cal .bs-trim{--glaze:#fff}
.tpl-bachsu .thanks-big{font-family:var(--font-script);font-weight:700;font-size:50px}
.tpl-bachsu .s-thanks p,.tpl-bachsu .s-thanks .thanks-names{color:#fff!important}
.tpl-bachsu .credit .wm{background:transparent;border-color:#fff;color:#fff}

.bs-opener{background:radial-gradient(ellipse at 50% 35%,#fff,var(--page))}
.bs-opener .bs-o{text-align:center;color:var(--ink);width:min(320px,86vw)}
.bs-opener .bs-o-plate{position:relative;width:180px;height:180px;margin:0 auto 20px;border-radius:50%;background:var(--paper);display:grid;place-items:center;box-shadow:0 18px 36px color-mix(in srgb,var(--glaze) 25%,transparent)}
.bs-opener .bs-o-plate svg{position:absolute;inset:0;width:100%;height:100%}
.bs-opener .bs-o-plate span{position:relative;font-family:"Noto Serif SC","SimSun",serif;font-size:60px;color:var(--glaze)}
.bs-opener .bs-o-k{margin:0;font-size:11px;letter-spacing:.36em;text-transform:uppercase;color:var(--glaze)}
.bs-opener .bs-o-names{margin:6px 0 14px;font-family:var(--font-script);font-weight:700;font-size:38px;line-height:1.05;color:var(--glaze)}
.bs-opener .bs-o-names em{display:block;font-style:normal;font-weight:500;font-size:22px;color:var(--muted)}
.bs-opener .bs-o-to{margin:0 0 18px;font-size:12px;color:var(--muted)}
.bs-opener .bs-o-to b{display:block;font-family:var(--font-title);font-weight:500;font-size:19px;color:var(--ink)}
.tpl-bachsu .s-cal{--cal-hi:#fff;--cal-on:var(--glaze)}
`,
};
