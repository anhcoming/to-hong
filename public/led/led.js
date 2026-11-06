// Trình chiếu màn hình LED: nền hiệu ứng canvas + các cảnh chữ chuyển lần lượt.
(function () {
  'use strict';
  var C = window.__LED;
  var L = C.led;
  var stage = document.getElementById('stage');
  var canvas = document.getElementById('fx');
  var ctx = canvas.getContext('2d');
  var slidesEl = document.getElementById('slides');
  var W, H, K = 1, AREA = 1;
  var parts = [], extra = [], sprite = null, pal;
  var slides = [], cur = 0, paused = false, timer = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  // ---------------- bố cục & bảng màu ----------------
  function layout() {
    var r = C.ratios[L.ratio] || C.ratios['16:9'];
    W = r[0]; H = r[1];
    AREA = (W * H) / (1920 * 1080);
    stage.style.width = W + 'px';
    stage.style.height = H + 'px';
    var s = Math.min(window.innerWidth / W, window.innerHeight / H);
    stage.style.transform = 'translate(-50%,-50%) scale(' + s + ')';
    // độ phân giải canvas theo kích thước hiển thị thật (máy yếu ở nhà hàng đỡ giật); không để về 0 khi tab ẩn
    K = Math.max(0.25, Math.min(1, s * (window.devicePixelRatio || 1)));
    canvas.width = Math.round(W * K);
    canvas.height = Math.round(H * K);
    stage.classList.toggle('portrait', H > W);
    stage.classList.toggle('landscape', W > H);
    stage.classList.toggle('narrow', W > H && W / H < 1.5); // 4:3
  }

  function applyPalette() {
    pal = C.palettes[L.palette] || C.palettes.do;
    stage.style.setProperty('--text', pal.text);
    stage.style.setProperty('--accent', pal.accent);
    stage.style.background = 'radial-gradient(ellipse 80% 70% at 50% 42%,' + pal.bg[1] + ',' + pal.bg[0] + ')';
    // ảnh hạt sáng dựng sẵn — vẽ ảnh nhanh hơn nhiều so với gradient mỗi khung hình
    sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    var g = sprite.getContext('2d');
    var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, rgba(pal.particle, 1));
    grd.addColorStop(0.25, rgba(pal.particle, 0.55));
    grd.addColorStop(1, rgba(pal.particle, 0));
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
  }

  // ---------------- hiệu ứng nền ----------------
  var FX = {
    sao: {
      init: function () {
        var n = Math.round(260 * L.density * AREA);
        for (var i = 0; i < n; i++) parts.push({ x: rnd(0, W), y: rnd(0, H), r: rnd(0.6, 2.4), ph: rnd(0, 6.28), sp: rnd(0.6, 2) });
      },
      draw: function (dt, t) {
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          var a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(p.ph + t * p.sp * L.speed));
          ctx.globalAlpha = a;
          var s = p.r * 6;
          ctx.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s);
        }
        // sao băng
        if (Math.random() < dt * 0.45 * L.speed * Math.max(0.5, L.density)) {
          var ang = rnd(0.35, 0.6);
          extra.push({ x: rnd(W * 0.1, W * 0.95), y: rnd(-40, H * 0.35), vx: -Math.cos(ang), vy: Math.sin(ang), v: rnd(900, 1500), life: 0, max: rnd(0.8, 1.4), len: rnd(180, 320) });
        }
        ctx.lineCap = 'round';
        for (var j = extra.length - 1; j >= 0; j--) {
          var m = extra[j];
          m.life += dt;
          m.x += m.vx * m.v * dt * L.speed;
          m.y += m.vy * m.v * dt * L.speed;
          var k = 1 - m.life / m.max;
          if (k <= 0) { extra.splice(j, 1); continue; }
          var tx = m.x - m.vx * m.len, ty = m.y - m.vy * m.len;
          var gr = ctx.createLinearGradient(m.x, m.y, tx, ty);
          gr.addColorStop(0, rgba(pal.particle, 0.95 * k));
          gr.addColorStop(1, rgba(pal.particle, 0));
          ctx.globalAlpha = 1;
          ctx.strokeStyle = gr;
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke();
          ctx.globalAlpha = k;
          ctx.drawImage(sprite, m.x - 14, m.y - 14, 28, 28);
        }
      },
    },
    domdom: {
      init: function () {
        var n = Math.round(80 * L.density * AREA);
        for (var i = 0; i < n; i++) parts.push({ x: rnd(0, W), y: rnd(0, H), a: rnd(0, 6.28), v: rnd(15, 45), r: rnd(10, 34), ph: rnd(0, 6.28), sp: rnd(0.5, 1.6) });
      },
      draw: function (dt, t) {
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          p.a += rnd(-1, 1) * dt * 1.5;
          p.x += Math.cos(p.a) * p.v * dt * L.speed;
          p.y += Math.sin(p.a) * p.v * dt * L.speed - 8 * dt * L.speed;
          if (p.x < -50) p.x = W + 50; if (p.x > W + 50) p.x = -50;
          if (p.y < -50) p.y = H + 50; if (p.y > H + 50) p.y = -50;
          ctx.globalAlpha = 0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin(p.ph + t * p.sp * L.speed), 2);
          ctx.drawImage(sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
        }
      },
    },
    hoa: {
      init: function () {
        var n = Math.round(55 * L.density * AREA);
        for (var i = 0; i < n; i++) parts.push(this.make(true));
      },
      make: function (any) {
        return { x: rnd(-50, W + 50), y: any ? rnd(-50, H) : rnd(-120, -30), s: rnd(14, 30), rot: rnd(0, 6.28), vr: rnd(-1.5, 1.5), vy: rnd(50, 110), sw: rnd(20, 60), ph: rnd(0, 6.28), flip: rnd(0, 6.28) };
      },
      draw: function (dt, t) {
        ctx.fillStyle = pal.particle;
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          p.y += p.vy * dt * L.speed;
          p.rot += p.vr * dt * L.speed;
          p.flip += dt * 2 * L.speed;
          var x = p.x + Math.sin(p.ph + t * 0.8 * L.speed) * p.sw;
          if (p.y > H + 40) parts[i] = this.make(false);
          ctx.save();
          ctx.translate(x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(1, 0.35 + 0.65 * Math.abs(Math.cos(p.flip)));
          ctx.globalAlpha = 0.8;
          ctx.beginPath(); // cánh hoa hình giọt nước
          ctx.moveTo(0, -p.s);
          ctx.bezierCurveTo(p.s * 0.9, -p.s * 0.4, p.s * 0.6, p.s * 0.8, 0, p.s);
          ctx.bezierCurveTo(-p.s * 0.6, p.s * 0.8, -p.s * 0.9, -p.s * 0.4, 0, -p.s);
          ctx.fill();
          ctx.restore();
        }
      },
    },
    lua: {
      init: function () {
        var n = Math.max(2, Math.round(5 * L.density));
        for (var i = 0; i < n; i++) parts.push({ y: H * (0.2 + 0.6 * i / Math.max(1, n - 1)) + rnd(-60, 60), amp: rnd(60, 160), f: rnd(0.8, 1.8), ph: rnd(0, 6.28), sp: rnd(0.25, 0.6), w: rnd(50, 130) });
        var m = Math.round(70 * L.density * AREA);
        for (var j = 0; j < m; j++) extra.push({ x: rnd(0, W), y: rnd(0, H), r: rnd(1, 3), ph: rnd(0, 6.28) });
      },
      draw: function (dt, t) {
        var steps = 48;
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          var gr = ctx.createLinearGradient(0, 0, W, 0);
          gr.addColorStop(0, rgba(pal.particle, 0));
          gr.addColorStop(0.5, rgba(pal.particle, 0.16));
          gr.addColorStop(1, rgba(pal.particle, 0));
          ctx.fillStyle = gr;
          ctx.globalAlpha = 1;
          ctx.beginPath();
          var top = [], k;
          for (k = 0; k <= steps; k++) {
            var x = (k / steps) * W;
            var u = (k / steps) * Math.PI * 2 * p.f;
            var y = p.y + Math.sin(u + p.ph + t * p.sp * L.speed) * p.amp;
            var w = p.w * (0.6 + 0.4 * Math.sin(u * 0.5 + t * 0.4 * L.speed + i));
            top.push([x, y - w / 2, y + w / 2]);
          }
          ctx.moveTo(top[0][0], top[0][1]);
          for (k = 1; k <= steps; k++) ctx.lineTo(top[k][0], top[k][1]);
          for (k = steps; k >= 0; k--) ctx.lineTo(top[k][0], top[k][2]);
          ctx.closePath();
          ctx.fill();
        }
        for (var j = 0; j < extra.length; j++) {
          var s = extra[j];
          ctx.globalAlpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(s.ph + t * 1.5 * L.speed));
          ctx.drawImage(sprite, s.x - s.r * 4, s.y - s.r * 4, s.r * 8, s.r * 8);
        }
      },
    },
  };

  function resetFx() {
    parts = []; extra = [];
    (FX[L.effect] || FX.sao).init();
  }

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    ctx.setTransform(K, 0, 0, K, 0, 0);
    ctx.clearRect(0, 0, W, H);
    (FX[L.effect] || FX.sao).draw(dt, now / 1000);
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  // ---------------- các cảnh ----------------
  function buildSlides() {
    var g = C.groom || {}, b = C.bride || {};
    var gn = esc(g.name || 'Chú rể'), bn = esc(b.name || 'Cô dâu');
    var hy = L.hy ? '<p class="hy glow">囍</p>' : '';
    var out = [];
    if (L.slides.names) {
      out.push('<div class="slide s-names">' + hy + (L.kicker ? '<p class="kicker">' + esc(L.kicker) + '</p>' : '') +
        '<p class="names glow" data-fit><span>' + gn + '</span><span class="amp">&amp;</span><span>' + bn + '</span></p></div>');
    }
    if (L.slides.date && C.date) {
      out.push('<div class="slide s-date"><p class="wd">' + esc(C.date.weekday) + '</p>' +
        '<p class="bigdate glow" data-fit>' + C.date.d + '<i>·</i>' + C.date.m + '<i>·</i>' + C.date.y + '</p>' +
        (C.time ? '<p class="time">Vào lúc ' + esc(C.time) + '</p>' : '') +
        (C.lunar ? '<p class="lunar">' + esc(C.lunar) + '</p>' : '') + '</div>');
    }
    var fam = function (p, lb) {
      if (!p.father && !p.mother) return '';
      return '<div class="fam"><p class="lb">' + lb + '</p>' + (p.father ? '<p class="pp">' + esc(p.father) + '</p>' : '') +
        (p.mother ? '<p class="pp">' + esc(p.mother) + '</p>' : '') + (p.address ? '<p class="ad">' + esc(p.address) + '</p>' : '') + '</div>';
    };
    var fams = fam(g, 'Nhà trai') + fam(b, 'Nhà gái');
    if (L.slides.parents && fams) {
      out.push('<div class="slide s-parents"><p class="title glow">Hân hạnh đón tiếp</p><div class="fams" data-fit>' + fams + '</div></div>');
    }
    if (L.slides.photo && C.photo) {
      out.push('<div class="slide s-photo"><div class="photo" style="background-image:url(\'' + esc(C.photo) + '\')"></div>' +
        '<div class="pn">' + (L.kicker ? '<p class="kicker" style="margin-top:36px">' + esc(L.kicker) + '</p>' : '') +
        '<p class="photo-names glow" data-fit><span>' + gn + '</span> <span class="amp">&amp;</span> <span>' + bn + '</span></p></div></div>');
    }
    if (L.slides.message && L.message) {
      out.push('<div class="slide s-msg"><p class="msg">' + esc(L.message) + '</p><p class="sign glow" data-fit>' + gn + ' &amp; ' + bn + '</p></div>');
    }
    if (!out.length) out.push('<div class="slide"><p class="names glow" data-fit>' + gn + ' <span class="amp">&amp;</span> ' + bn + '</p></div>');
    slidesEl.innerHTML = out.join('');
    slides = Array.prototype.slice.call(slidesEl.children);
    fitAll();
  }

  // thu nhỏ chữ cho vừa khung (tên dài, màn đứng)
  function fitAll() {
    var max = W - 2 * 110;
    Array.prototype.forEach.call(slidesEl.querySelectorAll('[data-fit]'), function (el) {
      el.style.fontSize = '';
      el.style.transform = '';
      var w = el.scrollWidth;
      if (w > max) {
        if (el.classList.contains('fams')) { el.style.transform = 'scale(' + (max / w) + ')'; return; }
        var fs = parseFloat(getComputedStyle(el).fontSize);
        el.style.fontSize = Math.floor(fs * max / w) + 'px';
      }
    });
  }

  function show(i) {
    if (!slides.length) return;
    cur = (i + slides.length) % slides.length;
    slides.forEach(function (s, j) { s.classList.toggle('on', j === cur); });
  }
  function restartTimer() {
    clearInterval(timer);
    if (slides.length > 1) timer = setInterval(function () { if (!paused) show(cur + 1); }, L.seconds * 1000);
  }

  function apply(newLed) {
    var keep = cur;
    L = newLed;
    layout();
    applyPalette();
    resetFx();
    buildSlides();
    show(Math.min(keep, slides.length - 1));
    restartTimer();
  }

  // ---------------- điều khiển ----------------
  var idle;
  function wake() {
    document.body.classList.add('active');
    clearTimeout(idle);
    idle = setTimeout(function () { document.body.classList.remove('active'); }, 2500);
  }
  function fullscreen() {
    var d = document.documentElement;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (d.requestFullscreen) d.requestFullscreen().catch(function () {});
  }
  var pauseBtn = document.querySelector('[data-c=pause]');
  function togglePause() { paused = !paused; pauseBtn.textContent = paused ? '▶︎' : '❚❚'; }
  document.getElementById('ctl').addEventListener('click', function (e) {
    var c = e.target.getAttribute('data-c');
    if (c === 'prev') { show(cur - 1); restartTimer(); }
    if (c === 'next') { show(cur + 1); restartTimer(); }
    if (c === 'pause') togglePause();
    if (c === 'full') fullscreen();
  });
  document.addEventListener('mousemove', wake);
  document.addEventListener('touchstart', wake);
  document.addEventListener('dblclick', fullscreen);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'f' || e.key === 'F') fullscreen();
    else if (e.key === ' ') { e.preventDefault(); togglePause(); }
    else if (e.key === 'ArrowRight') { show(cur + 1); restartTimer(); }
    else if (e.key === 'ArrowLeft') { show(cur - 1); restartTimer(); }
  });
  window.addEventListener('resize', function () { layout(); resetFx(); fitAll(); });

  // giữ màn hình không tắt khi trình chiếu
  var lock = null;
  function keepAwake() {
    if (C.preview || !navigator.wakeLock || document.visibilityState !== 'visible') return;
    navigator.wakeLock.request('screen').then(function (l) { lock = l; }).catch(function () {});
  }
  document.addEventListener('visibilitychange', keepAwake);

  // trình sửa gửi cấu hình mới để xem trước tức thì
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data) return;
    if (e.data.type === 'led-config') {
      if (e.data.card) { C.groom = e.data.card.groom; C.bride = e.data.card.bride; }
      apply(e.data.led);
    }
    if (e.data.type === 'led-goto') { show(e.data.index); restartTimer(); }
  });

  apply(L);
  show(0);
  if (!C.preview) wake();
  keepAwake();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
  requestAnimationFrame(frame);
})();
