import React from 'react';
import { Calendar, Check } from 'lucide-react';
import { getFormattedDate, formatDisplayDate } from '../utils/dateHelpers';

export const DateInput = ({
  label = 'Date',
  value,
  onChange,
  required = false,
  className = '',
  disabled = false,
  id,
  defaultToday = true,
}) => {
  const todayStr = getFormattedDate();
  const currentValue = value !== undefined ? value : (defaultToday ? todayStr : '');
  const isToday = Boolean(currentValue && currentValue === todayStr);

  const handleSetToday = () => {
    if (disabled) return;
    onChange(todayStr);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="block text-xs font-bold text-secondary uppercase tracking-wider"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>

        {/* Quick Today Button */}
        <button
          type="button"
          onClick={handleSetToday}
          disabled={disabled || isToday}
          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-lg transition-all duration-150 cursor-pointer ${
            isToday
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-default'
              : 'bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20 active:scale-95'
          }`}
          title={isToday ? "Date is set to today" : "Set to today's date"}
        >
          {isToday ? <Check className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
          {isToday ? 'Today' : 'Set Today'}
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
          className="input-base w-full text-xs font-semibold cursor-pointer pr-8"
        />
        <div className="absolute right-3 pointer-events-none text-secondary">
          <Calendar className="w-4 h-4 opacity-60" />
        </div>
      </div>
    </div>
  );
};

export default DateInput;
