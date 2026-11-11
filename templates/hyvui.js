// Mẫu "Hỷ Vui" — dễ thương: nền đỏ son, chữ 囍 mờ lớn, minh hoạ cô dâu chú rể tự vẽ (SVG phẳng),
// phần nội dung là một tấm "vé mời" màu kem có khấc tròn hai bên giữa các khối.
const { esc } = require('../lib/util');

const base = {
  '--font-title': "'Be Vietnam Pro',system-ui,sans-serif",
  '--font-script': "'Dancing Script',cursive",
  '--font-body': "'Be Vietnam Pro',system-ui,sans-serif",
};

const evList = (d) => d.events.filter((e) => e.name || e.place);
function partyEvent(d) {
  const evs = evList(d);
  return evs.find((e) => /khai tiệc|tiệc cưới|tiệc mừng/i.test(e.name)) || evs.find((e) => /tiệc/i.test(e.name)) || evs[evs.length - 1] || null;
}
function ceremonyEvent(d, party) {
  const evs = evList(d);
  return evs.find((e) => /thành hôn/i.test(e.name)) || evs.find((e) => e !== party) || null;
}
const clock = (t) => (t ? `${+t.split(':')[0]}:${t.split(':')[1]}` : '');
const hourText = (t) => (t ? `${+t.split(':')[0]} giờ ${t.split(':')[1]}` : '');

// chữ 囍 dựng bằng khối (không phụ thuộc font chữ Hán trên máy khách)
const HY = (cls = '') => `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true"><g fill="currentColor"><rect x="4" y="6" width="92" height="6"/><rect x="22" y="1" width="6" height="22"/><rect x="72" y="1" width="6" height="22"/><rect x="12" y="17" width="26" height="5"/><rect x="62" y="17" width="26" height="5"/><path d="M14 45h6l4 8h-6zM36 45h-6l-4 8h6zM64 45h6l4 8h-6zM86 45h-6l-4 8h6z"/><rect x="4" y="56" width="92" height="6"/></g><g fill="none" stroke="currentColor" stroke-width="5"><rect x="13.5" y="28.5" width="23" height="12"/><rect x="63.5" y="28.5" width="23" height="12"/><rect x="13.5" y="68.5" width="23" height="23"/><rect x="63.5" y="68.5" width="23" height="23"/></g></svg>`;

const HEART = '<path d="M12 21s-7.5-4.6-10-9.3C.3 8.3 2.2 4 6.3 4c2.3 0 3.9 1.3 5.7 3.4C13.8 5.3 15.4 4 17.7 4 21.8 4 23.7 8.3 22 11.7 19.5 16.4 12 21 12 21z"/>';

