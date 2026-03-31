import './FavoritesList.css';

export default function FavoritesList({ type, items, onRemove, onSelect }) {
  if (!items || items.length === 0) return null;

  const handleClick = (item) => {
    if (type === 'stations' && onSelect) {
      onSelect(item);
    } else if (type === 'routes' && onSelect) {
      onSelect(
        { code: item.from_code, title: item.from_title },
        { code: item.to_code, title: item.to_title }
      );
    }
  };

  return (
    <div className="favorites-list">
      <h3 className="favorites-title">
        {type === 'stations' ? 'Избранные станции' : 'Избранные маршруты'}
      </h3>
      
      <div className="favorites-items">
        {items.map((item, index) => (
          <div 
            key={type === 'stations' ? item.code : `${item.from_code}-${item.to_code}-${index}`}
            className="favorite-item"
            onClick={() => handleClick(item)}
          >
            <div className="favorite-content">
              {type === 'stations' ? (
                <span className="favorite-station-name">{item.title}</span>
              ) : (
                <>
                  <span className="favorite-from">{item.from_title}</span>
                  <span className="favorite-arrow">→</span>
                  <span className="favorite-to">{item.to_title}</span>
                </>
              )}
            </div>
            
            <button
              className="favorite-remove-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (type === 'stations') {
                  onRemove(item.code);
                } else {
                  onRemove(item.from_code, item.to_code);
                }
              }}
              title="Удалить из избранного"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}