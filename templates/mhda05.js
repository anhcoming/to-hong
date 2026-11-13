// Mẫu nhập từ mehappy.vn (Giao diện thiệp cưới DA05 - Gói VIP, https://mehappy.vn/view/template/24) bằng tools/mehappy-import.js — bố cục ở templates/mh/mhda05.json,
// dựng bằng máy dựng chung lib/mh.js. Ảnh/font là của bản gốc: chỉ dùng công khai khi đã thay bằng tài sản của mình.
module.exports = require('../lib/mh').template({
  id: 'mhda05',
  name: "DA05",
  json: require('./mh/mhda05.json'),
});
