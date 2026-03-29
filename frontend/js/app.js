// ============================================
// Главный модуль приложения — точка входа
// ============================================

import { api } from './api_client.js';
import { StationMap } from './map.js';
import { StationSearch } from './search.js';
import { FavoritesManager } from './favorites.js';

$(document).ready(() => {
    const favorites = new FavoritesManager();
    
    // 🔥 Текущие выбранные станции
    let currentStation = null;
    let currentFromStation = null;
    let currentToStation = null;
    
    // Основной поиск станции
    const search = new StationSearch(
        '#station-input', '#search-results',
        (station) => {
            currentStation = station;
            _loadStationDirections(station);
            _updateFavButton($('#fav-add-btn'), station);
            if (station.lat && station.lon && map) {
                map.centerOnStation(station.lat, station.lon);
            }
        }
    );
    
    // Поиск для поля "Откуда" (маршруты)
    const fromSearch = new StationSearch(
        '#from-input', '#from-results',
        (station) => {
            currentFromStation = station;
            _updateRouteFavButtons();
        }
    );
    
    // Поиск для поля "Куда" (маршруты)
    const toSearch = new StationSearch(
        '#to-input', '#to-results',
        (station) => {
            currentToStation = station;
            _updateRouteFavButtons();
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
                currentStation = station;
                _loadStationDirections(station);
                _updateFavButton($('#fav-add-btn'), station);
            });
            map.init();
        }
        
        try {
            const result = await api.getAllStations();
            map.showStations(result.stations || []);
        } catch (e) {
            console.error('Ошибка загрузки станций на карту:', e);
        }
    });
    
    // Закрыть карту
    $('#map-close-btn').on('click', () => {
        $mapSection.addClass('hidden');
    });
    
    // 🔥 Кнопка избранного для поиска
    $('#fav-add-btn').on('click', () => {
        if (currentStation) {
            _toggleFavorite(currentStation);
        }
    });
    
    // 🔥 Кнопки избранного для маршрута
    $('#fav-from-btn').on('click', () => {
        if (currentFromStation) {
            _toggleFavorite(currentFromStation);
        }
    });
    
    $('#fav-to-btn').on('click', () => {
        if (currentToStation) {
            _toggleFavorite(currentToStation);
        }
    });
    
    // Поиск маршрута
    $('#route-btn').on('click', async () => {
        const from = fromSearch.getSelected();
        const to = toSearch.getSelected();
        
        if (!from) { alert('Выберите станцию отправления из списка'); return; }
        if (!to) { alert('Выберите станцию назначения из списка'); return; }
        if (from.code === to.code) { alert('Станции не должны совпадать'); return; }
        
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
    
    // Избранное — 🔥 ДОБАВЛЕНО: onRemove callback
    function _renderFavorites() {
        favorites.renderToList(
            $('#favorites-list'),
            (station) => {
                $('#station-input').val(station.title);
                currentStation = station;
                _loadStationDirections(station);
                _updateFavButton($('#fav-add-btn'), station);
            },
            // 🔥 НОВЫЙ CALLBACK: после удаления обновляем ВСЕ кнопки
            (removedCode) => {
                console.log('🗑️ Станция удалена:', removedCode);
                
                // Обновляем кнопку в поиске
                _updateFavButton($('#fav-add-btn'), currentStation);
                
                // Обновляем кнопки в маршрутах
                _updateRouteFavButtons();
                
                console.log('✅ Кнопки обновлены');
            }
        );
    }
    
    // 🔥 Загрузка направлений станции
    async function _loadStationDirections(station) {
        const $container = $('#directions-container');
        $container.empty().addClass('hidden');
        
        try {
            const data = await api.getSchedule(station.code);
            const segments = data.schedule || [];
            
            if (!segments.length) {
                $container.html('<p class="no-results">Нет рейсов на сегодня</p>').removeClass('hidden');
                return;
            }
            
            // Группировка по направлениям
            const directionsMap = new Map();
            segments.forEach((seg) => {
                const direction = seg.direction || '';
                if (!direction || direction.toLowerCase() === 'прибытие') return;
                directionsMap.set(direction, (directionsMap.get(direction) || 0) + 1);
            });
            
            const directions = Array.from(directionsMap.entries())
                .map(([direction, count]) => ({ direction, count }))
                .sort((a, b) => b.count - a.count);
            
            if (!directions.length) {
                $container.html('<p class="no-results">Нет направлений отправления</p>').removeClass('hidden');
                return;
            }
            
            let html = `<h3 class="directions-title">🧭 Направления (${directions.length})</h3>`;
            html += directions.map((item) => `
                <div class="direction-item" data-direction="${_esc(item.direction)}">
                    <span class="direction-name">${_esc(item.direction)}</span>
                    <span class="direction-count">${item.count} ${_declension(item.count, 'рейс', 'рейса', 'рейсов')}</span>
                    <span class="direction-arrow">→</span>
                </div>
            `).join('');
            
            $container.html(html).removeClass('hidden');
            
            $container.find('.direction-item').on('click', (e) => {
                const direction = $(e.currentTarget).data('direction');
                _showDirectionSchedule(station, direction, segments);
            });
            
        } catch (e) {
            $container.html(`<p class="error">Ошибка: ${e.message}</p>`).removeClass('hidden');
        }
    }
    
    // 🔥 Показать расписание по направлению
    function _showDirectionSchedule(station, direction, allSegments) {
        const $container = $('#directions-container');
        const filtered = allSegments.filter(seg => 
            seg.direction === direction && seg.direction?.toLowerCase() !== 'прибытие'
        );
        
        let html = `
            <h3 class="directions-title">
                <button class="btn btn-secondary" id="back-to-directions" type="button">← Назад</button>
                ${_esc(direction)}
            </h3>
        `;
        
        html += filtered.map((seg) => {
            const depTime = seg.departure || '??:??';
            return `
                <div class="direction-item" style="cursor:default;">
                    <span class="direction-name"><strong>${_fmtTime(depTime)}</strong></span>
                    <span class="direction-count">${_esc(seg.days || '')}</span>
                </div>
            `;
        }).join('');
        
        $container.html(html);
        $('#back-to-directions').on('click', () => _loadStationDirections(station));
    }
    
    // 🔥 Загрузка результатов маршрута
    async function _loadRouteResults(from, to) {
        const $container = $('#route-results');
        $container.empty().html('<p class="loading">⏳ Загрузка...</p>');
        
        try {
            const data = await api.searchRoute(from.code, to.code);
            const segments = data.schedule || data.segments || [];
            
            if (!segments.length) {
                $container.html(`
                    <div class="no-results">
                        <p>😕 Маршруты не найдены</p>
                        <small>Попробуйте: Москва → Подольск</small>
                    </div>
                `);
                return;
            }
            
            let html = `<h3 class="directions-title">🚃 ${_esc(from.title)} → ${_esc(to.title)}</h3>`;
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
            
            // 🔥 После загрузки маршрута обновляем кнопки избранного
            _updateRouteFavButtons();
            
        } catch (e) {
            $container.html(`<p class="error">Ошибка: ${e.message}</p>`);
        }
    }
    
    /**
     * Обновить вид кнопки избранного
     */
    function _updateFavButton($btn, station) {
        if (!station) {
            $btn.addClass('hidden');
            return;
        }
        
        $btn.removeClass('hidden');
        const isFav = favorites.isFavorite(station.code);
        
        $btn.toggleClass('active', isFav);
        $btn.find('.fav-icon').text(isFav ? '★' : '☆');
        // 🔥 Убрали .fav-text так как теперь только иконка
    }
    
    /**
     * Обновить кнопки избранного для маршрута
     */
    function _updateRouteFavButtons() {
        currentFromStation = fromSearch.getSelected();
        currentToStation = toSearch.getSelected();
        
        // Кнопка "Откуда"
        if (currentFromStation) {
            const isFav = favorites.isFavorite(currentFromStation.code);
            const $btn = $('#fav-from-btn');
            $btn.removeClass('hidden');
            $btn.toggleClass('active', isFav);
            $btn.find('.fav-icon').text(isFav ? '★' : '☆');
        } else {
            $('#fav-from-btn').addClass('hidden');
        }
        
        // Кнопка "Куда"
        if (currentToStation) {
            const isFav = favorites.isFavorite(currentToStation.code);
            const $btn = $('#fav-to-btn');
            $btn.removeClass('hidden');
            $btn.toggleClass('active', isFav);
            $btn.find('.fav-icon').text(isFav ? '★' : '☆');
        } else {
            $('#fav-to-btn').addClass('hidden');
        }
    }
    
    /**
     * Переключить статус избранного для станции
     */
    function _toggleFavorite(station) {
        if (!station) return;
        
        if (favorites.isFavorite(station.code)) {
            favorites.remove(station.code);
        } else {
            favorites.add(station);
        }
        
        // Обновляем все кнопки
        _updateFavButton($('#fav-add-btn'), currentStation);
        _updateRouteFavButtons();
        _renderFavorites();
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
    
    // Инициализация
    _renderFavorites();
});