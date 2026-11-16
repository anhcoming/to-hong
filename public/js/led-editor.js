// Trình sửa màn hình LED: chỉnh hiệu ứng/tỉ lệ/cảnh, xem trước tức thì qua postMessage.
const CARD_ID = location.pathname.split('/').pop();
let card, META, led;
let saveTimer = null, saving = false, again = false, dataDirty = false;

const RATIO_INFO = {
  '16:9': ['Màn ngang 16:9', 'Phổ biến nhất, TV & LED sảnh'],
  '4:3': ['Màn ngang 4:3', 'Máy chiếu, màn đời cũ'],
  '9:16': ['Màn đứng 9:16', 'Cột LED đứng, standee'],
  '3:4': ['Khung dọc 3:4', 'Màn dọc cạnh lối vào'],
};

const getP = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const setP = (o, p, v) => { const ks = p.split('.'); let a = o; ks.slice(0, -1).forEach((k) => (a = a[k])); a[ks[ks.length - 1]] = v; };

function status(t) { $('#saved').textContent = t; }
// trình sửa kiểu CapCut: cột icon chọn bảng
let curPanel = 'hieu';

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
  $$('#rail [data-panel]').forEach((b) => b.classList.toggle('on', b.dataset.panel === curPanel));
  let h = '';
  if (curPanel === 'hieu') h = head('Mẫu màn hình', 'Chọn một mẫu có sẵn — chữ sửa ở bảng Nội dung.') + `<section class="group">
      <div class="lmau">${(META.led.templates || []).map((t) => `<button class="lm ${led.palette === t.palette && led.effect === t.effect ? 'on' : ''}" data-tpl="${t.id}"><i style="background-image:url('/demo/lposter-${t.palette}-${t.effect}.jpg')"></i><b>${esc(t.name)}</b></button>`).join('')}</div>
    </section>` + next('chu', 'Tiếp theo: Nội dung');
  else if (curPanel === 'chu') h = head('Nội dung', 'Tên, ngày, bố mẹ dùng chung với thiệp. Chọn các cảnh sẽ lần lượt hiện trên màn.') + `<section class="group">
      <div class="grid2">${fd('groom.name', 'Chú rể', 'text', 'Gia Huy')}${fd('bride.name', 'Cô dâu', 'text', 'Bảo Ngọc')}${fd('date', 'Ngày cưới', 'date')}${fd('time', 'Giờ', 'time')}
      ${fd('groom.father', 'Bố chú rể')}${fd('groom.mother', 'Mẹ chú rể')}${fd('bride.father', 'Bố cô dâu')}${fd('bride.mother', 'Mẹ cô dâu')}</div>
      <label class="field"><span>Dòng tiêu đề</span><input data-l="kicker" value="${esc(led.kicker)}" maxlength="40" placeholder="Lễ Thành Hôn / Lễ Vu Quy / Tiệc Cưới"></label>
      <label class="field"><span>Lời cảm ơn</span><textarea data-l="message" maxlength="200" rows="3">${esc(led.message)}</textarea></label>
      <h3 style="margin:16px 0 10px">Các cảnh trình chiếu</h3>
      <div class="checks">${chk('names', 'Tên cô dâu chú rể')}${chk('date', 'Ngày cưới + âm lịch')}${chk('countdown', 'Đếm ngược tới giờ lễ')}${chk('parents', 'Bố mẹ hai bên')}${chk('message', 'Lời cảm ơn')}<label class="check"><input type="checkbox" data-l="hy" ${led.hy ? 'checked' : ''}>Chữ Hỷ 囍</label></div>
      ${range('seconds', 'Mỗi cảnh', 4, 30, 1, 's')}
    </section>` + next('man', 'Tiếp theo: Khung màn');
  else if (curPanel === 'anh') h = head('Ảnh cưới', 'Ảnh hiện ở cảnh "Ảnh cưới" trên màn LED (dùng chung ảnh bìa của thiệp).') + `<section class="group">
      <div style="display:flex;align-items:center;gap:12px">
        ${localCover ? `<div style="position:relative;width:96px;height:120px;border-radius:12px;background:center/cover url('${localCover}');display:grid;place-items:center"><i class="upspin"></i></div>`
          : d.cover ? `<div style="width:96px;height:120px;border-radius:12px;background:center/cover url('${esc(d.cover)}')"></div>` : ''}
        <label class="btn sm soft">${d.cover ? 'Đổi ảnh cưới' : 'Chọn ảnh cưới'}<input type="file" accept="image/*" id="coverIn" hidden></label>
      </div></section>` + next('man', 'Tiếp theo: Khung màn');
  else if (curPanel === 'man') h = head('Khung màn hình', 'Hỏi kỹ thuật nhà hàng màn LED ngang hay đứng để chọn đúng — không méo, không viền đen.') + `<section class="group"><div class="opts">${META.led.ratios.map(ratioBox).join('')}</div></section>` + next('chieu', 'Tiếp theo: Trình chiếu');
  else h = head('Trình chiếu', 'Gửi link cho kỹ thuật nhà hàng, mở trên máy nối với màn hình.') + `<section class="group">
      ${card.led.created ? `<div style="display:grid;gap:8px;margin-bottom:14px"><a class="btn block" target="_blank" href="${esc(card.led.url)}">▶ Mở trình chiếu toàn màn hình</a><button class="btn block soft" id="copyGuide">Chép link + hướng dẫn gửi kỹ thuật</button></div>` : ''}
      <ol class="tips">
        <li>Mở link bằng Chrome hoặc Edge trên máy nối với màn hình.</li>
        <li>Bấm <b>F</b> hoặc nháy đúp chuột để chạy toàn màn hình.</li>
        <li>Phím ← → chuyển cảnh, phím cách để tạm dừng.</li>
        <li>Khung màn đã chọn: <b>${esc(led.ratio)}</b> — đổi ở bảng "Khung màn" nếu chưa khớp.</li>
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
  $('#ttl').textContent = 'Màn hình LED · ' + ([card.data.groom.name, card.data.bride.name].filter(Boolean).join(' & ') || card.title);
  backTo($('#back'), '/sua/' + CARD_ID);
  $('#chip').innerHTML = !s.created ? '' : s.paid ? '<span class="chip ok">● Đã kích hoạt</span>'
    : s.expired ? '<span class="chip red">Hết hạn dùng thử</span>'
    : `<span class="chip warn">Dùng thử · còn ${Math.max(0, Math.ceil((s.trialEndsAt - Date.now()) / 864e5))} ngày</span>`;
  // điện thoại: nhãn ngắn (lớp hide-xs / show-xs) để ba nút vừa một hàng
  $('#acts').innerHTML = s.created ? `<button class="btn sm soft" id="cpLink">Chép link</button><a class="btn sm plain" target="_blank" href="${esc(s.url)}"><span class="hide-xs">Mở trình chiếu</span><span class="show-xs">▶ Trình chiếu</span></a>${s.paid ? '' : card.credits && card.credits.led > 0 ? '<button class="btn sm" id="payBtn">🎁 Dùng lượt Trọn bộ</button>' : `<button class="btn sm" id="payBtn">Kích hoạt<span class="hide-xs"> · ${money(META.ledPrice)}</span><span class="show-xs"> ${Math.round(META.ledPrice / 1000)}k</span></button>`}`
    : '';
  $('#acts').style.gridTemplateColumns = s.created && s.paid ? '1fr 1fr' : '';
  const cp = $('#cpLink'); if (cp) cp.onclick = () => copyText(s.url, 'Đã chép link màn LED');
  const pb = $('#payBtn'); if (pb) pb.onclick = () => openPayModal(CARD_ID, reload, 'led');
}

function fitScreen() {
  const [w, h] = led.ratio.split(':').map(Number);
  const box = $('#stagewrap').getBoundingClientRect();
  // điện thoại: khung xem trước theo bề ngang, cao tối đa ~1/3 màn hình (phần tuỳ chỉnh bên dưới cuộn riêng)
  const phone = matchMedia('(max-width:900px)').matches;
  const maxW = phone ? innerWidth - 22 : box.width - 48, maxH = phone ? innerHeight * (h > w ? 0.42 : 0.34) : box.height - 110;
  const s = Math.min(maxW / w, maxH / h);
  $('#screen').style.width = Math.round(w * s) + 'px';
  $('#screen').style.height = Math.round(h * s) + 'px';
}

let localCover = ''; // ảnh cưới vừa chọn, đang tải lên ngầm
function pushPreview() {
  const fr = $('#frame');
  const photo = localCover || card.data.cover || card.data.photos.find(Boolean) || ''; // ảnh đang tải: dùng ảnh trong máy
  if (fr.contentWindow) fr.contentWindow.postMessage({ type: 'led-config', led, card: { groom: card.data.groom, bride: card.data.bride, photo } }, location.origin);
}
function reloadPreview() { $('#frame').src = `/led/${card.slug}?preview=1&t=${Date.now()}`; }

// ---------- lưu ----------
function schedule(delay = 600) {
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
    if (withData) body.data = card.data;
    const r = await api(`/api/cards/${CARD_ID}`, { method: 'PUT', body, quiet: true });
    card.led = r.card.led;
    card.slug = r.card.slug;
    status('Đã lưu ✓');
    renderHeader();
    if (withData) reloadPreview(); // ngày âm lịch, bố mẹ… do máy chủ tính lại
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
}

// ---------- sự kiện ----------
function bind() {
  const side = $('#side');
  $('#rail').addEventListener('click', (e) => { const b = e.target.closest('[data-panel]'); if (!b) return; curPanel = b.dataset.panel; renderSide(); });
  side.addEventListener('click', (e) => {
    const g = e.target.closest('[data-go]'); if (g) { curPanel = g.dataset.go; return renderSide(); }
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
      if (/\.name$/.test(t.dataset.d)) { pushPreview(); renderHeader(); }
      schedule(900);
    }
  });
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
  // thanh chuyển cảnh
  const SC = { names: 'Tên đôi', date: 'Ngày cưới', countdown: 'Đếm ngược', parents: 'Bố mẹ', photo: 'Ảnh cưới', msg: 'Lời cảm ơn' };
  let scKey = '';
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || e.data.type !== 'led-scene') return;
    const m = e.data, list = $('#scList'), key = m.keys.join();
    if (key !== scKey) { scKey = key; list.innerHTML = m.keys.map((k, i) => `<button class="sc" data-i="${i}">${SC[k] || 'Cảnh ' + (i + 1)}</button>`).join(''); }
    list.querySelectorAll('.sc').forEach((b, i) => {
      const on = i === m.index;
      if (on) { b.classList.remove('on'); void b.offsetWidth; b.innerHTML = (SC[m.keys[i]] || 'Cảnh ' + (i + 1)) + `<i style="animation-duration:${m.seconds}s"></i>`; b.classList.add('on'); b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
      else if (b.classList.contains('on')) { b.classList.remove('on'); b.textContent = SC[m.keys[i]] || 'Cảnh ' + (i + 1); }
    });
    $('#scenes').classList.toggle('paused', !!m.paused);
    $('#scPause').textContent = m.paused ? '▶' : '❚❚';
  });
  $('#scenes').addEventListener('click', (e) => {
    const fr = $('#frame').contentWindow; if (!fr) return;
    const b = e.target.closest('.sc'), c = e.target.closest('[data-sc]');
    const cur = [...$('#scList').children].findIndex((x) => x.classList.contains('on'));
    if (b) fr.postMessage({ type: 'led-goto', index: +b.dataset.i }, location.origin);
    else if (c && c.dataset.sc === 'pause') fr.postMessage({ type: 'led-pause', paused: !$('#scenes').classList.contains('paused') }, location.origin);
    else if (c) fr.postMessage({ type: 'led-goto', index: cur + (c.dataset.sc === 'next' ? 1 : -1) }, location.origin);
  });
}

function start() {
  $('#introBox').innerHTML = '';
  $('#layout').hidden = false;
  if (!card.data.groom.name || !card.data.bride.name) curPanel = 'chu';
  if (led.slides.photo) { led.slides.photo = false; setTimeout(() => { pushPreview(); schedule(300); }, 0); } // màn LED chỉ còn mẫu có sẵn + chữ, không chiếu ảnh
  renderSide();
  renderHeader();
  bind();
  fitScreen();
  reloadPreview();
  status('Đã lưu ✓');
}

(async () => {
  try {
    const [meta, r] = await Promise.all([fetch('/api/meta').then((x) => x.json()), api(`/api/cards/${CARD_ID}`)]);
    META = meta;
    card = r.card;
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
    return start();
  }
  // chưa có màn LED: giới thiệu + bắt đầu dùng thử
  $('#introBox').innerHTML = `<div class="intro panel">
    <p style="font-size:44px;margin:0">✨</p>
    <h2 style="font-family:var(--serif);margin:8px 0">Màn hình LED cho tiệc cưới</h2>
    <p class="muted">Trình chiếu tên cô dâu chú rể, ngày cưới (kèm âm lịch), bố mẹ hai bên và lời cảm ơn trên nền hiệu ứng trời sao, đom đóm, cánh hoa… Chỉ cần gửi link cho kỹ thuật nhà hàng.</p>
    <p class="muted" style="font-size:14px">Dùng thử miễn phí ${META.trialDays} ngày · Kích hoạt ${money(META.ledPrice)} để dùng mãi, bỏ dòng "Bản dùng thử".</p>
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
