// Chạy trong trang GỐC: in cây DOM dạng `tag[classes] chữ` để đọc kích thước Tailwind (kể cả sm:/md:/lg:).
// Dùng: dán file, rồi `__dumpClasses(phần_tử_gốc)` (bỏ trống = tự tìm cột thiệp max-w-[480px]).
// Chạy một lần trước khi mở thiệp (màn mở thiệp) và một lần sau khi mở (nội dung).
// Các phần tử trùng class (ô lịch, thẻ lời chúc…) chỉ in lần đầu, trừ khi có chữ khác.
window.__dumpClasses = (root, { maxLines = 400 } = {}) => {
  // cột thiệp của bản gốc thường là phần tử max-w-[480px]; có thể còn ẩn trước khi bấm mở thiệp
  root = root || document.querySelector('[class*="max-w-[480px]"]') || document.body;
  const own = (e) => [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').normalize('NFC').slice(0, 32);
  const seen = new Set();
  const lines = [];
  const walk = (e, d) => {
    if (['path', 'svg', 'g', 'circle', 'IFRAME', 'SCRIPT', 'STYLE'].includes(e.tagName) || lines.length >= maxLines) return;
    const cls = String(e.className).replace(/jsx-\w+ ?/g, '').trim();
    const key = e.tagName + '|' + cls;
    const t = own(e);
    if (!seen.has(key) || (t && !/^\d+$/.test(t) && !seen.has(key + t))) {
      seen.add(key); seen.add(key + t);
      const src = e.tagName === 'IMG' ? ' src=' + (e.currentSrc || e.src).split('/').pop().split('?')[0] : '';
      const st = e.getAttribute('style') ? ' style="' + e.getAttribute('style').slice(0, 120) + '"' : '';
      lines.push(`${' '.repeat(d)}${e.tagName.toLowerCase()}[${cls}]${src}${st} ${t}`);
    }
    for (const k of e.children) walk(k, d + 1);
  };
  walk(root, 0);
  return lines.join('\n');
};
