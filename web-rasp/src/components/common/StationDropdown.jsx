import './StationDropdown.css';

export default function StationDropdown({ results, onSelect }) {
  return (
    <ul 
      className="station-dropdown"
      onMouseDown={(e) => e.preventDefault()}
    >
      {results.map((station) => (
        <li
          key={station.code}
          onClick={() => onSelect(station)}
          className="station-dropdown-item"
        >
          <span className="station-title">{station.title}</span>
          {station.type && (
            <span className="station-type">{station.type}</span>
          )}
        </li>
      ))}
    </ul>
  );
}