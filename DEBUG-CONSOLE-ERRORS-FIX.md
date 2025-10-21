# Debug & Fixes - Console Errors - 2025-01-21

## 🐛 Vấn Đề Phát Hiện

### 1. Module "Quản Lý Routes" - Directions API No Polyline Data

**Console Log:**
```
📡 Directions API response: {success: true, data: {…}}
⚠️ Directions API failed: No polyline data
```

**Root Cause:**
- Backend trả về `overview_polyline` trong `result.data`
- Frontend kiểm tra `result.data.overview_polyline` ✅
- NHƯNG Backend trả về field names SAI:
  - Backend: `total_distance_meters`, `total_distance_km`
  - Frontend expect: `total_distance`
  - Backend: `total_duration_seconds`, `total_duration_hours`, `total_duration_text`  
  - Frontend expect: `total_duration`

**Fix Applied:**
```javascript
// OLD (BROKEN)
const totalDistance = (result.data.total_distance / 1000).toFixed(2);
const totalDuration = result.data.total_duration_text || 
                      Math.round(result.data.total_duration / 60) + ' phút';

// NEW (FIXED)
const totalDistance = result.data.total_distance_km || 
                      (result.data.total_distance_meters / 1000).toFixed(2);
const totalDuration = result.data.total_duration_text || 
                      result.data.total_duration_hours + ' giờ';
```

**Files Changed:**
- `frontend/js/route-management.js` (lines ~320-330)

---

### 2. Module "Tạo Route Mới" - Preview Route Error

**Console Log:**
```
Error previewing route: TypeError: t.addLayer is not a function
    at e.addTo (Layer.js:52:7)
    at drawPreviewRouteOnMap (route-builder.js:444:45)
```

**Root Cause Analysis:**

#### Issue A: Polyline Decoder Library Not Working
```javascript
// OLD (BROKEN) - Relies on external library
const polylineCoords = L.Polyline.fromEncoded(polylineEncoded).getLatLngs();
```

**Why it failed:**
- HTML loads `polyline-encoded` library:
  ```html
  <script src="https://unpkg.com/polyline-encoded@0.0.9/Polyline.encoded.js"></script>
  ```
- But the library may not be loaded properly or API changed
- Method `L.Polyline.fromEncoded()` không tồn tại

**Fix:** Implement custom Google Polyline decoder
```javascript
// NEW (FIXED) - Custom decoder
function decodePolyline(encoded) {
  const points = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}
```

#### Issue B: Wrong Field Name in Directions Response
```javascript
// OLD (BROKEN)
drawPreviewRouteOnMap(waypoints, directionsData.polyline);

// Backend actually returns:
{
  overview_polyline: "encoded_string_here",
  total_distance_km: "31.86",
  total_duration_text: "60 phút",
  legs: [...]
}
```

**Fix:**
```javascript
// NEW (FIXED)
if (directionsData.overview_polyline) {
  console.log('🗺️ Drawing preview with overview_polyline');
  drawPreviewRouteOnMap(waypoints, directionsData.overview_polyline);
} else {
  console.warn('⚠️ No polyline data in directions response');
}
```

#### Issue C: Map Clutter - Old Markers Not Cleared
**Problem:** 
- Khi click "Preview Route", map vẫn hiển thị tất cả 179 markers cũ
- Preview markers được add thêm vào → rất lộn xộn
- User không biết đâu là route mới preview

**Fix:** Clear ALL layers trước khi vẽ preview
```javascript
function drawPreviewRouteOnMap(waypoints, polylineEncoded) {
  if (!window.map) {
    console.error('❌ Map not initialized');
    return;
  }

  console.log('🗺️ Drawing preview route on map...');

  // 1. Clear ALL existing markers
  if (window.clearMarkers && typeof window.clearMarkers === 'function') {
    window.clearMarkers();
    console.log('✅ Cleared existing markers');
  }

  // 2. Clear route management layers if any
  if (window.RouteManagement && window.RouteManagement.clearRouteDisplay) {
    window.RouteManagement.clearRouteDisplay();
    console.log('✅ Cleared route management display');
  }

  // 3. Clear existing preview layers
  if (window.previewRouteLayer) {
    window.map.removeLayer(window.previewRouteLayer);
  }

  // 4. Create NEW layer group
  window.previewRouteLayer = L.layerGroup().addTo(window.map);

  // 5. Decode and draw polyline
  const polylineCoords = decodePolyline(polylineEncoded);
  console.log(`✅ Decoded ${polylineCoords.length} polyline points`);

  // ... draw polyline and markers
}
```

