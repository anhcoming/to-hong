// Sổ tay cưới: tổng quan, việc cần làm, ngân sách, khách mời, lịch âm.
const S = { ov: null, tasks: [], budget: null, guests: null, tab: 'home', filter: 'todo', cal: null, sel: null, gq: '', gside: '' };
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

// ---------- đầu trang ----------
function renderHero() {
  const w = S.ov.wedding;
  const st = S.ov.stats;
  const pct = st.tasks ? Math.round((st.tasksDone / st.tasks) * 100) : 0;
  const d = w.date ? daysTo(w.date) : null;
  const ah = w.anhoi ? daysTo(w.anhoi) : null;
  $('#hero').innerHTML = `<div class="wrap">
    <div>
      <h1>${esc(names() || 'Sổ tay cưới của bạn')}</h1>
      <p class="sub">💍 ${w.date ? `Cưới ${dvn(w.date)} · ${esc(Lunar.lunarText(w.date))}` : 'Chưa chọn ngày cưới'} · ${esc(S.ov.regions[w.region])}</p>
      ${w.anhoi ? `<p class="sub" style="margin-top:2px">🎁 ${esc(evName('anhoi'))} ${dvn(w.anhoi)}${ah > 0 ? ` · còn ${ah} ngày` : ah === 0 ? ' · hôm nay!' : ''}</p>` : ''}
      <div class="prog" title="Tiến độ chuẩn bị"><i style="width:${pct}%"></i></div>
      <p class="sub" style="font-size:13px">Đã xong ${st.tasksDone}/${st.tasks} việc (${pct}%)</p>
    </div>
    <div style="display:flex;gap:16px;align-items:center">
      ${d !== null ? `<div class="count"><b>${d > 0 ? d : d === 0 ? '🎉' : '♥'}</b><span>${d > 0 ? 'ngày nữa' : d === 0 ? 'Hôm nay!' : 'đã cưới ' + -d + ' ngày'}</span></div>` : ''}
      <button class="gear" id="gear">⚙ Thông tin & thành viên</button>
    </div></div>`;
  $('#gear').onclick = settingsModal;
}

// ---------- tổng quan ----------
// việc chưa xong, hạn gần nhất trước (việc chưa có hạn để cuối)
function upcoming() {
  return S.tasks.filter((t) => !t.done).slice().sort((a, b) => (a.due || '9999') .localeCompare(b.due || '9999')).slice(0, 6);
}
function taskRow(t) {
  // Việc có hạn trước cả ngày tạo sổ tay (cưới gấp) → "Nên làm sớm", không dọa "Quá hạn"
  const started = new Date(S.ov.wedding.createdAt || Date.now()).toISOString().slice(0, 10);
  const pastDue = t.due && !t.done && t.due < todayIso();
  const late = pastDue && t.due >= started;
  const soon = pastDue && !late;
  const cta = t.cta && CTA[t.cta];
  return `<div class="task ${t.done ? 'done' : ''}" data-t="${t.id}">
    <button class="ck" data-ck="${t.id}" aria-label="${t.done ? 'Bỏ đánh dấu' : 'Đánh dấu xong'}">${t.done ? '✓' : ''}</button>
    <div class="body">
      <div class="tt" data-edit="${t.id}">${esc(t.title)}</div>
      <div class="meta">
        ${t.due ? (soon ? '<span class="soon">Nên làm sớm</span>' : `<span class="${late ? 'late' : ''}">${late ? 'Quá hạn · ' : ''}${dvn(t.due)}</span>`) : `<span>${relText(t)}</span>`}
        ${S.tab !== 'tasks' ? `<span class="chip">${EV_ICON[t.event] || ''} ${esc(evName(t.event))}</span>` : `<span class="chip">${esc(t.category)}</span>`}
        ${t.assignee ? `<span>👤 ${esc(memberName(t.assignee))}</span>` : ''}
        ${t.note ? '<span>📝</span>' : ''}
      </div>
      ${cta && !t.done ? `<div class="cta"><button class="btn sm soft" data-cta="${t.cta}">${cta[0]} →</button></div>` : ''}
    </div></div>`;
}

