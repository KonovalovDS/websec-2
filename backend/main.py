"""
Flask-приложение — контроллер для API Яндекс.Расписаний
"""

import logging
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS

from config import (
    YANDEX_API_KEY,
    FLASK_PORT,
    FLASK_HOST,
    DEBUG_MODE,
    MIN_SEARCH_LENGTH
)
from services.yandex_service import YandexRaspService

logging.basicConfig(
    level=logging.DEBUG if DEBUG_MODE else logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

try:
    yandex_service = YandexRaspService(YANDEX_API_KEY)
    logger.info("✅ YandexRaspService initialized")
except Exception as e:
    logger.error(f"❌ Failed to initialize YandexRaspService: {e}")
    yandex_service = None


@app.route('/')
def index():
    """Раздаёт фронтенд (статические файлы)"""
    return app.send_static_file('index.html')


@app.route('/favicon.ico')
def favicon():
    """Заглушка для favicon — предотвращает 404 в логах"""
    return '', 204


@app.route('/api/health')
def api_health():
    """
    Эндпоинт проверки работоспособности сервера
    """
    return jsonify({'status': 'ok', 'service': 'pribivalka'})


@app.route('/api/schedule')
def api_schedule():
    """
    Эндпоинт: расписание по станции
    
    Параметры:
        station: Код станции (обязательно)
        date: Дата в формате YYYY-MM-DD (опционально)
    
    Возвращает:
        {"segments": [...]} или {"error": "..."}
    """
    if not yandex_service:
        logger.error("❌ YandexRaspService not initialized")
        return jsonify({'error': 'Сервис временно недоступен'}), 503
    
    station = request.args.get('station')
    date = request.args.get('date')
    
    if not station:
        return jsonify({'error': 'Параметр station обязателен'}), 400
    
    try:
        logger.info(f"📋 Schedule request: station={station}, date={date}")
        segments = yandex_service.get_schedule(station, date)
        return jsonify({'segments': segments})
        
    except (ValueError, ConnectionError, TimeoutError) as e:
        logger.warning(f"Schedule error: {type(e).__name__}: {e}")
        return jsonify({'error': str(e)}), 502
        
    except Exception as e:
        logger.exception(f"Unexpected error in /api/schedule")
        return jsonify({'error': 'Внутренняя ошибка сервера'}), 500


@app.route('/api/route')
def api_route():
    """
    Эндпоинт: поиск маршрута между станциями
    
    Параметры:
        from: Код станции отправления (обязательно)
        to: Код станции назначения (обязательно)
        date: Дата в формате YYYY-MM-DD (опционально)
    
    Возвращает:
        {"segments": [...]} или {"error": "..."}
    """
    if not yandex_service:
        return jsonify({'error': 'Сервис временно недоступен'}), 503
    
    from_st = request.args.get('from')
    to_st = request.args.get('to')
    
    if not from_st or not to_st:
        return jsonify({'error': 'Параметры from и to обязательны'}), 400
    
    try:
        logger.info(f"🔎 Route request: from={from_st}, to={to_st}")
        segments = yandex_service.search_route(from_st, to_st)
        return jsonify({'segments': segments})
        
    except (ValueError, ConnectionError, TimeoutError) as e:
        logger.warning(f"Route error: {type(e).__name__}: {e}")
        return jsonify({'error': str(e)}), 502
        
    except Exception as e:
        logger.exception(f"Unexpected error in /api/route")
        return jsonify({'error': 'Внутренняя ошибка сервера'}), 500


@app.route('/api/stations/search')
def api_stations_search():
    """
    Эндпоинт: поиск станций по названию
    
    Параметры:
        q: Строка поиска (минимум 2 символа)
    
    Возвращает:
        {"stations": [...]} или {"error": "..."}
    """
    if not yandex_service:
        return jsonify({'error': 'Сервис временно недоступен'}), 503
    
    query = request.args.get('q', '').strip()
    
    if len(query) < MIN_SEARCH_LENGTH:
        return jsonify({'stations': []})
    
    try:
        logger.info(f"🔍 Search request: q='{query}'")
        stations = yandex_service.search_stations_by_query(query)
        logger.info(f"📤 Returning {len(stations)} stations")
        return jsonify({'stations': stations})
        
    except (ValueError, ConnectionError, TimeoutError) as e:
        logger.warning(f"Search error: {type(e).__name__}: {e}")
        return jsonify({'error': str(e)}), 500
        
    except Exception as e:
        logger.exception(f"Unexpected error in /api/stations/search")
        return jsonify({'error': 'Внутренняя ошибка сервера'}), 500


@app.route('/api/stations/all')
def api_stations_all():
    """
    Эндпоинт: все станции для отображения на карте
    
    Возвращает:
        {"stations": [...], "count": N} или {"error": "..."}
    """
    if not yandex_service:
        return jsonify({'stations': [], 'error': 'Сервис временно недоступен'}), 503
    
    try:
        stations = yandex_service.get_all_stations_flat()
        return jsonify({'stations': stations, 'count': len(stations)})
        
    except (ValueError, ConnectionError, TimeoutError) as e:
        logger.warning(f"Stations all error: {type(e).__name__}: {e}")
        return jsonify({'stations': [], 'error': str(e)}), 502
        
    except Exception as e:
        logger.exception(f"Unexpected error in /api/stations/all")
        return jsonify({'stations': [], 'error': 'Внутренняя ошибка сервера'}), 500


# =============================================================================
# Обработчики глобальных ошибок
# =============================================================================

@app.errorhandler(404)
def not_found(e):
    logger.warning(f"404: {request.path}")
    return jsonify({'error': 'Эндпоинт не найден'}), 404


@app.errorhandler(405)
def method_not_allowed(e):
    logger.warning(f"405: {request.method} {request.path}")
    return jsonify({'error': 'Метод не поддерживается'}), 405


@app.errorhandler(500)
def internal_error(e):
    logger.exception(f"💥 Unhandled 500 error: {e}")
    return jsonify({'error': 'Внутренняя ошибка сервера'}), 500


# =============================================================================
# Точка входа
# =============================================================================

if __name__ == '__main__':
    logger.info(f"🚀 Starting server on http://{FLASK_HOST}:{FLASK_PORT}")
    logger.info(f"🔑 API key configured: {'✅' if YANDEX_API_KEY else '❌'}")
    logger.info(f"📁 Static files served from: {app.static_folder}")
    
    app.run(
        debug=DEBUG_MODE,
        port=FLASK_PORT,
        host=FLASK_HOST,
        threaded=True
    )