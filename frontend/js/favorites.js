/**
 * Модуль избранного (localStorage)
 * @module favorites
 */

import { CONFIG } from './config.js';

export class FavoritesManager {
    /**
     * @param {string} storageKey - Ключ в localStorage
     */
    constructor(storageKey = CONFIG.STORAGE.FAVORITES_KEY) {
        this.storageKey = storageKey;
    }
    
    /**
     * Загрузить список из localStorage
     * @returns {Array}
     * @private
     */
    _load() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }
    
    /**
     * Сохранить список в localStorage
     * @param {Array} favorites - Список станций
     * @private
     */
    _save(favorites) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(favorites));
        } catch {
            // Тихо игнорируем ошибки сохранения
        }
    }
    
    /**
     * Добавить станцию в избранное
     * @param {Object} station - Объект станции
     * @returns {boolean} Успешно ли добавлено
     */
    add(station) {
        const favorites = this._load();
        
        if (!favorites.some((s) => s.code === station.code)) {
            favorites.push({
                code: station.code,
                title: station.title,
                lat: station.lat || null,
                lon: station.lon || null,
                added: Date.now()
            });
            this._save(favorites);
            return true;
        }
        return false;
    }
    
    /**
     * Удалить станцию из избранного
     * @param {string} stationCode - Код станции
     */
    remove(stationCode) {
        const favorites = this._load().filter((s) => s.code !== stationCode);
        this._save(favorites);
    }
    
    /**
     * Проверить, есть ли станция в избранном
     * @param {string} stationCode - Код станции
     * @returns {boolean}
     */
    isFavorite(stationCode) {
        return this._load().some((s) => s.code === stationCode);
    }
    
    /**
     * Получить все избранные станции (сортировка по новизне)
     * @returns {Array}
     */
    getAll() {
        return this._load().sort((a, b) => b.added - a.added);
    }
    
    /**
     * Отобразить список избранного в элементе
     * @param {jQuery} $listElement - jQuery-элемент списка
     * @param {Function} onSelect - Callback при выборе станции
     * @param {Function} [onRemove] - Callback при удалении станции
     */
    renderToList($listElement, onSelect, onRemove) {
        const favorites = this.getAll();
        
        if (!favorites.length) {
            $listElement.html('<li class="favorites-empty">Нет избранных станций</li>');
            return;
        }
        
        const html = favorites.map((s) => `
            <li class="favorite-item">
                <button 
                    type="button"
                    class="station-btn"
                    data-code="${this._esc(s.code)}"
                    data-title="${this._esc(s.title)}"
                    data-lat="${s.lat || ''}"
                    data-lon="${s.lon || ''}">
                    ${this._esc(s.title)}
                </button>
                <button 
                    type="button"
                    class="btn-remove"
                    data-code="${this._esc(s.code)}"
                    title="Удалить из избранного">
                    Удалить
                </button>
            </li>
        `).join('');
        
        $listElement.html(html);
        
        $listElement.find('.station-btn').on('click', (e) => {
            const $btn = $(e.currentTarget);
            const station = {
                code: $btn.data('code'),
                title: $btn.data('title'),
                lat: $btn.data('lat'),
                lon: $btn.data('lon')
            };
            onSelect(station);
        });
        
        $listElement.find('.btn-remove').on('click', (e) => {
            e.stopPropagation();
            const $btn = $(e.currentTarget);
            const code = $btn.data('code');
            
            this.remove(code);
            this.renderToList($listElement, onSelect, onRemove);
            
            if (onRemove) {
                onRemove(code);
            }
        });
    }
    
    /**
     * Экранирование HTML
     * @param {string} str - Строка для экранирования
     * @returns {string}
     * @private
     */
    _esc(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    /**
     * Очистить всё избранное
     */
    clear() {
        localStorage.removeItem(this.storageKey);
    }
}