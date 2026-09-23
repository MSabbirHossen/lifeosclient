import React from 'react';

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
}) => {
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
        {(title || action || Icon || badge) && (
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3 mb-3.5 sm:mb-4 pb-2.5 sm:pb-3 border-b border-subtle/80 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              {Icon && (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-accent/10 dark:bg-accent/15 border border-accent/20 flex items-center justify-center text-accent shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105">
                  <Icon className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
                  {title && <h3 className="text-sm font-bold text-primary truncate tracking-tight">{title}</h3>}
                  {badge && <span className="shrink-0">{badge}</span>}
                </div>
                {subtitle && <p className="text-xs text-secondary mt-0.5 truncate">{subtitle}</p>}
              </div>
            </div>
            {action && <div className="shrink-0 flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto justify-end">{action}</div>}
          </div>
        )}
        {children}
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
