// Mẫu nhập từ mehappy.vn (Giao Diện MN01 - VIP, https://mehappy.vn/view/template/135) bằng tools/mehappy-import.js — bố cục ở templates/mh/mhmn01.json,
// dựng bằng máy dựng chung lib/mh.js. Ảnh/font là của bản gốc: chỉ dùng công khai khi đã thay bằng tài sản của mình.
module.exports = require('../lib/mh').template({
  id: 'mhmn01',
  name: "MN01",
  json: require('./mh/mhmn01.json'),
});
