// Màn LED cho khách chưa đăng nhập: /tao-led mở trình sửa trên bản nháp (không bắt đăng nhập), sửa + xem trước được;
// lấy link chiếu mới cần tài khoản; đăng nhập xong màn LED đã sửa còn nguyên (cả khi tài khoản đã có thiệp từ trước).
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'thiep-ledg-'));
process.env.BASE_URL = 'http://localhost';
process.env.ALLOW_EMAIL_SIGNUP = '1';
const server = require('../server');

let base;
const jar = {};
async function call(who, method, url, body, headers = {}) {
  if (jar[who]) headers.cookie = jar[who];
  if (body !== undefined) headers['content-type'] = 'application/json';
  const r = await fetch(base + url, { method, headers, redirect: 'manual', body: body === undefined ? undefined : JSON.stringify(body) });
  const sc = r.headers.get('set-cookie');
  if (sc) jar[who] = sc.split(';')[0];
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = null; }
  return { status: r.status, json, text, location: r.headers.get('location') };
}

async function guestLed(who) {
  let r = await call(who, 'GET', '/tao-led?palette=lam&effect=saoroi');
  assert.equal(r.status, 302);
  const m = /^\/sua-led\/([\w-]+)\?/.exec(r.location || '');
  assert.ok(m, 'khách chưa đăng nhập vào thẳng trình sửa LED, không sang trang đăng nhập: ' + r.location);
  assert.match(jar[who], /^gid=[a-f0-9]{32}$/, 'đặt cookie khách');
  const id = m[1];
  r = await call(who, 'GET', '/tao-led');
  assert.equal(r.location.split('?')[0], `/sua-led/${id}`, 'bấm lại vẫn là bản nháp đó');
  r = await call(who, 'GET', `/api/cards/${id}`);
  assert.equal(r.status, 200);
  assert.equal(r.json.card.guest, true);
  const data = r.json.card.data;
  data.groom.name = 'Minh Khoa'; data.bride.name = 'Thu Trang'; data.date = '2027-03-06';
  r = await call(who, 'PUT', `/api/cards/${id}`, { led: { palette: 'lam', effect: 'saoroi', kicker: 'Lễ Vu Quy' }, data });
  assert.equal(r.status, 200, 'khách lưu được màn LED nháp');
  assert.equal(r.json.card.ledConfig.kicker, 'Lễ Vu Quy');
  assert.equal(r.json.card.led.paid, false);
  const slug = r.json.card.slug;
  r = await call(who, 'GET', `/led/${slug}?preview=1`, undefined, { 'sec-fetch-dest': 'iframe' });
  assert.equal(r.status, 200, 'khách xem trước màn LED của mình');
  assert.match(r.text, /Minh Khoa/);
  assert.equal((await call(who, 'GET', `/led/${slug}`)).status, 403, 'link chiếu thật vẫn khoá');
  assert.equal((await call('anon', 'GET', `/led/${slug}?preview=1`, undefined, { 'sec-fetch-dest': 'iframe' })).status, 403, 'người khác không xem được bản nháp');
  assert.equal((await call(who, 'PUT', `/api/cards/${id}`, { video: {} })).status, 401, 'video vẫn cần đăng nhập');
  assert.equal((await call(who, 'GET', '/tao-video')).location.startsWith('/dang-nhap'), true);
  return id;
}

(async () => {
  await new Promise((done) => server.listen(0, done));
  base = `http://127.0.0.1:${server.address().port}`;
  let r;

  // 1. tài khoản mới: bản nháp thành thiệp của tài khoản, màn LED giữ nguyên
  const id1 = await guestLed('a');
  r = await call('a', 'POST', '/api/auth/register', { email: 'led1@test.vn', password: '123456' });
  assert.equal(r.status, 200);
  r = await call('a', 'GET', `/api/cards/${id1}`);
  assert.equal(r.status, 200);
  assert.equal(r.json.card.guest, false);
  assert.equal(r.json.card.ledConfig.kicker, 'Lễ Vu Quy', 'đăng nhập xong màn LED còn nguyên');
  assert.equal(r.json.card.ledConfig.effect, 'saoroi');
  assert.equal(r.json.card.data.groom.name, 'Minh Khoa');

  // 2. tài khoản đã có thiệp (đã điền nhiều thứ): màn LED nháp chuyển sang thiệp đó, thiệp không bị thay bằng bản trống
  r = await call('b', 'POST', '/api/auth/register', { email: 'led2@test.vn', password: '123456' });
  r = await call('b', 'POST', '/api/cards', { template: 'dodam' });
  const own = r.json.card;
  own.data.groom.name = 'Cũ Rể'; own.data.bride.name = ''; own.data.inviteText = 'Lời mời riêng của tôi';
  await call('b', 'PUT', `/api/cards/${own.id}`, { data: own.data });
  const bLogin = jar.b;
  delete jar.b; // đăng xuất
  const id2 = await guestLed('b');
  const gid = jar.b;
  jar.b = gid;
  r = await call('b', 'POST', '/api/auth/login', { email: 'led2@test.vn', password: '123456' });
  assert.equal(r.status, 200);
  assert.deepEqual(r.json.moved, { from: [id2], to: own.id }, 'bản nháp gộp vào thiệp sẵn có');
  r = await call('b', 'GET', `/api/cards/${own.id}`);
  assert.equal(r.json.card.ledConfig.kicker, 'Lễ Vu Quy', 'màn LED đã sửa chuyển sang thiệp của tài khoản');
  assert.equal(r.json.card.data.inviteText, own.data.inviteText, 'nội dung thiệp cũ không bị thay bằng bản nháp trống');
  assert.equal(r.json.card.data.groom.name, 'Minh Khoa', 'tên vừa gõ trên màn LED được điền vào');
  assert.equal(r.json.card.data.bride.name, 'Thu Trang');
  assert.equal(r.json.card.template, 'dodam', 'mẫu thiệp giữ nguyên');
  void bLogin;

  // 3. đã đăng nhập, thiệp có tên sẵn: xem mẫu LED gõ tên khác → Dùng mẫu ra đúng tên vừa gõ (trước đây giữ tên cũ)
  r = await call('b', 'GET', '/tao-led?palette=lam&effect=saoroi&groom=' + encodeURIComponent('Quốc Bảo') + '&bride=' + encodeURIComponent('Mai Anh') + '&date=2027-05-01');
  assert.equal(r.location.split('?')[0], `/sua-led/${own.id}`);
  r = await call('b', 'GET', `/api/cards/${own.id}`);
  assert.deepEqual([r.json.card.data.groom.name, r.json.card.data.bride.name, r.json.card.data.date], ['Quốc Bảo', 'Mai Anh', '2027-05-01'], 'tên gõ lúc xem mẫu thay tên cũ');
  // thiệp mới tạo sau đó lấy tên mới từ hồ sơ cưới, không quay về tên cũ
  r = await call('b', 'POST', '/api/cards', { template: 'songhy', groom: 'Quốc Bảo', bride: 'Mai Anh' });
  assert.equal(r.json.card.data.groom.name, 'Quốc Bảo');

  console.log('led-guest: OK');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
