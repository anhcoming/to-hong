// Trang quản trị. Bố cục: thanh bên trái + mỗi trang chỉ có danh sách.
// Tạo / sửa / xác nhận mở popup (modal, ask); bấm một dòng mở bảng chi tiết bên phải (drawer); thao tác phụ ở nút ⋯ (menu).
const A = { page: 'home', f: {}, meta: null, me: null };
const PROD = { card: 'Thiệp', combo: 'Trọn bộ', led: 'Màn LED', video: 'Video' };
const TITLES = { home: 'Tổng quan', orders: 'Đơn hàng', discounts: 'Mã giảm giá', users: 'Người dùng', cards: 'Thiệp & sản phẩm', traffic: 'Truy cập', settings: 'Cài đặt', audit: 'Nhật ký' };
const num = (n) => Number(n || 0).toLocaleString('vi-VN');
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 + '%' : '—');
const ago = (t) => {
  if (!t) return '—';
  const m = Math.round((Date.now() - t) / 6e4);
  if (m < 1) return 'vừa xong';
  if (m < 60) return m + ' phút trước';
  if (m < 1440) return Math.round(m / 60) + ' giờ trước';
  if (m < 2880) return 'hôm qua';
  return Math.round(m / 1440) + ' ngày trước';
};
const ddmm = (iso) => (iso ? iso.split('-').reverse().join('/') : '');
const SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>';
const pill = (cls, text) => `<span class="pill ${cls}">${esc(text)}</span>`;

// ================= khung chung: popup, bảng chi tiết, menu ⋯ =================
const stack = []; // các lớp đang mở (popup / bảng chi tiết), Esc đóng lớp trên cùng
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (closeMenu()) return; const top = stack[stack.length - 1]; if (top) top(); } });

// popup giữa màn hình: { title, body, foot, size: 'sm' | 'lg', onMount(box, close) } → close()
function modal({ title, body, foot = '', size = '', onMount }) {
  const ov = document.createElement('div');
  ov.className = 'ov';
  ov.innerHTML = `<div class="md ${size}" role="dialog" aria-modal="true"><header><h2>${title}</h2><button class="x" aria-label="Đóng">×</button></header><div class="bd">${body}</div>${foot ? `<footer>${foot}</footer>` : ''}</div>`;
  const close = () => { if (!ov.isConnected) return; ov.remove(); stack.splice(stack.indexOf(close), 1); };
  ov.addEventListener('mousedown', (e) => { if (e.target === ov) close(); });
  $('.x', ov).onclick = close;
  $$('[data-close]', ov).forEach((b) => (b.onclick = close));
  document.body.appendChild(ov);
  stack.push(close);
  if (onMount) onMount($('.md', ov), close);
  const f = $('.bd input:not([readonly]),.bd textarea', ov); if (f && matchMedia('(pointer:fine)').matches) f.focus();
  return close;
}
// hỏi lại trước khi làm: { title, text, ok, danger, reason: 'nhãn ô lý do', run(reason) }
// word: bắt gõ đúng chữ này mới bấm được nút (thao tác không hoàn tác như xoá tất cả)
function ask({ title, text, ok, danger, reason, word, run }) {
  modal({
    title, size: 'sm',
    body: `<p>${text}</p>${reason ? `<label class="fl">${esc(reason)}<input id="askR" placeholder="Ghi vào nhật ký"></label>` : ''}${word ? `<label class="fl"><span>Gõ <b>${esc(word)}</b> để xác nhận</span><input id="askW" autocomplete="off" placeholder="${esc(word)}"></label>` : ''}`,
    foot: `<button class="btn plain" data-close>Thôi</button><button class="btn" id="askOk" ${danger ? 'style="background:var(--danger)"' : ''} ${word ? 'disabled' : ''}>${esc(ok)}</button>`,
    onMount: (box, close) => {
      if (word) $('#askW', box).oninput = (e) => { $('#askOk', box).disabled = e.target.value.trim().toUpperCase() !== word; };
      $('#askOk', box).onclick = async () => {
        if ($('#askOk', box).disabled) return;
        try { await run(reason ? $('#askR', box).value : undefined); close(); } catch (err) { toast(err.message, true); }
      };
    },
  });
}
// bảng chi tiết trượt từ phải: drawer(html, onMount) → close(); mở cái mới thì đóng cái cũ
let closeDrawer = () => {};
function drawer(html, onMount) {
  closeDrawer();
  const d = document.createElement('div');
  d.className = 'dr';
  d.innerHTML = `<div class="bg"></div><aside role="dialog" aria-modal="true">${html}</aside>`;
  const close = () => { if (!d.isConnected) return; d.remove(); stack.splice(stack.indexOf(close), 1); closeDrawer = () => {}; };
  $('.bg', d).onclick = close;
  d.addEventListener('click', (e) => { if (e.target.closest('.dh .x')) close(); });
  document.body.appendChild(d);
  stack.push(close);
  closeDrawer = close;
  if (onMount) onMount($('aside', d), close);
  return close;
}
const dhead = (title, sub) => `<div class="dh"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div><button class="x" aria-label="Đóng">×</button></div>`;
// menu ⋯: items = [[nhãn, hàm, 'd' = màu đỏ] | '-']
let menuEl = null;
function closeMenu() { if (!menuEl) return false; menuEl.remove(); menuEl = null; return true; }
function menu(btn, items) {
  closeMenu();
  menuEl = document.createElement('div');
  menuEl.className = 'menu';
  items.filter(Boolean).forEach((it) => {
    if (it === '-') return menuEl.insertAdjacentHTML('beforeend', '<hr>');
    const b = document.createElement('button');
    b.textContent = it[0]; if (it[2]) b.className = 'd';
    b.onclick = () => { closeMenu(); it[1](); };
    menuEl.appendChild(b);
  });
  document.body.appendChild(menuEl);
  const r = btn.getBoundingClientRect();
  menuEl.style.top = Math.max(8, Math.min(innerHeight - menuEl.offsetHeight - 8, r.bottom + 4)) + 'px';
  menuEl.style.left = Math.max(8, r.right - menuEl.offsetWidth) + 'px';
}
document.addEventListener('click', (e) => { if (menuEl && !e.target.closest('.menu') && !e.target.closest('.dots')) closeMenu(); });
addEventListener('scroll', closeMenu, { passive: true });

// thanh lọc: ô tìm + nhóm nút + (tuỳ chọn) ô chọn. Đổi gì thì gọi load() vẽ lại riêng danh sách (ô tìm giữ nguyên chữ đang gõ)
function filterBar(key, { ph, segs, select }) {
  const f = A.f[key];
  return `<div class="bar">
    <label class="search">${SEARCH}<input id="fq" placeholder="${esc(ph)}" value="${esc(f.q || '')}"></label>
    <div class="seg" id="fseg">${segs.map(([v, l]) => `<button data-v="${v}" class="${(f.seg || '') === v ? 'on' : ''}">${l}</button>`).join('')}</div>
    ${select ? `<select class="sel" id="fsel">${select.map(([v, l]) => `<option value="${v}" ${(f.sel || '') === v ? 'selected' : ''}>${l}</option>`).join('')}</select>` : ''}
    <span class="cnt" id="fcnt"></span></div>`;
}
function bindBar(key, load) {
  const f = A.f[key];
  let t;
  $('#fq').oninput = (e) => { f.q = e.target.value; clearTimeout(t); t = setTimeout(load, 250); };
  $('#fseg').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; f.seg = b.dataset.v; $$('#fseg button').forEach((x) => x.classList.toggle('on', x === b)); load(); };
  if ($('#fsel')) $('#fsel').onchange = (e) => { f.sel = e.target.value; load(); };
}
// bấm dòng / nút trong bảng: rows = { k: item }, onRow(item), onBtn(name, item, btn)
function bindRows(el, rows, onRow, onBtn) {
  el.onclick = (e) => {
    const tr = e.target.closest('[data-k]');
    if (!tr) return;
    const item = rows[tr.dataset.k];
    const b = e.target.closest('[data-a]');
    if (b) { e.stopPropagation(); return onBtn(b.dataset.a, item, b); }
    if (e.target.closest('a,.ck')) return; // link, ô tích chọn: không mở bảng chi tiết
    onRow(item);
  };
}
const page = (title, sub, right = '') => `<div class="ph"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${right ? `<div class="r">${right}</div>` : ''}</div>`;
const err = (e) => toast(e.message, true);

