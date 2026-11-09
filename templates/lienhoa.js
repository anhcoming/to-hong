// Mẫu "Liên Hoa" — sen hồng nở trên mặt hồ gợn sóng, lá sen tròn ôm tên đôi uyên ương.
const { esc } = require('../lib/util');
const orn = require('./_orn');

const base = {
  '--font-title': "'Lora',Georgia,serif",
  '--font-script': "'Dancing Script',cursive",
  '--font-body': "'Hanken Grotesk',system-ui,sans-serif",
};
const pal = (id, name, flower, leaf, bg, extra = {}) => ({
  id, name, swatch: [flower, leaf],
  vars: { ...base, '--page': `color-mix(in srgb,${bg} 70%,${leaf})`, '--flower': flower, '--leaf': leaf, '--bg': bg, '--paper': '#ffffff', '--ink': '#2c3430', '--muted': '#76807b', '--accent': `color-mix(in srgb,${leaf} 80%,#000)`, '--accent-ink': '#ffffff', '--gold': '#c4a76a', '--water': `color-mix(in srgb,${leaf} 18%,${bg})`, '--line': `color-mix(in srgb,${leaf} 22%,${bg})`, ...extra },
});

// lá sen nhìn từ trên: hình tròn khuyết một múi, gân lá toả từ tâm
const pad = (cls) => orn.svg(cls, '0 0 100 100', `<path d="M50 50L58 4A46 46 0 1 1 42 4Z" fill="var(--leaf)" opacity=".85"/>${[30, 75, 120, 165, 210, 255, 300, 345].map((a) => `<path d="M50 50L${orn.f(50 + 42 * Math.sin(orn.rad(a)))} ${orn.f(50 - 42 * Math.cos(orn.rad(a)))}" stroke="#fff" stroke-width=".6" opacity=".18"/>`).join('')}<circle cx="50" cy="50" r="30" fill="#fff" opacity=".07"/><circle cx="50" cy="50" r="3" fill="#fff" opacity=".25"/>`);
const ripples = (cls) => orn.svg(cls, '0 0 300 60', [0, 1, 2, 3].map((i) => `<ellipse cx="150" cy="30" rx="${40 + i * 34}" ry="${8 + i * 6}" fill="none" stroke="var(--leaf)" stroke-width="1" opacity="${(0.5 - i * 0.1).toFixed(2)}"/>`).join(''), ' preserveAspectRatio="xMidYMid meet"');

