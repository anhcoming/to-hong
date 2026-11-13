// Nhập mẫu thiệp từ mehappy.vn (trang dựng bằng trình kéo thả: mọi phần tử đặt toạ độ tuyệt đối trên khung ~400px).
// Mỗi mẫu có JSON bố cục công khai tại /api/v2/public/templates/<id>; tool này tải JSON + ảnh + font về,
// đổi link ảnh sang /demo/mh-<slug>-<n>.<ext>, ghi templates/mh/<slug>.json và sinh templates/<slug>.js
// (mẫu chạy bằng máy dựng chung lib/mh.js, nhận dữ liệu thiệp như mọi mẫu khác).
//   node tools/mehappy-import.js <id>:<slug> [<id>:<slug> ...]        (vd. 145:mhhb04)
//   node tools/mehappy-import.js --all                                 (20 mẫu trong DEFAULTS)
// Sau khi nhập: thêm `<slug>: require('../templates/<slug>')` vào `templates` trong lib/render.js (tool tự làm nếu chưa có),
// chạy `node test/smoke.js`, rồi `npm run previews` để chụp ảnh bìa.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const DEMO = path.join(ROOT, 'public', 'demo');
const FONTS = path.join(DEMO, 'fonts');
const TPLJSON = path.join(ROOT, 'templates', 'mh');
const API = 'https://mehappy.vn/api/v2/public/templates/';
// 20 mẫu cưới được xem nhiều nhất (gộp các gói Basic/Pro/VIP của cùng một thiết kế, lấy bản VIP vì đủ khối nhất)
const DEFAULTS = {
  145: 'mhhb04', 24: 'mhda05', 45: 'mhhb02', 69: 'mhradiant', 81: 'mhna01', 117: 'mh2m05', 2: 'mhat01', 3: 'mhtd03', 71: 'mhbustle', 70: 'mhnc11',
  133: 'mhda01', 181: 'mhredflow', 67: 'mhpasiona', 128: 'mhds03', 28: 'mhda04', 18: 'mhflowers', 65: 'mhsleazy', 135: 'mhmn01', 125: 'mhds01', 89: 'mhna02',
};
const args = process.argv.slice(2);
const jobs = args.includes('--all') ? Object.entries(DEFAULTS) : args.map((a) => a.split(':'));
if (!jobs.length) { console.error('node tools/mehappy-import.js <id>:<slug> ... | --all'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const magic = (b) => {
  if (b.length < 12) return null;
  if (b[0] === 0x89 && b[1] === 0x50) return 'png';
  if (b[0] === 0xff && b[1] === 0xd8) return 'jpg';
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (b.toString('ascii', 0, 3) === 'GIF') return 'gif';
  const head = b.toString('utf8', 0, 300).trim().toLowerCase();
  if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) return 'svg';
  if (b.toString('ascii', 0, 4) === 'OTTO') return 'otf';
  if (b[0] === 0 && b[1] === 1 && b[2] === 0 && b[3] === 0) return 'ttf';
  if (b.toString('ascii', 0, 4) === 'wOFF') return 'woff';
  if (b.toString('ascii', 0, 4) === 'wOF2') return 'woff2';
  if (b.toString('ascii', 0, 4) === 'true') return 'ttf';
  if (b.toString('ascii', 0, 3) === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return 'mp3';
  return null;
};
async function fetchBytes(u) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0', referer: 'https://mehappy.vn/' } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) { if (i === 2) throw e; await sleep(600); }
  }
}
const isAsset = (v) => typeof v === 'string' && /^https?:\/\/[^\s"'<>]+\.(png|jpe?g|webp|gif|svg|mp3|ttf|otf|woff2?)(\?.*)?$/i.test(v);
// gom mọi link ảnh/âm thanh trong JSON (kể cả trong svgCode/htmlContent thì bỏ — svg nội tuyến không cần tải)
function collect(node, out, keyPath = '') {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((x) => collect(x, out, keyPath)); return; }
  for (const k of Object.keys(node)) {
    const v = node[k];
    if (k === 'svgCode' || k === 'htmlContent' || k === 'triggerIcon') continue;
    if (isAsset(v)) out.add(v);
    else if (v && typeof v === 'object') collect(v, out, keyPath + '.' + k);
  }
}
function rewrite(node, map) {
  if (!node || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map((x) => rewrite(x, map));
  const o = {};
  for (const k of Object.keys(node)) {
    const v = node[k];
    o[k] = typeof v === 'string' && map.has(v) ? map.get(v) : rewrite(v, map);
  }
  return o;
}
const safe = (s) => s.replace(/[^\w.-]+/g, '_');

async function importOne(id, slug) {
  fs.mkdirSync(TPLJSON, { recursive: true }); fs.mkdirSync(FONTS, { recursive: true });
  const j = await (await fetch(API + id)).json();
  const t = j.data.template, content = j.data.content;
  const mobile = content.mobile || content.desktop;
  const urls = new Set();
  collect(mobile, urls);
  const oe = t.openingEffect || {};
  ['mobileLeftPanelImage', 'mobileRightPanelImage', 'leftPanelImage', 'rightPanelImage'].forEach((k) => { if (isAsset(oe[k])) urls.add(oe[k]); });
  const map = new Map();
  let n = 0, bytes = 0, skipped = 0;
  for (const u of urls) {
    let b; try { b = await fetchBytes(u); } catch (e) { console.warn(`  ✗ ${u.slice(0, 80)}: ${e.message}`); skipped++; continue; }
    const ext = magic(b);
    if (!ext || ['ttf', 'otf', 'woff', 'woff2'].includes(ext) && false) { console.warn(`  ✗ không phải ảnh: ${u.slice(0, 80)}`); skipped++; continue; }
    const file = `mh-${slug}-${++n}.${ext}`;
    fs.writeFileSync(path.join(DEMO, file), b); bytes += b.length;
    map.set(u, '/demo/' + file);
  }
  // font: dùng chung giữa các mẫu, đặt tên theo tên file gốc trong fontMap
  const fontMap = {};
  for (const [name, u] of Object.entries(t.fontMap || {})) {
    if (!/^https?:/.test(u)) continue;
    const file = 'mh-' + safe(name.replace(/\.(ttf|otf|woff2?)$/i, '')) + path.extname(new URL(u).pathname).toLowerCase();
    const dest = path.join(FONTS, file);
    if (!fs.existsSync(dest)) {
      let b; try { b = await fetchBytes(u); } catch (e) { console.warn(`  ✗ font ${name}: ${e.message}`); continue; }
      if (!['ttf', 'otf', 'woff', 'woff2'].includes(magic(b))) { console.warn(`  ✗ font không hợp lệ: ${name}`); continue; }
      fs.writeFileSync(dest, b); bytes += b.length;
    }
    fontMap[name] = '/demo/fonts/' + file;
  }
  const opening = oe && oe.enabled ? rewrite({ renderer: oe.renderer, direction: oe.direction, duration: oe.duration, mobileLeftPanelImage: oe.mobileLeftPanelImage, mobileRightPanelImage: oe.mobileRightPanelImage }, map) : null;
  const out = {
    source: { id: +id, name: t.name, tier: t.tier, tags: t.tags || [], url: `https://mehappy.vn/view/template/${id}`, importedAt: new Date().toISOString().slice(0, 10) },
    page: { width: (t.pageSettings && t.pageSettings.mobileWidth) || '400px', bg: (t.pageSettings && t.pageSettings.mobilePageBackgroundColor) || '#ffffff', mobileOnly: !!(t.pageSettings && t.pageSettings.mobileOnly) },
    opening, fontMap,
    sections: rewrite(mobile.sections, map),
  };
  fs.writeFileSync(path.join(TPLJSON, slug + '.json'), JSON.stringify(out));
  // module mẫu: chỉ là lớp mỏng quanh lib/mh.js
  const modFile = path.join(ROOT, 'templates', slug + '.js');
  if (!fs.existsSync(modFile)) {
    fs.writeFileSync(modFile, `// Mẫu nhập từ mehappy.vn (${t.name}, ${out.source.url}) bằng tools/mehappy-import.js — bố cục ở templates/mh/${slug}.json,
// dựng bằng máy dựng chung lib/mh.js. Ảnh/font là của bản gốc: chỉ dùng công khai khi đã thay bằng tài sản của mình.
module.exports = require('../lib/mh').template({
  id: '${slug}',
  name: ${JSON.stringify(t.name.replace(/^Giao [Dd]iện (thiệp cưới |Thiệp cưới |Thiệp Cưới |Thiệp Mời )?/, '').replace(/\s*-\s*(Gói )?(BASIC|Basic|PRO|VIP)$/i, '').trim())},
  json: require('./mh/${slug}.json'),
});
`);
  }
  // đăng ký vào lib/render.js
  const rp = path.join(ROOT, 'lib', 'render.js');
  let r = fs.readFileSync(rp, 'utf8');
  if (!r.includes(`${slug}: require('../templates/${slug}')`)) {
    const m = r.match(/const templates = \{([\s\S]*?)\n\};/);
    if (!m) throw new Error('không tìm thấy `const templates = {` trong lib/render.js');
    r = r.replace(m[0], `const templates = {${m[1]}\n  ${slug}: require('../templates/${slug}'),\n};`);
    fs.writeFileSync(rp, r);
  }
  console.log(`✓ ${slug} (${t.name}): ${out.sections.length} khối, ${n} ảnh${skipped ? ` (${skipped} lỗi)` : ''}, ${Object.keys(fontMap).length} font, ${Math.round(bytes / 1024)}KB`);
}

(async () => {
  for (const [id, slug] of jobs) {
    try { await importOne(id, slug); } catch (e) { console.error(`✗ ${id}:${slug}: ${e.message}`); }
  }
})();
