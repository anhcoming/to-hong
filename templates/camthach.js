// Mẫu "Cẩm Thạch" — nền đá cẩm thạch vân thật (bộ lọc SVG), khung art-deco vàng mảnh, chữ ánh kim.
const { esc } = require('../lib/util');
const orn = require('./_orn');

const base = {
  '--font-title': "'Prata',Georgia,serif",
  '--font-script': "'Great Vibes',cursive",
  '--font-body': "'Hanken Grotesk',system-ui,sans-serif",
};
const pal = (id, name, stone, vein, gold, ink, extra = {}) => ({
  id, name, swatch: [stone, gold],
  vars: { ...base, '--page': `color-mix(in srgb,${stone} 70%,#000)`, '--stone': stone, '--vein': vein, '--stone-ink': ink, '--bg': '#f7f5f1', '--paper': '#ffffff', '--ink': '#26231f', '--muted': '#7c766d', '--accent': `color-mix(in srgb,${gold} 70%,#000)`, '--accent-ink': '#ffffff', '--gold': gold, '--line': `color-mix(in srgb,${gold} 28%,#f7f5f1)`, ...extra },
});

const stone = (id) => orn.marble('ct-marble', id, [
  { color: 'var(--vein)', seed: 4, freq: '0.003 0.009', width: 0.025, op: 0.45 },
  { color: 'var(--vein)', seed: 8, freq: '0.006 0.016', width: 0.012, op: 0.3, rot: -20 },
  { color: 'var(--gold)', seed: 11, freq: '0.004 0.012', width: 0.01, op: 0.9, rot: -35 },
]);

