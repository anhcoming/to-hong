// Trình sửa video cưới: chỉnh nội dung từng cảnh, xem trước trực tiếp trên canvas, quay & xuất MP4.
const CARD_ID = location.pathname.split('/').pop();
let card, META, video, engine;
let saveTimer = null, saving = false, again = false, lastInput = null;

const SWATCH = { album: 'linear-gradient(135deg,#3a2326,#0d0809)', sen: 'linear-gradient(135deg,#6a0d16,#2a0308)', dao: 'linear-gradient(135deg,#fffaf6,#f0c9cf)', may: 'linear-gradient(135deg,#86121b,#3d0509)' };

function info() {
  const fam = (p) => [p.father, p.mother].filter(Boolean).join(' – ');
  const d = card.data;
  return { chu_re: d.groom.name, co_dau: d.bride.name, bo_me_trai: fam(d.groom), bo_me_gai: fam(d.bride) };
}
function status(t) { $('#saved').textContent = t; }
const busyUp = () => vPending.size + (coverUp ? 1 : 0);
function upStatus() { status(busyUp() ? `Đang tải ${busyUp()} ảnh lên…` : 'Đã lưu ✓'); }
let coverUp = false;
// ảnh trình chiếu của mẫu video ảnh: các ô ảnh cố định vị trí ('' = ô trống). Chưa chọn riêng thì dùng ảnh bìa + album của thiệp.
function cardPhotos() { const d = card.data; return [d.cover, ...(d.photos || [])].filter((u, i, a) => u && a.indexOf(u) === i).slice(0, 20); }
function renderPhotoBox() { const el = $('#photoBox'); if (el) el.outerHTML = photoBox(); }
const tplOf = () => META.video.templates.find((t) => t.id === video.template) || {};
const isAlbum = () => !!tplOf().photos; // mẫu video ảnh (chèn nhiều ảnh)
const slotCount = () => tplOf().slots || 20; // mỗi mẫu có số ô ảnh riêng
// toàn bộ ảnh đã chọn (giữ cả ảnh ở các ô sau để đổi sang mẫu nhiều ô hơn vẫn còn), đệm ô trống cho đủ số ô của mẫu
function allSlots() {
  const base = (video.photos && video.photos.length ? video.photos : cardPhotos()).slice();
  while (base.length < slotCount()) base.push('');
  return base;
}
function slots() { return allSlots().slice(0, slotCount()); } // các ô hiện trong mẫu này
// ô đang chờ tải: xem trước dùng ảnh trong máy (video.photos chưa đổi tới khi tải xong)
const vPending = new Map(); // vị trí ô → link ảnh tạm trong máy ('' = đang nén)
function slidePhotos() { return slots().map((u, i) => (vPending.has(i) && vPending.get(i)) || u).filter(Boolean); }
// ghi lại ô i..: sửa trên bộ ảnh đầy đủ rồi lưu (bỏ ô trống thừa ở cuối)
function writeSlots(view) {
  const all = allSlots();
  view.forEach((u, i) => { all[i] = u; });
  while (all.length && !all[all.length - 1]) all.pop();
  setSlides(all.length ? all : ['']);
}
let pickSlot = -1, dragSlot = -1;
function photoBox() {
  const own = video.photos && video.photos.length, list = slots(), filled = list.filter((u, i) => u || vPending.has(i)).length, n = slotCount();
  const extra = allSlots().slice(n).filter(Boolean).length;
  return `<section class="group panel" id="photoBox"><h3><span><b class="stepn">2</b>Ảnh</span><span class="muted" style="font-size:13px;font-weight:400">${filled}/${n} ảnh</span></h3>
    <p class="muted" style="font-size:13px;margin:-4px 0 12px">Mẫu <b>${esc(tplOf().name || '')}</b> dùng <b>${n} ảnh</b>. Bấm vào ô để chọn hoặc đổi ảnh ở đúng vị trí đó, kéo thả để đổi chỗ. ${own ? '' : 'Đang dùng ảnh của thiệp.'}${extra ? ` <br>Còn ${extra} ảnh đã chọn nằm ngoài ${n} ô — đổi sang mẫu nhiều ô hơn là dùng lại.` : ''}</p>
    <div class="vslots">${list.map((u, i) => vPending.has(i)
      ? `<div class="vslot up" data-slot="${i}"><span class="vpic"${vPending.get(i) ? ` style="background-image:url('${vPending.get(i)}')"` : ''}></span><i class="vspin"></i><span class="vno">${i + 1}</span></div>`
      : u
      ? `<div class="vslot" draggable="true" data-slot="${i}"><button class="vpic" data-ph="pick" data-i="${i}" style="background-image:url('${esc(u)}')" title="Đổi ảnh số ${i + 1}"><span class="vre">↻ Đổi ảnh</span></button><span class="vno">${i + 1}</span><button class="vx" data-ph="x" data-i="${i}" title="Xoá ảnh này (giữ ô trống)">×</button></div>`
      : `<div class="vslot empty" data-slot="${i}"><button class="vpic" data-ph="pick" data-i="${i}" title="Chọn ảnh cho ô ${i + 1}">＋<small>Ảnh ${i + 1}</small></button></div>`).join('')}
      </div>
    <input type="file" accept="image/*" id="slotIn" hidden>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">${filled < n ? `<label class="btn sm soft">＋ Chọn nhiều ảnh (${n - filled} ô trống)<input type="file" accept="image/*" multiple id="slideIn" hidden></label>` : ''}${own ? '<button class="btn sm plain" id="useCard">Dùng lại ảnh của thiệp</button>' : ''}</div>
    <label class="range"><span>Mỗi ảnh</span><input type="range" id="psec" min="2" max="6" step="0.5" value="${video.photoSec || 3}"><output id="psecOut">${video.photoSec || 3}s</output></label>
  </section>`;
}
// Tải ảnh vào các ô mà không che màn hình: ô hiện vòng chờ ngay, nén xong hiện ảnh trong máy (cả ở ô lẫn
// khung xem trước), tải ngầm 3 ảnh một lúc, xong ảnh nào ghi ảnh đó vào đúng ô rồi lưu.
let vQueue = [], vRunning = 0;
function queueSlots(files, idx) {
  idx.forEach((i, k) => { vPending.set(i, ''); vQueue.push({ i, file: files[k] }); });
  renderPhotoBox(); upStatus();
  for (let k = 0; k < 3; k++) pumpSlots();
}
async function pumpSlots() {
  if (vRunning >= 3 || !vQueue.length) return;
  vRunning++;
  const { i, file } = vQueue.shift();
  let local = '', url = '';
  try {
    const small = await resizeImage(file);
    local = URL.createObjectURL(small);
    vPending.set(i, local);
    engine.setPhotos(slidePhotos()); renderPhotoBox(); refresh();
    url = await uploadFile(small, { quiet: true, resized: true });
    await new Promise((ok) => { const im = new Image(); im.onload = im.onerror = ok; im.src = url; setTimeout(ok, 8000); });
  } catch (e) { toast(e.message, true); }
  vPending.delete(i);
  if (url) { const all = allSlots(); all[i] = url; while (all.length && !all[all.length - 1]) all.pop(); video.photos = all.slice(0, 20); }
  engine.setPhotos(slidePhotos()); renderPhotoBox(); refresh();
  if (url) schedule(400); else upStatus();
  if (local) setTimeout(() => URL.revokeObjectURL(local), 60000);
  vRunning--;
  pumpSlots();
}
function setSlides(list) { video.photos = list.slice(0, 20); engine.setPhotos(slidePhotos()); renderSide(); refresh(); schedule(200); }
// chữ: biến {chu_re} hiện thành [Tên chú rể] cho dễ đọc, lưu lại thì đổi ngược
function toLabel(t) { const T = META.video.tokens; return String(t || '').replace(/\{(\w+)\}/g, (m, k) => (T[k] ? `[${T[k]}]` : m)); }
function fromLabel(t) {
  const T = META.video.tokens;
  return t.replace(/\[([^\]]+)\]/g, (m, lab) => { const k = Object.keys(T).find((x) => T[x].toLowerCase() === lab.trim().toLowerCase()); return k ? `{${k}}` : m; });
}
function grow(el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 2 + 'px'; }
function refresh() { engine.set(video, info()); renderJump(); if ($('#exportBox')) renderExport(); }

