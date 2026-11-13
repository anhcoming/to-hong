// Máy dựng mẫu "canvas" nhập từ mehappy.vn (tools/mehappy-import.js → templates/mh/<slug>.json).
// Bản gốc là trang kéo thả: mỗi khối (section) cao cố định, phần tử con đặt toạ độ tuyệt đối trên khung rộng W (~400px),
// trên điện thoại hẹp hơn W thì khung nằm giữa và bị cắt hai mép (giống bản gốc). Chữ/ảnh có `initField` được thay bằng
// dữ liệu thiệp (tên, bố mẹ, địa chỉ, ngày giờ, lễ, tài khoản…); ô không có dữ liệu thì ẩn. Các khối động (đếm ngược,
// lịch, album, xác nhận, lưu bút, mừng cưới) dựng lại bằng đúng móc của card.js (#rsvpForm, #wishForm, .ph[data-i]…).
const { esc } = require('./util');
const { inviteWord, matchCase } = require('./carddata');
const { lunarText } = require('./lunar');
const banksMod = require('./banks');
const BANKS = Array.isArray(banksMod) ? banksMod : (banksMod.banks || []);

const px = (v, d = 0) => { if (v === null || v === undefined || v === '') return d; const n = typeof v === 'number' ? v : parseFloat(String(v)); return Number.isFinite(n) ? n : d; };
const arr4 = (v, d = 0) => (Array.isArray(v) ? v.map((x) => px(x, d)) : [px(v, d), px(v, d), px(v, d), px(v, d)]);
const col = (c) => (c && typeof c === 'object' ? `rgba(${c.r},${c.g},${c.b},${c.a === undefined ? 1 : c.a})` : (typeof c === 'string' ? c : ''));
const pad2 = (n) => String(n).padStart(2, '0');
const WD = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const parts = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? { y: m[1], m: m[2], d: m[3] } : null; };
const weekday = (iso) => { const p = parts(iso); return p ? WD[new Date(Date.UTC(+p.y, +p.m - 1, +p.d)).getUTCDay()] : ''; };
const dmy = (iso, sep = '/') => { const p = parts(iso); return p ? `${p.d}${sep}${p.m}${sep}${p.y}` : ''; };
const clock = (t) => (/^\d{2}:\d{2}$/.test(t || '') ? t : '');
const bankName = (bin) => (BANKS.find((b) => b.bin === bin) || {}).name || '';
const qrUrl = (p, who) => (p && p.bin && p.acc ? `https://img.vietqr.io/image/${p.bin}-${encodeURIComponent(p.acc)}-qr_only.png?accountName=${encodeURIComponent(p.holder || '')}&addInfo=${encodeURIComponent('Mung cuoi ' + who)}` : '');
// "10:00 - Chủ Nhật, Ngày 20/12/2026" — định dạng ngày giờ đầy đủ của bản gốc
const fullDT = (iso, t) => { const w = weekday(iso); if (!w) return ''; const c = clock(t); return `${c ? c + ' - ' : ''}${w}, Ngày ${dmy(iso)}`; };
const lunarOf = (iso) => { try { return iso ? lunarText(iso) : ''; } catch (e) { return ''; } };
const HON = /^\s*(ông|bà)\s*[:.]?\s+/i;
const parent = (name, orig) => (name && !HON.test(String(orig).replace(/<[^>]+>/g, '')) ? String(name).replace(HON, '') : name || '');

// ---------- gắn dữ liệu thiệp vào ô có initField ----------
// lễ tiệc: "Tiệc cưới" / "Khai tiệc", không có thì lễ cuối (bỏ dòng giữ chỗ "+ Thêm lễ" của trình sửa)
function partyOf(d) {
  const evs = (d.events || []).filter((e) => e && !/^\+\s/.test(e.name || ''));
  return evs.find((e) => /khai tiệc|tiệc cưới/i.test(e.name)) || evs.find((e) => /tiệc/i.test(e.name)) || evs[evs.length - 1] || null;
}
// trả về chuỗi (có thể rỗng = ẩn ô) hoặc undefined = không gắn, giữ chữ gốc
function bindText(field, ctx, env, orig = '') {
  if (!field || field === 'none') return undefined;
  const d = ctx.d, g = d.groom, b = d.bride;
  const ev = (i) => d.events[i] || null;
  const who = /^bride/.test(field) ? 'bride' : 'groom';
  const dateOf = () => d.date, timeOf = () => d.time;
  // giữ dấu phân cách ngày của bản gốc ("16 . 05 . 2027", "20/12/2026", "20-12-2026")
  const sep = (/^\s*\d{1,2}(\s*[./-]\s*)\d{1,2}\1\d{4}/.exec(String(orig).replace(/<[^>]+>/g, '')) || [])[1] || '/';
  const dmyS = (iso) => dmy(iso, sep);
  switch (field) {
    case 'groom': return ctx.g;
    case 'bride': return ctx.b;
    // bố mẹ: bản gốc thường ghi "Ông:" ở ô riêng và tên trần ở ô này → bỏ "Ông/Bà" đầu tên nếu ô gốc không có
    case 'groomParents.father': return parent(g.father, orig); case 'groomParents.mother': return parent(g.mother, orig);
    case 'brideParents.father': return parent(b.father, orig); case 'brideParents.mother': return parent(b.mother, orig);
    case 'groomLocation': return g.address; case 'brideLocation': return b.address;
    case 'groomDescription': case 'brideDescription': return d.story || undefined;
    case 'location': return (ev(0) && (ev(0).place || ev(0).address)) || ''; // bản gốc: "Tại: Tư gia nhà trai" (nơi tổ chức)
    case 'date': return dmyS(dateOf());
    case 'groomBankInfo.accountHolder': return d.gifts.groom.holder; case 'brideBankInfo.accountHolder': return d.gifts.bride.holder;
    case 'groomBankInfo.accountNumber': return d.gifts.groom.acc; case 'brideBankInfo.accountNumber': return d.gifts.bride.acc;
    case 'groomBankInfo.bankName': return bankName(d.gifts.groom.bin); case 'brideBankInfo.bankName': return bankName(d.gifts.bride.bin);
    default: break;
  }
  let m = /^events\.(\d+)\.(title|dateText|venueLabel|location|lunarDateTime)$/.exec(field);
  if (m) {
    // mẫu có khu địa điểm mà không in tên lễ (tiêu đề viết sẵn "Tiệc cưới sẽ tổ chức tại") → luôn là lễ tiệc,
    // không phụ thuộc thứ tự lễ người dùng nhập
    const e = env.venueParty && /venueLabel|location/.test(m[2]) ? partyOf(d) : ev(+m[1]); if (!e) return '';
    switch (m[2]) {
      case 'title': return e.name; case 'venueLabel': return e.place; case 'location': return e.address;
      case 'dateText': return fullDT(e.date || d.date, e.time); case 'lunarDateTime': return lunarOf(e.date || d.date);
      default: return '';
    }
  }
  m = /^(groom|bride)?(Solar|Lunar)(DateTimeFormat1|DateTime|DateShort|DayOfWeek|Hour|Day|Month|Year|Time)$/.exec(field);
  if (m) {
    const iso = dateOf(), p = parts(iso); if (!p) return '';
    switch (m[2] + m[3]) {
      case 'SolarDateTimeFormat1': return `Ngày ${+p.d} Tháng ${+p.m} Năm ${p.y}`;
      case 'SolarDateTime': return fullDT(iso, timeOf());
      case 'SolarDateShort': return dmyS(iso);
      case 'SolarDayOfWeek': return weekday(iso);
      case 'SolarHour': return clock(timeOf());
      case 'SolarDay': return p.d; case 'SolarMonth': return p.m; case 'SolarYear': return p.y;
      case 'LunarTime': case 'LunarDateTime': return lunarOf(iso);
      default: return '';
    }
  }
  void who;
  return undefined;
}
function bindImage(field, ctx) {
  if (!field || field === 'none') return undefined;
  const d = ctx.d;
  const photos = d.photos || [];
  switch (field) {
    // chân dung riêng: thiệp không có ô này → lấy 2 ảnh cuối album (bản xem thử xếp chân dung của bản gốc vào cuối)
    case 'groomAvatarUrl': return photos.length >= 2 ? photos[photos.length - 2] : (d.cover || photos[0] || '');
    case 'brideAvatarUrl': return photos.length >= 2 ? photos[photos.length - 1] : (d.cover || photos[0] || '');
    case 'groomBankInfo.qrCodeImage': return qrUrl(d.gifts.groom, ctx.g);
    case 'brideBankInfo.qrCodeImage': return qrUrl(d.gifts.bride, ctx.b);
    default: break;
  }
  const m = /^events\.(\d+)\.imageUrl$/.exec(field);
  if (m) return photos[(+m[1] + 2) % Math.max(1, photos.length)] || d.cover || '';
  if (field === 'photos') return photos[0] || '';
  return undefined;
}

