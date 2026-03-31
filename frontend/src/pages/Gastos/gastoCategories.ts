export const gastoCategoryOptions = [
  { value: 'SUELDOS', label: 'Sueldos' },
  { value: 'PUBLICIDAD', label: 'Publicidad' },
  { value: 'ARRIENDO', label: 'Arriendo' },
  { value: 'SERVICIOS_PUBLICOS', label: 'Recibos de servicio publico' },
  { value: 'GASOLINA_TRANSPORTE', label: 'Gasolina y transporte' },
  { value: 'IMPRESION_PAPELERIA', label: 'Impresion y papeleria' },
  { value: 'PREMIOS_LOGISTICA', label: 'Premios y logistica' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { value: 'COMISIONES_BANCARIAS', label: 'Comisiones bancarias' },
  { value: 'OTROS', label: 'Otros' },
] as const;

export function getGastoCategoryLabel(value?: string | null) {
  return gastoCategoryOptions.find((option) => option.value === value)?.label || 'Otros';
}
