// Mẫu "Tinh Khôi" — hiện đại, tối giản, ảnh lớn tràn màn hình.
const { esc } = require('../lib/util');

const base = {
  '--font-title': "'Cormorant Garamond',Georgia,serif",
  '--font-script': "'Cormorant Garamond',Georgia,serif",
  '--font-body': "'Be Vietnam Pro',system-ui,sans-serif",
};

module.exports = {
  id: 'toigian',
  name: 'Tinh Khôi',
  desc: 'Hiện đại tối giản, ảnh cưới tràn màn hình, chữ thanh mảnh',
  fonts: 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap',
  palettes: [
    { id: 'kem', name: 'Kem & nâu', swatch: ['#f6f1ea', '#8b6b4e'], vars: { ...base, '--page': '#e9e1d6', '--bg': '#f8f4ee', '--paper': '#fffdf9', '--ink': '#2e2925', '--muted': '#8a8077', '--accent': '#8b6b4e', '--accent-ink': '#fffdf9', '--gold': '#b89b72', '--line': '#e6ddd1' } },
    { id: 'xanh-xo', name: 'Xanh xô thơm', swatch: ['#f3f5f0', '#5f7461'], vars: { ...base, '--page': '#dfe5dc', '--bg': '#f4f6f1', '--paper': '#ffffff', '--ink': '#263029', '--muted': '#76837a', '--accent': '#5f7461', '--accent-ink': '#ffffff', '--gold': '#9fb09a', '--line': '#dfe5dc' } },
    { id: 'dem', name: 'Đêm sâu', swatch: ['#1d1c22', '#c9a96e'], vars: { ...base, '--page': '#0f0e12', '--bg': '#1d1c22', '--paper': '#26252c', '--ink': '#efe9df', '--muted': '#a39d93', '--accent': '#c9a96e', '--accent-ink': '#1d1c22', '--gold': '#c9a96e', '--line': '#3a3842' } },
  ],

  title(text, sub) {
    return `<div class="tk-title">${sub ? `<p class="tk-sub">${esc(sub)}</p>` : ''}<h2 class="sec-title">${esc(text)}</h2><span class="tk-rule"></span></div>`;
  },

  opener(ctx) {
    return `
<div class="opener tk-opener" id="opener">
  <div class="tk-env">
    <p class="tk-mono">${esc(ctx.initials)}</p>
    <p class="tk-env-k">Wedding Invitation</p>
    ${ctx.guest ? `<p class="tk-env-to">Gửi ${esc(ctx.guest.name)}</p>` : `<p class="tk-env-to">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>`}
    <button class="btn" id="openBtn">Mở thiệp</button>
  </div>
</div>`;
  },

  cover(ctx) {
    const p = ctx.dparts;
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="tk-cover${photo ? '' : ' no-photo'}"${photo ? ` style="background-image:url('${esc(photo)}')"` : ''}>
  <div class="tk-shade"></div>
  <div class="tk-hero">
    <p class="tk-k">Chúng mình cưới</p>
    <h1 class="tk-names">${esc(ctx.g)}<span>&amp;</span>${esc(ctx.b)}</h1>
    ${p ? `<p class="tk-date">${p.d} <i></i> ${p.m} <i></i> ${p.y}</p>` : ''}
  </div>
</header>
${p ? `
<section class="sec tk-when reveal">
  <p class="tk-wd">${esc(ctx.weekday)}${ctx.timeText ? ` · ${esc(ctx.timeText)}` : ''}</p>
  <p class="tk-big">${p.d}<small>/${p.m}</small></p>
  <p class="tk-lunar">${esc(ctx.lunar)}</p>
</section>` : ''}`;
  },

  css: `
.tpl-toigian .tk-cover{position:relative;min-height:100svh;background:var(--line) center/cover no-repeat;display:flex;align-items:flex-end;color:#fff}
.tpl-toigian .tk-cover.no-photo{background:linear-gradient(160deg,var(--gold),var(--accent))}
.tpl-toigian .tk-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,0,0,.55) 100%)}
.tpl-toigian .tk-hero{position:relative;width:100%;padding:0 24px 56px;text-align:center}
.tpl-toigian .tk-k{margin:0 0 4px;font-size:12px;letter-spacing:.4em;text-transform:uppercase;font-weight:300}
.tpl-toigian .tk-names{margin:0;font-family:var(--font-title);font-weight:400;font-style:italic;font-size:54px;line-height:1.05}
.tpl-toigian .tk-names span{display:block;font-size:30px;margin:4px 0;opacity:.85}
.tpl-toigian .tk-date{margin:18px 0 0;font-size:15px;letter-spacing:.3em;font-weight:300;display:flex;align-items:center;justify-content:center;gap:12px}
.tpl-toigian .tk-date i{width:5px;height:5px;border-radius:50%;background:#fff;opacity:.7}
.tpl-toigian .tk-when{padding-bottom:16px}
.tpl-toigian .tk-wd{margin:0;font-size:13px;letter-spacing:.24em;text-transform:uppercase;color:var(--muted)}
.tpl-toigian .tk-big{margin:4px 0;font-family:var(--font-title);font-size:96px;line-height:1;color:var(--accent);font-weight:400}
.tpl-toigian .tk-big small{font-size:40px;color:var(--gold)}
.tpl-toigian .tk-lunar{margin:0;font-style:italic;color:var(--muted);font-size:14px}
.tpl-toigian .sec-title{font-weight:400;font-size:36px;color:var(--ink)}
.tpl-toigian .tk-title{margin-bottom:28px}
.tpl-toigian .tk-title .sec-title{margin:0}
.tpl-toigian .tk-sub{margin:0 0 2px;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:var(--accent)}
.tpl-toigian .tk-rule{display:block;width:40px;height:1px;background:var(--gold);margin:14px auto 0}
.tpl-toigian .guest-name{font-family:var(--font-title);font-style:italic;font-size:40px;color:var(--ink)}
.tpl-toigian .couple-full .amp{font-family:var(--font-title);font-style:italic}
.tpl-toigian .event,.tpl-toigian .form,.tpl-toigian .gift,.tpl-toigian .cd-cell,.tpl-toigian .wish{border-radius:4px}
.tpl-toigian .event{border:0;border-top:1px solid var(--gold);border-bottom:1px solid var(--gold);background:transparent;border-radius:0}
.tpl-toigian .event h3{font-size:26px;font-style:italic;color:var(--ink)}
.tpl-toigian .btn{border-radius:2px;letter-spacing:.14em;text-transform:uppercase;font-size:12px;font-weight:400}
.tpl-toigian .gallery{gap:4px}
.tpl-toigian .ph{border-radius:0}
.tpl-toigian .thanks-big{font-family:var(--font-title);font-style:italic;font-size:52px;color:var(--ink)}

.tk-opener{background:var(--bg)}
.tk-opener .tk-env{text-align:center;padding:48px 36px;border:1px solid var(--gold);outline:1px solid var(--line);outline-offset:8px;background:var(--paper);width:min(320px,84vw);color:var(--ink)}
.tk-opener .tk-mono{margin:0;font-family:var(--font-title);font-style:italic;font-size:56px;color:var(--accent);line-height:1}
.tk-opener .tk-env-k{margin:12px 0 4px;font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--muted)}
.tk-opener .tk-env-to{margin:0 0 26px;font-family:var(--font-title);font-size:22px}
.tk-opener .btn{border-radius:2px;letter-spacing:.2em;text-transform:uppercase;font-size:12px;font-weight:400;padding:12px 26px}
`,
};
