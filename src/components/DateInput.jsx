import React from 'react';
import { Calendar, Check } from 'lucide-react';
import { getFormattedDate, formatDisplayDate } from '../utils/dateHelpers';
import { useLanguage } from '../context/LanguageContext';

export const DateInput = ({
  label,
  value,
  onChange,
  required = false,
  className = '',
  disabled = false,
  id,
  defaultToday = true,
}) => {
  const { t } = useLanguage();
  const displayLabel = label || t('common.date');
  const todayStr = getFormattedDate();
  const currentValue = value !== undefined ? value : (defaultToday ? todayStr : '');
  const isToday = Boolean(currentValue && currentValue === todayStr);

  const handleSetToday = () => {
    if (disabled) return;
    onChange(todayStr);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="h-6 flex items-center justify-between">
        <label
          htmlFor={id}
          className="block text-xs font-bold text-secondary uppercase tracking-wider truncate"
        >
          {displayLabel} {required && <span className="text-rose-500">*</span>}
        </label>

        {/* Quick Today Button */}
        <button
          type="button"
          onClick={handleSetToday}
          disabled={disabled || isToday}
          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md transition-all duration-150 cursor-pointer shrink-0 ${
            isToday
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-default'
              : 'bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20 active:scale-95'
          }`}
          title={isToday ? t('common.today') : t('common.setToday')}
        >
          {isToday ? <Check className="w-2.5 h-2.5" /> : <Calendar className="w-2.5 h-2.5" />}
          {isToday ? t('common.today') : t('common.setToday')}
        </button>
      </div>

      <div className="relative flex items-center">
        <input
          id={id}
          type="date"
          required={required}
          disabled={disabled}
          value={currentValue}
          onChange={(e) => onChange(e.target.value)}
          className="input-base w-full text-xs font-semibold cursor-pointer pr-9"
        />
        <div className="absolute right-3 pointer-events-none text-secondary">
          <Calendar className="w-4 h-4 opacity-70" />
        </div>
      </div>
    </div>
  );
};

export default DateInput;
