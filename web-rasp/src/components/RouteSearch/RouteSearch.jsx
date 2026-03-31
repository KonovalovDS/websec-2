import { useState, useEffect } from 'react';
import { searchStations, searchRoutes } from '../../api';
import FavoritesList from '../FavoritesList/FavoritesList';
import RouteCard from './RouteCard';
import { ErrorBlock, LoadingBlock, SearchInput, FavoriteButton } from '../common';
import './RouteSearch.css';

export default function RouteSearch({ 
  selectedRoute, 
  favoriteRoutes, 
  onAddFavorite, 
  onRemoveFavoriteByKey,
  isRouteFavorite,
  onRouteSelect 
}) {
  const [fromStation, setFromStation] = useState(null);
  const [toStation, setToStation] = useState(null);
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [date, setDate] = useState('');
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedRoute && selectedRoute.from && selectedRoute.to) {
      setFromStation(selectedRoute.from);
      setToStation(selectedRoute.to);
      setFromQuery(selectedRoute.from.title || '');
      setToQuery(selectedRoute.to.title || '');
    }
  }, [selectedRoute]);

  const handleFromSelect = (station) => {
    setFromStation(station);
    setFromQuery(station.title);
  };

  const handleToSelect = (station) => {
    setToStation(station);
    setToQuery(station.title);
  };

  const handleSearch = async () => {
    if (!fromStation || !toStation) {
      setError('Выберите станции отправления и прибытия');
      return;
    }

    if (fromStation.code === toStation.code) {
      setError('Станции должны быть разными');
      return;
    }

    setLoading(true);
    setError(null);
    setRoutes([]);

    try {
      const data = await searchRoutes(fromStation.code, toStation.code, date || null);
      setRoutes(data);

      if (data.length === 0) {
        setError('Рейсы не найдены');
      }
    } catch (err) {
      setError(err.message || 'Ошибка при поиске рейсов');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = () => {
    if (!fromStation || !toStation) return;

    const isFavorite = isRouteFavorite(fromStation.code, toStation.code);

    if (isFavorite) {
      onRemoveFavoriteByKey(fromStation.code, toStation.code);
    } else {
      onAddFavorite({
        from_code: fromStation.code,
        to_code: toStation.code,
        from_title: fromStation.title,
        to_title: toStation.title,
      });
    }
  };

  const currentRouteIsFavorite = fromStation && toStation 
    ? isRouteFavorite(fromStation.code, toStation.code) 
    : false;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="route-search">
      <div className="route-inputs">
        <SearchInput
          value={fromQuery}
          onChange={setFromQuery}
          onSelect={handleFromSelect}
          placeholder="Введите станцию отправления"
          label="Откуда"
          searchFn={searchStations}
        />

        <SearchInput
          value={toQuery}
          onChange={setToQuery}
          onSelect={handleToSelect}
          placeholder="Введите станцию прибытия"
          label="Куда"
          searchFn={searchStations}
        />

        <div className="input-group">
          <label className="input-label">Дата (опционально)</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={today}
            className="search-input date-input"
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={loading || !fromStation || !toStation}
          className="search-btn"
        >
          {loading ? 'Поиск...' : 'Найти рейсы'}
        </button>
      </div>

      {error && <ErrorBlock message={error} onRetry={() => setError(null)} />}

      {loading && <LoadingBlock message="Поиск рейсов..." />}

      {favoriteRoutes && favoriteRoutes.length > 0 && (
        <FavoritesList
          type="routes"
          items={favoriteRoutes}
          onRemove={onRemoveFavoriteByKey}
          onSelect={onRouteSelect}
        />
      )}

      {routes.length > 0 && (
        <div className="routes-list">
          <div className="routes-header">
            <h3 className="routes-title">Найдено рейсов: {routes.length}</h3>
            
            <FavoriteButton
              isFavorite={currentRouteIsFavorite}
              onToggle={handleToggleFavorite}
              title={currentRouteIsFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
            />
          </div>
          
          {routes.map((route, index) => (
            <RouteCard key={index} route={route} date={date} />
          ))}
        </div>
      )}
    </div>
  );
}