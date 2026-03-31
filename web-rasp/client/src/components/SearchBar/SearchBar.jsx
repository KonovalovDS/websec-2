import { useState } from 'react';
import { searchStations } from '../../api';
import SearchInput from '../SearchInput/SearchInput';
import './SearchBar.css';

export default function SearchBar({ onStationSelect }) {
  const [query, setQuery] = useState('');

  const handleSelect = (station) => {
    setQuery(station.title);
    onStationSelect(station);
  };

  return (
    <div className="search-bar">
      <SearchInput
        value={query}
        onChange={setQuery}
        onSelect={handleSelect}
        placeholder="Введите название станции"
        searchFn={searchStations}
      />
    </div>
  );
}