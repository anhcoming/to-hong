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
    album: { bg: ['#2a1a1c', '#0d0809'], main: '#fff6ec', accent: '#e9c27a', soft: '#e8d6c4', particle: '#ffe2a8', overlay: 'rgba(13,8,9,0.55)' },
    may: { bg: ['#86121b', '#3d0509'], main: '#fff3dc', accent: '#f0c46a', soft: '#ecd0a2', particle: '#ffe0a0', overlay: 'rgba(72,6,12,0.62)' },
  };


  // ---------- các mẫu video ảnh (kiểu CapCut) ----------
  // Mỗi mẫu là một bộ tham số: nền (bg), khung ảnh (frame), nhịp ghép ảnh mỗi khung (pattern),
  // kiểu chuyển cảnh xoay vòng (fx), hoạ tiết phủ (decor), kiểu thẻ chữ (title), phông chữ và màu.
  var STYLES = {
    album: { bg: 'blur', dark: true, frame: 'border', single: 'side', pattern: [1, 2, 1, 1, 3, 1, 2], fx: ['zoom', 'slide', 'wipe', 'fade', 'slideUp', 'flash'], decor: 'dust', title: 'line', caption: true,
      theme: { main: '#fff6ec', accent: '#e9c27a', soft: '#e8d6c4', particle: '#ffe2a8' } },
    dienanh: { bg: 'black', base: '#000000', dark: true, frame: 'full', pattern: [1], fx: ['black', 'fade'], decor: 'letterbox', title: 'cinema', caption: true, fonts: { serif: '"Playfair Display", serif' },
      theme: { main: '#ffffff', accent: '#d9c7a3', soft: '#cfc8bd', particle: '#ffffff' } },
    phimcu: { bg: 'dark', base: '#120e0c', dark: true, frame: 'film', pattern: [1], fx: ['burn', 'slide'], decor: 'film', title: 'line', sepia: 0.5, caption: true,
      theme: { main: '#f3e6cf', accent: '#e0a95a', soft: '#cdb89a', particle: '#ffd9a0' } },
    polaroid: { bg: 'paper', base: '#eee4d4', frame: 'polaroid', pattern: [1], fx: ['drop'], decor: 'none', title: 'paper', fonts: { script: '"Dancing Script", cursive' },
      theme: { main: '#3b2a24', accent: '#b5523b', soft: '#7a5f52', particle: '#c9a27a' } },
    tapchi: { bg: 'white', base: '#f7f4ef', frame: 'thin', single: 'mag', pattern: [1, 2, 1, 2], fx: ['wipe', 'slide', 'cut'], decor: 'lines', title: 'mag', italicScript: true, fonts: { serif: '"Playfair Display", serif', script: '"Playfair Display", serif' },
      theme: { main: '#1c1a19', accent: '#b0283a', soft: '#5b5552', particle: '#999999' } },
    songhy: { bg: 'red', base: '#7a0f1b', dark: true, frame: 'gold', single: 'side', pattern: [1, 2, 1, 3], fx: ['zoom', 'flash', 'fade'], decor: 'hy', title: 'hy',
      theme: { main: '#fff0d4', accent: '#e8b65a', soft: '#f1cfa0', particle: '#ffd98a' } },
    traitim: { bg: 'blush', base: '#fbe7eb', frame: 'heart', single: 'side', pattern: [1, 1, 2], fx: ['iris'], decor: 'hearts', title: 'line', fonts: { script: '"Dancing Script", cursive' },
      theme: { main: '#7a2338', accent: '#e0607e', soft: '#9c5566', particle: '#f29bb0' } },
    hoadao: { bg: 'blush', base: '#fff5f3', frame: 'arch', single: 'side', pattern: [1, 2, 1], fx: ['fade', 'zoom'], decor: 'petals', title: 'line', fonts: { script: '"Dancing Script", cursive' },
      theme: { main: '#5b2a2f', accent: '#c2415d', soft: '#7a474d', particle: '#ee9fb2' } },
    laxanh: { bg: 'sage', base: '#eef1e6', frame: 'arch', single: 'side', pattern: [1, 2, 1, 3], fx: ['fade', 'wipe'], decor: 'leaves', title: 'line',
      theme: { main: '#2f3d25', accent: '#6b8a4e', soft: '#55634a', particle: '#a8bd8c' } },
    toigian: { bg: 'white', base: '#ffffff', frame: 'thin', single: 'center', pattern: [1, 2, 3, 1, 2], fx: ['slide', 'slideUp', 'wipe'], decor: 'none', title: 'minimal', fonts: { serif: '"Playfair Display", serif' },
      theme: { main: '#222222', accent: '#8a7a6a', soft: '#666666', particle: '#bbbbbb' } },
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
    // phông chữ theo mẫu: kiểu chữ của từng dòng (bay bướm / có chân / hiện đại…) map sang họ chữ của mẫu
    function font(kind, size) {
      var f = (st && st.fonts) || {}, serif = f.serif || '"Fraunces", Georgia, serif', sans = f.sans || '"Hanken Grotesk", system-ui, sans-serif';
      if (kind === 'script') return (st && st.italicScript ? 'italic 500 ' : '700 ') + size + 'px ' + (f.script || '"Charm", cursive');
      if (kind === 'serif') return '500 ' + size + 'px ' + serif;
      if (kind === 'italic') return 'italic 400 ' + size + 'px ' + serif;
      if (kind === 'sans') return '300 ' + size + 'px ' + sans;
      return '500 ' + size + 'px ' + sans;
    }

    function setPhoto(url) {
      photo = null;
      if (!url) return;
      var img = new Image();
      img.onload = function () { photo = img; };
      img.src = url;
    }
    setPhoto(opts.photo);

    function buildParticles() {
      var petals = st ? st.decor === 'petals' : video.template === 'dao';
      var r = rng(petals ? 7 : 3);
      dust = [];
      var n = petals ? 46 : 90;
      for (var i = 0; i < n; i++) {
        dust.push({ x: r(), y: r(), s: r(), ph: r() * TAU, c: 1 + Math.floor(r() * 2), tw: 1 + Math.floor(r() * 4), rot: Math.floor(r() * 3) - 1 });
      }
    }

    function set(v, info) {
      video = v;
      st = STYLES[v.template] || null;
      theme = st ? st.theme : THEMES[v.template] || THEMES.sen;
      if (info) vals = values(v, info); else vals = values(v, { chu_re: vals.chu_re, co_dau: vals.co_dau, bo_me_trai: vals.bo_me_trai, bo_me_gai: vals.bo_me_gai });
      scenes = (v.scenes || []).map(function (s) {
        return s.lines.map(function (l) { return { text: resolve(l.text, vals), l: l }; }).filter(function (x) { return x.text; });
      }).filter(function (s) { return s.length; });
      if (!scenes.length) scenes = [[{ text: ' ', l: { font: 'serif', size: 40, tone: 'main' } }]];
      D = st ? buildAlbum() : scenes.length * (v.seconds || 7);
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
      if (st ? st.decor === 'petals' : video.template === 'dao') {
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
      textScene(Math.floor(t / sec) % scenes.length, t - Math.floor(t / sec) * sec, sec);
    }
    function textScene(idx, local, sec) {
      var out = clamp((sec - local) / 0.8);
      var items = [];
      var total = 0;
      var hasLS = 'letterSpacing' in ctx;
      scenes[idx].forEach(function (it, j) {
        var l = it.l;
        var s = l.size;
        ctx.font = font(l.font, s);
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
        ctx.font = font(l.font, l.size);
        if (hasLS) ctx.letterSpacing = l.font === 'caps' ? Math.round(l.size * 0.3) + 'px' : '0px';
        ctx.fillStyle = l.color || theme[l.tone] || theme.main;
        ctx.globalAlpha = alpha;
        var light = st ? st.dark : !(video.template === 'dao' && !(video.photoBg && photo));
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

    // ---------- video ảnh kiểu CapCut: mỗi mẫu là một "phong cách" trong STYLES ----------
    // Dòng thời gian: thẻ chữ mở đầu (cảnh 1) → các khung ảnh → các thẻ chữ còn lại (cảnh 2, 3…).
    // Đầu và cuối đều mờ về đen để video lặp lại liền mạch.
    var slideUrls = [], slides = [], blurs = [], shots = [], introSec = 0, shotTotal = 0, photosReady = Promise.resolve();
    var st = null; // phong cách của mẫu đang dựng (null = mẫu chữ cũ sen/đào/mây)
    var TR = 0.7; // giây chuyển cảnh
    var paperTex = null, grainTex = null;

    function blurOf(img) {
      var c = document.createElement('canvas');
      c.width = 192; c.height = 108;
      var x = c.getContext('2d');
      var sc = Math.max(192 / img.width, 108 / img.height);
      if ('filter' in x) x.filter = 'blur(5px)';
      x.drawImage(img, (192 - img.width * sc) / 2, (108 - img.height * sc) / 2, img.width * sc, img.height * sc);
      return c;
    }
    // vân giấy (polaroid) và hạt phim (phim cũ): dựng một lần bằng số ngẫu nhiên cố định
    function texture(kind) {
      var c = document.createElement('canvas'), w = kind === 'grain' ? 640 : 960, h = kind === 'grain' ? 360 : 540;
      c.width = w; c.height = h;
      var x = c.getContext('2d'), r = rng(kind === 'grain' ? 11 : 5), img = x.createImageData(w, h), d = img.data;
      for (var i = 0; i < d.length; i += 4) {
        var v = r();
        if (kind === 'grain') { var g = v * 255; d[i] = d[i + 1] = d[i + 2] = g; d[i + 3] = 28; }
        else { var p = 200 + v * 55; d[i] = p; d[i + 1] = p - 6; d[i + 2] = p - 16; d[i + 3] = v > 0.985 ? 60 : 14; }
      }
      x.putImageData(img, 0, 0);
      if (kind !== 'grain') { // sợi giấy
        x.strokeStyle = 'rgba(120,90,60,0.06)'; x.lineWidth = 1;
        for (var k = 0; k < 160; k++) { var sx = r() * w, sy = r() * h; x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(sx + 20, sy + (r() - 0.5) * 20, sx + 30 + r() * 40, sy + (r() - 0.5) * 30); x.stroke(); }
      }
      return c;
    }
    function setPhotos(urls) {
      slideUrls = (urls || []).filter(Boolean).slice(0, 20);
      var list = slideUrls.slice(), loaded = list.map(function () { return null; });
      slides = loaded; blurs = [];
      photosReady = Promise.all(list.map(function (u, i) {
        return new Promise(function (res) {
          var img = new Image();
          img.crossOrigin = 'anonymous'; // ảnh trên kho lưu trữ khác tên miền vẫn quay video được
          img.onload = function () { loaded[i] = img; res(); };
          img.onerror = function () { res(); };
          img.src = u;
        });
      })).then(function () {
        if (slideUrls.join() !== list.join()) return; // đã đổi bộ ảnh khác trong lúc tải
        slides = loaded.filter(Boolean);
        blurs = slides.map(blurOf);
        if (video) set(video);
      });
    }
    setPhotos(opts.photos);

    function buildAlbum() {
      var sec = video.seconds || 7, ps = video.photoSec || 3, pat = st.pattern, fx = st.fx;
      introSec = sec;
      shots = [];
      var i = 0, k = 0, n = slides.length;
      while (i < n) {
        var want = pat[k % pat.length], grp = [];
        k++;
        while (grp.length < want && i < n) {
          var im = slides[i], land = im && im.width > im.height * 1.1;
          if (land && grp.length) break; // ảnh ngang đứng một mình cả khung
          grp.push(i); i++;
          if (land) break;
        }
        shots.push({ ids: grp, dur: ps * (grp.length === 1 ? 1 : grp.length === 2 ? 1.5 : 1.8), fx: fx[shots.length % fx.length], n: shots.length });
      }
      var t = introSec;
      shots.forEach(function (s) { s.t0 = t; t += s.dur; });
      shotTotal = t - introSec;
      return introSec + shotTotal + Math.max(0, scenes.length - 1) * sec;
    }

    // ---------- hình dạng ----------
    function easeInOut(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
    function archPath(x, y, w, h) {
      var r = w / 2;
      ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + r); ctx.arc(x + r, y + r, r, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.closePath();
    }
    function heartPath(cx, cy, s) { // s = bề rộng trái tim
      var w = s / 2, h = s * 0.92;
      ctx.beginPath();
      ctx.moveTo(cx, cy + h * 0.5);
      ctx.bezierCurveTo(cx - w * 1.15, cy - h * 0.05, cx - w * 0.85, cy - h * 0.72, cx, cy - h * 0.3);
      ctx.bezierCurveTo(cx + w * 0.85, cy - h * 0.72, cx + w * 1.15, cy - h * 0.05, cx, cy + h * 0.5);
      ctx.closePath();
    }
    // vẽ ảnh lấp đầy vùng đang cắt (clip), zoom + trượt nhẹ theo p (0→1)
    function fillImg(img, x, y, w, h, p, dir, zoom) {
      if (!img) { ctx.fillStyle = '#2a2224'; ctx.fillRect(x, y, w, h); return; }
      var z = 1.02 + (zoom || 0.08) * p;
      var sc = Math.max(w / img.width, h / img.height) * z;
      var iw = img.width * sc, ih = img.height * sc, ex = iw - w, ey = ih - h;
      var px = dir % 2 ? p : 1 - p;
      if (st && st.sepia && 'filter' in ctx) ctx.filter = 'sepia(' + st.sepia + ') contrast(1.06) saturate(0.85)';
      ctx.drawImage(img, x - ex * (0.3 + 0.4 * px), y - ey * (dir > 1 ? 0.25 + 0.3 * p : 0.2), iw, ih);
      if (st && st.sepia && 'filter' in ctx) ctx.filter = 'none';
    }
    function drawCover(img, x, y, w, h, p, dir, r) {
      ctx.save(); roundRect(x, y, w, h, r || 0); ctx.clip(); fillImg(img, x, y, w, h, p, dir); ctx.restore();
    }
    function shadowed(fn, blur, oy, a) {
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,' + (a || 0.35) + ')'; ctx.shadowBlur = blur; ctx.shadowOffsetY = oy; fn(); ctx.restore();
    }
    // một ảnh trong khung theo phong cách (x, y, w, h là vùng ảnh)
    function framed(img, x, y, w, h, p, dir) {
      var f = st.frame;
      if (f === 'arch') {
        shadowed(function () { archPath(x, y, w, h); ctx.fillStyle = '#fff'; ctx.fill(); }, 40, 16, 0.18);
        ctx.save(); archPath(x, y, w, h); ctx.clip(); fillImg(img, x, y, w, h, p, dir); ctx.restore();
        ctx.strokeStyle = rgba(theme.accent, 0.8); ctx.lineWidth = 2;
        archPath(x - 14, y - 14, w + 28, h + 28); ctx.stroke();
      } else if (f === 'heart') {
        var s = Math.min(w, h) * 1.3; // hình tim vẽ ra thấp hơn bề rộng: phóng thêm cho cân khung
        shadowed(function () { heartPath(x + w / 2, y + h / 2, s + 24); ctx.fillStyle = '#fff'; ctx.fill(); }, 50, 18, 0.2);
        ctx.save(); heartPath(x + w / 2, y + h / 2, s); ctx.clip(); fillImg(img, x + (w - s) / 2, y + h / 2 - s * 0.45, s, s * 0.95, p, dir); ctx.restore();
      } else if (f === 'gold') {
        fillImgClip(img, x, y, w, h, p, dir, 0);
        ctx.strokeStyle = theme.accent; ctx.lineWidth = 3; ctx.strokeRect(x - 12, y - 12, w + 24, h + 24);
        ctx.lineWidth = 1; ctx.strokeRect(x - 22, y - 22, w + 44, h + 44);
        ctx.fillStyle = theme.accent;
        [[x - 22, y - 22], [x + w + 22, y - 22], [x - 22, y + h + 22], [x + w + 22, y + h + 22]].forEach(function (c) {
          ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(Math.PI / 4); ctx.fillRect(-7, -7, 14, 14); ctx.restore();
        });
      } else if (f === 'thin') {
        shadowed(function () { ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, h); }, 40, 18, 0.16);
        fillImgClip(img, x, y, w, h, p, dir, 0);
        ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      } else { // border: viền giấy kem
        shadowed(function () { ctx.fillStyle = '#f6efe6'; roundRect(x - 10, y - 10, w + 20, h + 20, 18); ctx.fill(); }, 60, 20, 0.5);
        fillImgClip(img, x, y, w, h, p, dir, 10);
      }
    }
    function fillImgClip(img, x, y, w, h, p, dir, r) { ctx.save(); roundRect(x, y, w, h, r); ctx.clip(); fillImg(img, x, y, w, h, p, dir); ctx.restore(); }

    // ---------- nền ----------
    function bgFill(i, p) {
      var b = st.bg;
      if (b === 'blur') {
        ctx.fillStyle = '#0d0809'; ctx.fillRect(0, 0, W, H);
        if (blurs[i]) { var z = 1.1 + 0.06 * p; ctx.drawImage(blurs[i], (W - W * z) / 2, (H - H * z) / 2, W * z, H * z); }
        ctx.fillStyle = 'rgba(13,8,9,0.5)'; ctx.fillRect(0, 0, W, H);
        return;
      }
      ctx.fillStyle = st.base; ctx.fillRect(0, 0, W, H);
      if (b === 'paper') { if (!paperTex) paperTex = texture('paper'); ctx.drawImage(paperTex, 0, 0, W, H); }
      var g = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.2, W / 2, H / 2, W * 0.7);
      var edge = { dark: 'rgba(0,0,0,0.55)', black: 'rgba(0,0,0,0)', paper: 'rgba(120,80,40,0.18)', white: 'rgba(0,0,0,0.04)', blush: 'rgba(214,92,120,0.22)', red: 'rgba(30,0,4,0.6)', sage: 'rgba(80,110,60,0.22)' }[b] || 'rgba(0,0,0,0)';
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, edge);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      if (b === 'red') { // lưới thoi chìm
        ctx.save(); ctx.strokeStyle = 'rgba(232,182,90,0.07)'; ctx.lineWidth = 1;
        for (var k = -H; k < W; k += 64) { ctx.beginPath(); ctx.moveTo(k, 0); ctx.lineTo(k + H, H); ctx.moveTo(k + H, 0); ctx.lineTo(k, H); ctx.stroke(); }
        ctx.restore();
      }
    }

    // ---------- khung ảnh ----------
    function drawShot(s, local) {
      var p = clamp(local / s.dur), ids = s.ids, n = ids.length, dir = s.n % 4;
      if (st.frame === 'film') return drawFilm(s, local);
      if (st.frame === 'polaroid') return drawPile(s, local);
      bgFill(ids[0], p);
      if (st.frame === 'full') { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip(); fillImg(slides[ids[0]], 0, 0, W, H, p, dir, 0.14); ctx.restore(); vignette(0.45); return captionMaybe(s, local); }
      if (n === 1) {
        var im = slides[ids[0]], land = im && im.width > im.height * 1.1;
        if (land && st.frame !== 'heart') {
          if (st.bg === 'blur') { drawCover(im, 0, 0, W, H, p, dir, 0); vignette(0.35); }
          else { var lw = W * 0.74, lh = Math.min(H * 0.8, lw * im.height / im.width); lw = lh * im.width / im.height; framed(im, (W - lw) / 2, (H - lh) / 2, lw, lh, p, dir); }
        } else if (im) {
          var hh = H * (st.frame === 'heart' ? 0.82 : 0.8), ww = st.frame === 'heart' ? hh : Math.min(W * 0.6, hh * im.width / im.height);
          var mode = st.single || 'side';
          var first = s.n === 0 || s.n === shots.length - 1;
          var side = mode === 'center' || first ? 0 : mode === 'mag' ? -1 : (s.n % 2 ? -1 : 1);
          var x = mode === 'mag' && !first ? W * 0.09 : (W - ww) / 2 + side * W * 0.18, y = (H - hh) / 2;
          framed(im, x, y, ww, hh, p, dir);
          if (side) quote(s, local, mode === 'mag' ? W * 0.72 : W / 2 - side * W * 0.2);
        }
      } else {
        var big = st.frame === 'arch' || st.frame === 'gold' || st.frame === 'thin' || st.frame === 'heart';
        var g = big ? 70 : 22, pw = (W - g * (n + 1)) / n, ph = big ? H * 0.74 : H - 44;
        if (big) { pw = Math.min(pw, ph * (st.frame === 'heart' ? 1 : 0.8)); g = (W - pw * n) / (n + 1); } // khung dọc như ảnh cưới, căn đều
        for (var j = 0; j < n; j++) {
          var d = 0.18 + j * 0.16; // từng ô trượt vào lệch nhau
          var q = easeOut(clamp((local - d) / 0.6));
          if (s.n === 0 && local < d) q = 0;
          var off = (1 - q) * (j % 2 ? -1 : 1) * 160;
          ctx.save();
          ctx.globalAlpha = q;
          var px = g + j * (pw + g), py = (H - ph) / 2 + off;
          if (big) framed(slides[ids[j]], px, py, pw, ph, p, (dir + j) % 4);
          else drawCover(slides[ids[j]], px, py, pw, ph, p, (dir + j) % 4, 14);
          ctx.restore();
        }
      }
      captionMaybe(s, local);
    }
    function vignette(a) {
      var v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.72);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,' + a + ')');
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    }

    // phim cũ: dải phim chạy ngang, khung giữa là ảnh hiện tại; chuyển cảnh = phim kéo sang khung kế
    function drawFilm(s, local) {
      var k = s.n, p = clamp(local / s.dur);
      bgFill(s.ids[0], p);
      var sh = H * 0.8, sy = (H - sh) / 2, hole = 70, fh = sh - hole * 2, fw = fh * 0.78, gap = 46, step = fw + gap;
      var pos = k - 1 + (local < TR ? easeInOut(local / TR) : 1) + 0.04 * p; // trôi rất chậm trong lúc dừng
      if (k === 0) pos = 0.04 * p;
      var ox = W / 2 - fw / 2 - pos * step;
      ctx.fillStyle = '#1d1613'; ctx.fillRect(0, sy, W, sh);
      ctx.fillStyle = '#efe3cf';
      var hx0 = ((ox % 60) + 60) % 60;
      for (var hx = hx0 - 60; hx < W; hx += 60) { roundRect(hx + 12, sy + 22, 30, 26, 5); ctx.fill(); roundRect(hx + 12, sy + sh - 48, 30, 26, 5); ctx.fill(); }
      for (var j = Math.max(0, k - 3); j <= Math.min(shots.length - 1, k + 3); j++) {
        var fx = ox + j * step;
        if (fx > W || fx + fw < 0) continue;
        drawCoverPlain(slides[shots[j].ids[0]], fx, sy + hole, fw, fh, j === k ? p : 0.5, j % 4);
        // khung đang chiếu sáng rõ, các khung bên cạnh tối dần theo khoảng cách tới giữa màn
        var dist = Math.abs(fx + fw / 2 - W / 2) / step;
        if (dist > 0.05) { ctx.fillStyle = 'rgba(18,12,10,' + Math.min(0.62, dist * 0.5) + ')'; ctx.fillRect(fx, sy + hole, fw, fh); }
        ctx.fillStyle = 'rgba(239,227,207,0.55)'; ctx.font = font('caps', 20); ctx.textAlign = 'left';
        ctx.fillText(String(j + 1).padStart(2, '0') + 'A', fx, sy + sh - 14);
      }
      if (local < TR && s.fx === 'burn') { // cháy phim lúc chuyển
        var b = Math.sin(Math.PI * local / TR);
        var g = ctx.createRadialGradient(W * 0.7, H * 0.3, 0, W * 0.7, H * 0.3, W * 0.8);
        g.addColorStop(0, 'rgba(255,220,150,' + 0.9 * b + ')'); g.addColorStop(0.5, 'rgba(255,120,40,' + 0.5 * b + ')'); g.addColorStop(1, 'rgba(255,80,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      captionMaybe(s, local);
    }
    function drawCoverPlain(img, x, y, w, h, p, dir) { ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); fillImg(img, x, y, w, h, p, dir, 0.05); ctx.restore(); }

    // polaroid: ảnh mới rơi xuống chồng lên các ảnh trước, mỗi tấm nghiêng một chút, có băng dính và chữ viết tay
    var NOTES = ['Ngày đầu tiên', 'Mình cưới nhau nhé!', 'Hạnh phúc', 'Bên nhau', 'Thương lắm', 'Mãi yêu', 'Kỷ niệm', 'Về chung nhà'];
    function pose(j) { var r = rng(j * 7919 + 13); r(); return { rot: (r() - 0.5) * 0.24, x: W / 2 + (r() - 0.5) * 700, y: H / 2 + (r() - 0.5) * 40 }; }
    function polaroid(j, a, drop) {
      var im = slides[shots[j].ids[0]], land = im && im.width > im.height * 1.1;
      var pw = land ? 800 : 580, ph = land ? 590 : 720, m = 30, cw = pw + m * 2, ch = ph + m + 120;
      var ps = pose(j), d = drop || 0;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(ps.x, ps.y - d * 260);
      ctx.rotate(ps.rot + d * 0.25);
      ctx.scale(1 + d * 0.25, 1 + d * 0.25);
      shadowed(function () { ctx.fillStyle = '#fbf8f2'; ctx.fillRect(-cw / 2, -ch / 2, cw, ch); }, 40 + d * 40, 18 + d * 30, 0.3);
      drawCoverPlain(im, -cw / 2 + m, -ch / 2 + m, pw, ph, 0.3, j % 4);
      ctx.fillStyle = 'rgba(214,196,160,0.75)'; // băng dính
      ctx.save(); ctx.translate(0, -ch / 2); ctx.rotate((j % 2 ? 1 : -1) * 0.06); ctx.fillRect(-80, -20, 160, 40); ctx.restore();
      ctx.fillStyle = theme.main; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = font('script', 54);
      ctx.fillText(j === 0 && vals.chu_re ? [vals.chu_re, vals.co_dau].filter(Boolean).join(' & ') : NOTES[j % NOTES.length], 0, ch / 2 - 56);
      ctx.restore();
    }
    function drawPile(s, local) {
      var k = s.n;
      bgFill(s.ids[0], 0);
      for (var j = Math.max(0, k - 3); j < k; j++) polaroid(j, 1, 0);
      var q = local < TR ? easeOut(local / TR) : 1;
      polaroid(k, clamp(q * 1.6), 1 - q);
    }

    // ---------- chữ trong khung ảnh ----------
    var QUOTES = ['Ngày chung đôi', 'Thương nhau trọn đời', 'Về chung một nhà', 'Mãi bên nhau', 'Nắm tay nhau', 'Hạnh phúc giản đơn'];
    function quote(s, local, cx) {
      var a = clamp((local - 0.5) / 0.7) * clamp((s.dur - local) / 0.5);
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (st.dark) { ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 18; }
      ctx.fillStyle = theme.main;
      var mag = st.single === 'mag';
      ctx.font = mag ? font('serif', 84) : font('script', 96);
      ctx.fillText(QUOTES[s.n % QUOTES.length], cx, H / 2 - 30 + (1 - a) * 20);
      ctx.strokeStyle = rgba(theme.accent, 0.8); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - 90, H / 2 + 50); ctx.lineTo(cx + 90, H / 2 + 50); ctx.stroke();
      var d = (vals.ngay || '').replace(/^[^,]*,\s*/, '');
      if (d) {
        ctx.font = font('caps', 26);
        if ('letterSpacing' in ctx) ctx.letterSpacing = '8px';
        ctx.fillStyle = theme.accent;
        ctx.fillText(d.toUpperCase(), cx, H / 2 + 100);
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      }
      ctx.restore();
    }
    // tên đôi + ngày ở góc dưới, ở khung ảnh đầu và cuối (chỉ các mẫu ảnh tràn/nền tối)
    function captionMaybe(s, local) {
      if (!st.caption || !(s.n === 0 || s.n === shots.length - 1)) return;
      var a = clamp((local - 0.8) / 0.6) * clamp((s.dur - local) / 0.5);
      if (a <= 0) return;
      var names = [vals.chu_re, vals.co_dau].filter(Boolean).join(' & ');
      var bottom = st.decor === 'letterbox' ? H * 0.12 : 0;
      ctx.save();
      ctx.globalAlpha = a;
      var gr = ctx.createLinearGradient(0, H - 300 - bottom, 0, H - bottom);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = gr; ctx.fillRect(0, H - 300 - bottom, W, 300);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = theme.main;
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 16;
      if (names) { ctx.font = font('script', 84); ctx.fillText(names, 120, H - 130 - bottom); }
      ctx.font = font('caps', 30);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '9px';
      ctx.fillStyle = theme.accent;
      ctx.fillText([vals.le, vals.ngay].filter(Boolean).join('  ·  ').toUpperCase(), 124, H - 76 - bottom);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      ctx.restore();
    }

    // ---------- hoạ tiết phủ trên cùng ----------
    function hy(x, y, s, a) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = theme.accent; ctx.font = '700 ' + s + 'px "Noto Serif TC","Songti SC","SimSun",serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('囍', x, y); ctx.restore(); }
    function leaf(x, y, len, ang, col) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, -len * 0.28, len, 0); ctx.quadraticCurveTo(len * 0.5, len * 0.28, 0, 0); ctx.fill();
      ctx.restore();
    }
    function sprig(ox, oy, sx, sy, t) {
      ctx.save(); ctx.translate(ox, oy); ctx.scale(sx, sy); ctx.rotate(0.03 * Math.sin(TAU * t / D * 3));
      ctx.strokeStyle = theme.accent; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(120, 60, 300, 40); ctx.stroke();
      for (var i = 1; i <= 7; i++) {
        var u = i / 8, bx = 300 * u, by = 60 * 2 * u * (1 - u) + 40 * u * u;
        leaf(bx, by, 70 - i * 4, -0.9 + (i % 2) * 1.8, i % 3 ? rgba(theme.accent, 0.85) : rgba(theme.particle, 0.9));
      }
      ctx.restore();
    }
    function decorate(t, onTitle) {
      var dc = st.decor;
      if (dc === 'dust' || dc === 'hy') particles(t);
      else if (dc === 'petals') particles(t);
      else if (dc === 'hearts') {
        var p = t / D;
        ctx.save(); ctx.fillStyle = theme.particle;
        for (var i = 0; i < dust.length; i += 2) {
          var q = dust[i], y = H - frac(q.y + q.c * p) * (H + 80) + 40, x = q.x * W + 30 * Math.sin(TAU * p * 2 + q.ph), s = 14 + q.s * 22;
          ctx.globalAlpha = 0.35 + 0.4 * q.s; heartPath(x, y, s); ctx.fill();
        }
        ctx.restore();
      } else if (dc === 'leaves') {
        sprig(-20, -10, 1.7, 1.7, t); sprig(W + 20, H + 10, -1.7, -1.7, t); sprig(W + 10, -20, -1.2, 1.2, t);
      }
      if (dc === 'hy') { hy(130, 130, 70, 0.5); hy(W - 130, 130, 70, 0.5); hy(130, H - 130, 70, 0.5); hy(W - 130, H - 130, 70, 0.5); }
      if (dc === 'lines') {
        ctx.save(); ctx.fillStyle = theme.main; ctx.strokeStyle = rgba(theme.main, 0.5); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(80, 70); ctx.lineTo(W - 80, 70); ctx.moveTo(80, H - 70); ctx.lineTo(W - 80, H - 70); ctx.stroke();
        ctx.font = font('caps', 20); if ('letterSpacing' in ctx) ctx.letterSpacing = '6px';
        ctx.textAlign = 'left'; ctx.fillText('THE WEDDING ISSUE', 80, 52);
        ctx.textAlign = 'right'; ctx.fillText((vals.ngay || '').replace(/^[^,]*,\s*/, '').toUpperCase(), W - 80, 52);
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
        ctx.restore();
      }
      if (dc === 'film') {
        if (!grainTex) grainTex = texture('grain');
        var f = Math.floor(t * 24), r = rng(f + 1);
        ctx.save(); ctx.globalAlpha = 0.9; ctx.drawImage(grainTex, -r() * 300, -r() * 200, W + 300, H + 200); ctx.restore();
        var leak = 0.5 + 0.5 * Math.sin(TAU * t / D * 4);
        var g = ctx.createRadialGradient(0, H * 0.2, 0, 0, H * 0.2, W * 0.5);
        g.addColorStop(0, 'rgba(255,150,60,' + 0.28 * leak + ')'); g.addColorStop(1, 'rgba(255,150,60,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(0,0,0,' + (0.03 + 0.05 * r()) + ')'; ctx.fillRect(0, 0, W, H); // nhấp nháy nhẹ
      }
      if (dc === 'letterbox') { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H * 0.12); ctx.fillRect(0, H * 0.88, W, H * 0.12); }
    }

    // ---------- thẻ chữ mở đầu / kết thúc ----------
    function titleCard(idx, local, dur, imgIdx) {
      bgFill(imgIdx, local / dur);
      var tl = st.title;
      if (st.bg === 'blur') { ctx.fillStyle = 'rgba(13,8,9,0.35)'; ctx.fillRect(0, 0, W, H); }
      if (tl === 'line' || tl === 'hy') { ctx.strokeStyle = rgba(theme.accent, 0.45); ctx.lineWidth = 2; ctx.strokeRect(70, 70, W - 140, H - 140); }
      if (tl === 'hy') { ctx.lineWidth = 1; ctx.strokeRect(86, 86, W - 172, H - 172); hy(W / 2, H * 0.15, 90, 0.85); }
      if (tl === 'paper' && slides[imgIdx]) { ctx.save(); ctx.globalAlpha = 0.9; polaroidStill(imgIdx); ctx.restore(); }
      textScene(Math.min(idx, scenes.length - 1), local, dur);
    }
    function polaroidStill(i) { // ảnh polaroid nằm nghiêng ở góc thẻ chữ
      var im = slides[i];
      ctx.save(); ctx.translate(W * 0.84, H * 0.72); ctx.rotate(0.14);
      shadowed(function () { ctx.fillStyle = '#fbf8f2'; ctx.fillRect(-170, -210, 340, 420); }, 30, 12, 0.25);
      drawCoverPlain(im, -150, -190, 300, 320, 0.3, 0);
      ctx.restore();
    }

    function renderAlbum(t) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      var sec = video.seconds || 7, last = slides.length - 1, onTitle = true;
      if (!shots.length) { var i0 = Math.floor(t / sec); titleCard(i0, t - i0 * sec, sec, 0); } // chưa có ảnh: chỉ các thẻ chữ
      else if (t < introSec) titleCard(0, t, sec, 0);
      else if (t >= introSec + shotTotal) {
        var o = t - introSec - shotTotal, si = 1 + Math.floor(o / sec);
        titleCard(si, o - (si - 1) * sec, sec, Math.max(0, last));
      } else {
        onTitle = false;
        var k = 0;
        while (k < shots.length - 1 && t >= shots[k].t0 + shots[k].dur) k++;
        var s = shots[k], local = t - s.t0;
        var own = st.frame === 'film' || st.frame === 'polaroid'; // hai mẫu này tự chuyển cảnh bên trong khung
        if (local < TR && !own) {
          var p = easeInOut(local / TR);
          var prev = function () { if (k > 0) drawShot(shots[k - 1], shots[k - 1].dur + local); else titleCard(0, sec, sec, 0); };
          if (s.fx === 'black') {
            if (p < 0.5) { prev(); ctx.fillStyle = 'rgba(0,0,0,' + p * 2 + ')'; ctx.fillRect(0, 0, W, H); }
            else { drawShot(s, local); ctx.fillStyle = 'rgba(0,0,0,' + (1 - p) * 2 + ')'; ctx.fillRect(0, 0, W, H); }
          } else if (s.fx === 'cut') {
            if (p < 0.15) prev(); else drawShot(s, local);
          } else {
            prev();
            ctx.save();
            if (s.fx === 'fade') ctx.globalAlpha = p;
            else if (s.fx === 'zoom') { ctx.globalAlpha = p; var z = 1.18 - 0.18 * p; ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); }
            else if (s.fx === 'slide') ctx.translate((1 - p) * W, 0);
            else if (s.fx === 'slideUp') ctx.translate(0, (1 - p) * H);
            else if (s.fx === 'wipe') { ctx.beginPath(); ctx.rect(0, 0, W * p, H); ctx.clip(); }
            else if (s.fx === 'iris') { heartPath(W / 2, H / 2 + 60, W * 2.4 * p * p + 1); ctx.clip(); }
            else ctx.globalAlpha = p;
            drawShot(s, local);
            ctx.restore();
            if (s.fx === 'flash') { ctx.fillStyle = 'rgba(255,248,236,' + (0.85 * Math.sin(Math.PI * p)) + ')'; ctx.fillRect(0, 0, W, H); }
          }
        } else drawShot(s, local);
      }
      decorate(t, onTitle);
      // mở đầu và kết thúc mờ từ / về đen: điểm nối vòng lặp liền mạch
      var edge = Math.min(clamp(t / 0.8), clamp((D - t) / 0.8));
      if (edge < 1) { ctx.fillStyle = 'rgba(0,0,0,' + (1 - edge) + ')'; ctx.fillRect(0, 0, W, H); }
    }

    // thời điểm bắt đầu cảnh chữ thứ i (để trình sửa nhảy tới đúng cảnh)
    function sceneTime(i) {
      var sec = video.seconds || 7;
      if (!st) return i * sec;
      return i === 0 ? 0 : introSec + shotTotal + (i - 1) * sec;
    }

    function renderAt(t) {
      if (!video) return;
      t = ((t % D) + D) % D;
      ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
      ctx.globalAlpha = 1;
      if (st) renderAlbum(t);
      else { bg(t); decor(t); particles(t); text(t); }
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
    // phát / tạm dừng / tua: pausedAt khác null nghĩa là đang dừng ở thời điểm đó
    var pausedAt = null;
    function play() { cancelAnimationFrame(raf); pausedAt = null; t0 = performance.now(); raf = requestAnimationFrame(loop); }
    function now() { if (pausedAt !== null) return pausedAt; var t = (performance.now() - t0) / 1000; return ((t % D) + D) % D; }
    function seek(t) {
      t = Math.max(0, Math.min(D - 0.001, t));
      t0 = performance.now() - t * 1000;
      if (pausedAt !== null) { pausedAt = t; renderAt(t); }
    }
    function stop() { cancelAnimationFrame(raf); }
    function pause() { if (pausedAt !== null) return; pausedAt = now(); stop(); renderAt(pausedAt); }
    function resume() { if (pausedAt === null) return; var t = pausedAt; pausedAt = null; t0 = performance.now() - t * 1000; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }

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


    // ---------- xuất MP4 ngay trong trình duyệt (không cần máy chủ / ffmpeg) ----------
    // 1. mã hoá MỘT vòng video H.264 bằng WebCodecs (dạng "avc" để đóng gói MP4)
    // 2. nhạc nền: giải mã MP3, lặp/cắt đúng độ dài, mờ dần cuối bài, mã hoá AAC
    // 3. đóng gói bằng mp4-muxer; video dài hơn 1 vòng thì lặp lại các khung đã mã hoá (không mã hoá lại)
    function encodeLoop(onProgress) {
      var fps = 30, total = Math.round(D * fps), chunks = [], meta = null, failed = null;
      var enc = new VideoEncoder({
        output: function (chunk, m) {
          if (!meta && m && m.decoderConfig) meta = m;
          var b = new Uint8Array(chunk.byteLength); chunk.copyTo(b);
          chunks.push({ data: b, type: chunk.type, ts: chunk.timestamp, dur: chunk.duration || Math.round(1e6 / fps) });
        },
        error: function (e) { failed = e; },
      });
      // 4 Mbps: đủ nét cho video trình chiếu ảnh 1080p trên TV, file 3 phút ~90MB thay vì ~130MB
      var base = { width: W, height: H, bitrate: 4e6, bitrateMode: 'variable', framerate: fps, avc: { format: 'avc' } };
      function pick(i) {
        if (i >= AVC.length) return Promise.reject(new Error('Trình duyệt chưa hỗ trợ mã hoá H.264 — dùng Chrome hoặc Edge bản mới nhé'));
        var c = Object.assign({ codec: AVC[i] }, base);
        return VideoEncoder.isConfigSupported(c).then(function (r) { return r.supported ? c : pick(i + 1); });
      }
      function breathe() { return new Promise(function (res) { var ch = new MessageChannel(); ch.port1.onmessage = function () { res(); }; ch.port2.postMessage(0); }); }
      return pick(0).then(function (c) {
        enc.configure(c);
        var i = 0;
        function next() {
          if (failed) return Promise.reject(failed);
          if (i >= total) return enc.flush();
          if (enc.encodeQueueSize > 6) return breathe().then(next);
          renderAt(i / fps);
          var f = new VideoFrame(canvas, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
          enc.encode(f, { keyFrame: i % (fps * 2) === 0 }); // khung khoá 2 giây/lần, khung đầu luôn là khung khoá → lặp vòng được
          f.close();
          i++;
          if (onProgress && i % 10 === 0) onProgress(i / total);
          return (i % 15 === 0 ? breathe() : Promise.resolve()).then(next);
        }
        return next();
      }).then(function () {
        enc.close();
        if (failed) throw failed;
        return { chunks: chunks, meta: meta, loopUs: Math.round(total * 1e6 / fps) };
      });
    }

    var SR = 48000;
    // nhạc nền → AudioBuffer stereo 48kHz đúng `seconds` giây (lặp bài nếu ngắn, mờ dần 2 giây cuối)
    function renderMusic(url, seconds) {
      if (!url || !window.OfflineAudioContext) return Promise.resolve(null);
      return fetch(url, { mode: 'cors' }).then(function (r) { if (!r.ok) throw new Error('Không tải được nhạc'); return r.arrayBuffer(); })
        .then(function (buf) { return new OfflineAudioContext(2, SR, SR).decodeAudioData(buf); })
        .then(function (song) {
          var len = Math.ceil(seconds * SR), off = new OfflineAudioContext(2, len, SR);
          var src = off.createBufferSource(), g = off.createGain();
          src.buffer = song; src.loop = true;
          g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(1, Math.min(0.6, seconds / 4));
          g.gain.setValueAtTime(1, Math.max(0, seconds - 2)); g.gain.linearRampToValueAtTime(0, seconds);
          src.connect(g); g.connect(off.destination); src.start(0);
          return off.startRendering();
        });
    }
    function aacConfig() {
      if (!window.AudioEncoder) return Promise.resolve(null);
      var c = { codec: 'mp4a.40.2', sampleRate: SR, numberOfChannels: 2, bitrate: 160000 };
      return AudioEncoder.isConfigSupported(c).then(function (r) { return r.supported ? c : null; }, function () { return null; });
    }
    function encodeAudio(buffer, config, muxer) {
      var failed = null;
      var enc = new AudioEncoder({ output: function (chunk, meta) { muxer.addAudioChunk(chunk, meta); }, error: function (e) { failed = e; } });
      enc.configure(config);
      var L = buffer.getChannelData(0), R = buffer.getChannelData(1), N = 4096;
      for (var i = 0; i < buffer.length; i += N) {
        var n = Math.min(N, buffer.length - i), planar = new Float32Array(n * 2);
        planar.set(L.subarray(i, i + n), 0); planar.set(R.subarray(i, i + n), n);
        var ad = new AudioData({ format: 'f32-planar', sampleRate: SR, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(i * 1e6 / SR), data: planar });
        enc.encode(ad); ad.close();
      }
      return enc.flush().then(function () { enc.close(); if (failed) throw failed; });
    }

    // opts: { loops, music (đường dẫn MP3), onProgress(0..1, chữ) } → Promise<{ blob, music: true|false }>
    function exportMp4(opts) {
      opts = opts || {};
      var loops = Math.max(1, Math.min(30, opts.loops | 0 || 1)), prog = opts.onProgress || function () {};
      if (!window.VideoEncoder || !window.VideoFrame) return Promise.reject(new Error('Trình duyệt chưa hỗ trợ xuất video — dùng Chrome hoặc Edge bản mới nhé'));
      if (!window.Mp4Muxer) return Promise.reject(new Error('Thiếu thư viện đóng gói MP4'));
      var loop, audioCfg = null, music = null;
      return ready().then(function () {
        stop();
        return encodeLoop(function (p) { prog(p * 0.8, 'Đang dựng hình'); });
      }).then(function (r) {
        loop = r;
        prog(0.82, 'Đang chuẩn bị nhạc nền');
        return aacConfig();
      }).then(function (cfg) {
        audioCfg = cfg;
        if (!cfg || !opts.music) return null;
        return renderMusic(opts.music, loops * loop.loopUs / 1e6).catch(function (e) { console.warn('Bỏ qua nhạc nền:', e); return null; });
      }).then(function (buf) {
        music = buf;
        prog(0.9, 'Đang đóng gói MP4');
        var muxer = new Mp4Muxer.Muxer({
          target: new Mp4Muxer.ArrayBufferTarget(),
          video: { codec: 'avc', width: W, height: H, frameRate: 30 },
          audio: music ? { codec: 'aac', numberOfChannels: 2, sampleRate: SR } : undefined,
          fastStart: 'in-memory',
          firstTimestampBehavior: 'offset',
        });
        for (var k = 0; k < loops; k++) {
          loop.chunks.forEach(function (c, j) {
            muxer.addVideoChunkRaw(c.data, c.type, c.ts + k * loop.loopUs, c.dur, k === 0 && j === 0 ? loop.meta : undefined);
          });
        }
        return (music ? encodeAudio(music, audioCfg, muxer) : Promise.resolve()).then(function () {
          muxer.finalize();
          prog(1, 'Xong');
          return { blob: new Blob([muxer.target.buffer], { type: 'video/mp4' }), music: !!music };
        });
      });
    }

    function ready() {
      if (fontsReady || !document.fonts) return photosReady;
      return Promise.all(['700 80px "Dancing Script"', '500 80px "Playfair Display"', 'italic 500 80px "Playfair Display"', '700 80px "Charm"', '500 80px "Fraunces"', 'italic 400 80px "Fraunces"', '300 80px "Hanken Grotesk"', '500 80px "Hanken Grotesk"']
        .map(function (f) { return document.fonts.load(f, 'Đẹp'); })).then(function () { fontsReady = true; }, function () { fontsReady = true; }).then(function () { return photosReady; });
    }
    ready();

    return {
      set: set, setPhoto: setPhoto, setPhotos: setPhotos, sceneTime: sceneTime, renderAt: renderAt, play: play, stop: stop, seek: seek, record: record, exportMp4: exportMp4, ready: ready,
      duration: function () { return D; },
      time: now, pause: pause, resume: resume, paused: function () { return pausedAt !== null; },
    };
  }

  window.VideoEngine = { create: create, THEMES: THEMES };
})();
