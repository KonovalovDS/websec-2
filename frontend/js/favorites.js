// ============================================
// Модуль избранного (localStorage)
// ============================================

import { CONFIG } from './config.js';

export class FavoritesManager {
    constructor(storageKey = CONFIG.STORAGE.FAVORITES_KEY) {
        this.storageKey = storageKey;
    }
    
    _load() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('Favorites load error:', e);
            return [];
        }
    }
    
    _save(favorites) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(favorites));
        } catch (e) {
            console.error('Favorites save error:', e);
        }
    }
    
    add(station) {
        const favorites = this._load();
        
        // Проверка на дубликаты
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
    
    remove(stationCode) {
        const favorites = this._load().filter((s) => s.code !== stationCode);
        this._save(favorites);
    }
    
    isFavorite(stationCode) {
        return this._load().some((s) => s.code === stationCode);
    }
    
    getAll() {
        return this._load().sort((a, b) => b.added - a.added);
    }
    
    /**
     * Отобразить список избранного в элементе
     * 🔥 ИСПРАВЛЕНО: используем data-атрибуты вместо text()
     */
    renderToList($listElement, onSelect) {
        const favorites = this.getAll();
        
        if (!favorites.length) {
            $listElement.html('<li class="favorites-empty">Нет избранных станций</li>');
            return;
        }
        
        // 🔥 ИСПРАВЛЕНО: храним данные в data-атрибутах
        const html = favorites.map((s) => {
            return `
                <li>
                    <button 
                        type="button"
                        data-code="${this._esc(s.code)}"
                        data-title="${this._esc(s.title)}"
                        data-lat="${s.lat || ''}"
                        data-lon="${s.lon || ''}">
                        ${this._esc(s.title)}
                    </button>
                </li>
            `;
        }).join('');
        
        $listElement.html(html);
        
        // 🔥 ИСПРАВЛЕНО: берем данные из data-атрибутов, а не из text()
        $listElement.find('button').on('click', (e) => {
            const $btn = $(e.currentTarget);
            const station = {
                code: $btn.data('code'),
                title: $btn.data('title'),
                lat: $btn.data('lat'),
                lon: $btn.data('lon')
            };
            console.log('⭐ Клик по избранному:', station);
            onSelect(station);
        });
    }
    
    _esc(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    clear() {
        localStorage.removeItem(this.storageKey);
    }
}