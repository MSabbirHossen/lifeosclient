import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { LoadingScreen } from '../components/LoadingScreen';
import { DateInput } from '../components/DateInput';
import api from '../utils/api';
import { notifyCreated, notifyUpdated, notifyDeleted, notifyError, showSuccessToast, confirmDelete, notifyGuestAction } from '../utils/alerts';
import { useAuth } from '../context/AuthContext';
import { getFormattedDate, formatDisplayDate } from '../utils/dateHelpers';
import {
  GraduationCap,
  Plus,
  Minus,
  Clock,
  BookOpen,
  Trash2,
  Edit2,
  ExternalLink,
  ListTodo,
  CheckCircle2,
  Circle,
  Play,
  Square,
  Bookmark,
  Sparkles,
} from 'lucide-react';

export const StudyTracker = ({ selectedDate }) => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const activeDate = selectedDate || getFormattedDate();


  const [sessions, setSessions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [goals, setGoals] = useState([]);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Session Modal State
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [sessionDate, setSessionDate] = useState(activeDate);
  const [subject, setSubject] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [resource, setResource] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [progressPercent, setProgressPercent] = useState(50);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [selectedHabitId, setSelectedHabitId] = useState('');
  const [notes, setNotes] = useState('');
  const [savingSession, setSavingSession] = useState(false);

  // Topic / Backlog Modal State
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [topicSubject, setTopicSubject] = useState('');
  const [topicTitle, setTopicTitle] = useState('');
  const [topicStatus, setTopicStatus] = useState('backlog');
  const [totalChapters, setTotalChapters] = useState('');
  const [completedChapters, setCompletedChapters] = useState('');
  const [subtopicsList, setSubtopicsList] = useState([]);
  const [newSubtopicInput, setNewSubtopicInput] = useState('');
  const [topicTargetDate, setTopicTargetDate] = useState('');
  const [topicGoalId, setTopicGoalId] = useState('');
  const [topicNotes, setTopicNotes] = useState('');
  const [savingTopic, setSavingTopic] = useState(false);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [sessionsRes, topicsRes, subjectsRes, goalsRes, habitsRes] = await Promise.all([
        api.get(`/study?date=${activeDate}`),
        api.get('/study/topics'),
        api.get('/study/subjects'),
        api.get('/goals'),
        api.get('/habits'),
      ]);
      setSessions(sessionsRes.data || []);
      setTopics(topicsRes.data || []);
      setSubjects(subjectsRes.data || []);
      setGoals(goalsRes.data || []);
      setHabits(habitsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch study data', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [activeDate]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Helper to format current time as HH:MM
  const getCurrentTimeHHMM = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Auto-calculate duration whenever start or end time changes
  const calculateDurationFromTimes = (start, end) => {
    if (!start || !end) return;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return;

    let startTotal = startH * 60 + startM;
    let endTotal = endH * 60 + endM;
    if (endTotal < startTotal) {
      // Crossed midnight
      endTotal += 24 * 60;
    }
    const diff = endTotal - startTotal;
    if (diff > 0) {
      setDurationMinutes(diff);
    }
  };

  const handleStartTimeChange = (newStart) => {
    setStartTime(newStart);
    calculateDurationFromTimes(newStart, endTime);
  };

  const handleEndTimeChange = (newEnd) => {
    setEndTime(newEnd);
    calculateDurationFromTimes(startTime, newEnd);
  };

  const handleSetStartNow = () => {
    const now = getCurrentTimeHHMM();
    setStartTime(now);
    calculateDurationFromTimes(now, endTime);
  };

  const handleSetEndNow = () => {
    const now = getCurrentTimeHHMM();
    setEndTime(now);
    calculateDurationFromTimes(startTime, now);
  };

  const handleTopicSelectionInSession = (topicId) => {
    setSelectedTopicId(topicId);
    if (topicId) {
      const found = topics.find((t) => t._id === topicId);
      if (found) {
        if (!subject || subject === '') {
          setSubject(found.subject);
        }
        if (found.linkedGoalId) {
          setSelectedGoalId(found.linkedGoalId);
        }
      }
    }
  };

  const handleAddSubtopicToDraft = () => {
    if (!newSubtopicInput.trim()) return;
    setSubtopicsList((prev) => [...prev, { title: newSubtopicInput.trim(), completed: false }]);
    setNewSubtopicInput('');
  };

  const handleRemoveSubtopicFromDraft = (index) => {
    setSubtopicsList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const openCreateSessionModal = () => {
    setEditingSessionId(null);
    setSessionDate(activeDate);
    setSubject('');
    setSelectedTopicId('');
    setResource('');
    setStartTime('');
    setEndTime('');
    setDurationMinutes(45);
    setProgressPercent(50);
    setSelectedGoalId('');
    setSelectedHabitId('');
    setNotes('');
    setIsSessionModalOpen(true);
  };

  const handleEditSession = (sess) => {
    setEditingSessionId(sess._id);
    setSessionDate(sess.date || activeDate);
    setSubject(sess.subject || '');
    setSelectedTopicId(sess.topicId ? (typeof sess.topicId === 'object' ? sess.topicId._id : sess.topicId) : '');
    setResource(sess.resource || '');
    setStartTime(sess.startTime || '');
    setEndTime(sess.endTime || '');
    setDurationMinutes(sess.durationMinutes || 45);
    setProgressPercent(sess.progressPercent || 0);
    setSelectedGoalId(sess.goalId ? (typeof sess.goalId === 'object' ? sess.goalId._id : sess.goalId) : '');
    setSelectedHabitId(sess.habitId ? (typeof sess.habitId === 'object' ? sess.habitId._id : sess.habitId) : '');
    setNotes(sess.notes || '');
    setIsSessionModalOpen(true);
  };

  const openCreateTopicModal = () => {
    setEditingTopicId(null);
    setTopicSubject('');
    setTopicTitle('');
    setTopicStatus('backlog');
    setTotalChapters('');
    setCompletedChapters('');
    setSubtopicsList([]);
    setNewSubtopicInput('');
    setTopicTargetDate('');
    setTopicGoalId('');
    setTopicNotes('');
    setIsTopicModalOpen(true);
  };

  const handleEditTopic = (top) => {
    setEditingTopicId(top._id);
    setTopicSubject(top.subject || '');
    setTopicTitle(top.title || '');
    setTopicStatus(top.status || 'backlog');
    setTotalChapters(top.totalChapters ?? '');
    setCompletedChapters(top.completedChapters ?? '');
    setSubtopicsList(Array.isArray(top.subtopics) ? top.subtopics : []);
    setNewSubtopicInput('');
    setTopicTargetDate(top.targetDate || '');
    setTopicGoalId(top.linkedGoalId ? (typeof top.linkedGoalId === 'object' ? top.linkedGoalId._id : top.linkedGoalId) : '');
    setTopicNotes(top.notes || '');
    setIsTopicModalOpen(true);
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!subject.trim()) return;

    const payload = {
      date: sessionDate || activeDate,
      subject: subject.trim(),
      resource: resource.trim(),
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      topicId: selectedTopicId || undefined,
      durationMinutes: Number(durationMinutes) || 45,
      progressPercent: Number(progressPercent) || 0,
      goalId: selectedGoalId || undefined,
      habitId: selectedHabitId || undefined,
      notes: notes.trim(),
    };

    if (!user) {
      const mockSession = {
        _id: editingSessionId || `guest-session-${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
      };
      if (editingSessionId) {
        setSessions((prev) => prev.map((s) => (s._id === editingSessionId ? mockSession : s)));
        notifyGuestAction('Study session', 'updated');
      } else {
        setSessions((prev) => [mockSession, ...prev]);
        notifyGuestAction('Study session', 'logged');
      }
      setIsSessionModalOpen(false);
      setEditingSessionId(null);
      return;
    }

    setSavingSession(true);
    try {
      if (editingSessionId) {
        const res = await api.put(`/study/${editingSessionId}`, payload);
        setIsSessionModalOpen(false);
        setEditingSessionId(null);
        if (res.data) {
          setSessions((prev) =>
            prev.map((s) => (s._id === editingSessionId ? res.data : s))
          );
        }
        notifyUpdated('Study session');
      } else {
        const res = await api.post('/study', payload);
        setIsSessionModalOpen(false);
        if (res.data) setSessions((prev) => [res.data, ...prev]);
        notifyCreated('Study session');
      }
      fetchData(false);
    } catch (err) {
      console.error('Failed to log study session', err);
      notifyError(err, 'Failed to save study session');
    } finally {
      setSavingSession(false);
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!topicSubject.trim() || !topicTitle.trim()) return;

    const payload = {
      subject: topicSubject.trim(),
      title: topicTitle.trim(),
      status: topicStatus,
      totalChapters: Number(totalChapters) || 1,
      completedChapters: Number(completedChapters) || 0,
      subtopics: subtopicsList,
      targetDate: topicTargetDate || undefined,
      linkedGoalId: topicGoalId || undefined,
      notes: topicNotes.trim(),
    };

    if (!user) {
      const mockTopic = {
        _id: editingTopicId || `guest-topic-${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
      };
      if (editingTopicId) {
        setTopics((prev) => prev.map((t) => (t._id === editingTopicId ? mockTopic : t)));
        notifyGuestAction('Study topic', 'updated');
      } else {
        setTopics((prev) => [mockTopic, ...prev]);
        notifyGuestAction('Study topic', 'created');
      }
      setIsTopicModalOpen(false);
      setEditingTopicId(null);
      setTopicSubject('');
      setTopicTitle('');
      setTotalChapters('');
      setCompletedChapters('');
      setSubtopicsList([]);
      setNewSubtopicInput('');
      setTopicNotes('');
      return;
    }

    setSavingTopic(true);
    try {
      if (editingTopicId) {
        const res = await api.put(`/study/topics/${editingTopicId}`, payload);
        setIsTopicModalOpen(false);
        setEditingTopicId(null);
        if (res.data) {
          setTopics((prev) =>
            prev.map((t) => (t._id === editingTopicId ? res.data : t))
          );
        }
        notifyUpdated('Study topic');
      } else {
        const res = await api.post('/study/topics', payload);
        setIsTopicModalOpen(false);
        if (res.data) setTopics((prev) => [res.data, ...prev]);
        notifyCreated('Study topic');
      }
      setTopicSubject('');
      setTopicTitle('');
      setTotalChapters('');
      setCompletedChapters('');
      setSubtopicsList([]);
      setNewSubtopicInput('');
      setTopicNotes('');
      fetchData(false);
    } catch (err) {
      console.error('Failed to plan topic', err);
      notifyError(err, 'Failed to save topic');
    } finally {
      setSavingTopic(false);
    }
  };

  // Stepper increment / decrement for chapters
  const handleDeltaChapter = async (topicId, delta) => {
    // Optimistic UI update
    setTopics((prev) =>
      prev.map((t) => {
        if (t._id !== topicId) return t;
        const total = t.totalChapters || 1;
        const newCompleted = Math.max(0, Math.min(total, (t.completedChapters || 0) + delta));
        let newStatus = t.status;
        if (newCompleted >= total) newStatus = 'completed';
        else if (newCompleted > 0 && t.status === 'backlog') newStatus = 'in_progress';
        return { ...t, completedChapters: newCompleted, status: newStatus };
      })
    );

    if (!user) {
      notifyGuestAction('Topic progress', delta > 0 ? '+1 Chapter completed' : 'progress adjusted');
      return;
    }

    try {
      await api.put(`/study/topics/${topicId}`, { deltaChapter: delta });
      showSuccessToast(
        delta > 0 ? '+1 Chapter completed' : '-1 Chapter adjusted',
        'Topic Progress'
      );
      fetchData(false);
    } catch (err) {
      console.error('Failed to update chapter count', err);
      notifyError(err, 'Failed to update chapter progress');
      fetchData(false);
    }
  };

  // Toggle subtopic completion
  const handleToggleSubtopic = async (topicId, subIndex) => {
    const topic = topics.find((t) => t._id === topicId);
    if (!topic || !topic.subtopics) return;

    const updatedSubtopics = topic.subtopics.map((st, idx) =>
      idx === subIndex ? { ...st, completed: !st.completed } : st
    );

    // Optimistic update
    setTopics((prev) =>
      prev.map((t) => (t._id === topicId ? { ...t, subtopics: updatedSubtopics } : t))
    );

    if (!user) {
      notifyGuestAction('Subtopic', 'toggled');
      return;
    }

    try {
      await api.put(`/study/topics/${topicId}`, { subtopics: updatedSubtopics });
      fetchData(false);
    } catch (err) {
      console.error('Failed to update subtopic', err);
      notifyError(err, 'Failed to update subtopic');
      fetchData(false);
    }
  };

  // Status Switch
  const handleUpdateTopicStatus = async (topicId, newStatus) => {
    setTopics((prev) =>
      prev.map((t) => (t._id === topicId ? { ...t, status: newStatus } : t))
    );

    if (!user) {
      notifyGuestAction('Topic status', `changed to ${newStatus.replace('_', ' ')}`);
      return;
    }

    try {
      await api.put(`/study/topics/${topicId}`, { status: newStatus });
      showSuccessToast(
        `Status updated to ${newStatus.replace('_', ' ')}`,
        'Topic Status'
      );
      fetchData(false);
    } catch (err) {
      console.error('Failed to update topic status', err);
      notifyError(err, 'Failed to update topic status');
      fetchData(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!sessionId) return;
    const confirmed = await confirmDelete('Study session');
    if (!confirmed) return;

    setSessions((prev) => prev.filter((s) => s._id !== sessionId));

    if (!user) {
      notifyGuestAction('Study session', 'deleted');
      return;
    }

    try {
      await api.delete(`/study/${sessionId}`);
      notifyDeleted('Study session');
      fetchData(false);
    } catch (err) {
      console.error('Failed to delete study session', err);
      notifyError(err, 'Failed to delete study session');
      fetchData(false);
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!topicId) return;
    const confirmed = await confirmDelete('Study topic');
    if (!confirmed) return;

    setTopics((prev) => prev.filter((t) => t._id !== topicId));

    if (!user) {
      notifyGuestAction('Study topic', 'deleted');
      return;
    }

    try {
      await api.delete(`/study/topics/${topicId}`);
      notifyDeleted('Study topic');
      fetchData(false);
    } catch (err) {
      console.error('Failed to delete study topic', err);
      notifyError(err, 'Failed to delete study topic');
      fetchData(false);
    }
  };


  const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const completedTopics = topics.filter((t) => t.status === 'completed').length;

  const formatExternalUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      <PageHeader
        category={t('nav.study', 'Learning & Mastery')}
        title={t('study.title', 'Study & Learning Tracker')}
        description={`${t('study.subtitle', 'Organize subjects, log study pomodoros, schedule spaced repetition, and master topics.')} (${formatDisplayDate(activeDate)})`}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              icon={ListTodo}
              onClick={openCreateTopicModal}
            >
              {t('study.addSubject', 'Plan Topic / Chapter')}
            </Button>
            <Button
              variant="gradient"
              size="md"
              icon={Plus}
              onClick={openCreateSessionModal}
            >
              {t('study.logSession', 'Log Session')}
            </Button>
          </div>
        }
      />

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5">
        <StatCard
          title="Study Time Today"
          value={`${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`}
          subtitle={`${sessions.length} sessions completed`}
          icon={Clock}
          color="indigo"
        />
        <StatCard
          title="Backlog Clearance"
          value={`${completedTopics} / ${topics.length}`}
          subtitle="Topics & chapters mastered"
          icon={GraduationCap}
          color="purple"
        />
        <StatCard
          title="Active Curriculum"
          value={subjects.length}
          subtitle="Distinct study subjects"
          icon={BookOpen}
          color="emerald"
        />
      </div>

      {/* Chapter & Topic Backlog Planning Section */}
      <Card
        hover
        title="Chapter & Topic Backlog Planning"
        subtitle="Manage chapter syllabus, monitor remaining progress, and check off sub-topics"
        icon={ListTodo}
        action={
          <Button variant="outline" size="xs" icon={Plus} onClick={openCreateTopicModal} className="text-xs font-bold">
            Add Chapter / Topic
          </Button>
        }
      >
        {topics.length === 0 ? (
          <div className="p-3.5 sm:p-4 text-center text-xs text-secondary bg-subtle/50 rounded-xl border border-dashed border-theme mt-1">
            No chapter topics planned yet. Click "Add Chapter / Topic" to organize your curriculum and eliminate backlogs.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5 mt-2">
            {topics.map((top) => {
              const statusColors = {
                backlog: 'warning',
                in_progress: 'primary',
                completed: 'success',
              };

              const totalCh = top.totalChapters || 1;
              const compCh = top.completedChapters || 0;
              const remainingCh = Math.max(0, totalCh - compCh);
              const chapterPercent = Math.min(100, Math.round((compCh / totalCh) * 100));

              return (
                <div
                  key={top._id}
                  className="p-4 rounded-2xl bg-subtle border border-theme flex flex-col justify-between space-y-3.5 transition-all duration-200 hover:border-accent/40 shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="purple" size="xs">
                        {top.subject}
                      </Badge>
                      <Badge variant={statusColors[top.status] || 'neutral'} size="xs" dot>
                        {top.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <h4 className="text-sm font-bold text-primary tracking-tight">{top.title}</h4>
                    {top.notes && <p className="text-xs text-secondary font-medium">{top.notes}</p>}

                    {/* Chapter Counter & Steppers */}
                    <div className="p-2.5 rounded-xl bg-surface border border-theme/60 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-secondary">Chapters Progress:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-primary">
                            {compCh} / {totalCh}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${remainingCh === 0
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            }`}>
                            {remainingCh === 0 ? 'Completed' : `${remainingCh} left`}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-subtle rounded-full overflow-hidden border border-theme/50">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${chapterPercent}%` }}
                        />
                      </div>

                      {/* Quick Chapter Stepper Buttons */}
                      <div className="flex items-center justify-between gap-1.5 flex-wrap pt-1">
                        <span className="text-[11px] text-secondary font-medium">Quick Stepper:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={compCh <= 0}
                            onClick={() => handleDeltaChapter(top._id, -1)}
                            className="px-2 py-1 rounded-lg bg-subtle hover:bg-rose-500/10 text-secondary hover:text-rose-600 border border-theme/60 text-xs font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-0.5"
                            title="Decrement completed chapters"
                          >
                            <Minus className="w-3 h-3" /> 1 Ch
                          </button>
                          <button
                            type="button"
                            disabled={compCh >= totalCh}
                            onClick={() => handleDeltaChapter(top._id, 1)}
                            className="px-2 py-1 rounded-lg bg-accent/10 hover:bg-accent text-accent hover:text-white border border-accent/20 text-xs font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-0.5"
                            title="Increment completed chapters"
                          >
                            <Plus className="w-3 h-3" /> 1 Ch
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Sub-topics Checklist */}
                    {top.subtopics && top.subtopics.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                          Sub-topics ({top.subtopics.filter((s) => s.completed).length}/{top.subtopics.length})
                        </div>
                        <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                          {top.subtopics.map((sub, sIdx) => (
                            <div
                              key={sIdx}
                              onClick={() => handleToggleSubtopic(top._id, sIdx)}
                              className="flex items-center gap-2 p-1.5 rounded-lg bg-surface/80 hover:bg-surface border border-theme/40 text-xs cursor-pointer transition-colors"
                            >
                              {sub.completed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-secondary shrink-0" />
                              )}
                              <span
                                className={`truncate font-medium ${sub.completed ? 'line-through text-secondary' : 'text-primary'
                                  }`}
                              >
                                {sub.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-theme/50 gap-2 flex-wrap">
                    <div className="flex items-center gap-1 bg-subtle p-0.5 rounded-xl border border-theme/40">
                      <button
                        onClick={() => handleUpdateTopicStatus(top._id, 'backlog')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all duration-150 ${top.status === 'backlog'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-surface text-secondary hover:text-primary'
                          }`}
                      >
                        Backlog
                      </button>
                      <button
                        onClick={() => handleUpdateTopicStatus(top._id, 'in_progress')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all duration-150 ${top.status === 'in_progress'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-surface text-secondary hover:text-primary'
                          }`}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => handleUpdateTopicStatus(top._id, 'completed')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all duration-150 ${top.status === 'completed'
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-surface text-secondary hover:text-primary'
                          }`}
                      >
                        Done
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditTopic(top)}
                        className="p-1 rounded-lg text-secondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                        title="Edit Topic"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTopic(top._id)}
                        className="p-1 rounded-lg text-secondary hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                        title="Delete Topic"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Study Sessions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary tracking-tight">Today's Study Sessions</h2>
          <span className="text-xs font-semibold text-secondary">{sessions.length} sessions</span>
        </div>

        {loading ? (
          <LoadingScreen fullScreen={false} message="Loading study sessions..." size="md" />
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No study sessions logged today"
            description="Log your study session to track duration, completion percentage, and resource materials."
            actionText="Log Study Session"
            onAction={openCreateSessionModal}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {sessions.map((sess) => (
              <Card
                key={sess._id}
                hover
                bottomAction={
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEditSession(sess)}
                      className="p-1.5 rounded-lg bg-surface border border-theme text-secondary hover:text-accent hover:border-accent/40 hover:bg-accent/10 shadow-xs transition-all cursor-pointer"
                      title="Edit Session"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSession(sess._id)}
                      className="p-1.5 rounded-lg bg-surface border border-theme text-secondary hover:text-rose-600 hover:border-rose-500/40 hover:bg-rose-500/10 shadow-xs transition-all cursor-pointer"
                      title="Delete Session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                }
              >
                <div className="space-y-3.5 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="purple" size="sm" dot>
                      {sess.subject}
                    </Badge>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-accent block">
                        {Math.floor(sess.durationMinutes / 60)}h {sess.durationMinutes % 60}m
                      </span>
                      {sess.startTime && sess.endTime && (
                        <span className="text-[10px] text-secondary font-medium block">
                          {sess.startTime} - {sess.endTime}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Attached Topic Badge if applicable */}
                  {sess.topicId && (
                    <div className="flex items-center gap-1.5 text-xs text-secondary bg-subtle p-2 rounded-xl border border-theme/50">
                      <Bookmark className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate font-medium text-primary">
                        Plan: {typeof sess.topicId === 'object' ? sess.topicId.title : 'Attached Topic'}
                      </span>
                    </div>
                  )}

                  {/* External Resource Link */}
                  {sess.resource && (
                    <div className="flex items-center gap-1.5 text-xs text-secondary font-medium">
                      <a
                        href={formatExternalUrl(sess.resource)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-accent hover:underline font-bold truncate max-w-full"
                        title="Open Resource Material"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{sess.resource}</span>
                      </a>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-secondary">
                      <span>Completion</span>
                      <span className="text-primary">{sess.progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-subtle rounded-full overflow-hidden border border-theme">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${sess.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {sess.notes && (
                    <p className="text-xs text-secondary font-medium leading-relaxed bg-subtle p-2.5 rounded-xl border border-theme">
                      {sess.notes}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Log Session Modal */}
      <Modal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        title={editingSessionId ? t('study.updateSession', 'Update Study Session') : t('study.logSession', 'Log Study Session')}
        subtitle={`${t('study.logSessionSubtitle', 'Record learning duration, subject milestones, and focus metrics')} • ${formatDisplayDate(sessionDate || activeDate)}`}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleCreateSession} className="space-y-3.5">
          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
            {/* Left Column (6 Cols): Session Context & Time */}
            <div className="md:col-span-6 flex flex-col justify-between space-y-3">
              {/* Context Card */}
              <div className="p-3 bg-subtle/30 rounded-2xl border border-theme space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-theme/60">
                  <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-accent" /> {t('study.sessionContext', 'Session Context')}
                  </span>
                  <span className="text-[10px] text-accent font-bold px-1.5 py-0.5 rounded-md bg-accent/10">
                    Required
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <DateInput
                    label={t('study.sessionDate', 'Session Date')}
                    value={sessionDate}
                    onChange={setSessionDate}
                    required
                  />

                  <div>
                    <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                      {t('study.subjectTopic', 'Subject Name')} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t('study.subjectPlaceholder', 'e.g. Algorithms, Physics')}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-surface border border-theme rounded-xl px-2.5 py-1.5 text-xs font-semibold text-primary focus:outline-none focus:border-accent"
                      list="subject-suggestions"
                    />
                    <datalist id="subject-suggestions">
                      {subjects.map((sub, idx) => (
                        <option key={idx} value={sub} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Attach to Planned Topic Dropdown */}
                {topics.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                      {t('study.attachTopic', 'Attach to Planned Topic')}
                    </label>
                    <select
                      value={selectedTopicId}
                      onChange={(e) => handleTopicSelectionInSession(e.target.value)}
                      className="w-full bg-surface border border-theme rounded-xl px-2.5 py-1.5 text-xs text-primary focus:outline-none focus:border-accent"
                    >
                      <option value="">{t('study.noneIndependent', 'None (Independent Session)')}</option>
                      {topics.map((tItem) => (
                        <option key={tItem._id} value={tItem._id}>
                          [{tItem.subject}] {tItem.title} ({tItem.completedChapters || 0}/{tItem.totalChapters || 1} ch)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Time & Duration Card */}
              <div className="p-3 bg-subtle/30 rounded-2xl border border-theme space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-1.5 border-b border-theme/60">
                  <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> {t('study.timeSchedule', 'Timing & Duration')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                        {t('study.startTime', 'Start')}
                      </label>
                      <button
                        type="button"
                        onClick={handleSetStartNow}
                        className="inline-flex items-center gap-0.5 text-[10px] font-bold text-accent hover:underline cursor-pointer"
                      >
                        <Play className="w-2.5 h-2.5" /> Now
                      </button>
                    </div>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="w-full bg-surface border border-theme rounded-xl px-2 py-1 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                        {t('study.endTime', 'End')}
                      </label>
                      <button
                        type="button"
                        onClick={handleSetEndNow}
                        className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-500 hover:underline cursor-pointer"
                      >
                        <Square className="w-2.5 h-2.5" /> Now
                      </button>
                    </div>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                      className="w-full bg-surface border border-theme rounded-xl px-2 py-1 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-theme/40 items-center">
                  <div>
                    <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                      {t('study.durationMinutes', 'Duration (min)')} *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      placeholder="e.g. 45"
                      className="w-full bg-surface border border-theme rounded-xl px-2.5 py-1 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                        {t('study.progress', 'Progress')}
                      </label>
                      <span className="text-[10px] font-extrabold text-accent">{progressPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progressPercent}
                      onChange={(e) => setProgressPercent(e.target.value)}
                      className="w-full accent-accent cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (6 Cols): Resource, Goal & Takeaways */}
            <div className="md:col-span-6 flex flex-col justify-between space-y-3">
              {/* Resource & Goal Alignment Card */}
              <div className="p-3 bg-subtle/30 rounded-2xl border border-theme space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-theme/60">
                  <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-teal-500" /> {t('study.resourcesGoals', 'Resource & Goal Linkage')}
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                    {t('study.resourceLink', 'Resource / URL / Textbook')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('study.resourcePlaceholder', 'e.g. Coursera Course, Ch 4 Notes')}
                    value={resource}
                    onChange={(e) => setResource(e.target.value)}
                    className="w-full bg-surface border border-theme rounded-xl px-2.5 py-1.5 text-xs text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                {goals.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                      {t('study.linkToGoal', 'Link to Goal')}
                    </label>
                    <select
                      value={selectedGoalId}
                      onChange={(e) => setSelectedGoalId(e.target.value)}
                      className="w-full bg-surface border border-theme rounded-xl px-2.5 py-1.5 text-xs text-primary focus:outline-none focus:border-accent"
                    >
                      <option value="">{t('study.noneIndependent', 'None (Independent)')}</option>
                      {goals.map((g) => (
                        <option key={g._id} value={g._id}>
                          {g.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Takeaways Card */}
              <div className="p-3 bg-subtle/30 rounded-2xl border border-theme space-y-1.5 flex-1 flex flex-col justify-between">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">
                  {t('study.takeaways', 'Key Takeaways & Summary')} ({t('common.optional', 'Optional')})
                </label>
                <textarea
                  rows={3}
                  placeholder={t('study.takeawaysPlaceholder', 'e.g. Mastered dynamic programming memoization, completed 3 practice problems...')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-surface border border-theme rounded-xl p-2.5 text-xs text-primary focus:outline-none focus:border-accent resize-none flex-1"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2.5 pt-2.5 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsSessionModalOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={savingSession}>
              {editingSessionId ? t('study.updateSession', 'Update Session') : t('study.saveSession', 'Save Session')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Plan Topic Modal */}
      <Modal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        title={editingTopicId ? t('study.editTopicPlan', 'Edit Topic Plan') : t('study.planTopicBacklog', 'Plan Chapter / Topic Backlog')}
        subtitle={editingTopicId ? t('study.editTopicSubtitle', 'Update topic syllabus, chapter milestones, and backlog details') : t('study.planTopicSubtitle', 'Organize syllabus, configure chapters, and eliminate study backlogs')}
        maxWidth="max-w-5xl"
      >
        <form onSubmit={handleCreateTopic} className="space-y-3.5">
          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
            {/* Left Column (5 Cols): Subject, Title, Chapters & Status */}
            <div className="md:col-span-5 flex flex-col justify-between space-y-3">
              {/* Subject & Topic Identity Card */}
              <div className="p-3 bg-subtle/30 rounded-2xl border border-theme space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-theme/60">
                  <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-accent" /> {t('study.topicDetails', 'Topic Details')}
                  </span>
                  <span className="text-[10px] text-accent font-bold px-1.5 py-0.5 rounded-md bg-accent/10">
                    Required
                  </span>
                </div>

                {/* Subject Name */}
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                    {t('study.subjectName', 'Subject Name')} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('study.subjectPlaceholder', 'e.g. System Design, Algorithms, Physics')}
                    value={topicSubject}
                    onChange={(e) => setTopicSubject(e.target.value)}
                    className="w-full bg-surface border border-theme rounded-xl px-2.5 py-1.5 text-xs font-semibold text-primary focus:outline-none focus:border-accent"
                    list="topic-subject-suggestions"
                  />
                  <datalist id="topic-subject-suggestions">
                    {subjects.map((sub, idx) => (
                      <option key={idx} value={sub} />
                    ))}
                  </datalist>
                </div>

                {/* Topic / Syllabus Title */}
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                    {t('study.topicTitle', 'Topic / Syllabus Title')} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('study.topicPlaceholder', 'e.g. Scalability, Consensus & Caching')}
                    value={topicTitle}
                    onChange={(e) => setTopicTitle(e.target.value)}
                    className="w-full bg-surface border border-theme rounded-xl px-2.5 py-1.5 text-xs font-semibold text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Chapter Metrics & Milestones Card */}
              <div className="p-3 bg-subtle/30 rounded-2xl border border-theme space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-1.5 border-b border-theme/60">
                  <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-500" /> {t('study.chaptersProgress', 'Chapter Metrics')}
                  </span>
                  <span className="text-[10px] text-secondary font-semibold">
                    {completedChapters || 0} / {totalChapters || 0} Chapters ({totalChapters && Number(totalChapters) > 0 ? Math.min(100, Math.round(((Number(completedChapters) || 0) / Number(totalChapters)) * 100)) : 0}%)
                  </span>
                </div>

                {/* Total & Completed Chapters Row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-xl bg-surface border border-theme shadow-xs">
                    <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                      {t('study.totalChapters', 'Total Chapters')} *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={totalChapters}
                      onChange={(e) => setTotalChapters(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full bg-subtle/60 border border-theme rounded-lg px-2 py-1 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="p-2 rounded-xl bg-surface border border-theme shadow-xs">
                    <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                      {t('study.completedChapters', 'Completed')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={totalChapters ? Number(totalChapters) : undefined}
                      value={completedChapters}
                      onChange={(e) => setCompletedChapters(e.target.value)}
                      placeholder="e.g. 0"
                      className="w-full bg-subtle/60 border border-theme rounded-lg px-2 py-1 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                {/* Progress bar visual */}
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-indigo-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${totalChapters && Number(totalChapters) > 0 ? Math.min(100, Math.round(((Number(completedChapters) || 0) / Number(totalChapters)) * 100)) : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Status & Target Date Row */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-theme/40 items-end">
                  <div>
                    <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                      {t('study.initialStatus', 'Initial Status')}
                    </label>
                    <select
                      value={topicStatus}
                      onChange={(e) => setTopicStatus(e.target.value)}
                      className="w-full bg-surface border border-theme rounded-xl px-2 py-1.5 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                    >
                      <option value="backlog">{t('study.backlog', 'Backlog')}</option>
                      <option value="in_progress">{t('study.inProgress', 'In Progress')}</option>
                      <option value="completed">{t('study.completed', 'Completed')}</option>
                    </select>
                  </div>

                  <div>
                    <DateInput
                      label={t('study.targetDate', 'Target Date')}
                      value={topicTargetDate}
                      onChange={setTopicTargetDate}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (7 Cols): Sub-topics Checklist & Notes */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-3">
              {/* Subtopics Checklist Builder Card */}
              <div className="p-3 bg-subtle/30 rounded-2xl border border-theme space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-1.5 border-b border-theme/60">
                  <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <ListTodo className="w-3.5 h-3.5 text-accent" /> {t('study.subtopicsChecklist', 'Sub-topics / Sections Checklist')}
                  </span>
                  <span className="text-[10px] text-secondary font-semibold">
                    {subtopicsList.length} items
                  </span>
                </div>

                {/* Input Builder Bar */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t('study.subtopicPlaceholder', 'e.g. 1. Master-Worker Architecture')}
                    value={newSubtopicInput}
                    onChange={(e) => setNewSubtopicInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtopicToDraft();
                      }
                    }}
                    className="flex-1 bg-surface border border-theme rounded-xl px-2.5 py-1.5 text-xs text-primary focus:outline-none focus:border-accent"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddSubtopicToDraft}
                    className="shrink-0 text-xs py-1 px-3"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> {t('study.addSubtopic', 'Add')}
                  </Button>
                </div>

                {/* Subtopics Checklist Container */}
                <div className="min-h-[110px] max-h-[140px] overflow-y-auto p-2 bg-surface/60 rounded-xl border border-theme/80 space-y-1.5">
                  {subtopicsList.length > 0 ? (
                    subtopicsList.map((st, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1 px-2.5 bg-subtle/80 hover:bg-subtle rounded-lg border border-theme/60 group transition-all"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[10px] font-bold text-accent">#{idx + 1}</span>
                          <span className="text-primary font-medium truncate">{st.title}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtopicFromDraft(idx)}
                          className="text-tertiary hover:text-rose-500 font-bold ml-2 p-0.5 rounded cursor-pointer transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-3 text-tertiary">
                      <ListTodo className="w-5 h-5 mb-1 opacity-40 text-accent" />
                      <p className="text-[11px] font-medium text-secondary">No sub-topics added yet</p>
                      <p className="text-[10px] text-tertiary">Type above & press Enter to breakdown your chapter milestones</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Card */}
              <div className="p-2.5 bg-subtle/30 rounded-2xl border border-theme">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                  {t('common.notes', 'Notes')} ({t('common.optional', 'Optional')})
                </label>
                <input
                  type="text"
                  placeholder="e.g. Focus on video exercises, practice past questions and summary notes"
                  value={topicNotes}
                  onChange={(e) => setTopicNotes(e.target.value)}
                  className="w-full bg-surface border border-theme rounded-xl px-2.5 py-1.5 text-xs text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2.5 pt-2.5 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsTopicModalOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={savingTopic}>
              {editingTopicId ? t('study.updateTopic', 'Update Topic') : t('study.saveTopic', 'Save Topic')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudyTracker;
