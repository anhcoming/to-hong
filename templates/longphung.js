// Mẫu "Long Phụng" — cổ điển, rồng phượng chầu chữ Hỷ, nền vân mây, cửa son mở thiệp.
const { esc } = require('../lib/util');
const orn = require('./_orn');

const base = {
  '--font-title': "'Noto Serif Display','Noto Serif',Georgia,serif",
  '--font-script': "'Charm',cursive",
  '--font-body': "'Hanken Grotesk',system-ui,sans-serif",
};
const pal = (id, name, hero, gold, bg, extra = {}) => ({
  id, name, swatch: [hero, gold],
  vars: { ...base, '--page': `color-mix(in srgb,${hero} 60%,#000)`, '--hero': hero, '--hero-ink': '#fff4dc', '--bg': bg, '--paper': '#ffffff', '--ink': '#33201c', '--muted': '#85665c', '--accent': hero, '--accent-ink': '#fff4dc', '--gold': gold, '--line': `color-mix(in srgb,${gold} 30%,${bg})`, ...extra },
});

const HY = '<span class="lp-hy" aria-hidden="true">囍</span>';

module.exports = {
  id: 'longphung',
  name: 'Long Phụng',
  group: 'truyenthong',
  desc: 'Rồng phượng chầu chữ Hỷ, nền vân mây, cửa son mở thiệp — cổ điển trang trọng',
  fonts: 'https://fonts.googleapis.com/css2?family=Charm:wght@400;700&family=Noto+Serif+Display:ital,wght@0,400..700;1,400..600&family=Hanken+Grotesk:wght@300..700&display=swap',
  palettes: [
    pal('do', 'Đỏ son', '#9b1520', '#e2b35a', '#fff8ee'),
    pal('xanh', 'Xanh ngọc', '#0f4a3c', '#d9b464', '#f6f4ea'),
    pal('lam', 'Lam ngọc', '#16306b', '#d6b46a', '#f4f4f0'),
    pal('huyen', 'Huyền kim', '#17130f', '#d4ae62', '#f8f4ea', { '--ink': '#241c14', '--muted': '#7a6a55' }),
  ],

  title(text, sub) {
    return `<div class="lp-title">${orn.cloud('lp-tcloud')}<h2 class="sec-title">${esc(text)}</h2>${sub ? `<p class="lp-sub">${esc(sub)}</p>` : ''}</div>`;
  },

  opener(ctx) {
    return `
<div class="opener lp-opener" id="opener">
  <div class="lp-doors">
    <div class="lp-door l"><i class="lp-ring"></i></div>
    <div class="lp-door r"><i class="lp-ring"></i></div>
    <button class="lp-seal" id="openBtn" aria-label="Mở thiệp">囍</button>
  </div>
  <div class="lp-o-text">
    <p class="lp-o-k">Thiệp mời cưới</p>
    <p class="lp-o-names">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
    ${ctx.guest ? `<p class="lp-o-to">Kính gửi <b>${esc(ctx.guest.name)}</b></p>` : ''}
    <p class="lp-o-hint">Chạm dấu Hỷ để mở cửa</p>
  </div>
</div>`;
  },

  cover(ctx) {
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="lp-cover">
  <div class="lp-frame">
    ${orn.corner('lp-cn tl')}${orn.corner('lp-cn tr')}${orn.corner('lp-cn bl')}${orn.corner('lp-cn br')}
    <p class="lp-k">Lễ Thành Hôn</p>
    <div class="lp-crest">
      ${orn.dragon('lp-dragon')}
      <div class="lp-medal">${HY}</div>
      ${orn.phoenix('lp-phoenix')}
    </div>
    <h1 class="lp-names"><span>${esc(ctx.g)}</span><em>&amp;</em><span>${esc(ctx.b)}</span></h1>
    ${photo ? `<div class="lp-photo" style="background-image:url('${esc(photo)}')"></div>` : ''}
    ${ctx.dateBlock('bloc')}
    ${orn.waves('lp-waves')}
  </div>
</header>`;
  },

  css: `
.tpl-longphung{--clouds:radial-gradient(circle at 20% 30%,rgba(255,220,150,.045) 0 18px,transparent 19px),radial-gradient(circle at 70% 70%,rgba(255,220,150,.04) 0 26px,transparent 27px)}
.tpl-longphung .lp-cover{background:var(--clouds),radial-gradient(circle at 50% 20%,color-mix(in srgb,var(--hero) 80%,#fff 12%),var(--hero) 65%);background-size:120px 120px,160px 160px,auto;color:var(--hero-ink);padding:14px}
.tpl-longphung .lp-frame{position:relative;min-height:calc(100svh - 28px);padding:40px 16px 70px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid color-mix(in srgb,var(--gold) 70%,transparent);overflow:hidden}
.tpl-longphung .lp-cn{position:absolute;width:64px;height:64px}
.tpl-longphung .lp-cn.tl{top:6px;left:6px}
.tpl-longphung .lp-cn.tr{top:6px;right:6px;transform:scaleX(-1)}
.tpl-longphung .lp-cn.bl{bottom:6px;left:6px;transform:scaleY(-1)}
.tpl-longphung .lp-cn.br{bottom:6px;right:6px;transform:scale(-1)}
.tpl-longphung .lp-k{margin:0 0 6px;font-size:12px;letter-spacing:.42em;text-transform:uppercase;color:var(--gold)}
.tpl-longphung .lp-crest{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;width:calc(100% + 16px);max-width:380px;gap:0}
.tpl-longphung .lp-dragon,.tpl-longphung .lp-phoenix{width:100%;height:auto;filter:drop-shadow(0 2px 6px rgba(0,0,0,.25))}
.tpl-longphung .lp-medal{width:84px;height:84px;border-radius:50%;display:grid;place-items:center;border:2px solid var(--gold);box-shadow:0 0 0 5px color-mix(in srgb,var(--gold) 25%,transparent),inset 0 0 0 4px var(--hero),inset 0 0 0 5px var(--gold)}
.tpl-longphung .lp-hy{font-family:"Noto Serif SC","SimSun","Microsoft YaHei",serif;font-size:44px;line-height:1;color:var(--gold)}
.tpl-longphung .lp-names{margin:18px 0 0;font-family:var(--font-title);font-weight:500;font-size:34px;line-height:1.15;letter-spacing:.08em;text-transform:uppercase}
.tpl-longphung .lp-names span{display:block}
.tpl-longphung .lp-names em{display:block;font-family:var(--font-script);font-style:normal;text-transform:none;font-size:30px;color:var(--gold);letter-spacing:0}
.tpl-longphung .lp-photo{width:180px;height:180px;margin:22px auto 4px;border-radius:50%;background:center/cover no-repeat;border:3px solid var(--gold);box-shadow:0 0 0 6px var(--hero),0 0 0 7px var(--gold),0 16px 30px rgba(0,0,0,.3)}
.tpl-longphung .lp-waves{position:absolute;left:0;right:0;bottom:0;width:100%;height:36px;opacity:.7}
.tpl-longphung .lp-title{margin-bottom:24px}
.tpl-longphung .lp-tcloud{display:block;width:54px;margin:0 auto 6px}
.tpl-longphung .lp-title .sec-title{margin:0;letter-spacing:.06em;text-transform:uppercase;font-size:26px}
.tpl-longphung .lp-sub{margin:6px 0 0;font-family:var(--font-script);font-size:20px;color:var(--gold)}
.tpl-longphung .guest-name{font-family:var(--font-script);font-size:38px}
.tpl-longphung .btn{border-radius:4px}
.tpl-longphung .ph{border-radius:4px;border:2px solid var(--gold)}
.tpl-longphung .s-cal,.tpl-longphung .s-thanks,.tpl-longphung .credit{background:var(--clouds),var(--hero);background-size:120px 120px,160px 160px,auto;color:var(--hero-ink);opacity:1;--cal-hi:var(--gold)}
.tpl-longphung .s-cal .sec-title,.tpl-longphung .s-thanks .thanks-big{color:var(--gold)}
.tpl-longphung .thanks-big{font-family:var(--font-script);font-size:50px}
.tpl-longphung .s-thanks p,.tpl-longphung .s-thanks .thanks-names{color:var(--hero-ink)!important}
.tpl-longphung .credit .wm{background:transparent;border-color:var(--gold);color:var(--hero-ink)}

.lp-opener{display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 35%,color-mix(in srgb,var(--hero) 70%,#000),var(--page))}
.lp-opener .lp-doors{position:relative;display:flex;width:min(300px,80vw);aspect-ratio:3/4;box-shadow:0 30px 60px rgba(0,0,0,.45);border:3px solid var(--gold);border-radius:150px 150px 4px 4px;overflow:hidden}
.lp-opener .lp-door{flex:1;position:relative;background:linear-gradient(90deg,rgba(0,0,0,.12),transparent 30%,transparent 70%,rgba(0,0,0,.12)),var(--hero);border:1px solid color-mix(in srgb,var(--gold) 60%,transparent)}
.lp-opener .lp-door::before,.lp-opener .lp-door::after{content:"";position:absolute;left:14px;right:14px;border:1px solid color-mix(in srgb,var(--gold) 75%,transparent);box-shadow:inset 0 0 0 4px var(--hero),inset 0 0 0 5px color-mix(in srgb,var(--gold) 40%,transparent)}
.lp-opener .lp-door::before{top:60px;height:38%}
.lp-opener .lp-door::after{bottom:16px;height:26%}
.lp-opener .lp-ring{position:absolute;top:calc(60px + 38% + 12px);width:16px;height:16px;border-radius:50%;border:2px solid var(--gold)}
.lp-opener .lp-door.l .lp-ring{right:16px}.lp-opener .lp-door.r .lp-ring{left:16px}
.lp-opener .lp-seal{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:78px;height:78px;border-radius:50%;border:2px solid #f6dc9c;background:radial-gradient(circle at 35% 30%,#f3cf7a,var(--gold) 60%,#a77a2a);color:var(--hero);font-size:38px;font-family:"Noto Serif SC","SimSun",serif;box-shadow:0 6px 18px rgba(0,0,0,.4);cursor:pointer;animation:lpPulse 1.8s ease-in-out infinite}
@keyframes lpPulse{50%{transform:translate(-50%,-50%) scale(1.07)}}
.lp-opener .lp-o-text{text-align:center;color:var(--hero-ink);margin-top:22px}
.lp-opener .lp-o-k{margin:0;font-size:11px;letter-spacing:.38em;text-transform:uppercase;color:var(--gold)}
.lp-opener .lp-o-names{margin:4px 0;font-family:var(--font-script);font-size:30px}
.lp-opener .lp-o-to{margin:0;font-size:14px}.lp-opener .lp-o-to b{color:var(--gold);font-family:var(--font-title);font-weight:500}
.lp-opener .lp-o-hint{margin:6px 0 0;font-size:12px;opacity:.7}
`,
};
