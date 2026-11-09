// Điểm vào khi chạy trên Vercel (serverless).
// - Ổ đĩa của Vercel chỉ cho ghi vào /tmp, nên dữ liệu được đặt ở đó.
//   LƯU Ý: /tmp bị xoá khi hàm khởi động lại → dữ liệu không bền. Muốn lưu lâu dài
//   cần chuyển lib/db.js sang cơ sở dữ liệu thật (Postgres/Supabase...).
// - BASE_URL lấy theo tên miền Vercel nếu chưa đặt biến môi trường.
if (!process.env.DATA_DIR) process.env.DATA_DIR = '/tmp/cuoi-nha-data';
if (!process.env.BASE_URL) {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (host) process.env.BASE_URL = `https://${host}`;
}

const server = require('../server');

module.exports = (req, res) => server.emit('request', req, res);
