// Bộ chọn ngày / giờ của Cưới Nha thay cho lịch có sẵn của trình duyệt (không đổi giao diện được).
// Tự gắn cho mọi <input type="date"> / <input type="time"> trên trang (kể cả ô vẽ sau): bấm vào ô là mở bảng chọn.
// Ô vẫn là input gốc → value, required, min/max, sự kiện input/change giữ nguyên, gõ tay vẫn được.
// Chỉ dùng trên máy có chuột; điện thoại giữ bánh xe chọn của máy (dễ bấm hơn).
(function () {
  if (window.__pickers || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  window.__pickers = 1;

  // ngày âm lịch dưới mỗi ô ngày: dùng /js/lunar.js (chưa có thì tự tải)
  if (!window.Lunar) { const s = document.createElement('script'); s.src = '/js/lunar.js'; s.onload = () => { if (pop && pop.dataset.kind === 'date') drawDate(); }; document.head.appendChild(s); }

  const css = document.createElement('style');
  css.textContent = `
input[type=date]::-webkit-calendar-picker-indicator,input[type=time]::-webkit-calendar-picker-indicator{opacity:0;cursor:pointer}
input[type=date],input[type=time]{cursor:pointer;background-repeat:no-repeat;background-position:right 12px center;background-size:18px}
input[type=date]{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23d6455d' stroke-width='1.8' stroke-linecap='round'%3E%3Crect x='3.5' y='5' width='17' height='15.5' rx='3'/%3E%3Cpath d='M3.5 10h17M8 3v4M16 3v4'/%3E%3C/svg%3E")}
input[type=time]{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23d6455d' stroke-width='1.8' stroke-linecap='round'%3E%3Ccircle cx='12' cy='12' r='8.5'/%3E%3Cpath d='M12 7.5V12l3 2'/%3E%3C/svg%3E")}
.cn-pick{position:fixed;z-index:2147483600;background:var(--surface,#fff);color:var(--ink,#1f1a1b);border:1px solid var(--line,#f0e4e5);border-radius:18px;
  box-shadow:0 18px 50px rgba(60,20,30,.18),0 2px 6px rgba(60,20,30,.06);padding:14px;font:500 14px/1.2 'Be Vietnam Pro',system-ui,sans-serif;
  animation:cnPick .16s cubic-bezier(.2,.8,.2,1);user-select:none}
@keyframes cnPick{from{opacity:0;transform:translateY(-6px) scale(.98)}}
.cn-pick button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
.cn-pick .hd{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}
.cn-pick .hd b{font-size:15px;font-weight:700}
.cn-pick .hd small{display:block;margin-top:3px;font-size:11.5px;font-weight:500;color:var(--muted,#6f6668)}
.cn-pick .nav{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:var(--primary-soft,#fff0f2);color:var(--primary,#d6455d);transition:filter .15s}
.cn-pick .nav:hover{filter:brightness(.95)}
.cn-pick .wk,.cn-pick .days{display:grid;grid-template-columns:repeat(7,42px);gap:2px}
.cn-pick .wk span{text-align:center;font-size:11.5px;font-weight:600;color:var(--muted,#6f6668);padding:4px 0}
.cn-pick .wk span:last-child,.cn-pick .d.sun{color:var(--primary,#d6455d)}
.cn-pick .d{height:42px;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;font-weight:600;font-size:14px;transition:background .12s}
.cn-pick .d i{font-style:normal;font-size:10px;font-weight:500;color:var(--muted,#6f6668)}
.cn-pick .d i.m1{color:var(--primary,#d6455d);font-weight:700}
.cn-pick .d:hover{background:var(--primary-soft,#fff0f2)}
.cn-pick .d.out{opacity:.35}
.cn-pick .d.today{box-shadow:inset 0 0 0 1.5px var(--primary,#d6455d)}
.cn-pick .d.on{background:var(--primary,#d6455d);color:#fff}.cn-pick .d.on i{color:rgba(255,255,255,.85)}
.cn-pick .d[disabled]{opacity:.25;cursor:not-allowed;background:none}
.cn-pick .ft{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid var(--line,#f0e4e5)}
.cn-pick .ft button{padding:7px 12px;border-radius:999px;font-weight:600;font-size:13px}
.cn-pick .ft .pri{background:var(--primary,#d6455d);color:#fff}
.cn-pick .ft .sec{color:var(--muted,#6f6668)}.cn-pick .ft .sec:hover{color:var(--ink,#1f1a1b)}
.cn-pick .chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;max-width:250px}
.cn-pick .chips button{padding:6px 10px;border-radius:999px;background:var(--primary-soft,#fff0f2);color:var(--primary,#d6455d);font-weight:600;font-size:13px}
.cn-pick .chips button.on{background:var(--primary,#d6455d);color:#fff}
.cn-pick .cols{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.cn-pick .col{position:relative;height:196px;overflow-y:auto;scrollbar-width:thin;padding:2px;display:flex;flex-direction:column;gap:2px}
.cn-pick .col h6{margin:0 0 4px;font-size:11.5px;font-weight:600;color:var(--muted,#6f6668);text-align:center;position:sticky;top:0;background:var(--surface,#fff);padding:2px 0}
.cn-pick .col button{padding:8px 0;border-radius:10px;font-weight:600;text-align:center}
.cn-pick .col button:hover{background:var(--primary-soft,#fff0f2)}
.cn-pick .col button.on{background:var(--primary,#d6455d);color:#fff}`;
  document.head.appendChild(css);

  const pad = (n) => String(n).padStart(2, '0');
  const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
  const todayIso = () => { const t = new Date(); return iso(t.getFullYear(), t.getMonth() + 1, t.getDate()); };
  const WK = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const ICON = (d) => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="${d}"/></svg>`;
  let pop = null, inp = null, view = null; // view: {y, m} tháng đang xem

  function set(v) {
    inp.value = v;
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function close() { if (pop) { pop.remove(); pop = null; inp = null; } }
  function place() {
    if (!pop || !inp) return;
    const r = inp.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    let top = r.bottom + 6; if (top + h > innerHeight - 8 && r.top - h - 6 > 8) top = r.top - h - 6;
    pop.style.top = Math.max(8, top) + 'px';
    pop.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px';
  }

  // ----- lịch -----
  function drawDate() {
    const { y, m } = view, v = inp.value, today = todayIso();
    const first = new Date(y, m - 1, 1), lead = (first.getDay() + 6) % 7, days = new Date(y, m, 0).getDate();
    const L = window.Lunar;
    const lun = (dd, mm, yy) => { if (!L) return ''; const l = L.solarToLunar(dd, mm, yy); return l.day === 1 ? `<i class="m1">${l.day}/${l.month}</i>` : `<i>${l.day}</i>`; };
    let am = '';
    if (L) { const a = L.solarToLunar(1, m, y), b = L.solarToLunar(days, m, y); am = `Tháng ${a.month}${a.month !== b.month ? `–${b.month}` : ''} âm lịch · ${L.canChiYear(a.year)}`; }
    let cells = '';
    for (let i = 0; i < 42; i++) {
      const dt = new Date(y, m - 1, 1 - lead + i), dd = dt.getDate(), mm = dt.getMonth() + 1, yy = dt.getFullYear(), id = iso(yy, mm, dd);
      if (i >= 35 && dt.getMonth() !== m - 1 && dt > new Date(y, m - 1, days)) break; // bỏ hàng cuối toàn ngày tháng sau
      const off = (inp.min && id < inp.min) || (inp.max && id > inp.max);
      cells += `<button type="button" class="d${mm !== m ? ' out' : ''}${dt.getDay() === 0 ? ' sun' : ''}${id === today ? ' today' : ''}${id === v ? ' on' : ''}" data-d="${id}"${off ? ' disabled' : ''}>${dd}${lun(dd, mm, yy)}</button>`;
    }
    pop.innerHTML = `<div class="hd"><button type="button" class="nav" data-mv="-1" aria-label="Tháng trước">${ICON('M15 18l-6-6 6-6')}</button>
      <div style="text-align:center"><b>Tháng ${m} · ${y}</b>${am ? `<small>${am}</small>` : ''}</div>
      <button type="button" class="nav" data-mv="1" aria-label="Tháng sau">${ICON('M9 18l6-6-6-6')}</button></div>
      <div class="wk">${WK.map((w) => `<span>${w}</span>`).join('')}</div><div class="days">${cells}</div>
      <div class="ft"><button type="button" class="sec" data-clear>${inp.required ? '' : 'Xoá'}</button><button type="button" class="pri" data-today>Hôm nay</button></div>`;
    place();
  }
  // ----- giờ -----
  const QUICK = ['08:00', '09:00', '10:00', '11:00', '17:00', '18:00', '18:30', '19:00'];
  function drawTime() {
    const [h, mi] = (inp.value || '').split(':');
    const hs = Array.from({ length: 24 }, (_, i) => pad(i)), ms = Array.from({ length: 12 }, (_, i) => pad(i * 5));
    if (mi && !ms.includes(mi)) ms.push(mi), ms.sort();
    pop.innerHTML = `<div class="chips">${QUICK.map((q) => `<button type="button" data-t="${q}"${q === inp.value ? ' class="on"' : ''}>${q}</button>`).join('')}</div>
      <div class="cols"><div class="col" data-col="h"><h6>Giờ</h6>${hs.map((x) => `<button type="button" data-h="${x}"${x === h ? ' class="on"' : ''}>${x}</button>`).join('')}</div>
      <div class="col" data-col="m"><h6>Phút</h6>${ms.map((x) => `<button type="button" data-m="${x}"${x === mi ? ' class="on"' : ''}>${x}</button>`).join('')}</div></div>
      <div class="ft"><button type="button" class="sec" data-clear>${inp.required ? '' : 'Xoá'}</button><button type="button" class="pri" data-done>Xong</button></div>`;
    pop.querySelectorAll('.col').forEach((c) => { const on = c.querySelector('.on'); if (on) c.scrollTop = on.offsetTop - c.clientHeight / 2 + on.offsetHeight / 2; });
    place();
  }

  function open(el) {
    if (inp === el && pop) return;
    close();
    inp = el;
    pop = document.createElement('div');
    pop.className = 'cn-pick'; pop.dataset.kind = el.type;
    // trong hộp thoại <dialog> (lớp trên cùng) thì gắn vào hộp đó, không bị che
    (el.closest('dialog[open]') || document.body).appendChild(pop);
    if (el.type === 'date') {
      const v = /^\d{4}-\d{2}-\d{2}$/.test(el.value) ? el.value : todayIso();
      view = { y: +v.slice(0, 4), m: +v.slice(5, 7) };
      drawDate();
    } else drawTime();
    pop.addEventListener('mousedown', (e) => e.preventDefault()); // giữ con trỏ trong ô
    pop.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      const ds = b.dataset;
      if (ds.mv) { view.m += +ds.mv; if (view.m < 1) { view.m = 12; view.y--; } if (view.m > 12) { view.m = 1; view.y++; } drawDate(); }
      else if (ds.d) { set(ds.d); close(); }
      else if (ds.today !== undefined) { set(todayIso()); close(); }
      else if (ds.clear !== undefined && b.textContent) { set(''); close(); }
      else if (ds.t) { set(ds.t); close(); }
      else if (ds.h) { const mi = (inp.value.split(':')[1]) || '00'; set(`${ds.h}:${mi}`); drawTime(); }
      else if (ds.m) { const h = (inp.value.split(':')[0]) || '18'; set(`${h}:${ds.m}`); close(); }
      else if (ds.done !== undefined) close();
    });
  }

  const isPick = (t) => t && t.tagName === 'INPUT' && (t.type === 'date' || t.type === 'time') && !t.disabled && !t.readOnly;
  document.addEventListener('click', (e) => {
    if (isPick(e.target)) { e.preventDefault(); open(e.target); return; }
    if (pop && !pop.contains(e.target)) close();
  }, true);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && pop) { e.stopPropagation(); close(); return; }
    // Alt+↓ / Enter mở bảng chọn thay vì lịch của trình duyệt
    if (isPick(e.target) && ((e.altKey && e.key === 'ArrowDown') || e.key === 'Enter')) { e.preventDefault(); open(e.target); }
    else if (pop && e.target === inp && e.key === 'Tab') close();
  }, true);
  // gõ tay vào ô ngày → lịch nhảy theo
  document.addEventListener('input', (e) => { if (pop && e.target === inp && inp.type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(inp.value)) { view = { y: +inp.value.slice(0, 4), m: +inp.value.slice(5, 7) }; drawDate(); } }, true);
  addEventListener('resize', place);
  addEventListener('scroll', (e) => { if (pop && !pop.contains(e.target)) { if (!inp || !inp.isConnected) close(); else place(); } }, true);
})();
