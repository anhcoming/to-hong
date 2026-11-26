// Trình sửa màn hình LED: chỉnh hiệu ứng/tỉ lệ/cảnh, xem trước tức thì qua postMessage.
const CARD_ID = location.pathname.split('/').pop();
let card, META, led;
let saveTimer = null, saving = false, again = false, dataDirty = false, needReload = false;

const RATIO_INFO = {
  '16:9': ['Màn ngang 16:9', 'Phổ biến nhất, TV & LED sảnh'],
  '4:3': ['Màn ngang 4:3', 'Máy chiếu, màn đời cũ'],
  '9:16': ['Màn đứng 9:16', 'Cột LED đứng, standee'],
  '3:4': ['Khung dọc 3:4', 'Màn dọc cạnh lối vào'],
};

const getP = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const setP = (o, p, v) => { const ks = p.split('.'); let a = o; ks.slice(0, -1).forEach((k) => (a = a[k])); a[ks[ks.length - 1]] = v; };

// quản trị viên (/sua-led/<id>?admin=1 từ trang quản trị): sửa giúp khách cả màn đã chốt — sửa thẳng bản chụp lúc chốt, thiệp không đổi
const ADMIN = new URLSearchParams(location.search).get('admin') === '1';
function status(t) { $('#saved').textContent = (ADMIN ? 'Quản trị viên đang sửa · ' : '') + (card && card.guest && t === 'Đã lưu ✓' ? '' : card && card.led && card.led.final && !ADMIN && t === 'Đã lưu ✓' ? 'Đã chốt' : t); }
// trình sửa kiểu CapCut: cột icon chọn bảng
let curPanel = 'chu'; // mặc định bảng Nội dung (ô nhập), bảng Mẫu màn hình ở tab bên cạnh

