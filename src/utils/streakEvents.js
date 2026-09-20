// Custom Event Helper for live cross-component streak synchronization
export const STREAK_UPDATED_EVENT = 'lifeos_streak_updated';

export const notifyStreakUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STREAK_UPDATED_EVENT));
  }
};

export const subscribeStreakUpdates = (callback) => {
  if (typeof window === 'undefined') return () => {};

  const handler = () => callback();
  window.addEventListener(STREAK_UPDATED_EVENT, handler);
  window.addEventListener('focus', handler);

  return () => {
    window.removeEventListener(STREAK_UPDATED_EVENT, handler);
    window.removeEventListener('focus', handler);
  };
};

export default notifyStreakUpdate;
