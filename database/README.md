# 🗄️ Database Setup Guide

## 📋 Hướng dẫn tạo Database trên Supabase

### Bước 1: Mở Supabase SQL Editor

1. Truy cập: https://supabase.com/dashboard/project/attuecqofefmrjqtgzgo
2. Click vào **SQL Editor** ở sidebar bên trái
3. Click **New Query**

### Bước 2: Copy & Paste SQL Schema

1. Mở file `database/schema.sql`
2. Copy toàn bộ nội dung
3. Paste vào SQL Editor
4. Click **Run** (hoặc nhấn Ctrl+Enter)

### Bước 3: Kiểm tra kết quả

Sau khi chạy SQL, bạn sẽ thấy:
- ✅ Table `locations` đã được tạo
- ✅ 6 sample locations đã được insert (1 departer + 5 destinations)

### Bước 4: Xem dữ liệu

1. Click vào **Table Editor** ở sidebar
2. Chọn table `locations`
3. Bạn sẽ thấy 6 locations mẫu

---

## 🧪 Test Database Connection

Sau khi tạo xong database, chạy lệnh sau để test:

```bash
node backend/test-supabase.js
```

Kết quả mong đợi:
```
==================================================
🧪 Testing Supabase Connection
==================================================

📡 Test 1: Testing connection...
✅ Connection successful

📍 Test 2: Fetching all locations...
✅ Found 6 locations

📋 Locations:
   🏠 1. Hub Cần Thơ (departer)
      Address: Số 1 Đường 3/2, Xuân Khánh, Ninh Kiều, Cần Thơ
      Coordinates: 10.0452, 105.7469
      Distance: 0 km, Duration: 0 min
   📍 2. Hub Sa Đéc (destination)
      ...

✅ All tests completed!
```

---

## 📊 Database Schema

### Table: `locations`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `carrier_name` | VARCHAR(255) | Tên hiển thị của hub |
| `address` | TEXT | Địa chỉ đầy đủ |
| `latitude` | DECIMAL(10,8) | Vĩ độ |
| `longitude` | DECIMAL(11,8) | Kinh độ |
| `location_type` | VARCHAR(50) | 'departer' hoặc 'destination' |
| `distance_km` | DECIMAL(10,2) | Khoảng cách từ hub chính (km) |
| `duration_minutes` | INTEGER | Thời gian di chuyển (phút) |
| `is_active` | BOOLEAN | Trạng thái hoạt động |
| `created_at` | TIMESTAMP | Thời gian tạo |
| `updated_at` | TIMESTAMP | Thời gian cập nhật |
| `metadata` | JSONB | Thông tin bổ sung (JSON) |

---

## 🔧 Troubleshooting

### Lỗi: "relation 'locations' does not exist"
➡️ Bạn chưa chạy SQL schema. Hãy làm theo Bước 1-2 ở trên.

### Lỗi: "Invalid API key"
➡️ Kiểm tra lại `SUPABASE_URL` và `SUPABASE_ANON_KEY` trong file `.env`

### Lỗi: "Connection timeout"
➡️ Kiểm tra kết nối internet và firewall

---

## 📝 Thêm dữ liệu 30 locations

Sau khi test thành công, bạn có thể:

1. **Thêm thủ công qua Table Editor:**
   - Vào Table Editor → locations
   - Click "Insert row"
   - Điền thông tin

2. **Thêm bằng SQL:**
   ```sql
   INSERT INTO locations (carrier_name, address, latitude, longitude, location_type) 
   VALUES ('Hub Mới', 'Địa chỉ đầy đủ', 10.1234, 105.5678, 'destination');
   ```

3. **Thêm qua API (sẽ làm ở bước sau):**
   - Sử dụng form trên frontend
   - Tự động geocoding địa chỉ

---

**Tiếp theo:** Sau khi database setup xong, chúng ta sẽ tích hợp Goong API để geocoding và tính khoảng cách.

