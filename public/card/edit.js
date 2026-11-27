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
    // chữ sửa được: không viền cả khối (khối chữ mẫu canvas rộng hết thiệp → vạch đỏ cắt ngang ảnh);
    // rê chuột / đang chọn thì khung .ce-tx bao sát đúng dòng chữ; màn cảm ứng có gạch chân chấm mờ để biết bấm được
    '[data-ce-key]{cursor:text}',
    '[data-ce-photo]:not([data-ce-album]){outline:2px dashed rgba(214,69,93,.75)!important;outline-offset:-3px}',
    '[data-ce-album] [data-ce-photo]{outline:none!important}[data-ce-album]{outline:2px dashed rgba(214,69,93,.6)!important;outline-offset:-6px;border-radius:14px}', // album: một khung cho cả khối // luôn thấy ảnh nào sửa được (điện thoại lẫn máy tính, không cần rê chuột)
    '[data-ce-key]:not(.ce-map):not(.ce-ev){text-decoration:underline dotted rgba(214,69,93,.6);text-decoration-thickness:1.5px;text-underline-offset:5px}', // chữ sửa được: luôn gạch chấm
    '.ce-tx{position:absolute;z-index:2147482999;pointer-events:none;border:1.5px solid #d6455d;border-radius:6px;background:rgba(214,69,93,.07);display:none}',
    '.ce-tx.sel{border-width:2px;box-shadow:0 0 0 4px rgba(214,69,93,.18)}',
    '.ce-tx b{position:absolute;left:-2px;bottom:100%;margin-bottom:3px;padding:2px 8px;border-radius:6px;background:#d6455d;color:#fff;font:600 11.5px/1.5 system-ui,sans-serif;white-space:nowrap}',
    '.ce-tx.up b{bottom:auto;top:100%;margin:3px 0 0}',
    '[data-ce-key].ce-ph{opacity:.55;font-style:italic}',
    '.ce-hl{position:fixed;z-index:2147483000;pointer-events:none;border:3px solid #d6455d;border-radius:6px;box-shadow:0 0 0 9999px rgba(0,0,0,0);transition:all .08s}',
    '.ce-hl b{position:absolute;top:6px;left:6px;padding:3px 9px;border-radius:999px;background:#d6455d;color:#fff;font:600 12px/1.4 system-ui,sans-serif;white-space:nowrap}',
    // ảnh đã có: 2 nút bấm được ngay trên khung (Căn chỉnh / Thay ảnh); phần còn lại của khung vẫn cho bấm xuyên xuống ảnh
    '.ce-hl .ce-act{position:absolute;top:8px;left:8px;display:none;gap:6px;pointer-events:auto}',
    '.ce-hl.has .ce-act{display:flex}.ce-hl.has b{display:none}',
    '.s-extra{cursor:pointer;outline:1.5px dashed transparent;outline-offset:-4px;border-radius:12px;transition:outline-color .15s}.s-extra{outline-color:rgba(214,69,93,.5)}',
    '.ce-flash{animation:ceFlash 1.5s ease-out}@keyframes ceFlash{0%,40%{box-shadow:inset 0 0 0 3px rgba(214,69,93,.75)}100%{box-shadow:inset 0 0 0 3px rgba(214,69,93,0)}}',
    '.ce-hl .ce-alb{position:absolute;top:8px;left:50%;transform:translateX(-50%);display:none;pointer-events:auto}',
    '.ce-hl.alb .ce-alb{display:flex}.ce-hl.alb b,.ce-hl.alb .ce-act{display:none}',
    '.ce-alb button{all:unset;box-sizing:border-box;padding:7px 14px;border-radius:999px;background:#d6455d;color:#fff;font:600 13px/1.2 system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.25);white-space:nowrap}',
    '.ce-act button{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:5px;padding:6px 11px;border-radius:999px;background:#d6455d;color:#fff;font:600 12.5px/1.2 system-ui,sans-serif;white-space:nowrap;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.25);transition:filter .12s,transform .12s}',
    '.ce-act button.lt{background:#fff;color:#d6455d}',
    '.ce-act button:hover{filter:brightness(1.08);transform:translateY(-1px)}',
    '.ce-act svg{width:14px;height:14px;flex:none}',
    '.ce-map{position:absolute;inset:-6px;z-index:6;border:2px dashed rgba(214,69,93,.55);border-radius:12px;margin:0;padding:0;background:rgba(0,0,0,0);cursor:pointer;outline:none!important}',
    '.ce-venue [data-ce-key]:not(.ce-map){outline:none!important;background:none!important;text-decoration:none!important}',
    '.ce-evbox [data-ce-key]:not(.ce-map):not(.ce-ev){outline:none;background:none}',
    '.ce-evbox,.ce-evbox *{cursor:pointer}',
    // khung khối lễ: chặn mọi kiểu "button" của mẫu (vị trí, nền, viền, cỡ…) đè lên
    '.ce-ev{position:absolute!important;z-index:5!important;display:block!important;box-sizing:border-box!important;border:2px dashed rgba(214,69,93,.55)!important;border-radius:12px!important;margin:0!important;padding:0!important;min-width:0!important;max-width:none!important;min-height:0!important;background:rgba(0,0,0,0)!important;box-shadow:none!important;transform:none!important;opacity:1!important;cursor:pointer;outline:none!important}',
    '.ce-ev b{position:absolute;left:50%;top:-13px;translate:-50% 0;max-width:calc(100% - 16px);overflow:hidden;text-overflow:ellipsis;padding:6px 12px;border-radius:999px;background:#d6455d;color:#fff;font:600 13px/1.3 system-ui,sans-serif;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.2)}',
    '.ce-ev.sm b{left:auto;right:-8px;top:-11px;translate:none;max-width:none;padding:2px 7px;font-size:12px;font-size:0}',
    '.ce-ev.sm b::before{content:"✎";font-size:13px}',
    '.ce-phb{position:absolute;z-index:2147482000;padding:5px 11px;border:0;border-radius:999px;background:#d6455d;color:#fff;font:600 12.5px/1.2 system-ui,sans-serif;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.25);cursor:pointer}',
    '.ce-dup{outline:none!important;background:none!important;text-decoration:none!important;cursor:inherit!important}',
    '.ce-giftc{outline:2px dashed rgba(214,69,93,.55)!important;outline-offset:4px;border-radius:10px;cursor:pointer}.ce-giftc::before{content:"✎ Sửa tài khoản";position:absolute;z-index:6;left:50%;top:-4px;translate:-50% -50%;padding:4px 10px;border-radius:999px;background:#d6455d;color:#fff;font:700 12px/1.2 system-ui,sans-serif;white-space:nowrap;pointer-events:none}.ce-giftc [data-ce-photo^="gifts."]{outline:2px dashed rgba(214,69,93,.75)!important;outline-offset:2px}.ce-giftc [data-ce-key]{text-decoration:none!important}',
    '.ce-sched{position:relative;outline:2px dashed rgba(214,69,93,.55);outline-offset:6px;border-radius:12px;cursor:pointer}',
    '.ce-sched [data-ce-key]:not(.ce-map){outline:none!important;background:none!important;text-decoration:none!important}',
    '.ce-sched .ce-ev{display:none!important}',
    '.ce-sched>.ce-schb{position:absolute;z-index:6;left:50%;top:-6px;translate:-50% -50%;padding:6px 12px;border:0;border-radius:999px;background:#d6455d;color:#fff;font:700 13px/1.2 system-ui,sans-serif;white-space:nowrap;box-shadow:0 4px 12px rgba(214,69,93,.35);cursor:pointer}',
    '.ce-mapph{display:flex;align-items:center;justify-content:center;min-height:180px;height:100%;width:100%;background:repeating-linear-gradient(45deg,rgba(0,0,0,.035) 0 12px,rgba(0,0,0,.06) 12px 24px);border-radius:12px;color:#8a6a70;font:600 14px/1.4 system-ui,sans-serif;text-align:center;padding:16px;box-sizing:border-box}',
    '.ce-map.wide{inset:14px 8px 8px}', // khu rộng hết màn hình: khung lùi vào trong, nhãn nằm trên viền không đè khối bên trên
    '.ce-venue .ce-go{position:relative;z-index:7;cursor:pointer}',
    '.ce-map b{position:absolute;left:50%;top:-13px;translate:-50% 0;padding:6px 12px;border-radius:999px;background:#d6455d;color:#fff;font:600 13px/1.3 system-ui,sans-serif;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.2)}',
    '.ce-lock{position:absolute;inset:0;z-index:5;cursor:default}',
    '[data-ce-up]{animation:ceUp 1.3s ease-in-out infinite}',
    '@keyframes ceUp{0%,100%{opacity:1}50%{opacity:.6}}',
    '.ce-tip{position:fixed;left:50%;bottom:14px;translate:-50% 0;z-index:2147483001;padding:8px 14px;border-radius:999px;background:rgba(20,12,14,.78);color:#fff;font:600 13px/1.3 system-ui,sans-serif;white-space:nowrap;pointer-events:none;transition:opacity .4s}',
  ].join('\n');
  document.head.appendChild(st);

  // ---------- ảnh ----------
  function keyOf(u) { var m = /[#&]k=([\w.]+)/.exec(u || ''); return m ? m[1] : ''; }
  // Album: cả khối là một chỗ sửa (bấm → trang sửa mở hộp quản lý album: thêm nhiều ảnh, kéo đổi thứ tự, căn, xoá)
  function markAlbums() {
    var groups = new Map();
    Array.prototype.forEach.call(document.querySelectorAll('[data-ce-photo^="photos."]'), function (el) {
      var root = el.closest('section,[class*=album],[class*=-gal],[class*=film]'); if (!root) return;
      groups.set(root, (groups.get(root) || 0) + 1);
    });
    groups.forEach(function (n, root) { if (n >= 6) root.dataset.ceAlbum = '1'; });
  }
  function albumMsg(root) { // tỉ lệ khung ảnh album (để căn ảnh đúng khung)
    var ph = root && root.querySelector('[data-ce-photo]'), r = ph ? ph.getBoundingClientRect() : null;
    return { type: 'album', ratio: r && r.height ? r.width / r.height : 0.75 };
  }
  function albumAt(t) { return t && t.closest ? t.closest('[data-ce-album]') : null; }
  // nút điều khiển của album (mũi tên, chấm, ảnh nhỏ, xem toàn màn…) vẫn bấm được trong trình sửa
  function albumCtl(t) { var b = t.closest && t.closest('button,a'); return !!(b && !b.dataset.cePhoto && !b.querySelector('[data-ce-photo]') && !b.classList.contains('ph')); }
  function markPhotos() {
    Array.prototype.forEach.call(document.querySelectorAll('img[src*="k="]'), function (im) {
      var k = keyOf(im.getAttribute('src')); if (k) { im.dataset.cePhoto = k; im.dataset.ceEmpty = /\/card\/slot\.svg|[#&]s=1/.test(im.src) ? '1' : ''; }
    });
    Array.prototype.forEach.call(document.querySelectorAll('[style*="k="]'), function (el) {
      var s = el.getAttribute('style'), k = keyOf(s); if (k) { el.dataset.cePhoto = k; el.dataset.ceEmpty = /\/card\/slot\.svg|[#&]s=1/.test(s) ? '1' : ''; }
    });
    // ảnh vẽ trong SVG (<image href>, vd. khung bìa Long Phụng)
    Array.prototype.forEach.call(document.querySelectorAll('image'), function (im) {
      var h = svgHref(im), k = keyOf(h); if (k) { im.dataset.cePhoto = k; im.dataset.ceEmpty = /\/card\/slot\.svg|[#&]s=1/.test(h) ? '1' : ''; }
    });
  }
  function svgHref(im) { return im.getAttribute('href') || im.getAttribute('xlink:href') || ''; }
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
    LIST.push({ key: f[0], v: v, raw: f[1], ph: f[2] === 1 }); // 2 = chữ mẫu (thiệp chưa có ảnh): không làm mờ
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
  var MAPS = /\/\/(www\.)?google\.[^/]+\/maps|\/\/maps\.google\.|\/\/maps\.app\.goo\.gl|\/\/goo\.gl\/maps/i;
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
      // cả khu "… tổ chức tại" (tiêu đề, nơi, địa chỉ, bản đồ): khối cha chỉ có thông tin lễ, không ảnh / form / bản đồ khác → lấy cả khối
      var up = box.parentElement;
      if (up && up !== root && up !== document.body && !up.querySelector('[data-ce-photo],form') && !Array.prototype.some.call(up.querySelectorAll('[data-ev]'), function (x) { return x !== mp; })
        && !Array.prototype.some.call(up.querySelectorAll('[data-ce-key]'), function (k) { return !/^events\.\d+\.(name|place|address|time|date)$/.test(k.dataset.ceKey || ''); })) box = up;
      if (box.querySelector(':scope > .ce-map')) return;
      // lễ của khu: theo chữ "nơi tổ chức" / tên lễ hiện trong khu (bản đồ hay khớp nhầm lễ đầu khi hai lễ chung địa chỉ)
      var pk = box.querySelector('[data-ce-key$=".place"]') || box.querySelector('[data-ce-key$=".name"]');
      var pm = pk && /^events\.(\d+)\./.exec(pk.dataset.ceKey || ''); if (pm) i = +pm[1];
      if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
      var o = document.createElement('button');
      o.type = 'button'; o.className = 'ce-map'; o.dataset.ceKey = 'events.' + i + '.address';
      o.innerHTML = '<b>📍 Sửa địa điểm</b>';
      box.appendChild(o);
      box.classList.add('ce-venue');
      // khu địa điểm rộng gần hết màn hình: khung lùi vào trong để thấy đủ viền bo góc (không tràn ra mép)
      if (box.getBoundingClientRect().width >= document.documentElement.clientWidth - 24) o.classList.add('wide');
      // nút "Chỉ đường" vẫn mở Google Maps ngay trong trình sửa (nằm trên lớp phủ)
      Array.prototype.forEach.call(box.querySelectorAll('a[href]'), function (a) { if (MAPS.test(a.href)) a.classList.add('ce-go'); });
      // mẫu canvas (mh): các ô xếp chồng theo z-index → đưa khu địa điểm lên trên để nhãn không bị chữ bên trên đè
      if (box.closest('.mh-canvas')) box.style.zIndex = 30;
    });
  }

  // ---------- khối thông tin một lễ (tên lễ, giờ, ngày, âm lịch, đếm ngược, lịch tháng…) = một khối ----------
  // Mọi thứ trong khối đều sửa chung bảng "Sửa lễ" → viền cả khối + nhãn, bấm đâu trong khối cũng mở bảng đó
  // (thay vì vài chữ lẻ có viền, còn ngày tháng / đếm ngược thì không — dễ tưởng không sửa được).
  // Khối = các phần tử liền nhau chỉ chứa nội dung của lễ đó (hoặc phần chung như đếm ngược, lịch), dừng khi đụng
  // nội dung khác (lễ khác, tên đôi, ảnh, khu địa điểm…). Nhiều phần tử liền nhau thì khung phủ đúng vùng của chúng.
  var evBoxes = [];
  // khối "Lịch trình ngày cưới": phần tử nhỏ nhất chứa tên mọi lễ, không lẫn nội dung khác (tên đôi, khu bản đồ, form…)
  // → viền cả khối + một nhãn "✎ Sửa lịch trình"; bấm đâu trong khối cũng mở bảng sửa cả lịch trình (trừ ảnh trang trí)
  function markSchedule(root) {
    var STOP = '.ce-venue,form,[data-ev],a[href],input,textarea,select,button:not(.ce-schb):not(.ce-ev):not(.ce-map)';
    var foreign = function (el) {
      if (el.matches(STOP) || el.querySelector(STOP)) return true;
      return Array.prototype.some.call(el.querySelectorAll('[data-ce-key]'), function (k) { return !/^(events\.\d+\.(name|time|date)|time|date)$/.test(k.dataset.ceKey || ''); });
    };
    var count = function (el) { var o = {}; Array.prototype.forEach.call(el.querySelectorAll('[data-ce-key^="events."]'), function (k) { var m = /^events\.(\d+)\.name$/.exec(k.dataset.ceKey || ''); if (m) o[m[1]] = 1; }); return Object.keys(o).length; };
    var nEv = 0; Array.prototype.forEach.call(document.querySelectorAll('[data-ce-key^="events."]'), function (k) { var m = /^events\.(\d+)\./.exec(k.dataset.ceKey || ''); if (m) nEv = Math.max(nEv, +m[1] + 1); });
    // mọi khối gom đủ các lễ (lịch trình, danh sách lễ ở phần thông tin…) đều thành một cục, bấm là sửa cả lịch trình
    var boxes = [];
    Array.prototype.forEach.call(document.querySelectorAll('[data-ce-key^="events."]'), function (el) {
      if (!/^events\.\d+\.name$/.test(el.dataset.ceKey || '') || el.closest('.ce-venue')) return;
      var box = null;
      for (var p = el.parentElement; p && p !== root && p !== document.body && !foreign(p); p = p.parentElement) box = p;
      if (box && boxes.indexOf(box) < 0 && count(box) >= Math.max(1, Math.min(2, nEv))) boxes.push(box);
    });
    boxes = boxes.filter(function (b) { return !boxes.some(function (o) { return o !== b && o.contains(b); }); });
    boxes.forEach(function (box) {
      if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
      box.classList.add('ce-sched');
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ce-schb'; b.textContent = '✎ Sửa lịch trình';
      box.appendChild(b);
    });
    return boxes[0] || null;
  }
  // khối "thông tin hai nhà" (bố mẹ, địa chỉ nhà trai / nhà gái): một khối, bấm đâu cũng mở bảng sửa thông tin hai nhà
  function markFamily(root) {
    var seed = document.querySelector('[data-ce-key="groom.father"],[data-ce-key="groom.mother"],[data-ce-key="bride.father"],[data-ce-key="bride.mother"]');
    if (!seed) return null;
    var FAM = /^(groom|bride)\.(father|mother|address|fullName)$/;
    var ok = function (el) {
      if (el.querySelector('[data-ce-photo],form,.ce-sched,.ce-venue,a[href],button')) return false;
      return !Array.prototype.some.call(el.querySelectorAll('[data-ce-key]'), function (k) { return !FAM.test(k.dataset.ceKey || '') && !/^(groom|bride)\.name$/.test(k.dataset.ceKey || ''); });
    };
    var box = null;
    for (var p = seed.parentElement; p && p !== root && p !== document.body && ok(p); p = p.parentElement) box = p;
    if (!box) return null;
    var keys = Array.prototype.map.call(box.querySelectorAll('[data-ce-key]'), function (k) { return k.dataset.ceKey; });
    if (!keys.some(function (k) { return /^groom\./.test(k); }) || !keys.some(function (k) { return /^bride\./.test(k); })) return null; // phải đủ cả hai nhà
    if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
    box.classList.add('ce-sched', 'ce-fam');
    var b = document.createElement('button'); b.type = 'button'; b.className = 'ce-schb'; b.textContent = '✎ Sửa thông tin hai nhà';
    box.appendChild(b);
    return box;
  }
  // hộp mừng cưới: bấm phong bì / nút mở như khách xem; trong hộp, mã QR là ảnh (bấm → tải ảnh mã QR lên),
  // phần chữ quanh mã (ngân hàng, số tài khoản, chủ tài khoản) là một khung → bấm mở bảng sửa tài khoản
  function markGift() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-ce-photo^="gifts."]'), function (im) {
      var a = im.parentElement;
      while (a && a !== document.body && !(a.textContent || '').trim()) a = a.parentElement;
      if (!a || a === document.body || a.tagName === 'MAIN' || a.querySelector('dialog')) return;
      if (getComputedStyle(a).position === 'static') a.style.position = 'relative'; // nhãn ✎ bám theo khung (không đè vị trí của mẫu)
      a.classList.add('ce-giftc');
    });
  }
  function markEvents() {
    var root = document.querySelector('main.card') || document.body;
    markSchedule(root); markFamily(root); markGift();
    var byEv = {};
    Array.prototype.forEach.call(document.querySelectorAll('[data-ce-key^="events."]'), function (el) {
      var m = /^events\.(\d+)\.(name|time)$/.exec(el.dataset.ceKey || '');
      if (!m || el.closest('.ce-venue') || el.closest('.ce-sched')) return;
      if ((el.textContent || '').indexOf('+ Thêm lễ') >= 0) return; // dòng thêm lễ mới
      (byEv[m[1]] = byEv[m[1]] || []).push(el);
    });
    var foreign = function (p, i) {
      // ảnh, khu địa điểm, form, link / nút bấm của thiệp (xác nhận tham dự, thêm vào lịch…) là ranh giới
      var STOP = '[data-ce-photo],.ce-venue,form,[data-ev],a[href],input,textarea,select,button:not(.ce-ev):not(.ce-map)';
      if (p.matches(STOP + ',script,style')) return true;
      return Array.prototype.some.call(p.querySelectorAll('[data-ce-key]'), function (k) {
        var mm = /^events\.(\d+)\./.exec(k.dataset.ceKey || '');
        return mm ? +mm[1] !== i || (k.textContent || '').indexOf('+ Thêm lễ') >= 0 : k.dataset.ceKey !== 'time';
      }) || !!p.querySelector(STOP);
    };
    Object.keys(byEv).forEach(function (k) {
      var i = +k, runs = [];
      byEv[k].forEach(function (el) {
        var box = el;
        for (var p = el.parentElement; p && p !== root && p !== document.body && !foreign(p, i); p = p.parentElement) box = p;
        var C = box.parentElement;
        if (!C || box === root) return;
        // gom thêm các phần tử anh em liền kề không chứa nội dung khác
        var kids = Array.prototype.slice.call(C.children), a = kids.indexOf(box), z = a;
        while (a > 0 && !foreign(kids[a - 1], i)) a--;
        while (z < kids.length - 1 && !foreign(kids[z + 1], i)) z++;
        var els = kids.slice(a, z + 1).filter(function (x) { return !/^(SCRIPT|STYLE)$/.test(x.tagName) && !x.classList.contains('ce-ev'); });
        var has = function (f) { return els.some(function (x) { return x.matches('[data-ce-key="events.' + i + '.' + f + '"]') || x.querySelector('[data-ce-key="events.' + i + '.' + f + '"]'); }); };
        if (!has('name') || !has('time')) return; // chữ lẻ trong câu: giữ viền chữ như cũ
        if (els.length === 1 && /^(SPAN|B|I|STRONG|EM)$/.test(els[0].tagName)) return;
        if (runs.some(function (r) { return r.C === C && r.els[0] === els[0]; })) return;
        runs.push({ C: C, els: els });
      });
      // bỏ khối nằm trong khối lớn hơn của cùng lễ
      runs = runs.filter(function (r) { return !runs.some(function (o) { return o !== r && o.els.some(function (x) { return x !== r.C && x.contains(r.C) || x === r.C; }); }); });
      var f = FIELDS.filter(function (x) { return x[0] === 'events.' + i + '.name' && x[2] !== 1; })[0];
      runs.forEach(function (r) {
        var host = r.els.length === 1 ? r.els[0] : r.C;
        if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
        var o = document.createElement('button');
        o.type = 'button'; o.className = 'ce-ev'; o.dataset.ceKey = 'events.' + i + '.time';
        o.title = 'Sửa ' + (f ? f[1] : 'lễ');
        o.innerHTML = '<b>✎ Sửa ' + (f ? String(f[1]).replace(/[<>&]/g, '') : 'ngày giờ') + '</b>';
        host.appendChild(o);
        r.els.forEach(function (x) { x.classList.add('ce-evbox'); x._ceEv = o; });
        evBoxes.push({ o: o, host: host, els: r.els });
      });
    });
    layoutEvents();
  }
  // khung phủ đúng vùng các phần tử của khối (tính lại khi chữ / ảnh / cỡ màn hình đổi)
  function layoutEvents() {
    var photos = Array.prototype.slice.call(document.querySelectorAll('[data-ce-photo]'));
    evBoxes.forEach(function (b) {
      if (b.off) return;
      var hr = b.host.getBoundingClientRect(), t = Infinity, l = Infinity, btm = -Infinity, rt = -Infinity;
      // chỉ tính phần có chữ (bỏ lớp trang trí phủ rộng)
      b.els.forEach(function (x) { if (!(x.textContent || '').trim()) return; var r = x.getBoundingClientRect(); if (!r.height && !r.width) return; t = Math.min(t, r.top); l = Math.min(l, r.left); btm = Math.max(btm, r.bottom); rt = Math.max(rt, r.right); });
      if (t === Infinity || btm - t < 8) { b.o.style.display = 'none'; return; }
      // khung đè lên ô ảnh → bỏ khung (để còn bấm được ảnh), trả lại viền từng chữ như cũ
      var hitsPhoto = photos.some(function (ph) {
        var r = ph.getBoundingClientRect(), w = Math.min(rt, r.right) - Math.max(l, r.left), h = Math.min(btm, r.bottom) - Math.max(t, r.top);
        return w > 24 && h > 24 && r.width > 40;
      });
      if (hitsPhoto) { b.off = true; b.o.remove(); b.els.forEach(function (x) { x.classList.remove('ce-evbox'); }); return; }
      b.o.style.display = '';
      {
        b.o.style.inset = 'auto';
        b.o.style.top = (t - hr.top - b.host.clientTop - 6) + 'px'; b.o.style.left = (l - hr.left - b.host.clientLeft - 6) + 'px';
        b.o.style.width = (rt - l + 12) + 'px'; b.o.style.height = (btm - t + 12) + 'px';
      }
      b.o.classList.toggle('sm', rt - l < 200 || btm - t < 70); // ô nhỏ (dòng lịch trình): chỉ nút ✎ ở góc
    });
  }
  window.addEventListener('resize', layoutEvents);
  window.addEventListener('load', layoutEvents);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutEvents);

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
  var SV = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var hl = document.createElement('div'); hl.className = 'ce-hl'; hl.style.display = 'none';
  hl.innerHTML = '<b></b><span class="ce-alb"><button type="button" data-a="album">' + '✎ Sửa album ảnh' + '</button></span><span class="ce-act"><button type="button" data-a="edit">✎ Sửa ảnh</button></span>';
  document.body.appendChild(hl);
  var hlEl = null;
  function inHl(x, y) {
    if (!hlEl || hl.style.display === 'none' || !hlEl.isConnected) return false;
    var r = hlEl.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }
  function showHl(el) {
    hlEl = el || null;
    hl.classList.toggle('alb', !!(el && el.dataset.ceAlbum));
    if (!el) { hl.style.display = 'none'; return; }
    var r = el.getBoundingClientRect();
    hl.style.display = 'block';
    // ảnh xoay nghiêng (ảnh polaroid, ảnh cài trong phong bì…): khung xoay theo đúng góc + cỡ thật của ảnh, không lấy hình chữ nhật bao ngoài
    var ang = 0, sc = 1;
    for (var p = el; p && p.nodeType === 1; p = p.parentElement) {
      var tf = getComputedStyle(p).transform;
      if (tf && tf !== 'none') { var m = /matrix\(([^)]+)\)/.exec(tf); if (m) { var v = m[1].split(',').map(parseFloat); ang += Math.atan2(v[1], v[0]); sc *= Math.sqrt(v[0] * v[0] + v[1] * v[1]); } }
    }
    if (Math.abs(ang) > 0.005 && el.offsetWidth) {
      var w = el.offsetWidth * sc, h = el.offsetHeight * sc, cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      hl.style.left = (cx - w / 2) + 'px'; hl.style.top = (cy - h / 2) + 'px'; hl.style.width = w + 'px'; hl.style.height = h + 'px';
      hl.style.transform = 'rotate(' + ang + 'rad)';
    } else {
      hl.style.transform = '';
      hl.style.left = r.left + 'px'; hl.style.top = r.top + 'px'; hl.style.width = r.width + 'px'; hl.style.height = r.height + 'px';
    }
    hl.classList.toggle('has', !el.dataset.ceEmpty && !el.dataset.ceAlbum); hl.dataset.k = el.dataset.cePhoto || '';
    hl.firstChild.textContent = '+ Tải ảnh lên';
  }
  // bấm nút trên khung ảnh: bắt ở pha đầu (capture) để không bị trình bấm-ảnh chung bên dưới nhận mất
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.ce-hl [data-a]'); if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (b.dataset.a === 'album') { tell(albumMsg(hlEl)); return; }
    var el = hlEl || document.querySelector('[data-ce-photo="' + hl.dataset.k + '"]'); if (!el) return;
    var r = el.getBoundingClientRect(), rw = el.offsetWidth || r.width, rh = el.offsetHeight || r.height; // ảnh xoay nghiêng: tỉ lệ theo cỡ thật
    tell({ type: 'photo', key: el.dataset.cePhoto, empty: false, ratio: rw / Math.max(1, rh), act: b.dataset.a === 'edit' ? '' : b.dataset.a }); // "Sửa ảnh" → hộp Căn chỉnh (có Thay / Xoá)
  }, true);
  document.addEventListener('pointermove', function (e) {
    hl.style.display = 'none'; return; // 27/11: bỏ hiệu ứng rê chuột — chỗ sửa được đã luôn có dấu (viền đứt, nhãn ✎)
    /* eslint-disable no-unreachable */
    // chuột đang trên nút "Căn chỉnh / Thay ảnh": giữ khung (góc ảnh vòm / bo tròn nằm ngoài phần ảnh thật)
    if (hlEl && hl.contains(e.target)) return;
    var alb = albumAt(e.target);
    var hit = alb || (e.target.closest && e.target.closest('[data-ce-key]') ? null : photoAt(e.clientX, e.clientY));
    // chuột còn trong khung chữ nhật của ảnh (kể cả góc ngoài ảnh vòm / bo tròn, chỗ đặt nút) → giữ khung + 2 nút
    if (!hit && inHl(e.clientX, e.clientY)) return;
    showHl(hit);
  }, { passive: true });
  document.addEventListener('scroll', function () { hl.style.display = 'none'; }, { passive: true });
  document.addEventListener('mouseleave', function () { hl.style.display = 'none'; });

  // ---------- khung bao sát chữ (rê chuột / đang sửa) ----------
  var LBL = { lead: 'Dòng báo tin', name: 'Tên', fullName: 'Họ tên', father: 'Tên bố', mother: 'Tên mẹ', address: 'Địa chỉ', place: 'Nơi tổ chức', inviteText: 'Lời mời', message: 'Lời nhắn', story: 'Câu chuyện', time: 'Giờ', date: 'Ngày' };
  function labelOf(key) {
    var p = key.split('.'), last = p[p.length - 1];
    var who = p[0] === 'groom' ? (last === 'name' ? 'Tên chú rể' : 'Chú rể · ') : p[0] === 'bride' ? (last === 'name' ? 'Tên cô dâu' : 'Cô dâu · ') : '';
    if (who.indexOf('Tên') === 0) return who;
    return who + (LBL[last] || 'Sửa chữ');
  }
  function textRect(el) {
    var r = document.createRange();
    try { r.selectNodeContents(el); } catch (e) { return el.getBoundingClientRect(); }
    var b = r.getBoundingClientRect();
    return b.width && b.height ? b : el.getBoundingClientRect();
  }
  function txBox() { var d = document.createElement('div'); d.className = 'ce-tx'; d.innerHTML = '<b></b>'; document.documentElement.appendChild(d); return d; }
  var hov = txBox(), sel = txBox(); sel.classList.add('sel');
  var selEl = null;
  function placeTx(box, el) {
    if (!el || !el.isConnected) { box.style.display = 'none'; return; }
    var b = textRect(el), pad = 4, sx = window.scrollX, sy = window.scrollY;
    box.style.display = 'block';
    box.style.left = (b.left + sx - pad) + 'px'; box.style.top = (b.top + sy - pad) + 'px';
    box.style.width = (b.width + pad * 2) + 'px'; box.style.height = (b.height + pad * 2) + 'px';
    box.classList.toggle('up', b.top < 28);
    box.firstChild.textContent = '✎ ' + labelOf(el.dataset.ceKey || '');
  }
  var plain = function (el) { return el && !el.classList.contains('ce-map') && !el.classList.contains('ce-ev') && !el.closest('.ce-evbox'); };
  document.addEventListener('pointerover', function (e) {
    if (e.pointerType !== 'mouse' || true) return; // bỏ khung chữ khi rê chuột (dấu gạch chấm đã luôn hiện)
    var t = e.target.closest && e.target.closest('[data-ce-key]:not(.ce-dup)');
    if (t && plain(t) && t !== selEl) placeTx(hov, t); else hov.style.display = 'none';
  }, { passive: true });
  document.addEventListener('mouseleave', function () { hov.style.display = 'none'; });
  function select(el) {
    document.querySelectorAll('.ce-on').forEach(function (x) { x.classList.remove('ce-on'); });
    selEl = el && plain(el) ? el : null;
    if (el) el.classList.add('ce-on');
    hov.style.display = 'none';
    placeTx(sel, selEl);
  }
  function refreshTx() { if (selEl) placeTx(sel, selEl); }
  window.addEventListener('resize', refreshTx);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshTx);
  // trang sửa đang gõ ô nào → cuộn tới chữ đó trên thiệp + bao khung
  function focusKey(key) {
    var m = /^events\.(\d+)\./.exec(key), el = null;
    var all = Array.prototype.slice.call(document.querySelectorAll('[data-ce-key="' + key + '"]'));
    el = all.filter(plain)[0] || all[0];
    if (!el && m) el = document.querySelector('.ce-ev[data-ce-key^="events.' + m[1] + '."]') || document.querySelector('[data-ce-key^="events.' + m[1] + '."]');
    if (!el) { select(null); return; }
    select(el);
    var r = el.getBoundingClientRect();
    if (r.top < 60 || r.bottom > innerHeight - 60) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setTimeout(refreshTx, 450);
  }

  // ---------- các phần của thiệp (cột "Các phần" trong trang sửa) ----------
  var secs = [];
  // đặt tên phần theo nội dung (mẫu nhập hay có tiêu đề kiểu "and", "Beautiful"…)
  var KINDS = [
    [function (x, t) { return x.querySelector('form textarea') || /lưu bút|gửi lời chúc|lời chúc/.test(t); }, 'Sổ lưu bút'],
    [function (x, t) { return x.querySelector('form select,form input[type=radio]') || /^(hãy )?xác nhận|rsvp/.test(t); }, 'Xác nhận tham dự'],
    [function (x, t) { return /mừng cưới|hộp mừng|quà cưới|chuyển khoản/.test(t); }, 'Mừng cưới'],
    [function (x, t) { return x.querySelector('.mh-cal,.cal,[class*="calendar"]') || /tháng \d{1,2}\s*\/\s*\d{4}/.test(t); }, 'Lịch tháng'],
    [function (x, t) { return /đếm ngược|countdown|until we|ngày\s*giờ\s*phút/.test(t) || x.querySelector('[data-cd]'); }, 'Đếm ngược'],
    [function (x, t) { return /timeline|lịch trình|\d{1,2}\s*:\s*\d{2}.*\d{1,2}\s*:\s*\d{2}.*\d{1,2}\s*:\s*\d{2}/.test(t); }, 'Lịch trình'],
    [function (x, t) { return /câu chuyện|love story|chuyện tình|hành trình/.test(t); }, 'Chuyện tình yêu'],
    [function (x, t) { return /album|khoảnh khắc|beautiful|gallery|kỷ niệm/.test(t); }, 'Album ảnh'],
    [function (x, t) { return /hôn lễ|trân trọng|kính mời|thành hôn|vu quy|tiệc cưới|nhà trai|nhà gái/.test(t); }, 'Lời mời & lễ cưới'],
    [function (x, t) { return /chú rể.*cô dâu|cô dâu.*chú rể|groom|bride/.test(t); }, 'Cô dâu & chú rể'],
    [function (x, t) { return /cảm ơn|thank/.test(t); }, 'Lời cảm ơn'],
  ];
  // xét phần chữ đầu tiên của phần (tiêu đề) trước, không khớp mới xét cả phần — tránh lấy tên theo một nút lẻ
  // (vd. phần lời mời có nút "Xác nhận tham dự")
  function kindOf(x) {
    var parts = [], w = document.createTreeWalker(x, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) { var v = n.nodeValue.trim(); if (v && n.parentElement && !/^(SCRIPT|STYLE|OPTION)$/.test(n.parentElement.tagName)) parts.push(v); }
    var head = parts.slice(0, 3).join(' ').toLowerCase(), all = parts.join(' ').toLowerCase().slice(0, 700);
    var none = document.createElement('i');
    for (var k = 0; k < KINDS.length; k++) if (KINDS[k][0](none, head)) return KINDS[k][1];
    for (k = 0; k < KINDS.length; k++) if (KINDS[k][0](x, all)) return KINDS[k][1];
    return '';
  }
  function sections() {
    var root = document.querySelector('main.card') || document.body;
    var mh = root.querySelector('.mh-canvas');
    var list = mh ? Array.prototype.slice.call(mh.children).filter(function (x) { return x.tagName === 'SECTION'; }) : Array.prototype.slice.call(root.children);
    secs = list.filter(function (x) { return x.offsetHeight > 120 && !/^(SCRIPT|STYLE|DIALOG|TEMPLATE)$/.test(x.tagName); });
    return secs.map(function (x, i) {
      var h = x.querySelector('h1,h2,h3');
      var t = (h && h.textContent.trim()) || '';
      if (!t) {
        var w = document.createTreeWalker(x, NodeFilter.SHOW_TEXT, { acceptNode: function (n) { var p = n.parentElement; return p && !/^(SCRIPT|STYLE|OPTION|BUTTON)$/.test(p.tagName) && n.nodeValue.trim().length > 2 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } });
        var n = w.nextNode(); t = n ? n.nodeValue.trim() : '';
      }
      t = t.replace(/\s+/g, ' ');
      return { i: i, label: i === 0 ? 'Trang bìa' : kindOf(x) || (t.length > 34 ? t.slice(0, 32) + '…' : t) || 'Phần ' + (i + 1) };
    });
  }
  window.addEventListener('scroll', function () {
    if (!secs.length) return;
    var mid = innerHeight * 0.4, cur = 0;
    secs.forEach(function (x, i) { if (x.getBoundingClientRect().top <= mid) cur = i; });
    if (cur !== window.__ceSec) { window.__ceSec = cur; tell({ type: 'section', i: cur }); }
  }, { passive: true });

  // ---------- nhãn "✎ Sửa ảnh" luôn hiện trên mỗi ảnh chính (không cần rê chuột / chạm thử mới biết sửa được) ----------
  var phBadges = [];
  function markPhotoBadges() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-ce-photo]'), function (el) {
      if (el.dataset.ceAlbum || el.closest('.ce-sched,[data-ce-album]')) return; // ảnh trong album: chỉ một nhãn "Sửa album ảnh" cho cả khối
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ce-phb'; b.textContent = el.dataset.ceEmpty ? '+ Thêm ảnh' : '✎ Sửa ảnh';
      b.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var r = el.getBoundingClientRect();
        tell({ type: 'photo', key: el.dataset.cePhoto, empty: !!el.dataset.ceEmpty, ratio: (el.offsetWidth || r.width) / Math.max(1, el.offsetHeight || r.height) });
      });
      document.body.appendChild(b); phBadges.push({ b: b, el: el });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-ce-album]'), function (root) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ce-phb'; b.textContent = '✎ Sửa album ảnh';
      b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); tell(albumMsg(root)); });
      document.body.appendChild(b); phBadges.push({ b: b, el: root, album: true });
    });
    layoutBadges();
  }
  // góc xoay + cỡ thật của một phần tử (cộng dồn transform của các lớp cha) — ảnh polaroid nghiêng, ảnh cài phong bì…
  function rotOf(el) {
    var ang = 0, sc = 1;
    for (var p = el; p && p.nodeType === 1; p = p.parentElement) {
      var tf = getComputedStyle(p).transform;
      if (tf && tf !== 'none') { var m = /matrix\(([^)]+)\)/.exec(tf); if (m) { var v = m[1].split(',').map(parseFloat); ang += Math.atan2(v[1], v[0]); sc *= Math.sqrt(v[0] * v[0] + v[1] * v[1]); } }
    }
    var r = el.getBoundingClientRect();
    return { ang: ang, w: (el.offsetWidth || r.width) * sc, h: (el.offsetHeight || r.height) * sc, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  }
  function layoutBadges() {
    phBadges.forEach(function (x) {
      if (!x.el.isConnected) { x.b.style.display = 'none'; return; }
      if (x.album) { var ra = x.el.getBoundingClientRect(); x.b.style.display = ''; x.b.style.transform = 'translate(-50%,0)'; x.b.style.left = (ra.left + window.scrollX + ra.width / 2) + 'px'; x.b.style.top = (ra.top + window.scrollY + 8) + 'px'; return; }
      var o = rotOf(x.el);
      if (o.w < 90 || o.h < 70) { x.b.style.display = 'none'; return; } // ảnh trang trí nhỏ: bỏ nhãn
      x.b.style.display = '';
      // giữa mép trên của ảnh (theo khung đã xoay), nhãn xoay cùng góc ảnh
      var dy = -o.h / 2 + 12, px = o.cx - Math.sin(o.ang) * dy, py = o.cy + Math.cos(o.ang) * dy;
      x.b.style.left = (px + window.scrollX) + 'px'; x.b.style.top = (py + window.scrollY) + 'px';
      x.b.style.transform = 'translate(-50%,0) rotate(' + o.ang + 'rad)'; x.b.style.transformOrigin = '50% 0';
    });
  }
  window.addEventListener('resize', layoutBadges); window.addEventListener('load', layoutBadges);
  setInterval(layoutBadges, 1500); // ảnh / chữ đổi cỡ sau khi tải, hiệu ứng hiện dần…
  // ---------- cùng một trường lặp lại trên thiệp (tên đôi, ngày, tên bố mẹ…): chỉ chỗ đầu tiên sửa được ----------
  // sửa ở chỗ đầu thì các chỗ sau tự đổi theo → bỏ viền / nhãn / bấm ở các chỗ sau cho đỡ rối (khối lịch trình, địa điểm giữ nguyên)
  function markDups() {
    var seen = {};
    Array.prototype.forEach.call(document.querySelectorAll('[data-ce-key]'), function (el) {
      if (el.classList.contains('ce-map') || el.classList.contains('ce-ev') || el.closest('.ce-sched,.ce-venue,.ce-evbox')) return;
      var k = el.dataset.ceKey;
      if (seen[k]) el.classList.add('ce-dup'); else seen[k] = 1;
    });
  }
  // ---------- bấm: báo cho trang sửa ----------
  function tell(msg) { try { window.parent.postMessage(Object.assign({ ce: 1 }, msg), location.origin); } catch (e) { /* không ở trong khung */ } }
  document.addEventListener('click', function (e) {
    var go = e.target.closest && e.target.closest('a.ce-go');
    if (go) return; // Chỉ đường → mở Google Maps
    var t = e.target.closest && e.target.closest('[data-ce-key]');
    // bấm vào bất kỳ đâu trong khối thông tin lễ (kể cả ngày tháng, đếm ngược, lịch) = bấm khung "Sửa lễ"
    var vb = e.target.closest && e.target.closest('.ce-venue');
    if (vb && t && !t.classList.contains('ce-map')) { var vm = vb.querySelector(':scope > .ce-map'); if (vm) t = vm; }
    var sb = e.target.closest && e.target.closest('.ce-sched');
    if (sb && !(t && t.classList.contains('ce-map')) && !photoAt(e.clientX, e.clientY)) { e.preventDefault(); e.stopPropagation(); tell({ type: 'text', key: sb.classList.contains('ce-fam') ? 'family' : /lịch trình/i.test((sb.textContent || '').replace('✎ Sửa lịch trình', '')) ? 'events.all+' : 'events.all', value: '' }); return; }
    var gc = e.target.closest && e.target.closest('.ce-giftc');
    if ((gc || (t && /^gifts\./.test(t.dataset.ceKey || ''))) && !photoAt(e.clientX, e.clientY)) { e.preventDefault(); e.stopPropagation(); tell({ type: 'extra', key: 'gift' }); return; }
    var eb = e.target.closest && e.target.closest('.ce-evbox');
    if (eb && eb._ceEv && eb._ceEv.isConnected && !(t && t.classList.contains('ce-map'))) t = eb._ceEv;
    if (t) {
      e.preventDefault(); e.stopPropagation();
      select(t);
      var f = FIELDS.filter(function (x) { return x[0] === t.dataset.ceKey; })[0];
      tell({ type: 'text', key: t.dataset.ceKey, value: f ? f[1] : '', map: t.classList.contains('ce-map') });
      return;
    }
    var ex = e.target.closest && e.target.closest('.s-extra');
    if (ex && !e.target.closest('a[href^="tel:"]')) { e.preventDefault(); e.stopPropagation(); tell({ type: 'extra', key: ex.classList.contains('s-dress') ? 'dress' : ex.classList.contains('s-qa') ? 'qa' : 'contact' }); return; }
    if (ex) { e.preventDefault(); e.stopPropagation(); tell({ type: 'extra', key: 'contact' }); return; }
    var ab = albumAt(e.target);
    if (ab && !albumCtl(e.target)) { e.preventDefault(); e.stopPropagation(); tell(albumMsg(ab)); return; }
    var ph = photoAt(e.clientX, e.clientY) || (inHl(e.clientX, e.clientY) ? hlEl : null); // bấm góc ngoài ảnh vòm (trong khung) = bấm ảnh
    // album trượt (ảnh giữa to, hai bên hẹp): chạm ảnh bên cạnh thì để mẫu chuyển ảnh đó vào giữa trước,
    // chạm lần nữa mới tải / căn ảnh — tránh căn ảnh theo khung hẹp của ảnh bên cạnh
    var side = ph && ph.closest('[data-o]');
    if (side && side.dataset.o !== '0') return;
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
    refreshTx();
    re = new RegExp(escRx(String(val).normalize('NFC').trim()), 'giu');
    RX.forEach(function (r) { if (r.f.key === key) { r.f.raw = val; r.re = re; } });
  }
  // ---------- trang sửa vừa chọn ảnh → hiện ngay ảnh trong máy (chưa chờ tải lên xong); nhấp nháy nhẹ tới khi lưu xong ----------
  // final: ảnh thật đã tải lên xong → thôi nhấp nháy (trang sửa không vẽ lại thiệp nữa)
  function photoPatch(key, src, final) {
    var tagged = src + (src.indexOf('#') >= 0 ? '&' : '#') + 'k=' + key;
    var re = new RegExp('url\\(([\'"]?)[^\'")]*[#&]k=' + key.replace('.', '\\.') + '(?![\\w.])[^\'")]*\\1\\)', 'g');
    Array.prototype.forEach.call(document.querySelectorAll('[data-ce-photo="' + key + '"]'), function (el) {
      if (el.tagName.toLowerCase() === 'image') {
        el.removeAttribute('xlink:href'); el.setAttribute('href', tagged);
      } else if (el.tagName === 'IMG') {
        el.removeAttribute('srcset');
        el.style.objectPosition = el.style.scale = el.style.clipPath = el.style.transformOrigin = ''; // bỏ phần căn của ảnh cũ
        el.src = tagged;
      } else {
        el.setAttribute('style', el.getAttribute('style').replace(re, 'url("' + tagged + '")'));
        el.style.backgroundSize = ''; el.style.backgroundPosition = '';
      }
      el.dataset.ceEmpty = '';
      if (final) delete el.dataset.ceUp; else el.dataset.ceUp = '1';
      if (window.__applyFocus && el.parentElement) window.__applyFocus(el.parentElement); // căn đúng phần đã chọn (#p=…)
    });
  }
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data) return;
    if (e.data.cePatch) patch(e.data.key, e.data.value);
    if (e.data.cePhoto) photoPatch(e.data.key, e.data.src, e.data.final);
    if (e.data.ceFocus) focusKey(e.data.key);
    if (e.data.ceBlur) select(null);
    if (e.data.ceGo !== undefined && secs[e.data.ceGo]) secs[e.data.ceGo].scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (e.data.ceSel) goSel(e.data.ceSel);
  });
  // trang sửa (máy tính) mở một mục bên phải → thiệp cuộn tới phần tương ứng và nháy viền nhẹ
  // sel: { top, css: [bộ chọn], keys: [đầu khoá data-ce-key], kind: [tên phần theo KINDS] } — thử lần lượt
  function goSel(sel) {
    if (sel.top) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    var el = null, i;
    for (i = 0; !el && sel.css && i < sel.css.length; i++) el = document.querySelector(sel.css[i]);
    for (i = 0; !el && sel.keys && i < sel.keys.length; i++) {
      var all = Array.prototype.slice.call(document.querySelectorAll('[data-ce-key^="' + sel.keys[i] + '"]'));
      el = all.filter(function (x) { return x.offsetParent !== null; })[0] || null;
    }
    if (!el && sel.kind) { if (!secs.length) sections(); el = secs.filter(function (x) { return sel.kind.indexOf(kindOf(x)) >= 0; })[0] || null; }
    if (!el) return;
    tell({ type: 'selDone' });
    var box = el.closest('section') || el;
    if (box.offsetHeight > innerHeight * 0.9) box = el;
    box.scrollIntoView({ behavior: 'smooth', block: box === el ? 'center' : 'start' });
    box.classList.remove('ce-flash'); void box.offsetWidth; box.classList.add('ce-flash');
    setTimeout(function () { box.classList.remove('ce-flash'); }, 1600);
  }

  function init() {
    markPhotos(); markAlbums(); markText(); markMaps(); markEvents(); markDups(); markPhotoBadges(); lockForms();
    freezePhotos();
    window.addEventListener('load', freezePhotos); // hiệu ứng bắt đầu khi ảnh tải xong
    tell({ type: 'ready' });
    tell({ type: 'sections', list: sections() });
    // gợi ý chỉ hiện lần đầu, không hiện lại mỗi lần thiệp vẽ lại sau khi lưu
    try { if (sessionStorage.getItem('ceTip')) return; sessionStorage.setItem('ceTip', '1'); } catch (e) { /* bỏ qua */ }
    var tip = document.createElement('div'); tip.className = 'ce-tip';
    tip.textContent = 'Bấm vào ảnh hoặc chữ trên thiệp để sửa';
    document.body.appendChild(tip);
    setTimeout(function () { tip.style.opacity = '0'; }, 3500);
    setTimeout(function () { tip.remove(); }, 4200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
