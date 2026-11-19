// Trình sửa thiệp: form bên trái, xem trước trực tiếp bên phải, tự lưu.
const CARD_ID = location.pathname.split('/').pop();
let card, META;
let saveTimer = null, saving = false, pending = false;

const getP = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const setP = (o, p, v) => { const ks = p.split('.'); let a = o; ks.slice(0, -1).forEach((k) => (a = a[k])); a[ks[ks.length - 1]] = v; };

// ---------- dựng ô nhập ----------
// đã qua ngày cưới: tên gọi cô dâu chú rể + ngày cưới cố định (máy chủ cũng giữ nguyên — lib/wedding.js)
const FROZEN = /^(groom\.name|bride\.name|date)$/;
const frozenKey = (k) => !!(card && card.namesFrozen && FROZEN.test(k));
function f(k, label, o = {}) {
  const v = getP(card.data, k) ?? '';
  if (frozenKey(k)) o = { ...o, hint: card.paid ? '🔒 Thiệp đã kích hoạt nên đã chốt, không đổi được' : '🔒 Đã qua ngày cưới nên cố định, không sửa được' };
  const attrs = `data-k="${k}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} ${o.max ? `maxlength="${o.max}"` : ''}${frozenKey(k) ? ' disabled' : ''}`;
  const input = o.type === 'textarea'
    ? `<textarea ${attrs} rows="${o.rows || 3}">${esc(v)}</textarea>`
    : `<input type="${o.type || 'text'}" ${attrs} value="${esc(v)}">`;
  return `<label class="field"><span>${label}</span>${input}${o.hint ? `<small>${o.hint}</small>` : ''}</label>`;
}
function person(who, label) {
  return `<section class="group panel"><h3>${label}</h3>
    <div class="grid2">
      ${f(`${who}.name`, 'Tên gọi trên thiệp', { ph: who === 'groom' ? 'Gia Huy' : 'Bảo Ngọc', max: 40 })}
      ${f(`${who}.fullName`, 'Họ và tên đầy đủ', { ph: who === 'groom' ? 'Trần Gia Huy' : 'Lê Bảo Ngọc', max: 80 })}
      ${f(`${who}.father`, 'Bố', { ph: 'Ông Trần Quang Hải', max: 80 })}
      ${f(`${who}.mother`, 'Mẹ', { ph: 'Bà Nguyễn Thị Lan', max: 80 })}
    </div>
    ${f(`${who}.address`, 'Địa chỉ nhà ' + (who === 'groom' ? 'trai' : 'gái'), { ph: 'Phường…, Tỉnh/Thành phố…', max: 160 })}
  </section>`;
}

// ---------- các tab ----------
// Chọn mẫu: lọc theo nhóm (chip) + lưới ảnh bìa nhỏ; ảnh của mẫu đang dùng hiện theo bảng màu đang chọn
let tplGroup = null;
// bảng "Các lễ": lễ nào đang mở (giữ nguyên khi vẽ lại bảng), dòng tóm tắt khi gập
const evOpen = new Set();
const evSum = (e, i) => {
  const dm = e.date ? `${e.date.slice(8, 10)}/${e.date.slice(5, 7)}` : '';
  const sub = [e.time, dm, e.place].filter(Boolean).join(' · ') || 'Chưa có ngày giờ';
  return `<span class="ev-s"><b>${esc(e.name || `Lễ ${i + 1}`)}</b><small>${esc(sub)}</small></span>`;
};
const tplCover = (t) => `/demo/cover-${t.id}-${(t.id === card.template && card.palette) || (t.palettes[0] && t.palettes[0].id)}.jpg`;
function tplPicker(cur) {
  const groups = (META.templateGroups || []).filter((g) => META.templates.some((t) => t.group === g.id));
  if (tplGroup === null) tplGroup = cur.group || '';
  const list = META.templates.filter((t) => !tplGroup || t.group === tplGroup);
  const chip = (id, name) => `<button data-tg="${id}" class="${tplGroup === id ? 'on' : ''}">${esc(name)}</button>`;
  // thiệp đã kích hoạt: mẫu đã chốt — chỉ hiện mẫu đang dùng (màu của mẫu vẫn đổi được)
  if (card.paid) return `<p class="muted tplnow">🔒 Thiệp đã kích hoạt nên mẫu đã chốt: <b>${esc(cur.name)}</b>. Màu của mẫu vẫn đổi được.</p>
      <div class="tplpick"><button data-tpl="${cur.id}" class="on" aria-pressed="true"><img src="${tplCover(cur)}" alt="" loading="lazy"><span>${esc(cur.name)}</span></button></div>`;
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
  media: 'Nhạc nền',
  gift: 'Mừng cưới',
  guests: 'Khách mời & phản hồi',
  more: 'Thêm',
  secs: 'Các mục của thiệp',
  studio: 'Nội dung thiệp',
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
      <div class="grid2">${f('groom.name', 'Tên chú rể', { ph: 'Gia Huy', max: 40 })}${f('bride.name', 'Tên cô dâu', { ph: 'Bảo Ngọc', max: 40 })}</div>
      <button class="btn soft block" id="famOpen" type="button">+ Họ tên đầy đủ, bố mẹ, địa chỉ hai nhà</button>
      <div id="fam" hidden>${person('groom', 'Nhà trai')}${person('bride', 'Nhà gái')}</div>
    </section>
    <section class="group panel"><h3>Ngày cưới <small>dùng cho trang bìa và đếm ngược</small></h3>
      <div class="grid2">${f('date', 'Ngày (dương lịch)', { type: 'date', hint: 'Ngày âm lịch tự tính và hiện trên thiệp' })}${f('time', 'Giờ', { type: 'time' })}</div>
    </section>
    <section class="group panel"><h3>Các lễ trong ngày cưới</h3>
      <p class="muted" style="margin:-6px 0 14px;font-size:14px">Bấm vào một lễ để sửa ngày giờ, nơi tổ chức, bản đồ. Tên lễ, nơi tổ chức sửa được ngay trên thiệp.</p>
      <div id="evs">${card.data.events.map((e, i) => `
        <details class="ev" data-ev="${i}"${evOpen.has(i) ? ' open' : ''}>
          <summary class="ev-h">${evSum(e, i)}
            <span class="ev-act">${i ? `<button class="btn sm plain" data-ev-up="${i}" title="Lên trên" type="button">↑</button>` : ''}
            <button class="btn sm danger" data-ev-del="${i}" type="button">Xoá</button></span></summary>
          <div class="ev-b">
          ${f(`events.${i}.name`, 'Tên lễ', { ph: 'Lễ Vu Quy / Lễ Thành Hôn / Tiệc Cưới', max: 60 })}
          <div class="grid2">${f(`events.${i}.date`, 'Ngày', { type: 'date' })}${f(`events.${i}.time`, 'Giờ', { type: 'time' })}</div>
          ${f(`events.${i}.place`, 'Nơi tổ chức', { ph: 'Nhà hàng Ngọc Lan — Sảnh A', max: 120 })}
          ${f(`events.${i}.address`, 'Địa chỉ (hiện bản đồ)', { ph: 'Số nhà, đường, phường, tỉnh/thành', max: 200 })}
          ${f(`events.${i}.mapUrl`, '📍 Link Google Maps', { ph: 'Dán link vào đây', hint: 'Google Maps → tìm nhà hàng → Chia sẻ → Sao chép đường liên kết. Bản đồ trên thiệp sẽ ghim đúng chỗ.' })}
          </div>
        </details>`).join('') || '<p class="muted">Chưa có lễ nào.</p>'}</div>
      ${card.data.events.length < 6 ? '<button class="btn soft block" id="evAdd">+ Thêm lễ</button>' : ''}
    </section>`,

  media: () => {
    const d = card.data;
    // ảnh khách chưa đăng nhập chọn: chỉ nằm trên máy (localPhotos), chưa có trong thiệp
    const tam = (i) => !d.photos[i] && !pendingSlots.has('photos.' + i) && localPhotos['photos.' + i];
    const nTam = Array.from({ length: 24 }, (_, i) => tam(i)).filter(Boolean).length;
    const len = Math.max(d.photos.length, ...[...pendingSlots, ...Object.keys(localPhotos)].filter((k) => k !== 'cover').map((k) => +k.split('.')[1] + 1));
    return `
    <!-- bảng này chỉ còn nhạc nền: ảnh sửa thẳng trên thiệp (bấm ảnh → Căn chỉnh / Thay ảnh) -->
    <section class="group panel"><h3>Nhạc nền ${musicNow().auto ? '<small>tự chọn theo mẫu</small>' : ''}</h3>
      ${musicPane()}
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

  secs: () => secsPane(),
  studio: () => studioPane(),
  more: () => {
    const tg = (k, l) => `<label class="check"><input type="checkbox" data-k="show.${k}" ${card.data.show[k] ? 'checked' : ''}>${l}</label>`;
    return `
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
      <a class="btn block plain" href="/sua-video/${CARD_ID}">🎬 Slide / màn hình dạm ngõ</a>
      ${card.led && card.led.created ? `<a class="btn block plain" href="/sua-led/${CARD_ID}">✨ Màn hình LED</a>` : ''}
    </section>
    ${card.status === 'published' ? `<section class="group panel"><h3>Tạm ẩn thiệp</h3><p class="muted" style="margin:-6px 0 12px;font-size:14px">Khách mời sẽ không mở được thiệp cho tới khi bạn phát hành lại.</p><button class="btn danger" id="unpub">Chuyển về bản nháp</button></section>` : ''}`;
  },
};


