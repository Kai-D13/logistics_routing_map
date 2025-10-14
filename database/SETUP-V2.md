# 🗄️ Database Setup V2 - New Schema

## ⚠️ QUAN TRỌNG: Refactor Database Schema

Chúng ta đang chuyển từ schema cũ (1 table `locations`) sang schema mới (3 tables: `departers`, `destinations`, `routes`) theo tài liệu thiết kế.

---

## 📋 HƯỚNG DẪN SETUP DATABASE MỚI

### Bước 1: Mở Supabase SQL Editor

1. Truy cập: https://supabase.com/dashboard/project/attuecqofefmrjqtgzgo
2. Click vào **SQL Editor** ở sidebar bên trái
3. Click **New Query**

### Bước 2: Chạy Schema Mới

1. Mở file `database/schema-v2.sql`
2. Copy toàn bộ nội dung
3. Paste vào SQL Editor
4. Click **Run** (hoặc nhấn Ctrl+Enter)

**Lưu ý:** Script sẽ:
- ✅ Xóa table `locations` cũ (nếu có)
- ✅ Tạo 3 tables mới: `departers`, `destinations`, `routes`
- ✅ Tạo indexes để tối ưu performance
- ✅ Tạo triggers để auto-update timestamps
- ✅ Insert 1 departer mẫu (Hub Cần Thơ)

### Bước 3: Kiểm tra kết quả

Sau khi chạy SQL, vào **Table Editor** và kiểm tra:
- ✅ Table `departers` - có 1 row (Hub Cần Thơ)
- ✅ Table `destinations` - trống (sẽ import sau)
- ✅ Table `routes` - trống (sẽ tự động tạo khi import)

---

## 📦 IMPORT DỮ LIỆU TỪ JSON

Sau khi setup database xong, chạy script import:

```bash
node backend/scripts/import-destinations.js
```

Script sẽ:
1. ✅ Đọc file `database/destination.json` (30 destinations)
2. ✅ Geocode mỗi địa chỉ qua Goong API
3. ✅ Insert vào table `destinations`
4. ✅ Tính distance/duration từ Hub Cần Thơ
5. ✅ Insert vào table `routes`

**Thời gian ước tính:** ~30-40 phút (do rate limiting 1 request/giây)

---

## 🧪 TEST DATABASE

Sau khi import xong, test kết nối:

```bash
npm run test:db
```

Kết quả mong đợi:
```
✅ Supabase connected successfully
✅ Found 1 departers
✅ Found 30 destinations
✅ Found 30 routes
```

---

## 📊 SCHEMA MỚI

### Table: `departers`
```sql
- id: UUID (PK)
- name: VARCHAR(255)
- address: TEXT
- lat: DECIMAL(10,8)
- lng: DECIMAL(11,8)
- formatted_address: TEXT
- is_active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Table: `destinations`
```sql
- id: UUID (PK)
- carrier_name: VARCHAR(255)
- address: TEXT
- ward_name: VARCHAR(100)
- district_name: VARCHAR(100)
- province_name: VARCHAR(100)
- lat: DECIMAL(10,8)
- lng: DECIMAL(11,8)
- formatted_address: TEXT
- departer_id: UUID (FK → departers.id)
- is_active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- metadata: JSONB
```

### Table: `routes`
```sql
- id: UUID (PK)
- departer_id: UUID (FK → departers.id)
- destination_id: UUID (FK → destinations.id)
- distance_km: DECIMAL(8,2)
- distance_meters: INTEGER
- duration_minutes: INTEGER
- duration_seconds: INTEGER
- last_calculated: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- UNIQUE(departer_id, destination_id)
```

---

## 🔄 SO SÁNH SCHEMA CŨ VÀ MỚI

### Schema Cũ (1 table):
```
locations
├── id
├── carrier_name
├── address
├── latitude
├── longitude
├── location_type ('departer' | 'destination')
├── distance_km
├── duration_minutes
└── is_active
```

### Schema Mới (3 tables):
```
departers                destinations              routes
├── id                   ├── id                    ├── id
├── name                 ├── carrier_name          ├── departer_id (FK)
├── address              ├── address               ├── destination_id (FK)
├── lat                  ├── ward_name             ├── distance_km
├── lng                  ├── district_name         ├── distance_meters
├── formatted_address    ├── province_name         ├── duration_minutes
├── is_active            ├── lat                   ├── duration_seconds
├── created_at           ├── lng                   └── last_calculated
└── updated_at           ├── formatted_address
                         ├── departer_id (FK)
                         ├── is_active
                         ├── created_at
                         ├── updated_at
                         └── metadata
```

---

## ✅ LỢI ÍCH CỦA SCHEMA MỚI

1. **Tách biệt rõ ràng:** Departers và Destinations là 2 entities khác nhau
2. **Table Routes riêng:** Dễ cache, optimize, và recalculate
3. **Thêm thông tin hành chính:** Ward, District, Province
4. **Formatted address:** Địa chỉ chuẩn hóa từ Goong API
5. **Multi-departer ready:** Dễ dàng mở rộng cho nhiều hub chính
6. **Better indexing:** Tối ưu query performance

---

## 🔧 TROUBLESHOOTING

### Lỗi: "relation 'departers' does not exist"
➡️ Bạn chưa chạy `schema-v2.sql`. Hãy làm theo Bước 1-2.

### Lỗi: "Geocoding failed"
➡️ Kiểm tra `GOONG_API_KEY` trong file `.env`

### Import bị dừng giữa chừng
➡️ Script có rate limiting 1s/request. Hãy đợi hoặc chạy lại (script sẽ skip các destinations đã import)

---

**Tiếp theo:** Sau khi database setup xong, chúng ta sẽ tạo API routes và Frontend UI.

