// Quản trị › Duyệt bài MXH (/admin#mxh): Claude soạn bài Facebook / TikTok, chủ web xem từng bài rồi Duyệt / Làm lại / Bỏ.
// Bố cục 3 cột: danh sách bài theo ngày | xem trước như trên Facebook / TikTok | chi tiết + nút. Điện thoại: dải bài cuộn ngang.
// Nạp TRƯỚC admin.js (admin.js gom hàm mxh() vào VIEWS).
const MX = { posts: [], lo: null, cur: null, view: 'facebook', redo: false, pick: {}, timer: null };
const MX_ST = { 'cho-duyet': 'Chờ duyệt', 'lam-lai': 'Chờ Claude làm lại', 'dang-lam': 'Claude đang làm lại', 'da-duyet': 'Đã duyệt · chờ hẹn giờ', 'da-hen-gio': 'Đã hẹn giờ', 'da-dang': 'Đã đăng', 'bo': 'Đã bỏ' };
const MX_SHORT = { 'cho-duyet': 'chờ duyệt', 'lam-lai': 'chờ làm lại', 'dang-lam': 'đang làm lại', 'da-duyet': 'đã duyệt', 'da-hen-gio': 'đã hẹn giờ', 'da-dang': 'đã đăng', 'bo': 'đã bỏ' };
const MX_KENH = { facebook: 'Facebook', tiktok: 'TikTok' };
const MX_LINK = {
  page: 'https://www.facebook.com/profile.php?id=61596458112587',
  bs: 'https://business.facebook.com/latest/content_calendar?asset_id=1450504924816576',
  tts: 'https://www.tiktok.com/tiktokstudio/content',
  ttp: 'https://www.tiktok.com/@thiepcuoionlinecuoinha',
};
const MX_DAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const MX_DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MX_AVA = '<svg viewBox="0 0 1080 1080" aria-hidden="true"><circle cx="540" cy="540" r="540" fill="#d6455d"/><circle cx="440" cy="620" r="200" fill="none" stroke="#fff" stroke-width="56"/><circle cx="640" cy="620" r="200" fill="none" stroke="#ffd9df" stroke-width="56"/><path d="M 491.8 426.8 A 200 200 0 0 1 581.4 478.6" fill="none" stroke="#fff" stroke-width="56"/></svg>';

const mxSt = (p) => p.trangThai || 'cho-duyet';
const mxSafe = (u) => (/^(https:\/\/|\/uploads\/)/.test(u || '') ? u : '');
function mxKey(x) { return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }
function mxRel(d) {
  const t = new Date();
  if (d === mxKey(t)) return 'Hôm nay';
  t.setDate(t.getDate() + 1); if (d === mxKey(t)) return 'Ngày mai';
  t.setDate(t.getDate() - 2); if (d === mxKey(t)) return 'Hôm qua';
  return '';
}
function mxWhen(iso) {
  if (!iso) return '';
  const [d, t] = iso.split('T'); const [y, m, dd] = d.split('-').map(Number);
  return (mxRel(d) || MX_DOW[new Date(y, m - 1, dd).getDay()] + ' ' + dd + '/' + m) + (t ? ' · ' + t.slice(0, 5) : '');
}
function mxDay(d) { if (!d) return 'Chưa có ngày'; const [y, m, dd] = d.split('-').map(Number); return (mxRel(d) || MX_DAYS[new Date(y, m - 1, dd).getDay()]) + ' ' + dd + '/' + m; }
const mxSorted = () => MX.posts.filter((p) => p.lo === MX.lo).sort((a, b) => (a.gio || '').localeCompare(b.gio || '') || (a.stt || 0) - (b.stt || 0));
function mxNext(id) {
  const all = mxSorted(), i = all.findIndex((p) => p.id === id);
  for (let k = 1; k < all.length; k++) { const p = all[(i + k) % all.length]; if (mxSt(p) === 'cho-duyet') return p.id; }
  return id;
}

async function mxh() {
  const d = await api('/api/admin/mxh');
  MX.posts = d.posts || [];
  mxBadge(d.waiting);
  A.reload = mxReload;
  mxRender();
  clearInterval(MX.timer);
  // Claude cập nhật bài từ máy khác → tải lại mỗi phút khi đang mở trang này
  MX.timer = setInterval(() => { if (A.page !== 'mxh') return clearInterval(MX.timer); if (!document.hidden && !MX.redo) mxReload().catch(() => {}); }, 60e3);
}
async function mxReload() {
  const d = await api('/api/admin/mxh', { quiet: true });
  MX.posts = d.posts || [];
  mxBadge(d.waiting);
  if (A.page === 'mxh') mxRender();
}
function mxBadge(n) { const b = $('#mxhBadge'); if (b) { b.hidden = !n; b.textContent = n; } }

