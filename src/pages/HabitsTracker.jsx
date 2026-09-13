import React, { useState, useEffect, useCallback } from 'react';
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

export const HabitsTracker = ({ selectedDate }) => {
  const activeDate = selectedDate || getFormattedDate();

  const [habits, setHabits] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const [habitsRes, heatmapRes] = await Promise.all([
        api.get(`/habits?date=${activeDate}`),
        api.get('/habits/heatmap?weeks=12'),
      ]);

      const habitsList = Array.isArray(habitsRes.data) ? habitsRes.data : [];
      const heatmapList = Array.isArray(heatmapRes.data?.heatmap)
        ? heatmapRes.data.heatmap
        : Array.isArray(heatmapRes.data)
        ? heatmapRes.data
        : [];

      setHabits(habitsList);
      setHeatmap(heatmapList);
    } catch (err) {
      console.error('Failed to fetch habits data', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [activeDate]);

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

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        category="Discipline & Consistency"
        title="Habits Tracker"
        description={`Daily checklist, streak tracking, and rolling 12-week activity heatmap for ${formatDisplayDate(activeDate)}`}
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
            {safeHabits.map((habit) => {
              const isDone = habit.completedToday || habit.isCompletedToday;
              return (
                <Card
                  key={habit._id}
                  hover
                  className={`transition-all duration-200 ${
                    isDone ? 'border-emerald-500/40 bg-emerald-500/5' : ''
                  }`}
                  action={
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditHabit(habit)}
                        className="p-1.5 rounded-lg text-secondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                        title="Edit Habit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(habit._id)}
                        className="p-1.5 rounded-lg text-secondary hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Habit"
                      >
                        <Trash2 className="w-4 h-4" />
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

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`text-sm font-bold truncate transition-colors duration-150 ${
                            isDone ? 'line-through text-secondary' : 'text-primary'
                          }`}
                        >
                          {habit.name}
                        </h4>
                        <Badge
                          variant="warning"
                          size="xs"
                          icon={Flame}
                          className="font-extrabold shrink-0"
                        >
                          {habit.streak || habit.currentStreak || 0}d streak
                        </Badge>
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

      {/* Enhanced Visual Heatmap */}
      <Card
        hover
        title="Activity Heatmap (Rolling 12 Weeks)"
        subtitle="Visual consistency and completions per day"
        icon={Calendar}
      >
        <div className="overflow-x-auto touch-scroll-x pt-3">
          <div className="flex gap-1.5 min-w-[700px]">
            {safeHeatmap.map((day, idx) => {
              const count = day.count || 0;
              let bg = 'bg-subtle border-theme';
              if (count === 1) bg = 'bg-emerald-200 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800/60';
              else if (count === 2) bg = 'bg-emerald-400 dark:bg-emerald-700/80 border-emerald-400 dark:border-emerald-600';
              else if (count === 3) bg = 'bg-emerald-500 dark:bg-emerald-600 border-emerald-500 shadow-sm shadow-emerald-500/20';
              else if (count >= 4) bg = 'bg-emerald-600 dark:bg-emerald-400 border-emerald-600 dark:border-emerald-300 shadow-md shadow-emerald-500/30';

              return (
                <div
                  key={idx}
                  title={`${formatDisplayDate(day.date)}: ${count} habits completed`}
                  className={`w-3.5 h-11 rounded-lg border transition-all duration-150 hover:scale-125 hover:z-10 cursor-pointer ${bg}`}
                />
              );
            })}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-secondary font-semibold mt-4 pt-2 border-t border-subtle">
            <span>12 Weeks Ago</span>
            <div className="flex items-center gap-2">
              <span>Less</span>
              <div className="flex gap-1">
                <span className="w-3.5 h-3.5 rounded bg-subtle border border-theme" />
                <span className="w-3.5 h-3.5 rounded bg-emerald-200 dark:bg-emerald-950/70 border border-emerald-300" />
                <span className="w-3.5 h-3.5 rounded bg-emerald-400 dark:bg-emerald-700/80 border border-emerald-400" />
                <span className="w-3.5 h-3.5 rounded bg-emerald-500 dark:bg-emerald-600 border border-emerald-500" />
                <span className="w-3.5 h-3.5 rounded bg-emerald-600 dark:bg-emerald-400 border border-emerald-600 shadow-sm shadow-emerald-500/20" />
              </div>
              <span>More</span>
            </div>
            <span>Today</span>
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
