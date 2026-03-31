import storage from './utils/storage';

const API_BASE = 'http://localhost:5000/api';
const CACHE = {
  stations: null,
  timestamp: null,
  TTL: 24 * 60 * 60 * 1000,
};

async function apiRequest(endpoint, params = {}, timeout = 15000) {
  const query = new URLSearchParams(params);
  
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}?${query}`, { 
      signal: controller.signal 
    });
    clearTimeout(timer);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    
    return data;
  } catch (err) {
    clearTimeout(timer);
    
    if (err.name === 'AbortError') {
      throw new Error('Превышено время ожидания ответа');
    }
    
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error('Сервер недоступен.');
    }
    
    throw err;
  }
}

function parseStations(data) {
  const result = [];
  if (!data?.countries) return result;
  
  for (const country of data.countries) {
    if (country.code && country.code.toUpperCase() !== 'RU') continue;
    for (const region of country.regions || []) {
      for (const settlement of region.settlements || []) {
        for (const station of settlement.stations || []) {
          if (station.transport_type && !['train', 'suburban'].includes(station.transport_type)) continue;
          if (station.station_type?.toLowerCase().includes('bus')) continue;
          
          const code = station.codes?.yandex_code || station.codes?.code || station.code;
          if (!code) continue;
          
          result.push({
            code,
            title: station.title || '',
            lat: station.latitude,
            lon: station.longitude,
            type: station.station_type,
          });
        }
      }
    }
  }
  return result;
}

function loadFromLocalStorage() {
  const data = storage.get('yandex_stations');
  if (!data) return null;
  const { timestamp, stations } = data;
  if (Date.now() - timestamp < CACHE.TTL) {
    return stations;
  }
  return null;
}

function saveToLocalStorage(stations) {
  storage.set('yandex_stations', {
    timestamp: Date.now(),
    stations,
  });
}

async function ensureStationsCache() {
  if (CACHE.stations) return CACHE.stations;
  
  const cached = loadFromLocalStorage();
  if (cached) {
    CACHE.stations = cached;
    CACHE.timestamp = Date.now();
    return cached;
  }
  
  try {
    const data = await apiRequest('/stations_list/', {}, 60000);
    const stations = parseStations(data);
    
    CACHE.stations = stations;
    CACHE.timestamp = Date.now();
    saveToLocalStorage(stations);
    
    return stations;
  } catch (err) {
    console.error('[API] Failed to load stations:', err.message);
    throw err;
  }
}

export async function searchStations(query, limit = 20) {
  if (!query?.trim || query.trim().length < 2) return [];
  
  try {
    const stations = await ensureStationsCache();
    const q = query.toLowerCase();
    
    return stations
      .filter(s => s.title?.toLowerCase().includes(q))
      .slice(0, limit);
  } catch (err) {
    console.error('[API] searchStations failed:', err.message);
    throw err;
  }
}

export async function getSchedule(stationCode, date = null) {
  if (!stationCode) throw new Error('Invalid station code');
  
  const params = { 
    station: stationCode,
    transport_types: 'suburban'
  };
  if (date) params.date = date;
  
  try {
    const data = await apiRequest('/schedule/', params, 15000);
    return data.schedule || [];
  } catch (err) {
    console.error('[API] getSchedule failed:', err.message);
    throw err;
  }
}

export async function searchRoutes(fromCode, toCode, date = null) {
  if (!fromCode || !toCode || fromCode === toCode) throw new Error('Invalid route');
  
  const params = { from: fromCode, to: toCode };
  if (date) params.date = date;
  
  try {
    const data = await apiRequest('/search/', params, 15000);
    return data.segments || [];
  } catch (err) {
    console.error('[API] searchRoutes failed:', err.message);
    throw err;
  }
}

export async function getAllStationsForMap() {
  try {
    const stations = await ensureStationsCache();
    return stations.filter(s => s.lat && s.lon);
  } catch (err) {
    console.error('[API] getAllStationsForMap failed:', err.message);
    throw err;
  }
}