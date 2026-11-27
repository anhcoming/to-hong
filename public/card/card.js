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


  // ----- hiệu ứng nền: hoa anh đào / tuyết / lá / hoa mai / tim rơi nhẹ phủ trên thiệp (không chặn bấm) -----
  (function () {
    var kind = C.fx;
    if (!kind || C.lite) return;
    try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) { /* bỏ qua */ }
    var cv = document.createElement('canvas');
    cv.className = 'fx-layer';
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:40';
    document.body.appendChild(cv);
    var g = cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
    function size() { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); addEventListener('resize', size);
    var COL = { sakura: ['#ffd1dc', '#ffb7c9', '#fbc4d4'], snow: ['#ffffff', '#f2f6ff'], leaves: ['#e3a23b', '#c9692c', '#b5452a', '#d9a441'], mai: ['#ffd23f', '#ffc21a', '#f6b800'], hearts: ['#ff6f8f', '#ff8fa8', '#e84a6f'] }[kind] || ['#fff'];
    var N = kind === 'snow' ? 46 : 26, ps = [];
    function mk(top) {
      return { x: Math.random() * W, y: top ? -20 - Math.random() * 40 : Math.random() * H, s: (kind === 'snow' ? 1.5 + Math.random() * 2.5 : 6 + Math.random() * 6),
        vy: (kind === 'snow' ? 0.35 : 0.55) + Math.random() * 0.6, sw: Math.random() * 6.28, sp: 0.01 + Math.random() * 0.02, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.04,
        c: COL[Math.floor(Math.random() * COL.length)], o: 0.55 + Math.random() * 0.4 };
    }
    for (var i = 0; i < N; i++) ps.push(mk(false));
    function petal(p) { g.beginPath(); g.ellipse(0, 0, p.s * 0.55, p.s, 0, 0, 6.283); g.fill(); }
    function leaf(p) { g.beginPath(); g.moveTo(0, -p.s); g.quadraticCurveTo(p.s * 0.8, 0, 0, p.s); g.quadraticCurveTo(-p.s * 0.8, 0, 0, -p.s); g.fill(); }
    function flower(p) { for (var k = 0; k < 5; k++) { g.save(); g.rotate(k * 1.2566); g.beginPath(); g.ellipse(0, -p.s * 0.45, p.s * 0.32, p.s * 0.5, 0, 0, 6.283); g.fill(); g.restore(); } g.fillStyle = '#e07b00'; g.beginPath(); g.arc(0, 0, p.s * 0.16, 0, 6.283); g.fill(); }
    function heart(p) { var s = p.s * 0.55; g.beginPath(); g.moveTo(0, s * 0.6); g.bezierCurveTo(-s * 1.6, -s * 0.4, -s * 0.5, -s * 1.5, 0, -s * 0.5); g.bezierCurveTo(s * 0.5, -s * 1.5, s * 1.6, -s * 0.4, 0, s * 0.6); g.fill(); }
    var draw = { sakura: petal, leaves: leaf, mai: flower, hearts: heart, snow: function (p) { g.beginPath(); g.arc(0, 0, p.s, 0, 6.283); g.fill(); } }[kind] || petal;
    var run = true;
    document.addEventListener('visibilitychange', function () { run = !document.hidden; if (run) requestAnimationFrame(tick); });
    function tick() {
      if (!run) return;
      g.clearRect(0, 0, W, H);
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i];
        p.sw += p.sp; p.y += p.vy; p.x += Math.sin(p.sw) * 0.6; p.r += p.vr;
        if (p.y > H + 20) ps[i] = p = mk(true);
        g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.globalAlpha = p.o; g.fillStyle = p.c; draw(p); g.restore();
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

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

  // ----- hộp thoại: tiêu đề + nút đóng đứng yên khi cuộn nội dung -----
  // Hộp có sẵn thanh đầu (…-dlg-head, vd. Hộp quà mừng) thì card.css cho dính trên cùng. Hộp chỉ có nút × đặt nổi
  // (vd. Xác nhận tham dự: tiêu đề nằm trong nội dung) → gom tiêu đề + nút × vào một thanh dính; không có tiêu đề thì giữ nút ×.
  $$('dialog').forEach(function (dlg) {
    var x = null;
    for (var c = dlg.firstElementChild; c; c = c.nextElementSibling) {
      if (c.tagName === 'BUTTON' && c.getAttribute('aria-label') === 'Đóng') { x = c; break; }
    }
    if (!x) return;
    var bar = document.createElement('div');
    bar.className = 'dlg-bar';
    var sec = x.nextElementSibling;
    var h = sec && sec.firstElementChild && /^H[23]$/.test(sec.firstElementChild.tagName) ? sec.firstElementChild : null;
    dlg.insertBefore(bar, dlg.firstChild);
    if (h) {
      var cs = getComputedStyle(sec), hs = getComputedStyle(h);
      bar.style.background = getComputedStyle(dlg).backgroundColor;
      bar.style.paddingLeft = cs.paddingLeft;
      if (hs.textAlign === 'center') h.style.paddingLeft = '44px'; // tiêu đề căn giữa: chừa bên trái bằng nút × cho cân
      bar.appendChild(h);
      bar.appendChild(x);
      sec.style.paddingTop = '0';
      dlg.style.paddingTop = '0';
      dlg.addEventListener('scroll', function () { bar.classList.toggle('stuck', dlg.scrollTop > 2); }, { passive: true });
    } else {
      bar.classList.add('only-x');
      bar.appendChild(x);
    }
  });

  // ----- album ảnh -----
  var lb = $('#lightbox');
  $$('.ph').forEach(function (b) {
    b.addEventListener('click', function () {
      $('img', lb).src = C.photos[+b.getAttribute('data-i')];
      lb.hidden = false;
    });
  });
  if (lb) lb.addEventListener('click', function () { lb.hidden = true; });

  // ----- mừng cưới: bấm mã QR → bảng mã to, Lưu mã QR, chuyển khoản bằng app ngân hàng (link VietQR, như Zalo) -----
  var QR_APPS = [['mb', 'MB Bank'], ['vcb', 'Vietcombank'], ['tcb', 'Techcombank'], ['bidv', 'BIDV'], ['icb', 'VietinBank'], ['vba', 'Agribank'], ['vpb', 'VPBank'], ['acb', 'ACB']];
  function qrEsc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function qrSave(src, name) {
    // ảnh VietQR .png chuyển hướng sang .svg (bước chuyển không cho tải chéo) → lấy thẳng .svg, vẽ ra PNG để lưu vào thư viện ảnh
    var url = src.split('#')[0].replace(/(img\.vietqr\.io\/[^?]*)\.png/, '$1.svg');
    fetch(url).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(function (b) {
      if (!/svg/.test(b.type)) return b;
      return new Promise(function (ok, no) {
        var im = new Image(), u0 = URL.createObjectURL(b);
        im.onload = function () {
          var c = document.createElement('canvas'), n = 720, pad = 40; c.width = c.height = n + pad * 2;
          var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, pad, pad, n, n);
          URL.revokeObjectURL(u0); c.toBlob(function (p) { p ? ok(p) : no(); }, 'image/png');
        };
        im.onerror = no; im.src = u0;
      });
    }).then(function (b) {
      var u = URL.createObjectURL(b), a = document.createElement('a');
      a.href = u; a.download = name + (/jpe?g/.test(b.type) ? '.jpg' : /webp/.test(b.type) ? '.webp' : '.png');
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
    }).catch(function () { window.open(src, '_blank'); }); // không tải được (chặn CORS…) → mở ảnh, giữ ảnh để lưu
  }
  function qrView(g, src) {
    var d = g.dataset, ios = /iP(hone|ad|od)/.test(navigator.userAgent), touch = window.matchMedia && matchMedia('(pointer:coarse)').matches;
    var apps = d.ba && touch ? '<div class="qrv-apps"><p>Chuyển khoản bằng app ngân hàng</p><div class="qrv-g">' + QR_APPS.map(function (a) {
      return '<a href="https://dl.vietqr.io/pay?app=' + a[0] + '&ba=' + encodeURIComponent(d.ba) + '&tn=' + encodeURIComponent(d.tn || '') + '" target="_blank" rel="noopener"><img src="https://cdn.vietqr.io/bank-app-icon/' + a[0] + (ios ? '-ios' : '-android') + '.webp" alt="" loading="lazy">' + a[1] + '</a>';
    }).join('') + '</div></div>' : '';
    var dlg = document.createElement('dialog');
    dlg.className = 'qrv';
    dlg.innerHTML = '<div class="qrv-in"><button type="button" class="qrv-x" aria-label="Đóng">✕</button><h3>' + qrEsc(d.who) + '</h3>' +
      '<img src="' + qrEsc(src) + '" alt="Mã QR chuyển khoản">' +
      '<p class="qrv-i">' + (d.bank ? qrEsc(d.bank) + '<br>' : '') + (d.acc ? '<b>' + qrEsc(d.acc) + '</b>' : '') + qrEsc(d.holder) + '</p>' +
      '<button type="button" class="qrv-dl"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 3v12m0 0l-5-5m5 5l5-5M5 21h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Lưu mã QR</button>' + apps + '</div>';
    document.body.appendChild(dlg);
    var close = function () { dlg.close(); dlg.remove(); };
    dlg.querySelector('.qrv-x').onclick = close;
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    dlg.querySelector('.qrv-dl').onclick = function () { qrSave(src, 'ma-qr-' + (d.acc || 'mung-cuoi')); };
    dlg.showModal();
  }
  $$('[data-gift] img').forEach(function (im) {
    im.addEventListener('click', function () { qrView(im.closest('[data-gift]'), im.currentSrc || im.src); });
  });

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

  // nút gửi: khoá sau khi gửi xong (khỏi bấm lặp thành nhiều bản), đổi chữ "Đã gửi ✓"; khách sửa ô nào thì mở lại
  // đang gửi: nút đổi chữ "Đang gửi…" (khách thấy đã bấm được, không bấm lại); lỗi thì trả chữ cũ
  function sending(btn, on) {
    if (on) { if (!btn.hasAttribute('data-label')) btn.setAttribute('data-label', btn.innerHTML); btn.disabled = true; btn.textContent = 'Đang gửi…'; btn.setAttribute('aria-busy', 'true'); }
    else { btn.removeAttribute('aria-busy'); btn.disabled = false; if (btn.hasAttribute('data-label')) btn.innerHTML = btn.getAttribute('data-label'); }
  }
  function sendBtn(f) { return $('button[type=submit]', f) || $('button:not([type=button])', f) || $('button', f); }
  function markSent(f, btn) {
    if (!btn.hasAttribute('data-label')) btn.setAttribute('data-label', btn.innerHTML);
    btn.textContent = 'Đã gửi ✓';
    btn.disabled = true;
    f.setAttribute('data-sent', '1');
  }
  function unmarkSent(f, btn) {
    if (!f.hasAttribute('data-sent')) return;
    f.removeAttribute('data-sent');
    if (btn.hasAttribute('data-label')) btn.innerHTML = btn.getAttribute('data-label');
    btn.disabled = false;
  }
  function reopenOnEdit(f) {
    var h = function () { unmarkSent(f, sendBtn(f)); };
    f.addEventListener('input', h);
    f.addEventListener('change', h);
  }

  var rf = $('#rsvpForm');
  if (rf) reopenOnEdit(rf);
  if (rf) rf.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('.form-msg', rf);
    if (blocked(msg)) return;
    var btn = sendBtn(rf);
    if (rf.hasAttribute('data-sent')) return;
    sending(btn, true);
    var ok = false;
    var d = formData(rf);
    d.g = C.guest;
    post('/api/public/' + C.slug + '/rsvp', d).then(function () {
      msg.textContent = d.attending === 'yes' ? 'Cảm ơn bạn! Hẹn gặp bạn trong ngày vui nhé ♥' : 'Cảm ơn bạn đã báo cho chúng mình biết ♥';
      rf.reset();
      if ($('input[name=name]', rf) && d.name) $('input[name=name]', rf).value = d.name;
      ok = true;
      markSent(rf, btn);
      // nằm trong hộp thoại đang mở → để lời cảm ơn hiện ~1,8 giây rồi tự đóng; biểu mẫu nằm sẵn trên trang thì giữ nguyên
      var dlg = rf.closest('dialog');
      if (dlg && dlg.open) setTimeout(function () { if (dlg.open) dlg.close(); }, 1800);
    }).catch(function (err) { msg.textContent = err.message; })
      .then(function () { btn.removeAttribute('aria-busy'); if (!ok) sending(btn, false); });
  });

  var wf = $('#wishForm');
  if (wf) reopenOnEdit(wf);
  if (wf) wf.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('.form-msg', wf);
    if (blocked(msg)) return;
    var btn = sendBtn(wf);
    if (wf.hasAttribute('data-sent')) return;
    sending(btn, true);
    var ok = false;
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
      ok = true;
      markSent(wf, btn);
      setTimeout(function () { unmarkSent(wf, btn); }, 3000); // lời chúc gửi thêm được, chỉ chặn bấm lặp ngay sau khi gửi
    }).catch(function (err) { msg.textContent = err.message; })
      .then(function () { btn.removeAttribute('aria-busy'); if (!ok) sending(btn, false); });
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
  bar.innerHTML = '<a href="/mau-thiep" class="back">‹ Mẫu khác</a><a href="' + use + '" class="go" target="_blank" rel="noopener">Dùng mẫu này</a>'; // trình sửa mở tab mới
  bar.querySelector('.back').addEventListener('click', function (e) {
    var r = document.referrer;
    if (r && r.indexOf(location.origin + '/mau-thiep') === 0 && history.length > 1) { e.preventDefault(); history.back(); }
  });
  bar.querySelector('.go').addEventListener('click', function () {
    try { navigator.sendBeacon('/api/t', JSON.stringify({ u: 'thiep:' + C.tpl })); } catch (e) { /* bỏ qua */ }
  });
  document.body.appendChild(bar);
})();