module.exports = {
  id: 'camthach',
  name: 'Cẩm Thạch',
  group: 'chatlieu',
  desc: 'Đá cẩm thạch vân vàng, khung art-deco mảnh, chữ ánh kim — hiện đại, đẳng cấp',
  fonts: 'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Prata&family=Hanken+Grotesk:wght@300..700&display=swap',
  palettes: [
    pal('vang', 'Trắng vân vàng', '#f1eee8', '#8f8a84', '#c9a55c', '#2a2620'),
    pal('xanh', 'Lục bảo', '#173a32', '#7fb3a0', '#d7b467', '#f4efe2'),
    pal('den', 'Đá đen', '#1a1a1c', '#8a8a90', '#d4b06a', '#f2ede2'),
  ],

  title(text, sub) {
    return `<div class="ct-title"><span class="ct-deco" aria-hidden="true"></span><h2 class="sec-title">${esc(text)}</h2>${sub ? `<p class="ct-sub">${esc(sub)}</p>` : ''}</div>`;
  },

  opener(ctx) {
    return `
<div class="opener ct-opener" id="opener">
  ${stone('ctmo')}
  <div class="ct-o">
    <p class="ct-o-mono">${esc(ctx.initials)}</p>
    <p class="ct-o-k">Wedding Invitation</p>
    <p class="ct-o-names">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
    ${ctx.guest ? `<p class="ct-o-to">Trân trọng kính mời<b>${esc(ctx.guest.name)}</b></p>` : ''}
    <button class="btn" id="openBtn">Mở thiệp</button>
  </div>
</div>`;
  },

  cover(ctx) {
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="ct-cover">
  ${stone('ctmc')}
  <div class="ct-frame">
    <p class="ct-k">Save the date</p>
    <h1 class="ct-names"><span>${esc(ctx.g)}</span><em>&amp;</em><span>${esc(ctx.b)}</span></h1>
    ${photo ? `<div class="ct-photo" style="background-image:url('${esc(photo)}')"></div>` : ''}
    ${ctx.dateBlock('stack')}
  </div>
</header>`;
  },

  css: `
.ct-marble{position:absolute;inset:0;pointer-events:none}
.tpl-camthach .ct-cover{position:relative;min-height:100svh;padding:20px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:radial-gradient(circle at 30% 20%,color-mix(in srgb,var(--stone) 85%,#fff),var(--stone) 60%);color:var(--stone-ink)}
.tpl-camthach .ct-frame{position:relative;width:100%;max-width:380px;min-height:calc(100svh - 40px);padding:48px 22px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;border:1px solid var(--gold);background:radial-gradient(ellipse at 50% 50%,color-mix(in srgb,var(--stone) 78%,transparent) 30%,color-mix(in srgb,var(--stone) 40%,transparent));clip-path:polygon(22px 0,calc(100% - 22px) 0,100% 22px,100% calc(100% - 22px),calc(100% - 22px) 100%,22px 100%,0 calc(100% - 22px),0 22px)}
.tpl-camthach .ct-frame::before{content:"";position:absolute;inset:8px;border:1px solid color-mix(in srgb,var(--gold) 60%,transparent);clip-path:inherit;pointer-events:none}
.tpl-camthach .ct-k{margin:0 0 12px;font-family:var(--font-title);font-size:12px;letter-spacing:.44em;text-transform:uppercase;color:var(--gold)}
.tpl-camthach .ct-names{margin:0;font-family:var(--font-title);font-weight:400;font-size:38px;line-height:1.15;letter-spacing:.04em}
.tpl-camthach .ct-names span{display:block}
.tpl-camthach .ct-names em{display:block;font-family:var(--font-script);font-style:normal;font-size:40px;color:var(--gold);line-height:1}
.tpl-camthach .ct-photo{width:min(230px,62vw);aspect-ratio:4/5;margin:24px auto 0;background:center/cover no-repeat;border:1px solid var(--gold);box-shadow:0 0 0 8px color-mix(in srgb,var(--stone) 80%,transparent),0 0 0 9px var(--gold),0 24px 40px rgba(0,0,0,.25)}
.tpl-camthach .ct-title{margin-bottom:26px}
.tpl-camthach .ct-deco{display:block;width:30px;height:30px;margin:0 auto 12px;border:1px solid var(--gold);transform:rotate(45deg);box-shadow:inset 0 0 0 5px var(--bg),inset 0 0 0 6px var(--gold)}
.tpl-camthach .ct-title .sec-title{margin:0;font-weight:400;font-size:26px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink)}
.tpl-camthach .ct-sub{margin:4px 0 0;font-family:var(--font-script);font-size:24px;color:var(--gold);filter:brightness(.85)}
.tpl-camthach .guest-name{font-family:var(--font-script);font-size:44px;color:var(--ink)}
.tpl-camthach .fam-label,.tpl-camthach .gift-who{color:var(--accent)}
.tpl-camthach .btn{border-radius:0;letter-spacing:.14em;text-transform:uppercase;font-size:12px}
.tpl-camthach .ph{border-radius:0;border:1px solid var(--gold)}
.tpl-camthach .s-cal,.tpl-camthach .s-thanks,.tpl-camthach .credit{background:var(--stone);color:var(--stone-ink);opacity:1;--cal-hi:var(--gold)}
.tpl-camthach .s-cal .sec-title,.tpl-camthach .s-thanks .thanks-big{color:var(--gold)}
.tpl-camthach .thanks-big{font-family:var(--font-script);font-size:56px}
.tpl-camthach .s-thanks p,.tpl-camthach .s-thanks .thanks-names{color:var(--stone-ink)!important}
.tpl-camthach .credit .wm{background:transparent;border-color:var(--gold);color:var(--stone-ink)}

.ct-opener{overflow:hidden;background:var(--stone)}
.ct-opener .ct-o{position:relative;width:min(300px,82vw);padding:44px 24px 38px;text-align:center;color:var(--stone-ink);border:1px solid var(--gold);outline:1px solid color-mix(in srgb,var(--gold) 60%,transparent);outline-offset:6px;background:color-mix(in srgb,var(--stone) 70%,transparent);backdrop-filter:blur(2px)}
.ct-opener .ct-o-mono{margin:0;font-family:var(--font-script);font-size:52px;line-height:1.1;color:var(--gold)}
.ct-opener .ct-o-k{margin:8px 0 4px;font-family:var(--font-title);font-size:11px;letter-spacing:.4em;text-transform:uppercase;color:var(--gold)}
.ct-opener .ct-o-names{margin:0 0 16px;font-family:var(--font-title);font-size:22px;letter-spacing:.04em}
.ct-opener .ct-o-to{margin:0 0 18px;font-size:12px;opacity:.85}
.ct-opener .ct-o-to b{display:block;font-family:var(--font-title);font-weight:400;font-size:19px;color:var(--gold)}
.ct-opener .btn{background:var(--gold);border-color:var(--gold);color:var(--stone);border-radius:0;letter-spacing:.14em;text-transform:uppercase;font-size:12px}
`,
};
