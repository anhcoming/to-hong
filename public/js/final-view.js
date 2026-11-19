// Màn LED / video đã chốt (trả tiền là chốt, không sửa được nữa): trình sửa chuyển sang bố cục "xem chi tiết" dùng chung —
// khung xem ở trên (máy tính: bên trái), dưới (máy tính: cột phải) là thẻ "Đem đi chiếu" (mở link chiếu, tải MP4, chép link),
// mục "Chia sẻ" (Zalo, Facebook, link + hướng dẫn, lưu MP4), dòng nhắc đã chốt và "Cần sửa gấp? Nhắn Cưới Nha".
// Đã chốt thì không cần chỉnh nên màn LED bỏ luôn thanh chuyển cảnh (khung tự chạy).
// Thanh trên chỉ còn ← + tên đầy đủ + nhãn 🔒 Đã chốt (các nút cũ dời xuống thẻ).
// finalView({ kind: 'led' | 'video', url, names, guide, onMp4, support }) — gọi lại mỗi khi dữ liệu đổi; finalView.off() để tắt.
(function () {
  const CSS = `
body.fv-on #acts,body.fv-on .ur,body.fv-on #scenes,body.fv-on #chip,body.fv-on #saved,body.fv-on #subl .dot{display:none!important}
body.fv-on #ttl{white-space:normal;max-width:none;overflow:visible;line-height:1.25}
.fv-lock{display:inline-flex;align-items:center;gap:4px;margin-left:2px;padding:2px 8px;border-radius:999px;background:#e6f3ec;color:#2f7d5b;font-weight:700;font-size:11.5px;white-space:nowrap}
body.fv-on .studio{display:grid;grid-template-columns:minmax(0,1fr) 380px;grid-template-rows:minmax(0,1fr)}
body.fv-on .studio>.rail,body.fv-on .studio>.side,body.fv-on .studio>.tl{display:none!important}
body.fv-on .studio>.stage,body.fv-on .studio>.stagewrap{grid-column:1;grid-row:1}
body.fv-on .studio>.stagewrap{grid-template-rows:auto;align-content:center}
.fv{grid-column:2;grid-row:1;overflow:auto;padding:16px 16px 28px;border-left:1px solid var(--line);background:var(--bg)}
.fv-sec{margin:0 0 14px;padding:14px;border-radius:18px;background:var(--surface,#fff);box-shadow:0 0 0 1px var(--line)}
.fv-sec h3{margin:0 0 10px;font-size:14.5px}
.fv-acts{display:grid;gap:10px}
.fv-act{display:flex;gap:12px;align-items:center;padding:12px;border-radius:16px;background:var(--surface,#fff);box-shadow:0 0 0 1px var(--line)}
.fv-act .ic{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;font-size:21px;flex:none;background:var(--primary-soft)}
.fv-act b{display:block;font-size:14px}.fv-act span{display:block;font-size:12px;color:var(--muted);line-height:1.4}
.fv-act .btn{margin-left:auto;flex:none}
.fv-link{display:flex;align-items:center;gap:8px;margin-top:10px;padding:8px 8px 8px 12px;border-radius:12px;background:var(--bg);font-size:12.5px}
.fv-link code{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:500 12.5px var(--sans,inherit);color:var(--ink)}
.fv-share{display:flex;justify-content:center;gap:16px;flex-wrap:wrap}
.fv-share button{all:unset;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:5px;font-size:11.5px;color:var(--muted);width:60px;text-align:center}
.fv-share i{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:20px;font-weight:700;color:#fff}
.fv-share button:hover i{filter:brightness(1.08)}.fv-share button:focus-visible i{outline:2px solid var(--primary);outline-offset:2px}
.fv-note{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:16px;background:#e6f3ec;color:#24563f;font-size:13px;line-height:1.45}
.fv-note i{font-style:normal;font-size:18px;line-height:1}
.fv-help{margin:16px 0 0;text-align:center;font-size:12.5px;color:var(--muted)}.fv-help a{color:var(--primary);font-weight:600;text-decoration:none}
[data-theme="dark"] .fv-note{background:#1f3329;color:#bfe3cf}[data-theme="dark"] .fv-lock{background:#1f3329;color:#9fd8b8}
.fvb{width:100%;max-width:980px;display:grid;gap:10px;margin:2px auto 0}
.fv-ch{display:flex;justify-content:safe center;gap:8px;overflow-x:auto;padding:2px;scrollbar-width:none}.fv-ch::-webkit-scrollbar{display:none}
.fv-ch button{all:unset;cursor:pointer;flex:none;display:flex;flex-direction:column;gap:1px;padding:8px 14px;border-radius:14px;background:var(--surface,#fff);box-shadow:0 0 0 1px var(--line);font-size:13px;font-weight:600;color:var(--ink);max-width:200px}
.fv-ch button small{font-weight:500;font-size:11.5px;color:var(--muted);font-variant-numeric:tabular-nums}
.fv-ch button b{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fv-ch button.on{background:var(--primary);color:#fff;box-shadow:none}.fv-ch button.on small{color:rgba(255,255,255,.8)}
.fv-ch button:focus-visible{outline:2px solid var(--primary);outline-offset:2px}
.fv-facts{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}
.fv-facts span{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:var(--surface,#fff);box-shadow:0 0 0 1px var(--line);font-size:12.5px;color:var(--ink)}
.fv-facts i{font-style:normal}
@media (max-width:980px){
  body.fv-on .studio{display:flex;flex-direction:column;overflow:auto}
  .fv{order:5;border-left:0;overflow:visible;padding:4px 12px 28px;background:none}
}`;
  const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let o = {};
  function el() {
    if (!document.getElementById('fvCss')) { const s = document.createElement('style'); s.id = 'fvCss'; s.textContent = CSS; document.head.appendChild(s); }
    let box = document.getElementById('fv');
    if (!box) {
      box = document.createElement('aside'); box.id = 'fv'; box.className = 'fv'; box.setAttribute('aria-label', 'Đem đi chiếu và gửi');
      (document.getElementById('layout') || document.body).appendChild(box);
      box.addEventListener('click', onClick);
    }
    return box;
  }
  function onClick(e) {
    const b = e.target.closest('[data-fv]'); if (!b) return;
    const k = b.dataset.fv;
    if (k === 'mp4') return o.onMp4 && o.onMp4();
    if (k === 'copy') return copyText(o.url, o.kind === 'led' ? 'Đã chép link màn LED' : 'Đã chép link — mở trên Smart TV hoặc máy tính nối TV');
    if (k === 'guide') return copyText(o.guide, 'Đã chép link + hướng dẫn — dán gửi qua Zalo nhé');
    if (k === 'zalo') {
      // điện thoại: bảng chia sẻ của máy (chọn Zalo), gửi kèm link + hướng dẫn; máy tính: chép sẵn lời nhắn rồi mở Zalo
      if (navigator.share) return navigator.share({ title: o.names, text: o.guide }).catch(() => {});
      copyText(o.guide, 'Đã chép lời nhắn — dán vào Zalo nhé');
      return window.open('https://chat.zalo.me/', '_blank', 'noopener');
    }
    if (k === 'fb') return window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(o.url), '_blank', 'noopener,width=640,height=560');
  }
  function supportHref(sp) {
    const z = String((sp && sp.zalo) || '').replace(/\D/g, '');
    if (z.length >= 9 && z !== '0900000000') return 'https://zalo.me/' + z;
    return sp && sp.email && !/@example\.com$/.test(sp.email) ? 'mailto:' + sp.email : '';
  }
  window.finalView = function (opts) {
    o = opts;
    document.body.classList.add('fv-on');
    const led = o.kind === 'led', short = String(o.url || '').replace(/^https?:\/\//, '');
    const help = supportHref(o.support);
    el().innerHTML = `
      <section class="fv-sec"><h3>Đem đi chiếu</h3>
        <div class="fv-acts">
          <div class="fv-act"><div class="ic" aria-hidden="true">${led ? '✨' : '📺'}</div><div><b>${led ? 'Chiếu trên màn LED' : 'Chiếu trên TV'}</b><span>${led ? 'Mở link trên máy nối màn hình, bấm F để toàn màn hình' : 'Mở link bằng trình duyệt của TV / laptop'}</span></div><a class="btn sm plain" href="${esc(o.url)}" target="_blank" rel="noopener">Mở</a></div>
          <div class="fv-act"><div class="ic" aria-hidden="true">💾</div><div><b>Tải MP4 Full HD</b><span>Chép USB cắm ${led ? 'màn LED / TV' : 'TV'}, không cần mạng</span></div><button type="button" class="btn sm" data-fv="mp4">Tải</button></div>
        </div>
        <div class="fv-link"><code>${esc(short)}</code><button type="button" class="btn sm soft" data-fv="copy">Chép link</button></div>
      </section>
      <section class="fv-sec"><h3>Chia sẻ</h3>
        <div class="fv-share">
          <button type="button" data-fv="zalo"><i style="background:#0068ff">Z</i>Zalo</button>
          <button type="button" data-fv="fb"><i style="background:#1877f2">f</i>Facebook</button>
          <button type="button" data-fv="guide"><i style="background:#2b2224">⧉</i>Link + hướng dẫn</button>
          <button type="button" data-fv="mp4"><i style="background:#d6455d">⬇</i>Lưu MP4</button>
        </div>
      </section>
      <div class="fv-note"><i aria-hidden="true">🔒</i><div>${led ? 'Màn LED' : 'Video'} đã kích hoạt nên đã chốt — tên, ngày, chữ${led ? '' : ', ảnh, nhạc'} giữ nguyên như lúc thanh toán.</div></div>
      ${help ? `<p class="fv-help">Cần sửa gấp? <a href="${esc(help)}" target="_blank" rel="noopener">Nhắn Cưới Nha</a></p>` : ''}`;
    // dưới khung chiếu: các cảnh (bấm để nhảy tới) + hàng thông tin — đỡ trống, xem nhanh video / màn LED có gì
    const stage = o.stage && document.querySelector(o.stage);
    let bar = document.getElementById('fvb');
    if (stage && !bar) { bar = document.createElement('div'); bar.id = 'fvb'; bar.className = 'fvb'; stage.appendChild(bar); bar.addEventListener('click', (e) => { const c = e.target.closest('[data-t]'); if (c && o.onSeek) { o.onSeek(+c.dataset.t); window.finalView.at(+c.dataset.t); } }); }
    if (bar) {
      const ch = (o.chapters || []).filter((c) => c && c.name);
      bar.innerHTML = (ch.length > 1 ? `<div class="fv-ch" role="list" aria-label="Các cảnh">${ch.map((c) => `<button type="button" role="listitem" data-t="${c.t}"><small>${mmss(c.t)}</small><b>${esc(c.name)}</b></button>`).join('')}</div>` : '')
        + ((o.facts || []).length ? `<div class="fv-facts">${o.facts.filter((f) => f && f[1]).map(([ic, tx]) => `<span><i aria-hidden="true">${ic}</i>${esc(tx)}</span>`).join('')}</div>` : '');
      lastOn = -1;
    }
    // nhãn 🔒 Đã chốt ở dòng nhỏ dưới tên (thay chữ "Đã kích hoạt" / "Đã lưu")
    const sv = document.getElementById('saved');
    if (sv && !document.querySelector('.fv-lock')) sv.insertAdjacentHTML('afterend', '<span class="fv-lock">🔒 Đã chốt</span>');
    window.dispatchEvent(new Event('resize')); // khung xem đổi cỡ theo bố cục mới
  };
  // cảnh đang chiếu (trình sửa gọi theo thời gian phát)
  let lastOn = -1;
  window.finalView.at = function (t) {
    const bs = document.querySelectorAll('#fvb [data-t]'); if (!bs.length) return;
    let k = 0; bs.forEach((b, i) => { if (t >= +b.dataset.t - 0.05) k = i; });
    if (k === lastOn) return; lastOn = k;
    bs.forEach((b, i) => b.classList.toggle('on', i === k));
    const b = bs[k], box = b.parentElement; if (box) box.scrollTo({ left: b.offsetLeft - box.clientWidth / 2 + b.offsetWidth / 2, behavior: 'smooth' });
  };
  // ngày dạng "Chủ Nhật, 14/02/2027"
  const WD = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  window.finalView.date = function (iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); if (!m) return '';
    return `${WD[new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay()]}, ${m[3]}/${m[2]}/${m[1]}`;
  };
  window.finalView.time = function (hm) { const m = /^(\d{2}):(\d{2})$/.exec(hm || ''); return m ? `${+m[1]} giờ${m[2] !== '00' ? ' ' + m[2] : ''}` : ''; };
  window.finalView.off = function () {
    if (!document.body.classList.contains('fv-on')) return;
    document.body.classList.remove('fv-on');
    const b = document.getElementById('fv'); if (b) b.remove();
    const fb = document.getElementById('fvb'); if (fb) fb.remove();
    const l = document.querySelector('.fv-lock'); if (l) l.remove();
    window.dispatchEvent(new Event('resize'));
  };
})();
