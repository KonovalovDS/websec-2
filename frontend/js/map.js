/**
 * Модуль карты на OpenLayers
 * @module map
 */

import { CONFIG } from './config.js';
import { api } from './api_client.js';

export class StationMap {
    /**
     * @param {string} containerId - ID контейнера карты
     * @param {Function} onSelectStation - Callback при клике на маркер
     */
    constructor(containerId, onSelectStation) {
        this.containerId = containerId;
        this.onSelectStation = onSelectStation;
        this.map = null;
        this.stationsLayer = null;
    }
    
    /**
     * Инициализация карты
     */
    init() {
        if (typeof ol === 'undefined') {
            console.error('❌ OpenLayers not loaded');
            return;
        }
        
        const moscowCoords = ol.proj.fromLonLat([37.6176, 55.7558]);
        
        this.map = new ol.Map({
            target: this.containerId,
            layers: [new ol.layer.Tile({ source: new ol.source.OSM() })],
            view: new ol.View({
                center: moscowCoords,
                zoom: CONFIG.MAP.ZOOM,
                minZoom: CONFIG.MAP.MIN_ZOOM,
                maxZoom: CONFIG.MAP.MAX_ZOOM
            })
        });
        
        this.stationsLayer = new ol.layer.Vector({
            source: new ol.source.Vector(),
            style: this._createStyle()
        });
        this.map.addLayer(this.stationsLayer);
        
        this.map.on('click', (evt) => {
            const feature = this.map.forEachFeatureAtPixel(evt.pixel, f => f);
            if (feature?.get('stationCode')) {
                this.onSelectStation({
                    code: feature.get('stationCode'),
                    title: feature.get('title'),
                    lat: feature.get('lat'),
                    lon: feature.get('lon')
                });
            }
        });
        
        setTimeout(() => {
            if (this.map) {
                this.map.getView().setCenter(moscowCoords);
                this.map.getView().setZoom(CONFIG.MAP.ZOOM);
            }
        }, 100);
    }
    
    /**
     * Стиль маркеров — только точки
     * @returns {ol.style.Style}
     * @private
     */
    _createStyle() {
        return new ol.style.Style({
            image: new ol.style.Circle({
                radius: 5,
                fill: new ol.style.Fill({ color: '#667eea' }),
                stroke: new ol.style.Stroke({ color: '#ffffff', width: 1 })
            })
        });
    }
    
    /**
     * Показать маркеры станций на карте
     * @param {Array} stations - Список станций
     */
    async showStations(stations) {
        const source = this.stationsLayer.getSource();
        source.clear();
        
        const list = stations || await this._loadAllStations();
        
        for (const s of list) {
            if (!s.lat || !s.lon || !s.code) continue;
            
            source.addFeature(new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.fromLonLat([s.lon, s.lat])),
                stationCode: s.code,
                title: s.title,
                lat: s.lat,
                lon: s.lon
            }));
        }
    }
    
    /**
     * Загрузить все станции с API
     * @returns {Promise<Array>}
     * @private
     */
    async _loadAllStations() {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/stations/all`);
            const data = await response.json();
            return data.stations || [];
        } catch (e) {
            console.error('Error loading stations:', e);
            return [];
        }
    }
    
    /**
     * Центрировать карту на конкретной станции
     * @param {number} lat - Широта
     * @param {number} lon - Долгота
     * @param {number} zoom - Уровень зума
     */
    centerOnStation(lat, lon, zoom = 12) {
        if (!lat || !lon) return;
        this.map.getView().setCenter(ol.proj.fromLonLat([lon, lat]));
        this.map.getView().setZoom(zoom);
    }
    
    /**
     * Очистить все маркеры
     */
    clear() {
        this.stationsLayer?.getSource().clear();
    }
}