// ---------- giao diện ----------
function renderSide() {
  const d = card.data;
  const fd = (k, label, type = 'text', ph = '') => `<label class="field"><span>${label}</span><input data-d="${k}" type="${type}" value="${esc(getP(d, k) || '')}" placeholder="${esc(ph)}"></label>`;
  const ratioBox = (r) => {
    const [w, h] = r.split(':').map(Number);
    const s = 16 / Math.max(w, h);
    return `<button class="opt ${led.ratio === r ? 'on' : ''}" data-set="ratio" data-v="${r}"><b><i class="ratio-ic" style="width:${Math.round(w * s)}px;height:${Math.round(h * s)}px"></i>${RATIO_INFO[r][0]}</b><span>${RATIO_INFO[r][1]}</span></button>`;
  };
  const range = (k, label, min, max, step, unit = '') => `<label class="range"><span>${label}</span><input type="range" data-l="${k}" min="${min}" max="${max}" step="${step}" value="${led[k]}"><output>${led[k]}${unit}</output></label>`;
  const chk = (k, label) => `<label class="check"><input type="checkbox" data-s="${k}" ${led.slides[k] ? 'checked' : ''}>${label}</label>`;

  const head = (t, dsc) => `<h2 class="phd">${t}</h2>${dsc ? `<p class="pdesc">${dsc}</p>` : ''}`;
  const next = (to, label) => `<div class="next"><button class="btn block" data-go="${to}">${label} →</button></div>`;
  // hai bảng: Nội dung (ô nhập) · Mẫu màn hình — chọn ở hàng tab trên cùng; khung màn là thanh nhỏ ngay trên khung xem trước
  if (curPanel !== 'hieu') curPanel = 'chu';
  $('#rbar').innerHTML = `<span>Khung màn</span>` + META.led.ratios.map((r) => {
    const [w, hh] = r.split(':').map(Number), s = 13 / Math.max(w, hh);
    return `<button class="${led.ratio === r ? 'on' : ''}" data-set="ratio" data-v="${r}" title="${esc(RATIO_INFO[r][0] + ' — ' + RATIO_INFO[r][1])}"><i style="width:${Math.round(w * s)}px;height:${Math.round(hh * s)}px"></i>${r}</button>`;
  }).join('');
  // đã kích hoạt: mẫu đã chốt → bỏ hẳn cột chọn mẫu, khung xem trước chiếm cả bề ngang
  const lay = $('#layout'), lockedNow = !ADMIN && !!card.led.paid; // quản trị viên: vẫn hiện cột sửa + chọn mẫu
  if (lay && lay.classList.contains('locked') !== lockedNow) { lay.classList.toggle('locked', lockedNow); requestAnimationFrame(() => { if (typeof fitScreen === 'function' && led) fitScreen(); }); }
  // đã chốt hẳn (trả tiền là chốt): ẩn mọi nút chỉnh — khung màn, ẩn / hiện cảnh, tốc độ; chỉ còn xem và chuyển cảnh
  if (lay && lay.classList.contains('final') !== ledFinal()) { lay.classList.toggle('final', ledFinal()); requestAnimationFrame(() => { if (typeof fitScreen === 'function' && led) fitScreen(); }); }
  let h = '';
  const tabs = `<div class="ptabs"><button data-go="chu" class="${curPanel === 'chu' ? 'on' : ''}">Nội dung</button><button data-go="hieu" class="${curPanel === 'hieu' ? 'on' : ''}">Mẫu màn hình</button></div>`;
  if (curPanel === 'hieu') h = tabs + `<section class="group">
      <div class="lmau">${(META.led.templates || []).map((t) => `<button class="lm ${led.palette === t.palette && led.effect === t.effect ? 'on' : ''}" data-tpl="${t.id}"><i style="background-image:url('/demo/lposter-${t.palette}-${t.effect}.jpg')"></i><b>${esc(t.name)}</b></button>`).join('')}</div>
    </section>`;
  else if (curPanel === 'chu') {
    // A · bảng nhập: điền vào ô → màn đổi ngay; bấm vào ô nào thì màn chuyển tới cảnh có chữ đó và đứng yên (data-sc)
    const fixed = !ADMIN && !!card.led.names; // đã kích hoạt: tên đôi cố định (quản trị viên vẫn sửa được)
    const f = (k, label, sc, ph = '', type = 'text') => `<label class="field"><span>${label}</span><input data-d="${k}" data-sc="${sc}" type="${type}" value="${esc(getP(d, k) || '')}" placeholder="${esc(ph)}"${fixed && /\.name$/.test(k) ? ' disabled' : ''}></label>`;
    h = tabs + `<p class="pdesc">Điền vào ô — màn bên cạnh đổi ngay, chỗ vừa đổi sáng viền hồng.</p>
      <section class="group cform">
        <p class="clab">Cỡ chữ</p>
        <div class="fsz"><b class="s">A</b><input type="range" data-fs min="60" max="140" step="5" value="${Math.round((typeof led.fs === 'number' ? led.fs : 1) * 100)}" aria-label="Cỡ chữ"><b class="l">A</b><output>${Math.round((typeof led.fs === 'number' ? led.fs : 1) * 100)}%</output></div>
        ${(META.led.fonts || []).length ? `<label class="field"><span>Kiểu chữ</span><select data-l="font">${META.led.fonts.map((x) => `<option value="${x.id}"${(led.font || '') === x.id ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>` : ''}
        ${(META.led.colors || []).length ? `<div class="field"><span>Màu chữ</span><div class="lcol">${META.led.colors.map((x) => `<button type="button" class="${(led.color || '') === x.id ? 'on' : ''}" data-color="${x.id}" title="${esc(x.name)}" aria-label="${esc(x.name)}">${x.id ? `<i style="background:${x.id}"></i>` : '<i class="auto">A</i>'}</button>`).join('')}</div></div>` : ''}
        <p class="clab">Tên đôi</p>
        <div class="grid2">${f('groom.name', 'Chú rể', 'names', 'Gia Huy')}${f('bride.name', 'Cô dâu', 'names', 'Bảo Ngọc')}</div>
        ${fixed ? '<p class="muted" style="font-size:12px;margin:-4px 0 8px">🔒 Đã kích hoạt: tên đôi cố định</p>' : ''}
        <label class="field"><span>Dòng tiêu đề</span><input data-l="kicker" data-sc="names" value="${esc(led.kicker)}" maxlength="40" placeholder="Lễ Thành Hôn / Lễ Vu Quy / Tiệc Cưới"></label>
        <p class="clab">Ngày giờ</p>
        <div class="grid2">${f('date', 'Ngày cưới', 'date', '', 'date')}${f('time', 'Giờ', 'date', '', 'time')}</div>
        <label class="field"><span>Dòng âm lịch</span><input data-l="lunar" data-sc="date" value="${esc(led.lunar || '')}" maxlength="80" placeholder="${esc(window.Lunar && d.date ? Lunar.lunarText(d.date) : 'Để trống: tự ghi theo ngày cưới')}"></label>
        <p class="clab">Bố mẹ hai bên</p>
        <div class="grid2">${f('groom.father', 'Bố chú rể', 'parents', 'Ông …')}${f('bride.father', 'Bố cô dâu', 'parents', 'Ông …')}${f('groom.mother', 'Mẹ chú rể', 'parents', 'Bà …')}${f('bride.mother', 'Mẹ cô dâu', 'parents', 'Bà …')}</div>
        <p class="clab">Lời cảm ơn</p>
        <label class="field"><textarea data-l="message" data-sc="msg" maxlength="200" rows="3">${esc(led.message)}</textarea></label>
        <p class="muted" style="font-size:12px;margin:4px 0 0">Tên, ngày, bố mẹ dùng chung với thiệp. Ô nào để trống thì cảnh đó tự ẩn.</p>
      </section>`;
  }
  else if (curPanel === 'anh') h = head('Ảnh cưới', 'Ảnh hiện ở cảnh "Ảnh cưới" trên màn LED (dùng chung ảnh bìa của thiệp).') + `<section class="group">
      <div style="display:flex;align-items:center;gap:12px">
        ${localCover ? `<div style="position:relative;width:96px;height:120px;border-radius:12px;background:center/cover url('${localCover}');display:grid;place-items:center"><i class="upspin"></i></div>`
          : d.cover ? `<div style="width:96px;height:120px;border-radius:12px;background:center/cover url('${esc(d.cover)}')"></div>` : ''}
        <label class="btn sm soft">${d.cover ? 'Đổi ảnh cưới' : 'Chọn ảnh cưới'}<input type="file" accept="image/*" id="coverIn" hidden></label>
      </div></section>` + next('man', 'Tiếp theo: Khung màn');
  else if (curPanel === 'man') h = head('Khung màn hình', 'Hỏi kỹ thuật nhà hàng màn LED ngang hay đứng để chọn đúng — không méo, không viền đen.') + `<section class="group"><div class="opts">${META.led.ratios.map(ratioBox).join('')}</div></section>`;
  else h = head('Trình chiếu', 'Gửi link cho kỹ thuật nhà hàng, mở trên máy nối với màn hình.') + `<section class="group">
      ${card.led.created && card.led.paid ? `<div style="display:grid;gap:8px;margin-bottom:14px"><a class="btn block" target="_blank" href="${esc(card.led.url)}">▶ Mở trình chiếu toàn màn hình</a><button class="btn block soft" id="copyGuide">Chép link + hướng dẫn gửi kỹ thuật</button></div>` : ''}
      <ol class="tips">
        <li>Mở link bằng Chrome hoặc Edge trên máy nối với màn hình.</li>
        <li>Bấm <b>F</b> hoặc nháy đúp chuột để chạy toàn màn hình.</li>
        <li>Phím ← → chuyển cảnh, phím cách để tạm dừng.</li>
        <li>Khung màn đã chọn: <b>${esc(led.ratio)}</b> — đổi ở thanh "Khung màn" trên khung xem trước nếu chưa khớp.</li>
      </ol></section>`;
  $('#side').innerHTML = h;
  const rt = $('#ratioTxt'); if (rt) rt.textContent = (RATIO_INFO[led.ratio] || [led.ratio])[0] + ' ·';
}

// thiệp chưa có tên đôi: khối "Thông tin" lên đầu cột tuỳ chỉnh, khỏi phải cuộn tìm (màn LED đang hiện "Chú rể & Cô dâu")
let infoTop = null; // quyết định một lần lúc mở trang, để khối không nhảy chỗ khi đang điền
function infoFirst() {
  if (infoTop === null) infoTop = !card.data.groom.name || !card.data.bride.name;
  const info = $('#info');
  if (infoTop && info) $('#side').prepend(info);
}
function renderHeader() {
  const s = card.led;
  $('#ttl').textContent = 'Màn hình LED'; // gọn: chỉ tên sản phẩm, nút bên phải
  backTo($('#back'), card.guest ? '/man-hinh-led-dam-cuoi' : '/thiep-cua-toi'); // không có trang trước: về Thiệp của tôi (nơi có danh sách Làm thêm: LED, video…)
  if (card.guest) {
    // chưa đăng nhập: sửa + xem trước thoải mái trên bản nháp; lấy link chiếu (xuất bản) mới cần tài khoản
    $('#chip').innerHTML = '<span class="dtag">Bản nháp</span>'; // chưa đăng nhập: bản nháp trên máy này
    $('#acts').innerHTML = s.created ? '<button class="btn sm" id="loginBtn">Lấy link chiếu</button>' : '';
    Object.assign($('#acts').style, { gridTemplateColumns: 'auto', justifyContent: 'center' }); // điện thoại: một nút, rộng vừa chữ, căn giữa
    const lb = $('#loginBtn'); if (lb) lb.onclick = askLogin;
    return;
  }
  $('#chip').innerHTML = !s.created ? '' : s.paid ? '<span class="chip ok">● Đã kích hoạt</span>'
    : '<span class="chip warn">Đang dùng thử</span>';
  // điện thoại: nhãn ngắn (lớp hide-xs / show-xs) để ba nút vừa một hàng
  // chưa kích hoạt: chỉ nút Kích hoạt; kích hoạt rồi mới hiện Chép link · Mở trình chiếu · Tải MP4
  $('#acts').innerHTML = s.created ? `${s.paid ? `<button class="btn sm soft" id="cpLink">Chép link</button><a class="btn sm plain" id="openLed" target="_blank" href="${esc(s.url)}"><span class="hide-xs">Mở trình chiếu</span><span class="show-xs">▶ Trình chiếu</span></a>` : ''}${s.paid ? '<button class="btn sm" id="mp4Btn">⬇ Tải MP4</button>' : `<button class="btn sm" id="payBtn">Kích hoạt<span class="hide-xs"> · ${money(META.ledPrice)}</span><span class="show-xs"> ${Math.round(META.ledPrice / 1000)}k</span></button>`}`
    : '';
  $('#acts').style.gridTemplateColumns = s.created && s.paid ? '1fr 1fr 1fr' : '';
  const mb = $('#mp4Btn'); if (mb) mb.onclick = mp4Dialog;
  const pb = $('#payBtn'); if (pb) pb.onclick = () => openPayModal(CARD_ID, reload, 'led');
  // chưa kích hoạt: link trình chiếu chưa mở được → bấm chép / mở link thì mời kích hoạt luôn
  const cp = $('#cpLink'); if (cp) cp.onclick = () => (pb ? pb.click() : copyText(s.url, 'Đã chép link màn LED'));
  const ol = $('#openLed'); if (ol && pb) ol.onclick = (e) => { e.preventDefault(); pb.click(); };
  // đã chốt hẳn: bố cục xem chi tiết dùng chung với video (public/js/final-view.js) — thẻ đem đi chiếu / gửi kỹ thuật
  if (ledFinal() && led) { // lần gọi đầu (chưa nạp cấu hình màn LED) bỏ qua, start() gọi lại
    const names = [card.data.groom.name, card.data.bride.name].filter(Boolean).join(' & ');
    const tp = (META.led.templates || []).find((t) => t.palette === led.palette && t.effect === led.effect);
    finalView({ kind: 'led', url: s.url, names, onMp4: mp4Dialog, support: META.support, stage: '#stagewrap',
      // thanh phát (phát / dừng, tua, thời gian, toàn màn hình) — khung xem trước tự chạy, thanh cảnh đã ẩn
      player: ledPlayer, onFull: ledFull,
      facts: [['📅', finalView.date(card.data.date)], ['⏰', finalView.time(card.data.time)], ['✨', tp ? tp.name : ''],
        ['🖥', (RATIO_INFO[led.ratio] || [led.ratio])[0]], ['⏱', `Mỗi cảnh ${led.seconds} giây`]], // số cảnh / độ dài: xem trên thanh phát (cảnh chưa có nội dung tự bỏ qua)
      guide: `Nhờ anh/chị bật màn hình LED cho tiệc cưới ${names}:\n${s.url}\n- Mở bằng Chrome/Edge, bấm phím F (hoặc nháy đúp) để toàn màn hình.\n- Tỉ lệ đã chọn: ${led ? led.ratio : ''}.` });
  } else finalView.off();
}

// thanh phát dưới khung xem (cả lúc đang sửa lẫn đã chốt): phát / dừng, tua theo cảnh, thời gian, toàn màn hình
function ledPlayer() {
  const w = $('#frame').contentWindow, p = w && w.__ledApi && w.__ledApi.play; if (!p) return null;
  const NAME = { names: 'Tên đôi', date: 'Ngày cưới', countdown: 'Đếm ngược', parents: 'Bố mẹ', msg: 'Lời cảm ơn', message: 'Lời cảm ơn', photo: 'Ảnh cưới' };
  return { ...p, chapters: () => p.keys().map((k, i) => ({ name: NAME[k] || 'Cảnh ' + (i + 1), t: i * p.seconds() })) };
}
function ledFull() { const f = $('#frame'); if (f.requestFullscreen) f.requestFullscreen().catch(() => {}); }
function fitScreen() {
  const [w, h] = led.ratio.split(':').map(Number);
  const wrap = $('#stagewrap'), box = wrap.getBoundingClientRect(), cs = getComputedStyle(wrap);
  // điện thoại: khung xem trước theo bề ngang, cao tối đa ~1/3 màn hình (phần tuỳ chỉnh bên dưới cuộn riêng)
  const phone = matchMedia('(max-width:900px)').matches;
  // máy tính: chừa đúng chỗ các thanh đang hiện quanh khung (thanh khung màn, thanh cảnh, thanh phát khi đã chốt…) —
  // trừ cứng một số px thì khung có thể cao hơn chỗ trống, bị ép thấp lại → lệch tỉ lệ, màn LED bên trong hiện viền đen hai bên
  const px = (v) => parseFloat(v) || 0;
  let used = px(cs.paddingTop) + px(cs.paddingBottom);
  [...wrap.children].forEach((c) => { if (c.id !== 'screen' && getComputedStyle(c).display !== 'none') used += c.offsetHeight + px(cs.rowGap); });
  const maxW = phone ? innerWidth - 22 : box.width - px(cs.paddingLeft) - px(cs.paddingRight);
  const maxH = phone ? innerHeight * (h > w ? 0.42 : 0.34) : box.height - used;
  const s = Math.max(0, Math.min(maxW / w, maxH / h));
  $('#screen').style.width = Math.floor(w * s) + 'px';
  $('#screen').style.height = Math.floor(h * s) + 'px';
}

let localCover = ''; // ảnh cưới vừa chọn, đang tải lên ngầm
function pushPreview() {
  const fr = $('#frame');
  const photo = localCover || card.data.cover || card.data.photos.find(Boolean) || ''; // ảnh đang tải: dùng ảnh trong máy
  if (fr.contentWindow) fr.contentWindow.postMessage({ type: 'led-config', led, card: { groom: card.data.groom, bride: card.data.bride, photo } }, location.origin);
}
function reloadPreview() { $('#frame').src = `/led/${card.slug}?preview=1&t=${Date.now()}`; }

// ---------- lưu ----------
// Trả tiền là chốt: màn LED đã kích hoạt không sửa gì nữa (máy chủ cũng từ chối) — báo khách, bỏ phần vừa chỉnh trên máy
let lockedAt = 0;
const isFinalNow = () => !!(card && card.led && card.led.final);
const ledFinal = () => !ADMIN && isFinalNow();
function useSnap() { if (isFinalNow() && card.ledConfig && card.ledConfig.snap) card.data = card.ledConfig.snap; } // hiện đúng dữ liệu lúc chốt
function lockedNote() {
  clearTimeout(saveTimer); saveTimer = null;
  if (Date.now() - lockedAt > 2500) { lockedAt = Date.now(); toast('Màn LED đã kích hoạt nên đã chốt — không sửa được nữa', true); }
  led = JSON.parse(JSON.stringify(card.ledConfig)); renderSide(); reloadPreview(); status('Đã chốt');
}
function schedule(delay = 600) {
  if (ledFinal()) return lockedNote();
  status('Đang chỉnh…');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, delay);
}
async function save() {
  if (saving) { again = true; return; }
  saving = true;
  status('Đang lưu…');
  const withData = dataDirty;
  dataDirty = false;
  try {
    const body = { led };
    if (withData) body[ADMIN && isFinalNow() ? 'snap' : 'data'] = card.data;
    const r = await api(`/api/cards/${CARD_ID}`, { method: 'PUT', body, quiet: true });
    card.led = r.card.led;
    card.slug = r.card.slug;
    status('Đã lưu ✓');
    renderHeader();
    if (withData && needReload) { needReload = false; reloadPreview(); } // đổi ngày: âm lịch, thứ do máy chủ tính lại
  } catch (e) {
    status('Lưu thất bại');
    toast(e.message, true);
  } finally {
    saving = false;
    if (again) { again = false; save(); }
  }
}

// ---------- khách chưa đăng nhập: bấm "Lấy link chiếu" → đăng nhập; xong quay lại đúng màn này (bản nháp về tài khoản) và mở luôn bước kích hoạt ----------
async function askLogin() {
  // chỉnh sửa chưa lưu phải nằm trên máy chủ trước khi mở đăng nhập (đăng nhập xong trang tải lại theo bản trên máy chủ)
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; await save(); }
  while (saving) await new Promise((ok) => setTimeout(ok, 100));
  openLogin({ next: location.pathname + '?xuat=1', sub: 'Đăng nhập để lưu màn LED vào tài khoản và lấy link gửi kỹ thuật nhà hàng — mẫu và chữ bạn vừa sửa được giữ nguyên.' });
}

let sceneKeys = [];
// đánh dấu chữ vừa đổi trên màn (viền hồng sáng lên rồi tắt dần)
function markText(key) { const fr = $('#frame') && $('#frame').contentWindow; if (fr) setTimeout(() => fr.postMessage({ type: 'led-mark', key }, location.origin), 60); }
function showScene(k) {
  const fr = $('#frame') && $('#frame').contentWindow, i = sceneKeys.indexOf(k); if (!fr || i < 0) return;
  fr.postMessage({ type: 'led-pause', paused: true }, location.origin);
  fr.postMessage({ type: 'led-goto', index: i }, location.origin);
} // các cảnh khung xem trước đang có (thanh cảnh cập nhật)
// ---------- tải MP4: dựng ngay trên máy (public/led/led-export.js chạy trong khung ẩn đúng kích thước gốc màn LED) ----------
function mp4Name() {
  const n = [card.data.groom.name, card.data.bride.name].filter(Boolean).join('-') || 'man-hinh-led';
  return 'led-' + (n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'cuoi') + '.mp4';
}
function mp4Dialog() {
  if (!window.VideoEncoder) return toast('Trình duyệt này chưa xuất được video — mở bằng Chrome hoặc Edge trên máy tính nhé', true);
  const cycle = (sceneKeys.filter((k) => k !== 'countdown').length || 1) * led.seconds;
  const rep5 = Math.max(2, Math.round(300 / cycle));
  openModal(`<h2 style="margin-top:0">Tải màn LED dạng MP4</h2>
    <p class="muted" style="margin:0 0 14px">Video Full HD dựng ngay trên máy bạn — chép vào USB cắm thẳng màn LED / TV, không cần mạng.</p>
    <div style="display:grid;gap:8px">
      <label class="check"><input type="radio" name="mlen" value="1" checked><span><b>Một vòng · ${cycle} giây</b><br><small class="muted">Bật “lặp lại” trên TV / màn LED</small></span></label>
      <label class="check"><input type="radio" name="mlen" value="${rep5}"><span><b>Khoảng ${Math.round(rep5 * cycle / 60)} phút</b><br><small class="muted">Lặp sẵn ${rep5} vòng, file nặng hơn</small></span></label>
    </div>
    ${sceneKeys.includes('countdown') ? '<p class="muted" style="font-size:13px;margin:12px 0 0">Cảnh Đếm ngược không có trong MP4 (số chạy theo giờ thật).</p>' : ''}
    <div style="display:flex;justify-content:center;margin-top:18px"><button class="btn" id="mp4Go">Bắt đầu dựng</button></div>`, (box, close) => {
    $('#mp4Go', box).onclick = () => { const loops = +$('input[name=mlen]:checked', box).value; close(); exportLedMp4(loops); };
  });
}
async function exportLedMp4(loops) {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; await save(); }
  while (saving) await new Promise((ok) => setTimeout(ok, 100));
  let closeModal, fr;
  openModal(`<h2>Đang dựng video…</h2><p class="muted" style="margin:0">Dựng ngay trên máy bạn, giữ trang này mở nhé.</p><div class="bar"><i id="pg"></i></div><p class="muted" id="pgText" style="font-size:13px;margin:0">Chuẩn bị…</p>`, (box, close) => { closeModal = close; });
  try {
    const [w, h] = led.ratio.split(':').map(Number), W = w > h ? 1920 : Math.round(1920 * w / h), H = w > h ? Math.round(1920 * h / w) : 1920;
    fr = document.createElement('iframe');
    fr.setAttribute('aria-hidden', 'true'); fr.tabIndex = -1;
    fr.style.cssText = `position:fixed;left:-20000px;top:0;width:${W}px;height:${H}px;border:0;pointer-events:none`;
    fr.src = `/led/${card.slug}?preview=1&xuat=${Date.now()}`;
    document.body.appendChild(fr);
    await new Promise((ok, fail) => { fr.onload = ok; fr.onerror = () => fail(new Error('Không mở được màn LED')); });
    const fw = fr.contentWindow;
    for (let i = 0; i < 100 && !fw.__ledApi; i++) await new Promise((ok) => setTimeout(ok, 100));
    if (!fw.__ledApi) throw new Error('Không mở được màn LED để dựng video');
    await new Promise((ok, fail) => { const sc = fw.document.createElement('script'); sc.src = '/led/led-export.js?v=' + Date.now(); sc.onload = ok; sc.onerror = () => fail(new Error('Không tải được bộ dựng video')); fw.document.head.appendChild(sc); });
    const r = await fw.ledExportMp4({ loops, onProgress: (p, label) => { const g = $('#pg'), t = $('#pgText'); if (g) g.style.width = Math.round(p * 100) + '%'; if (t) t.textContent = `${label}… ${Math.round(p * 100)}%`; } });
    const url = URL.createObjectURL(r.blob);
    const a = document.createElement('a'); a.href = url; a.download = mp4Name(); document.body.appendChild(a); a.click(); a.remove();
    closeModal();
    toast(`Đã tải MP4 về máy (${(r.blob.size / 1e6).toFixed(1)} MB) — chép vào USB để cắm màn LED / TV`); // chỉ báo, không mở popup
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (e) {
    if (closeModal) closeModal();
    toast(e.message || 'Dựng video lỗi', true);
  } finally {
    if (fr) fr.remove();
  }
}

async function reload() {
  const r = await api(`/api/cards/${CARD_ID}`);
  const wasPaid = card.led && card.led.paid;
  card = r.card;
  useSnap();
  renderHeader();
  if (card.led.paid && !wasPaid) { renderSide(); reloadPreview(); } // vừa kích hoạt: khung xem trước bỏ dòng "Bản dùng thử", tên cố định
}

// ---------- sự kiện ----------
function bind() {
  const side = $('#side');
  $('#rail').addEventListener('click', (e) => { const b = e.target.closest('[data-panel]'); if (!b) return; curPanel = b.dataset.panel; renderSide(); });
  $('#rbar').addEventListener('click', (e) => {
    const b = e.target.closest('[data-set]'); if (!b) return;
    led.ratio = b.dataset.v; renderSide(); fitScreen(); pushPreview(); schedule(300);
  });
  side.addEventListener('click', (e) => {
    const g = e.target.closest('[data-go]'); if (g) { curPanel = g.dataset.go; return renderSide(); }

    const cb = e.target.closest('[data-color]');
    if (cb) { led.color = cb.dataset.color; renderSide(); pushPreview(); return schedule(300); }
    const tp = e.target.closest('[data-tpl]');
    if (tp) { const t = META.led.templates.find((x) => x.id === tp.dataset.tpl); led.palette = t.palette; led.effect = t.effect; led.slides.photo = false; renderSide(); pushPreview(); return schedule(300); }
    const b = e.target.closest('[data-set]');
    if (b) {
      led[b.dataset.set] = b.dataset.v;
      renderSide();
      if (b.dataset.set === 'ratio') fitScreen();
      pushPreview();
      schedule(300);
      return;
    }
    if (e.target.id === 'copyGuide') {
      copyText(`Nhờ anh/chị bật màn hình LED cho tiệc cưới ${card.data.groom.name} & ${card.data.bride.name}:\n${card.led.url}\n- Mở bằng Chrome/Edge, bấm phím F (hoặc nháy đúp) để toàn màn hình.\n- Tỉ lệ đã chọn: ${led.ratio}.`, 'Đã chép — dán gửi kỹ thuật qua Zalo nhé');
    }
  });
  side.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.fs !== undefined) { // cỡ chữ toàn màn (thanh trượt A — A)
      led.fs = Number(t.value) / 100; t.parentNode.querySelector('output').textContent = t.value + '%';
      pushPreview(); return schedule(400);
    }
    if (t.dataset.l) {
      const k = t.dataset.l;
      led[k] = t.type === 'checkbox' ? t.checked : t.type === 'range' ? Number(t.value) : t.value;
      if (t.type === 'range') t.nextElementSibling.textContent = t.value + (k === 'seconds' ? 's' : '×');
      pushPreview();
      schedule(t.type === 'range' ? 500 : 700);
    } else if (t.dataset.s) {
      led.slides[t.dataset.s] = t.checked;
      pushPreview();
      schedule(300);
    } else if (t.dataset.d) {
      setP(card.data, t.dataset.d, t.value);
      dataDirty = true;
      if (/^(date|time)$/.test(t.dataset.d)) needReload = true; // âm lịch, thứ do máy chủ tính lại
      else pushPreview();
      if (/\.name$/.test(t.dataset.d)) renderHeader();
      schedule(/^(date|time)$/.test(t.dataset.d) ? 500 : 900);
    }
  });
  // bấm vào ô nhập → màn chuyển tới cảnh có chữ đó và đứng yên
  side.addEventListener('focusin', (e) => { const k = e.target.dataset && e.target.dataset.sc; if (k) { showScene(k); setTimeout(() => markText(e.target.dataset.d || 'led.' + e.target.dataset.l), 250); } });
  // gõ vào ô của cảnh chưa có (vd. bố mẹ còn trống → cảnh chưa hiện): cảnh vừa xuất hiện thì chuyển tới luôn
  let scT = null;
  side.addEventListener('input', (e) => { const k = e.target.dataset && e.target.dataset.sc; if (!k) return; clearTimeout(scT); scT = setTimeout(() => { showScene(k); markText(e.target.dataset.d || 'led.' + e.target.dataset.l); }, 300); });
  // rời khỏi ô nhập (không sang ô khác): màn chạy tiếp các cảnh
  side.addEventListener('focusout', () => setTimeout(() => { const a = document.activeElement; if (!(a && a.closest && a.closest('#side [data-sc]'))) { const fr = $('#frame').contentWindow; if (fr) fr.postMessage({ type: 'led-pause', paused: false }, location.origin); } }, 0));
  // ảnh cưới: hiện ngay ảnh trong máy (ô nhỏ + màn xem trước), tải lên + lưu ngầm, không che màn hình
  side.addEventListener('change', async (e) => {
    if (e.target.id !== 'coverIn' || !e.target.files[0]) return;
    const f = e.target.files[0];
    let local = '';
    status('Đang tải ảnh lên…');
    try {
      const small = await resizeImage(f);
      local = localCover = URL.createObjectURL(small);
      renderSide(); pushPreview();
      const url = await uploadFile(small, { quiet: true, resized: true });
      await new Promise((ok) => { const im = new Image(); im.onload = im.onerror = ok; im.src = url; setTimeout(ok, 8000); });
      if (localCover !== local) return; // đã chọn ảnh khác trong lúc chờ
      card.data.cover = url;
      localCover = '';
      dataDirty = true;
      renderSide();
      save();
    } catch (err) {
      if (local && localCover !== local) return;
      localCover = '';
      renderSide(); pushPreview();
      toast(err.message, true); status('Tải ảnh thất bại');
    } finally { if (local) setTimeout(() => URL.revokeObjectURL(local), 60000); }
  });
  window.addEventListener('resize', fitScreen);
  // ---------- sửa chữ trên màn (khung xem trước báo lên) ----------
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data) return;
    const m = e.data;
    if (m.type === 'led-text') {
      if (m.key === 'led.kicker') led.kicker = m.value.slice(0, 40);
      else if (m.key === 'led.message') led.message = m.value.slice(0, 200);
      else if (!ADMIN && card.led.names && /^(groom|bride)\.name$/.test(m.key)) return; // đã kích hoạt: tên đôi cố định
      else { setP(card.data, m.key, m.value); dataDirty = true; if (/\.name$/.test(m.key)) renderHeader(); }
      schedule(700);
    }
    if (m.type === 'led-text-done') pushPreview();
    if (m.type === 'led-size') { led.sz = { ...(led.sz || {}), [m.key]: m.value }; schedule(500); } // nút A− / A+ trên màn xem trước
    if (m.type === 'led-date') datePop();
    if (m.type === 'led-edit') editPop(m.key, m.rect);
  });
  // ---------- thanh cảnh: bấm để xem, ✕ / ＋ để ẩn / hiện cảnh, tốc độ ở cuối thanh ----------
  const SC = [['names', 'names', 'Tên đôi'], ['date', 'date', 'Ngày cưới'], ['countdown', 'countdown', 'Đếm ngược'], ['parents', 'parents', 'Bố mẹ'], ['msg', 'message', 'Lời cảm ơn']];
  let scKey = '', lastScene = { keys: [], index: -1 };
  const drawScenes = (m) => {
    lastScene = m; sceneKeys = m.keys;
    const list = $('#scList'), key = m.keys.join() + '|' + SC.map(([, sk]) => +!!led.slides[sk]).join('') + '|' + led.seconds;
    if (key !== scKey) {
      scKey = key;
      list.innerHTML = SC.map(([k, sk, name]) => { const on = !!led.slides[sk], i = m.keys.indexOf(k);
        return `<button class="sc${on ? '' : ' off'}" data-i="${i}" data-sk="${sk}" title="${on ? (i < 0 ? 'Chưa có nội dung để hiện cảnh này' : 'Xem cảnh này') : 'Đang ẩn — bấm để hiện'}"><span>${name}</span><em></em><b data-tg="${sk}" title="${on ? 'Ẩn cảnh này' : 'Hiện cảnh này'}">${on ? '✕' : '＋'}</b></button>`; }).join('')
        + `<label class="scspd" title="Mỗi cảnh hiện bao lâu rồi chuyển sang cảnh tiếp theo"><span>Mỗi cảnh</span><input type="range" data-spd min="4" max="30" step="1" value="${led.seconds}"><output>${led.seconds} giây</output></label>`;
    }
    list.querySelectorAll('.sc').forEach((b) => {
      const on = +b.dataset.i === m.index && !b.classList.contains('off'), em = b.querySelector('em');
      if (on && !b.classList.contains('on')) { em.style.animationDuration = m.seconds + 's'; b.classList.add('on'); b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
      else if (!on && b.classList.contains('on')) { b.classList.remove('on'); em.style.animation = 'none'; void em.offsetWidth; em.style.animation = ''; }
    });
    $('#scenes').classList.toggle('paused', !!m.paused);
    $('#scPause').textContent = m.paused ? '▶' : '❚❚';
  };
  window.addEventListener('message', (e) => { if (e.origin === location.origin && e.data && e.data.type === 'led-scene') drawScenes(e.data); });
  $('#scenes').addEventListener('input', (e) => {
    if (e.target.dataset.spd === undefined) return;
    led.seconds = +e.target.value; e.target.nextElementSibling.textContent = led.seconds + ' giây';
    pushPreview(); schedule(500);
  });
  $('#scenes').addEventListener('click', (e) => {
    const fr = $('#frame').contentWindow; if (!fr) return;
    const tg = e.target.closest('[data-tg]'), b = e.target.closest('.sc'), c = e.target.closest('[data-sc]');
    if (tg || (b && b.classList.contains('off'))) { // ẩn / hiện cảnh
      const sk = (tg || b).dataset.tg || b.dataset.sk;
      led.slides[sk] = !led.slides[sk];
      if (!Object.keys(led.slides).some((k) => k !== 'photo' && led.slides[k])) { led.slides[sk] = true; return toast('Màn LED cần ít nhất một cảnh'); }
      scKey = ''; pushPreview(); schedule(300);
      return;
    }
    const cur = lastScene.index;
    if (b) { if (+b.dataset.i >= 0) fr.postMessage({ type: 'led-goto', index: +b.dataset.i }, location.origin); else toast('Cảnh này chưa có nội dung để hiện (bấm chữ trên màn để thêm)'); }
    else if (c && c.dataset.sc === 'pause') fr.postMessage({ type: 'led-pause', paused: !$('#scenes').classList.contains('paused') }, location.origin);
    else if (c) fr.postMessage({ type: 'led-goto', index: cur + (c.dataset.sc === 'next' ? 1 : -1) }, location.origin);
  });
  document.addEventListener('mousedown', (e) => { const p = $('#datePop'); if (p && !p.contains(e.target)) p.remove(); });
}

// C · bấm chữ trên màn → hộp nhập nổi ngay cạnh dòng chữ đó (gõ như ô nhập bình thường), màn đứng yên trong lúc sửa
const EDIT_LABEL = { 'groom.name': 'Tên chú rể', 'bride.name': 'Tên cô dâu', 'led.kicker': 'Dòng tiêu đề', 'led.message': 'Lời cảm ơn',
  'groom.father': 'Bố chú rể', 'groom.mother': 'Mẹ chú rể', 'bride.father': 'Bố cô dâu', 'bride.mother': 'Mẹ cô dâu', 'groom.address': 'Địa chỉ nhà trai', 'bride.address': 'Địa chỉ nhà gái' };
function editPop(key, rect) {
  const old = $('#ledPop'); if (old) old.remove();
  const isLed = /^led\./.test(key), lk = key.slice(4), long = key === 'led.message';
  const val = isLed ? led[lk] || '' : getP(card.data, key) || '';
  const p = document.createElement('div');
  p.id = 'ledPop'; p.className = 'ledpop';
  p.innerHTML = `<label class="field"><span>${esc(EDIT_LABEL[key] || 'Chữ trên màn')}</span>${long ? `<textarea id="lpIn" rows="3" maxlength="200">${esc(val)}</textarea>` : `<input id="lpIn" value="${esc(val)}" maxlength="${isLed ? 40 : 80}">`}</label><div class="row"><button class="btn sm" id="lpOk">Xong</button></div>`;
  document.body.appendChild(p);
  const fr = $('#frame').getBoundingClientRect();
  const x = fr.left + rect.left + rect.width / 2, below = fr.top + rect.top + rect.height + 10;
  p.style.left = Math.round(Math.max(8, Math.min(innerWidth - p.offsetWidth - 8, x - p.offsetWidth / 2))) + 'px';
  p.style.top = Math.round(below + p.offsetHeight < innerHeight - 8 ? below : Math.max(8, fr.top + rect.top - p.offsetHeight - 10)) + 'px';
  const inp = $('#lpIn', p); inp.focus(); inp.select();
  inp.addEventListener('input', () => {
    const v = inp.value;
    if (isLed) led[lk] = v.slice(0, lk === 'kicker' ? 40 : 200);
    else { setP(card.data, key, v); dataDirty = true; if (/\.name$/.test(key)) renderHeader(); }
    pushPreview(); schedule(700); markText(key);
    const sf = $(`#side [data-d="${key}"], #side [data-l="${lk}"]`); if (sf && sf !== inp) sf.value = v; // ô bên bảng Nội dung đổi theo
  });
  const close = () => { p.remove(); document.removeEventListener('mousedown', out, true); };
  const out = (e) => { if (!p.contains(e.target)) close(); };
  setTimeout(() => document.addEventListener('mousedown', out, true), 0);
  inp.addEventListener('keydown', (e) => { if ((e.key === 'Enter' && !long) || e.key === 'Escape') { e.preventDefault(); close(); } });
  $('#lpOk', p).onclick = close;
}
function datePop() {
  const old = $('#datePop'); if (old) old.remove();
  const d = card.data, r = $('#screen').getBoundingClientRect();
  const p = document.createElement('div');
  p.id = 'datePop'; p.className = 'datepop';
  p.innerHTML = `<b>Ngày giờ cưới</b><div class="grid2"><label class="field"><span>Ngày</span><input type="date" id="dpD" value="${esc(d.date || '')}"></label><label class="field"><span>Giờ</span><input type="time" id="dpT" value="${esc(d.time || '')}"></label></div><p class="muted" style="font-size:12px;margin:0">Dùng chung với thiệp. Ngày âm lịch tự tính.</p>`;
  document.body.appendChild(p);
  // ngay dưới khung xem trước (không che chữ ngày và thanh cỡ chữ đang hiện trên màn)
  p.style.left = Math.round(Math.max(8, Math.min(innerWidth - 308, r.left + r.width / 2 - 150))) + 'px';
  p.style.top = Math.round(Math.min(innerHeight - p.offsetHeight - 8, r.bottom + 10)) + 'px';
  const set = () => { d.date = $('#dpD', p).value; d.time = $('#dpT', p).value; dataDirty = true; needReload = true; schedule(400); };
  $('#dpD', p).addEventListener('change', set); $('#dpT', p).addEventListener('change', set);
}

