// Chặn mở công cụ nhà phát triển (F12) trên các trang khách xem: trang giới thiệu, trang mẫu, thiệp gửi khách.
// Chỉ là rào cản cho người xem tò mò / chép mẫu nhanh — người rành vẫn vượt được (tắt điểm dừng, xem mã nguồn bằng
// công cụ khác), nên đừng dựa vào nó để giấu thứ gì bí mật.
// - Phím tắt mở công cụ (F12, Ctrl/Cmd+Shift+I/J/C, Cmd+Option+I/J/C, Ctrl/Cmd+U) bị bỏ qua.
// - Công cụ đang mở thì trình duyệt dừng liên tục ở lệnh `debugger` (không mở thì lệnh này không làm gì, không tốn gì).
// Máy của chủ web (cookie cn_me, xem lib/stats.js) nhận bản rỗng — máy chủ quyết định, không lộ cách tắt ra ngoài.
// Phục vụ ở /js/cn-guard.js qua máy chủ (không phải tệp tĩnh) để Vercel không trả bản dựng sẵn cho mọi máy.
const source = `(function () {
  'use strict';
  if (window.__cnGuard) return;
  window.__cnGuard = 1;
  var h = location.hostname;
  if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || /\\.(local|test)$/.test(h)) return;
  // trong khung xem trước của trình sửa / trang quản trị: không chặn
  try { if (window.top !== window.self) return; } catch (e) { return; }
  var KEYS = { KeyI: 1, KeyJ: 1, KeyC: 1 };
  document.addEventListener('keydown', function (e) {
    var mod = e.ctrlKey || e.metaKey;
    if (e.key === 'F12' || e.keyCode === 123
      || (mod && (e.shiftKey || e.altKey) && KEYS[e.code])
      || (mod && e.code === 'KeyU')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
  var trap = Function('debugger');
  setInterval(function () { trap(); }, 500);
})();
`;

module.exports = { source };
