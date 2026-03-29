/**
 * Клиент для запросов к бэкенду
 * @module api_client
 */

import { CONFIG } from './config.js';

export class ApiClient {
    /**
     * @param {string} baseUrl - Базовый URL API
     */
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    
    /**
     * Внутренний метод для выполнения запросов
     * @param {string} endpoint - Эндпоинт
     * @param {Object} params - Параметры запроса
     * @returns {Promise<Object>}
     * @private
     */
    async _request(endpoint, params = {}) {
        const queryString = new URLSearchParams(
            Object.entries(params).filter(([_, v]) => v !== null && v !== undefined && v !== '')
        ).toString();
        
        const url = queryString 
            ? `${this.baseUrl}${endpoint}?${queryString}`
            : `${this.baseUrl}${endpoint}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || `HTTP ${response.status}`);
        }
        
        return response.json();
    }
    
    /**
     * Получить расписание по станции
     * @param {string} stationCode - Код станции
     * @param {string|null} date - Дата (опционально)
     * @returns {Promise<Array>}
     */
    getSchedule(stationCode, date = null) {
        return this._request('/schedule', { station: stationCode, date });
    }
    
    /**
     * Поиск маршрута между станциями
     * @param {string} fromCode - Код станции отправления
     * @param {string} toCode - Код станции назначения
     * @returns {Promise<Array>}
     */
    searchRoute(fromCode, toCode) {
        return this._request('/route', { from: fromCode, to: toCode });
    }
    
    /**
     * Поиск станций по названию
     * @param {string} query - Строка поиска
     * @returns {Promise<Object>}
     */
    searchStations(query) {
        if (!query || query.length < CONFIG.UI.MIN_SEARCH_LENGTH) {
            return Promise.resolve({ stations: [] });
        }
        return this._request('/stations/search', { q: query });
    }
    
    /**
     * Получить все станции для карты
     * @returns {Promise<Object>}
     */
    getAllStations() {
        return this._request('/stations/all');
    }
    
    /**
     * Проверка работоспособности сервера
     * @returns {Promise<Object>}
     */
    healthCheck() {
        return this._request('/health');
    }
}

export const api = new ApiClient(CONFIG.API_BASE);