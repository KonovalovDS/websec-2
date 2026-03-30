import { useState, useEffect } from 'react';
import { searchStations, searchRoutes } from '../../api';
import FavoritesList from '../FavoritesList/FavoritesList';
import './RouteSearch.css';

export default function RouteSearch({ 
  selectedRoute, 
  favoriteRoutes, 
  onAddFavorite, 
  onRemoveFavoriteByKey,
  isRouteFavorite,
  onRouteSelect 
}) {
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromStation, setFromStation] = useState(null);
  const [toStation, setToStation] = useState(null);
  const [date, setDate] = useState('');
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [fromResults, setFromResults] = useState([]);
  const [toResults, setToResults] = useState([]);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);

  useEffect(() => {
    if (selectedRoute && selectedRoute.from && selectedRoute.to) {
      setFromStation(selectedRoute.from);
      setToStation(selectedRoute.to);
      setFromQuery(selectedRoute.from.title || '');
      setToQuery(selectedRoute.to.title || '');
    }
  }, [selectedRoute]);

  const searchFromStations = async (query) => {
    if (!query.trim() || query.trim().length < 2) {
      setFromResults([]);
      return;
    }

    try {
      const data = await searchStations(query, 10);
      setFromResults(data);
      setShowFromDropdown(true);
    } catch (err) {
      setFromResults([]);
    }
  };

  const searchToStations = async (query) => {
    if (!query.trim() || query.trim().length < 2) {
      setToResults([]);
      return;
    }

    try {
      const data = await searchStations(query, 10);
      setToResults(data);
      setShowToDropdown(true);
    } catch (err) {
      setToResults([]);
    }
  };

  const handleFromChange = (e) => {
    const value = e.target.value;
    setFromQuery(value);
    setFromStation(null);
    if (value.trim().length >= 2) {
      searchFromStations(value);
    } else {
      setFromResults([]);
    }
  };

  const handleToChange = (e) => {
    const value = e.target.value;
    setToQuery(value);
    setToStation(null);
    if (value.trim().length >= 2) {
      searchToStations(value);
    } else {
      setToResults([]);
    }
  };

  const handleFromSelect = (station) => {
    setFromStation(station);
    setFromQuery(station.title);
    setShowFromDropdown(false);
  };

  const handleToSelect = (station) => {
    setToStation(station);
    setToQuery(station.title);
    setShowToDropdown(false);
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

  const formatTime = (timeValue) => {
    if (!timeValue) return '—';
    if (typeof timeValue === 'string' && timeValue.includes('T')) {
      const date = new Date(timeValue);
      if (isNaN(date.getTime())) return '—';
      return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    if (typeof timeValue === 'string') {
      return timeValue.slice(0, 5);
    }
    return '—';
  };

  const formatDuration = (durationValue) => {
    if (!durationValue) return '—';
    const duration = typeof durationValue === 'string' ? parseInt(durationValue, 10) : durationValue;
    if (isNaN(duration) || duration <= 0) return '—';
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    if (hours > 0) {
      return `${hours} ч ${minutes} мин`;
    }
    return `${minutes} мин`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long',
      weekday: 'short'
    });
  };

  const today = new Date().toISOString().split('T')[0];

  const currentRouteIsFavorite = fromStation && toStation 
    ? isRouteFavorite(fromStation.code, toStation.code) 
    : false;

  return (
    <div className="route-search">
      <div className="route-inputs">
        <div className="input-group">
          <label className="input-label">Откуда</label>
          <div className="search-input-wrapper">
            <input
              type="text"
              value={fromQuery}
              onChange={handleFromChange}
              onFocus={() => fromResults.length > 0 && setShowFromDropdown(true)}
              onBlur={() => setTimeout(() => setShowFromDropdown(false), 200)}
              placeholder="Введите станцию отправления"
              className="search-input"
              autoComplete="off"
            />
            {showFromDropdown && fromResults.length > 0 && (
              <ul 
                className="search-results"
                onMouseDown={(e) => e.preventDefault()}
              >
                {fromResults.map((station) => (
                  <li
                    key={station.code}
                    onClick={() => handleFromSelect(station)}
                    className="search-result-item"
                  >
                    <span className="station-title">{station.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Куда</label>
          <div className="search-input-wrapper">
            <input
              type="text"
              value={toQuery}
              onChange={handleToChange}
              onFocus={() => toResults.length > 0 && setShowToDropdown(true)}
              onBlur={() => setTimeout(() => setShowToDropdown(false), 200)}
              placeholder="Введите станцию прибытия"
              className="search-input"
              autoComplete="off"
            />
            {showToDropdown && toResults.length > 0 && (
              <ul 
                className="search-results"
                onMouseDown={(e) => e.preventDefault()}
              >
                {toResults.map((station) => (
                  <li
                    key={station.code}
                    onClick={() => handleToSelect(station)}
                    className="search-result-item"
                  >
                    <span className="station-title">{station.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

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

      {error && <div className="route-error">{error}</div>}

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
            
            <button
              className={`add-favorite-route-btn ${currentRouteIsFavorite ? 'active' : ''}`}
              onClick={handleToggleFavorite}
              title={currentRouteIsFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
              disabled={!fromStation || !toStation}
            >
              {currentRouteIsFavorite ? '★ В избранном' : '☆ Добавить в избранное'}
            </button>
          </div>
          
          {routes.map((route, index) => {
            const rawStops = route.stops || route.segment_stops;
            const stops = Array.isArray(rawStops) ? rawStops : [];
            
            const departure = route.departure || route.start_time;
            const arrival = route.arrival || route.end_time;
            const fromTitle = route.from?.title || route.from_title || '—';
            const toTitle = route.to?.title || route.to_title || '—';
            const number = route.thread?.number || route.number || '—';
            const transportType = route.thread?.transport_type;
            const transportSubtype = route.thread?.transport_subtype?.title;
            const carrier = route.thread?.carrier?.title;
            const vehicle = route.thread?.vehicle;
            const days = route.days;
            const platform = route.platform;
            const distance = route.distance;

            return (
              <div key={index} className="route-card">
                <div className="route-header">
                  <div className="route-time-block">
                    <div className="route-time">
                      <span className="time-departure">{formatTime(departure)}</span>
                      <span className="time-arrow">→</span>
                      <span className="time-arrival">{formatTime(arrival)}</span>
                    </div>
                    {date && (
                      <span className="route-date">{formatDate(date)}</span>
                    )}
                  </div>
                  <div className="route-number-block">
                    <span className="route-number">№ {number}</span>
                    {transportSubtype && (
                      <span className="route-subtype">{transportSubtype}</span>
                    )}
                  </div>
                </div>

                <div className="route-stations">
                  <span className="station-from">{fromTitle}</span>
                  <span className="station-arrow">→</span>
                  <span className="station-to">{toTitle}</span>
                </div>

                <div className="route-info">
                  {route.duration && (
                    <div className="route-info-item">
                      <span className="info-label">⏱ В пути</span>
                      <span className="info-value">{formatDuration(route.duration)}</span>
                    </div>
                  )}
                  {distance && (
                    <div className="route-info-item">
                      <span className="info-label">📏 Расстояние</span>
                      <span className="info-value">{distance} км</span>
                    </div>
                  )}
                  {transportType && (
                    <div className="route-info-item">
                      <span className="info-label">🚆 Тип</span>
                      <span className="info-value">{transportType}</span>
                    </div>
                  )}
                  {carrier && (
                    <div className="route-info-item">
                      <span className="info-label">🏢 Перевозчик</span>
                      <span className="info-value">{carrier}</span>
                    </div>
                  )}
                  {vehicle && (
                    <div className="route-info-item">
                      <span className="info-label">🚃 Состав</span>
                      <span className="info-value">{vehicle}</span>
                    </div>
                  )}
                  {platform && (
                    <div className="route-info-item">
                      <span className="info-label">📍 Платформа</span>
                      <span className="info-value">{platform}</span>
                    </div>
                  )}
                  {days && (
                    <div className="route-info-item days-item">
                      <span className="info-label">📅 Дни</span>
                      <span className="info-value days-value">{days}</span>
                    </div>
                  )}
                </div>

                {stops.length > 0 && (
                  <div className="route-stops-block">
                    <h4 className="stops-title">🛑 Остановки в пути ({stops.length})</h4>
                    <div className="stops-list">
                      {stops.map((stop, i) => {
                        const stopTime = stop?.departure || stop?.arrival;
                        const stopName = stop?.station?.title || stop?.title || stop?.name || '—';
                        const stopDuration = stop?.duration;
                        
                        return (
                          <div key={i} className="stop-item">
                            <span className="stop-time">{formatTime(stopTime)}</span>
                            <span className="stop-name">{stopName}</span>
                            {stopDuration && (
                              <span className="stop-duration">{stopDuration} мин</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}