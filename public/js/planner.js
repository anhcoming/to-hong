// Sổ tay cưới: tổng quan, việc cần làm, ngân sách, khách mời, lịch âm.
const S = { ov: null, tasks: [], budget: null, guests: null, tab: 'home', filter: 'todo', cal: null, sel: null, gq: '', gside: '', grs: '', ev: '', tq: '', tsel: null, bopen: null };
const EVENTS = ['damngo', 'anhoi', 'cuoi', 'sau'];
const EV_ICON = { damngo: '🤝', anhoi: '🎁', cuoi: '💍', sau: '🏡' };
const evName = (e) => S.ov.wedding.eventNames[e] || e;
const evDate = (e) => { const w = S.ov.wedding; return e === 'damngo' ? w.damngo : e === 'anhoi' ? w.anhoi : w.date; };
const evField = (e) => (e === 'damngo' ? 'damngo' : e === 'anhoi' ? 'anhoi' : 'date');
const CTA = {
  card: ['Làm thiệp online', 'sua'], led: ['Tạo màn LED', 'sua-led'], video: ['Làm video', 'sua-video'],
  guests: ['Mở danh sách khách', 'tab:guests'], budget: ['Mở ngân sách', 'tab:budget'],
};

const pmoney = (v) => Math.max(0, parseInt(String(v || '').replace(/[^\d]/g, ''), 10) || 0);
const fm = (n) => (n ? Number(n).toLocaleString('vi-VN') : '');
const vnd = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';
const dvn = (iso) => (iso ? iso.split('-').reverse().join('/') : '');
const todayIso = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const daysTo = (iso) => Math.round((new Date(iso + 'T00:00:00') - new Date(todayIso() + 'T00:00:00')) / 864e5);
const names = () => { const c = S.ov.wedding.couple; return [c.groom.name, c.bride.name].filter(Boolean).join(' & '); };
const memberName = (id) => (S.ov.members.find((m) => m.userId === id) || {}).name || '';

// số tiền gọn: 48tr, 1,2 tỷ
const short = (n) => { n = Number(n || 0); if (n >= 1e9) return (n / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' tỷ'; if (n >= 1e6) return (n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + 'tr'; if (n >= 1e3) return Math.round(n / 1e3) + 'k'; return n + 'đ'; };
const WDN = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const wdName = (iso) => { const [y, m, d] = iso.split('-').map(Number); return WDN[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]; };

// đầu trang cũ không dùng nữa: tên, ngày, đếm ngược nằm trong thẻ đầu tab Tổng quan
function renderHero() { const h = $('#hero'); if (h) { h.innerHTML = ''; h.hidden = true; } }

// "trước lễ ăn hỏi 30 ngày" khi lễ chưa có ngày
function relText(t) {
  const o = t.offset;
  const base = t.event === 'sau' ? 'ngày cưới' : evName(t.event).toLowerCase();
  if (o === 0) return 'Đúng ' + base;
  const n = Math.abs(o);
  const span = n >= 60 ? `~${Math.round(n / 30)} tháng` : `${n} ngày`;
  return `${o < 0 ? 'Trước' : 'Sau'} ${base} ${span}`;
}

// ---------- trạng thái hạn chót ----------
// Việc có hạn trước cả ngày tạo sổ tay (cưới gấp) → "Nên làm sớm", không dọa "Quá hạn"
function dueInfo(t) {
  if (t.done) return { k: 'done', cls: 'gray', label: 'Đã xong' };
  if (!t.due) return { k: 'none', cls: 'gray', label: relText(t) };
  const started = new Date(S.ov.wedding.createdAt || Date.now()).toISOString().slice(0, 10);
  const n = daysTo(t.due);
  if (n < 0) return t.due >= started ? { k: 'late', cls: 'late', label: `Quá hạn ${-n} ngày` } : { k: 'early', cls: 'soon', label: 'Nên làm sớm' };
  if (n === 0) return { k: 'week', cls: 'soon', label: 'Hôm nay' };
  if (n <= 7) return { k: 'week', cls: 'soon', label: `Còn ${n} ngày` };
  return { k: n <= 31 ? 'month' : 'later', cls: '', label: dvn(t.due) };
}
const avatar = (id, cls = '') => {
  if (!id) return '';
  const nm = memberName(id) || '?';
  const hue = [...id].reduce((n, c) => n + c.charCodeAt(0), 0) % 360;
  return `<span class="pav ${cls}" style="background:hsl(${hue} 55% 52%)" title="${esc(nm)}">${esc(nm.trim()[0] || '?').toUpperCase()}</span>`;
};
const evLabel = (e) => (e === 'sau' ? 'Sau cưới' : evName(e));
const subCount = (t) => (t.subtasks && t.subtasks.length ? `<span class="pchip gray">${t.subtasks.filter((x) => x.done).length}/${t.subtasks.length} việc nhỏ</span>` : '');

// một dòng việc (tổng quan, lịch, danh sách)
function taskLine(t, opts = {}) {
  const di = dueInfo(t);
  return `<div class="pt ${t.done ? 'done' : ''} ${opts.sel ? 'sel' : ''} ${opts.card ? 'pcard' : ''}" data-open="${t.id}">
    <button class="pck ${t.done ? 'on' : ''}" data-ck="${t.id}" aria-label="${t.done ? 'Bỏ đánh dấu' : 'Đánh dấu xong'}">${t.done ? '✓' : ''}</button>
    <div class="pt-b"><b>${esc(t.title)}</b>
      ${opts.slim ? '' : `<div class="pt-m"><span class="pchip ${di.cls}">${esc(di.label)}</span>${opts.noEv ? '' : `<span class="pchip gray">${EV_ICON[t.event] || ''} ${esc(evLabel(t.event))}</span>`}${subCount(t)}${t.note ? '<span class="pchip gray" title="Có ghi chú">📝</span>' : ''}</div>`}
    </div>
    ${opts.slim ? `<span class="pchip ${di.cls}">${esc(di.label)}</span>` : avatar(t.assignee)}
  </div>`;
}

// ---------- tổng quan ----------
function upcoming() {
  return S.tasks.filter((t) => !t.done).slice().sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));
}
function ring(pct, big, small) {
  const C = 2 * Math.PI * 56;
  return `<div class="pring" title="Đã xong ${pct}% việc"><svg width="132" height="132" viewBox="0 0 132 132"><circle cx="66" cy="66" r="56" fill="none" stroke="var(--line)" stroke-width="10"/><circle cx="66" cy="66" r="56" fill="none" stroke="var(--primary)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - pct / 100)).toFixed(1)}"/></svg><div class="c"><b>${big}</b><span>${small}</span></div></div>`;
}
function renderHome() {
  const w = S.ov.wedding, st = S.ov.stats, gs = st.guests;
  const needSetup = !w.couple.groom.name || !w.couple.bride.name || !w.date;
  const pct = st.tasks ? Math.round((st.tasksDone / st.tasks) * 100) : 0;
  const d = w.date ? daysTo(w.date) : null;
  const todo = S.tasks.filter((t) => !t.done);
  const late = todo.filter((t) => dueInfo(t).k === 'late').length;
  const week = todo.filter((t) => dueInfo(t).k === 'week').length;
  const cap = w.budgetTotal || Object.values(w.budgetPlan || {}).reduce((n, v) => n + v, 0) || st.estimate;
  const tables = Math.ceil((gs.yesPeople || gs.people) / 10);
  // các lễ: lễ đầu tiên chưa xong là "đang tới"
  let nowSet = false;
  const steps = EVENTS.map((e) => {
    const all = S.tasks.filter((t) => t.event === e), done = all.filter((t) => t.done).length;
    const date = e === 'sau' ? '' : evDate(e), dl = date ? daysTo(date) : null;
    const finished = all.length && done === all.length;
    const now = !finished && !nowSet; if (now) nowSet = true;
    const when = e === 'sau' ? 'Lại mặt, cảm ơn khách' : date ? `${dvn(date)}${dl > 0 ? ` · còn ${dl} ngày` : dl === 0 ? ' · hôm nay' : ''}` : '';
    return `<li class="${finished ? 'done' : now ? 'now' : ''}"><span class="dot">${finished ? '✓' : EV_ICON[e]}</span>
      <span><b>${esc(evLabel(e))}</b><small>${esc(when)}${!date && e !== 'sau' ? `<button class="plink" data-setdate="${e}">Chọn ngày</button>` : ''}</small></span><span class="n">${done}/${all.length}</span></li>`;
  }).join('');
  const c = S.ov.cards[0];
  const cardTxt = !c ? 'Chưa tạo thiệp' : c.paid ? 'Đã kích hoạt' : c.status === 'published' ? 'Đã phát hành · dùng thử' : 'Bản nháp';
  const vidTxt = c && c.video && c.video.created ? (c.video.paid ? 'Đã kích hoạt' : 'Đang dùng thử') : 'Chưa làm video';
  const next = upcoming().slice(0, 3);
  $('#main').innerHTML = `
    ${needSetup ? `<section class="sec onb panel onb-mini">
      <div><h2>👋 Hai bạn cưới khi nào?</h2>
      <p class="muted">Điền tên và ngày cưới — sổ tay tự soạn những việc cần chuẩn bị cho từng lễ (dạm ngõ, ăn hỏi, cưới). Sửa, thêm, xoá thoải mái.</p></div>
      <button class="btn" id="setupBtn">Điền thông tin →</button>
    </section>` : ''}
    <section class="pcard phero">
      <div>
        <p class="names">${names() ? esc(names()) : 'Sổ tay cưới của bạn'}</p>
        <p class="when">💍 ${w.date ? `${esc(wdName(w.date))}, ${dvn(w.date)} · ${esc(Lunar.lunarText(w.date))}` : 'Chưa chọn ngày cưới'} · ${esc(S.ov.regions[w.region])}</p>
        <button class="pedit" id="gear">✎ Sửa thông tin &amp; mời người cùng làm</button>
      </div>
      ${ring(pct, d === null ? '—' : d > 0 ? d : d === 0 ? '🎉' : '♥', d === null ? 'chưa có ngày' : d > 0 ? 'ngày nữa' : d === 0 ? 'hôm nay!' : 'đã cưới')}
    </section>
    <div class="ptiles">
      <button class="pcard ptile" data-go="tasks"><small>✓ Việc cần làm</small><b>${st.tasksDone}<span> / ${st.tasks}</span></b>
        <em class="${late ? 'warn' : ''}">${late ? `${late} việc quá hạn · ` : ''}${week} việc trong 7 ngày tới</em><div class="pbar"><i style="width:${pct}%"></i></div></button>
      <button class="pcard ptile" data-go="budget"><small>₫ Ngân sách</small><b>${short(st.actual)}<span> / ${cap ? short(cap) : '—'}</span></b>
        <em class="${cap && st.actual > cap ? 'warn' : ''}">${cap ? (st.actual > cap ? `Vượt ${short(st.actual - cap)}` : `Đã chi ${Math.round((st.actual / cap) * 100)}% · còn ${short(cap - st.actual)}`) : 'Chưa đặt ngân sách →'}</em><div class="pbar"><i class="${cap && st.actual > cap ? 'over' : ''}" style="width:${cap ? Math.min(100, (st.actual / cap) * 100) : 0}%"></i></div></button>
      <button class="pcard ptile" data-go="guests"><small>☺ Khách mời</small><b>${gs.total}<span> khách</span></b>
        <em>${gs.yesPeople} người sẽ đến · dự kiến ${tables} mâm</em><div class="pbar"><i style="width:${gs.people ? Math.min(100, (gs.yesPeople / gs.people) * 100) : 0}%"></i></div></button>
    </div>
    <div class="ptwo">
      <section class="pcard pnext">
        <div class="ph3">Việc tiếp theo <button class="plink" data-go="tasks">Xem tất cả ${todo.length} việc →</button></div>
        ${next.map((t) => taskLine(t, { slim: true })).join('') || '<p class="muted" style="margin:6px 0">Bạn đã xong hết việc 🎉</p>'}
      </section>
      <section class="pcard proad"><div class="ph3">Các lễ</div><ol class="psteps">${steps}</ol></section>
    </div>
    <div class="pmini">
      <button class="pcard" data-cta="card"><i>💌</i><span><b>Thiệp cưới</b><small>${esc(cardTxt)}${gs.invited ? ` · đã mời ${gs.invited} khách` : ''}</small></span></button>
      <button class="pcard" data-cta="video"><i>🎬</i><span><b>Video cưới</b><small>${esc(vidTxt)}</small></span></button>
      ${c && c.led && c.led.created ? '<button class="pcard" data-cta="led"><i>✨</i><span><b>Màn hình LED</b><small>Mở màn LED</small></span></button>' : ''}
    </div>`;
  const sb = $('#setupBtn');
  if (sb) sb.onclick = settingsModal;
  $('#gear').onclick = settingsModal;
}

