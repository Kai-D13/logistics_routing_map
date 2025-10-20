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

// Modal Functions - Calculate Distance (Multi-Destination)
async function openCalculateDistanceModal() {
    document.getElementById('calculateDistanceModal').style.display = 'block';
    document.getElementById('calculateDistanceForm').reset();
    document.getElementById('calc-distance-result').style.display = 'none';

    // Load departers and destinations
    try {
        const [departersResult, destinationsResult] = await Promise.all([
            API.getDeparters(),
            API.getDestinations()
        ]);

        // Populate departer dropdown (only Hub Chính)
        const departerSelect = document.getElementById('calc-departer-select');
        departerSelect.innerHTML = '<option value="">-- Chọn Hub chính --</option>';

        if (departersResult.success && departersResult.data && departersResult.data.length > 0) {
            departersResult.data.forEach(dep => {
                const option = document.createElement('option');
                option.value = dep.id;
                option.textContent = dep.name || dep.carrier_name;
                option.dataset.lat = dep.lat;
                option.dataset.lng = dep.lng;
                departerSelect.appendChild(option);
            });
        }

        // Populate destinations list with checkboxes
        const destinationsList = document.getElementById('calc-destinations-list');
        destinationsList.innerHTML = '';

        if (destinationsResult.success && destinationsResult.data && destinationsResult.data.length > 0) {
            destinationsResult.data.forEach(dest => {
                const div = document.createElement('div');
                div.className = 'destination-checkbox-item';
                div.innerHTML = `
                    <label style="display: flex; align-items: center; padding: 10px; cursor: pointer; border-radius: 6px; transition: all 0.2s; margin-bottom: 4px; background: white; border: 1px solid #e2e8f0;">
                        <input type="checkbox" value="${dest.id}" data-name="${dest.carrier_name}" data-lat="${dest.lat}" data-lng="${dest.lng}"
                               style="margin-right: 12px; width: 18px; height: 18px; cursor: pointer;"
                               onchange="updateSelectedCount()">
                        <span style="font-size: 14px; color: #1f2937;">${dest.carrier_name}</span>
                    </label>
                `;
                destinationsList.appendChild(div);
            });

            // Add hover effect
            document.querySelectorAll('.destination-checkbox-item label').forEach(label => {
                label.addEventListener('mouseenter', function() {
                    this.style.background = '#f0f9ff';
                    this.style.borderColor = '#667eea';
                });
                label.addEventListener('mouseleave', function() {
                    this.style.background = 'white';
                    this.style.borderColor = '#e2e8f0';
                });
            });
        } else {
            destinationsList.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">Chưa có điểm giao hàng nào</p>';
        }

        // Setup select all / deselect all buttons
        document.getElementById('calc-select-all').onclick = () => {
            const visibleCheckboxes = Array.from(document.querySelectorAll('#calc-destinations-list .destination-checkbox-item'))
                .filter(item => item.style.display !== 'none')
                .map(item => item.querySelector('input[type="checkbox"]'));

            visibleCheckboxes.forEach(cb => cb.checked = true);
            updateSelectedCount();
        };

        document.getElementById('calc-deselect-all').onclick = () => {
            document.querySelectorAll('#calc-destinations-list input[type="checkbox"]').forEach(cb => cb.checked = false);
            updateSelectedCount();
        };

        // Setup search functionality
        const searchInput = document.getElementById('calc-search-destinations');
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const items = document.querySelectorAll('.destination-checkbox-item');

            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });

        // Initialize counter
        updateSelectedCount();

    } catch (error) {
        console.error('Error loading locations:', error);
        showToast('❌ Lỗi khi tải danh sách điểm', 'error');
    }
}

function closeCalculateDistanceModal() {
    document.getElementById('calculateDistanceModal').style.display = 'none';
}

