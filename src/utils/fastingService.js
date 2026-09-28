// Intermittent Fasting (IF) Tracking & Cross-Device Sync Service
// Synchronizes active timer state and cumulative statistics with the backend database
import api from './api';

const STATS_STORAGE_KEY = 'lifeos_fasting_stats';
const STATE_STORAGE_KEY = 'lifeos_fasting_state';
const STATS_EVENT_NAME = 'lifeos_fasting_updated';
const STATE_EVENT_NAME = 'lifeos_fasting_state_updated';

const getInitialStats = () => ({
  completedCount: 0,
  partialCount: 0,
  earlyEndedCount: 0,
  streak: 0,
  totalHoursFasted: 0,
  lastCompletedDate: null,
  history: [],
});

const getInitialState = () => ({
  isActive: false,
  startTime: null,
  protocolId: '16:8',
  targetHours: 16,
});

export const getFastingStats = () => {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return getInitialStats();
    const parsed = JSON.parse(raw);
    return {
      completedCount: Number(parsed.completedCount) || 0,
      partialCount: Number(parsed.partialCount) || 0,
      earlyEndedCount: Number(parsed.earlyEndedCount) || 0,
      streak: Number(parsed.streak) || 0,
      totalHoursFasted: Number(parsed.totalHoursFasted) || 0,
      lastCompletedDate: parsed.lastCompletedDate || null,
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch (err) {
    console.error('Failed to parse fasting stats from storage', err);
    return getInitialStats();
  }
};

export const getFastingState = () => {
  try {
    const raw = localStorage.getItem(STATE_STORAGE_KEY);
    if (!raw) return getInitialState();
    const parsed = JSON.parse(raw);
    return {
      isActive: Boolean(parsed.isActive),
      startTime: parsed.startTime || null,
      protocolId: parsed.protocolId || '16:8',
      targetHours: Number(parsed.targetHours) || 16,
    };
  } catch (err) {
    console.error('Failed to parse fasting state from storage', err);
    return getInitialState();
  }
};

export const saveFastingStats = (stats) => {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    window.dispatchEvent(new CustomEvent(STATS_EVENT_NAME, { detail: stats }));
  } catch (err) {
    console.error('Failed to save fasting stats to storage', err);
  }
};

export const saveFastingState = (state) => {
  try {
    localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(STATE_EVENT_NAME, { detail: state }));
  } catch (err) {
    console.error('Failed to save fasting state to storage', err);
  }
};

// Check if user is logged in
const isAuthenticated = () => {
  return Boolean(localStorage.getItem('lifeos_token'));
};

/**
 * Fetch live fasting data (active timer & stats) from server and sync with local storage
 */
export const fetchFastingData = async () => {
  if (!isAuthenticated()) {
    return {
      activeState: getFastingState(),
      stats: getFastingStats(),
    };
  }

  try {
    const res = await api.get('/fasting');
    if (res.data) {
      const { activeState, stats, history } = res.data;

      const formattedStats = {
        completedCount: Number(stats?.completedCount) || 0,
        partialCount: Number(stats?.partialCount) || 0,
        earlyEndedCount: Number(stats?.earlyEndedCount) || 0,
        streak: Number(stats?.streak) || 0,
        totalHoursFasted: Number(stats?.totalHoursFasted) || 0,
        lastCompletedDate: stats?.lastCompletedDate || null,
        history: Array.isArray(history) ? history : [],
      };

      const formattedState = {
        isActive: Boolean(activeState?.isActive),
        startTime: activeState?.startTime || null,
        protocolId: activeState?.protocolId || '16:8',
        targetHours: Number(activeState?.targetHours) || 16,
      };

      saveFastingStats(formattedStats);
      saveFastingState(formattedState);

      return { activeState: formattedState, stats: formattedStats };
    }
  } catch (err) {
    console.warn('Could not fetch server fasting data, using cached local copy:', err.message);
  }

  return {
    activeState: getFastingState(),
    stats: getFastingStats(),
  };
};

/**
 * Update active fasting timer state (Start, Pause, Reset, Change Protocol) and sync to server
 */
export const updateFastingState = async (newState) => {
  saveFastingState(newState);

  if (isAuthenticated()) {
    try {
      const res = await api.put('/fasting/state', newState);
      if (res.data?.activeState) {
        saveFastingState(res.data.activeState);
      }
      return res.data;
    } catch (err) {
      console.error('Failed to sync active fasting state to server:', err);
    }
  }
  return { activeState: newState };
};

/**
 * Classify and record an ended fast session.
 */
