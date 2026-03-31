function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.warn('[Storage] localStorage is not available:', e.message);
    return false;
  }
}

const storage = {
  available: isStorageAvailable(),

  get(key, defaultValue = null) {
    if (!this.available) return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`[Storage] Failed to get ${key}:`, e.message);
      return defaultValue;
    }
  },

  set(key, value) {
    if (!this.available) {
      console.warn(`[Storage] Cannot set ${key}: localStorage unavailable`);
      return false;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.error('[Storage] Quota exceeded. Clearing old data...');
        this.clear();
      } else {
        console.warn(`[Storage] Failed to set ${key}:`, e.message);
      }
      return false;
    }
  },

  remove(key) {
    if (!this.available) return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`[Storage] Failed to remove ${key}:`, e.message);
      return false;
    }
  },

  clear() {
    if (!this.available) return false;
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.warn('[Storage] Failed to clear:', e.message);
      return false;
    }
  },
};

export default storage;