// Mẫu nhập từ mehappy.vn (Giao diện Thiệp cưới DA01 - Gói VIP, https://mehappy.vn/view/template/133) bằng tools/mehappy-import.js — bố cục ở templates/mh/mhda01.json,
// dựng bằng máy dựng chung lib/mh.js. Ảnh/font là của bản gốc: chỉ dùng công khai khi đã thay bằng tài sản của mình.
module.exports = require('../lib/mh').template({
  id: 'mhda01',
  name: 'Mộc Miên',
  desc: 'Tối giản tông nâu: chữ Wedding Invitation lớn, ảnh trầm, timeline biểu tượng và dress code',
  json: require('./mh/mhda01.json'),
});
