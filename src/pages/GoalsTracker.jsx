import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import api from '../utils/api';
import { DateInput } from '../components/DateInput';
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Flame,
  Check,
  Search,
} from 'lucide-react';

const CATEGORIES = ['Health', 'Career', 'Learning', 'Spiritual', 'Financial', 'Personal'];

export const GoalsTracker = () => {
  const [goals, setGoals] = useState([]);
  const [availableHabits, setAvailableHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [filterType, setFilterType] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState('short_term');
  const [category, setCategory] = useState('Career');
  const [targetDate, setTargetDate] = useState('');
  const [targetCompletions, setTargetCompletions] = useState(30);
  const [description, setDescription] = useState('');
  const [linkedHabits, setLinkedHabits] = useState([]);
  const [habitSearch, setHabitSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [goalsRes, habitsRes] = await Promise.all([
        api.get('/goals'),
        api.get('/habits'),
      ]);
      setGoals(goalsRes.data || []);
      setAvailableHabits(habitsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch goals data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingGoalId(null);
    setTitle('');
    setType('short_term');
    setCategory('Career');
    setTargetDate('');
    setTargetCompletions(30);
    setDescription('');
    setLinkedHabits([]);
    setHabitSearch('');
    setIsModalOpen(true);
  };

  const handleEditGoal = (goal) => {
    setEditingGoalId(goal._id);
    setTitle(goal.title || '');
    setType(goal.type || 'short_term');
    setCategory(goal.category || 'Career');
    setTargetDate(goal.targetDate || '');
    setTargetCompletions(goal.targetCompletions || 30);
    setDescription(goal.description || '');
    setLinkedHabits(
      Array.isArray(goal.linkedHabitIds)
        ? goal.linkedHabitIds.map((h) => (typeof h === 'object' && h._id ? h._id : h))
        : []
    );
    setHabitSearch('');
    setIsModalOpen(true);
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const payload = {
        title: title.trim(),
        type,
        category,
        targetDate: targetDate || undefined,
        targetCompletions: Number(targetCompletions) || 30,
        description: description.trim(),
        linkedHabits,
      };

      if (editingGoalId) {
        await api.put(`/goals/${editingGoalId}`, payload);
      } else {
        await api.post('/goals', payload);
      }

      setIsModalOpen(false);
      setEditingGoalId(null);
      setTitle('');
      setDescription('');
      setTargetDate('');
      setTargetCompletions(30);
      setLinkedHabits([]);
      setHabitSearch('');
      fetchData();
    } catch (err) {
      console.error('Failed to save goal', err);
    }
  };

  const handleToggleHabitSelection = (habitId) => {
    setLinkedHabits((prev) =>
      prev.includes(habitId) ? prev.filter((id) => id !== habitId) : [...prev, habitId]
    );
  };

  const handleDeleteGoal = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/goals/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (err) {
      console.error('Failed to delete goal', err);
    }
  };

  const filteredGoals = goals.filter((g) => {
    if (filterType === 'all') return true;
    const gType = g.type?.replace('-', '_');
    return gType === filterType;
  });

  const avgProgress =
    goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + (g.progressPercent || 0), 0) / goals.length)
      : 0;

  const achievedCount = goals.filter((g) => (g.progressPercent || 0) >= 100).length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        category="Vision & Long-Term Targets"
        title="Goals & Milestones"
        description="Connect daily habits and study sessions to milestones to track progress automatically."
        action={
          <Button variant="gradient" size="md" icon={Plus} onClick={() => setIsModalOpen(true)}>
            New Goal
          </Button>
        }
      />

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard
          title="Active Goals"
          value={goals.length}
          subtitle="Target objectives"
          icon={Target}
          color="indigo"
        />
        <StatCard
          title="Average Progress"
          value={`${avgProgress}%`}
          subtitle="Overall completion rate"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Achieved Milestones"
          value={achievedCount}
          subtitle="100% completed goals"
          icon={CheckCircle2}
          color="purple"
        />
      </div>

      {/* Goals Filter Tabs & Grid */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex bg-subtle p-1 rounded-xl border border-theme">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-surface text-primary card-shadow'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              All ({goals.length})
            </button>
            <button
              onClick={() => setFilterType('short_term')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'short_term'
                  ? 'bg-surface text-primary card-shadow'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Short-Term
            </button>
            <button
              onClick={() => setFilterType('long_term')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'long_term'
                  ? 'bg-surface text-primary card-shadow'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Long-Term
            </button>
          </div>
          <span className="text-xs font-semibold text-secondary">{filteredGoals.length} goals</span>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredGoals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No goals found"
            description="Create your first goal and link daily habits to measure your trajectory."
            actionText="Create Goal"
            onAction={openCreateModal}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredGoals.map((goal) => (
              <Card
                key={goal._id}
                hover
                className="flex flex-col justify-between"
                action={
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditGoal(goal)}
                      className="p-1.5 rounded-lg text-secondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                      title="Edit Goal"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(goal._id)}
                      className="p-1.5 rounded-lg text-secondary hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                }
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={goal.type?.includes('long') ? 'purple' : 'primary'} size="xs" dot>
                      {goal.type?.includes('long') ? 'Long-Term' : 'Short-Term'}
                    </Badge>
                    <Badge variant="neutral" size="xs">
                      {goal.category}
                    </Badge>
                  </div>

                  <h3 className="text-base font-extrabold text-primary tracking-tight">{goal.title}</h3>

                  {goal.description && (
                    <p className="text-xs text-secondary font-medium leading-relaxed">
                      {goal.description}
                    </p>
                  )}

                  {/* Progress Gauge */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-secondary flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-accent" />
                        Overall Progress
                      </span>
                      <span className="text-accent font-extrabold">{goal.progressPercent || 0}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-subtle rounded-full overflow-hidden border border-theme">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progressPercent || 0}%` }}
                      />
                    </div>
                    {goal.targetCompletions && (
                      <div className="flex items-center justify-between text-[11px] text-secondary font-medium">
                        <span>Habit Consistency:</span>
                        <span>{goal.totalCompletedCount || 0} / {goal.targetCompletions || 30} days</span>
                      </div>
                    )}
                  </div>

                  {/* Linked Habits Status */}
                  {goal.linkedHabitIds && goal.linkedHabitIds.length > 0 && (
                    <div className="pt-2 border-t border-subtle space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-secondary flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Today's Linked Habits
                        </span>
                        <span className={goal.todayLinkedHabitsCompleted >= goal.todayLinkedHabitsTotal ? 'text-emerald-500' : 'text-primary'}>
                          {goal.todayLinkedHabitsCompleted || 0} / {goal.todayLinkedHabitsTotal || goal.linkedHabitIds.length} done
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {goal.linkedHabitIds.map((h) => {
                          const hId = h._id?.toString() || h.toString();
                          const isDoneToday = goal.todayCompletedHabitIds?.includes(hId);
                          return (
                            <span
                              key={hId}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                                isDoneToday
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  : 'bg-subtle text-secondary border-theme'
                              }`}
                            >
                              {isDoneToday && <Check className="w-2.5 h-2.5 text-emerald-500" />}
                              {h.name || 'Habit'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {goal.targetDate && (
                    <div className="flex items-center gap-1.5 text-xs text-secondary font-medium pt-2 border-t border-subtle">
                      <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span>Target: {goal.targetDate}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Goal Creator / Editor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGoalId ? 'Edit Vision Goal' : 'Create Vision Goal'}
        subtitle={editingGoalId ? 'Update targets and linked habits' : 'Set clear targets and link daily habits to auto-track progress'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Goal Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Reach 70kg target weight, Master React & Node.js"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Horizon Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="select-base"
              >
                <option value="short_term">Short-Term (1-3 months)</option>
                <option value="long_term">Long-Term (6-12+ months)</option>
              </select>
            </div>

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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateInput
              label="Target Deadline (Optional)"
              value={targetDate}
              onChange={setTargetDate}
            />

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Target Days to Accomplish
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={targetCompletions}
                onChange={(e) => setTargetCompletions(e.target.value)}
                className="input-base"
                placeholder="e.g. 30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Description / Action Plan
            </label>
            <textarea
              rows={2}
              placeholder="What concrete steps will get you to this milestone?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea-base"
            />
          </div>

          {/* Enhanced Linked Habits Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider">
                Link Daily Habits ({linkedHabits.length} selected)
              </label>
              <span className="text-[11px] text-accent font-semibold">
                Auto-advances goal progress
              </span>
            </div>

            {availableHabits.length === 0 ? (
              <div className="p-3 text-center text-xs text-secondary italic bg-subtle rounded-xl border border-theme">
                No active habits found. Create a habit in /habits first to link it to this goal.
              </div>
            ) : (
              <div className="space-y-2">
                {/* Search Bar for Habits */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                  <input
                    type="text"
                    placeholder="Search habits to link..."
                    value={habitSearch}
                    onChange={(e) => setHabitSearch(e.target.value)}
                    className="input-base pl-8 py-1.5 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 bg-subtle rounded-xl border border-theme">
                  {availableHabits
                    .filter((h) => h.name.toLowerCase().includes(habitSearch.toLowerCase()))
                    .map((habit) => {
                      const isSelected = linkedHabits.includes(habit._id);
                      return (
                        <div
                          key={habit._id}
                          onClick={() => handleToggleHabitSelection(habit._id)}
                          className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer select-none text-xs ${
                            isSelected
                              ? 'bg-accent/10 border-accent text-primary font-bold shadow-sm'
                              : 'bg-surface border-theme text-secondary hover:text-primary hover:border-theme'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="accent-indigo-600 rounded shrink-0 cursor-pointer"
                            />
                            <div className="truncate">
                              <span className="truncate block font-semibold">{habit.name}</span>
                              <span className="text-[10px] text-secondary font-normal">{habit.category}</span>
                            </div>
                          </div>
                          {(habit.streak || habit.currentStreak) > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-amber-500 shrink-0">
                              <Flame className="w-2.5 h-2.5 fill-amber-500/20" />
                              {habit.streak || habit.currentStreak}d
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-subtle border-t">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingGoalId ? 'Update Goal' : 'Create Goal'}
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
            Are you sure you want to delete this goal milestone?
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteGoal}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GoalsTracker;
