import os
import time
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from functools import wraps

load_dotenv()

app = Flask(__name__)

frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
CORS(app, resources={r"/api/*": {"origins": frontend_url}})

API_KEY = os.getenv('YANDEX_API_KEY')
BASE_URL = os.getenv('YANDEX_API_BASE', 'https://api.rasp.yandex.net/v3.0')

CACHE_ENABLED = os.getenv('CACHE_ENABLED', 'True') == 'True'
CACHE_TTL_STATIONS = int(os.getenv('CACHE_TTL_STATIONS', 86400))
CACHE_TTL_SCHEDULE = int(os.getenv('CACHE_TTL_SCHEDULE', 600))
CACHE_TTL_ROUTES = int(os.getenv('CACHE_TTL_ROUTES', 600))

if not API_KEY:
    raise ValueError('YANDEX_API_KEY not configured')

cache = {}

def cached(ttl):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            if not CACHE_ENABLED:
                return f(*args, **kwargs)
            
            key = f"{f.__name__}:{request.query_string.decode()}"
            now = time.time()
            
            if key in cache:
                data, timestamp = cache[key]
                if now - timestamp < ttl:
                    return jsonify(data)
            
            response = f(*args, **kwargs)
            if response[1] == 200:
                cache[key] = (response[0].get_json(), now)
            
            return response
        return wrapped
    return decorator

@app.route('/api/search/', methods=['GET'])
@cached(CACHE_TTL_ROUTES)
def search():
    try:
        params = {
            'apikey': API_KEY,
            'format': 'json',
            **request.args.to_dict()
        }
        response = requests.get(f'{BASE_URL}/search/', params=params, timeout=15)
        response.raise_for_status()
        return jsonify(response.json()), 200
    except requests.exceptions.Timeout:
        return jsonify({'error': 'Timeout'}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/schedule/', methods=['GET'])
@cached(CACHE_TTL_SCHEDULE)
def schedule():
    try:
        params = {
            'apikey': API_KEY,
            'format': 'json',
            **request.args.to_dict()
        }
        response = requests.get(f'{BASE_URL}/schedule/', params=params, timeout=15)
        response.raise_for_status()
        return jsonify(response.json()), 200
    except requests.exceptions.Timeout:
        return jsonify({'error': 'Timeout'}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stations_list/', methods=['GET'])
@cached(CACHE_TTL_STATIONS)
def stations_list():
    try:
        params = {
            'apikey': API_KEY,
            'format': 'json',
            'lang': 'ru_RU'
        }
        response = requests.get(f'{BASE_URL}/stations_list/', params=params, timeout=60)
        response.raise_for_status()
        return jsonify(response.json()), 200
    except requests.exceptions.Timeout:
        return jsonify({'error': 'Timeout'}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True') == 'True'
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    app.run(host=host, port=port, debug=debug)