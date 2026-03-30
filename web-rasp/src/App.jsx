import { useState, useEffect, useCallback } from 'react';
import SearchBar from './components/SearchBar/SearchBar';
import Schedule from './components/Schedule/Schedule';
import MapComponent from './components/Map/Map';
import RouteSearch from './components/RouteSearch/RouteSearch';
import FavoritesList from './components/FavoritesList/FavoritesList';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('stations');
  const [selectedStation, setSelectedStation] = useState(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [favoriteStations, setFavoriteStations] = useState([]);
  const [favoriteRoutes, setFavoriteRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);

  useEffect(() => {
    const savedStations = localStorage.getItem('favoriteStations');
    const savedRoutes = localStorage.getItem('favoriteRoutes');
    if (savedStations) {
      try {
        setFavoriteStations(JSON.parse(savedStations));
      } catch (e) {
        console.error(e);
      }
    }
    if (savedRoutes) {
      try {
        setFavoriteRoutes(JSON.parse(savedRoutes));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('favoriteStations', JSON.stringify(favoriteStations));
  }, [favoriteStations]);

  useEffect(() => {
    localStorage.setItem('favoriteRoutes', JSON.stringify(favoriteRoutes));
  }, [favoriteRoutes]);

  const addFavoriteStation = useCallback((station) => {
    setFavoriteStations(prev => {
      if (!prev.find(s => s.code === station.code)) {
        return [...prev, station];
      }
      return prev;
    });
  }, []);

  const removeFavoriteStation = useCallback((stationCode) => {
    setFavoriteStations(prev => prev.filter(s => s.code !== stationCode));
  }, []);

  const isStationFavorite = useCallback((stationCode) => {
    return favoriteStations.some(s => s.code === stationCode);
  }, [favoriteStations]);

  const addFavoriteRoute = useCallback((route) => {
    setFavoriteRoutes(prev => {
      const routeKey = `${route.from_code}-${route.to_code}`;
      const exists = prev.find(r => `${r.from_code}-${r.to_code}` === routeKey);
      if (!exists) {
        return [...prev, {
          from_code: route.from_code,
          to_code: route.to_code,
          from_title: route.from_title,
          to_title: route.to_title,
        }];
      }
      return prev;
    });
  }, []);

  const removeFavoriteRouteByKey = useCallback((fromCode, toCode) => {
    setFavoriteRoutes(prev => prev.filter(r => 
      !(r.from_code === fromCode && r.to_code === toCode)
    ));
  }, []);

  const isRouteFavorite = useCallback((fromCode, toCode) => {
    return favoriteRoutes.some(r => r.from_code === fromCode && r.to_code === toCode);
  }, [favoriteRoutes]);

  const handleStationSelect = useCallback((station) => {
    setSelectedStation(station);
  }, []);

  const handleRouteSelect = useCallback((from, to) => {
    setSelectedRoute({ from, to });
  }, []);

  const toggleMap = useCallback(() => {
    setIsMapOpen(prev => !prev);
  }, []);

  return (
    <main className="app">
      <h1>Ж/Д Расписания</h1>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'stations' ? 'active' : ''}`}
          onClick={() => setActiveTab('stations')}
        >
          Станции
        </button>
        <button
          className={`tab-btn ${activeTab === 'routes' ? 'active' : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          Рейсы
        </button>
      </div>

      <div className="container">
        {activeTab === 'stations' && (
          <>
            <div className="search-container">
              <SearchBar onStationSelect={handleStationSelect} />
              <button 
                onClick={toggleMap} 
                className={`map-toggle-btn ${isMapOpen ? 'active' : ''}`}
              >
                {isMapOpen ? 'Скрыть карту' : 'Показать карту'}
              </button>
            </div>

            <MapComponent 
              isOpen={isMapOpen} 
              onStationSelect={handleStationSelect} 
            />

            {favoriteStations.length > 0 && (
              <FavoritesList
                type="stations"
                items={favoriteStations}
                onRemove={removeFavoriteStation}
                onSelect={handleStationSelect}
              />
            )}

            <Schedule 
              station={selectedStation}
              isFavorite={selectedStation ? isStationFavorite(selectedStation.code) : false}
              onAddFavorite={() => selectedStation && addFavoriteStation(selectedStation)}
              onRemoveFavorite={() => selectedStation && removeFavoriteStation(selectedStation.code)}
            />
          </>
        )}

        {activeTab === 'routes' && (
          <RouteSearch 
            selectedRoute={selectedRoute}
            favoriteRoutes={favoriteRoutes}
            onAddFavorite={addFavoriteRoute}
            onRemoveFavoriteByKey={removeFavoriteRouteByKey}
            isRouteFavorite={isRouteFavorite}
            onRouteSelect={handleRouteSelect}
          />
        )}
      </div>
    </main>
  );
}

export default App;