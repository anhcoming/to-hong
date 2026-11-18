// Phần chung của các trang giới thiệu: thanh trên, chân trang, giá từ cấu hình, hiệu ứng hiện dần.
(function () {
  'use strict';
  // popup đăng nhập: link /dang-nhap mở tại chỗ thay vì sang trang
  // chặn mở công cụ nhà phát triển cho khách (máy chủ trả bản rỗng cho máy của chủ web — xem lib/guard.js)
  if (!document.querySelector('script[src="/js/cn-guard.js"]')) { var gd = document.createElement('script'); gd.src = '/js/cn-guard.js'; gd.defer = true; document.head.appendChild(gd); }
  if (!document.querySelector('script[src="/js/login.js"]')) { var lg = document.createElement('script'); lg.src = '/js/login.js'; document.head.appendChild(lg); }
  // thanh chạy mảnh trên cùng khi rời trang / chờ đăng xuất (trang ứng dụng đã có bản đầy đủ trong common.js)
  if (!window.progress) {
    var bar = null, n = 0, tm = null;
    var st = document.createElement('style');
    st.textContent = '#gbar{position:fixed;left:0;right:0;top:0;height:3px;z-index:10000;overflow:hidden;pointer-events:none;opacity:0;transition:opacity .2s}#gbar.on{opacity:1}#gbar i{position:absolute;top:0;bottom:0;left:-40%;width:40%;border-radius:3px;background:linear-gradient(90deg,transparent,#d6455d,#ef7d8d,transparent);animation:gbar 1.1s ease-in-out infinite}@keyframes gbar{to{left:100%}}';
    document.head.appendChild(st);
    window.progress = {
      start: function () { n++; if (n === 1 && !tm) tm = setTimeout(function () { tm = null; if (!n) return; bar = bar || Object.assign(document.createElement('div'), { id: 'gbar', innerHTML: '<i></i>' }); document.body.appendChild(bar); requestAnimationFrame(function () { bar.classList.add('on'); }); }, 300); },
      done: function () { n = Math.max(0, n - 1); if (n) return; clearTimeout(tm); tm = null; if (bar && bar.parentNode) bar.remove(); },
      reset: function () { n = 1; this.done(); },
    };
    window.addEventListener('beforeunload', function () { progress.start(); setTimeout(function () { progress.reset(); }, 8000); });
    window.addEventListener('pageshow', function (e) { if (e.persisted) progress.reset(); });
  }
  // logo giống trang chủ: chữ viết tay tô gradient, tim nhỏ cuối chữ (CSS .logo .lw / .lh)
  var LOGO = '<span class="lw" data-brand>Cưới Nha</span><svg class="lh" viewBox="0 0 32 30" aria-hidden="true"><path d="M16 28C6.5 21 3 16 3 11.5 3 7.9 5.8 5 9.4 5c2.6 0 4.6 1.4 6.6 3.9C18 6.4 20 5 22.6 5 26.2 5 29 7.9 29 11.5 29 16 25.5 21 16 28z"/></svg>';
  var MENU = [['/mau-thiep', 'Thiệp cưới', 'tpl'], ['/slide-cuoi', 'Slide cưới', 'slide'], ['/man-hinh-led-dam-cuoi', 'Màn hình LED', 'led'], ['/video-dam-ngo', 'Video dạm ngõ', 'damngo'], ['/so-tay-cuoi', 'Sổ tay cưới', 'planner'], ['/video', 'Video báo hỷ', 'baohy']]; // các chức năng chính
  var page = document.body.getAttribute('data-page') || '';

  // Bảng menu điện thoại (trang chủ và các trang giới thiệu): danh sách chức năng + hàng tài khoản.
  // Icon nét 24×24 (màu theo currentColor).
  var ICON = {
    card: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5 12 13l8.5-6.5"/>',
    slide: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/><path d="m10 8 4 2-4 2z"/>',
    clap: '<path d="M4 10h16v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z"/><path d="m4 10-.6-3.2 15-3 .6 3.2"/><path d="m8.5 6.2 2 3.3M13.5 5.2l2 3.3"/>',
    led: '<rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M8 20.5h8M12 16.5v4"/><path d="m12 7 .9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="m16 10.5 5-3v9l-5-3"/>',
    book: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/><path d="M9 8h6M9 11.5h4"/>',
    pen: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/><path d="m14.5 7.5 3 3"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    out: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'
  };
  var svg = function (k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[k] + '</svg>'; };
  // Mỗi chức năng một hàng: icon nét · tên (· nhãn Miễn phí); mục đang xem tô hồng; cuối là nút Tạo thiệp + hàng tài khoản nhỏ.
  var MP = [
    ['/mau-thiep', 'card', 'Thiệp cưới', 'tpl'],
    ['/video', 'clap', 'Video báo hỷ TikTok', 'baohy', 'Miễn phí'],
    ['/slide-cuoi', 'slide', 'Slide cưới', 'slide'],
    ['/man-hinh-led-dam-cuoi', 'led', 'Màn hình LED', 'led'],
    ['/video-dam-ngo', 'video', 'Video dạm ngõ', 'damngo'],
    ['/so-tay-cuoi', 'book', 'Sổ tay cưới', 'planner']
  ];
  function renderMPanel(user) {
    var acct = user
      ? '<a href="/so-tay">' + svg('pen') + 'Sổ tay của tôi</a><a href="#" data-theme-toggle>' + svg('moon') + 'Sáng / tối</a><a href="#" data-logout>' + svg('out') + 'Đăng xuất</a>'
      : '<a href="/dang-nhap">' + svg('user') + 'Đăng nhập</a><a href="#" data-theme-toggle>' + svg('moon') + 'Sáng / tối</a>';
    var html = '<div class="mp-list">' + MP.map(function (m) {
        return '<a href="' + m[0] + '"' + (m[3] === page ? ' class="on"' : '') + '>' + svg(m[1]) + m[2] + (m[4] ? '<em>' + m[4] + '</em>' : '') + '</a>';
      }).join('') + '</div>' +
      '<a class="mp-cta" href="/mau-thiep">' + (user ? '＋ Tạo thiệp mới' : 'Tạo thiệp miễn phí 7 ngày') + '</a>' +
      '<div class="mp-acct">' + acct + '</div>';
    document.querySelectorAll('.mpanel').forEach(function (p) { p.innerHTML = html; });
  }
  // chạm ra ngoài menu đang mở (phần nền tối) thì đóng menu
  document.addEventListener('click', function (e) {
    var o = document.querySelector('.mopen');
    if (!o || o.contains(e.target)) return;
    o.classList.remove('mopen');
    var b = o.querySelector('.burger'); if (b) b.setAttribute('aria-expanded', 'false');
  });
  window.renderMPanel = renderMPanel;
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.mpanel [data-theme-toggle], .mpanel [data-logout]');
    if (!t) return;
    e.preventDefault();
    if (t.hasAttribute('data-theme-toggle')) { if (window.toggleTheme) toggleTheme(); return; }
    progress.start();
    fetch('/api/auth/logout', { method: 'POST' }).then(function () { location.reload(); }, function () { progress.done(); });
  });

  var nav = document.getElementById('nav');
  if (nav) {
    nav.className = 'nav' + (document.body.hasAttribute('data-solid') ? ' always' : '');
    nav.innerHTML = '<div class="wrap"><a class="logo" href="/" aria-label="Về trang chủ">' + (page === 'home' ? '' : '<span class="lhome" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 11 12 4l8 7v8.5a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19.5z"/></svg></span>') + LOGO + '</a>' +
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
      '<div><h4>Sản phẩm</h4><a href="/mau-thiep">Thiệp cưới online</a><a href="/slide-cuoi">Slide ảnh cưới</a><a href="/man-hinh-led-dam-cuoi">Màn hình LED đám cưới</a><a href="/video-dam-ngo">Video dạm ngõ chiếu TV</a><a href="/so-tay-cuoi">Sổ tay cưới miễn phí</a><a href="/goi-y">Gợi ý thiệp từ ảnh cưới</a></div>' +
      '<div><h4>Hỗ trợ</h4><a href="/#hoi-dap">Câu hỏi thường gặp</a><a href="/#gia">Bảng giá</a><a href="/dieu-khoan">Điều khoản sử dụng</a><a href="/chinh-sach-bao-mat">Chính sách bảo mật</a><a href="/hoan-tien">Thanh toán &amp; hoàn tiền</a><span data-contact hidden style="display:block;margin-bottom:8px">Zalo: <b data-zalo style="color:var(--ink)"></b></span><span data-contact hidden><span data-email></span></span></div>' +
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
    set('[data-tpl-count]', (m.templates || []).length || 49);
    set('[data-video-count]', ((m.video || {}).templates || []).length || 16);
    // liên hệ hỗ trợ: Zalo → zalo.me, email → mailto; còn số/email giả (0900000000, @example.com) thì giấu cả dòng
    var sp = m.support || {}, zd = String(sp.zalo || '').replace(/\D/g, ''), em = String(sp.email || '');
    var contact = function (sel, ok, href, text) {
      document.querySelectorAll(sel).forEach(function (e) {
        var box = e.closest('[data-contact]') || e;
        if (!ok) { box.hidden = true; return; }
        e.innerHTML = '';
        var a = document.createElement('a'); a.href = href; a.textContent = text; a.style.color = 'inherit';
        if (/^https:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; }
        e.appendChild(a); box.hidden = false;
      });
    };
    contact('[data-zalo]', zd.length >= 9 && zd !== '0900000000', 'https://zalo.me/' + zd, sp.zalo);
    contact('[data-email]', /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em) && !/@example\.(com|org|net)$/i.test(em), 'mailto:' + em, em);
    document.dispatchEvent(new CustomEvent('meta', { detail: m }));
  }).catch(function () {});

  // Thanh 5 nút dưới cùng trên điện thoại — giống hệt thanh dưới của trang tài khoản (common.js renderTopbar),
  // thay cho menu ☰: chưa đăng nhập thì dẫn tới trang giới thiệu, đã đăng nhập thì tới đồ của mình.
  var SB = [
    ['card', 'Thiệp', 'tpl', '/mau-thiep', '/thiep-cua-toi', '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5 12 13l8.5-6.5"/>'],
    ['clap', 'Báo hỷ', 'baohy', '/video', '/video', '<path d="M4 10h16v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z"/><path d="m4 10-.6-3.2 15-3 .6 3.2"/><path d="m8.5 6.2 2 3.3M13.5 5.2l2 3.3"/>', 'Free'],
    ['led', 'Màn LED', 'led', '/man-hinh-led-dam-cuoi', '/thiep-cua-toi?mo=led', '<rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M8 20.5h8M12 16.5v4"/><path d="m12 7 .9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z"/>'],
    ['slide', 'Slide', 'slide', '/slide-cuoi', '/video-cua-toi', '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/><path d="m10 8 4 2-4 2z"/>'],
    ['book', 'Sổ tay', 'planner', '/so-tay-cuoi', '/so-tay', '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/><path d="M9 8h6M9 11.5h4"/>', 'Free']
  ];
  var sbar = null;
  if (page) {
    var sst = document.createElement('style');
    sst.textContent = '.sbar{display:none}@media (max-width:760px){'
      + '.burger,.hnav .burger,.mpanel{display:none!important}'
      + '#hacts,#navActs{display:none!important}.uav{display:block!important;margin-left:auto}'
      + '.nav .logo{display:inline-flex;align-items:center}.lhome{margin-right:8px;display:grid!important;place-items:center;flex:none;width:28px;height:28px;border-radius:50%;background:rgba(214,69,93,.1);color:#d6455d}.lhome svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'
      + 'body{padding-bottom:calc(92px + env(safe-area-inset-bottom))}.totop{bottom:calc(88px + env(safe-area-inset-bottom))!important}'
      + '.sbar{position:fixed;z-index:48;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));height:62px;padding:0 8px;display:flex;align-items:center;justify-content:space-around;border-radius:999px;background:rgba(255,255,255,.92);backdrop-filter:blur(12px) saturate(1.4);-webkit-backdrop-filter:blur(12px) saturate(1.4);box-shadow:0 0 0 1px var(--line,#f0e4e6),0 12px 30px rgba(120,40,50,.16)}'
      + '[data-theme="dark"] .sbar{background:rgba(31,25,27,.92)}'
      + '.sbar a{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;font-family:inherit;font-size:10.5px;font-weight:600;line-height:1.2;white-space:nowrap;color:var(--muted,#8a7d80);text-decoration:none}'
      + '.sbar i{position:relative;display:grid;place-items:center;height:24px;font-style:normal}'
      + '.sbar svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}'
      + '.sbar a.on{color:#d6455d}.sbar a.on svg>*{fill:currentColor}.sbar a.on svg>*:last-child{fill:none;stroke:#fff}'
      + '.sbar em{position:absolute;top:-11px;left:50%;transform:translateX(-50%);white-space:nowrap;padding:0 5px;border-radius:99px;background:#d6455d;color:#fff;font-size:8.5px;font-style:normal;font-weight:700;line-height:14px}}';
    sst.textContent += '.lhome{display:none}.uav{display:none;position:relative;flex:none}'
      + '.uav>a,.uav>button{display:grid;place-items:center;width:40px;height:40px;padding:0;border-radius:50%;border:1px solid var(--line,#f0e4e6);background:var(--card,#fff);color:var(--ink,#2b2224);cursor:pointer;font:inherit;font-size:13px;font-weight:800;text-decoration:none}'
      + '.uav>a,.uav>button{border:0!important;background:rgba(214,69,93,.1)!important;color:#d6455d!important}'
      + '.uav>a.lgin{width:auto;padding:0 16px;border-radius:999px;font-size:13.5px;font-weight:700;white-space:nowrap}'
      + '.uav svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}'
      + '.uav .um{position:absolute;right:0;top:calc(100% + 10px);z-index:60;min-width:230px;padding:8px;border-radius:14px;background:var(--card,#fff);box-shadow:0 0 0 1px var(--line,#f0e4e6),0 20px 50px rgba(120,40,50,.18);display:none}'
      + '.uav.open .um{display:block}.uav .um a{display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;font-size:14px;color:var(--ink,#2b2224);text-decoration:none}.uav .um a:hover{background:rgba(214,69,93,.08)}'
      + '.uav .um svg{flex:none;width:18px;height:18px;color:var(--muted,#8a7d80)}.uav .who{padding:8px 10px 10px;margin-bottom:4px;border-bottom:1px solid var(--line,#f0e4e6);font-size:13px;color:var(--muted,#8a7d80);overflow:hidden;text-overflow:ellipsis}.uav .who b{display:block;color:var(--ink,#2b2224);font-size:14px}';
    document.head.appendChild(sst);
    // điện thoại: góc trên chỉ còn icon tài khoản (chưa đăng nhập → trang đăng nhập; đã đăng nhập → ảnh đại diện + menu tài khoản)
    var uav = document.createElement('div'); uav.className = 'uav';
    uav.innerHTML = '<a href="/dang-nhap" class="lgin">Đăng nhập</a>'; // chưa đăng nhập: chữ rõ ràng; đã đăng nhập thì drawUav() đổi thành icon tài khoản
    uav.style.visibility = 'hidden'; // chờ biết đã đăng nhập chưa rồi mới hiện, khỏi nháy chữ "Đăng nhập" với người đã đăng nhập
    var actsBox = document.getElementById('hacts') || document.getElementById('navActs');
    if (actsBox) actsBox.parentNode.insertBefore(uav, actsBox.nextSibling);
    window.drawUav = function (user) {
      var esc = function (t) { return String(t || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
      uav.innerHTML = '<button type="button" aria-label="Tài khoản" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></button><div class="um"><div class="who"><b>' + esc(user.name) + '</b>' + esc(user.email) + '</div>'
        + '<a href="#" data-theme-toggle><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>Đổi nền sáng / tối</a><a href="#" data-logout><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 16l-4-4 4-4M6 12h10"/></svg>Đăng xuất</a></div>'; // Thiệp / Sổ tay đã có ở thanh dưới
      var b = uav.querySelector('button');
      b.onclick = function (e) { e.stopPropagation(); var on = !uav.classList.contains('open'); uav.classList.toggle('open', on); b.setAttribute('aria-expanded', on); };
      uav.querySelector('.um').onclick = function (e) {
        var t = e.target.closest('[data-theme-toggle],[data-logout]'); if (!t) return;
        e.preventDefault(); uav.classList.remove('open');
        if (t.hasAttribute('data-theme-toggle')) { if (window.toggleTheme) toggleTheme(); return; }
        progress.start(); fetch('/api/auth/logout', { method: 'POST' }).then(function () { location.reload(); }, function () { progress.done(); });
      };
      document.addEventListener('click', function (e) { if (!uav.contains(e.target)) uav.classList.remove('open'); });
    };
    sbar = document.createElement('nav'); sbar.className = 'sbar'; sbar.setAttribute('aria-label', 'Chức năng');
    var drawSbar = function (user) {
      sbar.innerHTML = SB.map(function (b) {
        return '<a href="' + (user ? b[4] : b[3]) + '"' + (b[2] === page ? ' class="on"' : '') + '><i><svg viewBox="0 0 24 24" aria-hidden="true">' + b[5] + '</svg>' + (b[6] ? '<em>' + b[6] + '</em>' : '') + '</i>' + b[1] + '</a>';
      }).join('');
    };
    drawSbar(null);
    document.body.appendChild(sbar);
    window.drawSbar = drawSbar;
  }

  // Xem trước một mẫu (thiệp / video / màn LED) — dùng ở trang chủ và /mau-thiep: bấm thẻ là mở, không cần nút riêng.
  // Điện thoại: toàn màn hình, tên mẫu góc trên trái, ✕ góc trên phải, dưới cùng nút Dùng mẫu liền khối (nút Back của máy cũng đóng).
  // Máy tính: popup giữa màn (thiệp: khung điện thoại; video / LED: khung 16:9), cùng bố cục.
  // o = { src, name, use, wide }
  window.tplView = function (o) {
    if (!document.getElementById('tvCss')) {
      var c = document.createElement('style'); c.id = 'tvCss';
      c.textContent = '.tv{position:fixed;inset:0;z-index:10060;display:flex;align-items:center;justify-content:center;background:rgba(20,10,14,.62);animation:tvIn .2s ease}'
        + '@keyframes tvIn{from{opacity:0}}'
        + '.tv .box{position:relative;display:flex;flex-direction:column;overflow:hidden;border-radius:22px;background:#fff;box-shadow:0 30px 80px rgba(0,0,0,.35)}'
        + '.tv .vw{position:relative;overflow:hidden;background:#1a1214}.tv .vw iframe{position:absolute;left:0;top:0;border:0;transform-origin:0 0;background:#fff}'
        + '.tv .nm{position:absolute;top:10px;left:10px;z-index:3;max-width:calc(100% - 70px);padding:0 16px;height:40px;line-height:40px;border-radius:999px;background:rgba(0,0,0,.5);color:#fff;font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
        + '.tv .box::after{content:"";position:absolute;left:0;right:0;bottom:0;height:120px;z-index:2;pointer-events:none;background:linear-gradient(0deg,rgba(0,0,0,.45),transparent)}'
        + '.tv .go{position:absolute;left:16px;right:16px;bottom:16px;z-index:3;display:flex;align-items:center;justify-content:center;gap:8px;height:52px;border-radius:999px;background:linear-gradient(135deg,#d6455d,#ef7d8d);color:#fff;font-weight:700;font-size:16px;text-decoration:none;box-shadow:0 10px 26px rgba(214,69,93,.45)}'
        + '.tv .go:active{transform:scale(.98)}'
        + '.tv .x{position:absolute;top:10px;right:10px;z-index:3;width:40px;height:40px;border:0;border-radius:50%;background:rgba(0,0,0,.5);color:#fff;font-size:20px;line-height:1;display:grid;place-items:center;cursor:pointer}'
        + '.tv .ld{position:absolute;inset:0;display:grid;place-items:center;color:#f3c9d0;font-size:13px}'
        + '@media (max-width:600px){.tv{background:#000}.tv .box{width:100%;height:100%;border-radius:0}.tv .x,.tv .nm{top:max(10px,env(safe-area-inset-top))}.tv .go{bottom:max(16px,calc(env(safe-area-inset-bottom) + 8px))}}';
      document.head.appendChild(c);
    }
    var esc = function (t) { return String(t || '').replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); };
    var el = document.createElement('div'); el.className = 'tv'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Xem trước mẫu ' + (o.name || ''));
    // tên mẫu góc trên trái, ✕ góc trên phải, nút Dùng mẫu bo tròn nổi ở đáy (đều đè lên khung xem, có lớp tối mờ dần), không dải trắng
    el.innerHTML = '<div class="box"><span class="nm">' + esc(o.name) + '</span><button class="x" type="button" aria-label="Đóng">✕</button><div class="vw"><span class="ld">Đang mở mẫu…</span><iframe title="Xem trước mẫu" src="' + esc(o.src) + '"></iframe></div>'
      + '<a class="go" href="' + esc(o.use) + '">Dùng mẫu này<span aria-hidden="true">→</span></a></div>';
    document.body.appendChild(el);
    var box = el.querySelector('.box'), vw = el.querySelector('.vw'), fr = el.querySelector('iframe');
    var fit = function () {
      var mob = innerWidth <= 600, barH = 0;
      if (o.wide) { // video / màn LED: trang 1280×720, thu nhỏ vừa khung
        var W = mob ? innerWidth : Math.min(980, innerWidth - 80), H = Math.round(W * 9 / 16);
        if (mob) { box.style.width = '100%'; box.style.height = '100%'; vw.style.flex = '1'; vw.style.height = ''; } else { box.style.width = W + 'px'; box.style.height = ''; vw.style.height = H + 'px'; vw.style.flex = ''; }
        var vh = mob ? innerHeight - barH : H, sc = W / 1280;
        fr.style.width = '1280px'; fr.style.height = '720px';
        fr.style.transform = 'translate(0,' + Math.max(0, (vh - 720 * sc) / 2) + 'px) scale(' + sc + ')';
      } else { // thiệp: trang dọc, cuộn được bên trong
        if (mob) { box.style.width = '100%'; box.style.height = '100%'; vw.style.flex = '1'; vw.style.height = ''; fr.style.width = '100%'; fr.style.height = '100%'; }
        else { var h = Math.min(780, innerHeight - 140); box.style.width = '400px'; box.style.height = ''; vw.style.height = h + 'px'; vw.style.flex = ''; fr.style.width = '100%'; fr.style.height = '100%'; }
        fr.style.transform = '';
      }
    };
    fit(); addEventListener('resize', fit);
    var ov = document.body.style.overflow; document.body.style.overflow = 'hidden';
    var onPop = function () { shut(true); };
    var shut = function (fromPop) {
      if (!el.parentNode) return;
      el.remove(); document.body.style.overflow = ov; removeEventListener('resize', fit); removeEventListener('popstate', onPop); removeEventListener('keydown', onKey);
      if (!fromPop && history.state && history.state.tv) history.back();
    };
    var onKey = function (e) { if (e.key === 'Escape') shut(); };
    history.pushState({ tv: 1 }, ''); addEventListener('popstate', onPop); addEventListener('keydown', onKey);
    el.querySelector('.x').onclick = function () { shut(); };
    el.addEventListener('click', function (e) { if (e.target === el) shut(); });
  };

  // đã đăng nhập → nút trên thanh đổi thành "Sổ tay của tôi"
  fetch('/api/me').then(function (r) { return r.json(); }).then(function (me) {
    var a = document.getElementById('navActs');
    if (me.user && a) a.innerHTML = '<a class="btn btn-main btn-sm" href="/thiep-cua-toi">Thiệp của tôi</a>';
    if (me.user) { renderMPanel(me.user); if (window.drawSbar) drawSbar(me.user); if (window.drawUav) drawUav(me.user); }
    var ua = document.querySelector('.uav'); if (ua) ua.style.visibility = '';
  }).catch(function () { var ua = document.querySelector('.uav'); if (ua) ua.style.visibility = ''; });

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

  // "Dùng mẫu" / tạo thiệp, slide, LED, video → mở trình sửa ở TAB MỚI: trang chọn mẫu vẫn còn ở tab cũ,
  // lỡ bấm Quay lại trong trình sửa cũng không mất chỗ đang xem
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="/thiep-cua-toi?tao"],a[href^="/tao-led"],a[href^="/tao-video"],a[href^="/sua/"],a[href^="/sua-led/"],a[href^="/sua-video/"]');
    if (!a || e.defaultPrevented) return;
    a.target = '_blank'; a.rel = 'noopener';
  });
  window.SITE = { LOGO: LOGO, money: money };
  // trang chủ: thanh giá trên cùng cuộn đi thì viên menu lên sát mép trên
  var hn = document.getElementById('hnav');
  if (hn && document.querySelector('.pbar')) {
    var up = function () { hn.classList.toggle('up', window.scrollY > 34); };
    window.addEventListener('scroll', up, { passive: true }); up();
  }
})();
