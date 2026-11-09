// Mẫu "Lâu Đài" — bầu trời hoàng hôn, bóng lâu đài châu Âu phía dưới, ảnh cưới trong cổng vòm đá.
const { esc } = require('../lib/util');
const orn = require('./_orn');

const base = {
  '--font-title': "'Cormorant Garamond',Georgia,serif",
  '--font-script': "'Great Vibes',cursive",
  '--font-body': "'Hanken Grotesk',system-ui,sans-serif",
};
const pal = (id, name, sky1, sky2, castle, gold, extra = {}) => ({
  id, name, swatch: [sky2, castle],
  vars: { ...base, '--page': castle, '--sky1': sky1, '--sky2': sky2, '--castle': castle, '--hero-ink': '#fdf8ef', '--bg': '#f6f5f1', '--paper': '#ffffff', '--ink': '#25292e', '--muted': '#727880', '--accent': castle, '--accent-ink': '#fdf8ef', '--gold': gold, '--line': `color-mix(in srgb,${gold} 25%,#f6f5f1)`, ...extra },
});

// bóng lâu đài: các tháp có mái nhọn, tường răng cưa, cửa sổ sáng đèn
function castle(cls) {
  const tower = (x, w, h, roof, base = 200) => {
    const top = base - h;
    let s = `<rect x="${x}" y="${top}" width="${w}" height="${h}"/>`;
    if (roof) s += `<path d="M${x - 3} ${top}L${x + w / 2} ${top - roof}L${x + w + 3} ${top}Z"/><path d="M${x + w / 2} ${top - roof}v-10" stroke="var(--castle)" stroke-width="1.4"/><path d="M${x + w / 2} ${top - roof - 10}l8 3-8 3z"/>`;
    else for (let i = 0; i < w; i += 8) s += `<rect x="${x + i}" y="${top - 6}" width="5" height="6"/>`;
    return s;
  };
  const win = (x, y) => `<path d="M${x} ${y + 10}v-6a3 3 0 0 1 6 0v6z" fill="var(--gold)" opacity=".9"/>`;
  return orn.svg(cls, '0 0 360 200', `
<g fill="var(--castle)">
  ${tower(0, 360, 34, 0)}
  ${tower(40, 40, 96, 40)}${tower(280, 40, 96, 40)}
  ${tower(96, 50, 120, 0)}${tower(214, 50, 120, 0)}
  ${tower(150, 60, 150, 58)}
  ${tower(10, 22, 70, 26)}${tower(328, 22, 70, 26)}
  <path d="M164 200v-34a16 16 0 0 1 32 0v34z" fill="var(--sky2)" opacity=".35"/>
</g>
${win(56, 128)}${win(296, 128)}${win(176, 80)}${win(110, 110)}${win(232, 110)}${win(176, 112)}${win(18, 150)}${win(336, 150)}`, ' preserveAspectRatio="xMidYMax meet"');
}
const stars = () => orn.svg('ld-stars', '0 0 360 200', [[30, 30], [80, 70], [140, 20], [220, 50], [300, 24], [330, 90], [60, 130], [260, 120], [190, 100]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1.1 : 1.8}" fill="#fff" opacity="${i % 2 ? '.6' : '.9'}"/>`).join(''), ' preserveAspectRatio="none"');

module.exports = {
  id: 'laudai',
  name: 'Lâu Đài',
  group: 'hoanggia',
  desc: 'Trời hoàng hôn, bóng lâu đài châu Âu, ảnh trong cổng vòm đá — như cổ tích',
  fonts: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Great+Vibes&family=Hanken+Grotesk:wght@300..700&display=swap',
  palettes: [
    pal('xanh', 'Hoàng hôn ngọc', '#f2c9a8', '#4f8a8b', '#1f3b44', '#e8c47c'),
    pal('lam', 'Đêm lam', '#d9b8d6', '#3d4f8f', '#1a2347', '#ecd08a'),
    pal('hong', 'Bình minh hồng', '#fbe0c8', '#d98a9e', '#4a2d3d', '#f2d08f'),
  ],

  title(text, sub) {
    return `<div class="ld-title"><span class="ld-arch" aria-hidden="true"></span><h2 class="sec-title">${esc(text)}</h2>${sub ? `<p class="ld-sub">${esc(sub)}</p>` : ''}</div>`;
  },

  opener(ctx) {
    return `
<div class="opener ld-opener" id="opener">
  ${stars()}
  <div class="ld-o">
    <p class="ld-o-k">Once upon a time</p>
    <p class="ld-o-names">${esc(ctx.g)}<em>&amp;</em>${esc(ctx.b)}</p>
    ${ctx.guest ? `<p class="ld-o-to">Trân trọng kính mời<b>${esc(ctx.guest.name)}</b></p>` : ''}
    <button class="btn" id="openBtn">Mở cổng lâu đài</button>
  </div>
  ${castle('ld-castle')}
</div>`;
  },

  cover(ctx) {
    const p = ctx.dparts;
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="ld-cover">
  ${stars()}
  <p class="ld-k">The Wedding of</p>
  <h1 class="ld-names"><span>${esc(ctx.g)}</span><em>&amp;</em><span>${esc(ctx.b)}</span></h1>
  <div class="ld-gate">
    <div class="ld-photo"${photo ? ` style="background-image:url('${esc(photo)}')"` : ''}></div>
  </div>
  ${p ? `<p class="ld-date">${esc(ctx.weekday)} · <b>${p.d}.${p.m}.${p.y}</b>${ctx.timeText ? ` · ${esc(ctx.timeText)}` : ''}</p>
  <p class="ld-lunar">${esc(ctx.lunar)}</p>` : ''}
  ${castle('ld-castle')}
</header>`;
  },

  css: `
.ld-stars{position:absolute;left:0;right:0;top:0;width:100%;height:40%;pointer-events:none}
.ld-castle{position:absolute;left:0;right:0;bottom:-1px;width:100%;height:auto;max-height:44%;pointer-events:none}
.tpl-laudai .ld-cover{position:relative;min-height:100svh;padding:44px 20px 170px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;color:var(--hero-ink);background:linear-gradient(180deg,var(--sky2) 0%,color-mix(in srgb,var(--sky2) 50%,var(--sky1)) 55%,var(--sky1) 80%)}
.tpl-laudai .ld-k{position:relative;margin:0;font-family:var(--font-title);font-size:13px;letter-spacing:.4em;text-transform:uppercase;opacity:.9}
.tpl-laudai .ld-names{position:relative;margin:8px 0 0;font-family:var(--font-script);font-weight:400;font-size:52px;line-height:1.05;text-shadow:0 2px 14px rgba(0,0,0,.25)}
.tpl-laudai .ld-names span{display:block}
.tpl-laudai .ld-names em{display:block;font-style:normal;font-family:var(--font-title);font-size:24px;color:var(--gold)}
.tpl-laudai .ld-gate{position:relative;z-index:1;margin-top:22px;padding:10px;border-radius:999px 999px 0 0;background:repeating-linear-gradient(90deg,rgba(255,255,255,.08) 0 22px,rgba(0,0,0,.06) 22px 24px),color-mix(in srgb,var(--sky1) 60%,#fff);box-shadow:inset 0 0 0 1px rgba(0,0,0,.08),0 20px 40px rgba(0,0,0,.25)}
.tpl-laudai .ld-photo{width:min(220px,60vw);aspect-ratio:3/4;border-radius:999px 999px 0 0;background:var(--castle) center/cover no-repeat;box-shadow:inset 0 0 0 2px var(--gold)}
.tpl-laudai .ld-date{position:relative;z-index:1;margin:18px 0 0;font-family:var(--font-title);font-size:18px;color:var(--castle)}
.tpl-laudai .ld-date b{font-weight:600}
.tpl-laudai .ld-lunar{position:relative;z-index:1;margin:2px 0 0;font-family:var(--font-title);font-style:italic;color:color-mix(in srgb,var(--castle) 80%,transparent)}
.tpl-laudai .ld-title{margin-bottom:24px}
.tpl-laudai .ld-arch{display:block;width:26px;height:34px;margin:0 auto 10px;border:2px solid var(--gold);border-bottom:0;border-radius:999px 999px 0 0}
.tpl-laudai .ld-title .sec-title{margin:0;font-weight:500;font-size:32px;color:var(--castle)}
.tpl-laudai .ld-sub{margin:2px 0 0;font-family:var(--font-script);font-size:24px;color:var(--gold);filter:brightness(.85)}
.tpl-laudai .guest-name{font-family:var(--font-script);font-size:44px;color:var(--castle)}
.tpl-laudai .event{background:var(--paper);border:1px solid var(--line);border-radius:999px 999px 10px 10px;padding-top:44px}
.tpl-laudai .event h3{font-size:26px}
.tpl-laudai .btn{border-radius:999px}
.tpl-laudai .ph{border-radius:999px 999px 4px 4px}
.tpl-laudai .s-countdown,.tpl-laudai .s-thanks,.tpl-laudai .credit{background:linear-gradient(180deg,var(--sky2),var(--castle));color:var(--hero-ink);opacity:1}
.tpl-laudai .s-countdown .sec-title,.tpl-laudai .s-thanks .thanks-big{color:var(--hero-ink)}
.tpl-laudai .s-countdown .cd-cell{background:rgba(255,255,255,.08);border-color:var(--gold)}
.tpl-laudai .s-countdown .cd-cell b{color:var(--hero-ink)}
.tpl-laudai .s-countdown .cd-cell span{color:var(--gold)}
.tpl-laudai .thanks-big{font-family:var(--font-script);font-size:56px}
.tpl-laudai .s-thanks p,.tpl-laudai .s-thanks .thanks-names{color:var(--hero-ink)!important}
.tpl-laudai .credit .wm{background:transparent;border-color:var(--gold);color:var(--hero-ink)}

.ld-opener{overflow:hidden;background:linear-gradient(180deg,var(--sky2),color-mix(in srgb,var(--sky2) 50%,var(--sky1)) 60%,var(--sky1))}
.ld-opener .ld-o{position:relative;z-index:1;text-align:center;color:var(--hero-ink);width:min(320px,86vw);margin-bottom:22vh}
.ld-opener .ld-o-k{margin:0;font-family:var(--font-title);font-style:italic;font-size:16px;letter-spacing:.1em;opacity:.9}
.ld-opener .ld-o-names{margin:6px 0 14px;font-family:var(--font-script);font-size:46px;line-height:1.05;text-shadow:0 2px 14px rgba(0,0,0,.25)}
.ld-opener .ld-o-names em{display:block;font-style:normal;font-family:var(--font-title);font-size:22px;color:var(--gold)}
.ld-opener .ld-o-to{margin:0 0 18px;font-size:12px}
.ld-opener .ld-o-to b{display:block;font-family:var(--font-title);font-size:21px;font-weight:500;color:var(--gold)}
.ld-opener .btn{background:var(--gold);border-color:var(--gold);color:var(--castle);border-radius:999px}
`,
};
