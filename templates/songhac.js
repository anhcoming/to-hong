// Mẫu "Song Hạc" — đôi hạc bay quanh vầng trăng (ảnh cưới nằm trong trăng), sóng nước kẻ vàng.
const { esc } = require('../lib/util');
const orn = require('./_orn');

const base = {
  '--font-title': "'Cormorant Garamond',Georgia,serif",
  '--font-script': "'Charm',cursive",
  '--font-body': "'Hanken Grotesk',system-ui,sans-serif",
};
const pal = (id, name, hero, gold, bg, extra = {}) => ({
  id, name, swatch: [hero, gold],
  vars: { ...base, '--page': `color-mix(in srgb,${hero} 55%,#000)`, '--hero': hero, '--hero-ink': '#fbf3e3', '--bg': bg, '--paper': '#ffffff', '--ink': '#2b2320', '--muted': '#80736a', '--accent': hero, '--accent-ink': '#fbf3e3', '--gold': gold, '--moon': '#f6e7c4', '--line': `color-mix(in srgb,${gold} 28%,${bg})`, ...extra },
});

const cranes = () => `${orn.crane('sh-crane a', { body: '#fffaf0', ink: '#1e1b1a', line: 'var(--gold)' })}${orn.crane('sh-crane b', { body: '#fffaf0', ink: '#1e1b1a', line: 'var(--gold)' })}`;

