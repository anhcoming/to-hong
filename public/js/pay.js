// Hộp thoại kích hoạt thiệp (dùng ở trang quản lý và trình sửa)
window.openPayModal = async function (cardId, onDone, product = 'card') {
  let data;
  try {
    data = await api(`/api/cards/${cardId}/order`, { method: 'POST', body: { product } });
  } catch (e) { return toast(e.message, true); }
  const isLed = product !== 'card'; // màn LED, video: không có mã giảm giá

  const render = (box) => {
    const o = data.order;
    box.innerHTML = `<button class="modal-x" aria-label="Đóng">×</button>
      <div style="text-align:center">
        <h2>Kích hoạt ${esc(o.productName.toLowerCase())}</h2>
        <p class="muted" style="margin:0 0 6px">${esc(o.card ? o.card.names || o.card.title : '')}</p>
        <div style="font-family:var(--serif);font-size:36px;font-weight:600;color:var(--primary)">${money(o.amount)}</div>
        ${o.coupon ? `<span class="chip ok">Đã áp mã ${esc(o.coupon)}</span>` : ''}
        <p class="muted" style="margin:6px 0 0;font-size:13px">${product === 'video' ? 'Trả một lần · Tải MP4 Full HD · Bỏ dòng "Bản dùng thử"' : isLed ? 'Trả một lần · Bỏ dòng "Bản dùng thử" · Trình chiếu không giới hạn thời gian' :'Trả một lần · Mời khách không giới hạn · Dùng vĩnh viễn'}</p>
      </div>
      <div style="display:grid;grid-template-columns:150px 1fr;gap:16px;align-items:center;margin:20px 0;padding:16px;border:1px solid var(--line);border-radius:14px">
        <img src="${esc(o.qr)}" alt="Mã QR chuyển khoản" style="width:150px;height:150px;border-radius:8px;background:#fff">
        <div style="font-size:14px;display:grid;gap:4px">
          <div><span class="muted">Ngân hàng:</span> <b>${esc(o.bank.name)}</b></div>
          <div><span class="muted">Số TK:</span> <b>${esc(o.bank.accountNo)}</b> <button class="btn sm soft" data-c="${esc(o.bank.accountNo)}">Chép</button></div>
          <div><span class="muted">Chủ TK:</span> ${esc(o.bank.accountName)}</div>
          <div><span class="muted">Nội dung:</span> <b style="color:var(--primary)">${esc(o.code)}</b> <button class="btn sm soft" data-c="${esc(o.code)}">Chép</button></div>
        </div>
      </div>
      <p class="muted" style="font-size:13px;margin:-6px 0 14px">Mở app ngân hàng, quét mã QR — số tiền và nội dung đã điền sẵn. Ghi đúng nội dung <b>${esc(o.code)}</b> để được kích hoạt nhanh.</p>
      <form id="cp" style="display:${isLed ? 'none' : 'flex'};gap:8px;margin-bottom:14px">
        <input class="input" name="c" placeholder="Mã giảm giá (nếu có)" value="${esc(o.coupon || '')}" style="text-transform:uppercase">
        <button class="btn plain">Áp dụng</button>
      </form>
      ${o.claimedAt
        ? '<p class="chip warn" style="display:flex;justify-content:center;padding:10px;font-size:14px">Đã ghi nhận — thiệp sẽ được kích hoạt sau khi tiền về (thường vài phút)</p>'
        : '<button class="btn block lg" id="claim">Tôi đã chuyển khoản</button>'}
      <button class="btn block plain" id="relative" style="margin-top:8px">Nhờ người thân thanh toán hộ</button>`;
    $$('[data-c]', box).forEach((b) => (b.onclick = () => copyText(b.dataset.c)));
    $('#cp', box).onsubmit = async (e) => {
      e.preventDefault();
      try {
        data = await api(`/api/cards/${cardId}/order`, { method: 'POST', body: { product, coupon: e.target.c.value } });
        render(box);
        toast(data.order.coupon ? 'Đã áp dụng mã giảm giá' : 'Đã bỏ mã giảm giá');
      } catch (err) { toast(err.message, true); }
    };
    const claim = $('#claim', box);
    if (claim) claim.onclick = async () => {
      const r = await api(`/api/orders/${data.order.code}/claim`, { method: 'POST' });
      data.order = r.order;
      render(box);
      if (onDone) onDone();
    };
    $('#relative', box).onclick = () => {
      const text = `Bố/mẹ ơi, thanh toán giúp con ${data.order.productName.toLowerCase()} nhé: ${data.payUrl}`;
      if (navigator.share) navigator.share({ text }).catch(() => {});
      else copyText(text, 'Đã chép đường link thanh toán — gửi cho người thân qua Zalo nhé');
    };
  };
  openModal('', (box) => render(box));
};