// ================= tổng quan =================
function barsSvg(series, key, fmt) {
  const W = 600, H = 130, n = series.length, max = Math.max(1, ...series.map((s) => s[key]));
  const bw = W / n, step = Math.ceil(n / 6);
  return `<svg viewBox="0 0 ${W} ${H + 16}" preserveAspectRatio="none" role="img">
    ${series.map((s, i) => { const h = (s[key] / max) * (H - 4); return `<rect x="${i * bw + 1}" y="${H - h}" width="${Math.max(1, bw - 2)}" height="${Math.max(h, s[key] ? 2 : 0)}" rx="2"><title>${s.day}: ${fmt(s[key])}</title></rect>`; }).join('')}
    ${series.map((s, i) => (i % step === 0 || i === n - 1 ? `<text x="${Math.min(W - 14, Math.max(14, i * bw + bw / 2))}" y="${H + 13}" text-anchor="middle">${s.day}</text>` : '')).join('')}
  </svg>`;
}
async function home() {
  const [d, po, ds, tr] = await Promise.all([
    api('/api/admin/stats?days=30'), api('/api/admin/orders?status=review'), api('/api/admin/discounts'),
    api('/api/admin/traffic?days=7').catch(() => null),
  ]);
  const t = d.totals, sum = (k) => d.series.reduce((n, s) => n + s[k], 0);
  badge(t.review);
  const h = new Date().getHours();
  // việc cần làm: đơn có tiền về lệch / khách báo đã chuyển trước, rồi mã sắp hết hạn hoặc sắp hết lượt
  const orders = po.orders.slice().sort((a, b) => (!!b.bankNote - !!a.bankNote) || (!!b.claimedAt - !!a.claimedAt));
  const soon = Date.now() + 7 * 864e5;
  const disc = ds.discounts.filter((x) => x.active && !x.expired && ((x.expiresAt && Date.parse(x.expiresAt + 'T23:59:59+07:00') < soon) || (x.limit && x.uses >= x.limit - 2)));
  const todo = [
    ...orders.slice(0, 6).map((o) => `<li data-k="o:${o.id}"><span class="ic ${o.bankNote || o.claimedAt ? '' : 'g'}">${o.bankNote ? '!' : o.claimedAt ? '⏳' : '·'}</span><div><b><span class="code">${esc(o.code)}</span> · ${esc(o.bankNote || (o.claimedAt ? 'khách báo đã chuyển, kiểm tra ngân hàng' : 'chờ thanh toán'))}</b><small>${esc(o.email)} · ${PROD[o.product] || ''} · ${ago(o.claimedAt || o.createdAt)}</small></div><span class="v">${money(o.amount)}</span></li>`),
    ...disc.map((x) => `<li data-k="d:${esc(x.code)}"><span class="ic p">%</span><div><b>Mã ${esc(x.code)} ${x.limit && x.uses >= x.limit - 2 ? 'sắp hết lượt' : 'sắp hết hạn'}</b><small>${x.expiresAt ? 'Hết hạn ' + ddmm(x.expiresAt) + ' · ' : ''}đã dùng ${x.uses}${x.limit ? '/' + x.limit : ''} lượt</small></div></li>`),
  ];
  $('#view').innerHTML = `${page(h < 11 ? 'Chào buổi sáng 👋' : h < 18 ? 'Chào buổi chiều 👋' : 'Chào buổi tối 👋',
    `${new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })} · ${po.total ? po.total + ' đơn cần bạn xem' : 'không có đơn nào cần bạn xem'}`)}
    <div class="kp">
      <div class="box"><span>Doanh thu 30 ngày</span><b>${money(sum('revenue'))}</b><small>7 ngày: ${money(t.revenueWeek)}</small></div>
      <div class="box"><span>Đơn đã thanh toán</span><b>${num(sum('orders'))}</b><small>30 ngày · ${num(t.paidOrders)} từ trước tới nay</small></div>
      <div class="box"><span>Khách ghé hôm nay</span><b>${tr ? num(tr.today.visitors) : '—'}</b><small>${tr ? `Hôm qua ${num((tr.yesterday || {}).visitors)} · chỉ khách ngoài` : 'Chưa có thống kê'}</small></div>
      <div class="box"><span>Người dùng</span><b>${num(t.users)}</b><small>+${num(t.usersWeek)} tuần này · ${num(t.activeWeek)} hoạt động</small></div>
    </div>
    <div class="g2">
      <div class="box"><div class="bh"><h3>Doanh thu 30 ngày</h3><button class="lk" data-go="orders">Xem đơn →</button></div><div class="chart">${barsSvg(d.series, 'revenue', money)}</div></div>
      <div class="box"><div class="bh"><h3>Cần bạn xem</h3>${po.total > 6 ? `<button class="lk" id="goReview">Tất cả ${po.total} →</button>` : ''}</div>
        <ul class="todo" id="todo">${todo.join('') || '<li class="empty">Không có việc gì cần xử lý 🎉</li>'}</ul></div>
    </div>
    <div class="g2">
      <div class="box"><div class="bh"><h3>Doanh thu theo sản phẩm</h3><small class="muted">từ trước tới nay</small></div>
        <ul class="todo">${Object.entries(d.byProduct).map(([k, p]) => `<li><span class="ic g">${(PROD[k] || '?')[0]}</span><div><b>${esc(p.name)}</b><small>${num(p.count)} đơn</small></div><span class="v">${money(p.revenue)}</span></li>`).join('')}</ul></div>
      <div class="box"><div class="bh"><h3>Thiệp & sổ tay</h3></div>
        <ul class="todo">
          <li data-go="cards"><span class="ic g">♥</span><div><b>Thiệp</b><small>${num(t.published)} đã phát hành · ${t.conversion}% đã trả phí</small></div><span class="v">${num(t.cards)}</span></li>
          <li><span class="ic g">✎</span><div><b>Sổ tay cưới</b><small>${num(t.guests)} khách mời đã nhập · ${num(t.rsvps)} lượt xác nhận dự</small></div><span class="v">${num(t.weddings)}</span></li>
        </ul></div>
    </div>`;
  if ($('#goReview')) $('#goReview').onclick = () => { A.f.orders = { q: '', seg: 'review', sel: '' }; go('orders'); };
  $('#todo').onclick = (e) => {
    const li = e.target.closest('[data-k]'); if (!li) return;
    const [k, id] = [li.dataset.k.slice(0, 1), li.dataset.k.slice(2)];
    if (k === 'o') orderDrawer(orders.find((o) => o.id === id));
    else { A.f.discounts = { q: id, seg: '' }; go('discounts'); }
  };
}
function badge(n) { const b = $('#pendBadge'); b.hidden = !n; b.textContent = n; }

// ================= đơn hàng =================
const SP = { paid: ['ok', 'Đã nhận đủ'], underpaid: ['warn', 'Nhận thiếu'], 'already-paid': ['red', 'Nhận thêm'] };
const orderPill = (o) => (o.status === 'paid' ? pill('ok', 'Đã thanh toán') : o.status === 'cancelled' ? pill('', 'Đã huỷ')
  : o.bankNote ? pill('warn', o.bankNote) : o.claimedAt ? pill('warn', 'Khách báo đã chuyển') : pill('', 'Khách chưa chuyển tiền'));
