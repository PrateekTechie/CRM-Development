import React from 'react';

export const Badge = ({
  children,
  variant = 'default', // default, working, new, contacted, qualified, converted, lost, high, medium, low, blue, cyan, violet, emerald, amber, rose, slate
  size = 'md',        // sm, md
  className = '',
}) => {
  const variantStyles = {
    // Status badges
    new: 'bg-blue-50 text-blue-700 border border-blue-200 font-medium',
    contacted: 'bg-cyan-50 text-cyan-700 border border-cyan-200 font-medium',
    working: 'bg-amber-50 text-amber-700 border border-amber-200 font-medium',
    qualified: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium',
    converted: 'bg-violet-50 text-violet-700 border border-violet-200 font-medium',
    lost: 'bg-rose-50 text-rose-700 border border-rose-200 font-medium',

    // Priority badges
    high: 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold',
    medium: 'bg-amber-50 text-amber-700 border border-amber-200 font-medium',
    low: 'bg-slate-100 text-slate-600 border border-slate-200 font-medium',

    // Generic Color Badges
    blue: 'bg-blue-50 text-blue-700 border border-blue-200 font-medium',
    cyan: 'bg-cyan-50 text-cyan-700 border border-cyan-200 font-medium',
    violet: 'bg-violet-50 text-violet-700 border border-violet-200 font-medium',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200 font-medium',
    rose: 'bg-rose-50 text-rose-700 border border-rose-200 font-medium',
    slate: 'bg-slate-100 text-slate-700 border border-slate-200 font-medium',
    default: 'bg-slate-100 text-slate-700 border border-slate-200 font-medium',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 rounded',
    md: 'text-[11px] px-2.5 py-0.5 rounded-md font-medium tracking-wide',
  };

  let styleKey = variant;
  if (typeof children === 'string') {
    const lower = children.toLowerCase();
    if (variantStyles[lower]) styleKey = lower;
  }

  return (
    <span className={`inline-flex items-center gap-1 leading-none select-none ${variantStyles[styleKey] || variantStyles.default} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};
