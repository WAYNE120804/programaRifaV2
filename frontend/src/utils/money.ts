export const formatCOP = (value) => {
  const number = Number(value || 0);
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(number);
};

export const formatCOPNumber = (value) => {
  const number = Number(value || 0);
  return new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0
  }).format(number);
};

export const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return 0;
  return Number(String(value).replace(/\D+/g, '')) || 0;
};
