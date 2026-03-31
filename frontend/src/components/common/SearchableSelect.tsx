import { useEffect, useRef, useState } from 'react';

type SearchableSelectOption = {
  value: string;
  label: string;
};

type SearchableSelectProps = {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  clearable?: boolean;
  clearLabel?: string;
};

const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  clearable = false,
  clearLabel = 'Quitar seleccion',
}: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;

      if (wrapperRef.current && target && !wrapperRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={wrapperRef}>
      <div
        className="flex w-full cursor-pointer items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setSearch('');
          }
        }}
      >
        <span className={`pr-3 ${selectedOption ? 'text-slate-900' : 'text-slate-500'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-2">
          {clearable && selectedOption ? (
            <button
              type="button"
              className="rounded-full px-2 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              onClick={(event) => {
                event.stopPropagation();
                onChange('');
                setSearch('');
                setIsOpen(false);
              }}
              aria-label={clearLabel}
              title={clearLabel}
            >
              X
            </button>
          ) : null}
          <span className="text-xs text-slate-400">▼</span>
        </div>
      </div>

      {isOpen ? (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-300 bg-white shadow-lg">
          <div className="sticky top-0 border-b border-slate-100 bg-white p-2">
            <input
              type="text"
              className="w-full rounded border border-slate-200 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="Buscar..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onClick={(event) => event.stopPropagation()}
            />
          </div>
          {clearable && selectedOption ? (
            <button
              type="button"
              className="w-full border-b border-slate-100 px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50"
              onClick={() => {
                onChange('');
                setIsOpen(false);
                setSearch('');
              }}
            >
              {clearLabel}
            </button>
          ) : null}
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-500">No hay resultados</div>
          ) : (
            filteredOptions.map((opt) => (
              <div
                key={opt.value}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  opt.value === value
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  setSearch('');
                }}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
};

export default SearchableSelect;
