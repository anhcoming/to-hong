// Tiện ích dùng chung cho các trang ứng dụng
window.$ = (s, r) => (r || document).querySelector(s);
window.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));

// ---------- màn chờ toàn màn hình ----------
// Hiện sau 250ms (thao tác nhanh thì không nháy), đếm số việc đang chờ: còn việc nào thì còn hiện.
// loading.show('Đang lưu…') / loading.text('…') / loading.hide(); withLoading('Đang…', async () => {...})
window.loading = (() => {
  let n = 0, timer = null, el = null, label = 'Đang tải…';
  function mount() {
    if (el) return el;
    const st = document.createElement('style');
    st.textContent = `#gload{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;align-content:center;gap:16px;background:rgba(18,10,12,.45);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);color:#fff;text-align:center;opacity:0;transition:opacity .18s;cursor:progress}
#gload.on{opacity:1}
#gload svg{width:62px;height:62px;color:#ff8fa3;filter:drop-shadow(0 0 18px rgba(255,120,145,.55));animation:glbeat 1.1s ease-in-out infinite}
#gload span{max-width:80vw;font-size:15px;font-weight:700;letter-spacing:.01em;text-shadow:0 1px 8px rgba(0,0,0,.35)}
@keyframes glbeat{0%,100%{transform:scale(1)}15%{transform:scale(1.18)}30%{transform:scale(1)}45%{transform:scale(1.12)}60%{transform:scale(1)}}
@media (prefers-reduced-motion:reduce){#gload svg{animation-duration:3s}}`;
    document.head.appendChild(st);
    el = document.createElement('div');
    el.id = 'gload';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    // trái tim thương hiệu đập nhẹ trên nền mờ (không có hộp trắng)
    el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.6C1.5 7.4 3.7 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.5 0 5.7 3.4 4.5 6.9-1.8 5-9.3 9.6-9.3 9.6z" fill="currentColor" fill-opacity=".25"/></svg><span></span>';
    return el;
  }
  function render() { if (el) el.querySelector('span').textContent = label; }
  return {
    show(text) {
      label = text || 'Đang tải…';
      n++;
      render();
      if (n === 1 && !timer) {
        timer = setTimeout(() => {
          timer = null;
          if (!n) return;
          document.body.appendChild(mount());
          render();
          requestAnimationFrame(() => el && el.classList.add('on'));
        }, 250);
      }
    },
    text(t) { label = t; render(); },
    hide() {
      n = Math.max(0, n - 1);
      if (n) return;
      clearTimeout(timer); timer = null;
      if (el && el.parentNode) { el.classList.remove('on'); el.remove(); }
    },
  };
})();
window.withLoading = async function (text, fn) {
  loading.show(text);
  try { return await fn(); } finally { loading.hide(); }
};

