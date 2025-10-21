/**
 * Route Builder Module
 * Handles creating and editing routes (preview only, no DB changes)
 */

// Global state for route builder
const routeBuilder = {
  selectedDestinations: [],
  previewData: null,
  isEditMode: false,
  originalRoute: null,
};

/**
 * Open Create Route Modal
 */
async function openCreateRouteModal() {
  document.getElementById('createRouteModal').style.display = 'block';
  document.getElementById('createRouteForm').reset();
  document.getElementById('new-route-preview').style.display = 'none';
  document.getElementById('export-new-route-btn').style.display = 'none';
  document.getElementById('new-route-order-section').style.display = 'none';

  // Reset state
  routeBuilder.selectedDestinations = [];
  routeBuilder.previewData = null;
  routeBuilder.isEditMode = false;

  // Load hubs and destinations
  try {
    const [departersResult, destinationsResult] = await Promise.all([
      API.getDeparters(),
      API.getDestinations()
    ]);

    // Populate hub dropdown
    const hubSelect = document.getElementById('new-route-hub');
    hubSelect.innerHTML = '<option value="">-- Chọn Hub Chính --</option>';

    if (departersResult.success && departersResult.data) {
      departersResult.data.forEach(dep => {
        const option = document.createElement('option');
        option.value = dep.id;
        option.textContent = dep.name || dep.carrier_name;
        option.dataset.lat = dep.lat;
        option.dataset.lng = dep.lng;
        option.dataset.name = dep.name || dep.carrier_name;
        hubSelect.appendChild(option);
      });
    }

    // Populate destinations list
    const destinationsList = document.getElementById('new-route-destinations-list');
    destinationsList.innerHTML = '';

    if (destinationsResult.success && destinationsResult.data) {
      destinationsResult.data.forEach(dest => {
        const div = document.createElement('div');
        div.className = 'destination-checkbox-item';
        div.innerHTML = `
          <label style="display: flex; align-items: center; padding: 10px; cursor: pointer; border-radius: 6px; transition: all 0.2s; margin-bottom: 4px; background: white; border: 1px solid #e2e8f0;">
            <input 
              type="checkbox" 
              value="${dest.id}" 
              data-name="${dest.carrier_name}" 
              data-lat="${dest.lat}" 
              data-lng="${dest.lng}"
              style="margin-right: 12px; width: 18px; height: 18px; cursor: pointer;"
              onchange="updateNewRouteSelection()">
            <span style="font-size: 14px; color: #1f2937;">${dest.carrier_name}</span>
          </label>
        `;
        destinationsList.appendChild(div);
      });

      // Add hover effect
      document.querySelectorAll('#new-route-destinations-list .destination-checkbox-item label').forEach(label => {
        label.addEventListener('mouseenter', function() {
          this.style.background = '#f0f9ff';
          this.style.borderColor = '#667eea';
        });
        label.addEventListener('mouseleave', function() {
          this.style.background = 'white';
          this.style.borderColor = '#e2e8f0';
        });
      });
    }

    // Setup search
    const searchInput = document.getElementById('new-route-search-destinations');
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      const items = document.querySelectorAll('#new-route-destinations-list .destination-checkbox-item');
      
      items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? '' : 'none';
      });
    });

    updateNewRouteCounter();

  } catch (error) {
    console.error('Error loading data:', error);
    showToast('❌ Lỗi khi tải dữ liệu', 'error');
  }
}

/**
 * Close Create Route Modal
 */
function closeCreateRouteModal() {
  document.getElementById('createRouteModal').style.display = 'none';
}

/**
 * Update selection counter and order list
 */
function updateNewRouteSelection() {
  const checkboxes = document.querySelectorAll('#new-route-destinations-list input[type="checkbox"]:checked');
  
  routeBuilder.selectedDestinations = Array.from(checkboxes).map(cb => ({
    id: cb.value,
    name: cb.dataset.name,
    lat: parseFloat(cb.dataset.lat),
    lng: parseFloat(cb.dataset.lng),
  }));

  updateNewRouteCounter();
  updateNewRouteOrderList();
}

/**
 * Update counter
 */
