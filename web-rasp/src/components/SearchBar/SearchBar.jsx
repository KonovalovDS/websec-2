import { useState, useEffect, useCallback, useRef } from 'react';
import { searchStations } from '../../api';
import './SearchBar.css';

export default function SearchBar({ onStationSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const debounceRef = useRef(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const search = useCallback(async (value) => {
    if (!value.trim()) {
      setResults([]);
      setError(null);
      setIsDropdownOpen(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await searchStations(value, 10);
      setResults(data);
      setIsDropdownOpen(true);

      if (!cacheLoaded && data.length > 0) {
        setCacheLoaded(true);
      }
    } catch (err) {
      setError(err.message);
      setResults([]);
      setIsDropdownOpen(false);
    } finally {
      setLoading(false);
    }
  }, [cacheLoaded]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setIsDropdownOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      search(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, search]);

  const handleChange = (e) => {
    setQuery(e.target.value);
    setIsDropdownOpen(true);
  };

  const handleSelect = (station) => {
    setQuery(station.title);
    setResults([]);
    setIsDropdownOpen(false);
    onStationSelect(station);
  };

  const handleInputFocus = () => {
    if (query.trim() && results.length > 0) {
      setIsDropdownOpen(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setIsDropdownOpen(false);
    }, 200);
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder="Введите название станции"
        className="search-input"
        autoComplete="off"
      />

      {loading && <div className="loading">Загрузка...</div>}

      {error && <div className="error">{error}</div>}

      {isDropdownOpen && results.length > 0 && (
        <ul 
          className="search-results"
          onMouseDown={(e) => e.preventDefault()}
        >
          {results.map((station) => (
            <li
              key={station.code}
              onClick={() => handleSelect(station)}
              className="search-result-item"
            >
              <span className="station-title">{station.title}</span>
              {station.type && (
                <span className="station-type">{station.type}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {isDropdownOpen && query && results.length === 0 && !loading && !error && cacheLoaded && (
        <div className="no-results">Ничего не найдено</div>
      )}
    </div>
  );
}