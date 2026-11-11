// Kiểm thử mở rộng: mọi trang, đường dẫn cũ, ảnh bìa/ảnh xem trước, video cưới (mẫu ảnh, ô ảnh cố định),
// danh sách "Video của tôi", phân quyền giữa hai tài khoản và chống chèn mã. Chạy trên kho dữ liệu tạm.
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'thiep-full-'));
process.env.BASE_URL = 'http://localhost';
process.env.ADMIN_PASSWORD = 'mat-khau-quan-tri';
const server = require('../server');
const videoLib = require('../lib/video');

let base;
const jar = {};
async function call(who, method, url, body, opts = {}) {
  const headers = {};
  if (jar[who]) headers.cookie = jar[who];
  if (body !== undefined) headers['content-type'] = 'application/json';
  const r = await fetch(base + url, { method, headers, redirect: opts.redirect || 'follow', body: body === undefined ? undefined : JSON.stringify(body) });
  const sc = r.headers.get('set-cookie');
  if (sc) jar[who] = sc.split(';')[0];
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = null; }
  return { status: r.status, json, text, headers: r.headers };
}
let n = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); n++; };
const eq = (a, b, msg) => { assert.deepEqual(a, b, msg); n++; };

(async () => {
  await new Promise((done) => server.listen(0, done));
  base = `http://127.0.0.1:${server.address().port}`;
  let r;

  // ---------- trang công khai ----------
  const pages = {
    '/': [/class="trio3"/, /id="video"/, /class="hnav"/],
    '/mau-thiep': [/id="fStyle"/],
    '/video-cuoi': [/id="vgal"/, /Video <em>cưới<\/em>/],
    '/so-tay-cuoi': [/Sổ tay/],
    '/dang-nhap': [/<form|id="/],
    '/thiep-cua-toi': [/id="list"/],
    '/video-cua-toi': [/id="list"/],
    '/so-tay': [/id="ptabs"/],
    '/admin': [/<html/],
  };
  for (const [p, marks] of Object.entries(pages)) {
    r = await call('x', 'GET', p);
    eq(r.status, 200, `trang ${p}`);
    for (const m of marks) ok(m.test(r.text), `trang ${p} thiếu ${m}`);
  }
  // mọi ảnh / file tĩnh nhúng thẳng trong các trang phải tải được (không có link chết)
  for (const p of Object.keys(pages)) {
    const html = (await call('x', 'GET', p)).text;
    const refs = [...html.matchAll(/(?:src|href)="(\/(?:demo|css|js|card|video)\/[^"$`{}' +]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
    for (const u of new Set(refs)) eq((await call('x', 'GET', u)).status, 200, `trang ${p}: ${u}`);
  }
  // menu trang chủ: đúng 3 chức năng chính
  r = await call('x', 'GET', '/');
  const menu = (r.text.match(/<nav class="menu"[^]*?<\/nav>/) || [''])[0];
  eq((menu.match(/<a /g) || []).length, 3, 'menu trang chủ chỉ có 3 mục');
  ok(/Thiệp cưới/.test(menu) && /Video cưới/.test(menu) && /Sổ tay cưới/.test(menu), 'menu: Thiệp / Video / Sổ tay');

  // đường dẫn cũ chuyển về trang Video cưới
  for (const p of ['/video-dam-ngo', '/man-hinh-led-dam-cuoi']) {
    r = await call('x', 'GET', p, undefined, { redirect: 'manual' });
    eq(r.status, 301, `${p} phải chuyển hướng`);
    eq(r.headers.get('location'), '/video-cuoi', `${p} → /video-cuoi`);
  }
  eq((await call('x', 'GET', '/khong-co-trang-nay')).status, 404, 'trang không tồn tại → 404');

  // ---------- mẫu thiệp: ảnh bìa mọi bảng màu ----------
  const meta = (await call('x', 'GET', '/api/meta')).json;
  ok(meta.templates.length >= 29, `phải có ít nhất 29 mẫu thiệp (có ${meta.templates.length})`);
  for (const g of ['hoanggia', 'minhhoa']) ok(meta.templates.some((t) => t.group === g), `nhóm ${g} phải có mẫu`);
  for (const t of meta.templates) {
    for (const p of t.palettes) {
      eq((await call('x', 'GET', `/demo/cover-${t.id}-${p.id}.jpg`)).status, 200, `ảnh bìa ${t.id}-${p.id}`);
    }
    // bản xem trước (preview=1) bỏ màn mở thiệp, bản thường có màn mở
    r = await call('x', 'GET', `/demo/${t.id}?preview=1`);
    ok(/is-preview/.test(r.text), `mẫu ${t.id}: chế độ xem trước`);
  }

  // ---------- video cưới: danh mục mẫu ----------
  const vt = meta.video.templates;
  const photoTpls = vt.filter((t) => t.photos);
  ok(photoTpls.length >= 10, `phải có ít nhất 10 mẫu video ảnh (có ${photoTpls.length})`);
  eq(vt[0].photos, true, 'mẫu video ảnh đứng đầu danh sách');
  for (const t of vt) {
    if (t.photos) ok(Number.isInteger(t.slots) && t.slots >= 6 && t.slots <= 12, `mẫu ${t.id}: số ô ảnh 6–12 (${t.slots})`);
    eq((await call('x', 'GET', `/video/demo?template=${t.id}&preview=1`)).status, 200, `video demo ${t.id}`);
    eq((await call('x', 'GET', `/demo/vposter-${t.id}.jpg`)).status, 200, `ảnh xem trước video ${t.id}`);
  }
  // trang chiếu demo của mẫu ảnh chỉ đưa đúng số ảnh của mẫu
  for (const t of photoTpls) {
    r = await call('x', 'GET', `/video/demo?template=${t.id}`);
    const cfg = JSON.parse(r.text.match(/window\.__VIDEO=(\{.*?\})<\/script>/)[1]);
    ok(cfg.photos.length > 0 && cfg.photos.length <= t.slots, `video demo ${t.id}: ${cfg.photos.length} ảnh ≤ ${t.slots} ô`);
    ok(/id="seek"/.test(r.text), `video demo ${t.id}: có thanh tua`);
  }

  // ---------- video: chuẩn hoá dữ liệu (thư viện) ----------
  let v = videoLib.normalize({ template: 'traitim', photos: ['/demo/a.jpg', '', 'javascript:alert(1)', '/uploads/b.jpg'], photoSec: 99 });
  eq(v.photos, ['/demo/a.jpg', '', '', '/uploads/b.jpg'], 'giữ ô trống, đường dẫn lạ thành ô trống');
  eq(v.photoSec, 6, 'số giây mỗi ảnh tối đa 6');
  eq(videoLib.normalize({ photoSec: 0.2 }).photoSec, 2, 'số giây mỗi ảnh tối thiểu 2');
  eq(videoLib.normalize({ template: 'khong-co' }).template, 'sen', 'mẫu lạ → mẫu mặc định');
  eq(videoLib.normalize({ photos: Array.from({ length: 30 }, (_, i) => `/demo/x${i}.jpg`) }).photos.length, 20, 'tối đa 20 ảnh lưu');
  const fakeCard = { data: { cover: '/demo/c.jpg', photos: ['/demo/1.jpg', '/demo/2.jpg', '/demo/c.jpg'] } };
  eq(videoLib.slidePhotos(fakeCard, { template: 'traitim', photos: [] }), ['/demo/c.jpg', '/demo/1.jpg', '/demo/2.jpg'], 'chưa chọn ảnh → ảnh bìa + album (bỏ trùng)');
  const twelve = Array.from({ length: 12 }, (_, i) => `/demo/p${i}.jpg`);
  eq(videoLib.slidePhotos(fakeCard, { template: 'traitim', photos: twelve }).length, 6, 'mẫu Trái tim chỉ dùng 6 ảnh');
  eq(videoLib.slidePhotos(fakeCard, { template: 'album', photos: twelve }).length, 12, 'mẫu Album dùng 12 ảnh');
  eq(videoLib.slidePhotos(fakeCard, { template: 'album', photos: ['', '/demo/a.jpg', ''] }), ['/demo/a.jpg'], 'bỏ ô trống khi chiếu');

  // ---------- tài khoản, thiệp, video qua API ----------
  eq((await call('anon', 'GET', '/api/cards')).status, 401, 'chưa đăng nhập không xem được danh sách thiệp');
  r = await call('a', 'POST', '/api/auth/register', { email: 'a@test.vn', password: '123456', name: 'An' });
  eq(r.status, 200, 'đăng ký A');
  r = await call('b', 'POST', '/api/auth/register', { email: 'b@test.vn', password: '123456', name: 'Bình' });
  eq(r.status, 200, 'đăng ký B');
  r = await call('a', 'POST', '/api/cards', { template: 'phuonghoang' });
  eq(r.status, 200, 'A tạo thiệp mẫu mới');
  const id = r.json.card.id;
  r = await call('a', 'PUT', `/api/cards/${id}`, { video: { template: 'polaroid', photos: ['/demo/longphung-1.jpg', '', '/demo/longphung-2.jpg'], event: { kind: '<b>Lễ</b> Ăn Hỏi', date: '2026-11-22', time: '09:00', place: 'Nhà gái' } } });
  eq(r.status, 200, 'A lưu video');
  eq(r.json.card.videoConfig.photos, ['/demo/longphung-1.jpg', '', '/demo/longphung-2.jpg'], 'ô trống được lưu đúng vị trí');
  eq(r.json.card.video.template, 'polaroid', 'tóm tắt thiệp có mẫu video');
  eq(r.json.card.video.kind, '<b>Lễ</b> Ăn Hỏi', 'tóm tắt thiệp có tên buổi lễ');
  const list = (await call('a', 'GET', '/api/cards')).json.cards;
  ok(list.some((c) => c.id === id && c.video.created), 'danh sách thiệp báo đã có video (cho trang Video của tôi)');
  // B không xem / sửa / xoá được thiệp của A
  ok([403, 404].includes((await call('b', 'GET', `/api/cards/${id}`)).status), 'B không đọc được thiệp của A');
  ok([403, 404].includes((await call('b', 'PUT', `/api/cards/${id}`, { video: { template: 'sen' } })).status), 'B không sửa được video của A');
  ok([403, 404].includes((await call('b', 'DELETE', `/api/cards/${id}`)).status), 'B không xoá được thiệp của A');
  // trang chiếu: tên buổi lễ có thẻ HTML phải được escape
  const slug = (await call('a', 'GET', `/api/cards/${id}`)).json.card.slug;
  r = await call('anon', 'GET', `/video/${slug}`);
  eq(r.status, 200, 'trang chiếu video công khai');
  ok(!r.text.includes('<b>Lễ</b>'), 'tên buổi lễ phải được escape trong trang chiếu');
  ok(r.text.includes('"photos":["/demo/longphung-1.jpg","/demo/longphung-2.jpg"]'), 'trang chiếu chỉ gửi ảnh thật, bỏ ô trống');
  // ?mau= từ trang Video cưới: trình sửa video phải mở được
  eq((await call('a', 'GET', `/sua-video/${id}?mau=dienanh`)).status, 200, 'mở trình sửa video kèm mẫu');

  // ---------- bản sao MP4 dựng trong trình duyệt ----------
  const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypisom'), Buffer.alloc(2000)]);
  const raw = async (who, url, buf, type) => {
    const r2 = await fetch(base + url, { method: 'POST', headers: { cookie: jar[who], 'content-type': type }, body: buf });
    let j; try { j = await r2.json(); } catch { j = null; }
    return { status: r2.status, json: j };
  };
  eq((await raw('a', `/api/cards/${id}/video/saved-file`, mp4, 'video/mp4')).status, 402, 'chưa kích hoạt thì không lưu bản MP4');
  eq((await call('b', 'POST', `/api/cards/${id}/video/saved`, { url: 'https://abc.public.blob.vercel-storage.com/videos/x.mp4' })).status, 404, 'B không ghi được bản MP4 vào video của A');
  eq((await call('a', 'POST', `/api/cards/${id}/video/blob`, { type: 'blob.generate-client-token', payload: {} })).status, 501, 'chưa cấu hình kho thì không cấp vé tải lên');
  ok((await call('x', 'GET', '/api/meta')).json.blobUpload === false, 'meta báo chưa có kho Blob');
  // kích hoạt video (đơn hàng → quản trị xác nhận)
  await call('qt', 'POST', '/api/admin/login', { password: 'mat-khau-quan-tri' });
  r = await call('a', 'POST', `/api/cards/${id}/order`, { product: 'video' });
  const oid = (await call('qt', 'GET', '/api/admin/overview')).json.orders.find((o) => o.code === r.json.order.code).id;
  await call('qt', 'POST', `/api/admin/orders/${oid}/confirm`);
  eq((await raw('a', `/api/cards/${id}/video/saved-file`, Buffer.alloc(3000), 'video/mp4')).status, 400, 'file không phải MP4 bị từ chối');
  eq((await raw('a', `/api/cards/${id}/video/saved-file`, mp4, 'video/webm')).status, 415, 'sai định dạng bị từ chối');
  r = await raw('a', `/api/cards/${id}/video/saved-file`, mp4, 'video/mp4');
  eq(r.status, 200, 'lưu bản MP4 khi đã kích hoạt');
  ok(/^\/uploads\/[\w-]+\.mp4$/.test(r.json.url), 'trả về đường dẫn file MP4');
  eq((await call('anon', 'GET', r.json.url)).status, 200, 'file MP4 đã lưu tải lại được');
  const rg = await fetch(base + r.json.url, { headers: { range: 'bytes=4-11' } });
  eq(rg.status, 206, 'file MP4 tải từng đoạn được (để tua video)');
  eq(Buffer.from(await rg.arrayBuffer()).toString('latin1'), 'ftypisom', 'đúng đoạn byte được yêu cầu');
  const first = r.json.url;
  r = await raw('a', `/api/cards/${id}/video/saved-file`, mp4, 'video/mp4');
  eq((await call('anon', 'GET', first)).status, 404, 'chỉ giữ bản MP4 mới nhất (bản cũ bị xoá)');
  eq((await call('a', 'GET', `/api/cards/${id}`)).json.card.video.mp4, r.json.url, 'thiệp nhớ bản MP4 mới nhất (mở từ máy khác vẫn tải lại được)');
  eq((await call('a', 'POST', `/api/cards/${id}/video/saved`, { url: 'https://evil.example.com/videos/x.mp4' })).status, 400, 'không nhận đường dẫn ngoài kho');

  // ---------- quản trị ----------
  eq((await call('a', 'GET', '/api/admin/overview')).status, 403, 'tài khoản thường không vào được quản trị');
  eq((await call('qt', 'POST', '/api/admin/login', { password: 'sai' })).status, 401, 'sai mật khẩu quản trị');
  eq((await call('qt', 'POST', '/api/admin/login', { password: 'mat-khau-quan-tri' })).status, 200, 'đúng mật khẩu quản trị');
  r = await call('qt', 'GET', '/api/admin/overview');
  eq(r.status, 200, 'quản trị xem tổng quan');

  server.close();
  console.log(`✓ Kiểm thử mở rộng: ${n} điều kiện đều đúng`);
  process.exit(0);
})().catch((e) => { console.error('✗', e.message); server.close(); process.exit(1); });
