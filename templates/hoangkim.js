// Mẫu "Hoàng Kim" — nền nhung tối, khung vàng kép, hồng trắng ở góc, chữ ánh kim.
const { esc } = require('../lib/util');
const orn = require('./_orn');

const base = {
  '--font-title': "'Playfair Display',Georgia,serif",
  '--font-script': "'Great Vibes',cursive",
  '--font-body': "'Hanken Grotesk',system-ui,sans-serif",
};
const pal = (id, name, velvet, gold, extra = {}) => ({
  id, name, swatch: [velvet, gold],
  vars: { ...base, '--page': `color-mix(in srgb,${velvet} 55%,#000)`, '--velvet': velvet, '--hero-ink': '#f8efdc', '--bg': '#faf6ee', '--paper': '#ffffff', '--ink': '#2a221d', '--muted': '#867565', '--accent': velvet, '--accent-ink': '#f8efdc', '--gold': gold, '--gold-hi': `color-mix(in srgb,${gold} 45%,#fff)`, '--gold-lo': `color-mix(in srgb,${gold} 70%,#000)`, '--line': `color-mix(in srgb,${gold} 30%,#faf6ee)`, ...extra },
});

// cụm hồng trắng + lá vàng (góc trên-trái)
const roses = (cls) => orn.svg(cls, '0 0 160 160', `
<g fill="var(--gold)" opacity=".85">
  <ellipse cx="96" cy="26" rx="6" ry="18" transform="rotate(70 96 26)"/>
  <ellipse cx="122" cy="20" rx="5" ry="14" transform="rotate(80 122 20)"/>
  <ellipse cx="26" cy="96" rx="6" ry="18" transform="rotate(20 26 96)"/>
  <ellipse cx="20" cy="122" rx="5" ry="14" transform="rotate(10 20 122)"/>
  <ellipse cx="88" cy="72" rx="5" ry="15" transform="rotate(45 88 72)"/>
</g>
<path d="M50 50C90 36 120 22 150 18M50 50C36 90 22 120 18 150" fill="none" stroke="var(--gold)" stroke-width="1.2"/>
${orn.bloom(44, 44, 34, { fill: '#fffaf2', core: 'var(--gold)', layers: 3, petals: 6 })}
${orn.bloom(86, 34, 18, { fill: '#fffaf2', core: 'var(--gold)', layers: 2, petals: 5, rot: 15 })}
${orn.bloom(34, 86, 18, { fill: '#fffaf2', core: 'var(--gold)', layers: 2, petals: 5, rot: 40 })}
<g fill="var(--gold)">${[[66, 66], [110, 44], [44, 110], [138, 26], [26, 138]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4"/>`).join('')}</g>`);

module.exports = {
  id: 'hoangkim',
  name: 'Hoàng Kim',
  group: 'hoanggia',
  desc: 'Nền nhung tối, khung vàng kép, hồng trắng ở góc, chữ ánh kim — sang trọng',
  fonts: 'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,400..700;1,400..600&family=Hanken+Grotesk:wght@300..700&display=swap',
  palettes: [
    pal('do', 'Đỏ nhung', '#4f0b14', '#d9b25f'),
    pal('xanh', 'Lục nhung', '#0c3528', '#d4b062'),
    pal('lam', 'Lam nhung', '#0e1c40', '#d2b26a'),
    pal('tim', 'Tím nhung', '#36163f', '#d6b36c'),
  ],

  title(text, sub) {
    return `<div class="hk2-title"><h2 class="sec-title">${esc(text)}</h2>${sub ? `<p class="hk2-sub">${esc(sub)}</p>` : ''}<span class="hk2-rule"><i></i>◆<i></i></span></div>`;
  },

  opener(ctx) {
    return `
<div class="opener hk2-opener" id="opener">
  <div class="hk2-o">
    ${roses('hk2-rose tl')}${roses('hk2-rose br')}
    <p class="hk2-o-k">Wedding Invitation</p>
    <p class="hk2-o-names hk2-shine">${esc(ctx.g)}<em>&amp;</em>${esc(ctx.b)}</p>
    ${ctx.guest ? `<p class="hk2-o-to">Kính gửi<b>${esc(ctx.guest.name)}</b></p>` : ''}
    <button class="btn" id="openBtn">Mở thiệp</button>
  </div>
