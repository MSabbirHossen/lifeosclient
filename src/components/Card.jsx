import React from 'react';

export const Card = ({
  children,
  className = '',
  title,
  subtitle,
  icon: Icon,
  action,
  hover = false,
  badge,
  noPadding = false,
}) => {
  return (
    <div
      className={`bg-surface border border-theme rounded-2xl card-shadow ${
        hover ? 'card-hover' : ''
      } ${noPadding ? '' : 'p-4 sm:p-5 md:p-6'} ${className}`}
    >
      {(title || action || Icon || badge) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 mb-4 pb-3 border-b border-subtle">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {title && <h3 className="text-sm sm:text-base font-bold text-primary truncate tracking-tight">{title}</h3>}
                {badge && <span>{badge}</span>}
              </div>
              {subtitle && <p className="text-xs text-secondary mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0 flex items-center gap-2 self-start sm:self-auto flex-wrap">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
