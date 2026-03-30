import './LoadingBlock.css';

export default function LoadingBlock({ message = 'Загрузка...' }) {
  return (
    <div className="loading-block">
      {message}
    </div>
  );
}