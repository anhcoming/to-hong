// Chụp ảnh một trang bằng Chrome headless (dùng khi dựng mẫu thiệp để tự kiểm tra giao diện).
// node tools/snap.js <url> <out.png> [width=390] [height=0: cả trang] [port=9400]
// - height = 0: chụp toàn bộ chiều dài trang (tối đa 12000px), các khối .reveal được hiện sẵn.
// - Mỗi người chạy song song dùng một port riêng.
const fs = require('fs'), os = require('os'), path = require('path'), { spawn } = require('child_process');
const [,, url, out, W = '390', H = '0', PORT = '9400'] = process.argv;
if (!url || !out) { console.error('node tools/snap.js <url> <out.png> [width] [height] [port]'); process.exit(1); }
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-'));
const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', `--user-data-dir=${prof}`, '--hide-scrollbars', `--remote-debugging-port=${PORT}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const done = async (code) => { try { proc.kill(); } catch (e) { /* đã tắt */ } await sleep(400); try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) { /* Chrome còn ghi dở: để hệ thống tự dọn */ } process.exit(code); };
(async () => {
  let targets;
  for (let i = 0; i < 60; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); break; } catch { await sleep(200); } }
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = {};
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; } });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');
  const w = +W, h = +H;
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h || 844, deviceScaleFactor: w <= 500 ? 2 : 1, mobile: w <= 500 });
  await send('Page.navigate', { url });
  await sleep(3500);
  // hiện sẵn mọi khối chờ cuộn tới, rồi đo chiều dài trang
  const r = await send('Runtime.evaluate', { expression: "document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'));Math.min(12000,document.documentElement.scrollHeight)", returnByValue: true });
  await sleep(900);
  const fullH = h || r.result.result.value;
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !h, clip: { x: 0, y: 0, width: w, height: fullH, scale: 1 } });
  fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
  console.log('saved', out, `${w}x${fullH}`);
  ws.close(); done(0);
})().catch((e) => { console.error(e); done(1); });
