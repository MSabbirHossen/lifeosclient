import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { LoadingScreen } from '../components/LoadingScreen';
import api, { getLocalCache, setLocalCache } from '../utils/api';
import { notifyCreated, notifyUpdated, notifyDeleted, notifyError, showSuccessToast, confirmDelete, notifyGuestAction } from '../utils/alerts';
import { useAuth } from '../context/AuthContext';
import { DateInput } from '../components/DateInput';
import { getFormattedDate, formatDisplayDate } from '../utils/dateHelpers';
import { notifyStreakUpdate } from '../utils/streakEvents';
import { AdhkarCounter } from '../components/AdhkarCounter';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  CheckCircle2,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Sun,
  Moon,
  ShieldCheck,
  RotateCcw,
  Quote,
  ArrowRight,
  Clock,
  Calendar,
  Layers,
} from 'lucide-react';

export const IslamicTracker = ({ selectedDate }) => {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const activeDate = selectedDate || getFormattedDate();


  const [salahLogs, setSalahLogs] = useState(() => getLocalCache(`/islamic/salah?date=${activeDate}`)?.data || []);
  const [qadaLogs, setQadaLogs] = useState(() => getLocalCache('/islamic/qada')?.data || []);
  const [vows, setVows] = useState(() => getLocalCache('/islamic/vows')?.data || []);
  const [hadiths, setHadiths] = useState(() => getLocalCache('/islamic/hadith')?.data || []);
  const [quranLogs, setQuranLogs] = useState(() => getLocalCache(`/islamic/quran?date=${activeDate}`)?.data || []);
  const [adhkarLog, setAdhkarLog] = useState(() => getLocalCache(`/islamic/adhkar?date=${activeDate}`)?.data || { morningCompleted: false, eveningCompleted: false });
  const [todayFast, setTodayFast] = useState(() => getLocalCache(`/islamic/fasts?date=${activeDate}`)?.data?.[0] || null);
  const [fastSummary, setFastSummary] = useState(() => getLocalCache('/islamic/fasts/summary')?.data || {
    totalCompleted: 0,
    ramadanCount: 0,
    sunnahCount: 0,
    qadaCount: 0,
    nazrCount: 0,
    breakdown: {},
  });
  const [loading, setLoading] = useState(() => !getLocalCache(`/islamic/salah?date=${activeDate}`));

  // Modals State
  const [isVowModalOpen, setIsVowModalOpen] = useState(false);
  const [editingVowId, setEditingVowId] = useState(null);
  const [vowDescription, setVowDescription] = useState('');
  const [vowTargetDate, setVowTargetDate] = useState('');

  const [isHadithModalOpen, setIsHadithModalOpen] = useState(false);
  const [editingHadithId, setEditingHadithId] = useState(null);
  const [hadithText, setHadithText] = useState('');
  const [hadithNarrator, setHadithNarrator] = useState('');
  const [hadithReference, setHadithReference] = useState('');
  const [hadithReflection, setHadithReflection] = useState('');

  const [isQuranModalOpen, setIsQuranModalOpen] = useState(false);
  const [editingQuranId, setEditingQuranId] = useState(null);
  const [quranSurah, setQuranSurah] = useState('');
  const [quranPages, setQuranPages] = useState('');
  const [quranAyats, setQuranAyats] = useState('');

  const fetchData = useCallback(async (showLoading = true) => {
    const hasCache = getLocalCache(`/islamic/salah?date=${activeDate}`);
    if (showLoading && !hasCache) setLoading(true);

    try {
      const [
        salahRes,
        qadaRes,
        vowsRes,
        hadithRes,
        quranRes,
        adhkarRes,
        fastRes,
        fastSummaryRes,
      ] = await Promise.all([
        api.get(`/islamic/salah?date=${activeDate}`),
        api.get('/islamic/qada'),
        api.get('/islamic/vows'),
        api.get('/islamic/hadith'),
        api.get(`/islamic/quran?date=${activeDate}`),
        api.get(`/islamic/adhkar?date=${activeDate}`),
        api.get(`/islamic/fasts?date=${activeDate}`).catch(() => ({ data: [] })),
        api.get('/islamic/fasts/summary').catch(() => ({ data: null })),
      ]);

      setLocalCache(`/islamic/salah?date=${activeDate}`, salahRes.data || []);
      setLocalCache('/islamic/qada', qadaRes.data || []);
      setLocalCache('/islamic/vows', vowsRes.data || []);
      setLocalCache('/islamic/hadith', hadithRes.data || []);
      setLocalCache(`/islamic/quran?date=${activeDate}`, quranRes.data || []);
      setLocalCache(`/islamic/adhkar?date=${activeDate}`, adhkarRes.data || { morningCompleted: false, eveningCompleted: false });
      if (fastRes.data) setLocalCache(`/islamic/fasts?date=${activeDate}`, fastRes.data);
      if (fastSummaryRes.data) setLocalCache('/islamic/fasts/summary', fastSummaryRes.data);

      setSalahLogs(salahRes.data || []);
      setQadaLogs(qadaRes.data || []);
      setVows(vowsRes.data || []);
      setHadiths(hadithRes.data || []);
      setQuranLogs(quranRes.data || []);
      setAdhkarLog(adhkarRes.data || { morningCompleted: false, eveningCompleted: false });
      setTodayFast(fastRes.data?.[0] || null);
      setFastSummary(
        fastSummaryRes.data || {
          totalCompleted: 0,
          ramadanCount: 0,
          sunnahCount: 0,
          qadaCount: 0,
          nazrCount: 0,
          breakdown: {},
        }
      );
    } catch (err) {
      console.error('Failed to fetch Islamic dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, [activeDate]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Instant 0ms Optimistic Adhkar Toggle
  const handleToggleAdhkar = async (type) => {
    const isMorning = type === 'morning';
    const newVal = isMorning ? !adhkarLog.morningCompleted : !adhkarLog.eveningCompleted;

    setAdhkarLog((prev) => ({
      ...prev,
      morningCompleted: isMorning ? newVal : prev.morningCompleted,
      eveningCompleted: !isMorning ? newVal : prev.eveningCompleted,
    }));

    if (!user) {
      notifyGuestAction('Adhkar', newVal ? 'marked completed' : 'marked incomplete');
      return;
    }

    const payload = {
      date: activeDate,
      morningCompleted: isMorning ? newVal : adhkarLog.morningCompleted,
      eveningCompleted: !isMorning ? newVal : adhkarLog.eveningCompleted,
    };

    try {
      await api.post('/islamic/adhkar', payload);
      notifyStreakUpdate();
      fetchData(false);
    } catch (err) {
      console.error('Failed to toggle adhkar', err);
      fetchData(false);
    }
  };

  // --- Hadiths Handlers ---
  const openCreateHadithModal = () => {
    setEditingHadithId(null);
    setHadithText('');
    setHadithNarrator('');
    setHadithReference('');
    setHadithReflection('');
    setIsHadithModalOpen(true);
  };

  const handleEditHadith = (h) => {
    setEditingHadithId(h._id);
    setHadithText(h.text || '');
    setHadithNarrator(h.narrator || '');
    setHadithReference(h.reference || '');
    setHadithReflection(h.reflection || '');
    setIsHadithModalOpen(true);
  };

  const handleCreateHadith = async (e) => {
    e.preventDefault();
    if (!hadithText.trim()) return;

    const payload = {
      date: activeDate,
      text: hadithText.trim(),
      narrator: hadithNarrator.trim(),
      reference: hadithReference.trim(),
      reflection: hadithReflection.trim(),
    };

    if (!user) {
      const mockHadith = {
        _id: editingHadithId || `guest-hadith-${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
      };
      if (editingHadithId) {
        setHadiths((prev) => prev.map((h) => (h._id === editingHadithId ? mockHadith : h)));
        notifyGuestAction('Hadith bookmark', 'updated');
      } else {
        setHadiths((prev) => [mockHadith, ...prev]);
        notifyGuestAction('Hadith bookmark', 'saved');
      }
      setIsHadithModalOpen(false);
      setEditingHadithId(null);
      setHadithText('');
      setHadithNarrator('');
      setHadithReference('');
      setHadithReflection('');
      return;
    }

    try {
      if (editingHadithId) {
        const res = await api.put(`/islamic/hadith/${editingHadithId}`, payload);
        setIsHadithModalOpen(false);
        setEditingHadithId(null);
        if (res.data) {
          setHadiths((prev) =>
            prev.map((h) => (h._id === editingHadithId ? res.data : h))
          );
        }
        notifyUpdated('Hadith bookmark');
      } else {
        const res = await api.post('/islamic/hadith', payload);
        setIsHadithModalOpen(false);
        if (res.data) setHadiths((prev) => [res.data, ...prev]);
        notifyCreated('Hadith bookmark');
      }
      setHadithText('');
      setHadithNarrator('');
      setHadithReference('');
      setHadithReflection('');
      notifyStreakUpdate();
      fetchData(false);
    } catch (err) {
      console.error('Failed to save Hadith', err);
      notifyError(err, 'Failed to save Hadith');
    }
  };

  const handleDeleteHadith = async (hadithId) => {
    if (!hadithId) return;
    const confirmed = await confirmDelete('Hadith bookmark');
    if (!confirmed) return;

    setHadiths((prev) => prev.filter((h) => h._id !== hadithId));

    if (!user) {
      notifyGuestAction('Hadith bookmark', 'deleted');
      return;
    }

    try {
      await api.delete(`/islamic/hadith/${hadithId}`);
      notifyDeleted('Hadith bookmark');
      fetchData(false);
    } catch (err) {
      console.error('Failed to delete Hadith', err);
      notifyError(err, 'Failed to delete Hadith');
      fetchData(false);
    }
  };

  // --- Vows Handlers ---
  const openCreateVowModal = () => {
    setEditingVowId(null);
    setVowDescription('');
    setVowTargetDate('');
    setIsVowModalOpen(true);
  };

  const handleEditVow = (v) => {
    setEditingVowId(v._id);
    setVowDescription(v.title || v.description || '');
    setVowTargetDate(v.targetDate ? v.targetDate.split('T')[0] : '');
    setIsVowModalOpen(true);
  };

  const handleToggleVow = async (id, currentStatus) => {
    const newCompleted = !currentStatus;
    setVows((prev) =>
      prev.map((v) =>
        v._id === id
          ? {
              ...v,
              status: newCompleted ? 'Completed' : 'Pending',
              isCompleted: newCompleted,
            }
          : v
      )
    );

    if (!user) {
      notifyGuestAction('Vow', newCompleted ? 'fulfilled' : 'marked pending');
      return;
    }

    try {
      await api.put(`/islamic/vows/${id}`, {
        status: newCompleted ? 'Completed' : 'Pending',
        isCompleted: newCompleted,
      });
      showSuccessToast(
        newCompleted ? 'Vow fulfilled! Al-Hamdulillah' : 'Vow marked pending',
        'Vow Status'
      );
      fetchData(false);
    } catch (err) {
      console.error('Failed to toggle vow', err);
      notifyError(err, 'Failed to toggle vow');
      fetchData(false);
    }
  };

  const handleCreateVow = async (e) => {
    e.preventDefault();
    if (!vowDescription.trim()) return;

    const payload = {
      title: vowDescription.trim(),
      description: vowDescription.trim(),
      targetDate: vowTargetDate || undefined,
    };

    if (!user) {
      const mockVow = {
        _id: editingVowId || `guest-vow-${Date.now()}`,
        ...payload,
        status: 'Pending',
        isCompleted: false,
        createdAt: new Date().toISOString(),
      };
      if (editingVowId) {
        setVows((prev) => prev.map((v) => (v._id === editingVowId ? mockVow : v)));
        notifyGuestAction('Vow', 'updated');
      } else {
        setVows((prev) => [mockVow, ...prev]);
        notifyGuestAction('Vow', 'created');
      }
      setIsVowModalOpen(false);
      setEditingVowId(null);
      setVowDescription('');
      setVowTargetDate('');
      return;
    }

    try {
      if (editingVowId) {
        const res = await api.put(`/islamic/vows/${editingVowId}`, payload);
        setIsVowModalOpen(false);
        setEditingVowId(null);
        if (res.data) {
          setVows((prev) =>
            prev.map((v) => (v._id === editingVowId ? res.data : v))
          );
        }
        notifyUpdated('Vow');
      } else {
        const res = await api.post('/islamic/vows', payload);
        setIsVowModalOpen(false);
        if (res.data) setVows((prev) => [res.data, ...prev]);
        notifyCreated('Vow');
      }
      setVowDescription('');
      setVowTargetDate('');
      notifyStreakUpdate();
      fetchData(false);
    } catch (err) {
      console.error('Failed to create vow', err);
      notifyError(err, 'Failed to save vow');
    }
  };

  const handleDeleteVow = async (vowId) => {
    if (!vowId) return;
    const confirmed = await confirmDelete('Vow');
    if (!confirmed) return;

    setVows((prev) => prev.filter((v) => v._id !== vowId));

    if (!user) {
      notifyGuestAction('Vow', 'deleted');
      return;
    }

    try {
      await api.delete(`/islamic/vows/${vowId}`);
      notifyDeleted('Vow');
      fetchData(false);
    } catch (err) {
      console.error('Failed to delete vow', err);
      notifyError(err, 'Failed to delete vow');
      fetchData(false);
    }
  };

  // --- Quran Handlers ---
  const openCreateQuranModal = () => {
    setEditingQuranId(null);
    setQuranSurah('');
    setQuranPages('');
    setQuranAyats('');
    setIsQuranModalOpen(true);
  };

  const handleEditQuran = (q) => {
    setEditingQuranId(q._id);
    setQuranSurah(q.surahName || '');
    setQuranPages(q.pagesRead ?? '');
    setQuranAyats(q.ayatsRead ? q.ayatsRead.toString() : '');
    setIsQuranModalOpen(true);
  };

  const handleLogQuran = async (e) => {
    e.preventDefault();

    const payload = {
      date: activeDate,
      surahName: quranSurah.trim(),
      pagesRead: Number(quranPages) || 1,
      ayatsRead: quranAyats ? Number(quranAyats) : undefined,
    };

    if (!user) {
      const mockQuran = {
        _id: editingQuranId || `guest-quran-${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
      };
      if (editingQuranId) {
        setQuranLogs((prev) => prev.map((q) => (q._id === editingQuranId ? mockQuran : q)));
        notifyGuestAction('Quran reading', 'updated');
      } else {
        setQuranLogs((prev) => [mockQuran, ...prev]);
        notifyGuestAction('Quran reading', 'logged');
      }
      setIsQuranModalOpen(false);
      setEditingQuranId(null);
      setQuranSurah('');
      setQuranPages('');
      setQuranAyats('');
      return;
    }

    try {
      if (editingQuranId) {
        const res = await api.put(`/islamic/quran/${editingQuranId}`, payload);
        setIsQuranModalOpen(false);
        setEditingQuranId(null);
        if (res.data) {
          setQuranLogs((prev) =>
            prev.map((q) => (q._id === editingQuranId ? res.data : q))
          );
        }
        notifyUpdated('Quran reading');
      } else {
        const res = await api.post('/islamic/quran', payload);
        setIsQuranModalOpen(false);
        if (res.data) setQuranLogs((prev) => [res.data, ...prev]);
        notifyCreated('Quran reading');
      }
      setQuranSurah('');
      setQuranPages('');
      setQuranAyats('');
      notifyStreakUpdate();
      fetchData(false);
    } catch (err) {
      console.error('Failed to log Quran', err);
      notifyError(err, 'Failed to save Quran reading');
    }
  };

  const handleDeleteQuran = async (quranId) => {
    if (!quranId) return;
    const confirmed = await confirmDelete('Quran reading');
    if (!confirmed) return;

    setQuranLogs((prev) => prev.filter((q) => q._id !== quranId));

    if (!user) {
      notifyGuestAction('Quran reading', 'deleted');
      return;
    }

    try {
      await api.delete(`/islamic/quran/${quranId}`);
      notifyDeleted('Quran reading');
      fetchData(false);
    } catch (err) {
      console.error('Failed to delete Quran log', err);
      notifyError(err, 'Failed to delete Quran reading');
      fetchData(false);
    }
  };


  // Aggregated calculations
  const totalQadaOwed = qadaLogs.reduce((sum, q) => sum + (q.totalOwed || 0), 0);
  const totalQadaMadeUp = qadaLogs.reduce((sum, q) => sum + (q.totalCompleted || 0), 0);
  const totalQadaRemaining = Math.max(0, totalQadaOwed - totalQadaMadeUp);

  const completedSalahToday = salahLogs.filter(
    (l) => l.status && l.status !== 'missed' && l.status !== 'unlogged'
  ).length;

  const totalQuranPagesToday = quranLogs.reduce((sum, q) => sum + (Number(q.pagesRead) || 0), 0);
  const totalQuranAyatsToday = quranLogs.reduce((sum, q) => sum + (Number(q.ayatsRead) || 0), 0);

  if (loading) {
    return <LoadingScreen fullScreen={false} message="Loading Islamic & Deen Hub..." />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Refined Spiritual Hub Page Header */}
      <PageHeader
        category={t('categories.spiritual', 'Spiritual Hub')}
        title={t('islamic.title', 'Islamic & Deen Hub')}
        description={`${t('islamic.subtitle', 'Daily Adhkar, Tasbih counter, Quran recitation goals, prophetic hadith studies, and vows.')} (${formatDisplayDate(activeDate)})`}
        action={
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <Button
              variant="secondary"
              size="md"
              icon={Compass}
              onClick={() => navigate('/qada-matrix')}
            >
              Salah & Qada
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={Moon}
              onClick={() => navigate('/islamic-fasting')}
            >
              Fasting
            </Button>
            <Button
              variant="gradient"
              size="md"
              icon={Plus}
              onClick={() => setIsQuranModalOpen(true)}
            >
              {t('islamic.quranProgress', 'Log Quran')}
            </Button>
          </div>
        }
      />

      {/* Top Bento KPI Overview / Quick Jump Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title={t('islamic.completedToday', 'Salah Today')}
          value={`${completedSalahToday} / 5 Done`}
          subtitle={completedSalahToday === 5 ? 'All 5 prayers completed ✨' : `${5 - completedSalahToday} remaining · Matrix →`}
          icon={CheckCircle2}
          color="emerald"
          onClick={() => navigate('/qada-matrix')}
        />
        <StatCard
          title={t('islamic.fastingStatus', 'Fasting (Sawm)')}
          value={
            todayFast?.status === 'completed'
              ? 'Completed ✨'
              : todayFast?.status === 'fasting'
              ? 'Fasting Today 🌙'
              : 'Not Fasting'
          }
          subtitle={`${fastSummary.totalCompleted || 0} Total Fasts Kept · Fasting Suite →`}
          icon={Moon}
          color="amber"
          onClick={() => navigate('/islamic-fasting')}
        />
        <StatCard
          title={t('islamic.totalQadaMadeUp', 'Qada Recovery')}
          value={`${totalQadaMadeUp} Made Up`}
          subtitle={totalQadaOwed > 0 ? `${totalQadaRemaining} remaining · Manage Debt →` : 'Manage Lifetime Debt →'}
          icon={RotateCcw}
          color="indigo"
          onClick={() => navigate('/qada-matrix')}
        />
        <StatCard
          title={t('islamic.quranProgress', 'Quran Reading')}
          value={`${totalQuranPagesToday} Pages Today`}
          subtitle={totalQuranAyatsToday > 0 ? `${totalQuranAyatsToday} ayats · ${quranLogs.length} logs` : `${quranLogs.length} recitation sessions`}
          icon={BookOpen}
          color="purple"
          onClick={openCreateQuranModal}
        />
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: DAILY ADHKAR & DIGITAL TASBIH COUNTER                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7">
        {/* Left 5-Cols: Daily Morning & Evening Adhkar */}
        <div className="lg:col-span-5 flex flex-col">
          <Card
            hover
            className="flex-1 flex flex-col"
            title={t('islamic.dailyAdhkar', 'Daily Adhkar & Remembrance')}
            subtitle={t('islamic.dailyAdhkarSubtitle', 'Morning & evening prophetic dhikr routines.')}
            icon={Sparkles}
            badge={
              <Badge
                variant={
                  adhkarLog.morningCompleted && adhkarLog.eveningCompleted
                    ? 'success'
                    : adhkarLog.morningCompleted || adhkarLog.eveningCompleted
                    ? 'amber'
                    : 'neutral'
                }
                size="xs"
              >
                {(adhkarLog.morningCompleted ? 1 : 0) + (adhkarLog.eveningCompleted ? 1 : 0)}/2 Completed
              </Badge>
            }
          >
            <div className="flex flex-col flex-1 space-y-3.5 pt-1">
              {/* Daily Progress Completion Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-secondary">
                  <span>Daily Routine Completion</span>
                  <span className="text-primary font-bold">
                    {Math.round(((adhkarLog.morningCompleted ? 1 : 0) + (adhkarLog.eveningCompleted ? 1 : 0)) * 50)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-subtle rounded-full overflow-hidden flex gap-1 p-0.5 border border-theme/40">
                  <div
                    className={`h-full flex-1 rounded-full transition-all duration-300 ${
                      adhkarLog.morningCompleted
                        ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50'
                        : 'bg-transparent'
                    }`}
                  />
                  <div
                    className={`h-full flex-1 rounded-full transition-all duration-300 ${
                      adhkarLog.eveningCompleted
                        ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50'
                        : 'bg-transparent'
                    }`}
                  />
                </div>
              </div>

              {/* Morning Adhkar Card */}
              <div
                onClick={() => handleToggleAdhkar('morning')}
                className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                  adhkarLog.morningCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-500/5'
                    : 'bg-subtle/70 border-theme text-secondary hover:text-primary hover:bg-surface hover:border-theme-strong'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    adhkarLog.morningCompleted
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'bg-amber-500/15 text-amber-500'
                  }`}>
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm block text-primary tracking-tight">
                      {t('islamic.morningAdhkar', 'Morning Adhkar')}
                    </span>
                    <span className="text-[11px] text-secondary font-medium">
                      {t('islamic.afterFajr', 'After Fajr until Sunrise')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      adhkarLog.morningCompleted
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-surface border border-theme text-secondary'
                    }`}
                  >
                    {adhkarLog.morningCompleted ? 'Completed' : 'Pending'}
                  </span>
                  <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                    adhkarLog.morningCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                      : 'border-theme bg-surface text-transparent group-hover:border-emerald-500/50'
                  }`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Evening Adhkar Card */}
              <div
                onClick={() => handleToggleAdhkar('evening')}
                className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                  adhkarLog.eveningCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-500/5'
                    : 'bg-subtle/70 border-theme text-secondary hover:text-primary hover:bg-surface hover:border-theme-strong'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    adhkarLog.eveningCompleted
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'bg-indigo-500/15 text-indigo-400'
                  }`}>
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm block text-primary tracking-tight">
                      {t('islamic.eveningAdhkar', 'Evening Adhkar')}
                    </span>
                    <span className="text-[11px] text-secondary font-medium">
                      {t('islamic.afterAsr', 'After Asr / Maghrib')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      adhkarLog.eveningCompleted
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-surface border border-theme text-secondary'
                    }`}
                  >
                    {adhkarLog.eveningCompleted ? 'Completed' : 'Pending'}
                  </span>
                  <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                    adhkarLog.eveningCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                      : 'border-theme bg-surface text-transparent group-hover:border-emerald-500/50'
                  }`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Consistency Wisdom Prompt Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-subtle/40 to-teal-500/5 border border-emerald-500/20 text-xs text-secondary font-medium flex items-start gap-2.5 mt-auto">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="italic text-primary font-medium leading-relaxed">
                    "Keep your tongue moist with the remembrance of Allah."
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    — Sunan at-Tirmidhi (1375)
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right 7-Cols: Digital Tasbih & Adhkar Interactive Counter */}
        <div className="lg:col-span-7 flex flex-col">
          <AdhkarCounter />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: 3-IN-A-ROW SPIRITUAL PRACTICE HUB                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
        {/* 1. Quran Reading Goal Card */}
        <Card
          hover
          title={t('islamic.quranProgress', 'Quran Reading Goal')}
          subtitle={t('islamic.quranProgressSubtitle', 'Recitation logs for today')}
          icon={BookOpen}
          badge={
            <Badge variant="purple" size="xs">
              {totalQuranPagesToday}p today
            </Badge>
          }
          action={
            <Button variant="ghost" size="xs" onClick={openCreateQuranModal}>
              + {t('common.add', 'Add')}
            </Button>
          }
        >
          {quranLogs.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center min-h-[190px]">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-2.5 shadow-xs">
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="text-xs text-secondary font-medium">
                No Quran recitation logged for this date.
              </p>
              <Button
                variant="ghost"
                size="xs"
                className="mt-2.5 text-accent"
                onClick={openCreateQuranModal}
              >
                + Log First Recitation
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 min-h-[190px]">
              {quranLogs.map((q) => (
                <div
                  key={q._id}
                  className="p-3 rounded-xl bg-subtle border border-theme flex items-center justify-between gap-2.5 hover:border-theme-strong transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-primary block truncate">
                      {q.surahName ? `Surah ${q.surahName}` : 'Recitation Session'}
                    </span>
                    <span className="text-[11px] text-secondary block truncate mt-0.5">
                      {q.pagesRead} {q.pagesRead === 1 ? 'page' : 'pages'} {q.ayatsRead ? `· ${q.ayatsRead} ayats` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="purple" size="xs">
                      {q.pagesRead}p
                    </Badge>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleEditQuran(q)}
                        className="p-1 rounded-lg text-secondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                        title="Edit Quran Log"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuran(q._id)}
                        className="p-1 rounded-lg text-secondary hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Quran Log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 2. Hadith Study & Reflections Card */}
        <Card
          hover
          title={t('islamic.hadithReflections', 'Hadith Study & Reflections')}
          subtitle={t('islamic.hadithReflectionsSubtitle', 'Record & reflect on wisdom')}
          icon={Quote}
          badge={
            <Badge variant="primary" size="xs">
              {hadiths.length} recorded
            </Badge>
          }
          action={
            <Button variant="ghost" size="xs" onClick={openCreateHadithModal}>
              + {t('common.add', 'Add')}
            </Button>
          }
        >
          {hadiths.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center min-h-[190px]">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2.5 shadow-xs">
                <Quote className="w-6 h-6" />
              </div>
              <p className="text-xs text-secondary font-medium">
                {t('islamic.noHadithRecorded', 'No Hadiths recorded yet')}
              </p>
              <Button
                variant="ghost"
                size="xs"
                className="mt-2.5 text-accent"
                onClick={openCreateHadithModal}
              >
                + {t('islamic.logFirstHadith', 'Log First Hadith')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 min-h-[190px]">
              {hadiths.map((h) => (
                <div
                  key={h._id}
                  className="p-3 rounded-xl bg-subtle border border-theme flex flex-col justify-between space-y-2 hover:border-theme-strong transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      {h.narrator ? (
                        <span className="text-[10px] font-bold text-accent truncate">
                          {h.narrator}
                        </span>
                      ) : (
                        <span />
                      )}
                      {h.reference && (
                        <Badge variant="neutral" size="xs">
                          {h.reference}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-primary font-medium italic line-clamp-2">
                      "{h.text}"
                    </p>
                    {h.reflection && (
                      <p className="text-[11px] text-secondary mt-1 bg-surface p-1.5 rounded-lg border border-theme/60 line-clamp-1">
                        {h.reflection}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1 pt-1 border-t border-theme/40">
                    <button
                      onClick={() => handleEditHadith(h)}
                      className="p-1 rounded-lg text-secondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                      title={t('common.edit', 'Edit')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteHadith(h._id)}
                      className="p-1 rounded-lg text-secondary hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title={t('common.delete', 'Delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 3. Spiritual Vows & Commitments Card (Nazr) */}
        <Card
          hover
          title={t('islamic.spiritualVows', 'Spiritual Vows & Commitments')}
          subtitle={t('islamic.spiritualVowsSubtitle', 'Active promises and obligations')}
          icon={ShieldCheck}
          badge={
            <Badge variant="amber" size="xs">
              {vows.filter((v) => v.status !== 'Completed' && !v.isCompleted).length} active
            </Badge>
          }
          action={
            <Button variant="ghost" size="xs" onClick={openCreateVowModal}>
              + {t('common.add', 'Add')}
            </Button>
          }
        >
          {vows.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center min-h-[190px]">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-2.5 shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <p className="text-xs text-secondary font-medium">
                {t('islamic.noVowsRecorded', 'No spiritual vows recorded')}
              </p>
              <Button
                variant="ghost"
                size="xs"
                className="mt-2.5 text-accent"
                onClick={openCreateVowModal}
              >
                + {t('islamic.createVow', 'Create Vow')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 min-h-[190px]">
              {vows.map((v) => (
                <div
                  key={v._id}
                  className="p-3 rounded-xl bg-subtle border border-theme flex items-center justify-between gap-2.5 hover:border-theme-strong transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={v.status === 'Completed' || v.isCompleted}
                      onChange={() => handleToggleVow(v._id, v.status === 'Completed' || v.isCompleted)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span
                        className={`text-xs font-bold block truncate ${
                          v.status === 'Completed' || v.isCompleted
                            ? 'line-through text-muted'
                            : 'text-primary'
                        }`}
                      >
                        {v.title || v.description}
                      </span>
                      {v.targetDate && (
                        <span className="text-[10px] text-secondary block truncate mt-0.5">
                          {t('common.target', 'Target')}: {formatDisplayDate(v.targetDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => handleEditVow(v)}
                      className="p-1 rounded-lg text-secondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                      title={t('common.edit', 'Edit')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteVow(v._id)}
                      className="p-1 rounded-lg text-secondary hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title={t('common.delete', 'Delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* MODALS SECTION                                                           */}
      {/* ========================================================================= */}

      {/* Hadith Modal */}
      <Modal
        isOpen={isHadithModalOpen}
        onClose={() => setIsHadithModalOpen(false)}
        title={editingHadithId ? t('islamic.editHadith', 'Edit Hadith & Reflection') : t('islamic.logHadith', 'Log Hadith & Reflection')}
        subtitle={editingHadithId ? t('islamic.editHadithSubtitle', 'Update prophetic wisdom and personal reflections') : t('islamic.logHadithSubtitle', 'Record wisdom from the Sunnah')}
      >
        <form onSubmit={handleCreateHadith} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              {t('islamic.hadithText', 'Hadith Text')}
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. 'Actions are by intentions, and every person will get what he intended...'"
              value={hadithText}
              onChange={(e) => setHadithText(e.target.value)}
              className="textarea-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                {t('islamic.narrator', 'Narrator (Optional)')}
              </label>
              <input
                type="text"
                placeholder="e.g. Umar ibn Al-Khattab (RA)"
                value={hadithNarrator}
                onChange={(e) => setHadithNarrator(e.target.value)}
                className="input-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                {t('islamic.bookReference', 'Book / Reference (Optional)')}
              </label>
              <input
                type="text"
                placeholder="e.g. Sahih Al-Bukhari #1"
                value={hadithReference}
                onChange={(e) => setHadithReference(e.target.value)}
                className="input-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              {t('islamic.personalReflection', 'Personal Reflection & Application')}
            </label>
            <textarea
              rows={2}
              placeholder="How can you apply this principle in your daily routines?"
              value={hadithReflection}
              onChange={(e) => setHadithReflection(e.target.value)}
              className="textarea-base"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsHadithModalOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary">
              {t('islamic.saveHadith', 'Save Hadith')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Vow Modal */}
      <Modal
        isOpen={isVowModalOpen}
        onClose={() => setIsVowModalOpen(false)}
        title={t('islamic.recordVow', 'Record Spiritual Vow')}
        subtitle={t('islamic.vowSubtitle', 'Personal commitment or intention')}
      >
        <form onSubmit={handleCreateVow} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              {t('islamic.vowDesc', 'Vow Description / Resolution')}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Fast every Monday, Read Surah Al-Kahf every Friday"
              value={vowDescription}
              onChange={(e) => setVowDescription(e.target.value)}
              className="input-base"
            />
          </div>

          <DateInput
            label={t('islamic.vowTargetDate', 'Target Completion Date')}
            value={vowTargetDate}
            onChange={setVowTargetDate}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsVowModalOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary">
              {editingVowId ? t('islamic.updateVow', 'Update Vow') : t('islamic.saveVow', 'Save Vow')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quran Modal */}
      <Modal
        isOpen={isQuranModalOpen}
        onClose={() => setIsQuranModalOpen(false)}
        title={editingQuranId ? t('islamic.editQuran', 'Edit Quran Recitation') : t('islamic.logQuran', 'Log Quran Recitation')}
        subtitle={
          editingQuranId
            ? t('islamic.editQuranSubtitle', 'Update recitation pages and surah')
            : `${t('islamic.logQuranSubtitle', 'Record recitation for')} ${formatDisplayDate(activeDate)}`
        }
      >
        <form onSubmit={handleLogQuran} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              {t('islamic.surahName', 'Surah Name (Optional)')}
            </label>
            <input
              type="text"
              placeholder="e.g. Al-Baqarah, Yaseen, Al-Mulk"
              value={quranSurah}
              onChange={(e) => setQuranSurah(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                {t('islamic.pagesRead', 'Pages Read')}
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                required
                value={quranPages}
                onChange={(e) => setQuranPages(e.target.value)}
                placeholder="e.g. 5"
                className="input-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                {t('islamic.ayatsRead', 'Ayats Read (Optional)')}
              </label>
              <input
                type="number"
                placeholder="e.g. 50"
                value={quranAyats}
                onChange={(e) => setQuranAyats(e.target.value)}
                className="input-base"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsQuranModalOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary">
              {editingQuranId
                ? t('islamic.updateRecitation', 'Update Recitation')
                : t('islamic.saveRecitation', 'Save Recitation')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default IslamicTracker;
