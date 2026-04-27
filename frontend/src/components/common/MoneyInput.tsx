import { useEffect, useState } from 'react';

import { formatCOPNumber, parseNumber } from '../../utils/money';

type MoneyInputProps = {
  label: string;
  value: string | number;
  onChange?: (value: number) => void;
  required?: boolean;
};

const MoneyInput = ({ label, value, onChange, required = false }: MoneyInputProps) => {
  const [display, setDisplay] = useState(value ? formatCOPNumber(value) : '');

  useEffect(() => {
    setDisplay(
      value === '' || value === null || typeof value === 'undefined'
        ? ''
        : formatCOPNumber(value)
    );
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    const digitsOnly = raw.replace(/\D+/g, '');

    if (!digitsOnly) {
      setDisplay('');
      onChange?.(0);
      return;
    }

    const numericValue = parseNumber(digitsOnly);
    setDisplay(formatCOPNumber(numericValue));
    onChange?.(numericValue);
  };

  const handleBlur = () => {
    setDisplay(display ? formatCOPNumber(parseNumber(display)) : '');
  };

  const handleFocus = () => {
    setDisplay(value ? formatCOPNumber(value) : '');
  };

  return (
    <label className="block text-sm">
      <span className="text-slate-600">{label}</span>
      <input
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        required={required}
        inputMode="numeric"
      />
    </label>
  );
};

export default MoneyInput;
