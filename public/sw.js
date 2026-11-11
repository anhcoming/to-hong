// Service worker cho sổ tay cưới (PWA): mở được khi mạng chập chờn.
// Trang sổ tay & file của nó: lấy mạng trước, lỗi mạng thì dùng bản đã lưu. API: luôn lấy mạng (dữ liệu dùng chung nhiều người).
// Chỉ phục vụ bản lưu cho chính /so-tay: trang khác (trang chủ, thiệp…) khi mất mạng để trình duyệt báo lỗi bình thường,
// không được trả vỏ sổ tay thay vào (trước đây mở / lúc máy chủ đang khởi động lại ra trang sổ tay trống).
const CACHE = 'cuoi-nha-v2';
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
  if (!isShell) return; // trang khác, thiệp, LED, video… để trình duyệt tự xử lý
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok && isShell) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(url.pathname, copy)); }
      return res;
    }).catch(() => caches.match(url.pathname).then((r) => r || Response.error())),
  );
});
