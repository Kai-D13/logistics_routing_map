# 📘 Hub Editor - Frontend-Backend Synchronization Guide

## 🎯 Overview

Hub Editor module cho phép user chỉnh sửa thông tin hub (departer/destination) trực tiếp trên map với **đồng bộ hoàn toàn** giữa frontend và backend.

---

## 🔄 Sync Flow - Luồng Đồng Bộ

### **1. User Opens Edit Modal**

```
User clicks marker → Click "✏️ Sửa" button
  ↓
editHub(hubId, hubType) in map.js
  ↓
Find marker in departerMarkers or destinationMarkers
  ↓
HubEditor.openModal(marker.hubData, hubType, marker)
  ↓
Modal hiện ra với form đã điền sẵn thông tin
```

**Code:** `frontend/js/map.js` - Line 163-190

---

### **2. User Edits Information**

User có thể chỉnh sửa:
- ✅ **Tên Hub** (name hoặc carrier_name)
- ✅ **Địa Chỉ** (address)
- ✅ **Tỉnh/Thành Phố** (province_name - chỉ cho destination)
- ✅ **Vĩ Độ** (lat)
- ✅ **Kinh Độ** (lng)

**Interactive Features:**
- 🗺️ **Map Preview:** Hiển thị vị trí hiện tại với draggable marker
- 📍 **Geocoding:** Click "Lấy Tọa Độ Từ Địa Chỉ" để tự động lấy lat/lng từ address
- 🖱️ **Drag Marker:** Kéo marker trên map preview để update tọa độ

**Code:** `frontend/js/hub-editor.js` - Line 158-189

---

### **3. User Saves Changes**

```
User clicks "💾 Lưu Thay Đổi"
  ↓
Form submit event → HubEditor.saveHub()
  ↓
Validate form data (name, address, lat, lng)
  ↓
Prepare updateData object
  ↓
Call API.updateLocation(hubId, updateData)
  ↓
Backend saves to Supabase database
  ↓
Return success/error response
```

**Code:** `frontend/js/hub-editor.js` - Line 336-393

---

### **4. Backend Processing**

**API Endpoint:** `PUT /api/locations/:id`

**Backend Flow:**
```
Receive updateData from frontend
  ↓
If address changed → Auto geocode via Goong API
  ↓
Try update as destination first
  ↓
If not found → Try update as departer
  ↓
Update Supabase database
  ↓
Return updated data to frontend
```

**Code:** `backend/routes/locations.js` - Line 243-283

**Database Tables:**
- `departers` - Hub chính (starting points)
- `destinations` - Hub destination (waypoints)

---

### **5. Frontend Updates After Save**

**Sync Steps:**
```javascript
if (result.success) {
  // 1. Merge updated data with current hub data
  const updatedHub = { ...this.currentHub, ...updateData };
  
  // 2. Update marker position on map
  this.currentMarker.setLatLng([lat, lng]);
  
  // 3. Update marker's stored data
  this.currentMarker.hubData = updatedHub;
  
  // 4. Regenerate popup with new data + buttons
  this.currentMarker.setPopupContent(
    this.generatePopupContent(updatedHub, hubType)
  );
  
  // 5. Close modal
  this.closeModal();
  
  // 6. Reload map data from database (optional)
  if (typeof loadMapData === 'function') {
    loadMapData();
  }
}
```

**Code:** `frontend/js/hub-editor.js` - Line 370-392

---

## ✅ What Gets Synchronized

### **Frontend Updates:**
1. ✅ **Marker Position** - `marker.setLatLng([lat, lng])`
2. ✅ **Marker Data** - `marker.hubData = updatedHub`
3. ✅ **Popup Content** - Regenerated with new data + Edit/Details buttons
4. ✅ **Map Reload** - Optional full reload from database

### **Backend Updates:**
1. ✅ **Database Record** - Updated in Supabase
2. ✅ **Geocoding** - Auto-geocode if address changed
3. ✅ **Timestamps** - `updated_at` automatically updated

---

## 🔧 Key Components

### **1. HubEditor Module** (`frontend/js/hub-editor.js`)

**Properties:**
- `currentHub` - Current hub being edited
- `currentMarker` - Reference to Leaflet marker
- `previewMap` - Leaflet map for preview
- `previewMarker` - Draggable marker on preview map

**Methods:**
- `init()` - Initialize module and create modal
- `openModal(hubData, hubType, marker)` - Open edit modal
- `closeModal()` - Close modal and cleanup
- `initMapPreview()` - Initialize preview map with draggable marker
- `updateMapPreview()` - Update preview when coordinates change
- `geocodeAddress()` - Get coordinates from address via Goong API
- `saveHub()` - Save changes to database
- `generatePopupContent(hubData, hubType)` - Generate popup HTML with buttons

