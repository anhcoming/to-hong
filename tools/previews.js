// Chụp ảnh xem trước của từng mẫu thiệp bằng Chrome headless, cùng một khung nhìn 390×693 (tỉ lệ 9:16):
//   - cover-<mẫu>-<màu>.jpg : ảnh bìa (màn hình đầu) cho MỌI bảng màu → thẻ mẫu ở trang chủ / trang mẫu
//   - scroll-<mẫu>.jpg      : ảnh dài cả trang cho bảng màu đầu → thẻ rê chuột cho ảnh trượt bằng CSS
// Hai ảnh chụp trong cùng một lần nạp trang nên khung đầu của ảnh trượt trùng khít ảnh bìa.
// Chạy lại mỗi khi thêm / sửa mẫu:  npm run previews  [-- http://localhost:3210 [chỉ-mẫu-này]]
// Cần Chrome (đặt CHROME=đường dẫn nếu không ở chỗ mặc định). Server phải đang chạy.
const fs = require('fs'), os = require('os'), path = require('path'), { spawn } = require('child_process');
const [,, BASE = 'http://localhost:3210', ONLY] = process.argv;
const W = 390, H = 693, DPR = 1.5, MAXH = 9000, QUALITY = 72, PORT = 9411;
const CANDIDATES = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
const CHROME = CANDIDATES.find((p) => fs.existsSync(p));
if (!CHROME) { console.error('Không tìm thấy Chrome — đặt biến CHROME=đường dẫn chrome.exe'); process.exit(1); }
const OUT = path.join(__dirname, '..', 'public', 'demo');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const kb = (f) => Math.round(fs.statSync(f).size / 1024) + 'KB';

(async () => {
  const meta = await (await fetch(`${BASE}/api/meta`)).json();
  const list = meta.templates.filter((t) => !ONLY || t.id === ONLY);
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'previews-'));
  const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars', `--user-data-dir=${prof}`, `--remote-debugging-port=${PORT}`, 'about:blank'], { stdio: 'ignore' });
  const done = async (code) => { try { proc.kill(); } catch (e) { /* đã tắt */ } await sleep(400); try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) { /* để hệ thống dọn */ } process.exit(code); };
  let targets;
  for (let i = 0; i < 60 && !targets; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch { await sleep(200); } }
  if (!targets) { console.error('Chrome không lên'); return done(1); }
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = {};
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; } });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  // trang vừa đổi ngữ cảnh (chuyển hướng, nạp lại) thì CDP trả lỗi → đợi rồi thử lại một lần
  const evaluate = async (expression, retry = 1) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.error || !r.result || r.result.exceptionDetails) { if (retry > 0) { await sleep(1500); return evaluate(expression, retry - 1); } throw new Error(JSON.stringify(r.error || r.result.exceptionDetails)); }
    return r.result.result.value;
  };
  const shot = async (file, height) => {
    const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: QUALITY, captureBeyondViewport: true, clip: { x: 0, y: 0, width: W, height, scale: 1 } });
    fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'));
  };
  await send('Page.enable'); await send('Runtime.enable');
  // khung nhìn cố định 390×693 cho mọi ảnh: các khối tính theo vh giống hệt nhau giữa bìa và ảnh dài
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: DPR, mobile: true });

  for (const t of list) {
    for (const [pi, p] of t.palettes.entries()) try {
      await send('Page.navigate', { url: `${BASE}/demo/${t.id}?palette=${p.id}&preview=1` });
      await sleep(2200);
      // mở sẵn mọi khối hiện dần; cuộn qua cả trang để ảnh nạp lười cũng nạp, rồi quay về đầu
      const h = await evaluate(`(async()=>{document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'));
        const H=Math.min(${MAXH},document.documentElement.scrollHeight);
        for(let y=0;y<H;y+=${H}){window.scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,60));}
        window.scrollTo({top:0,behavior:'instant'});
        await Promise.all([document.fonts.ready,...[...document.images].map(i=>i.complete?null:new Promise(r=>{i.onload=i.onerror=r;setTimeout(r,4000)}))]);
        await new Promise(r=>setTimeout(r,500));
        return Math.min(${MAXH},document.documentElement.scrollHeight);})()`);
      const cover = path.join(OUT, `cover-${t.id}-${p.id}.jpg`);
      await shot(cover, H);
      let note = `bìa ${kb(cover)}`;
      if (pi === 0) { const scroll = path.join(OUT, `scroll-${t.id}.jpg`); await shot(scroll, h); note += ` · dài ${W}x${h} ${kb(scroll)}`; }
      console.log(`✓ ${t.id} / ${p.id}: ${note}`);
    } catch (err) { console.error(`✗ ${t.id} / ${p.id}: ${err.message}`); }
  }
  // poster màn LED 16:9 cho hàng "Top 5 màn hình LED" ở trang chủ: lposter-<màu>-<hiệu ứng>.jpg (chỉ chụp riêng: tham số cuối = led)
  if (!ONLY || ONLY === 'led') {
    const TOP_LED = [['do', 'sao'], ['den', 'remphale'], ['dem', 'phaohoa'], ['tim', 'hoadang'], ['hong', 'tim']]; // cùng danh sách với public/index.html
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
    for (const [p, e] of TOP_LED) try {
      await send('Page.navigate', { url: `${BASE}/led/demo?preview=1&palette=${p}&effect=${e}` });
      await sleep(4500); // chờ font + cảnh đầu (tên cô dâu chú rể) hiện xong
      const file = path.join(OUT, `lposter-${p}-${e}.jpg`);
      const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80, clip: { x: 0, y: 0, width: 1280, height: 720, scale: 1 } });
      fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'));
      console.log(`✓ LED ${p} / ${e}: ${kb(file)}`);
    } catch (err) { console.error(`✗ LED ${p} / ${e}: ${err.message}`); }
  }
  // poster mẫu video 960×540: vposter-<mẫu>.jpg (tham số cuối = video → mọi mẫu, video:<mẫu> → một mẫu)
  // AT: giây chụp của từng mẫu (mặc định giây thứ 9 — khung ảnh đầu tiên sau thẻ chữ mở đầu)
  if (ONLY === 'video' || /^video:/.test(ONLY || '')) {
    const AT = { lichhen: 3.2, baocuoi: 3.2, saodem: 12 };
    const one = (ONLY || '').split(':')[1];
    const vt = meta.video.templates.filter((t) => t.photos && (!one || t.id === one));
    await send('Emulation.setDeviceMetricsOverride', { width: 960, height: 540, deviceScaleFactor: 1, mobile: false });
    for (const t of vt) try {
      await send('Page.navigate', { url: `${BASE}/video/demo?preview=1&template=${t.id}` });
      await sleep(3000); // chờ font + ảnh
      await evaluate(`(async()=>{await document.fonts.ready; window.__engine.pause(); window.__engine.seek(${AT[t.id] || 9}); await new Promise(r=>setTimeout(r,400)); return 1})()`);
      const file = path.join(OUT, `vposter-${t.id}.jpg`);
      const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80, clip: { x: 0, y: 0, width: 960, height: 540, scale: 1 } });
      fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'));
      console.log(`✓ video ${t.id}: ${kb(file)}`);
    } catch (err) { console.error(`✗ video ${t.id}: ${err.message}`); }
  }
  ws.close(); done(0);
})().catch((e) => { console.error(e); process.exit(1); });
