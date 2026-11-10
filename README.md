# Cưới Nha — nền tảng thiệp cưới online

Khách tự tạo thiệp, mời khách bằng link có tên riêng, nhận xác nhận tham dự, lời chúc và mừng cưới qua QR.
Chạy bằng Node.js 18+, **không cần cài thư viện nào**.

## Chạy thử

```bash
node server.js
```

Mở http://localhost:3210. **Tài khoản đăng ký đầu tiên tự động là quản trị viên** (vào được `/quan-tri`).

Chạy kiểm thử toàn bộ luồng:

```bash
node test/smoke.js
```

## Cấu hình — `config.json`

| Khóa | Ý nghĩa |
|---|---|
| `brand`, `tagline` | Tên thương hiệu ("Cưới Nha") và khẩu hiệu |
| `baseUrl` | Địa chỉ web thật, ví dụ `https://tenmien.vn` (dùng cho link chia sẻ và ảnh xem trước Zalo) |
| `price` | Giá kích hoạt một thiệp (VNĐ) |
| `ledPrice` | Giá kích hoạt màn hình LED (VNĐ) — mã giảm giá không áp dụng |
| `videoPrice` | Giá kích hoạt video dạm ngõ (VNĐ) — mã giảm giá không áp dụng |
| `ffmpegPath` | Lệnh ffmpeg để xuất MP4 (mặc định `ffmpeg` trong PATH) |
| `trialDays`, `trialGuestLimit` | Bản dùng thử: số ngày hiệu lực sau khi phát hành, số khách tối đa |
| `coupons` | Mã giảm giá: `{ "MA": số tiền giảm }` |
| `payment` | **Tài khoản nhận tiền của bạn** — BIN ngân hàng (xem `lib/banks.js`), số TK, tên chủ TK |
| `support` | Zalo/email hỗ trợ hiện ở chân trang |

Biến môi trường ghi đè: `PORT`, `BASE_URL`, `DATA_DIR`. Đặt chúng (và khoá bí mật) trong file `.env` ở thư mục gốc — xem `.env.example`; file này không được đưa lên git.

### Đăng nhập Google

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **Create credentials → OAuth client ID** → loại **Web application** (lần đầu cần cấu hình *OAuth consent screen*, chọn *External*).
2. **Authorized redirect URIs**: `http://localhost:3210/auth/google/callback` khi chạy máy mình, và `<baseUrl>/auth/google/callback` khi chạy thật.
3. Điền `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` vào `.env` (trên Vercel: Settings → Environment Variables), khởi động lại server. Nút "Tiếp tục với Google" tự hiện ở `/dang-nhap`.

Tài khoản Google trùng email với tài khoản đăng ký bằng mật khẩu sẽ được gộp làm một.

## Cấu trúc

```
server.js            API + định tuyến + trang thiệp
lib/
  db.js              lưu dữ liệu vào data/db.json (ghi nguyên tử)
  auth.js            tài khoản, mật khẩu scrypt, phiên đăng nhập cookie
  carddata.js        cấu trúc nội dung thiệp, dữ liệu mẫu, lọc dữ liệu đầu vào
  render.js          dựng HTML trang thiệp (server-side để Zalo/Facebook hiện ảnh xem trước)
  lunar.js           đổi dương lịch → âm lịch (can chi)
  banks.js           mã BIN ngân hàng VietQR
templates/           mỗi mẫu thiệp = 1 file (bảng màu, trang bìa, phong bì, CSS)
  _orn.js            kho họa tiết SVG dùng chung (lá, hoa, rồng phượng, hạc, hồi văn, góc baroque, damask, vân đá, ren…)
public/
  index.html         trang chủ (giới thiệu, mẫu, bảng giá, hỏi đáp)
  auth.html          đăng nhập / đăng ký           → /dang-nhap
  dashboard.html     danh sách thiệp               → /thiep-cua-toi
  editor.html        trình sửa + xem trước         → /sua/:id
  pay.html           trang thanh toán hộ           → /thanh-toan/:mã
  admin.html         xác nhận đơn, thống kê        → /quan-tri
  card/              CSS + JS chạy trên trang thiệp của khách
data/                dữ liệu + ảnh tải lên (không đưa lên git — nhớ sao lưu!)
```

Link thiệp: `/t/:duong-dan` (link chung) và `/t/:duong-dan/:mã-khách` (link có tên khách). Xem mẫu: `/demo/dodam`.

## Mẫu thiệp

