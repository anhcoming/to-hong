// Mẫu "Cổ Phục" — giấy kem có vân, viền hồi văn, dải lụa đỏ mang tên đôi uyên ương, ảnh khung góc cắt.
const { esc } = require('../lib/util');
const orn = require('./_orn');

const base = {
  '--font-title': "'Noto Serif',Georgia,serif",
  '--font-script': "'Charm',cursive",
  '--font-body': "'Hanken Grotesk',system-ui,sans-serif",
};
const pal = (id, name, silk, gold, paper, extra = {}) => ({
  id, name, swatch: [paper, silk],
  vars: { ...base, '--page': `color-mix(in srgb,${paper} 80%,${silk})`, '--silk': silk, '--silk-ink': '#fff6e4', '--bg': paper, '--paper': `color-mix(in srgb,${paper} 60%,#fff)`, '--ink': '#3a2a22', '--muted': '#87735f', '--accent': silk, '--accent-ink': '#fff6e4', '--gold': gold, '--line': `color-mix(in srgb,${gold} 35%,${paper})`, ...extra },
});

module.exports = {
  id: 'cophuc',
  name: 'Cổ Phục',
  group: 'truyenthong',
  desc: 'Giấy kem, viền hồi văn và dải lụa mang tên đôi uyên ương — hợp ảnh áo dài, Nhật Bình',
  fonts: 'https://fonts.googleapis.com/css2?family=Charm:wght@400;700&family=Noto+Serif:ital,wght@0,400..700;1,400..600&family=Hanken+Grotesk:wght@300..700&display=swap',
  palettes: [
    pal('do', 'Đỏ giấy kem', '#a3202a', '#b98a3e', '#f3e8d2'),
    pal('lam', 'Lam cổ', '#1f4b7a', '#b08a48', '#f0ead9'),
    pal('luc', 'Lục ngọc', '#2f5d4a', '#b18b46', '#efe9d6'),
  ],

  title(text, sub) {
    return `<div class="cp-title"><span class="cp-knot" aria-hidden="true"></span><h2 class="sec-title">${esc(text)}</h2>${sub ? `<p class="cp-sub">${esc(sub)}</p>` : ''}</div>`;
  },

  opener(ctx) {
    return `
<div class="opener cp-opener" id="opener">
  <div class="cp-o">
    ${orn.meander('cp-mband', { n: 14 })}
    <p class="cp-o-k">Thiệp hồng</p>
    <div class="cp-o-silk">${esc(ctx.g)} <span>&amp;</span> ${esc(ctx.b)}</div>
    ${ctx.guest ? `<p class="cp-o-to">Kính mời<b>${esc(ctx.guest.name)}</b></p>` : '<p class="cp-o-to"></p>'}
    <button class="btn" id="openBtn">Mở thiệp</button>
    ${orn.meander('cp-mband', { n: 14 })}
  </div>
</div>`;
  },

  cover(ctx) {
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="cp-cover">
  ${orn.meander('cp-band top', { n: 20 })}
  <div class="cp-inner">
    <p class="cp-k">Trân trọng báo tin</p>
    <p class="cp-hy" aria-hidden="true">囍</p>
    ${photo ? `<div class="cp-photo"><div style="background-image:url('${esc(photo)}')"></div></div>` : ''}
    <div class="cp-silk">
      <h1 class="cp-names"><span>${esc(ctx.g)}</span><em>&amp;</em><span>${esc(ctx.b)}</span></h1>
    </div>
    ${ctx.dateBlock('bloc')}
  </div>
  ${orn.meander('cp-band bot', { n: 20 })}
</header>`;
  },

  css: `
.tpl-cophuc{--grain:repeating-radial-gradient(circle at 30% 20%,rgba(120,80,30,.035) 0 1px,transparent 1px 5px),repeating-linear-gradient(90deg,rgba(120,80,30,.02) 0 1px,transparent 1px 7px)}
.tpl-cophuc .card{background:var(--grain),var(--bg)}
.tpl-cophuc .cp-cover{position:relative;min-height:100svh;display:flex;flex-direction:column;background:var(--grain),radial-gradient(circle at 50% 30%,var(--paper),var(--bg) 75%)}
.tpl-cophuc .cp-band{display:block;width:100%;height:24px;flex:none}
.tpl-cophuc .cp-band.top{margin-top:14px}.tpl-cophuc .cp-band.bot{margin-bottom:14px}
.tpl-cophuc .cp-inner{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:26px 0;text-align:center;color:var(--ink)}
.tpl-cophuc .cp-k{margin:0;font-family:var(--font-title);font-size:12px;letter-spacing:.38em;text-transform:uppercase;color:var(--muted)}
.tpl-cophuc .cp-hy{margin:6px 0 14px;font-family:"Noto Serif SC","SimSun","Microsoft YaHei",serif;font-size:46px;line-height:1;color:var(--silk)}
.tpl-cophuc .cp-photo{width:230px;padding:6px;background:var(--paper);border:1px solid var(--gold);clip-path:polygon(18px 0,calc(100% - 18px) 0,100% 18px,100% calc(100% - 18px),calc(100% - 18px) 100%,18px 100%,0 calc(100% - 18px),0 18px)}
.tpl-cophuc .cp-photo>div{aspect-ratio:3/4;background:var(--line) center/cover no-repeat;clip-path:polygon(14px 0,calc(100% - 14px) 0,100% 14px,100% calc(100% - 14px),calc(100% - 14px) 100%,14px 100%,0 calc(100% - 14px),0 14px)}
.tpl-cophuc .cp-silk{position:relative;align-self:stretch;margin:-34px 0 0;padding:16px 24px 18px;background:linear-gradient(180deg,color-mix(in srgb,var(--silk) 85%,#fff 15%),var(--silk) 45%,color-mix(in srgb,var(--silk) 80%,#000));color:var(--silk-ink);box-shadow:0 10px 20px rgba(60,20,10,.18)}
.tpl-cophuc .cp-silk::before,.tpl-cophuc .cp-silk::after{content:"";position:absolute;left:0;right:0;height:1px;background:var(--gold)}
.tpl-cophuc .cp-silk::before{top:5px}.tpl-cophuc .cp-silk::after{bottom:5px}
.tpl-cophuc .cp-names{margin:0;font-family:var(--font-script);font-weight:700;font-size:38px;line-height:1.1;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap}
.tpl-cophuc .cp-names em{font-style:normal;font-weight:400;font-size:26px;color:color-mix(in srgb,var(--gold) 60%,#fff)}
.tpl-cophuc .cp-title{margin-bottom:24px}
.tpl-cophuc .cp-knot{display:block;width:16px;height:16px;margin:0 auto 12px;border:2px solid var(--silk);transform:rotate(45deg);box-shadow:0 0 0 4px var(--bg),0 0 0 5px var(--gold)}
.tpl-cophuc .cp-title .sec-title{margin:0;font-weight:500;font-size:26px;letter-spacing:.06em;text-transform:uppercase;color:var(--silk)}
.tpl-cophuc .cp-sub{margin:4px 0 0;font-family:var(--font-script);font-size:20px;color:var(--muted)}
.tpl-cophuc .guest-name{font-family:var(--font-script);font-size:38px;color:var(--silk)}
.tpl-cophuc .btn{border-radius:2px}
.tpl-cophuc .ph{border-radius:0;border:4px solid var(--paper);outline:1px solid var(--gold)}
.tpl-cophuc .thanks-big{font-family:var(--font-script);font-size:50px;color:var(--silk)}

.cp-opener{background:radial-gradient(circle at 50% 40%,var(--paper),var(--page))}
.cp-opener .cp-o{width:min(320px,86vw);padding:20px 0;text-align:center;color:var(--ink);background:var(--bg);border:1px solid var(--gold);box-shadow:0 26px 50px rgba(60,30,10,.2)}
.cp-opener .cp-mband{display:block;width:100%;height:20px}
.cp-opener .cp-o-k{margin:22px 0 10px;font-family:var(--font-title);font-size:12px;letter-spacing:.38em;text-transform:uppercase;color:var(--muted)}
.cp-opener .cp-o-silk{padding:14px 10px;background:var(--silk);color:var(--silk-ink);font-family:var(--font-script);font-weight:700;font-size:30px;line-height:1.2;box-shadow:inset 0 0 0 4px var(--silk),inset 0 0 0 5px var(--gold)}
.cp-opener .cp-o-silk span{font-weight:400;color:color-mix(in srgb,var(--gold) 60%,#fff)}
.cp-opener .cp-o-to{margin:16px 0 18px;font-size:12px;color:var(--muted)}
.cp-opener .cp-o-to b{display:block;font-family:var(--font-title);font-size:19px;font-weight:500;color:var(--ink)}
.cp-opener .btn{border-radius:2px;letter-spacing:.14em;text-transform:uppercase;font-size:12px;margin-bottom:22px}
`,
};
