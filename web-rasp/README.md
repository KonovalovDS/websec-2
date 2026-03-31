#  Приложение для поиска станций и расписания пригородных поездов.

---

## Функции

- Поиск станции по названию с автокомплитом и подсветкой совпадений
- Интерактивная карта с кластеризацией — выбор станции кликом (OpenLayers)
- Расписание станции — отправление и прибытие пригородных поездов
- Маршруты между станциями — время, длительность, остановки, платформа
- Избранное — быстрый доступ к станциям и маршрутам

---

## Технологический стек

**Фронтенд:**
- React
- OpenLayers

**Бэкенд:**
- Python
- Flask

**API:**
- Яндекс.Расписания v3.0

---

## Быстрый старт

### 1. Настройка бэкенда и конфигурация .env

```bash
pip install -r requirements.txt
```

Пример .env

```bash
YANDEX_API_KEY=<КЛЮЧ>
YANDEX_API_BASE=https://api.rasp.yandex.net/v3.0

FLASK_PORT=5000
FLASK_DEBUG=True
FLASK_HOST=0.0.0.0

FRONTEND_URL=http://localhost:5173

CACHE_ENABLED=True
CACHE_TTL_STATIONS=86400
CACHE_TTL_SCHEDULE=600
CACHE_TTL_ROUTES=600
```

### 2. Настройка фронтэнда и конфигурация .env

Пример .env

```bash
VITE_API_BASE=http://localhost:5000/api

VITE_CACHE_TTL_STATIONS=86400000
```

### 3. Запуск

#### Терминал 1: Бэкенд

```bash
cd backend
python app.py
```

#### Терминал 2: Фронтенд

```bash
cd cd client
npm run dev
```