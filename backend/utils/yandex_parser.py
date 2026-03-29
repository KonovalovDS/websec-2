"""
Парсинг ответов API Яндекс.Расписаний
"""

from typing import List, Dict, Optional


def parse_stations_from_nested(data: dict, country_filter: Optional[str] = 'RU') -> List[Dict]:
    """
    Парсинг вложенной структуры /stations_list/
    
    Args:
        data: Сырой ответ API
        country_filter: Код страны для фильтрации (None = все страны)
    
    Returns:
        Список станций с нормализованными полями
    """
    stations = []
    
    for country in data.get('countries', []):
        # Фильтр по стране
        country_code = country.get('code', '')
        if country_filter and country_code and country_code.upper() != country_filter.upper():
            continue
        
        for region in country.get('regions', []):
            for settlement in region.get('settlements', []):
                for station in settlement.get('stations', []):
                    # Фильтр по типу транспорта (только ж/д)
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
    
    return stations


def normalize_schedule_response(data: dict) -> List[Dict]:
    """
    Нормализация ответа /schedule/ или /search/
    
    API может возвращать данные в поле 'schedule' или 'segments'
    """
    return data.get('schedule') or data.get('segments') or []