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
     * Отобразить список избранного
     * 🔥 ДОБАВЛЕНО: onRemove callback
     */
    renderToList($listElement, onSelect, onRemove) {
        const favorites = this.getAll();
        
        if (!favorites.length) {
            $listElement.html('<li class="favorites-empty">Нет избранных станций</li>');
            return;
        }
        
        const html = favorites.map((s) => {
            return `
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
            `;
        }).join('');
        
        $listElement.html(html);
        
        // Клик по названию станции
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
        
        // 🔥 Клик по кнопке удаления — вызываем onRemove callback
        $listElement.find('.btn-remove').on('click', (e) => {
            e.stopPropagation();
            const $btn = $(e.currentTarget);
            const code = $btn.data('code');
            
            this.remove(code);
            this.renderToList($listElement, onSelect, onRemove);
            
            // 🔥 Вызываем callback чтобы обновить кнопки в app.js
            if (onRemove) {
                onRemove(code);
            }
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