// đơn bạn phải xem (giống needsReview ở lib/admin.js)
const isReview = (o) => (o.status === 'pending' ? !!(o.claimedAt || o.bankNote) : o.status === 'paid' && /hoàn tiền|thiếu/.test(o.bankNote || ''));
const viaText = (o) => (o.paidVia === 'sepay' ? 'tự động qua SePay' : o.paidVia === 'coupon' ? 'mã giảm 100%' : 'xác nhận tay');
async function orders() {
  const f = A.f.orders = A.f.orders || { q: '', seg: '', sel: '' }; // mở trang lần đầu: xem tất cả đơn
  if (f.seg === 'pending') f.seg = 'review';
  $('#view').innerHTML = `${page('Đơn hàng', 'Khách chuyển đúng mã, đủ tiền thì SePay tự kích hoạt, bạn không cần làm gì. Chỉ xem mục "Cần xem": khách báo đã chuyển mà chưa kích hoạt, hoặc tiền về bị lệch.')}
    ${filterBar('orders', { ph: 'Tìm mã đơn, email, tên đôi…', segs: [['review', 'Cần xem'], ['waiting', 'Khách chưa chuyển'], ['paid', 'Đã thanh toán'], ['cancelled', 'Đã huỷ'], ['', 'Tất cả']], select: [['', 'Mọi sản phẩm'], ...Object.entries(PROD)] })}
    <div class="box"><table class="tb"><thead><tr><th>Đơn</th><th>Khách</th><th class="hm">Sản phẩm</th><th class="num">Số tiền</th><th>Trạng thái</th><th></th></tr></thead><tbody id="list"></tbody></table></div>`;
  const load = async () => {
    const d = await api('/api/admin/orders?' + new URLSearchParams({ status: f.seg, product: f.sel, q: f.q }));
    if (f.seg === 'review') badge(d.total);
    $('#fcnt').textContent = d.total + ' đơn';
    const rows = Object.fromEntries(d.orders.map((o) => [o.id, o]));
    $('#list').innerHTML = d.orders.length ? d.orders.map((o) => {
      const t = o.sepay[0];
      return `<tr data-k="${o.id}">
        <td><span class="code">${esc(o.code)}</span><span class="s">${fmtDateTime(o.createdAt)}</span></td>
        <td>${esc(o.card ? o.card.names || o.card.title : '(thiệp đã xoá)')}<span class="s">${esc(o.email)}</span></td>
        <td class="hm">${PROD[o.product] || esc(o.product)}${o.coupon ? `<span class="s">mã ${esc(o.coupon)}</span>` : ''}</td>
        <td class="num"><b>${money(o.amount)}</b></td>
        <td>${orderPill(o)}${t ? `<span class="s">SePay: ${(SP[t.result] || ['', t.result])[1].toLowerCase()} ${money(t.amount)}</span>` : o.status === 'paid' ? `<span class="s">${viaText(o)}</span>` : ''}</td>
        <td class="act">${o.status === 'pending' && isReview(o) ? '<button class="btn sm" data-a="ok">Đã nhận tiền</button>' : '<button class="dots" data-a="menu" aria-label="Thêm">⋯</button>'}</td></tr>`;
    }).join('') : `<tr><td colspan="6" class="empty">${f.q ? 'Không có đơn nào khớp.' : f.seg === 'review' ? 'Không có đơn nào cần bạn xem 🎉 Đơn chuyển đúng mã đã được SePay tự kích hoạt.' : f.seg === 'waiting' ? 'Không có đơn nào đang chờ khách chuyển tiền.' : 'Không có đơn nào.'}</td></tr>`;
    bindRows($('#list'), rows, orderDrawer, (a, o, b) => {
      if (a === 'ok') return confirmOrder(o);
      menu(b, [['Xem chi tiết', () => orderDrawer(o)], ...ledActs(o), o.site && o.product !== 'led' && ['Mở thiệp ↗', () => open(`/t/${o.site.slug}?preview=1`, '_blank')], ['Ghi chú', () => orderDrawer(o, true)],
        o.status === 'pending' && '-', o.status === 'pending' && ['Đã nhận tiền, kích hoạt tay', () => confirmOrder(o)], o.status === 'pending' && ['Huỷ đơn', () => cancelOrder(o), 'd']]);
    });
  };
  A.reload = load;
  bindBar('orders', () => load().catch(err));
  await load();
}
// đơn có màn LED: xem màn khách làm + sửa giúp (đã chốt thì mở khoá trước)
const hasLed = (o) => o.site && o.card && /led|combo/.test(o.product);
const ledActs = (o) => (hasLed(o) ? [['Mở màn LED ↗', () => open(`/led/${o.site.slug}`, '_blank')], ['Sửa màn LED', () => editLed(o)]] : []);
function editLed(o) {
  ask({
    title: 'Sửa màn LED của khách?',
    text: `Mở trình sửa màn LED của ${esc(o.card.names || o.email)}. Màn đã kích hoạt sẽ được mở khoá để sửa (vẫn giữ đã kích hoạt); lần chiếu thật tiếp theo tự chốt lại.`,
    ok: 'Mở trình sửa',
    run: async () => { await api(`/api/admin/cards/${o.card.id}/led-unlock`, { method: 'POST' }); open(`/sua-led/${o.card.id}`, '_blank'); },
  });
}
function confirmOrder(o) {
  ask({
    title: `Xác nhận đơn ${esc(o.code)}?`,
    text: `Kiểm tra app ngân hàng đã nhận <b>${money(o.amount)}</b> với nội dung <b>${esc(o.code)}</b>. ${PROD[o.product] || 'Sản phẩm'} của ${esc(o.card ? o.card.names || o.card.title : o.email)} sẽ được kích hoạt ngay.`,
    ok: 'Đã nhận tiền, kích hoạt',
    run: async () => { await api(`/api/admin/orders/${o.id}/confirm`, { method: 'POST' }); toast('Đã kích hoạt ' + o.code); closeDrawer(); refresh(); },
  });
}
function cancelOrder(o) {
  ask({
    title: `Huỷ đơn ${esc(o.code)}?`, text: 'Khách vẫn tạo được đơn mới khi muốn thanh toán lại.', ok: 'Huỷ đơn', danger: true,
    run: async () => { await api(`/api/admin/orders/${o.id}/cancel`, { method: 'POST' }); toast('Đã huỷ đơn'); closeDrawer(); refresh(); },
  });
}
function orderDrawer(o, focusNote) {
  drawer(`${dhead(`<span class="code" style="font-size:18px">${esc(o.code)}</span>`, `${PROD[o.product] || ''} · tạo ${fmtDateTime(o.createdAt)}`)}
    <div class="db">
      <div>${orderPill(o)}</div>
      ${o.status === 'pending' && !isReview(o) ? '<p class="muted" style="margin:0">Khách đã tạo đơn nhưng chưa chuyển tiền. Bạn không cần làm gì: khách chuyển đúng mã thì SePay tự kích hoạt. Chỉ bấm "Đã nhận tiền" khi chính bạn thấy tiền đã vào tài khoản.</p>' : ''}
      ${o.status === 'pending' && o.claimedAt && !o.bankNote ? '<p class="muted" style="margin:0">Khách báo đã chuyển nhưng SePay chưa thấy tiền khớp mã đơn. Mở app ngân hàng kiểm tra: thấy tiền thì bấm "Đã nhận tiền".</p>' : ''}
      <dl class="kv">
        <dt>Khách</dt><dd>${esc(o.email)}</dd>
        <dt>Đôi</dt><dd>${esc(o.card ? o.card.names || o.card.title : '(thiệp đã xoá)')}</dd>
        <dt>Số tiền</dt><dd><b>${money(o.amount)}</b>${o.coupon ? ` · mã ${esc(o.coupon)}` : ''}</dd>
        ${o.claimedAt && o.status === 'pending' ? `<dt>Khách báo</dt><dd>đã chuyển · ${ago(o.claimedAt)}</dd>` : ''}
        ${o.status === 'paid' ? `<dt>Kích hoạt</dt><dd>${fmtDateTime(o.paidAt)} · ${viaText(o)}</dd>` : ''}
        ${o.cancelledAt ? `<dt>Huỷ lúc</dt><dd>${fmtDateTime(o.cancelledAt)}</dd>` : ''}
      </dl>
      ${hasLed(o) ? `<div class="sec"><h4>Màn LED</h4><a class="lnk" href="/led/${esc(o.site.slug)}" target="_blank" rel="noopener"><span>/led/${esc(o.site.slug)}</span> ↗</a><button class="btn sm plain" id="oledit" style="margin-top:8px">Sửa màn LED</button></div>` : ''}
      ${o.site ? `<div class="sec"><h4>Thiệp web</h4><a class="lnk" href="/t/${esc(o.site.slug)}?preview=1" target="_blank" rel="noopener" title="${esc(o.site.url)}"><span>/t/${esc(o.site.slug)}</span><small>${o.site.published ? 'đã phát hành' : 'nháp'}</small> ↗</a></div>` : ''}
      <div class="sec"><h4>SePay</h4>${o.sepay.length ? `<ul class="tl">${o.sepay.map((t) => { const [c, l] = SP[t.result] || ['', t.result]; return `<li>${pill(c, `${l} ${money(t.amount)}`)}<small>${ago(t.at)}</small></li>`; }).join('')}</ul>` : `<p>${o.status === 'paid' ? 'Không qua SePay.' : 'Chưa nhận được tiền nào cho đơn này.'}</p>`}
        ${o.bankNote ? `<p style="margin-top:8px;color:var(--danger)">🏦 ${esc(o.bankNote)}</p>` : ''}</div>
      <div class="sec"><h4>Ghi chú</h4><label class="fl"><textarea id="onote" placeholder="VD: đã gọi khách, chuyển thiếu…">${esc(o.note)}</textarea></label>
        <button class="btn sm plain" id="onoteSave" style="margin-top:8px">Lưu ghi chú</button></div>
    </div>
    ${o.status === 'pending' ? '<div class="df"><button class="btn plain" id="ocancel">Huỷ đơn</button><button class="btn" id="ook">Đã nhận tiền, kích hoạt</button></div>' : ''}`,
  (box) => {
    $('#onoteSave', box).onclick = async () => {
      try { await api(`/api/admin/orders/${o.id}`, { method: 'PUT', body: { note: $('#onote', box).value } }); o.note = $('#onote', box).value; toast('Đã lưu ghi chú'); } catch (e) { err(e); }
    };
    if (focusNote) $('#onote', box).focus();
    if ($('#oledit', box)) $('#oledit', box).onclick = () => editLed(o);
    if ($('#ook', box)) $('#ook', box).onclick = () => confirmOrder(o);
    if ($('#ocancel', box)) {
      $('#ocancel', box).onclick = () => cancelOrder(o);
    }
  });
}

