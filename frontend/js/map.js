// Map instance
let map;
let markers = [];
let departerMarkers = [];
let destinationMarkers = [];

// Custom Icons
// Departer Icon - Green (Xanh lá cây)
const departerIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSI0MiIgdmlld0JveD0iMCAwIDMyIDQyIj48cGF0aCBmaWxsPSIjNDhiYjc4IiBkPSJNMTYgMEMxMC40NzcgMCA2IDQuNDc3IDYgMTBjMCA3LjUgMTAgMjAgMTAgMjBzMTAtMTIuNSAxMC0yMGMwLTUuNTIzLTQuNDc3LTEwLTEwLTEwem0wIDE0Yy0yLjIwOSAwLTQtMS43OTEtNC00czEuNzkxLTQgNC00IDQgMS43OTEgNCA0LTEuNzkxIDQtNCA0eiIvPjwvc3ZnPg==',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
});

// Destination Icon - Red (Đỏ)
const destinationIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyOCIgaGVpZ2h0PSIzOCIgdmlld0JveD0iMCAwIDI4IDM4Ij48cGF0aCBmaWxsPSIjZjU2NTY1IiBkPSJNMTQgMEM4LjQ3NyAwIDQgNC40NzcgNCAxMGMwIDcuNSAxMCAyMCAxMCAyMHMxMC0xMi41IDEwLTIwYzAtNS41MjMtNC40NzctMTAtMTAtMTB6bTAgMTRjLTIuMjA5IDAtNC0xLjc5MS00LTRzMS43OTEtNCA0LTQgNCAxLjc5MSA0IDQtMS43OTEgNC00IDR6Ii8+PC9zdmc+',
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -38],
});

// Initialize Map
function initMap() {
    // Create map centered on Vietnam (Can Tho area)
    map = L.map('map').setView([10.0340913, 105.7718758], 10);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
    }).addTo(map);

    console.log('✅ Map initialized');
}

// Add Departer Marker
function addDeparterMarker(departer) {
    const marker = L.marker([departer.lat, departer.lng], { icon: departerIcon })
        .addTo(map)
        .bindPopup(`
            <div style="min-width: 200px;">
                <h3 style="color: #f56565; margin-bottom: 10px;">🏠 ${departer.name}</h3>
                <p style="margin: 5px 0;"><strong>Địa chỉ:</strong><br>${departer.address}</p>
                <p style="margin: 5px 0;"><strong>Tọa độ:</strong><br>${departer.lat.toFixed(6)}, ${departer.lng.toFixed(6)}</p>
                <div style="display: flex; gap: 5px; margin-top: 10px;">
                    <button onclick="editHub('${departer.id}', 'departer')" style="flex: 1; padding: 8px 12px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 13px;">
                        ✏️ Sửa
                    </button>
                    <button onclick="showDeparterDetails('${departer.id}')" style="flex: 1; padding: 8px 12px; background: #f56565; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 13px;">
                        👁️ Chi Tiết
                    </button>
                </div>
            </div>
        `);

    // Store departer data in marker for easy access
    marker.hubData = departer;
    marker.hubType = 'departer';

    departerMarkers.push(marker);
    markers.push(marker);
    return marker;
}

