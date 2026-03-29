"""
Вспомогательные функции для бэкенда
"""

import html


def escape_html(text: str) -> str:
    """Экранирование HTML-символов"""
    if not text:
        return ''
    return html.escape(str(text))


def format_time(time_str: str) -> str:
    """
    Форматирование времени из API
    
    Поддерживает форматы:
    - "2026-03-29T14:30:00+03:00" → "14:30"
    - "14:30:00" → "14:30"
    - "14:30" → "14:30"
    """
    if not time_str:
        return '??:??'
    
    # ISO-формат с датой
    if 'T' in time_str:
        time_part = time_str.split('T')[1]
        if time_part:
            return time_part[:5]
    
    # Просто время
    if ':' in time_str:
        return time_str[:5]
    
    return str(time_str)[:5] or '??:??'


def declension_russian(number: int, one: str, two: str, five: str) -> str:
    """Склонение русских слов: 1 рейс, 2 рейса, 5 рейсов"""
    n = number % 100
    n1 = n % 10
    
    if 10 < n < 20:
        return five
    if 1 < n1 < 5:
        return two
    if n1 == 1:
        return one
    return five