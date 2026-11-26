// Đơn hàng kiểu Shopee (không combo): tick món nào trả giá lẻ món đó, nhiều món = một đơn gộp; màn LED / slide mua trước
// khi tạo thì tạo ra là kích hoạt; ưu đãi khách mới: đơn đầu tiên tự giảm config.firstOrderPercent %.
const assert = require('assert');
const fs = require('fs'), os = require('os'), path = require('path');
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'thiep-order-'));
process.env.BASE_URL = 'http://localhost';
process.env.ALLOW_EMAIL_SIGNUP = '1'; // bài kiểm thử tạo tài khoản bằng email (ngoài thực tế đã đóng khi có Google / Facebook)
process.env.SEPAY_API_KEY = 'k';
require('../config.json').firstOrderPercent = 0; // ưu đãi khách mới kiểm thử riêng ở phần 2
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

(async () => {
  await new Promise((ok) => server.listen(0, ok));
  base = `http://127.0.0.1:${server.address().port}`;
  let r;
  assert.equal((await call('x', 'GET', '/api/meta')).json.comboPrice, undefined, 'không còn giá Trọn bộ');

  // 1. màn thanh toán chung (b.items): tài khoản mới, chưa có gì
  await call('m', 'POST', '/api/auth/register', { email: 'multi@test.vn', password: '123456', name: 'Multi' });
  let mc = (await call('m', 'POST', '/api/cards', { template: 'dodam' })).json.card;
  await call('m', 'PUT', `/api/cards/${mc.id}`, { data: { ...mc.data, groom: { ...mc.data.groom, name: 'Hùng' }, bride: { ...mc.data.bride, name: 'Dương' }, date: '2026-12-28' } });
  const price = (await call('x', 'GET', '/api/meta')).json.price;
  r = await call('m', 'POST', `/api/cards/${mc.id}/order`, { items: ['card', 'led', 'video'] });
  assert.deepEqual([r.json.order.product, r.json.order.amount], ['multi', price + config.ledPrice + config.videoPrice], 'tick đủ 3 món = cộng giá lẻ (không còn giảm giá combo)');
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
  assert.deepEqual([r.json.order.product, r.json.order.amount], ['video', config.videoPrice], 'còn thiếu slide: mua lẻ slide');
  r = await call('m', 'POST', `/api/cards/${mc.id}/order`, { items: ['video'] });
  assert.deepEqual([r.json.order.product, r.json.order.amount], ['video', config.videoPrice], 'chỉ tick slide → giá slide');

  // 2. không còn giảm giá combo: tick đủ 3 món = cộng giá lẻ (đơn gộp); ưu đãi khách mới: đơn đầu tự giảm 10%, mã giảm giá thay ưu đãi
  config.firstOrderPercent = 10;
  await call('n', 'POST', '/api/auth/register', { email: 'moi@test.vn', password: '123456', name: 'Mới' });
  let nc = (await call('n', 'POST', '/api/cards', { template: 'dodam' })).json.card;
  await call('n', 'PUT', `/api/cards/${nc.id}`, { data: { ...nc.data, groom: { ...nc.data.groom, name: 'Nam' }, bride: { ...nc.data.bride, name: 'Mai' }, date: '2026-12-30' } });
  const p0 = (await call('x', 'GET', '/api/meta')).json.price, all3 = p0 + config.ledPrice + config.videoPrice;
  r = await call('n', 'POST', `/api/cards/${nc.id}/order`, { items: ['card', 'led', 'video'] });
  const r10 = (n) => Math.round(n * 0.1 / 1000) * 1000;
  assert.deepEqual([r.json.order.product, r.json.order.amount, r.json.order.firstOff], ['multi', all3 - r10(all3), r10(all3)], 'đủ 3 món = cộng giá lẻ, đơn đầu giảm 10%');
  r = await call('n', 'POST', `/api/cards/${nc.id}/order`, { items: ['card'] });
  const fo = r.json.order;
  assert.deepEqual([fo.amount, fo.firstOff], [p0 - r10(p0), r10(p0)], 'chỉ thiệp: vẫn giảm 10% đơn đầu');
  assert.equal((await pay(fo)).json.result, 'paid');
  r = await call('n', 'POST', `/api/cards/${nc.id}/order`, { items: ['led'] });
  assert.deepEqual([r.json.order.amount, r.json.order.firstOff], [config.ledPrice, 0], 'đơn thứ hai: không còn ưu đãi khách mới');
  config.firstOrderPercent = 0;

  // đơn "combo" kiểu cũ không mua được nữa (coi như mua thiệp)
  assert.notEqual((await call('m', 'POST', `/api/cards/${mc.id}/order`, { product: 'combo' })).json.order?.product, 'combo');

  console.log('✓ Đơn hàng kiểu Shopee: giá lẻ, đơn gộp, LED / slide trả trước, ưu đãi khách mới');
  server.close();
  process.exit(0);
})().catch((e) => { console.error('✗', e); process.exit(1); });
