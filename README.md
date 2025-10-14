# 🚚 Logistics Routing System

Hệ thống quản lý và tối ưu tuyến đường vận chuyển logistics với tích hợp Goong Maps API.

---

## ✨ **TÍNH NĂNG CHÍNH**

### 1. **📍 Quản Lý Locations**
- Quản lý Hub chính (Departers)
- Quản lý điểm giao hàng (Destinations)
- Hiển thị trên bản đồ với markers màu sắc:
  - 🟢 **Xanh lá**: Hub chính (Departer)
  - 🔴 **Đỏ**: Điểm giao hàng (Destination)

### 2. **📋 Route Management (Quản Lý Routes)**
- Tìm kiếm routes theo tên
- Xem lịch sử các chuyến đi (trips)
- Hiển thị chi tiết:
  - Thông tin chuyến đi (mã chuyến, tài xế, biển số xe)
  - Timeline giao hàng với thời gian thực tế
  - Số lượng đơn hàng, kiện hàng, bins
- Visualize route trên bản đồ:
  - Markers đánh số thứ tự (0, 1, 2, 3...)
  - Polyline nối các điểm
  - Popup hiển thị thông tin điểm

### 3. **🚀 VRP Optimization (Tối Ưu Tuyến Đường)**
- Chọn 1 điểm xuất phát (Departer)
- Chọn nhiều điểm đến (Multi-select destinations)
- Tối ưu thứ tự giao hàng:
  - **Primary**: Goong Trip V2 API (Professional)
  - **Fallback**: Nearest Neighbor Algorithm
- Hiển thị kết quả:
  - Tổng quãng đường (km)
  - Tổng thời gian (HH:MM)
  - Lộ trình chi tiết từng điểm
- Visualize trên bản đồ:
  - Markers đánh số (0: Xuất phát, 1-N: Điểm dừng)
  - Polyline màu tím với mũi tên chỉ hướng
  - Popup thông tin

### 4. **🧮 Tính Khoảng Cách Hub-to-Hub**
- Tính khoảng cách giữa 2 điểm bất kỳ
- Hỗ trợ 3 loại phương tiện:
  - 🚚 Xe tải (Truck)
  - 🚗 Xe hơi (Car)
  - 🏍️ Xe máy (Bike)
- Hiển thị:
  - Khoảng cách (km)
  - Thời gian di chuyển (HH:MM)

---

## 🛠️ **CÔNG NGHỆ SỬ DỤNG**

### **Backend:**
- Node.js + Express
- Supabase (PostgreSQL)
- Goong Maps API (Geocoding, Distance Matrix, Trip Optimization)

### **Frontend:**
- Vanilla JavaScript (ES6+)
- Leaflet.js (Interactive maps)
- Leaflet Polyline Decorator (Direction arrows)

### **Database:**
- PostgreSQL (via Supabase)
- Tables:
  - `departers` - Hub chính
  - `destinations` - Điểm giao hàng
  - `routes` - Khoảng cách giữa các điểm
  - `trips` - Thông tin chuyến đi
  - `trip_destinations` - Chi tiết điểm dừng trong chuyến

---

## 📦 **CÀI ĐẶT**

### **1. Clone Repository**
```bash
git clone <repository-url>
cd logistics-routing-system
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Cấu Hình Environment**
Tạo file `.env`:
```env
# Server
PORT=5000
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Goong API
GOONG_API_KEY=your_goong_api_key
GOONG_MAPTILES_KEY=your_goong_maptiles_key
```

### **4. Setup Database**
Chạy các file SQL trong thư mục `database/`:
1. `schema-v2.sql` - Tạo tables cơ bản
2. `migration-add-vehicle-type.sql` - Thêm vehicle_type column
3. `schema-trips.sql` - Tạo trips tables

### **5. Import Data**
```bash
# Import destinations
npm run import:destinations

# Update coordinates (geocoding)
npm run update:coordinates

