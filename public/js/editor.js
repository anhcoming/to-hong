// Trình sửa thiệp: form bên trái, xem trước trực tiếp bên phải, tự lưu.
const CARD_ID = location.pathname.split('/').pop();
let card, META;
let saveTimer = null, saving = false, pending = false;

const getP = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const setP = (o, p, v) => { const ks = p.split('.'); let a = o; ks.slice(0, -1).forEach((k) => (a = a[k])); a[ks[ks.length - 1]] = v; };

// ---------- dựng ô nhập ----------
function f(k, label, o = {}) {
  const v = getP(card.data, k) ?? '';
  const attrs = `data-k="${k}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} ${o.max ? `maxlength="${o.max}"` : ''}`;
  const input = o.type === 'textarea'
    ? `<textarea ${attrs} rows="${o.rows || 3}">${esc(v)}</textarea>`
    : `<input type="${o.type || 'text'}" ${attrs} value="${esc(v)}">`;
  return `<label class="field"><span>${label}</span>${input}${o.hint ? `<small>${o.hint}</small>` : ''}</label>`;
}
function person(who, label) {
  return `<section class="group panel"><h3>${label}</h3>
    <div class="grid2">
      ${f(`${who}.name`, 'Tên gọi trên thiệp', { ph: who === 'groom' ? 'Đức Minh' : 'Thu Hà', max: 40 })}
      ${f(`${who}.fullName`, 'Họ và tên đầy đủ', { ph: who === 'groom' ? 'Nguyễn Đức Minh' : 'Lê Thu Hà', max: 80 })}
      ${f(`${who}.father`, 'Bố', { ph: 'Ông Nguyễn Văn An', max: 80 })}
      ${f(`${who}.mother`, 'Mẹ', { ph: 'Bà Trần Thị Bình', max: 80 })}
    </div>
    ${f(`${who}.address`, 'Địa chỉ nhà ' + (who === 'groom' ? 'trai' : 'gái'), { ph: 'Phường…, Tỉnh/Thành phố…', max: 160 })}
  </section>`;
}

// ---------- các tab ----------
// Chọn mẫu: lọc theo nhóm (chip) + lưới ảnh bìa nhỏ; ảnh của mẫu đang dùng hiện theo bảng màu đang chọn
let tplGroup = null;
const tplCover = (t) => `/demo/cover-${t.id}-${(t.id === card.template && card.palette) || (t.palettes[0] && t.palettes[0].id)}.jpg`;
function tplPicker(cur) {
  const groups = (META.templateGroups || []).filter((g) => META.templates.some((t) => t.group === g.id));
  if (tplGroup === null) tplGroup = cur.group || '';
  const list = META.templates.filter((t) => !tplGroup || t.group === tplGroup);
  const chip = (id, name) => `<button data-tg="${id}" class="${tplGroup === id ? 'on' : ''}">${esc(name)}</button>`;
  return `<p class="muted tplnow">Đang dùng: <b>${esc(cur.name)}</b></p>
      ${groups.length > 1 ? `<div class="tgchips">${chip('', 'Tất cả')}${groups.map((g) => chip(g.id, g.name)).join('')}</div>` : ''}
      <div class="tplpick">${list.map((t) => `<button data-tpl="${t.id}" class="${t.id === card.template ? 'on' : ''}" title="${esc(t.desc)}" aria-pressed="${t.id === card.template}">
        <img src="${tplCover(t)}" alt="" loading="lazy"><span>${esc(t.name)}</span></button>`).join('')}</div>
`;
}

