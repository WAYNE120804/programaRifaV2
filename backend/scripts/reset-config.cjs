const fs = require('node:fs');
const path = require('node:path');

const configPath = path.resolve(__dirname, '..', 'storage', 'configuracion.json');

const defaultConfig = {
  id: 'principal',
  clave: 'principal',
  nombreCasaRifera: 'Rifas Admin',
  logoDataUrl: null,
  reglamentoDataUrl: null,
  reglamentoNombreArchivo: null,
  responsableNombre: null,
  responsableTelefono: null,
  responsableDireccion: null,
  responsableCiudad: null,
  responsableDepartamento: null,
  numeroResolucionAutorizacion: null,
  entidadAutoriza: null,
  themeColors: {
    sidebarBg: '#ffffff',
    sidebarButtonBg: '#ffffff',
    sidebarButtonText: '#334155',
    sidebarActiveBg: '#e2e8f0',
    sidebarActiveText: '#0f172a',
    topbarBg: '#ffffff',
    topbarText: '#0f172a',
    sectionTitleText: '#0f172a',
    sectionSubtitleText: '#64748b',
    summaryLabelText: '#94a3b8',
    summaryValueText: '#0f172a',
    tableHeaderBg: '#f1f5f9',
    tableHeaderText: '#475569',
  },
};

fs.mkdirSync(path.dirname(configPath), { recursive: true });
fs.writeFileSync(configPath, `${JSON.stringify(defaultConfig, null, 2)}\n`, 'utf8');
console.log('Configuracion reiniciada.');
