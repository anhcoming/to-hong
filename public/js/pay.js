// Hộp thoại kích hoạt thiệp (dùng ở trang quản lý và trình sửa)
// Luồng: mã QR (hiệu lực 5 phút, có vạch quét chạy; hết hạn thì bấm tạo mã mới) → khách chuyển khoản → SePay báo tiền về → "Đã kích hoạt" tự hiện.
// Cửa sổ hỏi lại trạng thái đơn vài giây một lần; tiền về sớm (chưa bấm nút) thì nhảy thẳng sang "Đã kích hoạt".
// chữ thường đầu câu nhưng giữ chữ viết hoa sẵn (LED): "Màn hình LED tiệc cưới" → "màn hình LED tiệc cưới"
const lcFirst = (s) => String(s || '').charAt(0).toLowerCase() + String(s || '').slice(1);
// Trả tiền là chốt — nói rõ trước khi khách chuyển khoản
const LOCK_NOTE = {
  card: '🔒 Kích hoạt là chốt <b>tên cô dâu chú rể và ngày cưới</b>. Mẫu thiệp, ảnh, chữ… vẫn sửa thoải mái.',
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

// Màn thanh toán kiểu Shopee: trang phủ toàn màn hình, nền xám nhạt, các ô trắng, thanh dưới cố định
const SHP_CSS = `<style>
.shp{position:fixed;inset:0;z-index:1990;overflow:auto;background:#f5f0f1;color:var(--ink,#1f1a1b);animation:payIn .2s ease;-webkit-overflow-scrolling:touch}
[data-theme="dark"] .shp{background:#171214}
.shp-in{max-width:560px;margin:0 auto;padding-bottom:calc(96px + env(safe-area-inset-bottom))}
.shp-hd{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:8px;min-height:54px;padding:6px 10px calc(6px) 6px;padding-top:calc(6px + env(safe-area-inset-top));background:var(--surface,#fff);border-bottom:1px solid var(--line);font-weight:700;font-size:17px}
.shp-back,.shp-close{display:grid;place-items:center;width:40px;height:40px;border:0;border-radius:50%;background:none;color:var(--primary,#d6455d);font-size:26px;line-height:1;cursor:pointer}
.shp-close{margin-left:auto;font-size:16px;color:var(--muted)}
.shp-box{display:block;background:var(--surface,#fff);margin:8px 0;padding:12px 16px}
@media (min-width:600px){.shp-box{margin:10px 12px;border-radius:14px}}
.shp-box h4{margin:0 0 4px;font-size:14px;font-weight:700}
.shp-box.shp-wed{display:flex;align-items:center;gap:12px;font-size:13px;line-height:1.4;color:var(--muted)}.shp-wed b{display:block;font-size:15px;color:var(--ink,#1f1a1b)}.shp-wed svg{flex:none;width:22px;height:22px;fill:none;stroke:var(--primary,#d6455d);stroke-width:1.8;stroke-linejoin:round}
.shp-it{display:flex;gap:11px;align-items:center;width:100%;padding:10px 0;border:0;border-top:1px solid var(--line);background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}
.shp-it:first-of-type{border-top:0}.shp-it.have,.shp-it:disabled{cursor:default}
.shp-ck{flex:none;width:21px;height:21px;border-radius:6px;border:2px solid #d9c6c9;display:grid;place-items:center;color:#fff;font-size:12px;font-weight:800;box-sizing:border-box}
.shp-ck.on{background:var(--primary,#d6455d);border-color:var(--primary,#d6455d)}.shp-ck.dis{background:#cfc3c5;border-color:#cfc3c5}
.shp-th{flex:none;width:52px;height:52px;border-radius:10px;box-shadow:0 0 0 1px rgba(0,0,0,.06);background:linear-gradient(135deg,#3b2b2f,#8a5a63) center/cover}
.shp-tx{flex:1;min-width:0}.shp-tx b{display:block;font-size:14px}.shp-tx small{display:block;margin-top:3px;color:var(--muted);font-size:12px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.shp-pr{flex:none;text-align:right;font-size:14px;font-weight:700;color:var(--primary,#d6455d);white-space:nowrap}.shp-pr em{font-style:normal;color:var(--muted);font-weight:600;font-size:12.5px}
.shp-cp{display:flex;flex-wrap:wrap;align-items:center;gap:8px}.shp-cp label{flex:none;font-size:13.5px;font-weight:600}
.shp-cp input{flex:1;min-width:0;height:38px;padding:0 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg,#fff);color:inherit;font:inherit;font-size:14px;text-transform:uppercase}
.shp-cp input::placeholder{text-transform:none}.shp-cp input.bad{border-color:#c0392b}.shp-cp .cp-err{flex-basis:100%;margin:0}
.shp-ln{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:6px 0;font-size:13.5px}.shp-ln>span:last-child{color:var(--muted)}
.shp-ln .g{color:#1f8a5b!important;font-weight:600}.shp-ln.tot{border-top:1px dashed var(--line);margin-top:4px;padding-top:10px}.shp-ln.tot b:last-child{color:var(--primary,#d6455d);font-size:16px}
.shp-tag{display:inline-block;margin-left:6px;padding:0 5px;border:1px solid var(--primary,#d6455d);border-radius:4px;color:var(--primary,#d6455d);font-size:10.5px;font-weight:700;vertical-align:1px}
.shp-pay{display:flex;align-items:center;gap:12px;padding:6px 0;font-size:12.5px;color:var(--muted)}.shp-pay span{flex:1}.shp-pay b{display:block;font-size:14px;color:var(--ink,#1f1a1b)}.shp-pay svg{flex:none;width:22px;height:22px;fill:none;stroke:var(--primary,#d6455d);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.shp-pay i{flex:none;width:20px;height:20px;border-radius:50%;border:6px solid var(--primary,#d6455d);box-sizing:border-box}
.shp-fine{margin:6px 16px 0;color:var(--muted);font-size:11.5px;line-height:1.55}.shp-fine a{color:inherit}
.shp-bar{position:fixed;left:0;right:0;bottom:0;z-index:3;display:flex;align-items:center;justify-content:flex-end;gap:12px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:var(--surface,#fff);border-top:1px solid var(--line);box-shadow:0 -6px 20px rgba(120,40,50,.06)}
@media (min-width:600px){.shp-bar{left:50%;right:auto;width:560px;transform:translateX(-50%);border-radius:16px 16px 0 0}}
.shp-bar .t{text-align:right;font-size:12.5px;color:var(--muted)}.shp-bar .t b{display:block;font-size:20px;color:var(--primary,#d6455d)}.shp-bar .t small{color:#1f8a5b;font-weight:600}
.shp-go{flex:none;height:48px;padding:0 26px;border:0;border-radius:12px;background:var(--primary,#d6455d);color:#fff;font:inherit;font-size:15px;font-weight:700;cursor:pointer}
.shp-go.soft{flex:1;background:var(--primary-soft,#fbe5e9);color:var(--primary,#d6455d)}.shp-go:disabled{opacity:.6}
.shp-st{display:flex;justify-content:space-between;padding:12px 16px;background:var(--surface,#fff);font-size:12px;color:var(--muted)}.shp-st b{color:var(--primary,#d6455d)}
.shp-amt{margin-top:8px;font-family:var(--serif);font-size:28px;font-weight:700;color:var(--primary,#d6455d)}
</style>`;

window.openPayModal = async function (cardId, onDone, product = 'card') {
  // kích hoạt là chốt tên + ngày cưới → thiếu thì báo chung một dòng, còn ô thiếu hiện chữ đỏ ngay dưới ô (máy chủ cũng chặn)
  {
    let data = null;
    try { data = (await api(`/api/cards/${cardId}`)).card.data; } catch {}
    if (data && payMissing(data).length) return;
  }
  // Màn thanh toán chung: tick thiệp / màn LED / slide (món đã có hiện ✓ xám). Máy chủ chọn sản phẩm theo món đã tick:
  // một món = đơn món đó, nhiều món = một đơn gộp (cộng giá lẻ). Một mã QR.
  let cardInfo = null, M = window.META || null;
  try { [cardInfo, M] = await Promise.all([api(`/api/cards/${cardId}`).then((r) => r.card), M && M.ledPrice ? M : api('/api/meta')]); } catch (e) { return toast(e.message, true); }
  const KEYS = ['card', 'led', 'video'];
  const HAVE = { card: !!cardInfo.paid, led: !!(cardInfo.led.paid || cardInfo.led.prepaid), video: !!(cardInfo.video.paid || cardInfo.video.prepaid) };
  const PRICE = { card: M.price, led: M.ledPrice, video: M.videoPrice };
  const TITLE = { card: ['Thiệp cưới online', 'Mời khách không giới hạn, đổi mẫu thoải mái'], led: ['Màn hình LED', 'Link chiếu ở tiệc + tải MP4'], video: ['Slide ảnh cưới', 'Dựng video từ ảnh, tải MP4 Full HD'] };
  // món tick sẵn = đúng thứ khách vừa bấm mua: "Gửi khách · 99k" → chỉ thiệp; màn LED / slide → món đó;
  // 'all' ("Lấy cả bộ") → cả 3; mảng (mở lại đơn ở trang Đơn hàng) → đúng các món của đơn. Khách vẫn tự tick thêm được.
  let ticks = (Array.isArray(product) ? product : product === 'all' ? KEYS : [product]).filter((k) => KEYS.includes(k) && !HAVE[k]);
  if (!ticks.length) ticks = KEYS.filter((k) => !HAVE[k]);
  if (!ticks.length) return toast('Thiệp, màn LED và slide của bạn đều đã kích hoạt', true);
  const orders = {};
  const post = (_p, extra = {}) => api(`/api/cards/${cardId}/order`, { method: 'POST', body: { items: ticks, ...extra } });
  let sel;
  try { const o = (await post()).order; orders[o.product] = o; sel = o.product; } catch (e) { return toast(e.message, true); }
  // đã chuyển thiếu cho một đơn: giữ nguyên đơn đó (chuyển nốt phần còn thiếu), không cho đổi món giữa chừng
  const part = Object.values(orders).find((x) => x.received);
  const data = { get order() { return orders[sel]; }, set order(o) { orders[o.product] = o; } };
  // Màn thanh toán kiểu Shopee (public/mock-thanh-toan-shopee.html): trang phủ toàn màn hình, 2 bước
  //   'cart' — Thanh toán: đám cưới · các món có ô tick · mã giảm giá · chi tiết thanh toán · phương thức · thanh dưới "Tổng + Đặt hàng"
  //   'qr'   — Chờ thanh toán: mã QR (hết hạn 5 phút) · ngân hàng · đơn gồm · "Tôi đã chuyển khoản" → màn chờ
  let timer = null, tick = null, ov = null, root = null;
  const QR_LIFE = 5 * 60e3; // mã QR hiệu lực 5 phút (đủ để mở app ngân hàng, đăng nhập, xác thực) — hết thì bấm tạo mã mới
  let qrUntil = Date.now() + QR_LIFE, qrTick = null;
  let waitStart = Object.values(orders).some((o) => o.claimedAt && !o.received) ? Date.now() : 0; // đã báo chuyển từ trước → mở lại là vào màn chờ luôn
  const SLOW = 120e3;
  let step = part || waitStart ? 'qr' : 'cart'; // đã chuyển thiếu / đã báo chuyển: mở thẳng màn mã QR
  const prevOverflow = document.body.style.overflow;

  const closeAll = () => {
    clearInterval(timer); clearInterval(tick); clearInterval(qrTick);
    if (ov) ov.remove();
    ov = null;
    if (root) root.remove();
    root = null;
    document.body.style.overflow = prevOverflow;
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => { if (e.key === 'Escape' && !ov) closeAll(); };
  const overlay = () => {
    if (!ov) { ov = document.createElement('div'); ov.className = 'pay-wait'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); document.body.appendChild(ov); }
    return ov;
  };

  // kích hoạt xong: không mở màn chúc mừng toàn trang — đóng màn thanh toán, báo một dòng, ở lại / về màn của sản phẩm vừa kích hoạt
  const paid = () => {
    const o = data.order;
    clearInterval(timer); clearInterval(tick);
    closeAll();
    toast(`Đã kích hoạt ${lcFirst(o.productName)} 🎉`);
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

  // ảnh nhỏ từng món (như ảnh sản phẩm trong giỏ Shopee)
  const THUMB = {
    card: cardInfo.cover ? cardInfo.cover.split('#')[0] : `/demo/cover-${cardInfo.template}-${cardInfo.palette}.jpg`,
    led: `/demo/lposter-${cardInfo.led.palette || 'bac'}-${cardInfo.led.effect || 'dembac'}.jpg`,
    video: `/demo/vposter-${cardInfo.video.template || 'sen'}.jpg`,
  };
  const SUB = { card: 'Mời khách không giới hạn', led: 'Link chiếu ở tiệc · tải MP4', video: 'Dạm ngõ · tải MP4 Full HD' };
  const WD = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dateText = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); return m ? `${WD[new Date(+m[1], m[2] - 1, +m[3]).getDay()]} ${m[3]}/${m[2]}/${m[1]}` : ''; };
  const ITEMS = { card: 'Thiệp', led: 'màn LED', video: 'slide' };
  const itemsText = (o) => (o.items || [o.product]).map((k) => ITEMS[k] || k).join(' + ').replace(/^./, (c) => c.toUpperCase());

  const cart = (o) => {
    const p = o.product;
    const retail = (o.items || []).filter((k) => !HAVE[k]).reduce((n, k) => n + PRICE[k], 0);
    const disc = o.discount || 0, first = o.firstOff || 0; // tổng = cộng giá lẻ
    return `<div class="shp-hd"><button type="button" class="shp-back" data-x aria-label="Đóng">‹</button>Thanh toán</div>
      <div class="shp-box shp-wed"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/></svg><div><b>${esc(cardInfo.names || 'Thiệp của bạn')}</b><span>${esc(dateText(cardInfo.date))}</span></div></div>
      <div class="shp-box"><h4>Món đã chọn</h4>
        ${KEYS.map((k) => { const have = HAVE[k], on = have || ticks.includes(k);
          return `<button type="button" class="shp-it${have ? ' have' : ''}" data-tick="${k}"${have || part ? ' disabled' : ''}><span class="shp-ck${on ? ' on' : ''}${have ? ' dis' : ''}">${on ? '✓' : ''}</span><i class="shp-th"${THUMB[k] ? ` style="background-image:url('${esc(THUMB[k])}')"` : ''}></i><span class="shp-tx"><b>${TITLE[k][0]}</b><small>${have ? 'Đã mua' : SUB[k]}</small></span><span class="shp-pr">${have ? '<em>Đã có</em>' : money(PRICE[k])}</span></button>`; }).join('')}
      </div>
      ${p === 'multi' ? '' : `<form class="shp-box shp-cp" id="cp"><label>Mã giảm giá</label><input name="c" placeholder="Nhập mã" value="${esc(o.coupon || '')}" autocomplete="off" aria-describedby="cpErr"><button class="btn sm plain">Áp dụng</button><p class="cp-err" id="cpErr" role="alert" hidden></p></form>`}
      <div class="shp-box"><h4>Chi tiết thanh toán</h4>
        <div class="shp-ln"><span>Tổng tiền hàng</span><span>${money(retail)}</span></div>
        ${first ? `<div class="shp-ln"><span>Ưu đãi khách mới<span class="shp-tag">đơn đầu</span></span><span class="g">−${money(first)}</span></div>` : ''}
        ${disc ? `<div class="shp-ln"><span>Mã ${esc(o.coupon)}</span><span class="g">−${money(disc)}</span></div>` : ''}
        <div class="shp-ln tot"><b>Tổng thanh toán</b><b>${money(o.amount)}</b></div></div>
      <div class="shp-box"><h4>Phương thức thanh toán</h4><div class="shp-pay"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h3v3"/></svg><span><b>Chuyển khoản QR</b>Tiền về là tự kích hoạt</span><i></i></div></div>
      <p class="shp-fine">Thanh toán là bạn đồng ý với <a href="/dieu-khoan" target="_blank" rel="noopener">Điều khoản</a> và <a href="/hoan-tien" target="_blank" rel="noopener">Chính sách hoàn tiền</a>. ${p === 'combo' ? LOCK_NOTE.combo : (o.items || [p]).includes('card') ? LOCK_NOTE.card : LOCK_NOTE[(o.items || [p])[0]] || ''}</p>
      <div class="shp-bar"><div class="t">Tổng (${(o.items || [p]).filter((k) => !HAVE[k]).length} món)<b>${money(o.amount)}</b>${first + disc ? `<small>Tiết kiệm ${money(first + disc)}</small>` : ''}</div>
        ${o.amount <= 0 && o.coupon ? '<button type="button" class="shp-go" id="cpOk">Xác nhận kích hoạt</button>' : '<button type="button" class="shp-go" id="order">Đặt hàng</button>'}</div>`;
  };

  const qrView = (o) => `<div class="shp-hd">${part ? '<button type="button" class="shp-back" data-x aria-label="Đóng">‹</button>' : '<button type="button" class="shp-back" id="toCart" aria-label="Quay lại">‹</button>'}Chờ thanh toán<button type="button" class="shp-close" data-x aria-label="Đóng">✕</button></div>
      <div class="shp-st"><span>Đặt hàng ✓</span><span><b>Thanh toán</b></span><span>Kích hoạt</span></div>
      ${o.received ? `<div class="pay-short" role="alert" style="margin:8px 12px 0"><b>Đã nhận ${money(o.received)} · còn thiếu ${money(o.due)}</b><span>Quét mã bên dưới để chuyển nốt ${money(o.due)}, giữ nguyên nội dung <b>${esc(o.code)}</b>. Đủ tiền là tự kích hoạt.</span></div>` : ''}
      <div class="shp-box" style="text-align:center">
        <div class="muted" style="font-size:13px">Quét mã bằng app ngân hàng</div>
        <div class="qrcard" style="border:0;margin:6px 0 0;padding:6px 0 0">
          <div class="qrbox${Date.now() >= qrUntil ? ' exp' : ''}" id="qrBox"><img src="${esc(o.qr)}" alt="Mã QR chuyển khoản"><span class="scan" aria-hidden="true"></span>
            <div class="qx" id="qrX"><b>Mã QR đã hết hạn</b><button type="button" class="btn sm" id="qrNew">↻ Tạo mã mới</button></div></div>
          <div class="qrt" id="qrT"><i aria-hidden="true"></i><span>Đang chờ thanh toán · còn <b id="qrS">5:00</b></span></div>
        </div>
        <div class="shp-amt">${money(o.received ? o.due : o.amount)}</div>
      </div>
      <div class="shp-box"><div class="qrinfo" style="max-width:none;margin:0;padding:0;border:0">
          <div><span>Ngân hàng</span><b>${esc(o.bank.name)}</b></div>
          <div><span>Số tài khoản</span><b>${esc(o.bank.accountNo)}</b></div>
          <div><span>Chủ tài khoản</span><b>${esc(o.bank.accountName)}</b></div>
          <div><span>Nội dung</span><b class="code">${esc(o.code)}</b></div>
          <div><span>Đơn gồm</span><b>${esc(itemsText(o))}</b></div>
      </div></div>
      <div class="shp-bar"><button type="button" class="shp-go soft" id="claimBtn">Tôi đã chuyển khoản</button></div>`;

  const render = () => {
    const o = data.order;
    if (o.status === 'paid') return paid();
    root.innerHTML = PAY_CSS + SHP_CSS + `<div class="shp-in">${step === 'cart' ? cart(o) : qrView(o)}</div>`;
    root.scrollTop = 0;
    $$('[data-x]', root).forEach((b) => (b.onclick = closeAll));
    if (step === 'cart') {
      $$('[data-tick]', root).forEach((b) => (b.onclick = async () => {
        const k = b.dataset.tick, next = ticks.includes(k) ? ticks.filter((x) => x !== k) : ticks.concat(k);
        if (!next.length) return toast('Chọn ít nhất một món nhé', true);
        const prev = ticks; ticks = next;
        try { const o2 = (await post()).order; orders[o2.product] = o2; sel = o2.product; render(); } catch (err) { ticks = prev; toast(err.message, true); }
      }));
      const cp = $('#cp', root);
      if (cp) {
        cp.onsubmit = async (e) => {
          e.preventDefault();
          try {
            const o2 = (await post(sel, { coupon: e.target.c.value })).order; // áp mã cho các món đang tick
            orders[o2.product] = o2; sel = o2.product;
            render();
            toast(o2.coupon ? 'Đã áp dụng mã giảm giá' : 'Đã bỏ mã giảm giá');
          } catch (err) { // mã sai: báo ngay dưới ô nhập, viền ô đỏ; gõ lại là tắt
            const m = $('#cpErr', root), inp = e.target.c;
            m.textContent = err.message; m.hidden = false; inp.classList.add('bad'); inp.focus();
          }
        };
        cp.c.addEventListener('input', (e) => { const m = $('#cpErr', root); m.hidden = true; e.target.classList.remove('bad'); });
      }
      const go = $('#order', root);
      if (go) go.onclick = () => { step = 'qr'; qrUntil = Date.now() + QR_LIFE; render(); api(`/api/orders/${data.order.code}/place`, { method: 'POST', body: {} }).catch(() => {}); }; // vào mục Chờ thanh toán ở trang Đơn hàng
      const ok = $('#cpOk', root); // mã giảm 100%: giá 0đ → bấm "Xác nhận kích hoạt" mới kích hoạt
      if (ok) ok.onclick = async () => {
        ok.disabled = true;
        try { const o2 = (await post(sel, { confirm: true })).order; orders[o2.product] = o2; sel = o2.product; render(); } catch (err) { ok.disabled = false; toast(err.message, true); }
      };
      return;
    }
    const back = $('#toCart', root); if (back) back.onclick = () => { step = 'cart'; render(); };
    $('#claimBtn', root).onclick = async (e) => {
      e.target.disabled = true;
      try { const r = await api(`/api/orders/${data.order.code}/claim`, { method: 'POST', body: {} }); orders[r.order.product] = r.order; } catch {}
      e.target.disabled = false;
      waitStart = Date.now(); waiting();
    };
    // đồng hồ hiệu lực mã QR: hết giờ → làm mờ mã, hiện "Mã QR đã hết hạn" + nút tạo mã mới
    const qrRun = () => {
      const qb = $('#qrBox', root), qs = $('#qrS', root), qt = $('#qrT', root); if (!qb || !qs || !qt) return clearInterval(qrTick);
      const left = Math.max(0, Math.ceil((qrUntil - Date.now()) / 1000));
      qs.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
      qt.classList.toggle('low', left <= 30);
      if (!left && !qb.classList.contains('exp') && !qb.classList.contains('ld')) qb.classList.add('exp');
      if (!left) qt.style.display = 'none';
    };
    clearInterval(qrTick); qrRun(); qrTick = setInterval(qrRun, 250);
    $('#qrNew', root).onclick = async () => {
      const qb = $('#qrBox', root); qb.classList.remove('exp'); qb.classList.add('ld');
      $('#qrX', root).innerHTML = '<span class="ring" aria-hidden="true"></span><b>Đang tạo mã mới…</b>';
      try {
        const [o2] = await Promise.all([post(sel, data.order.coupon ? { coupon: data.order.coupon } : {}), new Promise((r) => setTimeout(r, 900))]);
        orders[o2.order.product] = o2.order; sel = o2.order.product;
      } catch (err) { toast(err.message, true); }
      qrUntil = Date.now() + QR_LIFE;
      render();
    };
  };

  root = document.createElement('div');
  root.className = 'shp'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Thanh toán');
  document.body.appendChild(root);
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', onKey);
  render();
  if (waitStart && data.order.status !== 'paid') { const c = Object.values(orders).find((x) => x.claimedAt); if (c) sel = c.product; waiting(); }
  // Hỏi lại trạng thái vài giây một lần: SePay báo tiền về là đơn chuyển sang "paid"
  timer = setInterval(async () => {
    if (!root && !ov) return clearInterval(timer);
    if (document.hidden) return;
    // hỏi mọi đơn đã mở trong lần này: khách chuyển theo mã nào thì báo theo đơn đó
    for (const x of Object.values(orders)) {
      try {
        const r = await api(`/api/orders/${x.code}`, { quiet: true });
        if (r.order.status === 'paid') { data.order = r.order; sel = r.order.product; return paid(); }
        // ngân hàng báo chuyển thiếu: hiện ngay số đã nhận, số còn thiếu và mã QR cho phần còn lại
        if ((r.order.received || 0) !== (x.received || 0)) {
          orders[r.order.product] = r.order; sel = r.order.product; step = 'qr';
          if (ov) { clearInterval(tick); ov.remove(); ov = null; } // đang ở màn chờ → về màn mã QR
          qrUntil = Date.now() + QR_LIFE;
          render();
          toast(`Đã nhận ${money(r.order.received)} — còn thiếu ${money(r.order.due)}`, true);
          return;
        }
      } catch {}
    }
  }, 3000);
};

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
