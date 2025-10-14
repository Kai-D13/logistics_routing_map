/**
 * VRP (Vehicle Routing Problem) Module
 * Handles route optimization for multiple destinations
 */

class VRPManager {
  constructor(map) {
    this.map = map;
    this.departers = [];
    this.destinations = [];
    this.selectedDeparter = null;
    this.selectedDestinations = [];
    this.optimizedRoute = null;
    this.routeLayer = null;
    this.routeMarkers = [];
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
  }

  /**
   * Load departers and destinations
   */
  async loadData() {
    try {
      // Load departers
      const departersRes = await fetch(`${API_BASE_URL}/locations/departers`);
      const departersData = await departersRes.json();
      if (departersData.success) {
        this.departers = departersData.data;
        this.populateDeparterSelect();
      }

      // Load destinations
      const destinationsRes = await fetch(`${API_BASE_URL}/locations/destinations`);
      const destinationsData = await destinationsRes.json();
      if (destinationsData.success) {
        this.destinations = destinationsData.data;
        this.populateDestinationsList();
      }
    } catch (error) {
      console.error('Error loading VRP data:', error);
      showNotification('Lỗi khi tải dữ liệu', 'error');
    }
  }

  /**
   * Populate departer select
   */
  populateDeparterSelect() {
    const select = document.getElementById('vrp-departer-select');
    if (!select) return;

    select.innerHTML = '<option value="">-- Chọn điểm xuất phát --</option>';

    this.departers.forEach(dep => {
      const option = document.createElement('option');
      option.value = dep.id;
      // Departers use 'name' field, destinations use 'carrier_name'
      option.textContent = dep.name || dep.carrier_name;
      select.appendChild(option);
    });
  }

