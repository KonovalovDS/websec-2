/**
 * Модуль отображения расписания
 * @module schedule
 * @deprecated Логика перенесена в app.js, файл можно удалить
 */

import { api } from './api_client.js';

export class ScheduleRenderer {
    /**
     * @param {string} containerSelector - Селектор контейнера
     * @param {string} titleSelector - Селектор заголовка
     * @param {string} controlsSelector - Селектор кнопок управления
     */
    constructor(containerSelector, titleSelector, controlsSelector) {
        this.container = $(containerSelector);
        this.title = $(titleSelector);
        this.controls = $(controlsSelector);
        this.stationName = $('#station-name');
        this.loading = $('#schedule-loading');
        this.error = $('#schedule-error');
        this.favBtn = $('#fav-btn');
        this.currentStation = null;
    }
    
    /**
     * Отобразить расписание по станции
     * @param {string} stationCode - Код станции
     * @param {string} stationTitle - Название станции
     */
    async showSchedule(stationCode, stationTitle) {
        this.currentStation = { code: stationCode, title: stationTitle };
        this._showLoading();
        this.title.text('📋 Расписание');
        this.stationName.text(stationTitle);
        this.controls.removeClass('hidden');
        
        try {
            const data = await api.getSchedule(stationCode);
            this._renderSchedule(data.segments || [], stationTitle);
        } catch (err) {
            this._showError(err.message);
        }
    }
    
    /**
     * Отобразить маршрут между станциями
     * @param {Object} fromStation - Станция отправления
     * @param {Object} toStation - Станция назначения
     */
    async showRoute(fromStation, toStation) {
        this.currentStation = null;
        this._showLoading();
        this.title.text(`🔍 ${fromStation.title} → ${toStation.title}`);
        this.controls.addClass('hidden');
        
        try {
            const data = await api.searchRoute(fromStation.code, toStation.code);
            this._renderRoute(data.segments || [], fromStation, toStation);
        } catch (err) {
            this._showError(err.message);
        }
    }
    
    /**
     * Отрисовка расписания
     * @param {Array} segments - Список сегментов расписания
     * @param {string} stationTitle - Название станции
     * @private
     */
    _renderSchedule(segments, stationTitle) {
        this.loading.addClass('hidden');
        this.error.addClass('hidden');
        this.container.empty();
        
        if (!segments || !segments.length) {
            this.container.html(`
                <p class="no-results">
                    Нет рейсов электричек на сегодня.<br>
                    <small style="color:#999">Попробуйте выбрать другой день или станцию</small>
                </p>
            `);
            return;
        }
        
        const html = segments.slice(0, 50).map((seg) => {
            const dep = seg.departure || {};
            const train = seg.thread || {};
            
            let depTime;
            if (typeof seg.departure === 'string') {
                depTime = seg.departure;
            } else {
                depTime = dep.time || dep.date || seg.departure_time || '';
            }
            
            return `
                <article class="schedule-item">
                    <time class="schedule-time">${this._fmtTime(depTime)}</time>
                    <div class="schedule-info">
                        <div class="train-name">${this._esc(train.name || 'Электричка')}</div>
                        <div class="route">${this._esc(train.direction || '')}</div>
                    </div>
                    <span class="schedule-platform">${this._esc(dep.platform || '?')}</span>
                </article>
            `;
        }).join('');
        
        this.container.html(html);
    }
    
    /**
     * Отрисовка маршрута
     * @param {Array} segments - Список сегментов маршрута
     * @param {Object} fromStation - Станция отправления
     * @param {Object} toStation - Станция назначения
     * @private
     */
    _renderRoute(segments, fromStation, toStation) {
        this.loading.addClass('hidden');
        this.error.addClass('hidden');
        this.container.empty();
        
        if (!segments || !segments.length) {
            this.container.html(`
                <div class="no-results">
                    <p>😕 Маршруты не найдены</p>
                    <small style="color:#999">
                        Между этими станциями нет прямого пригородного сообщения.<br>
                        Попробуйте: Москва → Подольск
                    </small>
                </div>
            `);
            return;
        }
        
        const html = segments.slice(0, 20).map((seg) => {
            let depTime, arrTime;
            
            if (typeof seg.departure === 'string') {
                depTime = seg.departure;
            } else if (seg.departure?.time) {
                depTime = seg.departure.time;
            } else if (seg.departure?.date) {
                depTime = seg.departure.date;
            } else {
                depTime = '';
            }
            
            if (typeof seg.arrival === 'string') {
                arrTime = seg.arrival;
            } else if (seg.arrival?.time) {
                arrTime = seg.arrival.time;
            } else if (seg.arrival?.date) {
                arrTime = seg.arrival.date;
            } else {
                arrTime = '';
            }
            
            const train = seg.thread || {};
            
            return `
                <article class="schedule-item route-view">
                    <time class="schedule-time">
                        ${this._fmtTime(depTime)} → ${this._fmtTime(arrTime)}
                    </time>
                    <div class="schedule-info">
                        <div class="train-name">${this._esc(train.short_title || train.name || 'Электричка')}</div>
                        <div class="route">${this._esc(fromStation.title)} → ${this._esc(toStation.title)}</div>
                        ${seg.days ? `<div class="route-days">${this._esc(seg.days)}</div>` : ''}
                    </div>
                </article>
            `;
        }).join('');
        
        this.container.html(html);
    }
    
    /**
     * Форматирование времени
     * @param {string} timeStr - Строка времени
     * @returns {string}
     * @private
     */
    _fmtTime(timeStr) {
        if (!timeStr) return '??:??';
        if (typeof timeStr === 'string' && timeStr.includes('T')) {
            const timePart = timeStr.split('T')[1];
            if (timePart) return timePart.substring(0, 5);
        }
        if (typeof timeStr === 'string' && timeStr.includes(':')) {
            return timeStr.substring(0, 5);
        }
        return String(timeStr).substring(0, 5) || '??:??';
    }
    
    /**
     * Экранирование HTML
     * @param {string} str - Строка для экранирования
     * @returns {string}
     * @private
     */
    _esc(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    /**
     * Показать индикатор загрузки
     * @private
     */
    _showLoading() {
        this.container.empty();
        this.loading.removeClass('hidden');
        this.error.addClass('hidden');
    }
    
    /**
     * Показать ошибку
     * @param {string} message - Текст ошибки
     * @private
     */
    _showError(message) {
        this.loading.addClass('hidden');
        this.error.text(`⚠️ ${message}`).removeClass('hidden');
        this.container.empty();
    }
    
    /**
     * Настроить обработчик кнопки "Избранное"
     * @param {Function} handler - Callback
     */
    onFavoriteClick(handler) {
        this.favBtn.off('click').on('click', handler);
    }
    
    /**
     * Обновить иконку избранного
     * @param {boolean} isFavorite - Статус избранного
     */
    setFavoriteIcon(isFavorite) {
        this.favBtn.text(isFavorite ? '★' : '☆');
        this.favBtn.attr('title', isFavorite ? 'Убрать из избранного' : 'Добавить в избранное');
    }
    
    /**
     * Получить текущую станцию
     * @returns {Object|null}
     */
    getCurrentStation() {
        return this.currentStation;
    }
}   