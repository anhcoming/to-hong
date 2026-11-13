// Mẫu nhập từ mehappy.vn (Giao diện AT01 - Gói VIP, https://mehappy.vn/view/template/2) bằng tools/mehappy-import.js — bố cục ở templates/mh/mhat01.json,
// dựng bằng máy dựng chung lib/mh.js. Ảnh/font là của bản gốc: chỉ dùng công khai khi đã thay bằng tài sản của mình.
module.exports = require('../lib/mh').template({
  id: 'mhat01',
  name: "AT01",
  json: require('./mh/mhat01.json'),
});
