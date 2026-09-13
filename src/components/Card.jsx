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
}) => {
  return (
    <div
      className={`relative group bg-surface border border-theme rounded-2xl card-shadow flex flex-col ${
        hover ? 'card-hover' : ''
      } ${noPadding ? '' : 'p-4 sm:p-5 md:p-6'} ${className}`}
    >
      <div className="flex-1 min-w-0">
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
      {bottomAction && (
        <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 flex items-center gap-1 z-10 opacity-85 sm:opacity-70 group-hover:opacity-100 transition-all duration-200">
          {bottomAction}
        </div>
      )}
    </div>
  );
};

export default Card;
