// Mẫu nhập từ mehappy.vn (Giao diện Bustle - Gói VIP, https://mehappy.vn/view/template/71) bằng tools/mehappy-import.js — bố cục ở templates/mh/mhbustle.json,
// dựng bằng máy dựng chung lib/mh.js. Ảnh/font là của bản gốc: chỉ dùng công khai khi đã thay bằng tài sản của mình.
module.exports = require('../lib/mh').template({
  id: 'mhbustle',
  name: "Bustle",
  json: require('./mh/mhbustle.json'),
});
