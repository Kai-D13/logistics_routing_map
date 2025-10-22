/**
 * Hub Editor Module
 * Allows editing hub information directly on the map
 */

const HubEditor = {
  currentHub: null,
  currentMarker: null,
  isEditMode: false,

  /**
   * Initialize hub editor
   */
  init() {
    this.createEditModal();
    console.log('✅ Hub Editor initialized');
  },

  /**
   * Create edit modal HTML
   */
  createEditModal() {
    const modalHTML = `
      <div id="hub-edit-modal" class="modal" style="display: none;">
        <div class="modal-overlay" onclick="HubEditor.closeModal()"></div>
        <div class="modal-content" style="max-width: 600px;">
          <div class="modal-header">
            <h2 id="hub-edit-title">✏️ Chỉnh Sửa Hub</h2>
            <button class="modal-close" onclick="HubEditor.closeModal()">&times;</button>
          </div>
          
          <div class="modal-body">
            <form id="hub-edit-form">
              <input type="hidden" id="hub-edit-id" />
              <input type="hidden" id="hub-edit-type" />
              
              <!-- Hub Name -->
              <div class="form-group">
                <label for="hub-edit-name">
                  <strong>Tên Hub</strong>
                  <span style="color: #ef4444;">*</span>
                </label>
                <input 
                  type="text" 
                  id="hub-edit-name" 
                  class="form-control" 
                  required 
                  placeholder="Nhập tên hub..."
                />
              </div>

              <!-- Address -->
              <div class="form-group">
                <label for="hub-edit-address">
                  <strong>Địa Chỉ</strong>
                  <span style="color: #ef4444;">*</span>
                </label>
                <textarea 
                  id="hub-edit-address" 
                  class="form-control" 
                  rows="2" 
                  required
                  placeholder="Nhập địa chỉ..."
                ></textarea>
                <button 
                  type="button" 
                  class="btn btn-sm btn-secondary" 
                  onclick="HubEditor.geocodeAddress()"
                  style="margin-top: 5px;"
                >
                  📍 Lấy Tọa Độ Từ Địa Chỉ
                </button>
              </div>

              <!-- Province (for destinations only) -->
              <div class="form-group" id="hub-edit-province-group" style="display: none;">
                <label for="hub-edit-province">
                  <strong>Tỉnh/Thành Phố</strong>
                </label>
                <input 
                  type="text" 
                  id="hub-edit-province" 
                  class="form-control" 
                  placeholder="Nhập tỉnh/thành phố..."
                />
              </div>

              <!-- Coordinates -->
              <div class="form-row">
                <div class="form-group" style="flex: 1; margin-right: 10px;">
                  <label for="hub-edit-lat">
                    <strong>Vĩ Độ (Latitude)</strong>
                    <span style="color: #ef4444;">*</span>
                  </label>
                  <input 
                    type="number" 
                    id="hub-edit-lat" 
                    class="form-control" 
                    step="0.000001" 
                    required
                    placeholder="21.0285"
                  />
                </div>
                <div class="form-group" style="flex: 1;">
                  <label for="hub-edit-lng">
                    <strong>Kinh Độ (Longitude)</strong>
                    <span style="color: #ef4444;">*</span>
                  </label>
                  <input 
                    type="number" 
                    id="hub-edit-lng" 
                    class="form-control" 
                    step="0.000001" 
                    required
                    placeholder="105.8542"
                  />
                </div>
              </div>

              <!-- Map Preview -->
              <div class="form-group">
                <label><strong>Xem Trước Vị Trí</strong></label>
                <div id="hub-edit-map-preview" style="height: 200px; border: 1px solid #ddd; border-radius: 5px;"></div>
                <p style="font-size: 12px; color: #64748b; margin-top: 5px;">
                  💡 Tip: Bạn có thể kéo marker trên bản đồ để thay đổi vị trí
                </p>
              </div>

              <!-- Action Buttons -->
              <div class="form-actions" style="display: flex; gap: 10px; margin-top: 20px;">
                <button type="submit" class="btn btn-primary" style="flex: 1;">
                  💾 Lưu Thay Đổi
                </button>
                <button type="button" class="btn btn-secondary" onclick="HubEditor.closeModal()" style="flex: 1;">
                  ❌ Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add form submit handler
    document.getElementById('hub-edit-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveHub();
    });

    // Add coordinate change handlers for map preview
    document.getElementById('hub-edit-lat').addEventListener('input', () => this.updateMapPreview());
    document.getElementById('hub-edit-lng').addEventListener('input', () => this.updateMapPreview());
  },

  /**
   * Open edit modal for a hub
   */
  openModal(hubData, hubType, marker = null) {
    console.log('🔧 HubEditor.openModal called:', { hubData, hubType });

    this.currentHub = hubData;
    this.currentMarker = marker;
    this.isEditMode = true;

    // Set form values
    document.getElementById('hub-edit-id').value = hubData.id || '';
    document.getElementById('hub-edit-type').value = hubType; // 'departer' or 'destination'

    if (hubType === 'departer') {
      document.getElementById('hub-edit-name').value = hubData.name || '';
      document.getElementById('hub-edit-province-group').style.display = 'none';
    } else {
      document.getElementById('hub-edit-name').value = hubData.carrier_name || '';
      document.getElementById('hub-edit-province').value = hubData.province_name || '';
      document.getElementById('hub-edit-province-group').style.display = 'block';
    }

    document.getElementById('hub-edit-address').value = hubData.address || '';
    document.getElementById('hub-edit-lat').value = hubData.lat || '';
    document.getElementById('hub-edit-lng').value = hubData.lng || '';

    console.log('✅ Form populated');

    // Show modal with active class
    const modal = document.getElementById('hub-edit-modal');
    modal.classList.add('active');
    console.log('✅ Modal shown, classList:', modal.classList);

    // Initialize map preview
    setTimeout(() => this.initMapPreview(), 100);
  },

  /**
   * Close edit modal
   */
  closeModal() {
    const modal = document.getElementById('hub-edit-modal');
    modal.classList.remove('active');
    this.currentHub = null;
    this.currentMarker = null;
    this.isEditMode = false;
    
    // Destroy map preview
    if (this.previewMap) {
      this.previewMap.remove();
      this.previewMap = null;
      this.previewMarker = null;
    }
  },

  /**
   * Initialize map preview
   */
  initMapPreview() {
    const lat = parseFloat(document.getElementById('hub-edit-lat').value) || 21.0285;
    const lng = parseFloat(document.getElementById('hub-edit-lng').value) || 105.8542;

    // Get container
    const container = document.getElementById('hub-edit-map-preview');
    if (!container) {
      console.error('Map preview container not found!');
      return;
    }

    // Destroy existing map completely
    if (this.previewMap) {
      try {
        this.previewMap.off();
        this.previewMap.remove();
        this.previewMap = null;
        this.previewMarker = null;
      } catch (e) {
        console.warn('Error removing existing map:', e);
      }
    }

    // Force clear Leaflet's internal state
    delete container._leaflet_id;
    container.innerHTML = '';
    
    // Add a small delay to ensure DOM is ready
    setTimeout(() => {
      try {
        // Create map
        this.previewMap = L.map('hub-edit-map-preview', {
          center: [lat, lng],
          zoom: 13,
          zoomControl: true
        });

        // Add tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(this.previewMap);

        // Add draggable marker
        this.previewMarker = L.marker([lat, lng], {
          draggable: true,
          icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })
        }).addTo(this.previewMap);

        // Update coordinates when marker is dragged
        this.previewMarker.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          document.getElementById('hub-edit-lat').value = pos.lat.toFixed(6);
          document.getElementById('hub-edit-lng').value = pos.lng.toFixed(6);
        });

        console.log('✅ Map preview initialized');
      } catch (error) {
        console.error('❌ Error initializing map preview:', error);
      }
    }, 100);
  },

  /**
   * Update map preview when coordinates change
   */
  updateMapPreview() {
    if (!this.previewMap || !this.previewMarker) return;

    const lat = parseFloat(document.getElementById('hub-edit-lat').value);
    const lng = parseFloat(document.getElementById('hub-edit-lng').value);

    if (!isNaN(lat) && !isNaN(lng)) {
      this.previewMarker.setLatLng([lat, lng]);
      this.previewMap.setView([lat, lng], 13);
    }
  },

  /**
   * Geocode address to get coordinates
   */
  async geocodeAddress() {
    const address = document.getElementById('hub-edit-address').value.trim();
    
    if (!address) {
      showNotification('⚠️ Vui lòng nhập địa chỉ', 'warning');
      return;
    }

    showNotification('🔍 Đang tìm tọa độ...', 'info');

    try {
      const result = await API.geocode(address);
      
      if (result.success && result.data) {
        document.getElementById('hub-edit-lat').value = result.data.lat.toFixed(6);
        document.getElementById('hub-edit-lng').value = result.data.lng.toFixed(6);
        this.updateMapPreview();
        showNotification('✅ Đã lấy tọa độ thành công!', 'success');
      } else {
        showNotification('❌ Không tìm thấy tọa độ cho địa chỉ này', 'error');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      showNotification('❌ Lỗi khi lấy tọa độ', 'error');
    }
  },

  /**
   * Save hub changes
   */
  async saveHub() {
    const hubId = document.getElementById('hub-edit-id').value;
    const hubType = document.getElementById('hub-edit-type').value;
    const name = document.getElementById('hub-edit-name').value.trim();
    const address = document.getElementById('hub-edit-address').value.trim();
    const lat = parseFloat(document.getElementById('hub-edit-lat').value);
    const lng = parseFloat(document.getElementById('hub-edit-lng').value);

    // Validation
    if (!name || !address || isNaN(lat) || isNaN(lng)) {
      showNotification('⚠️ Vui lòng điền đầy đủ thông tin', 'warning');
      return;
    }

    showNotification('💾 Đang lưu...', 'info');

    try {
      // Prepare data
      const updateData = {
        address,
        lat,
        lng
      };

      if (hubType === 'departer') {
        updateData.name = name;
      } else {
        updateData.carrier_name = name;
        updateData.province_name = document.getElementById('hub-edit-province').value.trim();
      }

      // Call API to update
      const result = await API.updateLocation(hubId, updateData);

      if (result.success) {
        showNotification('✅ Đã lưu thành công!', 'success', 3000);
        
        // Update marker on main map
        if (this.currentMarker) {
          this.currentMarker.setLatLng([lat, lng]);
          this.currentMarker.setPopupContent(this.generatePopupContent(updateData, hubType));
        }

        // Close modal
        this.closeModal();

        // Reload map data to reflect changes
        if (typeof loadMapData === 'function') {
          loadMapData();
        }
      } else {
        showNotification('❌ Lỗi khi lưu: ' + (result.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Save error:', error);
      showNotification('❌ Lỗi khi lưu thay đổi', 'error');
    }
  },

  /**
   * Generate popup content for updated hub
   */
  generatePopupContent(hubData, hubType) {
    if (hubType === 'departer') {
      return `
        <div style="min-width: 200px;">
          <h3 style="color: #f56565; margin-bottom: 10px;">🏠 ${hubData.name}</h3>
          <p style="margin: 5px 0;"><strong>Địa chỉ:</strong><br>${hubData.address}</p>
          <p style="margin: 5px 0;"><strong>Tọa độ:</strong><br>${hubData.lat.toFixed(6)}, ${hubData.lng.toFixed(6)}</p>
        </div>
      `;
    } else {
      return `
        <div style="min-width: 250px;">
          <h3 style="color: #48bb78; margin-bottom: 10px;">📍 ${hubData.carrier_name}</h3>
          <p style="margin: 5px 0;"><strong>Địa chỉ:</strong><br>${hubData.address}</p>
          <p style="margin: 5px 0;"><strong>Tỉnh:</strong> ${hubData.province_name}</p>
          <p style="margin: 5px 0;"><strong>Tọa độ:</strong><br>${hubData.lat.toFixed(6)}, ${hubData.lng.toFixed(6)}</p>
        </div>
      `;
    }
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  HubEditor.init();
});

