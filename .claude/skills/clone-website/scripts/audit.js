// Chạy ở CẢ trang gốc và bản clone với cùng một spec để số liệu so được với nhau.
// spec: { anchor: tìm-phần-tử, items: { tên: tìm-phần-tử, ... } }
//   tìm-phần-tử là CSS selector ('.dd-box'), hoặc { text: 'Chữ hiển thị' } (khớp nguyên văn, đã chuẩn hoá NFC,
//   không phân biệt hoa thường), hoặc { text, contains: true }, hoặc { img: 'tên-file' } (khớp currentSrc).
//   Thêm within: tìm-phần-tử để chỉ tìm bên trong một phần (khi cùng chữ xuất hiện ở nhiều nơi).
// Trả về: vw, anchor (toạ độ trang) và mỗi item: [x, y so với anchor, rộng, cao] + font/màu/nền/viền/bóng.
// Ví dụ: __audit({ anchor: { text: 'Lịch trình ngày cưới' }, items: { box: '.dd-sched .dd-box', dot: '.dd-tl .dot' } })
window.__audit = (spec) => {
  const N = (s) => s.normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();
  const vis = (e) => e && e.getBoundingClientRect().height > 0;
  const find = (q) => {
    if (!q) return null;
    if (typeof q === 'string') return [...document.querySelectorAll(q)].find(vis) || null;
    const root = q.within ? find(q.within) : document.body;
    if (!root) return null;
    if (q.img) return [...root.querySelectorAll('img')].find((i) => vis(i) && (i.currentSrc || i.src).includes(q.img)) || null;
    const t = N(q.text);
    const hits = [...root.querySelectorAll('*')].filter((e) => vis(e) && (q.contains ? N(e.textContent).includes(t) : N(e.textContent) === t));
    return hits.length ? hits.reduce((a, b) => (a.contains(b) ? b : a)) : null; // phần tử nhỏ nhất chứa chữ
  };
  const box = (e) => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top + scrollY), Math.round(b.width), Math.round(b.height)]; };
  const clean = (v) => v.replace(/rgba\(0, 0, 0, 0\) 0px 0px 0px 0px,? ?/g, '').trim();
  const a = find(spec.anchor);
  const a0 = a ? box(a)[1] : 0;
  const out = { vw: innerWidth, scrollW: document.documentElement.scrollWidth, anchor: a ? box(a) : null };
  for (const [name, q] of Object.entries(spec.items || {})) {
    const e = find(q);
    if (!e) { out[name] = null; continue; }
    const s = getComputedStyle(e);
    const b = box(e);
    out[name] = {
      box: [b[0], b[1] - a0, b[2], b[3]],
      font: `${s.fontFamily.split(',')[0].replace(/["']/g, '')} ${s.fontSize}/${s.lineHeight} w${s.fontWeight} ls=${s.letterSpacing} ${s.textTransform}`,
      color: s.color,
      bg: [s.backgroundColor, s.backgroundImage === 'none' ? '' : s.backgroundImage.slice(0, 80)].filter((x) => x && x !== 'rgba(0, 0, 0, 0)').join(' | '),
      border: s.borderTopWidth === '0px' ? '' : `${s.borderTopWidth} ${s.borderTopColor}`,
      radius: s.borderRadius === '0px' ? '' : s.borderRadius,
      shadow: s.boxShadow === 'none' ? '' : clean(s.boxShadow).slice(0, 90),
      layer: s.opacity !== '1' || s.mixBlendMode !== 'normal' ? `op=${s.opacity} mix=${s.mixBlendMode}` : '',
      tf: s.transform === 'none' ? '' : s.transform,
    };
  }
  return JSON.stringify(out, null, 1);
};
