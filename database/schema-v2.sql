-- ============================================
-- Logistics Routing System - Database Schema V2
-- Following the official documentation
-- ============================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS destinations CASCADE;
DROP TABLE IF EXISTS departers CASCADE;
DROP TABLE IF EXISTS locations CASCADE;

-- ============================================
-- Table: departers (Hub chính - điểm xuất phát)
-- ============================================
CREATE TABLE departers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Location Information
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  
  -- Coordinates (from Goong Geocoding API)
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  
  -- Formatted address from Goong
  formatted_address TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table: destinations (Hub con - điểm đích)
-- ============================================
CREATE TABLE destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Location Information
  carrier_name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  
  -- Administrative divisions
  ward_name VARCHAR(100),
  district_name VARCHAR(100),
  province_name VARCHAR(100),
  
  -- Coordinates (from Goong Geocoding API)
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  
  -- Formatted address from Goong
  formatted_address TEXT,
  
  -- Foreign Key to departer
  departer_id UUID REFERENCES departers(id) ON DELETE CASCADE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional Info (JSON for flexibility)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================
-- Table: routes (Lưu trữ khoảng cách và thời gian)
-- ============================================
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  departer_id UUID NOT NULL REFERENCES departers(id) ON DELETE CASCADE,
  destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  
  -- Distance Information
  distance_km DECIMAL(8, 2),
  distance_meters INTEGER,
  
  -- Duration Information
  duration_minutes INTEGER,
  duration_seconds INTEGER,
  
  -- Calculation Metadata
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one route per departer-destination pair
  UNIQUE(departer_id, destination_id)
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Departers indexes
CREATE INDEX idx_departers_active ON departers(is_active);
CREATE INDEX idx_departers_name ON departers(name);
CREATE INDEX idx_departers_coordinates ON departers(lat, lng);

-- Destinations indexes
CREATE INDEX idx_destinations_active ON destinations(is_active);
CREATE INDEX idx_destinations_carrier_name ON destinations(carrier_name);
CREATE INDEX idx_destinations_province ON destinations(province_name);
CREATE INDEX idx_destinations_district ON destinations(district_name);
CREATE INDEX idx_destinations_departer ON destinations(departer_id);
CREATE INDEX idx_destinations_coordinates ON destinations(lat, lng);

-- Routes indexes
CREATE INDEX idx_routes_departer ON routes(departer_id);
CREATE INDEX idx_routes_destination ON routes(destination_id);
CREATE INDEX idx_routes_distance ON routes(distance_km);
CREATE INDEX idx_routes_duration ON routes(duration_minutes);

-- ============================================
-- Functions: Update timestamp automatically
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Triggers: Auto-update updated_at
-- ============================================
CREATE TRIGGER update_departers_updated_at
  BEFORE UPDATE ON departers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_destinations_updated_at
  BEFORE UPDATE ON destinations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Sample Data: Main Departer
-- ============================================
INSERT INTO departers (name, address, lat, lng, formatted_address) VALUES
('Hub Cần Thơ', 'Mai Chí Thọ Phường Phú Thứ Quận Cái Răng Thành phố Cần Thơ', 10.0452, 105.7469, 'Mai Chí Thọ, Phường Phú Thứ, Quận Cái Răng, Thành phố Cần Thơ');

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE departers IS 'Stores main hubs (departure points)';
COMMENT ON TABLE destinations IS 'Stores destination hubs (delivery points)';
COMMENT ON TABLE routes IS 'Stores calculated distances and durations between departers and destinations';

COMMENT ON COLUMN departers.name IS 'Display name of the main hub';
COMMENT ON COLUMN departers.formatted_address IS 'Standardized address from Goong Geocoding API';

COMMENT ON COLUMN destinations.carrier_name IS 'Display name of the destination hub/carrier';
COMMENT ON COLUMN destinations.ward_name IS 'Ward/Commune name';
COMMENT ON COLUMN destinations.district_name IS 'District name';
COMMENT ON COLUMN destinations.province_name IS 'Province/City name';
COMMENT ON COLUMN destinations.departer_id IS 'Reference to the main hub this destination belongs to';

COMMENT ON COLUMN routes.distance_km IS 'Distance in kilometers (for display)';
COMMENT ON COLUMN routes.distance_meters IS 'Distance in meters (precise value from API)';
COMMENT ON COLUMN routes.duration_minutes IS 'Duration in minutes (for display)';
COMMENT ON COLUMN routes.duration_seconds IS 'Duration in seconds (precise value from API)';
COMMENT ON COLUMN routes.last_calculated IS 'Timestamp of last distance calculation';

