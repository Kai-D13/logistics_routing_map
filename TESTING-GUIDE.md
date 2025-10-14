# 🧪 HƯỚNG DẪN KIỂM TRA ROUTE SEGMENTS

## ✅ TRẠNG THÁI:

- ✅ Server đang chạy: http://localhost:5000
- ✅ Database có 44 segments
- ✅ 12 routes đã được import
- ✅ API endpoints hoạt động

---

## 📋 DANH SÁCH ROUTES CÓ TRONG DATABASE:

1. Cần Thơ - An Thới - Phú Quốc R1
2. **Cần Thơ - Bạc Liêu - Sóc Trăng R1** ⭐ (Đề xuất test route này)
3. Cần Thơ - Hậu Giang - Sóc Trăng - Bạc Liêu - Giá Rai - Phước Long - Vĩnh Tường
4. Cần Thơ - Long Xuyên - Phú Tân - Châu Đốc - Tịnh Biên - Thốt Nốt R1
5. Cần Thơ - Rạch Giá - An Minh - Kiên Lương - Giồng Riềng - Vĩnh Tường R1
6. Cần Thơ - Sa Đéc - Cao Lãnh - Hồng Ngự R1
7. Cần Thơ - Sa Đéc - Vĩnh Long R2
8. Cần Thơ - Thới Bình - Cà Mau - Giá Rai - Phước Long - Hậu Giang R1
9. Cần Thơ - Thốt Nốt - Long Xuyên - Phú Tân - Châu Đốc - Tịnh Biên R2
10. Cần Thơ - Tiểu Cần
11. Cần Thơ - Vĩnh Tường - Giồng Riềng - Rạch Giá R2
12. Cần Thơ - Vũng Liêm - Trà Vinh - Duyên Hải - Tiểu Cần R1

---

## 🧪 BƯỚC KIỂM TRA:

### **Bước 1: Mở Browser**
- URL: http://localhost:5000
- Nếu trang không load, kiểm tra server đang chạy

### **Bước 2: Click Tab "Quản Lý Routes"**
- Tab thứ 2 từ trái sang

### **Bước 3: Chọn Route**
- Dropdown: "-- Chọn Route --"
- Chọn: **"Cần Thơ - Bạc Liêu - Sóc Trăng R1"**

### **Bước 4: Kiểm Tra Route Info**

**Phải hiển thị:**
```
📍 Route: Cần Thơ - Bạc Liêu - Sóc Trăng R1
🕐 Giờ xuất phát: 23:30:00 (hoặc tương tự)
📏 Tổng quãng đường: XX.XX km
⏱️ Tổng thời gian: Xh Ym
```

**KHÔNG được hiển thị:**
- ❌ Mã chuyến
- ❌ Tài xế
- ❌ Biển số
- ❌ Trạng thái

### **Bước 5: Kiểm Tra Timeline**

**Phải có:**

