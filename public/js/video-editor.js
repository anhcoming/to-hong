// Trình sửa video cưới: chỉnh nội dung từng cảnh, xem trước trực tiếp trên canvas, quay & xuất MP4.
const CARD_ID = location.pathname.split('/').pop();
let card, META, video, engine;
let saveTimer = null, saving = false, again = false, lastInput = null;

const SWATCH = { ngoc: 'linear-gradient(135deg,#f6f0e6,#e2d6c3)', diudang: 'linear-gradient(135deg,#3a403b,#22261f)', kyuc: 'linear-gradient(135deg,#2a2424,#050404)', album: 'linear-gradient(135deg,#3a2326,#0d0809)', sen: 'linear-gradient(135deg,#6a0d16,#2a0308)', dao: 'linear-gradient(135deg,#fffaf6,#f0c9cf)', may: 'linear-gradient(135deg,#86121b,#3d0509)' };

function info() {
  const fam = (p) => [p.father, p.mother].filter(Boolean).join(' – ');
  const d = card.data;
  return { chu_re: d.groom.name, co_dau: d.bride.name, bo_me_trai: fam(d.groom), bo_me_gai: fam(d.bride) };
}
function status(t) { $('#saved').textContent = t; const sb = $('#subl'); if (sb) sb.classList.toggle('ok', /Đã lưu|Đã khôi phục/.test(t)); }
// trình sửa kiểu CapCut: cột icon chọn bảng (curPanel), dòng thời gian chọn cảnh (selClip), hoàn tác / làm lại (hist)
let curPanel = 'mau', selClip = -1, clips = [];
let hist = [], hIdx = -1, histMute = false;
const busyUp = () => vPending.size + (coverUp ? 1 : 0);
function upStatus() { status(busyUp() ? `Đang tải ${busyUp()} ảnh lên…` : 'Đã lưu ✓'); }
let coverUp = false;
// ảnh trình chiếu của mẫu video ảnh: các ô ảnh cố định vị trí ('' = ô trống). Chưa chọn riêng thì dùng ảnh bìa + album của thiệp.
function cardPhotos() { const d = card.data; return [d.cover, ...(d.photos || [])].filter((u, i, a) => u && a.indexOf(u) === i).slice(0, 36); }
// slide cưới nhận cả video clip: ô video hiện khung hình đầu + nhãn "▶ Video"
const isClipU = (u) => /\.(mp4|webm|mov)(\?|#|$)/i.test(String(u || ''));
const thumbAttr = (u) => (u && !isClipU(u) ? ` style="background-image:url('${esc(u)}')"` : '');
const thumbIn = (u) => (isClipU(u) ? `<video src="${esc(String(u).split('#')[0])}#t=0.5" muted playsinline preload="metadata"></video><em class="vbadge">▶ Video</em>` : '');
function renderPhotoBox() { const el = $('#photoBox'); if (el) el.outerHTML = photoBox(); if (engine) renderTl(); } // thanh ảnh dưới cùng vẽ lại theo
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
function realPhotos() { return slots().map((u, i) => (vPending.has(i) && vPending.get(i)) || u).filter(Boolean); }
// chưa có ảnh nào (cả ảnh riêng lẫn ảnh thiệp): xem trước bằng bộ ảnh mẫu của mẫu đang chọn — chỉ để xem, không xuất / không lưu
const samples = () => ((META.video.samples || {})[video.template] || []);
const sampleAt = (i) => (isAlbum() && !(vPending.has(i)) && !slots()[i] && samples()[i]) || ''; // ô trống → ảnh mẫu của ô đó
const sampleOn = () => slots().some((_, i) => sampleAt(i)); // còn ô nào đang là ảnh mẫu
// xem trước: ảnh thật + ảnh mẫu ở các ô còn trống (xuất video chỉ dùng realPhotos)
function slidePhotos() { return slots().map((u, i) => (vPending.has(i) && vPending.get(i)) || u || sampleAt(i)).filter(Boolean); }
// ghi lại ô i..: sửa trên bộ ảnh đầy đủ rồi lưu (bỏ ô trống thừa ở cuối)
function writeSlots(view) {
  const all = allSlots();
  view.forEach((u, i) => { all[i] = u; });
  while (all.length && !all[all.length - 1]) all.pop();
  setSlides(all.length ? all : ['']);
}
let pickSlot = -1, dragSlot = -1;
// Ảnh: một lưới ô + MỘT thanh sửa cho ô đang chọn (không lặp lại ảnh ở chỗ khác).
// Bấm ô (hoặc bấm cảnh ở dòng thời gian) → ô có viền hồng, thanh bên dưới hiện đúng việc làm được với ô đó:
// ảnh mẫu → "Chọn ảnh của bạn"; ảnh của bạn → Thay / Căn chỉnh / Xoá; mẫu có chữ dưới ảnh → thêm ô sửa chữ.
let selSlot = -1;
const clipOfSlot = (i) => { const k = slotOfSlide().indexOf(i); return k < 0 ? -1 : clips.findIndex((c) => c.kind === 'shot' && c.ids.includes(k)); };
function selBar() {
  const i = selSlot, list = slots();
  if (i < 0 || i >= list.length) return '<p class="selhint">Bấm một ảnh để thay, căn chỉnh hoặc sửa chữ của ảnh đó.</p>';
  const u = list[i], smp = !!sampleAt(i), clip = isClipU(u);
  const ci = clipOfSlot(i), j = ci < 0 ? -1 : clips.slice(0, ci).filter((x) => x.kind === 'shot').length;
  const hasNote = video.template === 'polaroid' && engine && engine.noteOf && j >= 0 && clips[ci].ids.length === 1;
  return `<div class="selbar">
    <div class="selrow"><b>Ảnh ${i + 1}</b><small>${vPending.has(i) ? 'đang tải lên…' : smp ? 'ảnh mẫu' : u ? (clip ? 'video của bạn' : 'ảnh của bạn') : 'ô trống'}</small>
      ${vPending.has(i) ? '' : smp || !u ? `<button class="btn sm" data-ph="pick" data-i="${i}">＋ Chọn ảnh của bạn</button>`
        : `<button class="btn sm soft" data-ph="pick" data-i="${i}">↻ Thay</button>${clip ? '' : `<button class="btn sm plain" data-ph="crop" data-i="${i}">⤢ Căn chỉnh</button>`}<button class="btn sm plain" data-ph="x" data-i="${i}" style="color:#b3261e">Xoá</button>`}
    </div>
    ${hasNote ? `<label class="selnote"><span>Chữ dưới ảnh</span><input data-note="${j}" value="${esc((video.notes || [])[j] || '')}" placeholder="${esc(engine.noteOf(j))}" maxlength="40" autocomplete="off"></label>` : ''}
  </div>`;
}
function selectSlot(i, seek) {
  selSlot = i;
  const ci = clipOfSlot(i);
  if (ci >= 0) { selClip = ci; if (seek) { const c = clips[ci]; engine.seek(c.t0 + Math.min(0.9, c.dur / 2)); if (!engine.paused()) $('#pp').click(); } }
  renderPhotoBox(); renderTl();
}
function photoBox() {
  const list = slots(), sel = (i) => (i === selSlot ? ' sel' : '');
  const nSample = list.filter((_, i) => sampleAt(i)).length;
  return `<section class="group" id="photoBox">
    ${nSample ? `<label class="btn sm soft block addmany">＋ Thêm ảnh của bạn <small>chọn nhiều ảnh một lúc · thay lần lượt ${nSample} ảnh mẫu</small><input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple id="slideIn" hidden></label>` : ''}
    <div class="vslots">${list.map((u, i) => vPending.has(i)
      ? `<div class="vslot up${sel(i)}" data-slot="${i}"><span class="vpic"${thumbAttr(vPending.get(i))}>${thumbIn(vPending.get(i))}</span><i class="vspin"></i><span class="vno">${i + 1}</span></div>`
      : u
      ? `<div class="vslot${sel(i)}" draggable="true" data-slot="${i}"><button class="vpic" data-ph="pick" data-i="${i}"${thumbAttr(u)} title="Ảnh ${i + 1}">${thumbIn(u)}</button><span class="vno">${i + 1}</span></div>`
      : sampleAt(i) ? `<div class="vslot sample${sel(i)}" data-slot="${i}"><button class="vpic" data-ph="pick" data-i="${i}" style="background-image:url('${esc(sampleAt(i))}')" title="Ảnh ${i + 1} · ảnh mẫu"></button><span class="vno">${i + 1}</span></div>`
      : `<div class="vslot empty${sel(i)}" data-slot="${i}"><button class="vpic" data-ph="pick" data-i="${i}" title="Ô ${i + 1}">＋<small>Ảnh ${i + 1}</small></button></div>`).join('')}
      </div>
    <input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" id="slotIn" multiple hidden>
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
    const clip = /^video\//.test(file.type);
    if (clip && file.size > 60e6) throw new Error(`"${file.name}" quá 60MB — cắt ngắn đoạn clip rồi thử lại nhé`);
    const small = clip ? file : await resizeImage(file);
    local = URL.createObjectURL(small) + (clip ? '#.mp4' : ''); // đuôi giả để bộ dựng biết đây là video
    vPending.set(i, local);
    engine.setPhotos(slidePhotos()); renderPhotoBox(); refresh();
    url = await uploadFile(small, { quiet: true, resized: !clip });
    await new Promise((ok) => { const im = new Image(); im.onload = im.onerror = ok; im.src = url; setTimeout(ok, 8000); });
  } catch (e) { toast(e.message, true); }
  vPending.delete(i);
  if (url) { const all = allSlots(); all[i] = url; while (all.length && !all[all.length - 1]) all.pop(); video.photos = all.slice(0, 36); }
  engine.setPhotos(slidePhotos()); renderPhotoBox(); refresh(); engine.photosReady().then(renderTl);
  if (url) schedule(400); else upStatus();
  if (local) setTimeout(() => URL.revokeObjectURL(local), 60000);
  vRunning--;
  pumpSlots();
}
function setSlides(list) { video.photos = list.slice(0, 36); engine.setPhotos(slidePhotos()); renderSide(); refresh(); engine.photosReady().then(renderTl); schedule(200); }
// chữ: biến {chu_re} hiện thành [Tên chú rể] cho dễ đọc, lưu lại thì đổi ngược
function toLabel(t) { const T = META.video.tokens; return String(t || '').replace(/\{(\w+)\}/g, (m, k) => (T[k] ? `[${T[k]}]` : m)); }
function fromLabel(t) {
  const T = META.video.tokens;
  return t.replace(/\[([^\]]+)\]/g, (m, lab) => { const k = Object.keys(T).find((x) => T[x].toLowerCase() === lab.trim().toLowerCase()); return k ? `{${k}}` : m; });
}
function grow(el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 2 + 'px'; }
function refresh() { engine.set(video, info()); if (engine.paused()) engine.seek(engine.time()); renderJump(); renderTl(); if ($('#exportBox')) renderExport(); const tn = $('#tplName'); if (tn) tn.textContent = tplOf().name || ''; }

// ---------- giao diện ----------
function renderSide() {
  const ev = video.event;
  const range = (id, label, min, max, step, val) => `<label class="range"><span>${label}</span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"><output id="${id}Out">${val}s</output></label>`;
  const head = (t, d) => `<h2 class="phd">${t}</h2>${d ? `<p class="pdesc">${d}</p>` : ''}`;
  const next = (to, label) => `<div class="next"><button class="btn block" data-go="${to}">${label} →</button></div>`;
  $$('#rail [data-panel]').forEach((b) => b.classList.toggle('on', b.dataset.panel === curPanel));
  // video dạm ngõ (mẫu chữ): chỉ chọn mẫu có sẵn + sửa chữ — không có bảng Ảnh, không dùng ảnh nền
  // Ảnh, Nội dung, Cảnh gộp chung một bảng "Nội dung" (curPanel = 'chu')
  if (curPanel === 'anh' || curPanel === 'canh' || curPanel === 'chu') curPanel = 'mau'; // ảnh + chữ sửa ở thanh dưới / trên video
  $$('#rail [data-panel="anh"],#rail [data-panel="canh"],#rail [data-panel="xuat"],#rail [data-panel="chu"]').forEach((b) => { b.hidden = true; });
  $$('#rail [data-panel]').forEach((b) => b.classList.toggle('on', b.dataset.panel === curPanel));
  if (!isAlbum() && video.photoBg) video.photoBg = false;
  let h = '';
  if (curPanel === 'mau') {
    h = head(isAlbum() ? 'Mẫu slide' : 'Mẫu video dạm ngõ', isAlbum() ? 'Đổi mẫu bất cứ lúc nào — ảnh và chữ của bạn giữ nguyên.' : 'Chọn một mẫu có sẵn — chữ sửa ở bảng Nội dung.') + `
      <div class="opts">${META.video.templates.filter((t) => !!t.photos === isAlbum()).map((t) => `<button class="opt ${video.template === t.id ? 'on' : ''}" data-tpl="${t.id}"><i style="background:${SWATCH[t.id] || '#333'};background-image:url('/demo/vposter-${t.id}.jpg')"></i><b>${esc(t.name)}</b><span>${t.photos ? `${t.slots} ảnh` : 'Chữ + ảnh nền'}</span></button>`).join('')}</div>
      `;
  } else if (curPanel === 'chu') {
    const sub = (t, d) => `<h3 class="psub">${t}${d ? `<small>${d}</small>` : ''}</h3>`;
    h = isAlbum()
      ? head('Ảnh', 'Bấm ô để thay bằng ảnh của bạn, kéo thả để đổi chỗ. Sửa ảnh, chữ và tốc độ ở dòng thời gian bên dưới.') + photoBox()
      : head('Nội dung', 'Chữ, thông tin buổi lễ và tốc độ sửa ở dòng thời gian bên dưới — bấm ô chữ của cảnh cần sửa.');
  } else if (curPanel === 'nhac') {
    h = head('Nhạc nền', 'Chọn nhạc trong thư viện hoặc tải MP3 của hai bạn. Nhạc dùng chung với thiệp.') + `<section class="group">${musicBox()}</section>`;
  } else {
    h = head('Xuất video', 'Kiểm tra lần cuối rồi tải MP4 Full HD hoặc chép link chiếu TV.') + checkList() + '<section class="group" id="exportBox"></section>';
  }
  $('#side').innerHTML = h;
  document.querySelectorAll('.stext').forEach(grow);
  if ($('#exportBox')) renderExport();
}
// các hàng gập / mở của bảng Nội dung: mỗi lúc mở một hàng ('ev' buổi lễ, 's0'… thẻ chữ, 'spd' tốc độ)
let accOpen = '';
const acc = (key, title, sum, body) => `<details class="acc" data-acc="${key}"${accOpen === key ? ' open' : ''}><summary><b>${title}</b><small>${esc(sum)}</small></summary><div class="accb">${body}</div></details>`;
// mở khung sửa thẻ chữ si, neo phía trên ô chữ tương ứng ở dòng thời gian (khung nằm trong #side để dùng chung các trình xử lý gõ / chèn / kiểu chữ)
function openPop(anchor, title, body, W = 360) {
  closeTxPop();
  if (!anchor) return null;
  const r = anchor.getBoundingClientRect();
  const pop = document.createElement('div');
  pop.id = 'txPop'; pop.className = 'txpop';
  pop.innerHTML = `<div class="txpop-h"><b>${title}</b><button type="button" class="txpop-x" aria-label="Đóng">×</button></div>${body}`;
  $('#side').appendChild(pop);
  pop.style.width = W + 'px';
  pop.style.left = Math.max(12, Math.min(innerWidth - W - 12, r.left + r.width / 2 - W / 2)) + 'px';
  pop.style.bottom = (innerHeight - r.top + 10) + 'px';
  $('.txpop-x', pop).onclick = closeTxPop;
  anchor.classList.add('on');
  return pop;
}
function closeTxPop() { const p = $('#txPop'); if (p) p.remove(); $$('#tls .on-pop').forEach((x) => x.classList.remove('on-pop')); $$('#tls .tx.on,#tls .th.on,#tlinfo .on').forEach((x) => x.classList.remove('on')); }
const rangeH = (id, label, min, max, step, val) => `<label class="range"><span>${label}</span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"><output id="${id}Out">${val}s</output></label>`;
// thông tin buổi lễ (cho các chữ tự điền [Tên buổi lễ], [Ngày]…)
function eventFields() {
  const ev = video.event;
  return `<details class="tokbox evbox"><summary>Thông tin buổi lễ: ${esc([ev.kind, ev.date ? ev.date.split('-').reverse().join('/') : 'chưa chọn ngày', ev.time, ev.place].filter(Boolean).join(' · '))}</summary>
    <div class="grid2" style="margin-top:8px">
      <label class="field"><span>Tên buổi lễ</span><input list="kinds" data-e="kind" value="${esc(ev.kind)}" maxlength="40"><datalist id="kinds">${META.video.kinds.map((k) => `<option value="${esc(k)}">`).join('')}</datalist></label>
      <label class="field"><span>Địa điểm</span><input data-e="place" value="${esc(ev.place)}" maxlength="100" placeholder="Tư gia nhà gái"></label>
      <label class="field"><span>Ngày</span><input type="date" data-e="date" value="${esc(ev.date)}"></label>
      <label class="field"><span>Giờ</span><input type="time" data-e="time" value="${esc(ev.time)}"></label>
    </div>
    <p class="muted" style="font-size:12px;margin:0">Tên <b>${esc(info().chu_re || '(chưa nhập)')}</b> &amp; <b>${esc(info().co_dau || '(chưa nhập)')}</b>, bố mẹ lấy từ thiệp — <a href="/sua/${CARD_ID}">sửa ở thiệp</a>.</p></details>`;
}
// thẻ chữ: bấm ô chữ ở dòng thời gian
function openTxPop(si) {
  if (!video.scenes[si]) return;
  const title = isAlbum() ? (si === 0 ? 'Chữ mở đầu' : 'Chữ kết thúc' + (video.scenes.length > 2 ? ' ' + si : '')) : 'Cảnh ' + (si + 1);
  const lines = video.scenes[si].lines.map((l) => fill(l.text));
  const body = `<textarea class="stext" data-pop-text="${si}" rows="${Math.max(2, lines.length)}" placeholder="Mỗi dòng một hàng chữ">${esc(lines.join('\n'))}</textarea>`;
  const k = clips.findIndex((c) => c.kind !== 'shot' && c.scene === si);
  if (k >= 0) { if (!engine.paused()) $('#pp').click(); engine.seek(clips[k].t0 + clips[k].dur * 0.5); }
  const pop = openPop($(`#tls [data-txs="${si}"]`), title, body); if (!pop) return;
  const ta = $('textarea', pop); grow(ta); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
}
// ảnh: bấm ảnh ở dòng thời gian → Thay / Căn chỉnh / Xoá (+ chữ dưới ảnh)
function openPhotoPop(k) {
  const el = $(`#tls [data-clip="${k}"] .th`); if (!el) return;
  openPop(el, `Ảnh ${selSlot + 1}`, selBar(), 340);
}
// tốc độ: nút ở cột đầu dòng thời gian
function openSpeedPop(anchor) {
  openPop(anchor, 'Tốc độ', `${isAlbum() ? rangeH('psec', 'Mỗi ảnh', 2, 6, 0.5, video.photoSec || 3) : ''}${rangeH('secs', isAlbum() ? 'Mỗi thẻ chữ' : 'Mỗi cảnh', 4, 15, 1, video.seconds)}`, 300);
}
function sceneBox(si) {
  const sc = video.scenes[si];
  const name = isAlbum() ? (si === 0 ? 'Chữ mở đầu' : `Chữ kết thúc${video.scenes.length > 2 ? ' ' + si : ''}`) : `Cảnh ${si + 1}`;
  const sum = sc.lines.map((l) => fill(l.text)).filter(Boolean).join(' · ') || 'chưa có chữ';
  return acc('s' + si, name, sum, `<div class="scene" data-scene="${si}">
    <textarea class="stext" data-scene-text="${si}" rows="${Math.max(2, sc.lines.length)}" placeholder="Mỗi dòng một hàng chữ">${esc(sc.lines.map((l) => toLabel(l.text)).join('\n'))}</textarea>
    <p class="muted" style="font-size:12px;margin:6px 0 0">Chữ trong [ ] tự lấy từ thông tin buổi lễ và thiệp.</p>
    <details class="tokbox"><summary>＋ Chèn thông tin tự điền</summary><div class="tokens">${Object.entries(META.video.tokens).map(([k, n]) => `<button data-tok="${k}" title="Chèn ${esc(n)} vào dòng đang sửa">${esc(n)}</button>`).join('')}</div></details>
    <div class="scene-acts" style="display:flex;gap:14px;margin-top:10px"><button class="lnk" data-style-scene="${si}">Aa Kiểu chữ</button>${video.scenes.length > 1 ? `<button class="lnk" data-del-scene="${si}" style="margin-left:auto">Xoá thẻ này</button>` : ''}<button class="lnk" id="resetAll"${video.scenes.length > 1 ? '' : ' style="margin-left:auto"'}>Khôi phục mặc định</button></div>
    <div class="sstyle" id="sstyle${si}" hidden>${renderStyleRows(si)}</div>
  </div>`);
}
// sau khi chọn cảnh: cảnh ảnh → ô "Cảnh đang chọn" ở đầu bảng; cảnh chữ → cuộn tới thẻ chữ của cảnh đó
function focusClip() {
  const c = clips[selClip], side = $('#side'); if (!c) return;
  if (c.kind === 'shot') {
    selSlot = slotOfSlide()[c.ids[0]] ?? -1; renderPhotoBox();
    if (selSlot >= 0) openPhotoPop(selClip);
    return;
  }
  if (selSlot >= 0) { selSlot = -1; renderPhotoBox(); }
  openTxPop(c.scene);
}
// ô "Cảnh đang chọn" đầu bảng Nội dung
function clipBox() {
  const c = clips[selClip];
  if (!c || c.kind !== 'shot') return '';
  const urls = slidePhotos(), map = slotOfSlide();
  const j = clips.slice(0, selClip).filter((x) => x.kind === 'shot').length; // thứ tự cảnh ảnh (chữ dưới ảnh Polaroid)
  const notes = video.template === 'polaroid' && engine && engine.noteOf;
  const smpI = (i) => !!sampleAt(i);
  return `<section class="group selbox"><div class="selh"><b>Cảnh ${selClip + 1} đang chọn</b><small>${c.ids.some((id) => smpI(map[id])) ? 'ảnh mẫu — thay bằng ảnh của bạn' : `${c.ids.length} ảnh`}</small><button type="button" data-selx title="Bỏ chọn">×</button></div>
    <div class="shotph vslots">${c.ids.map((id) => { const i = map[id], u = urls[id], real = !smpI(i) && u && !isClipU(u);
      return `<div class="vslot" data-slot="${i}"><button class="vpic" data-ph="pick" data-i="${i}"${thumbAttr(u)}>${thumbIn(u)}<span class="vre">↻ ${smpI(i) ? 'Ảnh của bạn' : 'Đổi'}</span></button><span class="vno">${i + 1}</span>${real ? `<button class="vx" data-ph="x" data-i="${i}" title="Bỏ ảnh này">×</button>` : ''}</div>`; }).join('')}</div>
    <div class="shacts">${c.ids.map((id) => { const i = map[id], u = urls[id], real = !smpI(i) && u && !isClipU(u);
      return `<button class="btn sm soft" data-ph="pick" data-i="${i}">↻ Thay ảnh ${c.ids.length > 1 ? i + 1 : ''}</button>${real ? `<button class="btn sm plain" data-ph="crop" data-i="${i}">⤢ Căn chỉnh ${c.ids.length > 1 ? i + 1 : ''}</button>` : ''}`; }).join('')}</div>
    ${notes ? `<label class="field" style="margin-top:14px"><span>Chữ dưới ảnh</span><input data-note="${j}" value="${esc((video.notes || [])[j] || '')}" placeholder="${esc(engine.noteOf(j))}" maxlength="40" autocomplete="off"><small>Để trống thì dùng chữ có sẵn của mẫu.</small></label>` : ''}</section>`;
}
// vị trí ô (trong các ô của mẫu) của ảnh thứ k trong danh sách ảnh đang chiếu
function slotOfSlide() { const out = []; slots().forEach((u, i) => { if ((vPending.has(i) && vPending.get(i)) || u || sampleAt(i)) out.push(i); }); return out; }
function checkList() {
  const filled = isAlbum() ? slots().filter(Boolean).length : 0, n = slotCount();
  const items = [];
  if (isAlbum()) items.push(filled >= n ? [1, `Đủ ${n}/${n} ảnh`] : [0, `Mới có ${filled}/${n} ảnh${filled ? ' — video vẫn chạy, ảnh được lặp cho đủ' : ''}`, 'anh', 'Thêm ảnh']);
  items.push(info().chu_re && info().co_dau ? [1, 'Đã có tên cô dâu chú rể'] : [0, 'Chưa có tên cô dâu chú rể', 'link', 'Sửa ở thiệp']);
  items.push(video.event.date ? [1, 'Đã có ngày lễ'] : [0, 'Chưa chọn ngày lễ', 'chu', 'Chọn ngày']);
  items.push(card.data.music ? [1, 'Có nhạc nền'] : [0, 'Chưa có nhạc nền — video sẽ không có tiếng', 'nhac', 'Chọn nhạc']);
  return `<ul class="chk">${items.map(([ok, t, go, lb]) => `<li class="${ok ? 'ok' : ''}">${ok ? '✓' : '!'} <span>${esc(t)}</span>${ok ? '' : go === 'link' ? `<a href="/sua/${CARD_ID}" style="margin-left:auto;color:inherit;font-weight:700;font-size:12.5px">${lb}</a>` : `<button data-go="${go}">${lb}</button>`}</li>`).join('')}</ul>`;
}
// ---------- nhạc nền (dùng chung nhạc của thiệp) ----------
let mPrev = null, mUp = '';
function musicBox() {
  const M = META.music || { tracks: [] }, cur = card.data.music || '';
  const playing = (f) => mPrev && !mPrev.paused && mPrev.dataset.f === f;
  const row = (f, name, sub, on) => `<div class="mrow${on ? ' on' : ''}"><button class="mplay" data-mplay="${esc(f)}">${playing(f) ? '❚❚' : '▶'}</button><div class="mt"><b>${esc(name)}</b><small>${esc(sub)}</small></div>${on ? '<span class="mnow">✓ Đang dùng</span>' : `<button class="btn sm plain" data-mpick="${esc(f)}">Chọn</button>`}</div>`;
  const own = cur && !M.tracks.some((t) => t.file === cur) ? row(cur, 'Nhạc bạn tải lên', 'MP3 của bạn', true) : '';
  return `${mUp ? `<p class="muted" style="margin:0 0 10px">Đang tải lên "${esc(mUp)}"…</p>` : ''}<div class="mlist">${own}${M.tracks.map((t) => row(t.file, t.name, `${t.by} · ${t.mood}`, cur === t.file)).join('')}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><label class="btn sm soft">Tải lên MP3 của bạn<input type="file" accept="audio/mpeg" id="vMusicIn" hidden></label>${cur ? '<button class="btn sm plain" data-mpick="">Không dùng nhạc</button>' : ''}</div>`;
}
async function setMusic(url) {
  card.data.music = url;
  if (mPrev) { mPrev.pause(); mPrev = null; }
  renderSide();
  try { await api(`/api/cards/${CARD_ID}`, { method: 'PUT', body: { data: card.data }, quiet: true }); status('Đã lưu ✓'); } catch (e) { toast(e.message, true); }
}

// ---------- dòng thời gian ----------
// chữ thật của thẻ (thay {biến} bằng thông tin của thiệp / buổi lễ; dòng có biến rỗng thì bỏ)
function fill(t) {
  const v = { ...info(), le: video.event.kind, gio: video.event.time, dia_diem: video.event.place, ngay: video.event.date ? video.event.date.split('-').reverse().join('/') : '' };
  let miss = false; const out = String(t || '').replace(/\{(\w+)\}/g, (m, k) => { if (!v[k]) miss = true; return v[k] || ''; });
  return miss ? '' : out;
}
function renderTl() {
  if (!engine) return;
  clips = engine.timeline();
  $('#tlinfo').innerHTML = `<b>${isAlbum() ? `${slotCount()} ảnh` : `${video.scenes.length} cảnh`}</b><span>${Math.round(engine.duration())} giây</span>`; // bỏ nút "Tốc độ": mỗi mẫu đã có nhịp sẵn
  const tcard = (si) => { const k = clips.findIndex((c) => c.kind !== 'shot' && c.scene === si);
    return `<div class="clip tcard" data-clip="${k}" title="Thẻ chữ — sửa chữ ngay trên video"><span class="th txt">${esc(((video.scenes[si] || {}).lines || []).map((l) => fill(l.text)).filter(Boolean)[0] || 'Thẻ chữ')}</span></div>`; };
  if (!isAlbum()) { $('#tls').innerHTML = video.scenes.map((_, si) => tcard(si)).join(''); return; }
  const list = slots();
  const tiles = list.map((u, i) => {
    const pend = vPending.has(i), shown = (pend && vPending.get(i)) || u || sampleAt(i), k = clipOfSlot(i);
    const th = isClipU(shown) ? `<i class="vclip"><video src="${esc(String(shown).split('#')[0])}#t=0.5" muted playsinline preload="metadata"></video></i>` : shown ? `<i style="background-image:url('${esc(String(shown).split('#')[0])}')"></i>` : '<i class="none">＋</i>';
    return `<div class="clip slot${sampleAt(i) ? ' sample' : ''}${pend ? ' up' : ''}" data-clip="${k}" data-slot="${i}" draggable="${pend ? 'false' : 'true'}" title="${sampleAt(i) ? 'Ảnh mẫu — rê chuột lên video để thay' : 'Kéo để đổi chỗ'}"><span class="th">${th}</span><span class="n">${i + 1}</span>${pend ? '<i class="vspin"></i>' : ''}</div>`;
  });
  // nút thêm / thay ảnh đứng đầu; sau đó đúng thứ tự video chạy: thẻ mở đầu → các ảnh → thẻ kết thúc
  $('#tls').innerHTML = `<div class="clip addbox">${list.some((u, i) => u && !sampleAt(i))
        ? `<label class="addph main" title="Chọn cả bộ ảnh — thay lần lượt từ ảnh 1"><b>⟳</b><small>Thay toàn bộ</small><input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple id="tlAll" hidden></label>${list.some((_, i) => sampleAt(i) || !list[i]) ? `<label class="addph" title="Thêm vào các ô còn là ảnh mẫu"><b>＋</b><small>Thêm ảnh</small><input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple id="tlAdd" hidden></label>` : ''}`
        : `<label class="addph main wide" title="Chọn nhiều ảnh một lúc — thay lần lượt các ảnh mẫu"><b>＋</b><small>Thay bằng ảnh của bạn</small><input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple id="tlAll" hidden></label>`}</div>`
    + tcard(0) + tiles.join('') + video.scenes.slice(1).map((_, k) => tcard(k + 1)).join('');
}
// điền ảnh vào các ô chưa có ảnh của bạn (ảnh mẫu / ô trống), theo thứ tự
// thay cả bộ: ảnh 1 → ô 1, ảnh 2 → ô 2…; chọn ít ảnh hơn số ô thì các ô sau giữ nguyên
function replaceAll(files) {
  files = files.filter((f) => /^(image|video)\//.test(f.type));
  const n = slotCount();
  if (files.length > n) toast(`Mẫu này có ${n} ô — lấy ${n} ảnh đầu`);
  const take = files.slice(0, n);
  queueSlots(take, take.map((_, i) => i));
}
function fillSlots(files) {
  files = files.filter((f) => /^(image|video)\//.test(f.type));
  const free = slots().map((u, i) => (u || vPending.has(i) ? -1 : i)).filter((i) => i >= 0);
  if (!free.length) return toast('Các ô đã đủ ảnh — rê chuột lên ảnh trên video để thay');
  if (files.length > free.length) toast(`Còn ${free.length} ô — lấy ${free.length} ảnh đầu`);
  queueSlots(files.slice(0, free.length), free.slice(0, files.length));
}

// ---------- sửa ngay trên video ----------
// Ô nhập trong suốt đè đúng dòng chữ, cùng kiểu / cỡ / màu; chữ gốc tạm ẩn khi gõ.
function inlineEditor(o) {
  if ($('#noteEd')) return;
  if (!engine.paused()) $('#pp').click();
  const multi = (o.n || 1) > 1;
  const inp = document.createElement(multi ? 'textarea' : 'input');
  inp.id = 'noteEd'; inp.className = 'in-ed'; inp.value = o.text; inp.maxLength = o.max || 160; inp.spellcheck = false;
  if (multi) inp.rows = o.n;
  const px = (v) => String(v).replace(/([\d.]+)px/, (_, n) => (+n * o.scale).toFixed(1) + 'px');
  Object.assign(inp.style, {
    left: o.x + 'px', top: o.y + 'px', width: Math.max(160, o.w) + 'px',
    font: px(o.font), color: o.color, caretColor: o.color, letterSpacing: px(o.ls || '0px'),
    textTransform: o.caps ? 'uppercase' : 'none', lineHeight: o.lh ? o.lh * o.scale + 'px' : '1.25',
    transform: `translate(-50%,-50%) rotate(${o.rot || 0}rad)`,
  });
  engine.hideText(o.hide);
  document.body.appendChild(inp); inp.focus(); inp.select();
  inp.addEventListener('input', () => { o.onSet(inp.value); schedule(600); });
  let closed = false; // gỡ ô nhập cũng bắn "blur" → không chạy lại
  const done = () => { if (closed) return; closed = true; o.onSet(inp.value); inp.remove(); engine.hideText(null); schedule(100); renderTl(); };
  inp.addEventListener('keydown', (ev) => { if ((ev.key === 'Enter' && !ev.shiftKey) || ev.key === 'Escape') { ev.preventDefault(); done(); } });
  inp.addEventListener('blur', done);
}
function noteEditor(h, r, k) { // chữ viết tay dưới ảnh (Polaroid)
  inlineEditor({
    text: h.text, x: r.left + h.x * k, y: r.top + h.y * k, w: h.w * k, scale: (h.sc || 1) * k, font: h.font, color: h.color, rot: h.rot, max: 40, hide: { j: h.j },
    onSet: (v) => {
      const all = (video.notes || []).slice(); while (all.length <= h.j) all.push('');
      all[h.j] = v.trim() === h.text && !(video.notes || [])[h.j] ? '' : v.trim();
      while (all.length && !all[all.length - 1]) all.pop();
      video.notes = all; engine.set(video, info()); engine.seek(engine.time());
    },
  });
}
function lineEditor(tx, r, k) { // một dòng của thẻ chữ; dòng tự điền không sửa gì thì giữ nguyên
  const l = tx.l, raw = l.text;
  inlineEditor({
    text: tx.text, x: r.left + (tx.box.l + tx.box.r) / 2 * k, y: r.top + (tx.box.t + tx.box.b) / 2 * k, w: (tx.box.r - tx.box.l) * k,
    scale: (tx.sc || 1) * k, font: tx.font, color: tx.color, ls: tx.ls, caps: tx.caps, lh: tx.lh, n: tx.n, hide: { l },
    onSet: (v) => { v = v.trim(); l.text = v === tx.text ? raw : v; engine.set(video, info()); engine.seek(engine.time()); },
  });
}
// sửa chữ dưới một tấm ảnh (Polaroid): ô nhập nổi tại vị trí cho trước
// căn / phóng to một ảnh của video: kéo để chọn phần hiện ra, thanh trượt để phóng (lưu "#p=x,y,z" trên link ảnh)
function vCrop(i, ratio) {
  ratio = ratio > 0 ? ratio : 16 / 10;
  const fw = ratio >= 1 ? 'min(420px,100%)' : `${Math.round(380 * ratio)}px`; // khung dọc: cao 380px, rộng theo tỉ lệ
  const list = slots(), u = list[i] || sampleAt(i); if (!u) return; // ảnh mẫu: căn xong thì giữ làm ảnh của ô
  const base = String(u).split('#')[0], m = /#p=([\d.]+),([\d.]+)(?:,([\d.]+))?/.exec(u);
  let x = m ? +m[1] : 50, y = m ? +m[2] : 50, z = m ? Math.max(1, +m[3] || 1) : 1;
  openModal(`<h2 style="margin-top:0">Căn ảnh ${i + 1}</h2>
    <p class="muted" style="margin:-4px 0 12px">Kéo ảnh để chọn phần hiện ra, kéo thanh trượt để phóng to.</p>
    <div id="vcF" style="position:relative;margin:0 auto;width:${fw};aspect-ratio:${ratio};border-radius:12px;overflow:hidden;touch-action:none;cursor:grab;background:#eee url('${esc(base)}') no-repeat;box-shadow:inset 0 0 0 2px var(--primary)"></div>
    <div style="display:flex;align-items:center;gap:10px;margin:14px auto 0;max-width:420px"><span aria-hidden="true">−</span><input type="range" id="vcZ" min="1" max="3" step="0.01" value="${z}" aria-label="Phóng to" style="flex:1;accent-color:var(--primary)"><span aria-hidden="true">+</span><button type="button" id="vcR" title="Đặt lại như ban đầu" aria-label="Đặt lại" style="all:unset;cursor:pointer;width:30px;height:30px;border-radius:50%;text-align:center;line-height:30px;font-size:16px;color:var(--muted)" onmouseover="this.style.background='var(--primary-soft)'" onmouseout="this.style.background=''">⟲</button></div>
    <div style="display:flex;gap:8px;margin-top:16px"><button class="btn plain" id="vcRep" style="flex:1">↻ Đổi ảnh khác</button><button class="btn" id="vcOk" style="flex:1">Xong</button></div>`, (box, close) => {
    $('#vcRep', box).onclick = (e) => { e.preventDefault(); close(); const inp = $('#tlIn'); inp.dataset.s = i; inp.value = ''; inp.click(); };
    const fr = $('#vcF', box), zr = $('#vcZ', box);
    let paint = () => { fr.style.backgroundSize = `${Math.round(z * 100)}% auto`; fr.style.backgroundPosition = `${x}% ${y}%`; };
    const img = new Image(); img.onload = () => { // ảnh dọc: phủ theo chiều cao
      const fw = fr.clientWidth, fh = fr.clientHeight, cover = Math.max(fw / img.width, fh / img.height);
      paint = () => { const sc = cover * z; fr.style.backgroundSize = `${Math.round(img.width * sc)}px ${Math.round(img.height * sc)}px`; fr.style.backgroundPosition = `${x}% ${y}%`; };
      paint();
    }; img.src = base;
    paint();
    let dr = null;
    fr.addEventListener('pointerdown', (e) => { dr = { x: e.clientX, y: e.clientY, x0: x, y0: y }; fr.setPointerCapture(e.pointerId); fr.style.cursor = 'grabbing'; });
    fr.addEventListener('pointermove', (e) => { if (!dr) return; x = Math.min(100, Math.max(0, dr.x0 - (e.clientX - dr.x) / fr.clientWidth * 100 / z)); y = Math.min(100, Math.max(0, dr.y0 - (e.clientY - dr.y) / fr.clientHeight * 100 / z)); paint(); });
    const up = () => { dr = null; fr.style.cursor = 'grab'; }; fr.addEventListener('pointerup', up); fr.addEventListener('pointercancel', up);
    zr.addEventListener('input', () => { z = +zr.value; paint(); });
    $('#vcR', box).onclick = () => { x = 50; y = 50; z = 1; zr.value = 1; paint(); };
    $('#vcOk', box).onclick = () => {
      const keep = Math.round(x) === 50 && Math.round(y) === 50 && z === 1;
      if (keep && !list[i]) return close(); // ảnh mẫu không căn gì: vẫn để là ảnh mẫu
      list[i] = keep ? base : `${base}#p=${Math.round(x)},${Math.round(y)}${z > 1 ? ',' + Math.round(z * 100) / 100 : ''}`;
      close(); writeSlots(list);
    };
  });
}

// ---------- hoàn tác / làm lại ----------
function snap() {
  if (histMute) return;
  const s = JSON.stringify(video);
  if (hist[hIdx] === s) return;
  hist = hist.slice(0, hIdx + 1); hist.push(s); if (hist.length > 80) hist.shift(); hIdx = hist.length - 1;
  urBtns();
}
function urBtns() { $('#undo').disabled = hIdx <= 0; $('#redo').disabled = hIdx >= hist.length - 1; }
function undoRedo(d) {
  const j = hIdx + d; if (j < 0 || j >= hist.length) return;
  hIdx = j; video = JSON.parse(hist[j]);
  histMute = true;
  engine.setPhotos(slidePhotos()); renderSide(); refresh(); schedule(300);
  histMute = false; urBtns();
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
    <p class="muted" style="font-size:14px;margin:0 0 12px">Chép vào USB cắm TV, hoặc gửi qua Zalo. ${card.data.music ? 'Có kèm nhạc nền của thiệp.' : 'Chưa có nhạc nền — chọn ở bảng Nhạc.'}</p>
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
  // tình trạng dùng thử: dòng chữ nhỏ cạnh "Đã lưu" (không chiếm chỗ trên thanh)
  const days = Math.max(0, Math.ceil((s.trialEndsAt - Date.now()) / 864e5));
  const chip = $('#chip');
  chip.className = s.paid ? 'ok' : s.expired ? 'red' : 'warn';
  chip.textContent = s.paid ? '· đã kích hoạt' : s.expired ? '· hết hạn dùng thử' : `· dùng thử còn ${days} ngày`;
  // một nút đỏ duy nhất: Kích hoạt (chưa trả) / Tải MP4 (đã trả); chép link + tải MP4 gom vào menu Chia sẻ
  const credit = !s.paid && card.credits && card.credits.video > 0;
  const main = s.paid ? '<button class="btn sm" id="goExport">⬇ Tải MP4</button>'
    : credit ? '<button class="btn sm" id="payBtn">🎁 Dùng lượt Trọn bộ</button>'
    : `<button class="btn sm" id="payBtn">Kích hoạt<span class="xl">&nbsp;· ${money(META.videoPrice)}</span></button>`;
  $('#acts').innerHTML = `<a class="btn sm ghost" target="_blank" href="${esc(s.url)}" title="Mở trình chiếu toàn màn hình">▷<span class="xl">&nbsp;Xem trước</span></a>
    <span class="shr"><button class="btn sm soft" id="shrBtn" aria-haspopup="menu" aria-expanded="false">Chia sẻ ▾</button>
      <span class="shr-m" id="shrM" role="menu" hidden>
        <button role="menuitem" id="cpLink"><i>🔗</i><span>Chép link chiếu TV<small>Mở trên Smart TV, máy chiếu, máy tính nối TV</small></span></button>
        <button role="menuitem" id="goExportM"><i>⬇</i><span>Tải video MP4<small>${s.paid ? 'Full HD · chép vào USB cắm TV' : 'Full HD · cần kích hoạt'}</small></span></button>
      </span></span>
    ${main}`;
  const m = $('#shrM'), sb = $('#shrBtn');
  const close = () => { m.hidden = true; sb.setAttribute('aria-expanded', 'false'); };
  sb.onclick = (e) => { e.stopPropagation(); m.hidden = !m.hidden; sb.setAttribute('aria-expanded', String(!m.hidden)); };
  if (!renderHeader.bound) { renderHeader.bound = true; document.addEventListener('click', (e) => { const mm = $('#shrM'); if (mm && !mm.hidden && !e.target.closest('.shr')) { mm.hidden = true; $('#shrBtn').setAttribute('aria-expanded', 'false'); } }); document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const mm = $('#shrM'); if (mm) mm.hidden = true; } }); }
  $('#cpLink').onclick = () => { close(); copyText(s.url, 'Đã chép link — mở trên Smart TV hoặc máy tính nối TV'); };
  const goX = () => { close(); curPanel = 'xuat'; renderSide(); };
  $('#goExportM').onclick = goX;
  const ge = $('#goExport'); if (ge) ge.onclick = goX;
  const pb = $('#payBtn'); if (pb) pb.onclick = () => openPayModal(CARD_ID, reload, 'video');
}

