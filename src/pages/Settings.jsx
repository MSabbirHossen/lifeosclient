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
  Wallet,
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
  const { t, language, setLanguage } = useLanguage();
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
    if (e && e.preventDefault) e.preventDefault();

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
    <div className="space-y-5 animate-fade-in max-w-6xl mx-auto pb-8">
      {/* Top Header with Compact Direct Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-1 border-b border-subtle">
        <PageHeader
          category={t('categories.system', 'System & Preferences')}
          title={t('settings.title', 'System Preferences & Settings')}
          description={t('settings.subtitle', 'Configure appearance, localization, units, data backups, and account settings.')}
          className="mb-0"
        />
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Button
            type="button"
            onClick={handleSaveSettings}
            variant="gradient"
            size="md"
            icon={Save}
            loading={saving}
            className="shadow-md shadow-indigo-500/20 font-bold px-4"
          >
            {t('settings.saveAllPreferences')}
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {t('settings.savedSuccessfully')}
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN: Appearance, Language, Profile & Data (col-span-6) */}
          <div className="lg:col-span-6 space-y-5">
            {/* 1. Theme Appearance (Compact Segmented) */}
            <Card
              hover
              title={t('settings.themeAppearance')}
              subtitle={t('settings.themeAppearanceSubtitle')}
              icon={Sparkles}
              headerClassName="pb-2.5"
            >
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`py-2.5 px-3 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 font-bold text-xs ${
                    theme === 'light'
                      ? 'bg-accent/15 border-accent text-accent shadow-xs'
                      : 'bg-subtle border-theme text-secondary hover:text-primary hover:border-[var(--color-border-hover)]'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>{t('settings.lightTheme')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`py-2.5 px-3 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 font-bold text-xs ${
                    theme === 'dark'
                      ? 'bg-accent/15 border-accent text-accent shadow-xs'
                      : 'bg-subtle border-theme text-secondary hover:text-primary hover:border-[var(--color-border-hover)]'
                  }`}
                >
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span>{t('settings.darkTheme')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`py-2.5 px-3 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 font-bold text-xs ${
                    theme === 'system'
                      ? 'bg-accent/15 border-accent text-accent shadow-xs'
                      : 'bg-subtle border-theme text-secondary hover:text-primary hover:border-[var(--color-border-hover)]'
                  }`}
                >
                  <Monitor className="w-4 h-4 text-secondary" />
                  <span>{t('settings.systemDefault')}</span>
                </button>
              </div>
            </Card>

            {/* 2. Language & Localization (Compact Grid) */}
            <Card
              hover
              title={t('settings.language')}
              subtitle={t('settings.switchLanguageSubtitle')}
              icon={Globe}
              headerClassName="pb-2.5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {LANGUAGE_OPTIONS.map((lang) => {
                  const isSelected = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setLanguage(lang.code)}
                      className={`p-2.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-2 text-left group ${
                        isSelected
                          ? 'bg-accent/10 border-accent text-accent ring-1 ring-accent/30 shadow-xs'
                          : 'bg-subtle hover:bg-surface border-theme hover:border-theme-strong text-secondary hover:text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center font-black text-[10px] shrink-0 ${
                            isSelected
                              ? 'bg-accent text-white border-accent'
                              : `${lang.badgeBg} ${lang.badgeText} border-theme`
                          }`}
                        >
                          {lang.badgeCode}
                        </div>
                        <div className="min-w-0">
                          <span className={`text-xs font-bold block truncate text-primary ${lang.fontClass || ''}`}>
                            {lang.nativeLabel}
                          </span>
                          <span className="text-[10px] text-secondary block truncate">
                            {lang.label}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-accent text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* 3. User Profile Card */}
            <Card
              hover
              title={t('settings.userProfile')}
              subtitle={t('settings.userProfileSubtitle')}
              icon={User}
              headerClassName="pb-2.5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-1">
                    {t('settings.fullName')}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-base text-xs font-semibold py-2"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider">
                      {t('settings.emailAddress')}
                    </label>
                    <span className="text-[10px] font-bold text-muted flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Read-only
                    </span>
                  </div>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="input-base text-xs font-semibold py-2 opacity-60 cursor-not-allowed bg-subtle"
                  />
                </div>
              </div>
            </Card>

            {/* 4. Data Ownership & Backup Card */}
            <Card
              hover
              title={t('settings.dataOwnershipBackup')}
              subtitle={t('settings.dataOwnershipSubtitle')}
              icon={Download}
              headerClassName="pb-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-subtle border border-theme">
                <div>
                  <span className="text-xs font-bold text-primary block">{t('settings.fullDatabaseBackup')}</span>
                  <p className="text-[11px] text-secondary mt-0.5 max-w-sm">
                    {t('settings.fullDatabaseBackupDesc')}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={Download}
                  loading={exportLoading}
                  onClick={handleExportData}
                  className="w-full sm:w-auto shrink-0 font-bold"
                >
                  {t('settings.exportAllDataBtn')}
                </Button>
              </div>
            </Card>

            {/* 5. Creator & Developer Info Card */}
            <Card
              hover
              title={t('settings.aboutTheCreator')}
              subtitle={t('settings.aboutTheCreatorSubtitle')}
              icon={Code2}
              headerClassName="pb-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-subtle border border-theme">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0">
                    MS
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-primary">MS Hossen</span>
                      <Badge variant="purple" size="xs">{t('settings.partTimeCoder')}</Badge>
                    </div>
                    <p className="text-[11px] text-secondary mt-0.5">
                      {t('settings.creatorBio')}
                    </p>
                  </div>
                </div>
                <Link to="/developer">
                  <Button type="button" variant="secondary" size="sm" icon={ExternalLink} className="w-full sm:w-auto shrink-0 text-xs font-bold">
                    {t('settings.developerHubLinks')}
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: Daily Targets & Currency Settings (col-span-6) */}
          <div className="lg:col-span-6 space-y-5">
            {/* 1. Daily Target Goals Card */}
            <Card
              hover
              title={t('settings.dailyTargetsBaselines')}
              subtitle={t('settings.dailyTargetsSubtitle')}
              icon={Target}
              headerClassName="pb-2.5"
            >
              <div className="space-y-3">
                {/* 1.1 Calorie Target */}
                <div className="p-3 rounded-xl bg-surface border border-theme hover:border-amber-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                        {t('settings.calorieBudget')}
                      </h4>
                      <span className="text-[10px] text-secondary">Daily intake baseline</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative w-28">
                      <input
                        type="number"
                        min="0"
                        max="10000"
                        step="1"
                        value={calorieGoal}
                        onChange={(e) => setCalorieGoal(e.target.value)}
                        className="input-base text-xs font-extrabold py-1.5 pr-10 text-right"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-secondary pointer-events-none">
                        kcal
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1800, 2000, 2400].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCalorieGoal(preset)}
                          className={`text-[10px] font-bold px-1.5 py-1 rounded-md border transition-all cursor-pointer ${
                            Number(calorieGoal) === preset
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              : 'bg-subtle border-theme text-secondary hover:text-primary'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 1.2 Target Weight */}
                <div className="p-3 rounded-xl bg-surface border border-theme hover:border-emerald-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                        {t('settings.targetWeight')}
                      </h4>
                      <span className="text-[10px] text-secondary">Body goal reference</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative w-28">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="500"
                        value={weightGoal}
                        onChange={(e) => setWeightGoal(e.target.value)}
                        className="input-base text-xs font-extrabold py-1.5 pr-8 text-right"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-secondary pointer-events-none">
                        kg
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[65, 70, 75].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setWeightGoal(preset)}
                          className={`text-[10px] font-bold px-1.5 py-1 rounded-md border transition-all cursor-pointer ${
                            Number(weightGoal) === preset
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-subtle border-theme text-secondary hover:text-primary'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 1.3 Daily Study Target */}
                <div className="p-3 rounded-xl bg-surface border border-theme hover:border-indigo-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-accent flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                        {t('settings.dailyStudyTarget')}
                      </h4>
                      <span className="text-[10px] text-secondary font-medium">
                        {Math.floor(Number(studyMinutesGoal || 0) / 60)}h {Number(studyMinutesGoal || 0) % 60}m daily
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative w-28">
                      <input
                        type="number"
                        min="0"
                        max="1440"
                        step="1"
                        value={studyMinutesGoal}
                        onChange={(e) => setStudyMinutesGoal(e.target.value)}
                        className="input-base text-xs font-extrabold py-1.5 pr-10 text-right"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-secondary pointer-events-none">
                        mins
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[60, 120, 180].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setStudyMinutesGoal(preset)}
                          className={`text-[10px] font-bold px-1.5 py-1 rounded-md border transition-all cursor-pointer ${
                            Number(studyMinutesGoal) === preset
                              ? 'bg-indigo-500/15 text-accent border-indigo-500/30'
                              : 'bg-subtle border-theme text-secondary hover:text-primary'
                          }`}
                        >
                          {preset === 60 ? '1h' : preset === 120 ? '2h' : '3h'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. Default Currency & Financial Preferences Card */}
            <Card
              hover
              title={t('settings.defaultCurrency')}
              subtitle={t('settings.defaultCurrencySubtitle')}
              icon={Coins}
              headerClassName="pb-2.5"
            >
              <div className="space-y-3.5">
                {/* Live Financial Formatting Preview Banner */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500/[0.08] via-purple-500/[0.05] to-emerald-500/[0.05] border border-theme flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-secondary uppercase tracking-wider block">
                        {t('settings.financialFormattingPreview')}
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-base font-black text-primary">
                          2,500.00 <span className="text-accent">{effectiveCurrency}</span>
                        </span>
                        <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                          {t('settings.expenseSample')} -150.00 {effectiveCurrency}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface border border-theme text-primary shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {effectiveCurrency}
                  </span>
                </div>

                {/* Quick Currency Selection 4x2 Grid */}
                <div>
                  <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-1.5">
                    Popular Regional Currencies
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                          className={`relative p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between select-none ${
                            isSelected
                              ? 'bg-accent/15 border-accent shadow-xs ring-1 ring-accent/30'
                              : 'bg-surface hover:bg-subtle border-theme hover:border-[var(--color-border-hover)]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <div className="flex items-center gap-1">
                              <span className="text-sm leading-none" role="img" aria-label={curr.name}>
                                {curr.flag}
                              </span>
                              <span className={`text-xs font-black ${isSelected ? 'text-accent' : 'text-primary'}`}>
                                {curr.code}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-secondary">
                              {curr.symbol}
                            </span>
                          </div>

                          <span className="text-[10px] text-secondary font-medium block truncate">
                            {curr.name}
                          </span>

                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-white flex items-center justify-center shadow-xs">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dropdown / Custom Currency */}
                <div className="p-3 rounded-xl bg-subtle border border-theme space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-accent" />
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
                        className="select-base text-xs font-semibold py-1.5"
                      >
                        {CURRENCY_OPTIONS.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.code} ({c.symbol}) — {c.name}
                          </option>
                        ))}
                        <option value="CUSTOM">{t('settings.customCurrencyOption')}</option>
                      </select>
                    </div>

                    {isCustom ? (
                      <div className="animate-fade-in">
                        <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-1">
                          {t('settings.customCurrencyCode')}
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="e.g. CHF, SGD, NZD"
                          value={customCurrency}
                          onChange={(e) => setCustomCurrency(e.target.value.toUpperCase())}
                          className="input-base text-xs font-mono uppercase font-bold py-1.5"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col justify-center">
                        <span className="text-[11px] font-bold text-secondary">
                          Active Unit Display:
                        </span>
                        <span className="text-[11px] text-muted mt-0.5">
                          Balances & ledgers format in <strong className="text-primary">{effectiveCurrency}</strong>.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Bottom Save Preferences Bar */}
            <div className="p-4 rounded-2xl bg-surface border border-theme card-shadow flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-primary block">Save Your Configuration</span>
                <span className="text-[11px] text-secondary">Syncs all theme, baseline, and regional units</span>
              </div>
              <Button
                type="submit"
                variant="gradient"
                size="md"
                icon={Save}
                loading={saving}
                className="shadow-md shadow-indigo-500/20 font-bold px-5 shrink-0"
              >
                {t('settings.saveAllPreferences')}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Settings;
