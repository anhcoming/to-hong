/* Video dọc 9:16 (1080×1920, ~20 giây, có nhạc) để đăng TikTok / Reels / Story: phong bì mở ra → ảnh cưới phóng to + tên đôi,
   ngày cưới → chiếu 3–5 ảnh cưới → "Mời bạn đến chung vui cùng chúng mình" + ảnh rơi xuống → khung kết có ngày, nơi tổ chức.
   Góc dưới luôn có "cuoinha.com".
   Dựng ngay trên máy khách bằng canvas + WebCodecs (H.264 + AAC) + mp4-muxer, giống xuất MP4 của video cưới — không qua máy chủ.
   Dùng: storyModal(cardId) — hộp dựng video, xem lại, tải về / chia sẻ. */
(function () {
  var W = 1080, H = 1920, FPS = 30, SR = 48000; // thời lượng (A.T.D) tuỳ số ảnh, khoảng 20–23 giây
  var ROSE = '#c93a55', INK = '#3a2a2d', CREAM = '#fbf3ef', MUTED = '#8a6f74';
  var SCRIPT = '"Dancing Script", cursive', SERIF = '"Playfair Display", Georgia, serif', SANS = '"Be Vietnam Pro", system-ui, sans-serif';

  function loadScript(src) {
    return new Promise(function (ok, fail) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { fail(new Error('Không tải được ' + src)); }; document.head.appendChild(s); });
  }
  function loadFonts() {
    if (!document.querySelector('link[data-story-fonts]')) {
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.dataset.storyFonts = '1';
      l.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Playfair+Display:ital,wght@0,500;1,500&family=Be+Vietnam+Pro:wght@500;600&display=swap';
      document.head.appendChild(l);
    }
    if (!document.fonts) return Promise.resolve();
    var want = ['700 120px "Dancing Script"', '500 60px "Playfair Display"', 'italic 500 60px "Playfair Display"', '600 40px "Be Vietnam Pro"'];
    var t = new Promise(function (ok) { setTimeout(ok, 4000); });
    return Promise.race([Promise.all(want.map(function (f) { return document.fonts.load(f, 'Đẹp Ngọc'); })), t]).catch(function () {});
  }
  // ảnh thu nhỏ sẵn (cạnh dài ≤ maxSide) thành ImageBitmap: mỗi khung vẽ lại ảnh nhỏ → dựng / xem trước nhanh hơn nhiều
  function loadImg(url, maxSide) {
    return new Promise(function (ok) {
      if (!url) return ok(null);
      var im = new Image(); im.crossOrigin = 'anonymous'; im.decoding = 'async';
      im.onload = function () {
        var k = Math.min(1, (maxSide || 1400) / Math.max(im.width, im.height));
        if (k >= 1 || !window.createImageBitmap) return ok(im);
        createImageBitmap(im, { resizeWidth: Math.round(im.width * k), resizeHeight: Math.round(im.height * k), resizeQuality: 'high' }).then(ok, function () { ok(im); });
      };
      im.onerror = function () { ok(null); };
      im.src = String(url).split('#')[0];
    });
  }

  // ---------- tông màu: một màu chính → đủ bộ màu cho mọi kiểu (đậm / nhạt / nền / chữ) ----------
  function hexHsl(hex) {
    var n = parseInt(String(hex).replace('#', '').slice(0, 6), 16), r = (n >> 16 & 255) / 255, gg = (n >> 8 & 255) / 255, b = (n & 255) / 255;
    var mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), l = (mx + mn) / 2, h = 0, sat = 0;
    if (mx !== mn) { var d = mx - mn; sat = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = (mx === r ? (gg - b) / d + (gg < b ? 6 : 0) : mx === gg ? (b - r) / d + 2 : (r - gg) / d + 4) * 60; }
    return [h, sat, l];
  }
  var hsl = function (h, s, l, a) { return 'hsla(' + Math.round(h) + ',' + Math.round(s * 100) + '%,' + Math.round(Math.min(1, l) * 100) + '%,' + (a == null ? 1 : a) + ')'; };
  function tone(hex) {
    var x = hexHsl(hex), h = x[0], s = Math.max(0.28, x[1]), l = Math.max(0.3, Math.min(0.5, x[2]));
    return {
      main: hsl(h, s, l), flap: hsl(h, s, l * 1.08), deep: hsl(h, s, l * 0.8), dark2: hsl(h, s, l * 0.66), dark3: hsl(h, s, l * 0.55),
      cream: hsl(h, Math.min(s, 0.5), 0.965), softA: hsl(h, Math.min(s, 0.5), 0.86, 0.6), petal: hsl(h, Math.min(s, 0.6), 0.76), pink: hsl(h, Math.min(s, 0.8), 0.86),
      ink: hsl(h, 0.22, 0.19), muted: hsl(h, 0.12, 0.5), shadeA: hsl(h, 0.45, 0.1, 0.58), hyA: hsl(h, Math.max(0.45, Math.min(0.75, s)), 0.38), hyB: hsl(h, Math.max(0.45, Math.min(0.75, s)), 0.15),
    };
  }
  var TONES = [['thiep', 'Theo thiệp', ''], ['hong', 'Hồng', '#c93a55'], ['do', 'Đỏ', '#b01a2e'], ['xanhla', 'Xanh lá', '#3f6b3a'], ['xanhngoc', 'Xanh ngọc', '#1f6f6b'],
    ['xanhduong', 'Xanh dương', '#2f4f8f'], ['tim', 'Tím', '#6f4a9e'], ['nau', 'Nâu', '#8a5a3c']];
  // màu của thiệp: màu chữ / nhấn trong bảng màu đang chọn (bảng màu quá nhạt / xám thì dùng hồng)
  function cardColor(card) {
    var tp = ((window.META || {}).templates || []).find(function (t) { return t.id === card.template; }), pal = tp && (tp.palettes.find(function (p) { return p.id === card.palette; }) || tp.palettes[0]);
    var c = pal && pal.swatch && pal.swatch[1];
    if (!c || !/^#[0-9a-f]{6}/i.test(c)) return '#c93a55';
    var x = hexHsl(c); return x[1] < 0.15 || x[2] > 0.75 ? '#c93a55' : c;
  }
  function toneHex(card, toneId, styleId) {
    if (toneId && toneId !== 'thiep') { var t = TONES.find(function (x) { return x[0] === toneId; }); if (t) return t[2]; }
    return styleId === 'songhy' ? '#b01a2e' : cardColor(card); // Song hỷ "theo thiệp" vẫn giữ đỏ truyền thống
  }

  // ---------- vẽ ----------
  var clamp = function (x, a, b) { return Math.max(a, Math.min(b, x)); };
  var prog = function (t, a, b) { return clamp((t - a) / (b - a), 0, 1); };
  var ease = function (x) { return 1 - Math.pow(1 - x, 3); };
  var easeIO = function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  function cover(g, im, x, y, w, h, zoom, fx, fy) {
    if (!im) { g.fillStyle = '#e9cfd3'; g.fillRect(x, y, w, h); return; }
    var s = Math.max(w / im.width, h / im.height) * (zoom || 1), iw = im.width * s, ih = im.height * s;
    // luôn cắt trong khung: ảnh ngang đặt vào khung dọc không được lòi ra ngoài (mép ảnh hiện hai bên phong bì)
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.drawImage(im, x + (w - iw) * (fx == null ? 0.5 : fx), y + (h - ih) * (fy == null ? 0.35 : fy), iw, ih);
    g.restore();
  }
  function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function text(g, s, x, y, font, color, alpha, opts) {
    opts = opts || {};
    g.save(); g.globalAlpha *= alpha == null ? 1 : alpha; g.font = font; g.fillStyle = color; g.textAlign = opts.align || 'center'; g.textBaseline = 'middle';
    if (opts.shadow) { g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 24; g.shadowOffsetY = 4; }
    if (opts.spacing && 'letterSpacing' in g) g.letterSpacing = opts.spacing + 'px';
    var maxW = opts.max || W - 120, size = parseFloat(/(\d+)px/.exec(font)[1]);
    while (g.measureText(s).width > maxW && size > 20) { size -= 4; g.font = font.replace(/\d+px/, size + 'px'); }
    g.fillText(s, x, y); g.restore();
  }
  function wrap(g, s, font, maxW) {
    g.save(); g.font = font; var words = String(s).split(/\s+/), lines = [], cur = '';
    words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur); g.restore(); return lines.slice(0, 3);
  }
  // cánh hoa bay nhẹ (vị trí cố định theo thời gian → khung nào dựng lại cũng giống nhau)
  function petals(g, t, alpha, color) {
    g.save(); g.globalAlpha = alpha; g.fillStyle = color;
    for (var i = 0; i < 18; i++) {
      var sp = 60 + (i * 37) % 70, x = (i * 173) % W + Math.sin(t * 0.9 + i) * 40, y = ((i * 311) % H + t * sp) % (H + 80) - 40, r = 10 + (i % 4) * 4;
      g.save(); g.translate(x, y); g.rotate(t * 0.8 + i); g.beginPath(); g.ellipse(0, 0, r, r * 0.55, 0, 0, Math.PI * 2); g.fill(); g.restore();
    }
    g.restore();
  }
  function watermark(g, a) {
    g.save(); g.globalAlpha = a; g.font = '600 36px ' + SANS;
    var s = 'cuoinha.com', w = g.measureText(s).width + 44;
    rrect(g, W - w - 40, H - 132, w, 64, 32); g.fillStyle = 'rgba(30,18,20,.42)'; g.fill();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, W - 40 - w / 2, H - 100); g.restore();
  }

  // ---- 1. Phong bì (kiểu đầu tiên) ----
  function envFrame(g, t, A, T) {
    var cardR = { x: 200, y: 520, w: 680, h: 900 }; // khung ảnh trong phong bì
    // nền kem + cánh hoa
    g.fillStyle = A.P.cream; g.fillRect(0, 0, W, H);
    var bg = g.createRadialGradient(W / 2, H * 0.45, 100, W / 2, H * 0.45, H * 0.8); bg.addColorStop(0, 'rgba(255,255,255,.9)'); bg.addColorStop(1, A.P.softA);
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    petals(g, t, 0.5, A.P.petal);

    // ---- 1. phong bì mở, thiệp trồi lên (0 → 2.6s) ----
    if (t < 3.4) {
      text(g, 'Thiệp mời cưới', W / 2, 330, '700 104px ' + SCRIPT, A.P.main, ease(prog(t, 0.15, 0.8)));
      text(g, A.names, W / 2, 440, '500 50px ' + SERIF, A.P.ink, ease(prog(t, 0.45, 1.1)));
      var ex = 150, ey = 1060, ew = 780, eh = 560, rise = easeIO(prog(t, 1.35, 2.6)), grow = easeIO(prog(t, 2.5, 3.3));
      // thiệp trong phong bì: trồi lên, rồi phóng ra toàn màn hình
      var r0 = { x: cardR.x, y: ey + 40 - rise * (ey + 40 - cardR.y), w: cardR.w, h: cardR.h };
      var R = { x: r0.x * (1 - grow), y: r0.y * (1 - grow), w: r0.w + (W - r0.w) * grow, h: r0.h + (H - r0.h) * grow };
      var flap = easeIO(prog(t, 0.8, 1.45)), fy = ey + (eh * 0.62) * (1 - 2 * flap), fade = 1 - prog(grow, 0, 0.6);
      var drawFlap = function () {
        g.fillStyle = flap < 0.5 ? A.P.flap : A.P.dark3; g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex + ew / 2, fy); g.lineTo(ex + ew, ey); g.closePath(); g.fill();
        if (flap < 0.5) { g.fillStyle = '#d9b26b'; g.beginPath(); g.arc(ex + ew / 2, fy - 10, 46, 0, Math.PI * 2); g.fill(); text(g, '♥', ex + ew / 2, fy - 8, '600 50px ' + SANS, A.P.deep, 1); }
      };
      // thứ tự: lưng phong bì → nắp đã mở (nằm sau thiệp) → thiệp → túi trước → nắp còn đóng
      g.save(); g.globalAlpha = fade;
      g.fillStyle = A.P.dark2; rrect(g, ex, ey, ew, eh, 18); g.fill();
      if (flap >= 0.5) drawFlap();
      g.restore();
      g.save();
      if (grow < 1) { g.beginPath(); g.rect(0, 0, W, ey + eh + H * grow); g.clip(); } // phần thiệp còn trong phong bì không lòi ra dưới đáy
      var pad = 22 * (1 - grow);
      g.fillStyle = '#fff'; g.shadowColor = 'rgba(80,20,30,.25)'; g.shadowBlur = 30 * (1 - grow); rrect(g, R.x, R.y, R.w, R.h, 14 * (1 - grow)); g.fill(); g.shadowBlur = 0;
      cover(g, A.cover, R.x + pad, R.y + pad, R.w - pad * 2, R.h - pad * 2, 1);
      g.restore();
      if (fade > 0) {
        g.save(); g.globalAlpha = fade;
        // túi trước hình chữ V từ hai góc trên xuống giữa: che phần thiệp còn trong phong bì
        g.fillStyle = A.P.deep; g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex + ew / 2, ey + eh * 0.58); g.lineTo(ex + ew, ey); g.lineTo(ex + ew, ey + eh); g.lineTo(ex, ey + eh); g.closePath(); g.fill();
        if (flap < 0.5) drawFlap();
        g.restore();
      }
    }

    // ---- 2. ảnh cưới toàn màn hình + tên đôi + ngày (3.3 → 6.8s) ----
    if (t >= 3.3 && t < 7.4) {
      var a2 = 1 - prog(t, 6.8, 7.4);
      g.save(); g.globalAlpha = a2;
      cover(g, A.cover, 0, 0, W, H, 1 + 0.12 * prog(t, 3.3, 7.4));
      var gr = g.createLinearGradient(0, H * 0.45, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.72)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      var n1 = ease(prog(t, 3.5, 4.2)), n2 = ease(prog(t, 3.8, 4.5)), n3 = ease(prog(t, 4.1, 4.8)), dt = ease(prog(t, 4.6, 5.3));
      text(g, A.groom, W / 2, 1380 + 40 * (1 - n1), '700 150px ' + SCRIPT, '#fff', n1, { shadow: true });
      text(g, '&', W / 2, 1490 + 40 * (1 - n2), '700 90px ' + SCRIPT, A.P.pink, n2, { shadow: true });
      text(g, A.bride, W / 2, 1600 + 40 * (1 - n3), '700 150px ' + SCRIPT, '#fff', n3, { shadow: true });
      if (A.date) text(g, A.date, W / 2, 1745, '500 56px ' + SERIF, '#fff', dt, { shadow: true, spacing: 8 });
      g.restore();
    }

    // ---- 3. chiếu ảnh cưới: mỗi ảnh ~1,6 giây, phóng / lướt nhẹ, chồng mờ sang ảnh sau ----
    A.slides.forEach(function (im, k) {
      var st = T.s0 + k * T.per, en = st + T.per + 0.5;
      if (t < st - 0.01 || t > en) return;
      var a = prog(t, st, st + 0.5) * (k === A.slides.length - 1 ? 1 - prog(t, en - 0.5, en) : 1), p = prog(t, st, en);
      var z = k % 2 ? 1.16 - 0.14 * p : 1.02 + 0.14 * p, fx = k % 3 === 0 ? 0.35 + 0.3 * p : k % 3 === 1 ? 0.65 - 0.3 * p : 0.5;
      g.save(); g.globalAlpha = a; cover(g, im, 0, 0, W, H, z, fx, 0.4);
      var gr = g.createLinearGradient(0, H * 0.7, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = gr; g.fillRect(0, H * 0.7, W, H * 0.3);
      g.restore();
    });

    // ---- 4. "Mời bạn đến chung vui cùng chúng mình": ảnh rơi xuống trên nền ảnh mờ ----
    if (t >= T.inv0 - 0.5 && t < T.end0 + 0.5) {
      var a3 = prog(t, T.inv0 - 0.5, T.inv0) * (1 - prog(t, T.end0, T.end0 + 0.5));
      g.save(); g.globalAlpha = a3;
      cover(g, A.cover, 0, 0, W, H, 1.25);
      g.fillStyle = A.P.shadeA; g.fillRect(0, 0, W, H);
      var l1 = ease(prog(t, T.inv0 + 0.1, T.inv0 + 0.8)), l2 = ease(prog(t, T.inv0 + 0.5, T.inv0 + 1.2));
      text(g, 'Mời bạn đến chung vui', W / 2, 290 + 30 * (1 - l1), '700 104px ' + SCRIPT, '#fff', l1, { shadow: true });
      text(g, 'cùng chúng mình 💕', W / 2, 410 + 30 * (1 - l2), '700 104px ' + SCRIPT, A.P.pink, l2, { shadow: true });
      var rots = [-7, 6, -3], offs = [[-150, 60], [150, 180], [0, 360]];
      A.album.forEach(function (im, i) {
        var st = T.inv0 + 0.6 + i * 0.7, p = easeIO(prog(t, st, st + 0.7));
        if (p <= 0) return;
        var w = 540, h = 680, cx = W / 2 + offs[i][0], cy = 900 + offs[i][1] - (1 - p) * 500;
        g.save(); g.globalAlpha *= p; g.translate(cx, cy); g.rotate((rots[i] + (1 - p) * 10) * Math.PI / 180);
        g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 40; g.fillStyle = '#fff'; g.fillRect(-w / 2, -h / 2, w, h + 90); g.shadowBlur = 0;
        g.beginPath(); g.rect(-w / 2 + 24, -h / 2 + 24, w - 48, h - 48); g.clip(); cover(g, im, -w / 2 + 24, -h / 2 + 24, w - 48, h - 48, 1);
        g.restore();
      });
      g.restore();
    }

    // ---- 5. khung kết: tên, ngày, nơi tổ chức ----
    if (t >= T.end0) {
      var e0 = T.end0, a4 = ease(prog(t, e0, e0 + 0.6));
      g.save(); g.globalAlpha = a4;
      g.save(); g.beginPath(); g.arc(W / 2, 600, 220, 0, Math.PI * 2); g.closePath(); g.lineWidth = 16; g.strokeStyle = '#fff'; g.shadowColor = 'rgba(120,40,50,.25)'; g.shadowBlur = 30; g.stroke(); g.clip(); cover(g, A.cover, W / 2 - 220, 380, 440, 440, 1); g.restore();
      text(g, A.groom, W / 2, 990, '700 130px ' + SCRIPT, A.P.main, 1);
      text(g, '&', W / 2, 1090, '700 76px ' + SCRIPT, A.P.petal, 1);
      text(g, A.bride, W / 2, 1190, '700 130px ' + SCRIPT, A.P.main, 1);
      var d1 = ease(prog(t, e0 + 0.5, e0 + 1.1)), d2 = ease(prog(t, e0 + 0.8, e0 + 1.4));
      if (A.date) text(g, A.date, W / 2, 1350, '500 58px ' + SERIF, A.P.ink, d1, { spacing: 8 });
      if (A.weekday) text(g, A.weekday, W / 2, 1430, '600 38px ' + SANS, A.P.muted, d1);
      if (A.place) wrap(g, A.place, '600 40px ' + SANS, W - 220).forEach(function (l, i) { text(g, (i ? '' : '📍 ') + l, W / 2, 1520 + i * 54, '600 40px ' + SANS, A.P.ink, d2); });
      text(g, 'Rất mong được đón tiếp bạn!', W / 2, 1680, 'italic 500 48px ' + SERIF, A.P.main, ease(prog(t, e0 + 1.2, e0 + 1.8)));
      text(g, 'Thiệp cưới online · cuoinha.com', W / 2, 1810, '600 34px ' + SANS, A.P.muted, ease(prog(t, e0 + 1.6, e0 + 2.2)));
      g.restore();
    }
    if (t < T.end0) watermark(g, 1 - prog(t, T.end0 - 0.3, T.end0));
  }


  // ======================= các kiểu video =======================
  // dùng chung: chiếu ảnh toàn màn hình (phóng / lướt nhẹ). dip: chuyển qua nền đen (kiểu điện ảnh), không thì chồng mờ
  function slideshow(g, t, slides, s0, per, opts) {
    opts = opts || {};
    slides.forEach(function (im, k) {
      var st = s0 + k * per, en = st + per + (opts.dip ? 0 : 0.5);
      if (t < st - 0.01 || t > en) return;
      var a = opts.dip ? prog(t, st, st + 0.45) * (1 - prog(t, en - 0.45, en)) : prog(t, st, st + 0.5) * (k === slides.length - 1 ? 1 - prog(t, en - 0.5, en) : 1);
      var p = prog(t, st, en), z = k % 2 ? 1.16 - 0.14 * p : 1.02 + 0.14 * p, fx = k % 3 === 0 ? 0.35 + 0.3 * p : k % 3 === 1 ? 0.65 - 0.3 * p : 0.5;
      g.save(); g.globalAlpha = a; cover(g, im, opts.x || 0, opts.y || 0, opts.w || W, opts.h || H, z, fx, 0.4); g.restore();
    });
  }
  // khung kết: ảnh tròn, tên đôi, ngày giờ, nơi tổ chức, lời chờ đón, cuoinha.com
  function endCard(g, t, e0, A, th) {
    var a = ease(prog(t, e0, e0 + 0.6));
    g.save(); g.globalAlpha = a;
    g.save(); g.beginPath(); g.arc(W / 2, 600, 220, 0, Math.PI * 2); g.closePath(); g.lineWidth = 16; g.strokeStyle = th.ring; g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 30; g.stroke(); g.clip(); cover(g, A.cover, W / 2 - 220, 380, 440, 440, 1); g.restore();
    var nf = th.nameFont || ('700 130px ' + SCRIPT);
    text(g, A.groom, W / 2, 990, nf, th.accent, 1);
    text(g, '&', W / 2, 1090, th.ampFont || ('700 76px ' + SCRIPT), th.amp, 1);
    text(g, A.bride, W / 2, 1190, nf, th.accent, 1);
    var d1 = ease(prog(t, e0 + 0.5, e0 + 1.1)), d2 = ease(prog(t, e0 + 0.8, e0 + 1.4));
    if (A.date) text(g, A.date, W / 2, 1350, '500 58px ' + SERIF, th.ink, d1, { spacing: 8 });
    if (A.weekday) text(g, A.weekday, W / 2, 1430, '600 38px ' + SANS, th.muted, d1);
    if (A.place) wrap(g, A.place, '600 40px ' + SANS, W - 220).forEach(function (l, i) { text(g, (i ? '' : '📍 ') + l, W / 2, 1520 + i * 54, '600 40px ' + SANS, th.ink, d2); });
    text(g, th.bye || 'Rất mong được đón tiếp bạn!', W / 2, 1680, 'italic 500 48px ' + SERIF, th.accent, ease(prog(t, e0 + 1.2, e0 + 1.8)));
    text(g, 'Thiệp cưới online · cuoinha.com', W / 2, 1810, '600 34px ' + SANS, th.muted, ease(prog(t, e0 + 1.6, e0 + 2.2)));
    g.restore();
  }
  function vignette(g, a) { var v = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,' + a + ')'); g.fillStyle = v; g.fillRect(0, 0, W, H); }
  var CAPS = ['Từ hai người xa lạ', 'chúng mình tìm thấy nhau', 'cùng đi qua bao mùa thương', 'và giờ đây', 'về chung một nhà', '💍'];
  var capOf = function (k, n) { return CAPS[n <= 1 ? 4 : Math.round(k * (CAPS.length - 1) / (n - 1))]; };

  // ---- 2. Điện ảnh: nền đen, khung phim, chữ trắng, chuyển cảnh qua màu đen ----
  function cineFrame(g, t, A, T) {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    if (t < 3.3) {
      var a = 1 - prog(t, 2.7, 3.3);
      text(g, 'SAVE THE DATE', W / 2, 800, '500 44px ' + SERIF, '#fff', a * ease(prog(t, 0.2, 0.9)), { spacing: 18 });
      text(g, A.groom + ' & ' + A.bride, W / 2, 950, 'italic 500 90px ' + SERIF, '#fff', a * ease(prog(t, 0.7, 1.5)));
      var lw = 360 * easeIO(prog(t, 1.2, 2.0));
      g.save(); g.globalAlpha = a; g.fillStyle = '#d9b26b'; g.fillRect(W / 2 - lw / 2, 1050, lw, 3); g.restore();
      if (A.date) text(g, A.date, W / 2, 1130, '500 48px ' + SERIF, '#d9b26b', a * ease(prog(t, 1.6, 2.2)), { spacing: 10 });
    }
    slideshow(g, t, A.slides, T.s0, T.per, { dip: true });
    if (t >= T.s0 && t < T.d0) {
      var k = Math.min(A.slides.length - 1, Math.floor((t - T.s0) / T.per)), st = T.s0 + k * T.per;
      text(g, capOf(k, A.slides.length), W / 2, H - 330, 'italic 500 62px ' + SERIF, '#fff', ease(prog(t, st + 0.35, st + 0.9)) * (1 - prog(t, st + T.per - 0.4, st + T.per)), { shadow: true });
    }
    // khung phim: hai dải đen trên / dưới + tên đôi nhỏ
    g.fillStyle = '#000'; g.fillRect(0, 0, W, 210); g.fillRect(0, H - 210, W, 210);
    if (t >= T.s0 - 0.3 && t < T.d0) text(g, (A.groom + ' · ' + A.bride).toUpperCase(), W / 2, 120, '500 30px ' + SERIF, 'rgba(255,255,255,.75)', prog(t, T.s0 - 0.3, T.s0 + 0.3), { spacing: 8 });
    if (t >= T.d0 && t < T.e0 + 0.6) {
      var b = prog(t, T.d0, T.d0 + 0.5) * (1 - prog(t, T.e0, T.e0 + 0.6)), d = A.dd ? ease(prog(t, T.d0 + 0.2, T.d0 + 0.9)) : 0;
      g.save(); g.globalAlpha = b;
      if (A.dd) {
        text(g, A.dd, W / 2, 720, '500 280px ' + SERIF, '#fff', d);
        text(g, 'THÁNG ' + A.mm + ' · ' + A.yyyy, W / 2, 920, '500 48px ' + SERIF, '#d9b26b', d, { spacing: 12 });
        if (A.weekday) text(g, A.weekday, W / 2, 1000, '600 38px ' + SANS, '#aaa', d);
      }
      var l1 = ease(prog(t, T.d0 + 0.8, T.d0 + 1.5)), l2 = ease(prog(t, T.d0 + 1.1, T.d0 + 1.8));
      text(g, 'Mời bạn đến chung vui', W / 2, 1220, '700 92px ' + SCRIPT, A.P.pink, l1);
      text(g, 'cùng chúng mình', W / 2, 1340, '700 92px ' + SCRIPT, A.P.pink, l2);
      g.restore();
    }
    if (t >= T.e0) endCard(g, t, T.e0, A, { ink: '#fff', accent: A.P.pink, amp: '#d9b26b', muted: '#aaa', ring: '#d9b26b' });
    vignette(g, 0.45);
    if (t < T.e0) watermark(g, 1 - prog(t, T.e0 - 0.3, T.e0));
  }

  // ---- 3. Polaroid: ảnh rơi xuống bàn giấy kraft như album kỷ niệm, chữ viết tay ----
  var POLA = [[330, 760, -8], [740, 840, 7], [370, 1230, 5], [720, 1300, -6], [540, 1010, -2], [560, 1470, 4]];
  var POLACAP = function (A, k) { return [A.names, A.date || '♥', 'Thương nhau', 'Về chung một nhà', '♥ ♥ ♥', 'Mãi bên nhau'][k % 6]; };
  function paper(g) {
    g.fillStyle = '#f2e8da'; g.fillRect(0, 0, W, H);
    g.save(); g.globalAlpha = 0.05; g.fillStyle = '#7a5a3a'; for (var y = 0; y < H; y += 7) g.fillRect(0, y, W, 1); g.restore();
    var v = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8); v.addColorStop(0, 'rgba(255,255,255,0)'); v.addColorStop(1, 'rgba(120,80,40,.22)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  }
  function polaFrame(g, t, A, T) {
    paper(g);
    var z = 1 + 0.05 * prog(t, 0, T.i0);
    g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
    text(g, 'Kỷ niệm của chúng mình', W / 2, 270, '700 96px ' + SCRIPT, '#5a3b2a', ease(prog(t, 0.2, 0.9)));
    text(g, A.names, W / 2, 380, 'italic 500 50px ' + SERIF, '#7a5a4a', ease(prog(t, 0.6, 1.2)));
    var n = Math.min(6, A.slides.length);
    for (var k = 0; k < n; k++) {
      var st = T.p0 + k * T.per, p = easeIO(prog(t, st, st + 0.6));
      if (p <= 0) continue;
      var pos = POLA[k], w = 470, h = 560, s = 1.35 - 0.35 * p;
      g.save(); g.translate(pos[0], pos[1] - (1 - p) * 120); g.rotate((pos[2] + (1 - p) * 14) * Math.PI / 180); g.scale(s, s); g.globalAlpha = Math.min(1, p * 1.6);
      g.shadowColor = 'rgba(60,40,20,.35)'; g.shadowBlur = 30 + (1 - p) * 40; g.shadowOffsetY = 10; g.fillStyle = '#fffdf8'; g.fillRect(-w / 2, -h / 2, w, h + 100); g.shadowBlur = 0; g.shadowOffsetY = 0;
      g.save(); g.beginPath(); g.rect(-w / 2 + 22, -h / 2 + 22, w - 44, h - 44); g.clip(); cover(g, A.slides[k], -w / 2 + 22, -h / 2 + 22, w - 44, h - 44, 1); g.restore();
      text(g, POLACAP(A, k), 0, h / 2 + 46, '700 44px ' + SCRIPT, '#5a3b2a', 1, { max: w - 40 });
      g.restore();
    }
    g.restore();
    if (t >= T.i0 && t < T.e0 + 0.6) {
      var b = prog(t, T.i0, T.i0 + 0.6) * (1 - prog(t, T.e0, T.e0 + 0.6));
      g.save(); g.globalAlpha = b; g.fillStyle = 'rgba(52,32,22,.62)'; g.fillRect(0, 0, W, H);
      var l1 = ease(prog(t, T.i0 + 0.2, T.i0 + 0.9)), l2 = ease(prog(t, T.i0 + 0.5, T.i0 + 1.2)), l3 = ease(prog(t, T.i0 + 1.0, T.i0 + 1.6));
      text(g, 'Mời bạn đến chung vui', W / 2, 820, '700 104px ' + SCRIPT, '#fff', l1, { shadow: true });
      text(g, 'cùng chúng mình 💕', W / 2, 950, '700 104px ' + SCRIPT, A.P.pink, l2, { shadow: true });
      if (A.date) text(g, A.date, W / 2, 1110, '500 60px ' + SERIF, '#fff', l3, { spacing: 8, shadow: true });
      g.restore();
    }
    if (t >= T.e0) { g.save(); g.globalAlpha = ease(prog(t, T.e0, T.e0 + 0.6)); paper(g); g.restore(); endCard(g, t, T.e0, A, { ink: '#4a3326', accent: A.P.deep, amp: '#b08060', muted: '#8a7060', ring: '#fffdf8' }); }
    if (t < T.e0) watermark(g, 1 - prog(t, T.e0 - 0.3, T.e0));
  }

  // ---- 4. Tối giản: nền trắng, chữ đậm, ảnh trong khung bo góc chuyển nhanh ----
  function miniFrame(g, t, A, T) {
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    if (t < 2.6) {
      var o = prog(t, 2.0, 2.6), up = -80 * easeIO(o), a = 1 - o;
      var p1 = easeIO(prog(t, 0.15, 0.8)), p2 = easeIO(prog(t, 0.45, 1.1));
      text(g, 'CHÚNG MÌNH', W / 2 - 300 * (1 - p1), 760 + up, '800 128px ' + SANS, A.P.ink, a * p1);
      text(g, 'CƯỚI RỒI!', W / 2 + 300 * (1 - p2), 910 + up, '800 160px ' + SANS, A.P.main, a * p2);
      text(g, A.groom + ' & ' + A.bride, W / 2, 1040 + up, '600 46px ' + SANS, A.P.muted, a * ease(prog(t, 0.9, 1.5)));
    }
    var fx = 90, fy = 300, fw = 900, fh = 1200;
    if (t >= 2.2 && t < T.i0 + 0.5) {
      var fa = prog(t, 2.2, 2.6) * (1 - prog(t, T.i0, T.i0 + 0.5));
      g.save(); g.globalAlpha = fa;
      g.save(); rrect(g, fx, fy, fw, fh, 44); g.clip();
      A.slides.forEach(function (im, k) {
        var st = T.s0 + k * T.per, en = st + T.per + 0.4;
        if (t < st || t > en) return;
        var r = easeIO(prog(t, st, st + 0.4)), p = prog(t, st, en); // ảnh mới lộ dần từ dưới lên
        g.save(); g.beginPath(); g.rect(fx, fy + fh * (1 - r), fw, fh * r); g.clip(); cover(g, im, fx, fy, fw, fh, 1.04 + 0.08 * p, 0.5, 0.4); g.restore();
      });
      g.restore();
      var k = Math.min(A.slides.length, Math.max(1, Math.floor((t - T.s0) / T.per) + 1));
      text(g, (k < 10 ? '0' : '') + k, fx, 220, '800 54px ' + SANS, A.P.main, 1, { align: 'left' });
      text(g, 'SAVE THE DATE', fx + fw, 220, '600 34px ' + SANS, A.P.muted, 1, { align: 'right', spacing: 6 });
      text(g, A.groom + ' & ' + A.bride, W / 2, 1610, '800 64px ' + SANS, A.P.ink, 1);
      if (A.date) text(g, A.date, W / 2, 1700, '600 46px ' + SANS, A.P.main, 1, { spacing: 6 });
      g.restore();
    }
    if (t >= T.i0 && t < T.e0 + 0.6) {
      var b = prog(t, T.i0, T.i0 + 0.5) * (1 - prog(t, T.e0, T.e0 + 0.6)), d = ease(prog(t, T.i0 + 0.2, T.i0 + 0.8));
      g.save(); g.globalAlpha = b;
      if (A.dd) {
        text(g, A.dd, W / 2, 700, '800 320px ' + SANS, A.P.main, d);
        text(g, 'THÁNG ' + A.mm + ' · ' + A.yyyy, W / 2, 920, '700 54px ' + SANS, A.P.ink, d, { spacing: 10 });
        if (A.weekday) text(g, A.weekday, W / 2, 1000, '600 38px ' + SANS, A.P.muted, d);
      }
      g.fillStyle = A.P.main; g.fillRect(W / 2 - 60, 1090, 120 * ease(prog(t, T.i0 + 0.6, T.i0 + 1.1)), 6);
      text(g, 'Mời bạn đến chung vui', W / 2, 1220, '700 64px ' + SANS, A.P.ink, ease(prog(t, T.i0 + 0.8, T.i0 + 1.4)));
      text(g, 'cùng chúng mình', W / 2, 1310, '700 64px ' + SANS, A.P.ink, ease(prog(t, T.i0 + 1.0, T.i0 + 1.6)));
      g.restore();
    }
    if (t >= T.e0) endCard(g, t, T.e0, A, { ink: A.P.ink, accent: A.P.ink, amp: A.P.main, muted: A.P.muted, ring: A.P.main, nameFont: '800 96px ' + SANS, ampFont: '800 64px ' + SANS });
    if (t < T.e0) watermark(g, 1 - prog(t, T.e0 - 0.3, T.e0));
  }

  // ---- 5. Song hỷ: nền đỏ, chữ 囍 và viền vàng, ảnh trong khung vòm ----
  var GOLD = '#e8c27a', CJK = '"Songti SC", "Noto Serif SC", "Noto Serif CJK SC", "SimSun", serif';
  function redBg(g, t, A) {
    var bg = g.createRadialGradient(W / 2, H * 0.42, 80, W / 2, H * 0.42, H * 0.85); bg.addColorStop(0, A.P.hyA); bg.addColorStop(1, A.P.hyB);
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.save(); g.strokeStyle = GOLD; g.globalAlpha = 0.85; g.lineWidth = 4;
    [[60, 60, 1, 1], [W - 60, 60, -1, 1], [60, H - 60, 1, -1], [W - 60, H - 60, -1, -1]].forEach(function (c) {
      g.beginPath(); g.moveTo(c[0], c[1] + 150 * c[3]); g.lineTo(c[0], c[1]); g.lineTo(c[0] + 150 * c[2], c[1]); g.stroke();
      g.beginPath(); g.moveTo(c[0] + 22 * c[2], c[1] + 110 * c[3]); g.lineTo(c[0] + 22 * c[2], c[1] + 22 * c[3]); g.lineTo(c[0] + 110 * c[2], c[1] + 22 * c[3]); g.stroke();
      g.beginPath(); g.arc(c[0] + 22 * c[2], c[1] + 22 * c[3], 7, 0, Math.PI * 2); g.fillStyle = GOLD; g.fill();
    });
    g.restore();
    petals(g, t, 0.35, GOLD);
  }
  function arch(g, x, y, w, h) { var r = w / 2; g.beginPath(); g.moveTo(x, y + r); g.arc(x + r, y + r, r, Math.PI, 0); g.lineTo(x + w, y + h); g.lineTo(x, y + h); g.closePath(); }
  function hyFrame(g, t, A, T) {
    redBg(g, t, A);
    if (t < 3.1) {
      var a = 1 - prog(t, 2.6, 3.1), s = 0.6 + 0.4 * easeIO(prog(t, 0.1, 1.0));
      g.save(); g.globalAlpha = a; g.translate(W / 2, 760); g.scale(s, s); g.shadowColor = 'rgba(255,210,120,.6)'; g.shadowBlur = 40;
      text(g, '囍', 0, 0, '700 420px ' + CJK, GOLD, ease(prog(t, 0.1, 0.8))); g.restore();
      text(g, 'Thiệp báo hỷ', W / 2, 1130, '700 100px ' + SCRIPT, GOLD, a * ease(prog(t, 0.8, 1.4)));
      text(g, A.groom + ' & ' + A.bride, W / 2, 1250, '500 60px ' + SERIF, '#fbe3b5', a * ease(prog(t, 1.1, 1.7)));
      if (A.date) text(g, A.date, W / 2, 1340, '500 48px ' + SERIF, GOLD, a * ease(prog(t, 1.4, 2.0)), { spacing: 8 });
    }
    var ax = 170, ay = 360, aw = 740, ah = 1080;
    if (t >= 2.8 && t < T.i0 + 0.5) {
      var fa = prog(t, 2.8, 3.2) * (1 - prog(t, T.i0, T.i0 + 0.5));
      g.save(); g.globalAlpha = fa;
      text(g, '囍', W / 2, 250, '700 110px ' + CJK, GOLD, 1);
      g.save(); arch(g, ax, ay, aw, ah); g.clip(); g.fillStyle = A.P.hyB; g.fillRect(ax, ay, aw, ah);
      slideshow(g, t, A.slides, T.s0, T.per, { x: ax, y: ay, w: aw, h: ah }); g.restore();
      arch(g, ax - 14, ay - 14, aw + 28, ah + 28); g.lineWidth = 10; g.strokeStyle = GOLD; g.stroke();
      arch(g, ax - 34, ay - 34, aw + 68, ah + 68); g.lineWidth = 3; g.stroke();
      text(g, A.groom + ' & ' + A.bride, W / 2, 1590, '500 64px ' + SERIF, '#fbe3b5', 1);
      if (A.date) text(g, A.date, W / 2, 1680, '500 46px ' + SERIF, GOLD, 1, { spacing: 8 });
      g.restore();
    }
    if (t >= T.i0 && t < T.e0 + 0.6) {
      var b = prog(t, T.i0, T.i0 + 0.5) * (1 - prog(t, T.e0, T.e0 + 0.6));
      g.save(); g.globalAlpha = b;
      text(g, '囍', W / 2, 520, '700 200px ' + CJK, GOLD, ease(prog(t, T.i0 + 0.1, T.i0 + 0.7)));
      text(g, 'Trân trọng kính mời', W / 2, 800, 'italic 500 72px ' + SERIF, '#fbe3b5', ease(prog(t, T.i0 + 0.4, T.i0 + 1.0)));
      text(g, 'đến chung vui cùng gia đình chúng tôi', W / 2, 920, '700 66px ' + SCRIPT, GOLD, ease(prog(t, T.i0 + 0.7, T.i0 + 1.3)));
      if (A.date) text(g, A.date, W / 2, 1080, '500 60px ' + SERIF, '#fff', ease(prog(t, T.i0 + 1.0, T.i0 + 1.6)), { spacing: 8 });
      if (A.weekday) text(g, A.weekday, W / 2, 1160, '600 38px ' + SANS, '#fbe3b5', ease(prog(t, T.i0 + 1.0, T.i0 + 1.6)));
      g.restore();
    }
    if (t >= T.e0) endCard(g, t, T.e0, A, { ink: '#fff', accent: GOLD, amp: '#fbe3b5', muted: '#f2c9a0', ring: GOLD, bye: 'Rất hân hạnh được đón tiếp!' });
    if (t < T.e0) watermark(g, 1 - prog(t, T.e0 - 0.3, T.e0));
  }

  var r1 = function (x) { return Math.round(x * 10) / 10; };
  var STYLES = {
    phongbi: { name: 'Phong bì', desc: 'Mở phong bì, ảnh rơi', frame: function (g, t, A, T) { envFrame(g, t, A, T); },
      timeline: function (A) { var per = 1.6, s0 = 6.8, inv0 = s0 + A.slides.length * per + 0.3, end0 = inv0 + 4.2; return { s0: s0, per: per, inv0: inv0, end0: end0, D: r1(end0 + 3.8) }; }, preview: 4.4 },
    dienanh: { name: 'Điện ảnh', desc: 'Nền đen, khung phim', frame: cineFrame,
      timeline: function (A) { var s0 = 3.2, per = 1.9, d0 = s0 + A.slides.length * per + 0.1, e0 = d0 + 3.6; return { s0: s0, per: per, d0: d0, e0: e0, D: r1(e0 + 3.8) }; }, preview: 4.4 },
    polaroid: { name: 'Polaroid', desc: 'Album kỷ niệm', frame: polaFrame,
      timeline: function (A) { var p0 = 1.6, per = 1.25, n = Math.min(6, A.slides.length), i0 = p0 + n * per + 1.0, e0 = i0 + 3.6; return { p0: p0, per: per, i0: i0, e0: e0, D: r1(e0 + 3.8) }; }, preview: 7.2 },
    toigian: { name: 'Tối giản', desc: 'Chữ đậm, hiện đại', frame: miniFrame,
      timeline: function (A) { var s0 = 2.4, per = 1.35, i0 = s0 + A.slides.length * per + 0.2, e0 = i0 + 3.4; return { s0: s0, per: per, i0: i0, e0: e0, D: r1(e0 + 3.6) }; }, preview: 3.4 },
    songhy: { name: 'Song hỷ', desc: 'Đỏ vàng truyền thống', frame: hyFrame,
      timeline: function (A) { var s0 = 3.0, per = 1.7, i0 = s0 + A.slides.length * per + 0.3, e0 = i0 + 3.8; return { s0: s0, per: per, i0: i0, e0: e0, D: r1(e0 + 3.8) }; }, preview: 1.2 },
  };
  var STYLE_IDS = ['phongbi', 'dienanh', 'polaroid', 'toigian', 'songhy'];

  // ---------- nhạc (MP3 → 12 giây, vào / ra nhẹ) ----------
  function renderMusic(url, D) {
    if (!url || !window.OfflineAudioContext) return Promise.resolve(null);
    return fetch(url).then(function (r) { if (!r.ok) throw new Error('nhạc'); return r.arrayBuffer(); })
      .then(function (buf) { return new OfflineAudioContext(2, SR, SR).decodeAudioData(buf); })
      .then(function (song) {
        var len = D * SR, off = new OfflineAudioContext(2, len, SR), src = off.createBufferSource(), g = off.createGain();
        src.buffer = song; src.loop = true;
        g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(1, 0.6); g.gain.setValueAtTime(1, D - 1.8); g.gain.linearRampToValueAtTime(0, D);
        src.connect(g); g.connect(off.destination); src.start(0, Math.min(8, song.duration * 0.1)); // bỏ đoạn dạo đầu lặng
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

  // ---------- dữ liệu thiệp → nội dung video ----------
  var WD = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  function assets(card, maxSide) {
    var d = card.data;
    var photos = [d.cover].concat(d.photos || []).filter(Boolean).filter(function (u, i, a) { return a.indexOf(u) === i; });
    if (!photos.length) photos = (card.samplePhotos || []).length ? card.samplePhotos : ['/demo/cover-' + card.template + '-' + card.palette + '.jpg']; // chưa có ảnh: bộ ảnh mẫu của mẫu (như trình sửa đang hiện)
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d.date || '');
    var main = (d.events || []).find(function (e) { return /tiệc/i.test(e.name || ''); }) || (d.events || [])[0] || {};
    var mus = d.music || (d.musicOff ? '' : '/music/canon.mp3');
    return Promise.all(photos.slice(0, 10).map(function (u) { return loadImg(u, maxSide); })).then(function (ims) {
      ims = ims.filter(Boolean);
            // đoạn chiếu: tới 6 ảnh album (ít ảnh thì thêm ảnh bìa, vẫn thiếu thì lặp); 3 ảnh rơi ở cảnh mời: ưu tiên ảnh chưa chiếu
      var slides = ims.slice(1, 7); if (slides.length < 3) slides = slides.concat(ims.slice(0, 1));
      while (slides.length < 3 && ims.length) slides.push(ims[slides.length % ims.length]);
      var album = ims.length > 9 ? ims.slice(7, 10) : ims.slice(1).reverse().slice(0, 3); while (album.length < 3 && ims.length) album.push(ims[album.length % ims.length]);
      return {
        slides: slides, dd: m ? m[3] : '', mm: m ? m[2] : '', yyyy: m ? m[1] : '',
        cover: ims[0] || null, album: album,
        groom: d.groom.name || 'Chú rể', bride: d.bride.name || 'Cô dâu',
        names: (d.groom.name || 'Chú rể') + ' & ' + (d.bride.name || 'Cô dâu'),
        date: m ? m[3] + ' . ' + m[2] + ' . ' + m[1] : '',
        weekday: m ? WD[new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay()] + (main.time ? ' · ' + main.time.replace(':', 'h') : '') : '',
        place: main.place || main.address || '', music: mus,
      };
    });
  }

  // opts: { scale (khổ ra so với 1080×1920, mặc định 2/3 = 720×1280 — đủ nét cho TikTok, dựng nhanh gấp đôi), bitrate, noAudio }
  function render(card, onProgress, styleId, toneId, opts) {
    onProgress = onProgress || function () {}; opts = opts || {};
    var style = STYLES[styleId] || STYLES.phongbi, T, S = opts.scale || 2 / 3;
    if (!window.VideoEncoder || !window.VideoFrame) return Promise.reject(new Error('Trình duyệt này chưa dựng được video — mở bằng Chrome, Edge hoặc Safari bản mới nhé'));
    var OW = Math.round(W * S / 2) * 2, OH = Math.round(H * S / 2) * 2; // H.264 cần cạnh chẵn
    var A, canvas = document.createElement('canvas'); canvas.width = OW; canvas.height = OH;
    var g = canvas.getContext('2d', { alpha: false });
    return Promise.all([window.Mp4Muxer ? null : loadScript('/vendor/mp4-muxer.js'), loadFonts(), assets(card, Math.max(600, Math.round(1500 * S)))]).then(function (r) {
      A = r[2]; A.P = tone(toneHex(card, toneId, styleId)); T = style.timeline(A);
      var AVC = ['avc1.640028', 'avc1.4d0028', 'avc1.42e028'], chunks = [], meta = null, failed = null;
      var enc = new VideoEncoder({
        output: function (chunk, m) { if (!meta && m && m.decoderConfig) meta = m; var b = new Uint8Array(chunk.byteLength); chunk.copyTo(b); chunks.push({ data: b, type: chunk.type, ts: chunk.timestamp, dur: chunk.duration || Math.round(1e6 / FPS) }); },
        error: function (e) { failed = e; },
      });
      var base = { width: OW, height: OH, bitrate: opts.bitrate || 4e6, bitrateMode: 'variable', framerate: FPS, avc: { format: 'avc' } };
      // ưu tiên mã hoá bằng phần cứng (nhanh hơn nhiều trên điện thoại), không được thì để trình duyệt tự chọn
      var tries = []; AVC.forEach(function (codec) { tries.push({ codec: codec, hardwareAcceleration: 'prefer-hardware' }); }); AVC.forEach(function (codec) { tries.push({ codec: codec }); });
      function pick(i) {
        if (i >= tries.length) return Promise.reject(new Error('Trình duyệt chưa hỗ trợ mã hoá H.264 — dùng Chrome hoặc Edge bản mới nhé'));
        var c = Object.assign({}, base, tries[i]);
        return VideoEncoder.isConfigSupported(c).then(function (x) { return x.supported ? c : pick(i + 1); }, function () { return pick(i + 1); });
      }
      function breathe() { return new Promise(function (res) { var ch = new MessageChannel(); ch.port1.onmessage = function () { res(); }; ch.port2.postMessage(0); }); }
      var total = Math.round(T.D * FPS), i = 0;
      return pick(0).then(function (c) {
        enc.configure(c);
        function next() {
          if (failed) return Promise.reject(failed);
          if (i >= total) return enc.flush();
          if (enc.encodeQueueSize > 6) return breathe().then(next);
          g.setTransform(S, 0, 0, S, 0, 0); style.frame(g, i / FPS, A, T);
          var f = new VideoFrame(canvas, { timestamp: Math.round(i * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
          enc.encode(f, { keyFrame: i % (FPS * 2) === 0 }); f.close(); i++;
          if (i % 10 === 0) onProgress(0.8 * i / total, 'Đang dựng hình');
          return (i % 12 === 0 ? breathe() : Promise.resolve()).then(next);
        }
        return next();
      }).then(function () { enc.close(); if (failed) throw failed; return { chunks: chunks, meta: meta }; });
    }).then(function (v) {
      onProgress(0.84, 'Đang ghép nhạc');
      return aacConfig().then(function (cfg) {
        if (!cfg || !A.music || opts.noAudio) return [v, null, null];
        return renderMusic(A.music, T.D).then(function (buf) { return [v, cfg, buf]; }, function (e) { console.warn('Bỏ qua nhạc:', e); return [v, null, null]; });
      });
    }).then(function (x) {
      var v = x[0], cfg = x[1], buf = x[2];
      var muxer = new Mp4Muxer.Muxer({
        target: new Mp4Muxer.ArrayBufferTarget(),
        video: { codec: 'avc', width: OW, height: OH, frameRate: FPS },
        audio: buf ? { codec: 'aac', numberOfChannels: 2, sampleRate: SR } : undefined,
        fastStart: 'in-memory', firstTimestampBehavior: 'offset',
      });
      v.chunks.forEach(function (c, j) { muxer.addVideoChunkRaw(c.data, c.type, c.ts, c.dur, j === 0 ? v.meta : undefined); });
      return (buf ? encodeAudio(buf, cfg, muxer) : Promise.resolve()).then(function () {
        muxer.finalize(); onProgress(1, 'Xong');
        return { blob: new Blob([muxer.target.buffer], { type: 'video/mp4' }), music: !!buf };
      });
    });
  }

  function fileName(card) {
    var n = [card.data.groom.name, card.data.bride.name].filter(Boolean).join('-') || 'thiep-cuoi';
    return 'cuoinha-' + (n.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'thiep-cuoi') + '.mp4';
  }

  var CSS = '.st-pv{display:flex;justify-content:center;margin:0 0 12px}.st-pv canvas{height:min(384px,34vh);width:auto;aspect-ratio:9/16;border-radius:14px;background:#111;box-shadow:0 10px 30px rgba(0,0,0,.18)}'
    + '.st-list{display:flex;gap:10px;overflow-x:auto;padding:2px 2px 8px;margin:0 -2px 10px;scrollbar-width:thin}'
    + '.st-it{flex:none;width:86px;padding:0;border:0;background:none;cursor:pointer;font:inherit;color:inherit;text-align:center}'
    + '.st-it canvas{display:block;width:86px;height:153px;border-radius:10px;background:#eee;border:3px solid transparent;transition:border-color .15s}'
    + '.st-it b{display:block;margin-top:5px;font-size:13px}.st-it small{display:block;font-size:11px;color:var(--muted,#8a7d80);line-height:1.25}'
    + '.st-it.on canvas{border-color:#d6455d}.st-it.on b{color:#d6455d}'
    + '.st-tones{margin:0 0 14px}.st-tones>span{display:block;font-size:13px;font-weight:600;margin:0 0 6px}.st-tones em{font-style:normal;font-weight:500;color:var(--muted,#8a7d80)}'
    + '.st-tr{display:flex;gap:7px;overflow-x:auto;padding:3px 3px 4px}'
    + '.st-tn{flex:none;width:30px;height:30px;padding:0;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.15);cursor:pointer;position:relative}'
    + '.st-tn.on{box-shadow:0 0 0 2.5px #d6455d}.st-tn.auto::after{content:"✦";position:absolute;inset:0;display:grid;place-items:center;color:#fff;font-size:12px}'
    + '@media (max-width:600px){.st-pv canvas{height:min(330px,30vh)}.st-it{width:74px}.st-it canvas{width:74px;height:132px}.st-it small{display:none}.st-list{margin-bottom:6px}}'
    + '.st-bar{height:8px;border-radius:99px;background:rgba(214,69,93,.14);overflow:hidden}.st-bar i{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,#e2586f,#c93a55);transition:width .3s}';
  // trang giới thiệu (không nạp common.js): hộp thoại / thông báo / nút gọn riêng — trang trong tài khoản dùng openModal của common.js
  var CSS_LITE = '.st-modal{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:16px;background:rgba(30,20,24,.5)}'
    + '.st-box{position:relative;width:min(520px,100%);max-height:92vh;max-height:92dvh;overflow:auto;padding:22px;border-radius:20px;background:#fff;color:#2b2224;box-shadow:0 30px 80px rgba(0,0,0,.25)}'
    + '.st-box h2{font-size:22px;padding-right:40px}.st-box .muted{color:#7a6d70}'
    + '.st-x{position:absolute;top:14px;right:14px;width:36px;height:36px;border:0;border-radius:50%;background:#fdecef;color:#c93a55;font-size:20px;cursor:pointer}'
    + '.st-box .btn{display:flex;align-items:center;justify-content:center;width:100%;min-height:46px;padding:10px 18px;border:0;border-radius:999px;font:600 15px/1.2 inherit;font-family:inherit;text-decoration:none;cursor:pointer;color:#fff;background:linear-gradient(135deg,#e2586f,#c93a55);box-shadow:0 8px 20px rgba(214,69,93,.25)}'
    + '.st-box .btn.lg{min-height:52px;font-size:16px}.st-box .btn.soft{color:#c93a55;background:#fdecef;box-shadow:none}.st-box .btn.plain{color:#2b2224;background:#fff;border:1px solid #eadfe1;box-shadow:none}.st-box .btn:disabled{opacity:.6}'
    + '.st-toast{position:fixed;left:50%;bottom:24px;z-index:1001;transform:translateX(-50%);max-width:calc(100% - 32px);padding:12px 18px;border-radius:12px;background:#2b2224;color:#fff;font-size:14px;box-shadow:0 10px 30px rgba(0,0,0,.25)}';
  function addCss() {
    if (document.getElementById('stCss')) return; var st = document.createElement('style'); st.id = 'stCss'; st.textContent = CSS + (window.__stLite ? CSS_LITE : ''); document.head.appendChild(st);
  }
  if (!window.openModal) {
    window.__stLite = true;
    window.openModal = function (html, onMount, onClose) {
      var m = document.createElement('div'); m.className = 'st-modal'; m.innerHTML = '<div class="st-box"><button type="button" class="st-x" aria-label="Đóng">×</button>' + html + '</div>';
      document.body.appendChild(m); var ov = document.body.style.overflow; document.body.style.overflow = 'hidden';
      var onKey = function (e) { if (e.key === 'Escape') close(); };
      var close = function () { if (!m.isConnected) return; m.remove(); document.body.style.overflow = ov; document.removeEventListener('keydown', onKey); if (onClose) onClose(); };
      document.addEventListener('keydown', onKey);
      m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('.st-x')) close(); });
      if (onMount) onMount(m.querySelector('.st-box'), close);
      return close;
    };
  }
  if (!window.toast) window.toast = function (msg) { addCss(); var t = document.createElement('div'); t.className = 'st-toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3500); };

  // kết quả: xem lại → tải về / chia sẻ (điện thoại mở bảng chia sẻ của máy: TikTok, Zalo, Facebook…)
  function showResult(res, card, opts) {
    opts = opts || {};
    var url = URL.createObjectURL(res.blob), name = fileName(card);
    var file = window.File ? new File([res.blob], name, { type: 'video/mp4' }) : null;
    var canShare = file && navigator.canShare && navigator.canShare({ files: [file] });
    openModal('<h2 style="margin:0 0 8px">🎬 Video của bạn đây</h2>'
      + '<video src="' + url + '" controls playsinline loop autoplay muted style="display:block;width:100%;max-height:58vh;object-fit:contain;border-radius:12px;background:#000;margin:0 0 12px"></video>'
      + (res.music ? '' : '<p class="muted" style="font-size:13px;margin:0 0 10px">Trình duyệt này chưa ghép được nhạc — mở bằng Chrome nếu muốn video có nhạc, hoặc thêm nhạc khi đăng TikTok.</p>')
      + (canShare ? '<button class="btn block lg" id="stShare">Chia sẻ lên TikTok, Zalo, Facebook…</button>' : '')
      + '<a class="btn block ' + (canShare ? 'soft' : 'lg') + '" style="margin-top:8px" href="' + url + '" download="' + name + '">⬇ Tải video về máy</a>'
      + (opts.cta ? '<button class="btn block plain" style="margin-top:8px" id="stCta">' + opts.cta.label + '</button>' : '')
      + '<p class="muted" style="font-size:12.5px;margin:10px 0 0">' + (opts.tip || 'Mẹo: khi đăng, dán kèm link thiệp để bạn bè bấm vào xem.') + '</p>', function (box) {
      var cta = box.querySelector('#stCta'); if (cta) cta.onclick = opts.cta.go;
      var b = box.querySelector('#stShare');
      if (b) b.onclick = function () { navigator.share({ files: [file], title: 'Thiệp cưới ' + card.data.groom.name + ' & ' + card.data.bride.name }).catch(function () {}); };
    });
  }

  // hộp chọn kiểu: ảnh xem trước từng kiểu (dựng từ ảnh của thiệp) + kiểu đang chọn chạy thử, bấm "Tạo video" để xuất MP4
  window.storyModal = function (cardId) { return storyChooser(api('/api/cards/' + cardId).then(function (r) { return r.card; })); };
  // card: { template, palette, data: { groom, bride, date, events, cover, photos, music }, samplePhotos } hoặc promise trả về như vậy
  // Màn "đang dựng video" phủ toàn màn hình: vòng quay + % + nhắc đừng tắt màn hình; xin giữ màn sáng (Wake Lock) trong lúc dựng.
  function busyScreen() {
    if (!document.getElementById('stBusyCss')) {
      var st = document.createElement('style'); st.id = 'stBusyCss';
      st.textContent = '.st-busy{position:fixed;inset:0;z-index:10050;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;background:#1c1216;color:#fff;text-align:center;font-family:inherit}'
        + '.st-busy .ring{width:64px;height:64px;border-radius:50%;border:5px solid rgba(255,255,255,.15);border-top-color:#ef7d8d;animation:stspin 1s linear infinite}@keyframes stspin{to{transform:rotate(360deg)}}'
        + '.st-busy b{font-size:40px;font-weight:800;line-height:1}.st-busy .lb{font-size:15px;opacity:.85}'
        + '.st-busy .bar{width:min(280px,80vw);height:6px;border-radius:99px;background:rgba(255,255,255,.15);overflow:hidden}.st-busy .bar i{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,#ef7d8d,#d6455d);transition:width .3s}'
        + '.st-busy .warn{margin-top:18px;max-width:300px;padding:12px 16px;border-radius:14px;background:rgba(255,255,255,.08);font-size:14px;line-height:1.5}';
      document.head.appendChild(st);
    }
    var el = document.createElement('div'); el.className = 'st-busy'; el.setAttribute('role', 'alert');
    el.innerHTML = '<div class="ring"></div><b>0%</b><div class="bar"><i></i></div><div class="lb">Đang chuẩn bị…</div>'
      + '<div class="warn">📱 Đừng tắt màn hình hay chuyển sang ứng dụng khác nhé — video đang được dựng ngay trên máy bạn, khoảng 10–30 giây.</div>';
    document.body.appendChild(el);
    var lock = null, gone = false;
    function getLock() { try { if (navigator.wakeLock && document.visibilityState === 'visible') navigator.wakeLock.request('screen').then(function (l) { if (gone) l.release(); else lock = l; }, function () {}); } catch (e) {} }
    var onVis = function () { if (!gone && document.visibilityState === 'visible') getLock(); };
    document.addEventListener('visibilitychange', onVis);
    getLock();
    return {
      set: function (p, label) { var n = Math.round(p * 100); el.querySelector('b').textContent = n + '%'; el.querySelector('.bar i').style.width = n + '%'; if (label) el.querySelector('.lb').textContent = label + '…'; },
      done: function () { gone = true; document.removeEventListener('visibilitychange', onVis); if (lock) { try { lock.release(); } catch (e) {} } el.remove(); },
    };
  }
  window.storyBusy = busyScreen;

  function storyChooser(cardIn, opts) {
    opts = opts || {};
    addCss();
    var closeIt, card, A, cur = 'phongbi', curTone = 'thiep', raf = 0, busy = false;
    var stop = function () { cancelAnimationFrame(raf); raf = 0; };
    openModal('<h2 style="margin:0 0 4px">🎬 Video đăng TikTok / Story</h2><p class="muted" style="margin:0 0 12px;font-size:14px">Chọn một kiểu — video dựng từ ảnh cưới, tên và ngày cưới của bạn, có nhạc nền.</p>'
      + '<div class="st-pv"><canvas id="stPrev" width="270" height="480"></canvas></div>'
      + '<div class="st-list" id="stList">' + STYLE_IDS.map(function (id) { return '<button type="button" class="st-it' + (id === cur ? ' on' : '') + '" data-st="' + id + '"><canvas width="172" height="306"></canvas><b>' + STYLES[id].name + '</b><small>' + STYLES[id].desc + '</small></button>'; }).join('') + '</div>'
      + '<div class="st-tones" id="stTones"></div>'
      + '<div id="stGoBox"><button class="btn block lg" id="stGo" disabled>Đang tải ảnh…</button></div>', function (box, close) {
      closeIt = close;
      var prev = box.querySelector('#stPrev'), pg = prev.getContext('2d'), t0 = performance.now(), last = 0;
      function play() {
        stop(); var st = STYLES[cur], T = st.timeline(A); t0 = performance.now(); A.P = tone(toneHex(card, curTone, cur));
        (function tick(now) {
          raf = requestAnimationFrame(tick);
          if (now - last < 33) return; last = now; // ~30 khung/giây
          pg.setTransform(prev.width / W, 0, 0, prev.height / H, 0, 0);
          st.frame(pg, ((now - t0) / 1000) % T.D, A, T);
        })(t0);
      }
      Promise.all([loadFonts(), Promise.resolve(cardIn)]).then(function (r) {
        card = r[1];
        if (!card.template && curTone === 'thiep') curTone = 'hong'; // không gắn với thiệp nào: bỏ lựa chọn theo màu thiệp
        if (!card.data.groom.name || !card.data.bride.name) throw new Error('Điền tên cô dâu và chú rể trước khi tạo video nhé');
        return assets(card, 700); // xem trước nhỏ: ảnh nhỏ cho mượt
      }).then(function (a) {
        A = a;
        function thumbs() { // ảnh xem trước từng kiểu, theo tông màu đang chọn
          box.querySelectorAll('.st-it').forEach(function (b) {
            var st = STYLES[b.dataset.st], c = b.querySelector('canvas'), cg = c.getContext('2d');
            A.P = tone(toneHex(card, curTone, b.dataset.st));
            cg.setTransform(c.width / W, 0, 0, c.height / H, 0, 0); st.frame(cg, st.preview, A, st.timeline(A));
          });
        }
        // dải tông màu: "Theo thiệp" (màu của bảng màu thiệp đang dùng) + các màu có sẵn
        var tn = box.querySelector('#stTones');
        var tones = card.template ? TONES : TONES.filter(function (x) { return x[0] !== 'thiep'; });
        tn.innerHTML = '<span>Tông màu · <em id="stTnName">' + tones.find(function (x) { return x[0] === curTone; })[1] + '</em></span><div class="st-tr">' + tones.map(function (x) { return '<button type="button" class="st-tn' + (x[0] === curTone ? ' on' : '') + (x[0] === 'thiep' ? ' auto' : '') + '" data-tn="' + x[0] + '" title="' + x[1] + '" aria-label="' + x[1] + '" style="background:' + (x[2] || cardColor(card)) + '"></button>'; }).join('') + '</div>';
        tn.onclick = function (e) {
          var b = e.target.closest('[data-tn]'); if (!b || busy) return;
          curTone = b.dataset.tn; tn.querySelectorAll('.st-tn').forEach(function (x) { x.classList.toggle('on', x === b); });
          tn.querySelector('#stTnName').textContent = b.title; thumbs(); play();
        };
        thumbs();
        box.querySelectorAll('.st-it').forEach(function (b) {
          b.onclick = function () { if (busy) return; cur = b.dataset.st; box.querySelectorAll('.st-it').forEach(function (x) { x.classList.toggle('on', x === b); }); play(); };
        });
        var go = box.querySelector('#stGo'); go.disabled = false; go.textContent = 'Tạo video';
        go.onclick = function () {
          busy = true; stop();
          var bz = busyScreen();
          render(card, bz.set, cur, curTone)
            .then(function (res) { bz.done(); close(); showResult(res, card, opts); })
            .catch(function (e) { bz.done(); close(); toast(e.message || 'Không dựng được video', true); });
        };
        play();
      }).catch(function (e) { close(); toast(e.message || 'Không mở được', true); });
    }, stop);
  }
  window.storyChooser = storyChooser;
  window.storyResult = function (res, card, opts) { addCss(); showResult(res, card, opts); };
  window.storyCss = addCss;
  // phát thử một kiểu trên canvas (trang giới thiệu): trả về hàm dừng. Chỉ vẽ khi canvas đang hiện trên màn hình.
  window.storyPlayer = function (canvas, card, styleId, toneId, fps) {
    var gap = 1000 / (fps || 25);
    var stopped = false, raf = 0, seen = true, io = window.IntersectionObserver ? new IntersectionObserver(function (e) { seen = e[0].isIntersecting; }) : null;
    if (io) io.observe(canvas);
    Promise.all([loadFonts(), assets(card, 600)]).then(function (r) {
      var A = r[1], st = STYLES[styleId], T; A.P = tone(toneHex(card, toneId, styleId)); T = st.timeline(A);
      var g = canvas.getContext('2d'), t0 = performance.now(), last = 0;
      g.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0); st.frame(g, st.preview, A, T);
      (function tick(now) {
        if (stopped) return; raf = requestAnimationFrame(tick);
        if (!seen || now - last < gap) return; last = now;
        g.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0); st.frame(g, ((now - t0) / 1000) % T.D, A, T);
      })(t0);
    });
    return function () { stopped = true; cancelAnimationFrame(raf); if (io) io.disconnect(); };
  };
  window.STORY_STYLES = STYLE_IDS.map(function (id) { return { id: id, name: STYLES[id].name, desc: STYLES[id].desc }; });
  // mẫu có sẵn ở trang /video (kiểu + tông màu + nhạc + bộ ảnh mẫu). Video xem trước dựng sẵn ở /demo/story/<id>.mp4 (+ .jpg) —
  // đổi mẫu nào thì dựng lại video xem trước của mẫu đó (tools/story-previews.js: 720×1280, 1,8 Mbps, không tiếng).
  var dset = function (pre, n, ext, cover) { var a = cover ? [cover] : []; for (var i = 1; i <= n; i++) a.push('/demo/' + pre + '-' + i + '.' + ext); return a; };
  window.STORY_TEMPLATES = [
    { id: 'phongbi-hong', st: 'phongbi', tone: 'hong', name: 'Phong bì hồng', music: '/music/canon.mp3', mname: 'Canon in D', ph: dset('hoamoc', 8, 'webp', '/demo/hoamoc-c1.webp') },
    { id: 'dienanh', st: 'dienanh', tone: 'hong', name: 'Điện ảnh', music: '/music/air.mp3', mname: 'Air on the G String', ph: dset('tim', 8, 'jpg') },
    { id: 'polaroid-nau', st: 'polaroid', tone: 'nau', name: 'Polaroid kỷ niệm', music: '/music/eine-kleine.mp3', mname: 'Eine kleine Nachtmusik', ph: dset('nau', 8, 'jpg') },
    { id: 'toigian-xanh', st: 'toigian', tone: 'xanhduong', name: 'Tối giản xanh', music: '/music/blue-danube.mp3', mname: 'Sóng Danube xanh', ph: dset('dodam', 8, 'jpg') },
    { id: 'songhy-do', st: 'songhy', tone: 'do', name: 'Song hỷ đỏ', music: '/music/wedding-march.mp3', mname: 'Hành khúc đám cưới', ph: dset('longphung', 10, 'jpg', '/demo/longphung-cover.jpg') },
    { id: 'phongbi-xanhla', st: 'phongbi', tone: 'xanhla', name: 'Phong bì xanh lá', music: '/music/eine-kleine.mp3', mname: 'Eine kleine Nachtmusik', ph: dset('xanhla', 9, 'jpg') },
    { id: 'toigian-hong', st: 'toigian', tone: 'hong', name: 'Tối giản hồng', music: '/music/radetzky.mp3', mname: 'Hành khúc Radetzky', ph: dset('hoamoc', 8, 'webp', '/demo/hoamoc-c1.webp') },
    { id: 'dienanh-nau', st: 'dienanh', tone: 'nau', name: 'Điện ảnh hoài niệm', music: '/music/clair-de-lune.mp3', mname: 'Clair de Lune', ph: dset('toduyen', 7, 'webp') },
    { id: 'polaroid-tim', st: 'polaroid', tone: 'tim', name: 'Polaroid mộng mơ', music: '/music/waltz-flowers.mp3', mname: 'Valse những bông hoa', ph: dset('xanhla', 9, 'jpg') },
    { id: 'songhy-xanhngoc', st: 'songhy', tone: 'xanhngoc', name: 'Song hỷ xanh ngọc', music: '/music/hornpipe.mp3', mname: 'Alla Hornpipe', ph: dset('songhy', 8, 'jpg') },
  ];
  window.storySampleCard = function (ph, d) {
    d = d || {};
    return { template: '', palette: '', data: { groom: { name: d.groom || 'Gia Huy' }, bride: { name: d.bride || 'Bảo Ngọc' }, date: d.date === undefined ? '2026-12-20' : d.date,
      events: [{ name: 'Tiệc cưới', time: d.time === undefined ? '18:00' : d.time, place: d.place === undefined ? 'Sảnh Ngọc Lan — Nhà hàng tiệc cưới' : d.place }], cover: ph[0], photos: ph.slice(1), music: d.music || '' } };
  };
  // ảnh đại diện (khung tiêu biểu của mẫu) → JPEG nhỏ, dùng làm poster cho video xem trước
  window.storyPoster = function (card, styleId, toneId, w, h) {
    return Promise.all([loadFonts(), assets(card, 700)]).then(function (r) {
      var A = r[1], st = STYLES[styleId], c = document.createElement('canvas'); c.width = w || 360; c.height = h || 640; A.P = tone(toneHex(card, toneId, styleId));
      var g = c.getContext('2d'); g.setTransform(c.width / W, 0, 0, c.height / H, 0, 0); st.frame(g, st.preview, A, st.timeline(A));
      return new Promise(function (ok) { c.toBlob(ok, 'image/jpeg', 0.82); });
    });
  };
  window.storyRender = render; // để thử nghiệm
  // xem nhanh vài khung (không mã hoá) — dùng khi chỉnh bố cục
  window.storyFrames = function (card, times, styleId, toneId) {
    var c = document.createElement('canvas'); c.width = W; c.height = H; var g = c.getContext('2d'), st = STYLES[styleId] || STYLES.phongbi;
    return Promise.all([loadFonts(), assets(card)]).then(function (r) {
      r[1].P = tone(toneHex(card, toneId, styleId)); var T = st.timeline(r[1]);
      return times.map(function (t) { st.frame(g, t, r[1], T); var s = document.createElement('canvas'); s.width = 270; s.height = 480; s.getContext('2d').drawImage(c, 0, 0, 270, 480); return s.toDataURL('image/jpeg', 0.75); });
    });
  };
})();
