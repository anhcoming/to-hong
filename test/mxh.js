// Kiểm thử Duyệt bài MXH (/api/admin/mxh): Claude (khoá MXH_TOKEN) soạn / sửa bài, chủ web duyệt / làm lại / bỏ.
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'thiep-mxh-'));
process.env.BASE_URL = 'http://localhost';
process.env.ADMIN_PASSWORD = 'mat-khau-quan-tri';
process.env.MXH_TOKEN = 'khoa-mxh-thu-0123456789abcdef';
delete process.env.ADMIN_EMAILS;
delete process.env.BLOB_READ_WRITE_TOKEN;
const server = require('../server');

let base, cookie = '';
async function call(who, method, url, body, type) {
  const headers = {};
  if (who === 'anh' && cookie) headers.cookie = cookie;
  if (who === 'claude') headers.authorization = 'Bearer ' + process.env.MXH_TOKEN;
  if (who === 'sai') headers.authorization = 'Bearer khoa-sai-khoa-sai-khoa-sai-khoa';
  let b;
  if (Buffer.isBuffer(body)) { headers['content-type'] = type; b = body; }
  else if (body !== undefined) { headers['content-type'] = 'application/json'; b = JSON.stringify(body); }
  const r = await fetch(base + url, { method, headers, body: b });
  const c = r.headers.get('set-cookie'); if (c && who === 'anh') cookie = c.split(';')[0];
  let json = null; try { json = await r.json(); } catch {}
  return { status: r.status, json };
}

