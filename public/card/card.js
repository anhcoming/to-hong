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
    var open = function () {
      opener.classList.add('gone');
      document.body.classList.remove('locked');
      playMusic();
      setTimeout(function () { opener.remove(); }, 800);
    };
    opener.addEventListener('click', open);
  } else if (opener) {
    opener.remove();
  }

  // ----- giữ vị trí cuộn khi xem trước trong trình sửa -----
  if (C.preview) {
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
    var cells = {};
    $$('[data-cd]').forEach(function (el) { cells[el.getAttribute('data-cd')] = el; });
    var tick = function () {
      var s = Math.max(0, Math.floor((target - Date.now()) / 1000));
      if (cells.d) cells.d.textContent = Math.floor(s / 86400);
      if (cells.h) cells.h.textContent = Math.floor(s % 86400 / 3600);
      if (cells.m) cells.m.textContent = Math.floor(s % 3600 / 60);
      if (cells.s) cells.s.textContent = s % 60;
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
})();
