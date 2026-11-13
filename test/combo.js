// Combo "Trọn bộ ngày cưới" = kích hoạt thiệp + 1 lượt màn LED + 1 lượt video trên tài khoản.
// Khách nháp nhiều LED / video, ưng cái nào thì dùng lượt cho cái đó; chỉ có đúng một bản nháp thì tự dùng lượt.
const assert = require('assert');
const fs = require('fs'), os = require('os'), path = require('path');
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'thiep-combo-'));
process.env.BASE_URL = 'http://localhost';
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
async function newCard(slug) {
  const r = await call('u', 'POST', '/api/cards', { template: 'dodam' });
  const c = r.json.card;
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
  const comboNow = promo ? config.comboPrice : config.comboListPrice;

  let r = await call('x', 'GET', '/api/meta');
  assert.equal(r.json.comboPrice, comboNow);

  // 1. mua Trọn bộ khi chưa làm LED / video → thiệp kích hoạt, cộng 1 lượt mỗi loại
  const a = await newCard('combo-a');
  assert.equal((await call('u', 'POST', `/api/cards/${a}/order`, { product: 'combo', coupon: 'GIAMRIENG' })).status, 400, 'không áp mã cho Trọn bộ');
  r = await call('u', 'POST', `/api/cards/${a}/order`, { product: 'combo' });
  assert.match(r.json.order.code, /^CB/);
  assert.equal(r.json.order.amount, comboNow);
  if (promo) assert.equal(r.json.order.wasPrice, config.comboListPrice);
  assert.equal((await pay(r.json.order)).json.result, 'paid', 'mã CB… vẫn nhận ra dù nội dung có "MBVCB"');
  let c = await card(a);
  assert.ok(c.paid && c.combo, 'thiệp kích hoạt, gắn Trọn bộ');
  assert.deepEqual(c.credits, { led: 1, video: 1 }, 'cộng 1 lượt LED + 1 lượt video');
  assert.ok(!c.led.created && !c.video.created, 'chưa tự tạo LED / video');
  assert.equal((await call('u', 'POST', `/api/cards/${a}/order`, { product: 'combo' })).status, 400, 'thiệp đã có Trọn bộ');

  // dùng lượt: phải tạo trước, dùng xong hết lượt
  assert.equal((await call('u', 'POST', `/api/cards/${a}/redeem`, { product: 'led' })).status, 400, 'chưa tạo LED thì chưa dùng lượt được');
  await call('u', 'PUT', `/api/cards/${a}`, { led: {} });
  assert.equal((await call('v', 'POST', `/api/cards/${a}/redeem`, { product: 'led' })).status, 404, 'người khác không dùng lượt được');
  r = await call('u', 'POST', `/api/cards/${a}/redeem`, { product: 'led' });
  assert.equal(r.status, 200);
  assert.ok(r.json.card.led.paid);
  assert.deepEqual(r.json.card.credits, { led: 0, video: 1 });
  assert.ok(!(await call('x', 'GET', '/led/combo-a')).text.includes('Bản dùng thử'), 'màn LED dùng lượt thì hết dòng dùng thử');

  // 2. nhiều bản nháp LED ở các thiệp khác nhau → không tự dùng, khách chọn
  const b = await newCard('combo-b'), d = await newCard('combo-d');
  await call('u', 'PUT', `/api/cards/${b}`, { led: {} });
  await call('u', 'PUT', `/api/cards/${d}`, { led: {} });
  await buyCombo(b);
  assert.deepEqual((await card(b)).credits, { led: 1, video: 2 }, 'hai bản nháp LED → giữ lượt, lượt video cộng dồn');
  assert.ok(!(await card(b)).led.paid && !(await card(d)).led.paid);
  r = await call('u', 'POST', `/api/cards/${d}/redeem`, { product: 'led' });
  assert.ok(r.json.card.led.paid, 'dùng lượt cho đúng bản khách chọn (thiệp d)');
  assert.ok(!(await card(b)).led.paid, 'bản còn lại vẫn là dùng thử');
  assert.equal((await call('u', 'POST', `/api/cards/${b}/redeem`, { product: 'led' })).status, 400, 'hết lượt LED');

  // 3. đúng một bản nháp video → mua Trọn bộ / nâng cấp thì tự dùng lượt luôn
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
  assert.ok(c.combo && c.video.paid, 'chỉ một bản nháp video → tự dùng lượt');
  assert.deepEqual(c.credits, { led: 0, video: 2 }, 'video: 2 lượt cũ còn nguyên (lượt mới đã dùng)');
  assert.ok((await card(b)).led.paid, 'LED: thiệp b là bản nháp LED duy nhất còn lại → lượt LED mới tự dùng cho nó');

  // 4. mua lẻ vẫn được
  const f = await newCard('combo-f');
  await call('u', 'PUT', `/api/cards/${f}`, { led: {} });
  r = await call('u', 'POST', `/api/cards/${f}/order`, { product: 'led' });
  assert.equal(r.json.order.amount, config.ledPrice);

  console.log('✓ Trọn bộ: cộng lượt LED + video, khách chọn bản để dùng lượt, tự dùng khi chỉ có một bản, nâng cấp trả phần chênh');
  process.exit(0);
})().catch((e) => { console.error('✗', e); process.exit(1); });
