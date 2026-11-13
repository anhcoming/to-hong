// Mẫu nhập từ mehappy.vn (Giao diện HB04 - Basic, https://mehappy.vn/view/template/145) bằng tools/mehappy-import.js — bố cục ở templates/mh/mhhb04.json,
// dựng bằng máy dựng chung lib/mh.js. Ảnh/font là của bản gốc: chỉ dùng công khai khi đã thay bằng tài sản của mình.
module.exports = require('../lib/mh').template({
  id: 'mhhb04',
  name: "HB04",
  json: require('./mh/mhhb04.json'),
});
