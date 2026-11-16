// Kiểm thử đăng nhập Google (giả lập phía Google) và trang quản trị.
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'thiep-admin-'));
process.env.BASE_URL = 'http://localhost';
process.env.ADMIN_PASSWORD = 'mat-khau-quan-tri';
process.env.ALLOW_EMAIL_SIGNUP = '1'; // máy chủ có Google thì mặc định đóng đăng ký bằng email — bài này cần tạo tài khoản email
// Giả lập Google: không gọi mạng thật
const google = require('../lib/google');
let fakeGoogle = null;
google.enabled = () => true;
google.exchange = async (code) => { if (code !== 'ma-dung') throw Object.assign(new Error('Google từ chối'), { status: 502 }); return fakeGoogle; };
const server = require('../server');

let base;
const jar = {};
async function call(who, method, url, body, raw) {
  const headers = {};
  if (jar[who]) headers.cookie = jar[who];
  if (body !== undefined) headers['content-type'] = 'application/json';
  const r = await fetch(base + url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' });
  for (const c of r.headers.getSetCookie ? r.headers.getSetCookie() : [r.headers.get('set-cookie')].filter(Boolean)) {
    const [kv] = c.split(';');
    const [k, v] = kv.split('=');
    const cur = Object.fromEntries((jar[who] || '').split('; ').filter(Boolean).map((x) => x.split('=')));
    if (v) cur[k] = v; else delete cur[k];
    jar[who] = Object.entries(cur).map(([a, b]) => `${a}=${b}`).join('; ');
  }
  if (raw) return r;
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = null; }
  return { status: r.status, json, text, location: r.headers.get('location') };
}

