import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import api from '../utils/api';
import { DateInput } from '../components/DateInput';
import { getFormattedDate, formatDisplayDate } from '../utils/dateHelpers';
import {
  Clock,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';

const CATEGORIES = ['Work', 'Study', 'Fitness', 'Islamic', 'Social', 'Sleep', 'Other'];

const CATEGORY_COLORS = {
  Work: 'indigo',
  Study: 'purple',
  Fitness: 'emerald',
  Islamic: 'cyan',
  Social: 'amber',
  Sleep: 'neutral',
  Other: 'neutral',
};

export const TimeTracker = ({ selectedDate }) => {
  const currentDate = selectedDate || getFormattedDate();

  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({ totalMinutes: 0, byCategory: {} });
  const [activitiesList, setActivitiesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Form State
  const [formDate, setFormDate] = useState(currentDate);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Work');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [notes, setNotes] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);

  const getCurrentTimeString = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  const fetchLogs = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [logsRes, summaryRes, actRes] = await Promise.all([
        api.get(`/time-tracker/logs?date=${currentDate}`),
        api.get(`/time-tracker/summary?date=${currentDate}`),
        api.get('/time-tracker/activities'),
      ]);
      setLogs(logsRes.data || []);
      setSummary(summaryRes.data || { totalMinutes: 0, byCategory: {} });
      setActivitiesList(actRes.data || []);
    } catch (err) {
      console.error('Failed to fetch time tracker data', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchLogs(true);
  }, [fetchLogs]);

  const openCreateModal = () => {
    setEditingLog(null);
    setFormDate(currentDate);
    setTitle('');
    setCategory('Work');
    setNotes('');

    let initialStart = getCurrentTimeString();
    if (logs.length > 0) {
      const sortedLogs = [...logs].sort((a, b) => (a.endTime > b.endTime ? 1 : -1));
      const lastEndTime = sortedLogs[sortedLogs.length - 1]?.endTime;
      if (lastEndTime) {
        initialStart = lastEndTime;
      }
    }

    setStartTime(initialStart);

    const [h, m] = initialStart.split(':').map(Number);
    const endH = (h + 1) % 24;
    setEndTime(`${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);

    setIsModalOpen(true);
  };

  const openEditModal = (log) => {
    setEditingLog(log);
    setFormDate(log.date);
    setTitle(log.title || log.activity || '');
    setCategory(log.category);
    setStartTime(log.startTime || '09:00');
    setEndTime(log.endTime || '10:00');
    setNotes(log.notes || '');
    setIsModalOpen(true);
  };

  const handleSetEndTimeToNow = () => {
    setEndTime(getCurrentTimeString());
  };

  const calculateLiveDuration = () => {
    if (!startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let diff = eh * 60 + em - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    return diff;
  };

  const liveDuration = calculateLiveDuration();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    const payload = {
      date: formDate,
      category,
      title: title.trim(),
      activity: title.trim(),
      startTime,
      endTime,
      durationMinutes: liveDuration || 30,
      notes: notes.trim(),
    };

    try {
      if (editingLog) {
        const res = await api.put(`/time-tracker/logs/${editingLog._id}`, payload);
        if (res.data) {
          setLogs((prev) => prev.map((l) => (l._id === editingLog._id ? res.data : l)));
        }
      } else {
        const res = await api.post('/time-tracker/logs', payload);
        if (res.data) {
          setLogs((prev) => [...prev, res.data]);
        }
      }
      setIsModalOpen(false);
      fetchLogs(false);
    } catch (err) {
      console.error('Failed to save time log', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const targetId = deleteId;
    setDeleteId(null);
    setLogs((prev) => prev.filter((l) => l._id !== targetId));

    try {
      await api.delete(`/time-tracker/logs/${targetId}`);
      fetchLogs(false);
    } catch (err) {
      console.error('Failed to delete time log', err);
      fetchLogs(false);
    }
  };

  const filteredSuggestions = activitiesList.filter(
    (act) => act.toLowerCase().includes(title.toLowerCase()) && act.toLowerCase() !== title.toLowerCase()
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        category="Time Distribution"
        title="Time Tracker"
        description={`Track daily focus blocks, tasks, categories, and review distribution for ${formatDisplayDate(currentDate)}`}
        action={
          <Button variant="gradient" size="md" icon={Plus} onClick={openCreateModal}>
            Log Time Block
          </Button>
        }
      />

      {/* Top Stat Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Time Logged"
          value={`${Math.floor((summary.totalMinutes || 0) / 60)}h ${(summary.totalMinutes || 0) % 60}m`}
          subtitle={`${logs.length} time blocks recorded`}
          icon={Clock}
          color="indigo"
        />
        <StatCard
          title="Top Category"
          value={
            Object.entries(summary.byCategory || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'
          }
          subtitle="Highest logged focus"
          icon={Layers}
          color="purple"
        />
        <StatCard
          title="Productive Hours"
          value={`${Math.floor(((summary.byCategory?.Work || 0) + (summary.byCategory?.Study || 0)) / 60)}h ${((summary.byCategory?.Work || 0) + (summary.byCategory?.Study || 0)) % 60}m`}
          subtitle="Work + Study time"
          icon={Sparkles}
          color="emerald"
        />
        <StatCard
          title="Health & Deen"
          value={`${Math.floor(((summary.byCategory?.Fitness || 0) + (summary.byCategory?.Islamic || 0)) / 60)}h ${((summary.byCategory?.Fitness || 0) + (summary.byCategory?.Islamic || 0)) % 60}m`}
          subtitle="Fitness + Deen time"
          icon={Clock}
          color="cyan"
        />
      </div>

      {/* Category Breakdown Chips */}
      <Card title="Category Breakdown" subtitle="Time allocation by category">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-2">
          {CATEGORIES.map((cat) => {
            const mins = summary.byCategory?.[cat] || 0;
            const hours = Math.floor(mins / 60);
            const remainderMins = mins % 60;
            return (
              <div
                key={cat}
                className="p-3.5 rounded-2xl bg-subtle border border-theme flex flex-col justify-between"
              >
                <Badge variant={CATEGORY_COLORS[cat] || 'neutral'} size="xs">
                  {cat}
                </Badge>
                <div className="mt-2 text-base font-extrabold text-primary tracking-tight">
                  {hours > 0 ? `${hours}h ${remainderMins}m` : `${mins}m`}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Time Logs Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary tracking-tight">Logged Time Blocks</h2>
          <span className="text-xs font-semibold text-secondary">{logs.length} blocks</span>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No time logs recorded today"
            description="Start by logging your first time block (e.g. Deep Work, Study, Workout)."
            actionText="Log Time Block"
            onAction={openCreateModal}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {logs.map((log) => (
              <Card
                key={log._id}
                hover
                bottomAction={
                  <div className="flex items-center gap-0.5 bg-surface/90 dark:bg-surface/90 backdrop-blur-xs rounded-xl p-0.5 border border-theme/40 shadow-xs">
                    <button
                      onClick={() => openEditModal(log)}
                      className="p-1 rounded-lg text-secondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                      title="Edit Log"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(log._id)}
                      className="p-1 rounded-lg text-secondary hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete Log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                }
              >
                <div className="space-y-3 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={CATEGORY_COLORS[log.category] || 'neutral'} size="sm" dot>
                      {log.category}
                    </Badge>
                    <span className="text-xs font-extrabold text-accent">
                      {Math.floor(log.durationMinutes / 60)}h {log.durationMinutes % 60}m
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-primary tracking-tight">
                    {log.title || log.activity}
                  </h4>

                  <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
                    <Clock className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span>{log.startTime} — {log.endTime}</span>
                  </div>

                  {log.notes && (
                    <p className="text-xs text-secondary font-medium leading-relaxed bg-subtle p-2.5 rounded-xl border border-theme">
                      {log.notes}
                    </p>
                  )}

                  {log.isOverlap && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Overlaps another block
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLog ? 'Edit Time Block' : 'Log Time Block'}
        subtitle={`Schedule task for ${formatDisplayDate(formDate)}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Task Title / Activity Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Backend API Refactoring, System Design Study"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="input-base"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-theme rounded-xl card-shadow z-30 max-h-40 overflow-y-auto">
                {filteredSuggestions.map((sugg, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setTitle(sugg);
                      setShowSuggestions(false);
                    }}
                    className="p-2.5 hover:bg-subtle cursor-pointer text-xs font-semibold text-primary flex items-center gap-2"
                  >
                    <Sparkles className="w-3 h-3 text-accent" />
                    <span>{sugg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateInput
              label="Date"
              value={formDate}
              onChange={setFormDate}
              required
            />

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
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input-base"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider">
                  End Time
                </label>
                <button
                  type="button"
                  onClick={handleSetEndTimeToNow}
                  className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Zap className="w-3 h-3" /> Set to Now
                </button>
              </div>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="input-base"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-subtle rounded-2xl border border-theme flex items-center justify-between">
            <span className="text-xs font-bold text-secondary">Automatic Computed Duration</span>
            <span className="text-sm font-extrabold text-accent">
              {Math.floor(liveDuration / 60)}h {liveDuration % 60}m ({liveDuration} mins)
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="Key achievements or notes during this block..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {editingLog ? 'Update Block' : 'Save Time Block'}
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
            Are you sure you want to delete this time block? It will be permanently removed.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TimeTracker;
