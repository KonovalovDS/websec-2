"""
Flask-приложение — контроллер для API
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

# 🔥 ИНИЦИАЛИЗАЦИЯ ЛОГГЕРА — ОБЯЗАТЕЛЬНО ДО ИСПОЛЬЗОВАНИЯ
logging.basicConfig(
    level=logging.DEBUG if DEBUG_MODE else logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# Инициализация приложения
app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# Инициализация сервиса
try:
    yandex_service = YandexRaspService(YANDEX_API_KEY)
    logger.info("✅ YandexRaspService initialized")
except Exception as e:
    logger.error(f"❌ Failed to initialize YandexRaspService: {e}")
    yandex_service = None


@app.route('/')
def index():
    """Раздаёт фронтенд"""
    return app.send_static_file('index.html')


@app.route('/favicon.ico')
def favicon():
    """Заглушка для favicon"""
    return '', 204


@app.route('/api/health')
def api_health():
    """Проверка работоспособности"""
    return jsonify({'status': 'ok', 'service': 'pribivalka'})


@app.route('/api/schedule')
def api_schedule():
    """Расписание по станции"""
    if not yandex_service:
        return jsonify({'error': 'Сервис не инициализирован'}), 503
    
    station = request.args.get('station')
    date = request.args.get('date')
    
    if not station:
        return jsonify({'error': 'Параметр station обязателен'}), 400
    
    try:
        logger.info(f"📋 Schedule request: station={station}, date={date}")
        segments = yandex_service.get_schedule(station, date)
        return jsonify({'segments': segments})
    except Exception as e:
        logger.error(f"❌ Schedule error: {type(e).__name__}: {e}")
        logger.debug(traceback.format_exc())
        return jsonify({'error': f'Ошибка: {str(e)}'}), 502


@app.route('/api/route')
def api_route():
    """Маршрут между станциями"""
    if not yandex_service:
        return jsonify({'error': 'Сервис не инициализирован'}), 503
    
    from_st = request.args.get('from')
    to_st = request.args.get('to')
    
    if not from_st or not to_st:
        return jsonify({'error': 'Параметры from и to обязательны'}), 400
    
    try:
        logger.info(f"🔎 Route request: from={from_st}, to={to_st}")
        segments = yandex_service.search_route(from_st, to_st)
        return jsonify({'segments': segments})
    except Exception as e:
        logger.error(f"❌ Route error: {type(e).__name__}: {e}")
        logger.debug(traceback.format_exc())
        return jsonify({'error': f'Ошибка: {str(e)}'}), 502


@app.route('/api/stations/search')
def api_stations_search():
    """Поиск станций по названию"""
    if not yandex_service:
        return jsonify({'error': 'Сервис не инициализирован'}), 503
    
    query = request.args.get('q', '').strip()
    
    if len(query) < MIN_SEARCH_LENGTH:
        return jsonify({'stations': []})
    
    try:
        logger.info(f"🔍 Search request: q='{query}'")
        stations = yandex_service.search_stations_by_query(query)
        logger.info(f"📤 Returning {len(stations)} stations")
        return jsonify({'stations': stations})
    except Exception as e:
        logger.error(f"❌ Search error: {type(e).__name__}: {e}")
        logger.debug(traceback.format_exc())
        return jsonify({'error': f'Ошибка поиска: {str(e)}'}), 500


@app.route('/api/stations/all')
def api_stations_all():
    """Все станции для карты"""
    if not yandex_service:
        return jsonify({'stations': [], 'error': 'Сервис не инициализирован'}), 503
    
    try:
        stations = yandex_service.get_all_stations_flat()
        return jsonify({'stations': stations, 'count': len(stations)})
    except Exception as e:
        logger.error(f"❌ Stations all error: {type(e).__name__}: {e}")
        logger.debug(traceback.format_exc())
        return jsonify({'stations': [], 'error': str(e)}), 500


@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Эндпоинт не найден'}), 404


@app.errorhandler(500)
def internal_error(e):
    logger.exception(f"💥 Unhandled 500 error: {e}")
    return jsonify({'error': 'Внутренняя ошибка сервера'}), 500


if __name__ == '__main__':
    logger.info(f"🚀 Starting server on http://{FLASK_HOST}:{FLASK_PORT}")
    logger.info(f"🔑 API key configured: {'✅' if YANDEX_API_KEY else '❌'}")
    app.run(debug=DEBUG_MODE, port=FLASK_PORT, host=FLASK_HOST, threaded=True)