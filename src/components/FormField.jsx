import { Input } from './Input';
import './FormField.css';

export function FormField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  error = '',
  options = [],
}) {
  if (type === 'select') {
    return (
      <div className="form-field">
        <label className="form-field__label">
          {label}
          {required && <span className="required">*</span>}
        </label>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="form-field__select"
        >
          <option value="">— Selecciona —</option>
          {options.map(opt => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {error && <p className="form-field__error">{error}</p>}
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div className="form-field">
        <label className="form-field__label">
          {label}
          {required && <span className="required">*</span>}
        </label>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="form-field__textarea"
        />
        {error && <p className="form-field__error">{error}</p>}
      </div>
    );
  }

  if (type === 'checkbox') {
    return (
      <div className="form-field form-field--checkbox">
        <label className="form-field__checkbox-label">
          <input
            type="checkbox"
            checked={value}
            onChange={e => onChange(e.target.checked)}
            className="form-field__checkbox"
          />
          <span>{label}</span>
        </label>
        {error && <p className="form-field__error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="form-field">
      <label className="form-field__label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      <Input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {error && <p className="form-field__error">{error}</p>}
    </div>
  );
}
