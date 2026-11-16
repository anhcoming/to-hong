// Chế độ kho từ xa (như trên Vercel): chạy máy chủ với một Upstash Redis giả để kiểm tra những thứ chế độ file không chạm tới —
// ghi dữ liệu thất bại thì KHÔNG được trả lời thành công (webhook thanh toán), cài đặt quản trị có hiệu lực sau khi nạp dữ liệu,
// GET tạo thiệp nháp (/tao-led) ghi chắc chắn, nội dung gửi lên được đọc trước khi giữ khoá.
const assert = require('assert');
const http = require('http');
const fs = require('fs'), os = require('os'), path = require('path');

// ---- Redis giả (REST của Upstash): GET, SET NX PX, EVAL (hai đoạn mã của lib/db.js) ----
const kv = new Map();
const fake = { failCas: false, casCalls: 0, lockHeldAtBody: null };
const redis = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (c) => { raw += c; });
  req.on('end', () => {
    const cmd = JSON.parse(raw);
    let result = null;
    const now = Date.now();
    const live = (k) => { const v = kv.get(k); if (v && v.exp && v.exp < now) { kv.delete(k); return undefined; } return v; };
    if (cmd[0] === 'GET') { const v = live(cmd[1]); result = v ? v.val : null; }
    else if (cmd[0] === 'SET') {
      const nx = cmd.includes('NX'), px = cmd.indexOf('PX');
      if (nx && live(cmd[1])) result = null;
      else { kv.set(cmd[1], { val: cmd[2], exp: px > 0 ? now + +cmd[px + 1] : 0 }); result = 'OK'; }
    } else if (cmd[0] === 'EVAL') {
      const script = cmd[1], n = +cmd[2], keys = cmd.slice(3, 3 + n), args = cmd.slice(3 + n);
      if (script.includes("'DEL'")) { // nhả khoá
        const v = live(keys[0]);
        if (v && v.val === args[0]) { kv.delete(keys[0]); result = 1; } else result = 0;
      } else { // so-rồi-đổi
        fake.casCalls++;
        const v = live(keys[0]);
        const cur = v ? v.val : false;
        if (!fake.failCas && ((cur === false && args[0] === '') || cur === args[0])) {
          kv.set(keys[1], { val: args[2] }); kv.set(keys[0], { val: args[1] }); result = 1;
        } else result = 0;
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ result }));
  });
});