// ---------- thanh chạy mảnh trên cùng: chờ đọc dữ liệu (GET), chờ trang kế tiếp mở ----------
// Không che màn hình (khác màn chờ ở trên): chỉ báo "đang làm" để màn không đứng im. Hiện sau 300ms, đếm số việc.
window.progress = (() => {
  let n = 0, timer = null, el = null;
  function mount() {
    if (el) return el;
    el = document.createElement('div'); el.id = 'gbar'; el.setAttribute('aria-hidden', 'true'); el.innerHTML = '<i></i>';
    return el;
  }
  return {
    start() {
      n++;
      if (n === 1 && !timer) timer = setTimeout(() => { timer = null; if (n) { document.body.appendChild(mount()); requestAnimationFrame(() => el && el.classList.add('on')); } }, 300);
    },
    done() {
      n = Math.max(0, n - 1);
      if (n) return;
      clearTimeout(timer); timer = null;
      if (el && el.parentNode) { el.classList.remove('on'); setTimeout(() => { if (!n && el) el.remove(); }, 200); }
    },
    reset() { n = 1; this.done(); },
  };
})();
// kiểu dùng chung: thanh chạy + nút đang chạy (vòng xoay nhỏ trước chữ)
(() => {
  const st = document.createElement('style');
  st.textContent = `#gbar{position:fixed;left:0;right:0;top:0;height:3px;z-index:10000;overflow:hidden;pointer-events:none;opacity:0;transition:opacity .2s}
#gbar.on{opacity:1}
#gbar i{position:absolute;top:0;bottom:0;left:-40%;width:40%;border-radius:3px;background:linear-gradient(90deg,transparent,#d6455d,#ef7d8d,transparent);animation:gbar 1.1s ease-in-out infinite}
@keyframes gbar{to{left:100%}}
.pageload{display:grid;place-items:center;align-content:center;gap:14px;min-height:55vh;color:var(--muted,#8f7f82);font-size:15px;font-weight:600;text-align:center}
.pageload i{width:34px;height:34px;border-radius:50%;border:3px solid rgba(214,69,93,.2);border-top-color:#d6455d;animation:gspin .8s linear infinite}
.pageload.bad i{display:none}
.is-busy{cursor:progress!important;opacity:.85}
.is-busy::before{content:"";display:inline-block;flex:none;width:.95em;height:.95em;margin-right:.5em;vertical-align:-.12em;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:gspin .7s linear infinite}
@keyframes gspin{to{transform:rotate(360deg)}}`;
  document.head.appendChild(st);
})();
// Nút vừa bấm (hoặc nút gửi form) → khi việc gửi dữ liệu chạy ngay sau đó thì khoá nút + vòng xoay tới lúc xong,
// tránh bấm hai lần gửi trùng trong lúc chờ. Không cần sửa từng nút.
let lastPress = null;
document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('button,.btn,[role=button]'); if (b) lastPress = { el: b, t: Date.now() }; }, true);
document.addEventListener('submit', (e) => { const b = e.submitter || (e.target.querySelector && e.target.querySelector('[type=submit],button:not([type=button])')); if (b) lastPress = { el: b, t: Date.now() }; }, true);
window.busyBtn = function (btn) {
  if (!btn || btn.classList.contains('is-busy')) return () => {};
  const was = btn.disabled;
  btn.classList.add('is-busy'); btn.setAttribute('aria-busy', 'true');
  if ('disabled' in btn) btn.disabled = true;
  return () => { btn.classList.remove('is-busy'); btn.removeAttribute('aria-busy'); if ('disabled' in btn) btn.disabled = was; };
};
function pressedBtn() {
  const p = lastPress;
  if (!p || Date.now() - p.t > 1500 || !p.el.isConnected) return null;
  lastPress = null;
  return p.el;
}
// rời trang (bấm link, chuyển trang sau khi tạo thiệp, đăng xuất…) → thanh chạy tới lúc trang mới hiện
window.addEventListener('beforeunload', () => { progress.start(); setTimeout(() => progress.reset(), 8000); });
window.addEventListener('pageshow', (e) => { if (e.persisted) progress.reset(); });

// opts.quiet: không hiện màn chờ (tự lưu, chỉnh nhanh tại chỗ, việc chạy nền); opts.loadingText: chữ trên màn chờ.
// Đọc dữ liệu (GET) không im lặng: thanh chạy mảnh trên cùng (không che màn hình).
// Ghi dữ liệu: màn chờ + khoá nút vừa bấm.
window.api = async function (url, opts = {}) {
  const method = opts.method || 'GET';
  const busy = method !== 'GET' && !opts.quiet;
  const bar = method === 'GET' && !opts.quiet;
  const unbusy = busy ? busyBtn(pressedBtn()) : null;
  if (busy) loading.show(opts.loadingText);
  if (bar) progress.start();
  try { return await apiCall(url, opts); } finally { if (busy) { loading.hide(); unbusy(); } if (bar) progress.done(); }
};
async function apiCall(url, opts) {
  const init = { method: opts.method || 'GET', headers: {} };
  if (opts.body !== undefined) {
    if (opts.body instanceof Blob) {
      init.body = opts.body;
      init.headers['Content-Type'] = opts.body.type;
    } else {
      init.body = JSON.stringify(opts.body);
      init.headers['Content-Type'] = 'application/json';
    }
  }
  // opts.timeout (ms): mạng di động đôi khi treo kết nối không báo lỗi → tự huỷ để khỏi chờ mãi
  let timer = null;
  if (opts.timeout) {
    const ac = new AbortController();
    init.signal = ac.signal;
    timer = setTimeout(() => ac.abort(), opts.timeout);
  }
  let r, j;
  try {
    r = await fetch(url, init);
    j = await r.json().catch(() => ({}));
  } catch (e) {
    if (e && e.name === 'AbortError') throw Object.assign(new Error('Mạng chậm quá, chưa gửi xong'), { timeout: true });
    throw Object.assign(new Error('Mất kết nối mạng, vui lòng thử lại'), { network: true });
  } finally { clearTimeout(timer); }
  if (r.status === 401 && !opts.allow401) {
    location.href = '/dang-nhap?next=' + encodeURIComponent(location.pathname + location.search);
    throw new Error('Bạn cần đăng nhập');
  }
  if (!r.ok) throw Object.assign(new Error(j.error || 'Có lỗi xảy ra'), { status: r.status });
  return j;
}

