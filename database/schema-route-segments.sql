-- ============================================
-- ROUTE SEGMENTS TABLE
-- ============================================
-- Stores pre-calculated route segment data
-- Each segment represents travel between two points
-- Data calculated from historical trip data (Excel)
-- ============================================

-- Drop existing table if exists
DROP TABLE IF EXISTS route_segments CASCADE;

-- Create route_segments table
CREATE TABLE route_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Route Information
  route_name TEXT NOT NULL,
  segment_order INT NOT NULL, -- 0: departer→dest1, 1: dest1→dest2, 2: dest2→dest3, ...
  
  -- Location Information
  from_location_name TEXT NOT NULL,
  to_location_name TEXT NOT NULL,
  from_location_id UUID, -- Reference to departers or destinations table
  to_location_id UUID,   -- Reference to destinations table
  
  -- Metrics (Averages from historical data)
  avg_duration_minutes INT NOT NULL, -- Average travel time between locations
  distance_km DECIMAL(10,2) NOT NULL, -- Distance from Goong API
  
  -- Cargo Metrics (Averages)
  avg_orders INT DEFAULT 0,  -- Average number of orders
  avg_packages INT DEFAULT 0, -- Average number of packages
  avg_bins INT DEFAULT 0,     -- Average number of bins
  
  -- Start Time (only for segment_order = 0)
  start_time TIME, -- Mode/Average of done_handover_at for first destination
  
  -- Metadata
  sample_size INT DEFAULT 0, -- Number of trips used to calculate averages
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

