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

  $('#side').innerHTML = `
    <section class="group panel"><h3>Tỉ lệ màn hình <small>hỏi kỹ thuật nhà hàng</small></h3>
      <div class="opts">${META.led.ratios.map(ratioBox).join('')}</div>
    </section>
    <section class="group panel"><h3>Hiệu ứng nền</h3>
      <div class="opts" style="margin-bottom:14px">${META.led.effects.map((e) => `<button class="opt ${led.effect === e.id ? 'on' : ''}" data-set="effect" data-v="${e.id}"><b>${esc(e.name)}</b></button>`).join('')}</div>
      ${range('density', 'Mật độ', 0.2, 3, 0.1, '×')}
      ${range('speed', 'Tốc độ', 0.2, 3, 0.1, '×')}
      <h3 style="margin:16px 0 10px">Bảng màu</h3>
      <div class="sws">${META.led.palettes.map((p) => `<button class="sw ${led.palette === p.id ? 'on' : ''}" title="${esc(p.name)}" data-set="palette" data-v="${p.id}" style="background:radial-gradient(circle at 50% 40%,${p.bg[1]} 0 45%,${p.bg[0]} 46% 70%,${p.accent} 71%)"></button>`).join('')}</div>
    </section>
    <section class="group panel"><h3>Các cảnh trình chiếu</h3>
      <div class="checks">${chk('names', 'Tên cô dâu chú rể')}${chk('date', 'Ngày cưới + âm lịch')}${chk('parents', 'Bố mẹ hai bên')}${chk('photo', 'Ảnh cưới')}${chk('message', 'Lời cảm ơn')}<label class="check"><input type="checkbox" data-l="hy" ${led.hy ? 'checked' : ''}>Chữ Hỷ 囍</label></div>
      ${range('seconds', 'Mỗi cảnh', 4, 30, 1, 's')}
      <label class="field"><span>Dòng tiêu đề</span><input data-l="kicker" value="${esc(led.kicker)}" maxlength="40" placeholder="Lễ Thành Hôn / Lễ Vu Quy / Tiệc Cưới"></label>
      <label class="field"><span>Lời cảm ơn</span><textarea data-l="message" maxlength="200" rows="3">${esc(led.message)}</textarea></label>
    </section>
    <section class="group panel"><h3>Thông tin <small>dùng chung với thiệp</small></h3>
      <div class="grid2">${fd('groom.name', 'Chú rể', 'text', 'Đức Minh')}${fd('bride.name', 'Cô dâu', 'text', 'Thu Hà')}${fd('date', 'Ngày cưới', 'date')}${fd('time', 'Giờ', 'time')}
      ${fd('groom.father', 'Bố chú rể')}${fd('groom.mother', 'Mẹ chú rể')}${fd('bride.father', 'Bố cô dâu')}${fd('bride.mother', 'Mẹ cô dâu')}</div>
      <div style="display:flex;align-items:center;gap:12px">
        ${d.cover ? `<div style="width:56px;height:70px;border-radius:8px;background:center/cover url('${esc(d.cover)}')"></div>` : ''}
        <label class="btn sm soft">${d.cover ? 'Đổi ảnh cưới' : 'Chọn ảnh cưới'}<input type="file" accept="image/*" id="coverIn" hidden></label>
      </div>
    </section>
    <section class="group panel"><h3>Hướng dẫn cho kỹ thuật nhà hàng</h3>
      <ol class="tips">
        <li>Mở link bằng Chrome hoặc Edge trên máy nối với màn hình.</li>
        <li>Bấm <b>F</b> hoặc nháy đúp chuột để chạy toàn màn hình.</li>
        <li>Phím ← → chuyển cảnh, phím cách để tạm dừng.</li>
        <li>Chọn đúng tỉ lệ ở trên cho khớp màn — không bị méo hay viền đen.</li>
      </ol>
      <button class="btn sm plain" id="copyGuide" style="margin-top:8px">Chép link + hướng dẫn gửi kỹ thuật</button>
    </section>`;
}

function renderHeader() {
  const s = card.led;
  $('#ttl').textContent = 'Màn hình LED · ' + ([card.data.groom.name, card.data.bride.name].filter(Boolean).join(' & ') || card.title);
  backTo($('#back'), '/sua/' + CARD_ID);
  $('#chip').innerHTML = !s.created ? '' : s.paid ? '<span class="chip ok">● Đã kích hoạt</span>'
    : s.expired ? '<span class="chip red">Hết hạn dùng thử</span>'
    : `<span class="chip warn">Dùng thử · còn ${Math.max(0, Math.ceil((s.trialEndsAt - Date.now()) / 864e5))} ngày</span>`;
  $('#acts').innerHTML = s.created ? `<button class="btn sm soft" id="cpLink">Chép link</button> <a class="btn sm plain" target="_blank" href="${esc(s.url)}">Mở trình chiếu</a>${s.paid ? '' : ` <button class="btn sm" id="payBtn">Kích hoạt · ${money(META.ledPrice)}</button>`}` : '';
  const cp = $('#cpLink'); if (cp) cp.onclick = () => copyText(s.url, 'Đã chép link màn LED');
  const pb = $('#payBtn'); if (pb) pb.onclick = () => openPayModal(CARD_ID, reload, 'led');
}

function fitScreen() {
  const [w, h] = led.ratio.split(':').map(Number);
  const box = $('#stagewrap').getBoundingClientRect();
  const maxW = box.width - 48, maxH = box.height - 60;
  const s = Math.min(maxW / w, maxH / h);
  $('#screen').style.width = Math.round(w * s) + 'px';
  $('#screen').style.height = Math.round(h * s) + 'px';
}

function pushPreview() {
  const fr = $('#frame');
  if (fr.contentWindow) fr.contentWindow.postMessage({ type: 'led-config', led, card: { groom: card.data.groom, bride: card.data.bride } }, location.origin);
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
  side.addEventListener('click', (e) => {
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
  side.addEventListener('change', async (e) => {
    if (e.target.id !== 'coverIn' || !e.target.files[0]) return;
    status('Đang tải ảnh…');
    try {
      card.data.cover = await uploadFile(e.target.files[0]);
      dataDirty = true;
      renderSide();
      save();
    } catch (err) { toast(err.message, true); status(''); }
  });
  window.addEventListener('resize', fitScreen);
}

function start() {
  $('#introBox').innerHTML = '';
  $('#layout').hidden = false;
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
    $('#ttl').textContent = 'Không tìm thấy thiệp';
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
      const r = await api(`/api/cards/${CARD_ID}`, { method: 'PUT', body: { led: {} } });
      card = r.card;
      led = card.ledConfig;
      start();
    } catch (e) { toast(e.message, true); }
  };
})();
