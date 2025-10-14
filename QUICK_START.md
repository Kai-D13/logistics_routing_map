# ⚡ QUICK START GUIDE

Hướng dẫn nhanh để chạy dự án trong 5 phút!

---

## 📋 Yêu Cầu

- ✅ Node.js v18 trở lên
- ✅ Tài khoản Supabase (miễn phí)
- ✅ Tài khoản Goong.io (miễn phí)

---

## 🚀 5 BƯỚC ĐỂ CHẠY

### BƯỚC 1: Clone & Install (1 phút)

```bash
# Clone repository
git clone <your-repo-url>
cd logistics-routing-system

# Install dependencies
npm install
```

### BƯỚC 2: Setup Supabase (2 phút)

1. Truy cập [supabase.com](https://supabase.com)
2. Tạo project mới (miễn phí)
3. Vào **SQL Editor**
4. Copy nội dung file `database/schema-v2.sql`
5. Paste và click **Run**
6. Vào **Settings** → **API** → Copy:
   - `Project URL`
   - `anon public key`

### BƯỚC 3: Get Goong API Keys (1 phút)

1. Truy cập [account.goong.io](https://account.goong.io)
2. Đăng ký tài khoản (miễn phí)
3. Vào **API Keys**
4. Copy:
   - `API Key`
   - `Maptiles Key`

### BƯỚC 4: Configure Environment (30 giây)

Tạo file `.env` trong thư mục gốc:

```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

GOONG_API_KEY=your_goong_api_key
GOONG_MAPTILES_KEY=your_goong_maptiles_key
```

### BƯỚC 5: Start Server (30 giây)

```bash
# Test database connection
npm run test:db

# Start server
npm start
```

Mở trình duyệt: **http://localhost:5000**

---

## ✅ KIỂM TRA

Nếu mọi thứ OK, bạn sẽ thấy:

✅ Bản đồ hiển thị  
✅ 1 Hub chính (Hub Cần Thơ)  
✅ Thống kê hiển thị số liệu  
✅ Danh sách locations  

---

## 🎯 SỬ DỤNG CƠ BẢN

### Thêm Hub Chính
1. Click nút **"➕ Thêm Hub Chính"**
2. Nhập tên: `Hub Hà Nội`
3. Nhập địa chỉ: `123 Đường ABC, Hà Nội`
4. Click **"Thêm Hub"**
5. Hệ thống tự động geocode và hiển thị trên bản đồ

### Thêm Điểm Giao Hàng
1. Click nút **"➕ Thêm Điểm Giao Hàng"**
2. Điền thông tin:
   - Tên Carrier: `NVCT Hub Hà Nội`
   - Địa chỉ: `456 Đường XYZ`
   - Phường/Xã: `Phường 1`
   - Quận/Huyện: `Quận Ba Đình`
   - Tỉnh: `Thành phố Hà Nội`
   - Chọn Hub chính
3. Click **"Thêm Điểm Giao Hàng"**
4. Hệ thống tự động:
   - Geocode địa chỉ
   - Tính khoảng cách từ Hub
   - Hiển thị trên bản đồ

### Xem Chi Tiết
- Click vào marker trên bản đồ
- Hoặc click vào item trong danh sách
- Xem thông tin đầy đủ và khoảng cách

### Tìm Kiếm
- Gõ tên hoặc tỉnh vào ô tìm kiếm
- Kết quả lọc real-time

---

## 🔧 TROUBLESHOOTING

### Lỗi: "Cannot connect to database"
```bash
# Kiểm tra .env file
# Đảm bảo SUPABASE_URL và SUPABASE_ANON_KEY đúng
npm run test:db
```

### Lỗi: "Geocoding failed"
```bash
# Kiểm tra GOONG_API_KEY
# Đảm bảo API key còn quota
```

### Lỗi: "Port 5000 already in use"
```bash
# Đổi PORT trong .env
PORT=3000
```

### Map không hiển thị
- Kiểm tra console browser (F12)
- Đảm bảo internet connection
- Clear cache và reload

---

## 📚 TÀI LIỆU THÊM

- [README.md](./README.md) - Tài liệu đầy đủ
- [API Documentation](./README.md#api-endpoints) - API endpoints
- [Deployment Guide](./DEPLOYMENT.md) - Hướng dẫn deploy
- [Contributing](./CONTRIBUTING.md) - Đóng góp code

---

## 💡 TIPS

### Import Dữ Liệu Mẫu
```bash
# Nếu bạn có file destination.json
npm run import:destinations
```

### Development Mode
```bash
# Auto-reload khi code thay đổi
npm run dev
```

### Update Coordinates
```bash
# Nếu có destinations chưa có tọa độ
npm run update:coordinates
```

---

## 🎉 DONE!

Bạn đã sẵn sàng sử dụng **Logistics Routing System**!

Nếu gặp vấn đề, hãy:
1. Kiểm tra lại các bước
2. Xem phần Troubleshooting
3. Đọc README.md
4. Tạo Issue trên GitHub

---

**Happy Routing! 🚀**

