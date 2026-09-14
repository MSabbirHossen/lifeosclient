import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import api from '../utils/api';
import { getFormattedDate, formatDisplayDate } from '../utils/dateHelpers';
import {
  CheckSquare,
  Plus,
  Flame,
  CheckCircle2,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

const CATEGORIES = ['Health', 'Learning', 'Productivity', 'Deen', 'Mindset', 'Other'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Helper to calculate how many days a habit has been incomplete
const getHabitIncompleteDays = (habit, targetDateStr) => {
  const isDone = Boolean(habit.completedToday || habit.isCompletedToday);
  if (isDone) return 0;

  if (typeof habit.daysSinceLastCompleted === 'number' && habit.daysSinceLastCompleted > 0) {
    return habit.daysSinceLastCompleted;
  }

  if (habit.lastCompletedDate) {
    const t1 = new Date(targetDateStr).getTime();
    const t2 = new Date(habit.lastCompletedDate).getTime();
    const diff = Math.round((t1 - t2) / (1000 * 3600 * 24));
    return Math.max(1, diff);
  }

  // Never completed habit: days since creation + 1000 weight so never-completed rank highest at top
  const createdDateStr = habit.createdAt
    ? new Date(habit.createdAt).toISOString().split('T')[0]
    : targetDateStr;
  const t1 = new Date(targetDateStr).getTime();
  const t2 = new Date(createdDateStr).getTime();
  const diff = Math.max(1, Math.round((t1 - t2) / (1000 * 3600 * 24)));
  return 1000 + diff;
};

export const HabitsTracker = ({ selectedDate }) => {
  const activeDate = selectedDate || getFormattedDate();

  const [habits, setHabits] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('past_year');
  const [serverLifetimeStats, setServerLifetimeStats] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Productivity');
  const [targetFrequency, setTargetFrequency] = useState('daily');
  const [description, setDescription] = useState('');
  const [createError, setCreateError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const heatmapParams =
        selectedTimeframe === 'past_year'
          ? '?weeks=53'
          : selectedTimeframe === 'lifetime'
          ? '?weeks=104'
          : `?year=${selectedTimeframe}`;

      const [habitsRes, heatmapRes] = await Promise.all([
        api.get(`/habits?date=${activeDate}`),
        api.get(`/habits/heatmap${heatmapParams}`),
      ]);

      const habitsList = Array.isArray(habitsRes.data) ? habitsRes.data : [];
      const heatmapList = Array.isArray(heatmapRes.data?.heatmap)
        ? heatmapRes.data.heatmap
        : Array.isArray(heatmapRes.data)
        ? heatmapRes.data
        : [];

      setHabits(habitsList);
      setHeatmap(heatmapList);
      if (heatmapRes.data?.lifetimeStats) {
        setServerLifetimeStats(heatmapRes.data.lifetimeStats);
      }
    } catch (err) {
      console.error('Failed to fetch habits data', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [activeDate, selectedTimeframe]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Instant 0ms Optimistic Habit Toggle
  const handleToggleHabit = async (habitId, currentStatus) => {
    const isNowDone = !currentStatus;

    // Optimistically update local state immediately
    setHabits((prev) =>
      prev.map((h) => {
        if (h._id === habitId) {
          const currentStreak = h.streak || h.currentStreak || 0;
          const newStreak = isNowDone ? currentStreak + 1 : Math.max(0, currentStreak - 1);
          return {
            ...h,
            completedToday: isNowDone,
            isCompletedToday: isNowDone,
            streak: newStreak,
            currentStreak: newStreak,
            daysSinceLastCompleted: isNowDone ? 0 : (h.daysSinceLastCompleted || 1),
            lastCompletedDate: isNowDone ? activeDate : h.lastCompletedDate,
          };
        }
        return h;
      })
    );

    // Optimistically update heatmap today
    setHeatmap((prev) =>
      prev.map((d) => {
        if (d.date === activeDate) {
          const newCount = Math.max(0, (d.count || 0) + (isNowDone ? 1 : -1));
          return { ...d, count: newCount };
        }
        return d;
      })
    );

    try {
      await api.post(`/habits/${habitId}/toggle`, { date: activeDate });
      fetchData(false);
    } catch (err) {
      console.error('Failed to toggle habit', err);
      fetchData(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingHabitId(null);
    setName('');
    setDescription('');
    setCategory('Productivity');
    setTargetFrequency('daily');
    setCreateError('');
    setIsModalOpen(true);
  };

  const handleEditHabit = (habit) => {
    setEditingHabitId(habit._id);
    setName(habit.name || '');
    setDescription(habit.description || '');
    setCategory(habit.category || 'Productivity');
    setTargetFrequency(habit.targetFrequency || 'daily');
    setCreateError('');
    setIsModalOpen(true);
  };

  const handleCreateHabit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setCreateError('Habit name is required');
      return;
    }

    setSaving(true);
    setCreateError('');
    try {
      const payload = {
        name: name.trim(),
        category,
        targetFrequency,
        description: description.trim(),
      };

      if (editingHabitId) {
        const res = await api.put(`/habits/${editingHabitId}`, payload);
        setIsModalOpen(false);
        setEditingHabitId(null);
        setName('');
        setDescription('');
        if (res.data) {
          setHabits((prev) =>
            prev.map((h) => (h._id === editingHabitId ? { ...h, ...res.data } : h))
          );
        }
      } else {
        const res = await api.post('/habits', payload);
        setIsModalOpen(false);
        setName('');
        setDescription('');
        if (res.data) {
          setHabits((prev) => [...prev, { ...res.data, completedToday: false, streak: 0 }]);
        }
      }
      fetchData(false);
    } catch (err) {
      console.error('Failed to save habit', err);
      setCreateError(err.response?.data?.message || err.message || 'Failed to save habit');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHabit = async () => {
    if (!deleteId) return;
    const targetId = deleteId;
    setDeleteId(null);
    // Optimistically remove from list
    setHabits((prev) => prev.filter((h) => h._id !== targetId));

    try {
      await api.delete(`/habits/${targetId}`);
      fetchData(false);
    } catch (err) {
      console.error('Failed to delete habit', err);
      fetchData(false);
    }
  };

  const safeHabits = Array.isArray(habits) ? habits : [];
  const safeHeatmap = Array.isArray(heatmap) ? heatmap : [];
  const completedCount = safeHabits.filter((h) => h.completedToday || h.isCompletedToday).length;
  const longestStreak = safeHabits.reduce((max, h) => Math.max(max, h.streak || h.currentStreak || 0), 0);

  // Automatic Priority Sorting:
  // 1. Incomplete habits come first; completed habits are automatically sorted to the LAST of the list for the day.
  // 2. The habit incomplete for the MOST days is on TOP every time, followed by every habit after that.
  const sortedHabits = useMemo(() => {
    if (!safeHabits || safeHabits.length === 0) return [];

    return [...safeHabits].sort((a, b) => {
      const aDone = Boolean(a.completedToday || a.isCompletedToday);
      const bDone = Boolean(b.completedToday || b.isCompletedToday);

      // Rule 1: Incomplete habits first, completed habits automatically to the last
      if (!aDone && bDone) return -1;
      if (aDone && !bDone) return 1;

      // Rule 2: Both incomplete: sort by incompleted for the most days (descending)
      if (!aDone && !bDone) {
        const aIncompleteDays = getHabitIncompleteDays(a, activeDate);
        const bIncompleteDays = getHabitIncompleteDays(b, activeDate);

        if (bIncompleteDays !== aIncompleteDays) {
          return bIncompleteDays - aIncompleteDays; // higher days incomplete on top
        }

        // Secondary tiebreaker: oldest habit first
        const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aCreated - bCreated;
      }

      // Rule 3: Both completed: sort completed habits consistently by streak
      return (b.streak || b.currentStreak || 0) - (a.streak || a.currentStreak || 0);
    });
  }, [safeHabits, activeDate]);

  // Available timeframe options (Past Year, specific years, Lifetime)
  const currentYear = new Date().getFullYear();
  const availableYears = useMemo(() => {
    if (serverLifetimeStats?.availableYears && serverLifetimeStats.availableYears.length > 0) {
      return serverLifetimeStats.availableYears;
    }
    return [currentYear, currentYear - 1];
  }, [serverLifetimeStats, currentYear]);

  const timeframeOptions = useMemo(() => [
    { key: 'past_year', label: 'Last 12 Months' },
    ...availableYears.map((yr) => ({ key: String(yr), label: String(yr) })),
    { key: 'lifetime', label: 'Lifetime' },
  ], [availableYears]);

  // Build GitHub-style full-year (53-week) or calendar year contribution grid
  const contributionWeeks = useMemo(() => {
    let startDate;
    let totalWeeks = 53;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const counts = new Map();
    safeHeatmap.forEach((item) => {
      if (item && item.date) {
        counts.set(item.date, item.count || 0);
      }
    });

    const parsedYear = parseInt(selectedTimeframe, 10);

    if (!isNaN(parsedYear)) {
      // Specific calendar year: from the Sunday on/before Jan 1 to the Saturday on/after Dec 31
      const janFirst = new Date(parsedYear, 0, 1);
      const decLast = new Date(parsedYear, 11, 31);

      startDate = new Date(janFirst);
      startDate.setDate(janFirst.getDate() - janFirst.getDay()); // Sunday start

      const endDate = new Date(decLast);
      endDate.setDate(decLast.getDate() + (6 - decLast.getDay())); // Saturday end

      const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
      totalWeeks = Math.ceil(diffDays / 7);
    } else if (selectedTimeframe === 'lifetime') {
      // Lifetime multi-year view: rolling 104 weeks (2 full years)
      totalWeeks = 104;
      const currentWeekSunday = new Date(today);
      currentWeekSunday.setDate(today.getDate() - today.getDay());
      startDate = new Date(currentWeekSunday);
      startDate.setDate(startDate.getDate() - (totalWeeks - 1) * 7);
    } else {
      // Standard GitHub rolling 53 weeks (371 days)
      totalWeeks = 53;
      const currentWeekSunday = new Date(today);
      currentWeekSunday.setDate(today.getDate() - today.getDay());
      startDate = new Date(currentWeekSunday);
      startDate.setDate(startDate.getDate() - (totalWeeks - 1) * 7);
    }

    const weeksList = [];
    let lastLabeledWeek = -4; // ensure at least 2-3 columns gap between month headers

    for (let w = 0; w < totalWeeks; w++) {
      const weekDays = [];
      let monthLabel = '';

      for (let d = 0; d < 7; d++) {
        const current = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate() + w * 7 + d
        );
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, '0');
        const dayNum = String(current.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${dayNum}`;
        const isFuture = dateStr > todayStr;
        const count = counts.get(dateStr) || 0;

        // Month label detection
        if (
          (w === 0 && d === 0) ||
          (current.getDate() === 1 && w - lastLabeledWeek >= 3)
        ) {
          monthLabel = MONTH_NAMES[current.getMonth()];
          lastLabeledWeek = w;
        }

        weekDays.push({
          date: dateStr,
          displayDate: current.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          dayOfWeek: d,
          count,
          isFuture,
        });
      }

      weeksList.push({
        weekIndex: w,
        monthLabel,
        days: weekDays,
      });
    }

    return weeksList;
  }, [safeHeatmap, selectedTimeframe]);

  // Period-specific & Lifetime Metrics
  const totalPeriodCompletions = useMemo(() => {
    return safeHeatmap.reduce((sum, d) => sum + (d.count || 0), 0);
  }, [safeHeatmap]);

  const activeDaysCount = useMemo(() => {
    return safeHeatmap.filter((d) => (d.count || 0) > 0).length;
  }, [safeHeatmap]);

  const totalDaysInPeriod = contributionWeeks.length * 7;
  const consistencyPercent = totalDaysInPeriod > 0 ? Math.round((activeDaysCount / totalDaysInPeriod) * 100) : 0;

  // Fallback lifetime calculations
  const fallbackLifetimeCompletions = useMemo(() => {
    return safeHabits.reduce((acc, h) => acc + (h.totalCompletions || 0), 0);
  }, [safeHabits]);

  const fallbackBestStreak = useMemo(() => {
    return safeHabits.reduce((max, h) => Math.max(max, h.bestStreak || h.streak || h.currentStreak || 0), 0);
  }, [safeHabits]);

  const totalLifetimeCompletions = serverLifetimeStats?.totalCompletions ?? fallbackLifetimeCompletions;
  const totalLifetimeActiveDays = serverLifetimeStats?.totalActiveDays ?? activeDaysCount;
  const allTimeLongestStreak = serverLifetimeStats?.bestStreak ?? fallbackBestStreak;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        category="Discipline & Consistency"
        title="Habits Tracker"
        description={`Daily discipline routines, streak tracking, and GitHub-style lifetime contribution activity for ${formatDisplayDate(activeDate)}`}
        action={
          <Button variant="gradient" size="md" icon={Plus} onClick={handleOpenCreateModal}>
            New Habit
          </Button>
        }
      />

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard
          title="Completed Today"
          value={`${completedCount} / ${safeHabits.length}`}
          subtitle={`${Math.max(0, safeHabits.length - completedCount)} habits remaining`}
          icon={CheckSquare}
          color="emerald"
        />
        <StatCard
          title="Active Habits"
          value={safeHabits.length}
          subtitle="Daily discipline routines"
          icon={Layers}
          color="indigo"
        />
        <StatCard
          title="Longest Streak"
          value={`${longestStreak} Days`}
          subtitle="Top consistency record"
          icon={Flame}
          color="rose"
        />
      </div>

      {/* Daily Habits Checklist */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary tracking-tight">Today's Habits Checklist</h2>
          <span className="text-xs font-semibold text-secondary">
            {completedCount} of {safeHabits.length} done
          </span>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : safeHabits.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No habits created yet"
            description="Start by building a new habit routine (e.g. Read 20 mins, Workout, Fasting)."
            actionText="Create Habit"
            onAction={handleOpenCreateModal}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {sortedHabits.map((habit) => {
              const isDone = habit.completedToday || habit.isCompletedToday;
              const rawIncompleteDays = !isDone ? getHabitIncompleteDays(habit, activeDate) : 0;
              const isNeverCompleted = rawIncompleteDays >= 1000;
              const displayMissedDays = isNeverCompleted ? rawIncompleteDays - 1000 : rawIncompleteDays;

              return (
                <Card
                  key={habit._id}
                  hover
                  className={`transition-all duration-200 ${
                    isDone ? 'border-emerald-500/40 bg-emerald-500/5 opacity-85' : ''
                  }`}
                  bottomAction={
                    <div className="flex items-center gap-0.5 bg-surface/90 dark:bg-surface/90 backdrop-blur-xs rounded-xl p-0.5 border border-theme/40 shadow-xs">
                      <button
                        onClick={() => handleEditHabit(habit)}
                        className="p-1 rounded-lg text-secondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                        title="Edit Habit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(habit._id)}
                        className="p-1 rounded-lg text-secondary hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Habit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  }
                >
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={() => handleToggleHabit(habit._id, isDone)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0 mt-0.5 border ${
                        isDone
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/25 scale-105'
                          : 'bg-surface border-theme text-transparent hover:border-accent hover:text-accent/30'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>

                    <div className="min-w-0 flex-1 space-y-1.5 pr-14">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4
                          className={`text-sm font-bold truncate transition-colors duration-150 ${
                            isDone ? 'line-through text-secondary' : 'text-primary'
                          }`}
                        >
                          {habit.name}
                        </h4>

                        {isDone ? (
                          <Badge
                            variant="success"
                            size="xs"
                            icon={CheckCircle2}
                            className="font-bold shrink-0"
                          >
                            {habit.streak || habit.currentStreak || 0}d streak
                          </Badge>
                        ) : isNeverCompleted ? (
                          <Badge
                            variant="danger"
                            size="xs"
                            className="font-bold shrink-0 bg-rose-500/10 text-rose-500 border border-rose-500/20"
                          >
                            Top Priority (0 done)
                          </Badge>
                        ) : displayMissedDays > 1 ? (
                          <Badge
                            variant="warning"
                            size="xs"
                            icon={Flame}
                            className="font-bold shrink-0 bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          >
                            Incomplete {displayMissedDays}d
                          </Badge>
                        ) : (
                          <Badge
                            variant="warning"
                            size="xs"
                            icon={Flame}
                            className="font-extrabold shrink-0"
                          >
                            {habit.streak || habit.currentStreak || 0}d streak
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="neutral" size="xs">
                          {habit.category}
                        </Badge>
                        {habit.description && (
                          <span className="text-xs text-secondary truncate">{habit.description}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* GitHub-style Contribution & Lifetime Activity Section */}
      <Card
        hover
        title={
          selectedTimeframe === 'lifetime'
            ? 'Lifetime Habit Contribution Activity'
            : selectedTimeframe === 'past_year'
            ? 'Habit Contribution Activity'
            : `${selectedTimeframe} Habit Contribution Activity`
        }
        subtitle="GitHub-style full-year contribution matrix tracking daily discipline, streaks, and lifelong consistency"
        icon={Calendar}
        badge={
          <Badge variant="success" size="xs">
            {totalPeriodCompletions} completions in period
          </Badge>
        }
        action={
          <div className="flex items-center gap-1 bg-subtle/50 p-1 rounded-xl border border-theme/50 overflow-x-auto max-w-full">
            {timeframeOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSelectedTimeframe(opt.key)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer shrink-0 ${
                  selectedTimeframe === opt.key
                    ? 'bg-accent text-white shadow-xs'
                    : 'text-secondary hover:text-primary hover:bg-subtle/70'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        }
      >
        <div className="pt-2 space-y-4">
          {/* Lifetime & Period Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
            <div className="p-3 sm:p-3.5 rounded-xl bg-subtle/40 border border-theme/50 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-secondary text-[11px] font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">Lifetime Check-ins</span>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-primary mt-1.5">
                {totalLifetimeCompletions}{' '}
                <span className="text-xs font-normal text-secondary">total</span>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl bg-subtle/40 border border-theme/50 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-secondary text-[11px] font-semibold">
                <Calendar className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="truncate">Lifetime Active Days</span>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-primary mt-1.5">
                {totalLifetimeActiveDays}{' '}
                <span className="text-xs font-normal text-secondary">days logged</span>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl bg-subtle/40 border border-theme/50 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-secondary text-[11px] font-semibold">
                <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate">All-Time Best Streak</span>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-primary mt-1.5">
                {allTimeLongestStreak}{' '}
                <span className="text-xs font-normal text-secondary">days record</span>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl bg-subtle/40 border border-theme/50 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-secondary text-[11px] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">Period Consistency</span>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-primary mt-1.5">
                {consistencyPercent}%{' '}
                <span className="text-xs font-normal text-secondary">
                  ({activeDaysCount}/{totalDaysInPeriod}d)
                </span>
              </div>
            </div>
          </div>

          {/* Full GitHub-Style Heatmap Grid Container */}
          <div className="p-3.5 sm:p-5 rounded-2xl bg-subtle/30 border border-theme/60 w-full">
            <div className="overflow-x-auto custom-scrollbar pb-2">
              <div className="min-w-fit">
                {/* Month Labels Header */}
                <div className="flex text-[10px] font-semibold text-secondary mb-1.5 pl-6 sm:pl-7">
                  {contributionWeeks.map((w, idx) => (
                    <div
                      key={idx}
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1 text-left relative overflow-visible shrink-0"
                    >
                      {w.monthLabel && (
                        <span className="absolute left-0 top-0 whitespace-nowrap">{w.monthLabel}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Grid with Day Labels on Left and Week Columns */}
                <div className="flex items-start">
                  {/* Day of week labels (Sun - Sat, labeled Mon, Wed, Fri like GitHub) */}
                  <div className="grid grid-rows-7 gap-1 sm:gap-1 text-[9px] sm:text-[10px] font-medium text-secondary pr-1.5 sm:pr-2 select-none shrink-0">
                    <span className="h-3 sm:h-3.5 flex items-center leading-none"></span>
                    <span className="h-3 sm:h-3.5 flex items-center leading-none">Mon</span>
                    <span className="h-3 sm:h-3.5 flex items-center leading-none"></span>
                    <span className="h-3 sm:h-3.5 flex items-center leading-none">Wed</span>
                    <span className="h-3 sm:h-3.5 flex items-center leading-none"></span>
                    <span className="h-3 sm:h-3.5 flex items-center leading-none">Fri</span>
                    <span className="h-3 sm:h-3.5 flex items-center leading-none"></span>
                  </div>

                  {/* Week Columns as Square Blocks */}
                  <div className="flex gap-1 sm:gap-1">
                    {contributionWeeks.map((week) => (
                      <div key={week.weekIndex} className="grid grid-rows-7 gap-1 sm:gap-1 shrink-0">
                        {week.days.map((day) => {
                          if (day.isFuture) {
                            return (
                              <div
                                key={day.date}
                                className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2.5px] border border-dashed border-theme/20 opacity-15 pointer-events-none"
                              />
                            );
                          }

                          const count = day.count || 0;
                          let bg = 'bg-subtle/70 border-theme/60 hover:border-theme';
                          if (count === 1) bg = 'bg-emerald-200 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800/60';
                          else if (count === 2) bg = 'bg-emerald-400 dark:bg-emerald-700/80 border-emerald-400 dark:border-emerald-600';
                          else if (count === 3) bg = 'bg-emerald-500 dark:bg-emerald-600 border-emerald-500 shadow-xs shadow-emerald-500/20';
                          else if (count >= 4) bg = 'bg-emerald-600 dark:bg-emerald-400 border-emerald-600 dark:border-emerald-300 shadow-sm shadow-emerald-500/30';

                          return (
                            <div
                              key={day.date}
                              onMouseEnter={() => setHoveredDay(day)}
                              onMouseLeave={() => setHoveredDay(null)}
                              title={`${day.displayDate}: ${count} habit${count === 1 ? '' : 's'} completed`}
                              className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2.5px] border transition-all duration-150 hover:scale-130 hover:z-20 cursor-pointer ${bg}`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Status & GitHub Legend */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[11px] text-secondary font-medium mt-3.5 pt-2.5 border-t border-subtle">
              <div className="flex items-center gap-1.5 min-h-[1.25rem]">
                {hoveredDay ? (
                  <span className="font-semibold text-primary">
                    <strong className="text-emerald-500">{hoveredDay.count}</strong> habit{hoveredDay.count === 1 ? '' : 's'} completed on <span className="text-primary font-bold">{hoveredDay.displayDate}</span>
                  </span>
                ) : (
                  <span>
                    <strong className="text-primary font-bold">{activeDaysCount}</strong> active days out of {totalDaysInPeriod} ({consistencyPercent}% consistency in period)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto select-none">
                <span className="text-[10px]">Less</span>
                <div className="flex gap-1 items-center">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[2.5px] bg-subtle/70 border border-theme/60" title="0 habits" />
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[2.5px] bg-emerald-200 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800/60" title="1 habit" />
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[2.5px] bg-emerald-400 dark:bg-emerald-700/80 border border-emerald-400 dark:border-emerald-600" title="2 habits" />
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[2.5px] bg-emerald-500 dark:bg-emerald-600 border border-emerald-500" title="3 habits" />
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[2.5px] bg-emerald-600 dark:bg-emerald-400 border border-emerald-600 dark:border-emerald-300 shadow-xs shadow-emerald-500/20" title="4+ habits" />
                </div>
                <span className="text-[10px]">More</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Habit Creator / Editor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingHabitId ? 'Edit Habit' : 'Build New Habit'}
        subtitle={editingHabitId ? 'Update your daily discipline routine' : 'Define your daily discipline routine and trigger'}
      >
        <form onSubmit={handleCreateHabit} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-in fade-in">
              {createError}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Habit Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Read 20 pages, 100 Pushups, Fasting"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="select-base"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Target Frequency
              </label>
              <select
                value={targetFrequency}
                onChange={(e) => setTargetFrequency(e.target.value)}
                className="select-base"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Right after morning coffee"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {editingHabitId ? 'Update Habit' : 'Create Habit'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Confirm Deletion"
        subtitle="This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Are you sure you want to delete this habit and reset its streak history?
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteHabit}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HabitsTracker;
