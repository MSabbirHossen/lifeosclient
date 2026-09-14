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
import { AdhkarCounter } from '../components/AdhkarCounter';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  CheckCircle2,
  Clock,
  BookOpen,
  Plus,
  Minus,
  Trash2,
  Edit2,
  Sparkles,
  Sun,
  Moon,
  Heart,
  ShieldCheck,
  RotateCcw,
  Quote,
  ArrowRight,
} from 'lucide-react';

const SALAH_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const SALAH_STATUSES = [
  { label: 'On Time', value: 'onTime', variant: 'success' },
  { label: "Jama'ah", value: 'jamaah', variant: 'primary' },
  { label: 'Late', value: 'late', variant: 'warning' },
  { label: 'Missed', value: 'missed', variant: 'danger' },
  { label: 'Qada', value: 'qada', variant: 'purple' },
];

export const IslamicTracker = ({ selectedDate }) => {
  const navigate = useNavigate();
  const activeDate = selectedDate || getFormattedDate();

  const [salahLogs, setSalahLogs] = useState([]);
  const [salahSummary, setSalahSummary] = useState({ expected: 5, completed: 0, remaining: 5 });
  const [qadaLogs, setQadaLogs] = useState([]);
  const [vows, setVows] = useState([]);
  const [hadiths, setHadiths] = useState([]);
  const [quranLogs, setQuranLogs] = useState([]);
  const [adhkarLog, setAdhkarLog] = useState({ morningCompleted: false, eveningCompleted: false });
  const [loading, setLoading] = useState(true);

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

  const [deleteHadithId, setDeleteHadithId] = useState(null);
  const [deleteVowId, setDeleteVowId] = useState(null);
  const [deleteQuranId, setDeleteQuranId] = useState(null);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [salahRes, summaryRes, qadaRes, vowsRes, hadithRes, quranRes, adhkarRes] =
        await Promise.all([
          api.get(`/islamic/salah?date=${activeDate}`),
          api.get(`/islamic/salah/summary?date=${activeDate}`),
          api.get('/islamic/qada'),
          api.get('/islamic/vows'),
          api.get('/islamic/hadith'),
          api.get(`/islamic/quran?date=${activeDate}`),
          api.get(`/islamic/adhkar?date=${activeDate}`),
        ]);
      setSalahLogs(salahRes.data || []);
      setSalahSummary(summaryRes.data || { expected: 5, completed: 0, remaining: 5 });
      setQadaLogs(qadaRes.data || []);
      setVows(vowsRes.data || []);
      setHadiths(hadithRes.data || []);
      setQuranLogs(quranRes.data || []);
      setAdhkarLog(adhkarRes.data || { morningCompleted: false, eveningCompleted: false });
    } catch (err) {
      console.error('Failed to fetch Islamic data', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [activeDate]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Instant 0ms Optimistic Salah Status Update
  const handleUpdateSalah = async (prayerName, status) => {
    // Optimistically update local state immediately
    setSalahLogs((prev) => {
      const exists = prev.some((l) => (l.prayerName || l.salah) === prayerName);
      if (exists) {
        return prev.map((l) =>
          (l.prayerName || l.salah) === prayerName ? { ...l, status } : l
        );
      }
      return [...prev, { prayerName, salah: prayerName, status, date: activeDate }];
    });

    try {
      await api.post('/islamic/salah', {
        date: activeDate,
        prayerName,
        salah: prayerName,
        status,
      });
      fetchData(false);
    } catch (err) {
      console.error('Failed to update salah log', err);
      fetchData(false);
    }
  };

  // Instant 0ms Optimistic Qada Make-up Increment
  const handleIncrementQada = async (prayerName, delta) => {
    setQadaLogs((prev) =>
      prev.map((q) =>
        q.prayerName === prayerName
          ? { ...q, totalCompleted: Math.max(0, (q.totalCompleted || 0) + delta) }
          : q
      )
    );

    try {
      await api.post('/islamic/qada', {
        prayerName,
        incrementCompleted: delta,
      });
      fetchData(false);
    } catch (err) {
      console.error('Failed to update Qada', err);
      fetchData(false);
    }
  };

  // Instant 0ms Optimistic Adhkar Toggle
  const handleToggleAdhkar = async (type) => {
    const isMorning = type === 'morning';
    const newVal = isMorning ? !adhkarLog.morningCompleted : !adhkarLog.eveningCompleted;

    setAdhkarLog((prev) => ({
      ...prev,
      morningCompleted: isMorning ? newVal : prev.morningCompleted,
      eveningCompleted: !isMorning ? newVal : prev.eveningCompleted,
    }));

    const payload = {
      date: activeDate,
      morningCompleted: isMorning ? newVal : adhkarLog.morningCompleted,
      eveningCompleted: !isMorning ? newVal : adhkarLog.eveningCompleted,
    };

    try {
      await api.post('/islamic/adhkar', payload);
      fetchData(false);
    } catch (err) {
      console.error('Failed to toggle adhkar', err);
      fetchData(false);
    }
  };

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

    try {
      const payload = {
        date: activeDate,
        text: hadithText.trim(),
        narrator: hadithNarrator.trim(),
        reference: hadithReference.trim(),
        reflection: hadithReflection.trim(),
      };

      if (editingHadithId) {
        const res = await api.put(`/islamic/hadith/${editingHadithId}`, payload);
        setIsHadithModalOpen(false);
        setEditingHadithId(null);
        if (res.data) {
          setHadiths((prev) =>
            prev.map((h) => (h._id === editingHadithId ? res.data : h))
          );
        }
      } else {
        const res = await api.post('/islamic/hadith', payload);
        setIsHadithModalOpen(false);
        if (res.data) setHadiths((prev) => [res.data, ...prev]);
      }
      setHadithText('');
      setHadithNarrator('');
      setHadithReference('');
      setHadithReflection('');
      fetchData(false);
    } catch (err) {
      console.error('Failed to log hadith', err);
    }
  };

  const handleDeleteHadith = async () => {
    if (!deleteHadithId) return;
    const targetId = deleteHadithId;
    setDeleteHadithId(null);
    setHadiths((prev) => prev.filter((h) => h._id !== targetId));

    try {
      await api.delete(`/islamic/hadith/${targetId}`);
      fetchData(false);
    } catch (err) {
      console.error('Failed to delete hadith', err);
      fetchData(false);
    }
  };

  const openCreateVowModal = () => {
    setEditingVowId(null);
    setVowDescription('');
    setVowTargetDate('');
    setIsVowModalOpen(true);
  };

  const handleEditVow = (v) => {
    setEditingVowId(v._id);
    setVowDescription(v.title || v.description || '');
    setVowTargetDate(v.targetDate || '');
    setIsVowModalOpen(true);
  };

  const handleCreateVow = async (e) => {
    e.preventDefault();
    if (!vowDescription.trim()) return;

    try {
      if (editingVowId) {
        const res = await api.put(`/islamic/vows/${editingVowId}`, {
          title: vowDescription.trim(),
          targetDate: vowTargetDate || undefined,
        });
        setIsVowModalOpen(false);
        setEditingVowId(null);
        if (res.data) {
          setVows((prev) =>
            prev.map((v) => (v._id === editingVowId ? res.data : v))
          );
        }
      } else {
        const res = await api.post('/islamic/vows', {
          description: vowDescription.trim(),
          targetDate: vowTargetDate || undefined,
        });
        setIsVowModalOpen(false);
        if (res.data) setVows((prev) => [res.data, ...prev]);
      }
      setVowDescription('');
      setVowTargetDate('');
      fetchData(false);
    } catch (err) {
      console.error('Failed to save vow', err);
    }
  };

  const handleToggleVow = async (id, isCompleted) => {
    setVows((prev) =>
      prev.map((v) =>
        v._id === id ? { ...v, status: !isCompleted ? 'Completed' : 'Active', isCompleted: !isCompleted } : v
      )
    );

    try {
      await api.put(`/islamic/vows/${id}`, { isCompleted: !isCompleted });
      fetchData(false);
    } catch (err) {
      console.error('Failed to update vow', err);
      fetchData(false);
    }
  };

  const handleDeleteVow = async () => {
    if (!deleteVowId) return;
    const targetId = deleteVowId;
    setDeleteVowId(null);
    setVows((prev) => prev.filter((v) => v._id !== targetId));

    try {
      await api.delete(`/islamic/vows/${targetId}`);
      fetchData(false);
    } catch (err) {
      console.error('Failed to delete vow', err);
      fetchData(false);
    }
  };

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
    try {
      const payload = {
        date: activeDate,
        surahName: quranSurah.trim(),
        pagesRead: Number(quranPages) || 1,
        ayatsRead: quranAyats ? Number(quranAyats) : undefined,
      };

      if (editingQuranId) {
        const res = await api.put(`/islamic/quran/${editingQuranId}`, payload);
        setIsQuranModalOpen(false);
        setEditingQuranId(null);
        if (res.data) {
          setQuranLogs((prev) =>
            prev.map((q) => (q._id === editingQuranId ? res.data : q))
          );
        }
      } else {
        const res = await api.post('/islamic/quran', payload);
        setIsQuranModalOpen(false);
        if (res.data) setQuranLogs((prev) => [res.data, ...prev]);
      }
      setQuranSurah('');
      setQuranPages('');
      setQuranAyats('');
      fetchData(false);
    } catch (err) {
      console.error('Failed to log Quran', err);
    }
  };

  const handleDeleteQuran = async () => {
    if (!deleteQuranId) return;
    const targetId = deleteQuranId;
    setDeleteQuranId(null);
    setQuranLogs((prev) => prev.filter((q) => q._id !== targetId));

    try {
      await api.delete(`/islamic/quran/${targetId}`);
      fetchData(false);
    } catch (err) {
      console.error('Failed to delete Quran log', err);
      fetchData(false);
    }
  };

  const totalQadaMadeUp = qadaLogs.reduce((sum, q) => sum + (q.totalCompleted || 0), 0);
  const completedSalahToday = salahLogs.filter(
    (l) => l.status && l.status !== 'missed' && l.status !== 'unlogged'
  ).length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        category="Spiritual Life & Deen"
        title="Islamic Practice & Qada Tracker"
        description={`Track daily 5 Salah prayers, make up missed (Qada) prayers, record Hadiths, and fulfill spiritual vows for ${formatDisplayDate(activeDate)}`}
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="secondary"
              size="md"
              icon={Compass}
              onClick={() => navigate('/qada-matrix')}
            >
              Full Qada Matrix
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={Quote}
              onClick={() => setIsHadithModalOpen(true)}
            >
              Log Hadith
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={ShieldCheck}
              onClick={() => setIsVowModalOpen(true)}
            >
              New Vow
            </Button>
            <Button
              variant="gradient"
              size="md"
              icon={Plus}
              onClick={() => setIsQuranModalOpen(true)}
            >
              Log Quran
            </Button>
          </div>
        }
      />

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard
          title="Completed Today"
          value={`${completedSalahToday} / 5`}
          subtitle="Non-missed prayer count"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Total Qada Made Up"
          value={`${totalQadaMadeUp} Prayers`}
          subtitle="Historical missed prayers recovered"
          icon={RotateCcw}
          color="indigo"
        />
        <StatCard
          title="Active Commitments"
          value={vows.filter((v) => v.status !== 'Completed' && !v.isCompleted).length}
          subtitle="Spiritual vows & promises"
          icon={ShieldCheck}
          color="purple"
        />
      </div>

      {/* Interactive 5 Daily Salah Grid */}
      <Card title="Daily 5 Salah Prayers" subtitle="Click status button to instantly toggle and save" icon={Compass}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5 mt-2">
          {SALAH_NAMES.map((prayerName) => {
            const currentLog = salahLogs.find((l) => (l.prayerName || l.salah) === prayerName);
            const currentStatus = currentLog?.status || 'unlogged';

            return (
              <div
                key={prayerName}
                className="p-4 rounded-2xl bg-subtle border border-theme flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-primary tracking-tight">{prayerName}</span>
                  {currentStatus !== 'unlogged' && (
                    <Badge
                      variant={
                        SALAH_STATUSES.find((s) => s.value === currentStatus)?.variant || 'neutral'
                      }
                      size="xs"
                    >
                      {SALAH_STATUSES.find((s) => s.value === currentStatus)?.label}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {SALAH_STATUSES.map((st) => {
                    const isSelected = currentStatus === st.value;
                    return (
                      <button
                        key={st.value}
                        type="button"
                        onClick={() => handleUpdateSalah(prayerName, st.value)}
                        className={`py-1.5 px-1.5 text-[10px] font-bold rounded-lg transition-all duration-150 cursor-pointer border ${
                          isSelected
                            ? 'bg-accent text-white border-accent shadow-sm scale-102'
                            : 'bg-surface text-secondary border-theme hover:text-primary hover:bg-subtle'
                        }`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Missing / Qada Prayer Make-up Section */}
      <Card
        hover
        title="Qada (Missing Prayer) Make-Up Tracker"
        subtitle="Track and recover historical missed prayers across all 5 daily prayers"
        icon={RotateCcw}
      >
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5 mt-2">
          {SALAH_NAMES.map((prayerName) => {
            const record = qadaLogs.find((q) => q.prayerName === prayerName) || {
              prayerName,
              totalOwed: 0,
              totalCompleted: 0,
            };

            return (
              <div
                key={prayerName}
                className="p-4 rounded-2xl bg-subtle border border-theme flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-primary">{prayerName}</span>
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    {record.totalCompleted} done
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => handleIncrementQada(prayerName, -1)}
                    disabled={record.totalCompleted <= 0}
                    className="p-1.5 rounded-lg bg-surface text-secondary hover:text-primary border border-theme disabled:opacity-30 cursor-pointer"
                    title="Decrement 1"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <Button
                    variant="primary"
                    size="xs"
                    icon={Plus}
                    onClick={() => handleIncrementQada(prayerName, 1)}
                  >
                    +1 Make-up
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Hadith Log & Adhkar 2-Col Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-7">
        {/* Daily Adhkar Card */}
        <Card hover title="Daily Adhkar & Remembrance" subtitle="Morning and evening dhikr" icon={Sparkles}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2">
            <div
              onClick={() => handleToggleAdhkar('morning')}
              className={`p-4 rounded-2xl border transition-all duration-150 cursor-pointer flex items-center justify-between ${
                adhkarLog.morningCompleted
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-subtle border-theme text-secondary hover:text-primary'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 text-amber-500" />
                <div>
                  <span className="font-bold text-xs block text-primary">Morning Adhkar</span>
                  <span className="text-[10px] text-secondary">After Fajr</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={adhkarLog.morningCompleted || false}
                readOnly
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div
              onClick={() => handleToggleAdhkar('evening')}
              className={`p-4 rounded-2xl border transition-all duration-150 cursor-pointer flex items-center justify-between ${
                adhkarLog.eveningCompleted
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-subtle border-theme text-secondary hover:text-primary'
              }`}
            >
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-indigo-400" />
                <div>
                  <span className="font-bold text-xs block text-primary">Evening Adhkar</span>
                  <span className="text-[10px] text-secondary">After Asr / Maghrib</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={adhkarLog.eveningCompleted || false}
                readOnly
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </Card>

        {/* Quran Recitation Log */}
        <Card
          hover
          title="Quran Progress"
          subtitle="Recitation logs for today"
          icon={BookOpen}
          action={
            <Button variant="ghost" size="xs" onClick={openCreateQuranModal}>
              + Log Quran
            </Button>
          }
        >
          {quranLogs.length === 0 ? (
            <p className="text-xs text-secondary italic py-4">No Quran recitation logged for this date.</p>
          ) : (
            <div className="space-y-2.5 mt-2">
              {quranLogs.map((q) => (
                <div
                  key={q._id}
                  className="p-3 rounded-xl bg-subtle border border-theme flex items-center justify-between gap-2"
                >
                  <div>
                    <span className="text-xs font-bold text-primary block">
                      {q.surahName ? `Surah ${q.surahName}` : 'Recitation'}
                    </span>
                    <span className="text-[11px] text-secondary">
                      {q.pagesRead} pages {q.ayatsRead ? `· ${q.ayatsRead} ayats` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="purple" size="xs">
                      {q.pagesRead} Pages
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
                        onClick={() => setDeleteQuranId(q._id)}
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
      </div>

      {/* Digital Tasbih & Adhkar Interactive Counter */}
      <AdhkarCounter />

      {/* Hadith Logger & Reflection Archive */}
      <Card
        hover
        title="Hadith Study & Reflections"
        subtitle="Record and reflect on prophetic wisdom"
        icon={Quote}
        action={
          <Button variant="outline" size="sm" icon={Plus} onClick={openCreateHadithModal}>
            Log Hadith
          </Button>
        }
      >
        {hadiths.length === 0 ? (
          <EmptyState
            icon={Quote}
            title="No Hadiths recorded yet"
            description="Log your daily Hadith reading and personal reflections."
            actionText="Log First Hadith"
            onAction={() => setIsHadithModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {hadiths.map((h) => (
              <div
                key={h._id}
                className="p-4 rounded-2xl bg-subtle border border-theme flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    {h.narrator && (
                      <span className="text-[11px] font-bold text-accent">
                        Narrated by {h.narrator}
                      </span>
                    )}
                    {h.reference && (
                      <Badge variant="neutral" size="xs">
                        {h.reference}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-primary font-bold italic leading-relaxed">
                    "{h.text}"
                  </p>

                  {h.reflection && (
                    <div className="p-2.5 rounded-xl bg-surface border border-theme text-xs text-secondary font-medium">
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-muted mb-0.5">
                        Reflection:
                      </span>
                      {h.reflection}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-theme/50 text-[11px] text-secondary">
                  <span>{formatDisplayDate(h.date)}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditHadith(h)}
                      className="p-1 rounded-lg text-secondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                      title="Edit Hadith"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteHadithId(h._id)}
                      className="p-1 rounded-lg text-secondary hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                      title="Delete Hadith"
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

      {/* Spiritual Vows & Commitments */}
      <Card
        hover
        title="Spiritual Vows & Commitments"
        subtitle="Active spiritual promises and obligations"
        icon={ShieldCheck}
        action={
          <Button variant="outline" size="sm" icon={Plus} onClick={openCreateVowModal}>
            Add Vow
          </Button>
        }
      >
        {vows.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No spiritual vows recorded"
            description="Track any personal spiritual commitments or intentions to fulfill."
            actionText="Create Vow"
            onAction={() => setIsVowModalOpen(true)}
          />
        ) : (
          <div className="space-y-2.5 mt-2">
            {vows.map((v) => (
              <div
                key={v._id}
                className="p-3.5 rounded-2xl bg-subtle border border-theme flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={v.status === 'Completed' || v.isCompleted}
                    onChange={() => handleToggleVow(v._id, v.status === 'Completed' || v.isCompleted)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <div>
                    <span
                      className={`text-xs font-bold ${
                        v.status === 'Completed' || v.isCompleted
                          ? 'line-through text-muted'
                          : 'text-primary'
                      }`}
                    >
                      {v.title || v.description}
                    </span>
                    {v.targetDate && (
                      <span className="text-[11px] text-secondary block">
                        Target Date: {formatDisplayDate(v.targetDate)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditVow(v)}
                    className="p-1.5 rounded-lg text-secondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                    title="Edit Vow"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteVowId(v._id)}
                    className="p-1.5 rounded-lg text-secondary hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete Vow"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Hadith Modal */}
      <Modal
        isOpen={isHadithModalOpen}
        onClose={() => setIsHadithModalOpen(false)}
        title={editingHadithId ? 'Edit Hadith & Reflection' : 'Log Hadith & Reflection'}
        subtitle={editingHadithId ? 'Update prophetic wisdom and personal reflections' : 'Record wisdom from the Sunnah'}
      >
        <form onSubmit={handleCreateHadith} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Hadith Text
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
                Narrator (Optional)
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
                Book / Reference (Optional)
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
              Personal Reflection & Application
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
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Hadith
            </Button>
          </div>
        </form>
      </Modal>

      {/* Vow Modal */}
      <Modal
        isOpen={isVowModalOpen}
        onClose={() => setIsVowModalOpen(false)}
        title="Record Spiritual Vow"
        subtitle="Personal commitment or intention"
      >
        <form onSubmit={handleCreateVow} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Vow Description
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
            label="Target Completion Date"
            value={vowTargetDate}
            onChange={setVowTargetDate}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsVowModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingVowId ? 'Update Vow' : 'Save Vow'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quran Modal */}
      <Modal
        isOpen={isQuranModalOpen}
        onClose={() => setIsQuranModalOpen(false)}
        title={editingQuranId ? 'Edit Quran Recitation' : 'Log Quran Recitation'}
        subtitle={editingQuranId ? 'Update recitation pages and surah' : `Record recitation for ${formatDisplayDate(activeDate)}`}
      >
        <form onSubmit={handleLogQuran} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Surah Name (Optional)
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
                Pages Read
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
                Ayats Read (Optional)
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
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingQuranId ? 'Update Recitation' : 'Save Recitation'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Quran Modal */}
      <Modal
        isOpen={!!deleteQuranId}
        onClose={() => setDeleteQuranId(null)}
        title="Confirm Deletion"
        subtitle="This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Are you sure you want to delete this Quran recitation log?
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setDeleteQuranId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteQuran}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Hadith Modal */}
      <Modal
        isOpen={!!deleteHadithId}
        onClose={() => setDeleteHadithId(null)}
        title="Confirm Deletion"
        subtitle="This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Are you sure you want to delete this Hadith record?
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setDeleteHadithId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteHadith}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Vow Modal */}
      <Modal
        isOpen={!!deleteVowId}
        onClose={() => setDeleteVowId(null)}
        title="Confirm Deletion"
        subtitle="This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Are you sure you want to delete this spiritual vow?
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setDeleteVowId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteVow}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default IslamicTracker;