function updateNewRouteCounter() {
  const count = routeBuilder.selectedDestinations.length;
  const counterElement = document.getElementById('new-route-selected-count');
  
  if (counterElement) {
    counterElement.textContent = `Đã chọn: ${count}`;
    counterElement.style.background = count === 0 ? '#94a3b8' : '#667eea';
  }
}

/**
 * Update order list (drag & drop)
 */
function updateNewRouteOrderList() {
  const orderSection = document.getElementById('new-route-order-section');
  const orderList = document.getElementById('new-route-order-list');

  if (routeBuilder.selectedDestinations.length === 0) {
    orderSection.style.display = 'none';
    return;
  }

  orderSection.style.display = 'block';
  orderList.innerHTML = '';

  routeBuilder.selectedDestinations.forEach((dest, index) => {
    const div = document.createElement('div');
    div.className = 'route-order-item';
    div.draggable = true;
    div.dataset.index = index;
    div.innerHTML = `
      <span class="route-order-drag-handle">☰</span>
      <div class="route-order-number">${index + 1}</div>
      <div class="route-order-name">${dest.name}</div>
      <button type="button" class="route-order-remove" onclick="removeDestinationFromOrder(${index})">✕</button>
    `;

    // Drag events
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragover', handleDragOver);
    div.addEventListener('drop', handleDrop);
    div.addEventListener('dragend', handleDragEnd);

    orderList.appendChild(div);
  });
}

/**
 * Remove destination from order
 */
function removeDestinationFromOrder(index) {
  const dest = routeBuilder.selectedDestinations[index];
  
  // Uncheck checkbox
  const checkbox = document.querySelector(`#new-route-destinations-list input[value="${dest.id}"]`);
  if (checkbox) checkbox.checked = false;

  // Remove from array
  routeBuilder.selectedDestinations.splice(index, 1);

  updateNewRouteCounter();
  updateNewRouteOrderList();
}

// Drag & Drop handlers
let draggedElement = null;

function handleDragStart(e) {
  draggedElement = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  
  const target = e.target.closest('.route-order-item');
  if (target && target !== draggedElement) {
    target.classList.add('drag-over');
  }
  
  return false;
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  const target = e.target.closest('.route-order-item');
  if (target && draggedElement !== target) {
    const fromIndex = parseInt(draggedElement.dataset.index);
    const toIndex = parseInt(target.dataset.index);

    // Reorder array
    const item = routeBuilder.selectedDestinations.splice(fromIndex, 1)[0];
    routeBuilder.selectedDestinations.splice(toIndex, 0, item);

    updateNewRouteOrderList();
  }

  return false;
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  document.querySelectorAll('.route-order-item').forEach(item => {
    item.classList.remove('drag-over');
  });
}

/**
 * Preview new route
 */
