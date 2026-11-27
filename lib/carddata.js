// Cấu trúc nội dung một thiệp + chuẩn hoá dữ liệu người dùng gửi lên.
const { str } = require('./util');

const person = () => ({ name: '', fullName: '', rank: '', phone: '', father: '', mother: '', address: '' });
// danh xưng trên thiệp truyền thống (Trưởng nam / Út nữ…) — chọn trong popup "Thông tin chính"
const FX = ['sakura', 'snow', 'leaves', 'mai', 'hearts'];
const RANKS = ['Trưởng nam', 'Thứ nam', 'Út nam', 'Con trai', 'Trưởng nữ', 'Thứ nữ', 'Út nữ', 'Con gái'];
const bank = () => ({ bin: '', acc: '', holder: '', qr: '' });
// Tài khoản mừng cưới của các thiệp xem thử: lấy thẳng tài khoản nhận tiền trong config.json (QR quét ra tài khoản của chủ web)
const demoBank = () => { const p = require('../config.json').payment || {}; return { bin: String(p.bankBin || ''), acc: String(p.accountNo || ''), holder: String(p.accountName || '') }; };

function defaults() {
  return {
    groom: person(),
    bride: person(),
    date: '',
    time: '',
    inviteText: 'Trân trọng kính mời',
    message: 'Sự hiện diện của quý khách là niềm vinh hạnh cho gia đình chúng tôi.',
    story: '',
    events: [],
    cover: '',
    shareImg: '', // ảnh xem trước khi gửi link (JPEG 1200×630: ảnh cưới + tên đôi + ngày) — trình sửa tự tạo
    shareKey: '', // dấu của nội dung đã vẽ vào ảnh chia sẻ (đổi ảnh/tên/ngày thì vẽ lại)
    photos: [],
    music: '',
    musicOff: false, // true = chủ thiệp tắt nhạc (không tự dùng nhạc mẫu)
    musicStart: 0, // giây bắt đầu phát (trình sửa tự dò đoạn điệp khúc khi chọn bài, chủ thiệp chỉnh lại được)
    musicEnd: 0, // giây kết thúc đoạn (0 = tới hết bài); hết đoạn thì quay lại musicStart
    gifts: { groom: bank(), bride: bank() },
    show: { calendar: true, countdown: true, gallery: true, rsvp: true, gift: true, wishes: true, dress: false, qa: false, contact: false },
    dress: { colors: [], note: '' }, // khối "Trang phục" (dress code): tối đa 5 màu gợi ý + lời nhắn
    qa: [], // khối "Hỏi đáp" về hai bạn: [{ q, a }] tối đa 6
    shareTitle: '', shareDesc: '', shareOwn: '', // chữ + ảnh tự chọn khi gửi link (trống = tự tạo)
    fx: '', // hiệu ứng nền rơi trên thiệp: '' | sakura | snow | leaves | mai | hearts
  };
}
// khối mới mặc định TẮT (thiệp cũ không tự hiện khối trống); các khối cũ mặc định BẬT
const SHOW_OFF = ['dress', 'qa', 'contact'];

