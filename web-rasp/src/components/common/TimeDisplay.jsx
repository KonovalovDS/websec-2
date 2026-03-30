import { formatTime } from '../../utils/format';
import './TimeDisplay.css';

export default function TimeDisplay({ value, className = '' }) {
  return (
    <span className={`time-display ${className}`}>
      {formatTime(value)}
    </span>
  );
}