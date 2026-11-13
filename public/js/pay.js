// Hộp thoại kích hoạt thiệp (dùng ở trang quản lý và trình sửa)
// Luồng: mã QR → khách bấm "Tôi đã chuyển khoản" → màn chờ toàn màn hình (vòng quay lớn) → SePay báo tiền về → "Đã kích hoạt".
// Cửa sổ hỏi lại trạng thái đơn vài giây một lần; tiền về sớm (chưa bấm nút) thì nhảy thẳng sang "Đã kích hoạt".
const PAY_CSS = `<style>
@keyframes paySpin{to{transform:rotate(360deg)}}
@keyframes payIn{from{opacity:0}to{opacity:1}}
.pay-wait{position:fixed;inset:0;z-index:2000;background:var(--bg,#fffafa);display:flex;align-items:center;justify-content:center;padding:24px 16px;animation:payIn .25s ease;overflow:auto}
.pay-wait .in{max-width:420px;width:100%;text-align:center}
.pay-wait .ring{width:96px;height:96px;margin:0 auto 28px;border-radius:50%;border:6px solid var(--primary-soft,#fff0f2);border-top-color:var(--primary,#d6455d);animation:paySpin 1s linear infinite}
.pay-wait h2{font-size:26px;margin:0 0 8px}
.pay-wait .amt{font-family:var(--serif);font-size:34px;font-weight:600;color:var(--primary);margin:14px 0 4px}
.pay-wait .meta{display:inline-flex;gap:14px;font-size:14px;color:var(--muted);margin-bottom:18px}
.pay-wait .slow{background:var(--warn-soft,#fbf0dc);color:var(--warn,#a5660f);border-radius:14px;padding:12px 14px;font-size:14px;margin:0 0 16px;text-align:left}
.pay-wait .big{font-size:64px;line-height:1;margin-bottom:18px}
.pay-opt{display:flex;gap:12px;align-items:flex-start;width:100%;padding:13px 14px;border:1.5px solid var(--line);border-radius:14px;margin:0 0 10px;background:var(--surface,#fff);text-align:left;font:inherit;color:inherit;cursor:pointer}
.pay-opt.on{border-color:var(--primary);background:var(--primary-soft,#fff0f2)}
.pay-opt .rd{flex:none;width:20px;height:20px;border-radius:50%;border:2px solid var(--line);margin-top:2px;box-sizing:border-box}
.pay-opt.on .rd{border:6px solid var(--primary)}
.pay-opt .t{flex:1;min-width:0}.pay-opt .t b{display:block;font-size:15px}.pay-opt .t span{font-size:13px;color:var(--muted)}
.pay-opt .p{text-align:right;white-space:nowrap}.pay-opt .p s{display:block;font-size:12px;color:var(--muted)}.pay-opt .p b{font-size:17px;color:var(--primary)}
.pay-pill{display:inline-block;margin-top:4px;background:var(--ok-soft,#e6f3ec);color:var(--ok,#2f7d5b);font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px}
</style>`;

