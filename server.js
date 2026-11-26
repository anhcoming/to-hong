require('./lib/env');
const http = require('http');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');
const store = require('./lib/db');
const { db, save, UPLOAD_DIR } = store;
const { rid, json, send, readJson, readBody, httpError, slugify, str, cookies } = require('./lib/util');
const auth = require('./lib/auth');
const google = require('./lib/google');
const facebook = require('./lib/facebook');
const maplink = require('./lib/maplink');
const adminLib = require('./lib/admin');
const adminAuth = require('./lib/adminauth');
// giá, mã giảm giá… sửa trên trang quản trị đè lên config.json. Áp lại mỗi lần nạp dữ liệu từ kho: trên Vercel
// lúc khởi động dữ liệu chưa nạp, và cài đặt đổi ở bản chạy khác phải có hiệu lực ở mọi bản chạy.
store.onLoad(adminLib.applySettings);
const cd = require('./lib/carddata');
const { renderCard, renderNotice, templates, templateList, groups: templateGroups, DEFAULT_TEMPLATE } = require('./lib/render');
const banks = require('./lib/banks');
const ledLib = require('./lib/led');
const { fixNames, isFinal } = require('./lib/fixnames');
const videoLib = require('./lib/video');
const musicLib = require('./lib/music');
const { execFile } = require('child_process');
const Wd = require('./lib/wedding');
const Gs = require('./lib/guests');
const stats = require('./lib/stats');
const discounts = require('./lib/discounts');

store.onLoad(() => { Wd.migrate(); db.cards.forEach((c) => fixNames(c, false)); }); // fixNames: mở lại tên lỡ bị khoá trống (kích hoạt lúc chưa nhập tên) // dữ liệu từ trước khi có sổ tay cưới → gắn vào đám cưới

// Sản phẩm bán: thiệp, màn LED, slide cưới / màn hình dạm ngõ (sản phẩm "video", đều gắn với một thiệp) và combo "Trọn bộ".
// Trọn bộ = kích hoạt thiệp + cộng vào tài khoản chủ thiệp 1 lượt màn LED và 1 lượt video. Khách nháp bao nhiêu
// LED / video cũng được, ưng cái nào thì bấm "Dùng lượt Trọn bộ" trên cái đó (POST /api/cards/:id/redeem).
// Nâng cấp lên Trọn bộ: phần nào của thiệp đã trả (thiệp / màn LED / video) thì trừ đúng giá lẻ phần đó — khách chỉ trả
// phần chênh, không bao giờ trả hai lần cho cùng một thứ. Đủ cả ba rồi thì không cần Trọn bộ nữa.
// prepaid: màn LED / slide đã trả tiền khi chưa tạo (mua ở màn thanh toán chung) — tạo ra là tự kích hoạt (comboUnlock)
const prepaid = (c, k) => !!(c.prepaid && c.prepaid[k]);
const PARTS = [['card', (c) => c.paid, () => cardPrice()], ['led', (c) => (c.led && c.led.paid) || prepaid(c, 'led'), () => config.ledPrice], ['video', (c) => (c.video && c.video.paid) || prepaid(c, 'video'), () => config.videoPrice]];
const PART_KEYS = PARTS.map(([k]) => k);
const partPaid = (c, k) => PARTS.find(([x]) => x === k)[1](c);
const partPrice = (k) => PARTS.find(([x]) => x === k)[2]();
const PART_NAME = { card: 'thiệp', led: 'màn LED', video: 'slide' };
const comboHave = (c) => PARTS.filter(([, paid]) => paid(c)).map(([k]) => k);
const comboCredit = (c) => (c.combo ? 0 : PARTS.reduce((n, [, paid, price]) => n + (paid(c) ? price() : 0), 0));
const missingRetail = (c) => PARTS.reduce((n, [, paid, price]) => n + (paid(c) ? 0 : price()), 0);
const PRODUCTS = {
  card: { name: 'Thiệp cưới online', price: () => cardPrice(), coupons: true, prefix: 'TH', sub: (c) => c },
  led: { name: 'Màn hình LED tiệc cưới', price: () => config.ledPrice, coupons: false, prefix: 'LD', sub: (c) => c.led },
  video: { name: 'Slide / màn hình dạm ngõ', price: () => config.videoPrice, coupons: false, prefix: 'VD', sub: (c) => c.video },
  combo: {
    name: 'Trọn bộ ngày cưới', coupons: false, prefix: 'CB',
    price: (c) => (c ? Math.max(0, comboPrice() - comboCredit(c)) : comboPrice()),
    sub: (c) => ({ paid: !!c.combo }),
  },
  // màn thanh toán chung: khách tick 2 món chưa đủ Trọn bộ (vd. thiệp + màn LED) → một đơn, một mã QR (order.items)
  multi: { name: 'Gói đám cưới', coupons: false, prefix: 'DC', price: (c, o) => ((o && o.items) || []).reduce((n, k) => n + (c && partPaid(c, k) ? 0 : partPrice(k)), 0), sub: () => ({ paid: false }) },
};
// món khách tick ở màn thanh toán → sản phẩm của đơn: đủ cả ba (tính cả món đã có) = Trọn bộ; một món = mua lẻ; còn lại = multi
function pickProduct(card, items) {
  const want = PART_KEYS.filter((k) => items.includes(k) && !partPaid(card, k));
  if (!want.length) throw httpError(400, 'Các món bạn chọn đều đã kích hoạt rồi');
  if (PART_KEYS.every((k) => want.includes(k) || partPaid(card, k)) && !card.combo) return { product: 'combo', items: want };
  if (want.length === 1) return { product: want[0], items: want };
  return { product: 'multi', items: want };
}
// ---- lượt Trọn bộ (credits) — lưu trên tài khoản chủ thiệp: user.credits = { led, video } ----
// Trả tiền là chốt (thiệp: lúc kích hoạt; màn LED / video: lúc kích hoạt, hoặc lần đầu chiếu / xuất nếu mở bằng Trọn bộ)
const LOCKED = {
  led: 'Màn LED đã kích hoạt nên đã chốt — không sửa được nữa.',
  video: 'Video đã kích hoạt nên đã chốt — không sửa được nữa.',
};
const ownerOf = (card) => db.users.find((u) => u.id === card.userId) || null;
const creditsOf = (card) => { const u = ownerOf(card); const c = (u && u.credits) || {}; return { led: c.led || 0, video: c.video || 0 }; };
// các LED / video chưa kích hoạt của chủ thiệp (trên mọi thiệp của họ)
function useCredit(card, kind, via = 'credit') {
  const u = ownerOf(card);
  if (!u || !u.credits || !(u.credits[kind] > 0)) throw httpError(400, `Bạn không còn lượt ${kind === 'led' ? 'màn LED' : 'video'} Trọn bộ`);
  const target = card[kind];
  if (!target) throw httpError(400, `Hãy tạo ${kind === 'led' ? 'màn LED' : 'video'} trước`);
  if (target.paid) throw httpError(400, 'Đã kích hoạt rồi');
  u.credits[kind] -= 1;
  target.paid = true; target.paidAt = Date.now();
  fixNames(card);
  // ghi lại thành đơn 0đ để trang quản trị thấy lượt nào dùng ở đâu
  db.orders.push({ id: rid(12), code: PRODUCTS[kind].prefix + rid(6).toUpperCase(), product: kind, cardId: card.id, userId: card.userId, amount: 0, status: 'paid', paidVia: via, createdAt: target.paidAt, paidAt: target.paidAt });
}
// Trọn bộ gắn với MỘT thiệp: kích hoạt thiệp + màn LED + video của chính thiệp đó — có sẵn thì mở ngay, tạo sau thì tự mở
// lúc tạo (PUT /api/cards/:id). Thiệp khác của cùng chủ không liên quan (tạo thiệp mới = mua riêng).
// Lượt Trọn bộ cũ (user.credits, trước 18/11/2026) vẫn dùng được qua /redeem — không cộng thêm lượt nữa.
function comboUnlock(card, kind, at = Date.now()) {
  const t = card[kind];
  if (!(card.combo || prepaid(card, kind)) || !t || t.paid) return;
  t.paid = true; t.paidAt = at;
  if (card.prepaid) delete card.prepaid[kind];
  fixNames(card, false); // Trọn bộ mở sẵn: chưa chốt — khách vẫn làm màn LED / video, chốt lúc chiếu thật / xuất MP4 lần đầu
  // ghi thành đơn 0đ để trang quản trị thấy LED / video nào được mở nhờ Trọn bộ
  db.orders.push({ id: rid(12), code: PRODUCTS[kind].prefix + rid(6).toUpperCase(), product: kind, cardId: card.id, userId: card.userId, amount: 0, status: 'paid', paidVia: 'combo', createdAt: at, paidAt: at });
}
// Trả tiền theo ĐÁM CƯỚI: kích hoạt một thiệp là kích hoạt mọi thiệp của đám cưới đó (thiệp nhà trai, nhà gái, mời bạn bè…).
// Chốt tên cô dâu chú rể + ngày cưới theo thiệp vừa trả cho cả đám cưới — không dùng một lần trả cho đám cưới khác.
// Mẫu, màu, ảnh, chữ vẫn đổi thoải mái.
function weddingCards(card) { return card.weddingId ? db.cards.filter((c) => c.weddingId === card.weddingId && c.userId) : [card]; }
function payCard(card, at) {
  card.paid = true; card.paidAt = card.paidAt || at;
  for (const c of weddingCards(card)) {
    if (c === card || c.paid) continue;
    c.data.groom.name = card.data.groom.name; c.data.bride.name = card.data.bride.name; c.data.date = card.data.date;
    c.paid = true; c.paidAt = at; c.paidBy = card.id;
  }
}
const weddingPaid = (card) => weddingCards(card).find((c) => c.paid) || null;
function activateCombo(card, at) {
  payCard(card, at); card.combo = true;
  comboUnlock(card, 'led', at);
  comboUnlock(card, 'video', at);
}

// Giá thiệp: `price` là giá mở bán đang thu, `listPrice` là giá gốc (hiện gạch ngang) tới hết ngày `promoEndsAt`
// (giờ Việt Nam). Qua ngày đó web tự thu theo giá gốc — không phải sửa gì.
const promoEnd = () => (/^\d{4}-\d{2}-\d{2}$/.test(config.promoEndsAt || '') ? Date.parse(`${config.promoEndsAt}T23:59:59.999+07:00`) : 0);
const promoActive = () => config.listPrice > config.price && Date.now() <= promoEnd();
// Combo theo cùng hạn: `comboPrice` giá mở bán, `comboListPrice` giá gốc.
const promoOver = () => !!promoEnd() && Date.now() > promoEnd();
const cardPrice = () => (config.listPrice > config.price && promoOver() ? config.listPrice : config.price);
const comboPrice = () => (config.comboListPrice > config.comboPrice && promoOver() ? config.comboListPrice : config.comboPrice);
const comboPromo = () => config.comboListPrice > config.comboPrice && !!promoEnd() && !promoOver();
const promoInfo = () => (promoActive() ? { listPrice: config.listPrice, promoEndsAt: promoEnd() } : { listPrice: null, promoEndsAt: null });

const PORT = +process.env.PORT || config.port;
const BASE_URL = (process.env.BASE_URL || config.baseUrl).replace(/\/$/, '');
const PUBLIC_DIR = path.join(__dirname, 'public');
const DAY = 864e5;

// ---------------- router tối giản ----------------
const routes = [];
// opts.noDb: route không đọc/ghi dữ liệu (vd. /api/meta) → không chờ kho, trang vẫn chạy khi kho trục trặc
function route(method, pattern, handler, opts = {}) {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
  routes.push({ method, re, keys, handler, noDb: !!opts.noDb });
}

