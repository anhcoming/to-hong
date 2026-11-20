#!/usr/bin/env node
// Công cụ cho Claude làm việc với trang Duyệt bài MXH (/admin#mxh) từ máy — xem marketing/duyet-bai/README.md.
//   node tools/mxh.js list [trangThai,...]        in danh sách bài (JSON), vd. list da-duyet,lam-lai
//   node tools/mxh.js put bai1.json [bai2.json…]  thêm / cập nhật bài (mỗi file một bài hoặc { posts: [...] })
//   node tools/mxh.js set <id> '<json>'|file.json sửa một bài: trường nội dung, trangThai, viec, noiDung, ver
//   node tools/mxh.js upload a.png b.mp4 …        tải ảnh / video, in [{ file, url, kind }]
// Cần biến MXH_TOKEN (file .env) trùng với biến MXH_TOKEN trên máy chủ; MXH_URL mặc định https://cuoinha.com.
require('../lib/env');
const fs = require('fs');
const path = require('path');

const BASE = (process.env.MXH_URL || 'https://cuoinha.com').replace(/\/$/, '');
const TOKEN = process.env.MXH_TOKEN || '';
const TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4' };
const auth = { Authorization: 'Bearer ' + TOKEN };

async function call(method, url, body) {
  const r = await fetch(BASE + url, { method, headers: { ...auth, ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${r.status} ${j.error || r.statusText}`);
  return j;
}
const readArg = (a) => (fs.existsSync(a) ? JSON.parse(fs.readFileSync(a, 'utf8')) : JSON.parse(a));

async function upload(file) {
  const ext = path.extname(file).toLowerCase(), type = TYPES[ext];
  if (!type) throw new Error('Không nhận đuôi ' + ext);
  const buf = fs.readFileSync(file);
  const kind = type.startsWith('video') ? 'video' : 'image';
  if (buf.length <= 4e6) {
    const r = await fetch(BASE + '/api/admin/mxh/file', { method: 'POST', headers: { ...auth, 'content-type': type }, body: buf });
    const j = await r.json().catch(() => ({}));
    if (r.ok) return { file, url: j.url, kind };
    if (r.status !== 413) throw new Error(`${r.status} ${j.error || ''}`);
  }
  // tệp lớn: gửi thẳng lên Vercel Blob, máy chủ chỉ cấp vé
  const { upload: up } = require('@vercel/blob/client');
  const name = 'mxh/' + path.basename(file, ext).replace(/[^\w-]/g, '-').slice(0, 60) + (ext === '.jpeg' ? '.jpg' : ext);
  const b = await up(name, buf, { access: 'public', contentType: type, handleUploadUrl: BASE + '/api/admin/mxh/upload', headers: auth, multipart: buf.length > 8e6 });
  return { file, url: b.url, kind };
}

(async () => {
  const [cmd, ...a] = process.argv.slice(2);
  if (!TOKEN && cmd) throw new Error('Thiếu MXH_TOKEN trong .env');
  let out;
  if (cmd === 'list') out = await call('GET', '/api/admin/mxh' + (a[0] ? '?trangThai=' + encodeURIComponent(a[0]) : ''));
  else if (cmd === 'put') {
    const posts = a.flatMap((f) => { const j = readArg(f); return Array.isArray(j) ? j : j.posts || [j]; });
    out = await call('PUT', '/api/admin/mxh', { posts });
  } else if (cmd === 'set') out = await call('PATCH', '/api/admin/mxh/' + encodeURIComponent(a[0]), readArg(a[1]));
  else if (cmd === 'upload') { out = []; for (const f of a) out.push(await upload(f)); }
  else { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 8).join('\n')); return; }
  console.log(JSON.stringify(out, null, 2));
})().catch((e) => { console.error('Lỗi:', e.message); process.exit(1); });
