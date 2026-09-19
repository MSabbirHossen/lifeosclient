import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
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
} from 'lucide-react';
import {
  getFastingStats,
  recordEndedFast,
  adjustFastingCount,
  subscribeFastingUpdates,
} from '../utils/fastingService';

const FASTING_PROTOCOLS = [
  { id: '16:8', label: '16:8 Standard', fastHours: 16, eatHours: 8, desc: 'Most popular circadian window' },
  { id: '18:6', label: '18:6 Extended', fastHours: 18, eatHours: 6, desc: 'Deep autophagy & metabolic focus' },
  { id: '20:4', label: '20:4 Warrior', fastHours: 20, eatHours: 4, desc: 'Advanced intermittent window' },
  { id: '14:10', label: '14:10 Gentle', fastHours: 14, eatHours: 10, desc: 'Beginner-friendly balance' },
  { id: '12:12', label: '12:12 Circadian', fastHours: 12, eatHours: 12, desc: 'Natural day/night balance' },
  { id: '24:0', label: '24:0 OMAD', fastHours: 24, eatHours: 0, desc: 'One meal a day full cycle' },
  { id: 'custom', label: 'Custom Window', fastHours: 16, eatHours: 8, desc: 'Tailored hours' },
];

export const FastingTimer = ({ compact = false }) => {
  const [selectedProtocolId, setSelectedProtocolId] = useState('16:8');
  const [customHours, setCustomHours] = useState(16);
  const [showSettings, setShowSettings] = useState(false);
  const [fastingStats, setFastingStats] = useState(() => getFastingStats());
  const [endedSummary, setEndedSummary] = useState(null);

  const [fastingState, setFastingState] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_fasting_state');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      isActive: false,
      startTime: null,
      protocolId: '16:8',
      targetHours: 16,
    };
  });

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('lifeos_fasting_state', JSON.stringify(fastingState));
  }, [fastingState]);

  // Subscribe to real-time fasting updates across tabs/components
  useEffect(() => {
    const unsub = subscribeFastingUpdates((newStats) => {
      setFastingStats(newStats);
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

  const handleStart = () => {
    setEndedSummary(null);
    setFastingState({
      isActive: true,
      startTime: new Date().toISOString(),
      protocolId: selectedProtocolId,
      targetHours: activeTargetHours,
    });
  };

  const handleStop = () => {
    if (fastingState.isActive && fastingState.startTime) {
      // 3-tier classification:
      // 1. Completed IF: 80%+ target
      // 2. Partial Fast: 20% to 80% target
      // 3. Early Ended: < 20% target
      const result = recordEndedFast({
        protocolId: fastingState.protocolId || selectedProtocolId,
        targetHours: activeTargetHours,
        startTime: fastingState.startTime,
        endTime: new Date(),
      });
      setEndedSummary(result);
    }

    setFastingState((prev) => ({
      ...prev,
      isActive: false,
      startTime: null,
    }));
    setElapsedSeconds(0);
  };

  const handleReset = () => {
    if (fastingState.isActive) {
      setFastingState((prev) => ({
        ...prev,
        startTime: new Date().toISOString(),
      }));
    }
    setElapsedSeconds(0);
  };

  const handleProtocolChange = (protId) => {
    setSelectedProtocolId(protId);
    const target =
      protId === 'custom'
        ? Number(customHours) || 16
        : FASTING_PROTOCOLS.find((p) => p.id === protId)?.fastHours || 16;

    if (fastingState.isActive) {
      setFastingState((prev) => ({
        ...prev,
        protocolId: protId,
        targetHours: target,
      }));
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

  // Aggregate stats calculations
  const totalAttempted =
    fastingStats.completedCount + fastingStats.partialCount + fastingStats.earlyEndedCount;
  const completedRate =
    totalAttempted > 0 ? Math.round((fastingStats.completedCount / totalAttempted) * 100) : 0;

  if (compact) {
    return (
      <div className="p-3 sm:p-4 rounded-2xl bg-subtle border border-theme flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
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
                {fastingState.isActive ? `${progressPercent}%` : 'Off'}
              </span>
              <span className="text-[9px] font-bold text-secondary">
                {fastingState.isActive ? `${hoursElapsed}h ${minutesElapsed}m` : selectedProtocolId}
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <Badge variant={fastingState.isActive ? 'purple' : 'neutral'} size="xs">
                {fastingState.isActive ? (
                  <span className="flex items-center gap-1">
                    <Moon className="w-3 h-3 text-purple-400" /> Fasting ({activeTargetHours}h)
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Utensils className="w-3 h-3 text-emerald-400" /> Window ({eatingHours}h)
                  </span>
                )}
              </Badge>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {fastingStats.completedCount} Completed IF
              </span>
              {fastingStats.partialCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {fastingStats.partialCount} Partial
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-primary truncate">
              {fastingState.isActive
                ? `${hoursRemaining}h ${minutesRemaining}m to Eating Window`
                : `${activeTargetHours}h Fast / ${eatingHours}h Eating Window`}
            </p>
            <p className="text-[11px] text-secondary mt-0.5 truncate flex items-center gap-1">
              <span>{fastingState.isActive ? `Started ${new Date(fastingState.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : `Protocol: ${selectedProtocolId}`}</span>
              {fastingStats.streak > 0 && (
                <span className="text-purple-600 dark:text-purple-400 font-bold ml-1">· 🔥 {fastingStats.streak}d streak</span>
              )}
            </p>
          </div>
        </div>

        <Button
          variant={fastingState.isActive ? 'danger' : 'primary'}
          size="sm"
          className="w-full sm:w-auto shrink-0"
          icon={fastingState.isActive ? Square : Play}
          onClick={fastingState.isActive ? handleStop : handleStart}
        >
          {fastingState.isActive ? 'End Fast' : 'Start Fast'}
        </Button>
      </div>
    );
  }

  return (
    <Card
      hover
      title="Intermittent Fasting"
      subtitle="Circadian rhythm & dynamic metabolic fasting windows"
      icon={Clock}
      badge={
        <div className="flex items-center gap-2">
          {fastingStats.streak > 0 && (
            <Badge variant="amber" size="xs">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-500 fill-amber-500" /> {fastingStats.streak}d Streak
              </span>
            </Badge>
          )}
          <Badge variant={fastingState.isActive ? 'purple' : 'neutral'} size="xs">
            {fastingState.isActive ? `Active Fast (${activeTargetHours}h)` : 'Resting'}
          </Badge>
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 rounded-lg text-secondary hover:text-primary hover:bg-subtle transition-colors cursor-pointer"
            title="Configure Fasting Protocol & Counts"
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
                Select Protocol
              </span>
              <span className="text-[11px] font-semibold text-primary">
                {FASTING_PROTOCOLS.find((p) => p.id === selectedProtocolId)?.label || 'Custom'}
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
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/25'
                      : 'bg-subtle hover:bg-surface text-secondary hover:text-primary border border-theme/60'
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
              <span className="font-bold text-secondary">Custom Target Hours:</span>
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
                <span className="text-secondary font-medium">hours</span>
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
                    {progressPercent}% Complete
                  </span>
                  <span className="text-[10px] text-secondary">
                    Target: {activeTargetHours}h
                  </span>
                </>
              ) : (
                <>
                  <Utensils className="w-6 h-6 text-muted mb-1 stroke-1" />
                  <span className="text-sm font-extrabold text-primary">{selectedProtocolId} Protocol</span>
                  <span className="text-[10px] font-semibold text-secondary">Ready to Fast</span>
                </>
              )}
            </div>
          </div>

          {/* Phase Details Summary */}
          <div className="w-full grid grid-cols-2 gap-2.5 text-center">
            <div className="p-2.5 bg-surface rounded-xl border border-theme">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
                Current Phase
              </span>
              <span className="text-xs font-black text-primary mt-0.5 block truncate">
                {fastingState.isActive ? `🌙 Fasting (${activeTargetHours}h)` : `☀️ Eating (${eatingHours}h)`}
              </span>
            </div>
            <div className="p-2.5 bg-surface rounded-xl border border-theme">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
                {fastingState.isActive ? 'Eating Window In' : 'Fast Target'}
              </span>
              <span className="text-xs font-black text-purple-600 dark:text-purple-400 mt-0.5 block truncate">
                {fastingState.isActive ? `${hoursRemaining}h ${minutesRemaining}m` : `${activeTargetHours} Hours`}
              </span>
            </div>
          </div>

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
                  End Fast
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  icon={RotateCcw}
                  onClick={handleReset}
                  title="Reset Timer"
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
                Start {selectedProtocolId} Fast Now
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
                      ? '🎉 Completed IF Achieved! (80%+ Target)'
                      : endedSummary.status === 'partial'
                      ? '⏳ Partial Fast Logged (20%–80% Target)'
                      : '⚠️ Early Ended (< 20% Target)'}
                  </span>
                  <p className="mt-0.5 text-[11px] opacity-90 leading-tight">
                    Fasted <span className="font-bold">{endedSummary.actualHours}h</span> ({endedSummary.percentCompleted}% of {activeTargetHours}h target).
                    {endedSummary.status === 'completed' && ' Count & streak incremented!'}
                    {endedSummary.status === 'partial' && ' Logged as Partial Fast.'}
                    {endedSummary.status === 'early_ended' && ' Logged as Early Ended.'}
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
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Completed IF
                </span>
                <Trophy className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-primary my-1">
                {fastingStats.completedCount}
              </div>
              <span className="text-[10px] text-emerald-600/90 dark:text-emerald-400/90 font-semibold">
                80%+ target
              </span>
            </div>

            {/* 2. Partial Fast (20% – 80% target) */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  Partial Fast
                </span>
                <Clock className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-primary my-1">
                {fastingStats.partialCount}
              </div>
              <span className="text-[10px] text-amber-600/90 dark:text-amber-400/90 font-semibold">
                20% – 80% target
              </span>
            </div>

            {/* 3. Early Ended (< 20% target) */}
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                  Early Ended
                </span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-primary my-1">
                {fastingStats.earlyEndedCount}
              </div>
              <span className="text-[10px] text-rose-600/90 dark:text-rose-400/90 font-semibold">
                &lt; 20% target
              </span>
            </div>

            {/* 4. IF Streak */}
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  IF Streak
                </span>
                <Flame className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-primary my-1">
                {fastingStats.streak} <span className="text-xs font-semibold text-secondary">days</span>
              </div>
              <span className="text-[10px] text-purple-600/90 dark:text-purple-400/90 font-semibold">
                {fastingStats.totalHoursFasted}h total fasted
              </span>
            </div>
          </div>

          {/* Adherence & Success Rate Bar */}
          <div className="p-3 bg-subtle/70 rounded-xl border border-theme space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-secondary flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-primary" /> Fasting Adherence
              </span>
              <span className="font-extrabold text-primary">
                {completedRate}% Completed Rate
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
              <span>Total Sessions: <strong className="text-primary">{totalAttempted}</strong></span>
              <span>Total Hours: <strong className="text-primary">{fastingStats.totalHoursFasted}h</strong></span>
            </div>
          </div>

          {/* Manual Adjustments Drawer (when gear icon is clicked) */}
          {showSettings && (
            <div className="p-3 bg-subtle rounded-xl border border-theme animate-fade-in space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-theme">
                <span className="font-bold text-primary flex items-center gap-1">
                  <Settings2 className="w-3.5 h-3.5 text-secondary" /> Manual Count Adjustments
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
                  <span className="text-secondary font-medium">Completed IF (80%+):</span>
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
                  <span className="text-secondary font-medium">Partial Fast (20%–80%):</span>
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
                  <span className="text-secondary font-medium">Early Ended (&lt;20%):</span>
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
