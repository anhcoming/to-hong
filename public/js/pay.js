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
</style>`;

window.openPayModal = async function (cardId, onDone, product = 'card') {
  let data;
  try {
    data = await api(`/api/cards/${cardId}/order`, { method: 'POST', body: { product } });
  } catch (e) { return toast(e.message, true); }
  const isLed = product !== 'card'; // màn LED, video: không có mã giảm giá

  let timer = null, tick = null, ov = null, box = null, closeModal = null;
  let waitStart = data.order.claimedAt ? Date.now() : 0; // đã báo chuyển từ trước → mở lại là vào màn chờ luôn
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
        <h2>Đã kích hoạt ${esc(o.productName.toLowerCase())}</h2>
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
    box.innerHTML = `<button class="modal-x" aria-label="Đóng">×</button>
      <div style="text-align:center">
        <h2>Kích hoạt ${esc(o.productName.toLowerCase())}</h2>
        <p class="muted" style="margin:0 0 6px">${esc(o.card ? o.card.names || o.card.title : '')}</p>
        ${o.listPrice ? `<div class="muted" style="font-size:16px;text-decoration:line-through;margin-top:4px">${money(o.listPrice)}</div>` : ''}
        <div style="font-family:var(--serif);font-size:36px;font-weight:600;color:var(--primary)">${money(o.amount)}</div>
        ${o.listPrice ? `<span class="chip warn">Giá mở bán đến ${new Date(o.promoEndsAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span>` : ''}
        ${o.coupon ? `<span class="chip ok">Đã áp mã ${esc(o.coupon)}</span>` : ''}
        <p class="muted" style="margin:6px 0 0;font-size:13px">${product === 'video' ? 'Trả một lần · Tải MP4 Full HD · Bỏ dòng "Bản dùng thử"' : isLed ? 'Trả một lần · Bỏ dòng "Bản dùng thử" · Trình chiếu không giới hạn thời gian' :'Trả một lần · Mời khách không giới hạn · Dùng vĩnh viễn'}</p>
      </div>
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
      <form id="cp" style="display:${isLed ? 'none' : 'flex'};gap:8px;margin-bottom:14px">
        <input class="input" name="c" placeholder="Mã giảm giá (nếu có)" value="${esc(o.coupon || '')}" style="text-transform:uppercase">
        <button class="btn plain">Áp dụng</button>
      </form>
      <button class="btn block lg" id="claim">Tôi đã chuyển khoản</button>`;
    $('#cp', box).onsubmit = async (e) => {
      e.preventDefault();
      try {
        data = await api(`/api/cards/${cardId}/order`, { method: 'POST', body: { product, coupon: e.target.c.value } });
        render();
        toast(data.order.coupon ? 'Đã áp dụng mã giảm giá' : 'Đã bỏ mã giảm giá');
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
    if (waitStart && data.order.status !== 'paid') waiting();
    // Hỏi lại trạng thái vài giây một lần: SePay báo tiền về là đơn chuyển sang "paid"
    timer = setInterval(async () => {
      if (!box.isConnected && !ov) return clearInterval(timer);
      if (document.hidden) return;
      try {
        const r = await api(`/api/orders/${data.order.code}`);
        if (r.order.status === 'paid') { data.order = r.order; paid(); }
      } catch {}
    }, 3000);
  });
};
