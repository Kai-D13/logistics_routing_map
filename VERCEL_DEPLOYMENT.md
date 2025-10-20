# 🚀 VERCEL DEPLOYMENT GUIDE

## 📋 PREREQUISITES

Trước khi deploy lên Vercel, đảm bảo bạn đã:

1. ✅ Push code lên GitHub repository: `https://github.com/Kai-D13/logistics_routing_map.git`
2. ✅ Có tài khoản Vercel (https://vercel.com)
3. ✅ Có Supabase database đã setup (với route_schedules, hub_tiers tables)
4. ✅ Có Goong API key

---

## 🔧 ENVIRONMENT VARIABLES

Bạn cần cấu hình các environment variables sau trên Vercel:

### **Required Variables:**

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
GOONG_API_KEY=your-goong-api-key
NODE_ENV=production
PORT=5000
```

### **Lấy Supabase Credentials:**

1. Đăng nhập vào Supabase: https://supabase.com
2. Chọn project của bạn
3. Vào **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`

### **Lấy Goong API Key:**

1. Đăng nhập vào Goong: https://account.goong.io
2. Vào **API Keys**
3. Copy API key → `GOONG_API_KEY`

---

## 📦 DEPLOYMENT STEPS

### **Step 1: Import Project to Vercel**

1. Đăng nhập vào Vercel: https://vercel.com
2. Click **"Add New..."** → **"Project"**
3. Import từ GitHub:
   - Chọn repository: `Kai-D13/logistics_routing_map`
   - Click **"Import"**

### **Step 2: Configure Project**

1. **Framework Preset:** Chọn **"Other"** (hoặc để trống)
2. **Root Directory:** Để trống (`.`)
3. **Build Command:** Để trống (không cần build)
4. **Output Directory:** Để trống
5. **Install Command:** `npm install`

### **Step 3: Add Environment Variables**

1. Trong phần **"Environment Variables"**, thêm từng biến:

```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_ANON_KEY = your-supabase-anon-key
GOONG_API_KEY = your-goong-api-key
NODE_ENV = production
PORT = 5000
```

2. Chọn **"Production"**, **"Preview"**, và **"Development"** cho tất cả các biến

### **Step 4: Deploy**

1. Click **"Deploy"**
2. Chờ deployment hoàn thành (1-2 phút)
3. Vercel sẽ tự động build và deploy

---

## ✅ VERIFY DEPLOYMENT

### **1. Check Deployment Status:**

- Vercel sẽ hiển thị deployment URL: `https://your-project.vercel.app`
- Click vào URL để mở ứng dụng

### **2. Test API Endpoints:**

Mở browser console và test:

```javascript
// Test routes API
fetch('https://your-project.vercel.app/api/routes')
  .then(r => r.json())
  .then(console.log);

// Test departers API
fetch('https://your-project.vercel.app/api/routes/departers')
  .then(r => r.json())
  .then(console.log);
```

### **3. Test Frontend:**

1. Mở `https://your-project.vercel.app`
2. Click tab **"📋 Quản Lý Routes"**
3. Chọn route từ dropdown
4. Verify:
   - ✅ Route details hiển thị
   - ✅ Segments table hiển thị
   - ✅ Map hiển thị (nếu có coordinates)

---

## 🐛 TROUBLESHOOTING

### **Problem 1: API Returns 500 Error**

**Cause:** Environment variables chưa được set đúng

**Solution:**
1. Vào Vercel Dashboard → Project → **Settings** → **Environment Variables**
2. Verify tất cả các biến đã được set
3. Redeploy: **Deployments** → **...** → **Redeploy**

### **Problem 2: CORS Error**

**Cause:** Frontend gọi API từ domain khác

**Solution:**
- Vercel tự động handle CORS cho cùng domain
- Nếu vẫn lỗi, check `backend/server.js` có CORS middleware

### **Problem 3: Database Connection Error**

**Cause:** Supabase credentials sai hoặc RLS policies chặn

**Solution:**
1. Verify `SUPABASE_URL` và `SUPABASE_ANON_KEY`
2. Check Supabase RLS policies:
   ```sql
   -- Disable RLS for testing
   ALTER TABLE route_schedules DISABLE ROW LEVEL SECURITY;
   ALTER TABLE hub_tiers DISABLE ROW LEVEL SECURITY;
   ```

### **Problem 4: Routes Not Loading**

**Cause:** Database chưa có data

**Solution:**
1. Vào Supabase SQL Editor
2. Run `database/import-routes.sql` để import 214 segments
3. Verify data:
   ```sql
   SELECT COUNT(*) FROM route_schedules;
   -- Should return 214
   ```

### **Problem 5: Map Not Displaying**

**Cause:** Hubs chưa có coordinates (lat/lng)

**Solution:**
1. Check destinations table có lat/lng:
   ```sql
   SELECT carrier_name, lat, lng 
   FROM destinations 
   WHERE lat IS NULL OR lng IS NULL;
   ```
2. Nếu thiếu, chạy geocoding script:
   ```bash
   node backend/scripts/geocode-invalid-hubs.js
   ```

---

## 🔄 REDEPLOY AFTER CHANGES

### **Option 1: Auto Deploy (Recommended)**

Vercel tự động deploy khi bạn push code lên GitHub:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Vercel sẽ tự động detect và deploy trong 1-2 phút.

### **Option 2: Manual Redeploy**

1. Vào Vercel Dashboard
2. Chọn project
3. Tab **"Deployments"**
4. Click **"..."** → **"Redeploy"**

---

## 📊 MONITORING

### **View Logs:**

1. Vercel Dashboard → Project → **Deployments**
2. Click vào deployment
3. Tab **"Functions"** → Click function → **"Logs"**

### **View Analytics:**

1. Vercel Dashboard → Project → **Analytics**
2. Xem:
   - Page views
   - API calls
   - Response times
   - Error rates

---

## 🎯 PRODUCTION CHECKLIST

Before going live, verify:

- [ ] ✅ All environment variables set correctly
- [ ] ✅ Database has data (214 route segments)
- [ ] ✅ API endpoints working (`/api/routes`, `/api/routes/departers`)
- [ ] ✅ Frontend loads correctly
- [ ] ✅ Routes tab displays routes
- [ ] ✅ Map integration working
- [ ] ✅ Distance calculation working
- [ ] ✅ No console errors
- [ ] ✅ Mobile responsive
- [ ] ✅ HTTPS enabled (automatic on Vercel)

---

## 🔗 USEFUL LINKS

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Goong API Docs:** https://docs.goong.io
- **GitHub Repository:** https://github.com/Kai-D13/logistics_routing_map

---

## 📞 SUPPORT

Nếu gặp vấn đề:

1. Check Vercel deployment logs
2. Check Supabase logs
3. Check browser console for errors
4. Verify environment variables
5. Test API endpoints directly

---

## 🎉 SUCCESS!

Sau khi deploy thành công, bạn sẽ có:

- ✅ Live URL: `https://your-project.vercel.app`
- ✅ Auto-deploy khi push code
- ✅ HTTPS enabled
- ✅ CDN caching
- ✅ Serverless functions
- ✅ Analytics dashboard

**Enjoy your deployed Logistics Routing System!** 🚀

