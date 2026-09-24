import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { LoadingScreen } from '../components/LoadingScreen';
import api from '../utils/api';
import { notifyCreated, notifyUpdated, notifyDeleted, notifyError, showSuccessToast, confirmDelete, notifyGuestAction } from '../utils/alerts';
import { useAuth } from '../context/AuthContext';
import { DateInput } from '../components/DateInput';
import { getFormattedDate, formatDisplayDate } from '../utils/dateHelpers';
import { notifyStreakUpdate } from '../utils/streakEvents';
import { useNavigate } from 'react-router-dom';
import {
  Moon,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  Edit2,
  Check,
  CheckCircle2,
  Compass,
  RotateCcw,
  ShieldCheck,
  Heart,
  Sunrise,
  Sunset,
  FileText,
  Calendar,
  ArrowRight,
  Star,
} from 'lucide-react';

const FAST_CATEGORIES = [
  {
    id: 'ramadan',
    labelKey: 'islamic.fastTypes.ramadan',
    shortKey: 'islamic.fastTypesShort.ramadan',
    icon: Moon,
    badgeVariant: 'emerald',
    defaultName: 'Ramadan (Farz)',
    desc: 'Obligatory month of fasting',
    virtue: 'Pillar of Islam · Immense Reward',
    colorClasses: {
      active: 'border-emerald-500/80 bg-emerald-500/15 text-emerald-950 dark:text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm shadow-emerald-500/10',
      iconBox: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
      hover: 'hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:shadow-emerald-500/10',
      badge: 'bg-emerald-500/15 text-emerald-950 dark:text-emerald-300 border-emerald-500/40 font-bold',
      pill: 'bg-emerald-500/15 text-emerald-950 dark:text-emerald-300 border-emerald-500/35 font-bold',
      borderGlow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    },
  },
  {
    id: 'sunnah_mon_thu',
    labelKey: 'islamic.fastTypes.sunnah_mon_thu',
    shortKey: 'islamic.fastTypesShort.sunnah_mon_thu',
    icon: Sparkles,
    badgeVariant: 'amber',
    defaultName: 'Mon & Thu Sunnah',
    desc: 'Weekly prophetic Sunnah practice',
    virtue: 'Deeds presented to Allah (Tirmidhi)',
    colorClasses: {
      active: 'border-amber-500/80 bg-amber-500/15 text-amber-950 dark:text-amber-300 ring-1 ring-amber-500/40 shadow-sm shadow-amber-500/10',
      iconBox: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30',
      hover: 'hover:border-amber-500/50 hover:bg-amber-500/5 hover:shadow-amber-500/10',
      badge: 'bg-amber-500/15 text-amber-950 dark:text-amber-300 border-amber-500/40 font-bold',
      pill: 'bg-amber-500/15 text-amber-950 dark:text-amber-300 border-amber-500/35 font-bold',
      borderGlow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
    },
  },
  {
    id: 'ayyam_al_beed',
    labelKey: 'islamic.fastTypes.ayyam_al_beed',
    shortKey: 'islamic.fastTypesShort.ayyam_al_beed',
    icon: Moon,
    badgeVariant: 'primary',
    defaultName: 'Ayyam al-Beed (13-15)',
    desc: 'Three white days of lunar month',
    virtue: 'Equal to fasting the entire year',
    colorClasses: {
      active: 'border-[#007EA7]/80 bg-[#007EA7]/15 text-[#003459] dark:text-[#76DDFF] ring-1 ring-[#007EA7]/40 shadow-sm shadow-[#007EA7]/10',
      iconBox: 'bg-[#007EA7]/15 text-[#007EA7] dark:text-[#76DDFF] border border-[#007EA7]/30',
      hover: 'hover:border-[#007EA7]/50 hover:bg-[#007EA7]/5 hover:shadow-[#007EA7]/10',
      badge: 'bg-[#007EA7]/15 text-[#003459] dark:text-[#76DDFF] border-[#007EA7]/40 font-bold',
      pill: 'bg-[#007EA7]/15 text-[#003459] dark:text-[#76DDFF] border-[#007EA7]/35 font-bold',
      borderGlow: 'hover:shadow-[0_0_20px_rgba(0,126,167,0.15)]',
      gradient: 'from-[#007EA7]/20 via-[#007EA7]/5 to-transparent',
    },
  },
  {
    id: 'shawwal',
    labelKey: 'islamic.fastTypes.shawwal',
    shortKey: 'islamic.fastTypesShort.shawwal',
    icon: Star,
    badgeVariant: 'emerald',
    defaultName: '6 Days of Shawwal',
    desc: 'Virtuous fasts following Ramadan',
    virtue: 'Reward of a full year (Muslim)',
    colorClasses: {
      active: 'border-sky-500/80 bg-sky-500/15 text-[#003459] dark:text-sky-300 ring-1 ring-sky-500/40 shadow-sm shadow-sky-500/10',
      iconBox: 'bg-sky-500/15 text-[#007EA7] dark:text-sky-400 border border-sky-500/30',
      hover: 'hover:border-sky-500/50 hover:bg-sky-500/5 hover:shadow-sky-500/10',
      badge: 'bg-sky-500/15 text-[#003459] dark:text-sky-300 border-sky-500/40 font-bold',
      pill: 'bg-sky-500/15 text-[#003459] dark:text-sky-300 border-sky-500/35 font-bold',
      borderGlow: 'hover:shadow-[0_0_20px_rgba(14,165,233,0.15)]',
      gradient: 'from-sky-500/20 via-sky-500/5 to-transparent',
    },
  },
  {
    id: 'ashura',
    labelKey: 'islamic.fastTypes.ashura',
    shortKey: 'islamic.fastTypesShort.ashura',
    icon: ShieldCheck,
    badgeVariant: 'purple',
    defaultName: "Ashura & Tasu'a",
    desc: '9th & 10th of Muharram',
    virtue: 'Expiates previous year sins',
    colorClasses: {
      active: 'border-purple-500/80 bg-purple-500/15 text-purple-950 dark:text-purple-300 ring-1 ring-purple-500/40 shadow-sm shadow-purple-500/10',
      iconBox: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30',
      hover: 'hover:border-purple-500/50 hover:bg-purple-500/5 hover:shadow-purple-500/10',
      badge: 'bg-purple-500/15 text-purple-950 dark:text-purple-300 border-purple-500/40 font-bold',
      pill: 'bg-purple-500/15 text-purple-950 dark:text-purple-300 border-purple-500/35 font-bold',
      borderGlow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]',
      gradient: 'from-purple-500/20 via-purple-500/5 to-transparent',
    },
  },
  {
    id: 'arafah',
    labelKey: 'islamic.fastTypes.arafah',
    shortKey: 'islamic.fastTypesShort.arafah',
    icon: Compass,
    badgeVariant: 'rose',
    defaultName: 'Day of Arafah',
    desc: '9th of Dhul Hijjah',
    virtue: 'Expels 2 years of sins (Muslim)',
    colorClasses: {
      active: 'border-rose-500/80 bg-rose-500/15 text-rose-950 dark:text-rose-300 ring-1 ring-rose-500/40 shadow-sm shadow-rose-500/10',
      iconBox: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30',
      hover: 'hover:border-rose-500/50 hover:bg-rose-500/5 hover:shadow-rose-500/10',
      badge: 'bg-rose-500/15 text-rose-950 dark:text-rose-300 border-rose-500/40 font-bold',
      pill: 'bg-rose-500/15 text-rose-950 dark:text-rose-300 border-rose-500/35 font-bold',
      borderGlow: 'hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]',
      gradient: 'from-rose-500/20 via-rose-500/5 to-transparent',
    },
  },
  {
    id: 'qada',
    labelKey: 'islamic.fastTypes.qada',
    shortKey: 'islamic.fastTypesShort.qada',
    icon: RotateCcw,
    badgeVariant: 'indigo',
    defaultName: 'Qada Make-up',
    desc: 'Make-up for missed Ramadan days',
    virtue: 'Fulfill obligatory spiritual debt',
    colorClasses: {
      active: 'border-[#003459]/80 bg-[#003459]/15 text-[#001E34] dark:text-[#8FDFFF] ring-1 ring-[#003459]/40 shadow-sm shadow-[#003459]/10',
      iconBox: 'bg-[#003459]/15 text-[#003459] dark:text-[#8FDFFF] border border-[#003459]/30',
      hover: 'hover:border-[#003459]/50 hover:bg-[#003459]/5 hover:shadow-[#003459]/10',
      badge: 'bg-[#003459]/15 text-[#001E34] dark:text-[#8FDFFF] border-[#003459]/40 font-bold',
      pill: 'bg-[#003459]/15 text-[#001E34] dark:text-[#8FDFFF] border-[#003459]/35 font-bold',
      borderGlow: 'hover:shadow-[0_0_20px_rgba(0,52,89,0.15)]',
      gradient: 'from-[#003459]/20 via-[#003459]/5 to-transparent',
    },
  },
  {
    id: 'nazr',
    labelKey: 'islamic.fastTypes.nazr',
    shortKey: 'islamic.fastTypesShort.nazr',
    icon: Heart,
    badgeVariant: 'warning',
    defaultName: 'Nazr (Vow)',
    desc: 'Spiritual vow / fulfillment of pledge',
    virtue: 'Fulfill sworn spiritual covenant',
    colorClasses: {
      active: 'border-orange-500/80 bg-orange-500/15 text-orange-950 dark:text-orange-300 ring-1 ring-orange-500/40 shadow-sm shadow-orange-500/10',
      iconBox: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30',
      hover: 'hover:border-orange-500/50 hover:bg-orange-500/5 hover:shadow-orange-500/10',
      badge: 'bg-orange-500/15 text-orange-950 dark:text-orange-300 border-orange-500/40 font-bold',
      pill: 'bg-orange-500/15 text-orange-950 dark:text-orange-300 border-orange-500/35 font-bold',
      borderGlow: 'hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]',
      gradient: 'from-orange-500/20 via-orange-500/5 to-transparent',
    },
  },
  {
    id: 'nafl',
    labelKey: 'islamic.fastTypes.nafl',
    shortKey: 'islamic.fastTypesShort.nafl',
    icon: Sparkles,
    badgeVariant: 'neutral',
    defaultName: 'Nafl / Voluntary',
    desc: 'General voluntary fasting for reward',
    virtue: 'Draw closer to Allah (Hadith Qudsi)',
    colorClasses: {
      active: 'border-teal-500/80 bg-teal-500/15 text-teal-950 dark:text-teal-300 ring-1 ring-teal-500/40 shadow-sm shadow-teal-500/10',
      iconBox: 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30',
      hover: 'hover:border-teal-500/50 hover:bg-teal-500/5 hover:shadow-teal-500/10',
      badge: 'bg-teal-500/15 text-teal-950 dark:text-teal-300 border-teal-500/40 font-bold',
      pill: 'bg-teal-500/15 text-teal-950 dark:text-teal-300 border-teal-500/35 font-bold',
      borderGlow: 'hover:shadow-[0_0_20px_rgba(20,184,166,0.15)]',
      gradient: 'from-teal-500/20 via-teal-500/5 to-transparent',
    },
  },
];

