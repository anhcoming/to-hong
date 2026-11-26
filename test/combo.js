// Combo "Trọn bộ ngày cưới" gắn với MỘT thiệp: kích hoạt thiệp + màn LED + video của chính thiệp đó (có sẵn thì mở ngay,
// tạo sau thì tự mở lúc tạo). Thiệp khác không liên quan. Lượt Trọn bộ kiểu cũ (user.credits) vẫn dùng được qua /redeem.
const assert = require('assert');
const fs = require('fs'), os = require('os'), path = require('path');
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'thiep-combo-'));
process.env.BASE_URL = 'http://localhost';
process.env.ALLOW_EMAIL_SIGNUP = '1'; // bài kiểm thử tạo tài khoản bằng email (ngoài thực tế đã đóng khi có Google / Facebook)
process.env.SEPAY_API_KEY = 'k';
const server = require('../server');
const config = require('../config.json');

let base; const jar = {};
async function call(who, method, url, body, headers = {}) {
  if (jar[who]) headers.cookie = jar[who];
  if (body !== undefined) headers['content-type'] = 'application/json';
  const r = await fetch(base + url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const sc = r.headers.get('set-cookie'); if (sc) jar[who] = sc.split(';')[0];
  const text = await r.text(); let json; try { json = JSON.parse(text); } catch { json = null; }
  return { status: r.status, json, text };
}
let txn = 0;
const pay = (o, content = `MBVCB.88.${o.code}.CT`) => call('sepay', 'POST', '/api/pay/sepay', { id: ++txn, transferType: 'in', transferAmount: o.amount, content }, { authorization: 'Apikey k' });
const card = async (id) => (await call('u', 'GET', `/api/cards/${id}`)).json.card;
// mỗi tài khoản chỉ một thiệp (POST /api/cards trả lại thiệp sẵn có) → thiệp thứ hai trở đi chèn thẳng vào kho, như dữ liệu cũ trước khi khoá
const extraCard = (srcId, slug) => {
  const D = require('../lib/db').db, src = D.cards.find((c) => c.id === srcId);
  const n = { ...JSON.parse(JSON.stringify(src)), id: 'x' + Math.random().toString(36).slice(2, 13), slug, status: 'draft', paid: false, views: 0, createdAt: Date.now(), updatedAt: Date.now() - 1e9 };
  for (const k of ['combo', 'paidAt', 'publishedAt', 'led', 'video', 'trialFrom']) delete n[k];
  D.cards.push(n);
  return n.id;
};
let firstCard = null;
async function newCard(slug) {
  let c = (await call('u', 'POST', '/api/cards', { template: 'dodam' })).json.card;
  if (firstCard) c = (await call('u', 'GET', `/api/cards/${extraCard(firstCard, slug)}`)).json.card;
  else firstCard = c.id;
  await call('u', 'PUT', `/api/cards/${c.id}`, { data: { ...c.data, groom: { ...c.data.groom, name: 'An' }, bride: { ...c.data.bride, name: 'Bình' }, date: '2026-12-20' }, slug });
  await call('u', 'POST', `/api/cards/${c.id}/publish`, {});
  return c.id;
}
const buyCombo = async (id) => { const o = (await call('u', 'POST', `/api/cards/${id}/order`, { product: 'combo' })).json.order; assert.equal((await pay(o)).json.result, 'paid'); return o; };

(async () => {
  await new Promise((ok) => server.listen(0, ok));
  base = `http://127.0.0.1:${server.address().port}`;
  await call('u', 'POST', '/api/auth/register', { email: 'combo@test.vn', password: '123456', name: 'Combo' });
  await call('v', 'POST', '/api/auth/register', { email: 'khac@test.vn', password: '123456', name: 'Khác' });
  const promo = Date.now() <= Date.parse(`${config.promoEndsAt}T23:59:59+07:00`);
  const comboNow = !promo && config.comboListPrice > config.comboPrice ? config.comboListPrice : config.comboPrice; // không có giá gốc thì giá không đổi sau hạn

  let r = await call('x', 'GET', '/api/meta');
  assert.equal(r.json.comboPrice, comboNow);

  // 1. mua Trọn bộ khi chưa làm LED / video → thiệp kích hoạt; LED / video của thiệp này tạo lúc nào cũng tự kích hoạt
  const a = await newCard('combo-a');
  assert.equal((await call('u', 'POST', `/api/cards/${a}/order`, { product: 'combo', coupon: 'GIAMRIENG' })).status, 400, 'không áp mã cho Trọn bộ');
  r = await call('u', 'POST', `/api/cards/${a}/order`, { product: 'combo' });
  assert.match(r.json.order.code, /^CB/);
  assert.equal(r.json.order.amount, comboNow);
  // giá gạch: giá gốc Trọn bộ khi đang có giá mở bán; không có thì tổng tiền mua lẻ thiệp + LED + video
  const comboPromoOn = promo && config.comboListPrice > config.comboPrice;
  assert.equal(r.json.order.wasPrice, comboPromoOn ? config.comboListPrice : (promo || !(config.listPrice > config.price) ? config.price : config.listPrice) + config.ledPrice + config.videoPrice);
  assert.equal((await pay(r.json.order)).json.result, 'paid', 'mã CB… vẫn nhận ra dù nội dung có "MBVCB"');
  let c = await card(a);
  assert.ok(c.paid && c.combo, 'thiệp kích hoạt, gắn Trọn bộ');
  assert.deepEqual(c.credits, { led: 0, video: 0 }, 'không còn cộng lượt');
  assert.ok(!c.led.created && !c.video.created, 'chưa tự tạo LED / video');
  assert.equal((await call('u', 'POST', `/api/cards/${a}/order`, { product: 'combo' })).status, 400, 'thiệp đã có Trọn bộ');
  r = await call('u', 'PUT', `/api/cards/${a}`, { led: {} });
  assert.ok(r.json.card.led.paid, 'tạo màn LED trên thiệp Trọn bộ → kích hoạt luôn');
  assert.ok(!(await call('x', 'GET', '/led/combo-a')).text.includes('Bản dùng thử'), 'màn LED Trọn bộ không có dòng dùng thử');
  r = await call('u', 'PUT', `/api/cards/${a}`, { video: {} });
  assert.ok(r.json.card.video.paid, 'tạo video trên thiệp Trọn bộ → kích hoạt luôn');
  // video kích hoạt: tên đôi cố định lúc kích hoạt; sửa tên trên thiệp không đổi video; không bỏ được dòng tên
  {
    // Trọn bộ mở sẵn video vừa tạo: chưa chốt (khách còn làm tiếp); chiếu thật / xuất MP4 lần đầu thì chốt hẳn
    assert.ok(!r.json.card.video.final, 'video mở bằng Trọn bộ chưa chốt ngay lúc tạo');
    const c = r.json.card;
    const v2 = JSON.parse(JSON.stringify(c.videoConfig)); v2.event.place = 'Nhà hàng Hoa Sen';
    assert.equal((await call('u', 'PUT', `/api/cards/${a}`, { video: v2 })).status, 200, 'chưa chốt: video còn sửa được');
    const vr = await call('x', 'GET', '/video/combo-a');
    assert.ok(vr.text.includes('"chu_re":"An"') && vr.text.includes('"co_dau":"Bình"'), 'chiếu theo tên trên thiệp');
    const cv = (await call('u', 'GET', `/api/cards/${a}`)).json.card;
    assert.ok(cv.video.final, 'lần đầu chiếu thật: video chốt hẳn');
    assert.equal((await call('u', 'PUT', `/api/cards/${a}`, { video: cv.videoConfig })).status, 409, 'đã chốt: video không sửa được nữa');
    // thiệp đã kích hoạt: tên đôi + ngày cưới chốt, gửi tên khác cũng giữ nguyên; video chiếu theo bản chụp lúc chốt
    r = await call('u', 'PUT', `/api/cards/${a}`, { data: { ...cv.data, groom: { ...cv.data.groom, name: 'Quang' }, bride: { ...cv.data.bride, name: 'Hà' }, date: '2030-01-01' } });
    assert.deepEqual([r.json.card.data.groom.name, r.json.card.data.bride.name, r.json.card.data.date], ['An', 'Bình', cv.data.date], 'thiệp đã kích hoạt giữ nguyên tên đôi + ngày cưới');
    r = await call('u', 'PUT', `/api/cards/${a}`, { data: { ...cv.data, groom: { ...cv.data.groom, father: 'Ông Ba' } } });
    assert.equal(r.json.card.data.groom.father, 'Ông Ba', 'thiệp đã kích hoạt: bố mẹ… vẫn sửa được');
    assert.ok(!(await call('x', 'GET', '/video/combo-a')).text.includes('Ông Ba'), 'video đã chốt không đổi theo thiệp');
  }
  assert.equal((await call('u', 'POST', `/api/cards/${a}/order`, { product: 'led' })).status, 400, 'không mua lẻ lại LED đã có trong Trọn bộ');

  // 2. LED nháp có sẵn: mua Trọn bộ thiệp b → chỉ LED của thiệp b được mở; thiệp d (thiệp khác) không liên quan
  const b = await newCard('combo-b'), d = await newCard('combo-d');
  await call('u', 'PUT', `/api/cards/${b}`, { led: {} });
  await call('u', 'PUT', `/api/cards/${d}`, { led: {} });
  await buyCombo(b);
  assert.ok((await card(b)).led.paid, 'LED có sẵn của thiệp Trọn bộ được mở ngay');
  assert.ok(!(await card(d)).led.paid, 'LED của thiệp khác vẫn là dùng thử');
  assert.ok((await card(d)).paid, 'trả tiền theo đám cưới: thiệp khác cùng đám cưới cũng kích hoạt (màn LED / slide vẫn theo từng thiệp)');

  // 3. đã mua thiệp lẻ, có video nháp → nâng lên Trọn bộ (trả phần chênh) thì video mở luôn, LED làm sau cũng mở
  const e = await newCard('combo-e');
  await call('u', 'PUT', `/api/cards/${e}`, { video: {} });
  r = await call('u', 'POST', `/api/cards/${e}/order`, { product: 'card' });
  await pay(r.json.order);
  r = await call('u', 'POST', `/api/cards/${e}/order`, { product: 'combo' });
  const up = r.json.order;
  assert.equal(up.upgrade, true);
  assert.equal(up.amount, comboNow - (await call('x', 'GET', '/api/meta')).json.price, 'nâng cấp = giá Trọn bộ − giá thiệp');
  assert.equal(up.wasPrice, config.ledPrice + config.videoPrice, 'gạch giá mua lẻ LED + video');
  assert.equal((await pay({ ...up, amount: up.amount - 1000 })).json.result, 'underpaid');
  assert.ok(!(await card(e)).combo, 'thiếu tiền thì chưa nâng cấp');
  assert.equal((await pay(up)).json.result, 'paid');
  c = await card(e);
  assert.ok(c.combo && c.video.paid, 'nâng cấp → video có sẵn mở luôn');
  assert.ok((await call('u', 'PUT', `/api/cards/${e}`, { led: {} })).json.card.led.paid, 'LED làm sau cũng mở');

  // 3b. mỗi tài khoản một thiệp: không nhân bản được
  assert.equal((await call('u', 'POST', `/api/cards/${e}/duplicate`, {})).status, 400, 'không nhân bản thiệp');

  // 3c. lượt Trọn bộ kiểu cũ (trước 18/11/2026) vẫn dùng được
  require('../lib/db').db.users.find((u) => u.email === 'combo@test.vn').credits = { led: 1, video: 0 };
  assert.equal((await call('v', 'POST', `/api/cards/${d}/redeem`, { product: 'led' })).status, 404, 'người khác không dùng lượt được');
  r = await call('u', 'POST', `/api/cards/${d}/redeem`, { product: 'led' });
  assert.ok(r.json.card.led.paid, 'lượt cũ dùng cho LED của thiệp d');
  assert.equal((await call('u', 'POST', `/api/cards/${d}/redeem`, { product: 'led' })).status, 400, 'hết lượt cũ');

  // 4. mua lẻ vẫn được
  const f = await newCard('combo-f');
  await call('u', 'PUT', `/api/cards/${f}`, { led: {} });
  r = await call('u', 'POST', `/api/cards/${f}/order`, { product: 'led' });
  assert.equal(r.json.order.amount, config.ledPrice);
  // LED chưa kích hoạt: không có hạn dùng thử — chỉ xem trước trong khung của trình sửa, link trình chiếu khoá với mọi người
  let lr = await call('u', 'GET', '/led/combo-f');
  assert.ok(lr.status === 403 && lr.text.includes('Kích hoạt màn LED'), 'chưa kích hoạt: chủ thiệp không mở trình chiếu được, có nút kích hoạt');
  assert.equal((await call('x', 'GET', '/led/combo-f')).status, 403, 'chưa kích hoạt: khách không mở được');
  assert.equal((await call('u', 'GET', '/led/combo-f?preview=1', undefined, { 'sec-fetch-dest': 'document' })).status, 403, 'mở thẳng link xem trước ra cả trang: khoá');
  lr = await call('u', 'GET', '/led/combo-f?preview=1', undefined, { 'sec-fetch-dest': 'iframe' });
  assert.ok(lr.status === 200 && lr.text.includes('Bản dùng thử'), 'khung xem trước trong trình sửa vẫn mở, có dòng dùng thử');
  assert.ok(!('trialEndsAt' in (await card(f)).led), 'màn LED không có hạn dùng thử');
  await pay(r.json.order);
  lr = await call('x', 'GET', '/led/combo-f');
  assert.ok(lr.status === 200 && !lr.text.includes('Bản dùng thử'), 'kích hoạt xong: chiếu được, hết dòng dùng thử');
  // kích hoạt xong: màn LED chốt hẳn (không sửa gì nữa), chiếu theo bản chụp lúc chốt; thiệp chưa kích hoạt vẫn sửa tên được
  {
    const c = await card(f);
    assert.ok(c.led.final, 'kích hoạt xong: màn LED chốt hẳn');
    assert.deepEqual(c.led.names, { groom: 'An', bride: 'Bình' }, 'chốt tên lúc kích hoạt');
    assert.equal((await call('u', 'PUT', `/api/cards/${f}`, { led: { message: 'Cảm ơn cả nhà' } })).status, 409, 'đã chốt: không sửa màn LED được nữa');
    assert.equal((await call('u', 'PUT', `/api/cards/${f}`, { data: { ...c.data, groom: { ...c.data.groom, name: 'Quang' }, bride: { ...c.data.bride, name: 'Hà' } } })).status, 200, 'thiệp chưa kích hoạt vẫn sửa tên được');
    lr = await call('x', 'GET', '/led/combo-f');
    assert.ok(lr.text.includes('"name":"An"') && lr.text.includes('"name":"Bình"') && !lr.text.includes('Quang') && !lr.text.includes('Cảm ơn cả nhà'), 'màn LED chiếu theo bản chụp lúc chốt');
  }
  // đã qua ngày cưới: tên gọi cô dâu chú rể + ngày cưới trên thiệp cố định, các chữ khác vẫn sửa được
  {
    const raw = require('../lib/db').db.cards.find((c) => c.id === f);
    raw.data.date = new Date(Date.now() + 7 * 3600e3 - 864e5).toISOString().slice(0, 10); // hôm qua (giờ VN)
    const c = await card(f);
    assert.ok(c.namesFrozen, 'trình sửa biết đã qua ngày cưới');
    const was = { g: c.data.groom.name, b: c.data.bride.name, d: c.data.date };
    const r2 = await call('u', 'PUT', `/api/cards/${f}`, { data: { ...c.data, date: '2027-05-05', groom: { ...c.data.groom, name: 'Người Khác', father: 'Ông Mới' }, bride: { ...c.data.bride, name: 'Cô Khác' } } });
    assert.equal(r2.status, 200);
    const d2 = r2.json.card.data;
    assert.deepEqual([d2.groom.name, d2.bride.name, d2.date], [was.g, was.b, was.d], 'tên đôi + ngày cưới giữ nguyên');
    assert.equal(d2.groom.father, 'Ông Mới', 'chữ khác vẫn sửa được');
    const Wd = require('../lib/wedding'), w = Wd.get(raw.weddingId);
    if (w) { Wd.update(w, { couple: { groom: { name: 'Sổ Tay Đổi' } }, date: '2027-06-06' }); assert.deepEqual([raw.data.groom.name, raw.data.date], [was.g, was.d], 'sổ tay không đổi được tên / ngày thiệp đã qua lễ'); }
  }

  // đã tạo đơn thiệp lẻ (chưa trả) rồi trả đơn Trọn bộ → đơn thiệp lẻ tự đóng, không còn nằm ở "Cần xử lý"
  const { db } = require('../lib/db');
  const z = await newCard('combo-z');
  const lone = (await call('u', 'POST', `/api/cards/${z}/order`, {})).json.order;
  assert.match(lone.code, /^TH/);
  const cb = await buyCombo(z);
  const loneDb = db.orders.find((o) => o.code === lone.code);
  assert.equal(loneDb.status, 'cancelled', 'đơn thiệp lẻ đang chờ tự đóng khi Trọn bộ đã trả');
  assert.match(loneDb.note, new RegExp(cb.code));
  assert.equal(db.orders.find((o) => o.code === cb.code).status, 'paid');
  // nâng cấp gói: phần nào đã trả (thiệp / LED / video) thì trừ đúng giá lẻ phần đó; chuyển khoản tự nâng cấp
  {
    const g = await newCard('combo-g');
    await call('u', 'PUT', `/api/cards/${g}`, { led: {} });
    assert.equal((await pay((await call('u', 'POST', `/api/cards/${g}/order`, { product: 'led' })).json.order)).json.result, 'paid', 'mua lẻ màn LED');
    let o = (await call('u', 'POST', `/api/cards/${g}/order`, { product: 'combo' })).json.order;
    assert.equal(o.amount, comboNow - config.ledPrice, 'đã có LED: Trọn bộ trừ giá LED');
    assert.ok(o.upgrade && o.have.join() === 'led', 'đơn nâng cấp biết đã có LED');
    assert.equal(o.wasPrice, config.price + config.videoPrice, 'gạch giá mua lẻ phần còn thiếu (thiệp + video)');
    assert.equal((await card(g)).comboUpgrade.amount, o.amount, 'trang Thiệp của tôi gợi ý đúng giá nâng cấp');
    assert.equal((await pay(o)).json.result, 'paid', 'chuyển đúng số tiền nâng cấp → tự kích hoạt');
    let c = await card(g);
    assert.ok(c.paid && c.led.paid && c.comboUpgrade === null, 'thiệp mở, LED vẫn mở, hết gợi ý nâng cấp');
    assert.ok((await call('u', 'PUT', `/api/cards/${g}`, { video: {} })).json.card.video.paid, 'video làm sau tự mở');

    // đơn Trọn bộ tạo lúc chưa có gì (giá đủ), sau đó mua lẻ video → chuyển khoản theo giá mới vẫn nhận và tự nâng cấp
    const h = await newCard('combo-h');
    o = (await call('u', 'POST', `/api/cards/${h}/order`, { product: 'combo' })).json.order;
    assert.equal(o.amount, comboNow);
    await call('u', 'PUT', `/api/cards/${h}`, { video: {} });
    await pay((await call('u', 'POST', `/api/cards/${h}/order`, { product: 'video' })).json.order);
    assert.equal((await pay({ ...o, amount: comboNow - config.videoPrice })).json.result, 'paid', 'đơn cũ nhận giá đã trừ video');
    c = await card(h);
    assert.ok(c.paid && c.video.paid, 'Trọn bộ đã kích hoạt');

    // đủ cả ba rồi thì không bán Trọn bộ nữa
    const k = await newCard('combo-k');
    await call('u', 'PUT', `/api/cards/${k}`, { led: {}, video: {} });
    for (const p of ['card', 'led', 'video']) await pay((await call('u', 'POST', `/api/cards/${k}/order`, { product: p })).json.order);
    assert.equal((await call('u', 'POST', `/api/cards/${k}/order`, { product: 'combo' })).status, 400, 'đủ cả ba: không mua Trọn bộ');
  }
  // 5. màn thanh toán chung (b.items): tài khoản mới, chưa có gì
  await call('m', 'POST', '/api/auth/register', { email: 'multi@test.vn', password: '123456', name: 'Multi' });
  let mc = (await call('m', 'POST', '/api/cards', { template: 'dodam' })).json.card;
  await call('m', 'PUT', `/api/cards/${mc.id}`, { data: { ...mc.data, groom: { ...mc.data.groom, name: 'Hùng' }, bride: { ...mc.data.bride, name: 'Dương' }, date: '2026-12-28' } });
  const price = (await call('x', 'GET', '/api/meta')).json.price;
  r = await call('m', 'POST', `/api/cards/${mc.id}/order`, { items: ['card', 'led', 'video'] });
  assert.deepEqual([r.json.order.product, r.json.order.amount], ['combo', comboNow], 'tick đủ 3 món = Trọn bộ');
  r = await call('m', 'POST', `/api/cards/${mc.id}/order`, { items: ['led'] });
  assert.deepEqual([r.json.order.product, r.json.order.amount], ['led', config.ledPrice], 'một món = mua lẻ, LED chưa tạo vẫn mua được');
  r = await call('m', 'POST', `/api/cards/${mc.id}/order`, { items: ['card', 'led'] });
  const mo = r.json.order;
  assert.deepEqual([mo.product, mo.amount, mo.items, /^DC/.test(mo.code)], ['multi', price + config.ledPrice, ['card', 'led'], true], 'thiệp + LED = một đơn, một mã');
  assert.equal((await call('m', 'POST', `/api/cards/${mc.id}/order`, { items: ['led', 'card'] })).json.order.code, mo.code, 'cùng món → cùng đơn');
  assert.equal((await pay(mo)).json.result, 'paid');
  mc = (await call('m', 'GET', `/api/cards/${mc.id}`)).json.card;
  assert.ok(mc.paid && !mc.combo && !mc.led.created, 'thiệp kích hoạt; LED chưa tạo');
  r = await call('m', 'PUT', `/api/cards/${mc.id}`, { led: {} });
  assert.ok(r.json.card.led.paid, 'LED đã trả trước: tạo ra là kích hoạt');
  assert.equal((await call('m', 'POST', `/api/cards/${mc.id}/order`, { items: ['card', 'led'] })).status, 400, 'đã có cả hai');
  r = await call('m', 'POST', `/api/cards/${mc.id}/order`, { items: ['card', 'led', 'video'] });
  assert.deepEqual([r.json.order.product, r.json.order.amount], ['combo', Math.max(0, comboNow - price - config.ledPrice)], 'còn thiếu slide: nâng lên Trọn bộ trả phần chênh');
  r = await call('m', 'POST', `/api/cards/${mc.id}/order`, { items: ['video'] });
  assert.deepEqual([r.json.order.product, r.json.order.amount], ['combo', Math.max(0, comboNow - price - config.ledPrice)], 'chỉ tick slide mà thành đủ bộ → tự thành Trọn bộ (rẻ hơn mua lẻ)');

  console.log('✓ Trọn bộ gắn với thiệp: mở thiệp + LED + video của thiệp đó (có sẵn hay làm sau), thiệp khác không liên quan, nâng cấp trả phần chênh, lượt cũ vẫn dùng được');
  process.exit(0);
})().catch((e) => { console.error('✗', e); process.exit(1); });
