// Mẫu nhập từ mehappy.vn (Giao diện DS03 - Gói VIP, https://mehappy.vn/view/template/128) bằng tools/mehappy-import.js — bố cục ở templates/mh/mhds03.json,
// dựng bằng máy dựng chung lib/mh.js. Ảnh/font là của bản gốc: chỉ dùng công khai khi đã thay bằng tài sản của mình.
module.exports = require('../lib/mh').template({
  id: 'mhds03',
  name: "DS03",
  json: require('./mh/mhds03.json'),
});