// ================= mã giảm giá =================
const discOff = (d) => (d.type === 'percent' ? `-${d.value}%` : `-${money(d.value)}`);
const discState = (d) => (!d.active ? pill('', 'Đã tắt') : d.expired ? pill('red', 'Hết hạn') : d.limit && d.uses >= d.limit ? pill('warn', 'Hết lượt') : pill('ok', 'Đang chạy'));
const discRunning = (d) => d.active && !d.expired && !(d.limit && d.uses >= d.limit);
async function discounts() {
  const f = A.f.discounts = A.f.discounts || { q: '', seg: 'run' };
  $('#view').innerHTML = `${page('Mã giảm giá', 'Mã phát cho khách nhập ở bước thanh toán.', '<button class="btn" id="dnew">+ Tạo mã</button>')}
    ${filterBar('discounts', { ph: 'Tìm mã, ghi chú…', segs: [['run', 'Đang chạy'], ['end', 'Đã dừng'], ['', 'Tất cả']] })}
    <div class="box"><table class="tb"><thead><tr><th>Mã</th><th>Giảm</th><th class="hm">Áp dụng</th><th class="hm">Hạn</th><th class="num">Đã dùng</th><th class="num hm">Doanh thu</th><th>Trạng thái</th><th></th></tr></thead><tbody id="list"></tbody></table></div>`;
  $('#dnew').onclick = () => discModal();
  let all = [];
  const draw = () => {
    const q = (f.q || '').toLowerCase();
    const list = all.filter((d) => (!f.seg || (f.seg === 'run') === discRunning(d)) && (!q || (d.code + ' ' + (d.note || '')).toLowerCase().includes(q)));
    $('#fcnt').textContent = list.length + ' mã';
    const rows = Object.fromEntries(list.map((d) => [d.code, d]));
    $('#list').innerHTML = list.length ? list.map((d) => `<tr data-k="${esc(d.code)}" class="${d.active ? '' : 'off'}">
      <td><span class="code">${esc(d.code)}</span>${d.note ? `<span class="s">${esc(d.note)}</span>` : ''}</td>
      <td><b>${discOff(d)}</b></td>
      <td class="hm">${d.products && d.products.length ? d.products.map((p) => PROD[p]).join(', ') : 'Mọi sản phẩm'}</td>
      <td class="hm">${d.expiresAt ? ddmm(d.expiresAt) : '<span class="s" style="display:inline">Không hạn</span>'}</td>
      <td class="num">${num(d.uses)}${d.limit ? ` / ${num(d.limit)}` : ''}${d.pending ? `<span class="s">${d.pending} đơn đang chờ</span>` : ''}</td>
      <td class="num hm">${money(d.revenue)}${d.saved ? `<span class="s">đã giảm ${money(d.saved)}</span>` : ''}</td>
      <td>${discState(d)}</td>
      <td class="act"><button class="dots" data-a="menu" aria-label="Thêm">⋯</button></td></tr>`).join('')
      : `<tr><td colspan="8" class="empty">${all.length ? 'Không có mã nào khớp.' : 'Chưa có mã giảm giá nào — bấm "+ Tạo mã".'}</td></tr>`;
    bindRows($('#list'), rows, discModal, (a, d, b) => menu(b, [
      ['Sửa', () => discModal(d)],
      ['Sao chép mã', () => copyText(d.code, 'Đã sao chép ' + d.code)],
      ['Xem đơn dùng mã', () => { A.f.orders = { q: d.code, seg: '', sel: '' }; go('orders'); }],
      '-',
      [d.active ? 'Tắt mã' : 'Bật lại', async () => { try { await api('/api/admin/discounts/' + encodeURIComponent(d.code), { method: 'PUT', body: { active: !d.active } }); toast(d.active ? 'Đã tắt ' + d.code : 'Đã bật ' + d.code); refresh(); } catch (e) { err(e); } }],
      ['Xoá', () => ask({
        title: `Xoá mã ${esc(d.code)}?`, text: `${d.uses ? 'Các đơn đã dùng mã vẫn giữ nguyên. ' : ''}Muốn tạm ngừng thì nên bấm <b>Tắt mã</b> để còn xem lại số liệu.`, ok: 'Xoá mã', danger: true,
        run: async () => { await api('/api/admin/discounts/' + encodeURIComponent(d.code), { method: 'DELETE' }); toast('Đã xoá ' + d.code); refresh(); },
      }), 'd'],
    ]));
  };
  const load = async () => { all = (await api('/api/admin/discounts')).discounts; draw(); };
  A.reload = load;
  bindBar('discounts', draw);
  await load();
}
function discModal(d) {
  const v = d || { code: '', type: 'amount', value: '', products: ['card'], expiresAt: '', limit: '', note: '' };
  const prods = v.products && v.products.length ? v.products : Object.keys(PROD);
  const today = new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 10);
  let type = v.type === 'percent' ? 'percent' : 'amount';
  modal({
    title: d ? `Sửa mã ${esc(d.code)}` : 'Tạo mã giảm giá',
    body: `<label class="fl">Mã<div class="codein"><input id="dcode" value="${esc(v.code)}" placeholder="VD: CUOI50K" maxlength="30" ${d ? 'readonly' : ''}>${d ? '' : '<button type="button" id="drand" title="Tạo mã ngẫu nhiên">🎲</button>'}</div></label>
      <label class="fl">Mức giảm<div class="ig"><input id="dval" inputmode="numeric" value="${v.value}" placeholder="${type === 'percent' ? '20' : '50000'}"><div class="tg" id="dtype"><button type="button" data-t="amount" class="${type === 'amount' ? 'on' : ''}">đ</button><button type="button" data-t="percent" class="${type === 'percent' ? 'on' : ''}">%</button></div></div></label>
      <div class="fl">Áp dụng cho<div class="chips" id="dprods">${Object.entries(PROD).map(([k, n]) => `<label><input type="checkbox" value="${k}" ${prods.includes(k) ? 'checked' : ''}>${n}</label>`).join('')}</div></div>
      <div class="r2"><label class="fl">Hết hạn sau ngày<input type="date" id="dexp" min="${today}" value="${esc(v.expiresAt || '')}"><small>Để trống = không hạn</small></label>
        <label class="fl">Số lượt tối đa<input id="dlim" inputmode="numeric" value="${v.limit || ''}" placeholder="Không giới hạn"><small>Tính theo đơn đã thanh toán</small></label></div>
      <label class="fl"><span>Ghi chú <small>· chỉ bạn thấy</small></span><input id="dnote" value="${esc(v.note || '')}" placeholder="VD: phát cho nhóm FB cưới" maxlength="200"></label>
      <div class="preview" id="dprev"></div>`,
    foot: `<button class="btn plain" data-close>Huỷ</button><button class="btn" id="dsave">${d ? 'Lưu' : 'Tạo mã'}</button>`,
    onMount: (box, close) => {
      const price = (A.meta && A.meta.price) || 0;
      const prev = () => {
        const n = Math.round(Number(String($('#dval', box).value).replace(/[^\d]/g, '')) || 0);
        const ps = $$('#dprods input:checked', box).map((x) => PROD[x.value]);
        const off = type === 'percent' ? Math.round((price * Math.min(n, 100)) / 100 / 1000) * 1000 : Math.min(n, price);
        $('#dprev', box).innerHTML = n ? `Khách nhập <b>${esc(($('#dcode', box).value || 'MÃ').toUpperCase())}</b> → thiệp <s>${money(price)}</s> còn <b>${money(price - off)}</b>${off >= price ? ' · kích hoạt luôn, không cần chuyển khoản' : ''} · áp cho ${ps.join(', ') || '…'}`
          : 'Nhập mức giảm để xem khách sẽ trả bao nhiêu.';
      };
      box.addEventListener('input', prev); box.addEventListener('change', prev);
      $('#dtype', box).onclick = (e) => { const b = e.target.closest('button'); if (!b) return; type = b.dataset.t; $$('#dtype button', box).forEach((x) => x.classList.toggle('on', x === b)); $('#dval', box).placeholder = type === 'percent' ? '20' : '50000'; prev(); };
      if ($('#drand', box)) $('#drand', box).onclick = () => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; $('#dcode', box).value = 'CUOI' + Array.from({ length: 4 }, () => a[Math.floor(Math.random() * a.length)]).join(''); prev(); };
      prev();
      $('#dsave', box).onclick = async () => {
        const products = $$('#dprods input:checked', box).map((x) => x.value);
        if (!products.length) return toast('Chọn ít nhất một sản phẩm', true);
        const body = { code: $('#dcode', box).value, type, value: $('#dval', box).value, products, expiresAt: $('#dexp', box).value, limit: $('#dlim', box).value, note: $('#dnote', box).value };
        try {
          if (d) await api('/api/admin/discounts/' + encodeURIComponent(d.code), { method: 'PUT', body });
          else await api('/api/admin/discounts', { method: 'POST', body });
          close(); toast(d ? 'Đã lưu mã ' + d.code : 'Đã tạo mã ' + body.code.toUpperCase());
          if (A.page === 'discounts') refresh();
        } catch (e) { err(e); }
      };
    },
  });
}

