# 🚄 Прибывалка — Расписание пригородных поездов

Веб-приложение для просмотра расписания электричек через API Яндекс.Расписаний.

---

## Возможности

- Поиск станции по названию с автокомплитом
- Выбор станции кликом по карте (OpenLayers)
- Расписание всех проходящих поездов через станцию
- Маршруты между двумя станциями с временем отправления/прибытия
- Избранное с быстрым доступом (localStorage)
- Адаптивный интерфейс для мобильных устройств

---

## Технологический стек

**Фронтенд:**
- HTML5, CSS3 (Flexbox/Grid)
- ES6+ Modules
- jQuery 3.7.1
- OpenLayers 8.2

**Бэкенд:**
- Python 3.8+
- Flask 3.0
- requests 2.31
- python-dotenv 1.0

**API:**
- Яндекс.Расписания v3.0

---

## Быстрый старт

### 1. Установка зависимостей

```bash
pip install -r requirements.txt
```

### 2. Конфигурация .env

| Переменная | Значение по умолчанию | Описание |
|------------|----------------------|----------|
| `YANDEX_API_KEY` | *(обязательно)* | API-ключ Яндекс.Расписаний |
| `FLASK_PORT` | `5000` | Порт сервера |
| `FLASK_HOST` | `0.0.0.0` | Хост сервера |
| `DEBUG_MODE` | `False` | Режим отладки Flask |
| `YANDEX_BASE_URL` | `https://api.rasp.yandex.net/v3.0` | URL API Яндекс |
| `REQUEST_TIMEOUT` | `15` | Таймаут запросов (секунды) |
| `STATIONS_LIST_TIMEOUT` | `60` | Таймаут для загрузки справочника станций |
| `DEFAULT_TRANSPORT_TYPES` | `suburban,train` | Типы транспорта |

Пример .env

```bash
# Яндекс.Расписания API
YANDEX_API_KEY=ваш_ключ_от_яндекс_кабинета

# Сервер
FLASK_PORT=5000
FLASK_HOST=0.0.0.0
DEBUG_MODE=False

# API настройки
YANDEX_BASE_URL=https://api.rasp.yandex.net/v3.0
REQUEST_TIMEOUT=15
STATIONS_LIST_TIMEOUT=60
DEFAULT_TRANSPORT_TYPES=suburban,train
```