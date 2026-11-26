// Hộp thoại kích hoạt thiệp (dùng ở trang quản lý và trình sửa)
// Luồng: mã QR (hiệu lực 5 phút, có vạch quét chạy; hết hạn thì bấm tạo mã mới) → khách chuyển khoản → SePay báo tiền về → "Đã kích hoạt" tự hiện.
// Cửa sổ hỏi lại trạng thái đơn vài giây một lần; tiền về sớm (chưa bấm nút) thì nhảy thẳng sang "Đã kích hoạt".
// chữ thường đầu câu nhưng giữ chữ viết hoa sẵn (LED): "Màn hình LED tiệc cưới" → "màn hình LED tiệc cưới"
const lcFirst = (s) => String(s || '').charAt(0).toLowerCase() + String(s || '').slice(1);
// Trả tiền là chốt — nói rõ trước khi khách chuyển khoản
const LOCK_NOTE = {
  card: '🔒 Kích hoạt là chốt <b>tên cô dâu chú rể và ngày cưới</b> cho cả đám cưới. Mẫu thiệp, ảnh, chữ… vẫn sửa thoải mái, làm thêm thiệp (nhà trai, nhà gái…) không mất thêm tiền.',
  combo: '🔒 Kích hoạt là chốt <b>tên cô dâu chú rể và ngày cưới</b>; mẫu thiệp vẫn đổi thoải mái. Màn LED và slide chốt hẳn (không sửa gì nữa) khi chiếu hoặc tải lần đầu.',
  led: '🔒 Kích hoạt là <b>chốt hẳn màn LED</b> — sau khi trả tiền không sửa gì được nữa. Kiểm tra kỹ tên, ngày, chữ trên màn trước khi chuyển khoản.',
  video: '🔒 Kích hoạt là <b>chốt hẳn video</b> — sau khi trả tiền không sửa gì được nữa. Kiểm tra kỹ tên, ngày, chữ, ảnh trước khi chuyển khoản.',
};
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
.pay-short{display:grid;gap:4px;margin:14px 0 0;padding:12px 14px;border-radius:14px;background:#fff6e0;color:#6b4e00;font-size:13.5px;line-height:1.5;text-align:left}
.pay-short>b{font-size:15px;color:#8a5a00}
.pay-opt .ck{flex:none;width:22px;height:22px;border-radius:7px;border:2px solid var(--line);margin-top:1px;box-sizing:border-box;display:grid;place-items:center;color:#fff;font-size:13px;font-weight:800}
.pay-opt.on .ck{background:var(--primary);border-color:var(--primary)}
.pay-opt.have{cursor:default;opacity:.75;background:var(--bg,#faf6f6);border-color:var(--line)}.pay-opt.have .ck{background:#bdb2b4;border-color:#bdb2b4}
.pay-save{margin:2px 0 10px;padding:9px 12px;border-radius:12px;background:#fff4d9;color:#8a5a00;font-size:13px;text-align:left}
.pay-tot{display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:10px 2px 0;border-top:1px dashed var(--line)}
.pay-tot span{color:var(--muted);font-size:14px}.pay-tot s{margin-right:8px;font-size:14px}.pay-tot b{font-family:var(--serif);font-size:30px;color:var(--primary)}
.pay-pill{display:inline-block;margin-top:4px;background:var(--ok-soft,#e6f3ec);color:var(--ok,#2f7d5b);font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px}
</style>`;

window.openPayModal = async function (cardId, onDone, product = 'card') {
  // kích hoạt là chốt tên + ngày cưới → thiếu thì báo chung một dòng, còn ô thiếu hiện chữ đỏ ngay dưới ô (máy chủ cũng chặn)
  {
    let data = null;
    try { data = (await api(`/api/cards/${cardId}`)).card.data; } catch {}
    if (data && payMissing(data).length) return;
  }
  // Màn LED / video mà chủ thiệp còn lượt Trọn bộ → hỏi dùng lượt (miễn phí) trước, mua lẻ là lựa chọn phụ
  if ((product === 'led' || product === 'video') && !openPayModal.skipCredit) {
    try {
      const { card } = await api(`/api/cards/${cardId}`);
      const left = card.credits ? card.credits[product] : 0;
      if (left > 0 && card[product] && card[product].created && !card[product].paid) return creditModal(cardId, onDone, product, left);
    } catch {}
  }
  // Màn thanh toán chung: tick thiệp / màn LED / slide (món đã có hiện ✓ xám). Máy chủ chọn sản phẩm theo món đã tick:
  // một món = mua lẻ, đủ cả ba (tính cả món đã có) = Trọn bộ (nâng cấp: trừ phần đã trả), hai món = một đơn gộp. Một mã QR.
  let cardInfo = null, M = window.META || null;
  try { [cardInfo, M] = await Promise.all([api(`/api/cards/${cardId}`).then((r) => r.card), M && M.ledPrice ? M : api('/api/meta')]); } catch (e) { return toast(e.message, true); }
  const KEYS = ['card', 'led', 'video'];
  const HAVE = { card: !!cardInfo.paid, led: !!(cardInfo.led.paid || cardInfo.led.prepaid), video: !!(cardInfo.video.paid || cardInfo.video.prepaid) };
  const PRICE = { card: M.price, led: M.ledPrice, video: M.videoPrice };
  const TITLE = { card: ['Thiệp cưới online', 'Mọi thiệp của đám cưới (nhà trai, nhà gái…), đổi mẫu thoải mái'], led: ['Màn hình LED', 'Link chiếu ở tiệc + tải MP4'], video: ['Slide ảnh cưới / màn hình dạm ngõ', 'Dựng video từ ảnh, tải MP4 Full HD'] };
  let ticks = (product === 'led' || product === 'video' ? [product] : KEYS).filter((k) => !HAVE[k]);
  if (!ticks.length) ticks = KEYS.filter((k) => !HAVE[k]);
  if (!ticks.length) return toast('Thiệp, màn LED và slide của bạn đều đã kích hoạt', true);
  const orders = {};
  const post = (_p, extra = {}) => api(`/api/cards/${cardId}/order`, { method: 'POST', body: { items: ticks, ...extra } });
  let sel;
  try { const o = (await post()).order; orders[o.product] = o; sel = o.product; } catch (e) { return toast(e.message, true); }
  // đã chuyển thiếu cho một đơn: giữ nguyên đơn đó (chuyển nốt phần còn thiếu), không cho đổi món giữa chừng
  const part = Object.values(orders).find((x) => x.received);
  const data = { get order() { return orders[sel]; }, set order(o) { orders[o.product] = o; } };
  let picker = !part;

  let timer = null, tick = null, ov = null, box = null, closeModal = null;
  const QR_LIFE = 5 * 60e3; // mã QR hiệu lực 5 phút (đủ để mở app ngân hàng, đăng nhập, xác thực) — hết thì bấm tạo mã mới
  let qrUntil = Date.now() + QR_LIFE, qrTick = null;
  let waitStart = Object.values(orders).some((o) => o.claimedAt && !o.received) ? Date.now() : 0; // chuyển thiếu: mở màn mã QR có ô báo thiếu, không mở màn chờ // đã báo chuyển từ trước → mở lại là vào màn chờ luôn
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

  // kích hoạt xong: không mở màn chúc mừng toàn trang — đóng hộp thanh toán, báo một dòng, ở lại / về màn của sản phẩm vừa kích hoạt
  const paid = () => {
    const o = data.order;
    clearInterval(timer); clearInterval(tick);
    closeAll();
    toast(o.product === 'combo' ? 'Đã kích hoạt Trọn bộ ngày cưới 🎉' : `Đã kích hoạt ${lcFirst(o.productName)} 🎉`);
    const go = o.product === 'led' ? `/sua-led/${cardId}` : o.product === 'video' ? `/sua-video/${cardId}` : '';
    if (go && !location.pathname.startsWith(go)) { location.href = go; return; } // kích hoạt từ trang khác (Thiệp của tôi) → mở màn LED / video của tôi
    if (onDone) onDone();
  };

  const waiting = () => {
    const o = data.order;
    const el = overlay();
    const slow = Date.now() - waitStart > SLOW;
    el.innerHTML = `${PAY_CSS}<div class="in" role="status" aria-live="polite">
        <div class="ring" aria-hidden="true"></div>
        <h2>Đang chờ thanh toán…</h2>
        <p class="muted" style="margin:0">Ngân hàng báo tiền về là ${esc(lcFirst(o.productName))} tự kích hoạt — thường chỉ vài giây. Đừng tắt trang này nhé.</p>
        ${o.received ? `<p class="muted" style="margin:10px 0 0">Đã nhận ${money(o.received)}, đang chờ phần còn thiếu</p>` : ''}
        <div class="amt">${money(o.received ? o.due : o.amount)}</div>
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
      : p === 'combo' ? 'Trả một lần · Thiệp + màn LED + slide / màn hình dạm ngõ, dùng chung ảnh và tên'
      : 'Trả một lần · Mời tới 3.000 khách · Dùng vĩnh viễn';
    const opt = (k, title, desc, pill) => {
      const x = orders[k];
      return `<button type="button" class="pay-opt ${sel === k ? 'on' : ''}" data-sel="${k}"><span class="rd"></span><span class="t"><b>${title}</b><span>${desc}</span>${pill ? `<br><span class="pay-pill">${pill}</span>` : ''}</span><span class="p">${x.wasPrice ? `<s>${money(x.wasPrice)}</s>` : ''}<b>${money(x.amount)}</b></span></button>`;
    };
    const retail = (o.items || []).filter((k) => !HAVE[k]).reduce((n, k) => n + PRICE[k], 0);
    const head = picker ? `
      <div style="text-align:center"><h2>Kích hoạt đám cưới</h2><p class="muted" style="margin:0 0 14px">${esc(o.card ? o.card.names || o.card.title : '')}</p></div>
      ${KEYS.map((k) => { const have = HAVE[k], on = have || ticks.includes(k); return `<button type="button" class="pay-opt ${on ? 'on' : ''} ${have ? 'have' : ''}" data-tick="${k}"${have ? ' disabled' : ''}><span class="ck">${on ? '✓' : ''}</span><span class="t"><b>${TITLE[k][0]}</b><span>${have ? 'Đã có' : TITLE[k][1]}</span></span><span class="p">${have ? '' : `<b>${money(PRICE[k])}</b>`}</span></button>`; }).join('')}
      ${p === 'combo' && retail > o.amount ? `<div class="pay-save">🎁 Đủ 3 món = <b>Trọn bộ</b>, rẻ hơn mua lẻ ${money(retail - o.amount)}</div>` : ''}
      <div class="pay-tot"><span>Tổng</span><span>${retail > o.amount ? `<s>${money(retail)}</s>` : ''}<b>${money(o.amount)}</b></span></div>
      <div style="text-align:center">${until}${o.coupon ? ` <span class="chip ok">Đã áp mã ${esc(o.coupon)}</span>` : ''}</div>`
      : `
      <div style="text-align:center">
        <h2>${p === 'combo' && o.upgrade ? 'Nâng lên Trọn bộ' : `Kích hoạt ${esc(lcFirst(o.productName))}`}</h2>
        <p class="muted" style="margin:0 0 6px">${esc(o.card ? o.card.names || o.card.title : '')}</p>
        <div style="font-family:var(--serif);font-size:36px;font-weight:600;color:var(--primary)">${money(o.amount)}</div>
        ${o.coupon ? `<span class="chip ok">Đã áp mã ${esc(o.coupon)}</span>` : ''}
      </div>`;
    const short = o.received ? `<div class="pay-short" role="alert"><b>Đã nhận ${money(o.received)} · còn thiếu ${money(o.due)}</b><span>Quét mã bên dưới để chuyển nốt ${money(o.due)}, giữ nguyên nội dung <b>${esc(o.code)}</b>. Đủ tiền là tự kích hoạt.</span></div>` : '';
    box.innerHTML = `${PAY_CSS}<button class="modal-x" aria-label="Đóng">×</button>${head}${short}
      <div class="qrcard">
        <div class="qrbox${Date.now() >= qrUntil ? ' exp' : ''}" id="qrBox"><img src="${esc(o.qr)}" alt="Mã QR chuyển khoản"><span class="scan" aria-hidden="true"></span>
          <div class="qx" id="qrX"><b>Mã QR đã hết hạn</b><button type="button" class="btn sm" id="qrNew">↻ Tạo mã mới</button></div></div>
        <div class="qrt" id="qrT"><i aria-hidden="true"></i><span>Đang chờ thanh toán · còn <b id="qrS">5:00</b></span></div>
        <div class="qrinfo">
          <div><span>Ngân hàng</span><b>${esc(o.bank.name)}</b></div>
          <div><span>Số tài khoản</span><b>${esc(o.bank.accountNo)}</b></div>
          <div><span>Chủ tài khoản</span><b>${esc(o.bank.accountName)}</b></div>
          ${o.received ? `<div><span>Số tiền chuyển nốt</span><b>${money(o.due)}</b></div>` : ''}
          <div><span>Nội dung</span><b class="code">${esc(o.code)}</b></div>
        </div>
      </div>
      <form id="cp" style="display:${o.received || p === 'multi' ? 'none' : 'flex'};gap:8px;margin-bottom:4px">
        <input class="input pay-cp" name="c" placeholder="Mã giảm giá (nếu có)" value="${esc(o.coupon || '')}" aria-describedby="cpErr">
        <button class="btn plain">Áp dụng</button>
      </form>
      <p class="cp-err" id="cpErr" role="alert" hidden></p>
      <p style="font-size:12.5px;text-align:center;margin:14px 0 0;color:var(--ink)">${p === 'combo' ? LOCK_NOTE.combo : (o.items || [p]).includes('card') ? LOCK_NOTE.card : LOCK_NOTE[(o.items || [p])[0]] || LOCK_NOTE.card}</p>
      <p class="muted" style="font-size:12px;text-align:center;margin:6px 0 0">Thanh toán là bạn đồng ý với <a href="/dieu-khoan" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">Điều khoản</a> và <a href="/hoan-tien" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">Chính sách hoàn tiền</a>.</p>`;
    // mã giảm 100%: giá còn 0đ → thay mã QR bằng nút "Xác nhận kích hoạt", bấm mới kích hoạt
    const qc = $('.qrcard', box);
    if (qc && o.amount <= 0 && o.coupon && !o.received) {
      qc.outerHTML = `<div class="qrcard" style="text-align:center;padding:18px 16px"><p style="margin:0 0 12px;font-weight:600">Mã giảm 100% — không cần chuyển khoản</p><button type="button" class="btn" id="cpOk">Xác nhận kích hoạt</button></div>`;
      $('#cpOk', box).onclick = async (e) => {
        e.target.disabled = true;
        try { orders[sel] = (await post(sel, { confirm: true })).order; render(); } catch (err) { e.target.disabled = false; toast(err.message, true); }
      };
    }
    modalHead(box); // nút × đứng yên khi cuộn
    $$('[data-tick]', box).forEach((b) => (b.onclick = async () => {
      const k = b.dataset.tick, next = ticks.includes(k) ? ticks.filter((x) => x !== k) : ticks.concat(k);
      if (!next.length) return toast('Chọn ít nhất một món nhé', true);
      const prev = ticks; ticks = next;
      try { const o2 = (await post()).order; orders[o2.product] = o2; sel = o2.product; qrUntil = Date.now() + QR_LIFE; render(); } catch (err) { ticks = prev; toast(err.message, true); }
    }));
    $('#cp', box).onsubmit = async (e) => {
      e.preventDefault();
      try {
        const o = (await post(sel, { coupon: e.target.c.value })).order; // áp mã cho sản phẩm đang chọn
        orders[sel] = o;
        render();
        toast(o.coupon ? 'Đã áp dụng mã giảm giá' : 'Đã bỏ mã giảm giá');
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
          // ngân hàng báo chuyển thiếu: hiện ngay số đã nhận, số còn thiếu và mã QR cho phần còn lại
          if ((r.order.received || 0) !== (x.received || 0)) {
            orders[r.order.product] = r.order; sel = r.order.product; picker = false;
            if (ov) { clearInterval(tick); ov.remove(); ov = null; } // đang ở màn chờ → về màn mã QR
            qrUntil = Date.now() + QR_LIFE;
            render();
            toast(`Đã nhận ${money(r.order.received)} — còn thiếu ${money(r.order.due)}`, true);
            return;
          }
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

// Ô bắt buộc trước khi kích hoạt: ô trên trang (trình sửa thiệp data-k, màn LED data-d) hoặc dữ liệu đã lưu
const PAY_NEED = [['groom.name', 'Chưa nhập tên chú rể'], ['bride.name', 'Chưa nhập tên cô dâu'], ['date', 'Chưa chọn ngày cưới']];
function payMissing(data) {
  const inp = (k) => document.querySelector(`[data-k="${k}"],[data-d="${k}"]`);
  const val = (k) => { const el = inp(k); return el ? el.value.trim() : String(k.split('.').reduce((o, x) => (o || {})[x], data) || '').trim(); };
  const miss = PAY_NEED.filter(([k]) => !val(k));
  if (!miss.length) return miss;
  if (window.onPayMissing) window.onPayMissing(miss.map(([k]) => k)); // trình sửa mở đúng bảng có các ô này
  let first = null;
  miss.forEach(([k, msg]) => {
    const el = inp(k); if (!el) return;
    first = first || el;
    el.classList.add('miss');
    const box = el.closest('.field') || el.parentNode;
    let m = box.querySelector('.miss-msg');
    if (!m) { m = document.createElement('small'); m.className = 'miss-msg'; box.appendChild(m); }
    m.textContent = msg;
    const clear = () => { if (!el.value.trim()) return; el.classList.remove('miss'); m.remove(); el.removeEventListener('input', clear); el.removeEventListener('change', clear); };
    el.addEventListener('input', clear); el.addEventListener('change', clear);
  });
  if (first) toast('Vui lòng nhập đầy đủ thông tin', true);
  else toast('Vui lòng nhập đầy đủ thông tin: ' + miss.map(([k]) => ({ 'groom.name': 'tên chú rể', 'bride.name': 'tên cô dâu', date: 'ngày cưới' })[k]).join(', '), true); // trang không có ô nhập (Thiệp của tôi)
  if (first) { first.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(() => first.focus({ preventScroll: true }), 300); }
  if (!document.getElementById('missCss')) {
    const st = document.createElement('style'); st.id = 'missCss';
    st.textContent = '.field input.miss,.field textarea.miss{border-color:#d6455d!important;box-shadow:0 0 0 3px rgba(214,69,93,.15)!important}.miss-msg{display:block;margin-top:5px;color:#d6455d;font-size:12.5px;font-weight:600}';
    document.head.appendChild(st);
  }
  return miss;
}
