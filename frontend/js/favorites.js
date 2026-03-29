// Модуль избранного
import { CONFIG } from './config.js';

export class FavoritesManager {
    constructor(key = CONFIG.STORAGE.FAVORITES_KEY) {
        this.key = key;
    }
    
    _load() {
        try {
            const raw = localStorage.getItem(this.key);
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    }
    
    _save(list) {
        localStorage.setItem(this.key, JSON.stringify(list));
    }
    
    add(s) {
        const list = this._load();
        if (!list.some(x => x.code === s.code)) {
            list.push({ ...s, added: Date.now() });
            this._save(list);
            return true;
        }
        return false;
    }
    
    remove(code) {
        this._save(this._load().filter(x => x.code !== code));
    }
    
    isFavorite(code) {
        return this._load().some(x => x.code === code);
    }
    
    getAll() {
        return this._load().sort((a, b) => b.added - a.added);
    }
    
    renderToList($el, onSelect) {
        const list = this.getAll();
        if (!list.length) {
            $el.html('<li class="no-results">Пусто</li>');
            return;
        }
        $el.html(list.map(s => `
            <li>
                <button type="button" data-code="${this._esc(s.code)}">
                    ${this._esc(s.title)}
                </button>
            </li>
        `).join(''));
        $el.find('button').on('click', (e) => {
            const $btn = $(e.currentTarget);
            onSelect({ code: $btn.data('code'), title: $btn.text() });
        });
    }
    
    _esc(str) {
        const d = document.createElement('div');
        d.textContent = str || '';
        return d.innerHTML;
    }
    
    clear() { localStorage.removeItem(this.key); }
}