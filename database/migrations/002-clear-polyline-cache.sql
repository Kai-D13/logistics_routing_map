-- ============================================================
-- UTILITY: Clear polyline cache
-- Purpose: Use this when you re-import route.json or new_marker.json
-- ============================================================

-- ============================================================
-- OPTION 1: Clear ALL cache (use when re-importing everything)
-- ============================================================
-- TRUNCATE TABLE route_polylines;
-- SELECT 'All polyline cache cleared' as status;

-- ============================================================
-- OPTION 2: Clear cache for specific route
-- ============================================================
-- DELETE FROM route_polylines WHERE route_name = 'Bắc Ninh - Sơn La, Minh Khai (cutoff 14h30)';
-- SELECT 'Cache cleared for specific route' as status;

-- ============================================================
-- OPTION 3: Clear cache for specific hub
-- ============================================================
-- DELETE FROM route_polylines WHERE hub_from = 'Hub VSIP Bắc Ninh' OR hub_to = 'Hub VSIP Bắc Ninh';
-- SELECT 'Cache cleared for specific hub' as status;

-- ============================================================
-- OPTION 4: Clear old cache (older than 30 days)
-- ============================================================
-- DELETE FROM route_polylines WHERE created_at < NOW() - INTERVAL '30 days';
-- SELECT 'Old cache cleared (>30 days)' as status;

-- ============================================================
-- OPTION 5: View cache statistics before clearing
-- ============================================================
SELECT 
  COUNT(*) as total_cached_segments,
  COUNT(DISTINCT route_name) as total_routes,
  COUNT(DISTINCT hub_from) as unique_hubs_from,
  COUNT(DISTINCT hub_to) as unique_hubs_to,
  SUM(use_count) as total_cache_hits,
  AVG(use_count) as avg_cache_hits_per_segment,
  MIN(created_at) as oldest_cache,
  MAX(created_at) as newest_cache,
  MIN(last_used_at) as least_recently_used,
  MAX(last_used_at) as most_recently_used
FROM route_polylines;

-- ============================================================
-- OPTION 6: View cache by route
-- ============================================================
SELECT 
  route_name,
  COUNT(*) as segments_cached,
  SUM(use_count) as total_hits,
  MAX(last_used_at) as last_used
FROM route_polylines
WHERE route_name IS NOT NULL
GROUP BY route_name
ORDER BY total_hits DESC;

