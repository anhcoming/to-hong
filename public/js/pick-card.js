// "Dùng mẫu" khi đã có thiệp: một đám cưới có thể có nhiều thiệp (nhà trai, nhà gái…) và thiệp đã kích hoạt vẫn đổi mẫu được.
// window.useTemplate(template, palette) → Promise<card | null>: gửi POST /api/cards; máy chủ trả 409 { choose } khi cần hỏi
// (đã kích hoạt / có nhiều thiệp) → hiện bảng chọn: đổi mẫu thiệp nào, hay làm thêm một thiệp mới. Đóng bảng = null.
// Không phụ thuộc common.js (trang giới thiệu cũng dùng).
(function () {
  if (window.useTemplate) return;
  var css = '.pk-ov{position:fixed;inset:0;z-index:2147483600;background:rgba(30,15,18,.45);display:flex;align-items:flex-end;justify-content:center;animation:pkIn .2s ease}'
    + '@media(min-width:640px){.pk-ov{align-items:center}}@keyframes pkIn{from{opacity:0}}'
    + '.pk{position:relative;width:100%;max-width:440px;max-height:88vh;overflow:auto;background:#fff;color:#1f1a1b;border-radius:22px 22px 0 0;padding:20px 16px 22px;font-family:inherit;box-sizing:border-box}'
    + '@media(min-width:640px){.pk{border-radius:22px}}'
    + '.pk h4{margin:0 34px 4px 0;font-size:17px}.pk p{margin:0 0 14px;color:#7a6e70;font-size:13px;line-height:1.5}'
    + '.pk-x{position:absolute;right:12px;top:12px;width:32px;height:32px;border-radius:50%;border:0;background:#f6eff0;color:#7a6e70;font-size:16px;cursor:pointer}'
    + '.pk-o{display:flex;gap:11px;align-items:center;width:100%;border:0;border-radius:14px;padding:10px;margin:0 0 8px;background:#fff;box-shadow:0 0 0 1px #efe3e4;text-align:left;font:inherit;color:inherit;cursor:pointer}'
    + '.pk-o:hover{box-shadow:0 0 0 2px #d6455d;background:#fff7f8}'
    + '.pk-o i{flex:none;width:42px;height:56px;border-radius:8px;background:#f3e6e8 center top/cover;display:grid;place-items:center;font-style:normal;font-weight:800;color:#d6455d;font-size:20px}'
    + '.pk-o b{display:block;font-size:14px}.pk-o small{display:block;color:#7a6e70;font-size:12px;margin-top:2px;line-height:1.4}'
    + '.pk-o .ok{color:#1f8a5b;font-weight:700}';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function post(body) {
    return fetch('/api/cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw Object.assign(new Error(j.error || 'Có lỗi, bạn thử lại nhé'), { status: r.status, choose: !!j.choose }); return j; }); });
  }
  function sheet(template, palette, cards, tplName) {
    return new Promise(function (done) {
      if (!document.getElementById('pkCss')) { var st = document.createElement('style'); st.id = 'pkCss'; st.textContent = css; document.head.appendChild(st); }
      var ov = document.createElement('div'); ov.className = 'pk-ov';
      var paid = cards.some(function (c) { return c.paid; });
      var names = (cards.find(function (c) { return c.names; }) || {}).names || '';
      var cover = function (c) { return c.cover ? c.cover.split('#')[0] : '/demo/cover-' + c.template + '-' + c.palette + '.jpg'; };
      ov.innerHTML = '<div class="pk" role="dialog" aria-modal="true"><button class="pk-x" aria-label="Đóng">✕</button>'
        + '<h4>Dùng mẫu ' + esc(tplName || template) + ' cho…</h4>'
        + '<p>' + (paid ? 'Đám cưới ' + esc(names) + ' đã kích hoạt. ' : '') + 'Đổi mẫu hay làm thêm thiệp đều miễn phí — chữ, ảnh, ngày giờ giữ nguyên.</p>'
        + cards.map(function (c) {
          return '<button class="pk-o" data-t="' + esc(c.id) + '"><i style="background-image:url(\'' + esc(cover(c)) + '\')"></i><span><b>Đổi mẫu “' + esc(c.title || c.names || 'Thiệp') + '”</b><small>'
            + esc(c.tplName || c.template) + ' → ' + esc(tplName || template) + (c.status === 'published' ? ' · link đã gửi khách vẫn dùng được' : '') + (c.paid ? ' · <span class="ok">đã kích hoạt</span>' : '') + '</small></span></button>';
        }).join('')
        + '<button class="pk-o" data-t="new"><i>＋</i><span><b>Làm thêm một thiệp mới</b><small>Ví dụ thiệp nhà gái, thiệp mời bạn bè' + (paid ? ' · đã có trong gói' : '') + '</small></span></button></div>';
      var close = function (v) { ov.remove(); document.removeEventListener('keydown', key); done(v); };
      var key = function (e) { if (e.key === 'Escape') close(null); };
      document.addEventListener('keydown', key);
      ov.onclick = function (e) {
        if (e.target === ov || e.target.closest('.pk-x')) return close(null);
        var b = e.target.closest('[data-t]'); if (b) close(b.dataset.t);
      };
      document.body.appendChild(ov);
    });
  }
  window.useTemplate = function (template, palette, tplName, beforeSheet) {
    return post({ template: template, palette: palette }).then(function (r) { return r.card; }, function (e) {
      if (!e.choose) throw e;
      if (beforeSheet) beforeSheet(); // trang gợi ý mở sẵn tab mới: đóng lại để khách thấy bảng chọn
      return Promise.all([
        fetch('/api/cards', { credentials: 'same-origin' }).then(function (r) { return r.json(); }),
        fetch('/api/meta', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).catch(function () { return {}; }),
      ]).then(function (x) {
        var tpls = (x[1] && x[1].templates) || [], nm = function (id) { var t = tpls.find(function (y) { return y.id === id; }); return t ? t.name : id; };
        var cards = (x[0].cards || []).filter(function (c) { return !c.guest; }).map(function (c) { c.tplName = nm(c.template); return c; });
        return sheet(template, palette, cards, tplName || nm(template));
      }).then(function (target) {
        if (!target) return null;
        return post({ template: template, palette: palette, target: target }).then(function (r) { return r.card; });
      });
    });
  };
})();