async function previewNewRoute() {
  const routeName = document.getElementById('new-route-name').value.trim();
  const hubSelect = document.getElementById('new-route-hub');
  const vehicle = document.getElementById('new-route-vehicle').value;

  // Validation
  if (!routeName) {
    showToast('⚠️ Vui lòng nhập tên route', 'warning');
    return;
  }

  if (!hubSelect.value) {
    showToast('⚠️ Vui lòng chọn Hub chính', 'warning');
    return;
  }

  if (routeBuilder.selectedDestinations.length === 0) {
    showToast('⚠️ Vui lòng chọn ít nhất 1 điểm đến', 'warning');
    return;
  }

  // Build waypoints array
  const hubOption = hubSelect.options[hubSelect.selectedIndex];
  const waypoints = [
    {
      lat: parseFloat(hubOption.dataset.lat),
      lng: parseFloat(hubOption.dataset.lng),
      name: hubOption.dataset.name,
    },
    ...routeBuilder.selectedDestinations
  ];

  // Call Directions API
  showLoading();
  try {
    console.log('📡 Calling Directions API for preview...');
    console.log('📡 Waypoints:', waypoints);
    
    const response = await fetch(`${API_BASE_URL}/directions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waypoints, vehicle })
    });

    const result = await response.json();
    console.log('📡 Directions API raw response:', result);

    if (result.success) {
      console.log('✅ Directions API success, data keys:', Object.keys(result.data));
      console.log('📊 Full data:', JSON.stringify(result.data, null, 2));
      
      routeBuilder.previewData = result.data;
      displayNewRoutePreview(routeName, hubOption.dataset.name, waypoints, result.data);
      document.getElementById('export-new-route-btn').style.display = 'block';
      showToast('✅ Preview route thành công!', 'success');
    } else {
      console.error('❌ Directions API error:', result.error);
      showToast('❌ Lỗi: ' + result.error, 'error');
    }
  } catch (error) {
    console.error('❌ Error previewing route:', error);
    showToast('❌ Lỗi khi preview route', 'error');
  } finally {
    hideLoading();
  }
}

/**
 * Display preview
 */
function displayNewRoutePreview(routeName, hubName, waypoints, directionsData) {
  console.log('📊 Displaying preview with data:', directionsData);
  
  const previewSection = document.getElementById('new-route-preview');
  previewSection.style.display = 'block';

  // Update summary - Use correct field names from backend with validation
  let totalDistanceKm = '0.00';
  let totalDurationText = '0 phút';
  
  if (directionsData.total_distance_km) {
    totalDistanceKm = directionsData.total_distance_km;
  } else if (directionsData.total_distance_meters) {
    totalDistanceKm = (directionsData.total_distance_meters / 1000).toFixed(2);
  }
  
  if (directionsData.total_duration_text) {
    totalDurationText = directionsData.total_duration_text;
  } else if (directionsData.total_duration_hours) {
    totalDurationText = directionsData.total_duration_hours + ' giờ';
  } else if (directionsData.total_duration_seconds) {
    totalDurationText = Math.round(directionsData.total_duration_seconds / 60) + ' phút';
  }
  
  document.getElementById('new-route-total-distance').textContent = totalDistanceKm + ' km';
  document.getElementById('new-route-total-duration').textContent = totalDurationText;
  document.getElementById('new-route-total-stops').textContent = waypoints.length;

  // Update details
  const detailsContainer = document.getElementById('new-route-details');
  let html = '<div class="route-timeline">';

  // Origin
  html += `
    <div class="timeline-item">
      <div class="timeline-marker origin">
        <div class="marker-icon">🏢</div>
      </div>
      <div class="timeline-content">
        <h4>🚀 ${hubName}</h4>
        <p class="timeline-label">Điểm xuất phát</p>
      </div>
    </div>
  `;

  // Legs
  if (directionsData.legs && directionsData.legs.length > 0) {
    directionsData.legs.forEach((leg, index) => {
      html += `
        <div class="timeline-item">
          <div class="timeline-marker destination">
            <div class="marker-number">${index + 1}</div>
          </div>
          <div class="timeline-content">
            <h4>📍 ${waypoints[index + 1].name}</h4>
            <div class="route-metrics">
              <span class="metric">📏 ${leg.distance_km} km</span>
              <span class="metric">⏱️ ${leg.duration_minutes || leg.duration_text} phút</span>
            </div>
          </div>
        </div>
      `;
    });
  }

  html += '</div>';
  detailsContainer.innerHTML = html;

  // Show comparison if in edit mode
  if (routeBuilder.isEditMode && routeBuilder.originalRoute) {
    displayComparison(directionsData);
  }

  // Draw polyline on map - Use overview_polyline
  if (directionsData.overview_polyline) {
    console.log('🗺️ Drawing preview with overview_polyline');
    drawPreviewRouteOnMap(waypoints, directionsData.overview_polyline);
  } else {
    console.warn('⚠️ No polyline data in directions response');
    console.log('📊 Available directionsData fields:', Object.keys(directionsData));
    console.log('📊 Full directionsData:', directionsData);
    showToast('⚠️ Không có dữ liệu polyline từ Goong API', 'warning');
  }
}

/**
 * Display before/after comparison
 */
function displayComparison(newData) {
  const comparisonSection = document.getElementById('route-comparison');
  comparisonSection.style.display = 'block';

  // Calculate original metrics
  const originalSegments = routeBuilder.originalRoute.segments;
  let originalDistance = 0;
  let originalDuration = 0;

  originalSegments.forEach(seg => {
    originalDistance += parseFloat(seg.distance_km || 0);
    originalDuration += parseInt(seg.avg_duration_minutes || 0);
  });

  // Before metrics
  const beforeContainer = document.getElementById('comparison-before-metrics');
  beforeContainer.innerHTML = `
    <p style="margin: 8px 0;"><strong>📏 Khoảng cách:</strong> ${originalDistance.toFixed(2)} km</p>
    <p style="margin: 8px 0;"><strong>⏱️ Thời gian:</strong> ${originalDuration} phút</p>
    <p style="margin: 8px 0;"><strong>📍 Số điểm:</strong> ${originalSegments.length + 1}</p>
    <p style="margin: 8px 0;"><strong>🗺️ Điểm đến:</strong></p>
    <ul style="margin: 5px 0; padding-left: 20px; font-size: 13px;">
      ${originalSegments.map(seg => `<li>${seg.to_location_name}</li>`).join('')}
    </ul>
  `;

  // After metrics
  const afterContainer = document.getElementById('comparison-after-metrics');
  const distanceDiff = parseFloat(newData.distance_km) - originalDistance;
  const durationDiff = newData.duration_minutes - originalDuration;
  const stopsDiff = routeBuilder.selectedDestinations.length - originalSegments.length;

  afterContainer.innerHTML = `
    <p style="margin: 8px 0;">
      <strong>📏 Khoảng cách:</strong> ${newData.distance_km} km
      <span style="color: ${distanceDiff > 0 ? '#ef4444' : '#10b981'}; font-weight: 600;">
        (${distanceDiff > 0 ? '+' : ''}${distanceDiff.toFixed(2)} km)
      </span>
    </p>
    <p style="margin: 8px 0;">
      <strong>⏱️ Thời gian:</strong> ${newData.duration_minutes} phút
      <span style="color: ${durationDiff > 0 ? '#ef4444' : '#10b981'}; font-weight: 600;">
        (${durationDiff > 0 ? '+' : ''}${durationDiff} phút)
      </span>
    </p>
    <p style="margin: 8px 0;">
      <strong>📍 Số điểm:</strong> ${routeBuilder.selectedDestinations.length + 1}
      <span style="color: ${stopsDiff > 0 ? '#3b82f6' : stopsDiff < 0 ? '#ef4444' : '#64748b'}; font-weight: 600;">
        (${stopsDiff > 0 ? '+' : ''}${stopsDiff})
      </span>
    </p>
    <p style="margin: 8px 0;"><strong>🗺️ Điểm đến:</strong></p>
    <ul style="margin: 5px 0; padding-left: 20px; font-size: 13px;">
      ${routeBuilder.selectedDestinations.map(dest => `<li>${dest.name}</li>`).join('')}
    </ul>
  `;
}

/**
 * Decode Google/Goong polyline format
 */
function decodePolyline(encoded) {
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

/**
 * Draw preview route on map with polyline
 */
function drawPreviewRouteOnMap(waypoints, polylineEncoded) {
  if (!window.map) {
    console.error('❌ Map not initialized');
    return;
  }

  console.log('🗺️ Drawing preview route on map...');

  // Clear ALL existing layers first
  if (window.clearMarkers && typeof window.clearMarkers === 'function') {
    window.clearMarkers();
    console.log('✅ Cleared existing markers');
  }

  // Clear route management layers if any
  if (window.RouteManagement && window.RouteManagement.clearRouteDisplay) {
    window.RouteManagement.clearRouteDisplay();
    console.log('✅ Cleared route management display');
  }

  // Clear existing preview layers
  if (window.previewRouteLayer) {
    window.map.removeLayer(window.previewRouteLayer);
  }

  // Create layer group
  window.previewRouteLayer = L.layerGroup().addTo(window.map);

  // Decode polyline
  const polylineCoords = decodePolyline(polylineEncoded);
  console.log(`✅ Decoded ${polylineCoords.length} polyline points`);

  // Draw polyline
  const polyline = L.polyline(polylineCoords, {
    color: '#667eea',
    weight: 5,
    opacity: 0.8,
  }).addTo(window.previewRouteLayer);

  // Add markers
  waypoints.forEach((wp, index) => {
    const isOrigin = index === 0;
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background: ${isOrigin ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#10b981'};
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: ${isOrigin ? '18px' : '14px'};
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          ${isOrigin ? '🏢' : index}
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    L.marker([wp.lat, wp.lng], { icon })
      .bindPopup(`<b>${wp.name}</b>`)
      .addTo(window.previewRouteLayer);
  });

  // Fit bounds
  window.map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

  // Switch to map tab
  const mapTab = document.querySelector('[data-tab="map"]');
  if (mapTab) {
    mapTab.click();
  }
}

/**
 * Export route to JSON
 */
function exportNewRoute() {
  if (!routeBuilder.previewData) {
    showToast('⚠️ Vui lòng preview route trước', 'warning');
    return;
  }

  const routeName = document.getElementById('new-route-name').value.trim();
  const hubSelect = document.getElementById('new-route-hub');
  const hubOption = hubSelect.options[hubSelect.selectedIndex];
  const vehicle = document.getElementById('new-route-vehicle').value;

  const exportData = {
    route_name: routeName,
    hub_id: hubSelect.value,
    hub_name: hubOption.dataset.name,
    hub_location: {
      lat: parseFloat(hubOption.dataset.lat),
      lng: parseFloat(hubOption.dataset.lng),
    },
    destinations: routeBuilder.selectedDestinations,
    vehicle_type: vehicle,
    metrics: {
      total_distance_km: routeBuilder.previewData.distance_km,
      total_duration_minutes: routeBuilder.previewData.duration_minutes,
      total_stops: routeBuilder.selectedDestinations.length + 1,
    },
    polyline: routeBuilder.previewData.polyline,
    legs: routeBuilder.previewData.legs,
    created_at: new Date().toISOString(),
    note: 'This is a preview route. Admin needs to import this to database.',
    is_edit: routeBuilder.isEditMode,
    original_route: routeBuilder.originalRoute,
  };

  // Download JSON
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `route_${routeName.replace(/\s+/g, '_')}_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showToast('✅ Đã export route thành công!', 'success');
}

/**
 * Open Edit Route Modal
 * Load current route data and allow editing
 */
async function openEditRouteModal() {
  // Get current route from RouteManager
  if (!window.routeManager || !window.routeManager.currentSegments || !window.routeManager.currentRouteName) {
    showToast('⚠️ Vui lòng chọn route trước', 'warning');
    return;
  }

  const currentRouteName = window.routeManager.currentRouteName;
  const currentSegments = window.routeManager.currentSegments;

  // Open modal in edit mode
  routeBuilder.isEditMode = true;
  routeBuilder.originalRoute = {
    name: currentRouteName,
    segments: currentSegments,
  };

  // Open create modal (reuse same modal)
  await openCreateRouteModal();

  // Pre-fill data
  document.getElementById('new-route-name').value = currentRouteName;

  // Extract hub and destinations from segments
  if (currentSegments.length > 0) {
    const firstSegment = currentSegments[0];

    // Try to find and select hub
    const hubSelect = document.getElementById('new-route-hub');
    const hubOptions = Array.from(hubSelect.options);
    const hubOption = hubOptions.find(opt => opt.dataset.name === firstSegment.from_location_name);
    if (hubOption) {
      hubSelect.value = hubOption.value;
    }

    // Pre-select destinations
    const destinationNames = currentSegments.map(seg => seg.to_location_name);
    const checkboxes = document.querySelectorAll('#new-route-destinations-list input[type="checkbox"]');

    checkboxes.forEach(cb => {
      if (destinationNames.includes(cb.dataset.name)) {
        cb.checked = true;
      }
    });

    // Update selection
    updateNewRouteSelection();

    // Reorder to match original order
    const orderedDestinations = [];
    destinationNames.forEach(name => {
      const dest = routeBuilder.selectedDestinations.find(d => d.name === name);
      if (dest) {
        orderedDestinations.push(dest);
      }
    });
    routeBuilder.selectedDestinations = orderedDestinations;
    updateNewRouteOrderList();
  }

  // Change modal title
  document.querySelector('#createRouteModal .modal-header h2').textContent = '✏️ Chỉnh Sửa Route';

  showToast('📝 Đang chỉnh sửa route: ' + currentRouteName, 'info');
}