// ---------------- tiện ích nghiệp vụ ----------------
function needUser(ctx) {
  if (!ctx.user) throw httpError(401, 'Bạn cần đăng nhập');
  return ctx.user;
}
// Quản trị không gắn với tài khoản người dùng: vào bằng mật khẩu riêng ở /admin (lib/adminauth.js)
function needAdmin(ctx) {
  if (!ctx.admin) throw httpError(403, 'Cần đăng nhập trang quản trị');
}
// ----- bản nháp của khách chưa đăng nhập -----
// Bấm "Dùng mẫu" khi chưa có tài khoản: thiệp nháp gắn với cookie ẩn danh `gid` (userId = null, guestId = gid).
// Khách sửa chữ, đổi mẫu, xem trước thoải mái; tải ảnh, khách mời, phát hành… vẫn cần đăng nhập (401).
// Đăng nhập xong thì thiệp nháp chuyển về tài khoản (claimGuestCards).
const GUEST_DAYS = 30;
const guestCookie = (v, maxAge) => `gid=${v}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}` + (BASE_URL.startsWith('https') ? '; Secure' : '');
const guestId = (req) => { const g = cookies(req).gid; return /^[a-f0-9]{32}$/.test(g || '') ? g : null; };
const guestOwns = (ctx, card) => !!(card && card.guestId && !card.userId && ctx.guest && card.guestId === ctx.guest);
// Trả về { from, to } khi bản nháp của khách được gộp vào thiệp sẵn có của tài khoản (để chuyển link /sua/<nháp> sang thiệp đó).
function claimGuestCards(req, res, user) {
  const gid = guestId(req);
  if (!gid) return null;
  let moved = null;
  const mine = db.cards.filter((c) => c.guestId === gid && !c.userId);
  if (mine.length) {
    const w = Wd.ensure(user);
    // sổ tay chưa có tên đôi → lấy tên đôi, ngày cưới từ thiệp nháp vừa điền (kể cả khi tài khoản đã có thiệp cũ còn trống tên);
    // sổ tay đã có tên thì giữ nguyên sổ tay
    const src = mine.filter((c) => c.data.groom.name || c.data.bride.name).sort((a, b) => b.updatedAt - a.updatedAt)[0];
    const fresh = !w.couple.groom.name && !w.couple.bride.name;
    const has = userCard(user);
    if (has) {
      // tài khoản đã có thiệp: thiệp đó chưa phát hành → chép nội dung + mẫu từ bản nháp vừa làm (giữ trạng thái kích hoạt / Trọn bộ);
      // đã phát hành → giữ thiệp đang chạy. Bản nháp của khách bỏ đi (mỗi tài khoản một thiệp).
      const g = mine.sort((a, b) => b.updatedAt - a.updatedAt)[0];
      if (has.paid) {
        // thiệp của tài khoản đã kích hoạt = đã chốt: giữ nguyên, không lấy gì từ bản nháp
      } else if (g.ledOnly) {
        // bản nháp chỉ dùng cho màn LED (vào từ /tao-led): không thay cả thiệp, chỉ điền tên đôi, bố mẹ, ngày giờ vừa gõ
        if (has.status !== 'published') {
          const put = (o, k, v) => { if (v) o[k] = v; };
          ['groom', 'bride'].forEach((s) => ['name', 'father', 'mother'].forEach((k) => put(has.data[s], k, g.data[s][k])));
          put(has.data, 'date', g.data.date); put(has.data, 'time', g.data.time);
        }
      } else if (has.status !== 'published' && (g.data.groom.name || g.data.bride.name || g.data.cover || g.data.photos.some(Boolean) || g.updatedAt > has.updatedAt)) {
        Object.assign(has, { data: g.data, template: g.template, palette: g.palette, updatedAt: Date.now() });
      }
      // màn LED làm lúc chưa đăng nhập: mẫu, chữ, cảnh chuyển sang thiệp của tài khoản (giữ trạng thái kích hoạt, tên đã cố định)
      if (g.led && !isFinal(has.led)) { has.led = ledLib.normalize(g.led, has.led || {}); comboUnlock(has, 'led'); has.updatedAt = Date.now(); }
      const drop = new Set(mine.map((c) => c.id));
      db.cards = db.cards.filter((c) => !drop.has(c.id));
      if (fresh && has.status !== 'published') Wd.syncFromCard(has, true);
      moved = { from: drop, to: has.id };
    } else {
      const keep = mine.sort((a, b) => b.updatedAt - a.updatedAt)[0];
      const drop = new Set(mine.filter((c) => c !== keep).map((c) => c.id));
      if (drop.size) db.cards = db.cards.filter((c) => !drop.has(c.id));
      Object.assign(keep, { userId: user.id, weddingId: w.id, updatedAt: Date.now() }); delete keep.guestId; delete keep.ledOnly;
      if (fresh && src) Wd.syncFromCard(src, true);
    }
    save();
  }
  const prev = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', [].concat(prev || [], guestCookie('', 0)));
  return moved;
}
// link trang đang dở trỏ tới bản nháp đã gộp → trỏ sang thiệp của tài khoản
const movedNext = (next, moved) => (moved ? next.replace(/^\/(sua|sua-led|sua-video)\/([\w-]+)/, (m, p, id) => (moved.from.has(id) ? `/${p}/${moved.to}` : m)) : next);
// Thiệp của mình, hoặc thiệp trong đám cưới mà mình là thành viên (người yêu, bố mẹ cùng sửa).
// opts.guest: cho phép cả khách chưa đăng nhập đang giữ thiệp nháp này.
function ownedCard(ctx, id, opts = {}) {
  if (ctx.admin) { const c = db.cards.find((x) => x.id === id); if (c) return c; } // quản trị viên: mở / sửa được thiệp, màn LED, video của khách
  if (!ctx.user && opts.guest) {
    const c = db.cards.find((x) => x.id === id);
    if (guestOwns(ctx, c)) return c;
  }
  const user = needUser(ctx);
  const card = db.cards.find((c) => c.id === id && (c.userId === user.id || (c.weddingId && Wd.isMember(Wd.get(c.weddingId), user))));
  if (!card) throw httpError(404, 'Không tìm thấy thiệp');
  return card;
}
function canManage(user, card) {
  return !!(user && card && (card.userId === user.id || (card.weddingId && Wd.isMember(Wd.get(card.weddingId), user))));
}
// thiệp theo đường dẫn; đường dẫn cũ (đã đổi sang tên đôi) vẫn tìm được để link đã gửi không chết
const cardBySlug = (slug) => db.cards.find((c) => c.slug === slug) || db.cards.find((c) => (c.oldSlugs || []).includes(slug)) || null;
const slugTaken = (x, exceptId) => RESERVED.has(x) || db.cards.some((c) => c.id !== exceptId && (c.slug === x || (c.oldSlugs || []).includes(x)));
// đường dẫn tự sinh ("thiep-ab12cd") → đổi một lần sang tên đôi ("duc-anh-pham-nga") khi đã có đủ tên; giữ đường dẫn cũ
const AUTO_SLUG = /^thiep-[a-z0-9]{6}(-[a-z0-9]{4})?$/;
function autoSlug(card) {
  const g = card.data && card.data.groom && card.data.groom.name, b = card.data && card.data.bride && card.data.bride.name;
  if (!AUTO_SLUG.test(card.slug) || !g || !b) return;
  const s = uniqueSlug(`${g} ${b}`, card.id);
  if (s === card.slug) return;
  card.oldSlugs = [...(card.oldSlugs || []), card.slug].slice(-5);
  card.slug = s;
}
function uniqueSlug(wanted, exceptId) {
  let s = slugify(wanted) || 'thiep';
  if (s.length < 3) s += '-' + rid(4);
  const taken = (x) => slugTaken(x, exceptId);
  if (!taken(s)) return s;
  for (;;) { const t = `${s}-${rid(4)}`; if (!taken(t)) return t; }
}
const RESERVED = new Set(['api', 'admin', 'demo', 'uploads', 'card', 'css', 'js', 'led', 'video', 'so-tay', 'tham-gia']);

function cardState(card) {
  // trialFrom: bản sao của thiệp đã phát hành dùng tiếp đồng hồ dùng thử của bản gốc (nhân bản không được thêm hạn mới)
  const trialEndsAt = card.paid ? null : (card.trialFrom || card.publishedAt || card.createdAt) + config.trialDays * DAY;
  return {
    paid: !!card.paid,
    trialEndsAt,
    expired: !card.paid && card.status === 'published' && Date.now() > trialEndsAt,
    guestLimit: card.paid ? null : config.trialGuestLimit,
  };
}

function cardSummary(card) {
  const rs = db.rsvps.filter((r) => r.cardId === card.id);
  return {
    id: card.id, slug: card.slug, title: card.title, template: card.template, palette: card.palette,
    status: card.status, createdAt: card.createdAt, updatedAt: card.updatedAt, publishedAt: card.publishedAt || null,
    views: card.views || 0,
    guests: card.weddingId ? db.guests.filter((g) => g.weddingId === card.weddingId).length : 0,
    ownerId: card.userId, guest: !card.userId, // guest: thiệp nháp của khách chưa đăng nhập
    combo: !!card.combo, credits: creditsOf(card),
    rsvpYes: rs.filter((r) => r.attending === 'yes').reduce((n, r) => n + r.count, 0),
    rsvpCount: rs.length,
    wishes: db.wishes.filter((w) => w.cardId === card.id).length,
    url: `${BASE_URL}/t/${card.slug}`,
    names: [card.data.groom.name, card.data.bride.name].filter(Boolean).join(' & '),
    date: card.data.date,
    cover: card.data.cover || card.data.photos.find(Boolean) || '',
    ...cardState(card),
    namesFrozen: Wd.namesFrozen(card), // đã kích hoạt / đã qua ngày cưới: tên đôi + ngày cưới cố định
    // nâng lên Trọn bộ: giá phần chênh (đã trừ phần đã trả) và giá mua lẻ phần còn thiếu — null khi không cần gợi ý
    comboUpgrade: !card.combo && comboHave(card).length && comboHave(card).length < 3 ? { amount: PRODUCTS.combo.price(card), retail: missingRetail(card), have: comboHave(card) } : null,
    led: { ...ledLib.state(card.led), prepaid: prepaid(card, 'led'), url: `${BASE_URL}/led/${card.slug}`, palette: card.led ? card.led.palette : null, effect: card.led ? card.led.effect : null },
    video: { ...videoLib.state(card.video), prepaid: prepaid(card, 'video'), url: `${BASE_URL}/video/${card.slug}`, template: card.video ? card.video.template : null, kind: card.video ? card.video.event.kind : null },
  };
}
function cardFull(card) {
  // chuẩn hoá khi trả về: thiệp lưu từ trước có đủ các trường mới (trang phục, hỏi đáp, hiệu ứng…)
  const d = cd.normalize(card.data);
  // thiệp chưa có ảnh nào: kèm bộ ảnh mẫu của mẫu đang chọn (trình sửa đang hiện các ảnh này; video TikTok cũng dùng)
  const demo = !d.cover && !d.photos.some(Boolean) && (templates[card.template] || {}).demo;
  const samplePhotos = demo ? [demo.cover, ...(demo.photos || [])].filter(Boolean).slice(0, 10) : undefined;
  return { ...cardSummary(card), data: d, ledConfig: card.led || null, videoConfig: card.video || null, samplePhotos };
}

function qrPay(amount, code) {
  const p = config.payment;
  return `https://img.vietqr.io/image/${p.bankBin}-${p.accountNo}-qr_only.png?amount=${amount}&addInfo=${encodeURIComponent(code)}&accountName=${encodeURIComponent(p.accountName)}`;
}
// Giá gạch ngang trong cửa sổ thanh toán: thiệp / combo đang theo giá mở bán; nâng cấp combo so với mua lẻ LED + video
function wasPrice(o, product) {
  if (o.status !== 'pending') return {};
  const end = promoEnd();
  if (product === 'card' && promoActive() && o.amount + (o.discount || 0) === config.price) return { wasPrice: config.listPrice, promoEndsAt: end };
  const oc = db.cards.find((c) => c.id === o.cardId);
  if (product === 'combo' && o.upgrade) return { wasPrice: oc ? missingRetail(oc) : config.ledPrice + config.videoPrice, promoEndsAt: comboPromo() ? end : null };
  if (product === 'combo' && comboPromo() && o.amount + (o.discount || 0) === config.comboPrice) return { wasPrice: config.comboListPrice, promoEndsAt: end };
  // Trọn bộ không có giá gốc riêng: gạch ngang tổng tiền mua lẻ thiệp + LED + video (giá thật, không phải giá ảo)
  if (product === 'combo') { const le = cardPrice() + config.ledPrice + config.videoPrice; if (le > o.amount + (o.discount || 0)) return { wasPrice: le, retail: true }; }
  return {};
}
// Tiền khách đã chuyển cho đơn đang chờ mà chưa đủ (các lần chuyển thiếu, SePay ghi 'underpaid'): chuyển nốt phần còn lại là kích hoạt
const receivedFor = (o) => (o.status === 'pending' ? db.bankTxns.filter((x) => x.order === o.code && x.result === 'underpaid').reduce((n, x) => n + x.amount, 0) : 0);
function orderView(o) {
  const card = db.cards.find((c) => c.id === o.cardId);
  const product = o.product || 'card';
  const received = receivedFor(o), due = Math.max(0, o.amount - received);
  return {
    product, productName: product === 'multi' ? (o.items || []).map((k) => PART_NAME[k]).join(' + ').replace(/^./, (c) => c.toUpperCase()) : product === 'video' && card ? videoLib.videoName(card.video) : PRODUCTS[product].name,
    items: product === 'multi' ? o.items || [] : product === 'combo' ? PART_KEYS : [product],
    code: o.code, amount: o.amount, coupon: o.coupon || null, status: o.status, claimedAt: o.claimedAt || null,
    createdAt: o.createdAt, paidAt: o.paidAt || null, paidVia: o.paidVia || null, bankNote: o.bankNote || null,
    upgrade: !!o.upgrade, ...wasPrice(o, product),
    ...(product === 'combo' && card && o.status === 'pending' ? { have: comboHave(card) } : {}),
    // đã chuyển thiếu: báo khách số đã nhận + còn thiếu, mã QR theo phần còn thiếu (cùng nội dung chuyển khoản)
    ...(received ? { received, due } : {}),
    qr: qrPay(received ? due : o.amount, o.code),
    bank: { name: config.payment.bankName, accountNo: config.payment.accountNo, accountName: config.payment.accountName },
    card: card ? { id: card.id, title: card.title, names: [card.data.groom.name, card.data.bride.name].filter(Boolean).join(' & ') } : null,
  };
}

// Giới hạn tần suất theo IP (chống dò mật khẩu, spam lời chúc/RSVP).
// shared = true: bộ đếm nằm trong kho dữ liệu (db.limits) để mọi bản chạy trên Vercel đếm chung — bộ đếm trong bộ nhớ thì mỗi
// bản chạy đếm riêng và mất khi khởi động lại, gần như vô dụng với đăng nhập / mật khẩu quản trị. Chỉ dùng cho route ghi dữ liệu
// (POST…: đang giữ khoá kho nên đếm chính xác, và lần thử sai cũng được ghi lại khi trả lời). Chạy máy thường: đếm trong bộ nhớ.
const hits = new Map();
function rateLimit(key, max, windowMs, shared) {
  const now = Date.now();
  const tooMany = () => httpError(429, 'Bạn thao tác nhanh quá, thử lại sau ít phút nhé');
  if (shared && store.remote) {
    const L = db.limits || (db.limits = {});
    const k = require('crypto').createHash('sha1').update(key).digest('hex').slice(0, 20); // không lưu IP dạng đọc được
    const arr = (L[k] || []).filter((t) => now - t < windowMs);
    if (arr.length >= max) { L[k] = arr; throw tooMany(); }
    arr.push(now);
    L[k] = arr;
    const keys = Object.keys(L);
    if (keys.length > 400) for (const x of keys) if (!L[x].some((t) => now - t < 36e5)) delete L[x]; // dọn bộ đếm đã nguội
    return save();
  }
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) throw tooMany();
  arr.push(now);
  hits.set(key, arr);
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some((t) => now - t < 36e5)) hits.delete(k); }, 6e5).unref();

// ---------------- API: sổ tay cưới ----------------
require('./lib/planner-routes')({ route, needUser, rateLimit, cardSummary, BASE_URL });

// ---------------- API: tài khoản ----------------
// Tự tạo tài khoản bằng email + mật khẩu đã đóng: không xác minh được email và không có cách lấy lại mật khẩu.
// Tài khoản mới vào bằng Google / Facebook; tài khoản email cũ vẫn đăng nhập được (quản trị đặt lại mật khẩu giúp khi quên).
// Vẫn mở khi máy chủ chưa cấu hình Google lẫn Facebook (chạy thử trên máy) hoặc đặt ALLOW_EMAIL_SIGNUP=1.
const emailSignup = () => process.env.ALLOW_EMAIL_SIGNUP === '1' || !(google.enabled() || facebook.enabled());
route('POST', '/api/auth/register', async (req, res, ctx) => {
  if (!emailSignup()) throw httpError(403, 'Tạo tài khoản bằng email đã đóng — bạn bấm "Tiếp tục với Google" hoặc Facebook nhé');
  rateLimit('reg:' + ctx.ip, 10, 36e5, true);
  const b = await readJson(req);
  const user = auth.createUser(b);
  auth.startSession(res, user.id);
  const moved = claimGuestCards(req, res, user);
  json(res, 200, { user: auth.publicUser(user), moved: moved ? { from: [...moved.from], to: moved.to } : null });
});
route('POST', '/api/auth/login', async (req, res, ctx) => {
  rateLimit('login:' + ctx.ip, 20, 9e5, true);
  const b = await readJson(req);
  const user = auth.verifyLogin(b.email, b.password);
  auth.startSession(res, user.id);
  const moved = claimGuestCards(req, res, user);
  json(res, 200, { user: auth.publicUser(user), moved: moved ? { from: [...moved.from], to: moved.to } : null });
});
route('POST', '/api/auth/logout', async (req, res) => {
  auth.endSession(req, res);
  json(res, 200, { ok: true });
});
route('GET', '/api/me', async (req, res, ctx) => {
  if (ctx.admin || stats.isOwnerAccount(ctx.user)) stats.markOwner(req, res, BASE_URL.startsWith('https')); // máy của chủ web: không tính vào thống kê
  json(res, 200, { user: auth.publicUser(ctx.user) });
});

