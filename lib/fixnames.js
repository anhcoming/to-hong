// Kích hoạt màn LED / video: cố định tên cô dâu chú rể lúc đó (led.names / video.names) — sửa tên trên thiệp sau này
// không đổi tên trên màn LED / video, tránh mua một lần rồi đổi tên dùng cho đám cưới khác. Huỷ kích hoạt thì bỏ.
// Gọi ở mọi chỗ đổi trạng thái kích hoạt và trước mọi chỗ đổi tên trên thiệp (lưu thiệp, sổ tay đồng bộ).
function fixNames(card) {
  if (!card) return;
  for (const k of ['led', 'video']) {
    const t = card[k];
    if (!t) continue;
    if (!t.paid) delete t.names;
    else if (!t.names) t.names = { groom: card.data.groom.name || '', bride: card.data.bride.name || '' };
  }
}
module.exports = { fixNames };
