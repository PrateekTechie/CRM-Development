import React from 'react';

export const Select = React.forwardRef(({
  label,
  options = [],
  error,
  helperText,
  required = false,
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-slate-700 flex items-center gap-1">
          {label}
          {required && <span className="text-rose-400 font-bold">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`w-full bg-white text-slate-900 text-xs rounded-md border ${
          error
            ? 'border-rose-500 focus:ring-rose-500/30'
            : 'border-slate-200 hover:border-slate-300 focus:border-cyan-500 focus:ring-cyan-500/20'
        } px-3 py-2 transition-colors duration-150 focus:outline-none focus:ring-2 cursor-pointer ${className}`}
        {...props}
      >
        {options.map((opt, i) => {
          const value = typeof opt === 'object' ? opt.value : opt;
          const labelText = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={i} value={value} className="bg-white text-slate-900 py-1">
              {labelText}
            </option>
          );
        })}
      </select>
      {error ? (
        <span className="text-[11px] font-medium text-rose-400">⚠️ {error}</span>
      ) : helperText ? (
        <span className="text-[11px] text-slate-400">{helperText}</span>
      ) : null}
    </div>
  );
});
