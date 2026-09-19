// Intermittent Fasting (IF) Tracking Service
// Tracks Completed IF (100%+), Partial Fasts (20%-99%), and Early Ended (<20%)

const STORAGE_KEY = 'lifeos_fasting_stats';
const EVENT_NAME = 'lifeos_fasting_updated';

const getInitialStats = () => ({
  completedCount: 0,
  partialCount: 0,
  earlyEndedCount: 0,
  streak: 0,
  totalHoursFasted: 0,
  lastCompletedDate: null,
  history: [],
});

export const getFastingStats = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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

export const saveFastingStats = (stats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: stats }));
  } catch (err) {
    console.error('Failed to save fasting stats to storage', err);
  }
};

/**
 * Classify and record an ended fast session.
 * @param {Object} session
 * @param {string} session.protocolId e.g. '16:8'
 * @param {number} session.targetHours e.g. 16
 * @param {string|number|Date} session.startTime
 * @param {string|number|Date} session.endTime
 * @returns {Object} result containing status ('completed' | 'partial' | 'early_ended'), actualHours, percentCompleted, stats
 */
export const recordEndedFast = ({ protocolId = '16:8', targetHours = 16, startTime, endTime = new Date() }) => {
  const currentStats = getFastingStats();

  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();
  const elapsedSeconds = Math.max(0, Math.floor((endMs - startMs) / 1000));
  const targetSeconds = Math.max(1, (Number(targetHours) || 16) * 3600);

  const percentCompleted = Math.round((elapsedSeconds / targetSeconds) * 100);
  const actualHours = Math.round((elapsedSeconds / 3600) * 10) / 10;

  // 3-Tier Classification:
  // 1. Completed IF: 80%+ of targeted time
  // 2. Partial Fast: 20% to 80% of targeted time
  // 3. Early Ended: Less than 20% of targeted time
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

    // Recalculate daily streak for completed fasts
    if (currentStats.lastCompletedDate) {
      const lastDate = new Date(currentStats.lastCompletedDate);
      const today = new Date(todayStr);
      const diffDays = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
      // If diffDays === 0 (same day), keep existing streak
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
 * @param {'completed' | 'partial' | 'early_ended'} type
 * @param {number} delta e.g. +1 or -1
 */
export const adjustFastingCount = (type, delta = 1) => {
  const currentStats = getFastingStats();
  if (type === 'completed') {
    currentStats.completedCount = Math.max(0, currentStats.completedCount + delta);
    if (delta > 0 && currentStats.streak === 0) {
      currentStats.streak = 1;
    }
  } else if (type === 'partial') {
    currentStats.partialCount = Math.max(0, currentStats.partialCount + delta);
  } else if (type === 'early_ended') {
    currentStats.earlyEndedCount = Math.max(0, currentStats.earlyEndedCount + delta);
  }
  saveFastingStats(currentStats);
  return currentStats;
};

/**
 * Reset all fasting stats
 */
export const resetFastingStats = () => {
  const initial = getInitialStats();
  saveFastingStats(initial);
  return initial;
};

/**
 * Subscribe to real-time fasting updates.
 * @param {Function} callback
 * @returns {Function} unsubscribe function
 */
export const subscribeFastingUpdates = (callback) => {
  const handleCustomEvent = (e) => {
    callback(e.detail || getFastingStats());
  };

  const handleStorageEvent = (e) => {
    if (e.key === STORAGE_KEY) {
      callback(getFastingStats());
    }
  };

  window.addEventListener(EVENT_NAME, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  // Return unsubscribe
  return () => {
    window.removeEventListener(EVENT_NAME, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
};
