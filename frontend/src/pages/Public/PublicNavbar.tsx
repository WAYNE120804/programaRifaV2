import { Link } from 'react-router-dom';

import { useAppConfig } from '../../context/AppConfigContext';

type PublicNavbarProps = {
  showBackHome?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
};

const PublicNavbar = ({
  showBackHome = false,
  ctaHref,
  ctaLabel,
}: PublicNavbarProps) => {
  const { config } = useAppConfig();

  return (
    <header
      className="sticky top-0 z-20 border-b backdrop-blur"
      style={{
        borderColor: `${config.themeColors.sidebarActiveBg}33`,
        background: `linear-gradient(135deg, rgba(255,255,255,0.96), ${config.themeColors.topbarBg}18)`,
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link to="/publico" className="flex items-center gap-4">
          {config.logoDataUrl ? (
            <img
              src={config.logoDataUrl}
              alt={config.nombreCasaRifera}
              className="h-14 w-14 rounded-2xl bg-white object-contain p-2 shadow-sm"
              style={{ border: `1px solid ${config.themeColors.sidebarActiveBg}33` }}
            />
          ) : null}
          <div>
            <p
              className="text-xs uppercase tracking-[0.25em]"
              style={{ color: config.themeColors.summaryLabelText }}
            >
              Casa rifera
            </p>
            <h1 className="text-2xl font-bold">{config.nombreCasaRifera}</h1>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
          <a href="/publico#rifas">Rifas</a>
          <a href="/publico#quienes-somos">Quienes somos</a>
          <a href="/publico#reglamento">Reglamento</a>
          <a href="/publico#contacto">Contacto</a>
        </nav>

        <div className="flex items-center gap-3">
          {showBackHome ? (
            <Link
              to="/publico"
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700"
              style={{ border: `1px solid ${config.themeColors.sidebarActiveBg}55` }}
            >
              Volver al inicio
            </Link>
          ) : null}
          {ctaHref ? (
            ctaHref.startsWith('#') ? (
              <a
                href={ctaHref}
                className="relative overflow-hidden rounded-full px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white shadow-lg"
                style={{ background: config.themeColors.sidebarActiveBg, boxShadow: `0 0 0 2px ${config.themeColors.sidebarActiveBg}22, 0 0 18px ${config.themeColors.sidebarActiveBg}66, 0 0 36px ${config.themeColors.sidebarActiveBg}44` }}
              >
                <span className="absolute inset-0 animate-pulse rounded-full" style={{ boxShadow: `0 0 28px ${config.themeColors.sidebarActiveBg}aa` }} />
                <span className="absolute -left-1/3 top-0 h-full w-1/3 -skew-x-12 animate-pulse bg-white/20 blur-md" />
                <span className="relative z-10">
                {ctaLabel || config.publicPrimaryCtaText || 'Comprar boletas'}
                </span>
              </a>
            ) : (
              <Link
                to={ctaHref}
                className="relative overflow-hidden rounded-full px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white shadow-lg"
                style={{ background: config.themeColors.sidebarActiveBg, boxShadow: `0 0 0 2px ${config.themeColors.sidebarActiveBg}22, 0 0 18px ${config.themeColors.sidebarActiveBg}66, 0 0 36px ${config.themeColors.sidebarActiveBg}44` }}
              >
                <span className="absolute inset-0 animate-pulse rounded-full" style={{ boxShadow: `0 0 28px ${config.themeColors.sidebarActiveBg}aa` }} />
                <span className="absolute -left-1/3 top-0 h-full w-1/3 -skew-x-12 animate-pulse bg-white/20 blur-md" />
                <span className="relative z-10">
                {ctaLabel || config.publicPrimaryCtaText || 'Comprar boletas'}
                </span>
              </Link>
            )
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default PublicNavbar;