let base; const jar = {};
async function call(who, method, url, body, headers = {}) {
  if (jar[who]) headers.cookie = jar[who];
  if (body !== undefined) headers['content-type'] = 'application/json';
  const r = await fetch(base + url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' });
  const sc = r.headers.get('set-cookie'); if (sc) jar[who] = sc.split(';')[0];
  const text = await r.text(); let json; try { json = JSON.parse(text); } catch { json = null; }
  return { status: r.status, json, text, location: r.headers.get('location') };
}
const stored = () => JSON.parse(kv.get('cuoinha:db').val);

(async () => {
  await new Promise((ok) => redis.listen(0, ok));
  process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'thiep-remote-'));
  process.env.BASE_URL = 'http://localhost';
  process.env.ALLOW_EMAIL_SIGNUP = '1'; // bài kiểm thử tạo tài khoản bằng email (ngoài thực tế đã đóng khi có Google / Facebook)
  process.env.SEPAY_API_KEY = 'k';
  process.env.ADMIN_PASSWORD = 'quantri-thu-123';
  process.env.KV_REST_API_URL = `http://127.0.0.1:${redis.address().port}`;
  process.env.KV_REST_API_TOKEN = 't';
  delete process.env.POSTGRES_URL; delete process.env.DATABASE_URL;
  // cài đặt đã lưu sẵn trong kho từ trước khi bản chạy này khởi động (vd. sửa trên trang quản trị ở bản chạy khác)
  kv.set('cuoinha:db', { val: JSON.stringify({ users: [], sessions: {}, cards: [], guests: [], rsvps: [], wishes: [], orders: [], bankTxns: [], weddings: [], tasks: [], budget: [], settings: { price: 111000, listPrice: 111000, trialDays: 9 } }) });
  kv.set('cuoinha:ver', { val: 'aa' });

  const server = require('../server');
  await new Promise((ok) => server.listen(0, ok));
  base = `http://127.0.0.1:${server.address().port}`;

  // 1. cài đặt trong kho có hiệu lực dù lúc khởi động dữ liệu chưa nạp
  let r = await call('x', 'GET', '/api/meta');
  assert.equal(r.status, 200);
  assert.equal(r.json.price, 111000, 'giá sửa trên trang quản trị phải được áp sau khi nạp dữ liệu');
  assert.equal(r.json.trialDays, 9);

  // 2. ghi bình thường: đăng ký, tạo thiệp, phát hành → có trong kho
  r = await call('u', 'POST', '/api/auth/register', { email: 'remote@test.vn', password: '123456', name: 'Xa' });
  assert.equal(r.status, 200, r.text);
  r = await call('u', 'POST', '/api/cards', { template: 'dodam' });
  assert.equal(r.status, 200, r.text);
  const c = r.json.card;
  r = await call('u', 'PUT', `/api/cards/${c.id}`, { data: { ...c.data, groom: { ...c.data.groom, name: 'An' }, bride: { ...c.data.bride, name: 'Bình' }, date: '2027-01-17' }, slug: 'an-binh-xa' });
  assert.equal(r.status, 200, r.text);
  assert.equal((await call('u', 'POST', `/api/cards/${c.id}/publish`, {})).status, 200);
  assert.equal(stored().cards.find((x) => x.id === c.id).status, 'published');
  assert.ok(!kv.get('cuoinha:lock'), 'xong request thì nhả khoá');

  // 3. thanh toán: kho từ chối ghi → KHÔNG được báo thành công, và giao dịch gửi lại sau đó vẫn được ghi nhận
  const o = (await call('u', 'POST', `/api/cards/${c.id}/order`, { product: 'card' })).json.order;
  const pay = () => call('sepay', 'POST', '/api/pay/sepay', { id: 501, transferType: 'in', transferAmount: o.amount, content: `CK ${o.code}` }, { authorization: 'Apikey k' });
  fake.failCas = true;
  r = await pay();
  assert.equal(r.status, 503, 'ghi thất bại phải trả 503 để SePay gửi lại: ' + r.text);
  assert.ok(!(r.json && r.json.success), 'không được báo success khi chưa lưu');
  assert.notEqual(stored().orders.find((x) => x.code === o.code).status, 'paid');
  assert.ok(!kv.get('cuoinha:lock'), 'ghi lỗi vẫn phải nhả khoá');
  fake.failCas = false;
  // trạng thái "đã thanh toán" chưa ghi được không được sót lại trong bộ nhớ rồi lẫn vào lần ghi sau
  r = await call('u', 'GET', `/api/cards/${c.id}`);
  assert.equal(r.json.card.paid, false, 'sau lần ghi lỗi phải nạp lại dữ liệu thật từ kho');
  r = await pay();
  assert.equal(r.status, 200, r.text);
  assert.equal(r.json.result, 'paid', 'SePay gửi lại thì đơn được ghi nhận');
  assert.equal(stored().orders.find((x) => x.code === o.code).status, 'paid');
  assert.equal(stored().cards.find((x) => x.id === c.id).paid, true);

  // 4. quản trị xác nhận lại đơn đã thanh toán → từ chối (không cộng lượt Trọn bộ lần hai)
  r = await call('a', 'POST', '/api/admin/login', { password: 'quantri-thu-123' });
  assert.equal(r.status, 200, r.text);
  const oid = stored().orders.find((x) => x.code === o.code).id;
  r = await call('a', 'POST', `/api/admin/orders/${oid}/confirm`, {});
  assert.equal(r.status, 409, r.text);

  // 5. GET /tao-led tạo màn LED rồi chuyển trang → phải có trong kho (trước đây ghi kiểu "được thì ghi")
  r = await call('u', 'GET', '/tao-led');
  assert.ok(r.status === 302 || r.status === 303, 'chuyển sang trang sửa LED: ' + r.status);
  const ledId = /\/sua-led\/(\w+)/.exec(r.location)[1];
  assert.ok(stored().cards.some((x) => x.id === ledId), 'thiệp của màn LED đã nằm trong kho');

  // 6. khách gửi nội dung thật chậm: khoá dữ liệu chỉ được giữ sau khi đã nhận đủ nội dung
  const slow = await new Promise((ok, bad) => {
    const body = JSON.stringify({ name: 'Khách chậm', message: 'Chúc mừng' });
    const rq = http.request(base + '/api/public/an-binh-xa/wish', { method: 'POST', headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) } }, (rs) => {
      let t = ''; rs.on('data', (d) => { t += d; }); rs.on('end', () => ok({ status: rs.statusCode, text: t }));
    });
    rq.on('error', bad);
    rq.write(body.slice(0, 10));
    setTimeout(() => { fake.lockHeldAtBody = !!kv.get('cuoinha:lock'); rq.end(body.slice(10)); }, 400);
  });
  assert.equal(slow.status, 200, slow.text);
  assert.equal(fake.lockHeldAtBody, false, 'chưa nhận đủ nội dung thì chưa được giữ khoá');
  assert.ok(stored().wishes.some((w) => w.name === 'Khách chậm'));

  // 7. khách mở thiệp (GET có đếm lượt xem) trong lúc kho bận ghi → trang vẫn hiện bình thường
  fake.failCas = true;
  r = await call('g', 'GET', '/t/an-binh-xa');
  assert.equal(r.status, 200, 'đếm lượt xem không ghi được thì thiệp vẫn phải mở');
  fake.failCas = false;

  // 8. giới hạn đăng nhập sai đếm trong kho (mọi bản chạy đếm chung), không phải trong bộ nhớ của từng bản chạy
  for (let i = 0; i < 20; i++) assert.equal((await call('bf', 'POST', '/api/auth/login', { email: 'remote@test.vn', password: 'sai-' + i })).status, 401);
  assert.equal((await call('bf', 'POST', '/api/auth/login', { email: 'remote@test.vn', password: '123456' })).status, 429, 'quá 20 lần trong 15 phút thì chặn, kể cả mật khẩu đúng');
  assert.ok(Object.values(stored().limits || {}).some((a) => a.length === 20), 'bộ đếm nằm trong kho dữ liệu');

  console.log('✓ Kho từ xa: ghi lỗi không báo thành công, cài đặt áp sau khi nạp, GET tạo nháp ghi chắc, đọc nội dung trước khi giữ khoá');
  server.close(); redis.close();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