function mxThumb(p) {
  const im = (p.media || []).find((x) => x.kind === 'image');
  if (im) return `<img class="th" src="${esc(im.url)}" alt="" loading="lazy">`;
  const v = (p.media || []).find((x) => x.kind === 'video');
  if (v) return `<video class="th" src="${esc(v.url)}#t=1" preload="metadata" muted playsinline></video>`;
  return `<span class="th">${p.loai === 'Cần anh quay' ? '🎥' : '—'}</span>`;
}

function mxRender() {
  const v = $('#view');
  const los = [...new Set(MX.posts.map((p) => p.lo))].sort().reverse();
  if (!MX.posts.length) {
    v.innerHTML = `<div class="ph"><div><h1>Duyệt bài MXH</h1><p>Bài Facebook / TikTok Claude soạn sẵn. Bài chỉ được hẹn giờ sau khi bạn bấm Duyệt.</p></div></div>
      <p class="empty box" style="padding:28px">Chưa có bài nào. Sáng thứ Hai Claude soạn lô mới và đưa vào đây để bạn duyệt.</p>`;
    return;
  }
  if (!MX.lo || !los.includes(MX.lo)) MX.lo = los.find((l) => MX.posts.some((p) => p.lo === l && mxSt(p) === 'cho-duyet')) || los[0];
  const all = mxSorted();
  if (!all.some((p) => p.id === MX.cur)) MX.cur = (all.find((p) => mxSt(p) === 'cho-duyet') || all[0]).id;
  const cnt = {}; all.forEach((p) => { cnt[mxSt(p)] = (cnt[mxSt(p)] || 0) + 1; });
  const waiting = cnt['cho-duyet'] || 0;
  let last = '';
  const rail = all.map((p) => {
    const d = (p.gio || '').slice(0, 10), t = (p.gio || '').split('T')[1] || '';
    const head = d !== last ? `<div class="day">${esc(mxDay(d))}</div>` : ''; last = d;
    return head + `<button class="it s-${mxSt(p)}${p.id === MX.cur ? ' on' : ''}" data-mx="${esc(p.id)}">
      ${mxThumb(p)}<span><span class="t1"><span class="dot"></span><span class="dd">${esc(d ? (+d.slice(8, 10)) + '/' + (+d.slice(5, 7)) : '')}&nbsp;</span>${esc(t.slice(0, 5))}<span class="stt"> · ${esc(MX_SHORT[mxSt(p)] || '')}</span></span><span class="t2">${esc(p.tieuDe)}</span></span></button>`;
  }).join('');
  const p = all.find((x) => x.id === MX.cur);
  v.innerHTML = `<div class="ph"><div><h1>Duyệt bài MXH</h1><p>Bài chỉ được hẹn giờ sau khi bạn bấm Duyệt. Bấm Làm lại và ghi góp ý, Claude sửa rồi đưa lại.</p></div>
      <div class="r"><span class="mx-chips">${['cho-duyet', 'lam-lai', 'dang-lam', 'da-duyet', 'da-hen-gio', 'da-dang', 'bo'].filter((k) => cnt[k]).map((k) => `<span class="mx-pill s-${k}">${cnt[k]} ${esc(MX_SHORT[k])}</span>`).join('')}</span>
      ${waiting > 1 ? `<button class="btn plain" id="mxAll">Duyệt tất cả ${waiting} bài</button>` : ''}
      <select class="sel" id="mxLo" aria-label="Chọn lô bài">${los.map((l) => `<option value="${esc(l)}"${l === MX.lo ? ' selected' : ''}>${esc((MX.posts.find((x) => x.lo === l) || {}).loTen || l)}</option>`).join('')}</select></div></div>
    <div class="mx">
      <nav class="mx-rail" aria-label="Các bài trong lô">${rail}</nav>
      <section class="mx-pv" aria-label="Xem trước">${mxPreview(p)}</section>
      <section class="mx-dt" aria-label="Chi tiết bài">${mxDetail(p, all)}</section>
    </div>`;
  // cuộn riêng dải bài tới bài đang xem (không cuộn cả trang)
  const rl = $('.mx-rail'), on = $('.mx-rail .it.on');
  if (rl && on) { const a = on.getBoundingClientRect(), b = rl.getBoundingClientRect(); rl.scrollTop += a.top - b.top - (rl.clientHeight - a.height) / 2; rl.scrollLeft += a.left - b.left - (rl.clientWidth - a.width) / 2; }
  $('#mxLo').onchange = (e) => { MX.lo = e.target.value; MX.cur = null; MX.redo = false; mxRender(); };
  const allBtn = $('#mxAll');
  if (allBtn) allBtn.onclick = () => ask({
    title: 'Duyệt tất cả', ok: `Duyệt ${waiting} bài`, text: `Duyệt cả ${waiting} bài đang chờ trong lô này? Claude sẽ hẹn giờ đúng ngày giờ ghi trên từng bài.`,
    run: async () => { for (const x of mxSorted().filter((q) => mxSt(q) === 'cho-duyet')) await api(`/api/admin/mxh/${x.id}/act`, { method: 'POST', body: { act: 'duyet' }, quiet: true }); toast('Đã duyệt ' + waiting + ' bài'); await mxReload(); },
  });
}

