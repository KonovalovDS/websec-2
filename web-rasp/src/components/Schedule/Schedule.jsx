import { useEffect, useState } from 'react';
import { getSchedule } from '../../api';
import './Schedule.css';

export default function Schedule({ station, isFavorite, onAddFavorite, onRemoveFavorite }) {
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!station?.code) {
      setTrains([]);
      setError(null);
      return;
    }

    const loadSchedule = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getSchedule(station.code);
        setTrains(data);
      } catch (err) {
        setError(err.message || 'Ошибка при загрузке расписания');
        setTrains([]);
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [station]);

  const formatTime = (timeValue) => {
    if (!timeValue) return '—';
    if (typeof timeValue === 'string' && timeValue.includes('T')) {
      const date = new Date(timeValue);
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

  if (!station) {
    return (
      <div className="schedule-empty">
        Выберите станцию для просмотра расписания
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Загрузка расписания...</div>;
  }

  if (error) {
    return (
      <div className="schedule-error">
        <div className="error-message">{error}</div>
        <button onClick={() => setError(null)} className="error-retry">
          Попробовать снова
        </button>
      </div>
    );
  }

  if (trains.length === 0) {
    return <div className="no-results">Нет пригородных поездов на сегодня</div>;
  }

  const departing = trains.filter(t => 
    t.thread?.transport_type === 'suburban' && t.departure
  );

  const arriving = trains.filter(t => 
    t.thread?.transport_type === 'suburban' && t.arrival && !t.departure
  );

  const parseRoute = (title) => {
    if (!title) return { from: '—', to: '—' };
    const parts = title.split(' — ');
    return {
      from: parts[0] || '—',
      to: parts[1] || '—',
    };
  };

  const TrainCard = ({ train, type }) => {
    const route = parseRoute(train.thread?.title);
    const time = type === 'departing' ? train.departure : train.arrival;

    return (
      <div className="train-card">
        <div className="train-header">
          <span className="train-number">{train.thread?.number || '—'}</span>
          <span className="train-time">{formatTime(time)}</span>
        </div>

        <div className="train-route">
          <span className="route-from">{route.from}</span>
          <span className="route-arrow">→</span>
          <span className="route-to">{route.to}</span>
        </div>

        <div className="train-details">
          {type === 'departing' && train.direction && (
            <span className="train-direction">{train.direction}</span>
          )}
          {train.stops && train.stops !== 'везде' && (
            <span className="train-stops">{train.stops}</span>
          )}
          {train.days && (
            <span className="train-days">{train.days}</span>
          )}
        </div>

        {train.platform && (
          <div className="train-platform">Платформа: {train.platform}</div>
        )}
      </div>
    );
  };

  return (
    <div className="schedule">
      <div className="schedule-header">
        <h2 className="schedule-title">Расписание: {station.title}</h2>
        
        <button
          className={`favorite-toggle-btn ${isFavorite ? 'active' : ''}`}
          onClick={isFavorite ? onRemoveFavorite : onAddFavorite}
          title={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      </div>

      <div className="schedule-columns">
        <section className="schedule-column">
          <h3 className="section-title">Отправление</h3>
          <div className="trains-list">
            {departing.length > 0 ? (
              departing.map((train, index) => (
                <TrainCard key={index} train={train} type="departing" />
              ))
            ) : (
              <div className="no-data">Нет данных</div>
            )}
          </div>
        </section>

        <section className="schedule-column">
          <h3 className="section-title">Прибытие</h3>
          <div className="trains-list">
            {arriving.length > 0 ? (
              arriving.map((train, index) => (
                <TrainCard key={index} train={train} type="arriving" />
              ))
            ) : (
              <div className="no-data">Нет данных</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}