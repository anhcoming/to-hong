// Đọc ảnh cưới trong trình duyệt, dùng chung cho trang chủ (hero.js) và trang gợi ý (suggest.js):
//   idb       — kho tạm IndexedDB "cuoinha-goiy" (ảnh khách chọn, tên, ngày cưới…); ảnh KHÔNG rời máy
//   shrink    — thu nhỏ ảnh (cạnh dài 1600px, JPEG)
//   analyze   — đặc điểm ảnh (màu, độ sáng, vùng da, độ nét) để chọn mẫu hợp
(function () {
  'use strict';
  // ---------- kho tạm trong trình duyệt ----------
  var idb = (function () {
    var p = null;
    function open() {
      if (p) return p;
      p = new Promise(function (ok, no) {
        var r = indexedDB.open('cuoinha-goiy', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
        r.onsuccess = function () { ok(r.result); };
        r.onerror = function () { no(r.error); };
      });
      return p;
    }
    function run(mode, fn) {
      return open().then(function (db) {
        return new Promise(function (ok, no) {
          var tx = db.transaction('kv', mode), rq = fn(tx.objectStore('kv'));
          tx.oncomplete = function () { ok(rq && rq.result); };
          tx.onerror = tx.onabort = function () { no(tx.error); };
        });
      });
    }
    return {
      get: function (k) { return run('readonly', function (s) { return s.get(k); }).catch(function () { return undefined; }); },
      set: function (k, v) { return run('readwrite', function (s) { return s.put(v, k); }).catch(function () { /* duyệt ẩn danh / hết chỗ: vẫn dùng được, chỉ không nhớ */ }); },
      del: function (k) { return run('readwrite', function (s) { return s.delete(k); }).catch(function () {}); },
    };
  })();

  // ---------- đọc ảnh ----------
  function loadImg(url) {
    return new Promise(function (ok, no) {
      var im = new Image();
      var stop = setTimeout(function () { no(new Error('Đọc ảnh quá lâu')); }, 30000);
      im.onload = function () { clearTimeout(stop); ok(im); };
      im.onerror = function () { clearTimeout(stop); no(new Error('Không đọc được ảnh này')); };
      im.src = url;
    });
  }
  // thu nhỏ ảnh (cạnh dài 1600px, JPEG) — nhẹ máy khi xem thử, và là bản sẽ tải lên sau này
  // Ưu tiên createImageBitmap: trình duyệt giải mã ảnh gốc (12MP, vài MB) ở luồng riêng thay vì chặn luồng chính
  // → hoạt hình ảnh bay vào khung ở trang chủ không bị giật. Máy cũ không có thì quay về cách đọc bằng <img>.
  function shrink(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: 'from-image' }).then(function (bm) {
        var sc = Math.min(1, 1600 / Math.max(bm.width, bm.height));
        var c = document.createElement('canvas');
        c.width = Math.round(bm.width * sc); c.height = Math.round(bm.height * sc);
        c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height);
        if (bm.close) bm.close();
        return new Promise(function (ok, no) {
          c.toBlob(function (b) { b ? ok({ blob: b, w: c.width, h: c.height }) : no(new Error('Không đọc được ảnh này')); }, 'image/jpeg', 0.85);
        });
      }).catch(function () { return shrinkImg(file); });
    }
    return shrinkImg(file);
  }
  // ảnh nhỏ (cạnh dài ~280px) để hiện / cho bay trong hoạt hình — rất nhẹ, không phải vẽ ảnh gốc mỗi khung hình
  function thumb(file, side) {
    side = side || 280;
    if (!window.createImageBitmap) return Promise.resolve(URL.createObjectURL(file));
    return createImageBitmap(file, { imageOrientation: 'from-image' }).then(function (bm) {
      var sc = Math.min(1, side / Math.max(bm.width, bm.height)), c = document.createElement('canvas');
      c.width = Math.round(bm.width * sc); c.height = Math.round(bm.height * sc);
      c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height);
      if (bm.close) bm.close();
      return new Promise(function (ok) { c.toBlob(function (b) { ok(b ? URL.createObjectURL(b) : URL.createObjectURL(file)); }, 'image/jpeg', 0.8); });
    }).catch(function () { return URL.createObjectURL(file); });
  }
  function shrinkImg(file) {
    var url = URL.createObjectURL(file);
    return loadImg(url).then(function (im) {
      var sc = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight));
      var c = document.createElement('canvas');
      c.width = Math.round(im.naturalWidth * sc); c.height = Math.round(im.naturalHeight * sc);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      return new Promise(function (ok, no) {
        c.toBlob(function (b) { b ? ok({ blob: b, w: c.width, h: c.height }) : no(new Error('Không đọc được ảnh này')); }, 'image/jpeg', 0.85);
      });
    }).finally(function () { URL.revokeObjectURL(url); });
  }
  function rgb2hsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, h = 0;
    if (d) {
      if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    return [h, mx ? d / mx : 0, mx];
  }
  // Đặc điểm một ảnh (đọc trên bản 64px): biểu đồ màu, độ sáng, vùng da người (đoán chỗ có mặt), độ nét
  // kích thước bản 64px giữ tỉ lệ ảnh
  function smallSize(W, H) {
    var S = 64;
    return [W >= H ? S : Math.max(8, Math.round(S * W / H)), H > W ? S : Math.max(8, Math.round(S * H / W))];
  }
  function analyze(url) {
    return loadImg(url).then(function (im) {
      var sz = smallSize(im.naturalWidth, im.naturalHeight), w = sz[0], h = sz[1];
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0, w, h);
      return features(g.getImageData(0, 0, w, h).data, w, h);
    });
  }
  function features(px, w, h) {
    {
      var n = w * h;
      var hist = new Array(12).fill(0), lum = 0, colorful = 0, skin = 0, sx = 0, sy = 0, sharp = 0;
      var L = new Float32Array(n);
      for (var i = 0; i < n; i++) {
        var r = px[i * 4], gg = px[i * 4 + 1], b = px[i * 4 + 2];
        var l = (0.299 * r + 0.587 * gg + 0.114 * b) / 255; L[i] = l; lum += l;
        var hsv = rgb2hsv(r, gg, b);
        if (hsv[1] > 0.28 && hsv[2] > 0.2 && hsv[2] < 0.97) { hist[Math.floor(hsv[0] / 30) % 12] += hsv[1] * hsv[2]; colorful++; }
        // màu da (ước lượng thô): đỏ trội vừa phải, không quá bão hoà — để đoán vị trí khuôn mặt khi cắt ảnh
        if (r > 95 && gg > 40 && b > 20 && r > gg && gg > b && r - gg > 12 && r - b < 130 && hsv[1] > 0.12 && hsv[1] < 0.62 && hsv[0] < 40) {
          skin++; sx += i % w; sy += Math.floor(i / w);
        }
      }
      for (var y = 1; y < h - 1; y++) for (var x = 1; x < w - 1; x++) { var k = y * w + x; sharp += Math.abs(4 * L[k] - L[k - 1] - L[k + 1] - L[k - w] - L[k + w]); }
      return {
        hist: hist, lum: lum / n, colorful: colorful / n, sharp: sharp / n,
        skin: skin / n, cx: skin ? sx / skin / w : 0.5, cy: skin ? sy / skin / h : 0.4,
      };
    }
  }

  // ---------- luồng phụ (Web Worker): giải mã + thu nhỏ + nén JPEG + phân tích màu ngoài luồng chính ----------
  // Ảnh điện thoại 12MP: giải mã, vẽ thu nhỏ, nén lại đều nặng; làm ở luồng chính thì hoạt hình / cuộn trang bị giật khi khách
  // chọn nhiều ảnh. Trình duyệt có OffscreenCanvas thì làm hết trong luồng phụ; không có (máy cũ) thì quay về cách cũ.
  var isWorker = typeof window === 'undefined';
  if (isWorker) {
    var draw = function (bm, W, H) {
      var c = new OffscreenCanvas(W, H);
      c.getContext('2d').drawImage(bm, 0, 0, W, H);
      return c;
    };
    self.onmessage = function (e) {
      var m = e.data;
      createImageBitmap(m.file, { imageOrientation: 'from-image' }).then(function (bm) {
        var W = bm.width, H = bm.height, out = {};
        var side = m.op === 'thumb' ? (m.side || 280) : 1600;
        var sc = Math.min(1, side / Math.max(W, H)), w = Math.round(W * sc), h = Math.round(H * sc);
        var c = draw(bm, w, h);
        var job = c.convertToBlob({ type: 'image/jpeg', quality: m.op === 'thumb' ? 0.8 : 0.85 }).then(function (b) { out.blob = b; out.w = w; out.h = h; });
        if (m.op === 'prep') {
          var sz = smallSize(W, H), g = draw(bm, sz[0], sz[1]).getContext('2d', { willReadFrequently: true });
          out.feat = features(g.getImageData(0, 0, sz[0], sz[1]).data, sz[0], sz[1]);
        }
        return job.then(function () { if (bm.close) bm.close(); self.postMessage({ id: m.id, ok: out }); });
      }).catch(function (err) { self.postMessage({ id: m.id, err: String(err && err.message || err) }); });
    };
    return;
  }

  var worker = null, jobs = {}, seq = 0;
  function useWorker() {
    if (worker === false) return null;
    if (worker) return worker;
    try {
      if (!window.Worker || !window.OffscreenCanvas || !window.createImageBitmap || !OffscreenCanvas.prototype.convertToBlob) throw 0;
      worker = new Worker('/js/photoprep.js');
      worker.onmessage = function (e) { var j = jobs[e.data.id]; if (!j) return; delete jobs[e.data.id]; e.data.err ? j.no(new Error(e.data.err)) : j.ok(e.data.ok); };
      worker.onerror = function () { worker.terminate(); worker = false; Object.keys(jobs).forEach(function (k) { jobs[k].no(new Error('worker')); delete jobs[k]; }); };
    } catch (e) { worker = false; }
    return worker || null;
  }
  function ask(op, file, extra) {
    var w = useWorker();
    if (!w) return Promise.reject(new Error('no-worker'));
    return new Promise(function (ok, no) { var id = ++seq; jobs[id] = { ok: ok, no: no }; w.postMessage(Object.assign({ id: id, op: op, file: file }, extra || {})); });
  }
  // thu nhỏ + phân tích một ảnh trong một lần đọc → { blob, w, h, feat }
  function prep(file) {
    return ask('prep', file).catch(function () {
      return shrink(file).then(function (s) {
        var url = URL.createObjectURL(s.blob);
        return analyze(url).then(function (feat) { s.feat = feat; return s; }).finally(function () { URL.revokeObjectURL(url); });
      });
    });
  }
  var thumbMain = thumb;
  thumb = function (file, side) {
    return ask('thumb', file, { side: side }).then(function (r) { return URL.createObjectURL(r.blob); }, function () { return thumbMain(file, side); });
  };

  window.PhotoPrep = { idb: idb, loadImg: loadImg, shrink: shrink, thumb: thumb, prep: prep, rgb2hsv: rgb2hsv, analyze: analyze, features: features };
})();
