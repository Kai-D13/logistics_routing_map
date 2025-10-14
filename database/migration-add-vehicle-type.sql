-- ============================================
-- Migration: Add vehicle_type column to routes table
-- Date: 2025-10-13
-- ============================================

-- Add vehicle_type column to routes table
ALTER TABLE routes 
ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(20) DEFAULT 'truck';

-- Add index for vehicle_type
CREATE INDEX IF NOT EXISTS idx_routes_vehicle_type ON routes(vehicle_type);

-- Add comment
COMMENT ON COLUMN routes.vehicle_type IS 'Type of vehicle used for route calculation: truck, car, bike';

-- ============================================
-- Clean up all existing data (HARD DELETE)
-- ============================================

-- Delete all routes first (due to foreign key constraints)
DELETE FROM routes;

-- Delete all destinations
DELETE FROM destinations;

-- Keep departers (we want to keep the main hub)

-- ============================================
-- Verification
-- ============================================
SELECT 'Migration completed successfully!' AS status;
SELECT COUNT(*) AS departers_count FROM departers;
SELECT COUNT(*) AS destinations_count FROM destinations;
SELECT COUNT(*) AS routes_count FROM routes;

