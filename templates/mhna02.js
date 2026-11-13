// Mẫu nhập từ mehappy.vn (Giao Diện NA02 - Gói VIP, https://mehappy.vn/view/template/89) bằng tools/mehappy-import.js — bố cục ở templates/mh/mhna02.json,
// dựng bằng máy dựng chung lib/mh.js. Ảnh/font là của bản gốc: chỉ dùng công khai khi đã thay bằng tài sản của mình.
module.exports = require('../lib/mh').template({
  id: 'mhna02',
  name: "NA02",
  json: require('./mh/mhna02.json'),
});
