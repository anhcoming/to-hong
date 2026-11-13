// Phần chung của các trang giới thiệu: thanh trên, chân trang, giá từ cấu hình, hiệu ứng hiện dần.
(function () {
  'use strict';
  // logo giống trang chủ: chữ viết tay tô gradient, tim nhỏ cuối chữ (CSS .logo .lw / .lh)
  var LOGO = '<span class="lw" data-brand>Cưới Nha</span><svg class="lh" viewBox="0 0 32 30" aria-hidden="true"><path d="M16 28C6.5 21 3 16 3 11.5 3 7.9 5.8 5 9.4 5c2.6 0 4.6 1.4 6.6 3.9C18 6.4 20 5 22.6 5 26.2 5 29 7.9 29 11.5 29 16 25.5 21 16 28z"/></svg>';
  var MENU = [['/mau-thiep', 'Thiệp cưới', 'tpl'], ['/man-hinh-led-dam-cuoi', 'Màn hình LED', 'led'], ['/video-cuoi', 'Video cưới', 'video'], ['/so-tay-cuoi', 'Sổ tay cưới', 'planner']]; // các chức năng chính
  var page = document.body.getAttribute('data-page') || '';

  // Bảng menu điện thoại (trang chủ và các trang giới thiệu): thẻ lớn Thiệp cưới + 3 ô sản phẩm + hàng tài khoản.
  // Icon nét 24×24 (màu theo currentColor).
  var ICON = {
    card: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5 12 13l8.5-6.5"/>',
    led: '<rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M8 20.5h8M12 16.5v4"/><path d="m12 7 .9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="m16 10.5 5-3v9l-5-3"/>',
    book: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/><path d="M9 8h6M9 11.5h4"/>',
    pen: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/><path d="m14.5 7.5 3 3"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    out: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'
  };
  var svg = function (k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[k] + '</svg>'; };
  function renderMPanel(user) {
    var acct = user
      ? '<a href="/so-tay">' + svg('pen') + 'Sổ tay của tôi</a><a href="#" data-theme-toggle>' + svg('moon') + 'Sáng / tối</a><a href="#" data-logout>' + svg('out') + 'Đăng xuất</a>'
      : '<a href="/dang-nhap">' + svg('user') + 'Đăng nhập</a><a href="#" data-theme-toggle>' + svg('moon') + 'Sáng / tối</a>';
    var html = '<a class="mp-big" href="/mau-thiep"><b>Thiệp cưới online</b><small>Mỗi khách một lời mời có tên riêng</small><span class="go">Xem mẫu →</span>' + svg('card') + '</a>' +
      '<div class="mp-three">' + [['led', MENU[1]], ['video', MENU[2]], ['book', MENU[3]]].map(function (x) {
        return '<a href="' + x[1][0] + '"><i>' + svg(x[0]) + '</i>' + x[1][1] + '</a>';
      }).join('') + '</div>' +
      '<div class="mp-acct">' + acct + '</div>';
    document.querySelectorAll('.mpanel').forEach(function (p) { p.innerHTML = html; });
  }
  window.renderMPanel = renderMPanel;
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.mpanel [data-theme-toggle], .mpanel [data-logout]');
    if (!t) return;
    e.preventDefault();
    if (t.hasAttribute('data-theme-toggle')) { if (window.toggleTheme) toggleTheme(); return; }
    fetch('/api/auth/logout', { method: 'POST' }).then(function () { location.reload(); });
  });

  var nav = document.getElementById('nav');
  if (nav) {
    nav.className = 'nav' + (document.body.hasAttribute('data-solid') ? ' always' : '');
    nav.innerHTML = '<div class="wrap"><a class="logo" href="/">' + LOGO + '</a>' +
      '<nav class="menu">' + MENU.map(function (m) { return '<a href="' + m[0] + '"' + (m[2] === page ? ' class="on"' : '') + '>' + m[1] + '</a>'; }).join('') + '</nav>' +
      (window.themeBtn ? themeBtn() : '') + '<div class="acts" id="navActs"><a class="btn btn-ghost btn-sm login" href="/dang-nhap">Đăng nhập</a><a class="btn btn-main btn-sm" href="/mau-thiep">Tạo thiệp</a></div>' +
      '<button class="burger" id="burger" type="button" aria-label="Mở menu" aria-expanded="false"><i></i></button></div>' +
      // bảng menu điện thoại: nội dung do renderMPanel() bên dưới dựng
      '<nav class="mpanel" aria-label="Menu"></nav>';
    var burger = document.getElementById('burger');
    burger.addEventListener('click', function () { var on = !nav.classList.contains('mopen'); nav.classList.toggle('mopen', on); burger.setAttribute('aria-expanded', on); });
    var onScroll = function () { nav.classList.toggle('solid', window.scrollY > 40); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  renderMPanel(null); // chưa biết đăng nhập: hiện bản khách, /api/me bên dưới dựng lại

  var foot = document.getElementById('foot');
  if (foot) {
    foot.className = 'foot';
    foot.innerHTML = '<div class="wrap"><div class="cols">' +
      '<div><a class="logo" href="/" style="margin-bottom:10px">' + LOGO + '</a><p style="margin:0;max-width:340px">Thiệp cưới online, video cưới chiếu TV và sổ tay chuẩn bị đám cưới — báo tin vui bằng một đường link.</p></div>' +
      '<div><h4>Sản phẩm</h4><a href="/mau-thiep">Thiệp cưới online</a><a href="/man-hinh-led-dam-cuoi">Màn hình LED đám cưới</a><a href="/video-cuoi">Video cưới chiếu TV</a><a href="/so-tay-cuoi">Sổ tay cưới miễn phí</a></div>' +
      '<div><h4>Hỗ trợ</h4><a href="/#hoi-dap">Câu hỏi thường gặp</a><a href="/#gia">Bảng giá</a><span style="display:block;margin-bottom:8px">Zalo: <b data-zalo style="color:var(--ink)"></b></span><span data-email></span></div>' +
      '</div><div class="copy"><span>© ' + new Date().getFullYear() + ' <span data-brand>Cưới Nha</span></span><span>Làm bằng ♥ tại Việt Nam</span></div></div>';
  }

  var money = function (n) { return Number(n || 0).toLocaleString('vi-VN') + 'đ'; };
  var k = function (n) { return Math.round((n || 0) / 1000) + 'k'; };
  fetch('/api/meta').then(function (r) { return r.json(); }).then(function (m) {
    window.META = m;
    var set = function (sel, v) { document.querySelectorAll(sel).forEach(function (e) { e.textContent = v; }); };
    set('[data-brand]', m.brand);
    set('[data-price]', money(m.price));
    set('[data-price-k]', k(m.price));
    // Trọn bộ: giá, giá gốc, tiết kiệm so với mua lẻ cả ba
    if (m.comboPrice) {
      set('[data-combo-k]', k(m.comboPrice));
      set('[data-combo-save]', k(m.price + m.ledPrice + m.videoPrice - m.comboPrice));
      if (m.comboListPrice) {
        set('[data-combo-list-k]', k(m.comboListPrice));
        document.querySelectorAll('[data-combo-promo]').forEach(function (e) { e.hidden = false; });
      }
    }
    // giá mở bán: hiện giá gốc gạch ngang + đếm ngược tới hết hạn
    if (m.listPrice && m.promoEndsAt) {
      set('[data-list-price]', money(m.listPrice));
      set('[data-list-price-k]', k(m.listPrice));
      set('[data-promo-after]', new Date(m.promoEndsAt + 1).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' }));
      document.querySelectorAll('[data-promo]').forEach(function (e) { e.hidden = false; });
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      var tick = function () {
        var s = Math.max(0, Math.floor((m.promoEndsAt - Date.now()) / 1000)), d = Math.floor(s / 86400);
        set('[data-promo-cd]', (d ? d + ' ngày ' : '') + pad(Math.floor(s % 86400 / 3600)) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60));
      };
      tick(); setInterval(tick, 1000);
    }
    set('[data-led-price]', money(m.ledPrice));
    set('[data-video-price]', money(m.videoPrice));
    set('[data-trial-days]', m.trialDays);
    set('[data-guest-limit]', m.trialGuestLimit);
    set('[data-zalo]', m.support.zalo);
    set('[data-email]', m.support.email);
    document.dispatchEvent(new CustomEvent('meta', { detail: m }));
  }).catch(function () {});

  // đã đăng nhập → nút trên thanh đổi thành "Sổ tay của tôi"
  fetch('/api/me').then(function (r) { return r.json(); }).then(function (me) {
    var a = document.getElementById('navActs');
    if (me.user && a) a.innerHTML = '<a class="btn btn-main btn-sm" href="/thiep-cua-toi">Thiệp của tôi</a>';
    if (me.user) renderMPanel(me.user);
  }).catch(function () {});

  // khung 16:9 chứa trang 1280×720 (video, màn LED)
  function fit() {
    document.querySelectorAll('[data-fit]').forEach(function (m) {
      var f = m.querySelector('iframe');
      if (f) f.style.transform = 'scale(' + m.clientWidth / 1280 + ')';
    });
  }
  window.addEventListener('resize', fit);
  fit();

  // hiện dần khi cuộn
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });
  } else document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });

  // nút chọn mẫu xem thử: <div class="pick" data-target="#frame" data-path="/video/demo" data-full="#fullLink"> <button data-q="template=sen">
  document.querySelectorAll('.pick[data-target]').forEach(function (p) {
    var frame = document.querySelector(p.getAttribute('data-target'));
    var full = p.getAttribute('data-full') && document.querySelector(p.getAttribute('data-full'));
    var path = p.getAttribute('data-path');
    p.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      p.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
      var q = b.getAttribute('data-q');
      frame.src = path + '?preview=1&' + q;
      if (full) full.href = path + '?' + q;
    });
  });

  // nút lên đầu trang: góc dưới phải, hiện khi đã cuộn quá 80% một màn hình, bấm thì cuộn mượt về đầu (CSS .totop)
  var top = document.createElement('button');
  top.className = 'totop'; top.type = 'button'; top.title = 'Lên đầu trang'; top.setAttribute('aria-label', 'Lên đầu trang');
  top.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V6M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(top);
  var topOn = false;
  var topCheck = function () { var on = window.scrollY > window.innerHeight * 0.8; if (on !== topOn) { topOn = on; top.classList.toggle('on', on); } };
  window.addEventListener('scroll', topCheck, { passive: true }); topCheck();
  top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' }); });

  // thống kê truy cập cho trang quản trị: chỉ gửi con số cộng dồn (trang nào, lượt đầu trong ngày, nguồn tới, bấm "Dùng mẫu" nào) —
  // không cookie, không định danh người xem. Trình duyệt chặn localStorage thì mỗi lượt xem coi như một khách.
  try {
    if (!navigator.webdriver) {
      var send = function (o) { var b = JSON.stringify(o); if (navigator.sendBeacon) navigator.sendBeacon('/api/t', b); else fetch('/api/t', { method: 'POST', body: b, keepalive: true }); };
      var day = new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 10), isNew = 1, first = 1;
      try { isNew = localStorage.getItem('cn_day') !== day ? 1 : 0; first = localStorage.getItem('cn_seen') ? 0 : 1; localStorage.setItem('cn_day', day); localStorage.setItem('cn_seen', '1'); } catch (e) { /* bỏ qua */ }
      var ref = '';
      try { var rh = document.referrer ? new URL(document.referrer).host : ''; ref = new URLSearchParams(location.search).get('utm_source') || (rh && rh !== location.host ? rh : ''); } catch (e) { /* bỏ qua */ }
      send({ p: location.pathname, v: isNew, n: first, r: ref, m: matchMedia('(max-width:760px)').matches ? 1 : 0 });
      document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href*="/thiep-cua-toi?tao"],a[href^="/tao-led"],a[href^="/tao-video"]');
        if (!a) return;
        var u = new URL(a.href, location.href), q = u.searchParams;
        var k = q.get('tao') ? 'thiep:' + q.get('tao') : u.pathname === '/tao-video' ? 'video:' + (q.get('mau') || 'chung') : u.pathname === '/tao-led' ? 'led:' + (q.get('palette') ? q.get('palette') + '-' + (q.get('effect') || '') : 'chung') : '';
        if (k) send({ u: k });
      }, true);
    }
  } catch (e) { /* thống kê không được làm hỏng trang */ }

  window.SITE = { LOGO: LOGO, money: money };
})();