(async () => {
  await new Promise((ok) => server.listen(0, ok));
  base = `http://127.0.0.1:${server.address().port}`;
  let r;

  await call('admin', 'POST', '/api/auth/register', { email: 'admin@test.vn', password: '123456', name: 'Quản trị' });
  await call('u', 'POST', '/api/auth/register', { email: 'khach@test.vn', password: '123456', name: 'Khách' });
  await call('v', 'POST', '/api/auth/register', { email: 'xau@test.vn', password: '123456' });

  // ---------- đăng nhập quản trị bằng mật khẩu riêng ----------
  r = (await call('admin', 'GET', '/api/admin/session')).json;
  assert.deepEqual([r.admin, r.enabled, r.byEmail], [false, true, false]);
  assert.equal((await call('admin', 'POST', '/api/admin/login', { password: 'Mat-khau-quan-tri' })).status, 401, 'phân biệt hoa thường');
  assert.equal((await call('admin', 'POST', '/api/admin/login', {})).status, 401);
  assert.equal((await call('admin', 'POST', '/api/admin/login', { password: 'mat-khau-quan-tri' })).status, 200);
  assert.match(jar.admin, /cn_admin=/);
  assert.equal((await call('admin', 'GET', '/api/admin/session')).json.admin, true);
  assert.equal((await call('x', 'GET', '/api/admin/stats')).status, 403, 'chưa đăng nhập quản trị');
  // cookie giả / sửa hạn thì không qua
  const real = jar.admin.match(/cn_admin=([^;]+)/)[1];
  jar.fake = `cn_admin=${Date.now() + 9e9}.${real.split('.')[1]}`;
  assert.equal((await call('fake', 'GET', '/api/admin/stats')).status, 403, 'đổi hạn thì chữ ký sai');
  // đoán mật khẩu nhiều lần bị chặn
  for (let i = 0; i < 6; i++) await call('brute', 'POST', '/api/admin/login', { password: 'doan-' + i });
  assert.equal((await call('brute', 'POST', '/api/admin/login', { password: 'mat-khau-quan-tri' })).status, 429);

  // ---------- đăng nhập Google ----------
  assert.equal((await call('x', 'GET', '/api/meta')).json.googleLogin, true);
  r = await call('g', 'GET', '/auth/google?next=/thiep-cua-toi');
  assert.equal(r.status, 302);
  assert.match(r.location, /^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/);
  const state = new URL(r.location).searchParams.get('state');
  assert.match(jar.g, /gst=/);
  r = await call('g', 'GET', `/auth/google/callback?state=sai&code=ma-dung`);
  assert.match(r.location, /^\/dang-nhap\?loi=/, 'sai state → quay về đăng nhập báo lỗi');
  // gộp vào tài khoản email có sẵn
  r = await call('g', 'GET', '/auth/google?next=/thiep-cua-toi');
  const st2 = new URL(r.location).searchParams.get('state');
  assert.notEqual(st2, state);
  fakeGoogle = { sub: 'g-123', email: 'khach@test.vn', name: 'Khách Google', picture: 'https://x/y.png' };
  r = await call('g', 'GET', `/auth/google/callback?state=${st2}&code=ma-dung`);
  assert.equal(r.location, '/thiep-cua-toi');
  r = await call('g', 'GET', '/api/me');
  assert.equal(r.json.user.email, 'khach@test.vn');
  assert.equal(r.json.user.google, true);
  // tài khoản mới chỉ có Google
  r = await call('g2', 'GET', '/auth/google?next=//evil.com');
  fakeGoogle = { sub: 'g-999', email: 'moi@gmail.com', name: 'Người Mới' };
  r = await call('g2', 'GET', `/auth/google/callback?state=${new URL(r.location).searchParams.get('state')}&code=ma-dung`);
  assert.equal(r.location, '/thiep-cua-toi', 'next lạ bị thay bằng /thiep-cua-toi');
  assert.equal((await call('g2', 'GET', '/api/me')).json.user.isAdmin, undefined, 'đăng nhập Google là khách');
  assert.equal((await call('g2', 'GET', '/api/admin/stats')).status, 403);
  r = await call('z', 'POST', '/api/auth/login', { email: 'moi@gmail.com', password: 'gi-cung-duoc' });
  assert.equal(r.status, 401);
  assert.match(r.json.error, /Google/);
  // Google từ chối mã
  r = await call('g3', 'GET', '/auth/google');
  r = await call('g3', 'GET', `/auth/google/callback?state=${new URL(r.location).searchParams.get('state')}&code=ma-sai`);
  assert.match(decodeURIComponent(r.location), /Google từ chối/);
  assert.equal((await call('g3', 'GET', '/api/me')).json.user, null);

  // ---------- quyền ----------
  for (const p of ['/api/admin/stats', '/api/admin/users', '/api/admin/cards', '/api/admin/orders', '/api/admin/settings', '/api/admin/audit']) {
    assert.equal((await call('u', 'GET', p)).status, 403, p);
    assert.equal((await call('admin', 'GET', p)).status, 200, p);
  }

  // ---------- người dùng ----------
  r = await call('admin', 'GET', '/api/admin/users?q=xau');
  const v = r.json.users[0];
  assert.equal(v.email, 'xau@test.vn');
  assert.equal((await call('admin', 'PUT', `/api/admin/users/${v.id}`, { disabled: true })).status, 200);
  assert.equal((await call('v', 'GET', '/api/me')).json.user, null, 'bị khoá thì mất phiên ngay');
  assert.equal((await call('v', 'POST', '/api/auth/login', { email: 'xau@test.vn', password: '123456' })).status, 403);
  await call('admin', 'PUT', `/api/admin/users/${v.id}`, { disabled: false });
  r = await call('admin', 'GET', '/api/admin/users?q=khach');
  const u = r.json.users[0];
  assert.equal(u.google, true);
  r = await call('admin', 'POST', `/api/admin/users/${u.id}/password`);
  const tmp = r.json.password;
  assert.equal(tmp.length, 10);
  assert.equal((await call('g', 'GET', '/api/me')).json.user, null, 'đặt lại mật khẩu → đăng xuất mọi nơi');
  assert.equal((await call('u2', 'POST', '/api/auth/login', { email: 'khach@test.vn', password: tmp })).status, 200);
  await call('admin', 'PUT', `/api/admin/users/${u.id}`, { isAdmin: true });
  assert.equal((await call('u2', 'GET', '/api/admin/stats')).status, 403, 'không cấp quyền quản trị cho tài khoản người dùng được nữa');

  // ---------- cài đặt ----------
  r = await call('admin', 'PUT', '/api/admin/settings', { price: '99.000', coupons: { 'giam 10k!': '10000' }, payment: { bankBin: '970422', bankName: 'MB', accountNo: '0123 456', accountName: 'nguyen van a' } });
  assert.equal(r.json.settings.price, 99000);
  assert.deepEqual(r.json.settings.coupons, { GIAM10K: 10000 });
  assert.equal(r.json.settings.payment, undefined, 'tài khoản nhận tiền không sửa trên web');
  r = await call('u2', 'POST', '/api/cards', { template: 'dodam' });
  r = await call('u2', 'POST', `/api/cards/${r.json.card.id}/order`, {});
  assert.equal(r.json.order.bank.accountNo, require('../config.json').payment.accountNo, 'QR vẫn trỏ tài khoản trong config.json');
  assert.equal((await call('x', 'GET', '/api/meta')).json.price, 99000, 'giá mới áp dụng ngay');
  // giá mở bán: còn hạn → thu giá đang bán, hiện giá gốc gạch; hết hạn → tự thu giá gốc
  await call('admin', 'PUT', '/api/admin/settings', { listPrice: '179.000', promoEndsAt: '2099-01-31' });
  r = await call('x', 'GET', '/api/meta');
  assert.deepEqual([r.json.price, r.json.listPrice], [99000, 179000], 'còn hạn: giá mở bán + giá gốc gạch ngang');
  assert.ok(r.json.promoEndsAt > Date.now());
  await call('admin', 'PUT', '/api/admin/settings', { promoEndsAt: '2020-01-31' });
  r = await call('x', 'GET', '/api/meta');
  assert.deepEqual([r.json.price, r.json.listPrice], [179000, null], 'hết hạn: tự thu giá gốc, không hiện giá gạch');
  r = await call('u2', 'POST', '/api/cards', { template: 'dodam' });
  assert.equal((await call('u2', 'POST', `/api/cards/${r.json.card.id}/order`, {})).json.order.amount, 179000, 'đơn mới theo giá gốc');
  await call('admin', 'PUT', '/api/admin/settings', { listPrice: '', promoEndsAt: '' });
  assert.equal((await call('x', 'GET', '/api/meta')).json.price, 99000, 'bỏ giá gốc → về giá đang bán');

  // ---------- thiệp, đơn ----------
  r = await call('u2', 'POST', '/api/cards', { template: 'dodam' });
  const card = r.json.card;
  const data = { ...card.data, groom: { name: 'An' }, bride: { name: 'Bình' }, date: '2027-01-01' };
  await call('u2', 'PUT', `/api/cards/${card.id}`, { data, slug: 'an-binh' });
  await call('u2', 'POST', `/api/cards/${card.id}/publish`, {});
  r = await call('u2', 'POST', `/api/cards/${card.id}/order`, { coupon: 'giam10k' });
  assert.equal(r.json.order.amount, 89000);
  r = await call('admin', 'GET', '/api/admin/orders?status=pending');
  const ord = r.json.orders.find((o) => o.code === r.json.orders[0].code);
  assert.equal(ord.email, 'khach@test.vn');
  assert.equal((await call('admin', 'PUT', `/api/admin/orders/${ord.id}`, { note: 'đã gọi khách' })).status, 200);
  assert.equal((await call('admin', 'POST', `/api/admin/orders/${ord.id}/cancel`)).status, 200);
  assert.equal((await call('admin', 'POST', `/api/admin/orders/${ord.id}/cancel`)).status, 400, 'đơn đã huỷ không huỷ lại');
  r = await call('admin', 'GET', '/api/admin/orders?status=cancelled');
  assert.equal(r.json.orders[0].note, 'đã gọi khách');

  // ---------- tab Mã giảm giá ----------
  assert.equal((await call('u2', 'POST', '/api/admin/discounts', { code: 'X', value: 1 })).status, 403, 'chỉ quản trị tạo mã');
  r = await call('admin', 'POST', '/api/admin/discounts', { code: 'giam 20%', type: 'percent', value: '20', products: ['card'], note: 'nhóm FB' });
  assert.equal(r.status, 200);
  assert.equal((await call('admin', 'POST', '/api/admin/discounts', { code: 'GIAM20', type: 'percent', value: 20 })).status, 400, 'trùng mã');
  assert.equal((await call('admin', 'POST', '/api/admin/discounts', { code: 'QUA', type: 'percent', value: 120 })).status, 400, 'quá 100%');
  r = await call('u2', 'POST', `/api/cards/${card.id}/order`, { coupon: 'giam20' });
  assert.equal(r.json.order.amount, 79000, '99.000 − 20% (làm tròn nghìn)');
  assert.equal(r.json.order.coupon, 'GIAM20');
  r = await call('u2', 'POST', `/api/cards/${card.id}/order`, {});
  assert.equal(r.json.order.amount, 79000, 'mở lại cửa sổ thanh toán vẫn giữ mã');
  await call('admin', 'PUT', '/api/admin/discounts/GIAM20', { active: false });
  assert.equal((await call('u2', 'POST', `/api/cards/${card.id}/order`, { coupon: 'GIAM20' })).status, 400, 'mã đã tắt');
  r = await call('u2', 'POST', `/api/cards/${card.id}/order`, {});
  assert.deepEqual([r.json.order.amount, r.json.order.coupon], [99000, null], 'mã bị tắt → đơn đang chờ về giá thường');
  await call('admin', 'PUT', '/api/admin/discounts/GIAM20', { active: true, expiresAt: '2020-01-01' });
  r = await call('u2', 'POST', `/api/cards/${card.id}/order`, { coupon: 'GIAM20' });
  assert.match(r.json.error, /hết hạn/);
  assert.equal((await call('u2', 'POST', `/api/cards/${card.id}/order`, { product: 'led', coupon: 'giam10k' })).status, 400);
  // mã 100%, 1 lượt: kích hoạt luôn, lượt sau báo hết
  await call('admin', 'POST', '/api/admin/discounts', { code: 'TANG', type: 'percent', value: 100, limit: 1, products: ['card', 'combo', 'led', 'video'] });
  const c2 = (await call('u2', 'POST', '/api/cards', { template: 'dodam' })).json.card;
  r = await call('u2', 'POST', `/api/cards/${c2.id}/order`, { coupon: 'tang' });
  assert.deepEqual([r.json.order.amount, r.json.order.status], [0, 'paid'], 'giảm 100% → kích hoạt không cần chuyển khoản');
  assert.equal((await call('u2', 'GET', `/api/cards/${c2.id}`)).json.card.paid, true);
  const c3 = (await call('u2', 'POST', '/api/cards', { template: 'dodam' })).json.card;
  assert.match((await call('u2', 'POST', `/api/cards/${c3.id}/order`, { coupon: 'TANG' })).json.error, /hết lượt/);
  r = await call('admin', 'GET', '/api/admin/discounts');
  const tang = r.json.discounts.find((d) => d.code === 'TANG');
  assert.deepEqual([tang.uses, tang.limit, tang.products], [1, 1, []], 'đủ 4 sản phẩm = mọi sản phẩm');
  assert.ok(r.json.discounts.find((d) => d.code === 'GIAM10K').legacy, 'mã cũ trong Cài đặt vẫn hiện');
  assert.equal(r.json.discounts.find((d) => d.code === 'GIAM20').expired, true);
  assert.equal((await call('admin', 'DELETE', '/api/admin/discounts/GIAM10K')).status, 200, 'xoá mã cũ');
  assert.deepEqual((await call('admin', 'GET', '/api/admin/settings')).json.settings.coupons, {});
  assert.equal((await call('admin', 'DELETE', '/api/admin/discounts/GIAM20')).status, 200);
  assert.equal((await call('admin', 'DELETE', '/api/admin/discounts/GIAM20')).status, 404);

  r = await call('admin', 'GET', '/api/admin/cards?q=an-binh');
  assert.equal(r.json.cards[0].ownerEmail, 'khach@test.vn');
  await call('admin', 'POST', `/api/admin/cards/${card.id}/product`, { product: 'card', paid: true, reason: 'tặng' });
  assert.equal((await call('u2', 'GET', `/api/cards/${card.id}`)).json.card.paid, true, 'kích hoạt tay');
  assert.equal((await call('admin', 'POST', `/api/admin/cards/${card.id}/product`, { product: 'led', paid: true })).status, 400, 'chưa tạo màn LED');
  await call('admin', 'POST', `/api/admin/cards/${card.id}/block`, { blocked: true, reason: 'nội dung xấu' });
  r = await call('x', 'GET', '/t/an-binh');
  assert.equal(r.status, 403);
  assert.match(r.text, /tạm thời không khả dụng/);
  assert.equal((await call('x', 'POST', '/api/public/an-binh/wish', { name: 'a', message: 'b' })).status, 404);
  assert.equal((await call('admin', 'GET', '/t/an-binh?preview=1')).status, 200, 'quản trị viên xem trước được');
  await call('admin', 'POST', `/api/admin/cards/${card.id}/block`, { blocked: false });
  assert.equal((await call('x', 'GET', '/t/an-binh')).status, 200);

  // ---------- thống kê & nhật ký ----------
  r = await call('admin', 'GET', '/api/admin/stats?days=30');
  assert.equal(r.json.series.length, 30);
  assert.equal(r.json.totals.users, 4);
  assert.equal(r.json.series[29].signups, 4);
  r = await call('admin', 'GET', '/api/admin/audit');
  const acts = r.json.entries.map((e) => e.action);
  for (const a of ['Khoá tài khoản', 'Đặt lại mật khẩu', 'Sửa cài đặt', 'Huỷ đơn', 'Kích hoạt tay: Thiệp cưới online', 'Gỡ thiệp', 'Khôi phục thiệp']) assert.ok(acts.includes(a), a);
  assert.ok(r.json.entries.every((e) => e.byEmail === 'Quản trị'));
  assert.equal((await call('x', 'GET', '/admin')).status, 200);
  assert.equal((await call('x', 'GET', '/quan-tri')).status, 404, 'đường dẫn quản trị cũ đã bỏ');
  await call('admin', 'POST', '/api/admin/logout');
  assert.equal((await call('admin', 'GET', '/api/admin/stats')).status, 403, 'đăng xuất quản trị');

  // ---------- quản trị theo email chỉ định (ADMIN_EMAILS): chỉ phiên Google của đúng email đó ----------
  process.env.ADMIN_EMAILS = 'Chu@Gmail.com';
  assert.equal((await call('admin', 'GET', '/api/admin/stats')).status, 403, 'cookie mật khẩu quản trị hết tác dụng');
  assert.equal((await call('pw', 'POST', '/api/admin/login', { password: 'mat-khau-quan-tri' })).status, 403, 'tắt đăng nhập bằng mật khẩu');
  // kẻ xấu đăng ký trước bằng email + mật khẩu với đúng địa chỉ của chủ web → vẫn không phải quản trị
  await call('gia', 'POST', '/api/auth/register', { email: 'chu@gmail.com', password: '123456' });
  assert.equal((await call('gia', 'GET', '/api/admin/stats')).status, 403, 'phiên email + mật khẩu không được tính');
  // Google với email khác
  r = await call('gk', 'GET', '/auth/google?next=/admin');
  fakeGoogle = { sub: 'g-khac', email: 'khac@gmail.com', name: 'Khác' };
  await call('gk', 'GET', `/auth/google/callback?state=${new URL(r.location).searchParams.get('state')}&code=ma-dung`);
  assert.equal((await call('gk', 'GET', '/api/admin/stats')).status, 403, 'Google nhưng sai email');
  // Google đúng email
  r = await call('chu', 'GET', '/auth/google?next=/admin');
  fakeGoogle = { sub: 'g-chu', email: 'chu@gmail.com', name: 'Chủ web' };
  r = await call('chu', 'GET', `/auth/google/callback?state=${new URL(r.location).searchParams.get('state')}&code=ma-dung`);
  assert.equal(r.location, '/admin');
  assert.equal((await call('chu', 'GET', '/api/admin/stats')).status, 200, 'chủ web vào được');
  // chủ thật của email vừa vào bằng Google → phiên và mật khẩu của kẻ đăng ký trước mất hiệu lực
  assert.equal((await call('gia', 'GET', '/api/me')).json.user, null, 'phiên của kẻ đăng ký hộ bị đăng xuất');
  assert.equal((await call('gia2', 'POST', '/api/auth/login', { email: 'chu@gmail.com', password: '123456' })).status, 401, 'mật khẩu đặt trước bị bỏ');

  // ---------- đóng tự tạo tài khoản bằng email khi đã có Google / Facebook ----------
  delete process.env.ALLOW_EMAIL_SIGNUP;
  r = await call('x', 'GET', '/api/meta');
  assert.equal(r.json.emailSignup, false);
  r = await call('moi2', 'POST', '/api/auth/register', { email: 'tu-tao@test.vn', password: '123456' });
  assert.equal(r.status, 403, 'không còn tự tạo tài khoản bằng email');
  assert.equal((await call('u2', 'POST', '/api/auth/login', { email: 'khach@test.vn', password: 'sai-mat-khau' })).status, 401, 'tài khoản email cũ vẫn có đường đăng nhập');

  // ---------- đăng nhập Facebook (giả lập phía Facebook) ----------
  const facebook = require('../lib/facebook');
  let fakeFb = null;
  facebook.enabled = () => true;
  facebook.exchange = async () => fakeFb;
  assert.equal((await call('x', 'GET', '/api/meta')).json.facebookLogin, true);
  r = await call('f1', 'GET', '/auth/facebook?next=/thiep-cua-toi');
  assert.match(r.location, /^https:\/\/www\.facebook\.com\/v[\d.]+\/dialog\/oauth\?/);
  assert.equal((await call('f1', 'GET', '/auth/facebook/callback?state=sai&code=x')).location.startsWith('/dang-nhap?loi='), true, 'sai state bị từ chối');
  r = await call('f1', 'GET', '/auth/facebook?next=/thiep-cua-toi');
  fakeFb = { id: 'fb-1', email: '', name: 'Người Dùng Số Điện Thoại', picture: '' }; // tài khoản Facebook không có email
  r = await call('f1', 'GET', `/auth/facebook/callback?state=${new URL(r.location).searchParams.get('state')}&code=x`);
  assert.equal(r.location, '/thiep-cua-toi');
  r = (await call('f1', 'GET', '/api/me')).json.user;
  assert.equal(r.facebook, true);
  assert.equal(r.email, '', 'không lộ email giả ra giao diện');
  assert.equal(r.name, 'Người Dùng Số Điện Thoại');
  // đăng nhập lại → vẫn là tài khoản đó; Facebook trùng email với tài khoản Google đã có → gộp chung
  r = await call('f2', 'GET', '/auth/facebook');
  await call('f2', 'GET', `/auth/facebook/callback?state=${new URL(r.location).searchParams.get('state')}&code=x`);
  assert.equal((await call('f2', 'GET', '/api/me')).json.user.id, (await call('f1', 'GET', '/api/me')).json.user.id);
  r = await call('f3', 'GET', '/auth/facebook');
  fakeFb = { id: 'fb-2', email: 'moi@gmail.com', name: 'Người Mới', picture: '' };
  await call('f3', 'GET', `/auth/facebook/callback?state=${new URL(r.location).searchParams.get('state')}&code=x`);
  r = (await call('f3', 'GET', '/api/me')).json.user;
  assert.equal(r.email, 'moi@gmail.com');
  assert.equal(r.google && r.facebook, true, 'một tài khoản, vào được bằng cả Google lẫn Facebook');
  assert.equal((await call('f3', 'GET', '/api/admin/stats')).status, 403, 'phiên Facebook không được quyền quản trị');
  process.env.ALLOW_EMAIL_SIGNUP = '1';
  r = (await call('chu', 'GET', '/api/admin/session')).json;
  assert.deepEqual([r.admin, r.byEmail, r.email], [true, true, 'chu@gmail.com']);
  assert.equal((await call('gia', 'GET', '/api/admin/stats')).status, 403, 'phiên mật khẩu cũ của kẻ xấu vẫn bị chặn sau khi chủ web gắn Google');
  delete process.env.ADMIN_EMAILS;

  console.log('✓ Đăng nhập Google & trang quản trị: tất cả kiểm thử đều qua');
  server.close();
  process.exit(0);
})().catch((e) => { console.error('✗', e); process.exit(1); });