// Trình sửa mới: thiệp là màn hình chính (bấm ảnh/chữ trên thiệp để sửa). Những thứ không nằm trên thiệp
// gom vào 6 nút công cụ, mỗi nút mở một bảng nhỏ (máy tính: bên trái cạnh thiệp; điện thoại: trượt từ dưới lên).
const SHEETS = {
  tpl: 'Mẫu & màu',
  date: 'Tên, ngày & các lễ',
  media: 'Ảnh & nhạc',
  gift: 'Mừng cưới',
  guests: 'Khách mời & phản hồi',
  more: 'Thêm',
};
const panes = {
  tpl: () => {
    const tpl = META.templates.find((t) => t.id === card.template) || META.templates[0];
    return `
    <section class="group panel">
      ${tplPicker(tpl)}
      <h3 style="margin:18px 0 10px">Bảng màu</h3>
      <div class="pals">${tpl.palettes.map((p) => `<button data-pal="${p.id}" class="${p.id === card.palette ? 'on' : ''}"><i style="background:linear-gradient(135deg,${p.swatch[0]} 50%,${p.swatch[1]} 50%)"></i>${esc(p.name)}</button>`).join('')}</div>
    </section>`;
  },

  date: () => `
    <section class="group panel"><h3>Cô dâu chú rể</h3>
      <div class="grid2">${f('groom.name', 'Tên chú rể', { ph: 'Đức Minh', max: 40 })}${f('bride.name', 'Tên cô dâu', { ph: 'Thu Hà', max: 40 })}</div>
      <button class="btn soft block" id="famOpen" type="button">+ Họ tên đầy đủ, bố mẹ, địa chỉ hai nhà</button>
      <div id="fam" hidden>${person('groom', 'Nhà trai')}${person('bride', 'Nhà gái')}</div>
    </section>
    <section class="group panel"><h3>Ngày cưới <small>dùng cho trang bìa và đếm ngược</small></h3>
      <div class="grid2">${f('date', 'Ngày (dương lịch)', { type: 'date', hint: 'Ngày âm lịch tự tính và hiện trên thiệp' })}${f('time', 'Giờ', { type: 'time' })}</div>
    </section>
    <section class="group panel"><h3>Các lễ trong ngày cưới</h3>
      <p class="muted" style="margin:-6px 0 14px;font-size:14px">Tên lễ, nơi tổ chức và địa chỉ sửa được ngay trên thiệp. Ở đây chọn ngày giờ, thêm hoặc bớt lễ.</p>
      <div id="evs">${card.data.events.map((e, i) => `
        <div class="ev">
          <div class="ev-h"><b>${esc(e.name || `Lễ ${i + 1}`)}</b>
            <span>${i ? `<button class="btn sm plain" data-ev-up="${i}" title="Lên trên">↑</button>` : ''}
            <button class="btn sm danger" data-ev-del="${i}">Xoá</button></span></div>
          ${f(`events.${i}.name`, 'Tên lễ', { ph: 'Lễ Vu Quy / Lễ Thành Hôn / Tiệc Cưới', max: 60 })}
          <div class="grid2">${f(`events.${i}.date`, 'Ngày', { type: 'date' })}${f(`events.${i}.time`, 'Giờ', { type: 'time' })}</div>
          ${f(`events.${i}.place`, 'Nơi tổ chức', { ph: 'Nhà hàng Hoa Sen — Sảnh A', max: 120 })}
          ${f(`events.${i}.address`, 'Địa chỉ (hiện bản đồ)', { ph: 'Số nhà, đường, phường, tỉnh/thành', max: 200 })}
          ${f(`events.${i}.mapUrl`, '📍 Link Google Maps', { ph: 'Dán link vào đây', hint: 'Google Maps → tìm nhà hàng → Chia sẻ → Sao chép đường liên kết. Bản đồ trên thiệp sẽ ghim đúng chỗ.' })}
        </div>`).join('') || '<p class="muted">Chưa có lễ nào.</p>'}</div>
      ${card.data.events.length < 6 ? '<button class="btn soft block" id="evAdd">+ Thêm lễ</button>' : ''}
    </section>`,

  media: () => {
    const d = card.data;
    return `
    <section class="group panel"><h3>Album ảnh <small>${d.photos.filter(Boolean).length + [...pendingSlots].filter((k) => k !== 'cover').length}/24 ảnh</small></h3>
      <p class="muted" style="margin:-6px 0 12px;font-size:14px">Bấm thẳng vào ảnh trên thiệp để đổi, căn khung. Ở đây chọn nhiều ảnh một lúc và sắp xếp thứ tự.</p>
      <div class="photos">
        ${Array.from({ length: Math.max(d.photos.length, ...[...pendingSlots].filter((k) => k !== 'cover').map((k) => +k.split('.')[1] + 1)) }, (_, i) => {
          const u = d.photos[i];
          if (pendingSlots.has('photos.' + i)) { const l = localPhotos['photos.' + i]; return `<div class="photo up"${l ? ` style="background-image:url('${l}')"` : ''}><i></i></div>`; }
          return !u ? '' : `<div class="photo" style="background-image:url('${esc(u.split('#')[0])}')">${i ? `<button class="mv" data-ph-up="${i}" title="Lên trước">←</button>` : ''}<button data-ph-del="${i}" title="Xoá">×</button></div>`;
        }).join('')}
        ${d.photos.filter(Boolean).length + pendingSlots.size < 24 ? '<label class="drop">+ Thêm ảnh<br>(chọn nhiều)<input type="file" accept="image/*" multiple id="photosIn" hidden></label>' : ''}
      </div>
    </section>
    <section class="group panel"><h3>Nhạc nền</h3>
      ${musicUp ? `<p class="muted" style="margin:0"><span class="spin"></span> Đang tải lên "${esc(musicUp)}"…</p>` : d.music ? `<audio controls src="${esc(d.music)}" style="width:100%;margin-bottom:10px"></audio><button class="btn sm danger" data-music-del>Bỏ nhạc</button>` : `
        <label class="btn soft">Tải lên file MP3<input type="file" accept="audio/mpeg" id="musicIn" hidden></label>
        <p class="muted" style="font-size:13px;margin:10px 0 0">Tối đa 12MB. Chỉ dùng bản nhạc bạn có quyền sử dụng. Nhạc phát khi khách chạm "Mở thiệp".</p>`}
    </section>`;
  },

  gift: () => {
    const bankSel = (k) => `<label class="field"><span>Ngân hàng</span><select data-k="${k}.bin"><option value="">— Chọn ngân hàng —</option>${META.banks.map((b) => `<option value="${b.bin}" ${getP(card.data, k + '.bin') === b.bin ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></label>`;
    return `
    <section class="group panel"><h3>Tài khoản mừng cưới <small>khách quét QR để chuyển</small></h3>
      <p class="muted" style="margin:-6px 0 14px;font-size:14px">Tiền chuyển thẳng vào tài khoản của bạn, không qua hệ thống. Để trống nếu không muốn hiện.</p>
      <h4 style="margin:0 0 8px">Chú rể</h4>
      ${bankSel('gifts.groom')}${f('gifts.groom.acc', 'Số tài khoản', { max: 30 })}
      ${f('gifts.groom.holder', 'Tên chủ tài khoản', { ph: 'NGUYEN DUC MINH', max: 60 })}
      <h4 style="margin:8px 0 8px">Cô dâu</h4>
      ${bankSel('gifts.bride')}${f('gifts.bride.acc', 'Số tài khoản', { max: 30 })}
      ${f('gifts.bride.holder', 'Tên chủ tài khoản', { ph: 'LE THU HA', max: 60 })}
    </section>`;
  },

  guests: () => `<div id="gBox"><div class="skeleton" style="height:200px"></div></div><div id="rBox" style="margin-top:16px"><div class="skeleton" style="height:200px"></div></div>`,

  more: () => {
    const tg = (k, l) => `<label class="check"><input type="checkbox" data-k="show.${k}" ${card.data.show[k] ? 'checked' : ''}>${l}</label>`;
    return `
    <section class="group panel"><h3>Xem thiệp</h3>
      <div class="pvmode2" id="pvMode2">
        <button data-mode="edit" class="${liveEdit ? 'on' : ''}">✎ Sửa trực tiếp</button><button data-mode="view" class="${liveEdit ? '' : 'on'}">👁 Xem như khách</button>
      </div>
    </section>
    <section class="group panel"><h3>Hiện/ẩn các phần trên thiệp</h3>
      <div class="toggles">${tg('calendar', 'Lịch tháng')}${tg('countdown', 'Đếm ngược')}${tg('gallery', 'Album ảnh')}${tg('rsvp', 'Xác nhận tham dự')}${tg('gift', 'Hộp mừng cưới')}${tg('wishes', 'Sổ lưu bút')}</div>
    </section>
    <section class="group panel"><h3>Tên & đường dẫn</h3>
      <label class="field"><span>Tên thiệp (chỉ bạn thấy)</span><input id="titleIn" value="${esc(card.title)}" maxlength="60"></label>
      <label class="field"><span>Đường dẫn thiệp</span>
        <div style="display:flex;gap:8px"><div class="slug" style="flex:1"><span>${esc(META.baseUrl.replace(/^https?:\/\//, ''))}/t/</span><input id="slugIn" value="${esc(card.slug)}" maxlength="40"></div><button class="btn plain" id="slugSave">Lưu</button></div>
        <small>Chỉ dùng chữ không dấu, số và dấu gạch ngang. Ví dụ: minh-ha-2026</small></label>
    </section>
    <section class="group panel" style="display:grid;gap:8px">
      <a class="btn block plain" href="/sua-video/${CARD_ID}">🎬 Video cưới</a>
      ${card.led && card.led.created ? `<a class="btn block plain" href="/sua-led/${CARD_ID}">✨ Màn LED</a>` : ''}
    </section>
    ${card.status === 'published' ? `<section class="group panel"><h3>Tạm ẩn thiệp</h3><p class="muted" style="margin:-6px 0 12px;font-size:14px">Khách mời sẽ không mở được thiệp cho tới khi bạn phát hành lại.</p><button class="btn danger" id="unpub">Chuyển về bản nháp</button></section>` : ''}`;
  },
};

let curTab = null;
function showTab(t) {
  if (!panes[t]) t = null;
  curTab = t;
  $$('#tools button').forEach((b) => b.classList.toggle('on', b.dataset.tab === t));
  document.body.classList.toggle('sheet-open', !!t);
  if (!t) { $('#panes').innerHTML = ''; return; }
  if (t === 'guests' && card.guest) { showTab(null); return askLogin('guests'); }
  $('#sheetTitle').textContent = SHEETS[t];
  $('#panes').innerHTML = `<div class="pane">${panes[t]()}</div>`;
  $('#sheetBody').scrollTop = 0;
  if (t === 'guests') { loadGuests(); loadResponses(); }
}
function rerender() {
  if (!curTab) return;
  const body = $('#sheetBody'), y = body.scrollTop;
  $('#panes').innerHTML = `<div class="pane">${panes[curTab]()}</div>`;
  body.scrollTop = y;
  if (curTab === 'guests') { loadGuests(); loadResponses(); }
}

// ---------- khách chưa đăng nhập ----------
// card.guest: thiệp nháp gắn với trình duyệt này (chưa có tài khoản). Sửa chữ, đổi mẫu, xem trước được ngay;
// tải ảnh / nhạc, khách mời, đường dẫn riêng, phát hành thì mời đăng nhập — đăng nhập xong thiệp nháp về tài khoản, quay lại đúng trang này.
const LOGIN_WHY = {
  save: 'Đăng nhập để giữ thiệp này trong tài khoản của bạn, mở lại sửa tiếp trên máy nào cũng được, rồi phát hành gửi khách.',
  photo: 'Đăng nhập để tải ảnh cưới và nhạc của bạn lên thiệp.',
  guests: 'Đăng nhập để thêm khách mời và lấy link mang tên riêng từng người.',
  slug: 'Đăng nhập để đặt đường dẫn riêng cho thiệp.',
};
function askLogin(why = 'save') {
  const next = encodeURIComponent(location.pathname);
  openModal(`<h2 style="margin-top:0">Lưu thiệp vào tài khoản</h2>
    <p class="muted" style="margin:0 0 16px">${LOGIN_WHY[why] || LOGIN_WHY.save} Những gì bạn vừa sửa được giữ nguyên.</p>
    <div style="display:grid;gap:8px">
      ${META.googleLogin ? `<a class="btn block" data-go href="/auth/google?next=${next}">Tiếp tục với Google</a>` : ''}
      <a class="btn block ${META.googleLogin ? 'plain' : ''}" data-go href="/dang-nhap?dang-ky=1&next=${next}">Dùng email</a>
    </div>
    <p class="muted" style="font-size:13px;margin:14px 0 0">Miễn phí, không cần thẻ. Dùng thử ${META.trialDays} ngày, mời ${META.trialGuestLimit} khách.</p>`, (box) => {
    box.addEventListener('click', async (e) => {
      const a = e.target.closest('[data-go]'); if (!a) return;
      e.preventDefault();
      clearTimeout(saveTimer); saveTimer = null;
      await save(); // chữ đang gõ dở phải nằm trên máy chủ trước khi rời trang
      location.href = a.href;
    });
  });
}

// ---------- lưu ----------
function status(t) { $('#saved').textContent = card && card.guest && t === 'Đã lưu ✓' ? 'Bản nháp tạm' : t; }
function scheduleSave(delay = 700) {
  status('Đang chỉnh sửa…');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, delay);
}
async function save() {
  if (saving) { pending = true; return; }
  saving = true;
  status('Đang lưu…');
  try {
    const r = await api(`/api/cards/${CARD_ID}`, { method: 'PUT', body: { data: card.data, title: card.title, template: card.template, palette: card.palette }, quiet: true });
    Object.assign(card, { ...r.card, data: card.data }); // giữ nguyên dữ liệu đang gõ
    upStatus(); // còn ảnh đang tải thì báo số ảnh, hết thì "Đã lưu ✓"
    refreshPreview();
    renderHeader();
  } catch (e) {
    status('Lưu thất bại');
    toast(e.message, true);
  } finally {
    saving = false;
    if (pending) { pending = false; save(); }
  }
}
// Khung xem trước = khung sửa trực tiếp (bấm ảnh/chữ để sửa). "Xem như khách" tắt các viền sửa.
let liveEdit = true;
function setMode(edit) {
  liveEdit = edit;
  $$('#pvMode button').forEach((x) => x.classList.toggle('on', (x.dataset.m === 'edit') === edit));
  refreshPreview();
}
// Vẽ lại thiệp sau mỗi lần lưu mà không "F5" trước mặt người dùng: tải bản mới vào một khung ẩn
// đè lên khung cũ, cuộn tới đúng chỗ đang xem rồi mới đổi — không nháy trắng, không nhảy về đầu.
function refreshPreview() {
  const fr = $('#frame');
  const src = `/t/${card.slug}?preview=1${liveEdit ? '&edit=1' : ''}`;
  if (!fr.getAttribute('src')) { fr.src = src; return; }
  const old = $('#frameNext'); if (old) old.remove(); // lần lưu trước chưa tải xong → bỏ, tải bản mới nhất
  const nf = document.createElement('iframe');
  nf.id = 'frameNext'; nf.title = fr.title; nf.className = 'buf';
  let done = false;
  const swap = () => {
    if (done || !nf.isConnected) return;
    done = true;
    const cur = $('#frame');
    try { nf.contentWindow.scrollTo({ top: cur.contentWindow.scrollY || 0, behavior: 'instant' }); } catch (e) { /* bỏ qua */ }
    requestAnimationFrame(() => { cur.remove(); nf.id = 'frame'; nf.className = ''; });
  };
  // chế độ sửa: khung mới báo "ready" ngay khi dựng xong trang (không chờ tải hết ảnh — ảnh đa phần đã có sẵn trong bộ nhớ đệm)
  nf.onload = swap;
  nf._ready = () => { const fo = nf.contentDocument && nf.contentDocument.fonts; (fo ? fo.ready : Promise.resolve()).then(swap, swap); };
  nf.src = src;
  fr.parentNode.appendChild(nf);
}
// đổi chữ ngay trên khung đang xem (chưa cần chờ lưu xong rồi vẽ lại)
function livePatch(key, value) {
  try { $('#frame').contentWindow.postMessage({ cePatch: 1, key, value }, location.origin); } catch (e) { /* bỏ qua */ }
}

// ---------- tiêu đề + phát hành ----------
function renderHeader() {
  $('#ttl').textContent = [card.data.groom.name, card.data.bride.name].filter(Boolean).join(' & ') || card.title;
  const pa = $('#pubArea');
  if (card.guest) {
    pa.innerHTML = '<button class="btn sm" id="loginBtn">Đăng nhập để lưu</button>';
    $('#loginBtn').onclick = () => askLogin('save');
    return;
  }
  if (card.status !== 'published') {
    pa.innerHTML = '<button class="btn sm" id="pubBtn">Phát hành thiệp</button>';
  } else {
    pa.innerHTML = `<button class="btn sm soft" id="shareBtn">Chia sẻ</button>${card.paid ? '' : ' <button class="btn sm" id="payBtn">Kích hoạt</button>'}`;
  }
  const pb = $('#pubBtn'); if (pb) pb.onclick = publish;
  const sb = $('#shareBtn'); if (sb) sb.onclick = shareModal;
  const yb = $('#payBtn'); if (yb) yb.onclick = () => openPayModal(CARD_ID, reloadCard);
}
// Bảng "thông tin chính": tên đôi, ngày giờ, nơi tổ chức tiệc — điền một lần là thiệp có đủ nội dung để gửi.
// Tự mở khi thiệp còn trống tên; mở lại khi bấm Phát hành mà còn thiếu.
function quickStart(forPublish) {
  const d = card.data;
  const party = d.events.find((e) => /tiệc/i.test(e.name)) || d.events[d.events.length - 1];
  const inp = (id, label, v, o = {}) => `<label class="field"><span>${label}</span><input id="${id}" type="${o.type || 'text'}" value="${esc(v || '')}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} ${o.max ? `maxlength="${o.max}"` : ''} ${o.req ? 'required' : ''} autocomplete="off"></label>`;
  openModal(`<h2 style="margin-top:0">${forPublish ? 'Còn thiếu vài thông tin' : 'Bắt đầu nhanh'}</h2>
    <p class="muted" style="margin:-6px 0 14px;font-size:14px">${forPublish ? 'Điền đủ tên cô dâu, chú rể và ngày cưới để phát hành thiệp.' : 'Điền mấy dòng này là thiệp có đủ nội dung chính. Mọi thứ khác bấm thẳng lên thiệp để sửa.'}</p>
    <form id="qsF">
      <div class="grid2">${inp('qsG', 'Tên chú rể', d.groom.name, { ph: 'Đức Minh', max: 40, req: 1 })}${inp('qsB', 'Tên cô dâu', d.bride.name, { ph: 'Thu Hà', max: 40, req: 1 })}</div>
      <div class="grid2">${inp('qsD', 'Ngày cưới', d.date, { type: 'date', req: 1 })}${inp('qsT', 'Giờ tiệc', (party && party.time) || d.time, { type: 'time' })}</div>
      ${party ? inp('qsP', 'Nơi tổ chức tiệc (không bắt buộc)', party.place, { ph: 'Nhà hàng Hoa Sen — Sảnh A', max: 120 }) : ''}
      <button class="btn block" style="margin-top:6px">${forPublish ? 'Lưu & phát hành' : 'Xong, xem thiệp'}</button>
      ${forPublish ? '' : '<button type="button" class="btn block plain" id="qsSkip" style="margin-top:8px">Để sau</button>'}
    </form>`, (box, close) => {
    if (!d.groom.name) setTimeout(() => $('#qsG', box).focus(), 60);
    const sk = $('#qsSkip', box); if (sk) sk.onclick = close;
    $('#qsF', box).onsubmit = async (e) => {
      e.preventDefault();
      const v = (id) => ($(id, box) ? $(id, box).value.trim() : '');
      d.groom.name = v('#qsG'); d.bride.name = v('#qsB');
      const old = d.date;
      d.date = v('#qsD');
      d.events.forEach((ev) => { if (!ev.date || ev.date === old) ev.date = d.date; }); // các lễ chưa có ngày (hoặc đang theo ngày cũ) theo ngày cưới
      if (party) { if (v('#qsT')) party.time = v('#qsT'); party.place = v('#qsP'); }
      if (!d.time && v('#qsT')) d.time = v('#qsT');
      close();
      if (forPublish) { rerender(); renderHeader(); publish(); } else applyLive(); // publish tự lưu trước khi phát hành
    };
  });
}
async function publish() {
  clearTimeout(saveTimer);
  if (!card.data.groom.name || !card.data.bride.name || !card.data.date) return quickStart(true);
  while (saving) await new Promise((r) => setTimeout(r, 100)); // đợi lần lưu đang chạy xong rồi lưu bản mới nhất
  await save();
  try {
    await api(`/api/cards/${CARD_ID}/publish`, { method: 'POST', body: {} });
    await reloadCard();
    shareModal(true);
  } catch (e) { toast(e.message, true); }
}
function shareModal(first) {
  const url = card.url;
  const msg = `Trân trọng kính mời bạn tới dự lễ cưới của ${card.data.groom.name} & ${card.data.bride.name}: ${url}`;
  openModal(`<h2>${first ? '🎉 Thiệp đã được phát hành!' : 'Chia sẻ thiệp'}</h2>
    <p class="muted" style="margin:0 0 16px">Gửi link chung cho mọi người, hoặc vào tab <b>Khách mời</b> để tạo link có tên riêng từng khách.</p>
    <div style="display:flex;gap:8px;margin-bottom:12px"><input class="input" readonly value="${esc(url)}"><button class="btn" id="cpL">Chép link</button></div>
    <button class="btn block plain" id="cpM">Chép lời mời kèm link (dán vào Zalo)</button>
    <a class="btn block ghost" style="margin-top:8px" href="${esc(url)}" target="_blank">Mở thiệp như khách mời</a>
    ${card.paid ? '' : `<p class="muted" style="font-size:13px;margin:16px 0 0">Bản dùng thử: mời tối đa ${META.trialGuestLimit} khách, hiệu lực ${META.trialDays} ngày. <a href="#" id="toPay">Kích hoạt để không giới hạn</a></p>`}`,
  (box, close) => {
    $('#cpL', box).onclick = () => copyText(url, 'Đã chép link thiệp');
    $('#cpM', box).onclick = () => copyText(msg, 'Đã chép lời mời');
    const tp = $('#toPay', box); if (tp) tp.onclick = (e) => { e.preventDefault(); close(); openPayModal(CARD_ID, reloadCard); };
  });
}
async function reloadCard() {
  const r = await api(`/api/cards/${CARD_ID}`);
  card = r.card;
  renderHeader();
  refreshPreview();
}

// ---------- khách mời ----------
async function loadGuests() {
  const box = $('#gBox');
  if (!box) return;
  const { guests, limit } = await api(`/api/cards/${CARD_ID}/guests`);
  const opened = guests.filter((g) => g.opens).length;
  box.innerHTML = `
    ${card.status !== 'published' ? '<div class="panel group" style="background:var(--warn-soft);border-color:transparent">Thiệp đang là <b>bản nháp</b> — khách chưa mở được link. Bấm <b>Phát hành thiệp</b> ở góc trên khi đã sẵn sàng.</div>' : ''}
    <section class="group panel"><h3>Thêm khách mời <small>${guests.length} khách · dùng chung với <a href="/so-tay#guests">Sổ tay cưới</a></small></h3>
      <form id="gForm">
        <label class="field"><span>Mỗi dòng một tên — hiện đúng như vậy trên thiệp</span><textarea name="names" rows="4" placeholder="Anh Hùng & người thương&#10;Cô chú Tư và gia đình&#10;Bạn Lan Anh"></textarea></label>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><select name="side" class="input" style="width:auto"><option value="">Khách chung</option><option value="trai">Khách nhà trai</option><option value="gai">Khách nhà gái</option></select><button class="btn">Thêm khách</button></div>
      </form>
      ${limit ? `<p class="muted" style="font-size:13px;margin:12px 0 0">Bản dùng thử: ${limit} khách đầu danh sách có link mang tên riêng. <a href="#" id="gPay">Kích hoạt để gửi link riêng cho tất cả</a></p>` : ''}
    </section>
    <section class="group panel"><h3>Danh sách <small>${opened}/${guests.length} đã mở thiệp</small></h3>
      ${guests.length ? `<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Khách</th><th>Trạng thái</th><th></th></tr></thead><tbody>
        ${guests.map((g) => `<tr data-g="${g.id}">
          <td><b>${esc(g.name)}</b><br><span class="muted" style="font-size:12px">${g.side === 'trai' ? 'Nhà trai' : g.side === 'gai' ? 'Nhà gái' : ''}</span></td>
          <td>${g.rsvp ? (g.rsvp.attending === 'yes' ? `<span class="chip ok">Sẽ đến · ${g.rsvp.count} người</span>` : '<span class="chip red">Không đến</span>') : g.opens ? `<span class="chip warn">Đã mở ${g.opens} lần</span>` : '<span class="chip">Chưa mở</span>'}</td>
          <td style="white-space:nowrap;text-align:right">${g.locked ? '<button class="btn sm plain" data-glock>🔒 Kích hoạt để gửi</button>' : `<button class="btn sm soft" data-gc="${esc(g.url)}" data-gn="${esc(g.name)}">Chép lời mời</button>`} <button class="btn sm danger" data-gd="${g.id}" title="Xoá">×</button></td>
        </tr>`).join('')}</tbody></table></div>` : '<p class="empty">Chưa có khách nào. Thêm tên ở trên để tạo link riêng cho từng người.</p>'}
    </section>`;
  $('#gForm').onsubmit = async (e) => {
    e.preventDefault();
    try {
      const r = await api(`/api/cards/${CARD_ID}/guests`, { method: 'POST', body: { names: e.target.names.value, side: e.target.side.value } });
      toast(`Đã thêm ${r.added} khách`);
      loadGuests();
    } catch (err) { toast(err.message, true); }
  };
  const gp = $('#gPay'); if (gp) gp.onclick = (e) => { e.preventDefault(); openPayModal(CARD_ID, reloadCard); };
  $$('[data-glock]').forEach((b) => (b.onclick = () => openPayModal(CARD_ID, reloadCard)));
  $$('[data-gc]').forEach((b) => (b.onclick = () => copyText(`Trân trọng kính mời ${b.dataset.gn} tới dự lễ cưới của ${card.data.groom.name} & ${card.data.bride.name}. Thiệp mời: ${b.dataset.gc}`, `Đã chép lời mời cho ${b.dataset.gn}`)));
  $$('[data-gd]').forEach((b) => (b.onclick = async () => {
    if (!confirm('Xoá khách này? Link riêng của họ sẽ không còn hiện tên.')) return;
    await api(`/api/guests/${b.dataset.gd}`, { method: 'DELETE' });
    loadGuests();
  }));
}

// ---------- phản hồi ----------
async function loadResponses() {
  const box = $('#rBox');
  if (!box) return;
  const { rsvps, wishes } = await api(`/api/cards/${CARD_ID}/responses`);
  const yes = rsvps.filter((r) => r.attending === 'yes');
  const people = yes.reduce((n, r) => n + r.count, 0);
  const side = (s) => yes.filter((r) => r.side === s).reduce((n, r) => n + r.count, 0);
  box.innerHTML = `
    <div class="sumrow">
      <div class="sum panel"><b>${people}</b><span>người sẽ đến</span></div>
      <div class="sum panel"><b>${side('trai')} / ${side('gai')}</b><span>nhà trai / nhà gái</span></div>
      <div class="sum panel"><b>${rsvps.length - yes.length}</b><span>không đến được</span></div>
      <div class="sum panel"><b>${wishes.length}</b><span>lời chúc</span></div>
    </div>
    <section class="group panel"><h3 style="display:flex;justify-content:space-between;align-items:center">Xác nhận tham dự ${rsvps.length ? `<a class="btn sm plain" href="/api/cards/${CARD_ID}/rsvps.csv">Tải Excel (CSV)</a>` : ''}</h3>
      ${rsvps.length ? `<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Tên</th><th>Tham dự</th><th>Nhà</th><th>Ghi chú</th><th>Lúc</th></tr></thead><tbody>
        ${rsvps.map((r) => `<tr><td><b>${esc(r.name)}</b></td><td>${r.attending === 'yes' ? `<span class="chip ok">${r.count} người</span>` : '<span class="chip red">Không</span>'}</td><td>${r.side === 'gai' ? 'Gái' : 'Trai'}</td><td>${esc(r.note)}</td><td class="muted">${fmtDateTime(r.createdAt)}</td></tr>`).join('')}
      </tbody></table></div>` : '<p class="empty">Chưa có ai xác nhận.</p>'}
    </section>
    <section class="group panel"><h3>Lời chúc</h3>
      ${wishes.length ? wishes.map((w) => `<div style="padding:12px 0;border-bottom:1px solid var(--line);display:flex;gap:12px;justify-content:space-between;${w.hidden ? 'opacity:.5' : ''}">
        <div><b>${esc(w.name)}</b> <span class="muted" style="font-size:12px">${fmtDateTime(w.createdAt)}</span><p style="margin:4px 0 0;white-space:pre-line">${esc(w.message)}</p></div>
        <button class="btn sm plain" data-wt="${w.id}">${w.hidden ? 'Hiện lại' : 'Ẩn'}</button></div>`).join('') : '<p class="empty">Chưa có lời chúc nào.</p>'}
    </section>`;
  $$('[data-wt]').forEach((b) => (b.onclick = async () => { await api(`/api/wishes/${b.dataset.wt}/toggle`, { method: 'POST' }); loadResponses(); refreshPreview(); }));
}

// ---------- sự kiện giao diện ----------
// Tải nhiều ảnh từ bảng "Ảnh & nhạc" mà không che màn hình: giữ chỗ từng ô ngay (vòng chờ), nén xong hiện ảnh trong máy
// ở bảng lẫn trên thiệp, tải ngầm (3 ảnh một lúc), xong ảnh nào lưu ảnh đó. Ô đang chờ: card.data chưa đổi.
let musicUp = ''; // tên file nhạc đang tải lên
const pendingSlots = new Set(); // các vị trí (cover, photos.3…) đang có ảnh chờ tải
function freeSlots(n) {
  const ps = card.data.photos, out = [];
  for (let i = 0; out.length < n && i < 24; i++) if (!ps[i] && !pendingSlots.has('photos.' + i)) out.push('photos.' + i);
  return out;
}
let upQueue = [], upRunning = 0;
function queueUploads(files, keys) {
  keys.forEach((key, i) => { pendingSlots.add(key); upQueue.push({ key, file: files[i] }); });
  if (curTab === 'media') rerender();
  upStatus();
  for (let i = 0; i < 3; i++) pumpUploads();
}
function upStatus() { status(pendingSlots.size ? `Đang tải ${pendingSlots.size} ảnh lên…` : 'Đã lưu ✓'); }
async function pumpUploads() {
  if (upRunning >= 3 || !upQueue.length) return;
  upRunning++;
  const { key, file } = upQueue.shift();
  let local = '';
  try {
    const small = await resizeImage(file);
    local = URL.createObjectURL(small);
    localPhotos[key] = local;
    showLocalPhoto($('#frame').contentWindow, key);
    if (curTab === 'media') rerender();
    const url = await uploadFile(small, { quiet: true, resized: true });
    await new Promise((ok) => { const im = new Image(); im.onload = im.onerror = ok; im.src = url; setTimeout(ok, 8000); });
    // trong lúc chờ, ô giữ chỗ bị ảnh khác chiếm (sắp xếp lại) → sang ô trống khác, không đè ảnh
    let to = key;
    if (key !== 'cover' && card.data.photos[+key.split('.')[1]]) { pendingSlots.delete(key); to = freeSlots(1)[0]; }
    if (to) photoSet(to, url); else { toast('Album đã đủ 24 ảnh', true); discardUpload(url); }
  } catch (e) {
    toast(e.message, true);
  } finally {
    pendingSlots.delete(key);
    if (localPhotos[key] === local) delete localPhotos[key];
    if (local) setTimeout(() => URL.revokeObjectURL(local), 60000);
    upRunning--;
    if (curTab === 'media') rerender();
    scheduleSave(400); // gom các ảnh xong gần nhau vào một lần lưu
    upStatus();
    pumpUploads();
  }
}

function bind() {
  const panesEl = $('#panes');
  panesEl.addEventListener('input', (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    setP(card.data, k, e.target.type === 'checkbox' ? e.target.checked : e.target.value);
    if (typeof e.target.value === 'string' && e.target.type !== 'checkbox') livePatch(k, e.target.value.trim());
    scheduleSave(e.target.type === 'checkbox' || e.target.tagName === 'SELECT' ? 50 : 700);
    if (k.endsWith('.name') && (k.startsWith('groom') || k.startsWith('bride'))) renderHeader();
  });
  // khách chưa đăng nhập: chặn trước khi mở hộp chọn tệp
  panesEl.addEventListener('click', (e) => {
    if (!card.guest || !e.target.closest('input[type=file]')) return;
    e.preventDefault(); askLogin('photo');
  }, true);
  panesEl.addEventListener('change', async (e) => {
    const t = e.target;
    const mk = /^events\.(\d+)\.mapUrl$/.exec(t.dataset.k || '');
    if (mk) { // link Google Maps trong bảng "Ngày & lễ" → đọc toạ độ để bản đồ ghim đúng chỗ
      const ev = card.data.events[+mk[1]], url = t.value.trim();
      ev.mapPin = '';
      if (!url) return scheduleSave(50);
      const co = /^(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})$/.exec(url);
      if (co) { ev.mapPin = `${+co[1]},${+co[2]}`; ev.mapUrl = `https://www.google.com/maps?q=${ev.mapPin}`; rerender(); toast('Đã ghim vị trí theo toạ độ'); return scheduleSave(50); }
      try {
        const r = await api(`/api/maplink?url=${encodeURIComponent(url)}`, { quiet: true });
        if (ev.mapUrl !== url) return;
        ev.mapPin = r.pin || '';
        if (r.name && !ev.place) ev.place = r.name;
        rerender();
        toast(ev.mapPin ? `Đã ghim vị trí${r.name ? ': ' + r.name : ''}` : 'Đã lưu link cho nút "Chỉ đường"');
      } catch (err) { toast(err.message, true); }
      scheduleSave(50);
      return;
    }
    if (t.id === 'titleIn') { card.title = t.value; scheduleSave(50); }
    if (t.id === 'photosIn' && t.files.length) {
      const keys = freeSlots(t.files.length); // lấp ô trống trước, giữ đúng thứ tự đã chọn
      if (keys.length < t.files.length) toast(`Album tối đa 24 ảnh — chỉ thêm ${keys.length} ảnh đầu`, true);
      queueUploads(Array.from(t.files).slice(0, keys.length), keys);
    }
    if (t.id === 'musicIn' && t.files[0]) {
      const f = t.files[0];
      musicUp = f.name;
      rerender();
      status('Đang tải nhạc lên…');
      try { card.data.music = await uploadFile(f, { quiet: true }); musicUp = ''; rerender(); save(); }
      catch (err) { musicUp = ''; rerender(); toast(err.message, true); status('Tải nhạc thất bại'); }
    }
  });
  panesEl.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const d = card.data;
    const ds = b.dataset;
    let changed = true;
    if (b.id === 'famOpen') { b.hidden = true; $('#fam').hidden = false; return; }
    if (b.id === 'evAdd') d.events.push({ name: '', date: d.date, time: '', place: '', address: '', mapUrl: '' });
    else if (ds.evDel !== undefined) { if (!confirm('Xoá sự kiện này?')) return; d.events.splice(+ds.evDel, 1); }
    else if (ds.evUp !== undefined) { const i = +ds.evUp; [d.events[i - 1], d.events[i]] = [d.events[i], d.events[i - 1]]; }
    else if (ds.phDel !== undefined) { d.photos[+ds.phDel] = ''; trimPhotos(); }
    else if (ds.phUp !== undefined) { const i = +ds.phUp; let j = i - 1; while (j > 0 && !d.photos[j]) j--; [d.photos[j], d.photos[i]] = [d.photos[i], d.photos[j]]; }
    else if (ds.coverDel !== undefined) d.cover = '';
    else if (ds.musicDel !== undefined) d.music = '';
    else if (ds.tg !== undefined) { tplGroup = ds.tg; rerender(); return; }
    else if (ds.mode) { setMode(ds.mode === 'edit'); rerender(); return; }
    else if (ds.tpl) { if (card.template !== ds.tpl) { card.template = ds.tpl; card.palette = ''; } }
    else if (ds.pal) card.palette = ds.pal;
    else if (b.id === 'slugSave') {
      if (card.guest) return askLogin('slug');
      try {
        const r = await api(`/api/cards/${CARD_ID}`, { method: 'PUT', body: { slug: $('#slugIn').value } });
        card.slug = r.card.slug; card.url = r.card.url;
        $('#slugIn').value = card.slug;
        toast('Đã đổi đường dẫn thiệp');
        refreshPreview();
      } catch (err) { toast(err.message, true); }
      return;
    } else if (b.id === 'unpub') {
      if (!confirm('Chuyển thiệp về bản nháp? Khách sẽ tạm thời không mở được.')) return;
      await api(`/api/cards/${CARD_ID}/publish`, { method: 'POST', body: { publish: false } });
      await reloadCard();
      rerender();
      return;
    } else changed = false;
    if (!changed) return;
    rerender();
    if (ds.tpl || ds.pal) {
      // đổi mẫu thì máy chủ chọn bảng màu mặc định — lưu xong vẽ lại để nút màu đúng
      await save();
      rerender();
    } else save();
  });
  // nút công cụ: bấm lần nữa (hoặc ×, hoặc nền mờ trên điện thoại) để đóng bảng
  $('#tools').addEventListener('click', (e) => { const t = e.target.closest('[data-tab]'); if (t) showTab(curTab === t.dataset.tab ? null : t.dataset.tab); });
  $('#sheetX').onclick = () => showTab(null);
  $('#scrim').onclick = () => showTab(null);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && curTab && !document.querySelector('.modal')) showTab(null); });
  $('#pvMode').addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (b) setMode(b.dataset.m === 'edit'); });
  window.addEventListener('beforeunload', (e) => { if (saveTimer && $('#saved').textContent.startsWith('Đang')) { e.preventDefault(); e.returnValue = ''; } });
}

