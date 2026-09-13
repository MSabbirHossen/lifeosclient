import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { DateInput } from '../components/DateInput';
import api from '../utils/api';
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
} from 'lucide-react';

export const StudyTracker = ({ selectedDate }) => {
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
  const [totalChapters, setTotalChapters] = useState(1);
  const [completedChapters, setCompletedChapters] = useState(0);
  const [subtopicsList, setSubtopicsList] = useState([]);
  const [newSubtopicInput, setNewSubtopicInput] = useState('');
  const [topicTargetDate, setTopicTargetDate] = useState('');
  const [topicGoalId, setTopicGoalId] = useState('');
  const [topicNotes, setTopicNotes] = useState('');
  const [savingTopic, setSavingTopic] = useState(false);

  // Deletion modals
  const [deleteSessionId, setDeleteSessionId] = useState(null);
  const [deleteTopicId, setDeleteTopicId] = useState(null);

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
    setTotalChapters(1);
    setCompletedChapters(0);
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
    setTotalChapters(top.totalChapters || 1);
    setCompletedChapters(top.completedChapters || 0);
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

    setSavingSession(true);
    try {
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

      if (editingSessionId) {
        const res = await api.put(`/study/${editingSessionId}`, payload);
        setIsSessionModalOpen(false);
        setEditingSessionId(null);
        if (res.data) {
          setSessions((prev) =>
            prev.map((s) => (s._id === editingSessionId ? res.data : s))
          );
        }
      } else {
        const res = await api.post('/study', payload);
        setIsSessionModalOpen(false);
        if (res.data) setSessions((prev) => [res.data, ...prev]);
      }
      fetchData(false);
    } catch (err) {
      console.error('Failed to log study session', err);
    } finally {
      setSavingSession(false);
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!topicSubject.trim() || !topicTitle.trim()) return;

    setSavingTopic(true);
    try {
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

      if (editingTopicId) {
        const res = await api.put(`/study/topics/${editingTopicId}`, payload);
        setIsTopicModalOpen(false);
        setEditingTopicId(null);
        if (res.data) {
          setTopics((prev) =>
            prev.map((t) => (t._id === editingTopicId ? res.data : t))
          );
        }
      } else {
        const res = await api.post('/study/topics', payload);
        setIsTopicModalOpen(false);
        if (res.data) setTopics((prev) => [res.data, ...prev]);
      }
      setTopicSubject('');
      setTopicTitle('');
      setTotalChapters(1);
      setCompletedChapters(0);
      setSubtopicsList([]);
      setNewSubtopicInput('');
      setTopicNotes('');
      fetchData(false);
    } catch (err) {
      console.error('Failed to plan topic', err);
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

    try {
      await api.put(`/study/topics/${topicId}`, { deltaChapter: delta });
      fetchData(false);
    } catch (err) {
      console.error('Failed to update chapter count', err);
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

    try {
      await api.put(`/study/topics/${topicId}`, { subtopics: updatedSubtopics });
      fetchData(false);
    } catch (err) {
      console.error('Failed to update subtopic', err);
      fetchData(false);
    }
  };

  // Status Switch
  const handleUpdateTopicStatus = async (topicId, newStatus) => {
    setTopics((prev) =>
      prev.map((t) => (t._id === topicId ? { ...t, status: newStatus } : t))
    );

    try {
      await api.put(`/study/topics/${topicId}`, { status: newStatus });
      fetchData(false);
    } catch (err) {
      console.error('Failed to update topic status', err);
      fetchData(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteSessionId) return;
    const targetId = deleteSessionId;
    setDeleteSessionId(null);
    setSessions((prev) => prev.filter((s) => s._id !== targetId));

    try {
      await api.delete(`/study/${targetId}`);
      fetchData(false);
    } catch (err) {
      console.error('Failed to delete study session', err);
      fetchData(false);
    }
  };

  const handleDeleteTopic = async () => {
    if (!deleteTopicId) return;
    const targetId = deleteTopicId;
    setDeleteTopicId(null);
    setTopics((prev) => prev.filter((t) => t._id !== targetId));

    try {
      await api.delete(`/study/topics/${targetId}`);
      fetchData(false);
    } catch (err) {
      console.error('Failed to delete study topic', err);
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
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        category="Learning & Mastery"
        title="Study & Topic Planning"
        description={`Log deep focus study sessions, plan backlogs chapter by chapter, and track completion for ${formatDisplayDate(activeDate)}`}
        action={
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="md"
              icon={ListTodo}
              onClick={openCreateTopicModal}
            >
              Plan Topic / Chapter
            </Button>
            <Button
              variant="gradient"
              size="md"
              icon={Plus}
              onClick={openCreateSessionModal}
            >
              Log Session
            </Button>
          </div>
        }
      />

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
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
          <Button variant="outline" size="sm" icon={Plus} onClick={openCreateTopicModal}>
            Add Chapter / Topic
          </Button>
        }
      >
        {topics.length === 0 ? (
          <div className="p-6 text-center text-xs text-secondary italic bg-subtle/50 rounded-xl border border-dashed border-theme mt-2">
            No chapter topics planned yet. Click "Add Chapter / Topic" to organize your curriculum and eliminate backlogs.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
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
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            remainingCh === 0
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
                      <div className="flex items-center justify-between pt-1">
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
                                className={`truncate font-medium ${
                                  sub.completed ? 'line-through text-secondary' : 'text-primary'
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
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all duration-150 ${
                          top.status === 'backlog'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-surface text-secondary hover:text-primary'
                        }`}
                      >
                        Backlog
                      </button>
                      <button
                        onClick={() => handleUpdateTopicStatus(top._id, 'in_progress')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all duration-150 ${
                          top.status === 'in_progress'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-surface text-secondary hover:text-primary'
                        }`}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => handleUpdateTopicStatus(top._id, 'completed')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all duration-150 ${
                          top.status === 'completed'
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
                        onClick={() => setDeleteTopicId(top._id)}
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
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
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
                  <div className="flex items-center gap-0.5 bg-surface/90 dark:bg-surface/90 backdrop-blur-xs rounded-xl p-0.5 border border-theme/40 shadow-xs">
                    <button
                      onClick={() => handleEditSession(sess)}
                      className="p-1 rounded-lg text-secondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                      title="Edit Session"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteSessionId(sess._id)}
                      className="p-1 rounded-lg text-secondary hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
        title="Log Study Session"
        subtitle={`Record focus session for ${formatDisplayDate(sessionDate || activeDate)}`}
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <DateInput
            label="Session Date"
            value={sessionDate}
            onChange={setSessionDate}
            required
          />

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Subject / Topic
            </label>
            <input
              type="text"
              required
              placeholder="e.g. System Design, Algorithms, Physics"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input-base"
              list="subject-suggestions"
            />
            <datalist id="subject-suggestions">
              {subjects.map((sub, idx) => (
                <option key={idx} value={sub} />
              ))}
            </datalist>
          </div>

          {/* Attach to Planned Topic Dropdown */}
          {topics.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Attach to Planned Topic (Optional)
              </label>
              <select
                value={selectedTopicId}
                onChange={(e) => handleTopicSelectionInSession(e.target.value)}
                className="select-base"
              >
                <option value="">None (Independent Study)</option>
                {topics.map((t) => (
                  <option key={t._id} value={t._id}>
                    [{t.subject}] {t.title} ({t.completedChapters || 0}/{t.totalChapters || 1} ch)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Start Time & End Time with Start Now / End Now Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider">
                  Start Time
                </label>
                <button
                  type="button"
                  onClick={handleSetStartNow}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:text-accent-hover transition-colors"
                >
                  <Play className="w-3 h-3" /> Start Now
                </button>
              </div>
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="input-base"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider">
                  End Time
                </label>
                <button
                  type="button"
                  onClick={handleSetEndNow}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:opacity-80 transition-colors"
                >
                  <Square className="w-3 h-3" /> End Now
                </button>
              </div>
              <input
                type="time"
                value={endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className="input-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Resource Link / Material URL
            </label>
            <input
              type="text"
              placeholder="e.g. https://coursera.org/learn/react, docs.nestjs.com"
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="1"
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="input-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Progress ({progressPercent}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={progressPercent}
                onChange={(e) => setProgressPercent(e.target.value)}
                className="w-full accent-indigo-600 mt-2 cursor-pointer"
              />
            </div>
          </div>

          {/* Goal Linkage Dropdown */}
          {goals.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Link to Goal (Optional)
              </label>
              <select
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className="select-base"
              >
                <option value="">None (Independent Study)</option>
                {goals.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Notes & Key Takeaways (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="What core ideas did you learn?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="textarea-base"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsSessionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={savingSession}>
              {editingSessionId ? 'Update Session' : 'Save Session'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Plan Topic Modal */}
      <Modal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        title={editingTopicId ? 'Edit Chapter / Topic Plan' : 'Plan Chapter / Topic Backlog'}
        subtitle={editingTopicId ? 'Update chapter counts, subtopics, and status' : 'Organize syllabus, configure chapters, and eliminate study backlogs'}
      >
        <form onSubmit={handleCreateTopic} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Subject Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Systems, Calculus"
              value={topicSubject}
              onChange={(e) => setTopicSubject(e.target.value)}
              className="input-base"
              list="topic-subject-suggestions"
            />
            <datalist id="topic-subject-suggestions">
              {subjects.map((sub, idx) => (
                <option key={idx} value={sub} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Topic / Syllabus Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. System Design: Scalability, Consensus & Caching"
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              className="input-base"
            />
          </div>

          {/* Chapter Count Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Total Chapters Count
              </label>
              <input
                type="number"
                min="1"
                required
                value={totalChapters}
                onChange={(e) => setTotalChapters(Math.max(1, Number(e.target.value) || 1))}
                className="input-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Already Completed Chapters
              </label>
              <input
                type="number"
                min="0"
                max={totalChapters}
                value={completedChapters}
                onChange={(e) => setCompletedChapters(Math.max(0, Math.min(totalChapters, Number(e.target.value) || 0)))}
                className="input-base"
              />
            </div>
          </div>

          {/* Sub-topics Input Builder */}
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Sub-topics / Sections Checklist (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 1. Master-Worker Architecture"
                value={newSubtopicInput}
                onChange={(e) => setNewSubtopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtopicToDraft();
                  }
                }}
                className="input-base flex-1"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddSubtopicToDraft}>
                Add Sub-topic
              </Button>
            </div>

            {subtopicsList.length > 0 && (
              <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto p-2 bg-subtle rounded-xl border border-theme">
                {subtopicsList.map((st, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 bg-surface rounded-lg">
                    <span className="text-primary font-medium truncate">{st.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtopicFromDraft(idx)}
                      className="text-secondary hover:text-rose-500 font-bold ml-2 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Initial Status
              </label>
              <select
                value={topicStatus}
                onChange={(e) => setTopicStatus(e.target.value)}
                className="select-base"
              >
                <option value="backlog">Backlog</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <DateInput
              label="Target Date"
              value={topicTargetDate}
              onChange={setTopicTargetDate}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Focus on video exercises and summary notes"
              value={topicNotes}
              onChange={(e) => setTopicNotes(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsTopicModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={savingTopic}>
              {editingTopicId ? 'Update Topic Plan' : 'Save Topic'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Session Confirmation Modal */}
      <Modal
        isOpen={!!deleteSessionId}
        onClose={() => setDeleteSessionId(null)}
        title="Confirm Deletion"
        subtitle="This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Are you sure you want to delete this study session? It will be permanently removed.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setDeleteSessionId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteSession}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Topic Confirmation Modal */}
      <Modal
        isOpen={!!deleteTopicId}
        onClose={() => setDeleteTopicId(null)}
        title="Confirm Deletion"
        subtitle="This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Are you sure you want to delete this planned chapter topic?
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setDeleteTopicId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteTopic}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudyTracker;
