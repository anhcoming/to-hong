// Phần chung của các trang giới thiệu: thanh trên, chân trang, giá từ cấu hình, hiệu ứng hiện dần.
(function () {
  'use strict';
  // logo giống trang chủ: tim viền + chữ in hoa màu hồng
  var LOGO = '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 27C6.5 20 3 15 3 10.5 3 6.9 5.8 4 9.4 4c2.6 0 4.6 1.4 6.6 3.9C18 5.4 20 4 22.6 4 26.2 4 29 6.9 29 10.5 29 15 25.5 20 16 27z" stroke="currentColor" stroke-width="2.4"/></svg>';
  var MENU = [['/mau-thiep', 'Thiệp cưới', 'tpl'], ['/video-cuoi', 'Video cưới', 'video'], ['/so-tay-cuoi', 'Sổ tay cưới', 'planner']]; // 3 chức năng chính
  var page = document.body.getAttribute('data-page') || '';

  var nav = document.getElementById('nav');
  if (nav) {
    nav.className = 'nav' + (document.body.hasAttribute('data-solid') ? ' always' : '');
    nav.innerHTML = '<div class="wrap"><a class="logo" href="/">' + LOGO + '<span data-brand>Cưới Nha</span></a>' +
      '<nav class="menu">' + MENU.map(function (m) { return '<a href="' + m[0] + '"' + (m[2] === page ? ' class="on"' : '') + '>' + m[1] + '</a>'; }).join('') + '</nav>' +
      (window.themeBtn ? themeBtn() : '') + '<div class="acts" id="navActs"><a class="btn btn-ghost btn-sm login" href="/dang-nhap">Đăng nhập</a><a class="btn btn-main btn-sm" href="/mau-thiep">Tạo thiệp</a></div>' +
      '<button class="burger" id="burger" type="button" aria-label="Mở menu" aria-expanded="false"><i></i></button></div>' +
      // bảng menu điện thoại: 3 chức năng + đăng nhập + đổi nền
      '<nav class="mpanel" aria-label="Menu">' + MENU.map(function (m, i) { return '<a href="' + m[0] + '"><i>' + ['💌', '🎬', '📒'][i] + '</i>' + m[1] + '</a>'; }).join('') +
      '<a href="/dang-nhap" id="mLogin"><i>👤</i>Đăng nhập</a><a href="#" onclick="toggleTheme();return false"><i>🌓</i>Đổi nền sáng / tối</a></nav>';
    var burger = document.getElementById('burger');
    burger.addEventListener('click', function () { var on = !nav.classList.contains('mopen'); nav.classList.toggle('mopen', on); burger.setAttribute('aria-expanded', on); });
    var onScroll = function () { nav.classList.toggle('solid', window.scrollY > 40); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  var foot = document.getElementById('foot');
  if (foot) {
    foot.className = 'foot';
    foot.innerHTML = '<div class="wrap"><div class="cols">' +
      '<div><a class="logo" href="/" style="margin-bottom:10px">' + LOGO + '<span data-brand>Cưới Nha</span></a><p style="margin:0;max-width:340px">Thiệp cưới online, video cưới chiếu TV và sổ tay chuẩn bị đám cưới — báo tin vui bằng một đường link.</p></div>' +
      '<div><h4>Sản phẩm</h4><a href="/mau-thiep">Thiệp cưới online</a><a href="/video-cuoi">Video cưới chiếu TV</a><a href="/so-tay-cuoi">Sổ tay cưới miễn phí</a></div>' +
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
    var ml = document.getElementById('mLogin');
    if (me.user && ml) ml.outerHTML = '<a href="/thiep-cua-toi"><i>👤</i>Thiệp &amp; video của tôi</a>';
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

  window.SITE = { LOGO: LOGO, money: money };
})();