module.exports = {
  id: 'lienhoa',
  name: 'Liên Hoa',
  group: 'hoa',
  desc: 'Sen hồng nở trên mặt hồ, lá sen ôm tên đôi uyên ương — thanh khiết, đậm chất Việt',
  fonts: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;700&family=Lora:ital,wght@0,400..600;1,400..600&family=Hanken+Grotesk:wght@300..700&display=swap',
  palettes: [
    pal('xanh', 'Xanh hồ', '#e894ad', '#4f8a72', '#f3f7f3'),
    pal('hong', 'Hồng sen', '#d9668b', '#6c8f6e', '#fcf3f4'),
    pal('trang', 'Bạch liên', '#f1e3d0', '#5a7d6d', '#f6f6f1', { '--flower': '#f4e6d4' }),
  ],

  title(text, sub) {
    return `<div class="lh-title">${orn.lotus('lh-tlotus', { fill: 'var(--flower)', deep: 'var(--flower)' })}<h2 class="sec-title">${esc(text)}</h2>${sub ? `<p class="lh-sub">${esc(sub)}</p>` : ''}</div>`;
  },

  opener(ctx) {
    return `
<div class="opener lh-opener" id="opener">
  <div class="lh-o">
    <div class="lh-o-pad">${pad('')}<div><p class="lh-o-k">Thiệp hồng</p><p class="lh-o-names">${esc(ctx.g)}<em>&amp;</em>${esc(ctx.b)}</p></div></div>
    ${orn.lotus('lh-o-lotus', { fill: 'var(--flower)', deep: 'var(--flower)' })}
    ${ctx.guest ? `<p class="lh-o-to">Kính mời<b>${esc(ctx.guest.name)}</b></p>` : ''}
    <button class="btn" id="openBtn">Mở thiệp</button>
  </div>
</div>`;
  },

  cover(ctx) {
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="lh-cover">
  <p class="lh-k">Lễ Thành Hôn</p>
  <div class="lh-pic">
    <div class="lh-photo"${photo ? ` style="background-image:url('${esc(photo)}')"` : ''}></div>
    ${orn.lotus('lh-lotus', { fill: 'var(--flower)', deep: 'var(--flower)' })}
  </div>
  <div class="lh-pad">
    ${pad('')}
    <h1 class="lh-names"><span>${esc(ctx.g)}</span><em>&amp;</em><span>${esc(ctx.b)}</span></h1>
  </div>
  ${ctx.dateBlock('line')}
  <div class="lh-pond">${ripples('lh-rip')}${pad('lh-mini a')}${pad('lh-mini b')}</div>
</header>`;
  },

  css: `
.tpl-lienhoa .lh-cover{position:relative;min-height:100svh;padding:36px 20px 110px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;background:linear-gradient(180deg,var(--bg) 55%,var(--water))}
.tpl-lienhoa .lh-k{margin:0 0 16px;font-family:var(--font-title);font-size:12px;letter-spacing:.4em;text-transform:uppercase;color:var(--muted)}
.tpl-lienhoa .lh-pic{position:relative}
.tpl-lienhoa .lh-photo{width:min(230px,62vw);aspect-ratio:3/4;border-radius:50%;background:var(--line) center/cover no-repeat;box-shadow:0 0 0 5px var(--paper),0 0 0 6px var(--gold),0 20px 40px rgba(30,60,50,.18)}
.tpl-lienhoa .lh-lotus{position:absolute;left:50%;bottom:-36px;width:130px;transform:translateX(-50%);filter:drop-shadow(0 6px 10px rgba(0,0,0,.12))}
.tpl-lienhoa .lh-pad{position:relative;width:min(300px,82vw);margin-top:30px;display:grid;place-items:center}
.tpl-lienhoa .lh-pad>svg{position:absolute;inset:0;width:100%;height:100%;opacity:.18}
.tpl-lienhoa .lh-names{position:relative;margin:0;padding:40px 0;font-family:var(--font-script);font-weight:700;font-size:44px;line-height:1.05;color:var(--accent)}
.tpl-lienhoa .lh-names span{display:block}
.tpl-lienhoa .lh-names em{display:block;font-style:normal;font-weight:500;font-size:26px;color:var(--flower);filter:brightness(.85)}
.tpl-lienhoa .lh-pond{position:absolute;left:0;right:0;bottom:0;height:100px}
.tpl-lienhoa .lh-rip{position:absolute;left:50%;bottom:10px;width:420px;transform:translateX(-50%)}
.tpl-lienhoa .lh-mini{position:absolute;width:64px}
.tpl-lienhoa .lh-mini.a{left:8%;bottom:20px;transform:rotate(30deg) scaleY(.5)}
.tpl-lienhoa .lh-mini.b{right:6%;bottom:44px;width:46px;transform:rotate(-70deg) scaleY(.5)}
.tpl-lienhoa .lh-title{margin-bottom:24px}
.tpl-lienhoa .lh-tlotus{display:block;width:56px;margin:0 auto 4px}
.tpl-lienhoa .lh-title .sec-title{margin:0;font-weight:500;font-size:28px;color:var(--accent)}
.tpl-lienhoa .lh-sub{margin:4px 0 0;font-family:var(--font-script);font-size:20px;color:var(--muted)}
.tpl-lienhoa .guest-name{font-family:var(--font-script);font-weight:700;font-size:38px}
.tpl-lienhoa .btn{border-radius:999px}
.tpl-lienhoa .ph{border-radius:50%;aspect-ratio:3/4}
.tpl-lienhoa .s-cal,.tpl-lienhoa .s-thanks{background:var(--water);--cal-hi:var(--gold)}
.tpl-lienhoa .thanks-big{font-family:var(--font-script);font-weight:700;font-size:50px;color:var(--accent)}

.lh-opener{background:linear-gradient(180deg,var(--bg),var(--water))}
.lh-opener .lh-o{text-align:center;color:var(--ink);width:min(320px,86vw)}
.lh-opener .lh-o-pad{position:relative;width:240px;height:240px;margin:0 auto;display:grid;place-items:center}
.lh-opener .lh-o-pad>svg{position:absolute;inset:0;width:100%;height:100%;filter:drop-shadow(0 18px 24px rgba(30,60,50,.25))}
.lh-opener .lh-o-pad div{position:relative;color:#fff}
.lh-opener .lh-o-k{margin:0;font-size:11px;letter-spacing:.34em;text-transform:uppercase;opacity:.9}
.lh-opener .lh-o-names{margin:2px 0 0;font-family:var(--font-script);font-weight:700;font-size:34px;line-height:1.05}
.lh-opener .lh-o-names em{display:block;font-style:normal;font-size:22px;color:var(--flower)}
.lh-opener .lh-o-lotus{display:block;width:120px;margin:-46px auto 0;position:relative}
.lh-opener .lh-o-to{margin:12px 0 16px;font-size:12px;color:var(--muted)}
.lh-opener .lh-o-to b{display:block;font-family:var(--font-title);font-size:20px;font-weight:500;color:var(--ink)}
`,
};
