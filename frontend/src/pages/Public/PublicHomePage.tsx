import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import { useAppConfig } from '../../context/AppConfigContext';
import { formatDateTimeLong } from '../../utils/dates';
import { formatCOP } from '../../utils/money';
import PublicNavbar from './PublicNavbar';

type RifaItem = {
  id: string;
  nombre: string;
  loteriaNombre: string;
  numeroCifras: number;
  fechaFin: string;
  precioBoleta: number | string;
  estado: string;
  _count?: {
    boletas: number;
    premios: number;
  };
};

type PremioImage = {
  id: string;
  nombre?: string | null;
  descripcion?: string | null;
  dataUrl: string;
};

type PremioResumen = {
  id: string;
  nombre: string;
  tipo: string;
  fecha: string;
  imagenesJson?: PremioImage[] | null;
};

type RifaDetailLite = {
  id: string;
  premios: PremioResumen[];
};

const GALLERY_PAGE_SIZE = 4;

const PublicHomePage = () => {
  const { config, loading: loadingConfig } = useAppConfig();
  const [rifas, setRifas] = useState<RifaItem[]>([]);
  const [rifaDetails, setRifaDetails] = useState<Record<string, RifaDetailLite>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRifaIndex, setActiveRifaIndex] = useState(0);
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(0);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await client.get(endpoints.rifas());
        const nextRifas = data as RifaItem[];
        setRifas(nextRifas);

        const activeIds = nextRifas
          .filter((item) => item.estado === 'ACTIVA')
          .map((item) => item.id);

        if (activeIds.length) {
          const detailResponses = await Promise.all(
            activeIds.map(async (rifaId) => {
              const detailResponse = await client.get<RifaDetailLite>(endpoints.rifaById(rifaId));
              return [rifaId, detailResponse.data] as const;
            })
          );

          setRifaDetails(Object.fromEntries(detailResponses));
        }
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const rifasActivas = useMemo(
    () => rifas.filter((item) => item.estado === 'ACTIVA'),
    [rifas]
  );

  useEffect(() => {
    setActiveRifaIndex((current) => {
      if (!rifasActivas.length) return 0;
      return Math.min(current, rifasActivas.length - 1);
    });
  }, [rifasActivas.length]);

  const heroRifa = rifasActivas[activeRifaIndex] || null;
  const institutionalGallery = config.publicPrizeGallery || [];
  const activeInstitutionalImage = institutionalGallery[selectedGalleryIndex] || null;

  useEffect(() => {
    setGalleryStartIndex((current) => {
      if (!institutionalGallery.length) return 0;
      return Math.min(current, Math.max(0, institutionalGallery.length - GALLERY_PAGE_SIZE));
    });
  }, [institutionalGallery.length]);

  const heroPremioMayor = useMemo(() => {
    if (!heroRifa) return null;
    const detail = rifaDetails[heroRifa.id];
    if (!detail?.premios?.length) return null;

    return (
      detail.premios.find((premio) => premio.tipo === 'MAYOR') ||
      detail.premios.find((premio) => premio.nombre.toUpperCase().includes('MAYOR')) ||
      detail.premios[detail.premios.length - 1]
    );
  }, [heroRifa, rifaDetails]);

  const heroImage =
    heroPremioMayor?.imagenesJson?.find((image) => image.dataUrl)?.dataUrl ||
    config.publicHeroImageDataUrl ||
    null;

  const heroStyle = useMemo(() => {
    const base = config.publicHeroImageDataUrl
      ? `linear-gradient(115deg, rgba(3, 7, 18, 0.88), rgba(15, 23, 42, 0.52)), url(${config.publicHeroImageDataUrl})`
      : `linear-gradient(135deg, ${config.themeColors.topbarBg}, ${config.themeColors.sidebarActiveBg})`;

    return {
      backgroundImage: base,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    } as const;
  }, [
    config.publicHeroImageDataUrl,
    config.themeColors.sidebarActiveBg,
    config.themeColors.topbarBg,
  ]);

  const visibleInstitutionalGallery = institutionalGallery.slice(
    galleryStartIndex,
    galleryStartIndex + GALLERY_PAGE_SIZE
  );

  const publicAddress = [
    config.publicAddress?.trim() || config.responsableDireccion?.trim(),
    config.publicCity?.trim() || config.responsableCiudad?.trim(),
    config.publicDepartment?.trim() || config.responsableDepartamento?.trim(),
  ]
    .filter((part): part is string => Boolean(part))
    .join(' - ');

  if (loading || loadingConfig) {
    return <Loading label="Cargando sitio publico..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <ErrorBanner message={error} />

      <PublicNavbar ctaHref={heroRifa ? `/publico/rifas/${heroRifa.id}` : undefined} />

      <main>
        <section style={heroStyle} className="relative overflow-hidden">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 text-white lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.32em] text-white/70">Casa rifera</p>
              <h2 className="max-w-4xl text-4xl font-black leading-tight md:text-6xl">
                {config.publicHeroTitle || config.nombreCasaRifera}
              </h2>
              <p className="max-w-3xl text-lg leading-8 text-white/88">
                {config.publicHeroSubtitle ||
                  (heroRifa
                    ? `${heroRifa.nombre} juega con la ${heroRifa.loteriaNombre}. Compra tus boletas y sigue el estado de tu participacion.`
                    : 'Conoce nuestras rifas activas, premios y canales oficiales de participacion.')}
              </p>

              <div className="flex flex-wrap gap-4">
                {heroRifa ? (
                  <Link
                    to={`/publico/rifas/${heroRifa.id}`}
                    className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900"
                  >
                    {config.publicPrimaryCtaText || 'Comprar boletas'}
                  </Link>
                ) : null}
                <a
                  href="#contacto"
                  className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white"
                >
                  {config.publicSecondaryCtaText || 'Verificar compra'}
                </a>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur">
              <p className="text-xs uppercase tracking-[0.28em] text-white/65">Rifa destacada</p>
              {heroRifa ? (
                <div className="mt-5 space-y-4">
                  <h3 className="text-3xl font-black">{heroRifa.nombre}</h3>
                  <p className="text-white/85">
                    {heroRifa.loteriaNombre} - {heroRifa.numeroCifras} cifras
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/65">Valor</p>
                      <p className="mt-2 text-2xl font-bold">{formatCOP(heroRifa.precioBoleta)}</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/65">Cierre</p>
                      <p className="mt-2 text-base font-semibold">
                        {formatDateTimeLong(heroRifa.fechaFin)}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/publico/rifas/${heroRifa.id}`}
                    className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900"
                  >
                    Ver detalle de la rifa
                  </Link>
                </div>
              ) : (
                <p className="mt-4 text-white/80">
                  No hay una rifa activa configurada en este momento.
                </p>
              )}
            </div>
          </div>
        </section>

        <section id="rifas" className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Rifas activas</p>
              <h3 className="mt-2 text-4xl font-black">Participa desde la web</h3>
            </div>
            {rifasActivas.length > 1 ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setActiveRifaIndex((current) =>
                      current === 0 ? rifasActivas.length - 1 : current - 1
                    )
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-lg font-bold text-slate-700 shadow-sm"
                  aria-label="Rifa anterior"
                >
                  {'<'}
                </button>
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">
                  {activeRifaIndex + 1} / {rifasActivas.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setActiveRifaIndex((current) =>
                      current === rifasActivas.length - 1 ? 0 : current + 1
                    )
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-lg font-bold text-slate-700 shadow-sm"
                  aria-label="Rifa siguiente"
                >
                  {'>'}
                </button>
              </div>
            ) : null}
          </div>

          <div>
            {heroRifa ? (
              <article className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="grid gap-0 lg:grid-cols-[1.45fr_1fr]">
                  <div className="relative min-h-[36rem] overflow-hidden bg-slate-100">
                    {heroImage ? (
                      <img
                        src={heroImage}
                        alt={heroPremioMayor?.nombre || heroRifa.nombre}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{
                          background: `linear-gradient(135deg, ${config.themeColors.topbarBg}, ${config.themeColors.sidebarActiveBg})`,
                        }}
                      />
                    )}
                  </div>

                  <div className="flex flex-col justify-between gap-6 p-8 lg:p-10">
                    <div className="space-y-5">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Rifa activa</p>
                        <h4 className="mt-2 text-4xl font-black">{heroRifa.nombre}</h4>
                        <p className="mt-3 text-base text-slate-600">
                          {heroRifa.loteriaNombre} - {heroRifa.numeroCifras} cifras
                        </p>
                        {heroPremioMayor?.descripcion ? (
                          <p className="mt-5 max-w-xl whitespace-pre-line text-base leading-8 text-slate-700">
                            {heroPremioMayor.descripcion}
                          </p>
                        ) : null}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Precio</p>
                          <p className="mt-3 text-2xl font-black">{formatCOP(heroRifa.precioBoleta)}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Boletas</p>
                          <p className="mt-3 text-2xl font-black">{heroRifa._count?.boletas || 0}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Premios</p>
                          <p className="mt-3 text-2xl font-black">{heroRifa._count?.premios || 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        to={`/publico/rifas/${heroRifa.id}`}
                        className="inline-flex rounded-full px-6 py-3 text-sm font-semibold text-white"
                        style={{ background: config.themeColors.sidebarActiveBg }}
                      >
                        Ver rifa
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ) : (
              <EmptyState
                title="No hay rifas activas"
                description="Cuando exista una rifa activa aparecera aqui con su acceso directo para compra y consulta."
              />
            )}
          </div>
        </section>

        <section id="quienes-somos" className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Quienes somos</p>
              <h3 className="mt-3 text-3xl font-black">{config.nombreCasaRifera}</h3>
              <p className="mt-5 whitespace-pre-line text-base leading-8 text-slate-700">
                {config.publicWhoWeAre ||
                  'Esta seccion permite contar la historia de la casa rifera, como se entregan los premios y por que el publico puede confiar en el proceso.'}
              </p>

              {publicAddress ? (
                <p className="mt-6 text-base leading-8 text-slate-700">
                  {`📍 Direccion: ${publicAddress}`}
                </p>
              ) : null}
            </div>

            <div className="space-y-4">
              {institutionalGallery.length ? (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Galeria institucional</p>
                      <h3 className="mt-2 text-2xl font-black text-slate-900">Conoce la casa rifera</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setGalleryStartIndex((current) =>
                            Math.max(0, current - 1)
                          )
                        }
                        disabled={galleryStartIndex === 0}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-lg font-bold text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-35"
                        aria-label="Galeria anterior"
                      >
                        {'<'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setGalleryStartIndex((current) =>
                            Math.min(
                              Math.max(0, institutionalGallery.length - GALLERY_PAGE_SIZE),
                              current + 1
                            )
                          )
                        }
                        disabled={galleryStartIndex + GALLERY_PAGE_SIZE >= institutionalGallery.length}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-lg font-bold text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-35"
                        aria-label="Galeria siguiente"
                      >
                        {'>'}
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                      {visibleInstitutionalGallery.map((image) => {
                        const galleryIndex = institutionalGallery.findIndex(
                          (galleryImage) => galleryImage.id === image.id
                        );

                        return (
                          <button
                            key={image.id}
                            type="button"
                            onClick={() => {
                              setSelectedGalleryIndex(Math.max(0, galleryIndex));
                              setIsGalleryModalOpen(true);
                            }}
                            className="group overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-sm"
                          >
                            <img
                              src={image.dataUrl}
                              alt={image.descripcion || image.nombre || config.nombreCasaRifera}
                              className="h-52 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
                  Aqui apareceran fotos institucionales como entrega de premios, ubicacion o evidencias de la casa rifera.
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="reglamento" className="mx-auto max-w-7xl px-6 py-10">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Reglamento</p>
                <h3 className="mt-2 text-3xl font-black">Condiciones de participacion</h3>
              </div>
              {config.reglamentoDataUrl ? (
                <a
                  href={config.reglamentoDataUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900"
                >
                  Ver reglamento
                </a>
              ) : null}
            </div>
            <p className="mt-4 text-base leading-8 text-slate-700">
              {config.publicTermsText ||
                'Aqui se mostraran los terminos, condiciones y el reglamento oficial de la rifa para consulta del publico.'}
            </p>
          </div>
        </section>

        <section id="contacto" className="mx-auto max-w-7xl px-6 py-10 pb-20">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-sm">
              <p className="text-sm uppercase tracking-[0.25em] text-white/60">Contacto publico</p>
              <h3 className="mt-3 text-3xl font-black">Atencion y soporte</h3>
              <p className="mt-4 text-base leading-8 text-white/80">
                {config.publicSupportText ||
                  'Si necesitas apoyo con una compra o verificar tu participacion, aqui quedaran visibles los canales oficiales de la casa rifera.'}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Telefono</p>
                <p className="mt-3 text-lg font-bold text-slate-900">
                  {config.publicContactPhone || config.responsableTelefono || 'No configurado'}
                </p>
              </div>
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">WhatsApp</p>
                <p className="mt-3 text-lg font-bold text-slate-900">
                  {config.publicContactWhatsapp || config.responsableTelefono || 'No configurado'}
                </p>
              </div>
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Email</p>
                <p className="mt-3 text-lg font-bold text-slate-900">
                  {config.publicContactEmail || 'No configurado'}
                </p>
              </div>
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Ubicacion</p>
                <p className="mt-3 text-lg font-bold text-slate-900">
                  {publicAddress || 'No configurada'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {isGalleryModalOpen && activeInstitutionalImage ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-6"
          onClick={() => setIsGalleryModalOpen(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-[92vw] overflow-auto rounded-[2rem] bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsGalleryModalOpen(false)}
              className="sticky right-0 top-0 z-10 ml-auto flex h-11 w-11 items-center justify-center rounded-full border bg-white text-2xl text-slate-700 shadow-sm"
            >
              x
            </button>
            <img
              src={activeInstitutionalImage.dataUrl}
              alt={
                activeInstitutionalImage.descripcion ||
                activeInstitutionalImage.nombre ||
                config.nombreCasaRifera
              }
              className="max-h-[78vh] w-auto max-w-full rounded-[1.4rem] object-contain"
            />
            {activeInstitutionalImage.descripcion ? (
              <div className="px-2 pb-2 pt-5">
                <p className="text-base leading-7 text-slate-700">
                  {activeInstitutionalImage.descripcion}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PublicHomePage;
