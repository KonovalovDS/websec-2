// ============================================
// Модуль карты на OpenLayers — УПРОЩЁННЫЙ
// ============================================

import { CONFIG } from './config.js';
import { api } from './api_client.js';

export class StationMap {
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
        console.log('🗺️ Инициализация карты...');
        
        this.map = new ol.Map({
            target: this.containerId,
            layers: [new ol.layer.Tile({ source: new ol.source.OSM() })],
            view: new ol.View({
                center: ol.proj.fromLonLat([37.6176, 55.7558]),  // 🔥 Москва (статично)
                zoom: 7,  // 🔥 Статичный зум
                minZoom: CONFIG.MAP.MIN_ZOOM,
                maxZoom: CONFIG.MAP.MAX_ZOOM
            })
        });
        
        this.stationsLayer = new ol.layer.Vector({
            source: new ol.source.Vector(),
            style: this._createStyle()
        });
        this.map.addLayer(this.stationsLayer);
        
        // Клик по маркеру
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
        
        console.log('✅ Карта инициализирована (центр: Москва)');
    }
    
    /**
     * Стиль маркеров — только точки
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
     * Показать маркеры станций на карте — 🔥 БЕЗ fit(), БЕЗ АВТО-ЦЕНТРОВКИ
     */
    async showStations(stations) {
        console.log('🗺️ Загрузка станций на карту...');
        
        const source = this.stationsLayer.getSource();
        source.clear();
        
        const list = stations || await this._loadAllStations();
        
        console.log('📊 Всего станций:', list.length);
        
        let addedCount = 0;
        let skippedCount = 0;
        
        for (const s of list) {
            // Пропускаем станции без координат
            if (!s.lat || !s.lon || !s.code) {
                skippedCount++;
                continue;
            }
            
            source.addFeature(new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.fromLonLat([s.lon, s.lat])),
                stationCode: s.code,
                title: s.title,
                lat: s.lat,
                lon: s.lon
            }));
            
            addedCount++;
        }
        
        console.log(`✅ Добавлено: ${addedCount}, ⚠️ Пропущено: ${skippedCount}`);
        console.log('📍 Карта остаётся на Москве (зум 7)');
        
        // 🔥 УБРАНО: fit() и авто-центровка
        // Карта остаётся там, где была (Москва по умолчанию)
    }
    
    /**
     * Загрузить все станции с API
     */
    async _loadAllStations() {
        try {
            console.log('📡 Загрузка станций с API...');
            const response = await fetch(`${CONFIG.API_BASE}/stations/all`);
            const data = await response.json();
            console.log('📥 Получено:', data.stations?.length || 0);
            return data.stations || [];
        } catch (e) {
            console.error('❌ Ошибка:', e);
            return [];
        }
    }
    
    /**
     * Центрировать карту на конкретной станции
     */
    centerOnStation(lat, lon, zoom = 12) {
        console.log('🎯 Центрирование:', { lat, lon, zoom });
        
        if (!lat || !lon) {
            console.error('❌ Нет координат для центрирования');
            return;
        }
        
        const center = ol.proj.fromLonLat([lon, lat]);
        console.log('📍 OpenLayers координаты:', center);
        
        this.map.getView().setCenter(center);
        this.map.getView().setZoom(zoom);
    }
    
    /**
     * Очистить все маркеры
     */
    clear() {
        console.log('🗑️ Очистка карты');
        this.stationsLayer?.getSource().clear();
    }
}