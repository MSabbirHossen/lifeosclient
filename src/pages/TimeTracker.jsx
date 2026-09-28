import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { notifyCreated, notifyUpdated, notifyDeleted, notifyError, confirmDelete, notifyGuestAction } from '../utils/alerts';
import { useAuth } from '../context/AuthContext';
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
  Link,
  Unlink,
  LayoutList,
  LayoutGrid,
} from 'lucide-react';

const CATEGORIES = ['Work', 'Study', 'Fitness', 'Islamic', 'Personal Task', 'Social', 'Sleep', 'Time Waste', 'Other'];

const CATEGORY_COLORS = {
  Work: 'indigo',
  Study: 'purple',
  Fitness: 'emerald',
  Islamic: 'cyan',
  'Personal Task': 'sky',
  Personal: 'sky',
  Social: 'amber',
  Sleep: 'rose',
  'Time Waste': 'orange',
  Other: 'neutral',
};

export const TimeTracker = ({ selectedDate }) => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const currentDate = selectedDate || getFormattedDate();


  const [logs, setLogs] = useState(() => getLocalCache(`/time-tracker/logs?date=${currentDate}`)?.data || []);
  const [summary, setSummary] = useState(() => getLocalCache(`/time-tracker/summary?date=${currentDate}`)?.data || { totalMinutes: 0, byCategory: {} });
  const [activitiesList, setActivitiesList] = useState(() => getLocalCache('/time-tracker/activities')?.data || []);
  const [loading, setLoading] = useState(() => !getLocalCache(`/time-tracker/logs?date=${currentDate}`));

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'grid'

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

  // Sort logs chronologically by start time
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      const aStart = a.startTime || '00:00';
      const bStart = b.startTime || '00:00';
      return aStart.localeCompare(bStart);
    });
  }, [logs]);

  // Compute gaps and continuity statistics between consecutive tasks
  const timeBlockAnalysis = useMemo(() => {
    let totalGaps = 0;
    let totalGapMinutes = 0;
    let conjugatedCount = 0;

    const items = [];

    for (let i = 0; i < sortedLogs.length; i++) {
      const current = sortedLogs[i];
      const next = sortedLogs[i + 1];

      let gapMinutes = 0;
      let isConjugated = false;
      let hasGap = false;
      let isOverlap = false;

      if (next && current.endTime && next.startTime) {
        const [cEndH, cEndM] = current.endTime.split(':').map(Number);
        const [nStartH, nStartM] = next.startTime.split(':').map(Number);

        const currentEndMins = (cEndH || 0) * 60 + (cEndM || 0);
        const nextStartMins = (nStartH || 0) * 60 + (nStartM || 0);

        gapMinutes = nextStartMins - currentEndMins;

        if (gapMinutes === 0) {
          isConjugated = true;
          conjugatedCount += 1;
        } else if (gapMinutes > 0) {
          hasGap = true;
          totalGaps += 1;
          totalGapMinutes += gapMinutes;
        } else {
          isOverlap = true;
        }
      }

      items.push({
        log: current,
        nextLog: next,
        gapMinutes,
        isConjugated,
        hasGap,
        isOverlap,
        gapStartTime: current.endTime,
        gapEndTime: next ? next.startTime : null,
      });
    }

    return {
      items,
      totalGaps,
      totalGapMinutes,
      conjugatedCount,
    };
  }, [sortedLogs]);

  const openCreateModal = () => {
    setEditingLog(null);
    setFormDate(currentDate);
    setTitle('');
    setCategory('Work');
    setNotes('');

    let initialStart = getCurrentTimeString();
    if (logs.length > 0) {
      const sorted = [...logs].sort((a, b) => (a.endTime > b.endTime ? 1 : -1));
      const lastEndTime = sorted[sorted.length - 1]?.endTime;
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

  const openCreateModalWithRange = (customStart, customEnd) => {
    setEditingLog(null);
    setFormDate(currentDate);
    setTitle('');
    setCategory('Work');
    setNotes('');
    setStartTime(customStart || '09:00');
    setEndTime(customEnd || '10:00');
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

    if (!user) {
      const mockLog = {
        _id: editingLog?._id || `guest-log-${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
      };
      if (editingLog) {
        setLogs((prev) => prev.map((l) => (l._id === editingLog._id ? mockLog : l)));
        notifyGuestAction('Time log', 'updated');
      } else {
        setLogs((prev) => [...prev, mockLog]);
        notifyGuestAction('Time log', 'created');
      }
      setIsModalOpen(false);
      return;
    }

    setSaving(true);
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

    if (!user) {
      notifyGuestAction('Time log', 'deleted');
      return;
    }

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
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 sm:gap-2.5 mt-1">
          {CATEGORIES.map((cat) => {
            const mins = summary.byCategory?.[cat] || 0;
            const hours = Math.floor(mins / 60);
            const remainderMins = mins % 60;
            return (
              <div
                key={cat}
                className="p-2 sm:p-2.5 rounded-xl bg-subtle border border-theme flex flex-col justify-between"
              >
                <Badge variant={CATEGORY_COLORS[cat] || 'neutral'} size="xs">
                  {cat}
                </Badge>
                <div className="mt-1 text-xs sm:text-sm font-black text-primary tracking-tight">
                  {hours > 0 ? `${hours}h ${remainderMins}m` : `${mins}m`}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Time Logs Timeline & Rope Connection */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 border-b border-theme/60">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-primary tracking-tight">
                {t('time.todaysLogs', "Today's Time Blocks")}
              </h2>
              <span className="text-xs font-bold text-secondary px-2 py-0.5 rounded-full bg-subtle border border-theme">
                {logs.length} blocks
              </span>
            </div>
            {logs.length > 1 && (
              <div className="flex items-center gap-2 text-[11px] font-semibold text-secondary mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Link className="w-3 h-3" /> {timeBlockAnalysis.conjugatedCount} Conjugated
                </span>
                <span>•</span>
                <span className={`flex items-center gap-1 ${timeBlockAnalysis.totalGaps > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-secondary'}`}>
                  {timeBlockAnalysis.totalGaps > 0 ? <Unlink className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {timeBlockAnalysis.totalGaps} Untracked {timeBlockAnalysis.totalGaps === 1 ? 'Gap' : 'Gaps'}
                  {timeBlockAnalysis.totalGapMinutes > 0 && ` (${Math.floor(timeBlockAnalysis.totalGapMinutes / 60)}h ${timeBlockAnalysis.totalGapMinutes % 60}m)`}
                </span>
              </div>
            )}
          </div>

          {logs.length > 0 && (
            <div className="flex items-center gap-1 bg-subtle p-1 rounded-xl border border-theme shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'timeline'
                    ? 'bg-surface text-primary border border-theme shadow-xs'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" /> Timeline Flow
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'grid'
                    ? 'bg-surface text-primary border border-theme shadow-xs'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Grid View
              </button>
            </div>
          )}
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
        ) : viewMode === 'timeline' ? (
          /* Continuous Timeline Flow with Rope Connections */
          <div className="max-w-2xl mx-auto space-y-0 py-1">
            {timeBlockAnalysis.items.map((item, index) => {
              const { log, isConjugated, hasGap, isOverlap, gapMinutes, gapStartTime, gapEndTime } = item;
              const isLast = index === timeBlockAnalysis.items.length - 1;

              return (
                <div key={log._id} className="relative">
                  {/* Time Block Card */}
                  <Card
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
                    <div className="space-y-2.5 pb-2">
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

                  {/* Inter-Task Connector: Rope (Conjugated) OR Broken Rope (Untracked Gap) */}
                  {!isLast && (
                    <>
                      {isConjugated && (
                        /* Conjugated Tasks -> Continuous Rope Bridge */
                        <div className="flex flex-col items-center justify-center my-0.5 py-1">
                          {/* Upper Rope Segment */}
                          <div className="w-1.5 h-5 bg-gradient-to-b from-[#007EA7] to-emerald-500 rounded-full shadow-xs relative flex items-center justify-center">
                            <div className="w-0.5 h-full bg-white/40 rounded-full" />
                          </div>
                          {/* Connected Link Knot Pill */}
                          <div className="my-0.5 px-2.5 py-0.5 rounded-full bg-surface border border-emerald-500/40 text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shadow-xs">
                            <Link className="w-2.5 h-2.5 stroke-[2.5]" />
                            <span>Conjugated · No Gap</span>
                          </div>
                          {/* Lower Rope Segment */}
                          <div className="w-1.5 h-5 bg-gradient-to-b from-emerald-500 to-[#007EA7] rounded-full shadow-xs relative flex items-center justify-center">
                            <div className="w-0.5 h-full bg-white/40 rounded-full" />
                          </div>
                        </div>
                      )}

                      {hasGap && (
                        /* Untracked Time Gap -> Broken Severed Rope Alert */
                        <div className="my-2 relative">
                          {/* Top Severed Rope Strand */}
                          <div className="flex flex-col items-center">
                            <div className="w-1.5 h-4 bg-gradient-to-b from-slate-400 to-rose-500 rounded-t-full relative flex items-center justify-center">
                              <div className="w-0.5 h-full bg-white/30 rounded-full" />
                            </div>
                            <div className="w-3 h-0.5 bg-rose-500 my-0.5 rounded-full" />
                          </div>

                          {/* Broken Gap Warning Card */}
                          <div className="p-3 sm:p-3.5 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border-2 border-dashed border-rose-500/40 my-1.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                                <Unlink className="w-4 h-4 stroke-[2.5]" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                                    Broken Rope · Untracked Gap
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-700 dark:text-rose-300 font-extrabold">
                                    {Math.floor(gapMinutes / 60) > 0 ? `${Math.floor(gapMinutes / 60)}h ${gapMinutes % 60}m` : `${gapMinutes}m`} gap
                                  </span>
                                </div>
                                <p className="text-[11px] text-secondary font-medium mt-0.5">
                                  Untracked time from <strong className="text-primary">{gapStartTime}</strong> to <strong className="text-primary">{gapEndTime}</strong>
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => openCreateModalWithRange(gapStartTime, gapEndTime)}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0 w-full sm:w-auto justify-center"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Track {Math.floor(gapMinutes / 60) > 0 ? `${Math.floor(gapMinutes / 60)}h ${gapMinutes % 60}m` : `${gapMinutes}m`} Gap</span>
                            </button>
                          </div>

                          {/* Bottom Severed Rope Strand */}
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-0.5 bg-rose-500 my-0.5 rounded-full" />
                            <div className="w-1.5 h-4 bg-gradient-to-b from-rose-500 to-slate-400 rounded-b-full relative flex items-center justify-center">
                              <div className="w-0.5 h-full bg-white/30 rounded-full" />
                            </div>
                          </div>
                        </div>
                      )}

                      {isOverlap && (
                        /* Overlap Indicator */
                        <div className="my-2 flex flex-col items-center">
                          <div className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 shadow-xs">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>Overlaps by {Math.abs(gapMinutes)}m ({gapStartTime} &gt; {gapEndTime})</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Grid View Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {sortedLogs.map((log) => (
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
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${isSelected
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