const FAST_STATUSES = [
  {
    value: 'completed',
    labelKey: 'islamic.fastStatuses.completed',
    defaultLabel: 'Completed (Full Fast)',
    icon: CheckCircle2,
    activeClass:
      'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500/30 scale-102',
    inactiveClass: 'bg-subtle/80 hover:bg-surface text-secondary hover:text-primary border-theme',
  },
  {
    value: 'fasting',
    labelKey: 'islamic.fastStatuses.fasting',
    defaultLabel: 'Fasting (In Progress)',
    icon: Moon,
    activeClass:
      'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-500 shadow-md shadow-amber-500/20 ring-2 ring-amber-500/30 scale-102',
    inactiveClass: 'bg-subtle/80 hover:bg-surface text-secondary hover:text-primary border-theme',
  },
  {
    value: 'broken',
    labelKey: 'islamic.fastStatuses.broken',
    defaultLabel: 'Exempt / Broken',
    icon: Minus,
    activeClass:
      'bg-gradient-to-r from-rose-600 to-pink-600 text-white border-rose-500 shadow-md shadow-rose-500/20 ring-2 ring-rose-500/30 scale-102',
    inactiveClass: 'bg-subtle/80 hover:bg-surface text-secondary hover:text-primary border-theme',
  },
];

export const IslamicFastingTracker = ({ selectedDate }) => {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const activeDate = selectedDate || getFormattedDate();


  const [fastLogs, setFastLogs] = useState([]);
  const [fastSummary, setFastSummary] = useState({
    totalCompleted: 0,
    ramadanCount: 0,
    sunnahCount: 0,
    qadaCount: 0,
    nazrCount: 0,
    breakdown: {},
  });
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isFastModalOpen, setIsFastModalOpen] = useState(false);
  const [editingFastId, setEditingFastId] = useState(null);
  const [fastDate, setFastDate] = useState(activeDate);
  const [fastType, setFastType] = useState('nafl');
  const [fastStatus, setFastStatus] = useState('completed');
  const [fastSuhoorTime, setFastSuhoorTime] = useState('');
  const [fastIftarTime, setFastIftarTime] = useState('');
  const [fastNotes, setFastNotes] = useState('');
  const [fastFilter, setFastFilter] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [fastsRes, fastSummaryRes] = await Promise.all([
        api.get('/islamic/fasts'),
        api.get('/islamic/fasts/summary'),
      ]);
      setFastLogs(fastsRes.data || []);
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
      console.error('Failed to fetch Islamic fasting data', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Today's fast log
  const todayFast = fastLogs.find((f) => f.date === activeDate);

  const handleQuickTodayFast = async (status, type) => {
    const prevLogs = [...fastLogs];
    const chosenType = type || todayFast?.type || 'nafl';

    if (status === 'none') {
      setFastLogs((prev) => prev.filter((f) => f.date !== activeDate));
    } else {
      const existing = fastLogs.find((f) => f.date === activeDate);
      if (existing) {
        setFastLogs((prev) =>
          prev.map((f) =>
            f.date === activeDate ? { ...f, status, type: chosenType } : f
          )
        );
      } else {
        setFastLogs((prev) => [
          {
            _id: 'temp-' + Date.now(),
            date: activeDate,
            type: chosenType,
            status,
            notes: '',
          },
          ...prev,
        ]);
      }
    }

    if (!user) {
      notifyStreakUpdate();
      notifyGuestAction('Fasting status', `set to ${status}`);
      return;
    }

    try {
      await api.post('/islamic/fasts', {
        date: activeDate,
        status,
        type: chosenType,
      });
      notifyStreakUpdate();
      showSuccessToast(
        status === 'completed' ? 'Fast logged as Completed! MashaAllah' : `Fast status set to ${status}`,
        'Fasting Log'
      );
      fetchData(false);
    } catch (err) {
      console.error('Failed to quick-toggle fast status', err);
      notifyError(err, 'Failed to update fasting status');
      setFastLogs(prevLogs);
    }
  };

  const handleOpenCreateFastModal = (defaultType = 'nafl') => {
    setEditingFastId(null);
    setFastDate(activeDate);
    setFastType(defaultType);
    setFastStatus('completed');
    setFastSuhoorTime('');
    setFastIftarTime('');
    setFastNotes('');
    setModalError('');
    setIsFastModalOpen(true);
  };

  const handleEditFast = (fast) => {
    setEditingFastId(fast._id);
    setFastDate(fast.date || activeDate);
    setFastType(fast.type || 'nafl');
    setFastStatus(fast.status || 'completed');
    setFastSuhoorTime(fast.suhoorTime || '');
    setFastIftarTime(fast.iftarTime || '');
    setFastNotes(fast.notes || '');
    setModalError('');
    setIsFastModalOpen(true);
  };

  const handleSaveFast = async (e) => {
    e.preventDefault();
    const payload = {
      date: fastDate,
      type: fastType,
      status: fastStatus,
      suhoorTime: fastSuhoorTime.trim(),
      iftarTime: fastIftarTime.trim(),
      notes: fastNotes.trim(),
    };

    if (!user) {
      const mockFast = {
        _id: editingFastId || `guest-fast-${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
      };
      setFastLogs((prev) => {
        const filtered = prev.filter(
          (f) => f.date !== fastDate && f._id !== (editingFastId || mockFast._id)
        );
        return [mockFast, ...filtered];
      });
      setIsFastModalOpen(false);
      notifyGuestAction('Fast record', editingFastId ? 'updated' : 'created');
      return;
    }

    setIsSaving(true);
    setModalError('');
    try {
      const res = await api.post('/islamic/fasts', payload);

      if (res.data) {
        setFastLogs((prev) => {
          const filtered = prev.filter(
            (f) => f.date !== fastDate && f._id !== (editingFastId || res.data._id)
          );
          return [res.data, ...filtered];
        });
      }

      if (editingFastId) {
        notifyUpdated('Fast record');
      } else {
        notifyCreated('Fast record');
      }

      setIsFastModalOpen(false);
      notifyStreakUpdate();
      fetchData(false);
    } catch (err) {
      console.error('Failed to save Islamic fast', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to save fast. Please try again.';
      setModalError(errMsg);
      notifyError(err, errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFast = async (fastId) => {
    if (!fastId) return;
    const confirmed = await confirmDelete('Fast record');
    if (!confirmed) return;

    setFastLogs((prev) => prev.filter((f) => f._id !== fastId));

    if (!user) {
      notifyGuestAction('Fast record', 'deleted');
      return;
    }

    try {
      await api.delete(`/islamic/fasts/${fastId}`);
      notifyDeleted('Fast record');
      notifyStreakUpdate();
      fetchData(false);
    } catch (err) {
      console.error('Failed to delete Islamic fast', err);
      notifyError(err, 'Failed to delete fast');
      fetchData(false);
    }
  };


  // Filtered fast list
  const filteredFasts = useMemo(() => {
    return fastLogs.filter((f) => {
      if (fastFilter === 'all') return true;
      if (fastFilter === 'sunnah') {
        return ['sunnah_mon_thu', 'ayyam_al_beed', 'shawwal', 'ashura', 'arafah', 'nafl'].includes(
          f.type
        );
      }
      return f.type === fastFilter;
    });
  }, [fastLogs, fastFilter]);

  // Counts for filters
  const filterCounts = useMemo(() => {
    return {
      all: fastLogs.length,
      ramadan: fastLogs.filter((f) => f.type === 'ramadan').length,
      sunnah: fastLogs.filter((f) =>
        ['sunnah_mon_thu', 'ayyam_al_beed', 'shawwal', 'ashura', 'arafah', 'nafl'].includes(f.type)
      ).length,
      ayyam_al_beed: fastLogs.filter((f) => f.type === 'ayyam_al_beed').length,
      qada: fastLogs.filter((f) => f.type === 'qada').length,
    };
  }, [fastLogs]);

  const totalKept =
    fastSummary.totalCompleted || fastLogs.filter((f) => f.status === 'completed').length;

  if (loading) {
    return <LoadingScreen fullScreen={false} message="Loading Fasting (Sawm) records..." />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <PageHeader
        category={t('categories.spiritual', 'Spiritual Discipline')}
        title={t('islamic.fastTrackerTitle', 'Islamic Fasting Tracker (Sawm / Siyam)')}
        description={`${t(
          'islamic.fastTrackerSubtitle',
          'Track obligatory Ramadan, Sunnah days (Mon/Thu & Ayyam al-Beed), Qada make-up, and voluntary fasts.'
        )} (${formatDisplayDate(activeDate)})`}
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="secondary"
              size="md"
              icon={Compass}
              onClick={() => navigate('/islamic')}
            >
              {t('nav.adhkar', 'Adhkar & Tasbih')}
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={Sparkles}
              onClick={() => navigate('/qada-matrix')}
            >
              {t('qada.title', 'Salah & Qada Matrix')}
            </Button>
            <Button
              variant="gradient"
              size="md"
              icon={Plus}
              onClick={() => handleOpenCreateFastModal('nafl')}
            >
              {t('islamic.logFast', 'Log Fast')}
            </Button>
          </div>
        }
      />

      {/* Top Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Fasts */}
        <div className="rounded-2xl bg-surface border border-theme p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-theme-strong group">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-muted uppercase tracking-wider block">
                {t('islamic.totalCompletedFasts', 'Total Fasts Completed')}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                  {totalKept}
                </span>
                <span className="text-xs font-semibold text-amber-500">
                  {totalKept === 1 ? 'Day' : 'Days'}
                </span>
              </div>
              <p className="text-[11px] text-secondary font-medium">All-time verified fasts</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-xs">
              <Moon className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Ramadan Fasts */}
        <div className="rounded-2xl bg-surface border border-theme p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-theme-strong group">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-muted uppercase tracking-wider block">
                {t('islamic.ramadanFasts', 'Ramadan Fasts')}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                  {fastSummary.ramadanCount || 0}
                </span>
                <span className="text-xs font-semibold text-emerald-500">
                  {fastSummary.ramadanCount === 1 ? 'Day' : 'Days'}
                </span>
              </div>
              <p className="text-[11px] text-secondary font-medium">Fard obligatory fasts</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Sunnah & Nafl */}
        <div className="rounded-2xl bg-surface border border-theme p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-theme-strong group">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-muted uppercase tracking-wider block">
                {t('islamic.sunnahNaflFasts', 'Sunnah & Nafl Fasts')}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                  {fastSummary.sunnahCount || 0}
                </span>
                <span className="text-xs font-semibold text-indigo-500">
                  {fastSummary.sunnahCount === 1 ? 'Day' : 'Days'}
                </span>
              </div>
              <p className="text-[11px] text-secondary font-medium">Mon/Thu, Ayyam al-Beed, etc.</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Qada Make-up */}
        <div className="rounded-2xl bg-surface border border-theme p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-theme-strong group">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-muted uppercase tracking-wider block">
                {t('islamic.qadaFasts', 'Qada Fasts')}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                  {fastSummary.qadaCount || 0}
                </span>
                <span className="text-xs font-semibold text-purple-500">
                  {fastSummary.qadaCount === 1 ? 'Day' : 'Days'}
                </span>
              </div>
              <p className="text-[11px] text-secondary font-medium">Historical fasts recovered</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-500/15 text-purple-500 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-xs">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Today's Fast Status Hero Solid Banner */}
      <div className="rounded-3xl bg-surface border border-amber-500/40 p-4 sm:p-7 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4.5">
            {/* Solid Moon / Status Icon */}
            <div className="relative shrink-0">
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-md transition-all ${todayFast?.status === 'completed'
                  ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                  : todayFast?.status === 'fasting'
                    ? 'bg-amber-500 text-white shadow-amber-500/30 ring-2 ring-amber-400/50'
                    : 'bg-subtle border border-theme text-amber-500'
                  }`}
              >
                {todayFast?.status === 'completed' ? (
                  <CheckCircle2 className="w-8 h-8" />
                ) : (
                  <Moon className="w-8 h-8" />
                )}
              </div>
              {todayFast?.status === 'fasting' && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-surface"></span>
                </span>
              )}
            </div>

            {/* Status Information */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg text-primary tracking-tight">
                  {t('islamic.todayFastingStatus', "Today's Fasting Status")}
                </h3>
                {todayFast ? (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${todayFast.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                      : todayFast.status === 'fasting'
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40'
                      }`}
                  >
                    {todayFast.status === 'completed' && <Check className="w-3.5 h-3.5" />}
                    {todayFast.status === 'completed'
                      ? t('islamic.fastCompleted', 'Fast Completed (Alhamdulillah)')
                      : todayFast.status === 'fasting'
                        ? t('islamic.fastingToday', 'Fasting Today')
                        : t('islamic.fastStatuses.broken', 'Exempt / Broken')}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-subtle text-muted border border-theme">
                    {t('islamic.notFasting', 'Not Fasting')}
                  </span>
                )}
              </div>

              <div className="text-xs text-secondary font-medium">
                {todayFast ? (
                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    <span className="font-bold text-accent px-2 py-0.5 rounded-lg bg-accent/10 border border-accent/20">
                      {t(
                        FAST_CATEGORIES.find((c) => c.id === todayFast.type)?.labelKey,
                        FAST_CATEGORIES.find((c) => c.id === todayFast.type)?.defaultName
                      )}
                    </span>
                    {todayFast.suhoorTime && (
                      <span className="flex items-center gap-1 text-muted">
                        <Sunrise className="w-3.5 h-3.5 text-amber-500" /> Suhoor: {todayFast.suhoorTime}
                      </span>
                    )}
                    {todayFast.iftarTime && (
                      <span className="flex items-center gap-1 text-muted">
                        <Sunset className="w-3.5 h-3.5 text-indigo-400" /> Iftar: {todayFast.iftarTime}
                      </span>
                    )}
                    {todayFast.notes && (
                      <span className="italic text-secondary">· "{todayFast.notes}"</span>
                    )}
                  </div>
                ) : (
                  <p className="text-muted">
                    {formatDisplayDate(activeDate)} · Click a quick button to record today's fast.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => handleQuickTodayFast('fasting')}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-xs ${todayFast?.status === 'fasting'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400 shadow-md shadow-amber-500/25 ring-2 ring-amber-500/40 scale-102'
                : 'bg-surface/90 hover:bg-surface text-secondary hover:text-primary border-theme hover:border-amber-500/40 hover:shadow-md'
                }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              {t('islamic.fastingToday', 'Fasting Today')}
            </button>

            <button
              type="button"
              onClick={() => handleQuickTodayFast('completed')}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-xs ${todayFast?.status === 'completed'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-500/40 scale-102'
                : 'bg-surface/90 hover:bg-surface text-secondary hover:text-primary border-theme hover:border-emerald-500/40 hover:shadow-md'
                }`}
            >
              <Check className="w-4 h-4 text-emerald-400" />
              {t('islamic.fastCompleted', 'Fast Completed (Alhamdulillah)')}
            </button>

            {todayFast && (
              <button
                type="button"
                onClick={() => handleQuickTodayFast('none')}
                className="p-2.5 text-xs font-bold rounded-xl bg-surface/90 hover:bg-rose-500/10 text-rose-500 hover:text-rose-600 border border-theme hover:border-rose-500/30 transition-all cursor-pointer shadow-xs"
                title="Remove today's fast status"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sunnah & Prescribed Fasting Types Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <h3 className="text-base sm:text-lg font-bold text-primary">
                {t('islamic.sunnahGuideTitle', 'Sunnah Fasting Recommendations')}
              </h3>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Click any category to quickly record or schedule your fast
            </p>
          </div>
        </div>

        {/* 3x3 Luxury Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {FAST_CATEGORIES.map((cat) => {
            const count =
              fastSummary.breakdown?.[cat.id] ||
              fastLogs.filter((f) => f.type === cat.id && f.status === 'completed').length;
            const IconComponent = cat.icon;
            const theme = cat.colorClasses;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleOpenCreateFastModal(cat.id)}
                className={`relative overflow-hidden p-4 sm:p-4.5 rounded-2xl bg-surface/90 border border-theme text-start flex flex-col justify-between space-y-3.5 group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${theme.borderGlow} ${theme.hover}`}
              >
                {/* Subtle Card Background Glow */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${theme.gradient} rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500`}
                />

                <div className="relative z-10 flex items-start justify-between gap-3 w-full">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-xs ${theme.iconBox}`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border transition-all ${theme.badge}`}
                  >
                    {count} {count === 1 ? 'done' : 'done'}
                  </span>
                </div>

                <div className="relative z-10 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-primary block truncate group-hover:text-accent transition-colors">
                      {t(cat.shortKey, cat.defaultName)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </div>
                  <span className="text-xs text-secondary block line-clamp-1">
                    {cat.desc}
                  </span>
                  {cat.virtue && (
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md border mt-1 ${theme.pill}`}>
                      {cat.virtue}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fasting History & Logs Section */}
      <Card
        hover
        title={t('islamic.fastHistory', 'Fasting History & Logs')}
        subtitle={t('islamic.fastHistorySubtitle', 'Past recorded fasts and spiritual milestones')}
        icon={Calendar}
        action={
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {[
              { id: 'all', label: t('islamic.filterAll', 'All Fasts'), count: filterCounts.all },
              { id: 'ramadan', label: t('islamic.fastTypesShort.ramadan', 'Ramadan'), count: filterCounts.ramadan },
              { id: 'sunnah', label: 'Sunnah / Nafl', count: filterCounts.sunnah },
              { id: 'ayyam_al_beed', label: t('islamic.fastTypesShort.ayyam_al_beed', 'Ayyam al-Beed (13–15)'), count: filterCounts.ayyam_al_beed },
              { id: 'qada', label: t('islamic.fastTypesShort.qada', 'Qada Make-up'), count: filterCounts.qada },
            ].map((flt) => (
              <button
                key={flt.id}
                type="button"
                onClick={() => setFastFilter(flt.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer border flex items-center gap-1.5 shrink-0 ${fastFilter === flt.id
                  ? 'bg-accent text-white border-accent shadow-sm shadow-accent/20'
                  : 'bg-surface text-secondary hover:text-primary hover:bg-subtle border-theme'
                  }`}
              >
                <span>{flt.label}</span>
                {flt.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${fastFilter === flt.id ? 'bg-white/20 text-white' : 'bg-subtle text-secondary border border-theme'
                      }`}
                  >
                    {flt.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        }
      >
        {filteredFasts.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-2xl bg-subtle/40 border border-theme text-center flex flex-col items-center justify-center mt-2">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-3.5 shadow-xs">
              <Moon className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-primary mb-1">
              {t('islamic.noFastsRecorded', 'No Islamic fasts recorded yet')}
            </h4>
            <p className="text-xs text-secondary max-w-md mx-auto mb-4 leading-relaxed">
              {t(
                'islamic.noFastsDesc',
                'Log your Ramadan, Monday/Thursday Sunnah, Ayyam al-Beed, or Qada fasts to keep track of your spiritual journey.'
              )}
            </p>
            <Button
              variant="gradient"
              size="sm"
              icon={Plus}
              onClick={() => handleOpenCreateFastModal('nafl')}
            >
              {t('islamic.logFirstFast', 'Log First Fast')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-2">
            {filteredFasts.map((fast) => {
              const cat = FAST_CATEGORIES.find((c) => c.id === fast.type) || FAST_CATEGORIES[0];
              const IconComp = cat.icon;
              const theme = cat.colorClasses;

              return (
                <div
                  key={fast._id}
                  className="p-4.5 rounded-2xl bg-surface/95 border border-theme hover:border-theme-strong hover:shadow-lg transition-all duration-200 flex flex-col justify-between space-y-3 relative group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform ${theme.iconBox}`}
                      >
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-primary block truncate">
                          {t(cat.shortKey, cat.defaultName)}
                        </span>
                        <span className="text-xs text-secondary font-medium block truncate mt-0.5">
                          {formatDisplayDate(fast.date)}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant={
                        fast.status === 'completed'
                          ? 'success'
                          : fast.status === 'fasting'
                            ? 'amber'
                            : 'danger'
                      }
                      size="sm"
                    >
                      {fast.status === 'completed'
                        ? 'Completed'
                        : fast.status === 'fasting'
                          ? 'In Progress'
                          : 'Broken'}
                    </Badge>
                  </div>

                  {fast.notes && (
                    <p className="text-xs text-secondary italic line-clamp-2 bg-subtle/80 p-3 rounded-xl border border-theme/60">
                      "{fast.notes}"
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-theme/40 text-xs">
                    {(fast.suhoorTime || fast.iftarTime) ? (
                      <div className="flex items-center gap-3 text-[11px] text-muted flex-wrap">
                        {fast.suhoorTime && (
                          <span className="flex items-center gap-1 font-medium">
                            <Sunrise className="w-3.5 h-3.5 text-amber-500" /> {fast.suhoorTime}
                          </span>
                        )}
                        {fast.iftarTime && (
                          <span className="flex items-center gap-1 font-medium">
                            <Sunset className="w-3.5 h-3.5 text-indigo-400" /> {fast.iftarTime}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted">{cat.desc}</span>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditFast(fast)}
                        className="p-1.5 rounded-lg text-secondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                        title="Edit fast"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFast(fast._id)}
                        className="p-1.5 rounded-lg text-secondary hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete fast log"
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

      {/* ========================================================================= */}
      {/* MODALS SECTION                                                           */}
      {/* ========================================================================= */}

      {/* Log / Edit Islamic Fast Modal */}
      <Modal
        isOpen={isFastModalOpen}
        onClose={() => setIsFastModalOpen(false)}
        maxWidth="max-w-5xl"
        title={
          editingFastId
            ? t('islamic.editFast', 'Edit Fast Log')
            : t('islamic.logFast', 'Log Islamic Fast')
        }
        subtitle={
          editingFastId
            ? t('islamic.editFastSubtitle', 'Update fasting category and reflection')
            : t('islamic.logFastSubtitle', 'Record fasting category, status, and notes')
        }
      >
        <form onSubmit={handleSaveFast} className="space-y-4 pt-1">
          {/* Main 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Left Column: Date, Status, Times & Reflection */}
            <div className="space-y-3.5 p-3.5 rounded-2xl bg-subtle border border-theme">
              <span className="text-[11px] font-extrabold text-secondary uppercase tracking-wider block">
                1. Fasting Details
              </span>

              <DateInput
                label={t('common.date', 'Date')}
                value={fastDate}
                onChange={setFastDate}
              />

              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                  {t('islamic.fastStatus', 'Fast Status')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  {FAST_STATUSES.map((st) => {
                    const isSelected = fastStatus === st.value;
                    const IconComponent = st.icon;

                    return (
                      <button
                        key={st.value}
                        type="button"
                        onClick={() => setFastStatus(st.value)}
                        className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs ${isSelected ? st.activeClass : st.inactiveClass
                          }`}
                      >
                        <IconComponent className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{t(st.labelKey, st.defaultLabel)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Sunrise className="w-3.5 h-3.5 text-amber-500" />
                    {t('islamic.suhoorTimeLabel', 'Suhoor (Optional)')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 04:45 AM"
                    value={fastSuhoorTime}
                    onChange={(e) => setFastSuhoorTime(e.target.value)}
                    className="input-base text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Sunset className="w-3.5 h-3.5 text-indigo-400" />
                    {t('islamic.iftarTimeLabel', 'Iftar (Optional)')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 06:18 PM"
                    value={fastIftarTime}
                    onChange={(e) => setFastIftarTime(e.target.value)}
                    className="input-base text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-secondary" />
                  {t('common.notes', 'Personal Notes & Duas')}
                </label>
                <textarea
                  rows={2}
                  placeholder={t(
                    'islamic.notesPlaceholder',
                    'e.g. Duas made, physical ease, intention notes...'
                  )}
                  value={fastNotes}
                  onChange={(e) => setFastNotes(e.target.value)}
                  className="textarea-base min-h-[60px] text-xs"
                />
              </div>
            </div>

            {/* Right Column: Fast Category Selection */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-subtle border border-theme flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-secondary uppercase tracking-wider block mb-2">
                  2. {t('islamic.fastCategory', 'Select Fast Category')}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FAST_CATEGORIES.map((cat) => {
                    const isSelected = fastType === cat.id;
                    const IconComp = cat.icon;
                    const theme = cat.colorClasses;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFastType(cat.id)}
                        className={`p-2.5 rounded-xl border text-start flex items-center justify-between gap-2 transition-all duration-150 cursor-pointer select-none ${isSelected
                          ? theme.active
                          : `bg-surface border-theme text-secondary hover:text-primary hover:border-[var(--color-border-hover)] shadow-2xs`
                          }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${theme.iconBox}`}
                          >
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-bold block text-primary truncate">
                              {t(cat.shortKey, cat.defaultName)}
                            </span>

                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-accent text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {modalError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-subtle">
            <span className="text-xs text-secondary font-medium hidden sm:inline">
              Selected: <strong className="text-primary font-bold">{FAST_CATEGORIES.find(c => c.id === fastType)?.defaultName || 'Islamic Fast'}</strong>
            </span>
            <div className="flex items-center gap-2.5 ml-auto">
              <Button variant="secondary" size="md" onClick={() => setIsFastModalOpen(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" variant="gradient" size="md" loading={isSaving}>
                {editingFastId ? t('common.update', 'Update Fast') : t('common.save', 'Save Fast')}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default IslamicFastingTracker;