// ---------------- đăng nhập Google / Facebook ----------------
const GOOGLE_CB = BASE_URL + '/auth/google/callback';
const FACEBOOK_CB = BASE_URL + '/auth/facebook/callback';
const safeNext = (n) => (typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') ? n : '/thiep-cua-toi'); // không có trang đang dở → Thiệp của tôi
function redirect(res, to, cookiesToSet = []) {
  res.writeHead(302, { Location: to, 'Set-Cookie': cookiesToSet, 'Cache-Control': 'no-store' });
  res.end();
}
route('GET', '/auth/google', async (req, res, ctx) => {
  if (!google.enabled()) return redirect(res, '/dang-nhap?loi=' + encodeURIComponent('Chưa bật đăng nhập Google'));
  const state = google.newState();
  const val = encodeURIComponent(state + '|' + safeNext(ctx.query.get('next')));
  redirect(res, google.authUrl(state, GOOGLE_CB), [`gst=${val}; HttpOnly; Path=/auth; SameSite=Lax; Max-Age=600` + (BASE_URL.startsWith('https') ? '; Secure' : '')]);
});
route('GET', '/auth/google/callback', async (req, res, ctx) => {
  const clear = 'gst=; HttpOnly; Path=/auth; SameSite=Lax; Max-Age=0';
  const fail = (msg) => redirect(res, '/dang-nhap?loi=' + encodeURIComponent(msg), [clear]);
  const [state, next] = decodeURIComponent(cookies(req).gst || '').split('|');
  if (ctx.query.get('error')) return fail('Bạn đã huỷ đăng nhập Google');
  if (!state || state !== ctx.query.get('state')) return fail('Phiên đăng nhập Google không hợp lệ, thử lại nhé');
  try {
    rateLimit('google:' + ctx.ip, 30, 9e5);
    const g = await google.exchange(String(ctx.query.get('code') || ''), GOOGLE_CB);
    const user = auth.googleUser(g);
    auth.startSession(res, user.id, 'google');
    const moved = claimGuestCards(req, res, user);
    redirect(res, movedNext(safeNext(next), moved), [].concat(res.getHeader('Set-Cookie'), clear));
  } catch (e) {
    if (e.status === 500 || !e.status) console.error('Google login lỗi:', e);
    fail(e.status && e.status !== 500 ? e.message : 'Không đăng nhập được bằng Google, thử lại sau nhé');
  }
});

route('GET', '/auth/facebook', async (req, res, ctx) => {
  if (!facebook.enabled()) return redirect(res, '/dang-nhap?loi=' + encodeURIComponent('Chưa bật đăng nhập Facebook'));
  const state = facebook.newState();
  const val = encodeURIComponent(state + '|' + safeNext(ctx.query.get('next')));
  redirect(res, facebook.authUrl(state, FACEBOOK_CB), [`fst=${val}; HttpOnly; Path=/auth; SameSite=Lax; Max-Age=600` + (BASE_URL.startsWith('https') ? '; Secure' : '')]);
});
route('GET', '/auth/facebook/callback', async (req, res, ctx) => {
  const clear = 'fst=; HttpOnly; Path=/auth; SameSite=Lax; Max-Age=0';
  const fail = (msg) => redirect(res, '/dang-nhap?loi=' + encodeURIComponent(msg), [clear]);
  const [state, next] = decodeURIComponent(cookies(req).fst || '').split('|');
  if (ctx.query.get('error')) return fail('Bạn đã huỷ đăng nhập Facebook');
  if (!state || state !== ctx.query.get('state')) return fail('Phiên đăng nhập Facebook không hợp lệ, thử lại nhé');
  try {
    rateLimit('facebook:' + ctx.ip, 30, 9e5);
    const f = await facebook.exchange(String(ctx.query.get('code') || ''), FACEBOOK_CB);
    const user = auth.facebookUser(f);
    auth.startSession(res, user.id, 'facebook');
    const moved = claimGuestCards(req, res, user);
    redirect(res, movedNext(safeNext(next), moved), [].concat(res.getHeader('Set-Cookie'), clear));
  } catch (e) {
    if (e.status === 500 || !e.status) console.error('Facebook login lỗi:', e);
    fail(e.status && e.status !== 500 ? e.message : 'Không đăng nhập được bằng Facebook, thử lại sau nhé');
  }
});

// phiên bản đang chạy: "v1.1" theo package.json (mỗi lần đẩy bản mới tăng số sau dấu chấm) — hiện mờ ở góc dưới các trang (public/js/ver.js)
const APP_VERSION = 'v' + require('./package.json').version.replace(/\.0$/, '');
route('GET', '/api/version', async (req, res) => json(res, 200, { v: APP_VERSION }));
route('GET', '/api/meta', async (req, res) => {
  // giá, ngày dùng thử, liên hệ hỗ trợ… sửa trên trang quản trị nằm trong kho dữ liệu: bản chạy vừa khởi động (hoặc đã
  // lâu chưa nạp) phải nạp trước, nếu không khách thấy giá / liên hệ mặc định trong config.json. Kho lỗi thì dùng tạm bản đang có.
  await store.fresh(60000).catch((e) => console.error('meta:', e.message));
  json(res, 200, {
    brand: config.brand, tagline: config.tagline, price: cardPrice(), ...promoInfo(), trialDays: config.trialDays,
    trialGuestLimit: config.trialGuestLimit, banks, templates: templateList(), templateGroups, baseUrl: BASE_URL, support: config.support,
    ledPrice: config.ledPrice, led: ledLib.options(),
    videoPrice: config.videoPrice, video: { ...videoLib.options(), samples: Object.fromEntries(videoLib.options().templates.filter((t) => t.photos).map((t) => [t.id, videoSamples(t)])) }, music: musicLib.options(),
    comboPrice: comboPrice(), comboListPrice: comboPromo() ? config.comboListPrice : null, promoEndsAt: promoActive() || comboPromo() ? promoEnd() : null, blobUpload: !!process.env.BLOB_READ_WRITE_TOKEN,
    googleLogin: google.enabled(), facebookLogin: facebook.enabled(), emailSignup: emailSignup(),
  });
}, { noDb: true });

// ---------------- thống kê truy cập ----------------
// Trang giới thiệu gửi về (public/js/site.js): p = đường dẫn, v = lượt đầu trong ngày của trình duyệt này, n = lần đầu ghé,
// r = nguồn tới, m = điện thoại; hoặc u = bấm "Dùng mẫu" (thiep:<mẫu> | video:<mẫu> | led:<màu>-<hiệu ứng>).
const TRACK_PAGES = { '/': 'Trang chủ', '/mau-thiep': 'Mẫu thiệp', '/video-dam-ngo': 'Màn hình dạm ngõ', '/slide-cuoi': 'Slide cưới', '/man-hinh-led-dam-cuoi': 'Màn hình LED', '/so-tay-cuoi': 'Sổ tay cưới', '/dang-nhap': 'Đăng nhập', '/goi-y': 'Gợi ý thiệp từ ảnh', '/video': 'Video báo hỷ' };
route('POST', '/api/t', async (req, res, ctx) => {
  try {
    if (stats.isBot(req) || stats.isOwner(req, ctx)) throw 0; // bot và máy của chủ web không tính
    rateLimit('t:' + ctx.ip, 240, 6e5);
    const b = JSON.parse((await readBody(req, 2000)).toString('utf8') || '{}');
    const items = [];
    if (typeof b.u === 'string') { if (/^(thiep|video|led):[\w-]{1,40}$/.test(b.u)) items.push(['use', b.u]); }
    else if (typeof b.p === 'string') {
      items.push(['pv', TRACK_PAGES[b.p.replace(/(.)\/$/, '$1')] || 'Trang khác']);
      if (b.v) {
        items.push(['visitor', 'all'], ['device', b.m ? 'Điện thoại' : 'Máy tính'], ['ref', stats.source(b.r, req)]);
        if (b.n) items.push(['visitor', 'new']);
      }
    }
    await stats.hit(items); // ghi xong mới trả lời: hàm serverless bị đóng băng ngay sau khi trả lời
  } catch (e) { /* thống kê hỏng không được ảnh hưởng tới khách */ }
  res.writeHead(204); res.end();
}, { noDb: true });
// lượt mở trang xem thử một mẫu (không tính ảnh xem trước nhúng ở trang chủ, không tính bot)
const demoView = (req, ctx, key) => (ctx.query.get('preview') === '1' || stats.isBot(req) || stats.isOwner(req, ctx) ? null : stats.hit([['view', key]]));

// Xoá sạch báo cáo truy cập (không hoàn tác) — phải gửi kèm confirm: 'XOÁ'
route('POST', '/api/admin/traffic/clear', async (req, res, ctx) => {
  needAdmin(ctx);
  const b = await readJson(req);
  if (b.confirm !== 'XOÁ') throw httpError(400, 'Gõ đúng chữ XOÁ để xoá báo cáo truy cập');
  const n = await stats.clear();
  adminLib.audit(ctx, 'Xoá báo cáo truy cập', `${n} dòng số liệu`);
  json(res, 200, { ok: true, cleared: n });
});
route('GET', '/api/admin/traffic', async (req, res, ctx) => {
  needAdmin(ctx);
  const days = Math.min(180, Math.max(7, parseInt(ctx.query.get('days'), 10) || 30));
  const rows = await stats.range(days);
  const t0 = Date.now() - (days - 1) * DAY;
  const series = Array.from({ length: days }, (_, i) => { const d = stats.today(t0 + i * DAY); return { date: d, day: d.slice(8) + '/' + d.slice(5, 7), visitors: 0, fresh: 0, pv: 0 }; });
  const byDay = Object.fromEntries(series.map((s) => [s.date, s]));
  const sums = { pv: {}, ref: {}, device: {}, view: {}, use: {} };
  rows.forEach((r) => {
    const s = byDay[r.day]; if (!s) return;
    if (r.kind === 'visitor') s[r.key === 'new' ? 'fresh' : 'visitors'] += r.n;
    else if (r.kind === 'pv') s.pv += r.n;
    if (sums[r.kind]) sums[r.kind][r.key] = (sums[r.kind][r.key] || 0) + r.n;
  });
  const top = (m) => Object.entries(m).map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n);
  const vt = videoLib.options().templates, L = ledLib.options();
  const nameOf = (key) => {
    const [kind, id] = [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)];
    if (kind === 'thiep') return templates[id] ? templates[id].name : id;
    if (kind === 'video') return (vt.find((t) => t.id === id) || {}).name || (id === 'chung' ? 'Chưa chọn mẫu' : id);
    const [p, e] = id.split('-');
    const pn = (L.palettes.find((x) => x.id === p) || {}).name, en = (L.effects.find((x) => x.id === e) || {}).name;
    return pn ? `${pn}${en ? ' · ' + en : ''}` : id === 'chung' ? 'Chưa chọn mẫu' : id;
  };
  const keys = new Set([...Object.keys(sums.view), ...Object.keys(sums.use)]);
  const tpls = [...keys].map((key) => ({ key, kind: key.split(':')[0], name: nameOf(key), views: sums.view[key] || 0, uses: sums.use[key] || 0 }))
    .sort((a, b) => b.views + b.uses * 3 - (a.views + a.uses * 3));
  const since = new Date(stats.today(t0) + 'T00:00:00+07:00').getTime();
  const sum = (k) => series.reduce((n, s) => n + s[k], 0);
  // tài khoản của chủ web không tính vào phễu (thiệp, đăng ký, phát hành, thanh toán)
  const mine = new Set(db.users.filter((u) => stats.isOwnerAccount(u)).map((u) => u.id));
  const cards = db.cards.filter((c) => c.createdAt >= since && !mine.has(c.userId));
  const paid = db.orders.filter((o) => o.status === 'paid' && o.paidAt >= since && !mine.has(o.userId));
  json(res, 200, {
    days, series,
    exclude: { device: stats.ownerDevice(req) || !!ctx.admin, accounts: stats.ownerList().filter((x) => !x.includes('@') || db.users.some((u) => String(u.email).toLowerCase() === x)), users: mine.size }, today: series[series.length - 1], yesterday: series[series.length - 2],
    totals: { visitors: sum('visitors'), fresh: sum('fresh'), pv: sum('pv') },
    pages: top(sums.pv), refs: top(sums.ref), devices: top(sums.device), templates: tpls,
    funnel: {
      visitors: sum('visitors'), views: Object.values(sums.view).reduce((a, b) => a + b, 0), uses: Object.values(sums.use).reduce((a, b) => a + b, 0),
      cards: cards.length, drafts: cards.filter((c) => !c.userId).length,
      signups: db.users.filter((u) => u.createdAt >= since && !mine.has(u.id)).length,
      published: db.cards.filter((c) => c.publishedAt && c.publishedAt >= since && !mine.has(c.userId)).length,
      paid: paid.length, revenue: paid.reduce((n, o) => n + o.amount, 0),
    },
  });
});

// ---------------- API: thiệp ----------------
route('GET', '/api/cards', async (req, res, ctx) => {
  const user = needUser(ctx);
  const w = Wd.ensure(user);
  // thiệp của mình + thiệp của các thành viên khác trong cùng đám cưới
  const list = db.cards.filter((c) => c.userId === user.id || c.weddingId === w.id).sort((a, b) => b.updatedAt - a.updatedAt).map(cardSummary);
  json(res, 200, { cards: list });
});

route('POST', '/api/cards', async (req, res, ctx) => {
  if (!ctx.user) return guestCard(req, res, ctx);
  const card = newCard(needUser(ctx), await readJson(req));
  json(res, 200, { card: cardFull(card) });
});
// Bấm "Tạo màn LED" / "Dùng mẫu" video: chuyển thẳng tới trình sửa (máy chủ chọn thiệp gần nhất, chưa có thì tạo),
// không ghé trang "Thiệp của tôi" rồi mới nhảy tiếp. Chưa đăng nhập thì đăng nhập xong quay lại đúng link này.
// /tao-led?palette=&effect=  → /sua-led/<thiệp>?palette=&effect=      /tao-video?mau=<mẫu> → /sua-video/<thiệp>?mau=<mẫu>
for (const [path, to, keep] of [['/tao-led', 'sua-led', ['palette', 'effect']], ['/tao-video', 'sua-video', ['mau']]]) {
  route('GET', path, async (req, res, ctx) => {
    const q = new URLSearchParams();
    keep.forEach((k) => { const v = String(ctx.query.get(k) || '').slice(0, 40); if (/^[\w-]+$/.test(v)) q.set(k, v); });
    const qs = q.toString() ? '?' + q : '';
    if (!ctx.user && to === 'sua-led') { // màn LED: khách chưa đăng nhập sửa + xem trước trên bản nháp; lấy link chiếu mới cần đăng nhập
      const card = ensureGuestCard(res, ctx, { keepTemplate: true });
      q.set('tao', '1');
      return redirect(res, `/${to}/${card.id}?${q}`, res.getHeader('Set-Cookie'));
    }
    if (!ctx.user) return redirect(res, '/dang-nhap?next=' + encodeURIComponent(path + qs));
    const user = ctx.user, w = Wd.ensure(user);
    const card = db.cards.filter((c) => c.userId === user.id || c.weddingId === w.id).sort((a, b) => b.updatedAt - a.updatedAt)[0]
      || newCard(user, { template: 'dodam' });
    if (to === 'sua-led') q.set('tao', '1'); // trình sửa LED tự bật màn LED, khỏi bấm thêm nút "Tạo màn LED từ thiệp này"
    redirect(res, `/${to}/${card.id}?${q}`);
  });
}