// =================== Máy tính: bố cục "studio" ===================
// Thiệp đứng yên bên trái; bên phải là danh sách mục gập / mở (mỗi lúc mở một mục), có ✓ / ! / ○ và nút bật tắt.
// Mở mục → thiệp tự cuộn tới phần đó; bấm chữ / album / khối trên thiệp → mở đúng mục + sáng ô cần sửa.
// Điện thoại vẫn dùng thanh công cụ dưới + popup như cũ.
const studio = () => wide();
let stOpen = null; // mục đang mở
let albRatio = 0.75; // tỉ lệ ô ảnh album của mẫu đang dùng (thiệp báo lên khi bấm album)
let stQuiet = false; // đang đặt con trỏ vào ô vì người dùng vừa bấm trên thiệp
let stSent = null;
let stWant = null; // mục vừa bật: khối chỉ có trên thiệp sau khi vẽ lại → cuộn tới khi thiệp mới sẵn sàng // mục vừa báo thiệp cuộn tới (vẽ lại bảng không cuộn lại)
const FX_LIST = [['', 'Không'], ['sakura', '🌸 Hoa anh đào'], ['mai', '🌼 Hoa mai'], ['snow', '❄️ Tuyết'], ['leaves', '🍂 Lá thu'], ['hearts', '💗 Trái tim']];
// mục nào ở phần nào trên thiệp (edit.js goSel thử lần lượt: bộ chọn → khoá chữ → tên phần)
const ST_SEL = {
  look: { top: 1 }, info: { keys: ['groom.father', 'groom.fullName', 'bride.father', 'groom.name'] },
  date: { css: ['.ce-ev'], keys: ['events.'], kind: ['Lịch trình', 'Lời mời & lễ cưới'] },
  invite: { keys: ['inviteText', 'message'], kind: ['Lời mời & lễ cưới'] },
  album: { css: ['[data-ce-album]'], kind: ['Album ảnh'] }, story: { keys: ['story'], kind: ['Chuyện tình yêu'] },
  calendar: { kind: ['Lịch tháng', 'Đếm ngược'] }, dress: { css: ['.s-dress'] }, qa: { css: ['.s-qa'] }, contact: { css: ['.s-contact'] },
  gift: { keys: ['gifts.'], kind: ['Mừng cưới'] }, rsvp: { kind: ['Xác nhận tham dự', 'Sổ lưu bút'] },
};
const ST_TAB = { tpl: 'look', date: 'info', media: 'music', gift: 'gift', guests: 'guests', more: 'link', secs: null };
const SHOW_SEC = { gallery: 'album', dress: 'dress', qa: 'qa', gift: 'gift', contact: 'contact' };
function postFrame(m) { try { $('#frame').contentWindow.postMessage(m, location.origin); } catch (e) { /* bỏ qua */ } }
const chk = (k, l) => `<label class="check" style="margin-bottom:10px"><input type="checkbox" data-k="${k}" ${getP(card.data, k) ? 'checked' : ''}> ${l}</label>`;
function stSecs() {
  const d = card.data, it = Object.fromEntries(secItems().map((x) => [x.k, x]));
  const tpl = META.templates.find((t) => t.id === card.template) || META.templates[0];
  const pal = tpl.palettes.find((p) => p.id === card.palette) || tpl.palettes[0] || {};
  const fx = FX_LIST.find((x) => x[0] === (d.fx || ''));
  const nPh = d.photos.filter(Boolean).length + (card.guest ? Object.keys(localPhotos).filter((k) => /^photos\./.test(k) && !d.photos[+k.split('.')[1]]).length : 0);
  const dm = d.date ? d.date.split('-').reverse().join('/') : '';
  return [
    { k: 'look', n: 'Giao diện', sub: `${tpl.name}${pal.name ? ' · ' + pal.name : ''}${d.fx ? ' · ' + fx[1].replace(/^\S+\s/, '') : ''}`, st: 'ok', body: stLook },
    { k: 'info', n: 'Cô dâu & chú rể', sub: d.groom.name && d.bride.name ? `${d.groom.name} & ${d.bride.name}` : 'chưa có tên', miss: 'chưa có tên cô dâu / chú rể', st: d.groom.name && d.bride.name ? 'ok' : 'miss', body: stInfo },
    { k: 'date', n: 'Ngày cưới & các lễ', sub: `${dm || 'chưa có ngày'} · ${d.events.length} lễ`, st: d.date && secState(it.invite) === 'ok' ? 'ok' : 'miss', miss: d.date ? it.invite.miss : 'chưa có ngày cưới', body: stDate },
    { k: 'invite', n: 'Lời mời & lời nhắn', sub: d.inviteText || '', st: 'ok', body: () => `${f('inviteText', 'Lời mời', { ph: 'Trân trọng kính mời', max: 80 })}${f('message', 'Lời nhắn', { type: 'textarea', rows: 3, max: 400 })}` },
    { k: 'album', n: 'Album ảnh', show: 'gallery', sub: `${nPh} ảnh`, st: secState(it.gallery), miss: it.gallery.miss, body: () => '<div class="st-alb" id="stAlb"></div>' },
    { k: 'story', n: 'Chuyện tình yêu', sub: d.story ? 'đã viết' : 'trống thì tự ẩn', st: d.story ? 'ok' : 'off', body: () => f('story', 'Chuyện của hai bạn', { type: 'textarea', rows: 7, ph: 'Hai bạn gặp nhau thế nào, kỷ niệm đáng nhớ…' }) },
    { k: 'calendar', n: 'Lịch tháng & đếm ngược', sub: [d.show.calendar && 'lịch', d.show.countdown && 'đếm ngược'].filter(Boolean).join(' · ') || 'đang ẩn', st: d.show.calendar || d.show.countdown ? (d.date ? 'ok' : 'miss') : 'off', miss: 'chưa có ngày cưới',
      body: () => `${chk('show.calendar', 'Hiện lịch tháng (khoanh ngày cưới)')}${chk('show.countdown', 'Hiện đếm ngược tới ngày cưới')}<p class="muted" style="font-size:13px;margin:4px 0 0">Theo ngày cưới ở mục "Ngày cưới & các lễ".</p>` },
    { k: 'dress', n: 'Trang phục (Dress code)', isNew: 1, show: 'dress', sub: d.dress.colors.length ? `${d.dress.colors.length} màu` : '', st: secState(it.dress), miss: it.dress.miss, body: stDress },
    { k: 'qa', n: 'Hỏi đáp về hai bạn', isNew: 1, show: 'qa', sub: d.qa.length ? `${d.qa.length} câu` : '', st: secState(it.qa), miss: it.qa.miss, body: stQa },
    { k: 'gift', n: 'Mừng cưới (mã QR)', show: 'gift', sub: d.gifts.groom.acc || d.gifts.bride.acc ? 'đã có tài khoản' : '', st: secState(it.gift), miss: it.gift.miss, body: () => panes.gift() },
    { k: 'rsvp', n: 'Xác nhận tham dự & lưu bút', sub: [d.show.rsvp && 'xác nhận', d.show.wishes && 'lưu bút'].filter(Boolean).join(' · ') || 'đang ẩn', st: d.show.rsvp || d.show.wishes ? 'ok' : 'off',
      body: () => `${chk('show.rsvp', 'Khách bấm xác nhận có tới dự không')}${chk('show.wishes', 'Sổ lưu bút — khách gửi lời chúc')}<p class="muted" style="font-size:13px;margin:4px 0 0">Phản hồi của khách xem ở mục "Khách mời & phản hồi".</p>` },
    { k: 'contact', n: 'Liên hệ (nút gọi điện)', isNew: 1, show: 'contact', sub: '', st: secState(it.contact), miss: it.contact.miss,
      body: () => `<div class="grid2">${f('groom.phone', 'Số chú rể', { ph: '0901 234 567', max: 20 })}${f('bride.phone', 'Số cô dâu', { ph: '0901 234 567', max: 20 })}</div><p class="muted" style="font-size:13px;margin:-4px 0 0">Khách bấm là gọi được ngay. Để trống số nào thì ẩn nút đó.</p>` },
    { k: 'music', n: 'Nhạc nền', sub: musicNow().off ? 'đang tắt' : musicNow().auto ? 'tự chọn theo mẫu' : (musicNow().track || {}).name || 'nhạc của bạn', st: musicNow().off ? 'off' : 'ok', body: musicPane },
    { k: 'share', n: 'Ảnh khi gửi link', sub: d.shareOwn || d.shareTitle ? 'tự chọn' : 'tự tạo từ ảnh bìa', st: 'ok', body: stShare },
    { k: 'guests', n: 'Khách mời & phản hồi', sub: card.guest ? 'cần đăng nhập' : 'link tên riêng từng khách', st: 'ok',
      body: () => (card.guest ? '<button class="btn block" type="button" data-st-login>Đăng nhập để thêm khách mời</button>' : '<div id="gBox"></div><div id="rBox" style="margin-top:16px"></div>') },
    { k: 'link', n: 'Tên & đường dẫn thiệp', sub: card.slug ? '/t/' + card.slug : '', st: 'ok', body: stLink },
  ];
}
const ST_MAIN = ['look', 'info', 'date', 'invite', 'album'];
const ST_EXTRA = ['story', 'calendar', 'dress', 'qa', 'gift', 'rsvp', 'contact'];
// bật một phần thêm: cờ hiện / ẩn tương ứng trên thiệp
const ADD_SHOW = { calendar: ['calendar', 'countdown'], rsvp: ['rsvp', 'wishes'], dress: ['dress'], qa: ['qa'], gift: ['gift'], contact: ['contact'], story: [] };
const ST_KW = { look: 'mẫu màu bảng màu hiệu ứng nền hoa anh đào tuyết', info: 'tên chú rể cô dâu bố mẹ danh xưng địa chỉ họ tên', date: 'ngày cưới giờ lễ tiệc địa điểm nhà hàng bản đồ', invite: 'lời mời lời nhắn', album: 'ảnh album hình', story: 'chuyện tình', calendar: 'lịch đếm ngược', dress: 'trang phục dress code màu', qa: 'hỏi đáp phỏng vấn câu hỏi', gift: 'mừng cưới tài khoản ngân hàng qr', rsvp: 'xác nhận tham dự lưu bút lời chúc', contact: 'liên hệ số điện thoại gọi', music: 'nhạc bài hát', share: 'ảnh gửi link zalo facebook', guests: 'khách mời phản hồi', link: 'đường dẫn tên thiệp video led' };
const ST_ICON = { ok: '<i class="sx ok st-i">✓</i>', miss: '<i class="sx miss st-i">!</i>', off: '<i class="sx off st-i"></i>' };
const stHead = (s) => `${ST_ICON[s.st]}<span class="st-n"><b>${esc(s.n)}${s.isNew ? ' <em class="snew">MỚI</em>' : ''}</b>${s.st === 'miss' ? `<small class="st-miss">${esc(s.miss || s.sub || 'còn thiếu')}</small>` : ''}</span>${s.show ? `<button type="button" class="stg${card.data.show[s.show] ? ' on' : ''}" data-stg="${s.show}" aria-label="Bật / tắt ${esc(s.n)}" title="${card.data.show[s.show] ? 'Đang hiện — bấm để ẩn' : 'Đang ẩn — bấm để hiện'}"></button>` : ''}`;
function studioPane() {
  const L = stSecs(), items = secItems(), on = items.filter((it) => secOn(it) && !it.opt), done = on.filter((it) => it.ok).length;
  // phần thêm đang tắt: vẫn dựng sẵn (ẩn) để bấm chữ trên thiệp vẫn tìm được ô, chỉ không chiếm chỗ trong danh sách
  const off = (s) => ST_EXTRA.includes(s.k) && s.st === 'off' && stOpen !== s.k;
  const sec = (s) => `<details class="st-sec" data-kw="${esc(ST_KW[s.k] || '')}" data-sec="${s.k}"${stOpen === s.k ? ' open' : ''}${off(s) ? ' hidden' : ''}><summary class="st-h">${stHead(s)}</summary><div class="st-b">${s.body()}</div></details>`;
  const grp = (t, ks) => `<h5 class="st-g">${t}</h5>${L.filter((s) => ks.includes(s.k)).map(sec).join('')}`;
  const offs = L.filter(off);
  return `<div class="st-top"><div class="sprog"><div><i style="width:${Math.round((done / Math.max(1, on.length)) * 100)}%"></i></div><b>${done}/${on.length} mục đã xong</b></div></div>
    ${grp('Nội dung chính', ST_MAIN)}
    ${grp('Phần thêm', ST_EXTRA.concat('music'))}
    ${offs.length ? `<div class="st-add"><span>+ Thêm phần</span>${offs.map((s) => `<button type="button" data-addsec="${s.k}">${esc(s.n.replace(/ \(.*\)$/, ''))}</button>`).join('')}</div>` : ''}
    ${grp('Gửi đi', ['share', 'guests', 'link'])}`;
}
// gõ chữ: chỉ cập nhật dòng tiêu đề các mục (✓ / tóm tắt), không vẽ lại cả bảng
let stHeadT = null;
function stHeadsSoon() {
  clearTimeout(stHeadT);
  stHeadT = setTimeout(() => { if (curTab !== 'studio') return; stSecs().forEach((s) => { const h = $(`#panes details[data-sec="${s.k}"] > summary`); if (h) h.innerHTML = stHead(s); }); }, 250);
}
function stLook() {
  const tpl = META.templates.find((t) => t.id === card.template) || META.templates[0];
  return `<p class="muted tplnow" style="margin:0 0 4px">Mẫu đang dùng: <b>${esc(tpl.name)}</b> <small>— chọn mẫu khác ở cột bên trái</small></p>
    <h4 style="margin:12px 0 8px">Bảng màu</h4>
    <div class="pals">${tpl.palettes.map((p) => `<button data-pal="${p.id}" class="${p.id === card.palette ? 'on' : ''}"><i style="background:linear-gradient(135deg,${p.swatch[0]} 50%,${p.swatch[1]} 50%)"></i>${esc(p.name)}</button>`).join('')}</div>
    <h4 style="margin:16px 0 8px">Hiệu ứng nền <small class="muted" style="font-weight:400">rơi nhẹ trên thiệp</small></h4>
    <div class="fxs">${FX_LIST.map(([id, n]) => `<button type="button" data-fx="${id}" class="${(card.data.fx || '') === id ? 'on' : ''}">${n}</button>`).join('')}</div>
    <p class="muted" style="font-size:12.5px;margin:10px 0 0">Kiểu chữ đi theo từng mẫu — đổi mẫu để có kiểu chữ khác.</p>`;
}
// cột chọn mẫu bên trái (chỉ máy tính)
function renderSide() {
  const el = $('#tside'); if (!el) return;
  if (!studio() || !card || stOpen !== 'look') { el.hidden = true; return; }
  const y = el.scrollTop, tpl = META.templates.find((t) => t.id === card.template) || META.templates[0];
  el.hidden = false;
  el.innerHTML = `<div class="ts-h"><h3>Mẫu thiệp</h3><button type="button" class="btn sm soft" data-side-x>Xong</button></div>${tplPicker(tpl)}`;
  el.scrollTop = y;
}
function sideBind() {
  $('#tside').addEventListener('click', async (e) => {
    if (e.target.closest('[data-side-x]')) { const dt = $('#panes details.st-sec[data-sec="look"]'); if (dt) dt.open = false; else { stOpen = null; renderSide(); } return; }
    const g = e.target.closest('[data-tg]'), t = e.target.closest('[data-tpl]');
    if (g) { tplGroup = g.dataset.tg; renderSide(); return; }
    if (!t || card.template === t.dataset.tpl) return;
    card.template = t.dataset.tpl; card.palette = '';
    renderSide(); rerender(); renderHeader();
    await save(); // máy chủ chọn bảng màu mặc định của mẫu mới — lưu xong vẽ lại để nút màu đúng
    rerender(); renderSide();
  });
}
function stInfo() {
  const d = card.data;
  const TT = ['Ông', 'Bà', 'Cụ ông', 'Cụ bà'];
  const row = (lab, main, side) => `<div class="frow${side ? '' : ' w2'}"><span class="fl">${lab}</span>${main}${side || ''}</div>`;
  // tên đôi đã chốt (thiệp đã kích hoạt / đã qua ngày cưới): khoá ô, rê chuột thấy lý do
  const ik = (k, ph, max) => `<input class="input" data-k="${k}" value="${esc(getP(d, k) || '')}" placeholder="${esc(ph)}" maxlength="${max}" autocomplete="off"${frozenKey(k) ? ` disabled title="${card.paid ? 'Thiệp đã kích hoạt nên tên đã chốt, không đổi được' : 'Đã qua ngày cưới nên tên cố định'}"` : ''}>`;
  const rsel = (who) => `<select class="input" data-k="${who}.rank" aria-label="Danh xưng"><option value="">Danh xưng</option>${RANKS.filter((r) => (who === 'groom') === /nam|trai/.test(r)).map((r) => `<option${r === d[who].rank ? ' selected' : ''}>${r}</option>`).join('')}</select>`;
  // bố / mẹ: tên + "Ông / Bà" (lưu ghép "Ông Trần Quang Hải" như trước)
  const par = (who, k, lab, def, ph) => {
    const v = d[who][k] || '', m = /^(Cụ ông|Cụ bà|Ông|Bà)\s+(.*)$/.exec(v), t = m ? m[1] : v ? '' : def, n = m ? m[2] : v;
    return row(lab, `<input class="input" data-pn="${who}.${k}" value="${esc(n)}" placeholder="${esc(ph)}" maxlength="70" autocomplete="off">`,
      `<select class="input" data-pt="${who}.${k}" aria-label="Kính xưng"><option value="">—</option>${TT.map((x) => `<option${x === t ? ' selected' : ''}>${x}</option>`).join('')}</select>`);
  };
  const side = (who) => `${row(who === 'groom' ? '🤵 Chú rể' : '👰 Cô dâu', ik(`${who}.name`, who === 'groom' ? 'Tên gọi trên thiệp (Gia Huy)' : 'Tên gọi trên thiệp (Bảo Ngọc)', 40), rsel(who))}
    ${row('Họ tên', ik(`${who}.fullName`, who === 'groom' ? 'Trần Gia Huy' : 'Lê Bảo Ngọc', 80))}
    ${par(who, 'father', 'Bố', 'Ông', who === 'groom' ? 'Trần Quang Hải' : 'Lê Văn Bình')}
    ${par(who, 'mother', 'Mẹ', 'Bà', who === 'groom' ? 'Nguyễn Thị Lan' : 'Trần Thị Hương')}
    ${row('Địa chỉ', ik(`${who}.address`, 'Phường…, Tỉnh/Thành phố…', 160))}`;
  if (studio()) return `${side('groom')}<hr class="fsep">${side('bride')}${card.guest ? '' : '<p class="muted" style="font-size:12.5px;margin:14px 0 0">✓ Lưu vào hồ sơ cưới — thiệp, màn LED, video tạo sau tự điền sẵn.</p>'}`;
  const rk = (who) => `<label class="field"><span>Danh xưng ${who === 'groom' ? 'chú rể' : 'cô dâu'}</span><select data-k="${who}.rank"><option value="">— Không ghi —</option>${RANKS.filter((r) => (who === 'groom') === /nam|trai/.test(r)).map((r) => `<option${r === d[who].rank ? ' selected' : ''}>${r}</option>`).join('')}</select></label>`;
  const fam = (who, ten) => `<h4 style="margin:10px 0 8px">${ten}</h4>
    ${f(`${who}.fullName`, 'Họ và tên đầy đủ', { ph: who === 'groom' ? 'Trần Gia Huy' : 'Lê Bảo Ngọc', max: 80 })}
    <div class="grid2">${f(`${who}.father`, 'Bố', { ph: 'Ông Trần Quang Hải', max: 80 })}${f(`${who}.mother`, 'Mẹ', { ph: 'Bà Nguyễn Thị Lan', max: 80 })}</div>
    ${f(`${who}.address`, 'Địa chỉ nhà ' + (who === 'groom' ? 'trai' : 'gái'), { ph: 'Phường…, Tỉnh/Thành phố…', max: 160 })}`;
  return `<div class="grid2">${f('groom.name', 'Tên chú rể', { ph: 'Gia Huy', max: 40 })}${f('bride.name', 'Tên cô dâu', { ph: 'Bảo Ngọc', max: 40 })}</div>
    <div class="grid2">${rk('groom')}${rk('bride')}</div>
    ${fam('groom', 'Nhà trai')}${fam('bride', 'Nhà gái')}
    ${card.guest ? '' : '<p class="muted" style="font-size:12.5px;margin:4px 0 0">✓ Lưu vào hồ sơ cưới — thiệp, màn LED, video tạo sau tự điền sẵn.</p>'}`;
}
function stDate() {
  const d = card.data;
  return `<div class="grid2">${f('date', 'Ngày cưới (dương lịch)', { type: 'date', hint: 'Ngày âm lịch tự tính' })}${f('time', 'Giờ', { type: 'time' })}</div>
    <h4 style="margin:6px 0 8px">Các lễ trong ngày cưới</h4>
    <div id="evs">${d.events.map((e, i) => `
      <details class="ev" data-ev="${i}"${evOpen.has(i) ? ' open' : ''}>
        <summary class="ev-h">${evSum(e, i)}
          <span class="ev-act">${e.main ? '<i class="ev-star" title="Lễ chính">★</i>' : ''}${i ? `<button class="btn sm plain" data-ev-up="${i}" title="Lên trên" type="button">↑</button>` : ''}
          <button class="btn sm danger" data-ev-del="${i}" type="button">Xoá</button></span></summary>
        <div class="ev-b">
        ${f(`events.${i}.name`, 'Tên lễ', { ph: 'Lễ Vu Quy / Lễ Thành Hôn / Tiệc Cưới', max: 60 })}
        <div class="grid2">${f(`events.${i}.date`, 'Ngày', { type: 'date' })}${f(`events.${i}.time`, 'Giờ làm lễ / khai tiệc', { type: 'time' })}</div>
        <div class="grid2">${f(`events.${i}.welcome`, 'Giờ đón khách', { type: 'time' })}<label class="check" style="align-self:end;margin-bottom:14px"><input type="checkbox" data-ev-main="${i}" ${e.main ? 'checked' : ''}> ★ Lễ chính</label></div>
        ${f(`events.${i}.place`, 'Nơi tổ chức', { ph: 'Nhà hàng Ngọc Lan — Sảnh A', max: 120 })}
        ${f(`events.${i}.mapUrl`, '📍 Link Google Maps', { ph: 'Dán link hoặc toạ độ vào đây', hint: 'Google Maps → tìm nhà hàng → Chia sẻ → Sao chép đường liên kết. Bản đồ trên thiệp sẽ ghim đúng chỗ.' })}
        ${f(`events.${i}.address`, 'Địa chỉ (không bắt buộc)', { ph: 'Số nhà, đường, phường, tỉnh/thành', max: 200 })}
        </div>
      </details>`).join('') || '<p class="muted">Chưa có lễ nào.</p>'}</div>
    ${d.events.length < 6 ? `<div class="chips2" style="margin-top:10px">${EV_PRESETS.map((n) => `<button type="button" data-ev-add="${esc(n)}">+ ${esc(n)}</button>`).join('')}<button type="button" data-ev-add="">+ Lễ khác</button></div>` : ''}`;
}
function stDress() {
  const dr = card.data.dress;
  return `<p class="muted" style="margin:0 0 10px;font-size:13.5px">Chọn tối đa 5 màu bạn mong khách diện — hiện thành dải màu trên thiệp.</p>
    <div class="dr-c">${DRESS_COLORS.concat(dr.colors.filter((c) => !DRESS_COLORS.includes(c))).map((c) => `<button type="button" data-dc="${c}" class="${dr.colors.includes(c) ? 'on' : ''}" style="background:${c}" aria-label="${c}"></button>`).join('')}<label class="dr-own" title="Màu khác">+<input type="color" id="dcOwn"></label></div>
    <div style="margin-top:12px">${f('dress.note', 'Lời nhắn (không bắt buộc)', { ph: 'Nam: vest / sơ mi · Nữ: váy, áo dài', max: 200 })}</div>`;
}
function stQa() {
  const q = card.data.qa;
  return `<p class="muted" style="margin:0 0 10px;font-size:13.5px">Vài câu hỏi vui để khách hiểu thêm về hai bạn (tối đa 6). Câu chưa có trả lời sẽ không hiện.</p>
    ${q.length < 6 ? `<div class="chips2">${QA_IDEAS.filter((x) => !q.some((y) => y.q === x)).map((x) => `<button type="button" data-qa-add="${esc(x)}">+ ${esc(x)}</button>`).join('')}<button type="button" data-qa-add="">+ Câu khác</button></div>` : ''}
    ${q.map((x, i) => `<div class="qa-r"><input data-k="qa.${i}.q" value="${esc(x.q)}" maxlength="120" placeholder="Câu hỏi"><textarea data-k="qa.${i}.a" rows="2" maxlength="400" placeholder="Câu trả lời">${esc(x.a)}</textarea><button type="button" class="qa-x" data-qa-del="${i}" aria-label="Xoá câu này">×</button></div>`).join('')}`;
}
function stShareImgs() {
  const d = card.data;
  return [d.cover, ...d.photos].filter(Boolean).map(baseUrl).filter((u, i, a) => a.indexOf(u) === i && !/slot\.svg/.test(u)).slice(0, 12);
}
const shareAuto = () => {
  const d = card.data;
  return [`Thiệp cưới ${d.groom.name || 'Chú rể'} & ${d.bride.name || 'Cô dâu'}`, d.date ? `${weekdayVi(d.date)}, ${d.date.split('-').reverse().join('/')} · Trân trọng kính mời` : 'Trân trọng kính mời bạn tới dự lễ cưới của chúng mình'];
};
function stShare() {
  const d = card.data, own = baseUrl(d.shareOwn), imgs = stShareImgs(), [aT, aD] = shareAuto();
  const src = own || baseUrl(d.shareImg) || imgs[0] || '';
  return `<p class="muted" style="margin:0 0 10px;font-size:13.5px">Ảnh và chữ hiện ra khi dán link thiệp vào Zalo, Messenger, Facebook.</p>
    <div class="sh-imgs"><button type="button" data-own="" class="${own ? '' : 'on'}"><span>Tự tạo</span></button>${imgs.map((u) => `<button type="button" data-own="${esc(u)}" class="${own === u ? 'on' : ''}" style="background-image:url('${esc(u)}')"></button>`).join('')}</div>
    ${f('shareTitle', 'Tiêu đề', { ph: aT, max: 100 })}${f('shareDesc', 'Mô tả', { ph: aD, max: 200 })}
    <div class="sh-pv"><span>Xem trước</span><div class="sh-b"><div class="sh-im" style="${src ? `background-image:url('${esc(src)}')` : ''}"></div><div class="sh-tx"><b id="shPt">${esc(d.shareTitle || aT)}</b><small id="shPd">${esc(d.shareDesc || aD)}</small><em>${esc(META.baseUrl.replace(/^https?:\/\//, ''))}</em></div></div></div>
    <p class="muted" style="font-size:12.5px;margin:10px 0 0">Zalo / Facebook giữ ảnh cũ vài giờ. Muốn thấy ảnh mới ngay, gửi link có thêm <b>?v=2</b> ở cuối.</p>`;
}
function stLink() {
  return `<label class="field"><span>Tên thiệp (chỉ bạn thấy)</span><input id="titleIn" value="${esc(card.title)}" maxlength="60"></label>
    <label class="field"><span>Đường dẫn thiệp</span>
      <div style="display:flex;gap:8px"><div class="slug" style="flex:1"><span>${esc(META.baseUrl.replace(/^https?:\/\//, ''))}/t/</span><input id="slugIn" value="${esc(card.slug)}" maxlength="40"></div><button class="btn plain" id="slugSave" type="button">Lưu</button></div>
      <small>Chỉ dùng chữ không dấu, số và dấu gạch ngang. Ví dụ: minh-ha-2026</small></label>
    <div style="display:grid;gap:8px;margin-top:6px">
      <a class="btn block plain" href="/sua-video/${CARD_ID}">🎬 Slide / màn hình dạm ngõ</a>
      ${card.led && card.led.created ? `<a class="btn block plain" href="/sua-led/${CARD_ID}">✨ Màn hình LED</a>` : ''}
      ${card.status === 'published' ? '<button class="btn danger block" id="unpub" type="button">Tạm ẩn thiệp (về bản nháp)</button>' : ''}
    </div>`;
}
// sau mỗi lần vẽ bảng: gắn hộp album / tải danh sách khách của mục đang mở
function stAfter() {
  if (curTab !== 'studio') return;
  const alb = $('#stAlb');
  if (alb && stOpen === 'album' && !alb.dataset.m) { alb.dataset.m = '1'; albumMount(alb, albRatio); }
  const g = $('#gBox');
  if (g && stOpen === 'guests' && !g.dataset.m) { g.dataset.m = '1'; g.innerHTML = '<div class="skeleton" style="height:160px"></div>'; loadGuests(); loadResponses(); }
}
// mở một mục (đóng mục khác), cuộn bảng tới mục đó
function openSec(k, { scroll = true } = {}) {
  if (!studio()) return false;
  if (curTab !== 'studio') showTab('studio');
  stOpen = k;
  $$('#panes details.st-sec').forEach((x) => { if (x.dataset.sec !== k && x.open) x.open = false; });
  const dt = $(`#panes details.st-sec[data-sec="${k}"]`);
  if (!dt) return false;
  dt.hidden = false;
  if (!dt.open) dt.open = true; else stSync(k);
  stAfter();
  if (scroll) setTimeout(() => dt.scrollIntoView({ block: 'start', behavior: 'smooth' }), 30);
  return true;
}
function stSync(k) { if (k && k !== stSent && ST_SEL[k]) postFrame({ ceSel: ST_SEL[k] }); stSent = k; }
// bấm chữ trên thiệp → mở mục chứa ô đó, sáng ô; không có ô nào → hộp sửa chữ
function stFocus(key) {
  const inp = $(`#panes [data-k="${key}"]`) || $(`#panes [data-pn="${key}"]`);
  const dt = inp && inp.closest('details.st-sec');
  if (!dt) return false;
  stSent = dt.dataset.sec; // thiệp đã ở đúng chỗ (người dùng vừa bấm vào đó)
  openSec(dt.dataset.sec, { scroll: false });
  const ev = inp.closest('details.ev'); if (ev && !ev.open) { ev.open = true; evOpen.add(+ev.dataset.ev); }
  setTimeout(() => {
    inp.scrollIntoView({ block: 'center', behavior: 'smooth' });
    stQuiet = true; inp.focus({ preventScroll: true }); stQuiet = false; // vừa bấm trên thiệp: thiệp đứng yên
    if (inp.select && inp.type !== 'date' && inp.type !== 'time' && inp.tagName !== 'SELECT') inp.select();
    inp.classList.remove('flash'); void inp.offsetWidth; inp.classList.add('flash');
  }, 40);
  return true;
}

