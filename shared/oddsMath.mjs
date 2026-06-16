// Shared odds math — used by both the frontend (display/conversion) and the
// backend (EV + no-vig consensus calculation). Keep this file dependency-free
// so it can be imported from a Vite (browser) build and a plain Node ESM script.

export function americanToDecimal(american) {
  const a = Number(american);
  if (!Number.isFinite(a) || a === 0) return null;
  return a > 0 ? 1 + a / 100 : 1 + 100 / Math.abs(a);
}

export function decimalToAmerican(decimal) {
  const d = Number(decimal);
  if (!Number.isFinite(d) || d <= 1) return null;
  return d >= 2 ? Math.round((d - 1) * 100) : Math.round(-100 / (d - 1));
}

export function decimalToFractional(decimal) {
  const d = Number(decimal);
  if (!Number.isFinite(d) || d <= 1) return null;
  const value = d - 1;
  const precision = 1000;
  let num = Math.round(value * precision);
  let den = precision;
  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(num, den) || 1;
  num = num / divisor;
  den = den / divisor;
  return { num, den };
}

export function fractionalToDecimal(num, den) {
  const n = Number(num);
  const d = Number(den);
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return null;
  return 1 + n / d;
}

export function decimalToImpliedProb(decimal) {
  if (!decimal || decimal <= 1) return null;
  return 1 / decimal;
}

export function formatFractional({ num, den }) {
  return `${num}/${den}`;
}

/**
 * De-vig a single bookmaker's full set of outcome prices (decimal odds) for one
 * market on one event, returning each outcome's fair (vig-removed) probability.
 * This is the standard "remove the overround" step: divide each outcome's raw
 * implied probability by the sum of all outcomes' implied probabilities.
 */
export function devigOutcomes(decimalOddsArray) {
  const implied = decimalOddsArray.map((d) => decimalToImpliedProb(d));
  if (implied.some((p) => p === null)) return null;
  const sum = implied.reduce((a, b) => a + b, 0);
  if (sum <= 0) return null;
  return implied.map((p) => p / sum);
}

/**
 * Consensus fair probability for one outcome: the MEDIAN de-vigged probability
 * across every bookmaker that priced the full market. Median (not mean) so a
 * single stale or soft-book price can't drag the "true" estimate toward a
 * longshot that's actually just mispriced by one low-liquidity book — a
 * mean would let one outlier inflate EV into nonsense (e.g. a 46.0 longshot
 * "showing" 70%+ EV because exactly one book hasn't updated its line).
 */
export function consensusProbability(perBookFairProbs) {
  const valid = perBookFairProbs.filter((p) => Number.isFinite(p)).sort((a, b) => a - b);
  if (valid.length === 0) return null;
  const mid = Math.floor(valid.length / 2);
  return valid.length % 2 === 0 ? (valid[mid - 1] + valid[mid]) / 2 : valid[mid];
}

export function calculateEV(decimalOdds, trueProb) {
  if (!decimalOdds || !Number.isFinite(trueProb)) return null;
  return (trueProb * decimalOdds - 1) * 100;
}
