// Lời mời tự đặt phải hiện trên mọi mẫu; lời mời mặc định thì mẫu giữ chữ mời của mẫu (thiệp cũ không đổi giao diện)
const assert = require('assert');
process.env.DATA_DIR = require('fs').mkdtempSync(require('path').join(require('os').tmpdir(), 'thiep-inv-'));
const { renderCard, templates } = require('../lib/render');
const cd = require('../lib/carddata');

const text = (html) => html.replace(/<head[\s\S]*?<\/head>|<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').normalize('NFC').toLowerCase().replace(/\s+/g, ' ');
const render = (id, inviteText) => text(renderCard({
  id: 'x', slug: 's', template: id, paid: true, status: 'published', createdAt: Date.now(),
  data: cd.normalize({ ...cd.defaults(), groom: { name: 'An' }, bride: { name: 'Bình' }, date: '2026-12-20', inviteText }),
}, { guest: { name: 'Chú Tư', code: 'abc' } }));

const missing = Object.keys(templates).filter((id) => !render(id, 'Kính mời gia đình').includes('kính mời gia đình'));
assert.deepEqual(missing, [], 'lời mời tự đặt không hiện ở: ' + missing.join(', '));
for (const id of ['dodam', 'songhy', 'longphung']) assert.ok(render(id, cd.DEFAULT_INVITE).includes('thân mời'), `${id}: lời mời mặc định giữ chữ "Thân mời" của mẫu`);
console.log(`✓ Lời mời tự đặt hiện trên cả ${Object.keys(templates).length} mẫu`);
