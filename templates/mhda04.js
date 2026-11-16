// Mẫu nhập từ mehappy.vn (Giao diện thiệp cưới DA04 - Gói VIP, https://mehappy.vn/view/template/28) bằng tools/mehappy-import.js — bố cục ở templates/mh/mhda04.json,
// dựng bằng máy dựng chung lib/mh.js. Ảnh/font là của bản gốc: chỉ dùng công khai khi đã thay bằng tài sản của mình.
module.exports = require('../lib/mh').template({
  id: 'mhda04',
  name: 'Kim Sa',
  desc: 'Ngoại cảnh trang nhã: bìa ảnh vườn cây, khung giấy hoa văn vàng, chân dung trên giấy xé',
  json: require('./mh/mhda04.json'),
});
