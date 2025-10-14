-- ============================================
-- Add Trips Table for Route Management
-- Date: 2025-10-13
-- ============================================

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Trip Information
  code VARCHAR(100) UNIQUE NOT NULL,
  trip_code VARCHAR(100),
  route_name TEXT NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'PENDING',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE,
  done_handover_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Driver & Employee
  driver_name VARCHAR(255),
  handover_employee VARCHAR(255),
  license_plate VARCHAR(50),
  
  -- Metadata
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trip_destinations junction table
CREATE TABLE IF NOT EXISTS trip_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  
  -- Order in route
  stop_order INTEGER NOT NULL,
  
  -- Delivery Information
  delivered_at TIMESTAMP WITH TIME ZONE,
  num_orders INTEGER DEFAULT 0,
  num_packages INTEGER DEFAULT 0,
  num_bins INTEGER DEFAULT 0,
  
  -- Images
  delivery_image TEXT,
  pick_up_image TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(trip_id, destination_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trips_code ON trips(code);
CREATE INDEX IF NOT EXISTS idx_trips_trip_code ON trips(trip_code);
CREATE INDEX IF NOT EXISTS idx_trips_route_name ON trips(route_name);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trip_destinations_trip ON trip_destinations(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_destinations_destination ON trip_destinations(destination_id);
CREATE INDEX IF NOT EXISTS idx_trip_destinations_order ON trip_destinations(stop_order);

-- Trigger for updated_at
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE trips IS 'Stores trip/route information from CSV data';
COMMENT ON TABLE trip_destinations IS 'Junction table linking trips to destinations with delivery details';
COMMENT ON COLUMN trips.route_name IS 'Route name like "Cần Thơ - Hậu Giang - Sóc Trăng - Bạc Liêu"';
COMMENT ON COLUMN trip_destinations.stop_order IS 'Order of this destination in the route (1, 2, 3, ...)';

