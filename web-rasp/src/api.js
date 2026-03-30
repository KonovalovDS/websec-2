const BASE_URL = '/yandex-api';
const API_KEY = import.meta.env.VITE_YANDEX_API_KEY;

const CACHE = {
  stations: null,
  timestamp: null,
  TTL: 24 * 60 * 60 * 1000,
};

async function apiRequest(endpoint, params = {}, timeout = 15000, addTransport = true) {
  const query = new URLSearchParams({ apikey: API_KEY, format: 'json', ...params });
  
  if (addTransport && params.transport_types) {
    query.set('transport_types', Array.isArray(params.transport_types) 
      ? params.transport_types.join(',') 
      : params.transport_types);
  }
  
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}?${query}`, { signal: controller.signal });
    clearTimeout(timer);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    if (data.error) throw new Error(data.error.text || data.error.message || 'API Error');
    
    return data;
  } finally {
    clearTimeout(timer);
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
  try {
    const raw = localStorage.getItem('yandex_stations');
    if (!raw) return null;
    const { timestamp, stations } = JSON.parse(raw);
    if (Date.now() - timestamp < CACHE.TTL) {
      return stations;
    }
  } catch {}
  return null;
}

function saveToLocalStorage(stations) {
  try {
    localStorage.setItem('yandex_stations', JSON.stringify({
      timestamp: Date.now(),
      stations,
    }));
  } catch {}
}

async function ensureStationsCache() {
  if (CACHE.stations) return CACHE.stations;
  
  const cached = loadFromLocalStorage();
  if (cached) {
    CACHE.stations = cached;
    CACHE.timestamp = Date.now();
    return cached;
  }
  
  const data = await apiRequest('/stations_list/', {}, 60000, false);
  const stations = parseStations(data);
  
  CACHE.stations = stations;
  CACHE.timestamp = Date.now();
  saveToLocalStorage(stations);
  
  return stations;
}

export async function searchStations(query, limit = 20) {
  if (!query?.trim || query.trim().length < 2) return [];
  if (!API_KEY) throw new Error('API key not configured');
  
  const stations = await ensureStationsCache();
  const q = query.toLowerCase();
  
  return stations
    .filter(s => s.title?.toLowerCase().includes(q))
    .slice(0, limit);
}

export async function getSchedule(stationCode, date = null) {
  if (!stationCode) throw new Error('Invalid station code');
  if (!API_KEY) throw new Error('API key not configured');
  
  const params = { 
    station: stationCode,
    transport_types: 'suburban'
  };
  if (date) params.date = date;
  
  try {
    const data = await apiRequest('/schedule/', params, 15000, false);
    console.log('[API] getSchedule success:', data.schedule?.length || 0, 'trains');
    return data.schedule || [];
  } catch (err) {
    console.error('[API] getSchedule failed for', stationCode, ':', err.message);
    throw err;
  }
}

export async function searchRoutes(fromCode, toCode, date = null) {
  if (!fromCode || !toCode || fromCode === toCode) throw new Error('Invalid route');
  if (!API_KEY) throw new Error('API key not configured');
  
  const params = { from: fromCode, to: toCode };
  if (date) params.date = date;
  
  const data = await apiRequest('/search/', params, 15000, false);
  return data.segments || [];
}

export async function getAllStationsForMap() {
  if (!API_KEY) throw new Error('API key not configured');
  const stations = await ensureStationsCache();
  return stations.filter(s => s.lat && s.lon);
}