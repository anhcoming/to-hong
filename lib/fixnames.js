// Kích hoạt màn LED / video: cố định tên cô dâu chú rể (led.names / video.names) — sửa tên trên thiệp sau này
// không đổi tên trên màn LED / video, tránh mua một lần rồi đổi tên dùng cho đám cưới khác. Huỷ kích hoạt thì bỏ.
// lock = true (lúc kích hoạt; lần đầu chiếu màn LED thật / xuất video): có đủ tên hai bạn thì khoá luôn.
// lock = false (trước khi lưu thiệp / sổ tay đổi tên, lúc nạp dữ liệu): chỉ giữ tên đã khoá đủ, KHÔNG khoá tên đang gõ dở.
// Kích hoạt lúc thiệp chưa đủ tên: chưa khoá (trước đây khoá tên trống → màn hiện mãi "Chú rể & Cô dâu", không sửa được);
// khách điền tên thoải mái, lần đầu chiếu màn LED / xuất video thì khoá.
const full = (n) => !!(n && n.groom && n.bride);
function fixNames(card, lock = true) {
  if (!card || !card.data) return;
  for (const k of ['led', 'video']) {
    const t = card[k];
    if (!t) continue;
    if (!t.paid) { delete t.names; continue; }
    if (full(t.names)) continue;
    const g = (card.data.groom && card.data.groom.name) || '', b = (card.data.bride && card.data.bride.name) || '';
    if (lock && g && b) t.names = { groom: g, bride: b };
    else delete t.names; // chưa đủ tên / chưa tới lúc khoá: để mở
  }
}
module.exports = { fixNames };
