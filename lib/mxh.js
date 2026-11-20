// Duyệt bài mạng xã hội (page Facebook + kênh TikTok Cưới Nha) — trang /admin#mxh.
// Claude soạn bài (trạng thái "cho-duyet") → chủ web bấm Duyệt / Làm lại / Bỏ → Claude chỉ hẹn giờ bài "da-duyet".
// Hai vai:
//   - chủ web: phiên quản trị (cookie) — duyệt, yêu cầu làm lại, bỏ, huỷ (POST /api/admin/mxh/:id/act)
//   - Claude: phiên quản trị HOẶC khoá MXH_TOKEN (Authorization: Bearer …) — thêm / sửa bài, đổi trạng thái sau khi làm,
//     tải ảnh / video (PUT, PATCH, upload). Mọi thay đổi của Claude ghi lịch sử với ai: 'claude'.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { db, save, UPLOAD_DIR } = require('./db');
const { json, readJson, readBody, httpError, str, rid } = require('./util');

const ST = ['cho-duyet', 'lam-lai', 'dang-lam', 'da-duyet', 'da-hen-gio', 'da-dang', 'bo'];
const KENH = ['facebook', 'tiktok'];
const MEDIA = { 'image/jpeg': ['.jpg', 10e6], 'image/png': ['.png', 10e6], 'image/webp': ['.webp', 10e6], 'video/mp4': ['.mp4', 80e6] };

const list = () => (Array.isArray(db.mxh) ? db.mxh : (db.mxh = []));
const find = (id) => { const p = list().find((x) => x.id === id); if (!p) throw httpError(404, 'Không tìm thấy bài'); return p; };
const now = () => Date.now();
const hist = (p, ai, viec, noiDung) => {
  p.lichSu = Array.isArray(p.lichSu) ? p.lichSu : [];
  p.lichSu.push({ at: now(), ai, viec: str(viec, 120), ...(noiDung ? { noiDung: str(noiDung, 1000) } : {}) });
  if (p.lichSu.length > 60) p.lichSu.splice(0, p.lichSu.length - 60);
};

function tokenOk(req) {
  const t = process.env.MXH_TOKEN || '';
  const h = String(req.headers.authorization || '');
  if (t.length < 24 || !h.startsWith('Bearer ')) return false;
  const a = crypto.createHash('sha256').update(h.slice(7)).digest();
  const b = crypto.createHash('sha256').update(t).digest();
  return crypto.timingSafeEqual(a, b);
}
// chủ web (phiên quản trị) hoặc Claude (khoá MXH_TOKEN)
function needWorker(req, ctx) {
  if (ctx.admin || tokenOk(req)) return;
  throw httpError(403, 'Cần đăng nhập trang quản trị');
}

const DT = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/;
const url = (u) => { const s = str(u, 600); return /^(https:\/\/|\/uploads\/)/.test(s) ? s : ''; };
// các trường nội dung Claude được ghi; trường lạ bị bỏ qua
function clean(b) {
  const o = {};
  const s = (k, n) => { if (b[k] !== undefined) o[k] = str(b[k], n); };
  if (b.lo !== undefined) { if (!/^\d{4}-\d{2}-\d{2}$/.test(String(b.lo))) throw httpError(400, 'lo phải dạng YYYY-MM-DD'); o.lo = String(b.lo); }
  s('loTen', 60); s('loai', 40); s('nhom', 40); s('tieuDe', 160); s('nhac', 300); s('ghiChu', 400); s('binhLuanDau', 1000); s('moTaMedia', 3000); s('gopY', 1000);
  if (b.caption !== undefined) o.caption = String(b.caption ?? '').slice(0, 6000);
  if (b.stt !== undefined) o.stt = Math.max(0, Math.min(999, Math.round(+b.stt || 0)));
  for (const k of ['gio', 'gioTiktok']) if (b[k] !== undefined) { const v = String(b[k] || ''); if (v && !DT.test(v)) throw httpError(400, `${k} phải dạng YYYY-MM-DDTHH:MM`); o[k] = v; }
  if (b.kenh !== undefined) { o.kenh = [...new Set([].concat(b.kenh || []).filter((k) => KENH.includes(k)))]; if (!o.kenh.length) throw httpError(400, 'kenh phải có facebook và/hoặc tiktok'); }
  if (b.media !== undefined) o.media = [].concat(b.media || []).slice(0, 20).map((m) => ({ kind: m && m.kind === 'video' ? 'video' : 'image', url: url(m && m.url) })).filter((m) => m.url);
  for (const k of ['linkFacebook', 'linkTiktok']) if (b[k] !== undefined) o[k] = b[k] ? url(b[k]) : '';
  if (b.trangThai !== undefined) { if (!ST.includes(b.trangThai)) throw httpError(400, 'trangThai không hợp lệ'); o.trangThai = b.trangThai; }
  if (b.lanSua !== undefined) o.lanSua = Math.max(0, Math.min(99, Math.round(+b.lanSua || 0)));
  return o;
}
const view = (p) => p;

