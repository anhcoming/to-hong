// Kho họa tiết SVG dùng chung cho các mẫu thiệp.
// Mọi hình đều tô bằng biến CSS (var(--accent), var(--gold)...) nên tự đổi màu theo bảng màu.
// Mỗi hàm trả về chuỗi SVG; tham số `cls` là class gắn lên thẻ <svg> để mẫu tự đặt vị trí/kích thước.
const { esc } = require('../lib/util');

const f = (n) => +n.toFixed(1);
const rad = (d) => (d * Math.PI) / 180;
const svg = (cls, vb, inner, extra = '') => `<svg class="${cls || ''}" viewBox="${vb}" aria-hidden="true"${extra}>${inner}</svg>`;

// ---------- cây lá ----------

// cành lá thẳng đứng, lá so le, nụ tròn ở ngọn
function sprig(cls, { leaf = 'var(--accent)', stem = 'var(--gold)' } = {}) {
  const leaves = [[44, 130, -38], [36, 112, 42], [47, 92, -34], [38, 74, 40], [51, 56, -30], [44, 38, 38], [56, 22, -24]]
    .map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="5.5" ry="13" transform="rotate(${r} ${x} ${y})" fill="${leaf}" opacity=".82"/>`).join('');
  return svg(cls, '0 0 80 160', `<path d="M40 158C38 110 42 60 58 6" fill="none" stroke="${stem}" stroke-width="1.6"/>${leaves}<circle cx="58" cy="6" r="4" fill="${stem}"/>`);
}

// nhánh cong dài với lá hai bên — dùng làm viền góc, cành rủ
function branch(cls, { leaf = 'var(--accent)', stem = 'var(--gold)', n = 9, len = 200, bend = 40, leafW = 4, leafH = 11 } = {}) {
  // đường cong bậc hai từ (0,len) tới (bend,0)
  const P = (t) => [2 * (1 - t) * t * (bend * 1.6) + t * t * bend, (1 - t) * (1 - t) * len];
  const dP = (t) => [2 * (1 - 2 * t) * bend * 1.6 + 2 * t * bend, -2 * (1 - t) * len];
  let leaves = '';
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    const [x, y] = P(t), [dx, dy] = dP(t);
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    for (const s of [1, -1]) {
      const ox = x + s * 6 * Math.cos(rad(ang)), oy = y + s * 6 * Math.sin(rad(ang));
      leaves += `<ellipse cx="${f(ox)}" cy="${f(oy)}" rx="${leafW}" ry="${leafH}" transform="rotate(${f(ang + s * 35)} ${f(ox)} ${f(oy)})"/>`;
    }
  }
  const w = bend * 1.6 + 20;
  return svg(cls, `-20 -10 ${f(w + 20)} ${len + 20}`, `<path d="M0 ${len}Q${bend * 1.6} ${len / 2} ${bend} 0" fill="none" stroke="${stem}" stroke-width="1.4"/><g fill="${leaf}" opacity=".85">${leaves}</g>`);
}

// vòng nguyệt quế ôm chữ lồng (trả về <div class=cls> có svg + chữ)
const WREATH_HALF = (() => {
  const R = 44;
  const pt = (th, r) => [60 - r * Math.sin(th), 60 + r * Math.cos(th)]; // th=0 ở đáy, tăng dần lên bên trái
  let leaves = '';
  for (let deg = 18; deg <= 150; deg += 14) {
    const th = rad(deg);
    const tan = (Math.atan2(-Math.sin(th), -Math.cos(th)) * 180) / Math.PI;
    for (const side of [1, -1]) {
      const [x, y] = pt(th, R + side * 5);
      leaves += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="3.4" ry="8.5" transform="rotate(${f(tan - 90 + side * 28)} ${f(x)} ${f(y)})"/>`;
    }
  }
  const [x0, y0] = pt(rad(10), R), [x1, y1] = pt(rad(158), R);
  return `<path d="M${f(x0)} ${f(y0)}A${R} ${R} 0 0 1 ${f(x1)} ${f(y1)}" fill="none" stroke="var(--gold)" stroke-width="1.2"/><g fill="var(--accent)" opacity=".85">${leaves}</g>`;
})();
function wreath(cls, initials = '') {
  return `<div class="${cls}">${svg('', '0 0 120 120', `<g>${WREATH_HALF}</g><g transform="translate(120 0) scale(-1 1)">${WREATH_HALF}</g>`)}${initials ? `<span>${esc(initials)}</span>` : ''}</div>`;
}

