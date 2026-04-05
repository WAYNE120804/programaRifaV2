import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import { useAppConfig } from '../../context/AppConfigContext';
import { formatDateTimeLong } from '../../utils/dates';
import { formatCOP } from '../../utils/money';
import PublicNavbar from './PublicNavbar';

type PremioImage = { id: string; nombre?: string | null; descripcion?: string | null; dataUrl: string };
type PremioItem = {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  mostrarValor: boolean;
  valor: number | string | null;
  fecha: string;
  imagenesJson?: PremioImage[] | null;
};
type RifaDetail = {
  id: string;
  nombre: string;
  loteriaNombre: string;
  numeroCifras: number;
  fechaFin: string;
  precioBoleta: number | string;
  premios: PremioItem[];
};
type PublicBoletaItem = {
  id: string;
  numero: string;
  estado: 'ASIGNADA' | 'RESERVADA' | 'VENDIDA' | 'PAGADA';
  precio: number | string;
  reservadaHasta?: string | null;
};
type PublicBoletasResponse = {
  relation: { id: string; vendedor: { id: string; nombre: string } } | null;
  boletas: PublicBoletaItem[];
};
type ReservaResponse = {
  id: string;
  referencia: string;
  expiresAt: string;
  cliente: {
    id: string;
    nombre: string;
    telefono: string;
    documento: string;
    email: string | null;
  };
  boletas: Array<{
    id: string;
    numero: string;
    precio: number | string;
  }>;
  total: number | string;
};
type WompiCheckoutResponse = {
  reservaId: string;
  reference: string;
  publicKey: string;
  amountInCents: number;
  currency: string;
  expirationTime: string;
  integritySignature: string;
  integritySource: string;
  redirectUrl: string;
  checkoutUrl: string;
  wompiEnv: string;
  customerData: {
    fullName: string;
    phoneNumber: string | null;
    email: string | null;
  };
};

declare global {
  interface Window {
    WidgetCheckout?: new (config: {
      currency: string;
      amountInCents: number;
      reference: string;
      publicKey: string;
      signature: { integrity: string };
      redirectUrl?: string;
      expirationTime?: string;
      customerData?: {
        email?: string;
        fullName?: string;
        phoneNumber?: string;
        phoneNumberPrefix?: string;
        legalId?: string;
        legalIdType?: string;
      };
    }) => {
      open: (callback?: (result: unknown) => void) => void;
    };
  }
}

const INITIAL_CLIENT_FORM = {
  nombre: '',
  documento: '',
  telefono: '',
  email: '',
};

const RANGE_PAGE_SIZE = 56;
const getRangeSize = (digits: number) => 10 ** Math.max(digits - 1, 0);
const padNumber = (value: number, digits: number) => String(value).padStart(digits, '0');
const ANTICIPADO_COLORS = [
  { border: '#f59e0b33', background: '#fff7ed', accent: '#b45309' },
  { border: '#14b8a633', background: '#ecfeff', accent: '#0f766e' },
  { border: '#8b5cf633', background: '#f5f3ff', accent: '#6d28d9' },
  { border: '#ef444433', background: '#fef2f2', accent: '#b91c1c' },
];
const MAYOR_COLOR = { border: '#16a34a44', background: '#f0fdf4', accent: '#166534' };

