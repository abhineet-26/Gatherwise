import React, { useState, useEffect } from 'react';
import { parseMoney, formatMoney, type Minor } from 'shared/domain/money/money';

interface MoneyInputProps {
  value?: Minor;
  onChange: (value: Minor | null) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  id?: string;
  required?: boolean;
  className?: string;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChange,
  label,
  placeholder = 'e.g. 15 Lakhs, 2.5 Cr, or 50,000',
  helperText,
  error,
  id = 'money-input',
  required = false,
  className = '',
}) => {
  const [rawText, setRawText] = useState('');
  const [parsedValue, setParsedValue] = useState<Minor | null>(value ?? null);

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setParsedValue(value);
      if (!rawText) {
        setRawText(formatMoney(value));
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setRawText(text);

    if (!text.trim()) {
      setParsedValue(null);
      onChange(null);
      return;
    }

    const parsed = parseMoney(text);
    setParsedValue(parsed);
    onChange(parsed);
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-stone-700 dark:text-stone-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-medium text-sm">
          ₹
        </span>
        <input
          id={id}
          type="text"
          value={rawText}
          onChange={handleChange}
          placeholder={placeholder}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={`${id}-preview`}
          className={`w-full pl-7 pr-3 py-2 text-sm bg-white dark:bg-stone-900 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
            error
              ? 'border-rose-500 focus:border-rose-500'
              : 'border-stone-300 dark:border-stone-700 focus:border-primary'
          }`}
        />
      </div>

      <div id={`${id}-preview`} className="flex justify-between items-center text-xs">
        {rawText.trim() && parsedValue !== null ? (
          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
            Recognized: {formatMoney(parsedValue)}
          </span>
        ) : rawText.trim() && parsedValue === null ? (
          <span className="text-rose-600 dark:text-rose-400">
            Unrecognized amount format (try "5 lakh", "₹50,000", "2.5cr")
          </span>
        ) : helperText ? (
          <span className="text-stone-500 dark:text-stone-400">{helperText}</span>
        ) : null}

        {error && <span className="text-rose-500 font-medium">{error}</span>}
      </div>
    </div>
  );
};
