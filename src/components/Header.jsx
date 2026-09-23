import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getFormattedDate, formatDisplayDate } from '../utils/dateHelpers';
import {
  Menu,
  Sun,
  Moon,
  Monitor,
  LogOut,
  User as UserIcon,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Globe,
  Check,
} from 'lucide-react';
import { Button } from './Button';
import { StreakWidget } from './StreakWidget';

export const Header = ({ onOpenMobileMenu, selectedDate, setSelectedDate }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, effectiveTheme } = useTheme();
  const { language, setLanguage, supportedLanguages, currentLangObj, t, isRTL } = useLanguage();
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const langMenuRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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
    <header className="h-16 solid-header bg-surface px-3 sm:px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 card-shadow gap-2">
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
            onClick={isRTL ? handleNextDay : handlePrevDay}
            className="p-1 rounded-lg text-secondary hover:text-primary hover:bg-surface transition-colors cursor-pointer shrink-0"
            title={t('common.prevDay', 'Previous Day')}
            aria-label={t('common.prevDay', 'Previous Day')}
          >
            {isRTL ? <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          <div className="flex items-center gap-1 sm:gap-2 px-0.5 sm:px-1.5 py-0.5 min-w-0">
            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent shrink-0 hidden xs:inline" />
            <input
              type="date"
              value={currentDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-primary focus:outline-none cursor-pointer text-[11px] sm:text-xs font-bold w-[92px] sm:w-[125px] p-0"
              aria-label="Select Date"
            />
            <span className="hidden md:inline text-secondary font-medium text-xs border-l rtl:border-l-0 rtl:border-r border-theme pl-2 rtl:pl-0 rtl:pr-2 whitespace-nowrap">
              {formatDisplayDate(currentDate)}
            </span>
          </div>

          <button
            onClick={isRTL ? handlePrevDay : handleNextDay}
            className="p-1 rounded-lg text-secondary hover:text-primary hover:bg-surface transition-colors cursor-pointer shrink-0"
            title={t('common.nextDay', 'Next Day')}
            aria-label={t('common.nextDay', 'Next Day')}
          >
            {isRTL ? <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          {!isToday && (
            <button
              onClick={handleToday}
              className="hidden md:inline-flex px-2 py-0.5 text-[11px] font-bold text-accent hover:bg-accent/10 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              {t('common.today', 'Today')}
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

      {/* Right: Language Selector, Theme Switcher & Profile Dropdown */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        {/* Mobile Streak Icon Pill */}
        {user && (
          <div className="sm:hidden">
            <StreakWidget compact />
          </div>
        )}

        {/* Multilingual Language Switcher Dropdown */}
        <div className="relative" ref={langMenuRef}>
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-secondary hover:text-primary hover:bg-subtle border border-transparent hover:border-theme transition-all cursor-pointer text-xs font-bold"
            title={`${t('common.language', 'Language')}: ${currentLangObj.nativeName}`}
            aria-label="Select Language"
          >
            <Globe className="w-4 h-4 text-accent shrink-0" />
            <span className="hidden xs:inline text-base leading-none">{currentLangObj.flag}</span>
            <span className="hidden md:inline font-semibold">{currentLangObj.nativeName}</span>
          </button>

          {showLangMenu && (
            <div
              className={`absolute top-full mt-2 w-48 max-w-[calc(100vw-1.5rem)] bg-surface border border-theme rounded-2xl card-shadow p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 ${
                isRTL ? 'left-0' : 'right-0'
              }`}
            >
              <div className="px-3 py-1.5 border-b border-subtle mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-secondary">
                  {t('common.language', 'Select Language')}
                </span>
              </div>
              <div className="space-y-0.5">
                {supportedLanguages.map((lang) => {
                  const isActive = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-accent/15 text-accent border border-accent/30'
                          : 'text-secondary hover:text-primary hover:bg-subtle border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{lang.flag}</span>
                        <div className="flex flex-col text-left rtl:text-right">
                          <span className="text-primary font-bold">{lang.nativeName}</span>
                          <span className="text-[10px] text-secondary font-medium">{lang.label}</span>
                        </div>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-accent shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-1.5 sm:p-2 rounded-xl text-secondary hover:text-primary hover:bg-subtle transition-all duration-200 cursor-pointer border border-transparent hover:border-theme"
          title={`Theme: ${theme} (Click to toggle)`}
          aria-label="Toggle Theme"
        >
          {theme === 'system' ? (
            <Monitor className="w-4 h-4" />
          ) : effectiveTheme === 'dark' ? (
            <Moon className="w-4 h-4 text-[#00A8E8]" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </button>

        {/* Profile Dropdown */}
        {user ? (
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-subtle border border-transparent hover:border-theme transition-all cursor-pointer"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-[#003459] to-[#007EA7] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden md:inline text-xs font-semibold text-primary pr-1 rtl:pr-0 rtl:pl-1">
                {user.name}
              </span>
            </button>

            {showProfileMenu && (
              <div
                className={`absolute top-full mt-2 w-52 max-w-[calc(100vw-1.5rem)] bg-surface border border-theme rounded-2xl card-shadow py-2 z-50 animate-in fade-in zoom-in-95 duration-100 ${
                  isRTL ? 'left-0' : 'right-0'
                }`}
              >
                <div className="px-4 py-2 border-b border-subtle">
                  <p className="text-xs font-bold text-primary truncate">{user.name}</p>
                  <p className="text-[11px] text-secondary truncate mt-0.5">{user.email}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[var(--color-danger)] hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer text-left rtl:text-right"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    {t('common.signOut', 'Sign Out')}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Button variant="primary" size="sm" onClick={() => (window.location.href = '/login')}>
            {t('common.signIn', 'Sign In')}
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
