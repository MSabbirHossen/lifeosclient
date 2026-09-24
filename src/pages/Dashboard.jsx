import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { FastingTimer } from '../components/FastingTimer';
import { GuidedReflectionModal } from '../components/GuidedReflectionModal';
import { LoadingScreen } from '../components/LoadingScreen';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import api, { getLocalCache, setLocalCache } from '../utils/api';
import { showSuccessToast, notifyError, notifyGuestAction } from '../utils/alerts';
import { getFormattedDate, formatDisplayDate } from '../utils/dateHelpers';
import { notifyStreakUpdate } from '../utils/streakEvents';
import {
  Clock,
  Utensils,
  Compass,
  CheckSquare,
  Plus,
  Flame,
  Wallet,
  Sparkles,
  Shuffle,
  BookOpen,
  ArrowRight,
  Target,
  RefreshCw,
  Dumbbell,
  Moon,
  Sun,
  Activity,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

const CHART_COLORS = ['#007EA7', '#00A8E8', '#003459', '#10B981', '#F59E0B', '#32CCFF'];

const SALAH_STATUS_CONFIG = {
  onTime: { label: 'On Time', icon: '🟢', class: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/40 font-bold' },
  jamaah: { label: "Jama'ah", icon: '🕌', class: 'bg-[#007EA7]/15 text-[#003459] dark:text-[#76DDFF] border-[#007EA7]/40 font-bold' },
  late: { label: 'Late', icon: '🟡', class: 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-500/40 font-bold' },
  missed: { label: 'Missed', icon: '🔴', class: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/40 font-bold' },
  qada: { label: 'Qada', icon: '🟣', class: 'bg-purple-500/15 text-purple-900 dark:text-purple-300 border-purple-500/40 font-bold' },
  pending: { label: 'Pending', icon: '⚪', class: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-zinc-700 font-bold' },
};

const SALAH_CYCLE = ['pending', 'onTime', 'jamaah', 'late', 'missed', 'qada'];

export const Dashboard = ({ selectedDate }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const activeDate = selectedDate || getFormattedDate();

  const [data, setData] = useState(() => {
    const cached = getLocalCache(`/dashboard/summary?date=${activeDate}`);
    return cached?.data || null;
  });
  const [todayFast, setTodayFast] = useState(() => {
    const cached = getLocalCache(`/islamic/fasts?date=${activeDate}`);
    return cached?.data?.[0] || null;
  });
  const [fastingSummary, setFastingSummary] = useState(() => {
    const cached = getLocalCache('/islamic/fasts/summary');
    return cached?.data || null;
  });
  const [salahMap, setSalahMap] = useState(() => {
    const cached = getLocalCache(`/dashboard/summary?date=${activeDate}`);
    if (cached?.data?.summary?.salah?.prayerMap) {
      return cached.data.summary.salah.prayerMap;
    }
    return {
      Fajr: 'pending',
      Dhuhr: 'pending',
      Asr: 'pending',
      Maghrib: 'pending',
      Isha: 'pending',
    };
  });
  const [loading, setLoading] = useState(() => {
    const cached = getLocalCache(`/dashboard/summary?date=${activeDate}`);
    return !cached;
  });
  const [refreshing, setRefreshing] = useState(false);
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    const cached = getLocalCache(`/dashboard/summary?date=${activeDate}`);
    if (!cached && !isSilent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const [res, fastRes, fastSummaryRes] = await Promise.all([
        api.get(`/dashboard/summary?date=${activeDate}`),
        api.get(`/islamic/fasts?date=${activeDate}`).catch(() => ({ data: [] })),
        api.get('/islamic/fasts/summary').catch(() => ({ data: null })),
      ]);
      setLocalCache(`/dashboard/summary?date=${activeDate}`, res.data);
      if (fastRes.data) setLocalCache(`/islamic/fasts?date=${activeDate}`, fastRes.data);
      if (fastSummaryRes.data) setLocalCache('/islamic/fasts/summary', fastSummaryRes.data);

      setData(res.data);
      if (res.data?.summary?.salah?.prayerMap) {
        setSalahMap(res.data.summary.salah.prayerMap);
      }
      setTodayFast(fastRes.data?.[0] || null);
      setFastingSummary(fastSummaryRes.data || null);
    } catch (err) {
      console.error('Failed to fetch dashboard summary', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeDate]);

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh when window regains focus
    const handleFocus = () => {
      fetchDashboardData(true);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchDashboardData]);

  // Fast 1-click optimistic Salah toggle
  const handleCycleSalah = async (prayerName) => {
    const currentStatus = salahMap[prayerName] || 'pending';
    const currentIndex = SALAH_CYCLE.indexOf(currentStatus);
    const nextStatus = SALAH_CYCLE[(currentIndex + 1) % SALAH_CYCLE.length];

    setSalahMap((prev) => ({ ...prev, [prayerName]: nextStatus }));

    if (!user) {
      notifyStreakUpdate();
      notifyGuestAction(`${prayerName} prayer`, `set to ${SALAH_STATUS_CONFIG[nextStatus]?.label || nextStatus}`);
      return;
    }

    try {
      await api.post('/islamic/salah', {
        date: activeDate,
        prayerName,
        salah: prayerName,
        status: nextStatus,
      });
      notifyStreakUpdate();
      showSuccessToast(
        `${prayerName} set to ${SALAH_STATUS_CONFIG[nextStatus]?.label || nextStatus}`,
        'Prayer Log'
      );
      fetchDashboardData(true);
    } catch (err) {
      console.error('Failed to update prayer status', err);
      notifyError(err, 'Failed to update prayer status');
      fetchDashboardData(true);
    }
  };

  const handleToggleFastToday = async (newStatus, defaultType = 'nafl') => {
    if (!user) {
      if (newStatus === 'none') {
        setTodayFast(null);
      } else {
        setTodayFast({
          _id: `guest-fast-${Date.now()}`,
          date: activeDate,
          type: defaultType,
          status: newStatus,
        });
      }
      notifyStreakUpdate();
      notifyGuestAction('Fasting status', `set to ${newStatus}`);
      return;
    }

    try {
      if (newStatus === 'none') {
        await api.post('/islamic/fasts', { date: activeDate, status: 'none' });
        setTodayFast(null);
        showSuccessToast('Fasting status cleared for today', 'Fasting Log');
      } else {
        const type = todayFast?.type || defaultType;
        const res = await api.post('/islamic/fasts', {
          date: activeDate,
          type,
          status: newStatus,
          suhoorTime: todayFast?.suhoorTime || '',
          iftarTime: todayFast?.iftarTime || '',
          notes: todayFast?.notes || '',
        });
        setTodayFast(res.data);
        showSuccessToast(
          newStatus === 'completed' ? 'Fast logged as Completed! MashaAllah' : `Fast status set to ${newStatus}`,
          'Fasting Log'
        );
      }
      const sumRes = await api.get('/islamic/fasts/summary').catch(() => ({ data: null }));
      if (sumRes.data) setFastingSummary(sumRes.data);
    } catch (err) {
      console.error('Failed to toggle fast status', err);
      notifyError(err, 'Failed to toggle fast status');
    }
  };


  if (loading) {
    return <LoadingScreen fullScreen={false} message={t('common.loading', 'Loading Dashboard...')} />;
  }

  const summary = data?.summary || {};
  const calorieIntake = summary.calories?.intake ?? summary.calories?.consumed ?? summary.calories?.totalIntake ?? 0;
  const calorieBurned = summary.fitness?.totalCaloriesBurned ?? summary.fitness?.caloriesBurned ?? summary.calories?.burned ?? 0;
  const netCalories = summary.calories?.netCalories ?? summary.calories?.net ?? (calorieIntake - calorieBurned);
  const calorieGoal = summary.calories?.goal ?? 2000;
  const remainingCalories = summary.calories?.remainingCalories ?? Math.max(0, calorieGoal - netCalories);
  const isDeficit = summary.calories?.isDeficit ?? (netCalories <= calorieGoal);

  // Time Chart Data
  const timeChartData = Object.entries(summary.time?.byCategory || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const currentCurrency = summary.finance?.currency || (user?.currency || localStorage.getItem('lifeos_currency') || 'USD').toUpperCase();

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Top Cockpit Header */}
      <PageHeader
        category={t('categories.overview', 'Command Center')}
        title={t('dashboard.title', 'Personal Life Management Cockpit')}
        description={`${t('dashboard.subtitle', 'Live synthesis and metrics for')} ${formatDisplayDate(activeDate)}`}
        action={
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <button
              onClick={() => fetchDashboardData(false)}
              className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-subtle border border-theme transition-all cursor-pointer shrink-0 flex items-center justify-center min-w-[36px] min-h-[36px]"
              title="Refresh Dashboard Data"
            >
              {refreshing ? (
                <Logo size="xs" loading={true} />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </button>
            <Button
              variant="secondary"
              size="sm"
              icon={CheckSquare}
              onClick={() => navigate('/habits')}
              className="flex-1 sm:flex-initial justify-center"
            >
              {t('nav.habits', 'Habits Tracker')}
            </Button>
            <Button
              variant="gradient"
              size="sm"
              icon={BookOpen}
              onClick={() => setIsReflectionModalOpen(true)}
              className="flex-1 sm:flex-initial justify-center"
            >
              {t('reflection.guidedReflection', 'Guided Reflection')}
            </Button>
          </div>
        }
      />

      {/* 5-Prayer Salah Interactive Pills Strip */}
      <div
        onClick={(e) => {
          if (!e.target.closest('button')) navigate('/islamic');
        }}
        className="p-3.5 sm:p-5 rounded-2xl bg-surface border border-theme card-shadow transition-all duration-200 hover:shadow-md hover:border-theme-strong hover:-translate-y-0.5 cursor-pointer"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2 pb-2.5 border-b border-theme/60">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/islamic')}>
            <Compass className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-xs sm:text-sm font-extrabold text-primary uppercase tracking-wider hover:text-accent transition-colors">
              {t('dashboard.salahTitle', "Today's 5 Daily Prayers (Salah)")}
            </span>
            <Badge variant="success" size="xs">
              {Object.values(salahMap).filter((s) => s !== 'pending' && s !== 'missed').length} / 5 {t('goals.completed', 'Done')}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs">
            <button
              onClick={() => navigate('/islamic-fasting')}
              className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-bold flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
            >
              <Moon className="w-3 h-3" /> {t('nav.islamicFasting', 'Fasting (Sawm)')}
            </button>
            <button
              onClick={() => navigate('/qada-matrix')}
              className="px-2 py-1 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 font-bold flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
            >
              {t('nav.qada', 'Salah & Qada Matrix')}
            </button>
            <button
              onClick={() => navigate('/islamic')}
              className="px-2 py-1 rounded-lg bg-subtle text-secondary hover:text-primary hover:bg-surface font-bold flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
            >
              {t('nav.islamic', 'Islamic & Deen')} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-2.5">
          {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer, idx) => {
            const status = salahMap[prayer] || 'pending';
            const config = SALAH_STATUS_CONFIG[status] || SALAH_STATUS_CONFIG.pending;
            const prayerNameTranslated = t(`dashboard.salah${prayer}`, prayer);
            const isLastOnMobile = idx === 4; // Isha
            return (
              <button
                key={prayer}
                type="button"
                onClick={() => handleCycleSalah(prayer)}
                className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${
                  isLastOnMobile ? 'col-span-2 sm:col-span-1 md:col-span-1' : ''
                } ${config.class}`}
                title={`Click to cycle status: ${prayer}`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-xs sm:text-sm font-extrabold text-primary">{prayerNameTranslated}</span>
                </div>
                <span className="text-[11px] sm:text-xs font-bold flex items-center gap-1">
                  {config.icon} {config.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 1: Bento Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title={t('dashboard.focusMinutes', 'Time Logged')}
          value={`${Math.floor((summary.time?.totalMinutes || 0) / 60)}h ${(summary.time?.totalMinutes || 0) % 60}m`}
          subtitle={`${summary.time?.count || 0} blocks recorded`}
          icon={Clock}
          color="indigo"
          onClick={() => navigate('/time-tracker')}
        />
        <StatCard
          title={t('calories.budgetRemaining', 'Net Calorie Balance')}
          value={`${netCalories} kcal`}
          subtitle={`${isDeficit ? 'Caloric Deficit' : 'Caloric Surplus'} (${remainingCalories} rem)`}
          icon={Utensils}
          color={isDeficit ? 'emerald' : 'rose'}
          onClick={() => navigate('/calories')}
        />
        <StatCard
          title={t('dashboard.burnedToday', 'Calories Burned')}
          value={`${calorieBurned} kcal`}
          subtitle={`${summary.fitness?.workoutsCount || 0} workout sessions`}
          icon={Dumbbell}
          color="amber"
          onClick={() => navigate('/fitness')}
        />
        <StatCard
          title={t('dashboard.habitsCompleted', 'Habits Completed')}
          value={`${summary.habits?.completedTodayCount || 0} / ${summary.habits?.activeCount || 0}`}
          subtitle={t('habits.streak', 'Daily discipline streak')}
          icon={Flame}
          color="purple"
          onClick={() => navigate('/habits')}
        />
      </div>

      {/* Row 2: Main Asymmetrical Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7">
        {/* Left 8-Cols: Calorie Engine, Fasting, & Time Timeline */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-7">
          {/* Calorie Intake vs Expenditure Net Balance Engine Card */}
          <Card
            hover
            onClick={() => navigate('/calories')}
            title={t('dashboard.energyEngineTitle')}
            subtitle={t('dashboard.liveEnergySynthesis')}
            icon={Activity}
            badge={
              <Badge variant={isDeficit ? 'success' : 'danger'} size="xs">
                {isDeficit ? 'Deficit Target' : 'Surplus Warning'}
              </Badge>
            }
            action={
              <Button variant="ghost" size="xs" onClick={() => navigate('/calories')}>
                {t('nav.calories')} <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            }
          >
            <div className="space-y-4 pt-1">
              {/* Dual-Bar Metrics Meter */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                  <span className="text-[11px] font-extrabold text-amber-950 dark:text-amber-300 uppercase tracking-wider block">
                    {t('dashboard.caloriesToday')}
                  </span>
                  <span className="text-2xl font-black text-primary mt-1 block">
                    {calorieIntake} <span className="text-xs font-semibold text-secondary">kcal</span>
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25">
                  <span className="text-[11px] font-extrabold text-rose-950 dark:text-rose-300 uppercase tracking-wider block">
                    {t('dashboard.burnedToday')}
                  </span>
                  <span className="text-2xl font-black text-primary mt-1 block">
                    {calorieBurned} <span className="text-xs font-semibold text-secondary">kcal</span>
                  </span>
                </div>

                <div className={`p-3.5 rounded-2xl border ${isDeficit ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-purple-500/10 border-purple-500/25'}`}>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider block text-secondary">
                    {t('calories.energyBalance')}
                  </span>
                  <span className={`text-2xl font-black mt-1 block ${isDeficit ? 'text-emerald-900 dark:text-emerald-300' : 'text-purple-950 dark:text-purple-300'}`}>
                    {netCalories} <span className="text-xs font-semibold text-secondary">/ {calorieGoal} kcal</span>
                  </span>
                </div>
              </div>

              {/* Visual Multi-Segment Bar Meter */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-secondary">{t('dashboard.caloriesToday')} ({calorieIntake}) - {t('dashboard.burnedToday')} ({calorieBurned})</span>
                  <span className={isDeficit ? 'text-emerald-800 dark:text-emerald-300 font-bold' : 'text-rose-800 dark:text-rose-300 font-bold'}>
                    {remainingCalories > 0 ? `${remainingCalories} kcal Remaining` : `${Math.abs(remainingCalories)} kcal Over Target`}
                  </span>
                </div>
                <div className="w-full h-3.5 bg-subtle rounded-full overflow-hidden border border-theme flex">
                  <div
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((calorieIntake / calorieGoal) * 100))}%` }}
                    title={`Intake: ${calorieIntake} kcal`}
                  />
                  {calorieBurned > 0 && (
                    <div
                      className="h-full bg-rose-500 transition-all duration-500 opacity-90 -ml-2"
                      style={{ width: `${Math.min(50, Math.round((calorieBurned / calorieGoal) * 100))}%` }}
                      title={`Burned: ${calorieBurned} kcal`}
                    />
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* 16:8 Fasting & Finance 2-Col Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* 16:8 Fasting Component */}
            <FastingTimer compact={true} />

            {/* Financial Summary */}
            <Card
              hover
              onClick={() => navigate('/finance')}
              title={t('dashboard.financeSnapshot')}
              subtitle={t('dashboard.expensesCashflow')}
              icon={Wallet}
              action={
                <Button variant="ghost" size="xs" onClick={() => navigate('/finance')}>
                  {t('nav.finance')} <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              }
            >
              <div className="space-y-3 pt-1">
                <div className="p-3 rounded-xl bg-subtle border border-theme flex items-center justify-between">
                  <span className="text-xs font-bold text-secondary">{t('finance.todaysExpenses', "Today's Expenses")}</span>
                  <span className="text-lg font-black text-[var(--color-danger)]">
                    {(summary.finance?.expensesToday || 0).toFixed(2)} {currentCurrency}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-subtle border border-theme flex items-center justify-between">
                  <span className="text-xs font-bold text-secondary">{t('finance.monthToDate', 'Month to Date')}</span>
                  <span className="text-base font-extrabold text-primary">
                    {(summary.finance?.expensesMonth || 0).toFixed(2)} {currentCurrency}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Time Distribution Donut */}
          <Card
            hover
            onClick={() => navigate('/time-tracker')}
            title={t('dashboard.timeAllocation', "Today's Time Allocation")}
            subtitle={t('dashboard.timeBlocksSummary', 'Logged blocks categorized across deep work, study, deen, & rest')}
            icon={Clock}
            action={
              <Button variant="ghost" size="xs" onClick={() => navigate('/time-tracker')}>
                {t('nav.focus', 'Focus')} <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            }
          >
            {timeChartData.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-xs text-secondary italic bg-subtle/50 rounded-xl border border-dashed border-theme mt-2">
                <Clock className="w-8 h-8 text-muted mb-2 stroke-1" />
                {t('time.noLogs', 'No time logs recorded for today')}
              </div>
            ) : (
              <div className="h-56 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={timeChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {timeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [`${val} mins`, 'Duration']}
                      contentStyle={{
                        backgroundColor: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                        borderRadius: '12px',
                        boxShadow: 'var(--shadow-hover)',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        {/* Right 4-Cols: Daily Reflection, Wisdom & Shortcuts */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-7">
          {/* Guided Reflection Card with Shuffle Generator */}
          <Card
            hover
            onClick={() => navigate('/journal')}
            title={t('reflection.guidedReflection', 'Guided Self-Reflection')}
            subtitle={t('dashboard.promptOfDay', 'Prompt of the Day')}
            icon={BookOpen}
            action={
              <Button variant="ghost" size="xs" onClick={() => navigate('/journal')}>
                {t('nav.reflection', 'Reflection & Journal')} <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            }
          >
            <div className="space-y-3.5 mt-1">
              <Badge variant="purple" size="xs">
                <Sparkles className="w-3 h-3 mr-1" /> {summary.prompt?.category || 'Self-Growth'}
              </Badge>
              <p className="text-sm font-extrabold text-primary italic leading-relaxed">
                "{summary.prompt?.question || 'What is one key win you achieved today, and what habits made it possible?'}"
              </p>

              {summary.journal && summary.journal.promptAnswer ? (
                <div className="p-3.5 bg-subtle rounded-xl text-xs text-primary border border-theme font-medium">
                  {summary.journal.promptAnswer}
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-1"
                  icon={Plus}
                  onClick={() => setIsReflectionModalOpen(true)}
                >
                  {t('reflection.saveReflection', 'Save Daily Reflection')}
                </Button>
              )}
            </div>
          </Card>

          {/* Islamic Fasting (Sawm / Siyam) Card */}
          <Card
            hover
            onClick={() => navigate('/islamic-fasting')}
            title={t('islamic.fastingSawmTitle', 'Islamic Fasting (Sawm)')}
            subtitle={t('islamic.fastingSawmSubtitle', 'Sunnah & Obligatory Fasts')}
            icon={Moon}
            badge={
              <Badge
                variant={
                  todayFast?.status === 'completed'
                    ? 'success'
                    : todayFast?.status === 'fasting'
                    ? 'warning'
                    : 'neutral'
                }
                size="xs"
              >
                {todayFast?.status === 'completed'
                  ? `Completed ✨`
                  : todayFast?.status === 'fasting'
                  ? `Fasting Today 🌙`
                  : `Not Fasting`}
              </Badge>
            }
            action={
              <Button variant="ghost" size="xs" onClick={() => navigate('/islamic-fasting')}>
                {t('common.viewAll', 'View All')} <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            }
          >
            <div className="space-y-3 pt-1">
              {/* Today's Status Banner */}
              <div
                className={`p-3.5 rounded-xl border flex flex-col gap-2.5 ${
                  todayFast?.status === 'completed'
                    ? 'bg-emerald-500/10 border-emerald-500/25'
                    : todayFast?.status === 'fasting'
                    ? 'bg-amber-500/10 border-amber-500/25'
                    : 'bg-subtle/70 border-theme'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    {todayFast?.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : todayFast?.status === 'fasting' ? (
                      <span className="relative flex h-2.5 w-2.5 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                      </span>
                    ) : (
                      <Moon className="w-4 h-4 text-secondary" />
                    )}
                    {todayFast?.status === 'completed'
                      ? t('islamic.fastCompletedToday', 'Fast Completed Today (Alhamdulillah)')
                      : todayFast?.status === 'fasting'
                      ? t('islamic.fastingInProgress', 'Fasting in Progress Today')
                      : t('islamic.notFastingToday', 'Not Marked as Fasting Today')}
                  </span>
                  {todayFast?.type && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-surface border border-theme text-secondary">
                      {todayFast.type.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>

                {/* 1-Click Toggle Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {!todayFast || todayFast.status === 'none' || todayFast.status === 'broken' ? (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                           e.stopPropagation();
                          handleToggleFastToday('fasting', 'nafl');
                        }}
                        className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 transition-all cursor-pointer text-center"
                      >
                        🌙 Fast Today
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFastToday('completed', 'nafl');
                        }}
                        className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all cursor-pointer text-center"
                      >
                        ✓ Completed
                      </button>
                    </>
                  ) : todayFast.status === 'fasting' ? (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFastToday('completed');
                        }}
                        className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer text-center shadow-xs"
                      >
                        ✨ Complete Fast (Iftar)
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFastToday('none');
                        }}
                        className="py-1.5 px-2.5 rounded-lg text-xs font-medium text-secondary hover:text-primary hover:bg-subtle border border-theme transition-all cursor-pointer"
                      >
                        Reset
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {todayFast.suhoorTime && todayFast.iftarTime
                          ? `Suhoor: ${todayFast.suhoorTime} • Iftar: ${todayFast.iftarTime}`
                          : 'May Allah accept your fasting and worship'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFastToday('none');
                        }}
                        className="text-[11px] text-secondary hover:text-rose-500 underline cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Fasting Quick Mini-Stats */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 rounded-xl bg-subtle border border-theme">
                  <span className="text-[10px] text-secondary font-bold block uppercase">{t('islamic.totalFasts', 'Total')}</span>
                  <span className="text-base font-black text-primary">{fastingSummary?.totalCompleted || 0}</span>
                </div>
                <div className="p-2 rounded-xl bg-subtle border border-theme">
                  <span className="text-[10px] text-secondary font-bold block uppercase">{t('islamic.sunnahFasts', 'Sunnah')}</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{fastingSummary?.sunnahCount || 0}</span>
                </div>
                <div className="p-2 rounded-xl bg-subtle border border-theme">
                  <span className="text-[10px] text-secondary font-bold block uppercase">{t('islamic.ramadanFasts', 'Ramadan')}</span>
                  <span className="text-base font-black text-amber-600 dark:text-amber-400">{fastingSummary?.ramadanCount || 0}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Spiritual Wisdom & Anchor */}
          <Card
            hover
            onClick={() => navigate('/islamic')}
            title={t('dashboard.spiritualAnchor', 'Spiritual Anchor')}
            subtitle={t('dashboard.dailyIslamicWisdom', 'Daily Islamic Wisdom')}
            icon={Compass}
            action={
              <Button variant="ghost" size="xs" onClick={() => navigate('/islamic')}>
                {t('nav.islamic', 'Islamic & Deen Hub')} <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            }
          >
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-2 mt-1">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Hadith of the Day
              </p>
              <p className="text-xs text-primary font-medium italic leading-relaxed">
                "The most beloved of deeds to Allah are those that are most consistent, even if they are small."
              </p>
              <span className="text-[10px] text-secondary font-semibold block pt-1">
                — Sahih Al-Bukhari & Muslim
              </span>
            </div>
          </Card>

          {/* Quick Actions Card */}
          <Card hover title={t('dashboard.quickActions')} icon={Sparkles}>
            <div className="space-y-2 mt-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                icon={Moon}
                onClick={() => navigate('/islamic-fasting')}
              >
                {t('nav.islamicFasting', 'Fasting (Sawm)')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                icon={Plus}
                onClick={() => navigate('/calories')}
              >
                {t('dashboard.logMealWater')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                icon={Dumbbell}
                onClick={() => navigate('/fitness')}
              >
                {t('dashboard.logWorkout')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                icon={Compass}
                onClick={() => navigate('/qada-matrix')}
              >
                {t('dashboard.openQadaMatrix')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                icon={Wallet}
                onClick={() => navigate('/finance')}
              >
                {t('dashboard.transferExpense')}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Guided Reflection Modal */}
      <GuidedReflectionModal
        isOpen={isReflectionModalOpen}
        onClose={() => setIsReflectionModalOpen(false)}
        selectedDate={activeDate}
        onSaveSuccess={() => fetchDashboardData(true)}
      />
    </div>
  );
};

export default Dashboard;
