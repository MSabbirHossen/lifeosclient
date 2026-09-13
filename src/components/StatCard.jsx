import React from 'react';
import { Card } from './Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'indigo',
  className = '',
}) => {
  const colorMap = {
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  };

  const selectedColor = colorMap[color] || colorMap.indigo;

  return (
    <Card hover className={`relative overflow-hidden ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-secondary uppercase tracking-wider block truncate">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight mt-1 truncate">
            {value}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {subtitle && <span className="text-xs text-secondary">{subtitle}</span>}
            {trend && (
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                  trend.positive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}
              >
                {trend.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trend.value}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 transition-transform duration-200 group-hover:scale-110 ${selectedColor}`}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
