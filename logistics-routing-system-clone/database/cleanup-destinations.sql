-- ============================================================
-- CLEANUP DESTINATIONS TABLE
-- ============================================================
-- This script will DELETE all data from destinations table
-- Keep the table structure intact
-- ============================================================

-- Step 1: Check current count
SELECT COUNT(*) as current_count FROM destinations;

-- Step 2: Delete all data
DELETE FROM destinations;

-- Step 3: Verify empty
SELECT COUNT(*) as after_cleanup FROM destinations;

-- ============================================================
-- DONE!
-- ============================================================
-- destinations table is now empty and ready for new data
-- ============================================================

