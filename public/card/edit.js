// Chế độ sửa trực tiếp: chạy trong khung xem trước của trang sửa thiệp.
// - Ảnh: link ảnh mang "#k=<vị trí>" (máy chủ gắn sẵn) → bấm vào ảnh/ô trống báo cho trang sửa để tải ảnh, căn chỉnh, xoá.
// - Chữ: dò các đoạn chữ trùng với dữ liệu thiệp (tên, bố mẹ, địa chỉ, lời mời…) → viền đứt, bấm vào để sửa.
// Không cần sửa từng mẫu thiệp: chỉ đọc trang đã vẽ.
(function () {
  'use strict';
  var C = window.__CARD || {};
  if (!C.edit) return;
  var FIELDS = C.edit.fields || [];

  var st = document.createElement('style');
  st.textContent = [
    '[data-ce-photo]{cursor:pointer}',
    '[data-ce-key]{cursor:text;outline:1.5px dashed rgba(214,69,93,.5);outline-offset:3px;border-radius:2px}',
    '[data-ce-key]:hover,[data-ce-key].ce-on{outline:2px solid #d6455d;background:rgba(214,69,93,.06)}',
    '.ce-hl{position:fixed;z-index:2147483000;pointer-events:none;border:3px solid #d6455d;border-radius:6px;box-shadow:0 0 0 9999px rgba(0,0,0,0);transition:all .08s}',
    '.ce-hl b{position:absolute;top:6px;left:6px;padding:3px 9px;border-radius:999px;background:#d6455d;color:#fff;font:600 12px/1.4 system-ui,sans-serif;white-space:nowrap}',
    '.ce-tip{position:fixed;left:50%;bottom:14px;translate:-50% 0;z-index:2147483001;padding:8px 14px;border-radius:999px;background:rgba(20,12,14,.78);color:#fff;font:600 13px/1.3 system-ui,sans-serif;white-space:nowrap;pointer-events:none;transition:opacity .4s}',
  ].join('\n');
  document.head.appendChild(st);

  // ---------- ảnh ----------
  function keyOf(u) { var m = /[#&]k=([\w.]+)/.exec(u || ''); return m ? m[1] : ''; }
  function markPhotos() {
    Array.prototype.forEach.call(document.querySelectorAll('img[src*="k="]'), function (im) {
      var k = keyOf(im.getAttribute('src')); if (k) { im.dataset.cePhoto = k; im.dataset.ceEmpty = /\/card\/slot\.svg/.test(im.src) ? '1' : ''; }
    });
    Array.prototype.forEach.call(document.querySelectorAll('[style*="k="]'), function (el) {
      var s = el.getAttribute('style'), k = keyOf(s); if (k) { el.dataset.cePhoto = k; el.dataset.ceEmpty = /\/card\/slot\.svg/.test(s) ? '1' : ''; }
    });
  }
  // ảnh hay bị đè bởi lớp trang trí (bao thư, khung, hoa…) → tìm ảnh nằm dưới điểm bấm
  function photoAt(x, y) {
    var els = document.elementsFromPoint(x, y);
    for (var i = 0; i < els.length; i++) if (els[i].dataset && els[i].dataset.cePhoto) return els[i];
    return null;
  }

  // ---------- chữ ----------
  var norm = function (s) { return String(s || '').normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim(); };
  var unTitle = function (s) { return s.replace(/^(ông|bà)\s+/, ''); }; // mẫu hay bỏ "Ông/Bà" trước tên bố mẹ
  var LIST = [];
  FIELDS.forEach(function (f) {
    var v = norm(f[1]); if (v.length < 2) return;
    LIST.push({ key: f[0], v: v, raw: f[1] });
    var u = unTitle(v); if (u !== v && u.length >= 2) LIST.push({ key: f[0], v: u, raw: f[1] });
  });
  LIST.sort(function (a, b) { return b.v.length - a.v.length; }); // ưu tiên đoạn dài nhất
  function fieldFor(text) {
    var t = norm(text); if (t.length < 2) return null;
    for (var i = 0; i < LIST.length; i++) {
      var f = LIST[i];
      // khớp khi đoạn chữ chính là giá trị, hoặc giá trị chiếm phần lớn đoạn chữ (vd "Vào lúc …", "Ông Bà …")
      if (t === f.v || (t.indexOf(f.v) >= 0 && f.v.length >= t.length * 0.45)) return f;
    }
    return null;
  }
  function markText() {
    var root = document.querySelector('main.card') || document.body;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentElement;
        if (!p || /^(SCRIPT|STYLE|BUTTON|TEXTAREA|INPUT|OPTION)$/.test(p.tagName) || p.closest('form,.lightbox')) return NodeFilter.FILTER_REJECT;
        return n.nodeValue.trim().length > 1 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    var n;
    while ((n = w.nextNode())) {
      var p = n.parentElement, f = fieldFor(p.textContent) || fieldFor(n.nodeValue);
      if (f && !p.dataset.ceKey) p.dataset.ceKey = f.key;
    }
  }

  // ---------- khung đánh dấu ảnh khi rê chuột ----------
  var hl = document.createElement('div'); hl.className = 'ce-hl'; hl.style.display = 'none'; hl.innerHTML = '<b></b>';
  document.body.appendChild(hl);
  function showHl(el) {
    if (!el) { hl.style.display = 'none'; return; }
    var r = el.getBoundingClientRect();
    hl.style.display = 'block';
    hl.style.left = r.left + 'px'; hl.style.top = r.top + 'px'; hl.style.width = r.width + 'px'; hl.style.height = r.height + 'px';
    hl.firstChild.textContent = el.dataset.ceEmpty ? '+ Tải ảnh lên' : '✎ Đổi / căn ảnh';
  }
  document.addEventListener('mousemove', function (e) {
    showHl(e.target.closest && e.target.closest('[data-ce-key]') ? null : photoAt(e.clientX, e.clientY));
  }, { passive: true });
  document.addEventListener('scroll', function () { hl.style.display = 'none'; }, { passive: true });
  document.addEventListener('mouseleave', function () { hl.style.display = 'none'; });

  // ---------- bấm: báo cho trang sửa ----------
  function tell(msg) { try { window.parent.postMessage(Object.assign({ ce: 1 }, msg), location.origin); } catch (e) { /* không ở trong khung */ } }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-ce-key]');
    if (t) {
      e.preventDefault(); e.stopPropagation();
      document.querySelectorAll('.ce-on').forEach(function (x) { x.classList.remove('ce-on'); });
      t.classList.add('ce-on');
      var f = FIELDS.filter(function (x) { return x[0] === t.dataset.ceKey; })[0];
      tell({ type: 'text', key: t.dataset.ceKey, value: f ? f[1] : '' });
      return;
    }
    var ph = photoAt(e.clientX, e.clientY);
    if (ph) {
      e.preventDefault(); e.stopPropagation();
      var r = ph.getBoundingClientRect();
      tell({ type: 'photo', key: ph.dataset.cePhoto, empty: !!ph.dataset.ceEmpty, ratio: r.width / Math.max(1, r.height) });
      return;
    }
    // trong chế độ sửa, không mở link ra ngoài (bản đồ, lịch…)
    var a = e.target.closest && e.target.closest('a[href]');
    if (a) e.preventDefault();
  }, true);

  function init() {
    markPhotos(); markText();
    var tip = document.createElement('div'); tip.className = 'ce-tip';
    tip.textContent = 'Bấm vào ảnh hoặc chữ có viền để sửa';
    document.body.appendChild(tip);
    setTimeout(function () { tip.style.opacity = '0'; }, 3500);
    setTimeout(function () { tip.remove(); }, 4200);
    tell({ type: 'ready' });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