// "trước lễ ăn hỏi 30 ngày" khi lễ chưa có ngày
function relText(t) {
  const o = t.offset;
  const base = t.event === 'sau' ? 'ngày cưới' : evName(t.event).toLowerCase();
  if (o === 0) return 'Đúng ' + base;
  const n = Math.abs(o);
  const span = n >= 60 ? `~${Math.round(n / 30)} tháng` : `${n} ngày`;
  return `${o < 0 ? 'Trước' : 'Sau'} ${base} ${span}`;
}

function productBox() {
  const c = S.ov.cards[0];
  const st = (s) => !s || !s.created ? '<span class="chip">Chưa tạo</span>' : s.paid ? '<span class="chip ok">Đã kích hoạt</span>' : s.expired ? '<span class="chip red">Hết dùng thử</span>' : '<span class="chip warn">Đang dùng thử</span>';
  const cardSt = c ? (c.paid ? '<span class="chip ok">Đã kích hoạt</span>' : c.status === 'published' ? '<span class="chip warn">Đã phát hành · dùng thử</span>' : '<span class="chip">Bản nháp</span>') : '<span class="chip">Chưa tạo</span>';
  return `<div class="grid g3">
    <div class="prod panel"><h3>💌 Thiệp cưới online</h3>${cardSt}<p>Link mời riêng từng khách, khách xác nhận là danh sách tự cập nhật.</p><button class="btn sm" data-cta="card">${c ? 'Mở thiệp' : 'Tạo thiệp'}</button></div>
    <div class="prod panel"><h3>✨ Màn hình LED</h3>${st(c && c.led)}<p>Trình chiếu tên đôi, ngày cưới, bố mẹ hai bên ở sảnh tiệc.</p><button class="btn sm plain" data-cta="led">${c && c.led.created ? 'Mở màn LED' : 'Tạo màn LED'}</button></div>
    <div class="prod panel"><h3>🎬 Video dạm ngõ</h3>${st(c && c.video)}<p>Video chiếu TV lặp liên tục, tải MP4 Full HD cắm USB.</p><button class="btn sm plain" data-cta="video">${c && c.video.created ? 'Mở video' : 'Làm video'}</button></div>
  </div>`;
}