// ---------- sửa trực tiếp trên thiệp (kiểu Canva) ----------
// Khung xem trước báo lại người dùng bấm vào ô ảnh nào / dòng chữ nào (public/card/edit.js).
const baseUrl = (u) => String(u || '').split('#')[0];
// "#p=x,y[,z]": điểm lấy nét (phần trăm) + mức phóng to (1–4)
const focusOf = (u) => { const m = /#p=([\d.]+),([\d.]+)(?:,([\d.]+))?/.exec(u || ''); return m ? [+m[1], +m[2], Math.max(1, +m[3] || 1)] : [50, 50, 1]; };
const withFocus = (u, x, y, z = 1) => {
  x = Math.round(x); y = Math.round(y); z = Math.round(Math.min(4, Math.max(1, z)) * 100) / 100;
  if (x === 50 && y === 50 && z === 1) return baseUrl(u);
  return `${baseUrl(u)}#p=${x},${y}${z > 1 ? ',' + z : ''}`;
};
function photoGet(key) {
  if (key === 'cover') return card.data.cover;
  const i = +key.split('.')[1];
  return card.data.photos[i] || '';
}
function trimPhotos() { const p = card.data.photos; while (p.length && !p[p.length - 1]) p.pop(); }
function photoSet(key, url) {
  const d = card.data;
  if (key === 'cover') { d.cover = url; return; }
  const i = +key.split('.')[1];
  // ảnh nằm đúng ô được bấm: ô phía sau còn trống thì chừa '' cho các ô ở giữa; xoá ảnh để lại ô trống, ảnh khác không bị dồn
  while (d.photos.length <= i) d.photos.push('');
  d.photos[i] = url || '';
  trimPhotos();
}
function applyLive() { rerender(); renderHeader(); clearTimeout(saveTimer); save(); }
function pickFile(accept = 'image/*') {
  return new Promise((ok) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = accept;
    inp.onchange = () => ok(inp.files[0] || null);
    inp.click();
  });
}
// Ảnh đang tải lên: hiện ngay bản trong máy trên thiệp (kể cả khi thiệp vẽ lại giữa chừng), tải lên chạy ngầm
const localPhotos = {};
function showLocalPhoto(win, key) {
  try { win.postMessage({ cePhoto: 1, key, src: localPhotos[key] }, location.origin); } catch (e) { /* bỏ qua */ }
}
// Ảnh mới từ máy: nén ảnh → mở ngay bảng căn chỉnh, đồng thời tải ảnh lên ngầm (thường xong trước khi căn xong)
// → bấm Xong thì hiện tạm lên thiệp đúng phần đã căn, chờ tải xong (nếu chưa) rồi lưu vào thiệp.
// Đóng bảng căn chỉnh = bỏ ảnh vừa chọn (ảnh đã tải lên thì xoá khỏi kho).
async function livePhotoUpload(key, ratio) {
  if (card.guest) return askLogin('photo');
  const f = await pickFile();
  if (!f) return;
  warmUpload();
  let small;
  try { small = await withLoading('Đang mở ảnh…', () => resizeImage(f)); } catch (e) { return toast(e.message, true); }
  const local = URL.createObjectURL(small);
  const up = uploadFile(small, { quiet: true, resized: true });
  up.catch(() => {}); // lỗi xử lý khi bấm Xong
  cropModal(key, ratio, {
    src: local,
    onCancel: () => { URL.revokeObjectURL(local); up.then(discardUpload, () => {}); },
    onOk: (x, y, z) => finishUpload(key, up, small, local, x, y, z),
  });
}
async function finishUpload(key, up, blob, local, x, y, z) {
  const shown = withFocus(local, x, y, z);
  localPhotos[key] = shown;
  showLocalPhoto($('#frame').contentWindow, key);
  status('Đang tải ảnh lên…');
  try {
    // tải trước đó hỏng (vd. mạng chập chờn lúc đang căn) → thử lại một lần
    const url = await up.catch(() => uploadFile(blob, { quiet: true, resized: true }));
    // tải trước ảnh thật để lúc thiệp vẽ lại không bị trống chỗ ảnh
    await new Promise((ok) => { const im = new Image(); im.onload = im.onerror = ok; im.src = url; setTimeout(ok, 8000); });
    if (localPhotos[key] !== shown) return; // đã chọn ảnh khác cho ô này trong lúc chờ
    photoSet(key, withFocus(url, x, y, z));
    applyLive();
  } catch (e) {
    if (localPhotos[key] !== shown) return;
    toast(e.message, true);
    status('Tải ảnh thất bại');
    refreshPreview(); // bỏ ảnh tạm, trả lại ảnh cũ
  } finally {
    if (localPhotos[key] === shown) delete localPhotos[key];
    setTimeout(() => URL.revokeObjectURL(local), 60000);
  }
}
function photoActions(key, ratio) {
  const u = photoGet(key);
  openModal(`<h2 style="margin-top:0">${key === 'cover' ? 'Ảnh bìa' : `Ảnh ${+key.split('.')[1] + 1}`}</h2>
    <div style="border-radius:12px;height:180px;background:#eee url('${esc(baseUrl(u))}') ${focusOf(u)[0]}% ${focusOf(u)[1]}%/cover;margin-bottom:14px"></div>
    <div style="display:grid;gap:8px">
      <button class="btn block" data-pa="replace">Đổi ảnh khác</button>
      <button class="btn block plain" data-pa="crop">Căn chỉnh phần ảnh hiện trong khung</button>
      <button class="btn block plain" data-pa="del" style="color:#c0392b">Xoá ảnh này</button>
    </div>`, (box, close) => {
    box.addEventListener('click', (e) => {
      const a = e.target.closest('[data-pa]'); if (!a) return;
      close();
      if (a.dataset.pa === 'replace') livePhotoUpload(key, ratio);
      else if (a.dataset.pa === 'crop') cropModal(key, ratio);
      else { photoSet(key, ''); applyLive(); toast('Đã xoá ảnh'); }
    });
  });
}
// kéo ảnh trong khung (đúng tỉ lệ ô của mẫu) để chọn phần hiện ra
// opt.src: ảnh mới (chưa tải lên) để căn trước; opt.onOk(x, y, z) thay cho việc lưu ngay; opt.onCancel khi đóng mà chưa bấm Xong
function cropModal(key, ratio = 1, opt = {}) {
  const fresh = !!opt.src;
  const u = opt.src || photoGet(key);
  if (!u) return;
  let done = false;
  let [x, y, z] = focusOf(u);
  const W = Math.min(300, window.innerWidth - 80), H = Math.round(Math.min(380, Math.max(170, W / (ratio || 1))));
  const FW = Math.round(H * (ratio || 1) > W ? W : H * (ratio || 1));
  openModal(`<h2 style="margin-top:0">Căn chỉnh ảnh</h2>
    <p class="muted" style="margin:-4px 0 12px">Kéo để chọn phần hiện ra, phóng to bằng thanh trượt${matchMedia('(pointer:coarse)').matches ? ' hoặc chụm hai ngón' : ' hoặc lăn chuột'}.</p>
    <div id="cropF" style="position:relative;margin:0 auto;width:${FW}px;height:${H}px;border-radius:12px;overflow:hidden;touch-action:none;cursor:grab;background:#eee url('${esc(baseUrl(u))}') ${x}% ${y}%/cover no-repeat;box-shadow:inset 0 0 0 2px var(--primary)"></div>
    <label style="display:flex;align-items:center;gap:10px;margin:16px auto 0;max-width:${Math.max(FW, 240)}px">
      <span aria-hidden="true" style="font-size:13px">−</span>
      <input type="range" id="cropZ" min="1" max="4" step="0.01" value="${z}" aria-label="Phóng to" style="flex:1;accent-color:var(--primary)">
      <span aria-hidden="true" style="font-size:18px">+</span>
      <b id="cropZv" style="min-width:42px;text-align:right;font-size:13px">${z.toFixed(1)}×</b>
    </label>
    <div style="display:flex;gap:8px;margin-top:16px"><button class="btn plain" data-c="reset" style="flex:1">Đặt lại</button><button class="btn" data-c="ok" style="flex:2">${fresh ? 'Xong, dùng ảnh này' : 'Xong'}</button></div>`, (box, close) => {
    const fr = $('#cropF', box), zr = $('#cropZ', box), zv = $('#cropZv', box);
    const img = new Image();
    let iw = 0, ih = 0;
    // ảnh hiện cỡ "cover × z", vị trí x% y% — đúng như trên thiệp (card.js)
    const paint = () => {
      fr.style.backgroundPosition = `${x}% ${y}%`;
      if (iw) { const s = Math.max(FW / iw, H / ih) * z; fr.style.backgroundSize = `${Math.ceil(iw * s)}px ${Math.ceil(ih * s)}px`; }
      zr.value = z; zv.textContent = `${z.toFixed(1)}×`;
    };
    img.onload = () => { iw = img.naturalWidth; ih = img.naturalHeight; paint(); };
    img.src = baseUrl(u);
    const extra = () => { const s = Math.max(FW / iw, H / ih) * z; return [iw * s - FW, ih * s - H]; }; // phần ảnh thừa ra ngoài khung
    const setZ = (nz) => { z = Math.min(4, Math.max(1, nz)); paint(); };
    zr.addEventListener('input', () => setZ(+zr.value));
    fr.addEventListener('wheel', (e) => { e.preventDefault(); setZ(z * (e.deltaY < 0 ? 1.08 : 1 / 1.08)); }, { passive: false });
    // kéo một ngón / chuột để dời; chụm hai ngón để phóng to
    const pts = new Map();
    let drag = null, pinch = null;
    const dist = () => { const [a, b] = [...pts.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
    fr.addEventListener('pointerdown', (e) => {
      try { fr.setPointerCapture(e.pointerId); } catch (_) { /* bỏ qua */ }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) { drag = null; pinch = { d: dist(), z }; } else { drag = { sx: e.clientX, sy: e.clientY, x, y }; fr.style.cursor = 'grabbing'; }
    });
    fr.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId) || !iw) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pts.size === 2) { setZ(pinch.z * (dist() / Math.max(1, pinch.d))); return; }
      if (!drag) return;
      const [ex, ey] = extra();
      if (ex > 1) x = Math.min(100, Math.max(0, drag.x - ((e.clientX - drag.sx) / ex) * 100));
      if (ey > 1) y = Math.min(100, Math.max(0, drag.y - ((e.clientY - drag.sy) / ey) * 100));
      paint();
    });
    const end = (e) => {
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
      if (pts.size === 1) { const p = [...pts.values()][0]; drag = { sx: p.x, sy: p.y, x, y }; } else { drag = null; fr.style.cursor = 'grab'; }
    };
    fr.addEventListener('pointerup', end); fr.addEventListener('pointercancel', end);
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-c]'); if (!b) return;
      if (b.dataset.c === 'reset') { x = 50; y = 50; z = 1; paint(); return; }
      done = true;
      close();
      if (opt.onOk) return opt.onOk(x, y, z);
      photoSet(key, withFocus(u, x, y, z));
      applyLive();
    });
  }, () => { if (!done && opt.onCancel) opt.onCancel(); });
}
const LONG_FIELDS = /^(message|story)$|\.address$/;
const FIELD_NAMES = { name: 'Tên gọi', fullName: 'Họ và tên đầy đủ', father: 'Tên bố', mother: 'Tên mẹ', address: 'Địa chỉ', place: 'Nơi tổ chức', inviteText: 'Lời mời', message: 'Lời nhắn', story: 'Chuyện tình yêu' };
function textModal(key) {
  const cur = getP(card.data, key) || '';
  const parts = key.split('.');
  const who = parts[0] === 'groom' ? 'Chú rể · ' : parts[0] === 'bride' ? 'Cô dâu · ' : parts[0] === 'events' ? `${(card.data.events[+parts[1]] || {}).name || 'Sự kiện'} · ` : '';
  const label = who + (FIELD_NAMES[parts[parts.length - 1]] || 'Nội dung');
  const long = LONG_FIELDS.test(key);
  openModal(`<h2 style="margin-top:0">Sửa chữ</h2>
    <label class="field"><span>${esc(label)}</span>${long ? `<textarea id="ceIn" rows="4">${esc(cur)}</textarea>` : `<input id="ceIn" value="${esc(cur)}">`}</label>
    <button class="btn block" id="ceOk">Lưu</button>`, (box, close) => {
    const inp = $('#ceIn', box);
    setTimeout(() => { inp.focus(); inp.select(); }, 30);
    const ok = () => { const v = inp.value.trim(); setP(card.data, key, v); livePatch(key, v); close(); applyLive(); };
    $('#ceOk', box).onclick = ok;
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !long) ok(); });
  });
}
// một lễ trong lịch trình: bấm tên / giờ / nơi / địa chỉ trên thiệp (hoặc dòng "+ Thêm lễ") → sửa đủ thông tin của lễ đó
function eventModal(i, focus) {
  const d = card.data, isNew = i >= d.events.length;
  if (isNew && d.events.length >= 6) return toast('Tối đa 6 lễ', true);
  const e = isNew ? { name: '', date: d.date, time: '', place: '', address: '', mapUrl: '', mapPin: '' } : d.events[i];
  const inp = (id, label, v, o = {}) => `<label class="field"><span>${label}</span><input id="${id}" type="${o.type || 'text'}" value="${esc(v || '')}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} ${o.max ? `maxlength="${o.max}"` : ''} ${o.attr || ''}></label>`;
  openModal(`<h2 style="margin-top:0">${isNew ? 'Thêm lễ' : esc(e.name || `Lễ ${i + 1}`)}</h2>
    ${inp('evName', 'Tên lễ', e.name, { ph: 'Lễ Vu Quy / Lễ Thành Hôn / Tiệc Cưới', max: 60 })}
    <div class="grid2">${inp('evDate', 'Ngày', e.date, { type: 'date' })}${inp('evTime', 'Giờ', e.time, { type: 'time' })}</div>
    ${inp('evPlace', 'Nơi tổ chức', e.place, { ph: 'Nhà hàng Hoa Sen — Sảnh A', max: 120 })}
    ${inp('evMap', '📍 Link Google Maps (để bản đồ chỉ đúng chỗ)', e.mapUrl, { ph: 'Dán link hoặc toạ độ vào đây', attr: 'autocomplete="off"' })}
    <p class="muted" id="evMapSt" style="font-size:13px;margin:-6px 0 12px">Mở Google Maps → tìm nhà hàng → <b>Chia sẻ</b> → <b>Sao chép đường liên kết</b> → dán vào ô trên. Hoặc giữ ngón tay lên đúng điểm trên bản đồ, chép dãy toạ độ (vd. <i>21.0285, 105.8542</i>) rồi dán vào.</p>
    ${inp('evAddr', 'Địa chỉ (không bắt buộc)', e.address, { ph: 'Số nhà, đường, phường, tỉnh/thành', max: 200 })}
    <div style="display:flex;gap:8px;margin-top:6px">${isNew ? '' : '<button class="btn plain" id="evDel" style="color:#c0392b">Xoá lễ</button>'}<button class="btn" id="evOk" style="flex:1">${isNew ? 'Thêm vào lịch trình' : 'Lưu'}</button></div>`, (box, close) => {
    const mapIn = $('#evMap', box), st = $('#evMapSt', box);
    let pin = e.mapUrl ? e.mapPin || '' : '', readUrl = e.mapUrl || '', reading = null;
    setTimeout(() => { if (focus === 'map') mapIn.focus(); else if (isNew) $('#evName', box).focus(); }, 30);
    // dán link → hỏi máy chủ đọc ra toạ độ + tên địa điểm (link rút gọn cần mở qua máy chủ)
    const readLink = () => {
      // dán toạ độ "21.0285, 105.8542" (giữ ngón tay lên điểm trên Google Maps để chép) → ghim luôn, không cần đọc link
      const co = /^\s*(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})\s*$/.exec(mapIn.value);
      if (co) {
        const url = `https://www.google.com/maps?q=${+co[1]},${+co[2]}`;
        mapIn.value = url; readUrl = url; pin = `${+co[1]},${+co[2]}`;
        st.innerHTML = '✓ Đã ghim vị trí theo toạ độ';
        return (reading = null);
      }
      const url = (mapIn.value.match(/https:\/\/\S+/) || [''])[0]; // dán cả đoạn "Tên quán https://maps.app.goo.gl/…" cũng được
      if (url && url !== mapIn.value.trim()) mapIn.value = url;
      if (url === readUrl) return reading;
      readUrl = url; pin = '';
      if (!url) { st.textContent = 'Không có link: bản đồ sẽ tìm theo địa chỉ bên dưới.'; return (reading = null); }
      st.textContent = 'Đang đọc link…';
      return (reading = api(`/api/maplink?url=${encodeURIComponent(url)}`, { quiet: true }).then((r) => {
        if (url !== readUrl) return;
        pin = r.pin || '';
        const pl = $('#evPlace', box);
        if (r.name && !pl.value.trim()) pl.value = r.name;
        st.innerHTML = pin ? `✓ Đã ghim vị trí${r.name ? `: <b>${esc(r.name)}</b>` : ''}` : 'Chưa đọc được vị trí từ link này. Link vẫn dùng cho nút "Chỉ đường", bản đồ sẽ tìm theo địa chỉ bên dưới.';
      }).catch((err) => { if (url === readUrl) st.textContent = err.message || 'Không đọc được link này'; }));
    };
    mapIn.addEventListener('paste', () => setTimeout(readLink, 0));
    mapIn.addEventListener('change', readLink);
    if (e.mapUrl && pin) st.textContent = '✓ Đã ghim vị trí theo link Google Maps.';
    $('#evOk', box).onclick = async () => {
      const v = (id) => $(id, box).value.trim();
      if (!v('#evName')) return toast('Nhập tên lễ nhé', true);
      const b = $('#evOk', box); b.disabled = true;
      await readLink();
      b.disabled = false;
      Object.assign(e, { name: v('#evName'), date: v('#evDate'), time: v('#evTime'), place: v('#evPlace'), address: v('#evAddr'), mapUrl: v('#evMap'), mapPin: v('#evMap') ? pin : '' });
      if (isNew) d.events.push(e);
      // lịch trình xếp theo ngày giờ (lễ chưa có giờ đứng sau cùng trong ngày)
      d.events.sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || (a.time || '99').localeCompare(b.time || '99'));
      close(); applyLive();
    };
    const del = $('#evDel', box);
    if (del) del.onclick = () => { if (!confirm(`Xoá "${e.name || 'lễ này'}" khỏi lịch trình?`)) return; d.events.splice(i, 1); close(); applyLive(); };
  });
}
window.addEventListener('message', (e) => {
  if (e.origin !== location.origin || !e.data || !e.data.ce) return;
  const m = e.data;
  if (m.type === 'ready') {
    Object.keys(localPhotos).forEach((k) => showLocalPhoto(e.source, k)); // thiệp vẽ lại khi ảnh còn đang tải → giữ ảnh tạm
    const nf = $('#frameNext'); if (nf && e.source === nf.contentWindow && nf._ready) nf._ready();
    return;
  }
  if (m.type === 'photo') { if (m.empty || !photoGet(m.key)) livePhotoUpload(m.key, m.ratio); else photoActions(m.key, m.ratio); return; }
  if (m.type !== 'text') return;
  if (/^events\.\d+\./.test(m.key)) eventModal(+m.key.split('.')[1], m.map ? 'map' : '');
  else if (m.key === 'time') showTab('date');
  else if (m.key.startsWith('gifts.')) showTab('gift');
  else textModal(m.key);
});

