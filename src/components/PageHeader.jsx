import React from 'react';

export const PageHeader = ({ title, description, category, action, className = '' }) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 ${className}`}>
      <div>
        {category && (
          <span className="text-[11px] font-bold text-accent uppercase tracking-wider mb-1 block">
            {category}
          </span>
        )}
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-primary tracking-tight">{title}</h1>
        {description && <p className="text-xs sm:text-sm text-secondary mt-1 max-w-2xl">{description}</p>}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2 flex-wrap w-full sm:w-auto">{action}</div>}
    </div>
  );
};

export default PageHeader;
