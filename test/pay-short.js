// Chuyển khoản thiếu: đơn báo cho khách số đã nhận + còn thiếu, mã QR theo phần còn thiếu; chuyển nốt thì kích hoạt.
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'thiep-short-'));
process.env.BASE_URL = 'http://localhost';
process.env.ALLOW_EMAIL_SIGNUP = '1';
process.env.SEPAY_API_KEY = 'khoa-thu';
require('../config.json').firstOrderPercent = 0; // ưu đãi khách mới kiểm thử riêng ở cuối combo.js
const server = require('../server');
const config = require('../config.json');

let base, jar = '';
async function call(method, url, body, headers = {}) {
  if (jar) headers.cookie = jar;
  if (body !== undefined) headers['content-type'] = 'application/json';
  const r = await fetch(base + url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const sc = r.headers.get('set-cookie'); if (sc) jar = sc.split(';')[0];
  return { status: r.status, json: await r.json().catch(() => null) };
}
const bank = (id, amount, content) => call('POST', '/api/pay/sepay', { id, transferType: 'in', transferAmount: amount, content }, { authorization: 'Apikey khoa-thu' });

(async () => {
  await new Promise((done) => server.listen(0, done));
  base = `http://127.0.0.1:${server.address().port}`;
  await call('POST', '/api/auth/register', { email: 'thieu@test.vn', password: '123456' });
  let card = (await call('POST', '/api/cards', { template: 'dodam' })).json.card;
  await call('PUT', `/api/cards/${card.id}`, { led: {} });
  // kích hoạt là chốt (thiệp: tên + ngày cưới; màn LED / video: chốt hẳn) → chưa đủ tên + ngày thì chưa cho trả tiền
  assert.equal((await call('POST', `/api/cards/${card.id}/order`, { product: 'led' })).status, 400, 'chưa có tên + ngày: chưa tạo đơn');
  assert.equal((await call('POST', `/api/cards/${card.id}/order`, { product: 'card' })).status, 400);
  await call('PUT', '/api/wedding', { couple: { groom: { name: 'An' }, bride: { name: 'Bình' } }, date: '2027-01-01' }); // sổ tay điền tên + ngày → thiệp theo
  let o = (await call('POST', `/api/cards/${card.id}/order`, { product: 'led' })).json.order;
  const price = config.ledPrice;
  assert.equal(o.amount, price);
  assert.equal(o.received, undefined, 'chưa chuyển: không có số đã nhận');
  assert.match(o.qr, new RegExp(`amount=${price}&`));

  assert.equal((await bank('b1', 20000, `MBVCB.1 ${o.code} ck`)).json.result, 'underpaid');
  o = (await call('GET', `/api/orders/${o.code}`)).json.order;
  assert.equal(o.status, 'pending');
  assert.equal(o.received, 20000, 'báo số đã nhận');
  assert.equal(o.due, price - 20000, 'báo số còn thiếu');
  assert.match(o.qr, new RegExp(`amount=${price - 20000}&`), 'mã QR theo phần còn thiếu');
  o = (await call('POST', `/api/cards/${card.id}/order`, { product: 'led' })).json.order;
  assert.equal(o.due, price - 20000, 'mở lại cửa sổ thanh toán vẫn thấy phần còn thiếu');

  assert.equal((await bank('b2', 5000, o.code)).json.result, 'underpaid');
  o = (await call('GET', `/api/orders/${o.code}`)).json.order;
  assert.equal(o.received, 25000, 'cộng dồn các lần chuyển thiếu');

  assert.equal((await bank('b3', price - 25000, o.code)).json.result, 'paid');
  o = (await call('GET', `/api/orders/${o.code}`)).json.order;
  assert.equal(o.status, 'paid');
  assert.equal(o.received, undefined, 'đã trả đủ: không còn báo thiếu');
  assert.ok((await call('GET', `/api/cards/${card.id}`)).json.card.led.paid, 'màn LED đã kích hoạt');

  console.log('pay-short: OK');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
