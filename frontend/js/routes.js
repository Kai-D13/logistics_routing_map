/**
 * Route Management Module
 * Handles viewing historical routes from trips data
 */

class RouteManager {
  constructor(map) {
    this.map = map;
    this.currentRouteLayer = null;
    this.currentMarkers = [];
    this.routes = [];
    this.init();
  }

  async init() {
    await this.loadRouteNames();
    this.setupEventListeners();
  }

  /**
   * Load unique route names for dropdown
   */
  async loadRouteNames() {
    try {
      const response = await fetch(`${API_BASE_URL}/trips/routes`);
      const result = await response.json();

      if (result.success) {
        this.routes = result.data;
        this.populateRouteDropdown();
      }
    } catch (error) {
      console.error('Error loading route names:', error);
      showNotification('Failed to load routes', 'error');
    }
  }

  /**
   * Populate route dropdown
   */
  populateRouteDropdown() {
    const select = document.getElementById('route-select');
    if (!select) return;

    select.innerHTML = '<option value="">-- Chọn Route --</option>';
    
    this.routes.forEach(routeName => {
      const option = document.createElement('option');
      option.value = routeName;
      option.textContent = routeName;
      select.appendChild(option);
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const select = document.getElementById('route-select');
    if (select) {
      select.addEventListener('change', (e) => {
        if (e.target.value) {
          this.loadRouteByName(e.target.value);
        } else {
          this.clearRoute();
        }
      });
    }

    const closeBtn = document.getElementById('close-route-details');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.clearRoute();
        const select = document.getElementById('route-select');
        if (select) select.value = '';
      });
    }
  }

  /**
   * Load route by name - NEW VERSION using route_segments
   */
  async loadRouteByName(routeName) {
    try {
      showNotification('Đang tải route...', 'info');

      // Fetch route segments instead of trips
      const response = await fetch(`${API_BASE_URL}/route-segments/${encodeURIComponent(routeName)}`);
      const result = await response.json();

      if (result.success && result.data.length > 0) {
        await this.displayRouteSegments(routeName, result.data);
        showNotification(`Đã tải route: ${routeName}`, 'success');
      } else {
        showNotification('Không tìm thấy dữ liệu cho route này', 'warning');
      }
    } catch (error) {
      console.error('Error loading route:', error);
      showNotification('Lỗi khi tải route', 'error');
    }
  }

  /**
   * Display route segments - NEW VERSION
   */
  async displayRouteSegments(routeName, segments) {
    this.clearRoute();

    // Store current segments
    this.currentSegments = segments;
    this.currentRouteName = routeName;

    // Show details panel
    const panel = document.getElementById('route-details-panel');
    if (panel) {
      panel.classList.add('active');
    }

    // Display route info (simplified - no trip details)
    this.displayRouteInfo(routeName, segments);

    // Display segments timeline
    this.displaySegmentsTimeline(segments);

    // Draw route on map
    await this.drawSegmentsOnMap(segments);
  }

  /**
   * Display route on map and details panel - OLD VERSION (keep for fallback)
   */
  async displayRoute(trip) {
    this.clearRoute();

    // Store current trip
    this.currentTrip = trip;

    // Show details panel
    const panel = document.getElementById('route-details-panel');
    if (panel) {
      panel.classList.add('active');
    }

    // Display trip info
    this.displayTripInfo(trip);

    // Display destinations timeline
    await this.displayDestinationsTimeline(trip.destinations);

    // Draw route on map
    await this.drawRouteOnMap(trip);
  }

  /**
   * Display trip information
   */
  displayTripInfo(trip) {
    const container = document.getElementById('trip-info');
    if (!container) return;

    const createdAt = trip.created_at ? new Date(trip.created_at).toLocaleString('vi-VN') : 'N/A';
    const completedAt = trip.completed_at ? new Date(trip.completed_at).toLocaleString('vi-VN') : 'N/A';

    container.innerHTML = `
      <div class="trip-info-grid">
        <div class="info-item">
          <span class="label">Mã chuyến:</span>
          <span class="value">${trip.trip_code || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="label">Tài xế:</span>
          <span class="value">${trip.driver_name || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="label">Biển số:</span>
          <span class="value">${trip.license_plate || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="label">Trạng thái:</span>
          <span class="value status-${trip.status?.toLowerCase()}">${trip.status || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="label">Bắt đầu:</span>
          <span class="value">${createdAt}</span>
        </div>
        <div class="info-item">
          <span class="label">Hoàn thành:</span>
          <span class="value">${completedAt}</span>
        </div>
      </div>
    `;
  }

  /**
   * Display destinations timeline
   */
  async displayDestinationsTimeline(destinations) {
    const container = document.getElementById('destinations-timeline');
    if (!container) return;

    // Get departer (all trips start from main hub)
    const departer = await this.getDeparter();
    const departerId = departer?.id;

    console.log('🔍 Departer:', departer);
    console.log('🔍 Departer ID:', departerId);

    if (!departerId) {
      console.warn('⚠️ No departer found');
    }

    let html = '<div class="timeline">';
    let totalDistance = 0;
    let totalDuration = 0;

    for (let index = 0; index < destinations.length; index++) {
      const dest = destinations[index];
      const deliveredAt = dest.delivered_at ? new Date(dest.delivered_at).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      }) : 'N/A';

      // Fetch route data from cache
      let routeInfo = '';
      if (departerId && dest.destinations?.id) {
        try {
          console.log(`🔍 Fetching route: departer=${departerId}, dest=${dest.destinations.id}`);
          const routeResult = await API.getRoute(departerId, dest.destinations.id);
          console.log('📊 Route result:', routeResult);

          if (routeResult.success && routeResult.data) {
            const distanceKm = routeResult.data.distance_km || 0;
            const durationMin = routeResult.data.duration_minutes || 0;
            totalDistance += distanceKm;
            totalDuration += durationMin;

            routeInfo = `
              <div class="route-metrics">
                <span class="metric">📏 ${distanceKm} km</span>
                <span class="metric">⏱️ ${durationMin} phút</span>
              </div>
            `;
          } else {
            console.warn('⚠️ No route data found');
          }
        } catch (error) {
          console.error('❌ Error fetching route:', error);
        }
      } else {
        console.warn('⚠️ Missing departerId or destination.id:', { departerId, destId: dest.destinations?.id });
      }

      html += `
        <div class="timeline-item">
          <div class="timeline-marker">${dest.stop_order}</div>
          <div class="timeline-content">
            <div class="timeline-header">
              <h4>${dest.destinations?.carrier_name || 'Unknown'}</h4>
              <span class="timeline-time">${deliveredAt}</span>
            </div>
            <div class="timeline-details">
              <span class="detail-badge">📦 ${dest.num_orders || 0} đơn</span>
              <span class="detail-badge">📫 ${dest.num_packages || 0} kiện</span>
              <span class="detail-badge">🗃️ ${dest.num_bins || 0} bins</span>
            </div>
            ${routeInfo}
            ${dest.destinations?.address ? `<p class="timeline-address">📍 ${dest.destinations.address}</p>` : ''}
          </div>
        </div>
      `;
    }

    // Add total summary
    if (totalDistance > 0) {
      const totalHours = Math.floor(totalDuration / 60);
      const totalMinutes = totalDuration % 60;
      const totalTimeFormatted = totalHours > 0
        ? `${totalHours}h ${totalMinutes}m`
        : `${totalMinutes}m`;

      html += `
        <div class="timeline-summary">
          <div class="summary-card">
            <span class="summary-icon">📏</span>
            <div class="summary-content">
              <span class="summary-label">Tổng quãng đường</span>
              <span class="summary-value">${totalDistance.toFixed(2)} km</span>
            </div>
          </div>
          <div class="summary-card">
            <span class="summary-icon">⏱️</span>
            <div class="summary-content">
              <span class="summary-label">Tổng thời gian</span>
              <span class="summary-value">${totalTimeFormatted}</span>
            </div>
          </div>
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;
  }

  /**
   * Draw route on map
   */
  async drawRouteOnMap(trip) {
    if (!trip.destinations || trip.destinations.length === 0) return;

    // Clear existing markers
    this.clearRouteMarkers();

    // Create layer group for route
    this.currentRouteLayer = L.layerGroup().addTo(this.map);

    // Get departer (assuming first destination's departer or use default)
    const departer = await this.getDeparter();

    // Prepare waypoints
    const waypoints = [];

    if (departer) {
      waypoints.push({
        lat: departer.lat || departer.latitude,
        lng: departer.lng || departer.longitude,
        name: departer.name || departer.carrier_name,
        type: 'departer'
      });
    }

    trip.destinations.forEach(dest => {
      if (dest.destinations) {
        waypoints.push({
          lat: dest.destinations.lat || dest.destinations.latitude,
          lng: dest.destinations.lng || dest.destinations.longitude,
          name: dest.destinations.carrier_name,
          stopOrder: dest.stop_order,
          type: 'destination'
        });
      }
    });

    // Add numbered markers
    waypoints.forEach((point, index) => {
      const isDeparter = point.type === 'departer';
      const markerIcon = this.createNumberedMarker(
        isDeparter ? 0 : point.stopOrder,
        isDeparter ? '#10b981' : '#ef4444'
      );

      const marker = L.marker([point.lat, point.lng], { icon: markerIcon })
        .bindPopup(`
          <div class="marker-popup">
            <strong>${isDeparter ? '🏢 Xuất phát' : `📍 Điểm ${point.stopOrder}`}</strong><br>
            ${point.name}
          </div>
        `);

      this.currentRouteLayer.addLayer(marker);
      this.currentMarkers.push(marker);
    });

    // Draw polyline connecting waypoints
    const latlngs = waypoints.map(p => [p.lat, p.lng]);
    const polyline = L.polyline(latlngs, {
      color: '#3b82f6',
      weight: 4,
      opacity: 0.7,
      dashArray: '10, 10'
    }).addTo(this.currentRouteLayer);

    // Fit map to route bounds
    const bounds = polyline.getBounds();
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  /**
   * Get departer (default hub)
   */
  async getDeparter() {
    try {
      const response = await fetch(`${API_BASE_URL}/locations/departers`);
      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        return result.data[0]; // Return first departer
      }
    } catch (error) {
      console.error('Error fetching departer:', error);
    }
    return null;
  }

  /**
   * Create numbered marker icon
   */
  createNumberedMarker(number, color) {
    const svgIcon = `
      <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26c0-8.837-7.163-16-16-16z" 
              fill="${color}" stroke="#fff" stroke-width="2"/>
        <text x="16" y="20" font-size="14" font-weight="bold" fill="#fff" 
              text-anchor="middle" dominant-baseline="middle">
          ${number}
        </text>
      </svg>
    `;

    return L.divIcon({
      html: svgIcon,
      className: 'numbered-marker',
      iconSize: [32, 42],
      iconAnchor: [16, 42],
      popupAnchor: [0, -42]
    });
  }

  /**
   * Clear route from map
   */
  clearRoute() {
    // Remove route layer
    if (this.currentRouteLayer) {
      this.map.removeLayer(this.currentRouteLayer);
      this.currentRouteLayer = null;
    }

    // Clear markers
    this.clearRouteMarkers();

    // Hide details panel
    const panel = document.getElementById('route-details-panel');
    if (panel) {
      panel.classList.remove('active');
    }
  }

  /**
   * Clear route markers
   */
  clearRouteMarkers() {
    this.currentMarkers.forEach(marker => {
      if (this.currentRouteLayer) {
        this.currentRouteLayer.removeLayer(marker);
      }
    });
    this.currentMarkers = [];
  }

  // ============================================
  // NEW METHODS FOR ROUTE SEGMENTS
  // ============================================

  /**
   * Display route info (simplified version without trip details)
   */
  displayRouteInfo(routeName, segments) {
    const container = document.getElementById('trip-info');
    if (!container) return;

    // Calculate totals
    const totalDistance = segments.reduce((sum, seg) => sum + parseFloat(seg.distance_km || 0), 0);
    const totalDuration = segments.reduce((sum, seg) => sum + parseInt(seg.avg_duration_minutes || 0), 0);
    const startTime = segments[0]?.start_time || 'N/A';

    const hours = Math.floor(totalDuration / 60);
    const minutes = totalDuration % 60;

    container.innerHTML = `
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">📍 Route:</span>
          <span class="info-value">${routeName}</span>
        </div>
        <div class="info-item">
          <span class="info-label">🕐 Giờ xuất phát:</span>
          <span class="info-value">${startTime}</span>
        </div>
        <div class="info-item">
          <span class="info-label">📏 Tổng quãng đường:</span>
          <span class="info-value">${totalDistance.toFixed(2)} km</span>
        </div>
        <div class="info-item">
          <span class="info-label">⏱️ Tổng thời gian:</span>
          <span class="info-value">${hours}h ${minutes}m</span>
        </div>
      </div>
    `;
  }

  /**
   * Display segments timeline
   */
  displaySegmentsTimeline(segments) {
    const container = document.getElementById('destinations-timeline');
    if (!container) return;

    let html = '';
    let cumulativeTime = 0;

    segments.forEach((segment, index) => {
      const duration = parseInt(segment.avg_duration_minutes || 0);
      const distance = parseFloat(segment.distance_km || 0);
      const avgOrders = parseInt(segment.avg_orders || 0);
      const avgPackages = parseInt(segment.avg_packages || 0);
      const avgBins = parseInt(segment.avg_bins || 0);

      // Calculate arrival time
      if (index === 0 && segment.start_time) {
        const [hours, minutes] = segment.start_time.split(':');
        cumulativeTime = parseInt(hours) * 60 + parseInt(minutes);
      }

      cumulativeTime += duration;
      const arrivalHours = Math.floor(cumulativeTime / 60) % 24;
      const arrivalMinutes = cumulativeTime % 60;
      const arrivalTime = `${arrivalHours.toString().padStart(2, '0')}:${arrivalMinutes.toString().padStart(2, '0')}`;

      // First segment shows departer
      if (index === 0) {
        html += `
          <div class="timeline-item">
            <div class="timeline-marker departer">
              <div class="marker-number">0</div>
            </div>
            <div class="timeline-content">
              <h4>🏢 ${segment.from_location_name}</h4>
              <p class="timeline-time">🕐 Xuất phát: ${segment.start_time || 'N/A'}</p>
            </div>
          </div>
        `;
      }

      // Destination
      html += `
        <div class="timeline-item">
          <div class="timeline-marker destination">
            <div class="marker-number">${index + 1}</div>
          </div>
          <div class="timeline-content">
            <h4>📍 ${segment.to_location_name}</h4>
            <div class="route-metrics">
              <span class="metric">📏 ${distance.toFixed(2)} km</span>
              <span class="metric">⏱️ ${duration} phút</span>
              <span class="metric">🕐 Đến: ${arrivalTime}</span>
            </div>
            <div class="cargo-info">
              <span class="cargo-item">📦 ${avgOrders} đơn</span>
              <span class="cargo-item">📫 ${avgPackages} kiện</span>
              <span class="cargo-item">🗃️ ${avgBins} bins</span>
            </div>
            <p class="sample-size">📊 Dữ liệu từ ${segment.sample_size} chuyến</p>
          </div>
        </div>
      `;
    });

    // Summary card
    const totalDistance = segments.reduce((sum, seg) => sum + parseFloat(seg.distance_km || 0), 0);
    const totalDuration = segments.reduce((sum, seg) => sum + parseInt(seg.avg_duration_minutes || 0), 0);
    const hours = Math.floor(totalDuration / 60);
    const minutes = totalDuration % 60;

    html += `
      <div class="timeline-summary">
        <div class="summary-card">
          <div class="summary-icon">📏</div>
          <div class="summary-content">
            <div class="summary-label">Tổng Quãng Đường</div>
            <div class="summary-value">${totalDistance.toFixed(2)} km</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">⏱️</div>
          <div class="summary-content">
            <div class="summary-label">Tổng Thời Gian</div>
            <div class="summary-value">${hours}h ${minutes}m</div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Draw segments on map
   */
  async drawSegmentsOnMap(segments) {
    if (!this.map || segments.length === 0) return;

    // Create layer group
    this.currentRouteLayer = L.layerGroup().addTo(this.map);

    // Fetch location coordinates
    const { data: departers } = await API.getDeparters();
    const { data: destinations } = await API.getDestinations();

    // Create location map
    const locationMap = {};
    departers?.forEach(d => {
      locationMap[d.id] = { lat: d.lat, lng: d.lng, name: d.name };
    });
    destinations?.forEach(d => {
      locationMap[d.id] = { lat: d.lat, lng: d.lng, name: d.carrier_name };
    });

    // Collect waypoints
    const waypoints = [];

    // Add departer (from first segment)
    const firstSegment = segments[0];
    const departerLoc = locationMap[firstSegment.from_location_id];
    if (departerLoc) {
      waypoints.push({
        lat: departerLoc.lat,
        lng: departerLoc.lng,
        name: firstSegment.from_location_name,
        type: 'departer',
        markerNumber: 0
      });
    }

    // Add destinations
    segments.forEach((segment, index) => {
      const destLoc = locationMap[segment.to_location_id];
      if (destLoc) {
        waypoints.push({
          lat: destLoc.lat,
          lng: destLoc.lng,
          name: segment.to_location_name,
          type: 'destination',
          markerNumber: index + 1
        });
      }
    });

    // Create markers
    waypoints.forEach(wp => {
      const marker = this.createNumberedMarker(
        wp.lat,
        wp.lng,
        wp.markerNumber,
        wp.name,
        wp.type
      );
      this.currentRouteLayer.addLayer(marker);
      this.currentMarkers.push(marker);
    });

    // Draw polyline
    if (waypoints.length > 1) {
      const latlngs = waypoints.map(wp => [wp.lat, wp.lng]);
      const polyline = L.polyline(latlngs, {
        color: '#667eea',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10'
      });
      this.currentRouteLayer.addLayer(polyline);

      // Add arrows
      const decorator = L.polylineDecorator(polyline, {
        patterns: [
          {
            offset: '50%',
            repeat: 100,
            symbol: L.Symbol.arrowHead({
              pixelSize: 12,
              polygon: false,
              pathOptions: { stroke: true, color: '#667eea', weight: 2 }
            })
          }
        ]
      });
      this.currentRouteLayer.addLayer(decorator);
    }

    // Fit map to bounds
    if (waypoints.length > 0) {
      const bounds = L.latLngBounds(waypoints.map(wp => [wp.lat, wp.lng]));
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }
}

// Export for use in main.js
window.RouteManager = RouteManager;