let curTab = null;
function showTab(t) {
  // máy tính: luôn là bảng studio; các nút / lối tắt cũ (tpl, date, gift…) mở đúng mục trong đó
  if (studio()) { if (t && t !== 'studio' && ST_TAB[t] !== undefined) stOpen = ST_TAB[t] || stOpen; t = 'studio'; }
  // "Thông tin" (tên, ngày, các lễ): không còn bảng bên trái — sửa thẳng trên thiệp, hoặc popup "Thông tin chính"
  if (t === 'date') { showTab(null); quickStart('info'); return; }
  if (!panes[t]) t = null;
  curTab = t;
  if (t !== 'media' && t !== 'studio' && musicPrev && !musicPrev.paused) musicPrev.pause(); // đóng bảng thì thôi nghe thử
  $$('#tools button').forEach((b) => b.classList.toggle('on', b.dataset.tab === t));
  document.body.classList.toggle('sheet-open', !!t);
  if (!t) { $('#panes').innerHTML = ''; if (wide()) closeQe(); return; }
  if (t === 'guests' && card.guest) { showTab(null); return askLogin('guests'); }
  $('#sheetTitle').textContent = SHEETS[t];
  $('#panes').innerHTML = `<div class="pane">${panes[t]()}</div>`;
  $('#sheetBody').scrollTop = 0;
  if (t === 'guests') { loadGuests(); loadResponses(); }
  stAfter(); renderSide();
}
function rerender() {
  if (!curTab) return;
  const body = $('#sheetBody'), y = body.scrollTop;
  $('#panes').innerHTML = `<div class="pane">${panes[curTab]()}</div>`;
  body.scrollTop = y;
  if (curTab === 'guests') { loadGuests(); loadResponses(); }
  stAfter();
}

// ---------- khách chưa đăng nhập ----------
// card.guest: thiệp nháp gắn với trình duyệt này (chưa có tài khoản). Sửa chữ, đổi mẫu, xem trước được ngay;
// tải ảnh / nhạc, khách mời, đường dẫn riêng, phát hành thì mời đăng nhập — đăng nhập xong thiệp nháp về tài khoản, quay lại đúng trang này.
const LOGIN_WHY = {
  save: 'Đăng nhập để giữ thiệp này trong tài khoản của bạn, mở lại sửa tiếp trên máy nào cũng được, rồi phát hành gửi khách.',
  photo: 'Đăng nhập để tải ảnh cưới và nhạc của bạn lên thiệp.',
  guests: 'Đăng nhập để thêm khách mời và lấy link mang tên riêng từng người.',
  slug: 'Đăng nhập để đặt đường dẫn riêng cho thiệp.',
  pending: 'Ảnh của bạn đang hiện tạm trên máy này. Đăng nhập để lưu ảnh vào thiệp và gửi cho khách.',
};
function askLogin(why = 'save') {
  const next = encodeURIComponent(location.pathname);
  openModal(`<h2 style="margin-top:0">Lưu thiệp vào tài khoản</h2>
    <p class="muted" style="margin:0 0 16px">${LOGIN_WHY[why] || LOGIN_WHY.save} Những gì bạn vừa sửa được giữ nguyên.</p>
    <div style="display:grid;gap:8px">
      ${META.googleLogin ? `<a class="btn block" data-go href="/auth/google?next=${next}">Tiếp tục với Google</a>` : ''}
      ${META.facebookLogin ? `<a class="btn block ${META.googleLogin ? 'plain' : ''}" data-go href="/auth/facebook?next=${next}">Tiếp tục với Facebook</a>` : ''}
      ${META.emailSignup ? `<a class="btn block ${META.googleLogin || META.facebookLogin ? 'plain' : ''}" data-go href="/dang-nhap?dang-ky=1&next=${next}">Dùng email</a>` : `<a class="muted" style="font-size:13px;text-align:center" data-go href="/dang-nhap?next=${next}">Tôi có tài khoản email từ trước</a>`}
    </div>
    <p class="muted" style="font-size:13px;margin:14px 0 0">Miễn phí, không cần thẻ. Dùng thử ${META.trialDays} ngày, mời ${META.trialGuestLimit} khách.</p>`, (box) => {
    box.addEventListener('click', async (e) => {
      const a = e.target.closest('[data-go]'); if (!a) return;
      e.preventDefault();
      clearTimeout(saveTimer); saveTimer = null;
      busyBtn(a); loading.show('Đang lưu thiệp…');
      if (dirty) await commit(); // chỉnh sửa chưa lưu phải nằm trên máy chủ trước khi rời trang
      location.href = a.href; // màn chờ giữ tới lúc trang đăng nhập mở
    });
  });
}

