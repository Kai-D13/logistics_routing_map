// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// API Client
const API = {
    // Departers
    async getDeparters() {
        const response = await fetch(`${API_BASE_URL}/locations/departers`);
        return await response.json();
    },

    async createDeparter(data) {
        const response = await fetch(`${API_BASE_URL}/locations/departer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return await response.json();
    },

    // Destinations
    async getDestinations(departerId = null) {
        let url = `${API_BASE_URL}/locations/destinations`;
        if (departerId) {
            url += `?departer_id=${departerId}`;
        }
        const response = await fetch(url);
        return await response.json();
    },

    async getDestinationById(id) {
        const response = await fetch(`${API_BASE_URL}/locations/destinations/${id}`);
        return await response.json();
    },

    async createDestination(data) {
        const response = await fetch(`${API_BASE_URL}/locations/destination`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return await response.json();
    },

    async updateLocation(id, data) {
        const response = await fetch(`${API_BASE_URL}/locations/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return await response.json();
    },

    async deleteLocation(id) {
        const response = await fetch(`${API_BASE_URL}/locations/${id}`, {
            method: 'DELETE',
        });
        return await response.json();
    },

    // Geocoding
    async geocode(address) {
        const response = await fetch(`${API_BASE_URL}/geocode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address }),
        });
        return await response.json();
    },

    async autocomplete(input) {
        const response = await fetch(`${API_BASE_URL}/geocode/autocomplete?input=${encodeURIComponent(input)}`);
        return await response.json();
    },

    // Distance
    async calculateDistance(origin, destination, vehicle = 'truck') {
        const response = await fetch(`${API_BASE_URL}/distance/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ origin, destination, vehicle }),
        });
        return await response.json();
    },

    async getRoutesByDeparter(departerId) {
        const response = await fetch(`${API_BASE_URL}/distance/routes/${departerId}`);
        return await response.json();
    },

    async getRoute(departerId, destinationId) {
        const response = await fetch(`${API_BASE_URL}/distance/route/${departerId}/${destinationId}`);
        return await response.json();
    },

    // Trips
    async getTrips() {
        const response = await fetch(`${API_BASE_URL}/trips`);
        return await response.json();
    },
};

