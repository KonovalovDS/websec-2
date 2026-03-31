import './FavoriteButton.css';

export default function FavoriteButton({ isFavorite, onToggle, title = '' }) {
  return (
    <button
      className={`favorite-button ${isFavorite ? 'active' : ''}`}
      onClick={onToggle}
      title={title || (isFavorite ? 'Удалить из избранного' : 'Добавить в избранное')}
    >
      {isFavorite ? '★' : '☆'}
    </button>
  );
}