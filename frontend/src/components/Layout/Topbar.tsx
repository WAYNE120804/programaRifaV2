import type { ReactNode } from 'react';

type TopbarProps = {
  title: string;
  actions?: ReactNode;
};

const Topbar = ({ title, actions }: TopbarProps) => {
  return (
    <header className="theme-topbar no-print flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
      <h2 className="theme-main-title text-xl font-semibold">{title}</h2>
      <div className="flex items-center gap-3">{actions}</div>
    </header>
  );
};

export default Topbar;