window.openPayModal = async function (cardId, onDone, product = 'card') {
  // Màn LED / video mà chủ thiệp còn lượt Trọn bộ → hỏi dùng lượt (miễn phí) trước, mua lẻ là lựa chọn phụ
  if ((product === 'led' || product === 'video') && !openPayModal.skipCredit) {
    try {
      const { card } = await api(`/api/cards/${cardId}`);
      const left = card.credits ? card.credits[product] : 0;
      if (left > 0 && card[product] && card[product].created && !card[product].paid) return creditModal(cardId, onDone, product, left);
    } catch {}
  }
  // Bấm "Kích hoạt" thiệp → tải cả đơn thiệp lẫn đơn Trọn bộ để chọn gói ngay trên đầu (mặc định Trọn bộ).
  // product 'combo' khi thiệp đã kích hoạt = nâng cấp (chỉ trả phần chênh).
  const orders = {};
  const post = (p, extra = {}) => api(`/api/cards/${cardId}/order`, { method: 'POST', body: { product: p, ...extra } });
  try {
    if (product === 'card') {
      const [c, cb] = await Promise.allSettled([post('card'), post('combo')]);
      if (c.status === 'rejected') throw c.reason;
      orders.card = c.value.order;
      if (cb.status === 'fulfilled') orders.combo = cb.value.order;
    } else orders[product] = (await post(product)).order;
  } catch (e) { return toast(e.message, true); }
  let sel = orders.combo ? 'combo' : product;
  const data = { get order() { return orders[sel]; }, set order(o) { orders[o.product] = o; } };
  const picker = !!(orders.card && orders.combo);

  let timer = null, tick = null, ov = null, box = null, closeModal = null;
  let waitStart = Object.values(orders).some((o) => o.claimedAt) ? Date.now() : 0; // đã báo chuyển từ trước → mở lại là vào màn chờ luôn
  const SLOW = 120e3;

  const closeAll = () => {
    clearInterval(timer); clearInterval(tick);
    if (ov) ov.remove();
    ov = null;
    if (closeModal) closeModal();
  };
  const overlay = () => {
    if (!ov) { ov = document.createElement('div'); ov.className = 'pay-wait'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); document.body.appendChild(ov); }
    return ov;
  };

  const paid = () => {
    const o = data.order;
    clearInterval(timer); clearInterval(tick);
    if (onDone) onDone();
    const el = overlay();
    el.innerHTML = `${PAY_CSS}<div class="in">
        <div class="big">🎉</div>
        <h2>${o.product === 'combo' ? 'Đã kích hoạt Trọn bộ ngày cưới' : `Đã kích hoạt ${esc(o.productName.toLowerCase())}`}</h2>
        ${o.product === 'combo' ? '<p class="muted" style="margin:0 0 6px">Thiệp đã kích hoạt. Bạn có thêm 1 lượt màn LED và 1 lượt video — làm thử thoải mái, ưng cái nào thì bấm <b>Dùng lượt Trọn bộ</b> trên cái đó.</p>' : ''}
        <p class="muted">Đã nhận ${money(o.amount)}. Cảm ơn hai bạn — chúc đám cưới thật vui!</p>
        <button class="btn block lg" id="payDone" style="margin-top:22px">Xong</button>
      </div>`;
    $('#payDone', el).onclick = closeAll;
    $('#payDone', el).focus();
  };

  const waiting = () => {
    const o = data.order;
    const el = overlay();
    const slow = Date.now() - waitStart > SLOW;
    el.innerHTML = `${PAY_CSS}<div class="in" role="status" aria-live="polite">
        <div class="ring" aria-hidden="true"></div>
        <h2>Đang chờ thanh toán…</h2>
        <p class="muted" style="margin:0">Ngân hàng báo tiền về là ${esc(o.productName.toLowerCase())} tự kích hoạt — thường chỉ vài giây. Đừng tắt trang này nhé.</p>
        <div class="amt">${money(o.amount)}</div>
        <div class="meta"><span>Nội dung <b style="color:var(--ink)">${esc(o.code)}</b></span><span id="payClock">0:00</span></div>
        ${slow ? `<p class="slow">Hơi lâu rồi — có thể ngân hàng đang chậm. Bạn có thể đóng trang, Cưới Nha sẽ kiểm tra và kích hoạt giúp trong ít phút.</p>` : ''}
        <button class="btn block plain" id="payBack">← Xem lại mã QR</button>
        ${slow ? '<button class="btn block plain" id="payClose" style="margin-top:8px">Đóng, mình sẽ quay lại sau</button>' : ''}
      </div>`;
    $('#payBack', el).onclick = () => { clearInterval(tick); ov.remove(); ov = null; };
    const c = $('#payClose', el); if (c) c.onclick = closeAll;
    clearInterval(tick);
    const clock = () => {
      const s = Math.floor((Date.now() - waitStart) / 1000);
      const out = $('#payClock', el); if (out) out.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      if (!slow && s * 1000 > SLOW) waiting(); // hiện lời nhắn "hơi lâu"
    };
    clock(); tick = setInterval(clock, 1000);
  };

  const render = () => {
    const o = data.order;
    if (o.status === 'paid') return paid();
    const p = o.product;
    const until = o.promoEndsAt ? `<span class="chip warn">Giá mở bán đến ${new Date(o.promoEndsAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span>` : '';
    const note = p === 'video' ? 'Trả một lần · Tải MP4 Full HD · Bỏ dòng "Bản dùng thử"'
      : p === 'led' ? 'Trả một lần · Bỏ dòng "Bản dùng thử" · Trình chiếu không giới hạn thời gian'
      : p === 'combo' ? 'Trả một lần · Thiệp + màn LED + video MP4, dùng chung ảnh và tên'
      : 'Trả một lần · Mời khách không giới hạn · Dùng vĩnh viễn';
    const opt = (k, title, desc, pill) => {
      const x = orders[k];
      return `<button type="button" class="pay-opt ${sel === k ? 'on' : ''}" data-sel="${k}"><span class="rd"></span><span class="t"><b>${title}</b><span>${desc}</span>${pill ? `<br><span class="pay-pill">${pill}</span>` : ''}</span><span class="p">${x.wasPrice ? `<s>${money(x.wasPrice)}</s>` : ''}<b>${money(x.amount)}</b></span></button>`;
    };
    const head = picker ? `
      <div style="text-align:center"><h2>Kích hoạt thiệp</h2><p class="muted" style="margin:0 0 14px">${esc(o.card ? o.card.names || o.card.title : '')}</p></div>
      ${opt('card', 'Chỉ thiệp cưới', 'Mời không giới hạn, dùng vĩnh viễn')}
      ${opt('combo', 'Trọn bộ ngày cưới', 'Thiệp + màn LED + video MP4', `Chỉ thêm ${Math.round((orders.combo.amount - orders.card.amount) / 1000)}k`)}
      <div style="text-align:center;margin-top:4px">${o.wasPrice ? `<div class="muted" style="font-size:15px;text-decoration:line-through">${money(o.wasPrice)}</div>` : ''}<div style="font-family:var(--serif);font-size:34px;font-weight:600;color:var(--primary);line-height:1.2">${money(o.amount)}</div>${until}${o.coupon ? ` <span class="chip ok">Đã áp mã ${esc(o.coupon)}</span>` : ''}</div>`
      : `
      <div style="text-align:center">
        <h2>${p === 'combo' && o.upgrade ? 'Nâng lên Trọn bộ' : `Kích hoạt ${esc(o.productName.toLowerCase())}`}</h2>
        <p class="muted" style="margin:0 0 6px">${p === 'combo' && o.upgrade ? 'Thiệp đã kích hoạt · thêm màn LED + video MP4' : esc(o.card ? o.card.names || o.card.title : '')}</p>
        ${o.wasPrice ? `<div class="muted" style="font-size:16px;text-decoration:line-through;margin-top:4px">${money(o.wasPrice)}</div>` : ''}
        <div style="font-family:var(--serif);font-size:36px;font-weight:600;color:var(--primary)">${money(o.amount)}</div>
        ${until}${p === 'combo' && o.upgrade ? ` <span class="chip ok">Rẻ hơn mua lẻ ${money(o.wasPrice - o.amount)}</span>` : ''}
        ${o.coupon ? `<span class="chip ok">Đã áp mã ${esc(o.coupon)}</span>` : ''}
        <p class="muted" style="margin:6px 0 0;font-size:13px">${note}</p>
      </div>`;
    box.innerHTML = `${PAY_CSS}<button class="modal-x" aria-label="Đóng">×</button>${head}
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px 20px;align-items:center;margin:20px 0;padding:16px;border:1px solid var(--line);border-radius:14px">
        <img src="${esc(o.qr)}" alt="Mã QR chuyển khoản" style="width:210px;height:210px;border-radius:8px;background:#fff">
        <div style="flex:1 1 170px;font-size:14px;display:grid;gap:6px">
          <div><span class="muted">Ngân hàng:</span> <b>${esc(o.bank.name)}</b></div>
          <div><span class="muted">Số TK:</span> <b>${esc(o.bank.accountNo)}</b></div>
          <div><span class="muted">Chủ TK:</span> ${esc(o.bank.accountName)}</div>
          <div><span class="muted">Nội dung:</span> <b style="color:var(--primary)">${esc(o.code)}</b></div>
        </div>
      </div>
      <p class="muted" style="font-size:13px;margin:-6px 0 14px">Mở app ngân hàng, quét mã QR — số tiền và nội dung đã điền sẵn, giữ nguyên nội dung <b>${esc(o.code)}</b>. Chuyển xong bấm nút bên dưới.</p>
      <form id="cp" style="display:${p === 'card' ? 'flex' : 'none'};gap:8px;margin-bottom:14px">
        <input class="input" name="c" placeholder="Mã giảm giá (nếu có)" value="${esc(o.coupon || '')}" style="text-transform:uppercase">
        <button class="btn plain">Áp dụng</button>
      </form>
      <button class="btn block lg" id="claim">Tôi đã chuyển khoản</button>`;
    $$('[data-sel]', box).forEach((b) => (b.onclick = () => { sel = b.dataset.sel; render(); }));
    $('#cp', box).onsubmit = async (e) => {
      e.preventDefault();
      try {
        orders.card = (await post('card', { coupon: e.target.c.value })).order;
        render();
        toast(orders.card.coupon ? 'Đã áp dụng mã giảm giá' : 'Đã bỏ mã giảm giá');
      } catch (err) { toast(err.message, true); }
    };
    $('#claim', box).onclick = async () => {
      if (!waitStart) waitStart = Date.now();
      waiting();
      try {
        const r = await api(`/api/orders/${data.order.code}/claim`, { method: 'POST' });
        data.order = r.order;
        if (data.order.status === 'paid') paid();
      } catch {}
    };
  };

  openModal('', (b, close) => {
    box = b; closeModal = close;
    render();
    if (waitStart && data.order.status !== 'paid') { const c = Object.values(orders).find((x) => x.claimedAt); if (c) sel = c.product; waiting(); }
    // Hỏi lại trạng thái vài giây một lần: SePay báo tiền về là đơn chuyển sang "paid"
    timer = setInterval(async () => {
      if (!box.isConnected && !ov) return clearInterval(timer);
      if (document.hidden) return;
      // hỏi mọi đơn đang mở (thiệp và Trọn bộ): khách chuyển theo mã nào thì báo theo đơn đó
      for (const x of Object.values(orders)) {
        try {
          const r = await api(`/api/orders/${x.code}`);
          if (r.order.status === 'paid') { data.order = r.order; sel = r.order.product; return paid(); }
        } catch {}
      }
    }, 3000);
  });
};

