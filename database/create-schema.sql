-- ============================================================
-- CREATE FRESH SCHEMA (Run AFTER force-clean.sql)
-- ============================================================

-- ============================================================
-- TABLE: route_schedules
-- ============================================================
CREATE TABLE route_schedules (
  id SERIAL PRIMARY KEY,
  
  -- Route Information
  route_name VARCHAR(255) NOT NULL,
  
  -- Hub Information
  hub_departer VARCHAR(255) NOT NULL,
  hub_destination VARCHAR(255) NOT NULL,
  
  -- Timing Information
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  day_offset INTEGER DEFAULT 0,
  
  -- Distance & Duration
  distance_km DECIMAL(10, 2),
  duration_hours DECIMAL(10, 2),
  
  -- Metadata
  note VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add unique constraint
ALTER TABLE route_schedules 
ADD CONSTRAINT unique_route_segment 
UNIQUE (route_name, hub_departer, hub_destination, departure_time);

-- Create indexes
CREATE INDEX idx_route_name ON route_schedules(route_name);
CREATE INDEX idx_hub_departer ON route_schedules(hub_departer);
CREATE INDEX idx_hub_destination ON route_schedules(hub_destination);
CREATE INDEX idx_departure_time ON route_schedules(departure_time);

-- ============================================================
-- TABLE: hub_tiers
-- ============================================================
CREATE TABLE hub_tiers (
  id SERIAL PRIMARY KEY,
  hub_name VARCHAR(255) NOT NULL UNIQUE,
  tier INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert hub tier data
INSERT INTO hub_tiers (hub_name, tier, description) VALUES
  ('Hub VSIP II', 1, 'Primary Hub - Bình Dương'),
  ('Hub VSIP Bắc Ninh', 1, 'Primary Hub - Bắc Ninh'),
  ('Hub Cần Thơ', 1, 'Primary Hub - Cần Thơ'),
  ('NVCT Hub Thành Phố Cà Mau_Child', 2, 'Secondary Hub - Receives from Cần Thơ, distributes to Cà Mau area'),
  ('NVCT Hub Sóc Trăng-CT', 2, 'Secondary Hub - Receives from Cần Thơ, distributes to Sóc Trăng area');

-- ============================================================
-- VIEW: route_summary
-- ============================================================
CREATE VIEW route_summary AS
SELECT 
  route_name,
  hub_departer,
  MIN(departure_time) as first_departure,
  COUNT(DISTINCT hub_destination) as total_destinations,
  SUM(distance_km) as total_distance_km,
  MAX(arrival_time) as last_arrival,
  MAX(day_offset) as max_day_offset,
  STRING_AGG(DISTINCT hub_destination, ', ' ORDER BY hub_destination) as destinations_list
FROM route_schedules
GROUP BY route_name, hub_departer
ORDER BY route_name;

-- ============================================================
-- VIEW: hub_connections
-- ============================================================
CREATE VIEW hub_connections AS
SELECT 
  hub_departer as hub_name,
  'OUTBOUND' as direction,
  COUNT(DISTINCT hub_destination) as connection_count,
  STRING_AGG(DISTINCT hub_destination, ', ' ORDER BY hub_destination) as connected_hubs
FROM route_schedules
GROUP BY hub_departer
UNION ALL
SELECT 
  hub_destination as hub_name,
  'INBOUND' as direction,
  COUNT(DISTINCT hub_departer) as connection_count,
  STRING_AGG(DISTINCT hub_departer, ', ' ORDER BY hub_departer) as connected_hubs
FROM route_schedules
GROUP BY hub_destination
ORDER BY hub_name, direction;

-- ============================================================
-- FUNCTION: Calculate actual arrival
-- ============================================================
CREATE FUNCTION calculate_actual_arrival(
  p_departure_time TIME,
  p_arrival_time TIME,
  p_day_offset INTEGER
) RETURNS INTERVAL AS $$
BEGIN
  IF p_arrival_time < p_departure_time AND p_day_offset = 0 THEN
    RETURN (p_arrival_time - p_departure_time) + INTERVAL '1 day';
  ELSE
    RETURN (p_arrival_time - p_departure_time) + (p_day_offset || ' days')::INTERVAL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 'Schema created successfully!' as status;

-- Tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('route_schedules', 'hub_tiers')
ORDER BY table_name;

-- Views
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' AND table_name IN ('route_summary', 'hub_connections')
ORDER BY table_name;

-- Function
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'calculate_actual_arrival';

-- Hub tiers
SELECT COUNT(*) as total_hubs FROM hub_tiers;
SELECT * FROM hub_tiers ORDER BY tier, hub_name;

