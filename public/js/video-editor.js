// Trình sửa video dạm ngõ: chỉnh nội dung từng cảnh, xem trước trực tiếp trên canvas, quay & xuất MP4.
const CARD_ID = location.pathname.split('/').pop();
let card, META, video, engine;
let saveTimer = null, saving = false, again = false, lastInput = null;

const SWATCH = { sen: 'linear-gradient(135deg,#6a0d16,#2a0308)', dao: 'linear-gradient(135deg,#fffaf6,#f0c9cf)', may: 'linear-gradient(135deg,#86121b,#3d0509)' };

function info() {
  const fam = (p) => [p.father, p.mother].filter(Boolean).join(' – ');
  const d = card.data;
  return { chu_re: d.groom.name, co_dau: d.bride.name, bo_me_trai: fam(d.groom), bo_me_gai: fam(d.bride) };
}
function status(t) { $('#saved').textContent = t; }
function refresh() { engine.set(video, info()); renderJump(); }

// ---------- giao diện ----------
function renderSide() {
  const ev = video.event;
  const fontSel = (v) => META.video.fonts.map((f) => `<option value="${f.id}" ${v === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('');
  const lineRow = (l, si, li) => `
    <div class="ln" data-si="${si}" data-li="${li}">
      <input type="text" data-f="text" value="${esc(l.text)}" maxlength="120" placeholder="Nội dung dòng chữ">
      <div class="row">
        <select data-f="font" title="Kiểu chữ">${fontSel(l.font)}</select>
        cỡ <input type="number" data-f="size" min="20" max="220" step="2" value="${l.size}">
        <label title="Màu chữ — bỏ chọn để dùng màu của mẫu" style="display:flex;align-items:center;gap:4px"><input type="checkbox" data-f="custom" ${l.color ? 'checked' : ''}>màu riêng</label>
        <input type="color" data-f="color" value="${l.color || '#ffffff'}" ${l.color ? '' : 'disabled'}>
      </div>
      <div class="tools" style="grid-row:2;grid-column:2">
        <button data-a="up" title="Lên trên">↑</button><button data-a="down" title="Xuống dưới">↓</button><button data-a="del" title="Xoá dòng">×</button>
      </div>
    </div>`;
  $('#side').innerHTML = `
    <section class="group panel"><h3>Buổi lễ</h3>
      <div class="grid2">
        <label class="field"><span>Tên buổi lễ</span><input list="kinds" data-e="kind" value="${esc(ev.kind)}" maxlength="40"><datalist id="kinds">${META.video.kinds.map((k) => `<option value="${esc(k)}">`).join('')}</datalist></label>
        <label class="field"><span>Địa điểm</span><input data-e="place" value="${esc(ev.place)}" maxlength="100" placeholder="Tư gia nhà gái"></label>
        <label class="field"><span>Ngày (dương lịch)</span><input type="date" data-e="date" value="${esc(ev.date)}"></label>
        <label class="field"><span>Giờ</span><input type="time" data-e="time" value="${esc(ev.time)}"></label>
      </div>
      <p class="muted" style="font-size:13px;margin:0">Ngày âm lịch tự tính. Tên cô dâu chú rể, bố mẹ lấy từ thiệp: <b>${esc(info().chu_re || '(chưa nhập)')}</b> &amp; <b>${esc(info().co_dau || '(chưa nhập)')}</b> — <a href="/sua/${CARD_ID}">sửa ở trang thiệp</a>.</p>
    </section>
    <section class="group panel"><h3>Mẫu video</h3>
      <div class="opts">${META.video.templates.map((t) => `<button class="opt ${video.template === t.id ? 'on' : ''}" data-tpl="${t.id}"><i style="background:${SWATCH[t.id]}"></i><b>${esc(t.name)}</b><span>${esc(t.desc)}</span></button>`).join('')}</div>
      <div style="display:flex;align-items:center;gap:12px;margin-top:14px;flex-wrap:wrap">
        <label class="check"><input type="checkbox" id="photoBg" ${video.photoBg ? 'checked' : ''}>Dùng ảnh cưới làm nền</label>
        <label class="btn sm soft">${card.data.cover ? 'Đổi ảnh' : 'Chọn ảnh'}<input type="file" accept="image/*" id="coverIn" hidden></label>
        ${card.data.cover ? `<span style="width:40px;height:40px;border-radius:8px;background:center/cover url('${esc(card.data.cover)}')"></span>` : ''}
      </div>
      <label class="range" style="display:grid;grid-template-columns:120px 1fr 40px;align-items:center;gap:10px;margin-top:14px;font-size:14px"><span>Mỗi cảnh</span><input type="range" id="secs" min="4" max="15" step="1" value="${video.seconds}" style="accent-color:var(--primary)"><output id="secsOut">${video.seconds}s</output></label>
    </section>
    <section class="group panel"><h3>Nội dung các cảnh <button class="btn sm plain" id="resetAll">Khôi phục mặc định</button></h3>
      <p class="muted" style="font-size:13px;margin:-4px 0 8px">Bấm để chèn thông tin tự động — dòng nào thiếu thông tin sẽ tự ẩn:</p>
      <div class="tokens">${Object.entries(META.video.tokens).map(([k, n]) => `<button data-tok="${k}" title="${esc(n)}">${esc(n)}</button>`).join('')}</div>
      ${video.scenes.map((s, si) => `
        <div class="scene" data-scene="${si}">
          <div class="scene-h"><span>Cảnh ${si + 1}</span><span>${video.scenes.length > 1 ? `<button class="btn sm danger" data-del-scene="${si}">Xoá cảnh</button>` : ''}</span></div>
          ${s.lines.map((l, li) => lineRow(l, si, li)).join('')}
          ${s.lines.length < 8 ? `<button class="btn sm soft" data-add-line="${si}">+ Thêm dòng</button>` : ''}
        </div>`).join('')}
      ${video.scenes.length < 5 ? '<button class="btn plain" id="addScene">+ Thêm cảnh</button>' : ''}
    </section>
    <section class="group panel" id="exportBox"></section>`;
  renderExport();
}

function renderExport() {
  const s = card.video;
  const total = video.scenes.length * video.seconds;
  $('#exportBox').innerHTML = `<h3>Tải video MP4 Full HD</h3>
    <p class="muted" style="font-size:14px;margin:0 0 12px">Chép vào USB cắm TV, hoặc gửi qua Zalo. ${card.data.music ? 'Có kèm nhạc nền của thiệp.' : 'Muốn có nhạc nền: tải nhạc MP3 ở tab "Ảnh & nhạc" của thiệp.'}</p>
    <label class="field"><span>Độ dài</span><select id="loops" class="input">
      <option value="1">1 vòng (${total} giây)</option>
      <option value="${Math.max(2, Math.round(180 / total))}" selected>Lặp ~3 phút</option>
      <option value="${Math.max(2, Math.min(30, Math.round(600 / total)))}">Lặp ~10 phút</option>
    </select></label>
    <button class="btn block" id="exportBtn">${s.paid ? '⬇ Quay & xuất MP4' : `Kích hoạt ${money(META.videoPrice)} để tải MP4`}</button>
    ${s.mp4 ? `<a class="btn block plain" style="margin-top:8px" href="${esc(s.mp4)}" download>Tải bản đã xuất gần nhất</a>` : ''}
    <p class="muted" style="font-size:12px;margin:10px 0 0">Nên dùng Chrome hoặc Edge bản mới. Trình duyệt cũ sẽ quay theo thời gian thực (~${total} giây, cần giữ tab mở).</p>`;
}

function renderHeader() {
  const s = card.video;
  $('#ttl').textContent = video.event.kind + ' · ' + ([card.data.groom.name, card.data.bride.name].filter(Boolean).join(' & ') || card.title);
  $('#back').href = '/sua/' + CARD_ID;
  if (!s || !s.created) return;
  $('#chip').innerHTML = s.paid ? '<span class="chip ok">● Đã kích hoạt</span>'
    : s.expired ? '<span class="chip red">Hết hạn dùng thử</span>'
    : `<span class="chip warn">Dùng thử · còn ${Math.max(0, Math.ceil((s.trialEndsAt - Date.now()) / 864e5))} ngày</span>`;
  $('#acts').innerHTML = `<button class="btn sm soft" id="cpLink">Chép link chiếu TV</button> <a class="btn sm plain" target="_blank" href="${esc(s.url)}">Mở trình chiếu</a>${s.paid ? '' : ` <button class="btn sm" id="payBtn">Kích hoạt · ${money(META.videoPrice)}</button>`}`;
  $('#cpLink').onclick = () => copyText(s.url, 'Đã chép link — mở trên Smart TV hoặc máy tính nối TV');
  const pb = $('#payBtn'); if (pb) pb.onclick = () => openPayModal(CARD_ID, reload, 'video');
}

function renderJump() {
  const n = video.scenes.length;
  $('#jump').innerHTML = Array.from({ length: n }, (_, i) => `<button data-j="${i}">Cảnh ${i + 1}</button>`).join('');
}

// ---------- lưu ----------
function schedule(delay = 700) {
  status('Đang chỉnh…');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, delay);
}
async function save() {
  if (saving) { again = true; return; }
  saving = true;
  status('Đang lưu…');
  try {
    const r = await api(`/api/cards/${CARD_ID}`, { method: 'PUT', body: { video } });
    card.video = r.card.video;
    status('Đã lưu ✓');
    renderHeader();
  } catch (e) {
    status('Lưu thất bại');
    toast(e.message, true);
  } finally {
    saving = false;
    if (again) { again = false; save(); }
  }
}
async function reload() {
  const r = await api(`/api/cards/${CARD_ID}`);
  card = r.card;
  renderHeader();
  renderExport();
}

// ---------- xuất MP4 ----------
async function exportMp4() {
  if (!card.video.paid) return openPayModal(CARD_ID, reload, 'video');
  clearTimeout(saveTimer);
  await save();
  const loops = $('#loops').value;
  let closeModal;
  openModal(`<h2>Đang dựng video…</h2><p class="muted" style="margin:0">Thường mất dưới một phút. Đừng đóng trang này.</p><div class="bar"><i id="pg"></i></div><p class="muted" id="pgText" style="font-size:13px;margin:0">Chuẩn bị…</p>`, (box, close) => { closeModal = close; });
  try {
    const off = document.createElement('canvas');
    off.width = 1920; off.height = 1080;
    const rec = VideoEngine.create(off, { photo: card.data.cover || card.data.photos[0] || '', trial: false });
    rec.set(video, info());
    await new Promise((r) => setTimeout(r, 600)); // chờ ảnh nền tải xong
    const blob = await rec.record((p) => {
      $('#pg').style.width = Math.round(p * 80) + '%';
      $('#pgText').textContent = `Đang dựng ${Math.round(p * video.scenes.length * video.seconds)}/${video.scenes.length * video.seconds} giây video`;
    });
    $('#pg').style.width = '85%';
    $('#pgText').textContent = 'Đang chuyển sang MP4 Full HD trên máy chủ…';
    const r = await api(`/api/cards/${CARD_ID}/video/export?loops=${loops}`, { method: 'POST', body: blob });
    $('#pg').style.width = '100%';
    card.video.mp4 = r.url;
    closeModal();
    openModal(`<h2>🎬 Video đã sẵn sàng</h2><p class="muted">MP4 Full HD 1920×1080 — chép vào USB để cắm TV, hoặc gửi cho người thân.</p>
      <video src="${esc(r.url)}" controls style="width:100%;border-radius:10px;background:#000;margin:8px 0 14px"></video>
      <a class="btn block lg" href="${esc(r.url)}" download>⬇ Tải video về máy</a>`);
    renderExport();
  } catch (e) {
    if (closeModal) closeModal();
    toast(e.message, true);
  }
}

// ---------- sự kiện ----------
function lineAt(el) {
  const box = el.closest('.ln');
  return box && video.scenes[+box.dataset.si].lines[+box.dataset.li];
}
function bind() {
  const side = $('#side');
  side.addEventListener('focusin', (e) => {
    if (e.target.matches('.ln input[type=text]')) {
      lastInput = e.target;
      const si = +e.target.closest('.ln').dataset.si;
      engine.seek(si * video.seconds + 2); // nhảy tới cảnh đang sửa
    }
  });
  side.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.e) { video.event[t.dataset.e] = t.value; refresh(); renderHeader(); return schedule(); }
    if (t.id === 'secs') { video.seconds = +t.value; $('#secsOut').textContent = t.value + 's'; refresh(); return schedule(400); }
    const l = lineAt(t);
    if (!l) return;
    const f = t.dataset.f;
    if (f === 'text') l.text = t.value;
    else if (f === 'font') l.font = t.value;
    else if (f === 'size') l.size = Math.max(20, Math.min(220, +t.value || 56));
    else if (f === 'color') l.color = t.value;
    else if (f === 'custom') { l.color = t.checked ? (t.closest('.ln').querySelector('[data-f=color]').value) : ''; t.closest('.ln').querySelector('[data-f=color]').disabled = !t.checked; }
    refresh();
    schedule();
  });
  side.addEventListener('change', async (e) => {
    if (e.target.id === 'photoBg') { video.photoBg = e.target.checked; refresh(); return schedule(100); }
    if (e.target.id === 'coverIn' && e.target.files[0]) {
      status('Đang tải ảnh…');
      try {
        card.data.cover = await uploadFile(e.target.files[0]);
        await api(`/api/cards/${CARD_ID}`, { method: 'PUT', body: { data: card.data } });
        engine.setPhoto(card.data.cover);
        video.photoBg = true;
        renderSide(); refresh(); schedule(100);
      } catch (err) { toast(err.message, true); status(''); }
    }
  });
  side.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    if (d.tok) {
      if (!lastInput || !document.body.contains(lastInput)) return toast('Bấm vào một dòng chữ trước, rồi chọn thông tin để chèn');
      const s = lastInput.selectionStart ?? lastInput.value.length;
      lastInput.value = lastInput.value.slice(0, s) + `{${d.tok}}` + lastInput.value.slice(lastInput.selectionEnd ?? s);
      lastInput.dispatchEvent(new Event('input', { bubbles: true }));
      lastInput.focus();
      return;
    }
    let changed = true;
    if (d.tpl) video.template = d.tpl;
    else if (d.a) {
      const box = b.closest('.ln');
      const lines = video.scenes[+box.dataset.si].lines;
      const i = +box.dataset.li;
      if (d.a === 'del') lines.splice(i, 1);
      if (d.a === 'up' && i > 0) [lines[i - 1], lines[i]] = [lines[i], lines[i - 1]];
      if (d.a === 'down' && i < lines.length - 1) [lines[i + 1], lines[i]] = [lines[i], lines[i + 1]];
    } else if (d.addLine !== undefined) video.scenes[+d.addLine].lines.push({ text: '', font: 'serif', size: 56, tone: 'main', color: '' });
    else if (d.delScene !== undefined) { if (!confirm('Xoá cảnh này?')) return; video.scenes.splice(+d.delScene, 1); }
    else if (b.id === 'addScene') video.scenes.push({ lines: [{ text: 'Dòng chữ mới', font: 'script', size: 110, tone: 'main', color: '' }] });
    else if (b.id === 'resetAll') {
      if (!confirm('Khôi phục nội dung mặc định? Các dòng chữ bạn đã sửa sẽ mất.')) return;
      api(`/api/cards/${CARD_ID}/video/reset`, { method: 'POST' }).then((r) => { video = r.card.videoConfig; card.video = r.card.video; renderSide(); refresh(); status('Đã khôi phục ✓'); }).catch((err) => toast(err.message, true));
      return;
    } else if (b.id === 'exportBtn') return exportMp4();
    else changed = false;
    if (!changed) return;
    renderSide();
    refresh();
    schedule(200);
  });
  $('#jump').addEventListener('click', (e) => { const j = e.target.dataset.j; if (j !== undefined) engine.seek(+j * video.seconds + 0.01); });
}

function start() {
  $('#introBox').innerHTML = '';
  $('#layout').hidden = false;
  engine = VideoEngine.create($('#cv'), { photo: card.data.cover || card.data.photos[0] || '', trial: false });
  renderSide();
  renderHeader();
  bind();
  refresh();
  engine.play();
  status('Đã lưu ✓');
}

(async () => {
  try {
    const [meta, r] = await Promise.all([fetch('/api/meta').then((x) => x.json()), api(`/api/cards/${CARD_ID}`)]);
    META = meta;
    card = r.card;
    document.title = 'Video dạm ngõ — ' + meta.brand;
  } catch (e) {
    $('#ttl').textContent = 'Không tìm thấy thiệp';
    return;
  }
  if (card.videoConfig) { video = card.videoConfig; return start(); }
  $('#back').href = '/sua/' + CARD_ID;
  $('#introBox').innerHTML = `<div class="intro panel">
    <p style="font-size:44px;margin:0">🎬</p>
    <h2 style="font-family:var(--serif);margin:8px 0">Video dạm ngõ, ăn hỏi chiếu TV</h2>
    <p class="muted">Video 16:9 lặp liên tục: giới thiệu cô dâu chú rể, lời cảm ơn hai họ, ngày giờ buổi lễ kèm âm lịch. Chọn mẫu sen vàng, hoa đào, mây cung đình; sửa từng dòng chữ, đổi font, màu.</p>
    <p class="muted" style="font-size:14px">Xem & trình chiếu miễn phí ${META.trialDays} ngày · Kích hoạt ${money(META.videoPrice)} để tải MP4 Full HD, bỏ dòng "Bản dùng thử".</p>
    <button class="btn lg" id="startBtn">Tạo video từ thiệp này</button>
    <p style="margin:14px 0 0"><a href="/video/demo" target="_blank">Xem video mẫu ↗</a></p>
  </div>`;
  $('#startBtn').onclick = async () => {
    try {
      const r = await api(`/api/cards/${CARD_ID}`, { method: 'PUT', body: { video: {} } });
      card = r.card;
      video = card.videoConfig;
      start();
    } catch (e) { toast(e.message, true); }
  };
})();
