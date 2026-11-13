// Combo "Trọn bộ ngày cưới": mua thẳng, nâng cấp từ thiệp lẻ (trả phần chênh), các trường hợp bị chặn
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
const pay = (o, id, content = `MBVCB.88.${o.code}.CT`) => call('sepay', 'POST', '/api/pay/sepay', { id, transferType: 'in', transferAmount: o.amount, content }, { authorization: 'Apikey k' });
async function newCard(slug) {
  let r = await call('u', 'POST', '/api/cards', { template: 'dodam' });
  const c = r.json.card;
  await call('u', 'PUT', `/api/cards/${c.id}`, { data: { ...c.data, groom: { ...c.data.groom, name: 'An' }, bride: { ...c.data.bride, name: 'Bình' }, date: '2026-12-20' }, slug });
  await call('u', 'POST', `/api/cards/${c.id}/publish`, {});
  return c.id;
}

(async () => {
  await new Promise((ok) => server.listen(0, ok));
  base = `http://127.0.0.1:${server.address().port}`;
  await call('u', 'POST', '/api/auth/register', { email: 'combo@test.vn', password: '123456', name: 'Combo' });
  const promo = Date.now() <= Date.parse(`${config.promoEndsAt}T23:59:59+07:00`);

  let r = await call('x', 'GET', '/api/meta');
  assert.equal(r.json.comboPrice, promo ? config.comboPrice : config.comboListPrice);
  if (promo) assert.equal(r.json.comboListPrice, config.comboListPrice, 'còn hạn: giá gốc Trọn bộ gạch ngang');

  // 1. mua thẳng Trọn bộ
  const a = await newCard('combo-a');
  assert.equal((await call('u', 'POST', `/api/cards/${a}/order`, { product: 'combo', coupon: 'CHAOMUNG' })).status, 400, 'không áp mã cho Trọn bộ');
  r = await call('u', 'POST', `/api/cards/${a}/order`, { product: 'combo' });
  let o = r.json.order;
  assert.match(o.code, /^CB/);
  assert.equal(o.amount, r.json.order.amount);
  assert.equal(o.amount, promo ? config.comboPrice : config.comboListPrice);
  if (promo) assert.equal(o.wasPrice, config.comboListPrice);
  assert.equal(o.upgrade, false);
  assert.equal((await pay(o, 1)).json.result, 'paid', 'mã CB… vẫn nhận ra dù nội dung có "MBVCB"');
  r = await call('u', 'GET', `/api/cards/${a}`);
  assert.ok(r.json.card.paid && r.json.card.led.paid && r.json.card.video.paid, 'Trọn bộ kích hoạt cả thiệp, LED, video');
  assert.ok(r.json.card.led.created && r.json.card.video.created, 'LED và video được tạo sẵn');
  assert.ok(!(await call('x', 'GET', '/t/combo-a')).text.includes('Bản dùng thử'));
  assert.ok(!(await call('x', 'GET', '/led/combo-a')).text.includes('Bản dùng thử'), 'màn LED không còn dòng dùng thử');
  assert.equal((await call('u', 'POST', `/api/cards/${a}/order`, { product: 'combo' })).status, 400, 'đã có Trọn bộ thì không mua nữa');

  // 2. mua thiệp lẻ rồi nâng lên Trọn bộ: chỉ trả phần chênh
  const b = await newCard('combo-b');
  r = await call('u', 'POST', `/api/cards/${b}/order`, { product: 'card' });
  await pay(r.json.order, 2);
  r = await call('u', 'POST', `/api/cards/${b}/order`, { product: 'combo' });
  o = r.json.order;
  const cardNow = (await call('x', 'GET', '/api/meta')).json.price;
  assert.equal(o.upgrade, true);
  assert.equal(o.amount, (promo ? config.comboPrice : config.comboListPrice) - cardNow, 'nâng cấp = giá Trọn bộ − giá thiệp');
  assert.equal(o.wasPrice, config.ledPrice + config.videoPrice, 'gạch giá mua lẻ LED + video');
  await pay({ ...o, amount: o.amount - 1000 }, 3);
  assert.ok(!(await call('u', 'GET', `/api/cards/${b}`)).json.card.led.paid, 'thiếu tiền thì chưa nâng cấp');
  assert.equal((await pay(o, 4)).json.result, 'paid');
  r = await call('u', 'GET', `/api/cards/${b}`);
  assert.ok(r.json.card.led.paid && r.json.card.video.paid);

  // 3. đã mua LED lẻ → không bán Trọn bộ nữa
  const c = await newCard('combo-c');
  await call('u', 'PUT', `/api/cards/${c}`, { led: {} });
  r = await call('u', 'POST', `/api/cards/${c}/order`, { product: 'led' });
  await pay(r.json.order, 5);
  r = await call('u', 'POST', `/api/cards/${c}/order`, { product: 'combo' });
  assert.equal(r.status, 400, 'LED đã kích hoạt riêng thì không bán Trọn bộ');

  console.log('✓ Trọn bộ: mua thẳng, nâng cấp trả phần chênh, chặn trường hợp không hợp lệ');
  process.exit(0);
})().catch((e) => { console.error('✗', e); process.exit(1); });
