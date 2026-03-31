import { useEffect, useState } from 'react';
import { getSchedule } from '../../api';
import TrainCard from './TrainCard';
import { ErrorBlock, LoadingBlock, FavoriteButton } from '../common';
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

  if (!station) {
    return (
      <div className="schedule-empty">
        Выберите станцию для просмотра расписания
      </div>
    );
  }

  if (loading) {
    return <LoadingBlock message="Загрузка расписания..." />;
  }

  if (error) {
    return <ErrorBlock message={error} onRetry={() => setError(null)} />;
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

  return (
    <div className="schedule">
      <div className="schedule-header">
        <h2 className="schedule-title">Расписание: {station.title}</h2>
        
        <FavoriteButton
          isFavorite={isFavorite}
          onToggle={isFavorite ? onRemoveFavorite : onAddFavorite}
        />
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