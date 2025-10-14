// UI Helper Functions

// Format time to HH:MM
function formatTimeToHHMM(minutes) {
    if (!minutes || isNaN(minutes)) return '00:00';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Show/Hide Loading
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Notification helper (alias for showToast)
function showNotification(message, type = 'success') {
    showToast(message, type);
}

// Modal Functions - Departer
function openAddDeparterModal() {
    document.getElementById('departerModal').style.display = 'block';
    document.getElementById('departerForm').reset();
}

function closeDeparterModal() {
    document.getElementById('departerModal').style.display = 'none';
}

// Modal Functions - Destination
async function openAddDestinationModal() {
    document.getElementById('destinationModal').style.display = 'block';
    document.getElementById('destinationForm').reset();
    
    // Load departers for dropdown
    try {
        const result = await API.getDeparters();
        const select = document.getElementById('destination-departer');
        select.innerHTML = '<option value="">-- Chọn Hub Chính --</option>';
        
        if (result.success && result.data) {
            result.data.forEach(departer => {
                const option = document.createElement('option');
                option.value = departer.id;
                option.textContent = departer.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading departers:', error);
    }
}

function closeDestinationModal() {
    document.getElementById('destinationModal').style.display = 'none';
}

// Modal Functions - Details
function closeDetailsModal() {
    document.getElementById('detailsModal').style.display = 'none';
}

// Modal Functions - Calculate Distance
async function openCalculateDistanceModal() {
    document.getElementById('calculateDistanceModal').style.display = 'block';
    document.getElementById('calculateDistanceForm').reset();
    document.getElementById('distance-result').style.display = 'none';

    // Load all locations (departers + destinations) for dropdowns
    try {
        const [departersResult, destinationsResult] = await Promise.all([
            API.getDeparters(),
            API.getDestinations()
        ]);

        const originSelect = document.getElementById('origin-location');
        const destinationSelect = document.getElementById('destination-location');

        // Clear existing options
        originSelect.innerHTML = '<option value="">-- Chọn điểm xuất phát --</option>';
        destinationSelect.innerHTML = '<option value="">-- Chọn điểm đến --</option>';

        // Add departers (Hub Chính)
        if (departersResult.success && departersResult.data) {
            const departerGroup = document.createElement('optgroup');
            departerGroup.label = '🏠 Hub Chính';

            departersResult.data.forEach(departer => {
                const option1 = document.createElement('option');
                option1.value = JSON.stringify({
                    id: departer.id,
                    name: departer.name,
                    lat: departer.lat,
                    lng: departer.lng,
                    type: 'departer'
                });
                option1.textContent = departer.name;
                departerGroup.appendChild(option1);

                const option2 = option1.cloneNode(true);
                destinationSelect.appendChild(option2.cloneNode(true));
            });

            originSelect.appendChild(departerGroup);
            const departerGroup2 = departerGroup.cloneNode(true);
            departerGroup2.querySelectorAll('option').forEach((opt, idx) => {
                opt.value = departersResult.data[idx] ? JSON.stringify({
                    id: departersResult.data[idx].id,
                    name: departersResult.data[idx].name,
                    lat: departersResult.data[idx].lat,
                    lng: departersResult.data[idx].lng,
                    type: 'departer'
                }) : '';
            });
            destinationSelect.appendChild(departerGroup2);
        }

        // Add destinations (Điểm Giao Hàng)
        if (destinationsResult.success && destinationsResult.data) {
            const destGroup = document.createElement('optgroup');
            destGroup.label = '📍 Điểm Giao Hàng';

            destinationsResult.data.forEach(dest => {
                const option1 = document.createElement('option');
                option1.value = JSON.stringify({
                    id: dest.id,
                    name: dest.carrier_name,
                    lat: dest.lat,
                    lng: dest.lng,
                    type: 'destination'
                });
                option1.textContent = `${dest.carrier_name} - ${dest.province_name}`;
                destGroup.appendChild(option1);
            });

            originSelect.appendChild(destGroup);
            const destGroup2 = destGroup.cloneNode(true);
            destGroup2.querySelectorAll('option').forEach((opt, idx) => {
                opt.value = destinationsResult.data[idx] ? JSON.stringify({
                    id: destinationsResult.data[idx].id,
                    name: destinationsResult.data[idx].carrier_name,
                    lat: destinationsResult.data[idx].lat,
                    lng: destinationsResult.data[idx].lng,
                    type: 'destination'
                }) : '';
            });
            destinationSelect.appendChild(destGroup2);
        }
    } catch (error) {
        console.error('Error loading locations:', error);
        showToast('❌ Lỗi khi tải danh sách điểm', 'error');
    }
}

function closeCalculateDistanceModal() {
    document.getElementById('calculateDistanceModal').style.display = 'none';
}

// Close modals when clicking outside
window.onclick = function(event) {
    const departerModal = document.getElementById('departerModal');
    const destinationModal = document.getElementById('destinationModal');
    const detailsModal = document.getElementById('detailsModal');
    const calculateDistanceModal = document.getElementById('calculateDistanceModal');

    if (event.target === departerModal) {
        closeDeparterModal();
    }
    if (event.target === destinationModal) {
        closeDestinationModal();
    }
    if (event.target === detailsModal) {
        closeDetailsModal();
    }
    if (event.target === calculateDistanceModal) {
        closeCalculateDistanceModal();
    }
};

// Form Submissions
async function submitDeparter(event) {
    event.preventDefault();
    
    const name = document.getElementById('departer-name').value;
    const address = document.getElementById('departer-address').value;
    
    showLoading();
    
    try {
        const result = await API.createDeparter({ name, address });
        
        if (result.success) {
            showToast('✅ Thêm Hub chính thành công!');
            closeDeparterModal();
            await refreshData();
        } else {
            showToast(`❌ Lỗi: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Error creating departer:', error);
        showToast('❌ Lỗi khi thêm Hub chính', 'error');
    } finally {
        hideLoading();
    }
}

async function submitDestination(event) {
    event.preventDefault();

    const data = {
        carrier_name: document.getElementById('destination-carrier').value,
        address: document.getElementById('destination-address').value,
        ward_name: document.getElementById('destination-ward').value,
        district_name: document.getElementById('destination-district').value,
        province_name: document.getElementById('destination-province').value,
        departer_id: document.getElementById('destination-departer').value,
    };

    showLoading();

    try {
        const result = await API.createDestination(data);

        if (result.success) {
            showToast('✅ Thêm điểm giao hàng thành công!');
            closeDestinationModal();
            await refreshData();
        } else {
            showToast(`❌ Lỗi: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Error creating destination:', error);
        showToast('❌ Lỗi khi thêm điểm giao hàng', 'error');
    } finally {
        hideLoading();
    }
}

// Submit Calculate Distance
async function submitCalculateDistance(event) {
    event.preventDefault();

    const originValue = document.getElementById('origin-location').value;
    const destinationValue = document.getElementById('destination-location').value;
    const vehicle = document.getElementById('vehicle-type').value;

    if (!originValue || !destinationValue) {
        showToast('❌ Vui lòng chọn cả điểm xuất phát và điểm đến', 'error');
        return;
    }

    const origin = JSON.parse(originValue);
    const destination = JSON.parse(destinationValue);

    if (origin.id === destination.id) {
        showToast('❌ Điểm xuất phát và điểm đến không được trùng nhau', 'error');
        return;
    }

    showLoading();

    try {
        const result = await API.calculateDistance(
            { lat: origin.lat, lng: origin.lng },
            { lat: destination.lat, lng: destination.lng },
            vehicle
        );

        if (result.success && result.data) {
            const { distance_meters, duration_seconds } = result.data;
            const distanceKm = (distance_meters / 1000).toFixed(2);
            const durationMinutes = Math.round(duration_seconds / 60);
            const formattedTime = formatTimeToHHMM(durationMinutes);

            // Display vehicle name in Vietnamese
            const vehicleNames = {
                'truck': '🚚 Xe Tải',
                'car': '🚗 Xe Hơi',
                'bike': '🏍️ Xe Máy'
            };

            // Show result
            document.getElementById('result-distance').textContent = `${distanceKm} km`;
            document.getElementById('result-duration').textContent = formattedTime;
            document.getElementById('result-vehicle').textContent = vehicleNames[vehicle] || vehicle;
            document.getElementById('distance-result').style.display = 'block';

            showToast('✅ Tính toán thành công!');
        } else {
            showToast(`❌ Lỗi: ${result.error || 'Không thể tính khoảng cách'}`, 'error');
        }
    } catch (error) {
        console.error('Error calculating distance:', error);
        showToast('❌ Lỗi khi tính khoảng cách', 'error');
    } finally {
        hideLoading();
    }
}

// Show Details
async function showDeparterDetails(id) {
    showLoading();
    
    try {
        const result = await API.getDeparters();
        const departer = result.data.find(d => d.id === id);
        
        if (departer) {
            const routesResult = await API.getRoutesByDeparter(id);
            const routesCount = routesResult.success ? routesResult.data.length : 0;
            
            document.getElementById('details-title').textContent = `🏠 ${departer.name}`;
            document.getElementById('details-body').innerHTML = `
                <div style="line-height: 1.8;">
                    <p><strong>📍 Địa chỉ:</strong><br>${departer.address}</p>
                    <p><strong>🗺️ Tọa độ:</strong><br>Lat: ${departer.lat.toFixed(6)}, Lng: ${departer.lng.toFixed(6)}</p>
                    <p><strong>🛣️ Số tuyến đường:</strong> ${routesCount}</p>
                    <p><strong>📅 Ngày tạo:</strong> ${new Date(departer.created_at).toLocaleString('vi-VN')}</p>
                    <div style="margin-top: 20px; display: flex; gap: 10px;">
                        <button class="btn btn-danger" onclick="deleteLocation('${id}', 'departer')">🗑️ Xóa</button>
                        <button class="btn btn-secondary" onclick="closeDetailsModal()">Đóng</button>
                    </div>
                </div>
            `;
            document.getElementById('detailsModal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error showing departer details:', error);
        showToast('❌ Lỗi khi tải thông tin', 'error');
    } finally {
        hideLoading();
    }
}

async function showDestinationDetails(id) {
    showLoading();
    
    try {
        const result = await API.getDestinationById(id);
        
        if (result.success && result.data) {
            const dest = result.data;
            
            // Get route info
            let routeInfo = '';
            if (dest.departer_id) {
                const routeResult = await API.getRoute(dest.departer_id, id);
                if (routeResult.success && routeResult.data) {
                    const route = routeResult.data;
                    const formattedTime = formatTimeToHHMM(route.duration_minutes);
                    routeInfo = `
                        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <h3 style="color: #667eea; margin-bottom: 10px;">🛣️ Thông Tin Tuyến Đường</h3>
                            <p><strong>Khoảng cách:</strong> ${route.distance_km} km</p>
                            <p><strong>Thời gian:</strong> ${formattedTime}</p>
                            <p><strong>Phương tiện:</strong> ${route.vehicle_type || 'truck'}</p>
                        </div>
                    `;
                }
            }
            
            document.getElementById('details-title').textContent = `📍 ${dest.carrier_name}`;
            document.getElementById('details-body').innerHTML = `
                <div style="line-height: 1.8;">
                    <p><strong>📍 Địa chỉ:</strong><br>${dest.address}</p>
                    <p><strong>🏘️ Phường/Xã:</strong> ${dest.ward_name || 'N/A'}</p>
                    <p><strong>🏙️ Quận/Huyện:</strong> ${dest.district_name || 'N/A'}</p>
                    <p><strong>🗺️ Tỉnh/TP:</strong> ${dest.province_name}</p>
                    <p><strong>📌 Tọa độ:</strong><br>Lat: ${dest.lat.toFixed(6)}, Lng: ${dest.lng.toFixed(6)}</p>
                    ${routeInfo}
                    <p><strong>📅 Ngày tạo:</strong> ${new Date(dest.created_at).toLocaleString('vi-VN')}</p>
                    <div style="margin-top: 20px; display: flex; gap: 10px;">
                        <button class="btn btn-danger" onclick="deleteLocation('${id}', 'destination')">🗑️ Xóa</button>
                        <button class="btn btn-secondary" onclick="closeDetailsModal()">Đóng</button>
                    </div>
                </div>
            `;
            document.getElementById('detailsModal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error showing destination details:', error);
        showToast('❌ Lỗi khi tải thông tin', 'error');
    } finally {
        hideLoading();
    }
}

// Delete Location
async function deleteLocation(id, type) {
    const confirmMsg = type === 'departer' 
        ? 'Bạn có chắc muốn xóa Hub chính này? Tất cả tuyến đường liên quan sẽ bị xóa.'
        : 'Bạn có chắc muốn xóa điểm giao hàng này?';
    
    if (!confirm(confirmMsg)) return;
    
    showLoading();
    
    try {
        const result = await API.deleteLocation(id);
        
        if (result.success) {
            showToast('✅ Xóa thành công!');
            closeDetailsModal();
            await refreshData();
        } else {
            showToast(`❌ Lỗi: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Error deleting location:', error);
        showToast('❌ Lỗi khi xóa', 'error');
    } finally {
        hideLoading();
    }
}

// Load Locations List
async function loadLocationsList() {
    try {
        const result = await API.getDestinations();
        const listContainer = document.getElementById('locations-list');
        
        if (result.success && result.data && result.data.length > 0) {
            listContainer.innerHTML = result.data.map(dest => {
                const formattedTime = dest.duration_minutes ? formatTimeToHHMM(dest.duration_minutes) : null;
                return `
                    <div class="location-item" onclick="showDestinationDetails('${dest.id}')">
                        <h3>${dest.carrier_name}</h3>
                        <p>📍 ${dest.province_name}</p>
                        <p>📫 ${dest.address}</p>
                        ${dest.distance_km ? `
                            <p class="distance-info">🛣️ ${dest.distance_km} km • ⏱️ ${formattedTime}</p>
                        ` : ''}
                    </div>
                `;
            }).join('');
        } else {
            listContainer.innerHTML = '<p style="text-align: center; color: #718096;">Chưa có điểm giao hàng nào</p>';
        }
    } catch (error) {
        console.error('Error loading locations list:', error);
    }
}

// Filter Locations
function filterLocations() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const items = document.querySelectorAll('.location-item');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Update Statistics
async function updateStats() {
    try {
        const [departersResult, destinationsResult, tripsResult] = await Promise.all([
            API.getDeparters(),
            API.getDestinations(),
            API.getTrips(),
        ]);

        const departerCount = departersResult.success ? departersResult.data.length : 0;
        const destinationCount = destinationsResult.success ? destinationsResult.data.length : 0;
        const tripCount = tripsResult.success ? tripsResult.data.length : 0;

        document.getElementById('departer-count').textContent = departerCount;
        document.getElementById('destination-count').textContent = destinationCount;
        document.getElementById('trip-count').textContent = tripCount;
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Refresh All Data
async function refreshData() {
    showLoading();
    try {
        await Promise.all([
            loadMapData(),
            loadLocationsList(),
            updateStats(),
        ]);
        showToast('✅ Dữ liệu đã được làm mới');
    } catch (error) {
        console.error('Error refreshing data:', error);
        showToast('❌ Lỗi khi làm mới dữ liệu', 'error');
    } finally {
        hideLoading();
    }
}

// Alias for button
function refreshMap() {
    refreshData();
}