// ================= người dùng =================
const loginVia = (u) => [u.google && 'Google', u.hasPassword && 'Mật khẩu'].filter(Boolean).join(' + ') || '—';
async function users() {
  const f = A.f.users = A.f.users || { q: '', seg: '' };
  $('#view').innerHTML = `${page('Người dùng', 'Bấm một người để xem thiệp, đơn, đặt lại mật khẩu hoặc khoá tài khoản.')}
    ${filterBar('users', { ph: 'Tìm email, tên…', segs: [['', 'Tất cả'], ['paying', 'Đã trả tiền'], ['disabled', 'Đang khoá']] })}
    <div class="box"><table class="tb"><thead><tr><th>Người dùng</th><th class="hm">Đăng nhập</th><th class="num">Thiệp</th><th class="num">Đã chi</th><th class="hm">Hoạt động</th><th></th></tr></thead><tbody id="list"></tbody></table></div>`;
  const load = async () => {
    const d = await api('/api/admin/users?' + new URLSearchParams({ q: f.q, filter: f.seg }));
    $('#fcnt').textContent = `${d.users.length}/${d.total} người`;
    const rows = Object.fromEntries(d.users.map((u) => [u.id, u]));
    $('#list').innerHTML = d.users.length ? d.users.map((u) => `<tr data-k="${u.id}" class="${u.disabled ? 'off' : ''}">
      <td><b>${esc(u.name || u.email.split('@')[0])}</b> ${u.disabled ? pill('', 'Đã khoá') : ''}<span class="s">${esc(u.email)}</span></td>
      <td class="hm">${loginVia(u)}<span class="s">tham gia ${fmtDate(u.createdAt)}</span></td>
      <td class="num">${u.cards}</td>
      <td class="num">${u.spent ? money(u.spent) : '—'}${u.orders ? `<span class="s">${u.orders} đơn</span>` : ''}</td>
      <td class="hm"><span class="s">${ago(u.lastSeenAt)}</span></td>
      <td class="act"><button class="dots" data-a="menu" aria-label="Thêm">⋯</button></td></tr>`).join('') : '<tr><td colspan="6" class="empty">Không có người dùng khớp.</td></tr>';
    bindRows($('#list'), rows, userDrawer, (a, u, b) => menu(b, [['Xem chi tiết', () => userDrawer(u)], ['Đặt lại mật khẩu', () => resetPw(u)], '-', [u.disabled ? 'Mở khoá' : 'Khoá tài khoản', () => lockUser(u), u.disabled ? '' : 'd']]));
  };
  A.reload = load;
  bindBar('users', () => load().catch(err));
  await load();
}
function lockUser(u) {
  ask({
    title: u.disabled ? `Mở khoá ${esc(u.email)}?` : `Khoá ${esc(u.email)}?`,
    text: u.disabled ? 'Người này đăng nhập lại được bình thường.' : 'Người này bị đăng xuất và không đăng nhập được nữa. Thiệp đã phát hành vẫn mở cho khách mời.',
    ok: u.disabled ? 'Mở khoá' : 'Khoá', danger: !u.disabled,
    run: async () => { await api(`/api/admin/users/${u.id}`, { method: 'PUT', body: { disabled: !u.disabled } }); toast('Đã cập nhật'); closeDrawer(); refresh(); },
  });
}
function resetPw(u) {
  ask({
    title: 'Đặt lại mật khẩu?', text: `Tạo mật khẩu tạm mới cho <b>${esc(u.email)}</b>. Mật khẩu cũ hết hiệu lực và người này bị đăng xuất.`, ok: 'Tạo mật khẩu tạm',
    run: async () => {
      const r = await api(`/api/admin/users/${u.id}/password`, { method: 'POST' });
      setTimeout(() => modal({
        title: 'Mật khẩu tạm', size: 'sm',
        body: `<p>Gửi mật khẩu này cho <b>${esc(u.email)}</b> qua kênh riêng (Zalo, điện thoại). Nó chỉ hiện một lần.</p><div class="pw">${esc(r.password)}</div>`,
        foot: '<button class="btn plain" data-close>Đóng</button><button class="btn" id="cpw">Sao chép</button>',
        onMount: (box) => { $('#cpw', box).onclick = () => copyText(r.password, 'Đã sao chép mật khẩu tạm'); },
      }));
    },
  });
}
async function userDrawer(u) {
  const close = drawer(`${dhead(esc(u.name || u.email.split('@')[0]), `${esc(u.email)} · ${loginVia(u)}`)}
    <div class="db">
      ${u.disabled ? `<div>${pill('', 'Đang khoá')}</div>` : ''}
      <dl class="kv"><dt>Tham gia</dt><dd>${fmtDate(u.createdAt)}</dd><dt>Hoạt động</dt><dd>${ago(u.lastSeenAt)}</dd><dt>Đã chi</dt><dd><b>${u.spent ? money(u.spent) : '—'}</b>${u.orders ? ` · ${u.orders} đơn` : ''}</dd></dl>
      <div class="sec"><h4>Thiệp (${u.cards})</h4><div id="ucards"><p>Đang tải…</p></div></div>
      <div class="sec"><h4>Đơn hàng</h4><div id="uorders"><p>Đang tải…</p></div></div>
    </div>
    <div class="df"><button class="btn plain" id="upw">Đặt lại mật khẩu</button><button class="btn plain" id="ulock" ${u.disabled ? '' : 'style="color:var(--danger)"'}>${u.disabled ? 'Mở khoá' : 'Khoá'}</button></div>`,
  (box) => { $('#upw', box).onclick = () => resetPw(u); $('#ulock', box).onclick = () => lockUser(u); });
  try {
    const [c, o] = await Promise.all([api('/api/admin/cards?' + new URLSearchParams({ q: u.email })), api('/api/admin/orders?' + new URLSearchParams({ q: u.email }))]);
    const cards = c.cards.filter((x) => x.ownerEmail === u.email), ords = o.orders.filter((x) => x.email === u.email);
    const box = $('.dr aside'); if (!box) return;
    $('#ucards', box).innerHTML = cards.length ? `<ul class="tl">${cards.map((x) => `<li data-k="${x.id}"><span><b>${esc(x.names || x.title)}</b><br><span class="muted" style="font-size:12px">/t/${esc(x.slug)} · ${x.status === 'published' ? 'đã phát hành' : 'nháp'}</span></span><small>›</small></li>`).join('')}</ul>` : '<p>Chưa có thiệp.</p>';
    $('#uorders', box).innerHTML = ords.length ? `<ul class="tl">${ords.map((x) => `<li data-k="${x.id}"><span class="code">${esc(x.code)}</span>${PROD[x.product] || ''}<small>${money(x.amount)} · ${x.status === 'paid' ? 'đã trả' : x.status === 'cancelled' ? 'huỷ' : 'chờ'}</small></li>`).join('')}</ul>` : '<p>Chưa có đơn.</p>';
    $('#ucards', box).onclick = (e) => { const li = e.target.closest('[data-k]'); if (li) cardDrawer(cards.find((x) => x.id === li.dataset.k)); };
    $('#uorders', box).onclick = (e) => { const li = e.target.closest('[data-k]'); if (li) orderDrawer(ords.find((x) => x.id === li.dataset.k)); };
  } catch (e) { err(e); close(); }
}