function start() {
  $('#introBox').innerHTML = '';
  $('#layout').hidden = false;
  if (led.slides.photo) { led.slides.photo = false; setTimeout(() => { pushPreview(); schedule(300); }, 0); } // màn LED chỉ còn mẫu có sẵn + chữ, không chiếu ảnh
  renderSide();
  renderHeader();
  bind();
  finalView.player({ stage: '#stagewrap', player: ledPlayer, onFull: ledFull });
  fitScreen();
  reloadPreview();
  status('Đã lưu ✓');
}

(async () => {
  try {
    const [meta, r] = await Promise.all([fetch('/api/meta').then((x) => x.json()), api(`/api/cards/${CARD_ID}`)]);
    META = meta;
    card = r.card;
    useSnap();
    document.title = 'Màn hình LED — ' + meta.brand;
  } catch (e) {
    const nf = e.status === 404;
    $('#ttl').textContent = nf ? 'Không tìm thấy thiệp' : 'Chưa tải được';
    $('#introBox').innerHTML = `<div class="pageload bad">${nf ? 'Không tìm thấy thiệp này.' : 'Mạng chập chờn, chưa tải được.'} <a class="btn" href="${nf ? '/thiep-cua-toi' : location.href}">${nf ? 'Về thiệp của tôi' : 'Tải lại trang'}</a></div>`;
    return;
  }
  renderHeader();
  if (card.ledConfig) {
    led = card.ledConfig;
    // đã có màn LED mà bấm "Dùng mẫu" ở trang giới thiệu (/tao-led?palette=…&effect=…): đổi sang mẫu vừa chọn, chữ giữ nguyên
    const q = new URLSearchParams(location.search), t = (META.led.templates || []).find((x) => x.palette === q.get('palette') && x.effect === q.get('effect'));
    if (q.get('palette') || q.get('tao')) history.replaceState(null, '', location.pathname + (q.get('xuat') ? '?xuat=1' : ''));
    const picked = t && (ADMIN || !card.led.paid) && (t.palette !== led.palette || t.effect !== led.effect); // đã kích hoạt: mẫu chốt, không đổi
    if (picked) { led.palette = t.palette; led.effect = t.effect; await save(); } // lưu trước để khung xem trước mở đúng mẫu
    start();
    // vừa đăng nhập từ nút "Lấy link chiếu": mở luôn bước kích hoạt để lấy link
    if (new URLSearchParams(location.search).get('xuat')) {
      history.replaceState(null, '', location.pathname);
      const pb = $('#payBtn'); if (pb) pb.click();
    }
    return;
  }
  // chưa có màn LED: giới thiệu + bắt đầu dùng thử
  $('#introBox').innerHTML = `<div class="intro panel">
    <p style="font-size:44px;margin:0">✨</p>
    <h2 style="font-family:var(--serif);margin:8px 0">Màn hình LED cho tiệc cưới</h2>
    <p class="muted">Trình chiếu tên cô dâu chú rể, ngày cưới (kèm âm lịch), bố mẹ hai bên và lời cảm ơn trên nền hiệu ứng trời sao, đom đóm, cánh hoa… Chỉ cần gửi link cho kỹ thuật nhà hàng.</p>
    <p class="muted" style="font-size:14px">Tạo và xem trước miễn phí · Kích hoạt ${money(META.ledPrice)} để trình chiếu ở tiệc cưới, không có dòng "Bản dùng thử".</p>
    <button class="btn lg" id="startBtn">Tạo màn LED từ thiệp này</button>
    <p style="margin:14px 0 0"><a href="/led/demo" target="_blank">Xem màn mẫu ↗</a></p>
  </div>`;
  $('#startBtn').onclick = async () => {
    try {
      // mẫu chọn ở trang chủ (?palette=…&effect=…): máy chủ tự bỏ giá trị lạ, về mặc định
      const q = new URLSearchParams(location.search), pick = {};
      if (q.get('palette')) pick.palette = q.get('palette');
      if (q.get('effect')) pick.effect = q.get('effect');
      if (q.get('palette') || q.get('tao')) history.replaceState(null, '', location.pathname);
      const r = await api(`/api/cards/${CARD_ID}`, { method: 'PUT', body: { led: pick } });
      card = r.card;
      led = card.ledConfig;
      start();
    } catch (e) { toast(e.message, true); }
  };
  // đến từ nút "Tạo màn LED" (/tao-led): bật luôn, không dừng ở màn giới thiệu
  if (new URLSearchParams(location.search).get('tao')) $('#startBtn').click();
})();

// bấm Kích hoạt mà thiếu tên / ngày cưới (pay.js): về bảng Nội dung để hiện chữ đỏ dưới ô thiếu
window.onPayMissing = () => { if (curPanel !== 'chu') { curPanel = 'chu'; renderSide(); } };
