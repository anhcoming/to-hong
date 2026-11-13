// Trang quản trị: tổng quan, đơn hàng, người dùng, thiệp & sản phẩm, cài đặt, nhật ký.
const A = { tab: 'home', me: null, meta: null, f: {} };
const PROD = { card: 'Thiệp', combo: 'Trọn bộ', led: 'Màn LED', video: 'Video' };
const ago = (t) => {
  if (!t) return '—';
  const m = Math.round((Date.now() - t) / 6e4);
  if (m < 1) return 'vừa xong';
  if (m < 60) return m + ' phút trước';
  if (m < 1440) return Math.round(m / 60) + ' giờ trước';
  return Math.round(m / 1440) + ' ngày trước';
};
const st = (s) => s && s.created ? (s.paid ? '<span class="chip ok">Đã kích hoạt</span>' : s.expired ? '<span class="chip red">Hết dùng thử</span>' : '<span class="chip warn">Dùng thử</span>') : '<span class="muted">—</span>';
const qs = (o) => new URLSearchParams(Object.entries(o).filter(([, v]) => v)).toString();

// ---------- biểu đồ cột SVG ----------
function bars(series, key, fmt) {
  const W = 600, H = 150, n = series.length, max = Math.max(1, ...series.map((s) => s[key]));
  const bw = W / n;
  return `<svg viewBox="0 0 ${W} ${H + 18}" preserveAspectRatio="none" role="img">
    ${series.map((s, i) => {
      const h = (s[key] / max) * (H - 6);
      return `<rect class="bar" x="${i * bw + 1}" y="${H - h}" width="${Math.max(1, bw - 2)}" height="${h}" rx="2"><title>${s.day}: ${fmt(s[key])}</title></rect>`;
    }).join('')}
    <line x1="0" y1="${H}" x2="${W}" y2="${H}" stroke="currentColor" opacity=".15"/>
    ${series.map((s, i) => (i % Math.ceil(n / 8) === 0 ? `<text class="lbl" x="${i * bw + bw / 2}" y="${H + 14}" text-anchor="middle">${s.day}</text>` : '')).join('')}
  </svg>`;
}

