-- ============================================================
-- MIGRATION: Create route_polylines table for caching Goong API responses
-- Purpose: Cache polyline data to reduce API costs and improve performance
-- ============================================================

-- ============================================================
-- TABLE: route_polylines
-- ============================================================
CREATE TABLE IF NOT EXISTS route_polylines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Segment Information
  route_name VARCHAR(255),  -- Optional: for grouping by route
  hub_from VARCHAR(255) NOT NULL,
  hub_to VARCHAR(255) NOT NULL,
  
  -- Polyline Data (from Goong Directions API)
  polyline_encoded TEXT NOT NULL,  -- Encoded polyline string from Goong API
  
  -- Distance & Duration (from Goong API)
  distance_meters INTEGER NOT NULL,
  distance_km DECIMAL(10, 2) NOT NULL,
  duration_seconds INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  duration_text VARCHAR(50),  -- e.g., "2 giờ 30 phút"
  
  -- Additional API Response Data
  vehicle_type VARCHAR(20) DEFAULT 'truck',
  api_response JSONB,  -- Store full API response for debugging
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW(),  -- Track cache usage
  use_count INTEGER DEFAULT 0,  -- Track how many times this cache was used
  
  -- Unique constraint: One polyline per segment per vehicle type
  CONSTRAINT unique_segment_polyline UNIQUE (hub_from, hub_to, vehicle_type)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_route_polylines_route_name ON route_polylines(route_name);
CREATE INDEX idx_route_polylines_segment ON route_polylines(hub_from, hub_to);
CREATE INDEX idx_route_polylines_vehicle ON route_polylines(vehicle_type);
CREATE INDEX idx_route_polylines_created_at ON route_polylines(created_at);
CREATE INDEX idx_route_polylines_last_used ON route_polylines(last_used_at);

-- ============================================================
-- FUNCTION: Update updated_at timestamp automatically
-- ============================================================
CREATE OR REPLACE FUNCTION update_route_polylines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGER: Auto-update updated_at on UPDATE
-- ============================================================
CREATE TRIGGER trigger_update_route_polylines_updated_at
  BEFORE UPDATE ON route_polylines
  FOR EACH ROW
  EXECUTE FUNCTION update_route_polylines_updated_at();

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON TABLE route_polylines IS 'Cache table for Goong Directions API polyline responses to reduce API costs';
COMMENT ON COLUMN route_polylines.polyline_encoded IS 'Encoded polyline string from Goong API (can be decoded to lat/lng points)';
COMMENT ON COLUMN route_polylines.api_response IS 'Full JSON response from Goong API for debugging and future reference';
COMMENT ON COLUMN route_polylines.use_count IS 'Number of times this cached polyline has been used (for analytics)';
COMMENT ON COLUMN route_polylines.last_used_at IS 'Last time this cache was accessed (for cache invalidation strategy)';

-- ============================================================
-- VERIFICATION
-- ============================================================
-- Check if table was created
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'route_polylines'
ORDER BY ordinal_position;

-- Check indexes
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'route_polylines';