// Một đám cưới có thể có nhiều thiệp (nhà trai, nhà gái, mời bạn bè…) — trả tiền một lần cho cả đám cưới (payCard).
// "Dùng mẫu" (b.template):
//   - b.target = id thiệp của mình → đổi mẫu thiệp đó (kể cả đã kích hoạt: chỉ chốt tên + ngày, mẫu đổi thoải mái)
//   - b.target = 'new' → làm thêm một thiệp trong đám cưới (đã kích hoạt thì thiệp mới cũng đã kích hoạt)
//   - không có target: chỉ một thiệp nháp → đổi mẫu thiệp đó như trước; đã kích hoạt / nhiều thiệp → 409 choose để khách chọn
const userCard = (user) => db.cards.filter((c) => c.userId === user.id).sort((a, b) => b.updatedAt - a.updatedAt)[0];
function setTemplate(card, tpl, palette) {
  if (!templates[tpl]) return;
  Object.assign(card, { template: tpl, palette: templates[tpl].palettes.find((p) => p.id === palette)?.id || templates[tpl].palettes[0].id, updatedAt: Date.now() });
  delete card.ledOnly;
}
function newCard(user, b = {}) {
  const tpl = templates[b.template] ? b.template : DEFAULT_TEMPLATE;
  const mine = db.cards.filter((c) => c.userId === user.id).sort((a, b2) => b2.updatedAt - a.updatedAt);
  const has = mine[0];
  if (has && b.target && b.target !== 'new') {
    const t = mine.find((c) => c.id === b.target);
    if (!t) throw httpError(404, 'Không tìm thấy thiệp');
    setTemplate(t, tpl, b.palette); save(); return t;
  }
  if (has && b.target === 'new') return addCard(user, has, tpl, b.palette);
  if (has) {
    if (b.template && templates[b.template]) {
      if (mine.length > 1 || (has.paid && b.template !== has.template)) throw Object.assign(httpError(409, 'Chọn thiệp muốn dùng mẫu này'), { choose: true });
      setTemplate(has, tpl, b.palette); save();
    }
    return has;
  }
  const now = Date.now();
  const w = Wd.ensure(user);
  const data = cd.defaults();
  // hồ sơ cưới (sổ tay): tên đôi, danh xưng, bố mẹ, ngày cưới; các lễ + tài khoản mừng cưới của thiệp đã lưu trước đó
  if (!Wd.prefill(data, w)) {
    data.events = [
      { name: 'Lễ Thành Hôn', date: w.date, time: '10:00', place: '', address: '', mapUrl: '' },
      { name: 'Tiệc Cưới', date: w.date, time: '18:00', place: '', address: '', mapUrl: '' },
    ];
  }
  const card = {
    id: rid(12), userId: user.id, weddingId: w.id, slug: uniqueSlug('thiep-' + rid(6)),
    title: str(b.title, 60) || 'Thiệp 1',
    template: tpl, palette: templates[tpl].palettes.find((p) => p.id === b.palette)?.id || templates[tpl].palettes[0].id,
    status: 'draft', paid: false, views: 0, data, createdAt: now, updatedAt: now,
  };
  db.cards.push(card);
  save();
  return card;
}

// Khách chưa đăng nhập bấm "Dùng mẫu": mỗi khách một thiệp nháp; chọn mẫu khác thì đổi mẫu trên chính thiệp đó (giữ chữ đã gõ)
async function guestCard(req, res, ctx) {
  const card = ensureGuestCard(res, ctx, await readJson(req));
  json(res, 200, { card: cardFull(card) });
}
// b.template: đổi mẫu thiệp của bản nháp sẵn có; b.keepTemplate: chỉ lấy bản nháp (mở trình sửa LED), không đổi mẫu thiệp
function ensureGuestCard(res, ctx, b = {}) {
  const tpl = templates[b.template] ? b.template : DEFAULT_TEMPLATE;
  const palette = templates[tpl].palettes.find((p) => p.id === b.palette)?.id || templates[tpl].palettes[0].id;
  const now = Date.now();
  let gid = ctx.guest;
  let card = gid && db.cards.find((c) => c.guestId === gid && !c.userId);
  if (card) { if (!b.keepTemplate && !card.paid) { Object.assign(card, { template: tpl, palette, updatedAt: now }); delete card.ledOnly; } }
  else {
    rateLimit('gcard:' + ctx.ip, 12, 36e5, true);
    // dọn thiệp nháp vô chủ đã quá hạn cookie
    const old = now - GUEST_DAYS * DAY;
    if (db.cards.some((c) => c.guestId && !c.userId && c.updatedAt < old)) db.cards = db.cards.filter((c) => !(c.guestId && !c.userId && c.updatedAt < old));
    gid = gid || require('crypto').randomBytes(16).toString('hex');
    const data = cd.defaults();
    data.events = [
      { name: 'Lễ Thành Hôn', date: '', time: '10:00', place: '', address: '', mapUrl: '' },
      { name: 'Tiệc Cưới', date: '', time: '18:00', place: '', address: '', mapUrl: '' },
    ];
    card = {
      id: rid(12), userId: null, guestId: gid, weddingId: null, slug: uniqueSlug('thiep-' + rid(6)), title: 'Thiệp 1',
      template: tpl, palette, status: 'draft', paid: false, views: 0, data, createdAt: now, updatedAt: now,
    };
    if (b.keepTemplate) card.ledOnly = true; // vào từ màn LED: bấm "Dùng mẫu" thiệp sau đó thì bỏ dấu này
    db.cards.push(card);
  }
  save();
  res.setHeader('Set-Cookie', guestCookie(gid, GUEST_DAYS * 86400));
  return card;
}

route('GET', '/api/cards/:id', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id, { guest: true });
  json(res, 200, { card: cardFull(card) });
});

route('PUT', '/api/cards/:id', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id, { guest: true });
  const b = await readJson(req);
  // trả tiền là chốt: thiệp đã kích hoạt giữ nguyên tên đôi + ngày cưới (Wd.keepFrozen) và mẫu (kiểm tra bên dưới); màn LED / video đã chốt không sửa gì nữa
  if (b.led && isFinal(card.led) && !ctx.admin) throw httpError(409, LOCKED.led);
  if (b.video && isFinal(card.video)) throw httpError(409, LOCKED.video);
  if (!ctx.user) {
    if (b.slug !== undefined || b.video) needUser(ctx); // đường dẫn riêng, video: cần tài khoản (màn LED: nháp xem trước được, lấy link chiếu mới cần đăng nhập)
    rateLimit('gsave:' + ctx.ip, 600, 36e5);
    if (b.data) { // khách chưa đăng nhập không tải tệp lên được → không nhận link ảnh / nhạc gửi kèm
      const cur = new Set([card.data.cover, card.data.music, ...card.data.photos].filter(Boolean).map((u) => String(u).split('#')[0]));
      const ok = (u) => !u || cur.has(String(u).split('#')[0]) || /^\/music\/[\w-]+\.mp3$/.test(u); // nhạc mẫu: ai cũng chọn được
      if (!ok(b.data.cover) || !ok(b.data.music) || (Array.isArray(b.data.photos) && !b.data.photos.every(ok))) needUser(ctx);
    }
  }
  if (b.title !== undefined) card.title = str(b.title, 60) || card.title;
  if (b.template && templates[b.template]) {
    if (b.template !== card.template) card.palette = templates[b.template].palettes[0].id;
    card.template = b.template;
  }
  if (b.template || b.palette) delete card.ledOnly; // khách đã làm cả thiệp trên bản nháp này
  if (!templates[card.template]) card.template = DEFAULT_TEMPLATE;
  if (b.palette && templates[card.template].palettes.some((p) => p.id === b.palette)) card.palette = b.palette;
  if (b.slug !== undefined && slugify(b.slug) !== card.slug) {
    const s = slugify(b.slug);
    if (s.length < 3) throw httpError(400, 'Đường dẫn cần ít nhất 3 ký tự (a-z, 0-9)');
    if (slugTaken(s, card.id)) throw httpError(409, 'Đường dẫn này đã có người dùng');
    card.oldSlugs = [...(card.oldSlugs || []).filter((x) => x !== s), card.slug].slice(-5); // link đã gửi vẫn mở được
    card.slug = s;
  }
  if (b.data) { fixNames(card, false); card.data = Wd.keepFrozen(card, cd.normalize(b.data)); Wd.syncFromCard(card); } // đã qua ngày cưới: tên đôi + ngày cưới giữ nguyên // màn LED kích hoạt từ trước: cố định tên trước khi đổi
  if (b.data && b.slug === undefined && card.userId) autoSlug(card); // thiệp nháp của khách chưa đăng nhập: giữ nguyên
  if (b.led) { card.led = ledLib.normalize(b.led, card.led, { admin: ctx.admin }); comboUnlock(card, 'led'); }
  // quản trị viên sửa giúp màn LED đã chốt: sửa bản chụp lúc chốt (tên, ngày, lời cảm ơn…), thiệp của khách giữ nguyên
  if (b.snap && ctx.admin && isFinal(card.led)) {
    const s = cd.normalize(b.snap);
    if (!(s.groom.name && s.bride.name)) throw httpError(400, 'Cần đủ tên cô dâu chú rể');
    card.led.snap = s; card.led.names = { groom: s.groom.name, bride: s.bride.name };
    adminLib.audit(ctx, 'Sửa màn LED đã chốt', card.slug, `${s.groom.name} & ${s.bride.name}`);
  } // tạo màn LED (chưa kích hoạt: chỉ xem trước; thiệp Trọn bộ: kích hoạt luôn)
  if (b.video) {
    const nv = videoLib.normalize(b.video, card.video);
    // video đã kích hoạt: tên đôi cố định — không được bỏ chỗ hiện tên ({chu_re} / {co_dau}) để gõ tên khác vào
    if (card.video && card.video.paid) {
      const cnt = (v, k) => v.scenes.reduce((n, s) => n + s.lines.reduce((m, l) => m + l.text.split(k).length - 1, 0), 0);
      if (['{chu_re}', '{co_dau}'].some((k) => cnt(nv, k) < Math.min(1, cnt(card.video, k)))) throw httpError(409, 'Video đã kích hoạt nên tên cô dâu chú rể cố định — không xoá hay thay được dòng tên. Bấm Hoàn tác để lấy lại nhé.');
    }
    card.video = nv; comboUnlock(card, 'video');
  }
  card.updatedAt = Date.now();
  if (b.data || b.template || b.palette) DRAFTS.delete(card.id);
  save();
  json(res, 200, { card: cardFull(card) });
});

// Bản nháp để xem trước (trình sửa thiệp chỉ lưu khi bấm "Lưu"): giữ trong bộ nhớ, KHÔNG ghi vào thiệp.
// Khung xem trước của chủ thiệp (/t/:slug?preview=1&draft=1) vẽ theo bản nháp; bấm Lưu (PUT dữ liệu) thì bỏ bản nháp.
const DRAFTS = new Map(); // card.id → { data, template, palette, title, at }
route('POST', '/api/cards/:id/draft', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id, { guest: true });
  rateLimit('draft:' + ctx.ip, 3000, 36e5);
  const b = await readJson(req);
  let template = templates[b.template] ? b.template : card.template;
  if (!templates[template]) template = DEFAULT_TEMPLATE;
  let palette = template !== card.template ? templates[template].palettes[0].id : card.palette;
  if (b.palette && templates[template].palettes.some((p) => p.id === b.palette)) palette = b.palette;
  const d = { data: b.data ? cd.normalize(b.data) : card.data, template, palette, title: b.title !== undefined ? str(b.title, 60) || card.title : card.title, at: Date.now() };
  DRAFTS.set(card.id, d);
  if (DRAFTS.size > 500) { const old = Date.now() - 6 * 36e5; for (const [k, v] of DRAFTS) if (v.at < old) DRAFTS.delete(k); }
  json(res, 200, { card: { ...cardFull(card), template: d.template, palette: d.palette, title: d.title } });
});

route('POST', '/api/cards/:id/publish', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id);
  const b = await readJson(req);
  if (b.publish === false) card.status = 'draft';
  else {
    if (!card.data.groom.name || !card.data.bride.name || !card.data.date) throw httpError(400, 'Cần điền tên cô dâu, chú rể và ngày cưới trước khi phát hành');
    card.status = 'published';
    if (!card.publishedAt) card.publishedAt = Date.now();
  }
  card.updatedAt = Date.now();
  save();
  json(res, 200, { card: cardSummary(card) });
});

// Làm thêm thiệp cho cùng đám cưới (bản sao chữ + ảnh của thiệp nguồn, đổi mẫu tuỳ ý). Đám cưới đã kích hoạt → thiệp mới
// cũng đã kích hoạt (cùng tên + ngày). Chưa kích hoạt → dùng chung đồng hồ dùng thử với thiệp nguồn (không được thêm hạn).
route('POST', '/api/cards/:id/duplicate', async (req, res, ctx) => {
  const src = ownedCard(ctx, ctx.params.id);
  const b = await readJson(req);
  const user = ctx.admin && !ctx.user ? db.users.find((u) => u.id === src.userId) : needUser(ctx);
  const card = addCard(user, src, templates[b.template] ? b.template : src.template, b.palette || (b.template ? '' : src.palette));
  json(res, 200, { card: cardFull(card) });
});
function addCard(user, src, tpl, palette) {
  const mine = db.cards.filter((c) => c.userId === user.id);
  if (mine.length >= 10) throw httpError(400, 'Mỗi đám cưới tối đa 10 thiệp');
  const now = Date.now(), paidBy = weddingPaid(src);
  const data = JSON.parse(JSON.stringify(src.data));
  const card = {
    id: rid(12), userId: user.id, weddingId: src.weddingId || Wd.ensure(user).id, slug: uniqueSlug('thiep-' + rid(6)),
    title: `Thiệp ${mine.length + 1}`, template: tpl, palette: '', status: 'draft', paid: false, views: 0, data, createdAt: now, updatedAt: now,
    trialFrom: src.trialFrom || src.publishedAt || src.createdAt,
  };
  setTemplate(card, tpl, palette);
  if (paidBy) { card.paid = true; card.paidAt = now; card.paidBy = paidBy.id; data.groom.name = paidBy.data.groom.name; data.bride.name = paidBy.data.bride.name; data.date = paidBy.data.date; }
  db.cards.push(card);
  autoSlug(card);
  save();
  return card;
}

route('DELETE', '/api/cards/:id', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id);
  const keep = (x) => x.cardId !== card.id;
  db.cards = db.cards.filter((c) => c.id !== card.id);
  // khách mời thuộc đám cưới (sổ tay) nên giữ lại; chỉ xoá phản hồi gắn riêng với thiệp này
  db.rsvps = db.rsvps.filter(keep);
  db.wishes = db.wishes.filter(keep);
  save();
  json(res, 200, { ok: true });
});

// ---------------- API: khách mời ----------------
// Khách mời thuộc đám cưới; mỗi thiệp tạo link riêng cho từng khách trong danh sách chung.
// Thiệp chưa kích hoạt: chỉ N khách đầu có link mang tên riêng.
route('GET', '/api/cards/:id/guests', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id);
  const guests = Gs.list(card.weddingId).map((g) => ({
    ...g, url: `${BASE_URL}/t/${card.slug}/${g.code}`, locked: !Gs.personalAllowed(card, g),
  }));
  json(res, 200, { guests, limit: cardState(card).guestLimit });
});

route('POST', '/api/cards/:id/guests', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id);
  const b = await readJson(req, 1e6);
  const added = Gs.addNames(card.weddingId, b.names, { side: ['trai', 'gai'].includes(b.side) ? b.side : '', invited: true });
  json(res, 200, { added: added.length });
});

