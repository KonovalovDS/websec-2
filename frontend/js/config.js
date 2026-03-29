/**
 * Константы фронтенда
 * @module config
 */

export const CONFIG = {
    /** Базовый URL API — относительный путь для работы на любом хосте */
    API_BASE: '/api',
    
    /** Настройки карты */
    MAP: {
        CENTER: [55.751244, 37.618423],
        ZOOM: 7,
        MIN_ZOOM: 5,
        MAX_ZOOM: 15
    },
    
    /** Настройки хранилища */
    STORAGE: {
        FAVORITES_KEY: 'pribivalka_favorites'
    },
    
    /** Настройки UI */
    UI: {
        DEBOUNCE_MS: 300,
        MAX_SEARCH_RESULTS: 20,
        MIN_SEARCH_LENGTH: 2
    }
};