Nhóm phong cách khai báo ở `groups` trong `lib/render.js` (hiện ở bộ lọc trang chủ và trình chỉnh sửa).

| Nhóm | Mẫu (`id`) |
|---|---|
| Tối giản | Đỏ Đậm (`dodam`, mẫu mặc định) |
| Truyền thống | Long Phụng (`longphung`) |

Xem nhanh: `/demo/<id>?palette=<id bảng màu>`. Mọi họa tiết đều vẽ bằng SVG/CSS và tô bằng biến màu (`var(--accent)`, `var(--gold)`…), nên đổi bảng màu là họa tiết đổi theo — không có file ảnh nào.

### Thêm / sửa mẫu

Sao chép một mẫu gần giống (ví dụ `templates/dodam.js`), đổi `id`, `name`, `group`, `desc`, `palettes`, `title()`, `cover()`, `opener()` (phải có `#opener` và nút `#openBtn`), `css` (scope bằng `.tpl-<id>`), rồi khai báo trong `lib/render.js` (đối tượng `templates`). Họa tiết lấy từ `templates/_orn.js`. Các phần lời mời, lịch trình, bản đồ, RSVP, QR, lưu bút dùng chung — mẫu mới chỉ cần lo phần nhìn. `test/smoke.js` tự kiểm tra mọi mẫu × mọi bảng màu.

Khi chạy thử nên dùng `node --watch server.js` để sửa mẫu là trang tự nạp lại.

## Thanh toán

Hiện tại: khách quét VietQR chuyển khoản với nội dung là mã đơn (`THxxxxxx`) → bấm "Tôi đã chuyển khoản" → bạn vào `/quan-tri` đối chiếu app ngân hàng và bấm **Xác nhận**.

Tự động hoá sau này: đăng ký PayOS hoặc Casso (đọc biến động số dư), nhận webhook rồi gọi đúng logic của `POST /api/admin/orders/:id/confirm` khi số tiền và nội dung khớp.

## Sổ tay cưới (miễn phí) — ĐÃ LÀM

`/so-tay` (app, PWA cài được lên điện thoại) và trang giới thiệu SEO `/so-tay-cuoi`.

- **Đám cưới** (`db.weddings`) là gốc: thông tin đôi, ngày cưới, miền, ngân sách tổng, thành viên. Mọi thiệp/LED/video gắn `weddingId`; sửa tên/ngày ở sổ tay hay ở thiệp đều đồng bộ hai chiều (`lib/wedding.js`).
- **Việc cần làm** (`db.tasks`): ~30 việc mẫu theo phong tục Bắc/Trung/Nam (tráp số lẻ / lễ vật / mâm quả số chẵn…), hạn chót tính từ ngày cưới (`offset` ngày). Đổi miền thì thay việc mẫu chưa làm, giữ việc tự thêm & đã xong. Một số việc có nút mua gắn sẵn (làm thiệp, màn LED, video).
- **Ngân sách** (`db.budget`): dự kiến / thực chi / đã trả theo hạng mục, so với tổng ngân sách và tiền mừng.
- **Khách mời** (`db.guests`, thuộc đám cưới — không còn thuộc thiệp): nhà trai/gái, nhóm, số người, đã mời, xác nhận, tiền mừng, xuất Excel. Khách xác nhận trên thiệp được ghi ngược vào danh sách (khớp link riêng → khớp tên → thêm mới). Thiệp chưa kích hoạt: `trialGuestLimit` khách đầu danh sách có link mang tên riêng.
- **Lịch âm**: ngày âm, can chi, chọn ngày cưới trên lịch.
- **Cùng sửa**: link mời `/tham-gia/:mã` cho người yêu, bố mẹ (tối đa 10 thành viên); thành viên sửa được cả thiệp chung.
- Dữ liệu cũ (khách gắn theo thiệp) tự chuyển khi khởi động — `test/migrate.js`.

## Định hướng: app chuẩn bị đám cưới

Sổ tay **miễn phí** làm phễu: checklist theo mốc thời gian (phong tục Bắc/Trung/Nam), ngân sách, danh sách khách + tiền mừng, xem ngày âm lịch, mời người yêu/bố mẹ cùng sửa. Sản phẩm **trả phí mua lẻ**: thiệp online, video dạm ngõ, màn LED, sơ đồ bàn/PDF, gói trọn bộ.

