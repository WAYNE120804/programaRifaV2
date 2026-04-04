import { useEffect, useState } from 'react';

import ErrorBanner from '../../components/common/ErrorBanner';
import Toast from '../../components/common/Toast';
import Topbar from '../../components/Layout/Topbar';
import { useAppConfig } from '../../context/AppConfigContext';

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
    reader.readAsDataURL(file);
  });
}

function createGalleryId() {
  return `gallery-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

const ConfiguracionWebPage = () => {
  const { config, saveConfig } = useAppConfig();
  const [form, setForm] = useState({
    publicHeroTitle: '',
    publicHeroSubtitle: '',
    publicWhoWeAre: '',
    publicContactPhone: '',
    publicContactWhatsapp: '',
    publicContactEmail: '',
    publicAddress: '',
    publicCity: '',
    publicDepartment: '',
    publicFacebookUrl: '',
    publicInstagramUrl: '',
    publicTiktokUrl: '',
    publicPrimaryCtaText: '',
    publicSecondaryCtaText: '',
    publicSupportText: '',
    publicTermsText: '',
    publicHeroImageDataUrl: null as string | null,
    publicTicketBackgroundDataUrl: null as string | null,
    publicPrizeGallery: [] as Array<{
      id: string;
      nombre: string | null;
      descripcion: string | null;
      dataUrl: string;
    }>,
  });
  const [state, setState] = useState({
    saving: false,
    error: '',
    success: '',
  });

  useEffect(() => {
    setForm({
      publicHeroTitle: config.publicHeroTitle || config.nombreCasaRifera || '',
      publicHeroSubtitle: config.publicHeroSubtitle || '',
      publicWhoWeAre: config.publicWhoWeAre || '',
      publicContactPhone: config.publicContactPhone || config.responsableTelefono || '',
      publicContactWhatsapp:
        config.publicContactWhatsapp || config.responsableTelefono || '',
      publicContactEmail: config.publicContactEmail || '',
      publicAddress: config.publicAddress || config.responsableDireccion || '',
      publicCity: config.publicCity || config.responsableCiudad || '',
      publicDepartment: config.publicDepartment || config.responsableDepartamento || '',
      publicFacebookUrl: config.publicFacebookUrl || '',
      publicInstagramUrl: config.publicInstagramUrl || '',
      publicTiktokUrl: config.publicTiktokUrl || '',
      publicPrimaryCtaText: config.publicPrimaryCtaText || 'Comprar boletas',
      publicSecondaryCtaText: config.publicSecondaryCtaText || 'Verificar compra',
      publicSupportText:
        config.publicSupportText ||
        (config.responsableTelefono
          ? `Si tienes dudas o no ves tu compra, escribenos o llamanos al ${config.responsableTelefono}.`
          : ''),
      publicTermsText: config.publicTermsText || '',
      publicHeroImageDataUrl: config.publicHeroImageDataUrl || null,
      publicTicketBackgroundDataUrl: config.publicTicketBackgroundDataUrl || null,
      publicPrizeGallery: config.publicPrizeGallery || [],
    });
  }, [config]);

  const handleSingleImage =
    (field: 'publicHeroImageDataUrl' | 'publicTicketBackgroundDataUrl') =>
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      try {
        const dataUrl = await fileToDataUrl(file);
        setForm((prev) => ({
          ...prev,
          [field]: dataUrl,
        }));
        setState((prev) => ({
          ...prev,
          error: '',
          success: 'Imagen cargada. Guarda la configuracion para dejarla activa.',
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'No se pudo cargar la imagen.',
        }));
      }
    };

  const handleAddGalleryImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    try {
      const items = await Promise.all(
        files.map(async (file) => ({
          id: createGalleryId(),
          nombre: file.name,
          descripcion: null,
          dataUrl: await fileToDataUrl(file),
        }))
      );

      setForm((prev) => ({
        ...prev,
        publicPrizeGallery: [...prev.publicPrizeGallery, ...items],
      }));
      setState((prev) => ({
        ...prev,
        error: '',
        success: 'Imagenes agregadas a la galeria. Guarda la configuracion para confirmarlas.',
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'No se pudieron cargar las imagenes.',
      }));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState({ saving: true, error: '', success: '' });

    try {
      await saveConfig({
        ...config,
        ...form,
      });
      setState({
        saving: false,
        error: '',
        success: 'Configuracion de pagina web guardada correctamente.',
      });
    } catch (error) {
      setState({
        saving: false,
        error:
          error instanceof Error ? error.message : 'No se pudo guardar la configuracion web.',
        success: '',
      });
    }
  };

  return (
    <div>
      <Topbar title="Configuracion pagina web" />
      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={state.error} />
        {state.success ? <Toast message={state.success} /> : null}

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-800">Portada publica</h3>
              <p className="mt-1 text-sm text-slate-500">
                Define el texto principal, llamadas a la accion e imagen destacada del home o de
                la rifa publica.
              </p>

              <div className="mt-4 grid gap-4">
                <label className="text-sm">
                  <span className="text-slate-600">Titulo principal</span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={form.publicHeroTitle}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, publicHeroTitle: event.target.value }))
                    }
                    placeholder="Ej: Juega y gana un gran premio"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-slate-600">Subtitulo principal</span>
                  <textarea
                    className="mt-1 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={form.publicHeroSubtitle}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, publicHeroSubtitle: event.target.value }))
                    }
                    placeholder="Explica la rifa activa, loteria, premios y llamado comercial."
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm">
                    <span className="text-slate-600">Texto CTA principal</span>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={form.publicPrimaryCtaText}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, publicPrimaryCtaText: event.target.value }))
                      }
                      placeholder="Ej: Comprar boletas"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="text-slate-600">Texto CTA secundario</span>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={form.publicSecondaryCtaText}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          publicSecondaryCtaText: event.target.value,
                        }))
                      }
                      placeholder="Ej: Verificar compra"
                    />
                  </label>
                </div>
                <label className="text-sm">
                  <span className="text-slate-600">Imagen principal de portada</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 block w-full text-sm text-slate-600"
                    onChange={handleSingleImage('publicHeroImageDataUrl')}
                  />
                </label>
              </div>
            </section>

            <section className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-800">Quienes somos y soporte</h3>
              <p className="mt-1 text-sm text-slate-500">
                Esta informacion se usara en el home publico, contacto y bloques de confianza.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Estos campos se cargan por defecto con la informacion principal de la casa rifera,
                pero puedes ajustarlos de forma independiente para la pagina web.
              </p>

              <div className="mt-4 grid gap-4">
                <label className="text-sm">
                  <span className="text-slate-600">Texto quienes somos</span>
                  <textarea
                    className="mt-1 min-h-32 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={form.publicWhoWeAre}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, publicWhoWeAre: event.target.value }))
                    }
                    placeholder="Describe la casa rifera, trayectoria, confianza y cobertura."
                  />
                </label>
                <label className="text-sm">
                  <span className="text-slate-600">Texto de soporte o ayuda</span>
                  <textarea
                    className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={form.publicSupportText}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, publicSupportText: event.target.value }))
                    }
                    placeholder="Ej: Si tienes dudas o no ves tu compra, escribenos por WhatsApp."
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm">
                    <span className="text-slate-600">Telefono publico</span>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={form.publicContactPhone}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, publicContactPhone: event.target.value }))
                      }
                    />
                  </label>
                  <label className="text-sm">
                    <span className="text-slate-600">WhatsApp publico</span>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={form.publicContactWhatsapp}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          publicContactWhatsapp: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm">
                    <span className="text-slate-600">Email publico</span>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={form.publicContactEmail}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, publicContactEmail: event.target.value }))
                      }
                    />
                  </label>
                  <label className="text-sm">
                    <span className="text-slate-600">Direccion publica</span>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={form.publicAddress}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, publicAddress: event.target.value }))
                      }
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm">
                    <span className="text-slate-600">Ciudad</span>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={form.publicCity}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, publicCity: event.target.value }))
                      }
                    />
                  </label>
                  <label className="text-sm">
                    <span className="text-slate-600">Departamento</span>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={form.publicDepartment}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, publicDepartment: event.target.value }))
                      }
                    />
                  </label>
                </div>
              </div>
            </section>

            <section className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-800">Galeria institucional y boleta publica</h3>
              <p className="mt-1 text-sm text-slate-500">
                Aqui van fotos generales de la casa rifera, entrega de premios, ubicacion o confianza. El carrusel del premio ya se administra desde `Premios`.
              </p>

              <div className="mt-4 grid gap-4">
                <label className="text-sm">
                  <span className="text-slate-600">Galeria institucional</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="mt-1 block w-full text-sm text-slate-600"
                    onChange={handleAddGalleryImages}
                  />
                </label>

                {form.publicPrizeGallery.length ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {form.publicPrizeGallery.map((item) => (
                      <div
                        key={item.id}
                        className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                      >
                        <img
                          src={item.dataUrl}
                          alt={item.nombre || 'Premio'}
                          className="h-40 w-full object-cover"
                        />
                        <div className="space-y-3 p-3">
                          <input
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                            value={item.nombre || ''}
                            onChange={(event) =>
                              setForm((prev) => ({
                                ...prev,
                                publicPrizeGallery: prev.publicPrizeGallery.map((galleryItem) =>
                                  galleryItem.id === item.id
                                    ? { ...galleryItem, nombre: event.target.value }
                                    : galleryItem
                                ),
                              }))
                            }
                            placeholder="Titulo corto de la imagen"
                          />
                          <textarea
                            className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                            value={item.descripcion || ''}
                            onChange={(event) =>
                              setForm((prev) => ({
                                ...prev,
                                publicPrizeGallery: prev.publicPrizeGallery.map((galleryItem) =>
                                  galleryItem.id === item.id
                                    ? { ...galleryItem, descripcion: event.target.value }
                                    : galleryItem
                                ),
                              }))
                            }
                            placeholder="Descripcion visible de la foto"
                          />
                          <button
                            type="button"
                            className="rounded-md border border-rose-300 px-3 py-2 text-sm text-rose-700"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                publicPrizeGallery: prev.publicPrizeGallery.filter(
                                  (galleryItem) => galleryItem.id !== item.id
                                ),
                              }))
                            }
                          >
                            Quitar imagen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                <label className="text-sm">
                  <span className="text-slate-600">Fondo de ficha publica de boleta</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 block w-full text-sm text-slate-600"
                    onChange={handleSingleImage('publicTicketBackgroundDataUrl')}
                  />
                </label>
              </div>
            </section>

            <section className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-800">Legal y redes</h3>
              <p className="mt-1 text-sm text-slate-500">
                Textos de terminos y enlaces publicos para la pagina web.
              </p>

              <div className="mt-4 grid gap-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="text-sm">
                    <span className="text-slate-600">Facebook</span>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={form.publicFacebookUrl}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, publicFacebookUrl: event.target.value }))
                      }
                    />
                  </label>
                  <label className="text-sm">
                    <span className="text-slate-600">Instagram</span>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={form.publicInstagramUrl}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, publicInstagramUrl: event.target.value }))
                      }
                    />
                  </label>
                  <label className="text-sm">
                    <span className="text-slate-600">TikTok</span>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={form.publicTiktokUrl}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, publicTiktokUrl: event.target.value }))
                      }
                    />
                  </label>
                </div>

                <label className="text-sm">
                  <span className="text-slate-600">Terminos y condiciones publicos</span>
                  <textarea
                    className="mt-1 min-h-32 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={form.publicTermsText}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, publicTermsText: event.target.value }))
                    }
                    placeholder="Texto legal visible antes del checkout o la compra."
                  />
                </label>
              </div>
            </section>

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
                disabled={state.saving}
              >
                {state.saving ? 'Guardando...' : 'Guardar configuracion web'}
              </button>
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-800">Vista previa publica</h3>
              <div
                className="mt-4 overflow-hidden rounded-[1.75rem] border text-white shadow-sm"
                style={{
                  borderColor: `${config.themeColors.sidebarActiveBg}55`,
                  background: form.publicHeroImageDataUrl
                    ? `linear-gradient(rgba(2,6,23,0.68), rgba(2,6,23,0.82)), url(${form.publicHeroImageDataUrl}) center/cover`
                    : `linear-gradient(135deg, ${config.themeColors.topbarBg}, ${config.themeColors.sidebarActiveBg})`,
                  color: config.themeColors.topbarText || '#ffffff',
                }}
              >
                <div
                  className="border-b px-5 py-4"
                  style={{
                    borderColor: 'rgba(255,255,255,0.16)',
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04))',
                  }}
                >
                  <div className="flex items-center gap-3">
                    {config.logoDataUrl ? (
                      <img
                        src={config.logoDataUrl}
                        alt={config.nombreCasaRifera}
                        className="h-14 w-14 rounded-2xl border bg-white object-contain p-2 shadow-sm"
                        style={{ borderColor: 'rgba(255,255,255,0.22)' }}
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-sm font-semibold text-white">
                        {config.nombreCasaRifera.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-white/70">
                        Casa rifera
                      </p>
                      <p className="text-lg font-semibold text-white">
                        {config.nombreCasaRifera}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 p-5">
                  <h4 className="text-2xl font-semibold text-white">
                    {form.publicHeroTitle || config.nombreCasaRifera}
                  </h4>
                  <p className="text-sm text-white/85">
                    {form.publicHeroSubtitle || 'Aqui se mostrara la rifa activa y el mensaje principal del sitio.'}
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <span
                      className="rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm"
                      style={{ background: config.themeColors.sidebarActiveBg }}
                    >
                      {form.publicPrimaryCtaText || 'Comprar boletas'}
                    </span>
                    <span
                      className="rounded-full border px-4 py-2 text-sm text-white"
                      style={{ borderColor: 'rgba(255,255,255,0.28)' }}
                    >
                      {form.publicSecondaryCtaText || 'Verificar compra'}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-800">Contacto publico</h3>
              <div
                className="mt-4 rounded-2xl border p-4"
                style={{
                  borderColor: `${config.themeColors.sidebarActiveBg}33`,
                  background: `linear-gradient(145deg, ${config.themeColors.topbarBg}08, white)`,
                }}
              >
                <div className="space-y-2 text-sm text-slate-600">
                  <p><span className="font-medium text-slate-800">Telefono:</span> {form.publicContactPhone || 'N/D'}</p>
                  <p><span className="font-medium text-slate-800">WhatsApp:</span> {form.publicContactWhatsapp || 'N/D'}</p>
                  <p><span className="font-medium text-slate-800">Email:</span> {form.publicContactEmail || 'N/D'}</p>
                  <p>
                    <span className="font-medium text-slate-800">Ubicacion:</span>{' '}
                    {[form.publicAddress, form.publicCity, form.publicDepartment]
                      .filter(Boolean)
                      .join(' - ') || 'N/D'}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-800">Ficha publica de boleta</h3>
              <div
                className="mt-4 overflow-hidden rounded-2xl border"
                style={{ borderColor: `${config.themeColors.sidebarActiveBg}33` }}
              >
                {form.publicTicketBackgroundDataUrl ? (
                  <img
                    src={form.publicTicketBackgroundDataUrl}
                    alt="Fondo de boleta publica"
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-slate-100 text-sm text-slate-500">
                    Sin fondo cargado
                  </div>
                )}
                <div
                  className="space-y-2 border-t p-4 text-sm"
                  style={{
                    borderColor: `${config.themeColors.sidebarActiveBg}22`,
                    background: `linear-gradient(145deg, ${config.themeColors.topbarBg}08, white)`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    {config.logoDataUrl ? (
                      <img
                        src={config.logoDataUrl}
                        alt={config.nombreCasaRifera}
                        className="h-10 w-10 rounded-xl border bg-white object-contain p-1"
                        style={{ borderColor: `${config.themeColors.sidebarActiveBg}33` }}
                      />
                    ) : null}
                    <p className="font-semibold text-slate-900">{config.nombreCasaRifera}</p>
                  </div>
                  <p className="text-slate-600">Numero: 0001</p>
                  <p className="text-slate-600">Estado: PAGADA / JUGANDO</p>
                  <p className="text-slate-600">Comprador: Cliente publico</p>
                </div>
              </div>
            </section>

            {form.publicPrizeGallery.length ? (
              <section className="rounded-lg bg-white p-6 shadow-sm">
                <h3 className="text-base font-semibold text-slate-800">Vista previa de galeria institucional</h3>
                <div className="mt-4 grid gap-4">
                  {form.publicPrizeGallery.map((item) => (
                    <div key={item.id} className="overflow-hidden rounded-xl border border-slate-200">
                      <img
                        src={item.dataUrl}
                        alt={item.nombre || 'Galeria institucional'}
                        className="h-40 w-full object-cover"
                      />
                      <div className="space-y-1 p-4 text-sm">
                        <p className="font-medium text-slate-900">{item.nombre || 'Sin titulo'}</p>
                        <p className="text-slate-500">{item.descripcion || 'Sin descripcion'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </form>
      </div>
    </div>
  );
};

export default ConfiguracionWebPage;
