import { useState, useEffect, useRef } from 'react';
import StationDropdown from "../StationDropdown/StationDropdown";
import './SearchInput.css';

export default function SearchInput({ 
  value, 
  onChange, 
  onSelect, 
  placeholder, 
  label,
  searchFn 
}) {
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value || !value.trim || value.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      if (!searchFn) return;
      
      setLoading(true);
      try {
        const data = await searchFn(value, 10);
        setResults(data);
        setShowDropdown(true);
      } catch (err) {
        setResults([]);
        setShowDropdown(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, searchFn]);

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const handleFocus = () => {
    if (results.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  const handleSelect = (station) => {
    onSelect(station);
    setShowDropdown(false);
  };

  return (
    <div className="search-input-wrapper">
      {label && <label className="search-input-label">{label}</label>}
      
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="search-input-field"
        autoComplete="off"
      />

      {loading && <div className="search-loading">Загрузка...</div>}

      {showDropdown && results.length > 0 && (
        <StationDropdown 
          results={results} 
          onSelect={handleSelect} 
        />
      )}
    </div>
  );
}