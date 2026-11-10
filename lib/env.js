// Nạp biến môi trường từ file .env (nếu có) — nơi đặt khoá bí mật như GOOGLE_CLIENT_SECRET, không đưa lên git.
// Biến đã đặt sẵn trong môi trường được giữ nguyên.
const envFile = require('path').join(__dirname, '..', '.env');
if (require('fs').existsSync(envFile)) process.loadEnvFile(envFile);

// Giá trị mặc định khi chạy trên Vercel (serverless). Phải được nạp trước mọi module khác.
// - Ổ đĩa Vercel chỉ cho ghi /tmp → dữ liệu đặt ở đó (KHÔNG bền: mất khi hàm khởi động lại).
// - BASE_URL lấy theo tên miền Vercel nếu chưa đặt biến môi trường.
if (process.env.VERCEL) {
  if (!process.env.DATA_DIR) process.env.DATA_DIR = '/tmp/cuoi-nha-data';
  if (!process.env.BASE_URL) {
    const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
    if (host) process.env.BASE_URL = `https://${host}`;
  }
}
