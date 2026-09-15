import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
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
} from 'lucide-react';

const CURRENCY_OPTIONS = [
  { code: 'USD', symbol: '$', name: 'US Dollar', region: 'Global / USA' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', region: 'Bangladesh' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', region: 'Saudi Arabia' },
  { code: 'EUR', symbol: '€', name: 'Euro', region: 'European Union' },
  { code: 'GBP', symbol: '£', name: 'British Pound', region: 'United Kingdom' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', region: 'United Arab Emirates' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', region: 'India' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar', region: 'Canada' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar', region: 'Australia' },
  { code: 'QAR', symbol: '﷼', name: 'Qatari Riyal', region: 'Qatar' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', region: 'Malaysia' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', region: 'Turkey' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', region: 'Japan' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar', region: 'Kuwait' },
  { code: 'OMR', symbol: '﷼', name: 'Omani Rial', region: 'Oman' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', region: 'Pakistan' },
];

export const Settings = () => {
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
    setSaving(true);
    setSaveSuccess(false);

    const resolvedCurrency = (isCustom ? customCurrency.trim().toUpperCase() : currency) || 'USD';
    localStorage.setItem('lifeos_currency', resolvedCurrency);

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

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update settings', err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
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
    } catch (err) {
      console.error('Failed to export data', err);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-4xl">
      <PageHeader
        category="Configuration & Preferences"
        title="Settings & Preferences"
        description="Manage your account profile, configure daily targets, and customize theme appearance."
      />

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6 sm:space-y-7">
        {/* Appearance Theme Card */}
        <Card hover title="Theme Appearance" subtitle="Select your preferred interface aesthetic" icon={Sparkles}>
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
              <span className="text-xs font-bold">Light Theme</span>
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
              <span className="text-xs font-bold">Dark Theme</span>
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
              <span className="text-xs font-bold">System Default</span>
            </button>
          </div>
        </Card>

        {/* Profile Card */}
        <Card hover title="User Profile" subtitle="Your personal identity details" icon={User}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Full Name
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
                Email Address
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
          title="Default Currency & Financial Unit"
          subtitle="Select your preferred currency for financial balances, expense tracking, and ledgers"
          icon={Coins}
        >
          <div className="space-y-4 mt-2">
            {/* Live Financial Formatting Preview */}
            <div className="p-3.5 rounded-2xl bg-subtle border border-theme flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
                  Financial Formatting Preview
                </span>
                <span className="text-sm font-extrabold text-primary mt-0.5 block">
                  Net Wealth Sample:{' '}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    2,500.00 {effectiveCurrency}
                  </span>{' '}
                  <span className="text-xs text-secondary font-medium">
                    (Expense: -150.00 {effectiveCurrency})
                  </span>
                </span>
              </div>
              <Badge variant="purple" size="xs">
                Active Code: {effectiveCurrency}
              </Badge>
            </div>

            {/* Quick Currency Selection Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-accent/10 border-accent shadow-sm'
                        : 'bg-subtle border-theme hover:border-[var(--color-border-hover)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black ${isSelected ? 'text-accent' : 'text-primary'}`}>
                        {curr.code}
                      </span>
                      <span className="text-xs font-bold text-secondary">{curr.symbol}</span>
                    </div>
                    <span className="text-[10px] text-secondary truncate mt-1">{curr.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Comprehensive Dropdown & Custom Option */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                  All Global Currencies
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
                  className="select-base"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol}) — {c.name} ({c.region})
                    </option>
                  ))}
                  <option value="CUSTOM">✏️ Custom Currency Code...</option>
                </select>
              </div>

              {isCustom && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                    Custom Currency Code (ISO 3-Letter)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. CHF, SGD, NZD, SEK"
                    value={customCurrency}
                    onChange={(e) => setCustomCurrency(e.target.value.toUpperCase())}
                    className="input-base font-mono uppercase"
                  />
                  <span className="text-[10px] text-secondary mt-1 block">
                    Enter any 3 to 5 letter international currency symbol.
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Daily Target Goals Card */}
        <Card hover title="Daily Targets & Baselines" subtitle="Configure baseline calculations" icon={Target}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Calorie Budget (kcal)
              </label>
              <input
                type="number"
                min="500"
                max="10000"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(e.target.value)}
                className="input-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Target Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="30"
                max="250"
                value={weightGoal}
                onChange={(e) => setWeightGoal(e.target.value)}
                className="input-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Daily Study Target (Mins)
              </label>
              <input
                type="number"
                min="10"
                max="1440"
                value={studyMinutesGoal}
                onChange={(e) => setStudyMinutesGoal(e.target.value)}
                className="input-base"
              />
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
            Save All Preferences
          </Button>
        </div>
      </form>

      {/* Data Backup & Export Section */}
      <Card hover title="Data Ownership & Backup" subtitle="Download complete system database" icon={Download}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <span className="text-xs font-bold text-primary block">Full Database Backup (JSON)</span>
            <p className="text-xs text-secondary mt-0.5 max-w-lg">
              Download your entire dataset including time logs, journal entries, nutrition, workouts, and prayers.
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
            Export All Data
          </Button>
        </div>
      </Card>

      {/* Creator & Developer Info */}
      <Card hover title="About the Creator" subtitle="Designed & Engineered by MS Hossen" icon={Code2}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-base shadow-sm shadow-indigo-500/25 shrink-0">
              MS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-primary">MS Hossen</span>
                <Badge variant="purple" size="xs">Part-Time Coder</Badge>
              </div>
              <p className="text-xs text-secondary mt-0.5">
                Creator of Life OS. Connect on WhatsApp, Telegram, Email, Portfolio, LinkedIn, YouTube, and GitHub.
              </p>
            </div>
          </div>
          <Link to="/developer">
            <Button variant="secondary" size="md" icon={ExternalLink} className="w-full sm:w-auto shrink-0">
              Developer Hub & Links
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