function sample() {
  const d = defaults();
  Object.assign(d.groom, { name: 'Gia Huy', fullName: 'Trần Gia Huy', rank: 'Trưởng nam', father: 'Ông Trần Quang Hải', mother: 'Bà Nguyễn Thị Lan', address: 'Phường Phú Nhuận, TP. Hồ Chí Minh' });
  Object.assign(d.bride, { name: 'Bảo Ngọc', fullName: 'Lê Bảo Ngọc', rank: 'Út nữ', father: 'Ông Lê Minh Tuấn', mother: 'Bà Phạm Thị Hoa', address: 'Phường Bình Thạnh, TP. Hồ Chí Minh' });
  d.date = '2026-12-20';
  d.time = '18:00';
  d.story = 'Gặp nhau năm 2019 trong một buổi chiều mưa ở một quán cà phê nhỏ giữa Sài Gòn, sau 7 năm cùng đi qua bao mùa, chúng mình quyết định về chung một nhà. Rất mong được đón bạn trong ngày vui này!';
  d.events = [
    { name: 'Lễ Vu Quy', date: '2026-12-20', time: '08:00', place: 'Tư gia nhà gái', address: 'Đường Hoàng Hoa Thám, Bình Thạnh, TP. Hồ Chí Minh', mapUrl: '' },
    { name: 'Lễ Thành Hôn', date: '2026-12-20', time: '10:00', place: 'Tư gia nhà trai', address: 'Đường Lê Văn Sỹ, Phú Nhuận, TP. Hồ Chí Minh', mapUrl: '' },
    { name: 'Tiệc Cưới', date: '2026-12-20', time: '18:00', place: 'Sảnh Ngọc Lan — Nhà hàng tiệc cưới', address: 'Đường Phạm Văn Đồng, TP. Thủ Đức, TP. Hồ Chí Minh', mapUrl: '' },
  ];
  d.cover = '/demo/dodam-2.jpg';
  d.photos = ['/demo/dodam-1.jpg', '/demo/dodam-3.jpg', '/demo/dodam-4.jpg'];
  d.gifts.groom = demoBank();
  d.gifts.bride = demoBank();
  return d;
}

// mốc thời gian trong bài nhạc: giây, 0–3600, làm tròn 0,1 giây
const secs = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.min(3600, Math.round(n * 10) / 10) : 0; };
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : '';
const isTime = (v) => /^\d{2}:\d{2}$/.test(v || '') ? v : '';

