import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { LoadingScreen } from '../components/LoadingScreen';
import api, { getLocalCache, setLocalCache } from '../utils/api';
import { notifyCreated, notifyUpdated, notifyDeleted, notifyError, confirmDelete } from '../utils/alerts';
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
  Play,
} from 'lucide-react';

const CATEGORIES = ['Work', 'Study', 'Fitness', 'Islamic', 'Social', 'Sleep', 'Other'];

const CATEGORY_COLORS = {
  Work: 'indigo',
  Study: 'purple',
  Fitness: 'emerald',
  Islamic: 'cyan',
  Social: 'amber',
  Sleep: 'rose',
  Other: 'neutral',
};

export const TimeTracker = ({ selectedDate }) => {
  const { t, isRTL } = useLanguage();
  const currentDate = selectedDate || getFormattedDate();

  const [logs, setLogs] = useState(() => getLocalCache(`/time-tracker/logs?date=${currentDate}`)?.data || []);
  const [summary, setSummary] = useState(() => getLocalCache(`/time-tracker/summary?date=${currentDate}`)?.data || { totalMinutes: 0, byCategory: {} });
  const [activitiesList, setActivitiesList] = useState(() => getLocalCache('/time-tracker/activities')?.data || []);
  const [loading, setLoading] = useState(() => !getLocalCache(`/time-tracker/logs?date=${currentDate}`));

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);

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
    const hasCache = getLocalCache(`/time-tracker/logs?date=${currentDate}`);
    if (showLoading && !hasCache) setLoading(true);

    try {
      const [logsRes, summaryRes, actRes] = await Promise.all([
        api.get(`/time-tracker/logs?date=${currentDate}`),
        api.get(`/time-tracker/summary?date=${currentDate}`),
        api.get('/time-tracker/activities'),
      ]);
      setLocalCache(`/time-tracker/logs?date=${currentDate}`, logsRes.data || []);
      setLocalCache(`/time-tracker/summary?date=${currentDate}`, summaryRes.data || { totalMinutes: 0, byCategory: {} });
      setLocalCache('/time-tracker/activities', actRes.data || []);

      setLogs(logsRes.data || []);
      setSummary(summaryRes.data || { totalMinutes: 0, byCategory: {} });
      setActivitiesList(actRes.data || []);
    } catch (err) {
      console.error('Failed to fetch time tracker data', err);
    } finally {
      setLoading(false);
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

  const handleSetStartTimeToNow = () => {
    setStartTime(getCurrentTimeString());
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
        notifyUpdated('Time log');
      } else {
        const res = await api.post('/time-tracker/logs', payload);
        if (res.data) {
          setLogs((prev) => [...prev, res.data]);
        }
        notifyCreated('Time log');
      }
      setIsModalOpen(false);
      fetchLogs(false);
    } catch (err) {
      console.error('Failed to save time log', err);
      notifyError(err, 'Failed to save time log');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (logId) => {
    if (!logId) return;
    const confirmed = await confirmDelete('Time log');
    if (!confirmed) return;

    setLogs((prev) => prev.filter((l) => l._id !== logId));

    try {
      await api.delete(`/time-tracker/logs/${logId}`);
      notifyDeleted('Time log');
      fetchLogs(false);
    } catch (err) {
      console.error('Failed to delete time log', err);
      notifyError(err, 'Failed to delete time log');
      fetchLogs(false);
    }
  };

  const filteredSuggestions = activitiesList.filter(
    (act) => act.toLowerCase().includes(title.toLowerCase()) && act.toLowerCase() !== title.toLowerCase()
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        category={t('categories.time', 'Time Distribution')}
        title={t('time.title', 'Time Tracker')}
        description={`${t('time.subtitle', 'Track focused work sessions, manage distraction-free intervals, and analyze daily output.')} (${formatDisplayDate(currentDate)})`}
        action={
          <Button variant="gradient" size="md" icon={Plus} onClick={openCreateModal}>
            {t('time.startTimer', 'Log Time Block')}
          </Button>
        }
      />

      {/* Top Stat Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title={t('time.totalFocusTime', 'Total Time Logged')}
          value={`${Math.floor((summary.totalMinutes || 0) / 60)}h ${(summary.totalMinutes || 0) % 60}m`}
          subtitle={`${logs.length} time blocks recorded`}
          icon={Clock}
          color="indigo"
        />
        <StatCard
          title={t('time.topCategory', 'Top Category')}
          value={
            Object.entries(summary.byCategory || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'
          }
          subtitle={t('time.highestLoggedFocus', 'Highest logged time focus')}
          icon={Layers}
          color="purple"
        />
        <StatCard
          title={t('time.productiveHours', 'Productive Hours')}
          value={`${Math.floor(((summary.byCategory?.Work || 0) + (summary.byCategory?.Study || 0)) / 60)}h ${((summary.byCategory?.Work || 0) + (summary.byCategory?.Study || 0)) % 60}m`}
          subtitle={t('time.workStudyTime', 'Work & study time combined')}
          icon={Sparkles}
          color="emerald"
        />
        <StatCard
          title={t('time.healthAndDeen', 'Health & Deen Time')}
          value={`${Math.floor(((summary.byCategory?.Fitness || 0) + (summary.byCategory?.Islamic || 0)) / 60)}h ${((summary.byCategory?.Fitness || 0) + (summary.byCategory?.Islamic || 0)) % 60}m`}
          subtitle={t('time.fitnessDeenTime', 'Fitness & Islamic time combined')}
          icon={Clock}
          color="cyan"
        />
      </div>

      {/* Category Breakdown Chips */}
      <Card title={t('time.categoryBreakdown', 'Category Distribution')} subtitle={t('time.timeAllocationCategory', 'Time allocation breakdown across categories')}>
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
          <h2 className="text-lg font-bold text-primary tracking-tight">{t('time.todaysLogs', "Today's Time Blocks")}</h2>
          <span className="text-xs font-semibold text-secondary">{logs.length} blocks</span>
        </div>

        {loading ? (
          <LoadingScreen fullScreen={false} message="Loading time blocks..." size="md" />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={Clock}
            title={t('time.noTimeLogsToday', 'No time blocks recorded today')}
            description={t('time.noTimeLogsDesc', 'Start scheduling or logging your activities to visualize your daily time distribution.')}
            actionText={t('time.startTimer', 'Log Time Block')}
            onAction={openCreateModal}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {logs.map((log) => (
              <Card
                key={log._id}
                hover
                bottomAction={
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(log)}
                      className="p-1.5 rounded-lg bg-surface border border-theme text-secondary hover:text-accent hover:border-accent/40 hover:bg-accent/10 shadow-xs transition-all cursor-pointer"
                      title={t('time.editLog', 'Edit Time Block')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(log._id)}
                      className="p-1.5 rounded-lg bg-surface border border-theme text-secondary hover:text-rose-600 hover:border-rose-500/40 hover:bg-rose-500/10 shadow-xs transition-all cursor-pointer"
                      title={t('time.deleteLog', 'Delete Time Block')}
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
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {t('time.overlapsBlock', 'Overlaps with another block')}
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
        title={
          editingLog
            ? `${t('common.edit', 'Edit')} ${t('time.title', 'Time Block')}`
            : t('time.addTimeTracker', 'Add Time & Focus Tracker')
        }
        subtitle={`${t('time.scheduleTaskFor', 'Schedule task for')} ${formatDisplayDate(formDate)}`}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
            {/* Left Column (6 Cols): Task Name, Category & Date */}
            <div className="md:col-span-6 flex flex-col justify-between space-y-3">
              {/* Task Details Card */}
              <div className="p-3 bg-subtle/30 rounded-2xl border border-theme space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-1.5 border-b border-theme/60">
                  <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-accent" /> {t('time.taskDetails', 'Task & Category')}
                  </span>
                  <span className="text-[10px] text-accent font-bold px-1.5 py-0.5 rounded-md bg-accent/10">
                    Required
                  </span>
                </div>

                {/* Task Name */}
                <div className="relative">
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                    {t('time.taskName', 'Task / Project Name')} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('time.taskPlaceholder', 'e.g. Frontend Architecture, Quran Recitation, Gym Workout...')}
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full bg-surface border border-theme rounded-xl px-2.5 py-1.5 text-xs font-semibold text-primary focus:outline-none focus:border-accent"
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
                          className="p-2 hover:bg-subtle cursor-pointer text-xs font-semibold text-primary flex items-center gap-2 transition-colors"
                        >
                          <Sparkles className="w-3 h-3 text-accent" />
                          <span>{sugg}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Category Quick Pills */}
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">
                    {t('common.category', 'Category')}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((c) => {
                      const isSelected = category === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCategory(c)}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-accent text-accent-contrast border-accent shadow-xs'
                              : 'bg-surface/80 border-theme text-secondary hover:text-primary hover:bg-subtle'
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date Input */}
                <div className="pt-1 border-t border-theme/40">
                  <DateInput
                    label={t('common.date', 'Date')}
                    value={formDate}
                    onChange={setFormDate}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Right Column (6 Cols): Timing, Duration HUD & Notes */}
            <div className="md:col-span-6 flex flex-col justify-between space-y-3">
              {/* Timing & Duration Card */}
              <div className="p-3 bg-subtle/30 rounded-2xl border border-theme space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-theme/60">
                  <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> {t('time.timeAndDuration', 'Timing & Duration')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                        {t('time.startTime', 'Start Time')}
                      </label>
                      <button
                        type="button"
                        onClick={handleSetStartTimeToNow}
                        className="inline-flex items-center gap-0.5 text-[10px] font-bold text-accent hover:underline cursor-pointer"
                      >
                        <Play className="w-2.5 h-2.5" /> Now
                      </button>
                    </div>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-surface border border-theme rounded-xl px-2.5 py-1 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                        {t('time.endTime', 'End Time')}
                      </label>
                      <button
                        type="button"
                        onClick={handleSetEndTimeToNow}
                        className="inline-flex items-center gap-0.5 text-[10px] font-bold text-accent hover:underline cursor-pointer"
                      >
                        <Zap className="w-2.5 h-2.5" /> Set to Now
                      </button>
                    </div>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-surface border border-theme rounded-xl px-2.5 py-1 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                      required
                    />
                  </div>
                </div>

                {/* Duration Live Calculation Card */}
                <div className="p-2.5 rounded-xl bg-surface border border-theme shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                      {t('time.computedDuration', 'Calculated Duration')}
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-accent">
                    {Math.floor(liveDuration / 60)}h {liveDuration % 60}m ({liveDuration} {t('common.minutes', 'mins')})
                  </span>
                </div>
              </div>

              {/* Notes Card */}
              <div className="p-3 bg-subtle/30 rounded-2xl border border-theme space-y-1.5 flex-1 flex flex-col justify-between">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">
                  {t('common.notes', 'Notes')} ({t('common.optional', 'Optional')})
                </label>
                <textarea
                  rows={2}
                  placeholder={t('time.notesPlaceholder', 'e.g. Covered Chapter 3, deep focus session with zero distractions')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-surface border border-theme rounded-xl p-2.5 text-xs text-primary focus:outline-none focus:border-accent resize-none flex-1"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2.5 pt-2.5 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {editingLog ? t('common.update', 'Update') : t('common.save', 'Save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TimeTracker;
