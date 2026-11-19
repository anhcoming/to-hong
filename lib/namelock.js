// Chốt tên cô dâu chú rể + ngày cưới khi thiệp (hoặc màn LED / video của thiệp) đã kích hoạt — tránh mua một lần rồi
// đổi tên dùng lại cho đám cưới khác. Vẫn cho sửa lỗi gõ nhỏ:
//  - tên: thêm / bỏ dấu thoải mái, đổi tối đa 2 ký tự (tên ngắn ≤ 4 chữ cái: 1 ký tự) so với tên lúc chốt
//  - ngày cưới: dời trong khoảng 90 ngày so với ngày lúc chốt (hoãn / đổi ngày)
// Luôn so với bản chốt (không phải lần sửa trước) → sửa nhỏ nhiều lần cũng không trôi dần sang tên khác.
// Bản chốt tạo lúc thay đổi đầu tiên sau khi kích hoạt (dữ liệu lúc đó = dữ liệu lúc kích hoạt). Ô còn trống lúc chốt
// thì lần điền đầu tiên được nhận luôn. Đổi hẳn tên: quản trị bấm "Mở khoá tên" (card.lockOpen) → lần lưu sau nhận tên mới rồi chốt lại.
const DAYS = 90;
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/\s+/g, ' ').trim();
function lev(a, b) {
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
const activated = (card) => !!(card.paid || (card.led && card.led.paid) || (card.video && card.video.paid));
const snap = (d) => ({ groom: d.groom.name || '', bride: d.bride.name || '', date: d.date || '' });
const nameOk = (was, now) => { const a = fold(was), b = fold(now); return !a || lev(a, b) <= (a.length <= 4 ? 1 : 2); };
const dateOk = (was, now) => !was || (!!now && Math.abs(Date.parse(now) - Date.parse(was)) <= DAYS * 864e5);
// bản chốt = dữ liệu ngay trước thay đổi đầu tiên sau khi kích hoạt (= dữ liệu lúc kích hoạt)
const lockOf = (card) => (card.lock = card.lock || snap(card.data));

// Lỗi đầu tiên (chuỗi) nếu dữ liệu mới đổi tên / ngày quá mức cho phép; null nếu được.
function problem(card, data) {
  if (!activated(card) || card.lockOpen) return null;
  const L = lockOf(card);
  if (!nameOk(L.groom, data.groom.name)) return `Đã kích hoạt nên tên chú rể chỉ sửa được lỗi gõ nhỏ (đang là "${L.groom}"). Cần đổi hẳn tên, bạn nhắn hỗ trợ nhé.`;
  if (!nameOk(L.bride, data.bride.name)) return `Đã kích hoạt nên tên cô dâu chỉ sửa được lỗi gõ nhỏ (đang là "${L.bride}"). Cần đổi hẳn tên, bạn nhắn hỗ trợ nhé.`;
  if (!dateOk(L.date, data.date)) return `Đã kích hoạt nên ngày cưới chỉ dời được trong vòng ${DAYS} ngày quanh ${L.date.split('-').reverse().join('/')}. Cần đổi xa hơn, bạn nhắn hỗ trợ nhé.`;
  return null;
}
// Gọi SAU khi đã ghi dữ liệu mới (đã qua problem): tạo / bổ sung bản chốt.
function commit(card) {
  if (!activated(card)) return;
  const now = snap(card.data);
  if (!card.lock || card.lockOpen) { card.lock = now; delete card.lockOpen; return; }
  for (const k of ['groom', 'bride', 'date']) if (!card.lock[k] && now[k]) card.lock[k] = now[k];
}
// Đồng bộ từ sổ tay cưới sang thiệp: giá trị vượt mức cho phép thì giữ nguyên giá trị cũ của thiệp.
function clamp(card, data) {
  if (!activated(card) || card.lockOpen) return data;
  const L = lockOf(card);
  if (!nameOk(L.groom, data.groom.name)) data.groom.name = card.data.groom.name;
  if (!nameOk(L.bride, data.bride.name)) data.bride.name = card.data.bride.name;
  if (!dateOk(L.date, data.date)) data.date = card.data.date;
  return data;
}

module.exports = { problem, commit, clamp, activated, fold, lev };
