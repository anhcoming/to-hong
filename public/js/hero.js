// Đầu trang chủ: chọn / kéo thả ảnh cưới ngay tại trang chủ.
// Ảnh của khách bay vào khung thiệp (chỉ ảnh của họ, không hiện thiệp mẫu) trong lúc trang chủ ĐỌC ẢNH THẬT: thu nhỏ + phân tích màu
// (public/js/photoprep.js, cùng đoạn mã trang /goi-y dùng), cất vào kho tạm IndexedDB "cuoinha-goiy" (khoá "photos"). Xong hết mới
// sang /goi-y — trang đó mở ra là có sẵn ảnh, tự gợi ý mẫu, khách không phải chọn lại. Ảnh không gửi lên máy chủ.
(function () {
  'use strict';
  var hb = document.getElementById('hb');
  if (!hb || !window.PhotoPrep) return;
  var P = window.PhotoPrep, idb = P.idb;
  var stage = document.getElementById('stage'), fan = document.getElementById('fan'), file = document.getElementById('heroFile');
  var go = document.getElementById('heroGo'), lbl = document.getElementById('heroLbl'), goText = lbl.textContent, msg = document.getElementById('heroMsg');
  var MAX = 12, urls = [], busy = false;
  var say = function (t) { msg.textContent = t || ''; msg.hidden = !t; };
  var wait = function (ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); };

  function pick() { if (!busy) file.click(); }

  // đọc từng ảnh: thu nhỏ rồi phân tích màu; báo tiến độ trên nút
  function prep(list) {
    var out = [], i = 0;
    var one = function () {
      if (i >= list.length) return Promise.resolve(out);
      var f = list[i++];
      lbl.textContent = 'Đang đọc ảnh ' + i + '/' + list.length + '…';
      return P.shrink(f).then(function (s) {
        var url = URL.createObjectURL(s.blob);
        return P.analyze(url).then(function (feat) {
          out.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), blob: s.blob, w: s.w, h: s.h, feat: feat });
        }).finally(function () { URL.revokeObjectURL(url); });
      }).catch(function () { /* ảnh lỗi: bỏ qua */ }).then(one);
    };
    return one();
  }
  // đưa trang gợi ý (HTML, mã, danh sách mẫu) vào bộ nhớ đệm để mở ra là chạy ngay; chờ tối đa 5 giây
  function warm() {
    var get = function (u) { return fetch(u, { credentials: 'same-origin' }).catch(function () {}); };
    return Promise.race([Promise.all([get('/goi-y'), get('/js/photoprep.js'), get('/js/suggest.js'), get('/css/site.css'), get('/api/meta')]), wait(5000)]);
  }
  function reset(text) {
    busy = false; hb.classList.remove('busy'); go.disabled = false; lbl.textContent = goText; say(text);
  }

  function take(files) {
    if (busy) return;
    var list = Array.prototype.filter.call(files || [], function (f) { return /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name); }).slice(0, MAX);
    if (!list.length) return say('Bạn chọn ảnh JPG, PNG hoặc ảnh chụp từ điện thoại nhé.');
    busy = true; say('');
    // ảnh của khách bay vào khung ngay lập tức (ảnh gốc, chưa cần đọc xong)
    urls.forEach(URL.revokeObjectURL);
    urls = list.slice(0, 3).map(function (f) { return URL.createObjectURL(f); });
    var u = function (i) { return urls[i % urls.length]; };
    var set = { p0: u(1), p1: u(2), p2: u(0) };
    fan.querySelectorAll('img[data-k]').forEach(function (img) { if (set[img.dataset.k]) img.src = set[img.dataset.k]; });
    fan.classList.add('restart'); void fan.offsetWidth; fan.classList.remove('restart');
    hb.classList.add('busy');
    go.disabled = true;
    var t0 = Date.now(), reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
    prep(list).then(function (photos) {
      if (!photos.length) return reset('Không đọc được ảnh nào — bạn thử ảnh JPG, PNG hoặc chụp màn hình ảnh đó nhé.');
      lbl.textContent = 'Đang tìm mẫu hợp ảnh của bạn…';
      return idb.set('photos', photos).then(function () { return idb.set('fresh', 1); }).then(function () { return idb.del('incoming'); })
        .then(function () { return idb.get('photos'); }).then(function (saved) {
          // kho tạm bị chặn (vd. duyệt ẩn danh): ảnh không giữ được → sang /goi-y để chọn lại, không bỏ kẹt ở đây
          return Promise.all([warm(), wait(reduce ? 0 : Math.max(0, 1600 - (Date.now() - t0)))]).then(function () {
            if (!Array.isArray(saved) || !saved.length) idb.del('fresh');
            location.href = '/goi-y';
          });
        });
    }).catch(function () { reset('Chưa đọc được ảnh, bạn thử lại nhé.'); });
  }

  stage.addEventListener('click', pick);
  stage.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  go.addEventListener('click', pick);
  // bấm Quay lại từ /goi-y (trang được trình duyệt giữ nguyên trong bộ nhớ): trả nút về như cũ
  addEventListener('pageshow', function (e) { if (e.persisted) reset(''); });
  file.addEventListener('change', function () { take(file.files); file.value = ''; });

  // kéo ảnh vào bất kỳ đâu trên trang chủ: khung hoạt hình hiện viền "Thả ảnh vào đây"
  var isFiles = function (e) { return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0; };
  var depth = 0;
  document.addEventListener('dragenter', function (e) { if (!isFiles(e)) return; depth++; document.body.classList.add('drag'); });
  document.addEventListener('dragleave', function (e) { if (!isFiles(e)) return; if (--depth <= 0) { depth = 0; document.body.classList.remove('drag'); } });
  document.addEventListener('dragover', function (e) { if (isFiles(e)) e.preventDefault(); });
  document.addEventListener('drop', function (e) {
    if (!isFiles(e)) return;
    e.preventDefault(); depth = 0; document.body.classList.remove('drag');
    take(e.dataTransfer.files);
    if (hb.getBoundingClientRect().bottom < 80) hb.scrollIntoView({ behavior: 'smooth' }); // thả lúc đã cuộn xuống: đưa về chỗ hoạt hình
  });
})();