// Chỉ cho ảnh/nhạc từ kho upload của mình, ảnh demo, hoặc link https
const trimEnd = (a) => { while (a.length && !a[a.length - 1]) a.pop(); return a; };
function safeMedia(u) {
  u = str(u, 500);
  // "#p=x,y[,z]": điểm lấy nét (phần trăm) và mức phóng to (1–4) của ảnh trong khung mẫu — chọn ở chế độ sửa trực tiếp
  if (/^\/music\/[\w-]+\.mp3$/.test(u)) return u; // nhạc mẫu (lib/music.js)
  if (/^\/(uploads|demo)\/[\w.-]+(#p=\d{1,3}(\.\d)?,\d{1,3}(\.\d)?(,[1-4](\.\d\d?)?)?)?$/.test(u)) return u;
  if (/^https:\/\/[^\s"'<>]+$/.test(u)) return u;
  return '';
}

function normPerson(p = {}) {
  return {
    name: str(p.name, 40), fullName: str(p.fullName, 80), father: str(p.father, 80),
    rank: RANKS.includes(p.rank) ? p.rank : '', phone: str(p.phone, 20).replace(/[^\d+ .]/g, ''),
    mother: str(p.mother, 80), address: str(p.address, 160),
  };
}
const isColor = (c) => /^#[0-9a-f]{6}$/i.test(c || '');

function normBank(b = {}) {
  return {
    bin: /^\d{6}$/.test(b.bin || '') ? b.bin : '',
    acc: str(b.acc, 30).replace(/[^\w]/g, ''),
    holder: str(b.holder, 60).toUpperCase(),
    qr: b.qr ? safeMedia(b.qr) : '', // ảnh mã QR tự tải lên — có thì dùng thay mã tạo từ số tài khoản
  };
}

function normalize(input = {}) {
  const d = defaults();
  const show = input.show || {};
  return {
    groom: normPerson(input.groom),
    bride: normPerson(input.bride),
    date: isDate(input.date),
    time: isTime(input.time),
    inviteText: str(input.inviteText, 80) || d.inviteText,
    lead: String(input.lead || '').replace(/\r/g, '').split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 3).join('\n').slice(0, 160), // dòng báo tin (nhiều dòng)
    message: str(input.message, 400),
    story: str(input.story, 2000),
    events: (Array.isArray(input.events) ? input.events : []).slice(0, 6).map((e = {}) => ({
      name: str(e.name, 60), date: isDate(e.date), time: isTime(e.time), place: str(e.place, 120),
      address: str(e.address, 200), mapUrl: /^https:\/\//.test(e.mapUrl || '') ? str(e.mapUrl, 500) : '',
      welcome: isTime(e.welcome), // giờ đón khách
      main: e.main === true, // lễ chính (dùng cho trang bìa, đếm ngược, lịch)
      // đọc từ link Google Maps: toạ độ "lat,lng", hoặc "q:<truy vấn Google ghi trong link>" khi link không mang toạ độ
      mapPin: e.mapUrl && (/^-?\d{1,2}(\.\d+)?,-?\d{1,3}(\.\d+)?$/.test(e.mapPin || '') || /^q:[^<>"]{2,300}$/.test(e.mapPin || '')) ? String(e.mapPin) : '',
    })),
    cover: safeMedia(input.cover),
    shareImg: /\.(jpe?g|png)$/i.test(input.shareImg || '') ? safeMedia(input.shareImg) : '',
    shareKey: str(input.shareKey, 300),
    // giữ ô trống ('') đúng vị trí: tải ảnh vào ô 3 thì ảnh nằm ở ô 3, không bị dồn lên ô 1; bỏ ô trống thừa ở cuối
    photos: trimEnd((Array.isArray(input.photos) ? input.photos : []).slice(0, 24).map((u) => (u ? safeMedia(u) : ''))),
    music: safeMedia(input.music),
    musicOff: !input.music && input.musicOff === true,
    musicStart: input.music ? secs(input.musicStart) : 0,
    musicEnd: input.music && secs(input.musicEnd) > secs(input.musicStart) + 3 ? secs(input.musicEnd) : 0,
    gifts: { groom: normBank(input.gifts?.groom), bride: normBank(input.gifts?.bride) },
    show: Object.fromEntries(Object.keys(d.show).map((k) => [k, SHOW_OFF.includes(k) ? show[k] === true : show[k] !== false])),
    dress: { colors: (Array.isArray(input.dress?.colors) ? input.dress.colors : []).filter(isColor).slice(0, 5).map((c) => c.toLowerCase()), note: str(input.dress?.note, 200) },
    qa: (Array.isArray(input.qa) ? input.qa : []).slice(0, 6).map((x = {}) => ({ q: str(x.q, 120), a: str(x.a, 400) })).filter((x) => x.q || x.a),
    shareTitle: str(input.shareTitle, 100), shareDesc: str(input.shareDesc, 200),
    shareOwn: /\.(jpe?g|png|webp)(#.*)?$/i.test(input.shareOwn || '') ? safeMedia(input.shareOwn) : '',
    fx: FX.includes(input.fx) ? input.fx : '',
  };
}

// Lời mời ("Trân trọng kính mời", "Thân mời"…): mẫu nào có chữ mời viết sẵn thì giữ chữ của mẫu cho tới khi
// cô dâu chú rể đổi lời mời khác mặc định → thiệp cũ không đổi giao diện, ai đổi lời mời thì mọi mẫu đều theo.
const DEFAULT_INVITE = 'Trân trọng kính mời';
const nfcLow = (s) => String(s || '').normalize('NFC').trim().toLowerCase();
function inviteWord(d, fallback) {
  const v = String((d && d.inviteText) || '').trim();
  return v && nfcLow(v) !== nfcLow(DEFAULT_INVITE) ? v : fallback;
}
// viết lời mời theo kiểu chữ của chữ mẫu: IN HOA / Viết Hoa Đầu Từ / như người dùng gõ
function matchCase(word, sample) {
  if (sample === sample.toUpperCase() && sample !== sample.toLowerCase()) return word.toUpperCase();
  if (sample.split(/\s+/).every((w) => w[0] === w[0].toUpperCase())) return word.toLowerCase().replace(/(^|\s)(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  return word;
}

module.exports = { RANKS, defaults, sample, normalize, safeMedia, DEFAULT_INVITE, inviteWord, matchCase, demoBank };