// ---------- việc cần làm ----------
const GROUPS = [['late', 'Quá hạn'], ['early', 'Nên làm sớm'], ['week', '7 ngày tới'], ['month', 'Trong tháng'], ['later', 'Sau đó'], ['none', 'Chưa có hạn (chưa chọn ngày lễ)'], ['done', 'Đã xong']];
function visibleTasks() {
  const q = S.tq.trim().toLowerCase();
  return S.tasks.filter((t) => (S.filter === 'all' || (S.filter === 'todo' ? !t.done : t.done))
    && (!S.ev || t.event === S.ev) && (!q || t.title.toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q)));
}
function renderTasks() {
  const list = visibleTasks().slice().sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));
  const wide = matchMedia('(min-width:1100px)').matches;
  if (wide && (!S.tsel || !S.tasks.some((t) => t.id === S.tsel))) S.tsel = (list[0] || {}).id || null;
  const groups = GROUPS.map(([k, name]) => {
    const items = list.filter((t) => dueInfo(t).k === k);
    if (k === 'done') items.sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
    return items.length ? `<div class="pgrp"><h4 class="${k === 'late' ? 'red' : ''}">${name} · ${items.length}</h4>${items.map((t) => taskLine(t, { card: true, sel: wide && t.id === S.tsel, noEv: !!S.ev })).join('')}</div>` : '';
  }).join('');
  const cnt = (e) => S.tasks.filter((t) => (!e || t.event === e) && !t.done).length;
  const side = ['', ...EVENTS].map((e) => {
    const all = S.tasks.filter((t) => !e || t.event === e), done = all.filter((t) => t.done).length;
    return `<button class="${S.ev === e ? 'on' : ''}" data-ev="${e}">${e ? `${EV_ICON[e]} ${esc(evLabel(e))}` : 'Tất cả việc'}<span>${cnt(e)}</span></button>${e ? `<div class="ppg"><i style="width:${all.length ? (done / all.length) * 100 : 0}%"></i></div>` : ''}`;
  }).join('');
  const evDateBtn = S.ev && S.ev !== 'sau' && !evDate(S.ev) ? `<div class="pcard pnote">Chưa có ngày ${esc(evName(S.ev).toLowerCase())} nên chưa tính được hạn chót. <button class="btn sm soft" data-setdate="${S.ev}">Chọn ngày</button></div>` : '';
  const sel = S.tasks.find((t) => t.id === S.tsel);
  $('#main').innerHTML = `
    <div class="ptbar">
      <div class="pseg">${[['todo', `Chưa làm (${S.tasks.filter((t) => !t.done).length})`], ['done', `Đã xong (${S.tasks.filter((t) => t.done).length})`], ['all', 'Tất cả']].map(([k, l]) => `<button class="${S.filter === k ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</div>
      <label class="psearch">🔍<input id="tq" placeholder="Tìm việc… (tráp, xe hoa, nhà hàng)" value="${esc(S.tq)}"></label>
      <button class="btn" data-addev="${S.ev || 'cuoi'}">+ Thêm việc</button>
    </div>
    <div class="ptgrid">
      <nav class="pcard pside" aria-label="Lọc theo lễ">${side}
        <button class="preseed" id="reseed" title="Thêm lại các việc gợi ý đã xoá">↺ Khôi phục việc gợi ý</button></nav>
      <div>${evDateBtn}${groups || `<p class="pcard pempty">${S.filter === 'todo' && !S.tq ? 'Xong hết rồi 🎉' : 'Không có việc nào khớp.'}</p>`}
        <button class="padd" data-addev="${S.ev || 'cuoi'}">＋ Thêm việc${S.ev ? ' cho ' + esc(evLabel(S.ev).toLowerCase()) : ''}</button></div>
      <aside class="pcard pdetail" id="pdetail">${sel ? taskDetail(sel) : '<p class="muted">Chọn một việc để xem chi tiết.</p>'}</aside>
    </div>`;
  $('#tq').oninput = (e) => { S.tq = e.target.value; const pos = e.target.selectionStart; renderTasks(); const el = $('#tq'); el.focus(); el.setSelectionRange(pos, pos); };
}
function taskDetail(t) {
  const di = dueInfo(t), cta = t.cta && CTA[t.cta];
  const subs = t.subtasks || [];
  const ed = evDate(t.event);
  return `<div class="pd-top"><h3>${esc(t.title)}</h3><button class="pck ${t.done ? 'on' : ''}" data-ck="${t.id}" aria-label="Đánh dấu xong">${t.done ? '✓' : ''}</button></div>
    <div class="pfl">
      <span>Hạn chót</span><span>${t.due ? dvn(t.due) + ' ' : ''}<em class="pchip ${di.cls}">${esc(t.done ? 'Đã xong' : di.label)}</em></span>
      <span>Thuộc lễ</span><span>${EV_ICON[t.event] || ''} ${esc(evLabel(t.event))}${t.event !== 'sau' && ed ? ` (${dvn(ed)})` : ''}</span>
      <span>Nhóm việc</span><span>${esc(t.category || 'Khác')}</span>
      <span>Người làm</span><span>${t.assignee ? `${avatar(t.assignee, 'sm')} ${esc(memberName(t.assignee))}` : '<span class="muted">Chưa giao</span>'}</span>
    </div>
    <div class="ph3" style="margin-top:4px">Việc nhỏ <span class="muted" style="font-size:12px;font-weight:600">${subs.filter((x) => x.done).length}/${subs.length}</span></div>
    <ul class="psub">${subs.map((x) => `<li class="${x.done ? 'd' : ''}"><button class="pck sm ${x.done ? 'on' : ''}" data-sub="${t.id}:${x.id}">${x.done ? '✓' : ''}</button><span>${esc(x.title)}</span><button class="pdel" data-subdel="${t.id}:${x.id}" aria-label="Xoá việc nhỏ">×</button></li>`).join('')}</ul>
    <form class="psubadd" data-subadd="${t.id}"><input name="s" maxlength="120" placeholder="+ Thêm việc nhỏ (VD: hỏi giá 3 nơi)"><button class="btn sm plain">Thêm</button></form>
    <div class="pnote2">${t.note ? esc(t.note) : '<span class="muted">Chưa có ghi chú — bấm Sửa để thêm (nhà cung cấp, số điện thoại…).</span>'}</div>
    ${cta && !t.done ? `<button class="btn sm soft" style="margin-top:12px" data-cta="${t.cta}">${cta[0]} →</button>` : ''}
    <div class="pd-acts"><button class="btn sm" data-ck="${t.id}">${t.done ? '↺ Chưa xong' : '✓ Đánh dấu xong'}</button><button class="btn sm plain" data-edit="${t.id}">✎ Sửa</button><button class="btn sm plain" data-tdel="${t.id}">Xoá</button></div>`;
}

// ---------- ngân sách ----------
const BICON = { 'Tiệc cưới': '🍽', 'Lễ ăn hỏi': '🎁', 'Trang phục': '👗', 'Ảnh & phim': '📷', 'Trang sức': '💍', 'Làm đẹp': '💄', 'Trang trí': '💐', 'Thiệp & trình chiếu': '💌', 'Di chuyển': '🚗', Khác: '✨' };
// tỉ lệ gợi ý khi chia ngân sách tự động (%), nhóm không có trong bảng nhận phần "Khác"
const BSPLIT = { 'Tiệc cưới': 50, 'Lễ ăn hỏi': 10, 'Ảnh & phim': 12, 'Trang phục': 8, 'Trang sức': 6, 'Trang trí': 4, 'Làm đẹp': 3, 'Di chuyển': 3, 'Thiệp & trình chiếu': 2, Khác: 2 };
function budgetCats() {
  const B = S.budget;
  return [...new Set([...S.ov.budgetCats, ...B.items.map((i) => i.category), ...Object.keys(B.plan || {})])];
}
function catNums(c) {
  const items = S.budget.items.filter((i) => i.category === c);
  const sum = (f) => items.reduce((n, x) => n + x[f], 0);
  return { items, plan: (S.budget.plan || {})[c] || sum('estimate'), actual: sum('actual'), paid: sum('paid') };
}
function renderBudget() {
  const B = S.budget, cats = budgetCats();
  const sum = (f) => B.items.reduce((n, x) => n + x[f], 0);
  const act = sum('actual'), paid = sum('paid');
  const planTotal = cats.reduce((n, c) => n + catNums(c).plan, 0);
  const cap = B.total || planTotal;
  const owe = Math.max(0, act - paid);
  const pc = (v) => (cap ? Math.min(100, (v / cap) * 100) : 0);
  const spent = B.items.filter((i) => i.actual > 0).sort((a, b) => b.actual - a.actual).slice(0, 6);
  $('#main').innerHTML = `
    <div class="pbsum">
      <div class="pcard big"><div class="ph3" style="margin:0"><small>Tổng ngân sách</small><button class="btn sm soft" data-bset>✎ Đặt ngân sách</button></div>
        <b>${B.total ? vnd(B.total) : planTotal ? vnd(planTotal) : 'Chưa đặt'}</b>${!B.total && planTotal ? '<em class="muted">(cộng từ dự kiến các nhóm)</em>' : ''}
        <div class="pbbar"><i style="width:${pc(paid)}%"></i><i class="owe" style="width:${pc(owe)}%"></i></div>
        <div class="pleg"><span>Đã trả ${short(paid)}</span><span class="o">Còn nợ ${short(owe)}</span><span class="r">${cap ? (act > cap ? `Vượt ${short(act - cap)}` : `Còn lại ${short(cap - act)}`) : 'Đặt ngân sách để theo dõi'}</span></div></div>
      <div class="pcard"><small>Thực chi</small><b>${vnd(act)}</b><em>${B.items.filter((i) => i.actual > 0).length} khoản</em></div>
      <div class="pcard"><small>Còn phải trả</small><b class="${owe ? 'amber' : ''}">${vnd(owe)}</b><em>thực chi − đã trả</em></div>
      <div class="pcard"><small>Tiền mừng đã nhận</small><b class="green">${vnd(B.gifts)}</b><em>${B.gifts ? `chênh lệch ${B.gifts - act >= 0 ? '+' : '−'}${short(Math.abs(B.gifts - act))}` : 'ghi ở mục Khách mời'}</em></div>
    </div>
    <div class="pbgrid">
      <section class="pcard pbcats">
        <div class="ph3">Theo nhóm <span style="display:flex;gap:6px"><button class="btn sm plain" data-bset>✎ Sửa dự kiến</button><button class="btn sm plain" data-badd="">+ Khoản chi</button></span></div>
        ${cats.map((c) => {
          const n = catNums(c), over = n.plan && n.actual > n.plan, open = S.bopen === c;
          return `<div class="pcat ${open ? 'open' : ''}">
            <button class="pcat-h" data-bopen="${esc(c)}"><span class="ic">${BICON[c] || '📌'}</span><b>${esc(c)}</b><span class="amt ${over ? 'over' : ''}">${short(n.actual)} / ${n.plan ? short(n.plan) : '—'}${over ? ` · vượt ${short(n.actual - n.plan)}` : ''}</span>
              <span class="bar2"><i class="${over ? 'over' : ''}" style="width:${n.plan ? Math.min(100, (n.actual / n.plan) * 100) : n.actual ? 100 : 0}%"></i></span></button>
            ${open ? `<div class="pcat-items"><div class="bhead"><span>Khoản chi</span><span>Dự kiến</span><span>Thực chi</span><span>Đã trả</span><span></span></div>
              ${n.items.map((i) => `<div class="bitem" data-b="${i.id}"><span class="nm" title="${esc(i.note)}">${esc(i.name)}</span>
                <label><small>Dự kiến</small><input inputmode="numeric" data-k="estimate" value="${fm(i.estimate)}" placeholder="0"></label>
                <label><small>Thực chi</small><input inputmode="numeric" data-k="actual" value="${fm(i.actual)}" placeholder="0"></label>
                <label><small>Đã trả</small><input inputmode="numeric" data-k="paid" value="${fm(i.paid)}" placeholder="0"></label>
                <button class="icon-btn" data-bedit="${i.id}" title="Sửa">✎</button></div>`).join('')}
              <button class="btn sm plain" data-badd="${esc(c)}">+ Thêm khoản cho ${esc(c.toLowerCase())}</button></div>` : ''}
          </div>`;
        }).join('')}
      </section>
      <section class="pcard pspent">
        <div class="ph3">Khoản đã chi nhiều nhất <button class="btn sm" data-badd="">+ Thêm khoản chi</button></div>
        ${spent.map((i) => `<button class="ppay" data-bedit="${i.id}"><span class="t">${esc(i.name)}<small>${BICON[i.category] || '📌'} ${esc(i.category)}${i.paid < i.actual ? ` · còn nợ ${short(i.actual - i.paid)}` : ' · đã trả đủ'}</small></span><b>${vnd(i.actual)}</b></button>`).join('') || '<p class="muted" style="font-size:14px">Chưa ghi khoản chi nào. Bấm "+ Thêm khoản chi" hoặc mở từng nhóm bên trái để ghi số tiền.</p>'}
      </section>
    </div>`;
}
function budgetSetModal() {
  const cats = budgetCats();
  const total0 = S.budget.total || cats.reduce((n, c) => n + catNums(c).plan, 0);
  openModal(`<div class="pbset"><h2>Đặt ngân sách đám cưới</h2><p class="muted" style="margin:4px 0 0;font-size:14px">Nhập tổng số tiền hai bạn dự định chi, rồi chia cho từng nhóm. Sổ tay sẽ báo khi nhóm nào vượt.</p>
    <input class="tot" id="bsTot" inputmode="numeric" value="${fm(total0)}" placeholder="VD: 150.000.000">
    <div class="quick"><span class="muted">Nhanh:</span>${[80, 120, 200, 300].map((m) => `<button type="button" data-q="${m}">${m} triệu</button>`).join('')}<button type="button" id="bsAuto">✨ Gợi ý chia tự động</button></div>
    ${cats.map((c, i) => `<div class="rowc"><span>${BICON[c] || '📌'}</span><b>${esc(c)}</b><input data-i="${i}" inputmode="numeric" value="${fm((S.budget.plan || {})[c] || '')}" placeholder="0"><span class="pc" data-pc="${i}"></span></div>`).join('')}
    <div class="sumline" id="bsSum"></div><button class="btn block" id="bsSave">Lưu ngân sách</button></div>`,
  (box, close) => {
    const tot = $('#bsTot', box), inputs = $$('.rowc input', box);
    const sync = () => {
      const t = pmoney(tot.value); let s = 0;
      inputs.forEach((inp) => { const v = pmoney(inp.value); s += v; $(`[data-pc="${inp.dataset.i}"]`, box).textContent = t && v ? Math.round((v / t) * 100) + '%' : ''; });
      const d = t - s, line = $('#bsSum', box);
      line.className = 'sumline' + (t && d < 0 ? ' over' : '');
      line.innerHTML = `<span>Đã chia ${vnd(s)}</span><b>${!t ? 'Chưa nhập tổng' : d >= 0 ? 'Còn chưa chia ' + vnd(d) : 'Vượt tổng ' + vnd(-d)}</b>`;
    };
    const auto = () => {
      const t = pmoney(tot.value), known = cats.reduce((n, c) => n + (BSPLIT[c] || 0), 0) || 100;
      inputs.forEach((inp) => { const p = BSPLIT[cats[inp.dataset.i]] || 0; inp.value = fm(Math.round((t * p) / known / 1e5) * 1e5); });
      sync();
    };
    box.addEventListener('input', (e) => { if (e.target.tagName === 'INPUT') { e.target.value = fm(pmoney(e.target.value)); sync(); } });
    $$('[data-q]', box).forEach((b) => { b.onclick = () => { tot.value = fm(+b.dataset.q * 1e6); auto(); }; });
    $('#bsAuto', box).onclick = auto;
    $('#bsSave', box).onclick = async () => {
      const plan = {}; inputs.forEach((inp) => { const v = pmoney(inp.value); if (v) plan[cats[inp.dataset.i]] = v; });
      try {
        S.ov = await api('/api/wedding', { method: 'PUT', body: { budgetTotal: pmoney(tot.value), budgetPlan: plan } });
        await loadBudget(); close(); render(); toast('Đã lưu ngân sách');
      } catch (err) { toast(err.message, true); }
    };
    sync();
  });
}

// ---------- khách mời ----------
const rsvpOf = (g) => (g.rsvp ? (g.rsvp.attending === 'yes' ? 'yes' : 'no') : g.invited ? 'inv' : 'new');
const RS = { yes: ['y', 'Sẽ đến'], no: ['n', 'Không đến'], inv: ['s', 'Đã mời'], new: ['w', 'Chưa mời'] };
function renderGuests() {
  const G = S.guests, s = G.stats;
  const q = S.gq.trim().toLowerCase();
  const list = G.guests.filter((g) => (!q || g.name.toLowerCase().includes(q) || (g.group || '').toLowerCase().includes(q))
    && (!S.gside || g.side === S.gside)
    && (!S.grs || (S.grs === 'wait' ? !g.rsvp : rsvpOf(g) === S.grs)));
  const waiting = G.guests.filter((g) => !g.rsvp).length;
  const seg = (key, opts) => `<div class="pseg">${opts.map(([v, l]) => `<button class="${S[key] === v ? 'on' : ''}" data-gf="${key}:${v}">${l}</button>`).join('')}</div>`;
  $('#main').innerHTML = `
    <div class="pgsum">
      <div class="pcard"><small>Khách mời</small><b>${s.total}</b><em>${s.people} người · nhà trai ${s.trai} · nhà gái ${s.gai}</em></div>
      <div class="pcard"><small>Sẽ đến</small><b class="green">${s.yesPeople}</b><em>≈ ${Math.ceil((s.yesPeople || 0) / 10)} mâm (10 người)</em></div>
      <div class="pcard"><small>Chưa trả lời</small><b>${waiting}</b><em>${s.no} khách báo không đến</em></div>
      <div class="pcard"><small>Tiền mừng</small><b>${short(s.gifts)}</b><em>${G.guests.filter((g) => g.gift).length} khách đã ghi</em></div>
    </div>
    <div class="ptbar">
      ${seg('gside', [['', 'Cả hai nhà'], ['trai', 'Nhà trai'], ['gai', 'Nhà gái']])}
      ${seg('grs', [['', 'Mọi trạng thái'], ['yes', 'Sẽ đến'], ['wait', 'Chưa trả lời'], ['no', 'Không đến']])}
      <label class="psearch">🔍<input id="gq" placeholder="Tìm tên hoặc nhóm…" value="${esc(S.gq)}"></label>
      ${G.guests.length ? '<a class="btn sm plain" href="/api/wedding/guests.csv">Tải Excel</a>' : ''}
      <button class="btn" id="gadd">+ Thêm khách</button>
    </div>
    <p class="muted" style="font-size:13px;margin:0 0 10px">Gửi link mời có tên riêng từng khách: mở thiệp → tab <b>Khách mời</b>. Khách xác nhận trên thiệp sẽ tự cập nhật vào đây.</p>
    <div class="pcard pgtbl">
      <div class="pgr head"><span>Khách</span><span>Bên</span><span>Số người</span><span>Trạng thái</span><span>Tiền mừng</span><span></span></div>
      ${list.map((g) => { const r = RS[rsvpOf(g)]; return `<div class="pgr" data-g="${g.id}">
        <span class="nm"><b data-gedit="${g.id}">${esc(g.name)}</b><small>${esc([g.group, g.note].filter(Boolean).join(' · ')) || '&nbsp;'}</small></span>
        <span><em class="pgside">${g.side === 'trai' ? 'Nhà trai' : g.side === 'gai' ? 'Nhà gái' : 'Chung'}</em></span>
        <span class="cnt">${g.count} người</span>
        <span><em class="prs ${r[0]}">${r[1]}${rsvpOf(g) === 'yes' && g.rsvp.count ? ' · ' + g.rsvp.count : ''}</em></span>
        <span><input class="gift" inputmode="numeric" data-gift="${g.id}" value="${fm(g.gift)}" placeholder="Tiền mừng"></span>
        <span class="act"><button class="btn sm plain" data-gedit="${g.id}">Sửa</button></span></div>`; }).join('')
        || `<p class="pempty">${G.guests.length ? 'Không có khách khớp bộ lọc.' : 'Chưa có khách nào. Bấm "+ Thêm khách" — dán cả danh sách một lần cũng được.'}</p>`}
    </div>`;
  $('#gq').oninput = (e) => { S.gq = e.target.value; const pos = e.target.selectionStart; renderGuests(); const el = $('#gq'); el.focus(); el.setSelectionRange(pos, pos); };
}

// ---------- lịch âm ----------
function renderCal() {
  const w = S.ov.wedding;
  if (!S.cal) { const base = w.date || todayIso(); S.cal = { y: +base.slice(0, 4), m: +base.slice(5, 7) }; }
  if (!S.sel) S.sel = w.date || todayIso();
  const { y, m } = S.cal;
  const start = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // tuần bắt đầu Thứ Hai
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const dueSet = new Set(S.tasks.filter((t) => t.due && !t.done).map((t) => t.due));
  const evOf = (iso) => (iso === w.date ? ['wed', '💍 Cưới'] : iso === w.anhoi ? ['ev', '🎁 ' + evName('anhoi')] : iso === w.damngo ? ['ev', '🤝 ' + evName('damngo')] : null);
  const l1 = Lunar.solarToLunar(1, m, y), lN = Lunar.solarToLunar(days, m, y);
  let cells = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => `<div class="w">${d}</div>`).join('') + '<div class="e"></div>'.repeat(start);
  for (let d = 1; d <= days; d++) {
    const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const l = Lunar.solarToLunar(d, m, y), ev = evOf(iso);
    cells += `<button class="ld ${ev ? ev[0] : ''} ${iso === todayIso() ? 'today' : ''} ${iso === S.sel ? 'sel' : ''} ${(start + d - 1) % 7 === 6 ? 'sun' : ''}" data-day="${iso}">
      <b>${d}</b><small class="${l.day === 1 || l.day === 15 ? 'm1' : ''}">${l.day === 1 ? `1/${l.month}${l.leap ? 'N' : ''}` : l.day}</small>${ev ? `<span class="ev">${esc(ev[1])}</span>` : ''}${dueSet.has(iso) ? '<i class="dot" title="Có hạn chót việc"></i>' : ''}</button>`;
  }
  const sel = S.sel, [sy, sm, sd] = sel.split('-').map(Number);
  const tasks = S.tasks.filter((t) => t.due === sel);
  const which = sel === w.date ? 'Ngày cưới của bạn ♥' : sel === w.anhoi ? evName('anhoi') : sel === w.damngo ? evName('damngo') : '';
  $('#main').innerHTML = `<div class="plgrid">
    <section class="pcard plcal">
      <div class="plhead"><div><b>Tháng ${m} · ${y}</b><small>Tháng ${l1.month}${l1.month !== lN.month ? ` – ${lN.month}` : ''} âm lịch · năm ${esc(Lunar.canChiYear(l1.year))}</small></div>
        <div class="nav2"><button data-mv="-1" aria-label="Tháng trước">‹</button><button data-today>Hôm nay</button><button data-mv="1" aria-label="Tháng sau">›</button></div></div>
      <div class="pldays">${cells}</div>
      <div class="plleg"><span><i class="wed"></i>Ngày cưới</span><span><i class="ev"></i>Ăn hỏi / dạm ngõ</span><span><i class="dot"></i>Hạn chót việc</span><span>Số nhỏ: ngày âm (1/11 = mùng 1 tháng 11)</span></div>
    </section>
    <aside class="pcard plinfo">
      <div class="bigd">${sd}</div>
      <div class="lu">${esc(wdName(sel))}, ${dvn(sel)}<br>${esc(Lunar.lunarText(sel))}</div>
      <div class="row"><span>Ngày (can chi)</span><b>${esc(Lunar.canChiDay(sd, sm, sy))}</b></div>
      ${which ? `<p class="pchip" style="margin:12px 0 0">${esc(which)}</p>` : ''}
      ${tasks.length ? `<div class="ph3" style="margin-top:14px">Hạn chót trong ngày</div>${tasks.map((t) => taskLine(t, { slim: true })).join('')}` : ''}
      ${which ? '' : `<button class="btn block" style="margin-top:14px" data-setday="date">Đặt làm ngày cưới</button><button class="btn block plain" style="margin-top:8px" data-setday="anhoi">Đặt làm ngày ${esc(evName('anhoi').toLowerCase())}</button><button class="btn block plain" style="margin-top:8px" data-setday="damngo">Đặt làm ngày ${esc(evName('damngo').toLowerCase())}</button>`}
    </aside></div>`;
}

// ---------- hộp sửa ----------
function dateModal(e) {
  openModal(`<h2>${EV_ICON[e]} Ngày ${esc(evName(e).toLowerCase())}</h2>
    <form id="df" style="margin-top:14px"><label class="field"><span>Chọn ngày (dương lịch)</span><input name="d" type="date" required value="${esc(evDate(e))}"></label>
    <p class="muted" id="dl" style="font-size:13px;margin:-6px 0 14px"></p><button class="btn block">Lưu ngày</button></form>`, (box, close) => {
    const f = $('#df', box);
    const show = () => { $('#dl', box).textContent = f.d.value ? Lunar.lunarText(f.d.value) : ''; };
    f.d.oninput = show; show();
    f.onsubmit = async (ev) => {
      ev.preventDefault();
      S.ov = await api('/api/wedding', { method: 'PUT', body: { [evField(e)]: f.d.value } });
      close(); await loadTasks(); render(); toast('Đã lưu ngày — hạn chót các việc đã tính lại');
    };
  });
}

function taskModal(t, ev) {
  const isNew = !t;
  t = t || { title: '', category: 'Khác', offset: ev === 'sau' ? 3 : -7, note: '', assignee: null, event: ev || 'cuoi' };
  const w = S.ov.wedding;
  const base = evDate(t.event);
  const due = base ? new Date(new Date(base + 'T00:00:00Z').getTime() + t.offset * 864e5).toISOString().slice(0, 10) : '';
  openModal(`<h2>${isNew ? 'Thêm việc' : 'Sửa việc'}</h2>
    <form id="tf" style="margin-top:14px">
      <label class="field"><span>Việc cần làm</span><input name="title" value="${esc(t.title)}" required maxlength="140" placeholder="VD: Đặt bánh cưới"></label>
      <div class="grid2">
        <label class="field"><span>Chuẩn bị cho</span><select name="event">${EVENTS.map((e) => `<option value="${e}" ${t.event === e ? 'selected' : ''}>${EV_ICON[e]} ${esc(e === 'sau' ? 'Sau ngày cưới' : evName(e))}</option>`).join('')}</select></label>
        <label class="field"><span>Nhóm</span><input name="category" list="tcats" value="${esc(t.category)}" maxlength="40"><datalist id="tcats">${S.ov.taskCats.map((c) => `<option value="${esc(c)}">`).join('')}</datalist></label>
      </div>
      <div class="grid2">
        <label class="field"><span>Hạn chót</span><input name="due" type="date" value="${due}"><small id="dueHint"></small></label>
        <label class="field"><span>Hoặc: số ngày ${t.offset > 0 ? 'sau' : 'trước'} lễ</span><input name="before" type="number" value="${Math.abs(t.offset)}"></label>
      </div>
      <label class="field"><span>Người phụ trách</span><select name="assignee"><option value="">— Chưa giao —</option>${S.ov.members.map((m) => `<option value="${m.userId}" ${t.assignee === m.userId ? 'selected' : ''}>${esc(m.name || m.email)}</option>`).join('')}</select></label>
      <label class="field"><span>Ghi chú</span><textarea name="note" maxlength="500" rows="3">${esc(t.note)}</textarea></label>
      <div style="display:flex;gap:8px;justify-content:space-between">${isNew ? '<span></span>' : '<button type="button" class="btn danger" id="tdel">Xoá việc</button>'}<button class="btn">Lưu</button></div>
    </form>`, (box, close) => {
    const f = $('#tf', box);
    // hạn chót ⇄ số ngày trước/sau lễ: sửa ô nào thì ô kia tự tính lại
    const sign = () => (f.event.value === 'sau' ? 1 : -1);
    const baseOf = () => evDate(f.event.value);
    const syncDue = () => {
      const b = baseOf();
      f.due.disabled = !b;
      $('#dueHint', box).textContent = b ? '' : `Chưa có ngày ${f.event.value === 'sau' ? 'cưới' : evName(f.event.value).toLowerCase()} — nhập số ngày bên cạnh`;
      f.due.value = b ? new Date(new Date(b + 'T00:00:00Z').getTime() + sign() * (+f.before.value || 0) * 864e5).toISOString().slice(0, 10) : '';
    };
    f.before.oninput = syncDue;
    f.event.onchange = syncDue;
    f.due.oninput = () => {
      const b = baseOf();
      if (b && f.due.value) f.before.value = Math.abs(Math.round((new Date(f.due.value + 'T00:00:00Z') - new Date(b + 'T00:00:00Z')) / 864e5));
    };
    syncDue();
    f.onsubmit = async (e) => {
      e.preventDefault();
      const offset = sign() * Math.abs(+f.before.value || 0);
      const body = { title: f.title.value, event: f.event.value, category: f.category.value, offset, note: f.note.value, assignee: f.assignee.value || null };
      try {
        if (isNew) await api('/api/wedding/tasks', { method: 'POST', body });
        else await api(`/api/tasks/${t.id}`, { method: 'PUT', body });
        close(); await reloadAll(); toast('Đã lưu');
      } catch (err) { toast(err.message, true); }
    };
    const del = $('#tdel', box);
    if (del) del.onclick = async () => { if (!confirm('Xoá việc này?')) return; await api(`/api/tasks/${t.id}`, { method: 'DELETE' }); close(); await reloadAll(); };
  });
}

function budgetModal(item, category) {
  const isNew = !item;
  item = item || { name: '', category: category || 'Khác', note: '', estimate: 0, actual: 0, paid: 0 };
  openModal(`<h2>${isNew ? 'Thêm khoản chi' : 'Sửa khoản chi'}</h2>
    <form id="bf" style="margin-top:14px">
      <label class="field"><span>Tên khoản</span><input name="name" value="${esc(item.name)}" required maxlength="100"></label>
      <label class="field"><span>Nhóm</span><input name="category" list="bcats" value="${esc(item.category)}" maxlength="40"><datalist id="bcats">${S.ov.budgetCats.map((c) => `<option value="${esc(c)}">`).join('')}</datalist></label>
      <div class="grid3m">
        <label class="field"><span>Dự kiến</span><input name="estimate" inputmode="numeric" value="${fm(item.estimate)}" placeholder="0"></label>
        <label class="field"><span>Thực chi</span><input name="actual" inputmode="numeric" value="${fm(item.actual)}" placeholder="0"></label>
        <label class="field"><span>Đã trả</span><input name="paid" inputmode="numeric" value="${fm(item.paid)}" placeholder="0"></label>
      </div>
      <label class="field"><span>Ghi chú (nhà cung cấp, số điện thoại…)</span><textarea name="note" rows="2" maxlength="300">${esc(item.note)}</textarea></label>
      <div style="display:flex;gap:8px;justify-content:space-between">${isNew ? '<span></span>' : '<button type="button" class="btn danger" id="bdel">Xoá</button>'}<button class="btn">Lưu</button></div>
    </form>`, (box, close) => {
    $$('[name=estimate],[name=actual],[name=paid]', box).forEach((i) => { i.oninput = () => { i.value = fm(pmoney(i.value)); }; });
    $('#bf', box).onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target;
      const body = { name: f.name.value, category: f.category.value, note: f.note.value, estimate: pmoney(f.estimate.value), actual: pmoney(f.actual.value), paid: pmoney(f.paid.value) };
      try {
        if (isNew) await api('/api/wedding/budget', { method: 'POST', body });
        else await api(`/api/budget/${item.id}`, { method: 'PUT', body });
        close(); await loadBudget(); render();
      } catch (err) { toast(err.message, true); }
    };
    const del = $('#bdel', box);
    if (del) del.onclick = async () => { if (!confirm('Xoá khoản chi này?')) return; await api(`/api/budget/${item.id}`, { method: 'DELETE' }); close(); await loadBudget(); render(); };
  });
}

function guestModal(g) {
  const isNew = !g;
  g = g || { name: '', side: '', group: '', count: 1, invited: false, note: '', rsvp: null };
  const groups = [...new Set(S.guests.guests.map((x) => x.group).filter(Boolean).concat(['Họ hàng', 'Bạn bè', 'Đồng nghiệp', 'Hàng xóm']))];
  openModal(`<h2>${isNew ? 'Thêm khách' : 'Sửa khách'}</h2>
    <form id="gf" style="margin-top:14px">
      ${isNew ? '<label class="field"><span>Tên khách — mỗi dòng một người/gia đình</span><textarea name="names" rows="5" required placeholder="Cô chú Tư và gia đình&#10;Anh Hùng & người thương&#10;Bạn Lan Anh"></textarea></label>'
        : `<label class="field"><span>Tên</span><input name="name" value="${esc(g.name)}" required maxlength="80"></label>`}
      <div class="grid2">
        <label class="field"><span>Khách nhà</span><select name="side"><option value="">Chung</option><option value="trai" ${g.side === 'trai' ? 'selected' : ''}>Nhà trai</option><option value="gai" ${g.side === 'gai' ? 'selected' : ''}>Nhà gái</option></select></label>
        <label class="field"><span>Nhóm</span><input name="group" list="ggroups" value="${esc(g.group)}" maxlength="40"><datalist id="ggroups">${groups.map((x) => `<option value="${esc(x)}">`).join('')}</datalist></label>
        <label class="field"><span>Số người ${isNew ? '(mỗi dòng)' : ''}</span><input name="count" type="number" min="1" max="20" value="${g.count}"></label>
        ${isNew ? '' : `<label class="field"><span>Xác nhận</span><select name="rsvp"><option value="">Chưa rõ</option><option value="yes" ${g.rsvp && g.rsvp.attending === 'yes' ? 'selected' : ''}>Sẽ đến</option><option value="no" ${g.rsvp && g.rsvp.attending === 'no' ? 'selected' : ''}>Không đến</option></select></label>`}
      </div>
      <label class="check" style="margin-bottom:12px"><input type="checkbox" name="invited" ${g.invited ? 'checked' : ''}> Đã gửi lời mời</label>
      ${isNew ? '' : `<label class="field"><span>Ghi chú</span><input name="note" value="${esc(g.note)}" maxlength="200"></label>`}
      <div style="display:flex;gap:8px;justify-content:space-between">${isNew ? '<span></span>' : '<button type="button" class="btn danger" id="gdel">Xoá khách</button>'}<button class="btn">Lưu</button></div>
    </form>`, (box, close) => {
    $('#gf', box).onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target;
      const base = { side: f.side.value, group: f.group.value, count: f.count.value, invited: f.invited.checked };
      try {
        if (isNew) { const r = await api('/api/wedding/guests', { method: 'POST', body: { ...base, names: f.names.value } }); toast(`Đã thêm ${r.added} khách`); }
        else await api(`/api/guests/${g.id}`, { method: 'PUT', body: { ...base, name: f.name.value, note: f.note.value, rsvp: f.rsvp.value } });
        close(); await loadGuests(); await loadOverview(); render();
      } catch (err) { toast(err.message, true); }
    };
    const del = $('#gdel', box);
    if (del) del.onclick = async () => { if (!confirm(`Xoá "${g.name}" khỏi danh sách? Link mời riêng của khách này sẽ không còn hiện tên.`)) return; await api(`/api/guests/${g.id}`, { method: 'DELETE' }); close(); await loadGuests(); render(); };
  });
}

// ---------- cài đặt & thành viên ----------
async function settingsModal() {
  const w = S.ov.wedding;
  const inv = await api('/api/wedding/invite');
  const p = (k, f, label, ph = '') => `<label class="field"><span>${label}</span><input name="${k}.${f}" value="${esc(w.couple[k][f])}" placeholder="${ph}" maxlength="${f === 'address' ? 160 : 80}"></label>`;
  openModal(`<h2>Thông tin đám cưới</h2>
    <form id="sf" style="margin-top:14px">
      <div class="grid2">${p('groom', 'name', 'Tên gọi chú rể', 'Đức Minh')}${p('bride', 'name', 'Tên gọi cô dâu', 'Thu Hà')}
      ${p('groom', 'fullName', 'Họ tên chú rể')}${p('bride', 'fullName', 'Họ tên cô dâu')}
      ${p('groom', 'father', 'Bố chú rể', 'Ông …')}${p('bride', 'father', 'Bố cô dâu', 'Ông …')}
      ${p('groom', 'mother', 'Mẹ chú rể', 'Bà …')}${p('bride', 'mother', 'Mẹ cô dâu', 'Bà …')}
      <label class="field"><span>💍 Ngày cưới</span><input name="date" type="date" value="${esc(w.date)}"></label>
      <label class="field"><span>🎁 Ngày ${esc(evName('anhoi').toLowerCase())}</span><input name="anhoi" type="date" value="${esc(w.anhoi)}"></label>
      <label class="field"><span>🤝 Ngày ${esc(evName('damngo').toLowerCase())}</span><input name="damngo" type="date" value="${esc(w.damngo)}"></label>
      <label class="field"><span>Giờ</span><input name="time" type="time" value="${esc(w.time)}"></label></div>
      <label class="field"><span>Phong tục theo</span><select name="region">${Object.entries(S.ov.regions).map(([k, v]) => `<option value="${k}" ${w.region === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
        <small>Đổi miền sẽ thay các việc mẫu chưa làm bằng việc theo phong tục miền mới (giữ việc bạn tự thêm và việc đã xong).</small></label>
      <button class="btn block">Lưu thông tin</button>
      <p class="muted" style="font-size:12px;margin:8px 0 0">Thông tin này dùng chung cho thiệp, màn LED và video của bạn.</p>
    </form>
    <h2 style="margin-top:26px">Cùng chuẩn bị</h2>
    <p class="muted" style="margin:0 0 10px;font-size:14px">Gửi link cho người yêu, bố mẹ để cùng đánh dấu việc, ghi khách và tiền mừng.</p>
    ${S.ov.members.map((m) => `<div class="member"><span><b>${esc(m.name || m.email)}</b> <span class="muted" style="font-size:13px">${esc(m.email)} · ${m.role === 'owner' ? 'Người tạo' : 'Thành viên'}</span></span>${m.role !== 'owner' && (w.isOwner || m.userId === S.me.id) ? `<button class="btn sm danger" data-rm="${m.userId}">${m.userId === S.me.id ? 'Rời sổ tay' : 'Xoá'}</button>` : ''}</div>`).join('')}
    <div style="display:flex;gap:8px;margin-top:12px"><input class="input" readonly value="${esc(inv.url)}"><button class="btn" id="cpInv">Chép link</button></div>
    ${w.isOwner ? '<button class="btn sm plain" id="rsInv" style="margin-top:8px">Đổi link mời (link cũ hết hiệu lực)</button>' : ''}`,
  (box, close) => {
    $('#sf', box).onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target;
      const couple = { groom: {}, bride: {} };
      $$('input[name*="."]', f).forEach((i) => { const [k, fld] = i.name.split('.'); couple[k][fld] = i.value; });
      if (f.region.value !== w.region && !confirm('Đổi phong tục sẽ thay các việc mẫu chưa làm. Tiếp tục?')) return;
      try {
        S.ov = await api('/api/wedding', { method: 'PUT', body: { couple, date: f.date.value, anhoi: f.anhoi.value, damngo: f.damngo.value, time: f.time.value, region: f.region.value } });
        close(); await reloadAll(); toast('Đã lưu thông tin');
      } catch (err) { toast(err.message, true); }
    };
    $('#cpInv', box).onclick = () => copyText(inv.url, 'Đã chép link — gửi qua Zalo cho người yêu, bố mẹ nhé');
    const rs = $('#rsInv', box);
    if (rs) rs.onclick = async () => { if (!confirm('Đổi link mời? Link cũ sẽ không dùng được nữa.')) return; await api('/api/wedding/invite/reset', { method: 'POST' }); close(); settingsModal(); };
    $$('[data-rm]', box).forEach((b) => (b.onclick = async () => {
      const self = b.dataset.rm === S.me.id;
      if (!confirm(self ? 'Rời khỏi sổ tay này?' : 'Xoá thành viên này khỏi sổ tay?')) return;
      try { await api(`/api/wedding/members/${b.dataset.rm}`, { method: 'DELETE' }); close(); await reloadAll(); }
      catch (err) { toast(err.message, true); }
    }));
  });
}