// ---------- lưu ----------
function status(t) { const el = $('#saved'); el.textContent = card && card.guest && t === 'Đã lưu ✓' ? 'Bản nháp tạm' : t; el.classList.toggle('ok', el.textContent === 'Đã lưu ✓'); el.title = el.textContent; const sb = $('#subl'); if (sb) sb.classList.toggle('ok', el.classList.contains('ok')); }
// Lưu xong có phải vẽ lại thiệp không: chỉ bỏ qua khi MỌI thay đổi từ lần lưu trước đã được đổi sẵn ngay trên khung
// (vd. ảnh vừa tải lên đã thay vào đúng ô) — khỏi tải lại cả thiệp, album không nhảy về ảnh đầu, hiệu ứng không chạy lại.
// null = chưa có thay đổi; true = toàn thay đổi đã hiện sẵn; false = có thay đổi cần vẽ lại.
let liveOnly = null;
function markChange(live) { liveOnly = live && liveOnly !== false; }
// Trình sửa KHÔNG tự lưu: mọi thay đổi chỉ là bản nháp trên máy (+ bản nháp ở máy chủ để dựng khung xem trước, không ghi
// vào thiệp). Thiệp thật — khách đang xem — chỉ đổi khi bấm "Lưu" (hoặc ⌘/Ctrl+S, hoặc Phát hành).
let dirty = false, draftTimer = null, draftBusy = null, savedData = null, hasDraft = false; // hasDraft: phiên này đã gửi bản nháp (bản nháp cũ của lần mở trước thì bỏ)
// Chưa đăng nhập: mọi chữ / ngày / mẫu / màu đang sửa cũng cất vào trình duyệt (cùng ý với ảnh tạm) — tải lại trang,
// lỡ đóng tab hay quay lại sau vẫn còn; đăng nhập xong (lưu lên máy chủ) thì xoá bản cất này.
const GKEY = () => 'cn-nhap:' + CARD_ID;
function guestKeep() {
  if (!card || !card.guest) return;
  try { localStorage.setItem(GKEY(), JSON.stringify({ at: Date.now(), data: card.data, template: card.template, palette: card.palette, title: card.title })); } catch (e) { /* hết chỗ / chặn lưu */ }
}
function guestDrop() { try { localStorage.removeItem(GKEY()); } catch (e) { /* bỏ qua */ } }
function setDirty(on) {
  dirty = on;
  if (on) guestKeep(); else guestDrop();
  const b = $('#saveBtn');
  if (b) { b.disabled = !on; b.textContent = on ? 'Lưu' : 'Đã lưu'; b.classList.toggle('soft', !on); }
  upStatus();
}
function scheduleSave(delay = 700, { live = false } = {}) {
  markChange(live);
  setDirty(true);
  clearTimeout(draftTimer);
  draftTimer = setTimeout(pushDraft, delay);
}
// thay đổi tức thì (bấm mẫu, màu, xoá ảnh…): đẩy bản nháp ngay; trả về promise để chờ (vd. bảng màu mặc định của mẫu mới)
function save({ live = false } = {}) {
  markChange(live);
  setDirty(true);
  clearTimeout(draftTimer);
  return pushDraft();
}
async function pushDraft() {
  draftTimer = null;
  const redraw = liveOnly !== true;
  liveOnly = null;
  if (!redraw) return; // mọi thay đổi đã hiện sẵn trên khung (chữ gõ, ảnh vừa thay) → khỏi dựng lại
  const my = (draftBusy = (async () => {
    try {
      const r = await api(`/api/cards/${CARD_ID}/draft`, { method: 'POST', body: { data: card.data, title: card.title, template: card.template, palette: card.palette }, quiet: true });
      if (draftBusy !== my) return;
      card.template = r.card.template; card.palette = r.card.palette;
      hasDraft = true;
      refreshPreview();
    } catch (e) { liveOnly = false; toast(e.message, true); }
  })());
  return my;
}
// lưu thật
async function commit() {
  if (saving) { pending = true; return; }
  // ảnh còn đang tải lên → chờ xong rồi lưu (để ảnh nằm trong thiệp)
  if (pendingSlots.size) { status(`Đang chờ ${pendingSlots.size} ảnh tải xong…`); while (pendingSlots.size) await new Promise((r) => setTimeout(r, 300)); }
  saving = true;
  const hadDraft = draftTimer !== null && liveOnly !== true;
  clearTimeout(draftTimer); draftTimer = null;
  status('Đang lưu…');
  const b = $('#saveBtn'); const unbusy = busyBtn(b);
  try {
    const r = await api(`/api/cards/${CARD_ID}`, { method: 'PUT', body: { data: card.data, title: card.title, template: card.template, palette: card.palette }, quiet: true });
    Object.assign(card, { ...r.card, data: card.data });
    let kept = false;
    if (r.card.namesFrozen) { // đã qua ngày cưới: máy chủ giữ nguyên tên đôi + ngày cưới → trình sửa theo máy chủ
      const sd = r.card.data, ch = card.data.groom.name !== sd.groom.name || card.data.bride.name !== sd.bride.name || card.data.date !== sd.date;
      card.data.groom.name = sd.groom.name; card.data.bride.name = sd.bride.name; card.data.date = sd.date;
      if (ch) { kept = true; refreshPreview(); }
    }
    savedData = JSON.stringify(card.data);
    liveOnly = null; hasDraft = false;
    unbusy(); setDirty(false);
    if (hadDraft) refreshPreview();
    renderHeader();
    shareSoon();
    toast(kept ? `Đã lưu — ${card.paid ? 'thiệp đã kích hoạt' : 'đã qua ngày cưới'} nên tên cô dâu chú rể và ngày cưới giữ nguyên` : 'Đã lưu thiệp', kept);
  } catch (e) {
    unbusy(); setDirty(true);
    status('Lưu thất bại');
    toast(e.message, true);
  } finally {
    saving = false;
    if (pending) { pending = false; commit(); }
  }
}
// ---------- ảnh xem trước khi gửi link (Zalo, Messenger, Facebook…) ----------
// JPEG 1200×630: ảnh cưới phủ nền + tên đôi + ngày cưới. Vẽ lại khi ảnh / tên / ngày đổi (shareKey), chạy ngầm.
// Zalo không đọc ảnh WebP, nên ảnh tải lên (WebP) không tự làm ảnh xem trước được.
let shareTimer = null, shareBusy = false;
function shareSoon(ms = 2500) { clearTimeout(shareTimer); shareTimer = setTimeout(makeShareImage, ms); }
const WEEKDAY = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
async function makeShareImage() {
  const d = savedData ? JSON.parse(savedData) : card && card.data; // ảnh chia sẻ theo bản đã lưu
  if (!d || card.guest || shareBusy) return;
  const src = [d.cover, ...(d.photos || [])].find((u) => u && !/^blob:/.test(u)) || '';
  if (!src) return;
  const names = [d.groom.name, d.bride.name].filter(Boolean).join(' & ');
  const key = [src, names, d.date].join('|');
  if (d.shareKey === key && d.shareImg) return;
  shareBusy = true;
  try {
    const img = await new Promise((ok, no) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => ok(im); im.onerror = no; im.src = baseUrl(src); });
    const W = 1200, H = 630, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    // ảnh phủ kín khung, giữ điểm lấy nét đã căn (#p=x,y[,z])
    const [fx, fy, fz] = focusOf(src);
    const sc = Math.max(W / img.naturalWidth, H / img.naturalHeight) * fz, dw = img.naturalWidth * sc, dh = img.naturalHeight * sc;
    g.drawImage(img, (W - dw) * fx / 100, (H - dh) * fy / 100, dw, dh);
    const gr = g.createLinearGradient(0, H * 0.35, 0, H);
    gr.addColorStop(0, 'rgba(20,8,10,0)'); gr.addColorStop(1, 'rgba(20,8,10,.82)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.textAlign = 'center'; g.fillStyle = '#fff'; g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 12;
    g.font = '600 24px system-ui, sans-serif'; g.globalAlpha = 0.88;
    if ('letterSpacing' in g) g.letterSpacing = '6px';
    g.fillText('THIỆP CƯỚI', W / 2, 432);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
    g.globalAlpha = 1;
    let fs = 80;
    do { g.font = `italic 600 ${fs}px Georgia, 'Times New Roman', serif`; fs -= 4; } while (g.measureText(names).width > W - 120 && fs > 36);
    g.fillText(names || card.title, W / 2, 516);
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d.date || '');
    if (m) {
      g.font = '500 30px system-ui, sans-serif';
      g.fillText(`${WEEKDAY[new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay()]} · ${m[3]}.${m[2]}.${m[1]}`, W / 2, 572);
    }
    g.shadowBlur = 0; g.textAlign = 'right'; g.globalAlpha = 0.75; g.font = '600 22px system-ui, sans-serif';
    g.fillText(location.host, W - 36, H - 26);
    const blob = await new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error('toBlob'))), 'image/jpeg', 0.86));
    const url = await uploadFile(new File([blob], 'share.jpg', { type: 'image/jpeg' }), { quiet: true, resized: true });
    const old = d.shareImg;
    card.data.shareImg = url; card.data.shareKey = key;
    const base = savedData ? JSON.parse(savedData) : JSON.parse(JSON.stringify(card.data));
    base.shareImg = url; base.shareKey = key;
    await api(`/api/cards/${CARD_ID}`, { method: 'PUT', body: { data: base }, quiet: true });
    savedData = JSON.stringify(base);
    if (old && old !== url) discardUpload(old);
  } catch (e) {
    console.info('[ảnh chia sẻ] bỏ qua:', e && e.message); // ảnh không cho đọc (CORS) / mạng lỗi: dùng ảnh mặc định
  } finally { shareBusy = false; }
}
// Khung xem trước luôn là khung sửa trực tiếp (bấm ảnh/chữ để sửa); khung sửa chỉ hiện khi rê chuột nên không cần chế độ "xem như khách".
const liveEdit = true;
// Vẽ lại thiệp sau mỗi lần lưu mà không "F5" trước mặt người dùng: tải bản mới vào một khung ẩn
// đè lên khung cũ, cuộn tới đúng chỗ đang xem rồi mới đổi — không nháy trắng, không nhảy về đầu.
let pvTimer = null;
function pvWait(on) { clearTimeout(pvTimer); if (on) pvTimer = setTimeout(() => $('#phone').classList.add('wait'), 500); else $('#phone').classList.remove('wait'); }
function refreshPreview() {
  smpNote();
  const fr = $('#frame');
  const src = `/t/${card.slug}?preview=1${hasDraft ? '&draft=1' : ''}${liveEdit ? '&edit=1' : ''}`;
  if (!fr.getAttribute('src')) { fr.onload = () => pvWait(false); fr.src = src; return; }
  pvWait(true);
  const old = $('#frameNext'); if (old) old.remove(); // lần lưu trước chưa tải xong → bỏ, tải bản mới nhất
  const nf = document.createElement('iframe');
  nf.id = 'frameNext'; nf.title = fr.title; nf.className = 'buf';
  let done = false;
  const swap = () => {
    if (done || !nf.isConnected) return;
    done = true;
    const cur = $('#frame');
    try { nf.contentWindow.scrollTo({ top: cur.contentWindow.scrollY || 0, behavior: 'instant' }); } catch (e) { /* bỏ qua */ }
    let moved = false;
    const go = () => { if (moved) return; moved = true; cur.remove(); nf.id = 'frame'; nf.className = ''; pvWait(false); };
    requestAnimationFrame(go); setTimeout(go, 120); // tab nền: khung hình không chạy → vẫn đổi
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
  const tn = $('#tplN'), tp = META.templates.find((t) => t.id === card.template); if (tn) tn.textContent = tp ? tp.name : '';
  const pl = $('#profL'); if (pl) pl.innerHTML = '';
  const pa = $('#pubArea');
  if (card.guest) {
    // chưa đăng nhập: không có nút Lưu riêng (lưu chỉ có nghĩa khi thiệp vào tài khoản) — "Đăng nhập để lưu" tự lưu phần đã sửa rồi mới rời trang
    pa.innerHTML = `<button class="btn sm" id="loginBtn">Đăng nhập<span class="xl">&nbsp;để lưu</span></button>`;
    $('#loginBtn').onclick = () => askLogin('save');
    return;
  }
  // hồ sơ cưới (sổ tay): tên, danh xưng, các lễ, tài khoản mừng cưới dùng chung cho thiệp mới, màn LED, video
  // dòng nhỏ dưới tên (giống trình sửa video): mẫu · trạng thái lưu · hồ sơ cưới dùng chung
  pl.innerHTML = `· <button class="prof-chip" id="profBtn" type="button" title="Tên, danh xưng, các lễ, số tài khoản dùng chung cho thiệp mới, màn LED, video và sổ tay cưới">✓ hồ sơ cưới dùng chung</button>`;
  // nút: Xem trước (nhẹ) · Lưu (viền, chỉ khi có thay đổi) · một nút đỏ duy nhất: Phát hành / Kích hoạt (đã phát hành thì Chia sẻ thành nút chính khi đã kích hoạt)
  const pv = `<a class="btn sm ghost" href="/t/${esc(card.slug)}?preview=1" target="_blank" rel="noopener" title="Xem thiệp như khách mời">▷<span class="xl">&nbsp;Xem trước</span></a>`;
  const sv = dirty ? '<button class="btn sm soft" id="saveBtn" title="Lưu (⌘/Ctrl+S)">Lưu</button>' : ''; // đã lưu: chỉ còn chữ "Đã lưu ✓" ở dòng dưới tên
  if (card.status !== 'published') {
    pa.innerHTML = pv + sv + '<button class="btn sm" id="pubBtn">Phát hành<span class="xl">&nbsp;thiệp</span></button>';
  } else {
    pa.innerHTML = pv + sv + (card.paid ? '<button class="btn sm" id="shareBtn">Chia sẻ</button>' : '<button class="btn sm soft" id="shareBtn">Chia sẻ</button><button class="btn sm" id="payBtn">Kích hoạt</button>');
  }
  const svb = $('#saveBtn'); if (svb) svb.onclick = () => commit();
  $('#profBtn').onclick = () => quickStart('info');
  const pb = $('#pubBtn'); if (pb) pb.onclick = publish;
  const sb = $('#shareBtn'); if (sb) sb.onclick = shareModal;
  const yb = $('#payBtn'); if (yb) yb.onclick = () => openPayModal(CARD_ID, reloadCard);
}
// Bảng "thông tin chính": tên đôi, ngày giờ, nơi tổ chức tiệc — điền một lần là thiệp có đủ nội dung để gửi.
// Tự mở khi thiệp còn trống tên; mở lại khi bấm Phát hành mà còn thiếu.

// =================== Các mục của thiệp · Trang phục · Hỏi đáp · Ảnh khi gửi link ===================
const RANKS = ['Trưởng nam', 'Thứ nam', 'Út nam', 'Con trai', 'Trưởng nữ', 'Thứ nữ', 'Út nữ', 'Con gái'];
const EV_PRESETS = ['Lễ Ăn Hỏi', 'Lễ Vu Quy', 'Lễ Thành Hôn', 'Tiệc Cưới Nhà Trai', 'Tiệc Cưới Nhà Gái', 'Tiệc Cưới'];
const telOk = (p) => String(p || '').replace(/[^\d]/g, '').length >= 8;
// danh sách mục: trạng thái ✓ (đã có) / ! (đang bật mà còn thiếu) / ○ (đang tắt), bật / tắt, bấm tên để sửa
function secItems() {
  const d = card.data, sh = d.show;
  const evOk = d.events.length && d.events.every((e) => e.name && (e.date || d.date) && (e.time || e.place));
  return [
    { k: 'cover', n: 'Trang bìa', sub: 'ảnh bìa, tên hai bạn, ngày cưới', ok: !!(d.cover && d.groom.name && d.bride.name && d.date), miss: !d.cover ? 'chưa có ảnh bìa' : 'thiếu tên / ngày', go: () => quickStart('info') },
    { k: 'invite', n: 'Lời mời & các lễ', sub: `${d.events.length} lễ`, ok: !!evOk, miss: 'lễ còn thiếu ngày giờ / nơi tổ chức', go: () => quickStart('info') },
    { k: 'gallery', n: 'Album ảnh', show: 'gallery', sub: `${d.photos.filter(Boolean).length} ảnh`, ok: d.photos.filter(Boolean).length >= 3, miss: 'nên có từ 3 ảnh', go: () => albumModal() },
    { k: 'story', n: 'Chuyện tình yêu', sub: 'trống thì tự ẩn', ok: !!d.story, opt: true, miss: 'chưa viết', go: () => (studio() ? openSec('story') : textModal('story')) },
    { k: 'calendar', n: 'Lịch tháng', show: 'calendar', ok: !!d.date, miss: 'chưa có ngày cưới' },
    { k: 'countdown', n: 'Đếm ngược', show: 'countdown', ok: !!d.date, miss: 'chưa có ngày cưới' },
    { k: 'dress', n: 'Trang phục (Dress code)', isNew: 1, show: 'dress', ok: !!(d.dress.colors.length || d.dress.note), miss: 'chưa chọn màu', go: () => dressModal() },
    { k: 'qa', n: 'Hỏi đáp về hai bạn', isNew: 1, show: 'qa', ok: d.qa.some((x) => x.q && x.a), miss: 'chưa có câu hỏi', go: () => qaModal() },
    { k: 'gift', n: 'Mừng cưới (mã QR)', show: 'gift', ok: !!(d.gifts.groom.acc || d.gifts.bride.acc), miss: 'chưa có số tài khoản', go: () => showTab('gift') },
    { k: 'rsvp', n: 'Xác nhận tham dự', show: 'rsvp', ok: true },
    { k: 'wishes', n: 'Sổ lưu bút', show: 'wishes', ok: true },
    { k: 'contact', n: 'Liên hệ (nút gọi điện)', isNew: 1, show: 'contact', ok: telOk(d.groom.phone) || telOk(d.bride.phone), miss: 'chưa có số điện thoại', go: () => quickStart('info') },
    { k: 'share', n: 'Ảnh khi gửi link', sub: d.shareOwn || d.shareTitle ? 'tự chọn' : 'tự tạo từ ảnh bìa', ok: true, go: () => shareEdit() },
  ];
}
const secOn = (it) => (it.show ? card.data.show[it.show] : true);
const secState = (it) => (!secOn(it) ? 'off' : it.ok ? 'ok' : it.opt ? 'off' : 'miss');
function secsPane() {
  const items = secItems(), on = items.filter((it) => secOn(it) && !it.opt), done = on.filter((it) => it.ok).length;
  const icon = { ok: '<i class="sx ok">✓</i>', miss: '<i class="sx miss">!</i>', off: '<i class="sx off"></i>' };
  return `
    <section class="group panel">
      <input class="field-in" id="secQ" placeholder="🔍 Tìm mục: nhạc, ngày cưới, lời chúc…" autocomplete="off" style="width:100%;height:40px;border:1px solid var(--line);border-radius:999px;padding:0 14px;margin-bottom:12px;background:var(--surface);color:var(--ink)">
      <div class="sprog"><div><i style="width:${Math.round((done / Math.max(1, on.length)) * 100)}%"></i></div><b>${done}/${on.length} mục đã có nội dung</b></div>
      <div class="slist" id="slist">${items.map((it) => `
        <div class="srow2" data-sec="${it.k}" data-q="${esc((it.n + ' ' + (it.sub || '')).toLowerCase())}">${icon[secState(it)]}
          <button type="button" class="sname" data-go="${it.k}"${it.go ? '' : ' disabled'}><b>${esc(it.n)}${it.isNew ? ' <em class="snew">MỚI</em>' : ''}</b><small>${esc(secState(it) === 'miss' ? it.miss : it.sub || '')}</small></button>
          ${it.show ? `<button type="button" class="stg${card.data.show[it.show] ? ' on' : ''}" data-stg="${it.show}" aria-label="Bật / tắt ${esc(it.n)}" title="${card.data.show[it.show] ? 'Đang hiện — bấm để ẩn' : 'Đang ẩn — bấm để hiện'}"></button>` : ''}
        </div>`).join('')}</div>
    </section>
    <section class="group panel"><h3>Tên & đường dẫn</h3>
      <label class="field"><span>Tên thiệp (chỉ bạn thấy)</span><input id="titleIn" value="${esc(card.title)}" maxlength="60"></label>
      <label class="field"><span>Đường dẫn thiệp</span>
        <div style="display:flex;gap:8px"><div class="slug" style="flex:1"><span>${esc(META.baseUrl.replace(/^https?:\/\//, ''))}/t/</span><input id="slugIn" value="${esc(card.slug)}" maxlength="40"></div><button class="btn plain" id="slugSave">Lưu</button></div>
        <small>Chỉ dùng chữ không dấu, số và dấu gạch ngang. Ví dụ: minh-ha-2026</small></label>
    </section>
    ${card.status === 'published' ? `<section class="group panel"><h3>Tạm ẩn thiệp</h3><p class="muted" style="margin:-6px 0 12px;font-size:14px">Khách mời sẽ không mở được thiệp cho tới khi bạn phát hành lại.</p><button class="btn danger" id="unpub">Chuyển về bản nháp</button></section>` : ''}`;
}
function secsBind() {
  const box = $('#panes');
  box.addEventListener('click', (e) => {
    if (curTab !== 'secs' && curTab !== 'studio') return;
    const add = curTab === 'studio' && e.target.closest('[data-addsec]');
    if (add) {
      const k = add.dataset.addsec;
      (ADD_SHOW[k] || []).forEach((x) => { card.data.show[x] = true; });
      stOpen = k; stSent = k; stWant = k;
      if ((ADD_SHOW[k] || []).length) applyLive(); else rerender();
      openSec(k);
      return;
    }
    const tg = e.target.closest('[data-stg]'), go = curTab === 'secs' && e.target.closest('[data-go]');
    if (tg) {
      e.preventDefault(); // nút nằm trong dòng tiêu đề mục: không gập / mở mục
      const k = tg.dataset.stg; card.data.show[k] = !card.data.show[k]; applyLive();
      const it = secItems().find((x) => x.show === k);
      if (curTab === 'studio') { if (card.data.show[k] && SHOW_SEC[k]) { stWant = SHOW_SEC[k]; stSent = stWant; openSec(stWant); } } // bật mục → mở luôn để điền
      else if (card.data.show[k] && it && !it.ok && it.go && it.isNew) it.go(); // bật mục mới còn trống → mở luôn hộp điền
    } else if (go) { const it = secItems().find((x) => x.k === go.dataset.go); if (it && it.go) it.go(); }
  });
  box.addEventListener('input', (e) => {
    if (e.target.id !== 'secQ') return;
    const q = e.target.value.trim().toLowerCase();
    $$('#slist [data-sec]').forEach((r) => { r.hidden = !!q && !r.dataset.q.includes(q); });
  });
}
// ----- Trang phục (dress code) -----
const DRESS_COLORS = ['#ffffff', '#f3e6d8', '#e8d5c4', '#c9a27e', '#a47551', '#8b1a24', '#c2185b', '#f4b6c2', '#b7c9a8', '#4f6f52', '#9cb4cc', '#2c3e50', '#6d5a8d', '#2c2c2c'];
function dressModal() {
  if (openSec('dress')) return;
  const dr = card.data.dress; let pick = dr.colors.slice();
  const draw = (box) => { $('#drC', box).innerHTML = DRESS_COLORS.concat(pick.filter((c) => !DRESS_COLORS.includes(c))).map((c) => `<button type="button" data-c="${c}" class="${pick.includes(c) ? 'on' : ''}" style="background:${c}" aria-label="${c}"></button>`).join('') + `<label class="dr-own" title="Màu khác"><input type="color" id="drOwn" value="#d6455d">+</label>`; $('#drN', box).textContent = `${pick.length}/5 màu`; };
  openModal(`<h2 style="margin-top:0">Trang phục (Dress code)</h2>
    <p class="muted" style="margin:-4px 0 12px;font-size:14px">Chọn tối đa 5 màu bạn mong khách diện — hiện thành dải màu trên thiệp. <b id="drN"></b></p>
    <div class="dr-c" id="drC"></div>
    <label class="field" style="margin-top:12px"><span>Lời nhắn (không bắt buộc)</span><input id="drNote" value="${esc(dr.note)}" maxlength="200" placeholder="Nam: vest / sơ mi · Nữ: váy, áo dài"></label>
    <button class="btn block" id="drOk">Lưu & hiện trên thiệp</button>`, (box, close) => {
    draw(box);
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-c]'); if (!b) return;
      const c = b.dataset.c; pick = pick.includes(c) ? pick.filter((x) => x !== c) : pick.length >= 5 ? (toast('Tối đa 5 màu', true), pick) : pick.concat(c); draw(box);
    });
    box.addEventListener('change', (e) => { if (e.target.id === 'drOwn' && pick.length < 5 && !pick.includes(e.target.value)) { pick.push(e.target.value); draw(box); } });
    $('#drOk', box).onclick = () => { dr.colors = pick; dr.note = $('#drNote', box).value.trim(); card.data.show.dress = !!(pick.length || dr.note); close(); applyLive(); };
  });
}
// ----- Hỏi đáp về hai bạn -----
const QA_IDEAS = ['Hai bạn quen nhau thế nào?', 'Ai tỏ tình trước?', 'Buổi hẹn đầu tiên ở đâu?', 'Kỷ niệm đáng nhớ nhất?', 'Điều bạn thích nhất ở người ấy?', 'Ai là người hay giận hơn?'];
function qaModal() {
  if (openSec('qa')) return;
  let list = card.data.qa.length ? card.data.qa.map((x) => ({ ...x })) : [{ q: QA_IDEAS[0], a: '' }];
  const rows = () => list.map((x, i) => `<div class="qa-r" data-i="${i}"><input data-f="q" value="${esc(x.q)}" maxlength="120" placeholder="Câu hỏi"><textarea data-f="a" rows="2" maxlength="400" placeholder="Câu trả lời">${esc(x.a)}</textarea><button type="button" class="qa-x" data-del="${i}" title="Xoá">×</button></div>`).join('');
  openModal(`<h2 style="margin-top:0">Hỏi đáp về hai bạn</h2>
    <p class="muted" style="margin:-4px 0 10px;font-size:14px">Vài câu hỏi vui để khách hiểu thêm về chuyện của hai bạn (tối đa 6).</p>
    <div class="chips2" id="qaIdea">${QA_IDEAS.map((q) => `<button type="button" data-idea="${esc(q)}">+ ${esc(q)}</button>`).join('')}</div>
    <div id="qaL">${rows()}</div>
    <button class="btn block" id="qaOk" style="margin-top:12px">Lưu & hiện trên thiệp</button>`, (box, close) => {
    const sync = () => { list = $$('.qa-r', box).map((r) => ({ q: $('[data-f="q"]', r).value.trim(), a: $('[data-f="a"]', r).value.trim() })); };
    box.addEventListener('click', (e) => {
      const id = e.target.closest('[data-idea]'), del = e.target.closest('[data-del]');
      if (id) { sync(); if (list.length >= 6) return toast('Tối đa 6 câu', true); list = list.filter((x) => x.q || x.a); list.push({ q: id.dataset.idea, a: '' }); $('#qaL', box).innerHTML = rows(); const t = $$('#qaL textarea', box).pop(); if (t) t.focus(); }
      if (del) { sync(); list.splice(+del.dataset.del, 1); $('#qaL', box).innerHTML = rows(); }
    });
    $('#qaOk', box).onclick = () => { sync(); card.data.qa = list.filter((x) => x.q && x.a); card.data.show.qa = card.data.qa.length > 0; close(); applyLive(); };
  });
}
// ----- Ảnh & chữ khi gửi link qua Zalo / Facebook -----
function shareEdit() {
  if (openSec('share')) return;
  const d = card.data, base = (u) => String(u || '').split('#')[0];
  const imgs = [d.cover, ...d.photos].filter(Boolean).map(base).filter((u, i, a) => a.indexOf(u) === i && !/slot\.svg/.test(u)).slice(0, 12);
  let own = base(d.shareOwn);
  const autoT = `Thiệp cưới ${d.groom.name || 'Chú rể'} & ${d.bride.name || 'Cô dâu'}`, autoD = d.date ? `${weekdayVi(d.date)}, ${d.date.split('-').reverse().join('/')} · Trân trọng kính mời` : 'Trân trọng kính mời bạn tới dự lễ cưới của chúng mình';
  openModal(`<h2 style="margin-top:0">Ảnh khi gửi link</h2>
    <p class="muted" style="margin:-4px 0 12px;font-size:14px">Ảnh và chữ hiện ra khi bạn dán link thiệp vào Zalo, Messenger, Facebook.</p>
    <div class="sh-imgs" id="shI"></div>
    <label class="field"><span>Tiêu đề</span><input id="shT" value="${esc(d.shareTitle)}" maxlength="100" placeholder="${esc(autoT)}"></label>
    <label class="field"><span>Mô tả</span><input id="shD" value="${esc(d.shareDesc)}" maxlength="200" placeholder="${esc(autoD)}"></label>
    <div class="sh-pv"><span>Xem trước</span><div class="sh-b"><div class="sh-im" id="shPv"></div><div class="sh-tx"><b id="shPt"></b><small id="shPd"></small><em>${esc(META.baseUrl.replace(/^https?:\/\//, ''))}</em></div></div></div>
    <p class="muted" style="font-size:12.5px;margin:10px 0 0">Zalo / Facebook giữ ảnh cũ vài giờ. Muốn thấy ảnh mới ngay, gửi link có thêm <b>?v=2</b> ở cuối.</p>
    <button class="btn block" id="shOk" style="margin-top:12px">Lưu</button>`, (box, close) => {
    const pv = () => {
      $('#shI', box).innerHTML = `<button type="button" data-own="" class="${own ? '' : 'on'}"><span>Tự tạo</span></button>` + imgs.map((u) => `<button type="button" data-own="${esc(u)}" class="${own === u ? 'on' : ''}" style="background-image:url('${esc(u)}')"></button>`).join('');
      const src = own || base(d.shareImg) || imgs[0] || '';
      $('#shPv', box).style.backgroundImage = src ? `url('${src}')` : '';
      $('#shPt', box).textContent = $('#shT', box).value.trim() || autoT; $('#shPd', box).textContent = $('#shD', box).value.trim() || autoD;
    };
    pv();
    box.addEventListener('click', (e) => { const b = e.target.closest('[data-own]'); if (b) { own = b.dataset.own; pv(); } });
    box.addEventListener('input', pv);
    $('#shOk', box).onclick = () => { d.shareOwn = own; d.shareTitle = $('#shT', box).value.trim(); d.shareDesc = $('#shD', box).value.trim(); close(); applyLive(); toast('Đã lưu — bấm Lưu thiệp để áp dụng'); };
  });
}
function weekdayVi(iso) { return ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][new Date(iso + 'T00:00:00').getDay()]; }
// ----- nhắc trước khi phát hành: mục đang bật mà còn thiếu (không chặn) -----
function missingBeforePublish() { return secItems().filter((it) => !it.opt && secState(it) === 'miss'); }
// Chỗ khung sửa đang hiện ảnh / chữ mẫu (lib/render.js: thiệp chưa có ảnh nào; ô chữ còn trống) — khách xem thiệp KHÔNG thấy.
function samplesLeft() {
  const d = card.data, out = [];
  if (!d.cover && !d.photos.some(Boolean)) out.push({ photo: 1, n: 'Ảnh bìa & album', miss: 'đang là ảnh mẫu', go: () => (studio() ? openSec('album') : albumModal()) });
  d.events.forEach((e, i) => { if (!e.place && !e.address) out.push({ n: e.name || `Lễ ${i + 1}`, miss: 'nơi tổ chức đang là chữ mẫu', go: () => goKey(`events.${i}.place`) }); });
  const par = ['groom', 'bride'].flatMap((w) => ['father', 'mother'].filter((k) => !d[w][k]).map((k) => `${w}.${k}`));
  if (par.length) out.push({ n: 'Tên bố mẹ', miss: `${par.length} ô đang là chữ mẫu`, go: () => goKey(par[0]) });
  return out;
}
// dòng nhắc trên khung xem: còn chỗ đang là mẫu (bấm × để ẩn trong phiên này)
function smpNote() {
  const n = $('#smpNote'); if (!n) return;
  let off = false; try { off = sessionStorage.getItem('smpNoteOff') === CARD_ID; } catch (e) { /* bỏ qua */ }
  n.hidden = off || !samplesLeft().length;
}
// mở đúng chỗ sửa một ô (như bấm chữ đó trên thiệp)
function goKey(key) {
  closeQe();
  const ev = /^events\.(\d+)\.(\w+)$/.exec(key);
  if (studio() && stFocus(key)) return;
  if (ev) eventModal(+ev[1]); else textModal(key);
}