Thay đổi dữ liệu cần làm: thực thể gốc `wedding` (thành viên, thông tin đôi, ngày, sự kiện) — thiệp/LED/video đọc từ đây; khách mời thuộc `wedding` thay vì thuộc thiệp; thêm `tasks`, `budgetItems`; làm PWA. Thứ tự: sổ tay → thiệp nối danh sách khách → LED → video. Các dịp khác (mừng thọ, thôi nôi, tân gia…) để sau.

## Lộ trình sản phẩm bán kèm

Dùng lại dữ liệu thiệp (tên, ngày + âm lịch, bố mẹ) — nút "Tạo từ thiệp này", mỗi sản phẩm một trang đích SEO riêng.

1. ✅ **Màn hình LED tiệc cưới** — ĐÃ LÀM. Trang giới thiệu `/man-hinh-led-dam-cuoi`, trình sửa `/sua-led/:id`, trình chiếu `/led/:duong-dan` (mẫu: `/led/demo?ratio=9:16&effect=hoa&palette=hong`). 4 hiệu ứng (trời sao, đom đóm, cánh hoa, dải lụa), 5 bảng màu, 4 tỉ lệ, chỉnh mật độ/tốc độ/thời gian cảnh. Dùng thử `trialDays` ngày, kích hoạt `ledPrice` (mã đơn bắt đầu bằng `LD`). Code: `lib/led.js`, `public/led/`, `public/js/led-editor.js`.
2. ✅ **Video dạm ngõ chiếu TV** — ĐÃ LÀM. Trang giới thiệu `/video-dam-ngo`, trình sửa `/sua-video/:id`, trình chiếu `/video/:duong-dan` (mẫu: `/video/demo?template=dao&photo=1`). 3 mẫu (Sen vàng, Hoa đào, Mây cung đình) + ảnh cưới làm nền; sửa từng dòng (kiểu chữ, cỡ, màu); chữ dùng biến `{chu_re}`, `{ngay}`, `{am_lich}`… nên đổi thông tin là video tự cập nhật. Kích hoạt `videoPrice` (mã đơn `VD`). Code: `lib/video.js`, `public/video/engine.js`, `public/js/video-editor.js`.
3. ✅ **Xuất MP4 Full HD** — ĐÃ LÀM. Trình duyệt dựng từng khung hình và mã hoá H.264 bằng WebCodecs (nhanh, không cần giữ tab); trình duyệt cũ thì quay thời gian thực bằng MediaRecorder. Máy chủ chạy **ffmpeg** (`ffmpegPath` trong config) ra MP4 1920×1080 H.264, lặp 1 vòng / ~3 / ~10 phút, ghép nhạc nền MP3 của thiệp nếu có. **VPS cần cài ffmpeg** (`apt install ffmpeg`).

Tham khảo ý tưởng thị trường, tự thiết kế mẫu và hiệu ứng riêng.

## Đưa lên mạng

1. Thuê VPS nhỏ (1 CPU / 1GB RAM là đủ), cài Node 18+.
2. Sửa `config.json`: `baseUrl`, `payment`, `support`.
3. Chạy bằng `pm2 start server.js` (tự khởi động lại), đặt Nginx/Caddy phía trước để có HTTPS.
4. **Sao lưu thư mục `data/` hằng ngày** — toàn bộ thiệp và ảnh của khách nằm ở đó.

Khi vượt vài nghìn thiệp, thay `lib/db.js` bằng Postgres/Supabase và đưa ảnh lên kho lưu trữ (Cloudflare R2/S3).

## Chạy trên Vercel

Ổ đĩa của Vercel không giữ được dữ liệu, nên cần gắn hai kho lưu trữ (Vercel → dự án → **Storage**):

1. **Upstash Redis** (Marketplace) → *Connect* vào dự án. Vercel tự thêm `KV_REST_API_URL` và `KV_REST_API_TOKEN`; toàn bộ dữ liệu (tài khoản, thiệp, khách…) được lưu ở đây.
2. **Blob** → *Connect* vào dự án. Vercel tự thêm `BLOB_READ_WRITE_TOKEN`; ảnh và nhạc tải lên được lưu ở đây.
3. Deploy lại (Deployments → Redeploy) để nhận biến môi trường mới.

Không có hai biến trên thì app vẫn chạy nhưng dữ liệu chỉ nằm trong `/tmp` và sẽ mất. Giới hạn trên Vercel: tệp tải lên tối đa ~4,5 MB (nhạc MP3 lớn hơn sẽ bị từ chối) và chưa xuất được video MP4 (cần ffmpeg).
