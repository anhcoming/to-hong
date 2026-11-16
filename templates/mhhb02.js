// Mẫu nhập từ mehappy.vn (Giao diện HB02 - Gói VIP, https://mehappy.vn/view/template/45) bằng tools/mehappy-import.js — bố cục ở templates/mh/mhhb02.json,
// dựng bằng máy dựng chung lib/mh.js. Ảnh/font là của bản gốc: chỉ dùng công khai khi đã thay bằng tài sản của mình.
module.exports = require('../lib/mh').template({
  id: 'mhhb02',
  name: 'Hồng Hỷ',
  desc: 'Ngọt ngào trên giấy kem: đếm ngược hồng, chân dung khung viền hồng và chữ thư pháp',
  json: require('./mh/mhhb02.json'),
});