// minh hoạ cô dâu chú rể (phẳng, má hồng, mắt cười) — tự vẽ
const SKIN = '#f8dcc8', HAIR = '#2b211f', SUIT = '#2c2c3a', SUIT2 = '#3b3b4e';
const COUPLE = `<svg class="hv-cpl" viewBox="0 0 300 360" role="img" aria-label="Minh hoạ cô dâu chú rể">
  <ellipse cx="150" cy="346" rx="128" ry="9" fill="rgba(0,0,0,.14)"/>
  <g class="hv-bride">
    <path d="M84 90 Q34 150 30 312 Q58 292 76 250 Q88 186 98 120 Z" fill="#fff" opacity=".5"/>
    <path d="M66 124 Q64 86 100 86 Q136 86 134 124 L134 160 Q120 166 112 156 L88 156 Q80 166 66 160 Z" fill="${HAIR}"/>
    <rect x="95" y="146" width="10" height="16" fill="${SKIN}"/>
    <path d="M80 170 Q100 158 120 170 L118 182 L82 182 Z" fill="${SKIN}"/>
    <path d="M83 172 Q68 196 72 222" fill="none" stroke="${SKIN}" stroke-width="9" stroke-linecap="round"/>
    <path d="M117 172 Q132 196 147 213" fill="none" stroke="${SKIN}" stroke-width="9" stroke-linecap="round"/>
    <path d="M78 210 L122 210 Q150 262 168 334 Q140 347 100 347 Q58 347 30 334 Q50 262 78 210 Z" fill="#fff" stroke="#eadbd3" stroke-width="1.5"/>
    <path d="M93 222 Q86 282 74 342M108 222 Q116 282 130 342M100 224 L100 344" fill="none" stroke="#efe3dc" stroke-width="2"/>
    <path d="M82 176 Q100 186 118 176 L122 214 L78 214 Z" fill="#fff" stroke="#eadbd3" stroke-width="1.5"/>
    <rect x="78" y="207" width="44" height="7" rx="3.5" fill="var(--hv-ribbon)"/>
    <circle cx="100" cy="122" r="30" fill="${SKIN}"/>
    <path d="M70 120 Q72 90 100 90 Q128 90 130 120 Q118 104 102 106 Q88 100 72 122 Z" fill="${HAIR}"/>
    <circle cx="84" cy="88" r="11" fill="${HAIR}"/>
    <circle cx="94" cy="86" r="4" fill="#fff"/><circle cx="100" cy="89" r="3.2" fill="var(--hv-ribbon)"/>
    <path d="M86 126q5-5 10 0M104 126q5-5 10 0" fill="none" stroke="${HAIR}" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse cx="84" cy="135" rx="6" ry="3.5" fill="#f3a2a2" opacity=".75"/><ellipse cx="116" cy="135" rx="6" ry="3.5" fill="#f3a2a2" opacity=".75"/>
    <path d="M94 138 Q100 146 106 138 Z" fill="#d9606a"/>
    <g class="hv-bq"><ellipse cx="60" cy="238" rx="9" ry="4" fill="#7fae7a" transform="rotate(-30 60 238)"/><ellipse cx="82" cy="240" rx="9" ry="4" fill="#7fae7a" transform="rotate(30 82 240)"/>
    <circle cx="64" cy="226" r="8" fill="var(--hv-ribbon)"/><circle cx="78" cy="223" r="7.5" fill="#fff"/><circle cx="71" cy="234" r="7" fill="#f6b8c0"/><circle cx="71" cy="218" r="5" fill="#fff4f0"/>
    <path d="M71 240 l-5 16M71 240 l5 15" stroke="var(--hv-ribbon)" stroke-width="2.4" stroke-linecap="round"/></g>
  </g>
  <g class="hv-groom">
    <path d="M181 262 L178 334 L193 334 L197 282 L201 334 L215 334 L212 262 Z" fill="${SUIT}"/>
    <ellipse cx="184" cy="337" rx="11" ry="5" fill="#15151c"/><ellipse cx="210" cy="337" rx="11" ry="5" fill="#15151c"/>
    <path d="M172 176 Q160 200 151 214" fill="none" stroke="${SUIT}" stroke-width="13" stroke-linecap="round"/>
    <path d="M220 176 Q233 206 229 236" fill="none" stroke="${SUIT}" stroke-width="13" stroke-linecap="round"/>
    <circle cx="149" cy="216" r="6.5" fill="${SKIN}"/><circle cx="229" cy="241" r="6.5" fill="${SKIN}"/>
    <rect x="190" y="148" width="12" height="18" fill="${SKIN}"/>
    <path d="M170 170 Q196 158 222 170 L226 268 Q196 274 166 268 Z" fill="${SUIT}"/>
    <path d="M186 165 L196 208 L206 165 Z" fill="#fff"/>
    <path d="M186 165 L196 208 L178 186 Z M206 165 L196 208 L214 186 Z" fill="${SUIT2}"/>
    <path d="M188 168 L196 172 L188 176 Z M204 168 L196 172 L204 176 Z" fill="var(--hv-tie)"/><circle cx="196" cy="172" r="2.4" fill="var(--hv-tie)"/>
    <circle cx="196" cy="222" r="2" fill="#15151c"/><circle cx="196" cy="238" r="2" fill="#15151c"/>
    <circle cx="214" cy="188" r="4.2" fill="#fff"/><circle cx="214" cy="188" r="1.6" fill="var(--hv-ribbon)"/>
    <circle cx="165" cy="128" r="6" fill="${SKIN}"/><circle cx="227" cy="128" r="6" fill="${SKIN}"/>
    <circle cx="196" cy="124" r="31" fill="${SKIN}"/>
    <path d="M164 122 Q160 84 198 86 Q232 86 228 122 Q224 108 214 104 Q204 112 186 108 Q172 112 166 126 Z" fill="${HAIR}"/>
    <path d="M184 92 Q200 74 216 92 Z" fill="${HAIR}"/>
    <path d="M180 128q5-5 10 0M202 128q5-5 10 0" fill="none" stroke="${HAIR}" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse cx="178" cy="138" rx="6" ry="3.5" fill="#f3a2a2" opacity=".75"/><ellipse cx="214" cy="138" rx="6" ry="3.5" fill="#f3a2a2" opacity=".75"/>
    <path d="M190 140 Q196 149 202 140 Z" fill="#c9505a"/>
  </g>
  <g class="hv-hrt"><svg x="136" y="44" width="26" height="26" viewBox="0 0 24 24"><g fill="var(--hv-heart)">${HEART}</g></svg></g>
</svg>`;