// ================= thiệp & sản phẩm =================
const prodLine = (c) => [
  ['Thiệp', c.paid ? 'ok' : c.status !== 'published' ? '' : c.expired ? 'red' : 'warn', c.paid ? '✓' : c.status !== 'published' ? 'nháp' : c.expired ? 'hết thử' : 'thử'],
  c.led && c.led.created && ['LED', c.led.paid ? 'ok' : 'warn', c.led.paid ? '✓' : 'thử'],
  c.video && c.video.created && ['Video', c.video.paid ? 'ok' : 'warn', c.video.paid ? '✓' : 'thử'],
].filter(Boolean).map(([n, cls, s]) => `<span style="white-space:nowrap;margin-right:10px;color:var(--${cls === 'ok' ? 'ok' : cls === 'red' ? 'primary' : cls === 'warn' ? 'warn' : 'muted'})">${n} ${s}</span>`).join('');
async function cards() {
  const f = A.f.cards = A.f.cards || { q: '', seg: '' };
  const sel = new Set(); // id thiệp đang tích chọn (trong danh sách đang hiện)
  $('#view').innerHTML = `${page('Thiệp & sản phẩm', 'Bấm một thiệp để mở link, kích hoạt tay thiệp / LED / video, hoặc gỡ thiệp vi phạm. Tích chọn để xoá nhiều thiệp.',
    '<button class="btn sm" id="cdelSel" style="background:var(--danger)" hidden>Xoá đã chọn</button><button class="btn sm plain" id="cdelAll" style="color:var(--danger)">Xoá tất cả thiệp</button>')}
    ${filterBar('cards', { ph: 'Tìm tên đôi, đường dẫn, email…', segs: [['', 'Tất cả'], ['published', 'Đã phát hành'], ['paid', 'Có trả phí'], ['trial', 'Dùng thử'], ['blocked', 'Đã gỡ']] })}
    <div class="box"><table class="tb"><thead><tr><th class="ck"><input type="checkbox" id="ckAll" aria-label="Chọn tất cả thiệp đang hiện"></th><th>Thiệp</th><th class="hm">Chủ thiệp</th><th>Sản phẩm</th><th class="num hm">Lượt xem</th><th class="num hm">Khách mời</th><th></th></tr></thead><tbody id="list"></tbody></table></div>`;
  const load = async () => {
    const d = await api('/api/admin/cards?' + new URLSearchParams({ q: f.q, filter: f.seg }));
    $('#fcnt').textContent = `${d.cards.length}/${d.total} thiệp`;
    const rows = Object.fromEntries(d.cards.map((c) => [c.id, c]));
    sel.clear(); $('#ckAll').checked = false;
    $('#list').innerHTML = d.cards.length ? d.cards.map((c) => `<tr data-k="${c.id}" class="${c.blocked ? 'off' : ''}">
      <td class="ck"><input type="checkbox" data-ck="${c.id}" aria-label="Chọn thiệp ${esc(c.names || c.title)}"></td>
      <td><b>${esc(c.names || c.title)}</b> ${c.blocked ? pill('red', 'Đã gỡ') : ''}<span class="s">/t/${esc(c.slug)} · ${c.status === 'published' ? 'đã phát hành' : 'nháp'} · sửa ${ago(c.updatedAt)}</span></td>
      <td class="hm">${c.guest ? '<span class="s" style="display:inline">khách chưa đăng nhập</span>' : esc(c.ownerEmail)}</td>
      <td><span class="s" style="display:inline">${prodLine(c)}</span></td>
      <td class="num hm">${num(c.views)}</td>
      <td class="num hm">${num(c.guests)}</td>
      <td class="act"><button class="dots" data-a="menu" aria-label="Thêm">⋯</button></td></tr>`).join('') : '<tr><td colspan="7" class="empty">Không có thiệp khớp.</td></tr>';
    A.cardRows = rows; syncSel();
    bindRows($('#list'), rows, cardDrawer, (a, c, b) => menu(b, [['Xem chi tiết', () => cardDrawer(c)], ['Mở thiệp ↗', () => open(`/t/${c.slug}?preview=1`, '_blank')], '-', [c.blocked ? 'Khôi phục thiệp' : 'Gỡ thiệp', () => blockCard(c), c.blocked ? '' : 'd'], ['Xoá thiệp', () => deleteCards([c]), 'd']]));
  };
  // tích chọn / bỏ chọn
  const syncSel = () => {
    const b = $('#cdelSel'); b.hidden = !sel.size; b.textContent = `Xoá ${sel.size} thiệp đã chọn`;
    const boxes = $$('#list [data-ck]'); $('#ckAll').checked = boxes.length > 0 && sel.size === boxes.length;
    $('#ckAll').indeterminate = sel.size > 0 && sel.size < boxes.length;
  };
  $('#list').addEventListener('change', (e) => { const x = e.target.closest('[data-ck]'); if (!x) return; if (x.checked) sel.add(x.dataset.ck); else sel.delete(x.dataset.ck); syncSel(); });
  $('#ckAll').onchange = (e) => { $$('#list [data-ck]').forEach((x) => { x.checked = e.target.checked; if (x.checked) sel.add(x.dataset.ck); else sel.delete(x.dataset.ck); }); syncSel(); };
  $('#cdelSel').onclick = () => deleteCards([...sel].map((id) => A.cardRows[id]).filter(Boolean));
  $('#cdelAll').onclick = () => deleteCards(null);
  A.reload = load;
  bindBar('cards', () => load().catch(err));
  await load();
}
// xoá các thiệp đã chọn (list) hoặc tất cả thiệp trên web (list = null)
async function deleteCards(list) {
  const isPaid = (c) => c.paid || (c.led && c.led.paid) || (c.video && c.video.paid);
  let n, paid;
  if (list) { n = list.length; paid = list.filter(isPaid).length; } else {
    const d = await api('/api/admin/cards').catch(err); if (!d) return;
    n = d.total; paid = d.cards.filter(isPaid).length;
    if (!n) return toast('Chưa có thiệp nào để xoá');
  }
  const what = list ? (n === 1 ? `thiệp <b>${esc(list[0].names || list[0].title)}</b>` : `<b>${n} thiệp</b> đã chọn`) : `<b>TẤT CẢ ${n} thiệp</b> trên web, kể cả thiệp nháp và thiệp không hiện trong bộ lọc`;
  ask({
    title: list ? `Xoá ${n} thiệp?` : 'Xoá tất cả thiệp?', danger: true, ok: list ? 'Xoá vĩnh viễn' : 'Xoá tất cả', word: list ? '' : 'XOÁ',
    text: `Xoá vĩnh viễn ${what}, cùng xác nhận tham dự, lời chúc và đơn chưa thanh toán của chúng. Link thiệp sẽ không mở được nữa. <b>Không hoàn tác được.</b>`
      + (paid ? `<br><br>⚠ Trong đó có <b>${paid} thiệp đã trả phí</b>. Đơn đã thanh toán vẫn được giữ trong Đơn hàng để đối chiếu tiền.` : '')
      + '<br><br>Khách mời trong sổ tay cưới được giữ lại.',
    run: async () => {
      const r = await api('/api/admin/cards/delete', { method: 'POST', body: list ? { ids: list.map((c) => c.id) } : { all: true, confirm: 'XOÁ' } });
      toast(`Đã xoá ${r.deleted} thiệp` + (r.orders ? ` và ${r.orders} đơn chưa thanh toán` : ''));
      closeDrawer(); refresh();
    },
  });
}
function blockCard(c) {
  ask(c.blocked
    ? { title: 'Khôi phục thiệp?', text: `Khách mời mở lại được <b>/t/${esc(c.slug)}</b> ngay.`, ok: 'Khôi phục', run: async () => { await api(`/api/admin/cards/${c.id}/block`, { method: 'POST', body: { blocked: false } }); toast('Đã khôi phục'); closeDrawer(); refresh(); } }
    : { title: `Gỡ thiệp ${esc(c.names || c.title)}?`, text: 'Khách mời mở link sẽ thấy thông báo thiệp tạm không khả dụng. Chủ thiệp vẫn sửa được.', ok: 'Gỡ thiệp', danger: true, reason: 'Lý do',
      run: async (reason) => { await api(`/api/admin/cards/${c.id}/block`, { method: 'POST', body: { blocked: true, reason } }); toast('Đã gỡ thiệp'); closeDrawer(); refresh(); } });
}
function cardDrawer(c) {
  const sw = (k, name, s, created, sub) => `<div class="tgl"><span>${name}<small>${created ? (s.paid ? 'Đã kích hoạt' : sub || 'Chưa kích hoạt') : 'Khách chưa tạo'}</small></span><button class="sw ${s.paid ? 'on' : ''}" data-p="${k}" ${created ? '' : 'disabled'} aria-label="${s.paid ? 'Huỷ kích hoạt' : 'Kích hoạt'} ${name}"></button></div>`;
  drawer(`${dhead(esc(c.names || c.title), c.guest ? 'Thiệp nháp của khách chưa đăng nhập' : esc(c.ownerEmail))}
    <div class="db">
      ${c.blocked ? `<div>${pill('red', 'Đã gỡ')}${c.blockReason ? ` <span class="muted" style="font-size:13px">${esc(c.blockReason)}</span>` : ''}</div>` : ''}
      <a class="lnk" href="/t/${esc(c.slug)}?preview=1" target="_blank" rel="noopener" title="${esc(c.url)}"><span>/t/${esc(c.slug)}</span><small>${c.status === 'published' ? 'đã phát hành' : 'nháp'}</small> ↗</a>
      <dl class="kv">
        ${c.date ? `<dt>Ngày cưới</dt><dd>${fmtDate(Date.parse(c.date))}</dd>` : ''}
        <dt>Tạo lúc</dt><dd>${fmtDateTime(c.createdAt)}</dd>
        <dt>Lượt xem</dt><dd>${num(c.views)}</dd>
        <dt>Khách mời</dt><dd>${num(c.guests)} · ${num(c.rsvpYes)} người nhận lời</dd>
        <dt>Lời chúc</dt><dd>${num(c.wishes)}</dd>
      </dl>
      <div class="sec"><h4>Kích hoạt tay</h4><div style="display:grid;gap:8px" id="csw">
        ${sw('card', 'Thiệp cưới', { paid: c.paid }, true, c.status !== 'published' ? 'Nháp' : c.expired ? 'Hết dùng thử' : 'Đang dùng thử')}
        ${sw('led', 'Màn hình LED', c.led || {}, c.led && c.led.created)}
        ${sw('video', 'Slide / màn hình dạm ngõ', c.video || {}, c.video && c.video.created)}
      </div><p style="margin:8px 0 0;font-size:12px;color:var(--muted)">Dùng khi tặng khách, nhận tiền mặt hoặc đã hoàn tiền. Mọi thao tác ghi vào nhật ký.</p></div>
    </div>
    <div class="df"><button class="btn plain" id="cblock" ${c.blocked ? '' : 'style="color:var(--danger)"'}>${c.blocked ? 'Khôi phục thiệp' : 'Gỡ thiệp vi phạm'}</button></div>`,
  (box) => {
    $('#cblock', box).onclick = () => blockCard(c);
    $('#csw', box).onclick = (e) => {
      const b = e.target.closest('[data-p]'); if (!b || b.disabled) return;
      const on = !b.classList.contains('on'), name = b.closest('.tgl').firstChild.firstChild.textContent;
      ask({
        title: `${on ? 'Kích hoạt' : 'Huỷ kích hoạt'} ${name.toLowerCase()}?`, text: `Thiệp <b>${esc(c.names || c.title)}</b>.`, ok: on ? 'Kích hoạt' : 'Huỷ kích hoạt', danger: !on,
        reason: on ? 'Lý do (vd: tặng khách, nhận tiền mặt)' : 'Lý do (vd: đã hoàn tiền)',
        run: async (reason) => {
          await api(`/api/admin/cards/${c.id}/product`, { method: 'POST', body: { product: b.dataset.p, paid: on, reason } });
          b.classList.toggle('on', on);
          const k = b.dataset.p; if (k === 'card') c.paid = on; else c[k].paid = on;
          toast('Đã cập nhật'); if (A.page === 'cards') A.reload().catch(() => {});
        },
      });
    };
  });
}

