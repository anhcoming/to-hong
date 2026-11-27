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
    stage.style.setProperty('--text', L.color || pal.text); // màu chữ chọn trong trình sửa (trống = theo mẫu)
    stage.style.setProperty('--accent', L.color || pal.accent);
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
        ctx.globalAlpha = (this.mode === 'saobang' && this.useGl ? 0.18 + 0.2 * GLFX.glow : this.mode === 'saoroi' && this.useGl ? 0.05 + 0.45 * GLFX.glow : this.useGl ? 0.16 : 0.9) * pul; // bản WebGL: chỉ còn một quầng rất nhạt, không thành cụm trắng
        ctx.drawImage(this.core, W / 2 - W * 0.45, floor - H * 0.1, W * 0.9, H * 0.2);
        if (!this.useGl) { ctx.globalAlpha = 0.22; ctx.drawImage(this.core, W / 2 - W * 0.55, top - H * 0.045, W * 1.1, H * 0.09); }
        // kim tuyến: 4 tấm đổi độ sáng lệch pha + trôi ngang rất chậm ngược chiều nhau → lấp lánh, có chiều sâu
        if (this.mode === 'saobang' && this.useGl) { // sương sáng xanh mờ phía sau dải kim tuyến trần, đậm nhất ngay trên mép dưới
          var y0 = H * 0.18, y1 = H * 0.46, gh = ctx.createLinearGradient(0, y0, 0, y1);
          gh.addColorStop(0, rgba(pal.particle, 0)); gh.addColorStop(0.4, rgba(pal.particle, 0.08)); gh.addColorStop(0.62, rgba(pal.particle, 0.09)); gh.addColorStop(0.85, rgba(pal.particle, 0.03)); gh.addColorStop(1, rgba(pal.particle, 0));
          ctx.globalAlpha = 0.85 + 0.15 * Math.sin(t * 0.3 * sp); ctx.fillStyle = gh; ctx.fillRect(0, y0, W, y1 - y0);
        }
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
    VS_PTS: 'attribute vec4 aP;uniform float uT,uAsp,uPx;uniform vec3 uRip[8];uniform vec4 uRp;uniform vec3 uCen;uniform vec2 uSt;uniform vec3 uXf;uniform float uCeil,uFlat;varying float vA;' +
      'void main(){float seed=aP.z;float tw=pow(0.5+0.5*sin(uT*(1.2+seed*3.7)+seed*61.0),3.0);' +
      'if(aP.w>4.5){gl_Position=vec4(aP.xy,0.0,1.0);float e=aP.y-0.3;float big=step(0.97,fract(seed*29.0));' +
      'gl_PointSize=uPx*(1.6+3.0*fract(seed*7.3)*fract(seed*3.9)+big*2.5);float br=0.72+0.28*(0.5+0.5*sin(uT*0.35+aP.x*2.2+sin(uT*0.21+aP.x*1.3)*1.5));vA=(0.35+0.85*tw)*(0.42+0.55*exp(-max(e,0.0)*2.2)+big*0.35)*smoothstep(-0.24,0.08,e)*smoothstep(0.75,0.3,e)*br;return;}' +
      'if(aP.w>2.5){vec2 q=vec2(uXf.x*aP.x+uXf.y*aP.y,-uXf.y*aP.x+uXf.x*aP.y)/uXf.z;gl_Position=vec4(q.x/uAsp,q.y,0.0,1.0);float dust=step(3.5,aP.w);float bg=step(0.975,fract(seed*29.0))*(1.0-dust);' +
      'gl_PointSize=uPx*(mix(2.0,1.5,dust)+mix(3.0,2.0,dust)*fract(seed*7.3)+bg*4.5);vA=(0.3+0.7*tw)*(0.7+0.6*fract(seed*3.1)+bg*0.6)*mix(1.0,0.75,dust);return;}' +
      'if(aP.w>1.5){gl_Position=vec4(aP.xy,0.0,1.0);float big=step(0.965,fract(seed*29.0));gl_PointSize=uPx*(1.3+2.2*fract(seed*7.3)+big*3.5);vA=(0.18+0.82*tw)*(0.55+0.45*fract(seed*3.1)+big*0.5);return;}' +
      'float fl=aP.w<0.5?1.0:0.0;float ang=aP.y+uT*(fl>0.5?0.03:-0.02)*(1.0+0.7/(0.5+aP.x));' +
      'float thick=(fract(seed*91.7)-0.5)*(0.05+0.09*aP.x);vec3 p=vec3(cos(ang)*aP.x,(fl>0.5?-0.95:0.95)+thick,sin(ang)*aP.x*(uCeil>1.01&&fl>0.5?0.5:1.0));float lift=0.0;' +
      'if(fl>0.5){for(int i=0;i<8;i++){float age=uT-uRip[i].z;if(age>0.0&&age<6.0){float d=distance(p.xz,uRip[i].xy);' +
      'float w=exp(-pow((d-age*uRp.x)/uRp.y,2.0))*exp(-age*uRp.z);float w2=exp(-pow((d-age*uRp.x+uRp.y*2.7)/(uRp.y*0.8),2.0))*exp(-age*uRp.z*1.6)*0.55;lift+=(w+w2)*uRp.w;}}}' +
      'p.y+=lift*0.065;p.z*=uFlat;float zc=3.2-p.z;float f=2.1445;gl_Position=vec4(p.x*f/uAsp*zc/zc,p.y*f,0.0,zc);gl_Position.x=p.x*f/uAsp;' +
      'float sz=uPx*(2.4+5.0*fract(seed*13.7)*fract(seed*5.1))*2.6/zc*(fl>0.5?1.0:mix(1.0,1.35,step(1.01,uCeil)));gl_PointSize=max(1.0,sz*uSt.x)*(1.0+lift*1.0);' +
      'float far=clamp(1.3-zc*0.09,0.5,1.0);vA=((0.5+1.1*tw)*(1.15+0.35*exp(-aP.x*0.8)+fl*(uCen.x+uCen.y)*exp(-aP.x*uCen.z))*(fl>0.5?1.0:0.8*uCeil)+lift*1.7)*far*smoothstep(0.15,0.7,zc)*(1.0-smoothstep(1.7,3.0,aP.x)*0.92)*uSt.y;}',
    VS_DROP: 'attribute vec4 aD;attribute float aTail;uniform float uT,uAsp,uPx,uFlat;varying float vA;' +
      // 0 → 0.86: rơi nhanh dần từ dải trên xuống sàn; 0.86 → 1: chạm sàn rồi nảy lên một nhịp nhỏ (lệch ngang chút) và tắt dần
      'void main(){float f=fract(uT*aD.w+aD.z);float FL=0.86;float r=fract(aD.z*91.0);' +
      'float y0=0.95+(fract(aD.z*53.0)-0.5)*0.5;vec3 p;float al;' +
      'if(f<FL){float g=f/FL;float gt=max(g-0.012-0.03*g,0.0);float gg=aTail>0.5?gt:g;' +
      'p=vec3(aD.x,y0-gg*gg*(y0+0.95),aD.y*uFlat);float mid=0.4+0.6*abs(g*g-0.5)*2.0;al=smoothstep(0.0,0.3,g)*mid;}' +
      'else{float b=(f-FL)/(1.0-FL);float hb=(0.035+0.045*r)*4.0*b*(1.0-b);float side=(r-0.5)*0.09*b;' +
      'p=vec3(aD.x+side,-0.95+hb,aD.y*uFlat);al=(aTail>0.5?0.0:1.0)*(1.0-b)*1.3;}' +
      'float zc=3.2-p.z;float k=2.1445;gl_Position=vec4(p.x*k/uAsp,p.y*k,0.0,zc);gl_PointSize=max(1.0,uPx*2.6*2.3/zc);' +
      'vA=(aTail>0.5?0.0:1.0)*al*(0.1+0.3*fract(aD.z*17.0))*clamp(1.3-zc*0.12,0.3,1.0);}',
    VS_DYN: 'attribute vec3 aPos;attribute vec2 aSA;uniform float uAsp,uPx,uFlat;varying float vA;' +
      'void main(){float zc=3.2-aPos.z*uFlat;float k=2.1445;gl_Position=vec4(aPos.x*k/uAsp,aPos.y*k,0.0,zc);gl_PointSize=max(1.0,aSA.x*uPx*2.3/zc);vA=aSA.y;}',
    FS: 'precision mediump float;varying float vA;uniform vec3 uCol;uniform float uPoint;' +
      'void main(){float a=1.0;if(uPoint>0.5){float d=length(gl_PointCoord-0.5);a=smoothstep(0.5,0.0,d);a*=a;}float v=a*vA;gl_FragColor=vec4(uCol*v,v);}',
    VS_Q: 'attribute vec2 aQ;void main(){gl_Position=vec4(aQ,0.0,1.0);}',
    FS_Q: 'precision highp float;uniform vec2 uRes;uniform float uT;uniform vec3 uXf;' +
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1.0,0.0)),f.x),mix(h(i+vec2(0.0,1.0)),h(i+vec2(1.0,1.0)),f.x),f.y);}' +
      'float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(11.7,5.3);a*=0.5;}return v;}' +
      'void main(){vec2 p=(gl_FragCoord.xy-0.5*uRes)/uRes.y;p=vec2(uXf.x*p.x-uXf.y*p.y,uXf.y*p.x+uXf.x*p.y)*uXf.z;' +
      'float a=0.5;vec2 q=vec2(cos(a)*p.x+sin(a)*p.y,-sin(a)*p.x+cos(a)*p.y);' +       // q.x dọc dải, q.y ngang dải
      'float warp=fbm(q*vec2(1.1,1.8)+vec2(uT*0.006,3.1))-0.5;float y=q.y+warp*0.2;' +
      'float w=0.13+0.1*fbm(vec2(q.x*1.4+3.0,1.7));float band=exp(-pow(y/w,2.0));' +
      'float cloud=fbm(q*vec2(2.1,4.4)+vec2(uT*0.009,uT*0.003));' +
      'float lane=smoothstep(0.44,0.6,fbm(q*vec2(2.6,8.5)+vec2(7.3+uT*0.004,2.0)))*smoothstep(0.3,0.0,abs(y+0.02));' +
      'float wisp=fbm(q*vec2(5.0,11.0)+vec2(uT*0.012,4.0));float d=band*(0.1+1.9*cloud*cloud)*(0.55+0.9*wisp)*(1.0-0.88*lane);' +
      'vec3 c=mix(vec3(0.42,0.5,0.86),vec3(0.9,0.86,1.0),cloud)*d*0.62+vec3(0.5,0.3,0.55)*band*band*cloud*0.1;' +
      'float halo=exp(-pow(y/(w*2.6),2.0))*0.05;c+=vec3(0.3,0.36,0.7)*halo;gl_FragColor=vec4(c,max(c.r,max(c.g,c.b)));}',
    // Lụa satin: mặt vải là một "bản đồ độ cao" gồm vài lớp sóng lớn bị uốn bởi nhiễu mịn (nếp vải), tính pháp tuyến rồi chiếu sáng:
    // vùng khuất tối sâu, sườn nếp sáng dần, đỉnh nếp có vệt bóng hẹp như satin. Nếp trôi và đổi dạng rất chậm.
    FS_SILK: 'precision highp float;uniform vec2 uRes;uniform float uT;uniform vec3 uA,uB,uC;' +
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*f*(f*(f*6.0-15.0)+10.0);return mix(mix(h(i),h(i+vec2(1.0,0.0)),f.x),mix(h(i+vec2(0.0,1.0)),h(i+vec2(1.0,1.0)),f.x),f.y);}' +
      'float f2(vec2 p){return 0.6*n(p)+0.3*n(p*2.1+3.7)+0.1*n(p*4.3+9.1);}' +
      // một lớp nếp gấp: u tăng dần ngang nếp; mỗi nếp có mép sáng sắc ở một bên rồi tối dần sang bên kia tới đen (như nếp vải chồng lên nhau),
      // độ sáng + độ dốc mỗi nếp khác nhau
      'float fold(float u,float sharp){float s=fract(u),r=h(vec2(floor(u),7.0));return smoothstep(0.0,sharp,s)*pow(1.0-s,0.7+1.6*r)*(0.55+0.65*h(vec2(floor(u),3.0)));}' +
      'void main(){vec2 p=(gl_FragCoord.xy-0.5*uRes)/uRes.y;float t=uT;' +
      'float a=dot(p,vec2(0.53,0.848)),l=dot(p,vec2(0.848,-0.53));' +                                              // a: ngang nếp, l: dọc nếp (chéo từ trên-trái xuống dưới-phải)
      'float m=f2(vec2(l*0.55+t*0.012,a*0.7+1.0)),m2=f2(vec2(l*0.9-t*0.009+7.0,a*1.3+3.0)),m3=f2(vec2(l*0.35+t*0.006+2.0,a*0.4));' +
      'float u1=a*2.1+2.0*m+0.7*m3+t*0.022,u2=a*4.4+2.4*m2+1.0*m-t*0.017,u3=a*8.5+3.0*m+1.2*m2+t*0.012;' +
      'float b1=fold(u1,0.16),b2=fold(u2,0.2),b3=fold(u3,0.28);' +
      'float broad=0.55+0.45*sin(a*1.5+3.0*m3+t*0.03);' +
      'float v=(b1*1.0+b2*0.6*(0.35+0.65*b1+0.3*broad)+b3*0.22*b1)*(0.6+0.55*broad);' +
      'float sp=pow(clamp(b1*1.15,0.0,1.0),5.0)*0.6+pow(clamp(b2,0.0,1.0),6.0)*0.3;' +
      'vec3 col=mix(uA,uB,clamp(v*1.6,0.0,1.0))+uC*sp;' +
      'vec2 q=gl_FragCoord.xy/uRes-0.5;col*=1.0-0.5*dot(q,q);gl_FragColor=vec4(col,1.0);}',
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
        if (this.mode === 'lua') {
          this.pQ = this.prog(this.VS_Q, this.FS_SILK); this.bQ = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.bQ);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
          this.time = rnd(0, 200); stage.insertBefore(cv, canvas.nextSibling);
          return true;
        }
        var dens = Math.max(0.3, L.density), i, a = [];
        // sàn + trần: một phần hạt rải đều cả đĩa, một phần dồn về tâm (tâm sáng rực)
        var disc = function (n, kind, R, pw) { for (var q = 0; q < n; q++) { var u = Math.random(); a.push(R * Math.pow(u, pw || 0.62), Math.random() * 6.2832, Math.random(), kind); } };
        if (this.mode === 'thienha') {
          // toạ độ sao theo đơn vị nửa chiều cao màn (x: ±tỉ lệ màn, y: ±1), rộng hơn màn một chút để xoay / thu phóng không hở mép
          for (i = 0; i < Math.round(3800 * dens); i++) a.push(rnd(-2.3, 2.3), rnd(-1.3, 1.3), Math.random(), 3);
          var ca = Math.cos(0.5), sa = Math.sin(0.5);
          for (i = 0; i < Math.round(15000 * dens); i++) { // bụi sao dồn theo dải chéo (cùng góc với lớp mây trong shader)
            var qx = rnd(-1.5, 1.5), qy = (Math.random() + Math.random() + Math.random() - 1.5) * 0.2;
            a.push(2 * (ca * qx - sa * qy), 2 * (sa * qx + ca * qy), Math.random(), Math.random() < 0.12 ? 3 : 4);
          }
        } else {
        if (this.mode === 'saoroi') { disc(Math.round(15000 * dens), 0, 2.0, 0.8); disc(Math.round(8000 * dens), 0, 3.0); } // Sao rơi: sàn là một đĩa kim tuyến gọn, dày ở tâm
        else if (this.mode === 'saobang') { disc(Math.round(17000 * dens), 0, 2.4, 0.95); disc(Math.round(10000 * dens), 0, 3.0); } // Đêm sao băng: sàn sáng nhẹ ở tâm, tan dần ra rìa
        else disc(Math.round(34000 * dens), 0, 3.0);
        if (this.mode === 'saobang') { // dải trần phẳng: mép dưới thẳng ngang (y = 0.3), hạt dày ở mép rồi thưa dần lên trên
          for (i = 0; i < Math.round(15000 * dens); i++) {
            // mép dưới không thẳng tắp: lượn nhẹ theo chiều ngang; ~18% hạt rơi lấm tấm xuống dưới mép (thưa dần) → mép tự nhiên, không như bị cắt
            var bx = rnd(-1.02, 1.02), edge = 0.3 + 0.014 * Math.sin(bx * 3.7 + 0.8) + 0.008 * Math.sin(bx * 9.1 + 2.3);
            a.push(bx, Math.random() < 0.2 ? edge + Math.log(Math.random() + 1e-4) * 0.06 : edge + Math.pow(Math.random(), 1.25) * 0.6 + (Math.random() - 0.5) * 0.06, Math.random(), 5);
          }
        } else disc(Math.round((this.mode === 'saoroi' ? 16000 : 24000) * dens), 1, 3.0); // trần (Đêm sao băng: dải trần dày, sáng)
        for (i = 0; i < Math.round(2600 * dens); i++) a.push(rnd(-1, 1), rnd(-1, 1), Math.random(), 2); // sao rải khắp trời
        for (i = 0; i < Math.round(2600 * dens); i++) { // dải ngân hà: sao dồn quanh một đường chéo qua nửa trên màn
          var mx = rnd(-1.1, 1.1), my = 0.5 + mx * 0.22 + (Math.random() + Math.random() + Math.random() - 1.5) * 0.3;
          a.push(mx, my, Math.random(), 2);
        }
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
        this.pPts = this.prog(this.VS_PTS, this.FS);
        if (this.mode === 'thienha') { this.pQ = this.prog(this.VS_Q, this.FS_Q); this.bQ = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.bQ); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW); } this.pDrop = this.prog(this.VS_DROP, this.FS); this.pDyn = this.prog(this.VS_DYN, this.FS);
        gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
        this.rip = []; for (i = 0; i < 8; i++) this.rip.push([0, 0, -99]);
        this.ripI = 0; this.heroes = []; this.sparks = []; this.time = 0; this.nextDrop = 0.6; this.star = null; this.nextStar = 1.2; this.glowT = -99; this.glow = 0; this.rings = []; this.bRing = gl.createBuffer();
        // ?dbg=<0..1>: sao đang rơi tới phần đó của quãng đường; ?dbg=1.x: x giây sau khi sao chạm sàn (để chụp kiểm tra mẫu Sao rơi)
        var dbg = /[?&]dbg=([\d.]+)/.exec(location.search);
        if (dbg && (this.mode === 'saoroi' || this.mode === 'saobang')) { var dv = +dbg[1]; if (dv < 1) this.star = { t0: -dv * 1.5, dur: 1.5 }; else { this.glowT = -(dv - 1); this.rip[0] = [0, 0, -(dv - 1)]; this.ripI = 1; this.nextStar = 99; this.rings.push(-(dv - 1)); } }
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
      if (this.mode === 'lua') {
        var K3 = this.silk, pq = this.pQ, loc = function (nm) { return gl.getUniformLocation(pq, nm); };
        gl.viewport(0, 0, cv.width, cv.height); gl.disable(gl.BLEND); gl.useProgram(pq);
        gl.uniform2f(loc('uRes'), cv.width, cv.height); gl.uniform1f(loc('uT'), this.time * 4);
        gl.uniform3fv(loc('uA'), K3[0]); gl.uniform3fv(loc('uB'), K3[1]); gl.uniform3fv(loc('uC'), K3[2]);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bQ); var lq = gl.getAttribLocation(pq, 'aQ'); gl.enableVertexAttribArray(lq); gl.vertexAttribPointer(lq, 2, gl.FLOAT, false, 8, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        return;
      }
      var t = this.time, g = 3.4;
      // giọt sáng rơi: xuất phát ở trần, rơi nhanh dần; chạm sàn → vòng sóng + loé + bắn hạt
      if (this.mode === 'dembac' && t > this.nextDrop) {
        this.nextDrop = t + rnd(0.7, 1.8);
        var an = rnd(0, 6.2832), rr = 2.2 * Math.sqrt(Math.random());
        this.heroes.push({ x: Math.cos(an) * rr, z: Math.min(1.7, Math.sin(an) * rr), t0: t, dur: rnd(0.75, 0.95) });
      }
      var n = 0, D = this.dyn, put = function (x, y, z, size, al) { if (n >= 400) return; var o = n * 5; D[o] = x; D[o + 1] = y; D[o + 2] = z; D[o + 3] = size; D[o + 4] = al; n++; };
      for (i = this.heroes.length - 1; i >= 0; i--) {
        h = this.heroes[i];
        var f = (t - h.t0) / h.dur;
        if (f >= 1) {
          this.rip[this.ripI] = [h.x, h.z, t]; this.ripI = (this.ripI + 1) % 8;
          this.sparks.push({ x: h.x, y: -0.95, z: h.z, vx: 0, vy: 0, vz: 0, t0: t, max: 0.3, flash: 1 });
          for (var q = 0; q < 2; q++) { var a3 = rnd(0, 6.2832), v = rnd(0.08, 0.2); this.sparks.push({ x: h.x, y: -0.95, z: h.z, vx: Math.cos(a3) * v, vy: rnd(0.3, 0.7), vz: Math.sin(a3) * v, t0: t, max: rnd(0.3, 0.55) }); }
          this.heroes.splice(i, 1); continue;
        }
        for (var j = 0; j < 14; j++) { var fj = Math.max(0, f - j * 0.012); put(h.x, 0.95 - fj * fj * 1.9, h.z, 3.4 - j * 0.14, (1 - j / 14) * 0.8); } // đầu giọt + vệt đuôi
      }
      // Sao rơi: cứ ~6 giây một ngôi sao sáng có đuôi dài rơi thẳng từ dải trên xuống tâm sàn → loé lớn, đĩa kim tuyến bừng sáng
      // rồi dịu dần, một vòng sóng rộng lan ra tới rìa
      if (this.mode === 'saoroi' || this.mode === 'saobang') {
        if (!this.star && t > this.nextStar) this.star = { t0: t, dur: 1.5 };
        if (this.star) {
          var fs = (t - this.star.t0) / this.star.dur, SZ = 0;
          if (fs >= 1) {
            this.rip[this.ripI] = [0, SZ, t]; this.ripI = (this.ripI + 1) % 8;
            this.glowT = t; this.rings.push(t);
            this.sparks.push({ x: 0, y: -0.95, z: SZ, vx: 0, vy: 2.1, vz: 0, t0: t, max: 1.15, size: 7 }); // giọt nảy ngược lên rồi rơi lại
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
        if (s.flash) { put(s.x, s.y + 0.01, s.z, (s.big ? (7 + 12 * (1 - k)) * s.big : 4 + 5 * (1 - k)), (s.big ? 0.6 : 0.7) * k * k); continue; }
        put(s.x + s.vx * age, Math.max(-0.95, s.y + s.vy * age - 0.5 * g * age * age), s.z + s.vz * age, s.size || 2.2, 0.8 * k);
      }
      gl.viewport(0, 0, cv.width, cv.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      var asp = cv.width / cv.height, px = cv.height / 1080, col = pal.particle, self = this;
      var rgb = [parseInt(col.slice(1, 3), 16) / 255, parseInt(col.slice(3, 5), 16) / 255, parseInt(col.slice(5, 7), 16) / 255];
      var use = function (p, point) {
        gl.useProgram(p);
        gl.uniform1f(gl.getUniformLocation(p, 'uT'), t); gl.uniform1f(gl.getUniformLocation(p, 'uAsp'), asp); gl.uniform1f(gl.getUniformLocation(p, 'uPx'), px);
        gl.uniform3fv(gl.getUniformLocation(p, 'uCol'), rgb); gl.uniform1f(gl.getUniformLocation(p, 'uPoint'), point);
        gl.uniform1f(gl.getUniformLocation(p, 'uFlat'), self.mode === 'dembac' ? 0.6 : 1); // Đêm kim tuyến bạc: ép dẹt trần + sàn cho bớt cong
      };
      var attr = function (p, name, size, stride, off) { var l = gl.getAttribLocation(p, name); if (l < 0) return; gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, stride, off); };
      // Dải ngân hà: cả bầu trời xoay và thu phóng cực chậm (như đang trôi); lớp mây vẽ trước, sao vẽ sau
      var th = this.mode === 'thienha', xa = th ? 0.035 * Math.sin(t * 0.045) : 0, xf = [Math.cos(xa), Math.sin(xa), th ? 1.07 + 0.05 * Math.sin(t * 0.033) : 1];
      if (th) {
        gl.useProgram(this.pQ);
        gl.uniform2f(gl.getUniformLocation(this.pQ, 'uRes'), cv.width, cv.height); gl.uniform1f(gl.getUniformLocation(this.pQ, 'uT'), t); gl.uniform3fv(gl.getUniformLocation(this.pQ, 'uXf'), xf);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bQ); attr(this.pQ, 'aQ', 2, 8, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      // hạt sàn / trần / bụi sao
      use(this.pPts, 1);
      gl.uniform3fv(gl.getUniformLocation(this.pPts, 'uXf'), xf);
      var flat = []; for (i = 0; i < 8; i++) flat.push(this.rip[i][0], this.rip[i][1], this.rip[i][2]);
      gl.uniform3fv(gl.getUniformLocation(this.pPts, 'uRip'), new Float32Array(flat));
      var sb = this.mode === 'saobang', sr = this.mode === 'saoroi' || sb;
      gl.uniform4fv(gl.getUniformLocation(this.pPts, 'uRp'), sr ? (sb ? [0.5, 0.3, 0.5, 0.7] : [0.55, 0.24, 0.45, 1.5]) : [0.38, 0.045, 2.0, 0.55]); // tốc độ lan, độ dày vòng, tắt dần, độ mạnh
      gl.uniform1f(gl.getUniformLocation(this.pPts, 'uCeil'), sb ? 2.4 : 1);
      gl.uniform1f(gl.getUniformLocation(this.pPts, 'uT'), t); // (dải trần dùng uT để thở) // Đêm sao băng: dải trần sáng rõ
      gl.uniform2fv(gl.getUniformLocation(this.pPts, 'uSt'), sb ? [0.8, 0.55 + 0.15 * Math.sin(t * 0.3)] : sr ? [0.72, 0.6] : [1, 1]); // Sao rơi: hạt nhỏ và dịu hơn
      gl.uniform3fv(gl.getUniformLocation(this.pPts, 'uCen'), sb ? [0.35, 0.55 * this.glow, 0.7] : sr ? [0, 1.7 * this.glow, 1.5] : [0, 0, 1]); // sáng tâm sàn: cố định, bừng lên khi sao chạm, độ gom
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bPts); attr(this.pPts, 'aP', 4, 16, 0);
      gl.drawArrays(gl.POINTS, 0, this.nPts);
      // thác: vệt (đoạn thẳng) + đầu hạt
      if (this.mode === 'dembac') {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bDrop);
      use(this.pDrop, 0); attr(this.pDrop, 'aD', 4, 20, 0); attr(this.pDrop, 'aTail', 1, 20, 16);
      gl.drawArrays(gl.LINES, 0, this.nDrop);
      gl.uniform1f(gl.getUniformLocation(this.pDrop, 'uPoint'), 1);
      gl.drawArrays(gl.POINTS, 0, this.nDrop);
      }
      // sóng sáng (Sao rơi): sau khi sao chạm sàn, một quầng sáng mềm toả từ tâm ra — bên trong sáng mờ, sáng nhất ở mép sóng rồi tan dần
      // ra ngoài (không vẽ nét). Kim tuyến nằm trong mép sóng cũng sáng lên (shader ở trên) nên nhìn như sóng ánh sáng lan trên mặt nước.
      if (sr && this.rings.length) {
        var RV = [], strips = 0, SEG = 72;
        for (i = this.rings.length - 1; i >= 0; i--) {
          var ra = t - this.rings[i];
          if (ra > 6) { this.rings.splice(i, 1); continue; }
          for (var w = 0; w < 2; w++) {
            var a2 = ra - w * 0.7; if (a2 <= 0.02) continue;
            var rad = 0.55 * a2, fade = Math.exp(-a2 * 0.45) * (1 - w * 0.45) * (1 - Math.min(1, Math.max(0, (rad - 1.8) / 1.0)));
            if (fade < 0.01) continue;
            var pk = 0.5 * fade, inn = 0.24 * fade, wid = 0.22 + rad * 0.14;
            var band = function (r1, al1, r2, al2) {
              for (var q3 = 0; q3 <= SEG; q3++) { var an3 = q3 / SEG * 6.2832, cx = Math.cos(an3), sz = Math.sin(an3); RV.push(cx * r1, -0.945, sz * r1, 1, al1, cx * r2, -0.945, sz * r2, 1, al2); }
              strips++;
            };
            band(0, inn, Math.max(0.01, rad - wid * 0.5), inn * 1.4); band(Math.max(0.01, rad - wid * 0.5), inn * 1.4, rad, pk); band(rad, pk, rad + wid, 0);
          }
        }
        if (strips) {
          use(this.pDyn, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, this.bRing); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(RV), gl.DYNAMIC_DRAW);
          attr(this.pDyn, 'aPos', 3, 20, 0); attr(this.pDyn, 'aSA', 2, 20, 12);
          for (i = 0; i < strips; i++) gl.drawArrays(gl.TRIANGLE_STRIP, i * (SEG + 1) * 2, (SEG + 1) * 2);
        }
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
  // Tuyết rơi: bông tuyết tinh thể 6 cánh (12 dáng, nét kính trong) rơi chậm, xoay + chao nhẹ, 4 tầng xa gần
  // (xa hẳn: chấm li ti, xa: tinh thể nhỏ, giữa: vừa, gần: to + nhoè, vẽ đè lên chữ ở canvas riêng #fxtop),
  // bắt sáng khi quay chính diện, vào màn mờ dần ở mép trên, thỉnh thoảng một cơn gió rất nhẹ, sương lạnh mờ dưới đáy.
  FX.tuyet = {
    crystal: function (seed) {
      var S = 192, c = document.createElement('canvas'); c.width = c.height = S;
      var g = c.getContext('2d'), R = S * 0.42, rs = seed, segs = [], arm = [];
      var r2 = function () { rs = (rs * 9301 + 49297) % 233280; return rs / 233280; };
      var kind = seed % 4; // 0 nhánh dày, 1 nhánh thưa dài, 2 bản lục giác + nhánh ngắn, 3 hình sao đơn giản
      var nb = kind === 3 ? 1 : kind === 1 ? 3 : kind === 2 ? 2 : 4 + Math.floor(r2() * 2);
      arm.push([0, 0, 0, -R, 1]);
      for (var k = 0; k < nb; k++) {
        var tt = 0.3 + 0.6 * (k + r2() * 0.4) / nb, len = R * (kind === 1 ? 0.42 : 0.34) * (1.05 - tt * 0.75) * (0.8 + r2() * 0.4), ang = Math.PI / 3 * (0.9 + r2() * 0.2);
        var bx = Math.sin(ang) * len, by = -R * tt - Math.cos(ang) * len;
        arm.push([0, -R * tt, bx, by, 0.75]); arm.push([0, -R * tt, -bx, by, 0.75]);
        if (kind === 0 && len > R * 0.18) { var sx = bx * 0.55, sy = -R * tt + (by + R * tt) * 0.55, sl = len * 0.38; arm.push([sx, sy, sx, sy - sl, 0.5]); arm.push([-sx, sy, -sx, sy - sl, 0.5]); }
      }
      if (kind === 2) for (var h = 0; h < 6; h++) { var a1 = h * Math.PI / 3, a2 = (h + 1) * Math.PI / 3, rr = R * 0.24; segs.push([Math.sin(a1) * rr, -Math.cos(a1) * rr, Math.sin(a2) * rr, -Math.cos(a2) * rr, 0.8]); }
      for (var m = 0; m < 6; m++) { var A = m * Math.PI / 3, ca = Math.cos(A), sa = Math.sin(A);
        arm.forEach(function (q) { segs.push([q[0] * ca - q[1] * sa, q[0] * sa + q[1] * ca, q[2] * ca - q[3] * sa, q[2] * sa + q[3] * ca, q[4]]); }); }
      var W0 = S * 0.034;
      g.translate(S / 2, S / 2); g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = 'rgba(190,210,255,.9)';
      var pass = function (wm, style, blur) { g.strokeStyle = style; g.shadowBlur = blur || 0;
        segs.forEach(function (q) { g.lineWidth = Math.max(1, W0 * q[4] * wm); g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(q[2], q[3]); g.stroke(); }); };
      pass(1.6, 'rgba(200,215,255,.35)', S * 0.05); pass(1, 'rgba(245,248,255,.95)'); pass(0.45, 'rgba(120,135,165,.75)'); pass(0.15, 'rgba(255,255,255,.95)');
      g.shadowBlur = 0; g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(0, 0, W0 * 0.9, 0, 7); g.fill();
      return c;
    },
    sprites: function () {
      if (this.SP) return;
      this.SP = []; this.SPB = [];
      for (var q = 1; q <= 12; q++) { var cr = this.crystal(q * 7919), bl = document.createElement('canvas'); bl.width = bl.height = cr.width;
        var bx = bl.getContext('2d'); bx.filter = 'blur(' + (cr.width * 0.018) + 'px)'; bx.drawImage(cr, 0, 0); this.SP.push(cr); this.SPB.push(bl); }
      var d = this.DOT = document.createElement('canvas'); d.width = d.height = 32; var dg = d.getContext('2d'), gr = dg.createRadialGradient(16, 16, 0, 16, 16, 16);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(235,242,255,.7)'); gr.addColorStop(1, 'rgba(220,232,255,0)'); dg.fillStyle = gr; dg.fillRect(0, 0, 32, 32);
    },
    make: function (init) {
      var z = Math.random(), Lr = z < 0.68 ? 0 : z < 0.93 ? 1 : 2, u = H / 700, dot = Lr === 0 && Math.random() < 0.45;
      return { L: Lr, dot: dot, x: rnd(-0.1, 1.1) * W, y: init ? rnd(-0.1, 1) * H : rnd(-0.15, -0.02) * H,
        r: (dot ? rnd(0.6, 1.3) : [rnd(2.2, 4.5), rnd(5, 10), rnd(13, 21)][Lr]) * u,
        vy: [rnd(14, 24), rnd(26, 40), rnd(48, 70)][Lr] * u, ph: rnd(0, 6.28), sw: rnd(0.4, 1.1), amp: rnd(6, 22) * (Lr + 1) * u,
        a: [rnd(0.45, 0.75), rnd(0.55, 0.85), rnd(0.4, 0.6)][Lr], si: Math.floor(Math.random() * 12), rot: rnd(0, 6.28), vr: rnd(-0.5, 0.5), tilt: rnd(0, 6.28) };
    },
    init: function () {
      this.sprites();
      var top = document.getElementById('fxtop');
      if (!top) { top = document.createElement('canvas'); top.id = 'fxtop'; stage.insertBefore(top, slidesEl.nextSibling); }
      this.top = top; this.tc = top.getContext('2d');
      var n = Math.round(170 * L.density * AREA);
      for (var i = 0; i < n; i++) parts.push(this.make(true));
    },
    draw: function (dt, t) {
      var tc = this.tc, top = this.top, u = H / 700, sp = L.speed;
      if (top.width !== canvas.width || top.height !== canvas.height) { top.width = canvas.width; top.height = canvas.height; }
      tc.setTransform(K, 0, 0, K, 0, 0); tc.clearRect(0, 0, W, H);
      // sương lạnh mờ dưới đáy
      var gb = ctx.createLinearGradient(0, H * 0.72, 0, H); gb.addColorStop(0, 'rgba(160,185,235,0)'); gb.addColorStop(1, 'rgba(160,185,235,.12)');
      ctx.globalAlpha = 1; ctx.fillStyle = gb; ctx.fillRect(0, H * 0.72, W, H * 0.28);
      // gió: lắc nhẹ thường xuyên + thỉnh thoảng một cơn rất nhẹ
      var gx = Math.sin(t * 0.17) * 0.7 + Math.sin(t * 0.053 + 1.3) * 0.3, gust = Math.sin(t * 0.23) * 0.6 + Math.sin(t * 0.071) * 0.4 + Math.max(0, Math.min(1, (gx - 0.55) / 0.3)) * 0.9;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.y += p.vy * dt * sp; p.x += gust * 6 * (p.L + 1) * u * dt * sp;
        if (p.y > H + 30) { parts[i] = this.make(false); continue; }
        var x = p.x + Math.sin(t * p.sw * sp + p.ph) * p.amp;
        if (x < -30) p.x += W + 60; else if (x > W + 30) p.x -= W + 60;
        var c2 = p.L === 2 ? tc : ctx, edge = Math.max(0, Math.min(1, (p.y + H * 0.04) / (H * 0.12)));
        if (p.dot) { var s0 = p.r * 2.6; c2.globalAlpha = p.a * edge; c2.drawImage(this.DOT, x - s0, p.y - s0, s0 * 2, s0 * 2); continue; }
        p.rot += p.vr * dt * sp;
        var cz = Math.cos(t * 0.8 * sp + p.tilt), sq = 0.75 + 0.25 * cz, s1 = p.r * 2.4, ca = Math.cos(p.rot), sa = Math.sin(p.rot);
        c2.globalAlpha = Math.min(1, p.a * edge * (0.85 + 0.35 * Math.pow(Math.max(0, cz), 12))); // bắt sáng khi quay chính diện
        c2.setTransform(K * ca, K * sa, -K * sa * sq, K * ca * sq, K * x, K * p.y);
        c2.drawImage(p.L === 2 ? this.SPB[p.si] : this.SP[p.si], -s1, -s1, s1 * 2, s1 * 2);
        c2.setTransform(K, 0, 0, K, 0, 0);
      }
      ctx.globalAlpha = tc.globalAlpha = 1;
    },
  };
  FX.none = { init: function () {}, draw: function () {} };
  // Dải ngân hà: dải mây sao chạy chéo màn (WebGL); máy không có WebGL dùng hiệu ứng "Ngân hà" vẽ bằng canvas
  FX.thienha = {
    init: function () { GLFX.mode = 'thienha'; this.useGl = GLFX.start(); if (!this.useGl) FX.nganha.init.call(FX.nganha); },
    draw: function (dt, t) { if (this.useGl && GLFX.gl) GLFX.draw(dt); else FX.nganha.draw.call(FX.nganha, dt, t); },
  };
  // Lụa satin (WebGL): màu bóng / màu vải / màu vệt sáng theo từng mẫu; máy không có WebGL dùng "Dải lụa" canvas
  var silkFx = function (cols) {
    return {
      init: function () { GLFX.mode = 'lua'; GLFX.silk = cols; this.useGl = GLFX.start(); if (!this.useGl) FX.lua.init.call(FX.lua); },
      draw: function (dt, t) { if (this.useGl && GLFX.gl) GLFX.draw(dt); else FX.lua.draw.call(FX.lua, dt, t); },
    };
  };
  FX.satindo = silkFx([[0.012, 0.0, 0.0], [0.62, 0.05, 0.035], [0.3, 0.1, 0.07]]);
  FX.satinnga = silkFx([[0.55, 0.55, 0.58], [0.96, 0.96, 0.97], [0.06, 0.06, 0.06]]);
  FX.saoroi = { mode: 'saoroi', init: FX.dembac.init, draw: FX.dembac.draw, fall: FX.dembac.fall }; // biến thể của Đêm kim tuyến bạc (xem GLFX)
  FX.saobang = { mode: 'saobang', init: FX.dembac.init, draw: FX.dembac.draw, fall: FX.dembac.fall }; // Đêm sao băng: dải trần dày + sàn sáng ở tâm + sao rơi
  function isVideo() { return !!(C.videos && C.videos[L.effect]); }
  function setupVideo() {
    var v = C.videos && C.videos[L.effect];
    stage.classList.toggle('st-thanh', !!(C.styles && C.styles[L.effect] === 'thanh'));
    stage.classList.toggle('st-lt', L.effect === 'satinnga'); // nền sáng: chữ sẫm, bóng chữ nhạt
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
    if (!/^(dembac|saoroi|saobang|thienha|satindo|satinnga)$/.test(L.effect)) GLFX.stop();
    if (L.effect !== 'tuyet') { var tp = document.getElementById('fxtop'); if (tp) tp.remove(); } // lớp tuyết gần (đè lên chữ) chỉ của hiệu ứng Tuyết rơi
    setupVideo();
    (isVideo() ? FX.none : FX[L.effect] || FX.sao).init();
  }

  var last = performance.now();
  var holding = false; // đang xuất MP4 (led-export.js tự vẽ từng khung) → vòng vẽ thường đứng yên
  function frame(now) {
    if (holding) { last = now; requestAnimationFrame(frame); return; }
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
        ((L.lunar || C.lunar) ? '<p class="lunar">' + esc(L.lunar || C.lunar) + '</p>' : '') + '</div>');
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
    // khung xem trước của trình sửa: bố mẹ hai bên còn trống → tên mẫu (mờ) để vẫn thấy cảnh "Hân hạnh đón tiếp"; chiếu thật thì trống là ẩn cảnh
    var smp = C.preview && !/[?&]xuat=/.test(location.search) && !g.father && !g.mother && !b.father && !b.mother;
    var fams = smp ? fam({ father: 'Ông Nguyễn Văn Trung', mother: 'Bà Trần Thị Yến' }, 'Nhà trai', 'groom').replace('class="fam"', 'class="fam smp"') + fam({ father: 'Ông Lê Văn Tuyến', mother: 'Bà Phạm Thị Minh' }, 'Nhà gái', 'bride').replace('class="fam"', 'class="fam smp"')
      : fam(g, 'Nhà trai', 'groom') + fam(b, 'Nhà gái', 'bride');
    if (L.slides.parents && fams) {
      out.push('<div data-k="parents" class="slide s-parents"><p class="title glow">Hân hạnh đón tiếp</p><div class="fams" data-fit>' + fams + '</div></div>');
    }
    if (L.slides.photo && C.photo) {
      out.push('<div data-k="photo" class="slide s-photo"><div class="photo" style="background-image:url(\'' + esc(C.photo) + '\')"></div>' +
        '<div class="pn">' + (L.kicker ? '<p class="kicker" style="margin-top:36px">' + esc(L.kicker) + '</p>' : '') +
        '<p class="photo-names glow" data-fit><span>' + gn + '</span> <span class="amp">&amp;</span> <span>' + bn + '</span></p></div></div>');
    }
    if (L.slides.message && L.message) {
      out.push('<div data-k="msg" class="slide s-msg"><p class="msg" data-e="led.message">' + keepWords(esc(L.message)) + '</p><p class="sign glow" data-fit>' + gn + ' &amp; ' + bn + '</p></div>');
    }
    if (!out.length) out.push('<div class="slide"><p class="names glow" data-fit>' + gn + ' <span class="amp">&amp;</span> ' + bn + '</p></div>');
    slidesEl.innerHTML = out.join('');
    slides = Array.prototype.slice.call(slidesEl.children);
    fitAll();
  }

  // thu nhỏ chữ cho vừa khung (tên dài, màn đứng)
  // cỡ chữ từng dòng người dùng chỉnh (L.sz = { lớp: hệ số }) — áp trước khi co chữ cho vừa màn
  var SZ = ['kicker', 'names', 'wd', 'bigdate', 'time', 'lunar', 'cd', 'cd-sub', 'title', 'lb', 'pp', 'ad', 'msg', 'sign', 'mono', 'hy']; // mono / hy: chữ lồng, chữ 囍 (theo cỡ chữ toàn màn)
  var szOf = function (el) { for (var i = 0; i < SZ.length; i++) if (el.classList.contains(SZ[i])) return SZ[i]; return ''; };
  function applySz() {
    Array.prototype.forEach.call(slidesEl.querySelectorAll('.' + SZ.join(',.')), function (el) {
      el.style.fontSize = '';
      var k = ((L.sz || {})[szOf(el)] || 1) * (typeof L.fs === 'number' ? L.fs : { nho: 0.85, lon: 1.15 }[L.fs] || 1); // cỡ từng dòng × cỡ chữ toàn màn
      if (k !== 1) el.style.fontSize = (parseFloat(getComputedStyle(el).fontSize) * k) + 'px';
    });
  }
  function fitAll() {
    // bề ngang tối đa của chữ theo cỡ chữ đã chọn: Nhỏ ~70% · Vừa ~80% · To ~90% · Cực to kín màn
    // (không thì tên dài luôn co kín bề ngang, chọn Nhỏ hay To trông như nhau — màn LED to ngoài trời thấy chữ quá lớn)
    var fsv = typeof L.fs === 'number' ? L.fs : { nho: 0.8, vua: 0.9, lon: 1, rat_lon: 1.15 }[L.fs] || 1;
    var max = (W - 2 * 110) * Math.max(0.6, Math.min(1, 0.7 + (fsv - 0.8) / 0.35 * 0.3));
    applySz();
    Array.prototype.forEach.call(slidesEl.querySelectorAll('[data-fit]'), function (el) {
      if (!szOf(el)) el.style.fontSize = '';
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
    stage.setAttribute('data-font', L.font || '');
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
  // - nằm trong khung xem trước của trang khác (lớp xem mẫu ở trang chủ): báo trang ngoài đóng lớp xem, KHÔNG lùi lịch sử
  //   (lịch sử của khung dùng chung với trang ngoài → history.back() đưa cả trang về trang trước đó, vd. Mẫu thiệp)
  // - mở ở tab mới (nút Toàn màn hình, Mở trình chiếu): đóng tab, về lại tab đã mở; trình duyệt không cho đóng thì quay về trang đó
  document.getElementById('back').addEventListener('click', function (e) {
    var ref = document.referrer, same = !!ref && ref.indexOf(location.origin + '/') === 0 && ref !== location.href;
    if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
    if (window.top !== window) { e.preventDefault(); try { parent.postMessage({ type: 'led-close' }, location.origin); } catch (er) { /* khung khác nguồn */ } return; }
    // - cùng tab: về đúng trang đã mở (không dùng history.back(): khung xem thử đổi mẫu trên trang trước cũng thêm mục lịch sử,
    //   lùi một bước có khi rơi vào trang khác); mở thẳng link, không có trang trước: về trang mặc định (href)
    e.preventDefault();
    var to = same ? ref : this.href;
    if (history.length > 1) { location.href = to; return; }
    try { window.close(); } catch (er) { /* không đóng được */ }
    setTimeout(function () { location.href = to; }, 150); // tab vẫn còn (trình duyệt không cho đóng) thì chuyển trang
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
  // trình sửa: khung xem trước chỉ để xem — sửa chữ, cỡ chữ ở bảng Nội dung bên trái (không bấm sửa trực tiếp trên màn nữa)
  if (false && C.preview && window.parent !== window && !C.final) {
    document.body.classList.add('can-edit');
    // thanh cỡ chữ nổi trên dòng vừa bấm: A− · 100% · A+ (giữ nguyên con trỏ đang gõ)
    var szBar = document.createElement('div'), szEl = null;
    szBar.className = 'szbar'; szBar.hidden = true;
    szBar.innerHTML = '<button data-d="-1" title="Chữ nhỏ hơn">A−</button><output></output><button data-d="1" title="Chữ to hơn">A+</button>';
    document.body.appendChild(szBar);
    var szShow = function () {
      // cảnh vừa dựng lại (trình sửa gửi cấu hình mới): tìm lại đúng dòng đó trên cảnh đang chiếu
      if (szEl && !szEl.isConnected) szEl = slides[cur] ? slides[cur].querySelector('.' + szOf(szEl)) : null;
      if (!szEl) { szBar.hidden = true; return; }
      var k = (L.sz || {})[szOf(szEl)] || 1, r = szEl.getBoundingClientRect();
      szBar.querySelector('output').textContent = Math.round(k * 100) + '%';
      szBar.hidden = false;
      var bw = szBar.offsetWidth, bh = szBar.offsetHeight;
      szBar.style.left = Math.max(6, Math.min(innerWidth - bw - 6, r.left + r.width / 2 - bw / 2)) + 'px';
      szBar.style.top = (r.top - bh - 8 >= 6 ? r.top - bh - 8 : Math.min(innerHeight - bh - 6, r.bottom + 8)) + 'px';
    };
    szBar.addEventListener('mousedown', function (e) { e.preventDefault(); }); // không làm mất chữ đang gõ
    szBar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-d]'); if (!b || !szEl) return;
      var key = szOf(szEl), sz = Object.assign({}, L.sz || {});
      var k = Math.round(Math.min(1.8, Math.max(0.6, (sz[key] || 1) + 0.1 * +b.getAttribute('data-d'))) * 10) / 10;
      sz[key] = k; L.sz = sz;
      fitAll(); szShow();
      try { window.parent.postMessage({ type: 'led-size', key: key, value: k }, location.origin); } catch (er) { /* bỏ qua */ }
    });
    document.addEventListener('click', function (e) {
      if (e.target.closest('.szbar')) return;
      var t = e.target.closest('.slide *'), el = null;
      while (t && t !== slidesEl) { if (szOf(t)) { el = t; break; } t = t.parentElement; }
      szEl = el;
      if (el && !paused) togglePause(); // dừng cảnh trong lúc chỉnh
      szShow();
    }, true);
    window.addEventListener('resize', function () { szBar.hidden = true; szEl = null; });
    slidesEl.addEventListener('click', function (e) {
      var t = e.target.closest('[data-e]');
      if (t && L.names && /^(groom|bride)\.name$/.test(t.getAttribute('data-e'))) t = null; // đã kích hoạt: tên đôi cố định, không sửa
      // bấm ngày / giờ → ô chọn ngày giờ; thứ, âm lịch chỉ chỉnh cỡ chữ
      if (!t) { if (e.target.closest('.bigdate, .time')) { if (!paused) togglePause(); try { window.parent.postMessage({ type: 'led-date' }, location.origin); } catch (er) { /* bỏ qua */ } } return; }
      if (!paused) togglePause(); // dừng cảnh trong lúc sửa
      // không gõ thẳng lên chữ (dễ lệch, cảnh tự chạy): báo trình sửa mở hộp nhập ngay cạnh dòng chữ này
      var rc = t.getBoundingClientRect();
      try { window.parent.postMessage({ type: 'led-edit', key: t.getAttribute('data-e'), rect: { left: rc.left, top: rc.top, width: rc.width, height: rc.height } }, location.origin); } catch (er) { /* bỏ qua */ }
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
  // từ ghép hay gặp trong lời cảm ơn không bị tách đôi khi xuống dòng ("gia / đình")
  function keepWords(t) {
    return String(t).replace(/(gia đình|chung vui|quý khách|cô dâu|chú rể|chúng tôi|chúng mình|hạnh phúc|trăm năm|lễ cưới|tiệc cưới|thành hôn|cảm ơn|tham dự|hiện diện|vinh hạnh)/gi, function (w) { return w.replace(/ /g, '\u00a0'); });
  }
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data) return;
    if (e.data.type === 'led-config') {
      if (editing) return; // đang gõ trên màn: không dựng lại cảnh (mất con trỏ)
      if (e.data.card) {
        var fx = (e.data.led && e.data.led.names) || L.names; // đã kích hoạt: giữ tên đôi cố định
        C.groom = fx ? Object.assign({}, e.data.card.groom, { name: fx.groom }) : e.data.card.groom;
        C.bride = fx ? Object.assign({}, e.data.card.bride, { name: fx.bride }) : e.data.card.bride;
        if (e.data.card.photo !== undefined) C.photo = e.data.card.photo;
      }
      // đang sửa (màn đứng yên): chữ mới hiện ngay, không mờ đi rồi hiện dần mỗi lần gõ
      var de = document.documentElement, inst = paused && !de.classList.contains('still');
      if (inst) de.classList.add('still');
      apply(e.data.led);
      if (inst) requestAnimationFrame(function () { requestAnimationFrame(function () { de.classList.remove('still'); }); });
      if (szBar && szEl) szShow();
    }
    if (e.data.type === 'led-goto') { if (szBar) { szBar.hidden = true; szEl = null; } show(e.data.index); restartTimer(); }
    if (e.data.type === 'led-pause' && !!e.data.paused !== paused) togglePause();
    // trình sửa báo vừa đổi ô nào: chữ đó trên màn sáng viền hồng một lúc cho dễ thấy chỗ vừa đổi
    if (e.data.type === 'led-mark') {
      var sel = e.data.key === 'date' || e.data.key === 'time' ? (e.data.key === 'date' ? '.slide.on .bigdate, .slide.on .wd, .slide.on .lunar' : '.slide.on .time') : '.slide.on [data-e="' + String(e.data.key).replace(/"/g, '') + '"]';
      var els = document.querySelectorAll(sel);
      Array.prototype.forEach.call(els, function (el) { el.classList.remove('marked'); void el.offsetWidth; el.classList.add('marked'); clearTimeout(el._mk); el._mk = setTimeout(function () { el.classList.remove('marked'); }, 1600); });
    }
  });

  // khung xem trước của trình sửa: cho /led/led-export.js (nạp khi bấm Tải MP4) đọc trạng thái và tự vẽ từng khung hình
  if (C.preview) window.__ledApi = {
    state: function () { return { W: W, H: H, K: K, L: L, slides: slides, stage: stage, canvas: canvas, ctx: ctx, vbg: vbg, gl: GLFX, slidesEl: slidesEl, trial: !!C.trial }; }, // trial: máy chủ quyết (chưa kích hoạt) → MP4 có chữ chìm
    fx: function () { return isVideo() ? FX.none : FX[L.effect] || FX.sao; },
    resetFx: resetFx,
    hold: function (on) { holding = !!on; if (on) paused = true; },
    // trình sửa (màn LED đã chốt) dựng thanh phát riêng: phát / dừng, tua, thời gian
    play: { pos: position, total: total, seek: function (t) { var de = document.documentElement; de.classList.add('still'); seekTo(t); tell(); requestAnimationFrame(function () { requestAnimationFrame(function () { de.classList.remove('still'); }); }); }, /* tua: chuyển cảnh ngay, không hiệu ứng */ paused: function () { return paused; }, toggle: togglePause, count: function () { return slides.length; }, seconds: function () { return L.seconds; }, keys: function () { return slides.map(function (s) { return s.getAttribute('data-k') || ''; }); } },
  };

  apply(L);
  show(0);
  if (!C.preview) wake();
  keepAwake();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
  requestAnimationFrame(frame);
  // Bản dùng thử: lớp chữ chìm "BẢN DÙNG THỬ" phủ khắp màn phải luôn hiện — bị xoá / ẩn / làm mờ (công cụ của trình duyệt) thì dựng lại ngay.
  if (C.trial && !C.demo) {
    var keepWm = function () {
      var w = stage.querySelector(':scope > .wmt');
      if (!w) { w = document.createElement('div'); w.className = 'wmt'; stage.appendChild(w); }
      var cs = getComputedStyle(w);
      if (w.hidden || cs.display === 'none' || cs.visibility !== 'visible' || +cs.opacity < 0.1 || (cs.filter && cs.filter !== 'none') || cs.backgroundImage === 'none' || w !== stage.lastElementChild) {
        w.hidden = false;
        if (w !== stage.lastElementChild) stage.appendChild(w);
        w.style.cssText = 'display:block!important;visibility:visible!important;opacity:.16!important;filter:none!important;z-index:2147483647!important;clip-path:none!important';
        w.style.removeProperty('background-image');
      }
      // bản chưa kích hoạt chỉ để xem trong khung của trình sửa / link xem thử; mở thẳng link chiếu ra cả trang thì phủ lớp "cần kích hoạt"
      if (window.top === window && !C.review) {
        var k = stage.querySelector(':scope > .wm-lock');
        if (!k) { k = document.createElement('div'); k.className = 'wm-lock'; stage.appendChild(k); }
        var KT = 'Cần kích hoạt để trình chiếu';
        if (k.textContent !== KT) k.textContent = KT;
        var ks = getComputedStyle(k);
        if (k.hidden || ks.display === 'none' || ks.visibility !== 'visible' || +ks.opacity < 0.5 || (ks.filter && ks.filter !== 'none'))
          k.style.cssText = 'display:grid!important;visibility:visible!important;opacity:1!important;filter:none!important;transform:none!important;z-index:2147483646!important';
      }
    };
    keepWm();
    setInterval(keepWm, 1500);
    if (window.MutationObserver) new MutationObserver(keepWm).observe(stage, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
  }
})();
