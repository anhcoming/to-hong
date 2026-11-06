// Bộ dựng video dạm ngõ trên canvas 1920×1080.
// renderAt(t) là hàm thuần theo thời gian: mọi chuyển động tuần hoàn theo độ dài video,
// nên video lặp lại liền mạch và bản quay MP4 giống hệt bản xem trên web.
(function () {
  'use strict';
  var W = 1920, H = 1080, TAU = Math.PI * 2;

  var FONT = {
    script: function (s) { return '700 ' + s + 'px "Charm", cursive'; },
    serif: function (s) { return '500 ' + s + 'px "Fraunces", Georgia, serif'; },
    italic: function (s) { return 'italic 400 ' + s + 'px "Fraunces", Georgia, serif'; },
    sans: function (s) { return '300 ' + s + 'px "Hanken Grotesk", system-ui, sans-serif'; },
    caps: function (s) { return '500 ' + s + 'px "Hanken Grotesk", system-ui, sans-serif'; },
  };

  var THEMES = {
    sen: { bg: ['#6a0d16', '#2a0308'], main: '#fff0d4', accent: '#e8b65a', soft: '#f1cfa0', particle: '#ffd98a', overlay: 'rgba(58,4,10,0.66)' },
    dao: { bg: ['#fffaf6', '#f5d9d3'], main: '#5b2a2f', accent: '#c2415d', soft: '#7a474d', particle: '#ee9fb2', overlay: 'rgba(255,244,240,0.74)' },
    may: { bg: ['#86121b', '#3d0509'], main: '#fff3dc', accent: '#f0c46a', soft: '#ecd0a2', particle: '#ffe0a0', overlay: 'rgba(72,6,12,0.62)' },
  };

  var WD = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function frac(v) { return v - Math.floor(v); }
  function easeOut(p) { return 1 - Math.pow(1 - p, 3); }
  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  // số ngẫu nhiên cố định theo hạt giống — hạt bụi/cánh hoa giống nhau mỗi lần dựng
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // ---------- thay biến {…} ----------
  function values(video, info) {
    var ev = video.event || {};
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ev.date || '');
    var ngay = m ? WD[new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay()] + ', ngày ' + m[3] + ' tháng ' + m[2] + ' năm ' + m[1] : '';
    var gio = '';
    if (ev.time) { var hm = ev.time.split(':'); gio = (+hm[0]) + ' giờ' + (hm[1] !== '00' ? ' ' + hm[1] : ''); }
    info = info || {};
    return {
      chu_re: info.chu_re || '', co_dau: info.co_dau || '', bo_me_trai: info.bo_me_trai || '', bo_me_gai: info.bo_me_gai || '',
      le: ev.kind || '', ngay: ngay, gio: gio, dia_diem: ev.place || '',
      am_lich: m && window.Lunar ? window.Lunar.lunarText(ev.date) : '',
    };
  }
  function resolve(text, vals) {
    var empty = false;
    var out = String(text || '').replace(/\{(\w+)\}/g, function (all, k) {
      if (!(k in vals)) return all;
      if (!vals[k]) empty = true;
      return vals[k];
    });
    return empty || !out.trim() ? null : out; // dòng thiếu thông tin thì ẩn
  }

  // ---------- hoạ tiết ----------
  function petal(ctx, w, h) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(w, -h * 0.25, w * 0.55, -h * 0.85, 0, -h);
    ctx.bezierCurveTo(-w * 0.55, -h * 0.85, -w, -h * 0.25, 0, 0);
  }
  function lotus(ctx, x, y, s, gold, sway) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.lineWidth = 2.4 / s * 1.2;
    ctx.strokeStyle = gold;
    // lá
    ctx.fillStyle = rgba(gold, 0.08);
    ctx.beginPath(); ctx.ellipse(0, 18, 210, 34, 0, 0, TAU); ctx.fill(); ctx.stroke();
    // cánh ngoài → trong
    var rings = [[-68, 120, 54], [-38, 150, 58], [-14, 175, 56], [14, 175, 56], [38, 150, 58], [68, 120, 54]];
    for (var i = 0; i < rings.length; i++) {
      ctx.save();
      ctx.rotate((rings[i][0] + sway) * Math.PI / 180);
      petal(ctx, rings[i][2], rings[i][1]);
      ctx.fillStyle = rgba(gold, 0.10 + 0.04 * (i % 2));
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.save(); ctx.rotate(sway * Math.PI / 360); petal(ctx, 60, 200); ctx.fillStyle = rgba(gold, 0.2); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.restore();
  }
  function frame(ctx, color, inset) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(inset + 14, inset + 14, W - (inset + 14) * 2, H - (inset + 14) * 2);
  }
  function cloud(ctx, x, y, s, flipX, flipY) {
    // hoạ tiết mây cuộn: ba vòng xoắn nối nhau
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s * (flipX ? -1 : 1), s * (flipY ? -1 : 1));
    ctx.beginPath();
    ctx.arc(0, 0, 26, Math.PI * 0.5, Math.PI * 2.2);
    ctx.arc(14, -6, 10, Math.PI * 0.2, Math.PI * 1.4, true);
    ctx.moveTo(26, 8);
    ctx.arc(58, 8, 32, Math.PI, Math.PI * 2.4);
    ctx.arc(70, 2, 13, Math.PI * 0.4, Math.PI * 1.5, true);
    ctx.moveTo(90, 14);
    ctx.arc(116, 14, 26, Math.PI, Math.PI * 2.1);
    ctx.stroke();
    ctx.restore();
  }
  function blossom(ctx, x, y, r, col, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = col;
    for (var i = 0; i < 5; i++) {
      ctx.save(); ctx.rotate(i * TAU / 5);
      ctx.beginPath(); ctx.ellipse(0, -r * 0.62, r * 0.48, r * 0.62, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#fff6f8';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.32, 0, TAU); ctx.fill();
    ctx.fillStyle = '#b8344f';
    for (var j = 0; j < 6; j++) { var a = j * TAU / 6; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2, r * 0.06, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function branch(ctx, ox, oy, sx, sy, p) {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(sx, sy);
    ctx.strokeStyle = '#6b4a3f';
    ctx.lineCap = 'round';
    ctx.lineWidth = 16;
    ctx.beginPath(); ctx.moveTo(-40, -30); ctx.bezierCurveTo(140, 40, 260, 30, 520, 150); ctx.stroke();
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(200, 50); ctx.bezierCurveTo(250, 130, 300, 190, 330, 290); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(380, 95); ctx.bezierCurveTo(430, 60, 480, 40, 560, 40); ctx.stroke();
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(90, 18); ctx.bezierCurveTo(100, 80, 130, 120, 120, 180); ctx.stroke();
    var pts = [[60, 0, 30], [150, 40, 26], [230, 40, 34], [300, 70, 24], [330, 290, 30], [300, 200, 22], [265, 130, 28], [420, 90, 32], [510, 135, 26], [560, 40, 24], [480, 48, 20], [120, 180, 26], [110, 110, 20]];
    for (var i = 0; i < pts.length; i++) {
      var q = pts[i];
      var col = i % 3 === 0 ? '#e98aa1' : i % 3 === 1 ? '#f4b6c4' : '#dd6f8b';
      blossom(ctx, q[0], q[1], q[2] * (1 + 0.04 * Math.sin(TAU * p + i)), col, i + TAU * p * 0);
    }
    ctx.restore();
  }

  // ---------- bộ dựng ----------
  function create(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var video = null, vals = {}, scenes = [], theme = THEMES.sen, D = 21;
    var photo = null, raf = 0, t0 = 0, dust = [], fontsReady = false;

    function setPhoto(url) {
      photo = null;
      if (!url) return;
      var img = new Image();
      img.onload = function () { photo = img; };
      img.src = url;
    }
    setPhoto(opts.photo);

    function buildParticles() {
      var r = rng(video.template === 'dao' ? 7 : 3);
      dust = [];
      var n = video.template === 'dao' ? 46 : 90;
      for (var i = 0; i < n; i++) {
        dust.push({ x: r(), y: r(), s: r(), ph: r() * TAU, c: 1 + Math.floor(r() * 2), tw: 1 + Math.floor(r() * 4), rot: Math.floor(r() * 3) - 1 });
      }
    }

    function set(v, info) {
      video = v;
      theme = THEMES[v.template] || THEMES.sen;
      if (info) vals = values(v, info); else vals = values(v, { chu_re: vals.chu_re, co_dau: vals.co_dau, bo_me_trai: vals.bo_me_trai, bo_me_gai: vals.bo_me_gai });
      scenes = (v.scenes || []).map(function (s) {
        return s.lines.map(function (l) { return { text: resolve(l.text, vals), l: l }; }).filter(function (x) { return x.text; });
      }).filter(function (s) { return s.length; });
      if (!scenes.length) scenes = [[{ text: ' ', l: { font: 'serif', size: 40, tone: 'main' } }]];
      D = scenes.length * (v.seconds || 7);
      buildParticles();
    }

    function bg(t) {
      var g = ctx.createRadialGradient(W / 2, H * 0.42, 60, W / 2, H / 2, W * 0.62);
      g.addColorStop(0, theme.bg[0]);
      g.addColorStop(1, theme.bg[1]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      if (video.photoBg && photo) {
        var k = 1.04 + 0.04 * Math.sin(TAU * t / D); // phóng nhẹ tuần hoàn
        var sc = Math.max(W / photo.width, H / photo.height) * k;
        var pw = photo.width * sc, ph = photo.height * sc;
        ctx.drawImage(photo, (W - pw) / 2, (H - ph) / 2, pw, ph);
        ctx.fillStyle = theme.overlay;
        ctx.fillRect(0, 0, W, H);
        var v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.7);
        v.addColorStop(0, 'rgba(0,0,0,0)');
        v.addColorStop(1, video.template === 'dao' ? 'rgba(120,60,70,0.25)' : 'rgba(0,0,0,0.45)');
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, W, H);
      }
    }

    function decor(t) {
      var p = t / D;
      var tpl = video.template;
      ctx.save();
      if (tpl === 'sen') {
        frame(ctx, rgba(theme.accent, 0.55), 40);
        var sway = 3 * Math.sin(TAU * p * 2);
        lotus(ctx, 210, H - 70, 0.95, theme.accent, sway);
        lotus(ctx, W - 210, H - 70, 0.95, theme.accent, -sway);
        ctx.globalAlpha = 0.5;
        lotus(ctx, W / 2, 150, 0.32, theme.accent, 0);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = rgba(theme.accent, 0.6); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(W / 2 - 260, 168); ctx.lineTo(W / 2 - 90, 168); ctx.moveTo(W / 2 + 90, 168); ctx.lineTo(W / 2 + 260, 168); ctx.stroke();
      } else if (tpl === 'dao') {
        frame(ctx, rgba(theme.accent, 0.35), 40);
        branch(ctx, 0, 40, 1, 1, p);
        branch(ctx, W, H - 40, -1, -1, p + 0.5);
      } else {
        // mây cung đình: chữ Hỷ chìm + khung mây bốn góc
        ctx.fillStyle = rgba(theme.accent, 0.07);
        ctx.font = '760px "Noto Serif SC","Songti SC","SimSun","Microsoft YaHei",serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('囍', W / 2, H / 2 + 30);
        frame(ctx, rgba(theme.accent, 0.75), 46);
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        var cs = 1.15;
        cloud(ctx, 96, 120, cs, false, false); cloud(ctx, 120, 96, cs * 0.7, false, false);
        cloud(ctx, W - 96, 120, cs, true, false); cloud(ctx, W - 120, 96, cs * 0.7, true, false);
        cloud(ctx, 96, H - 120, cs, false, true); cloud(ctx, 120, H - 96, cs * 0.7, false, true);
        cloud(ctx, W - 96, H - 120, cs, true, true); cloud(ctx, W - 120, H - 96, cs * 0.7, true, true);
        // dải hoa văn trên/dưới
        ctx.fillStyle = rgba(theme.accent, 0.8);
        for (var i = -6; i <= 6; i++) {
          [80, H - 80].forEach(function (yy) {
            ctx.save(); ctx.translate(W / 2 + i * 34, yy); ctx.rotate(Math.PI / 4);
            ctx.fillRect(-5, -5, 10, 10); ctx.restore();
          });
        }
      }
      ctx.restore();
    }

    function particles(t) {
      var p = t / D;
      ctx.save();
      if (video.template === 'dao') {
        ctx.fillStyle = theme.particle;
        for (var i = 0; i < dust.length; i++) {
          var d = dust[i];
          var y = frac(d.y + d.c * p) * (H + 80) - 40;
          var x = d.x * W + 50 * Math.sin(TAU * (p * 2) + d.ph);
          var s = 9 + d.s * 12;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(d.ph + TAU * d.rot * p);
          ctx.scale(1, 0.45 + 0.55 * Math.abs(Math.cos(TAU * d.tw * p + d.ph)));
          ctx.globalAlpha = 0.75;
          petal(ctx, s * 0.9, s * 2);
          ctx.fill();
          ctx.restore();
        }
      } else {
        for (var j = 0; j < dust.length; j++) {
          var q = dust[j];
          var yy = H - frac(q.y + q.c * p) * (H + 40);
          var xx = q.x * W + 18 * Math.sin(TAU * p * 3 + q.ph);
          var a = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(TAU * q.tw * p + q.ph));
          var r = 1.2 + q.s * 3;
          var g = ctx.createRadialGradient(xx, yy, 0, xx, yy, r * 4);
          g.addColorStop(0, rgba(theme.particle, 0.9 * a));
          g.addColorStop(1, rgba(theme.particle, 0));
          ctx.fillStyle = g;
          ctx.fillRect(xx - r * 4, yy - r * 4, r * 8, r * 8);
        }
      }
      ctx.restore();
    }

    function wrap(text, maxW) {
      var words = text.split(' '), lines = [], cur = '';
      for (var i = 0; i < words.length; i++) {
        var test = cur ? cur + ' ' + words[i] : words[i];
        if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = words[i]; } else cur = test;
      }
      if (cur) lines.push(cur);
      return lines;
    }

    function text(t) {
      var sec = video.seconds || 7;
      var idx = Math.floor(t / sec) % scenes.length;
      var local = t - Math.floor(t / sec) * sec;
      var out = clamp((sec - local) / 0.8);
      var items = [];
      var total = 0;
      var hasLS = 'letterSpacing' in ctx;
      scenes[idx].forEach(function (it, j) {
        var l = it.l;
        var s = l.size;
        ctx.font = FONT[l.font](s);
        if (hasLS) ctx.letterSpacing = l.font === 'caps' ? Math.round(s * 0.3) + 'px' : '0px';
        var str = l.font === 'caps' ? it.text.toUpperCase() : it.text;
        var parts = wrap(str, W - 360);
        var lh = s * (l.font === 'script' ? 1.18 : 1.32);
        items.push({ l: l, parts: parts, lh: lh, j: j });
        total += parts.length * lh;
      });
      var gap = 10;
      total += gap * (items.length - 1);
      var y = (H - total) / 2;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      items.forEach(function (it) {
        var l = it.l;
        var pIn = easeOut(clamp((local - 0.35 - it.j * 0.22) / 0.9));
        var alpha = pIn * out;
        ctx.font = FONT[l.font](l.size);
        if (hasLS) ctx.letterSpacing = l.font === 'caps' ? Math.round(l.size * 0.3) + 'px' : '0px';
        ctx.fillStyle = l.color || theme[l.tone] || theme.main;
        ctx.globalAlpha = alpha;
        var light = video.template === 'dao' && !(video.photoBg && photo) ? false : true;
        ctx.shadowColor = light ? rgba(theme.accent, l.font === 'script' ? 0.45 : 0.25) : 'rgba(255,255,255,0.6)';
        ctx.shadowBlur = l.font === 'script' ? 26 : 12;
        it.parts.forEach(function (ln, k) {
          ctx.fillText(ln, W / 2, y + it.lh * (k + 0.5) + (1 - pIn) * 34);
        });
        y += it.parts.length * it.lh + gap;
      });
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      if (hasLS) ctx.letterSpacing = '0px';
    }

    function renderAt(t) {
      if (!video) return;
      t = ((t % D) + D) % D;
      ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
      ctx.globalAlpha = 1;
      bg(t);
      decor(t);
      particles(t);
      text(t);
      if (opts.trial) {
        ctx.font = FONT.sans(28);
        ctx.textAlign = 'right';
        ctx.fillStyle = rgba(theme.main, 0.55);
        ctx.fillText('Bản dùng thử · ' + (opts.brand || ''), W - 80, H - 76);
      }
    }

    function loop(now) {
      renderAt((now - t0) / 1000);
      raf = requestAnimationFrame(loop);
    }
    function play() { cancelAnimationFrame(raf); t0 = performance.now(); raf = requestAnimationFrame(loop); }
    function seek(t) { t0 = performance.now() - t * 1000; }
    function stop() { cancelAnimationFrame(raf); }

    // Mã hoá nhanh bằng WebCodecs: dựng từng khung hình theo thời điểm chính xác → luồng H.264 thô.
    // Không phụ thuộc thời gian thực nên nhanh hơn và vẫn chạy khi tab bị ẩn.
    var AVC = ['avc1.640028', 'avc1.4d0028', 'avc1.42e028'];
    function encodeFast(onProgress) {
      var fps = 30, total = Math.round(D * fps), parts = [], failed = null;
      var enc = new VideoEncoder({
        output: function (chunk) { var b = new Uint8Array(chunk.byteLength); chunk.copyTo(b); parts.push(b); },
        error: function (e) { failed = e; },
      });
      var base = { width: W, height: H, bitrate: 14e6, framerate: fps, avc: { format: 'annexb' } };
      function pick(i) {
        if (i >= AVC.length) return Promise.reject(new Error('Trình duyệt chưa hỗ trợ mã hoá H.264'));
        var c = Object.assign({ codec: AVC[i] }, base);
        return VideoEncoder.isConfigSupported(c).then(function (r) { return r.supported ? c : pick(i + 1); });
      }
      function breathe() {
        // nhường luồng khi hàng đợi mã hoá đầy; MessageChannel không bị hãm như setTimeout ở tab nền
        return new Promise(function (res) { var ch = new MessageChannel(); ch.port1.onmessage = function () { res(); }; ch.port2.postMessage(0); });
      }
      return pick(0).then(function (c) {
        enc.configure(c);
        var i = 0;
        function next() {
          if (failed) return Promise.reject(failed);
          if (i >= total) return enc.flush();
          if (enc.encodeQueueSize > 6) return breathe().then(next);
          renderAt(i / fps);
          var f = new VideoFrame(canvas, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
          enc.encode(f, { keyFrame: i % (fps * 2) === 0 });
          f.close();
          i++;
          if (onProgress && i % 10 === 0) onProgress(i / total);
          return (i % 15 === 0 ? breathe() : Promise.resolve()).then(next);
        }
        return next();
      }).then(function () {
        enc.close();
        if (failed) throw failed;
        return new Blob(parts, { type: 'video/h264' });
      });
    }

    function record(onProgress) {
      if (window.VideoEncoder && window.VideoFrame) {
        return ready().then(function () { stop(); return encodeFast(onProgress); }).catch(function (e) {
          console.warn('WebCodecs lỗi, chuyển sang quay thời gian thực:', e);
          return recordRealtime(onProgress);
        });
      }
      return recordRealtime(onProgress);
    }

    // Dự phòng: quay thời gian thực bằng MediaRecorder (cần giữ tab mở)
    function recordRealtime(onProgress) {
      return ready().then(function () {
        return new Promise(function (resolve, reject) {
          if (!canvas.captureStream || !window.MediaRecorder) return reject(new Error('Trình duyệt chưa hỗ trợ quay video — dùng Chrome hoặc Edge trên máy tính nhé'));
          var types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
          var type = types.filter(function (x) { return MediaRecorder.isTypeSupported(x); })[0];
          if (!type) return reject(new Error('Trình duyệt chưa hỗ trợ quay video'));
          stop();
          var stream = canvas.captureStream(30);
          var rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 16e6 });
          var chunks = [];
          rec.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
          rec.onerror = function (e) { reject(e.error || new Error('Quay video lỗi')); };
          rec.onstop = function () { resolve(new Blob(chunks, { type: type.split(';')[0] })); };
          renderAt(0);
          var start = 0;
          rec.start(1000);
          function step(now) {
            if (!start) start = now;
            var t = (now - start) / 1000;
            if (t >= D) { renderAt(D - 0.001); setTimeout(function () { rec.stop(); }, 120); return; }
            renderAt(t);
            if (onProgress) onProgress(t / D);
            requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        });
      });
    }

    function ready() {
      if (fontsReady || !document.fonts) return Promise.resolve();
      return Promise.all(['700 80px "Charm"', '500 80px "Fraunces"', 'italic 400 80px "Fraunces"', '300 80px "Hanken Grotesk"', '500 80px "Hanken Grotesk"']
        .map(function (f) { return document.fonts.load(f, 'Đẹp'); })).then(function () { fontsReady = true; }, function () { fontsReady = true; });
    }
    ready();

    return {
      set: set, setPhoto: setPhoto, renderAt: renderAt, play: play, stop: stop, seek: seek, record: record, ready: ready,
      duration: function () { return D; },
    };
  }

  window.VideoEngine = { create: create, THEMES: THEMES };
})();
