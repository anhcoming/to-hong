// Mẫu nhập từ mehappy.vn (Giao diện Thiệp cưới RedFlow - Gói VIP, https://mehappy.vn/view/template/181) bằng tools/mehappy-import.js — bố cục ở templates/mh/mhredflow.json,
// dựng bằng máy dựng chung lib/mh.js. Ảnh/font là của bản gốc: chỉ dùng công khai khi đã thay bằng tài sản của mình.
module.exports = require('../lib/mh').template({
  id: 'mhredflow',
  name: "RedFlow",
  json: require('./mh/mhredflow.json'),
});
