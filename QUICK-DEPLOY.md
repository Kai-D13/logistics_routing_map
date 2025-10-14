# 🚀 QUICK DEPLOY GUIDE (5 PHÚT)

## ⚡ BƯỚC 1: SETUP SUPABASE (2 phút)

### 1. Mở Supabase SQL Editor
1. Truy cập: https://supabase.com
2. Chọn project của bạn
3. Click **SQL Editor** (bên trái)

### 2. Chạy SQL này:
```sql
-- Enable RLS + Public Read
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

### 3. Copy API Keys
- Vào **Settings** → **API**
- Copy **Project URL** và **anon public key**

---

## ⚡ BƯỚC 2: PUSH LÊN GITHUB (1 phút)

Mở terminal trong folder `logistics-routing-system`:

```bash
git init
git add .
git commit -m "Deploy to Vercel"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/logistics-routing-system.git
git push -u origin main
```

**Thay `YOUR_USERNAME` bằng GitHub username của bạn!**

---

## ⚡ BƯỚC 3: DEPLOY VERCEL (2 phút)

### 1. Đăng nhập Vercel
- Truy cập: https://vercel.com/signup
- Click **Continue with GitHub**

### 2. Import Project
- Click **Add New...** → **Project**
- Chọn repo: `logistics-routing-system`
- Click **Import**

### 3. Thêm Environment Variables
Click **Environment Variables**, paste:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
GOONG_API_KEY=your_key
GOONG_MAPTILES_KEY=your_key
NODE_ENV=production
```

### 4. Deploy
- Click **Deploy**
- Đợi 1-2 phút
- ✅ **DONE!**

---

## ✅ KIỂM TRA

Truy cập URL: `https://your-app.vercel.app`

Test:
- `/` - Frontend
- `/api/health` - API health check
- `/api/config/test` - Config check

---

## 🎉 HOÀN THÀNH!

**URL của bạn:** `https://logistics-routing-system-xxxxx.vercel.app`

Share URL này với users! 🚀

---

## 📞 CẦN GIÚP?

Xem chi tiết: `DEPLOYMENT-GUIDE.md`

Checklist: `DEPLOY-CHECKLIST.md`

