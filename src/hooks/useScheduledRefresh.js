// Returns ms until the next 06:00 UTC sports-day rollover
export function msUntilNextSportsDay() {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(6, 0, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next.getTime() - now.getTime();
}

// Returns ms until 2h20min after kickoff (when a 90-min match + buffer is done).
// Returns null if kickoff is in the past beyond that window.
export function msUntilResultTime(kickoffIso) {
  if (!kickoffIso) return null;
  const resultAt = new Date(kickoffIso).getTime() + 140 * 60 * 1000;
  const remaining = resultAt - Date.now();
  return remaining > 0 ? remaining : null;
}

// Given a list of kickoff ISO strings, returns the earliest result time that's
// still in the future (so we only schedule one timeout for the whole board).
export function msUntilEarliestResult(kickoffList) {
  const times = kickoffList
    .map(msUntilResultTime)
    .filter(ms => ms !== null);
  return times.length > 0 ? Math.min(...times) : null;
}

// Schedule up to two refresh callbacks: one at sports-day rollover, one at result time.
// Returns a cleanup function that cancels both timers.
export function scheduleRefreshes(onRefresh, resultDelayMs) {
  const timers = [];

  const dayMs = msUntilNextSportsDay();
  timers.push(setTimeout(onRefresh, dayMs));

  if (resultDelayMs != null) {
    timers.push(setTimeout(onRefresh, resultDelayMs));
  }

  return () => timers.forEach(clearTimeout);
}
