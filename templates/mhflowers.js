// Mẫu nhập từ mehappy.vn (Giao diện Flowers - Gói VIP, https://mehappy.vn/view/template/18) bằng tools/mehappy-import.js — bố cục ở templates/mh/mhflowers.json,
// dựng bằng máy dựng chung lib/mh.js. Ảnh/font là của bản gốc: chỉ dùng công khai khi đã thay bằng tài sản của mình.
module.exports = require('../lib/mh').template({
  id: 'mhflowers',
  name: "Flowers",
  json: require('./mh/mhflowers.json'),
});
