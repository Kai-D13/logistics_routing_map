-- ============================================
-- Logistics Routing System - Database Schema
-- ============================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS locations CASCADE;

-- ============================================
-- Table: locations
-- Description: Stores all departure and destination points
-- ============================================
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Location Information
  carrier_name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  
  -- Coordinates (from Goong Geocoding API)
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Location Type
  location_type VARCHAR(50) NOT NULL CHECK (location_type IN ('departer', 'destination')),
  
  -- Distance & Duration (calculated from departer)
  distance_km DECIMAL(10, 2) DEFAULT NULL,
  duration_minutes INTEGER DEFAULT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional Info (JSON for flexibility)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX idx_locations_type ON locations(location_type);
CREATE INDEX idx_locations_active ON locations(is_active);
CREATE INDEX idx_locations_carrier_name ON locations(carrier_name);
CREATE INDEX idx_locations_coordinates ON locations(latitude, longitude);

-- ============================================
-- Function: Update timestamp automatically
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Trigger: Auto-update updated_at
-- ============================================
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================
-- Main Hub (Departer)
INSERT INTO locations (carrier_name, address, latitude, longitude, location_type, distance_km, duration_minutes) VALUES
('Hub Cần Thơ', 'Số 1 Đường 3/2, Xuân Khánh, Ninh Kiều, Cần Thơ', 10.0452, 105.7469, 'departer', 0, 0);

-- Sample Destinations (You can add your 30 locations here)
INSERT INTO locations (carrier_name, address, latitude, longitude, location_type) VALUES
('Hub Sa Đéc', 'Đường Hùng Vương, Phường 1, Sa Đéc, Đồng Tháp', 10.2981, 105.7583, 'destination'),
('Hub Vĩnh Long', 'Đường 1 Tháng 5, Phường 9, Vĩnh Long', 10.2395, 105.9572, 'destination'),
('Hub Phú Quốc', 'Đường Trần Hưng Đạo, Dương Đông, Phú Quốc, Kiên Giang', 10.2269, 103.9675, 'destination'),
('Hub Rạch Giá', 'Đường Nguyễn Trung Trực, Rạch Giá, Kiên Giang', 10.0125, 105.0808, 'destination'),
('Hub Hà Tiên', 'Đường Phú Quốc, Hà Tiên, Kiên Giang', 10.3833, 104.4833, 'destination');

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE locations IS 'Stores all departure and destination locations for logistics routing';
COMMENT ON COLUMN locations.carrier_name IS 'Display name of the location/hub';
COMMENT ON COLUMN locations.location_type IS 'Type: departer (main hub) or destination (delivery points)';
COMMENT ON COLUMN locations.distance_km IS 'Distance from main departer in kilometers';
COMMENT ON COLUMN locations.duration_minutes IS 'Estimated travel time from main departer in minutes';

