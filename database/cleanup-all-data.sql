-- ============================================
-- CLEANUP ALL DATA - HARD DELETE
-- This will permanently delete all destinations and routes
-- Date: 2025-10-13
-- ============================================

-- Step 1: Delete all routes first (due to foreign key constraints)
DELETE FROM routes;

-- Step 2: Delete all destinations (HARD DELETE - not soft delete)
DELETE FROM destinations;

-- Step 3: Add vehicle_type column if not exists
ALTER TABLE routes 
ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(20) DEFAULT 'truck';

-- Step 4: Add index for vehicle_type if not exists
CREATE INDEX IF NOT EXISTS idx_routes_vehicle_type ON routes(vehicle_type);

-- Step 5: Add comment
COMMENT ON COLUMN routes.vehicle_type IS 'Type of vehicle used for route calculation: truck, car, bike';

-- ============================================
-- Verification - Check counts
-- ============================================
SELECT 
    'Cleanup completed!' AS status,
    (SELECT COUNT(*) FROM departers) AS departers_count,
    (SELECT COUNT(*) FROM destinations) AS destinations_count,
    (SELECT COUNT(*) FROM routes) AS routes_count;

-- ============================================
-- Expected Result:
-- departers_count: 1 (Hub Chính Cần Thơ)
-- destinations_count: 0
-- routes_count: 0
-- ============================================

