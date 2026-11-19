// Xuất màn hình LED thành MP4 ngay trên máy (không qua máy chủ). Trình sửa mở trang trình chiếu trong một khung ẩn
// đúng kích thước gốc (1920×1080, 1080×1920…), nạp file này vào khung rồi gọi window.ledExportMp4({ loops, onProgress }).
// Từng khung hình được vẽ lại offline (không chạy theo thời gian thật → không rớt khung, nét đều):
//   nền (màu / video) → lớp phủ video → hiệu ứng canvas 2D + WebGL → khung viền → chữ của cảnh → lớp tuyết gần.
// Chữ của mỗi cảnh chụp một lần thành ảnh (SVG foreignObject, nhúng sẵn CSS + phông chữ) rồi mờ dần / phóng nhẹ
// giống hệt lúc chiếu (.slide: opacity 1.4s ease, transform 9s ease-out). Cảnh đếm ngược bỏ qua (số chạy theo giờ thật).
// Chỉ dùng ở trình sửa (máy tính, Chrome / Edge) — trang chiếu ở nhà hàng không nạp file này.
(function () {
  'use strict';
  const api = window.__ledApi;
  const FPS = 30;
  const AVC = ['avc1.640028', 'avc1.4d0028', 'avc1.42e028'];

  // ---------- đường cong chuyển động giống CSS ----------
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t, sy = (t) => ((ay * t + by) * t + cy) * t, dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) { const d = dx(t); if (Math.abs(d) < 1e-6) break; t -= (sx(t) - x) / d; }
      return sy(Math.min(1, Math.max(0, t)));
    };
  }
  const ease = bezier(0.25, 0.1, 0.25, 1), easeOut = bezier(0, 0, 0.58, 1);
  const FADE = 1.4, ZOOM = 9, Z0 = 1.035;

  const toDataUrl = (blob) => new Promise((ok, fail) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = fail; r.readAsDataURL(blob); });
  const loadScript = (src) => new Promise((ok, fail) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => fail(new Error('Không tải được ' + src)); document.head.appendChild(s); });
  const breathe = () => new Promise((ok) => { const ch = new MessageChannel(); ch.port1.onmessage = () => ok(); ch.port2.postMessage(0); });

  // ---------- CSS của trang (led.css + phông Google nhúng thẳng dữ liệu) ----------
  async function pageCss(families) {
    let base = '', fonts = '';
    for (const l of document.querySelectorAll('link[rel=stylesheet]')) {
      const t = await fetch(l.href).then((r) => r.text());
      if (!/fonts\.googleapis\.com/.test(l.href)) { base += t + '\n'; continue; }
      // chỉ những phông các cảnh đang dùng (đủ mọi kiểu đậm / nghiêng / bảng chữ của phông đó)
      const blocks = (t.match(/@font-face\s*{[^}]*}/g) || []).filter((b) => {
        const m = /font-family:\s*['"]?([^;'"]+)/.exec(b);
        return m && families.has(m[1].trim().toLowerCase());
      });
      const urls = [...new Set(blocks.join('').match(/url\([^)]+\)/g) || [])];
      const data = await Promise.all(urls.map(async (u) => toDataUrl(await fetch(u.slice(4, -1).replace(/["']/g, '')).then((r) => r.blob()))));
      fonts += blocks.map((b) => { urls.forEach((u, i) => { b = b.split(u).join(`url(${data[i]})`); }); return b; }).join('\n') + '\n';
    }
    return { base, full: fonts + base };
  }
  function usedFamilies(root) {
    const set = new Set();
    root.querySelectorAll('*').forEach((el) => getComputedStyle(el).fontFamily.split(',').forEach((f) => set.add(f.replace(/["']/g, '').trim().toLowerCase())));
    return set;
  }

  // ---------- chụp một lớp DOM thành ảnh ----------
  async function snap(node, css, W, H) {
    const wrap = document.createElement('div');
    // ảnh chụp không có <body> của trang → chép phông / cỡ chữ gốc của body vào khung bọc (chữ thừa hưởng như khi chiếu)
    const b = getComputedStyle(document.body);
    wrap.style.cssText = `width:${W}px;height:${H}px;overflow:hidden;margin:0;font-family:${b.fontFamily};font-size:${b.fontSize};line-height:${b.lineHeight};-webkit-font-smoothing:antialiased`;
    const sty = document.createElement('style'); sty.textContent = css;
    wrap.append(sty, node);
    const xml = new XMLSerializer().serializeToString(wrap);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><foreignObject x="0" y="0" width="100%" height="100%">${xml}</foreignObject></svg>`;
    const img = new Image();
    // data: URL (không dùng blob:) — Chrome coi ảnh SVG foreignObject từ blob: là "tainted", VideoFrame từ chối
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    await img.decode();
    // phông nhúng đôi khi chưa kịp áp ở lần vẽ đầu → vẽ thử một lần rồi đợi chút cho chắc
    const c = document.createElement('canvas'); c.width = 8; c.height = 8; c.getContext('2d').drawImage(img, 0, 0, 8, 8);
    await new Promise((ok) => setTimeout(ok, 120));
    return img;
  }

  window.ledExportMp4 = async function (opts) {
    opts = opts || {};
    const prog = opts.onProgress || function () {};
    if (!api) throw new Error('Trang trình chiếu chưa sẵn sàng');
    if (!window.VideoEncoder || !window.VideoFrame) throw new Error('Trình duyệt chưa hỗ trợ xuất video — dùng Chrome hoặc Edge bản mới trên máy tính nhé');
    if (!window.Mp4Muxer) await loadScript('/vendor/mp4-muxer.js');
    api.hold(true);
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const st = api.state(), W = st.W, H = st.H, L = st.L;
      const keep = st.slides.map((s, i) => i).filter((i) => st.slides[i].getAttribute('data-k') !== 'countdown');
      if (!keep.length) throw new Error('Màn LED chưa có cảnh nào để xuất — bật ít nhất một cảnh (Tên đôi, Ngày cưới…)');
      prog(0.01, 'Đang chuẩn bị chữ và phông');
      const css = await pageCss(usedFamilies(st.slidesEl));

      // khung sân khấu rỗng: giữ id / lớp / biến màu của #stage để CSS áp đúng, bỏ vị trí và thu phóng khi chiếu
      const shell = (withBg) => {
        const c = st.stage.cloneNode(false);
        Object.assign(c.style, { position: 'relative', left: '0', top: '0', transform: 'none', width: W + 'px', height: H + 'px', margin: '0' });
        if (!withBg) c.style.background = 'transparent';
        return c;
      };
      const bgImg = await snap(shell(true), css.base, W, H);
      let shadeImg = null;
      if (st.vbg) {
        const s = shell(false), w = st.vbg.wrap.cloneNode(false), sh = st.vbg.wrap.querySelector('.vshade');
        Object.assign(w.style, { backgroundImage: 'none', background: 'transparent' });
        if (sh) w.appendChild(sh.cloneNode(true));
        s.appendChild(w);
        shadeImg = await snap(s, css.base, W, H);
      }
      let frameImg = null;
      const fr = st.stage.querySelector('#frame');
      if (fr && getComputedStyle(fr).display !== 'none') { const s = shell(false); s.appendChild(fr.cloneNode(true)); frameImg = await snap(s, css.base, W, H); }
      const texts = [];
      for (let n = 0; n < keep.length; n++) {
        const s = shell(false), box = st.slidesEl.cloneNode(false), sl = st.slides[keep[n]].cloneNode(true);
        sl.classList.add('on');
        Object.assign(sl.style, { transition: 'none', opacity: '1', transform: 'none' });
        box.appendChild(sl); s.appendChild(box);
        texts.push(await snap(s, css.full, W, H));
        prog(0.02 + 0.06 * (n + 1) / keep.length, 'Đang chụp chữ từng cảnh');
      }

      // ---------- vẽ từng khung ----------
      const out = document.createElement('canvas'); out.width = W; out.height = H;
      const o = out.getContext('2d');
      const fx = api.fx(), K = st.K, S = L.seconds, N = keep.length, total = Math.round(N * S * FPS);
      api.resetFx();
      const T0 = performance.now() / 1000;
      const runFx = (t) => {
        st.ctx.setTransform(K, 0, 0, K, 0, 0);
        st.ctx.clearRect(0, 0, W, H);
        fx.draw(1 / FPS, T0 + t);
        st.ctx.globalAlpha = 1;
      };
      for (let i = 0; i < FPS * 4; i++) runFx(i / FPS - 4); // chạy trước 4 giây cho hạt / tuyết phủ kín màn, khỏi bắt đầu từ màn trống
      const video = st.vbg && st.vbg.a;
      if (video) { st.vbg.b.pause(); video.pause(); if (video.readyState < 2) await new Promise((ok) => video.addEventListener('loadeddata', ok, { once: true })); }
      const seekVideo = (t) => new Promise((ok) => {
        const d = video.duration || 1, at = (t * (video.playbackRate || 1)) % Math.max(0.1, d - 0.1);
        if (Math.abs(video.currentTime - at) < 1e-3) return ok();
        video.addEventListener('seeked', () => ok(), { once: true });
        video.currentTime = at;
      });
      const drawCover = (v) => {
        const vw = v.videoWidth || W, vh = v.videoHeight || H, k = Math.max(W / vw, H / vh);
        o.drawImage(v, (W - vw * k) / 2, (H - vh * k) / 2, vw * k, vh * k);
      };
      const zoomAt = (on) => Z0 - (Z0 - 1) * easeOut(Math.min(1, on / ZOOM)); // độ phóng sau `on` giây kể từ lúc cảnh hiện
      const drawText = (img, alpha, scale) => {
        if (alpha <= 0.001) return;
        o.save(); o.globalAlpha = alpha;
        o.translate(W / 2, H / 2); o.scale(scale, scale); o.drawImage(img, -W / 2, -H / 2, W, H);
        o.restore();
      };
      const top = () => { const c = document.getElementById('fxtop'); return c && c.isConnected ? c : null; };

      async function render(i) {
        const t = i / FPS;
        o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1;
        o.clearRect(0, 0, W, H);
        o.drawImage(bgImg, 0, 0, W, H);
        if (video) { await seekVideo(t); drawCover(video); if (shadeImg) o.drawImage(shadeImg, 0, 0, W, H); }
        runFx(t);
        o.drawImage(st.canvas, 0, 0, W, H);
        const gl = st.gl; if (gl && gl.gl && gl.cv && gl.cv.isConnected) o.drawImage(gl.cv, 0, 0, W, H);
        if (frameImg) o.drawImage(frameImg, 0, 0, W, H);
        if (N === 1) drawText(texts[0], 1, 1);
        else {
          const j = Math.floor(t / S) % N, tau = t - Math.floor(t / S) * S, p = (j - 1 + N) % N;
          const sOff = zoomAt(S); // cảnh trước lúc vừa tắt
          drawText(texts[p], 1 - ease(Math.min(1, tau / FADE)), sOff + (Z0 - sOff) * easeOut(Math.min(1, tau / ZOOM)));
          drawText(texts[j], ease(Math.min(1, tau / FADE)), zoomAt(tau));
        }
        const tp = top(); if (tp) o.drawImage(tp, 0, 0, W, H);
      }

      // ---------- mã hoá H.264 ----------
      const chunks = []; let meta = null, failed = null;
      const enc = new VideoEncoder({
        output: (chunk, m) => { if (!meta && m && m.decoderConfig) meta = m; const b = new Uint8Array(chunk.byteLength); chunk.copyTo(b); chunks.push({ data: b, type: chunk.type, ts: chunk.timestamp, dur: chunk.duration || Math.round(1e6 / FPS) }); },
        error: (e) => { failed = e; },
      });
      // 10 Mbps: hạt kim tuyến / tuyết li ti nhiều chi tiết, bitrate thấp sẽ nhoè
      const base = { width: W, height: H, bitrate: 10e6, bitrateMode: 'variable', framerate: FPS, avc: { format: 'avc' } };
      let cfg = null;
      for (const codec of AVC) { const c = Object.assign({ codec }, base); if ((await VideoEncoder.isConfigSupported(c)).supported) { cfg = c; break; } }
      if (!cfg) throw new Error('Trình duyệt chưa hỗ trợ mã hoá H.264 — dùng Chrome hoặc Edge bản mới nhé');
      enc.configure(cfg);
      for (let i = 0; i < total; i++) {
        if (failed) throw failed;
        while (enc.encodeQueueSize > 6) await breathe();
        await render(i);
        const f = new VideoFrame(out, { timestamp: Math.round(i * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
        enc.encode(f, { keyFrame: i % (FPS * 2) === 0 }); // khung khoá 2 giây/lần, khung đầu luôn là khung khoá → nối vòng được
        f.close();
        if (i % 10 === 0) prog(0.08 + 0.84 * i / total, 'Đang dựng hình');
        if (i % 15 === 0) await breathe();
      }
      await enc.flush(); enc.close();
      if (failed) throw failed;

      // ---------- đóng gói MP4 (lặp lại vòng nếu cần dài hơn) ----------
      prog(0.94, 'Đang đóng gói MP4');
      const loops = Math.max(1, Math.min(60, opts.loops | 0 || 1)), loopUs = Math.round(total * 1e6 / FPS);
      const muxer = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: 'avc', width: W, height: H, frameRate: FPS }, fastStart: 'in-memory', firstTimestampBehavior: 'offset' });
      for (let k = 0; k < loops; k++) chunks.forEach((c, j) => muxer.addVideoChunkRaw(c.data, c.type, c.ts + k * loopUs, c.dur, k === 0 && j === 0 ? meta : undefined));
      muxer.finalize();
      prog(1, 'Xong');
      return { blob: new Blob([muxer.target.buffer], { type: 'video/mp4' }), width: W, height: H, seconds: loops * N * S, skipped: st.slides.length - N };
    } finally {
      api.hold(false);
    }
  };
})();
