import { useState, useEffect } from 'react';
import { storage } from './utils/storage';
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
    const savedStations = storage.get('favoriteStations');
    const savedRoutes = storage.get('favoriteRoutes');
    
    if (savedStations) {
      setFavoriteStations(savedStations);
    }
    if (savedRoutes) {
      setFavoriteRoutes(savedRoutes);
    }
  }, []);

  useEffect(() => {
    storage.set('favoriteStations', favoriteStations);
  }, [favoriteStations]);

  useEffect(() => {
    storage.set('favoriteRoutes', favoriteRoutes);
  }, [favoriteRoutes]);

  const addFavoriteStation = (station) => {
    setFavoriteStations(prev => {
      if (!prev.find(s => s.code === station.code)) {
        return [...prev, station];
      }
      return prev;
    });
  };

  const removeFavoriteStation = (stationCode) => {
    setFavoriteStations(prev => prev.filter(s => s.code !== stationCode));
  };

  const isStationFavorite = (stationCode) => {
    return favoriteStations.some(s => s.code === stationCode);
  };

  const addFavoriteRoute = (route) => {
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
  };

  const removeFavoriteRouteByKey = (fromCode, toCode) => {
    setFavoriteRoutes(prev => prev.filter(r => 
      !(r.from_code === fromCode && r.to_code === toCode)
    ));
  };

  const isRouteFavorite = (fromCode, toCode) => {
    return favoriteRoutes.some(r => r.from_code === fromCode && r.to_code === toCode);
  };

  const handleStationSelect = (station) => {
    setSelectedStation(station);
  };

  const handleRouteSelect = (from, to) => {
    setSelectedRoute({ from, to });
  };

  const toggleMap = () => {
    setIsMapOpen(prev => !prev);
  };

  return (
    <main className="app">
      <h1>Расписание электричек</h1>

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

            {isMapOpen && (
              <MapComponent onStationSelect={handleStationSelect} />
            )}

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