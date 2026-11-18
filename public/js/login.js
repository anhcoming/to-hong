// Popup đăng nhập dùng chung (trang giới thiệu lẫn trang sau đăng nhập): mọi link "/dang-nhap…" mở hộp này tại chỗ thay vì sang trang.
// Gọn: tiêu đề + 1 dòng · nút Google (Facebook nếu bật) · "Dùng email" mở ô email / mật khẩu · dòng điều khoản.
// Trang /dang-nhap vẫn giữ cho máy chủ chuyển về khi lỗi (?loi=) hoặc khi mở link trực tiếp.
(function () {
  if (window.openLogin) return;
  var GSVG = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  var FSVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z"/></svg>';
  var CSS = '.lgm{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:16px;background:rgba(30,18,20,.45);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);animation:lgmf .18s ease}'
    + '@keyframes lgmf{from{opacity:0}}@keyframes lgmu{from{transform:translateY(16px);opacity:0}}'
    + '.lgm-b{position:relative;width:min(380px,100%);max-height:calc(100dvh - 32px);overflow:auto;padding:26px 24px 20px;border-radius:24px;background:var(--card,var(--surface,#fff));color:var(--ink,#2a1b1e);box-shadow:0 24px 60px rgba(40,10,20,.28);text-align:center;font-family:var(--sans,"Be Vietnam Pro",system-ui,sans-serif);animation:lgmu .22s ease}'
    + '.lgm-x{position:absolute;top:12px;right:12px;width:34px;height:34px;border:0;border-radius:50%;background:rgba(127,127,127,.1);color:inherit;font-size:16px;cursor:pointer}'
    + '.lgm-h{font:700 30px/1 "Dancing Script",cursive;color:#d6455d;margin:2px 0 10px}'
    + '.lgm-b h2{margin:0;font-size:20px;font-weight:800;letter-spacing:-.01em}'
    + '.lgm-b>p{margin:6px 0 20px;color:var(--muted,#7a6a6d);font-size:14px;line-height:1.5}'
    + '.lgm-g{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:48px;margin-top:10px;border:1px solid var(--line,#eadfe1);border-radius:999px;background:var(--card,#fff);color:inherit;font:600 15px var(--sans,inherit);text-decoration:none;box-sizing:border-box}'
    + '.lgm-g:first-of-type{margin-top:0}.lgm-g:hover{border-color:#d6455d}.lgm-g svg{width:20px;height:20px}'
    + '.lgm-e{display:inline-block;margin-top:14px;border:0;background:none;color:var(--muted,#7a6a6d);font:500 13.5px var(--sans,inherit);text-decoration:underline;cursor:pointer}'
    + '.lgm-f{display:flex;flex-direction:column;gap:8px;margin-top:14px;text-align:left}.lgm-f[hidden],.lgm [hidden]{display:none!important}'
    + '.lgm-f input{height:44px;padding:0 14px;border:1px solid var(--line,#eadfe1);border-radius:12px;background:var(--card,#fff);color:inherit;font:15px var(--sans,inherit);box-sizing:border-box;width:100%}'
    + '.lgm-f input:focus{outline:0;border-color:#d6455d}'
    + '.lgm-f button{height:46px;border:0;border-radius:999px;background:linear-gradient(135deg,#d6455d,#ef7d8d);color:#fff;font:700 15px var(--sans,inherit);cursor:pointer}'
    + '.lgm-f button:disabled{opacity:.6}.lgm-sw{font-size:13px;text-align:center;color:var(--muted,#7a6a6d)}.lgm-sw a{color:#d6455d;font-weight:600;cursor:pointer}'
    + '.lgm-err{margin:8px 0 0;color:#c0392b;font-size:13px;min-height:0}.lgm-err:empty{display:none}'
    + '.lgm-ia{margin:0 0 14px;padding:10px 12px;border-radius:12px;background:#fff6e0;color:#6b4e00;font-size:13px;line-height:1.5;text-align:left}'
    + '.lgm-t{margin:16px 0 0;color:var(--muted,#7a6a6d);font-size:12px;line-height:1.5}.lgm-t a{color:inherit;text-decoration:underline}';

  var meta = null;
  function getMeta() {
    if (window.META) return Promise.resolve(window.META);
    if (meta) return meta;
    meta = fetch('/api/meta').then(function (r) { return r.json(); }).catch(function () { return {}; });
    return meta;
  }
  var inApp = (/Zalo/i.test(navigator.userAgent) && 'Zalo') || (/FBAN|FBAV|FB_IAB|Messenger/i.test(navigator.userAgent) && 'Facebook') || (/Instagram/i.test(navigator.userAgent) && 'Instagram') || (/TikTok|musical_ly|BytedanceWebview/i.test(navigator.userAgent) && 'TikTok') || '';

  window.openLogin = function (o) {
    o = o || {};
    var next = o.next && o.next.charAt(0) === '/' && o.next.slice(0, 2) !== '//' ? o.next : '/thiep-cua-toi';
    var mode = o.register ? 'register' : 'login';
    if (!document.getElementById('lgmCss')) { var st = document.createElement('style'); st.id = 'lgmCss'; st.textContent = CSS; document.head.appendChild(st); }
    var old = document.querySelector('.lgm'); if (old) old.remove();
    var wrap = document.createElement('div');
    wrap.className = 'lgm'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-label', 'Đăng nhập');
    var q = '?next=' + encodeURIComponent(next);
    var sub = /^\/sua/.test(next) ? 'Đăng nhập để lưu thiệp bạn vừa làm — nội dung đã sửa được giữ nguyên.' : 'Lưu thiệp, video và sổ tay cưới của bạn. Chưa có tài khoản cũng bấm luôn.';
    wrap.innerHTML = '<div class="lgm-b"><button class="lgm-x" aria-label="Đóng">✕</button>'
      + '<h2>Đăng nhập</h2><p>' + sub + '</p>'
      + '<div class="lgm-ia" hidden>Bạn đang mở trong ứng dụng ' + inApp + ' — Google không cho đăng nhập ở đây. Bấm <b>⋯</b> → <b>Mở bằng trình duyệt</b>.</div>'
      + '<a class="lgm-g" data-k="g" href="/auth/google' + q + '" hidden>' + GSVG + 'Tiếp tục với Google</a>'
      + '<a class="lgm-g" data-k="f" href="/auth/facebook' + q + '" hidden>' + FSVG + 'Tiếp tục với Facebook</a>'
      + '<button class="lgm-e" type="button" hidden>Đăng nhập bằng email</button>'
      + '<form class="lgm-f" hidden><input name="name" placeholder="Tên của bạn" autocomplete="name" maxlength="80" hidden>'
      + '<input name="email" type="email" placeholder="Email" required autocomplete="email">'
      + '<input name="password" type="password" placeholder="Mật khẩu" required minlength="6" autocomplete="current-password">'
      + '<button>Đăng nhập</button><div class="lgm-sw" hidden></div><p class="lgm-err"></p></form>'
      + '<p class="lgm-t">Tiếp tục là bạn đồng ý với <a href="/dieu-khoan" target="_blank" rel="noopener">Điều khoản</a> và <a href="/chinh-sach-bao-mat" target="_blank" rel="noopener">Chính sách bảo mật</a>.</p></div>';
    document.body.appendChild(wrap);
    var $ = function (s) { return wrap.querySelector(s); };
    var f = $('.lgm-f'), emailBtn = $('.lgm-e'), sw = $('.lgm-sw');
    var prevOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    function close() { wrap.remove(); document.body.style.overflow = prevOverflow; document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    $('.lgm-x').onclick = close;
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    function setMode(m) {
      mode = m;
      f.name.hidden = m !== 'register';
      f.querySelector('button').textContent = m === 'register' ? 'Tạo tài khoản' : 'Đăng nhập';
      f.password.autocomplete = m === 'register' ? 'new-password' : 'current-password';
      sw.innerHTML = m === 'register' ? 'Đã có tài khoản? <a data-m="login">Đăng nhập</a>' : 'Chưa có tài khoản? <a data-m="register">Tạo bằng email</a>';
      $('.lgm-err').textContent = '';
    }
    sw.addEventListener('click', function (e) { var a = e.target.closest('[data-m]'); if (a) setMode(a.dataset.m); });
    emailBtn.onclick = function () { f.hidden = false; emailBtn.hidden = true; f.email.focus(); };
    getMeta().then(function (m) {
      m = m || {};
      var social = m.googleLogin || m.facebookLogin;
      $('[data-k=g]').hidden = !m.googleLogin; $('[data-k=f]').hidden = !m.facebookLogin;
      if (inApp && m.googleLogin) $('.lgm-ia').hidden = false;
      sw.hidden = !m.emailSignup;
      setMode(m.emailSignup ? mode : 'login');
      if (!social) f.hidden = false; // chỉ đăng nhập bằng Google / Facebook; ô email chỉ hiện khi máy chưa cấu hình hai nút đó (chạy thử)
      if (!social) f.email.focus();
    });
    f.onsubmit = function (e) {
      e.preventDefault();
      var btn = f.querySelector('button'), err = $('.lgm-err');
      var body = { email: f.email.value, password: f.password.value };
      if (mode === 'register') body.name = f.name.value;
      btn.disabled = true; err.textContent = '';
      fetch('/api/auth/' + mode, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin' })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || 'Có lỗi xảy ra'); return j; }); })
        .then(function (r) {
          var to = next;
          // bản nháp vừa làm đã gộp vào thiệp sẵn có của tài khoản → mở thiệp đó
          if (r && r.moved) to = to.replace(/^\/(sua|sua-led|sua-video)\/([\w-]+)/, function (x, p, id) { return r.moved.from.indexOf(id) >= 0 ? '/' + p + '/' + r.moved.to : x; });
          location.href = to;
        })
        .catch(function (e2) { err.textContent = e2.message; btn.disabled = false; });
    };
  };

  // mọi link tới /dang-nhap → mở popup (trừ khi đang ở chính trang đăng nhập, hoặc giữ Ctrl/⌘ để mở tab mới)
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || location.pathname === '/dang-nhap') return;
    var a = e.target.closest && e.target.closest('a[href^="/dang-nhap"]');
    if (!a) return;
    e.preventDefault(); e.stopPropagation();
    var u = new URL(a.getAttribute('href'), location.origin);
    var nav = document.querySelector('.nav.mopen'); if (nav) nav.classList.remove('mopen');
    window.openLogin({ next: u.searchParams.get('next') || '', register: !!u.searchParams.get('dang-ky') });
  }, true);
})();
