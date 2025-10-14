# 📋 CREATE ROUTE_SEGMENTS TABLE IN SUPABASE

## ⚠️ IMPORTANT: Manual Step Required

The `route_segments` table needs to be created manually in Supabase Dashboard because the Supabase client doesn't have permission to execute DDL statements.

---

## 🔧 STEPS:

### 1. Open Supabase Dashboard
- Go to: https://supabase.com/dashboard
- Login with your account
- Select project: **attuecqofefmrjqtgzgo**

### 2. Open SQL Editor
- Click **SQL Editor** in left sidebar
- Click **New Query**

### 3. Copy & Paste This SQL:

```sql
-- Drop existing table if exists
DROP TABLE IF EXISTS route_segments CASCADE;

-- Create route_segments table
CREATE TABLE route_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Route Information
  route_name TEXT NOT NULL,
  segment_order INT NOT NULL,
  
  -- Location Information
  from_location_name TEXT NOT NULL,
  to_location_name TEXT NOT NULL,
  from_location_id UUID,
  to_location_id UUID,
  
  -- Metrics (Averages from historical data)
  avg_duration_minutes INT NOT NULL,
  distance_km DECIMAL(10,2) NOT NULL,
  
  -- Cargo Metrics (Averages)
  avg_orders INT DEFAULT 0,
  avg_packages INT DEFAULT 0,
  avg_bins INT DEFAULT 0,
  
  -- Start Time (only for segment_order = 0)
  start_time TIME,
  
  -- Metadata
  sample_size INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_route_segment UNIQUE (route_name, segment_order)
);

-- Create indexes for performance
CREATE INDEX idx_route_segments_route_name ON route_segments(route_name);
CREATE INDEX idx_route_segments_segment_order ON route_segments(segment_order);
CREATE INDEX idx_route_segments_from_location ON route_segments(from_location_id);
CREATE INDEX idx_route_segments_to_location ON route_segments(to_location_id);

-- Add comments
COMMENT ON TABLE route_segments IS 'Pre-calculated route segment data from historical trips';
COMMENT ON COLUMN route_segments.segment_order IS '0 = departer to first destination, 1 = dest1 to dest2, etc.';
COMMENT ON COLUMN route_segments.avg_duration_minutes IS 'Average travel time calculated from delivered_at differences';
COMMENT ON COLUMN route_segments.distance_km IS 'Distance from Goong API between two locations';
COMMENT ON COLUMN route_segments.start_time IS 'Mode of done_handover_at times (only for segment_order = 0)';
COMMENT ON COLUMN route_segments.sample_size IS 'Number of historical trips used for calculation';
```

### 4. Run the Query
- Click **Run** button (or press Ctrl+Enter)
- Wait for success message

### 5. Verify Table Created
- Click **Table Editor** in left sidebar
- You should see `route_segments` table in the list

---

## ✅ AFTER TABLE IS CREATED:

Run this command to import the calculated data:

```bash
node backend/scripts/calculate-segment-distances.js
```

This will:
- ✅ Analyze 1703 rows from Excel
- ✅ Calculate 44 route segments
- ✅ Get distances from Goong API
- ✅ Insert into `route_segments` table

---

## 📊 EXPECTED RESULT:

```
============================================================
📊 SUMMARY
============================================================
Total segments analyzed: 44
Distances calculated: 44
Segments inserted: 44  ← Should be 44, not 0
Errors: 0
============================================================
```

---

## 🚨 IF YOU GET ERRORS:

### Error: "permission denied"
- Make sure you're using the **SQL Editor** in Supabase Dashboard
- Don't use the Supabase client to create tables

### Error: "table already exists"
- The table was created successfully
- Just run the import script again

---

## 📝 NEXT STEPS AFTER TABLE IS CREATED:

1. ✅ Create table in Supabase Dashboard (this step)
2. ✅ Run import script: `node backend/scripts/calculate-segment-distances.js`
3. ✅ Create API endpoint to fetch segments
4. ✅ Update frontend to display segments
5. ✅ Test in browser

---

**🎯 Please create the table now and let me know when it's done!**

