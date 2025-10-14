# 🚀 HƯỚNG DẪN DEPLOY LÊN VERCEL (FREE)

## 📋 BƯỚC 1: CHUẨN BỊ SUPABASE (PUBLIC DATABASE)

### 1.1. Đăng nhập Supabase
1. Truy cập: https://supabase.com
2. Đăng nhập vào project của bạn

### 1.2. Kiểm tra RLS (Row Level Security)
1. Vào **Database** → **Tables**
2. Chọn từng table: `departers`, `destinations`, `trips`, `trip_destinations`, `routes`, `route_segments`
3. Click vào table → **RLS** tab
4. **DISABLE RLS** cho tất cả tables (để public read)

**Hoặc chạy SQL này:**
```sql
-- Disable RLS for all tables
ALTER TABLE departers DISABLE ROW LEVEL SECURITY;
ALTER TABLE destinations DISABLE ROW LEVEL SECURITY;
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_destinations DISABLE ROW LEVEL SECURITY;
ALTER TABLE routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE route_segments DISABLE ROW LEVEL SECURITY;
```

### 1.3. Tạo Public Read Policy (Recommended - An toàn hơn)
**Nếu muốn bảo mật hơn, ENABLE RLS và tạo policy:**

```sql
-- Enable RLS
ALTER TABLE departers ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_segments ENABLE ROW LEVEL SECURITY;

-- Create public read policies
CREATE POLICY "Allow public read access" ON departers FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON destinations FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON trips FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON trip_destinations FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON routes FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON route_segments FOR SELECT USING (true);
```

### 1.4. Lấy API Keys
1. Vào **Settings** → **API**
2. Copy:
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_ANON_KEY)

---

## 📋 BƯỚC 2: CHUẨN BỊ GITHUB REPOSITORY

### 2.1. Tạo GitHub Repository
1. Truy cập: https://github.com/new
2. Tạo repository mới: `logistics-routing-system`
3. **KHÔNG** chọn "Initialize with README"

### 2.2. Push code lên GitHub
Mở terminal trong folder `logistics-routing-system`:

```bash
# Initialize git (nếu chưa có)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Logistics Routing System"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/logistics-routing-system.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Thay `YOUR_USERNAME` bằng username GitHub của bạn!**

---

## 📋 BƯỚC 3: DEPLOY LÊN VERCEL

### 3.1. Tạo tài khoản Vercel
1. Truy cập: https://vercel.com/signup
2. Chọn **Continue with GitHub**
3. Authorize Vercel

### 3.2. Import Project
1. Click **Add New...** → **Project**
2. Chọn repository: `logistics-routing-system`
3. Click **Import**

### 3.3. Configure Project
**Framework Preset:** Other (để mặc định)

**Root Directory:** `./` (mặc định)

**Build Command:** (để trống)

**Output Directory:** (để trống)

**Install Command:** `npm install`

### 3.4. Thêm Environment Variables
Click **Environment Variables**, thêm:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGc...` (anon key từ Supabase) |
| `GOONG_API_KEY` | `your_goong_api_key` |
| `GOONG_MAPTILES_KEY` | `your_goong_maptiles_key` |
| `NODE_ENV` | `production` |

### 3.5. Deploy
1. Click **Deploy**
2. Đợi 1-2 phút
3. ✅ **DONE!**

---

## 📋 BƯỚC 4: KIỂM TRA DEPLOYMENT

### 4.1. Truy cập URL
Vercel sẽ tạo URL dạng: `https://logistics-routing-system.vercel.app`

### 4.2. Test API
Mở browser, test:
- `https://your-app.vercel.app/api/health`
- `https://your-app.vercel.app/api/config/test`

### 4.3. Test Frontend
- `https://your-app.vercel.app/`

---

## 📋 BƯỚC 5: CẬP NHẬT SAU NÀY

Mỗi khi có thay đổi code:

```bash
git add .
git commit -m "Your update message"
git push
```

Vercel sẽ **tự động deploy** lại! 🚀

---

## 🔧 TROUBLESHOOTING

### Lỗi: "Cannot find module"
- Kiểm tra `package.json` có đầy đủ dependencies
- Chạy `npm install` local để verify

### Lỗi: "Supabase connection failed"
- Kiểm tra Environment Variables trên Vercel
- Verify Supabase RLS policies

### Lỗi: "404 Not Found"
- Kiểm tra `vercel.json` routes
- Verify `backend/server.js` đang serve static files

### Lỗi: "CORS"
- Kiểm tra `backend/server.js` có `app.use(cors())`
- Supabase RLS policies phải allow public read

---

## 📊 MONITORING

### Vercel Dashboard
- **Deployments:** Xem lịch sử deploy
- **Analytics:** Xem traffic
- **Logs:** Debug errors

### Supabase Dashboard
- **Database:** Xem data
- **API Logs:** Monitor queries
- **Auth:** (nếu cần sau này)

---

## 🎉 HOÀN THÀNH!

Bây giờ bạn có:
- ✅ Public URL: `https://your-app.vercel.app`
- ✅ Auto-deploy từ GitHub
- ✅ Free SSL certificate
- ✅ CDN global
- ✅ Unlimited bandwidth (trong free tier)

**Share URL này với users!** 🚀

