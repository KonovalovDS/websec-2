// Модуль карты на OpenLayers
import { CONFIG } from './config.js';
import { api } from './api_client.js';

export class StationMap {
    constructor(containerId, onSelectStation) {
        this.containerId = containerId;
        this.onSelectStation = onSelectStation;
        this.map = null;
        this.stationsLayer = null;
    }
    
    init() {
        this.map = new ol.Map({
            target: this.containerId,
            layers: [new ol.layer.Tile({ source: new ol.source.OSM() })],
            view: new ol.View({
                center: ol.proj.fromLonLat(CONFIG.MAP.CENTER),
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
    }
    
    _createStyle() {
        return new ol.style.Style({
            image: new ol.style.Circle({
                radius: 8,
                fill: new ol.style.Fill({ color: '#667eea' }),
                stroke: new ol.style.Stroke({ color: 'white', width: 2 })
            }),
            text: new ol.style.Text({
                text: '🚉',
                offsetY: -18,
                scale: 1.3,
                backgroundFill: new ol.style.Fill({ color: 'rgba(255,255,255,0.9)' })
            })
        });
    }
    
    async showStations(stations) {
        const source = this.stationsLayer.getSource();
        source.clear();
        
        const list = stations || [];
        
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
        
        if (list.length > 0) {
            this.map.getView().fit(source.getExtent(), {
                padding: [50, 50, 50, 50],
                maxZoom: 12,
                duration: 500
            });
        }
    }
    
    centerOnStation(lat, lon, zoom = 12) {
        this.map.getView().setCenter(ol.proj.fromLonLat([lon, lat]));
        this.map.getView().setZoom(zoom);
    }
    
    clear() {
        this.stationsLayer?.getSource().clear();
    }
}