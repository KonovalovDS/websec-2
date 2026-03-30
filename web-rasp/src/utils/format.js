export function formatTime(timeValue) {
  if (!timeValue) return '—';
  if (typeof timeValue === 'string' && timeValue.includes('T')) {
    const date = new Date(timeValue);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }
  if (typeof timeValue === 'string') {
    return timeValue.slice(0, 5);
  }
  return '—';
}

export function formatDuration(durationValue) {
  if (!durationValue) return '—';
  const duration = typeof durationValue === 'string' ? parseInt(durationValue, 10) : durationValue;
  if (isNaN(duration) || duration <= 0) return '—';
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  if (hours > 0) {
    return `${hours} ч ${minutes} мин`;
  }
  return `${minutes} мин`;
}

export function formatDate(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ru-RU', { 
    day: 'numeric', 
    month: 'long',
    weekday: 'short'
  });
}