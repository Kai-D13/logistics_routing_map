# 📋 ROUTE MANAGEMENT SYSTEM - IMPLEMENTATION PLAN

## ✅ **ĐÃ XÁC NHẬN VỚI USER**

### **1. Database Schema: Option B** ✅
- Tạo bảng mới `route_schedules` (không ảnh hưởng dữ liệu cũ)
- Bảng `hub_tiers` để quản lý phân cấp hubs
- Views để aggregate data

### **2. UI/UX** ✅
- **Tab "Tạo Route Mới"**: Rất quan trọng - User tự tạo/tối ưu routes
- **Tab "Chỉnh Sửa Route"**: Rất quan trọng - User sửa routes chưa tối ưu
- **Tab "Tìm Kiếm Route"**: Search và filter routes

### **3. Business Logic** ✅
- Route có thể xuất hiện nhiều lần (mapping 1-to-many)
- Không có route trùng tên
- Hỗ trợ multi-tier hub system

### **4. Map Display** ✅
- Chỉ hiển thị khi user chọn route
- Hỗ trợ chọn nhiều routes để so sánh
- Polyline với arrows chỉ direction

---

## 📊 **PHÂN TÍCH DỮ LIỆU ROUTE.JSON**

### **Thống kê:**
```
Total Segments: 214
Unique Routes: 47
Unique Departers: 5
Unique Destinations: 171

Note Distribution:
  D: 127 segments (59%)
  D+1: 29 segments (14%)
  Ngày D+1: 58 segments (27%)
```

### **Hub Departer Analysis:**

| Hub Departer | Routes | Destinations | Tier |
|--------------|--------|--------------|------|
| Hub VSIP II | 21 | 58 | 1 (Primary) |
| Hub VSIP Bắc Ninh | 10 | 68 | 1 (Primary) |
| Hub Cần Thơ | 14 | 37 | 1 (Primary) |
| NVCT Hub Thành Phố Cà Mau_Child | 1 | 5 | 2 (Secondary) |
| NVCT Hub Sóc Trăng-CT | 1 | 3 | 2 (Secondary) |

### **Secondary Hubs (Vừa là Departer, vừa là Destination):**

1. **Hub Cần Thơ**
   - As Departer: 52 segments
   - As Destination: 2 segments
   - Role: Primary Hub nhưng cũng nhận hàng từ VSIP

2. **NVCT Hub Thành Phố Cà Mau_Child**
   - As Departer: 5 segments
   - As Destination: 1 segment
   - Role: Nhận từ Cần Thơ → Phân phối đến Cà Mau area

3. **NVCT Hub Sóc Trăng-CT**
   - As Departer: 3 segments
   - As Destination: 2 segments
   - Role: Nhận từ Cần Thơ → Phân phối đến Sóc Trăng area

---

## 🏗️ **DATABASE SCHEMA**

### **Table: route_schedules**
```sql
CREATE TABLE route_schedules (
  id SERIAL PRIMARY KEY,
  route_name VARCHAR(255) NOT NULL,
  hub_departer VARCHAR(255) NOT NULL,
  hub_destination VARCHAR(255) NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  day_offset INTEGER DEFAULT 0,  -- 0=D, 1=D+1, 2=D+2
  distance_km DECIMAL(10, 2),
  duration_hours DECIMAL(10, 2),
  note VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Table: hub_tiers**
```sql
CREATE TABLE hub_tiers (
  id SERIAL PRIMARY KEY,
  hub_name VARCHAR(255) NOT NULL UNIQUE,
  tier INTEGER NOT NULL,  -- 1=Primary, 2=Secondary, 3=Final
  description TEXT
);
```

### **View: route_summary**
```sql
CREATE VIEW route_summary AS
SELECT 
  route_name,
  hub_departer,
  MIN(departure_time) as first_departure,
  COUNT(DISTINCT hub_destination) as total_destinations,
  SUM(distance_km) as total_distance_km,
  MAX(arrival_time) as last_arrival
