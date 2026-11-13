(function () {
  'use strict';
  var C = window.__CARD || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function toast(msg) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  // ----- nhạc nền -----
  var audio = $('#bgm');
  var mbtn = $('#musicBtn');
  function playMusic() {
    if (!audio) return;
    var p = audio.play();
    if (p && p.then) p.then(function () { mbtn.classList.add('playing'); }).catch(function () {});
  }
  if (mbtn) mbtn.addEventListener('click', function () {
    if (audio.paused) playMusic();
    else { audio.pause(); mbtn.classList.remove('playing'); }
  });

  // ----- mở thiệp (chạm để mở cũng là cử chỉ cho phép phát nhạc) -----
  var opener = $('#opener');
  if (opener && !C.preview) {
    document.body.classList.add('locked');
    // Mẫu muốn chạy hiệu ứng mở riêng thì đặt data-open-ms trên #opener:
    // lớp "opening" được gắn ngay, đợi đủ số ms rồi mới mờ dần lớp mở thiệp.
    var opening = false;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var open = function () {
      if (opening) return;
      opening = true;
      playMusic();
      var wait = reduce ? 0 : +(opener.getAttribute('data-open-ms') || 0);
      if (wait) opener.classList.add('opening');
      setTimeout(function () {
        opener.classList.add('gone');
        document.body.classList.remove('locked');
        setTimeout(function () { opener.remove(); }, 800);
      }, wait);
    };
    opener.addEventListener('click', open);
  } else if (opener) {
    opener.remove();
  }

  // ----- giữ vị trí cuộn khi xem trước trong trình sửa -----
  if (C.preview && !C.lite) { // bản nhẹ cho thẻ rê chuột: luôn bắt đầu từ đầu trang, không nhớ vị trí cuộn
    var key = 'pv-scroll-' + C.slug;
    try {
      var y = +sessionStorage.getItem(key);
      if (y) window.scrollTo(0, y);
    } catch (e) {}
    window.addEventListener('scroll', function () {
      try { sessionStorage.setItem(key, String(window.scrollY)); } catch (e) {}
    }, { passive: true });
  }

  // ----- hiện dần khi cuộn -----
  var rv = $$('.reveal');
  if ('IntersectionObserver' in window && !C.preview) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add('in'); });
  }

  // ----- đếm ngược -----
  if (C.target) {
    var target = new Date(C.target).getTime();
    // một mẫu có thể đặt nhiều đồng hồ đếm ngược (mẫu nhập từ mehappy): cập nhật mọi ô cùng khoá
    var cells = { d: [], h: [], m: [], s: [] };
    $$('[data-cd]').forEach(function (el) { var k = el.getAttribute('data-cd'); if (cells[k]) cells[k].push(el); });
    var set = function (k, v) { cells[k].forEach(function (el) { el.textContent = v; }); };
    // còn dưới 1 ngày thì ẩn hẳn ô "0 ngày". Ô ngày = khung bao riêng của số ngày (kiểu ô vuông), hoặc — với kiểu chữ
    // liền "<b>0</b> ngày <b>22</b> giờ" — gói số + chữ "ngày" theo sau vào một span để ẩn cùng nhau.
    var dayUnits = cells.d.map(function (el) {
      var p = el.parentElement;
      if (p && p.querySelectorAll('[data-cd]').length === 1 && !p.hasAttribute('role')) return p;
      var w = document.createElement('span'), nx = el.nextSibling;
      el.parentNode.insertBefore(w, el);
      w.appendChild(el);
      if (nx && nx.nodeType === 3) w.appendChild(nx);
      return w;
    });
    var noDays = null;
    var hideDays = function (hide) {
      if (hide === noDays) return;
      noDays = hide;
      dayUnits.forEach(function (u) {
        u.style.display = hide ? 'none' : '';
        // khung lưới chia sẵn 4 cột (ngày/giờ/phút/giây) → còn 3 ô thì chia 3 cột cho cân
        var box = u.parentElement;
        if (!box) return;
        if (hide) {
          var cols = getComputedStyle(box).gridTemplateColumns;
          if (cols && cols !== 'none' && cols.split(' ').length === 4) { box.dataset.cdCols = box.style.gridTemplateColumns || ' '; box.style.gridTemplateColumns = 'repeat(3,1fr)'; }
        } else if (box.dataset.cdCols) { box.style.gridTemplateColumns = box.dataset.cdCols.trim(); delete box.dataset.cdCols; }
      });
    };
    var tick = function () {
      var s = Math.max(0, Math.floor((target - Date.now()) / 1000));
      hideDays(s > 0 && s < 86400);
      set('d', Math.floor(s / 86400));
      set('h', Math.floor(s % 86400 / 3600));
      set('m', Math.floor(s % 3600 / 60));
      set('s', s % 60);
    };
    tick();
    setInterval(tick, 1000);
  }

  // ----- album ảnh -----
  var lb = $('#lightbox');
  $$('.ph').forEach(function (b) {
    b.addEventListener('click', function () {
      $('img', lb).src = C.photos[+b.getAttribute('data-i')];
      lb.hidden = false;
    });
  });
  if (lb) lb.addEventListener('click', function () { lb.hidden = true; });

  // ----- sao chép số tài khoản -----
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-copy');
      (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(
        function () { toast('Đã sao chép số tài khoản'); },
        function () { window.prompt('Số tài khoản', v); }
      );
    });
  });

  // ----- gửi biểu mẫu -----
  function post(url, data) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'Lỗi'); return j; }); });
  }
  function formData(f) {
    var o = {};
    new FormData(f).forEach(function (v, k) { o[k] = v; });
    return o;
  }
  function blocked(msg) {
    if (C.demo) { msg.textContent = 'Đây là thiệp mẫu — tạo thiệp của bạn để dùng tính năng này nhé!'; return true; }
    if (C.preview) { msg.textContent = 'Bạn đang xem trước, khách mời sẽ gửi được ở đây.'; return true; }
    return false;
  }

  var rf = $('#rsvpForm');
  if (rf) rf.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('.form-msg', rf);
    if (blocked(msg)) return;
    var btn = $('button', rf);
    btn.disabled = true;
    var d = formData(rf);
    d.g = C.guest;
    post('/api/public/' + C.slug + '/rsvp', d).then(function () {
      msg.textContent = d.attending === 'yes' ? 'Cảm ơn bạn! Hẹn gặp bạn trong ngày vui nhé ♥' : 'Cảm ơn bạn đã báo cho chúng mình biết ♥';
      rf.reset();
      if ($('input[name=name]', rf) && d.name) $('input[name=name]', rf).value = d.name;
    }).catch(function (err) { msg.textContent = err.message; })
      .then(function () { btn.disabled = false; });
  });

  var wf = $('#wishForm');
  if (wf) wf.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('.form-msg', wf);
    if (blocked(msg)) return;
    var btn = $('button', wf);
    btn.disabled = true;
    var d = formData(wf);
    post('/api/public/' + C.slug + '/wish', d).then(function () {
      var el = document.createElement('div');
      el.className = 'wish';
      var b = document.createElement('b'); b.textContent = d.name;
      var p = document.createElement('p'); p.textContent = d.message;
      el.appendChild(b); el.appendChild(p);
      $('#wishList').prepend(el);
      $('textarea', wf).value = '';
      msg.textContent = 'Cảm ơn lời chúc của bạn ♥';
    }).catch(function (err) { msg.textContent = err.message; })
      .then(function () { btn.disabled = false; });
  });

  // ----- căn ảnh trong khung: link ảnh có "#p=x,y[,z]" → điểm lấy nét x%,y% và phóng to z lần -----
  // Ảnh <img>: object-position + phóng to quanh điểm lấy nét, cắt đúng bằng khung cũ (clip-path) nên không tràn ra ngoài.
  // Ảnh nền: tính lại kích thước "cover × z" theo cỡ thật của ảnh.
  function focusOf(u) { var m = /#p=([\d.]+),([\d.]+)(?:,([\d.]+))?/.exec(u || ''); return m ? { x: +m[1], y: +m[2], z: Math.max(1, +m[3] || 1) } : null; }
  function zoomImg(im, f) {
    im.style.objectPosition = f.x + '% ' + f.y + '%';
    if (f.z <= 1) return;
    var k = 1 - 1 / f.z;
    im.style.transformOrigin = f.x + '% ' + f.y + '%';
    im.style.scale = String(f.z); // thuộc tính "scale" riêng: không đè lên transform (xoay, hiệu ứng) sẵn có của mẫu
    im.style.clipPath = 'inset(' + (f.y * k) + '% ' + ((100 - f.x) * k) + '% ' + ((100 - f.y) * k) + '% ' + (f.x * k) + '%)';
  }
  var bgs = [];
  function sizeBg(b) {
    var W = b.el.clientWidth, H = b.el.clientHeight;
    if (!W || !H || !b.iw) return;
    var s = Math.max(W / b.iw, H / b.ih) * b.f.z;
    b.el.style.backgroundSize = Math.ceil(b.iw * s) + 'px ' + Math.ceil(b.ih * s) + 'px';
  }
  function applyFocus(root) {
    $$('img[src*="#p="]', root).forEach(function (im) { var f = focusOf(im.getAttribute('src')); if (f) zoomImg(im, f); });
    $$('[style*="#p="]', root).forEach(function (el) {
      var st = el.getAttribute('style'), f = focusOf(st);
      if (!f) return;
      el.style.backgroundPosition = f.x + '% ' + f.y + '%';
      if (f.z <= 1) return;
      var m = /url\(['"]?([^'")]+)/.exec(st); if (!m) return;
      var b = { el: el, f: f }, img = new Image();
      img.onload = function () { b.iw = img.naturalWidth; b.ih = img.naturalHeight; sizeBg(b); };
      img.src = m[1];
      bgs.push(b);
    });
  }
  window.addEventListener('resize', function () { bgs.forEach(sizeBg); });
  applyFocus(document);
  window.__applyFocus = applyFocus;
})();

// Trang xem thử một mẫu (/demo/<mẫu>): thanh nổi "Mẫu khác · Dùng mẫu này" để khách đang xem trên điện thoại khỏi phải tự quay lại tìm nút.
// Không hiện khi trang nằm trong khung xem trước (thẻ rê chuột, trình sửa).
(function () {
  var C = window.__CARD || {};
  if (!C.demo || C.preview || !C.tpl || window.top !== window) return;
  var css = document.createElement('style');
  css.textContent = '.demobar{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483000;display:flex;gap:6px;padding:6px;border-radius:999px;background:rgba(24,18,20,.88);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 10px 30px rgba(0,0,0,.3);font:600 15px/1 "Be Vietnam Pro",system-ui,sans-serif;white-space:nowrap}'
    + '.demobar a{display:flex;align-items:center;height:44px;padding:0 18px;border-radius:999px;color:#fff;text-decoration:none}'
    + '.demobar .go{background:#d6455d;padding:0 22px}';
  document.head.appendChild(css);
  var bar = document.createElement('nav');
  bar.className = 'demobar';
  bar.setAttribute('aria-label', 'Chọn mẫu');
  var use = '/thiep-cua-toi?tao=' + encodeURIComponent(C.tpl) + (C.pal ? '&mau=' + encodeURIComponent(C.pal) : '');
  bar.innerHTML = '<a href="/mau-thiep" class="back">‹ Mẫu khác</a><a href="' + use + '" class="go">Dùng mẫu này</a>';
  bar.querySelector('.back').addEventListener('click', function (e) {
    var r = document.referrer;
    if (r && r.indexOf(location.origin + '/mau-thiep') === 0 && history.length > 1) { e.preventDefault(); history.back(); }
  });
  bar.querySelector('.go').addEventListener('click', function () {
    try { navigator.sendBeacon('/api/t', JSON.stringify({ u: 'thiep:' + C.tpl })); } catch (e) { /* bỏ qua */ }
  });
  document.body.appendChild(bar);
})();
