import { useState } from 'react';
import type { HTMLInputAutoCompleteAttribute } from 'react';
import type { FieldName, SelectOption } from '../features/auth/types';

type FormFieldProps = {
  name: FieldName;
  label: string;
  value: string;
  onChange: (name: FieldName, value: string) => void;
  onBlur?: (name: FieldName) => void;
  hint?: string;
  error?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password';
  autoComplete?: HTMLInputAutoCompleteAttribute;
  options?: SelectOption[];
  disabled?: boolean;
};

export default function FormField({ name, label, value, onChange, onBlur, hint, error, placeholder, type = 'text', autoComplete, options, disabled = false }: FormFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  const descriptions = [hint && `${name}-hint`, error && `${name}-error`].filter(Boolean).join(' ') || undefined;
  const shared = {
    id: name, name, value, disabled, required: true,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange(name, event.target.value),
    onBlur: () => onBlur?.(name),
    'aria-describedby': descriptions,
    'aria-invalid': error ? true : undefined,
  };
  return (
    <div className={`form-field ${error ? 'form-field-error' : ''}`}>
      <label htmlFor={name}>{label}</label>
      <div className={`field-control ${options ? 'field-select' : ''}`}>
        {options ? <>
          <select {...shared}>
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <span className="select-action" aria-hidden="true">Choose</span>
        </> : <input {...shared} type={isPassword && revealed ? 'text' : type} placeholder={placeholder} autoComplete={autoComplete} />}
        {isPassword && <button className="password-toggle" type="button" disabled={disabled}
          aria-label={`${revealed ? 'Hide' : 'Show'} password`} aria-pressed={revealed} aria-controls={name}
          onClick={() => setRevealed((current) => !current)}>{revealed ? 'Hide' : 'Show'}</button>}
      </div>
      {hint && <p className="field-hint" id={`${name}-hint`}>{hint}</p>}
      {error && <p className="field-error" id={`${name}-error`}>{error}</p>}
    </div>
  );
}
