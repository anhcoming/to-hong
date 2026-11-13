// Mẫu nhập từ mehappy.vn (Giao Diện Radiant - Gói VIP, https://mehappy.vn/view/template/69) bằng tools/mehappy-import.js — bố cục ở templates/mh/mhradiant.json,
// dựng bằng máy dựng chung lib/mh.js. Ảnh/font là của bản gốc: chỉ dùng công khai khi đã thay bằng tài sản của mình.
module.exports = require('../lib/mh').template({
  id: 'mhradiant',
  name: "Radiant",
  json: require('./mh/mhradiant.json'),
});