route('DELETE', '/api/guests/:gid', async (req, res, ctx) => {
  const g = db.guests.find((x) => x.id === ctx.params.gid);
  if (!g) throw httpError(404, 'Không tìm thấy khách');
  const wd = Wd.get(g.weddingId);
  if (!Wd.isMember(wd, needUser(ctx))) throw httpError(404, 'Không tìm thấy khách');
  // khách đã mở link riêng rồi mới bị xoá: suất dùng thử đó coi như đã dùng (xoá 20 khách đầu để mời tiếp 20 khách khác thì không được)
  if (g.opens > 0 && wd) wd.trialBurned = (wd.trialBurned || 0) + 1;
  db.guests.splice(db.guests.indexOf(g), 1);
  save();
  json(res, 200, { ok: true });
});

// ---------------- API: phản hồi ----------------
route('GET', '/api/cards/:id/responses', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id);
  const rsvps = db.rsvps.filter((r) => r.cardId === card.id).sort((a, b) => b.createdAt - a.createdAt);
  const wishes = db.wishes.filter((w) => w.cardId === card.id).sort((a, b) => b.createdAt - a.createdAt);
  json(res, 200, { rsvps, wishes });
});

route('GET', '/api/cards/:id/rsvps.csv', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id);
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [['Thời gian', 'Tên', 'Tham dự', 'Số người', 'Khách nhà', 'Nhắn gửi'].map(q).join(',')];
  db.rsvps.filter((r) => r.cardId === card.id).forEach((r) => {
    rows.push([new Date(r.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }), r.name, r.attending === 'yes' ? 'Có' : 'Không', r.count, r.side === 'gai' ? 'Gái' : 'Trai', r.note].map(q).join(','));
  });
  send(res, 200, '﻿' + rows.join('\r\n'), {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="xac-nhan-${card.slug}.csv"`,
  });
});

route('POST', '/api/wishes/:wid/toggle', async (req, res, ctx) => {
  const w = db.wishes.find((x) => x.id === ctx.params.wid);
  if (!w) throw httpError(404, 'Không tìm thấy');
  ownedCard(ctx, w.cardId);
  w.hidden = !w.hidden;
  save();
  json(res, 200, { hidden: w.hidden });
});

// ---------------- API: đọc link Google Maps (link rút gọn → toạ độ + tên địa điểm) ----------------
// GET (không giữ khoá dữ liệu trong lúc chờ Google trả lời)
route('GET', '/api/maplink', async (req, res, ctx) => {
  if (!ctx.user && !(ctx.guest && db.cards.some((c) => c.guestId === ctx.guest && !c.userId))) needUser(ctx);
  rateLimit('map:' + (ctx.user ? ctx.user.id : ctx.ip), ctx.user ? 60 : 20, 36e5);
  const url = String(ctx.query.get('url') || '').trim().slice(0, 500);
  if (!maplink.isMaps(url)) throw httpError(400, 'Đây không phải link Google Maps');
  const r = await maplink.resolve(url) || {};
  const pin = r.lat != null ? `${r.lat},${r.lng}` : r.query ? 'q:' + r.query : '';
  console.log('maplink', JSON.stringify({ pin, name: r.name, chain: r.chain }));
  // chain: các bước chuyển hướng (để xem link được đọc ra sao khi bản đồ chưa đúng chỗ)
  json(res, 200, { pin, exact: r.lat != null, name: r.name || '', chain: r.chain || [] });
});

// ---------------- API: tải ảnh / nhạc ----------------
// video clip ngắn cho slide cưới (MP4 / WebM / MOV, tối đa 60MB — bản chạy thật gửi thẳng lên kho Blob, không qua máy chủ)
const UPLOAD_TYPES = { 'image/jpeg': ['.jpg', 6e6], 'image/png': ['.png', 6e6], 'image/webp': ['.webp', 6e6], 'audio/mpeg': ['.mp3', 12e6], 'video/mp4': ['.mp4', 60e6], 'video/webm': ['.webm', 60e6], 'video/quicktime': ['.mov', 60e6] };
route('POST', '/api/upload', async (req, res, ctx) => {
  const user = needUser(ctx);
  rateLimit('up:' + user.id, 200, 36e5);
  const type = String(req.headers['content-type'] || '').split(';')[0].trim();
  const t = UPLOAD_TYPES[type];
  if (!t) throw httpError(415, 'Chỉ nhận ảnh JPG/PNG/WEBP, nhạc MP3 hoặc video MP4/MOV');
  const buf = await readBody(req, t[1]);
  ctx.tm.mark('body');
  if (!buf.length) throw httpError(400, 'Tệp rỗng');
  const name = `${user.id}-${rid(10)}${t[0]}`;
  let url;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    // Vercel Blob: ổ đĩa serverless không giữ được tệp, nên lưu lên kho Blob (trả về link https)
    const { put } = require('@vercel/blob');
    url = (await put(`uploads/${name}`, buf, { access: 'public', contentType: type, addRandomSuffix: false })).url;
    ctx.tm.mark('blob');
  } else {
    fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
    url = `/uploads/${name}`;
  }
  res.setHeader('Server-Timing', ctx.tm.header());
  ctx.tm.log('upload', { bytes: buf.length, type });
  json(res, 200, { url });
});

// Ảnh gửi thẳng từ trình duyệt lên Vercel Blob (không đi qua hàm máy chủ): máy chủ chỉ cấp vé.
// Tên tệp bắt buộc bắt đầu bằng mã người dùng để biết ảnh của ai (dùng khi xoá ảnh bỏ dở).
const IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const CLIP_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
route('POST', '/api/upload/blob', async (req, res, ctx) => {
  const user = needUser(ctx);
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw httpError(501, 'Chưa cấu hình kho lưu trữ');
  const body = await readJson(req);
  if (!body || body.type !== 'blob.generate-client-token') throw httpError(400, 'Yêu cầu không hợp lệ');
  rateLimit('up:' + user.id, 200, 36e5);
  const { handleUpload } = require('@vercel/blob/client');
  const out = await handleUpload({
    body, request: req,
    onBeforeGenerateToken: async (pathname) => {
      if (!new RegExp(`^uploads/${user.id}-[\\w-]+\\.(webp|jpg|png|mp4|webm|mov)$`).test(pathname)) throw httpError(400, 'Tên tệp không hợp lệ');
      const clip = /\.(mp4|webm|mov)$/.test(pathname);
      return { allowedContentTypes: clip ? CLIP_TYPES : IMG_TYPES, maximumSizeInBytes: clip ? 60e6 : 6e6, addRandomSuffix: true };
    },
  });
  res.setHeader('Server-Timing', ctx.tm.header());
  ctx.tm.log('upload-token');
  json(res, 200, out);
});

// Ảnh vừa tải lên nhưng người dùng bỏ (đóng bảng căn chỉnh) → xoá khỏi kho. Chỉ xoá ảnh của chính mình
// và chỉ khi chưa thiệp nào của họ dùng tới.
route('POST', '/api/upload/discard', async (req, res, ctx) => {
  const user = needUser(ctx);
  const { url } = await readJson(req);
  const u = String(url || '');
  const local = /^\/uploads\/([\w-]+)\.(webp|jpg|png)$/.exec(u);
  const blob = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/uploads\/([\w-]+)\.(webp|jpg|png)$/i.exec(u);
  const m = local || blob;
  if (!m || !m[1].startsWith(user.id + '-')) throw httpError(400, 'Ảnh không hợp lệ');
  const used = db.cards.some((c) => JSON.stringify(c.data || {}).includes(u) || JSON.stringify(c.video || {}).includes(u));
  if (!used) {
    if (local) fs.rmSync(path.join(UPLOAD_DIR, path.basename(u)), { force: true });
    else if (process.env.BLOB_READ_WRITE_TOKEN) { try { await require('@vercel/blob').del(u); } catch (e) { console.warn('Không xoá được ảnh bỏ dở:', e.message); } }
  }
  json(res, 200, { ok: true, removed: !used });
});

// ---------------- API: thanh toán ----------------
route('POST', '/api/cards/:id/order', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id);
  const b = await readJson(req);
  // màn thanh toán chung gửi b.items (các món khách tick); cách cũ gửi b.product
  let product = PRODUCTS[b.product] && b.product !== 'multi' ? b.product : 'card', items = null;
  if (Array.isArray(b.items)) ({ product, items } = pickProduct(card, b.items.map(String)));
  const P = PRODUCTS[product];
  if (product === 'led' || product === 'video') { if (partPaid(card, product)) throw httpError(400, `${P.name} này đã được kích hoạt`); }
  else if (product !== 'multi') {
    const target = P.sub(card);
    if (!target) throw httpError(400, `Hãy tạo ${P.name.toLowerCase()} trước`);
    if (target.paid) throw httpError(400, `${P.name} này đã được kích hoạt`);
  }
  if (product === 'combo' && comboHave(card).length === 3) throw httpError(400, 'Thiệp, màn LED và video của bạn đều đã kích hoạt — không cần mua Trọn bộ nữa');
  // trả tiền là chốt tên cô dâu chú rể + ngày cưới (màn LED / video: chốt hẳn) → phải có đủ trước khi kích hoạt
  if (!card.data.groom.name || !card.data.bride.name || !card.data.date) throw httpError(400, 'Điền tên cô dâu, chú rể và ngày cưới trước khi kích hoạt nhé — kích hoạt là chốt, sau đó không đổi được nữa.');
  const key = (x) => (x || []).slice().sort().join(',');
  const isThis = (o) => o.cardId === card.id && (o.product || 'card') === product && o.status === 'pending' && (product !== 'multi' || key(o.items) === key(items));
  let order = db.orders.find(isThis);
  if (!order) {
    order = { id: rid(12), code: P.prefix + rid(6).toUpperCase(), product, cardId: card.id, userId: card.userId, status: 'pending', createdAt: Date.now() };
    if (product === 'multi') order.items = items;
    order.amount = P.price(card, order);
    db.orders.push(order);
  }
  if (product === 'multi') { order.amount = P.price(card, order); delete order.coupon; delete order.discount; } // gói tự chọn: không áp mã giảm giá
  // combo: giá tuỳ thiệp đã kích hoạt chưa (nâng cấp) → tính lại mỗi lần mở (giữ mã đã áp)
  if (product === 'combo') order.upgrade = comboHave(card).length > 0;
  // mã giảm giá (lib/discounts.js): b.coupon = mã mới ('' = bỏ mã); không gửi thì giữ mã đã áp, mã hết hạn/hết lượt thì tự bỏ
  const code = b.coupon !== undefined ? discounts.norm(b.coupon) : order.coupon || '';
  let d = null;
  if (code) {
    try { d = discounts.check(code, product, order.id); } catch (e) { if (b.coupon !== undefined) throw e; }
  }
  if (product !== 'multi' && (d || b.coupon !== undefined || product === 'combo' || order.coupon)) {
    const price = P.price(card), off = d ? discounts.offFor(d, price) : 0;
    order.amount = price - off;
    if (d) { order.coupon = d.code; order.discount = off; } else { delete order.coupon; delete order.discount; }
  }
  // giá đã hạ sau khi tạo đơn (đổi giá trong config.json): đơn đang chờ theo giá mới. Chỉ hạ, không nâng giá đơn khách đã thấy
  // (khách lỡ chuyển theo QR cũ giá cao hơn vẫn được kích hoạt: SePay nhận khi số tiền ≥ giá đơn).
  if (!d && !order.coupon && product !== 'multi') { const now = P.price(card); if (now < order.amount) order.amount = now; }
  // mã giảm hết 100% → không cần chuyển khoản: khách thấy giá 0đ, bấm "Xác nhận kích hoạt" (b.confirm) mới kích hoạt
  if (order.amount <= 0 && d && b.confirm === true) markPaid(order, 'coupon');
  // đã chuyển thiếu trước đó mà giá đơn nay hạ (đổi giá, áp mã) xuống còn ≤ số đã nhận → đủ tiền, kích hoạt luôn
  else if (order.status === 'pending' && receivedFor(order) > 0 && receivedFor(order) >= order.amount) markPaid(order, 'sepay');
  save();
  json(res, 200, { order: orderView(order) });
});

// Dùng lượt Trọn bộ cho màn LED / video của thiệp này
route('POST', '/api/cards/:id/redeem', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id);
  const b = await readJson(req);
  const kind = b.product === 'video' ? 'video' : b.product === 'led' ? 'led' : null;
  if (!kind) throw httpError(400, 'Sản phẩm không hợp lệ');
  useCredit(card, kind);
  save();
  json(res, 200, { card: cardSummary(card) });
});

// Chủ thiệp xem trạng thái đơn (cửa sổ thanh toán hỏi lại vài giây một lần để biết tiền đã về)
route('GET', '/api/orders/:code', async (req, res, ctx) => {
  const o = db.orders.find((x) => x.code === ctx.params.code);
  if (!o) throw httpError(404, 'Không tìm thấy đơn');
  ownedCard(ctx, o.cardId, { guest: true });
  json(res, 200, { order: orderView(o) });
});

// Chủ thiệp báo "Tôi đã chuyển khoản"
route('POST', '/api/orders/:code/claim', async (req, res, ctx) => {
  rateLimit('claim:' + ctx.ip, 10, 36e5, true);
  const o = db.orders.find((x) => x.code === ctx.params.code);
  if (!o) throw httpError(404, 'Không tìm thấy đơn');
  ownedCard(ctx, o.cardId, { guest: true });
  if (o.status === 'pending') { o.claimedAt = Date.now(); save(); }
  json(res, 200, { order: orderView(o) });
});

// Kích hoạt sản phẩm của đơn — dùng chung cho quản trị viên bấm tay và SePay báo tiền về
function markPaid(o, via) {
  o.status = 'paid';
  o.paidAt = Date.now();
  o.paidVia = via;
  const card = db.cards.find((c) => c.id === o.cardId);
  if (card && o.product === 'combo') activateCombo(card, o.paidAt);
  else if (card) {
    for (const k of o.product === 'multi' ? o.items || [] : [o.product || 'card']) activatePart(card, k, o.paidAt);
    fixNames(card);
  }
  closeCovered(o);
}

// một món: thiệp (cả đám cưới), màn LED / slide (đã tạo thì kích hoạt, chưa tạo thì ghi đã trả — tạo ra là tự mở)
function activatePart(card, k, at) {
  if (k === 'card') return payCard(card, at);
  const t = card[k];
  if (t) { if (!t.paid) { t.paid = true; t.paidAt = at; } } else card.prepaid = { ...(card.prepaid || {}), [k]: true };
}
function productPaid(o) {
  const card = db.cards.find((c) => c.id === o.cardId);
  if (!card) return false;
  if (o.product === 'multi') return (o.items || []).every((k) => partPaid(card, k));
  if (o.product === 'led' || o.product === 'video') return partPaid(card, o.product);
  const target = PRODUCTS[o.product || 'card'].sub(card);
  return !!(target && target.paid);
}
// Đơn đang chờ mà sản phẩm của nó đã được trả bằng đơn khác (vd. tạo đơn thiệp 99k rồi trả đơn Trọn bộ 169k) → tự đóng,
// khỏi nằm mãi ở "Cần xử lý" và khỏi bị trả nhầm lần nữa. `by`: đơn vừa trả (không có = dọn dữ liệu cũ lúc nạp kho).
function closeCovered(by) {
  let n = 0;
  db.orders.forEach((x) => {
    if (x === by || x.status !== 'pending' || (by && x.cardId !== by.cardId) || !productPaid(x)) return;
    x.status = 'cancelled'; x.cancelledAt = (by && by.paidAt) || Date.now();
    x.note = by ? `Tự đóng — đã thanh toán qua đơn ${by.code}` : 'Tự đóng — sản phẩm đã được thanh toán qua đơn khác';
    n++;
  });
  return n;
}
store.onLoad(() => { if (closeCovered()) save(); });

// SePay báo có giao dịch vào tài khoản ngân hàng (https://docs.sepay.vn — webhook, xác thực "API Key").
// Tìm mã đơn (TH/LD/VD + 6 ký tự) trong nội dung chuyển khoản; đủ tiền thì kích hoạt ngay.
// Thiếu tiền / đơn đã trả rồi / không thấy mã → ghi chú để quản trị viên xử lý tay. Luôn trả success
// cho SePay (trừ sai khoá) để SePay không gửi lại mãi.
const money = (n) => n.toLocaleString('vi-VN') + 'đ';
route('POST', '/api/pay/sepay', async (req, res, ctx) => {
  const key = process.env.SEPAY_API_KEY || '';
  if (!key) throw httpError(503, 'Chưa cấu hình SEPAY_API_KEY');
  const got = Buffer.from(String(req.headers.authorization || '').replace(/^apikey\s+/i, '').trim());
  const want = Buffer.from(key);
  if (got.length !== want.length || !require('crypto').timingSafeEqual(got, want)) throw httpError(401, 'Sai khoá API');
  const t = await readJson(req, 64 * 1024);
  const txnId = String(t.id || t.referenceCode || '');
  const amount = Math.round(+t.transferAmount || 0);
  if (t.transferType !== 'in' || !txnId || amount <= 0) return json(res, 200, { success: true, skipped: true });
  if (db.bankTxns.some((x) => x.id === txnId)) return json(res, 200, { success: true, duplicate: true });

  const text = `${t.code || ''} ${t.content || ''} ${t.description || ''}`.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const prefixes = Object.values(PRODUCTS).map((p) => p.prefix).join('|');
  let o = null;
  // dò mọi vị trí (kể cả chồng lấn): mã ngân hàng kiểu "MBVCB.123…" có thể nuốt mất đầu mã đơn nếu dò kiểu thường
  for (const m of text.matchAll(new RegExp(`(?=((?:${prefixes})[A-Z0-9]{6}))`, 'g'))) {
    o = db.orders.find((x) => x.code === m[1]);
    if (o) break;
  }
  let result;
  if (!o) result = 'unmatched';
  else if (o.status === 'paid' || productPaid(o)) {
    result = 'already-paid';
    o.bankNote = `Nhận thêm ${money(amount)} khi đơn đã thanh toán — cần hoàn tiền`;
  } else {
    // Trọn bộ: khách vừa mua lẻ thêm phần nào sau khi tạo đơn → giá nâng cấp đã giảm, nhận theo giá mới (chỉ hạ, không nâng)
    if ((o.product || 'card') === 'combo' && !o.coupon) {
      const oc = db.cards.find((c) => c.id === o.cardId);
      if (oc) { const now = PRODUCTS.combo.price(oc); if (now < o.amount) { o.amount = now; o.upgrade = comboHave(oc).length > 0; } }
    }
    // khách chuyển thiếu rồi chuyển bù: cộng các lần chuyển trước của cùng đơn, đủ tiền thì kích hoạt
    const before = db.bankTxns.filter((x) => x.order === o.code && x.result === 'underpaid').reduce((n, x) => n + x.amount, 0);
    const total = before + amount;
    if (total < o.amount) {
      result = 'underpaid';
      o.claimedAt = o.claimedAt || Date.now();
      o.bankNote = `Nhận ${money(total)}${before ? ` (${money(before)} + ${money(amount)})` : ''}, thiếu ${money(o.amount - total)}`;
    } else {
      result = 'paid';
      o.bankNote = total > o.amount ? `Nhận ${money(total)}, thừa ${money(total - o.amount)}` : before ? `Nhận đủ sau nhiều lần chuyển (${money(total)})` : o.bankNote;
      if (!o.bankNote) delete o.bankNote;
      markPaid(o, 'sepay');
    }
  }
  db.bankTxns.push({ id: txnId, amount, content: str(t.content || '', 300), at: Date.now(), order: o ? o.code : null, result });
  if (db.bankTxns.length > 2000) db.bankTxns.splice(0, db.bankTxns.length - 2000);
  save();
  json(res, 200, { success: true, result });
});

// ---------------- API: quản trị ----------------
route('GET', '/api/admin/session', async (req, res, ctx) => {
  if (ctx.admin) stats.markOwner(req, res, BASE_URL.startsWith('https'));
  // byEmail: quản trị theo tài khoản Google được chỉ định (ADMIN_EMAILS) thay cho mật khẩu
  json(res, 200, { admin: ctx.admin, enabled: adminAuth.byEmail() || adminAuth.enabled(), byEmail: adminAuth.byEmail(), email: ctx.user ? ctx.user.email : '' });
});
route('POST', '/api/admin/login', async (req, res, ctx) => {
  if (adminAuth.byEmail()) throw httpError(403, 'Trang quản trị chỉ mở cho tài khoản Google của chủ web');
  rateLimit('admin-login:' + ctx.ip, 8, 15 * 60e3, true);
  if (!adminAuth.enabled()) throw httpError(503, 'Chưa đặt mật khẩu quản trị (biến môi trường ADMIN_PASSWORD)');
  const b = await readJson(req);
  if (!adminAuth.verify(String(b.password || ''))) throw httpError(401, 'Sai mật khẩu');
  adminAuth.login(res);
  json(res, 200, { ok: true });
});
route('POST', '/api/admin/logout', async (req, res) => {
  adminAuth.logout(res);
  json(res, 200, { ok: true });
});
route('GET', '/api/admin/overview', async (req, res, ctx) => {
  needAdmin(ctx);
  const paid = db.orders.filter((o) => o.status === 'paid');
  // đơn chờ xác nhận lên đầu, rồi mới nhất trước
  const orders = db.orders.slice().sort((a, b) =>
    (b.status === 'pending') - (a.status === 'pending') || (b.claimedAt || b.createdAt) - (a.claimedAt || a.createdAt));
  json(res, 200, {
    stats: {
      users: db.users.length, cards: db.cards.length, published: db.cards.filter((c) => c.status === 'published').length,
      paid: paid.length, revenue: paid.reduce((n, o) => n + o.amount, 0), rsvps: db.rsvps.length,
    },
    orders: orders.slice(0, 300).map((o) => ({ ...orderView(o), id: o.id, email: (db.users.find((u) => u.id === o.userId) || {}).email })),
  });
});
route('POST', '/api/admin/orders/:id/confirm', async (req, res, ctx) => {
  needAdmin(ctx);
  const o = db.orders.find((x) => x.id === ctx.params.id);
  if (!o) throw httpError(404, 'Không tìm thấy đơn');
  // đơn đã thanh toán (SePay vừa báo, hoặc bấm hai lần) mà xác nhận nữa thì Trọn bộ bị cộng lượt LED + video lần hai
  if (o.status === 'paid' || productPaid(o)) throw httpError(409, 'Đơn này đã được thanh toán rồi');
  markPaid(o, 'admin');
  adminLib.audit(ctx, 'Xác nhận đơn', o.code, `${o.amount}đ`);
  json(res, 200, { ok: true });
});
adminLib.routes({ route, needAdmin, PRODUCTS, orderView, cardSummary, BASE_URL });

// Thiệp bị quản trị viên gỡ: khách mở link thấy thông báo (chủ thiệp vẫn xem trước được)
const BLOCKED_HTML = () => renderNotice('Thiệp tạm thời không khả dụng', 'Thiệp này đang được đội ngũ hỗ trợ kiểm tra. Bạn vui lòng liên hệ cô dâu chú rể nhé.');

// ---------------- API công khai trên trang thiệp ----------------
const isOwner = (ctx, card) => !!(ctx.admin || canManage(ctx.user, card));
function publicCard(slug) {
  const card = cardBySlug(slug);
  if (!card || card.blocked || card.status !== 'published' || cardState(card).expired) throw httpError(404, 'Thiệp không còn nhận phản hồi');
  return card;
}
route('POST', '/api/public/:slug/rsvp', async (req, res, ctx) => {
  const card = publicCard(ctx.params.slug);
  // chủ thiệp thử nhiều lần không bị chặn; khách: nhiều người dự tiệc hay chung một IP (4G / wifi nhà hàng) nên nới rộng
  if (!isOwner(ctx, card)) rateLimit(`rsvp:${ctx.ip}:${card.id}`, 30, 6e5, true);
  const b = await readJson(req, 4096);
  const name = str(b.name, 80);
  if (!name) throw httpError(400, 'Bạn nhập tên giúp mình nhé');
  const r = {
    name, attending: b.attending === 'no' ? 'no' : 'yes', count: Math.min(10, Math.max(1, parseInt(b.count, 10) || 1)),
    side: b.side === 'gai' ? 'gai' : 'trai', note: str(b.note, 200),
  };
  // ghi ngược vào danh sách khách của sổ tay: khớp link riêng → khớp tên → thêm khách mới
  const guest = Gs.recordRsvp(card.weddingId, typeof b.g === 'string' ? b.g : null, r);
  db.rsvps.push({ id: rid(12), cardId: card.id, guestId: guest ? guest.id : null, ...r, createdAt: Date.now() });
  save();
  json(res, 200, { ok: true });
});
route('POST', '/api/public/:slug/wish', async (req, res, ctx) => {
  const card = publicCard(ctx.params.slug);
  if (!isOwner(ctx, card)) rateLimit(`wish:${ctx.ip}:${card.id}`, 20, 6e5, true);
  const b = await readJson(req, 4096);
  const name = str(b.name, 60);
  const message = str(b.message, 500);
  if (!name || !message) throw httpError(400, 'Bạn nhập tên và lời chúc nhé');
  db.wishes.push({ id: rid(12), cardId: card.id, name, message, hidden: false, createdAt: Date.now() });
  save();
  json(res, 200, { ok: true });
});

// ---------------- lượt xem thiệp ----------------
// Chạy máy thường: cộng thẳng vào dữ liệu. Kho từ xa (Vercel): mỗi lần ghi là giữ khoá chung + ghi lại toàn bộ dữ liệu, nên
// lúc cô dâu chú rể vừa gửi link (hàng trăm lượt mở trong vài phút) từng lượt xem mà ghi ngay thì cả web phải xếp hàng.
// → gom lượt xem trong bộ nhớ, ghi gộp mỗi 30 giây hoặc ghi kèm vào lần ghi dữ liệu kế tiếp của bản chạy này.
const pendingViews = new Map(); // id thiệp → { n, guests: Map(id khách → { n, at }) }
let pendingSince = 0;
function flushViews() {
  if (!pendingViews.size) return false;
  for (const [id, p] of pendingViews) {
    const card = db.cards.find((c) => c.id === id);
    if (!card) continue;
    card.views = (card.views || 0) + p.n;
    for (const [gid, x] of p.guests) {
      const g = db.guests.find((y) => y.id === gid);
      if (g) { g.opens = (g.opens || 0) + x.n; g.openedAt = g.openedAt || x.at; }
    }
  }
  pendingViews.clear();
  pendingSince = 0;
  save();
  return true;
}
function countView(card, guest) {
  if (!store.remote) {
    card.views = (card.views || 0) + 1;
    if (guest) { guest.opens = (guest.opens || 0) + 1; guest.openedAt = guest.openedAt || Date.now(); }
    return save();
  }
  const p = pendingViews.get(card.id) || { n: 0, guests: new Map() };
  p.n++;
  if (guest) { const x = p.guests.get(guest.id) || { n: 0, at: Date.now() }; x.n++; p.guests.set(guest.id, x); }
  pendingViews.set(card.id, p);
  pendingSince = pendingSince || Date.now();
  if (Date.now() - pendingSince > 30000) flushViews();
}

// ---------------- trang thiệp ----------------
function html(res, status, body) {
  send(res, status, body, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
}

async function showCard(req, res, ctx) {
  const card = cardBySlug(ctx.params.slug);
  if (!card) return html(res, 404, renderNotice('Không tìm thấy thiệp', 'Đường dẫn có thể đã bị đổi hoặc thiệp đã bị xoá.'));
  if (card.slug !== ctx.params.slug) { // link cũ (trước khi đổi sang tên đôi) → chuyển sang link mới, giữ mã khách mời
    const q = ctx.query.toString();
    res.writeHead(301, { Location: `/t/${card.slug}${ctx.params.code ? '/' + encodeURIComponent(ctx.params.code) : ''}${q ? '?' + q : ''}` });
    return res.end();
  }
  const isOwner = canManage(ctx.user, card) || guestOwns(ctx, card) || ctx.admin; // quản trị viên xem trước được để kiểm tra
  const preview = isOwner && ctx.query.get('preview') === '1';
  const st = cardState(card);
  if (!preview) {
    if (card.blocked) return html(res, 403, BLOCKED_HTML());
    if (card.status !== 'published') return html(res, 404, renderNotice('Thiệp chưa được phát hành', 'Cô dâu chú rể đang hoàn thiện thiệp, bạn quay lại sau nhé.'));
    if (st.expired) return html(res, 403, renderNotice('Thiệp đang tạm khoá', 'Thời gian dùng thử của thiệp đã hết. Chủ thiệp cần kích hoạt để tiếp tục chia sẻ.'));
  }
  const code = ctx.params.code || ctx.query.get('g');
  const found = code && card.weddingId ? db.guests.find((g) => g.weddingId === card.weddingId && g.code === code) : null;
  const guest = found && Gs.personalAllowed(card, found) ? found : null; // quá giới hạn dùng thử → lời mời chung
  if (!preview && !isOwner) countView(card, guest);
  const wishes = db.wishes.filter((w) => w.cardId === card.id && !w.hidden).sort((a, b) => b.createdAt - a.createdAt).slice(0, 200);
  const edit = preview && ctx.query.get('edit') === '1'; // khung sửa trực tiếp trong trang sửa thiệp (chỉ chủ thiệp)
  const dr = preview && ctx.query.get('draft') === '1' && DRAFTS.get(card.id);
  const view = dr ? { ...card, data: dr.data, template: dr.template, palette: dr.palette, title: dr.title } : card;
  html(res, 200, renderCard(view, { guest, wishes, preview, edit, trial: !st.paid, baseUrl: BASE_URL }));
}
route('GET', '/t/:slug', showCard);
route('GET', '/t/:slug/:code', showCard);

route('GET', '/demo/:tpl', async (req, res, ctx) => {
  const tpl = templates[ctx.params.tpl];
  if (!tpl) return serveStatic(req, res, '/demo/' + ctx.params.tpl); // ảnh mẫu trong public/demo
  // mẫu có thể kèm ảnh xem thử riêng: demo: { cover: '/demo/<id>-1.jpg', photos: [...] }
  const card = { slug: 'demo', template: tpl.id, palette: ctx.query.get('palette') || '', data: cd.normalize({ ...cd.sample(), ...tpl.demo }) };
  const guest = { name: 'Anh Hoàng & Người thương', code: 'demo' };
  const wishes = [
    { name: 'Lan Anh', message: 'Chúc hai bạn trăm năm hạnh phúc, sớm có tin vui nhé!' },
    { name: 'Team Marketing', message: 'Mãi yêu thương và luôn cười thật tươi như hôm nay ❤' },
  ];
  // ?preview=1: bỏ màn mở thiệp, hiện thẳng trang bìa (ảnh xem trước trong bộ sưu tập trang chủ)
  // ?lite=1: bản nhẹ cho thẻ rê chuột — ảnh nạp lười, khối ngoài màn hình chưa vẽ, bản đồ Google thay bằng ô giữ chỗ
  const preview = ctx.query.get('preview') === '1', lite = ctx.query.get('lite') === '1';
  await demoView(req, ctx, 'thiep:' + tpl.id);
  html(res, 200, renderCard(card, { guest, wishes, demo: true, preview, lite, trial: false, baseUrl: BASE_URL }));
});

// ---------------- gợi ý thiệp từ ảnh (trang /goi-y) ----------------
// Khách thả ảnh cưới vào trang /goi-y: trình duyệt tự đọc màu ảnh, chọn vài mẫu hợp tông rồi mở từng mẫu ở đây trong khung
// xem thử. Ảnh KHÔNG gửi lên máy chủ: thiệp vẽ ra với các ô ảnh giữ chỗ mang "#k=<vị trí>" (như chế độ sửa), trang /goi-y
// thay ảnh trong máy khách vào đúng các ô đó. ?n= số ảnh album, ?groom= ?bride= ?date= chữ khách vừa gõ.
route('GET', '/goi-y/xem/:tpl', async (req, res, ctx) => {
  const tpl = templates[ctx.params.tpl];
  if (!tpl) throw httpError(404, 'Không có mẫu này');
  const q = ctx.query;
  const d = cd.normalize(cd.sample());
  const groom = str(q.get('groom'), 40), bride = str(q.get('bride'), 40);
  Object.assign(d.groom, { name: groom || 'Chú Rể', fullName: groom || 'Chú Rể' });
  Object.assign(d.bride, { name: bride || 'Cô Dâu', fullName: bride || 'Cô Dâu' });
  const date = /^\d{4}-\d{2}-\d{2}$/.test(q.get('date') || '') ? q.get('date') : '';
  if (date) { d.date = date; d.events.forEach((e) => { e.date = date; }); }
  d.gifts = cd.defaults().gifts; // không hiện tài khoản mẫu
  d.music = ''; d.musicOff = true;
  const n = Math.max(0, Math.min(12, parseInt(q.get('n'), 10) || 0));
  d.cover = '/card/slot.svg#k=cover';
  d.photos = Array.from({ length: n }, (_, i) => `/card/slot.svg#k=photos.${i}`);
  const card = { slug: 'demo', template: tpl.id, palette: q.get('palette') || '', data: d };
  html(res, 200, renderCard(card, { guest: null, wishes: [], demo: true, preview: true, lite: q.get('lite') === '1', trial: false, baseUrl: BASE_URL }));
}, { noDb: true });

