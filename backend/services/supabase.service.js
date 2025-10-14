const { createClient } = require('@supabase/supabase-js');
const config = require('../config/keys');

// Initialize Supabase Client with custom fetch options
const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    }
  }
});

/**
 * Supabase Service V2
 * Handles all database operations with new schema (departers, destinations, routes)
 */
class SupabaseService {
  /**
   * Test database connection
   */
  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('departers')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ Supabase connection error:', error.message);
        return { success: false, error: error.message };
      }

      console.log('✅ Supabase connected successfully');
      return { success: true, message: 'Connected to Supabase' };
    } catch (err) {
      console.error('❌ Supabase connection failed:', err.message);
      return { success: false, error: err.message };
    }
  }

  // ============================================
  // DEPARTERS METHODS
  // ============================================

  /**
   * Get all departers
   * @param {boolean} activeOnly - Return only active departers
   */
  async getDeparters(activeOnly = true) {
    try {
      let query = supabase
        .from('departers')
        .select('*')
        .order('created_at', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      console.error('Error fetching departers:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get departer by ID
   */
  async getDeparterById(id) {
    try {
      const { data, error } = await supabase
        .from('departers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('Error fetching departer:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Create new departer
   */
  async createDeparter(departerData) {
    try {
      const { data, error } = await supabase
        .from('departers')
        .insert([departerData])
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Departer created:', data.name);
      return { success: true, data };
    } catch (err) {
      console.error('Error creating departer:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Update departer
   */
  async updateDeparter(id, updates) {
    try {
      const { data, error } = await supabase
        .from('departers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Departer updated:', data.name);
      return { success: true, data };
    } catch (err) {
      console.error('Error updating departer:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Delete departer (soft delete)
   */
  async deleteDeparter(id) {
    try {
      const { data, error } = await supabase
        .from('departers')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Departer deleted (soft):', data.name);
      return { success: true, data };
    } catch (err) {
      console.error('Error deleting departer:', err);
      return { success: false, error: err.message };
    }
  }

  // ============================================
  // DESTINATIONS METHODS
  // ============================================

  /**
   * Get all destinations
   */
  async getDestinations(activeOnly = true, departerId = null) {
    try {
      let query = supabase
        .from('destinations')
        .select('*, departers(*)')
        .order('created_at', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      if (departerId) {
        query = query.eq('departer_id', departerId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      console.error('Error fetching destinations:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get destination by ID
   */
  async getDestinationById(id) {
    try {
      const { data, error } = await supabase
        .from('destinations')
        .select('*, departers(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('Error fetching destination:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Create new destination
   */
  async createDestination(destinationData) {
    try {
      const { data, error } = await supabase
        .from('destinations')
        .insert([destinationData])
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Destination created:', data.carrier_name);
      return { success: true, data };
    } catch (err) {
      console.error('Error creating destination:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Update destination
   */
  async updateDestination(id, updates) {
    try {
      const { data, error } = await supabase
        .from('destinations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Destination updated:', data.carrier_name);
      return { success: true, data };
    } catch (err) {
      console.error('Error updating destination:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Delete destination (soft delete)
   */
  async deleteDestination(id) {
    try {
      const { data, error } = await supabase
        .from('destinations')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Destination deleted (soft):', data.carrier_name);
      return { success: true, data };
    } catch (err) {
      console.error('Error deleting destination:', err);
      return { success: false, error: err.message };
    }
  }

  // ============================================
  // ROUTES METHODS
  // ============================================

  /**
   * Get route between departer and destination
   */
  async getRoute(departerId, destinationId) {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*, departers(*), destinations(*)')
        .eq('departer_id', departerId)
        .eq('destination_id', destinationId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('Error fetching route:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get all routes for a departer
   */
  async getRoutesByDeparter(departerId) {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*, destinations(*)')
        .eq('departer_id', departerId)
        .order('distance_km', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('Error fetching routes:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Create or update route
   */
  async upsertRoute(routeData) {
    try {
      const { data, error } = await supabase
        .from('routes')
        .upsert([routeData], {
          onConflict: 'departer_id,destination_id',
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('Error upserting route:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Delete route
   */
  async deleteRoute(departerId, destinationId) {
    try {
      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('departer_id', departerId)
        .eq('destination_id', destinationId);

      if (error) throw error;
      console.log('✅ Route deleted');
      return { success: true };
    } catch (err) {
      console.error('Error deleting route:', err);
      return { success: false, error: err.message };
    }
  }
  // ============================================
  // TRIPS METHODS
  // ============================================

  /**
   * Create a new trip
   */
  async createTrip(tripData) {
    try {
      const { data, error } = await supabase
        .from('trips')
        .insert([tripData])
        .select()
        .single();

      if (error) {
        console.error('Error creating trip:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Error creating trip:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Add destination to trip
   */
  async addTripDestination(tripDestData) {
    try {
      const { data, error } = await supabase
        .from('trip_destinations')
        .insert([tripDestData])
        .select()
        .single();

      if (error) {
        console.error('Error adding trip destination:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Error adding trip destination:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get all trips
   */
  async getTrips() {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching trips:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Error fetching trips:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get trip by ID with destinations
   */
  async getTripById(tripId) {
    try {
      // Get trip
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (tripError) {
        return { success: false, error: tripError.message };
      }

      // Get trip destinations with destination details
      const { data: tripDests, error: destsError } = await supabase
        .from('trip_destinations')
        .select(`
          *,
          destinations (*)
        `)
        .eq('trip_id', tripId)
        .order('stop_order', { ascending: true });

      if (destsError) {
        return { success: false, error: destsError.message };
      }

      trip.destinations = tripDests;

      return { success: true, data: trip };
    } catch (err) {
      console.error('Error fetching trip:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get trips by route name with destinations
   */
  async getTripsByRouteName(routeName) {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          trip_destinations (
            *,
            destinations (*)
          )
        `)
        .ilike('route_name', `%${routeName}%`)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      // Sort destinations by stop_order for each trip
      const tripsWithSortedDestinations = data.map(trip => ({
        ...trip,
        destinations: trip.trip_destinations
          ? trip.trip_destinations.sort((a, b) => a.stop_order - b.stop_order)
          : []
      }));

      return { success: true, data: tripsWithSortedDestinations };
    } catch (err) {
      console.error('Error fetching trips by route:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get unique route names
   */
  async getUniqueRouteNames() {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('route_name')
        .order('route_name', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      // Get unique route names
      const uniqueRoutes = [...new Set(data.map(t => t.route_name))];

      return { success: true, data: uniqueRoutes };
    } catch (err) {
      console.error('Error fetching route names:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Delete trip by ID
   */
  async deleteTrip(tripId) {
    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);

      if (error) {
        console.error('Error deleting trip:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('Error deleting trip:', err.message);
      return { success: false, error: err.message };
    }
  }

  // ============================================
  // ROUTE SEGMENTS METHODS
  // ============================================

  /**
   * Get route segments for a specific route
   * @param {string} routeName - Route name
   */
  async getRouteSegments(routeName) {
    try {
      const { data, error } = await supabase
        .from('route_segments')
        .select('*')
        .eq('route_name', routeName)
        .order('segment_order', { ascending: true });

      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      console.error('Error fetching route segments:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get all route segments
   */
  async getAllRouteSegments() {
    try {
      const { data, error } = await supabase
        .from('route_segments')
        .select('*')
        .order('route_name', { ascending: true })
        .order('segment_order', { ascending: true });

      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      console.error('Error fetching all route segments:', err);
      return { success: false, error: err.message };
    }
  }
}

module.exports = new SupabaseService();