(async () => {
  try {
    const [meta, r] = await Promise.all([fetch('/api/meta').then((x) => x.json()), api(`/api/cards/${CARD_ID}`)]);
    META = meta;
    card = r.card;
    document.title = 'Sửa thiệp — ' + meta.brand;
  } catch (e) {
    if (e.status === 404) $('#ttl').textContent = 'Không tìm thấy thiệp';
    return;
  }
  bind();
  if (card.guest) $('.ebar .back').href = '/mau-thiep'; // chưa có "Thiệp của tôi" để quay về
  renderHeader();
  // ?tab=… (link cũ: info/events/look/resp…) mở thẳng bảng tương ứng; mặc định chỉ hiện thiệp
  const OLD = { events: 'date', look: 'tpl', resp: 'guests', info: null };
  const want = new URLSearchParams(location.search).get('tab');
  showTab(want in OLD ? OLD[want] : want);
  refreshPreview();
  status('Đã lưu ✓');
  // thiệp mới chưa có tên đôi: mở bảng điền nhanh (mỗi thiệp một lần trong phiên này)
  try {
    if (!card.data.groom.name && !card.data.bride.name && !sessionStorage.getItem('qs:' + CARD_ID)) { sessionStorage.setItem('qs:' + CARD_ID, '1'); setTimeout(() => quickStart(false), 500); }
  } catch (e) { /* bỏ qua */ }
  // lễ có link Google Maps nhưng chưa đọc được vị trí (link dán từ trước) → đọc lại một lần
  const todo = (card.data.events || []).filter((e) => e.mapUrl && !e.mapPin);
  if (todo.length) {
    const rs = await Promise.all(todo.map((e) => api(`/api/maplink?url=${encodeURIComponent(e.mapUrl)}`, { quiet: true }).catch(() => null)));
    let changed = false;
    todo.forEach((e, k) => { if (rs[k] && rs[k].pin) { e.mapPin = rs[k].pin; changed = true; } });
    if (changed) save();
  }
})();
