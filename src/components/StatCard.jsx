import React from 'react';
import { Card } from './Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'cerulean',
  className = '',
  onClick,
}) => {
  const colorMap = {
    cerulean: 'bg-[#007EA7]/10 text-[#007EA7] dark:text-[#32CCFF] border-[#007EA7]/20',
    sky: 'bg-[#00A8E8]/10 text-[#007EA7] dark:text-[#57CFFF] border-[#00A8E8]/20',
    blue: 'bg-[#003459]/10 text-[#003459] dark:text-[#56B8FF] border-[#003459]/20',
    indigo: 'bg-[#007EA7]/10 text-[#007EA7] dark:text-[#32CCFF] border-[#007EA7]/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    cyan: 'bg-[#00A8E8]/10 text-[#007EA7] dark:text-[#57CFFF] border-[#00A8E8]/20',
  };

  const glowMap = {
    cerulean: 'from-[#007EA7]/10 to-transparent',
    sky: 'from-[#00A8E8]/10 to-transparent',
    blue: 'from-[#003459]/10 to-transparent',
    indigo: 'from-[#007EA7]/10 to-transparent',
    emerald: 'from-emerald-500/10 to-transparent',
    amber: 'from-amber-500/10 to-transparent',
    rose: 'from-rose-500/10 to-transparent',
    purple: 'from-purple-500/10 to-transparent',
    cyan: 'from-[#00A8E8]/10 to-transparent',
  };

  const selectedColor = colorMap[color] || colorMap.cerulean;

  return (
    <Card hover onClick={onClick} className={`bg-surface border border-theme p-3 sm:p-4 rounded-xl sm:rounded-2xl ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-secondary uppercase tracking-wider block truncate">
            {title}
          </span>
          <div className="text-lg sm:text-xl lg:text-2xl font-black text-primary tracking-tight mt-0.5 truncate">
            {value}
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {subtitle && <span className="text-[10px] sm:text-[11px] text-secondary font-medium truncate max-w-full">{subtitle}</span>}
            {trend && (
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border ${
                  trend.positive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                }`}
              >
                {trend.positive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                {trend.value}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border shrink-0 transition-all duration-200 group-hover:scale-105 shadow-xs ${selectedColor}`}
          >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
