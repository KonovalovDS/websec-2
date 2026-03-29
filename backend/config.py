"""
Конфигурация приложения
Загружает настройки из .env файла
"""

import os
from dotenv import load_dotenv

# Загружаем переменные из .env
load_dotenv()

# 🔐 API Яндекс.Расписаний
YANDEX_API_KEY = os.getenv('YANDEX_API_KEY', '')
if not YANDEX_API_KEY:
    raise ValueError('YANDEX_API_KEY not set in .env')

YANDEX_BASE_URL = os.getenv('YANDEX_BASE_URL', 'https://api.rasp.yandex.net/v3.0')

# ⏱️ Таймауты
REQUEST_TIMEOUT = int(os.getenv('REQUEST_TIMEOUT', '15'))
STATIONS_LIST_TIMEOUT = int(os.getenv('STATIONS_LIST_TIMEOUT', '60'))

# 🚃 Транспорт
DEFAULT_TRANSPORT_TYPES = os.getenv('DEFAULT_TRANSPORT_TYPES', 'suburban,train').split(',')

# 🖥️ Сервер
FLASK_PORT = int(os.getenv('FLASK_PORT', '5000'))
FLASK_HOST = os.getenv('FLASK_HOST', '0.0.0.0')
DEBUG_MODE = os.getenv('DEBUG_MODE', 'False').lower() == 'true'

# 🔍 Поиск
MIN_SEARCH_LENGTH = 2
MAX_SEARCH_RESULTS = 20