// ---------- hoa ----------

// hoa nhiều lớp cánh (mẫu đơn / hồng) — các vòng cánh bầu dục xoay quanh tâm
function bloom(cx, cy, r, { fill = 'var(--accent)', core = 'var(--gold)', layers = 3, petals = 7, rot = 0 } = {}) {
  let g = '';
  for (let L = 0; L < layers; L++) {
    const rr = r * (1 - L * 0.28);
    const op = 0.45 + L * 0.2;
    for (let i = 0; i < petals; i++) {
      const a = rot + (360 / petals) * i + L * (180 / petals);
      const px = cx + rr * 0.45 * Math.cos(rad(a)), py = cy + rr * 0.45 * Math.sin(rad(a));
      g += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(rr * 0.42)}" ry="${f(rr * 0.6)}" transform="rotate(${f(a + 90)} ${f(px)} ${f(py)})" fill="${fill}" opacity="${op.toFixed(2)}"/>`;
    }
  }
  return g + `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.16)}" fill="${core}"/>`;
}

// hoa 5 cánh có khía (anh đào / mai)
function blossom(cx, cy, r, { fill = 'var(--accent)', core = 'var(--gold)', rot = 0 } = {}) {
  let g = '';
  for (let i = 0; i < 5; i++) {
    const a = rot + i * 72;
    // cánh: giọt nước có khía ở đầu, vẽ dọc trục rồi xoay
    g += `<path d="M0 0C${f(-r * 0.55)} ${f(-r * 0.3)} ${f(-r * 0.5)} ${f(-r * 0.95)} ${f(-r * 0.12)} ${f(-r)}L0 ${f(-r * 0.86)}L${f(r * 0.12)} ${f(-r)}C${f(r * 0.5)} ${f(-r * 0.95)} ${f(r * 0.55)} ${f(-r * 0.3)} 0 0Z" transform="translate(${cx} ${cy}) rotate(${a})" fill="${fill}"/>`;
  }
  for (let i = 0; i < 5; i++) {
    const a = rad(rot + i * 72 + 36 - 90);
    g += `<line x1="${cx}" y1="${cy}" x2="${f(cx + r * 0.38 * Math.cos(a))}" y2="${f(cy + r * 0.38 * Math.sin(a))}" stroke="${core}" stroke-width=".8"/><circle cx="${f(cx + r * 0.4 * Math.cos(a))}" cy="${f(cy + r * 0.4 * Math.sin(a))}" r="${f(r * 0.06)}" fill="${core}"/>`;
  }
  return g;
}

// hoa sen nhìn ngang: cánh giọt nước xòe hình quạt
function lotus(cls, { fill = 'var(--accent)', deep = 'var(--accent)', core = 'var(--gold)' } = {}) {
  const petal = (a, h, w, op, col) => `<path d="M0 0C${-w} ${-h * 0.35} ${-w * 0.55} ${-h * 0.85} 0 ${-h}C${w * 0.55} ${-h * 0.85} ${w} ${-h * 0.35} 0 0Z" transform="translate(60 92) rotate(${a})" fill="${col}" opacity="${op}"/>`;
  const back = [-62, -36, 36, 62].map((a) => petal(a, 56, 20, 0.45, fill)).join('');
  const mid = [-20, 20].map((a) => petal(a, 66, 22, 0.7, fill)).join('');
  const front = petal(0, 74, 22, 0.9, deep);
  return svg(cls, '0 0 120 100', `${back}${mid}${front}<ellipse cx="60" cy="93" rx="30" ry="4" fill="${core}" opacity=".5"/>`);
}

// ---------- hoa văn / khung ----------