// hộp quà tròn có nơ
const GIFT = `<svg class="hv-giftbox" viewBox="0 0 160 150" aria-hidden="true">
  <ellipse cx="80" cy="138" rx="58" ry="8" fill="rgba(0,0,0,.08)"/>
  <path d="M26 64 L26 120 Q80 146 134 120 L134 64 Z" fill="var(--hv-box)"/>
  <ellipse cx="80" cy="64" rx="54" ry="16" fill="var(--hv-box2)"/>
  <path d="M70 50 L70 136 L90 136 L90 50 Z" fill="var(--hv-ribbon)" opacity=".9"/>
  <path d="M80 50 Q52 20 46 40 Q44 56 80 56 Q116 56 114 40 Q108 20 80 50Z" fill="var(--hv-ribbon)"/>
  <circle cx="80" cy="52" r="7" fill="var(--hv-tie)"/>
  <circle cx="44" cy="96" r="3" fill="#fff" opacity=".7"/><circle cx="112" cy="104" r="3" fill="#fff" opacity=".7"/><circle cx="58" cy="118" r="2" fill="#fff" opacity=".7"/>
</svg>`;

module.exports = {
  id: 'hyvui',
  name: 'Hỷ Vui',
  group: 'minhhoa',
  badge: 'Mới',
  desc: 'Nền đỏ son, chữ Hỷ lớn và minh hoạ cô dâu chú rể vui nhộn, tấm vé mời màu kem',
  fonts: 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Dancing+Script:wght@500;700&family=Pacifico&display=swap',
  palettes: [
    { id: 'do-son', name: 'Đỏ son', swatch: ['#8e1b2b', '#fbf1e4'], vars: { ...base, '--page': '#5e0f1a', '--bg': '#8e1b2b', '--paper': '#fdf4e8', '--ink': '#3a1a1c', '--muted': '#87655e', '--accent': '#8e1b2b', '--accent-ink': '#fff', '--gold': '#e6bf78', '--line': '#ecd8c4', '--hv-on': '#fff7ee', '--hv-ribbon': '#f08c98', '--hv-tie': '#c8283c', '--hv-heart': '#ff8fa0', '--hv-box': '#f2c9a8', '--hv-box2': '#f8dcc2', '--hv-hy': 'rgba(0,0,0,.16)' } },
    { id: 'hong-dao', name: 'Hồng đào', swatch: ['#e07a88', '#fff6f2'], vars: { ...base, '--page': '#c25a6a', '--bg': '#e07a88', '--paper': '#fff7f3', '--ink': '#4b2a2f', '--muted': '#93727a', '--accent': '#c24e62', '--accent-ink': '#fff', '--gold': '#fff1c9', '--line': '#f3dcd8', '--hv-on': '#fffaf6', '--hv-ribbon': '#ffd1d8', '--hv-tie': '#c24e62', '--hv-heart': '#fff', '--hv-box': '#f7cfc4', '--hv-box2': '#fde3dc', '--hv-hy': 'rgba(120,20,40,.14)' } },
  ],
  demo: {
    cover: '/demo/songhy-1.jpg',
    photos: [2, 5, 1, 7, 3, 8, 6].map((n) => `/demo/songhy-${n}.jpg`),
  },
  layout: ['invite', 'calendar', 'events', 'story', 'gallery', 'rsvp', 'gift', 'wishes', 'thanks'],

  title(text, sub) {
    return `<h2 class="hv-h">${esc(text)}</h2>${sub ? `<p class="sec-sub">${esc(sub)}</p>` : ''}`;
  },

  opener(ctx) {
    return `
<div class="opener hv-opener" id="opener" data-open-ms="1100">
  <div class="hv-door l"><span>${HY()}</span></div><div class="hv-door r"><span>${HY()}</span></div>
  <div class="hv-oc">
    <p class="hv-ostd">Save the date</p>
    <p class="hv-onames">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
    <button class="hv-oseal" id="openBtn" type="button" aria-label="Mở thiệp">${HY()}</button>
    <p class="hv-oto">${ctx.guest ? 'Thân mời' : 'Trân trọng kính mời'}</p>
    <p class="hv-oguest">${ctx.guest ? esc(ctx.guest.name) : 'Quý khách'}</p>
    <p class="hv-ohint">Chạm để mở thiệp</p>
  </div>
</div>`;
  },

  cover(ctx) {
    const p = ctx.dparts;
    return `
<header class="hv-cover">
  <span class="hv-hy hv-hy1">${HY()}</span><span class="hv-hy hv-hy2">${HY()}</span>
  <i class="hv-fl f1"></i><i class="hv-fl f2"></i><i class="hv-fl f3"></i><i class="hv-fl f4"></i><i class="hv-fl f5"></i>
  <div class="hv-top">
    <p class="hv-std">Save the date</p>
    ${p ? `<p class="hv-date">${p.d}.${p.m}.${p.y}</p>` : ''}
  </div>
  <h1 class="hv-names"><span>${esc(ctx.g)}</span> <i>&amp;</i> <span>${esc(ctx.b)}</span></h1>
  ${p ? `<p class="hv-pill">${esc(ctx.weekday)}${ctx.timeText ? ` · ${esc(ctx.timeText)}` : ''}</p>` : ''}
  <div class="hv-couple">${COUPLE}</div>
</header>`;
  },

  sections: {
    invite(ctx) {
      const { d, guest, dparts: p } = ctx;
      const fam = (x, label) => `<div class="hv-fam"><p class="k">${label}</p>${x.father ? `<p>${esc(x.father)}</p>` : ''}${x.mother ? `<p>${esc(x.mother)}</p>` : ''}${x.address ? `<p class="a">${esc(x.address)}</p>` : ''}</div>`;
      const hasFam = d.groom.father || d.groom.mother || d.bride.father || d.bride.mother;
      const party = partyEvent(d);
      const cer = ceremonyEvent(d, party);
      const time = (cer && cer.time) || d.time;
      return `
  <section class="sec hv-invite reveal">
    <p class="hv-wi">Wedding Invitation</p>
    ${hasFam ? `<div class="hv-fams">${fam(d.groom, 'Nhà trai')}<span class="hv-seal">${HY()}</span>${fam(d.bride, 'Nhà gái')}</div>` : ''}
    <p class="hv-lead">Trân trọng báo tin lễ thành hôn của</p>
    <div class="hv-full"><p>${esc(d.groom.fullName || d.groom.name)}</p><i>&amp;</i><p>${esc(d.bride.fullName || d.bride.name)}</p></div>
    <p class="hv-kinh">${esc(d.inviteText || 'Trân trọng kính mời')}</p>
    <p class="hv-guest">${guest ? esc(guest.name) : 'Bạn và gia đình'}</p>
    <p class="hv-dash" aria-hidden="true"></p>
    ${p ? `
    <h3 class="hv-h3">${esc((cer && cer.name) || 'Lễ thành hôn')}</h3>
    <p class="hv-small">vào lúc</p>
    <div class="hv-when">
      <span>${esc(hourText(time))}</span>
      <div><em>${esc(ctx.weekday)}</em><b>${p.d}</b><em>Tháng ${p.m}</em></div>
      <span>Năm ${p.y}</span>
    </div>
    <p class="hv-lunar">(Tức ${esc(ctx.lunar.replace(/^Nhằm /i, ''))})</p>
    ${cer && cer.place ? `<p class="hv-at">Tại ${esc(cer.place)}</p>` : ''}` : ''}
    ${d.message ? `<p class="invite-msg">${esc(d.message)}</p>` : ''}
  </section>`;
    },

    calendar(ctx, opts, h) {
      const { d, dparts: p } = ctx;
      if (!p) return '';
      const party = partyEvent(d);
      const pp = party && party.date ? h.parts(party.date) : p;
      const u = (k, l) => `<span class="hv-cdu"><b data-cd="${k}">0</b><small>${l}</small></span>`;
      return `
  <section class="sec hv-cal reveal">
    ${party ? `
    <div class="hv-box">
      <h3 class="hv-h3">${esc(/tiệc/i.test(party.name) ? 'Tiệc mừng lễ thành hôn' : party.name)}</h3>
      <p class="hv-ptime">${esc(clock(party.time || d.time))}${party.time || d.time ? ' - ' : ''}${esc(h.weekday(party.date || d.date))}</p>
      <p class="hv-pdate">${pp.d}.${pp.m}.${pp.y}</p>
      <p class="hv-lunar">(${esc(h.lunarText(party.date || d.date).replace(/^Nhằm /i, 'Tức '))})</p>
      ${party.place ? `<p class="hv-pplace">${esc(party.place)}${party.address ? `<br><span>${esc(party.address)}</span>` : ''}</p>` : ''}
    </div>` : ''}
    ${d.show.calendar ? `<div class="hv-box hv-calbox"><span class="hv-year" aria-hidden="true">${p.y}</span>${h.calGrid(ctx, `<p class="hv-calh">${+p.m}.${p.y}</p>`)}</div>` : ''}
    ${d.show.countdown ? `<div class="hv-cd" role="timer">${u('d', 'ngày')}${u('h', 'giờ')}${u('m', 'phút')}${u('s', 'giây')}</div>` : ''}
  </section>`;
    },

    gallery(ctx) {
      const ph = ctx.d.photos;
      if (!ctx.d.show.gallery || !ph.length) return '';
      return `
  <section class="sec hv-album">
    <h2 class="hv-h">Khoảnh khắc</h2>
    <p class="hv-wi sm">our happy moments</p>
    <div class="hv-grid">
      ${ph.map((u, i) => `<button class="ph reveal" data-i="${i}" aria-label="Xem ảnh ${i + 1}"><img decoding="async" src="${esc(u)}" alt=""></button>`).join('')}
    </div>
  </section>`;
    },

    gift(ctx, opts, h) {
      return h.gift(ctx).replace('<div class="gifts">', `${GIFT}<div class="gifts">`);
    },

    thanks(ctx) {
      return `
  <section class="sec hv-thanks reveal">
    <span class="hv-seal sm">${HY()}</span>
    <p class="hv-ty">Hân hạnh được đón tiếp!</p>
    <p class="hv-small">Cảm ơn bạn đã là một phần trong ngày vui của chúng mình</p>
    <p class="hv-tn">${esc(ctx.g)} &amp; ${esc(ctx.b)}</p>
  </section>`;
    },
  },

  css: `
.tpl-hyvui{background:var(--page)}
.tpl-hyvui .card{background:var(--bg);color:var(--ink)}
/* ---------- bìa ---------- */
.tpl-hyvui .hv-cover{position:relative;min-height:693px;padding:44px 22px 0;color:var(--hv-on);overflow:hidden;display:flex;flex-direction:column}
.tpl-hyvui .hv-hy{position:absolute;color:var(--hv-hy);pointer-events:none}
.tpl-hyvui .hv-hy svg{width:100%;height:100%;display:block}
.tpl-hyvui .hv-hy1{width:120px;height:120px;top:40px;right:-6px;animation:hvBreath 6s ease-in-out infinite}
.tpl-hyvui .hv-hy2{width:190px;height:190px;top:330px;left:-46px;animation:hvBreath 7s ease-in-out infinite reverse}
@keyframes hvBreath{50%{transform:scale(1.05) rotate(-2deg)}}
.tpl-hyvui .hv-top{position:relative;text-align:left}
.tpl-hyvui .hv-std{margin:0;font-family:'Pacifico',cursive;font-size:38px;line-height:1.15;letter-spacing:.01em;text-shadow:0 2px 0 rgba(0,0,0,.12);transform:rotate(-4deg);transform-origin:left;display:inline-block}
.tpl-hyvui .hv-date{margin:10px 0 0 4px;font-size:21px;font-weight:600;letter-spacing:.14em}
.tpl-hyvui .hv-names{position:relative;margin:34px 0 0;text-align:center;font-family:var(--font-script);font-weight:700;font-size:40px;line-height:1.2}
.tpl-hyvui .hv-pill{position:relative;align-self:center;margin:12px 0 0;padding:5px 16px;border:1.5px dashed color-mix(in srgb,var(--hv-on) 60%,transparent);border-radius:999px;font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase}
.tpl-hyvui .hv-names i{font-style:normal;color:var(--gold);font-size:34px}
.tpl-hyvui .hv-couple{position:relative;margin:auto -10px 0;display:flex;justify-content:center}
.tpl-hyvui .hv-couple::before{content:"";position:absolute;left:50%;bottom:30px;width:330px;height:330px;margin-left:-165px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--hv-on) 14%,transparent),transparent 68%)}
.tpl-hyvui .hv-cpl{width:min(380px,100%);height:auto;display:block;transform-origin:50% 96%;animation:hvSway 4.2s ease-in-out infinite}
@keyframes hvSway{0%,100%{transform:rotate(-1.4deg)}50%{transform:rotate(1.4deg)}}
.tpl-hyvui .hv-hrt{transform-box:fill-box;transform-origin:center;animation:hvBeat 1.4s ease-in-out infinite}
@keyframes hvBeat{50%{transform:translateY(-6px) scale(1.15)}}
.tpl-hyvui .hv-fl{position:absolute;width:12px;height:12px;background:var(--hv-heart);opacity:.0;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 21s-7.5-4.6-10-9.3C.3 8.3 2.2 4 6.3 4c2.3 0 3.9 1.3 5.7 3.4C13.8 5.3 15.4 4 17.7 4 21.8 4 23.7 8.3 22 11.7 19.5 16.4 12 21 12 21z'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 21s-7.5-4.6-10-9.3C.3 8.3 2.2 4 6.3 4c2.3 0 3.9 1.3 5.7 3.4C13.8 5.3 15.4 4 17.7 4 21.8 4 23.7 8.3 22 11.7 19.5 16.4 12 21 12 21z'/%3E%3C/svg%3E") center/contain no-repeat;animation:hvRise 9s linear infinite}
.tpl-hyvui .hv-fl.f1{left:12%;bottom:120px;animation-delay:0s}
.tpl-hyvui .hv-fl.f2{left:82%;bottom:200px;animation-delay:2s;width:9px;height:9px}
.tpl-hyvui .hv-fl.f3{left:30%;bottom:60px;animation-delay:4s;width:14px;height:14px}
.tpl-hyvui .hv-fl.f4{left:70%;bottom:90px;animation-delay:6s}
.tpl-hyvui .hv-fl.f5{left:50%;bottom:260px;animation-delay:3s;width:8px;height:8px}
@keyframes hvRise{0%{transform:translateY(0) rotate(0);opacity:0}15%{opacity:.75}100%{transform:translateY(-360px) rotate(25deg);opacity:0}}

/* ---------- tấm vé mời màu kem ---------- */
.tpl-hyvui .card>.sec{margin:0 14px;background:var(--paper);padding:48px 22px}
.tpl-hyvui .card>.sec+.sec::before{content:"";position:absolute;left:-14px;right:-14px;top:-14px;height:28px;z-index:1;pointer-events:none;
  background:radial-gradient(circle at 14px 50%,var(--bg) 13.5px,transparent 14.5px),radial-gradient(circle at calc(100% - 14px) 50%,var(--bg) 13.5px,transparent 14.5px),linear-gradient(var(--bg),var(--bg)) center/calc(100% - 52px) 3px no-repeat}
.tpl-hyvui .hv-invite{border-radius:30px 30px 0 0;margin-top:-6px!important;padding-top:34px!important}
.tpl-hyvui .hv-thanks{border-radius:0 0 34px 34px}
.tpl-hyvui .hv-h{margin:0 0 22px;font-family:var(--font-title);font-weight:800;font-size:19px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink)}
.tpl-hyvui .sec-sub{margin:-14px 0 24px}
.tpl-hyvui .hv-wi{margin:0 0 22px;padding-bottom:14px;border-bottom:3px solid var(--bg);font-family:var(--font-script);font-size:34px;font-weight:500;color:var(--ink)}
.tpl-hyvui .hv-wi.sm{border:0;padding:0;margin:-18px 0 22px;font-size:24px;color:var(--muted)}
.tpl-hyvui .hv-fams{display:grid;grid-template-columns:1fr 64px 1fr;align-items:center;gap:6px;margin-bottom:24px;font-size:13px;line-height:1.55}
.tpl-hyvui .hv-fam p{margin:0}
.tpl-hyvui .hv-fam .k{font-weight:800;letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px;font-size:14px;color:var(--accent)}
.tpl-hyvui .hv-fam .a{color:var(--muted);font-size:12px;margin-top:4px}
.tpl-hyvui .hv-seal{display:grid;place-items:center;width:58px;height:58px;margin:0 auto;border-radius:50%;background:var(--accent);color:var(--paper);box-shadow:0 0 0 3px var(--paper),0 0 0 4.5px var(--accent);animation:hvPulse 2.6s ease-in-out infinite}
.tpl-hyvui .hv-seal svg{width:34px;height:34px}
.tpl-hyvui .hv-seal.sm{width:50px;height:50px;margin-bottom:16px}
.tpl-hyvui .hv-lead{margin:0;font-size:15px;color:var(--muted)}
.tpl-hyvui .hv-full{margin:6px 0 4px;font-family:var(--font-script);font-weight:700;color:var(--ink)}
.tpl-hyvui .hv-full p{margin:0;font-size:38px;line-height:1.25}
.tpl-hyvui .hv-full i{display:block;font-style:normal;font-size:30px;color:var(--accent)}
.tpl-hyvui .hv-kinh{margin:18px 0 0;font-family:var(--font-script);font-size:24px;color:var(--muted)}
.tpl-hyvui .hv-guest{margin:2px 0 0;font-family:var(--font-script);font-weight:700;font-size:30px;line-height:1.3;color:var(--accent)}
.tpl-hyvui .hv-dash{width:72%;height:1px;margin:20px auto 26px;background:repeating-linear-gradient(90deg,var(--muted) 0 8px,transparent 8px 12px,var(--muted) 12px 14px,transparent 14px 18px);opacity:.6}
.tpl-hyvui .hv-h3{margin:0;font-weight:800;font-size:17px;letter-spacing:.08em;text-transform:uppercase}
.tpl-hyvui .hv-small{margin:6px 0 4px;font-size:14px;color:var(--muted)}
.tpl-hyvui .hv-when{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;margin:4px auto 10px;max-width:330px;font-size:15px}
.tpl-hyvui .hv-when>div{display:flex;flex-direction:column;padding:0 18px;border-left:1.5px solid var(--ink);border-right:1.5px solid var(--ink)}
.tpl-hyvui .hv-when em{font-style:normal;letter-spacing:.12em;font-size:14px}
.tpl-hyvui .hv-when b{font-size:42px;line-height:1.1;font-weight:800;color:var(--accent)}
.tpl-hyvui .hv-lunar{margin:6px 0 0;font-size:14px;color:var(--muted)}
.tpl-hyvui .hv-at{margin:12px 0 0;font-weight:700;font-style:italic}
.tpl-hyvui .hv-box{position:relative;border:1.5px solid color-mix(in srgb,var(--accent) 55%,transparent);border-radius:18px;padding:22px 16px;background:var(--paper);overflow:hidden}
.tpl-hyvui .hv-box+.hv-box{margin-top:20px}
.tpl-hyvui .hv-ptime{margin:10px 0 2px;font-size:16px}
.tpl-hyvui .hv-pdate{margin:0;font-size:28px;font-weight:800;letter-spacing:.12em;color:var(--accent)}
.tpl-hyvui .hv-pplace{margin:14px 0 0;font-weight:600}
.tpl-hyvui .hv-pplace span{font-weight:400;color:var(--muted);font-size:14px}
.tpl-hyvui .hv-calbox{padding:0 0 14px}
.tpl-hyvui .hv-calh{margin:14px 14px 10px;padding:6px 18px;background:var(--accent);color:var(--accent-ink);text-align:left;font-size:26px;font-weight:500;letter-spacing:.04em}
.tpl-hyvui .hv-year{position:absolute;left:0;right:0;top:50%;font-size:96px;font-weight:800;letter-spacing:.02em;color:var(--accent);opacity:.09;pointer-events:none;line-height:1}
.tpl-hyvui .cal{width:100%;padding:0 10px;position:relative}
.tpl-hyvui .cal-grid{color:var(--accent);font-size:15px}
.tpl-hyvui .cal-grid .cal-w{color:var(--ink);opacity:.8}
.tpl-hyvui .hv-cd{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:20px}
.tpl-hyvui .hv-cdu{display:flex;flex-direction:column;align-items:center;padding:12px 4px;border-radius:14px;background:var(--accent);color:var(--accent-ink)}
.tpl-hyvui .hv-cdu b{font-size:24px;line-height:1.1;font-weight:700;font-variant-numeric:tabular-nums}
.tpl-hyvui .hv-cdu small{font-size:12px;opacity:.85}
/* lịch trình */
.tpl-hyvui .tl-when b{font-family:var(--font-title);font-weight:700;font-size:20px}
.tpl-hyvui .tl-body h3{font-weight:700;font-size:17px}
.tpl-hyvui .tl-act{gap:8px}
.tpl-hyvui .tl-act a{display:inline-block;padding:5px 12px;font-size:12.5px;border-radius:999px;background:var(--accent);color:var(--accent-ink);font-style:italic}
.tpl-hyvui .tl-act a+a{background:transparent;color:var(--accent);border:1px solid var(--accent)}
.tpl-hyvui .tl-act a::after{content:""}
/* câu chuyện */
.tpl-hyvui .s-story p{font-size:15px;line-height:1.75}
/* album */
.tpl-hyvui .hv-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.tpl-hyvui .hv-grid .ph{aspect-ratio:3/4;padding:6px;background:#fff;border-radius:6px;box-shadow:0 4px 14px rgba(60,20,20,.12);overflow:hidden}
.tpl-hyvui .hv-grid .ph img{width:100%;height:100%;object-fit:cover;border-radius:3px;transition:transform .6s}
.tpl-hyvui .hv-grid .ph:hover img{transform:scale(1.05)}
.tpl-hyvui .hv-grid .ph:nth-child(3n+1){grid-column:span 2;aspect-ratio:4/3.4}
.tpl-hyvui .hv-grid .ph:nth-child(3n+2).in{transform:rotate(-1.5deg)}
.tpl-hyvui .hv-grid .ph:nth-child(3n).in{transform:rotate(1.5deg)}
/* biểu mẫu & quà */
.tpl-hyvui .form{background:transparent;border:0;padding:0}
.tpl-hyvui .form input:not([type=radio]),.tpl-hyvui .form select,.tpl-hyvui .form textarea{background:#fff}
.tpl-hyvui .choice label{background:#fff}
.tpl-hyvui .btn{border-radius:10px;font-weight:600}
.tpl-hyvui .hv-giftbox{width:150px;height:auto;margin:-6px auto 14px;display:block;animation:hvBob 3s ease-in-out infinite}
@keyframes hvBob{50%{transform:translateY(-6px) rotate(-2deg)}}
.tpl-hyvui .gift{background:#fff;border-color:var(--line)}
.tpl-hyvui .gift-who{font-family:var(--font-title);font-weight:700;font-size:16px;text-transform:uppercase;letter-spacing:.06em}
.tpl-hyvui .wish{background:#fff}
.tpl-hyvui .copy{background:var(--paper)}
.tpl-hyvui .hv-cal{--cal-hi:var(--accent)}
/* cảm ơn */
.tpl-hyvui .hv-thanks{padding-bottom:44px!important}
.tpl-hyvui .hv-ty{margin:0;font-family:var(--font-script);font-weight:700;font-size:35px;line-height:1.2;color:var(--accent)}
.tpl-hyvui .hv-tn{margin:14px 0 0;font-weight:700;letter-spacing:.06em}
.tpl-hyvui .credit{color:color-mix(in srgb,var(--hv-on) 75%,transparent);padding-top:26px}
.tpl-hyvui .music-btn{color:var(--accent)}

/* ---------- màn mở thiệp: hai cánh cửa đỏ + dấu Hỷ ---------- */
.tpl-hyvui .hv-opener{background:transparent;overflow:hidden;color:var(--hv-on);cursor:pointer}
.tpl-hyvui .hv-door{position:absolute;top:0;bottom:0;width:50%;background:var(--bg);transition:transform 1s cubic-bezier(.7,0,.3,1);display:flex;align-items:center;overflow:hidden;
  background-image:radial-gradient(circle,rgba(255,255,255,.06) 1.5px,transparent 2px);background-size:22px 22px}
.tpl-hyvui .hv-door.l{left:0;border-right:2px solid var(--gold);justify-content:flex-end}
.tpl-hyvui .hv-door.r{right:0;border-left:2px solid var(--gold);justify-content:flex-start}
.tpl-hyvui .hv-door span{width:min(64vw,330px);flex:none;color:var(--hv-hy);opacity:.55}
.tpl-hyvui .hv-door.l span{transform:translateX(50%)}
.tpl-hyvui .hv-door.r span{transform:translateX(-50%)}
.tpl-hyvui .hv-door svg{display:block;width:100%}
.tpl-hyvui .hv-oc{position:relative;text-align:center;padding:24px;transition:opacity .4s,transform .5s}
.tpl-hyvui .hv-ostd{margin:0;font-family:'Pacifico',cursive;font-size:30px}
.tpl-hyvui .hv-onames{margin:4px 0 26px;font-family:var(--font-script);font-weight:700;font-size:28px}
.tpl-hyvui .hv-oseal{display:grid;place-items:center;width:104px;height:104px;margin:0 auto;border:0;border-radius:50%;background:var(--gold);color:var(--accent);box-shadow:0 0 0 6px color-mix(in srgb,var(--gold) 35%,transparent),0 10px 24px rgba(0,0,0,.25);animation:hvPulse 1.8s ease-in-out infinite}
.tpl-hyvui .hv-oseal svg{width:58px;height:58px}
@keyframes hvPulse{50%{transform:scale(1.07)}}
.tpl-hyvui .hv-oto{margin:24px 0 0;font-size:13px;letter-spacing:.2em;text-transform:uppercase;opacity:.85}
.tpl-hyvui .hv-oguest{margin:2px 0 0;font-family:var(--font-script);font-weight:700;font-size:30px;line-height:1.3}
.tpl-hyvui .hv-ohint{margin:22px 0 0;font-size:13px;opacity:.7}
.tpl-hyvui .hv-opener.opening .hv-door.l{transform:translateX(-101%)}
.tpl-hyvui .hv-opener.opening .hv-door.r{transform:translateX(101%)}
.tpl-hyvui .hv-opener.opening .hv-oc{opacity:0;transform:scale(1.15)}

@media (min-width:768px){.tpl-hyvui .card{box-shadow:0 0 60px rgba(0,0,0,.35)}}
@media (prefers-reduced-motion:reduce){.tpl-hyvui .hv-cpl,.tpl-hyvui .hv-hrt,.tpl-hyvui .hv-fl,.tpl-hyvui .hv-hy,.tpl-hyvui .hv-seal,.tpl-hyvui .hv-oseal,.tpl-hyvui .hv-giftbox{animation:none!important}.tpl-hyvui .hv-fl{display:none}}
`,
};
