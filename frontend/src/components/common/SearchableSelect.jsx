import { useState, useRef, useEffect } from 'react';

const SearchableSelect = ({ options, value, onChange, placeholder = "Seleccionar..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    // Filter options based on search
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative" ref={wrapperRef}>
            <div
                className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white cursor-pointer flex justify-between items-center"
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) setSearch('');
                }}
            >
                <span className={selectedOption ? 'text-slate-900' : 'text-slate-500'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <span className="text-slate-400 text-xs">▼</span>
            </div>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    <div className="p-2 sticky top-0 bg-white border-b border-slate-100">
                        <input
                            type="text"
                            className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                            placeholder="Buscar..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    {filteredOptions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-slate-500">No hay resultados</div>
                    ) : (
                        filteredOptions.map((opt) => (
                            <div
                                key={opt.value}
                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 ${opt.value === value ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
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
            )}
        </div>
    );
};

export default SearchableSelect;