// ---------- tổng quan ----------
async function home() {
  const d = await api('/api/admin/stats?days=30');
  const t = d.totals;
  const sum = (k) => d.series.reduce((n, s) => n + s[k], 0);
  $('#view').innerHTML = `
    <div class="kpis">
      <div class="kpi panel"><span>Doanh thu</span><b>${money(t.revenue)}</b><small>7 ngày: ${money(t.revenueWeek)}</small></div>
      <div class="kpi panel ${t.claimed ? 'hot' : ''}"><span>Đơn chờ xác nhận</span><b>${t.pending}</b><small>${t.claimed} khách báo đã chuyển</small></div>
      <div class="kpi panel"><span>Người dùng</span><b>${t.users}</b><small>+${t.usersWeek} tuần này · ${t.activeWeek} hoạt động</small></div>
      <div class="kpi panel"><span>Sổ tay cưới</span><b>${t.weddings}</b><small>${t.guests} khách mời đã nhập</small></div>
      <div class="kpi panel"><span>Thiệp</span><b>${t.cards}</b><small>${t.published} đã phát hành</small></div>
      <div class="kpi panel"><span>Tỉ lệ thiệp trả phí</span><b>${t.conversion}%</b><small>${t.paidOrders} đơn đã thanh toán</small></div>
    </div>
    <div class="charts">
      <div class="chart panel"><h3>Doanh thu 30 ngày</h3><p>${money(sum('revenue'))} · ${sum('orders')} đơn</p>${bars(d.series, 'revenue', money)}</div>
      <div class="chart panel"><h3>Đăng ký mới 30 ngày</h3><p>${sum('signups')} người dùng</p>${bars(d.series, 'signups', (v) => v + ' người')}</div>
      <div class="chart panel"><h3>Thiệp tạo mới 30 ngày</h3><p>${sum('cards')} thiệp</p>${bars(d.series, 'cards', (v) => v + ' thiệp')}</div>
      <div class="chart panel"><h3>Doanh thu theo sản phẩm</h3><p>Từ trước tới nay</p>
        ${Object.values(d.byProduct).map((p) => `<div class="prodrow"><span>${esc(p.name)} <span class="muted">· ${p.count} đơn</span></span><b>${money(p.revenue)}</b></div>`).join('')}
      </div>
    </div>`;
  badge(t.pending);
}
// ---------- truy cập ----------
// Số liệu do các trang giới thiệu gửi về (site.js) và lượt mở trang xem thử; "khách" = trình duyệt ghé lần đầu trong ngày.
async function traffic() {
  const days = A.f.tdays || 30;
  const d = await api('/api/admin/traffic?days=' + days);
  const t = d.totals, f = d.funnel, y = d.yesterday || { visitors: 0, pv: 0 };
  const num = (n) => Number(n || 0).toLocaleString('vi-VN');
  const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 + '%' : '—');
  const KIND = { thiep: 'Thiệp', video: 'Video', led: 'Màn LED' };
  const rank = (title, sub, list, unit) => {
    const max = Math.max(1, ...list.map((x) => x.n));
    return `<div class="chart panel"><h3>${title}</h3><p>${sub}</p>${list.length ? `<table class="tbl rank"><tbody>${list.slice(0, 10).map((x) =>
      `<tr><td>${esc(x.key)}<span class="meter" style="width:${(x.n / max) * 100}%"></span></td><td><b>${num(x.n)}</b> ${unit}</td></tr>`).join('')}</tbody></table>` : '<p class="empty">Chưa có số liệu.</p>'}</div>`;
  };
  const steps = [['Khách ghé web', f.visitors], ['Mở xem thử mẫu', f.views], ['Bấm "Dùng mẫu"', f.uses], ['Tạo thiệp', f.cards], ['Đăng ký tài khoản', f.signups], ['Phát hành thiệp', f.published], ['Thanh toán', f.paid]];
  const fmax = Math.max(1, ...steps.map((x) => x[1]));
  const tmax = Math.max(1, ...d.templates.map((x) => x.views));
  $('#view').innerHTML = `
    <div class="tools"><select class="input" id="tdays">${[7, 30, 90].map((n) => `<option value="${n}" ${n === days ? 'selected' : ''}>${n} ngày gần đây</option>`).join('')}</select>
      <span class="muted" style="font-size:13px">Tính từ lúc bật thống kê. Không tính bot và ảnh xem trước nhúng ở trang chủ.</span></div>
    <div class="kpis">
      <div class="kpi panel"><span>Khách hôm nay</span><b>${num(d.today.visitors)}</b><small>Hôm qua: ${num(y.visitors)}</small></div>
      <div class="kpi panel"><span>Lượt xem trang hôm nay</span><b>${num(d.today.pv)}</b><small>Hôm qua: ${num(y.pv)}</small></div>
      <div class="kpi panel"><span>Khách ${days} ngày</span><b>${num(t.visitors)}</b><small>${num(t.fresh)} người ghé lần đầu</small></div>
      <div class="kpi panel"><span>Lượt xem trang ${days} ngày</span><b>${num(t.pv)}</b><small>${t.visitors ? (t.pv / t.visitors).toFixed(1) : '—'} trang mỗi khách</small></div>
      <div class="kpi panel"><span>Khách → tạo thiệp</span><b>${pct(f.cards, f.visitors)}</b><small>${num(f.cards)} thiệp, ${num(f.drafts)} còn là nháp chưa đăng nhập</small></div>
      <div class="kpi panel"><span>Khách → thanh toán</span><b>${pct(f.paid, f.visitors)}</b><small>${num(f.paid)} đơn · ${money(f.revenue)}</small></div>
    </div>
    <div class="charts">
      <div class="chart panel"><h3>Khách ghé mỗi ngày</h3><p>${num(t.visitors)} khách trong ${days} ngày</p>${bars(d.series, 'visitors', (v) => v + ' khách')}</div>
      <div class="chart panel"><h3>Lượt xem trang mỗi ngày</h3><p>${num(t.pv)} lượt</p>${bars(d.series, 'pv', (v) => v + ' lượt')}</div>
    </div>
    <div class="chart panel" style="margin-bottom:14px"><h3>Phễu ${days} ngày</h3><p>Từ lúc ghé web tới lúc trả tiền — phần trăm so với bước ngay trước.</p>
      <div class="funnel">${steps.map((x, i) => `<div class="frow"><span>${x[0]}</span><i style="width:${(x[1] / fmax) * 100}%"></i><b>${num(x[1])}${i ? `<small>${pct(x[1], steps[i - 1][1])}</small>` : ''}</b></div>`).join('')}</div>
    </div>
    <div class="chart panel" style="margin-bottom:14px"><h3>Mẫu nào được bấm vào</h3><p>Lượt mở trang xem thử và lượt bấm "Dùng mẫu" của từng mẫu.</p>
      ${d.templates.length ? `<div class="wrapx"><table class="tbl rank"><thead><tr><th>Mẫu</th><th>Loại</th><th>Xem thử</th><th>Dùng mẫu</th><th>Tỉ lệ dùng</th></tr></thead><tbody>
        ${d.templates.slice(0, 40).map((x) => `<tr><td><b>${esc(x.name)}</b><span class="meter" style="width:${(x.views / tmax) * 100}%"></span></td><td>${KIND[x.kind] || ''}</td><td>${num(x.views)}</td><td>${num(x.uses)}</td><td>${pct(x.uses, x.views)}</td></tr>`).join('')}
      </tbody></table></div>` : '<p class="empty">Chưa có ai mở mẫu nào từ lúc bật thống kê.</p>'}
    </div>
    <div class="charts">
      ${rank('Khách tới từ đâu', 'Nguồn của lượt ghé đầu tiên trong ngày', d.refs, 'khách')}
      ${rank('Trang được xem', 'Lượt xem theo trang', d.pages, 'lượt')}
      ${rank('Thiết bị', 'Điện thoại hay máy tính', d.devices, 'khách')}
    </div>`;
  $('#tdays').onchange = (e) => { A.f.tdays = +e.target.value; render(); };
}

