// Dựng lại video xem trước + ảnh bìa của mẫu Video báo hỷ TikTok (public/demo/story/<id>.mp4|.jpg) ở 720×1280.
// Chạy: PORT=3999 node server.js & rồi node tools/story-previews.js public/demo/story [id-mẫu]
const { chromium } = require('playwright'); const fs = require('fs');
const out = process.argv[2], only = process.argv[3];
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); p.on('pageerror', (e) => console.log('ERR', e.message));
  await p.goto('http://localhost:3999/video', { waitUntil: 'load' });
  const ids = await p.evaluate(() => STORY_TEMPLATES.map((t) => t.id));
  for (const id of ids) {
    if (only && id !== only) continue;
    const t0 = Date.now();
    const r = await p.evaluate(async (id) => {
      const t = STORY_TEMPLATES.find((x) => x.id === id), c = storySampleCard(t.ph);
      const blob = await storyRender(c, null, t.st, t.tone, { scale: 2 / 3, bitrate: 1.8e6, noAudio: true });
      const v = blob.blob || blob;
      const jp = await storyPoster(c, t.st, t.tone, 720, 1280);
      const b64 = async (bl) => { const a = new Uint8Array(await bl.arrayBuffer()); let s = ''; for (let i = 0; i < a.length; i += 32768) s += String.fromCharCode.apply(null, a.subarray(i, i + 32768)); return btoa(s); };
      return { mp4: await b64(v), jpg: await b64(jp) };
    }, id);
    fs.writeFileSync(`${out}/${id}.mp4`, Buffer.from(r.mp4, 'base64')); fs.writeFileSync(`${out}/${id}.jpg`, Buffer.from(r.jpg, 'base64'));
    console.log(id, Math.round((Date.now() - t0) / 1000) + 's');
  }
  await b.close();
})();
