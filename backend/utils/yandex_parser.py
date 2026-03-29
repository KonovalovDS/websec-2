"""
Парсинг ответов API Яндекс.Расписаний
"""

from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


def parse_stations_from_nested(data: dict, country_filter: Optional[str] = 'RU') -> List[Dict]:
    """
    Парсинг вложенной структуры /stations_list/
    """
    stations = []
    
    # 🔥 Отладочный лог: проверяем структуру ответа
    if not data.get('countries'):
        logger.warning(f"⚠️ No 'countries' in API response. Keys: {list(data.keys())}")
        return []
    
    for country in data.get('countries', []):
        country_code = country.get('code', '')
        
        # 🔥 Если нет кода страны — пропускаем фильтр (на всякий случай)
        if country_filter and country_code and country_code.upper() != country_filter.upper():
            continue
        
        for region in country.get('regions', []):
            for settlement in region.get('settlements', []):
                for station in settlement.get('stations', []):
                    transport_type = station.get('transport_type')
                    station_type = station.get('station_type')
                    
                    # 🔥 Более мягкий фильтр: разрешаем пустые значения
                    if transport_type and transport_type not in ('train', 'suburban'):
                        continue
                    if station_type and 'bus' in station_type.lower():
                        continue
                    
                    # 🔥 Пробуем получить код из разных полей
                    codes = station.get('codes', {})
                    code = codes.get('yandex_code') or codes.get('code') or station.get('code')
                    
                    if code:
                        stations.append({
                            'code': code,
                            'title': station.get('title', ''),
                            'lat': station.get('latitude'),
                            'lon': station.get('longitude'),
                            'type': station_type
                        })
    
    logger.info(f"🚃 Parsed {len(stations)} stations")
    return stations


def normalize_schedule_response(data: dict) -> List[Dict]:
    """Нормализация ответа /schedule/ или /search/"""
    return data.get('schedule') or data.get('segments') or []