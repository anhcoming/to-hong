// Chế độ nền sáng / tối dùng chung mọi trang (trừ trang thiệp mời). Nạp trong <head> để đặt
// data-theme trước khi vẽ trang, tránh nháy trắng. Lựa chọn lưu ở localStorage, mặc định nền sáng.
(function () {
  var KEY = 'cn-theme';
  var root = document.documentElement;
  var t = null;
  try { t = localStorage.getItem(KEY); } catch (e) { /* trình duyệt chặn lưu trữ: dùng mặc định */ }
  root.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');

  var label = function () { return root.getAttribute('data-theme') === 'dark' ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'; };
  window.toggleTheme = function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem(KEY, next); } catch (e) { /* không lưu được thì chỉ đổi trang này */ }
    document.querySelectorAll('.theme-btn').forEach(function (b) { b.setAttribute('aria-label', label()); b.title = label(); });
  };
  // nút tròn: hiện mặt trăng khi đang sáng, mặt trời khi đang tối (CSS chọn icon theo data-theme)
  window.themeBtn = function (extra) {
    return '<button type="button" class="theme-btn' + (extra ? ' ' + extra : '') + '" onclick="toggleTheme()" aria-label="' + label() + '" title="' + label() + '">' +
      '<svg class="i-moon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>' +
      '<svg class="i-sun" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button>';
  };
})();
