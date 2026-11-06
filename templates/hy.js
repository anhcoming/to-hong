// Mẫu "Song Hỷ" — truyền thống, đỏ son & vàng kim, chữ Hỷ.
const { esc } = require('../lib/util');

const base = {
  '--font-title': "'Fraunces',Georgia,serif",
  '--font-script': "'Charm',cursive",
  '--font-body': "'Hanken Grotesk',system-ui,sans-serif",
};

module.exports = {
  id: 'hy',
  name: 'Song Hỷ',
  desc: 'Truyền thống đỏ son – vàng kim, có chữ Hỷ và phong bì mở thiệp',
  fonts: 'https://fonts.googleapis.com/css2?family=Charm:wght@400;700&family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Hanken+Grotesk:wght@300..700&display=swap',
  palettes: [
    { id: 'do-son', name: 'Đỏ son', swatch: ['#9e1b23', '#d9a441'], vars: { ...base, '--page': '#5c0f14', '--hero-bg': '#9e1b23', '--hero-ink': '#fff3dd', '--bg': '#fff8ef', '--paper': '#ffffff', '--ink': '#3a1d1d', '--muted': '#86605a', '--accent': '#9e1b23', '--accent-ink': '#fff3dd', '--gold': '#d9a441', '--line': '#efd9c2' } },
    { id: 'hong-dao', name: 'Hồng đào', swatch: ['#c2415d', '#e2b65c'], vars: { ...base, '--page': '#7a2236', '--hero-bg': '#c2415d', '--hero-ink': '#fff5ea', '--bg': '#fff6f4', '--paper': '#ffffff', '--ink': '#41212a', '--muted': '#8d6670', '--accent': '#b23552', '--accent-ink': '#fff5ea', '--gold': '#e2b65c', '--line': '#f3d6d9' } },
    { id: 'ngoc-bich', name: 'Ngọc bích', swatch: ['#13584f', '#d6ad5a'], vars: { ...base, '--page': '#0b3530', '--hero-bg': '#13584f', '--hero-ink': '#fbf3e1', '--bg': '#f8f5ec', '--paper': '#ffffff', '--ink': '#1f2f2c', '--muted': '#5f716c', '--accent': '#13584f', '--accent-ink': '#fbf3e1', '--gold': '#d6ad5a', '--line': '#e3dcc6' } },
  ],

  title(text, sub) {
    return `<div class="hy-title"><span class="hy-orn" aria-hidden="true"><i></i>囍<i></i></span><h2 class="sec-title">${esc(text)}</h2>${sub ? `<p class="sec-sub">${esc(sub)}</p>` : ''}</div>`;
  },

  opener(ctx) {
    return `
<div class="opener hy-opener" id="opener">
  <div class="env">
    <div class="env-flap"></div>
    <button class="env-seal" id="openBtn" aria-label="Mở thiệp">囍</button>
    <div class="env-body">
      <p class="env-kicker">Thiệp mời cưới</p>
      <p class="env-names">${esc(ctx.g)} <span>&amp;</span> ${esc(ctx.b)}</p>
      ${ctx.guest ? `<p class="env-to">Kính gửi</p><p class="env-guest">${esc(ctx.guest.name)}</p>` : ''}
      <p class="env-hint">Chạm để mở thiệp</p>
    </div>
  </div>
</div>`;
  },

  cover(ctx) {
    const p = ctx.dparts;
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="hy-cover">
  <div class="hy-frame">
    <i class="cn tl"></i><i class="cn tr"></i><i class="cn bl"></i><i class="cn br"></i>
    <div class="hy-char" aria-hidden="true">囍</div>
    <p class="hy-kicker">Lễ Thành Hôn</p>
    <h1 class="hy-names"><span>${esc(ctx.g)}</span><em>&amp;</em><span>${esc(ctx.b)}</span></h1>
    <div class="hy-photo${photo ? '' : ' empty'}"${photo ? ` style="background-image:url('${esc(photo)}')"` : ''}>${photo ? '' : '<span>囍</span>'}</div>
    ${p ? `
    <div class="hy-date">
      <span>${esc(ctx.weekday)}</span>
      <b>${p.d}</b>
      <span>Tháng ${+p.m} · ${p.y}</span>
    </div>
    ${ctx.timeText ? `<p class="hy-time">Vào lúc ${esc(ctx.timeText)}</p>` : ''}
    <p class="hy-lunar">${esc(ctx.lunar)}</p>` : ''}
  </div>
  <a class="hy-down" href="#main-start" aria-label="Xem tiếp">⌄</a>
</header>
<span id="main-start"></span>`;
  },

  css: `
.tpl-hy .hy-cover{position:relative;padding:14px;background:
  radial-gradient(circle at 15% 8%,rgba(255,220,150,.18),transparent 38%),
  radial-gradient(circle at 90% 95%,rgba(255,220,150,.14),transparent 40%),
  repeating-linear-gradient(45deg,rgba(255,255,255,.035) 0 2px,transparent 2px 16px),var(--hero-bg);color:var(--hero-ink)}
.tpl-hy .hy-frame{position:relative;min-height:calc(100svh - 28px);border:1.5px solid var(--gold);outline:1px solid color-mix(in srgb,var(--gold) 60%,transparent);outline-offset:-9px;padding:44px 20px 56px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.tpl-hy .cn{position:absolute;width:34px;height:34px;border:2px solid var(--gold)}
.tpl-hy .cn.tl{top:-6px;left:-6px;border-right:0;border-bottom:0}
.tpl-hy .cn.tr{top:-6px;right:-6px;border-left:0;border-bottom:0}
.tpl-hy .cn.bl{bottom:-6px;left:-6px;border-right:0;border-top:0}
.tpl-hy .cn.br{bottom:-6px;right:-6px;border-left:0;border-top:0}
.tpl-hy .hy-char{font-family:"Noto Serif SC","Songti SC","SimSun","Microsoft YaHei",serif;font-size:58px;line-height:1;color:var(--gold);text-shadow:0 2px 12px rgba(0,0,0,.2)}
.tpl-hy .hy-kicker{margin:14px 0 6px;font-size:12px;letter-spacing:.38em;text-transform:uppercase;color:var(--gold)}
.tpl-hy .hy-names{margin:0;font-family:var(--font-script);font-weight:700;font-size:50px;line-height:1.08}
.tpl-hy .hy-names span{display:block}
.tpl-hy .hy-names em{display:block;font-style:normal;font-size:30px;color:var(--gold);margin:2px 0}
.tpl-hy .hy-photo{width:190px;height:190px;margin:26px auto;border-radius:50%;background:center/cover no-repeat;border:3px solid var(--gold);box-shadow:0 0 0 7px color-mix(in srgb,var(--gold) 22%,transparent),0 14px 30px rgba(0,0,0,.25)}
.tpl-hy .hy-photo.empty{display:grid;place-items:center;background:color-mix(in srgb,var(--hero-ink) 10%,transparent)}
.tpl-hy .hy-photo.empty span{font-size:70px;color:var(--gold);font-family:"Noto Serif SC","SimSun",serif}
.tpl-hy .hy-date{display:flex;align-items:center;gap:14px;font-family:var(--font-title)}
.tpl-hy .hy-date span{padding:6px 0;border-top:1px solid var(--gold);border-bottom:1px solid var(--gold);font-size:13px;letter-spacing:.12em;text-transform:uppercase;min-width:96px}
.tpl-hy .hy-date b{font-size:56px;font-weight:500;line-height:1;color:var(--gold)}
.tpl-hy .hy-time{margin:12px 0 0;font-size:15px}
.tpl-hy .hy-lunar{margin:4px 0 0;font-size:13px;font-style:italic;opacity:.85}
.tpl-hy .hy-down{position:absolute;left:50%;bottom:26px;transform:translateX(-50%);color:var(--gold);text-decoration:none;font-size:28px;animation:bob 1.8s ease-in-out infinite}
@keyframes bob{50%{transform:translate(-50%,6px)}}
.tpl-hy .hy-title{margin-bottom:24px}
.tpl-hy .hy-title .sec-title{margin-bottom:0}
.tpl-hy .hy-title .sec-sub{margin:6px 0 0}
.tpl-hy .hy-orn{display:flex;align-items:center;justify-content:center;gap:10px;color:var(--gold);font-family:"Noto Serif SC","SimSun",serif;font-size:18px;margin-bottom:8px}
.tpl-hy .hy-orn i{width:44px;height:1px;background:var(--gold)}
.tpl-hy .s-invite{background:var(--bg)}
.tpl-hy .s-countdown{background:var(--hero-bg);color:var(--hero-ink)}
.tpl-hy .s-countdown .sec-title{color:var(--hero-ink)}
.tpl-hy .s-countdown .sec-sub{color:var(--gold)}
.tpl-hy .s-countdown .cd-cell{background:transparent;border-color:var(--gold)}
.tpl-hy .s-countdown .cd-cell b{color:var(--hero-ink)}
.tpl-hy .s-countdown .cd-cell span{color:var(--gold)}
.tpl-hy .s-thanks{background:var(--hero-bg);color:var(--hero-ink)}
.tpl-hy .s-thanks .thanks-big{color:var(--gold)}
.tpl-hy .s-thanks p,.tpl-hy .s-thanks .thanks-names{color:var(--hero-ink)!important}
.tpl-hy .credit{background:var(--hero-bg);color:var(--hero-ink);opacity:1}
.tpl-hy .credit .wm{background:transparent;border-color:var(--gold);color:var(--hero-ink)}

.hy-opener{background:radial-gradient(circle at 50% 30%,color-mix(in srgb,var(--hero-bg) 85%,#fff),var(--page))}
.hy-opener .env{position:relative;width:min(340px,86vw);aspect-ratio:3/4;background:var(--hero-bg);border-radius:10px;box-shadow:0 30px 60px rgba(0,0,0,.4);overflow:hidden;border:1px solid var(--gold)}
.hy-opener .env-flap{position:absolute;inset:0 0 auto;height:38%;background:color-mix(in srgb,var(--hero-bg) 82%,#000);clip-path:polygon(0 0,100% 0,50% 100%)}
.hy-opener .env-body{position:absolute;inset:calc(38% + 48px) 0 0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 18px 20px;text-align:center;color:var(--hero-ink)}
.hy-opener .env-kicker{margin:0;font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--gold)}
.hy-opener .env-names{margin:4px 0 10px;font-family:var(--font-script);font-size:28px;line-height:1.15}
.hy-opener .env-names span{color:var(--gold)}
.hy-opener .env-to{margin:0;font-size:12px;opacity:.8}
.hy-opener .env-guest{margin:0 0 6px;font-family:var(--font-title);font-size:19px;color:var(--gold)}
.hy-opener .env-seal{position:absolute;top:38%;left:50%;transform:translate(-50%,-50%);width:76px;height:76px;border-radius:50%;border:2px solid #f6dc9c;background:radial-gradient(circle at 35% 30%,#f3cf7a,var(--gold) 60%,#a77a2a);color:var(--hero-bg);font-size:36px;font-family:"Noto Serif SC","SimSun",serif;box-shadow:0 6px 18px rgba(0,0,0,.35);animation:pulse 1.8s ease-in-out infinite}
@keyframes pulse{50%{transform:translate(-50%,-50%) scale(1.07)}}
.hy-opener .env-hint{margin:6px 0 0;font-size:12px;opacity:.75}
`,
};
