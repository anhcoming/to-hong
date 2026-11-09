// Mẫu "Cổng Vòm" — dải màu đậm phía trên có chữ Hỷ, ảnh cưới trong khung vòm viền vàng.
const { esc } = require('../lib/util');

const base = {
  '--font-title': "'Playfair Display',Georgia,serif",
  '--font-script': "'Dancing Script',cursive",
  '--font-body': "'Hanken Grotesk',system-ui,sans-serif",
};
const pal = (id, name, band, gold, bg, extra = {}) => ({
  id, name, swatch: [band, gold],
  vars: { ...base, '--page': `color-mix(in srgb,${band} 70%,#000)`, '--band': band, '--band-ink': '#fbf5e8', '--bg': bg, '--paper': '#ffffff', '--ink': '#2a2622', '--muted': '#7d756c', '--accent': band, '--accent-ink': '#fbf5e8', '--gold': gold, '--line': '#e8e0d0', ...extra },
});

module.exports = {
  id: 'vomcong',
  name: 'Cổng Vòm',
  group: 'truyenthong',
  desc: 'Dải màu đậm có chữ Hỷ, ảnh cưới trong khung vòm viền vàng — sang trọng',
  fonts: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;700&family=Playfair+Display:ital,wght@0,400..700;1,400..600&family=Hanken+Grotesk:wght@300..700&display=swap',
  palettes: [
    pal('luc', 'Xanh lục bảo', '#1d3b2c', '#c9a85c', '#f8f5ec'),
    pal('do', 'Đỏ nhung', '#8a1a22', '#d8b061', '#fbf5ef'),
    pal('lam', 'Lam hoàng gia', '#1c2f55', '#c8a964', '#f5f4f0'),
  ],

  title(text, sub) {
    return `<div class="vc-title"><span class="vc-mini" aria-hidden="true"></span><h2 class="sec-title">${esc(text)}</h2>${sub ? `<p class="vc-sub">${esc(sub)}</p>` : ''}</div>`;
  },

  opener(ctx) {
    return `
<div class="opener vc-opener" id="opener">
  <div class="vc-o-arch">
    <span class="vc-hy">囍</span>
    <p class="vc-o-k">Thiệp mời cưới</p>
    <p class="vc-o-names">${esc(ctx.g)}<em>&amp;</em>${esc(ctx.b)}</p>
    ${ctx.guest ? `<p class="vc-o-to">Kính gửi<b>${esc(ctx.guest.name)}</b></p>` : ''}
    <button class="btn" id="openBtn">Mở thiệp</button>
  </div>
</div>`;
  },

  cover(ctx) {
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="vc-cover">
  <div class="vc-band">
    <p class="vc-k">Trân trọng báo tin vui</p>
    <div class="vc-row">
      <div><small>Chú rể</small><b>${esc(ctx.g)}</b></div>
      <span class="vc-hy" aria-hidden="true">囍</span>
      <div><small>Cô dâu</small><b>${esc(ctx.b)}</b></div>
    </div>
    <p class="vc-script">Trăm năm hạnh phúc</p>
  </div>
  <div class="vc-arch${photo ? '' : ' empty'}"><div${photo ? ` style="background-image:url('${esc(photo)}')"` : ''}>${photo ? '' : '<span>囍</span>'}</div></div>
  ${ctx.dateBlock('split')}
</header>`;
  },

  css: `
.tpl-vomcong .vc-cover{position:relative;background:var(--bg);text-align:center;padding-bottom:48px}
.tpl-vomcong .vc-band{position:relative;background:radial-gradient(circle at 50% 0,color-mix(in srgb,var(--band) 80%,#fff 8%),var(--band) 70%);color:var(--band-ink);padding:34px 18px 120px;border-bottom-left-radius:50% 70px;border-bottom-right-radius:50% 70px}
.tpl-vomcong .vc-band::after{content:"";position:absolute;inset:8px 8px 10px;border:1px solid color-mix(in srgb,var(--gold) 55%,transparent);border-bottom-left-radius:50% 64px;border-bottom-right-radius:50% 64px;pointer-events:none}
.tpl-vomcong .vc-k{margin:0 0 16px;font-size:11px;letter-spacing:.38em;text-transform:uppercase;color:var(--gold)}
.tpl-vomcong .vc-row{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px}
.tpl-vomcong .vc-row small{display:block;font-size:10px;letter-spacing:.24em;text-transform:uppercase;opacity:.75}
.tpl-vomcong .vc-row b{display:block;font-family:var(--font-title);font-weight:500;font-size:22px;line-height:1.2;letter-spacing:.04em;text-transform:uppercase}
.tpl-vomcong .vc-hy{font-family:"Noto Serif SC","SimSun","Microsoft YaHei",serif;font-size:40px;line-height:1;color:var(--gold)}
.tpl-vomcong .vc-script{margin:14px 0 0;font-family:var(--font-script);font-size:26px;color:var(--gold)}
.tpl-vomcong .vc-arch{position:relative;z-index:1;width:min(300px,78vw);margin:-96px auto 0;padding:7px;background:var(--bg);border-radius:999px 999px 6px 6px;box-shadow:0 0 0 1.5px var(--gold),0 18px 40px rgba(0,0,0,.18)}
.tpl-vomcong .vc-arch>div{aspect-ratio:3/4;border-radius:999px 999px 2px 2px;background:var(--line) center/cover no-repeat;outline:1px solid var(--gold);outline-offset:-6px;display:grid;place-items:center}
.tpl-vomcong .vc-arch.empty span{font-family:"Noto Serif SC","SimSun",serif;font-size:80px;color:var(--gold)}
.tpl-vomcong .vc-title{margin-bottom:26px}
.tpl-vomcong .vc-title .sec-title{margin:0;font-weight:500}
.tpl-vomcong .vc-mini{display:block;width:22px;height:30px;margin:0 auto 10px;border:1.5px solid var(--gold);border-radius:999px 999px 2px 2px}
.tpl-vomcong .vc-sub{margin:6px 0 0;font-family:var(--font-script);font-size:22px;color:var(--gold)}
.tpl-vomcong .guest-name{font-family:var(--font-script);font-size:40px;color:var(--band)}
.tpl-vomcong .ph{border-radius:999px 999px 4px 4px}
.tpl-vomcong .btn{border-radius:4px}
.tpl-vomcong .s-cal,.tpl-vomcong .s-thanks{background:var(--band);color:var(--band-ink);--cal-hi:var(--gold)}
.tpl-vomcong .s-cal .sec-title,.tpl-vomcong .s-thanks .thanks-big{color:var(--band-ink)}
.tpl-vomcong .thanks-big{font-family:var(--font-script);font-size:54px}
.tpl-vomcong .s-thanks p,.tpl-vomcong .s-thanks .thanks-names{color:var(--band-ink)!important}
.tpl-vomcong .credit{background:var(--band);color:var(--band-ink);opacity:1}

.vc-opener{background:radial-gradient(circle at 50% 30%,color-mix(in srgb,var(--band) 85%,#fff 10%),var(--page))}
.vc-opener .vc-o-arch{width:min(300px,82vw);padding:56px 24px 34px;text-align:center;color:var(--band-ink);border:1.5px solid var(--gold);outline:1px solid color-mix(in srgb,var(--gold) 50%,transparent);outline-offset:-10px;border-radius:999px 999px 10px 10px;background:var(--band);box-shadow:0 30px 60px rgba(0,0,0,.35)}
.vc-opener .vc-hy{font-family:"Noto Serif SC","SimSun","Microsoft YaHei",serif;font-size:54px;line-height:1;color:var(--gold)}
.vc-opener .vc-o-k{margin:14px 0 4px;font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--gold)}
.vc-opener .vc-o-names{margin:0 0 14px;font-family:var(--font-script);font-size:32px;line-height:1.15}
.vc-opener .vc-o-names em{display:block;font-style:normal;color:var(--gold);font-size:24px}
.vc-opener .vc-o-to{margin:0 0 20px;font-size:12px;opacity:.9}
.vc-opener .vc-o-to b{display:block;font-family:var(--font-title);font-weight:500;font-size:19px;color:var(--gold)}
.vc-opener .btn{background:var(--gold);border-color:var(--gold);color:var(--band);border-radius:4px;letter-spacing:.14em;text-transform:uppercase;font-size:12px}
`,
};
