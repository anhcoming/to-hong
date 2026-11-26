// Trang /goi-y: thả ảnh cưới vào → trình duyệt tự đọc màu ảnh, chọn các mẫu thiệp hợp và hiện ngay với ảnh của khách:
// một thiệp lớn + dải ảnh bìa các mẫu gợi ý (chạm để đổi), nút "Dùng thiệp này" luôn ở dưới.
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
  var META = null, picks = [], slots = [], busy = false, seq = 0;
  var persist = function () {
    return idb.set('photos', photos.map(function (p) { return { id: p.id, blob: p.blob, w: p.w, h: p.h, feat: p.feat }; }));
  };

  // ---------- giao diện ----------
  var elDrop = $('#drop'), elFile = $('#file'), elWork = $('#work'), elThumbs = $('#thumbs'), elMsg = $('#msg');
  var elBig = $('#big'), elStrip = $('#strip'), cur = 0;
  function say(t, bad) { elMsg.textContent = t || ''; elMsg.hidden = !t; elMsg.classList.toggle('bad', !!bad); }

  function renderThumbs() {
    elThumbs.innerHTML = photos.map(function (p) {
      return '<span class="th" style="background-image:url(\'' + p.url + '\')"><button type="button" data-rm="' + p.id + '" aria-label="Bỏ ảnh này">×</button></span>';
    }).join('') + (photos.length < MAX ? '<button type="button" class="th add" id="more" aria-label="Thêm ảnh">+</button>' : '');
    $('#count').textContent = photos.length + ' ảnh';
    $('#mPhI').innerHTML = photos.slice(0, 3).map(function (p) { return '<b style="background-image:url(\'' + p.url + '\')"></b>'; }).join('');
    $('#mPhN').textContent = photos.length + ' ảnh · Đổi';
  }

  // tên đôi + ngày đã gõ ("✏️ Thử tên của hai bạn" — dùng chung với khung xem mẫu, site.js cnTen)
  var ten = function () { return (window.cnTen && window.cnTen.get()) || {}; };
  function previewUrl(c) {
    var t = ten(), q = new URLSearchParams({ palette: c.pal.id, n: String(Math.max(0, slots.length - 1)), lite: '1' });
    ['groom', 'bride', 'date'].forEach(function (k) { if (t[k]) q.set(k, t[k]); });
    return '/goi-y/xem/' + c.t.id + '?' + q;
  }
  function drawTen() {
    var t = ten(), b = document.getElementById('tenBtn'); if (!b) return;
    b.innerHTML = t.groom || t.bride ? '✏️ <b>' + esc((t.groom || '…') + ' & ' + (t.bride || '…')) + '</b>' : '✏️ Thử tên của hai bạn';
  }
  function tenForm() {
    var t = ten(), ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:3000;background:rgba(20,10,14,.45);display:flex;align-items:flex-end;justify-content:center';
    ov.innerHTML = '<div style="width:100%;max-width:460px;background:var(--card,#fff);border-radius:20px 20px 0 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom));font-family:var(--sans)">'
      + '<b style="display:block;font-size:17px;margin-bottom:4px">Tên của hai bạn</b><small style="color:var(--muted)">Thiệp xem thử hiện đúng tên, ngày cưới của mình</small>'
      + '<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;margin-top:12px"><input class="input" name="g" placeholder="Chú rể" maxlength="40" value="' + esc(t.groom || '') + '"><span style="font:700 20px var(--script);color:var(--red)">&amp;</span><input class="input" name="b" placeholder="Cô dâu" maxlength="40" value="' + esc(t.bride || '') + '"></div>'
      + '<label style="display:block;margin:10px 0 4px;font-size:12.5px;color:var(--muted)">Ngày cưới</label><input class="input" name="d" type="date" value="' + esc(t.date || '') + '" style="width:100%">'
      + '<div style="display:flex;justify-content:center;margin-top:14px"><button type="button" class="btn btn-main" data-ok>Xem với tên này</button></div></div>';
    document.body.appendChild(ov);
    ov.querySelector('input').focus();
    ov.onclick = function (e) {
      if (e.target === ov) return ov.remove();
      if (!e.target.closest('[data-ok]')) return;
      var v = function (n) { return ov.querySelector('[name=' + n + ']').value.trim().slice(0, 40); };
      try { localStorage.setItem('cnTen', JSON.stringify({ groom: v('g'), bride: v('b'), date: v('d') })); } catch (er) { /* bỏ qua */ }
      ov.remove(); drawTen(); loadFrames();
    };
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
      // ảnh vẽ trong SVG (<image href>, vd. khung bìa Long Phụng)
      Array.prototype.forEach.call(doc.querySelectorAll('image'), function (im) {
        if (rx.test(im.getAttribute('href') || im.getAttribute('xlink:href') || '')) { im.removeAttribute('xlink:href'); im.setAttribute('href', src); }
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
      var sc = v.clientWidth / 375;
      Array.prototype.forEach.call(v.querySelectorAll('iframe'), function (fr) {
        fr.style.transform = 'scale(' + sc + ')';
        fr.style.height = Math.round(v.clientHeight / sc) + 'px';
      });
    });
  }
  window.addEventListener('resize', fit);

  // dải mẫu: ảnh bìa có sẵn của từng mẫu theo đúng bảng màu (nhẹ, không phải dựng thiệp); chỉ thiệp lớn là dựng thật với ảnh của khách
  var coverOf = function (c) { return '/demo/cover-' + c.t.id + '-' + c.pal.id + '.jpg'; };
  function renderStrip() {
    elStrip.innerHTML = picks.map(function (c, i) {
      return '<button type="button" role="option" data-pick="' + i + '" class="' + (i === cur ? 'on' : '') + '" aria-selected="' + (i === cur) + '" title="' + esc(c.t.name + ' · ' + c.pal.name) + '">'
        + '<i style="background-image:url(\'' + coverOf(c) + '\')"></i><small>' + esc(c.t.name) + '</small></button>';
    }).join('') + '<a href="/mau-thiep"><i>Xem tất cả mẫu →</i><small>&nbsp;</small></a>';
  }
  function select(i, scroll) {
    var c = picks[i]; if (!c) return;
    cur = i;
    Array.prototype.forEach.call(elStrip.querySelectorAll('[data-pick]'), function (b) { var on = +b.dataset.pick === i; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    $('#pwhy').textContent = c.why;
    ['#useBtn', '#useBtnM'].forEach(function (id) { var u = $(id); if (u) { u.disabled = false; u.textContent = 'Dùng thiệp này'; } });
    if (scroll) { var b = elStrip.querySelector('[data-pick="' + i + '"]'); if (b && elStrip.scrollWidth > elStrip.clientWidth + 8) elStrip.scrollTo({ left: b.offsetLeft - elStrip.clientWidth / 2 + b.offsetWidth / 2, behavior: 'smooth' }); }
    loadBig();
  }
  // dựng thiệp lớn: khung mới tải xong mới hiện (giữ thiệp cũ tới lúc đó, không nháy trắng)
  function loadBig() {
    var my = ++seq, old = elBig.querySelector('iframe'), fr = document.createElement('iframe');
    fr.title = old ? old.title : 'Xem thử thiệp với ảnh của bạn';
    var done = false;
    var go = function () {
      if (done || my !== seq) return; done = true;
      inject(fr); fit();
      Array.prototype.forEach.call(elBig.querySelectorAll('iframe'), function (x) { if (x !== fr) x.remove(); });
    };
    // gắn link trước rồi mới đưa vào trang: khung chưa có link sẽ báo "tải xong" ngay với trang trắng
    fr.src = previewUrl(picks[cur]);
    elBig.insertBefore(fr, elBig.firstChild);
    fr.onload = go; setTimeout(go, 9000);
    fit();
  }
  function loadFrames() { if (picks.length) loadBig(); } // tên / ngày đổi → dựng lại thiệp đang xem
  function renderList() { cur = 0; $('#ptitle').textContent = picks.length + ' mẫu hợp với ảnh của bạn'; renderStrip(); select(0); }

  function refresh(keepPicks) {
    $('#restoring').hidden = true;
    elDrop.hidden = photos.length > 0;
    elWork.hidden = photos.length === 0;
    document.body.classList.toggle('gy-on', photos.length > 0);
    if (!photos.length) { elStrip.innerHTML = ''; return; }
    renderThumbs();
    slots = assign(photos);
    if (!META) { say('Đang tải danh sách mẫu…'); document.addEventListener('meta', function () { say(''); refresh(keepPicks); }, { once: true }); return; }
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
    var tab = null; try { tab = window.open('', '_blank'); if (tab) tab.document.write('<title>Đang mở thiệp…</title><p style="font:16px system-ui;padding:40px;color:#888">Đang tạo thiệp…</p>'); } catch (e) { tab = null; }
    // đã có thiệp đã kích hoạt / nhiều thiệp: bảng chọn đổi mẫu thiệp nào hay làm thêm thiệp (public/js/pick-card.js)
    window.useTemplate(c.t.id, c.pal.id, c.t.name, function () { if (tab && !tab.closed) tab.close(); tab = null; }, ten()).then(function (card) {
      if (!card) { btn.disabled = false; btn.textContent = 'Dùng thiệp này'; return; }
      var step = Promise.resolve();
      return step.then(function () {
        // ảnh + vị trí + điểm lấy nét để trình sửa đưa vào thiệp (đã đăng nhập: tải lên ngay; chưa: hiện tạm, mời đăng nhập)
        return idb.set('pending', { cardId: card.id, at: Date.now(), items: slots.map(function (s) { var f = focus(s.p); return { key: s.key, blob: s.p.blob, x: f[0], y: f[1] }; }) });
      }).then(function () {
        try {
          var b = JSON.stringify({ u: 'thiep:' + c.t.id });
          if (navigator.sendBeacon) navigator.sendBeacon('/api/t', b);
        } catch (e) { /* bỏ qua */ }
        dirty = false;
        if (tab && !tab.closed) { tab.location.href = '/sua/' + card.id; btn.disabled = false; btn.textContent = 'Dùng thiệp này'; }
        else location.href = '/sua/' + card.id; // trình duyệt chặn tab mới → mở ngay tại đây
      });
    }).catch(function (e) { if (tab && !tab.closed) tab.close(); btn.disabled = false; btn.textContent = 'Dùng thiệp này'; say(e.message, true); });
  }

  // ---------- sự kiện ----------
  drawTen();
  var tb = document.getElementById('tenBtn'); if (tb) tb.onclick = tenForm;
  var dirty = false; // đang có ảnh xem dở → máy tính hỏi lại khi rời trang (điện thoại: đã có bản lưu tạm)
  window.addEventListener('beforeunload', function (e) { if (dirty && photos.length) { e.preventDefault(); e.returnValue = ''; } });
  elFile.addEventListener('change', function () { dirty = true; addFiles(elFile.files); elFile.value = ''; });
  ['dragenter', 'dragover'].forEach(function (t) { document.addEventListener(t, function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) { e.preventDefault(); elDrop.classList.add('over'); } }); });
  ['dragleave', 'drop'].forEach(function (t) { document.addEventListener(t, function () { elDrop.classList.remove('over'); }); });
  document.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files.length) { e.preventDefault(); dirty = true; addFiles(e.dataTransfer.files); } });
  document.addEventListener('click', function (e) {
    var rm = e.target.closest('[data-rm]'), u = e.target.closest('#useBtn,#useBtnM'), pk = e.target.closest('[data-pick]');
    if (rm) {
      var k = photos.findIndex(function (p) { return p.id === rm.dataset.rm; });
      if (k >= 0) { URL.revokeObjectURL(photos[k].url); photos.splice(k, 1); persist(); refresh(false); }
    } else if (pk) { if (+pk.dataset.pick !== cur) select(+pk.dataset.pick, true);
    } else if (e.target.closest('#mPh')) { elWork.classList.toggle('ph');
    } else if (e.target.id === 'phX' || (elWork.classList.contains('ph') && !e.target.closest('#phbox'))) { elWork.classList.remove('ph'); // chạm ra ngoài / Xong: đóng hộp ảnh
    } else if (e.target.closest('#more') || e.target.closest('#pick')) elFile.click();
    else if (e.target.closest('#reset')) {
      photos.forEach(function (p) { URL.revokeObjectURL(p.url); });
      photos = []; picks = []; dirty = false; say('');
      idb.del('photos'); refresh(false);
    } else if (u) use(cur, u);
  });

  // ---------- khởi động: lấy danh sách mẫu, khôi phục ảnh đang làm dở ----------
  // mạng lỗi, danh sách mẫu không về: sau 8 giây vẫn hiện ô chọn ảnh (không treo ở "Đang mở…")
  setTimeout(function () { if (!META && !$('#restoring').hidden) { $('#restoring').hidden = true; elDrop.hidden = false; } }, 8000);
  document.addEventListener('meta', function (e) {
    META = e.detail;
    Promise.all([idb.get('photos'), null, idb.get('incoming'), idb.get('fresh')]).then(function (r) {
      idb.del('info'); // tên / ngày không còn nhập ở đây (điền trong trình sửa)
      // ảnh vừa chọn / thả ở trang chủ (public/js/hero.js): thay bộ ảnh cũ, gợi ý mẫu luôn
      if (Array.isArray(r[2]) && r[2].length) {
        idb.del('incoming');
        photos.forEach(function (p) { URL.revokeObjectURL(p.url); });
        photos = []; picks = [];
        dirty = true;
        addFiles(r[2]);
        return;
      }
      if (photos.length || busy) return;
      if (!Array.isArray(r[0]) || !r[0].length) { refresh(false); return; }
      photos = r[0].filter(function (p) { return p && p.blob && p.feat; }).map(function (p) { return Object.assign({}, p, { url: URL.createObjectURL(p.blob) }); });
      if (r[3]) idb.del('fresh'); // vừa chọn ở trang chủ (đã đọc xong ảnh ở đó): vào là có gợi ý, không cần nhắc "tiếp tục"
      refresh(false); // ảnh đã chọn lúc trước (hoặc vừa chọn ở trang chủ) hiện ngay, không cần nhắc
    });
  });
})();