window.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
window.money = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';
window.fmtDate = (t) => t ? new Date(t).toLocaleDateString('vi-VN') : '';
window.fmtDateTime = (t) => t ? new Date(t).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '';

window.toast = function (msg, bad) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.toggle('bad', !!bad);
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2600);
};

window.copyText = async function (text, msg) {
  try { await navigator.clipboard.writeText(text); toast(msg || 'Đã sao chép'); }
  catch { window.prompt('Sao chép nội dung này', text); }
};

// Nút ← của trang sửa: quay về đúng trang vừa đứng trước đó (danh sách thiệp hoặc trang sửa thiệp);
// mở thẳng từ link/đăng nhập thì đi theo href mặc định.
window.backTo = function (a, fallback) {
  a.href = fallback;
  a.onclick = (e) => {
    const ref = document.referrer;
    if (!ref.startsWith(location.origin + '/') || ref === location.href || ref.includes('/dang-nhap') || history.length < 2) return;
    e.preventDefault();
    history.back();
  };
};
// onClose(): gọi khi cửa sổ đóng (bấm ×, bấm ra ngoài, Esc hoặc close() từ trong)
window.openModal = function (html, onMount, onClose) {
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true"><button class="modal-x" aria-label="Đóng">×</button>${html}</div>`;
  const close = () => { if (!m.isConnected) return; m.remove(); document.removeEventListener('keydown', onKey); if (onClose) onClose(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('.modal-x')) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(m);
  const box = m.querySelector('.modal-box');
  modalHead(box);
  box.addEventListener('scroll', () => { const h = box.querySelector(':scope > .modal-head'); if (h) h.classList.toggle('stuck', box.scrollTop > 2); }, { passive: true });
  if (onMount) onMount(box, close);
  return close;
};
// Đầu cửa sổ (tiêu đề h2 đứng đầu + nút ×) đứng yên khi cuộn nội dung dài. Cửa sổ không mở đầu bằng h2 thì chỉ giữ nút ×.
// Cửa sổ tự vẽ lại nội dung (vd. thanh toán) gọi lại hàm này sau khi vẽ.
window.modalHead = function modalHead(box) {
  const x = box && box.querySelector(':scope > .modal-x');
  if (!x || x.parentElement.classList.contains('modal-head')) return;
  let h = x.nextElementSibling;
  while (h && h.tagName === 'STYLE') h = h.nextElementSibling;
  const head = document.createElement('div');
  head.className = 'modal-head';
  x.before(head);
  if (h && h.tagName === 'H2') head.append(h, x); else { head.classList.add('only-x'); head.append(x); }
};

// Giảm kích thước ảnh trước khi tải lên (tiết kiệm băng thông 4G cho khách mở thiệp)
window.resizeImage = function (file, maxSide = 1600, quality = 0.85) {
  // có hạn giờ: ảnh hỏng/quá nặng hoặc ảnh còn nằm trên mây (Google Photos) có thể không bao giờ báo xong
  return new Promise((resolve, reject) => {
    const stop = setTimeout(() => reject(new Error('Đọc ảnh quá lâu — thử chọn ảnh khác hoặc chụp màn hình ảnh rồi tải lên')), 30000);
    const ok = (b) => { clearTimeout(stop); resolve(b); };
    const no = (e) => { clearTimeout(stop); reject(e); };
    _resize(file, maxSide, quality, ok, no);
  });
};
function _resize(file, maxSide, quality, resolve, reject) {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    // WebP nhẹ hơn JPEG ~30% cùng độ nét; trình duyệt chưa nén được WebP thì trả về PNG → dùng JPEG
    c.toBlob((w) => {
      if (w && w.type === 'image/webp') return resolve(w);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('Không đọc được ảnh'))), 'image/jpeg', quality);
    }, 'image/webp', 0.82);
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Không đọc được ảnh này (ảnh HEIC/HEIF? hãy chọn ảnh JPG/PNG)')); };
  img.src = url;
}

