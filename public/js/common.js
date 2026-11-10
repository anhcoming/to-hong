// Tiện ích dùng chung cho các trang ứng dụng
window.$ = (s, r) => (r || document).querySelector(s);
window.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));

window.api = async function (url, opts = {}) {
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
};

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
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('Không đọc được ảnh'))), 'image/jpeg', quality);
    };
    img.onerror = () => reject(new Error('Tệp không phải ảnh hợp lệ'));
    img.src = url;
  });
};

window.uploadFile = async function (file) {
  if (file.type.startsWith('image/')) file = await resizeImage(file);
  else if (file.type !== 'audio/mpeg') throw new Error('Chỉ nhận ảnh hoặc nhạc MP3');
  const r = await api('/api/upload', { method: 'POST', body: file });
  return r.url;
};

// Thanh trên cho các trang đã đăng nhập
window.renderTopbar = async function (active) {
  const meta = await fetch('/api/meta').then((r) => r.json());
  const me = await fetch('/api/me').then((r) => r.json());
  window.META = meta;
  const bar = document.createElement('header');
  bar.className = 'topbar';
  bar.innerHTML = `<div class="wrap">
    <a class="logo" href="/"><svg viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="lga" x1="0" x2="1"><stop offset="0" stop-color="#d6334a"/><stop offset="1" stop-color="#e8b65a"/></linearGradient></defs><path d="M20 33s-11-6.8-11-14.4C9 14.6 11.8 12 15.2 12c2.1 0 3.8 1.1 4.8 2.7 1-1.6 2.7-2.7 4.8-2.7 3.4 0 6.2 2.6 6.2 6.6C31 26.2 20 33 20 33z" fill="none" stroke="url(#lga)" stroke-width="2.4" stroke-linejoin="round"/><path d="M2 30c6-1 9-4 13-9" fill="none" stroke="#d6334a" stroke-width="1.6" stroke-linecap="round"/></svg>${esc(meta.brand)}</a>
    <nav class="nav">
      ${me.user ? `
        <a href="/#mau" class="hide-sm">Mẫu thiệp</a>
        <a href="/so-tay" class="${active === 'planner' ? 'on' : ''}">Sổ tay<span class="hide-xs"> cưới</span></a>
        <div class="acct" id="acct"><a href="/thiep-cua-toi">Thiệp<span class="hide-xs"> của tôi</span></a><button type="button" aria-label="Tài khoản" aria-expanded="false"></button>
          <div class="acct-menu"><div class="who"><b>${esc(me.user.name || '')}</b>${esc(me.user.email)}</div><a href="/thiep-cua-toi">Thiệp &amp; sản phẩm của tôi</a><a href="/so-tay">Sổ tay cưới của tôi</a><a href="/">Trang chủ</a><a href="#" id="logoutBtn">Đăng xuất</a></div></div>` : '<a href="/dang-nhap" class="btn sm">Đăng nhập</a>'}
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
