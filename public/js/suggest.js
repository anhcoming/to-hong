// Trang /goi-y: thả ảnh cưới vào → trình duyệt tự đọc màu ảnh, chọn các mẫu thiệp hợp (5 mẫu một lần, bấm "Xem thêm" để hiện tiếp) và hiện ngay với ảnh của khách.
// Ảnh KHÔNG rời máy cho tới khi khách bấm "Dùng thiệp này" và đăng nhập: bản xem thử lấy ảnh thẳng từ bộ nhớ trình duyệt
// (blob:), và ảnh được cất tạm trong IndexedDB để tải lại trang / lỡ đóng tab vẫn còn.
// Trình sửa thiệp (editor.js → adoptSuggested) đọc lại đúng kho này để đưa ảnh vào thiệp.
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var MAX = 12; // số ảnh tối đa đem đi gợi ý (1 bìa + album)

  // ---------- đọc ảnh, kho tạm: dùng chung với trang chủ (public/js/photoprep.js) ----------
  var P = window.PhotoPrep, idb = P.idb, loadImg = P.loadImg, shrink = P.shrink, rgb2hsv = P.rgb2hsv, analyze = P.analyze;

  // ---------- chọn ảnh bìa, điểm lấy nét ----------
  function coverScore(p) {
    var f = p.feat, portrait = p.h > p.w * 1.05 ? 0.25 : p.w > p.h * 1.3 ? -0.1 : 0.1;
    return portrait + Math.min(0.3, f.skin * 2.5) + Math.min(0.25, f.sharp * 4) + 0.2 * (1 - Math.min(1, Math.abs(f.lum - 0.55) * 2.2));
  }
  function focus(p) {
    var f = p.feat;
    if (f.skin < 0.015) return [50, 35]; // không đoán được: người thường đứng giữa, hơi lệch lên trên
    return [Math.round(Math.min(80, Math.max(20, f.cx * 100))), Math.round(Math.min(70, Math.max(10, f.cy * 100 - 6)))];
  }
  // bìa = ảnh điểm cao nhất; album = các ảnh còn lại theo thứ tự khách chọn
  function assign(photos) {
    if (!photos.length) return [];
    var best = photos.slice().sort(function (a, b) { return coverScore(b) - coverScore(a); })[0];
    var out = [{ key: 'cover', p: best }];
    photos.filter(function (p) { return p !== best; }).slice(0, MAX - 1).forEach(function (p, i) { out.push({ key: 'photos.' + i, p: p }); });
    return out;
  }

  // ---------- ghép ảnh với mẫu ----------
  function hex2hsv(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return [0, 0, 0.5];
    var v = parseInt(m[1], 16);
    return rgb2hsv(v >> 16, (v >> 8) & 255, v & 255);
  }
  var HUES = ['đỏ', 'cam', 'vàng', 'vàng chanh', 'xanh lá', 'xanh lá', 'xanh ngọc', 'xanh dương', 'xanh dương', 'tím', 'hồng', 'đỏ'];
  var hueGap = function (a, b) { var d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
  function summarize(photos) {
    var hist = new Array(12).fill(0), lum = 0, colorful = 0;
    photos.forEach(function (p) { p.feat.hist.forEach(function (v, i) { hist[i] += v; }); lum += p.feat.lum; colorful += p.feat.colorful; });
    var top = hist.indexOf(Math.max.apply(null, hist));
    return { hue: top * 30 + 15, hueName: HUES[top], lum: lum / photos.length, colorful: colorful / photos.length };
  }
  // Danh sách gợi ý: 3 mẫu đầu khác nhóm nhau — (1) hợp tông màu ảnh, (2) nền trung tính để ảnh nổi, (3) một hướng khác — rồi tới các mẫu còn lại xếp theo độ hợp
  function pick(templates, groups, sum) {
    var gname = {}; (groups || []).forEach(function (g) { gname[g.id] = g.name; });
    var list = [];
    templates.forEach(function (t) {
      if (/^mh/.test(t.id)) return; // mẫu nhập ngoài: chưa đưa vào gợi ý
      (t.palettes || []).forEach(function (pal) {
        var bg = hex2hsv(pal.swatch && pal.swatch[0]), ac = hex2hsv(pal.swatch && pal.swatch[1]);
        var acSat = ac[1] * (ac[2] > 0.12 ? 1 : 0.4); // màu nhấn gần đen coi như trung tính
        var colourful = sum.colorful > 0.1;
        var tone = colourful && acSat > 0.22 ? 1 - hueGap(sum.hue, ac[0]) / 180 : 0.35;
        var contrast = Math.abs(bg[2] - sum.lum);
        var hot = t.badge === 'Hot' ? 0.04 : 0;
        var redTrad = colourful && (sum.hue < 30 || sum.hue > 330) && t.group === 'truyenthong' ? 0.1 : 0; // áo dài đỏ → mẫu truyền thống
        list.push({
          t: t, pal: pal, group: t.group, groupName: gname[t.group] || '',
          sTone: tone * 0.72 + contrast * 0.22 + hot + redTrad,
          sNeutral: (1 - acSat) * 0.35 + (1 - bg[1]) * 0.25 + bg[2] * 0.2 + contrast * 0.2 + hot,
        });
      });
    });
    var out = [];
    var take = function (score, why, label) {
      var used = out.map(function (o) { return o.t.id; }), ug = out.map(function (o) { return o.group; });
      var c = list.filter(function (x) { return used.indexOf(x.t.id) < 0 && ug.indexOf(x.group) < 0; }).sort(function (a, b) { return score(b) - score(a); })[0];
      if (c) out.push(Object.assign({}, c, { label: label, why: why(c) }));
    };
    var neutralPhotos = sum.colorful <= 0.1;
    take(function (x) { return x.sTone; }, function (c) {
      return neutralPhotos ? 'Ảnh của bạn tông nhẹ, trung tính — hợp với mẫu ' + c.pal.name.toLowerCase() + '.' : 'Ảnh của bạn nhiều sắc ' + sum.hueName + ' — đi liền với tông ' + c.pal.name.toLowerCase() + ' của mẫu.';
    }, 'Hợp tông ảnh');
    take(function (x) { return x.sNeutral; }, function () { return 'Nền sáng, ít màu để ảnh cưới là thứ nổi nhất trên thiệp.'; }, 'Để ảnh nổi bật');
    take(function (x) { return x.sTone * 0.6 + x.sNeutral * 0.4; }, function (c) { return 'Một phong cách khác (' + c.groupName.toLowerCase() + ') để bạn so sánh.'; }, 'Một hướng khác');
    // các gợi ý tiếp theo (bấm "Xem thêm"): mỗi mẫu một lần, màu hợp nhất của mẫu đó, xếp theo độ hợp
    var seen = {}; out.forEach(function (o) { seen[o.t.id] = 1; });
    list.sort(function (a, b) { return (b.sTone * 0.6 + b.sNeutral * 0.4) - (a.sTone * 0.6 + a.sNeutral * 0.4); }).forEach(function (c) {
      if (seen[c.t.id] || out.length >= 20) return;
      seen[c.t.id] = 1;
      out.push(Object.assign({}, c, { label: 'Gợi ý thêm', why: 'Mẫu ' + (c.groupName ? c.groupName.toLowerCase() + ', ' : '') + 'tông ' + c.pal.name.toLowerCase() + '.' }));
    });
    return out;
  }

  // ---------- trạng thái ----------
  var photos = [];   // { id, blob, url, w, h, feat }
  var info = { groom: '', bride: '', date: '' };
  var META = null, picks = [], slots = [], busy = false, seq = 0;
  var persist = function () {
    return idb.set('photos', photos.map(function (p) { return { id: p.id, blob: p.blob, w: p.w, h: p.h, feat: p.feat }; })).then(function () { return idb.set('info', info); });
  };

  // ---------- giao diện ----------
  var elDrop = $('#drop'), elFile = $('#file'), elWork = $('#work'), elThumbs = $('#thumbs'), elList = $('#list'), elMsg = $('#msg');
  function say(t, bad) { elMsg.textContent = t || ''; elMsg.hidden = !t; elMsg.classList.toggle('bad', !!bad); }

  function renderThumbs() {
    elThumbs.innerHTML = photos.map(function (p) {
      return '<span class="th" style="background-image:url(\'' + p.url + '\')"><button type="button" data-rm="' + p.id + '" aria-label="Bỏ ảnh này">×</button></span>';
    }).join('') + (photos.length < MAX ? '<button type="button" class="th add" id="more" aria-label="Thêm ảnh">+</button>' : '');
    $('#count').textContent = photos.length + ' ảnh';
  }

  function previewUrl(c) {
    var q = new URLSearchParams({ palette: c.pal.id, n: String(Math.max(0, slots.length - 1)), lite: '1' });
    if (info.groom) q.set('groom', info.groom);
    if (info.bride) q.set('bride', info.bride);
    if (info.date) q.set('date', info.date);
    return '/goi-y/xem/' + c.t.id + '?' + q;
  }
  // thay ảnh trong máy vào các ô giữ chỗ (#k=<vị trí>) của thiệp trong khung — cùng cách trình sửa hiện ảnh đang tải
  function inject(fr) {
    var doc, win;
    try { doc = fr.contentDocument; win = fr.contentWindow; } catch (e) { return; }
    if (!doc || !doc.body) return;
    slots.forEach(function (s) {
      var f = focus(s.p), src = s.p.url + '#p=' + f[0] + ',' + f[1] + '&k=' + s.key;
      var rx = new RegExp('[#&]k=' + s.key.replace('.', '\\.') + '(?![\\w.])');
      Array.prototype.forEach.call(doc.querySelectorAll('img'), function (im) {
        if (!rx.test(im.getAttribute('src') || '')) return;
        im.removeAttribute('srcset'); im.removeAttribute('loading');
        im.src = src;
        if (win.__applyFocus && im.parentElement) win.__applyFocus(im.parentElement);
      });
      Array.prototype.forEach.call(doc.querySelectorAll('[style*="k="]'), function (el) {
        var st = el.getAttribute('style');
        if (!rx.test(st)) return;
        el.setAttribute('style', st.replace(/url\((['"]?)[^'")]*\1\)/g, function (m) { return rx.test(m) ? 'url("' + src + '")' : m; }));
        if (win.__applyFocus && el.parentElement) win.__applyFocus(el.parentElement);
      });
    });
    // trong khung xem thử không mở link ra ngoài, không gửi form
    doc.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[href]'); if (a) e.preventDefault(); }, true);
    fr.classList.add('on');
  }
  function fit() { // khung thiệp vẽ ở 375px rồi thu nhỏ cho vừa thẻ
    Array.prototype.forEach.call(document.querySelectorAll('.sg-view'), function (v) {
      var sc = v.clientWidth / 375, fr = v.firstElementChild;
      if (!fr) return;
      fr.style.transform = 'scale(' + sc + ')';
      fr.style.height = Math.round(v.clientHeight / sc) + 'px';
    });
  }
  window.addEventListener('resize', fit);

  var PAGE = 5, shown = 0; // mỗi lần hiện 5 thẻ; "Xem thêm" hiện tiếp 5
  var elMore = $('#moreWrap'), elMoreBtn = $('#moreBtn');
  function cardHtml(c, i) {
      return '<article class="sg" data-i="' + i + '">'
        + '<div class="sg-top"><span class="sg-chip">' + esc(c.label) + '</span><b>' + esc(c.t.name) + '</b><span class="muted"> · ' + esc(c.pal.name) + '</span></div>'
        + '<div class="sg-view"><iframe title="Xem thử mẫu ' + esc(c.t.name) + ' với ảnh của bạn" loading="lazy"></iframe><span class="sg-wait">Đang dựng thiệp…</span></div>'
        + '<p class="sg-why">' + esc(c.why) + '</p>'
        + '<button type="button" class="btn btn-main" data-use="' + i + '">Dùng thiệp này</button>'
        + '</article>';
  }
  function updateMore() {
    var left = picks.length - shown;
    elMore.hidden = left <= 0;
    if (left > 0) elMoreBtn.textContent = 'Xem thêm ' + Math.min(PAGE, left) + ' mẫu';
  }
  // thêm n thẻ vào cuối danh sách (không dựng lại các thẻ đã có)
  function showMore(n) {
    var from = shown, to = Math.min(picks.length, shown + n);
    elList.insertAdjacentHTML('beforeend', picks.slice(from, to).map(function (c, k) { return cardHtml(c, from + k); }).join(''));
    shown = to;
    updateMore(); fit();
    loadFrames(from);
    return from;
  }
  function renderList() {
    elList.innerHTML = ''; shown = 0;
    showMore(PAGE);
  }
  // nạp lần lượt từng khung (nhiều thiệp dựng cùng lúc làm điện thoại khựng); from = vị trí khung bắt đầu nạp
  function loadFrames(from) {
    var my = ++seq, frames = Array.prototype.slice.call(elList.querySelectorAll('iframe'));
    var next = function (i) {
      if (my !== seq || i >= frames.length) return;
      var fr = frames[i], done = false;
      var go = function () { if (done) return; done = true; if (my !== seq) return; inject(fr); next(i + 1); };
      fr.classList.remove('on');
      fr.onload = go;
      setTimeout(go, 9000);
      fr.src = previewUrl(picks[i]);
    };
    next(from || 0);
  }

  function refresh(keepPicks) {
    elDrop.hidden = photos.length > 0;
    elWork.hidden = photos.length === 0;
    if (!photos.length) { elList.innerHTML = ''; shown = 0; elMore.hidden = true; return; }
    renderThumbs();
    slots = assign(photos);
    if (!keepPicks || !picks.length) picks = pick(META.templates, META.templateGroups, summarize(photos));
    renderList();
  }

  function addFiles(files) {
    var list = Array.prototype.filter.call(files || [], function (f) { return /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name); });
    if (!list.length) return say('Bạn chọn ảnh JPG, PNG hoặc ảnh chụp từ điện thoại nhé.', true);
    if (busy) return;
    busy = true;
    var room = MAX - photos.length, skipped = Math.max(0, list.length - room), failed = 0, i = 0;
    list = list.slice(0, room);
    say('Đang đọc ' + list.length + ' ảnh…');
    var one = function () {
      if (i >= list.length) return Promise.resolve();
      var f = list[i++];
      return shrink(f).then(function (s) {
        var p = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), blob: s.blob, w: s.w, h: s.h, url: URL.createObjectURL(s.blob) };
        return analyze(p.url).then(function (feat) { p.feat = feat; photos.push(p); });
      }).catch(function () { failed++; }).then(one);
    };
    one().then(function () {
      busy = false;
      say(failed ? failed + ' ảnh không đọc được (thử ảnh khác hoặc chụp màn hình ảnh đó).' : skipped ? 'Mình lấy ' + MAX + ' ảnh đầu để gợi ý — vào trình sửa bạn thêm được tới 24 ảnh.' : '', !!failed);
      persist();
      refresh(false);
      if (photos.length) elWork.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // ---------- dùng thiệp này ----------
  function jsonFetch(url, method, body) {
    return fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin' }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || 'Có lỗi, bạn thử lại nhé'); return j; });
    });
  }
  function use(i, btn) {
    var c = picks[i];
    if (!c || btn.disabled) return;
    btn.disabled = true; btn.textContent = 'Đang tạo thiệp…';
    jsonFetch('/api/cards', 'POST', { template: c.t.id, palette: c.pal.id }).then(function (r) {
      var card = r.card, d = card.data, step = Promise.resolve();
      if (info.groom || info.bride || info.date) {
        if (info.groom) d.groom.name = info.groom;
        if (info.bride) d.bride.name = info.bride;
        if (info.date) { d.date = info.date; (d.events || []).forEach(function (e) { if (!e.date) e.date = info.date; }); }
        step = jsonFetch('/api/cards/' + card.id, 'PUT', { data: d });
      }
      return step.then(function () {
        // ảnh + vị trí + điểm lấy nét để trình sửa đưa vào thiệp (đã đăng nhập: tải lên ngay; chưa: hiện tạm, mời đăng nhập)
        return idb.set('pending', { cardId: card.id, at: Date.now(), items: slots.map(function (s) { var f = focus(s.p); return { key: s.key, blob: s.p.blob, x: f[0], y: f[1] }; }) });
      }).then(function () {
        try {
          if (info.groom || info.bride) sessionStorage.setItem('qs:' + card.id, '1'); // đã có tên → khỏi hiện bảng "Bắt đầu nhanh"
          var b = JSON.stringify({ u: 'thiep:' + c.t.id });
          if (navigator.sendBeacon) navigator.sendBeacon('/api/t', b);
        } catch (e) { /* bỏ qua */ }
        dirty = false;
        location.href = '/sua/' + card.id;
      });
    }).catch(function (e) { btn.disabled = false; btn.textContent = 'Dùng thiệp này'; say(e.message, true); });
  }

  // ---------- sự kiện ----------
  var dirty = false; // đang có ảnh xem dở → máy tính hỏi lại khi rời trang (điện thoại: đã có bản lưu tạm)
  window.addEventListener('beforeunload', function (e) { if (dirty && photos.length) { e.preventDefault(); e.returnValue = ''; } });
  elFile.addEventListener('change', function () { dirty = true; addFiles(elFile.files); elFile.value = ''; });
  ['dragenter', 'dragover'].forEach(function (t) { document.addEventListener(t, function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) { e.preventDefault(); elDrop.classList.add('over'); } }); });
  ['dragleave', 'drop'].forEach(function (t) { document.addEventListener(t, function () { elDrop.classList.remove('over'); }); });
  document.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files.length) { e.preventDefault(); dirty = true; addFiles(e.dataTransfer.files); } });
  document.addEventListener('click', function (e) {
    var rm = e.target.closest('[data-rm]'), u = e.target.closest('[data-use]');
    if (rm) {
      var k = photos.findIndex(function (p) { return p.id === rm.dataset.rm; });
      if (k >= 0) { URL.revokeObjectURL(photos[k].url); photos.splice(k, 1); persist(); refresh(false); }
    } else if (e.target.closest('#moreBtn')) {
      var first = showMore(PAGE), card = elList.children[first];
      // điện thoại: danh sách vuốt ngang → đưa thẻ mới đầu tiên vào giữa; máy tính: cuộn xuống tới thẻ mới
      if (card) { if (elList.scrollWidth > elList.clientWidth + 8) elList.scrollTo({ left: card.offsetLeft - 20, behavior: 'smooth' }); else card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    } else if (e.target.closest('#more') || e.target.closest('#pick')) elFile.click();
    else if (e.target.closest('#reset')) {
      photos.forEach(function (p) { URL.revokeObjectURL(p.url); });
      photos = []; picks = []; dirty = false; say('');
      idb.del('photos'); refresh(false);
    } else if (u) use(+u.dataset.use, u);
  });
  var t = null;
  ['groom', 'bride', 'date'].forEach(function (k) {
    $('#f-' + k).addEventListener('input', function (e) {
      info[k] = e.target.value.trim().slice(0, 40);
      clearTimeout(t);
      t = setTimeout(function () { idb.set('info', info); if (photos.length) loadFrames(); }, 700);
    });
  });

  // ---------- khởi động: lấy danh sách mẫu, khôi phục ảnh đang làm dở ----------
  document.addEventListener('meta', function (e) {
    META = e.detail;
    Promise.all([idb.get('photos'), idb.get('info'), idb.get('incoming'), idb.get('fresh')]).then(function (r) {
      if (r[1]) { info = Object.assign(info, r[1]); ['groom', 'bride', 'date'].forEach(function (k) { $('#f-' + k).value = info[k] || ''; }); }
      // ảnh vừa chọn / thả ở trang chủ (public/js/hero.js): thay bộ ảnh cũ, gợi ý mẫu luôn
      if (Array.isArray(r[2]) && r[2].length) {
        idb.del('incoming');
        photos.forEach(function (p) { URL.revokeObjectURL(p.url); });
        photos = []; picks = [];
        dirty = true;
        addFiles(r[2]);
        return;
      }
      if (photos.length || !Array.isArray(r[0]) || !r[0].length) return;
      photos = r[0].filter(function (p) { return p && p.blob && p.feat; }).map(function (p) { return Object.assign({}, p, { url: URL.createObjectURL(p.blob) }); });
      if (r[3]) idb.del('fresh'); // vừa chọn ở trang chủ (đã đọc xong ảnh ở đó): vào là có gợi ý, không cần nhắc "tiếp tục"
      if (photos.length) refresh(false); // ảnh đã chọn lúc trước (hoặc vừa chọn ở trang chủ) hiện ngay, không cần nhắc
    });
  });
})();