#### Issue D: Update Summary with Correct Field Names
```javascript
// OLD (BROKEN)
document.getElementById('new-route-total-distance').textContent = 
  directionsData.distance_km + ' km';
document.getElementById('new-route-total-duration').textContent = 
  directionsData.duration_minutes + ' phút';

// NEW (FIXED)
const totalDistanceKm = directionsData.total_distance_km || 
                        (directionsData.total_distance_meters / 1000).toFixed(2);
const totalDurationText = directionsData.total_duration_text || 
                          directionsData.total_duration_hours + ' giờ';

document.getElementById('new-route-total-distance').textContent = 
  totalDistanceKm + ' km';
document.getElementById('new-route-total-duration').textContent = 
  totalDurationText;
```

**Files Changed:**
- `frontend/js/route-builder.js`:
  - Added `decodePolyline()` function (lines ~430-460)
  - Fixed `drawPreviewRouteOnMap()` (lines ~460-520)
  - Fixed `displayNewRoutePreview()` (lines ~315-370)

---

## 📝 Files Changed Summary

### 1. `frontend/js/route-management.js`
**Lines: ~320-340**
```javascript
// Fixed field names in Directions API response handling
const totalDistance = result.data.total_distance_km || 
                      (result.data.total_distance_meters / 1000).toFixed(2);
const totalDuration = result.data.total_duration_text || 
                      result.data.total_duration_hours + ' giờ';

// Added debug logging
console.log('📊 Full response data:', result.data);
```

**Lines: ~566**
```javascript
// Exposed to window for external access
window.RouteManagement = RouteManagement;
```

---

### 2. `frontend/js/route-builder.js`

#### A. Added Polyline Decoder (~430-460)
```javascript
function decodePolyline(encoded) {
  // Google Polyline Algorithm implementation
  // Returns array of [lat, lng] coordinates
}
```

#### B. Fixed Preview Display (~315-370)
```javascript
function displayNewRoutePreview(routeName, hubName, waypoints, directionsData) {
  // Use correct field names from backend
  const totalDistanceKm = directionsData.total_distance_km || 
                           (directionsData.total_distance_meters / 1000).toFixed(2);
  const totalDurationText = directionsData.total_duration_text || 
                             directionsData.total_duration_hours + ' giờ';
  
  // Use overview_polyline instead of polyline
  if (directionsData.overview_polyline) {
    drawPreviewRouteOnMap(waypoints, directionsData.overview_polyline);
  }
}
```

#### C. Fixed Map Drawing (~460-520)
```javascript
function drawPreviewRouteOnMap(waypoints, polylineEncoded) {
  // Clear ALL existing layers first
  if (window.clearMarkers) window.clearMarkers();
  if (window.RouteManagement) window.RouteManagement.clearRouteDisplay();
  
  // Use custom decoder instead of library
  const polylineCoords = decodePolyline(polylineEncoded);
  
  // Draw new preview
  // ...
}
```

---

### 3. `frontend/js/map.js`
**Lines: ~145-150**
```javascript
// Expose functions to window for global access
window.map = map;
window.clearMarkers = clearMarkers;
window.fitMapToMarkers = fitMapToMarkers;
window.loadMapData = loadMapData;
```

---

## 🧪 Testing Checklist

### Test 1: Quản Lý Routes - Directions API
- [ ] Open http://localhost:5000/
- [ ] Go to tab "Quản Lý Routes"
- [ ] Select route: "Bắc Ninh - Chợ thuốc Hapudico (cutoff 7:00) (9 điểm)"
- [ ] **Expected Console Log:**
  ```
  📍 Building route map for 5 segments
  ✅ Collected 6 unique waypoints
  📡 Calling Directions API with 6 waypoints
  📡 Directions API response: {success: true, data: {…}}
  ✅ Decoded 1234 polyline points
  ```
