// Mẫu "Vườn Kính" — ảnh cưới sau ô cửa kính nhà vườn hình vòm, hoa lá màu nước tràn hai góc.
const { esc } = require('../lib/util');
const orn = require('./_orn');

const base = {
  '--font-title': "'Cormorant Garamond',Georgia,serif",
  '--font-script': "'Great Vibes',cursive",
  '--font-body': "'Hanken Grotesk',system-ui,sans-serif",
};
const pal = (id, name, flower, leaf, bg, extra = {}) => ({
  id, name, swatch: [flower, leaf],
  vars: { ...base, '--page': `color-mix(in srgb,${bg} 75%,${leaf})`, '--flower': flower, '--leaf': leaf, '--bg': bg, '--paper': '#ffffff', '--ink': '#2f2b28', '--muted': '#7f776f', '--accent': `color-mix(in srgb,${leaf} 75%,#000)`, '--accent-ink': '#ffffff', '--gold': '#b9a173', '--line': `color-mix(in srgb,${leaf} 22%,${bg})`, ...extra },
});

// cụm hoa: nhánh lá + 3 bông nhiều lớp
const posy = (cls) => orn.svg(cls, '0 0 170 150', `
<g fill="var(--leaf)" opacity=".75">
  <ellipse cx="40" cy="96" rx="9" ry="24" transform="rotate(-50 40 96)"/>
  <ellipse cx="126" cy="112" rx="8" ry="22" transform="rotate(60 126 112)"/>
  <ellipse cx="70" cy="128" rx="7" ry="20" transform="rotate(-15 70 128)"/>
  <ellipse cx="148" cy="72" rx="7" ry="19" transform="rotate(30 148 72)"/>
  <ellipse cx="22" cy="58" rx="6" ry="17" transform="rotate(-20 22 58)"/>
</g>
<circle cx="64" cy="60" r="46" fill="var(--flower)" opacity=".16"/>
<circle cx="118" cy="84" r="34" fill="var(--flower)" opacity=".12"/>
${orn.bloom(64, 64, 36, { fill: 'var(--flower)', core: 'var(--gold)', layers: 3, petals: 7 })}
${orn.bloom(118, 86, 26, { fill: 'var(--flower)', core: 'var(--gold)', layers: 2, petals: 6, rot: 20 })}
${orn.bloom(100, 34, 15, { fill: 'var(--flower)', core: 'var(--gold)', layers: 2, petals: 5, rot: 10 })}
<g fill="var(--gold)">${[[30, 30], [140, 40], [150, 120], [20, 120]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6"/>`).join('')}</g>`);

module.exports = {
  id: 'vuonkinh',
  name: 'Vườn Kính',
  group: 'hoa',
  desc: 'Ảnh cưới sau ô cửa kính nhà vườn, hoa lá màu nước tràn góc — tươi sáng, lãng mạn',
  fonts: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Great+Vibes&family=Hanken+Grotesk:wght@300..700&display=swap',
  palettes: [
    pal('hong', 'Hồng vườn', '#e391a6', '#7d9c76', '#fbf6f3'),
    pal('xanh', 'Xanh lá', '#f3d9a4', '#4f7d5c', '#f5f7f1'),
    pal('lam', 'Lam hoa', '#8aa7d6', '#6f8f86', '#f4f6f9'),
    pal('xanh-nhat', 'Xanh bạc hà', '#f2b7b0', '#86b59a', '#f3f8f4'),
  ],

  title(text, sub) {
    return `<div class="vk-title">${sub ? `<p class="vk-sub">${esc(sub)}</p>` : ''}<h2 class="sec-title">${esc(text)}</h2>${orn.divider('vk-div')}</div>`;
  },

  opener(ctx) {
    return `
