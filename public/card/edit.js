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
    '[data-ce-key].ce-ph{opacity:.55;font-style:italic}',
    '.ce-hl{position:fixed;z-index:2147483000;pointer-events:none;border:3px solid #d6455d;border-radius:6px;box-shadow:0 0 0 9999px rgba(0,0,0,0);transition:all .08s}',
    '.ce-hl b{position:absolute;top:6px;left:6px;padding:3px 9px;border-radius:999px;background:#d6455d;color:#fff;font:600 12px/1.4 system-ui,sans-serif;white-space:nowrap}',
    '.ce-map{position:absolute;inset:-6px;z-index:6;border:2px dashed rgba(214,69,93,.55);border-radius:12px;margin:0;padding:0;background:rgba(0,0,0,0);cursor:pointer;outline:none!important}',
    '.ce-map:hover{border-style:solid;border-color:#d6455d;background:rgba(214,69,93,.05)!important}',
    '.ce-venue [data-ce-key]:not(.ce-map){outline:none}',
    '.ce-mapph{display:flex;align-items:center;justify-content:center;min-height:180px;height:100%;width:100%;background:repeating-linear-gradient(45deg,rgba(0,0,0,.035) 0 12px,rgba(0,0,0,.06) 12px 24px);border-radius:12px;color:#8a6a70;font:600 14px/1.4 system-ui,sans-serif;text-align:center;padding:16px;box-sizing:border-box}',
    '.ce-map b{position:absolute;left:50%;top:-13px;translate:-50% 0;padding:6px 12px;border-radius:999px;background:#d6455d;color:#fff;font:600 13px/1.3 system-ui,sans-serif;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.2)}',
    '.ce-lock{position:absolute;inset:0;z-index:5;cursor:default}',
    '[data-ce-up]{animation:ceUp 1.3s ease-in-out infinite}',
    '@keyframes ceUp{0%,100%{opacity:1}50%{opacity:.6}}',
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

  // ---------- ảnh tải lên được thì đứng yên ----------
  // Trong trình sửa, ảnh (và khung chứa ảnh) không lắc / phóng to dần / trượt / hiện dần — bấm là trúng đúng ảnh.
  // Dùng Web Animations: hiệu ứng lặp mãi thì dừng hẳn (về tư thế gốc), hiệu ứng chạy một lần thì nhảy tới kết quả.
  // Trang trí không chứa ảnh (hoa rơi, lá bay…) vẫn chạy như thường.
  function photoRelated(el) {
    return !!(el && el.nodeType === 1 && (el.closest('[data-ce-photo]') || el.querySelector('[data-ce-photo]')));
  }
  function still(a) {
    if (a.animationName === 'ceUp') return; // nhấp nháy "đang tải ảnh" của trình sửa
    try {
      var t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
      if (!t || t.endTime === Infinity || t.iterations === Infinity) a.cancel(); else a.finish();
    } catch (e) { try { a.cancel(); } catch (_) { /* bỏ qua */ } }
  }
  function freezePhotos() {
    if (!document.getAnimations) return;
    document.getAnimations().forEach(function (a) { if (photoRelated(a.effect && a.effect.target)) still(a); });
  }
  function freezeOne(e) {
    if (!photoRelated(e.target) || !e.target.getAnimations) return;
    e.target.getAnimations().forEach(still);
  }
  document.addEventListener('animationstart', freezeOne, true);
  document.addEventListener('transitionrun', freezeOne, true);

  // ---------- chữ ----------
  var norm = function (s) { return String(s || '').normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim(); };
  var unTitle = function (s) { return s.replace(/^(ông|bà)\s+/, ''); }; // mẫu hay bỏ "Ông/Bà" trước tên bố mẹ
  var LIST = [];
  FIELDS.forEach(function (f) {
    var v = norm(f[1]); if (v.length < 2) return;
    LIST.push({ key: f[0], v: v, raw: f[1], ph: !!f[2] });
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
  // tìm mọi đoạn trùng giá trị dữ liệu trong một đoạn chữ (không phân biệt hoa thường, khoảng trắng tuỳ ý)
  var escRx = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'); };
  var seen = {};
  var RX = LIST.filter(function (f) { var k = f.key + '|' + f.raw; if (seen[k]) return false; seen[k] = 1; return true; }).map(function (f) {
    var raw = f.raw.normalize('NFC').trim(), m = /^(Ông|Bà)\s+(.+)$/i.exec(raw);
    // mẫu hay bỏ chữ "Ông/Bà" trước tên bố mẹ → cho phép có hoặc không
    var src = m ? '(?:(?:Ông|Bà)\\s+)?' + escRx(m[2]) : escRx(raw);
    return { f: f, re: new RegExp(src, 'giu') };
  });
  function rangesIn(text) {
    var out = [];
    RX.forEach(function (r) {
      r.re.lastIndex = 0;
      var m;
      while ((m = r.re.exec(text))) {
        var a = m.index, b = a + m[0].length;
        if (b > a && !out.some(function (x) { return a < x.b && b > x.a; })) out.push({ a: a, b: b, f: r.f });
        if (!m[0].length) r.re.lastIndex++;
      }
    });
    return out.sort(function (x, y) { return x.a - y.a; });
  }
  function tag(el, f) { el.dataset.ceKey = f.key; if (f.ph) el.classList.add('ce-ph'); }
  function markText() {
    var root = document.querySelector('main.card') || document.body;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentElement;
        if (!p || /^(SCRIPT|STYLE|BUTTON|TEXTAREA|INPUT|OPTION)$/.test(p.tagName) || p.closest('form,.lightbox,[data-ce-key]')) return NodeFilter.FILTER_REJECT;
        return n.nodeValue.trim().length > 1 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    var nodes = [], n;
    while ((n = w.nextNode())) nodes.push(n);
    nodes.forEach(function (n) {
      var p = n.parentElement;
      if (!p || p.closest('[data-ce-key]')) return;
      var text = n.nodeValue, rs = rangesIn(text);
      if (rs.length) {
        // cả đoạn chữ của thẻ chính là một giá trị → đánh dấu luôn thẻ đó (viền đẹp hơn)
        if (rs.length === 1 && p.childNodes.length === 1 && text.trim().length <= (rs[0].b - rs[0].a) + 2) { tag(p, rs[0].f); return; }
        // nhiều giá trị chung một dòng (vd bố & mẹ, "nơi tổ chức, địa chỉ") → bọc từng đoạn để bấm riêng
        var frag = document.createDocumentFragment(), at = 0;
        rs.forEach(function (r) {
          if (r.a > at) frag.appendChild(document.createTextNode(text.slice(at, r.a)));
          var s = document.createElement('span'); s.textContent = text.slice(r.a, r.b); tag(s, r.f);
          frag.appendChild(s); at = r.b;
        });
        if (at < text.length) frag.appendChild(document.createTextNode(text.slice(at)));
        p.replaceChild(frag, n);
        return;
      }
      // giá trị bị tách qua nhiều thẻ (vd tên xuống dòng) → so cả đoạn chữ của thẻ cha
      var f = fieldFor(p.textContent);
      if (f && !p.dataset.ceKey) tag(p, f);
    });
  }

  // ---------- khu địa điểm (nơi tổ chức, địa chỉ, bản đồ, chỉ đường) = một khối: bấm đâu cũng mở bảng sửa địa điểm ----------
  function evOf(el) { var m = /^events\.(\d+)\./.exec(el.dataset.ceKey || ''); return m ? +m[1] : -1; }
  function markMaps() {
    var root = document.querySelector('main.card') || document.body;
    Array.prototype.forEach.call(document.querySelectorAll('[data-ev]'), function (mp) {
      var i = +mp.dataset.ev, box = mp;
      // leo lên cha chừng nào cha chưa chứa chữ của lễ khác / bản đồ khác
      for (var p = mp.parentElement; p && p !== root && p !== document.body; p = p.parentElement) {
        var other = Array.prototype.some.call(p.querySelectorAll('[data-ce-key^="events."]'), function (k) { var j = evOf(k); return j >= 0 && j !== i; })
          || Array.prototype.some.call(p.querySelectorAll('[data-ev]'), function (x) { return +x.dataset.ev !== i; })
          || p.querySelector('[data-ce-photo]');
        if (other) break;
        box = p;
      }
      if (box.querySelector(':scope > .ce-map')) return;
      if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
      var o = document.createElement('button');
      o.type = 'button'; o.className = 'ce-map'; o.dataset.ceKey = 'events.' + i + '.address';
      o.innerHTML = '<b>📍 Sửa địa điểm</b>';
      box.appendChild(o);
      box.classList.add('ce-venue');
    });
  }

  // ---------- ô dành cho khách (lời chúc, xác nhận tham dự…): trong trình sửa không cho nhập ----------
  function lockForms() {
    Array.prototype.forEach.call(document.querySelectorAll('form'), function (f) {
      if (f.querySelector('.ce-lock')) return;
      Array.prototype.forEach.call(f.querySelectorAll('input,textarea,select,button'), function (x) { x.tabIndex = -1; x.setAttribute('aria-disabled', 'true'); });
      if (getComputedStyle(f).position === 'static') f.style.position = 'relative';
      var o = document.createElement('div');
      o.className = 'ce-lock';
      f.appendChild(o);
    });
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
      tell({ type: 'text', key: t.dataset.ceKey, value: f ? f[1] : '', map: t.classList.contains('ce-map') });
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

  // ---------- trang sửa báo đổi chữ → đổi ngay trên thiệp, không chờ lưu & vẽ lại ----------
  function patch(key, val) {
    var f = FIELDS.filter(function (x) { return x[0] === key; })[0];
    if (!f || !String(val || '').trim()) return; // xoá trắng → để bản vẽ lại lo (mẫu có thể ẩn cả dòng)
    var from = String(f[1] || ''), re = new RegExp(escRx(from.normalize('NFC').trim()), 'giu');
    Array.prototype.forEach.call(document.querySelectorAll('[data-ce-key="' + key + '"]'), function (el) {
      if (el.classList.contains('ce-map')) return; // lớp phủ bản đồ: bản đồ đổi theo khi vẽ lại
      var hit = false, w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n;
      while ((n = w.nextNode())) {
        re.lastIndex = 0;
        if (re.test(n.nodeValue)) { re.lastIndex = 0; n.nodeValue = n.nodeValue.replace(re, function () { return val; }); hit = true; }
      }
      if (!hit) el.textContent = val;
      el.classList.remove('ce-ph');
    });
    f[1] = val; f[2] = 0;
    re = new RegExp(escRx(String(val).normalize('NFC').trim()), 'giu');
    RX.forEach(function (r) { if (r.f.key === key) { r.f.raw = val; r.re = re; } });
  }
  // ---------- trang sửa vừa chọn ảnh → hiện ngay ảnh trong máy (chưa chờ tải lên xong); nhấp nháy nhẹ tới khi lưu xong ----------
  function photoPatch(key, src) {
    var tagged = src + (src.indexOf('#') >= 0 ? '&' : '#') + 'k=' + key;
    var re = new RegExp('url\\(([\'"]?)[^\'")]*[#&]k=' + key.replace('.', '\\.') + '(?![\\w.])[^\'")]*\\1\\)', 'g');
    Array.prototype.forEach.call(document.querySelectorAll('[data-ce-photo="' + key + '"]'), function (el) {
      if (el.tagName === 'IMG') {
        el.removeAttribute('srcset');
        el.style.objectPosition = el.style.scale = el.style.clipPath = el.style.transformOrigin = ''; // bỏ phần căn của ảnh cũ
        el.src = tagged;
      } else {
        el.setAttribute('style', el.getAttribute('style').replace(re, 'url("' + tagged + '")'));
        el.style.backgroundSize = ''; el.style.backgroundPosition = '';
      }
      el.dataset.ceEmpty = '';
      el.dataset.ceUp = '1';
      if (window.__applyFocus && el.parentElement) window.__applyFocus(el.parentElement); // căn đúng phần đã chọn (#p=…)
    });
  }
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data) return;
    if (e.data.cePatch) patch(e.data.key, e.data.value);
    if (e.data.cePhoto) photoPatch(e.data.key, e.data.src);
  });

  function init() {
    markPhotos(); markText(); markMaps(); lockForms();
    freezePhotos();
    window.addEventListener('load', freezePhotos); // hiệu ứng bắt đầu khi ảnh tải xong
    tell({ type: 'ready' });
    // gợi ý chỉ hiện lần đầu, không hiện lại mỗi lần thiệp vẽ lại sau khi lưu
    try { if (sessionStorage.getItem('ceTip')) return; sessionStorage.setItem('ceTip', '1'); } catch (e) { /* bỏ qua */ }
    var tip = document.createElement('div'); tip.className = 'ce-tip';
    tip.textContent = 'Bấm vào ảnh hoặc chữ có viền để sửa';
    document.body.appendChild(tip);
    setTimeout(function () { tip.style.opacity = '0'; }, 3500);
    setTimeout(function () { tip.remove(); }, 4200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
