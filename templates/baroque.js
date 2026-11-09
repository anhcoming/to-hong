// Mẫu "Baroque" — nền gấm damask, thẻ kem viền góc cuộn vàng, ảnh oval khung đôi.
const { esc } = require('../lib/util');
const orn = require('./_orn');

const base = {
  '--font-title': "'Cormorant',Georgia,serif",
  '--font-script': "'Great Vibes',cursive",
  '--font-body': "'Hanken Grotesk',system-ui,sans-serif",
};
const pal = (id, name, hero, gold, extra = {}) => ({
  id, name, swatch: [hero, gold],
  vars: { ...base, '--page': `color-mix(in srgb,${hero} 60%,#000)`, '--hero': hero, '--hero-ink': '#fbf2de', '--bg': '#f8f2e6', '--paper': '#fffcf5', '--ink': '#2e231c', '--muted': '#867361', '--accent': hero, '--accent-ink': '#fbf2de', '--gold': gold, '--line': `color-mix(in srgb,${gold} 32%,#f8f2e6)`, ...extra },
});

const corners = (p) => ['tl', 'tr', 'bl', 'br'].map((c) => orn.scrollCorner(`${p} ${c}`)).join('');

module.exports = {
  id: 'baroque',
  name: 'Baroque',
  group: 'hoanggia',
  desc: 'Nền gấm damask, khung góc cuộn vàng, ảnh oval — cổ điển châu Âu, xa hoa',
  fonts: 'https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Great+Vibes&family=Hanken+Grotesk:wght@300..700&display=swap',
  palettes: [
    pal('do-dam', 'Đỏ đậm', '#6e0f1e', '#cfa55a'),
    pal('vang', 'Vàng hoàng gia', '#5a4320', '#e2c178', { '--bg': '#fbf6ea' }),
    pal('lam', 'Lam đậm', '#14244d', '#cfae68'),
    pal('xanh-dam', 'Xanh đậm', '#123b33', '#cdac63'),
  ],

  title(text, sub) {
    return `<div class="bq-title">${sub ? `<p class="bq-sub">${esc(sub)}</p>` : ''}<h2 class="sec-title">${esc(text)}</h2>${orn.divider('bq-div')}</div>`;
  },

  opener(ctx) {
    return `
<div class="opener bq-opener" id="opener">
  ${orn.damask('bq-dm', 'bqdm-o')}
  <div class="bq-o">
    ${corners('bq-cn')}
    <p class="bq-o-k">You are cordially invited</p>
    <p class="bq-o-mono">${esc(ctx.initials)}</p>
    <p class="bq-o-names">${esc(ctx.g)}<em>&amp;</em>${esc(ctx.b)}</p>
    ${ctx.guest ? `<p class="bq-o-to">Trân trọng kính mời<b>${esc(ctx.guest.name)}</b></p>` : ''}
    <button class="btn" id="openBtn">Mở thiệp</button>
  </div>
</div>`;
  },

  cover(ctx) {
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="bq-cover">
  ${orn.damask('bq-dm', 'bqdm-c')}
  <div class="bq-card">
    ${corners('bq-cn')}
    <p class="bq-k">The Wedding Celebration of</p>
    <h1 class="bq-names"><span>${esc(ctx.g)}</span><em>&amp;</em><span>${esc(ctx.b)}</span></h1>
    ${photo ? `<div class="bq-photo"><div style="background-image:url('${esc(photo)}')"></div></div>` : ''}
    ${ctx.dateBlock('split')}
  </div>
</header>`;
  },

  css: `
.bq-dm{position:absolute;inset:0;pointer-events:none}
.bq-cn{position:absolute;width:74px;height:74px;pointer-events:none}
.bq-cn.tl{top:6px;left:6px}.bq-cn.tr{top:6px;right:6px;transform:scaleX(-1)}
.bq-cn.bl{bottom:6px;left:6px;transform:scaleY(-1)}.bq-cn.br{bottom:6px;right:6px;transform:scale(-1)}
.tpl-baroque .bq-cover{position:relative;min-height:100svh;padding:18px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:radial-gradient(circle at 50% 30%,color-mix(in srgb,var(--hero) 80%,#fff 10%),var(--hero) 70%)}
.tpl-baroque .bq-card{position:relative;width:100%;max-width:400px;min-height:calc(100svh - 36px);padding:56px 26px 50px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:var(--ink);background:var(--paper);box-shadow:0 0 0 6px var(--paper),0 0 0 7px var(--gold),0 24px 60px rgba(0,0,0,.4)}
.tpl-baroque .bq-k{margin:0 0 10px;font-family:var(--font-title);font-size:13px;font-style:italic;letter-spacing:.14em;color:var(--muted)}
.tpl-baroque .bq-names{margin:0;font-family:var(--font-title);font-weight:600;font-size:36px;line-height:1.1;letter-spacing:.12em;text-transform:uppercase;color:var(--hero)}
.tpl-baroque .bq-names span{display:block}
.tpl-baroque .bq-names em{display:block;font-family:var(--font-script);font-weight:400;font-style:normal;text-transform:none;letter-spacing:0;font-size:38px;color:var(--gold);line-height:1.1}
.tpl-baroque .bq-photo{width:200px;aspect-ratio:4/5;margin:22px auto 4px;padding:6px;border-radius:50%;border:2px solid var(--gold);outline:1px solid var(--gold);outline-offset:4px}
.tpl-baroque .bq-photo>div{width:100%;height:100%;border-radius:50%;background:var(--line) center/cover no-repeat}
.tpl-baroque .bq-title{margin-bottom:26px}
.tpl-baroque .bq-sub{margin:0;font-family:var(--font-script);font-size:26px;color:var(--gold);line-height:1.1}
.tpl-baroque .bq-title .sec-title{margin:0;font-weight:600;font-size:28px;letter-spacing:.1em;text-transform:uppercase;color:var(--hero)}
.tpl-baroque .bq-div{display:block;width:170px;height:18px;margin:10px auto 0}
.tpl-baroque .guest-name{font-family:var(--font-script);font-size:44px;color:var(--hero)}
.tpl-baroque .couple-full .full{font-family:var(--font-title);font-weight:600;font-size:22px}
.tpl-baroque .btn{border-radius:2px;letter-spacing:.12em;text-transform:uppercase;font-size:12px}
.tpl-baroque .ph{border-radius:50%/40%;border:2px solid var(--gold)}
.tpl-baroque .s-cal,.tpl-baroque .s-thanks,.tpl-baroque .credit{background:var(--hero);color:var(--hero-ink);opacity:1;--cal-hi:var(--gold)}
.tpl-baroque .s-cal .sec-title,.tpl-baroque .s-thanks .thanks-big{color:var(--gold)}
.tpl-baroque .thanks-big{font-family:var(--font-script);font-size:56px}
.tpl-baroque .s-thanks p,.tpl-baroque .s-thanks .thanks-names{color:var(--hero-ink)!important}
.tpl-baroque .credit .wm{background:transparent;border-color:var(--gold);color:var(--hero-ink)}

.bq-opener{overflow:hidden;background:radial-gradient(circle at 50% 35%,color-mix(in srgb,var(--hero) 85%,#fff 8%),var(--page))}
.bq-opener .bq-o{position:relative;width:min(310px,84vw);padding:54px 26px 40px;text-align:center;color:var(--ink);background:var(--paper);box-shadow:0 0 0 5px var(--paper),0 0 0 6px var(--gold),0 30px 60px rgba(0,0,0,.45)}
.bq-opener .bq-cn{width:60px;height:60px}
.bq-opener .bq-o-k{margin:0;font-family:var(--font-title);font-style:italic;font-size:13px;color:var(--muted)}
.bq-opener .bq-o-mono{margin:6px 0 2px;font-family:var(--font-script);font-size:48px;line-height:1.1;color:var(--gold)}
.bq-opener .bq-o-names{margin:0 0 14px;font-family:var(--font-title);font-weight:600;font-size:24px;letter-spacing:.1em;text-transform:uppercase;color:var(--hero)}
.bq-opener .bq-o-names em{display:block;font-family:var(--font-script);font-weight:400;font-style:normal;text-transform:none;letter-spacing:0;font-size:24px;color:var(--gold)}
.bq-opener .bq-o-to{margin:0 0 18px;font-size:12px;color:var(--muted)}
.bq-opener .bq-o-to b{display:block;font-family:var(--font-title);font-weight:600;font-size:20px;color:var(--ink)}
.bq-opener .btn{border-radius:2px;letter-spacing:.14em;text-transform:uppercase;font-size:12px}
`,
};
