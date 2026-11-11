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

const panes = {
  info: () => `
    ${person('groom', 'Chú rể')}
    ${person('bride', 'Cô dâu')}
    <section class="group panel"><h3>Ngày cưới <small>dùng cho trang bìa và đếm ngược</small></h3>
      <div class="grid2">${f('date', 'Ngày (dương lịch)', { type: 'date', hint: 'Ngày âm lịch được tự tính và hiện trên thiệp' })}${f('time', 'Giờ', { type: 'time' })}</div>
    </section>
    <section class="group panel"><h3>Lời mời</h3>
      ${f('inviteText', 'Câu mời', { ph: 'Trân trọng kính mời', max: 80 })}
      ${f('message', 'Lời nhắn dưới phần mời', { type: 'textarea', max: 400 })}
    </section>
    <section class="group panel"><h3>Chuyện tình yêu <small>không bắt buộc</small></h3>
      ${f('story', 'Kể ngắn về hai bạn', { type: 'textarea', rows: 5, max: 2000, ph: 'Chúng mình gặp nhau năm…' })}
    </section>`,

  events: () => `
    <section class="group panel"><h3>Lịch trình ngày cưới</h3>
      <p class="muted" style="margin:-6px 0 14px;font-size:14px">Mỗi sự kiện có bản đồ, nút chỉ đường và nút lưu vào lịch cho khách.</p>
      <div id="evs">${card.data.events.map((e, i) => `
        <div class="ev">
          <div class="ev-h"><b>Sự kiện ${i + 1}</b>
            <span>${i ? `<button class="btn sm plain" data-ev-up="${i}" title="Lên trên">↑</button>` : ''}
            <button class="btn sm danger" data-ev-del="${i}">Xoá</button></span></div>
          ${f(`events.${i}.name`, 'Tên sự kiện', { ph: 'Lễ Vu Quy / Lễ Thành Hôn / Tiệc Cưới', max: 60 })}
          <div class="grid2">${f(`events.${i}.date`, 'Ngày', { type: 'date' })}${f(`events.${i}.time`, 'Giờ', { type: 'time' })}</div>
          ${f(`events.${i}.place`, 'Địa điểm', { ph: 'Nhà hàng Hoa Sen — Sảnh A', max: 120 })}
          ${f(`events.${i}.address`, 'Địa chỉ (dùng để hiện bản đồ)', { ph: 'Số nhà, đường, phường, tỉnh/thành', max: 200 })}
          ${f(`events.${i}.mapUrl`, 'Link Google Maps (không bắt buộc)', { ph: 'https://maps.app.goo.gl/…', hint: 'Dán link nếu bản đồ theo địa chỉ chưa đúng chỗ' })}
        </div>`).join('') || '<p class="muted">Chưa có sự kiện nào.</p>'}</div>
      ${card.data.events.length < 6 ? '<button class="btn soft" id="evAdd">+ Thêm sự kiện</button>' : ''}
    </section>`,

  media: () => {
    const d = card.data;
    return `
    <section class="group panel"><h3>Ảnh bìa</h3>
      <div class="cover-box">
        ${d.cover ? `<div class="photo" style="background-image:url('${esc(d.cover)}')"><button data-cover-del title="Xoá">×</button></div>` : '<label class="drop" style="width:110px">+ Chọn ảnh<input type="file" accept="image/*" id="coverIn" hidden></label>'}
        <p class="muted" style="font-size:14px;margin:0">Ảnh này hiện ở trang bìa và khi gửi link qua Zalo/Messenger. Nên dùng ảnh dọc, rõ mặt.${d.cover ? '<br><label class="btn sm soft" style="margin-top:8px">Đổi ảnh<input type="file" accept="image/*" id="coverIn" hidden></label>' : ''}</p>
      </div>
    </section>
    <section class="group panel"><h3>Album ảnh <small>${d.photos.length}/24 ảnh</small></h3>
      <div class="photos">
        ${d.photos.map((u, i) => `<div class="photo" style="background-image:url('${esc(u)}')">${i ? `<button class="mv" data-ph-up="${i}" title="Lên trước">←</button>` : ''}<button data-ph-del="${i}" title="Xoá">×</button></div>`).join('')}
        ${d.photos.length < 24 ? '<label class="drop">+ Thêm ảnh<br>(chọn nhiều)<input type="file" accept="image/*" multiple id="photosIn" hidden></label>' : ''}
      </div>
      <p class="muted" style="font-size:13px;margin:10px 0 0">Ảnh được tự thu nhỏ để thiệp mở nhanh trên điện thoại.</p>
    </section>
    <section class="group panel"><h3>Nhạc nền</h3>
      ${d.music ? `<audio controls src="${esc(d.music)}" style="width:100%;margin-bottom:10px"></audio><button class="btn sm danger" data-music-del>Bỏ nhạc</button>` : `
        <label class="btn soft">Tải lên file MP3<input type="file" accept="audio/mpeg" id="musicIn" hidden></label>
        <p class="muted" style="font-size:13px;margin:10px 0 0">Tối đa 12MB. Chỉ dùng bản nhạc bạn có quyền sử dụng. Nhạc phát khi khách chạm "Mở thiệp".</p>`}
    </section>`;
  },

  gift: () => {
    const bankSel = (k) => `<label class="field"><span>Ngân hàng</span><select data-k="${k}.bin"><option value="">— Chọn ngân hàng —</option>${META.banks.map((b) => `<option value="${b.bin}" ${getP(card.data, k + '.bin') === b.bin ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></label>`;
    const tg = (k, l) => `<label class="check"><input type="checkbox" data-k="show.${k}" ${card.data.show[k] ? 'checked' : ''}>${l}</label>`;
    return `
    <section class="group panel"><h3>Tài khoản mừng cưới <small>khách quét QR để chuyển</small></h3>
      <p class="muted" style="margin:-6px 0 14px;font-size:14px">Tiền chuyển thẳng vào tài khoản của bạn, không qua hệ thống. Để trống nếu không muốn hiện.</p>
      <h4 style="margin:0 0 8px">Chú rể</h4>
      <div class="grid2">${bankSel('gifts.groom')}${f('gifts.groom.acc', 'Số tài khoản', { max: 30 })}</div>
      ${f('gifts.groom.holder', 'Tên chủ tài khoản', { ph: 'NGUYEN DUC MINH', max: 60 })}
      <h4 style="margin:8px 0 8px">Cô dâu</h4>
      <div class="grid2">${bankSel('gifts.bride')}${f('gifts.bride.acc', 'Số tài khoản', { max: 30 })}</div>
      ${f('gifts.bride.holder', 'Tên chủ tài khoản', { ph: 'LE THU HA', max: 60 })}
    </section>
    <section class="group panel"><h3>Hiện/ẩn các phần trên thiệp</h3>
      <div class="toggles">${tg('calendar', 'Lịch tháng')}${tg('countdown', 'Đếm ngược')}${tg('gallery', 'Album ảnh')}${tg('rsvp', 'Xác nhận tham dự')}${tg('gift', 'Hộp mừng cưới')}${tg('wishes', 'Sổ lưu bút')}</div>
    </section>`;
  },

  look: () => {
    const tpl = META.templates.find((t) => t.id === card.template) || META.templates[0];
    return `
    <section class="group panel"><h3>Mẫu thiệp</h3>
      ${tplPicker(tpl)}
      <h3 style="margin:18px 0 10px">Bảng màu</h3>
      <div class="pals">${tpl.palettes.map((p) => `<button data-pal="${p.id}" class="${p.id === card.palette ? 'on' : ''}"><i style="background:linear-gradient(135deg,${p.swatch[0]} 50%,${p.swatch[1]} 50%)"></i>${esc(p.name)}</button>`).join('')}</div>
    </section>
    <section class="group panel"><h3>Tên & đường dẫn</h3>
      <label class="field"><span>Tên thiệp (chỉ bạn thấy)</span><input id="titleIn" value="${esc(card.title)}" maxlength="60"></label>
      <label class="field"><span>Đường dẫn thiệp</span>
        <div style="display:flex;gap:8px"><div class="slug" style="flex:1"><span>${esc(META.baseUrl.replace(/^https?:\/\//, ''))}/t/</span><input id="slugIn" value="${esc(card.slug)}" maxlength="40"></div><button class="btn plain" id="slugSave">Lưu</button></div>
        <small>Chỉ dùng chữ không dấu, số và dấu gạch ngang. Ví dụ: minh-ha-2026</small></label>
    </section>
    ${card.status === 'published' ? `<section class="group panel"><h3>Tạm ẩn thiệp</h3><p class="muted" style="margin:-6px 0 12px;font-size:14px">Khách mời sẽ không mở được thiệp cho tới khi bạn phát hành lại.</p><button class="btn danger" id="unpub">Chuyển về bản nháp</button></section>` : ''}`;
  },

  guests: () => `<div id="gBox"><div class="skeleton" style="height:200px"></div></div>`,
  resp: () => `<div id="rBox"><div class="skeleton" style="height:200px"></div></div>`,
};

let curTab = 'info';
function showTab(t) {
  curTab = t;
  $$('.tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === t));
  $('#panes').innerHTML = `<div class="pane">${panes[t]()}</div>`;
  $('.side').scrollTop = 0;
  if (t === 'guests') loadGuests();
  if (t === 'resp') loadResponses();
}
function rerender() {
  const y = $('.side').scrollTop;
  $('#panes').innerHTML = `<div class="pane">${panes[curTab]()}</div>`;
  $('.side').scrollTop = y;
}

// ---------- lưu ----------
function status(t) { $('#saved').textContent = t; }
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
    status('Đã lưu ✓');
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
function refreshPreview() {
  const fr = $('#frame');
  const src = `/t/${card.slug}?preview=1`;
  if (!fr.src.endsWith(src)) fr.src = src;
  else fr.contentWindow.location.reload();
}

// ---------- tiêu đề + phát hành ----------
function renderHeader() {
  $('#ttl').textContent = [card.data.groom.name, card.data.bride.name].filter(Boolean).join(' & ') || card.title;
  const pa = $('#pubArea');
  if (card.status !== 'published') {
    pa.innerHTML = '<button class="btn sm" id="pubBtn">Phát hành thiệp</button>';
  } else {
    pa.innerHTML = `<button class="btn sm soft" id="shareBtn">Chia sẻ</button>${card.paid ? '' : ' <button class="btn sm" id="payBtn">Kích hoạt</button>'}`;
  }
  const pb = $('#pubBtn'); if (pb) pb.onclick = publish;
  const sb = $('#shareBtn'); if (sb) sb.onclick = shareModal;
  const yb = $('#payBtn'); if (yb) yb.onclick = () => openPayModal(CARD_ID, reloadCard);
}
async function publish() {
  clearTimeout(saveTimer);
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
async function uploadMany(files, onUrl) {
  const urls = await uploadFiles(files, {
    onProgress: (d, n) => status(n > 1 ? `Đang tải ảnh lên ${d}/${n}…` : 'Đang tải ảnh lên…'),
    onError: (e) => toast(e.message, true),
  });
  urls.filter(Boolean).forEach(onUrl);
  rerender();
  save();
}

function bind() {
  const panesEl = $('#panes');
  panesEl.addEventListener('input', (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    setP(card.data, k, e.target.type === 'checkbox' ? e.target.checked : e.target.value);
    scheduleSave(e.target.type === 'checkbox' || e.target.tagName === 'SELECT' ? 50 : 700);
    if (k.endsWith('.name') && (k.startsWith('groom') || k.startsWith('bride'))) renderHeader();
  });
  panesEl.addEventListener('change', async (e) => {
    const t = e.target;
    if (t.id === 'titleIn') { card.title = t.value; scheduleSave(50); }
    if (t.id === 'coverIn' && t.files[0]) uploadMany([t.files[0]], (u) => (card.data.cover = u));
    if (t.id === 'photosIn' && t.files.length) {
      const room = 24 - card.data.photos.length;
      uploadMany(Array.from(t.files).slice(0, room), (u) => card.data.photos.push(u));
    }
    if (t.id === 'musicIn' && t.files[0]) {
      status('Đang tải nhạc lên…');
      try { card.data.music = await uploadFile(t.files[0]); rerender(); save(); }
      catch (err) { toast(err.message, true); status(''); }
    }
  });
  panesEl.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const d = card.data;
    const ds = b.dataset;
    let changed = true;
    if (b.id === 'evAdd') d.events.push({ name: '', date: d.date, time: '', place: '', address: '', mapUrl: '' });
    else if (ds.evDel !== undefined) { if (!confirm('Xoá sự kiện này?')) return; d.events.splice(+ds.evDel, 1); }
    else if (ds.evUp !== undefined) { const i = +ds.evUp; [d.events[i - 1], d.events[i]] = [d.events[i], d.events[i - 1]]; }
    else if (ds.phDel !== undefined) d.photos.splice(+ds.phDel, 1);
    else if (ds.phUp !== undefined) { const i = +ds.phUp; [d.photos[i - 1], d.photos[i]] = [d.photos[i], d.photos[i - 1]]; }
    else if (ds.coverDel !== undefined) d.cover = '';
    else if (ds.musicDel !== undefined) d.music = '';
    else if (ds.tg !== undefined) { tplGroup = ds.tg; rerender(); return; }
    else if (ds.tpl) { if (card.template !== ds.tpl) { card.template = ds.tpl; card.palette = ''; } }
    else if (ds.pal) card.palette = ds.pal;
    else if (b.id === 'slugSave') {
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
  $('#tabs').addEventListener('click', (e) => { const t = e.target.closest('.tab'); if (t) showTab(t.dataset.tab); });
  $('#pvBtn').onclick = () => $('#prev').classList.add('show');
  $('#pvClose').onclick = () => $('#prev').classList.remove('show');
  window.addEventListener('beforeunload', (e) => { if (saveTimer && $('#saved').textContent.startsWith('Đang')) { e.preventDefault(); e.returnValue = ''; } });
}

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
  $('#ledLink').href = '/sua-led/' + CARD_ID;
  if (!(card.led && card.led.created)) $('#ledLink').style.display = 'none'; // màn LED không còn bán riêng, chỉ giữ cho thiệp đã tạo (thuộc tính hidden bị .btn ghi đè)
  $('#videoLink').href = '/sua-video/' + CARD_ID;
  bind();
  renderHeader();
  showTab(new URLSearchParams(location.search).get('tab') || 'info');
  refreshPreview();
  status('Đã lưu ✓');
})();
