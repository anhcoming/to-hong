// Phần chung của các trang giới thiệu: thanh trên, chân trang, giá từ cấu hình, hiệu ứng hiện dần.
(function () {
  'use strict';
  if (!document.querySelector('script[src="/js/ver.js"]')) { const vs = document.createElement('script'); vs.src = '/js/ver.js'; vs.defer = true; document.head.appendChild(vs); } // phiên bản mờ ở góc dưới
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
  var MENU = [['/mau-thiep', 'Thiệp cưới', 'tpl'], ['/slide-cuoi', 'Slide cưới', 'slide'], ['/man-hinh-led-dam-cuoi', 'Màn hình LED', 'led'], ['/video-dam-ngo', 'Màn hình dạm ngõ', 'damngo'], ['/so-tay-cuoi', 'Sổ tay cưới', 'planner'], ['/video', 'Video báo hỷ', 'baohy']]; // các chức năng chính
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
    ['/video-dam-ngo', 'video', 'Màn hình dạm ngõ', 'damngo'],
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
      '<div><a class="logo" href="/" style="margin-bottom:10px">' + LOGO + '</a><p style="margin:0;max-width:340px">Thiệp cưới online, màn hình LED, slide cưới, màn hình dạm ngõ chiếu TV và sổ tay chuẩn bị đám cưới — báo tin vui bằng một đường link.</p></div>' +
      '<div><h4>Sản phẩm</h4><a href="/mau-thiep">Thiệp cưới online</a><a href="/slide-cuoi">Slide ảnh cưới</a><a href="/man-hinh-led-dam-cuoi">Màn hình LED đám cưới</a><a href="/video-dam-ngo">Màn hình dạm ngõ chiếu TV</a><a href="/so-tay-cuoi">Sổ tay cưới miễn phí</a><a href="/goi-y">Gợi ý thiệp từ ảnh cưới</a></div>' +
      '<div><h4>Hỗ trợ</h4><a href="/#hoi-dap">Câu hỏi thường gặp</a><a href="/#gia">Bảng giá</a><a href="/dieu-khoan">Điều khoản sử dụng</a><a href="/chinh-sach-bao-mat">Chính sách bảo mật</a><a href="/hoan-tien">Thanh toán &amp; hoàn tiền</a><span data-contact hidden style="display:block;margin-bottom:8px">Zalo: <b data-zalo style="color:var(--ink)"></b></span><span data-contact hidden><span data-email></span></span></div>' +
      '</div><div class="copy"><span>© ' + new Date().getFullYear() + ' <span data-brand>Cưới Nha</span></span><span>Làm bằng ♥ tại Việt Nam</span></div></div>';
  }

  var money = function (n) { return Number(n || 0).toLocaleString('vi-VN') + 'đ'; };
  var k = function (n) { return Math.round((n || 0) / 1000) + 'k'; };
  fetch('/api/meta').then(function (r) { return r.json(); }).then(function (m) {
    window.CN_META = m;
    window.META = m;
    var set = function (sel, v) { document.querySelectorAll(sel).forEach(function (e) { e.textContent = v; }); };
    set('[data-brand]', m.brand);
    set('[data-price]', money(m.price));
    set('[data-price-k]', k(m.price));
    set('[data-led-k]', k(m.ledPrice)); set('[data-video-k]', k(m.videoPrice));
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

  if (page) {
    var sst = document.createElement('style');
    sst.textContent = '@media (max-width:760px){'
      + '.burger,.hnav .burger,.mpanel{display:none!important}'
      + '#hacts,#navActs{display:none!important}.uav{display:block!important;margin-left:auto}'
      + '.nav .logo{display:inline-flex;align-items:center}}';
    sst.textContent += '.lhome{display:none}.uav{display:none;position:relative;flex:none}'
      + '.uav>a,.uav>button{display:grid;place-items:center;width:40px;height:40px;padding:0;border-radius:50%;border:1px solid var(--line,#f0e4e6);background:var(--card,#fff);color:var(--ink,#2b2224);cursor:pointer;font:inherit;font-size:13px;font-weight:800;text-decoration:none}'
      + '.uav>a,.uav>button{border:0!important;background:rgba(214,69,93,.1)!important;color:#d6455d!important}'
      + '.uav>a.lgin{width:auto;padding:0 16px;border-radius:999px;font-size:13.5px;font-weight:700;white-space:nowrap}'
      + '.usplit{display:flex;align-items:stretch;height:36px;border-radius:999px;background:linear-gradient(120deg,#d6455d,#ec6f86);box-shadow:0 8px 20px rgba(214,69,93,.28)}'
      + '.usplit a{display:flex;align-items:center;padding:0 10px 0 14px;color:#fff;font-size:13px;font-weight:600;text-decoration:none;white-space:nowrap}'
      + '.usplit button{display:grid;place-items:center;width:30px;padding:0 4px 0 0;border:0;border-left:1px solid rgba(255,255,255,.35);border-radius:0 999px 999px 0;background:none;cursor:pointer}'
      + '.usplit button::before{content:"";width:6px;height:6px;border-right:1.6px solid #fff;border-bottom:1.6px solid #fff;transform:translateY(-2px) rotate(45deg);transition:transform .2s}.uav.open .usplit button::before{transform:translateY(1px) rotate(225deg)}'
      + '@media (min-width:761px){.uav.dk{display:block}#navActs:has(~.uav.dk){display:none}.uav.dk .usplit{height:38px}.uav.dk .usplit a{font-size:14px;padding:0 12px 0 16px}}'
      + '.uav svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}'
      + '.uav .um{position:absolute;right:0;top:calc(100% + 10px);z-index:60;min-width:255px;padding:8px;border-radius:14px;background:var(--card,#fff);box-shadow:0 0 0 1px var(--line,#f0e4e6),0 20px 50px rgba(120,40,50,.18);display:none}'
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
      uav.innerHTML = '<div class="usplit"><a href="/thiep-cua-toi">Thiệp của tôi</a><button type="button" aria-label="Tài khoản" aria-expanded="false"></button></div><div class="um"><div class="who"><b>' + esc(user.name) + '</b>' + esc(user.email) + '</div>' + '<a href="/thiep-cua-toi"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5 12 13l8.5-6.5"/></svg>Thiệp &amp; màn LED của tôi</a><a href="/don-hang"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14l-1.2 11.2A2 2 0 0 1 15.8 20H8.2a2 2 0 0 1-2-1.8z"/><path d="M9 7V6a3 3 0 0 1 6 0v1"/></svg>Đơn hàng của tôi</a><a href="/video-cua-toi"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/><path d="m10 8 4 2-4 2z"/></svg>Slide của tôi</a><a href="/so-tay"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/></svg>Sổ tay của tôi</a>'
        + '<a href="#" data-theme-toggle><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>Đổi nền sáng / tối</a><a href="#" data-logout><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 16l-4-4 4-4M6 12h10"/></svg>Đăng xuất</a></div>'; // nút "Thiệp của tôi ˅" giống trang chủ: chữ → Thiệp của tôi, mũi tên → menu
      uav.classList.add('in'); if (document.getElementById('navActs')) uav.classList.add('dk'); // trang giới thiệu (không phải trang chủ): máy tính cũng dùng nút này
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
    // thanh 5 nút dưới cùng (điện thoại): Trang chủ · Thiệp · Video · Màn LED · tài khoản — dùng chung với trang tài khoản (public/js/bnav.js)
    var bq = { user: undefined };
    var bs = document.createElement('script'); bs.src = '/js/bnav.js';
    bs.onload = function () { window.cnBottom.draw(page, bq.user); };
    document.head.appendChild(bs);
    window.drawSbar = function (user) { bq.user = user; if (window.cnBottom) window.cnBottom.draw(page, user); };
  }

  // Xem trước một mẫu (thiệp / video / màn LED) — dùng ở trang chủ và /mau-thiep: bấm thẻ là mở, không cần nút riêng.
  // Điện thoại: toàn màn hình, tên mẫu góc trên trái, ✕ góc trên phải, dưới cùng nút Dùng mẫu liền khối (nút Back của máy cũng đóng).
  // Máy tính: popup giữa màn (thiệp: khung điện thoại; video / LED: khung 16:9), cùng bố cục.
  // o = { src, name, use, wide }
  // "Thấy đám cưới của mình": tên đôi + ngày cưới khách gõ trong khung xem mẫu, lưu trong máy (localStorage cnTen),
  // gắn vào link xem thử (?groom=&bride=&date=) và link Dùng mẫu (thiệp tạo ra có sẵn tên + ngày)
  var TEN = function () { try { return JSON.parse(localStorage.getItem('cnTen') || 'null') || {}; } catch (e) { return {}; } };
  var tenQS = function (t) { return ['groom', 'bride', 'date'].filter(function (k) { return t[k]; }).map(function (k) { return k + '=' + encodeURIComponent(t[k]); }).join('&'); };
  var addQS = function (u, qs) { return qs ? u + (u.indexOf('?') < 0 ? '?' : '&') + qs : u; };
  window.cnTen = { get: TEN, qs: function () { return tenQS(TEN()); } };
  window.tplView = function (o) {
    if (!document.getElementById('tvCss')) {
      var c = document.createElement('style'); c.id = 'tvCss';
      c.textContent = '.tv{position:fixed;inset:0;z-index:10060;display:flex;align-items:center;justify-content:center;background:rgba(20,10,14,.62);animation:tvIn .2s ease;max-width:none;width:auto;margin:0;aspect-ratio:auto;padding:0;border:0;border-radius:0;box-shadow:none}' // gỡ kiểu khung TV .tv của site.css (trùng tên) — trước đây làm lớp xem bị bẹp 16:9 trên điện thoại
        + '@keyframes tvIn{from{opacity:0}}'
        + '.tv .box{position:relative;display:flex;flex-direction:column;overflow:hidden;border-radius:22px;background:#fff;padding:0;border:0;max-width:none;box-shadow:0 30px 80px rgba(0,0,0,.35)}'
        + '.tv .vw{position:relative;overflow:hidden;background:#1a1214}.tv .vw iframe{position:absolute;left:0;top:0;border:0;border-radius:0;transform-origin:0 0;background:#fff}'
        + '.tv .nm{position:absolute;top:10px;left:10px;z-index:3;max-width:calc(100% - 70px);padding:0 16px;height:40px;line-height:40px;border-radius:999px;background:rgba(0,0,0,.5);color:#fff;font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
        + '.tv .box::after{content:"";position:absolute;left:0;right:0;bottom:0;height:120px;z-index:2;pointer-events:none;background:linear-gradient(0deg,rgba(0,0,0,.45),transparent)}'
        + '.tv .go{position:absolute;left:16px;right:16px;bottom:16px;z-index:3;display:flex;align-items:center;justify-content:center;gap:8px;height:52px;border-radius:999px;background:linear-gradient(135deg,#d6455d,#ef7d8d);color:#fff;font-weight:700;font-size:16px;text-decoration:none;box-shadow:0 10px 26px rgba(214,69,93,.45)}'
        + '.tv .go:active{transform:scale(.98)}'
        + '.tv .x{position:absolute;top:10px;right:10px;z-index:3;width:40px;height:40px;border:0;border-radius:50%;background:rgba(0,0,0,.5);color:#fff;font-size:20px;line-height:1;display:grid;place-items:center;cursor:pointer}'
        + '.tv .ld{position:absolute;inset:0;display:grid;place-items:center;color:#f3c9d0;font-size:13px}'
        + '.tv .bt{position:absolute;left:16px;right:16px;bottom:16px;z-index:3;display:flex;flex-direction:column;align-items:stretch;gap:10px}'
        + '.tv .bt .go{position:static;left:auto;right:auto;bottom:auto;flex:1}'
        + '.tv .row{display:flex;gap:8px}.tv .row .soft{flex:none;display:flex;align-items:center;height:52px;padding:0 18px;border-radius:999px;border:0;background:rgba(255,255,255,.92);color:#d6455d;font:700 15px inherit;font-family:inherit;cursor:pointer}'
        + '.tv .tn{align-self:center;display:inline-flex;align-items:center;gap:6px;max-width:100%;height:34px;padding:0 14px;border:0;border-radius:999px;background:rgba(0,0,0,.5);backdrop-filter:blur(6px);color:#fff;font:600 13.5px inherit;font-family:inherit;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
        + '.tv .tn b{font-family:"Dancing Script",cursive;font-size:17px;font-weight:700}'
        + '.tv .pn{position:absolute;left:0;right:0;bottom:0;z-index:5;max-height:86%;overflow:auto;padding:18px 16px max(18px,env(safe-area-inset-bottom));border-radius:20px 20px 0 0;background:#fff;color:#1f1a1b;box-shadow:0 -10px 30px rgba(0,0,0,.25);animation:tvUp .2s ease}@keyframes tvUp{from{transform:translateY(30px);opacity:0}}'
        + '.tv .pn h4{margin:0 30px 4px 0;font-size:17px}.tv .pn p{margin:0 0 12px;color:#7a6e70;font-size:13px;line-height:1.5}.tv .pn .px{position:absolute;right:12px;top:12px;width:32px;height:32px;border:0;border-radius:50%;background:#f6eff0;color:#7a6e70;font-size:15px;cursor:pointer}'
        + '.tv .pn .g2{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center}.tv .pn input{width:100%;box-sizing:border-box;height:44px;padding:0 12px;border:1.5px solid #efe3e4;border-radius:12px;font:500 15px inherit;font-family:inherit;color:#1f1a1b;background:#fff}.tv .pn input:focus{outline:0;border-color:#d6455d}'
        + '.tv .pn .amp{font:700 20px "Dancing Script",cursive;color:#d6455d}.tv .pn label{display:block;margin-top:10px;font-size:12.5px;color:#7a6e70}.tv .pn .ok{display:flex;justify-content:center;margin-top:14px}.tv .pn .ok button{height:46px;padding:0 26px;border:0;border-radius:999px;background:linear-gradient(135deg,#d6455d,#ef7d8d);color:#fff;font:700 15px inherit;font-family:inherit;cursor:pointer}'
        + '.tv .pn .it{display:flex;gap:12px;align-items:center;padding:10px;border-radius:14px;box-shadow:0 0 0 1px #efe3e4;margin-bottom:8px}.tv .pn .it .im{flex:none;width:132px;aspect-ratio:16/9;border-radius:9px;overflow:hidden;background:#1a1214 center top/cover;position:relative}.tv .pn .it .im.tall{width:70px;aspect-ratio:3/4.3}'
        + '.tv .pn .it .im iframe{position:absolute;left:0;top:0;width:1280px;height:720px;border:0;transform-origin:0 0;pointer-events:none}'
        + '.tv .pn .it b{display:block;font-size:14px}.tv .pn .it small{display:block;color:#7a6e70;font-size:12px;margin-top:2px}.tv .pn .it em{font-style:normal;color:#d6455d;font-weight:700;font-size:13.5px}'
        + '.tv .pn .sum{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:6px;padding-top:12px;border-top:1px dashed #efe3e4}.tv .pn .sum b{display:block;color:#d6455d;font-size:21px}.tv .pn .sum small{color:#1f8a5b;font-size:12px;font-weight:600}'
        + '.tv .pn .sum a{height:46px;padding:0 22px;border-radius:999px;background:linear-gradient(135deg,#d6455d,#ef7d8d);color:#fff;font-weight:700;font-size:15px;display:inline-flex;align-items:center;text-decoration:none;white-space:nowrap}'
        + '@media (max-width:600px){.tv{background:#000}.tv .box{width:100%;height:100%;border-radius:0}.tv .x,.tv .nm{top:max(10px,env(safe-area-inset-top))}.tv .bt{bottom:max(16px,calc(env(safe-area-inset-bottom) + 8px))}}';
      document.head.appendChild(c);
    }
    var esc = function (t) { return String(t || '').replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); };
    var el = document.createElement('div'); el.className = 'tv'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Xem trước mẫu ' + (o.name || ''));
    // tên mẫu góc trên trái, ✕ góc trên phải, nút Dùng mẫu bo tròn nổi ở đáy (đều đè lên khung xem, có lớp tối mờ dần), không dải trắng
    var isCard = /^\/thiep-cua-toi\?tao=/.test(o.use || '');
    el.innerHTML = '<div class="box"><span class="nm">' + esc(o.name) + '</span><button class="x" type="button" aria-label="Đóng">✕</button><div class="vw"><span class="ld">Đang mở mẫu…</span><iframe title="Xem trước mẫu"></iframe></div>'
      + '<div class="bt"><button type="button" class="tn" data-ten></button><div class="row">' + (isCard ? '<button type="button" class="soft" data-bo>Xem cả bộ</button>' : '') + '<a class="go">Dùng mẫu này<span aria-hidden="true">→</span></a></div></div></div>';
    document.body.appendChild(el);
    var box = el.querySelector('.box'), vw = el.querySelector('.vw'), fr = el.querySelector('iframe');
    var go = el.querySelector('.go'), tnb = el.querySelector('[data-ten]');
    // vẽ lại theo tên đã gõ: khung xem, link Dùng mẫu, nút tên
    var draw = function (reload) {
      var t = TEN(), qs = tenQS(t);
      if (reload !== false) fr.src = addQS(o.src, qs);
      go.href = addQS(o.use, qs);
      tnb.innerHTML = t.groom || t.bride ? '✏️ <b>' + esc((t.groom || '…') + ' & ' + (t.bride || '…')) + '</b>' : '✏️ Thử tên của hai bạn';
    };
    draw();
    var panel = function (html) { var old = box.querySelector('.pn'); if (old) old.remove(); var pn = document.createElement('div'); pn.className = 'pn'; pn.innerHTML = '<button type="button" class="px" aria-label="Đóng">✕</button>' + html; box.appendChild(pn); pn.querySelector('.px').onclick = function () { pn.remove(); }; return pn; };
    tnb.onclick = function () {
      var t = TEN();
      var pn = panel('<h4>Tên của hai bạn</h4><p>Xem mẫu với tên, ngày cưới của mình — dùng mẫu là thiệp có sẵn luôn.</p>'
        + '<div class="g2"><input name="g" placeholder="Chú rể" maxlength="40" value="' + esc(t.groom) + '"><span class="amp">&amp;</span><input name="b" placeholder="Cô dâu" maxlength="40" value="' + esc(t.bride) + '"></div>'
        + '<label>Ngày cưới</label><input name="d" type="date" value="' + esc(t.date) + '"><div class="ok"><button type="button">Xem với tên này</button></div>');
      pn.querySelector('input').focus();
      pn.querySelector('.ok button').onclick = function () {
        var v = function (n) { return pn.querySelector('[name=' + n + ']').value.trim().slice(0, 40); };
        try { localStorage.setItem('cnTen', JSON.stringify({ groom: v('g'), bride: v('b'), date: v('d') })); } catch (e) { /* bỏ qua */ }
        pn.remove(); draw();
      };
    };
    // "Xem cả bộ": thiệp + màn LED + slide cùng tên, đặt cạnh nhau; "Lấy cả bộ" → tạo thiệp rồi mở thanh toán tick cả 3 món
    var bob = el.querySelector('[data-bo]');
    if (bob) bob.onclick = function () {
      var t = TEN(), qs = tenQS(t), m = window.CN_META || {}, money = function (n) { return Number(n || 0).toLocaleString('vi-VN') + 'đ'; };
      var pal = (/[?&]palette=([\w-]+)/.exec(o.src) || [])[1] || '';
      var tp = (/\/demo\/([\w-]+)/.exec(o.src) || [])[1] || '';
      var led = /do|son|ruou|tham|hong/.test(pal) ? 'palette=sondo&effect=satindo' : 'palette=bac&effect=dembac';
      var p1 = m.price || 99000, p2 = m.ledPrice || 69000, p3 = m.videoPrice || 49000, sum = p1 + p2 + p3, pct = m.firstOrderPercent || 0;
      var off = pct ? Math.round(sum * pct / 100 / 1000) * 1000 : 0; // làm tròn nghìn như máy chủ (ưu đãi đơn đầu)
      var nm = t.groom || t.bride ? esc((t.groom || '…') + ' & ' + (t.bride || '…')) : 'hai bạn';
      var pn = panel('<h4>Cả bộ cho ' + nm + '</h4><p>Thiệp, màn LED tiệc, slide ảnh cưới — cùng tên, cùng ngày. Sửa một chỗ, ba chỗ đổi theo.</p>'
        + '<div class="it"><div class="im tall" style="background-image:url(\'/demo/cover-' + esc(tp) + '-' + esc(pal) + '.jpg\')"></div><div><b>💌 Thiệp cưới online</b><small>' + esc(o.name) + ' · gửi Zalo, khách xác nhận dự tiệc</small><em>' + money(p1) + '</em></div></div>'
        + '<div class="it"><div class="im"><iframe tabindex="-1" title="Màn LED" src="' + esc(addQS('/led/demo?preview=1&' + led, qs)) + '"></iframe></div><div><b>🖥️ Màn hình LED</b><small>Tên hai bạn trên màn sân khấu</small><em>' + money(p2) + '</em></div></div>'
        + '<div class="it"><div class="im"><iframe tabindex="-1" title="Slide ảnh cưới" src="' + esc(addQS('/video/demo?preview=1&template=album', qs)) + '"></iframe></div><div><b>🎞️ Slide ảnh cưới</b><small>Ảnh cưới thành video chiếu TV</small><em>' + money(p3) + '</em></div></div>'
        + '<div class="sum"><div>' + (off ? '<s style="color:#7a6e70;font-size:13px">' + money(sum) + '</s>' : '') + '<b>' + money(sum - off) + '</b>' + (off ? '<small>Ưu đãi khách mới −' + pct + '%</small>' : '') + '</div><a href="' + esc(addQS(addQS(o.use, 'bo=1'), qs)) + '">Lấy cả bộ</a></div>');
      // khung 1280×720 thu nhỏ vừa ô
      Array.prototype.forEach.call(pn.querySelectorAll('.im iframe'), function (f) { f.style.transform = 'scale(' + (f.parentNode.offsetWidth / 1280) + ')'; });
    };
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
    // nút ✕ bên trong khung xem (màn LED mẫu) báo lên: đóng lớp xem, ở lại trang này
    var onMsg = function (e) { if (e.origin === location.origin && e.source === fr.contentWindow && e.data && e.data.type === 'led-close') shut(); };
    addEventListener('message', onMsg);
    var shut0 = shut; shut = function (p) { removeEventListener('message', onMsg); shut0(p); };
  };

  // đã đăng nhập → nút trên thanh đổi thành "Sổ tay của tôi"
  fetch('/api/me').then(function (r) { return r.json(); }).then(function (me) {
    var a = document.getElementById('navActs');
    if (me.user && a) a.innerHTML = '<a class="btn btn-main btn-sm" href="/thiep-cua-toi">Thiệp của tôi</a>';
    if (me.user) { renderMPanel(me.user); if (window.drawUav) drawUav(me.user); }
    if (window.drawSbar) drawSbar(me.user || null);
    // đã đăng nhập mà máy này chưa nhớ tên đôi (máy mới): lấy từ thiệp của tài khoản để xem mẫu có tên mình
    if (me.user && !TEN().groom && !TEN().bride) fetch('/api/cards').then(function (r) { return r.json(); }).then(function (j) {
      var c = (j.cards || []).filter(function (x) { return x.names; })[0]; if (!c) return;
      var nm = c.names.split(' & ');
      try { localStorage.setItem('cnTen', JSON.stringify({ groom: nm[0] || '', bride: nm[1] || '', date: c.date || '' })); } catch (e) { /* bỏ qua */ }
    }).catch(function () {});
    var ua = document.querySelector('.uav'); if (ua) ua.style.visibility = '';
  }).catch(function () { var ua = document.querySelector('.uav'); if (ua) ua.style.visibility = ''; if (window.drawSbar) drawSbar(null); });

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