// ---------- tải dữ liệu ----------
async function loadOverview() { S.ov = await api('/api/wedding'); }
async function loadTasks() { S.tasks = (await api('/api/wedding/tasks')).tasks; }
async function loadBudget() { S.budget = await api('/api/wedding/budget'); }
async function loadGuests() { S.guests = await api('/api/wedding/guests'); }
async function reloadAll() {
  await Promise.all([loadOverview(), loadTasks(), S.budget && loadBudget(), S.guests && loadGuests()]);
  render();
}

async function render() {
  renderHero();
  $$('#ptabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === S.tab));
  if (S.tab === 'budget' && !S.budget) await loadBudget();
  if (S.tab === 'guests' && !S.guests) await loadGuests();
  ({ home: renderHome, tasks: renderTasks, budget: renderBudget, guests: renderGuests, cal: renderCal })[S.tab]();
}
function go(tab) {
  S.tab = tab;
  history.replaceState(null, '', '#' + tab);
  window.scrollTo(0, 0);
  render();
}

// Nút mua gắn với từng bước: dùng thiệp của đám cưới, chưa có thì tạo
async function cta(kind) {
  const c = CTA[kind];
  if (!c) return;
  if (c[1].startsWith('tab:')) return go(c[1].slice(4));
  let card = S.ov.cards[0];
  if (!card) card = (await api('/api/cards', { method: 'POST', body: { template: 'dodam' } })).card;
  location.href = `/${c[1]}/${card.id}`;
}

// ---------- sự kiện chung ----------
let moneyTimer = {};
// hộp chi tiết việc trên điện thoại (máy tính hiện bảng bên phải danh sách)
let detailBox = null;
function openTaskDetail(id) {
  S.tsel = id;
  if (matchMedia('(min-width:1100px)').matches) return S.tab === 'tasks' ? render() : go('tasks'); // máy tính: bảng chi tiết bên phải danh sách việc
  const t = S.tasks.find((x) => x.id === id);
  if (!t) return;
  openModal(`<div class="pdetail inmodal" id="pdetailM">${taskDetail(t)}</div>`, (box, close) => {
    detailBox = { box, close };
    box.addEventListener('click', onAction);
    box.addEventListener('submit', onSubmit);
    new MutationObserver(() => { if (!document.body.contains(box)) detailBox = null; }).observe(document.body, { childList: true });
  });
}
// vẽ lại bảng / hộp chi tiết sau khi việc thay đổi
function refreshDetail() {
  const t = S.tasks.find((x) => x.id === S.tsel);
  if (detailBox) { const m = $('#pdetailM', detailBox.box); if (m && t) m.innerHTML = taskDetail(t); else if (!t) detailBox.close(); }
  render();
}
async function saveTask(t, body) {
  const r = await api(`/api/tasks/${t.id}`, { method: 'PUT', body, quiet: true }); // tích việc / việc con: lưu ngầm
  Object.assign(t, r.task);
}

async function onAction(e) {
  const b = e.target.closest('[data-ck],[data-sub],[data-subdel],[data-tdel],[data-edit],[data-cta],[data-go],[data-f],[data-ev],[data-addev],[data-setdate],#reseed,[data-bset],[data-bopen],[data-badd],[data-bedit],#gadd,[data-gedit],[data-gf],[data-mv],[data-today],[data-day],[data-setday],[data-open]');
  if (!b) return;
  const d = b.dataset;
  try {
    if (d.ck) {
      const t = S.tasks.find((x) => x.id === d.ck);
      t.done = !t.done;
      refreshDetail();
      await saveTask(t, { done: t.done });
      await loadOverview();
      if (t.done) toast('Xong một việc ✓');
      refreshDetail();
    } else if (d.sub || d.subdel) {
      const [tid, sid] = (d.sub || d.subdel).split(':');
      const t = S.tasks.find((x) => x.id === tid);
      const subs = (t.subtasks || []).map((x) => ({ ...x }));
      const i = subs.findIndex((x) => x.id === sid);
      if (i < 0) return;
      if (d.sub) subs[i].done = !subs[i].done; else subs.splice(i, 1);
      t.subtasks = subs; refreshDetail();
      await saveTask(t, { subtasks: subs }); refreshDetail();
    } else if (d.tdel) {
      if (!confirm('Xoá việc này?')) return;
      await api(`/api/tasks/${d.tdel}`, { method: 'DELETE' });
      if (detailBox) detailBox.close();
      S.tsel = null; await reloadAll();
    } else if (d.edit) { if (detailBox) detailBox.close(); taskModal(S.tasks.find((x) => x.id === d.edit)); }
    else if (d.cta) await cta(d.cta);
    else if (d.go) go(d.go);
    else if (d.f) { S.filter = d.f; S.tsel = null; render(); }
    else if (d.ev !== undefined) { S.ev = d.ev; S.tsel = null; render(); }
    else if (d.addev) taskModal(null, d.addev);
    else if (d.setdate) dateModal(d.setdate);
    else if (b.id === 'reseed') {
      if (!confirm('Thêm lại các việc gợi ý đã xoá? Việc bạn tự thêm và việc đã xong được giữ nguyên.')) return;
      await api('/api/wedding/tasks/reseed', { method: 'POST' });
      await reloadAll(); toast('Đã khôi phục danh sách gợi ý');
    }
    else if (d.bset !== undefined) budgetSetModal();
    else if (d.bopen !== undefined) { S.bopen = S.bopen === d.bopen ? null : d.bopen; render(); }
    else if (d.badd !== undefined) budgetModal(null, d.badd || S.bopen || 'Khác');
    else if (d.bedit) budgetModal(S.budget.items.find((x) => x.id === d.bedit));
    else if (b.id === 'gadd') guestModal(null);
    else if (d.gedit) guestModal(S.guests.guests.find((x) => x.id === d.gedit));
    else if (d.gf) { const [k, v] = d.gf.split(':'); S[k] = v; render(); }
    else if (d.mv) { S.cal.m += +d.mv; if (S.cal.m < 1) { S.cal.m = 12; S.cal.y--; } if (S.cal.m > 12) { S.cal.m = 1; S.cal.y++; } render(); }
    else if (d.today !== undefined) { const t = todayIso(); S.cal = { y: +t.slice(0, 4), m: +t.slice(5, 7) }; S.sel = t; render(); }
    else if (d.day) { S.sel = d.day; render(); }
    else if (d.setday) {
      const fld = d.setday;
      const label = fld === 'date' ? 'ngày cưới' : 'ngày ' + evName(fld).toLowerCase();
      if (!confirm(`Đặt ${dvn(S.sel)} làm ${label}? Hạn chót các việc sẽ tính lại theo ngày này.`)) return;
      S.ov = await api('/api/wedding', { method: 'PUT', body: { [fld]: S.sel } });
      await loadTasks(); render(); toast(`Đã đặt ${label} ♥`);
    } else if (d.open) openTaskDetail(d.open);
  } catch (err) { toast(err.message, true); }
}
// thêm việc nhỏ (form trong bảng / hộp chi tiết)
async function onSubmit(e) {
  const f = e.target.closest('[data-subadd]');
  if (!f) return;
  e.preventDefault();
  const title = f.s.value.trim();
  if (!title) return;
  const t = S.tasks.find((x) => x.id === f.dataset.subadd);
  const subs = [...(t.subtasks || []), { id: Math.random().toString(36).slice(2, 10), title, done: false }];
  try { await saveTask(t, { subtasks: subs }); refreshDetail(); const inp = $(`[data-subadd="${t.id}"] input`, detailBox ? detailBox.box : document); if (inp) inp.focus(); }
  catch (err) { toast(err.message, true); }
}

function bind() {
  $('#ptabs').onclick = (e) => { const b = e.target.closest('button'); if (b) go(b.dataset.tab); };
  const main = $('#main');
  main.addEventListener('click', onAction);
  main.addEventListener('submit', onSubmit);
  // nhập tiền: định dạng 1.000.000 khi gõ, tự lưu
  main.addEventListener('input', (e) => {
    const t = e.target;
    if (!(t.dataset.k || t.dataset.gift !== undefined || t.id === 'btotal')) return;
    const n = pmoney(t.value);
    t.value = fm(n);
    const key = t.dataset.gift || (t.closest('[data-b]') || {}).dataset?.b + t.dataset.k || 'total';
    clearTimeout(moneyTimer[key]);
    moneyTimer[key] = setTimeout(async () => {
      try {
        if (t.id === 'btotal') { S.ov = await api('/api/wedding', { method: 'PUT', body: { budgetTotal: n }, quiet: true }); S.budget.total = n; }
        else if (t.dataset.gift) { const g = S.guests.guests.find((x) => x.id === t.dataset.gift); g.gift = n; await api(`/api/guests/${g.id}`, { method: 'PUT', body: { gift: n }, quiet: true }); S.guests.stats = (await api('/api/wedding/guests')).stats; }
        else { const id = t.closest('[data-b]').dataset.b; const it = S.budget.items.find((x) => x.id === id); it[t.dataset.k] = n; await api(`/api/budget/${id}`, { method: 'PUT', body: { [t.dataset.k]: n }, quiet: true }); }
        toast('Đã lưu');
        await loadOverview(); renderHero();
        const a = document.activeElement;
        if (!a || !(a.dataset.k || a.dataset.gift || a.id === 'btotal')) render(); // không vẽ lại khi đang gõ ô tiền khác
      } catch (err) { toast(err.message, true); }
    }, 800);
  });
  main.addEventListener('focusout', (e) => {
    // vẽ lại tổng khi rời ô tiền (không vẽ lại khi đang gõ để không mất con trỏ)
    if ((e.target.dataset.k || e.target.id === 'btotal' || e.target.dataset.gift) && !main.contains(e.relatedTarget)) setTimeout(render, 900);
  });
}

// Không tải được (mất mạng, máy chủ đang khởi động lại): báo rõ và cho thử lại, thay vì để trang trắng
function offline() {
  $('#hero').innerHTML = '';
  $('main').innerHTML = `<div class="panel empty" style="margin-top:30px"><p style="font-size:40px;margin:0">📡</p>
    <h3 style="color:var(--ink)">Chưa kết nối được máy chủ</h3><p>Kiểm tra mạng rồi thử lại nhé — dữ liệu sổ tay của bạn vẫn an toàn.</p>
    <button class="btn" onclick="location.reload()">Thử lại</button></div>`;
}

(async () => {
  let top;
  try { top = await renderTopbar('planner'); } catch { return offline(); }
  const { user, meta } = top;
  if (!user) return (location.href = '/dang-nhap?dang-ky=1&next=/so-tay');
  S.me = user;
  document.title = 'Sổ tay cưới — ' + meta.brand;
  const h = location.hash.slice(1);
  if (['home', 'tasks', 'budget', 'guests', 'cal'].includes(h)) S.tab = h;
  try { await Promise.all([loadOverview(), loadTasks()]); } catch (e) { if (!e.status) return offline(); throw e; }
  bind();
  render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
})();