// ---------------- màn hình LED ----------------
route('GET', '/led/:slug', async (req, res, ctx) => {
  const slug = ctx.params.slug;
  if (slug.includes('.')) return serveStatic(req, res, '/led/' + slug); // led.js, led.css
  if (slug === 'demo') {
    const q = Object.fromEntries(ctx.query);
    const led = ledLib.normalize({ ...q, kicker: 'Lễ Thành Hôn', message: ledLib.defaults().message });
    await demoView(req, ctx, `led:${led.palette}-${led.effect}`);
    const card = { data: cd.normalize(cd.sample()) };
    return html(res, 200, ledLib.renderLed(card, led, { demo: true, preview: q.preview === '1' }));
  }
  const card = cardBySlug(slug);
  const isOwner = canManage(ctx.user, card) || guestOwns(ctx, card) || ctx.admin;
  if (!card || !card.led) return html(res, 404, renderNotice('Không tìm thấy màn hình LED', 'Đường dẫn có thể đã bị đổi. Hãy hỏi lại cô dâu chú rể nhé.'));
  if (card.blocked && !isOwner) return html(res, 403, BLOCKED_HTML());
  const st = ledLib.state(card.led);
  // khung xem trước của trình sửa: chủ thiệp + ?preview=1 + mở trong khung (trình duyệt tự gửi Sec-Fetch-Dest, trang web không giả được)
  const preview = isOwner && ctx.query.get('preview') === '1' && req.headers['sec-fetch-dest'] !== 'document';
  // chưa kích hoạt: không có trình chiếu thật — chỉ xem trước trong trình sửa
  if (st.locked && !preview) {
    return html(res, 403, isOwner
      ? renderNotice('Màn hình LED chưa kích hoạt', 'Bạn vẫn xem trước và sửa màn LED trong trình sửa. Kích hoạt một lần để trình chiếu ở tiệc cưới, không còn dòng "Bản dùng thử".', { href: `/sua-led/${card.id}`, text: 'Kích hoạt màn LED' })
      : renderNotice('Màn hình LED chưa sẵn sàng', 'Chủ thiệp chưa kích hoạt màn LED này.'));
  }
  if (!preview && !(card.led.names && card.led.names.groom && card.led.names.bride)) { fixNames(card); if (card.led.names) save(); } // lần đầu chiếu thật: khoá tên đôi (kích hoạt lúc chưa đủ tên)
  html(res, 200, ledLib.renderLed(card, card.led, { preview, trial: !st.paid }));
});

