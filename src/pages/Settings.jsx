import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';
import { notifyUpdated, notifyError, showSuccessToast, notifyGuestAction } from '../utils/alerts';
import { Link } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  User,
  Sun,
  Moon,
  Monitor,
  Target,
  Download,
  Save,
  CheckCircle2,
  Lock,
  Sparkles,
  Code2,
  ExternalLink,
  Coins,
  Globe,
  Check,
  Flame,
  Scale,
  BookOpen,
  Clock,
  Wallet,
  TrendingUp,
  Zap,
} from 'lucide-react';

const CURRENCY_OPTIONS = [
  { code: 'USD', symbol: '$', name: 'US Dollar', region: 'Global / USA', flag: '🇺🇸' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', region: 'Bangladesh', flag: '🇧🇩' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', region: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'EUR', symbol: '€', name: 'Euro', region: 'European Union', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', region: 'United Kingdom', flag: '🇬🇧' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', region: 'UAE', flag: '🇦🇪' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', region: 'India', flag: '🇮🇳' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar', region: 'Canada', flag: '🇨🇦' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar', region: 'Australia', flag: '🇦🇺' },
  { code: 'QAR', symbol: '﷼', name: 'Qatari Riyal', region: 'Qatar', flag: '🇶🇦' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', region: 'Malaysia', flag: '🇲🇾' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', region: 'Turkey', flag: '🇹🇷' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', region: 'Japan', flag: '🇯🇵' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar', region: 'Kuwait', flag: '🇰🇼' },
  { code: 'OMR', symbol: '﷼', name: 'Omani Rial', region: 'Oman', flag: '🇴🇲' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', region: 'Pakistan', flag: '🇵🇰' },
];

const LANGUAGE_OPTIONS = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    subtitle: 'Default (LTR)',
    badgeCode: 'EN',
    badgeBg: 'bg-blue-500/10 dark:bg-blue-500/15',
    badgeText: 'text-blue-600 dark:text-blue-400',
  },
  {
    code: 'bn',
    label: 'Bengali',
    nativeLabel: 'বাংলা',
    subtitle: 'Bengali (LTR)',
    fontClass: 'font-bengali',
    badgeCode: 'বাং',
    badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    code: 'ar',
    label: 'Arabic',
    nativeLabel: 'العربية',
    subtitle: 'Arabic (RTL)',
    fontClass: 'font-arabic',
    badgeCode: 'ع',
    badgeBg: 'bg-amber-500/10 dark:bg-amber-500/15',
    badgeText: 'text-amber-600 dark:text-amber-400',
  },
];

