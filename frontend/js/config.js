// ============================================
// Константы фронтенда — вынесены отдельно
// ============================================

export const CONFIG = {
    // Базовый URL API бэкенда
    API_BASE: 'http://localhost:5000/api',
    
    // Настройки карты
    MAP: {
        CENTER: [55.751244, 37.618423],  // Москва (широта, долгота)
        ZOOM: 7,
        MIN_ZOOM: 5,
        MAX_ZOOM: 15
    },
    
    // Настройки хранилища
    STORAGE: {
        FAVORITES_KEY: 'pribivalka_favorites'
    },
    
    // Настройки UI
    UI: {
        DEBOUNCE_MS: 300,           // Задержка поиска в мс
        MAX_SEARCH_RESULTS: 20,     // Максимум результатов поиска
        MIN_SEARCH_LENGTH: 2        // Минимум символов для поиска
    },
    
    // Селекторы DOM
    SELECTORS: {
        STATION_INPUT: '#station-input',
        SEARCH_RESULTS: '#search-results',
        SEARCH_BTN: '#search-btn',
        MAP_TOGGLE: '#map-toggle-btn',
        MAP_SECTION: '#map-section',
        MAP_CONTAINER: '#map',
        MAP_CLOSE: '#map-close-btn',
        FROM_INPUT: '#from-input',
        TO_INPUT: '#to-input',
        ROUTE_BTN: '#route-btn',
        ROUTE_RESULTS: '#route-results',
        SCHEDULE_LIST: '#schedule-list',
        SCHEDULE_TITLE: '#schedule-title',
        SCHEDULE_CONTROLS: '#schedule-controls',
        STATION_NAME: '#station-name',
        SCHEDULE_LOADING: '#schedule-loading',
        SCHEDULE_ERROR: '#schedule-error',
        FAV_BTN: '#fav-btn',
        FAVORITES_LIST: '#favorites-list'
    }
};
    