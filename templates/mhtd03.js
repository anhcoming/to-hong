// Mẫu nhập từ mehappy.vn (Giao Diện TD03 - Gói VIP, https://mehappy.vn/view/template/3) bằng tools/mehappy-import.js — bố cục ở templates/mh/mhtd03.json,
// dựng bằng máy dựng chung lib/mh.js. Ảnh/font là của bản gốc: chỉ dùng công khai khi đã thay bằng tài sản của mình.
module.exports = require('../lib/mh').template({
  id: 'mhtd03',
  name: 'Lam Ngọc',
  desc: 'Tối giản xanh rêu: thẻ chữ Hỷ treo, tên viết thư pháp, lịch và đếm ngược khối xanh đậm',
  json: require('./mh/mhtd03.json'),
});