// Update selected destinations counter
function updateSelectedCount() {
    const checkboxes = document.querySelectorAll('#calc-destinations-list input[type="checkbox"]');
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    const counterElement = document.getElementById('calc-selected-count');

    if (counterElement) {
        counterElement.textContent = `Đã chọn: ${checkedCount}/20`;

        // Change color based on count
        if (checkedCount === 0) {
            counterElement.style.background = '#94a3b8';
        } else if (checkedCount > 20) {
            counterElement.style.background = '#ef4444';
        } else {
            counterElement.style.background = '#667eea';
        }
    }
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

// Submit Calculate Distance (Multi-Destination)
async function submitCalculateDistance(event) {
    event.preventDefault();

    // Get departer
    const departerSelect = document.getElementById('calc-departer-select');
    const departerId = departerSelect.value;

    if (!departerId) {
        showToast('❌ Vui lòng chọn điểm xuất phát', 'error');
        return;
    }

    const selectedOption = departerSelect.options[departerSelect.selectedIndex];
    const departer = {
        id: departerId,
        name: selectedOption.textContent,
        lat: parseFloat(selectedOption.dataset.lat),
        lng: parseFloat(selectedOption.dataset.lng)
    };

    // Get selected destinations
    const checkboxes = document.querySelectorAll('#calc-destinations-list input[type="checkbox"]:checked');

    if (checkboxes.length === 0) {
        showToast('❌ Vui lòng chọn ít nhất 1 điểm đến', 'error');
        return;
    }

    if (checkboxes.length > 20) {
        showToast('❌ Tối đa 20 điểm đến', 'error');
        return;
    }

    const destinations = Array.from(checkboxes).map(cb => ({
        id: cb.value,
        name: cb.dataset.name,
        lat: parseFloat(cb.dataset.lat),
        lng: parseFloat(cb.dataset.lng)
    }));

    const vehicle = document.getElementById('calc-vehicle-type').value;

    showLoading();

    try {
        showToast('⏳ Đang tính toán khoảng cách...', 'info');

        // Calculate distances sequentially
        const route = [];
        let totalDistance = 0;
        let totalDuration = 0;
        let currentLocation = { lat: departer.lat, lng: departer.lng };

        // Add departer as first stop
        route.push({
            stop_number: 0,
            location: departer,
            distance_from_previous: 0,
            duration_from_previous: 0,
            cumulative_distance: 0,
            cumulative_duration: 0
        });

        // Calculate distance to each destination
        for (let i = 0; i < destinations.length; i++) {
            const dest = destinations[i];

            const distanceResult = await API.calculateDistance(
                currentLocation,
                { lat: dest.lat, lng: dest.lng },
                vehicle
            );

            if (distanceResult.success && distanceResult.data) {
                const { distance_meters, duration_seconds } = distanceResult.data;

                totalDistance += distance_meters;
                totalDuration += duration_seconds;

                route.push({
                    stop_number: i + 1,
                    location: dest,
                    distance_from_previous: distance_meters,
                    duration_from_previous: duration_seconds,
                    cumulative_distance: totalDistance,
                    cumulative_duration: totalDuration
                });

                currentLocation = { lat: dest.lat, lng: dest.lng };
            } else {
                showToast(`❌ Lỗi khi tính khoảng cách đến ${dest.name}`, 'error');
                hideLoading();
                return;
            }

            // Small delay to avoid rate limiting
            if (i < destinations.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        // Display results
        displayCalculateDistanceResults(route, totalDistance, totalDuration, vehicle);
        showToast('✅ Tính toán thành công!', 'success');

    } catch (error) {
        console.error('Error calculating distance:', error);
        showToast('❌ Lỗi khi tính khoảng cách', 'error');
    } finally {
        hideLoading();
    }
}

// Display Calculate Distance Results
function displayCalculateDistanceResults(route, totalDistance, totalDuration, vehicle) {
    const totalDistanceKm = (totalDistance / 1000).toFixed(2);
    const totalDurationMin = Math.round(totalDuration / 60);
    const formattedTime = formatTimeToHHMM(totalDurationMin);

    // Update summary
    document.getElementById('calc-total-distance').textContent = `${totalDistanceKm} km`;
    document.getElementById('calc-total-duration').textContent = formattedTime;
    document.getElementById('calc-total-stops').textContent = route.length - 1; // Exclude departer

    // Build route details HTML
    let html = '<div class="route-steps">';

    route.forEach((stop, index) => {
        const location = stop.location;
        const distanceKm = (stop.distance_from_previous / 1000).toFixed(2);
        const durationMin = Math.round(stop.duration_from_previous / 60);

        html += `
            <div class="route-step" style="display: flex; gap: 15px; padding: 15px; border-bottom: 1px solid #e2e8f0;">
                <div class="step-number" style="flex-shrink: 0; width: 40px; height: 40px; background: ${index === 0 ? '#667eea' : '#48bb78'}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px;">
                    ${index}
                </div>
                <div class="step-content" style="flex: 1;">
                    <h4 style="margin: 0 0 8px 0; color: #2d3748;">${location.name}</h4>
                    ${index > 0 ? `
                        <div class="step-metrics" style="display: flex; gap: 20px; color: #64748b; font-size: 14px;">
                            <span>📏 ${distanceKm} km</span>
                            <span>⏱️ ${durationMin} phút</span>
                        </div>
                    ` : '<div class="step-label" style="color: #667eea; font-weight: 500;">Điểm xuất phát</div>'}
                </div>
            </div>
        `;
    });

    html += '</div>';
    document.getElementById('calc-route-details').innerHTML = html;
    document.getElementById('calc-distance-result').style.display = 'block';
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

