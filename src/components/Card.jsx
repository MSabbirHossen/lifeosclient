import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Card = ({
  children,
  className = '',
  title,
  subtitle,
  icon: Icon,
  action,
  bottomAction,
  hover = false,
  badge,
  noPadding = false,
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

  const handleClick = (e) => {
    if (onClick) {
      const target = e.target;
      if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('textarea')
      ) {
        return;
      }
      onClick(e);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative group bg-surface border border-theme rounded-2xl card-shadow flex flex-col transition-all duration-200 ${
        hover || onClick ? 'hover:shadow-md hover:border-theme-strong hover:-translate-y-0.5' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${noPadding ? '' : 'p-3.5 sm:p-5 md:p-6'} ${className}`}
    >
      <div className="flex-1 min-w-0 flex flex-col">
        {(title || action || Icon || badge || allowBlur) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 mb-3.5 sm:mb-4 pb-2.5 sm:pb-3 border-b border-subtle/80 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 w-full sm:w-auto">
              {Icon && (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-accent/10 dark:bg-accent/15 border border-accent/20 flex items-center justify-center text-accent shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105">
                  <Icon className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  {title && (
                    <h3 className="text-sm font-bold text-primary tracking-tight leading-snug truncate">
                      {title}
                    </h3>
                  )}
                  {badge && <span className="shrink-0">{badge}</span>}
                </div>
                {subtitle && <p className="text-xs text-secondary mt-0.5 truncate">{subtitle}</p>}
              </div>
            </div>
            {(action || allowBlur) && (
              <div className="shrink-0 flex items-center gap-1.5 sm:gap-2 justify-start sm:justify-end w-full sm:w-auto">
                {action}
                {allowBlur && (
                  <button
                    type="button"
                    onClick={handleToggleBlur}
                    className={`p-1.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0 ${
                      isBlurred
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25 shadow-xs'
                        : 'text-secondary hover:text-primary hover:bg-subtle border-transparent hover:border-theme'
                    }`}
                    title={isBlurred ? 'Show content (Unblur)' : 'Hide content (Blur)'}
                    aria-label={isBlurred ? 'Unblur card' : 'Blur card'}
                  >
                    {isBlurred ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        <div className="relative flex-1 min-w-0 flex flex-col">
          <div
            className={`flex-1 min-w-0 flex flex-col transition-all duration-200 ${
              isBlurred ? 'filter blur-md select-none opacity-30 pointer-events-none' : ''
            }`}
          >
            {children}
          </div>
          {isBlurred && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleToggleBlur(e);
              }}
              className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer bg-surface/20 backdrop-blur-[2px] rounded-xl hover:bg-surface/30 transition-all group/blur"
              title="Click to reveal content"
            >
              <span className="px-3 py-1.5 rounded-xl bg-surface/90 border border-theme text-xs font-bold text-secondary shadow-md flex items-center gap-1.5 group-hover/blur:text-primary group-hover/blur:border-accent/40 group-hover/blur:scale-105 transition-all">
                <Eye className="w-3.5 h-3.5 text-accent" /> Click to reveal
              </span>
            </div>
          )}
        </div>
      </div>
      {bottomAction && (
        <div className="mt-auto pt-3 flex items-center justify-end z-10">
          {bottomAction}
        </div>
      )}
    </div>
  );
};

export default Card;