// ================= truy cập =================
async function traffic() {
  const days = A.f.tdays || 30;
  const d = await api('/api/admin/traffic?days=' + days);
  const t = d.totals, f = d.funnel, y = d.yesterday || { visitors: 0 }, x = d.exclude || { device: false, accounts: [], users: 0 };
  const steps = [['Khách ghé web', f.visitors], ['Mở xem thử mẫu', f.views], ['Bấm "Dùng mẫu"', f.uses], ['Tạo thiệp', f.cards], ['Đăng ký', f.signups], ['Phát hành thiệp', f.published], ['Thanh toán', f.paid]];
  const fmax = Math.max(1, ...steps.map((s) => s[1]));
  const KIND = { thiep: 'Thiệp', video: 'Video', led: 'Màn LED' };
  const rankList = (list, unit) => (list.length ? `<ul class="todo">${list.map((r) => `<li><div><b>${esc(r.key)}</b></div><span class="v">${num(r.n)} ${unit}</span></li>`).join('')}</ul>` : '<p class="empty">Chưa có số liệu.</p>');
  const tplTable = (list) => (list.length ? `<table class="tb"><thead><tr><th>Mẫu</th><th class="hm">Loại</th><th class="num">Xem thử</th><th class="num">Dùng mẫu</th><th class="num">Tỉ lệ</th></tr></thead><tbody>${list.map((r) => `<tr><td><b>${esc(r.name)}</b><span class="s">${KIND[r.kind] || ''}</span></td><td class="hm">${KIND[r.kind] || ''}</td><td class="num">${num(r.views)}</td><td class="num">${num(r.uses)}</td><td class="num">${pct(r.uses, r.views)}</td></tr>`).join('')}</tbody></table>` : '<p class="empty">Chưa có ai mở mẫu nào.</p>');
  $('#view').innerHTML = `${page('Truy cập', 'Lượt ghé các trang giới thiệu và lượt mở xem thử mẫu. Không tính bot.', `<select class="sel" id="tdays">${[7, 30, 90].map((n) => `<option value="${n}" ${n === days ? 'selected' : ''}>${n} ngày</option>`).join('')}</select><button class="btn sm plain" id="tclear" style="color:var(--danger)">Xoá báo cáo truy cập</button>`)}
    <div class="note ${x.device ? '' : 'w'}">${x.device ? '✓ Chỉ đếm khách ngoài — máy này' : 'Máy này chưa được loại khỏi thống kê'}${x.accounts.length ? ` và tài khoản ${x.accounts.map(esc).join(', ')}` : ''}${x.device ? ' không được tính' : ''}<button class="lk" id="xinfo">Chi tiết</button></div>
    <div class="kp">
      <div class="box"><span>Khách hôm nay</span><b>${num(d.today.visitors)}</b><small>Hôm qua ${num(y.visitors)} · ${num(d.today.pv)} lượt xem trang</small></div>
      <div class="box"><span>Khách ${days} ngày</span><b>${num(t.visitors)}</b><small>${num(t.fresh)} người ghé lần đầu</small></div>
      <div class="box"><span>Khách → tạo thiệp</span><b>${pct(f.cards, f.visitors)}</b><small>${num(f.cards)} thiệp · ${num(f.drafts)} nháp chưa đăng nhập</small></div>
      <div class="box"><span>Khách → thanh toán</span><b>${pct(f.paid, f.visitors)}</b><small>${num(f.paid)} đơn · ${money(f.revenue)}</small></div>
    </div>
    <div class="g2">
      <div class="box"><div class="bh"><h3>Khách mỗi ngày</h3><small class="muted">${num(t.pv)} lượt xem trang</small></div><div class="chart">${barsSvg(d.series, 'visitors', (v) => v + ' khách')}</div></div>
      <div class="box"><div class="bh"><h3>Khách tới từ đâu</h3><button class="lk" id="tmore">Trang & thiết bị</button></div>${rankList(d.refs.slice(0, 5), 'khách')}</div>
    </div>
    <div class="g2">
      <div class="box"><div class="bh"><h3>Phễu ${days} ngày</h3></div>
        <div class="funnel">${steps.map((s, i) => `<div class="frow"><span>${s[0]}</span><i style="width:${(s[1] / fmax) * 100}%"></i><b>${num(s[1])}${i ? `<small>${pct(s[1], steps[i - 1][1])}</small>` : ''}</b></div>`).join('')}</div></div>
      <div class="box"><div class="bh"><h3>Mẫu được xem nhiều</h3>${d.templates.length > 5 ? `<button class="lk" id="tpls">Tất cả ${d.templates.length} mẫu</button>` : ''}</div>
        ${d.templates.length ? `<ul class="todo">${d.templates.slice(0, 5).map((r) => `<li><div><b>${esc(r.name)}</b><small>${KIND[r.kind] || ''} · ${num(r.uses)} lượt dùng mẫu</small></div><span class="v">${num(r.views)} xem</span></li>`).join('')}</ul>` : '<p class="empty">Chưa có ai mở mẫu nào.</p>'}</div>
    </div>`;
  $('#tdays').onchange = (e) => { A.f.tdays = +e.target.value; render(); };
  $('#tclear').onclick = () => ask({
    title: 'Xoá báo cáo truy cập?', danger: true, ok: 'Xoá báo cáo', word: 'XOÁ',
    text: 'Xoá vĩnh viễn toàn bộ số liệu truy cập từ trước tới nay: lượt khách ghé, lượt xem trang, nguồn tới, thiết bị, lượt xem thử và dùng từng mẫu. Trang Truy cập và phễu khách ở Tổng quan sẽ về 0, đếm lại từ lúc này. <b>Không hoàn tác được.</b><br><br>Thiệp, đơn hàng và tài khoản không bị ảnh hưởng.',
    run: async () => { await api('/api/admin/traffic/clear', { method: 'POST', body: { confirm: 'XOÁ' } }); toast('Đã xoá báo cáo truy cập'); render(); },
  });
  $('#xinfo').onclick = () => modal({
    title: x.device ? 'Chỉ đếm khách ngoài' : 'Máy này chưa được loại', size: 'sm',
    body: `<p>Không tính lượt vào từ máy đã mở /admin hoặc đăng nhập tài khoản chủ web${x.accounts.length ? ` (<b>${x.accounts.map(esc).join(', ')}</b>)` : ''}. Thiệp, đăng ký, đơn của các tài khoản đó cũng bỏ khỏi phễu.</p>
      <p>Điện thoại của bạn: mở /admin một lần để được loại. Số liệu trước 16/11/2026 vẫn còn lẫn lượt của bạn — bộ đếm chỉ cộng dồn, không tách lại được.</p>`,
    foot: '<button class="btn" data-close>Đã hiểu</button>',
  });
  $('#tmore').onclick = () => modal({ title: 'Nguồn, trang & thiết bị', size: 'lg', body: `<div class="g2" style="margin:0"><div class="box"><div class="bh"><h3>Khách tới từ đâu</h3></div>${rankList(d.refs, 'khách')}</div><div class="box"><div class="bh"><h3>Trang được xem</h3></div>${rankList(d.pages, 'lượt')}</div></div><div class="box"><div class="bh"><h3>Thiết bị</h3></div>${rankList(d.devices, 'khách')}</div>` });
  if ($('#tpls')) $('#tpls').onclick = () => modal({ title: `Mẫu được xem · ${days} ngày`, size: 'lg', body: `<div class="box">${tplTable(d.templates)}</div>` });
}

