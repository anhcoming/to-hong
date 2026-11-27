// Thanh 5 nút dưới cùng trên điện thoại — dùng chung cho trang giới thiệu (site.js) và trang tài khoản (common.js):
// Trang chủ · Thiệp · Video (slide, màn hình dạm ngõ, báo hỷ) · Màn LED · ảnh đại diện (bảng tài khoản: đồ của tôi, sổ tay, đăng xuất).
// window.cnBottom.draw(active, user): active = khoá trang (home, tpl, cards, slide, baohy, videos, damngo, led, planner…);
// user = undefined (chưa biết) · null (chưa đăng nhập) · { name, email }.
(function () {
  if (window.cnBottom) return;
  var css = '.cnb,.cn-cart{display:none}@media (max-width:760px){'
    + 'body.has-cnb .tb-split,body.has-cnb .uav:has(.usplit){display:none!important}' // đã có nút avatar + tab Thiệp ở thanh dưới → bỏ nút "Thiệp của tôi" trên đầu cho đỡ thừa
    + '.cn-cart{position:relative;display:grid;place-items:center;flex:none;width:40px;height:40px;margin-left:auto;border-radius:50%;color:var(--primary,#d6455d);text-decoration:none}'
    + '.cn-cart svg{width:25px;height:25px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}'
    + '.cn-cart b{position:absolute;top:1px;right:0;min-width:18px;height:18px;padding:0 5px;box-sizing:border-box;border-radius:999px;border:2px solid #fff;background:#d6455d;color:#fff;font-size:10.5px;font-weight:800;line-height:14px;text-align:center}'
    + '[data-theme="dark"] .cn-cart b{border-color:#1f191b}'
    + '.pbar{display:none!important}.hnav:not(.up){top:0!important;transform:translateX(-50%)!important}' // dải giá chạy chữ chỉ hiện trên máy tính
    + 'body.has-cnb{padding-bottom:calc(92px + env(safe-area-inset-bottom))}.totop{bottom:calc(88px + env(safe-area-inset-bottom))!important}'
    + '.cnb{position:fixed;z-index:48;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));height:62px;padding:0 6px;display:flex;align-items:center;justify-content:space-around;border-radius:999px;background:rgba(255,255,255,.94);backdrop-filter:blur(12px) saturate(1.4);-webkit-backdrop-filter:blur(12px) saturate(1.4);box-shadow:0 0 0 1px var(--line,#f0e4e6),0 12px 30px rgba(120,40,50,.16)}'
    + '[data-theme="dark"] .cnb{background:rgba(31,25,27,.94)}'
    + '.cnb>a,.cnb>button{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:2px;padding:0;border:0;background:none;font-family:inherit;font-size:10.5px;font-weight:600;line-height:1.2;white-space:nowrap;color:var(--muted,#8a7d80);text-decoration:none;cursor:pointer}'
    + '.cnb i{position:relative;display:grid;place-items:center;width:44px;height:26px;border-radius:999px;font-style:normal}'
    + '.cnb svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}'
    + '.cnb .on{color:#d6455d}.cnb .on i{background:rgba(214,69,93,.12)}'
    + '.cnb i.av{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#f6d7dc,#e9b7c0);color:#8b1a24;font-size:11.5px;font-weight:800}'
    + '.cnb .on i.av{box-shadow:0 0 0 2px #d6455d}'
    + '}'
    + '.cnb-ov{position:fixed;inset:0;z-index:2147483400;background:rgba(30,15,18,.42);display:flex;align-items:flex-end;animation:cnbIn .18s ease}@keyframes cnbIn{from{opacity:0}}'
    + '.cnb-sh{width:100%;max-height:85vh;overflow:auto;box-sizing:border-box;padding:10px 12px calc(16px + env(safe-area-inset-bottom));border-radius:22px 22px 0 0;background:var(--surface,var(--card,#fff));color:var(--ink,#2b2224)}'
    + '.cnb-sh .gr{width:40px;height:4px;border-radius:9px;background:var(--line,#eadfe1);margin:0 auto 10px}'
    + '.cnb-sh .who{display:flex;align-items:center;gap:12px;padding:6px 8px 12px;border-bottom:1px solid var(--line,#f0e4e6);margin-bottom:6px}'
    + '.cnb-sh .who i{flex:none;display:grid;place-items:center;width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#f6d7dc,#e9b7c0);color:#8b1a24;font-style:normal;font-weight:800}'
    + '.cnb-sh .who b{display:block;font-size:15px}.cnb-sh .who span{display:block;font-size:12.5px;color:var(--muted,#8a7d80);overflow:hidden;text-overflow:ellipsis}'
    + '.cnb-sh a{display:flex;align-items:center;gap:12px;padding:12px 8px;border-radius:12px;color:inherit;font-size:15px;font-weight:500;text-decoration:none}'
    + '.cnb-sh a:active,.cnb-sh a:hover{background:rgba(214,69,93,.08)}'
    + '.cnb-sh a svg{flex:none;width:20px;height:20px;fill:none;stroke:var(--muted,#8a7d80);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}'
    + '.cnb-sh a em{margin-left:auto;padding:1px 8px;border-radius:999px;background:#d6455d;color:#fff;font-size:10.5px;font-style:normal;font-weight:700}'
    + '.cnb-sh .sep{height:1px;background:var(--line,#f0e4e6);margin:6px 8px}'
    + '.cnb-sh .lg{display:flex;justify-content:center;padding:6px 0 10px}.cnb-sh .lg a{justify-content:center;padding:0 26px;height:46px;border-radius:999px;background:linear-gradient(120deg,#d6455d,#ec6f86);color:#fff;font-weight:700}';
  var I = {
    home: '<path d="M4 11 12 4l8 7v8.5a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19.5z"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5 12 13l8.5-6.5"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="m16 10.5 5-3v9l-5-3"/>',
    led: '<rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M8 20.5h8M12 16.5v4"/><path d="m12 7 .9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z"/>',
    user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c.9-3.6 3.9-5.5 7.5-5.5s6.6 1.9 7.5 5.5"/>',
    slide: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/><path d="m10 8 4 2-4 2z"/>',
    book: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/><path d="M9 8h6M9 11.5h4"/>',
    clap: '<path d="M4 10h16v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z"/><path d="m4 10-.6-3.2 15-3 .6 3.2"/><path d="m8.5 6.2 2 3.3M13.5 5.2l2 3.3"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    out: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
    in: '<path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"/><path d="M14 16l4-4-4-4M18 12H8"/>',
  };
  var svg = function (k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + I[k] + '</svg>'; };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var initial = function (u) { var n = String((u && (u.name || u.email)) || '?').trim(); return esc(n.split(/\s+/).pop().charAt(0).toUpperCase() || '?'); };
  var GROUP = { home: 'home', tpl: 'tpl', cards: 'tpl', goiy: 'tpl', slide: 'video', baohy: 'video', videos: 'video', damngo: 'video', led: 'led', planner: 'me' };
  var nav = null, state = { active: '', user: undefined };

  function sheet() {
    var u = state.user;
    var ov = document.createElement('div'); ov.className = 'cnb-ov';
    var link = function (href, ic, text, tag) { return '<a href="' + href + '">' + svg(ic) + '<span>' + text + '</span>' + (tag ? '<em>' + tag + '</em>' : '') + '</a>'; };
    ov.innerHTML = '<div class="cnb-sh" role="dialog" aria-modal="true" aria-label="Tài khoản"><div class="gr"></div>'
      + (u ? '<div class="who"><i>' + initial(u) + '</i><div style="min-width:0"><b>' + esc(u.name || 'Tài khoản') + '</b><span>' + esc(u.email) + '</span></div></div>'
        + link('/thiep-cua-toi', 'card', 'Thiệp &amp; màn LED của tôi') + link('/video-cua-toi', 'slide', 'Slide của tôi') + link('/so-tay', 'book', 'Sổ tay của tôi')
        : '<div class="lg"><a href="/dang-nhap?next=' + encodeURIComponent(location.pathname + location.search) + '">Đăng nhập</a></div>' + link('/so-tay-cuoi', 'book', 'Sổ tay cưới', 'Free'))
      + link('/video', 'clap', 'Video báo hỷ TikTok', 'Free')
      + '<div class="sep"></div><a href="#" data-cnb-theme>' + svg('moon') + '<span>Đổi nền sáng / tối</span></a>'
      + (u ? '<a href="#" data-cnb-out>' + svg('out') + '<span>Đăng xuất</span></a>' : '')
      + '</div>';
    var close = function () { ov.remove(); document.removeEventListener('keydown', key); };
    var key = function (e) { if (e.key === 'Escape') close(); };
    ov.onclick = function (e) {
      if (e.target === ov) return close();
      var t = e.target.closest('[data-cnb-theme],[data-cnb-out]'); if (!t) return;
      e.preventDefault(); close();
      if (t.hasAttribute('data-cnb-theme')) { if (window.toggleTheme) window.toggleTheme(); return; }
      fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).then(function () { location.href = '/'; });
    };
    document.addEventListener('keydown', key);
    document.body.appendChild(ov);
  }

  function draw(active, user) {
    if (active !== undefined) state.active = active;
    if (user !== undefined) state.user = user;
    if (!document.getElementById('cnbCss')) { var st = document.createElement('style'); st.id = 'cnbCss'; st.textContent = css; document.head.appendChild(st); }
    if (!nav) { nav = document.createElement('nav'); nav.className = 'cnb'; nav.setAttribute('aria-label', 'Chức năng'); document.body.appendChild(nav); document.body.classList.add('has-cnb'); }
    var g = GROUP[state.active] || '', u = state.user;
    var item = function (key, href, ic, text) { return '<a href="' + href + '"' + (g === key ? ' class="on" aria-current="page"' : '') + '><i>' + svg(ic) + '</i>' + text + '</a>'; };
    nav.innerHTML = item('home', '/', 'home', 'Trang chủ') + item('tpl', '/mau-thiep', 'card', 'Thiệp') + item('video', '/slide-cuoi', 'video', 'Video') + item('led', '/man-hinh-led-dam-cuoi', 'led', 'Màn LED')
      + '<button type="button"' + (g === 'me' ? ' class="on"' : '') + ' aria-label="Tài khoản"' + (u === undefined ? ' style="visibility:hidden"' : '') + '>'
      + (u ? '<i class="av">' + initial(u) + '</i>Tôi' : '<i>' + svg('user') + '</i>Tài khoản') + '</button>';
    nav.querySelector('button').onclick = sheet;
  }
  // Giỏ hàng (điện thoại, đã đăng nhập) bên phải logo, kiểu Shopee: số trên giỏ = món của thiệp chính chưa thanh toán
  // (thiệp chưa kích hoạt, màn LED, slide chưa trả tiền — đúng các món màn thanh toán tick sẵn); bấm là mở màn thanh toán của thiệp đó.
  var cartAsked = false;
  function cart() {
    if (!state.user || cartAsked) return;
    var wrap = document.querySelector('.topbar .wrap, #hnav>.wrap, #nav>.wrap');
    if (!wrap) return;
    cartAsked = true;
    var a = document.createElement('a');
    a.className = 'cn-cart'; a.href = '/thiep-cua-toi'; a.setAttribute('aria-label', 'Giỏ hàng');
    a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2.2l2.3 11.2a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.2L21 8H6.1"/><circle cx="9.5" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/></svg>';
    var burger = wrap.querySelector('.burger');
    wrap.insertBefore(a, burger || null);
    fetch('/api/cards', { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      var cards = (j && j.cards) || [];
      if (!cards.length) { a.href = '/mau-thiep'; return; }
      var rank = function (c) { return c.paid ? 2 : c.status === 'published' ? 1 : 0; };
      var main = cards.slice().sort(function (x, y) { return rank(y) - rank(x); })[0];
      var due = function (p) { return p && !(p.paid || p.prepaid) ? 1 : 0; }; // khớp các món màn thanh toán tick sẵn (pay.js)
      var n = (main.paid ? 0 : 1) + due(main.led) + due(main.video);
      a.href = '/thiep-cua-toi?thiep=' + encodeURIComponent(main.id) + (n ? '&mua=1' : '');
      if (n) { a.insertAdjacentHTML('beforeend', '<b>' + n + '</b>'); a.setAttribute('aria-label', 'Giỏ hàng: ' + n + ' món chưa thanh toán'); }
    }).catch(function () {});
  }
  var draw0 = draw;
  draw = function (a, u) { draw0(a, u); cart(); };
  window.cnBottom = { draw: draw };
})();
