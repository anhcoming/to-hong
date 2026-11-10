// Kiểm thử nhanh toàn bộ luồng chính trên một kho dữ liệu tạm.
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'thiep-test-'));
process.env.BASE_URL = 'http://localhost';
const server = require('../server');

let base;
const jar = {};
async function call(who, method, url, body) {
  const headers = {};
  if (jar[who]) headers.cookie = jar[who];
  if (body !== undefined) headers['content-type'] = 'application/json';
  const r = await fetch(base + url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const sc = r.headers.get('set-cookie');
  if (sc) jar[who] = sc.split(';')[0];
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = null; }
  return { status: r.status, json, text };
}

(async () => {
  await new Promise((ok) => server.listen(0, ok));
  base = `http://127.0.0.1:${server.address().port}`;
  let r;

  // trang tĩnh + mẫu
  assert.equal((await call('x', 'GET', '/')).status, 200);
  r = await call('x', 'GET', '/demo/coban');
  assert.equal(r.status, 200);
  assert.match(r.text, /Đức Minh/);
  assert.match(r.text, /Bính Ngọ/, 'phải có âm lịch');
  assert.match(r.text, /class="cal-grid"/, 'phải có lịch tháng');
  assert.match(r.text, /class="tl"/, 'lịch trình dạng dòng thời gian');
  // mọi mẫu × mọi bảng màu phải dựng được, có nút mở thiệp, nhóm hợp lệ
  const meta = (await call('x', 'GET', '/api/meta')).json;
  const groupIds = meta.templateGroups.map((g) => g.id);
  for (const t of meta.templates) {
    assert.ok(groupIds.includes(t.group), `mẫu ${t.id}: nhóm "${t.group}" không tồn tại`);
    for (const p of t.palettes) {
      r = await call('x', 'GET', `/demo/${t.id}?palette=${p.id}`);
      assert.equal(r.status, 200, `mẫu ${t.id}/${p.id}`);
      assert.match(r.text, /id="openBtn"/, `mẫu ${t.id}: thiếu nút mở thiệp`);
      assert.match(r.text, /Đức Minh/, `mẫu ${t.id}: thiếu tên`);
    }
  }
  assert.equal((await call('x', 'GET', '/demo/cover.jpg')).status, 200, 'ảnh mẫu phải tải được');
  // dạng URL Vercel gửi tới hàm sau khi rewrite (vercel.json)
  r = await call('x', 'GET', '/api/index.js?palette=dem&__p=%2Fapi%2Fmeta&path=api%2Fmeta');
  assert.equal(r.status, 200, 'URL rewrite của Vercel phải về đúng đường dẫn gốc');
  assert.ok(r.json.templates, 'URL rewrite của Vercel phải trả /api/meta');
  assert.equal((await call('x', 'GET', '/../server.js')).status, 404);

  // tài khoản: người đầu tiên là admin
  r = await call('admin', 'POST', '/api/auth/register', { email: 'admin@test.vn', password: '123456', name: 'Admin' });
  assert.equal(r.json.user.isAdmin, true);
  r = await call('u', 'POST', '/api/auth/register', { email: 'cuoi@test.vn', password: '123456' });
  assert.equal(r.json.user.isAdmin, false);
  assert.equal((await call('u', 'POST', '/api/auth/register', { email: 'cuoi@test.vn', password: '123456' })).status, 409);
  assert.equal((await call('anon', 'GET', '/api/cards')).status, 401);
  assert.equal((await call('u2', 'POST', '/api/auth/login', { email: 'cuoi@test.vn', password: 'sai' })).status, 401);

  // tạo + sửa thiệp
  r = await call('u', 'POST', '/api/cards', { template: 'coban' });
  const id = r.json.card.id;
  assert.equal((await call('u', 'POST', `/api/cards/${id}/publish`, {})).status, 400, 'chưa có tên thì không được phát hành');
  const data = r.json.card.data;
  data.groom.name = 'Tuấn <script>';
  data.bride.name = 'Lan';
  data.date = '2026-12-20';
  data.cover = 'javascript:alert(1)';
  r = await call('u', 'PUT', `/api/cards/${id}`, { data, slug: 'tuan-lan' });
  assert.equal(r.json.card.slug, 'tuan-lan');
  assert.equal(r.json.card.data.cover, '', 'link ảnh nguy hiểm bị loại');
  assert.equal((await call('admin', 'GET', `/api/cards/${id}`)).status, 404, 'người khác không xem được thiệp');

  // nháp: khách chưa mở được, chủ thiệp xem trước được
  assert.equal((await call('anon', 'GET', '/t/tuan-lan')).status, 404);
  r = await call('u', 'GET', '/t/tuan-lan?preview=1');
  assert.equal(r.status, 200);
  assert.ok(!r.text.includes('Tuấn <script>'), 'tên phải được escape');

  // phát hành + khách mời
  r = await call('u', 'POST', `/api/cards/${id}/publish`, {});
  assert.equal(r.json.card.status, 'published');
  r = await call('u', 'POST', `/api/cards/${id}/guests`, { names: 'Anh Hùng\nChị Mai' });
  assert.equal(r.json.added, 2);
  const tooMany = Array.from({ length: 30 }, (_, i) => 'Khách số ' + i).join('\n');
  assert.equal((await call('u', 'POST', `/api/cards/${id}/guests`, { names: tooMany })).status, 200, 'danh sách khách (sổ tay) không giới hạn');
  r = await call('u', 'GET', `/api/cards/${id}/guests`);
  const guest = r.json.guests[0];
  const lateGuest = r.json.guests[25];
  assert.equal(lateGuest.locked, true, 'khách thứ 26 bị khoá link riêng khi thiệp chưa kích hoạt');
  r = await call('anon', 'GET', `/t/tuan-lan/${guest.code}`);
  assert.equal(r.status, 200);
  assert.match(r.text, /Anh Hùng/);
  assert.match(r.text, /Bản dùng thử/);
  r = await call('anon', 'GET', `/t/tuan-lan/${lateGuest.code}`);
  assert.ok(!r.text.includes(lateGuest.name), 'quá giới hạn dùng thử → lời mời chung, không hiện tên');

  // khách xác nhận + chúc
  assert.equal((await call('anon', 'POST', '/api/public/tuan-lan/rsvp', { name: 'Anh Hùng', attending: 'yes', count: 2, side: 'trai', g: guest.code })).status, 200);
  assert.equal((await call('anon', 'POST', '/api/public/tuan-lan/wish', { name: 'Mai', message: 'Hạnh phúc nhé!' })).status, 200);
  assert.equal((await call('anon', 'POST', '/api/public/tuan-lan/wish', { name: '', message: '' })).status, 400);
  r = await call('u', 'GET', `/api/cards/${id}/responses`);
  assert.equal(r.json.rsvps.length, 1);
  assert.equal(r.json.wishes.length, 1);
  r = await call('u', 'GET', `/api/cards/${id}/rsvps.csv`);
  assert.match(r.text, /Anh Hùng/);
  r = await call('u', 'GET', '/api/cards');
  assert.equal(r.json.cards[0].rsvpYes, 2);
  assert.equal(r.json.cards[0].views, 2);
  // xác nhận ghi ngược vào danh sách khách của sổ tay
  r = await call('u', 'GET', '/api/wedding/guests');
  const hung = r.json.guests.find((g) => g.name === 'Anh Hùng');
  assert.equal(hung.rsvp.attending, 'yes');
  assert.equal(hung.count, 2);
  await call('anon', 'POST', '/api/public/tuan-lan/rsvp', { name: 'Bác Tư', attending: 'yes', count: 3, side: 'gai' });
  r = await call('u', 'GET', '/api/wedding/guests');
  assert.equal(r.json.guests.find((g) => g.name === 'Bác Tư').group, 'Tự xác nhận qua thiệp', 'khách xác nhận qua link chung được thêm vào danh sách');
  assert.equal(r.json.stats.yesPeople, 5);

  // thanh toán
  assert.equal((await call('u', 'POST', `/api/cards/${id}/order`, { coupon: 'SAIMA' })).status, 400);
  r = await call('u', 'POST', `/api/cards/${id}/order`, { coupon: 'chaomung' });
  const order = r.json.order;
  assert.equal(order.amount, 99000);
  assert.match(order.qr, /img\.vietqr\.io/);
  r = await call('anon', 'POST', `/api/orders/${order.code}/claim`);
  assert.ok(r.json.order.claimedAt);
  assert.equal((await call('u', 'GET', '/api/admin/overview')).status, 403);
  r = await call('admin', 'GET', '/api/admin/overview');
  const oid = r.json.orders[0].id;
  assert.equal((await call('admin', 'POST', `/api/admin/orders/${oid}/confirm`)).status, 200);
  r = await call('u', 'GET', `/api/cards/${id}`);
  assert.equal(r.json.card.paid, true);
  r = await call('anon', 'GET', `/t/tuan-lan/${lateGuest.code}`);
  assert.ok(r.text.includes(lateGuest.name), 'đã kích hoạt thì mọi khách có link riêng');
  r = await call('anon', 'GET', '/t/tuan-lan');
  assert.ok(!r.text.includes('Bản dùng thử'));

  // màn hình LED
  assert.equal((await call('x', 'GET', '/led/demo?ratio=9:16&effect=hoa')).status, 200);
  assert.equal((await call('x', 'GET', '/led/led.js')).status, 200, 'file JS của màn LED phải tải được');
  assert.equal((await call('anon', 'GET', '/led/tuan-lan')).status, 404, 'chưa tạo màn LED');
  r = await call('u', 'PUT', `/api/cards/${id}`, { led: {} });
  assert.equal(r.json.card.ledConfig.kicker, 'Lễ Thành Hôn');
  assert.equal(r.json.card.led.created, true);
  r = await call('u', 'PUT', `/api/cards/${id}`, { led: { ratio: '9:16', effect: 'xau', density: 99, paid: true } });
  assert.equal(r.json.card.ledConfig.ratio, '9:16');
  assert.equal(r.json.card.ledConfig.effect, 'sao', 'hiệu ứng lạ bị thay bằng mặc định');
  assert.equal(r.json.card.ledConfig.density, 3);
  assert.equal(r.json.card.led.paid, false, 'không tự kích hoạt được qua API sửa');
  r = await call('anon', 'GET', '/led/tuan-lan');
  assert.equal(r.status, 200);
  assert.match(r.text, /Bản dùng thử/);
  assert.ok(!r.text.includes('Tuấn <script>'), 'tên trên màn LED phải được escape');
  assert.equal((await call('u', 'POST', `/api/cards/${id}/order`, { product: 'led', coupon: 'CHAOMUNG' })).status, 400, 'mã giảm giá chỉ cho thiệp');
  r = await call('u', 'POST', `/api/cards/${id}/order`, { product: 'led' });
  assert.equal(r.json.order.amount, 29000);
  assert.match(r.json.order.code, /^LD/);
  r = await call('admin', 'GET', '/api/admin/overview');
  const ledOrder = r.json.orders.find((o) => o.product === 'led');
  await call('admin', 'POST', `/api/admin/orders/${ledOrder.id}/confirm`);
  r = await call('u', 'GET', `/api/cards/${id}`);
  assert.equal(r.json.card.led.paid, true);
  assert.ok(!(await call('anon', 'GET', '/led/tuan-lan')).text.includes('Bản dùng thử'));
  assert.equal((await call('u', 'POST', `/api/cards/${id}/order`, { product: 'led' })).status, 400, 'đã kích hoạt thì không tạo đơn nữa');
  for (const p of ['/man-hinh-led-dam-cuoi', `/sua-led/${id}`]) assert.equal((await call('u', 'GET', p)).status, 200, p);

  // video dạm ngõ
  for (const p of ['/video/demo', '/video/demo?template=dao&photo=1', '/video/engine.js', '/js/lunar.js', '/video-dam-ngo', `/sua-video/${id}`]) {
    assert.equal((await call('u', 'GET', p)).status, 200, p);
  }
  assert.match((await call('x', 'GET', '/js/lunar.js')).text, /window\.Lunar/);
  r = await call('u', 'PUT', `/api/cards/${id}`, { video: {} });
  const vc = r.json.card.videoConfig;
  assert.equal(vc.event.kind, 'Lễ Dạm Ngõ');
  assert.equal(vc.scenes.length, 3);
  assert.ok(vc.scenes[0].lines.some((l) => l.text === '{chu_re}'), 'nội dung mặc định dùng biến');
  vc.scenes[0].lines[0] = { text: 'Lễ Ăn Hỏi', font: 'kieu-la', size: 9999, color: 'red', tone: 'x' };
  vc.template = 'dao';
  vc.event.date = '2026-11-22';
  r = await call('u', 'PUT', `/api/cards/${id}`, { video: { ...vc, paid: true, mp4: '/uploads/x.mp4' } });
  const l0 = r.json.card.videoConfig.scenes[0].lines[0];
  assert.deepEqual([l0.font, l0.size, l0.color, l0.tone], ['serif', 220, '', 'main'], 'dòng chữ được lọc');
  assert.equal(r.json.card.videoConfig.template, 'dao');
  assert.equal(r.json.card.video.paid, false);
  assert.equal(r.json.card.video.mp4, null, 'không tự gán file MP4 qua API sửa');
  r = await call('anon', 'GET', '/video/tuan-lan');
  assert.equal(r.status, 200);
  assert.ok(!r.text.includes('Tuấn <script>'), 'tên trong video phải được escape');
  assert.match(r.text, /"trial":true/);
  assert.equal((await call('u', 'POST', `/api/cards/${id}/video/export`)).status, 402, 'chưa kích hoạt thì không xuất MP4');
  r = await call('u', 'POST', `/api/cards/${id}/order`, { product: 'video' });
  assert.equal(r.json.order.amount, 69000);
  assert.match(r.json.order.code, /^VD/);
  r = await call('admin', 'GET', '/api/admin/overview');
  await call('admin', 'POST', `/api/admin/orders/${r.json.orders.find((o) => o.product === 'video').id}/confirm`);
  r = await call('u', 'GET', `/api/cards/${id}`);
  assert.equal(r.json.card.video.paid, true);
  assert.equal(r.json.card.led.paid, true, 'kích hoạt video không ảnh hưởng màn LED');
  r = await call('u', 'POST', `/api/cards/${id}/video/reset`);
  assert.equal(r.json.card.videoConfig.scenes[0].lines[0].text, '{le}');
  assert.equal(r.json.card.videoConfig.template, 'dao', 'khôi phục chữ giữ nguyên mẫu');

  // xuất MP4 thật (cần ffmpeg)
  const { execFileSync } = require('child_process');
  const webm = path.join(process.env.DATA_DIR, 'in.webm');
  let haveFfmpeg = true;
  try { execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=red:s=320x180:d=1:r=30', '-c:v', 'libvpx', webm]); } catch { haveFfmpeg = false; }
  if (haveFfmpeg) {
    const res = await fetch(`${base}/api/cards/${id}/video/export?loops=2`, { method: 'POST', headers: { cookie: jar.u, 'content-type': 'video/webm' }, body: fs.readFileSync(webm) });
    const out = await res.json();
    assert.equal(res.status, 200, JSON.stringify(out));
    assert.match(out.url, /^\/uploads\/.+\.mp4$/);
    const mp4 = await fetch(base + out.url);
    assert.equal(mp4.headers.get('content-type'), 'video/mp4');
    const probe = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height,codec_name:format=duration', '-of', 'csv=p=0', path.join(process.env.DATA_DIR, 'uploads', path.basename(out.url))]).toString();
    assert.match(probe, /h264,1920,1080/);
    assert.ok(parseFloat(probe.trim().split(/\s+/).pop()) >= 1.9, 'lặp 2 vòng ≈ 2 giây: ' + probe);
    // luồng H.264 thô (đường xuất nhanh bằng WebCodecs của trình duyệt)
    const raw = path.join(process.env.DATA_DIR, 'in.h264');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=blue:s=640x360:d=1:r=30', '-c:v', 'libx264', '-f', 'h264', raw]);
    const res2 = await fetch(`${base}/api/cards/${id}/video/export`, { method: 'POST', headers: { cookie: jar.u, 'content-type': 'video/h264' }, body: fs.readFileSync(raw) });
    const out2 = await res2.json();
    assert.equal(res2.status, 200, JSON.stringify(out2));
    assert.ok(!fs.existsSync(path.join(process.env.DATA_DIR, 'uploads', path.basename(out.url))), 'bản MP4 cũ được dọn');
    const probe2 = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height,codec_name:format=duration', '-of', 'csv=p=0', path.join(process.env.DATA_DIR, 'uploads', path.basename(out2.url))]).toString();
    assert.match(probe2, /h264,1920,1080/);
    assert.ok(Math.abs(parseFloat(probe2.trim().split(/\s+/).pop()) - 1) < 0.1, 'h264 thô 30 khung = 1 giây: ' + probe2);
    console.log('  ✓ xuất MP4 Full HD qua ffmpeg (WebM và H.264 thô)');
  } else console.log('  (bỏ qua kiểm thử xuất MP4 — máy không có ffmpeg)');

  // sổ tay cưới
  for (const p of ['/so-tay', '/so-tay-cuoi', '/tham-gia/abc', '/manifest.webmanifest', '/sw.js']) assert.equal((await call('u', 'GET', p)).status, 200, p);
  r = await call('u', 'GET', '/api/wedding');
  assert.equal(r.json.wedding.couple.bride.name, 'Lan', 'thiệp cũ đồng bộ thông tin đôi vào sổ tay');
  assert.equal(r.json.wedding.date, '2026-12-20');
  assert.equal(r.json.cards.length, 1);
  r = await call('u', 'GET', '/api/wedding/tasks');
  assert.ok(r.json.tasks.some((t) => /tráp ăn hỏi \(số lẻ/.test(t.title)), 'miền Bắc: tráp số lẻ');
  assert.ok(!r.json.tasks.some((t) => /mâm quả/.test(t.title)));
  assert.equal(r.json.tasks.find((t) => t.offset === 0 && t.title === 'Tiệc cưới').due, '2026-12-20');
  assert.ok(r.json.tasks.some((t) => t.cta === 'card'), 'có bước gắn nút làm thiệp');
  const t1 = r.json.tasks[0];
  r = await call('u', 'PUT', `/api/tasks/${t1.id}`, { done: true });
  assert.equal(r.json.task.done, true);
  r = await call('u', 'POST', '/api/wedding/tasks', { title: 'Đặt bánh cưới', category: 'Tiệc cưới', offset: -20 });
  const custom = r.json.task;
  assert.equal(custom.due, '2026-11-30');
  r = await call('u', 'PUT', '/api/wedding', { region: 'nam' });
  r = await call('u', 'GET', '/api/wedding/tasks');
  assert.ok(r.json.tasks.some((t) => /mâm quả đám hỏi/.test(t.title)), 'đổi sang miền Nam: mâm quả số chẵn');
  assert.ok(!r.json.tasks.some((t) => /tráp ăn hỏi \(số lẻ/.test(t.title)));
  assert.ok(r.json.tasks.some((t) => t.id === custom.id) && r.json.tasks.some((t) => t.id === t1.id && t.done), 'giữ việc tự thêm và việc đã xong');
  // việc gắn theo từng lễ: ăn hỏi tính hạn theo ngày ăn hỏi
  r = await call('u', 'GET', '/api/wedding/tasks');
  const mq = r.json.tasks.find((t) => /mâm quả đám hỏi/.test(t.title));
  assert.equal(mq.event, 'anhoi');
  assert.equal(mq.due, null, 'chưa chọn ngày đám hỏi thì chưa có hạn chót');
  r = await call('u', 'PUT', '/api/wedding', { anhoi: '2026-11-15' });
  assert.equal(r.json.wedding.eventNames.anhoi, 'Lễ đám hỏi', 'miền Nam gọi là đám hỏi');
  r = await call('u', 'GET', '/api/wedding/tasks');
  assert.equal(r.json.tasks.find((t) => t.id === mq.id).due, '2026-10-16', 'trước đám hỏi 30 ngày');
  assert.ok(r.json.tasks.some((t) => /hoa cưới/.test(t.title)) && r.json.tasks.some((t) => /xe cưới/i.test(t.title)), 'có gợi ý hoa cưới, xe cưới');
  const xe = r.json.tasks.find((t) => /xe cưới/i.test(t.title));
  await call('u', 'DELETE', `/api/tasks/${xe.id}`);
  await call('u', 'POST', '/api/wedding/tasks/reseed');
  r = await call('u', 'GET', '/api/wedding/tasks');
  assert.ok(r.json.tasks.some((t) => /xe cưới/i.test(t.title)), 'khôi phục gợi ý đã xoá');
  assert.ok(r.json.tasks.some((t) => t.id === custom.id), 'khôi phục vẫn giữ việc tự thêm');
  r = await call('u', 'POST', '/api/wedding/tasks', { title: 'Mua quà cho nhà gái', event: 'anhoi', offset: -5 });
  assert.equal(r.json.task.due, '2026-11-10');

  r = await call('u', 'GET', '/api/wedding/budget');
  assert.ok(r.json.items.length > 10);
  const it = r.json.items[0];
  r = await call('u', 'PUT', `/api/budget/${it.id}`, { estimate: '120.000.000', actual: 115000000, paid: '50,000,000' });
  assert.deepEqual([r.json.item.estimate, r.json.item.actual, r.json.item.paid], [120000000, 115000000, 50000000]);
  r = await call('u', 'PUT', '/api/wedding', { budgetTotal: '300.000.000', couple: { groom: { name: 'Tuấn Anh' } } });
  assert.equal(r.json.wedding.budgetTotal, 300000000);
  assert.equal(r.json.stats.actual, 115000000);
  r = await call('u', 'GET', `/api/cards/${id}`);
  assert.equal(r.json.card.data.groom.name, 'Tuấn Anh', 'sửa ở sổ tay → thiệp đổi theo');
  r = await call('u', 'PUT', `/api/guests/${hung.id}`, { gift: '2.000.000', group: 'Đồng nghiệp' });
  assert.equal(r.json.guest.gift, 2000000);
  r = await call('u', 'GET', '/api/wedding/guests.csv');
  assert.match(r.text, /Đồng nghiệp/);
  // mời người yêu cùng sửa
  r = await call('u', 'GET', '/api/wedding/invite');
  const code = r.json.url.split('/').pop();
  await call('p', 'POST', '/api/auth/register', { email: 'nguoiyeu@test.vn', password: '123456' });
  assert.equal((await call('p', 'GET', `/api/cards/${id}`)).status, 404, 'chưa tham gia thì không xem được thiệp');
  r = await call('p', 'GET', `/api/join/${code}`);
  assert.match(r.json.names, /Tuấn Anh/);
  assert.equal((await call('p', 'POST', `/api/join/${code}`)).status, 200);
  r = await call('p', 'GET', '/api/wedding');
  assert.equal(r.json.members.length, 2);
  assert.equal(r.json.wedding.isOwner, false);
  assert.equal((await call('p', 'GET', `/api/cards/${id}`)).status, 200, 'thành viên sửa được thiệp chung');
  r = await call('p', 'GET', '/api/cards');
  assert.ok(r.json.cards.some((c) => c.id === id));
  r = await call('p', 'PUT', `/api/tasks/${custom.id}`, { assignee: r.json.cards[0].ownerId });
  assert.ok(r.json.task.assignee, 'giao việc cho thành viên');
  assert.equal((await call('p', 'DELETE', `/api/wedding/members/${r.json.task.assignee}`)).status, 403, 'thành viên thường không xoá được người khác');
  assert.equal((await call('u', 'DELETE', `/api/wedding/members/${r.json.task.assignee}`)).status, 400, 'không xoá được người tạo');
  const pid = (await call('p', 'GET', '/api/me')).json.user.id;
  assert.equal((await call('u', 'DELETE', `/api/wedding/members/${pid}`)).status, 200);
  assert.equal((await call('p', 'GET', `/api/cards/${id}`)).status, 404, 'bị xoá khỏi sổ tay thì mất quyền');
  r = await call('p', 'GET', '/api/wedding');
  assert.equal(r.json.members.length, 1, 'tự có sổ tay riêng');
  assert.equal((await call('p', 'PUT', `/api/budget/${it.id}`, { estimate: 1 })).status, 404, 'không sửa được ngân sách nhà khác');

  // nhân bản + xoá
  r = await call('u', 'POST', `/api/cards/${id}/duplicate`);
  assert.equal(r.json.card.paid, false);
  assert.equal((await call('u', 'DELETE', `/api/cards/${r.json.card.id}`)).status, 200);

  console.log('✓ Tất cả kiểm thử đều qua');
  server.close();
  process.exit(0);
})().catch((e) => { console.error('✗', e); process.exit(1); });
