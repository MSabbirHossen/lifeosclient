import React, { useState } from 'react';
import { Card } from './Card';
import { TrendingUp, TrendingDown, Eye, EyeOff } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'cerulean',
  className = '',
  onClick,
  allowBlur = false,
  isBlurred: controlledBlurred,
  onToggleBlur,
}) => {
  const [internalBlurred, setInternalBlurred] = useState(false);
  const isBlurred = controlledBlurred !== undefined ? controlledBlurred : internalBlurred;

  const handleToggleBlur = (e) => {
    e?.stopPropagation?.();
    if (onToggleBlur) {
      onToggleBlur(!isBlurred);
    } else {
      setInternalBlurred(!internalBlurred);
    }
  };

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

  const selectedColor = colorMap[color] || colorMap.cerulean;

  return (
    <Card
      hover
      onClick={isBlurred ? (e) => handleToggleBlur(e) : onClick}
      className={`bg-surface border border-theme p-3 sm:p-4 rounded-xl sm:rounded-2xl relative ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-secondary uppercase tracking-wider block truncate">
              {title}
            </span>
            {allowBlur && (
              <button
                type="button"
                onClick={handleToggleBlur}
                className={`p-1 rounded-lg border transition-all duration-200 cursor-pointer shrink-0 ${
                  isBlurred
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25 shadow-xs'
                    : 'text-secondary hover:text-primary hover:bg-subtle border-transparent hover:border-theme'
                }`}
                title={isBlurred ? 'Show value (Unblur)' : 'Hide value (Blur)'}
                aria-label={isBlurred ? 'Unblur card' : 'Blur card'}
              >
                {isBlurred ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            )}
          </div>

          <div className="relative mt-0.5">
            <div
              className={`transition-all duration-200 ${
                isBlurred ? 'filter blur-md select-none opacity-30 pointer-events-none' : ''
              }`}
            >
              <div className="text-lg sm:text-xl lg:text-2xl font-black text-primary tracking-tight truncate">
                {value}
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {subtitle && (
                  <span className="text-[10px] sm:text-[11px] text-secondary font-medium truncate max-w-full">
                    {subtitle}
                  </span>
                )}
                {trend && (
                  <span
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border ${
                      trend.positive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {trend.positive ? (
                      <TrendingUp className="w-2.5 h-2.5" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5" />
                    )}
                    {trend.value}
                  </span>
                )}
              </div>
            </div>

            {isBlurred && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleBlur(e);
                }}
                className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer rounded-lg hover:bg-surface/20 transition-all"
                title="Click to reveal"
              >
                <span className="px-2 py-0.5 rounded-md bg-surface/90 border border-theme text-[10px] font-bold text-secondary shadow-xs flex items-center gap-1">
                  <Eye className="w-3 h-3 text-accent" /> Reveal
                </span>
              </div>
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
