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

export const todayISO = () => new Date().toISOString().slice(0, 10);
