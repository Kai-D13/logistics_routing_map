# Database Migrations

## Polyline Caching System

### Setup Instructions

#### 1. Create `route_polylines` Table

Run this SQL in Supabase SQL Editor:

```sql
-- Copy content from: 001-create-route-polylines.sql
```

Or use the file directly:
- Open Supabase Dashboard → SQL Editor
- Click "New Query"
- Copy-paste content from `001-create-route-polylines.sql`
- Click "Run"

#### 2. Populate Cache

After creating the table, populate it with polyline data:

```bash
# Populate cache for all routes
node backend/scripts/populate-polyline-cache.js

# Populate cache for specific route only
node backend/scripts/populate-polyline-cache.js --route="Bắc Ninh - Sơn La, Minh Khai (cutoff 14h30)"

# Clear existing cache and re-populate
node backend/scripts/populate-polyline-cache.js --clear
```

#### 3. Rebuild Cache (After Re-importing Data)

When you re-import `route.json` or `new_marker.json`:

```bash
# Interactive rebuild (will ask for confirmation)
node backend/scripts/rebuild-polyline-cache.js
```

Or manually:

```bash
# Clear cache
node backend/scripts/populate-polyline-cache.js --clear

# Re-populate
node backend/scripts/populate-polyline-cache.js
```

---

## Cache Management

### View Cache Statistics

```sql
-- Copy content from: 002-clear-polyline-cache.sql (OPTION 5)
```

### Clear Cache

```sql
-- Clear ALL cache
TRUNCATE TABLE route_polylines;

-- Clear cache for specific route
DELETE FROM route_polylines WHERE route_name = 'Route Name';

-- Clear cache for specific hub
DELETE FROM route_polylines 
WHERE hub_from = 'Hub Name' OR hub_to = 'Hub Name';

-- Clear old cache (>30 days)
DELETE FROM route_polylines 
WHERE created_at < NOW() - INTERVAL '30 days';
```

---

## How It Works

### 1. Frontend Request Flow

```
User selects route
    ↓
For each segment (Hub A → Hub B):
    ↓
Check LocalStorage (0ms, FREE)
    ↓ (if not found)
Check Database (50ms, FREE)
    ↓ (if not found)
Call Goong API (500ms, COSTS $$$)
    ↓
Save to Database + LocalStorage
    ↓
Next time: Use cache (0-50ms, FREE!)
```

### 2. Cache Layers

**Layer 1: LocalStorage (Browser)**
- Speed: < 10ms
- Lifetime: 7 days
- Scope: Per user, per browser
- Cleared: When user clears browser data

**Layer 2: Database (Supabase)**
- Speed: ~50ms
- Lifetime: Forever (until manually cleared)
- Scope: Shared across all users
- Cleared: Manually or when re-importing data

**Layer 3: Goong API (External)**
- Speed: ~500ms
- Cost: ~$0.005 per request
- Only called when cache miss

### 3. Cost Savings

**Without Cache:**
- Route with 5 segments = 5 API calls
- 100 users view route = 500 API calls
- Cost: 500 × $0.005 = **$2.50**

**With Cache:**
- First user: 5 API calls (populate cache)
- Next 99 users: 0 API calls (use cache)
- Cost: 5 × $0.005 = **$0.025** (99% savings!)

---

## Troubleshooting

### Cache Not Working?

1. **Check if table exists:**
   ```sql
   SELECT * FROM route_polylines LIMIT 5;
   ```

2. **Check if cache is populated:**
   ```sql
   SELECT COUNT(*) FROM route_polylines;
   ```

3. **Check API endpoint:**
   ```bash
   curl http://localhost:5000/api/polylines/Hub%20VSIP%20II/Hub%20Cần%20Thơ
   ```

4. **Clear browser cache:**
   - Open DevTools → Application → Local Storage
   - Delete items starting with `polyline_`

### Re-populate Cache

If polylines look wrong after updating hub coordinates:

```bash
node backend/scripts/rebuild-polyline-cache.js
```

---

## API Endpoints

### GET /api/polylines/:hubFrom/:hubTo

Get cached polyline for a segment.

**Query params:**
- `vehicle`: 'truck' (default), 'car', 'bike'

**Response:**
```json
{
  "success": true,
  "data": {
    "polyline_encoded": "encoded_string...",
    "distance_km": 45.2,
    "duration_minutes": 120,
    "duration_text": "2 giờ",
    "cached_at": "2025-01-15T10:30:00Z",
    "cache_age_days": 5
  }
}
```

### POST /api/polylines/fetch-and-cache

Fetch polyline from Goong API and cache it.

**Body:**
```json
{
  "route_name": "Bắc Ninh - Sơn La...",
  "hub_from": "Hub VSIP Bắc Ninh",
  "hub_to": "NV Công ty - Hub Minh Khai",
  "from_coords": { "lat": 21.121, "lng": 106.111 },
  "to_coords": { "lat": 21.234, "lng": 105.987 },
  "vehicle": "truck"
}
```

### DELETE /api/polylines/clear

Clear polyline cache.

**Query params:**
- `all=true`: Clear all cache
- `route_name=...`: Clear cache for specific route
- `hub=...`: Clear cache for specific hub

---

## Maintenance

### Monthly Tasks

1. **Review cache statistics:**
   ```sql
   SELECT 
     COUNT(*) as total_segments,
     SUM(use_count) as total_hits,
     AVG(use_count) as avg_hits_per_segment
   FROM route_polylines;
   ```

2. **Clear unused cache:**
   ```sql
   DELETE FROM route_polylines 
   WHERE use_count = 0 
   AND created_at < NOW() - INTERVAL '30 days';
   ```

3. **Update frequently used routes:**
   ```sql
   SELECT 
     route_name,
     COUNT(*) as segments,
     SUM(use_count) as total_hits
   FROM route_polylines
   WHERE route_name IS NOT NULL
   GROUP BY route_name
   ORDER BY total_hits DESC
   LIMIT 10;
   ```

---

## Notes

- Polylines are cached per vehicle type (truck, car, bike)
- Cache is automatically updated when you call `/api/polylines/fetch-and-cache`
- LocalStorage cache expires after 7 days
- Database cache never expires (manual cleanup required)
- Always rebuild cache after re-importing `route.json` or `new_marker.json`

