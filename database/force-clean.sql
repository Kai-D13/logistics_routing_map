-- ============================================================
-- FORCE CLEAN - XÓA TẤT CẢ KHÔNG CẦN CHECK
-- ============================================================

-- Step 1: Drop all views
DROP VIEW IF EXISTS route_summary CASCADE;
DROP VIEW IF EXISTS hub_connections CASCADE;

-- Step 2: Drop all functions
DROP FUNCTION IF EXISTS calculate_actual_arrival(TIME, TIME, INTEGER) CASCADE;

-- Step 3: Drop constraint by searching and dropping dynamically
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Find and drop all constraints named 'unique_route_segment'
  FOR r IN 
    SELECT table_schema, table_name, constraint_name
    FROM information_schema.table_constraints
    WHERE constraint_name = 'unique_route_segment'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I CASCADE', 
                   r.table_schema, r.table_name, r.constraint_name);
    RAISE NOTICE 'Dropped constraint % from %.%', r.constraint_name, r.table_schema, r.table_name;
  END LOOP;
END $$;

-- Step 4: Drop all indexes named 'unique_route_segment'
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT schemaname, indexname
    FROM pg_indexes
    WHERE indexname = 'unique_route_segment'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS %I.%I CASCADE', r.schemaname, r.indexname);
    RAISE NOTICE 'Dropped index %.%', r.schemaname, r.indexname;
  END LOOP;
END $$;

-- Step 5: Drop all other indexes
DROP INDEX IF EXISTS idx_route_name CASCADE;
DROP INDEX IF EXISTS idx_hub_departer CASCADE;
DROP INDEX IF EXISTS idx_hub_destination CASCADE;
DROP INDEX IF EXISTS idx_departure_time CASCADE;

-- Step 6: Drop all tables
DROP TABLE IF EXISTS route_schedules CASCADE;
DROP TABLE IF EXISTS hub_tiers CASCADE;

-- ============================================================
-- VERIFY CLEAN
-- ============================================================
SELECT 'Cleanup complete!' as status;

-- Check no constraints remain
SELECT COUNT(*) as remaining_constraints
FROM information_schema.table_constraints
WHERE constraint_name = 'unique_route_segment';

-- Check no indexes remain
SELECT COUNT(*) as remaining_indexes
FROM pg_indexes
WHERE indexname = 'unique_route_segment';

-- Check no tables remain
SELECT COUNT(*) as remaining_tables
FROM information_schema.tables
WHERE table_name IN ('route_schedules', 'hub_tiers');

