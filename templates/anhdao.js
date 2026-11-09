// Mẫu "Anh Đào" — cành anh đào rủ từ góc, cánh hoa rơi nhẹ, ảnh tròn viền hồng.
const { esc } = require('../lib/util');
const orn = require('./_orn');

const base = {
  '--font-title': "'Lora',Georgia,serif",
  '--font-script': "'Great Vibes',cursive",
  '--font-body': "'Hanken Grotesk',system-ui,sans-serif",
};
const pal = (id, name, petal, bark, bg, ink, extra = {}) => ({
  id, name, swatch: [bg, petal],
  vars: { ...base, '--page': `color-mix(in srgb,${bg} 75%,${petal})`, '--petal': petal, '--petal-core': `color-mix(in srgb,${petal} 55%,#8a2041)`, '--bark': bark, '--bg': bg, '--paper': '#ffffff', '--ink': ink, '--muted': `color-mix(in srgb,${ink} 60%,${bg})`, '--accent': `color-mix(in srgb,${petal} 55%,#7a1d3c)`, '--accent-ink': '#ffffff', '--gold': `color-mix(in srgb,${petal} 70%,#b2875a)`, '--line': `color-mix(in srgb,${petal} 30%,${bg})`, ...extra },
});

// cành anh đào: thân cong + nhánh con + hoa 5 cánh + nụ
function branch(cls) {
  const flowers = [[60, 30, 14], [96, 52, 12], [132, 40, 15], [170, 64, 11], [206, 52, 13], [238, 82, 10], [112, 86, 10], [150, 100, 12], [30, 54, 10], [190, 112, 9]];
  const buds = [[80, 18], [152, 26], [224, 98], [128, 120], [46, 76], [250, 64]];
  return orn.svg(cls, '0 0 260 140', `
<path d="M-6 6C40 20 90 40 150 58S230 80 262 74" fill="none" stroke="var(--bark)" stroke-width="6" stroke-linecap="round"/>
<path d="M90 40C100 60 108 76 112 86M150 58C152 76 150 90 150 100M200 68C196 86 192 100 190 112M40 22C36 34 32 44 30 54" fill="none" stroke="var(--bark)" stroke-width="3" stroke-linecap="round"/>
${buds.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="var(--petal-core)" opacity=".8"/>`).join('')}
${flowers.map(([x, y, r], i) => orn.blossom(x, y, r, { fill: 'var(--petal)', core: 'var(--petal-core)', rot: i * 23 })).join('')}`);
}
const petals = () => `<div class="ad-fall" aria-hidden="true">${'<i></i>'.repeat(10)}</div>`;

module.exports = {
  id: 'anhdao',
  name: 'Anh Đào',
  group: 'minhhoa',
  desc: 'Cành anh đào rủ từ góc, cánh hoa rơi nhẹ, ảnh tròn — lãng mạn mùa xuân',
  fonts: 'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Lora:ital,wght@0,400..600;1,400..600&family=Hanken+Grotesk:wght@300..700&display=swap',
  palettes: [
    pal('hong', 'Hồng xuân', '#f4a9bf', '#6b4a45', '#fff6f8', '#3e2b30'),
    pal('trang', 'Trắng tinh khôi', '#f6d3dc', '#4e3b38', '#ffffff', '#33292b'),
    pal('dem', 'Đêm hoa', '#f3a6c0', '#2b2236', '#1d1a33', '#f6eef2', { '--paper': '#27234a', '--line': '#3b3563' }),
  ],

  title(text, sub) {
    return `<div class="ad-title">${orn.svg('ad-tflower', '0 0 40 40', orn.blossom(20, 20, 16, { fill: 'var(--petal)', core: 'var(--petal-core)' }))}<h2 class="sec-title">${esc(text)}</h2>${sub ? `<p class="ad-sub">${esc(sub)}</p>` : ''}</div>`;
  },

  opener(ctx) {
    return `
<div class="opener ad-opener" id="opener">
  ${branch('ad-branch tl')}${branch('ad-branch br')}${petals()}
  <div class="ad-o">
    <p class="ad-o-k">Save the date</p>
    <p class="ad-o-names">${esc(ctx.g)}<em>&amp;</em>${esc(ctx.b)}</p>
    ${ctx.guest ? `<p class="ad-o-to">Thân mời<b>${esc(ctx.guest.name)}</b></p>` : ''}
    <button class="btn" id="openBtn">Mở thiệp</button>
  </div>