// ---------- tải tệp lên ----------
// Ảnh: nếu web có kho Vercel Blob thì gửi thẳng từ trình duyệt lên Blob (máy chủ chỉ cấp vé) — đỡ một chặng
// điện thoại → máy chủ → Blob; lỗi thì quay về cách cũ (gửi qua /api/upload). Nhạc luôn gửi qua máy chủ.
// Mỗi lần tải ghi thời gian từng bước ra console ("[tải ảnh] …") để biết chậm ở đâu.
const once = (fn) => { let p; return () => (p = p || fn().catch((e) => { p = null; throw e; })); };
const uploadInfo = once(async () => {
  const [meta, me] = await Promise.all([window.META ? window.META : fetch('/api/meta').then((r) => r.json()), fetch('/api/me').then((r) => r.json())]);
  return { blob: !!meta.blobUpload, uid: me.user && me.user.id };
});
const blobClient = once(() => (window.BlobClient ? Promise.resolve(window.BlobClient) : new Promise((ok, no) => {
  const s = document.createElement('script');
  s.src = '/vendor/blob-client.js';
  s.onload = () => (window.BlobClient ? ok(window.BlobClient) : no(new Error('Không nạp được thư viện tải ảnh')));
  s.onerror = () => no(new Error('Không nạp được thư viện tải ảnh'));
  document.head.appendChild(s);
})));
// gọi sớm (vd. lúc vừa chọn ảnh) để lúc tải không phải chờ nạp thư viện
window.warmUpload = () => uploadInfo().then((i) => (i.blob ? blobClient() : null)).catch(() => {});
const EXT = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' };
async function blobDirect(file, info) {
  const BC = await blobClient();
  const ac = new AbortController();
  const stop = setTimeout(() => ac.abort(), file.type.startsWith('video/') ? 300000 : 45000);
  try {
    const name = `uploads/${info.uid}-${Math.random().toString(36).slice(2, 10)}.${EXT[file.type]}`;
    const r = await BC.upload(name, file, { access: 'public', contentType: file.type, handleUploadUrl: '/api/upload/blob', abortSignal: ac.signal });
    return r.url;
  } finally { clearTimeout(stop); }
}
async function viaServer(file, quiet) {
  // mỗi lần gửi tối đa 45s (máy chủ tự dừng ở 30s); lỗi mạng / quá giờ / máy chủ lỗi thì tự thử lại thêm 2 lần
  for (let k = 0; ; k++) {
    try {
      return (await api('/api/upload', { method: 'POST', body: file, quiet: true, timeout: 45000 })).url;
    } catch (e) {
      const again = e.timeout || e.network || e.status >= 500;
      if (!again || k >= 2) throw e;
      if (!quiet) loading.text('Mạng chậm, đang thử lại…');
      await new Promise((ok) => setTimeout(ok, 1500 * (k + 1)));
    }
  }
}

// quiet: để uploadFiles tự quản màn chờ (hiện tiến độ chung), khỏi mỗi tệp một màn chờ
// resized: tệp đã qua resizeImage rồi (khỏi nén lại lần nữa)
window.uploadFile = async function (file, { quiet = false, resized = false } = {}) {
  const isImg = file.type.startsWith('image/'), isClip = /^video\/(mp4|webm|quicktime)$/.test(file.type);
  if (!isImg && !isClip && file.type !== 'audio/mpeg') throw new Error('Chỉ nhận ảnh, video MP4/MOV hoặc nhạc MP3');
  if (isClip && file.size > 60e6) throw new Error('Video tối đa 60MB — cắt ngắn đoạn clip rồi thử lại nhé');
  if (!quiet) loading.show(isImg ? 'Đang tải ảnh lên…' : 'Đang tải nhạc lên…');
  const t0 = performance.now(), log = {};
  try {
    if (isImg && !resized) { file = await resizeImage(file); log.nen = Math.round(performance.now() - t0); }
    if ((isImg || isClip) && EXT[file.type]) {
      const info = await uploadInfo().catch(() => ({}));
      if (info.blob && info.uid) {
        const t1 = performance.now();
        try {
          const url = await blobDirect(file, info);
          log.blob = Math.round(performance.now() - t1);
          return url;
        } catch (e) {
          log.blobLoi = e.message; // gửi thẳng không được → gửi qua máy chủ như cũ
        }
      }
    }
    const t2 = performance.now();
    const url = await viaServer(file, quiet);
    log.mayChu = Math.round(performance.now() - t2);
    return url;
  } finally {
    if (!quiet) loading.hide();
    console.info('[tải ảnh]', JSON.stringify({ kb: Math.round(file.size / 1024), ...log, tong: Math.round(performance.now() - t0) }));
  }
};
// bỏ ảnh đã tải lên nhưng không dùng (máy chủ chỉ xoá khi chưa thiệp nào dùng)
window.discardUpload = (url) => { if (url) api('/api/upload/discard', { method: 'POST', body: { url }, quiet: true }).catch(() => {}); };

