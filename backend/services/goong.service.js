const axios = require('axios');
const config = require('../config/keys');

/**
 * Goong API Service
 * Handles Geocoding and Distance Matrix API calls
 */
class GoongService {
  constructor() {
    this.apiKey = config.GOONG_API_KEY;
    this.baseURL = 'https://rsapi.goong.io';
  }

  /**
   * Geocode an address to coordinates
   * @param {string} address - Full address to geocode
   * @returns {Object} { success, data: { lat, lng, formatted_address } }
   */
  async geocode(address) {
    try {
      const url = `${this.baseURL}/Geocode`;
      const response = await axios.get(url, {
        params: {
          address: address,
          api_key: this.apiKey,
        },
      });

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        const location = result.geometry.location;

        return {
          success: true,
          data: {
            lat: location.lat,
            lng: location.lng,
            formatted_address: result.formatted_address,
            place_id: result.place_id,
          },
        };
      } else {
        return {
          success: false,
          error: 'No results found for this address',
        };
      }
    } catch (err) {
      console.error('Geocoding error:', err.message);
      return {
        success: false,
        error: err.response?.data?.error_message || err.message,
      };
    }
  }

  /**
   * Reverse geocode coordinates to address
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Object} { success, data: { formatted_address } }
   */
  async reverseGeocode(lat, lng) {
    try {
      const url = `${this.baseURL}/Geocode`;
      const response = await axios.get(url, {
        params: {
          latlng: `${lat},${lng}`,
          api_key: this.apiKey,
        },
      });

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];

        return {
          success: true,
          data: {
            formatted_address: result.formatted_address,
            place_id: result.place_id,
          },
        };
      } else {
        return {
          success: false,
          error: 'No results found for these coordinates',
        };
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err.message);
      return {
        success: false,
        error: err.response?.data?.error_message || err.message,
      };
    }
  }

  /**
   * Calculate distance and duration between two points
   * @param {Object} origin - { lat, lng }
   * @param {Object} destination - { lat, lng }
   * @param {string} vehicle - Vehicle type: 'car', 'bike', 'truck' (default: 'truck')
   * @returns {Object} { success, data: { distance_meters, duration_seconds } }
   */
  async calculateDistance(origin, destination, vehicle = 'truck') {
    try {
      const url = `${this.baseURL}/DistanceMatrix`;
      const origins = `${origin.lat},${origin.lng}`;
      const destinations = `${destination.lat},${destination.lng}`;

      const response = await axios.get(url, {
        params: {
          origins: origins,
          destinations: destinations,
          vehicle: vehicle,
          api_key: this.apiKey,
        },
      });

      if (response.data.rows && response.data.rows.length > 0) {
        const element = response.data.rows[0].elements[0];

        if (element.status === 'OK') {
          return {
            success: true,
            data: {
              distance_meters: element.distance.value,
              distance_text: element.distance.text,
              duration_seconds: element.duration.value,
              duration_text: element.duration.text,
            },
          };
        } else {
          return {
            success: false,
            error: `Distance calculation failed: ${element.status}`,
          };
        }
      } else {
        return {
          success: false,
          error: 'No distance data returned',
        };
      }
    } catch (err) {
      console.error('Distance calculation error:', err.message);
      return {
        success: false,
        error: err.response?.data?.error_message || err.message,
      };
    }
  }

  /**
   * Calculate distance matrix for multiple origins and destinations
   * @param {Array} origins - Array of { lat, lng }
   * @param {Array} destinations - Array of { lat, lng }
   * @param {string} vehicle - Vehicle type
   * @returns {Object} { success, data: matrix }
   */
  async calculateDistanceMatrix(origins, destinations, vehicle = 'truck') {
    try {
      const url = `${this.baseURL}/DistanceMatrix`;
      
      // Format origins and destinations
      const originsStr = origins.map(o => `${o.lat},${o.lng}`).join('|');
      const destinationsStr = destinations.map(d => `${d.lat},${d.lng}`).join('|');

      const response = await axios.get(url, {
        params: {
          origins: originsStr,
          destinations: destinationsStr,
          vehicle: vehicle,
          api_key: this.apiKey,
        },
      });

      if (response.data.rows) {
        return {
          success: true,
          data: {
            rows: response.data.rows,
            origin_addresses: response.data.origin_addresses,
            destination_addresses: response.data.destination_addresses,
          },
        };
      } else {
        return {
          success: false,
          error: 'No matrix data returned',
        };
      }
    } catch (err) {
      console.error('Distance matrix error:', err.message);
      return {
        success: false,
        error: err.response?.data?.error_message || err.message,
      };
    }
  }

  /**
   * Get autocomplete suggestions for an address
   * @param {string} input - Partial address input
   * @returns {Object} { success, data: predictions }
   */
  async autocomplete(input) {
    try {
      const url = `${this.baseURL}/Place/AutoComplete`;
      const response = await axios.get(url, {
        params: {
          input: input,
          api_key: this.apiKey,
        },
      });

      if (response.data.predictions) {
        return {
          success: true,
          data: {
            predictions: response.data.predictions,
          },
        };
      } else {
        return {
          success: false,
          error: 'No predictions found',
        };
      }
    } catch (err) {
      console.error('Autocomplete error:', err.message);
      return {
        success: false,
        error: err.response?.data?.error_message || err.message,
      };
    }
  }

  /**
   * Get place details by place_id
   * @param {string} placeId - Place ID from autocomplete or geocoding
   * @returns {Object} { success, data: place details }
   */
  async getPlaceDetails(placeId) {
    try {
      const url = `${this.baseURL}/Place/Detail`;
      const response = await axios.get(url, {
        params: {
          place_id: placeId,
          api_key: this.apiKey,
        },
      });

      if (response.data.result) {
        return {
          success: true,
          data: response.data.result,
        };
      } else {
        return {
          success: false,
          error: 'No place details found',
        };
      }
    } catch (err) {
      console.error('Place details error:', err.message);
      return {
        success: false,
        error: err.response?.data?.error_message || err.message,
      };
    }
  }
  /**
   * Optimize trip using Goong Trip API
   * @param {Object} origin - { lat, lng }
   * @param {Array} waypoints - [{ lat, lng, id, name }, ...]
   * @param {string} vehicle - 'car', 'bike', 'truck'
   * @returns {Object} Optimized route
   */
  async optimizeTrip(origin, waypoints, vehicle = 'truck') {
    try {
      // Goong Trip API endpoint
      const url = `${this.baseURL}/Trip`;

      // Build coordinates string: origin;waypoint1;waypoint2;...;origin
      const coords = [
        `${origin.lng},${origin.lat}`,
        ...waypoints.map(w => `${w.lng},${w.lat}`),
        `${origin.lng},${origin.lat}` // Return to origin
      ].join(';');

      const response = await axios.get(url, {
        params: {
          origin: `${origin.lng},${origin.lat}`,
          destination: `${origin.lng},${origin.lat}`,
          waypoints: waypoints.map(w => `${w.lng},${w.lat}`).join(';'),
          vehicle: vehicle,
          api_key: this.apiKey,
        },
      });

      if (response.data && response.data.trips && response.data.trips.length > 0) {
        const trip = response.data.trips[0];

        // Parse waypoint order
        const waypointOrder = trip.waypoint_order || [];
        const optimizedRoute = [];

        // Add origin
        optimizedRoute.push({
          stop_number: 0,
          location: {
            lat: origin.lat,
            lng: origin.lng,
            name: 'Departer'
          },
          distance_from_previous: 0,
          duration_from_previous: 0
        });

        // Add waypoints in optimized order
        waypointOrder.forEach((index, i) => {
          const waypoint = waypoints[index];
          optimizedRoute.push({
            stop_number: i + 1,
            location: {
              id: waypoint.id,
              name: waypoint.name,
              lat: waypoint.lat,
              lng: waypoint.lng
            }
          });
        });

        return {
          success: true,
          data: {
            route: optimizedRoute,
            summary: {
              total_distance_meters: trip.distance,
              total_distance_km: (trip.distance / 1000).toFixed(2),
              total_duration_seconds: trip.duration,
              total_duration_minutes: Math.round(trip.duration / 60),
              vehicle_type: vehicle
            },
            geometry: trip.geometry
          }
        };
      } else {
        return {
          success: false,
          error: 'No trip found'
        };
      }
    } catch (err) {
      console.error('Goong Trip API error:', err.message);
      return {
        success: false,
        error: err.message
      };
    }
  }
}

module.exports = new GoongService();

