import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { Clock, Play, Square, RotateCcw, Sparkles, Utensils, Moon, Settings2 } from 'lucide-react';

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

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('lifeos_fasting_state', JSON.stringify(fastingState));
  }, [fastingState]);

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
    setFastingState({
      isActive: true,
      startTime: new Date().toISOString(),
      protocolId: selectedProtocolId,
      targetHours: activeTargetHours,
    });
  };

  const handleStop = () => {
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
      // Update ongoing target hours dynamically
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
            <div className="flex items-center gap-1.5 mb-1">
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
            </div>
            <p className="text-xs font-bold text-primary truncate">
              {fastingState.isActive
                ? `${hoursRemaining}h ${minutesRemaining}m to Eating Window`
                : `${activeTargetHours}h Fast / ${eatingHours}h Eating Window`}
            </p>
            <p className="text-[11px] text-secondary mt-0.5 truncate">
              {fastingState.isActive
                ? `Started at ${new Date(fastingState.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : `Protocol: ${selectedProtocolId}`}
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
          <Badge variant={fastingState.isActive ? 'purple' : 'neutral'} size="xs">
            {fastingState.isActive ? `Active Fast (${activeTargetHours}h)` : 'Resting'}
          </Badge>
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 rounded-lg text-secondary hover:text-primary hover:bg-subtle transition-colors cursor-pointer"
            title="Configure Fasting Protocol"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center justify-center pt-2 pb-4">
        {/* Protocol Selector Tabs */}
        <div className="w-full flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
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

        {/* Custom Hours Configuration */}
        {selectedProtocolId === 'custom' && (
          <div className="w-full p-3 mb-3 bg-subtle rounded-xl border border-theme flex items-center justify-between gap-3 text-xs">
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

        {/* Visual Progress Ring */}
        <div className="relative flex items-center justify-center my-3">
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

        {/* Phase Details */}
        <div className="w-full grid grid-cols-2 gap-3 my-2 text-center">
          <div className="p-3 bg-subtle rounded-xl border border-theme">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
              Current Phase
            </span>
            <span className="text-xs font-black text-primary mt-1 block">
              {fastingState.isActive ? `🌙 Fasting (${activeTargetHours}h)` : `☀️ Eating (${eatingHours}h)`}
            </span>
          </div>
          <div className="p-3 bg-subtle rounded-xl border border-theme">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
              {fastingState.isActive ? 'Eating Window In' : 'Fast Target'}
            </span>
            <span className="text-xs font-black text-purple-600 dark:text-purple-400 mt-1 block">
              {fastingState.isActive ? `${hoursRemaining}h ${minutesRemaining}m` : `${activeTargetHours} Hours`}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="w-full flex items-center gap-2 mt-3">
          {fastingState.isActive ? (
            <>
              <Button
                variant="danger"
                size="md"
                className="flex-1"
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
              className="w-full"
              icon={Play}
              onClick={handleStart}
            >
              Start {selectedProtocolId} Fast Now
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default FastingTimer;
