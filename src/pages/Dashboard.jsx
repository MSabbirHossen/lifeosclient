import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { FastingTimer } from '../components/FastingTimer';
import { GuidedReflectionModal } from '../components/GuidedReflectionModal';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { getFormattedDate, formatDisplayDate } from '../utils/dateHelpers';
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

const CHART_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

const SALAH_STATUS_CONFIG = {
  onTime: { label: 'On Time', icon: '🟢', class: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  jamaah: { label: "Jama'ah", icon: '🕌', class: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30' },
  late: { label: 'Late', icon: '🟡', class: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  missed: { label: 'Missed', icon: '🔴', class: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30' },
  qada: { label: 'Qada', icon: '🟣', class: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30' },
  pending: { label: 'Pending', icon: '⚪', class: 'bg-subtle text-secondary border-theme' },
};

const SALAH_CYCLE = ['pending', 'onTime', 'jamaah', 'late', 'missed', 'qada'];

export const Dashboard = ({ selectedDate }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const activeDate = selectedDate || getFormattedDate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);
  const [salahMap, setSalahMap] = useState({
    Fajr: 'pending',
    Dhuhr: 'pending',
    Asr: 'pending',
    Maghrib: 'pending',
    Isha: 'pending',
  });

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await api.get(`/dashboard/summary?date=${activeDate}`);
      setData(res.data);
      if (res.data?.summary?.salah?.prayerMap) {
        setSalahMap(res.data.summary.salah.prayerMap);
      }
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

    try {
      await api.post('/islamic/salah', {
        date: activeDate,
        prayerName,
        status: nextStatus,
      });
    } catch (err) {
      console.error('Failed to update Salah status', err);
      fetchDashboardData(true);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-semibold text-secondary">Synthesizing Personal Life Cockpit...</span>
      </div>
    );
  }

  const defaultSummary = {
    journal: null,
    prompt: { category: 'Growth', question: 'What is one high-impact decision you made today?' },
    time: { totalMinutes: 0, byCategory: {}, count: 0 },
    study: { totalMinutes: 0, sessionsCount: 0 },
    calories: { consumed: 0, intake: 0, burned: 0, net: 0, remaining: 2000, goal: 2000, protein: 0 },
    fitness: { caloriesBurned: 0, workoutsCount: 0 },
    salah: { completedCount: 0, total: 5, logs: [] },
    finance: { expensesToday: 0, expensesMonth: 0, incomeToday: 0 },
    habits: { activeCount: 0, completedTodayCount: 0 },
    goalsCount: 0,
  };

  const summary = data?.summary || defaultSummary;

  // Calorie calculations
  const calorieIntake = summary.calories?.intake ?? summary.calories?.consumed ?? 0;
  const calorieBurned = summary.fitness?.caloriesBurned ?? summary.calories?.burned ?? 0;
  const netCalories = summary.calories?.net ?? (calorieIntake - calorieBurned);
  const calorieGoal = summary.calories?.goal ?? 2000;
  const remainingCalories = Math.max(0, calorieGoal - netCalories);
  const isDeficit = netCalories <= calorieGoal;

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
        category="Command Center"
        title="Personal Life Management Cockpit"
        description={`Live synthesis and metrics for ${formatDisplayDate(activeDate)}`}
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => fetchDashboardData(true)}
              className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-subtle border border-theme transition-all cursor-pointer"
              title="Refresh Dashboard Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-accent' : ''}`} />
            </button>
            <Button
              variant="secondary"
              size="md"
              icon={CheckSquare}
              onClick={() => navigate('/habits')}
            >
              Habits
            </Button>
            <Button
              variant="gradient"
              size="md"
              icon={BookOpen}
              onClick={() => setIsReflectionModalOpen(true)}
            >
              Guided Reflection
            </Button>
          </div>
        }
      />

      {/* 5-Prayer Salah Interactive Pills Strip */}
      <div className="p-4 rounded-2xl bg-surface border border-theme card-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-black text-primary uppercase tracking-wider">
              Today's 5 Daily Prayers (Salah)
            </span>
            <Badge variant="success" size="xs">
              {Object.values(salahMap).filter((s) => s !== 'pending' && s !== 'missed').length} / 5 Done
            </Badge>
          </div>
          <button
            onClick={() => navigate('/qada-matrix')}
            className="text-xs font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
          >
            Qada Matrix <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
          {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => {
            const status = salahMap[prayer] || 'pending';
            const config = SALAH_STATUS_CONFIG[status] || SALAH_STATUS_CONFIG.pending;
            return (
              <button
                key={prayer}
                type="button"
                onClick={() => handleCycleSalah(prayer)}
                className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${config.class}`}
                title={`Click to cycle status: ${prayer}`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-xs sm:text-sm font-extrabold text-primary">{prayer}</span>
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
          title="Time Logged"
          value={`${Math.floor((summary.time?.totalMinutes || 0) / 60)}h ${(summary.time?.totalMinutes || 0) % 60}m`}
          subtitle={`${summary.time?.count || 0} blocks recorded`}
          icon={Clock}
          color="indigo"
        />
        <StatCard
          title="Net Calorie Balance"
          value={`${netCalories} kcal`}
          subtitle={`${isDeficit ? 'Caloric Deficit' : 'Caloric Surplus'} (${remainingCalories} rem)`}
          icon={Utensils}
          color={isDeficit ? 'emerald' : 'rose'}
        />
        <StatCard
          title="Calories Burned"
          value={`${calorieBurned} kcal`}
          subtitle={`${summary.fitness?.workoutsCount || 0} workout sessions`}
          icon={Dumbbell}
          color="amber"
        />
        <StatCard
          title="Habits Completed"
          value={`${summary.habits?.completedTodayCount || 0} / ${summary.habits?.activeCount || 0}`}
          subtitle="Daily discipline streak"
          icon={Flame}
          color="purple"
        />
      </div>

      {/* Row 2: Main Asymmetrical Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7">
        {/* Left 8-Cols: Calorie Engine, Fasting, & Time Timeline */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-7">
          {/* Calorie Intake vs Expenditure Net Balance Engine Card */}
          <Card
            hover
            title="Daily Calorie & Energy Balance Engine"
            subtitle="Live synthesis of food intake vs workout expenditure"
            icon={Activity}
            badge={
              <Badge variant={isDeficit ? 'success' : 'danger'} size="xs">
                {isDeficit ? 'Deficit Target' : 'Surplus Warning'}
              </Badge>
            }
            action={
              <Button variant="ghost" size="xs" onClick={() => navigate('/calories')}>
                Meal Logger <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            }
          >
            <div className="space-y-4 pt-1">
              {/* Dual-Bar Metrics Meter */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                    Total Intake
                  </span>
                  <span className="text-2xl font-black text-primary mt-1 block">
                    {calorieIntake} <span className="text-xs font-semibold text-secondary">kcal</span>
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                    Total Burned
                  </span>
                  <span className="text-2xl font-black text-primary mt-1 block">
                    {calorieBurned} <span className="text-xs font-semibold text-secondary">kcal</span>
                  </span>
                </div>

                <div className={`p-3.5 rounded-2xl border ${isDeficit ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-purple-500/10 border-purple-500/20'}`}>
                  <span className="text-[11px] font-bold uppercase tracking-wider block text-secondary">
                    Net Balance
                  </span>
                  <span className={`text-2xl font-black mt-1 block ${isDeficit ? 'text-emerald-600 dark:text-emerald-400' : 'text-purple-600 dark:text-purple-400'}`}>
                    {netCalories} <span className="text-xs font-semibold text-secondary">/ {calorieGoal} kcal</span>
                  </span>
                </div>
              </div>

              {/* Visual Multi-Segment Bar Meter */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-secondary">Intake ({calorieIntake}) - Burned ({calorieBurned})</span>
                  <span className={isDeficit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
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
              title="Finance Snapshot"
              subtitle="Expenses & Cashflow"
              icon={Wallet}
              action={
                <Button variant="ghost" size="xs" onClick={() => navigate('/finance')}>
                  Ledger <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              }
            >
              <div className="space-y-3 pt-1">
                <div className="p-3 rounded-xl bg-subtle border border-theme flex items-center justify-between">
                  <span className="text-xs font-bold text-secondary">Today's Expenses</span>
                  <span className="text-lg font-black text-[var(--color-danger)]">
                    {(summary.finance?.expensesToday || 0).toFixed(2)} {currentCurrency}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-subtle border border-theme flex items-center justify-between">
                  <span className="text-xs font-bold text-secondary">Month to Date</span>
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
            title="Today's Time Allocation"
            subtitle="Logged blocks categorized across deep work, study, deen, & rest"
            icon={Clock}
            action={
              <Button variant="ghost" size="xs" onClick={() => navigate('/time-tracker')}>
                Timeline <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            }
          >
            {timeChartData.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-xs text-secondary italic bg-subtle/50 rounded-xl border border-dashed border-theme mt-2">
                <Clock className="w-8 h-8 text-muted mb-2 stroke-1" />
                No time blocks recorded for this date.
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
            title="Daily Guided Reflection"
            subtitle="Prompt of the Day"
            icon={BookOpen}
            badge={<Badge variant="primary" size="xs">Journal</Badge>}
          >
            <div className="space-y-3.5 mt-1">
              <Badge variant="purple" size="xs">
                <Sparkles className="w-3 h-3 mr-1" /> {summary.prompt?.category || 'Self-Growth'}
              </Badge>
              <p className="text-sm font-extrabold text-primary italic leading-relaxed">
                "{summary.prompt?.question}"
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
                  Answer Prompt
                </Button>
              )}
            </div>
          </Card>

          {/* Spiritual Wisdom & Anchor */}
          <Card
            hover
            title="Spiritual Anchor"
            subtitle="Daily Islamic Wisdom"
            icon={Compass}
            badge={<Badge variant="success" size="xs">Deen</Badge>}
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
          <Card hover title="Quick Cockpit Actions" icon={Sparkles}>
            <div className="space-y-2 mt-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                icon={Plus}
                onClick={() => navigate('/calories')}
              >
                Log Meal & Water
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                icon={Dumbbell}
                onClick={() => navigate('/fitness')}
              >
                Log Workout
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                icon={Compass}
                onClick={() => navigate('/qada-matrix')}
              >
                Open Qada Matrix
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                icon={Wallet}
                onClick={() => navigate('/finance')}
              >
                Transfer / Expense
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
