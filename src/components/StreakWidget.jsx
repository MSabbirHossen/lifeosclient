import React, { useState, useEffect } from 'react';
import { Flame, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import { getFormattedDate } from '../utils/dateHelpers';

export const StreakWidget = ({ compact = false, className = '' }) => {
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    isSecuredToday: false,
    loading: true,
  });

  const [timeRemaining, setTimeRemaining] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
  });

  const [showTooltip, setShowTooltip] = useState(false);

  // Fetch streak state from dashboard summary
  const fetchStreak = async () => {
    try {
      const today = getFormattedDate();
      const res = await api.get(`/dashboard?date=${today}`);
      const s = res.data?.summary?.streak;
      if (s) {
        setStreakData({
          currentStreak: s.currentStreak || 0,
          isSecuredToday: !!s.isSecuredToday,
          loading: false,
        });
      }
    } catch (e) {
      // Graceful fallback
      setStreakData((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchStreak();
    // Refresh streak status when user focuses window
    const handleFocus = () => fetchStreak();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Live ticking countdown to midnight local time
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const diffMs = Math.max(0, midnight.getTime() - now.getTime());
      const totalSec = Math.floor(diffMs / 1000);

      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      setTimeRemaining({
        hours,
        minutes,
        seconds,
        totalSeconds: totalSec,
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const { currentStreak, isSecuredToday, loading } = streakData;
  const { hours, minutes, seconds } = timeRemaining;
  const countdownFormatted = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;

  if (loading) {
    return (
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-subtle/50 border border-theme text-xs text-secondary animate-pulse ${className}`}>
        <Flame className="w-3.5 h-3.5 opacity-40" />
        <span>Loading streak...</span>
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip((prev) => !prev)}
    >
      <div
        className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer select-none ${
          isSecuredToday
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/15'
            : currentStreak > 0
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/15 animate-pulse'
            : 'bg-subtle text-secondary border-theme hover:text-primary'
        }`}
      >
        <div className="flex items-center gap-1 shrink-0">
          <Flame
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
              isSecuredToday
                ? 'text-emerald-500 fill-emerald-500/30'
                : currentStreak > 0
                ? 'text-amber-500 fill-amber-500/30 animate-bounce'
                : 'text-secondary'
            }`}
          />
          <span className="tracking-tight">{compact ? `${currentStreak}d` : `${currentStreak}d Streak`}</span>
        </div>

        {!compact && (
          <>
            <span className="text-theme opacity-40">|</span>

            <div className="flex items-center gap-1 text-[11px] font-semibold">
              <Clock className="w-3 h-3 opacity-70" />
              <span className="font-mono">{countdownFormatted}</span>
            </div>

            {/* Small Status Dot */}
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isSecuredToday
                  ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                  : currentStreak > 0
                  ? 'bg-amber-500 shadow-sm shadow-amber-500/50'
                  : 'bg-muted'
              }`}
              title={isSecuredToday ? 'Secured for today' : 'At risk before midnight'}
            />
          </>
        )}
      </div>

      {/* Hover / Click Detail Popover */}
      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] p-3.5 bg-surface border border-theme rounded-2xl card-shadow z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-subtle">
            {isSecuredToday ? (
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            )}
            <span className="font-bold text-primary">
              {isSecuredToday ? 'Streak Secured for Today!' : 'Streak at Risk!'}
            </span>
          </div>

          <p className="text-[11px] text-secondary leading-relaxed mb-2.5">
            {isSecuredToday
              ? `Great job! You've logged your daily activities. Your ${currentStreak}-day streak is safe. Next cycle starts at midnight in:`
              : `You haven't completed a habit or activity today yet. Complete any task before midnight to preserve your ${currentStreak}-day streak:`}
          </p>

          <div className="flex items-center justify-between p-2 rounded-xl bg-subtle border border-theme font-mono font-bold text-primary text-xs">
            <span className="text-[10px] uppercase tracking-wider text-secondary font-sans font-bold">
              {isSecuredToday ? 'Reset In' : 'Expires In'}
            </span>
            <span className={isSecuredToday ? 'text-emerald-500' : 'text-amber-500'}>
              {countdownFormatted}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreakWidget;