  /**
   * Populate destinations list with checkboxes
   */
  populateDestinationsList() {
    const container = document.getElementById('vrp-destinations-list');
    if (!container) return;

    container.innerHTML = '';

    this.destinations.forEach(dest => {
      const div = document.createElement('div');
      div.className = 'destination-checkbox-item';
      
      div.innerHTML = `
        <label>
          <input type="checkbox" value="${dest.id}" data-name="${dest.carrier_name}">
          <span>${dest.carrier_name}</span>
        </label>
      `;
      
      container.appendChild(div);
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Departer selection
    const departerSelect = document.getElementById('vrp-departer-select');
    if (departerSelect) {
      departerSelect.addEventListener('change', (e) => {
        this.selectedDeparter = e.target.value;
      });
    }

    // Calculate route button
    const calculateBtn = document.getElementById('calculate-route-btn');
    if (calculateBtn) {
      calculateBtn.addEventListener('click', () => this.calculateRoute());
    }

    // Optimize button
    const optimizeBtn = document.getElementById('optimize-route-btn');
    if (optimizeBtn) {
      optimizeBtn.addEventListener('click', () => this.optimizeRoute());
    }

    // Clear button
    const clearBtn = document.getElementById('clear-vrp-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearVRP());
    }

    // Close result panel
    const closeBtn = document.getElementById('close-vrp-result');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.clearVRP());
    }

    // Select all / Deselect all
    const selectAllBtn = document.getElementById('select-all-destinations');
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => this.selectAllDestinations());
    }

    const deselectAllBtn = document.getElementById('deselect-all-destinations');
    if (deselectAllBtn) {
      deselectAllBtn.addEventListener('click', () => this.deselectAllDestinations());
    }
  }

  /**
   * Select all destinations
   */
  selectAllDestinations() {
    const checkboxes = document.querySelectorAll('#vrp-destinations-list input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
  }

  /**
   * Deselect all destinations
   */
  deselectAllDestinations() {
    const checkboxes = document.querySelectorAll('#vrp-destinations-list input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
  }

  /**
   * Get selected destinations
   */
  getSelectedDestinations() {
    const checkboxes = document.querySelectorAll('#vrp-destinations-list input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
  }

  /**
   * Calculate route (without optimization - just sequential)
   */
  async calculateRoute() {
    // Validate inputs
    if (!this.selectedDeparter) {
      showNotification('Vui lòng chọn điểm xuất phát', 'warning');
      return;
    }

    const selectedDestIds = this.getSelectedDestinations();
    if (selectedDestIds.length === 0) {
      showNotification('Vui lòng chọn ít nhất 1 điểm đến', 'warning');
      return;
    }

    if (selectedDestIds.length > 20) {
      showNotification('Tối đa 20 điểm đến', 'warning');
      return;
    }

    try {
      showNotification('Đang tính toán khoảng cách...', 'info');

      // Get departer
      const departer = this.departers.find(d => d.id === this.selectedDeparter);
      if (!departer) {
        showNotification('Không tìm thấy điểm xuất phát', 'error');
        return;
      }

      // Get selected destinations in order
      const selectedDests = this.destinations.filter(d => selectedDestIds.includes(d.id));

      // Calculate distances sequentially
      const route = [];
      let totalDistance = 0;
      let totalDuration = 0;
      let currentLocation = { lat: departer.lat, lng: departer.lng };

      // Add departer as first stop
      route.push({
        stop_number: 0,
        location: {
          id: departer.id,
          name: departer.name || departer.carrier_name,
          lat: departer.lat,
          lng: departer.lng
        },
        distance_from_previous: 0,
        duration_from_previous: 0,
        cumulative_distance: 0,
        cumulative_duration: 0
      });

      // Calculate distance to each destination
      for (let i = 0; i < selectedDests.length; i++) {
        const dest = selectedDests[i];

        const distanceResult = await API.calculateDistance(
          currentLocation,
          { lat: dest.lat, lng: dest.lng },
          'truck'
        );

        if (distanceResult.success) {
          const distance = distanceResult.data.distance_meters;
          const duration = distanceResult.data.duration_seconds;

          totalDistance += distance;
          totalDuration += duration;

          route.push({
            stop_number: i + 1,
            location: {
              id: dest.id,
              name: dest.carrier_name,
              lat: dest.lat,
              lng: dest.lng,
              address: dest.address
            },
            distance_from_previous: distance,
            duration_from_previous: duration,
            cumulative_distance: totalDistance,
            cumulative_duration: totalDuration
          });

          currentLocation = { lat: dest.lat, lng: dest.lng };
        }
      }

      // Display result
      const result = {
        route,
        summary: {
          total_stops: route.length,
          total_distance_meters: totalDistance,
          total_distance_km: (totalDistance / 1000).toFixed(2),
          total_duration_seconds: totalDuration,
          total_duration_minutes: Math.round(totalDuration / 60),
          total_duration_formatted: this.formatDuration(totalDuration),
          vehicle_type: 'truck'
        }
      };

      this.optimizedRoute = result;
      this.displayOptimizedRoute(result, 'sequential');
      showNotification('Tính toán hoàn tất!', 'success');

    } catch (error) {
      console.error('Error calculating route:', error);
      showNotification('Lỗi khi tính toán khoảng cách', 'error');
    }
  }

  /**
   * Optimize route
   */
  async optimizeRoute() {
    // Validate inputs
    if (!this.selectedDeparter) {
      showNotification('Vui lòng chọn điểm xuất phát', 'warning');
      return;
    }

    const selectedDestIds = this.getSelectedDestinations();
    if (selectedDestIds.length === 0) {
      showNotification('Vui lòng chọn ít nhất 1 điểm đến', 'warning');
      return;
    }

    if (selectedDestIds.length > 20) {
      showNotification('Tối đa 20 điểm đến', 'warning');
      return;
    }

    try {
      showNotification('Đang tối ưu tuyến đường...', 'info');

      const response = await fetch(`${API_BASE_URL}/vrp/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          departer_id: this.selectedDeparter,
          destination_ids: selectedDestIds,
          vehicle: 'truck'
        })
      });

      const result = await response.json();

      if (result.success) {
        this.optimizedRoute = result.data;
        this.displayOptimizedRoute(result.data, result.method);
        showNotification(`Tối ưu thành công! (${result.method === 'goong_trip_api' ? 'Goong API' : 'Nearest Neighbor'})`, 'success');
      } else {
        showNotification('Lỗi khi tối ưu: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error optimizing route:', error);
      showNotification('Lỗi khi tối ưu tuyến đường', 'error');
    }
  }

  /**
   * Display optimized route
   */
  displayOptimizedRoute(routeData, method) {
    // Show result panel
    const panel = document.getElementById('vrp-result-panel');
    if (panel) {
      panel.classList.add('active');
    }

    // Display route info
    this.displayRouteInfo(routeData, method);

    // Display route steps
    this.displayRouteSteps(routeData.route);

    // Draw route on map
    this.drawOptimizedRouteOnMap(routeData.route);
  }

  /**
   * Display route information
   */
  displayRouteInfo(routeData, method) {
    const container = document.getElementById('vrp-route-info');
    if (!container) return;

    // Handle both formats: { total_distance, total_duration } and { summary: {...} }
    const summary = routeData.summary || routeData;
    const totalDistance = summary.total_distance_km || (summary.total_distance / 1000).toFixed(2);
    const totalDuration = summary.total_duration_formatted || this.formatDuration(summary.total_duration);
    const totalStops = summary.total_stops || routeData.route.length;

    const methodLabel = method === 'goong_trip_api' ? 'Goong API' :
                       method === 'nearest_neighbor' ? 'Nearest Neighbor' :
                       method === 'sequential' ? 'Tuần Tự' : 'Unknown';

    container.innerHTML = `
      <div class="route-info-grid">
        <div class="info-card">
          <div class="info-icon">📏</div>
          <div class="info-content">
            <span class="info-label">Tổng quãng đường</span>
            <span class="info-value">${totalDistance} km</span>
          </div>
        </div>
        <div class="info-card">
          <div class="info-icon">⏱️</div>
          <div class="info-content">
            <span class="info-label">Tổng thời gian</span>
            <span class="info-value">${totalDuration}</span>
          </div>
        </div>
        <div class="info-card">
          <div class="info-icon">📍</div>
          <div class="info-content">
            <span class="info-label">Số điểm dừng</span>
            <span class="info-value">${totalStops - 1}</span>
          </div>
        </div>
        <div class="info-card">
          <div class="info-icon">🤖</div>
          <div class="info-content">
            <span class="info-label">Phương pháp</span>
            <span class="info-value">${methodLabel}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Display route steps
   */
  displayRouteSteps(route) {
    const container = document.getElementById('vrp-route-steps');
    if (!container) return;

    let html = '<div class="route-steps">';

    route.forEach((stop, index) => {
      // Handle both formats
      const location = stop.location || stop;
      const name = location.name || 'Unknown';
      const distance = stop.distance_from_previous || 0;
      const duration = stop.duration_from_previous || 0;
      const distanceKm = (distance / 1000).toFixed(2);
      const durationMin = Math.round(duration / 60);

      html += `
        <div class="route-step">
          <div class="step-number">${index}</div>
          <div class="step-content">
            <h4>${name}</h4>
            ${index > 0 ? `
              <div class="step-metrics">
                <span class="metric">📏 ${distanceKm} km</span>
                <span class="metric">⏱️ ${durationMin} phút</span>
              </div>
            ` : '<div class="step-label">Điểm xuất phát</div>'}
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  /**
   * Draw optimized route on map
   */
  drawOptimizedRouteOnMap(route) {
    // Clear existing route
    this.clearRouteFromMap();

    // Create layer group
    this.routeLayer = L.layerGroup().addTo(this.map);

    // Add numbered markers
    route.forEach((stop, index) => {
      // Handle both formats: { lat, lng, name } and { location: { lat, lng, name } }
      const location = stop.location || stop;
      const lat = location.lat;
      const lng = location.lng;
      const name = location.name;

      if (!lat || !lng) {
        console.error('Invalid location data:', stop);
        return;
      }

      const markerIcon = this.createNumberedMarker(
        index,
        index === 0 ? '#10b981' : '#ef4444'
      );

      const marker = L.marker([lat, lng], { icon: markerIcon })
        .bindPopup(`
          <div class="marker-popup">
            <strong>${index === 0 ? '🏢 Xuất phát' : `📍 Điểm ${index}`}</strong><br>
            ${name}
          </div>
        `);

      this.routeLayer.addLayer(marker);
      this.routeMarkers.push(marker);
    });

    // Draw polyline
    const latlngs = route.map(stop => {
      const location = stop.location || stop;
      return [location.lat, location.lng];
    });
    const polyline = L.polyline(latlngs, {
      color: '#8b5cf6',
      weight: 5,
      opacity: 0.8
    }).addTo(this.routeLayer);

    // Add direction arrows
    const decorator = L.polylineDecorator(polyline, {
      patterns: [
        {
          offset: 25,
          repeat: 100,
          symbol: L.Symbol.arrowHead({
            pixelSize: 12,
            polygon: false,
            pathOptions: { stroke: true, color: '#8b5cf6', weight: 3 }
          })
        }
      ]
    }).addTo(this.routeLayer);

    // Fit map to route
    const bounds = polyline.getBounds();
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  /**
   * Create numbered marker
   */
  createNumberedMarker(number, color) {
    const svgIcon = `
      <svg width="36" height="46" viewBox="0 0 36 46" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 0C8.059 0 0 8.059 0 18c0 13.5 18 28 18 28s18-14.5 18-28c0-9.941-8.059-18-18-18z" 
              fill="${color}" stroke="#fff" stroke-width="2"/>
        <text x="18" y="22" font-size="16" font-weight="bold" fill="#fff" 
              text-anchor="middle" dominant-baseline="middle">
          ${number}
        </text>
      </svg>
    `;

    return L.divIcon({
      html: svgIcon,
      className: 'numbered-marker',
      iconSize: [36, 46],
      iconAnchor: [18, 46],
      popupAnchor: [0, -46]
    });
  }

  /**
   * Format duration (seconds to HH:MM)
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Clear VRP
   */
  clearVRP() {
    // Clear selections
    this.deselectAllDestinations();
    
    const departerSelect = document.getElementById('vrp-departer-select');
    if (departerSelect) {
      departerSelect.value = '';
    }

    this.selectedDeparter = null;
    this.optimizedRoute = null;

    // Clear map
    this.clearRouteFromMap();

    // Hide result panel
    const panel = document.getElementById('vrp-result-panel');
    if (panel) {
      panel.classList.remove('active');
    }
  }

  /**
   * Clear route from map
   */
  clearRouteFromMap() {
    if (this.routeLayer) {
      this.map.removeLayer(this.routeLayer);
      this.routeLayer = null;
    }
    this.routeMarkers = [];
  }
}

// Export for use in main.js
window.VRPManager = VRPManager;

