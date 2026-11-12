// Cấu trúc nội dung một thiệp + chuẩn hoá dữ liệu người dùng gửi lên.
const { str } = require('./util');

const person = () => ({ name: '', fullName: '', father: '', mother: '', address: '' });
const bank = () => ({ bin: '', acc: '', holder: '' });

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
    photos: [],
    music: '',
    gifts: { groom: bank(), bride: bank() },
    show: { calendar: true, countdown: true, gallery: true, rsvp: true, gift: true, wishes: true },
  };
}

function sample() {
  const d = defaults();
  Object.assign(d.groom, { name: 'Đức Minh', fullName: 'Nguyễn Đức Minh', father: 'Ông Nguyễn Văn An', mother: 'Bà Trần Thị Bình', address: 'Phường Láng, Hà Nội' });
  Object.assign(d.bride, { name: 'Thu Hà', fullName: 'Lê Thu Hà', father: 'Ông Lê Văn Cường', mother: 'Bà Phạm Thị Dung', address: 'Phường Cửa Nam, Hà Nội' });
  d.date = '2026-12-20';
  d.time = '18:00';
  d.story = 'Gặp nhau năm 2019 trong một buổi chiều mưa ở Hồ Gươm, sau 7 năm cùng đi qua bao mùa, chúng mình quyết định về chung một nhà. Rất mong được đón bạn trong ngày vui này!';
  d.events = [
    { name: 'Lễ Vu Quy', date: '2026-12-20', time: '08:00', place: 'Tư gia nhà gái', address: 'Phố Hàng Bông, Hoàn Kiếm, Hà Nội', mapUrl: '' },
    { name: 'Lễ Thành Hôn', date: '2026-12-20', time: '10:00', place: 'Tư gia nhà trai', address: 'Phố Láng Hạ, Đống Đa, Hà Nội', mapUrl: '' },
    { name: 'Tiệc Cưới', date: '2026-12-20', time: '18:00', place: 'Sảnh Hoa Sen — Nhà hàng tiệc cưới', address: 'Hồ Tây, Tây Hồ, Hà Nội', mapUrl: '' },
  ];
  d.cover = '/demo/dodam-2.jpg';
  d.photos = ['/demo/dodam-1.jpg', '/demo/dodam-3.jpg', '/demo/dodam-4.jpg'];
  d.gifts.groom = { bin: '970436', acc: '0123456789', holder: 'NGUYEN DUC MINH' };
  d.gifts.bride = { bin: '970407', acc: '1903123456789', holder: 'LE THU HA' };
  return d;
}

const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : '';
const isTime = (v) => /^\d{2}:\d{2}$/.test(v || '') ? v : '';

// Chỉ cho ảnh/nhạc từ kho upload của mình, ảnh demo, hoặc link https
function safeMedia(u) {
  u = str(u, 500);
  // "#p=x,y[,z]": điểm lấy nét (phần trăm) và mức phóng to (1–4) của ảnh trong khung mẫu — chọn ở chế độ sửa trực tiếp
  if (/^\/(uploads|demo)\/[\w.-]+(#p=\d{1,3}(\.\d)?,\d{1,3}(\.\d)?(,[1-4](\.\d\d?)?)?)?$/.test(u)) return u;
  if (/^https:\/\/[^\s"'<>]+$/.test(u)) return u;
  return '';
}

function normPerson(p = {}) {
  return {
    name: str(p.name, 40), fullName: str(p.fullName, 80), father: str(p.father, 80),
    mother: str(p.mother, 80), address: str(p.address, 160),
  };
}

function normBank(b = {}) {
  return {
    bin: /^\d{6}$/.test(b.bin || '') ? b.bin : '',
    acc: str(b.acc, 30).replace(/[^\w]/g, ''),
    holder: str(b.holder, 60).toUpperCase(),
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
    message: str(input.message, 400),
    story: str(input.story, 2000),
    events: (Array.isArray(input.events) ? input.events : []).slice(0, 6).map((e = {}) => ({
      name: str(e.name, 60), date: isDate(e.date), time: isTime(e.time), place: str(e.place, 120),
      address: str(e.address, 200), mapUrl: /^https:\/\//.test(e.mapUrl || '') ? str(e.mapUrl, 500) : '',
      mapPin: /^-?\d{1,2}(\.\d+)?,-?\d{1,3}(\.\d+)?$/.test(e.mapPin || '') && e.mapUrl ? String(e.mapPin) : '', // toạ độ đọc từ link Google Maps
    })),
    cover: safeMedia(input.cover),
    photos: (Array.isArray(input.photos) ? input.photos : []).map(safeMedia).filter(Boolean).slice(0, 24),
    music: safeMedia(input.music),
    gifts: { groom: normBank(input.gifts?.groom), bride: normBank(input.gifts?.bride) },
    show: Object.fromEntries(Object.keys(d.show).map((k) => [k, show[k] !== false])),
  };
}

module.exports = { defaults, sample, normalize, safeMedia };
