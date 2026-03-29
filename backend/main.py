# ============================================
# Flask-приложение — прокси-сервер для API
# ============================================

from flask import Flask, request, jsonify
from flask_cors import CORS

from config import (
    YANDEX_API_KEY,
    FLASK_PORT,
    FLASK_HOST,
    DEBUG_MODE,
    MIN_SEARCH_LENGTH
)
from yandex_api import YandexRaspClient

# Инициализация приложения
app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# Инициализация клиента API
yandex_client = YandexRaspClient(YANDEX_API_KEY)


@app.route('/')
def index():
    """Раздаёт фронтенд"""
    return app.send_static_file('index.html')


@app.route('/api/health')
def api_health():   
    """Проверка работоспособности сервера"""
    return jsonify({'status': 'ok', 'service': 'pribivalka'})


@app.route('/api/schedule')
def api_schedule():
    """
    Эндпоинт: расписание по станции
    
    Параметры:
        station: Код станции (обязательно)
        date: Дата YYYY-MM-DD (опционально)
    """
    station = request.args.get('station')
    date = request.args.get('date')
    
    if not station:
        return jsonify({'error': 'Параметр station обязателен'}), 400
    
    try:
        data = yandex_client.get_schedule(station, date)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': f'Ошибка загрузки расписания: {str(e)}'}), 502


@app.route('/api/route')
def api_route():
    """
    Эндпоинт: маршрут между станциями
    
    Параметры:
        from: Код станции отправления (обязательно)
        to: Код станции назначения (обязательно)
    """
    from_st = request.args.get('from')
    to_st = request.args.get('to')
    
    if not from_st or not to_st:
        return jsonify({'error': 'Параметры from и to обязательны'}), 400
    
    try:
        data = yandex_client.search_route(from_st, to_st)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': f'Ошибка поиска маршрута: {str(e)}'}), 502


@app.route('/api/stations/search')
def api_stations_search():
    """
    Эндпоинт: поиск станций по названию
    
    Параметры:
        q: Строка поиска (минимум 2 символа)
    """
    query = request.args.get('q', '').strip()
    
    if len(query) < MIN_SEARCH_LENGTH:
        return jsonify({'stations': []})
    
    try:
        stations = yandex_client.search_stations_by_query(query)
        return jsonify({'stations': stations})
    except Exception as e:
        return jsonify({'error': f'Ошибка поиска: {str(e)}'}), 500


@app.route('/api/stations/all')
def api_stations_all():
    """
    Эндпоинт: все станции для карты
    """
    try:
        stations = yandex_client.get_all_stations_flat()
        return jsonify({
            'stations': stations,
            'count': len(stations),
            'source': 'api'
        })
    except Exception as e:
        return jsonify({'stations': [], 'error': str(e)}), 500


# Обработчик ошибок 404
@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Эндпоинт не найден'}), 404


# Обработчик ошибок 500
@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Внутренняя ошибка сервера'}), 500


if __name__ == '__main__':
    print(f"\n🚀 Прибывалка — сервер запущен: http://localhost:{FLASK_PORT}")
    print(f"📋 API ключ настроен: {'✅' if YANDEX_API_KEY != 'YOUR_YANDEX_API_KEY_HERE' else '❌'}")
    print(f"💡 Для остановки: Ctrl+C\n")
    
    app.run(
        debug=DEBUG_MODE,
        port=FLASK_PORT,
        host=FLASK_HOST,
        threaded=True
    )