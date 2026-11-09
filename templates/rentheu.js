// Mẫu "Ren Thêu" — viền ren vỏ sò hoa rỗng trên nền lụa (trắng ngà hoặc đen), chữ viết tay.
const { esc } = require('../lib/util');
const orn = require('./_orn');

const base = {
  '--font-title': "'Cormorant Garamond',Georgia,serif",
  '--font-script': "'Great Vibes',cursive",
  '--font-body': "'Hanken Grotesk',system-ui,sans-serif",
};
const pal = (id, name, silk, laceC, ink, accent, extra = {}) => ({
  id, name, swatch: [silk, laceC],
  vars: { ...base, '--page': `color-mix(in srgb,${silk} 75%,#000)`, '--silk': silk, '--lace': laceC, '--silk-ink': ink, '--bg': '#f8f5ef', '--paper': '#ffffff', '--ink': '#2b2724', '--muted': '#837a71', '--accent': accent, '--accent-ink': '#ffffff', '--gold': '#c2a46b', '--line': '#e9e1d4', ...extra },
});

module.exports = {
  id: 'rentheu',
  name: 'Ren Thêu',
  group: 'chatlieu',
  desc: 'Viền ren hoa rỗng trên nền lụa, chữ viết tay — tinh tế như váy cưới',
  fonts: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Great+Vibes&family=Hanken+Grotesk:wght@300..700&display=swap',
  palettes: [
    pal('trang-nga', 'Trắng ngà', '#e9dccb', '#fffdf8', '#3a302a', '#8a6d55'),
    pal('lua-den', 'Lụa đen', '#141315', '#f3eee6', '#f6f1e8', '#3a3337'),
    pal('hong-phan', 'Hồng phấn', '#e8c9c6', '#fffaf8', '#4a3433', '#a2646a'),
  ],

  title(text, sub) {
    return `<div class="rt-title">${sub ? `<p class="rt-sub">${esc(sub)}</p>` : ''}<h2 class="sec-title">${esc(text)}</h2><span class="rt-bead" aria-hidden="true"><i></i><i></i><i></i></span></div>`;
  },

  opener(ctx) {
    return `
<div class="opener rt-opener" id="opener">
  ${orn.lace('rt-lace top', { n: 12 })}
  <div class="rt-o">
    <p class="rt-o-k">Wedding Invitation</p>
    <p class="rt-o-names">${esc(ctx.g)}<em>&amp;</em>${esc(ctx.b)}</p>
    ${ctx.guest ? `<p class="rt-o-to">Thân gửi<b>${esc(ctx.guest.name)}</b></p>` : ''}
    <button class="btn" id="openBtn">Mở thiệp</button>
  </div>
  ${orn.lace('rt-lace bot', { n: 12 })}
</div>`;
  },

  cover(ctx) {
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="rt-cover">
  ${orn.lace('rt-lace top', { n: 12 })}
  <p class="rt-k">Together with their families</p>
  <h1 class="rt-names"><span>${esc(ctx.g)}</span><em>&amp;</em><span>${esc(ctx.b)}</span></h1>
  ${photo ? `<div class="rt-photo"><div style="background-image:url('${esc(photo)}')"></div></div>` : ''}
  ${ctx.dateBlock('stack')}
  ${orn.lace('rt-lace bot', { n: 12 })}
</header>`;
  },

  css: `
.rt-lace{position:absolute;left:0;right:0;width:100%;height:52px;pointer-events:none;filter:drop-shadow(0 3px 4px rgba(0,0,0,.18))}
.rt-lace.top{top:0}
.rt-lace.bot{bottom:0;transform:scaleY(-1)}
.tpl-rentheu .rt-cover{position:relative;min-height:100svh;padding:90px 22px 90px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;color:var(--silk-ink);background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.14) 45%,transparent 60%),radial-gradient(ellipse at 50% 30%,color-mix(in srgb,var(--silk) 80%,#fff),var(--silk) 70%)}
.tpl-rentheu .rt-k{margin:0 0 8px;font-family:var(--font-title);font-style:italic;font-size:15px;letter-spacing:.06em;opacity:.85}
.tpl-rentheu .rt-names{margin:0;font-family:var(--font-script);font-weight:400;font-size:58px;line-height:1}
.tpl-rentheu .rt-names span{display:block}
.tpl-rentheu .rt-names em{display:block;font-style:normal;font-family:var(--font-title);font-size:24px;opacity:.75;margin:4px 0}
.tpl-rentheu .rt-photo{margin:26px auto 0;padding:10px;background:var(--lace);border-radius:4px;box-shadow:0 18px 36px rgba(0,0,0,.22)}
.tpl-rentheu .rt-photo>div{width:min(220px,58vw);aspect-ratio:4/5;background:var(--line) center/cover no-repeat;outline:1px dashed color-mix(in srgb,var(--silk-ink) 25%,transparent);outline-offset:5px}
.tpl-rentheu .rt-title{margin-bottom:26px}
.tpl-rentheu .rt-sub{margin:0;font-family:var(--font-script);font-size:26px;color:var(--accent);line-height:1.1}
.tpl-rentheu .rt-title .sec-title{margin:0;font-weight:500;font-size:30px;color:var(--ink)}
.tpl-rentheu .rt-bead{display:flex;justify-content:center;gap:6px;margin-top:10px}
.tpl-rentheu .rt-bead i{width:6px;height:6px;border-radius:50%;background:var(--gold)}
.tpl-rentheu .rt-bead i:nth-child(2){width:9px;height:9px;margin-top:-1px}
.tpl-rentheu .guest-name{font-family:var(--font-script);font-size:44px;color:var(--ink)}
.tpl-rentheu .btn{border-radius:999px}
.tpl-rentheu .ph{border-radius:4px;border:6px solid #fff;box-shadow:0 0 0 1px var(--line)}
.tpl-rentheu .s-cal,.tpl-rentheu .s-thanks,.tpl-rentheu .credit{background:var(--silk);color:var(--silk-ink);opacity:1;--cal-hi:var(--gold)}
.tpl-rentheu .s-cal .sec-title,.tpl-rentheu .s-thanks .thanks-big{color:var(--silk-ink)}
.tpl-rentheu .thanks-big{font-family:var(--font-script);font-size:58px}
.tpl-rentheu .s-thanks p,.tpl-rentheu .s-thanks .thanks-names{color:var(--silk-ink)!important}
.tpl-rentheu .credit .wm{background:transparent;border-color:var(--gold);color:var(--silk-ink)}

.rt-opener{overflow:hidden;color:var(--silk-ink);background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.14) 45%,transparent 60%),radial-gradient(ellipse at 50% 40%,color-mix(in srgb,var(--silk) 80%,#fff),var(--silk) 70%)}
.rt-opener .rt-o{text-align:center;width:min(320px,86vw)}
.rt-opener .rt-o-k{margin:0;font-family:var(--font-title);font-size:12px;letter-spacing:.38em;text-transform:uppercase;opacity:.8}
.rt-opener .rt-o-names{margin:6px 0 16px;font-family:var(--font-script);font-size:52px;line-height:1}
.rt-opener .rt-o-names em{display:block;font-style:normal;font-family:var(--font-title);font-size:22px;opacity:.75}
.rt-opener .rt-o-to{margin:0 0 20px;font-size:12px;opacity:.85}
.rt-opener .rt-o-to b{display:block;font-family:var(--font-title);font-weight:500;font-size:21px}
.rt-opener .btn{background:var(--lace);border-color:var(--lace);color:var(--ink);border-radius:999px;box-shadow:0 6px 16px rgba(0,0,0,.18)}
`,
};