// ---------- giao diện ----------
function renderSide() {
  const ev = video.event;
  const fontSel = (v) => META.video.fonts.map((f) => `<option value="${f.id}" ${v === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('');
  // mỗi dòng chữ: ô nhập + nút "Aa" mở phần kiểu chữ (font, cỡ, màu, thứ tự) — mặc định ẩn cho gọn
  const range = (id, label, min, max, step, val) => `<label class="range"><span>${label}</span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"><output id="${id}Out">${val}s</output></label>`;
  $('#side').innerHTML = `
    <section class="group panel"><h3><span><b class="stepn">1</b>Mẫu video</span><a class="muted" style="font-size:13px;font-weight:500" href="/video-cuoi">Xem các mẫu ↗</a></h3>
      <div class="opts">${META.video.templates.map((t) => `<button class="opt ${video.template === t.id ? 'on' : ''}" data-tpl="${t.id}"><i style="background:${SWATCH[t.id]};background-image:url('/demo/vposter-${t.id}.jpg')"></i><b>${esc(t.name)}</b></button>`).join('')}</div>
    </section>
    ${isAlbum() ? photoBox() : `<section class="group panel"><h3><span><b class="stepn">2</b>Ảnh nền</span></h3>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        ${card.data.cover ? `<span style="width:56px;height:56px;border-radius:10px;background:center/cover url('${esc(card.data.cover)}')"></span>` : ''}
        <label class="check"><input type="checkbox" id="photoBg" ${video.photoBg ? 'checked' : ''}>Dùng ảnh cưới làm nền</label>
        <label class="btn sm soft">${card.data.cover ? 'Đổi ảnh' : 'Chọn ảnh'}<input type="file" accept="image/*" id="coverIn" hidden></label>
      </div></section>`}
    <section class="group panel"><h3><span><b class="stepn">3</b>Chữ</span><button class="btn sm plain" id="resetAll">Khôi phục mặc định</button></h3>
      <div class="grid2">
        <label class="field"><span>Tên buổi lễ</span><input list="kinds" data-e="kind" value="${esc(ev.kind)}" maxlength="40"><datalist id="kinds">${META.video.kinds.map((k) => `<option value="${esc(k)}">`).join('')}</datalist></label>
        <label class="field"><span>Địa điểm</span><input data-e="place" value="${esc(ev.place)}" maxlength="100" placeholder="Tư gia nhà gái"></label>
        <label class="field"><span>Ngày (dương lịch)</span><input type="date" data-e="date" value="${esc(ev.date)}"></label>
        <label class="field"><span>Giờ</span><input type="time" data-e="time" value="${esc(ev.time)}"></label>
      </div>
      <p class="muted" style="font-size:13px;margin:0 0 14px">Ngày âm lịch tự tính. Tên cô dâu chú rể, bố mẹ lấy từ thiệp: <b>${esc(info().chu_re || '(chưa nhập)')}</b> &amp; <b>${esc(info().co_dau || '(chưa nhập)')}</b> — <a href="/sua/${CARD_ID}">sửa ở trang thiệp</a>.</p>
      <p class="muted" style="font-size:13px;margin:0 0 8px">Mỗi dòng một hàng chữ. Chữ trong <b>[ngoặc vuông]</b> tự lấy từ thiệp — ví dụ [Tên chú rể] → <b>${esc(info().chu_re || 'tên chú rể')}</b>; dòng nào thiếu thông tin sẽ tự ẩn.</p>
      <div class="tokens"><span class="muted" style="font-size:12px">Chèn:</span>${Object.entries(META.video.tokens).map(([k, n]) => `<button data-tok="${k}" title="Chèn ${esc(n)} vào dòng đang sửa">${esc(n)}</button>`).join('')}</div>
      ${video.scenes.map((sc, si) => `
        <div class="scene" data-scene="${si}">
          <div class="scene-h"><span>${isAlbum() ? (si === 0 ? 'Mở đầu' : `Kết thúc${video.scenes.length > 2 ? ' ' + si : ''}`) : `Cảnh ${si + 1}`}</span>
            <span class="scene-acts"><button class="lnk" data-style-scene="${si}">Aa Kiểu chữ</button>${video.scenes.length > 1 ? `<button class="lnk" data-del-scene="${si}">Xoá cảnh</button>` : ''}</span></div>
          <textarea class="stext" data-scene-text="${si}" rows="${Math.max(2, sc.lines.length)}" placeholder="Mỗi dòng một hàng chữ">${esc(sc.lines.map((l) => toLabel(l.text)).join('\n'))}</textarea>
          <div class="sstyle" id="sstyle${si}" hidden>${renderStyleRows(si)}</div>
        </div>`).join('')}
      ${video.scenes.length < 5 ? `<button class="btn sm plain" id="addScene">+ Thêm ${isAlbum() ? 'thẻ chữ' : 'cảnh'}</button>` : ''}
      ${range('secs', isAlbum() ? 'Mỗi thẻ chữ' : 'Mỗi cảnh', 4, 15, 1, video.seconds)}
    </section>
    <section class="group panel" id="exportBox"></section>`;
  document.querySelectorAll('.stext').forEach(grow);
  renderExport();
}

function renderStyleRows(si) {
  const fontSel = (v) => META.video.fonts.map((f) => `<option value="${f.id}" ${v === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('');
  return video.scenes[si].lines.map((l, li) => `
    <div class="ln" data-si="${si}" data-li="${li}">
      <span class="lt">${esc(toLabel(l.text) || '(dòng trống)')}</span>
      <select data-f="font" title="Kiểu chữ">${fontSel(l.font)}</select>
      <input type="number" data-f="size" min="20" max="220" step="2" value="${l.size}" title="Cỡ chữ">
      <label title="Màu riêng — bỏ chọn để dùng màu của mẫu" class="lc"><input type="checkbox" data-f="custom" ${l.color ? 'checked' : ''}><input type="color" data-f="color" value="${l.color || '#ffffff'}" ${l.color ? '' : 'disabled'}></label>
    </div>`).join('');
}

function renderExport() {
  const s = card.video;
  const total = Math.round(engine ? engine.duration() : video.scenes.length * video.seconds);
  $('#exportBox').innerHTML = `<h3>Tải video MP4 Full HD</h3>
    <p class="muted" style="font-size:14px;margin:0 0 12px">Chép vào USB cắm TV, hoặc gửi qua Zalo. ${card.data.music ? 'Có kèm nhạc nền của thiệp.' : 'Muốn có nhạc nền: tải nhạc MP3 ở tab "Ảnh & nhạc" của thiệp.'}</p>
    <label class="field"><span>Độ dài</span><select id="loops" class="input">
      ${[[1, `1 vòng (${total} giây)`], [Math.max(2, Math.round(180 / total)), 'Lặp ~3 phút'], [Math.max(2, Math.min(30, Math.round(600 / total))), 'Lặp ~10 phút']]
        .map(([n, label], i) => `<option value="${n}" ${i === 1 ? 'selected' : ''}>${label} · ~${Math.max(1, Math.round(n * total * 0.36))} MB</option>`).join('')}
    </select></label>
    <button class="btn block" id="exportBtn">${s.paid ? '⬇ Xuất & tải MP4' : card.credits && card.credits.video > 0 ? '🎁 Dùng lượt Trọn bộ để tải MP4' : `Kích hoạt ${money(META.videoPrice)} để tải MP4`}</button>
    ${s.mp4 ? `<a class="btn block plain" style="margin-top:8px" href="${esc(s.mp4)}" target="_blank" rel="noopener" download>Tải bản đã xuất gần nhất</a>` : ''}
    <p class="muted" style="font-size:12px;margin:10px 0 0">Video dựng ngay trên máy bạn — nên dùng Chrome, Edge hoặc Safari bản mới.</p>`;
}

function renderHeader() {
  const s = card.video;
  $('#ttl').textContent = video.event.kind + ' · ' + ([card.data.groom.name, card.data.bride.name].filter(Boolean).join(' & ') || card.title);
  backTo($('#back'), '/sua/' + CARD_ID);
  if (!s || !s.created) return;
  $('#chip').innerHTML = s.paid ? '<span class="chip ok">● Đã kích hoạt</span>'
    : s.expired ? '<span class="chip red">Hết hạn dùng thử</span>'
    : `<span class="chip warn">Dùng thử · còn ${Math.max(0, Math.ceil((s.trialEndsAt - Date.now()) / 864e5))} ngày</span>`;
  $('#acts').innerHTML = `<button class="btn sm soft" id="cpLink">Chép link<span class="xl">&nbsp;chiếu TV</span></button> <a class="btn sm plain" target="_blank" href="${esc(s.url)}"><span class="xl">Mở trình chiếu</span><span class="xs">Trình chiếu ↗</span></a>${s.paid ? '' : card.credits && card.credits.video > 0 ? ' <button class="btn sm" id="payBtn">🎁 Dùng lượt Trọn bộ</button>' : ` <button class="btn sm" id="payBtn">Kích hoạt<span class="xl">&nbsp;· ${money(META.videoPrice)}</span></button>`}`;
  $('#cpLink').onclick = () => copyText(s.url, 'Đã chép link — mở trên Smart TV hoặc máy tính nối TV');
  const pb = $('#payBtn'); if (pb) pb.onclick = () => openPayModal(CARD_ID, reload, 'video');
}

function renderJump() {
  const n = video.scenes.length, D = engine.duration();
  $('#marks').innerHTML = Array.from({ length: n }, (_, i) => `<i style="left:${(engine.sceneTime(i) / D * 100).toFixed(2)}%"></i>`).join('');
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
    const r = await api(`/api/cards/${CARD_ID}`, { method: 'PUT', body: { video }, quiet: true });
    card.video = r.card.video;
    upStatus();
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
// Dựng và đóng gói MP4 ngay trên máy khách (không qua máy chủ), tải về ngay; sau đó lưu một bản sao
// lên kho (Vercel Blob khi chạy thật, thư mục uploads khi chạy máy riêng) để mở lại được từ máy khác.
function fileName() {
  const n = [card.data.groom.name, card.data.bride.name].filter(Boolean).join('-') || 'video-cuoi';
  return (n.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'video-cuoi') + '.mp4';
}
function saveToDevice(blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = fileName();
  document.body.appendChild(a); a.click(); a.remove();
  return a.href;
}
function loadScript(src) {
  return new Promise((ok, fail) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => fail(new Error('Không tải được ' + src)); document.head.appendChild(s); });
}
// bản sao trên kho: chỉ giữ bản mới nhất của mỗi video
async function saveCopy(blob) {
  if (blob.size > 350e6) throw new Error('File quá lớn để lưu bản sao'); // bản 10 phút rất dài: chỉ giữ trên máy khách
  if (META.blobUpload) {
    if (!window.BlobClient) await loadScript('/vendor/blob-client.js');
    const up = await BlobClient.upload(`videos/${CARD_ID}.mp4`, blob, { access: 'public', contentType: 'video/mp4', handleUploadUrl: `/api/cards/${CARD_ID}/video/blob`, clientPayload: CARD_ID, multipart: blob.size > 50e6 });
    return (await api(`/api/cards/${CARD_ID}/video/saved`, { method: 'POST', body: { url: up.url }, quiet: true })).url;
  }
  return (await api(`/api/cards/${CARD_ID}/video/saved-file`, { method: 'POST', body: blob, quiet: true })).url;
}

async function exportMp4() {
  if (!card.video.paid) return openPayModal(CARD_ID, reload, 'video');
  clearTimeout(saveTimer);
  await save();
  const loops = +$('#loops').value || 1;
  let closeModal;
  openModal(`<h2>Đang dựng video…</h2><p class="muted" style="margin:0">Video dựng ngay trên máy bạn, thường dưới một phút. Giữ trang này mở nhé.</p><div class="bar"><i id="pg"></i></div><p class="muted" id="pgText" style="font-size:13px;margin:0">Chuẩn bị…</p>`, (box, close) => { closeModal = close; });
  try {
    const off = document.createElement('canvas');
    off.width = 1920; off.height = 1080;
    const rec = VideoEngine.create(off, { photo: card.data.cover || card.data.photos.find(Boolean) || '', photos: slidePhotos(), trial: false });
    rec.set(video, info());
    const { blob, music } = await rec.exportMp4({
      loops, music: card.data.music,
      onProgress: (p, label) => { $('#pg').style.width = Math.round(p * 100) + '%'; $('#pgText').textContent = `${label}… ${Math.round(p * 100)}%`; },
    });
    const local = saveToDevice(blob);
    closeModal();
    const mb = (blob.size / 1e6).toFixed(1);
    openModal(`<h2>🎬 Video đã tải về máy</h2><p class="muted">MP4 Full HD 1920×1080 · ${mb} MB${card.data.music ? (music ? ' · có nhạc nền' : ' · <b>không có nhạc</b> (trình duyệt này chưa ghép được nhạc — mở bằng Chrome nếu muốn có nhạc)') : ''}. Chép vào USB để cắm TV, hoặc gửi cho người thân.</p>
      <video src="${local}" controls style="width:100%;border-radius:10px;background:#000;margin:8px 0 14px"></video>
      <a class="btn block lg" href="${local}" download="${esc(fileName())}">⬇ Tải lại về máy</a>
      <p class="muted" id="copyMsg" style="font-size:13px;margin:10px 0 0">Đang lưu một bản sao để tải lại từ máy khác…</p>`);
    try {
      const url = await saveCopy(blob);
      card.video.mp4 = url;
      const m = $('#copyMsg'); if (m) m.textContent = '✓ Đã lưu bản sao — mở "Video của tôi" ở máy khác là tải lại được.';
      renderExport();
    } catch (e) {
      console.warn('Lưu bản sao thất bại:', e);
      const m = $('#copyMsg'); if (m) m.textContent = 'Chưa lưu được bản sao lên kho (video trên máy bạn vẫn dùng bình thường). Máy khác muốn có file thì bấm xuất lại.';
    }
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
    if (e.target.matches('.stext')) {
      lastInput = e.target;
      const si = +e.target.dataset.sceneText;
      engine.seek(engine.sceneTime(si) + 2); // nhảy tới cảnh đang sửa
    }
  });
  side.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.e) { video.event[t.dataset.e] = t.value; refresh(); renderHeader(); return schedule(); }
    if (t.id === 'psec') { video.photoSec = +t.value; $('#psecOut').textContent = t.value + 's'; refresh(); renderExport(); return schedule(400); }
    if (t.id === 'secs') { video.seconds = +t.value; $('#secsOut').textContent = t.value + 's'; refresh(); return schedule(400); }
    if (t.dataset.sceneText !== undefined) { // gõ trong ô chữ của cảnh: mỗi dòng một hàng, giữ kiểu chữ theo vị trí dòng
      const si = +t.dataset.sceneText, rows = t.value.split('\n');
      if (rows.length > 8) toast('Mỗi cảnh tối đa 8 dòng');
      const old = video.scenes[si].lines, base = { font: 'serif', size: 56, tone: 'main', color: '' };
      video.scenes[si].lines = rows.slice(0, 8).map((r, i) => ({ ...(old[i] || old[old.length - 1] || base), text: fromLabel(r) }));
      grow(t);
      const box = $('#sstyle' + si);
      if (box && !box.hidden) box.innerHTML = renderStyleRows(si);
      refresh();
      return schedule();
    }
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
    if (e.target.id === 'slotIn' && e.target.files[0] && pickSlot >= 0) { // thay ảnh đúng ô đã bấm
      const i = pickSlot;
      pickSlot = -1;
      queueSlots([e.target.files[0]], [i]);
      return;
    }
    if (e.target.id === 'slideIn' && e.target.files.length) { // chọn nhiều ảnh: điền lần lượt vào các ô trống của mẫu
      const empty = slots().map((u, i) => (u || vPending.has(i) ? -1 : i)).filter((i) => i >= 0);
      const files = [...e.target.files];
      if (files.length > empty.length) toast(`Mẫu này còn ${empty.length} ô trống — chỉ lấy ${empty.length} ảnh đầu`);
      queueSlots(files.slice(0, empty.length), empty.slice(0, files.length));
      return;
    }
    if (e.target.id === 'photoBg') { video.photoBg = e.target.checked; refresh(); return schedule(100); }
    if (e.target.id === 'coverIn' && e.target.files[0]) { // ảnh nền: hiện ngay ảnh trong máy, tải + lưu ngầm
      const f = e.target.files[0];
      coverUp = true; upStatus();
      let local = '';
      try {
        const small = await resizeImage(f);
        local = URL.createObjectURL(small);
        engine.setPhoto(local);
        video.photoBg = true;
        const bg = $('#photoBg'); if (bg) bg.checked = true;
        refresh();
        const url = await uploadFile(small, { quiet: true, resized: true });
        card.data.cover = url;
        await api(`/api/cards/${CARD_ID}`, { method: 'PUT', body: { data: card.data }, quiet: true });
        engine.setPhoto(url);
        coverUp = false;
        refresh(); schedule(100);
      } catch (err) {
        coverUp = false;
        toast(err.message, true);
        engine.setPhoto(card.data.cover || card.data.photos.find(Boolean) || '');
        refresh(); upStatus();
      } finally { if (local) setTimeout(() => URL.revokeObjectURL(local), 60000); }
    }
  });
  side.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    if (d.ph) {
      const list = slots(), i = +d.i;
      if (d.ph === 'pick') { pickSlot = i; const inp = $('#slotIn'); inp.value = ''; return inp.click(); }
      if (d.ph === 'x') list[i] = ''; // xoá ảnh nhưng giữ ô, các ảnh khác đứng yên
      return writeSlots(list);
    }
    if (b.id === 'useCard') return setSlides([]);
    if (d.styleScene !== undefined) { const box = $('#sstyle' + d.styleScene); box.hidden = !box.hidden; if (!box.hidden) box.innerHTML = renderStyleRows(+d.styleScene); b.classList.toggle('on', !box.hidden); return; }
    if (d.tok) {
      if (!lastInput || !document.body.contains(lastInput)) return toast('Bấm vào ô chữ của một cảnh trước, rồi chọn thông tin để chèn');
      const s = lastInput.selectionStart ?? lastInput.value.length;
      lastInput.value = lastInput.value.slice(0, s) + `[${META.video.tokens[d.tok]}]` + lastInput.value.slice(lastInput.selectionEnd ?? s);
      lastInput.dispatchEvent(new Event('input', { bubbles: true }));
      lastInput.focus();
      return;
    }
    let changed = true;
    if (d.tpl) { video.template = d.tpl; if (isAlbum()) engine.setPhotos(slidePhotos()); }
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
  side.addEventListener('dragstart', (e) => { const s = e.target.closest('.vslot[data-slot]'); if (s) { dragSlot = +s.dataset.slot; e.dataTransfer.effectAllowed = 'move'; } });
  side.addEventListener('dragover', (e) => { if (dragSlot >= 0 && e.target.closest('.vslot[data-slot]')) e.preventDefault(); });
  side.addEventListener('drop', (e) => {
    const s = e.target.closest('.vslot[data-slot]');
    if (!s || dragSlot < 0) return;
    e.preventDefault();
    const to = +s.dataset.slot, from = dragSlot, list = slots();
    dragSlot = -1;
    if (to === from) return;
    [list[from], list[to]] = [list[to], list[from]];
    writeSlots(list);
  });
  side.addEventListener('dragend', () => { dragSlot = -1; });
  $('#jump').addEventListener('click', (e) => { const j = e.target.dataset.j; if (j !== undefined) engine.seek(engine.sceneTime(+j) + 0.01); });
  // thanh tua: kéo để tua (đang phát thì phát tiếp từ chỗ mới), nút phát/dừng, cập nhật theo từng khung hình
  const seekEl = $('#seek'), pp = $('#pp');
  let dragging = false;
  const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  seekEl.addEventListener('input', () => { dragging = true; engine.seek(seekEl.value / 1000 * engine.duration()); });
  seekEl.addEventListener('change', () => { dragging = false; });
  pp.addEventListener('click', () => {
    if (engine.paused()) engine.resume(); else engine.pause();
    pp.textContent = engine.paused() ? '▶' : '❚❚';
    pp.setAttribute('aria-label', engine.paused() ? 'Phát' : 'Tạm dừng');
  });
  (function tick() {
    const D = engine.duration(), t = engine.time();
    if (!dragging) seekEl.value = Math.round(t / D * 1000);
    $('#tm').textContent = `${fmt(t)} / ${fmt(D)}`;
    requestAnimationFrame(tick);
  })();
}

function start() {
  $('#introBox').innerHTML = '';
  $('#layout').hidden = false;
  engine = VideoEngine.create($('#cv'), { photo: card.data.cover || card.data.photos.find(Boolean) || '', photos: slidePhotos(), trial: false });
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
    document.title = 'Video cưới — ' + meta.brand;
  } catch (e) {
    $('#ttl').textContent = 'Không tìm thấy thiệp';
    return;
  }
  const mau = new URLSearchParams(location.search).get('mau');
  const pick = META.video.templates.some((t) => t.id === mau) ? mau : null;
  if (mau) history.replaceState(null, '', location.pathname);
  if (card.videoConfig) {
    video = card.videoConfig;
    if (pick && video.template !== pick) { video.template = pick; start(); return schedule(100); }
    return start();
  }
  if (pick) {
    try {
      const r = await api(`/api/cards/${CARD_ID}`, { method: 'PUT', body: { video: { template: pick } } });
      card = r.card; video = card.videoConfig;
      return start();
    } catch (e) { toast(e.message, true); }
  }
  backTo($('#back'), '/sua/' + CARD_ID);
  $('#introBox').innerHTML = `<div class="intro panel">
    <p style="font-size:44px;margin:0">🎬</p>
    <h2 style="font-family:var(--serif);margin:8px 0">Video cưới chiếu TV</h2>
    <p class="muted">Chọn mẫu, chèn ảnh cưới và lời chào — video tự dựng chuyển cảnh, ngày âm lịch. Dùng cho dạm ngõ, ăn hỏi, vu quy, thành hôn.</p>
    <p class="muted" style="font-size:14px">Xem & trình chiếu miễn phí ${META.trialDays} ngày · Kích hoạt ${money(META.videoPrice)} để tải MP4 Full HD, bỏ dòng "Bản dùng thử".</p>
    <button class="btn lg" id="startBtn">Tạo video từ thiệp này</button>
    <p style="margin:14px 0 0"><a href="/video-cuoi">Xem các mẫu video</a></p>
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
