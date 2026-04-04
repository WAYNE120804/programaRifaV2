export const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleDateString('es-CO');
};

export const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleString('es-CO');
};

export const formatDateTimeLong = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const todayISO = () => new Date().toISOString().slice(0, 10);
