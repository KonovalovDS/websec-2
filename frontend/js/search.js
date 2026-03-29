// ============================================
// Модуль поиска станций
// ============================================

import { api } from './api_client.js';
import { CONFIG } from './config.js';

console.log('🔍 search.js загружен');

export class StationSearch {
    constructor(inputSelector, resultsSelector, onSelect) {
        console.log('🔧 StationSearch init:', { inputSelector, resultsSelector });
        
        this.input = $(inputSelector);
        this.results = $(resultsSelector);
        this.onSelect = onSelect;
        this.timer = null;
        this.selected = null;
        
        console.log('✅ jQuery elements:', {
            input: this.input.length,
            results: this.results.length
        });
        
        this._bindEvents();
    }
    
    _bindEvents() {
        console.log('🔗 Привязка событий...');
        
        this.input.on('input', (e) => {
            console.log('⌨️ Ввод:', $(e.target).val());
            
            clearTimeout(this.timer);
            const q = $(e.target).val().trim();
            console.log('🔤 Query:', q, 'length:', q.length);
            
            if (q.length < CONFIG.UI.MIN_SEARCH_LENGTH) {
                console.log('⚠️ Запрос слишком короткий');
                this.results.addClass('hidden').empty();
                return;
            }
            
            console.log('⏱️ Запуск поиска через', CONFIG.UI.DEBOUNCE_MS, 'мс');
            this.timer = setTimeout(() => {
                console.log('🚀 Выполнение поиска...');
                this._search(q);
            }, CONFIG.UI.DEBOUNCE_MS);
        });
        
        this.results.on('click', '.search-result-item', (e) => {
            console.log('🖱️ Клик по результату');
            const $item = $(e.currentTarget);
            const station = {
                code: $item.data('code'),
                title: $item.data('title'),
                lat: $item.data('lat'),
                lon: $item.data('lon')
            };
            console.log('📦 Выбрана станция:', station);
            this._select(station);
        });
        
        $(document).on('click', (e) => {
            if (!$(e.target).closest(this.input).length && 
                !$(e.target).closest(this.results).length) {
                this.results.addClass('hidden');
            }
        });
        
        console.log('✅ События привязаны');
    }
    
    async _search(query) {
        console.log('🌐 Запрос к API:', query);
        try {
            console.log('📡 Отправка запроса...');
            const data = await api.searchStations(query);
            console.log('📥 Ответ от API:', data);
            this._render(data.stations || []);
        } catch (e) {
            console.error('❌ Ошибка поиска:', e);
            this.results
                .html('<div class="error">Ошибка: ' + e.message + '</div>')
                .removeClass('hidden');
        }
    }
    
    _render(stations) {
        console.log('🎨 Рендер результатов:', stations.length);
        
        if (!stations.length) {
            this.results
                .html('<div class="no-results">Ничего не найдено</div>')
                .removeClass('hidden');
            return;
        }
        
        const html = stations.map(s => {
            console.log('📋 Станция:', s);
            return `
                <div class="search-result-item" role="option"
                     data-code="${this._esc(s.code)}" 
                     data-title="${this._esc(s.title)}"
                     data-lat="${s.lat || ''}" 
                     data-lon="${s.lon || ''}">
                    <strong>${this._esc(s.title)}</strong>
                    ${s.type ? `<small> • ${this._esc(s.type)}</small>` : ''}
                </div>
            `;
        }).join('');
        
        this.results.html(html).removeClass('hidden');
        console.log('✅ Результаты отрисованы');
    }
    
    _select(station) {
        console.log('✅ Выбор станции:', station);
        this.selected = station;
        this.input.val(station.title);
        this.results.addClass('hidden').empty();
        this.onSelect(station);
    }
    
    _esc(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }
    
    getSelected() { 
        console.log('📤 getSelected:', this.selected);
        return this.selected; 
    }
    
    clear() {
        console.log('🧹 Очистка поиска');
        this.input.val('');
        this.selected = null;
        this.results.addClass('hidden').empty();
    }
}