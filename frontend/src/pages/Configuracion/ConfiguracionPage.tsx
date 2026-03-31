import { useEffect, useState } from 'react';

import ErrorBanner from '../../components/common/ErrorBanner';
import Toast from '../../components/common/Toast';
import Topbar from '../../components/Layout/Topbar';
import { useAppConfig } from '../../context/AppConfigContext';

const colorFields = [
  { key: 'sidebarBg', label: 'Fondo lateral' },
  { key: 'sidebarButtonBg', label: 'Boton lateral' },
  { key: 'sidebarButtonText', label: 'Texto boton lateral' },
  { key: 'sidebarActiveBg', label: 'Boton activo' },
  { key: 'sidebarActiveText', label: 'Texto boton activo' },
  { key: 'topbarBg', label: 'Fondo de titulos' },
  { key: 'topbarText', label: 'Texto de titulos' },
  { key: 'sectionTitleText', label: 'Texto titulos de contenido' },
  { key: 'sectionSubtitleText', label: 'Texto subtitulos' },
  { key: 'summaryLabelText', label: 'Texto etiqueta de cuadros' },
  { key: 'summaryValueText', label: 'Texto valor de cuadros' },
  { key: 'tableHeaderBg', label: 'Encabezado de tablas' },
  { key: 'tableHeaderText', label: 'Texto encabezado tabla' },
] as const;

type ThemeColors = {
  sidebarBg: string;
  sidebarButtonBg: string;
  sidebarButtonText: string;
  sidebarActiveBg: string;
  sidebarActiveText: string;
  topbarBg: string;
  topbarText: string;
  sectionTitleText: string;
  sectionSubtitleText: string;
  summaryLabelText: string;
  summaryValueText: string;
  tableHeaderBg: string;
  tableHeaderText: string;
};

