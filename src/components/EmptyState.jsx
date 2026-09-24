import React from 'react';
import { Button } from './Button';
import { Plus } from 'lucide-react';

export const EmptyState = ({
  icon: Icon,
  title = 'No entries yet',
  description = 'Get started by creating your first entry.',
  actionText,
  onAction,
  actionIcon: ActionIcon = Plus,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-5 sm:p-6 text-center bg-surface/40 border border-dashed border-theme rounded-2xl ${className}`}
    >
      {Icon && (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-2.5 border border-accent/20 shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <h4 className="text-sm font-bold text-primary tracking-tight">{title}</h4>
      <p className="text-xs text-secondary mt-1 max-w-sm">{description}</p>
      {actionText && onAction && (
        <div className="mt-3.5">
          <Button variant="primary" size="sm" icon={ActionIcon} onClick={onAction} className="text-xs font-bold py-1.5 px-3">
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
