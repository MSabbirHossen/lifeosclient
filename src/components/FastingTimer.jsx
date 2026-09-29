import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { useLanguage } from '../context/LanguageContext';
import {
  Clock,
  Play,
  Square,
  RotateCcw,
  Sparkles,
  Utensils,
  Moon,
  Settings2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Plus,
  Minus,
  X,
  Trophy,
  BarChart2,
  Eye,
  EyeOff,
  Edit2,
  Calendar,
  Check,
} from 'lucide-react';
import {
  getFastingStats,
  getFastingState,
  fetchFastingData,
  updateFastingState,
  recordEndedFast,
  adjustFastingCount,
  subscribeFastingUpdates,
} from '../utils/fastingService';

export const FastingTimer = ({
  compact = false,
  allowBlur = false,
  isBlurred: controlledBlurred,
  onToggleBlur,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [internalBlurred, setInternalBlurred] = useState(false);
  const isBlurred = controlledBlurred !== undefined ? controlledBlurred : internalBlurred;

  const handleToggleBlur = (e) => {
    e?.stopPropagation?.();
    if (onToggleBlur) {
      onToggleBlur(!isBlurred);
    } else {
      setInternalBlurred(!internalBlurred);
    }
  };

  const FASTING_PROTOCOLS = [
    { id: '16:8', label: t('fasting.protocolStandard'), fastHours: 16, eatHours: 8 },
    { id: '18:6', label: t('fasting.protocolExtended'), fastHours: 18, eatHours: 6 },
    { id: '20:4', label: t('fasting.protocolWarrior'), fastHours: 20, eatHours: 4 },
    { id: '12:12', label: t('fasting.protocolCircadian'), fastHours: 12, eatHours: 12 },
    { id: '24:0', label: t('fasting.protocolOMAD'), fastHours: 24, eatHours: 0 },
    { id: 'custom', label: t('fasting.protocolCustom'), fastHours: 16, eatHours: 8 },
  ];

  const [selectedProtocolId, setSelectedProtocolId] = useState('16:8');
  const [customHours, setCustomHours] = useState(16);
  const [showSettings, setShowSettings] = useState(false);
  const [fastingStats, setFastingStats] = useState(() => getFastingStats());
  const [endedSummary, setEndedSummary] = useState(null);
  const [fastingState, setFastingState] = useState(() => getFastingState());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Manual start date & time editor state
  const toLocalDatetimeValue = (date) => {
    const d = date ? new Date(date) : new Date();
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [isEditingTime, setIsEditingTime] = useState(false);
  const [manualStartTime, setManualStartTime] = useState(() =>
    fastingState.startTime ? toLocalDatetimeValue(fastingState.startTime) : toLocalDatetimeValue(new Date())
  );

  const handleOpenTimeEditor = () => {
    const currentStart = fastingState.isActive && fastingState.startTime
      ? fastingState.startTime
      : new Date().toISOString();
    setManualStartTime(toLocalDatetimeValue(currentStart));
    setIsEditingTime(true);
  };

  const applyTimeOffset = (hoursOffset, minutesOffset = 0) => {
    const d = new Date();
    d.setHours(d.getHours() + hoursOffset);
    d.setMinutes(d.getMinutes() + minutesOffset);
    setManualStartTime(toLocalDatetimeValue(d));
  };

  const setYesterdayEvening = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(20, 0, 0, 0);
    setManualStartTime(toLocalDatetimeValue(d));
  };

  const handleSaveManualTime = async () => {
    if (!manualStartTime) return;
    const newDate = new Date(manualStartTime);
    if (isNaN(newDate.getTime())) return;

    if (fastingState.isActive) {
      const updatedState = {
        ...fastingState,
        startTime: newDate.toISOString(),
        targetHours: activeTargetHours,
      };
      setFastingState(updatedState);
      await updateFastingState(updatedState);
    } else {
      const newState = {
        isActive: true,
        startTime: newDate.toISOString(),
        protocolId: selectedProtocolId,
        targetHours: activeTargetHours,
      };
      setFastingState(newState);
      await updateFastingState(newState);
    }
    setIsEditingTime(false);
  };

  // Fetch fresh fasting data on mount and poll for cross-device updates
  useEffect(() => {
    fetchFastingData().then((res) => {
      if (res?.activeState) setFastingState(res.activeState);
      if (res?.stats) setFastingStats(res.stats);
    });

    // Cross-device periodic sync every 20 seconds
    const syncInterval = setInterval(() => {
      if (localStorage.getItem('lifeos_token')) {
        fetchFastingData().then((res) => {
          if (res?.activeState) setFastingState(res.activeState);
          if (res?.stats) setFastingStats(res.stats);
        });
      }
    }, 20000);

    return () => clearInterval(syncInterval);
  }, []);

  // Subscribe to real-time fasting updates across tabs/components/storage events
  useEffect(() => {
    const unsub = subscribeFastingUpdates(({ stats, state }) => {
      if (stats) setFastingStats(stats);
      if (state) setFastingState(state);
    });
    return unsub;
  }, []);

  // If fasting state has a protocol saved, reflect it in UI
  useEffect(() => {
    if (fastingState?.protocolId) {
      setSelectedProtocolId(fastingState.protocolId);
      if (fastingState.protocolId === 'custom' && fastingState.targetHours) {
        setCustomHours(fastingState.targetHours);
      }
    }
  }, [fastingState?.protocolId, fastingState?.targetHours]);

  // Live timer tick
  useEffect(() => {
    let interval = null;
    if (fastingState.isActive && fastingState.startTime) {
      const updateElapsed = () => {
        const start = new Date(fastingState.startTime).getTime();
        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - start) / 1000));
        setElapsedSeconds(diff);
      };
      updateElapsed();
      interval = setInterval(updateElapsed, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [fastingState]);

  const activeTargetHours = fastingState.isActive
    ? fastingState.targetHours || 16
    : selectedProtocolId === 'custom'
    ? Number(customHours) || 16
    : FASTING_PROTOCOLS.find((p) => p.id === selectedProtocolId)?.fastHours || 16;

  const handleStart = async () => {
    setEndedSummary(null);
    const newState = {
      isActive: true,
      startTime: new Date().toISOString(),
      protocolId: selectedProtocolId,
      targetHours: activeTargetHours,
    };
    setFastingState(newState);
    await updateFastingState(newState);
  };

  const handleStop = async () => {
    if (fastingState.isActive && fastingState.startTime) {
      const result = await recordEndedFast({
        protocolId: fastingState.protocolId || selectedProtocolId,
        targetHours: activeTargetHours,
        startTime: fastingState.startTime,
        endTime: new Date(),
      });
      setEndedSummary(result);
    }

    const inactiveState = {
      ...fastingState,
      isActive: false,
      startTime: null,
    };
    setFastingState(inactiveState);
    setElapsedSeconds(0);
  };

  const handleReset = async () => {
    if (fastingState.isActive) {
      const resetState = {
        ...fastingState,
        startTime: new Date().toISOString(),
      };
      setFastingState(resetState);
      await updateFastingState(resetState);
    }
    setElapsedSeconds(0);
  };

  const handleProtocolChange = async (protId) => {
    setSelectedProtocolId(protId);
    const target =
      protId === 'custom'
        ? Number(customHours) || 16
        : FASTING_PROTOCOLS.find((p) => p.id === protId)?.fastHours || 16;

    if (fastingState.isActive) {
      const updatedState = {
        ...fastingState,
        protocolId: protId,
        targetHours: target,
      };
      setFastingState(updatedState);
      await updateFastingState(updatedState);
    }
  };

  const totalTargetSeconds = activeTargetHours * 3600;
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / Math.max(1, totalTargetSeconds)) * 100));

  const hoursElapsed = Math.floor(elapsedSeconds / 3600);
  const minutesElapsed = Math.floor((elapsedSeconds % 3600) / 60);
  const secondsElapsed = elapsedSeconds % 60;

  const remainingSeconds = Math.max(0, totalTargetSeconds - elapsedSeconds);
  const hoursRemaining = Math.floor(remainingSeconds / 3600);
  const minutesRemaining = Math.floor((remainingSeconds % 3600) / 60);

  const eatingHours = Math.max(0, 24 - activeTargetHours);

  // SVG Circular Ring dimensions
  const size = compact ? 120 : 160;
  const strokeWidth = compact ? 8 : 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const targetEndTime = fastingState.isActive && fastingState.startTime
    ? new Date(new Date(fastingState.startTime).getTime() + activeTargetHours * 3600 * 1000)
    : null;

  const startDateObj = fastingState.isActive && fastingState.startTime ? new Date(fastingState.startTime) : null;
  const startDateStr = startDateObj ? startDateObj.toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
  const startTimeStr = startDateObj ? startDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const endDateStr = targetEndTime ? targetEndTime.toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
  const endTimeStr = targetEndTime ? targetEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  // Dynamic preview dates for manual editor
  const previewStartDateObj = manualStartTime ? new Date(manualStartTime) : null;
  const isPreviewValid = previewStartDateObj && !isNaN(previewStartDateObj.getTime());
  const previewTargetEndTime = isPreviewValid
    ? new Date(previewStartDateObj.getTime() + activeTargetHours * 3600 * 1000)
    : null;

  const previewStartDateStr = isPreviewValid
    ? previewStartDateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })
    : '';
  const previewStartTimeStr = isPreviewValid
    ? previewStartDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  const previewEndDateStr = previewTargetEndTime
    ? previewTargetEndTime.toLocaleDateString([], { month: 'short', day: 'numeric' })
    : '';
  const previewEndTimeStr = previewTargetEndTime
    ? previewTargetEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  // Aggregate stats calculations
  const totalAttempted =
    fastingStats.completedCount + fastingStats.partialCount + fastingStats.earlyEndedCount;
  const completedRate =
    totalAttempted > 0 ? Math.round((fastingStats.completedCount / totalAttempted) * 100) : 0;

  if (compact) {
    const handleCompactClick = (e) => {
      if (e.target.closest('button')) return;
      navigate('/calories');
    };

    return (
      <div
        onClick={isBlurred ? (e) => handleToggleBlur(e) : handleCompactClick}
        className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-theme flex flex-col justify-between gap-3.5 card-shadow transition-all duration-200 hover:shadow-md hover:border-theme-strong hover:-translate-y-0.5 cursor-pointer relative"
      >
        {allowBlur && (
          <div className="absolute top-3 right-3 z-20">
            <button
              type="button"
              onClick={handleToggleBlur}
              className={`p-1 rounded-lg border transition-all duration-200 cursor-pointer ${
                isBlurred
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25 shadow-xs'
                  : 'text-secondary hover:text-primary hover:bg-subtle border-transparent hover:border-theme'
              }`}
              title={isBlurred ? 'Show Fasting Timer (Unblur)' : 'Hide Fasting Timer (Blur)'}
              aria-label={isBlurred ? 'Unblur Fasting Timer' : 'Blur Fasting Timer'}
            >
              {isBlurred ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        <div className="relative flex flex-col justify-between h-full gap-3.5 flex-1">
          <div
            className={`flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 transition-all duration-200 ${
              isBlurred ? 'filter blur-md select-none opacity-30 pointer-events-none' : ''
            }`}
          >
            <div className="relative flex items-center justify-center shrink-0">
              <svg width={size} height={size} className="transform -rotate-90">
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  className="text-subtle text-opacity-20 stroke-current"
                  fill="transparent"
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={fastingState.isActive ? 'var(--color-purple)' : 'var(--color-text-muted)'}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xs font-black text-primary">
                  {fastingState.isActive ? `${progressPercent}%` : t('fasting.off', 'Off')}
                </span>
                <span className="text-[9px] font-bold text-secondary">
                  {fastingState.isActive ? `${hoursElapsed}h ${minutesElapsed}m` : selectedProtocolId}
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant={fastingState.isActive ? 'purple' : 'neutral'} size="xs">
                  {fastingState.isActive ? (
                    <span className="flex items-center gap-1">
                      <Moon className="w-3 h-3 text-purple-400" /> {t('fasting.fastingPhase', 'Fasting')} ({activeTargetHours}h)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Utensils className="w-3 h-3 text-emerald-400" /> {t('fasting.window', 'Window')} ({eatingHours}h)
                    </span>
                  )}
                </Badge>
                {fastingStats.streak > 0 && (
                  <Badge variant="amber" size="xs">
                    <span className="flex items-center gap-1 font-bold">
                      <Flame className="w-3 h-3 text-amber-500 fill-amber-500" /> {fastingStats.streak} {t('streakWidget.daysStreak', 'd Streak')}
                    </span>
                  </Badge>
                )}
                <Badge variant="success" size="xs">
                  {fastingStats.completedCount} {t('fasting.completedIF', 'Completed IF')}
                </Badge>
                {fastingStats.partialCount > 0 && (
                  <Badge variant="warning" size="xs">
                    {fastingStats.partialCount} {t('fasting.partialFast', 'Partial Fast')}
                  </Badge>
                )}
              </div>
              <p className="text-xs font-bold text-primary leading-tight">
                {fastingState.isActive
                  ? `${hoursRemaining}h ${minutesRemaining}m ${t('fasting.toEatingWindow', 'to Eating Window')}`
                  : `${activeTargetHours}h ${t('fasting.fastingPhase', 'Fasting')} / ${eatingHours}h ${t('fasting.eatingWindow', 'Eating')}`}
              </p>
              <div className="text-[11px] text-secondary flex items-center gap-1.5 flex-wrap">
                {fastingState.isActive ? (
                  <>
                    <span>
                      {t('fasting.started', 'Started')}: <span className="font-semibold text-primary">{startDateStr}, {startTimeStr}</span>
                    </span>
                    <span className="text-secondary/60">·</span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold">
                      {t('fasting.endsAt', 'Ends')}: {endDateStr}, {endTimeStr}
                    </span>
                  </>
                ) : (
                  <span>{t('fasting.protocolLabel', 'Protocol')}: {selectedProtocolId}</span>
                )}
                {fastingStats.streak > 0 && (
                  <span className="text-amber-500 dark:text-amber-400 font-extrabold ml-1 inline-flex items-center gap-1">
                    · 🔥 {fastingStats.streak} {t('streakWidget.daysStreak', 'd Streak')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div
            className={`transition-all duration-200 ${
              isBlurred ? 'filter blur-md select-none opacity-30 pointer-events-none' : ''
            }`}
          >
            <Button
              variant={fastingState.isActive ? 'danger' : 'primary'}
              size="sm"
              className="w-full justify-center shrink-0"
              icon={fastingState.isActive ? Square : Play}
              onClick={fastingState.isActive ? handleStop : handleStart}
            >
              {fastingState.isActive ? t('fasting.endFast', 'End Fast') : t('fasting.startFast', 'Start Fast')}
            </Button>
          </div>

          {isBlurred && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleToggleBlur(e);
              }}
              className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer bg-surface/20 backdrop-blur-[2px] rounded-xl hover:bg-surface/30 transition-all group/blur"
              title="Click to reveal"
            >
              <span className="px-3 py-1.5 rounded-xl bg-surface/90 border border-theme text-xs font-bold text-secondary shadow-md flex items-center gap-1.5 group-hover/blur:text-primary group-hover/blur:scale-105 transition-all">
                <Eye className="w-3.5 h-3.5 text-accent" /> Click to reveal
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card
      hover
      title={t('fasting.title')}
      subtitle={t('fasting.subtitle')}
      icon={Clock}
      badge={
        <div className="flex items-center gap-2">
          {fastingStats.streak > 0 && (
            <Badge variant="amber" size="xs">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-500 fill-amber-500" /> {fastingStats.streak} {t('streakWidget.daysStreak')}
              </span>
            </Badge>
          )}
          <Badge variant={fastingState.isActive ? 'purple' : 'neutral'} size="xs">
            {fastingState.isActive ? `${t('fasting.fastingInProgress')} (${activeTargetHours}h)` : t('common.status')}
          </Badge>
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 rounded-lg text-secondary hover:text-primary hover:bg-subtle transition-colors cursor-pointer"
            title={t('fasting.configProtocolCounts')}
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      }
    >
      {/* 2-Column Responsive Layout: Left = Timer & Controls, Right = Fasting Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 pt-2 pb-1 items-stretch">
        
        {/* COLUMN 1: Timer & Interactive Controls (7 cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col justify-between p-4 sm:p-5 bg-subtle/50 rounded-2xl border border-theme/60 space-y-4">
          
          {/* Protocol Selector Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                {t('fasting.selectProtocol')}
              </span>
              <span className="text-[11px] font-semibold text-primary">
                {FASTING_PROTOCOLS.find((p) => p.id === selectedProtocolId)?.label || t('fasting.protocolCustom')}
              </span>
            </div>
            <div className="w-full flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {FASTING_PROTOCOLS.map((prot) => (
                <button
                  key={prot.id}
                  type="button"
                  onClick={() => handleProtocolChange(prot.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedProtocolId === prot.id
                      ? 'bg-[#007EA7] text-white shadow-sm shadow-[#007EA7]/30'
                      : 'bg-subtle hover:bg-surface text-secondary hover:text-primary border border-theme'
                  }`}
                >
                  {prot.id}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Hours Configuration */}
          {selectedProtocolId === 'custom' && (
            <div className="w-full p-2.5 bg-surface rounded-xl border border-theme flex items-center justify-between gap-3 text-xs animate-fade-in">
              <span className="font-bold text-secondary">{t('fasting.customTargetHours')}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={customHours}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(72, Number(e.target.value) || 16));
                    setCustomHours(val);
                    if (fastingState.isActive) {
                      setFastingState((prev) => ({ ...prev, targetHours: val }));
                    }
                  }}
                  className="input-base w-20 py-1 text-center font-bold"
                />
                <span className="text-secondary font-medium">h</span>
              </div>
            </div>
          )}

          {/* Visual Circular Progress Ring */}
          <div className="relative flex items-center justify-center my-1">
            <svg width={size} height={size} className="transform -rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="var(--color-border)"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="var(--color-purple)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-500 ease-out"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center">
              {fastingState.isActive ? (
                <>
                  <span className="text-2xl font-black text-primary tracking-tight">
                    {String(hoursElapsed).padStart(2, '0')}:{String(minutesElapsed).padStart(2, '0')}:{String(secondsElapsed).padStart(2, '0')}
                  </span>
                  <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                    {progressPercent}% {t('fasting.complete')}
                  </span>
                  <span className="text-[10px] text-secondary">
                    {t('fasting.target')}: {activeTargetHours}h {targetEndTime ? `· Ends ${endTimeStr}` : ''}
                  </span>
                </>
              ) : (
                <>
                  <Utensils className="w-6 h-6 text-muted mb-1 stroke-1" />
                  <span className="text-sm font-extrabold text-primary">{selectedProtocolId} {t('fasting.protocolLabel')}</span>
                  <span className="text-[10px] font-semibold text-secondary">{t('fasting.protocolReady')}</span>
                </>
              )}
            </div>
          </div>

          {/* Phase Details & Start/End Dates/Times (Interactive & Editable) */}
          {isEditingTime ? (
            /* Manual Start Date & Time Editor Drawer */
            <div className="w-full p-3 sm:p-3.5 bg-surface rounded-xl border border-purple-500/40 shadow-sm animate-fade-in space-y-3 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-theme">
                <span className="font-extrabold text-primary flex items-center gap-1.5 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-purple-500" />
                  {fastingState.isActive
                    ? t('fasting.editStartTimeTitle', 'Adjust Fast Start Date & Time')
                    : t('fasting.setStartTimeTitle', 'Set Custom Fast Start Date & Time')}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingTime(false)}
                  className="text-secondary hover:text-primary cursor-pointer p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Datetime input field */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-secondary block">
                  {t('fasting.startDateTimeLabel', 'Started Date & Time:')}
                </label>
                <input
                  type="datetime-local"
                  value={manualStartTime}
                  onChange={(e) => setManualStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-subtle border border-theme focus:border-purple-500 text-primary text-xs sm:text-sm font-bold outline-none transition-all"
                />
              </div>

              {/* Quick preset chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] font-bold text-secondary">{t('fasting.quickOffsets', 'Quick:')}</span>
                <button
                  type="button"
                  onClick={() => applyTimeOffset(0)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-subtle hover:bg-surface border border-theme text-secondary hover:text-primary cursor-pointer transition-colors"
                >
                  Now
                </button>
                <button
                  type="button"
                  onClick={() => applyTimeOffset(-1)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-subtle hover:bg-surface border border-theme text-secondary hover:text-primary cursor-pointer transition-colors"
                >
                  -1h
                </button>
                <button
                  type="button"
                  onClick={() => applyTimeOffset(-2)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-subtle hover:bg-surface border border-theme text-secondary hover:text-primary cursor-pointer transition-colors"
                >
                  -2h
                </button>
                <button
                  type="button"
                  onClick={() => applyTimeOffset(-4)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-subtle hover:bg-surface border border-theme text-secondary hover:text-primary cursor-pointer transition-colors"
                >
                  -4h
                </button>
                <button
                  type="button"
                  onClick={() => applyTimeOffset(-8)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-subtle hover:bg-surface border border-theme text-secondary hover:text-primary cursor-pointer transition-colors"
                >
                  -8h
                </button>
                <button
                  type="button"
                  onClick={setYesterdayEvening}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-subtle hover:bg-surface border border-theme text-secondary hover:text-primary cursor-pointer transition-colors"
                >
                  Yesterday 8PM
                </button>
              </div>

              {/* Dynamic Live Recalculation Preview */}
              {isPreviewValid && (
                <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/25 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-secondary font-bold block">
                      {t('fasting.started', 'Started')}
                    </span>
                    <span className="font-extrabold text-primary text-xs">
                      {previewStartDateStr}, {previewStartTimeStr}
                    </span>
                  </div>
                  <div className="h-6 w-[1px] bg-purple-500/30 shrink-0" />
                  <div className="min-w-0 text-right">
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block flex items-center justify-end gap-1">
                      <Sparkles className="w-3 h-3" /> {t('fasting.endsAt', 'Fast Ends (Target)')}
                    </span>
                    <span className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">
                      {previewEndDateStr}, {previewEndTimeStr}
                    </span>
                  </div>
                </div>
              )}

              {/* Save / Cancel buttons */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1 justify-center text-xs font-bold"
                  icon={Check}
                  onClick={handleSaveManualTime}
                >
                  {fastingState.isActive
                    ? t('fasting.updateStartTime', 'Update Start Time')
                    : t('fasting.startWithTime', 'Start Fast with Selected Time')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setIsEditingTime(false)}
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
              </div>
            </div>
          ) : fastingState.isActive ? (
            <div className="w-full space-y-2">
              {/* Start & End Date/Time Card with manual edit trigger */}
              <div className="p-2.5 sm:p-3 bg-surface rounded-xl border border-theme flex items-center justify-between gap-2 text-xs shadow-xs transition-all">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
                      {t('fasting.started', 'Started')}
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenTimeEditor}
                      className="px-1.5 py-0.5 rounded-md bg-subtle hover:bg-surface border border-theme text-[10px] font-semibold text-secondary hover:text-primary transition-all inline-flex items-center gap-1 cursor-pointer"
                      title="Edit Start Time and Date"
                    >
                      <Edit2 className="w-2.5 h-2.5 text-accent" /> {t('common.edit', 'Edit')}
                    </button>
                  </div>
                  <span className="text-xs font-black text-primary block truncate mt-0.5">
                    {startDateStr}, {startTimeStr}
                  </span>
                </div>
                <div className="h-6 w-[1px] bg-theme shrink-0" />
                <div className="min-w-0 text-right">
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                    {t('fasting.endsAt', 'Fast Ends (Target)')}
                  </span>
                  <span className="text-xs font-black text-purple-600 dark:text-purple-400 block truncate mt-0.5">
                    {endDateStr}, {endTimeStr}
                  </span>
                </div>
              </div>

              {/* 2 Mini Phase Stats */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-surface rounded-xl border border-theme">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
                    {t('fasting.currentPhase', 'Current Phase')}
                  </span>
                  <span className="text-xs font-black text-primary mt-0.5 block truncate">
                    🌙 {t('fasting.fastingPhase', 'Fasting')} ({activeTargetHours}h)
                  </span>
                </div>
                <div className="p-2 bg-surface rounded-xl border border-theme">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
                    {t('fasting.eatingWindowIn', 'Eating Window In')}
                  </span>
                  <span className="text-xs font-black text-purple-600 dark:text-purple-400 mt-0.5 block truncate">
                    {hoursRemaining}h {minutesRemaining}m left
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-2">
              <div className="grid grid-cols-2 gap-2.5 text-center">
                <div className="p-2.5 bg-surface rounded-xl border border-theme">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
                    {t('fasting.currentPhase', 'Current Phase')}
                  </span>
                  <span className="text-xs font-black text-primary mt-0.5 block truncate">
                    ☀️ {t('fasting.eatingPhase', 'Eating Window')} ({eatingHours}h)
                  </span>
                </div>
                <div className="p-2.5 bg-surface rounded-xl border border-theme">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
                    {t('fasting.fastTarget', 'Target Protocol')}
                  </span>
                  <span className="text-xs font-black text-primary mt-0.5 block truncate">
                    {activeTargetHours}h Fasting
                  </span>
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleOpenTimeEditor}
                  className="text-xs font-semibold text-secondary hover:text-primary inline-flex items-center gap-1.5 transition-colors cursor-pointer py-0.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-accent" />
                  <span>{t('fasting.startedEarlier', 'Started earlier? Set custom start time & date')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Button Controls */}
          <div className="w-full flex items-center gap-2 pt-1">
            {fastingState.isActive ? (
              <>
                <Button
                  variant="danger"
                  size="md"
                  className="flex-1 font-bold shadow-sm"
                  icon={Square}
                  onClick={handleStop}
                >
                  {t('fasting.endFast')}
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  icon={RotateCcw}
                  onClick={handleReset}
                  title={t('fasting.resetTimer')}
                />
              </>
            ) : (
              <Button
                variant="gradient"
                size="md"
                className="w-full font-bold shadow-sm"
                icon={Play}
                onClick={handleStart}
              >
                {t('fasting.startFastNow')}
              </Button>
            )}
          </div>
        </div>

        {/* COLUMN 2: Statistics, Counts & History Breakdown (5 cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3.5">
          
          {/* Outcome Notification Alert when a Fast Ends */}
          {endedSummary && (
            <div
              className={`w-full p-3 rounded-xl border flex items-start justify-between gap-2.5 text-xs animate-fade-in ${
                endedSummary.status === 'completed'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : endedSummary.status === 'partial'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
              }`}
            >
              <div className="flex items-start gap-2">
                {endedSummary.status === 'completed' ? (
                  <Trophy className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
                ) : endedSummary.status === 'partial' ? (
                  <Clock className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 mt-0.5 text-rose-500 shrink-0" />
                )}
                <div>
                  <span className="font-extrabold block text-xs">
                    {endedSummary.status === 'completed'
                      ? t('fasting.completedIFAchieved')
                      : endedSummary.status === 'partial'
                      ? t('fasting.partialFastLogged')
                      : t('fasting.earlyEndedLogged')}
                  </span>
                  <p className="mt-0.5 text-[11px] opacity-90 leading-tight">
                    {t('fasting.fasted')} <span className="font-bold">{endedSummary.actualHours}h</span> ({endedSummary.percentCompleted}% {activeTargetHours}h).
                    {endedSummary.status === 'completed' && ` ${t('fasting.countStreakIncremented')}`}
                    {endedSummary.status === 'partial' && ` ${t('fasting.loggedAsPartial')}`}
                    {endedSummary.status === 'early_ended' && ` ${t('fasting.loggedAsEarlyEnded')}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEndedSummary(null)}
                className="text-secondary hover:text-primary cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 4-Stat 2x2 Grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* 1. Completed IF (80%+ target) */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                  {t('fasting.completedIF')}
                </span>
                <Trophy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-primary my-1">
                {fastingStats.completedCount}
              </div>
              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold">
                {t('fasting.target80')}
              </span>
            </div>

            {/* 2. Partial Fast (20% – 80% target) */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-950 dark:text-amber-300">
                  {t('fasting.partialFast')}
                </span>
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-2xl font-black text-primary my-1">
                {fastingStats.partialCount}
              </div>
              <span className="text-[10px] text-amber-900 dark:text-amber-300 font-bold">
                {t('fasting.target20to80')}
              </span>
            </div>

            {/* 3. Early Ended (< 20% target) */}
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-950 dark:text-rose-300">
                  {t('fasting.earlyEnded')}
                </span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="text-2xl font-black text-primary my-1">
                {fastingStats.earlyEndedCount}
              </div>
              <span className="text-[10px] text-rose-900 dark:text-rose-300 font-bold">
                {t('fasting.targetLess20')}
              </span>
            </div>

            {/* 4. IF Streak */}
            <div className="p-3 rounded-xl bg-[#007EA7]/10 border border-[#007EA7]/25 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#003459] dark:text-[#76DDFF]">
                  {t('fasting.ifStreak')}
                </span>
                <Flame className="w-3.5 h-3.5 text-[#007EA7] dark:text-[#76DDFF]" />
              </div>
              <div className="text-2xl font-black text-primary my-1">
                {fastingStats.streak} <span className="text-xs font-semibold text-secondary">{t('fasting.days')}</span>
              </div>
              <span className="text-[10px] text-[#007EA7] dark:text-[#76DDFF] font-bold">
                {fastingStats.totalHoursFasted}h {t('fasting.totalHoursFasted')}
              </span>
            </div>
          </div>

          {/* Adherence & Success Rate Bar */}
          <div className="p-3 bg-subtle/70 rounded-xl border border-theme space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-secondary flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-primary" /> {t('fasting.fastingAdherence')}
              </span>
              <span className="font-extrabold text-primary">
                {completedRate}% {t('fasting.completedRate')}
              </span>
            </div>
            
            {/* Visual Multi-Segment Bar */}
            <div className="w-full h-2.5 bg-subtle rounded-full overflow-hidden border border-theme flex">
              {totalAttempted > 0 ? (
                <>
                  <div
                    style={{ width: `${(fastingStats.completedCount / totalAttempted) * 100}%` }}
                    className="bg-emerald-500 h-full transition-all duration-300"
                    title={`Completed: ${fastingStats.completedCount}`}
                  />
                  <div
                    style={{ width: `${(fastingStats.partialCount / totalAttempted) * 100}%` }}
                    className="bg-amber-500 h-full transition-all duration-300"
                    title={`Partial: ${fastingStats.partialCount}`}
                  />
                  <div
                    style={{ width: `${(fastingStats.earlyEndedCount / totalAttempted) * 100}%` }}
                    className="bg-rose-500 h-full transition-all duration-300"
                    title={`Early Ended: ${fastingStats.earlyEndedCount}`}
                  />
                </>
              ) : (
                <div className="w-full bg-subtle h-full" />
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-secondary font-medium pt-0.5">
              <span>{t('fasting.totalSessions')}: <strong className="text-primary">{totalAttempted}</strong></span>
              <span>{t('fasting.totalHours')}: <strong className="text-primary">{fastingStats.totalHoursFasted}h</strong></span>
            </div>
          </div>

          {/* Manual Adjustments Drawer (when gear icon is clicked) */}
          {showSettings && (
            <div className="p-3 bg-subtle rounded-xl border border-theme animate-fade-in space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-theme">
                <span className="font-bold text-primary flex items-center gap-1">
                  <Settings2 className="w-3.5 h-3.5 text-secondary" /> {t('fasting.manualAdjustments')}
                </span>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="text-secondary hover:text-primary cursor-pointer p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {/* Adjust Completed */}
                <div className="flex items-center justify-between">
                  <span className="text-secondary font-medium">{t('fasting.completedIF')} (80%+):</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => adjustFastingCount('completed', -1)}
                      disabled={fastingStats.completedCount <= 0}
                      className="p-1 rounded bg-surface hover:bg-subtle border border-theme text-secondary hover:text-primary disabled:opacity-30 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-bold text-primary">{fastingStats.completedCount}</span>
                    <button
                      type="button"
                      onClick={() => adjustFastingCount('completed', 1)}
                      className="p-1 rounded bg-surface hover:bg-subtle border border-theme text-secondary hover:text-primary cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Adjust Partial */}
                <div className="flex items-center justify-between">
                  <span className="text-secondary font-medium">{t('fasting.partialFast')} (20%–80%):</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => adjustFastingCount('partial', -1)}
                      disabled={fastingStats.partialCount <= 0}
                      className="p-1 rounded bg-surface hover:bg-subtle border border-theme text-secondary hover:text-primary disabled:opacity-30 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-bold text-primary">{fastingStats.partialCount}</span>
                    <button
                      type="button"
                      onClick={() => adjustFastingCount('partial', 1)}
                      className="p-1 rounded bg-surface hover:bg-subtle border border-theme text-secondary hover:text-primary cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Adjust Early Ended */}
                <div className="flex items-center justify-between">
                  <span className="text-secondary font-medium">{t('fasting.earlyEnded')} (&lt;20%):</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => adjustFastingCount('early_ended', -1)}
                      disabled={fastingStats.earlyEndedCount <= 0}
                      className="p-1 rounded bg-surface hover:bg-subtle border border-theme text-secondary hover:text-primary disabled:opacity-30 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-bold text-primary">{fastingStats.earlyEndedCount}</span>
                    <button
                      type="button"
                      onClick={() => adjustFastingCount('early_ended', 1)}
                      className="p-1 rounded bg-surface hover:bg-subtle border border-theme text-secondary hover:text-primary cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </Card>
  );
};

export default FastingTimer;
