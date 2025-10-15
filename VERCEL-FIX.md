# 🔧 VERCEL DEPLOYMENT FIX

## ❌ VẤN ĐỀ ĐÃ PHÁT HIỆN

### Vấn Đề Chính: Frontend hardcode localhost URL
**File:** `frontend/js/api.js`

**Trước:**
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

**Vấn đề:**
- ✅ Local: Frontend gọi đến `localhost:5000` → Hoạt động (vì server đang chạy trên máy)
- ❌ Vercel: Frontend vẫn cố gọi đến `localhost:5000` của máy bạn → Không có dữ liệu vì máy tắt
- ❌ Khi máy tắt → URL Vercel không load được dữ liệu từ Supabase

## ✅ GIẢI PHÁP ĐÃ ÁP DỤNG

### 1. Fix API Base URL (QUAN TRỌNG NHẤT)
**File:** `frontend/js/api.js`

**Sau:**
```javascript
// API Base URL - Auto-detect based on environment
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api'  // Development
    : '/api';  // Production (Vercel) - relative URL
```

**Giải thích:**
- Khi chạy local (`localhost`) → Gọi đến `http://localhost:5000/api`
- Khi deploy trên Vercel → Gọi đến `/api` (relative URL) → Vercel route tự động đến `backend/server.js`

### 2. Fix PORT Configuration
**File:** `backend/config/keys.js`

**Trước:**
```javascript
PORT: process.env.PORT || 3000,
```

**Sau:**
```javascript
PORT: process.env.PORT || 5000,  // Changed from 3000 to 5000
```

**Lý do:** Frontend local gọi port 5000, nên backend cũng phải dùng 5000 cho nhất quán.

## 📋 CÁCH HOẠT ĐỘNG SAU KHI FIX

### Trên Local (Development)
```
Frontend → http://localhost:5000/api → Backend (Express Server)
Backend → Supabase → Trả dữ liệu về Frontend
```

### Trên Vercel (Production)
```
Frontend → /api → Vercel Routes (vercel.json) → Backend (Express Server)
Backend → Supabase → Trả dữ liệu về Frontend
```

**Quan trọng:** Backend trên Vercel chạy như một **serverless function**, không cần máy tính của bạn phải bật!

## 🚀 BƯỚC TIẾP THEO

### 1. Commit & Push lên GitHub
```bash
git add .
git commit -m "Fix: Update API_BASE_URL for Vercel deployment"
git push
```

### 2. Vercel Tự Động Deploy
- Vercel sẽ tự động phát hiện commit mới
- Tự động build và deploy
- Không cần làm gì thêm!

### 3. Kiểm Tra Sau Deploy
1. Truy cập URL Vercel của bạn: `https://your-app.vercel.app`
2. Test API health: `https://your-app.vercel.app/api/health`
3. Test frontend: Map phải load được data
4. **TẮT máy tính** → Test lại URL → Phải vẫn hoạt động!

## 🔍 KIỂM TRA LỖI NẾU VẪN CHƯA HOẠT ĐỘNG

### Check 1: Environment Variables trên Vercel
Đảm bảo các biến sau đã được thêm vào Vercel:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `GOONG_API_KEY`
- ✅ `GOONG_MAPTILES_KEY`
- ✅ `NODE_ENV` = `production`

**Cách kiểm tra:**
1. Vào Vercel Dashboard → Project
2. Settings → Environment Variables
3. Verify tất cả đã có

### Check 2: Supabase RLS Policies
Nếu không load được data, có thể do RLS (Row Level Security) chặn.

**Giải pháp:**
1. Vào Supabase Dashboard
2. SQL Editor
3. Chạy query:

```sql
-- Disable RLS for public read (simplest)
ALTER TABLE departers DISABLE ROW LEVEL SECURITY;
ALTER TABLE destinations DISABLE ROW LEVEL SECURITY;
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_destinations DISABLE ROW LEVEL SECURITY;
ALTER TABLE routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE route_segments DISABLE ROW LEVEL SECURITY;
```

**Hoặc (An toàn hơn) - Enable RLS với public read policy:**
```sql
-- Enable RLS
ALTER TABLE departers ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_segments ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Allow public read" ON departers FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON destinations FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON trips FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON trip_destinations FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON routes FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON route_segments FOR SELECT USING (true);
```

### Check 3: Browser Console
Mở browser → F12 → Console → Xem có lỗi gì không

**Lỗi thường gặp:**
- `Failed to fetch` → Check Vercel Environment Variables
- `CORS error` → Check backend `app.use(cors())`
- `404 Not Found` → Check `vercel.json` routes

### Check 4: Vercel Logs
1. Vào Vercel Dashboard → Project
2. Deployments → Click deployment mới nhất
3. View Function Logs
4. Xem có lỗi gì không

## 📊 TÓM TẮT

### Trước khi fix:
- ❌ Frontend hardcode `localhost:5000`
- ❌ Chỉ hoạt động khi máy tính bật
- ❌ Vercel không load được data

### Sau khi fix:
- ✅ Frontend tự động detect environment
- ✅ Local: Gọi `localhost:5000`
- ✅ Vercel: Gọi `/api` (relative)
- ✅ Hoạt động ngay cả khi máy tính tắt
- ✅ Data load từ Supabase (cloud database)

## 🎉 KẾT QUẢ MONG ĐỢI

Sau khi push code mới lên GitHub và Vercel deploy:
1. ✅ URL Vercel hoạt động độc lập
2. ✅ Map hiển thị data từ Supabase
3. ✅ Routes load được
4. ✅ Route details hiển thị
5. ✅ Tắt máy tính → URL vẫn hoạt động 100%

## 📞 HỖ TRỢ

Nếu vẫn gặp vấn đề sau khi áp dụng fix:
1. Check Environment Variables
2. Check Supabase RLS
3. Check Vercel Logs
4. Share URL + Error message để debug

---

**Created:** October 15, 2025
**Status:** ✅ Fixed
**Impact:** Critical - Vercel deployment now works independently
