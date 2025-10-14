-- ============================================================
-- SETUP PUBLIC ACCESS FOR VERCEL DEPLOYMENT
-- ============================================================
-- Run this SQL in Supabase SQL Editor
-- This allows public read access to all tables
-- ============================================================

-- OPTION 1: DISABLE RLS (Simplest - Less secure)
-- Uncomment if you want simplest setup
/*
ALTER TABLE departers DISABLE ROW LEVEL SECURITY;
ALTER TABLE destinations DISABLE ROW LEVEL SECURITY;
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_destinations DISABLE ROW LEVEL SECURITY;
ALTER TABLE routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE route_segments DISABLE ROW LEVEL SECURITY;
*/

-- OPTION 2: ENABLE RLS + PUBLIC READ POLICIES (Recommended - More secure)
-- This allows public read but prevents unauthorized writes

-- Enable RLS on all tables
ALTER TABLE departers ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_segments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access" ON departers;
DROP POLICY IF EXISTS "Allow public read access" ON destinations;
DROP POLICY IF EXISTS "Allow public read access" ON trips;
DROP POLICY IF EXISTS "Allow public read access" ON trip_destinations;
DROP POLICY IF EXISTS "Allow public read access" ON routes;
DROP POLICY IF EXISTS "Allow public read access" ON route_segments;

-- Create public read policies
CREATE POLICY "Allow public read access" ON departers
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access" ON destinations
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access" ON trips
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access" ON trip_destinations
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access" ON routes
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access" ON route_segments
  FOR SELECT
  USING (true);

-- ============================================================
-- VERIFICATION
-- ============================================================
-- Run these queries to verify policies are created:

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('departers', 'destinations', 'trips', 'trip_destinations', 'routes', 'route_segments')
ORDER BY tablename, policyname;

-- ============================================================
-- SUCCESS!
-- ============================================================
-- Your database is now ready for public deployment!
-- Users can READ data but cannot INSERT/UPDATE/DELETE
-- ============================================================

