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
    tableHeaderText: '#0f172a',
  };
}

const ConfiguracionPage = () => {
  const { config, saveConfig } = useAppConfig();
  const [form, setForm] = useState({
    nombreNegocio: 'Almacen Admin',
    logoDataUrl: null as string | null,
    propietarioNombre: '',
    propietarioTelefono: '',
    direccion: '',
    ciudad: '',
    departamento: '',
    notasRecibo: '',
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
      nombreNegocio: config.nombreNegocio || 'Almacen Admin',
      logoDataUrl: config.logoDataUrl || null,
      propietarioNombre: config.propietarioNombre || '',
      propietarioTelefono: config.propietarioTelefono || '',
      direccion: config.direccion || '',
      ciudad: config.ciudad || '',
      departamento: config.departamento || '',
      notasRecibo: config.notasRecibo || '',
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
        success: 'Se sugirieron colores automáticamente desde el logo. Puedes ajustarlos manualmente.',
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
        success: 'Configuración guardada correctamente.',
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error.message : 'No se pudo guardar la configuración.',
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
              Datos del negocio
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Esta información se usará en el panel, en la tirilla y en los futuros reportes del almacén.
            </p>

            <div className="mt-6 grid gap-4">
              <label className="text-sm">
                <span className="text-slate-600">Nombre del negocio</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.nombreNegocio}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      nombreNegocio: event.target.value,
                    }))
                  }
                  placeholder="Ej: Almacen Wayne"
                  required
                />
              </label>

              <label className="text-sm">
                <span className="text-slate-600">Logo del negocio</span>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 block w-full text-sm text-slate-600"
                  onChange={handleFileChange}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Se guarda en el sistema para usarlo en la cabecera del panel y en las futuras tirillas.
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

              <div className="mt-2 border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold text-slate-800">
                  Datos operativos
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  Datos mínimos del negocio para recibos e identificación interna.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="text-slate-600">Propietario / administrador</span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={form.propietarioNombre}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        propietarioNombre: event.target.value,
                      }))
                    }
                    placeholder="Ej: Jhon Sebastian Diaz"
                  />
                </label>

                <label className="text-sm">
                  <span className="text-slate-600">Teléfono</span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={form.propietarioTelefono}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        propietarioTelefono: event.target.value,
                      }))
                    }
                    placeholder="Ej: 3001234567"
                  />
                </label>
              </div>

              <label className="text-sm">
                <span className="text-slate-600">Dirección</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.direccion}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      direccion: event.target.value,
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
                    value={form.ciudad}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        ciudad: event.target.value,
                      }))
                    }
                    placeholder="Ej: Bogotá"
                  />
                </label>

                <label className="text-sm">
                  <span className="text-slate-600">Departamento</span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={form.departamento}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        departamento: event.target.value,
                      }))
                    }
                    placeholder="Ej: Cundinamarca"
                  />
                </label>
              </div>

              <label className="text-sm">
                <span className="text-slate-600">Notas para tirilla / recibo</span>
                <textarea
                  className="mt-1 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.notasRecibo}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      notasRecibo: event.target.value,
                    }))
                  }
                  placeholder="Ej: Cambios solo con factura. Gracias por su compra."
                />
              </label>

              <div className="mt-2 border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold text-slate-800">
                  Colores del panel administrativo
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  Estos colores controlan sidebar, menú activo, títulos y encabezados de tablas.
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
                    alt={form.nombreNegocio}
                    className="h-20 w-20 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white">
                    {form.nombreNegocio.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Negocio
                  </p>
                  <h4 className="text-xl font-semibold text-slate-800">
                    {form.nombreNegocio || 'Almacen Admin'}
                  </h4>
                  <p className="text-sm text-slate-500">
                    Vista previa de la cabecera base del sistema.
                  </p>
                  <div className="mt-4 space-y-1 text-sm text-slate-600">
                    <p>
                      <span className="font-medium text-slate-800">Propietario:</span>{' '}
                      {form.propietarioNombre || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium text-slate-800">Telefono:</span>{' '}
                      {form.propietarioTelefono || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium text-slate-800">Ubicacion:</span>{' '}
                      {[form.direccion, form.ciudad, form.departamento]
                        .filter(Boolean)
                        .join(' - ') || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium text-slate-800">Nota de recibo:</span>{' '}
                      {form.notasRecibo || 'N/A'}
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
