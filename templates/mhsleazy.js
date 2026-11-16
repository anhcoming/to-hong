// Mẫu nhập từ mehappy.vn (Giao diện Sleazy - Gói VIP, https://mehappy.vn/view/template/65) bằng tools/mehappy-import.js — bố cục ở templates/mh/mhsleazy.json,
// dựng bằng máy dựng chung lib/mh.js. Ảnh/font là của bản gốc: chỉ dùng công khai khi đã thay bằng tài sản của mình.
module.exports = require('../lib/mh').template({
  id: 'mhsleazy',
  name: 'Thanh Nhã',
  desc: 'Nhẹ nhàng xám bạc: bìa ảnh rừng thông, chữ thư pháp Happy Wedding Day và thiệp mời họa tiết Hỷ',
  json: require('./mh/mhsleazy.json'),
});