### **2. API Module** (`frontend/js/api.js`)

**Method:**
```javascript
async updateLocation(id, data) {
  const response = await fetch(`${API_BASE_URL}/locations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await response.json();
}
```

### **3. Backend Route** (`backend/routes/locations.js`)

**Endpoint:** `PUT /api/locations/:id`

**Request Body:**
```json
{
  "name": "Hub VSIP Bắc Ninh",           // For departer
  "carrier_name": "KTLS Hà Nội",         // For destination
  "address": "123 Đường ABC, Hà Nội",
  "province_name": "Hà Nội",             // For destination
  "lat": 21.0285,
  "lng": 105.8542
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Hub VSIP Bắc Ninh",
    "address": "123 Đường ABC, Hà Nội",
    "lat": 21.0285,
    "lng": 105.8542,
    "updated_at": "2025-10-22T..."
  }
}
```

---

## 🧪 Testing Synchronization

### **Test 1: Edit Hub Name**
1. Click marker → Click "Sửa"
2. Change name: "Hub A" → "Hub B"
3. Click "Lưu Thay Đổi"
4. **Expected:**
   - ✅ Notification: "Đã lưu thành công!"
   - ✅ Modal closes
   - ✅ Popup shows new name "Hub B"
   - ✅ Database updated

### **Test 2: Edit Address**
1. Click marker → Click "Sửa"
2. Change address
3. Click "Lưu Thay Đổi"
4. **Expected:**
   - ✅ Backend auto-geocodes new address
   - ✅ Marker moves to new coordinates
   - ✅ Popup shows new address
   - ✅ Database updated with new address + coordinates

### **Test 3: Drag Marker on Preview**
1. Click marker → Click "Sửa"
2. Drag marker on preview map
3. **Expected:**
   - ✅ Lat/Lng inputs update automatically
4. Click "Lưu Thay Đổi"
5. **Expected:**
   - ✅ Main map marker moves to new position
   - ✅ Database updated

### **Test 4: Geocode Address**
1. Click marker → Click "Sửa"
2. Enter new address
3. Click "📍 Lấy Tọa Độ Từ Địa Chỉ"
4. **Expected:**
   - ✅ Lat/Lng inputs update
   - ✅ Preview map moves to new location
5. Click "Lưu Thay Đổi"
6. **Expected:**
   - ✅ Main map marker moves
   - ✅ Database updated

### **Test 5: Verify Database Sync**
1. Edit hub and save
2. **Refresh page (F5)**
3. **Expected:**
   - ✅ Changes persist (loaded from database)
   - ✅ Marker at new position
   - ✅ Popup shows new data

---

## 🐛 Troubleshooting

### **Problem: Modal doesn't show**
**Solution:** 
- Hard refresh (Ctrl + Shift + R)
- Check console for errors
- Verify `hub-editor.js` is loaded

### **Problem: Save doesn't work**
**Check:**
1. Console errors?
2. Network tab - API call returns 200?
3. Database connection OK?
4. Validation passed? (name, address, lat, lng required)

### **Problem: Marker doesn't update**
**Check:**
1. `this.currentMarker` is set?
2. `marker.setLatLng()` called?
3. `marker.hubData` updated?
4. Popup regenerated?

### **Problem: Changes don't persist after refresh**
**Check:**
1. API call successful? (check Network tab)
2. Database updated? (check Supabase dashboard)
3. `result.success === true`?

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│   User UI   │
└──────┬──────┘
       │ Click "Sửa"
       ▼
┌─────────────────┐
│  HubEditor      │
│  .openModal()   │
└──────┬──────────┘
       │ User edits
       ▼
┌─────────────────┐
│  HubEditor      │
│  .saveHub()     │
└──────┬──────────┘
       │ API call
       ▼
┌─────────────────┐
│  Backend API    │
│  PUT /locations │
└──────┬──────────┘
       │ Save to DB
       ▼
┌─────────────────┐
│  Supabase DB    │
└──────┬──────────┘
       │ Return data
       ▼
┌─────────────────┐
│  Frontend       │
│  Update marker  │
│  Update popup   │
│  Reload map     │
└─────────────────┘
```

---

## ✅ Summary

**Hub Editor provides COMPLETE frontend-backend synchronization:**

1. ✅ **Real-time UI updates** - Marker position, popup content
2. ✅ **Database persistence** - All changes saved to Supabase
3. ✅ **Auto-geocoding** - Address changes trigger coordinate updates
4. ✅ **Interactive editing** - Drag marker, geocode button
5. ✅ **Validation** - Required fields checked before save
6. ✅ **Error handling** - User-friendly notifications
7. ✅ **Full reload** - Optional map data reload from database

**Result:** User sees changes immediately + changes persist after page refresh!