</div>`;
  },

  cover(ctx) {
    const p = ctx.dparts;
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="ad-cover">
  ${branch('ad-branch tl')}${branch('ad-branch br')}${petals()}
  <p class="ad-k">The Wedding of</p>
  ${photo ? `<div class="ad-photo" style="background-image:url('${esc(photo)}')"></div>` : ''}
  <h1 class="ad-names"><span>${esc(ctx.g)}</span><em>&amp;</em><span>${esc(ctx.b)}</span></h1>
  ${p ? `<p class="ad-date"><span>${esc(ctx.weekday)}</span><b>${p.d} / ${p.m} / ${p.y}</b>${ctx.timeText ? `<span>${esc(ctx.timeText)}</span>` : ''}</p>
  <p class="ad-lunar">${esc(ctx.lunar)}</p>` : ''}
</header>`;
  },

  css: `
.ad-branch{position:absolute;width:300px;pointer-events:none}
.ad-branch.tl{top:-6px;left:-30px}
.ad-branch.br{bottom:-6px;right:-30px;transform:scale(-1)}
.ad-fall{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.ad-fall i{position:absolute;top:-20px;width:12px;height:12px;border-radius:150% 0 150% 0;background:var(--petal);opacity:.85;animation:adFall 11s linear infinite}
.ad-fall i:nth-child(1){left:8%;animation-delay:0s}.ad-fall i:nth-child(2){left:22%;animation-delay:-3s;animation-duration:13s}
.ad-fall i:nth-child(3){left:35%;animation-delay:-6s}.ad-fall i:nth-child(4){left:48%;animation-delay:-1.5s;animation-duration:14s}
.ad-fall i:nth-child(5){left:60%;animation-delay:-8s}.ad-fall i:nth-child(6){left:72%;animation-delay:-4.5s;animation-duration:12s}
.ad-fall i:nth-child(7){left:84%;animation-delay:-9.5s}.ad-fall i:nth-child(8){left:92%;animation-delay:-2s;animation-duration:15s}
.ad-fall i:nth-child(9){left:15%;animation-delay:-7s;width:9px;height:9px}.ad-fall i:nth-child(10){left:55%;animation-delay:-10s;width:9px;height:9px}
@keyframes adFall{0%{transform:translate(0,0) rotate(0)}50%{transform:translate(30px,55vh) rotate(200deg)}100%{transform:translate(-10px,110vh) rotate(420deg)}}
@media (prefers-reduced-motion:reduce){.ad-fall{display:none}}
.tpl-anhdao .ad-cover{position:relative;min-height:100svh;padding:90px 22px 100px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;color:var(--ink);background:radial-gradient(circle at 50% 40%,color-mix(in srgb,var(--petal) 18%,var(--bg)),var(--bg) 70%)}
.tpl-anhdao .ad-k{position:relative;margin:0 0 16px;font-family:var(--font-title);font-size:12px;letter-spacing:.38em;text-transform:uppercase;color:var(--muted)}
.tpl-anhdao .ad-photo{position:relative;width:min(220px,58vw);aspect-ratio:1;border-radius:50%;background:var(--line) center/cover no-repeat;box-shadow:0 0 0 6px var(--paper),0 0 0 8px var(--petal),0 20px 40px rgba(120,40,70,.18)}
.tpl-anhdao .ad-names{position:relative;margin:22px 0 0;font-family:var(--font-script);font-weight:400;font-size:56px;line-height:1}
.tpl-anhdao .ad-names span{display:block}
.tpl-anhdao .ad-names em{display:block;font-style:normal;font-family:var(--font-title);font-size:22px;color:var(--accent);margin:4px 0}
.tpl-anhdao .ad-date{position:relative;display:flex;align-items:center;justify-content:center;gap:10px;margin:18px 0 0;font-family:var(--font-title)}
.tpl-anhdao .ad-date span{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.tpl-anhdao .ad-date b{font-size:20px;font-weight:500;padding:4px 12px;border-radius:999px;background:color-mix(in srgb,var(--petal) 30%,transparent)}
.tpl-anhdao .ad-lunar{position:relative;margin:6px 0 0;font-family:var(--font-title);font-style:italic;font-size:14px;color:var(--muted)}
.tpl-anhdao .ad-title{margin-bottom:24px}
.tpl-anhdao .ad-tflower{display:block;width:30px;margin:0 auto 6px}
.tpl-anhdao .ad-title .sec-title{margin:0;font-family:var(--font-script);font-weight:400;font-size:44px;color:var(--ink)}
.tpl-anhdao .ad-sub{margin:0;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
.tpl-anhdao .guest-name{font-family:var(--font-script);font-size:44px;color:var(--accent)}
.tpl-anhdao .event{background:var(--paper);border:1px solid var(--line);border-radius:24px}
.tpl-anhdao .btn{border-radius:999px}
.tpl-anhdao .ph{border-radius:50%;aspect-ratio:1}
.tpl-anhdao .cd-cell{border-radius:50%;aspect-ratio:1;display:grid;place-content:center;background:var(--paper)}
.tpl-anhdao .s-countdown,.tpl-anhdao .s-thanks{background:color-mix(in srgb,var(--petal) 20%,var(--bg))}
.tpl-anhdao .thanks-big{font-family:var(--font-script);font-size:56px;color:var(--ink)}
.tpl-anhdao .fam-label,.tpl-anhdao .event h3,.tpl-anhdao .gift-who{color:var(--accent)}

.ad-opener{overflow:hidden;background:radial-gradient(circle at 50% 45%,color-mix(in srgb,var(--petal) 22%,var(--bg)),var(--bg) 70%)}
.ad-opener .ad-o{position:relative;text-align:center;color:var(--ink);width:min(320px,86vw)}
.ad-opener .ad-o-k{margin:0;font-family:var(--font-title);font-size:12px;letter-spacing:.38em;text-transform:uppercase;color:var(--muted)}
.ad-opener .ad-o-names{margin:8px 0 16px;font-family:var(--font-script);font-size:52px;line-height:1}
.ad-opener .ad-o-names em{display:block;font-style:normal;font-family:var(--font-title);font-size:20px;color:var(--accent)}
.ad-opener .ad-o-to{margin:0 0 18px;font-size:12px;color:var(--muted)}
.ad-opener .ad-o-to b{display:block;font-family:var(--font-title);font-weight:500;font-size:20px;color:var(--ink)}
`,
};
