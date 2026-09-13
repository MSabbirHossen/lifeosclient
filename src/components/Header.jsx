import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getFormattedDate, formatDisplayDate } from '../utils/dateHelpers';
import { Menu, Sun, Moon, Monitor, LogOut, User as UserIcon, Calendar, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { StreakWidget } from './StreakWidget';

export const Header = ({ onOpenMobileMenu, selectedDate, setSelectedDate }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, effectiveTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const currentDate = selectedDate || getFormattedDate();

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(getFormattedDate());
  };

  const isToday = currentDate === getFormattedDate();

  return (
    <header className="h-16 glass-header px-3 sm:px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 card-shadow gap-2">
      {/* Left: Mobile Menu & Date Control Pill */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 sm:p-2 rounded-xl text-secondary hover:text-primary hover:bg-subtle transition-colors cursor-pointer shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Date Control Pill */}
        <div className="flex items-center gap-0.5 sm:gap-1.5 bg-subtle p-0.5 sm:p-1 rounded-xl border border-theme min-w-0">
          <button
            onClick={handlePrevDay}
            className="p-1 rounded-lg text-secondary hover:text-primary hover:bg-surface transition-colors cursor-pointer shrink-0"
            title="Previous Day"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 py-0.5 min-w-0">
            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent shrink-0 hidden xs:inline" />
            <input
              type="date"
              value={currentDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-primary focus:outline-none cursor-pointer text-[11px] sm:text-xs font-semibold max-w-[95px] xs:max-w-[110px] sm:max-w-none"
            />
            <span className="hidden sm:inline text-secondary font-medium text-xs border-l border-theme pl-2 whitespace-nowrap">
              {formatDisplayDate(currentDate)}
            </span>
          </div>

          <button
            onClick={handleNextDay}
            className="p-1 rounded-lg text-secondary hover:text-primary hover:bg-surface transition-colors cursor-pointer shrink-0"
            title="Next Day"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {!isToday && (
            <button
              onClick={handleToday}
              className="hidden md:inline-flex px-2 py-0.5 text-[11px] font-bold text-accent hover:bg-accent/10 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Center/Right: Universal Streak & Break Countdown Widget */}
      {user && (
        <div className="hidden sm:flex items-center justify-center">
          <StreakWidget />
        </div>
      )}

      {/* Right: Theme Switcher & Profile Dropdown */}
      <div className="flex items-center gap-2.5">
        {/* Mobile Streak Icon Pill */}
        {user && (
          <div className="sm:hidden">
            <StreakWidget compact />
          </div>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-subtle transition-all duration-200 cursor-pointer border border-transparent hover:border-theme"
          title={`Theme: ${theme} (Click to toggle)`}
          aria-label="Toggle Theme"
        >
          {theme === 'system' ? (
            <Monitor className="w-4 h-4" />
          ) : effectiveTheme === 'dark' ? (
            <Moon className="w-4 h-4 text-indigo-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </button>

        {/* Profile Dropdown */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-subtle border border-transparent hover:border-theme transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden md:inline text-xs font-semibold text-primary pr-1">
                {user.name}
              </span>
            </button>

            {showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-52 bg-surface border border-theme rounded-2xl card-shadow py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setShowProfileMenu(false)}
              >
                <div className="px-4 py-2 border-b border-subtle">
                  <p className="text-xs font-bold text-primary truncate">{user.name}</p>
                  <p className="text-[11px] text-secondary truncate mt-0.5">{user.email}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[var(--color-danger)] hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Button variant="primary" size="sm" onClick={() => (window.location.href = '/login')}>
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