// ================= cài đặt =================
async function settings() {
  const { settings: s } = await api('/api/admin/settings');
  const was = (list, price) => (list > price ? `<s>${money(list)}</s>` : '');
  $('#view').innerHTML = `${page('Cài đặt', 'Mỗi nhóm bấm Sửa để đổi — áp dụng ngay, không cần khởi động lại.')}
    <div class="set">
      <div class="box"><div class="bh"><h3>Giá bán</h3><small class="s">Đặt trong config.json · đổi giá cần sửa mã nguồn</small></div>
        <div class="srow"><div><b>Thiệp cưới</b><small>${s.promoEndsAt && s.listPrice > s.price ? `Giá mở bán đến hết ${ddmm(s.promoEndsAt)}` : 'Không có giá gạch'}</small></div><span class="v">${was(s.listPrice, s.price)}${money(s.price)}</span></div>
        <div class="srow"><div><b>Trọn bộ</b><small>Thiệp + màn LED + video</small></div><span class="v">${was(s.comboListPrice, s.comboPrice)}${money(s.comboPrice)}</span></div>
        <div class="srow"><div><b>Màn hình LED</b></div><span class="v">${money(s.ledPrice)}</span></div>
        <div class="srow"><div><b>Slide / màn hình dạm ngõ</b></div><span class="v">${money(s.videoPrice)}</span></div></div>
      <div class="box"><div class="bh"><h3>Dùng thử</h3><button class="btn sm plain" data-ed="trial">Sửa</button></div>
        <div class="srow"><div><b>Số ngày dùng thử</b><small>Tính từ lúc phát hành thiệp</small></div><span class="v">${s.trialDays} ngày</span></div>
        <div class="srow"><div><b>Khách có link riêng</b><small>Khi thiệp chưa kích hoạt</small></div><span class="v">${s.trialGuestLimit} khách</span></div></div>
      <div class="box"><div class="bh"><h3>Thương hiệu & hỗ trợ</h3><button class="btn sm plain" data-ed="brand">Sửa</button></div>
        <div class="srow"><div><b>${esc(s.brand)}</b><small>${esc(s.tagline)}</small></div></div>
        <div class="srow"><div><b>Zalo hỗ trợ</b></div><span class="v">${esc(s.support.zalo || '—')}</span></div>
        <div class="srow"><div><b>Email hỗ trợ</b></div><span class="v">${esc(s.support.email || '—')}</span></div></div>
      <div class="box"><div class="bh"><h3>Mã giảm giá</h3><button class="btn sm plain" data-go="discounts">Mở →</button></div></div>
      <div class="box"><div class="bh"><h3>Dữ liệu</h3></div>
        <div class="srow"><div><b>Bản sao lưu</b><small>Toàn bộ thiệp, đơn hàng, tài khoản, sổ tay và số liệu truy cập, dạng .json</small></div><a class="btn sm plain" href="/api/admin/export" download>Tải về</a></div>
        <div class="srow"><div><b>Đặt lại toàn bộ dữ liệu</b><small>Web như mới, chưa ai vào. Giữ cài đặt, mã giảm giá, nhật ký</small></div><button class="btn sm plain" id="sreset" style="color:var(--danger)">Đặt lại…</button></div></div>
    </div>`;
  $('#sreset').onclick = async () => {
    const r = await api('/api/admin/reset').catch(err); if (!r) return;
    const list = r.counts.filter((c) => c.n).map((c) => `${num(c.n)} ${c.name}`).join(', ') || 'chưa có dữ liệu nào';
    ask({
      title: 'Đặt lại toàn bộ dữ liệu?', danger: true, ok: 'Xoá tất cả dữ liệu', word: 'XOÁ',
      text: `Xoá vĩnh viễn: <b>${esc(list)}</b>, cùng số liệu truy cập. Mọi người bị đăng xuất, kể cả anh. <b>Không hoàn tác được.</b>`
        + (r.paid ? `<br><br>⚠ Trong đó có <b>${r.paid} đơn đã thanh toán</b>: doanh thu trên Tổng quan về 0.` : '')
        + '<br><br>Nên bấm <a href="/api/admin/export" download>Tải bản sao lưu</a> trước. Giữ lại: cài đặt, mã giảm giá, nhật ký quản trị.',
      run: async () => { await api('/api/admin/reset', { method: 'POST', body: { confirm: 'XOÁ' } }); toast('Đã đặt lại toàn bộ dữ liệu'); setTimeout(() => location.reload(), 1200); },
    });
  };
  const inp = (name, label, value, extra = '') => `<label class="fl">${label}<input name="${name}" value="${esc(value ?? '')}" ${extra}></label>`;
  const FORMS = {
    trial: ['Sửa dùng thử', `<div class="r2">${inp('trialDays', 'Số ngày dùng thử', s.trialDays, 'inputmode="numeric"')}${inp('trialGuestLimit', 'Khách có link riêng', s.trialGuestLimit, 'inputmode="numeric"')}</div>`],
    brand: ['Sửa thương hiệu & hỗ trợ', `${inp('brand', 'Tên thương hiệu', s.brand)}${inp('tagline', 'Khẩu hiệu', s.tagline)}<div class="r2">${inp('sup.zalo', 'Zalo hỗ trợ', s.support.zalo)}${inp('sup.email', 'Email hỗ trợ', s.support.email, 'type="email"')}</div>`],
  };
  $('#view').querySelectorAll('[data-ed]').forEach((b) => (b.onclick = () => {
    const [title, body] = FORMS[b.dataset.ed];
    modal({
      title, body, foot: '<button class="btn plain" data-close>Huỷ</button><button class="btn" id="ssave">Lưu</button>',
      onMount: (box, close) => {
        $('#ssave', box).onclick = async () => {
          const out = {};
          $$('input[name]', box).forEach((i) => { if (i.name.startsWith('sup.')) (out.support = out.support || {})[i.name.slice(4)] = i.value; else out[i.name] = i.value; });
          if (out.support) out.support = { ...s.support, ...out.support };
          try {
            const r = await api('/api/admin/settings', { method: 'PUT', body: out });
            close(); toast('Đã lưu'); settings();
          } catch (e) { err(e); }
        };
      },
    });
  }));
}

// ================= nhật ký =================
async function audit() {
  const { entries } = await api('/api/admin/audit');
  $('#view').innerHTML = `${page('Nhật ký', 'Mọi thao tác trong trang quản trị, mới nhất trước.')}
    <div class="box"><table class="tb"><tbody>${entries.length ? entries.map((a) => `<tr>
      <td><b>${esc(a.action)}</b><span class="s">${esc([a.target, a.detail].filter(Boolean).join(' · '))}</span></td>
      <td class="num"><span class="s" title="${fmtDateTime(a.at)}">${ago(a.at)}</span></td></tr>`).join('') : '<tr><td class="empty">Chưa có thao tác nào.</td></tr>'}</tbody></table></div>`;
}

// ================= điều hướng =================
const VIEWS = { home, orders, discounts, users, cards, traffic, settings, audit };
async function render() {
  closeMenu();
  try { await VIEWS[A.page](); } catch (e) {
    if (e.status === 403) return location.reload(); // phiên quản trị hết hạn → về màn đăng nhập
    $('#view').innerHTML = `<p class="empty">${esc(e.message)} · <a href="#" onclick="render();return false">Thử lại</a></p>`;
  }
}
// tải lại danh sách đang xem (sau khi sửa trong popup / bảng chi tiết)
function refresh() { (A.reload && A.page !== 'home' && A.page !== 'traffic' && A.page !== 'settings' ? A.reload() : render()).catch(err); api('/api/admin/orders?status=review').then((d) => badge(d.total)).catch(() => {}); }
function go(p) {
  if (!VIEWS[p]) p = 'home';
  A.page = p; A.reload = null;
  $$('.nv').forEach((b) => b.classList.toggle('on', b.dataset.p === p));
  $('#mtitle').textContent = TITLES[p];
  document.title = `${TITLES[p]} · Quản trị ${A.meta ? A.meta.brand : ''}`;
  $('#side').classList.remove('open');
  closeDrawer();
  if (location.hash.slice(1) !== p) history.replaceState(null, '', '#' + p);
  scrollTo(0, 0);
  $('#view').innerHTML = '<div class="skeleton" style="height:300px"></div>';
  render();
}
document.addEventListener('click', (e) => {
  const g = e.target.closest('[data-go]');
  if (g && !e.target.closest('[data-k]')) { e.preventDefault(); return go(g.dataset.go); }
  const side = $('#side');
  if (side && side.classList.contains('open') && !e.target.closest('#side') && !e.target.closest('#menuBtn')) side.classList.remove('open');
});

// ================= đăng nhập =================
function loginForm(msg) {
  $('#gate').innerHTML = `<form class="box alogin" id="alogin">
    <h1>Quản trị</h1><p class="muted">Nhập mật khẩu quản trị để tiếp tục.</p>
    ${msg ? `<p class="err">${esc(msg)}</p>` : ''}
    <input class="input" type="password" id="apw" autocomplete="current-password" placeholder="Mật khẩu" required autofocus>
    <button class="btn block" type="submit">Vào trang quản trị</button></form>`;
  $('#alogin').onsubmit = async (e) => {
    e.preventDefault();
    const btn = $('#alogin button'); btn.disabled = true;
    try { await api('/api/admin/login', { method: 'POST', body: { password: $('#apw').value }, allow401: true }); location.reload(); } catch (er) { loginForm(er.message); }
  };
}

(async () => {
  let meta;
  try { meta = await fetch('/api/meta').then((r) => r.json()); } catch (e) { $('#gate').innerHTML = '<div class="pageload bad">Mạng chập chờn, chưa mở được trang quản trị. <a class="btn" href="/admin">Tải lại</a></div>'; return; }
  A.meta = window.META = meta;
  document.title = 'Quản trị — ' + meta.brand;
  const s = await fetch('/api/admin/session').then((r) => r.json());
  if (!s.admin && s.byEmail) {
    // quản trị theo tài khoản Google được chỉ định: không có ô mật khẩu
    $('#gate').innerHTML = `<div class="box alogin"><h1>Quản trị</h1>
      <p class="muted">${s.email ? `Tài khoản <b>${esc(s.email)}</b> không có quyền vào trang này, hoặc phiên chưa đăng nhập bằng Google.` : 'Trang này chỉ dành cho chủ web.'} Đăng nhập bằng tài khoản Google được cấp quyền để tiếp tục.</p>
      <a class="btn block" href="/auth/google?next=%2Fadmin">Đăng nhập bằng Google</a></div>`;
    return;
  }
  if (!s.admin) return loginForm(s.enabled ? '' : 'Máy chủ chưa đặt mật khẩu quản trị (biến môi trường ADMIN_PASSWORD).');
  $('#gate').remove();
  $('#app').hidden = false;
  $('#brandName').textContent = $('#mBrand').textContent = meta.brand;
  $('#meName').textContent = s.byEmail ? s.email : 'Quản trị viên';
  $('#meAv').textContent = (s.byEmail ? s.email : 'Q')[0].toUpperCase();
  $('#tbtn').innerHTML = window.themeBtn ? themeBtn() : '';
  $('#alogout').onclick = async (e) => { e.preventDefault(); await api(s.byEmail ? '/api/auth/logout' : '/api/admin/logout', { method: 'POST' }); location.reload(); };
  $('#menuBtn').onclick = () => $('#side').classList.add('open');
  $$('.nv').forEach((b) => (b.onclick = () => go(b.dataset.p)));
  addEventListener('hashchange', () => { const h = location.hash.slice(1); if (h !== A.page && VIEWS[h]) go(h); });
  go(VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'home');
  if (A.page !== 'home' && A.page !== 'orders') api('/api/admin/orders?status=review').then((d) => badge(d.total)).catch(() => {});
})();
