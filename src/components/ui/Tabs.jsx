import React from 'react';

export const Tabs = ({
  tabs = [],
  activeTab,
  onChange,
  variant = 'underline', // underline, pills
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1 border-b border-slate-200 ${className}`}>
      {tabs.map((tab) => {
        const key = typeof tab === 'object' ? tab.id : tab;
        const label = typeof tab === 'object' ? tab.label : tab;
        const count = typeof tab === 'object' ? tab.count : undefined;
        const isActive = activeTab === key;

        if (variant === 'pills') {
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-2 ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              {label}
              {count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-700 text-white' : 'bg-[#283347] text-slate-300'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        }

        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all -mb-px flex items-center gap-2 ${
              isActive
                ? 'border-blue-600 text-blue-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {label}
            {count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-950 text-blue-400 border border-blue-800' : 'bg-[#1c2433] text-slate-400'}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
