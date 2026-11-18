// Trình chiếu màn hình LED: nền hiệu ứng canvas + các cảnh chữ chuyển lần lượt.
(function () {
  'use strict';
  var C = window.__LED;
  // ?still=1: chụp ảnh đại diện mẫu (tools/previews.js) — cảnh hiện ngay, không chờ hiệu ứng hiện dần
  if (/[?&]still=1(&|$)/.test(location.search)) document.documentElement.classList.add('still');
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
    // Trời sao "điện ảnh": tinh vân mờ trôi chậm, sao xa lấp lánh, tia sáng rọi từ trên, sàn kim tuyến phối cảnh
    // (hạt dày + sáng dần về đường chân trời, xoay chậm), bụi sáng gần trôi lên và sao băng.
    // Các lớp mềm (tinh vân, tia sáng, quầng chân trời) vẽ sẵn một lần ở độ phân giải thấp rồi phóng to — mỗi khung hình chỉ dán ảnh.
    sao: {
      init: function () {
        var self = this, A = AREA * L.density, i;
        var soft = function (w, h, fn) { var c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; };
        // tinh vân: vài đám sáng màu hạt + màu nhấn, rất nhạt
        self.neb = soft(480, 270, function (g, w, h) {
          var blobs = [[0.22, 0.28, 0.42, pal.particle, 0.16], [0.78, 0.22, 0.38, pal.accent, 0.13], [0.55, 0.45, 0.5, pal.particle, 0.1], [0.12, 0.62, 0.3, pal.accent, 0.08], [0.9, 0.55, 0.32, pal.particle, 0.08]];
          blobs.forEach(function (b) { var gr = g.createRadialGradient(b[0] * w, b[1] * h, 0, b[0] * w, b[1] * h, b[2] * w); gr.addColorStop(0, rgba(b[3], b[4])); gr.addColorStop(1, rgba(b[3], 0)); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
        });
        // tia sáng rọi dọc (một dải mềm, dùng lại nhiều lần với độ rộng khác nhau)
        self.beam = soft(64, 256, function (g, w, h) {
          var gx = g.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, rgba(pal.particle, 0)); gx.addColorStop(0.5, rgba(pal.particle, 1)); gx.addColorStop(1, rgba(pal.particle, 0));
          g.fillStyle = gx; g.fillRect(0, 0, w, h);
          g.globalCompositeOperation = 'destination-in';
          var gy = g.createLinearGradient(0, 0, 0, h); gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(0.35, 'rgba(0,0,0,.9)'); gy.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = gy; g.fillRect(0, 0, w, h);
        });
        // quầng sáng đường chân trời của sàn kim tuyến
        self.horizon = soft(512, 128, function (g, w, h) {
          var gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, rgba(pal.particle, 0.55)); gr.addColorStop(0.35, rgba(pal.particle, 0.16)); gr.addColorStop(1, rgba(pal.particle, 0));
          g.setTransform(1, 0, 0, h / w, 0, 0); g.fillStyle = gr; g.fillRect(0, 0, w, w); // vòng tròn ép dẹt thành elip
        });
        self.beams = [];
        for (i = 0; i < 5; i++) self.beams.push({ x: rnd(0.25, 0.75), w: rnd(0.04, 0.12), a: rnd(0.07, 0.17), ph: rnd(0, 6.28), sp: rnd(0.15, 0.4) });
        for (i = 0; i < Math.round(240 * A); i++) parts.push({ k: 0, x: rnd(0, W), y: rnd(0, H * 0.78), r: rnd(0.5, 2), ph: rnd(0, 6.28), sp: rnd(0.6, 2) });
        // sàn kim tuyến: hạt trên mặt phẳng nằm ngang, chiếu phối cảnh (u: ngang, d: độ sâu 0 = sát mắt, 1 = chân trời)
        for (i = 0; i < Math.round(1700 * A); i++) parts.push({ k: 1, u: rnd(-1, 1), d: Math.pow(Math.random(), 0.45), r: rnd(0.5, 1.8), ph: rnd(0, 6.28), sp: rnd(1, 3.5) });
        for (i = 0; i < Math.round(36 * A); i++) parts.push({ k: 2, x: rnd(0, W), y: rnd(0, H), r: rnd(6, 16), v: rnd(8, 22), ph: rnd(0, 6.28) });
      },
      draw: function (dt, t) {
        var sp = L.speed, i, p, s, a;
        var hz = H * 0.66; // đường chân trời
        // tinh vân trôi rất chậm
        ctx.globalAlpha = 1;
        var nx = Math.sin(t * 0.02 * sp) * W * 0.03, ny = Math.cos(t * 0.017 * sp) * H * 0.02;
        ctx.drawImage(this.neb, -W * 0.05 + nx, -H * 0.05 + ny, W * 1.1, H * 1.1);
        // tia sáng rọi
        for (i = 0; i < this.beams.length; i++) {
          var b = this.beams[i], bx = (b.x + 0.03 * Math.sin(t * b.sp * 0.3 * sp + b.ph)) * W, bw = b.w * W;
          ctx.globalAlpha = b.a * (0.6 + 0.4 * Math.sin(t * b.sp * sp + b.ph));
          ctx.drawImage(this.beam, bx - bw / 2, -H * 0.05, bw, hz + H * 0.08);
        }
        // quầng chân trời
        ctx.globalAlpha = 1;
        ctx.drawImage(this.horizon, -W * 0.05, hz - H * 0.16, W * 1.1, H * 0.32);
        var rot = t * 0.03 * sp;
        for (i = 0; i < parts.length; i++) {
          p = parts[i];
          if (p.k === 0) { // sao xa
            a = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(p.ph + t * p.sp * sp));
            ctx.globalAlpha = a; s = p.r * 6; ctx.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s);
          } else if (p.k === 1) { // sàn kim tuyến (xoay chậm quanh tâm sàn)
            var u = p.u * Math.cos(rot) - (p.d - 0.5) * 2 * Math.sin(rot) * 0.4, d = p.d;
            var z = 0.12 + d * 0.88;                         // xa dần về chân trời
            var x = W / 2 + u * W * 1.4 / (0.6 + z * 2.2), y = hz + (H - hz) * Math.pow(1 - d, 1.6);
            if (x < -10 || x > W + 10) continue;
            var near = 1 - d, glint = Math.pow(0.5 + 0.5 * Math.sin(p.ph + t * p.sp * sp), 6);
            ctx.globalAlpha = Math.min(1, (0.3 + 0.7 * glint) * (0.45 + 0.55 * (1 - Math.abs(u) * 0.5)) * (0.55 + 0.45 * d) * 1.15);
            s = p.r * (2.6 + near * 6); ctx.drawImage(sprite, x - s / 2, y - s / 2, s, s);
          } else { // bụi sáng gần trôi lên, mờ (như ngoài tiêu cự)
            p.y -= p.v * dt * sp; p.x += Math.sin(t * 0.4 + p.ph) * 6 * dt;
            if (p.y < -30) { p.y = H + 30; p.x = rnd(0, W); }
            ctx.globalAlpha = 0.1 + 0.12 * (0.5 + 0.5 * Math.sin(t * 0.8 + p.ph)); s = p.r * 6;
            ctx.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s);
          }
        }
        // sao băng
        if (Math.random() < dt * 0.4 * sp * Math.max(0.5, L.density)) {
          var ang = rnd(0.35, 0.6);
          extra.push({ x: rnd(W * 0.1, W * 0.95), y: rnd(-40, H * 0.3), vx: -Math.cos(ang), vy: Math.sin(ang), v: rnd(900, 1500), life: 0, max: rnd(0.8, 1.4), len: rnd(200, 360) });
        }
        ctx.lineCap = 'round';
        for (var j = extra.length - 1; j >= 0; j--) {
          var m = extra[j];
          m.life += dt; m.x += m.vx * m.v * dt * sp; m.y += m.vy * m.v * dt * sp;
          var k = 1 - m.life / m.max;
          if (k <= 0 || m.y > hz) { extra.splice(j, 1); continue; }
          var tx = m.x - m.vx * m.len, ty = m.y - m.vy * m.len, gr = ctx.createLinearGradient(m.x, m.y, tx, ty);
          gr.addColorStop(0, rgba(pal.particle, 0.95 * k)); gr.addColorStop(1, rgba(pal.particle, 0));
          ctx.globalAlpha = 1; ctx.strokeStyle = gr; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke();
          ctx.globalAlpha = k; ctx.drawImage(sprite, m.x - 14, m.y - 14, 28, 28);
        }
      },
    },
    // Đêm kim tuyến bạc: nền đen, một "sàn" kim tuyến bạc hình đĩa nhìn nghiêng ở dưới (sáng rực ở tâm, xoay chậm), một dải kim tuyến
    // như trần sân khấu ở trên, khoảng tối ở giữa cho chữ, vài cột sáng mảnh nối trần với sàn, bụi sao rải khắp và sao băng mảnh.
    // Hạt kim tuyến vẽ sẵn một lần vào vài tấm ảnh; mỗi khung hình chỉ dán các tấm đó (xoay + đổi độ sáng lệch pha → lấp lánh),
    // nên hàng chục nghìn hạt mà máy yếu vẫn chạy mượt.
    dembac: {
      init: function () {
        var self = this, dens = Math.max(0.3, L.density), i, j;
        GLFX.mode = self.mode || 'dembac';
        self.useGl = GLFX.start(); // có WebGL thì kim tuyến + thác + vòng sóng vẽ bằng card đồ hoạ; canvas 2D chỉ còn cột sáng, quầng sáng, sao băng
        var port = H > W, TW = port ? 900 : 1600, TH = Math.round(TW * H / W);
        var top = TH * (port ? 0.15 : 0.2), floor = TH * (port ? 0.85 : 0.8);
        self.top = top / TH; self.floor = floor / TH;
        var mk = function (w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
        // 4 tấm kim tuyến phủ cả màn, hạt đã chiếu phối cảnh sẵn (tròn, gần thì to); mỗi khung hình chỉ dán 4 tấm với độ sáng lệch pha
        self.layers = [];
        for (i = 0; i < (self.useGl ? 0 : 4); i++) {
          var c = mk(TW, TH), g = c.getContext('2d');
          var dot = function (x, y, r, a) { g.globalAlpha = a; g.drawImage(sprite, x - r, y - r, r * 2, r * 2); };
          // đĩa nhìn nghiêng: tâm (cx, cy), bán kính rx / ry; hạt dày ở tâm; near = nửa gần mắt (to và sáng hơn)
          var plate = function (cy, rx, ry, n, pw, flip) {
            for (var q = 0; q < n; q++) {
              var rr = Math.pow(Math.random(), pw), an = Math.random() * 6.2832, k = 1 - rr;
              var sy = Math.sin(an) * (flip ? -1 : 1), near = 0.5 + 0.5 * sy;          // 1 = sát mắt
              var glint = Math.random() < 0.035;
              dot(TW / 2 + Math.cos(an) * rr * rx, cy + Math.sin(an) * rr * ry,
                (glint ? rnd(3, 5) : rnd(0.9, 2)) * (0.65 + 0.7 * near * rr + 0.3 * k),
                Math.min(1, (0.45 + 0.55 * Math.random()) * (0.4 + 0.9 * k) + (glint ? 0.35 : 0)));
            }
          };
          plate(floor, TW * 0.62, TH * 0.21, Math.round(5200 * dens), 1.35, false);  // sàn
          plate(top, TW * 0.8, TH * 0.14, Math.round(4200 * dens), 1.05, true);     // trần
          for (j = 0; j < Math.round(1500 * dens); j++) { var yy = Math.pow(Math.random(), 1.4); dot(rnd(0, TW), top * (1 - yy * 1.25), Math.random() < 0.05 ? rnd(2, 3.2) : rnd(0.6, 1.4), rnd(0.25, 0.9) * (1 - yy * 0.4)); } // kim tuyến phía trên trần
          for (j = 0; j < Math.round(320 * dens); j++) dot(rnd(0, TW), rnd(0, TH), Math.random() < 0.06 ? rnd(1.8, 2.8) : rnd(0.5, 1.1), rnd(0.2, 0.7)); // bụi sao rải khắp
          self.layers.push({ c: c, ph: i * 1.57, sp: rnd(0.9, 1.5), dx: (i % 2 ? -1 : 1) * rnd(3, 7) });
        }
        // quầng sáng tâm sàn + cột sáng
        self.core = mk(256, 256);
        var gc = self.core.getContext('2d'), gr = gc.createRadialGradient(128, 128, 0, 128, 128, 128);
        gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.16, rgba(pal.particle, 0.42)); gr.addColorStop(0.5, rgba(pal.particle, 0.1)); gr.addColorStop(1, rgba(pal.particle, 0));
        gc.fillStyle = gr; gc.fillRect(0, 0, 256, 256);
        self.beam = mk(48, 256);
        var gb = self.beam.getContext('2d'), gx = gb.createLinearGradient(0, 0, 48, 0);
        gx.addColorStop(0, rgba(pal.particle, 0)); gx.addColorStop(0.5, rgba(pal.particle, 1)); gx.addColorStop(1, rgba(pal.particle, 0));
        gb.fillStyle = gx; gb.fillRect(0, 0, 48, 256);
        gb.globalCompositeOperation = 'destination-in';
        var gy = gb.createLinearGradient(0, 0, 0, 256); gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(0.3, 'rgba(0,0,0,.55)'); gy.addColorStop(0.55, 'rgba(0,0,0,.22)'); gy.addColorStop(0.75, 'rgba(0,0,0,.5)'); gy.addColorStop(1, 'rgba(0,0,0,0)');
        gb.fillStyle = gy; gb.fillRect(0, 0, 48, 256);
        self.beams = [];
        for (i = 0; i < 10; i++) self.beams.push({ x: rnd(0.06, 0.94), w: rnd(0.008, 0.024), a: rnd(0.05, 0.13), ph: rnd(0, 6.28), sp: rnd(0.2, 0.6) });
        self.beams.push({ x: rnd(0.63, 0.72), w: 0.02, a: 0.34, ph: 0, sp: 0.25 }); // một cột sáng rõ hơn
        // thác kim tuyến: các dòng đổ từ dải trên xuống sàn (dòng dày ở hai bên, thưa ở giữa chỗ có chữ), hạt rơi nhanh dần,
        // chạm sàn thì loé sáng + bắn vài hạt nhỏ
        self.streams = [];
        for (i = 0; i < 16; i++) {
          var sx = i < 6 ? rnd(0.04, 0.3) : i < 12 ? rnd(0.7, 0.96) : rnd(0.32, 0.68);
          self.streams.push({ x: sx, w: rnd(0.006, 0.022), rate: (i < 12 ? rnd(55, 95) : rnd(14, 26)) * dens, acc: 0 });
        }
        self.drops = []; self.sparks = [];
      },
      fall: function (dt, top, floor) {
        var sp = L.speed, k = W / 1920, i, d, g = 900 * (H / 1080) * sp;
        if (this.drops.length < 3200) for (i = 0; i < this.streams.length; i++) {
          var st = this.streams[i];
          st.acc += st.rate * dt * sp;
          while (st.acc >= 1) {
            st.acc -= 1;
            this.drops.push({ x: (st.x + (Math.random() + Math.random() - 1) * st.w) * W, y: top + rnd(-H * 0.04, H * 0.03), v: rnd(20, 90) * (H / 1080) * sp, r: Math.random() < 0.08 ? rnd(3, 4.5) : rnd(1.3, 2.4), a: rnd(0.6, 1), ph: rnd(0, 6.28) });
          }
        }
        ctx.globalCompositeOperation = 'lighter';
        for (i = this.drops.length - 1; i >= 0; i--) {
          d = this.drops[i];
          d.v += g * dt; d.y += d.v * dt; d.x += Math.sin(d.y * 0.01 + d.ph) * 4 * dt;
          if (d.y >= floor + rnd(-H * 0.05, H * 0.04)) { // chạm sàn: loé + bắn tia
            if (Math.random() < 0.35) for (var n = 0; n < 3; n++) this.sparks.push({ x: d.x, y: d.y, vx: rnd(-120, 120) * k, vy: -rnd(60, 220) * k, life: 0, max: rnd(0.35, 0.7) });
            this.sparks.push({ x: d.x, y: d.y, vx: 0, vy: 0, life: 0, max: 0.25, flash: 1 });
            this.drops.splice(i, 1); continue;
          }
          // mờ đi ở giữa màn (chỗ có chữ), rõ ở gần trần và gần sàn
          var p = (d.y - top) / (floor - top), vis = 0.35 + 0.65 * Math.max(0, Math.abs(p - 0.5) * 2 - 0.15) / 0.85;
          var len = Math.min(26, d.v * 0.018) * k + d.r * 2;                 // vệt dài theo tốc độ rơi
          ctx.globalAlpha = d.a * vis;
          ctx.drawImage(sprite, d.x - d.r * 2, d.y - len, d.r * 4, len + d.r * 2);
        }
        for (i = this.sparks.length - 1; i >= 0; i--) {
          var s = this.sparks[i];
          s.life += dt;
          if (s.life >= s.max) { this.sparks.splice(i, 1); continue; }
          var q = 1 - s.life / s.max;
          if (s.flash) { ctx.globalAlpha = 0.7 * q; ctx.drawImage(sprite, s.x - 9 * k, s.y - 4 * k, 18 * k, 8 * k); continue; }
          s.vy += g * 0.6 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
          ctx.globalAlpha = 0.8 * q; ctx.drawImage(sprite, s.x - 2, s.y - 2, 4, 4);
        }
        ctx.globalCompositeOperation = 'source-over';
      },
      draw: function (dt, t) {
        var sp = L.speed, i, top = this.top * H, floor = this.floor * H;
        // cột sáng nối trần với sàn (vẽ trước, nằm dưới kim tuyến)
        for (i = 0; i < this.beams.length; i++) {
          var b = this.beams[i], bw = b.w * W;
          ctx.globalAlpha = b.a * (this.useGl ? 0.55 : 1) * (0.55 + 0.45 * Math.sin(t * b.sp * sp + b.ph));
          ctx.drawImage(this.beam, b.x * W - bw * 1.5, top - H * 0.1, bw * 3, floor - top + H * 0.2);
        }
        // quầng sáng tâm sàn (đập rất nhẹ) và vệt sáng mờ dọc dải trần
        var pul = 0.85 + 0.15 * Math.sin(t * 0.9 * sp);
        ctx.globalAlpha = (this.mode === 'saoroi' && this.useGl ? 0.16 + 0.34 * GLFX.glow : this.useGl ? 0.16 : 0.9) * pul; // bản WebGL: chỉ còn một quầng rất nhạt, không thành cụm trắng
        ctx.drawImage(this.core, W / 2 - W * 0.45, floor - H * 0.1, W * 0.9, H * 0.2);
        if (!this.useGl) { ctx.globalAlpha = 0.22; ctx.drawImage(this.core, W / 2 - W * 0.55, top - H * 0.045, W * 1.1, H * 0.09); }
        // kim tuyến: 4 tấm đổi độ sáng lệch pha + trôi ngang rất chậm ngược chiều nhau → lấp lánh, có chiều sâu
        if (this.useGl && GLFX.gl) GLFX.draw(dt);
        else for (i = 0; i < this.layers.length; i++) {
          var l = this.layers[i], ox = Math.sin(t * 0.05 * sp + l.ph) * l.dx * (W / 1600);
          ctx.globalAlpha = 0.45 + 0.55 * Math.pow(0.5 + 0.5 * Math.sin(t * l.sp * sp + l.ph), 1.5);
          ctx.drawImage(l.c, ox - 8, 0, W + 16, H);
        }
        if (!(this.useGl && GLFX.gl)) this.fall(dt, top, floor);
        // sao băng mảnh, thưa
        if (Math.random() < dt * 0.22 * sp) {
          var ang = rnd(0.3, 0.55);
          extra.push({ x: rnd(W * 0.2, W), y: rnd(-30, H * 0.12), vx: -Math.cos(ang), vy: Math.sin(ang), v: rnd(1000, 1600), life: 0, max: rnd(0.6, 1), len: rnd(180, 300) });
        }
        ctx.lineCap = 'round';
        for (var j = extra.length - 1; j >= 0; j--) {
          var m = extra[j];
          m.life += dt; m.x += m.vx * m.v * dt * sp; m.y += m.vy * m.v * dt * sp;
          var k = 1 - m.life / m.max;
          if (k <= 0) { extra.splice(j, 1); continue; }
          var tx = m.x - m.vx * m.len, ty = m.y - m.vy * m.len, gs = ctx.createLinearGradient(m.x, m.y, tx, ty);
          gs.addColorStop(0, rgba(pal.particle, 0.9 * k)); gs.addColorStop(1, rgba(pal.particle, 0));
          ctx.globalAlpha = 1; ctx.strokeStyle = gs; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke();
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

  // ---------------- Đêm kim tuyến bạc bằng WebGL ----------------
  // Sàn + trần kim tuyến là hai đĩa hạt trong không gian 3 chiều (máy quay nhìn ngang), xoay chậm; thác kim tuyến đổ từ trần xuống sàn;
  // thỉnh thoảng một giọt sáng rơi "tõm" xuống sàn → loé sáng, bắn vài hạt và một vòng sóng lan ra làm kim tuyến nhấp nhô + sáng lên.
  // Mọi hạt chuyển động trong shader (card đồ hoạ tính) nên hàng chục nghìn hạt vẫn 60 khung hình/giây. Máy không có WebGL → bản canvas 2D.
  var GLFX = {
    gl: null, cv: null, time: 0, rip: [], heroes: [], sparks: [], nextDrop: 0,
    VS_PTS: 'attribute vec4 aP;uniform float uT,uAsp,uPx;uniform vec3 uRip[8];uniform vec4 uRp;uniform vec3 uCen;uniform vec2 uSt;varying float vA;' +
      'void main(){float seed=aP.z;float tw=pow(0.5+0.5*sin(uT*(1.2+seed*3.7)+seed*61.0),3.0);' +
      'if(aP.w>1.5){gl_Position=vec4(aP.xy,0.0,1.0);float big=step(0.965,fract(seed*29.0));gl_PointSize=uPx*(1.3+2.2*fract(seed*7.3)+big*3.5);vA=(0.18+0.82*tw)*(0.55+0.45*fract(seed*3.1)+big*0.5);return;}' +
      'float fl=aP.w<0.5?1.0:0.0;float ang=aP.y+uT*(fl>0.5?0.03:-0.02)*(1.0+0.7/(0.5+aP.x));' +
      'float thick=(fract(seed*91.7)-0.5)*(0.05+0.09*aP.x);vec3 p=vec3(cos(ang)*aP.x,(fl>0.5?-0.95:0.95)+thick,sin(ang)*aP.x);float lift=0.0;' +
      'if(fl>0.5){for(int i=0;i<8;i++){float age=uT-uRip[i].z;if(age>0.0&&age<6.0){float d=distance(p.xz,uRip[i].xy);' +
      'float w=exp(-pow((d-age*uRp.x)/uRp.y,2.0))*exp(-age*uRp.z);float w2=exp(-pow((d-age*uRp.x+uRp.y*2.7)/(uRp.y*0.8),2.0))*exp(-age*uRp.z*1.6)*0.55;lift+=(w+w2)*uRp.w;}}}' +
      'p.y+=lift*0.065;float zc=3.2-p.z;float f=2.1445;gl_Position=vec4(p.x*f/uAsp*zc/zc,p.y*f,0.0,zc);gl_Position.x=p.x*f/uAsp;' +
      'float sz=uPx*(2.4+5.0*fract(seed*13.7)*fract(seed*5.1))*2.6/zc;gl_PointSize=max(1.0,sz*uSt.x)*(1.0+lift*1.0);' +
      'float far=clamp(1.3-zc*0.09,0.5,1.0);vA=((0.5+1.1*tw)*(1.15+0.35*exp(-aP.x*0.8)+fl*(uCen.x+uCen.y)*exp(-aP.x*uCen.z))*(fl>0.5?1.0:0.8)+lift*1.7)*far*smoothstep(0.15,0.7,zc)*(1.0-smoothstep(1.7,3.0,aP.x)*0.92)*uSt.y;}',
    VS_DROP: 'attribute vec4 aD;attribute float aTail;uniform float uT,uAsp,uPx;varying float vA;' +
      'void main(){float f=fract(uT*aD.w+aD.z);float ft=max(f-0.01-0.028*f,0.0);float ff=aTail>0.5?ft:f;' +
      'float y0=0.95+(fract(aD.z*53.0)-0.5)*0.5;vec3 p=vec3(aD.x,y0-ff*ff*(y0+0.95),aD.y);float zc=3.2-p.z;float k=2.1445;gl_Position=vec4(p.x*k/uAsp,p.y*k,0.0,zc);' +
      'gl_PointSize=max(1.0,uPx*2.6*2.3/zc);float mid=0.4+0.6*abs(f*f-0.5)*2.0;' +
      'vA=(aTail>0.5?0.0:1.0)*smoothstep(0.0,0.3,f)*(1.0-smoothstep(0.9,1.0,f))*mid*(0.1+0.3*fract(aD.z*17.0))*clamp(1.3-zc*0.12,0.3,1.0);}',
    VS_DYN: 'attribute vec3 aPos;attribute vec2 aSA;uniform float uAsp,uPx;varying float vA;' +
      'void main(){float zc=3.2-aPos.z;float k=2.1445;gl_Position=vec4(aPos.x*k/uAsp,aPos.y*k,0.0,zc);gl_PointSize=max(1.0,aSA.x*uPx*2.3/zc);vA=aSA.y;}',
    FS: 'precision mediump float;varying float vA;uniform vec3 uCol;uniform float uPoint;' +
      'void main(){float a=1.0;if(uPoint>0.5){float d=length(gl_PointCoord-0.5);a=smoothstep(0.5,0.0,d);a*=a;}float v=a*vA;gl_FragColor=vec4(uCol*v,v);}',
    prog: function (vs, fs) {
      var gl = this.gl, mk = function (t, src) { var sh = gl.createShader(t); gl.shaderSource(sh, src); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
      var p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      return p;
    },
    start: function () {
      this.stop();
      try {
        var cv = document.createElement('canvas'); cv.id = 'fxgl';
        var gl = cv.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
        if (!gl) return false;
        this.gl = gl; this.cv = cv;
        var dens = Math.max(0.3, L.density), i, a = [];
        // sàn + trần: một phần hạt rải đều cả đĩa, một phần dồn về tâm (tâm sáng rực)
        var disc = function (n, kind, R, pw) { for (var q = 0; q < n; q++) { var u = Math.random(); a.push(R * Math.pow(u, pw || 0.62), Math.random() * 6.2832, Math.random(), kind); } };
        if (this.mode === 'saoroi') { disc(Math.round(15000 * dens), 0, 2.0, 1.2); disc(Math.round(8000 * dens), 0, 3.0); } // Sao rơi: sàn là một đĩa kim tuyến gọn, dày ở tâm
        else disc(Math.round(34000 * dens), 0, 3.0);
        disc(Math.round((this.mode === 'saoroi' ? 16000 : 24000) * dens), 1, 3.0);
        for (i = 0; i < Math.round(2600 * dens); i++) a.push(rnd(-1, 1), rnd(-1, 1), Math.random(), 2); // sao rải khắp trời
        for (i = 0; i < Math.round(2600 * dens); i++) { // dải ngân hà: sao dồn quanh một đường chéo qua nửa trên màn
          var mx = rnd(-1.1, 1.1), my = 0.5 + mx * 0.22 + (Math.random() + Math.random() + Math.random() - 1.5) * 0.3;
          a.push(mx, my, Math.random(), 2);
        }
        this.nPts = a.length / 4;
        this.bPts = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.bPts); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(a), gl.STATIC_DRAW);
        // thác: các dòng đổ quanh rìa + mưa kim tuyến thưa khắp sàn; mỗi hạt = một đoạn thẳng (đầu sáng, đuôi tắt)
        var d = [], streams = [];
        for (i = 0; i < 22; i++) { var an = rnd(0, 6.2832), rr = rnd(1.1, 2.7); streams.push([Math.cos(an) * rr, Math.sin(an) * rr, rnd(0.08, 0.2)]); }
        var nD = Math.round(4200 * dens);
        for (i = 0; i < nD; i++) {
          var x, z;
          if (Math.random() < 0.75) { var st = streams[i % streams.length]; x = st[0] + (Math.random() + Math.random() - 1) * st[2]; z = st[1] + (Math.random() + Math.random() - 1) * st[2]; }
          else { var a2 = rnd(0, 6.2832), r2 = 2.8 * Math.sqrt(Math.random()); x = Math.cos(a2) * r2; z = Math.sin(a2) * r2; }
          var ph = Math.random(), spd = rnd(0.22, 0.42);
          d.push(x, z, ph, spd, 0, x, z, ph, spd, 1);
        }
        this.nDrop = nD * 2;
        this.bDrop = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.bDrop); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(d), gl.STATIC_DRAW);
        this.bDyn = gl.createBuffer(); this.dyn = new Float32Array(5 * 400);
        this.pPts = this.prog(this.VS_PTS, this.FS); this.pDrop = this.prog(this.VS_DROP, this.FS); this.pDyn = this.prog(this.VS_DYN, this.FS);
        gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
        this.rip = []; for (i = 0; i < 8; i++) this.rip.push([0, 0, -99]);
        this.ripI = 0; this.heroes = []; this.sparks = []; this.time = 0; this.nextDrop = 0.6; this.star = null; this.nextStar = 1.2; this.glowT = -99; this.glow = 0;
        // ?dbg=<0..1>: sao đang rơi tới phần đó của quãng đường; ?dbg=1.x: x giây sau khi sao chạm sàn (để chụp kiểm tra mẫu Sao rơi)
        var dbg = /[?&]dbg=([\d.]+)/.exec(location.search);
        if (dbg && this.mode === 'saoroi') { var dv = +dbg[1]; if (dv < 1) this.star = { t0: -dv * 1.5, dur: 1.5 }; else { this.glowT = -(dv - 1); this.rip[0] = [0, 0.35, -(dv - 1)]; this.ripI = 1; this.nextStar = 99; } }
        stage.insertBefore(cv, canvas.nextSibling);
        return true;
      } catch (e) { this.stop(); return false; }
    },
    stop: function () {
      if (this.cv && this.cv.parentNode) this.cv.remove();
      if (this.gl) { var ex = this.gl.getExtension('WEBGL_lose_context'); if (ex) ex.loseContext(); }
      this.gl = null; this.cv = null;
    },
    draw: function (dt) {
      var gl = this.gl, cv = this.cv, i, h, s;
      if (cv.width !== canvas.width || cv.height !== canvas.height) { cv.width = canvas.width; cv.height = canvas.height; }
      this.time += dt * L.speed;
      var t = this.time, g = 3.4;
      // giọt sáng rơi: xuất phát ở trần, rơi nhanh dần; chạm sàn → vòng sóng + loé + bắn hạt
      if (this.mode !== 'saoroi' && t > this.nextDrop) {
        this.nextDrop = t + rnd(0.25, 0.7);
        var an = rnd(0, 6.2832), rr = 2.2 * Math.sqrt(Math.random());
        this.heroes.push({ x: Math.cos(an) * rr, z: Math.min(1.7, Math.sin(an) * rr), t0: t, dur: rnd(0.75, 0.95) });
      }
      var n = 0, D = this.dyn, put = function (x, y, z, size, al) { if (n >= 400) return; var o = n * 5; D[o] = x; D[o + 1] = y; D[o + 2] = z; D[o + 3] = size; D[o + 4] = al; n++; };
      for (i = this.heroes.length - 1; i >= 0; i--) {
        h = this.heroes[i];
        var f = (t - h.t0) / h.dur;
        if (f >= 1) {
          this.rip[this.ripI] = [h.x, h.z, t]; this.ripI = (this.ripI + 1) % 8;
          this.sparks.push({ x: h.x, y: -0.95, z: h.z, vx: 0, vy: 0, vz: 0, t0: t, max: 0.45, flash: 1 });
          for (var q = 0; q < 5; q++) { var a3 = rnd(0, 6.2832), v = rnd(0.1, 0.3); this.sparks.push({ x: h.x, y: -0.95, z: h.z, vx: Math.cos(a3) * v, vy: rnd(0.3, 0.7), vz: Math.sin(a3) * v, t0: t, max: rnd(0.3, 0.55) }); }
          this.heroes.splice(i, 1); continue;
        }
        for (var j = 0; j < 14; j++) { var fj = Math.max(0, f - j * 0.012); put(h.x, 0.95 - fj * fj * 1.9, h.z, 3.4 - j * 0.14, (1 - j / 14) * 0.8); } // đầu giọt + vệt đuôi
      }
      // Sao rơi: cứ ~6 giây một ngôi sao sáng có đuôi dài rơi thẳng từ dải trên xuống tâm sàn → loé lớn, đĩa kim tuyến bừng sáng
      // rồi dịu dần, một vòng sóng rộng lan ra tới rìa
      if (this.mode === 'saoroi') {
        if (!this.star && t > this.nextStar) this.star = { t0: t, dur: 1.5 };
        if (this.star) {
          var fs = (t - this.star.t0) / this.star.dur, SZ = 0.35;
          if (fs >= 1) {
            this.rip[this.ripI] = [0, SZ, t]; this.ripI = (this.ripI + 1) % 8;
            this.glowT = t;
            this.sparks.push({ x: 0, y: -0.95, z: SZ, vx: 0, vy: 0, vz: 0, t0: t, max: 1.1, flash: 1, big: 4.2 });
            for (var q2 = 0; q2 < 12; q2++) { var a4 = rnd(0, 6.2832), v4 = rnd(0.15, 0.55); this.sparks.push({ x: 0, y: -0.95, z: SZ, vx: Math.cos(a4) * v4, vy: rnd(0.5, 1.7), vz: Math.sin(a4) * v4, t0: t, max: rnd(0.5, 1.1) }); }
            this.star = null; this.nextStar = t + rnd(5, 7);
          } else for (var j2 = 0; j2 < 60; j2++) { // đầu sao + đuôi thon dần
            var fq = Math.max(0, fs - j2 * 0.006 * (0.4 + fs * 1.6)), u2 = 1 - j2 / 60;
            put(0, 0.95 - fq * fq * 1.9, SZ, 3 + 20 * u2 * u2 * u2 + (j2 === 0 ? 18 : 0), 0.8 * Math.pow(u2, 1.3));
          }
        }
        this.glow = Math.exp(-Math.max(0, t - this.glowT) * 0.6);
      }
      for (i = this.sparks.length - 1; i >= 0; i--) {
        s = this.sparks[i];
        var age = t - s.t0, k = 1 - age / s.max;
        if (k <= 0) { this.sparks.splice(i, 1); continue; }
        if (s.flash) { put(s.x, s.y + 0.01, s.z, (7 + 12 * (1 - k)) * (s.big || 1), (s.big ? 0.6 : 0.7) * k * k); continue; }
        put(s.x + s.vx * age, Math.max(-0.95, s.y + s.vy * age - 0.5 * g * age * age), s.z + s.vz * age, 2.2, 0.8 * k);
      }
      gl.viewport(0, 0, cv.width, cv.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      var asp = cv.width / cv.height, px = cv.height / 1080, col = pal.particle, self = this;
      var rgb = [parseInt(col.slice(1, 3), 16) / 255, parseInt(col.slice(3, 5), 16) / 255, parseInt(col.slice(5, 7), 16) / 255];
      var use = function (p, point) {
        gl.useProgram(p);
        gl.uniform1f(gl.getUniformLocation(p, 'uT'), t); gl.uniform1f(gl.getUniformLocation(p, 'uAsp'), asp); gl.uniform1f(gl.getUniformLocation(p, 'uPx'), px);
        gl.uniform3fv(gl.getUniformLocation(p, 'uCol'), rgb); gl.uniform1f(gl.getUniformLocation(p, 'uPoint'), point);
      };
      var attr = function (p, name, size, stride, off) { var l = gl.getAttribLocation(p, name); if (l < 0) return; gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, stride, off); };
      // hạt sàn / trần / bụi sao
      use(this.pPts, 1);
      var flat = []; for (i = 0; i < 8; i++) flat.push(this.rip[i][0], this.rip[i][1], this.rip[i][2]);
      gl.uniform3fv(gl.getUniformLocation(this.pPts, 'uRip'), new Float32Array(flat));
      var sr = this.mode === 'saoroi';
      gl.uniform4fv(gl.getUniformLocation(this.pPts, 'uRp'), sr ? [0.6, 0.22, 0.55, 0.55] : [0.62, 0.075, 0.95, 1]); // tốc độ lan, độ dày vòng, tắt dần, độ mạnh
      gl.uniform2fv(gl.getUniformLocation(this.pPts, 'uSt'), sr ? [0.72, 0.6] : [1, 1]); // Sao rơi: hạt nhỏ và dịu hơn
      gl.uniform3fv(gl.getUniformLocation(this.pPts, 'uCen'), sr ? [0.45, 1.5 * this.glow, 1.5] : [0, 0, 1]);    // sáng tâm sàn: cố định, bừng lên khi sao chạm, độ gom
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bPts); attr(this.pPts, 'aP', 4, 16, 0);
      gl.drawArrays(gl.POINTS, 0, this.nPts);
      // thác: vệt (đoạn thẳng) + đầu hạt
      if (!sr) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bDrop);
      use(this.pDrop, 0); attr(this.pDrop, 'aD', 4, 20, 0); attr(this.pDrop, 'aTail', 1, 20, 16);
      gl.drawArrays(gl.LINES, 0, this.nDrop);
      gl.uniform1f(gl.getUniformLocation(this.pDrop, 'uPoint'), 1);
      gl.drawArrays(gl.POINTS, 0, this.nDrop);
      }
      // giọt sáng, loé, hạt bắn
      if (n) {
        use(this.pDyn, 1);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bDyn); gl.bufferData(gl.ARRAY_BUFFER, D.subarray(0, n * 5), gl.DYNAMIC_DRAW);
        attr(this.pDyn, 'aPos', 3, 20, 0); attr(this.pDyn, 'aSA', 2, 20, 12);
        gl.drawArrays(gl.POINTS, 0, n);
      }
    },
  };

  // ---------------- nền video quay sẵn (lib/led.js → VIDEOS) ----------------
  // Hai thẻ <video> thay phiên: gần hết video thì bản kia phát lại từ đầu và hiện dần lên → chỗ nối vòng lặp không bị giật.
  var FADE = 1.4, vbg = null;
  FX.none = { init: function () {}, draw: function () {} };
  FX.saoroi = { mode: 'saoroi', init: FX.dembac.init, draw: FX.dembac.draw, fall: FX.dembac.fall }; // biến thể của Đêm kim tuyến bạc (xem GLFX)
  function isVideo() { return !!(C.videos && C.videos[L.effect]); }
  function setupVideo() {
    var v = C.videos && C.videos[L.effect];
    stage.classList.toggle('st-thanh', !!(C.styles && C.styles[L.effect] === 'thanh'));
    stage.classList.toggle('has-video', !!v);
    if (!v) { stage.classList.remove('vlight'); }
    if (!v) { if (vbg) { vbg.wrap.remove(); vbg = null; } return; }
    var light = v.shade === 'light';
    if (!vbg || vbg.src !== v.src) {
      if (vbg) vbg.wrap.remove();
      var wrap = document.createElement('div');
      wrap.id = 'bgv';
      wrap.style.backgroundImage = 'url("' + v.poster + '")';
      var mk = function () {
        var e = document.createElement('video');
        e.muted = true; e.defaultMuted = true; e.playsInline = true; e.preload = 'auto'; e.disablePictureInPicture = true;
        e.setAttribute('muted', ''); e.setAttribute('playsinline', ''); e.setAttribute('aria-hidden', 'true');
        e.src = v.src;
        wrap.appendChild(e);
        return e;
      };
      var a = mk(), b = mk();
      b.classList.add('off');
      var sh = document.createElement('i'); sh.className = 'vshade';
      wrap.appendChild(sh);
      stage.insertBefore(wrap, canvas);
      vbg = { wrap: wrap, a: a, b: b, front: a, src: v.src, swapAt: 0 };
      var start = function () { a.play().catch(function () {}); };
      if (a.readyState >= 2) start(); else a.addEventListener('canplay', start, { once: true });
    }
    vbg.wrap.classList.toggle('light', light);
    stage.classList.toggle('vlight', light);
    var r = Math.max(0.5, Math.min(1.5, L.speed || 1));
    vbg.a.playbackRate = vbg.b.playbackRate = r;
  }
  function tickVideo() {
    if (!vbg) return;
    var f = vbg.front, back = f === vbg.a ? vbg.b : vbg.a;
    if (f.paused && !vbg.swapAt && f.readyState >= 2) f.play().catch(function () {}); // tab ẩn rồi hiện lại / bị chặn tự phát
    if (!f.duration || vbg.swapAt) {
      if (vbg.swapAt && performance.now() > vbg.swapAt) { f.pause(); vbg.front = back; vbg.swapAt = 0; }
      return;
    }
    if (f.currentTime > f.duration - FADE - 0.15) {
      back.currentTime = 0;
      back.play().catch(function () {});
      back.classList.remove('off'); f.classList.add('off');
      vbg.swapAt = performance.now() + FADE * 1000 + 200;
    }
  }

  function resetFx() {
    parts = []; extra = [];
    if (L.effect !== 'dembac' && L.effect !== 'saoroi') GLFX.stop();
    setupVideo();
    (isVideo() ? FX.none : FX[L.effect] || FX.sao).init();
  }

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    ctx.setTransform(K, 0, 0, K, 0, 0);
    ctx.clearRect(0, 0, W, H);
    (isVideo() ? FX.none : FX[L.effect] || FX.sao).draw(dt, now / 1000);
    ctx.globalAlpha = 1;
    tickVideo();
    requestAnimationFrame(frame);
  }

  // ---------------- các cảnh ----------------
  function buildSlides() {
    var g = C.groom || {}, b = C.bride || {};
    var gn = esc(g.name || 'Chú rể'), bn = esc(b.name || 'Cô dâu');
    var hy = L.hy ? '<p class="hy glow">囍</p>' : '';
    // kiểu chữ "thanh": chữ lồng hai chữ cái đầu tên (vd. Gia Huy & Bảo Ngọc → H N) thay cho chữ 囍
    if (C.styles && C.styles[L.effect] === 'thanh') {
      var ini = function (n) { var w = String(n || '').trim().split(/\s+/).pop() || ''; return esc(w.charAt(0).toUpperCase()); };
      hy = L.hy ? '<p class="mono" aria-hidden="true"><span>' + ini(g.name || 'Chú rể') + '</span><span>' + ini(b.name || 'Cô dâu') + '</span></p>' : '';
    }
    var out = [];
    if (L.slides.names) {
      out.push('<div data-k="names" class="slide s-names">' + hy + (L.kicker || C.preview ? '<p class="kicker" data-e="led.kicker">' + esc(L.kicker) + '</p>' : '') +
        '<p class="names glow" data-fit><span data-e="groom.name">' + gn + '</span><span class="amp">&amp;</span><span data-e="bride.name">' + bn + '</span></p></div>');
    }
    if (L.slides.date && C.date) {
      out.push('<div data-k="date" class="slide s-date" data-date="1"><p class="wd">' + esc(C.date.weekday) + '</p>' +
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
    var fam = function (p, lb, w) {
      if (!p.father && !p.mother) return '';
      return '<div class="fam"><p class="lb">' + lb + '</p>' + (p.father ? '<p class="pp" data-e="' + w + '.father">' + esc(p.father) + '</p>' : '') +
        (p.mother ? '<p class="pp" data-e="' + w + '.mother">' + esc(p.mother) + '</p>' : '') + (p.address ? '<p class="ad" data-e="' + w + '.address">' + esc(p.address) + '</p>' : '') + '</div>';
    };
    var fams = fam(g, 'Nhà trai', 'groom') + fam(b, 'Nhà gái', 'bride');
    if (L.slides.parents && fams) {
      out.push('<div data-k="parents" class="slide s-parents"><p class="title glow">Hân hạnh đón tiếp</p><div class="fams" data-fit>' + fams + '</div></div>');
    }
    if (L.slides.photo && C.photo) {
      out.push('<div data-k="photo" class="slide s-photo"><div class="photo" style="background-image:url(\'' + esc(C.photo) + '\')"></div>' +
        '<div class="pn">' + (L.kicker ? '<p class="kicker" style="margin-top:36px">' + esc(L.kicker) + '</p>' : '') +
        '<p class="photo-names glow" data-fit><span>' + gn + '</span> <span class="amp">&amp;</span> <span>' + bn + '</span></p></div></div>');
    }
    if (L.slides.message && L.message) {
      out.push('<div data-k="msg" class="slide s-msg"><p class="msg" data-e="led.message">' + esc(L.message) + '</p><p class="sign glow" data-fit>' + gn + ' &amp; ' + bn + '</p></div>');
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
    var b = e.target.closest('[data-c]'), c = b && b.getAttribute('data-c');
    if (c === 'pause') togglePause();
    else if (c === 'fs') fullscreen();
  });
  // nút toàn màn hình: đổi icon khi vào / thoát; trình duyệt không cho (iPhone) thì ẩn nút, vẫn còn chạm đúp
  var fsBtn = document.querySelector('[data-c=fs]');
  if (!document.fullscreenEnabled) fsBtn.hidden = true;
  document.addEventListener('fullscreenchange', function () {
    var on = !!document.fullscreenElement;
    document.body.classList.toggle('fs', on);
    fsBtn.setAttribute('aria-label', on ? 'Thoát toàn màn hình' : 'Toàn màn hình');
    fsBtn.title = on ? 'Thoát toàn màn hình (F / Esc)' : 'Toàn màn hình (F)';
  });
  // nút đóng (X): mở từ trang khác trong web thì lùi đúng trang đó, mở thẳng link thì về trang mặc định
  document.getElementById('back').addEventListener('click', function (e) {
    var ref = document.referrer;
    if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
    if (ref && ref.indexOf(location.origin + '/') === 0 && ref !== location.href && history.length > 1) { e.preventDefault(); history.back(); }
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
  document.addEventListener('dblclick', function () { if (!C.preview) fullscreen(); }); // khung xem trước: nháy đúp để chọn chữ đang sửa
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

  // ---------- trình sửa: bấm chữ trên màn để gõ sửa tại chỗ (chỉ khung xem trước) ----------
  // gõ tới đâu báo trình sửa tới đó (led-text); bấm ngày cưới → trình sửa mở ô chọn ngày giờ (led-date)
  var editing = null;
  if (C.preview && window.parent !== window) {
    document.body.classList.add('can-edit');
    slidesEl.addEventListener('click', function (e) {
      var t = e.target.closest('[data-e]');
      if (!t) { if (e.target.closest('[data-date]')) { if (!paused) togglePause(); try { window.parent.postMessage({ type: 'led-date' }, location.origin); } catch (er) { /* bỏ qua */ } } return; }
      if (editing === t) return;
      if (!paused) togglePause(); // dừng cảnh trong lúc gõ
      editing = t; try { t.contentEditable = 'plaintext-only'; } catch (er) { t.contentEditable = 'true'; } if (t.contentEditable !== 'plaintext-only') t.contentEditable = 'true';
      t.focus();
      var r = document.createRange(); r.selectNodeContents(t); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    });
    slidesEl.addEventListener('input', function (e) {
      var t = e.target.closest('[data-e]'); if (!t) return;
      try { window.parent.postMessage({ type: 'led-text', key: t.getAttribute('data-e'), value: t.textContent.replace(/\s+/g, ' ').trim() }, location.origin); } catch (er) { /* bỏ qua */ }
    });
    slidesEl.addEventListener('keydown', function (e) { if (editing && (e.key === 'Enter' || e.key === 'Escape')) { e.preventDefault(); editing.blur(); } });
    slidesEl.addEventListener('focusout', function (e) {
      var t = e.target.closest('[data-e]'); if (!t || t !== editing) return;
      t.contentEditable = 'false'; editing = null; fitAll();
      try { window.parent.postMessage({ type: 'led-text-done' }, location.origin); } catch (er) { /* bỏ qua */ }
    });
  }
  // trình sửa gửi cấu hình mới để xem trước tức thì
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data) return;
    if (e.data.type === 'led-config') {
      if (editing) return; // đang gõ trên màn: không dựng lại cảnh (mất con trỏ)
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
  // Bản dùng thử: dòng "Bản dùng thử" phải luôn hiện — bị xoá / ẩn / đổi chữ (công cụ của trình duyệt) thì dựng lại ngay.
  if (C.trial && !C.demo) {
    var WM = 'Bản dùng thử';
    var keepWm = function () {
      var w = stage.querySelector(':scope > .wm');
      if (!w) { w = document.createElement('div'); w.className = 'wm'; w.setAttribute('data-b', C.brand || ''); stage.appendChild(w); }
      if (w.textContent !== WM) w.textContent = WM;
      // chỉ sửa khi thật sự bị ẩn (tránh tự kích hoạt lại bộ theo dõi thay đổi)
      var cs = getComputedStyle(w), r = w.getBoundingClientRect();
      if (w.hidden || cs.display === 'none' || cs.visibility !== 'visible' || +cs.opacity < 0.4 || r.width < 20 || r.height < 5) {
        w.hidden = false;
        w.style.cssText = 'display:block!important;visibility:visible!important;opacity:.45!important;transform:none!important;z-index:50!important;clip-path:none!important;font-size:24px!important;right:60px!important;bottom:52px!important;left:auto!important;top:auto!important;position:absolute!important';
      }
    };
    keepWm();
    setInterval(keepWm, 1500);
    if (window.MutationObserver) new MutationObserver(keepWm).observe(stage, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
  }
})();
