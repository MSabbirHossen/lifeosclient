import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Logo } from './Logo';
import {
  LayoutDashboard,
  BookOpen,
  Clock,
  GraduationCap,
  Dumbbell,
  Utensils,
  Wallet,
  Compass,
  Moon,
  CheckSquare,
  Target,
  FileText,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Code2,
} from 'lucide-react';

export const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { t, isRTL } = useLanguage();

  const navigationGroups = [
    {
      title: t('categories.overview', 'Executive Dashboard'),
      items: [
        { name: t('nav.dashboard', 'Dashboard'), path: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: t('categories.habits', 'Consistency & Routines'),
      items: [
        { name: t('nav.habits', 'Habits Tracker'), path: '/habits', icon: CheckSquare },
        { name: t('nav.goals', 'Goals & Milestones'), path: '/goals', icon: Target },
        { name: t('nav.focus', 'Focus & Time'), path: '/time-tracker', icon: Clock },
        { name: t('nav.study', 'Study Tracker'), path: '/study', icon: GraduationCap },
        { name: t('nav.reflection', 'Reflection & Journal'), path: '/journal', icon: BookOpen },
      ],
    },
    {
      title: t('categories.health', 'Health & Lifestyle'),
      items: [
        { name: t('nav.fitness', 'Fitness & Gym'), path: '/fitness', icon: Dumbbell },
        { name: t('nav.calories', 'Nutrition & Macros'), path: '/calories', icon: Utensils },
        { name: t('nav.finance', 'Finance & Wealth'), path: '/finance', icon: Wallet },
      ],
    },
    {
      title: t('categories.spiritual', 'Spiritual Discipline'),
      items: [
        { name: t('nav.islamic', 'Islamic & Deen Hub'), path: '/islamic', icon: Compass },
        { name: t('nav.islamicFasting', 'Fasting (Sawm)'), path: '/islamic-fasting', icon: Moon },
        { name: t('nav.qada', 'Salah & Qada Matrix'), path: '/qada-matrix', icon: Sparkles },
      ],
    },
    {
      title: t('categories.analytics', 'Analytics & System'),
      items: [
        { name: t('nav.reports', 'Analytics & Reports'), path: '/reports', icon: FileText },
        { name: t('nav.settings', 'Settings'), path: '/settings', icon: Settings },
        { name: t('nav.developer', 'Developer Info'), path: '/developer', icon: Code2 },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 rtl:left-auto rtl:right-0 z-40 bg-surface border-r rtl:border-r-0 rtl:border-l border-theme transition-all duration-300 flex flex-col ${
          isCollapsed ? 'w-64 max-w-[85vw] lg:w-20' : 'w-64 max-w-[85vw]'
        } ${
          isMobileOpen
            ? 'translate-x-0'
            : isRTL
            ? 'translate-x-full lg:translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-theme shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <Logo size="sm" variant="glow" />
            <div className={`flex flex-col ${isCollapsed ? 'flex lg:hidden' : 'flex'}`}>
              <span className="font-extrabold text-base text-primary tracking-tight">{t('common.appName', 'Life OS')}</span>
              <span className="text-[10px] text-secondary font-semibold uppercase tracking-wider">
                {t('common.tagline', 'Personal Dashboard')}
              </span>
            </div>
          </div>

          {/* Desktop Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-xl text-secondary hover:text-primary hover:bg-subtle transition-colors cursor-pointer border border-transparent hover:border-theme"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            ) : (
              isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-xl text-secondary hover:text-primary hover:bg-subtle cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 touch-scroll-y">
          {navigationGroups.map((group, idx) => (
            <div key={idx}>
              <h4 className={`px-3 text-[10px] font-bold text-secondary uppercase tracking-widest mb-2 ${isCollapsed ? 'block lg:hidden' : 'block'}`}>
                {group.title}
              </h4>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                          isActive
                            ? 'bg-accent text-white shadow-sm shadow-[#007EA7]/25'
                            : 'text-secondary hover:text-primary hover:bg-subtle'
                        } ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}`
                      }
                      title={isCollapsed ? item.name : undefined}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className={`truncate ${isCollapsed ? 'inline lg:hidden' : 'inline'}`}>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info & Developer quick link */}
        <div className={`p-3 border-t border-theme flex flex-col gap-2 shrink-0 ${isCollapsed ? 'flex lg:hidden' : 'flex'}`}>
          <NavLink
            to="/developer"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center justify-between p-2 rounded-xl bg-subtle hover:bg-accent/10 border border-theme hover:border-accent/30 text-secondary hover:text-primary transition-all group cursor-pointer"
            title="Connect with Developer (MS Hossen)"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#003459] to-[#007EA7] flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-xs">
                MS
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-primary truncate group-hover:text-accent transition-colors">
                  MS Hossen
                </span>
                <span className="text-[9px] text-secondary font-medium truncate">
                  Connect with Dev
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-accent group-hover:underline">
              {isRTL ? '←' : '→'}
            </span>
          </NavLink>

          <div className="flex items-center justify-between text-[11px] font-medium text-secondary px-1">
            <span>Life OS v1.0</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Live" />
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
