import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const KpiCard = ({
  title,
  value,
  trend,
  trendText,
  comparisonText,
  icon: Icon,
  onClick,
  active = false,
  badgeText,
  accentColor = 'blue', // blue, cyan, violet, emerald, amber
}) => {
  const isPositive = trend === 'up';

  const topBorders = {
    blue: 'border-t-2 border-t-blue-500',
    cyan: 'border-t-2 border-t-cyan-400',
    violet: 'border-t-2 border-t-violet-500',
    emerald: 'border-t-2 border-t-emerald-500',
    amber: 'border-t-2 border-t-amber-500',
  };

  const iconBg = {
    blue: 'bg-blue-50 text-blue-600 border border-blue-100',
    cyan: 'bg-cyan-50 text-cyan-700 border border-cyan-100',
    violet: 'bg-violet-50 text-violet-600 border border-violet-100',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border border-amber-100',
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl bg-white border transition-all duration-150 cursor-pointer select-none group shadow-crm-sm hover:shadow-crm-md ${
        topBorders[accentColor] || topBorders.blue
      } ${
        active
          ? 'border-blue-500 shadow-crm-blue ring-1 ring-blue-500/50'
          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-md transition-colors ${iconBg[accentColor] || iconBg.blue}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline justify-between">
        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
        {badgeText && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
            {badgeText}
          </span>
        )}
      </div>

      {(trendText || comparisonText) && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px]">
          {trendText && (
            <span className={`flex items-center gap-0.5 font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trendText}
            </span>
          )}
          {comparisonText && (
            <span className="text-slate-400 font-medium">{comparisonText}</span>
          )}
        </div>
      )}
    </div>
  );
};
