import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  Compass,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  Edit2,
  Trash2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Calculator,
  Sunrise,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react';
import api from '../utils/api';
import { DateInput } from '../components/DateInput';
import { getFormattedDate, formatDisplayDate } from '../utils/dateHelpers';
import { notifyStreakUpdate } from '../utils/streakEvents';

const ALL_PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Witr'];
const DAILY_5_PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const SALAH_STATUSES = [
  { label: 'On Time', value: 'onTime', variant: 'success' },
  { label: "Jama'ah", value: 'jamaah', variant: 'primary' },
  { label: 'Late', value: 'late', variant: 'warning' },
  { label: 'Missed', value: 'missed', variant: 'danger' },
  { label: 'Qada', value: 'qada', variant: 'purple' },
];

const PRAYER_META = {
  Fajr: { icon: Sunrise, subtitle: 'Dawn prayer' },
  Dhuhr: { icon: Sun, subtitle: 'Noon prayer' },
  Asr: { icon: Clock, subtitle: 'Afternoon prayer' },
  Maghrib: { icon: Sunset, subtitle: 'Sunset prayer' },
  Isha: { icon: Moon, subtitle: 'Night prayer' },
  Witr: { icon: Sparkles, subtitle: 'Wajib prayer' },
};

export const QadaMatrix = ({ selectedDate }) => {
  const { t, isRTL } = useLanguage();
  const activeDate = selectedDate || getFormattedDate();
  const [salahLogs, setSalahLogs] = useState([]);
  const [qadaData, setQadaData] = useState([]);
  const [vows, setVows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Batch edit modal
  const [editPrayer, setEditPrayer] = useState(null);
  const [totalOwedInput, setTotalOwedInput] = useState('');
  const [totalCompletedInput, setTotalCompletedInput] = useState('');
  const [qadaStartDate, setQadaStartDate] = useState('');
  const [qadaEndDate, setQadaEndDate] = useState('');
  const [applyToAllPrayers, setApplyToAllPrayers] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Dedicated Lifetime Qada Calculator modal
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calcStartDate, setCalcStartDate] = useState('');
  const [calcEndDate, setCalcEndDate] = useState('');
  const [calcExcusedDays, setCalcExcusedDays] = useState('');
  const [calcSelectedPrayers, setCalcSelectedPrayers] = useState(ALL_PRAYERS);
  const [savingCalc, setSavingCalc] = useState(false);

  // New/Edit Vow modal
  const [isVowModalOpen, setIsVowModalOpen] = useState(false);
  const [editingVowId, setEditingVowId] = useState(null);
  const [vowDescription, setVowDescription] = useState('');
  const [vowTargetDate, setVowTargetDate] = useState('');
  const [vowRelatedSalah, setVowRelatedSalah] = useState('All');
  const [vowNotes, setVowNotes] = useState('');
  const [savingVow, setSavingVow] = useState(false);

  const fetchQadaData = useCallback(async () => {
    try {
      const [salahRes, qadaRes, vowsRes] = await Promise.all([
        api.get(`/islamic/salah?date=${activeDate}`),
        api.get('/islamic/qada'),
        api.get('/islamic/vows'),
      ]);
      setSalahLogs(salahRes.data || []);
      setQadaData(qadaRes.data || []);
      setVows(vowsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch Qada and Salah data', err);
    } finally {
      setLoading(false);
    }
  }, [activeDate]);

  useEffect(() => {
    fetchQadaData();
  }, [fetchQadaData]);

  const handleUpdateSalah = async (prayerName, status) => {
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
      notifyStreakUpdate();
    } catch (err) {
      console.error('Failed to update salah log', err);
      fetchQadaData();
    }
  };

  const handleStep = async (prayerName, increment) => {
    // Optimistic UI update
    setQadaData((prev) =>
      prev.map((item) => {
        if (item.prayerName === prayerName) {
          const nextCompleted = Math.max(0, (item.totalCompleted || 0) + increment);
          return { ...item, totalCompleted: nextCompleted };
        }
        return item;
      })
    );

    try {
      await api.post('/islamic/qada', {
        prayerName,
        incrementCompleted: increment,
      });
    } catch (err) {
      console.error('Failed to update Qada step', err);
      fetchQadaData(); // Revert on failure
    }
  };

  const calculateDays = (startStr, endStr) => {
    if (!startStr || !endStr) return 0;
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    const diffTime = utcEnd - utcStart;
    if (diffTime < 0) return 0;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const formatDuration = (totalDays) => {
    if (totalDays <= 0) return '0 days';
    const years = Math.floor(totalDays / 365);
    const remDays = totalDays % 365;
    const months = Math.floor(remDays / 30);
    const days = remDays % 30;

    const parts = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? 'yr' : 'yrs'}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? 'mo' : 'mos'}`);
    if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);

    return parts.join(', ');
  };

  const setQuickRange = (months) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);

    const endStr = end.toISOString().split('T')[0];
    const startStr = start.toISOString().split('T')[0];

    setQadaStartDate(startStr);
    setQadaEndDate(endStr);
    const days = calculateDays(startStr, endStr);
    if (days > 0) setTotalOwedInput(days);
  };

  const setCalcQuickRange = (months) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);

    const endStr = end.toISOString().split('T')[0];
    const startStr = start.toISOString().split('T')[0];

    setCalcStartDate(startStr);
    setCalcEndDate(endStr);
  };

  const handleOpenEdit = (record) => {
    setEditPrayer(record.prayerName);
    setTotalOwedInput(record.totalOwed ?? '');
    setTotalCompletedInput(record.totalCompleted ?? '');
    setQadaStartDate('');
    setQadaEndDate('');
    setApplyToAllPrayers(false);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      if (applyToAllPrayers) {
        await api.post('/islamic/qada', {
          prayerName: 'All',
          totalOwed: Number(totalOwedInput),
        });
        await api.post('/islamic/qada', {
          prayerName: editPrayer,
          setCompleted: Number(totalCompletedInput),
        });
      } else {
        await api.post('/islamic/qada', {
          prayerName: editPrayer,
          totalOwed: Number(totalOwedInput),
          setCompleted: Number(totalCompletedInput),
        });
      }
      setEditPrayer(null);
      fetchQadaData();
    } catch (err) {
      console.error('Failed to save Qada baseline', err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleApplyCalculator = async (e) => {
    e.preventDefault();
    const rawDays = calculateDays(calcStartDate, calcEndDate);
    const netDays = Math.max(0, rawDays - Number(calcExcusedDays || 0));
    if (netDays <= 0 || calcSelectedPrayers.length === 0) return;

    setSavingCalc(true);
    try {
      await api.post('/islamic/qada', {
        prayers: calcSelectedPrayers,
        totalOwed: netDays,
      });
      setIsCalculatorOpen(false);
      fetchQadaData();
    } catch (err) {
      console.error('Failed to apply Qada calculator', err);
    } finally {
      setSavingCalc(false);
    }
  };

  const handleEditVow = (vow) => {
    setEditingVowId(vow._id);
    setVowDescription(vow.title || vow.description || '');
    setVowTargetDate(vow.targetDate || '');
    setVowRelatedSalah(vow.relatedSalah || 'All');
    setVowNotes(vow.notes || '');
    setIsVowModalOpen(true);
  };

  const handleSaveVow = async (e) => {
    e.preventDefault();
    if (!vowDescription.trim()) return;
    setSavingVow(true);
    try {
      const payload = {
        title: vowDescription.trim(),
        description: vowDescription.trim(),
        targetDate: vowTargetDate,
        relatedSalah: vowRelatedSalah,
        notes: vowNotes,
      };

      if (editingVowId) {
        const res = await api.put(`/islamic/vows/${editingVowId}`, payload);
        if (res.data) {
          setVows((prev) => prev.map((v) => (v._id === editingVowId ? res.data : v)));
        }
      } else {
        const res = await api.post('/islamic/vows', payload);
        if (res.data) {
          setVows((prev) => [res.data, ...prev]);
        }
      }
      setVowDescription('');
      setVowTargetDate('');
      setVowNotes('');
      setEditingVowId(null);
      setIsVowModalOpen(false);
      fetchQadaData();
    } catch (err) {
      console.error('Failed to save spiritual vow', err);
    } finally {
      setSavingVow(false);
    }
  };

  const handleToggleVow = async (vowId, currentStatus) => {
    const isCompleted = currentStatus === 'Active';
    // Optimistic update
    setVows((prev) =>
      prev.map((v) => (v._id === vowId ? { ...v, status: isCompleted ? 'Completed' : 'Active' } : v))
    );
    try {
      await api.put(`/islamic/vows/${vowId}`, { isCompleted });
    } catch (err) {
      console.error('Failed to toggle vow', err);
      fetchQadaData();
    }
  };

  const handleDeleteVow = async (vowId) => {
    setVows((prev) => prev.filter((v) => v._id !== vowId));
    try {
      await api.delete(`/islamic/vows/${vowId}`);
    } catch (err) {
      console.error('Failed to delete vow', err);
      fetchQadaData();
    }
  };

  // Aggregated stats
  const totalOwedAll = qadaData.reduce((sum, item) => sum + (item.totalOwed || 0), 0);
  const totalCompletedAll = qadaData.reduce((sum, item) => sum + (item.totalCompleted || 0), 0);
  const totalRemainingAll = Math.max(0, totalOwedAll - totalCompletedAll);
  const overallProgressPercent = totalOwedAll > 0 ? Math.round((totalCompletedAll / totalOwedAll) * 100) : 100;

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-semibold text-secondary">Loading Qada Matrix...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        category={t('categories.spiritual', 'Spiritual Discipline')}
        title={t('qada.title', 'Salah & Qada Matrix')}
        description={t('qada.subtitle', 'Daily obligatory prayer tracking and lifetime missed prayer (Qada Umri) clearance matrix.')}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="md"
              icon={Calculator}
              onClick={() => {
                setCalcStartDate('');
                setCalcEndDate('');
                setCalcExcusedDays(0);
                setCalcSelectedPrayers(ALL_PRAYERS);
                setIsCalculatorOpen(true);
              }}
            >
              {t('qada.qadaUmri', 'Lifetime Qada Calculator')}
            </Button>
            <Button
              variant="gradient"
              size="md"
              icon={Plus}
              onClick={() => {
                setEditingVowId(null);
                setVowDescription('');
                setVowTargetDate('');
                setVowRelatedSalah('All');
                setVowNotes('');
                setIsVowModalOpen(true);
              }}
            >
              {t('common.add', 'New Spiritual Vow')}
            </Button>
          </div>
        }
      />

      {/* Top Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title={t('qada.totalQadaOwed')}
          value={totalOwedAll}
          subtitle={t('qada.lifetimeMissedLogged')}
          icon={AlertCircle}
          color="rose"
        />
        <StatCard
          title={t('qada.prayersMadeUp')}
          value={totalCompletedAll}
          subtitle={t('qada.completedQadaPrayers')}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title={t('qada.remainingDebt')}
          value={totalRemainingAll}
          subtitle={t('qada.totalRemaining')}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title={t('qada.clearanceProgress')}
          value={`${overallProgressPercent}%`}
          subtitle={t('qada.qadaCompletionRatio')}
          icon={Compass}
          color="indigo"
        />
      </div>

      {/* Today's 5 Daily Prayers (Salah) Interactive Cockpit */}
      <Card
        hover
        title={t('islamic.salahPrayers', "Today's 5 Daily Prayers (Salah)")}
        subtitle={`${t('islamic.salahPrayersSubtitle', 'Click any status button to instantly toggle and record prayer for')} ${formatDisplayDate(activeDate)}`}
        icon={Compass}
        badge={
          <Badge
            variant={
              salahLogs.filter((l) => l.status && l.status !== 'missed' && l.status !== 'unlogged').length === 5
                ? 'success'
                : 'primary'
            }
            size="xs"
          >
            {salahLogs.filter((l) => l.status && l.status !== 'missed' && l.status !== 'unlogged').length} / 5 Done Today
          </Badge>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5 mt-2">
          {DAILY_5_PRAYERS.map((prayerName, idx) => {
            const currentLog = salahLogs.find((l) => (l.prayerName || l.salah) === prayerName);
            const currentStatus = currentLog?.status || 'unlogged';
            const isLastOnMobile = idx === 4;

            return (
              <div
                key={prayerName}
                className={`p-3 sm:p-3.5 rounded-2xl bg-subtle/80 border border-theme flex flex-col justify-between space-y-2.5 transition-all hover:border-theme-strong ${
                  isLastOnMobile ? 'col-span-2 sm:col-span-1' : ''
                }`}
              >
                <div className="flex items-center justify-between sm:flex-col sm:items-start gap-1">
                  <span className="font-extrabold text-sm text-primary tracking-tight">{prayerName}</span>
                  {currentStatus !== 'unlogged' ? (
                    <Badge
                      variant={
                        SALAH_STATUSES.find((s) => s.value === currentStatus)?.variant || 'neutral'
                      }
                      size="xs"
                    >
                      {SALAH_STATUSES.find((s) => s.value === currentStatus)?.label}
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-muted font-semibold">Pending</span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-1 gap-1 pt-1">
                  {SALAH_STATUSES.map((st) => {
                    const isSelected = currentStatus === st.value;
                    return (
                      <button
                        key={st.value}
                        type="button"
                        onClick={() => handleUpdateSalah(prayerName, st.value)}
                        className={`py-1.5 px-1.5 text-[10px] font-bold rounded-lg transition-all duration-150 cursor-pointer border text-center ${isSelected
                          ? 'bg-accent text-white border-accent shadow-xs scale-102 font-extrabold'
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

      {/* Interactive Qada Salah Matrix Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-primary tracking-tight">
                  Interactive Qada Salah Matrix
                </h2>
                <Badge variant="success" size="xs">Live Matrix</Badge>
              </div>
              <p className="text-xs text-secondary">
                Track, log, and fulfill each prayer individually without horizontal scrolling
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsCalculatorOpen(true)}
            className="self-start sm:self-auto gap-1.5 text-xs font-semibold"
          >
            <Calculator className="w-3.5 h-3.5" />
            Lifetime Calculator
          </Button>
        </div>

        {/* 6 Responsive Prayer Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {ALL_PRAYERS.map((prayer) => {
            const record = qadaData.find((q) => q.prayerName === prayer) || {
              prayerName: prayer,
              totalOwed: 0,
              totalCompleted: 0,
            };
            const remaining = Math.max(0, record.totalOwed - record.totalCompleted);
            const percent =
              record.totalOwed > 0
                ? Math.min(100, Math.round((record.totalCompleted / record.totalOwed) * 100))
                : 100;
            const isCompleted = record.totalOwed > 0 && remaining === 0;

            const prayerCfg = PRAYER_META[prayer] || { icon: Clock, subtitle: 'Salah' };
            const PrayerIcon = prayerCfg.icon;

            return (
              <Card
                key={prayer}
                hover
                title={prayer}
                subtitle={prayerCfg.subtitle}
                icon={PrayerIcon}
                badge={
                  <div className="flex items-center gap-1.5">
                    {prayer === 'Witr' && (
                      <Badge variant="purple" size="xs">Wajib</Badge>
                    )}
                    <Badge variant={isCompleted ? 'success' : percent > 50 ? 'info' : 'warning'} size="xs">
                      {isCompleted ? 'Completed' : `${percent}% Done`}
                    </Badge>
                  </div>
                }
                bottomAction={
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(record)}
                      className="p-1.5 rounded-lg bg-surface border border-theme text-secondary hover:text-accent hover:border-accent/40 hover:bg-accent/10 shadow-xs transition-all cursor-pointer"
                      title={`Edit ${prayer} baseline or dates`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                }
                className="overflow-hidden"
              >
                {/* 3 Metric Badges: Owed, Made Up, Remaining */}
                <div className="grid grid-cols-3 gap-2 my-1 text-center">
                  <div className="bg-subtle/60 border border-theme rounded-xl p-2.5 flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                      Owed
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-primary mt-0.5">
                      {record.totalOwed.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Made Up
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {record.totalCompleted.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                      Remaining
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                      {remaining.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-medium text-secondary">Progress</span>
                    <span className="text-[11px] font-bold text-primary">{percent}%</span>
                  </div>
                  <div className="h-2 bg-subtle rounded-full overflow-hidden border border-theme">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Quick Make-Up Actions with right padding to clear bottomAction */}
                <div className="mt-4 pt-3 border-t border-subtle flex items-center justify-between gap-2 pr-12">
                  <span className="text-xs font-semibold text-secondary">Quick Log</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStep(prayer, -1)}
                      disabled={record.totalCompleted <= 0}
                      className="p-2 rounded-xl bg-subtle text-secondary hover:text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Step back 1 completed prayer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStep(prayer, 1)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                      title={`Add 1 completed ${prayer}`}
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>1 Make-up</span>
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Spiritual Vows & Niyyah Tracker */}
      <Card
        hover
        title="Spiritual Vows & Niyyah Commitments (Nazr)"
        subtitle="Manage spiritual promises and solemn resolutions"
        icon={ShieldCheck}
        badge={<Badge variant="purple" size="xs">Vows</Badge>}
        action={
          <Button variant="ghost" size="xs" onClick={() => setIsVowModalOpen(true)}>
            + Add Vow
          </Button>
        }
      >
        {vows.length === 0 ? (
          <div className="py-8 text-center text-xs text-secondary italic bg-subtle/50 rounded-xl border border-dashed border-theme mt-2">
            No active spiritual vows recorded.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            {vows.map((vow) => {
              const isDone = vow.status === 'Completed';
              return (
                <div
                  key={vow._id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${isDone
                    ? 'bg-subtle/40 border-theme opacity-75'
                    : 'bg-surface border-theme card-shadow'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleVow(vow._id, vow.status)}
                      className={`mt-0.5 p-1 rounded-lg border transition-colors cursor-pointer ${isDone
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-theme text-transparent hover:border-emerald-500'
                        }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <div>
                      <p
                        className={`text-sm font-bold ${isDone ? 'line-through text-secondary' : 'text-primary'
                          }`}
                      >
                        {vow.title}
                      </p>
                      {vow.targetDate && (
                        <p className="text-[11px] text-secondary flex items-center gap-1 mt-1 font-medium">
                          <Calendar className="w-3 h-3 text-accent" /> Target: {vow.targetDate}
                        </p>
                      )}
                      {vow.notes && (
                        <p className="text-xs text-secondary italic mt-1.5">
                          "{vow.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEditVow(vow)}
                      className="p-1.5 text-secondary hover:text-accent hover:bg-accent/10 rounded-lg transition-colors cursor-pointer"
                      title="Edit vow"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteVow(vow._id)}
                      className="p-1.5 text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Delete vow"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Edit Baseline Modal */}
      {/* Edit Baseline Modal */}
      {editPrayer && (() => {
        const editCalcDays = calculateDays(qadaStartDate, qadaEndDate);
        return (
          <Modal
            isOpen={true}
            onClose={() => setEditPrayer(null)}
            title={`${t('common.edit')} ${editPrayer} ${t('qada.editQadaBaseline')}`}
            subtitle={t('qada.editQadaSubtitle')}
            maxWidth="md"
          >
            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Date Range Calculator Box */}
              <div className="p-3.5 rounded-2xl bg-subtle/80 border border-theme space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-emerald-500" />
                    {t('qada.calcFromRange')}
                  </span>
                  <Badge variant="neutral" size="xs">{t('qada.dateHelper')}</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DateInput
                    id="qada-start-date"
                    label={t('qada.startDate')}
                    value={qadaStartDate}
                    onChange={(val) => {
                      setQadaStartDate(val);
                      const days = calculateDays(val, qadaEndDate);
                      if (days > 0) setTotalOwedInput(days);
                    }}
                  />
                  <DateInput
                    id="qada-end-date"
                    label={t('qada.endDate')}
                    value={qadaEndDate}
                    onChange={(val) => {
                      setQadaEndDate(val);
                      const days = calculateDays(qadaStartDate, val);
                      if (days > 0) setTotalOwedInput(days);
                    }}
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">{t('qada.quickPresets')}</span>
                  {[
                    { label: '3 Months', months: 3 },
                    { label: '6 Months', months: 6 },
                    { label: '1 Year', months: 12 },
                    { label: '2 Years', months: 24 },
                    { label: '5 Years', months: 60 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setQuickRange(preset.months)}
                      className="px-2 py-0.5 text-[11px] font-semibold rounded-lg bg-surface border border-theme hover:border-accent hover:text-accent transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {editCalcDays > 0 && (
                  <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-secondary text-[11px]">
                      {t('qada.calcSummary')}: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{editCalcDays} {t('qada.days')}</strong> ({formatDuration(editCalcDays)})
                    </span>
                    <button
                      type="button"
                      onClick={() => setTotalOwedInput(editCalcDays)}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer shadow-xs"
                    >
                      {t('qada.usePrayers').replace('{count}', editCalcDays)}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {t('qada.totalOwed')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalOwedInput}
                  onChange={(e) => setTotalOwedInput(e.target.value)}
                  placeholder="e.g. 365"
                  className="input-base"
                  required
                />
                <span className="text-[11px] text-secondary mt-1 block">
                  {t('qada.totalOwedDesc')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {t('qada.totalCompleted')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalCompletedInput}
                  onChange={(e) => setTotalCompletedInput(e.target.value)}
                  placeholder="e.g. 0"
                  className="input-base"
                  required
                />
              </div>

              <div className="pt-2 border-t border-theme">
                <label className="flex items-center gap-2 text-xs font-bold text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyToAllPrayers}
                    onChange={(e) => setApplyToAllPrayers(e.target.checked)}
                    className="rounded border-theme text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>{t('qada.applyToAllPrayers')} ({totalOwedInput || 0})</span>
                </label>
                <p className="text-[11px] text-secondary ml-5 mt-0.5">
                  {t('qada.applyToAllDesc')}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-theme">
                <Button variant="ghost" size="md" type="button" onClick={() => setEditPrayer(null)}>
                  {t('common.cancel')}
                </Button>
                <Button variant="primary" size="md" type="submit" loading={savingEdit}>
                  {t('qada.saveBaseline')}
                </Button>
              </div>
            </form>
          </Modal>
        );
      })()}

      {/* Lifetime Qada Calculator Modal */}
      {isCalculatorOpen && (() => {
        const rawDays = calculateDays(calcStartDate, calcEndDate);
        const netDays = Math.max(0, rawDays - Number(calcExcusedDays || 0));
        const totalAllPrayers = netDays * calcSelectedPrayers.length;

        const togglePrayer = (p) => {
          setCalcSelectedPrayers((prev) =>
            prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
          );
        };

        const toggleAllPrayers = () => {
          if (calcSelectedPrayers.length === ALL_PRAYERS.length) {
            setCalcSelectedPrayers([]);
          } else {
            setCalcSelectedPrayers([...ALL_PRAYERS]);
          }
        };

        return (
          <Modal
            isOpen={true}
            onClose={() => setIsCalculatorOpen(false)}
            title={t('qada.lifetimeQadaCalc', 'Lifetime Qada Calculator (Qada-e-Umri)')}
            subtitle={t('qada.lifetimeQadaSubtitle', 'Calculate missed prayers based on obligation dates and apply directly to your ledger')}
            maxWidth="5xl"
          >
            <form onSubmit={handleApplyCalculator} className="space-y-4">
              {/* Islamic Guidance Info Banner */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 text-xs text-secondary flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <p className="text-[11px] leading-relaxed text-secondary">
                  <strong className="text-primary font-bold">{t('qada.fiqhMethodTitle', 'Islamic Fiqh Rule')}:</strong>{' '}
                  {t('qada.fiqhMethodDesc', 'Set Start Date when prayers became obligatory upon puberty (Bulugh), and End Date when regular daily prayers resumed.')}
                </p>
              </div>

              {/* Main 2-Column Responsive Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {/* Left Column: Calculation Parameters */}
                <div className="space-y-3.5 p-3.5 rounded-2xl bg-subtle border border-theme">
                  <span className="text-[11px] font-extrabold text-secondary uppercase tracking-wider block">
                    1. Obligation Timeline
                  </span>

                  {/* Date Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <DateInput
                      id="calc-start-date"
                      label={t('qada.startDate', 'Start Date')}
                      value={calcStartDate}
                      onChange={setCalcStartDate}
                      required
                    />
                    <DateInput
                      id="calc-end-date"
                      label={t('qada.endDate', 'End Date')}
                      value={calcEndDate}
                      onChange={setCalcEndDate}
                      required
                    />
                  </div>

                  {/* Quick Duration Shortcuts */}
                  <div>
                    <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block mb-1.5">
                      {t('qada.quickDuration', 'Quick Duration Preset')}
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                      {[
                        { label: '6M', months: 6 },
                        { label: '1Y', months: 12 },
                        { label: '2Y', months: 24 },
                        { label: '3Y', months: 36 },
                        { label: '5Y', months: 60 },
                        { label: '10Y', months: 120 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setCalcQuickRange(preset.months)}
                          className="py-1 text-[11px] font-bold rounded-lg bg-surface border border-theme hover:border-emerald-500/50 hover:text-emerald-500 transition-all active:scale-95 text-center cursor-pointer shadow-2xs"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Excused Days Deduction */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-secondary uppercase tracking-wider">
                        {t('qada.excusedDays', 'Excused Days')}
                      </label>
                      <span className="text-[10px] text-muted">{t('qada.excusedDaysDesc', 'Haiz, illness, travel')}</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max={rawDays || undefined}
                        value={calcExcusedDays}
                        onChange={(e) => setCalcExcusedDays(e.target.value)}
                        className="input-base text-sm font-semibold pr-14"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary pointer-events-none">
                        days
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Results & Prayers Selection */}
                <div className="space-y-3.5 p-3.5 rounded-2xl bg-subtle border border-theme flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[11px] font-extrabold text-secondary uppercase tracking-wider block">
                      2. Calculation Summary & Target
                    </span>

                    {/* Live Calculation Preview Banner */}
                    {rawDays > 0 ? (
                      <div className="p-3 rounded-xl bg-surface border border-theme space-y-2 card-shadow">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                            {t('qada.calcSummary', 'Calculated Output')}
                          </span>
                          <Badge variant="success" size="xs">
                            {formatDuration(netDays)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 rounded-lg bg-subtle border border-theme/60">
                            <span className="text-[10px] text-secondary font-medium block">Total Timeline</span>
                            <span className="text-sm font-extrabold text-primary">{rawDays} days</span>
                          </div>
                          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">Net Owed per Prayer</span>
                            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{netDays} prayers</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-subtle text-xs">
                          <span className="text-secondary font-medium">
                            Total across {calcSelectedPrayers.length} selected:
                          </span>
                          <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                            {totalAllPrayers.toLocaleString()} prayers
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 px-3 text-center text-xs text-secondary italic bg-surface/80 rounded-xl border border-dashed border-theme">
                        {t('qada.selectDatesPrompt', 'Select valid Start and End dates to calculate totals.')}
                      </div>
                    )}

                    {/* Prayers to Apply */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-secondary uppercase tracking-wider">
                          {t('qada.applyToSelected', 'Apply to Selected Prayers:')}
                        </label>
                        <button
                          type="button"
                          onClick={toggleAllPrayers}
                          className="text-[11px] font-bold text-accent hover:underline cursor-pointer"
                        >
                          {calcSelectedPrayers.length === ALL_PRAYERS.length ? t('qada.deselectAll', 'Deselect All') : t('qada.selectAll', 'Select All')}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {ALL_PRAYERS.map((p) => {
                          const isChecked = calcSelectedPrayers.includes(p);
                          return (
                            <label
                              key={p}
                              className={`flex items-center gap-1.5 p-2 rounded-xl border cursor-pointer transition-all select-none text-xs ${isChecked
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-primary font-bold shadow-2xs'
                                : 'bg-surface border-theme text-secondary hover:text-primary hover:border-[var(--color-border-hover)]'
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePrayer(p)}
                                className="rounded border-theme text-emerald-500 focus:ring-emerald-500 cursor-pointer w-3.5 h-3.5"
                              />
                              <span className="truncate">{p}</span>
                              {p === 'Witr' && (
                                <Badge variant="purple" size="xs" className="ml-auto text-[8px] py-0 px-1">
                                  {t('qada.wajib', 'Wajib')}
                                </Badge>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-subtle">
                <span className="text-xs text-secondary font-medium hidden sm:inline">
                  {netDays > 0 && calcSelectedPrayers.length > 0
                    ? `Ready to add +${netDays} days to ${calcSelectedPrayers.length} prayer categories`
                    : 'Configure parameters above'}
                </span>
                <div className="flex items-center gap-2.5 ml-auto">
                  <Button variant="secondary" size="md" type="button" onClick={() => setIsCalculatorOpen(false)}>
                    {t('common.cancel', 'Cancel')}
                  </Button>
                  <Button
                    variant="gradient"
                    size="md"
                    type="submit"
                    loading={savingCalc}
                    disabled={netDays <= 0 || calcSelectedPrayers.length === 0}
                    icon={CheckCircle2}
                  >
                    {t('qada.applyDaysToSelected', 'Apply Days to Selected Prayers')}
                  </Button>
                </div>
              </div>
            </form>
          </Modal>
        );
      })()}

      {/* New / Edit Vow Modal */}
      <Modal
        isOpen={isVowModalOpen}
        onClose={() => {
          setIsVowModalOpen(false);
          setEditingVowId(null);
        }}
        title={editingVowId ? t('qada.editSpiritualVow', 'Edit Spiritual Vow (Nazr / Niyyah)') : t('qada.recordNewVow', 'Record New Spiritual Vow (Nazr / Niyyah)')}
        subtitle="Set a dedicated spiritual resolution or milestone to anchor your prayer consistency"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveVow} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              {t('qada.vowDescriptionReq', 'Vow Description / Resolution')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={vowDescription}
              onChange={(e) => setVowDescription(e.target.value)}
              placeholder="e.g. Pray 2 Rakat Nafl every night, complete 100 Qada Fajr"
              className="input-base font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <DateInput
              label={t('common.target', 'Target Date')}
              value={vowTargetDate}
              onChange={setVowTargetDate}
            />
            <div className="space-y-1.5">
              <div className="h-6 flex items-center justify-between">
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider">
                  {t('qada.relatedSalah', 'Related Salah')}
                </label>
              </div>
              <select
                value={vowRelatedSalah}
                onChange={(e) => setVowRelatedSalah(e.target.value)}
                className="select-base font-medium"
              >
                <option value="All">{t('qada.allPrayers', 'All Prayers')}</option>
                {ALL_PRAYERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              {t('qada.vowNotes', 'Personal Notes / Intention')}
            </label>
            <textarea
              value={vowNotes}
              onChange={(e) => setVowNotes(e.target.value)}
              placeholder={t('qada.vowNotesPlaceholder', 'Specific conditions, prayer reminders, or spiritual motivation...')}
              className="textarea-base min-h-[80px]"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-subtle">
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={() => {
                setIsVowModalOpen(false);
                setEditingVowId(null);
              }}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button variant="gradient" size="md" type="submit" loading={savingVow}>
              {editingVowId ? t('islamic.updateVow', 'Update Vow') : t('islamic.saveVow', 'Save Vow')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default QadaMatrix;
