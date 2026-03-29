// ============================================
// Модуль отображения расписания
// ============================================

import { api } from './api_client.js';

export class ScheduleRenderer {
    constructor(containerSelector, titleSelector, controlsSelector) {
        this.container = $(containerSelector);
        this.title = $(titleSelector);
        this.controls = $(controlsSelector);
        this.stationName = $('#station-name');
        this.loading = $('#schedule-loading');
        this.error = $('#schedule-error');
        this.favBtn = $('#fav-btn');
        this.currentStation = null;
        this.currentSchedule = null;  // 🔥 Храним всё расписание
        this.currentDirection = null; // 🔥 Текущее направление
    }
    
    /**
     * Отобразить расписание по станции
     */
    async showSchedule(stationCode, stationTitle) {
        this.currentStation = { code: stationCode, title: stationTitle };
        this.currentDirection = null;
        this._showLoading();
        this.title.text('📋 Расписание');
        this.stationName.text(stationTitle);
        this.controls.removeClass('hidden');
        
        try {
            const data = await api.getSchedule(stationCode);
            this.currentSchedule = data.segments || [];
            this._renderDirections(this.currentSchedule, stationTitle);
        } catch (err) {
            this._showError(err.message);
        }
    }
    
    /**
     * Показать список направлений
     */
    _renderDirections(segments, stationTitle) {
        // 🔥 СКРЫВАЕМ индикатор загрузки
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
        
        // 🔥 Группируем по направлениям
        const directionsMap = new Map();
        
        segments.forEach((seg) => {
            const direction = seg.thread?.direction || 'Неизвестное направление';
            const count = directionsMap.get(direction) || 0;
            directionsMap.set(direction, count + 1);
        });
        
        // 🔥 Преобразуем в массив и сортируем по количеству рейсов
        const directions = Array.from(directionsMap.entries())
            .map(([direction, count]) => ({ direction, count }))
            .sort((a, b) => b.count - a.count);
        
        // 🔥 Кнопка "Показать все рейсы"
        let html = `
            <div style="margin-bottom: 1rem; padding: 1rem; background: #f0f4ff; border-radius: 8px;">
                <button class="btn btn-secondary" id="show-all-schedules" type="button" style="width: 100%;">
                    📋 Показать все рейсы (${segments.length})
                </button>
            </div>
            
            <h3 style="font-size: 1rem; margin-bottom: 0.75rem; color: #333;">
                🧭 Направления (${directions.length})
            </h3>
        `;
        
        // 🔥 Список направлений
        html += directions.map((item) => `
            <article class="schedule-item" style="cursor: pointer; transition: background 0.2s;" 
                     data-direction="${this._esc(item.direction)}">
                <div class="schedule-info" style="flex: 1;">
                    <div class="train-name" style="font-weight: 600; font-size: 1rem;">
                        ${this._esc(item.direction)}
                    </div>
                    <div class="route" style="color: #666; font-size: 0.9rem;">
                        ${item.count} ${this._declension(item.count, 'рейс', 'рейса', 'рейсов')} сегодня
                    </div>
                </div>
                <span style="font-size: 1.5rem; color: #667eea;">→</span>
            </article>
        `).join('');
        
        this.container.html(html);
        
        // 🔥 Обработчик клика по направлению
        this.container.find('.schedule-item[data-direction]').on('click', (e) => {
            const direction = $(e.currentTarget).data('direction');
            this._showScheduleByDirection(direction);
        });
        
        // 🔥 Обработчик кнопки "Показать все"
        this.container.find('#show-all-schedules').on('click', () => {
            this._showAllSchedules();
        });
    }
    
