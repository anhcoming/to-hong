// Service worker cho sổ tay cưới (PWA): mở được khi mạng chập chờn.
// Trang & file tĩnh: lấy mạng trước, lỗi mạng thì dùng bản đã lưu. API: luôn lấy mạng (dữ liệu dùng chung nhiều người).
const CACHE = 'cuoi-nha-v1';
const SHELL = ['/so-tay', '/css/app.css', '/css/planner.css', '/js/common.js', '/js/planner.js', '/js/lunar.js', '/favicon.svg', '/icons/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) return;
  const isShell = SHELL.includes(url.pathname);
  if (!isShell && req.mode !== 'navigate') return; // thiệp, LED, video… để trình duyệt tự xử lý
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok && isShell) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(url.pathname, copy)); }
      return res;
    }).catch(() => caches.match(isShell ? url.pathname : '/so-tay').then((r) => r || Response.error())),
  );
});