</div>`;
  },

  cover(ctx) {
    const p = ctx.dparts;
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="hk2-cover">
  <div class="hk2-frame">
    ${roses('hk2-rose tl')}${roses('hk2-rose br')}
    <p class="hk2-k">Lễ Thành Hôn</p>
    <h1 class="hk2-names hk2-shine"><span>${esc(ctx.g)}</span><em>&amp;</em><span>${esc(ctx.b)}</span></h1>
    ${photo ? `<div class="hk2-photo" style="background-image:url('${esc(photo)}')"></div>` : ''}
    ${p ? `<p class="hk2-date"><span>${esc(ctx.weekday)}</span><b class="hk2-shine">${p.d}.${p.m}.${p.y}</b>${ctx.timeText ? `<span>${esc(ctx.timeText)}</span>` : ''}</p>
    <p class="hk2-lunar">${esc(ctx.lunar)}</p>` : ''}
  </div>
</header>`;
  },

  css: `
.hk2-shine{background:linear-gradient(100deg,var(--gold-lo),var(--gold) 30%,var(--gold-hi) 50%,var(--gold) 70%,var(--gold-lo));background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:hk2Shine 6s linear infinite}
@keyframes hk2Shine{to{background-position:-200% 0}}
@media (prefers-reduced-motion:reduce){.hk2-shine{animation:none}}
.hk2-rose{position:absolute;width:130px;pointer-events:none;filter:drop-shadow(0 4px 8px rgba(0,0,0,.35))}
.hk2-rose.tl{top:-10px;left:-10px}
.hk2-rose.br{bottom:-10px;right:-10px;transform:scale(-1)}
.tpl-hoangkim .hk2-cover{padding:16px;background:radial-gradient(ellipse at 50% 30%,color-mix(in srgb,var(--velvet) 80%,#fff 10%),var(--velvet) 55%,color-mix(in srgb,var(--velvet) 70%,#000));color:var(--hero-ink)}
.tpl-hoangkim .hk2-frame{position:relative;min-height:calc(100svh - 32px);padding:70px 22px 64px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;border:2px solid var(--gold);outline:1px solid var(--gold);outline-offset:-10px}
.tpl-hoangkim .hk2-k{margin:0 0 12px;font-family:var(--font-title);font-size:12px;letter-spacing:.42em;text-transform:uppercase;color:var(--gold)}
.tpl-hoangkim .hk2-names{margin:0;font-family:var(--font-script);font-weight:400;font-size:58px;line-height:1.05}
.tpl-hoangkim .hk2-names span{display:block}
.tpl-hoangkim .hk2-names em{display:block;font-style:normal;font-family:var(--font-title);font-size:26px;font-style:italic}
.tpl-hoangkim .hk2-photo{width:210px;aspect-ratio:3/4;margin:22px auto 4px;background:center/cover no-repeat;border:2px solid var(--gold);box-shadow:0 0 0 6px color-mix(in srgb,var(--velvet) 80%,#000),0 0 0 7px var(--gold),0 20px 40px rgba(0,0,0,.4)}
.tpl-hoangkim .hk2-date{display:flex;flex-direction:column;align-items:center;gap:2px;margin:24px 0 0;font-family:var(--font-title)}
.tpl-hoangkim .hk2-date span{font-size:13px;letter-spacing:.24em;text-transform:uppercase}
.tpl-hoangkim .hk2-date b{font-size:34px;font-weight:500;letter-spacing:.08em}
.tpl-hoangkim .hk2-lunar{margin:6px 0 0;font-family:var(--font-title);font-style:italic;font-size:14px;opacity:.85}
.tpl-hoangkim .hk2-title{margin-bottom:26px}
.tpl-hoangkim .hk2-title .sec-title{margin:0;font-family:var(--font-script);font-weight:400;font-size:46px;color:var(--velvet)}
.tpl-hoangkim .hk2-sub{margin:0;font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:var(--muted)}
.tpl-hoangkim .hk2-rule{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px;color:var(--gold);font-size:10px}
.tpl-hoangkim .hk2-rule i{width:50px;height:1px;background:var(--gold)}
.tpl-hoangkim .guest-name{font-family:var(--font-script);font-size:46px;color:var(--velvet)}
.tpl-hoangkim .event{background:var(--paper);border:1px solid var(--gold);outline:1px solid var(--line);outline-offset:-7px;border-radius:2px}
.tpl-hoangkim .event h3{font-size:24px;font-style:italic}
.tpl-hoangkim .btn{border-radius:2px;letter-spacing:.12em;text-transform:uppercase;font-size:12px}
.tpl-hoangkim .ph{border-radius:2px;border:2px solid var(--gold)}
.tpl-hoangkim .cd-cell{border-radius:2px;background:var(--paper);border-color:var(--gold)}
.tpl-hoangkim .s-countdown,.tpl-hoangkim .s-thanks,.tpl-hoangkim .credit{background:radial-gradient(ellipse at 50% 0,color-mix(in srgb,var(--velvet) 80%,#fff 10%),var(--velvet) 70%);color:var(--hero-ink);opacity:1}
.tpl-hoangkim .s-countdown .sec-title,.tpl-hoangkim .s-thanks .thanks-big{color:var(--gold)}
.tpl-hoangkim .s-countdown .cd-cell{background:transparent}
.tpl-hoangkim .s-countdown .cd-cell b{color:var(--hero-ink)}
.tpl-hoangkim .s-countdown .cd-cell span{color:var(--gold)}
.tpl-hoangkim .thanks-big{font-family:var(--font-script);font-size:56px}
.tpl-hoangkim .s-thanks p,.tpl-hoangkim .s-thanks .thanks-names{color:var(--hero-ink)!important}
.tpl-hoangkim .credit .wm{background:transparent;border-color:var(--gold);color:var(--hero-ink)}

.hk2-opener{background:radial-gradient(ellipse at 50% 35%,color-mix(in srgb,var(--velvet) 80%,#fff 10%),var(--page))}
.hk2-opener .hk2-o{position:relative;width:min(310px,84vw);padding:72px 24px 60px;text-align:center;color:var(--hero-ink);background:var(--velvet);border:2px solid var(--gold);outline:1px solid var(--gold);outline-offset:-9px;box-shadow:0 30px 60px rgba(0,0,0,.5)}
.hk2-opener .hk2-rose{width:110px}
.hk2-opener .hk2-o-k{margin:0;font-family:var(--font-title);font-size:11px;letter-spacing:.38em;text-transform:uppercase;color:var(--gold)}
.hk2-opener .hk2-o-names{margin:8px 0 14px;font-family:var(--font-script);font-size:42px;line-height:1.05}
.hk2-opener .hk2-o-names em{display:block;font-family:var(--font-title);font-style:italic;font-size:20px}
.hk2-opener .hk2-o-to{margin:0 0 20px;font-size:12px;opacity:.85}
.hk2-opener .hk2-o-to b{display:block;font-family:var(--font-title);font-size:20px;font-weight:500;color:var(--gold)}
.hk2-opener .btn{background:var(--gold);border-color:var(--gold);color:var(--velvet);border-radius:2px;letter-spacing:.14em;text-transform:uppercase;font-size:12px}
`,
};