(async () => {
  await new Promise((ok) => server.listen(0, ok));
  base = `http://127.0.0.1:${server.address().port}`;
  let r;

  // chưa đăng nhập / khoá sai → bị chặn
  assert.strictEqual((await call(null, 'GET', '/api/admin/mxh')).status, 403);
  assert.strictEqual((await call('sai', 'GET', '/api/admin/mxh')).status, 403);

  // Claude đưa lô mới
  r = await call('claude', 'PUT', '/api/admin/mxh', { posts: [
    { id: '2026-11-30-01', lo: '2026-11-30', loTen: 'Tuần 30/11–6/12', stt: 1, kenh: ['facebook', 'tiktok'], gio: '2026-11-30T20:00', gioTiktok: '2026-11-30T20:30', loai: 'Reels', tieuDe: 'Bài một', caption: 'Chữ bài một', media: [{ kind: 'video', url: 'https://x.public.blob.vercel-storage.com/mxh/a.mp4' }, { kind: 'image', url: 'javascript:alert(1)' }] },
    { id: '2026-11-30-02', lo: '2026-11-30', stt: 2, gio: '2026-12-01T20:00', tieuDe: 'Bài hai', caption: 'Chữ bài hai' },
  ] });
  assert.strictEqual(r.status, 200, JSON.stringify(r.json));
  assert.strictEqual(r.json.posts[0].trangThai, 'cho-duyet');
  assert.strictEqual(r.json.posts[0].media.length, 1, 'link không an toàn bị bỏ');
  assert.strictEqual((await call('claude', 'PUT', '/api/admin/mxh', { posts: [{ id: 'abcd-x', tieuDe: 'Thiếu lô' }] })).status, 400);
  assert.strictEqual((await call('claude', 'PUT', '/api/admin/mxh', { posts: [{ lo: '2026-11-30', tieuDe: 'x', gio: '30/11 20:00' }] })).status, 400);

  // Claude không tự duyệt được, cũng không bấm nút của chủ web được
  assert.strictEqual((await call('claude', 'PATCH', '/api/admin/mxh/2026-11-30-01', { trangThai: 'da-duyet' })).status, 403);
  assert.strictEqual((await call('claude', 'POST', '/api/admin/mxh/2026-11-30-01/act', { act: 'duyet' })).status, 403);

  // chủ web đăng nhập quản trị
  assert.strictEqual((await call('anh', 'POST', '/api/admin/login', { password: 'mat-khau-quan-tri' })).status, 200);
  r = await call('anh', 'GET', '/api/admin/mxh');
  assert.strictEqual(r.json.posts.length, 2);
  assert.strictEqual(r.json.waiting, 2);

  // duyệt bài 1, làm lại bài 2 (phải có góp ý)
  r = await call('anh', 'POST', '/api/admin/mxh/2026-11-30-01/act', { act: 'duyet' });
  assert.strictEqual(r.json.post.trangThai, 'da-duyet');
  assert.strictEqual((await call('anh', 'POST', '/api/admin/mxh/2026-11-30-01/act', { act: 'duyet' })).status, 409);
  assert.strictEqual((await call('anh', 'POST', '/api/admin/mxh/2026-11-30-02/act', { act: 'lam-lai' })).status, 400);
  r = await call('anh', 'POST', '/api/admin/mxh/2026-11-30-02/act', { act: 'lam-lai', gopY: 'Chữ to hơn' });
  assert.strictEqual(r.json.post.trangThai, 'lam-lai');
  assert.strictEqual(r.json.post.truocKhiSua, 'cho-duyet');

  // Claude lọc việc cần làm
  r = await call('claude', 'GET', '/api/admin/mxh?trangThai=da-duyet,lam-lai');
  assert.deepStrictEqual(r.json.posts.map((p) => p.trangThai).sort(), ['da-duyet', 'lam-lai']);

  // Claude hẹn giờ bài 1 (kèm ver), sửa bài 2 rồi đưa lại chờ duyệt
  const p1 = r.json.posts.find((p) => p.id === '2026-11-30-01');
  assert.strictEqual((await call('claude', 'PATCH', '/api/admin/mxh/2026-11-30-01', { trangThai: 'da-hen-gio', ver: p1.ver - 1 })).status, 409);
  r = await call('claude', 'PATCH', '/api/admin/mxh/2026-11-30-01', { trangThai: 'da-hen-gio', ver: p1.ver, viec: 'hẹn giờ Facebook + TikTok' });
  assert.strictEqual(r.json.post.trangThai, 'da-hen-gio');
  assert.strictEqual(r.json.post.lichSu.at(-1).ai, 'claude');
  r = await call('claude', 'PATCH', '/api/admin/mxh/2026-11-30-02', { caption: 'Chữ mới', trangThai: 'cho-duyet', lanSua: 1, viec: 'làm lại', noiDung: 'tăng cỡ chữ' });
  assert.strictEqual(r.json.post.caption, 'Chữ mới');

  // chủ web yêu cầu sửa bài đã hẹn giờ rồi rút lại → về đã hẹn giờ
  r = await call('anh', 'POST', '/api/admin/mxh/2026-11-30-01/act', { act: 'lam-lai', gopY: 'Đổi giờ 21:00' });
  assert.strictEqual(r.json.post.truocKhiSua, 'da-hen-gio');
  r = await call('anh', 'POST', '/api/admin/mxh/2026-11-30-01/act', { act: 'huy' });
  assert.strictEqual(r.json.post.trangThai, 'da-hen-gio');

  // bỏ rồi lấy lại
  assert.strictEqual((await call('anh', 'POST', '/api/admin/mxh/2026-11-30-02/act', { act: 'bo' })).json.post.trangThai, 'bo');
  assert.strictEqual((await call('anh', 'POST', '/api/admin/mxh/2026-11-30-02/act', { act: 'huy' })).json.post.trangThai, 'cho-duyet');

  // tải ảnh (chạy máy, không có Blob) → /uploads/mxh-….png và mở được
  const png = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex');
  r = await call('claude', 'POST', '/api/admin/mxh/file', png, 'image/png');
  assert.strictEqual(r.status, 200);
  assert.match(r.json.url, /^\/uploads\/mxh-[\w-]+\.png$/);
  assert.strictEqual((await fetch(base + r.json.url)).status, 200);
  assert.strictEqual((await call('claude', 'POST', '/api/admin/mxh/file', png, 'text/html')).status, 415);

  // xoá bài: chỉ chủ web
  assert.strictEqual((await call('claude', 'DELETE', '/api/admin/mxh/2026-11-30-02')).status, 403);
  assert.strictEqual((await call('anh', 'DELETE', '/api/admin/mxh/2026-11-30-02')).status, 200);
  assert.strictEqual((await call('anh', 'GET', '/api/admin/mxh')).json.posts.length, 1);

  console.log('mxh: ok');
  server.close();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