export const Settings = () => {
  const { t, language, setLanguage, changeLanguage } = useLanguage();
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  // Currency Preference
  const [currency, setCurrency] = useState(() => {
    return user?.currency || localStorage.getItem('lifeos_currency') || 'USD';
  });
  const [customCurrency, setCustomCurrency] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  // Goals Preferences
  const [calorieGoal, setCalorieGoal] = useState(user?.dailyCalorieGoal || 2000);
  const [weightGoal, setWeightGoal] = useState(user?.weightGoal || 70);
  const [studyMinutesGoal, setStudyMinutesGoal] = useState(user?.dailyStudyMinutesGoal || 120);

  // Status message
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setCalorieGoal(user.dailyCalorieGoal || 2000);
      setWeightGoal(user.weightGoal || 70);
      setStudyMinutesGoal(user.dailyStudyMinutesGoal || 120);

      const userCurr = (user.currency || localStorage.getItem('lifeos_currency') || 'USD').toUpperCase();
      const match = CURRENCY_OPTIONS.find((c) => c.code === userCurr);
      if (match) {
        setCurrency(userCurr);
        setIsCustom(false);
        setCustomCurrency('');
      } else {
        setCurrency('CUSTOM');
        setIsCustom(true);
        setCustomCurrency(userCurr);
      }
    }
  }, [user]);

  const effectiveCurrency = (isCustom ? customCurrency.trim().toUpperCase() : currency) || 'USD';

  const handleSaveSettings = async (e) => {
    e.preventDefault();

    const resolvedCurrency = (isCustom ? customCurrency.trim().toUpperCase() : currency) || 'USD';
    localStorage.setItem('lifeos_currency', resolvedCurrency);

    if (!user) {
      notifyGuestAction('Settings', 'saved locally for preview');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        name,
        currency: resolvedCurrency,
        dailyCalorieGoal: Number(calorieGoal),
        weightGoal: Number(weightGoal),
        dailyStudyMinutesGoal: Number(studyMinutesGoal),
      };

      if (updateUser) {
        await updateUser(payload);
      } else {
        await api.put('/auth/profile', payload);
      }

      notifyUpdated('Profile Settings');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update settings', err);
      notifyError(err, 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    if (!user) {
      notifyGuestAction('Account data export', 'requires sign in');
      return;
    }

    setExportLoading(true);
    try {
      const res = await api.get('/backup/export');
      const dataStr =
        'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `lifeos-backup-${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showSuccessToast('Full JSON backup downloaded successfully!', 'Backup Exported');
    } catch (err) {
      console.error('Failed to export data', err);
      notifyError(err, 'Failed to export backup data');
    } finally {
      setExportLoading(false);
    }
  };


  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-4xl">
      <PageHeader
        category={t('categories.system', 'System & Preferences')}
        title={t('settings.title', 'System Preferences & Settings')}
        description={t('settings.subtitle', 'Configure appearance, localization, units, data backups, and account settings.')}
      />

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {t('settings.savedSuccessfully')}
        </div>
      )}

      {/* Language & Localization Card */}
      <Card hover title={t('settings.language')} subtitle={t('settings.switchLanguageSubtitle')} icon={Globe}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-2">
          {LANGUAGE_OPTIONS.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 text-left group ${
                  isSelected
                    ? 'bg-accent/10 border-accent text-accent ring-2 ring-accent/20 shadow-md shadow-accent/5 -translate-y-0.5'
                    : 'bg-subtle/80 hover:bg-surface border-theme hover:border-theme-strong text-secondary hover:text-primary'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-xs shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-xs ${
                      isSelected
                        ? 'bg-accent text-white border-accent shadow-accent/25'
                        : `${lang.badgeBg} ${lang.badgeText} border-theme`
                    }`}
                  >
                    {lang.badgeCode}
                  </div>
                  <div className="min-w-0">
                    <span className={`text-sm font-bold block truncate text-primary ${lang.fontClass || ''}`}>
                      {lang.nativeLabel}
                    </span>
                    <span className="text-[11px] text-secondary block truncate">
                      {lang.subtitle}
                    </span>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                    isSelected
                      ? 'bg-accent border-accent text-white shadow-xs'
                      : 'border-theme bg-surface text-transparent group-hover:border-accent/40'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <form onSubmit={handleSaveSettings} className="space-y-6 sm:space-y-7">
        {/* Appearance Theme Card */}
        <Card hover title={t('settings.themeAppearance')} subtitle={t('settings.themeAppearanceSubtitle')} icon={Sparkles}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-2">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-2.5 ${
                theme === 'light'
                  ? 'bg-accent/10 border-accent text-accent shadow-sm'
                  : 'bg-subtle border-theme text-secondary hover:text-primary hover:border-[var(--color-border-hover)]'
              }`}
            >
              <Sun className="w-6 h-6 text-amber-500" />
              <span className="text-xs font-bold">{t('settings.lightTheme')}</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-2.5 ${
                theme === 'dark'
                  ? 'bg-accent/10 border-accent text-accent shadow-sm'
                  : 'bg-subtle border-theme text-secondary hover:text-primary hover:border-[var(--color-border-hover)]'
              }`}
            >
              <Moon className="w-6 h-6 text-indigo-400" />
              <span className="text-xs font-bold">{t('settings.darkTheme')}</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-2.5 ${
                theme === 'system'
                  ? 'bg-accent/10 border-accent text-accent shadow-sm'
                  : 'bg-subtle border-theme text-secondary hover:text-primary hover:border-[var(--color-border-hover)]'
              }`}
            >
              <Monitor className="w-6 h-6 text-secondary" />
              <span className="text-xs font-bold">{t('settings.systemDefault')}</span>
            </button>
          </div>
        </Card>

        {/* Profile Card */}
        <Card hover title={t('settings.userProfile')} subtitle={t('settings.userProfileSubtitle')} icon={User}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                {t('settings.fullName')}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                {t('settings.emailAddress')}
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="input-base opacity-60 cursor-not-allowed"
              />
            </div>
          </div>
        </Card>

        {/* Default Currency & Financial Preferences Card */}
        <Card
          hover
          title={t('settings.defaultCurrency')}
          subtitle={t('settings.defaultCurrencySubtitle')}
          icon={Coins}
        >
          <div className="space-y-5 mt-2">
            {/* Live Financial Formatting Preview Banner */}
            <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-indigo-500/[0.08] via-purple-500/[0.05] to-emerald-500/[0.05] border border-theme card-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shadow-xs shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold text-secondary uppercase tracking-widest block">
                      {t('settings.financialFormattingPreview')}
                    </span>
                    <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
                      <span className="text-lg sm:text-xl font-black text-primary tracking-tight">
                        2,500.00 <span className="text-accent">{effectiveCurrency}</span>
                      </span>
                      <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                        {t('settings.expenseSample')} -150.00 {effectiveCurrency}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-surface border border-theme shadow-xs text-primary">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {t('settings.activeCode')} {effectiveCurrency}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Currency Selection Grid */}
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2.5">
                Popular Regional Currencies
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {CURRENCY_OPTIONS.slice(0, 8).map((curr) => {
                  const isSelected = !isCustom && currency === curr.code;
                  return (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => {
                        setCurrency(curr.code);
                        setIsCustom(false);
                      }}
                      className={`group relative p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between select-none ${
                        isSelected
                          ? 'bg-gradient-to-br from-accent/15 via-accent/10 to-transparent border-accent shadow-md shadow-accent/10 ring-1 ring-accent/30'
                          : 'bg-surface hover:bg-subtle border-theme hover:border-[var(--color-border-hover)] hover:-translate-y-0.5 shadow-xs'
                      }`}
                    >
                      {/* Top Row: Flag + Code + Symbol Badge */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base leading-none" role="img" aria-label={curr.name}>
                            {curr.flag}
                          </span>
                          <span className={`text-sm font-black tracking-tight ${isSelected ? 'text-accent' : 'text-primary'}`}>
                            {curr.code}
                          </span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-accent text-white border-accent'
                            : 'bg-subtle border-theme text-secondary group-hover:text-primary'
                        }`}>
                          {curr.symbol}
                        </span>
                      </div>

                      {/* Bottom Row: Name and Region */}
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-primary block truncate">
                          {curr.name}
                        </span>
                        <span className="text-[10px] text-secondary font-medium block truncate">
                          {curr.region}
                        </span>
                      </div>

                      {/* Selected Checkmark Badge */}
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comprehensive Dropdown & Custom Option */}
            <div className="p-4 rounded-2xl bg-subtle border border-theme space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-accent" />
                    {t('settings.allGlobalCurrencies')}
                  </label>
                  <select
                    value={isCustom ? 'CUSTOM' : currency}
                    onChange={(e) => {
                      if (e.target.value === 'CUSTOM') {
                        setIsCustom(true);
                      } else {
                        setIsCustom(false);
                        setCurrency(e.target.value);
                      }
                    }}
                    className="select-base font-semibold"
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code} ({c.symbol}) — {c.name} ({c.region})
                      </option>
                    ))}
                    <option value="CUSTOM">{t('settings.customCurrencyOption')}</option>
                  </select>
                </div>

                {isCustom ? (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                      {t('settings.customCurrencyCode')}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. CHF, SGD, NZD, SEK"
                      value={customCurrency}
                      onChange={(e) => setCustomCurrency(e.target.value.toUpperCase())}
                      className="input-base font-mono uppercase font-bold"
                    />
                    <span className="text-[10px] text-secondary mt-1 block">
                      {t('settings.customCurrencyDesc')}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col justify-center">
                    <span className="text-xs font-bold text-secondary">
                      Active Unit Display:
                    </span>
                    <span className="text-xs text-muted mt-0.5">
                      All balances, logs, and summaries will format with <strong className="text-primary font-bold">{effectiveCurrency}</strong>.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Daily Target Goals Card */}
        <Card
          hover
          title={t('settings.dailyTargetsBaselines')}
          subtitle={t('settings.dailyTargetsSubtitle')}
          icon={Target}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            {/* 1. Calorie Target Card */}
            <div className="p-4 rounded-2xl bg-surface border border-theme hover:border-amber-500/30 transition-all card-shadow flex flex-col justify-between space-y-3.5 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-primary uppercase tracking-wider">
                      {t('settings.calorieBudget')}
                    </h4>
                    <span className="text-[11px] text-secondary font-medium">Daily intake target</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="relative">
                  <input
                    type="number"
                    min="500"
                    max="10000"
                    step="50"
                    value={calorieGoal}
                    onChange={(e) => setCalorieGoal(e.target.value)}
                    className="input-base font-extrabold text-base pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-secondary pointer-events-none">
                    kcal
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 mt-2">
                  {[1800, 2000, 2400].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCalorieGoal(preset)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                        Number(calorieGoal) === preset
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : 'bg-subtle border-theme text-secondary hover:text-primary hover:border-[var(--color-border-hover)]'
                      }`}
                    >
                      {preset} kcal
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-secondary leading-relaxed pt-1 border-t border-subtle">
                Powers your daily deficit/surplus & energy engine metrics.
              </p>
            </div>

            {/* 2. Target Weight Card */}
            <div className="p-4 rounded-2xl bg-surface border border-theme hover:border-emerald-500/30 transition-all card-shadow flex flex-col justify-between space-y-3.5 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-primary uppercase tracking-wider">
                      {t('settings.targetWeight')}
                    </h4>
                    <span className="text-[11px] text-secondary font-medium">Ideal body goal</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="250"
                    value={weightGoal}
                    onChange={(e) => setWeightGoal(e.target.value)}
                    className="input-base font-extrabold text-base pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-secondary pointer-events-none">
                    kg
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 mt-2">
                  {[65, 70, 75].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setWeightGoal(preset)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                        Number(weightGoal) === preset
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-subtle border-theme text-secondary hover:text-primary hover:border-[var(--color-border-hover)]'
                      }`}
                    >
                      {preset} kg
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-secondary leading-relaxed pt-1 border-t border-subtle">
                Reference milestone for body metrics & weight tracking trends.
              </p>
            </div>

            {/* 3. Study & Focus Goal Card */}
            <div className="p-4 rounded-2xl bg-surface border border-theme hover:border-indigo-500/30 transition-all card-shadow flex flex-col justify-between space-y-3.5 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-accent flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-primary uppercase tracking-wider">
                      {t('settings.dailyStudyTarget')}
                    </h4>
                    <span className="text-[11px] text-secondary font-medium">
                      {Math.floor(Number(studyMinutesGoal || 0) / 60)}h {Number(studyMinutesGoal || 0) % 60}m daily
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    max="1440"
                    step="15"
                    value={studyMinutesGoal}
                    onChange={(e) => setStudyMinutesGoal(e.target.value)}
                    className="input-base font-extrabold text-base pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-secondary pointer-events-none">
                    mins
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 mt-2">
                  {[60, 120, 180].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setStudyMinutesGoal(preset)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                        Number(studyMinutesGoal) === preset
                          ? 'bg-indigo-500/15 text-accent border-indigo-500/30'
                          : 'bg-subtle border-theme text-secondary hover:text-primary hover:border-[var(--color-border-hover)]'
                      }`}
                    >
                      {preset === 60 ? '1 hr' : preset === 120 ? '2 hrs' : '3 hrs'}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-secondary leading-relaxed pt-1 border-t border-subtle">
                Powers your daily pomodoro rings & study consistency score.
              </p>
            </div>
          </div>
        </Card>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="gradient"
            size="lg"
            icon={Save}
            loading={saving}
            className="w-full sm:w-auto shadow-md shadow-indigo-500/20 font-bold"
          >
            {t('settings.saveAllPreferences')}
          </Button>
        </div>
      </form>

      {/* Data Backup & Export Section */}
      <Card hover title={t('settings.dataOwnershipBackup')} subtitle={t('settings.dataOwnershipSubtitle')} icon={Download}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <span className="text-xs font-bold text-primary block">{t('settings.fullDatabaseBackup')}</span>
            <p className="text-xs text-secondary mt-0.5 max-w-lg">
              {t('settings.fullDatabaseBackupDesc')}
            </p>
          </div>
          <Button
            variant="secondary"
            size="md"
            icon={Download}
            loading={exportLoading}
            onClick={handleExportData}
            className="w-full sm:w-auto shrink-0"
          >
            {t('settings.exportAllDataBtn')}
          </Button>
        </div>
      </Card>

      {/* Creator & Developer Info */}
      <Card hover title={t('settings.aboutTheCreator')} subtitle={t('settings.aboutTheCreatorSubtitle')} icon={Code2}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-base shadow-sm shadow-indigo-500/25 shrink-0">
              MS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-primary">MS Hossen</span>
                <Badge variant="purple" size="xs">{t('settings.partTimeCoder')}</Badge>
              </div>
              <p className="text-xs text-secondary mt-0.5">
                {t('settings.creatorBio')}
              </p>
            </div>
          </div>
          <Link to="/developer">
            <Button variant="secondary" size="md" icon={ExternalLink} className="w-full sm:w-auto shrink-0">
              {t('settings.developerHubLinks')}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
