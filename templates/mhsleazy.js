// Mẫu nhập từ mehappy.vn (Giao diện Sleazy - Gói VIP, https://mehappy.vn/view/template/65) bằng tools/mehappy-import.js — bố cục ở templates/mh/mhsleazy.json,
// dựng bằng máy dựng chung lib/mh.js. Ảnh/font là của bản gốc: chỉ dùng công khai khi đã thay bằng tài sản của mình.
module.exports = require('../lib/mh').template({
  id: 'mhsleazy',
  name: "Sleazy",
  json: require('./mh/mhsleazy.json'),
});
