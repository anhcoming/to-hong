// Phiên bản đang chạy (v1.1…), chữ nhỏ mờ ở góc dưới bên phải — để biết bản mới đã lên chưa. Không bấm được, không che gì.
(function () {
  if (document.getElementById('appVer')) return;
  fetch('/api/version', { cache: 'no-store' }).then((r) => r.json()).then((d) => {
    if (!d || !d.v || document.getElementById('appVer')) return;
    const el = document.createElement('div');
    el.id = 'appVer';
    el.textContent = d.v;
    el.style.cssText = 'position:fixed;right:6px;bottom:calc(env(safe-area-inset-bottom,0px) + 3px);z-index:2147483000;font:10px/1 ui-monospace,Menlo,monospace;color:#888;opacity:.45;pointer-events:none;user-select:none;letter-spacing:.02em';
    document.body.appendChild(el);
  }).catch(() => {});
})();
