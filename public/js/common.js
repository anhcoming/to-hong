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

// opts.quiet: không hiện màn chờ (tự lưu, chỉnh nhanh tại chỗ, việc chạy nền); opts.loadingText: chữ trên màn chờ.
// Chỉ request ghi dữ liệu (POST/PUT/DELETE) mới hiện màn chờ; đọc dữ liệu (GET) thì không.
window.api = async function (url, opts = {}) {
  const method = opts.method || 'GET';
  const busy = method !== 'GET' && !opts.quiet;
  if (busy) loading.show(opts.loadingText);
  try { return await apiCall(url, opts); } finally { if (busy) loading.hide(); }
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
const EXT = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };
async function blobDirect(file, info) {
  const BC = await blobClient();
  const ac = new AbortController();
  const stop = setTimeout(() => ac.abort(), 45000);
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
  const isImg = file.type.startsWith('image/');
  if (!isImg && file.type !== 'audio/mpeg') throw new Error('Chỉ nhận ảnh hoặc nhạc MP3');
  if (!quiet) loading.show(isImg ? 'Đang tải ảnh lên…' : 'Đang tải nhạc lên…');
  const t0 = performance.now(), log = {};
  try {
    if (isImg && !resized) { file = await resizeImage(file); log.nen = Math.round(performance.now() - t0); }
    if (isImg && EXT[file.type]) {
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
  const bar = document.createElement('header');
  bar.className = 'topbar';
  bar.innerHTML = `<div class="wrap">
    <a class="logo" href="/"><span class="lw">${esc(meta.brand)}</span><svg class="lh" viewBox="0 0 32 30" aria-hidden="true"><path d="M16 28C6.5 21 3 16 3 11.5 3 7.9 5.8 5 9.4 5c2.6 0 4.6 1.4 6.6 3.9C18 6.4 20 5 22.6 5 26.2 5 29 7.9 29 11.5 29 16 25.5 21 16 28z"/></svg></a>
    <nav class="nav">
      ${me.user ? `
        <a href="/thiep-cua-toi" class="${active === 'cards' ? 'on' : ''}">Thiệp<span class="hide-xs"> cưới</span></a>
        <a href="/video-cua-toi" class="${active === 'videos' ? 'on' : ''}">Video<span class="hide-xs"> cưới</span></a>
        <a href="/so-tay" class="${active === 'planner' ? 'on' : ''}">Sổ tay<span class="hide-xs"> cưới</span></a>
        ${window.themeBtn ? themeBtn() : ''}
        <div class="acct" id="acct"><a href="/thiep-cua-toi"><span class="hide-xs">Thiệp của tôi</span><span class="show-xs">Của tôi</span></a><button type="button" aria-label="Tài khoản" aria-expanded="false"></button>
          <div class="acct-menu"><div class="who"><b>${esc(me.user.name || '')}</b>${esc(me.user.email)}</div><a href="/">Trang chủ</a><a href="#" class="theme-item" onclick="toggleTheme();return false">Đổi nền sáng / tối</a><a href="#" id="logoutBtn">Đăng xuất</a></div></div>` : `${window.themeBtn ? themeBtn() : ''}<a href="/dang-nhap" class="btn sm">Đăng nhập</a>`}
    </nav></div>`;
  document.body.prepend(bar);
  const lo = $('#logoutBtn');
  if (lo) lo.onclick = async (e) => { e.preventDefault(); await api('/api/auth/logout', { method: 'POST' }); location.href = '/'; };
  const acct = $('#acct');
  if (acct) {
    const btn = $('button', acct);
    const set = (on) => { acct.classList.toggle('open', on); btn.setAttribute('aria-expanded', on); };
    btn.onclick = () => set(!acct.classList.contains('open'));
    document.addEventListener('click', (e) => { if (!e.target.closest('#acct')) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
  }
  return { meta, user: me.user };
};