function badge(n) { $('#pendBadge').innerHTML = n ? `<span class="chip warn" style="margin-left:4px">${n}</span>` : ''; }

// ---------- đơn hàng ----------
async function orders() {
  const f = A.f.orders || (A.f.orders = { status: 'pending', product: '', q: '' });
  const d = await api('/api/admin/orders?' + qs(f));
  const stChip = (o) => (o.status === 'paid' ? `<span class="chip ok">Đã thanh toán${o.paidVia === 'sepay' ? ' · tự động' : ''}</span>`
    : o.status === 'cancelled' ? '<span class="chip">Đã huỷ</span>'
    : o.claimedAt ? `<span class="chip warn">Khách báo đã chuyển · ${ago(o.claimedAt)}</span>` : '<span class="chip">Chờ thanh toán</span>')
    + (o.bankNote ? `<div class="sub" style="color:var(--danger,#c0392b)">🏦 ${esc(o.bankNote)}</div>` : '');
  $('#view').innerHTML = `
    <div class="tools">
      <input class="input" id="fq" placeholder="Tìm mã đơn, email, tên đôi…" value="${esc(f.q)}">
      <select class="input" id="fst"><option value="">Mọi trạng thái</option><option value="pending" ${f.status === 'pending' ? 'selected' : ''}>Chờ thanh toán</option><option value="paid" ${f.status === 'paid' ? 'selected' : ''}>Đã thanh toán</option><option value="cancelled" ${f.status === 'cancelled' ? 'selected' : ''}>Đã huỷ</option></select>
      <select class="input" id="fpr"><option value="">Mọi sản phẩm</option>${Object.entries(PROD).map(([k, v]) => `<option value="${k}" ${f.product === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <span class="muted" style="font-size:13px">${d.total} đơn</span>
    </div>
    <p class="muted" style="font-size:13px;margin:0 0 10px">Đơn chuyển khoản đúng mã, đủ tiền được SePay kích hoạt tự động. Đơn còn ở đây (thiếu tiền, ghi sai nội dung…) thì đối chiếu app ngân hàng rồi bấm <b>Xác nhận</b>.</p>
    <div class="panel wrapx">${d.orders.length ? `<table class="tbl"><thead><tr><th>Mã</th><th>Sản phẩm</th><th>Khách</th><th>Số tiền</th><th>Trạng thái</th><th></th></tr></thead><tbody>
      ${d.orders.map((o) => `<tr data-id="${o.id}">
        <td><b>${esc(o.code)}</b><div class="sub">${fmtDateTime(o.createdAt)}</div></td>
        <td>${esc(PROD[o.product] || o.product)}<div class="sub">${esc(o.card ? o.card.names || o.card.title : '(đã xoá)')}</div></td>
        <td>${esc(o.email)}${o.note ? `<div class="sub">📝 ${esc(o.note)}</div>` : ''}</td>
        <td>${money(o.amount)}${o.coupon ? `<div class="sub">mã ${esc(o.coupon)}</div>` : ''}</td>
        <td>${stChip(o)}</td>
        <td><div class="acts">
          ${o.status === 'pending' ? `<button class="btn sm" data-a="ok" data-code="${esc(o.code)}" data-amt="${o.amount}">Xác nhận</button><button class="btn sm plain" data-a="cancel">Huỷ</button>` : ''}
          <button class="btn sm plain" data-a="note" data-note="${esc(o.note)}">Ghi chú</button>
        </div></td></tr>`).join('')}</tbody></table>` : '<p class="empty">Không có đơn nào.</p>'}</div>`;
  bindFilters('orders', { fq: 'q', fst: 'status', fpr: 'product' });
  $('#view').onclick = async (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const id = b.closest('tr').dataset.id;
    try {
      if (b.dataset.a === 'ok') {
        if (!confirm(`Xác nhận đã nhận ${money(b.dataset.amt)} với nội dung ${b.dataset.code}?`)) return;
        await api(`/api/admin/orders/${id}/confirm`, { method: 'POST' }); toast('Đã kích hoạt');
      } else if (b.dataset.a === 'cancel') {
        if (!confirm('Huỷ đơn này? Khách vẫn có thể tạo đơn mới.')) return;
        await api(`/api/admin/orders/${id}/cancel`, { method: 'POST' }); toast('Đã huỷ đơn');
      } else if (b.dataset.a === 'note') {
        const note = prompt('Ghi chú cho đơn (ví dụ: đã gọi khách, chuyển thiếu…)', b.dataset.note || '');
        if (note === null) return;
        await api(`/api/admin/orders/${id}`, { method: 'PUT', body: { note } });
      }
      orders();
    } catch (err) { toast(err.message, true); }
  };
}

// ---------- người dùng ----------
async function users() {
  const f = A.f.users || (A.f.users = { q: '', filter: '' });
  const d = await api('/api/admin/users?' + qs(f));
  $('#view').innerHTML = `
    <div class="tools">
      <input class="input" id="fq" placeholder="Tìm email hoặc tên…" value="${esc(f.q)}">
      <select class="input" id="ffl"><option value="">Tất cả</option><option value="paying" ${f.filter === 'paying' ? 'selected' : ''}>Đã trả tiền</option><option value="disabled" ${f.filter === 'disabled' ? 'selected' : ''}>Đang bị khoá</option></select>
      <span class="muted" style="font-size:13px">${d.users.length}/${d.total} người</span>
    </div>
    <div class="panel wrapx">${d.users.length ? `<table class="tbl"><thead><tr><th>Người dùng</th><th>Đăng nhập</th><th>Thiệp</th><th>Đã chi</th><th>Hoạt động</th><th></th></tr></thead><tbody>
      ${d.users.map((u) => `<tr data-id="${u.id}" data-email="${esc(u.email)}" class="${u.disabled ? 'off' : ''}">
        <td><b>${esc(u.name || '')}</b> ${u.disabled ? '<span class="chip">Đã khoá</span>' : ''}<div class="sub">${esc(u.email)}</div></td>
        <td>${u.google ? 'Google' : ''}${u.google && u.hasPassword ? ' + ' : ''}${u.hasPassword ? 'Mật khẩu' : ''}<div class="sub">tham gia ${fmtDate(u.createdAt)}</div></td>
        <td>${u.cards}</td>
        <td>${u.spent ? money(u.spent) : '—'}${u.orders ? `<div class="sub">${u.orders} đơn</div>` : ''}</td>
        <td>${ago(u.lastSeenAt)}</td>
        <td><div class="acts">
          <button class="btn sm plain" data-a="lock">${u.disabled ? 'Mở khoá' : 'Khoá'}</button>
          <button class="btn sm plain" data-a="pw">Đặt lại mật khẩu</button>
        </div></td></tr>`).join('')}</tbody></table>` : '<p class="empty">Không có người dùng khớp.</p>'}</div>`;
  bindFilters('users', { fq: 'q', ffl: 'filter' });
  $('#view').onclick = async (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const tr = b.closest('tr');
    const u = d.users.find((x) => x.id === tr.dataset.id);
    try {
      if (b.dataset.a === 'lock') {
        if (!confirm(u.disabled ? `Mở khoá ${u.email}?` : `Khoá ${u.email}? Người này bị đăng xuất ngay và không đăng nhập được nữa. Thiệp đã gửi vẫn mở được.`)) return;
        await api(`/api/admin/users/${u.id}`, { method: 'PUT', body: { disabled: !u.disabled } });
      } else if (b.dataset.a === 'pw') {
        if (!confirm(`Tạo mật khẩu tạm mới cho ${u.email}? Mật khẩu cũ hết hiệu lực và người này bị đăng xuất.`)) return;
        const r = await api(`/api/admin/users/${u.id}/password`, { method: 'POST' });
        openModal(`<h2>Mật khẩu tạm</h2><p class="muted">Gửi mật khẩu này cho <b>${esc(u.email)}</b> qua kênh riêng (Zalo, điện thoại). Nó chỉ hiện một lần.</p>
          <div class="pw">${esc(r.password)}</div><button class="btn block" id="cpw">Sao chép</button>`, (box) => { $('#cpw', box).onclick = () => copyText(r.password, 'Đã sao chép mật khẩu tạm'); });
        return;
      }
      toast('Đã cập nhật');
      users();
    } catch (err) { toast(err.message, true); }
  };
}

// ---------- thiệp & sản phẩm ----------
async function cards() {
  const f = A.f.cards || (A.f.cards = { q: '', filter: '' });
  const d = await api('/api/admin/cards?' + qs(f));
  $('#view').innerHTML = `
    <div class="tools">
      <input class="input" id="fq" placeholder="Tìm tên đôi, đường dẫn, email chủ…" value="${esc(f.q)}">
      <select class="input" id="ffl"><option value="">Tất cả</option><option value="published" ${f.filter === 'published' ? 'selected' : ''}>Đã phát hành</option><option value="trial" ${f.filter === 'trial' ? 'selected' : ''}>Đang dùng thử</option><option value="paid" ${f.filter === 'paid' ? 'selected' : ''}>Có sản phẩm trả phí</option><option value="blocked" ${f.filter === 'blocked' ? 'selected' : ''}>Đã gỡ</option></select>
      <span class="muted" style="font-size:13px">${d.cards.length}/${d.total} thiệp</span>
    </div>
    <div class="panel wrapx">${d.cards.length ? `<table class="tbl"><thead><tr><th>Thiệp</th><th>Chủ</th><th>Thiệp</th><th>Màn LED</th><th>Video</th><th>Số liệu</th><th></th></tr></thead><tbody>
      ${d.cards.map((c) => `<tr data-id="${c.id}" class="${c.blocked ? 'off' : ''}">
        <td><b>${esc(c.names || c.title)}</b> ${c.blocked ? '<span class="chip red">Đã gỡ</span>' : ''}<div class="sub">/t/${esc(c.slug)} · ${c.status === 'published' ? 'đã phát hành' : 'nháp'} · sửa ${ago(c.updatedAt)}</div></td>
        <td>${esc(c.ownerEmail)}</td>
        <td>${c.paid ? '<span class="chip ok">Đã kích hoạt</span>' : c.status === 'published' ? (c.expired ? '<span class="chip red">Hết dùng thử</span>' : '<span class="chip warn">Dùng thử</span>') : '<span class="muted">nháp</span>'}</td>
        <td>${st(c.led)}</td>
        <td>${st(c.video)}</td>
        <td><span class="sub">👁 ${c.views} · ✉ ${c.guests} · ✓ ${c.rsvpYes}</span></td>
        <td><div class="acts">
          <a class="btn sm plain" target="_blank" href="/t/${esc(c.slug)}?preview=1">Xem</a>
          <button class="btn sm plain" data-a="prod">Kích hoạt tay</button>
          <button class="btn sm ${c.blocked ? 'plain' : 'danger'}" data-a="block">${c.blocked ? 'Khôi phục' : 'Gỡ'}</button>
        </div></td></tr>`).join('')}</tbody></table>` : '<p class="empty">Không có thiệp khớp.</p>'}</div>
    <p class="muted" style="font-size:12px;margin-top:8px">"Xem" mở bản xem trước (kể cả thiệp nháp hoặc đã gỡ) và không tính vào lượt xem của khách.</p>`;
  bindFilters('cards', { fq: 'q', ffl: 'filter' });
  $('#view').onclick = async (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const c = d.cards.find((x) => x.id === b.closest('tr').dataset.id);
    try {
      if (b.dataset.a === 'block') {
        if (c.blocked) {
          if (!confirm('Khôi phục thiệp này? Khách mời mở lại được ngay.')) return;
          await api(`/api/admin/cards/${c.id}/block`, { method: 'POST', body: { blocked: false } });
        } else {
          const reason = prompt(`Gỡ thiệp "${c.names || c.title}"? Khách mời mở link sẽ thấy thông báo tạm không khả dụng.\nLý do (ghi vào nhật ký):`, '');
          if (reason === null) return;
          await api(`/api/admin/cards/${c.id}/block`, { method: 'POST', body: { blocked: true, reason } });
        }
        toast('Đã cập nhật'); cards();
      } else if (b.dataset.a === 'prod') prodModal(c);
    } catch (err) { toast(err.message, true); }
  };
}
function prodModal(c) {
  const row = (k, name, s, created) => `<div class="prodrow"><span><b>${name}</b><br>${created ? (s.paid ? '<span class="chip ok">Đã kích hoạt</span>' : '<span class="chip warn">Chưa kích hoạt</span>') : '<span class="muted" style="font-size:13px">Khách chưa tạo</span>'}</span>
    ${created ? `<button class="btn sm ${s.paid ? 'danger' : ''}" data-p="${k}" data-v="${s.paid ? 0 : 1}">${s.paid ? 'Huỷ kích hoạt' : 'Kích hoạt'}</button>` : ''}</div>`;
  openModal(`<h2>Kích hoạt tay</h2><p class="muted" style="margin:0 0 10px">${esc(c.names || c.title)} · ${esc(c.ownerEmail)}<br>Dùng khi tặng khách, sửa sai hoặc đã hoàn tiền. Mọi thao tác được ghi nhật ký.</p>
    ${row('card', 'Thiệp cưới', { paid: c.paid }, true)}${row('led', 'Màn hình LED', c.led, c.led.created)}${row('video', 'Video cưới', c.video, c.video.created)}`,
  (box, close) => {
    box.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-p]');
      if (!b) return;
      const on = b.dataset.v === '1';
      const reason = prompt(on ? 'Lý do kích hoạt (ví dụ: tặng khách, đã nhận tiền mặt):' : 'Lý do huỷ kích hoạt (ví dụ: đã hoàn tiền):', '');
      if (reason === null) return;
      try { await api(`/api/admin/cards/${c.id}/product`, { method: 'POST', body: { product: b.dataset.p, paid: on, reason } }); close(); toast('Đã cập nhật'); cards(); }
      catch (err) { toast(err.message, true); }
    });
  });
}

// ---------- cài đặt ----------
async function settings() {
  const { settings: s } = await api('/api/admin/settings');
  const coupons = Object.entries(s.coupons || {});
  const couponRow = (c = '', v = '') => `<div class="coupon"><input class="input" data-cc value="${esc(c)}" placeholder="MÃ" style="text-transform:uppercase"><input class="input" data-cv inputmode="numeric" value="${v}" placeholder="Số tiền giảm"><button class="btn sm danger" data-rm type="button">×</button></div>`;
  $('#view').innerHTML = `<form id="sf">
    <div class="setgrid">
      <section class="panel" style="padding:18px"><h3 style="margin-top:0">Giá bán (đồng)</h3>
        <div class="grid2"><label class="field"><span>Thiệp cưới — giá đang bán</span><input name="price" inputmode="numeric" value="${s.price}"></label>
        <label class="field"><span>Giá gốc (gạch ngang)</span><input name="listPrice" inputmode="numeric" value="${s.listPrice || ''}" placeholder="Bỏ trống = không giảm giá"></label></div>
        <label class="field"><span>Giá mở bán đến hết ngày</span><input name="promoEndsAt" type="date" value="${esc(s.promoEndsAt || '')}"><small>Qua ngày này web tự thu theo giá gốc. Bỏ trống = không có hạn, không hiện giá gạch.</small></label>
        <label class="field"><span>Màn hình LED</span><input name="ledPrice" inputmode="numeric" value="${s.ledPrice}"></label>
        <label class="field"><span>Video cưới</span><input name="videoPrice" inputmode="numeric" value="${s.videoPrice}"></label>
        <div class="grid2"><label class="field"><span>Trọn bộ (thiệp + LED + video)</span><input name="comboPrice" inputmode="numeric" value="${s.comboPrice || ''}"></label>
        <label class="field"><span>Trọn bộ — giá gốc (gạch ngang)</span><input name="comboListPrice" inputmode="numeric" value="${s.comboListPrice || ''}"></label></div>
        <div class="grid2"><label class="field"><span>Số ngày dùng thử</span><input name="trialDays" inputmode="numeric" value="${s.trialDays}"></label>
        <label class="field"><span>Khách có link riêng (dùng thử)</span><input name="trialGuestLimit" inputmode="numeric" value="${s.trialGuestLimit}"></label></div>
        <p class="muted" style="font-size:12px;margin:0">Giá mới áp dụng cho đơn tạo từ bây giờ; đơn đang chờ giữ giá cũ.</p>
      </section>
      <section class="panel" style="padding:18px"><h3 style="margin-top:0">Mã giảm giá <small class="muted" style="font-weight:400">(chỉ áp dụng cho thiệp)</small></h3>
        <div id="cps">${coupons.map(([c, v]) => couponRow(c, v)).join('') || ''}</div>
        <button class="btn sm soft" type="button" id="addCp">+ Thêm mã</button>
      </section>
      <section class="panel" style="padding:18px"><h3 style="margin-top:0">Thương hiệu & hỗ trợ</h3>
        <label class="field"><span>Tên thương hiệu</span><input name="brand" value="${esc(s.brand)}"></label>
        <label class="field"><span>Khẩu hiệu</span><input name="tagline" value="${esc(s.tagline)}"></label>
        <div class="grid2"><label class="field"><span>Zalo hỗ trợ</span><input name="sup.zalo" value="${esc(s.support.zalo)}"></label>
        <label class="field"><span>Email hỗ trợ</span><input name="sup.email" value="${esc(s.support.email)}"></label></div>
      </section>
    </div>
    <div style="position:sticky;bottom:0;padding:14px 0;background:var(--bg);margin-top:8px"><button class="btn lg">Lưu cài đặt</button></div>
  </form>`;
  $('#addCp').onclick = () => $('#cps').insertAdjacentHTML('beforeend', couponRow());
  $('#cps').onclick = (e) => { if (e.target.dataset.rm !== undefined) e.target.closest('.coupon').remove(); };
  $('#sf').onsubmit = async (e) => {
    e.preventDefault();
    const v = (n) => e.target.elements[n].value;
    const coupons = {};
    $$('.coupon').forEach((r) => { const c = $('[data-cc]', r).value.trim(); if (c) coupons[c] = $('[data-cv]', r).value; });
    try {
      await api('/api/admin/settings', { method: 'PUT', body: {
        price: v('price'), listPrice: v('listPrice'), promoEndsAt: v('promoEndsAt'), ledPrice: v('ledPrice'), videoPrice: v('videoPrice'), comboPrice: v('comboPrice'), comboListPrice: v('comboListPrice'), trialDays: v('trialDays'), trialGuestLimit: v('trialGuestLimit'),
        coupons, brand: v('brand'), tagline: v('tagline'),
        support: { zalo: v('sup.zalo'), email: v('sup.email') },
      } });
      toast('Đã lưu — áp dụng ngay, không cần khởi động lại');
      settings();
    } catch (err) { toast(err.message, true); }
  };
}

// ---------- nhật ký ----------
async function audit() {
  const { entries } = await api('/api/admin/audit');
  $('#view').innerHTML = `<div class="panel wrapx">${entries.length ? `<table class="tbl"><thead><tr><th>Lúc</th><th>Người làm</th><th>Thao tác</th><th>Đối tượng</th><th>Chi tiết</th></tr></thead><tbody>
    ${entries.map((a) => `<tr><td>${fmtDateTime(a.at)}</td><td>${esc(a.byEmail)}</td><td><b>${esc(a.action)}</b></td><td>${esc(a.target)}</td><td class="muted">${esc(a.detail)}</td></tr>`).join('')}
  </tbody></table>` : '<p class="empty">Chưa có thao tác nào.</p>'}</div>`;
}

// ---------- chung ----------
function bindFilters(key, map) {
  let t;
  for (const [id, field] of Object.entries(map)) {
    const el = $('#' + id);
    el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
      A.f[key][field] = el.value;
      clearTimeout(t);
      t = setTimeout(() => { const pos = el.selectionStart; render().then(() => { const n = $('#' + id); if (n && n.tagName === 'INPUT') { n.focus(); n.setSelectionRange(pos, pos); } }); }, el.tagName === 'SELECT' ? 0 : 300);
    });
  }
}
const VIEWS = { home, traffic, orders, users, cards, settings, audit };
async function render() {
  $$('#tabs .tab').forEach((b) => b.classList.toggle('on', b.dataset.t === A.tab));
  $('#view').onclick = null;
  try { await VIEWS[A.tab](); } catch (e) {
    if (e.status === 403 && !$('#alogout').textContent.includes('quản trị')) return location.reload(); // quản trị theo tài khoản Google: về màn đăng nhập
    if (e.status === 403) return loginForm('Phiên quản trị đã hết, nhập lại mật khẩu nhé.');
    $('#view').innerHTML = `<p class="empty">${esc(e.message)}</p>`;
  }
}

// Vào trang quản trị bằng mật khẩu riêng (không dùng tài khoản người dùng)
function loginForm(msg) {
  $('main').innerHTML = `<form class="panel alogin" id="alogin">
    <h1>Quản trị</h1><p class="muted">Nhập mật khẩu quản trị để tiếp tục.</p>
    ${msg ? `<p class="err">${esc(msg)}</p>` : ''}
    <input class="input" type="password" id="apw" autocomplete="current-password" placeholder="Mật khẩu" required autofocus>
    <button class="btn block" type="submit">Vào trang quản trị</button></form>`;
  $('#alogin').onsubmit = async (e) => {
    e.preventDefault();
    const btn = $('#alogin button'); btn.disabled = true;
    try { await api('/api/admin/login', { method: 'POST', body: { password: $('#apw').value }, allow401: true }); location.reload(); } catch (err) { loginForm(err.message); }
  };
}

(async () => {
  const meta = await fetch('/api/meta').then((r) => r.json());
  A.meta = window.META = meta;
  document.title = 'Quản trị — ' + meta.brand;
  const s = await fetch('/api/admin/session').then((r) => r.json());
  if (!s.admin && s.byEmail) {
    // quản trị theo tài khoản Google được chỉ định: không có ô mật khẩu
    $('main').innerHTML = `<div class="panel alogin"><h1>Quản trị</h1>
      <p class="muted">${s.email ? `Tài khoản <b>${esc(s.email)}</b> không có quyền vào trang này, hoặc phiên chưa đăng nhập bằng Google.` : 'Trang này chỉ dành cho chủ web.'} Đăng nhập bằng tài khoản Google được cấp quyền để tiếp tục.</p>
      <a class="btn block" href="/auth/google?next=%2Fadmin">Đăng nhập bằng Google</a></div>`;
    return;
  }
  if (!s.admin) return loginForm(s.enabled ? '' : 'Máy chủ chưa đặt mật khẩu quản trị (biến môi trường ADMIN_PASSWORD).');
  $('#hello').innerHTML = `${esc(meta.brand)}${s.byEmail ? ' · ' + esc(s.email) : ''} · <a href="#" id="alogout">${s.byEmail ? 'Đăng xuất' : 'Đăng xuất quản trị'}</a>`;
  $('#alogout').onclick = async (e) => { e.preventDefault(); await api(s.byEmail ? '/api/auth/logout' : '/api/admin/logout', { method: 'POST' }); location.reload(); };
  const h = location.hash.slice(1);
  if (VIEWS[h]) A.tab = h;
  $('#tabs').onclick = (e) => { const b = e.target.closest('.tab'); if (b) { A.tab = b.dataset.t; history.replaceState(null, '', '#' + A.tab); render(); } };
  $('#reload').onclick = render;
  render();
  if (A.tab !== 'home') api('/api/admin/stats?days=7').then((d) => badge(d.totals.pending)).catch(() => {});
})();