<div class="opener vk-opener" id="opener">
  ${posy('vk-posy tl')}${posy('vk-posy br')}
  <div class="vk-o">
    <div class="vk-o-glass"><span>${esc(ctx.initials)}</span></div>
    <p class="vk-o-k">Welcome to our wedding</p>
    <p class="vk-o-names">${esc(ctx.g)}<em>&amp;</em>${esc(ctx.b)}</p>
    ${ctx.guest ? `<p class="vk-o-to">Thân mời<b>${esc(ctx.guest.name)}</b></p>` : ''}
    <button class="btn" id="openBtn">Bước vào khu vườn</button>
  </div>
</div>`;
  },

  cover(ctx) {
    const p = ctx.dparts;
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="vk-cover">
  ${posy('vk-posy tl')}${posy('vk-posy br')}
  <p class="vk-k">Save the date</p>
  <div class="vk-window">
    <div class="vk-photo"${photo ? ` style="background-image:url('${esc(photo)}')"` : ''}></div>
    <div class="vk-glass"></div>
  </div>
  <h1 class="vk-names"><span>${esc(ctx.g)}</span><em>&amp;</em><span>${esc(ctx.b)}</span></h1>
  ${p ? `<p class="vk-date">${esc(ctx.weekday)} · <b>${p.d}.${p.m}.${p.y}</b>${ctx.timeText ? ` · ${esc(ctx.timeText)}` : ''}</p>
  <p class="vk-lunar">${esc(ctx.lunar)}</p>` : ''}
</header>`;
  },

  css: `
.tpl-vuonkinh .vk-cover{position:relative;min-height:100svh;padding:40px 22px 50px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;background:radial-gradient(circle at 10% 8%,color-mix(in srgb,var(--flower) 25%,transparent),transparent 40%),radial-gradient(circle at 92% 92%,color-mix(in srgb,var(--leaf) 22%,transparent),transparent 45%),var(--bg)}
.vk-posy{position:absolute;width:170px;pointer-events:none}
.vk-posy.tl{top:-28px;left:-40px;transform:rotate(-10deg)}
.vk-posy.br{bottom:-30px;right:-44px;transform:rotate(170deg)}
.tpl-vuonkinh .vk-k{position:relative;margin:0 0 16px;font-family:var(--font-title);font-size:13px;letter-spacing:.42em;text-transform:uppercase;color:var(--muted)}
.tpl-vuonkinh .vk-window{position:relative;width:min(270px,72vw);aspect-ratio:3/4;border-radius:999px 999px 0 0;overflow:hidden;border:5px solid #fff;box-shadow:0 0 0 1px var(--gold),0 20px 40px rgba(40,50,40,.18)}
.tpl-vuonkinh .vk-photo{position:absolute;inset:0;background:var(--line) center/cover no-repeat}
.tpl-vuonkinh .vk-glass{position:absolute;inset:0;background:
  linear-gradient(90deg,transparent calc(33.3% - 2px),#fff calc(33.3% - 2px) calc(33.3% + 2px),transparent calc(33.3% + 2px) calc(66.6% - 2px),#fff calc(66.6% - 2px) calc(66.6% + 2px),transparent calc(66.6% + 2px)),
  linear-gradient(0deg,transparent calc(30% - 2px),#fff calc(30% - 2px) calc(30% + 2px),transparent calc(30% + 2px) calc(60% - 2px),#fff calc(60% - 2px) calc(60% + 2px),transparent calc(60% + 2px)),
  linear-gradient(160deg,rgba(255,255,255,.28),transparent 40%)}
.tpl-vuonkinh .vk-names{position:relative;margin:24px 0 0;font-family:var(--font-script);font-weight:400;font-size:54px;line-height:1;color:var(--ink)}
.tpl-vuonkinh .vk-names span{display:block}
.tpl-vuonkinh .vk-names em{display:block;font-style:normal;font-family:var(--font-title);font-size:24px;color:var(--leaf);margin:4px 0}
.tpl-vuonkinh .vk-date{position:relative;margin:18px 0 0;font-family:var(--font-title);font-size:17px;letter-spacing:.06em;color:var(--ink)}
.tpl-vuonkinh .vk-date b{font-weight:600;color:var(--accent)}
.tpl-vuonkinh .vk-lunar{position:relative;margin:2px 0 0;font-family:var(--font-title);font-style:italic;color:var(--muted)}
.tpl-vuonkinh .vk-title{margin-bottom:26px}
.tpl-vuonkinh .vk-sub{margin:0;font-family:var(--font-script);font-size:26px;color:var(--leaf);line-height:1.1}
.tpl-vuonkinh .vk-title .sec-title{margin:0;font-weight:500;font-size:32px;color:var(--ink)}
.tpl-vuonkinh .vk-div{display:block;width:150px;height:16px;margin:10px auto 0;--gold:var(--leaf)}
.tpl-vuonkinh .guest-name{font-family:var(--font-script);font-size:44px;color:var(--ink)}
.tpl-vuonkinh .fam-label,.tpl-vuonkinh .event h3,.tpl-vuonkinh .gift-who{color:var(--accent)}
.tpl-vuonkinh .event{background:var(--paper);border:1px solid var(--line);border-radius:120px 120px 14px 14px;padding-top:40px;box-shadow:0 10px 24px rgba(40,50,40,.06)}
.tpl-vuonkinh .event h3{font-size:26px}
.tpl-vuonkinh .btn{border-radius:999px}
.tpl-vuonkinh .ph{border-radius:999px 999px 6px 6px;border:4px solid #fff;box-shadow:0 0 0 1px var(--line)}
.tpl-vuonkinh .cd-cell{background:var(--paper);border-radius:999px 999px 10px 10px}
.tpl-vuonkinh .s-countdown{background:color-mix(in srgb,var(--leaf) 12%,var(--bg))}
.tpl-vuonkinh .thanks-big{font-family:var(--font-script);font-size:58px;color:var(--ink)}

.vk-opener{overflow:hidden;background:radial-gradient(circle at 20% 15%,color-mix(in srgb,var(--flower) 30%,transparent),transparent 45%),radial-gradient(circle at 85% 90%,color-mix(in srgb,var(--leaf) 28%,transparent),transparent 50%),var(--bg)}
.vk-opener .vk-posy{width:200px}
.vk-opener .vk-o{position:relative;text-align:center;color:var(--ink);width:min(300px,84vw)}
.vk-opener .vk-o-glass{width:150px;height:190px;margin:0 auto 22px;border-radius:999px 999px 0 0;border:4px solid #fff;box-shadow:0 0 0 1px var(--gold),0 16px 30px rgba(40,50,40,.15);display:grid;place-items:center;background:linear-gradient(90deg,transparent 48%,#fff 48% 52%,transparent 52%),linear-gradient(0deg,transparent 48%,#fff 48% 52%,transparent 52%),linear-gradient(160deg,color-mix(in srgb,var(--leaf) 30%,#fff),color-mix(in srgb,var(--flower) 30%,#fff))}
.vk-opener .vk-o-glass span{font-family:var(--font-script);font-size:40px;color:var(--ink);background:var(--bg);padding:0 8px;border-radius:8px}
.vk-opener .vk-o-k{margin:0;font-family:var(--font-title);font-size:12px;letter-spacing:.32em;text-transform:uppercase;color:var(--muted)}
.vk-opener .vk-o-names{margin:4px 0 12px;font-family:var(--font-script);font-size:40px;line-height:1.1}
.vk-opener .vk-o-names em{display:block;font-style:normal;font-family:var(--font-title);font-size:20px;color:var(--leaf);line-height:1.3}
.vk-opener .vk-o-to{margin:0 0 20px;font-size:12px;color:var(--muted)}
.vk-opener .vk-o-to b{display:block;font-family:var(--font-title);font-size:21px;font-weight:500;color:var(--ink)}
`,
};
