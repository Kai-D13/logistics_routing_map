# 📁 Database Directory

## 📊 **Data Files**

### **1. route.json**
- **Purpose:** Route data với 214 segments, 47 routes
- **Status:** ✅ Active - Đã import vào database
- **Schema:**
  ```json
  {
    "hub_departer": "Hub VSIP II",
    "route_name": "VSIP - Đồng Nai - Vũng Tàu R1",
    "hub_destination": "KTLS Bửu Hòa - Đồng Nai",
    "Giờ xuất phát": "01:00:00",
    "Giờ đến hub destination": "01:50:00",
    "tổng quãng đường": null,
    "tổng thời gian": null,
    "note": "D"
  }
  ```

### **2. new_marker.json**
- **Purpose:** Hub data với 178 hubs (3 departers + 175 destinations)
- **Status:** ✅ Active - Đã import vào database
- **Schema:**
  ```json
  {
    "carrier_name": "Hub VSIP II",
    "Hub_name": "Hub VSIP II",
    "address": "18 L2-1, Đường Tạo Lực 5...",
    "ward_name": "Phường Hoà Phú",
    "district_name": "Thành phố Thủ Dầu Một",
    "province_name": "Tỉnh Bình Dương",
    "destination": "departer",
    "latitude": 11.075138,
    "longitude": 106.688543,
    "departer": ""
  }
  ```

---

## 🗄️ **SQL Scripts**

### **Setup Scripts**

#### **force-clean.sql**
- **Purpose:** Xóa sạch TẤT CẢ route management objects
- **Usage:**
  ```powershell
  Get-Content database\force-clean.sql | Set-Clipboard
  # Paste vào Supabase SQL Editor và Run
  ```
- **What it does:**
  - Drop all views (route_summary, hub_connections)
  - Drop all functions (calculate_actual_arrival)
  - Drop all constraints (unique_route_segment)
  - Drop all indexes
  - Drop all tables (route_schedules, hub_tiers)

#### **create-schema.sql**
- **Purpose:** Tạo schema mới cho route management
- **Usage:**
  ```powershell
  Get-Content database\create-schema.sql | Set-Clipboard
  # Paste vào Supabase SQL Editor và Run
  ```
- **What it creates:**
  - Table: `route_schedules` (214 segments)
  - Table: `hub_tiers` (5 hubs)
  - View: `route_summary`
  - View: `hub_connections`
  - Function: `calculate_actual_arrival()`

#### **import-routes.sql**
- **Purpose:** Import 214 route segments từ route.json
- **Usage:**
  ```powershell
  Get-Content database\import-routes.sql | Set-Clipboard
  # Paste vào Supabase SQL Editor và Run
  ```
- **Result:**
  - 214 segments imported
  - 47 unique routes
  - 5 departers
  - 171 destinations

---

## 📋 **Documentation**

### **ROUTE_MANAGEMENT_PLAN.md**
- **Purpose:** Full implementation plan cho Route Management System
- **Content:**
  - Phase 1: Database Setup ✅ COMPLETE
  - Phase 2: Backend API (Next)
  - Phase 3: Frontend - Route Search Tab
  - Phase 4: Frontend - Route Details Tab
  - Phase 5: Frontend - Create Route Tab
  - Phase 6: Frontend - Edit Route Tab
  - Phase 7: Advanced Features

---

## 🚀 **Quick Start**

### **Setup Database (First Time)**

```powershell
# Step 1: Clean database
Get-Content database\force-clean.sql | Set-Clipboard
# Paste vào Supabase → Run

# Step 2: Create schema
Get-Content database\create-schema.sql | Set-Clipboard
# Paste vào Supabase → Run

# Step 3: Import routes
Get-Content database\import-routes.sql | Set-Clipboard
# Paste vào Supabase → Run
```

### **Verify Data**

```sql
-- Check total segments
SELECT COUNT(*) FROM route_schedules;
-- Expected: 214

-- Check unique routes
SELECT COUNT(DISTINCT route_name) FROM route_schedules;
-- Expected: 47

-- Check route summary
SELECT * FROM route_summary LIMIT 10;

-- Check hub connections
SELECT * FROM hub_connections WHERE hub_name LIKE '%Cà Mau%';
```

---

## 📊 **Database Schema**

### **Tables**

#### **route_schedules**
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

#### **hub_tiers**
```sql
CREATE TABLE hub_tiers (
  id SERIAL PRIMARY KEY,
  hub_name VARCHAR(255) NOT NULL UNIQUE,
  tier INTEGER NOT NULL,  -- 1=Primary, 2=Secondary, 3=Final
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Views**

#### **route_summary**
- Aggregate route information
- Shows: route_name, hub_departer, first_departure, total_destinations, etc.

#### **hub_connections**
- Shows all connections for each hub
- Direction: INBOUND / OUTBOUND

### **Functions**

#### **calculate_actual_arrival(departure_time, arrival_time, day_offset)**
- Calculates actual arrival interval
- Handles overnight deliveries
- Handles D+1, D+2 offsets

---

## 📈 **Statistics**

### **Route Data**
- Total Segments: **214**
- Unique Routes: **47**
- Unique Departers: **5**
- Unique Destinations: **171**

### **Hub Hierarchy**
- **Tier 1 (Primary):** 3 hubs
  - Hub VSIP II
  - Hub VSIP Bắc Ninh
  - Hub Cần Thơ
- **Tier 2 (Secondary):** 2 hubs
  - NVCT Hub Thành Phố Cà Mau_Child
  - NVCT Hub Sóc Trăng-CT
- **Tier 3 (Final):** 166 hubs

### **Note Distribution**
- D (same day): 127 segments (59%)
- D+1 (next day): 87 segments (41%)

---

## 🔄 **Maintenance**

### **Reset Database**
```powershell
# Clean all
Get-Content database\force-clean.sql | Set-Clipboard

# Recreate schema
Get-Content database\create-schema.sql | Set-Clipboard

# Reimport data
Get-Content database\import-routes.sql | Set-Clipboard
```

### **Update Route Data**
1. Edit `route.json`
2. Run `backend/scripts/import-routes.js` to regenerate SQL
3. Run `import-routes.sql` on Supabase

---

## 📞 **Support**

For issues or questions, refer to:
- `ROUTE_MANAGEMENT_PLAN.md` - Full implementation plan
- Backend scripts in `backend/scripts/`
- Frontend code in `frontend/js/`

---

**Last Updated:** Phase 1 Complete ✅