// Hộp "Dùng lượt Trọn bộ": kích hoạt ngay màn LED / video này, không trả thêm. Mua lẻ vẫn chọn được.
function creditModal(cardId, onDone, product, left) {
  const name = product === 'led' ? 'màn LED' : 'video';
  openModal(`
    <div style="text-align:center">
      <div style="font-size:44px;line-height:1;margin-bottom:10px">🎁</div>
      <h2 style="margin:0 0 6px">Dùng lượt Trọn bộ cho ${name} này?</h2>
      <p class="muted" style="margin:0 0 18px">Bạn còn <b>${left}</b> lượt ${name} trong gói Trọn bộ. Kích hoạt ngay, không trả thêm — sau này vẫn đổi mẫu, đổi chữ thoải mái.</p>
      <button class="btn block lg" id="useCredit">Dùng lượt · miễn phí</button>
      <button class="btn block plain" id="buyOne" style="margin-top:8px">Không, mua lẻ ${name} này</button>
    </div>`, (box, close) => {
    $('#useCredit', box).onclick = async (e) => {
      e.target.disabled = true;
      try {
        await api(`/api/cards/${cardId}/redeem`, { method: 'POST', body: { product } });
        close();
        toast(`Đã kích hoạt ${name} bằng lượt Trọn bộ`);
        if (onDone) onDone();
      } catch (err) { e.target.disabled = false; toast(err.message, true); }
    };
    $('#buyOne', box).onclick = () => { close(); openPayModal.skipCredit = true; openPayModal(cardId, onDone, product).finally(() => { openPayModal.skipCredit = false; }); };
  });
}
