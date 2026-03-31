import { useEffect, useState } from 'react';
import { formatCOPNumber, parseNumber } from '../../utils/money';

type MoneyInputProps = {
  label: string;
  value: string | number;
  onChange?: (event: { target: { name: string; value: number } }) => void;
  name: string;
  required?: boolean;
};

const MoneyInput = ({
  label,
  value,
  onChange,
  name,
  required = false,
}: MoneyInputProps) => {
  const [display, setDisplay] = useState(value ? formatCOPNumber(value) : '');

  useEffect(() => {
    setDisplay(value === '' || value === null || typeof value === 'undefined'
      ? ''
      : formatCOPNumber(value));
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    const digitsOnly = raw.replace(/\D+/g, '');

    if (!digitsOnly) {
      setDisplay('');
      onChange?.({ target: { name, value: 0 } });
      return;
    }

    const numericValue = parseNumber(digitsOnly);
    setDisplay(formatCOPNumber(numericValue));
    onChange?.({ target: { name, value: numericValue } });
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
        name={name}
        required={required}
        inputMode="numeric"
      />
    </label>
  );
};

export default MoneyInput;