function mxStage(p, tiktok) {
  const m = (p.media || []).filter((x) => mxSafe(x.url));
  if (!m.length) return `<div class="empty-m">${esc(p.moTaMedia || 'Chưa có ảnh / video')}</div>`;
  const vid = m.find((x) => x.kind === 'video');
  if (tiktok) {
    const x = vid || m[0];
    return `<div class="tt">${x.kind === 'video' ? `<video src="${esc(x.url)}" controls playsinline preload="metadata"></video>` : `<img src="${esc(x.url)}" alt="">`}
      <div class="ov"><b>@thiepcuoionlinecuoinha</b>${esc(p.caption)}</div></div>`;
  }
  if (vid) return `<div class="stage"><video src="${esc(vid.url)}" controls playsinline preload="metadata"></video></div>`;
  const i = Math.max(0, Math.min(MX.pick[p.id] || 0, m.length - 1));
  return `<div class="stage"><img src="${esc(m[i].url)}" alt="${esc(p.tieuDe)}, ảnh ${i + 1}">
    ${m.length > 1 ? `<span class="idx">${i + 1}/${m.length}</span>
    ${i > 0 ? `<button class="arr l" data-mximg="-1" aria-label="Ảnh trước">‹</button>` : ''}
    ${i < m.length - 1 ? `<button class="arr r" data-mximg="1" aria-label="Ảnh sau">›</button>` : ''}` : ''}</div>`;
}
function mxCut(c) {
  c = (c || '').split('\n').filter(Boolean).slice(0, 2).join(' ');
  return c.length > 130 ? c.slice(0, 125).replace(/\s+\S*$/, '') + '… Xem thêm' : c;
}
function mxPreview(p) {
  const kenh = p.kenh && p.kenh.length ? p.kenh : ['facebook'];
  if (!kenh.includes(MX.view)) MX.view = kenh[0];
  const tg = kenh.length > 1
    ? `<div class="seg" role="group" aria-label="Xem trước trên">${kenh.map((k) => `<button data-mxview="${k}" class="${k === MX.view ? 'on' : ''}">${MX_KENH[k] || k}</button>`).join('')}</div>`
    : `<span class="mx-kch">Xem trước trên ${MX_KENH[kenh[0]] || kenh[0]}</span>`;
  const body = MX.view === 'tiktok'
    ? `<div class="phone">${mxStage(p, true)}</div>`
    : `<div class="phone"><div class="fbh">${MX_AVA}<div><b>Thiệp Cưới Online - Cưới Nha</b><small>${esc(mxWhen(p.gio))} · 🌐</small></div></div>
       <div class="fbc">${esc(mxCut(p.caption))}</div>${mxStage(p, false)}<div class="fbf"><span>Thích</span><span>Bình luận</span><span>Chia sẻ</span></div></div>`;
  return tg + body;
}
function mxLinks(p) {
  const s = mxSt(p), k = p.kenh || ['facebook'], out = [];
  if (k.includes('facebook')) {
    const u = mxSafe(p.linkFacebook);
    if (u) out.push([u, 'Mở bài trên Facebook ↗']);
    else if (s === 'da-hen-gio') out.push([MX_LINK.bs, 'Xem lịch hẹn trên Business Suite ↗']);
    else if (s === 'da-dang') out.push([MX_LINK.page, 'Mở page Facebook ↗']);
  }
  if (k.includes('tiktok')) {
    const u = mxSafe(p.linkTiktok);
    if (u) out.push([u, 'Mở video trên TikTok ↗']);
    else if (s === 'da-hen-gio') out.push([MX_LINK.tts, 'Xem lịch hẹn trên TikTok Studio ↗']);
    else if (s === 'da-dang') out.push([MX_LINK.ttp, 'Mở kênh TikTok ↗']);
  }
  return out.map(([u, t]) => `<a class="btn soft" href="${esc(u)}" target="_blank" rel="noopener">${t}</a>`).join('');
}
function mxActions(p) {
  const s = mxSt(p);
  const box = (hint, label) => `<div class="mx-redo">${hint ? `<p class="muted">${hint}</p>` : ''}<textarea class="input" id="mxGy" rows="3" placeholder="Muốn sửa gì? Ví dụ: chữ to hơn, đổi nhạc vui hơn, bớt nói giá, đổi giờ sang 21:00…"></textarea>
      <div class="mx-acts"><button class="btn" data-mxact="gui">${label}</button><button class="btn plain" data-mxact="dong">Thôi</button></div></div>`;
  const fix = { 'da-duyet': 'Bài đã duyệt nhưng chưa hẹn giờ: Claude sửa xong sẽ đưa lại để bạn duyệt.', 'da-hen-gio': 'Bài đã hẹn giờ: Claude sửa bản hẹn trên Facebook / TikTok rồi đưa lại để bạn duyệt trước giờ đăng.', 'da-dang': 'Bài đã đăng: Facebook chỉ cho sửa chữ bài; đổi ảnh / video thì Claude sẽ hỏi bạn có đăng bài mới không. TikTok không sửa được sau khi đăng.' }[s];
  if (s === 'cho-duyet') return MX.redo ? box('', 'Gửi Claude làm lại')
    : `<button class="btn" data-mxact="duyet">Duyệt bài này</button><button class="btn soft" data-mxact="mo">Làm lại…</button><button class="btn plain" data-mxact="bo">Bỏ bài</button>`;
  if (fix) return MX.redo ? box(fix, 'Gửi Claude sửa')
    : `<button class="btn soft" data-mxact="mo">Sửa bài…</button>${s === 'da-duyet' ? '<button class="btn plain" data-mxact="huy">Huỷ duyệt</button>' : ''}`;
  if (s === 'lam-lai') return '<button class="btn plain" data-mxact="huy">Rút lại yêu cầu</button>';
  if (s === 'bo') return '<button class="btn plain" data-mxact="huy">Lấy lại bài</button>';
  return '';
}
function mxDetail(p, all) {
  const s = mxSt(p), i = all.indexOf(p), k = p.kenh || ['facebook'];
  const row = (a, b) => (b ? `<dt>${a}</dt><dd>${esc(b)}</dd>` : '');
  const lastC = [...(p.lichSu || [])].reverse().find((h) => h.ai === 'claude');
  const fb = (s === 'lam-lai' || s === 'dang-lam') && p.gopY ? `<div class="mx-fb"><b>Góp ý của bạn:</b> ${esc(p.gopY)}</div>`
    : s === 'cho-duyet' && p.lanSua > 0 && lastC ? `<div class="mx-fb"><b>Bản sửa lần ${p.lanSua}:</b> ${esc(lastC.noiDung || lastC.viec || '')}</div>` : '';
  const hist = (p.lichSu || []).slice().reverse();
  const prev = all[(i - 1 + all.length) % all.length].id, next = all[(i + 1) % all.length].id;
  return `<div class="box mx-card">
      <div class="mx-head s-${s}"><span class="mx-pill">${MX_ST[s] || s}</span>${p.nhom ? `<span class="mx-kch">${esc(p.nhom)}</span>` : ''}
        <span class="mx-nv"><button class="btn plain" data-mx="${esc(prev)}" aria-label="Bài trước">‹</button><span class="muted">${i + 1}/${all.length}</span><button class="btn plain" data-mx="${esc(next)}" aria-label="Bài sau">›</button></span>
        <h2>${esc(p.tieuDe)}</h2></div>
      <dl class="mx-facts">
        ${k.includes('facebook') ? row('Facebook', mxWhen(p.gio)) : ''}${k.includes('tiktok') ? row('TikTok', mxWhen(p.gioTiktok || p.gio)) : ''}
        ${row('Dạng', p.loai)}${row('Nhạc', p.nhac)}${row('Bình luận đầu', p.binhLuanDau)}${row('Ghi chú', p.ghiChu)}
      </dl>${fb}
      <div class="mx-foot">${mxActions(p)}${mxLinks(p)}</div>
    </div>
    <div class="box mx-card"><div class="mx-lbl">Chữ bài <button class="btn plain" data-mxact="chep">Chép</button></div><div class="mx-cap" id="mxCap">${esc(p.caption) || '—'}</div></div>
    ${p.moTaMedia && (p.media || []).length ? `<div class="box mx-card"><div class="mx-lbl">Ảnh / video</div><div class="mx-cap">${esc(p.moTaMedia)}</div></div>` : ''}
    ${hist.length ? `<div class="box mx-card"><div class="mx-lbl">Lịch sử</div><ol class="mx-hist">${hist.map((x) =>
      `<li>${esc(fmtDateTime(x.at))} · ${x.ai === 'claude' ? 'Claude' : 'Bạn'}: ${esc(x.viec)}${x.noiDung ? ' — ' + esc(x.noiDung) : ''}</li>`).join('')}</ol></div>` : ''}`;
}

