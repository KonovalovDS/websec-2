// ============================================
// Главный модуль приложения — точка входа
// ============================================

import { api } from './api_client.js';
import { StationMap } from './map.js';
import { StationSearch } from './search.js';
import { FavoritesManager } from './favorites.js';

console.log('🚀 app.js — точка входа');

$(document).ready(() => {
    console.log('✅ DOM готов, инициализация...');
    
    const favorites = new FavoritesManager();
    
    // Основной поиск станции
    const search = new StationSearch(
        '#station-input', '#search-results',
        (station) => {
            console.log('🔄 Callback: станция выбрана', station);
            _loadStationDirections(station);
            if (station.lat && station.lon && map) {
                map.centerOnStation(station.lat, station.lon);
            }
        }
    );
    
    // Поиск для поля "Откуда" (маршруты)
    const fromSearch = new StationSearch(
        '#from-input', '#from-results',
        (station) => {
            console.log('✅ Выбрана станция отправления:', station.title);
        }
    );
    
    // Поиск для поля "Куда" (маршруты)
    const toSearch = new StationSearch(
        '#to-input', '#to-results',
        (station) => {
            console.log('✅ Выбрана станция назначения:', station.title);
        }
    );
    
    // Карта
    let map = null;
    const $mapSection = $('#map-section');
    
    // Показать карту
    $('#map-toggle-btn').on('click', async () => {
        $mapSection.removeClass('hidden');
        
        if (!map) {
            map = new StationMap('map', (station) => {
                $('#station-input').val(station.title);
                _loadStationDirections(station);
            });
            map.init();
            console.log('🗺️ Карта инициализирована');
        }
        
        try {
            const result = await api.getAllStations();
            map.showStations(result.stations || []);
            console.log(`📍 Показано станций на карте: ${result.stations?.length || 0}`);
        } catch (e) {
            console.error('Ошибка загрузки станций на карту:', e);
        }
    });
    
    // Закрыть карту
    $('#map-close-btn').on('click', () => {
        $mapSection.addClass('hidden');
    });
    
    // Поиск маршрута
    $('#route-btn').on('click', async () => {
        const from = fromSearch.getSelected();
        const to = toSearch.getSelected();
        
        console.log('🔍 Поиск маршрута:', { from, to });
        
        if (!from) {
            alert('Выберите станцию отправления из списка');
            return;
        }
        if (!to) {
            alert('Выберите станцию назначения из списка');
            return;
        }
        if (from.code === to.code) {
            alert('Станции не должны совпадать');
            return;
        }
        
        await _loadRouteResults(from, to);
    });
    
    // Кнопка "Найти" для основного поиска
    $('#search-btn').on('click', () => {
        const station = search.getSelected();
        if (station) {
            _loadStationDirections(station);
        } else {
            alert('Выберите станцию из списка');
        }
    });
    
    // Избранное (для быстрого поиска)
    function _renderFavorites() {
        favorites.renderToList(
            $('#favorites-list'),
            (station) => {
                $('#station-input').val(station.title);
                _loadStationDirections(station);
            }
        );
    }
    
    // 🔥 Загрузка направлений станции (под поиском)
    async function _loadStationDirections(station) {
        console.log('🧭 Загрузка направлений:', station);
        
        const $container = $('#directions-container');
        $container.empty().addClass('hidden');
        
        try {
            console.log('📡 Запрос к API: /api/schedule?station=' + station.code);
            const data = await api.getSchedule(station.code);
            
            // 🔥 Используем data.schedule вместо data.segments
            const segments = data.schedule || [];
            
            console.log('📥 Получено рейсов:', segments.length);
            
            if (!segments.length) {
                $container.html(`
                    <p class="no-results">
                        Нет рейсов на сегодня.<br>
                        <small>Попробуйте выбрать другую станцию или день</small>
                    </p>
                `).removeClass('hidden');
                return;
            }
            
            // Группировка по направлениям
            const directionsMap = new Map();
            segments.forEach((seg) => {
                const direction = seg.direction || '';
                
                // 🔥 ФИЛЬТР: убираем "прибытие" и пустые направления
                if (!direction || direction.toLowerCase() === 'прибытие') {
                    return;
                }
                
                const count = directionsMap.get(direction) || 0;
                directionsMap.set(direction, count + 1);
            });
            
            const directions = Array.from(directionsMap.entries())
                .map(([direction, count]) => ({ direction, count }))
                .sort((a, b) => b.count - a.count);
            
            console.log('🧭 Направления (без прибытия):', directions);
            
            if (!directions.length) {
                $container.html(`
                    <p class="no-results">
                        Нет направлений отправления.<br>
                        <small>Только прибытие поездов</small>
                    </p>
                `).removeClass('hidden');
                return;
            }
            
            // Отрисовка
            let html = `
                <h3 class="directions-title">🧭 Направления (${directions.length})</h3>
            `;
            
            html += directions.map((item) => `
                <div class="direction-item" data-direction="${_esc(item.direction)}">
                    <span class="direction-name">${_esc(item.direction)}</span>
                    <span class="direction-count">${item.count} ${_declension(item.count, 'рейс', 'рейса', 'рейсов')}</span>
                    <span class="direction-arrow">→</span>
                </div>
            `).join('');
            
            $container.html(html).removeClass('hidden');
            
            // Обработчик клика по направлению
            $container.find('.direction-item').on('click', (e) => {
                const direction = $(e.currentTarget).data('direction');
                console.log('🖱️ Клик по направлению:', direction);
                _showDirectionSchedule(station, direction, segments);
            });
            
        } catch (e) {
            console.error('❌ Ошибка загрузки направлений:', e);
            $container.html('<p class="error">Ошибка: ' + e.message + '</p>').removeClass('hidden');
        }
    }
    
    // 🔥 Показать расписание по направлению
    function _showDirectionSchedule(station, direction, allSegments) {
        console.log('📋 Показ направления:', direction);
        
        const $container = $('#directions-container');
        
        // 🔥 Фильтруем по направлению
        const filtered = allSegments.filter(seg => {
            const segDirection = seg.direction || '';
            return segDirection === direction && segDirection.toLowerCase() !== 'прибытие';
        });
        
        let html = `
            <h3 class="directions-title">
                <button class="btn btn-secondary" id="back-to-directions" type="button" style="font-size:0.8rem;padding:0.25rem 0.5rem;">
                    ← Назад
                </button>
                ${_esc(direction)}
            </h3>
        `;
        
        html += filtered.map((seg) => {
            const depTime = seg.departure || '??:??';
            
            return `
                <div class="direction-item" style="cursor:default;">
                    <span class="direction-name">
                        <strong>${_fmtTime(depTime)}</strong>
                    </span>
                    <span class="direction-count">${_esc(seg.days || '')}</span>
                </div>
            `;
        }).join('');
        
        $container.html(html);
        
        $('#back-to-directions').on('click', () => {
            _loadStationDirections(station);
        });
    }
    
    // 🔥 Загрузка результатов маршрута — С ВРЕМЕНЕМ ПРИБЫТИЯ
    async function _loadRouteResults(from, to) {
        console.log('🔎 Загрузка маршрута:', { from, to });
        
        const $container = $('#route-results');
        $container.empty();
        $container.html('<p class="loading">⏳ Загрузка маршрута...</p>');
        
        try {
            const data = await api.searchRoute(from.code, to.code);
            const segments = data.schedule || data.segments || [];
            
            console.log('📥 Получено маршрутов:', segments.length);
            
            if (!segments.length) {
                $container.html(`
                    <div class="no-results">
                        <p>😕 Маршруты не найдены</p>
                        <small>
                            Между этими станциями нет прямого пригородного сообщения.<br>
                            Попробуйте: Москва → Подольск
                        </small>
                    </div>
                `);
                return;
            }
            
            // Заголовок маршрута
            let html = `
                <h3 class="directions-title">
                    🚃 ${_esc(from.title)} → ${_esc(to.title)} (${segments.length} рейсов)
                </h3>
            `;
            
            // 🔥 Список рейсов — ТЕПЕРЬ С ВРЕМЕНЕМ ОТПРАВЛЕНИЯ И ПРИБЫТИЯ
            html += segments.slice(0, 20).map((seg) => {
                const depTime = seg.departure || '??:??';
                const arrTime = seg.arrival || '??:??';
                
                return `
                    <div class="schedule-item">
                        <span class="schedule-time">
                            <strong>${_fmtTime(depTime)}</strong> → ${_fmtTime(arrTime)}
                        </span>
                        <div class="schedule-info">
                            <div class="train-name">${_esc(seg.thread?.short_title || seg.thread?.name || 'Электричка')}</div>
                            <div class="route">${_esc(seg.days || '')}</div>
                        </div>
                    </div>
                `;
            }).join('');
            
            $container.html(html);
            
        } catch (e) {
            console.error('❌ Ошибка загрузки маршрута:', e);
            $container.html('<p class="error">Ошибка: ' + e.message + '</p>');
        }
    }
    
    // ============================================
    // Вспомогательные функции
    // ============================================
    
    function _esc(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }
    
    function _fmtTime(timeStr) {
        if (!timeStr) return '??:??';
        if (typeof timeStr === 'string' && timeStr.includes('T')) {
            return timeStr.split('T')[1]?.substring(0, 5) || timeStr;
        }
        if (typeof timeStr === 'string' && timeStr.includes(':')) {
            return timeStr.substring(0, 5);
        }
        return String(timeStr).substring(0, 5) || '??:??';
    }
    
    function _declension(number, one, two, five) {
        const n = number % 100;
        const n1 = n % 10;
        if (n > 10 && n < 20) return five;
        if (n1 > 1 && n1 < 5) return two;
        if (n1 === 1) return one;
        return five;
    }
    
    // Проверка сервера
    api.healthCheck()
        .then((data) => {
            console.log('✅ Сервер работает:', data.status);
        })
        .catch((e) => {
            console.warn('⚠️ Сервер недоступен:', e.message);
        });
    
    _renderFavorites();
    console.log('🚄 Прибывалка готова к работе!');
});