module.exports.routes = function mxhRoutes({ route, needAdmin, audit }) {
  // danh sách bài (mới nhất theo lô trước). ?trangThai=da-duyet,lam-lai để lọc
  route('GET', '/api/admin/mxh', async (req, res, ctx) => {
    needWorker(req, ctx);
    const want = String(ctx.query.get('trangThai') || '').split(',').filter(Boolean);
    const lo = ctx.query.get('lo');
    const posts = list().filter((p) => (!want.length || want.includes(p.trangThai)) && (!lo || p.lo === lo)).map(view);
    json(res, 200, { posts, waiting: list().filter((p) => p.trangThai === 'cho-duyet').length });
  });

  // Claude thêm / thay cả lô: { posts: [{ id?, lo, stt, ... }] } — bài chưa có id thì tạo mới ở trạng thái chờ duyệt
  route('PUT', '/api/admin/mxh', async (req, res, ctx) => {
    needWorker(req, ctx);
    const b = await readJson(req, 2 * 1024 * 1024);
    const items = Array.isArray(b) ? b : b && b.posts;
    if (!Array.isArray(items) || !items.length || items.length > 60) throw httpError(400, 'Gửi { posts: [...] } (1–60 bài)');
    const out = [];
    for (const it of items) {
      const f = clean(it || {});
      const id = /^[\w-]{4,40}$/.test(String(it.id || '')) ? String(it.id) : (f.lo ? `${f.lo}-${String(f.stt || 0).padStart(2, '0')}-${rid(4)}` : rid(12));
      let p = list().find((x) => x.id === id);
      if (!p) {
        if (!f.lo || !f.tieuDe) throw httpError(400, 'Bài mới cần lo và tieuDe');
        p = { id, kenh: ['facebook'], media: [], trangThai: 'cho-duyet', lanSua: 0, lichSu: [], createdAt: now() };
        list().push(p);
        Object.assign(p, f);
        hist(p, 'claude', it.viec || 'soạn bài', it.noiDung);
      } else {
        Object.assign(p, f);
        hist(p, 'claude', it.viec || 'cập nhật bài', it.noiDung);
      }
      p.updatedAt = now(); p.ver = (p.ver || 0) + 1;
      out.push(p);
    }
    save();
    json(res, 200, { posts: out });
  });

  // Claude sửa một bài / đổi trạng thái sau khi làm: { ...trường, viec, noiDung, ver? }
  route('PATCH', '/api/admin/mxh/:id', async (req, res, ctx) => {
    needWorker(req, ctx);
    const p = find(ctx.params.id);
    const b = await readJson(req, 2 * 1024 * 1024);
    if (b.ver !== undefined && +b.ver !== (p.ver || 0)) throw httpError(409, 'Bài vừa được đổi (chủ web có thể vừa bấm) — đọc lại rồi làm tiếp');
    const f = clean(b);
    if (f.trangThai === 'da-duyet' && p.trangThai !== 'da-duyet') throw httpError(403, 'Chỉ chủ web mới duyệt được bài');
    Object.assign(p, f);
    if (b.viec) hist(p, 'claude', b.viec, b.noiDung);
    p.updatedAt = now(); p.ver = (p.ver || 0) + 1;
    save();
    json(res, 200, { post: p });
  });

  // Chủ web bấm trên trang duyệt
  route('POST', '/api/admin/mxh/:id/act', async (req, res, ctx) => {
    needAdmin(ctx);
    const p = find(ctx.params.id);
    const { act, gopY } = await readJson(req);
    const s = p.trangThai || 'cho-duyet';
    if (act === 'duyet') {
      if (s !== 'cho-duyet') throw httpError(409, 'Bài này không ở trạng thái chờ duyệt');
      p.trangThai = 'da-duyet'; hist(p, 'anh', 'duyệt');
    } else if (act === 'bo') {
      if (s !== 'cho-duyet') throw httpError(409, 'Chỉ bỏ được bài đang chờ duyệt');
      p.trangThai = 'bo'; hist(p, 'anh', 'bỏ bài');
    } else if (act === 'lam-lai') {
      const g = str(gopY, 1000);
      if (!g) throw httpError(400, 'Ghi góp ý để Claude biết sửa gì');
      if (!['cho-duyet', 'da-duyet', 'da-hen-gio', 'da-dang'].includes(s)) throw httpError(409, 'Bài này đang được làm lại');
      p.truocKhiSua = s; p.gopY = g; p.trangThai = 'lam-lai';
      hist(p, 'anh', s === 'cho-duyet' ? 'yêu cầu làm lại' : 'yêu cầu sửa bài đã ' + ({ 'da-duyet': 'duyệt', 'da-hen-gio': 'hẹn giờ', 'da-dang': 'đăng' }[s]), g);
    } else if (act === 'huy') {
      if (s === 'da-duyet') { p.trangThai = 'cho-duyet'; hist(p, 'anh', 'huỷ duyệt'); }
      else if (s === 'bo') { p.trangThai = 'cho-duyet'; hist(p, 'anh', 'lấy lại bài'); }
      else if (s === 'lam-lai') { p.trangThai = p.truocKhiSua && p.truocKhiSua !== 'lam-lai' ? p.truocKhiSua : 'cho-duyet'; hist(p, 'anh', 'rút lại yêu cầu sửa'); }
      else throw httpError(409, 'Không có gì để huỷ');
    } else throw httpError(400, 'Thao tác không hợp lệ');
    p.updatedAt = now(); p.ver = (p.ver || 0) + 1;
    if (audit) audit(ctx, 'Duyệt bài MXH', p.tieuDe, act);
    save();
    json(res, 200, { post: p });
  });

  // Xoá hẳn một bài (chủ web)
  route('DELETE', '/api/admin/mxh/:id', async (req, res, ctx) => {
    needAdmin(ctx);
    const i = list().findIndex((x) => x.id === ctx.params.id);
    if (i < 0) throw httpError(404, 'Không tìm thấy bài');
    const [p] = list().splice(i, 1);
    if (audit) audit(ctx, 'Xoá bài MXH', p.tieuDe);
    save();
    json(res, 200, { ok: true });
  });

  // Ảnh / video gửi thẳng lên Vercel Blob (tệp lớn): máy chủ chỉ cấp vé, tên tệp phải là mxh/<tên>.<đuôi>
  route('POST', '/api/admin/mxh/upload', async (req, res, ctx) => {
    needWorker(req, ctx);
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw httpError(501, 'Chưa cấu hình kho lưu trữ — dùng /api/admin/mxh/file');
    const body = await readJson(req);
    if (!body || body.type !== 'blob.generate-client-token') throw httpError(400, 'Yêu cầu không hợp lệ');
    const { handleUpload } = require('@vercel/blob/client');
    const out = await handleUpload({
      body, request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^mxh\/[\w-]{1,80}\.(jpg|png|webp|mp4)$/.test(pathname)) throw httpError(400, 'Tên tệp không hợp lệ');
        const vid = pathname.endsWith('.mp4');
        return { allowedContentTypes: vid ? ['video/mp4'] : ['image/jpeg', 'image/png', 'image/webp'], maximumSizeInBytes: vid ? 80e6 : 10e6, addRandomSuffix: true };
      },
    });
    json(res, 200, out);
  });

  // Tệp nhỏ gửi qua máy chủ (chạy máy riêng, hoặc ảnh < 4MB trên Vercel)
  route('POST', '/api/admin/mxh/file', async (req, res, ctx) => {
    needWorker(req, ctx);
    const type = String(req.headers['content-type'] || '').split(';')[0].trim();
    const t = MEDIA[type];
    if (!t) throw httpError(415, 'Chỉ nhận JPG, PNG, WEBP hoặc MP4');
    const buf = await readBody(req, t[1]);
    if (!buf.length) throw httpError(400, 'Tệp rỗng');
    const name = `mxh-${rid(12)}${t[0]}`;
    let u;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = require('@vercel/blob');
      u = (await put(`mxh/${name}`, buf, { access: 'public', contentType: type, addRandomSuffix: false })).url;
    } else {
      fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
      u = `/uploads/${name}`;
    }
    json(res, 200, { url: u, kind: type.startsWith('video') ? 'video' : 'image' });
  });
};
