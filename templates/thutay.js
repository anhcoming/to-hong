// Mẫu "Thư Tay" — nền giấy kem, phong bì mở có dấu sáp, ảnh polaroid nhô ra, "Save the date".
const { esc } = require('../lib/util');
const { sprig } = require('./_orn');

const base = {
  '--font-title': "'Cormorant Garamond',Georgia,serif",
  '--font-script': "'Great Vibes',cursive",
  '--font-body': "'Hanken Grotesk',system-ui,sans-serif",
};
const pal = (id, name, accent, deep, gold, extra = {}) => ({
  id, name, swatch: ['#f5efe4', accent],
  vars: { ...base, '--page': '#e7dfd1', '--bg': '#f7f2e9', '--paper': '#fffcf6', '--ink': '#2f2724', '--muted': '#867a70', '--accent': accent, '--accent-deep': deep, '--accent-ink': '#fffcf6', '--gold': gold, '--line': '#e7ddcd', ...extra },
});

module.exports = {
  id: 'thutay',
  name: 'Thư Tay',
  group: 'toigian',
  desc: 'Giấy kem, phong bì dấu sáp và ảnh polaroid — lãng mạn kiểu thư tay',
  fonts: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Great+Vibes&family=Hanken+Grotesk:wght@300..700&display=swap',
  palettes: [
    pal('do-do', 'Đỏ đô', '#7b1e2b', '#5c1420', '#b8935a'),
    pal('nau', 'Nâu trầm', '#6e4a35', '#523424', '#b79a6d'),
    pal('reu', 'Xanh rêu', '#4d5e3e', '#38462c', '#ab9a69'),
    pal('lam', 'Lam đậm', '#24385f', '#182745', '#b39b6a'),
  ],

  title(text, sub) {
    return `<div class="tt-title">${sub ? `<p class="tt-sub">${esc(sub)}</p>` : ''}<h2 class="sec-title">${esc(text)}</h2><span class="tt-rule">♥</span></div>`;
  },

  opener(ctx) {
    return `
<div class="opener tt-opener" id="opener">
  <div class="tt-o-wrap">
    <p class="tt-o-k">Save the Date</p>
    <div class="tt-o-env">
      <i class="tt-o-flap"></i>
      <button class="tt-seal tt-o-seal" id="openBtn" aria-label="Mở thiệp">${esc(ctx.initials)}</button>
    </div>
    ${ctx.guest ? `<p class="tt-o-to">Gửi <b>${esc(ctx.guest.name)}</b></p>` : `<p class="tt-o-to"><b>${esc(ctx.g)} &amp; ${esc(ctx.b)}</b></p>`}
    <p class="tt-o-hint">Chạm dấu sáp để mở thư</p>
  </div>
</div>`;
  },

  cover(ctx) {
    const photo = ctx.d.cover || ctx.d.photos[0] || '';
    return `
<header class="tt-cover">
  <p class="tt-std">Save the Date</p>
  <div class="tt-scene">
    ${sprig('tt-sprig l')}${sprig('tt-sprig r')}
    <div class="tt-back"></div>
    <div class="tt-photo${photo ? '' : ' empty'}"><div${photo ? ` style="background-image:url('${esc(photo)}')"` : ''}>${photo ? '' : '♥'}</div></div>
    <div class="tt-front"></div>
    <span class="tt-seal">♥</span>
  </div>
  <h1 class="tt-names"><span>${esc(ctx.g)}</span><em>&amp;</em><span>${esc(ctx.b)}</span></h1>
  ${ctx.dateBlock('line')}
</header>`;
  },

  css: `
.tpl-thutay{--paper-tex:repeating-linear-gradient(0deg,rgba(120,90,60,.025) 0 1px,transparent 1px 4px)}
.tpl-thutay .card{background:var(--paper-tex),var(--bg)}
.tpl-thutay .tt-cover{position:relative;min-height:100svh;padding:44px 20px 48px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--paper-tex),radial-gradient(circle at 50% 35%,var(--paper),var(--bg) 70%)}
.tpl-thutay .tt-std{margin:0 0 18px;font-family:var(--font-title);font-size:13px;letter-spacing:.42em;text-transform:uppercase;color:var(--muted)}
.tpl-thutay .tt-scene{position:relative;width:280px;height:300px;margin-bottom:22px}
.tpl-thutay .tt-sprig{position:absolute;width:66px;bottom:78px;z-index:0}
.tpl-thutay .tt-sprig.l{left:-14px;transform:rotate(-22deg)}
.tpl-thutay .tt-sprig.r{right:-14px;transform:scaleX(-1) rotate(-22deg)}
.tpl-thutay .tt-back{position:absolute;left:10px;right:10px;bottom:0;height:150px;background:var(--accent-deep);border-radius:4px}
.tpl-thutay .tt-photo{position:absolute;left:50%;bottom:62px;width:170px;padding:10px 10px 34px;background:#fff;box-shadow:0 10px 24px rgba(40,25,15,.22);transform:translateX(-50%) rotate(-5deg);z-index:1;animation:ttRise 1.4s .3s both cubic-bezier(.2,.8,.2,1)}
.tpl-thutay .tt-photo>div{aspect-ratio:4/5;background:var(--line) center/cover no-repeat;display:grid;place-items:center;color:var(--accent);font-size:44px}
@keyframes ttRise{from{bottom:10px;opacity:.4}}
.tpl-thutay .tt-front{position:absolute;left:10px;right:10px;bottom:0;height:150px;z-index:2;background:linear-gradient(160deg,color-mix(in srgb,var(--accent) 88%,#fff),var(--accent));clip-path:polygon(0 0,50% 46%,100% 0,100% 100%,0 100%);border-radius:0 0 4px 4px;box-shadow:inset 0 -20px 30px rgba(0,0,0,.12)}
.tt-seal{display:grid;place-items:center;width:58px;height:58px;border-radius:50%;border:0;color:color-mix(in srgb,var(--gold) 70%,#fff);font-family:var(--font-title);font-size:22px;font-weight:600;background:radial-gradient(circle at 36% 32%,color-mix(in srgb,var(--gold) 80%,#fff),var(--gold) 45%,color-mix(in srgb,var(--gold) 60%,#000));box-shadow:0 0 0 4px color-mix(in srgb,var(--gold) 55%,transparent),0 6px 14px rgba(0,0,0,.3);color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.35)}
.tpl-thutay .tt-scene .tt-seal{position:absolute;left:50%;bottom:76px;transform:translate(-50%,50%);z-index:3}
.tpl-thutay .tt-names{margin:0;font-family:var(--font-title);font-weight:400;font-size:44px;line-height:1.1;color:var(--accent)}
.tpl-thutay .tt-names span{display:block}
.tpl-thutay .tt-names em{display:block;font-family:var(--font-script);font-style:normal;font-size:38px;color:var(--gold);line-height:1;margin:2px 0}
.tpl-thutay .tt-title{margin-bottom:26px}
.tpl-thutay .tt-title .sec-title{margin:0;font-weight:500;font-size:34px}
.tpl-thutay .tt-sub{margin:0;font-family:var(--font-script);font-size:26px;color:var(--gold);line-height:1.1}
.tpl-thutay .tt-rule{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px;color:var(--accent);font-size:12px}
.tpl-thutay .tt-rule::before,.tpl-thutay .tt-rule::after{content:"";width:46px;height:1px;background:var(--gold)}
.tpl-thutay .guest-name{font-family:var(--font-script);font-size:42px}
.tpl-thutay .couple-full .full{font-size:22px}
.tpl-thutay .btn{border-radius:2px;letter-spacing:.12em;text-transform:uppercase;font-size:12px}
.tpl-thutay .ph{border-radius:2px;border:6px solid #fff;box-shadow:0 6px 16px rgba(40,25,15,.15)}
.tpl-thutay .ph:nth-child(odd){transform:rotate(-1.5deg)}.tpl-thutay .ph:nth-child(even){transform:rotate(1.5deg)}
.tpl-thutay .s-cal,.tpl-thutay .s-thanks{background:var(--accent);color:var(--accent-ink);--cal-hi:var(--gold)}
.tpl-thutay .s-cal .sec-title,.tpl-thutay .s-thanks .thanks-big{color:var(--accent-ink)}
.tpl-thutay .s-cal .tt-rule{color:var(--gold)}
.tpl-thutay .thanks-big{font-family:var(--font-script);font-size:56px;font-weight:400}
.tpl-thutay .s-thanks p,.tpl-thutay .s-thanks .thanks-names{color:var(--accent-ink)!important}

.tt-opener{background:radial-gradient(circle at 50% 40%,var(--paper),var(--page))}
.tt-opener .tt-o-wrap{text-align:center;color:var(--ink)}
.tt-opener .tt-o-k{margin:0 0 18px;font-family:var(--font-title);font-size:13px;letter-spacing:.42em;text-transform:uppercase;color:var(--muted)}
.tt-opener .tt-o-env{position:relative;width:min(320px,84vw);aspect-ratio:16/10;margin:0 auto;background:linear-gradient(170deg,color-mix(in srgb,var(--accent) 88%,#fff),var(--accent));border-radius:6px;box-shadow:0 26px 50px rgba(40,20,10,.3)}
.tt-opener .tt-o-flap{position:absolute;inset:0 0 auto;height:62%;background:var(--accent-deep);clip-path:polygon(0 0,100% 0,50% 100%);border-radius:6px 6px 0 0}
.tt-opener .tt-o-seal{position:absolute;left:50%;top:62%;transform:translate(-50%,-50%);width:70px;height:70px;cursor:pointer;animation:ttPulse 1.8s ease-in-out infinite}
@keyframes ttPulse{50%{transform:translate(-50%,-50%) scale(1.07)}}
.tt-opener .tt-o-to{margin:22px 0 2px;font-family:var(--font-title);font-size:22px}
.tt-opener .tt-o-to b{font-weight:600;color:var(--accent)}
.tt-opener .tt-o-hint{margin:0;font-size:12px;color:var(--muted)}
`,
};