// góc hoa văn cuộn (đặt ở góc trên-trái; xoay/lật bằng CSS cho 3 góc còn lại)
function corner(cls, { stroke = 'var(--gold)', w = 1.6 } = {}) {
  const p = [
    'M4 96V24Q4 4 24 4H96', // khung chữ L bo
    'M14 86V30Q14 14 30 14H86', // đường trong
    'M24 4C24 22 36 34 52 34C64 34 70 26 66 18C62 10 50 12 50 22', // xoắn ngang
    'M4 24C22 24 34 36 34 52C34 64 26 70 18 66C10 62 12 50 22 50', // xoắn dọc
  ].map((d) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"/>`).join('');
  return svg(cls, '0 0 100 100', `${p}<circle cx="14" cy="14" r="3.2" fill="${stroke}"/><path d="M28 28l6 6-6 6-6-6z" fill="${stroke}"/>`);
}

// đường kẻ trang trí ngang: hai nét mảnh + hình thoi + xoắn
function divider(cls, { stroke = 'var(--gold)' } = {}) {
  return svg(cls, '0 0 240 24', `
<path d="M8 12H92M148 12H232" stroke="${stroke}" stroke-width="1"/>
<path d="M92 12C100 4 108 4 110 10M148 12C140 4 132 4 130 10M92 12C100 20 108 20 110 14M148 12C140 20 132 20 130 14" fill="none" stroke="${stroke}" stroke-width="1.2"/>
<path d="M120 4l8 8-8 8-8-8z" fill="${stroke}"/><circle cx="8" cy="12" r="2" fill="${stroke}"/><circle cx="232" cy="12" r="2" fill="${stroke}"/>`);
}

// mây tường vân: chuỗi xoắn ốc nối nhau
function cloud(cls, { stroke = 'var(--gold)', fill = 'none', w = 2 } = {}) {
  const d = 'M10 50C10 36 26 30 34 40C38 46 34 52 28 50C24 48 26 42 30 43'
    + 'M34 40C36 22 58 18 66 32C70 40 64 46 58 44C53 42 55 35 60 36'
    + 'M66 32C74 20 96 24 96 40C96 50 86 54 80 48C76 44 80 38 84 40'
    + 'M96 40C110 40 114 54 104 58H18C10 58 10 50 10 50';
  return svg(cls, '0 0 120 64', `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
}

// sóng nước kẻ vàng (lặp ngang)
function waves(cls, { stroke = 'var(--gold)', rows = 3 } = {}) {
  let g = '';
  for (let r = 0; r < rows; r++) {
    const y = 10 + r * 10, off = r % 2 ? 15 : 0;
    let d = `M${-30 + off} ${y}`;
    for (let x = -30 + off; x < 330; x += 30) d += `q7.5 -8 15 0t15 0`;
    g += `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="1.2" opacity="${(1 - r * 0.25).toFixed(2)}"/>`;
  }
  return svg(cls, `0 0 300 ${10 + rows * 10}`, g, ' preserveAspectRatio="none"');
}

// ---------- chim ----------

// hạc bay nhìn nghiêng, quay sang phải
function crane(cls, { body = 'var(--paper)', ink = 'var(--ink)', crown = '#c8102e', line = 'var(--gold)' } = {}) {
  return svg(cls, '0 0 200 120', `
<path d="M70 70C40 40 20 30 4 34C24 44 40 56 56 74Z" fill="${body}" stroke="${line}" stroke-width="1.2"/>
<path d="M60 70C44 52 30 46 18 46" fill="none" stroke="${ink}" stroke-width="2" opacity=".55"/>
<path d="M88 64C96 30 120 10 150 6C130 22 116 44 108 70Z" fill="${body}" stroke="${line}" stroke-width="1.2"/>
<path d="M112 22C124 14 136 10 146 8" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
<ellipse cx="88" cy="74" rx="34" ry="12" fill="${body}" stroke="${line}" stroke-width="1.2"/>
<path d="M118 70C134 62 146 52 156 40C160 34 168 34 170 40" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
<path d="M170 40l22 4-22 2z" fill="${line}"/>
<circle cx="166" cy="37" r="3.2" fill="${crown}"/>
<path d="M56 78C44 84 32 86 20 84M60 82C50 92 36 96 26 96" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>
<path d="M80 86C78 100 74 110 70 116M90 86C92 100 92 110 90 118" stroke="${ink}" stroke-width="1.4" opacity=".6"/>`);
}

// ---------- rồng / phượng cách điệu (nét vàng) ----------

// rồng uốn khúc, đầu quay sang phải, ngậm ngọc
function dragon(cls, { gold = 'var(--gold)', dark = 'rgba(0,0,0,.45)' } = {}) {
  const body = 'M14 128C30 96 54 92 70 108C86 124 108 120 116 98C124 76 112 58 128 46C142 36 160 42 168 54';
  const s = (d, w = 2, extra = '') => `<path d="${d}" fill="none" stroke="${gold}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
  return svg(cls, '0 0 222 150', `
${s(body, 15, ' stroke-dasharray="2 6" opacity=".85"')}
${s(body, 9)}
${s(body, 5, ` stroke="${dark}" stroke-dasharray="3 3" opacity=".5"`).replace(`stroke="${gold}" `, '')}
${s('M14 128C4 132 0 122 8 118M14 128C8 140 -2 138 2 130', 2.4)}
${s('M58 104C54 114 46 118 38 116M38 116l-4 -5M38 116l-6 2M38 116l-2 6', 3)}
${s('M120 86C132 82 140 74 138 64M138 64l4 -6M138 64l-5 -4M138 64l6 1', 3)}
${s('M84 116C80 128 90 134 96 128M108 120C112 132 124 132 124 122', 1.6)}
${s('M166 52C156 40 158 30 166 26M164 58C150 54 146 44 150 36M160 62C146 64 138 58 138 50', 2)}
<path d="M164 50C172 40 188 38 198 46C204 50 206 56 200 60C192 64 180 62 172 62Z" fill="${gold}"/>
${s('M172 62C180 70 192 72 200 66', 3)}
<circle cx="186" cy="48" r="2.4" fill="${dark}"/>
${s('M176 42C174 30 180 22 190 20M182 40C184 30 192 26 200 28', 2.5)}
${s('M200 58C210 62 216 74 210 84M198 64C204 76 200 88 190 92', 1.4)}
<circle cx="214" cy="34" r="6" fill="${gold}"/>
${s('M214 22v-6M224 28l5-3M204 28l-5-3M222 40l5 3', 1.4)}`);
}

// phượng hoàng, đầu quay sang trái, đuôi dài uốn xoắn
function phoenix(cls, { gold = 'var(--gold)', dark = 'rgba(0,0,0,.4)' } = {}) {
  const s = (d, w = 2) => `<path d="${d}" fill="none" stroke="${gold}" stroke-width="${w}" stroke-linecap="round"/>`;
  const eye = (x, y) => `<circle cx="${x}" cy="${y}" r="5" fill="none" stroke="${gold}" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="2" fill="${gold}"/>`;
  return svg(cls, '0 0 222 150', `
${s('M168 76C190 96 196 120 176 136C164 144 150 138 156 128', 3)}
${s('M164 80C176 108 168 130 146 140C132 146 120 138 128 130', 3)}
${s('M160 80C156 110 136 128 112 132C98 134 94 124 104 122', 3)}
${s('M166 80C200 92 214 112 212 132', 1.4)}${s('M158 82C140 112 108 112 88 108', 1.4)}
${eye(156, 128)}${eye(128, 130)}${eye(104, 122)}
<path d="M150 62C150 40 168 18 200 10C190 22 186 32 190 40C178 40 172 48 172 58Z" fill="${gold}" opacity=".95"/>
<path d="M160 52L188 18M166 54L194 28M170 56L196 38" stroke="${dark}" stroke-width="1.2"/>
<ellipse cx="150" cy="72" rx="22" ry="11" transform="rotate(-20 150 72)" fill="${gold}"/>
${s('M136 64C122 52 118 38 126 30', 5)}
<circle cx="126" cy="28" r="6.5" fill="${gold}"/>
<path d="M120 26L106 30L120 33Z" fill="${gold}"/>
<circle cx="124" cy="27" r="1.6" fill="${dark}"/>
${s('M128 22C130 12 138 8 146 10M130 23C136 15 146 15 152 19M126 22C124 12 128 4 134 2', 1.6)}`);
}

// ---------- viền hình học ----------

// dải hồi văn (meander) nằm ngang, lặp `n` ô
function meander(cls, { stroke = 'var(--gold)', n = 16, w = 1.6 } = {}) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const x = i * 24;
    d += `M${x} 22H${x + 22}V2H${x + 4}V18H${x + 18}V6H${x + 8}V14H${x + 14}V10`;
  }
  return svg(cls, `-1 0 ${n * 24 + 2} 24`, `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="miter"/>`, ' preserveAspectRatio="xMidYMid slice"');
}