const PublicRifaPage = () => {
  const { id = '' } = useParams();
  const { config, loading: configLoading } = useAppConfig();
  const [rifa, setRifa] = useState<RifaDetail | null>(null);
  const [publicBoletas, setPublicBoletas] = useState<PublicBoletaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boletasLoading, setBoletasLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(0);
  const [selectedRangePage, setSelectedRangePage] = useState(0);
  const [numeroBusqueda, setNumeroBusqueda] = useState('');
  const [selectedBoletaIds, setSelectedBoletaIds] = useState<string[]>([]);
  const [clientForm, setClientForm] = useState(INITIAL_CLIENT_FORM);
  const [submittingReserva, setSubmittingReserva] = useState(false);
  const [launchingCheckout, setLaunchingCheckout] = useState(false);
  const [reservaError, setReservaError] = useState<string | null>(null);
  const [reservaResult, setReservaResult] = useState<ReservaResponse | null>(null);
  const [isReservaModalOpen, setIsReservaModalOpen] = useState(false);
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState<WompiCheckoutResponse | null>(null);
  const [pagoError, setPagoError] = useState<string | null>(null);
  const [shouldOpenPagoAfterReserva, setShouldOpenPagoAfterReserva] = useState(false);
  const [wompiWidgetReady, setWompiWidgetReady] = useState(false);
  const [openingWidget, setOpeningWidget] = useState(false);
  const galleryScrollRef = useRef<HTMLDivElement | null>(null);
  const compraSectionRef = useRef<HTMLElement | null>(null);

  const loadPublicData = async () => {
    const [{ data: rifaData }, { data: boletasData }] = await Promise.all([
      client.get(endpoints.rifaById(id)),
      client.get<PublicBoletasResponse>(endpoints.boletasPublicas(), { params: { rifaId: id } }),
    ]);
    setRifa(rifaData);
    setPublicBoletas(boletasData.boletas || []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadPublicData();
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoading(false);
        setBoletasLoading(false);
      }
    };
    void load();
  }, [id]);

  useEffect(() => {
    const existingScript = document.querySelector(
      'script[data-wompi-widget="true"]'
    ) as HTMLScriptElement | null;

    if (existingScript) {
      setWompiWidgetReady(Boolean(window.WidgetCheckout));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;
    script.dataset.wompiWidget = 'true';
    script.onload = () => {
      setWompiWidgetReady(Boolean(window.WidgetCheckout));
    };
    script.onerror = () => {
      setWompiWidgetReady(false);
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!shouldOpenPagoAfterReserva || !reservaResult?.id) {
      return;
    }

    const timer = window.setTimeout(() => {
      void handleAbrirPagoModal();
      setShouldOpenPagoAfterReserva(false);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [reservaResult?.id, shouldOpenPagoAfterReserva]);

  const premiosOrdenados = useMemo(
    () => [...(rifa?.premios || [])].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()),
    [rifa?.premios]
  );

  const premioMayor = useMemo(() => {
    if (!premiosOrdenados.length) return null;
    return (
      premiosOrdenados.find((premio) => premio.tipo === 'MAYOR') ||
      premiosOrdenados.find((premio) => premio.nombre.toUpperCase().includes('MAYOR')) ||
      premiosOrdenados[premiosOrdenados.length - 1]
    );
  }, [premiosOrdenados]);

  const premiosAnticipados = useMemo(
    () => premiosOrdenados.filter((premio) => premio.id !== premioMayor?.id),
    [premioMayor?.id, premiosOrdenados]
  );

  const premioMayorImages = useMemo(
    () => (premioMayor?.imagenesJson || []).filter((image) => Boolean(image.dataUrl)),
    [premioMayor?.imagenesJson]
  );

  useEffect(() => {
    setActiveImageIndex(0);
  }, [premioMayor?.id]);

  const activeImage = premioMayorImages[activeImageIndex] || null;
  const activeImageSrc = activeImage?.dataUrl || config.publicHeroImageDataUrl || null;
  const activeImageAlt =
    activeImage?.descripcion || activeImage?.nombre || premioMayor?.nombre || rifa?.nombre || 'Premio';

  const publicRangeSize = useMemo(() => (rifa ? getRangeSize(rifa.numeroCifras) : 1000), [rifa]);
  const publicRanges = useMemo(() => {
    if (!rifa) return [];
    const total = 10 ** rifa.numeroCifras;
    const ranges = [];
    for (let start = 0; start < total; start += publicRangeSize) {
      const end = Math.min(start + publicRangeSize - 1, total - 1);
      ranges.push({ start, end, label: `${padNumber(start, rifa.numeroCifras)} - ${padNumber(end, rifa.numeroCifras)}` });
    }
    return ranges;
  }, [publicRangeSize, rifa]);

  const filteredPublicBoletas = useMemo(() => {
    if (!rifa) return [];
    const range = publicRanges[selectedRangeIndex];
    const term = numeroBusqueda.trim();
    return publicBoletas.filter((boleta) => {
      const n = Number(boleta.numero);
      return (!range || (n >= range.start && n <= range.end)) && (!term || boleta.numero.includes(term));
    });
  }, [numeroBusqueda, publicBoletas, publicRanges, rifa, selectedRangeIndex]);

  const rangePageCount = Math.max(1, Math.ceil(filteredPublicBoletas.length / RANGE_PAGE_SIZE));
  const pagedPublicBoletas = useMemo(() => {
    const start = selectedRangePage * RANGE_PAGE_SIZE;
    return filteredPublicBoletas.slice(start, start + RANGE_PAGE_SIZE);
  }, [filteredPublicBoletas, selectedRangePage]);

  useEffect(() => setSelectedRangePage(0), [selectedRangeIndex, numeroBusqueda]);
  useEffect(() => {
    if (selectedRangePage >= rangePageCount) setSelectedRangePage(0);
  }, [rangePageCount, selectedRangePage]);

  const selectedBoletas = useMemo(
    () => publicBoletas.filter((boleta) => selectedBoletaIds.includes(boleta.id)),
    [publicBoletas, selectedBoletaIds]
  );
  const precioUnitarioSeleccionado = useMemo(
    () => Number(selectedBoletas[0]?.precio || rifa?.precioBoleta || 0),
    [rifa?.precioBoleta, selectedBoletas]
  );
  const totalSeleccionado = useMemo(
    () => selectedBoletas.reduce((sum, boleta) => sum + Number(boleta.precio || 0), 0),
    [selectedBoletas]
  );
  const publicLocation = [
    config.publicAddress?.trim() || config.responsableDireccion?.trim(),
    config.publicCity?.trim() || config.responsableCiudad?.trim(),
    config.publicDepartment?.trim() || config.responsableDepartamento?.trim(),
  ]
    .filter((part): part is string => Boolean(part))
    .join(', ');
  const googleMapsHref = publicLocation
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(publicLocation)}`
    : null;

  const focusCompraSection = () => compraSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const toggleBoletaSelection = (boleta: PublicBoletaItem) => {
    if (boleta.estado !== 'ASIGNADA') return;
    setReservaError(null);
    setSelectedBoletaIds((current) =>
      current.includes(boleta.id) ? current.filter((item) => item !== boleta.id) : [...current, boleta.id]
    );
  };
  const scrollGallery = (direction: 'left' | 'right') => {
    if (!galleryScrollRef.current) return;
    galleryScrollRef.current.scrollBy({ left: direction === 'left' ? -220 : 220, behavior: 'smooth' });
  };
  if (loading || configLoading) {
    return <div className="p-8"><Loading label="Cargando rifa publica..." /></div>;
  }
  if (!rifa) {
    return <div className="min-h-screen bg-slate-50 p-8"><ErrorBanner message={error || 'No se pudo cargar la rifa publica.'} /></div>;
  }

  const handleClientFieldChange =
    (field: keyof typeof INITIAL_CLIENT_FORM) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;
      const value =
        field === 'documento' || field === 'telefono'
          ? rawValue.replace(/[^\d+]/g, '')
          : rawValue;

      setClientForm((current) => ({
        ...current,
        [field]: value,
      }));
    };

  const handleSubmitReserva = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedBoletaIds.length) {
      setReservaError('Selecciona al menos una boleta para continuar.');
      focusCompraSection();
      return;
    }

    setSubmittingReserva(true);
    setReservaError(null);

    try {
      const { data } = await client.post<ReservaResponse>(endpoints.checkoutPublicoReservas(), {
        rifaId: id,
        boletaIds: selectedBoletaIds,
        cliente: clientForm,
      });

      setReservaResult(data);
      setSelectedBoletaIds([]);
      setClientForm(INITIAL_CLIENT_FORM);
      setIsReservaModalOpen(false);
      setShouldOpenPagoAfterReserva(true);
      await loadPublicData();
    } catch (requestError) {
      setReservaError((requestError as Error).message);
      await loadPublicData();
    } finally {
      setSubmittingReserva(false);
    }
  };

  const handleCancelarReserva = () => {
    setIsReservaModalOpen(false);
    setReservaError(null);
    setClientForm(INITIAL_CLIENT_FORM);
    setSelectedBoletaIds([]);
  };

  const handleSeguirViendo = () => {
    setIsReservaModalOpen(false);
    setReservaError(null);
  };

  const handleAbrirPagoModal = async () => {
    if (!reservaResult?.id) {
      return;
    }

    setLaunchingCheckout(true);
    setReservaError(null);
    setPagoError(null);
    setCheckoutData(null);
    setIsPagoModalOpen(false);

    try {
      const { data } = await client.post<WompiCheckoutResponse>(
        endpoints.checkoutPublicoReservaWompi(reservaResult.id)
      );

      setCheckoutData(data);
      setIsPagoModalOpen(true);
    } catch (requestError) {
      setPagoError((requestError as Error).message);
    } finally {
      setLaunchingCheckout(false);
    }
  };

  const handleAbrirWidgetWompi = () => {
    if (!checkoutData) {
      setPagoError('No se pudo preparar la configuracion del pago.');
      return;
    }

    setOpeningWidget(true);

    if (!window.WidgetCheckout) {
      setWompiWidgetReady(false);
      setPagoError('El widget de Wompi no esta disponible en esta pagina. Usa la apertura directa del checkout.');
      setOpeningWidget(false);
      return;
    }

    try {
      setPagoError(null);

      const checkout = new window.WidgetCheckout({
        currency: checkoutData.currency,
        amountInCents: checkoutData.amountInCents,
        reference: checkoutData.reference,
        publicKey: checkoutData.publicKey,
        signature: {
          integrity: checkoutData.integritySignature,
        },
      });

      checkout.open(() => undefined);
    } catch (error) {
      setPagoError(
        `El widget no se pudo abrir: ${(error as Error).message || 'error desconocido'}. Usa la apertura directa del checkout.`
      );
    } finally {
      setOpeningWidget(false);
    }
  };

  const handleAbrirCheckoutDirecto = () => {
    if (!checkoutData?.checkoutUrl) {
      setPagoError('No existe URL de checkout disponible.');
      return;
    }

    window.open(checkoutData.checkoutUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicNavbar showBackHome ctaHref="#comprar-boletas" />
      <main className="pb-28">
        <section className="border-b" style={{ borderColor: `${config.themeColors.sidebarActiveBg}22` }}>
          <div className="mx-auto max-w-7xl px-6 py-10">
            <ErrorBanner message={error} />
            <div className="grid items-start gap-8 lg:grid-cols-[1.22fr_0.78fr]">
              <article className="overflow-hidden rounded-[2.3rem] border bg-white shadow-sm" style={{ borderColor: `${config.themeColors.sidebarActiveBg}22` }}>
                <div className="overflow-hidden border-b bg-white" style={{ borderColor: `${config.themeColors.sidebarActiveBg}22` }}>
                  {activeImageSrc ? (
                    <button type="button" onClick={() => setIsImageModalOpen(true)} className="block w-full cursor-zoom-in" title="Ampliar imagen">
                      <img src={activeImageSrc} alt={activeImageAlt} className="max-h-[720px] w-full object-contain object-top" />
                    </button>
                  ) : (
                    <div className="flex h-[620px] items-center justify-center bg-slate-100 text-slate-500">Sin imagen principal</div>
                  )}
                </div>
                {premioMayorImages.length > 1 ? (
                  <div className="flex items-center gap-3 p-4">
                    <button type="button" onClick={() => scrollGallery('left')} className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xl text-slate-700 md:flex" style={{ borderColor: `${config.themeColors.sidebarActiveBg}33` }}>‹</button>
                    <div ref={galleryScrollRef} className="flex flex-1 gap-3 overflow-x-auto scroll-smooth pb-1">
                      {premioMayorImages.map((image, index) => (
                        <button key={image.id} type="button" onClick={() => { setActiveImageIndex(index); setIsImageModalOpen(true); }} className={`shrink-0 overflow-hidden rounded-[1.2rem] border ${index === activeImageIndex ? 'ring-2 ring-offset-2' : ''}`} style={{ borderColor: `${config.themeColors.sidebarActiveBg}33`, width: '132px' }}>
                          <img src={image.dataUrl} alt={image.descripcion || image.nombre || premioMayor?.nombre || 'Premio'} className="h-24 w-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={() => scrollGallery('right')} className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xl text-slate-700 md:flex" style={{ borderColor: `${config.themeColors.sidebarActiveBg}33` }}>›</button>
                  </div>
                ) : null}
              </article>

              <article className="rounded-[2.3rem] border bg-white/95 p-8 shadow-sm" style={{ borderColor: `${config.themeColors.sidebarActiveBg}22` }}>
                <p className="text-xs uppercase tracking-[0.32em]" style={{ color: config.themeColors.summaryLabelText }}>Premio destacado</p>
                <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_240px] lg:items-start">
                  <div>
                    <h1 className="text-4xl font-black leading-tight">{premioMayor?.nombre || rifa.nombre}</h1>
                  </div>
                  <div className="flex h-full min-h-[14rem] items-start">
                    <a
                      href="#comprar-boletas"
                      onClick={(event) => {
                        event.preventDefault();
                        focusCompraSection();
                      }}
                      className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-[1.9rem] border px-6 py-7 text-center text-white shadow-xl transition duration-300 hover:-translate-y-1"
                      style={{
                        borderColor: `${config.themeColors.sidebarActiveBg}66`,
                        background: `linear-gradient(135deg, ${config.themeColors.sidebarActiveBg}, ${config.themeColors.topbarBg})`,
                        boxShadow: `0 0 0 4px ${config.themeColors.sidebarActiveBg}18, 0 0 34px ${config.themeColors.sidebarActiveBg}77, 0 0 58px ${config.themeColors.sidebarActiveBg}55`,
                      }}
                    >
                      <span className="absolute inset-0 rounded-[1.9rem] animate-pulse" style={{ boxShadow: `inset 0 0 0 2px ${config.themeColors.sidebarActiveBg}22, 0 0 38px ${config.themeColors.sidebarActiveBg}bb` }} />
                      <span className="absolute -left-1/4 top-0 h-full w-20 -skew-x-12 animate-pulse bg-white/25 blur-lg" />
                      <span className="absolute left-3 top-3 h-5 w-5 rounded-full bg-white/55 shadow-[0_0_22px_rgba(255,255,255,0.95)] animate-ping" />
                      <span className="absolute right-5 top-5 h-4 w-4 rounded-full bg-white/80 shadow-[0_0_22px_rgba(255,255,255,0.95)] animate-bounce" />
                      <span className="absolute left-6 bottom-6 h-3 w-3 rounded-full bg-white/80 shadow-[0_0_18px_rgba(255,255,255,0.95)] animate-ping" />
                      <span className="absolute right-7 bottom-7 h-6 w-6 rounded-full border border-white/20 bg-white/10 animate-pulse" />
                      <span className="relative z-10 text-xs font-black uppercase tracking-[0.28em] text-white/75 animate-pulse">Tu numero te espera</span>
                      <span className="relative z-10 mt-3 text-3xl font-black uppercase leading-none animate-bounce">Comprar boletas</span>
                      <span className="relative z-10 mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-2 text-sm font-semibold text-white animate-pulse">
                        Ir a seleccion
                        <span aria-hidden="true">↓</span>
                      </span>
                    </a>
                  </div>
                </div>
                {premioMayor?.descripcion ? (
                  <div className="mt-6 rounded-[1.6rem] border bg-white px-6 py-5" style={{ borderColor: `${config.themeColors.sidebarActiveBg}18` }}>
                    <p className="whitespace-pre-line text-lg leading-8 text-slate-700">{premioMayor.descripcion}</p>
                  </div>
                ) : null}
                <div className="mt-6 space-y-4 rounded-[1.8rem] border p-5" style={{ borderColor: `${config.themeColors.sidebarActiveBg}20`, background: `${config.themeColors.sidebarActiveBg}08` }}>
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-xs uppercase tracking-[0.24em]" style={{ color: config.themeColors.summaryLabelText }}>Fecha de juego</p>
                    <p className="max-w-[70%] text-right text-lg font-bold leading-snug text-slate-900">{premioMayor ? formatDateTimeLong(premioMayor.fecha) : ''}</p>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-xs uppercase tracking-[0.24em]" style={{ color: config.themeColors.summaryLabelText }}>Juega con</p>
                    <p className="max-w-[70%] text-right text-lg font-bold leading-snug text-slate-900">{rifa.loteriaNombre}</p>
                  </div>
                <div className="grid gap-4 sm:grid-cols-[1fr_0.8fr_1.15fr]">
                  <div className="flex min-h-[9.75rem] min-w-0 flex-col justify-between rounded-[1.4rem] border p-4" style={{ borderColor: `${config.themeColors.sidebarActiveBg}18`, background: 'white' }}>
                    <p className="text-xs uppercase tracking-[0.24em]" style={{ color: config.themeColors.summaryLabelText }}>Precio</p>
                    <p className="mt-4 max-w-full text-[clamp(1.3rem,1.45vw,1.65rem)] font-black leading-tight tracking-tight text-slate-900 whitespace-nowrap">
                      {formatCOP(rifa.precioBoleta)}
                    </p>
                  </div>
                  <div className="flex min-h-[9.75rem] min-w-0 flex-col justify-between rounded-[1.4rem] border p-4" style={{ borderColor: `${config.themeColors.sidebarActiveBg}18`, background: 'white' }}>
                    <p className="text-xs uppercase tracking-[0.24em]" style={{ color: config.themeColors.summaryLabelText }}>Cifras</p>
                    <p className="mt-4 text-[clamp(1.45rem,1.6vw,1.7rem)] font-black leading-tight text-slate-900">{rifa.numeroCifras}</p>
                  </div>
                  <div className="flex min-h-[9.75rem] min-w-0 flex-col justify-between rounded-[1.4rem] border p-4" style={{ borderColor: `${config.themeColors.sidebarActiveBg}18`, background: 'white' }}>
                    <p className="text-xs uppercase tracking-[0.24em]" style={{ color: config.themeColors.summaryLabelText }}>Cierre</p>
                    <p className="mt-4 text-[1.02rem] font-bold leading-snug text-slate-900">{formatDateTimeLong(rifa.fechaFin)}</p>
                  </div>
                </div>
                </div>
                {premiosAnticipados.length ? (
                  <div className="mt-6 rounded-[1.8rem] border p-5" style={{ borderColor: `${config.themeColors.sidebarActiveBg}20`, background: 'white' }}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em]" style={{ color: config.themeColors.summaryLabelText }}>Premios anticipados</p>
                        <h2 className="mt-2 text-2xl font-black text-slate-900">Antes del premio mayor</h2>
                      </div>
                      <span className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ background: `${config.themeColors.sidebarActiveBg}12`, color: config.themeColors.sidebarActiveBg }}>
                        {premiosAnticipados.length}
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {premiosAnticipados.slice(0, 4).map((premio) => (
                        <article key={premio.id} className="grid gap-2 rounded-[1.2rem] border px-4 py-3 md:grid-cols-[1fr_auto]" style={{ borderColor: `${config.themeColors.sidebarActiveBg}18` }}>
                          <p className="font-bold text-slate-900">{premio.nombre}</p>
                          <p className="text-sm font-semibold text-slate-700 md:text-right">{formatDateTimeLong(premio.fecha)}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            </div>
          </div>
        </section>

        <section id="comprar-boletas" ref={compraSectionRef} className="mx-auto max-w-7xl px-6 py-10">
          <div className="rounded-[2.3rem] border bg-white p-8 shadow-sm" style={{ borderColor: `${config.themeColors.sidebarActiveBg}22` }}>
            <p className="text-xs uppercase tracking-[0.28em]" style={{ color: config.themeColors.summaryLabelText }}>Compra en linea</p>
            <h2 className="mt-2 text-5xl font-black">Selecciona tus boletas</h2>
            <p className="mt-4 max-w-3xl text-lg text-slate-700">Elige una o varias boletas disponibles para continuar con tu compra en linea.</p>
            <div className="mt-8 overflow-x-auto pb-2">
              <div className="flex min-w-max gap-2.5">
                {publicRanges.map((range, index) => (
                  <button key={range.label} type="button" onClick={() => setSelectedRangeIndex(index)} className="rounded-full border px-4 py-2 text-base font-semibold" style={{ borderColor: config.themeColors.sidebarActiveBg, background: selectedRangeIndex === index ? config.themeColors.sidebarActiveBg : 'white', color: selectedRangeIndex === index ? 'white' : config.themeColors.sidebarActiveBg }}>
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-8">
              <label htmlFor="public-search" className="text-base font-semibold text-slate-900">Buscar numero</label>
              <input id="public-search" value={numeroBusqueda} onChange={(event) => setNumeroBusqueda(event.target.value.replace(/\D/g, ''))} placeholder={rifa.numeroCifras === 4 ? 'Ej: 0001' : 'Busca tu numero'} className="mt-4 w-full rounded-[1.4rem] border border-slate-200 px-6 py-5 text-2xl outline-none transition focus:border-slate-400" />
            </div>
            <div className="mt-8">
              {boletasLoading ? (
                <Loading label="Cargando boletas..." />
              ) : pagedPublicBoletas.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                  {pagedPublicBoletas.map((boleta) => {
                    const isSelected = selectedBoletaIds.includes(boleta.id);
                    const isAvailable = boleta.estado === 'ASIGNADA';
                    return (
                      <button key={boleta.id} type="button" onClick={() => toggleBoletaSelection(boleta)} disabled={!isAvailable} className="h-[5.35rem] rounded-[1rem] border px-3 transition" style={{ borderColor: isSelected ? config.themeColors.sidebarActiveBg : `${config.themeColors.sidebarActiveBg}33`, background: isSelected ? `${config.themeColors.sidebarActiveBg}` : isAvailable ? `${config.themeColors.sidebarActiveBg}0D` : '#f3f4f6', color: isSelected ? 'white' : isAvailable ? config.themeColors.sidebarActiveBg : '#9ca3af', cursor: isAvailable ? 'pointer' : 'not-allowed' }}>
                        <span className="flex h-full items-center justify-center text-center text-[1.78rem] font-black tracking-[0.04em]">{boleta.numero}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title="No hay boletas para mostrar" description="Prueba con otro rango o cambia la busqueda." />
              )}
            </div>
            {rangePageCount > 1 ? (
              <div className="mt-10 flex flex-wrap justify-center gap-2.5">
                {Array.from({ length: rangePageCount }, (_, index) => (
                  <button key={`page-${index + 1}`} type="button" onClick={() => setSelectedRangePage(index)} className="h-8.5 w-8.5 rounded-full border text-sm font-semibold" style={{ borderColor: `${config.themeColors.sidebarActiveBg}44`, background: selectedRangePage === index ? config.themeColors.sidebarActiveBg : 'white', color: selectedRangePage === index ? 'white' : config.themeColors.sidebarActiveBg }}>
                    {index + 1}
                  </button>
                ))}
              </div>
            ) : null}

            {reservaResult ? (
              <div className="mt-10 rounded-[1.8rem] border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
                <p className="text-xs font-bold uppercase tracking-[0.24em]">Reserva creada</p>
                <p className="mt-2 text-2xl font-black">Referencia {reservaResult.referencia}</p>
                <p className="mt-3 text-sm leading-6">
                  Tus boletas quedaron apartadas hasta {formatDateTimeLong(reservaResult.expiresAt)}.
                </p>
                <p className="mt-3 text-sm">
                  Boletas: {reservaResult.boletas.map((boleta) => boleta.numero).join(', ')}
                </p>
                <p className="mt-3 text-sm">
                  El modal de pago aparece enseguida para continuar con Wompi sandbox.
                </p>
                {launchingCheckout ? (
                  <div className="mt-5 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-900">
                    Preparando modal de pago...
                  </div>
                ) : null}

                {!isPagoModalOpen ? (
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void handleAbrirPagoModal()}
                      className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                    >
                      Continuar con el pago
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReservaResult(null);
                        setPagoError(null);
                        setReservaError(null);
                      }}
                      className="rounded-full border border-emerald-300 bg-white px-5 py-3 text-sm font-semibold text-emerald-900"
                    >
                      Cerrar reserva
                    </button>
                  </div>
                ) : null}

                {pagoError ? (
                  <div className="mt-5">
                    <ErrorBanner message={pagoError} />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2.3rem] border bg-white p-8 shadow-sm" style={{ borderColor: `${config.themeColors.sidebarActiveBg}22` }}>
              <p className="text-xs uppercase tracking-[0.28em]" style={{ color: config.themeColors.summaryLabelText }}>Premios de la rifa</p>
              <div className="mt-3 flex items-center justify-between gap-4">
                <h2 className="text-4xl font-black">Cronograma de juego</h2>
                <span className="rounded-full px-4 py-2 text-sm font-semibold" style={{ background: `${config.themeColors.sidebarActiveBg}12` }}>{premiosOrdenados.length} premios configurados</span>
              </div>
              <div className="mt-6 space-y-4">
                {premiosOrdenados.map((premio, index) => {
                  const palette = premio.id === premioMayor?.id ? MAYOR_COLOR : ANTICIPADO_COLORS[index % ANTICIPADO_COLORS.length];
                  return (
                  <article key={premio.id} className="rounded-[1.8rem] border px-6 py-5 shadow-sm" style={{ borderColor: palette.border, background: palette.background }}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em]" style={{ color: palette.accent }}>{premio.tipo === 'MAYOR' ? 'Premio mayor' : 'Anticipado'}</p>
                        <h3 className="mt-3 text-2xl font-black text-slate-900">{premio.nombre}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.24em]" style={{ color: palette.accent }}>Juega</p>
                        <p className="mt-3 text-lg font-bold text-slate-900">{formatDateTimeLong(premio.fecha)}</p>
                      </div>
                    </div>
                    {premio.descripcion ? <p className="mt-5 whitespace-pre-line text-lg leading-8 text-slate-700">{premio.descripcion}</p> : null}
                    <p className="mt-5 text-lg uppercase tracking-[0.08em] text-slate-700">Juega con la loteria de {rifa.loteriaNombre}</p>
                  </article>
                )})}
              </div>
            </div>
            <div className="space-y-6">
              <div className="rounded-[2.3rem] border bg-slate-950 p-8 text-white shadow-sm" style={{ borderColor: `${config.themeColors.sidebarActiveBg}12` }}>
                <p className="text-xs uppercase tracking-[0.28em] text-white/60">Atencion</p>
                <h2 className="mt-3 text-4xl font-black">Soporte y canales oficiales</h2>
                <p className="mt-4 text-lg leading-8 text-white/80">{config.publicSupportText || 'Si tienes dudas sobre tu compra o el estado de tu boleta, usa los canales oficiales de la casa rifera.'}</p>
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.5rem] bg-white/5 px-5 py-4"><p className="text-xs uppercase tracking-[0.22em] text-white/50">Telefono</p><p className="mt-2 text-xl font-semibold text-white">{config.publicContactPhone || 'No configurado'}</p></div>
                  <div className="rounded-[1.5rem] bg-white/5 px-5 py-4"><p className="text-xs uppercase tracking-[0.22em] text-white/50">WhatsApp</p><p className="mt-2 text-xl font-semibold text-white">{config.publicContactWhatsapp || 'No configurado'}</p></div>
                </div>
              </div>

              <div className="rounded-[2.3rem] border bg-white p-8 shadow-sm" style={{ borderColor: `${config.themeColors.sidebarActiveBg}22` }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em]" style={{ color: config.themeColors.summaryLabelText }}>Ubicacion</p>
                    <h2 className="mt-3 text-3xl font-black text-slate-900">
                      {publicLocation ? 'Abre la ruta en Google Maps' : 'Ubicacion no configurada'}
                    </h2>
                  </div>
                  {googleMapsHref ? (
                    <a
                      href={googleMapsHref}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full px-4 py-3 text-sm font-semibold text-white"
                      style={{ background: config.themeColors.sidebarActiveBg }}
                    >
                      Ver mapa
                    </a>
                  ) : null}
                </div>

                <div className="mt-6">
                  {googleMapsHref ? (
                    <a
                      href={googleMapsHref}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-[1.8rem] border"
                      style={{ borderColor: `${config.themeColors.sidebarActiveBg}22` }}
                    >
                      <iframe
                        title="Mapa de ubicacion"
                        src={`https://www.google.com/maps?q=${encodeURIComponent(publicLocation)}&output=embed`}
                        className="h-[320px] w-full"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        style={{ border: 0, pointerEvents: 'none' }}
                      />
                    </a>
                  ) : (
                    <div className="flex h-[320px] items-center justify-center rounded-[1.8rem] border border-dashed text-center text-slate-500" style={{ borderColor: `${config.themeColors.sidebarActiveBg}33` }}>
                      Configura la direccion publica para mostrar aqui el mapa y enlazar a Google Maps.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {selectedBoletas.length ? (
        <div className="fixed bottom-5 left-1/2 z-30 w-[min(92vw,980px)] -translate-x-1/2">
          <div className="rounded-[1.8rem] border bg-slate-950 px-6 py-5 text-white shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/55">Compra seleccionada</p>
                <h3 className="mt-2 text-2xl font-black">{selectedBoletas.length} boleta{selectedBoletas.length === 1 ? '' : 's'} · {formatCOP(totalSeleccionado)}</h3>
                <p className="mt-2 text-sm text-white/70">{selectedBoletas.map((boleta) => boleta.numero).join(', ')}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setSelectedBoletaIds([])} className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white">Limpiar</button>
                <button type="button" onClick={() => { setReservaError(null); setIsReservaModalOpen(true); }} className="rounded-full px-5 py-3 text-sm font-semibold text-slate-900" style={{ background: 'white' }}>Continuar compra</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isReservaModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-auto rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b px-6 py-5" style={{ borderColor: `${config.themeColors.sidebarActiveBg}22` }}>
              <div>
                <p className="text-xs uppercase tracking-[0.24em]" style={{ color: config.themeColors.summaryLabelText }}>Reserva temporal</p>
                <h3 className="mt-2 text-3xl font-black text-slate-900">Completa tu compra</h3>
                <p className="mt-2 text-slate-700">Confirma tus boletas y registra los datos del comprador en esta ventana.</p>
              </div>
              <div className="rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500" style={{ borderColor: `${config.themeColors.sidebarActiveBg}22` }}>
                Ventana activa
              </div>
            </div>

            <div className="grid gap-6 p-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[1.8rem] border p-6" style={{ borderColor: `${config.themeColors.sidebarActiveBg}22`, background: `${config.themeColors.sidebarActiveBg}07` }}>
                <p className="text-xs uppercase tracking-[0.24em]" style={{ color: config.themeColors.summaryLabelText }}>Paso 1</p>
                <h4 className="mt-2 text-2xl font-black text-slate-900">Tus boletas seleccionadas</h4>
                <p className="mt-3 text-slate-700">
                  Estas boletas se reservaran durante 15 minutos mientras completas el siguiente paso.
                </p>

                <div className="mt-6 rounded-[1.4rem] bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-600">Numeros seleccionados</p>
                  <p className="mt-2 text-lg font-black text-slate-900">
                    {selectedBoletas.map((boleta) => boleta.numero).join(', ')}
                  </p>
                  <div className="mt-5 grid gap-3 rounded-[1.1rem] border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-4">
                      <span>Cantidad de boletas</span>
                      <span className="font-bold text-slate-900">{selectedBoletas.length}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Valor por boleta</span>
                      <span className="font-bold text-slate-900">{formatCOP(precioUnitarioSeleccionado)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Calculo</span>
                      <span className="font-bold text-slate-900">
                        {selectedBoletas.length} × {formatCOP(precioUnitarioSeleccionado)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-5 text-sm font-semibold text-slate-600">Total reservado</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{formatCOP(totalSeleccionado)}</p>
                </div>
              </div>

              <form onSubmit={handleSubmitReserva} className="rounded-[1.8rem] border bg-white p-6 shadow-sm" style={{ borderColor: `${config.themeColors.sidebarActiveBg}22` }}>
                <p className="text-xs uppercase tracking-[0.24em]" style={{ color: config.themeColors.summaryLabelText }}>Paso 2</p>
                <h4 className="mt-2 text-2xl font-black text-slate-900">Datos del comprador</h4>
                <p className="mt-3 text-slate-700">
                  El email queda opcional por ahora. Nombre, documento y telefono se usan para registrar la reserva.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Nombre completo</span>
                    <input value={clientForm.nombre} onChange={handleClientFieldChange('nombre')} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-slate-400" placeholder="Nombre del comprador" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Documento</span>
                    <input value={clientForm.documento} onChange={handleClientFieldChange('documento')} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-slate-400" placeholder="Cedula o documento" inputMode="numeric" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Telefono</span>
                    <input value={clientForm.telefono} onChange={handleClientFieldChange('telefono')} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-slate-400" placeholder="Telefono de contacto" inputMode="tel" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Email opcional</span>
                    <input value={clientForm.email} onChange={handleClientFieldChange('email')} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-slate-400" placeholder="correo@ejemplo.com" type="email" />
                  </label>
                </div>

                <div className="mt-6 rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  La reserva temporal dura 15 minutos. Si no completas el pago en ese tiempo, las boletas vuelven a estar disponibles.
                </div>

                {reservaError ? <div className="mt-4"><ErrorBanner message={reservaError} /></div> : null}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="submit" disabled={!selectedBoletas.length || submittingReserva} className="rounded-full px-6 py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" style={{ background: config.themeColors.sidebarActiveBg }}>
                    {submittingReserva ? 'Reservando...' : 'Reservar boletas'}
                  </button>
                  <button type="button" onClick={handleSeguirViendo} className="rounded-full border px-6 py-3.5 text-sm font-semibold text-slate-700" style={{ borderColor: `${config.themeColors.sidebarActiveBg}33` }}>
                    Seguir viendo
                  </button>
                  <button type="button" onClick={handleCancelarReserva} className="rounded-full border px-6 py-3.5 text-sm font-semibold text-rose-700" style={{ borderColor: '#fda4af', background: '#fff1f2' }}>
                    Cancelar
                  </button>
                </div>

                <p className="mt-5 text-xs leading-6 text-slate-500">
                  Al reservar, te mostraremos el boton para abrir el checkout de Wompi sandbox.
                </p>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {isPagoModalOpen && checkoutData ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="pointer-events-auto max-h-[92vh] w-full max-w-4xl overflow-auto rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b px-6 py-5" style={{ borderColor: `${config.themeColors.sidebarActiveBg}22` }}>
              <div>
                <p className="text-xs uppercase tracking-[0.24em]" style={{ color: config.themeColors.summaryLabelText }}>Pago Wompi sandbox</p>
                <h3 className="mt-2 text-3xl font-black text-slate-900">Confirma el paso al pago</h3>
                <p className="mt-2 text-slate-700">
                  Este modal no se cierra al hacer clic fuera. Desde aqui abres el widget oficial de Wompi.
                </p>
              </div>
              <div className="rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500" style={{ borderColor: `${config.themeColors.sidebarActiveBg}22` }}>
                Pago activo
              </div>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_0.95fr]">
              <div className="rounded-[1.8rem] border p-6" style={{ borderColor: `${config.themeColors.sidebarActiveBg}22`, background: `${config.themeColors.sidebarActiveBg}07` }}>
                <p className="text-xs uppercase tracking-[0.24em]" style={{ color: config.themeColors.summaryLabelText }}>Resumen del pago</p>
                <h4 className="mt-2 text-2xl font-black text-slate-900">Datos que se enviaran a Wompi</h4>

                <div className="mt-6 rounded-[1.4rem] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4 text-sm text-slate-700">
                    <span>Referencia</span>
                    <span className="font-bold text-slate-900">{checkoutData.reference}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4 text-sm text-slate-700">
                    <span>Boletas</span>
                    <span className="font-bold text-slate-900">{reservaResult?.boletas.map((boleta) => boleta.numero).join(', ')}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4 text-sm text-slate-700">
                    <span>Cantidad</span>
                    <span className="font-bold text-slate-900">{reservaResult?.boletas.length || 0}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4 text-sm text-slate-700">
                    <span>Total</span>
                    <span className="font-bold text-slate-900">{formatCOP(checkoutData.amountInCents / 100)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4 text-sm text-slate-700">
                    <span>Vence</span>
                    <span className="font-bold text-slate-900">{formatDateTimeLong(checkoutData.expirationTime)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.8rem] border bg-white p-6 shadow-sm" style={{ borderColor: `${config.themeColors.sidebarActiveBg}22` }}>
                <p className="text-xs uppercase tracking-[0.24em]" style={{ color: config.themeColors.summaryLabelText }}>Abrir widget</p>
                <h4 className="mt-2 text-2xl font-black text-slate-900">Pago dentro del flujo</h4>
                <p className="mt-3 text-slate-700">
                  Usaremos el widget oficial de Wompi sandbox para evitar depender de la URL larga del checkout web.
                </p>

                <div className="mt-6 rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Si Wompi no abre, el problema ya no estaria en tus boletas sino en la configuracion sandbox o en la llave publica activa.
                </div>

                <div className="mt-4 rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  Estado del widget: {wompiWidgetReady ? 'cargado' : 'no disponible en la pagina'}
                </div>

                <div className="mt-4 rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
                  <p className="font-bold uppercase tracking-[0.18em] text-slate-500">Diagnostico</p>
                  <div className="mt-3 space-y-2 break-all">
                    <p><strong>Entorno:</strong> {checkoutData.wompiEnv}</p>
                    <p><strong>Public key:</strong> {checkoutData.publicKey}</p>
                    <p><strong>Referencia:</strong> {checkoutData.reference}</p>
                    <p><strong>Monto centavos:</strong> {checkoutData.amountInCents}</p>
                    <p><strong>Moneda:</strong> {checkoutData.currency}</p>
                    <p><strong>Expiracion:</strong> {checkoutData.expirationTime}</p>
                    <p><strong>Firma integridad:</strong> {checkoutData.integritySignature}</p>
                    <p><strong>Cadena firmada:</strong> {checkoutData.integritySource}</p>
                  </div>
                </div>

                {pagoError ? <div className="mt-4"><ErrorBanner message={pagoError} /></div> : null}
                {reservaError ? <div className="mt-4"><ErrorBanner message={reservaError} /></div> : null}

                <div className="relative z-[60] mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleAbrirWidgetWompi}
                    className="cursor-pointer rounded-full px-6 py-3.5 text-sm font-semibold text-white"
                    style={{ background: config.themeColors.sidebarActiveBg }}
                  >
                    {openingWidget ? 'Abriendo widget...' : 'Abrir Wompi sandbox'}
                  </button>
                  <button
                    type="button"
                    onClick={handleAbrirCheckoutDirecto}
                    className="cursor-pointer rounded-full border px-6 py-3.5 text-sm font-semibold text-slate-700"
                    style={{ borderColor: `${config.themeColors.sidebarActiveBg}33` }}
                  >
                    Abrir checkout directo
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPagoModalOpen(false)}
                    className="cursor-pointer rounded-full border px-6 py-3.5 text-sm font-semibold text-slate-700"
                    style={{ borderColor: `${config.themeColors.sidebarActiveBg}33` }}
                  >
                    Seguir viendo
                  </button>
                </div>

                <p className="mt-5 text-xs leading-6 text-slate-500">
                  El cierre del pago sigue regresando a la pantalla de retorno para validar el estado real con el webhook.
                </p>
                <p className="mt-2 text-xs leading-6 text-slate-500">
                  Trabajar en local no causa por si solo un 403 al abrir checkout. Lo que si afecta ese 403 suele ser la llave publica o la firma de integridad.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isImageModalOpen && activeImageSrc ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-6" onClick={() => setIsImageModalOpen(false)}>
          <div className="relative max-h-[90vh] max-w-[92vw] overflow-auto rounded-[2rem] bg-white p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setIsImageModalOpen(false)} className="sticky right-0 top-0 z-10 ml-auto flex h-11 w-11 items-center justify-center rounded-full border bg-white text-2xl text-slate-700 shadow-sm">×</button>
            <img src={activeImageSrc} alt={activeImageAlt} className="max-h-[80vh] w-auto max-w-full rounded-[1.4rem] object-contain" />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PublicRifaPage;