export const recordEndedFast = async ({ protocolId = '16:8', targetHours = 16, startTime, endTime = new Date() }) => {
  // Set local state to inactive immediately for instant responsive UI
  const inactiveState = {
    isActive: false,
    startTime: null,
    protocolId,
    targetHours,
  };
  saveFastingState(inactiveState);

  if (isAuthenticated()) {
    try {
      const res = await api.post('/fasting/record', {
        protocolId,
        targetHours,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });

      if (res.data) {
        const { status, statusLabel, actualHours, percentCompleted, stats, entry, history } = res.data;
        const updatedStats = {
          ...stats,
          history: Array.isArray(history) ? history : [entry, ...(getFastingStats().history || [])],
        };
        saveFastingStats(updatedStats);
        return { status, statusLabel, actualHours, percentCompleted, stats: updatedStats, entry };
      }
    } catch (err) {
      console.error('Failed to record fast on server, falling back to local storage calculation:', err);
    }
  }

  // Local fallback calculation for guest or offline mode
  const currentStats = getFastingStats();
  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();
  const elapsedSeconds = Math.max(0, Math.floor((endMs - startMs) / 1000));
  const targetSeconds = Math.max(1, (Number(targetHours) || 16) * 3600);

  const percentCompleted = Math.round((elapsedSeconds / targetSeconds) * 100);
  const actualHours = Math.round((elapsedSeconds / 3600) * 10) / 10;

  let status = 'early_ended';
  let statusLabel = 'Early Ended (<20%)';

  if (percentCompleted >= 80) {
    status = 'completed';
    statusLabel = 'Completed IF (80%+)';
  } else if (percentCompleted >= 20) {
    status = 'partial';
    statusLabel = 'Partial Fast (20%–80%)';
  }

  const todayStr = new Date().toISOString().split('T')[0];
  let newStreak = currentStats.streak;

  if (status === 'completed') {
    currentStats.completedCount += 1;
    if (currentStats.lastCompletedDate) {
      const lastDate = new Date(currentStats.lastCompletedDate);
      const today = new Date(todayStr);
      const diffDays = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) newStreak += 1;
      else if (diffDays > 1) newStreak = 1;
    } else {
      newStreak = 1;
    }
    currentStats.lastCompletedDate = todayStr;
    currentStats.streak = newStreak;
  } else if (status === 'partial') {
    currentStats.partialCount += 1;
  } else {
    currentStats.earlyEndedCount += 1;
  }

  currentStats.totalHoursFasted = Math.round((currentStats.totalHoursFasted + actualHours) * 10) / 10;

  const logEntry = {
    id: `fast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    date: todayStr,
    startTime: new Date(startTime).toISOString(),
    endTime: new Date(endTime).toISOString(),
    protocolId,
    targetHours: Number(targetHours) || 16,
    actualHours,
    percentCompleted,
    status,
    statusLabel,
  };

  currentStats.history = [logEntry, ...(currentStats.history || [])].slice(0, 50);
  saveFastingStats(currentStats);

  return {
    status,
    statusLabel,
    actualHours,
    percentCompleted,
    stats: currentStats,
    entry: logEntry,
  };
};

/**
 * Manually adjust any of the counters.
 */
export const adjustFastingCount = async (type, delta = 1) => {
  const currentStats = getFastingStats();
  if (type === 'completed') {
    currentStats.completedCount = Math.max(0, currentStats.completedCount + delta);
    if (delta > 0 && currentStats.streak === 0) currentStats.streak = 1;
  } else if (type === 'partial') {
    currentStats.partialCount = Math.max(0, currentStats.partialCount + delta);
  } else if (type === 'early_ended') {
    currentStats.earlyEndedCount = Math.max(0, currentStats.earlyEndedCount + delta);
  }
  saveFastingStats(currentStats);

  if (isAuthenticated()) {
    try {
      const res = await api.post('/fasting/adjust', { type, delta });
      if (res.data?.stats) {
        saveFastingStats({
          ...res.data.stats,
          history: res.data.history || currentStats.history,
        });
      }
    } catch (err) {
      console.error('Failed to sync adjust count to server:', err);
    }
  }

  return currentStats;
};

/**
 * Reset all fasting stats
 */
export const resetFastingStats = async () => {
  const initialStats = getInitialStats();
  const initialState = getInitialState();
  saveFastingStats(initialStats);
  saveFastingState(initialState);

  if (isAuthenticated()) {
    try {
      await api.post('/fasting/reset');
    } catch (err) {
      console.error('Failed to reset fasting stats on server:', err);
    }
  }

  return initialStats;
};

/**
 * Subscribe to real-time fasting updates and cross-device auto-sync.
 */
export const subscribeFastingUpdates = (callback) => {
  const handleCustomEvent = (e) => {
    callback({
      stats: getFastingStats(),
      state: getFastingState(),
      detail: e.detail,
    });
  };

  const handleStorageEvent = (e) => {
    if (e.key === STATS_STORAGE_KEY || e.key === STATE_STORAGE_KEY) {
      callback({
        stats: getFastingStats(),
        state: getFastingState(),
      });
    }
  };

  // When user switches back to this tab or app gains focus, sync fresh data from backend
  const handleFocus = () => {
    fetchFastingData().then((data) => {
      if (data) {
        callback({
          stats: data.stats || getFastingStats(),
          state: data.activeState || getFastingState(),
        });
      }
    });
  };

  window.addEventListener(STATS_EVENT_NAME, handleCustomEvent);
  window.addEventListener(STATE_EVENT_NAME, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);
  window.addEventListener('focus', handleFocus);
  document.addEventListener('visibilitychange', handleFocus);

  // Return unsubscribe
  return () => {
    window.removeEventListener(STATS_EVENT_NAME, handleCustomEvent);
    window.removeEventListener(STATE_EVENT_NAME, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleFocus);
  };
};