1. **Hub Departer (Marker #0)**
   ```
   🏢 Hub Chính Cần Thơ
   🕐 Xuất phát: 23:30:00
   ```

2. **Destination 1 (Marker #1)**
   ```
   📍 NVCT Hub Sóc Trăng-CT
   📏 XX.XX km | ⏱️ XX phút | 🕐 Đến: HH:MM
   📦 X đơn | 📫 Y kiện | 🗃️ Z bins
   📊 Dữ liệu từ XX chuyến
   ```

3. **Destination 2 (Marker #2)**
   ```
   📍 NVCT Hub TP Bạc Liêu
   📏 XX.XX km | ⏱️ XX phút | 🕐 Đến: HH:MM
   📦 X đơn | 📫 Y kiện | 🗃️ Z bins
   📊 Dữ liệu từ XX chuyến
   ```

4. **Summary Card (Cuối cùng)**
   ```
   ═══════════════════════════════════════
   📊 SUMMARY CARD (Purple gradient background)
   ═══════════════════════════════════════
   📏 Tổng quãng đường: XX.XX km
   ⏱️ Tổng thời gian: Xh Ym
   ```

### **Bước 6: Kiểm Tra Map**

**Phải có:**
- 🟢 **Green marker #0** - Hub Chính Cần Thơ
- 🔴 **Red marker #1** - NVCT Hub Sóc Trăng-CT
- 🔴 **Red marker #2** - NVCT Hub TP Bạc Liêu
- 🔵 **Blue dashed polyline** connecting all markers
- ➡️ **Arrows** showing direction
- 🗺️ **Auto-zoom** to fit all markers

---

## 🐛 NẾU CÓ LỖI:

### **Lỗi 1: "can't reach this page"**
**Nguyên nhân:** Server không chạy

**Giải pháp:**
```bash
npm start
```

### **Lỗi 2: Dropdown không có routes**
**Nguyên nhân:** API `/api/trips/routes` không hoạt động

**Kiểm tra:**
1. Mở Console (F12)
2. Xem có lỗi gì không
3. Test API: http://localhost:5000/api/trips/routes

### **Lỗi 3: Chọn route nhưng không hiển thị gì**
**Nguyên nhân:** API `/api/route-segments/:route_name` không hoạt động

**Kiểm tra:**
1. Mở Console (F12)
2. Xem có lỗi gì không
3. Test API: http://localhost:5000/api/route-segments/Cần%20Thơ%20-%20Bạc%20Liêu%20-%20Sóc%20Trăng%20R1

### **Lỗi 4: Hiển thị nhưng không có data**
**Nguyên nhân:** Database không có data

**Kiểm tra:**
```bash
node backend/scripts/check-route-segments.js
```

**Nếu không có data, chạy:**
```bash
node backend/scripts/calculate-segment-distances.js
```

### **Lỗi 5: Map không hiển thị markers**
**Nguyên nhân:** Coordinates không đúng hoặc API không fetch được locations

**Kiểm tra Console (F12)** xem có lỗi gì

---

## 🧪 TEST API TRỰC TIẾP:

### **Test 1: Get all routes**
```
http://localhost:5000/api/trips/routes
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "data": [
    "Cần Thơ - An Thới - Phú Quốc R1",
    "Cần Thơ - Bạc Liêu - Sóc Trăng R1",
    ...
  ]
}
```

### **Test 2: Get route segments**
```
http://localhost:5000/api/route-segments/Cần%20Thơ%20-%20Bạc%20Liêu%20-%20Sóc%20Trăng%20R1
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "data": [
    {
      "route_name": "Cần Thơ - Bạc Liêu - Sóc Trăng R1",
      "segment_order": 0,
      "from_location_name": "Hub Chính Cần Thơ",
      "to_location_name": "NVCT Hub Sóc Trăng-CT",
      "distance_km": "74.11",
      "avg_duration_minutes": XX,
      "start_time": "23:30:00",
      "avg_orders": X,
      "avg_packages": Y,
      "avg_bins": Z,
      "sample_size": 37
    },
    {
      "segment_order": 1,
      "from_location_name": "NVCT Hub Sóc Trăng-CT",
      "to_location_name": "NVCT Hub TP Bạc Liêu",
      "distance_km": "40.56",
      "avg_duration_minutes": YY,
      ...
    }
  ]
}
```

---

## 📊 DỮ LIỆU MẪU:

### **Route: "Cần Thơ - Bạc Liêu - Sóc Trăng R1"**

**Segment 0:**
- From: Hub Chính Cần Thơ
- To: NVCT Hub Sóc Trăng-CT
- Distance: 74.11 km
- Start time: 23:30:00
- Sample size: 37 trips

**Segment 1:**
- From: NVCT Hub Sóc Trăng-CT
- To: NVCT Hub TP Bạc Liêu
- Distance: 40.56 km
- Sample size: 37 trips

**Total:**
- Distance: 114.67 km
- Duration: (calculated from segments)

---

## ✅ CHECKLIST:

- [ ] Server đang chạy (http://localhost:5000)
- [ ] Tab "Quản Lý Routes" mở được
- [ ] Dropdown có danh sách routes
- [ ] Chọn route hiển thị route info
- [ ] Route info KHÔNG có "Mã chuyến", "Tài xế", "Biển số"
- [ ] Timeline hiển thị Hub departer
- [ ] Timeline hiển thị destinations với metrics
- [ ] Mỗi destination có: distance, duration, arrival time, cargo, sample size
- [ ] Summary card hiển thị ở cuối
- [ ] Map hiển thị markers (green #0, red #1, #2)
- [ ] Map hiển thị polyline với arrows
- [ ] Map auto-zoom to fit

---

## 🎯 NEXT STEPS:

Sau khi test xong và confirm mọi thứ hoạt động:

1. ✅ Test thêm 2-3 routes khác
2. ✅ Verify data accuracy (so sánh với Excel)
3. ✅ Check responsive design (mobile/tablet)
4. ✅ Move to VRP tab (theo yêu cầu của user)

---

**🚀 READY TO TEST!**