// Tải nhiều tệp cùng lúc (mặc định 4 tệp song song), giữ đúng thứ tự. Trả về mảng link ('' nếu tệp đó lỗi).
// onProgress(xong, tổng) để hiện tiến độ; onError(lỗi) cho từng tệp hỏng.
window.uploadFiles = async function (files, { limit = 4, onProgress, onError } = {}) {
  const out = new Array(files.length).fill('');
  let next = 0, done = 0;
  const tell = () => { loading.text(files.length > 1 ? `Đang tải ảnh lên ${done}/${files.length}…` : 'Đang tải ảnh lên…'); if (onProgress) onProgress(done, files.length); };
  loading.show();
  tell();
  async function worker() {
    while (next < files.length) {
      const i = next++;
      try { out[i] = await uploadFile(files[i], { quiet: true }); } catch (e) { if (onError) onError(e); }
      done++;
      tell();
    }
  }
  try { await Promise.all(Array.from({ length: Math.min(limit, files.length) }, worker)); } finally { loading.hide(); }
  return out;
};

// Thanh trên cho các trang đã đăng nhập
window.renderTopbar = async function (active) {
  const meta = await fetch('/api/meta').then((r) => r.json());
  const me = await fetch('/api/me').then((r) => r.json());
  window.META = meta;
  // Kiểu "đồ của tôi": máy tính = logo · 3 tab Thiệp / Video / Sổ tay · Xem mẫu · ＋ Tạo mới · ảnh đại diện (menu tài khoản);
  // điện thoại = thanh trên chỉ logo + ảnh đại diện, thanh tab dưới cùng: Thiệp · Video · ＋ · Sổ tay · Tôi
  const u = me.user;
  const ini = u ? (String(u.name || u.email || '?').trim().split(/\s+/).map((w) => w[0]).slice(-2).join('') || '?').toUpperCase() : '';
  const TABS = [['/thiep-cua-toi', 'Thiệp', 'cards', '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5 12 13l8.5-6.5"/>'],
    ['/video-cua-toi', 'Video', 'videos', '<rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="m16 10.5 5-3v9l-5-3"/>'],
    ['/so-tay', 'Sổ tay', 'planner', '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/><path d="M9 8h6M9 11.5h4"/>']];
  const ic = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const NEW = `<a href="/mau-thiep"><b>Thiệp cưới</b><small>Chọn mẫu, điền tên là xong</small></a><a href="/slide-cuoi"><b>Slide / video cưới</b><small>Ảnh cưới chiếu TV, tải MP4</small></a><a href="/man-hinh-led-dam-cuoi"><b>Màn hình LED</b><small>Trình chiếu tên đôi tại tiệc</small></a>`;
  const ACCT = u ? `<div class="who"><b>${esc(u.name || '')}</b>${esc(u.email)}</div><a href="/">Trang chủ</a><a href="/mau-thiep">Xem mẫu thiệp</a><a href="#" data-tb-theme>Đổi nền sáng / tối</a><a href="#" id="logoutBtn">Đăng xuất</a>` : '';
  // menu ☰ (điện thoại): cùng các mục với thanh trên của trang chủ / trang giới thiệu (public/js/site.js → MENU)
  const MENU = [['/mau-thiep', 'Thiệp cưới'], ['/slide-cuoi', 'Slide cưới'], ['/man-hinh-led-dam-cuoi', 'Màn hình LED'], ['/video-dam-ngo', 'Video dạm ngõ'], ['/video', 'Video báo hỷ <em>Miễn phí</em>'], ['/so-tay-cuoi', 'Sổ tay cưới']]
    .map(([h, n]) => `<a href="${h}">${n}</a>`).join('');
  const bar = document.createElement('header');
  bar.className = 'topbar tb';
  bar.innerHTML = `<div class="wrap">
    <a class="logo" href="/"><span class="lw">${esc(meta.brand)}</span><svg class="lh" viewBox="0 0 32 30" aria-hidden="true"><path d="M16 28C6.5 21 3 16 3 11.5 3 7.9 5.8 5 9.4 5c2.6 0 4.6 1.4 6.6 3.9C18 6.4 20 5 22.6 5 26.2 5 29 7.9 29 11.5 29 16 25.5 21 16 28z"/></svg></a>
    ${u ? `<nav class="tb-tabs" aria-label="Của tôi">${TABS.map(([h, n, k]) => `<a href="${h}"${k === active ? ' class="on" aria-current="page"' : ''}>${n}</a>`).join('')}</nav>` : ''}
    <span class="tb-sp"></span>
    ${u ? (active === 'cards'
      ? `<div class="tb-dd tb-mmain"><button type="button" class="btn sm" aria-expanded="false">＋ Tạo mới</button><div class="tb-menu">${NEW}</div></div>`
      : '<a class="btn sm tb-mmain" href="/thiep-cua-toi">Thiệp của tôi</a>') : ''}
    <div class="tb-dd tb-burger"><button type="button" aria-label="Mở menu" aria-expanded="false"><i></i></button><div class="tb-menu">${MENU}${ACCT ? '<hr>' + ACCT.replace('id="logoutBtn"', 'data-tb-out') : '<a href="/">Trang chủ</a>'}</div></div>
    ${window.themeBtn ? themeBtn() : ''}
    ${u ? `<a class="tb-link" href="/mau-thiep">Xem mẫu</a>
      <div class="tb-dd tb-new"><button type="button" class="tb-newbtn" aria-expanded="false">＋ Tạo mới</button><div class="tb-menu">${NEW}</div></div>
      <div class="tb-dd tb-me"><button type="button" class="tb-av" aria-label="Tài khoản" aria-expanded="false">${esc(ini)}</button><div class="tb-menu">${ACCT}</div></div>`
      : '<a href="/dang-nhap" class="btn sm">Đăng nhập</a>'}
  </div>`;
  document.body.prepend(bar);
  if (u) { // thanh tab dưới cùng (điện thoại) — mọi trang sau đăng nhập, kể cả sổ tay
    const bt = document.createElement('nav');
    bt.className = 'tb-bottom'; bt.setAttribute('aria-label', 'Của tôi');
    bt.innerHTML = TABS.slice(0, 2).map(([h, n, k, d]) => `<a href="${h}"${k === active ? ' class="on"' : ''}><i>${ic(d)}</i>${n}</a>`).join('')
      + `<div class="tb-dd tb-plus"><button type="button" aria-label="Tạo mới" aria-expanded="false"><i>＋</i>Tạo mới</button><div class="tb-menu up">${NEW}</div></div>`
      + TABS.slice(2).map(([h, n, k, d]) => `<a href="${h}"${k === active ? ' class="on"' : ''}><i>${ic(d)}</i>${n}</a>`).join('')
      + `<div class="tb-dd tb-me2"><button type="button" aria-label="Tài khoản" aria-expanded="false"><i class="av">${esc(ini)}</i>Tôi</button><div class="tb-menu up right">${ACCT.replace('id="logoutBtn"', 'data-tb-out')}</div></div>`;
    document.body.appendChild(bt);
    document.body.classList.add('has-tb-bottom');
  }
  // menu thả xuống (Tạo mới, tài khoản): bấm mở / bấm ra ngoài hoặc Esc thì đóng
  const dds = $$('.tb-dd');
  const closeAll = (except) => dds.forEach((d) => { if (d !== except) { d.classList.remove('open'); const b = $('button', d); if (b) b.setAttribute('aria-expanded', 'false'); } });
  dds.forEach((d) => { const b = $('button', d); b.onclick = (e) => { e.stopPropagation(); const on = !d.classList.contains('open'); closeAll(d); d.classList.toggle('open', on); b.setAttribute('aria-expanded', on); }; });
  document.addEventListener('click', (e) => { if (!e.target.closest('.tb-dd')) closeAll(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
  document.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-tb-theme],#logoutBtn,[data-tb-out]'); if (!t) return;
    e.preventDefault();
    if (t.hasAttribute('data-tb-theme')) { closeAll(); if (window.toggleTheme) toggleTheme(); return; }
    await api('/api/auth/logout', { method: 'POST' }); location.href = '/';
  });
  return { meta, user: u };
};


// bộ chọn ngày / giờ theo giao diện Cưới Nha (máy có chuột) cho mọi ô ngày, giờ trên các trang dùng common.js
(function () { const s = document.createElement('script'); s.src = '/js/pickers.js'; s.defer = true; document.head.appendChild(s); })();
