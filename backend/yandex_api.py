# ============================================
# Класс для работы с API Яндекс.Расписаний
# С правильным парсингом вложенной структуры
# Фильтр: только ж/д станции России
# ============================================

import requests
import logging
import urllib.parse
from typing import Optional, List, Dict

from config import (
    YANDEX_BASE_URL,
    REQUEST_TIMEOUT,
    STATIONS_LIST_TIMEOUT,
    DEFAULT_TRANSPORT_TYPE
)

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)


class YandexRaspClient:
    """
    Клиент для Яндекс.Расписаний с корректным парсингом ответов
    """
    
    def __init__(self, api_key: str):
        """Инициализация клиента"""
        self.api_key = api_key
        self.base_url = YANDEX_BASE_URL
        self.session = requests.Session()
        self.session.params = {'apikey': api_key, 'format': 'json'}
        logger.info(f"✅ YandexRaspClient инициализирован: {self.base_url}")
    
    def _make_request(
        self,
        endpoint: str,
        params: dict,
        timeout: int = REQUEST_TIMEOUT,
        add_transport_type: bool = True
    ) -> dict:
        """Внутренний метод для выполнения запросов"""
        if add_transport_type:
            params['transport_types'] = DEFAULT_TRANSPORT_TYPE
        
        # Формируем полный URL для отладки
        query_string = urllib.parse.urlencode(params)
        full_url = f"{self.base_url}{endpoint}?{query_string}"
        
        # Выводим полный запрос в консоль
        print(f"\n🔗🔗🔗 ЗАПРОС: {full_url}\n" + "="*60 + "\n")
        logger.info(f"🌐 GET {endpoint} ? {params}")
        
        try:
            response = self.session.get(
                f"{self.base_url}{endpoint}",
                params=params,
                timeout=timeout
            )
            response.raise_for_status()
            data = response.json()
            
            if 'error' in data:
                logger.error(f"❌ API Error: {data['error']}")
                raise ValueError(f"API Error: {data['error']}")
            
            logger.info(f"✅ OK")
            return data
            
        except requests.exceptions.Timeout:
            logger.error(f"⏰ Timeout > {timeout}s")
            raise
        except requests.exceptions.ConnectionError:
            logger.error(f"🔌 Connection Error")
            raise
        except Exception as e:
            logger.error(f"💥 Error: {type(e).__name__}: {e}")
            raise
    
    def get_schedule(self, station_code: str, date: Optional[str] = None) -> dict:
        """Получить расписание по станции (только электрички)"""
        params = {
            'station': station_code,
            'transport_types': 'suburban'
        }
        if date:
            params['date'] = date
        return self._make_request('/schedule/', params, add_transport_type=False)
    
    def search_route(self, from_code: str, to_code: str, date: Optional[str] = None) -> dict:
        """Поиск маршрута между станциями (только электрички)"""
        params = {
            'from': from_code,
            'to': to_code,
            'transport_types': 'suburban'
        }
        if date:
            params['date'] = date
        return self._make_request('/search/', params, add_transport_type=False)
    
    def get_stations_list(self) -> dict:
        """Получить список всех станций (без transport_types)"""
        logger.info(f"🔍 Запрос /stations_list/")
        return self._make_request(
            '/stations_list/',
            params={},
            timeout=STATIONS_LIST_TIMEOUT,
            add_transport_type=False
        )
    
    def _parse_stations_from_nested(self, data: dict) -> List[Dict]:
        """
        Парсинг вложенной структуры станций
        🔥 Фильтр: только ж/д станции РОССИИ
        
        ⚠️ ВАЖНО: параметр 'data: dict' — не пропустите двоеточие!
        """
        stations = []
        
        for country in data.get('countries', []):
            # 🔥 Фильтр по коду страны (надёжнее имени)
            country_code = country.get('code', '')
            if country_code and country_code.upper() != 'RU':
                continue
            
            for region in country.get('regions', []):
                for settlement in region.get('settlements', []):
                    for station in settlement.get('stations', []):
                        # 🔥 Фильтр по типу транспорта (только ж/д)
                        transport_type = station.get('transport_type')
                        station_type = station.get('station_type')
                        
                        if transport_type not in ('train', 'suburban', None):
                            continue
                        if station_type and 'bus' in station_type.lower():
                            continue
                        
                        code = station.get('codes', {}).get('yandex_code')
                        if code:
                            stations.append({
                                'code': code,
                                'title': station.get('title', ''),
                                'lat': station.get('latitude'),
                                'lon': station.get('longitude'),
                                'type': station_type
                            })
        
        logger.info(f"🚃 Найдено ж/д станций России: {len(stations)}")
        return stations
    
    def search_stations_by_query(self, query: str) -> List[Dict]:
        """Поиск станций по названию (только РФ, только ж/д)"""
        logger.info(f"🔍 Поиск станций: '{query}'")
        
        if len(query) < 2:
            return []
        
        try:
            data = self.get_stations_list()
            all_stations = self._parse_stations_from_nested(data)
            
            if not all_stations:
                logger.warning(f"⚠️ Список станций пуст")
                return []
            
            # Фильтрация по названию
            q = query.lower()
            results = [
                s for s in all_stations
                if s['title'] and q in s['title'].lower()
            ]
            
            logger.info(f"✅ Найдено {len(results)} станций по запросу '{query}'")
            return results[:20]
            
        except Exception as e:
            logger.error(f"❌ Ошибка поиска: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def get_all_stations_flat(self) -> List[Dict]:
        """Получить плоский список всех станций для карты"""
        try:
            data = self.get_stations_list()
            stations = self._parse_stations_from_nested(data)
            return [s for s in stations if s.get('lat') and s.get('lon')]
        except Exception as e:
            logger.error(f"❌ Ошибка: {e}")
            return []