class StorageWrapper {
  constructor(options = {}) {
    this.prefix = options.prefix || '';
    this.useSession = options.useSession || false;
    this.storage = this.useSession ? sessionStorage : localStorage;
    this.available = this._checkAvailability();
  }

  _checkAvailability() {
    try {
      const test = '__storage_test__';
      this.storage.setItem(test, test);
      this.storage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('[Storage] Not available:', e.message);
      return false;
    }
  }

  _makeKey(key) {
    return this.prefix ? `${this.prefix}:${key}` : key;
  }

  get(key, defaultValue = null) {
    if (!this.available) return defaultValue;
    
    try {
      const item = this.storage.getItem(this._makeKey(key));
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`[Storage] Get failed: ${key}`, e.message);
      return defaultValue;
    }
  }

  set(key, value) {
    if (!this.available) {
      console.warn(`[Storage] Set failed: ${key} (unavailable)`);
      return false;
    }
    
    try {
      this.storage.setItem(this._makeKey(key), JSON.stringify(value));
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.error('[Storage] Quota exceeded');
        this.clear();
      } else {
        console.warn(`[Storage] Set failed: ${key}`, e.message);
      }
      return false;
    }
  }

  remove(key) {
    if (!this.available) return false;
    
    try {
      this.storage.removeItem(this._makeKey(key));
      return true;
    } catch (e) {
      console.warn(`[Storage] Remove failed: ${key}`, e.message);
      return false;
    }
  }

  clear() {
    if (!this.available) return false;
    
    try {
      if (this.prefix) {
        // Удаляем только ключи с префиксом
        const keysToRemove = [];
        for (let i = 0; i < this.storage.length; i++) {
          const key = this.storage.key(i);
          if (key?.startsWith(this.prefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => this.storage.removeItem(key));
      } else {
        this.storage.clear();
      }
      return true;
    } catch (e) {
      console.warn('[Storage] Clear failed:', e.message);
      return false;
    }
  }

  has(key) {
    if (!this.available) return false;
    return this.storage.getItem(this._makeKey(key)) !== null;
  }

  keys() {
    if (!this.available) return [];
    
    const result = [];
    const prefix = this._makeKey('');
    
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(prefix)) {
        result.push(key.replace(prefix, ''));
      }
    }
    return result;
  }

  all() {
    const result = {};
    for (const key of this.keys()) {
      result[key] = this.get(key);
    }
    return result;
  }
}

export const storage = new StorageWrapper();
export default StorageWrapper;