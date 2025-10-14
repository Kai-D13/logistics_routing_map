# 🚀 Hướng Dẫn Deployment

## 📋 Checklist Trước Khi Deploy

- [ ] Database đã được setup trên Supabase
- [ ] Đã có Goong API keys
- [ ] Code đã được test local
- [ ] Environment variables đã được cấu hình

---

## 🌐 Deploy lên Vercel (Recommended)

### 1. Chuẩn Bị

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login
```

### 2. Cấu Hình

Tạo file `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "backend/server.js"
    }
  ]
}
```

### 3. Deploy

```bash
vercel
```

### 4. Set Environment Variables

```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add GOONG_API_KEY
vercel env add GOONG_MAPTILES_KEY
```

---

## 🐳 Deploy với Docker

### 1. Tạo Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

### 2. Build & Run

```bash
# Build image
docker build -t logistics-routing-system .

# Run container
docker run -p 5000:5000 --env-file .env logistics-routing-system
```

---

## ☁️ Deploy lên Heroku

### 1. Chuẩn Bị

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login
```

### 2. Tạo App

```bash
heroku create your-app-name
```

### 3. Set Environment Variables

```bash
heroku config:set SUPABASE_URL=your_url
heroku config:set SUPABASE_ANON_KEY=your_key
heroku config:set GOONG_API_KEY=your_key
heroku config:set GOONG_MAPTILES_KEY=your_key
```

### 4. Deploy

```bash
git push heroku main
```

---

## 🔒 Security Checklist

- [ ] Không commit file `.env`
- [ ] Sử dụng HTTPS cho production
- [ ] Enable CORS chỉ cho domains cần thiết
- [ ] Rate limiting cho API endpoints
- [ ] Validate input data
- [ ] Use environment variables cho sensitive data

---

## 📊 Monitoring

### Recommended Tools
- **Vercel Analytics** - Performance monitoring
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Supabase Dashboard** - Database monitoring

---

## 🔄 CI/CD với GitHub Actions

Tạo `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 🎯 Performance Optimization

### Backend
- Enable gzip compression
- Use caching for API responses
- Optimize database queries
- Use connection pooling

### Frontend
- Minify CSS/JS
- Lazy load images
- Use CDN for static assets
- Enable browser caching

---

**Good luck with your deployment! 🚀**