// ---------- hoa văn châu Âu ----------

// đổi chỗ x/y trong chuỗi path (lật qua đường chéo) — dùng để vẽ một nửa rồi đối xứng
const swapXY = (d) => d.replace(/(-?\d+\.?\d*)[ ,](-?\d+\.?\d*)/g, (m, a, b) => `${b} ${a}`);

// góc cuộn baroque: xoắn chữ C, tua lá chạy dọc hai cạnh, lá acanthus ở giữa (đặt góc trên-trái)
function scrollCorner(cls, { gold = 'var(--gold)' } = {}) {
  const half = [
    ['M14 30C14 14 30 8 46 12C62 16 70 30 64 40C58 50 44 46 46 36C48 28 58 30 56 36', 2.2],
    ['M46 12C70 4 96 8 118 14', 1.4],
    ['M64 40C78 34 86 22 82 14', 1.4],
  ];
  const leaves = [[60, 8, -70], [76, 6, -80], [92, 8, -95], [106, 11, -100]];
  let g = '';
  for (const [d, w] of half) for (const dd of [d, swapXY(d)]) g += `<path d="${dd}" fill="none" stroke="${gold}" stroke-width="${w}" stroke-linecap="round"/>`;
  for (const [x, y, r] of leaves) for (const [xx, yy, rr] of [[x, y, r], [y, x, -90 - r]]) g += `<ellipse cx="${xx}" cy="${yy}" rx="2.2" ry="6" transform="rotate(${rr} ${xx} ${yy})" fill="${gold}"/>`;
  g += `<path d="M10 10C30 18 42 30 48 48C34 44 20 32 10 10Z" fill="${gold}"/><path d="M14 14L44 44" stroke="rgba(0,0,0,.25)" stroke-width=".8"/>`;
  g += `<circle cx="56" cy="36" r="2.4" fill="${gold}"/><circle cx="36" cy="56" r="2.4" fill="${gold}"/><circle cx="118" cy="14" r="2" fill="${gold}"/><circle cx="14" cy="118" r="2" fill="${gold}"/>`;
  return svg(cls, '0 0 122 122', g);
}