function renderHome() {
  const w = S.ov.wedding, st = S.ov.stats, gs = st.guests;
  const needSetup = !w.couple.groom.name || !w.couple.bride.name || !w.date;
  const budget = w.budgetTotal || st.estimate;
  $('#main').innerHTML = `
    ${needSetup ? `<section class="sec onb panel"><h2 style="margin:0 0 6px">👋 Hai bạn cưới khi nào?</h2>
      <p class="muted" style="margin:0 0 14px">Điền tên và ngày — mình tự soạn sẵn danh sách những việc cần chuẩn bị trước lễ ăn hỏi và ngày cưới (đặt xe, hoa cưới, chụp ảnh cưới, tráp…). Hai bạn sửa, thêm, xoá thoải mái.</p>
      <form id="setup" class="grid g2">
        <label class="field"><span>Tên chú rể</span><input name="g" value="${esc(w.couple.groom.name)}" placeholder="Đức Minh" required></label>
        <label class="field"><span>Tên cô dâu</span><input name="b" value="${esc(w.couple.bride.name)}" placeholder="Thu Hà" required></label>
        <label class="field"><span>💍 Ngày cưới</span><input name="d" type="date" value="${esc(w.date)}"><small>Chưa chốt cũng được, đổi sau</small></label>
        <label class="field"><span>🎁 Ngày ăn hỏi / đám hỏi</span><input name="a" type="date" value="${esc(w.anhoi)}"><small>Không bắt buộc</small></label>
        <label class="field"><span>Phong tục theo</span><select name="r">${Object.entries(S.ov.regions).map(([k, v]) => `<option value="${k}" ${w.region === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <div style="align-self:end"><button class="btn lg">Soạn danh sách việc →</button></div>
      </form></section>` : ''}
    <section class="sec"><h2>Việc sắp tới <button class="btn sm plain" data-go="tasks">Xem tất cả</button></h2>
      ${upcoming().map(taskRow).join('') || '<p class="empty panel">Bạn đã xong hết việc 🎉</p>'}
    </section>
    <section class="sec"><h2>Ngân sách <button class="btn sm plain" data-go="budget">Chi tiết</button></h2>
      <div class="panel" style="padding:16px">
        <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:8px"><span>Thực chi <b>${vnd(st.actual)}</b></span><span class="muted">${budget ? 'trên ' + vnd(budget) : 'chưa đặt ngân sách'}</span></div>
        <div class="bar"><i class="${budget && st.actual > budget ? 'over' : ''}" style="width:${budget ? Math.min(100, (st.actual / budget) * 100) : 0}%"></i></div>
        <div class="grid g3" style="margin-top:12px;font-size:13px"><div><span class="muted">Dự kiến</span><br><b>${vnd(st.estimate)}</b></div><div><span class="muted">Đã trả</span><br><b>${vnd(st.paid)}</b></div><div><span class="muted">Tiền mừng nhận</span><br><b>${vnd(gs.gifts)}</b></div></div>
      </div>
    </section>
    <section class="sec"><h2>Khách mời <button class="btn sm plain" data-go="guests">Danh sách</button></h2>
      <div class="grid g4">
        <div class="stat panel"><span>Khách / người</span><b>${gs.total}</b> <small>/ ${gs.people} người</small></div>
        <div class="stat panel"><span>Nhà trai / gái</span><b>${gs.trai} / ${gs.gai}</b></div>
        <div class="stat panel"><span>Xác nhận đến</span><b>${gs.yesPeople}</b> <small>người</small></div>
        <div class="stat panel"><span>Ước tính mâm (10 người)</span><b>${Math.ceil((gs.yesPeople || gs.people) / 10)}</b></div>
      </div>
    </section>
    <section class="sec"><h2>Sản phẩm cho ngày cưới</h2>${productBox()}</section>`;
  const f = $('#setup');
  if (f) f.onsubmit = async (e) => {
    e.preventDefault();
    const b = { couple: { groom: { name: f.g.value }, bride: { name: f.b.value } }, date: f.d.value, anhoi: f.a.value, region: f.r.value };
    S.ov = await api('/api/wedding', { method: 'PUT', body: b });
    await loadTasks();
    toast('Đã soạn danh sách việc — hạn chót tính theo ngày của từng lễ');
    go('tasks');
  };
}

// ---------- việc cần làm ----------
// Danh sách việc chia theo từng lễ: dạm ngõ → ăn hỏi → cưới → sau cưới
function renderTasks() {
  const show = (t) => S.filter === 'all' || (S.filter === 'todo' ? !t.done : t.done);
  const blocks = EVENTS.map((e) => {
    const all = S.tasks.filter((t) => t.event === e);
    if (!all.length) return '';
    const items = all.filter(show);
    const done = all.filter((t) => t.done).length;
    const date = evDate(e);
    const dl = date ? daysTo(date) : null;
    return `<section class="evb">
      <div class="evh">
        <div><b>${EV_ICON[e]} ${esc(e === 'sau' ? 'Sau ngày cưới' : evName(e))}</b>
          <span class="muted">${e === 'sau' ? '' : date ? ` · ${dvn(date)}${dl > 0 ? ` · còn ${dl} ngày` : dl === 0 ? ' · hôm nay' : ''}` : ''}</span>
          ${e !== 'sau' && !date ? `<button class="btn sm soft" data-setdate="${e}">Chọn ngày ${esc(evName(e).toLowerCase())}</button>` : ''}
        </div>
        <span class="evc">${done}/${all.length} xong</span>
      </div>
      <div class="bar" style="margin:0 0 10px"><i style="width:${all.length ? (done / all.length) * 100 : 0}%;background:var(--ok)"></i></div>
      ${items.map(taskRow).join('') || `<p class="muted" style="font-size:14px;margin:6px 0 10px">${S.filter === 'todo' ? 'Xong hết rồi 🎉' : 'Chưa có việc nào ở đây.'}</p>`}
      <button class="btn sm plain" data-addev="${e}">+ Thêm việc cho ${esc(e === 'sau' ? 'sau cưới' : evName(e).toLowerCase())}</button>
    </section>`;
  }).join('');
  $('#main').innerHTML = `
    <div class="filters">
      <button data-f="todo" class="${S.filter === 'todo' ? 'on' : ''}">Chưa xong (${S.tasks.filter((t) => !t.done).length})</button>
      <button data-f="done" class="${S.filter === 'done' ? 'on' : ''}">Đã xong (${S.tasks.filter((t) => t.done).length})</button>
      <button data-f="all" class="${S.filter === 'all' ? 'on' : ''}">Tất cả</button>
      <span style="flex:1"></span>
      <button class="btn sm plain" id="reseed" title="Thêm lại các việc gợi ý đã xoá">↺ Khôi phục gợi ý</button>
    </div>
    <p class="muted" style="font-size:13px;margin:-4px 0 14px">Danh sách soạn sẵn theo phong tục ${esc(S.ov.regions[S.ov.wedding.region])}. Bấm vào tên việc để sửa, xoá hoặc đổi hạn; bấm vòng tròn khi đã xong.</p>
    ${blocks}`;
}

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

// ---------- ngân sách ----------
function renderBudget() {
  const B = S.budget;
  const sum = (f, arr = B.items) => arr.reduce((n, x) => n + x[f], 0);
  const est = sum('estimate'), act = sum('actual'), paid = sum('paid');
  const cap = B.total || est;
  const cats = [...new Set([...S.ov.budgetCats, ...B.items.map((i) => i.category)])];
  const row = (i) => `<div class="bitem" data-b="${i.id}">
      <span class="nm" title="${esc(i.note)}">${esc(i.name)}</span>
      <label><small>Dự kiến</small><input inputmode="numeric" data-k="estimate" value="${fm(i.estimate)}" placeholder="0"></label>
      <label><small>Thực chi</small><input inputmode="numeric" data-k="actual" value="${fm(i.actual)}" placeholder="0"></label>
      <label><small>Đã trả</small><input inputmode="numeric" data-k="paid" value="${fm(i.paid)}" placeholder="0"></label>
      <button class="icon-btn" data-bedit="${i.id}" title="Sửa">✎</button></div>`;
  $('#main').innerHTML = `
    <section class="sec panel" style="padding:16px">
      <div class="grid g4">
        <label class="stat" style="padding:0"><span>Tổng ngân sách</span><input class="input" id="btotal" inputmode="numeric" value="${fm(B.total)}" placeholder="VD: 300.000.000" style="font-weight:700"></label>
        <div class="stat" style="padding:0"><span>Dự kiến</span><b>${vnd(est)}</b></div>
        <div class="stat" style="padding:0"><span>Thực chi</span><b>${vnd(act)}</b></div>
        <div class="stat" style="padding:0"><span>Còn phải trả</span><b>${vnd(Math.max(0, act - paid))}</b></div>
      </div>
      <div class="bar" style="margin-top:14px"><i class="${cap && act > cap ? 'over' : ''}" style="width:${cap ? Math.min(100, (act / cap) * 100) : 0}%"></i></div>
      <p class="muted" style="font-size:13px;margin:8px 0 0">${cap ? (act > cap ? `⚠ Vượt ngân sách ${vnd(act - cap)}` : `Còn ${vnd(cap - act)} so với ${B.total ? 'ngân sách' : 'dự kiến'}`) : 'Nhập tổng ngân sách để theo dõi.'} · Tiền mừng đã ghi nhận: <b>${vnd(B.gifts)}</b>${B.gifts ? ` → chênh lệch sau cưới: <b>${B.gifts - act >= 0 ? '+' : '−'}${vnd(Math.abs(B.gifts - act))}</b>` : ''}</p>
    </section>
    <div class="bhead"><span>Khoản chi</span><span>Dự kiến</span><span>Thực chi</span><span>Đã trả</span><span></span></div>
    ${cats.map((c) => {
      const items = B.items.filter((i) => i.category === c);
      return `<div class="bcat"><h3>${esc(c)} <span>${vnd(sum('actual', items) || sum('estimate', items))}</span></h3>${items.map(row).join('')}
        <button class="btn sm plain" data-badd="${esc(c)}">+ Thêm khoản</button></div>`;
    }).join('')}`;
}

function budgetModal(item, category) {
  const isNew = !item;
  item = item || { name: '', category: category || 'Khác', note: '' };
  openModal(`<h2>${isNew ? 'Thêm khoản chi' : 'Sửa khoản chi'}</h2>
    <form id="bf" style="margin-top:14px">
      <label class="field"><span>Tên khoản</span><input name="name" value="${esc(item.name)}" required maxlength="100"></label>
      <label class="field"><span>Nhóm</span><input name="category" list="bcats" value="${esc(item.category)}" maxlength="40"><datalist id="bcats">${S.ov.budgetCats.map((c) => `<option value="${esc(c)}">`).join('')}</datalist></label>
      <label class="field"><span>Ghi chú (nhà cung cấp, số điện thoại…)</span><textarea name="note" rows="2" maxlength="300">${esc(item.note)}</textarea></label>
      <div style="display:flex;gap:8px;justify-content:space-between">${isNew ? '<span></span>' : '<button type="button" class="btn danger" id="bdel">Xoá</button>'}<button class="btn">Lưu</button></div>
    </form>`, (box, close) => {
    $('#bf', box).onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target;
      const body = { name: f.name.value, category: f.category.value, note: f.note.value };
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

// ---------- khách mời ----------
function renderGuests() {
  const G = S.guests;
  const s = G.stats;
  const q = S.gq.trim().toLowerCase();
  const list = G.guests.filter((g) => (!q || g.name.toLowerCase().includes(q) || (g.group || '').toLowerCase().includes(q)) && (!S.gside || g.side === S.gside));
  const rs = (g) => g.rsvp ? (g.rsvp.attending === 'yes' ? `<span class="chip ok">Đến · ${g.rsvp.count}</span>` : '<span class="chip red">Không đến</span>') : g.invited ? '<span class="chip warn">Đã mời</span>' : '<span class="chip">Chưa mời</span>';
  $('#main').innerHTML = `
    <div class="grid g4 sec">
      <div class="stat panel"><span>Khách</span><b>${s.total}</b> <small>/ ${s.people} người</small></div>
      <div class="stat panel"><span>Nhà trai / gái</span><b>${s.trai} / ${s.gai}</b> <small>người</small></div>
      <div class="stat panel"><span>Xác nhận đến</span><b>${s.yesPeople}</b> <small>người · ${s.no} không đến</small></div>
      <div class="stat panel"><span>Tiền mừng</span><b>${vnd(s.gifts)}</b></div>
    </div>
    <div class="tools">
      <input class="input" id="gq" placeholder="Tìm tên hoặc nhóm…" value="${esc(S.gq)}">
      <select class="input" id="gside" style="flex:0 0 auto;width:auto"><option value="">Cả hai nhà</option><option value="trai" ${S.gside === 'trai' ? 'selected' : ''}>Nhà trai</option><option value="gai" ${S.gside === 'gai' ? 'selected' : ''}>Nhà gái</option></select>
      <button class="btn" id="gadd">+ Thêm khách</button>
      ${G.guests.length ? '<a class="btn plain" href="/api/wedding/guests.csv">Tải Excel</a>' : ''}
    </div>
    <p class="muted" style="font-size:13px;margin:0 0 10px">Gửi link mời có tên riêng từng khách: mở thiệp → tab <b>Khách mời</b>. Khách xác nhận trên thiệp sẽ tự cập nhật vào đây.</p>
    <div class="glist">${list.map((g) => `
      <div class="guest" data-g="${g.id}">
        <div><div class="nm" data-gedit="${g.id}">${esc(g.name)}</div><div class="meta">${g.side === 'trai' ? 'Nhà trai' : g.side === 'gai' ? 'Nhà gái' : 'Chung'}${g.group ? ' · ' + esc(g.group) : ''} · ${g.count} người</div></div>
        <div>${rs(g)}</div>
        <div class="giftbox"><input class="gift" inputmode="numeric" data-gift="${g.id}" value="${fm(g.gift)}" placeholder="Tiền mừng"></div>
      </div>`).join('') || `<p class="empty panel">${G.guests.length ? 'Không có khách khớp bộ lọc.' : 'Chưa có khách nào. Bấm "Thêm khách" — dán cả danh sách một lần cũng được.'}</p>`}</div>`;
  $('#gq').oninput = (e) => { S.gq = e.target.value; const pos = e.target.selectionStart; renderGuests(); const el = $('#gq'); el.focus(); el.setSelectionRange(pos, pos); };
  $('#gside').onchange = (e) => { S.gside = e.target.value; renderGuests(); };
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

// ---------- lịch âm ----------
function renderCal() {
  const w = S.ov.wedding;
  if (!S.cal) { const base = w.date || todayIso(); S.cal = { y: +base.slice(0, 4), m: +base.slice(5, 7) }; }
  const { y, m } = S.cal;
  const first = new Date(Date.UTC(y, m - 1, 1));
  const start = (first.getUTCDay() + 6) % 7; // tuần bắt đầu Thứ Hai
  const dueSet = new Set(S.tasks.filter((t) => t.due && !t.done).map((t) => t.due));
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(Date.UTC(y, m - 1, 1 - start + i));
    const iso = d.toISOString().slice(0, 10);
    const l = Lunar.solarToLunar(d.getUTCDate(), d.getUTCMonth() + 1, d.getUTCFullYear());
    cells.push(`<div class="day ${d.getUTCMonth() !== m - 1 ? 'out' : ''} ${iso === todayIso() ? 'today' : ''} ${iso === w.date || iso === w.anhoi || iso === w.damngo ? 'wed' : ''} ${iso === S.sel ? 'sel' : ''} ${d.getUTCDay() === 0 ? 'sun' : ''}" data-day="${iso}">
      <span class="s">${d.getUTCDate()}</span><span class="l ${l.day === 1 || l.day === 15 ? 'm1' : ''}">${l.day === 1 ? `1/${l.month}${l.leap ? 'N' : ''}` : l.day}</span>${dueSet.has(iso) ? '<i class="dot"></i>' : ''}</div>`);
    if (i === 34 && new Date(Date.UTC(y, m - 1, 1 - start + 35)).getUTCMonth() !== m - 1) break; // bỏ hàng cuối thừa
  }
  const sel = S.sel;
  let detail = '';
  if (sel) {
    const [sy, sm, sd] = sel.split('-').map(Number);
    const tasks = S.tasks.filter((t) => t.due === sel);
    const wd = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][new Date(Date.UTC(sy, sm - 1, sd)).getUTCDay()];
    detail = `<div class="panel" style="padding:16px;margin-top:14px">
      <b>${wd}, ${dvn(sel)}</b>
      <p style="margin:4px 0">${esc(Lunar.lunarText(sel))} · ngày ${esc(Lunar.canChiDay(sd, sm, sy))}</p>
      ${tasks.length ? `<p class="muted" style="margin:8px 0 4px;font-size:13px">Hạn chót trong ngày:</p>${tasks.map(taskRow).join('')}` : ''}
      ${sel === w.date ? '<p class="chip red" style="margin-top:8px">💍 Ngày cưới của bạn ♥</p>' : sel === w.anhoi ? `<p class="chip warn" style="margin-top:8px">🎁 ${esc(evName('anhoi'))}</p>` : sel === w.damngo ? `<p class="chip warn" style="margin-top:8px">🤝 ${esc(evName('damngo'))}</p>`
        : `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button class="btn sm soft" id="setDate" data-f2="date">Chọn làm ngày cưới</button><button class="btn sm plain" id="setDate2" data-f2="anhoi">Chọn làm ngày ${esc(evName('anhoi').toLowerCase())}</button></div>`}
    </div>`;
  }
  $('#main').innerHTML = `
    <div class="cal-h"><button class="btn sm plain" data-mv="-1">‹ Tháng trước</button><b>Tháng ${m}/${y}</b><button class="btn sm plain" data-mv="1">Tháng sau ›</button></div>
    <div class="cal">${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => `<div class="wd">${d}</div>`).join('')}${cells.join('')}</div>
    <p class="muted" style="font-size:12px;margin:10px 0 0">Số nhỏ là ngày âm lịch (1/11 = mùng 1 tháng 11). Chấm vàng: hạn chót việc cần làm. Bấm một ngày để xem can chi.</p>
    ${detail}`;
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
  if (!card) card = (await api('/api/cards', { method: 'POST', body: { template: 'coban' } })).card;
  location.href = `/${c[1]}/${card.id}`;
}

// ---------- sự kiện chung ----------
let moneyTimer = {};
function bind() {
  $('#ptabs').onclick = (e) => { const b = e.target.closest('button'); if (b) go(b.dataset.tab); };
  const main = $('#main');
  main.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-ck],[data-edit],[data-cta],[data-go],[data-f],#addTask,[data-addev],[data-setdate],#reseed,[data-badd],[data-bedit],#gadd,[data-gedit],[data-mv],[data-day],#setDate,#setDate2');
    if (!b) return;
    const d = b.dataset;
    try {
      if (d.ck) {
        const t = S.tasks.find((x) => x.id === d.ck);
        t.done = !t.done;
        render();
        await api(`/api/tasks/${t.id}`, { method: 'PUT', body: { done: t.done } });
        await loadOverview(); renderHero();
        if (t.done) toast('Xong một việc ✓');
      } else if (d.edit) taskModal(S.tasks.find((x) => x.id === d.edit));
      else if (d.cta) await cta(d.cta);
      else if (d.go) go(d.go);
      else if (d.f) { S.filter = d.f; render(); }
      else if (b.id === 'addTask') taskModal(null);
      else if (d.addev) taskModal(null, d.addev);
      else if (d.setdate) dateModal(d.setdate);
      else if (b.id === 'reseed') {
        if (!confirm('Thêm lại các việc gợi ý đã xoá? Việc bạn tự thêm và việc đã xong được giữ nguyên.')) return;
        await api('/api/wedding/tasks/reseed', { method: 'POST' });
        await reloadAll(); toast('Đã khôi phục danh sách gợi ý');
      }
      else if (d.badd !== undefined) budgetModal(null, d.badd);
      else if (d.bedit) budgetModal(S.budget.items.find((x) => x.id === d.bedit));
      else if (b.id === 'gadd') guestModal(null);
      else if (d.gedit) guestModal(S.guests.guests.find((x) => x.id === d.gedit));
      else if (d.mv) { S.cal.m += +d.mv; if (S.cal.m < 1) { S.cal.m = 12; S.cal.y--; } if (S.cal.m > 12) { S.cal.m = 1; S.cal.y++; } render(); }
      else if (d.day) { S.sel = d.day; render(); }
      else if (b.id === 'setDate' || b.id === 'setDate2') {
        const fld = b.dataset.f2;
        const label = fld === 'date' ? 'ngày cưới' : 'ngày ' + evName('anhoi').toLowerCase();
        if (!confirm(`Đặt ${dvn(S.sel)} làm ${label}? Hạn chót các việc sẽ tính lại theo ngày này.`)) return;
        S.ov = await api('/api/wedding', { method: 'PUT', body: { [fld]: S.sel } });
        await loadTasks(); render(); toast(`Đã đặt ${label} ♥`);
      }
    } catch (err) { toast(err.message, true); }
  });
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
        if (t.id === 'btotal') { S.ov = await api('/api/wedding', { method: 'PUT', body: { budgetTotal: n } }); S.budget.total = n; }
        else if (t.dataset.gift) { const g = S.guests.guests.find((x) => x.id === t.dataset.gift); g.gift = n; await api(`/api/guests/${g.id}`, { method: 'PUT', body: { gift: n } }); S.guests.stats = (await api('/api/wedding/guests')).stats; }
        else { const id = t.closest('[data-b]').dataset.b; const it = S.budget.items.find((x) => x.id === id); it[t.dataset.k] = n; await api(`/api/budget/${id}`, { method: 'PUT', body: { [t.dataset.k]: n } }); }
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

(async () => {
  const { user, meta } = await renderTopbar('planner');
  if (!user) return (location.href = '/dang-nhap?dang-ky=1&next=/so-tay');
  S.me = user;
  document.title = 'Sổ tay cưới — ' + meta.brand;
  const h = location.hash.slice(1);
  if (['home', 'tasks', 'budget', 'guests', 'cal'].includes(h)) S.tab = h;
  await Promise.all([loadOverview(), loadTasks()]);
  bind();
  render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
})();