function mxGo(id) { if (id !== MX.cur) { MX.cur = id; MX.redo = false; } mxRender(); }
async function mxAct(p, body, msg, next) {
  try {
    const r = await api(`/api/admin/mxh/${p.id}/act`, { method: 'POST', body });
    Object.assign(p, r.post);
    toast(msg);
    MX.redo = false;
    if (next) MX.cur = next;
    mxRender();
    mxBadge(MX.posts.filter((x) => mxSt(x) === 'cho-duyet').length);
  } catch (e) { toast(e.message, true); if (e.status === 409) mxReload().catch(() => {}); }
}

document.addEventListener('click', async (e) => {
  if (A.page !== 'mxh') return;
  const t = e.target.closest('[data-mx],[data-mxview],[data-mximg],[data-mxact]');
  if (!t) return;
  if (t.dataset.mx) return mxGo(t.dataset.mx);
  if (t.dataset.mxview) { MX.view = t.dataset.mxview; return mxRender(); }
  if (t.dataset.mximg) { MX.pick[MX.cur] = (MX.pick[MX.cur] || 0) + +t.dataset.mximg; return mxRender(); }
  const p = MX.posts.find((x) => x.id === MX.cur); if (!p) return;
  const a = t.dataset.mxact;
  if (a === 'mo') { MX.redo = true; mxRender(); const g = $('#mxGy'); if (g) g.focus(); return; }
  if (a === 'dong') { MX.redo = false; return mxRender(); }
  if (a === 'chep') {
    try { await navigator.clipboard.writeText(p.caption || ''); toast('Đã chép chữ bài'); }
    catch (x) { const r = document.createRange(); r.selectNodeContents($('#mxCap')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('Đã chọn chữ bài, bấm Cmd+C để chép'); }
    return;
  }
  if (a === 'gui') {
    const g = $('#mxGy').value.trim();
    if (!g) { $('#mxGy').focus(); return toast('Ghi góp ý để Claude biết sửa gì', true); }
    return mxAct(p, { act: 'lam-lai', gopY: g }, 'Đã gửi. Claude sẽ sửa rồi đưa lại để bạn duyệt', mxNext(p.id));
  }
  if (a === 'duyet') return mxAct(p, { act: 'duyet' }, 'Đã duyệt. Claude sẽ hẹn giờ bài này', mxNext(p.id));
  if (a === 'bo') return mxAct(p, { act: 'bo' }, 'Đã bỏ bài này', mxNext(p.id));
  if (a === 'huy') return mxAct(p, { act: 'huy' }, 'Đã đưa bài về trạng thái trước');
});
document.addEventListener('keydown', (e) => {
  if (A.page !== 'mxh' || /TEXTAREA|INPUT|SELECT/.test(e.target.tagName) || e.altKey || e.metaKey || e.ctrlKey || $('.ov,.dr')) return;
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
  const all = mxSorted(), i = all.findIndex((p) => p.id === MX.cur); if (i < 0) return;
  e.preventDefault();
  mxGo(all[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + all.length) % all.length].id);
});
