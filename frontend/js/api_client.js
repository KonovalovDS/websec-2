import { CONFIG } from './config.js';

export class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    
    async _request(endpoint, params = {}) {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        Object.entries(params).forEach(([k, v]) => {
            if (v !== null && v !== undefined && v !== '') {
                url.searchParams.append(k, v);
            }
        });
        
        const response = await fetch(url.toString());
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || `HTTP ${response.status}`);
        }
        return response.json();
    }
    
    getSchedule(stationCode, date = null) {
        return this._request('/schedule', { station: stationCode, date });
    }
    
    searchRoute(fromCode, toCode, date = null) {
        return this._request('/route', { from: fromCode, to: toCode });
    }
    
    searchStations(query) {
        if (!query || query.length < CONFIG.UI.MIN_SEARCH_LENGTH) {
            return Promise.resolve({ stations: [] });
        }
        return this._request('/stations/search', { q: query });
    }
    
    getAllStations() {
        return this._request('/stations/all');
    }
    
    healthCheck() {
        return this._request('/health');
    }
}

export const api = new ApiClient(CONFIG.API_BASE);