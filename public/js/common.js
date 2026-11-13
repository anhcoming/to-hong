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
  const r = await fetch(url, init);
  const j = await r.json().catch(() => ({}));
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
window.openModal = function (html, onMount) {
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true"><button class="modal-x" aria-label="Đóng">×</button>${html}</div>`;
  const close = () => { m.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('.modal-x')) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(m);
  if (onMount) onMount(m.querySelector('.modal-box'), close);
  return close;
};

// Giảm kích thước ảnh trước khi tải lên (tiết kiệm băng thông 4G cho khách mở thiệp)
window.resizeImage = function (file, maxSide = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
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
    img.onerror = () => reject(new Error('Tệp không phải ảnh hợp lệ'));
    img.src = url;
  });
};

// quiet: để uploadFiles tự quản màn chờ (hiện tiến độ chung), khỏi mỗi tệp một màn chờ
window.uploadFile = async function (file, { quiet = false } = {}) {
  const isImg = file.type.startsWith('image/');
  if (!isImg && file.type !== 'audio/mpeg') throw new Error('Chỉ nhận ảnh hoặc nhạc MP3');
  if (!quiet) loading.show(isImg ? 'Đang tải ảnh lên…' : 'Đang tải nhạc lên…');
  try {
    if (isImg) file = await resizeImage(file);
    const r = await api('/api/upload', { method: 'POST', body: file, quiet: true });
    return r.url;
  } finally { if (!quiet) loading.hide(); }
};

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