// ---------- font ----------
const GENERIC = /^(inherit|initial|serif|sans-serif|cursive|monospace|system-ui|arial|helvetica|times new roman|times|georgia|verdana|tahoma)$/i;
const GOOGLE_ALIAS = { 'Source Sans Pro': 'Source Sans 3' };
function fontCss(fam, env) {
  if (!fam) return '';
  const s = String(fam).trim();
  if (env.fontMap[s]) return `'${s.replace(/\.(ttf|otf|woff2?)$/i, '')}'`; // font file của bản gốc (nháy đơn vì nằm trong style="…")
  // chuỗi CSS: "Quicksand, sans-serif" → ghi nhớ họ Google để nạp
  const first = s.split(',')[0].replace(/["']/g, '').trim();
  if (first && !GENERIC.test(first) && !/\.(ttf|otf)$/i.test(first)) env.google.add(GOOGLE_ALIAS[first] || first);
  return (GOOGLE_ALIAS[first] ? s.replace(first, GOOGLE_ALIAS[first]) : s).replace(/"/g, "'");
}

// ---------- phần tử ----------
// form / danh sách lời chúc rộng quá khung thiết kế (bản gốc đặt lệch) → co lại, chừa lề hai bên bằng nhau
function fitW(p, env) {
  const x = px(p.left), w = px(p.width);
  return x >= 0 && w && env && env.W && x + w > env.W ? { ...p, width: Math.max(120, env.W - 2 * x) } : p;
}
function baseStyle(p, extra = '') {
  const st = [`left:${px(p.left)}px`, `top:${px(p.top)}px`];
  if (p.width !== undefined && p.width !== '' && p.width !== 'auto') st.push(`width:${px(p.width)}px`);
  if (p.height !== undefined && p.height !== '' && p.height !== 'auto') st.push(`height:${px(p.height)}px`);
  const tf = [];
  if (p.rotate) tf.push(`rotate(${px(p.rotate)}deg)`);
  if (p.flipX) tf.push('scaleX(-1)'); if (p.flipY) tf.push('scaleY(-1)');
  if (tf.length) st.push(`transform:${tf.join(' ')}`);
  if (p.opacity !== undefined && p.opacity !== null && p.opacity !== '' && +p.opacity !== 100 && +p.opacity !== 1) st.push(`opacity:${+p.opacity > 1 ? +p.opacity / 100 : +p.opacity}`);
  if (p.zIndex) st.push(`z-index:${px(p.zIndex)}`);
  if (p.hidden || (p.style && p.style.display === 'none')) st.push('display:none');
  const r = p.borderRadius !== undefined ? arr4(p.borderRadius) : (p.radius !== undefined ? arr4(p.radius) : null);
  if (r && r.some((x) => x)) st.push(`border-radius:${r.map((x) => x + 'px').join(' ')}`);
  const bw = p.borderWidth !== undefined ? arr4(p.borderWidth) : null;
  if (bw && bw.some((x) => x) && p.borderColor) st.push(`border-style:${p.borderStyle || 'solid'}`, `border-width:${bw.map((x) => x + 'px').join(' ')}`, `border-color:${col(p.borderColor)}`);
  if (p.backgroundType === 'image' && p.backgroundImage) st.push(`background:url('${esc(p.backgroundImage)}') ${p.backgroundPosition || 'center'}/cover no-repeat`);
  else if (p.backgroundType === 'gradient' && p.gradientColor1) st.push(`background:linear-gradient(${px(p.gradientAngle, 90)}deg,${col(p.gradientColor1)},${col(p.gradientColor2)})`);
  else if (p.backgroundColor && p.backgroundColor !== 'transparent') st.push(`background-color:${col(p.backgroundColor)}`);
  if (p.boxShadow) st.push(`box-shadow:${p.boxShadow}`);
  if (extra) st.push(extra);
  return st.join(';');
}
function textStyle(p, env) {
  const st = [];
  if (p.fontSize) st.push(`font-size:${px(p.fontSize)}px`);
  if (p.fontFamily) st.push(`font-family:${fontCss(p.fontFamily, env)}`);
  if (p.color) st.push(`color:${col(p.color)}`);
  if (p.textAlign) st.push(`text-align:${p.textAlign}`);
  if (p.fontWeight) st.push(`font-weight:${p.fontWeight}`);
  if (p.fontStyle && p.fontStyle !== 'normal') st.push(`font-style:${p.fontStyle}`);
  if (p.lineHeight) st.push(`line-height:${p.lineHeight}`);
  if (p.letterSpacing && px(p.letterSpacing)) st.push(`letter-spacing:${px(p.letterSpacing)}px`);
  if (p.textTransform && p.textTransform !== 'none') st.push(`text-transform:${p.textTransform}`);
  if (p.textDecoration && p.textDecoration !== 'none') st.push(`text-decoration:${p.textDecoration}`);
  if (p.textShadow && p.textShadow.enabled) st.push(`text-shadow:${px(p.textShadow.x)}px ${px(p.textShadow.y)}px ${px(p.textShadow.blur)}px ${col(p.textShadow.color)}`);
  return st.join(';');
}
// sự kiện bấm → thuộc tính data-mh (public/card/mh.js xử lý) hoặc bọc thẻ <a>
function eventAttrs(p, ctx, env) {
  const evs = (p.events || []).filter((e) => e && e.eventType && e.eventType !== 'none');
  if (!evs.length) return { attr: '', href: '' };
  const e = evs[0];
  const d = ctx.d;
  switch (e.eventType) {
    case 'navigate-section': return { attr: ` data-mh="nav" data-to="mh-${esc(e.sectionId || '')}"` };
    case 'open-popup': return { attr: ` data-mh="popup" data-to="mh-pop-${esc(e.popupId || '')}"` };
    case 'open-lightbox': return { attr: ` data-mh="lb" data-src="${esc(e.lightboxImageUrl || '')}"` };
    case 'open-album-modal': return { attr: ' data-mh="album"' };
    case 'toggle-element': return { attr: ` data-mh="toggle" data-show="${esc((e.showElementIds || '').split(/\s+/).filter(Boolean).join(','))}" data-hide="${esc((e.hideElementIds || '').split(/\s+/).filter(Boolean).join(','))}"` };
    case 'open-card': return { attr: ' data-mh="open"' };
    case 'copy-clipboard': {
      const f = e.copyAutoFillField || '';
      const v = f === 'groomBankInfo.accountNumber' ? d.gifts.groom.acc : f === 'brideBankInfo.accountNumber' ? d.gifts.bride.acc : (e.defaultValue || '');
      return { attr: v ? ` data-copy="${esc(v)}"` : '' };
    }
    case 'link': {
      const m = /^events\.(\d+)\.mapUrl$/.exec(e.autoFillField || '');
      let href = e.url || '';
      if (m) { const ev = d.events[+m[1]]; href = ev ? (ev.mapUrl || (ev.address ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(ev.address) : '')) : ''; }
      return { attr: '', href };
    }
    case 'add-to-calendar': {
      const ev = d.events.find((x) => x.name && e.calendarTitle && x.name.trim().toLowerCase() === String(e.calendarTitle).trim().toLowerCase()) || d.events[0];
      const iso = (ev && ev.date) || d.date, p = parts(iso); if (!p) return { attr: '', href: '' };
      const [h, mi] = (clock((ev && ev.time) || d.time) || '09:00').split(':');
      const q = new URLSearchParams({ action: 'TEMPLATE', text: (ev && ev.name) || e.calendarTitle || 'Lễ cưới', dates: `${p.y}${p.m}${p.d}T${h}${mi}00/${p.y}${p.m}${p.d}T${pad2(Math.min(23, +h + 3))}${mi}00`, ctz: 'Asia/Ho_Chi_Minh', location: (ev && (ev.address || ev.place)) || e.calendarLocation || '' });
      return { attr: '', href: 'https://calendar.google.com/calendar/render?' + q };
    }
    case 'call': return { attr: '', href: '' }; // thiệp không có số điện thoại — bỏ
    default: return { attr: '', href: '' };
  }
}
const anim = (p) => (p.displayAnimation && p.displayAnimation.effect ? ' reveal' : '');

function renderText(n, ctx, env) {
  const p = n.props || {};
  let html = p.text === undefined || p.text === null ? '' : String(p.text);
  const bound = bindText(p.initField, ctx, env, html);
  if (bound !== undefined) { if (!bound) return ''; html = esc(bound).replace(/\n/g, '<br>'); }
  else {
    // chữ mời viết sẵn trong mẫu ("TRÂN TRỌNG KÍNH MỜI", "Thân mời tới dự…") → thay bằng lời mời cô dâu chú rể tự đặt
    const own = inviteWord(ctx.d, '');
    if (own) html = html.replace(/trân\s+trọng\s+kính\s+mời|thân\s+mời/iu, (m) => esc(matchCase(own, m)));
  }
  const { attr, href } = eventAttrs(p, ctx, env);
  const tag = href ? 'a' : 'div';
  return `<${tag} class="mh-t${anim(p)}" id="mh-${esc(n.id)}" style="${baseStyle(p)};${textStyle(p, env)}"${attr}${href ? ` href="${esc(href)}" target="_blank" rel="noopener"` : ''}>${html}</${tag}>`;
}
function renderImage(n, ctx, env) {
  const p = n.props || {};
  let src = p.url || '';
  const bound = bindImage(p.initField, ctx);
  const w = px(p.width), h = px(p.height);
  const isQr = /qrCodeImage$/.test(p.initField || '');
  if (bound !== undefined) { if (!bound) return ''; src = bound; }
  if (!src) return '';
  // mã QR: ảnh của bản gốc chỉ là hình giữ chỗ, thay cả ảnh bằng VietQR của thiệp — khung dọc thì dùng bản có logo ngân hàng + tên chủ TK
  if (isQr) {
    if (w && h && h / w > 1.1) src = src.replace('-qr_only.png', '-compact2.png');
    return `<div class="mh-img${anim(p)}" id="mh-${esc(n.id)}" style="${baseStyle(p, 'overflow:hidden;background:#fff')}"><img src="${esc(src)}" alt="Mã QR chuyển khoản" loading="lazy" style="width:100%;height:100%;object-fit:contain"></div>`;
  }
  const { attr, href } = eventAttrs(p, ctx, env);
  const c = p.cropData;
  let inner;
  if (c && c.width && c.height && (c.width < 99 || c.height < 99)) {
    inner = `<img src="${esc(src)}" alt="" loading="lazy" style="position:absolute;width:${(100 / c.width * 100).toFixed(2)}%;height:${(100 / c.height * 100).toFixed(2)}%;left:-${(c.x / c.width * 100).toFixed(2)}%;top:-${(c.y / c.height * 100).toFixed(2)}%;object-fit:fill">`;
  } else inner = `<img src="${esc(src)}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:${p.objectFit || 'cover'};object-position:${p.objectPosition || 'center'}">`;
  if (p.overlayType && p.overlayType !== 'none' && p.overlayColor) inner += `<i class="mh-ov" style="background:${col(p.overlayColor)};opacity:${px(p.overlayOpacity, 30) / 100}"></i>`;
  const isPhotoLb = attr.includes('data-mh="lb"');
  const tag = href ? 'a' : (isPhotoLb ? 'button' : 'div');
  return `<${tag} class="mh-img${anim(p)}" id="mh-${esc(n.id)}" style="${baseStyle(p, 'overflow:hidden')}"${attr}${href ? ` href="${esc(href)}" target="_blank" rel="noopener"` : ''}${tag === 'button' ? ' type="button"' : ''}>${inner}</${tag}>`;
}
function renderIcon(n, ctx, env) {
  const p = n.props || {};
  const svg = String(p.svgCode || '').replace(/<script[\s\S]*?<\/script>/gi, '');
  if (!svg.trim()) return '';
  const { attr, href } = eventAttrs(p, ctx, env);
  const tag = href ? 'a' : 'div';
  return `<${tag} class="mh-icon${anim(p)}" id="mh-${esc(n.id)}" style="${baseStyle(p)};color:${col(p.iconColor) || 'currentColor'}"${attr}${href ? ` href="${esc(href)}" target="_blank" rel="noopener"` : ''}>${svg}</${tag}>`;
}
function renderButton(n, ctx, env) {
  const p = n.props || {};
  const { attr, href } = eventAttrs(p, ctx, env);
  // nhãn nút: bản gốc hay để chữ trong node Text con (p.text / textComponent.text chỉ là "Text" giữ chỗ)
  const kidText = (n.children || []).find((k) => k.type === 'Text' || k.type === 'div');
  const kidIcon = (n.children || []).find((k) => k.type === 'Icon');
  const kt = (kidText && kidText.props) || {};
  const t = { ...(p.textComponent || {}), ...kt };
  const ph = (s) => !s || String(s).trim() === 'Text';
  const text = !ph(p.text) ? String(p.text) : (!ph(kt.text) ? String(kt.text) : (!ph((p.textComponent || {}).text) ? String(p.textComponent.text) : ''));
  const bound = bindText(p.initField || kt.initField, ctx, env);
  const label = bound !== undefined ? esc(bound) : text;
  const ic = { ...(p.iconComponent || {}), ...((kidIcon && kidIcon.props) || {}) };
  const icon = p.showIcon !== false && ic.svgCode ? `<i class="mh-bi" style="width:${px(ic.width, 20)}px;height:${px(ic.height, 20)}px;color:${col(ic.iconColor) || 'currentColor'}">${String(ic.svgCode).replace(/<script[\s\S]*?<\/script>/gi, '')}</i>` : '';
  const bg = p.background && p.background !== 'transparent' ? `background:${col(p.background)};` : (p.backgroundColor ? `background:${col(p.backgroundColor)};` : '');
  const ts = textStyle({ ...t, color: t.color || p.color, fontSize: t.fontSize || p.fontSize, fontFamily: t.fontFamily || p.fontFamily, fontWeight: t.fontWeight || p.fontWeight, textTransform: t.textTransform || p.textTransform, textAlign: undefined }, env);
  const tag = href ? 'a' : 'button';
  const iconRight = (p.iconHorizontalPosition || ic.iconHorizontalPosition) === 'right';
  return `<${tag} class="mh-btn${anim(p)}" id="mh-${esc(n.id)}" style="${baseStyle(p)};${bg}${ts}"${attr}${href ? ` href="${esc(href)}" target="_blank" rel="noopener"` : ' type="button"'}>${iconRight ? '' : icon}<span>${label}</span>${iconRight ? icon : ''}</${tag}>`;
}
function renderContainer(n, ctx, env, kids) {
  const p = n.props || {};
  const { attr, href } = eventAttrs(p, ctx, env);
  return `<div class="mh-box${anim(p)}" id="mh-${esc(n.id)}" style="${baseStyle(p)}"${attr}>${kids}</div>`;
}
function renderLine(n) {
  const p = n.props || {};
  const bw = arr4(p.borderWidth, 1);
  return `<div class="mh-line" id="mh-${esc(n.id)}" style="${baseStyle({ ...p, borderWidth: undefined, height: undefined })};height:0;border-top:${bw[0] || 1}px ${p.borderStyle || 'solid'} ${col(p.borderColor) || '#999'}"></div>`;
}
function renderCount(n, ctx, env) {
  const p = n.props || {};
  const cw = px(p.cellWidth, 60), ch = px(p.cellHeight, 60), gap = px(p.spacing, 10);
  const cell = (k, label) => `<div class="mh-cd-c" style="width:${cw}px;height:${ch}px;${p.cellBackground ? `background:${col(p.cellBackground)};` : ''}${p.cellBorderRadius !== undefined ? `border-radius:${px(p.cellBorderRadius)}px;` : ''}"><b data-cd="${k}">0</b>${p.showLabels === false ? '' : `<small style="color:${col(p.labelColor) || 'inherit'};font-size:${px(p.labelFontSize, 13)}px">${label}</small>`}</div>`;
  return `<div class="mh-cd${anim(p)}" id="mh-${esc(n.id)}" style="${baseStyle(p)};${textStyle(p, env)};gap:${gap}px">${cell('d', 'Ngày')}${cell('h', 'Giờ')}${cell('m', 'Phút')}${cell('s', 'Giây')}</div>`;
}
function renderCalendar(n, ctx, env) {
  const p = n.props || {};
  const dp = ctx.dparts;
  if (!dp) return '';
  const y = +dp.y, m = +dp.m, day = +dp.d;
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); // CN = 0 (bản gốc bắt đầu tuần bằng CN)
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  let cells = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((w) => `<span class="w">${w}</span>`).join('') + '<span></span>'.repeat(first);
  const hl = col(p.highlightColor) || '#c0392b';
  const svg = p.highlightType === 'svg' && p.highlightSvg ? String(p.highlightSvg).replace(/<script[\s\S]*?<\/script>/gi, '') : '';
  for (let i = 1; i <= days; i++) cells += i === day ? `<span class="on" style="color:${svg ? '#fff' : hl}">${svg ? `<i style="color:${hl}">${svg}</i>` : ''}<b>${i}</b></span>` : `<span>${i}</span>`;
  const fs = p.fontSizeMode === 'custom' && p.customFontSize ? `font-size:${px(p.customFontSize)}px;` : '';
  return `<div class="mh-cal${anim(p)}" id="mh-${esc(n.id)}" style="${baseStyle(p)};${textStyle(p, env)};${fs}"><div class="mh-cal-h">Tháng ${m} / ${y}</div><div class="mh-cal-g">${cells}</div></div>`;
}
function renderAlbum(n, ctx, env) {
  const p = n.props || {};
  const photos = ctx.d.photos || [];
  const src = (p.albumImages || []).map((x) => x.url).filter(Boolean);
  const list = photos.length ? photos : src;
  if (!list.length) return '';
  const gap = px(p.albumGap, 10), wp = px(p.wrapperPadding, 0), r = px(p.imageBorderRadius, 0);
  const H = px(p.height, 800), layout = p.albumLayout || 'carousel';
  const ph = (u, i, extra = '') => `<button type="button" class="ph" data-i="${i}" aria-label="Ảnh ${i + 1}" style="background-image:url('${esc(u)}');border-radius:${r}px;aspect-ratio:auto;grid-column:auto;${extra}"></button>`;
  // hero: một ảnh phủ cả khối
  if (layout === 'hero') return `<div class="mh-album mh-album-hero${anim(p)}" id="mh-${esc(n.id)}" style="padding:${wp}px">${ph(list[0], 0, `height:${H - 2 * wp}px`)}</div>`;
  // masonry: hai cột xếp theo chiều cao thật của ảnh, cắt ở chiều cao khối như bản gốc
  if (layout === 'masonry') {
    const items = list.map((u, i) => `<button type="button" class="ph mh-ph-m" data-i="${i}" aria-label="Ảnh ${i + 1}" style="margin-bottom:${gap}px"><img src="${esc(u)}" alt="" loading="lazy" style="border-radius:${r}px"></button>`).join('');
    return `<div class="mh-album mh-album-m${anim(p)}" id="mh-${esc(n.id)}" style="padding:${wp}px;column-gap:${gap}px;height:${H}px">${items}</div>`;
  }
  // lưới: 2 cột, chia đều chiều cao khối
  if (layout === 'grid' || layout === 'grid3') {
    const cols = layout === 'grid3' ? 3 : 2;
    const rows = Math.ceil(list.length / cols);
    const rowH = Math.max(80, Math.floor((H - 2 * wp - gap * (rows - 1)) / rows));
    return `<div class="mh-album mh-album-g${anim(p)}" id="mh-${esc(n.id)}" style="padding:${wp}px;gap:${gap}px;grid-template-columns:repeat(${cols},1fr)">${list.map((u, i) => ph(u, i, `height:${rowH}px`)).join('')}</div>`;
  }
  // băng chuyền (mặc định của bản gốc): trượt ngang có bắt dính, mỗi màn `carouselItemsMobile` ảnh
  const per = Math.max(1, px(p.carouselItemsMobile, 1));
  const items = list.map((u, i) => ph(u, i, `flex:none;width:calc((100% - ${gap * (per - 1)}px) / ${per});height:${H - 2 * wp}px;scroll-snap-align:start`)).join('');
  return `<div class="mh-album mh-album-c${anim(p)}" id="mh-${esc(n.id)}" style="padding:${wp}px;gap:${gap}px;height:${H}px">${items}</div>`;
}
function renderRsvp(n, ctx, env) {
  const p = fitW(n.props || {}, env);
  const gname = ctx.guest ? esc(ctx.guest.name) : '';
  const fields = p.allFields || [];
  const on = (id) => { const f = fields.find((x) => x.fieldId === id); return f ? f.enabled !== false : true; };
  const bg = col(p.buttonBackground) || col(p.buttonColor) || 'var(--accent,#333)';
  return `<form class="form mh-form${anim(p)}" id="rsvpForm" style="${baseStyle(p)}">
    <input name="name" required maxlength="80" value="${gname}" placeholder="Họ và tên *">
    <div class="choice"><label><input type="radio" name="attending" value="yes" checked><span>Có! Tôi sẽ đến</span></label><label><input type="radio" name="attending" value="no"><span>Xin lỗi! Tôi bận mất rồi</span></label></div>
    <div class="row2">${on('numberOfPeople') ? `<select name="count">${[1, 2, 3, 4, 5].map((k) => `<option value="${k}">${k} người</option>`).join('')}</select>` : '<input type="hidden" name="count" value="1">'}${on('guestOf') ? '<select name="side"><option value="trai">Khách chú rể</option><option value="gai">Khách cô dâu</option></select>' : '<input type="hidden" name="side" value="trai">'}</div>
    <input name="note" maxlength="200" placeholder="Nhắn gửi (không bắt buộc)">
    <button class="btn block" type="submit" style="background:${bg};border-color:${bg};font-size:${px(p.buttonFontSize, 16)}px">${esc(p.buttonText || 'Xác nhận')}</button>
    <p class="form-msg" role="status"></p></form>`;
}
function renderWishForm(n, ctx, env) {
  const p = fitW(n.props || {}, env);
  const bg = col(p.buttonBackground) || 'var(--accent,#333)';
  const sug = p.showSuggestedWishes !== false && Array.isArray(p.suggestedWishes) ? p.suggestedWishes.slice(0, 5) : [];
  return `<form class="form mh-form${anim(p)}" id="wishForm" style="${baseStyle(p)}">
    <input name="name" required maxlength="60" value="${ctx.guest ? esc(ctx.guest.name) : ''}" placeholder="Tên của bạn *">
    <textarea name="message" required maxlength="500" rows="3" placeholder="Lời chúc của bạn *"></textarea>
    ${sug.length ? `<div class="mh-sug">${sug.map((s) => `<button type="button" data-mh="sug">${esc(String(s).slice(0, 80))}</button>`).join('')}</div>` : ''}
    <button class="btn block" type="submit" style="background:${bg};border-color:${bg};font-size:${px(p.buttonFontSize, 16)}px">${esc(p.buttonText || 'Gửi lời chúc')}</button>
    <p class="form-msg" role="status"></p></form>`;
}
function renderWishList(n, ctx, env) {
  const p = fitW(n.props || {}, env);
  const ws = env.wishes || [];
  const nf = p.wishNameFontFamily ? `font-family:${fontCss(p.wishNameFontFamily, env)};` : '';
  const cf = p.wishContentFontFamily ? `font-family:${fontCss(p.wishContentFontFamily, env)};` : '';
  return `<div class="wish-list mh-wl${anim(p)}" id="wishList" style="${baseStyle(p)};overflow:auto">${ws.map((w) => `<div class="wish"><b style="${nf}">${esc(w.name)}</b><p style="${cf}">${esc(w.message)}</p></div>`).join('')}</div>`;
}
function renderPopup(n, ctx, env, kids) {
  const p = n.props || {};
  const w = px(p.width, 360), h = px(p.height, 400);
  return `<dialog class="mh-pop" id="mh-pop-${esc(n.id)}" style="width:${Math.min(w, env.W)}px"><button type="button" class="mh-pop-x" data-mh="close" aria-label="Đóng">×</button><div class="mh-pop-c" style="width:${w}px;height:${h}px;${p.backgroundColor ? `background:${col(p.backgroundColor)};` : ''}${p.backgroundImage ? `background-image:url('${esc(p.backgroundImage)}');background-size:cover;` : ''}">${kids}</div></dialog>`;
}
function renderQuick(n, ctx, env) {
  const p = n.props || {};
  const size = px(p.buttonSize, 45);
  const btns = (p.actionButtons || []).map((b) => {
    const { attr, href } = eventAttrs(b, ctx, env);
    const bg = b.backgroundType === 'gradient' ? `linear-gradient(${px(b.gradientAngle, 90)}deg,${col(b.gradientColor1)},${col(b.gradientColor2)})` : (col(b.background) || '#333');
    const tag = href ? 'a' : 'button';
    return `<${tag} class="mh-qa-b" title="${esc(b.tooltipText || '')}" style="width:${size}px;height:${size}px;background:${bg};color:${col(b.iconColor) || '#fff'}"${attr}${href ? ` href="${esc(href)}" target="_blank" rel="noopener"` : ' type="button"'}><i style="width:${px(b.iconSize, 22)}px;height:${px(b.iconSize, 22)}px">${String(b.svgCode || '').replace(/<script[\s\S]*?<\/script>/gi, '')}</i></${tag}>`;
  }).join('');
  if (!btns) return '';
  const trig = String(p.triggerIcon || '').replace(/<script[\s\S]*?<\/script>/gi, '') || '☰';
  return `<div class="mh-qa" id="mh-${esc(n.id)}"><div class="mh-qa-list">${btns}</div><button type="button" class="mh-qa-t" data-mh="qa" aria-label="Menu nhanh" style="width:${size}px;height:${size}px;background:${col(p.triggerBackground) || col(p.background) || '#333'};color:${col(p.triggerIconColor) || col(p.iconColor) || '#fff'}"><i>${trig}</i></button></div>`;
}
function renderVideo(n, ctx, env) {
  const p = n.props || {};
  const m = /(?:youtu\.be\/|v=|embed\/)([\w-]{6,})/.exec(p.videoUrl || '');
  if (!m) return '';
  const poster = p.backgroundImage ? `background:url('${esc(p.backgroundImage)}') center/cover` : 'background:#000';
  return `<button type="button" class="mh-video${anim(p)}" id="mh-${esc(n.id)}" data-mh="yt" data-id="${esc(m[1])}" style="${baseStyle({ ...p, opacity: undefined, backgroundImage: undefined })};${poster}" aria-label="Phát video">▶</button>`;
}
function renderHtml(n, ctx, env) {
  const p = n.props || {};
  const html = String(p.htmlContent || '');
  if (/google\.com\/maps/.test(html)) {
    // bản đồ nhúng của bản gốc → bản đồ của lễ (renderCard ghim toạ độ nếu có link Google Maps)
    const pe = env.venueParty ? partyOf(ctx.d) : null;
    const ev = (pe && pe.address ? pe : null) || ctx.d.events.find((e) => e.address) || null;
    if (!ev) return '';
    return `<div class="mh-map${anim(p)}" id="mh-${esc(n.id)}" style="${baseStyle(p)}"><iframe loading="lazy" title="Bản đồ ${esc(ev.name || '')}" src="https://www.google.com/maps?q=${encodeURIComponent(ev.address)}&amp;output=embed" style="width:100%;height:100%;border:0"></iframe></div>`;
  }
  return ''; // HTML tuỳ ý khác của bản gốc: bỏ (an toàn)
}

function renderNode(n, ctx, env) {
  if (!n || !n.type) return '';
  const p = n.props || {};
  const kids = () => (n.children || []).map((k) => renderNode(k, ctx, env)).join('');
  switch (n.type) {
    case 'Text': case 'div': return renderText(n, ctx, env);
    case 'Image': return renderImage(n, ctx, env);
    case 'Icon': return renderIcon(n, ctx, env);
    case 'Button': return renderButton(n, ctx, env);
    case 'Container': case 'Group': case 'GroupV2': case 'GroupV3': return renderContainer(n, ctx, env, kids());
    case 'Line': return renderLine(n);
    case 'Count': return ctx.d.show.countdown === false ? '' : renderCount(n, ctx, env);
    case 'Calendar': return ctx.d.show.calendar === false ? '' : renderCalendar(n, ctx, env);
    case 'AlbumSection': return ctx.d.show.gallery === false ? '' : renderAlbum(n, ctx, env);
    case 'AlbumModal': return '';
    case 'RSVPForm': return ctx.d.show.rsvp === false || env.rsvpDone ? '' : (env.rsvpDone = true, renderRsvp(n, ctx, env));
    case 'WishForm': case 'Form': return ctx.d.show.wishes === false || env.wishDone ? '' : (env.wishDone = true, renderWishForm(n, ctx, env));
    case 'WishList': return ctx.d.show.wishes === false || env.listDone ? '' : (env.listDone = true, renderWishList(n, ctx, env));
    case 'Popup': return (env.popups.push(renderPopup(n, ctx, env, kids())), '');
    case 'QuickActions': return (env.quick = renderQuick(n, ctx, env), '');
    case 'Video': return renderVideo(n, ctx, env);
    case 'HtmlSelector': return renderHtml(n, ctx, env);
    case 'Input': return '';
    default: return kids();
  }
  void p;
}
function renderSection(s, ctx, env) {
  const p = s.props || {};
  // mảng `sections` của bản gốc còn chứa popup, menu nhanh, album modal ở cấp cao nhất — không phải khối cuộn
  if (s.type === 'AlbumSection') return `<section class="mh-s" id="mh-${esc(s.id)}" style="height:${px(p.height, 0)}px">${renderAlbum(s, ctx, env)}</section>`;
  if (s.type !== 'Sections') return renderNode(s, ctx, env);
  if (p.hidden) return '';
  const st = [`height:${px(p.height, 0)}px`];
  if (p.backgroundType === 'image' && p.backgroundImage) st.push(`background:url('${esc(p.backgroundImage)}') ${p.backgroundPosition || 'center'}/cover no-repeat`);
  else if (p.backgroundColor && p.backgroundColor !== 'transparent') st.push(`background-color:${col(p.backgroundColor)}`);
  if (p.isBrand) return ''; // khối thương hiệu của bản gốc (chân trang "Powered by…") — bỏ
  return `<section class="mh-s" id="mh-${esc(s.id)}" style="${st.join(';')}">${(s.children || []).map((k) => renderNode(k, ctx, env)).join('')}</section>`;
}

// ---------- dữ liệu xem thử lấy từ chữ của bản gốc ----------
function demoFrom(json) {
  const texts = {}; const photos = []; const imgs = [];
  const walk = (n, depth) => {
    if (!n || typeof n !== 'object') return;
    const p = n.props || {};
    if (n.type === 'Text' && p.initField && p.text && !texts[p.initField]) texts[p.initField] = String(p.text).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
    if (n.type === 'AlbumSection') (p.albumImages || []).forEach((x) => x.url && photos.push(x.url));
    if (n.type === 'Image' && p.url) imgs.push({ url: p.url, w: px(p.width), h: px(p.height), field: p.initField || '', depth });
    (n.children || []).forEach((k) => walk(k, depth + 1));
  };
  json.sections.forEach((s) => walk(s, 0));
  const big = imgs.filter((i) => i.w >= 150 && i.h >= 150).sort((a, b) => b.w * b.h - a.w * a.h);
  const avatar = (f) => (imgs.find((i) => i.field === f) || {}).url;
  // thứ tự ảnh xem thử: ảnh album của bản gốc trước (băng chuyền/lưới dùng từ ảnh đầu), ảnh lớn khác, hai chân dung xếp cuối
  const av = [avatar('groomAvatarUrl'), avatar('brideAvatarUrl')].filter(Boolean);
  const pool = [...photos, ...big.map((i) => i.url).filter((u) => !av.includes(u))].filter(Boolean);
  const uniq = [...new Set(pool)].slice(0, 10).concat(av.filter((u, i, a) => a.indexOf(u) === i));
  const events = [];
  for (let i = 0; i < 4; i++) {
    const t = texts[`events.${i}.title`]; if (!t) continue;
    const dt = texts[`events.${i}.dateText`] || '';
    const tm = (/(\d{1,2}):(\d{2})/.exec(dt) || [])[0] || '';
    const dm = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(dt);
    events.push({ name: t, date: dm ? `${dm[3]}-${pad2(dm[2])}-${pad2(dm[1])}` : '2026-12-20', time: tm ? pad2(tm.split(':')[0]) + ':' + tm.split(':')[1] : '', place: texts[`events.${i}.venueLabel`] || '', address: texts[`events.${i}.location`] || '', mapUrl: '' });
  }
  const dateTxt = texts.groomSolarDateTime || texts.solarDateTime || texts['events.0.dateText'] || '';
  const dm = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(dateTxt);
  const demo = { cover: uniq[0] || '', photos: uniq.slice(0, 12) };
  if (events.length) demo.events = events;
  if (dm) demo.date = `${dm[3]}-${pad2(dm[2])}-${pad2(dm[1])}`;
  const tm = /(\d{1,2}):(\d{2})/.exec(dateTxt); if (tm) demo.time = pad2(tm[1]) + ':' + tm[2];
  if (texts.groomDescription) demo.story = texts.groomDescription;
  return demo;
}
// nhóm phong cách theo nhãn của bản gốc
function groupOf(tags) {
  const t = (tags || []).join(' ');
  if (/Cổ phục|Đỏ Trắng/i.test(t)) return 'truyenthong';
  if (/Chibi/i.test(t)) return 'minhhoa';
  if (/Cây|Ngoại cảnh|Hồng Trắng|Hoa/i.test(t)) return 'hoa';
  if (/Sang Trọng/i.test(t)) return 'hoanggia';
  return 'toigian';
}
// màu nhấn = nền nút hay gặp nhất; màu chữ = màu chữ hay gặp nhất
function paletteOf(json) {
  const btn = {}, ink = {};
  const walk = (n) => { if (!n || typeof n !== 'object') return; const p = n.props || {}; if (n.type === 'Button') { const c = col(p.background) || col(p.backgroundColor); if (c && c !== 'transparent') btn[c] = (btn[c] || 0) + 1; } if (n.type === 'Text' && p.color) { const c = col(p.color); ink[c] = (ink[c] || 0) + 1; } (n.children || []).forEach(walk); };
  json.sections.forEach(walk);
  const top = (o, d) => Object.entries(o).sort((a, b) => b[1] - a[1])[0]?.[0] || d;
  const accent = top(btn, '#8a2c3d'), text = top(ink, '#222');
  const bg = (json.sections.find((s) => s.props && s.props.backgroundColor) || { props: {} }).props.backgroundColor || json.page.bg || '#fff';
  return { bg: col(bg), accent, ink: text };
}

function template(meta) {
  const json = meta.json;
  const W = px(json.page.width, 400);
  const raw = JSON.stringify(json.sections);
  const venueParty = raw.includes('"events.0.venueLabel"') && !raw.includes('"events.0.title"');
  const pal = paletteOf(json);
  const fontFaces = Object.entries(json.fontMap || {}).map(([k, u]) => `@font-face{font-family:'${k.replace(/\.(ttf|otf|woff2?)$/i, '')}';src:url('${u}');font-display:swap}`).join('\n');
  // thu họ Google khi dựng thử một lần để điền `fonts` (danh sách tĩnh theo JSON)
  const env0 = { W, fontMap: json.fontMap || {}, google: new Set(), popups: [], wishes: [] };
  const probe = { d: { groom: {}, bride: {}, events: [], photos: [], gifts: { groom: {}, bride: {} }, show: {} }, g: '', b: '', dparts: null };
  try { json.sections.forEach((s) => renderSection(s, probe, env0)); } catch (e) { /* chỉ để gom font */ }
  const google = [...env0.google].map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;500;600;700`).join('&');
  const fonts = google ? `https://fonts.googleapis.com/css2?${google}&display=swap` : '';
  const demo = demoFrom(json);
  const open = json.opening;
  const openMs = open ? (open.duration > 20 ? open.duration : (open.duration || 1.2) * 1000) : 0; // bản gốc ghi ms (1000) hoặc giây (1.2)
  // khối đầu có nút "mở thiệp" (sự kiện open-card: phong bì, bìa) → làm màn mở thiệp, không nằm trong luồng cuộn
  const hasOpen = (n) => !!n && (((n.props || {}).events || []).some((e) => e && e.eventType === 'open-card') || (n.children || []).some(hasOpen));
  const coverIdx = json.sections.findIndex((s) => s.type === 'Sections' && !(s.props && s.props.isBrand) && hasOpen(s));
  const flow = json.sections.filter((s, i) => i !== coverIdx);
  const pageBg = col(json.page.bg) || '#fff';
  return {
    id: meta.id,
    name: meta.name,
    group: meta.group || groupOf(json.source.tags),
    badge: meta.badge || 'Mới',
    desc: meta.desc || `Nhập từ ${json.source.name} (mehappy)`,
    fonts,
    palettes: [{ id: 'goc', name: 'Màu gốc', swatch: [pal.bg, pal.accent], vars: { '--page': col(json.page.bg) || '#fff', '--bg': pal.bg, '--paper': '#fff', '--ink': '#333', '--muted': '#777', '--accent': pal.accent, '--accent-ink': '#fff', '--gold': pal.accent, '--line': '#e5e5e5', '--font-title': 'inherit', '--font-script': 'inherit', '--font-body': 'Arial, sans-serif' } }],
    demo,
    layout: ['canvas'],
    title: (text) => `<h2 class="mh-h">${esc(text)}</h2>`,
    opener(ctx) {
      const p = ctx.dparts;
      if (coverIdx >= 0) {
        const env = { W, venueParty, fontMap: json.fontMap || {}, google: new Set(), popups: [], quick: '', wishes: [] };
        const s = json.sections[coverIdx];
        const bg = (s.props && s.props.backgroundColor && s.props.backgroundColor !== 'transparent') ? col(s.props.backgroundColor) : pageBg;
        return `<div class="opener mh-opener mh-cover" id="opener" style="background:${bg}"><div class="mh-canvas" style="--mh-w:${W}px">${renderSection(s, ctx, env)}</div><button class="mh-sr" id="openBtn" aria-label="Mở thiệp">Mở thiệp</button></div>`;
      }
      if (open && open.renderer === 'split-panels' && open.mobileLeftPanelImage && open.mobileRightPanelImage) {
        return `<div class="opener mh-opener mh-split" id="opener" data-open-ms="${openMs}"><img class="mh-pl" src="${esc(open.mobileLeftPanelImage)}" alt=""><img class="mh-pr" src="${esc(open.mobileRightPanelImage)}" alt=""><div class="mh-oc"><p class="mh-oto">${ctx.guest ? `${esc(inviteWord(ctx.d, 'Thân mời'))} ${esc(ctx.guest.name)}` : esc(inviteWord(ctx.d, 'Thân mời'))}</p><button class="mh-obtn" id="openBtn">Mở thiệp</button></div></div>`;
      }
      return `<div class="opener mh-opener" id="opener"><div class="mh-oc"><p class="mh-onames">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>${p ? `<p class="mh-odate">${+p.d} · ${+p.m} · ${p.y}</p>` : ''}<p class="mh-oto">${ctx.guest ? `${esc(inviteWord(ctx.d, 'Thân mời'))} ${esc(ctx.guest.name)}` : esc(inviteWord(ctx.d, 'Thân mời'))}</p><button class="mh-obtn" id="openBtn">Mở thiệp</button></div></div>`;
    },
    cover: () => '',
    sections: {
      canvas(ctx, opts) {
        const env = { W, venueParty, fontMap: json.fontMap || {}, google: new Set(), popups: [], quick: '', wishes: opts.wishes || [] };
        const body = flow.map((s) => renderSection(s, ctx, env)).join('\n');
        // màn hẹp hơn khung thiết kế (W px): thu nhỏ cả khung cho vừa (zoom giữ nguyên bố cục), thay vì xén hai mép
        const fit = `<script>(function(){var W=${W};function f(){var k=Math.min(1,document.documentElement.clientWidth/W);document.querySelectorAll('.mh-canvas').forEach(function(c){c.style.zoom=k<1?String(k):'';c.classList.toggle('mh-fit',k<1)})}f();document.addEventListener('DOMContentLoaded',f);addEventListener('resize',f)})()</script>`;
        return `<div class="mh-wrap" style="--mh-w:${W}px;background:${col(json.page.bg) || '#fff'}"><div class="mh-canvas">${body}</div></div>${fit}${env.popups.join('')}${env.quick}<script src="/card/mh.js" defer></script>`;
      },
    },
    css: `${fontFaces}
.tpl-${meta.id} .card{max-width:${W}px;overflow:clip}
.tpl-${meta.id} .mh-wrap{position:relative;width:100%;overflow:clip}
.tpl-${meta.id} .mh-canvas{position:relative;width:var(--mh-w);margin-left:calc(50% - var(--mh-w) / 2)}
.tpl-${meta.id} .mh-canvas.mh-fit,.tpl-${meta.id} .mh-cover .mh-canvas.mh-fit{margin:0}
.tpl-${meta.id} .mh-s{position:relative;width:100%;overflow:visible}
.tpl-${meta.id} .mh-s>*,.tpl-${meta.id} .mh-box>*,.tpl-${meta.id} .mh-pop-c>*{position:absolute;box-sizing:border-box}
.tpl-${meta.id} .mh-t{white-space:pre-wrap;overflow-wrap:break-word;line-height:1.5;margin:0;text-decoration:none} /* 1.5 như bản gốc */
.tpl-${meta.id} .mh-t a{color:inherit}
.tpl-${meta.id} .mh-img{display:block;padding:0;border:0;background:none;cursor:default}
.tpl-${meta.id} .mh-img[data-mh],.tpl-${meta.id} [data-mh]{cursor:pointer}
.tpl-${meta.id} .mh-img img{display:block}
.tpl-${meta.id} .mh-ov{position:absolute;inset:0;pointer-events:none}
.tpl-${meta.id} .mh-icon svg{width:100%;height:100%;display:block}
.tpl-${meta.id} .mh-icon svg [fill]:not([fill="none"]),.tpl-${meta.id} .mh-bi svg [fill]:not([fill="none"]),.tpl-${meta.id} .mh-qa-b svg [fill]:not([fill="none"]){fill:currentColor}
.tpl-${meta.id} .mh-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;margin:0;padding:0 10px;border:0;cursor:pointer;text-decoration:none;font:inherit;line-height:1.2;white-space:nowrap}
.tpl-${meta.id} .mh-bi{display:inline-block;flex:none}.tpl-${meta.id} .mh-bi svg{width:100%;height:100%;display:block}
.tpl-${meta.id} .mh-box{overflow:visible}
.tpl-${meta.id} .mh-cd{display:flex;justify-content:center;align-items:stretch}
.tpl-${meta.id} .mh-cd-c{display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1}
.tpl-${meta.id} .mh-cd-c b{font-weight:inherit}.tpl-${meta.id} .mh-cd-c small{margin-top:4px}
.tpl-${meta.id} .mh-cal{padding:8px;overflow:hidden}
.tpl-${meta.id} .mh-cal-h{text-align:center;font-weight:600;margin-bottom:6px}
.tpl-${meta.id} .mh-cal-g{display:grid;grid-template-columns:repeat(7,1fr);gap:2px 0;text-align:center}
.tpl-${meta.id} .mh-cal-g span{position:relative;display:grid;place-items:center;aspect-ratio:1.15}
.tpl-${meta.id} .mh-cal-g .w{font-weight:600;opacity:.75}
.tpl-${meta.id} .mh-cal-g .on b{position:relative;z-index:1;font-weight:700}
.tpl-${meta.id} .mh-cal-g .on i{position:absolute;inset:6% 12%;display:block}.tpl-${meta.id} .mh-cal-g .on i svg{width:100%;height:100%}
.tpl-${meta.id} .mh-album{width:100%;box-sizing:border-box}
.tpl-${meta.id} .mh-album .ph{display:block;width:100%;background-size:cover;background-position:center}
.tpl-${meta.id} .mh-album-g{display:grid;align-content:start}
.tpl-${meta.id} .mh-album-c{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.tpl-${meta.id} .mh-album-c::-webkit-scrollbar{display:none}
.tpl-${meta.id} .mh-album-m{column-count:2;overflow:hidden}
.tpl-${meta.id} .mh-album-m .ph{break-inside:avoid;padding:0;border:0;background:none;aspect-ratio:auto;grid-column:auto}
.tpl-${meta.id} .mh-album-m img{display:block;width:100%}
.tpl-${meta.id} .mh-form{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;margin:0;text-align:left}
.tpl-${meta.id} .mh-form input:not([type=radio]):not([type=checkbox]),.tpl-${meta.id} .mh-form select,.tpl-${meta.id} .mh-form textarea{width:100%;min-width:0;box-sizing:border-box;padding:9px 12px;border:1px solid #d1d5db;border-radius:6px;font:14px/1.4 inherit;background:#fff;color:#111}
.tpl-${meta.id} .mh-form .choice{display:grid;gap:6px;font-size:14px}.tpl-${meta.id} .mh-form .choice label{display:flex;gap:8px;align-items:center;justify-content:flex-start;text-align:left}
.tpl-${meta.id} .mh-form .choice input{flex:none;width:18px;height:18px;margin:0}.tpl-${meta.id} .mh-form .choice span{flex:1;min-width:0}
.tpl-${meta.id} .mh-form .row2>*{min-width:0}
.tpl-${meta.id} .mh-form .row2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.tpl-${meta.id} .mh-form .btn{width:100%;padding:11px;border:1px solid;border-radius:6px;color:#fff;font-weight:600;cursor:pointer}
.tpl-${meta.id} .mh-sug{display:flex;flex-wrap:wrap;gap:6px}.tpl-${meta.id} .mh-sug button{padding:5px 10px;border:1px solid #ddd;border-radius:999px;background:#fff;font-size:12px;cursor:pointer;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tpl-${meta.id} .mh-wl{display:grid;gap:8px;align-content:start;max-height:none}
.tpl-${meta.id} .mh-pop{border:0;border-radius:12px;padding:0;max-width:calc(100vw - 24px);overflow:visible;background:#fff}
.tpl-${meta.id} .mh-pop::backdrop{background:rgba(0,0,0,.55)}
.tpl-${meta.id} .mh-pop-c{position:relative;max-width:100%;overflow:hidden;border-radius:12px}
.tpl-${meta.id} .mh-pop-x{position:absolute;right:-6px;top:-6px;z-index:2;width:30px;height:30px;border:0;border-radius:50%;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.3);font-size:18px;cursor:pointer}
.tpl-${meta.id} .mh-qa{position:fixed;right:max(14px,calc(50% - ${W / 2}px + 14px));bottom:76px;z-index:45;display:flex;flex-direction:column;align-items:flex-end;gap:8px}
.tpl-${meta.id} .mh-qa-list{display:none;flex-direction:column;gap:8px}.tpl-${meta.id} .mh-qa.open .mh-qa-list{display:flex}
.tpl-${meta.id} .mh-qa-b,.tpl-${meta.id} .mh-qa-t{display:grid;place-items:center;border:0;border-radius:50%;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.25);padding:0}
.tpl-${meta.id} .mh-qa-b i,.tpl-${meta.id} .mh-qa-t i{display:block;width:22px;height:22px}.tpl-${meta.id} .mh-qa i svg{width:100%;height:100%;display:block}
.tpl-${meta.id} .mh-video{display:grid;place-items:center;border:0;color:#fff;font-size:40px;cursor:pointer}
.tpl-${meta.id} .mh-video iframe{width:100%;height:100%;border:0}
.tpl-${meta.id} .mh-map{overflow:hidden}
.tpl-${meta.id} .mh-line{pointer-events:none}
.tpl-${meta.id} .mh-opener{background:var(--page,#fff);color:var(--ink);text-align:center;overflow:hidden}
.tpl-${meta.id} .mh-oc{position:relative;z-index:2;padding:24px}
.tpl-${meta.id} .mh-onames{font-size:34px;margin:0 0 8px}.tpl-${meta.id} .mh-odate{margin:0 0 6px;letter-spacing:.1em}.tpl-${meta.id} .mh-oto{margin:0 0 18px;font-size:15px}
.tpl-${meta.id} .mh-obtn{padding:12px 28px;border:0;border-radius:999px;background:var(--accent);color:#fff;font:600 15px/1 inherit;cursor:pointer}
.tpl-${meta.id} .mh-cover{display:block;overflow:auto;text-align:left}
.tpl-${meta.id} .mh-cover .mh-canvas{margin:0 auto;width:var(--mh-w)}
.tpl-${meta.id} .mh-sr{position:absolute;inset:0;width:100%;height:100%;opacity:0;border:0;background:none;cursor:pointer} /* bấm đâu cũng mở, như bản gốc */
.tpl-${meta.id} .mh-split{background:#fff}
.tpl-${meta.id} .mh-split .mh-pl,.tpl-${meta.id} .mh-split .mh-pr{position:absolute;top:0;height:100%;width:50%;object-fit:cover;transition:transform ${(openMs || 1200) / 1000}s ease-in-out}
.tpl-${meta.id} .mh-split .mh-pl{left:0;object-position:right}.tpl-${meta.id} .mh-split .mh-pr{right:0;object-position:left}
.tpl-${meta.id} .mh-split.opening .mh-pl{transform:translateX(-100%)}.tpl-${meta.id} .mh-split.opening .mh-pr{transform:translateX(100%)}
.tpl-${meta.id} .mh-split.opening .mh-oc{opacity:0;transition:opacity .4s}
.tpl-${meta.id} .credit{position:relative}
.tpl-${meta.id} .music-btn{right:max(14px,calc(50% - ${W / 2}px + 14px))}
${meta.css || ''}`,
  };
}

module.exports = { template, demoFrom, bindText, bindImage };
