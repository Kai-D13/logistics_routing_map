/**
 * Route Management Module
 * Handles route search, display, create, edit functionality
 */

const RouteManagement = {
  currentRoute: null,
  allRoutes: [],
  allDeparters: [],
  routeMarkers: [],
  routePolylines: [],

  /**
   * Initialize route management
   */
  async init() {
    await this.loadRoutes();
    this.setupEventListeners();
  },

  /**
   * Populate route select dropdown
   */
  populateRouteSelect() {
    const select = document.getElementById('route-select');
    if (!select) return;

    select.innerHTML = '<option value="">-- Chọn Route --</option>';

    this.allRoutes.forEach(route => {
      const option = document.createElement('option');
      option.value = route.route_name;
      option.textContent = `${route.route_name} (${route.total_destinations} điểm)`;
      select.appendChild(option);
    });
  },

  /**
   * Load all routes from API
   */
  async loadRoutes() {
    try {
      const response = await fetch(`${API_BASE_URL}/routes`);
      const result = await response.json();

      if (result.success) {
        this.allRoutes = result.data;
        this.populateRouteSelect();
        console.log(`✅ Loaded ${result.total} routes`);
      }
    } catch (error) {
      console.error('Error loading routes:', error);
      showNotification('Lỗi khi tải danh sách routes', 'error');
    }
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Route select change
    const routeSelect = document.getElementById('route-select');
    if (routeSelect) {
      routeSelect.addEventListener('change', (e) => {
        if (e.target.value) {
          this.loadRouteDetails(e.target.value);
        } else {
          this.clearRouteDisplay();
        }
      });
    }
  },

  /**
   * Load route details
   */
  async loadRouteDetails(routeName) {
    try {
      const response = await fetch(`${API_BASE_URL}/routes/${encodeURIComponent(routeName)}`);
      const result = await response.json();

      if (result.success) {
        this.currentRoute = result.data;
        this.displayRouteDetails();
        this.displayRouteOnMap();
      }
    } catch (error) {
      console.error('Error loading route details:', error);
      showNotification('Lỗi khi tải chi tiết route', 'error');
    }
  },

  /**
   * Display route details in UI
   */
  displayRouteDetails() {
    const container = document.getElementById('route-details-container');
    if (!container || !this.currentRoute) return;

    const { summary, segments } = this.currentRoute;

    let html = `
      <div class="route-details-card">
        <div class="route-header">
          <h3>📋 ${summary.route_name}</h3>
          <div class="route-actions">
            <button class="btn btn-sm btn-warning" onclick="RouteManagement.editRoute('${summary.route_name}')">
              ✏️ Sửa
            </button>
            <button class="btn btn-sm btn-danger" onclick="RouteManagement.deleteRoute('${summary.route_name}')">
              🗑️ Xóa
            </button>
          </div>
        </div>

        <div class="route-summary">
          <div class="summary-item">
            <span class="label">Hub Xuất Phát:</span>
            <span class="value">${summary.hub_departer}</span>
          </div>
          <div class="summary-item">
            <span class="label">Giờ Xuất Phát:</span>
            <span class="value">${summary.first_departure}</span>
          </div>
          <div class="summary-item">
            <span class="label">Tổng Điểm Đến:</span>
            <span class="value">${summary.total_destinations}</span>
          </div>
          <div class="summary-item">
            <span class="label">Tổng Quãng Đường:</span>
            <span class="value">${summary.total_distance_km ? summary.total_distance_km + ' km' : 'Chưa tính'}</span>
          </div>
          <div class="summary-item">
            <span class="label">Giờ Đến Cuối:</span>
            <span class="value">${summary.last_arrival}</span>
          </div>
        </div>

        <div class="route-segments">
          <h4>📍 Chi Tiết Các Điểm (${segments.length} điểm)</h4>
          <div class="segments-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Từ</th>
                  <th>Đến</th>
                  <th>Giờ Xuất Phát</th>
                  <th>Giờ Đến</th>
                  <th>Khoảng Cách</th>
                  <th>Thời Gian</th>
                  <th>Ghi Chú</th>
                </tr>
              </thead>
              <tbody>
    `;

    segments.forEach((seg, index) => {
      html += `
        <tr>
          <td>${index + 1}</td>
          <td>${seg.hub_departer}</td>
          <td>${seg.hub_destination}</td>
          <td>${seg.departure_time}</td>
          <td>${seg.arrival_time}</td>
          <td>${seg.distance_km ? seg.distance_km + ' km' : '-'}</td>
          <td>${seg.duration_hours ? seg.duration_hours + ' h' : '-'}</td>
          <td><span class="badge badge-${seg.note === 'D' ? 'success' : 'warning'}">${seg.note}</span></td>
        </tr>
      `;
    });

    html += `
              </tbody>
            </table>
          </div>
        </div>

        <div class="route-actions-bottom">
          <button class="btn btn-info" onclick="RouteManagement.calculateDistances('${summary.route_name}')">
            📏 Tính Khoảng Cách
          </button>
          <button class="btn btn-success" onclick="RouteManagement.exportRoute('${summary.route_name}')">
            💾 Xuất Excel
          </button>
        </div>
      </div>
    `;

    container.innerHTML = html;
  },

  /**
   * Display route on map with Goong Directions API
   */
  async displayRouteOnMap() {
    // Clear previous markers and polylines
    this.clearRouteDisplay();

    if (!this.currentRoute || !this.currentRoute.segments) return;

    const { segments } = this.currentRoute;
    const bounds = [];
    const orderedWaypoints = [];
    const seenHubs = new Set();

    console.log(`📍 Building route map for ${segments.length} segments`);

    // Step 1: Build ORDERED waypoints following the route sequence
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      try {
        // Add departer if not already added
        if (!seenHubs.has(segment.hub_departer)) {
          const departerCoords = await this.getHubCoordinates(segment.hub_departer);
          if (departerCoords) {
            orderedWaypoints.push({
              name: segment.hub_departer,
              lat: departerCoords.lat,
              lng: departerCoords.lng,
              type: 'departer',
              order: orderedWaypoints.length + 1
            });
            seenHubs.add(segment.hub_departer);
            bounds.push([departerCoords.lat, departerCoords.lng]);
          }
        }

        // Add destination
        if (!seenHubs.has(segment.hub_destination)) {
          const destCoords = await this.getHubCoordinates(segment.hub_destination);
          if (destCoords) {
            orderedWaypoints.push({
              name: segment.hub_destination,
              lat: destCoords.lat,
              lng: destCoords.lng,
              type: 'destination',
              order: orderedWaypoints.length + 1,
              arrival_time: segment.arrival_time,
              distance_km: segment.distance_km
            });
            seenHubs.add(segment.hub_destination);
            bounds.push([destCoords.lat, destCoords.lng]);
          }
        }
      } catch (error) {
        console.error(`Error processing segment ${i}:`, error);
      }
    }

    console.log(`✅ Collected ${orderedWaypoints.length} unique waypoints`);

    // Step 2: Add NUMBERED markers for route sequence
    orderedWaypoints.forEach((waypoint, index) => {
      const markerIcon = waypoint.type === 'departer' 
        ? L.divIcon({
            className: 'custom-marker departer-marker',
            html: `<div style="background: #ef4444; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${waypoint.order}</div>`,
            iconSize: [30, 30]
          })
        : L.divIcon({
            className: 'custom-marker destination-marker',
            html: `<div style="background: #3b82f6; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${waypoint.order}</div>`,
            iconSize: [30, 30]
          });

      const marker = L.marker([waypoint.lat, waypoint.lng], {
        icon: markerIcon
      }).addTo(map);

      const popupContent = `
        <div style="min-width: 150px;">
          <strong>${waypoint.order}. ${waypoint.name}</strong><br>
          <span style="color: #64748b;">
            ${waypoint.type === 'departer' ? '🏠 Hub Chính' : '📍 Điểm Đến'}
          </span>
          ${waypoint.arrival_time ? `<br>⏰ ${waypoint.arrival_time}` : ''}
          ${waypoint.distance_km ? `<br>📏 ${waypoint.distance_km} km` : ''}
        </div>
      `;
      marker.bindPopup(popupContent);
      this.routeMarkers.push(marker);
    });

    // Step 3: Get realistic routing from Goong Directions API
    if (orderedWaypoints.length >= 2) {
      try {
        // Build waypoints array for API (only lat/lng)
        const apiWaypoints = orderedWaypoints.map(w => ({ 
          lat: w.lat, 
          lng: w.lng 
        }));
        
        console.log('📡 Calling Directions API with', apiWaypoints.length, 'waypoints');
        
        // Call Directions API
        const response = await fetch(`${API_BASE_URL}/directions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            waypoints: apiWaypoints,
            vehicle: 'truck'
          })
        });

        const result = await response.json();
        console.log('📡 Directions API response:', result);

        if (result.success && result.data && result.data.overview_polyline) {
          // Decode polyline and draw on map
          const decodedPoints = this.decodePolyline(result.data.overview_polyline);
          
          console.log(`✅ Decoded ${decodedPoints.length} polyline points`);
          
          const polyline = L.polyline(decodedPoints, {
            color: '#667eea',
            weight: 4,
            opacity: 0.8,
            smoothFactor: 1
          }).addTo(map);

          this.routePolylines.push(polyline);

          // Show route info
          const totalDistance = result.data.total_distance_km || 
                                (result.data.total_distance_meters / 1000).toFixed(2);
          const totalDuration = result.data.total_duration_text || 
                                result.data.total_duration_hours + ' giờ';
          
          showNotification(
            `✅ Tuyến đường: ${totalDistance} km • Thời gian: ${totalDuration}`,
            'success',
            5000
          );
        } else {
          // Fallback: draw simple lines if Directions API fails
          console.warn('⚠️ Directions API failed:', result.error || 'No polyline data');
          console.log('📊 Full response data:', result.data);
          showNotification('⚠️ Không thể tải đường đi từ Goong API, sử dụng đường thẳng', 'warning');
          this.drawFallbackPolylines(orderedWaypoints);
        }
      } catch (error) {
        console.error('❌ Error calling Directions API:', error);
        showNotification('❌ Lỗi kết nối Goong API, sử dụng đường thẳng', 'error');
        this.drawFallbackPolylines(orderedWaypoints);
      }
    }

    // Step 4: Fit map to bounds
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  },

  /**
   * Fallback method: Draw straight polylines if Directions API fails
   */
  drawFallbackPolylines(orderedWaypoints) {
    if (!orderedWaypoints || orderedWaypoints.length < 2) return;

    // Draw straight lines between consecutive waypoints
    for (let i = 0; i < orderedWaypoints.length - 1; i++) {
      const from = orderedWaypoints[i];
      const to = orderedWaypoints[i + 1];

      const polyline = L.polyline([
        [from.lat, from.lng],
        [to.lat, to.lng]
      ], {
        color: '#94a3b8',
        weight: 3,
        opacity: 0.6,
        dashArray: '10, 10'
      }).addTo(map);

      this.routePolylines.push(polyline);
    }
  },

  /**
   * Get hub coordinates from API
   */
  async getHubCoordinates(hubName) {
    try {
      // Try destinations first
      const destResponse = await fetch(`${API_BASE_URL}/locations/destinations`);
      const destResult = await destResponse.json();

      if (destResult.success) {
        const destination = destResult.data.find(d => d.carrier_name === hubName);
        if (destination && destination.lat && destination.lng) {
          return { lat: destination.lat, lng: destination.lng };
        }
      }

      // Try departers
      const depResponse = await fetch(`${API_BASE_URL}/locations/departers`);
      const depResult = await depResponse.json();

      if (depResult.success) {
        const departer = depResult.data.find(d => d.name === hubName);
        if (departer && departer.lat && departer.lng) {
          return { lat: departer.lat, lng: departer.lng };
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting hub coordinates:', error);
      return null;
    }
  },

  /**
   * Clear route display
   */
  clearRouteDisplay() {
    // Remove markers
    this.routeMarkers.forEach(marker => map.removeLayer(marker));
    this.routeMarkers = [];

    // Remove polylines
    this.routePolylines.forEach(polyline => map.removeLayer(polyline));
    this.routePolylines = [];

    // Clear details container
    const container = document.getElementById('route-details-container');
    if (container) {
      container.innerHTML = '';
    }
  },

  /**
   * Calculate distances for route
   */
  async calculateDistances(routeName) {
    if (!confirm(`Tính khoảng cách cho tất cả các điểm trong route "${routeName}"?`)) {
      return;
    }

    try {
      showNotification('Đang tính khoảng cách...', 'info');

      const response = await fetch(
        `${API_BASE_URL}/routes/${encodeURIComponent(routeName)}/calculate-distances`,
        { method: 'POST' }
      );

      const result = await response.json();

      if (result.success) {
        showNotification(result.message, 'success');
        // Reload route details
        await this.loadRouteDetails(routeName);
      } else {
        showNotification('Lỗi: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error calculating distances:', error);
      showNotification('Lỗi khi tính khoảng cách', 'error');
    }
  },

  /**
   * Edit route
   */
  async editRoute(routeName) {
    showNotification('Chức năng chỉnh sửa route đang được phát triển', 'info');
  },

  /**
   * Delete route
   */
  async deleteRoute(routeName) {
    if (!confirm(`Bạn có chắc chắn muốn xóa route "${routeName}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/routes/${encodeURIComponent(routeName)}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (result.success) {
        showNotification('Đã xóa route thành công', 'success');
        this.clearRouteDisplay();
        await this.loadRoutes();
      } else {
        showNotification('Lỗi: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      showNotification('Lỗi khi xóa route', 'error');
    }
  },

  /**
   * Export route to Excel
   */
  async exportRoute(routeName) {
    showNotification('Chức năng xuất Excel đang được phát triển', 'info');
  },

  /**
   * Decode Google/Goong polyline format
   */
  decodePolyline(encoded) {
    const points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push([lat / 1e5, lng / 1e5]);
    }

    return points;
  }
};

// Helper function for notifications
function showNotification(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) {
    console.log(`[${type.toUpperCase()}] ${message}`);
    return;
  }

  toast.textContent = message;
  toast.className = `toast toast-${type} show`;

  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => RouteManagement.init());
} else {
  RouteManagement.init();
}

// Expose to window for external access
window.RouteManagement = RouteManagement;

