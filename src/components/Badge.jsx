import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  icon: Icon,
}) => {
  const variants = {
    neutral: 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-200 border-slate-300 dark:border-zinc-700',
    primary: 'bg-[#007EA7]/15 dark:bg-[#007EA7]/25 text-[#003459] dark:text-[#76DDFF] border-[#007EA7]/40 dark:border-[#007EA7]/50',
    cerulean: 'bg-[#007EA7]/15 dark:bg-[#007EA7]/25 text-[#003459] dark:text-[#76DDFF] border-[#007EA7]/40 dark:border-[#007EA7]/50',
    sky: 'bg-[#00A8E8]/15 dark:bg-[#00A8E8]/25 text-[#003459] dark:text-[#8FDFFF] border-[#00A8E8]/40 dark:border-[#00A8E8]/50',
    info: 'bg-[#007EA7]/15 dark:bg-[#007EA7]/25 text-[#003459] dark:text-[#76DDFF] border-[#007EA7]/40 dark:border-[#007EA7]/50',
    indigo: 'bg-[#007EA7]/15 dark:bg-[#007EA7]/25 text-[#003459] dark:text-[#76DDFF] border-[#007EA7]/40 dark:border-[#007EA7]/50',
    success: 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-950 dark:text-emerald-300 border-emerald-500/40 dark:border-emerald-500/50',
    emerald: 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-950 dark:text-emerald-300 border-emerald-500/40 dark:border-emerald-500/50',
    teal: 'bg-teal-500/15 dark:bg-teal-500/20 text-teal-950 dark:text-teal-300 border-teal-500/40 dark:border-teal-500/50',
    warning: 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-950 dark:text-amber-300 border-amber-500/40 dark:border-amber-500/50',
    amber: 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-950 dark:text-amber-300 border-amber-500/40 dark:border-amber-500/50',
    orange: 'bg-orange-500/15 dark:bg-orange-500/20 text-orange-950 dark:text-orange-300 border-orange-500/40 dark:border-orange-500/50',
    danger: 'bg-rose-500/15 dark:bg-rose-500/20 text-rose-950 dark:text-rose-300 border-rose-500/40 dark:border-rose-500/50',
    rose: 'bg-rose-500/15 dark:bg-rose-500/20 text-rose-950 dark:text-rose-300 border-rose-500/40 dark:border-rose-500/50',
    purple: 'bg-purple-500/15 dark:bg-purple-500/20 text-purple-950 dark:text-purple-300 border-purple-500/40 dark:border-purple-500/50',
    cyan: 'bg-[#00A8E8]/15 dark:bg-[#00A8E8]/25 text-[#003459] dark:text-[#8FDFFF] border-[#00A8E8]/40 dark:border-[#00A8E8]/50',
    blue: 'bg-[#003459]/15 dark:bg-[#003459]/30 text-[#001E34] dark:text-[#8FDFFF] border-[#003459]/35 dark:border-[#003459]/50',
  };

  const dotColors = {
    neutral: 'bg-slate-500',
    primary: 'bg-[#007EA7]',
    cerulean: 'bg-[#007EA7]',
    sky: 'bg-[#00A8E8]',
    info: 'bg-[#007EA7]',
    indigo: 'bg-[#007EA7]',
    success: 'bg-emerald-600',
    emerald: 'bg-emerald-600',
    teal: 'bg-teal-600',
    warning: 'bg-amber-600',
    amber: 'bg-amber-600',
    orange: 'bg-orange-600',
    danger: 'bg-rose-600',
    rose: 'bg-rose-600',
    purple: 'bg-purple-600',
    cyan: 'bg-[#00A8E8]',
    blue: 'bg-[#003459]',
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-[10px] gap-1 font-bold',
    sm: 'px-2.5 py-0.5 text-xs gap-1.5 font-bold',
    md: 'px-3 py-1 text-xs gap-1.5 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center font-bold tracking-tight rounded-full border ${variants[variant] || variants.neutral} ${sizes[size] || sizes.md} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant] || dotColors.neutral}`} />
      )}
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      {children}
    </span>
  );
};

export default Badge;
