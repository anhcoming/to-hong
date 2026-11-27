// Thanh 5 nút dưới cùng trên điện thoại — dùng chung cho trang giới thiệu (site.js) và trang tài khoản (common.js):
// Trang chủ · Thiệp · Video (slide, màn hình dạm ngõ, báo hỷ) · Màn LED · ảnh đại diện (bảng tài khoản: đồ của tôi, sổ tay, đăng xuất).
// window.cnBottom.draw(active, user): active = khoá trang (home, tpl, cards, slide, baohy, videos, damngo, led, planner…);
// user = undefined (chưa biết) · null (chưa đăng nhập) · { name, email }.
(function () {
  if (window.cnBottom) return;
  var css = '.cnb,.cn-cart{display:none}@media (max-width:760px){'
    + 'body.has-cnb .tb-split,body.has-cnb .uav:has(.usplit){display:none!important}' // đã có nút avatar + tab Thiệp ở thanh dưới → bỏ nút "Thiệp của tôi" trên đầu cho đỡ thừa
    + '.cn-cart{flex:none;display:inline-flex;align-items:center;height:36px;margin-left:auto;padding:0 14px;border-radius:999px;background:linear-gradient(120deg,#d6455d,#ec6f86);color:#fff;font-size:13px;font-weight:700;text-decoration:none;white-space:nowrap;box-shadow:0 6px 16px rgba(214,69,93,.25)}'
    // kiểu Shopee: thanh trên + thanh dưới dính sát mép, rộng hết màn, không bo tròn / không thu thành viên nổi
    + 'body.has-cnb .topbar{padding:0;border-bottom:1px solid var(--line,#f0e4e6);background:var(--surface,#fff)}'
    + 'body.has-cnb .topbar .wrap{height:54px;border:0;border-radius:0;background:none;box-shadow:none;-webkit-backdrop-filter:none;backdrop-filter:none}'
    + 'body.has-cnb .nav{top:0;left:0;width:100%;transform:none;border:0;border-radius:0;background:var(--surface,#fff);box-shadow:0 1px 0 var(--line,#f0e4e6);-webkit-backdrop-filter:none;backdrop-filter:none}'
    + 'body.has-cnb .nav .wrap{height:54px;padding:0 12px 0 16px}'
    + 'body.has-cnb .hnav.up{background:var(--surface,#fff)!important;box-shadow:0 1px 0 var(--line,#f0e4e6)!important}body.has-cnb .hnav.up::before{display:none}'
    + 'body.has-cnb .hnav.up{transform:translate(-50%,0)!important;filter:none!important}'
    + 'body.has-cnb{padding-bottom:calc(60px + env(safe-area-inset-bottom))}.totop{bottom:calc(72px + env(safe-area-inset-bottom))!important}'
    + '.cnb{position:fixed;z-index:48;left:0;right:0;bottom:0;height:calc(58px + env(safe-area-inset-bottom));padding:0 4px env(safe-area-inset-bottom);box-sizing:border-box;display:flex;align-items:center;justify-content:space-around;background:var(--surface,#fff);box-shadow:0 -1px 0 var(--line,#f0e4e6)}'
    + '[data-theme="dark"] .cnb{background:#1f191b}'
    + 'body.has-cnb #appVer{bottom:calc(62px + env(safe-area-inset-bottom))!important}' // nhãn phiên bản nằm trên thanh dưới, không đè chữ "Tôi"
    + '.cnb>a,.cnb>button{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:2px;padding:0;border:0;background:none;font-family:inherit;font-size:10.5px;font-weight:600;line-height:1.2;white-space:nowrap;color:var(--muted,#8a7d80);text-decoration:none;cursor:pointer}'
    + '.cnb i{position:relative;display:grid;place-items:center;width:44px;height:26px;border-radius:999px;font-style:normal}'
    + '.cnb svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}'
    + '.cnb .on{color:#d6455d;font-weight:800}'
    + '.cnb .on svg>*{fill:currentColor}.cnb .on svg>.d{fill:none;stroke:#fff}.cnb .on svg>.d.s{fill:#fff;stroke:none}'
    + '[data-theme="dark"] .cnb .on svg>.d{stroke:#1f191b}[data-theme="dark"] .cnb .on svg>.d.s{fill:#1f191b}'
    + '.cnb .pop i{animation:cnbPop .38s cubic-bezier(.3,1.6,.5,1)}@keyframes cnbPop{0%{transform:scale(.8)}55%{transform:scale(1.16)}100%{transform:scale(1)}}'
    + '@media (prefers-reduced-motion:reduce){.cnb .pop i{animation:none}}'
    + '.cnb i.av{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#f6d7dc,#e9b7c0);color:#8b1a24;font-size:11.5px;font-weight:800}'
    + '.cnb .on i.av{box-shadow:0 0 0 2px #d6455d}'
    + '.cnb i.ph,.cnb-sh .who i.ph{overflow:hidden;background:#f3e6e8;padding:0}.cnb i.ph img,.cnb-sh .who i.ph img{width:100%;height:100%;object-fit:cover;display:block}'
    + '.cnb .on i.ph{box-shadow:0 0 0 2px var(--surface,#fff),0 0 0 3.5px #d6455d}'
    + '}'
    + '.cnb-ov{position:fixed;inset:0;z-index:2147483400;background:rgba(30,15,18,.42);display:flex;align-items:flex-end;animation:cnbIn .18s ease}@keyframes cnbIn{from{opacity:0}}'
    + '.cnb-sh{width:100%;max-height:85vh;overflow:auto;box-sizing:border-box;padding:10px 12px calc(16px + env(safe-area-inset-bottom));border-radius:22px 22px 0 0;background:var(--surface,var(--card,#fff));color:var(--ink,#2b2224)}'
    + '.cnb-sh .gr{width:40px;height:4px;border-radius:9px;background:var(--line,#eadfe1);margin:0 auto 10px}'
    + '.cnb-sh .who{display:flex;align-items:center;gap:12px;padding:6px 8px 12px;border-bottom:1px solid var(--line,#f0e4e6);margin-bottom:6px}'
    + '.cnb-sh .who i{flex:none;display:grid;place-items:center;width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#f6d7dc,#e9b7c0);color:#8b1a24;font-style:normal;font-weight:800}'
    + '.cnb-sh .who b{display:block;font-size:15px}.cnb-sh .who span{display:block;font-size:12.5px;color:var(--muted,#8a7d80);overflow:hidden;text-overflow:ellipsis}'
    + '.cnb-sh a{display:flex;align-items:center;gap:12px;padding:12px 8px;border-radius:12px;color:inherit;font-size:15px;font-weight:500;text-decoration:none}'
    + '.cnb-sh a:active{background:rgba(214,69,93,.08)}@media (hover:hover){.cnb-sh a:hover{background:rgba(214,69,93,.08)}}'
    + '.cnb-sh a.out{color:var(--muted,#8a7d80);font-size:14px}'
    + '.cnb-sh .sw{position:relative;flex:none;margin-left:auto;width:42px;height:24px;border-radius:999px;background:var(--line,#e6d9dc);transition:background .2s}'
    + '.cnb-sh .sw::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:transform .2s}'
    + '.cnb-sh .sw.on{background:#d6455d}.cnb-sh .sw.on::after{transform:translateX(18px)}'
    + '.cnb-sh a svg{flex:none;width:20px;height:20px;fill:none;stroke:var(--muted,#8a7d80);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}'
    + '.cnb-sh a em{margin-left:auto;padding:1px 8px;border-radius:999px;background:#d6455d;color:#fff;font-size:10.5px;font-style:normal;font-weight:700}'
    + '.cnb-sh .sep{height:1px;background:var(--line,#f0e4e6);margin:6px 8px}'
    + '.cnb-sh .lg{display:flex;justify-content:center;padding:6px 0 10px}.cnb-sh .lg a{justify-content:center;padding:0 26px;height:46px;border-radius:999px;background:linear-gradient(120deg,#d6455d,#ec6f86);color:#fff;font-weight:700}';
  var I = {
    home: '<path d="M4 11 12 4l8 7v8.5a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19.5z"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path class="d" d="M3.5 6.5 12 13l8.5-6.5"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="m16 10.5 5-3v9l-5-3"/>',
    led: '<rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M8 20.5h8M12 16.5v4"/><path class="d s" d="m12 7 .9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z"/>',
    user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c.9-3.6 3.9-5.5 7.5-5.5s6.6 1.9 7.5 5.5"/>',
    slide: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/><path d="m10 8 4 2-4 2z"/>',
    book: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/><path d="M9 8h6M9 11.5h4"/>',
    clap: '<path d="M4 10h16v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z"/><path d="m4 10-.6-3.2 15-3 .6 3.2"/><path d="m8.5 6.2 2 3.3M13.5 5.2l2 3.3"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    bag: '<path d="M5 7h14l-1.2 11.2A2 2 0 0 1 15.8 20H8.2a2 2 0 0 1-2-1.8z"/><path d="M9 7V6a3 3 0 0 1 6 0v1"/>',
    out: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
    in: '<path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"/><path d="M14 16l4-4-4-4M18 12H8"/>',
  };
  var svg = function (k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + I[k] + '</svg>'; };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  // ảnh tài khoản (Google / Facebook): không gửi referrer (ảnh Google hay chặn), lỗi tải thì thay bằng icon người
  var photo = function (u) { return '<img src="' + esc(u.avatar) + '" alt="" referrerpolicy="no-referrer" onerror="var i=this.parentNode;i.className=\'\';i.innerHTML=window.cnBottom.userIcon">'; };
  var initial = function (u) { var n = String((u && (u.name || u.email)) || '?').trim(); return esc(n.split(/\s+/).pop().charAt(0).toUpperCase() || '?'); };
  var GROUP = { home: 'home', tpl: 'tpl', cards: 'tpl', goiy: 'tpl', slide: 'video', baohy: 'video', videos: 'video', damngo: 'video', led: 'led', planner: 'me', orders: 'me' };
  var nav = null, state = { active: '', user: undefined };

  function sheet() {
    var u = state.user, dark = document.documentElement.getAttribute('data-theme') === 'dark';
    var ov = document.createElement('div'); ov.className = 'cnb-ov';
    var link = function (href, ic, text, tag) { return '<a href="' + href + '">' + svg(ic) + '<span>' + text + '</span>' + (tag ? '<em>' + tag + '</em>' : '') + '</a>'; };
    ov.innerHTML = '<div class="cnb-sh" role="dialog" aria-modal="true" aria-label="Tài khoản"><div class="gr"></div>'
      + (u ? '<div class="who"><i' + (u.avatar ? ' class="ph">' + photo(u) : '>' + initial(u)) + '</i><div style="min-width:0"><b>' + esc(u.name || 'Tài khoản') + '</b><span>' + esc(u.email) + '</span></div></div>'
        + link('/thiep-cua-toi', 'card', 'Thiệp &amp; màn LED của tôi') + link('/don-hang', 'bag', 'Đơn hàng của tôi') + link('/video-cua-toi', 'slide', 'Slide của tôi') + link('/so-tay', 'book', 'Sổ tay của tôi')
        : '<div class="lg"><a href="/dang-nhap?next=' + encodeURIComponent(location.pathname + location.search) + '">Đăng nhập</a></div>' + link('/so-tay-cuoi', 'book', 'Sổ tay cưới', 'Free'))
      + link('/video', 'clap', 'Video báo hỷ TikTok', 'Free')
      + '<div class="sep"></div><a href="#" data-cnb-theme role="switch" aria-checked="' + dark + '">' + svg('moon') + '<span>Nền tối</span><s class="sw' + (dark ? ' on' : '') + '"></s></a>'
      + (u ? '<a href="#" data-cnb-out class="out">' + svg('out') + '<span>Đăng xuất</span></a>' : '')
      + '</div>';
    var close = function () { ov.remove(); document.removeEventListener('keydown', key); };
    var key = function (e) { if (e.key === 'Escape') close(); };
    ov.onclick = function (e) {
      if (e.target === ov) return close();
      var t = e.target.closest('[data-cnb-theme],[data-cnb-out]'); if (!t) return;
      e.preventDefault();
      if (t.hasAttribute('data-cnb-theme')) { if (window.toggleTheme) window.toggleTheme(); var d = document.documentElement.getAttribute('data-theme') === 'dark'; t.setAttribute('aria-checked', d); t.querySelector('.sw').classList.toggle('on', d); return; }
      close();
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
      + (u ? (u.avatar ? '<i class="av ph">' + photo(u) + '</i>' : '<i>' + svg('user') + '</i>') + 'Tôi' : '<i>' + svg('user') + '</i>Tài khoản') + '</button>';
    nav.querySelector('button').onclick = function (e) { pop(e.currentTarget); sheet(); };
    if (!popped && g) { popped = true; var on = nav.querySelector('.on'); if (on) pop(on); }
    nav.querySelectorAll('a').forEach(function (a) {
      a.onclick = function (e) {
        pop(a);
        if (a.classList.contains('on') && a.pathname === location.pathname && window.scrollY > 8) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      };
    });
  }
  var popped = false;
  function pop(el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  // Nút "＋ Tạo thiệp" (điện thoại) bên phải logo — thay giỏ hàng từ v1.27 (trả tiền nằm ngay ở thẻ thiệp / trình sửa: "Gửi khách · 99k")
  var newAsked = false;
  function cart() {
    if (!state.user || newAsked) return; // chưa đăng nhập: góc phải đã có nút "Đăng nhập"
    var wrap = document.querySelector('.topbar .wrap, #hnav>.wrap, #nav>.wrap');
    if (!wrap) return;
    newAsked = true;
    var a = document.createElement('a');
    a.className = 'cn-cart'; a.href = '/mau-thiep'; a.textContent = '＋ Tạo thiệp';
    wrap.insertBefore(a, wrap.querySelector('.burger') || null);
  }
  var draw0 = draw;
  draw = function (a, u) { draw0(a, u); cart(); };
  window.cnBottom = { draw: draw, userIcon: svg('user') };
})();
