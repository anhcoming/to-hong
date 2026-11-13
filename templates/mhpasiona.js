// Mẫu nhập từ mehappy.vn (Giao diện Pasiona - Gói VIP, https://mehappy.vn/view/template/67) bằng tools/mehappy-import.js — bố cục ở templates/mh/mhpasiona.json,
// dựng bằng máy dựng chung lib/mh.js. Ảnh/font là của bản gốc: chỉ dùng công khai khi đã thay bằng tài sản của mình.
module.exports = require('../lib/mh').template({
  id: 'mhpasiona',
  name: "Pasiona",
  json: require('./mh/mhpasiona.json'),
});