- [ ] **Expected Map Display:**
  - 6 numbered markers (red for hub, blue for destinations)
  - Curved polyline following roads
  - Notification: "✅ Tuyến đường: 31.86 km • Thời gian: 60 phút"

### Test 2: Tạo Route Mới - Preview Route
- [ ] Go to tab "Quản Lý Routes"
- [ ] Click "Tạo Route Mới"
- [ ] Select Hub Chính: "Hub VSIP Bắc Ninh"
- [ ] Select 2-3 destinations
- [ ] Click "Preview Route"
- [ ] **Expected Console Log:**
  ```
  🗺️ Drawing preview route on map...
  ✅ Cleared existing markers
  ✅ Cleared route management display
  ✅ Decoded 1234 polyline points
  ```
- [ ] **Expected Display:**
  - Modal shows preview metrics (distance, duration)
  - Map shows ONLY preview route (no other markers)
  - Curved polyline following roads
  - Numbered markers for route sequence
  - Map auto-switches to "Bản Đồ" tab

### Test 3: Preview Route - Map Clear
- [ ] First select a route from "Quản Lý Routes" (map shows that route)
- [ ] Then click "Tạo Route Mới" → "Preview Route"
- [ ] **Expected:**
  - Old route markers should DISAPPEAR
  - Only NEW preview route visible
  - No marker overlap or clutter

---

## 🎯 Root Cause Summary

| Issue | Root Cause | Fix |
|-------|------------|-----|
| No polyline data | Field name mismatch (total_distance vs total_distance_km) | Use correct backend field names |
| t.addLayer is not a function | External library `L.Polyline.fromEncoded()` not working | Implement custom polyline decoder |
| Wrong field in preview | Using `polyline` instead of `overview_polyline` | Update to use `overview_polyline` |
| Map clutter in preview | Not clearing old markers before drawing | Add clearMarkers() + clearRouteDisplay() |
| Functions not accessible | map.js and route-management.js not exposed to window | Add window.* assignments |

---

## 📊 Backend vs Frontend Field Mapping

### Goong Directions API Response (Backend)
```javascript
{
  success: true,
  data: {
    overview_polyline: "encoded_string",
    total_distance_meters: 31860,
    total_distance_km: "31.86",
    total_duration_seconds: 3600,
    total_duration_hours: "1.00",
    total_duration_text: "60 phút",
    vehicle: "truck",
    legs: [
      {
        from: "Hub A",
        to: "Destination B",
        distance_meters: 12000,
        distance_km: "12.00",
        distance_text: "12 km",
        duration_seconds: 900,
        duration_minutes: 15,
        duration_text: "15 phút",
        polyline: "leg_encoded_string"
      }
    ],
    waypoints_count: 6
  }
}
```

### Frontend Must Use
```javascript
// Distance
const distance = result.data.total_distance_km;
// OR
const distance = (result.data.total_distance_meters / 1000).toFixed(2);

// Duration
const duration = result.data.total_duration_text;
// OR  
const duration = result.data.total_duration_hours + ' giờ';

// Polyline
const polyline = result.data.overview_polyline; // NOT result.data.polyline!
```

---

## ✅ Status

- [x] Fix 1: Update field names in route-management.js
- [x] Fix 2: Implement custom polyline decoder
- [x] Fix 3: Update displayNewRoutePreview to use overview_polyline
- [x] Fix 4: Add clearMarkers before preview
- [x] Fix 5: Expose RouteManagement to window
- [x] Fix 6: Expose map functions to window
- [x] Fix 7: Add extensive console logging
- [x] Fix 8: Update preview summary with correct fields

**Ready for testing!** 🚀  
**Please refresh browser (Ctrl + F5) to apply changes.**

---

**Date:** 2025-01-21  
**Time:** After console error analysis  
**Status:** ✅ All Issues Fixed - Awaiting User Test
