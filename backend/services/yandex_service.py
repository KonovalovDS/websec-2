"""
Сервис для работы с API Яндекс.Расписаний
Отвечает за бизнес-логику и парсинг данных
"""

import logging
from typing import Optional, List, Dict

import requests

from config import (
    YANDEX_BASE_URL,
    REQUEST_TIMEOUT,
    STATIONS_LIST_TIMEOUT,
    DEFAULT_TRANSPORT_TYPES
)
from utils.yandex_parser import parse_stations_from_nested, normalize_schedule_response

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)


class YandexRaspService:
    """Сервис для Яндекс.Расписаний"""
    
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError('YANDEX_API_KEY is required')
        
        self.api_key = api_key
        self.base_url = YANDEX_BASE_URL
        self.session = requests.Session()
        self.session.params = {'apikey': api_key, 'format': 'json'}
        logger.info(f"YandexRaspService initialized: {self.base_url}")
    
    def _make_request(
        self,
        endpoint: str,
        params: dict,
        timeout: int = REQUEST_TIMEOUT,
        add_transport_types: bool = True
    ) -> dict:
        """Внутренний метод для выполнения запросов"""
        if add_transport_types:
            params['transport_types'] = ','.join(DEFAULT_TRANSPORT_TYPES)
        
        try:
            response = self.session.get(
                f"{self.base_url}{endpoint}",
                params=params,
                timeout=timeout
            )
            response.raise_for_status()
            data = response.json()
            
            if 'error' in data:
                logger.error(f"API Error: {data['error']}")
                raise ValueError(data['error'])
            
            return data
            
        except requests.exceptions.Timeout:
            logger.error(f"Timeout > {timeout}s for {endpoint}")
            raise
        except requests.exceptions.ConnectionError:
            logger.error(f"Connection error for {endpoint}")
            raise
        except Exception as e:
            logger.error(f"Request error: {type(e).__name__}: {e}")
            raise
    
    def get_schedule(self, station_code: str, date: Optional[str] = None) -> List[Dict]:
        """Получить расписание по станции (только suburban)"""
        params = {
            'station': station_code,
            'transport_types': 'suburban'
        }
        if date:
            params['date'] = date
        
        data = self._make_request('/schedule/', params, add_transport_types=False)
        return normalize_schedule_response(data)
    
    def search_route(self, from_code: str, to_code: str, date: Optional[str] = None) -> List[Dict]:
        """Поиск маршрута между станциями (только suburban)"""
        params = {
            'from': from_code,
            'to': to_code,
            'transport_types': 'suburban'
        }
        if date:
            params['date'] = date
        
        data = self._make_request('/search/', params, add_transport_types=False)
        return normalize_schedule_response(data)
    
    def get_stations_list(self) -> dict:
        """Получить список всех станций (без transport_types)"""
        return self._make_request(
            '/stations_list/',
            params={},
            timeout=STATIONS_LIST_TIMEOUT,
            add_transport_types=False
        )
    
    def search_stations_by_query(self, query: str, limit: int = 20) -> List[Dict]:
        """Поиск станций по названию"""
        logger.info(f"🔍 Search query: '{query}'")
        
        if len(query) < 2:
            return []
        
        try:
            data = self.get_stations_list()
            
            # 🔥 Лог: проверяем что пришло от API
            if not data:
                logger.error("❌ Empty response from /stations_list/")
                return []
            
            all_stations = parse_stations_from_nested(data, country_filter='RU')
            logger.info(f"📦 Loaded {len(all_stations)} stations from cache")
            
            if not all_stations:
                logger.warning("⚠️ No stations after parsing — check API response structure")
                return []
            
            # Фильтрация по названию
            q = query.lower()
            results = [
                s for s in all_stations
                if s.get('title') and q in s['title'].lower()
            ]
            
            logger.info(f"✅ Found {len(results)} stations for '{query}'")
            return results[:limit]
                
        except Exception as e:
            logger.error(f"❌ Search error: {type(e).__name__}: {e}")
            import traceback
            logger.debug(traceback.format_exc())
            return []
    
    def get_all_stations_flat(self) -> List[Dict]:
        """Получить плоский список всех станций для карты"""
        try:
            data = self.get_stations_list()
            stations = parse_stations_from_nested(data, country_filter='RU')
            return [s for s in stations if s.get('lat') and s.get('lon')]
        except Exception as e:
            logger.error(f"Error loading stations: {e}")
            return []