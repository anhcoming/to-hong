// Hộp thoại kích hoạt thiệp (dùng ở trang quản lý và trình sửa)
// Luồng: mã QR (hiệu lực 5 phút, có vạch quét chạy; hết hạn thì bấm tạo mã mới) → khách chuyển khoản → SePay báo tiền về → "Đã kích hoạt" tự hiện.
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
.qrcard{display:flex;flex-direction:column;align-items:center;margin:18px 0;padding:18px 16px 14px;border:1px solid var(--line);border-radius:18px;background:var(--surface,#fff)}
.qrbox{position:relative;width:212px;height:212px;padding:10px;border-radius:16px;background:#fff;box-sizing:border-box;overflow:hidden;box-shadow:0 0 0 1px var(--line),0 10px 26px rgba(120,40,50,.12)}
.qrbox img{display:block;width:192px;height:192px;transition:filter .3s,opacity .3s}
.qrbox .scan{position:absolute;left:10px;right:10px;top:10px;height:36px;pointer-events:none;background:linear-gradient(180deg,rgba(214,69,93,0),rgba(214,69,93,.22));border-bottom:2px solid rgba(214,69,93,.85);border-radius:2px;animation:qrScan 2.2s ease-in-out infinite alternate}
@keyframes qrScan{from{transform:translateY(-34px)}to{transform:translateY(156px)}}
.qrinfo{width:100%;max-width:340px;margin-top:14px;padding-top:12px;border-top:1px dashed var(--line);display:grid;gap:8px;font-size:14px}
.qrinfo>div{display:flex;align-items:center;justify-content:space-between;gap:12px}
.qrinfo span{color:var(--muted)}
.qrinfo b{display:inline-flex;align-items:center;gap:8px;text-align:right}
.qrinfo b.code{color:var(--primary,#d6455d);letter-spacing:.04em}
.qcp{border:0;border-radius:999px;padding:3px 9px;background:var(--primary-soft,#fff0f2);color:var(--primary,#d6455d);font:600 11.5px/1.4 inherit;cursor:pointer}
.qcp:hover{background:var(--primary,#d6455d);color:#fff}
.qrbox .qx{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:rgba(255,250,250,.82);backdrop-filter:blur(2px);text-align:center;padding:12px}
.qrbox.exp img{filter:blur(4px) grayscale(1);opacity:.5}.qrbox.exp .scan{display:none}.qrbox.exp .qx{display:flex}
.qrbox.ld img{opacity:.25}.qrbox.ld .scan{display:none}.qrbox.ld .qx{display:flex}
.qrbox .qx b{font-size:15px;color:var(--ink,#1f1a1b)}
.qrbox .qx .ring{width:38px;height:38px;border-radius:50%;border:4px solid var(--primary-soft,#fff0f2);border-top-color:var(--primary,#d6455d);animation:paySpin .9s linear infinite}
.qrt{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px;font-size:13px;color:var(--muted)}
.qrt i{width:8px;height:8px;border-radius:50%;background:#2f7d5b;box-shadow:0 0 0 0 rgba(47,125,91,.5);animation:qrPulse 1.6s infinite}
.qrt b{color:var(--ink,#1f1a1b);font-variant-numeric:tabular-nums}
.qrt.low b{color:var(--primary,#d6455d)}
@keyframes qrPulse{to{box-shadow:0 0 0 8px rgba(47,125,91,0)}}
.pay-cp{font-size:14px;text-transform:uppercase}.pay-cp.bad{border-color:#c0392b;box-shadow:0 0 0 3px rgba(192,57,43,.12)}
.cp-err{margin:0 0 10px 4px;font-size:13px;color:#c0392b}
.cp-err:not([hidden])+p{margin-top:4px}.pay-cp::placeholder{text-transform:none;font-size:14px}
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
  const QR_LIFE = 5 * 60e3; // mã QR hiệu lực 5 phút (đủ để mở app ngân hàng, đăng nhập, xác thực) — hết thì bấm tạo mã mới
  let qrUntil = Date.now() + QR_LIFE, qrTick = null;
  let waitStart = Object.values(orders).some((o) => o.claimedAt) ? Date.now() : 0; // đã báo chuyển từ trước → mở lại là vào màn chờ luôn
  const SLOW = 120e3;

  const closeAll = () => {
    clearInterval(timer); clearInterval(tick); clearInterval(qrTick);
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
        ${o.product === 'combo' ? '<p class="muted" style="margin:0 0 6px">Thiệp, <b>màn hình LED</b> và <b>video cưới</b> của thiệp này đều đã kích hoạt. Chưa làm LED / video thì làm lúc nào cũng được, không phải trả thêm.</p>' : ''}
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
      : 'Trả một lần · Mời tới 3.000 khách · Dùng vĩnh viễn';
    const opt = (k, title, desc, pill) => {
      const x = orders[k];
      return `<button type="button" class="pay-opt ${sel === k ? 'on' : ''}" data-sel="${k}"><span class="rd"></span><span class="t"><b>${title}</b><span>${desc}</span>${pill ? `<br><span class="pay-pill">${pill}</span>` : ''}</span><span class="p">${x.wasPrice ? `<s>${money(x.wasPrice)}</s>` : ''}<b>${money(x.amount)}</b></span></button>`;
    };
    const head = picker ? `
      <div style="text-align:center"><h2>Kích hoạt thiệp</h2><p class="muted" style="margin:0 0 14px">${esc(o.card ? o.card.names || o.card.title : '')}</p></div>
      ${opt('card', 'Chỉ thiệp cưới', 'Mời tới 3.000 khách, dùng vĩnh viễn')}
      ${opt('combo', 'Trọn bộ ngày cưới', 'Thiệp + màn LED + video MP4', `Chỉ thêm ${Math.round((orders.combo.amount - orders.card.amount) / 1000)}k`)}
      <div style="text-align:center;margin-top:4px">${o.wasPrice ? `<div class="muted" style="font-size:15px">${o.retail ? 'Mua lẻ ' : ''}<s>${money(o.wasPrice)}</s></div>` : ''}<div style="font-family:var(--serif);font-size:34px;font-weight:600;color:var(--primary);line-height:1.2">${money(o.amount)}</div>${until}${o.coupon ? ` <span class="chip ok">Đã áp mã ${esc(o.coupon)}</span>` : ''}</div>`
      : `
      <div style="text-align:center">
        <h2>${p === 'combo' && o.upgrade ? 'Nâng lên Trọn bộ' : `Kích hoạt ${esc(o.productName.toLowerCase())}`}</h2>
        <p class="muted" style="margin:0 0 6px">${p === 'combo' && o.upgrade ? 'Thiệp đã kích hoạt · thêm màn LED + video MP4' : esc(o.card ? o.card.names || o.card.title : '')}</p>
        ${o.wasPrice ? `<div class="muted" style="font-size:16px;margin-top:4px">${o.retail ? 'Mua lẻ ' : ''}<s>${money(o.wasPrice)}</s></div>` : ''}
        <div style="font-family:var(--serif);font-size:36px;font-weight:600;color:var(--primary)">${money(o.amount)}</div>
        ${until}${p === 'combo' && (o.upgrade || o.retail) && o.wasPrice ? ` <span class="chip ok">Rẻ hơn mua lẻ ${money(o.wasPrice - o.amount)}</span>` : ''}
        ${o.coupon ? `<span class="chip ok">Đã áp mã ${esc(o.coupon)}</span>` : ''}
      </div>`;
    box.innerHTML = `${PAY_CSS}<button class="modal-x" aria-label="Đóng">×</button>${head}
      <div class="qrcard">
        <div class="qrbox${Date.now() >= qrUntil ? ' exp' : ''}" id="qrBox"><img src="${esc(o.qr)}" alt="Mã QR chuyển khoản"><span class="scan" aria-hidden="true"></span>
          <div class="qx" id="qrX"><b>Mã QR đã hết hạn</b><button type="button" class="btn sm" id="qrNew">↻ Tạo mã mới</button></div></div>
        <div class="qrt" id="qrT"><i aria-hidden="true"></i><span>Đang chờ thanh toán · còn <b id="qrS">5:00</b></span></div>
        <div class="qrinfo">
          <div><span>Ngân hàng</span><b>${esc(o.bank.name)}</b></div>
          <div><span>Số tài khoản</span><b>${esc(o.bank.accountNo)}</b></div>
          <div><span>Chủ tài khoản</span><b>${esc(o.bank.accountName)}</b></div>
          <div><span>Nội dung</span><b class="code">${esc(o.code)}</b></div>
        </div>
      </div>
      <form id="cp" style="display:flex;gap:8px;margin-bottom:4px">
        <input class="input pay-cp" name="c" placeholder="Mã giảm giá (nếu có)" value="${esc(o.coupon || '')}" aria-describedby="cpErr">
        <button class="btn plain">Áp dụng</button>
      </form>
      <p class="cp-err" id="cpErr" role="alert" hidden></p>
      <p class="muted" style="font-size:12px;text-align:center;margin:14px 0 0">Thanh toán là bạn đồng ý với <a href="/dieu-khoan" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">Điều khoản</a> và <a href="/hoan-tien" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">Chính sách hoàn tiền</a>.</p>`;
    modalHead(box); // nút × đứng yên khi cuộn
    $$('[data-sel]', box).forEach((b) => (b.onclick = () => { sel = b.dataset.sel; render(); }));
    $('#cp', box).onsubmit = async (e) => {
      e.preventDefault();
      try {
        const o = (await post(sel, { coupon: e.target.c.value })).order; // áp mã cho sản phẩm đang chọn
        orders[sel] = o;
        render();
        toast(o.status === 'paid' ? 'Mã giảm 100% — đã kích hoạt' : o.coupon ? 'Đã áp dụng mã giảm giá' : 'Đã bỏ mã giảm giá');
      } catch (err) { // mã sai: báo ngay dưới ô nhập, viền ô đỏ; gõ lại là tắt
        const m = $('#cpErr', box), inp = e.target.c;
        m.textContent = err.message; m.hidden = false; inp.classList.add('bad'); inp.focus();
      }
    };
    $('#cp', box).c.addEventListener('input', (e) => { const m = $('#cpErr', box); m.hidden = true; e.target.classList.remove('bad'); });
    // đồng hồ hiệu lực mã QR: hết 1 phút → làm mờ mã, hiện "Mã QR đã hết hạn" + nút tạo mã mới
    const qrRun = () => {
      const qb = $('#qrBox', box), qs = $('#qrS', box), qt = $('#qrT', box); if (!qb || !qs || !qt) return clearInterval(qrTick);
      const left = Math.max(0, Math.ceil((qrUntil - Date.now()) / 1000));
      qs.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
      qt.classList.toggle('low', left <= 30);
      if (!left && !qb.classList.contains('exp') && !qb.classList.contains('ld')) qb.classList.add('exp');
      if (!left) qt.style.display = 'none'; // hết hạn: chỉ còn chữ + nút trên mã QR
    };
    clearInterval(qrTick); qrRun(); qrTick = setInterval(qrRun, 250);
    $('#qrNew', box).onclick = async () => {
      const qb = $('#qrBox', box); qb.classList.remove('exp'); qb.classList.add('ld');
      $('#qrX', box).innerHTML = '<span class="ring" aria-hidden="true"></span><b>Đang tạo mã mới…</b>';
      try {
        const [o] = await Promise.all([post(sel, data.order.coupon ? { coupon: data.order.coupon } : {}), new Promise((r) => setTimeout(r, 900))]);
        orders[sel] = o.order;
      } catch (err) { toast(err.message, true); }
      qrUntil = Date.now() + QR_LIFE;
      render();
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
