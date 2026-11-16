// Mẫu nhập từ mehappy.vn (Giao Diện NA02 - Gói VIP, https://mehappy.vn/view/template/89) bằng tools/mehappy-import.js — bố cục ở templates/mh/mhna02.json,
// dựng bằng máy dựng chung lib/mh.js. Ảnh/font là của bản gốc: chỉ dùng công khai khi đã thay bằng tài sản của mình.
module.exports = require('../lib/mh').template({
  id: 'mhna02',
  name: 'Ngà Ngọc',
  desc: 'Sang trọng tông ngà: ảnh cung điện, chữ thư pháp nâu vàng, lịch tháng nền hoa mờ và timeline',
  json: require('./mh/mhna02.json'),
});
