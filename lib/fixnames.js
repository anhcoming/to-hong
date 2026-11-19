// Trả tiền là chốt. Màn LED / video đã kích hoạt: chụp lại dữ liệu đám cưới lúc chốt (t.snap = tên đôi, ngày, bố mẹ, ảnh…)
// và khoá luôn cài đặt của nó (máy chủ từ chối sửa khi đã có t.snap). Màn LED / video chiếu và xuất theo bản chụp, nên sửa
// thiệp / sổ tay sau này không đổi được — cũng chặn mua một lần rồi đổi tên dùng cho đám cưới khác.
// t.names (tên đôi lúc chốt) giữ lại cho chỗ cũ còn đọc.
// lock = true (lúc trả tiền; lần đầu chiếu màn LED thật / xuất video): có đủ tên hai bạn thì chốt luôn.
// lock = false (lúc nạp dữ liệu, trước khi sổ tay đổi tên thiệp, Trọn bộ mở LED / video vừa tạo): chỉ giữ bản đã chốt đủ tên,
// KHÔNG chốt bản đang làm dở. Kích hoạt lúc thiệp chưa đủ tên: chưa chốt (tránh chốt tên trống), lần đầu chiếu / xuất thì chốt.
const full = (n) => !!(n && n.groom && n.bride);
const namesOf = (d) => ({ groom: (d && d.groom && d.groom.name) || '', bride: (d && d.bride && d.bride.name) || '' });
function fixNames(card, lock = true) {
  if (!card || !card.data) return;
  for (const k of ['led', 'video']) {
    const t = card[k];
    if (!t) continue;
    if (!t.paid) { delete t.names; delete t.snap; continue; }
    if (t.snap && full(namesOf(t.snap))) { t.names = namesOf(t.snap); continue; }
    delete t.snap;
    // dữ liệu cũ: đã khoá tên đủ từ trước (chưa có bản chụp) → chốt luôn theo thiệp hiện tại, giữ đúng tên đã khoá
    if (full(t.names)) { t.snap = snapOf(card.data, t.names); continue; }
    const n = namesOf(card.data);
    if (lock && full(n)) { t.snap = snapOf(card.data, n); t.names = n; }
    else delete t.names; // chưa đủ tên / chưa tới lúc chốt: để mở
  }
}
function snapOf(data, names) {
  const s = JSON.parse(JSON.stringify(data));
  s.groom.name = names.groom; s.bride.name = names.bride;
  return s;
}
// đã chốt: không sửa được nữa
const isFinal = (t) => !!(t && t.paid && t.snap);
// dữ liệu đám cưới để dựng màn LED / video: đã chốt thì theo bản chụp
const withSnap = (card, t) => (t && t.snap ? { ...card, data: t.snap } : card);
module.exports = { fixNames, isFinal, withSnap };