// nền gấm damask: lưới ogee + hoa văn giữa ô; dùng <pattern> nên mỗi trang chỉ gọi một lần với id riêng
function damask(cls, id, { stroke = 'var(--gold)', op = 0.14 } = {}) {
  const tile = `
<path d="M30 0C30 14 50 20 50 40C50 60 30 66 30 80M30 0C30 14 10 20 10 40C10 60 30 66 30 80" fill="none" stroke="${stroke}" stroke-width="1"/>
<path d="M30 26C36 32 38 40 30 52C22 40 24 32 30 26Z" fill="${stroke}"/>
<path d="M30 40C40 36 44 44 38 48M30 40C20 36 16 44 22 48" fill="none" stroke="${stroke}" stroke-width="1"/>
<circle cx="30" cy="20" r="2" fill="${stroke}"/><circle cx="0" cy="40" r="3" fill="${stroke}"/><circle cx="60" cy="40" r="3" fill="${stroke}"/>`;
  return `<svg class="${cls}" aria-hidden="true" width="100%" height="100%"><defs><pattern id="${id}" width="60" height="80" patternUnits="userSpaceOnUse">${tile}</pattern></defs><rect width="100%" height="100%" fill="url(#${id})" opacity="${op}"/></svg>`;
}

module.exports = { svg, f, rad, sprig, branch, wreath, bloom, blossom, lotus, corner, divider, cloud, waves, crane, dragon, phoenix, meander, scrollCorner, damask, swapXY };
