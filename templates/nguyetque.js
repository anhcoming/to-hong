// Mẫu "Nguyệt Quế" — chữ là nhân vật chính: khung vòm viền vàng đôi, vòng nguyệt quế, tên viết tay.
const { esc } = require('../lib/util');
const orn = require('./_orn');
const wreath = (initials) => orn.wreath('nq-wreath', initials);

const base = {
  '--font-title': "'Lora',Georgia,serif",
  '--font-script': "'Great Vibes',cursive",
  '--font-body': "'Hanken Grotesk',system-ui,sans-serif",
};
const pal = (id, name, leaf, gold, bg, ink, extra = {}) => ({
  id, name, swatch: [bg, leaf],
  vars: { ...base, '--page': `color-mix(in srgb,${bg} 82%,${leaf})`, '--bg': bg, '--paper': '#fffefb', '--ink': ink, '--muted': '#857c72', '--accent': leaf, '--accent-ink': '#fffefb', '--gold': gold, '--line': `color-mix(in srgb,${gold} 30%,${bg})`, ...extra },
});

module.exports = {
  id: 'nguyetque',
  name: 'Nguyệt Quế',
  group: 'hoa',
  desc: 'Khung vòm viền vàng, vòng nguyệt quế và tên viết tay — thanh lịch, nhẹ nhàng',
  fonts: 'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Lora:ital,wght@0,400..600;1,400..600&family=Hanken+Grotesk:wght@300..700&display=swap',
  palettes: [
    pal('kem-vang', 'Kem vàng', '#7d8b5b', '#bf9b55', '#fbf7ee', '#3a3329'),
    pal('o-liu', 'Xanh ô liu', '#55663f', '#b5995d', '#f3f3ea', '#2d3326'),
    pal('hong-phan', 'Hồng phấn', '#b5707a', '#c6a165', '#fcf4f1', '#43302f'),
  ],

  title(text, sub) {
    return `<div class="nq-title"><h2 class="sec-title">${esc(text)}</h2>${sub ? `<p class="nq-sub">${esc(sub)}</p>` : ''}<span class="nq-dots" aria-hidden="true">✦</span></div>`;
  },

  opener(ctx) {
    return `
<div class="opener nq-opener" id="opener">
  <div class="nq-o">
    ${wreath(ctx.initials)}
    <p class="nq-o-k">The Wedding of</p>
    <p class="nq-o-names">${esc(ctx.g)}<em>&amp;</em>${esc(ctx.b)}</p>
    ${ctx.guest ? `<p class="nq-o-to">Trân trọng kính mời<b>${esc(ctx.guest.name)}</b></p>` : ''}
    <button class="btn" id="openBtn">Mở thiệp</button>
  </div>
</div>`;
  },

  cover(ctx) {
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="nq-cover">
  <div class="nq-frame">
    ${wreath(ctx.initials)}
    <p class="nq-k">The Wedding of</p>
    <h1 class="nq-names"><span>${esc(ctx.g)}</span><em>&amp;</em><span>${esc(ctx.b)}</span></h1>
    ${ctx.dateBlock('split')}
  </div>
  ${photo ? `<div class="nq-photo reveal" style="background-image:url('${esc(photo)}')"></div>` : ''}
</header>`;
  },

  css: `
.tpl-nguyetque .nq-cover{background:radial-gradient(circle at 50% 20%,var(--paper),var(--bg) 70%);padding:28px 18px 40px;text-align:center}
.tpl-nguyetque .nq-frame{position:relative;max-width:360px;min-height:calc(100svh - 68px);margin:0 auto;padding:40px 22px 36px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1.5px solid var(--gold);border-radius:999px 999px 8px 8px;outline:1px solid var(--gold);outline-offset:-9px}
.nq-wreath{position:relative;width:118px;height:118px;margin:0 auto 14px}
.nq-wreath svg{width:100%;height:100%;display:block}
.nq-wreath span{position:absolute;inset:0;display:grid;place-items:center;font-family:var(--font-script);font-size:28px;color:var(--ink);padding-top:4px}
.tpl-nguyetque .nq-k{margin:0;font-family:var(--font-title);font-size:12px;letter-spacing:.34em;text-transform:uppercase;color:var(--muted);position:relative}
.tpl-nguyetque .nq-names{margin:18px 0 8px;font-family:var(--font-script);font-weight:400;font-size:60px;line-height:1;color:var(--ink)}
.tpl-nguyetque .nq-names span{display:block}
.tpl-nguyetque .nq-names em{display:block;font-style:normal;font-family:var(--font-title);font-size:26px;color:var(--gold);margin:6px 0}
.tpl-nguyetque .nq-photo{max-width:320px;aspect-ratio:4/5;margin:34px auto 0;background:var(--line) center/cover no-repeat;border-radius:50%/40%;box-shadow:0 0 0 6px var(--paper),0 0 0 7px var(--gold),0 20px 40px rgba(0,0,0,.14)}
.tpl-nguyetque .nq-title{margin-bottom:26px}
.tpl-nguyetque .nq-title .sec-title{margin:0;font-family:var(--font-script);font-weight:400;font-size:44px;color:var(--ink)}
.tpl-nguyetque .nq-sub{margin:2px 0 0;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
.tpl-nguyetque .nq-dots{display:block;margin-top:8px;color:var(--gold);font-size:12px}
.tpl-nguyetque .guest-name{font-family:var(--font-script);font-size:44px;color:var(--ink)}
.tpl-nguyetque .fam-label,.tpl-nguyetque .gift-who{color:var(--accent)}
.tpl-nguyetque .btn{border-radius:999px;letter-spacing:.08em}
.tpl-nguyetque .ph{border-radius:8px}
.tpl-nguyetque .thanks-big{font-family:var(--font-script);font-size:58px;color:var(--ink)}

.nq-opener{background:radial-gradient(circle at 50% 35%,var(--paper),var(--page))}
.nq-opener .nq-o{position:relative;width:min(310px,84vw);padding:40px 24px 34px;text-align:center;color:var(--ink);background:var(--paper);border:1.5px solid var(--gold);outline:1px solid var(--gold);outline-offset:-9px;border-radius:999px 999px 8px 8px;box-shadow:0 26px 50px rgba(60,40,20,.18)}
.nq-opener .nq-o-k{margin:0 0 2px;font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--muted)}
.nq-opener .nq-o-names{margin:0 0 14px;font-family:var(--font-script);font-size:34px;line-height:1.2}
.nq-opener .nq-o-names em{display:block;font-style:normal;font-family:var(--font-title);font-size:18px;color:var(--gold);line-height:1.4}
.nq-opener .nq-o-to{margin:0 0 20px;font-size:12px;color:var(--muted)}
.nq-opener .nq-o-to b{display:block;font-family:var(--font-title);font-weight:500;font-size:19px;color:var(--ink)}
`,
};