function quickStart(forPublish) {
  // máy tính: "Thông tin chính" / bắt đầu nhanh = mục Cô dâu & chú rể bên phải (phát hành thiếu tên vẫn dùng hộp)
  if (forPublish !== true && openSec('info')) { if (!card.data.groom.name) setTimeout(() => stFocus('groom.name'), 80); return; }
  const d = card.data;
  const party = d.events.find((e) => /tiệc/i.test(e.name)) || d.events[d.events.length - 1];
  const inp = (id, label, v, o = {}) => `<label class="field"><span>${label}</span><input id="${id}" type="${o.type || 'text'}" value="${esc(v || '')}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} ${o.max ? `maxlength="${o.max}"` : ''} ${o.req ? 'required' : ''} autocomplete="off"></label>`;
  const info = forPublish === 'info'; if (info) forPublish = false;
  const pf = (who, k, label, ph, max = 80) => `<label class="field"><span>${label}</span><input data-pf="${who}.${k}" value="${esc(d[who][k] || '')}" placeholder="${esc(ph)}" maxlength="${max}" autocomplete="off"></label>`;
  // bố / mẹ: chọn "Ông / Bà" + tên (ghép lại thành "Ông Trần Quang Hải" như thiệp cũ vẫn lưu)
  const TT = ['Ông', 'Bà', 'Cụ ông', 'Cụ bà'];
  const par = (who, k, label, def, ph) => { const v = d[who][k] || '', m = /^(Cụ ông|Cụ bà|Ông|Bà)\s+(.*)$/.exec(v), t = m ? m[1] : v ? '' : def, n = m ? m[2] : v;
    return `<label class="field"><span>${label}</span><div class="rk"><input data-pn="${who}.${k}" value="${esc(n)}" placeholder="${esc(ph)}" maxlength="70" autocomplete="off"><select data-pt="${who}.${k}"><option value="">—</option>${TT.map((x) => `<option${x === t ? ' selected' : ''}>${x}</option>`).join('')}</select></div></label>`; };
  const rank = (who) => `<select data-pf="${who}.rank" class="rk-s" title="Danh xưng trên thiệp"><option value="">Danh xưng</option>${RANKS.filter((r) => (who === 'groom') === /nam|trai/.test(r)).map((r) => `<option${r === d[who].rank ? ' selected' : ''}>${r}</option>`).join('')}</select>`;
  const fam = (who, ten) => `<h4 style="margin:12px 0 8px">${ten}</h4><div class="grid2">${pf(who, 'fullName', 'Họ và tên đầy đủ', who === 'groom' ? 'Trần Gia Huy' : 'Lê Bảo Ngọc')}${pf(who, 'phone', 'Số điện thoại (nút gọi)', '0901 234 567', 20)}${par(who, 'father', 'Bố', 'Ông', 'Trần Quang Hải')}${par(who, 'mother', 'Mẹ', 'Bà', 'Nguyễn Thị Lan')}</div>${pf(who, 'address', 'Địa chỉ', 'Phường, tỉnh / thành', 160)}`;
  const evRows = () => d.events.map((e, i) => `<div class="ev" style="margin-bottom:8px"><div class="ev-h flat" style="cursor:default">${evSum(e, i)}<span class="ev-act"><button type="button" class="btn sm plain qe-main${e.main ? ' on' : ''}" data-qe-main="${i}" title="${e.main ? 'Lễ chính' : 'Đặt làm lễ chính'}">${e.main ? '★ Lễ chính' : '☆'}</button>${i ? `<button type="button" class="btn sm plain" data-qe-up="${i}" title="Lên trên">↑</button>` : ''}<button type="button" class="btn sm plain" data-qe-ed="${i}">Sửa</button></span></div></div>`).join('');
  openModal(`<h2 style="margin-top:0">${forPublish ? 'Còn thiếu vài thông tin' : info ? 'Thông tin chính' : 'Bắt đầu nhanh'}</h2>
    <p class="muted" style="margin:-6px 0 12px;font-size:13.5px">${forPublish ? 'Điền đủ tên cô dâu, chú rể và ngày cưới để phát hành thiệp.' : info ? 'Mọi chữ trên thiệp đều bấm thẳng vào để sửa. Ở đây điền nhanh các thông tin chính một lượt.' : 'Điền nhanh, phần khác bấm thẳng lên thiệp để sửa.'}</p>
    <form id="qsF" class="qs">
      <div class="grid2">${inp('qsG', 'Tên chú rể', d.groom.name, { ph: 'Gia Huy', max: 40, req: 1 })}${inp('qsB', 'Tên cô dâu', d.bride.name, { ph: 'Bảo Ngọc', max: 40, req: 1 })}</div>
      ${info ? `<div class="grid2" style="margin-top:-4px">${rank('groom')}${rank('bride')}</div>` : ''}
      <div class="grid2">${inp('qsD', 'Ngày cưới', d.date, { type: 'date', req: 1 })}${inp('qsT', 'Giờ tiệc', (party && party.time) || d.time, { type: 'time' })}</div>
      ${party ? inp('qsP', 'Nơi tổ chức', party.place, { ph: 'Nhà hàng Ngọc Lan — Sảnh A (không bắt buộc)', max: 120 }) : ''}
      ${info ? `<details class="ev" style="margin:4px 0 10px"><summary class="ev-h"><span class="ev-s"><b>Họ tên đầy đủ, bố mẹ, địa chỉ hai nhà</b><small>Không bắt buộc</small></span></summary><div class="ev-b">${fam('groom', 'Nhà trai')}${fam('bride', 'Nhà gái')}</div></details>
      <h3 style="margin:14px 0 8px;font-size:15px">Các lễ trong ngày cưới</h3><div id="qsEv">${evRows()}</div>
      ${d.events.length < 6 ? `<div class="chips2" style="margin-bottom:12px">${EV_PRESETS.map((n) => `<button type="button" data-qe-add="${esc(n)}">+ ${esc(n)}</button>`).join('')}<button type="button" data-qe-add="">+ Lễ khác</button></div>` : ''}` : ''}
      <div style="text-align:center;margin-top:6px"><button class="btn" style="min-width:140px;justify-content:center">${forPublish ? 'Lưu & phát hành' : 'Lưu'}</button></div>
    </form>`, (box, close) => {
    if (info) box.addEventListener('click', (e) => { // các lễ: đổi thứ tự tại chỗ; Sửa / Thêm → hộp sửa lễ
      const b = e.target.closest('[data-qe-up],[data-qe-ed],[data-qe-add],[data-qe-main]'); if (!b) return;
      if (b.dataset.qeUp !== undefined) { const i = +b.dataset.qeUp; [d.events[i - 1], d.events[i]] = [d.events[i], d.events[i - 1]]; $('#qsEv', box).innerHTML = evRows(); applyLive(); return; }
      if (b.dataset.qeMain !== undefined) { setMain(+b.dataset.qeMain); $('#qsEv', box).innerHTML = evRows(); applyLive(); return; }
      close();
      if (b.dataset.qeAdd !== undefined) eventModal(d.events.length, '', b.dataset.qeAdd); else eventModal(+b.dataset.qeEd);
    });
    if (!d.groom.name) setTimeout(() => $('#qsG', box).focus(), 60);
    $('#qsF', box).onsubmit = async (e) => {
      e.preventDefault();
      const v = (id) => ($(id, box) ? $(id, box).value.trim() : '');
      const before = JSON.parse(JSON.stringify({ groom: d.groom, bride: d.bride })), partyPlace = party && party.place;
      d.groom.name = v('#qsG'); d.bride.name = v('#qsB');
      const old = d.date;
      d.date = v('#qsD');
      d.events.forEach((ev) => { if (!ev.date || ev.date === old) ev.date = d.date; }); // các lễ chưa có ngày (hoặc đang theo ngày cũ) theo ngày cưới
      if (party) { if (v('#qsT')) party.time = v('#qsT'); party.place = v('#qsP'); }
      if (!d.time && v('#qsT')) d.time = v('#qsT');
      box.querySelectorAll('[data-pf]').forEach((i) => setP(d, i.dataset.pf, i.value.trim())); // họ tên đầy đủ, danh xưng, số điện thoại, địa chỉ
      box.querySelectorAll('[data-pn]').forEach((i) => { const t = $(`[data-pt="${i.dataset.pn}"]`, box).value, n = i.value.trim(); setP(d, i.dataset.pn, n ? (t ? t + ' ' : '') + n : ''); });
      close();
      // đổi chữ ngay trên thiệp đang xem — không để thiệp đứng im với tên cũ trong lúc chờ máy chủ và vẽ lại
      const pk = ['groom.name', 'bride.name'];
      for (const w of ['groom', 'bride']) for (const k of ['fullName', 'father', 'mother', 'address']) pk.push(`${w}.${k}`);
      for (const k of pk) if (getP(d, k) !== getP(before, k)) livePatch(k, String(getP(d, k) || '').trim());
      if (party) { const i = d.events.indexOf(party); if (party.place !== partyPlace) livePatch(`events.${i}.place`, party.place); }
      if (forPublish) { rerender(); renderHeader(); publish(); } else applyLive(); // publish tự lưu trước khi phát hành
    };
  });
}
async function publish(force) {
  clearTimeout(saveTimer);
  if (!card.data.groom.name || !card.data.bride.name || !card.data.date) return quickStart(true);
  const smp = force === true ? [] : samplesLeft();
  let miss = force === true ? [] : missingBeforePublish();
  if (smp.some((x) => x.photo)) miss = miss.filter((it) => it.k !== 'cover' && it.k !== 'gallery'); // đã nhắc ở dòng "ảnh mẫu"
  if (miss.length || smp.length) {
    const row = (it, attr) => `<div class="srow2"><i class="sx miss">!</i><button type="button" class="sname" ${attr}><b>${esc(it.n)}</b><small>${esc(it.miss)}</small></button></div>`;
    return openModal(`<h2 style="margin-top:0">Thiệp còn ${miss.length + smp.length} chỗ cần xem lại</h2>
      <p class="muted" style="margin:-4px 0 12px;font-size:14px">Không bắt buộc — bạn vẫn phát hành được, rồi sửa tiếp bất cứ lúc nào.</p>
      ${smp.length ? `<p style="margin:0 0 6px;font-size:13px;font-weight:600">Đang hiện ảnh / chữ mẫu — khách sẽ không thấy những chỗ này:</p>${smp.map((it, i) => row(it, `data-smp="${i}"`)).join('')}` : ''}
      ${smp.length && miss.length ? '<p style="margin:12px 0 6px;font-size:13px;font-weight:600">Mục chưa xong:</p>' : ''}
      ${miss.map((it) => row(it, `data-fix="${it.k}"`)).join('')}
      <button class="btn block" id="pubGo" style="margin-top:14px">Vẫn phát hành</button>
      <button class="btn block plain" id="pubFix" style="margin-top:8px">Bổ sung trước</button>`, (box, close) => {
      $('#pubGo', box).onclick = () => { close(); publish(true); };
      $('#pubFix', box).onclick = () => { close(); if (smp.length) return smp[0].go(); if (studio()) openSec(SHOW_SEC[miss[0].show] || (miss[0].k === 'invite' ? 'date' : miss[0].k === 'cover' ? 'info' : miss[0].k)); else showTab('secs'); };
      box.addEventListener('click', (e) => { const sb = e.target.closest('[data-smp]'); if (sb) { close(); smp[+sb.dataset.smp].go(); return; } const b = e.target.closest('[data-fix]'); if (!b) return; close(); const it = secItems().find((x) => x.k === b.dataset.fix); if (it && it.go) it.go(); });
    });
  }
  while (saving) await new Promise((r) => setTimeout(r, 100)); // đợi lần lưu đang chạy xong rồi lưu bản mới nhất
  if (dirty) await commit();
  if (dirty) return; // lưu lỗi → không phát hành
  try {
    try { await api(`/api/cards/${CARD_ID}/publish`, { method: 'POST', body: {}, quiet: true }); }
    catch (e) {
      // máy chủ báo thiếu tên / ngày nhưng trình sửa đang có đủ (bản trên máy chủ cũ hơn) → lưu lại bản đang thấy rồi phát hành lại
      if (e.status !== 400) throw e;
      await commit();
      if (dirty) return;
      await api(`/api/cards/${CARD_ID}/publish`, { method: 'POST', body: {} });
    }
    await reloadCard();
    shareModal(true);
  } catch (e) { toast(e.message, true); }
}
function shareModal(first) {
  const url = card.url;
  openModal(`<h2>${first ? '🎉 Thiệp đã được phát hành!' : 'Chia sẻ thiệp'}</h2>
    <p class="muted" style="margin:0 0 16px">Gửi link chung cho mọi người, hoặc vào tab <b>Khách mời</b> để tạo link có tên riêng từng khách.</p>
    <div style="display:flex;gap:8px;margin-bottom:12px"><input class="input" readonly value="${esc(url)}"><button class="btn" id="cpL">Chép link</button></div>
    <a class="btn block ghost" href="${esc(url)}" target="_blank">Mở thiệp như khách mời</a>
    <button class="btn block soft" id="toStory" style="margin-top:8px">🎬 Tạo video đăng TikTok / Story</button>
    ${card.paid ? '' : `<p class="muted" style="font-size:13px;margin:16px 0 0">Bản dùng thử: mời tối đa ${META.trialGuestLimit} khách, hiệu lực ${META.trialDays} ngày. <a href="#" id="toPay">Kích hoạt để mời tới 3.000 khách</a></p>`}`,
  (box, close) => {
    $('#cpL', box).onclick = () => copyText(url, 'Đã chép link thiệp');
    $('#toStory', box).onclick = () => { close(); storyModal(CARD_ID); };
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
// ---------- nhạc nền: nhạc mẫu miễn phí bản quyền (lib/music.js) hoặc MP3 tự tải lên ----------
// Chưa chọn (và chưa tắt) thì thiệp tự phát bản hợp với nhóm mẫu đang dùng.
function musicNow() {
  const d = card.data, M = META.music || { tracks: [], byGroup: {} };
  const grp = (META.templates.find((t) => t.id === card.template) || {}).group || 'toigian';
  const url = d.music || (d.musicOff ? '' : M.byGroup[grp] || '');
  return { url, auto: !d.music && !d.musicOff && !!url, off: !url, track: M.tracks.find((t) => t.file === url) };
}
let musicPrev = null; // máy nghe thử trong bảng (một bản một lúc)
function musicPane() {
  const M = META.music || { tracks: [] }, now = musicNow();
  const playing = (f) => musicPrev && !musicPrev.paused && musicPrev.dataset.f === f;
  const row = (f, name, sub, picked, pickAttr) => `<div class="mrow${picked ? ' on' : ''}">
      <button class="mplay" data-mplay="${esc(f)}" aria-label="${playing(f) ? 'Dừng nghe thử' : 'Nghe thử'}">${playing(f) ? '❚❚' : '▶'}</button>
      <div class="mt"><b>${esc(name)}</b><small>${esc(sub)}</small></div>
      ${picked ? '<span class="mnow">✓ Đang dùng</span>' : `<button class="btn sm plain" ${pickAttr}>Chọn</button>`}
    </div>`;
  const own = card.data.music && !now.track ? row(card.data.music, 'Nhạc bạn tải lên', 'MP3 của bạn', true, '') : '';
  return `${musicUp ? `<p class="muted" style="margin:0 0 10px"><span class="spin"></span> Đang tải lên "${esc(musicUp)}"…</p>` : ''}
    <div class="mlist">${own}${M.tracks.map((t) => row(t.file, t.name, `${t.by} · ${t.mood}`, now.url === t.file, `data-mpick="${esc(t.file)}"`)).join('')}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
      <label class="btn sm soft">Tải lên MP3 của bạn<input type="file" accept="audio/mpeg" id="musicIn" hidden></label>
      ${now.auto || !M.tracks.length ? '' : '<button class="btn sm plain" data-music-auto>Để thiệp tự chọn theo mẫu</button>'}
      ${now.off ? '' : '<button class="btn sm plain" data-music-off>Tắt nhạc</button>'}
    </div>
    <p class="muted" style="font-size:13px;margin:10px 0 0">${now.off ? 'Thiệp đang tắt nhạc.' : 'Nhạc phát khi khách chạm "Mở thiệp".'} Nhạc mẫu là bản thu miễn phí bản quyền. Tự tải lên: tối đa 12MB, chỉ dùng bản nhạc bạn có quyền sử dụng.</p>`;
}
function musicPreview(f) {
  if (musicPrev && musicPrev.dataset.f === f && !musicPrev.paused) { musicPrev.pause(); }
  else {
    if (musicPrev) musicPrev.pause();
    musicPrev = new Audio(f); musicPrev.dataset.f = f;
    musicPrev.onended = musicPrev.onpause = () => { if (curTab === 'media' || curTab === 'studio') rerender(); };
    musicPrev.play().catch((e) => toast('Không phát được: ' + e.message, true));
  }
  if (curTab === 'media' || curTab === 'studio') rerender();
}
const pendingSlots = new Set(); // các vị trí (cover, photos.3…) đang có ảnh chờ tải
function freeSlots(n) {
  const ps = card.data.photos, out = [];
  for (let i = 0; out.length < n && i < 24; i++) if (!ps[i] && !pendingSlots.has('photos.' + i) && !localPhotos['photos.' + i]) out.push('photos.' + i);
  return out;
}
let upQueue = [], upRunning = 0;
function queueUploads(files, keys) {
  keys.forEach((key, i) => { pendingSlots.add(key); upQueue.push({ key, file: files[i] }); });
  if (curTab === 'media') rerender();
  upStatus();
  for (let i = 0; i < 3; i++) pumpUploads();
}
function upStatus() { status(pendingSlots.size ? `Đang tải ${pendingSlots.size} ảnh lên…` : dirty ? 'Chưa lưu' : 'Đã lưu ✓'); }
async function pumpUploads() {
  if (upRunning >= 3 || !upQueue.length) return;
  upRunning++;
  const { key, file } = upQueue.shift();
  let local = '', live = false;
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
    if (to) { photoSet(to, url); live = to === key && photoLive(key, url); } else { toast('Album đã đủ 24 ảnh', true); discardUpload(url); }
  } catch (e) {
    toast(e.message, true);
  } finally {
    pendingSlots.delete(key);
    if (localPhotos[key] === local) delete localPhotos[key];
    if (local) setTimeout(() => URL.revokeObjectURL(local), 60000);
    upRunning--;
    if (curTab === 'media') rerender();
    scheduleSave(400, { live }); // gom các ảnh xong gần nhau vào một lần lưu; ảnh đã thay sẵn trên thiệp thì khỏi vẽ lại
    upStatus();
    pumpUploads();
  }
}

function bind() {
  const panesEl = $('#panes');
  panesEl.addEventListener('input', (e) => {
    const pk = e.target.dataset.pn || e.target.dataset.pt;
    if (pk) {
      const n = ($(`#panes [data-pn="${pk}"]`) || {}).value || '', t = ($(`#panes [data-pt="${pk}"]`) || {}).value || '';
      const v = n.trim() ? (t ? t + ' ' : '') + n.trim() : '';
      setP(card.data, pk, v); livePatch(pk, v); scheduleSave(e.target.tagName === 'SELECT' ? 50 : 700);
      if (curTab === 'studio') stHeadsSoon();
      return;
    }
    const k = e.target.dataset.k;
    if (!k) return;
    setP(card.data, k, e.target.type === 'checkbox' ? e.target.checked : e.target.value);
    if (typeof e.target.value === 'string' && e.target.type !== 'checkbox') livePatch(k, e.target.value.trim());
    scheduleSave(e.target.type === 'checkbox' || e.target.tagName === 'SELECT' ? 50 : 700);
    if (k.endsWith('.name') && (k.startsWith('groom') || k.startsWith('bride'))) renderHeader();
    const em = /^events\.(\d+)\.(\w+)/.exec(k);
    if (em) {
      const s = $(`#evs details[data-ev="${em[1]}"] .ev-s`); if (s) s.outerHTML = evSum(card.data.events[+em[1]], +em[1]);
      const ev = card.data.events[+em[1]]; // sửa ngày / giờ của lễ chính = ngày giờ cưới
      if (ev.main && em[2] === 'date' && ev.date) card.data.date = ev.date;
      if (ev.main && em[2] === 'time' && ev.time) card.data.time = ev.time;
    }
    if (k === 'shareTitle' || k === 'shareDesc') { const [aT, aD] = shareAuto(); const t = $('#shPt'), dd = $('#shPd'); if (t) t.textContent = card.data.shareTitle.trim() || aT; if (dd) dd.textContent = card.data.shareDesc.trim() || aD; }
    if (/^qa\./.test(k) && !card.data.show.qa) card.data.show.qa = true;
    if (k === 'dress.note' && card.data.dress.note.trim()) card.data.show.dress = true;
    if (curTab === 'studio') stHeadsSoon();
  });
  panesEl.addEventListener('toggle', (e) => { // studio: mỗi lúc mở một mục; mở mục → thiệp cuộn tới phần đó
    const dt = e.target; if (!dt.matches || !dt.matches('details.st-sec')) return;
    const k = dt.dataset.sec;
    if (dt.open) {
      stOpen = k; if (stWant && stWant !== k) stWant = null;
      $$('#panes details.st-sec').forEach((x) => { if (x !== dt && x.open) x.open = false; });
      stSync(k); stAfter(); renderSide();
      if (k !== 'music' && musicPrev && !musicPrev.paused) musicPrev.pause();
    } else if (stOpen === k) { stOpen = null; stSent = null; renderSide(); }
  }, true);
  panesEl.addEventListener('toggle', (e) => { // nhớ lễ nào đang mở
    const dt = e.target.closest && e.target.closest('details[data-ev]'); if (!dt) return;
    if (dt.open) evOpen.add(+dt.dataset.ev); else evOpen.delete(+dt.dataset.ev);
  }, true);
  // khách chưa đăng nhập: chặn trước khi mở hộp chọn tệp
  panesEl.addEventListener('click', (e) => {
    if (!card.guest || !e.target.closest('input[type=file]') || e.target.id === 'photosIn') return;
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
        status('Đang đọc link bản đồ…');
        const r = await api(`/api/maplink?url=${encodeURIComponent(url)}`);
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
    if (t.dataset.evMain !== undefined) { setMain(+t.dataset.evMain); applyLive(); return; }
    if (t.id === 'dcOwn') { const dr = card.data.dress, c = t.value.toLowerCase(); if (dr.colors.length >= 5) return toast('Tối đa 5 màu', true); if (!dr.colors.includes(c)) { dr.colors.push(c); card.data.show.dress = true; applyLive(); } return; }
    if (t.id === 'photosIn' && t.files.length) { const fs = Array.from(t.files); t.value = ''; addAlbumFiles(fs); }
    if (t.id === 'musicIn' && t.files[0]) {
      const f = t.files[0];
      musicUp = f.name;
      rerender();
      status('Đang tải nhạc lên…');
      try { card.data.music = await uploadFile(f, { quiet: true }); card.data.musicOff = false; musicUp = ''; rerender(); save(); }
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
    if (ds.evDel !== undefined || ds.evUp !== undefined) e.preventDefault(); // nút trong dòng tóm tắt: không gập / mở lễ
    if (b.id === 'evAdd' || ds.evAdd !== undefined) {
      if (d.events.length >= 6) return toast('Tối đa 6 lễ', true);
      d.events.push({ name: ds.evAdd || '', date: d.date, time: '', welcome: '', place: '', address: '', mapUrl: '', mapPin: '', main: false }); evOpen.add(d.events.length - 1);
      rerender(); save();
      const nf = $(`#panes [data-k="events.${d.events.length - 1}.${ds.evAdd ? 'time' : 'name'}"]`); if (nf) { nf.scrollIntoView({ block: 'center', behavior: 'smooth' }); nf.focus({ preventScroll: true }); }
      return;
    }
    else if (ds.stLogin !== undefined) return askLogin('guests');
    else if (ds.fx !== undefined) d.fx = ds.fx;
    else if (ds.dc) {
      const dr = d.dress, c = ds.dc;
      if (dr.colors.includes(c)) dr.colors = dr.colors.filter((x) => x !== c);
      else if (dr.colors.length >= 5) return toast('Tối đa 5 màu', true);
      else dr.colors.push(c);
      d.show.dress = !!(dr.colors.length || dr.note);
    }
    else if (ds.qaAdd !== undefined) {
      if (d.qa.length >= 6) return toast('Tối đa 6 câu', true);
      d.qa.push({ q: ds.qaAdd, a: '' }); d.show.qa = true;
      rerender(); save();
      const nf = $(`#panes [data-k="qa.${d.qa.length - 1}.${ds.qaAdd ? 'a' : 'q'}"]`); if (nf) nf.focus();
      return;
    }
    else if (ds.qaDel !== undefined) { d.qa.splice(+ds.qaDel, 1); if (!d.qa.length) d.show.qa = false; }
    else if (ds.own !== undefined) d.shareOwn = ds.own;
    else if (ds.evDel !== undefined) {
      if (!confirm('Xoá sự kiện này?')) return; const i = +ds.evDel; d.events.splice(i, 1);
      const o = [...evOpen]; evOpen.clear(); o.forEach((j) => { if (j < i) evOpen.add(j); else if (j > i) evOpen.add(j - 1); });
    }
    else if (ds.evUp !== undefined) {
      const i = +ds.evUp; [d.events[i - 1], d.events[i]] = [d.events[i], d.events[i - 1]];
      const a = evOpen.has(i - 1), c = evOpen.has(i); evOpen.delete(i - 1); evOpen.delete(i); if (a) evOpen.add(i); if (c) evOpen.add(i - 1);
    }
    else if (ds.phDel !== undefined) { d.photos[+ds.phDel] = ''; trimPhotos(); }
    else if (ds.phUp !== undefined) { const i = +ds.phUp; let j = i - 1; while (j > 0 && !d.photos[j]) j--; [d.photos[j], d.photos[i]] = [d.photos[i], d.photos[j]]; }
    else if (ds.coverDel !== undefined) d.cover = '';
    else if (ds.mplay !== undefined) { musicPreview(ds.mplay); return; }
    else if (ds.mpick !== undefined) { d.music = ds.mpick; d.musicOff = false; }
    else if (ds.musicAuto !== undefined) { d.music = ''; d.musicOff = false; }
    else if (ds.musicOff !== undefined) { d.music = ''; d.musicOff = true; if (musicPrev) musicPrev.pause(); }
    else if (ds.tg !== undefined) { tplGroup = ds.tg; rerender(); return; }
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
    if (curTab === 'studio' && !ds.tpl && !ds.pal) renderHeader();
    if (ds.tpl || ds.pal) {
      // đổi mẫu thì máy chủ chọn bảng màu mặc định — lưu xong vẽ lại để nút màu đúng
      await save();
      rerender();
    } else save();
  });
  // gõ ô nào trong bảng → thiệp cuộn tới chữ đó và bao khung
  panesEl.addEventListener('focusin', (e) => { const k = e.target.dataset && e.target.dataset.k; if (k && !stQuiet) { closeQe(); cardFocus(k); } });
  $('#outl').addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]'); if (!b) return;
    try { $('#frame').contentWindow.postMessage({ ceGo: +b.dataset.go }, location.origin); } catch (err) { /* bỏ qua */ }
  });
  // nút công cụ: bấm lần nữa (hoặc ×, hoặc nền mờ trên điện thoại) để đóng bảng
  secsBind(); sideBind();
  const fold = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  $('#stQ').addEventListener('input', (e) => {
    const q = fold(e.target.value.trim());
    document.body.classList.toggle('st-find', !!q);
    if (!q) { rerender(); return; }
    $$('#panes details.st-sec').forEach((dt) => {
      const txt = fold(dt.querySelector('summary').textContent + ' ' + dt.dataset.kw + ' ' + $$('.field>span,.fl,h4', dt).map((x) => x.textContent).join(' '));
      dt.hidden = !txt.includes(q);
    });
  });
  $('#stQ').addEventListener('keydown', (e) => { // Enter: mở mục đầu tiên khớp
    if (e.key === 'Escape') { e.target.value = ''; e.target.dispatchEvent(new Event('input')); return; }
    if (e.key !== 'Enter') return;
    const dt = $$('#panes details.st-sec').find((x) => !x.hidden); if (!dt) return;
    const k = dt.dataset.sec; e.target.value = ''; document.body.classList.remove('st-find'); stOpen = k; rerender(); openSec(k);
  });
  $('#tools').addEventListener('click', (e) => { const t = e.target.closest('[data-tab]'); if (t) showTab(curTab === t.dataset.tab ? null : t.dataset.tab); });
  $('#sheetX').onclick = () => showTab(null);
  $('#scrim').onclick = () => showTab(null);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && curTab && !document.querySelector('.modal')) showTab(null); });
  window.addEventListener('beforeunload', (e) => { if (dirty || saving) { e.preventDefault(); e.returnValue = ''; } });
  document.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (card && card.guest) { if (!document.querySelector('.modal')) askLogin('save'); } else if (dirty) commit(); } });
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
// thêm nhiều ảnh vào album (lấp ô trống trước, giữ thứ tự đã chọn); chưa đăng nhập thì hiện tạm trên máy
async function addAlbumFiles(files) {
  const keys = freeSlots(files.length);
  if (keys.length < files.length) toast(`Album tối đa 24 ảnh — chỉ thêm ${keys.length} ảnh đầu`, true);
  if (!card.guest) return queueUploads(files.slice(0, keys.length), keys);
  const items = [];
  await withLoading('Đang mở ảnh…', async () => { for (let i = 0; i < keys.length; i++) { try { items.push({ key: keys[i], blob: await resizeImage(files[i]), x: 50, y: 40, z: 1 }); } catch (er) { /* bỏ ảnh lỗi */ } } });
  if (items.length) guestPhotos(items);
}
// ---------- hộp quản lý album: bấm vào album trên thiệp ----------
// lưới mọi ảnh album (đã lưu / ảnh tạm / đang tải), kéo để đổi thứ tự, căn / xoá từng ảnh, thêm nhiều ảnh một lần
function albumKeys() {
  const d = card.data, out = [];
  for (let i = 0; i < 24; i++) { const k = 'photos.' + i; if (d.photos[i] || (card.guest && localPhotos[k]) || pendingSlots.has(k)) out.push(k); }
  return out;
}
function albumModal(ratio = 0.75) {
  albRatio = ratio;
  if (openSec('album')) return;
  openModal(`<h2 style="margin-top:0">Album ảnh</h2><div id="alBox"></div><button class="btn block" data-close style="margin-top:16px">Xong</button>`, (box, close) => {
    box.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
    albumMount($('#alBox', box), ratio);
  });
}
// lưới ảnh album: kéo để đổi thứ tự, ✥ căn, × xoá (không hỏi lại), + thêm nhiều ảnh một lần
function albumMount(box, ratio = 0.75) {
  let sig = null; // null = chưa vẽ (album trống cũng phải vẽ lại)
  box.innerHTML = `<p class="muted al-tip">Kéo ảnh để đổi thứ tự (ảnh 1 hiện đầu tiên). Bấm ✥ để căn phần ảnh hiện ra, × để xoá. <b class="al-cnt"></b>${card.guest ? '<br>Ảnh đang hiện tạm trên máy — đăng nhập để lưu vào thiệp.' : ''}</p><div class="al-g"></div>`;
  const tile = (k, i) => {
    const up = pendingSlots.has(k), u = (card.guest && localPhotos[k]) || card.data.photos[+k.split('.')[1]] || localPhotos[k] || '';
    const [fx, fy] = focusOf(u);
    return `<div class="al-t${up ? ' up' : ''}" data-k="${k}" style="background-image:url('${esc(baseUrl(u))}');background-position:${fx}% ${fy}%">
      <i class="al-n">${i + 1}</i>${up ? '<i class="al-sp"></i>' : `<span class="al-b"><button type="button" data-al="crop" title="Căn chỉnh">✥</button><button type="button" data-al="del" title="Xoá">×</button></span>`}</div>`;
  };
  const draw = () => {
    const ks = albumKeys(), nsig = ks.map((k) => k + (pendingSlots.has(k) ? '~' : '') + ((card.guest && localPhotos[k]) || card.data.photos[+k.split('.')[1]] || '')).join('|');
    if (nsig === sig) return; sig = nsig;
    $('.al-cnt', box).textContent = `${ks.length}/24 ảnh`;
    $('.al-g', box).innerHTML = ks.map(tile).join('') + (ks.length < 24 ? '<label class="al-add">+ Thêm ảnh<br><small>chọn nhiều ảnh</small><input type="file" accept="image/*" multiple hidden class="al-in"></label>' : '');
  };
  draw();
  const tick = setInterval(() => { if (!box.isConnected) return clearInterval(tick); if (!box.querySelector('.drag')) draw(); }, 500);
  box.addEventListener('click', (e) => {
    const b = e.target.closest('[data-al]'); if (!b) return;
    e.stopPropagation();
    const k = b.closest('[data-k]').dataset.k;
    if (b.dataset.al === 'crop') photoAct(k, ratio, 'crop');
    else photoAct(k, ratio, 'del'); // xoá luôn, không hỏi lại
    sig = null; setTimeout(draw, 50);
  });
  box.addEventListener('change', (e) => { if (e.target.classList.contains('al-in') && e.target.files.length) { e.stopPropagation(); const fs = Array.from(e.target.files); e.target.value = ''; addAlbumFiles(fs).then(() => { sig = null; draw(); }); } });
  // kéo để đổi thứ tự (chuột / ngón tay): ô đang kéo đổi chỗ ngay với ô dưới tay, thả ra thì lưu thứ tự mới
  let drag = null;
  box.addEventListener('pointerdown', (e) => {
    const t = e.target.closest('.al-t'); if (!t || t.classList.contains('up') || e.target.closest('button') || e.button > 0) return;
    drag = { t, x: e.clientX, y: e.clientY, on: false, before: [...box.querySelectorAll('.al-t')].map((x) => x.dataset.k).join() };
    try { t.setPointerCapture(e.pointerId); } catch (er) { /* bỏ qua */ }
  });
  box.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (!drag.on) { if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return; if (pendingSlots.size) { toast('Chờ ảnh tải xong rồi đổi thứ tự nhé'); drag = null; return; } drag.on = true; drag.t.classList.add('drag'); }
    const over = document.elementFromPoint(e.clientX, e.clientY), o = over && over.closest('.al-t');
    if (!o || o === drag.t || !box.contains(o)) return;
    const r = o.getBoundingClientRect(), after = e.clientX > r.left + r.width / 2;
    o.parentNode.insertBefore(drag.t, after ? o.nextSibling : o);
  });
  const end = () => {
    if (!drag) return;
    const d = drag; drag = null; d.t.classList.remove('drag');
    if (!d.on) return;
    const order = [...box.querySelectorAll('.al-t')].map((x) => x.dataset.k);
    if (order.join() !== d.before) { albumReorder(order); sig = null; setTimeout(draw, 60); }
  };
  box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
}
// sắp lại album theo thứ tự mới (danh sách khoá cũ) — ảnh đã lưu lẫn ảnh tạm của khách
function albumReorder(order) {
  const d = card.data, old = d.photos.slice(), oldLoc = {}, map = {};
  Object.keys(localPhotos).forEach((k) => { if (/^photos\./.test(k)) { oldLoc[k] = localPhotos[k]; delete localPhotos[k]; } });
  const np = [];
  order.forEach((k, i) => { const nk = 'photos.' + i; map[k] = nk; np[i] = old[+k.split('.')[1]] || ''; if (oldLoc[k]) localPhotos[nk] = oldLoc[k]; });
  d.photos = np; trimPhotos();
  if (card.guest) {
    goiYStore('readwrite', (st) => {
      const rq = st.get('pending');
      rq.onsuccess = () => { const p = rq.result; if (p && p.cardId === CARD_ID && Array.isArray(p.items)) st.put({ ...p, items: p.items.map((it) => (map[it.key] ? { ...it, key: map[it.key] } : it)) }, 'pending'); };
      return rq;
    }).catch(() => {});
    refreshPreview(); if (curTab === 'media') rerender();
  } else applyLive();
  toast('Đã đổi thứ tự ảnh');
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
function applyLive() { rerender(); renderHeader(); save(); }
// Ảnh vừa tải lên xong: thay ảnh thật vào đúng ô đang hiện ảnh tạm trên thiệp. Trả về false (→ phải vẽ lại thiệp) khi
// thiệp chưa có ô đó (vd. ô album thứ 10 mà mẫu chưa vẽ) hoặc đang có bản vẽ lại dở dang (bản đó có thể thiếu ảnh này).
function photoLive(key, url) {
  try {
    const fr = $('#frame');
    if ($('#frameNext') || !fr.contentDocument || !fr.contentDocument.querySelector(`[data-ce-photo="${key}"]`)) return false;
    fr.contentWindow.postMessage({ cePhoto: 1, key, src: url, final: 1 }, location.origin);
    return true;
  } catch (e) { return false; }
}
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
  // nhấp nháy = "đang tải lên"; chưa đăng nhập thì ảnh chỉ nằm trên máy, không tải lên → hiện đứng yên (final)
  try { win.postMessage({ cePhoto: 1, key, src: localPhotos[key], final: card && card.guest ? 1 : 0 }, location.origin); } catch (e) { /* bỏ qua */ }
}
// Ảnh mới từ máy: nén ảnh → mở ngay bảng căn chỉnh, đồng thời tải ảnh lên ngầm (thường xong trước khi căn xong)
// → bấm Xong thì hiện tạm lên thiệp đúng phần đã căn, chờ tải xong (nếu chưa) rồi lưu vào thiệp.
// Đóng bảng căn chỉnh = bỏ ảnh vừa chọn (ảnh đã tải lên thì xoá khỏi kho).
async function livePhotoUpload(key, ratio) {
  const f = await pickFile();
  if (!f) return;
  let small;
  try { small = await withLoading('Đang mở ảnh…', () => resizeImage(f)); } catch (e) { return toast(e.message, true); }
  const local = URL.createObjectURL(small);
  if (card.guest) { // chưa đăng nhập: không tải lên được → căn ảnh, hiện tạm trên máy, giữ trong trình duyệt tới lúc đăng nhập
    cropModal(key, ratio, { src: local, onCancel: () => URL.revokeObjectURL(local), onOk: (x, y, z) => guestPhotos([{ key, blob: small, x, y, z }]) });
    return;
  }
  warmUpload();
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
    rerender(); renderHeader(); clearTimeout(saveTimer);
    save({ live: photoLive(key, withFocus(url, x, y, z)) });
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
// bấm vào ảnh đã có (không qua nút trên khung): vào thẳng hộp căn ảnh — trong đó có sẵn "Đổi ảnh khác" / "Xoá ảnh"
// (bỏ hộp chọn Đổi / Căn / Xoá trung gian)
function photoActions(key, ratio) { photoAct(key, ratio, 'crop', true); }
// thay / căn / xoá một ảnh (ảnh đã lưu, hoặc ảnh tạm trên máy khi chưa đăng nhập)
function photoAct(key, ratio, act, more) {
  const loc = card.guest && localPhotos[key];
  if (act === 'replace') livePhotoUpload(key, ratio);
  else if (act === 'crop' && loc) { // căn lại ảnh tạm: lấy lại ảnh trong máy, căn xong cất lại vào kho tạm
    cropModal(key, ratio, { src: loc, more, onMore: (a) => photoAct(key, ratio, a), onCancel: () => {}, onOk: (x, y, z) => fetch(baseUrl(loc)).then((r) => r.blob()).then((blob) => guestPhotos([{ key, blob, x, y, z }], true)) });
  } else if (act === 'crop') cropModal(key, ratio, { more, onMore: (a) => photoAct(key, ratio, a) });
  else if (loc) { delete localPhotos[key]; guestForget(key); refreshPreview(); if (curTab === 'media') rerender(); toast('Đã xoá ảnh'); }
  else { photoSet(key, ''); applyLive(); toast('Đã xoá ảnh'); }
}
// kéo ảnh trong khung (đúng tỉ lệ ô của mẫu) để chọn phần hiện ra
// opt.src: ảnh mới (chưa tải lên) để căn trước; opt.onOk(x, y, z) thay cho việc lưu ngay; opt.onCancel khi đóng mà chưa bấm Xong
function cropModal(key, ratio = 1, opt = {}) {
  const fresh = !!opt.src;
  const u = opt.src || photoGet(key);
  if (!u) return;
  let done = false;
  let [x, y, z] = focusOf(u);
  // khung căn to: vừa tối đa bề ngang hộp (tới ~700px) và chiều cao màn hình, giữ đúng tỉ lệ ô ảnh của mẫu
  const r = ratio || 1, maxW = Math.min(700, window.innerWidth - 64), maxH = Math.max(220, Math.min(640, window.innerHeight - 300));
  const FW = Math.round(Math.min(maxW, maxH * r)), H = Math.round(FW / r);
  openModal(`<h2 style="margin-top:0">Căn chỉnh ảnh</h2>
    <p class="muted" style="margin:-4px 0 12px">Kéo để chọn phần hiện ra. Phóng to / thu nhỏ bằng thanh trượt hoặc chụm, mở hai ngón${matchMedia('(pointer:coarse)').matches ? '' : ' trên bàn di chuột (lăn chuột cũng được)'}.</p>
    <div id="cropF" style="position:relative;margin:0 auto;width:${FW}px;height:${H}px;border-radius:12px;overflow:hidden;touch-action:none;cursor:grab;background:#eee url('${esc(baseUrl(u))}') ${x}% ${y}%/cover no-repeat;box-shadow:inset 0 0 0 2px var(--primary)"></div>
    <label style="display:flex;align-items:center;gap:10px;margin:16px auto 0;max-width:${Math.max(FW, 240)}px">
      <span aria-hidden="true" style="font-size:13px">−</span>
      <input type="range" id="cropZ" min="1" max="4" step="0.01" value="${z}" aria-label="Phóng to" style="flex:1;accent-color:var(--primary)">
      <span aria-hidden="true" style="font-size:18px">+</span>
      <b id="cropZv" style="min-width:42px;text-align:right;font-size:13px">${z.toFixed(1)}×</b>
    </label>
    <div style="display:flex;gap:8px;margin-top:16px"><button class="btn plain" data-c="reset" style="flex:1">Đặt lại</button><button class="btn" data-c="ok" style="flex:2">${fresh && !opt.more ? 'Xong, dùng ảnh này' : 'Xong'}</button></div>
    ${opt.more ? '<div style="display:flex;justify-content:center;gap:18px;margin-top:12px;font-size:13.5px"><a href="#" data-c="replace">Đổi ảnh khác</a><a href="#" data-c="del" style="color:#c0392b">Xoá ảnh</a></div>' : ''}`, (box, close) => {
    box.style.width = `min(${FW + 48}px, 100%)`; // hộp nở theo khung căn to
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
    fr.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.ctrlKey) return setZ(z * Math.exp(-e.deltaY * 0.012)); // chụm / mở hai ngón trên bàn di chuột
      const mouse = e.deltaMode === 1 || (Math.abs(e.deltaY) >= 50 && !e.deltaX); // con lăn chuột: phóng to từng nấc
      if (mouse) return setZ(z * (e.deltaY < 0 ? 1.08 : 1 / 1.08));
      if (!iw) return; // lăn hai ngón: dời ảnh như kéo
      const [ex, ey] = extra();
      if (ex > 1) x = Math.min(100, Math.max(0, x + (e.deltaX / ex) * 100));
      if (ey > 1) y = Math.min(100, Math.max(0, y + (e.deltaY / ey) * 100));
      paint();
    }, { passive: false });
    // Safari trên Mac: cử chỉ chụm hai ngón
    let gz = null;
    fr.addEventListener('gesturestart', (e) => { e.preventDefault(); gz = z; });
    fr.addEventListener('gesturechange', (e) => { e.preventDefault(); if (gz) setZ(gz * e.scale); });
    fr.addEventListener('gestureend', (e) => { e.preventDefault(); gz = null; });
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
      e.preventDefault();
      if (b.dataset.c === 'replace' || b.dataset.c === 'del') { done = true; close(); opt.onMore(b.dataset.c); return; }
      done = true;
      close();
      if (opt.onOk) return opt.onOk(x, y, z);
      photoSet(key, withFocus(u, x, y, z));
      applyLive();
    });
  }, () => { if (!done && opt.onCancel) opt.onCancel(); });
}
const LONG_FIELDS = /^(message|story)$|\.address$/;
const FIELD_NAMES = { name: 'Tên gọi', fullName: 'Họ và tên đầy đủ', father: 'Tên bố', mother: 'Tên mẹ', address: 'Địa chỉ', place: 'Nơi tổ chức', inviteText: 'Lời mời', message: 'Lời nhắn', story: 'Chuyện tình yêu', time: 'Giờ', date: 'Ngày', acc: 'Số tài khoản', holder: 'Chủ tài khoản' };
function labelOf(key) {
  const parts = key.split('.');
  if (key === 'time') return 'Giờ cưới';
  if (key === 'date') return 'Ngày cưới';
  if (parts[0] === 'gifts') return `${FIELD_NAMES[parts[2]] || 'Mừng cưới'} nhà ${parts[1] === 'groom' ? 'trai' : 'gái'}`;
  const who = parts[0] === 'groom' ? 'Chú rể · ' : parts[0] === 'bride' ? 'Cô dâu · ' : parts[0] === 'events' ? `${(card.data.events[+parts[1]] || {}).name || 'Sự kiện'} · ` : '';
  return who + (FIELD_NAMES[parts[parts.length - 1]] || 'Nội dung');
}
const wide = () => matchMedia('(min-width:761px)').matches;
// báo khung thiệp: cuộn tới chữ của ô đang sửa và bao khung quanh chữ đó
function cardFocus(key) { try { $('#frame').contentWindow.postMessage(key ? { ceFocus: 1, key } : { ceBlur: 1 }, location.origin); } catch (e) { /* bỏ qua */ } }
// ô nhập trong bảng bên trái: mở đúng bảng, mở nhóm đang gập, cuộn tới + sáng ô
function focusField(tab, key) {
  if (curTab !== tab) showTab(tab);
  const inp = $(`#panes [data-k="${key}"]`);
  if (!inp) return false;
  const hid = inp.closest('[hidden]');
  if (hid) { hid.hidden = false; const fo = $('#famOpen'); if (fo) fo.hidden = true; }
  const dt = inp.closest('details'); if (dt && !dt.open) dt.open = true;
  inp.scrollIntoView({ block: 'center', behavior: 'smooth' });
  inp.focus({ preventScroll: true });
  if (inp.select && inp.type !== 'date' && inp.type !== 'time') inp.select();
  inp.classList.remove('flash'); void inp.offsetWidth; inp.classList.add('flash');
  return true;
}
// Bấm một dòng chữ trên thiệp mà bảng bên trái không có ô cho nó (lời mời, lời nhắn…), hoặc đang ở điện thoại:
// một ô sửa nhỏ — máy tính: đầu bảng bên trái; điện thoại: ngăn trượt lên từ dưới, thiệp vẫn thấy phía trên.
// Gõ tới đâu thiệp đổi tới đó, không có nút "Lưu" (tự lưu như mọi ô khác).
let qeKey = null;
function closeQe() {
  const q = $('#qe'); if (!q) return;
  q.parentNode.removeChild(q); qeKey = null; document.body.classList.remove('qe-open'); cardFocus(null);
}
function quickEdit(key) {
  closeQe();
  qeKey = key;
  const cur = getP(card.data, key) || '', long = LONG_FIELDS.test(key);
  const q = document.createElement('section');
  q.id = 'qe'; q.className = 'qe';
  q.innerHTML = `<div class="qe-h"><b>✎ ${esc(labelOf(key))}</b><button type="button" class="qe-x">Xong</button></div>
    ${long ? `<textarea id="qeIn" rows="3">${esc(cur)}</textarea>` : `<input id="qeIn" value="${esc(cur)}" autocomplete="off">`}`;
  if (wide()) { if (!curTab) showTab('date'); $('#sheet').insertBefore(q, $('#sheetBody')); } else { document.body.appendChild(q); document.body.classList.add('qe-open'); }
  const inp = $('#qeIn', q);
  setTimeout(() => { inp.focus(); if (!long) inp.select(); }, 40);
  inp.addEventListener('input', () => {
    setP(card.data, key, inp.value); livePatch(key, inp.value.trim()); scheduleSave(700);
    if (/^(groom|bride)\.name$/.test(key)) renderHeader();
  });
  inp.addEventListener('keydown', (e) => { if ((e.key === 'Enter' && !long) || e.key === 'Escape') { e.preventDefault(); closeQe(); } });
  $('.qe-x', q).onclick = closeQe;
}
// một lễ trong lịch trình: bấm tên / giờ / nơi / địa chỉ trên thiệp (hoặc dòng "+ Thêm lễ") → sửa đủ thông tin của lễ đó
// lễ chính: chỉ một lễ; ngày giờ của lễ chính là ngày giờ cưới (trang bìa, đếm ngược, lịch)
function setMain(i) {
  const d = card.data, on = !d.events[i].main;
  d.events.forEach((e, j) => { e.main = on && j === i; });
  if (on && d.events[i].date) { d.date = d.events[i].date; if (d.events[i].time) d.time = d.events[i].time; }
}
function eventModal(i, focus, preset) {
  const d = card.data, isNew = i >= d.events.length;
  if (isNew && d.events.length >= 6) return toast('Tối đa 6 lễ', true);
  const e = isNew ? { name: preset || '', date: d.date, time: '', welcome: '', place: '', address: '', mapUrl: '', mapPin: '', main: false } : d.events[i];
  const inp = (id, label, v, o = {}) => `<label class="field"><span>${label}</span><input id="${id}" type="${o.type || 'text'}" value="${esc(v || '')}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} ${o.max ? `maxlength="${o.max}"` : ''} ${o.attr || ''}></label>`;
  openModal(`<h2 style="margin-top:0">${isNew ? 'Thêm lễ' : esc(e.name || `Lễ ${i + 1}`)}</h2>
    ${inp('evName', 'Tên lễ', e.name, { ph: 'Lễ Vu Quy / Lễ Thành Hôn / Tiệc Cưới', max: 60 })}
    <div class="chips2" style="margin:-4px 0 10px">${EV_PRESETS.map((n) => `<button type="button" data-evn="${esc(n)}">${esc(n)}</button>`).join('')}</div>
    <div class="grid2">${inp('evDate', 'Ngày', e.date, { type: 'date' })}${inp('evTime', 'Giờ làm lễ / khai tiệc', e.time, { type: 'time' })}</div>
    <div class="grid2">${inp('evWel', 'Giờ đón khách (không bắt buộc)', e.welcome, { type: 'time' })}<label class="check" style="align-self:end;margin-bottom:14px"><input type="checkbox" id="evMain" ${e.main ? 'checked' : ''}> ★ Lễ chính</label></div>
    ${inp('evPlace', 'Nơi tổ chức', e.place, { ph: 'Nhà hàng Ngọc Lan — Sảnh A', max: 120 })}
    ${inp('evMap', '📍 Link Google Maps (để bản đồ chỉ đúng chỗ)', e.mapUrl, { ph: 'Dán link hoặc toạ độ vào đây', attr: 'autocomplete="off"' })}
    <p class="muted" id="evMapSt" style="font-size:13px;margin:-6px 0 12px">Mở Google Maps → tìm nhà hàng → <b>Chia sẻ</b> → <b>Sao chép đường liên kết</b> → dán vào ô trên. Hoặc giữ ngón tay lên đúng điểm trên bản đồ, chép dãy toạ độ (vd. <i>21.0285, 105.8542</i>) rồi dán vào.</p>
    ${inp('evAddr', 'Địa chỉ (không bắt buộc)', e.address, { ph: 'Số nhà, đường, phường, tỉnh/thành', max: 200 })}
    <div style="display:flex;gap:8px;margin-top:6px">${isNew ? '' : '<button class="btn plain" id="evDel" style="color:#c0392b">Xoá lễ</button>'}<button class="btn" id="evOk" style="flex:1">${isNew ? 'Thêm vào lịch trình' : 'Lưu'}</button></div>`, (box, close) => {
    const mapIn = $('#evMap', box), st = $('#evMapSt', box);
    box.addEventListener('click', (ev) => { const c = ev.target.closest('[data-evn]'); if (c) { $('#evName', box).value = c.dataset.evn; } });
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
      Object.assign(e, { name: v('#evName'), date: v('#evDate'), time: v('#evTime'), welcome: v('#evWel'), place: v('#evPlace'), address: v('#evAddr'), mapUrl: v('#evMap'), mapPin: v('#evMap') ? pin : '' });
      if (isNew) d.events.push(e);
      if ($('#evMain', box).checked !== !!e.main) setMain(d.events.indexOf(e));
      else if (e.main && e.date) { d.date = e.date; if (e.time) d.time = e.time; }
      // lịch trình xếp theo ngày giờ (lễ chưa có giờ đứng sau cùng trong ngày)
      d.events.sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || (a.time || '99').localeCompare(b.time || '99'));
      close(); applyLive();
    };
    const del = $('#evDel', box);
    if (del) del.onclick = () => { if (!confirm(`Xoá "${e.name || 'lễ này'}" khỏi lịch trình?`)) return; d.events.splice(i, 1); close(); applyLive(); };
  });
}
// ---------- ảnh mang sang từ trang gợi ý (/goi-y) ----------
// Trang /goi-y cất ảnh khách đã chọn (đã thu nhỏ) + vị trí trên thiệp + điểm lấy nét vào IndexedDB, chưa tải lên máy chủ.
// Ở đây: hiện ngay ảnh trong máy lên thiệp; đã đăng nhập thì tải lên và lưu vào thiệp, chưa thì mời đăng nhập
// (đăng nhập xong quay lại đúng trang này, ảnh vẫn còn trong kho tạm → tải lên).
function goiYStore(mode, fn) {
  return new Promise((ok, no) => {
    const r = indexedDB.open('cuoinha-goiy', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onerror = () => no(r.error);
    r.onsuccess = () => {
      const tx = r.result.transaction('kv', mode), rq = fn(tx.objectStore('kv'));
      tx.oncomplete = () => ok(rq && rq.result);
      tx.onerror = tx.onabort = () => no(tx.error);
    };
  });
}
// Khách chưa đăng nhập chọn ảnh trong trình sửa: hiện ngay trên thiệp (chỉ trên máy này), cất vào kho trình duyệt
// cùng chỗ với ảnh từ trang gợi ý → đăng nhập xong mở lại trình sửa là ảnh tự tải lên và vào thiệp (adoptSuggested)
async function guestPhotos(items, recrop) {
  const fw = $('#frame').contentWindow;
  items.forEach((it) => { localPhotos[it.key] = withFocus(URL.createObjectURL(it.blob), it.x, it.y, it.z || 1); showLocalPhoto(fw, it.key); });
  try {
    await goiYStore('readwrite', (st) => {
      const rq = st.get('pending');
      rq.onsuccess = () => {
        const old = rq.result && rq.result.cardId === CARD_ID && Array.isArray(rq.result.items) ? rq.result.items : [];
        const keys = items.map((it) => it.key);
        st.put({ cardId: CARD_ID, at: Date.now(), items: old.filter((it) => keys.indexOf(it.key) < 0).concat(items) }, 'pending');
      };
      return rq;
    });
  } catch (e) { /* kho trình duyệt hỏng: ảnh vẫn hiện tạm trong phiên này */ }
  if (curTab === 'media') rerender();
  status('Ảnh đang hiện tạm trên máy');
  if (!recrop) toast(`Đã thêm ${items.length} ảnh — đăng nhập để lưu ảnh vào thiệp`);
}
function guestForget(key) {
  goiYStore('readwrite', (st) => {
    const rq = st.get('pending');
    rq.onsuccess = () => { const p = rq.result; if (p && p.cardId === CARD_ID && Array.isArray(p.items)) st.put({ ...p, items: p.items.filter((it) => it.key !== key) }, 'pending'); };
    return rq;
  }).catch(() => {});
}
async function adoptSuggested() {
  let p;
  try { p = await goiYStore('readonly', (s) => s.get('pending')); } catch (e) { return; }
  if (!p || p.cardId !== CARD_ID || !Array.isArray(p.items)) return;
  const items = p.items.filter((it) => it && it.blob && (it.key === 'cover' || /^photos\.\d{1,2}$/.test(it.key)));
  if (!items.length) return;
  const locals = items.map((it) => {
    const u = URL.createObjectURL(it.blob);
    localPhotos[it.key] = withFocus(u, it.x, it.y, it.z || 1);
    return u;
  });
  const fw = $('#frame').contentWindow;
  items.forEach((it) => showLocalPhoto(fw, it.key)); // thiệp vẽ xong sau thì báo 'ready' → hiện lại (xem bên dưới)
  if (card.guest) { // chưa đăng nhập: chỉ hiện tạm, không tự bật hộp đăng nhập (khách tự bấm "Đăng nhập để lưu" khi muốn)
    status('Ảnh đang hiện tạm trên máy');
    return;
  }
  status(`Đang tải ${items.length} ảnh lên…`);
  let failed = 0, next = 0;
  const worker = async () => {
    while (next < items.length) {
      const it = items[next++];
      try { photoSet(it.key, withFocus(await uploadFile(it.blob, { quiet: true, resized: true }), it.x, it.y, it.z || 1)); } catch (e) { failed++; }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  items.forEach((it) => { delete localPhotos[it.key]; });
  trimPhotos();
  if (!failed) { try { await goiYStore('readwrite', (s) => { s.delete('pending'); return s.delete('photos'); }); } catch (e) { /* bỏ qua */ } }
  rerender(); renderHeader();
  await save();
  setTimeout(() => locals.forEach((u) => URL.revokeObjectURL(u)), 60000);
  toast(failed ? `${failed} ảnh chưa tải lên được — tải lại trang để thử lại` : 'Đã thêm ảnh của bạn vào thiệp — bấm Lưu để giữ lại', !!failed);
}

// cột "Các phần của thiệp" (màn rộng): bấm để thiệp cuộn tới phần đó
function outline(list) {
  const box = $('#outl'); if (!box) return;
  box.innerHTML = `<h3>Các phần của thiệp</h3>${(list || []).map((x) => `<button type="button" data-go="${x.i}"><i>${x.i + 1}</i><span>${esc(x.label)}</span></button>`).join('')}`;
  box.hidden = !(list && list.length > 1);
}
window.addEventListener('message', (e) => {
  if (e.origin !== location.origin || !e.data || !e.data.ce) return;
  const m = e.data;
  if (m.type === 'ready') {
    Object.keys(localPhotos).forEach((k) => showLocalPhoto(e.source, k)); // thiệp vẽ lại khi ảnh còn đang tải → giữ ảnh tạm
    if (stWant && ST_SEL[stWant]) { const sel = ST_SEL[stWant]; setTimeout(() => { try { e.source.postMessage({ ceSel: sel }, location.origin); } catch (er) { /* bỏ qua */ } }, 300); }
    const nf = $('#frameNext'); if (nf && e.source === nf.contentWindow && nf._ready) nf._ready();
    return;
  }
  if (m.type === 'album') { if (m.ratio) albRatio = m.ratio; if (studio()) { stSent = 'album'; openSec('album'); } else albumModal(m.ratio); return; }
  if (m.type === 'extra') { if (studio()) { stSent = m.key; openSec(m.key); return; } if (m.key === 'dress') dressModal(); else if (m.key === 'qa') qaModal(); else quickStart('info'); return; }
  if (m.type === 'photo') { // ô có ảnh (kể cả ảnh tạm của khách chưa đăng nhập) → hộp Đổi / Căn / Xoá; ô trống → chọn ảnh
    const loc = card.guest && localPhotos[m.key];
    if (!loc && (m.empty || !photoGet(m.key))) livePhotoUpload(m.key, m.ratio);
    else if (m.act) photoAct(m.key, m.ratio, m.act); // nút "Căn chỉnh" / "Thay ảnh" trên khung ảnh
    else photoActions(m.key, m.ratio);
    return;
  }
  if (m.type === 'selDone') { stWant = null; return; } // thiệp đã cuộn tới khối của mục vừa bật
  if (m.type === 'sections') { outline(m.list); return; }
  if (m.type === 'section') { $$('#outl [data-go]').forEach((b) => b.classList.toggle('on', +b.dataset.go === m.i)); return; }
  if (m.type !== 'text') return;
  // bấm chữ trên thiệp → LUÔN mở hộp sửa (popup), máy tính cũng như điện thoại: một lễ → hộp sửa lễ; chữ khác → hộp sửa chữ
  const ev = /^events\.(\d+)\.(\w+)$/.exec(m.key);
  closeQe();
  // máy tính: mở đúng mục bên phải, sáng ô cần sửa (chữ riêng của mẫu, không có ô nào → hộp sửa chữ)
  if (studio() && stFocus(ev && m.map ? `events.${ev[1]}.mapUrl` : m.key)) return;
  if (ev) eventModal(+ev[1], m.map ? 'map' : '');
  else textModal(m.key);
});
// hộp sửa một ô chữ trên thiệp: gõ tới đâu thiệp đổi tới đó; Enter (ô một dòng) / Xong để đóng
function textModal(key) {
  if (frozenKey(key)) return toast(card.paid ? 'Thiệp đã kích hoạt nên tên cô dâu chú rể và ngày cưới đã chốt, không đổi được' : 'Đã qua ngày cưới nên tên cô dâu chú rể và ngày cưới cố định, không sửa được', true);
  const cur = getP(card.data, key) || '', long = LONG_FIELDS.test(key);
  const type = /(^|\.)date$/.test(key) ? 'date' : /(^|\.)time$/.test(key) ? 'time' : 'text';
  cardFocus(key);
  openModal(`<h2 style="margin-top:0">${esc(labelOf(key))}</h2>
    <label class="field" style="margin:0">${long ? `<textarea id="tmIn" rows="5">${esc(cur)}</textarea>` : `<input id="tmIn" type="${type}" value="${esc(cur)}" autocomplete="off">`}</label>
    <button class="btn block" id="tmOk" style="margin-top:14px">Xong</button>`, (box, close) => {
    const inp = $('#tmIn', box);
    setTimeout(() => { inp.focus(); if (!long && type === 'text') inp.select(); }, 40);
    const upd = () => {
      setP(card.data, key, inp.value); livePatch(key, inp.value.trim()); scheduleSave(700);
      if (/^(groom|bride)\.name$/.test(key)) renderHeader();
      if (type !== 'text' || /^(date|time)$/.test(key)) { const f = $(`#panes [data-k="${key}"]`); if (f) f.value = inp.value; }
    };
    inp.addEventListener('input', upd); inp.addEventListener('change', upd);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !long) { e.preventDefault(); close(); } });
    $('#tmOk', box).onclick = close;
  }, () => { cardFocus(null); if (curTab) rerender(); });
}

