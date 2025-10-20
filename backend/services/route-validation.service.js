const { createClient } = require('@supabase/supabase-js');
const config = require('../config/keys');

// Initialize Supabase Client
const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

/**
 * Route Validation Service
 * Validates routes before creation/update
 */
class RouteValidationService {
  /**
   * Validate entire route
   * @param {string} route_name - Route name
   * @param {Array} segments - Array of route segments
   * @returns {Object} { valid, errors, warnings }
   */
  async validateRoute(route_name, segments) {
    const errors = [];
    const warnings = [];

    // 1. Validate route name
    if (!route_name || route_name.trim() === '') {
      errors.push('Route name is required');
    }

    // 2. Validate segments array
    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      errors.push('At least one segment is required');
      return { valid: false, errors, warnings };
    }

    // 3. Validate each segment
    for (let i = 0; i < segments.length; i++) {
      const segmentErrors = await this.validateSegment(segments[i], i);
      errors.push(...segmentErrors);
    }

    // 4. Check for timing conflicts
    const timingConflicts = await this.checkTimingConflicts(route_name, segments);
    if (timingConflicts.length > 0) {
      warnings.push(...timingConflicts);
    }

    // 5. Check logical sequence
    const sequenceWarnings = this.checkLogicalSequence(segments);
    warnings.push(...sequenceWarnings);

    // 6. Check day offset consistency
    const dayOffsetWarnings = this.checkDayOffsetConsistency(segments);
    warnings.push(...dayOffsetWarnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate single segment
   * @param {Object} segment - Segment data
   * @param {number} index - Segment index
   * @returns {Array} Array of error messages
   */
  async validateSegment(segment, index) {
    const errors = [];
    const prefix = `Segment ${index + 1}:`;

    // Required fields
    if (!segment.hub_departer) {
      errors.push(`${prefix} hub_departer is required`);
    }
    if (!segment.hub_destination) {
      errors.push(`${prefix} hub_destination is required`);
    }
    if (!segment.departure_time) {
      errors.push(`${prefix} departure_time is required`);
    }
    if (!segment.arrival_time) {
      errors.push(`${prefix} arrival_time is required`);
    }

    // Validate time format (HH:MM:SS)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    if (segment.departure_time && !timeRegex.test(segment.departure_time)) {
      errors.push(`${prefix} Invalid departure_time format (expected HH:MM:SS)`);
    }
    if (segment.arrival_time && !timeRegex.test(segment.arrival_time)) {
      errors.push(`${prefix} Invalid arrival_time format (expected HH:MM:SS)`);
    }

    // Validate day_offset
    if (segment.day_offset !== undefined && segment.day_offset !== null) {
      if (![0, 1, 2].includes(segment.day_offset)) {
        errors.push(`${prefix} day_offset must be 0, 1, or 2`);
      }
    }

    // Validate note
    if (segment.note && !['D', 'D+1', 'D+2', 'Ngày D+1', 'Ngày D+2'].includes(segment.note)) {
      errors.push(`${prefix} Invalid note value (expected D, D+1, or D+2)`);
    }

    // Check hub existence
    if (segment.hub_departer) {
      const departerExists = await this.checkHubExists(segment.hub_departer);
      if (!departerExists) {
        errors.push(`${prefix} Hub departer '${segment.hub_departer}' not found in database`);
      }
    }

    if (segment.hub_destination) {
      const destinationExists = await this.checkHubExists(segment.hub_destination);
      if (!destinationExists) {
        errors.push(`${prefix} Hub destination '${segment.hub_destination}' not found in database`);
      }
    }

    return errors;
  }

  /**
   * Check if hub exists in database
   * @param {string} hubName - Hub name
   * @returns {boolean} True if exists
   */
  async checkHubExists(hubName) {
    try {
      // Check in destinations table
      const { data: destData, error: destError } = await supabase
        .from('destinations')
        .select('id')
        .eq('carrier_name', hubName)
        .limit(1);

      if (!destError && destData && destData.length > 0) {
        return true;
      }

      // Check in departers table
      const { data: depData, error: depError } = await supabase
        .from('departers')
        .select('id')
        .eq('name', hubName)
        .limit(1);

      if (!depError && depData && depData.length > 0) {
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error checking hub existence:', err);
      return false;
    }
  }

  /**
   * Check for timing conflicts
   * @param {string} route_name - Route name
   * @param {Array} segments - Segments to check
   * @returns {Array} Array of warning messages
   */
  async checkTimingConflicts(route_name, segments) {
    const warnings = [];

    try {
      // Get all existing routes with same departer
      for (const segment of segments) {
        const { data: existingSegments, error } = await supabase
          .from('route_schedules')
          .select('*')
          .eq('hub_departer', segment.hub_departer)
          .eq('departure_time', segment.departure_time)
          .neq('route_name', route_name);

        if (!error && existingSegments && existingSegments.length > 0) {
          warnings.push(
            `Timing conflict: ${segment.hub_departer} already has ${existingSegments.length} route(s) departing at ${segment.departure_time}`
          );
        }
      }
    } catch (err) {
      console.error('Error checking timing conflicts:', err);
    }

    return warnings;
  }

  /**
   * Check logical sequence of segments
   * @param {Array} segments - Segments to check
   * @returns {Array} Array of warning messages
   */
  checkLogicalSequence(segments) {
    const warnings = [];

    for (let i = 0; i < segments.length - 1; i++) {
      const current = segments[i];
      const next = segments[i + 1];

      // Check if arrival time is before next departure (for same departer)
      if (current.hub_departer === next.hub_departer) {
        const currentArrival = this.timeToMinutes(current.arrival_time);
        const nextDeparture = this.timeToMinutes(next.departure_time);

        if (currentArrival > nextDeparture && current.day_offset === next.day_offset) {
          warnings.push(
            `Sequence warning: Segment ${i + 1} arrives at ${current.arrival_time} but segment ${i + 2} departs at ${next.departure_time}`
          );
        }
      }
    }

    return warnings;
  }

  /**
   * Check day offset consistency
   * @param {Array} segments - Segments to check
   * @returns {Array} Array of warning messages
   */
  checkDayOffsetConsistency(segments) {
    const warnings = [];

    for (const segment of segments) {
      const departure = this.timeToMinutes(segment.departure_time);
      const arrival = this.timeToMinutes(segment.arrival_time);
      const dayOffset = segment.day_offset || 0;

      // If arrival < departure and day_offset = 0, should be D+1
      if (arrival < departure && dayOffset === 0) {
        warnings.push(
          `Day offset warning: ${segment.hub_departer} → ${segment.hub_destination} arrives before departure time but day_offset is 0 (should be 1)`
        );
      }

      // Check note consistency with day_offset
      if (segment.note) {
        const expectedNote = dayOffset === 0 ? 'D' : dayOffset === 1 ? 'D+1' : 'D+2';
        if (segment.note !== expectedNote && segment.note !== `Ngày ${expectedNote}`) {
          warnings.push(
            `Note inconsistency: day_offset is ${dayOffset} but note is '${segment.note}' (expected '${expectedNote}')`
          );
        }
      }
    }

    return warnings;
  }

  /**
   * Convert time string to minutes
   * @param {string} timeStr - Time in HH:MM:SS format
   * @returns {number} Minutes since midnight
   */
  timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

module.exports = new RouteValidationService();

