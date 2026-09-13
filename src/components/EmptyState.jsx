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
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-surface/40 border border-dashed border-theme rounded-2xl ${className}`}
    >
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-4 border border-accent/20">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h4 className="text-base font-bold text-primary tracking-tight">{title}</h4>
      <p className="text-sm text-secondary mt-1.5 max-w-sm">{description}</p>
      {actionText && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="sm" icon={ActionIcon} onClick={onAction}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
