import React, { useState, useEffect, useCallback } from 'react';
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

const ALL_PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Witr'];

const PRAYER_META = {
  Fajr: { icon: Sunrise, subtitle: 'Dawn prayer' },
  Dhuhr: { icon: Sun, subtitle: 'Noon prayer' },
  Asr: { icon: Clock, subtitle: 'Afternoon prayer' },
  Maghrib: { icon: Sunset, subtitle: 'Sunset prayer' },
  Isha: { icon: Moon, subtitle: 'Night prayer' },
  Witr: { icon: Sparkles, subtitle: 'Wajib prayer' },
};

export const QadaMatrix = () => {
  const [qadaData, setQadaData] = useState([]);
  const [vows, setVows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Batch edit modal
  const [editPrayer, setEditPrayer] = useState(null);
  const [totalOwedInput, setTotalOwedInput] = useState(0);
  const [totalCompletedInput, setTotalCompletedInput] = useState(0);
  const [qadaStartDate, setQadaStartDate] = useState('');
  const [qadaEndDate, setQadaEndDate] = useState('');
  const [applyToAllPrayers, setApplyToAllPrayers] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Dedicated Lifetime Qada Calculator modal
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calcStartDate, setCalcStartDate] = useState('');
  const [calcEndDate, setCalcEndDate] = useState('');
  const [calcExcusedDays, setCalcExcusedDays] = useState(0);
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
      const [qadaRes, vowsRes] = await Promise.all([
        api.get('/islamic/qada'),
        api.get('/islamic/vows'),
      ]);
      setQadaData(qadaRes.data || []);
      setVows(vowsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch Qada data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQadaData();
  }, [fetchQadaData]);

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
    setTotalOwedInput(record.totalOwed || 0);
    setTotalCompletedInput(record.totalCompleted || 0);
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
        category="Spiritual Accountability"
        title="Qada Salah Matrix & Niyyah Tracker"
        description="Comprehensive debt tracker for missed prayers (including Witr) and spiritual promises"
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
              Lifetime Qada Calculator
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
              New Spiritual Vow
            </Button>
          </div>
        }
      />

      {/* Top Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Qada Owed"
          value={totalOwedAll}
          subtitle="Lifetime missed prayers logged"
          icon={AlertCircle}
          color="rose"
        />
        <StatCard
          title="Prayers Made Up"
          value={totalCompletedAll}
          subtitle="Completed Qada prayers"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Remaining Debt"
          value={totalRemainingAll}
          subtitle="Remaining to fulfill"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Fulfillment Progress"
          value={`${overallProgressPercent}%`}
          subtitle="Overall make-up trajectory"
          icon={Compass}
          color="indigo"
        />
      </div>

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
                  <div className="flex items-center bg-surface/90 dark:bg-zinc-900/90 backdrop-blur-md border border-theme rounded-lg p-0.5 shadow-sm">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(record)}
                      className="p-1 text-secondary hover:text-primary hover:bg-subtle rounded transition-colors cursor-pointer"
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
      {editPrayer && (() => {
        const editCalcDays = calculateDays(qadaStartDate, qadaEndDate);
        return (
          <Modal
            isOpen={true}
            onClose={() => setEditPrayer(null)}
            title={`Edit ${editPrayer} Qada Baseline`}
            subtitle="Update lifetime missed prayers count or calculate from dates"
            maxWidth="md"
          >
            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Date Range Calculator Box */}
              <div className="p-3.5 rounded-2xl bg-subtle/80 border border-theme space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-emerald-500" />
                    Calculate from Qada Date Range
                  </span>
                  <Badge variant="neutral" size="xs">Date Helper</Badge>
                </div>
                {/* <p className="text-[11px] text-secondary">
                  Enter the start and end dates when prayers were missed to automatically calculate total owed days.
                </p> */}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DateInput
                    id="qada-start-date"
                    label="Start Date"
                    value={qadaStartDate}
                    onChange={(val) => {
                      setQadaStartDate(val);
                      const days = calculateDays(val, qadaEndDate);
                      if (days > 0) setTotalOwedInput(days);
                    }}
                  />
                  <DateInput
                    id="qada-end-date"
                    label="End Date"
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
                  <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">Quick Presets:</span>
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
                      Calculated: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{editCalcDays} days</strong> ({formatDuration(editCalcDays)})
                    </span>
                    <button
                      type="button"
                      onClick={() => setTotalOwedInput(editCalcDays)}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer shadow-xs"
                    >
                      Use {editCalcDays} Prayers
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  Total Owed (Lifetime Missed)
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalOwedInput}
                  onChange={(e) => setTotalOwedInput(e.target.value)}
                  className="input-base"
                  required
                />
                <span className="text-[11px] text-secondary mt-1 block">
                  Total {editPrayer} prayers required to be made up.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  Total Already Completed (Made-up)
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalCompletedInput}
                  onChange={(e) => setTotalCompletedInput(e.target.value)}
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
                  <span>Apply this Total Owed ({totalOwedInput || 0}) to all 6 prayers</span>
                </label>
                <p className="text-[11px] text-secondary ml-5 mt-0.5">
                  Synchronizes Fajr, Dhuhr, Asr, Maghrib, Isha, and Witr to the same baseline debt.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-theme">
                <Button variant="ghost" size="md" type="button" onClick={() => setEditPrayer(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" type="submit" loading={savingEdit}>
                  Save Baseline
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
            title="Lifetime Qada Calculator"
            subtitle="Calculate missed prayers based on the dates of obligation until regular observance"
            maxWidth="lg"
          >
            <form onSubmit={handleApplyCalculator} className="space-y-4">
              {/* Islamic Guidance Info */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-secondary flex items-start gap-2.5">
                <Compass className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-primary">Islamic Fiqh Method for Qada-e-Umri:</p>
                  <p className="mt-1 text-[11px] leading-relaxed">
                    Set the <strong>Start Date</strong> when prayers became obligatory upon reaching puberty (Bulugh), or when prayers stopped being offered, and the <strong>End Date</strong> when regular daily prayers resumed.
                  </p>
                </div>
              </div>

              {/* Date Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <DateInput
                  id="calc-start-date"
                  label="Start Date"
                  value={calcStartDate}
                  onChange={setCalcStartDate}
                  required
                />
                <DateInput
                  id="calc-end-date"
                  label="End Date"
                  value={calcEndDate}
                  onChange={setCalcEndDate}
                  required
                />
              </div>

              {/* Quick Duration Shortcuts */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">Quick Duration:</span>
                {[
                  { label: '6 Months', months: 6 },
                  { label: '1 Year', months: 12 },
                  { label: '2 Years', months: 24 },
                  { label: '3 Years', months: 36 },
                  { label: '5 Years', months: 60 },
                  { label: '10 Years', months: 120 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setCalcQuickRange(preset.months)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-subtle border border-theme hover:border-emerald-500 hover:text-emerald-500 transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Excused Days Deduction */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-secondary">
                    Excused Days to Deduct (Optional)
                  </label>
                  <span className="text-[10px] text-secondary">e.g. Haiz days, illness, or travel</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max={rawDays}
                  value={calcExcusedDays}
                  onChange={(e) => setCalcExcusedDays(Math.max(0, Number(e.target.value)))}
                  className="input-base"
                  placeholder="0"
                />
              </div>

              {/* Live Calculation Summary Banner */}
              {rawDays > 0 ? (
                <div className="p-4 rounded-2xl bg-subtle border border-theme space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                      Calculation Summary
                    </span>
                    <Badge variant="success" size="xs">
                      {formatDuration(netDays)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-surface border border-theme">
                      <span className="text-[11px] text-secondary block font-medium">Calendar Duration</span>
                      <span className="text-base font-extrabold text-primary">{rawDays} days</span>
                    </div>
                    <div className="p-3 rounded-xl bg-surface border border-theme">
                      <span className="text-[11px] text-secondary block font-medium">Net Days Owed</span>
                      <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{netDays} days</span>
                    </div>
                    <div className="p-3 rounded-xl bg-surface border border-theme col-span-2 sm:col-span-1">
                      <span className="text-[11px] text-secondary block font-medium">Owed Per Prayer</span>
                      <span className="text-base font-extrabold text-accent">{netDays} prayers</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-theme text-xs">
                    <span className="text-secondary font-medium">
                      Total Across Selected Prayers ({calcSelectedPrayers.length}):
                    </span>
                    <span className="text-base font-black text-rose-600 dark:text-rose-400">
                      {totalAllPrayers.toLocaleString()} prayers
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-secondary italic bg-subtle/50 rounded-xl border border-dashed border-theme">
                  Select valid Start and End dates above to preview your calculated Qada totals.
                </div>
              )}

              {/* Prayers to Apply */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-secondary">
                    Apply Calculated Days to Selected Prayers:
                  </label>
                  <button
                    type="button"
                    onClick={toggleAllPrayers}
                    className="text-[11px] font-bold text-accent hover:underline cursor-pointer"
                  >
                    {calcSelectedPrayers.length === ALL_PRAYERS.length ? 'Deselect All' : 'Select All (6 Prayers)'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_PRAYERS.map((p) => {
                    const isChecked = calcSelectedPrayers.includes(p);
                    return (
                      <label
                        key={p}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${isChecked
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-primary font-bold'
                          : 'bg-subtle/40 border-theme text-secondary'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePrayer(p)}
                          className="rounded border-theme text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-xs">{p}</span>
                        {p === 'Witr' && (
                          <Badge variant="purple" size="xs" className="ml-auto text-[9px]">Wajib</Badge>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-theme">
                <Button variant="ghost" size="md" type="button" onClick={() => setIsCalculatorOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  loading={savingCalc}
                  disabled={netDays <= 0 || calcSelectedPrayers.length === 0}
                  icon={CheckCircle2}
                >
                  Apply {netDays > 0 ? `${netDays} Days` : ''} to Selected Prayers
                </Button>
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
        title={editingVowId ? 'Edit Spiritual Vow (Nazr / Niyyah)' : 'Record New Spiritual Vow (Nazr / Niyyah)'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveVow} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">
              Vow Description / Resolution *
            </label>
            <input
              type="text"
              value={vowDescription}
              onChange={(e) => setVowDescription(e.target.value)}
              placeholder="e.g. Pray 2 Rakat Nafl every night, complete 100 Qada Fajr"
              className="input-base"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DateInput
              label="Target Date"
              value={vowTargetDate}
              onChange={setVowTargetDate}
            />
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                Related Salah
              </label>
              <select
                value={vowRelatedSalah}
                onChange={(e) => setVowRelatedSalah(e.target.value)}
                className="select-base"
              >
                <option value="All">All Prayers</option>
                {ALL_PRAYERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">
              Personal Notes / Intention
            </label>
            <textarea
              value={vowNotes}
              onChange={(e) => setVowNotes(e.target.value)}
              placeholder="Specific conditions or spiritual motivation..."
              className="textarea-base min-h-[60px]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-theme">
            <Button
              variant="ghost"
              size="md"
              type="button"
              onClick={() => {
                setIsVowModalOpen(false);
                setEditingVowId(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="gradient" size="md" type="submit" loading={savingVow}>
              {editingVowId ? 'Update Vow' : 'Record Vow'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default QadaMatrix;
