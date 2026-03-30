import './ErrorBlock.css';

export default function ErrorBlock({ message, onRetry }) {
  return (
    <div className="error-block">
      <div className="error-message">{message}</div>
      {onRetry && (
        <button onClick={onRetry} className="error-retry">
          Попробовать снова
        </button>
      )}
    </div>
  );
}