// mẫu album xem thử với một bộ ảnh cưới đầy đủ
const P = (pool, ns, ext = 'jpg') => ns.map((n) => `/demo/${pool}-${n}.${ext}`);
const VIDEO_SETS = { // bộ ảnh xem thử hợp từng mẫu
  album: P('longphung', [2, 5, 1, 3, 6, 4, 8, 7, 9, 10]).concat(P('dodam', [1, 2, 4, 3])),
  songhy: P('longphung', [3, 1, 6, 2, 8, 4, 9, 5, 10, 7]),
  dienanh: P('tim', [2, 6, 1, 5, 3, 8, 4, 7]),
  phimcu: P('nau', [2, 4, 6, 1, 5, 8, 3, 7]),
  polaroid: P('hoamoc', [2, 5, 3, 7, 4, 8, 6], 'webp'),
  tapchi: P('naudam', [7, 5, 6, 9, 3, 4, 10, 8]),
  traitim: P('toduyen', [3, 1, 4, 2, 5, 6, 7], 'webp'),
  hoadao: P('toduyen', [2, 5, 3, 6, 1, 4, 7], 'webp'),
  laxanh: P('hoamoc', [6, 2, 7, 3, 1, 4, 8, 5], 'webp'),
  toigian: P('xanhla', [1, 3, 2, 5, 4, 6, 8, 7, 9]),
  baocuoi: P('nau', [1, 3, 5, 2, 6, 4, 7, 8]),
  lichhen: P('toduyen', [1, 4, 2, 6, 3, 5, 7], 'webp'),
  saodem: P('tim', [1, 3, 5, 2, 7, 4, 6, 8]),
};
// ảnh mẫu cho trang sửa video khi người dùng chưa có ảnh nào: đủ số ô của mẫu (lặp lại bộ ảnh nếu thiếu)
function videoSamples(t) {
  const base = VIDEO_SETS[t.id] || VIDEO_SETS.album, n = t.slots || base.length;
  return Array.from({ length: n }, (_, i) => base[i % base.length]);
}

// ---------------- slide cưới / màn hình dạm ngõ ----------------
route('GET', '/video/:slug', async (req, res, ctx) => {
  const slug = ctx.params.slug;
  if (slug.includes('.')) return serveStatic(req, res, '/video/' + slug); // engine.js
  if (slug === 'demo') {
    const q = Object.fromEntries(ctx.query);
    const card = { data: cd.normalize(cd.sample()) };
    const photos = VIDEO_SETS[q.template] || [];
    await demoView(req, ctx, 'video:' + (videoLib.options().templates.some((t) => t.id === q.template) ? q.template : 'chung'));
    const v = videoLib.normalize({ template: q.template, photoBg: q.photo === '1', photos, event: { kind: 'Lễ Dạm Ngõ', date: '2026-11-22', time: '09:00', place: 'Tư gia nhà gái' } });
    const useUrl = videoLib.options().templates.some((t) => t.id === q.template) ? `/tao-video?mau=${encodeURIComponent(q.template)}` : '';
    return html(res, 200, videoLib.renderVideo(card, v, { preview: q.preview === '1', useUrl }));
  }
  const card = cardBySlug(slug);
  const isOwner = canManage(ctx.user, card);
  if (!card || !card.video) return html(res, 404, renderNotice('Không tìm thấy video', 'Đường dẫn có thể đã bị đổi.'));
  if (card.blocked && !isOwner) return html(res, 403, BLOCKED_HTML());
  const st = videoLib.state(card.video);
  // chưa kích hoạt: không có link chiếu TV — chỉ xem trước trong trình sửa
  if (st.locked) {
    return html(res, 403, isOwner
      ? renderNotice('Video chưa kích hoạt', 'Bạn vẫn xem trước và sửa video trong trình sửa. Kích hoạt một lần để chiếu TV bằng link và tải MP4 Full HD, không còn dòng "Bản dùng thử".', { href: `/sua-video/${card.id}`, text: 'Kích hoạt video' })
      : renderNotice('Video chưa sẵn sàng', 'Chủ thiệp chưa kích hoạt video này.'));
  }
  const inEditor = isOwner && ctx.query.get('preview') === '1' && req.headers['sec-fetch-dest'] !== 'document'; // khung xem trước của trình sửa (mở thẳng một tab thì tính là chiếu thật)
  if (!inEditor && !(card.video.names && card.video.names.groom && card.video.names.bride)) { fixNames(card); if (card.video.names) save(); } // lần đầu chiếu thật: khoá tên đôi
  html(res, 200, videoLib.renderVideo(card, card.video, { preview: isOwner && ctx.query.get('preview') === '1', trial: false }));
});

route('POST', '/api/cards/:id/video/reset', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id);
  if (!card.video) throw httpError(400, 'Hãy tạo video trước');
  card.video.scenes = videoLib.defaultScenes();
  card.updatedAt = Date.now();
  save();
  json(res, 200, { card: cardFull(card) });
});

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    execFile(config.ffmpegPath || 'ffmpeg', args, { timeout: 10 * 60e3, windowsHide: true, maxBuffer: 8e6 }, (err, _out, stderr) => {
      // máy chủ không cài ffmpeg (ENOENT): báo rõ để khách dùng link chiếu TV thay vì "lỗi máy chủ" chung chung
      if (err && err.code === 'ENOENT') { console.error('ffmpeg chưa được cài trên máy chủ'); reject(httpError(503, 'Máy chủ tạm chưa xuất được MP4 — bạn vẫn chiếu được bằng link "Chép link chiếu TV". Vui lòng thử lại sau hoặc nhắn hỗ trợ.')); }
      else if (err) { console.error('ffmpeg lỗi:', String(stderr).slice(-1500)); reject(httpError(500, 'Chuyển video thất bại')); }
      else resolve();
    });
  });
}

// Nhận bản quay WebM từ trình duyệt → MP4 Full HD H.264 (TV, USB, Zalo đều mở được)
let exporting = 0;
route('POST', '/api/cards/:id/video/export', async (req, res, ctx) => {
  const card = ownedCard(ctx, ctx.params.id);
  if (!card.video) throw httpError(400, 'Hãy tạo video trước');
  if (!card.video.paid) throw httpError(402, 'Kích hoạt video để tải bản MP4 Full HD');
  fixNames(card); // xuất MP4: khoá tên đôi (kích hoạt lúc chưa đủ tên)
  rateLimit('export:' + card.userId, 10, 36e5);
  if (exporting >= 2) throw httpError(503, 'Máy chủ đang bận xuất video khác, thử lại sau 1 phút nhé');
  const type = String(req.headers['content-type'] || '').split(';')[0].trim();
  const EXT = { 'video/webm': '.webm', 'video/mp4': '.mp4', 'video/h264': '.h264' }; // h264 thô từ WebCodecs, 30 khung/giây
  if (!EXT[type]) throw httpError(415, 'Định dạng bản quay không hợp lệ');
  const loops = Math.min(30, Math.max(1, parseInt(ctx.query.get('loops'), 10) || 1));
  const buf = await readBody(req, 200e6);
  if (buf.length < 1000) throw httpError(400, 'Bản quay rỗng');
  exporting++;
  const tmp = path.join(UPLOAD_DIR, `tmp-${rid(10)}${EXT[type]}`);
  const name = `${card.userId}-video-${rid(10)}.mp4`;
  try {
    fs.writeFileSync(tmp, buf);
    const args = ['-y', '-hide_banner', '-loglevel', 'error'];
    if (loops > 1) args.push('-stream_loop', String(loops - 1));
    if (type === 'video/h264') args.push('-f', 'h264', '-framerate', '30');
    args.push('-i', tmp);
    const music = card.data.music && /^\/uploads\/[\w.-]+\.mp3$/.test(card.data.music) ? path.join(UPLOAD_DIR, path.basename(card.data.music))
      : card.data.music && /^\/music\/[\w-]+\.mp3$/.test(card.data.music) ? path.join(PUBLIC_DIR, 'music', path.basename(card.data.music)) : null;
    if (music && fs.existsSync(music)) args.push('-stream_loop', '-1', '-i', music);
    args.push('-map', '0:v:0', '-vf', 'scale=1920:1080:flags=lanczos,fps=30,format=yuv420p',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-profile:v', 'high', '-level', '4.1', '-movflags', '+faststart');
    if (music && fs.existsSync(music)) args.push('-map', '1:a:0', '-c:a', 'aac', '-b:a', '160k', '-shortest');
    else args.push('-an');
    // ghi ra file tạm rồi mới đổi tên: máy chủ tắt giữa chừng không để lại MP4 hỏng
    const part = path.join(UPLOAD_DIR, `tmp-${name}`);
    args.push('-f', 'mp4', part);
    try {
      await runFfmpeg(args);
      fs.renameSync(part, path.join(UPLOAD_DIR, name));
    } catch (e) {
      fs.rmSync(part, { force: true });
      throw e;
    }
  } finally {
    exporting--;
    fs.rm(tmp, { force: true }, () => {});
  }
  const old = card.video.mp4;
  if (old && /^\/uploads\/[\w.-]+\.mp4$/.test(old)) fs.rmSync(path.join(UPLOAD_DIR, path.basename(old)), { force: true });
  card.video.mp4 = `/uploads/${name}`;
  save();
  json(res, 200, { url: card.video.mp4 });
});

// ---- bản sao MP4 (video dựng & đóng gói ngay trong trình duyệt khách) ----
// Chạy thật trên Vercel: trình duyệt tải file thẳng lên Vercel Blob (không qua hàm, không vướng giới hạn 4,5MB);
// máy chủ chỉ cấp vé tải lên và ghi lại đường dẫn. Chạy máy riêng (không có Blob): nhận file và lưu vào uploads.
const BLOB_HOST = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/videos\/[\w-]+\.mp4$/i;
function paidVideoCard(ctx, id) {
  const card = ownedCard(ctx, id);
  if (!card.video) throw httpError(400, 'Hãy tạo video trước');
  if (!card.video.paid) throw httpError(402, 'Kích hoạt video để tải bản MP4 Full HD');
  return card;
}
// bỏ bản xuất cũ (chỉ giữ bản mới nhất của mỗi video)
async function dropOldMp4(old) {
  if (!old) return;
  if (/^\/uploads\/[\w.-]+\.mp4$/.test(old)) fs.rmSync(path.join(UPLOAD_DIR, path.basename(old)), { force: true });
  else if (BLOB_HOST.test(old) && process.env.BLOB_READ_WRITE_TOKEN) {
    try { await require('@vercel/blob').del(old); } catch (e) { console.warn('Không xoá được bản MP4 cũ:', e.message); }
  }
}
route('POST', '/api/cards/:id/video/blob', async (req, res, ctx) => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw httpError(501, 'Chưa cấu hình kho lưu trữ');
  const body = await readJson(req);
  if (!body || body.type !== 'blob.generate-client-token') throw httpError(400, 'Yêu cầu không hợp lệ');
  const card = paidVideoCard(ctx, ctx.params.id);
  rateLimit('mp4copy:' + card.userId, 20, 36e5);
  const { handleUpload } = require('@vercel/blob/client');
  const out = await handleUpload({
    body, request: req,
    onBeforeGenerateToken: async (pathname) => {
      if (pathname !== `videos/${card.id}.mp4`) throw httpError(400, 'Tên file không hợp lệ');
      return { allowedContentTypes: ['video/mp4'], maximumSizeInBytes: 400e6, addRandomSuffix: true, tokenPayload: card.id };
    },
  });
  json(res, 200, out);
});
route('POST', '/api/cards/:id/video/saved', async (req, res, ctx) => {
  const card = paidVideoCard(ctx, ctx.params.id);
  const { url } = await readJson(req);
  if (!BLOB_HOST.test(url || '') || !url.includes(`/videos/${card.id}`)) throw httpError(400, 'Đường dẫn video không hợp lệ');
  const old = card.video.mp4;
  card.video.mp4 = url;
  fixNames(card); // đã xuất MP4: khoá tên đôi (kích hoạt lúc chưa đủ tên)
  save();
  if (old !== url) await dropOldMp4(old);
  json(res, 200, { url });
});
route('POST', '/api/cards/:id/video/saved-file', async (req, res, ctx) => {
  const card = paidVideoCard(ctx, ctx.params.id);
  if (process.env.VERCEL) throw httpError(501, 'Tạm thời chưa lưu được video, bạn thử lại sau hoặc nhắn hỗ trợ nhé');
  const type = String(req.headers['content-type'] || '').split(';')[0].trim();
  if (type !== 'video/mp4') throw httpError(415, 'Chỉ nhận file MP4');
  rateLimit('mp4copy:' + card.userId, 20, 36e5);
  const buf = await readBody(req, 400e6);
  // MP4 hợp lệ có hộp "ftyp" ngay đầu file
  if (buf.length < 1000 || buf.toString('latin1', 4, 8) !== 'ftyp') throw httpError(400, 'File MP4 không hợp lệ');
  const name = `${card.userId}-video-${rid(10)}.mp4`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  const old = card.video.mp4;
  card.video.mp4 = `/uploads/${name}`;
  save();
  await dropOldMp4(old);
  json(res, 200, { url: card.video.mp4 });
});

