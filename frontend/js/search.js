/**
 * Модуль поиска станций с автокомплитом
 * @module search
 */

import { api } from './api_client.js';
import { CONFIG } from './config.js';

export class StationSearch {
    /**
     * @param {string} inputSelector - Селектор input
     * @param {string} resultsSelector - Селектор контейнера результатов
     * @param {Function} onSelect - Callback при выборе станции
     */
    constructor(inputSelector, resultsSelector, onSelect) {
        this.input = $(inputSelector);
        this.results = $(resultsSelector);
        this.onSelect = onSelect;
        this.timer = null;
        this.selected = null;
        this._bindEvents();
    }
    
    /**
     * Привязка событий
     * @private
     */
    _bindEvents() {
        this.input.on('input', (e) => {
            clearTimeout(this.timer);
            const q = $(e.target).val().trim();
            
            if (q.length < CONFIG.UI.MIN_SEARCH_LENGTH) {
                this.results.addClass('hidden').empty();
                return;
            }
            
            this.timer = setTimeout(() => this._search(q), CONFIG.UI.DEBOUNCE_MS);
        });
        
        this.results.on('click', '.search-result-item', (e) => {
            const $item = $(e.currentTarget);
            this._select({
                code: $item.data('code'),
                title: $item.data('title'),
                lat: $item.data('lat'),
                lon: $item.data('lon')
            });
        });
        
        $(document).on('click', (e) => {
            if (!$(e.target).closest(this.input).length && 
                !$(e.target).closest(this.results).length) {
                this.results.addClass('hidden');
            }
        });
    }
    
    /**
     * Поиск станций по запросу
     * @param {string} query - Строка поиска
     * @private
     */
    async _search(query) {
        try {
            const data = await api.searchStations(query);
            this._render(data.stations || []);
        } catch (e) {
            this.results
                .html('<div class="error">Ошибка поиска</div>')
                .removeClass('hidden');
        }
    }
    
    /**
     * Отрисовка результатов поиска
     * @param {Array} stations - Список станций
     * @private
     */
    _render(stations) {
        if (!stations.length) {
            this.results
                .html('<div class="no-results">Ничего не найдено</div>')
                .removeClass('hidden');
            return;
        }
        
        const html = stations.map(s => `
            <div class="search-result-item" role="option"
                 data-code="${this._esc(s.code)}" 
                 data-title="${this._esc(s.title)}"
                 data-lat="${s.lat || ''}" 
                 data-lon="${s.lon || ''}">
                <strong>${this._esc(s.title)}</strong>
                ${s.type ? `<small> • ${this._esc(s.type)}</small>` : ''}
            </div>
        `).join('');
        
        this.results.html(html).removeClass('hidden');
    }
    
    /**
     * Обработка выбора станции
     * @param {Object} station - Объект станции
     * @private
     */
    _select(station) {
        this.selected = station;
        this.input.val(station.title);
        this.results.addClass('hidden').empty();
        this.onSelect(station);
    }
    
    /**
     * Экранирование HTML
     * @param {string} str - Строка для экранирования
     * @returns {string}
     * @private
     */
    _esc(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }
    
    /**
     * Получить выбранную станцию
     * @returns {Object|null}
     */
    getSelected() {
        return this.selected;
    }
    
    /**
     * Очистить поиск
     */
    clear() {
        this.input.val('');
        this.selected = null;
        this.results.addClass('hidden').empty();
    }
}