(async () => {
  try {
    const [meta, r] = await Promise.all([fetch('/api/meta').then((x) => x.json()), api(`/api/cards/${CARD_ID}`)]);
    META = meta;
    card = r.card;
    document.title = 'Sửa thiệp — ' + meta.brand;
  } catch (e) {
    $('#ttl').textContent = e.status === 404 ? 'Không tìm thấy thiệp' : 'Chưa tải được thiệp — tải lại trang nhé';
    pvWait(false); $('#phone').innerHTML = `<div class="pageload bad">${e.status === 404 ? 'Không tìm thấy thiệp này.' : 'Mạng chập chờn, chưa tải được.'} <a class="btn" href="${e.status === 404 ? '/thiep-cua-toi' : location.href}">${e.status === 404 ? 'Về thiệp của tôi' : 'Tải lại trang'}</a></div>`;
    return;
  }
  savedData = JSON.stringify(card.data);
  let restored = false;
  if (card.guest) {
    try {
      const g = JSON.parse(localStorage.getItem(GKEY()) || 'null');
      if (g && g.data && JSON.stringify(g.data) !== savedData) {
        card.data = g.data; if (g.template) card.template = g.template; if (g.palette) card.palette = g.palette; if (g.title) card.title = g.title;
        restored = true;
      }
    } catch (e) { /* bản cất hỏng: bỏ qua */ }
  }
  bind();
  const sn = $('#smpNote'); if (sn) sn.querySelector('button').onclick = () => { try { sessionStorage.setItem('smpNoteOff', CARD_ID); } catch (e) { /* bỏ qua */ } sn.hidden = true; };  if (card.guest) $('.ebar .back').href = '/mau-thiep'; // chưa có "Thiệp của tôi" để quay về
  renderHeader();
  // ?tab=… (link cũ: info/events/look/resp…) mở thẳng bảng tương ứng; mặc định chỉ hiện thiệp
  const OLD = { events: 'date', look: 'tpl', resp: 'guests', info: null };
  const want = new URLSearchParams(location.search).get('tab');
  // máy tính: bảng "Thông tin" mở sẵn bên trái (khỏi phải đoán sửa ở đâu); điện thoại: chỉ hiện thiệp
  showTab(want && want !== 'date' ? (want in OLD ? OLD[want] : want) : null);
  // đổi cỡ cửa sổ qua lại máy tính / điện thoại: đổi bố cục theo
  document.body.classList.toggle('studio', studio());
  matchMedia('(min-width:761px)').addEventListener('change', () => { document.body.classList.toggle('studio', studio()); closeQe(); showTab(studio() ? 'studio' : null); });
  refreshPreview();
  status('Đã lưu ✓');
  if (restored) { save(); renderHeader(); } // dựng lại khung xem trước theo bản đã cất, đánh dấu "Chưa lưu"
  adoptSuggested(); // ảnh khách chọn ở trang gợi ý
  shareSoon(4000); // thiệp cũ chưa có ảnh xem trước khi gửi link → tạo ngầm
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
  }
})();
