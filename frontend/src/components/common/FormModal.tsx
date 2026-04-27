import { useEffect } from 'react';

type FormModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'md' | 'xl' | '2xl';
};

const sizeClasses = {
  md: 'max-w-md',
  xl: 'max-w-4xl',
  '2xl': 'max-w-6xl',
};

const FormModal = ({
  open,
  title,
  description,
  onClose,
  children,
  size = 'md',
}: FormModalProps) => {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
      <div className={`w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl`}>
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          </div>
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
        <div className="max-h-[calc(90vh-84px)] overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
};

export default FormModal;
