// Mẫu "Cơ Bản" — khung tối thiểu để thiệp vẫn dựng được khi chưa có mẫu nào khác.
const { esc } = require('../lib/util');

const base = {
  '--font-title': "Georgia,'Times New Roman',serif",
  '--font-script': "Georgia,'Times New Roman',serif",
  '--font-body': 'system-ui,-apple-system,sans-serif',
};

module.exports = {
  id: 'coban',
  name: 'Cơ Bản',
  group: 'toigian',
  desc: 'Khung đơn giản, chưa có họa tiết',
  fonts: '',
  palettes: [
    { id: 'kem', name: 'Kem & nâu', swatch: ['#f8f4ee', '#8b6b4e'], vars: { ...base, '--page': '#e9e1d6', '--bg': '#f8f4ee', '--paper': '#fffdf9', '--ink': '#2e2925', '--muted': '#8a8077', '--accent': '#8b6b4e', '--accent-ink': '#fffdf9', '--gold': '#b89b72', '--line': '#e6ddd1' } },
  ],

  opener(ctx) {
    return `
<div class="opener cb-opener" id="opener">
  <div class="cb-env">
    <p class="cb-names">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
    ${ctx.guest ? `<p>Gửi ${esc(ctx.guest.name)}</p>` : ''}
    <button class="btn" id="openBtn">Mở thiệp</button>
  </div>
</div>`;
  },

  cover(ctx) {
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="cb-cover">
  ${photo ? `<img class="cb-photo" src="${esc(photo)}" alt="">` : ''}
  <h1 class="cb-names">${esc(ctx.g)} &amp; ${esc(ctx.b)}</h1>
  ${ctx.dateBlock('line')}
</header>
`;
  },

  css: `
.tpl-coban .cb-opener{background:var(--page)}
.tpl-coban .cb-env{padding:32px 24px;text-align:center;background:var(--paper);border:1px solid var(--line);border-radius:12px}
.tpl-coban .cb-names{margin:0 0 12px;font-family:var(--font-title);font-size:32px;font-weight:400;color:var(--accent)}
.tpl-coban .cb-cover{padding:32px 24px;text-align:center}
.tpl-coban .cb-photo{display:block;width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:12px;margin-bottom:24px}
`,
};