function clamp(value: number, min = 0, max = 255) {
  return Math.min(max, Math.max(min, value));
}

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue]
    .map((value) => clamp(value).toString(16).padStart(2, '0'))
    .join('')}`;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const parsed = Number.parseInt(normalized, 16);

  return {
    red: (parsed >> 16) & 255,
    green: (parsed >> 8) & 255,
    blue: parsed & 255,
  };
}

function mixHex(baseHex: string, targetHex: string, weight: number) {
  const base = hexToRgb(baseHex);
  const target = hexToRgb(targetHex);

  return rgbToHex(
    Math.round(base.red + (target.red - base.red) * weight),
    Math.round(base.green + (target.green - base.green) * weight),
    Math.round(base.blue + (target.blue - base.blue) * weight)
  );
}

function getReadableText(backgroundHex: string) {
  const { red, green, blue } = hexToRgb(backgroundHex);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
  return brightness > 150 ? '#0f172a' : '#ffffff';
}

function dedupeColors(colors: string[]) {
  return [...new Set(colors)];
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
    reader.readAsDataURL(file);
  });
}

function extractPaletteFromDataUrl(dataUrl: string) {
  return new Promise<string[]>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        reject(new Error('No se pudo analizar la imagen para extraer colores.'));
        return;
      }

      const targetWidth = 80;
      const scale = targetWidth / image.width;
      canvas.width = targetWidth;
      canvas.height = Math.max(1, Math.round(image.height * scale));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
      const buckets = new Map<string, number>();

      for (let index = 0; index < data.length; index += 4) {
        const alpha = data[index + 3];
        if (alpha < 180) {
          continue;
        }

        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        const brightness = (red + green + blue) / 3;

        if (brightness > 245 || brightness < 20) {
          continue;
        }

        const quantized = rgbToHex(
          Math.round(red / 24) * 24,
          Math.round(green / 24) * 24,
          Math.round(blue / 24) * 24
        );

        buckets.set(quantized, (buckets.get(quantized) || 0) + 1);
      }

      const palette = [...buckets.entries()]
        .sort((left, right) => right[1] - left[1])
        .map(([color]) => color)
        .slice(0, 5);

      resolve(dedupeColors(palette));
    };
    image.onerror = () => reject(new Error('No se pudo procesar la imagen del logo.'));
    image.src = dataUrl;
  });
}

function buildThemeFromPalette(palette: string[]): ThemeColors {
  const primary = palette[0] || '#1d4ed8';
  const secondary = palette[1] || '#eab308';
  const accent = palette[2] || '#0f766e';
  const darkBase = mixHex(primary, '#0f172a', 0.65);

  return {
    sidebarBg: mixHex(primary, '#ffffff', 0.9),
    sidebarButtonBg: mixHex(primary, '#ffffff', 0.96),
    sidebarButtonText: darkBase,
    sidebarActiveBg: mixHex(primary, '#ffffff', 0.22),
    sidebarActiveText: getReadableText(mixHex(primary, '#ffffff', 0.22)),
    topbarBg: primary,
    topbarText: getReadableText(primary),
    sectionTitleText: darkBase,
    sectionSubtitleText: mixHex(primary, '#64748b', 0.72),
    summaryLabelText: mixHex(primary, '#94a3b8', 0.78),
    summaryValueText: darkBase,
    tableHeaderBg: mixHex(secondary, '#ffffff', 0.3),
    tableHeaderText: getReadableText(mixHex(secondary, '#ffffff', 0.3)) === '#ffffff'
      ? '#0f172a'
      : '#0f172a',
  };
}

const ConfiguracionPage = () => {
  const { config, saveConfig } = useAppConfig();
  const [form, setForm] = useState({
    nombreCasaRifera: 'Rifas Admin',
    logoDataUrl: null as string | null,
    reglamentoDataUrl: null as string | null,
    reglamentoNombreArchivo: '',
    responsableNombre: '',
    responsableTelefono: '',
    responsableDireccion: '',
    responsableCiudad: '',
    responsableDepartamento: '',
    numeroResolucionAutorizacion: '',
    entidadAutoriza: '',
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
  });
  const [state, setState] = useState({
    saving: false,
    error: '',
    success: '',
    paletteLoading: false,
  });

  useEffect(() => {
    setForm({
      nombreCasaRifera: config.nombreCasaRifera || 'Rifas Admin',
      logoDataUrl: config.logoDataUrl || null,
      reglamentoDataUrl: config.reglamentoDataUrl || null,
      reglamentoNombreArchivo: config.reglamentoNombreArchivo || '',
      responsableNombre: config.responsableNombre || '',
      responsableTelefono: config.responsableTelefono || '',
      responsableDireccion: config.responsableDireccion || '',
      responsableCiudad: config.responsableCiudad || '',
      responsableDepartamento: config.responsableDepartamento || '',
      numeroResolucionAutorizacion: config.numeroResolucionAutorizacion || '',
      entidadAutoriza: config.entidadAutoriza || '',
      themeColors: config.themeColors,
    });
  }, [config]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const logoDataUrl = await fileToDataUrl(file);
      setState((prev) => ({
        ...prev,
        error: '',
        success: '',
        paletteLoading: true,
      }));

      const palette = await extractPaletteFromDataUrl(logoDataUrl);
      const suggestedTheme = buildThemeFromPalette(palette);

      setForm((prev) => ({
        ...prev,
        logoDataUrl,
        themeColors: suggestedTheme,
      }));
      setState((prev) => ({
        ...prev,
        error: '',
        success: 'Se sugirieron colores automaticamente desde el logo. Puedes ajustarlos manualmente.',
        paletteLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        paletteLoading: false,
        error: error instanceof Error ? error.message : 'No se pudo cargar el logo.',
      }));
    }
  };

  const handleReglamentoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const reglamentoDataUrl = await fileToDataUrl(file);
      setForm((prev) => ({
        ...prev,
        reglamentoDataUrl,
        reglamentoNombreArchivo: file.name,
      }));
      setState((prev) => ({
        ...prev,
        error: '',
        success: 'Reglamento cargado correctamente. Guarda la configuracion para dejarlo activo.',
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'No se pudo cargar el reglamento.',
      }));
    }
  };

  const applyPaletteFromLogo = async () => {
    if (!form.logoDataUrl) {
      setState((prev) => ({
        ...prev,
        error: 'Primero debes subir un logo para extraer colores.',
      }));
      return;
    }

    try {
      setState((prev) => ({
        ...prev,
        paletteLoading: true,
        error: '',
        success: '',
      }));

      const palette = await extractPaletteFromDataUrl(form.logoDataUrl);
      setForm((prev) => ({
        ...prev,
        themeColors: buildThemeFromPalette(palette),
      }));
      setState((prev) => ({
        ...prev,
        paletteLoading: false,
        success: 'Paleta aplicada desde el logo. Puedes modificar cualquier color manualmente.',
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        paletteLoading: false,
        error:
          error instanceof Error
            ? error.message
            : 'No se pudieron extraer colores desde el logo.',
      }));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState((prev) => ({ ...prev, saving: true, error: '', success: '' }));

    try {
      await saveConfig(form);
      setState((prev) => ({
        ...prev,
        saving: false,
        success: 'Configuracion guardada correctamente.',
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error.message : 'No se pudo guardar la configuracion.',
      }));
    }
  };

  return (
    <div>
      <Topbar title="Configuracion" />
      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={state.error} />
        {state.success ? <Toast message={state.success} /> : null}

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
        >
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800">
              Datos de la casa rifera
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Esta informacion se usa en el menu y en la impresion de planillas.
            </p>

            <div className="mt-6 grid gap-4">
              <label className="text-sm">
                <span className="text-slate-600">Nombre de la casa rifera</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.nombreCasaRifera}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      nombreCasaRifera: event.target.value,
                    }))
                  }
                  placeholder="Ej: Rifas Chinchina"
                  required
                />
              </label>

              <label className="text-sm">
                <span className="text-slate-600">Logo de la empresa</span>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 block w-full text-sm text-slate-600"
                  onChange={handleFileChange}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Se guarda en el sistema para usarlo en las planillas impresas.
                </p>
              </label>

              {form.logoDataUrl ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="w-fit rounded-md border border-sky-300 px-3 py-2 text-sm text-sky-700"
                    onClick={() => {
                      void applyPaletteFromLogo();
                    }}
                    disabled={state.paletteLoading}
                  >
                    {state.paletteLoading
                      ? 'Analizando colores...'
                      : 'Usar colores del logo'}
                  </button>
                  <button
                    type="button"
                    className="w-fit rounded-md border border-rose-300 px-3 py-2 text-sm text-rose-700"
                    onClick={() => setForm((prev) => ({ ...prev, logoDataUrl: null }))}
                  >
                    Quitar logo
                  </button>
                </div>
              ) : null}

              <label className="text-sm">
                <span className="text-slate-600">Reglamento de la rifa</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  className="mt-1 block w-full text-sm text-slate-600"
                  onChange={handleReglamentoChange}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Este archivo quedara listo para mostrarse despues en el panel publico.
                </p>
              </label>

              {form.reglamentoDataUrl ? (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-slate-600">
                    Reglamento cargado: {form.reglamentoNombreArchivo || 'Archivo adjunto'}
                  </span>
                  <button
                    type="button"
                    className="rounded-md border border-rose-300 px-3 py-2 text-sm text-rose-700"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        reglamentoDataUrl: null,
                        reglamentoNombreArchivo: '',
                      }))
                    }
                  >
                    Quitar reglamento
                  </button>
                </div>
              ) : null}

              <div className="mt-2 border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold text-slate-800">
                  Responsable y autorizacion
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  Estos datos quedaran listos para impresion y para la futura pagina publica de venta.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="text-slate-600">Nombre del responsable</span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={form.responsableNombre}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        responsableNombre: event.target.value,
                      }))
                    }
                    placeholder="Ej: Juan Perez"
                  />
                </label>

                <label className="text-sm">
                  <span className="text-slate-600">Telefono del responsable</span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={form.responsableTelefono}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        responsableTelefono: event.target.value,
                      }))
                    }
                    placeholder="Ej: 3001234567"
                  />
                </label>
              </div>

              <label className="text-sm">
                <span className="text-slate-600">Direccion del responsable</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.responsableDireccion}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      responsableDireccion: event.target.value,
                    }))
                  }
                  placeholder="Ej: Calle 10 # 5-12"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="text-slate-600">Ciudad</span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={form.responsableCiudad}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        responsableCiudad: event.target.value,
                      }))
                    }
                    placeholder="Ej: Chinchina"
                  />
                </label>

                <label className="text-sm">
                  <span className="text-slate-600">Departamento</span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={form.responsableDepartamento}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        responsableDepartamento: event.target.value,
                      }))
                    }
                    placeholder="Ej: Caldas"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="text-slate-600">Entidad que autoriza</span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={form.entidadAutoriza}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        entidadAutoriza: event.target.value,
                      }))
                    }
                    placeholder="Ej: EDSA o COLJUEGOS"
                  />
                </label>

                <label className="text-sm">
                  <span className="text-slate-600">Numero de resolucion</span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={form.numeroResolucionAutorizacion}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        numeroResolucionAutorizacion: event.target.value,
                      }))
                    }
                    placeholder="Ej: 2026-001"
                  />
                </label>
              </div>

              <div className="mt-2 border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold text-slate-800">
                  Colores del panel administrativo
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  Estos colores ya controlan sidebar, menu activo, titulos y encabezados de tablas. Luego se pueden extender al panel publico.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Si subes un logo, el sistema puede sugerir una paleta automaticamente y luego la puedes retocar a mano.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {colorFields.map((field) => (
                  <label key={field.key} className="text-sm">
                    <span className="text-slate-600">{field.label}</span>
                    <div className="mt-1 flex items-center gap-3 rounded-md border border-slate-300 px-3 py-2">
                      <input
                        type="color"
                        className="h-10 w-14 rounded border border-slate-200 bg-white"
                        value={form.themeColors[field.key]}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            themeColors: {
                              ...prev.themeColors,
                              [field.key]: event.target.value,
                            },
                          }))
                        }
                      />
                      <input
                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                        value={form.themeColors[field.key]}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            themeColors: {
                              ...prev.themeColors,
                              [field.key]: event.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
                disabled={state.saving}
              >
                {state.saving ? 'Guardando...' : 'Guardar configuracion'}
              </button>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800">Vista previa</h3>
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-6">
              <div className="flex items-center gap-4">
                {form.logoDataUrl ? (
                  <img
                    src={form.logoDataUrl}
                    alt={form.nombreCasaRifera}
                    className="h-20 w-20 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white">
                    {form.nombreCasaRifera.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Casa rifera
                  </p>
                  <h4 className="text-xl font-semibold text-slate-800">
                    {form.nombreCasaRifera || 'Rifas Admin'}
                  </h4>
                  <p className="text-sm text-slate-500">
                    Este encabezado se reutiliza al imprimir boletas.
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Reglamento: {form.reglamentoNombreArchivo || 'Sin archivo cargado'}
                  </p>
                  <div className="mt-4 space-y-1 text-sm text-slate-600">
                    <p>
                      <span className="font-medium text-slate-800">Responsable:</span>{' '}
                      {form.responsableNombre || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium text-slate-800">Telefono:</span>{' '}
                      {form.responsableTelefono || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium text-slate-800">Ubicacion:</span>{' '}
                      {[form.responsableDireccion, form.responsableCiudad, form.responsableDepartamento]
                        .filter(Boolean)
                        .join(' - ') || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium text-slate-800">Autoriza:</span>{' '}
                      {form.entidadAutoriza || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium text-slate-800">Resolucion:</span>{' '}
                      {form.numeroResolucionAutorizacion || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfiguracionPage;
