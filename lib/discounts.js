// Mã giảm giá (tab "Mã giảm giá" ở /admin). Lưu trong db.discounts:
// { code, type: 'amount' | 'percent', value, products: ['card','led','video'] (rỗng = mọi sản phẩm),
//   expiresAt: 'YYYY-MM-DD' | '' (hết ngày đó, giờ VN), limit: số lượt tối đa (0 = không giới hạn), active, note, createdAt }
// Mã cũ trong config.coupons ({ MÃ: số tiền }, chỉ cho thiệp) vẫn dùng được cho tới khi tạo mã cùng tên ở tab mới.
const { db } = require('./db');
const config = require('../config.json');
const { httpError, str } = require('./util');

const PRODUCT_KEYS = ['card', 'led', 'video'];
const norm = (c) => str(c, 30).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
const all = () => (Array.isArray(db.discounts) ? db.discounts : (db.discounts = []));

function find(code) {
  const c = norm(code);
  if (!c) return null;
  const d = all().find((x) => x.code === c);
  if (d) return d;
  const legacy = (config.coupons || {})[c];
  return legacy ? { code: c, type: 'amount', value: legacy, products: ['card'], expiresAt: '', limit: 0, active: true, legacy: true } : null;
}
const expired = (d, now = Date.now()) => !!d.expiresAt && now > Date.parse(`${d.expiresAt}T23:59:59.999+07:00`);
// số đơn đã thanh toán dùng mã (bỏ đơn đang xét)
const used = (code, exceptId) => db.orders.filter((o) => o.coupon === code && o.status === 'paid' && o.id !== exceptId).length;

// Số tiền được giảm cho giá `price`; % làm tròn tới nghìn đồng, không quá giá
function offFor(d, price) {
  const off = d.type === 'percent' ? Math.round((price * Math.min(100, d.value)) / 100 / 1000) * 1000 : d.value;
  return Math.max(0, Math.min(price, off));
}

// Kiểm tra mã dùng được cho đơn này không; trả về mã hoặc ném lỗi dễ hiểu cho khách
function check(code, product, orderId) {
  const d = find(code);
  if (!d || !d.active) throw httpError(400, 'Mã giảm giá không khả dụng');
  if (expired(d)) throw httpError(400, 'Mã giảm giá đã hết hạn');
  if (d.products && d.products.length && !d.products.includes(product)) {
    const names = { card: 'thiệp cưới', led: 'màn hình LED', video: 'slide / màn hình dạm ngõ' };
    throw httpError(400, `Mã này chỉ áp dụng cho ${d.products.map((p) => names[p]).join(', ')}`);
  }
  if (d.limit && used(d.code, orderId) >= d.limit) throw httpError(400, 'Mã giảm giá đã hết lượt dùng');
  return d;
}

// Dữ liệu quản trị gửi lên → mã hợp lệ
function clean(b, prev) {
  const code = norm(b.code !== undefined ? b.code : prev && prev.code);
  if (!code) throw httpError(400, 'Nhập mã (chữ không dấu, số, - hoặc _)');
  const type = b.type === 'percent' ? 'percent' : 'amount';
  const value = Math.round(Number(String(b.value ?? '').replace(/[^\d.]/g, '')) || 0);
  if (value <= 0) throw httpError(400, 'Nhập mức giảm lớn hơn 0');
  if (type === 'percent' && value > 100) throw httpError(400, 'Giảm theo % tối đa 100%');
  if (type === 'amount' && value > 1e7) throw httpError(400, 'Số tiền giảm quá lớn');
  const products = (Array.isArray(b.products) ? b.products : []).filter((p) => PRODUCT_KEYS.includes(p));
  return {
    code, type, value,
    products: products.length === PRODUCT_KEYS.length ? [] : products,
    expiresAt: /^\d{4}-\d{2}-\d{2}$/.test(b.expiresAt || '') ? b.expiresAt : '',
    limit: Math.max(0, Math.min(1e6, parseInt(b.limit, 10) || 0)),
    active: b.active !== false,
    note: str(b.note, 200),
    createdAt: (prev && prev.createdAt) || Date.now(),
  };
}

// Danh sách cho trang quản trị, kèm số lượt dùng và tiền đã giảm
function report() {
  const legacy = Object.entries(config.coupons || {}).filter(([c]) => !all().some((x) => x.code === c))
    .map(([code, value]) => ({ code, type: 'amount', value, products: ['card'], expiresAt: '', limit: 0, active: true, note: 'Mã cũ (Cài đặt)', legacy: true, createdAt: 0 }));
  return [...all(), ...legacy].map((d) => {
    const os = db.orders.filter((o) => o.coupon === d.code);
    const paid = os.filter((o) => o.status === 'paid');
    return {
      ...d, expired: expired(d),
      uses: paid.length, pending: os.filter((o) => o.status === 'pending').length,
      revenue: paid.reduce((n, o) => n + o.amount, 0), saved: paid.reduce((n, o) => n + (o.discount || 0), 0),
      lastUsedAt: paid.reduce((t, o) => Math.max(t, o.paidAt || 0), 0) || null,
    };
  }).sort((a, b) => b.createdAt - a.createdAt);
}

module.exports = { find, check, offFor, clean, report, all, norm, used, PRODUCT_KEYS };
