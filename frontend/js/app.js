// Main Application Entry Point

// Global managers
let routeManager;
let vrpManager;

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Logistics Routing System - Starting...');

    try {
        // Initialize map
        initMap();
        console.log('✅ Map initialized');

        // Initialize feature managers
        routeManager = new RouteManager(map);
        vrpManager = new VRPManager(map);
        console.log('✅ Feature managers initialized');

        // Setup tab navigation
        setupTabs();

        // Load initial data
        showLoading();

        await Promise.all([
            loadMapData(),
            loadLocationsList(),
            updateStats(),
        ]);

        hideLoading();

        console.log('✅ Application loaded successfully');
        showToast('✅ Hệ thống đã sẵn sàng!');

    } catch (error) {
        console.error('❌ Error initializing application:', error);
        hideLoading();
        showToast('❌ Lỗi khi khởi động hệ thống', 'error');
    }
});

/**
 * Setup tab navigation
 */
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            // Remove active class from all tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab
            btn.classList.add('active');
            const targetContent = document.getElementById(`${tabName}-tab`);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            // Clear route/VRP when switching tabs
            if (tabName === 'map') {
                if (routeManager) routeManager.clearRoute();
                if (vrpManager) vrpManager.clearVRP();
            }
        });
    });
}

// Handle window resize for map
window.addEventListener('resize', () => {
    if (map) {
        map.invalidateSize();
    }
});

// Log application info
console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚚 LOGISTICS ROUTING SYSTEM                            ║
║                                                           ║
║   Version: 1.0.0                                         ║
║   Environment: Development                               ║
║   API: http://localhost:5000/api                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