// ---------------- trang tĩnh ----------------
// Trên Vercel các trang này được CDN trả thẳng (rewrites trong vercel.json) — thêm/đổi trang thì sửa cả hai nơi.
const PAGES = {
  '/': 'index.html', '/dang-nhap': 'auth.html', '/thiep-cua-toi': 'dashboard.html', '/admin': 'admin.html', '/mau-thiep': 'templates.html',
  '/video-dam-ngo': 'video-landing.html',
  '/slide-cuoi': 'slide-landing.html',
  '/man-hinh-led-dam-cuoi': 'led-landing.html',
  '/so-tay': 'planner.html',
  '/video-cua-toi': 'dashboard.html', // cùng trang với "Thiệp của tôi", hiện danh sách video
  '/so-tay-cuoi': 'planner-landing.html',
  '/goi-y': 'suggest.html', // thả ảnh cưới → gợi ý thiệp
  '/video': 'video-tiktok.html', // video báo hỷ đăng TikTok, miễn phí, không cần đăng nhập (dựng trên máy khách)
  '/dieu-khoan': 'dieu-khoan.html', '/chinh-sach-bao-mat': 'chinh-sach-bao-mat.html', '/hoan-tien': 'hoan-tien.html', // trang pháp lý
};
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
};

function serveFile(res, file, cache, req) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return html(res, 404, renderNotice('Không tìm thấy trang', 'Đường dẫn không tồn tại.'));
    // tải từng đoạn (Range): trình duyệt / TV tua được video MP4 lưu trên máy chủ
    const m = req && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (m && (m[1] || m[2])) {
      let start = m[1] ? +m[1] : Math.max(0, st.size - +m[2]);
      let end = m[1] && m[2] ? Math.min(+m[2], st.size - 1) : st.size - 1;
      if (start > end || start >= st.size) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
      res.writeHead(206, {
        'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes',
        'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff',
      });
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, {
      'Accept-Ranges': 'bytes',
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': cache,
      'X-Content-Type-Options': 'nosniff',
    });
    fs.createReadStream(file).pipe(res);
  });
}

// trang cũ gộp vào "Video cưới" (màn LED không còn bán riêng; khách cũ vẫn sửa & chiếu ở /sua-led, /led/…)
const MOVED = { '/video-cuoi': '/video-dam-ngo' }; // video ảnh chuyển sang trang Slide cưới, mẫu chữ ở Video dạm ngõ

function serveStatic(req, res, pathname) {
  if (MOVED[pathname]) { res.writeHead(301, { Location: MOVED[pathname] }); return res.end(); }
  if (PAGES[pathname]) return serveFile(res, path.join(PUBLIC_DIR, PAGES[pathname]), 'no-cache');
  if (/^\/sua\/[\w-]+$/.test(pathname)) return serveFile(res, path.join(PUBLIC_DIR, 'editor.html'), 'no-cache');
  if (/^\/sua-led\/[\w-]+$/.test(pathname)) return serveFile(res, path.join(PUBLIC_DIR, 'led-editor.html'), 'no-cache');
  if (/^\/tham-gia\/[\w-]+$/.test(pathname)) return serveFile(res, path.join(PUBLIC_DIR, 'join.html'), 'no-cache');
  if (/^\/sua-video\/[\w-]+$/.test(pathname)) return serveFile(res, path.join(PUBLIC_DIR, 'video-editor.html'), 'no-cache');
  if (pathname === '/js/cn-guard.js') { // chặn F12 cho khách (lib/guard.js); máy của chủ web nhận bản rỗng
    res.writeHead(200, { 'Content-Type': MIME['.js'], 'Cache-Control': 'private, no-cache', 'Vary': 'Cookie', 'X-Content-Type-Options': 'nosniff' });
    return res.end(stats.ownerDevice(req) ? '/* máy của chủ web: không chặn */\n' : require('./lib/guard').source);
  }
  if (pathname === '/js/lunar.js') { // dựng từ module trong bộ nhớ, không đọc tệp (xem lib/lunar.js)
    res.writeHead(200, { 'Content-Type': MIME['.js'], 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    return res.end(require('./lib/lunar').browserSource);
  }
  if (/^\/uploads\/[\w.-]+$/.test(pathname)) return serveFile(res, path.join(UPLOAD_DIR, path.basename(pathname)), 'public, max-age=31536000, immutable', req);
  const file = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return html(res, 404, renderNotice('Không tìm thấy trang', ''));
  // JS/CSS đổi theo phiên bản code: bắt trình duyệt kiểm tra lại, tránh khách chạy bản cũ
  // ảnh/font/nhạc/video ít đổi → cho trình duyệt giữ lâu (trên Vercel CDN đặt header này qua vercel.json)
  serveFile(res, file, /\.(woff2?|ttf|otf|mp3)$/.test(file) ? 'public, max-age=2592000' : /\.(jpe?g|png|webp|svg|mp4)$/.test(file) ? 'public, max-age=604800' : 'no-cache', req);
}

// ---------------- máy chủ ----------------
// Đo thời gian từng bước của một request (khởi động lạnh, chờ kho dữ liệu, nhận tệp, gửi sang Blob…):
// ghi vào header Server-Timing (xem trong DevTools) và nhật ký Vercel — để biết chậm ở đâu.
let warm = false;
function stopwatch() {
  const t0 = Date.now(), cold = !warm, marks = [];
  warm = true;
  let last = t0;
  return {
    cold,
    mark(name) { const now = Date.now(); marks.push([name, now - last]); last = now; },
    header() { return [...marks.map(([n, d]) => `${n};dur=${d}`), `total;dur=${Date.now() - t0}`, ...(cold ? ['cold'] : [])].join(', '); },
    log(label, extra = {}) { console.log(label, JSON.stringify({ cold, ...Object.fromEntries(marks), total: Date.now() - t0, ...extra })); },
  };
}

const server = http.createServer(async (req, res) => {
  const tm = stopwatch();
  restoreUrl(req); // Vercel có thể gửi request thẳng vào server này, bỏ qua `handler` bên dưới
  let url, pathname;
  try { url = new URL(req.url, 'http://x'); pathname = decodeURIComponent(url.pathname); } catch { return json(res, 400, { error: 'URL lỗi' }); }
  let matched = null, params = null;
  for (const r of routes) {
    if (r.method !== req.method) continue;
    const m = r.re.exec(pathname);
    if (!m) continue;
    matched = r;
    params = Object.fromEntries(r.keys.map((k, i) => [k, m[i + 1]]));
    break;
  }
  // Kho từ xa: nạp dữ liệu mới nhất, và ghi lại trước khi trả lời (res.end chờ ghi xong).
  // Chỉ làm khi có route xử lý — file tĩnh và trang HTML không đụng tới dữ liệu nên không phải chờ kho.
  if (store.remote && matched && !matched.noDb) {
    let finish;
    // Đọc xong nội dung gửi lên rồi mới giữ khoá dữ liệu: máy khách mạng chậm không giữ khoá của cả web trong lúc gửi.
    // Tệp lớn (tải ảnh, video) không đọc sẵn — các route đó tự đọc.
    if (req.method !== 'GET' && req.method !== 'HEAD' && !/^\/api\/upload(\/|$)|\/video\//.test(pathname) && !(+req.headers['content-length'] > 1.5e6)) {
      try { req._body = await readBody(req, 1.5e6); } catch (e) { return json(res, e.status || 400, { error: e.message }); }
    }
    try {
      finish = await store.begin(req.method, pathname); tm.mark('db');
      if (req.method !== 'GET' && req.method !== 'HEAD') flushViews(); // đang giữ khoá sẵn → ghi kèm lượt xem đang gom
    } catch (e) {
      console.error(e);
      // gợi ý nguyên nhân (không lộ chuỗi kết nối) để chủ web tự sửa cấu hình
      const m = String(e && e.message || '');
      const why = /password authentication/i.test(m) ? 'sai mật khẩu trong POSTGRES_URL'
        : /tenant|user .* not found/i.test(m) ? 'sai tên người dùng/mã dự án trong POSTGRES_URL (phải là postgres.<mã dự án mới>)'
        : /ENOTFOUND|EAI_AGAIN|ENETUNREACH|getaddrinfo/i.test(m) ? 'sai địa chỉ máy chủ trong POSTGRES_URL (dùng Transaction pooler)'
        : /timeout|ETIMEDOUT|ECONNREFUSED/i.test(m) ? 'máy chủ cơ sở dữ liệu không trả lời (sai cổng hoặc dự án đang tạm dừng)'
        : /invalid url|URI|URL/i.test(m) ? 'chuỗi POSTGRES_URL không hợp lệ (mật khẩu có ký tự đặc biệt?)'
        : 'lỗi khác, xem Logs trên Vercel';
      return json(res, 503, { error: 'Không kết nối được cơ sở dữ liệu, vui lòng thử lại', why });
    }
    // Trả lời chỉ gửi đi sau khi ghi dữ liệu xong. Ghi thất bại → trả 503 thay cho câu trả lời "thành công" đã soạn
    // (webhook thanh toán báo thành công mà chưa lưu là mất giao dịch). Muốn vậy dòng đầu (mã trạng thái + header)
    // phải giữ lại tới lúc đó; route nào ghi dần nội dung (res.write) thì gửi dòng đầu ngay như cũ.
    const end = res.end.bind(res);
    const writeHead = res.writeHead.bind(res);
    const write = res.write.bind(res);
    let head = null;
    let ending = false;
    const flushHead = () => { if (head) { const h = head; head = null; writeHead(...h); } };
    res.writeHead = (...a) => { head = a; return res; };
    res.write = (...a) => { flushHead(); return write(...a); };
    res.end = (...a) => {
      if (ending) return res;
      ending = true;
      finish().then(() => { flushHead(); end(...a); }, (e) => {
        console.error('Lỗi ghi dữ liệu:', e);
        if (res.headersSent) return end(...a); // đã gửi dở nội dung → không đổi được nữa
        writeHead(503, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        end(JSON.stringify({ error: 'Chưa lưu được, bạn thử lại sau ít giây nhé' }));
      });
      return res;
    };
  }
  try {
    if (matched) {
      const user = matched.noDb ? null : auth.currentUser(req);
      const ctx = {
        query: url.searchParams,
        user,
        admin: adminAuth.byEmail() ? adminAuth.isAdminUser(user, user && auth.viaGoogle(req)) : adminAuth.check(req),
        guest: guestId(req),
        ip: (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress,
        params,
        tm,
      };
      return await matched.handler(req, res, ctx);
    }
    if (pathname.startsWith('/api/')) { console.warn('API 404:', req.method, req.url); throw httpError(404, 'Không có API này'); }
    if (req.method !== 'GET' && req.method !== 'HEAD') throw httpError(405, 'Không hỗ trợ');
    serveStatic(req, res, pathname);
  } catch (e) {
    const status = e.status || 500;
    if (status === 500) console.error(e);
    if (res.headersSent) return res.end();
    json(res, status, { error: status === 500 ? 'Lỗi máy chủ, vui lòng thử lại' : e.message, ...(e.choose ? { choose: true } : {}) });
  }
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`${config.brand} đang chạy tại ${BASE_URL} (cổng ${PORT})`));
}
// Xuất dạng hàm (req, res) để chạy được cả trên Vercel; vẫn có listen/close cho chạy thường và kiểm thử.
// Trên Vercel, mọi đường dẫn được rewrite vào một hàm; đường dẫn gốc được gửi kèm ở ?__p=
// (xem vercel.json), Vercel còn tự thêm ?path=. Khôi phục lại req.url để bộ định tuyến khớp đúng.
function restoreUrl(req) {
  if (!req.url || !req.url.includes('__p=')) return;
  const u = new URL(req.url, 'http://x');
  let p = u.searchParams.get('__p') || '/';
  if (!p.startsWith('/')) p = '/' + p;
  u.searchParams.delete('__p');
  u.searchParams.delete('path');
  const q = u.searchParams.toString();
  req.url = p + (q ? '?' + q : '');
}
const handler = (req, res) => server.emit('request', req, res);
handler.server = server;
handler.listen = (...a) => server.listen(...a);
handler.close = (...a) => server.close(...a);
handler.address = () => server.address();
module.exports = handler;