module.exports = {
  id: 'songhac',
  name: 'Song Hạc',
  group: 'truyenthong',
  desc: 'Đôi hạc bay quanh vầng trăng ôm ảnh cưới, sóng nước kẻ vàng — thanh cao, ý nghĩa bền lâu',
  fonts: 'https://fonts.googleapis.com/css2?family=Charm:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Hanken+Grotesk:wght@300..700&display=swap',
  palettes: [
    pal('do', 'Đỏ trầm', '#7e1420', '#e0b65e', '#fbf6ee'),
    pal('lam', 'Lam đêm', '#13284a', '#d8b56c', '#f4f3ef'),
    pal('ngoc', 'Ngọc lục', '#0e4440', '#d9b86a', '#f3f4ee'),
  ],

  title(text, sub) {
    return `<div class="sh-title"><h2 class="sec-title">${esc(text)}</h2>${sub ? `<p class="sh-sub">${esc(sub)}</p>` : ''}${orn.waves('sh-twave', { rows: 2 })}</div>`;
  },

  opener(ctx) {
    return `
<div class="opener sh-opener" id="opener">
  <div class="sh-o">
    <div class="sh-o-moon">${cranes()}<span>囍</span></div>
    <p class="sh-o-k">Thiệp mời cưới</p>
    <p class="sh-o-names">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
    ${ctx.guest ? `<p class="sh-o-to">Kính gửi<b>${esc(ctx.guest.name)}</b></p>` : ''}
    <button class="btn" id="openBtn">Mở thiệp</button>
  </div>
</div>`;
  },

  cover(ctx) {
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="sh-cover">
  <p class="sh-vert" aria-hidden="true">Trăm năm hảo hợp</p>
  <p class="sh-k">Lễ Thành Hôn</p>
  <div class="sh-moon${photo ? '' : ' empty'}">
    <div class="sh-disc"${photo ? ` style="background-image:url('${esc(photo)}')"` : ''}>${photo ? '' : '<span>囍</span>'}</div>
    ${cranes()}
  </div>
  <h1 class="sh-names"><span>${esc(ctx.g)}</span><em>&amp;</em><span>${esc(ctx.b)}</span></h1>
  ${ctx.dateBlock('line')}
  ${orn.waves('sh-waves', { rows: 4 })}
</header>`;
  },

  css: `
.tpl-songhac .sh-cover{position:relative;min-height:100svh;padding:44px 20px 110px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;color:var(--hero-ink);background:radial-gradient(circle at 50% 38%,color-mix(in srgb,var(--hero) 70%,#fff 14%),var(--hero) 62%)}
.tpl-songhac .sh-vert{position:absolute;left:14px;top:50%;margin:0;transform:translateY(-50%);writing-mode:vertical-rl;font-family:var(--font-script);font-size:18px;letter-spacing:.2em;color:var(--gold);opacity:.8}
.tpl-songhac .sh-k{margin:0 0 20px;font-family:var(--font-title);font-size:13px;letter-spacing:.42em;text-transform:uppercase;color:var(--gold)}
.tpl-songhac .sh-moon{position:relative;width:250px;height:250px}
.tpl-songhac .sh-disc{position:absolute;inset:0;border-radius:50%;background:var(--moon) center/cover no-repeat;box-shadow:0 0 0 3px var(--gold),0 0 0 10px color-mix(in srgb,var(--gold) 20%,transparent),0 0 60px 10px color-mix(in srgb,var(--moon) 35%,transparent);display:grid;place-items:center}
.tpl-songhac .sh-moon.empty .sh-disc span{font-family:"Noto Serif SC","SimSun",serif;font-size:90px;color:var(--hero)}
.sh-crane{position:absolute;width:150px;filter:drop-shadow(0 4px 8px rgba(0,0,0,.3))}
.sh-crane.a{left:-70px;top:-20px;transform:rotate(-8deg)}
.sh-crane.b{right:-70px;bottom:10px;transform:scaleX(-1) rotate(-12deg)}
.tpl-songhac .sh-names{margin:30px 0 0;font-family:var(--font-script);font-weight:400;font-size:46px;line-height:1.1}
.tpl-songhac .sh-names span{display:block}
.tpl-songhac .sh-names em{display:block;font-style:normal;font-size:30px;color:var(--gold)}
.tpl-songhac .sh-waves{position:absolute;left:0;right:0;bottom:16px;width:100%;height:60px}
.tpl-songhac .sh-title{margin-bottom:26px}
.tpl-songhac .sh-title .sec-title{margin:0;font-weight:500;font-size:34px}
.tpl-songhac .sh-sub{margin:2px 0 0;font-family:var(--font-script);font-size:20px;color:var(--gold)}
.tpl-songhac .sh-twave{display:block;width:90px;height:18px;margin:10px auto 0}
.tpl-songhac .guest-name{font-family:var(--font-script);font-size:40px}
.tpl-songhac .btn{border-radius:6px}
.tpl-songhac .ph{border-radius:50%;aspect-ratio:1}
.tpl-songhac .s-cal,.tpl-songhac .s-thanks,.tpl-songhac .credit{background:var(--hero);color:var(--hero-ink);opacity:1;--cal-hi:var(--gold)}
.tpl-songhac .s-cal .sec-title,.tpl-songhac .s-thanks .thanks-big{color:var(--hero-ink)}
.tpl-songhac .thanks-big{font-family:var(--font-script);font-size:52px}
.tpl-songhac .s-thanks p,.tpl-songhac .s-thanks .thanks-names{color:var(--hero-ink)!important}
.tpl-songhac .credit .wm{background:transparent;border-color:var(--gold);color:var(--hero-ink)}

.sh-opener{background:radial-gradient(circle at 50% 35%,color-mix(in srgb,var(--hero) 75%,#fff 12%),var(--page))}
.sh-opener .sh-o{text-align:center;color:var(--hero-ink);width:min(320px,86vw)}
.sh-opener .sh-o-moon{position:relative;width:150px;height:150px;margin:0 auto 26px;border-radius:50%;background:var(--moon);box-shadow:0 0 0 2px var(--gold),0 0 50px 8px color-mix(in srgb,var(--moon) 30%,transparent);display:grid;place-items:center}
.sh-opener .sh-o-moon span{font-family:"Noto Serif SC","SimSun",serif;font-size:60px;color:var(--hero)}
.sh-opener .sh-crane{width:100px}
.sh-opener .sh-crane.a{left:-56px;top:-24px}.sh-opener .sh-crane.b{right:-56px;bottom:-6px}
.sh-opener .sh-o-k{margin:0;font-size:11px;letter-spacing:.38em;text-transform:uppercase;color:var(--gold)}
.sh-opener .sh-o-names{margin:4px 0 12px;font-family:var(--font-script);font-size:32px}
.sh-opener .sh-o-to{margin:0 0 18px;font-size:12px;opacity:.9}
.sh-opener .sh-o-to b{display:block;font-family:var(--font-title);font-size:21px;font-weight:500;color:var(--gold)}
.sh-opener .btn{background:var(--gold);border-color:var(--gold);color:var(--hero);border-radius:6px;letter-spacing:.14em;text-transform:uppercase;font-size:12px}
`,
};
