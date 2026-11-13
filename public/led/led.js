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
    // ngân hà: dải sao mờ chéo màn quay rất chậm, sao gần lấp lánh, thỉnh thoảng một sao băng
    nganha: {
      init: function () {
        var n = Math.round(900 * L.density * AREA);
        for (var i = 0; i < n; i++) {
          var u = rnd(-1, 1), v = (Math.random() + Math.random() + Math.random() - 1.5) * 0.22; // dồn về giữa dải
          parts.push({ u: u, v: v, r: rnd(0.4, 1.6), ph: rnd(0, 6.28), sp: rnd(0.5, 1.8) });
        }
        var m = Math.round(140 * L.density * AREA);
        for (var j = 0; j < m; j++) extra.push({ x: rnd(0, W), y: rnd(0, H), r: rnd(0.8, 2.4), ph: rnd(0, 6.28), sp: rnd(0.5, 1.5) });
        this.met = null;
      },
      draw: function (dt, t) {
        var cx = W / 2, cy = H / 2, R = Math.hypot(W, H) * 0.62, ang = -0.5 + t * 0.006 * L.speed, ca = Math.cos(ang), sa = Math.sin(ang);
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
        var glow = ctx.createLinearGradient(0, -R * 0.3, 0, R * 0.3);
        glow.addColorStop(0, rgba(pal.particle, 0)); glow.addColorStop(0.5, rgba(pal.particle, 0.13)); glow.addColorStop(1, rgba(pal.particle, 0));
        ctx.fillStyle = glow; ctx.globalAlpha = 1; ctx.fillRect(-R, -R * 0.3, R * 2, R * 0.6);
        ctx.restore();
        var i, p;
        for (i = 0; i < parts.length; i++) {
          p = parts[i];
          var x = cx + (p.u * R) * ca - (p.v * R) * sa, y = cy + (p.u * R) * sa + (p.v * R) * ca;
          if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue;
          ctx.globalAlpha = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(p.ph + t * p.sp * L.speed));
          var s = p.r * 4; ctx.drawImage(sprite, x - s / 2, y - s / 2, s, s);
        }
        for (i = 0; i < extra.length; i++) {
          p = extra[i];
          ctx.globalAlpha = 0.3 + 0.7 * Math.pow(0.5 + 0.5 * Math.sin(p.ph + t * p.sp * L.speed), 3);
          var ss = p.r * 6; ctx.drawImage(sprite, p.x - ss / 2, p.y - ss / 2, ss, ss);
        }
        if (!this.met && Math.random() < dt * 0.18 * L.speed) this.met = { x: rnd(W * 0.3, W), y: rnd(0, H * 0.3), life: 0 };
        if (this.met) {
          var m = this.met; m.life += dt * L.speed; var k = m.life / 1.1;
          if (k >= 1) this.met = null;
          else {
            var hx = m.x - k * 900, hy = m.y + k * 500, gr = ctx.createLinearGradient(hx, hy, hx + 260, hy - 145);
            gr.addColorStop(0, rgba(pal.particle, 0.9 * (1 - k))); gr.addColorStop(1, rgba(pal.particle, 0));
            ctx.globalAlpha = 1; ctx.strokeStyle = gr; ctx.lineWidth = 3; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + 260, hy - 145); ctx.stroke();
          }
        }
      },
    },
    // rèm pha lê: dây hạt pha lê treo từ mép trên, đung đưa nhẹ, hạt loé sáng lần lượt — kiểu phông sảnh tiệc
    remphale: {
      init: function () {
        var n = Math.round(64 * Math.sqrt(L.density) * (W / 1920));
        for (var i = 0; i < n; i++) {
          var x = (i + 0.5) * W / n + rnd(-6, 6), u = Math.abs((x / W) - 0.5) * 2; // dây hai bên dài hơn ở giữa: rèm vén hình vòm
          parts.push({ x: x, len: H * (0.18 + 0.5 * Math.pow(u, 1.6)) + rnd(-20, 20), ph: rnd(0, 6.28), gap: rnd(26, 34) });
        }
        var m = Math.round(36 * L.density * AREA);
        for (var j = 0; j < m; j++) extra.push({ x: rnd(0, W), y: rnd(0, H), r: rnd(40, 110), a: rnd(0.04, 0.12), ph: rnd(0, 6.28) });
      },
      draw: function (dt, t) {
        var i, p;
        for (i = 0; i < extra.length; i++) { // ánh đèn mờ phía sau
          p = extra[i]; ctx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(p.ph + t * 0.5 * L.speed));
          ctx.drawImage(sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
        }
        ctx.lineWidth = 1;
        for (i = 0; i < parts.length; i++) {
          p = parts[i];
          var sway = Math.sin(p.ph + t * 0.6 * L.speed) * 0.012; // góc lắc (radian), dây dài lắc nhiều ở đầu dưới
          var ex = p.x + Math.sin(sway) * p.len, ey = Math.cos(sway) * p.len;
          ctx.globalAlpha = 0.22; ctx.strokeStyle = pal.particle;
          ctx.beginPath(); ctx.moveTo(p.x, 0); ctx.lineTo(ex, ey); ctx.stroke();
          for (var d = p.gap; d <= p.len; d += p.gap) {
            var k = d / p.len, bx = p.x + (ex - p.x) * k, by = ey * k;
            var sh = Math.pow(0.5 + 0.5 * Math.sin(t * 1.6 * L.speed - d * 0.02 + p.ph * 3), 8); // sóng loé sáng chạy dọc dây
            ctx.globalAlpha = 0.35 + 0.65 * sh;
            var s = 7 + 12 * sh + (d + p.gap > p.len ? 8 : 0); // hạt cuối dây to hơn
            ctx.drawImage(sprite, bx - s, by - s, s * 2, s * 2);
          }
        }
      },
    },
    // ánh đèn bokeh: những đốm sáng tròn, mờ, to nhỏ khác nhau trôi rất chậm — kiểu phông sân khấu tiệc cưới
    bokeh: {
      init: function () {
        var d = this.disc = document.createElement('canvas');
        d.width = d.height = 128;
        var g = d.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        gr.addColorStop(0, rgba(pal.particle, 0.55)); gr.addColorStop(0.72, rgba(pal.particle, 0.5)); gr.addColorStop(0.86, rgba(pal.particle, 0.75)); gr.addColorStop(1, rgba(pal.particle, 0));
        g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
        var n = Math.round(46 * L.density * AREA);
        for (var i = 0; i < n; i++) parts.push({ x: rnd(0, W), y: rnd(0, H), r: rnd(30, 150), a: rnd(0.05, 0.22), vx: rnd(-10, 10), vy: rnd(-16, -4), ph: rnd(0, 6.28), sp: rnd(0.3, 0.9) });
        parts.sort(function (p, q) { return q.r - p.r; }); // đốm to (xa, mờ) vẽ trước
      },
      draw: function (dt, t) {
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          p.x += p.vx * dt * L.speed; p.y += p.vy * dt * L.speed;
          if (p.y < -p.r) { p.y = H + p.r; p.x = rnd(0, W); }
          if (p.x < -p.r) p.x = W + p.r; if (p.x > W + p.r) p.x = -p.r;
          ctx.globalAlpha = p.a * (0.55 + 0.45 * Math.sin(p.ph + t * p.sp * L.speed));
          ctx.drawImage(this.disc, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
        }
      },
    },
    // pháo hoa: từng chùm nổ toả tròn rồi rơi dần, nền có sao lấp lánh thưa
    phaohoa: {
      init: function () {
        var n = Math.round(70 * L.density * AREA);
        for (var i = 0; i < n; i++) parts.push({ x: rnd(0, W), y: rnd(0, H * 0.8), r: rnd(0.6, 1.8), ph: rnd(0, 6.28), sp: rnd(0.6, 1.8) });
        this.next = 0.3;
      },
      burst: function () {
        // né vùng chữ ở giữa màn: nổ ở hai bên hoặc dải trên cùng
        var side = Math.random() < 0.5 ? rnd(0.08, 0.3) : rnd(0.7, 0.92);
        var cx = W * (Math.random() < 0.25 ? rnd(0.3, 0.7) : side), cy = rnd(H * 0.12, H * 0.42);
        var n = Math.round(rnd(70, 110)), v0 = rnd(380, 620) * Math.sqrt(AREA), ring = Math.random() < 0.35;
        for (var i = 0; i < n; i++) {
          var a = (i / n) * 6.283 + rnd(-0.05, 0.05), v = ring ? v0 * rnd(0.92, 1) : v0 * Math.sqrt(rnd(0.08, 1));
          extra.push({ x: cx, y: cy, px: cx, py: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: rnd(1.6, 2.4), s: rnd(8, 15) });
        }
        extra.push({ flash: 1, x: cx, y: cy, life: 0, max: 0.35, s: v0 * 0.55 }); // loé sáng lúc nổ
      },
      draw: function (dt, t) {
        var i, p;
        for (i = 0; i < parts.length; i++) {
          p = parts[i];
          ctx.globalAlpha = 0.2 + 0.5 * (0.5 + 0.5 * Math.sin(p.ph + t * p.sp * L.speed));
          ctx.drawImage(sprite, p.x - p.r * 3, p.y - p.r * 3, p.r * 6, p.r * 6);
        }
        this.next -= dt * L.speed * Math.max(0.4, L.density);
        if (this.next <= 0 && extra.length < 1200) { this.burst(); this.next = rnd(0.45, 1.1); }
        var k = dt * L.speed;
        for (i = extra.length - 1; i >= 0; i--) {
          p = extra[i];
          p.life += k;
          if (p.life >= p.max) { extra.splice(i, 1); continue; }
          var f = 1 - p.life / p.max, s;
          if (p.flash) { ctx.globalAlpha = f * 0.8; s = p.s * (0.4 + 0.6 * (1 - f)); ctx.drawImage(sprite, p.x - s, p.y - s, s * 2, s * 2); continue; }
          p.px = p.x; p.py = p.y;
          p.vx *= 1 - 1.4 * k; p.vy = p.vy * (1 - 1.4 * k) + 110 * k; // cản không khí + rơi
          p.x += p.vx * k; p.y += p.vy * k;
          var a = Math.min(1, f * 1.8) * (0.7 + 0.3 * Math.sin(t * 30 + i));
          // vệt đuôi
          ctx.globalAlpha = a * 0.55; ctx.strokeStyle = pal.particle; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - (p.x - p.px) * 5, p.y - (p.y - p.py) * 5); ctx.stroke();
          ctx.globalAlpha = a;
          s = p.s * (0.5 + 0.7 * f);
          ctx.drawImage(sprite, p.x - s, p.y - s, s * 2, s * 2);
        }
      },
    },
    // kim tuyến rơi: mảnh giấy ánh kim nhỏ xoay lật, loé sáng khi quay đúng mặt
    kimtuyen: {
      init: function () {
        var n = Math.round(150 * L.density * AREA);
        for (var i = 0; i < n; i++) parts.push(this.make(true));
      },
      make: function (any) {
        return { x: rnd(-40, W + 40), y: any ? rnd(-40, H) : rnd(-80, -20), w: rnd(6, 16), h: rnd(4, 10), rot: rnd(0, 6.28), vr: rnd(-2.5, 2.5), vy: rnd(60, 150), sw: rnd(10, 45), ph: rnd(0, 6.28), flip: rnd(0, 6.28), vf: rnd(2.5, 6) };
      },
      draw: function (dt, t) {
        ctx.fillStyle = pal.particle;
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          p.y += p.vy * dt * L.speed; p.rot += p.vr * dt * L.speed; p.flip += p.vf * dt * L.speed;
          if (p.y > H + 30) { parts[i] = this.make(false); continue; }
          var x = p.x + Math.sin(p.ph + t * 0.9 * L.speed) * p.sw, c = Math.cos(p.flip), face = Math.abs(c);
          ctx.save();
          ctx.translate(x, p.y); ctx.rotate(p.rot); ctx.scale(1, 0.15 + 0.85 * face);
          ctx.globalAlpha = 0.35 + 0.6 * face;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
          if (face > 0.97) { ctx.globalAlpha = 0.9; ctx.drawImage(sprite, x - 14, p.y - 14, 28, 28); } // loé sáng
        }
      },
    },
    // tim bay: trái tim to nhỏ bay lên, lắc nhẹ
    tim: {
      init: function () {
        var n = Math.round(46 * L.density * AREA);
        for (var i = 0; i < n; i++) parts.push(this.make(true));
      },
      make: function (any) {
        var s = rnd(14, 52);
        return { x: rnd(0, W), y: any ? rnd(0, H) : H + rnd(40, 140), s: s, vy: 30 + s * 1.6, sw: rnd(15, 50), ph: rnd(0, 6.28), a: rnd(0.22, 0.7), tilt: rnd(-0.3, 0.3) };
      },
      draw: function (dt, t) {
        ctx.fillStyle = pal.particle;
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          p.y -= p.vy * dt * L.speed;
          if (p.y < -70) { parts[i] = this.make(false); continue; }
          var x = p.x + Math.sin(p.ph + t * 0.7 * L.speed) * p.sw, s = p.s;
          ctx.save();
          ctx.translate(x, p.y); ctx.rotate(p.tilt + 0.12 * Math.sin(p.ph + t * 1.1 * L.speed));
          ctx.globalAlpha = p.a;
          ctx.beginPath();
          ctx.moveTo(0, s * 0.46);
          ctx.bezierCurveTo(-s * 0.58, -s * 0.02, -s * 0.42, -s * 0.66, 0, -s * 0.28);
          ctx.bezierCurveTo(s * 0.42, -s * 0.66, s * 0.58, -s * 0.02, 0, s * 0.46);
          ctx.fill();
          ctx.restore();
        }
      },
    },
    // hoa đăng: đèn trời thả bay lên chậm, đèn gần to và sáng, đèn xa nhỏ và mờ
    hoadang: {
      init: function () {
        var n = Math.round(26 * L.density * AREA);
        for (var i = 0; i < n; i++) parts.push(this.make(true));
        parts.sort(function (p, q) { return p.s - q.s; });
        var m = Math.round(60 * L.density * AREA);
        for (var j = 0; j < m; j++) extra.push({ x: rnd(0, W), y: rnd(0, H), r: rnd(0.6, 1.6), ph: rnd(0, 6.28) });
      },
      make: function (any) {
        var s = rnd(18, 62);
        return { x: rnd(0, W), y: any ? rnd(0, H) : H + rnd(60, 200), s: s, vy: 10 + s * 0.55, sw: rnd(10, 40), ph: rnd(0, 6.28) };
      },
      draw: function (dt, t) {
        var i, p;
        for (i = 0; i < extra.length; i++) {
          p = extra[i];
          ctx.globalAlpha = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin(p.ph + t * 1.2 * L.speed));
          ctx.drawImage(sprite, p.x - p.r * 3, p.y - p.r * 3, p.r * 6, p.r * 6);
        }
        for (i = 0; i < parts.length; i++) {
          p = parts[i];
          p.y -= p.vy * dt * L.speed;
          if (p.y < -p.s * 3) { var q = this.make(false); q.s = p.s; q.vy = p.vy; parts[i] = p = q; }
          var x = p.x + Math.sin(p.ph + t * 0.35 * L.speed) * p.sw, s = p.s, near = (s - 18) / 44;
          var fl = 0.85 + 0.15 * Math.sin(p.ph * 3 + t * 5); // ngọn lửa bập bùng
          ctx.globalAlpha = (0.25 + 0.3 * near) * fl;
          ctx.drawImage(sprite, x - s * 2.4, p.y - s * 2.1, s * 4.8, s * 4.8);
          ctx.globalAlpha = 0.5 + 0.45 * near;
          var gr = ctx.createLinearGradient(0, p.y - s, 0, p.y + s * 0.9);
          gr.addColorStop(0, rgba(pal.particle, 0.55)); gr.addColorStop(0.7, rgba(pal.particle, 0.95)); gr.addColorStop(1, '#ffffff');
          ctx.fillStyle = gr;
          ctx.beginPath(); // thân đèn: trên phình, dưới thắt
          ctx.moveTo(x - s * 0.42, p.y + s * 0.85);
          ctx.bezierCurveTo(x - s * 0.9, p.y + s * 0.1, x - s * 0.8, p.y - s, x, p.y - s);
          ctx.bezierCurveTo(x + s * 0.8, p.y - s, x + s * 0.9, p.y + s * 0.1, x + s * 0.42, p.y + s * 0.85);
          ctx.closePath(); ctx.fill();
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
      out.push('<div data-k="names" class="slide s-names">' + hy + (L.kicker ? '<p class="kicker">' + esc(L.kicker) + '</p>' : '') +
        '<p class="names glow" data-fit><span>' + gn + '</span><span class="amp">&amp;</span><span>' + bn + '</span></p></div>');
    }
    if (L.slides.date && C.date) {
      out.push('<div data-k="date" class="slide s-date"><p class="wd">' + esc(C.date.weekday) + '</p>' +
        '<p class="bigdate glow" data-fit>' + C.date.d + '<i>·</i>' + C.date.m + '<i>·</i>' + C.date.y + '</p>' +
        (C.time ? '<p class="time">Vào lúc ' + esc(C.time) + '</p>' : '') +
        (C.lunar ? '<p class="lunar">' + esc(C.lunar) + '</p>' : '') + '</div>');
    }
    // đếm ngược tới giờ lễ: chỉ hiện khi còn chưa tới giờ (qua giờ thì tự bỏ cảnh này)
    var target = C.at ? Date.parse(C.at) : NaN;
    if (L.slides.countdown && target > Date.now()) {
      out.push('<div data-k="countdown" class="slide s-count"><p class="kicker">' + esc(L.kicker || 'Lễ Thành Hôn') + ' bắt đầu sau</p>' +
        '<p class="cd glow" data-fit></p><p class="cd-sub">' + (C.time ? 'Vào lúc ' + esc(C.time) : '') + (C.date ? ' · ' + C.date.d + '/' + C.date.m + '/' + C.date.y : '') + '</p></div>');
    }
    var fam = function (p, lb) {
      if (!p.father && !p.mother) return '';
      return '<div class="fam"><p class="lb">' + lb + '</p>' + (p.father ? '<p class="pp">' + esc(p.father) + '</p>' : '') +
        (p.mother ? '<p class="pp">' + esc(p.mother) + '</p>' : '') + (p.address ? '<p class="ad">' + esc(p.address) + '</p>' : '') + '</div>';
    };
    var fams = fam(g, 'Nhà trai') + fam(b, 'Nhà gái');
    if (L.slides.parents && fams) {
      out.push('<div data-k="parents" class="slide s-parents"><p class="title glow">Hân hạnh đón tiếp</p><div class="fams" data-fit>' + fams + '</div></div>');
    }
    if (L.slides.photo && C.photo) {
      out.push('<div data-k="photo" class="slide s-photo"><div class="photo" style="background-image:url(\'' + esc(C.photo) + '\')"></div>' +
        '<div class="pn">' + (L.kicker ? '<p class="kicker" style="margin-top:36px">' + esc(L.kicker) + '</p>' : '') +
        '<p class="photo-names glow" data-fit><span>' + gn + '</span> <span class="amp">&amp;</span> <span>' + bn + '</span></p></div></div>');
    }
    if (L.slides.message && L.message) {
      out.push('<div data-k="msg" class="slide s-msg"><p class="msg">' + esc(L.message) + '</p><p class="sign glow" data-fit>' + gn + ' &amp; ' + bn + '</p></div>');
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

  // cập nhật số đếm ngược mỗi giây; tới giờ thì dựng lại các cảnh (cảnh đếm ngược tự biến mất)
  var cdTarget = function () { return C.at ? Date.parse(C.at) : NaN; };
  setInterval(function () {
    var el = slidesEl.querySelector('.cd'); if (!el) return;
    var left = Math.round((cdTarget() - Date.now()) / 1000);
    if (!(left > 0)) { var k = cur; buildSlides(); show(Math.min(k, slides.length - 1)); return; }
    var dd = Math.floor(left / 86400), hh = Math.floor(left % 86400 / 3600), mm = Math.floor(left % 3600 / 60), ss = left % 60;
    var two = function (n) { return (n < 10 ? '0' : '') + n; };
    el.innerHTML = dd > 0 ? '<b>' + dd + '</b><small>ngày</small><b>' + two(hh) + '</b><small>giờ</small><b>' + two(mm) + '</b><small>phút</small>'
      : '<b>' + two(hh) + '</b><i>:</i><b>' + two(mm) + '</b><i>:</i><b>' + two(ss) + '</b>';
  }, 1000);

  function show(i) {
    if (!slides.length) return;
    cur = (i + slides.length) % slides.length;
    slides.forEach(function (s, j) { s.classList.toggle('on', j === cur); });
    tell();
  }
  // khung xem trước trong trình sửa: báo cảnh đang chiếu để thanh chuyển cảnh bên ngoài sáng đúng ô, chạy thanh thời gian
  function tell() {
    if (window.parent === window) return;
    try { window.parent.postMessage({ type: 'led-scene', index: cur, keys: slides.map(function (s) { return s.getAttribute('data-k') || ''; }), seconds: L.seconds, paused: paused }, location.origin); } catch (e) { /* bỏ qua */ }
  }
  // đồng hồ trình chiếu: thời gian đã chạy trong cảnh hiện tại (ms) — dừng thì đứng yên; đủ L.seconds thì sang cảnh sau.
  // Vị trí cả vòng = cảnh × số giây mỗi cảnh + phần đã chạy → thanh tua kéo được như video.
  var elapsed = 0, lastTick = performance.now();
  function restartTimer() { elapsed = 0; lastTick = performance.now(); }
  function total() { return Math.max(1, slides.length) * L.seconds; }
  function position() { return cur * L.seconds + elapsed / 1000; }
  function seekTo(t) {
    if (!slides.length) return;
    t = Math.max(0, Math.min(total() - 0.05, t));
    var i = Math.floor(t / L.seconds);
    if (i !== cur) show(i);
    elapsed = (t - i * L.seconds) * 1000; lastTick = performance.now();
  }
  timer = setInterval(function () {
    var now = performance.now();
    if (!paused) {
      elapsed += now - lastTick;
      if (elapsed >= L.seconds * 1000) { elapsed = 0; if (slides.length > 1) show(cur + 1); }
    }
    lastTick = now;
  }, 100);

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
    idle = setTimeout(function () { if (drag) return wake(); document.body.classList.remove('active'); }, 3000);
  }
  function fullscreen() {
    var d = document.documentElement;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (d.requestFullscreen) d.requestFullscreen().catch(function () {});
  }
  var pauseBtn = document.querySelector('[data-c=pause]');
  function togglePause() { paused = !paused; pauseBtn.textContent = paused ? '▶︎' : '❚❚'; pauseBtn.setAttribute('aria-label', paused ? 'Phát' : 'Tạm dừng'); lastTick = performance.now(); tell(); }
  document.getElementById('ctl').addEventListener('click', function (e) {
    if (e.target.getAttribute('data-c') === 'pause') togglePause();
  });
  // thanh tua: kéo để tới đúng chỗ (cảnh + giây trong cảnh), thời gian "đã chạy / cả vòng"
  var sk = document.getElementById('seek'), tm = document.getElementById('tm'), drag = false;
  var fmt = function (t) { return Math.floor(t / 60) + ':' + ('0' + Math.floor(t % 60)).slice(-2); };
  sk.addEventListener('input', function () { drag = true; seekTo(sk.value / 1000 * total()); wake(); });
  sk.addEventListener('change', function () { drag = false; });
  ['pointerup', 'pointercancel', 'touchend'].forEach(function (ev) { sk.addEventListener(ev, function () { drag = false; }); });
  if (!C.preview) setInterval(function () {
    var D = total(), t = Math.min(position(), D);
    if (!drag) sk.value = Math.round(t / D * 1000);
    tm.textContent = fmt(t) + ' / ' + fmt(D);
  }, 200);
  ['mousemove', 'pointerdown', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, wake, { passive: true }); });
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
      if (e.data.card) { C.groom = e.data.card.groom; C.bride = e.data.card.bride; if (e.data.card.photo !== undefined) C.photo = e.data.card.photo; }
      apply(e.data.led);
    }
    if (e.data.type === 'led-goto') { show(e.data.index); restartTimer(); }
    if (e.data.type === 'led-pause' && !!e.data.paused !== paused) togglePause();
  });

  apply(L);
  show(0);
  if (!C.preview) wake();
  keepAwake();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
  requestAnimationFrame(frame);
})();
