import React from 'react';

export const Input = React.forwardRef(({
  label,
  error,
  helperText,
  required = false,
  icon: Icon,
  className = '',
  id,
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-slate-700 flex items-center gap-1">
          {label}
          {required && <span className="text-rose-400 font-bold">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-slate-500 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`w-full bg-white text-slate-900 text-xs rounded-md border ${
            error
              ? 'border-rose-500 focus:ring-rose-500/30'
              : 'border-slate-200 hover:border-slate-300 focus:border-cyan-500 focus:ring-cyan-500/20'
          } ${Icon ? 'pl-9' : 'px-3'} py-2 transition-colors duration-150 focus:outline-none focus:ring-2 placeholder:text-slate-500 ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <span className="text-[11px] font-medium text-rose-400 flex items-center gap-1">
          ⚠️ {error}
        </span>
      ) : helperText ? (
        <span className="text-[11px] text-slate-400">{helperText}</span>
      ) : null}
    </div>
  );
});
