import { formatTime, formatDuration, formatDate } from '../../utils/format';
import './RouteCard.css';

export default function RouteCard({ route, date }) {
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
    <div className="route-card">
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
}