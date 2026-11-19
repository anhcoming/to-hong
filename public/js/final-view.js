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
.fvb{width:100%;max-width:980px;margin:4px auto 0}
body.fv-on #scrub{display:none!important} /* video: thanh phát cũ thay bằng thanh chia đoạn theo cảnh */
.fv-play{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;column-gap:14px;row-gap:6px;align-items:center;width:100%} /* hàng 1: nút · thanh tua · giờ · toàn màn; hàng 2: tên cảnh dưới đúng từng đoạn */
.fv-play .pp{all:unset;cursor:pointer;flex:none;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:var(--primary);color:#fff;font-size:14px;box-shadow:0 8px 18px rgba(214,69,93,.32)}
.fv-play .pp:focus-visible,.fv-play .fs:focus-visible{outline:2px solid var(--primary);outline-offset:3px}
.fv-segs{grid-column:2;grid-row:1;min-width:0;display:flex;gap:4px}
.fv-labs{grid-column:2;grid-row:2;min-width:0;display:flex;gap:4px}
.fv-play>.pp{grid-column:1;grid-row:1}.fv-play>.tm{grid-column:3;grid-row:1}.fv-play>.fs{grid-column:4;grid-row:1}
.fv-lab{all:unset;flex:var(--w) 1 0;min-width:10px;cursor:pointer;overflow:hidden}
.fv-seg{all:unset;flex:var(--w) 1 0;min-width:10px;cursor:pointer;padding:8px 0}
.fv-seg .bar{height:8px;border-radius:6px;background:color-mix(in srgb,var(--line) 70%,#cdbfc1);overflow:hidden;transition:height .15s}
.fv-seg:hover .bar{height:10px;margin-top:-1px}
.fv-seg .bar i{display:block;height:100%;width:0;background:var(--primary);border-radius:6px}
.fv-lab b{display:block;font-size:12.5px;font-weight:600;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fv-lab small{display:block;font-size:11px;color:var(--muted);font-variant-numeric:tabular-nums}
.fv-lab.on b{color:var(--primary)}
.fv-seg:focus-visible .bar{outline:2px solid var(--primary);outline-offset:2px}
.fv-play .tm{flex:none;font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}
.fv-play .fs{all:unset;cursor:pointer;flex:none;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:var(--surface,#fff);box-shadow:0 0 0 1px var(--line),0 6px 14px rgba(60,30,40,.08);font-size:15px}
.fv-line{display:flex;flex-wrap:wrap;justify-content:center;gap:6px 18px;margin-top:18px;padding-top:14px;border-top:1px dashed color-mix(in srgb,var(--line) 60%,#d9c8cb);color:var(--muted);font-size:13px}
.fv-line span{display:inline-flex;align-items:center;gap:6px}.fv-line b{color:var(--ink);font-weight:600}
@media (max-width:600px){
  .fv-play{column-gap:10px;row-gap:0}.fv-play .pp{width:40px;height:40px}.fv-play .fs{width:34px;height:34px;margin:0}
  .fv-segs{gap:3px;padding:0}.fv-labs{display:none}.fv-play .tm{padding:0;font-size:12px}
  .fv-line{margin-top:14px;padding-top:12px;gap:6px 14px;font-size:12.5px}
}
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
    // dưới khung chiếu: thanh phát chia đoạn theo cảnh (tên + mốc giờ dưới từng đoạn, bấm để tua) + một dòng thông tin
    const stage = o.stage && document.querySelector(o.stage);
    let bar = document.getElementById('fvb');
    if (stage && !bar) { bar = document.createElement('div'); bar.id = 'fvb'; bar.className = 'fvb'; stage.appendChild(bar); playLoop(bar); }
    if (bar) {
      bar.innerHTML = `<div class="fv-play"><button type="button" class="pp" data-pl="pp" aria-label="Tạm dừng">❚❚</button><div class="fv-segs" role="group" aria-label="Các cảnh — bấm để tua"></div><span class="tm">0:00 / 0:00</span><button type="button" class="fs" data-pl="fs" title="Xem toàn màn hình" aria-label="Xem toàn màn hình">⛶</button><div class="fv-labs"></div></div>
        ${(o.facts || []).some((f) => f && f[1]) ? `<div class="fv-line">${o.facts.filter((f) => f && f[1]).map(([ic, tx]) => `<span><i aria-hidden="true" style="font-style:normal">${ic}</i><b>${esc(tx)}</b></span>`).join('')}</div>` : ''}`;
      bar.dataset.key = '';
    }
    // nhãn 🔒 Đã chốt ở dòng nhỏ dưới tên (thay chữ "Đã kích hoạt" / "Đã lưu")
    const sv = document.getElementById('saved');
    if (sv && !document.querySelector('.fv-lock')) sv.insertAdjacentHTML('afterend', '<span class="fv-lock">🔒 Đã chốt</span>');
    window.dispatchEvent(new Event('resize')); // khung xem đổi cỡ theo bố cục mới
  };
  // o.player() trả { pos, total, seek, paused, toggle, chapters? } hoặc null (khung chưa sẵn sàng);
  // các cảnh: player.chapters() (màn LED: theo khung đang chiếu) hoặc o.chapters (video) — [{ name, t }]
  function playLoop(bar) {
    const P = () => { try { return (o.player && o.player()) || null; } catch (e) { return null; } };
    const chs = (p) => { const c = (p.chapters ? p.chapters() : o.chapters) || []; return c.length ? c : [{ name: '', t: 0 }]; };
    bar.addEventListener('click', (e) => {
      const p = P(); if (!p) return;
      const b = e.target.closest('[data-pl]');
      if (b) return b.dataset.pl === 'pp' ? p.toggle() : o.onFull && o.onFull();
      const lb = e.target.closest('.fv-lab'); if (lb) return p.seek(+lb.dataset.t); // bấm tên cảnh: về đầu cảnh
      const sg = e.target.closest('.fv-seg'); if (!sg) return;
      // bấm vào thanh của đoạn: tua đúng chỗ
      const t0 = +sg.dataset.t, d = +sg.dataset.d, r = sg.querySelector('.bar').getBoundingClientRect();
      p.seek(t0 + Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * d);
    });
    const tick = () => {
      if (!bar.isConnected) return;
      const p = P(), segs = bar.querySelector('.fv-segs');
      if (p && segs) {
        const T = p.total(), t = p.pos(), ch = chs(p);
        const key = T + '|' + ch.map((c) => c.t + c.name).join(',');
        if (bar.dataset.key !== key) {
          bar.dataset.key = key;
          segs.innerHTML = ch.map((c, i) => { const d = Math.max(0.1, (i + 1 < ch.length ? ch[i + 1].t : T) - c.t);
            return `<button type="button" class="fv-seg" style="--w:${d.toFixed(2)}" data-t="${c.t}" data-d="${d}" data-i="${i}" title="${esc(c.name)} · ${mmss(c.t)}"><div class="bar"><i></i></div></button>`; }).join('');
          const labs = bar.querySelector('.fv-labs');
          if (labs) labs.innerHTML = ch.map((c, i) => { const d = Math.max(0.1, (i + 1 < ch.length ? ch[i + 1].t : T) - c.t);
            return `<button type="button" class="fv-lab" style="--w:${d.toFixed(2)}" data-t="${c.t}"><b>${esc(c.name)}</b><small>${mmss(c.t)}</small></button>`; }).join('');
        }
        let on = 0;
        segs.querySelectorAll('.fv-seg').forEach((sg, i) => {
          const t0 = +sg.dataset.t, d = +sg.dataset.d, f = Math.max(0, Math.min(1, (t - t0) / d));
          sg.querySelector('i').style.width = (f * 100).toFixed(1) + '%';
          if (t >= t0 - 0.05) on = i;
        });
        segs.querySelectorAll('.fv-seg').forEach((sg, i) => sg.classList.toggle('on', i === on));
        bar.querySelectorAll('.fv-lab').forEach((lb, i) => lb.classList.toggle('on', i === on));
        bar.querySelector('.fv-play .tm').textContent = `${mmss(t)} / ${mmss(T)}`;
        const pp = bar.querySelector('.fv-play .pp'), ps = p.paused();
        if (pp.dataset.p !== String(ps)) { pp.dataset.p = String(ps); pp.textContent = ps ? '▶' : '❚❚'; pp.setAttribute('aria-label', ps ? 'Phát' : 'Tạm dừng'); }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  // chỉ gắn thanh phát (phát / dừng, thanh chia đoạn theo cảnh để tua, thời gian, toàn màn hình) dưới khung xem — dùng cả lúc
  // màn LED chưa chốt (đang sửa). finalView() gọi sau dùng lại đúng thanh này.
  window.finalView.player = function (opts) {
    o = Object.assign({}, o, opts);
    if (!document.getElementById('fvCss')) { const s = document.createElement('style'); s.id = 'fvCss'; s.textContent = CSS; document.head.appendChild(s); }
    const stage = o.stage && document.querySelector(o.stage);
    if (!stage || document.getElementById('fvb')) return;
    const bar = document.createElement('div'); bar.id = 'fvb'; bar.className = 'fvb';
    bar.innerHTML = `<div class="fv-play"><button type="button" class="pp" data-pl="pp" aria-label="Tạm dừng">❚❚</button><div class="fv-segs" role="group" aria-label="Các cảnh — bấm để tua"></div><span class="tm">0:00 / 0:00</span><button type="button" class="fs" data-pl="fs" title="Xem toàn màn hình" aria-label="Xem toàn màn hình">⛶</button><div class="fv-labs"></div></div>`;
    bar.dataset.key = '';
    stage.appendChild(bar); playLoop(bar);
    window.dispatchEvent(new Event('resize'));
  };
  window.finalView.at = function () {}; // (cũ) trình sửa video gọi theo thời gian phát — thanh chia đoạn tự theo dõi
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
