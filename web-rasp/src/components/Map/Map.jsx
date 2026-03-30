import { useEffect, useRef, useState, useCallback } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Cluster from 'ol/source/Cluster';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Style from 'ol/style/Style';
import Circle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Text from 'ol/style/Text';
import { fromLonLat } from 'ol/proj';
import { getAllStationsForMap } from '../../api';
import './Map.css';

export default function MapComponent({ onStationSelect, isOpen }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const onStationSelectRef = useRef(onStationSelect);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stationCount, setStationCount] = useState(0);

  useEffect(() => {
    onStationSelectRef.current = onStationSelect;
  }, [onStationSelect]);

  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.setTarget(null);
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !mapRef.current) {
      return;
    }

    if (mapInstance.current) {
      mapInstance.current.updateSize();
      return;
    }

    const rasterLayer = new TileLayer({
      source: new OSM(),
    });

    const vectorSource = new VectorSource({
      features: [],
    });

    const clusterSource = new Cluster({
      distance: 40,
      source: vectorSource,
    });

    const clusterStyle = (feature) => {
      const size = feature.get('features').length;
      
      if (size === 1) {
        return new Style({
          image: new Circle({
            radius: 6,
            fill: new Fill({ color: '#1976d2' }),
            stroke: new Stroke({ color: '#fff', width: 2 }),
          }),
        });
      }
      
      return new Style({
        image: new Circle({
          radius: 12,
          fill: new Fill({ color: '#1976d2' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
        }),
        text: new Text({
          text: size.toString(),
          fill: new Fill({ color: '#fff' }),
          font: 'bold 12px sans-serif',
        }),
      });
    };

    const vectorLayer = new VectorLayer({
      source: clusterSource,
      style: clusterStyle,
    });

    const map = new Map({
      target: mapRef.current,
      layers: [rasterLayer, vectorLayer],
      controls: [],
      view: new View({
        center: fromLonLat([45, 55]),
        zoom: 5,
        minZoom: 4,
        maxZoom: 18,
      }),
    });

    mapInstance.current = map;

    map.on('click', (event) => {
      const features = map.getFeaturesAtPixel(event.pixel);
      
      if (!features || features.length === 0) {
        return;
      }

      const feature = features[0];
      const featuresInCluster = feature.get('features');

      if (featuresInCluster && featuresInCluster.length === 1) {
        const station = featuresInCluster[0].get('station');
        onStationSelectRef.current(station);
      } else if (featuresInCluster && featuresInCluster.length > 1) {
        const view = map.getView();
        const currentZoom = view.getZoom();
        const center = feature.getGeometry().getCoordinates();
        const zoomIncrement = 3;
        const maxZoom = 16;

        const targetZoom = Math.min(currentZoom + zoomIncrement, maxZoom);

        view.animate({
          center: center,
          zoom: targetZoom,
          duration: 500,
        });
      }
    });

    const loadStations = async () => {
      setLoading(true);
      setError(null);

      try {
        const stations = await getAllStationsForMap();
        setStationCount(stations.length);

        const features = stations
          .filter(s => s.lat && s.lon)
          .map(station => {
            const feature = new Feature({
              geometry: new Point(fromLonLat([station.lon, station.lat])),
              station: station,
            });
            return feature;
          });

        vectorSource.addFeatures(features);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStations();

    setTimeout(() => {
      if (mapInstance.current) {
        mapInstance.current.updateSize();
      }
    }, 100);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="map-container">
      <div className="map-header">
        <span className="map-title">Карта станций</span>
        {stationCount > 0 && (
          <span className="station-count">{stationCount} станций</span>
        )}
      </div>

      {loading && <div className="map-loading">Загрузка карты...</div>}
      
      {error && <div className="map-error">Ошибка: {error}</div>}
      
      <div ref={mapRef} className="map" />
    </div>
  );
}