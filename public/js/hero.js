// Đầu trang chủ: chọn / kéo thả ảnh cưới ngay tại trang chủ.
// Ảnh của khách bay vào khung "Đang dựng thiệp…" của hoạt hình rồi tự sang /goi-y.
// Ảnh được cất vào đúng kho tạm của trang gợi ý (IndexedDB "cuoinha-goiy", khoá "incoming") — /goi-y (suggest.js) đọc ra
// và gợi ý mẫu luôn, khách không phải chọn lại. Ảnh không gửi lên máy chủ.
(function () {
  'use strict';
  var hb = document.getElementById('hb');
  if (!hb) return;
  var stage = document.getElementById('stage'), fan = document.getElementById('fan'), file = document.getElementById('heroFile');
  var go = document.getElementById('heroGo'), goText = go.textContent;
  var MAX = 12, urls = [], saving = null;

  function save(list) {
    return new Promise(function (ok) {
      try {
        var r = indexedDB.open('cuoinha-goiy', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
        r.onerror = function () { ok(false); };
        r.onsuccess = function () {
          try {
            var tx = r.result.transaction('kv', 'readwrite');
            tx.objectStore('kv').put(list, 'incoming');
            tx.oncomplete = function () { ok(true); };
            tx.onerror = tx.onabort = function () { ok(false); };
          } catch (e) { ok(false); }
        };
      } catch (e) { ok(false); } // duyệt ẩn danh / trình duyệt chặn: sang /goi-y rồi chọn lại
    });
  }

  function pick() { file.click(); }
  function take(files) {
    if (hb.classList.contains('busy')) return;
    var list = Array.prototype.filter.call(files || [], function (f) { return /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name); }).slice(0, MAX);
    if (!list.length) return;
    saving = save(list);
    urls.forEach(URL.revokeObjectURL);
    urls = list.map(function (f) { return URL.createObjectURL(f); });
    // ảnh của khách bay vào khung "Đang dựng thiệp…"; tới lúc khung loé sáng thì sang /goi-y — nơi dựng thiệp thật
    // bằng các mẫu đang bán với chính ảnh này (5 thẻ bung ra ở trang chủ chỉ là ảnh bìa mẫu, không ghép ảnh khách vào)
    var u = function (i) { return urls[i % urls.length]; };
    var set = { p0: u(1), p1: u(2), p2: u(0) };
    fan.querySelectorAll('img[data-k]').forEach(function (img) { img.src = set[img.dataset.k]; });
    fan.classList.add('restart'); void fan.offsetWidth; fan.classList.remove('restart');
    hb.classList.add('busy');
    go.disabled = true;
    go.textContent = 'Đang dựng thiệp của bạn…';
    var reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
    setTimeout(next, reduce ? 300 : 3300);
  }
  function next() { (saving || Promise.resolve()).then(function () { location.href = '/goi-y'; }); }

  stage.addEventListener('click', pick);
  stage.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  go.addEventListener('click', pick);
  // bấm Quay lại từ /goi-y (trang được trình duyệt giữ nguyên trong bộ nhớ): trả nút về như cũ
  addEventListener('pageshow', function (e) { if (e.persisted) { hb.classList.remove('busy'); go.disabled = false; go.textContent = goText; } });
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