FROM route_schedules
GROUP BY route_name, hub_departer;
```

---

## 🎯 **IMPLEMENTATION ROADMAP**

### **Phase 1: Database Setup** (CURRENT)
- [x] Analyze route.json structure
- [x] Design database schema
- [x] Create import script
- [x] Generate SQL files
- [ ] Run schema-routes.sql on Supabase
- [ ] Run import-routes.sql on Supabase
- [ ] Verify data import

### **Phase 2: Backend API**
- [ ] Create routes API endpoints
  - `GET /api/routes` - List all routes
  - `GET /api/routes/:id` - Get route details
  - `GET /api/routes/search` - Search routes
  - `POST /api/routes` - Create new route
  - `PUT /api/routes/:id` - Update route
  - `DELETE /api/routes/:id` - Delete route
- [ ] Create route segments API
  - `GET /api/routes/:id/segments` - Get route segments
  - `POST /api/routes/:id/segments` - Add segment
  - `PUT /api/routes/:id/segments/:segmentId` - Update segment
  - `DELETE /api/routes/:id/segments/:segmentId` - Delete segment

### **Phase 3: Frontend - Route Search Tab**
- [ ] Create route search UI
- [ ] Implement filters (departer, route name, date)
- [ ] Display route list with summary
- [ ] "Hiển Thị Trên Map" button
- [ ] Map integration (show only selected routes)
- [ ] Multi-route comparison

### **Phase 4: Frontend - Route Details Tab**
- [ ] Route detail view
- [ ] Timeline visualization
- [ ] Segment list with timing
- [ ] Export to JSON/Excel/PDF

### **Phase 5: Frontend - Create Route Tab**
- [ ] Route creation form
- [ ] Hub selection (departer + destinations)
- [ ] Drag-and-drop ordering
- [ ] Time input for each segment
- [ ] Auto-calculate distance using Goong API
- [ ] Preview on map
- [ ] Save route

### **Phase 6: Frontend - Edit Route Tab**
- [ ] Load existing route
- [ ] Edit route name
- [ ] Add/remove/reorder segments
- [ ] Update timing
- [ ] Recalculate distances
- [ ] Save changes

### **Phase 7: Advanced Features**
- [ ] Route optimization suggestions
- [ ] Conflict detection (overlapping times)
- [ ] Route analytics dashboard
- [ ] Export/Import routes
- [ ] Route templates

---

## 🗺️ **MAP DISPLAY LOGIC**

### **Default State (No Route Selected):**
```javascript
// Empty map, no markers
map.setView([10.8231, 106.6297], 6);
```

### **When Route Selected:**
```javascript
// 1. Clear map
clearAllMarkers();
clearAllPolylines();

// 2. Get route segments
const segments = await API.getRouteSegments(routeId);

// 3. Add departer marker (RED)
addDeparterMarker(segments[0].hub_departer);

// 4. Add destination markers (GREEN) with sequence numbers
segments.forEach((seg, index) => {
  addDestinationMarker(seg.hub_destination, {
    label: index + 1,
    popup: `
      ${index + 1}. ${seg.hub_destination}
      ⏰ ${seg.arrival_time} (${seg.note})
      📏 ${seg.distance_km} km
    `
  });
});

// 5. Draw polyline with arrows
const waypoints = [
  segments[0].hub_departer,
  ...segments.map(s => s.hub_destination)
];
drawRoutePolyline(waypoints, {
  color: '#3b82f6',
  weight: 4,
  arrows: true
});

// 6. Fit bounds
map.fitBounds(getAllMarkerBounds());
```

### **Multi-Route Comparison:**
```javascript
// Different colors for each route
const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

selectedRoutes.forEach((route, index) => {
  drawRoutePolyline(route.waypoints, {
    color: colors[index % colors.length],
    weight: 3,
    opacity: 0.7
  });
});
```

---

## 📁 **FILES CREATED**

1. **`database/schema-routes.sql`** - Database schema
2. **`database/import-routes.sql`** - Import data SQL (214 segments)
3. **`backend/scripts/import-routes.js`** - Analysis & SQL generator
4. **`database/ROUTE_MANAGEMENT_PLAN.md`** - This file

---

## 🚀 **NEXT STEPS**

### **Immediate Actions:**

1. **Run Schema SQL:**
```powershell
Get-Content database\schema-routes.sql | Set-Clipboard
```
Paste vào Supabase SQL Editor và Run.

2. **Run Import SQL:**
```powershell
Get-Content database\import-routes.sql | Set-Clipboard
```
Paste vào Supabase SQL Editor và Run.

3. **Verify Import:**
```sql
SELECT COUNT(*) FROM route_schedules;  -- Should be 214
SELECT COUNT(DISTINCT route_name) FROM route_schedules;  -- Should be 47
SELECT * FROM route_summary LIMIT 10;
```

### **Questions for User:**

1. **Distance Calculation:**
   - Có cần tự động tính `distance_km` và `duration_hours` bằng Goong API không?
   - Hay user sẽ nhập manual?

2. **Route Validation:**
   - Có cần validate timing conflicts không? (VD: 2 routes cùng departer, cùng thời gian)
   - Có cần validate hub existence không? (Hub phải tồn tại trong destinations table)

3. **UI Priority:**
   - Tab nào cần implement trước: Search, Create, hay Edit?
   - Có cần route analytics dashboard không?

---

**🎯 READY TO PROCEED WITH PHASE 1!**