// Add Destination Marker
function addDestinationMarker(destination) {
    const marker = L.marker([destination.lat, destination.lng], { icon: destinationIcon })
        .addTo(map)
        .bindPopup(`
            <div style="min-width: 250px;">
                <h3 style="color: #48bb78; margin-bottom: 10px;">📍 ${destination.carrier_name}</h3>
                <p style="margin: 5px 0;"><strong>Địa chỉ:</strong><br>${destination.address}</p>
                <p style="margin: 5px 0;"><strong>Tỉnh:</strong> ${destination.province_name}</p>
                <p style="margin: 5px 0;"><strong>Tọa độ:</strong><br>${destination.lat.toFixed(6)}, ${destination.lng.toFixed(6)}</p>
                ${destination.distance_km ? `
                    <div style="margin-top: 10px; padding: 10px; background: #f0f9ff; border-radius: 5px;">
                        <p style="margin: 3px 0; color: #667eea;"><strong>🛣️ Khoảng cách:</strong> ${destination.distance_km} km</p>
                        <p style="margin: 3px 0; color: #667eea;"><strong>⏱️ Thời gian:</strong> ${destination.duration_minutes} phút</p>
                    </div>
                ` : ''}
                <div style="display: flex; gap: 5px; margin-top: 10px;">
                    <button onclick="editHub('${destination.id}', 'destination')" style="flex: 1; padding: 8px 12px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 13px;">
                        ✏️ Sửa
                    </button>
                    <button onclick="showDestinationDetails('${destination.id}')" style="flex: 1; padding: 8px 12px; background: #48bb78; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 13px;">
                        👁️ Chi Tiết
                    </button>
                </div>
            </div>
        `);

    // Store destination data in marker for easy access
    marker.hubData = destination;
    marker.hubType = 'destination';

    destinationMarkers.push(marker);
    markers.push(marker);
    return marker;
}

// Clear all markers
function clearMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    departerMarkers = [];
    destinationMarkers = [];
}

// Fit map to show all markers
function fitMapToMarkers() {
    if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Load all locations on map
async function loadMapData() {
    try {
        clearMarkers();

        // Load departers
        const departersResult = await API.getDeparters();
        if (departersResult.success && departersResult.data) {
            departersResult.data.forEach(departer => {
                addDeparterMarker(departer);
            });
        }

        // Load destinations
        const destinationsResult = await API.getDestinations();
        if (destinationsResult.success && destinationsResult.data) {
            destinationsResult.data.forEach(destination => {
                addDestinationMarker(destination);
            });
        }

        // Fit map to show all markers
        fitMapToMarkers();

        console.log(`✅ Loaded ${departerMarkers.length} departers and ${destinationMarkers.length} destinations on map`);
    } catch (error) {
        console.error('❌ Error loading map data:', error);
        showToast('Lỗi khi tải dữ liệu bản đồ', 'error');
    }
}

// Highlight marker by ID
function highlightMarker(id, type) {
    const markersList = type === 'departer' ? departerMarkers : destinationMarkers;
    // This is a simple implementation - you can enhance it with animations
    markersList.forEach(marker => {
        const popup = marker.getPopup();
        if (popup && popup.getContent().includes(id)) {
            marker.openPopup();
            map.setView(marker.getLatLng(), 13);
        }
    });
}

/**
 * Edit hub - Open edit modal
 * Called from marker popup buttons
 */
async function editHub(hubId, hubType) {
    console.log('🔧 editHub called:', { hubId, hubType });

    try {
        // Find marker with this hub
        const markersList = hubType === 'departer' ? departerMarkers : destinationMarkers;
        console.log('📋 Markers list:', markersList.length, 'markers');
        console.log('📋 Looking for hubId:', hubId);

        const marker = markersList.find(m => {
            console.log('  Checking marker:', m.hubData?.id, '===', hubId);
            return m.hubData && m.hubData.id === hubId;
        });

        if (!marker || !marker.hubData) {
            console.error('❌ Hub not found:', hubId, hubType);
            console.error('Available markers:', markersList.map(m => ({ id: m.hubData?.id, name: m.hubData?.name || m.hubData?.carrier_name })));
            showNotification('❌ Không tìm thấy hub', 'error');
            return;
        }

        console.log('✅ Found marker:', marker.hubData);

        // Open edit modal
        if (typeof HubEditor !== 'undefined') {
            console.log('✅ HubEditor found, opening modal...');
            HubEditor.openModal(marker.hubData, hubType, marker);
        } else {
            console.error('❌ HubEditor not loaded');
            showNotification('❌ Chức năng chỉnh sửa chưa sẵn sàng', 'error');
        }
    } catch (error) {
        console.error('❌ Error opening edit modal:', error);
        showNotification('❌ Lỗi khi mở form chỉnh sửa', 'error');
    }
}

// Expose functions to window for global access
window.map = map;
window.clearMarkers = clearMarkers;
window.fitMapToMarkers = fitMapToMarkers;
window.loadMapData = loadMapData;
window.editHub = editHub;
