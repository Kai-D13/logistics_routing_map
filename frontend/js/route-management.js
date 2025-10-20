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
    console.log('🚀 Initializing Route Management...');
    await this.loadRoutes();
    await this.loadDeparters();
    this.setupEventListeners();
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
   * Load all departers for filter
   */
  async loadDeparters() {
    try {
      const response = await fetch(`${API_BASE_URL}/routes/departers`);
      const result = await response.json();

      if (result.success) {
        this.allDeparters = result.data;
        this.populateDeparterFilter();
        console.log(`✅ Loaded ${result.total} departers`);
      }
    } catch (error) {
      console.error('Error loading departers:', error);
    }
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
   * Populate departer filter
   */
  populateDeparterFilter() {
    const select = document.getElementById('filter-departer');
    if (!select) return;

    select.innerHTML = '<option value="">-- Tất cả Hub --</option>';

    this.allDeparters.forEach(departer => {
      const option = document.createElement('option');
      option.value = departer;
      option.textContent = departer;
      select.appendChild(option);
    });
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

    // Search filters
    const searchBtn = document.getElementById('search-routes-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.searchRoutes());
    }

    // Clear filters
    const clearBtn = document.getElementById('clear-filters-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearFilters());
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
   * Display route on map
   */
  async displayRouteOnMap() {
    // Clear previous markers and polylines
    this.clearRouteDisplay();

    if (!this.currentRoute || !this.currentRoute.segments) return;

    const { segments } = this.currentRoute;
    const bounds = [];

    // Get coordinates for all hubs
    for (const segment of segments) {
      try {
        // Get departer coordinates
        const departerCoords = await this.getHubCoordinates(segment.hub_departer);
        if (departerCoords) {
          const marker = L.marker([departerCoords.lat, departerCoords.lng], {
            icon: L.divIcon({
              className: 'custom-marker departer-marker',
              html: '<div>🏠</div>',
              iconSize: [30, 30]
            })
          }).addTo(map);

          marker.bindPopup(`<b>${segment.hub_departer}</b><br>Xuất phát: ${segment.departure_time}`);
          this.routeMarkers.push(marker);
          bounds.push([departerCoords.lat, departerCoords.lng]);
        }

        // Get destination coordinates
        const destCoords = await this.getHubCoordinates(segment.hub_destination);
        if (destCoords) {
          const marker = L.marker([destCoords.lat, destCoords.lng], {
            icon: L.divIcon({
              className: 'custom-marker destination-marker',
              html: '<div>📍</div>',
              iconSize: [30, 30]
            })
          }).addTo(map);

          marker.bindPopup(`
            <b>${segment.hub_destination}</b><br>
            Đến: ${segment.arrival_time}<br>
            ${segment.distance_km ? 'Khoảng cách: ' + segment.distance_km + ' km' : ''}
          `);
          this.routeMarkers.push(marker);
          bounds.push([destCoords.lat, destCoords.lng]);

          // Draw polyline if both coordinates exist
          if (departerCoords) {
            const polyline = L.polyline([
              [departerCoords.lat, departerCoords.lng],
              [destCoords.lat, destCoords.lng]
            ], {
              color: '#667eea',
              weight: 3,
              opacity: 0.7
            }).addTo(map);

            this.routePolylines.push(polyline);
          }
        }
      } catch (error) {
        console.error('Error displaying segment:', error);
      }
    }

    // Fit map to bounds
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
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
   * Search routes with filters
   */
  async searchRoutes() {
    const departer = document.getElementById('filter-departer')?.value || '';
    const note = document.getElementById('filter-note')?.value || '';

    try {
      let url = `${API_BASE_URL}/routes/search?`;
      if (departer) url += `hub_departer=${encodeURIComponent(departer)}&`;
      if (note) url += `note=${encodeURIComponent(note)}&`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        // Update route select with search results
        const routeNames = [...new Set(result.data.map(r => r.route_name))];
        const select = document.getElementById('route-select');

        select.innerHTML = '<option value="">-- Chọn Route --</option>';
        routeNames.forEach(name => {
          const option = document.createElement('option');
          option.value = name;
          option.textContent = name;
          select.appendChild(option);
        });

        showNotification(`Tìm thấy ${routeNames.length} routes`, 'success');
      }
    } catch (error) {
      console.error('Error searching routes:', error);
      showNotification('Lỗi khi tìm kiếm', 'error');
    }
  },

  /**
   * Clear filters
   */
  clearFilters() {
    document.getElementById('filter-departer').value = '';
    document.getElementById('filter-note').value = '';
    this.populateRouteSelect();
    showNotification('Đã xóa bộ lọc', 'info');
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

