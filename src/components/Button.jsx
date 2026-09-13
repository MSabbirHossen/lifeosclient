import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  icon: Icon,
  iconPosition = 'left',
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

  const variants = {
    primary:
      'bg-accent text-white hover:bg-[var(--color-accent-hover)] shadow-sm hover:shadow-[0_0_15px_var(--color-accent-glow)] border border-transparent',
    secondary:
      'bg-surface text-primary border border-theme hover:bg-subtle hover:border-[var(--color-border-hover)] shadow-sm',
    outline:
      'border border-theme text-primary hover:bg-accent/10 hover:border-accent hover:text-accent bg-transparent',
    ghost:
      'text-secondary hover:text-primary hover:bg-subtle bg-transparent border border-transparent',
    danger:
      'bg-[var(--color-danger)] text-white hover:opacity-95 shadow-sm hover:shadow-red-500/20 border border-transparent',
    success:
      'bg-[var(--color-success)] text-white hover:opacity-95 shadow-sm hover:shadow-emerald-500/20 border border-transparent',
    gradient:
      'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-sm hover:shadow-indigo-500/25 border border-transparent',
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-xs gap-1 rounded-lg',
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
    md: 'px-4 py-2 text-sm gap-2 rounded-xl',
    lg: 'px-5 py-2.5 text-base gap-2.5 rounded-xl',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
};

export default Button;