    /**
     * Показать расписание по конкретному направлению
     */
    _showScheduleByDirection(direction) {
        this.currentDirection = direction;
        this.loading.addClass('hidden');
        this.error.addClass('hidden');
        
        if (!this.currentSchedule) return;
        
        // 🔥 Фильтруем по направлению
        const filtered = this.currentSchedule.filter((seg) => {
            const segDirection = seg.thread?.direction || '';
            return segDirection === direction;
        });
        
        this.container.empty();
        
        // 🔥 Кнопка "Назад к направлениям"
        let html = `
            <div style="margin-bottom: 1rem;">
                <button class="btn btn-secondary" id="back-to-directions" type="button">
                    ← Назад к направлениям
                </button>
                <span style="margin-left: 1rem; font-weight: 600;">
                    ${this._esc(direction)}
                </span>
            </div>
        `;
        
        // 🔥 Список рейсов
        html += filtered.map((seg) => {
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
        
        // 🔥 Обработчик кнопки "Назад"
        this.container.find('#back-to-directions').on('click', () => {
            this._renderDirections(this.currentSchedule, this.currentStation?.title || '');
        });
    }
    
    /**
     * Показать все рейсы
     */
    _showAllSchedules() {
        this.currentDirection = null;
        this.loading.addClass('hidden');
        this.error.addClass('hidden');
        
        if (!this.currentSchedule) return;
        
        this.container.empty();
        
        // 🔥 Кнопка "Назад к направлениям"
        let html = `
            <div style="margin-bottom: 1rem;">
                <button class="btn btn-secondary" id="back-to-directions" type="button">
                    ← Назад к направлениям
                </button>
                <span style="margin-left: 1rem; font-weight: 600;">
                    Все рейсы (${this.currentSchedule.length})
                </span>
            </div>
        `;
        
        // 🔥 Все рейсы
        html += this.currentSchedule.map((seg) => {
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
        
        // 🔥 Обработчик кнопки "Назад"
        this.container.find('#back-to-directions').on('click', () => {
            this._renderDirections(this.currentSchedule, this.currentStation?.title || '');
        });
    }
    
    /**
     * Отрисовка маршрута — БЕЗ СОРТИРОВКИ, БЕЗ ПЛАТФОРМЫ "?"
     */
    _renderRoute(segments, fromStation, toStation) {
        // 🔥 СКРЫВАЕМ индикатор загрузки
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
            
            // 🔥 БЕЗ ПЛАТФОРМЫ — только время и информация
            return `
                <article class="schedule-item" style="display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1rem; padding: 0.75rem; background: #f8f9fa; border-radius: 8px; align-items: center;">
                    <time class="schedule-time" style="font-weight: 700; font-size: 1.2rem; color: #667eea;">
                        ${this._fmtTime(depTime)} → ${this._fmtTime(arrTime)}
                    </time>
                    <div class="schedule-info" style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <div class="train-name" style="font-weight: 600;">${this._esc(train.short_title || train.name || 'Электричка')}</div>
                        <div class="route" style="color: #666; font-size: 0.9rem;">${this._esc(fromStation.title)} → ${this._esc(toStation.title)}</div>
                        ${seg.days ? `<div style="font-size:0.8rem;color:#666">${this._esc(seg.days)}</div>` : ''}
                    </div>
                </article>
            `;
        }).join('');
        
        this.container.html(html);
    }
    
    /**
     * Форматирование времени
     */
    _fmtTime(timeStr) {
        if (!timeStr) return '??:??';
        
        // Формат: "2026-03-29T14:30:00+03:00"
        if (typeof timeStr === 'string' && timeStr.includes('T')) {
            const timePart = timeStr.split('T')[1];
            if (timePart) {
                return timePart.substring(0, 5);
            }
        }
        
        // Формат: "14:30" или "14:30:00"
        if (typeof timeStr === 'string' && timeStr.includes(':')) {
            return timeStr.substring(0, 5);
        }
        
        // Любой другой формат
        return String(timeStr).substring(0, 5) || '??:??';
    }
    
    /**
     * Экранирование HTML
     */
    _esc(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    /**
     * Склонение слов (1 рейс, 2 рейса, 5 рейсов)
     */
    _declension(number, one, two, five) {
        const n = number % 100;
        const n1 = n % 10;
        
        if (n > 10 && n < 20) return five;
        if (n1 > 1 && n1 < 5) return two;
        if (n1 === 1) return one;
        return five;
    }
    
    /**
     * Показать индикатор загрузки
     */
    _showLoading() {
        this.container.empty();
        this.loading.removeClass('hidden');
        this.error.addClass('hidden');
    }
    
    /**
     * Показать ошибку
     */
    _showError(message) {
        this.loading.addClass('hidden');
        this.error.text(`⚠️ ${message}`).removeClass('hidden');
        this.container.empty();
    }
    
    /**
     * Настроить обработчик кнопки "Избранное"
     */
    onFavoriteClick(handler) {
        this.favBtn.off('click').on('click', handler);
    }
    
    /**
     * Обновить иконку избранного
     */
    setFavoriteIcon(isFavorite) {
        this.favBtn.text(isFavorite ? '★' : '☆');
        this.favBtn.attr('title', isFavorite ? 'Убрать из избранного' : 'Добавить в избранное');
    }
    
    /**
     * Получить текущую станцию
     */
    getCurrentStation() {
        return this.currentStation;
    }
}