# Import trips từ XLSX
npm run import:xlsx
```

### **6. Start Server**
```bash
npm start
```

Server sẽ chạy tại: **http://localhost:5000**

---

## 📖 **HƯỚNG DẪN SỬ DỤNG**

### **A. Route Management (Quản Lý Routes)**

1. Click tab **"📋 Quản Lý Routes"**
2. Chọn route từ dropdown
3. Xem chi tiết:
   - Thông tin chuyến đi
   - Timeline giao hàng
   - Route trên bản đồ

### **B. VRP Optimization (Tối Ưu Tuyến Đường)**

1. Click tab **"🚀 Tối Ưu VRP"**
2. Chọn điểm xuất phát
3. Chọn các điểm đến (có thể chọn nhiều)
4. Click **"🚀 Tối Ưu Tuyến Đường"**
5. Xem kết quả:
   - Tổng quãng đường, thời gian
   - Lộ trình chi tiết
   - Route trên bản đồ

### **C. Tính Khoảng Cách**

1. Click **"🧮 Tính Khoảng Cách"**
2. Chọn điểm xuất phát
3. Chọn điểm đến
4. Chọn loại phương tiện
5. Click **"🔍 Tính Toán"**

---

## 📊 **DỮ LIỆU**

### **Destinations (31 điểm)**
- NVCT Hub Sóc Trăng-CT
- NVCT Hub TP Bạc Liêu
- NVCT Hub Giá Rai - Bạc Liêu
- NVCT Hub Thành Phố Cà Mau_Child
- NVCT Hub Phước Long - Bạc Liêu
- ... (và 26 điểm khác)

### **Trips (454 chuyến)**
- Import từ file XLSX
- Mỗi trip có 2-6 destinations
- Tổng 1,703 điểm dừng

---

## 🎨 **GIAO DIỆN**

### **Màu Sắc:**
- **Departer**: 🟢 Xanh lá (#10b981)
- **Destination**: 🔴 Đỏ (#ef4444)
- **VRP Route**: 🟣 Tím (#8b5cf6)
- **Historical Route**: 🔵 Xanh dương (#3b82f6)

### **Icons:**
- 🏢 Hub chính
- 📍 Điểm giao hàng
- 📦 Đơn hàng
- 📫 Kiện hàng
- 🗃️ Bins
- 📏 Khoảng cách
- ⏱️ Thời gian

---

## 🔧 **SCRIPTS**

```bash
# Start server
npm start

# Import destinations
npm run import:destinations

# Update coordinates
npm run update:coordinates

# Import trips from XLSX
npm run import:xlsx

# Cleanup and reimport
npm run cleanup:reimport

# Update duplicate addresses
npm run update:duplicates
```

---

## 📁 **CẤU TRÚC THƯ MỤC**

```
logistics-routing-system/
├── backend/
│   ├── routes/          # API routes
│   │   ├── locations.js
│   │   ├── trips.js
│   │   └── vrp.js
│   ├── services/        # Business logic
│   │   ├── goong.service.js
│   │   └── supabase.service.js
│   ├── scripts/         # Data import scripts
│   │   ├── import-destinations.js
│   │   ├── import-xlsx-trips.js
│   │   └── update-coordinates.js
│   └── server.js        # Express server
├── frontend/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── api.js       # API client
│   │   ├── map.js       # Map initialization
│   │   ├── routes.js    # Route management
│   │   ├── vrp.js       # VRP optimization
│   │   ├── ui.js        # UI helpers
│   │   └── app.js       # Main app
│   └── index.html
├── database/
│   ├── schema-v2.sql
│   ├── schema-trips.sql
│   └── migrations/
├── departer_destination.xlsx  # Data source
├── package.json
└── .env
```

---

## 🚀 **ROADMAP**

### **Phase 1: ✅ COMPLETED**
- ✅ Basic map with markers
- ✅ Hub-to-Hub distance calculation
- ✅ Route management
- ✅ VRP optimization
- ✅ Import trips from XLSX

### **Phase 2: 🔄 IN PROGRESS**
- [ ] Real-time tracking
- [ ] Driver assignment
- [ ] Route history analytics
- [ ] Export reports (PDF, Excel)

### **Phase 3: 📋 PLANNED**
- [ ] Mobile app
- [ ] Push notifications
- [ ] Multi-depot VRP
- [ ] Time windows constraints
- [ ] Vehicle capacity constraints

---

## 🐛 **TROUBLESHOOTING**

### **Server không start:**
```bash
# Kill all node processes
taskkill /F /IM node.exe

# Restart
npm start
```

### **Map không hiển thị:**
- Kiểm tra Goong API key
- Kiểm tra console browser

### **Import XLSX lỗi:**
- Kiểm tra file path
- Kiểm tra encoding (UTF-8)

---

## 📞 **SUPPORT**

- **Email**: support@logistics-routing.com
- **GitHub Issues**: [Create Issue](https://github.com/your-repo/issues)

---

## 📄 **LICENSE**

MIT License - Copyright (c) 2025

---

**Developed with ❤️ by Logistics Team**

