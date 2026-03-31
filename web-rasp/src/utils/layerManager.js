class LayerManager {
  constructor() {
    this.layers = new Map();
  }

  register(name, layer) {
    if (this.layers.has(name)) {
      console.warn(`[LayerManager] Layer "${name}" already exists, overwriting`);
    }
    this.layers.set(name, layer);
  }

  get(name) {
    const layer = this.layers.get(name);
    if (!layer) {
      console.warn(`[LayerManager] Layer "${name}" not found`);
    }
    return layer;
  }

  remove(name) {
    return this.layers.delete(name);
  }

  getAll() {
    return Array.from(this.layers.entries());
  }

  clear() {
    this.layers.clear();
  }

  exists(name) {
    return this.layers.has(name);
  }
}

export const layerManager = new LayerManager();
export default layerManager;