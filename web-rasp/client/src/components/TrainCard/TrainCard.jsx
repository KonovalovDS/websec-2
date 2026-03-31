import { formatTime } from '../../utils/format';
import './TrainCard.css';

export default function TrainCard({ train, type }) {
  const parseRoute = (title) => {
    if (!title) return { from: '—', to: '—' };
    const parts = title.split(' — ');
    return {
      from: parts[0] || '—',
      to: parts[1] || '—',
    };
  };

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
}