function renderJump() {
  const n = video.scenes.length, D = engine.duration();
  $('#marks').innerHTML = Array.from({ length: n }, (_, i) => `<i style="left:${(engine.sceneTime(i) / D * 100).toFixed(2)}%"></i>`).join('');

}

// ---------- lưu ----------
function schedule(delay = 700) {
  snap();
  status('Chưa lưu…');
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
    const rec = VideoEngine.create(off, { photo: card.data.cover || card.data.photos.find(Boolean) || '', photos: realPhotos(), trial: false }); // xuất: chỉ ảnh thật, không dùng ảnh mẫu
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
    if (e.target.matches('.stext[data-scene-text]')) {
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
  side.addEventListener('toggle', (e) => {
    const d = e.target; if (!d.matches || !d.matches('details.acc')) return;
    if (d.open) { accOpen = d.dataset.acc; $$('#side details.acc').forEach((x) => { if (x !== d) x.open = false; }); $$('.stext', d).forEach(grow); }
    else if (accOpen === d.dataset.acc) accOpen = '';
  }, true);
  side.addEventListener('input', (e) => {
    const t = e.target; if (t.dataset.popText === undefined) return;
    const si = +t.dataset.popText, sc = video.scenes[si]; if (!sc) return;
    const rows = t.value.split('\n').slice(0, 8), old = t._orig || (t._orig = sc.lines.map((l) => ({ ...l })));
    const base = { font: 'serif', size: 56, tone: 'main', color: '' };
    sc.lines = rows.map((r, i) => { const o = old[i] || old[old.length - 1] || base; return { ...o, text: old[i] && r === fill(old[i].text) ? old[i].text : r }; });
    grow(t); refresh(); schedule();
  });
  side.addEventListener('input', (e) => { // chữ dưới ảnh (Polaroid) của cảnh đang chọn
    const t = e.target; if (t.dataset.note === undefined) return;
    const j = +t.dataset.note, all = (video.notes || []).slice(); while (all.length <= j) all.push('');
    all[j] = t.value.trim(); while (all.length && !all[all.length - 1]) all.pop();
    video.notes = all; engine.set(video, info()); if (engine.paused()) engine.seek(engine.time()); schedule(600);
  });
  side.addEventListener('change', async (e) => {
    if (e.target.id === 'slotIn' && e.target.files[0] && pickSlot >= 0) { // thay ảnh đúng ô đã bấm
      const i = pickSlot, files = [...e.target.files];
      pickSlot = -1;
      const n = slotCount(), free = [];
      for (let k = 1; k < n && free.length < files.length - 1; k++) { const j = (i + k) % n; if (!slots()[j] && !vPending.has(j)) free.push(j); }
      if (files.length - 1 > free.length) toast(`Mẫu này chỉ còn ${free.length + 1} ô — lấy ${free.length + 1} ảnh đầu`);
      queueSlots(files.slice(0, free.length + 1), [i, ...free]);
      return;
    }
    if (e.target.id === 'slideIn' && e.target.files.length) { // chọn nhiều ảnh: điền lần lượt vào các ô trống của mẫu
      const empty = slots().map((u, i) => (u || vPending.has(i) ? -1 : i)).filter((i) => i >= 0);
      const files = [...e.target.files];
      if (files.length > empty.length) toast(`Mẫu này còn ${empty.length} ô trống — chỉ lấy ${empty.length} ảnh đầu`);
      queueSlots(files.slice(0, empty.length), empty.slice(0, files.length));
      return;
    }
    if (e.target.id === 'vMusicIn' && e.target.files[0]) {
      const f = e.target.files[0]; mUp = f.name; renderSide();
      try { const url = await uploadFile(f, { quiet: true }); mUp = ''; await setMusic(url); } catch (err) { mUp = ''; renderSide(); toast(err.message, true); }
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
      if (d.ph === 'crop') return vCrop(i);
      if (d.ph === 'sel') return selectSlot(i, true);
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
    if (d.go) { curPanel = d.go; return renderSide(); }
    if (d.selx !== undefined) { selClip = -1; renderSide(); return renderTl(); }
    if (d.mplay !== undefined) {
      const f = d.mplay;
      if (mPrev && mPrev.dataset.f === f && !mPrev.paused) mPrev.pause();
      else { if (mPrev) mPrev.pause(); mPrev = new Audio(f); mPrev.dataset.f = f; mPrev.play().catch(() => {}); mPrev.onended = () => renderSide(); }
      return renderSide();
    }
    if (d.mpick !== undefined) return setMusic(d.mpick);
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
  // cột icon: mở bảng
  $('#rail').addEventListener('click', (e) => { const b = e.target.closest('[data-panel]'); if (!b) return; curPanel = b.dataset.panel; if (curPanel === 'canh' && selClip < 0) selClip = Math.max(0, clipAt(engine.time())); renderSide(); });
  // dòng thời gian: bấm cảnh → tua tới cảnh đó + mở bảng "Cảnh"
  $('#tlIn').addEventListener('change', (e) => { const f = e.target.files[0], i = +e.target.dataset.s; if (f && i >= 0) queueSlots([f], [i]); });
  // thanh ảnh: bấm ô → video nhảy tới ảnh đó; kéo thả đổi chỗ; thả ảnh từ máy vào → điền ô còn trống / ảnh mẫu
  const tls = $('#tls');
  tls.addEventListener('click', (e) => {
    const t = e.target.closest('.clip[data-clip]'); if (!t || t.classList.contains('addbox')) return;
    const k = +t.dataset.clip;
    if (k < 0) { const inp = $('#tlIn'); inp.dataset.s = t.dataset.slot; inp.value = ''; return inp.click(); } // ô trống
    const c = clips[k]; if (!c) return;
    if (!engine.paused()) $('#pp').click();
    engine.seek(c.t0 + c.dur * 0.5);
  });
  tls.addEventListener('change', (e) => { const t = e.target; if (!t.files || !t.files.length || (t.id !== 'tlAdd' && t.id !== 'tlAll')) return; const fs = [...t.files]; t.value = ''; if (t.id === 'tlAll') replaceAll(fs); else fillSlots(fs); });
  let tlDrag = -1;
  tls.addEventListener('dragstart', (e) => { const t = e.target.closest('.slot'); if (!t) return; tlDrag = +t.dataset.slot; e.dataTransfer.effectAllowed = 'move'; t.classList.add('drag'); });
  tls.addEventListener('dragover', (e) => {
    const t = e.target.closest('.slot');
    if ((tlDrag >= 0 && t) || e.dataTransfer.types.includes('Files')) { e.preventDefault(); $$('#tls .over').forEach((x) => x.classList.remove('over')); if (t) t.classList.add('over'); }
  });
  tls.addEventListener('dragleave', (e) => { const t = e.target.closest('.slot'); if (t) t.classList.remove('over'); });
  tls.addEventListener('drop', (e) => {
    e.preventDefault(); $$('#tls .over,#tls .drag').forEach((x) => x.classList.remove('over', 'drag'));
    if (e.dataTransfer.files.length) { tlDrag = -1; return fillSlots([...e.dataTransfer.files]); }
    const t = e.target.closest('.slot'); if (!t || tlDrag < 0) return;
    const to = +t.dataset.slot, from = tlDrag; tlDrag = -1;
    if (to === from) return;
    const list = slots(); const [m] = list.splice(from, 1); list.splice(to, 0, m); // chèn vào vị trí mới, các ảnh khác dịch theo
    writeSlots(list);
  });
  tls.addEventListener('dragend', () => { tlDrag = -1; $$('#tls .over,#tls .drag').forEach((x) => x.classList.remove('over', 'drag')); });
  document.addEventListener('mousedown', (e) => { const p = $('#txPop'); if (p && !p.contains(e.target) && !e.target.closest('[data-spd]')) closeTxPop(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#txPop') && !document.querySelector('.modal')) closeTxPop(); });
  $('#tlinfo').addEventListener('click', (e) => { const b = e.target.closest('[data-spd]'); if (b) openSpeedPop(b); });
  $('#undo').onclick = () => undoRedo(-1); $('#redo').onclick = () => undoRedo(1);
  document.addEventListener('keydown', (e) => { if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z' || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return; e.preventDefault(); undoRedo(e.shiftKey ? 1 : -1); });
  // ---------- sửa trên video: rê chuột lên ảnh → Thay ảnh / Căn chỉnh; rê lên chữ → viền, bấm để gõ ----------
  const cvPt = (e) => { const c = $('#cv'), r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; };
  const slotOfShown = (i) => slotOfSlide()[i];
  const hov = document.createElement('div'); hov.className = 'pv-hov'; hov.hidden = true; document.body.appendChild(hov);
  let hovPt = null, hovRaf = 0;
  const hideHov = () => { hov.hidden = true; hovPt = null; cancelAnimationFrame(hovRaf); $('#cv').style.cursor = ''; };
  const placeHov = () => {
    if (!hovPt || !engine || $('#noteEd') || document.querySelector('.modal')) { hov.hidden = true; return; }
    const c = $('#cv'), r = c.getBoundingClientRect(), k = r.width / c.width, [x, y] = hovPt;
    const box = (b) => Object.assign(hov.style, { left: r.left + b.l * k + 'px', top: r.top + b.t * k + 'px', width: (b.r - b.l) * k + 'px', height: (b.b - b.t) * k + 'px' });
    const nt = engine.noteAt(x, y), tx = !nt && engine.textAt(x, y), p = !nt && !tx && engine.photoAt(x, y);
    if (nt) { hov.hidden = true; c.style.cursor = 'text'; }
    else if (tx) { hov.innerHTML = ''; box(tx.box); hov.className = 'pv-hov ln'; hov.hidden = false; }
    else if (p) {
      const sl = slotOfShown(p.i), canCrop = sl >= 0 && !isClipU(slots()[sl] || sampleAt(sl));
      hov.innerHTML = sl >= 0 ? `<div class="pv-act"><button type="button" data-pv="rep" data-s="${sl}">↻ Thay ảnh</button>${canCrop ? `<button type="button" data-pv="crop" data-s="${sl}" data-r="${p.ratio}">⤢ Căn chỉnh</button>` : ''}</div>` : '';
      box(p.box); hov.className = 'pv-hov'; hov.hidden = false; c.style.cursor = '';
    } else { hov.hidden = true; c.style.cursor = ''; }
    if (!engine.paused()) hovRaf = requestAnimationFrame(placeHov);
  };
  $('#cv').addEventListener('mousemove', (e) => { hovPt = cvPt(e); cancelAnimationFrame(hovRaf); placeHov(); });
  $('#cv').addEventListener('mouseleave', (e) => { if (!hov.contains(e.relatedTarget)) hideHov(); });
  hov.addEventListener('mouseleave', (e) => { if (e.relatedTarget !== $('#cv')) hideHov(); });
  hov.addEventListener('mousemove', (e) => { if (e.target.closest('button')) return; hovPt = cvPt(e); placeHov(); });
  const editAt = (e) => { // bấm thẳng vào chữ / ảnh trên video
    const [x, y] = cvPt(e), c = $('#cv'), r = c.getBoundingClientRect(), k = r.width / c.width;
    const h = engine.noteAt(x, y); if (h) { hideHov(); return noteEditor(h, r, k); }
    const tx = engine.textAt(x, y); if (tx) { hideHov(); return lineEditor(tx, r, k); }
    const p = engine.photoAt(x, y); if (!p) return;
    if (!engine.paused()) $('#pp').click();
    const sl = slotOfShown(p.i); hideHov(); if (sl === undefined || sl < 0) return;
    if (!isClipU(slots()[sl] || sampleAt(sl))) vCrop(sl, p.ratio); else { const inp = $('#tlIn'); inp.dataset.s = sl; inp.value = ''; inp.click(); }
  };
  $('#cv').addEventListener('click', (e) => { if (engine && !$('#noteEd')) editAt(e); });
  hov.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pv]');
    if (!b) return editAt(e);
    if (!engine.paused()) $('#pp').click();
    hideHov();
    if (b.dataset.pv === 'rep') { const inp = $('#tlIn'); inp.dataset.s = b.dataset.s; inp.value = ''; inp.click(); }
    else vCrop(+b.dataset.s, +b.dataset.r);
  });
  $('#fs').onclick = () => { const c = $('#cv'); (c.requestFullscreen || c.webkitRequestFullscreen || (() => {})).call(c); };
  // kéo thả ảnh từ máy vào ô "Chọn ảnh hoặc kéo thả" → điền các ô trống
  side.addEventListener('dragover', (e) => { const dz = e.target.closest('.drop,.vslots'); if (dz && e.dataTransfer.types.includes('Files')) { e.preventDefault(); dz.classList.add('over'); } });
  side.addEventListener('dragleave', (e) => { const dz = e.target.closest('.drop,.vslots'); if (dz) dz.classList.remove('over'); });
  side.addEventListener('drop', (e) => {
    const dz = e.target.closest('.drop,.vslots'); if (!dz || !e.dataTransfer.files.length) return;
    e.preventDefault(); dz.classList.remove('over');
    const files = [...e.dataTransfer.files].filter((f) => /^(image|video)\//.test(f.type));
    const empty = slots().map((u, i) => (u || vPending.has(i) ? -1 : i)).filter((i) => i >= 0);
    if (files.length > empty.length) toast(`Mẫu này còn ${empty.length} ô trống — chỉ lấy ${empty.length} ảnh đầu`);
    queueSlots(files.slice(0, empty.length), empty.slice(0, files.length));
  }, true);
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
    const k = clipAt(t), pl = $('#tls .clip.play');
    if (!pl || +pl.dataset.clip !== k) { if (pl) pl.classList.remove('play'); const nb = $(`#tls [data-clip="${k}"]`); if (nb) { nb.classList.add('play'); if (!engine.paused()) nb.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } }
    requestAnimationFrame(tick);
  })();
}

function clipAt(t) { let k = 0; clips.forEach((c, i) => { if (t >= c.t0) k = i; }); return k; }
function start() {
  $('#introBox').innerHTML = '';
  $('#layout').hidden = false;
  engine = VideoEngine.create($('#cv'), { photo: card.data.cover || card.data.photos.find(Boolean) || '', photos: slidePhotos(), trial: false });
  curPanel = 'mau';
  renderSide();
  renderHeader();
  bind();
  refresh();
  engine.photosReady().then(renderTl); // ảnh tải xong mới biết chia cảnh
  engine.play();
  snap();
  status('Đã lưu ✓');
}

(async () => {
  try {
    const [meta, r] = await Promise.all([fetch('/api/meta').then((x) => x.json()), api(`/api/cards/${CARD_ID}`)]);
    META = meta;
    card = r.card;
    document.title = 'Video cưới — ' + meta.brand;
  } catch (e) {
    const nf = e.status === 404;
    $('#ttl').textContent = nf ? 'Không tìm thấy thiệp' : 'Chưa tải được';
    $('#introBox').innerHTML = `<div class="pageload bad">${nf ? 'Không tìm thấy thiệp này.' : 'Mạng chập chờn, chưa tải được.'} <a class="btn" href="${nf ? '/thiep-cua-toi' : location.href}">${nf ? 'Về thiệp của tôi' : 'Tải lại trang'}</a></div>`;
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
    <p style="margin:14px 0 0"><a href="/slide-cuoi">Xem các mẫu video</a></p>
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
